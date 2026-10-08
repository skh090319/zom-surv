// NULL-ZERO — 살아 있는 악성 코드에 잠식된 감염형 원거리 딜러
let nullZeroProjectiles = [];
let nullZeroZones = [];
let nullZeroEffects = [];
const NULL_ZERO_Q_CD = 330;
const NULL_ZERO_E_CD = 480;
const NULL_ZERO_X_CD = 720;
const NULL_ZERO_R_CD = 1560;
const NULL_ZERO_MAX_STACKS = 5;

function nullZeroDamage(zombie, damage) {
  if (!zombie || zombie.hp <= 0) return false;
  zombie.hp -= damage;
  if (zombie.hp <= 0) {
    const index = zombies.indexOf(zombie);
    if (index >= 0) killZombie(index, zombie);
    return true;
  }
  return false;
}

function infectNullZero(zombie, amount = 1, sourceX = player.x, sourceY = player.y) {
  if (!zombie || zombie.hp <= 0) return;
  const capacity = NULL_ZERO_MAX_STACKS + (player.nullZeroPacketLevel || 0);
  zombie.nullZeroInfection = Math.min(capacity, (zombie.nullZeroInfection || 0) + amount);
  zombie.nullZeroInfectionTime = 390;
  nullZeroEffects.push({ type: "infect", x: zombie.x, y: zombie.y, life: 24, maxLife: 24, stacks: zombie.nullZeroInfection, sourceX, sourceY });
  if (zombie.nullZeroInfection >= capacity) detonateNullZeroInfection(zombie, capacity);
}

function detonateNullZeroInfection(zombie, capacity = NULL_ZERO_MAX_STACKS) {
  if (!zombie || zombie.hp <= 0 || zombie.nullZeroDetonating) return;
  zombie.nullZeroDetonating = true;
  zombie.nullZeroInfection = 0;
  zombie.nullZeroInfectionTime = 0;
  const radius = 118 + (player.nullZeroPacketLevel || 0) * 12;
  const damage = scaledDamage(player.damage * (1.15 + capacity * .13));
  nullZeroEffects.push({ type: "detonate", x: zombie.x, y: zombie.y, r: radius, life: 38, maxLife: 38 });
  if (zombie.isRaidBoss) zombie.slowTime = Math.max(zombie.slowTime || 0, 45);
  else zombie.stunTime = Math.max(zombie.stunTime || 0, 18 + (player.nullZeroQuarantineLevel || 0) * 3);
  nullZeroDamage(zombie, damage);
  const spread = transcended.nullZeroPacket ? 3 : 2;
  for (const other of [...zombies]) {
    if (other === zombie || other.hp <= 0 || Math.hypot(other.x - zombie.x, other.y - zombie.y) > radius + other.r) continue;
    other.nullZeroInfection = Math.min(capacity - 1, (other.nullZeroInfection || 0) + spread);
    other.nullZeroInfectionTime = 390;
    nullZeroEffects.push({ type: "link", x: zombie.x, y: zombie.y, x2: other.x, y2: other.y, life: 18, maxLife: 18 });
  }
  zombie.nullZeroDetonating = false;
}

function spawnNullZeroPacket(angle, damageScale = 1, infection = 1, offset = 0) {
  const a = angle + offset;
  nullZeroProjectiles.push({
    x: player.x + Math.cos(a) * 32,
    y: player.y + Math.sin(a) * 32,
    vx: Math.cos(a) * 15,
    vy: Math.sin(a) * 15,
    angle: a,
    damage: scaledDamage(player.damage * damageScale),
    infection,
    relicReplica: offset !== 0,
    life: 56,
    maxLife: 56,
    hitIds: []
  });
}

