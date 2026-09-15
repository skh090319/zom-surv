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
    const isIce = zone.type === "ice";
    ctx.globalAlpha = isIce ? 0.34 : 0.35;
    ctx.fillStyle = isIce ? "#a8eaff" : "#7bed9f";
    ctx.shadowColor = isIce ? "#c8f5ff" : "transparent";
    ctx.shadowBlur = isIce ? 18 : 0;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
    ctx.fill();
    if (isIce) {
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = "#effcff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.r * (0.86 + Math.sin(performance.now() * 0.004) * 0.03), 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let shard = 0; shard < 8; shard++) {
        const angle = shard * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(zone.x + Math.cos(angle) * zone.r * 0.18, zone.y + Math.sin(angle) * zone.r * 0.18);
        ctx.lineTo(zone.x + Math.cos(angle) * zone.r * 0.74, zone.y + Math.sin(angle) * zone.r * 0.74);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  worldEnd();
}

function drawPlayer() {
  const mouseAngle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const luminousCastingHeld =
    selectedCharacter === "luminous" && mouse.down && player.reloadTime <= 0;
  const castAngle = selectedCharacter === "luminous"
    ? player.luminousAttackAngle
    : mouseAngle;

  worldStart();

  const renTeleporting = selectedCharacter === "ren" && renAttackEffects.some(effect => !effect.shadow && effect.targetId !== null && effect.delay <= 0 && effect.life > 7);
  if (renTeleporting) {
    ctx.globalAlpha = 0.08;
  } else if (player.invincibleTime > 0 && Math.floor(player.invincibleTime / 4) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  const luminousIsAttacking =
    selectedCharacter === "luminous" &&
    (luminousCastingHeld || player.luminousAttackTime > 0) &&
    (luminousAttackSpriteLoaded || (luminousAttackSprite.complete && luminousAttackSprite.naturalWidth > 0));
  const renAttackHeld = selectedCharacter === "ren" && mouse.down && player.reloadTime <= 0;
  const nightLordSlash = selectedCharacter === "nightLord"
    ? nightLordEffects.find(effect => effect.type === "slash" && effect.life > 0)
    : null;
  const nightLordAttackHeld = selectedCharacter === "nightLord" && mouse.down && player.nightLordFrenzyTime <= 0;
  const nightLordIsAttacking = Boolean((nightLordSlash || nightLordAttackHeld) && nightLordAttackSpriteLoaded);
  const activeSprite = selectedCharacter === "terra"
    ? terraSprite
    : selectedCharacter === "carmilla"
    ? carmillaSprite
    : selectedCharacter === "void"
    ? voidSprite
    : selectedCharacter === "arc"
    ? arcSprite
    : selectedCharacter === "paladin"
    ? paladinSprite
    : selectedCharacter === "zero"
    ? zeroSprite
    : selectedCharacter === "suncall"
    ? suncallSprite
    : (selectedCharacter === "luminous"
      ? (luminousIsAttacking ? luminousAttackSprite : luminousSprite)
      : (selectedCharacter === "yupiter"
        ? (player.yupiterWeapon === 0
          ? ((crescentBlades.length > 0 || player.crescentUltimateTime > 0) && yupiterCrescentThrownSpriteLoaded
            ? yupiterCrescentThrownSprite
            : (yupiterCrescentSpriteLoaded ? yupiterCrescentSprite : yupiterSprite))
          : (player.yupiterWeapon === 1 && yupiterSlashes.length > 0 && yupiterSeveringSpriteLoaded
            ? yupiterSeveringSprite
            : (player.yupiterWeapon === 2 && yupiterFlameSpriteLoaded ? yupiterFlameSprite : yupiterSprite)))
        : (selectedCharacter === "ren" ? (renAttackHeld && renAttackSpriteLoaded ? renAttackSprite : renSprite) : (selectedCharacter === "nightLord" ? (nightLordIsAttacking ? nightLordAttackSprite : nightLordSprite) : playerSprite))));
  const activeLoaded = selectedCharacter === "terra"
    ? terraSpriteLoaded
    : selectedCharacter === "carmilla"
    ? carmillaSpriteLoaded
    : selectedCharacter === "void"
    ? voidSpriteLoaded
    : selectedCharacter === "arc"
    ? arcSpriteLoaded
    : selectedCharacter === "paladin"
    ? paladinSpriteLoaded
    : selectedCharacter === "zero"
    ? zeroSpriteLoaded
    : selectedCharacter === "suncall"
    ? suncallSpriteLoaded
    : (selectedCharacter === "luminous"
      ? luminousSpriteLoaded
      : (selectedCharacter === "yupiter" ? yupiterSpriteLoaded : (selectedCharacter === "ren" ? (renAttackHeld && renAttackSpriteLoaded ? renAttackSpriteLoaded : renSpriteLoaded) : (selectedCharacter === "nightLord" ? (nightLordIsAttacking ? nightLordAttackSpriteLoaded : nightLordSpriteLoaded) : playerSpriteLoaded))));

  if (activeLoaded) {
    const size = (selectedCharacter === "luminous" || selectedCharacter === "ren" || selectedCharacter === "nightLord" || selectedCharacter === "zero" || selectedCharacter === "paladin" || selectedCharacter === "arc" || selectedCharacter === "terra" || selectedCharacter === "void") ? 112 : ((selectedCharacter === "suncall" || selectedCharacter === "yupiter") ? 104 : 96);

    ctx.save();
    const castLunge = luminousIsAttacking ? 4 * Math.min(1, player.luminousAttackTime / 4) : 0;
    ctx.translate(
      player.x + Math.cos(castAngle) * castLunge,
      player.y + Math.sin(castAngle) * castLunge
    );
    if (luminousIsAttacking && Math.cos(castAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "ren" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "nightLord" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "zero" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "paladin" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "arc" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "terra" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    if (selectedCharacter === "void" && Math.cos(mouseAngle) > 0) ctx.scale(-1, 1);
    ctx.drawImage(activeSprite, -size / 2, -size / 2 - 18, size, size);
    ctx.restore();
  } else {
    ctx.fillStyle = "#4da3ff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (gunSpriteLoaded && selectedCharacter !== "luminous" && selectedCharacter !== "yupiter" && selectedCharacter !== "ren" && selectedCharacter !== "nightLord" && selectedCharacter !== "zero" && selectedCharacter !== "paladin" && selectedCharacter !== "arc" && selectedCharacter !== "terra" && selectedCharacter !== "void" && selectedCharacter !== "carmilla") {
    const gunW = 68;
    const gunH = 30;

    ctx.save();
    ctx.translate(player.x, player.y - 7);
    ctx.rotate(mouseAngle);

    if (Math.cos(mouseAngle) < 0) {
      ctx.scale(1, -1);
    }

    ctx.drawImage(gunSprite, 5, -gunH / 2, gunW, gunH);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  worldEnd();
}

function drawRenEffects() {
  if (selectedCharacter !== "ren") return;
  const time = performance.now() * 0.001;
  worldStart();

  for (const shard of renShadowShards) {
    if (
      shard.x < camera.x - 70 || shard.x > camera.x + canvas.width + 70 ||
      shard.y < camera.y - 70 || shard.y > camera.y + canvas.height + 70
    ) continue;
    const pulse = 1 + Math.sin(time * 5 + shard.phase) * 0.18;
    const stackAmount = shard.amount || 1;
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(time * 0.8 + shard.phase);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#ff3f71";
    ctx.beginPath();
    ctx.arc(0, 0, 23 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (renShadowShardSpriteLoaded) {
      ctx.drawImage(renShadowShardSprite, -23 * pulse, -27 * pulse, 46 * pulse, 54 * pulse);
    } else {
      ctx.fillStyle = "#ff668e";
      ctx.beginPath();
      ctx.moveTo(0, -13 * pulse);
      ctx.lineTo(8 * pulse, 0);
      ctx.lineTo(0, 13 * pulse);
      ctx.lineTo(-8 * pulse, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (stackAmount > 1) {
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.fillStyle = "rgba(8,5,17,0.88)";
      ctx.beginPath();
      ctx.arc(19, 18, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff6b91";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stackAmount > 99 ? "99+" : `${stackAmount}`, 19, 18);
      ctx.restore();
    }
  }

  for (const field of renShadowFields) {
    const alpha = Math.min(0.42, field.life / 150);
    const gradient = ctx.createRadialGradient(field.x, field.y, 5, field.x, field.y, field.r);
    gradient.addColorStop(0, `rgba(126,13,55,${alpha * 0.72})`);
    gradient.addColorStop(0.58, `rgba(34,5,52,${alpha * 0.6})`);
    gradient.addColorStop(1, "rgba(5,2,15,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,48,96,${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.r * (0.78 + Math.sin(time * 3) * 0.04), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (player.renSwapTrailTime > 0) {
    const alpha = player.renSwapTrailTime / 18;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ff315f";
    ctx.shadowColor = "#ff315f";
    ctx.shadowBlur = 28;
    ctx.lineWidth = 8 * alpha + 3;
    ctx.beginPath();
    ctx.moveTo(player.renSwapStartX, player.renSwapStartY);
    ctx.lineTo(player.renSwapEndX, player.renSwapEndY);
    ctx.stroke();
    ctx.restore();
  }
  for (const clone of renFlyingClones) {
    ctx.save();
    const travelAngle = Math.atan2(clone.targetY - clone.startY, clone.targetX - clone.startX);
    const trailLength = 42 + (1 - clone.progress) * 70;
    const trail = ctx.createLinearGradient(
      clone.x - Math.cos(travelAngle) * trailLength,
      clone.y - Math.sin(travelAngle) * trailLength,
      clone.x,
      clone.y
    );
    trail.addColorStop(0, "rgba(255,49,95,0)");
    trail.addColorStop(0.55, "rgba(126,21,73,0.34)");
    trail.addColorStop(1, "rgba(255,79,121,0.9)");
    ctx.strokeStyle = trail;
    ctx.lineWidth = 18 - clone.progress * 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(clone.x - Math.cos(travelAngle) * trailLength, clone.y - Math.sin(travelAngle) * trailLength);
    ctx.lineTo(clone.x, clone.y);
    ctx.stroke();
    ctx.translate(clone.x, clone.y);
    ctx.globalAlpha = 0.35 + clone.progress * 0.45;
    ctx.filter = "grayscale(0.55) brightness(0.72) sepia(0.4) hue-rotate(285deg) saturate(2.2)";
    ctx.shadowColor = "#ff315f";
    ctx.shadowBlur = 28;
    if (renSpriteLoaded) ctx.drawImage(renSprite, -30, -35, 60, 68);
    ctx.filter = "none";
    ctx.restore();
  }
  for (const clone of renRecallingClones) {
    const returnAngle = Math.atan2(player.y - clone.y, player.x - clone.x);
    const trailLength = 38 + clone.progress * 76;
    ctx.save();
    const trail = ctx.createLinearGradient(
      clone.x - Math.cos(returnAngle) * trailLength,
      clone.y - Math.sin(returnAngle) * trailLength,
      clone.x,
      clone.y
    );
    trail.addColorStop(0, "rgba(255,49,95,0)");
    trail.addColorStop(0.5, "rgba(105,18,70,0.38)");
    trail.addColorStop(1, "rgba(255,96,137,0.92)");
    ctx.strokeStyle = trail;
    ctx.lineWidth = 15 - clone.progress * 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(clone.x - Math.cos(returnAngle) * trailLength, clone.y - Math.sin(returnAngle) * trailLength);
    ctx.lineTo(clone.x, clone.y);
    ctx.stroke();
    ctx.translate(clone.x, clone.y);
    ctx.globalAlpha = 0.72 * (1 - clone.progress);
    ctx.filter = "grayscale(0.6) brightness(0.68) sepia(0.45) hue-rotate(285deg) saturate(2.4)";
    ctx.shadowColor = "#ff315f";
    ctx.shadowBlur = 24;
    const shrink = 1 - clone.progress * 0.45;
    if (renSpriteLoaded) ctx.drawImage(renSprite, -30 * shrink, -35 * shrink, 60 * shrink, 68 * shrink);
    ctx.restore();
  }
  for (let clone = 0; clone < renPlacedClones.length; clone++) {
    const placed = renPlacedClones[clone];
    const x = placed.x;
    const y = placed.y + Math.sin(time * 2.4 + placed.phase) * 3;
    const isLatest = clone === renPlacedClones.length - 1;
    ctx.save();
    ctx.globalAlpha = player.renUltimateTime > 0 ? 0.86 : 0.62;
    ctx.filter = "grayscale(0.55) brightness(0.72) sepia(0.4) hue-rotate(285deg) saturate(2.2)";
    ctx.shadowColor = isLatest ? "#75ecff" : "#ff315f";
    ctx.shadowBlur = isLatest ? 25 : 16;
    if (renSpriteLoaded) ctx.drawImage(renSprite, x - 40, y - 51, 80, 90);
    ctx.filter = "none";
    ctx.strokeStyle = isLatest ? "rgba(117,236,255,0.95)" : "rgba(255,49,95,0.64)";
    ctx.lineWidth = isLatest ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(x, placed.y + 24, isLatest ? 30 : 26, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (isLatest) {
      ctx.fillStyle = "#a9f5ff";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.fillText("X", x, placed.y - 49);
    }
    ctx.restore();
  }

  worldEnd();

  if (player.renUltimateTime > 0) {
    const lifeRatio = player.renUltimateTime / REN_ULTIMATE_DURATION;
    const appear = Math.min(1, (REN_ULTIMATE_DURATION - player.renUltimateTime) / 15);
    const alpha = Math.min(1, lifeRatio * 4) * appear;
    worldStart();
    ctx.save();
    ctx.translate(player.renUltimateX, player.renUltimateY);
    ctx.globalAlpha = alpha;
    const fieldGradient = ctx.createRadialGradient(0, 0, 26, 0, 0, REN_ULTIMATE_RADIUS);
    fieldGradient.addColorStop(0, "rgba(38,0,51,0.9)");
    fieldGradient.addColorStop(0.55, "rgba(18,0,32,0.86)");
    fieldGradient.addColorStop(0.86, "rgba(82,2,54,0.62)");
    fieldGradient.addColorStop(1, "rgba(3,0,10,0)");
    ctx.fillStyle = fieldGradient;
    ctx.beginPath();
    ctx.arc(0, 0, REN_ULTIMATE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    const traceHexagon = radius => {
      ctx.beginPath();
      for (let side = 0; side < 6; side++) {
        const angle = -Math.PI / 2 + side * Math.PI / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (side === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    const pulse = 1 + Math.sin(time * 6) * 0.025;
    ctx.rotate(time * 0.18);
    ctx.shadowColor = "#9c174f";
    ctx.shadowBlur = 30;
    ctx.strokeStyle = "rgba(190,40,99,0.96)";
    ctx.lineWidth = 7;
    traceHexagon(REN_ULTIMATE_RADIUS * 0.9 * pulse);
    ctx.stroke();
    ctx.shadowColor = "#652788";
    ctx.shadowBlur = 23;
    ctx.strokeStyle = "rgba(126,58,165,0.94)";
    ctx.lineWidth = 3;
    traceHexagon(REN_ULTIMATE_RADIUS * 0.69);
    ctx.stroke();
    ctx.strokeStyle = "rgba(171,74,119,0.72)";
    ctx.lineWidth = 2;
    traceHexagon(REN_ULTIMATE_RADIUS * 0.51);
    ctx.stroke();

    for (let rune = 0; rune < 12; rune++) {
      const angle = rune * Math.PI * 2 / 12;
      const radius = REN_ULTIMATE_RADIUS * (0.78 + Math.sin(time * 4 + rune) * 0.025);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 4);
      ctx.shadowColor = rune % 2 === 0 ? "#aa1d55" : "#66248d";
      ctx.shadowBlur = 17;
      ctx.fillStyle = rune % 2 === 0 ? "rgba(185,39,91,0.98)" : "rgba(119,48,157,0.96)";
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = "rgba(10,0,20,0.9)";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }

    ctx.rotate(-time * 0.55);
    ctx.strokeStyle = "rgba(137,88,164,0.68)";
    ctx.lineWidth = 2;
    for (let spoke = 0; spoke < 6; spoke++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(46, 0);
      ctx.lineTo(REN_ULTIMATE_RADIUS * 0.64, 0);
      ctx.stroke();
    }
    ctx.shadowColor = "#8f1647";
    ctx.shadowBlur = 38;
    ctx.fillStyle = "rgba(128,16,66,0.76)";
    ctx.beginPath();
    ctx.arc(0, 0, 70 + Math.sin(time * 7) * 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(time * 0.9);
    ctx.strokeStyle = "rgba(160,101,137,0.76)";
    ctx.lineWidth = 2;
    for (let ray = 0; ray < 6; ray++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(82, 0);
      ctx.lineTo(REN_ULTIMATE_RADIUS * 0.46, 0);
      ctx.stroke();
    }
    ctx.restore();
    worldEnd();

    ctx.save();
    ctx.globalAlpha = 0.2 * alpha;
    ctx.fillStyle = "#09000f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function drawRenAttackOverlay() {
  if (selectedCharacter !== "ren") return;
  worldStart();
  for (const effect of renAttackEffects) {
    if (effect.delay > 0) continue;
    const progress = 1 - effect.life / effect.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.9 - progress * 0.55);
    ctx.translate(effect.x, effect.y);
    if (effect.targetId !== null && (renAttackSpriteLoaded || renSpriteLoaded)) {
      ctx.filter = effect.shadow ? "grayscale(1) brightness(0.42) sepia(1) hue-rotate(285deg) saturate(5)" : "none";
      if (Math.cos(effect.angle) > 0) ctx.scale(-1, 1);
      ctx.drawImage(renAttackSpriteLoaded ? renAttackSprite : renSprite, -56, -74, 112, 112);
      if (Math.cos(effect.angle) > 0) ctx.scale(-1, 1);
    }
    ctx.filter = "none";
    ctx.rotate(effect.angle);
    const slashRadius = 62 + progress * 42;
    const slashStart = -1.58;
    const slashEnd = slashStart + (Math.PI * 120 / 180) * Math.min(1, progress * 1.45);
    const slashWidth = 11 - progress * 5;
    const slashGradient = ctx.createRadialGradient(0, 0, slashRadius - slashWidth, 0, 0, slashRadius + 5);
    slashGradient.addColorStop(0, "rgba(43,4,24,0)");
    slashGradient.addColorStop(0.58, effect.shadow ? "rgba(105,24,58,0.5)" : "rgba(145,22,61,0.62)");
    slashGradient.addColorStop(0.84, effect.shadow ? "rgba(193,55,105,0.88)" : "rgba(255,54,104,0.96)");
    slashGradient.addColorStop(1, "rgba(255,220,231,0.96)");
    ctx.fillStyle = slashGradient;
    ctx.shadowColor = effect.shadow ? "#721a45" : "#ff234f";
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.arc(0, 0, slashRadius + slashWidth, slashStart, slashEnd);
    ctx.arc(0, 0, slashRadius - slashWidth, slashEnd, slashStart, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = effect.shadow ? "rgba(224,86,135,0.82)" : "rgba(255,226,235,0.94)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, slashRadius + slashWidth, slashStart, slashEnd);
    ctx.stroke();
    ctx.restore();
  }
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
    if (b.homing && (luminousBulletSpriteLoaded || (luminousBulletSprite.complete && luminousBulletSprite.naturalWidth > 0))) {
      const size = Math.max(22, b.r * 5);
      ctx.save();
      ctx.shadowColor = "#bd55ff";
      ctx.shadowBlur = 13;
      ctx.drawImage(luminousBulletSprite, b.x - size / 2, b.y - size / 2, size, size);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  worldEnd();
}

function drawCrescentBlades() {
  if (crescentBlades.length === 0) return;
  worldStart();

  for (const blade of crescentBlades) {
    ctx.save();
    ctx.translate(blade.x, blade.y);
    ctx.rotate(blade.angle);
    ctx.shadowColor = blade.returning ? "#7ff7ff" : "#b9dfff";
    ctx.shadowBlur = blade.returning ? 22 : 14;
    if (crescentBladeSpriteLoaded || (crescentBladeSprite.complete && crescentBladeSprite.naturalWidth > 0)) {
      const size = 58;
      ctx.drawImage(crescentBladeSprite, -size / 2, -size / 2, size, size);
    } else {
      ctx.strokeStyle = "#cceaff";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = blade.returning ? "#7ff7ff" : "#d7eaff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(blade.x, blade.y);
    ctx.lineTo(blade.x - blade.vx * 2.2, blade.y - blade.vy * 2.2);
    ctx.stroke();
    ctx.restore();
  }

  worldEnd();
}

function drawYupiterWeapons() {
  if (selectedCharacter !== "yupiter") return;
  const aim = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  worldStart();

  if (player.crescentUltimateTime > 0) {
    const elapsed = YUPITER_ULTIMATE_DURATION - player.crescentUltimateTime;
    const orbitRadius = 68 + Math.min(250, elapsed * 0.42);
    for (let bladeIndex = 0; bladeIndex < 10; bladeIndex++) {
      const angle = elapsed * 0.075 + Math.PI * 2 * bladeIndex / 10;
      const x = player.x + Math.cos(angle) * orbitRadius;
      const y = player.y + Math.sin(angle) * orbitRadius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + elapsed * 0.18);
      ctx.shadowColor = "#8ff6ff";
      ctx.shadowBlur = 20;
      if (crescentBladeSpriteLoaded) ctx.drawImage(crescentBladeSprite, -27, -27, 54, 54);
      else {
        ctx.strokeStyle = "#d9fbff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 19, -2.2, 2.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  if (player.yupiterWeapon === 0 && crescentBlades.length === 0 && crescentBladeSpriteLoaded && !yupiterCrescentSpriteLoaded) {
    ctx.save();
    ctx.translate(player.x + Math.cos(aim) * 37, player.y + Math.sin(aim) * 37 - 5);
    ctx.rotate(aim);
    ctx.drawImage(crescentBladeSprite, -24, -24, 48, 48);
    ctx.restore();
  } else if (player.yupiterWeapon === 1 && severingBladeSpriteLoaded && yupiterSlashes.length === 0) {
    ctx.save();
    ctx.translate(player.x + Math.cos(aim) * 42, player.y + Math.sin(aim) * 42 - 5);
    ctx.rotate(aim - Math.PI / 2);
    ctx.shadowColor = player.severingFrenzyTime > 0 ? "#ff4fcb" : "#a8dfff";
    ctx.shadowBlur = player.severingFrenzyTime > 0 ? 24 : 10;
    ctx.drawImage(severingBladeSprite, -31, -31, 62, 62);
    ctx.restore();
  } else if (player.yupiterWeapon === 2 && flameCannonSpriteLoaded && !yupiterFlameSpriteLoaded) {
    ctx.save();
    ctx.translate(player.x, player.y - 5);
    ctx.rotate(aim);
    if (Math.cos(aim) < 0) ctx.scale(1, -1);
    ctx.drawImage(flameCannonSprite, 8, -18, 70, 36);
    ctx.restore();
  }

  for (const slash of yupiterSlashes) {
    const alpha = slash.life / slash.maxLife;
    const sweepProgress = 1 - alpha;
    const currentEnd = slash.startAngle + slash.sweep * sweepProgress;
    ctx.save();
    ctx.globalAlpha = Math.min(1, 0.35 + sweepProgress * 1.4);
    ctx.shadowColor = slash.fullCircle ? "#ff2020" : "#eaf6ff";
    ctx.shadowBlur = 24;
    for (let layer = 0; layer < 3; layer++) {
      const radius = slash.range * (0.86 + layer * 0.1) * (1.08 - alpha * 0.08);
      ctx.strokeStyle = slash.fullCircle
        ? (layer === 1 ? "#ff3028" : (layer === 0 ? "#7d0000" : "#ff8b78"))
        : (layer === 1 ? "#ffffff" : (layer === 0 ? "#94a9bf" : "#dce8f5"));
      ctx.lineWidth = (layer === 1 ? 8 : 4) * alpha + 1;
      ctx.beginPath();
      const start = slash.startAngle + layer * 0.025;
      const end = currentEnd - layer * 0.025;
      ctx.arc(slash.x, slash.y, radius, start, end);
      ctx.stroke();
    }
    const tipAngle = currentEnd;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(slash.x + Math.cos(tipAngle) * slash.range * 1.08, slash.y + Math.sin(tipAngle) * slash.range * 1.08);
    ctx.lineTo(slash.x + Math.cos(tipAngle - 0.18) * slash.range * 0.82, slash.y + Math.sin(tipAngle - 0.18) * slash.range * 0.82);
    ctx.lineTo(slash.x + Math.cos(tipAngle + 0.13) * slash.range * 0.91, slash.y + Math.sin(tipAngle + 0.13) * slash.range * 0.91);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (const shot of flameProjectiles) {
    const gradient = ctx.createRadialGradient(shot.x, shot.y, 1, shot.x, shot.y, 13);
    gradient.addColorStop(0, "#fff4a8");
    gradient.addColorStop(0.35, "#ff7a32");
    gradient.addColorStop(1, "rgba(125,45,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const orb of flameUltimateOrbs) {
    const pulse = 1 + Math.sin(performance.now() * 0.014) * 0.12;
    const gradient = ctx.createRadialGradient(orb.x - 8, orb.y - 8, 3, orb.x, orb.y, orb.r * 1.7);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.22, "#a8f6ff");
    gradient.addColorStop(0.55, "#7551ff");
    gradient.addColorStop(1, "rgba(255,69,34,0)");
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.shadowColor = "#8a5cff";
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r * 1.7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const shot of flameUltimateShots) {
    ctx.save();
    ctx.fillStyle = "#fff3a1";
    ctx.shadowColor = "#ff5d38";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const explosion of flameExplosions) {
    const progress = 1 - explosion.life / explosion.maxLife;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = progress < 0.5 ? "#fff1a0" : "#ff4d22";
    ctx.shadowColor = "#ff542e";
    ctx.shadowBlur = 28;
    ctx.lineWidth = 16 * (1 - progress) + 3;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.r * progress, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  worldEnd();
}

function drawZombies() {
  worldStart();
  for (const z of zombies) {
    if (z.x < camera.x - 90 || z.x > camera.x + canvas.width + 90 || z.y < camera.y - 90 || z.y > camera.y + canvas.height + 90) continue;
    const spriteSize = z.r * (z.boss ? 2.75 : 3.05);
    const spriteTop = z.y - spriteSize * 0.57;

    if (zombieSpriteAtlasLoaded || (zombieSpriteAtlas.complete && zombieSpriteAtlas.naturalWidth > 0)) {
      const sourceW = zombieSpriteAtlas.naturalWidth / 2;
      const sourceH = zombieSpriteAtlas.naturalHeight;
      const sourceX = z.boss ? sourceW : 0;
      ctx.save();
      if (z.stunTime > 0) {
        ctx.shadowColor = "#9277ff";
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.72;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        zombieSpriteAtlas,
        sourceX, 0, sourceW, sourceH,
        z.x - spriteSize / 2, spriteTop, spriteSize, spriteSize
      );
      ctx.restore();
    } else {
      ctx.fillStyle = z.stunTime > 0 ? "#6c5ce7" : (z.boss ? "#8b0000" : "#27ae60");
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (z.flameMarked) {
      ctx.save();
      ctx.strokeStyle = "#ff7038";
      ctx.shadowColor = "#a64dff";
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r + 7 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffb34d";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✦", z.x, spriteTop - 15);
      ctx.restore();
      ctx.textAlign = "left";
    }

    if (z.arcMark > 0) {
      const pulse = 1 + Math.sin(performance.now() * 0.014 + z.x * 0.01) * 0.09;
      ctx.save();
      ctx.translate(z.x, spriteTop - (z.boss ? 25 : 18));
      ctx.scale(pulse * (z.boss ? 1.28 : 1), pulse * (z.boss ? 1.28 : 1));
      ctx.strokeStyle = "#ffb12f"; ctx.fillStyle = "rgba(255,76,15,0.3)"; ctx.shadowColor = "#ff481c"; ctx.shadowBlur = 18; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let ray = 0; ray < 8; ray++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(23, 0); ctx.stroke(); }
      ctx.fillStyle = "#fff3a0"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    const barW = z.r * 2.25;
    const barY = spriteTop - 9;
    ctx.fillStyle = "rgba(10,12,18,0.82)";
    ctx.fillRect(z.x - barW / 2 - 1, barY - 1, barW + 2, 7);
    ctx.fillStyle = z.boss ? "#ff5959" : "#70e36c";
    ctx.fillRect(z.x - barW / 2, barY, barW * Math.max(0, z.hp / z.maxHp), 5);

    if (z.stunTime > 0) {
      ctx.fillStyle = "#e0c3ff";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✦", z.x, barY - 8);
      ctx.textAlign = "left";
    }
    if (selectedCharacter === "nightLord" && z.hp / z.maxHp <= 0.25 + player.nightLordExecutionLevel * 0.03) {
      const markY = spriteTop - (z.boss ? 21 : 17);
      const baseMarkSize = z.boss ? 13 : 7;
      const markSize = baseMarkSize + Math.sin(performance.now() * 0.012) * (z.boss ? 2 : 1.2);
      ctx.save();
      ctx.strokeStyle = "#ff244f";
      ctx.shadowColor = "#ff163f";
      ctx.shadowBlur = z.boss ? 20 : 12;
      ctx.lineWidth = z.boss ? 7 : 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(z.x - markSize, markY - markSize);
      ctx.lineTo(z.x + markSize, markY + markSize);
      ctx.moveTo(z.x + markSize, markY - markSize);
      ctx.lineTo(z.x - markSize, markY + markSize);
      ctx.stroke();
      ctx.restore();
    }
  }
  worldEnd();
}

function drawItems() {
  worldStart();
  for (const item of items) {
    if (item.x < camera.x - 40 || item.x > camera.x + canvas.width + 40 || item.y < camera.y - 40 || item.y > camera.y + canvas.height + 40) continue;
    if (item.type === "magnet" && magnetItemSpriteLoaded) {
      const pulse = 1 + Math.sin(performance.now() * 0.006 + item.x * 0.01) * 0.06;
      const size = 48 * pulse;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.shadowColor = "rgba(105,174,255,0.8)";
      ctx.shadowBlur = 15;
      ctx.drawImage(magnetItemSprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      continue;
    }
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
    if (orb.x < camera.x - 30 || orb.x > camera.x + canvas.width + 30 || orb.y < camera.y - 30 || orb.y > camera.y + canvas.height + 30) continue;
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
    if (p.x < camera.x - 20 || p.x > camera.x + canvas.width + 20 || p.y < camera.y - 20 || p.y > camera.y + canvas.height + 20) continue;
    ctx.globalAlpha = p.life / 35;
    ctx.fillStyle = p.color || "#ff5555";

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  worldEnd();
}

function drawTimeRewindEffect() {
  if (player.timeRewindEffectTime <= 0) return;

  const progress = 1 - player.timeRewindEffectTime / 45;
  worldStart();
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(-progress * Math.PI * 2.4);
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.strokeStyle = "#78fff1";
  ctx.shadowColor = "#78fff1";
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 45 + progress * 30, -Math.PI * 0.2, Math.PI * 1.55);
  ctx.stroke();
  ctx.fillStyle = "#b987ff";
  ctx.beginPath();
  ctx.moveTo(50 + progress * 30, -8);
  ctx.lineTo(63 + progress * 30, 0);
  ctx.lineTo(49 + progress * 30, 8);
  ctx.fill();
  ctx.restore();
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

  for (const b of droneBullets) {
    const bulletColor = b.droneType === "W" ? "#ffe878" : (b.droneType === "B" ? "#ff4fd8" : "#00e5ff");
    ctx.fillStyle = bulletColor;
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  if (hasWorldEnder()) {
    drawWorldEnderDrone();
  } else {
    if (player.droneLevel > 0) drawDroneUnit(player.x + 36, player.y - 36, "#00e5ff", 0);
    if (player.droneBLevel > 0) drawDroneUnit(player.x - 36, player.y - 36, "#ff4fd8", Math.PI);
  }

  worldEnd();
}

function drawDroneUnit(baseX, baseY, color, phase) {
  const droneX = baseX + Math.sin(Date.now() / 180 + phase) * 4;
  const droneY = baseY + Math.cos(Date.now() / 200 + phase) * 4;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = hasWorldEnder() ? 26 : 18;
  ctx.fillStyle = "#071923";
  ctx.beginPath();
  ctx.arc(droneX, droneY, hasWorldEnder() ? 14 : 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = hasWorldEnder() ? 4 : 3;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(droneX, droneY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWorldEnderDrone() {
  const x = player.x + Math.sin(Date.now() / 170) * 4;
  const y = player.y - 48 + Math.cos(Date.now() / 190) * 4;
  const spin = Date.now() / 380;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#ffe878";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#100d22";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(spin);
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI);
  ctx.stroke();
  ctx.strokeStyle = "#ff4fd8";
  ctx.beginPath();
  ctx.arc(0, 0, 15, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-spin * 2);
  ctx.strokeStyle = "#ffe878";
  ctx.lineWidth = 3;
  ctx.strokeRect(-11, -11, 22, 22);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
