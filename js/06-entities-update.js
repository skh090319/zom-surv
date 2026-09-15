// 플레이어·좀비·투사체·아이템 업데이트와 게임 로직

function updatePlayer() {
  let dx = 0;
  let dy = 0;

  if (keys["w"]) dy--;
  if (keys["s"]) dy++;
  if (keys["a"]) dx--;
  if (keys["d"]) dx++;

  const len = Math.hypot(dx, dy);

  if (len > 0) {
    dx /= len;
    dy /= len;
  }

  const yupiterUltimateSpeed = selectedCharacter === "yupiter" && player.severingUltimateTime > 0 ? 2 : 1;
  const nightLordRageSpeed = selectedCharacter === "nightLord" ? 1 + getNightLordRage() * 0.3 : 1;
  const zeroUltimateSpeed = selectedCharacter === "zero" && player.zeroUltimateTime > 0 ? 1.35 : 1;
  player.x += dx * player.speed * yupiterUltimateSpeed * nightLordRageSpeed * zeroUltimateSpeed;
  player.y += dy * player.speed * yupiterUltimateSpeed * nightLordRageSpeed * zeroUltimateSpeed;

  player.x = Math.max(player.r, Math.min(WORLD.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(WORLD.height - player.r, player.y));

  if (len > 0) {
    createFireTrail();
  }

  if (player.fireCooldown > 0) player.fireCooldown--;
  if (player.luminousAttackTime > 0) player.luminousAttackTime--;
  if (player.invincibleTime > 0) player.invincibleTime--;

  if (player.regenLevel > 0 && player.invincibleTime <= 0 && player.hp < player.maxHp) {
    player.hp += player.maxHp * 0.02 / 60;
    player.hp = Math.min(player.hp, player.maxHp);
  }

  if (player.reloadTime > 0) {
    player.reloadTime--;

    if (player.reloadTime === 0) {
      player.ammo = player.maxAmmo;
    }
  }

  if (mouse.down) shoot();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    if (b.homing && zombies.length > 0) {
      const target = findNearestHomingTarget(b.x, b.y, b.hitIds);
      if (target) {
        const targetAngle = Math.atan2(target.y - b.y, target.x - b.x);
        const speed = Math.hypot(b.vx, b.vy) || 13;
        b.vx = b.vx * 0.76 + Math.cos(targetAngle) * speed * 0.24;
        b.vy = b.vy * 0.76 + Math.sin(targetAngle) * speed * 0.24;
        const adjustedSpeed = Math.hypot(b.vx, b.vy) || speed;
        b.vx = b.vx / adjustedSpeed * speed;
        b.vy = b.vy / adjustedSpeed * speed;
      }
    }

    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    if (
      b.life <= 0 ||
      b.x < -100 ||
      b.x > WORLD.width + 100 ||
      b.y < -100 ||
      b.y > WORLD.height + 100
    ) {
      bullets.splice(i, 1);
      continue;
    }

    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];

      if (b.hitIds.includes(z.id)) continue;

      const dist = Math.hypot(b.x - z.x, b.y - z.y);

      if (dist < b.r + z.r) {
        z.hp -= b.damage;
        b.hitIds.push(z.id);

        if (b.sourceCharacter === "suncall" && Math.random() < 0.1) {
          const nearbyIce = stickyZones.find(zone => zone.type === "ice" && Math.hypot(zone.x - z.x, zone.y - z.y) < 80);
          if (nearbyIce) {
            nearbyIce.life = 180;
            nearbyIce.x = z.x;
            nearbyIce.y = z.y;
          } else {
            const iceZones = stickyZones.filter(zone => zone.type === "ice");
            if (iceZones.length >= 10) stickyZones.splice(stickyZones.indexOf(iceZones[0]), 1);
            stickyZones.push({
              x: z.x,
              y: z.y,
              r: 158,
              slow: 0.5,
              life: 180,
              type: "ice"
            });
          }
        }

        for (let k = 0; k < 8; k++) {
          particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 22,
            color: "#ff5555"
          });
        }

        if (z.hp <= 0) {
          killZombie(j, z);
        }

        if (b.bounceLeft > 0) {
          const target = findNearestZombie(b.x, b.y, b.hitIds);

          if (target) {
            const angle = Math.atan2(target.y - b.y, target.x - b.x);
            b.vx = Math.cos(angle) * 13;
            b.vy = Math.sin(angle) * 13;
            b.bounceLeft--;
          } else {
            bullets.splice(i, 1);
          }
        } else {
          bullets.splice(i, 1);
        }

        break;
      }
    }
  }
}

