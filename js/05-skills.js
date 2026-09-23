// 비전, 양자, 드론, 중력장 등 스킬 시스템

function updateFireTrails() {
  for (let i = fireTrails.length - 1; i >= 0; i--) {
    const fire = fireTrails[i];
    fire.life--;

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];
      const dist = Math.hypot(z.x - fire.x, z.y - fire.y);

      if (dist < z.r + fire.r) {
        z.hp -= fire.damagePerFrame;

        if (z.hp <= 0) {
          killZombie(j, z);
        }
      }
    }

    if (fire.life <= 0) {
      fireTrails.splice(i, 1);
    }
  }
}

function triggerVisionStun() {
  if (player.visionLevel <= 0) return;
  for (const z of zombies) { z.stunTime = 60; z.stunFlash = 35; }
  visionEffectTime = 50;
  for (let i = 0; i < 70; i++) {
    const angle = Math.random() * Math.PI * 2, speed = Math.random() * 7 + 1;
    particles.push({ x: player.x, y: player.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 40, color: "#9b5cff" });
  }
}

function updateVision() {
  if (visionEffectTime > 0) visionEffectTime--;
  if (player.visionLevel <= 0) return;
  player.visionTimer--;
  if (player.visionTimer <= 0) { triggerVisionStun(); player.visionTimer = 600; }
}

function triggerQuantumLaser() {
  if (player.quantumLevel <= 0) return;

  laserSlashes.push({
    angle: player.quantumAngle,
    length: 560,
    width: 30,
    life: 100,
    maxLife: 100,
    hitIds: []
  });

  player.quantumAngle += Math.PI / 4;
}

function updateQuantum() {
  if (player.quantumLevel <= 0) return;

  player.quantumTimer--;

  if (player.quantumTimer <= 0) {
    triggerQuantumLaser();
    player.quantumTimer = 180;
  }
}

function updateLaserSlashes() {
  for (let i = laserSlashes.length - 1; i >= 0; i--) {
    const laser = laserSlashes[i];

    laser.life--;

    const progress = 1 - laser.life / laser.maxLife;
    const angle = laser.angle + progress * Math.PI * 2;

    const x1 = player.x - Math.cos(angle) * laser.length / 2;
    const y1 = player.y - Math.sin(angle) * laser.length / 2;
    const x2 = player.x + Math.cos(angle) * laser.length / 2;
    const y2 = player.y + Math.sin(angle) * laser.length / 2;

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];

      if (laser.hitIds.includes(z.id)) continue;

      const dist = distancePointToSegment(z.x, z.y, x1, y1, x2, y2);

      if (dist < z.r + laser.width) {
        z.hp -= enemyMaxHpDamage(z, 0.2) * (player.crownLevel > 0 ? 2 : 1);
        laser.hitIds.push(z.id);

        for (let k = 0; k < 16; k++) {
          particles.push({
            x: z.x,
            y: z.y,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            life: 26,
            color: Math.random() < 0.5 ? "#00e5ff" : "#c77dff"
          });
        }

        if (z.hp <= 0) {
          killZombie(j, z);
        }
      }
    }

    if (laser.life <= 0) {
      laserSlashes.splice(i, 1);
    }
  }
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = x1 + t * dx;
  const cy = y1 + t * dy;

  return Math.hypot(px - cx, py - cy);
}

function hasWorldEnder() {
  return player.worldEnderLevel > 0;
}

function fireDroneBurst(droneType) {
  const enabled = droneType === "W"
    ? hasWorldEnder()
    : (droneType === "B" ? player.droneBLevel > 0 : player.droneLevel > 0);
  if (!enabled || zombies.length === 0) return;

  const target = [...zombies].sort(
    (a, b) =>
      Math.hypot(a.x - player.x, a.y - player.y) -
      Math.hypot(b.x - player.x, b.y - player.y)
  )[0];

  if (!target) return;

  const droneX = player.x + (droneType === "W" ? 0 : (droneType === "B" ? -36 : 36));
  const droneY = player.y - (droneType === "W" ? 48 : 36);
  const angle = Math.atan2(target.y - droneY, target.x - droneX);

  droneBullets.push({
    x: droneX,
    y: droneY,
    vx: Math.cos(angle) * 18,
    vy: Math.sin(angle) * 18,
    r: 4,
    damageRatio: 0.05,
    droneType,
    life: 90
  });
}

