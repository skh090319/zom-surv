// Relic combat adapter. Equipment is frozen at sortie; attacks retain their
// owner/type/attack ID when their projectiles land on a later frame.
let relicRun = null;
let relicAttackContext = null;
let relicAttackSequence = 0;
let relicResetting = false;
let relicSilentHealing = 0;
let relicPermanentStatWrite = 0;
const relicEnemyRecords = new WeakMap();
const relicPendingHits = new WeakMap();
const relicSourceContexts = new WeakMap();

function relicRunActive() {
  return !!relicRun && !relicResetting && typeof screenMode !== 'undefined' && screenMode === 'game';
}
function relicHasSet(id, count = 4) { return !!relicRun && (relicRun.setCounts[id] || 0) >= count; }
function relicHeroSet(id, hero) { return relicHasSet(id) && relicRun.hero === hero; }
function relicStat(id) { return relicRun ? (relicRun.stats[id] || 0) : 0; }
function relicBuff(name) { return !!relicRun && (relicRun.buffs[name] || 0) > relicRun.frame; }
function relicSetBuff(name, frames) { if (relicRun) relicRun.buffs[name] = relicRun.frame + frames; }
function relicFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(relicFreeze); Object.freeze(value);
  }
  return value;
}
function relicBeginRun() {
  const hero = selectedCharacter;
  const items = typeof relicEquippedItems === 'function' ? relicEquippedItems(hero) : [];
  const snapshot = relicFreeze(JSON.parse(JSON.stringify(items)));
  const aggregate = typeof relicStatsForItems === 'function' ? relicStatsForItems(snapshot) : { stats: {}, setCounts: {} };
  relicRun = { id: `relic-${Date.now()}-${Math.random().toString(36).slice(2)}`, hero,
    snapshot, stats: relicFreeze({ ...aggregate.stats }), setCounts: relicFreeze({ ...aggregate.setCounts }),
    frame: 0, buffs: {}, basicStacks: 0, stardustStacks: 0, casts: 0, movement: 0,
    moveArmed: true, baseDamage: player.damage, attacks: new Map(), rewards: new Set() };
  const maxHp = Math.max(1, (player.maxHp + relicStat('hpFlat')) * (1 + relicStat('hpPct')));
  player.maxHp = maxHp; player.hp = maxHp;
  const conversion = relicHasSet('A04') ? Math.min(maxHp * .02, relicRun.baseDamage * .30) : 0;
  player.damage = (relicRun.baseDamage + relicStat('atkFlat') + conversion) * (1 + relicStat('atkPct'));
  player.speed *= 1 + relicStat('moveSpeed');
  player.relicLoadout = snapshot;
  relicInstallPlayerProperties();
  for (const enemy of zombies) relicTrackEnemy(enemy);
  return relicRun;
}
function relicNewAttack(tags = {}) {
  return { id: ++relicAttackSequence, owner: relicRun ? relicRun.hero : selectedCharacter,
    kind: 'skill', area: false, dot: false, ...tags };
}
function relicCaptureAttack(tags = null) {
  const context = relicAttackContext || relicNewAttack();
  return Object.freeze({ ...context, ...(tags || {}) });
}
function relicWithSource(source, callback, tags = null) {
  const previous = relicAttackContext;
  // Coordinates such as player are not projectiles: reusing them must not
  // combine independent casts into the same logical attack.
  if (source === player) source = null;
  const saved = source && (source.relicAttack || relicSourceContexts.get(source));
  relicAttackContext = { ...((previous?.activeSkill && previous) || saved || previous || relicNewAttack()), ...(tags || {}) };
  if (source && !saved) relicSourceContexts.set(source, Object.freeze({...relicAttackContext,activeSkill:false}));
  try { return callback(); } finally { relicAttackContext = previous; }
}
function relicTagTarget(enemy, source = null, tags = null) {
  if (!enemy || !relicRunActive()) return;
  relicTrackEnemy(enemy);
  const saved = source && (source.relicAttack || relicSourceContexts.get(source));
  let context = saved || relicAttackContext;
  if (!context) {
    context = relicNewAttack(tags || {});
    if (source) relicSourceContexts.set(source, context);
  }
  relicPendingHits.set(enemy, { ...context, ...(tags || {}) });
}
function relicTrackEnemy(enemy) {
  if (!enemy || relicEnemyRecords.has(enemy) || !Number.isFinite(enemy.hp)) return;
  const descriptor = Object.getOwnPropertyDescriptor(enemy, 'hp');
  if (descriptor && !descriptor.configurable) return;
  const record = { hp: enemy.hp };
  relicEnemyRecords.set(enemy, record);
  Object.defineProperty(enemy, 'hp', { configurable: true, enumerable: true,
    get() { return record.hp; },
    set(value) {
      const pending = relicPendingHits.get(enemy); relicPendingHits.delete(enemy);
      if (relicRunActive() && Number.isFinite(value) && value < record.hp && record.hp > 0) {
        const context = pending || relicAttackContext || relicNewAttack({ kind: 'augment' });
        record.hp -= relicResolveDamage(enemy, record.hp - value, context);
      } else record.hp = value;
    }
  });
  if (enemy.isRaidBoss && !enemy.relicShieldInitialized) {
    enemy.relicShieldInitialized = true;
    enemy.relicShield = enemy.relicShieldMax = Math.max(0, enemy.maxHp * .30);
    enemy.relicBreakTime = 0; enemy.relicInterruptTime = 0;
    enemy.relicEncounterFrame = relicRun ? relicRun.frame : 0;
  }
  if (enemy.boss && !Number.isFinite(enemy.relicEncounterFrame)) enemy.relicEncounterFrame = relicRun ? relicRun.frame : 0;
}
function relicRecordAttack(context) {
  let record = relicRun.attacks.get(context.id);
  if (!record) {
    record = { enemies: new Set(), basicCounted: false, empowered: false, frame: relicRun.frame };
    if (context.kind === 'basic' && relicBuff('nextBasic')) {
      record.empowered = true; delete relicRun.buffs.nextBasic;
    }
    relicRun.attacks.set(context.id, record);
  }
  return record;
}
function relicMarkActiveSkill(context) {
  if (!relicRunActive() || !context || !context.activeSkill || context.castCounted) return;
  context.castCounted = true;
  // All copies of this attack share the same logical cast.
  const record = relicRecordAttack(context);
  if (record.castCounted) return;
  record.castCounted = true;
  if (relicHasSet('A02')) relicSetBuff('skill', 300);
  if (relicHasSet('C05')) relicSetBuff('nextBasic', 300);
  if (relicHasSet('B01', 2) && ++relicRun.casts >= 3) { relicRun.casts = 0; relicSetBuff('orbit', 360); }
}
function relicConditionalDamage(enemy, context, record) {
  let bonus = 0;
  const basic = context.kind === 'basic', skill = context.kind === 'skill';
  if (basic) {
    bonus += relicStat('basicDamage');
    if (relicBuff('basicStacks')) bonus += relicRun.basicStacks * .02;
    if (relicBuff('moving')) bonus += .20;
    if (relicHasSet('B02', 2) && relicStat('attackSpeed') >= .25 - 1e-9) bonus += .12;
    if (relicHeroSet('C02', 'yupiter') && relicBuff('weapon') && context.weapon === player.yupiterWeapon) bonus += .20;
    if (relicHasSet('C04') && player.hp <= player.maxHp * .5) bonus += .18;
    if (record.empowered) bonus += .30;
    if (relicHeroSet('C10', 'carmilla') && player.carmillaBloodMoonTime > 0) bonus += .18;
  }
  if (skill) {
    bonus += relicStat('skillDamage');
    if (relicBuff('skill')) bonus += .18;
    if (relicBuff('orbit')) bonus += .10;
    if (relicHeroSet('C06', 'paladin') && player.paladinCombo >= 75) bonus += .20;
    if (relicBuff('bloodHeal')) bonus += .10;
    if (relicHeroSet('C15', 'mare') && enemy.mareWet > 0 && enemy.mareWetTime > 0) bonus += .12;
  }
  if (context.area) bonus += relicStat('areaDamage') + (relicBuff('area') ? .20 : 0);
  if (context.dot) bonus += relicStat('dotDamage');
  if (relicBuff('healed')) bonus += .12;
  if (relicBuff('stardust')) bonus += relicRun.stardustStacks * .01;
  if (relicHeroSet('C01', 'suncall')) bonus += (context.crystal ? .20 : 0) + (context.circuit ? .15 : 0);
  if (relicHeroSet('C03', 'ren')) bonus += (context.clone ? .25 : 0) + (context.cloneRaid ? .15 : 0);
  if (relicHeroSet('C07', 'arc') && context.heatEmpowered && skill) bonus += .22;
  if (relicHeroSet('C08', 'terra') && context.vibrationEmpowered && skill) bonus += .25 + (context.aftershock ? .15 : 0);
  if (relicHeroSet('C09', 'void')) bonus += (context.massSpent && skill ? .20 : 0) + (context.voidTerrain ? .15 : 0);
  if (relicHasSet('C11') && context.hpScaling) bonus += .18;
  if (relicHeroSet('C12', 'echo')) bonus += (context.knot ? .20 : 0) + (context.riftClose ? .20 : 0);
  if (relicHeroSet('C13', 'aria')) bonus += (context.garden ? .20 : 0) + (context.bloom ? .15 : 0);
  if (relicHeroSet('C14', 'moira') && context.painRelease) bonus += .15;
  if (relicHeroSet('C15', 'mare') && context.confluence) bonus += .20;
  if (relicHeroSet('C16', 'nullZero')) bonus += (context.infectionBurst ? .20 : 0) + (context.codeReplica ? .15 : 0);
  if (relicHeroSet('C18', 'lush') && context.cardDirect) bonus += .10;
  if (enemy.boss || enemy.isRaidBoss) {
    bonus += relicStat('bossDamage');
    if (relicHasSet('B04', 2) && Number.isFinite(enemy.relicEncounterFrame) && relicRun.frame - enemy.relicEncounterFrame < 600) bonus += .10;
  }
  return bonus + relicStat('allDamage');
}
function relicResolveDamage(enemy, amount, context) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  relicMarkActiveSkill(context);
  const record = relicRecordAttack(context);
  const wasBroken = enemy.relicBreakTime > 0;
  const chance = Math.max(0, Math.min(1, relicStat('critChance')));
  const crit = chance > 0 && context.canCrit !== false && !context.dot && Math.random() < chance;
  let damage = amount * Math.max(0, 1 + relicConditionalDamage(enemy, context, record));
  const critBase = 1.5 + relicStat('critDamage');
  if (crit) damage *= critBase + (wasBroken && relicHasSet('A08') ? .40 : 0);
  let hpDamage = damage, shieldDamage = 0;
  if (enemy.relicShield > 0) {
    const shieldMultiplier = Math.max(.01, 1 + relicStat('shieldDamage'));
    const oldShield = enemy.relicShield;
    enemy.relicShield = Math.max(0, oldShield - damage * shieldMultiplier);
    shieldDamage = oldShield - enemy.relicShield;
    hpDamage = Math.max(0, damage - oldShield / shieldMultiplier);
    if (enemy.relicShield === 0 && !enemy.relicShieldBroken) {
      enemy.relicShieldBroken = true;
      enemy.relicBreakTime = 360; enemy.relicInterruptTime = 60;
      enemy.pattern = null; enemy.patternTime = 0; enemy.patternStep = 0; enemy.queuedVolley = false;
      enemy.dashVx = 0; enemy.dashVy = 0; enemy.cooldown = Math.max(enemy.cooldown || 0, 60);
    }
  } else if (wasBroken && relicHasSet('A07')) hpDamage *= 1.25;
  // The hit that earns a stack does not retroactively benefit from that stack.
  if (context.kind === 'basic' && relicHasSet('A01') && !record.basicCounted) {
    if (!relicBuff('basicStacks')) relicRun.basicStacks = 0;
    relicRun.basicStacks = Math.min(5, relicRun.basicStacks + 1);
    relicSetBuff('basicStacks', 240); record.basicCounted = true;
  }
  record.enemies.add(enemy);
  if (relicHasSet('A06') && record.enemies.size >= 5) relicSetBuff('area', 300);
  enemy.relicLastHit = { attackId: context.id, kind: context.kind, crit, hpDamage, shieldDamage };
  return hpDamage;
}
function relicAfterHeal(amount) {
  if (!(amount > 0) || !relicRunActive() || relicSilentHealing) return;
  if (relicHasSet('A05')) relicSetBuff('healed', 300);
  if (relicHeroSet('C10', 'carmilla')) relicSetBuff('bloodHeal', 240);
}
function relicIncomingMultiplier() {
  return (1 + relicStat('incomingDamage')) * (relicHasSet('B03', 2) && player.hp <= player.maxHp * .5 ? .9 : 1);
}
function relicIncomingDamage(amount) { return amount * (relicRunActive() ? relicIncomingMultiplier() : 1); }
function relicHealingMultiplier() {
  return 1 + relicStat('healing') + (relicHasSet('C04') && player.hp <= player.maxHp * .5 ? .10 : 0);
}
function relicInstallShield(object, key, cap = Infinity) {
  if (!object || Object.getOwnPropertyDescriptor(object, key)?.get) return;
  let value = Number(object[key]) || 0;
  Object.defineProperty(object, key, {enumerable:true,configurable:true,get(){return value;},set(next){
    if (relicRunActive() && relicHasSet('C11') && next > value) next = Math.min(player.maxHp * cap, value + (next - value) * 1.15);
    value = next;
  }});
}
function relicInstallPlayerProperties() {
  relicInstallShield(player, 'vargasShield'); relicInstallShield(player, 'suncallShield', .7);
  if (typeof lushState !== 'undefined') relicInstallShield(lushState, 'shield', .8);
  if (typeof oblivionState !== 'undefined') relicInstallShield(oblivionState, 'shield', .5);
  if (player.relicPropertiesInstalled) return;
  Object.defineProperty(player, 'relicPropertiesInstalled', { value: true });
  let hp = player.hp, damage = player.damage;
  Object.defineProperty(player, 'hp', { enumerable: true, configurable: true,
    get() { return hp; }, set(value) {
      const before = hp;
      if (relicRunActive() && !relicSilentHealing && Number.isFinite(value)) {
        if (value > hp && hp > 0) value = Math.min(player.maxHp, hp + (value - hp) * relicHealingMultiplier());
      }
      hp = value; if (before > 0) relicAfterHeal(hp - before);
    }
  });
  Object.defineProperty(player, 'damage', { enumerable: true, configurable: true,
    get() { return damage * (relicRunActive() && !relicPermanentStatWrite && relicBuff('profit') ? 1.2 : 1); },
    set(value) { damage = value / (relicRunActive() && !relicPermanentStatWrite && relicBuff('profit') ? 1.2 : 1); }
  });
}
function relicTick() {
  if (!relicRunActive() || paused || gameOver || choosingUpgrade || raidVictory ||
    (typeof isMobilePortraitMode === 'function' && isMobilePortraitMode())) return false;
  relicRun.frame++;
  for (const enemy of zombies) {
    relicTrackEnemy(enemy);
    if (enemy.relicBreakTime > 0) enemy.relicBreakTime--;
    if (enemy.relicInterruptTime > 0) enemy.relicInterruptTime--;
  }
  if (relicRun.frame % 600 === 0) for (const [id, record] of relicRun.attacks) {
    if (relicRun.frame - record.frame > 1800) relicRun.attacks.delete(id);
  }
  return true;
}
function relicGrantCombatReward(kind, bossIndex) {
  if (!relicRun || typeof relicGrantReward !== 'function') return;
  const key = `${kind}:${bossIndex ?? ''}`;
  if (relicRun.rewards.has(key)) return;
  const result = relicGrantReward({ runId: relicRun.id, kind, hero: relicRun.hero, bossIndex, difficulty: selectedDifficulty });
  if (result && result.ok) relicRun.rewards.add(key);
  relicRun.lastReward = result;
  return result;
}

