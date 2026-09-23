// 총기, 발사, 적·아이템 생성, 처치 처리

function reload() {
  if (player.reloadTime <= 0 && player.ammo < player.maxAmmo) {
    player.reloadTime = 90;
  }
}

function shoot() {
  if (player.fireCooldown > 0 || player.reloadTime > 0) return;

  if (selectedCharacter === "ren") {
    attackWithRen();
    return;
  }

  if (selectedCharacter === "nightLord") {
    attackWithNightLord();
    return;
  }

  if (selectedCharacter === "zero") {
    attackWithZero();
    return;
  }

  if (selectedCharacter === "paladin") {
    attackWithPaladin();
    return;
  }

  if (selectedCharacter === "arc") {
    attackWithArc();
    return;
  }
  if (selectedCharacter === "terra") {
    attackWithTerra();
    return;
  }
  if (selectedCharacter === "void") { attackWithVoid(); return; }
  if(selectedCharacter==="carmilla"){attackWithCarmilla();return;}
  if(selectedCharacter==="vargas"){attackWithVargas();return;}
  if(selectedCharacter==="echo"){attackWithEcho();return;}
  if(selectedCharacter==="aria"){attackWithAria();return;}
  if(selectedCharacter==="moira"){attackWithMoira();return;}
  if(selectedCharacter==="mare"){attackWithMare();return;}

  if (selectedCharacter === "yupiter") {
    attackWithYupiterWeapon();
    return;
  }

  const isGatling = player.gatlingLevel > 0;

  if (!isGatling && player.ammo <= 0) {
    reload();
    return;
  }

  let angle = Math.atan2(
    mouse.worldY - player.y,
    mouse.worldX - player.x
  );

  if (selectedCharacter === "luminous" && zombies.length > 0) {
    const target = findNearestHomingTarget(player.x, player.y, []);
    if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
  }

  bullets.push({
    x: player.x + Math.cos(angle) * player.r,
    y: player.y + Math.sin(angle) * player.r,
    vx: Math.cos(angle) * (isGatling ? 15 : 13),
    vy: Math.sin(angle) * (isGatling ? 15 : 13),
    r: isGatling ? 4 : 5,
    damage: scaledDamage(isGatling ? Math.max(12, Math.floor(player.damage * 0.55)) : player.damage),
    life: isGatling ? 80 : 100,
    bounceLeft: player.ricochetLevel > 0 ? 2 + player.ricochetLevel : 0,
    homing: selectedCharacter === "luminous",
    sourceCharacter: selectedCharacter,
    hitIds: []
  });

  if (selectedCharacter === "luminous") {
    player.luminousAttackTime = 8;
    player.luminousAttackAngle = angle;
    const palmX = player.x + Math.cos(angle) * 37;
    const palmY = player.y + Math.sin(angle) * 37 - 8;
    for (let i = 0; i < 7; i++) {
      particles.push({
        x: palmX,
        y: palmY,
        vx: Math.cos(angle) * (1.5 + Math.random() * 3) + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * (1.5 + Math.random() * 3) + (Math.random() - 0.5) * 2,
        life: 10 + Math.random() * 8,
        color: i % 2 === 0 ? "#d974ff" : "#6ff7ff"
      });
    }
  }

  if (!isGatling) {
    player.ammo--;
  }

  if (isGatling) {
    player.fireCooldown = selectedCharacter === "luminous" ? 3 : 2;
  } else {
    player.fireCooldown = Math.max(4, 9 - player.fireRateBonus);
  }
}

function throwCrescentBlade() {
  const maxBlades = player.crescentOverdriveTime > 0 ? 4 : 1;
  if (crescentBlades.length >= maxBlades) return;

  const aimAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  let target = null;
  let bestScore = Infinity;

  for (const zombie of zombies) {
    const dx = zombie.x - player.x;
    const dy = zombie.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 900) continue;
    const targetAngle = Math.atan2(dy, dx);
    const angleError = Math.abs(Math.atan2(Math.sin(targetAngle - aimAngle), Math.cos(targetAngle - aimAngle)));
    if (angleError > 0.42) continue;
    const score = angleError * 500 + distance * 0.15;
    if (score < bestScore) {
      bestScore = score;
      target = zombie;
    }
  }

  const angle = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : aimAngle;
  const targetDistance = target
    ? Math.hypot(target.x - player.x, target.y - player.y)
    : Math.min(520, Math.hypot(mouse.worldX - player.x, mouse.worldY - player.y));
  const clampedDistance = Math.max(80, Math.min(700, targetDistance));

  crescentBlades.push({
    x: player.x + Math.cos(angle) * 30,
    y: player.y + Math.sin(angle) * 30,
    vx: Math.cos(angle) * 15,
    vy: Math.sin(angle) * 15,
    r: 25,
    angle: 0,
    distance: 0,
    maxDistance: Math.max(180, Math.min(520, targetDistance + 55)),
    returnSpeed: (20 - clampedDistance * 0.014) * player.crescentReturnMultiplier,
    returning: false,
    outwardHitIds: [],
    returnHitIds: [],
    loyaltyRelaunches: 0,
    damage: scaledDamage(player.damage)
  });

  player.fireCooldown = Math.max(10, 24 - player.fireRateBonus * 2);
}

function spawnZombie() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) {
    x = Math.random() * WORLD.width;
    y = -40;
  } else if (side === 1) {
    x = WORLD.width + 40;
    y = Math.random() * WORLD.height;
  } else if (side === 2) {
    x = Math.random() * WORLD.width;
    y = WORLD.height + 40;
  } else {
    x = -40;
    y = Math.random() * WORLD.height;
  }

  const boss = wave >= 5 && Math.random() < 0.08;

  zombies.push({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()),
    x,
    y,
    r: boss ? 36 : 21,
    speed: boss ? 1.1 : 1.45 + wave * 0.05,
    hp: boss ? 240 + wave * 35 : 75 + wave * 12,
    maxHp: boss ? 240 + wave * 35 : 75 + wave * 12,
    boss
  });
}

