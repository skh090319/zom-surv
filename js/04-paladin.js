// 팔라딘: 콤보 단계에 따라 성검이 해방되는 근접 검사

const PALADIN_Q_COOLDOWN = 300;
const PALADIN_E_COOLDOWN = 480;
const PALADIN_X_COOLDOWN = 600;
const PALADIN_R_COOLDOWN = 3600;
const PALADIN_ULTIMATE_DURATION = 480;

function getPaladinTier() {
  if (player.paladinCombo >= 100) return 3;
  if (player.paladinCombo >= 50) return 2;
  if (player.paladinCombo >= 20) return 1;
  return 0;
}

function addPaladinCombo(amount) {
  player.paladinCombo = Math.min(100, player.paladinCombo + amount);
  player.paladinComboTimer = 120 + player.paladinComboLevel * 30;
}

function paladinAngleDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function damagePaladinArc(x, y, angle, range, arc, damage, maxHpRatio = 0, grantCombo = true, executeRatio = 0) {
  let hits = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const dx = zombie.x - x, dy = zombie.y - y;
    if (Math.hypot(dx, dy) > range + zombie.r) continue;
    if (arc < Math.PI * 2 && Math.abs(paladinAngleDifference(Math.atan2(dy, dx), angle)) > arc / 2) continue;
    zombie.hp -= damage + enemyMaxHpDamage(zombie, maxHpRatio);
    if (!zombie.isRaidBoss && executeRatio > 0 && zombie.hp > 0 && zombie.hp <= zombie.maxHp * executeRatio) zombie.hp = 0;
    hits++;
    if (zombie.hp <= 0) killZombie(i, zombie);
  }
  if (grantCombo && hits > 0) addPaladinCombo(hits);
  return hits;
}

function damagePaladinCross(x, y, angle, range, halfWidth, damage) {
  const hitIds = new Set();
  const directions = [angle, angle + Math.PI / 2];
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    for (const direction of directions) {
      const x1 = x - Math.cos(direction) * range;
      const y1 = y - Math.sin(direction) * range;
      const x2 = x + Math.cos(direction) * range;
      const y2 = y + Math.sin(direction) * range;
      if (distanceToNightLordSegment(zombie.x, zombie.y, x1, y1, x2, y2) <= halfWidth + zombie.r) {
        hitIds.add(zombie.id);
        break;
      }
    }
  }
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    if (!hitIds.has(zombie.id)) continue;
    zombie.hp -= damage;
    if (zombie.hp <= 0) killZombie(i, zombie);
  }
}

function attackWithPaladin() {
  if (player.fireCooldown > 0) return;
  const tier = getPaladinTier();
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const range = [138, 158, 182, 215][tier];
  const arc = [Math.PI * 0.58, Math.PI * 0.68, Math.PI * 0.88, Math.PI * 1.18][tier];
  const damage = scaledDamage(player.damage * [1, 1.16, 1.36, 1.68][tier]);
  damagePaladinArc(player.x, player.y, angle, range, arc, damage, tier === 3 ? 0.012 : 0);
  player.paladinAttackCounter++;
  if (tier >= 1 && player.paladinAttackCounter % 3 === 0) {
    damagePaladinArc(player.x, player.y, angle, tier >= 3 ? 390 : 315, Math.PI * 0.16, scaledDamage(player.damage * 0.7), tier >= 3 ? 0.006 : 0);
    paladinEffects.push({ type: "wave", x: player.x, y: player.y, angle, range: tier >= 3 ? 390 : 315, tier, life: 18, maxLife: 18 });
  }
  // 기본 검격을 먼저 등록해 광속의 푸른 잔상이 그 위에 선명하게 남도록 한다.
  paladinEffects.push({ type: "slash", x: player.x, y: player.y, angle, range, tier, life: 16, maxLife: 16 });
  if (transcended.paladinSpeed) {
    damagePaladinArc(player.x, player.y, angle, range, arc, scaledDamage(player.damage * 0.45), 0);
    paladinEffects.push({ type: "echo", x: player.x, y: player.y, angle: angle - 0.08, range: range + 24, tier, life: 25, maxLife: 25 });
  }
  const baseCooldown = tier >= 3 ? 12 : tier >= 2 ? 16 : tier >= 1 ? 19 : 22;
  player.fireCooldown = Math.max(8, baseCooldown - player.paladinSpeedLevel);
}

function activatePaladinQ() {
  if (player.paladinQCooldown > 0) return;
  player.paladinGuardTime = player.paladinUltimateTime > 0 ? 60 : 42;
  player.paladinGuardTriggered = false;
  player.paladinQCooldown = PALADIN_Q_COOLDOWN;
  paladinEffects.push({ type: "guard", life: player.paladinGuardTime, maxLife: player.paladinGuardTime });
}

