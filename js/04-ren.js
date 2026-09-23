// 렌: 그림자 조각과 분신을 다루는 무탄창 근접 암살자

const REN_SKILL_COOLDOWN = 300;
const REN_SWAP_COOLDOWN = 180;
const REN_DEPLOY_COOLDOWN = 30;
const REN_ULTIMATE_COOLDOWN = 3600;
const REN_ULTIMATE_DURATION = 420;
const REN_ULTIMATE_RADIUS = 429;
const REN_ULTIMATE_TICK = 6;
const REN_CLONE_RECALL_DISTANCE = 760;
const REN_CLONE_THROW_RANGE = 320;
const REN_ATTACK_RANGE = 216;
const REN_ATTACK_COOLDOWN = 18;

function getRenCloneCount() {
  const count = Math.floor(player.renShards / 3);
  return Math.min(player.renTotalEclipseLevel > 0 ? 8 : 4, count);
}

function getRenAttackMultiplier() {
  return 1 + player.renShards * 0.01;
}

function attackWithRen() {
  if (player.fireCooldown > 0) return;
  const target = findRenTarget(player.x, player.y, REN_ATTACK_RANGE);
  const angle = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const endX = target ? target.x : player.x;
  const endY = target ? target.y : player.y;
  queueRenStrike(target, endX, endY, 0, scaledDamage(player.damage * getRenAttackMultiplier()), false, player.x, player.y, angle);

  for (const clone of renPlacedClones) {
    const cloneTarget = findRenTarget(clone.x, clone.y, REN_ATTACK_RANGE);
    if (!cloneTarget) continue;
    queueRenStrike(
      cloneTarget,
      cloneTarget.x,
      cloneTarget.y,
      2,
      scaledDamage(player.damage * getRenAttackMultiplier() * 0.2),
      true,
      clone.x,
      clone.y
    );
  }

  for (let repeat = 0; repeat < player.renAfterimageLevel; repeat++) {
    queueRenStrike(target, endX, endY, 5 + repeat * 4, scaledDamage(player.damage * 0.42 * getRenAttackMultiplier()), true, player.x, player.y, angle);
  }
  const insideUltimateField = player.renUltimateTime > 0 &&
    Math.hypot(player.x - player.renUltimateX, player.y - player.renUltimateY) <= REN_ULTIMATE_RADIUS;
  player.fireCooldown = insideUltimateField ? 5 : REN_ATTACK_COOLDOWN;
}

function queueRenStrike(target, x, y, delay, damage, shadow, startX = player.x, startY = player.y, attackAngle = null) {
  renAttackEffects.push({
    startX, startY, x, y,
    angle: attackAngle ?? Math.atan2(y - startY, x - startX), targetId: target ? target.id : null,
    delay, life: 14, maxLife: 14, damage, applied: false, shadow
  });
}

function findRenTarget(x, y, range, excludedIds = []) {
  const aim = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  let best = null;
  let bestScore = Infinity;
  for (const zombie of zombies) {
    if (excludedIds.includes(zombie.id)) continue;
    const distance = Math.hypot(zombie.x - x, zombie.y - y);
    if (distance > range) continue;
    const angle = Math.atan2(zombie.y - y, zombie.x - x);
    const error = Math.abs(Math.atan2(Math.sin(angle - aim), Math.cos(angle - aim)));
    const score = distance + error * 130;
    if (score < bestScore) { best = zombie; bestScore = score; }
  }
  return best;
}

