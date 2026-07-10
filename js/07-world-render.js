// 맵과 게임 오브젝트 렌더링

function worldStart() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
}

function worldEnd() {
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  worldStart();

  if (backgroundLoaded) {
    ctx.drawImage(backgroundImage, 0, 0, WORLD.width, WORLD.height);
  } else {
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.strokeStyle = "#1d1d1d";
    ctx.lineWidth = 1;

    for (let x = 0; x < WORLD.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.stroke();
    }

    for (let y = 0; y < WORLD.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }
  }

  // 배경 밝기 보정
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, WORLD.width, WORLD.height);

  worldEnd();
}

function drawFireTrails() {
  worldStart();

  for (const fire of fireTrails) {
    const alpha = Math.max(0, fire.life / fire.maxLife);

    ctx.globalAlpha = 0.25 * alpha + 0.1;
    ctx.fillStyle = "#ff6b00";
    ctx.beginPath();
    ctx.arc(fire.x, fire.y, fire.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.45 * alpha;
    ctx.fillStyle = "#ffdd55";
    ctx.beginPath();
    ctx.arc(fire.x, fire.y, fire.r * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  worldEnd();
}

function drawStickyZones() {
  worldStart();

  for (const zone of stickyZones) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#7bed9f";
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  worldEnd();
}

function drawPlayer() {
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);

  worldStart();

  if (player.invincibleTime > 0 && Math.floor(player.invincibleTime / 4) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const activeSprite = selectedCharacter === "suncall" ? suncallSprite : playerSprite;
  const activeLoaded = selectedCharacter === "suncall" ? suncallSpriteLoaded : playerSpriteLoaded;

  if (activeLoaded) {
    const size = selectedCharacter === "suncall" ? 104 : 96;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.drawImage(activeSprite, -size / 2, -size / 2 - 18, size, size);
    ctx.restore();
  } else {
    ctx.fillStyle = "#4da3ff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (gunSpriteLoaded) {
    const gunW = 68;
    const gunH = 30;

    ctx.save();
    ctx.translate(player.x, player.y - 7);
    ctx.rotate(angle);

    if (Math.cos(angle) < 0) {
      ctx.scale(1, -1);
    }

    ctx.drawImage(gunSprite, 5, -gunH / 2, gunW, gunH);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  worldEnd();
}

function drawDaggers() {
  worldStart();

  for (const dagger of daggers) {
    const x = player.x + Math.cos(dagger.angle) * dagger.radius;
    const y = player.y + Math.sin(dagger.angle) * dagger.radius;

    ctx.fillStyle = "#dfe6e9";
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#74b9ff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  worldEnd();
}

function drawBullets() {
  worldStart();

  ctx.fillStyle = "#ffe066";

  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  worldEnd();
}

function drawZombies() {
  worldStart();
  for (const z of zombies) {
    ctx.fillStyle = z.stunTime > 0 ? "#6c5ce7" : (z.boss ? "#8b0000" : "#27ae60");
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#333"; ctx.fillRect(z.x - z.r, z.y - z.r - 12, z.r * 2, 5);
    ctx.fillStyle = "#ff3333"; ctx.fillRect(z.x - z.r, z.y - z.r - 12, z.r * 2 * (z.hp / z.maxHp), 5);
    if (z.stunTime > 0) { ctx.fillStyle = "#e0c3ff"; ctx.font = "18px Arial"; ctx.textAlign = "center"; ctx.fillText("✦", z.x, z.y - z.r - 22); ctx.textAlign = "left"; }
  }
  worldEnd();
}

function drawItems() {
  worldStart();
  for (const item of items) {
    if (item.type === "heal") ctx.fillStyle = "#ff4d6d";
    else if (item.type === "slow") ctx.fillStyle = "#00d9ff";
    else if (item.type === "magnet") ctx.fillStyle = "#ffd700";
    else ctx.fillStyle = "#ff7b00";
    ctx.beginPath(); ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2); ctx.fill();
    let label = "?";
    if (item.type === "heal") label = "+";
    if (item.type === "slow") label = "S";
    if (item.type === "magnet") label = "M";
    if (item.type === "bomb") label = "B";
    ctx.fillStyle = "white"; ctx.font = "18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, item.x, item.y + 1);
  }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  worldEnd();
}

function drawExpOrbs() {
  worldStart();

  ctx.fillStyle = "#b84dff";

  for (const orb of expOrbs) {
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  worldEnd();
}

function drawLaserSlashes() {
  worldStart();

  for (const laser of laserSlashes) {
    const progress = 1 - laser.life / laser.maxLife;
    const alpha = Math.max(0, laser.life / laser.maxLife);
    const angle = laser.angle + progress * Math.PI * 2;

    const cx = player.x;
    const cy = player.y;

    const x1 = cx - Math.cos(angle) * laser.length / 2;
    const y1 = cy - Math.sin(angle) * laser.length / 2;
    const x2 = cx + Math.cos(angle) * laser.length / 2;
    const y2 = cy + Math.sin(angle) * laser.length / 2;

    ctx.save();
    ctx.lineCap = "round";

    // 바깥 에너지 원
    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = laser.length / 2 - ring * 36;
      const ringAlpha = alpha * (0.16 - ring * 0.035);

      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = ring % 2 === 0 ? "#00e5ff" : "#b967ff";
      ctx.lineWidth = 4 - ring;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 곡선형 잔상 아크
    for (let trail = 1; trail <= 7; trail++) {
      const trailAngle = angle - trail * 0.105;
      const trailAlpha = alpha * (0.23 / trail);
      const trailWidth = Math.max(3, laser.width - trail * 3.2);

      const tx1 = cx - Math.cos(trailAngle) * laser.length / 2;
      const ty1 = cy - Math.sin(trailAngle) * laser.length / 2;
      const tx2 = cx + Math.cos(trailAngle) * laser.length / 2;
      const ty2 = cy + Math.sin(trailAngle) * laser.length / 2;

      ctx.globalAlpha = trailAlpha;
      ctx.strokeStyle = trail % 2 === 0 ? "#b967ff" : "#00e5ff";
      ctx.lineWidth = trailWidth;
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
    }

    // 메인 빔 외곽 광채
    ctx.globalAlpha = 0.42 * alpha;
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = laser.width + 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 메인 빔 보라 코어
    ctx.globalAlpha = 0.72 * alpha;
    ctx.strokeStyle = "#b967ff";
    ctx.lineWidth = Math.max(10, laser.width * 0.62);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 흰색 절단선
    ctx.globalAlpha = 1 * alpha;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 레이저 양 끝 에너지 구체
    for (const p of [{ x: x1, y: y1 }, { x: x2, y: y2 }]) {
      ctx.globalAlpha = 0.85 * alpha;
      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10 + Math.sin(progress * Math.PI * 12) * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.45 * alpha;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 중심 에너지 구체와 회전 파편
    ctx.globalAlpha = 0.9 * alpha;
    ctx.fillStyle = "#00e5ff";
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + Math.sin(progress * Math.PI * 10) * 5, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 14; i++) {
      const sparkA = angle + i * Math.PI * 2 / 14 + progress * Math.PI * 5;
      const sparkR = 38 + (i % 5) * 16;

      ctx.globalAlpha = (0.75 - (i % 5) * 0.08) * alpha;
      ctx.fillStyle = i % 2 === 0 ? "#00e5ff" : "#d6a2ff";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(sparkA) * sparkR, cy + Math.sin(sparkA) * sparkR, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 진행 방향 짧은 스파크 라인
    for (let i = 0; i < 10; i++) {
      const sparkA = angle + (Math.random() - 0.5) * 0.35;
      const baseR = laser.length / 2 - i * 24;
      const sx = cx + Math.cos(sparkA) * baseR;
      const sy = cy + Math.sin(sparkA) * baseR;

      ctx.globalAlpha = 0.28 * alpha;
      ctx.strokeStyle = i % 2 === 0 ? "#00e5ff" : "#b967ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - Math.cos(sparkA) * 22, sy - Math.sin(sparkA) * 22);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  worldEnd();
}

function drawParticles() {
  worldStart();

  for (const p of particles) {
    ctx.globalAlpha = p.life / 35;
    ctx.fillStyle = p.color || "#ff5555";

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  worldEnd();
}

function drawGravityFields() {
  worldStart();

  for (const g of gravityFields) {
    const alpha = Math.max(0, g.life / g.maxLife);
    const spin = g.spin + g.life * 0.12;
    const pulse = Math.sin(g.life * 0.24) * 0.12 + 1;
    const coreR = g.r * 0.115 * pulse;

    ctx.save();

    ctx.globalAlpha = 0.26 * alpha;
    ctx.fillStyle = "#23003d";
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();

    for (let arm = 0; arm < 12; arm++) {
      ctx.beginPath();

      for (let t = 0; t <= 1; t += 0.018) {
        const radius = g.r * (1 - t);
        const angle = t * Math.PI * 8.5 + arm * (Math.PI * 2 / 12) + spin;
        const wave = Math.sin(t * Math.PI * 12 + spin) * 12;

        const x = g.x + Math.cos(angle) * (radius + wave);
        const y = g.y + Math.sin(angle) * (radius + wave);

        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.globalAlpha = 0.52 * alpha;
      ctx.strokeStyle = "#9b5cff";
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.globalAlpha = 0.95 * alpha;
      ctx.strokeStyle = "#f1d5ff";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    for (let r = 0; r < 7; r++) {
      const ringProgress = ((g.life * 0.028 + r * 0.14) % 1);
      const radius = g.r * (1 - ringProgress);

      ctx.globalAlpha = alpha * (0.22 + 0.11 * r);
      ctx.strokeStyle = r % 2 === 0 ? "#7d2cff" : "#e0aaff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.99 * alpha;
    ctx.fillStyle = "#020005";
    ctx.beginPath();
    ctx.arc(g.x, g.y, coreR, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.95 * alpha;
    ctx.strokeStyle = "#d6a2ff";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(g.x, g.y, coreR + 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.75 * alpha;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 22; i++) {
      const a = spin + i * Math.PI * 2 / 22;
      const r1 = coreR + 32 + (i % 5) * 25;
      const r2 = r1 + 34;

      ctx.beginPath();
      ctx.moveTo(g.x + Math.cos(a) * r2, g.y + Math.sin(a) * r2);
      ctx.lineTo(g.x + Math.cos(a) * r1, g.y + Math.sin(a) * r1);
      ctx.stroke();
    }

    ctx.restore();
  }

  worldEnd();
}

function drawDroneBullets() {
  worldStart();

  ctx.fillStyle = "#00e5ff";

  for (const b of droneBullets) {
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  if (player.droneLevel > 0) {
    const droneX = player.x + 36 + Math.sin(Date.now() / 180) * 4;
    const droneY = player.y - 36 + Math.cos(Date.now() / 200) * 4;

    ctx.save();
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#071923";
    ctx.beginPath();
    ctx.arc(droneX, droneY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#dffcff";
    ctx.beginPath();
    ctx.arc(droneX, droneY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  worldEnd();
}