function triggerPaladinCounter(attacker) {
  if (selectedCharacter !== "paladin" || player.paladinGuardTime <= 0 || player.paladinGuardTriggered) return false;
  const tier = getPaladinTier();
  const empowered = tier >= 2;
  const angle = Math.atan2(attacker.y - player.y, attacker.x - player.x);
  const range = empowered ? 265 : 205;
  const multiplier = empowered ? 3.35 : 2.5;
  player.paladinGuardTriggered = true;
  player.paladinGuardTime = 0;
  player.invincibleTime = Math.max(player.invincibleTime, 12);
  damagePaladinArc(player.x, player.y, angle, range, Math.PI * 2, scaledDamage(player.damage * multiplier), 0, false);
  addPaladinCombo(attacker.boss ? 25 : 15);
  player.paladinCounterGraceTime = 60;
  paladinEffects.push({ type: "counter", x: player.x, y: player.y, angle, range, empowered, life: 25, maxLife: 25 });
  if (tier >= 3) {
    const crossRange = 335;
    damagePaladinCross(player.x, player.y, angle, crossRange, 25, scaledDamage(player.damage * 1.5));
    paladinEffects.push({ type: "cross", x: player.x, y: player.y, angle, range: crossRange, life: 30, maxLife: 30 });
  }
  return true;
}