// Array identities may be reset by restart. Read them each time rather than
// replacing Array.prototype/push or changing ownership of existing objects.
function relicAttackPools() {
  const pools = [];
  if (typeof bullets !== 'undefined') pools.push(bullets, crescentBlades, yupiterSlashes, flameProjectiles, flameUltimateOrbs, flameUltimateShots, renAttackEffects, renShadowFields, zeroEffects, paladinEffects, arcProjectiles, arcZones, arcEffects, terraStructures, terraEffects, terraRockProjectiles, voidTerrains, voidEffects, bloodDrops, laserSlashes, gravityFields, droneBullets, fireTrails);
  if (typeof suncallShots !== 'undefined') pools.push(suncallShots);
  if (typeof suncallStorm !== 'undefined' && suncallStorm) pools.push([suncallStorm]);
  if (typeof mareCurrents !== 'undefined') pools.push(mareCurrents);
  if (typeof astraMeteors !== 'undefined') pools.push(astraMeteors, astraWells);
  if (typeof astraGravity !== 'undefined' && astraGravity) pools.push([astraGravity]);
  if (typeof nullZeroProjectiles !== 'undefined') pools.push(nullZeroProjectiles, nullZeroZones);
  if (typeof lushState !== 'undefined') for (const key of ['cards','dice','qBursts','chipStorms','finishers']) if (Array.isArray(lushState[key])) pools.push(lushState[key]);
  if (typeof oblivionState !== 'undefined') for (const key of ['projectiles','casts','echoes']) if (Array.isArray(oblivionState[key])) pools.push(oblivionState[key]);
  return pools.filter(Array.isArray);
}
// Only the tail identity is needed: combat creators append, with optional
// oldest-entry eviction at a cap. Never copy/visit all existing projectiles.
function relicRememberPools() {
  return new Map(relicAttackPools().map(pool => [pool, pool[pool.length - 1]]));
}
function relicCaptureSource(object, context) {
  if (!object || object.relicAttack) return;
  const tags = {};
  if (object.shadow) tags.clone = true;
  if (object.type === 'aftershock') tags.aftershock = true;
  object.relicAttack = Object.freeze({ ...context, ...tags, activeSkill: false });
}
function relicCapturePoolTail(pool, oldTail, context) {
  for (let index = pool.length - 1; index >= 0 && pool[index] !== oldTail; index--)
    relicCaptureSource(pool[index], context);
}
function relicCaptureNewSources(previous, context) {
  for (const pool of relicAttackPools()) relicCapturePoolTail(pool, previous.get(pool), context);
}
function relicWrap(name, wrapper) {
  const base = globalThis[name];
  if (typeof base === 'function') globalThis[name] = wrapper(base);
}
function relicAttackWrapper(base, kind, tags = {}, activeSkill = false) {
  return function (...args) {
    if (!relicRunActive()) return base.apply(this, args);
    if (kind === 'basic' && player.fireCooldown > 0 && !args[0]) return base.apply(this, args);
    const previous = relicAttackContext;
    const nested = previous && previous.kind === kind && !activeSkill;
    const dynamicTags = typeof tags === 'function' ? tags(...args) : tags;
    const context = nested ? { ...previous, ...dynamicTags } : relicNewAttack({ kind, ...dynamicTags, activeSkill });
    if (kind === 'basic') context.weapon = player.yupiterWeapon;
    const before = relicRememberPools(), cooldowns = {};
    for (const key of Object.keys(player)) if (/Cooldown$/.test(key)) cooldowns[key] = player[key];
    const yupiterBefore = (player.yupiterSkillCooldowns || []).slice();
    relicAttackContext = context;
    for (const enemy of zombies) relicTrackEnemy(enemy);
    let result;
    try { result = base.apply(this, args); }
    finally {
      let used = false;
      if (activeSkill) {
        for (const key of Object.keys(player)) if (/Cooldown$/.test(key) && key !== 'fireCooldown' && player[key] > (cooldowns[key] || 0)) {
          player[key] = Math.max(1, Math.ceil(player[key] * Math.max(.1, 1 - relicStat('cooldown')))); used = true;
        }
        (player.yupiterSkillCooldowns || []).forEach((v, i, all) => { if (v > (yupiterBefore[i] || 0)) { all[i] = Math.max(1, Math.ceil(v * Math.max(.1, 1 - relicStat('cooldown')))); used = true; } });
        if (used || result === true) relicMarkActiveSkill(context);
      }
      if (kind === 'basic' && !nested && player.fireCooldown > (cooldowns.fireCooldown || 0)) {
        relicRecordAttack(context);
        player.fireCooldown = Math.max(1, Math.ceil(player.fireCooldown / (1 + relicStat('attackSpeed'))));
      }
      relicCaptureNewSources(before, context);
      relicAttackContext = previous;
    }
    return result;
  };
}
function relicPassiveWrapper(base, tags, hero) {
  return function (...args) {
    if (!relicRunActive() || (hero && selectedCharacter !== hero)) return base.apply(this, args);
    const previous = relicAttackContext;
    relicAttackContext = relicNewAttack(tags);
    try { return base.apply(this, args); } finally { relicAttackContext = previous; }
  };
}
function relicPainCapacityMultiplier() { return relicHeroSet('C14', 'moira') ? 1.20 : 1; }
function relicIsPainRelease() { return !!(relicAttackContext && relicAttackContext.painRelease); }

