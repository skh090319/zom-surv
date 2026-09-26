// 2·4·6분 보스전: 타임라인, 패턴, 전용 투사체와 렌더링

const RAID_BOSS_TIMES = [120 * 60, 240 * 60, 360 * 60];
const RAID_BOSS_NAMES = ["맹독의 꽃 아마란스", "날개 달린 사신 모르스", "심연의 집행자 녹스"];
const RAID_BOSS_HP = [37500, 150000, 600000];
const RAID_BOSS_PERCENT_FLAT_PER_POINT = [25, 50, 90];
const raidBossImages = ["venom-bloom", "winged-reaper", "abyss-knight"].map(name => {
  const image = new Image();
  image.src = `assets/bosses/${name}.webp`;
  return image;
});

let survivalFrames = 0;
let nextRaidBossIndex = 0;
let activeRaidBoss = null;
let raidBossProjectiles = [];
let raidBossZones = [];
let raidBossEffects = [];
let raidArena = null;
let raidIntroTime = 0;
let raidVictory = false;
let raidWarningPulse = 0;
let raidRewardChoicesPending = 0;

function resetRaidBossSystem() {
  survivalFrames = 0;
  nextRaidBossIndex = 0;
  activeRaidBoss = null;
  raidBossProjectiles = [];
  raidBossZones = [];
  raidBossEffects = [];
  raidArena = null;
  raidIntroTime = 0;
  raidVictory = false;
  raidWarningPulse = 0;
  raidRewardChoicesPending = 0;
  player.bossRootTime = 0;
  player.bossSlowTime = 0;
}

function purgeEnemiesForRaid() {
  // killZombie를 거치지 않으므로 점수·처치·경험치가 발생하지 않는다.
  zombies.length = 0;
  bullets.length = 0;
  droneBullets.length = 0;
}

// 일반 적에게는 기존 최대 체력 비례 피해를 유지하고, 보스에게는
// 비율 1%마다 정해진 고정 피해로 바꿔 체력 규모가 공략 시간을 무너뜨리지 않게 한다.
function enemyMaxHpDamage(enemy, ratio) {
  if (!enemy || !enemy.isRaidBoss) return (enemy?.maxHp || 0) * ratio;
  return RAID_BOSS_PERCENT_FLAT_PER_POINT[enemy.raidIndex] * ratio * 100;
}

function startRaidBoss(index) {
  purgeEnemiesForRaid();
  const centerX = Math.max(580, Math.min(WORLD.width - 580, player.x));
  const centerY = Math.max(580, Math.min(WORLD.height - 580, player.y));
  raidArena = index === 0 ? { x: centerX, y: centerY, r: 1000, pulse: 0 } : null;
  if (index === 0) {
    player.x = centerX;
    player.y = centerY + 360;
  }
  const spawnX = centerX;
  const bossSpawnGap = 520;
  const spawnY = index === 0
    ? centerY - 120
    : (player.y - bossSpawnGap >= 180
      ? player.y - bossSpawnGap
      : Math.min(WORLD.height - 180, player.y + bossSpawnGap));
  const difficultyHp = getRaidBossDifficultyHpMultiplier();
  const difficultySpeed = getRaidBossDifficultySpeedMultiplier();
  const bossHp = RAID_BOSS_HP[index] * difficultyHp;
  activeRaidBoss = {
    id: `raid-${index}-${Date.now()}`,
    isRaidBoss: true,
    raidIndex: index,
    x: spawnX, y: spawnY,
    anchorX: spawnX, anchorY: spawnY,
    r: index === 0 ? 82 : 76,
    hp: bossHp, maxHp: bossHp,
    speed: (index === 0 ? 0 : (index === 1 ? 2.3 : 5.07)) * difficultySpeed,
    boss: true,
    pattern: null, patternTime: 0, patternStep: 0,
    cooldown: 115, lastPattern: -1, facing: 1,
    anim: 0, flash: 0, lastHp: bossHp,
    dashVx: 0, dashVy: 0, queuedVolley: false
  };
  zombies.push(activeRaidBoss);
  raidBossProjectiles.length = 0;
  raidBossZones.length = 0;
  raidBossEffects.length = 0;
  raidIntroTime = 150;
  for (let i = 0; i < 54; i++) {
    const a = Math.random() * Math.PI * 2;
    raidBossEffects.push({ type: "spawn", x: spawnX, y: spawnY, angle: a, r: 40 + Math.random() * 210, life: 55 + Math.random() * 35, maxLife: 90 });
  }
}

function enforceImmobileRaidBoss() {
  if (!activeRaidBoss) return;
  if (activeRaidBoss.raidIndex === 0) {
    activeRaidBoss.x = activeRaidBoss.anchorX;
    activeRaidBoss.y = activeRaidBoss.anchorY;
    activeRaidBoss.dashVx = 0;
    activeRaidBoss.dashVy = 0;
  } else if (Number.isFinite(activeRaidBoss.frameX) && Number.isFinite(activeRaidBoss.frameY)) {
    // 보스 자신의 AI 이동 이후에 생긴 외부 넉백·흡입 변위만 되돌린다.
    activeRaidBoss.x = activeRaidBoss.frameX;
    activeRaidBoss.y = activeRaidBoss.frameY;
  }
  activeRaidBoss.slowTime = 0;
  activeRaidBoss.stunTime = 0;
  activeRaidBoss.stunFlash = 0;
}

