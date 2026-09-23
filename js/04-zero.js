// 제로: 빠른 돌진과 검술 스킬을 사용하는 무탄창 근접 검사

const ZERO_Q_COOLDOWN = 180;
const ZERO_E_COOLDOWN = 720;
const ZERO_X_COOLDOWN = 600;
const ZERO_R_COOLDOWN = 3600;
const ZERO_VITAL_DURATION = 300;
const ZERO_ULTIMATE_DURATION = 300;
const ZERO_ATTACK_COOLDOWN = 20;
const ZERO_ATTACK_RANGE = 200;
const ZERO_AIM_ASSIST_ANGLE = Math.PI * 15 / 180;
const ZERO_Q_REFUND_ON_HIT = 12;
const ZERO_E_REFUND_ON_HIT = 18;
const ZERO_X_REFUND_ON_HIT = 24;
const ZERO_ATTACK_HIT_PADDING = 10;

function zeroAngleDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function getZeroLevelMultiplier() {
  return 1 + Math.max(0, player.level - 1) * 0.04;
}

function getZeroDamageMultiplier() {
  let multiplier = getZeroLevelMultiplier() * (player.zeroVitalTime > 0 ? 2.2 + player.zeroVitalLevel * 0.2 : 1);
  if (transcended.zeroVital && player.zeroVitalTime > 0) multiplier *= 1.2;
  if (player.zeroEmpoweredAttack) multiplier *= 1.5;
  return multiplier;
}

function attackWithZero() {
  if (player.fireCooldown > 0 || player.zeroUltimateTime > 0) return;
  let angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  let assistedTarget = null;
  let assistedScore = Infinity;
  for (const zombie of zombies) {
    const dx = zombie.x - player.x, dy = zombie.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > ZERO_ATTACK_RANGE + zombie.r) continue;
    const targetAngle = Math.atan2(dy, dx);
    const error = Math.abs(zeroAngleDifference(targetAngle, angle));
    if (error <= ZERO_AIM_ASSIST_ANGLE && error * 300 + distance < assistedScore) {
      assistedTarget = zombie;
      assistedScore = error * 300 + distance;
    }
  }
  if (assistedTarget) angle = Math.atan2(assistedTarget.y - player.y, assistedTarget.x - player.x);
  const range = ZERO_ATTACK_RANGE;
  const baseHalfWidth = range / 6;
  const damage = scaledDamage(player.damage * getZeroDamageMultiplier());
  let hitEnemy = false;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const dx = zombie.x - player.x, dy = zombie.y - player.y;
    const forward = dx * Math.cos(angle) + dy * Math.sin(angle);
    const sideways = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
    if (forward < -zombie.r - ZERO_ATTACK_HIT_PADDING || forward > range + zombie.r + ZERO_ATTACK_HIT_PADDING) continue;
    const widthAtDistance = baseHalfWidth * (1 - Math.max(0, Math.min(1, forward / range)));
    if (sideways > widthAtDistance + zombie.r + ZERO_ATTACK_HIT_PADDING) continue;
    hitEnemy = true;
    zombie.hp -= damage + enemyMaxHpDamage(zombie, 0.008);
    if (!zombie.isRaidBoss && transcended.zeroVital && player.zeroVitalTime > 0 && zombie.hp / zombie.maxHp <= 0.12) zombie.hp = 0;
    if (zombie.hp <= 0) killZombie(i, zombie);
  }
  if (hitEnemy) {
    player.zeroQCooldown = Math.max(0, player.zeroQCooldown - ZERO_Q_REFUND_ON_HIT);
    player.zeroECooldown = Math.max(0, player.zeroECooldown - ZERO_E_REFUND_ON_HIT);
    player.zeroXCooldown = Math.max(0, player.zeroXCooldown - ZERO_X_REFUND_ON_HIT);
    player.zeroEmpoweredAttack = false;
  }
  zeroEffects.push({ type: "thrust", x: player.x, y: player.y, angle, range, baseHalfWidth, life: 14, maxLife: 14 });
  player.fireCooldown = ZERO_ATTACK_COOLDOWN;
}

