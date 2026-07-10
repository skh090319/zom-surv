// HUD, 홈, 캐릭터 선택, 일시정지, 레벨업 UI

function drawHealthBar() {
  const barW = Math.min(520, canvas.width - 80);
  const barH = 24;
  const x = canvas.width / 2 - barW / 2;
  const y = 18;

  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));

  ctx.save();

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);

  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(x, y, barW, barH);

  ctx.fillStyle = "#ff3b3b";
  ctx.fillRect(x, y, barW * hpRatio, barH);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barW, barH);

  ctx.fillStyle = "white";
  ctx.font = "15px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${Math.max(0, Math.floor(player.hp))} / ${player.maxHp}`,
    canvas.width / 2,
    y + barH / 2
  );

  ctx.restore();
}

function drawHUD() {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(12, 12, 190, 190);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";

  const x = 25;
  let y = 40;
  const gap = 28;

  // HP는 화면 상단 체력바로 표시

  ctx.fillText(player.gatlingLevel > 0 ? "Ammo: ∞" : `Ammo: ${player.ammo}/${player.maxAmmo}`, x, y);
  y += gap;
  ctx.fillText(`Damage: ${player.damage}`, x, y);
  y += gap;
  ctx.fillText(`Wave: ${wave}`, x, y);
  y += gap;
  ctx.fillText(`Kills: ${player.kills}`, x, y);
  y += gap;
  ctx.fillText(`Score: ${player.score}`, x, y);

  ctx.textAlign = "center";

  if (player.invincibleTime > 0) {
    ctx.fillText("무적 상태", canvas.width / 2, 35);
  }

  if (zombieSlowTimer > 0) {
    ctx.fillText(`좀비 감속: ${Math.ceil(zombieSlowTimer / 60)}초`, canvas.width / 2, 65);
  }

  ctx.restore();
}

function drawReloadingOverlay() {
  if (player.reloadTime <= 0 || gameOver || player.gatlingLevel > 0) return;

  ctx.save();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RELOADING", canvas.width / 2, canvas.height / 2);

  ctx.restore();
}

function drawExpBar() {
  const margin = 260;
  const barX = margin;
  const barY = canvas.height - 32;
  const barW = Math.max(200, canvas.width - margin * 2);
  const barH = 18;
  const ratio = player.exp / player.expNeed;

  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barW, barH);

  ctx.fillStyle = "#b84dff";
  ctx.fillRect(barX, barY, barW * ratio, barH);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`LV.${player.level}  EXP ${player.exp}/${player.expNeed}`, canvas.width / 2, barY - 8);

  ctx.textAlign = "left";
}