function updateCrescentBlades() {
  for (let i = crescentBlades.length - 1; i >= 0; i--) {
    const blade = crescentBlades[i];
    blade.angle += blade.returning ? -0.34 : 0.34;

    if (blade.returning) {
      const angleHome = Math.atan2(player.y - blade.y, player.x - blade.x);
      blade.vx = Math.cos(angleHome) * blade.returnSpeed;
      blade.vy = Math.sin(angleHome) * blade.returnSpeed;
    }

    blade.x += blade.vx;
    blade.y += blade.vy;
    if (!blade.returning) {
      blade.distance += Math.hypot(blade.vx, blade.vy);
      if (blade.distance >= blade.maxDistance) blade.returning = true;
    }

    const hitIds = blade.returning ? blade.returnHitIds : blade.outwardHitIds;
    for (let j = zombies.length - 1; j >= 0; j--) {
      const zombie = zombies[j];
      if (hitIds.includes(zombie.id)) continue;
      if (Math.hypot(blade.x - zombie.x, blade.y - zombie.y) >= blade.r + zombie.r) continue;

      hitIds.push(zombie.id);
      zombie.hp -= blade.damage;
      if (player.crescentMartialLawLevel > 0) {
        const forceX = blade.returning ? player.x - zombie.x : blade.vx;
        const forceY = blade.returning ? player.y - zombie.y : blade.vy;
        const forceLength = Math.hypot(forceX, forceY) || 1;
        const force = blade.returning ? 86 : 46;
        zombie.x = Math.max(zombie.r, Math.min(WORLD.width - zombie.r, zombie.x + forceX / forceLength * force));
        zombie.y = Math.max(zombie.r, Math.min(WORLD.height - zombie.r, zombie.y + forceY / forceLength * force));
      }
      for (let p = 0; p < 10; p++) {
        particles.push({
          x: blade.x,
          y: blade.y,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          life: 16 + Math.random() * 10,
          color: blade.returning ? "#a7f7ff" : "#d7eaff"
        });
      }
      if (zombie.hp <= 0) killZombie(j, zombie);
    }

    if (blade.returning && Math.hypot(blade.x - player.x, blade.y - player.y) < player.r + 18) {
      if (player.crescentLoyaltyLevel > 0 && blade.loyaltyRelaunches < 3 && zombies.length > 0) {
        const target = zombies.reduce((nearest, zombie) => {
          if (!nearest) return zombie;
          return Math.hypot(zombie.x - player.x, zombie.y - player.y) < Math.hypot(nearest.x - player.x, nearest.y - player.y)
            ? zombie
            : nearest;
        }, null);
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        const targetDistance = Math.hypot(target.x - player.x, target.y - player.y);
        const clampedDistance = Math.max(80, Math.min(700, targetDistance));
        blade.x = player.x + Math.cos(angle) * 30;
        blade.y = player.y + Math.sin(angle) * 30;
        blade.vx = Math.cos(angle) * 15;
        blade.vy = Math.sin(angle) * 15;
        blade.distance = 0;
        blade.maxDistance = Math.max(180, Math.min(520, targetDistance + 55));
        blade.returnSpeed = (20 - clampedDistance * 0.014) * player.crescentReturnMultiplier;
        blade.returning = false;
        blade.outwardHitIds = [];
        blade.returnHitIds = [];
        blade.loyaltyRelaunches++;
        blade.damage *= 1.5;
      } else {
        if (player.crescentLoyaltyLevel > 0 && blade.loyaltyRelaunches >= 3) {
          for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];
            if (Math.hypot(zombie.x - player.x, zombie.y - player.y) > 190 + zombie.r) continue;
            zombie.hp -= scaledDamage(player.damage * 2.5);
            if (zombie.hp <= 0) killZombie(j, zombie);
          }
          for (let p = 0; p < 54; p++) {
            const burstAngle = Math.PI * 2 * p / 54;
            particles.push({
              x: player.x, y: player.y,
              vx: Math.cos(burstAngle) * (3 + Math.random() * 8),
              vy: Math.sin(burstAngle) * (3 + Math.random() * 8),
              life: 22 + Math.random() * 20,
              color: p % 3 === 0 ? "#ffffff" : "#c9d8e8"
            });
          }
        }
        crescentBlades.splice(i, 1);
      }
    }
  }
}