function deployRenShadow() {
  const capacity = getRenCloneCount();
  if (capacity <= 0 || player.renDeployCooldown > 0) return;
  if (renPlacedClones.length + renFlyingClones.length >= capacity) {
    renRecallingClones.push(...renPlacedClones.map(clone => ({
      startX: clone.x,
      startY: clone.y,
      x: clone.x,
      y: clone.y,
      progress: 0,
      duration: 15,
      phase: clone.phase
    })));
    renPlacedClones = [];
    renFlyingClones = [];
    player.renDeployCooldown = REN_DEPLOY_COOLDOWN;
    return;
  }
  const dx = mouse.worldX - player.x;
  const dy = mouse.worldY - player.y;
  const distance = Math.hypot(dx, dy) || 1;
  const throwDistance = Math.min(REN_CLONE_THROW_RANGE, distance);
  const targetX = Math.max(35, Math.min(WORLD.width - 35, player.x + dx / distance * throwDistance));
  const targetY = Math.max(35, Math.min(WORLD.height - 35, player.y + dy / distance * throwDistance));
  renFlyingClones.push({
    startX: player.x,
    startY: player.y,
    x: player.x,
    y: player.y,
    targetX,
    targetY,
    progress: 0,
    duration: Math.max(12, Math.round(throwDistance / 18)),
    phase: Math.random() * Math.PI * 2
  });
  player.renDeployCooldown = REN_DEPLOY_COOLDOWN;
  createRenBurst(player.x, player.y, "#d63b64", 24);
}

function teleportToLatestRenShadow() {
  if (renPlacedClones.length <= 0 || player.renSwapCooldown > 0) return;
  const destination = renPlacedClones[renPlacedClones.length - 1];
  const oldX = player.x;
  const oldY = player.y;
  if (Math.hypot(destination.x - oldX, destination.y - oldY) < 8) return;

  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    if (distanceToRenSwapPath(zombie.x, zombie.y, oldX, oldY, destination.x, destination.y) > zombie.r + 46) continue;
    zombie.hp -= scaledDamage(player.damage * 1.25 * getRenAttackMultiplier());
    if (zombie.hp <= 0) killZombie(i, zombie);
  }

  player.renSwapStartX = oldX;
  player.renSwapStartY = oldY;
  player.renSwapEndX = destination.x;
  player.renSwapEndY = destination.y;
  player.renSwapTrailTime = 18;
  player.x = Math.max(player.r, Math.min(WORLD.width - player.r, destination.x));
  player.y = Math.max(player.r, Math.min(WORLD.height - player.r, destination.y));
  player.invincibleTime = Math.max(player.invincibleTime, 15);
  player.renSwapCooldown = REN_SWAP_COOLDOWN;
  createRenBurst(oldX, oldY, "#732449", 20);
  createRenBurst(player.x, player.y, "#d63b64", 28);
}

