// 유피테르 전용 무기 3종과 고유 R 스킬

const YUPITER_WEAPON_NAMES = ["반월검", "절단검", "화염포"];
const YUPITER_SKILL_COOLDOWNS = [1200, 1440, 1080];
const YUPITER_ULTIMATE_COOLDOWN = 3600;
const YUPITER_ULTIMATE_DURATION = 600;

function switchYupiterWeapon() {
  const attackHeld = mouse.down;
  player.yupiterWeapon = (player.yupiterWeapon + 1) % 3;
  player.fireCooldown = 0;
  if (attackHeld) attackWithYupiterWeapon();
}

function attackWithYupiterWeapon() {
  if (player.yupiterWeapon === 0) throwCrescentBlade();
  else if (player.yupiterWeapon === 1) slashWithSeveringBlade();
  else fireFlameCannon();
}

function activateYupiterSkill() {
  const weapon = player.yupiterWeapon;
  if (player.yupiterSkillCooldowns[weapon] > 0) return;

  if (weapon === 0) {
    player.crescentOverdriveTime = 600;
  } else if (weapon === 1) {
    player.severingFrenzyTime = 480;
  } else {
    if (!detonateFlameMarks()) return;
  }

  player.yupiterSkillCooldowns[weapon] = YUPITER_SKILL_COOLDOWNS[weapon];
}

function activateYupiterUltimate() {
  if (player.level < 10 || player.yupiterUltimateCooldown > 0) return;

  const weapon = player.yupiterWeapon;
  if (weapon === 0) {
    player.crescentUltimateTime = YUPITER_ULTIMATE_DURATION;
  } else if (weapon === 1) {
    player.severingUltimateTime = YUPITER_ULTIMATE_DURATION;
  } else {
    const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
    flameUltimateOrbs.push({
      x: player.x + Math.cos(angle) * 42,
      y: player.y + Math.sin(angle) * 42,
      vx: Math.cos(angle) * 8,
      vy: Math.sin(angle) * 8,
      r: 34,
      life: 180
    });
  }

  player.yupiterUltimateCooldown = YUPITER_ULTIMATE_COOLDOWN;
  for (let i = 0; i < 52; i++) {
    const angle = Math.PI * 2 * i / 52;
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(angle) * (2 + Math.random() * 7),
      vy: Math.sin(angle) * (2 + Math.random() * 7),
      life: 24 + Math.random() * 24,
      color: weapon === 2 ? "#ff7138" : (weapon === 1 ? "#d8f4ff" : "#8df6ff")
    });
  }
}

function slashWithSeveringBlade() {
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const ultimateRangeMultiplier = player.severingUltimateTime > 0 ? 3.5 : 1;
  const range = (player.trackerLevel > 0 ? 220 : 145) * ultimateRangeMultiplier;
  const halfArc = player.trackerLevel > 0 ? Math.PI : Math.PI * (0.42 + player.swordAuraLevel / 12);

  const fullCircle = player.trackerLevel > 0;
  yupiterSlashes.push({
    x: player.x, y: player.y, angle, life: fullCircle ? 18 : 13, maxLife: fullCircle ? 18 : 13,
    range, fullCircle, halfArc, startAngle: fullCircle ? angle : angle - halfArc,
    sweep: fullCircle ? Math.PI * 2 : halfArc * 2, hitIds: []
  });
  for (let i = 0; i < 18; i++) {
    const sparkAngle = angle + (Math.random() - 0.5) * Math.PI * 0.85;
    const sparkRadius = 55 + Math.random() * 90;
    particles.push({
      x: player.x + Math.cos(sparkAngle) * sparkRadius,
      y: player.y + Math.sin(sparkAngle) * sparkRadius,
      vx: Math.cos(sparkAngle) * (2 + Math.random() * 5),
      vy: Math.sin(sparkAngle) * (2 + Math.random() * 5),
      life: 10 + Math.random() * 10,
      color: i % 3 === 0 ? "#ffffff" : "#cbd8e8"
    });
  }
  const baseCooldown = Math.max(10, 22 - player.fireRateBonus * 2);
  player.fireCooldown = player.severingFrenzyTime > 0 ? Math.max(3, Math.ceil(baseCooldown / 4)) : baseCooldown;
}