function activatePaladinE() {
  if (player.paladinECooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  paladinEffects.push({ type: "triple", x: player.x, y: player.y, angle, strike: 0, tick: 0, life: 30, maxLife: 30 });
  player.paladinECooldown = PALADIN_E_COOLDOWN;
}

function activatePaladinX() {
  if (player.paladinXCooldown > 0) return;
  const combo = player.paladinCombo;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  let cost = 0, floor = 0;
  if (combo >= 100) {
    // 진명 해방: 100콤보를 모은 보상답게 강력한 광역 심판을 사용하고 폭주 단계는 유지한다.
    cost = 50; floor = 100;
    damagePaladinArc(player.x, player.y, angle, 520, Math.PI * 2, scaledDamage(player.damage * 6), 0.15, false, 0.2);
    paladinEffects.push({ type: "release", x: player.x, y: player.y, angle, range: 520, full: true, judgment: true, life: 48, maxLife: 48 });
  } else if (combo >= 50) {
    cost = 50; floor = 50;
    damagePaladinArc(player.x, player.y, angle, 220, Math.PI * 2, scaledDamage(player.damage * 2.9), 0.03);
    paladinEffects.push({ type: "release", x: player.x, y: player.y, angle, range: 220, full: true, life: 32, maxLife: 32 });
  } else if (combo >= 20) {
    cost = 20; floor = 20;
    damagePaladinArc(player.x, player.y, angle, 430, Math.PI * 0.2, scaledDamage(player.damage * 2.3), 0.01);
    paladinEffects.push({ type: "release", x: player.x, y: player.y, angle, range: 430, full: false, life: 28, maxLife: 28 });
  } else {
    damagePaladinArc(player.x, player.y, angle, 185, Math.PI * 0.42, scaledDamage(player.damage * 1.5), 0);
    paladinEffects.push({ type: "release", x: player.x, y: player.y, angle, range: 185, full: false, life: 24, maxLife: 24 });
  }
  const reducedCost = Math.max(0, cost - player.paladinReleaseLevel * 5);
  player.paladinCombo = transcended.paladinRelease && cost > 0 ? Math.max(floor, combo - reducedCost) : Math.max(0, combo - reducedCost);
  player.paladinXCooldown = PALADIN_X_COOLDOWN;
}

function activatePaladinR() {
  if (player.level < 10 || player.paladinRCooldown > 0) return;
  player.paladinCombo = 100;
  player.paladinComboTimer = PALADIN_ULTIMATE_DURATION;
  player.paladinUltimateTime = PALADIN_ULTIMATE_DURATION;
  player.paladinRCooldown = PALADIN_R_COOLDOWN;
  paladinEffects.push({ type: "limit", x: player.x, y: player.y, life: 48, maxLife: 48 });
}

function updatePaladin() {
  if (selectedCharacter !== "paladin") return;
  for (const key of ["paladinQCooldown", "paladinECooldown", "paladinXCooldown", "paladinRCooldown"]) if (player[key] > 0) player[key]--;
  if (player.paladinGuardTime > 0) player.paladinGuardTime--;
  if (player.paladinCounterGraceTime > 0) player.paladinCounterGraceTime--;
  if (player.paladinUltimateTime > 0) {
    player.paladinUltimateTime--;
    player.paladinCombo = 100;
    if (player.paladinUltimateTime === 0) player.paladinCombo = 50;
  } else if (player.paladinCombo > 0 && player.paladinCounterGraceTime <= 0) {
    if (player.paladinComboTimer > 0) player.paladinComboTimer--;
    else if (--player.paladinComboDecayTimer <= 0) {
      player.paladinComboDecayTimer = transcended.paladinCombo ? 18 : 8;
      player.paladinCombo--;
    }
  }
  for (let i = paladinEffects.length - 1; i >= 0; i--) {
    const effect = paladinEffects[i];
    if (effect.type === "triple" && effect.strike < 3 && --effect.tick <= 0) {
      effect.tick = 6; effect.strike++;
      damagePaladinArc(effect.x, effect.y, effect.angle + (effect.strike - 2) * 0.12, 170, Math.PI * 0.75, scaledDamage(player.damage * 0.72), 0);
      paladinEffects.push({ type: "slash", x: effect.x, y: effect.y, angle: effect.angle + (effect.strike - 2) * 0.12, range: 170, tier: 1, life: 12, maxLife: 12 });
    }
    effect.life--;
    if (effect.life <= 0) paladinEffects.splice(i, 1);
  }
}

function drawPaladinEffects() {
  if (selectedCharacter !== "paladin") return;
  worldStart();
  for (const effect of paladinEffects) {
    const progress = 1 - effect.life / effect.maxLife;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    if (effect.type === "guard") {
      ctx.translate(player.x, player.y);
      const pulse = 1 + Math.sin(performance.now() * 0.022) * 0.06;
      ctx.scale(pulse, pulse); ctx.strokeStyle = `rgba(255,235,137,${0.65 + alpha * 0.3})`; ctx.fillStyle = `rgba(55,145,222,${0.08 + alpha * 0.08})`; ctx.shadowColor = "#ffe47a"; ctx.shadowBlur = 24; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 58, -Math.PI * 0.82, Math.PI * 0.82); ctx.lineTo(0, 31); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = `rgba(225,247,255,${alpha * 0.9})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 46, -Math.PI * 0.72, Math.PI * 0.72); ctx.stroke();
    } else if (effect.type === "counter") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle + progress * Math.PI * 1.8);
      ctx.strokeStyle = `rgba(255,246,190,${alpha})`; ctx.shadowColor = effect.empowered ? "#fff06a" : "#70caff"; ctx.shadowBlur = effect.empowered ? 38 : 27; ctx.lineWidth = effect.empowered ? 13 : 9;
      ctx.beginPath(); ctx.arc(0, 0, effect.range * Math.min(1, progress * 2.3), -2.4, 1.0); ctx.stroke();
      ctx.strokeStyle = `rgba(90,190,255,${alpha * 0.7})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, effect.range * 0.82 * Math.min(1, progress * 2.3), -2.2, 1.2); ctx.stroke();
    } else if (effect.type === "cross") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle); ctx.globalCompositeOperation = "lighter";
      const length = effect.range * Math.min(1, progress * 2.5);
      for (let arm = 0; arm < 2; arm++) { ctx.save(); ctx.rotate(arm * Math.PI / 2); const gradient = ctx.createLinearGradient(-length, 0, length, 0); gradient.addColorStop(0, "rgba(255,210,65,0)"); gradient.addColorStop(0.5, `rgba(255,255,235,${alpha})`); gradient.addColorStop(1, "rgba(255,210,65,0)"); ctx.strokeStyle = gradient; ctx.shadowColor = "#ffe75c"; ctx.shadowBlur = 32; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length, 0); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
    } else if (effect.type === "dash") {
      const gradient = ctx.createLinearGradient(effect.x, effect.y, effect.x2, effect.y2);
      gradient.addColorStop(0, "rgba(255,229,116,0)"); gradient.addColorStop(0.5, `rgba(255,245,194,${alpha})`); gradient.addColorStop(1, "rgba(87,184,255,0)");
      ctx.strokeStyle = gradient; ctx.shadowColor = "#ffe87d"; ctx.shadowBlur = 20; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(effect.x2, effect.y2); ctx.stroke();
    } else if (effect.type === "slash" || effect.type === "echo") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle);
      const echo = effect.type === "echo";
      const tier = effect.tier || 0;
      const sweep = Math.min(1, progress * (echo ? 2.25 : 1.75));
      const start = -1.08;
      const end = start + 2.16 * sweep;
      const outer = effect.range;
      const inner = Math.max(28, effect.range - (echo ? 13 : 25 + tier * 3));
      const bladeGradient = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
      bladeGradient.addColorStop(0, "rgba(35,75,120,0)");
      bladeGradient.addColorStop(0.48, echo ? `rgba(23,126,255,${alpha * 0.38})` : `rgba(65,161,232,${alpha * 0.18})`);
      bladeGradient.addColorStop(0.78, echo ? `rgba(56,211,255,${alpha * 0.9})` : `rgba(255,200,73,${alpha * 0.7})`);
      bladeGradient.addColorStop(0.94, `rgba(255,250,220,${alpha * 0.98})`);
      bladeGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = bladeGradient;
      ctx.shadowColor = echo ? "#4dbdff" : tier >= 2 ? "#fff19a" : "#ffd34f";
      ctx.shadowBlur = echo ? 34 : 24 + tier * 4;
      ctx.beginPath();
      ctx.arc(0, 0, outer, start, end);
      ctx.arc(0, 0, inner, end, start, true);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = echo ? `rgba(206,250,255,${alpha})` : `rgba(255,253,231,${alpha})`;
      ctx.lineWidth = echo ? 4.5 : 3.5;
      ctx.beginPath(); ctx.arc(0, 0, outer - 3, start, end); ctx.stroke();
      if (echo) {
        ctx.strokeStyle = `rgba(31,137,255,${alpha * 0.9})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, outer + 9, start - 0.13, end - 0.13); ctx.stroke();
        ctx.strokeStyle = `rgba(116,238,255,${alpha * 0.62})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, inner - 7, start + 0.1, end + 0.1); ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(255,190,48,${alpha * 0.58})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, inner + 5, start + 0.05, end - 0.05); ctx.stroke();
      }
    } else if (effect.type === "wave") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle);
      const length = effect.range * Math.min(1, progress * 2.15);
      const bladeHalfWidth = 12 + (effect.tier || 1) * 3;
      const waveGradient = ctx.createLinearGradient(18, 0, length, 0);
      waveGradient.addColorStop(0, "rgba(50,145,220,0)");
      waveGradient.addColorStop(0.36, `rgba(66,181,255,${alpha * 0.35})`);
      waveGradient.addColorStop(0.76, `rgba(255,218,83,${alpha * 0.72})`);
      waveGradient.addColorStop(1, `rgba(255,255,238,${alpha})`);
      ctx.fillStyle = waveGradient; ctx.shadowColor = effect.tier >= 3 ? "#fff078" : "#5bc7ff"; ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.quadraticCurveTo(length * 0.55, -bladeHalfWidth * 1.5, length, 0);
      ctx.quadraticCurveTo(length * 0.55, bladeHalfWidth * 1.5, 18, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(246,253,255,${alpha})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(length, 0); ctx.stroke();
      for (let trail = 1; trail <= 2; trail++) {
        ctx.globalAlpha = alpha * (0.3 / trail); ctx.strokeStyle = trail === 1 ? "#6acbff" : "#ffd65f"; ctx.lineWidth = 5 - trail;
        ctx.beginPath(); ctx.moveTo(12, trail * 7); ctx.quadraticCurveTo(length * 0.45, bladeHalfWidth * (1 + trail * 0.35), length * 0.88, trail * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (effect.type === "release") {
      ctx.translate(effect.x, effect.y); ctx.rotate(effect.angle); ctx.strokeStyle = `rgba(255,235,128,${alpha})`; ctx.shadowColor = "#fff09a"; ctx.shadowBlur = effect.judgment ? 46 : 30; ctx.lineWidth = (effect.judgment ? 18 : 12) - progress * 5;
      const releaseRange = effect.range * Math.min(1, progress * 1.8);
      ctx.beginPath(); if (effect.full) ctx.arc(0, 0, releaseRange, 0, Math.PI * 2); else { ctx.moveTo(0, 0); ctx.lineTo(releaseRange, 0); } ctx.stroke();
      if (effect.judgment) {
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(109,202,255,${alpha * 0.82})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, releaseRange * 0.72, -progress * Math.PI * 2, Math.PI * 1.5 - progress * Math.PI * 2); ctx.stroke();
        ctx.rotate(progress * Math.PI);
        ctx.strokeStyle = `rgba(255,252,221,${alpha})`; ctx.lineWidth = 9;
        for (let arm = 0; arm < 4; arm++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(releaseRange * 0.92, 0); ctx.stroke(); }
      }
    } else if (effect.type === "limit") {
      ctx.translate(effect.x, effect.y); ctx.rotate(progress * Math.PI * 2); ctx.strokeStyle = `rgba(255,226,83,${alpha})`; ctx.shadowColor = "#ffdc48"; ctx.shadowBlur = 35; ctx.lineWidth = 6;
      for (let ring = 0; ring < 3; ring++) { ctx.beginPath(); ctx.arc(0, 0, 45 + ring * 24 + progress * 30, ring, ring + Math.PI * 1.35); ctx.stroke(); }
    }
    ctx.restore();
  }
  worldEnd();
}