function activateZeroQ() {
  if (player.zeroQCooldown > 0 || player.zeroUltimateTime > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const startX = player.x, startY = player.y;
  const rangeMultiplier = 1 + player.zeroThrustLevel * 0.15;
  const distance = (transcended.zeroThrust ? 330 : 210) * rangeMultiplier;
  player.x = Math.max(player.r, Math.min(WORLD.width - player.r, player.x + Math.cos(angle) * distance));
  player.y = Math.max(player.r, Math.min(WORLD.height - player.r, player.y + Math.sin(angle) * distance));
  const damage = scaledDamage(player.damage * (2.4 + player.zeroThrustLevel * 0.25) * getZeroLevelMultiplier());
  let killed = false;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    if (distanceToNightLordSegment(zombie.x, zombie.y, startX, startY, player.x, player.y) > zombie.r + 28) continue;
    zombie.hp -= damage + enemyMaxHpDamage(zombie, 0.04);
    if (zombie.hp <= 0) { killed = true; killZombie(i, zombie); }
  }
  player.invincibleTime = Math.max(player.invincibleTime, 10);
  player.zeroQCooldown = transcended.zeroThrust && killed ? ZERO_Q_COOLDOWN / 2 : ZERO_Q_COOLDOWN;
  player.zeroEmpoweredAttack = true;
  zeroEffects.push({ type: "dash", x: startX, y: startY, x2: player.x, y2: player.y, life: 18, maxLife: 18 });
}

function activateZeroE() {
  if (player.zeroECooldown > 0 || player.zeroUltimateTime > 0) return;
  player.zeroVitalTime = ZERO_VITAL_DURATION + player.zeroVitalLevel * 60;
  player.zeroECooldown = ZERO_E_COOLDOWN;
  player.zeroEmpoweredAttack = true;
  zeroEffects.push({ type: "vital", x: player.x, y: player.y, life: 35, maxLife: 35 });
}

function activateZeroX() {
  if (player.zeroXCooldown > 0 || player.zeroUltimateTime > 0) return;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y;
  const distance = Math.hypot(dx, dy);
  const maxDistance = 470;
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  const radius = 165 * (1 + player.zeroJudgmentLevel * 0.15);
  zeroEffects.push({
    type: "judgment", x: player.x + dx * scale, y: player.y + dy * scale,
    radius, life: 75, maxLife: 75, tick: 0, hit: new Set()
  });
  player.zeroXCooldown = ZERO_X_COOLDOWN;
  player.zeroEmpoweredAttack = true;
}

function activateZeroR() {
  if (player.zeroRCooldown > 0) return;
  player.zeroUltimateTime = ZERO_ULTIMATE_DURATION;
  player.zeroUltimateStrikeTimer = 0;
  player.zeroRCooldown = ZERO_R_COOLDOWN;
  player.zeroEmpoweredAttack = true;
  zeroEffects.push({ type: "waltz", x: player.x, y: player.y, life: 45, maxLife: 45 });
}

function updateZero() {
  if (selectedCharacter !== "zero") return;
  for (const key of ["zeroQCooldown", "zeroECooldown", "zeroXCooldown", "zeroRCooldown", "zeroVitalTime", "zeroUltimateTime"]) {
    if (player[key] > 0) player[key]--;
  }
  if (player.zeroUltimateTime > 0) {
    player.invincibleTime = Math.max(player.invincibleTime, 2);
    if (--player.zeroUltimateStrikeTimer <= 0) {
      player.zeroUltimateStrikeTimer = 6;
      const nearestTargets = [];
      for (const zombie of zombies) {
        const distance = Math.hypot(zombie.x - player.x, zombie.y - player.y);
        if (distance > 520 + zombie.r) continue;
        const entry = { zombie, distance };
        let insertAt = nearestTargets.findIndex(candidate => distance < candidate.distance);
        if (insertAt < 0) insertAt = nearestTargets.length;
        nearestTargets.splice(insertAt, 0, entry);
        if (nearestTargets.length > 3) nearestTargets.pop();
      }
      for (const { zombie: target } of nearestTargets) {
        const index = zombies.indexOf(target);
        if (index < 0) continue;
        target.hp -= scaledDamage(player.damage * 0.75 * getZeroLevelMultiplier()) + enemyMaxHpDamage(target, 0.015);
        zeroEffects.push({ type: "waltzStrike", x: target.x, y: target.y, angle: Math.random() * Math.PI * 2, life: 12, maxLife: 12 });
        if (target.hp <= 0 && index >= 0) killZombie(index, target);
      }
    }
  }
  for (let i = zeroEffects.length - 1; i >= 0; i--) {
    const effect = zeroEffects[i];
    if (effect.type === "judgment" && effect.life <= 54 && effect.life >= 12 && --effect.tick <= 0) {
      effect.tick = transcended.zeroJudgment ? 5 : 8;
      for (let z = zombies.length - 1; z >= 0; z--) {
        const zombie = zombies[z];
        if (Math.hypot(zombie.x - effect.x, zombie.y - effect.y) > effect.radius + zombie.r) continue;
        zombie.hp -= scaledDamage(player.damage * (0.55 + player.zeroJudgmentLevel * 0.08) * getZeroLevelMultiplier()) + enemyMaxHpDamage(zombie, 0.008);
        if (zombie.hp <= 0) killZombie(z, zombie);
      }
    }
    effect.life--;
    if (effect.life <= 0) zeroEffects.splice(i, 1);
  }
}

