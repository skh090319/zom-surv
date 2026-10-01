// Astra: real orbit slots, returning constellation volleys and gravity capture.
let astraMeteors = [], astraWells = [], astraEffects = [], astraDust = [];
let astraGravity = null, astraFrame = 0, astraFxBudget = 0;
let astraWake = [];
let astraRewardedKills = new WeakSet(), astraOrbitPrevious = new Map(), astraEnemyPrevious = new WeakMap();
const ASTRA_Q_CD = 240, ASTRA_E_CD = 510, ASTRA_X_CD = 780, ASTRA_R_CD = 1680;
const ASTRA_R_DURATION = 360, ASTRA_R_LIFT = 42, ASTRA_R_FLIGHT = 980;
const ASTRA_R_CONSTELLATION_FORM = 26, ASTRA_R_CONSTELLATION_HOLD = 10;
const ASTRA_CONSTELLATION_VERTICES = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 99 : 220;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
});
const ASTRA_REALM_FADE_IN = 54, ASTRA_REALM_FADE_OUT = 60;
// Independent balance knobs: do not multiply the shared player.damage stat.
const ASTRA_BASIC_DAMAGE_MULTIPLIER = 2, ASTRA_ORBIT_DAMAGE_MULTIPLIER = 6, ASTRA_WELL_PULL_MULTIPLIER = 12;
const ASTRA_PASSIVE_ORBIT_KNOCKBACK = 18;
const ASTRA_WELL_PULL_RANGE_MULTIPLIER = 1.6, ASTRA_PROJECTILE_ABSORB_DURATION = 60;

