// Oblivion: a sealed calamity. Combat state is independent of the art-only layer.
const OBLIVION_CD = { q: 210, e: 360, x: 42, r: 2100 };
const OBLIVION_LIMITS = { projectiles: 128, casts: 40, effects: 160, echoes: 32 };
// Deliberately high base coefficients: this kit starts powerful without an
// uncapped permanent damage multiplier or any boss maximum-health execution.
const OBLIVION_POWER = { shard: 3.2, slash: 12, tearOpen: 8, tearClose: 12,
  empoweredTearOpen: 12, empoweredTearClose: 18, implosion: 8,
  grasp: 20, empoweredGrasp: 28, overhead: 18, finaleOpen: 50, finaleClose: 30, echo: .72 };
const OBLIVION_GAUGE_MAX = 100, OBLIVION_FORM_MIN = 20, OBLIVION_FORM_DRAIN = .1;
let oblivionState;

function resetOblivionCombat() {
  oblivionState = {
    gauge: 0, shield: 0, shieldTime: 0, empowered: false,
    ultimateTime: 0, ultimateMax: 600, formBlend: 0, frame: 0,
    shots: 0, castId: 0, lastAngle: 0, hitGaugeFrame: -1, hitGaugeEarned: 0,
    projectiles: [], casts: [], effects: [], echoes: [], awardedKills: new WeakSet(),
    avatarX: player.x, avatarY: player.y - 65, avatarPulse: 0,
    message: '적중으로 붕괴 축적 · X 봉인 해제', messageTime: 180
  };
  for (const key of ['q', 'e', 'x', 'r']) player['oblivion' + key + 'Cooldown'] = 0;
}