function updateDrone() {
  if (hasWorldEnder()) {
    player.droneTimer--;
    if (player.droneTimer <= 0) {
      fireDroneBurst("W");
      player.droneTimer = 12;
    }
    return;
  }

  if (player.droneLevel > 0) {
    player.droneTimer--;
    if (player.droneTimer <= 0) {
      fireDroneBurst("A");
      player.droneTimer = 12;
    }
  }

  if (player.droneBLevel > 0) {
    player.droneBTimer--;
    if (player.droneBTimer <= 0) {
      fireDroneBurst("B");
      player.droneBTimer = 18;
    }
  }
}

function updateTimeRewind() {
  if (player.timeRewindLevel <= 0) return;

  player.timeRewindTimer--;
  if (player.timeRewindEffectTime > 0) player.timeRewindEffectTime--;
  if (player.timeRewindTimer > 0) return;

  const missingHp = Math.max(0, player.maxHp - player.hp);
  if (missingHp > 0) {
    player.hp = Math.min(player.maxHp, player.hp + missingHp * 0.7);
    player.timeRewindEffectTime = 45;
    for (let i = 0; i < 36; i++) {
      const angle = Math.PI * 2 * i / 36;
      particles.push({
        x: player.x + Math.cos(angle) * 48,
        y: player.y + Math.sin(angle) * 48,
        vx: -Math.cos(angle) * (1.5 + Math.random() * 2.5),
        vy: -Math.sin(angle) * (1.5 + Math.random() * 2.5),
        life: 24 + Math.random() * 18,
        color: i % 2 === 0 ? "#78fff1" : "#b987ff"
      });
    }
  }
  player.timeRewindTimer = 1200;
}

function triggerWorldEnderExplosion(x, y) {
  const radius = 260;

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (Math.hypot(z.x - x, z.y - y) > radius) continue;
    z.hp -= enemyMaxHpDamage(z, 0.1) * (player.crownLevel > 0 ? 2 : 1);
    if (z.hp <= 0) killZombie(i, z);
  }

  for (let p = 0; p < 64; p++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 11;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 28 + Math.random() * 24,
      color: p % 3 === 0 ? "#fff0a8" : (p % 2 === 0 ? "#00e5ff" : "#ff4fd8")
    });
  }
}

function updateDroneBullets() {
  for (let i = droneBullets.length - 1; i >= 0; i--) {
    const b = droneBullets[i];

    let target = null;
    let bestDist = Infinity;

    for (const z of zombies) {
      const d = Math.hypot(z.x - b.x, z.y - b.y);
      if (d < bestDist) {
        bestDist = d;
        target = z;
      }
    }

    if (target) {
      const angle = Math.atan2(target.y - b.y, target.x - b.x);
      const speed = 18;

      b.vx = b.vx * 0.82 + Math.cos(angle) * speed * 0.18;
      b.vy = b.vy * 0.82 + Math.sin(angle) * speed * 0.18;
    }

    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    let hit = false;

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];

      if (Math.hypot(b.x - z.x, b.y - z.y) < b.r + z.r) {
        const worldEnder = b.droneType === "W" && hasWorldEnder();
        const damageRatio = worldEnder ? 0.125 : b.damageRatio;
        z.hp -= enemyMaxHpDamage(z, damageRatio) * (player.crownLevel > 0 ? 2 : 1);
        hit = true;

        for (let k = 0; k < 8; k++) {
          particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 18,
            color: worldEnder ? (k % 3 === 0 ? "#ffe878" : (k % 2 ? "#00e5ff" : "#ff4fd8")) : (b.droneType === "B" ? "#ff4fd8" : "#00e5ff")
          });
        }

        if (z.hp <= 0) {
          const deathX = z.x;
          const deathY = z.y;
          killZombie(j, z);
          if (worldEnder) triggerWorldEnderExplosion(deathX, deathY);
        }

        break;
      }
    }

    if (hit || b.life <= 0) {
      droneBullets.splice(i, 1);
    }
  }
}