function spawnItem() {
  const rand = Math.random();
  let type;
  if (rand < 0.35) type = "heal";
  else if (rand < 0.62) type = "slow";
  else if (rand < 0.82) type = "magnet";
  else type = "bomb";
  items.push({ x: Math.random() * WORLD.width, y: Math.random() * WORLD.height, r: 16, type });
}

function createDaggers(count) {
  for (let i = 0; i < count; i++) {
    daggers.push({
      angle: Math.random() * Math.PI * 2,
      radius: 58 + daggers.length * 10,
      damage: scaledDamage(25 + player.daggerLevel * 10),
      cooldown: 0
    });
  }
}

function dropExp(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    expOrbs.push({
      x: x + (Math.random() - 0.5) * 45,
      y: y + (Math.random() - 0.5) * 45,
      r: 8,
      value: 1
    });
  }
}

function collectAllExp() {
  for (let i = expOrbs.length - 1; i >= 0; i--) {
    gainExp(expOrbs[i].value);
    expOrbs.splice(i, 1);
  }
}

function bombAllNearbyZombies() {
  const radius = 520;
  const killedZombies = [];

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];

    if (Math.hypot(z.x - player.x, z.y - player.y) < radius) {
      if (z.isRaidBoss) {
        z.hp -= z.maxHp * 0.05;
        continue;
      } else if (wave <= 10) {
        z.hp = 0;
      } else {
        z.hp -= z.maxHp * 0.3 * (player.crownLevel > 0 ? 2 : 1);
      }

      const pushAngle = Math.atan2(z.y - player.y, z.x - player.x);
      z.x += Math.cos(pushAngle) * 45;
      z.y += Math.sin(pushAngle) * 45;

      if (z.hp <= 0) {
        killedZombies.push(z);
        zombies.splice(i, 1);
      }
    }
  }

  for (const z of killedZombies) {
    player.score += z.boss ? 100 : 20;
    player.kills++;
    totalZombieKills++;
    saveTotalKills();

    dropExp(z.x, z.y, z.boss ? 8 : 3);

    if (player.kills % 10 === 0) {
      dropExp(z.x, z.y, 8);
    }

    if (player.score > 0 && player.score % 200 === 0) {
      wave++;
    }
  }

  for (let i = 0; i < 110; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 2;

    particles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 48,
      color: "#ffcc00"
    });
  }
}

function killZombie(index, zombie, allowExplosion = true) {
  if (zombie.isRaidBoss) {
    zombies.splice(index, 1);
    defeatRaidBoss(zombie);
    return;
  }

  if (zombie.isBossMinion) {
    zombies.splice(index, 1);
    return;
  }

  player.score += zombie.boss ? 100 : 20;
  player.kills++;
  totalZombieKills++;
  saveTotalKills();

  if (player.lifeStealLevel > 0) {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.01);
  }

  onRenZombieKilled(zombie);
  onVargasZombieKilled(zombie);

  dropExp(zombie.x, zombie.y, zombie.boss ? 8 : 3);

  if (player.kills % 10 === 0) {
    dropExp(zombie.x, zombie.y, 8);
  }

  if (player.stickyLevel > 0) {
    stickyZones.push({
      x: zombie.x,
      y: zombie.y,
      r: 70 + player.stickyLevel * 20,
      life: 260 + player.stickyLevel * 70,
      slow: Math.max(0.25, 0.6 - player.stickyLevel * 0.08)
    });
  }

  zombies.splice(index, 1);

  if (allowExplosion && player.explosionLevel > 0) {
    explode(zombie.x, zombie.y);
  }

  if (player.score > 0 && player.score % 200 === 0) {
    wave++;
  }
}

function explode(x, y) {
  const radius = 75 + player.explosionLevel * 20;
  const damage = scaledDamage(35 + player.explosionLevel * 15);

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    const dist = Math.hypot(z.x - x, z.y - y);

    if (dist < radius) {
      z.hp -= damage;

      if (z.hp <= 0) {
        killZombie(i, z, false);
      }
    }
  }

  for (let i = 0; i < 28; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9,
      life: 35,
      color: "#ff9f1c"
    });
  }
}

function findNearestZombie(x, y, excludeIds) {
  let target = null;
  let bestDist = Infinity;

  for (const z of zombies) {
    if (excludeIds.includes(z.id)) continue;

    const dist = Math.hypot(z.x - x, z.y - y);

    if (dist < bestDist && dist < 450) {
      bestDist = dist;
      target = z;
    }
  }

  return target;
}

function findNearestHomingTarget(x, y, excludeIds) {
  let target = null;
  let bestDist = Infinity;
  for (const z of zombies) {
    if (excludeIds.includes(z.id)) continue;
    const dist = Math.hypot(z.x - x, z.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      target = z;
    }
  }
  return target;
}

function createFireTrail() {
  if (player.fireTrailLevel <= 0) return;

  if (!player.lastFireTrailX && !player.lastFireTrailY) {
    player.lastFireTrailX = player.x;
    player.lastFireTrailY = player.y;
  }

  const moved = Math.hypot(player.x - player.lastFireTrailX, player.y - player.lastFireTrailY);

  if (moved < 22) return;

  fireTrails.push({
    x: player.x,
    y: player.y,
    r: 34,
    life: 180,
    maxLife: 180,
    damagePerFrame: scaledDamage(0.45),
    slow: 0.65
  });

  player.lastFireTrailX = player.x;
  player.lastFireTrailY = player.y;
}