function drawZeroEffects() {
  if (selectedCharacter !== "zero") return;
  worldStart();
  for (const effect of zeroEffects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    if (effect.type === "dash") {
      const gradient = ctx.createLinearGradient(effect.x, effect.y, effect.x2, effect.y2);
      gradient.addColorStop(0, "rgba(80,225,255,0)"); gradient.addColorStop(0.55, `rgba(150,245,255,${alpha})`); gradient.addColorStop(1, "rgba(255,210,75,0)");
      ctx.strokeStyle = gradient; ctx.shadowColor = "#7eeaff"; ctx.shadowBlur = 18; ctx.lineWidth = 10 * alpha + 2;
      ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(effect.x2, effect.y2); ctx.stroke();
    } else if (effect.type === "thrust") {
      ctx.translate(player.x, player.y); ctx.rotate(effect.angle);
      const thrustLength = effect.range * Math.min(1, progress * 1.8);
      const thrustWidth = effect.baseHalfWidth * Math.min(1, progress * 1.8);
      const gradient = ctx.createLinearGradient(0, 0, thrustLength, 0);
      gradient.addColorStop(0, "rgba(255,225,100,0.08)");
      gradient.addColorStop(0.72, `rgba(255,215,82,${alpha * 0.48})`);
      gradient.addColorStop(1, `rgba(255,250,220,${alpha})`);
      ctx.fillStyle = gradient; ctx.strokeStyle = `rgba(255,244,190,${alpha})`;
      ctx.shadowColor = "#ffd34f"; ctx.shadowBlur = 18; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -thrustWidth); ctx.lineTo(thrustLength, 0); ctx.lineTo(0, thrustWidth); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,245,${alpha})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(thrustLength, 0); ctx.stroke();
    } else if (effect.type === "waltzStrike") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle);
      const radius = effect.range || 105;
      ctx.strokeStyle = `rgba(255,225,110,${alpha})`; ctx.shadowColor = "#fff2a3"; ctx.shadowBlur = 20; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(0, 0, radius, -1.05, 1.05); ctx.stroke();
    } else if (effect.type === "vital") {
      ctx.translate(effect.x, effect.y); ctx.strokeStyle = `rgba(255,72,60,${alpha})`; ctx.shadowColor = "#ff4c36"; ctx.shadowBlur = 24; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 35 + progress * 65, 0, Math.PI * 2); ctx.stroke();
    } else if (effect.type === "judgment") {
      ctx.translate(effect.x, effect.y);
      ctx.fillStyle = `rgba(255,205,80,${0.1 + alpha * 0.08})`; ctx.strokeStyle = `rgba(255,239,170,${0.5 + alpha * 0.4})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, effect.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let blade = 0; blade < 12; blade++) {
        const angle = blade * Math.PI * 2 / 12 + effect.life * 0.08;
        const r = effect.radius * (0.25 + ((blade * 37 + effect.life * 3) % 70) / 100);
        ctx.save(); ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r); ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = `rgba(255,245,205,${0.35 + alpha * 0.55})`; ctx.shadowColor = "#ffd85e"; ctx.shadowBlur = 12; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, 18); ctx.stroke(); ctx.restore();
      }
    } else if (effect.type === "waltz") {
      ctx.translate(effect.x, effect.y); ctx.rotate(progress * Math.PI * 3);
      ctx.strokeStyle = `rgba(255,230,115,${alpha})`; ctx.shadowColor = "#ffcf45"; ctx.shadowBlur = 25; ctx.lineWidth = 5;
      for (let ring = 0; ring < 4; ring++) { ctx.beginPath(); ctx.arc(0, 0, 45 + ring * 17, ring, ring + Math.PI * 1.35); ctx.stroke(); }
    }
    ctx.restore();
  }
  worldEnd();
}