function fireFlameCannon() {
  const centerAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const pelletCount = 5;
  const spread = 0.56;

  for (let i = 0; i < pelletCount; i++) {
    const angle = centerAngle - spread / 2 + spread * i / (pelletCount - 1);
    flameProjectiles.push({
      x: player.x + Math.cos(angle) * 34,
      y: player.y + Math.sin(angle) * 34,
      vx: Math.cos(angle) * 13,
      vy: Math.sin(angle) * 13,
      r: 6,
      life: 58,
      damage: scaledDamage(Math.max(8, Math.floor(player.damage * 0.34))),
      hitIds: []
    });
  }

  player.fireCooldown = Math.max(12, 30 - player.fireRateBonus * 2);
}

function detonateFlameMarks() {
  const marked = zombies.filter(zombie => zombie.flameMarked);
  if (marked.length === 0) return false;

  const damageById = new Map();
  for (const source of marked) {
    source.flameMarked = false;
    flameExplosions.push({ x: source.x, y: source.y, life: 24, maxLife: 24, r: 155 });
    for (const zombie of zombies) {
      if (Math.hypot(zombie.x - source.x, zombie.y - source.y) <= 155 + zombie.r) {
        damageById.set(zombie.id, (damageById.get(zombie.id) || 0) + scaledDamage(Math.floor(player.damage * 2.2)));
      }
    }
  }

  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const damage = damageById.get(zombie.id) || 0;
    if (damage <= 0) continue;
    zombie.hp -= damage;
    if (zombie.hp <= 0) killZombie(i, zombie);
  }
  return true;
}

function updateYupiterWeapons() {
  for (let i = 0; i < player.yupiterSkillCooldowns.length; i++) {
    if (player.yupiterSkillCooldowns[i] > 0) player.yupiterSkillCooldowns[i]--;
  }
  if (player.crescentOverdriveTime > 0) player.crescentOverdriveTime--;
  if (player.severingFrenzyTime > 0) player.severingFrenzyTime--;
  if (player.yupiterUltimateCooldown > 0) player.yupiterUltimateCooldown--;
  if (player.crescentUltimateTime > 0) player.crescentUltimateTime--;
  if (player.severingUltimateTime > 0) {
    player.severingUltimateTime--;
    player.invincibleTime = Math.max(player.invincibleTime, 2);
  }

  updateCrescentUltimate();
  updateFlameUltimate();

  for (let i = yupiterSlashes.length - 1; i >= 0; i--) {
    const slash = yupiterSlashes[i];
    const previousSweep = slash.sweep * (1 - slash.life / slash.maxLife);
    slash.life--;
    const currentSweep = slash.sweep * (1 - Math.max(0, slash.life) / slash.maxLife);
    for (let j = zombies.length - 1; j >= 0; j--) {
      const zombie = zombies[j];
      if (slash.hitIds.includes(zombie.id) || Math.hypot(zombie.x - slash.x, zombie.y - slash.y) > slash.range + zombie.r) continue;
      const targetAngle = Math.atan2(zombie.y - slash.y, zombie.x - slash.x);
      const relative = (targetAngle - slash.startAngle + Math.PI * 2) % (Math.PI * 2);
      if (relative < previousSweep || relative > currentSweep) continue;
      slash.hitIds.push(zombie.id);
      const shouldExecute = player.severingUltimateTime > 0 && zombie.hp / zombie.maxHp < 0.2;
      zombie.hp -= scaledDamage(Math.floor(player.damage * 1.15));
      if (shouldExecute && !zombie.isRaidBoss) zombie.hp = 0;
      if (slash.fullCircle) { zombie.bleedTime = 240; zombie.bleedTick = 30; zombie.slowTime = 240; }
      if (zombie.hp <= 0) killZombie(j, zombie);
    }
    if (slash.life <= 0) yupiterSlashes.splice(i, 1);
  }

  for (let i = flameExplosions.length - 1; i >= 0; i--) {
    flameExplosions[i].life--;
    if (flameExplosions[i].life <= 0) flameExplosions.splice(i, 1);
  }

  for (let i = flameProjectiles.length - 1; i >= 0; i--) {
    const shot = flameProjectiles[i];
    shot.x += shot.vx;
    shot.y += shot.vy;
    shot.life--;
    for (let j = zombies.length - 1; j >= 0; j--) {
      const zombie = zombies[j];
      if (shot.hitIds.includes(zombie.id)) continue;
      if (Math.hypot(shot.x - zombie.x, shot.y - zombie.y) >= shot.r + zombie.r) continue;
      zombie.hp -= shot.damage;
      zombie.flameMarked = true;
      shot.hitIds.push(zombie.id);
      for (let p = 0; p < 8; p++) {
        particles.push({
          x: shot.x, y: shot.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 18 + Math.random() * 8,
          color: p % 2 ? "#ff7a32" : "#9b55ff"
        });
      }
      if (zombie.hp <= 0) killZombie(j, zombie);
      shot.damage *= 0.75;
    }

    if (shot.life <= 0 || shot.damage < 1) flameProjectiles.splice(i, 1);
  }
}