function attackWithNullZero() {
  if (player.fireCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  spawnNullZeroPacket(angle, 1, 1);
  if (player.nullZeroForkTime > 0) {
    spawnNullZeroPacket(angle, .56 + (player.nullZeroForkLevel || 0) * .06, 1, -.16);
    spawnNullZeroPacket(angle, .56 + (player.nullZeroForkLevel || 0) * .06, 1, .16);
  }
  nullZeroEffects.push({ type: "muzzle", x: player.x, y: player.y, angle, life: 20, maxLife: 20 });
  player.fireCooldown = Math.max(12, 25 - player.fireRateBonus * 2);
}

function activateNullZeroQ() {
  if (player.nullZeroQCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const range = 520 + (player.nullZeroPacketLevel || 0) * 34;
  const width = 72 + (player.nullZeroForkLevel || 0) * 8;
  const ux = Math.cos(angle), uy = Math.sin(angle);
  for (const zombie of [...zombies]) {
    const dx = zombie.x - player.x, dy = zombie.y - player.y;
    const forward = dx * ux + dy * uy;
    const side = Math.abs(dx * uy - dy * ux);
    if (forward < 0 || forward > range + zombie.r || side > width * .5 + zombie.r) continue;
    infectNullZero(zombie, 2);
    nullZeroDamage(zombie, scaledDamage(player.damage * (1.5 + (player.nullZeroPacketLevel || 0) * .12)));
  }
  nullZeroEffects.push({ type: "sever", x: player.x, y: player.y, angle, range, width, life: 34, maxLife: 34 });
  player.nullZeroQCooldown = NULL_ZERO_Q_CD;
}

function activateNullZeroE() {
  if (player.nullZeroECooldown > 0) return;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y, distance = Math.hypot(dx, dy) || 1;
  const range = Math.min(430, distance);
  const radius = 185 + (player.nullZeroQuarantineLevel || 0) * 16;
  nullZeroZones.push({ x: player.x + dx / distance * range, y: player.y + dy / distance * range, r: radius, life: 360, maxLife: 360, tick: 1, phase: 0 });
  nullZeroEffects.push({ type: "zoneSpawn", x: player.x + dx / distance * range, y: player.y + dy / distance * range, r: radius, life: 42, maxLife: 42 });
  player.nullZeroECooldown = NULL_ZERO_E_CD;
}

function activateNullZeroX() {
  if (player.nullZeroXCooldown > 0) return;
  player.nullZeroForkTime = 540 + (player.nullZeroForkLevel || 0) * 60;
  nullZeroEffects.push({ type: "fork", x: player.x, y: player.y, life: 64, maxLife: 64 });
  player.nullZeroXCooldown = NULL_ZERO_X_CD;
}

function activateNullZeroR() {
  if (player.level < 10 || player.nullZeroRCooldown > 0) return;
  const radius = transcended.nullZeroQuarantine ? 880 : 720;
  let order = 0;
  for (const zombie of [...zombies].sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))) {
    if (zombie.hp <= 0 || Math.hypot(zombie.x - player.x, zombie.y - player.y) > radius + zombie.r) continue;
    zombie.nullZeroInfection = NULL_ZERO_MAX_STACKS + (player.nullZeroPacketLevel || 0);
    zombie.nullZeroInfectionTime = 390;
    const bossDamage = zombie.isRaidBoss ? enemyMaxHpDamage(zombie, .055 + (player.nullZeroForkLevel || 0) * .008) : 0;
    nullZeroEffects.push({ type: "kernelTarget", x: zombie.x, y: zombie.y, delay: order * 3, life: 46 + order * 3, maxLife: 46 + order * 3 });
    nullZeroDamage(zombie, scaledDamage(player.damage * 1.25) + bossDamage);
    detonateNullZeroInfection(zombie, NULL_ZERO_MAX_STACKS + (player.nullZeroPacketLevel || 0));
    order++;
  }
  nullZeroEffects.push({ type: "kernel", x: player.x, y: player.y, r: radius, life: 72, maxLife: 72 });
  player.nullZeroKernelTime = 240;
  player.nullZeroRCooldown = NULL_ZERO_R_CD;
}