function defeatRaidBoss(boss) {
  if (!activeRaidBoss || boss !== activeRaidBoss) return;
  const index = boss.raidIndex;
  zombies = zombies.filter(z => z !== boss && !z.isBossMinion);
  raidBossProjectiles.length = 0;
  raidBossZones.length = 0;
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    raidBossEffects.push({ type: "death", x: boss.x, y: boss.y, angle: a, speed: 2 + Math.random() * 9, life: 65 + Math.random() * 35, maxLife: 100 });
  }
  player.score += 1200 * (index + 1);
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
  activeRaidBoss = null;
  raidArena = null;
  nextRaidBossIndex = index + 1;
  if (index < 2) {
    raidRewardChoicesPending = 2;
    openUpgradeMenu();
  } else {
    raidVictory = true;
  }
}

function pickRaidPattern(boss) {
  let pattern = Math.floor(Math.random() * 3);
  if (pattern === boss.lastPattern) pattern = (pattern + 1 + Math.floor(Math.random() * 2)) % 3;
  boss.lastPattern = pattern;
  boss.pattern = pattern;
  boss.patternTime = 0;
  boss.patternStep = 0;
  boss.anim = 1;
  if (boss.raidIndex === 0 && boss.queuedVolley) {
    boss.pattern = 1;
    boss.queuedVolley = false;
  }
}

function finishRaidPattern(boss, cooldown = 90) {
  boss.pattern = null;
  boss.patternTime = 0;
  boss.patternStep = 0;
  boss.cooldown = cooldown;
  boss.anim = 0;
}

function raidPlayerDamage(ratio, lethal = false) {
  if (lethal) {
    player.hp = 0;
    gameOver = !tryRevive();
    return;
  }
  if (player.invincibleTime > 0 || tryDodgeAttack()) return;
  const bossIndex = activeRaidBoss?.raidIndex ?? -1;
  const difficultyDamage = selectedDifficulty === "medium"
    ? 1.3
    : (selectedDifficulty === "hard" && bossIndex >= 0 && bossIndex < 2 ? 3 : 1);
  let damage = player.maxHp * ratio * difficultyDamage;
  if (selectedCharacter === "vargas" && player.vargasShield > 0) {
    const absorbed = Math.min(player.vargasShield, damage);
    player.vargasShield -= absorbed;
    damage -= absorbed;
  }
  const protectedBloodMoon = selectedCharacter === "carmilla" && player.carmillaBloodMoonTime > 0 && transcended.carmillaFeast;
  player.hp -= protectedBloodMoon ? Math.min(damage, Math.max(0, player.hp - 1)) : damage;
  if (selectedCharacter === "nightLord" && player.nightLordUltimateTime > 0) player.hp = Math.max(1, player.hp);
  player.invincibleTime = 20;
  raidBossEffects.push({ type: "playerHit", x: player.x, y: player.y, life: 24, maxLife: 24 });
  if (player.hp <= 0 && !tryRevive()) gameOver = true;
}

function addRaidProjectile(data) {
  raidBossProjectiles.push(Object.assign({ r: 12, life: 260, spin: 0, hit: false }, data));
}

function firePoisonVolley(boss) {
  const base = Math.atan2(player.y - boss.y, player.x - boss.x);
  const count = selectedDifficulty === "hard" ? 6 : 3;
  for (let i = 0; i < count; i++) {
    const a = base + (i - (count - 1) / 2) * 0.18;
    addRaidProjectile({ type: "venom", x: boss.x, y: boss.y, vx: Math.cos(a) * 7.2, vy: Math.sin(a) * 7.2, r: 15, damage: 0.14 });
  }
}

function splitVenomProjectile(p) {
  for (let i = 0; i < 5; i++) {
    const a = Math.atan2(player.y - p.y, player.x - p.x) + (i - 2) * 0.34;
    addRaidProjectile({ type: "venomSmall", x: p.x, y: p.y, vx: Math.cos(a) * 6.3, vy: Math.sin(a) * 6.3, r: 7, damage: 0.07, life: 150 });
  }
  raidBossEffects.push({ type: "poisonBurst", x: p.x, y: p.y, life: 30, maxLife: 30 });
}

function updateBloomBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if (boss.patternTime === 1) {
      const poisonCenterX = player.x;
      const poisonCenterY = player.y;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + 0.18;
        const d = 105 + (i % 2) * 115;
        raidBossZones.push({ type: "poison", x: poisonCenterX + Math.cos(a) * d, y: poisonCenterY + Math.sin(a) * d, r: 72, delay: 48 + i * 3, life: 260, tick: 0 });
      }
    }
    if (boss.patternTime > 72) finishRaidPattern(boss, 95);
  } else if (boss.pattern === 1) {
    if (boss.patternTime === 22) firePoisonVolley(boss);
    if (boss.patternTime > 55) finishRaidPattern(boss, 85);
  } else if (boss.pattern === 2) {
    if (boss.patternTime === 24) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      const count = selectedDifficulty === "hard" ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const shotAngle = a + (i - (count - 1) / 2) * 0.2;
        addRaidProjectile({ type: "vine", x: boss.x, y: boss.y, vx: Math.cos(shotAngle) * 10, vy: Math.sin(shotAngle) * 10, r: 13, damage: 0.08, life: 95 });
      }
    }
    if (boss.patternTime > 58) finishRaidPattern(boss, 75);
  }
}