function resetAstra() {
  if (astraGravity) for (const b of astraGravity.bodies) astraReleaseBody(b);
  astraMeteors = []; astraWells = []; astraEffects = []; astraDust = [];
  astraGravity = null; astraFrame = 0; astraFxBudget = 0;
  astraWake = [];
  astraRewardedKills = new WeakSet(); astraOrbitPrevious = new Map(); astraEnemyPrevious = new WeakMap();
  player.astraStardust = 0; player.astraUltimateCasts = 0;
  for (const k of ["QCooldown", "ECooldown", "XCooldown", "RCooldown", "OverdriveTime", "OrbitBlend", "OrbitAngle", "OrbitTick", "RedLevel", "BlueLevel", "HorizonLevel"]) player[`astra${k}`] = 0;
}
function onAstraEnemyKilled(z) {
  if (selectedCharacter !== "astra" || !z || z.hp > 0 || astraRewardedKills.has(z)) return;
  astraRewardedKills.add(z);
  player.astraStardust = (player.astraStardust || 0) + 1;
}
function astraScaledDamage(baseDamage) {
  // Stardust empowers Astra's own attacks, never damage dealt by augments.
  return scaledDamage(baseDamage) * (typeof getAstraStardustMultiplier === "function" ? getAstraStardustMultiplier() : 1);
}
function astraDamage(z, amount) {
  if (!z || z.hp <= 0 || !zombies.includes(z)) return false;
  z.hp -= amount;
  if (z.hp <= 0) { const i = zombies.indexOf(z); if (i >= 0) killZombie(i, z); return true; }
  return false;
}
function astraOrbitCount() { return 3 + (player.astraBlueLevel || 0) + (transcended.astraBlue ? 2 : 0); }
function astraOrbitTarget() { return player.astraOverdriveTime > 0 ? 1 : 0; }
function astraOrbitRadius() { return 120 + (player.astraRedLevel || 0) * 6 + (player.astraOrbitBlend || 0) * (82 + (player.astraHorizonLevel || 0) * 8); }
function astraOrbitSpeed() { return .026 + (player.astraBlueLevel || 0) * .003 + (player.astraOrbitBlend || 0) * .052; }
function astraQGeometry() {
  const boosted = player.astraOverdriveTime > 0;
  return { range: 590 + (player.astraRedLevel || 0) * 24, spread: boosted ? .30 : .21, radius: boosted ? 22 : 16, speed: boosted ? 18 : 14 };
}
function astraERadius() { return (85 + (player.astraHorizonLevel || 0) * 18) * (1 + Math.max(0, player.astraStardust || 0) * .01); }
function astraEPullRadius() { return astraERadius() * ASTRA_WELL_PULL_RANGE_MULTIPLIER; }
function astraWellPulling(w) { return w.maxLife - w.life >= 24 && w.life > 24; }
function astraEnemyMoveScale(z) {
  if (selectedCharacter !== "astra" || !z || z.astraControl) return 1;
  if (astraGravity?.state === "orbit") return .1;
  if (z.isRaidBoss && astraWells.some(w => astraWellPulling(w) && Math.hypot(z.x - w.x, z.y - w.y) <= astraEPullRadius() + z.r)) return .35;
  return 1;
}
// A captured hostile projectile becomes harmless immediately. Its spiral and
// one-second lifetime continue even if its source boss or well disappears.
function astraAbsorbRaidProjectile(p) {
  if (selectedCharacter !== "astra") return false;
  if (!p.astraAbsorb) {
    if (!["venom", "venomSmall", "vine", "scythe", "abyssOrb"].includes(p.type)) return false;
    let nearest = null, best = Infinity;
    for (const w of astraWells) {
      if (!astraWellPulling(w)) continue;
      const d = astraSegmentDistance(w.x, w.y, p.x, p.y, p.x + (p.vx || 0), p.y + (p.vy || 0));
      if (d <= astraEPullRadius() + p.r && d < best) { nearest = w; best = d; }
    }
    if (!nearest) return false;
    p.astraAbsorb = { age: 0, wellX: nearest.x, wellY: nearest.y, radius: Math.hypot(p.x - nearest.x, p.y - nearest.y), angle: Math.atan2(p.y - nearest.y, p.x - nearest.x), baseR: p.r };
    p.hit = true;
  }
  const a = p.astraAbsorb, t = Math.min(1, ++a.age / ASTRA_PROJECTILE_ABSORB_DURATION), ease = astraEase(t);
  const radius = a.radius * (1 - ease), angle = a.angle + t * Math.PI * 2;
  p.x = a.wellX + Math.cos(angle) * radius; p.y = a.wellY + Math.sin(angle) * radius;
  p.r = a.baseR * (1 - .8 * ease); p.spin = (p.spin || 0) + .22;
  if (t >= 1) { p.life = 0; astraImpact("catch", a.wellX, a.wellY, 30); }
  return true;
}
function astraRRadius() { return 620 + (player.astraRedLevel || 0) * 28; }
function astraQFlights() { return astraMeteors.filter(m => m.kind === "orbit"); }
function astraQPaths(aim) {
  const count = astraOrbitCount(), shape = astraQGeometry();
  return Array.from({ length: count }, (_, slot) => {
    const start = astraOrbitSlot(slot, count), a = aim + (slot / Math.max(1, count - 1) - .5) * shape.spread;
    return { ...start, a, slot, count, endX: player.x + Math.cos(a) * shape.range, endY: player.y + Math.sin(a) * shape.range };
  });
}
function astraOrbitSlot(slot, count = astraOrbitCount()) {
  const a = (player.astraOrbitAngle || 0) + slot * Math.PI * 2 / count, r = astraOrbitRadius();
  return { x: player.x + Math.cos(a) * r, y: player.y + Math.sin(a) * r, a };
}
function astraCanCapture(z) { return z.hp > 0 && !z.isRaidBoss && !z.isBossMinion && !z.astraControl; }
function astraControlled(z) { return selectedCharacter === "astra" && Boolean(z.astraControl); }
function astraEase(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function astraBackdropProgress() {
  const g = astraGravity;
  if (selectedCharacter !== "astra" || screenMode !== "game" || !g || g.state !== "orbit") return 0;
  // Radial expansion/retraction fits inside R's six-second capture phase.
  // Game ticks freeze the transition during pause and upgrade selection.
  const fadeIn = astraEase(Math.min(g.age, g.backdropReadyAge) / ASTRA_REALM_FADE_IN);
  return fadeIn * astraEase((ASTRA_R_DURATION - g.age) / ASTRA_REALM_FADE_OUT);
}
function astraClampPosition(x, y, r = 12) {
  if (typeof WORLD === "undefined") return { x, y };
  return { x: Math.max(r, Math.min(WORLD.width - r, x)), y: Math.max(r, Math.min(WORLD.height - r, y)) };
}
function astraPassiveOrbitKnockback(z, star) {
  if (!z || z.hp <= 0 || z.isRaidBoss || z.isBossMinion || z.astraControl) return;
  const dx = z.x - player.x, dy = z.y - player.y, d = Math.hypot(dx, dy);
  const fallback = star?.a || 0, nx = d > .001 ? dx / d : Math.cos(fallback), ny = d > .001 ? dy / d : Math.sin(fallback);
  Object.assign(z, astraClampPosition(z.x + nx * ASTRA_PASSIVE_ORBIT_KNOCKBACK, z.y + ny * ASTRA_PASSIVE_ORBIT_KNOCKBACK, z.r));
}
function astraSegmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}
function astraTrail(entity, limit = 22) {
  const trail = entity.trail ||= [];
  // Recycle the oldest sample after warm-up: same complete trail, no per-tick
  // position garbage for every orbiting or flying celestial body.
  const recycle = trail.length >= limit && trail.length > 0;
  const point = recycle ? trail.shift() : {};
  point.x = entity.x; point.y = entity.y; trail.push(point);
  if (!recycle && trail.length > limit) trail.shift();
}