function updateNullZero() {
  if (selectedCharacter !== "nullZero") return;
  for (const key of ["nullZeroQCooldown", "nullZeroECooldown", "nullZeroXCooldown", "nullZeroRCooldown", "nullZeroForkTime", "nullZeroKernelTime"]) if (player[key] > 0) player[key]--;
  for (let i = nullZeroProjectiles.length - 1; i >= 0; i--) {
    const packet = nullZeroProjectiles[i];
    packet.x += packet.vx; packet.y += packet.vy; packet.life--;
    let removed = packet.life <= 0;
    if (!removed) for (const zombie of [...zombies]) {
      if (packet.hitIds.includes(zombie.id) || Math.hypot(packet.x - zombie.x, packet.y - zombie.y) > zombie.r + 18) continue;
      packet.hitIds.push(zombie.id);
      infectNullZero(zombie, packet.infection, packet.x, packet.y);
      nullZeroDamage(zombie, packet.damage, packet, {codeReplica:!!packet.relicReplica});
      nullZeroEffects.push({ type: "packetHit", x: packet.x, y: packet.y, life: 22, maxLife: 22 });
      removed = true; break;
    }
    if (removed) nullZeroProjectiles.splice(i, 1);
  }
  for (let i = nullZeroZones.length - 1; i >= 0; i--) {
    const zone = nullZeroZones[i]; zone.life--; zone.phase += .045; zone.tick--;
    if (zone.tick <= 0) {
      zone.tick = transcended.nullZeroQuarantine ? 20 : 30;
      for (const zombie of [...zombies]) {
        if (zombie.hp <= 0 || Math.hypot(zombie.x - zone.x, zombie.y - zone.y) > zone.r + zombie.r) continue;
        zombie.slowTime = Math.max(zombie.slowTime || 0, 40);
        infectNullZero(zombie, 1, zone.x, zone.y);
        nullZeroDamage(zombie, scaledDamage(player.damage * (.28 + (player.nullZeroQuarantineLevel || 0) * .05)), zone, {kind:"skill",area:true,dot:true,canCrit:false});
      }
    }
    if (zone.life <= 0) nullZeroZones.splice(i, 1);
  }
  for (const zombie of zombies) {
    if (zombie.nullZeroInfectionTime > 0) zombie.nullZeroInfectionTime--;
    else zombie.nullZeroInfection = 0;
  }
  for (let i = nullZeroEffects.length - 1; i >= 0; i--) if (--nullZeroEffects[i].life <= 0) nullZeroEffects.splice(i, 1);
  if (nullZeroEffects.length > 110) nullZeroEffects.splice(0, nullZeroEffects.length - 110);
}