function updateCrescentUltimate() {
  if (player.crescentUltimateTime <= 0) return;

  const elapsed = YUPITER_ULTIMATE_DURATION - player.crescentUltimateTime;
  const orbitRadius = 68 + Math.min(250, elapsed * 0.42);
  for (const zombie of zombies) {
    if (zombie.crescentUltimateCooldown > 0) zombie.crescentUltimateCooldown--;
  }

  for (let bladeIndex = 0; bladeIndex < 10; bladeIndex++) {
    const angle = elapsed * 0.075 + Math.PI * 2 * bladeIndex / 10;
    const x = player.x + Math.cos(angle) * orbitRadius;
    const y = player.y + Math.sin(angle) * orbitRadius;
    for (let zombieIndex = zombies.length - 1; zombieIndex >= 0; zombieIndex--) {
      const zombie = zombies[zombieIndex];
      if (zombie.crescentUltimateCooldown > 0 || Math.hypot(zombie.x - x, zombie.y - y) > zombie.r + 27) continue;
      zombie.hp -= scaledDamage(player.damage * 0.65);
      zombie.crescentUltimateCooldown = 10;
      if (zombie.hp <= 0) killZombie(zombieIndex, zombie);
    }
  }
}

function updateFlameUltimate() {
  for (let i = flameUltimateOrbs.length - 1; i >= 0; i--) {
    const orb = flameUltimateOrbs[i];
    orb.x += orb.vx;
    orb.y += orb.vy;
    orb.life--;
    let collided = false;
    for (const zombie of zombies) {
      if (Math.hypot(zombie.x - orb.x, zombie.y - orb.y) <= zombie.r + orb.r) { collided = true; break; }
    }
    if (collided) {
      launchFlameUltimateBarrage(orb.x, orb.y);
      flameExplosions.push({ x: orb.x, y: orb.y, life: 30, maxLife: 30, r: 220 });
      flameUltimateOrbs.splice(i, 1);
    } else if (orb.life <= 0 || orb.x < -100 || orb.x > WORLD.width + 100 || orb.y < -100 || orb.y > WORLD.height + 100) {
      flameUltimateOrbs.splice(i, 1);
    }
  }

  for (let i = flameUltimateShots.length - 1; i >= 0; i--) {
    const shot = flameUltimateShots[i];
    const target = zombies.find(zombie => zombie.id === shot.targetId);
    if (!target) { flameUltimateShots.splice(i, 1); continue; }
    const dx = target.x - shot.x;
    const dy = target.y - shot.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = 18;
    shot.x += dx / distance * Math.min(speed, distance);
    shot.y += dy / distance * Math.min(speed, distance);
    if (distance <= speed + target.r) {
      target.hp -= scaledDamage(player.damage * 0.9);
      target.flameMarked = true;
      const targetIndex = zombies.indexOf(target);
      if (target.hp <= 0 && targetIndex >= 0) killZombie(targetIndex, target);
      flameUltimateShots.splice(i, 1);
    }
  }
}

function launchFlameUltimateBarrage(x, y) {
  for (const zombie of zombies) {
    flameUltimateShots.push({ x, y, targetId: zombie.id });
  }
}