function distanceToRenSwapPath(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

function activateRenSkill() {
  if (player.renSkillCooldown > 0) return;
  if (renPlacedClones.length <= 0 || zombies.length === 0) return;
  const used = [];
  for (const clone of renPlacedClones) {
    const target = findRenNearestUnclaimed(used, 480, clone.x, clone.y);
    if (!target) continue;
    used.push(target.id);
    queueRenStrike(target, target.x, target.y, used.length * 2, scaledDamage(player.damage * 0.7 * getRenAttackMultiplier()), true, clone.x, clone.y);
  }
  player.renSkillCooldown = REN_SKILL_COOLDOWN;
}

function findRenNearestUnclaimed(excludedIds, range = Infinity, originX = player.x, originY = player.y) {
  let best = null;
  let bestDistance = Infinity;
  for (const zombie of zombies) {
    if (excludedIds.includes(zombie.id)) continue;
    const distance = Math.hypot(zombie.x - originX, zombie.y - originY);
    if (distance > range) continue;
    if (distance < bestDistance) { best = zombie; bestDistance = distance; }
  }
  return best;
}

function activateRenUltimate() {
  if (player.renUltimateCooldown > 0) return;
  player.renUltimateTime = REN_ULTIMATE_DURATION;
  player.renUltimateStrikeTimer = 0;
  player.renUltimateX = player.x;
  player.renUltimateY = player.y;
  player.renUltimateCooldown = REN_ULTIMATE_COOLDOWN;
  createRenBurst(player.x, player.y, "#ff315f", 36);
}

function updateRen() {
  if (selectedCharacter !== "ren") return;
  if (player.renSwapCooldown > 0) player.renSwapCooldown--;
  if (player.renDeployCooldown > 0) player.renDeployCooldown--;
  if (player.renSwapTrailTime > 0) player.renSwapTrailTime--;
  if (player.renSkillCooldown > 0) player.renSkillCooldown--;
  if (player.renUltimateCooldown > 0) player.renUltimateCooldown--;

  for (let i = renPlacedClones.length - 1; i >= 0; i--) {
    const clone = renPlacedClones[i];
    const dx = clone.x - player.x;
    const dy = clone.y - player.y;
    if (dx * dx + dy * dy <= REN_CLONE_RECALL_DISTANCE * REN_CLONE_RECALL_DISTANCE) continue;
    renRecallingClones.push({
      startX: clone.x, startY: clone.y, x: clone.x, y: clone.y,
      progress: 0, duration: 15, phase: clone.phase
    });
    renPlacedClones.splice(i, 1);
  }

  for (let i = renFlyingClones.length - 1; i >= 0; i--) {
    const clone = renFlyingClones[i];
    clone.progress = Math.min(1, clone.progress + 1 / clone.duration);
    const eased = 1 - Math.pow(1 - clone.progress, 3);
    clone.x = clone.startX + (clone.targetX - clone.startX) * eased;
    clone.y = clone.startY + (clone.targetY - clone.startY) * eased;
    if (clone.progress < 1) continue;
    renPlacedClones.push({ x: clone.targetX, y: clone.targetY, phase: clone.phase });
    createRenBurst(clone.targetX, clone.targetY, "#ff315f", 26);
    renFlyingClones.splice(i, 1);
  }

  for (let i = renRecallingClones.length - 1; i >= 0; i--) {
    const clone = renRecallingClones[i];
    clone.progress = Math.min(1, clone.progress + 1 / clone.duration);
    const eased = clone.progress * clone.progress * (3 - 2 * clone.progress);
    clone.x = clone.startX + (player.x - clone.startX) * eased;
    clone.y = clone.startY + (player.y - clone.startY) * eased;
    if (clone.progress < 1) continue;
    createRenBurst(player.x, player.y, "#d63b64", 10);
    renRecallingClones.splice(i, 1);
  }

  if (player.renUltimateTime > 0) {
    player.renUltimateTime--;
    player.renUltimateStrikeTimer--;
    if (player.renUltimateStrikeTimer <= 0) {
      player.renUltimateStrikeTimer = REN_ULTIMATE_TICK;
      for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        const dx = zombie.x - player.renUltimateX;
        const dy = zombie.y - player.renUltimateY;
        if (dx * dx + dy * dy > (REN_ULTIMATE_RADIUS + zombie.r) ** 2) continue;
        zombie.slowTime = Math.max(zombie.slowTime || 0, 12);
        zombie.hp -= enemyMaxHpDamage(zombie, 0.1);
        if (zombie.hp <= 0) killZombie(i, zombie);
      }
    }
  }

  for (let i = renAttackEffects.length - 1; i >= 0; i--) {
    const effect = renAttackEffects[i];
    if (effect.delay > 0) { effect.delay--; continue; }
    if (!effect.applied) {
      effect.applied = true;
      const target = zombies.find(zombie => zombie.id === effect.targetId);
      if (target) {
        target.hp -= effect.damage;
        const index = zombies.indexOf(target);
        if (target.hp <= 0 && index >= 0) killZombie(index, target);
      }
      createRenBurst(effect.x, effect.y, effect.shadow ? "#8c244d" : "#ff5378", effect.shadow ? 8 : 14);
    }
    effect.life--;
    if (effect.life <= 0) renAttackEffects.splice(i, 1);
  }

  updateRenShadowFields();
  updateRenShadowShards();
}