function updateGravityFields() {
  for (let i = gravityFields.length - 1; i >= 0; i--) {
    const g = gravityFields[i];
    g.life--;

    if (g.life % 2 === 0) {
      for (let s = 0; s < 3; s++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * g.r;

        particles.push({
          x: g.x + Math.cos(angle) * radius,
          y: g.y + Math.sin(angle) * radius,
          vx: Math.cos(angle + Math.PI) * (3 + Math.random() * 4),
          vy: Math.sin(angle + Math.PI) * (3 + Math.random() * 4),
          life: 32,
          color: Math.random() < 0.5 ? "#b967ff" : "#7d2cff"
        });
      }
    }

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];

      const dx = g.x - z.x;
      const dy = g.y - z.y;
      const dist = Math.hypot(dx, dy);

      if (dist < g.r && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        const pull = 3.5 + (1 - dist / g.r) * 9.5;
        const swirl = 2.4 + (1 - dist / g.r) * 2.2;

        z.x += nx * pull + (-ny) * swirl;
        z.y += ny * pull + nx * swirl;

        z.x = Math.max(z.r, Math.min(WORLD.width - z.r, z.x));
        z.y = Math.max(z.r, Math.min(WORLD.height - z.r, z.y));

        if (!g.hitIds.includes(z.id)) {
          z.hp -= enemyMaxHpDamage(z, 0.3) * (player.crownLevel > 0 ? 2 : 1);
          g.hitIds.push(z.id);

          for (let k = 0; k < 18; k++) {
            particles.push({
              x: z.x,
              y: z.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 28,
              color: "#d6a2ff"
            });
          }

          if (z.hp <= 0) {
            killZombie(j, z);
          }
        }
      }
    }

    if (g.life <= 0) {
      gravityFields.splice(i, 1);
    }
  }
}

function findBestGravityPoint() {
  const margin = 40;

  const visibleZombies = zombies.filter(z =>
    z.x >= camera.x - margin &&
    z.x <= camera.x + canvas.width + margin &&
    z.y >= camera.y - margin &&
    z.y <= camera.y + canvas.height + margin
  );

  const candidates = visibleZombies.length > 0 ? visibleZombies : zombies;

  if (candidates.length === 0) {
    return { x: player.x, y: player.y };
  }

  const cellSize = 220;
  const grid = new Map();

  for (const z of candidates) {
    const gx = Math.floor(z.x / cellSize);
    const gy = Math.floor(z.y / cellSize);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const key = `${gx + ox},${gy + oy}`;

        if (!grid.has(key)) {
          grid.set(key, {
            xSum: 0,
            ySum: 0,
            score: 0,
            count: 0
          });
        }

        const cell = grid.get(key);
        const centerX = (gx + ox + 0.5) * cellSize;
        const centerY = (gy + oy + 0.5) * cellSize;
        const d = Math.hypot(z.x - centerX, z.y - centerY);

        if (d < 360) {
          const weight = (z.boss ? 3 : 1) * (1 - d / 360);
          cell.xSum += z.x * weight;
          cell.ySum += z.y * weight;
          cell.score += weight;
          cell.count++;
        }
      }
    }
  }

  let best = null;

  for (const cell of grid.values()) {
    if (!best || cell.score > best.score) {
      best = cell;
    }
  }

  if (!best || best.score <= 0) {
    return { x: candidates[0].x, y: candidates[0].y };
  }

  let x = best.xSum / best.score;
  let y = best.ySum / best.score;

  x = Math.max(140, Math.min(WORLD.width - 140, x));
  y = Math.max(140, Math.min(WORLD.height - 140, y));

  return { x, y };
}

function triggerGravityField() {
  if (player.gravityLevel <= 0) return;

  const point = findBestGravityPoint();

  gravityFields.push({
    x: point.x,
    y: point.y,
    r: 240,
    life: 60,
    maxLife: 60,
    hitIds: [],
    spin: Math.random() * Math.PI * 2
  });

  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 300;

    particles.push({
      x: point.x + Math.cos(angle) * radius,
      y: point.y + Math.sin(angle) * radius,
      vx: Math.cos(angle + Math.PI) * (2 + Math.random() * 5),
      vy: Math.sin(angle + Math.PI) * (2 + Math.random() * 5),
      life: 42,
      color: Math.random() < 0.5 ? "#b967ff" : "#7d2cff"
    });
  }
}

function updateGravitySkill() {
  if (player.gravityLevel <= 0) return;

  player.gravityTimer--;

  if (player.gravityTimer <= 0) {
    triggerGravityField();
    player.gravityTimer = 720;
  }
}