relicWrap('restart', base => function (...args) {
  relicResetting = true; relicRun = null; relicAttackContext = null;
  try { return base.apply(this, args); }
  finally { relicBeginRun(); relicResetting = false; }
});
relicWrap('update', base => function (...args) {
  const advanced = relicTick(), result = base.apply(this, args);
  if (advanced && gameOver) relicGrantCombatReward('defeat');
  return result;
});
relicWrap('spawnZombie', base => function (...args) { const result = base.apply(this, args); for (const z of zombies) relicTrackEnemy(z); return result; });
relicWrap('summonReaperMinions', base => function (...args) { const result = base.apply(this, args); for (const z of zombies) relicTrackEnemy(z); return result; });
relicWrap('startRaidBoss', base => function (...args) { const result = base.apply(this, args); if (activeRaidBoss) relicTrackEnemy(activeRaidBoss); return result; });
relicWrap('defeatRaidBoss', base => function (boss, ...args) {
  const valid = boss && boss === activeRaidBoss;
  const result = base.call(this, boss, ...args);
  if (valid) { relicGrantCombatReward('boss', boss.raidIndex); if (boss.raidIndex === 2) relicGrantCombatReward('clear'); }
  return result;
});
relicWrap('gainExp', base => function (amount, ...args) { return base.call(this, amount * (1 + relicStat('xpGain')), ...args); });
// Augments operate on permanent stats. A temporary Lush profit buff must not
// alter their integer rounding or leave a permanent fractional attack bonus.
if (typeof upgrades !== 'undefined') for (const upgrade of upgrades) {
  const apply = upgrade.apply;
  if (typeof apply === 'function') upgrade.apply = function (...args) {
    relicPermanentStatWrite++;
    try { return apply.apply(this, args); } finally { relicPermanentStatWrite--; }
  };
}
relicWrap('updatePlayer', base => function (...args) {
  const x = player.x, y = player.y, result = base.apply(this, args);
  if (relicRunActive() && relicHasSet('A03')) {
    if (Math.hypot(player.x - x, player.y - y) > .01) {
      relicRun.movement++;
      if (relicRun.moveArmed && relicRun.movement >= 180) { relicSetBuff('moving', 300); relicRun.moveArmed = false; }
    } else { relicRun.movement = 0; relicRun.moveArmed = true; }
  }
  return result;
});

