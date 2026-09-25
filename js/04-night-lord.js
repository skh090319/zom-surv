// 나이트 로드: 낮은 체력에서 강해지는 무탄창 근접 암살자

const NIGHT_LORD_Q_COOLDOWN = 180;
const NIGHT_LORD_E_COOLDOWN = 720;
const NIGHT_LORD_X_COOLDOWN = 360;
const NIGHT_LORD_R_COOLDOWN = 3600;
const NIGHT_LORD_FRENZY_DURATION = 300;
const NIGHT_LORD_ULTIMATE_DURATION = 480;
const NIGHT_LORD_ATTACK_ANIMATION = 14;
const NIGHT_LORD_ATTACK_GAP = 18;
const NIGHT_LORD_CHASE_HASTE_DURATION = 60;

function distanceToNightLordSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function getNightLordRage() {
  return 1 - Math.max(0, player.hp) / Math.max(1, player.maxHp);
}

function attackWithNightLord(forcedSpin = false) {
  if (!forcedSpin && player.nightLordFrenzyTime > 0) return;
  if (!forcedSpin && player.fireCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const rage = getNightLordRage();
  const isFrenzyAttack = forcedSpin || player.nightLordFrenzyTime > 0;
  const attackDirection = isFrenzyAttack ? 1 : (player.nightLordAttackDirection || 1);
  const range = (player.nightLordUltimateTime > 0 ? 205 : 128) * (1 + player.nightLordReachLevel * 0.15);
  const arc = player.nightLordFrenzyTime > 0 || forcedSpin || transcended.nightReach ? Math.PI * 2 : Math.PI * 0.9;
  const damage = scaledDamage(player.damage * (1 + rage * (0.8 + player.nightLordBloodLevel * 0.2)));
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const dx = zombie.x - player.x, dy = zombie.y - player.y;
    const distance = Math.hypot(dx, dy);
    let difference = Math.atan2(dy, dx) - angle;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    if (distance <= range + zombie.r && (arc >= Math.PI * 2 || Math.abs(difference) <= arc / 2)) {
      zombie.hp -= damage;
      const push = 11 + rage * 8;
      zombie.x += dx / Math.max(1, distance) * push;
      zombie.y += dy / Math.max(1, distance) * push;
      if (player.nightLordUltimateTime > 0) player.hp = Math.min(player.maxHp, player.hp + damage * (transcended.nightBlood ? 0.14 : 0.08));
      if (zombie.hp <= 0) killZombie(i, zombie);
    }
  }
  nightLordEffects.push({ type: "slash", x: player.x, y: player.y, angle, range, arc, direction: attackDirection, life: NIGHT_LORD_ATTACK_ANIMATION, maxLife: NIGHT_LORD_ATTACK_ANIMATION });
  if (!isFrenzyAttack) player.nightLordAttackDirection = -attackDirection;
  if (!forcedSpin) {
    const baseCooldown = NIGHT_LORD_ATTACK_ANIMATION + NIGHT_LORD_ATTACK_GAP;
    player.fireCooldown = player.nightLordChaseHasteTime > 0 ? Math.ceil(baseCooldown / 2) : baseCooldown;
  }
}

function activateNightLordQ() {
  if (player.nightLordQCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const distance = Math.min(300, Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y));
  const startX = player.x, startY = player.y;
  player.x = Math.max(player.r, Math.min(WORLD.width - player.r, player.x + Math.cos(angle) * distance));
  player.y = Math.max(player.r, Math.min(WORLD.height - player.r, player.y + Math.sin(angle) * distance));
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const lineDistance = distanceToNightLordSegment(zombie.x, zombie.y, startX, startY, player.x, player.y);
    if (lineDistance <= zombie.r + 34) {
      zombie.hp -= scaledDamage(player.damage * 1.6 * (1 + getNightLordRage() * 0.8));
      if (zombie.hp <= 0) killZombie(i, zombie);
    }
  }
  nightLordEffects.push({ type: "dash", x: startX, y: startY, x2: player.x, y2: player.y, life: 18, maxLife: 18 });
  player.nightLordQCooldown = NIGHT_LORD_Q_COOLDOWN;
  player.nightLordChaseHasteTime = NIGHT_LORD_CHASE_HASTE_DURATION;
}

function activateNightLordE() {
  if (player.nightLordECooldown > 0) return;
  player.hp = Math.max(1, player.hp - player.maxHp * 0.12);
  player.nightLordFrenzyTime = NIGHT_LORD_FRENZY_DURATION;
  player.nightLordSpinTimer = 0;
  player.nightLordECooldown = NIGHT_LORD_E_COOLDOWN;
}