// Bounded visual allocation, independent of the number of combat targets.
function astraImpact(type, x, y, r = 60) {
  if (astraFxBudget >= 12 && type !== "collapse" && type !== "release") return;
  // Many bodies can hit the same boss together. Their damage is independent,
  // but overlapping fresh shockwaves merge instead of bleaching the whole boss.
  if ((type === "impact" || type === "collision") && astraEffects.some(e => e.type === type && e.life > e.maxLife * .65 && Math.hypot(e.x - x, e.y - y) < r * .6)) return;
  astraFxBudget++;
  const life = type === "collapse" || type === "impact" ? 48 : 26;
  astraEffects.push({ type, x, y, r, life, maxLife: life, seed: Math.random() * 100 });
  const count = type === "collapse" || type === "impact" ? 28 : 7;
  for (let i = 0; i < count && astraDust.length < 260; i++) {
    const a = Math.random() * Math.PI * 2, speed = (type === "impact" ? 3 : 1.4) + Math.random() * r * .06;
    astraDust.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 20 + Math.random() * 28, maxLife: 48, size: 1 + Math.random() * 2.8, gold: i % 3 === 0 });
  }
  if (astraEffects.length > 64) astraEffects.splice(0, astraEffects.length - 64);
}
function attackWithAstra() {
  if (player.fireCooldown > 0) return;
  const a = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  astraMeteors.push({ x: player.x, y: player.y, a, speed: 13, curve: (Math.random() - .5) * .014, life: 72, damage: astraScaledDamage(player.damage * 1.02 * ASTRA_BASIC_DAMAGE_MULTIPLIER), r: 10, kind: "shot", trail: [], hits: new Set() });
  player.fireCooldown = Math.max(11, 24 - (player.fireRateBonus || 0) * 2);
}
function activateAstraQ() {
  const flights = astraQFlights();
  if (flights.length) { for (const star of flights) star.returning = true; return; }
  if (player.astraQCooldown > 0) return;
  const aim = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x), shape = astraQGeometry();
  for (const start of astraQPaths(aim)) {
    astraMeteors.push({ ...start,
      speed: shape.speed, r: shape.radius, damage: astraScaledDamage(player.damage * (1.05 + (player.astraRedLevel || 0) * .12) * ASTRA_ORBIT_DAMAGE_MULTIPLIER),
      kind: "orbit", returning: false, age: 0, trail: [], outwardHits: new Set(), returnHits: new Set() });
    astraImpact("launch", start.x, start.y, 34);
  }
  player.astraQCooldown = ASTRA_Q_CD;
}
function activateAstraE() {
  if (player.astraECooldown > 0) return;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y, d = Math.hypot(dx, dy) || 1, range = Math.min(520, d);
  const p = astraClampPosition(player.x + dx / d * range, player.y + dy / d * range);
  astraWells.push({ ...p, r: astraERadius(), pullR: astraEPullRadius(), life: 270, maxLife: 270, tick: 1, phase: 0 });
  astraImpact("wellBorn", p.x, p.y, astraERadius()); player.astraECooldown = ASTRA_E_CD;
}
function activateAstraX() {
  if (player.astraXCooldown > 0) return;
  player.astraOverdriveTime = 480 + (player.astraBlueLevel || 0) * 45;
  astraImpact("expand", player.x, player.y, astraOrbitRadius()); player.astraXCooldown = ASTRA_X_CD;
}
function activateAstraR() {
  if (player.level < 10 || player.astraRCooldown > 0 || astraGravity) return;
  player.astraUltimateCasts = (player.astraUltimateCasts || 0) + 1;
  const targets = zombies.filter(z => astraCanCapture(z) && Math.hypot(z.x - player.x, z.y - player.y) <= astraRRadius() + z.r);
  const count = targets.length || Math.max(5, astraOrbitCount());
  astraGravity = { age: 0, backdropReadyAge: 0, constellationProgress: 0, state: "orbit", x: player.x, y: player.y, launchAge: 0, radius: astraRRadius(), bossSpent: new Map(), bodies: [] };
  for (let i = 0; i < count; i++) {
    const z = targets[i] || null, ring = i % 3;
    const b = { zombie: z, virtual: !z, ring, index: i, a: i * 2.399963, x: z ? z.x : player.x, y: z ? z.y : player.y,
      startX: z ? z.x : player.x, startY: z ? z.y : player.y, r: z ? z.r : 19, lift: 0,
      state: "orbit", collisionCooldown: 0, trail: [], travel: 0 };
    if (z) z.astraControl = b;
    astraGravity.bodies.push(b);
  }
  astraImpact("capture", player.x, player.y, astraRRadius()); player.astraRCooldown = ASTRA_R_CD;
}
function astraReleaseBody(b) {
  if (b.zombie && b.zombie.astraControl === b) {
    delete b.zombie.astraControl;
    Object.assign(b.zombie, astraClampPosition(b.zombie.x, b.zombie.y, b.zombie.r));
  }
}
function astraDetachDeadBody(b, living) {
  if (b.zombie && (b.zombie.hp <= 0 || !living.has(b.zombie))) {
    astraReleaseBody(b); b.zombie = null; b.virtual = true;
  }
}
function astraGravityOrbitPoint(b, g) {
  const radius = (125 + b.ring * 51) * (1 + (player.astraOrbitBlend || 0) * .32), tilt = b.ring * Math.PI / 3;
  const ox = Math.cos(b.a) * radius, oy = Math.sin(b.a) * radius * .57;
  return { x: g.x + ox * Math.cos(tilt) - oy * Math.sin(tilt), y: g.y + ox * Math.sin(tilt) + oy * Math.cos(tilt) - 38 };
}
function astraConstellationPoint(index, count, g) {
  // Equal-length star edges keep dense captures evenly spaced. Five virtual
  // bodies land on the five outer tips; the VFX uses this same cached outline.
  const u = index / Math.max(1, count) * 10, edge = Math.floor(u), t = u - edge;
  const a = ASTRA_CONSTELLATION_VERTICES[edge % 10], b = ASTRA_CONSTELLATION_VERTICES[(edge + 1) % 10];
  return { x: g.x + a.x + (b.x - a.x) * t, y: g.y - 38 + a.y + (b.y - a.y) * t };
}
function launchAstraGravity() {
  const g = astraGravity;
  if (!g || g.state !== "orbit") return;
  const a = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x), d = Math.max(320, Math.min(850, Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y)));
  g.state = "launch"; g.launchAge = 0; g.aim = a;
  g.targetX = player.x + Math.cos(a) * d; g.targetY = player.y + Math.sin(a) * d;
  for (const b of g.bodies) b.delay = b.index / Math.max(1, g.bodies.length - 1) * 24;
  astraImpact("release", player.x, player.y - 38, 205);
}
function astraFindMeteorTarget(b, targets) {
  let closest = null, distanceSq = (ASTRA_R_FLIGHT * 1.2) ** 2;
  for (const z of targets) {
    if (z.hp <= 0 || z.astraControl) continue;
    const dx = z.x - b.x, dy = z.y - b.y, d = dx * dx + dy * dy;
    if (d < distanceSq) { distanceSq = d; closest = z; }
  }
  return closest;
}
function astraDetonateBody(b, g) {
  if (b.state === "done") return;
  b.state = "done";
  const radius = 112 + (player.astraRedLevel || 0) * 13 + (transcended.astraRed ? 35 : 0);
  astraImpact("impact", b.x, b.y, radius);
  const scale = Math.min(1, 3 / Math.sqrt(g.bodies.length));
  for (const z of [...zombies]) {
    if (z.hp <= 0 || (z.astraControl && z !== b.zombie) || Math.hypot(z.x - b.x, z.y - b.y) > radius + z.r) continue;
    let extra = 0;
    if (z.isRaidBoss) {
      const total = .045 + (player.astraHorizonLevel || 0) * .006, spent = g.bossSpent.get(z) || 0;
      const ratio = Math.max(0, Math.min(total - spent, total / g.bodies.length));
      // R explicitly includes true boss max-health damage. Share one budget across
      // the entire volley so capturing a crowd cannot multiply it into a one-shot.
      extra = Math.max(0, z.maxHp || 0) * ratio * (typeof getAstraStardustMultiplier === "function" ? getAstraStardustMultiplier() : 1); g.bossSpent.set(z, spent + ratio);
    }
    astraDamage(z, astraScaledDamage(player.damage * (2.5 + (player.astraRedLevel || 0) * .2) * scale) + extra);
  }
  astraReleaseBody(b);
}
function updateAstraGravity() {
  const g = astraGravity;
  if (!g) return;
  g.age++; g.x += (player.x - g.x) * .18; g.y += (player.y - g.y) * .18;
  // A slow first download must fade in too, never pop in at full opacity.
  if (typeof astraUltimateBackdrop !== "undefined" && astraUltimateBackdrop.complete && astraUltimateBackdrop.naturalWidth > 0) g.backdropReadyAge++;
  const living = new Set(zombies);
  // Homing targets are unused during the 360-tick capture phase.
  const targets = g.state === "launch" || g.age >= ASTRA_R_DURATION ? zombies.filter(z => z.hp > 0 && !z.astraControl) : null;
  for (const b of g.bodies) astraDetachDeadBody(b, living);
  if (g.state === "orbit") g.constellationProgress = astraEase((g.age - ASTRA_R_DURATION + ASTRA_R_CONSTELLATION_FORM + ASTRA_R_CONSTELLATION_HOLD) / ASTRA_R_CONSTELLATION_FORM);
  if (g.state === "orbit" && g.age >= ASTRA_R_DURATION) launchAstraGravity();
  if (g.state === "launch") g.launchAge++;
  for (const b of g.bodies) {
    if (b.state === "done") continue;
    if (b.collisionCooldown > 0) b.collisionCooldown--;
    if (g.state === "launch" && b.state === "orbit" && g.launchAge >= b.delay) {
      b.state = "flight"; b.target = astraFindMeteorTarget(b, targets);
      b.a = Math.atan2((b.target?.y ?? g.targetY) - b.y, (b.target?.x ?? g.targetX) - b.x); b.speed = 12;
    }
    if (b.state === "orbit") {
      b.a += (.028 + b.ring * .009) * (b.ring === 1 ? -1 : 1) * (1 + (player.astraOrbitBlend || 0) * .9);
      const formation = g.constellationProgress, t = astraEase(g.age / ASTRA_R_LIFT);
      let p;
      if (formation >= 1) p = astraConstellationPoint(b.index, g.bodies.length, g);
      else {
        p = astraGravityOrbitPoint(b, g);
        if (formation > 0) {
          const star = astraConstellationPoint(b.index, g.bodies.length, g);
          p.x += (star.x - p.x) * formation; p.y += (star.y - p.y) * formation;
        }
      }
      b.x = b.startX + (p.x - b.startX) * t; b.y = b.startY + (p.y - b.startY) * t; b.lift = 38 * t;
    } else {
      const px = b.x, py = b.y; b.speed = Math.min(25, b.speed + .9);
      if (b.target && (!living.has(b.target) || b.target.hp <= 0 || b.target.astraControl)) b.target = null;
      if (!b.target && g.launchAge % 6 === 0) b.target = astraFindMeteorTarget(b, targets);
      if (b.target) {
        const wanted = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        const turn = Math.atan2(Math.sin(wanted - b.a), Math.cos(wanted - b.a));
        b.a += Math.max(-.18, Math.min(.18, turn));
      }
      b.x += Math.cos(b.a) * b.speed; b.y += Math.sin(b.a) * b.speed; b.travel += b.speed;
      if (b.zombie) { b.zombie.x = b.x; b.zombie.y = b.y; }
      const hit = zombies.find(z => z.hp > 0 && !z.astraControl && astraSegmentDistance(z.x, z.y, px, py, b.x, b.y) <= z.r + b.r);
      if (hit) { b.x = hit.x; b.y = hit.y; if (b.zombie) { b.zombie.x = b.x; b.zombie.y = b.y; } }
      if (hit || b.travel >= ASTRA_R_FLIGHT) { astraDetonateBody(b, g); continue; }
    }
    if (b.zombie) { b.zombie.x = b.x; b.zombie.y = b.y; }
    astraTrail(b, b.state === "flight" ? 26 : 12);
  }
  // Damage on real contact between intersecting orbital planes, with pair cooldowns.
  if (g.state === "orbit" && g.age > ASTRA_R_LIFT) {
    const buckets = new Map(), cell = 100;
    for (const b of g.bodies) {
      const cx = Math.floor(b.x / cell), cy = Math.floor(b.y / cell);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        for (const other of buckets.get(`${cx + ox}/${cy + oy}`) || []) {
          const dx = b.x - other.x, dy = b.y - other.y, contact = b.r + other.r + 5;
          if (b.collisionCooldown || other.collisionCooldown || dx * dx + dy * dy > contact * contact) continue;
          b.collisionCooldown = other.collisionCooldown = 24;
          astraDamage(b.zombie, astraScaledDamage(player.damage * .55)); astraDamage(other.zombie, astraScaledDamage(player.damage * .55));
          astraImpact("collision", (b.x + other.x) / 2, (b.y + other.y) / 2, 48);
        }
      }
      const key = `${cx}/${cy}`; if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(b);
    }
  }
  if (g.state === "launch" && g.bodies.every(b => b.state === "done")) astraGravity = null;
}
function updateAstraMeteors() {
  for (let i = astraMeteors.length - 1; i >= 0; i--) {
    const m = astraMeteors[i], px = m.x, py = m.y;
    let arrived = false;
    if (m.kind === "orbit") {
      m.age++; if (m.age > 180) m.returning = true;
      const target = m.returning ? astraOrbitSlot(m.slot, m.count) : { x: m.endX, y: m.endY };
      const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy);
      const speed = m.returning ? Math.max(m.speed * 1.4, (player.speed || 4) * 2 + 8) : m.speed;
      m.a = Math.atan2(dy, dx); const step = Math.min(speed, d);
      m.x += Math.cos(m.a) * step; m.y += Math.sin(m.a) * step; arrived = d <= speed;
    } else { m.a += m.curve; m.x += Math.cos(m.a) * m.speed; m.y += Math.sin(m.a) * m.speed; m.life--; }
    astraTrail(m);
    let remove = m.kind === "shot" && m.life <= 0;
    // A basic bolt pierces the entire line, but each enemy is hit only once.
    // Q retains independent outward/return hit sets and has no knockback.
    const hits = m.kind === "orbit" ? (m.returning ? m.returnHits : m.outwardHits) : (m.hits ||= new Set());
    for (const z of [...zombies]) {
      if (remove || z.hp <= 0 || hits.has(z) || astraSegmentDistance(z.x, z.y, px, py, m.x, m.y) > z.r + m.r) continue;
      hits.add(z); astraDamage(z, m.damage); astraImpact("starHit", z.x, z.y, m.kind === "orbit" ? 58 : 27);
    }
    if (m.kind === "orbit" && arrived) {
      if (m.returning) { astraImpact("catch", m.x, m.y, 34); remove = true; }
      else { m.returning = true; astraImpact("turn", m.x, m.y, 42); }
    }
    if (remove) astraMeteors.splice(i, 1);
  }
}
function updateAstraWells() {
  for (let i = astraWells.length - 1; i >= 0; i--) {
    const w = astraWells[i]; w.life--; w.phase += .045;
    w.r = astraERadius(); w.pullR = astraEPullRadius();
    const pulling = astraWellPulling(w);
    if (pulling) for (const z of zombies) {
      if (z.hp <= 0 || z.isRaidBoss || z.isBossMinion || z.astraControl) continue;
      const dx = w.x - z.x, dy = w.y - z.y, d = Math.hypot(dx, dy);
      if (d > 12 && d < w.pullR + z.r) {
        const pull = Math.min(d - 12, Math.max(0, (.45 + (player.astraHorizonLevel || 0) * .09) * (1 - d / (w.r * 2)) * ASTRA_WELL_PULL_MULTIPLIER));
        z.x += dx / d * pull; z.y += dy / d * pull; z.slowTime = Math.max(z.slowTime || 0, 4);
      }
    }
    if (pulling && --w.tick <= 0) {
      w.tick = transcended.astraHorizon ? 14 : 18;
      for (const z of [...zombies]) if (z.hp > 0 && Math.hypot(z.x - w.x, z.y - w.y) <= w.r + z.r) astraDamage(z, astraScaledDamage(player.damage * (.22 + (player.astraHorizonLevel || 0) * .035)));
    }
    if (w.life <= 0) {
      astraImpact("collapse", w.x, w.y, w.r);
      for (const z of [...zombies]) if (z.hp > 0 && Math.hypot(z.x - w.x, z.y - w.y) < w.r + z.r) astraDamage(z, astraScaledDamage(player.damage * (1.5 + (player.astraHorizonLevel || 0) * .18)));
      astraWells.splice(i, 1);
    }
  }
}
function updateAstra() {
  if (selectedCharacter !== "astra") return;
  astraFrame++; astraFxBudget = 0;
  if ((player.astraStardust || 0) >= 50 && astraFrame % 2 === 0) {
    const last = astraWake[astraWake.length - 1];
    if (last && Math.hypot(player.x - last.x, player.y - last.y) > 160) astraWake = [];
    astraWake.push({ x: player.x, y: player.y + 13, born: astraFrame });
    if (astraWake.length > 24) astraWake.shift();
  }
  while (astraWake.length && astraFrame - astraWake[0].born > 48) astraWake.shift();
  for (const k of ["astraQCooldown", "astraECooldown", "astraXCooldown", "astraRCooldown", "astraOverdriveTime"]) if (player[k] > 0) player[k]--;
  const target = astraOrbitTarget(), blend = player.astraOrbitBlend || 0;
  player.astraOrbitBlend = blend + (target - blend) * (target > .5 ? .035 : .018);
  if (Math.abs(player.astraOrbitBlend - target) < .002) player.astraOrbitBlend = target;
  const previousAngle = player.astraOrbitAngle || 0;
  player.astraOrbitAngle = previousAngle + astraOrbitSpeed();
  const deployed = new Set(astraQFlights().map(m => m.slot));
  const count = astraOrbitCount(), nextOrbit = new Map();
  for (const z of zombies) if (z.astraOrbitHit > 0) z.astraOrbitHit--;
  for (let n = 0; n < count; n++) {
    if (deployed.has(n)) continue;
    const star = astraOrbitSlot(n), saved = astraOrbitPrevious.get(n);
    const angle = previousAngle + n * Math.PI * 2 / count;
    const previous = saved?.count === count ? saved : { x: player.x + Math.cos(angle) * astraOrbitRadius(), y: player.y + Math.sin(angle) * astraOrbitRadius() };
    // Teleports/newly returned slots must not produce a sweep across the map.
    const from = Math.hypot(star.x - previous.x, star.y - previous.y) < 160 ? previous : star;
    nextOrbit.set(n, { ...star, count });
    for (const z of [...zombies]) {
      if (z.hp <= 0 || z.astraOrbitHit > 0) continue;
      const oldZ = astraEnemyPrevious.get(z) || z;
      const before = Math.hypot(oldZ.x - z.x, oldZ.y - z.y) < 160 ? oldZ : z;
      const distance = astraSegmentDistance(0, 0, before.x - from.x, before.y - from.y, z.x - star.x, z.y - star.y);
      if (distance > z.r + 18 + (player.astraOrbitBlend || 0) * 4) continue;
      z.astraOrbitHit = 16;
      astraDamage(z, astraScaledDamage(player.damage * (.26 + (player.astraBlueLevel || 0) * .035) * ASTRA_ORBIT_DAMAGE_MULTIPLIER));
      astraPassiveOrbitKnockback(z, star); astraImpact("starHit", star.x, star.y, 27);
    }
  }
  astraOrbitPrevious = nextOrbit;
  updateAstraMeteors(); updateAstraWells(); updateAstraGravity();
  for (const z of zombies) {
    const previous = astraEnemyPrevious.get(z);
    if (previous) { previous.x = z.x; previous.y = z.y; }
    else astraEnemyPrevious.set(z, { x: z.x, y: z.y });
  }
  for (let i = astraEffects.length - 1; i >= 0; i--) if (--astraEffects[i].life <= 0) astraEffects.splice(i, 1);
  for (let i = astraDust.length - 1; i >= 0; i--) {
    const p = astraDust[i]; p.px = p.x; p.py = p.y; p.x += p.vx; p.y += p.vy; p.vx *= .955; p.vy *= .955;
    if (--p.life <= 0) astraDust.splice(i, 1);
  }
}
function drawAstraPortraitMedallion(cx, cy, r) {
  ctx.save();
  const halo = ctx.createRadialGradient(cx, cy, r * .3, cx, cy, r + 6);
  halo.addColorStop(0,"#375682");halo.addColorStop(.75,"#182140");halo.addColorStop(1,"rgba(142,192,255,0)");
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,r+6,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-2,0,Math.PI*2);ctx.clip();
  if(typeof astraSprite!=="undefined"&&astraSprite.complete&&astraSprite.naturalWidth){
    const sw=astraSprite.naturalWidth,sh=astraSprite.naturalHeight,side=sw*.4;
    ctx.drawImage(astraSprite,sw*.30,sh*.055,side,side,cx-r,cy-r,r*2,r*2);
  }
  ctx.restore();ctx.strokeStyle="#d8bf84";ctx.lineWidth=1.2;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="rgba(161,225,255,.7)";ctx.beginPath();ctx.arc(cx,cy,r+4,-.8,1.8);ctx.stroke();
  for(const a of [-Math.PI/2,Math.PI/2]){
    const px=cx+Math.cos(a)*(r+4),py=cy+Math.sin(a)*(r+4);
    ctx.fillStyle="#f4deb0";ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px+3,py);ctx.lineTo(px,py+4);ctx.lineTo(px-3,py);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function drawAstraCelestialPanel(x,y,w,h) {
  ctx.save();ctx.beginPath();
  const cut=Math.min(18,h*.3);
  ctx.moveTo(x+cut,y);ctx.lineTo(x+w-cut,y);ctx.lineTo(x+w,y+cut);ctx.lineTo(x+w,y+h-cut);
  ctx.lineTo(x+w-cut,y+h);ctx.lineTo(x+cut,y+h);ctx.lineTo(x,y+h-cut);ctx.lineTo(x,y+cut);ctx.closePath();
  const field=ctx.createLinearGradient(x,y,x+w,y+h);
  field.addColorStop(0,"rgba(8,19,43,.96)");field.addColorStop(.48,"rgba(39,25,76,.96)");field.addColorStop(1,"rgba(8,24,45,.97)");
  ctx.fillStyle=field;ctx.fill();ctx.strokeStyle="#b9a576";ctx.lineWidth=1.2;ctx.stroke();ctx.clip();
  const cloud=ctx.createRadialGradient(x+w*.38,y+h*.8,0,x+w*.38,y+h*.8,w*.48);
  cloud.addColorStop(0,"rgba(139,100,222,.17)");cloud.addColorStop(.5,"rgba(64,133,184,.08)");cloud.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=cloud;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="rgba(171,205,243,.12)";ctx.lineWidth=.7;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x+w*.32,y+h*1.2,w*(.25+i*.12),h*.8,-.24,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<24;i++){
    const px=x+w*((i*.618)%1),py=y+h*((i*.379)%1);
    ctx.fillStyle=i%4?"rgba(166,216,255,.28)":"rgba(255,232,179,.6)";ctx.fillRect(px,py,i%4?1:2,1);
  }
  ctx.strokeStyle="rgba(127,215,246,.65)";ctx.beginPath();ctx.moveTo(x+cut+5,y+4);ctx.lineTo(x+w*.35,y+4);ctx.moveTo(x+w*.65,y+h-4);ctx.lineTo(x+w-cut-5,y+h-4);ctx.stroke();
  ctx.restore();
}
function drawAstraInterface() {
  if (selectedCharacter !== "astra" || screenMode !== "game") return;
  const w = Math.min(760, canvas.width - 28), x = (canvas.width - w) / 2, y = canvas.height - 178;
  ctx.save();drawAstraCelestialPanel(x,y,w,120);drawAstraPortraitMedallion(x+57,y+59,41);
  const textX=x+114,textW=Math.max(80,w-438);
  ctx.textAlign = "left"; ctx.fillStyle = "#fff8df"; ctx.font = "22px DoHyeon, Arial"; ctx.fillText("아스트라", textX, y + 30);
  ctx.fillStyle = "#80ddff"; ctx.font = "bold 12px Arial";
  ctx.fillText(astraGravity ? `만유인력 역전 · ${astraGravity.bodies.filter(b => b.state !== "done").length}개 천체` : `공전성 ${astraOrbitCount() - astraQFlights().length}/${astraOrbitCount()} · 궤도 ${Math.round(astraOrbitRadius())}`, textX, y + 55,textW);
  ctx.fillStyle = "#cabfe6"; ctx.font = "11px Arial";
  const hint = astraGravity ? (astraGravity.state === "orbit" ? `${Math.ceil((ASTRA_R_DURATION - astraGravity.age) / 60)}초 후 적을 추적해 발사` : "유도 천체 · 성운 폭발") : (astraQFlights().length ? "Q 재사용: 모든 공전성 즉시 회수" : "별빛 잔상 50 · 천문 고리 150 · 성운 300");
  ctx.fillText(hint, textX, y + 78,textW);
  ctx.fillStyle = "#f4d58e"; ctx.font = "bold 11px Arial";
  ctx.fillText(`별가루 ${player.astraStardust || 0} · 피해 +${player.astraStardust || 0}% · 경험치 +${(player.astraUltimateCasts || 0) * 20}%`, textX, y + 99,textW);
  const skills = [["Q", astraQFlights().length ? "공전성 회수" : "성궤 투사", astraQFlights().length ? 0 : player.astraQCooldown, ASTRA_Q_CD], ["E", "중력 붕괴", player.astraECooldown, ASTRA_E_CD], ["X", "궤도 가속", player.astraXCooldown, ASTRA_X_CD], ["R", player.level < 10 ? "10레벨" : "만유인력 역전", player.astraRCooldown, ASTRA_R_CD]];
  skills.forEach((s, i) => {
    const cx = x + w - 286 + i * 70, cy = y + 48, r = 26;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (astraSkillIconAtlas.complete && astraSkillIconAtlas.naturalWidth) { const sw = astraSkillIconAtlas.naturalWidth / 2, sh = astraSkillIconAtlas.naturalHeight / 2; ctx.drawImage(astraSkillIconAtlas, (i % 2) * sw, Math.floor(i / 2) * sh, sw, sh, cx - r, cy - r, r * 2, r * 2); }
    ctx.restore(); ctx.strokeStyle = i === 2 ? "#f3c86e" : "#77dcff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    if (s[2] > 0) drawCooldownCover(cx, cy, r, s[2] / s[3], s[2]); drawSkillHudLabel(cx, y + 99, s[1], s[0], "#fff5d5");
  }); ctx.restore();
}