const relicBasicFunctions = ['shoot','attackWithSuncall','attackWithYupiterWeapon','throwCrescentBlade','slashWithSeveringBlade','fireFlameCannon','attackWithRen','attackWithNightLord','attackWithZero','attackWithPaladin','attackWithArc','attackWithTerra','attackWithVoid','attackWithCarmilla','attackWithVargas','attackWithEcho','attackWithAria','attackWithMoira','attackWithMare','attackWithNullZero','attackWithAstra','attackWithLush','attackWithOblivion'];
const relicSpecializedHeroes = new Set(['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','aria','moira','mare','nullZero','astra','lush','oblivion']);
for (const name of relicBasicFunctions) relicWrap(name, base => {
  const basic = relicAttackWrapper(base, 'basic', { area: !['shoot','attackWithSuncall','attackWithRen','attackWithNullZero','attackWithLush'].includes(name), hpScaling: name === 'attackWithVargas' });
  // Those heroes dispatch to their own wrapped attack; the generic gun path
  // needs this wrapper, but dispatch itself must not allocate a second snapshot.
  if (name === 'shoot') return function (...args) {
    return (relicSpecializedHeroes.has(selectedCharacter) ? base : basic).apply(this,args);
  };
  if (name !== 'attackWithNightLord') return basic;
  const spin = relicAttackWrapper(base, 'skill', {area:true});
  return function (...args) { return (args[0] ? spin : basic).apply(this,args); };
});
const relicActiveFunctions = ['activateYupiterSkill','activateYupiterUltimate','deployRenShadow','teleportToLatestRenShadow','activateRenSkill','activateRenUltimate','replayEchoMemory','activateEchoPhase','activateEchoCollapse',
  ...['Suncall','NightLord','Zero','Paladin','Arc','Terra','Void','Carmilla','Vargas','Aria','Moira','Mare','NullZero','Astra','Lush','Oblivion'].flatMap(hero => ['Q','E','X','R'].map(key => `activate${hero}${key}`))];