function drawNullZeroEffects() {
  if (selectedCharacter !== "nullZero") return;
  worldStart(); ctx.save(); const now = performance.now() * .004;
  for (const zone of nullZeroZones) {
    const alpha = Math.min(1, zone.life / 35), pulse = 1 + Math.sin(zone.phase) * .025;
    const glow = ctx.createRadialGradient(zone.x, zone.y, zone.r * .12, zone.x, zone.y, zone.r * pulse);
    glow.addColorStop(0, `rgba(255,25,92,${.12 * alpha})`); glow.addColorStop(.62, `rgba(0,230,255,${.075 * alpha})`); glow.addColorStop(1, "rgba(0,20,30,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(zone.x, zone.y); ctx.rotate(now * .22); ctx.strokeStyle = `rgba(96,246,255,${.72 * alpha})`; ctx.lineWidth = 3;
    for (let ring = .68; ring <= 1; ring += .16) { ctx.setLineDash([24, 12, 5, 11]); ctx.beginPath(); ctx.arc(0, 0, zone.r * ring * pulse, 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = `rgba(255,40,101,${.7 * alpha})`;
    for (let n = 0; n < 8; n++) { const a = n * Math.PI / 4; ctx.strokeRect(Math.cos(a) * zone.r * .82 - 4, Math.sin(a) * zone.r * .82 - 4, 8, 8); }
    ctx.restore();
  }
  for (const zombie of zombies) if ((zombie.nullZeroInfection || 0) > 0) {
    const stacks = zombie.nullZeroInfection, radius = zombie.r + 8 + stacks * 2;
    ctx.strokeStyle = `rgba(255,42,105,${.32 + stacks * .1})`; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(zombie.x, zombie.y, radius, -now, -now + Math.PI * 1.65); ctx.stroke(); ctx.setLineDash([]);
    for (let n = 0; n < stacks; n++) { const a = -Math.PI / 2 + (n - (stacks - 1) / 2) * .24; ctx.fillStyle = n % 2 ? "#68f7ff" : "#ff315f"; ctx.fillRect(zombie.x + Math.cos(a) * radius - 2, zombie.y + Math.sin(a) * radius - 2, 4, 4); }
  }
  ctx.globalCompositeOperation = "lighter";
  for (const packet of nullZeroProjectiles) {
    const trail = ctx.createLinearGradient(packet.x - packet.vx * 3, packet.y - packet.vy * 3, packet.x, packet.y);
    trail.addColorStop(0, "rgba(0,225,255,0)"); trail.addColorStop(.6, "rgba(0,225,255,.5)"); trail.addColorStop(1, "rgba(255,36,104,.95)");
    ctx.strokeStyle = trail; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(packet.x - packet.vx * 3, packet.y - packet.vy * 3); ctx.lineTo(packet.x, packet.y); ctx.stroke();
    ctx.fillStyle = "#f4ffff"; ctx.save(); ctx.translate(packet.x, packet.y); ctx.rotate(packet.angle); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-7, -7); ctx.lineTo(-2, 0); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  for (const effect of nullZeroEffects) {
    const progress = 1 - effect.life / effect.maxLife, alpha = Math.max(0, 1 - progress);
    if (effect.type === "sever") {
      ctx.save(); ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle); const gradient = ctx.createLinearGradient(0, 0, effect.range, 0); gradient.addColorStop(0, `rgba(0,238,255,${alpha * .25})`); gradient.addColorStop(.5, `rgba(210,255,255,${alpha})`); gradient.addColorStop(1, `rgba(255,35,103,${alpha * .8})`); ctx.strokeStyle = gradient; ctx.lineWidth = effect.width * (1 - progress * .7); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(effect.range, 0); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${alpha})`; for (let n = 0; n < 4; n++) { ctx.beginPath(); ctx.moveTo(35 + n * 58, -effect.width * .38); ctx.lineTo(75 + n * 65, effect.width * .38); ctx.stroke(); } ctx.restore();
    } else if (effect.type === "detonate" || effect.type === "zoneSpawn") {
      const radius = effect.r * Math.sin(Math.min(1, progress * 1.25) * Math.PI * .5); ctx.strokeStyle = `rgba(${effect.type === "detonate" ? "255,40,104" : "75,245,255"},${alpha})`; ctx.lineWidth = 7 * alpha + 1; ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; for (let n = 0; n < 12; n++) { const a = n * Math.PI / 6 + now; ctx.strokeRect(effect.x + Math.cos(a) * radius * .78 - 3, effect.y + Math.sin(a) * radius * .78 - 3, 6, 6); }
    } else if (effect.type === "link") {
      ctx.strokeStyle = `rgba(255,48,116,${alpha})`; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(effect.x2, effect.y2); ctx.stroke(); ctx.setLineDash([]);
    } else if (effect.type === "muzzle" || effect.type === "packetHit") {
      const radius = 12 + progress * 36; ctx.fillStyle = `rgba(110,250,255,${alpha * .8})`; ctx.beginPath(); ctx.arc(effect.x, effect.y, radius * .35, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(255,48,112,${alpha})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
    } else if (effect.type === "fork") {
      for (const side of [-1, 1]) { const x = effect.x + side * (34 + progress * 46); ctx.strokeStyle = side < 0 ? `rgba(61,239,255,${alpha})` : `rgba(255,42,108,${alpha})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(x, effect.y - 42); ctx.lineTo(x + side * 24, effect.y + 38); ctx.stroke(); }
    } else if (effect.type === "kernel") {
      const radius = effect.r * Math.min(1, progress * 1.8); const gradient = ctx.createRadialGradient(effect.x, effect.y, 15, effect.x, effect.y, radius); gradient.addColorStop(0, `rgba(255,255,255,${alpha * .62})`); gradient.addColorStop(.18, `rgba(255,20,85,${alpha * .25})`); gradient.addColorStop(.7, `rgba(0,225,255,${alpha * .08})`); gradient.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(255,49,112,${alpha})`; ctx.lineWidth = 6; ctx.setLineDash([28, 18, 8, 16]); ctx.beginPath(); ctx.arc(effect.x, effect.y, radius * .72, now, now + Math.PI * 1.78); ctx.stroke(); ctx.setLineDash([]);
    } else if (effect.type === "kernelTarget" && effect.delay <= 0) {
      ctx.strokeStyle = `rgba(255,65,124,${alpha})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(effect.x - 24, effect.y - 24); ctx.lineTo(effect.x + 24, effect.y + 24); ctx.moveTo(effect.x + 24, effect.y - 24); ctx.lineTo(effect.x - 24, effect.y + 24); ctx.stroke();
    }
    if (effect.delay > 0) effect.delay--;
  }
  ctx.restore(); worldEnd();
}