function drawMiniMap() {
  const mapW = 180;
  const mapH = 120;
  const x = canvas.width - mapW - 20;
  const y = canvas.height - mapH - 20;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(x, y, mapW, mapH);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, mapW, mapH);

  ctx.fillStyle = "#4da3ff";
  ctx.beginPath();
  ctx.arc(x + (player.x / WORLD.width) * mapW, y + (player.y / WORLD.height) * mapH, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#27ae60";
  for (const z of zombies) {
    ctx.beginPath();
    ctx.arc(x + (z.x / WORLD.width) * mapW, y + (z.y / WORLD.height) * mapH, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#b84dff";
  for (const orb of expOrbs) {
    ctx.beginPath();
    ctx.arc(x + (orb.x / WORLD.width) * mapW, y + (orb.y / WORLD.height) * mapH, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const item of items) {
    if (item.type === "heal") ctx.fillStyle = "#ff4d6d";
    if (item.type === "slow") ctx.fillStyle = "#00d9ff";
    if (item.type === "magnet") ctx.fillStyle = "#ffd700";
    if (item.type === "bomb") ctx.fillStyle = "#ff7b00";

    ctx.beginPath();
    ctx.arc(x + (item.x / WORLD.width) * mapW, y + (item.y / WORLD.height) * mapH, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function saveTotalKills() {
  try {
    localStorage.setItem("zombieSurvivalTotalKills", String(totalZombieKills));
  } catch (error) {
    // 저장소를 사용할 수 없는 환경에서는 현재 세션 값만 유지
  }
}

function isSuncallUnlocked() {
  return totalZombieKills >= 200;
}

function pointInRect(px, py, rect) {
  return (
    px >= rect.x &&
    px <= rect.x + rect.w &&
    py >= rect.y &&
    py <= rect.y + rect.h
  );
}

function drawRoundedRect(x, y, w, h, radius, fill, stroke, lineWidth = 2) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  ctx.restore();
}

function drawHomeScreen() {
  ctx.fillStyle = "#080812";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (backgroundLoaded) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const centerX = canvas.width / 2;

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 64px Arial";
  ctx.fillText("ZOMBIE SURVIVAL", centerX, canvas.height * 0.24);

  ctx.fillStyle = "#b89cff";
  ctx.font = "20px Arial";
  ctx.fillText("끝없이 몰려오는 좀비를 처치하고 증강을 선택하세요.", centerX, canvas.height * 0.3);

  homeStartRect = {
    x: centerX - 130,
    y: canvas.height * 0.46,
    w: 260,
    h: 64
  };

  homeCharacterRect = {
    x: centerX - 130,
    y: canvas.height * 0.46 + 86,
    w: 260,
    h: 64
  };

  const startHover = pointInRect(mouse.x, mouse.y, homeStartRect);
  const charHover = pointInRect(mouse.x, mouse.y, homeCharacterRect);

  ctx.shadowColor = "#00e5ff";
  ctx.shadowBlur = startHover ? 24 : 12;
  drawRoundedRect(
    homeStartRect.x,
    homeStartRect.y,
    homeStartRect.w,
    homeStartRect.h,
    14,
    startHover ? "#0b3440" : "#08242c",
    "#00e5ff",
    startHover ? 4 : 2
  );

  ctx.shadowColor = "#b967ff";
  ctx.shadowBlur = charHover ? 24 : 12;
  drawRoundedRect(
    homeCharacterRect.x,
    homeCharacterRect.y,
    homeCharacterRect.w,
    homeCharacterRect.h,
    14,
    charHover ? "#35144a" : "#241032",
    "#b967ff",
    charHover ? 4 : 2
  );

  ctx.shadowBlur = 0;
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.fillText("게임 시작", centerX, homeStartRect.y + 40);
  ctx.fillText("캐릭터 선택", centerX, homeCharacterRect.y + 40);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "15px Arial";
  ctx.fillText("이동: WASD / 방향키 · 재장전: R · 사격: 마우스", centerX, canvas.height - 54);

  ctx.textAlign = "left";
}

function drawCharacterSelectScreen() {
  ctx.fillStyle = "#090912";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.fillText("캐릭터 선택", canvas.width / 2, 74);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "16px Arial";
  ctx.fillText(`누적 좀비 처치: ${totalZombieKills} / 200`, canvas.width / 2, 105);

  const cardW = 260;
  const cardH = 390;
  const gap = 40;
  const totalW = cardW * 2 + gap;
  const startX = canvas.width / 2 - totalW / 2;
  const y = 135;

  characterCards = [
    { id: "default", x: startX, y, w: cardW, h: cardH },
    { id: "suncall", x: startX + cardW + gap, y, w: cardW, h: cardH }
  ];

  for (const card of characterCards) {
    const isSelected = selectedCharacter === card.id;
    const unlocked = card.id === "default" || isSuncallUnlocked();
    const hover = pointInRect(mouse.x, mouse.y, card);

    let stroke = isSelected ? "#00e5ff" : "#b967ff";
    let fill = hover ? "#21152d" : "#17111f";

    if (!unlocked) {
      stroke = "#666";
      fill = "#111";
    }

    ctx.save();
    ctx.shadowColor = stroke;
    ctx.shadowBlur = isSelected || hover ? 22 : 8;
    drawRoundedRect(card.x, card.y, card.w, card.h, 18, fill, stroke, isSelected ? 4 : 2);
    ctx.restore();

    const sprite = card.id === "default" ? playerSprite : suncallSprite;
    const loaded = card.id === "default" ? playerSpriteLoaded : suncallSpriteLoaded;

    if (loaded) {
      ctx.save();

      if (!unlocked) {
        ctx.globalAlpha = 0.25;
      }

      ctx.drawImage(sprite, card.x + 48, card.y + 24, 164, 215);
      ctx.restore();
    }

    const name = card.id === "default" ? "기본 캐릭터" : "썬콜";
    const passive = card.id === "default" ? "기본 능력치" : "패시브: 이동속도 15% 증가";

    ctx.fillStyle = unlocked ? "white" : "#777";
    ctx.font = "bold 25px Arial";
    ctx.fillText(name, card.x + card.w / 2, card.y + 272);

    ctx.font = "15px Arial";
    ctx.fillStyle = unlocked ? "#9ee7ff" : "#888";
    ctx.fillText(passive, card.x + card.w / 2, card.y + 307);

    if (unlocked) {
      ctx.fillStyle = isSelected ? "#00ff99" : "rgba(255,255,255,0.6)";
      ctx.font = "bold 16px Arial";
      ctx.fillText(isSelected ? "현재 선택됨" : "클릭하여 선택", card.x + card.w / 2, card.y + 350);
    } else {
      ctx.fillStyle = "#ff8a8a";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`잠김 · 좀비 ${Math.max(0, 200 - totalZombieKills)}마리 더 처치`, card.x + card.w / 2, card.y + 350);
    }
  }

  characterBackRect = {
    x: 28,
    y: 28,
    w: 180,
    h: 54
  };

  const hover = pointInRect(mouse.x, mouse.y, characterBackRect);

  drawRoundedRect(
    characterBackRect.x,
    characterBackRect.y,
    characterBackRect.w,
    characterBackRect.h,
    12,
    hover ? "#2d2d3d" : "#1b1b27",
    "white",
    hover ? 3 : 2
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 20px Arial";
  ctx.fillText("← 홈으로", characterBackRect.x + characterBackRect.w / 2, characterBackRect.y + 35);

  ctx.textAlign = "left";
}

function drawPauseButton() {
  if (screenMode !== "game") return;

  pauseButtonRect = {
    x: canvas.width - 74,
    y: 18,
    w: 54,
    h: 54
  };

  const hover = pointInRect(mouse.x, mouse.y, pauseButtonRect);

  drawRoundedRect(
    pauseButtonRect.x,
    pauseButtonRect.y,
    pauseButtonRect.w,
    pauseButtonRect.h,
    12,
    hover ? "rgba(50,50,70,0.96)" : "rgba(20,20,30,0.88)",
    paused ? "#b967ff" : "white",
    hover ? 3 : 2
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 25px Arial";
  ctx.textAlign = "center";
  ctx.fillText(paused ? "▶" : "Ⅱ", pauseButtonRect.x + 27, pauseButtonRect.y + 36);
  ctx.textAlign = "left";
}

function getSelectedAugmentDisplayName(item) {
  const upgrade = upgrades.find(u => u.id === item.id);
  if (!upgrade) return item.name;

  const isCombat = upgrade.category === "combat" || upgrade.singleChoice === true;
  const isTranscended = !isCombat && item.count >= 4 && upgrade.transcendName;

  return isTranscended ? upgrade.transcendName : upgrade.name;
}

function drawPauseOverlay() {
  if (!paused || screenMode !== "game") return;

  ctx.fillStyle = "rgba(0,0,0,0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 64px Arial";
  ctx.fillText("PAUSED", canvas.width / 2, 82);

  ctx.fillStyle = "#b967ff";
  ctx.font = "18px Arial";
  ctx.fillText("오른쪽 위 재생 버튼을 누르면 게임이 계속됩니다.", canvas.width / 2, 116);

  const panelW = Math.min(960, canvas.width - 44);
  const panelH = Math.min(545, canvas.height - 190);
  const panelX = canvas.width / 2 - panelW / 2;
  const panelY = 138;

  drawRoundedRect(
    panelX,
    panelY,
    panelW,
    panelH,
    18,
    "rgba(16,16,26,0.97)",
    "#7451a8",
    3
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 25px Arial";
  ctx.fillText(`선택한 증강 ${selectedAugments.length}종`, canvas.width / 2, panelY + 38);

  const listTop = panelY + 60;
  const listBottom = panelY + panelH - 82;
  const availableHeight = listBottom - listTop;

  if (selectedAugments.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "18px Arial";
    ctx.fillText("아직 선택한 증강이 없습니다.", canvas.width / 2, listTop + 55);
  } else {
    const cols =
      selectedAugments.length >= 13 ? 4 :
      selectedAugments.length >= 7 ? 3 :
      selectedAugments.length >= 3 ? 2 : 1;

    const gapX = 10;
    const gapY = 9;
    const sidePad = 20;
    const rows = Math.ceil(selectedAugments.length / cols);

    const cardW =
      (panelW - sidePad * 2 - gapX * (cols - 1)) / cols;

    const cardH = Math.max(
      36,
      Math.min(
        58,
        (availableHeight - gapY * Math.max(0, rows - 1)) / rows
      )
    );

    const titleFont = cardH < 44 ? 12 : cardH < 52 ? 14 : 16;
    const subFont = cardH < 44 ? 10 : 12;

    for (let i = 0; i < selectedAugments.length; i++) {
      const item = selectedAugments[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = panelX + sidePad + col * (cardW + gapX);
      const y = listTop + row * (cardH + gapY);

      let stroke = "#ffffff";
      let fill = "rgba(255,255,255,0.06)";
      let glow = 0;

      if (item.category === "combat") {
        stroke = "#00e5ff";
        fill = "rgba(0,229,255,0.08)";
        glow = 10;
      }

      if (item.category === "emerald") {
        stroke = "#00ff88";
        fill = "rgba(0,255,136,0.10)";
        glow = 16;
      }

      const upgrade = upgrades.find(u => u.id === item.id);

      if (
        upgrade &&
        upgrade.category !== "combat" &&
        upgrade.category !== "emerald" &&
        item.count >= 4
      ) {
        stroke = "#ffd700";
        fill = "rgba(255,215,0,0.10)";
        glow = 14;
      }

      ctx.save();
      ctx.shadowColor = stroke;
      ctx.shadowBlur = glow;

      drawRoundedRect(
        x,
        y,
        cardW,
        cardH,
        9,
        fill,
        stroke,
        2
      );

      ctx.restore();

      ctx.textAlign = "left";
      ctx.fillStyle = stroke;
      ctx.font = `bold ${titleFont}px Arial`;

      const fullName = getSelectedAugmentDisplayName(item);
      let displayName = fullName;

      while (
        ctx.measureText(displayName).width > cardW - 26 &&
        displayName.length > 6
      ) {
        displayName = displayName.slice(0, -1);
      }

      if (displayName !== fullName) {
        displayName += "…";
      }

      ctx.fillText(
        displayName,
        x + 12,
        y + cardH * 0.42
      );

      ctx.fillStyle = "rgba(255,255,255,0.76)";
      ctx.font = `${subFont}px Arial`;
      ctx.fillText(
        `선택 횟수: ${item.count}`,
        x + 12,
        y + cardH * 0.76
      );
    }
  }

  pauseHomeButtonRect = {
    x: canvas.width / 2 - 110,
    y: panelY + panelH - 62,
    w: 220,
    h: 44
  };

  const homeHover = pointInRect(
    mouse.x,
    mouse.y,
    pauseHomeButtonRect
  );

  ctx.save();
  ctx.shadowColor = "#ff5f7a";
  ctx.shadowBlur = homeHover ? 20 : 10;

  drawRoundedRect(
    pauseHomeButtonRect.x,
    pauseHomeButtonRect.y,
    pauseHomeButtonRect.w,
    pauseHomeButtonRect.h,
    11,
    homeHover ? "#4a1622" : "#2e1118",
    "#ff5f7a",
    homeHover ? 4 : 2
  );

  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 18px Arial";
  ctx.fillText(
    "홈 화면으로",
    pauseHomeButtonRect.x + pauseHomeButtonRect.w / 2,
    pauseHomeButtonRect.y + 29
  );

  ctx.textAlign = "left";
}

function drawUpgradeMenu() {
  if (!choosingUpgrade) return;
  upgradeAnimTime++;
  upgradeCardRects = [];
  ctx.fillStyle = "rgba(0,0,0,0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "42px Arial";
  ctx.fillText("LEVEL UP", canvas.width / 2, 120);
  ctx.font = "18px Arial";
  ctx.fillText(
    player.level >= 5 && player.level % 5 === 0
      ? "전투 증강 선택: 5의 배수 레벨에서는 전투 증강만 등장합니다."
      : "보조 증강 선택: 전투 증강은 5의 배수 레벨에서만 등장합니다.",
    canvas.width / 2,
    158
  );
  const cardW = 290, cardH = 220, gap = 35;
  const totalW = cardW * upgradeChoices.length + gap * Math.max(0, upgradeChoices.length - 1);
  const startX = canvas.width / 2 - totalW / 2;
  const baseY = canvas.height / 2 - cardH / 2 + 25;
  for (let i = 0; i < upgradeChoices.length; i++) {
    const u = upgradeChoices[i], count = upgradeCount[u.id] || 0;
    const isSkillUpgrade = u.category === "combat" || u.singleChoice === true;
    const isTranscendReady = !isSkillUpgrade && count >= 3;
    const title = isTranscendReady && u.transcendName ? u.transcendName : u.name;
    const desc = isTranscendReady && u.transcendDesc ? u.transcendDesc : (typeof u.getDesc === "function" ? u.getDesc() : u.desc);
    const x = startX + i * (cardW + gap);
    const y = baseY + Math.sin((upgradeAnimTime + i * 12) * 0.06) * 6;
    const hovered = mouse.x >= x && mouse.x <= x + cardW && mouse.y >= y && mouse.y <= y + cardH;
    upgradeCardRects.push({ x, y, w: cardW, h: cardH });
    let stroke = "white", fill = "#1e1e1e", glow = 0;
    if (u.category === "combat") { stroke = "#00e5ff"; fill = "#061b35"; glow = 22; }
    if (u.category === "emerald") { stroke = "#00ff88"; fill = "#002d1d"; glow = 26; }
    if (isTranscendReady && !isSkillUpgrade) { stroke = "#ffd700"; fill = "#2c2300"; glow = 22; }
    ctx.save();
    ctx.shadowColor = stroke; ctx.shadowBlur = hovered ? glow + 14 : glow;
    ctx.fillStyle = fill; ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = stroke; ctx.lineWidth = hovered ? 5 : 3; ctx.strokeRect(x, y, cardW, cardH);
    ctx.restore();
    if (hovered) { ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(x, y, cardW, cardH); }
    ctx.fillStyle = stroke; ctx.font = "15px Arial"; ctx.fillText(u.category === "emerald" ? "에메랄드 증강" : (u.category === "emerald" ? "에메랄드 증강" : (u.category === "combat" ? "전투 증강" : "보조 증강")), x + cardW / 2, y + 32);
    ctx.fillStyle = "#ffd166"; ctx.font = "28px Arial"; ctx.fillText(`${i + 1}`, x + cardW / 2, y + 63);
    ctx.fillStyle = "white"; ctx.font = "21px Arial"; ctx.fillText(title, x + cardW / 2, y + 108);
    ctx.font = "15px Arial"; wrapText(desc, x + cardW / 2, y + 145, cardW - 36, 20);
    ctx.fillStyle = isTranscendReady ? stroke : "#aaa"; ctx.font = "14px Arial";
    let statusText = `선택 횟수: ${count}/4`;
    if (isSkillUpgrade) statusText = "1회 선택 · 즉시 활성화";
    else if (isTranscendReady) statusText = "이번 선택 시 초월 발동";
    ctx.fillText(statusText, x + cardW / 2, y + 190);
  }
  ctx.textAlign = "left";
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  ctx.textAlign = "center";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else line = testLine;
  }
  ctx.fillText(line, x, y);
}

function drawVisionEffect() {
  // 비전 텍스트 이펙트 제거
}

function drawGameOver() {
  if (!gameOver) return;

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "48px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${player.score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Enter 키로 재시작", canvas.width / 2, canvas.height / 2 + 50);

  ctx.textAlign = "left";
}