function summonReaperMinions(boss) {
  const count = selectedDifficulty === "hard" ? 10 : 5;
  const speedMultiplier = selectedDifficulty === "hard" ? 3 : (selectedDifficulty === "medium" ? 1.2 : 1);
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    zombies.push({
      id: `reaper-minion-${Date.now()}-${i}`, isBossMinion: true, raidSprite: 1,
      x: boss.x + Math.cos(a) * 120, y: boss.y + Math.sin(a) * 120,
      controlImmuneX: boss.x + Math.cos(a) * 120, controlImmuneY: boss.y + Math.sin(a) * 120,
      r: 26, hp: 420, maxHp: 420, speed: 1.45 * speedMultiplier, boss: false, damage: 5
    });
  }
}

function updateReaperBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if (boss.patternTime === 1) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.dashVx = Math.cos(a) * 16; boss.dashVy = Math.sin(a) * 16;
      raidBossZones.push({ type: "chargeTelegraph", boss, angle: a, x: boss.x, y: boss.y, length: 520, width: 92, delay: 35, life: 55 });
    }
    if (boss.patternTime >= 36 && boss.patternTime <= 58) {
      boss.x += boss.dashVx; boss.y += boss.dashVy;
      if (Math.hypot(player.x - boss.x, player.y - boss.y) < boss.r + player.r + 15) raidPlayerDamage(0.28);
    }
    if (boss.patternTime > 65) finishRaidPattern(boss, 90);
  } else if (boss.pattern === 1) {
    const scytheTimes = selectedDifficulty === "hard" ? [22, 74] : [22];
    if (scytheTimes.includes(boss.patternTime)) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      addRaidProjectile({ type: "scythe", x: boss.x, y: boss.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, r: 62, damage: 0.2, life: 170, owner: boss, returning: false, travel: 0 });
    }
    if (boss.patternTime > 150) finishRaidPattern(boss, 100);
  } else if (boss.pattern === 2) {
    if (boss.patternTime === 30) summonReaperMinions(boss);
    if (boss.patternTime > 62) finishRaidPattern(boss, 120);
  }
}

function fireAbyssOrb(boss) {
  const a = Math.atan2(player.y - boss.y, player.x - boss.x);
  addRaidProjectile({ type: "abyssOrb", x: boss.x, y: boss.y, vx: Math.cos(a) * 8.2, vy: Math.sin(a) * 8.2, r: 16, damage: 0.6, life: 180 });
}

function fireAbyssOrbRing(boss) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    addRaidProjectile({ type: "abyssOrb", x: boss.x, y: boss.y, vx: Math.cos(a) * 8.2, vy: Math.sin(a) * 8.2, r: 16, damage: 0.6, life: 180 });
  }
}

function setupAbyssDash(boss) {
  const a = Math.atan2(player.y - boss.y, player.x - boss.x);
  // 13프레임 동안 예고 직사각형의 650px 끝까지 정확히 완주한다.
  boss.dashVx = Math.cos(a) * 50; boss.dashVy = Math.sin(a) * 50;
  boss.dashHit = false;
  raidBossZones.push({ type: "deathDash", boss, angle: a, x: boss.x, y: boss.y, length: 650, width: 108, delay: 38, life: 55 });
}

function updateAbyssBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if (selectedDifficulty === "hard") {
      if (boss.patternTime === 18) fireAbyssOrbRing(boss);
    } else if ([18, 34, 50, 66].includes(boss.patternTime)) fireAbyssOrb(boss);
    if (boss.patternTime > 92) finishRaidPattern(boss, 90);
  } else if (boss.pattern === 1) {
    const lightningTimes = selectedDifficulty === "hard" ? [1, 23, 45, 67, 89, 111, 133, 155] : [1, 38, 75, 112];
    if (lightningTimes.includes(boss.patternTime)) {
      raidBossZones.push({ type: "lightning", x: player.x, y: player.y, r: 92, delay: 42, life: 62, struck: false });
    }
    if (boss.patternTime > 176) finishRaidPattern(boss, 105);
  } else if (boss.pattern === 2) {
    const cycle = boss.patternTime % 62;
    const dashTimes = selectedDifficulty === "hard" ? [1, 63, 125, 187, 249] : [1, 63, 125];
    if (dashTimes.includes(boss.patternTime)) setupAbyssDash(boss);
    if (cycle >= 39 && cycle <= 51) {
      boss.x += boss.dashVx; boss.y += boss.dashVy;
      if (!boss.dashHit && Math.hypot(player.x - boss.x, player.y - boss.y) < boss.r + player.r + 22) {
        boss.dashHit = true;
        raidPlayerDamage(1, true);
      }
    }
    if (boss.patternTime > (selectedDifficulty === "hard" ? 310 : 186)) finishRaidPattern(boss, 125);
  }
}