function tryRevive() {
  if (player.immortalLevel > 0 && !player.immortalUsed) {
    player.immortalUsed = true;
    player.hp = Math.max(1, Math.floor(player.maxHp * 0.4));
    player.invincibleTime = 180;

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;

      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 45,
        color: "#00ff99"
      });
    }

    return true;
  }

  return false;
}

function isZombieInsideGravityField(zombie) {
  for (const g of gravityFields) {
    if (Math.hypot(zombie.x - g.x, zombie.y - g.y) < g.r) {
      return true;
    }
  }

  return false;
}

function tryDodgeAttack() {
  if (player.dodgeLevel <= 0 || Math.random() >= 0.3) {
    return false;
  }

  player.invincibleTime = 12;

  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;

    particles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 22,
      color: "#9ee7ff"
    });
  }

  return true;
}

function updateZombies() {
  if (zombieSlowTimer > 0) zombieSlowTimer--;

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];

    if (z.bleedTime > 0) {
      z.bleedTime--;
      z.bleedTick = (z.bleedTick || 1) - 1;
      if (z.bleedTick <= 0) {
        z.hp -= Math.max(1, z.maxHp * 0.004);
        z.bleedTick = 30;
        if (z.hp <= 0) { killZombie(i, z); continue; }
      }
    }

    if (z.stunTime > 0) {
      z.stunTime--;
      if (z.stunFlash > 0) z.stunFlash--;
      continue;
    }

    let slow = zombieSlowTimer > 0 ? 0.45 : 1;
    if (z.slowTime > 0) {
      z.slowTime--;
      slow = Math.min(slow, 0.55);
    }

    for (const zone of stickyZones) {
      if (Math.hypot(z.x - zone.x, z.y - zone.y) < zone.r) {
        slow = Math.min(slow, zone.slow);
      }
    }

    for (const fire of fireTrails) {
      if (Math.hypot(z.x - fire.x, z.y - fire.y) < fire.r) {
        slow = Math.min(slow, fire.slow);
      }
    }

    for (const field of terraStructures) {
      if (field.type === "collapseField" && terraPointInField(z.x, z.y, field, z.r)) {
        slow = Math.min(slow, 0.45);
      }
    }

    const angle = Math.atan2(player.y - z.y, player.x - z.x);
    z.x += Math.cos(angle) * z.speed * slow;
    z.y += Math.sin(angle) * z.speed * slow;

    if (Math.hypot(player.x - z.x, player.y - z.y) < player.r + z.r) {
      const countered = !isZombieInsideGravityField(z) && selectedCharacter === "paladin" && player.paladinGuardTime > 0 && triggerPaladinCounter(z);
      if (!countered && !isZombieInsideGravityField(z) && player.invincibleTime <= 0) {
        const dodged = tryDodgeAttack();

        if (!dodged) {
          player.hp -= player.crownLevel > 0 ? 20 : 10;
          player.invincibleTime = 12;

          if (selectedCharacter === "nightLord" && player.nightLordUltimateTime > 0) {
            player.hp = Math.max(1, player.hp);
          }

          if (selectedCharacter === "paladin" && player.paladinUltimateTime <= 0 && !transcended.paladinCombo) {
            player.paladinCombo = Math.max(0, player.paladinCombo - 12);
          }

          if (player.hp <= 0) {
            if (!tryRevive()) {
              gameOver = true;
            }
          }
        }
      }

      const pushAngle = Math.atan2(z.y - player.y, z.x - player.x);
      z.x += Math.cos(pushAngle) * 3;
      z.y += Math.sin(pushAngle) * 3;
    }
  }
}