function oblivionEmpowered() { return oblivionState.empowered || oblivionState.ultimateTime > 0; }
function oblivionAim() {
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y;
  return Math.hypot(dx, dy) > .001 ? Math.atan2(dy, dx) : oblivionState.lastAngle;
}
function oblivionMessage(text) { oblivionState.message = text; oblivionState.messageTime = 150; }
function oblivionEffect(kind, x, y, r = 60, extra = {}) {
  const s = oblivionState;
  const effect = { kind, type: kind, x, y, r, a: s.lastAngle, age: 0, life: 36, maxLife: 36, seed: s.frame, ...extra };
  if (s.effects.length >= OBLIVION_LIMITS.effects) s.effects.shift();
  s.effects.push(effect);
  return effect;
}
function oblivionPower(multiplier) { return scaledDamage(player.damage * multiplier); }
function oblivionGainGauge(amount, fromHit = false) {
  const s = oblivionState;
  if (fromHit) {
    if (s.hitGaugeFrame !== s.frame) { s.hitGaugeFrame = s.frame; s.hitGaugeEarned = 0; }
    amount = Math.max(0, Math.min(amount, 12 - s.hitGaugeEarned));
    s.hitGaugeEarned += amount;
  }
  s.gauge = Math.max(0, Math.min(OBLIVION_GAUGE_MAX, s.gauge + amount));
}
function oblivionAwardKill(z) {
  const s = oblivionState;
  if (!z || !zombies.includes(z) || s.awardedKills.has(z)) return false;
  s.awardedKills.add(z);
  oblivionGainGauge(5);
  s.shield = Math.min(player.maxHp * .5, s.shield + player.maxHp * .08);
  s.shieldTime = 300;
  oblivionEffect('shield', player.x, player.y, 56, { life: 24, maxLife: 24 });
  return true;
}
function oblivionDamage(z, amount) {
  // Query the live index at the moment of death: explosion augments may already
  // have removed several neighbours from a caller's snapshot of the encounter.
  if (!z || z.hp <= 0 || !Number.isFinite(amount) || amount <= 0 || !zombies.includes(z)) return false;
  z.hp -= amount;
  oblivionGainGauge(2, true);
  if (z.hp <= 0) {
    const index = zombies.indexOf(z);
    if (index >= 0) killZombie(index, z);
  }
  return true;
}
function oblivionSegmentDistance(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq)) : 0;
  return Math.hypot(x - x1 - dx * t, y - y1 - dy * t);
}
function oblivionLine(x, y, a, length) {
  return { x1: x, y1: y, x2: x + Math.cos(a) * length, y2: y + Math.sin(a) * length, a };
}
function oblivionHitLines(lines, width, power) {
  const amount = oblivionPower(power);
  for (const z of [...zombies]) {
    if (z.hp <= 0 || !lines.some(l => oblivionSegmentDistance(z.x, z.y, l.x1, l.y1, l.x2, l.y2) <= width + (z.r || 0))) continue;
    oblivionDamage(z, amount);
  }
}
function oblivionHitCircle(x, y, r, power) {
  const amount = oblivionPower(power);
  for (const z of [...zombies]) if (Math.hypot(z.x - x, z.y - y) <= r + (z.r || 0)) oblivionDamage(z, amount);
}
function oblivionCanDisplace(z) { return !z.boss && !z.isRaidBoss && !z.isBossMinion && !z.astraControl; }
function oblivionSpawnShard(x, y, a, power = OBLIVION_POWER.shard, echo = false) {
  const s = oblivionState;
  if (s.projectiles.length >= OBLIVION_LIMITS.projectiles) s.projectiles.shift();
  s.projectiles.push({ kind: 'shard', x, y, a, r: 13, radius: 13, speed: 27, distance: 0, range: 1050,
    power, damage: oblivionPower(power), echo, age: 0, life: 42, maxLife: 42, hits: new Set(), trail: [] });
  oblivionEffect('shardCast', x, y, 40, { a, echo, life: 20, maxLife: 20 });
}
function oblivionSlash(x, y, a, power = OBLIVION_POWER.slash, echo = false) {
  const reach = 300, arc = 2.25, amount = oblivionPower(power);
  for (const z of [...zombies]) {
    const dx = z.x - x, dy = z.y - y, d = Math.hypot(dx, dy), zr = z.r || 0;
    const delta = Math.atan2(Math.sin(Math.atan2(dy, dx) - a), Math.cos(Math.atan2(dy, dx) - a));
    // Include targets whose actual collision circle intersects a wedge edge.
    const padding = d > zr ? Math.asin(Math.min(1, zr / d)) : Math.PI;
    if (d <= reach + zr && Math.abs(delta) <= arc / 2 + padding) oblivionDamage(z, amount);
  }
  oblivionEffect('slash', x, y, reach, { a, reach, arc, echo, empowered: true, life: 22, maxLife: 22 });
}
function oblivionQueueEcho(kind, data) {
  const s = oblivionState;
  if (s.ultimateTime <= 0) return;
  if (s.echoes.length >= OBLIVION_LIMITS.echoes) s.echoes.shift();
  s.echoes.push({ kind, x: player.x, y: player.y, a: s.lastAngle, delay: 18, age: 0, empowered: true, ...data });
}
function attackWithOblivion() {
  if (player.fireCooldown > 0) return false;
  const s = oblivionState, a = oblivionAim(), empowered = oblivionEmpowered();
  s.lastAngle = a; s.shots++;
  if (empowered) oblivionSlash(player.x, player.y, a);
  else for (const offset of [-20, 0, 20]) oblivionSpawnShard(player.x - Math.sin(a) * offset, player.y + Math.cos(a) * offset, a);
  oblivionQueueEcho('basic', { a });
  player.fireCooldown = Math.max(11, (empowered ? 16 : 20) - (player.fireRateBonus || 0));
  return true;
}
function oblivionCreateTear(x, y, a, empowered, power = 1, echo = false, finale = false) {
  const s = oblivionState, length = finale ? 1500 : empowered ? 1120 : 1020, width = finale ? 180 : empowered ? 56 : 48;
  const lines = (empowered && !finale ? [-.20, 0, .20] : [0]).map(offset => oblivionLine(x, y, a + offset, length));
  const cast = { kind: finale ? 'finale' : 'tear', x, y, a, age: 0, life: finale ? 84 : 66, maxLife: finale ? 84 : 66,
    empowered, echo, power, length, width, r: width, lines, closeAt: finale ? 32 : 26, closed: false, castId: ++s.castId };
  if (s.casts.length >= OBLIVION_LIMITS.casts) s.casts.shift();
  s.casts.push(cast);
  // The three-prong overlap is one hit per phase, never three hits on a boss.
  oblivionHitLines(lines, width, (finale ? OBLIVION_POWER.finaleOpen : empowered ? OBLIVION_POWER.empoweredTearOpen : OBLIVION_POWER.tearOpen) * power);
  oblivionEffect(finale ? 'finale' : 'tearOpen', x, y, length, { a, length, width, empowered, echo, life: 32, maxLife: 32 });
  return cast;
}
function activateOblivionQ() {
  if (player.oblivionqCooldown > 0) return false;
  const a = oblivionAim(); oblivionState.lastAngle = a;
  oblivionCreateTear(player.x, player.y, a, oblivionEmpowered());
  oblivionQueueEcho('q', { a });
  player.oblivionqCooldown = OBLIVION_CD.q;
  return true;
}
function oblivionTargetPoint(range = 600) {
  const a = oblivionAim(), distance = Math.min(range, Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y));
  return { x: player.x + Math.cos(a) * distance, y: player.y + Math.sin(a) * distance, a };
}
function oblivionCreateGrasp(x, y, a, empowered, power = 1, echo = false) {
  const s = oblivionState, r = empowered ? 255 : 205;
  const cast = { kind: 'grasp', x, y, a, r, radius: r, age: 0, life: empowered ? 86 : 68, maxLife: empowered ? 86 : 68,
    empowered, echo, power, impactAt: 34, overheadAt: 52, impacted: false, overhead: false, castId: ++s.castId };
  if (s.casts.length >= OBLIVION_LIMITS.casts) s.casts.shift();
  s.casts.push(cast);
  oblivionEffect('graspCast', x, y, r, { a, empowered, echo, life: 34, maxLife: 34 });
  return cast;
}
function activateOblivionE() {
  if (player.oblivioneCooldown > 0) return false;
  const target = oblivionTargetPoint(); oblivionState.lastAngle = target.a;
  oblivionCreateGrasp(target.x, target.y, target.a, oblivionEmpowered());
  oblivionQueueEcho('e', target);
  player.oblivioneCooldown = OBLIVION_CD.e;
  return true;
}
function activateOblivionX() {
  const s = oblivionState;
  if (s.ultimateTime > 0) { oblivionMessage('종언의 현현 중 · 완전 해방 유지'); return false; }
  // Turning the form off is always available and never spends the remainder.
  if (s.empowered) {
    s.empowered = false; player.oblivionxCooldown = OBLIVION_CD.x;
    oblivionEffect('formOff', player.x, player.y, 120, { life: 42, maxLife: 42 });
    oblivionMessage('재봉인 · 남은 붕괴 보존'); return true;
  }
  if (player.oblivionxCooldown > 0) return false;
  if (s.gauge < OBLIVION_FORM_MIN) { oblivionMessage('붕괴 20 이상에서 봉인 해제'); return false; }
  s.empowered = true; player.oblivionxCooldown = OBLIVION_CD.x;
  oblivionEffect('formOn', player.x, player.y, 210, { life: 54, maxLife: 54 });
  oblivionMessage('봉인 해제 · 초당 붕괴 6 소모'); return true;
}
function activateOblivionR() {
  const s = oblivionState;
  if (player.level < 10 || player.oblivionrCooldown > 0 || s.ultimateTime > 0) return false;
  s.ultimateTime = s.ultimateMax; s.lastAngle = oblivionAim();
  s.avatarX = player.x - Math.cos(s.lastAngle) * 65; s.avatarY = player.y - Math.sin(s.lastAngle) * 65;
  s.avatarPulse = 36; s.echoes.length = 0;
  player.oblivionrCooldown = OBLIVION_CD.r;
  oblivionEffect('ultimateOpen', player.x, player.y, 460, { a: s.lastAngle, life: 90, maxLife: 90 });
  oblivionMessage('종언의 현현 · 10초 완전 해방 / 거수 동조'); return true;
}