for (const name of relicActiveFunctions) relicWrap(name, base => relicAttackWrapper(base, 'skill', () => ({ area: true,
  heatEmpowered: name.startsWith('activateArc') && (name === 'activateArcQ' ? player.arcHeat > 0 : player.arcHeat >= (name === 'activateArcR' ? 100 : 50)),
  vibrationEmpowered: name.startsWith('activateTerra') && player.terraVibration >= 100,
  massSpent: (name === 'activateVoidE' || name === 'activateVoidR') && player.voidMass > 0,
  hpScaling: name.startsWith('activateVargas'), painRelease: name === 'activateMoiraX',
  riftClose: name === 'replayEchoMemory' || name === 'activateEchoCollapse', bloom: name === 'activateAriaE',
  cloneRaid: name === 'activateRenSkill' || name === 'detonateRenShadows', clone: name === 'activateRenSkill' || name === 'detonateRenShadows'
}), true));

// Passive/augment updates do not count as manual casts. Explicit impact-source
// hooks below override these defaults for mixed basic/skill projectile pools.
for (const [name, hero] of Object.entries({updateRen:'ren',updateNightLord:'nightLord',updateZero:'zero',updatePaladin:'paladin',updateArc:'arc',updateTerra:'terra',updateVoid:'void',updateCarmilla:'carmilla',updateVargas:'vargas',updateEcho:'echo',updateAria:'aria',updateMoira:'moira',updateMare:'mare',updateNullZero:'nullZero',updateSuncall:'suncall',updateAstra:'astra',updateLush:'lush',updateOblivionCombat:'oblivion',updateCrescentUltimate:'yupiter',updateFlameUltimate:'yupiter',updateRenShadowFields:'ren',updateAstraWells:'astra'})) relicWrap(name, base => relicPassiveWrapper(base, {kind:'skill', area:true, dot:name==='updateRenShadowFields'}, hero));
relicWrap('updateAstraGravity', base => function (...args) {
  if (!relicRunActive() || selectedCharacter !== 'astra') return base.apply(this,args);
  return relicWithSource(typeof astraGravity !== 'undefined' ? astraGravity : null, () => base.apply(this, args), {kind:'skill',area:true});
});
for (const name of ['explode','updateVision','updateQuantum','updateLaserSlashes','updateGravityFields','updateGravitySkill','updateDrone','updateDroneBullets','updateDaggers','updateFireTrails','createFireTrail']) relicWrap(name, base => relicPassiveWrapper(base, {kind:'augment',area:!['updateDrone','updateDroneBullets'].includes(name),dot:name==='updateFireTrails',canCrit:name!=='updateFireTrails'}));