function updateDaggers() {
  for (const dagger of daggers) {
    dagger.angle += 0.065;

    if (dagger.cooldown > 0) {
      dagger.cooldown--;
    }

    const x = player.x + Math.cos(dagger.angle) * dagger.radius;
    const y = player.y + Math.sin(dagger.angle) * dagger.radius;

    if (dagger.cooldown <= 0) {
      for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];

        if (Math.hypot(z.x - x, z.y - y) < z.r + 9) {
          z.hp -= dagger.damage;
          dagger.cooldown = 20;

          if (z.hp <= 0) {
            killZombie(i, z);
          }

          break;
        }
      }
    }
  }
}

function updateItems() {
  itemSpawnTimer--;

  if (itemSpawnTimer <= 0) {
    spawnItem();
    itemSpawnTimer = 260;
  }

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];

    if (Math.hypot(player.x - item.x, player.y - item.y) < player.r + item.r) {
      if (item.type === "heal") {
        player.hp = Math.min(player.maxHp, player.hp + 30);
      }

      if (item.type === "slow") {
        zombieSlowTimer = 300;
      }

      if (item.type === "magnet") {
        collectAllExp();
      }

      if (item.type === "bomb") {
        bombAllNearbyZombies();
      }

      items.splice(i, 1);
      continue;
    }

  }
}

function updateExpOrbs() {
  for (let i = expOrbs.length - 1; i >= 0; i--) {
    const orb = expOrbs[i];

    const dx = player.x - orb.x;
    const dy = player.y - orb.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 150 && dist > 0) {
      orb.x += (dx / dist) * 5;
      orb.y += (dy / dist) * 5;
    }

    if (dist < player.r + orb.r) {
      gainExp(orb.value);
      expOrbs.splice(i, 1);
    }
  }
}

function updateZones() {
  for (let i = stickyZones.length - 1; i >= 0; i--) {
    stickyZones[i].life--;

    if (stickyZones[i].life <= 0) {
      stickyZones.splice(i, 1);
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updateSpawn() {
  spawnTimer--;

  if (spawnTimer <= 0) {
    spawnZombie();
    spawnTimer = Math.max(18, 75 - wave * 4);
  }
}

function update() {
  if (screenMode !== "game") return;
  if (paused || gameOver || choosingUpgrade) return;

  screenToWorld();
  updatePlayer();
  updateCamera();
  screenToWorld();

  updateSpawn();
  updateBullets();
  updateCrescentBlades();
  updateYupiterWeapons();
  updateRen();
  updateNightLord();
  updateZero();
  updatePaladin();
  updateArc();
  updateTerra();
  updateVoid();
  updateZombies();
  updateDaggers();
  updateItems();
  updateVision();
  updateQuantum();
  updateGravitySkill();
  updateDrone();
  updateTimeRewind();
  updateExpOrbs();
  updateZones();
  updateFireTrails();
  updateLaserSlashes();
  updateGravityFields();
  updateDroneBullets();
  updateParticles();
}