function oblivionUpdateProjectiles() {
  const s = oblivionState, targets = [...zombies];
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i], old = { x: p.x, y: p.y }, step = Math.min(p.speed, p.range - p.distance);
    p.x += Math.cos(p.a) * step; p.y += Math.sin(p.a) * step; p.distance += step; p.age++; p.life--;
    p.trail.push(old); if (p.trail.length > 9) p.trail.shift();
    for (const z of targets) {
      if (z.hp <= 0 || p.hits.has(z) || oblivionSegmentDistance(z.x, z.y, old.x, old.y, p.x, p.y) > p.r + (z.r || 0)) continue;
      p.hits.add(z);
      if (oblivionDamage(z, p.damage, p)) oblivionEffect('hit', z.x, z.y, 30, { a: p.a, life: 18, maxLife: 18 });
    }
    if (p.life <= 0 || p.distance >= p.range) s.projectiles.splice(i, 1);
  }
}
function oblivionUpdateCasts() {
  const s = oblivionState;
  for (let i = s.casts.length - 1; i >= 0; i--) {
    const c = s.casts[i]; c.age++; c.life--;
    if (c.kind === 'tear' || c.kind === 'finale') {
      if (!c.closed && c.age >= c.closeAt) {
        c.closed = true;
        oblivionHitLines(c.lines, c.width, (c.kind === 'finale' ? OBLIVION_POWER.finaleClose : c.empowered ? OBLIVION_POWER.empoweredTearClose : OBLIVION_POWER.tearClose) * c.power, c);
        oblivionEffect('tearClose', c.x, c.y, c.length, { a: c.a, length: c.length, width: c.width, empowered: c.empowered, echo: c.echo });
        if (c.empowered && c.kind !== 'finale') {
          const tips = c.lines.map(l => ({ x: l.x2, y: l.y2 })), radius = 170;
          // End explosions overlap visually, but still share one damage budget.
          const amount = oblivionPower(OBLIVION_POWER.implosion * c.power);
          for (const z of [...zombies]) if (tips.some(t => Math.hypot(z.x - t.x, z.y - t.y) <= radius + (z.r || 0))) oblivionDamage(z, amount, c, {kind:"skill",area:true});
          for (const t of tips) oblivionEffect('implosion', t.x, t.y, radius, { a: c.a, echo: c.echo, life: 42, maxLife: 42 });
        }
      }
    } else if (c.kind === 'grasp') {
      if (c.age >= 10 && c.age < c.impactAt) {
        for (const z of zombies) {
          if (z.hp <= 0 || !oblivionCanDisplace(z)) continue;
          const dx = c.x - z.x, dy = c.y - z.y, d = Math.hypot(dx, dy), rest = 18 + (z.r || 0);
          if (d > rest && d <= c.r + (z.r || 0)) {
            const step = Math.min(d - rest, c.empowered ? 12 : 9);
            z.x += dx / d * step; z.y += dy / d * step;
            z.slowTime = Math.max(z.slowTime || 0, 8);
          }
        }
      }
      if (!c.impacted && c.age >= c.impactAt) {
        c.impacted = true; oblivionHitCircle(c.x, c.y, c.r, (c.empowered ? OBLIVION_POWER.empoweredGrasp : OBLIVION_POWER.grasp) * c.power, c);
        oblivionEffect('graspImpact', c.x, c.y, c.r, { a: c.a, empowered: c.empowered, echo: c.echo, life: 40, maxLife: 40 });
      }
      if (c.empowered && !c.overhead && c.age >= c.overheadAt) {
        c.overhead = true; oblivionHitCircle(c.x, c.y, c.r, OBLIVION_POWER.overhead * c.power, c);
        oblivionEffect('overhead', c.x, c.y, c.r, { a: c.a, empowered: true, echo: c.echo, life: 42, maxLife: 42 });
      }
    }
    if (c.life <= 0) s.casts.splice(i, 1);
  }
}
function oblivionUpdateEchoes() {
  const s = oblivionState;
  for (let i = s.echoes.length - 1; i >= 0; i--) {
    const e = s.echoes[i]; e.age++;
    if (e.age < e.delay) continue;
    s.echoes.splice(i, 1);
    if (s.ultimateTime <= 0) continue;
    s.avatarPulse = 24;
    // Replays call the geometry directly, so a replay can never queue a replay.
    if (e.kind === 'basic') oblivionSlash(s.avatarX, s.avatarY, e.a, OBLIVION_POWER.slash * OBLIVION_POWER.echo, true);
    else if (e.kind === 'q') oblivionCreateTear(s.avatarX, s.avatarY, e.a, true, OBLIVION_POWER.echo, true);
    else if (e.kind === 'e') oblivionCreateGrasp(e.x, e.y, e.a, true, OBLIVION_POWER.echo, true);
    oblivionEffect('avatarEcho', s.avatarX, s.avatarY, 160, { a: e.a, echoKind: e.kind, life: 24, maxLife: 24 });
  }
}
function updateOblivionCombat() {
  if (selectedCharacter !== 'oblivion') return;
  const s = oblivionState; s.frame++;
  for (const key of ['q', 'e', 'x', 'r']) if (player['oblivion' + key + 'Cooldown'] > 0) player['oblivion' + key + 'Cooldown']--;
  if (s.messageTime > 0) s.messageTime--;
  if (s.avatarPulse > 0) s.avatarPulse--;
  if (s.shieldTime > 0 && --s.shieldTime === 0) s.shield = 0;
  s.shield = Math.min(s.shield, player.maxHp * .5);
  if (s.ultimateTime <= 0 && s.empowered) {
    s.gauge = Math.max(0, s.gauge - OBLIVION_FORM_DRAIN);
    if (s.gauge <= 1e-8) {
      s.gauge = 0; s.empowered = false;
      oblivionEffect('formOff', player.x, player.y, 120, { life: 42, maxLife: 42 });
      oblivionMessage('붕괴 소진 · 봉인 복구');
    }
  }
  s.lastAngle = oblivionAim();
  s.avatarX += (player.x - Math.cos(s.lastAngle) * 65 - s.avatarX) * .16;
  s.avatarY += (player.y - Math.sin(s.lastAngle) * 65 - s.avatarY) * .16;
  oblivionUpdateProjectiles(); oblivionUpdateCasts(); oblivionUpdateEchoes();
  if (s.ultimateTime > 0 && --s.ultimateTime === 0) {
    s.echoes.length = 0;
    oblivionCreateTear(player.x, player.y, s.lastAngle, true, 1, false, true);
    oblivionMessage('종언의 절개 · 현현 종료');
  }
  const target = oblivionEmpowered() ? 1 : 0;
  s.formBlend += (target - s.formBlend) * (target ? .12 : .065);
  if (Math.abs(s.formBlend - target) < .002) s.formBlend = target;
  for (let i = s.effects.length - 1; i >= 0; i--) {
    const e = s.effects[i]; e.age++; if (--e.life <= 0) s.effects.splice(i, 1);
  }
}

// Deferred files can finish downloading across different animation frames.
// Give the UI a valid initial state before its late integration hooks arrive.
resetOblivionCombat();