function onRenZombieKilled(zombie) {
  if (selectedCharacter !== "ren") return;
  if (Math.random() < 0.2) {
    // 고정 좌표 버킷으로 묶어, 처치할 때마다 모든 조각을 검색하지 않게 한다.
    const bucketKey = `${Math.floor(zombie.x / 64)},${Math.floor(zombie.y / 64)}`;
    const nearbyStack = renShadowShardBuckets.get(bucketKey);
    if (nearbyStack) {
      const amount = nearbyStack.amount || 1;
      nearbyStack.x = (nearbyStack.x * amount + zombie.x) / (amount + 1);
      nearbyStack.y = (nearbyStack.y * amount + zombie.y) / (amount + 1);
      nearbyStack.amount = amount + 1;
      nearbyStack.phase = Math.random() * Math.PI * 2;
    } else {
      const shard = { x: zombie.x, y: zombie.y, r: 14, amount: 1, phase: Math.random() * Math.PI * 2, bucketKey };
      renShadowShards.push(shard);
      renShadowShardBuckets.set(bucketKey, shard);
    }
    createRenBurst(zombie.x, zombie.y, "#c93666", 8);
  }
  if (player.renReaperFootstepsLevel > 0) {
    if (renShadowFields.length >= 5) renShadowFields.shift();
    renShadowFields.push({ x: zombie.x, y: zombie.y, r: 96, life: 150, tick: 1 });
  }
}

function updateRenShadowShards() {
  for (let i = renShadowShards.length - 1; i >= 0; i--) {
    const shard = renShadowShards[i];
    const dx = player.x - shard.x;
    const dy = player.y - shard.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared > 135 * 135) continue;
    const distance = Math.sqrt(distanceSquared) || 1;
    if (distance < 135) {
      const pull = distance < 70 ? 7 : 3.2;
      shard.x += dx / distance * pull;
      shard.y += dy / distance * pull;
    }
    if (distance > player.r + shard.r + 4) continue;
    const amount = shard.amount || 1;
    player.renShards += amount;
    if (player.renDarkDevourLevel > 0) {
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.005 * player.renDarkDevourLevel * amount);
    }
    createRenBurst(shard.x, shard.y, "#ff4d79", Math.min(22, 10 + amount * 2));
    if (shard.bucketKey) renShadowShardBuckets.delete(shard.bucketKey);
    renShadowShards.splice(i, 1);
  }
}

function updateRenShadowFields() {
  for (let fieldIndex = renShadowFields.length - 1; fieldIndex >= 0; fieldIndex--) {
    const field = renShadowFields[fieldIndex];
    field.life--;
    field.tick--;
    if (field.tick <= 0) {
      field.tick = 30;
      for (let zombieIndex = zombies.length - 1; zombieIndex >= 0; zombieIndex--) {
        const zombie = zombies[zombieIndex];
        if (Math.hypot(zombie.x - field.x, zombie.y - field.y) > field.r + zombie.r) continue;
        zombie.hp -= scaledDamage(player.damage * 0.38);
        zombie.slowTime = Math.max(zombie.slowTime || 0, 35);
        if (zombie.hp <= 0) killZombie(zombieIndex, zombie);
      }
    }
    if (field.life <= 0) renShadowFields.splice(fieldIndex, 1);
  }
}

function detonateRenShadows() {
  const count = Math.max(1, renPlacedClones.length);
  const radius = 105 + Math.min(120, count * 8);
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    if (Math.hypot(zombie.x - player.x, zombie.y - player.y) > radius + zombie.r) continue;
    zombie.hp -= scaledDamage(player.damage * (1.8 + count * 0.15));
    if (zombie.hp <= 0) killZombie(i, zombie);
  }
  createRenBurst(player.x, player.y, "#ff315f", 90);
}

function createRenBurst(x, y, color, count) {
  if (particles.length > 900) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 7;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 14 + Math.random() * 20, color });
  }
}