function updateRaidBossProjectiles() {
  for (let i = raidBossProjectiles.length - 1; i >= 0; i--) {
    const p = raidBossProjectiles[i];
    p.life--; p.spin += 0.22;
    if (p.type === "scythe") {
      p.travel++;
      if (!p.returning && p.travel > 52) { p.returning = true; p.hit = false; }
      if (p.returning) {
        const a = Math.atan2(p.owner.y - p.y, p.owner.x - p.x);
        p.vx = Math.cos(a) * 12; p.vy = Math.sin(a) * 12; p.damage = 0.5;
        if (Math.hypot(p.owner.x - p.x, p.owner.y - p.y) < p.owner.r) { raidBossProjectiles.splice(i, 1); continue; }
      }
    }
    p.x += p.vx; p.y += p.vy;
    if (p.type === "venom" && raidArena && Math.hypot(p.x - raidArena.x, p.y - raidArena.y) > raidArena.r - 18) {
      splitVenomProjectile(p); raidBossProjectiles.splice(i, 1); continue;
    }
    if (!p.hit && Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      raidPlayerDamage(p.damage || 0.1);
      p.hit = true;
      if (p.type === "vine") {
        player.bossRootTime = 120;
        if (activeRaidBoss && activeRaidBoss.raidIndex === 0) {
          activeRaidBoss.pattern = 1;
          activeRaidBoss.patternTime = 0;
          activeRaidBoss.patternStep = 0;
          activeRaidBoss.anim = 1;
        }
      }
      if (p.type === "abyssOrb") player.bossSlowTime = 150;
      if (p.type !== "scythe") { raidBossProjectiles.splice(i, 1); continue; }
    }
    if (p.life <= 0) raidBossProjectiles.splice(i, 1);
  }
}

function updateRaidBossZones() {
  for (let i = raidBossZones.length - 1; i >= 0; i--) {
    const z = raidBossZones[i];
    z.life--; if (z.delay > 0) z.delay--;
    if (z.type === "poison" && z.delay <= 0) {
      z.tick = (z.tick || 0) - 1;
      if (z.tick <= 0 && Math.hypot(player.x - z.x, player.y - z.y) < z.r + player.r) { raidPlayerDamage(0.06); z.tick = 28; }
    }
    if (z.type === "lightning" && z.delay <= 0 && !z.struck) {
      z.struck = true;
      if (Math.hypot(player.x - z.x, player.y - z.y) < z.r + player.r) raidPlayerDamage(0.8);
      raidBossEffects.push({ type: "lightning", x: z.x, y: z.y, r: z.r, seed: Math.random() * 1000, life: 36, maxLife: 36 });
    }
    if (z.life <= 0) raidBossZones.splice(i, 1);
  }
}

function clampPlayerToRaidArena() {
  if (!raidArena) return;
  const dx = player.x - raidArena.x, dy = player.y - raidArena.y;
  const dist = Math.hypot(dx, dy), limit = raidArena.r - player.r - 12;
  if (dist > limit) { player.x = raidArena.x + dx / dist * limit; player.y = raidArena.y + dy / dist * limit; }
}

function updateRaidBossSystem() {
  if (raidVictory) return;
  if (!activeRaidBoss) {
    survivalFrames++;
    raidWarningPulse += 0.12;
    if (nextRaidBossIndex < RAID_BOSS_TIMES.length && survivalFrames >= RAID_BOSS_TIMES[nextRaidBossIndex]) startRaidBoss(nextRaidBossIndex);
    return;
  }
  const boss = activeRaidBoss;
  if (boss.hp <= 0 || !zombies.includes(boss)) { defeatRaidBoss(boss); return; }
  if (boss.hp < boss.lastHp) { boss.flash = 5; boss.lastHp = boss.hp; }
  if (boss.flash > 0) boss.flash--;
  if (raidIntroTime > 0) raidIntroTime--;
  if (player.bossRootTime > 0) player.bossRootTime--;
  if (player.bossSlowTime > 0) player.bossSlowTime--;
  if (raidArena) raidArena.pulse += 0.025;
  clampPlayerToRaidArena();
  if (raidIntroTime <= 0) {
    if (boss.pattern === null) {
      boss.cooldown--;
      if (boss.cooldown <= 0) pickRaidPattern(boss);
      else if (boss.raidIndex > 0) {
        const a = Math.atan2(player.y - boss.y, player.x - boss.x);
        boss.x += Math.cos(a) * boss.speed * 0.48; boss.y += Math.sin(a) * boss.speed * 0.48;
      }
    } else if (boss.raidIndex === 0) updateBloomBoss(boss);
    else if (boss.raidIndex === 1) updateReaperBoss(boss);
    else updateAbyssBoss(boss);
  }
  boss.facing = player.x < boss.x ? -1 : 1;
  const contactDistance = boss.r + player.r + (boss.raidIndex === 0 ? 8 : 14);
  if (Math.hypot(player.x - boss.x, player.y - boss.y) < contactDistance) {
    raidPlayerDamage([0.12, 0.18, 0.25][boss.raidIndex]);
    const pushAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    player.x += Math.cos(pushAngle) * 18;
    player.y += Math.sin(pushAngle) * 18;
  }
  updateRaidBossProjectiles();
  updateRaidBossZones();
  boss.frameX = boss.x;
  boss.frameY = boss.y;
  for (let i = raidBossEffects.length - 1; i >= 0; i--) if (--raidBossEffects[i].life <= 0) raidBossEffects.splice(i, 1);
}