function activateNightLordX() {
  if (player.nightLordXCooldown > 0) return;
  let target = null, targetIndex = -1, bestDistance = 360;
  for (let i = 0; i < zombies.length; i++) {
    const zombie = zombies[i];
    const distance = Math.hypot(zombie.x - player.x, zombie.y - player.y);
    if (zombie.hp / zombie.maxHp <= 0.25 + player.nightLordExecutionLevel * 0.03 && distance < bestDistance) { target = zombie; targetIndex = i; bestDistance = distance; }
  }
  if (!target) return;
  const startX = player.x, startY = player.y;
  player.x = target.x; player.y = target.y;
  if (transcended.nightExecution) {
    for (let i = zombies.length - 1; i >= 0; i--) {
      const zombie = zombies[i];
      if (zombie !== target && Math.hypot(zombie.x - target.x, zombie.y - target.y) < 180 + zombie.r) {
        zombie.hp -= scaledDamage(player.damage * 2.2);
        if (zombie.hp <= 0) {
          killZombie(i, zombie);
          if (i < targetIndex) targetIndex--;
        }
      }
    }
  }
  if (targetIndex >= 0 && zombies[targetIndex] === target) killZombie(targetIndex, target);
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.18);
  nightLordEffects.push({ type: "dash", x: startX, y: startY, x2: player.x, y2: player.y, life: 22, maxLife: 22 });
  nightLordEffects.push({ type: "execute", x: target.x, y: target.y, life: 25, maxLife: 25 });
  player.nightLordXCooldown = NIGHT_LORD_X_COOLDOWN;
}

function activateNightLordR() {
  if (player.level < 10 || player.nightLordRCooldown > 0) return;
  player.nightLordUltimateTime = NIGHT_LORD_ULTIMATE_DURATION;
  player.nightLordRCooldown = NIGHT_LORD_R_COOLDOWN;
  nightLordEffects.push({ type: "ultimate", x: player.x, y: player.y, life: 45, maxLife: 45 });
}

function updateNightLord() {
  if (selectedCharacter !== "nightLord") return;
  for (const key of ["nightLordQCooldown", "nightLordECooldown", "nightLordXCooldown", "nightLordRCooldown", "nightLordFrenzyTime", "nightLordUltimateTime", "nightLordChaseHasteTime"]) {
    if (player[key] > 0) player[key]--;
  }
  if (player.nightLordFrenzyTime > 0 && --player.nightLordSpinTimer <= 0) {
    player.nightLordSpinTimer = 12;
    attackWithNightLord(true);
  }
  for (let i = nightLordEffects.length - 1; i >= 0; i--) {
    if (--nightLordEffects[i].life <= 0) nightLordEffects.splice(i, 1);
  }
}

function drawNightLordEffects() {
  if (selectedCharacter !== "nightLord") return;
  worldStart();
  for (const effect of nightLordEffects) {
    const alpha = effect.life / effect.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.type === "execute" ? "#ff3d72" : "#a64dff";
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 26;
    ctx.lineCap = "round";
    if (effect.type === "dash") {
      ctx.lineWidth = 22 * alpha + 3;
      ctx.beginPath(); ctx.moveTo(effect.x, effect.y); ctx.lineTo(effect.x2, effect.y2); ctx.stroke();
    } else if (effect.type === "slash") {
      const progress = 1 - alpha;
      const direction = effect.direction || 1;
      const startAngle = effect.angle - direction * effect.arc * 0.58;
      const sweepAngle = Math.max(0.08, effect.arc * Math.min(1, progress * 1.45));
      for (let trail = 0; trail < 2; trail++) {
        ctx.strokeStyle = trail === 0 ? "#d7b1ff" : "#7b23ca";
        ctx.shadowColor = trail === 0 ? "#bc63ff" : "#53108d";
        ctx.lineWidth = (trail === 0 ? 9 : 6) * alpha + 2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.range * (trail === 0 ? 1 : 0.73), startAngle, startAngle + direction * sweepAngle, direction < 0);
        ctx.stroke();
      }
      const tipAngle = startAngle + direction * sweepAngle;
      [1, 0.73].forEach((radiusScale, bladeIndex) => {
        const tipX = effect.x + Math.cos(tipAngle) * effect.range * radiusScale;
        const tipY = effect.y + Math.sin(tipAngle) * effect.range * radiusScale;
        const handAngle = effect.angle + (bladeIndex === 0 ? -0.24 : 0.24);
        const handX = effect.x + Math.cos(handAngle) * 21;
        const handY = effect.y + Math.sin(handAngle) * 21;
        ctx.save();
        ctx.strokeStyle = bladeIndex === 0 ? "rgba(207,190,224,0.94)" : "rgba(117,75,145,0.92)";
        ctx.shadowColor = "#8d35d4";
        ctx.shadowBlur = 12;
        ctx.lineWidth = bladeIndex === 0 ? 5 : 4;
        ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(tipX, tipY); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.translate(tipX, tipY); ctx.rotate(tipAngle + Math.PI / 2);
        ctx.fillStyle = bladeIndex === 0 ? "rgba(235,224,247,0.97)" : "rgba(163,102,207,0.94)";
        ctx.strokeStyle = "#60229a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(24, -3, 2, 29); ctx.quadraticCurveTo(12, 1, 0, -30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      });
    } else {
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, (1 - alpha) * 190 + 24, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  if (player.nightLordUltimateTime > 0) {
    const pulse = 78 + Math.sin(performance.now() * 0.012) * 10;
    ctx.save(); ctx.translate(player.x, player.y); ctx.strokeStyle = "rgba(139,50,213,0.72)"; ctx.shadowColor = "#7d22d1"; ctx.shadowBlur = 28; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, pulse, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  worldEnd();
}