function drawNullZeroInterface() {
  if (selectedCharacter !== "nullZero" || screenMode !== "game") return;
  const width = Math.min(760, canvas.width - 28), height = 120, x = (canvas.width - width) / 2, y = canvas.height - 178;
  ctx.save(); const background = ctx.createLinearGradient(x, y, x + width, y + height); background.addColorStop(0, "rgba(4,15,22,.97)"); background.addColorStop(.52, "rgba(24,7,18,.97)"); background.addColorStop(1, "rgba(3,8,15,.97)"); drawRoundedRect(x, y, width, height, 24, background, "#4defff", 2);
  ctx.save(); ctx.beginPath(); ctx.arc(x + 56, y + 58, 42, 0, Math.PI * 2); ctx.clip(); if (nullZeroSpriteLoaded) ctx.drawImage(nullZeroSprite, x + 2, y + 2, 108, 108); ctx.restore(); ctx.strokeStyle = "#ff356d"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 56, y + 58, 42, 0, Math.PI * 2); ctx.stroke();
  const infected = zombies.filter(z => (z.nullZeroInfection || 0) > 0).length; ctx.textAlign = "left"; ctx.fillStyle = "#effeff"; ctx.font = "bold 18px Arial"; ctx.fillText("NULL-ZERO", x + 112, y + 28); ctx.fillStyle = "#65efff"; ctx.font = "bold 12px Arial"; ctx.fillText(`감염 대상 ${infected} · 분기 복제 ${player.nullZeroForkTime > 0 ? Math.ceil(player.nullZeroForkTime / 60) + "초" : "대기"}`, x + 112, y + 51); ctx.fillStyle = "#c8b6c5"; ctx.font = "11px Arial"; ctx.fillText(player.nullZeroKernelTime > 0 ? "KERNEL PANIC 실행 중" : "감염 5중첩 시 폭발하며 주변으로 전염", x + 112, y + 75);
  const skills = [["Q", "데이터 절단", player.nullZeroQCooldown, NULL_ZERO_Q_CD], ["E", "격리 구역", player.nullZeroECooldown, NULL_ZERO_E_CD], ["X", "코드 복제", player.nullZeroXCooldown, NULL_ZERO_X_CD], ["R", player.level < 10 ? "10레벨" : "커널 패닉", player.nullZeroRCooldown, NULL_ZERO_R_CD]];
  skills.forEach((skill, index) => { const cx = x + width - 286 + index * 70, cy = y + 48, radius = 26; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip(); if (nullZeroSkillIconAtlas.complete && nullZeroSkillIconAtlas.naturalWidth) { const sw = nullZeroSkillIconAtlas.naturalWidth / 2, sh = nullZeroSkillIconAtlas.naturalHeight / 2; ctx.drawImage(nullZeroSkillIconAtlas, (index % 2) * sw, Math.floor(index / 2) * sh, sw, sh, cx - radius, cy - radius, radius * 2, radius * 2); } ctx.restore(); ctx.strokeStyle = index % 2 ? "#ff477a" : "#6ef6ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke(); if (skill[2] > 0) drawCooldownCover(cx, cy, radius, skill[2] / skill[3], skill[2]); drawSkillHudLabel(cx, y + 99, skill[1], skill[0], "#ddfbff"); });
  ctx.restore();
}