function drawRaidArena() {
  if (!raidArena) return;
  worldStart();
  const pulse = Math.sin(raidArena.pulse) * 7;
  ctx.save();
  ctx.fillStyle = "rgba(7,5,15,0.28)";
  ctx.strokeStyle = activeRaidBoss && activeRaidBoss.raidIndex === 0 ? "rgba(119,255,63,0.78)" : "rgba(153,78,255,0.72)";
  ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 22; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(raidArena.x, raidArena.y, raidArena.r + pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([22, 15]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(raidArena.x, raidArena.y, raidArena.r - 18 - pulse * .4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore(); worldEnd();
}

function drawRaidBossZones() {
  worldStart();
  for (const z of raidBossZones) {
    ctx.save();
    if (z.type === "poison") {
      const ready = z.delay <= 0;
      ctx.globalAlpha = ready ? .66 : .28;
      const g = ctx.createRadialGradient(z.x,z.y,5,z.x,z.y,z.r);
      g.addColorStop(0, ready ? "#d7ff4b" : "#9dff45"); g.addColorStop(.52,"#43b91e"); g.addColorStop(1,"rgba(28,79,11,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#b8ff58";ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.stroke();
    } else if (z.type === "lightning") {
      const warning = Math.max(0, z.delay / 42), pulse = 1 + Math.sin(z.life * .55) * .045;
      const lg = ctx.createRadialGradient(z.x,z.y,4,z.x,z.y,z.r);
      lg.addColorStop(0, z.delay > 0 ? "rgba(241,218,255,.28)" : "rgba(255,255,255,.82)");
      lg.addColorStop(.48, z.delay > 0 ? "rgba(146,55,218,.18)" : "rgba(177,76,255,.48)");
      lg.addColorStop(1,"rgba(45,5,78,0)");
      ctx.fillStyle=lg;ctx.beginPath();ctx.arc(z.x,z.y,z.r*pulse,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=z.delay>0?`rgba(226,116,255,${.5+(1-warning)*.4})`:"#ffffff";
      ctx.lineWidth=z.delay>0?3:6;ctx.shadowColor="#c557ff";ctx.shadowBlur=z.delay>0?20:32;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r*pulse,0,Math.PI*2);ctx.stroke();
      ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.life*.025);
      for(let k=0;k<10;k++){const a=k*Math.PI/5;ctx.beginPath();ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18);ctx.quadraticCurveTo(Math.cos(a+.22)*z.r*.56,Math.sin(a+.22)*z.r*.56,Math.cos(a)*z.r*.92,Math.sin(a)*z.r*.92);ctx.stroke();}
      ctx.restore();
    } else if (z.type === "chargeTelegraph" || z.type === "deathDash") {
      ctx.translate(z.x,z.y);ctx.rotate(z.angle);
      ctx.fillStyle=z.type === "deathDash"?"rgba(255,22,40,.24)":"rgba(181,41,255,.18)";
      ctx.strokeStyle=z.type === "deathDash"?"#ff283e":"#c75bff";ctx.lineWidth=4;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=16;
      ctx.fillRect(0,-z.width/2,z.length,z.width);ctx.strokeRect(0,-z.width/2,z.length,z.width);
    }
    ctx.restore();
  }
  worldEnd();
}

function traceMorsScytheBlade() {
  ctx.beginPath();
  ctx.moveTo(-43,-42);
  ctx.bezierCurveTo(-91,-72,-104,-8,-72,35);
  ctx.bezierCurveTo(-54,59,-23,68,11,57);
  ctx.bezierCurveTo(-25,47,-48,17,-40,-12);
  ctx.bezierCurveTo(-35,-28,-22,-38,-5,-41);
  ctx.bezierCurveTo(-20,-43,-32,-43,-43,-42);
  ctx.closePath();
}

function drawRaidBossProjectiles() {
  worldStart();
  for (const p of raidBossProjectiles) {
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin);
    if (p.type === "vine") {
      ctx.strokeStyle="#7eff45";ctx.shadowColor="#4eff28";ctx.shadowBlur=14;ctx.lineWidth=8;
      ctx.beginPath();ctx.moveTo(-28,0);ctx.quadraticCurveTo(-4,-16,22,0);ctx.stroke();
      for(let j=-1;j<=1;j+=2){ctx.beginPath();ctx.moveTo(j*5,0);ctx.lineTo(j*12,-13);ctx.stroke();}
    } else if (p.type === "scythe") {
      const accent=p.returning?"#ff4fa3":"#a94fff";
      ctx.save();ctx.rotate(-p.spin*.42);ctx.lineCap="round";for(let trail=3;trail>=1;trail--){ctx.save();ctx.rotate(-trail*.22);ctx.globalAlpha=.05+trail*.035;ctx.strokeStyle=accent;ctx.shadowColor=accent;ctx.shadowBlur=18;ctx.lineWidth=15-trail*2;ctx.beginPath();ctx.arc(0,0,63,-1.45,1.58);ctx.stroke();ctx.restore();}ctx.restore();
      const blade=ctx.createLinearGradient(-78,-60,18,64);blade.addColorStop(0,"#ffffff");blade.addColorStop(.18,"#e9ddff");blade.addColorStop(.52,p.returning?"#d64d9d":"#8b39c8");blade.addColorStop(1,"#160925");ctx.shadowColor=accent;ctx.shadowBlur=32;traceMorsScytheBlade();ctx.fillStyle=blade;ctx.fill();ctx.strokeStyle="#f8f4ff";ctx.lineWidth=2.5;ctx.stroke();
      ctx.shadowBlur=14;ctx.strokeStyle="#160c21";ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(-34,-29);ctx.lineTo(51,53);ctx.stroke();ctx.strokeStyle="#743ba0";ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle="rgba(255,255,255,.68)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-31,-31);ctx.lineTo(53,50);ctx.stroke();
      ctx.fillStyle="#e8d7ff";ctx.shadowColor=accent;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(-34,-30,8,0,Math.PI*2);ctx.fill();ctx.fillStyle=accent;ctx.beginPath();ctx.arc(-34,-30,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#7d3aaa";ctx.beginPath();ctx.moveTo(51,53);ctx.lineTo(34,47);ctx.lineTo(48,35);ctx.closePath();ctx.fill();ctx.strokeStyle="#f2eaff";ctx.lineWidth=1.5;ctx.stroke();
      ctx.globalAlpha=.8;ctx.strokeStyle=accent;ctx.shadowColor=accent;ctx.shadowBlur=20;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,70,-1.36,1.5);ctx.stroke();
    } else {
      const abyss=p.type==="abyssOrb";
      if(abyss){
        ctx.save();ctx.rotate(-p.spin);
        const travelAngle=Math.atan2(p.vy,p.vx);
        ctx.rotate(-p.spin);ctx.globalCompositeOperation="lighter";
        for(let trail=1;trail<=4;trail++){const tx=-Math.cos(travelAngle)*trail*10,ty=-Math.sin(travelAngle)*trail*10;ctx.fillStyle=`rgba(112,31,190,${.17-trail*.025})`;ctx.beginPath();ctx.arc(tx,ty,p.r*(1-trail*.1),0,Math.PI*2);ctx.fill();}
        ctx.restore();
        const orb=ctx.createRadialGradient(-5,-6,2,0,0,p.r*1.25);orb.addColorStop(0,"#ffffff");orb.addColorStop(.14,"#d9a1ff");orb.addColorStop(.42,"#6e1aa6");orb.addColorStop(.72,"#190423");orb.addColorStop(1,"rgba(3,0,9,0)");
        ctx.fillStyle=orb;ctx.shadowColor="#b83dff";ctx.shadowBlur=30;ctx.beginPath();ctx.arc(0,0,p.r*1.3,0,Math.PI*2);ctx.fill();
        ctx.globalCompositeOperation="lighter";ctx.rotate(-p.spin*1.8);
        for(let ring=0;ring<2;ring++){ctx.strokeStyle=ring?"rgba(238,185,255,.72)":"rgba(128,34,221,.88)";ctx.lineWidth=ring?2:4;ctx.setLineDash(ring?[4,7]:[10,5]);ctx.beginPath();ctx.ellipse(0,0,p.r*(1.15+ring*.35),p.r*(.62+ring*.17),ring*.9,0,Math.PI*2);ctx.stroke();}
        ctx.setLineDash([]);for(let k=0;k<6;k++){const a=k*Math.PI/3+p.spin*.7,rr=p.r*(1.45+(k%2)*.25);ctx.fillStyle=k%2?"#f0c8ff":"#9d42e8";ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.4,0,Math.PI*2);ctx.fill();}
      }else{
        ctx.fillStyle=p.type==="venomSmall"?"#baff35":"#61cf20";ctx.strokeStyle="#eaff75";
        ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=20;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
    }
    ctx.restore();
  }
  worldEnd();
}

function drawRaidBoss() {
  if (!activeRaidBoss) return;
  const b=activeRaidBoss,img=raidBossImages[b.raidIndex];
  worldStart();ctx.save();ctx.translate(b.x,b.y);
  const attackPulse=b.pattern!==null?Math.sin(b.patternTime*.22)*.055:0;
  const size=b.raidIndex===0?250:285;
  ctx.scale(b.facing*(1+attackPulse),1-attackPulse*.7);
  if(b.flash>0){ctx.shadowColor="#ffffff";ctx.shadowBlur=34;ctx.globalAlpha=.82;}
  else{ctx.shadowColor=b.raidIndex===0?"#75ff32":"#8d37ff";ctx.shadowBlur=18;}
  if(img.complete&&img.naturalWidth)ctx.drawImage(img,-size/2,-size*.62,size,size);
  else{ctx.fillStyle=b.raidIndex===0?"#7bdc33":"#241533";ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  if(player.bossRootTime>0){ctx.strokeStyle="#6cff3d";ctx.lineWidth=7;ctx.shadowColor="#76ff41";ctx.shadowBlur=15;for(let i=0;i<4;i++){const a=i*Math.PI/2+performance.now()*.002;ctx.beginPath();ctx.arc(player.x,player.y,28+i*5,a,a+1.1);ctx.stroke();}}
  worldEnd();
}

function drawRaidBossEffects() {
  worldStart();
  for(const e of raidBossEffects){const p=1-e.life/e.maxLife;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.translate(e.x,e.y);
    if(e.type==="spawn"){ctx.rotate(e.angle);ctx.strokeStyle="#b74cff";ctx.shadowColor="#8b2cff";ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.r*(1-p),0);ctx.lineTo(e.r,0);ctx.stroke();}
    else if(e.type==="death"){ctx.rotate(e.angle);ctx.fillStyle="#d78bff";ctx.shadowColor="#8d2cff";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(e.speed*p*8,0,5*(1-p)+1,0,Math.PI*2);ctx.fill();}
    else if(e.type==="poisonBurst"){ctx.strokeStyle="#aaff3f";ctx.lineWidth=9*(1-p)+2;ctx.beginPath();ctx.arc(0,0,70*p,0,Math.PI*2);ctx.stroke();}
    else if(e.type==="lightning"){
      const fade=1-p, seed=e.seed||0;
      ctx.globalAlpha=Math.min(1,fade*1.8);ctx.lineJoin="round";ctx.lineCap="round";
      const boltPath=()=>{ctx.beginPath();ctx.moveTo(Math.sin(seed)*24,-540);for(let y=-480,i=0;y<0;y+=48,i++)ctx.lineTo(Math.sin(seed+i*7.31)*34*(1-y/-560),y);ctx.lineTo(0,0);};
      ctx.strokeStyle="rgba(137,38,255,.7)";ctx.shadowColor="#9b38ff";ctx.shadowBlur=42;ctx.lineWidth=22*fade+8;boltPath();ctx.stroke();
      ctx.strokeStyle="#ffffff";ctx.shadowColor="#e1a4ff";ctx.shadowBlur=24;ctx.lineWidth=7*fade+2;boltPath();ctx.stroke();
      ctx.strokeStyle="#dba5ff";ctx.lineWidth=3;for(let b=0;b<5;b++){const a=b*Math.PI*2/5+seed;ctx.beginPath();ctx.moveTo(0,-120-b*55);ctx.lineTo(Math.cos(a)*(34+b*12),-92-b*55);ctx.lineTo(Math.cos(a)*(58+b*16),-76-b*55);ctx.stroke();}
      const rg=ctx.createRadialGradient(0,0,4,0,0,(e.r||92)*(1.35+p*.45));rg.addColorStop(0,`rgba(255,255,255,${.8*fade})`);rg.addColorStop(.3,`rgba(188,87,255,${.58*fade})`);rg.addColorStop(1,"rgba(73,8,119,0)");ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,(e.r||92)*(1.35+p*.45),0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(232,188,255,${fade})`;ctx.lineWidth=5*fade+1;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.arc(0,0,(e.r||92)*(p*.9+ring*.22),0,Math.PI*2);ctx.stroke();}
    }
    else{ctx.strokeStyle="#ff385d";ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,45*p,0,Math.PI*2);ctx.stroke();}
    ctx.restore();}
  worldEnd();
}

function formatRaidTime(frames) {
  const seconds=Math.floor(frames/60);return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

function drawMobileRaidBossUI(){
  // Keep notifications in the top HUD; do not cover the player or touch controls.
  const w=Math.min(400,canvas.width*.62),x=(canvas.width-w)/2,y=52;
  ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.shadowBlur=0;
  if(activeRaidBoss){
    const ratio=Math.max(0,Math.min(1,activeRaidBoss.hp/activeRaidBoss.maxHp));
    ctx.fillStyle="rgba(7,8,18,.8)";ctx.fillRect(x-3,y-3,w+6,22);
    const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,"#9f2d79");g.addColorStop(1,"#df536c");
    ctx.fillStyle=g;ctx.fillRect(x,y,w*ratio,16);ctx.strokeStyle="rgba(247,214,235,.8)";ctx.lineWidth=1;ctx.strokeRect(x,y,w,16);
    ctx.font="bold 11px Arial";ctx.fillStyle="#fff";ctx.fillText(RAID_BOSS_NAMES[activeRaidBoss.raidIndex],canvas.width/2,y+8,w-12);
    const elapsed=150-raidIntroTime;
    if(raidIntroTime>0&&elapsed<66){
      ctx.globalAlpha=Math.min(1,(elapsed+1)/8,(66-elapsed)/16);
      ctx.fillStyle="rgba(28,10,21,.7)";ctx.fillRect(canvas.width/2-82,y+24,164,18);
      ctx.font="bold 11px Arial";ctx.fillStyle="#ffc1cc";ctx.fillText("보스 등장 · 전투 준비",canvas.width/2,y+33);
    }else{
      ctx.font="10px Arial";ctx.fillStyle="#d4c5b8";ctx.fillText("보스전 · 시간 정지",canvas.width/2,y+30);
    }
  }else{
    const remaining=RAID_BOSS_TIMES[nextRaidBossIndex]-survivalFrames;
    const warning=remaining>0&&remaining<=300;
    const width=warning?w:96;
    ctx.fillStyle="rgba(6,10,18,.74)";ctx.fillRect((canvas.width-width)/2,y,width,24);
    ctx.font="bold 12px Arial";ctx.fillStyle=warning?"#ffc4a3":"#fff";
    const label=warning?`${formatRaidTime(survivalFrames)}  ·  ⚠ 보스 접근 ${Math.ceil(remaining/60)}초`:formatRaidTime(survivalFrames);
    ctx.fillText(label,canvas.width/2,y+12,width-12);
    if(warning){ctx.fillStyle="#cf725c";ctx.fillRect(x,y+23,w*remaining/300,1);}
  }
  ctx.restore();
}

function drawRaidBossUI() {
  if(typeof isMobileTouchDevice==="function"&&isMobileTouchDevice()&&!raidVictory){drawMobileRaidBossUI();return;}
  ctx.save();
  ctx.textAlign="center";
  if(activeRaidBoss){
    const w=Math.min(760,canvas.width-80),x=(canvas.width-w)/2,y=54,ratio=Math.max(0,activeRaidBoss.hp/activeRaidBoss.maxHp);
    ctx.fillStyle="rgba(6,5,12,.9)";ctx.fillRect(x-6,y-6,w+12,38);
    const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,"#8f22cc");g.addColorStop(.5,"#ff3e6d");g.addColorStop(1,"#5211aa");ctx.fillStyle=g;ctx.fillRect(x,y,w*ratio,26);
    ctx.strokeStyle="#f3d9ff";ctx.lineWidth=2;ctx.strokeRect(x,y,w,26);
    ctx.fillStyle="#fff";ctx.font="bold 17px Arial";ctx.fillText(RAID_BOSS_NAMES[activeRaidBoss.raidIndex],canvas.width/2,y+19);
    ctx.fillStyle="#ffdf73";ctx.font="bold 14px Arial";ctx.fillText("보스전 · 시간 정지",canvas.width/2,y+49);
  } else if(!raidVictory){
    ctx.fillStyle="rgba(4,6,12,.72)";ctx.fillRect(canvas.width/2-58,52,116,30);ctx.fillStyle="#fff";ctx.font="bold 18px monospace";ctx.fillText(formatRaidTime(survivalFrames),canvas.width/2,73);
    if(nextRaidBossIndex<RAID_BOSS_TIMES.length){
      const remaining=RAID_BOSS_TIMES[nextRaidBossIndex]-survivalFrames;
      if(remaining>0&&remaining<=300){
        const seconds=Math.ceil(remaining/60),pulse=1+Math.sin(raidWarningPulse)*.045;
        ctx.save();ctx.translate(canvas.width/2,canvas.height*.25);ctx.scale(pulse,pulse);
        ctx.fillStyle="rgba(15,2,9,.82)";ctx.strokeStyle="#ff355d";ctx.shadowColor="#ff244f";ctx.shadowBlur=24;ctx.lineWidth=3;
        roundedRectPath(-245,-53,490,106,18);ctx.fill();ctx.stroke();
        ctx.fillStyle="#ff4e70";ctx.font="900 27px Arial";ctx.fillText("⚠ 보스 접근 감지",0,-13);
        ctx.fillStyle="#fff";ctx.font="bold 22px Arial";ctx.fillText(`${RAID_BOSS_NAMES[nextRaidBossIndex]} · ${seconds}초`,0,25);
        ctx.restore();
      }
    }
  }
  if(raidIntroTime>0&&activeRaidBoss){const a=Math.min(1,(150-raidIntroTime)/22,raidIntroTime/30);ctx.globalAlpha=a;ctx.fillStyle="rgba(0,0,0,.48)";ctx.fillRect(0,canvas.height*.33,canvas.width,150);ctx.fillStyle="#ff416c";ctx.shadowColor="#a52cff";ctx.shadowBlur=22;ctx.font="900 46px Arial";ctx.fillText("BOSS ENCOUNTER",canvas.width/2,canvas.height*.33+58);ctx.fillStyle="#fff";ctx.font="bold 25px Arial";ctx.fillText(RAID_BOSS_NAMES[activeRaidBoss.raidIndex],canvas.width/2,canvas.height*.33+105);}
  if(raidVictory){
    const centerX=canvas.width/2,centerY=canvas.height/2;
    const panelW=Math.min(620,canvas.width-40),panelH=360,panelX=centerX-panelW/2,panelY=centerY-panelH/2;
    ctx.fillStyle="rgba(3,3,10,.88)";ctx.fillRect(0,0,canvas.width,canvas.height);
    const panelGradient=ctx.createLinearGradient(panelX,panelY,panelX,panelY+panelH);
    panelGradient.addColorStop(0,"rgba(31,20,54,.97)");panelGradient.addColorStop(1,"rgba(8,9,18,.97)");
    roundedRectPath(panelX,panelY,panelW,panelH,28);ctx.fillStyle=panelGradient;ctx.fill();ctx.strokeStyle="#d99aff";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle="#ffd867";ctx.shadowColor="#c55cff";ctx.shadowBlur=28;ctx.font=`900 ${Math.min(58,canvas.width*.075)}px Arial`;ctx.fillText("GAME CLEAR",centerX,panelY+82);
    ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="bold 22px Arial";ctx.fillText("세 명의 보스를 모두 처치했습니다",centerX,panelY+126);
    const statY=panelY+176,statGap=Math.min(250,panelW*.42);
    ctx.fillStyle="rgba(255,255,255,.06)";roundedRectPath(centerX-statGap-6,statY-24,statGap*2+12,88,18);ctx.fill();
    ctx.fillStyle="#cbb8dc";ctx.font="bold 14px Arial";ctx.fillText("처치한 좀비",centerX-statGap/2,statY);ctx.fillText("최종 점수",centerX+statGap/2,statY);
    ctx.fillStyle="#fff";ctx.font="900 31px Arial";ctx.fillText(player.kills.toLocaleString(),centerX-statGap/2,statY+42);ctx.fillStyle="#ffd867";ctx.fillText(player.score.toLocaleString(),centerX+statGap/2,statY+42);
    ctx.strokeStyle="rgba(217,154,255,.28)";ctx.beginPath();ctx.moveTo(centerX,statY-12);ctx.lineTo(centerX,statY+52);ctx.stroke();
    ctx.fillStyle="#bdb7c8";ctx.font="18px Arial";ctx.fillText("ENTER 키로 다시 시작",centerX,panelY+318);
  }
  ctx.restore();
}