for (const name of ['suncallDamage','astraDamage','nullZeroDamage','mareDamage','lushDamage','oblivionDamage']) relicWrap(name, base => function (enemy, amount, source, tags) {
  relicTagTarget(enemy, source, tags);
  return base.call(this, enemy, amount);
});
for (const [name, sourceIndex, tagsIndex] of [['damageArcArea',6,7],['terraDamageCircle',5,6],['voidHitCircle',5,6],['lushCircle',4,5],['oblivionHitLines',3,4],['oblivionHitCircle',4,5]]) relicWrap(name, base => function (...args) {
  return relicWithSource(args[sourceIndex], () => base.apply(this, args), args[tagsIndex] || {area:true});
});
relicWrap('ariaHit', base => function (x,y,...args) {
  const garden = typeof ariaSoils !== 'undefined' && ariaSoils.some(s => Math.hypot(s.x-x,s.y-y)<=s.r && ariaSoils.some(o => o!==s && Math.hypot(o.x-s.x,o.y-s.y)<190+(player.ariaSoilLevel||0)*18));
  return relicWithSource(null, () => base.call(this,x,y,...args), {garden,area:true});
});
const relicCreatorPools = {
  queueRenStrike: () => renAttackEffects, suncallSpawnShot: () => suncallShots,
  spawnNullZeroPacket: () => nullZeroProjectiles, lushSpawnCard: () => lushState.cards,
  lushLaunchDie: () => lushState.dice, lushQueueRoyal: () => lushState.qBursts,
  oblivionSpawnShard: () => oblivionState.projectiles, oblivionQueueEcho: () => oblivionState.echoes,
  oblivionCreateTear: () => oblivionState.casts, oblivionCreateGrasp: () => oblivionState.casts,
  launchFlameUltimateBarrage: () => flameUltimateShots
};
for (const [name, getPool] of Object.entries(relicCreatorPools)) relicWrap(name, base => function (...args) {
  if (!relicRunActive()) return base.apply(this,args);
  const pool = getPool(), oldTail = pool[pool.length - 1], context = relicAttackContext || relicNewAttack({kind:'skill'});
  const result = base.apply(this,args);
  const current = getPool();
  if (name === 'launchFlameUltimateBarrage') relicCapturePoolTail(current,oldTail,context);
  else if (current[current.length - 1] !== oldTail) relicCaptureSource(current[current.length - 1],context);
  return result;
});
// This creator delegates to lushSpawnCard. Carry the original attack through
// that call even when the ricochet is born during a later passive-update frame.
relicWrap('lushSpawnRicochet', base => function (source,...args) {
  return relicWithSource(source, () => base.call(this,source,...args));
});
for (const [name, tags] of Object.entries({ suncallPulse: { circuit: true, area: true }, suncallShatter: { crystal: true, area: true }, addMareCurrent: { confluence: true, area: true }, detonateNullZeroInfection: { kind: 'skill', infectionBurst: true, area: true }, triggerPaladinCounter: { kind: 'skill', area: true } })) relicWrap(name, base => function (...args) {
  const source = name === 'suncallPulse' || name === 'suncallShatter' ? args[0] : null;
  return relicWithSource(source, () => base.apply(this, args), tags);
});
relicWrap('switchYupiterWeapon', base => function (...args) {
  if (relicHeroSet('C02', 'yupiter')) relicSetBuff('weapon', 300);
  return base.apply(this, args);
});
for (const [name, id, hero] of [['addPaladinCombo','C06','paladin'],['addArcHeat','C07','arc'],['addTerraVibration',null,'terra'],['addVoidMass',null,'void'],['oblivionGainGauge',null,'oblivion']]) relicWrap(name, base => function (amount, ...args) {
  const multiplier = relicRunActive() ? 1 + relicStat('resourceGain') + (id && relicHeroSet(id, hero) ? .10 : 0) : 1;
  return base.call(this, amount * multiplier, ...args);
});
relicWrap('onAstraEnemyKilled', base => function (...args) {
  const before = player.astraStardust || 0, result = base.apply(this, args);
  if (relicHeroSet('C17', 'astra') && player.astraStardust > before) {
    if (!relicBuff('stardust')) relicRun.stardustStacks = 0;
    relicRun.stardustStacks = Math.min(10, relicRun.stardustStacks + 1); relicSetBuff('stardust', 240);
  }
  return result;
});
relicWrap('lushCashOut', base => function (...args) {
  const profit = Math.max(0, lushState.pot - lushState.principal), result = base.apply(this, args);
  if (result && profit > 0 && relicHeroSet('C18', 'lush')) relicSetBuff('profit', 480);
  return result;
});
relicWrap('tryRevive', base => function (...args) { relicSilentHealing++; try { return base.apply(this, args); } finally { relicSilentHealing--; } });
// The first second of BREAK cancels boss actions, but existing world hazards
// continue updating. It does not lengthen the six-second break damage window.
for (const name of ['updateBloomBoss','updateReaperBoss','updateAbyssBoss','pickRaidPattern']) relicWrap(name, base => function (boss, ...args) {
  if (boss.relicInterruptTime > 0) return;
  return base.call(this, boss, ...args);
});
