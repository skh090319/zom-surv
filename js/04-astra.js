// Astra: real orbit slots, returning constellation volleys and gravity capture.
let astraMeteors = [], astraWells = [], astraEffects = [], astraDust = [];
let astraGravity = null, astraFrame = 0, astraFxBudget = 0;
const ASTRA_Q_CD = 300, ASTRA_E_CD = 510, ASTRA_X_CD = 780, ASTRA_R_CD = 1680;
const ASTRA_R_DURATION = 360, ASTRA_R_LIFT = 42, ASTRA_R_FLIGHT = 980;
const ASTRA_REALM_FADE_IN = 54, ASTRA_REALM_FADE_OUT = 60;
// Independent balance knobs: do not multiply the shared player.damage stat.
const ASTRA_BASIC_DAMAGE_MULTIPLIER = 2, ASTRA_ORBIT_DAMAGE_MULTIPLIER = 6, ASTRA_WELL_PULL_MULTIPLIER = 3;

function resetAstra() {
  if (astraGravity) for (const b of astraGravity.bodies) astraReleaseBody(b);
  astraMeteors = []; astraWells = []; astraEffects = []; astraDust = [];
  astraGravity = null; astraFrame = 0; astraFxBudget = 0;
  for (const k of ["QCooldown", "ECooldown", "XCooldown", "RCooldown", "OverdriveTime", "OrbitBlend", "OrbitAngle", "OrbitTick", "RedLevel", "BlueLevel", "HorizonLevel"]) player[`astra${k}`] = 0;
}
function astraDamage(z, amount) {
  if (!z || z.hp <= 0 || !zombies.includes(z)) return false;
  z.hp -= amount;
  if (z.hp <= 0) { const i = zombies.indexOf(z); if (i >= 0) killZombie(i, z); return true; }
  return false;
}
function astraOrbitCount() { return 3 + (player.astraBlueLevel || 0) + (transcended.astraBlue ? 2 : 0); }
function astraOrbitTarget() { return player.astraOverdriveTime > 0 ? 1 : 0; }
function astraOrbitRadius() { return 72 + (player.astraRedLevel || 0) * 6 + (player.astraOrbitBlend || 0) * (82 + (player.astraHorizonLevel || 0) * 8); }
function astraOrbitSpeed() { return .026 + (player.astraBlueLevel || 0) * .003 + (player.astraOrbitBlend || 0) * .052; }
function astraQGeometry() {
  const boosted = player.astraOverdriveTime > 0;
  return { range: 590 + (player.astraRedLevel || 0) * 24, spread: boosted ? .30 : .21, radius: boosted ? 22 : 16, speed: boosted ? 18 : 14 };
}
function astraERadius() { return 170 + (player.astraHorizonLevel || 0) * 18; }
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
function astraSegmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - dx * t, y - ay - dy * t);
}
function astraTrail(entity, limit = 22) {
  (entity.trail ||= []).push({ x: entity.x, y: entity.y });
  if (entity.trail.length > limit) entity.trail.shift();
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
  astraMeteors.push({ x: player.x, y: player.y, a, speed: 13, curve: (Math.random() - .5) * .014, life: 72, damage: scaledDamage(player.damage * 1.02 * ASTRA_BASIC_DAMAGE_MULTIPLIER), r: 10, kind: "shot", trail: [] });
  player.fireCooldown = Math.max(11, 24 - (player.fireRateBonus || 0) * 2);
}
function activateAstraQ() {
  const flights = astraQFlights();
  if (flights.length) { for (const star of flights) star.returning = true; return; }
  if (player.astraQCooldown > 0) return;
  const aim = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x), shape = astraQGeometry();
  for (const start of astraQPaths(aim)) {
    astraMeteors.push({ ...start,
      speed: shape.speed, r: shape.radius, damage: scaledDamage(player.damage * (1.05 + (player.astraRedLevel || 0) * .12) * ASTRA_ORBIT_DAMAGE_MULTIPLIER),
      kind: "orbit", returning: false, age: 0, trail: [], outwardHits: new Set(), returnHits: new Set() });
    astraImpact("launch", start.x, start.y, 34);
  }
  player.astraQCooldown = ASTRA_Q_CD;
}
function activateAstraE() {
  if (player.astraECooldown > 0) return;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y, d = Math.hypot(dx, dy) || 1, range = Math.min(520, d);
  const p = astraClampPosition(player.x + dx / d * range, player.y + dy / d * range);
  astraWells.push({ ...p, r: astraERadius(), life: 270, maxLife: 270, tick: 1, phase: 0 });
  astraImpact("wellBorn", p.x, p.y, astraERadius()); player.astraECooldown = ASTRA_E_CD;
}
function activateAstraX() {
  if (player.astraXCooldown > 0) return;
  player.astraOverdriveTime = 480 + (player.astraBlueLevel || 0) * 45;
  astraImpact("expand", player.x, player.y, astraOrbitRadius()); player.astraXCooldown = ASTRA_X_CD;
}
function activateAstraR() {
  if (player.level < 10 || player.astraRCooldown > 0 || astraGravity) return;
  const targets = zombies.filter(z => astraCanCapture(z) && Math.hypot(z.x - player.x, z.y - player.y) <= astraRRadius() + z.r);
  const count = targets.length || Math.max(5, astraOrbitCount());
  astraGravity = { age: 0, backdropReadyAge: 0, state: "orbit", x: player.x, y: player.y, launchAge: 0, radius: astraRRadius(), bossSpent: new Map(), bodies: [] };
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
function launchAstraGravity() {
  const g = astraGravity;
  if (!g || g.state !== "orbit") return;
  const a = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x), d = Math.max(320, Math.min(850, Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y)));
  g.state = "launch"; g.launchAge = 0; g.aim = a;
  g.targetX = player.x + Math.cos(a) * d; g.targetY = player.y + Math.sin(a) * d;
  for (const b of g.bodies) b.delay = b.index / Math.max(1, g.bodies.length - 1) * 24;
  astraImpact("release", player.x, player.y - 38, 205);
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
      extra = Math.max(0, z.maxHp || 0) * ratio; g.bossSpent.set(z, spent + ratio);
    }
    astraDamage(z, scaledDamage(player.damage * (2.5 + (player.astraRedLevel || 0) * .2) * scale) + extra);
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
  for (const b of g.bodies) astraDetachDeadBody(b, living);
  if (g.state === "orbit" && g.age >= ASTRA_R_DURATION) launchAstraGravity();
  if (g.state === "launch") g.launchAge++;
  for (const b of g.bodies) {
    if (b.state === "done") continue;
    if (b.collisionCooldown > 0) b.collisionCooldown--;
    if (g.state === "launch" && b.state === "orbit" && g.launchAge >= b.delay) {
      b.state = "flight"; b.a = Math.atan2(g.targetY - b.y, g.targetX - b.x); b.speed = 12;
    }
    if (b.state === "orbit") {
      b.a += (.028 + b.ring * .009) * (b.ring === 1 ? -1 : 1) * (1 + (player.astraOrbitBlend || 0) * .9);
      const p = astraGravityOrbitPoint(b, g), t = astraEase(g.age / ASTRA_R_LIFT);
      b.x = b.startX + (p.x - b.startX) * t; b.y = b.startY + (p.y - b.startY) * t; b.lift = 38 * t;
    } else {
      const px = b.x, py = b.y; b.speed = Math.min(25, b.speed + .9);
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
          if (b.collisionCooldown || other.collisionCooldown || Math.hypot(b.x - other.x, b.y - other.y) > b.r + other.r + 5) continue;
          b.collisionCooldown = other.collisionCooldown = 24;
          astraDamage(b.zombie, scaledDamage(player.damage * .55)); astraDamage(other.zombie, scaledDamage(player.damage * .55));
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
    const hits = m.kind === "orbit" ? (m.returning ? m.returnHits : m.outwardHits) : null;
    for (const z of [...zombies]) {
      if (remove || z.hp <= 0 || hits?.has(z) || astraSegmentDistance(z.x, z.y, px, py, m.x, m.y) > z.r + m.r) continue;
      hits?.add(z); astraDamage(z, m.damage); astraImpact("starHit", z.x, z.y, m.kind === "orbit" ? 58 : 27);
      if (!hits) remove = true;
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
    const age = w.maxLife - w.life, pulling = age >= 24 && w.life > 24;
    if (pulling) for (const z of zombies) {
      if (z.hp <= 0 || z.isRaidBoss || z.isBossMinion || z.astraControl) continue;
      const dx = w.x - z.x, dy = w.y - z.y, d = Math.hypot(dx, dy);
      if (d > 12 && d < w.r + z.r) {
        const pull = Math.min(d - 12, (.45 + (player.astraHorizonLevel || 0) * .09) * (1 - d / (w.r * 2)) * ASTRA_WELL_PULL_MULTIPLIER);
        z.x += dx / d * pull; z.y += dy / d * pull; z.slowTime = Math.max(z.slowTime || 0, 4);
      }
    }
    if (pulling && --w.tick <= 0) {
      w.tick = transcended.astraHorizon ? 14 : 18;
      for (const z of [...zombies]) if (z.hp > 0 && Math.hypot(z.x - w.x, z.y - w.y) <= w.r + z.r) astraDamage(z, scaledDamage(player.damage * (.22 + (player.astraHorizonLevel || 0) * .035)));
    }
    if (w.life <= 0) {
      astraImpact("collapse", w.x, w.y, w.r);
      for (const z of [...zombies]) if (z.hp > 0 && Math.hypot(z.x - w.x, z.y - w.y) < w.r + z.r) astraDamage(z, scaledDamage(player.damage * (1.5 + (player.astraHorizonLevel || 0) * .18)));
      astraWells.splice(i, 1);
    }
  }
}
function updateAstra() {
  if (selectedCharacter !== "astra") return;
  astraFrame++; astraFxBudget = 0;
  for (const k of ["astraQCooldown", "astraECooldown", "astraXCooldown", "astraRCooldown", "astraOverdriveTime"]) if (player[k] > 0) player[k]--;
  const target = astraOrbitTarget(), blend = player.astraOrbitBlend || 0;
  player.astraOrbitBlend = blend + (target - blend) * (target > .5 ? .035 : .018);
  if (Math.abs(player.astraOrbitBlend - target) < .002) player.astraOrbitBlend = target;
  player.astraOrbitAngle = (player.astraOrbitAngle || 0) + astraOrbitSpeed();
  const deployed = new Set(astraQFlights().map(m => m.slot));
  player.astraOrbitTick = (player.astraOrbitTick || 0) - 1;
  if (player.astraOrbitTick <= 0) {
    player.astraOrbitTick = player.astraOverdriveTime > 0 ? 8 : 13;
    for (let n = 0; n < astraOrbitCount(); n++) {
      if (deployed.has(n)) continue;
      const star = astraOrbitSlot(n);
      for (const z of [...zombies]) {
        if (z.hp <= 0 || z.astraOrbitHit > 0 || Math.hypot(z.x - star.x, z.y - star.y) > z.r + 16) continue;
        z.astraOrbitHit = 16; astraDamage(z, scaledDamage(player.damage * (.26 + (player.astraBlueLevel || 0) * .035) * ASTRA_ORBIT_DAMAGE_MULTIPLIER)); astraImpact("starHit", star.x, star.y, 27);
      }
    }
  }
  for (const z of zombies) if (z.astraOrbitHit > 0) z.astraOrbitHit--;
  updateAstraMeteors(); updateAstraWells(); updateAstraGravity();
  for (let i = astraEffects.length - 1; i >= 0; i--) if (--astraEffects[i].life <= 0) astraEffects.splice(i, 1);
  for (let i = astraDust.length - 1; i >= 0; i--) {
    const p = astraDust[i]; p.px = p.x; p.py = p.y; p.x += p.vx; p.y += p.vy; p.vx *= .955; p.vy *= .955;
    if (--p.life <= 0) astraDust.splice(i, 1);
  }
}
function drawAstraInterface() {
  if (selectedCharacter !== "astra" || screenMode !== "game") return;
  const w = Math.min(760, canvas.width - 28), x = (canvas.width - w) / 2, y = canvas.height - 178;
  ctx.save(); const bg = ctx.createLinearGradient(x, y, x + w, y + 120);
  bg.addColorStop(0, "rgba(4,12,30,.97)"); bg.addColorStop(.52, "rgba(22,16,58,.97)"); bg.addColorStop(1, "rgba(6,9,24,.97)");
  drawRoundedRect(x, y, w, 120, 24, bg, "#e6bd62", 2);
  ctx.textAlign = "left"; ctx.fillStyle = "#fff8df"; ctx.font = "bold 20px Arial"; ctx.fillText("아스트라", x + 22, y + 30);
  ctx.fillStyle = "#80ddff"; ctx.font = "bold 12px Arial";
  ctx.fillText(astraGravity ? `만유인력 역전 · ${astraGravity.bodies.filter(b => b.state !== "done").length}개 천체` : `공전성 ${astraOrbitCount() - astraQFlights().length}/${astraOrbitCount()} · 궤도 ${Math.round(astraOrbitRadius())}`, x + 22, y + 55);
  ctx.fillStyle = "#cabfe6"; ctx.font = "11px Arial";
  const hint = astraGravity ? (astraGravity.state === "orbit" ? `${Math.ceil((ASTRA_R_DURATION - astraGravity.age) / 60)}초 후 조준 방향으로 발사` : "천체 충돌 · 성운 폭발") : (astraQFlights().length ? "Q 재사용: 모든 공전성 즉시 회수" : "공전성 왕복 공격 · 적을 포획하는 천구");
  ctx.fillText(hint, x + 22, y + 78);
  const skills = [["Q", astraQFlights().length ? "공전성 회수" : "성궤 투사", astraQFlights().length ? 0 : player.astraQCooldown, ASTRA_Q_CD], ["E", "중력 붕괴", player.astraECooldown, ASTRA_E_CD], ["X", "궤도 가속", player.astraXCooldown, ASTRA_X_CD], ["R", player.level < 10 ? "10레벨" : "만유인력 역전", player.astraRCooldown, ASTRA_R_CD]];
  skills.forEach((s, i) => {
    const cx = x + w - 286 + i * 70, cy = y + 48, r = 26;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    if (astraSkillIconAtlas.complete && astraSkillIconAtlas.naturalWidth) { const sw = astraSkillIconAtlas.naturalWidth / 2, sh = astraSkillIconAtlas.naturalHeight / 2; ctx.drawImage(astraSkillIconAtlas, (i % 2) * sw, Math.floor(i / 2) * sh, sw, sh, cx - r, cy - r, r * 2, r * 2); }
    ctx.restore(); ctx.strokeStyle = i === 2 ? "#f3c86e" : "#77dcff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    if (s[2] > 0) drawCooldownCover(cx, cy, r, s[2] / s[3], s[2]); drawSkillHudLabel(cx, y + 99, s[1], s[0], "#fff5d5");
  }); ctx.restore();
}
