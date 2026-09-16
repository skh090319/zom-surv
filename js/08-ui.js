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
  const hudW = selectedCharacter === "ren" ? 240 : (selectedCharacter === "yupiter" ? 350 : 190);
  const hudH = 190;
  ctx.fillRect(12, 12, hudW, hudH);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";

  const x = 25;
  let y = 40;
  const gap = 28;

  // HP는 화면 상단 체력바로 표시

  const weaponText = selectedCharacter === "yupiter"
    ? `Weapon: ${YUPITER_WEAPON_NAMES[player.yupiterWeapon]}`
    : (selectedCharacter === "ren"
      ? "렌 · 그림자 암살자"
      : (selectedCharacter === "nightLord" ? "나이트 로드 · 암흑 월도" : (selectedCharacter === "zero" ? "제로 · 성검" : (selectedCharacter === "paladin" ? "팔라딘 · 해방검" : (selectedCharacter === "arc" ? "아크 · 태양술사" : (selectedCharacter === "terra" ? "테라 · 대지 권사" : (selectedCharacter === "void" ? "보이드 · 공허 포식자" : (selectedCharacter === "carmilla" ? "카르밀라 · 혈조" : (player.gatlingLevel > 0 ? "Ammo: ∞" : `Ammo: ${player.ammo}/${player.maxAmmo}`)))))))));
  ctx.fillText(weaponText, x, y);
  y += gap;
  if (selectedCharacter === "yupiter") {
    const cooldown = player.yupiterSkillCooldowns[player.yupiterWeapon];
    const cooldownText = cooldown > 0 ? `${(cooldown / 60).toFixed(1)}초` : "준비됨";
    ctx.fillStyle = cooldown > 0 ? "#c7c7d8" : "#7dffb2";
    ctx.fillText(`Q: 무기 변경 · E: 고유 기술 (${cooldownText})`, x, y);
    ctx.fillStyle = "white";
    y += gap;
  }
  const displayedDamage = selectedCharacter === "ren"
    ? Math.floor(scaledDamage(player.damage * getRenAttackMultiplier()))
    : (selectedCharacter === "nightLord" ? Math.floor(scaledDamage(player.damage * (1 + getNightLordRage() * 0.8))) : (selectedCharacter === "zero" ? Math.floor(scaledDamage(player.damage * getZeroDamageMultiplier())) : (selectedCharacter === "paladin" ? Math.floor(scaledDamage(player.damage * [1, 1.16, 1.36, 1.68][getPaladinTier()])) : player.damage)));
  ctx.fillText(`Damage: ${displayedDamage}`, x, y);
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

function drawYupiterInterface() {
  if (selectedCharacter !== "yupiter" || gameOver) return;

  const panelW = Math.min(840, canvas.width - 36);
  const panelH = 132;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height - panelH - 54;
  const scale = panelW / 840;
  const cy = panelY + 55;
  const portraitX = panelX + 68 * scale;
  const statsX = panelX + 138 * scale;
  const weaponX = panelX + 430 * scale;
  const skillX = panelX + 585 * scale;
  const ultimateX = panelX + 740 * scale;
  const radius = Math.max(30, 38 * scale);

  ctx.save();
  ctx.fillStyle = "rgba(17,18,24,0.92)";
  ctx.strokeStyle = "rgba(132,224,255,0.55)";
  ctx.lineWidth = 2;
  roundedRectPath(panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.stroke();

  drawYupiterHudIcon(portraitX, cy, radius + 4, yupiterHudPortrait, true, true);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(14, 18 * scale)}px Arial`;
  ctx.fillText(`공격력: ${Math.floor(player.damage)}`, statsX, cy - 13);
  const displayedSpeed = player.speed * (player.severingUltimateTime > 0 ? 2 : 1);
  ctx.fillText(`이동속도: ${displayedSpeed.toFixed(1)}`, statsX, cy + 15);

  const weaponSprites = [crescentBladeSprite, severingBladeSprite, flameCannonSprite];
  drawYupiterHudIcon(weaponX, cy, radius, weaponSprites[player.yupiterWeapon], true);
  drawSkillHudLabel(weaponX, panelY + 103, YUPITER_WEAPON_NAMES[player.yupiterWeapon], "Q", "#ffffff");

  const skillCooldown = player.yupiterSkillCooldowns[player.yupiterWeapon];
  drawYupiterHudIcon(skillX, cy, radius, yupiterESkillIcons[player.yupiterWeapon], skillCooldown <= 0, true);
  if (skillCooldown > 0) drawCooldownCover(skillX, cy, radius, skillCooldown / YUPITER_SKILL_COOLDOWNS[player.yupiterWeapon], skillCooldown);
  drawSkillHudLabel(skillX, panelY + 103, "무기 기술", "E", "#ffffff");

  const ultimateCooldown = player.yupiterUltimateCooldown;
  drawYupiterHudIcon(ultimateX, cy, radius, yupiterUltimateIcon, ultimateCooldown <= 0, true);
  if (ultimateCooldown > 0) drawCooldownCover(ultimateX, cy, radius, ultimateCooldown / YUPITER_ULTIMATE_COOLDOWN, ultimateCooldown);
  drawSkillHudLabel(ultimateX, panelY + 103, "궁극기", "R", "#ffffff");
  ctx.restore();
}

function drawRenInterface() {
  if (selectedCharacter !== "ren" || gameOver) return;

  const panelW = Math.min(840, canvas.width - 36);
  const panelH = 132;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height - panelH - 54;
  const scale = panelW / 840;
  const cy = panelY + 55;
  const portraitX = panelX + 64 * scale;
  const statsX = panelX + 124 * scale;
  const qX = panelX + 420 * scale;
  const xX = panelX + 540 * scale;
  const eX = panelX + 660 * scale;
  const rX = panelX + 780 * scale;
  const radius = Math.max(25, 35 * scale);
  const cloneCapacity = getRenCloneCount();
  const placedCount = renPlacedClones.length;

  ctx.save();
  const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
  panelGradient.addColorStop(0, "rgba(13,10,25,0.95)");
  panelGradient.addColorStop(0.55, "rgba(34,8,39,0.95)");
  panelGradient.addColorStop(1, "rgba(16,5,19,0.95)");
  ctx.fillStyle = panelGradient;
  ctx.strokeStyle = "rgba(255,74,117,0.72)";
  ctx.shadowColor = "rgba(190,34,91,0.45)";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  roundedRectPath(panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawYupiterHudIcon(portraitX, cy, radius + 4, renHudPortrait, true, true);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(14, 18 * scale)}px Arial`;
  ctx.fillText(`흡수한 조각: ${player.renShards}`, statsX, cy - 20);
  ctx.fillStyle = "#ff83a5";
  ctx.fillText(`추가 공격력: +${Math.round((getRenAttackMultiplier() - 1) * 100)}%`, statsX, cy + 6);
  ctx.fillStyle = "#bfc9df";
  ctx.font = `bold ${Math.max(12, 14 * scale)}px Arial`;
  ctx.fillText(`배치한 분신: ${placedCount} / ${cloneCapacity}`, statsX, cy + 30);

  const qReady = cloneCapacity > 0 && player.renDeployCooldown <= 0;
  drawYupiterHudIcon(qX, cy, radius, renSkillIcons[0], qReady, true);
  if (player.renDeployCooldown > 0) drawCooldownCover(qX, cy, radius, player.renDeployCooldown / REN_DEPLOY_COOLDOWN, player.renDeployCooldown);
  else if (cloneCapacity <= 0) drawRenLockedSkill(qX, cy, "조각 필요");
  drawSkillHudLabel(qX, panelY + 99, placedCount >= cloneCapacity && cloneCapacity > 0 ? "전체 회수" : "분신 배치", "Q");

  const xReady = placedCount > 0 && player.renSwapCooldown <= 0;
  drawYupiterHudIcon(xX, cy, radius, renSkillIcons[1], xReady, true);
  if (player.renSwapCooldown > 0) drawCooldownCover(xX, cy, radius, player.renSwapCooldown / REN_SWAP_COOLDOWN, player.renSwapCooldown);
  else if (placedCount <= 0) drawRenLockedSkill(xX, cy, "배치 필요");
  drawSkillHudLabel(xX, panelY + 99, "그림자 귀환", "X");

  const eReady = placedCount > 0 && player.renSkillCooldown <= 0;
  drawYupiterHudIcon(eX, cy, radius, renSkillIcons[2], eReady, true);
  if (player.renSkillCooldown > 0) drawCooldownCover(eX, cy, radius, player.renSkillCooldown / REN_SKILL_COOLDOWN, player.renSkillCooldown);
  else if (placedCount <= 0) drawRenLockedSkill(eX, cy, "배치 필요");
  drawSkillHudLabel(eX, panelY + 99, "분신 습격", "E");

  const rReady = player.renUltimateCooldown <= 0;
  drawYupiterHudIcon(rX, cy, radius, renSkillIcons[3], rReady, true);
  if (player.renUltimateCooldown > 0) drawCooldownCover(rX, cy, radius, player.renUltimateCooldown / REN_ULTIMATE_COOLDOWN, player.renUltimateCooldown);
  drawSkillHudLabel(rX, panelY + 99, "밤의 군주", "R");
  ctx.restore();
}

function drawRenLockedSkill(x, y, text) {
  ctx.save();
  ctx.fillStyle = "rgba(10,7,15,0.72)";
  ctx.beginPath();
  ctx.arc(x, y, 37, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9c5d0";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawNightLordInterface() {
  if (selectedCharacter !== "nightLord" || gameOver) return;
  const panelW = Math.min(760, canvas.width - 36), panelH = 118;
  const panelX = (canvas.width - panelW) / 2, panelY = canvas.height - panelH - 54;
  const rage = Math.round(getNightLordRage() * 100);
  ctx.save();
  const gradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
  gradient.addColorStop(0, "rgba(10,7,20,0.96)"); gradient.addColorStop(0.5, "rgba(45,13,67,0.96)"); gradient.addColorStop(1, "rgba(12,6,23,0.96)");
  drawRoundedRect(panelX, panelY, panelW, panelH, 23, gradient, "rgba(169,75,245,0.8)", 2);
  drawNightLordPortrait(panelX + 48, panelY + 54, 36);
  const statsX = panelX + 96;
  ctx.textAlign = "left"; ctx.fillStyle = "#f4eaff"; ctx.font = "bold 17px Arial";
  ctx.fillText("나이트 로드", statsX, panelY + 27);
  ctx.fillStyle = "#c879ff"; ctx.font = "bold 13px Arial"; ctx.fillText(`분노 ${rage}%`, statsX, panelY + 49);
  ctx.fillStyle = "#b9adca"; ctx.font = "12px Arial"; ctx.fillText(`공격 강화 +${Math.round(rage * (0.8 + player.nightLordBloodLevel * 0.2))}%`, statsX, panelY + 70);
  ctx.fillStyle = "#ff6b83"; ctx.font = "bold 12px Arial"; ctx.fillText(`처형 기준: ${25 + player.nightLordExecutionLevel * 3}%`, statsX, panelY + 91);
  const skills = [
    ["Q", "그림자 추격", player.nightLordQCooldown, NIGHT_LORD_Q_COOLDOWN],
    ["E", "광란", player.nightLordECooldown, NIGHT_LORD_E_COOLDOWN],
    ["X", "처형", player.nightLordXCooldown, NIGHT_LORD_X_COOLDOWN],
    ["R", "불사의 밤", player.nightLordRCooldown, NIGHT_LORD_R_COOLDOWN]
  ];
  skills.forEach((skill, index) => {
    const x = panelX + panelW - 330 + index * 80, y = panelY + 48, radius = 27;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = skill[2] > 0 ? "#282331" : "#321044"; ctx.strokeStyle = skill[2] > 0 ? "#5d5667" : "#c66cff"; ctx.shadowColor = "#8c31dc"; ctx.shadowBlur = skill[2] > 0 ? 0 : 16; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.clip();
    const skillIcon = nightLordSkillIcons[index];
    if (skillIcon && skillIcon.complete && skillIcon.naturalWidth > 0) {
      ctx.globalAlpha = skill[2] > 0 ? 0.42 : 1;
      ctx.drawImage(skillIcon, -radius, -radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = skill[2] > 0 ? "#82798d" : "#ffffff";
      ctx.font = "900 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(skill[0], 0, 1);
    }
    ctx.restore();
    if (skill[2] > 0) drawCooldownCover(x, y, radius, skill[2] / skill[3], skill[2]);
    drawSkillHudLabel(x, panelY + 91, skill[1], skill[0], "#d8c9e7");
  });
  ctx.restore();
}

function drawNightLordPortrait(x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#160b26";
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  if (nightLordSpriteLoaded && nightLordSprite.naturalWidth > 0) {
    const sourceSize = Math.min(nightLordSprite.naturalWidth, nightLordSprite.naturalHeight) * 0.58;
    const sourceX = nightLordSprite.naturalWidth * 0.21;
    const sourceY = nightLordSprite.naturalHeight * 0.08;
    ctx.drawImage(nightLordSprite, sourceX, sourceY, sourceSize, sourceSize, x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#bd68ff";
  ctx.shadowColor = "#8b32db";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawZeroInterface() {
  if (selectedCharacter !== "zero" || gameOver) return;
  const panelW = Math.min(760, canvas.width - 36), panelH = 118;
  const panelX = (canvas.width - panelW) / 2, panelY = canvas.height - panelH - 54;
  ctx.save();
  const gradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
  gradient.addColorStop(0, "rgba(12,16,29,0.97)"); gradient.addColorStop(0.5, "rgba(82,25,25,0.96)"); gradient.addColorStop(1, "rgba(18,13,24,0.97)");
  drawRoundedRect(panelX, panelY, panelW, panelH, 23, gradient, "rgba(255,210,74,0.88)", 2);
  ctx.beginPath(); ctx.arc(panelX + 48, panelY + 54, 36, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#251413"; ctx.fillRect(panelX + 12, panelY + 18, 72, 72);
  if (zeroSpriteLoaded) ctx.drawImage(zeroSprite, panelX + 9, panelY + 14, 80, 80);
  ctx.restore(); ctx.save();
  ctx.strokeStyle = "#ffe27a"; ctx.shadowColor = "#ffba36"; ctx.shadowBlur = 15; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(panelX + 48, panelY + 54, 36, 0, Math.PI * 2); ctx.stroke();
  const statsX = panelX + 96;
  ctx.textAlign = "left"; ctx.fillStyle = "#fff8dd"; ctx.font = "bold 18px Arial"; ctx.fillText("제로", statsX, panelY + 29);
  ctx.fillStyle = player.zeroVitalTime > 0 ? "#ff735f" : "#d1bf9a"; ctx.font = "bold 12px Arial";
  ctx.fillText(player.zeroVitalTime > 0 ? `급소 강화 ${Math.ceil(player.zeroVitalTime / 60)}초` : "급소 비활성", statsX, panelY + 54);
  ctx.fillStyle = player.zeroUltimateTime > 0 ? "#ffe36e" : "#bdaea2";
  ctx.fillText(player.zeroUltimateTime > 0 ? `검의 왈츠 ${Math.ceil(player.zeroUltimateTime / 60)}초` : (player.zeroEmpoweredAttack ? "다음 평타 강화 +50%" : `검술 숙련 +${Math.round((getZeroLevelMultiplier() - 1) * 100)}%`), statsX, panelY + 77);
  const skills = [
    ["Q", "참격", player.zeroQCooldown, ZERO_Q_COOLDOWN],
    ["E", "급소", player.zeroECooldown, ZERO_E_COOLDOWN],
    ["X", "심판", player.zeroXCooldown, ZERO_X_COOLDOWN],
    ["R", "검의 왈츠", player.zeroRCooldown, ZERO_R_COOLDOWN]
  ];
  skills.forEach((skill, index) => {
    const x = panelX + panelW - 330 + index * 80, y = panelY + 48, radius = 27;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = skill[2] > 0 ? "#2c2930" : "#4b1f1d"; ctx.strokeStyle = skill[2] > 0 ? "#625d60" : "#ffe06b"; ctx.shadowColor = "#ffc23f"; ctx.shadowBlur = skill[2] > 0 ? 0 : 16; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.clip();
    const icon = zeroSkillIcons[index];
    if (icon && icon.complete && icon.naturalWidth > 0) { ctx.globalAlpha = skill[2] > 0 ? 0.42 : 1; ctx.drawImage(icon, -radius, -radius, radius * 2, radius * 2); }
    else { ctx.fillStyle = "#fff"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(skill[0], 0, 1); }
    ctx.restore();
    if (skill[2] > 0) drawCooldownCover(x, y, radius, skill[2] / skill[3], skill[2]);
    drawSkillHudLabel(x, panelY + 91, skill[1], skill[0], "#eadfc7");
  });
  ctx.restore();
}

function drawPaladinInterface() {
  if (selectedCharacter !== "paladin" || gameOver) return;
  const panelW = Math.min(800, canvas.width - 36), panelH = 124;
  const panelX = (canvas.width - panelW) / 2, panelY = canvas.height - panelH - 50;
  const tier = getPaladinTier();
  const tierNames = ["봉인검", "해방검", "폭주검", "진명 해방"];
  const tierColors = ["#aebbc8", "#74caff", "#ffd15b", "#fff1a3"];
  ctx.save();
  const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
  panelGradient.addColorStop(0, "rgba(8,19,36,0.97)"); panelGradient.addColorStop(0.52, "rgba(28,51,88,0.97)"); panelGradient.addColorStop(1, "rgba(38,28,13,0.97)");
  drawRoundedRect(panelX, panelY, panelW, panelH, 24, panelGradient, tierColors[tier], 2);
  ctx.beginPath(); ctx.arc(panelX + 50, panelY + 56, 38, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#10223c"; ctx.fillRect(panelX + 12, panelY + 18, 76, 76);
  if (paladinSpriteLoaded) ctx.drawImage(paladinSprite, panelX + 8, panelY + 12, 84, 84);
  ctx.restore(); ctx.save();
  ctx.strokeStyle = tierColors[tier]; ctx.shadowColor = tierColors[tier]; ctx.shadowBlur = 16; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(panelX + 50, panelY + 56, 38, 0, Math.PI * 2); ctx.stroke();
  const statsX = panelX + 101;
  ctx.textAlign = "left"; ctx.fillStyle = "#fff9e9"; ctx.font = "bold 18px Arial"; ctx.fillText("팔라딘", statsX, panelY + 27);
  ctx.fillStyle = tierColors[tier]; ctx.font = "bold 13px Arial"; ctx.fillText(`${tierNames[tier]} · ${Math.floor(player.paladinCombo)} COMBO`, statsX, panelY + 49);
  const barW = 155, barY = panelY + 62;
  drawRoundedRect(statsX, barY, barW, 10, 5, "rgba(255,255,255,0.1)", "rgba(255,255,255,0.12)", 1);
  const comboGradient = ctx.createLinearGradient(statsX, 0, statsX + barW, 0); comboGradient.addColorStop(0, "#55bfff"); comboGradient.addColorStop(0.55, "#ffd050"); comboGradient.addColorStop(1, "#fff6bf");
  if (player.paladinCombo > 0) drawRoundedRect(statsX, barY, barW * player.paladinCombo / 100, 10, 5, comboGradient);
  const comboStatus = player.paladinCombo <= 0 ? "콤보 없음" : (player.paladinComboTimer > 0 ? `콤보 감소 시작까지 ${(player.paladinComboTimer / 60).toFixed(1)}초` : "콤보 감소 중");
  ctx.fillStyle = "#aebdd3"; ctx.font = "11px Arial"; ctx.fillText(player.paladinGuardTime > 0 ? `반격 준비 ${Math.max(0, player.paladinGuardTime / 60).toFixed(1)}초` : (player.paladinUltimateTime > 0 ? `한계 돌파 ${Math.ceil(player.paladinUltimateTime / 60)}초` : comboStatus), statsX, panelY + 91);
  const skills = [
    ["Q", "성스러운 반격", player.paladinQCooldown, PALADIN_Q_COOLDOWN],
    ["E", "연속 절단", player.paladinECooldown, PALADIN_E_COOLDOWN],
    ["X", tier >= 3 ? "진명 심판" : "콤보 전환", player.paladinXCooldown, PALADIN_X_COOLDOWN],
    ["R", player.level < 10 ? "10레벨 해금" : "한계 돌파", player.paladinRCooldown, PALADIN_R_COOLDOWN]
  ];
  skills.forEach((skill, index) => {
    const x = panelX + panelW - 335 + index * 81, y = panelY + 50, radius = 28;
    const locked = index === 3 && player.level < 10;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = skill[2] > 0 || locked ? "#292d34" : "#122c4b"; ctx.strokeStyle = skill[2] > 0 || locked ? "#616873" : "#ffe075"; ctx.shadowColor = tierColors[tier]; ctx.shadowBlur = skill[2] > 0 || locked ? 0 : 15; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.clip();
    const icon = paladinSkillIcons[index];
    if (icon && icon.complete && icon.naturalWidth > 0) { ctx.globalAlpha = skill[2] > 0 || locked ? 0.28 : 1; ctx.drawImage(icon, -radius, -radius, radius * 2, radius * 2); }
    else { ctx.fillStyle = "#fff"; ctx.font = "900 18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(skill[0], 0, 1); }
    ctx.restore();
    if (skill[2] > 0) drawCooldownCover(x, y, radius, skill[2] / skill[3], skill[2]);
    if (locked) { ctx.fillStyle = "#d6dae0"; ctx.font = "bold 17px Arial"; ctx.textAlign = "center"; ctx.fillText("🔒", x, y + 6); }
    drawSkillHudLabel(x, panelY + 98, skill[1], skill[0], "#e8dfc8");
  });
  ctx.restore();
}

function drawArcInterface() {
  if (selectedCharacter !== "arc" || screenMode !== "game") return;
  const panelW = Math.min(690, canvas.width - 32), panelH = 120, panelX = (canvas.width - panelW) / 2, panelY = canvas.height - 178;
  ctx.save();
  const gradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
  gradient.addColorStop(0, "rgba(20,8,12,0.96)"); gradient.addColorStop(0.55, "rgba(72,20,12,0.96)"); gradient.addColorStop(1, "rgba(18,7,8,0.96)");
  drawRoundedRect(panelX, panelY, panelW, panelH, 24, gradient, "#ef7d2b", 2);
  ctx.beginPath(); ctx.arc(panelX + 55, panelY + 58, 40, 0, Math.PI * 2); ctx.save(); ctx.clip(); ctx.fillStyle = "#35120d"; ctx.fillRect(panelX + 15, panelY + 18, 80, 80); if (arcSpriteLoaded) ctx.drawImage(arcSprite, panelX + 10, panelY + 8, 90, 90); ctx.restore();
  ctx.strokeStyle = "#ff9a35"; ctx.shadowColor = "#ff5c18"; ctx.shadowBlur = 16; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(panelX + 55, panelY + 58, 40, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
  const statsX = panelX + 108;
  ctx.textAlign = "left"; ctx.fillStyle = "#fff3de"; ctx.font = "bold 18px Arial"; ctx.fillText("아크", statsX, panelY + 28);
  ctx.fillStyle = player.arcHeat >= 100 ? "#fff5b0" : "#ffad42"; ctx.font = "bold 13px Arial"; ctx.fillText(`열기 ${Math.floor(player.arcHeat)} / 100`, statsX, panelY + 49);
  const barW = 160, barY = panelY + 61; drawRoundedRect(statsX, barY, barW, 12, 6, "rgba(255,255,255,0.1)", "rgba(255,165,65,0.25)", 1);
  if (player.arcHeat > 0) { const heatGradient = ctx.createLinearGradient(statsX, 0, statsX + barW, 0); heatGradient.addColorStop(0, "#d63016"); heatGradient.addColorStop(0.65, "#ff941f"); heatGradient.addColorStop(1, "#fff5b0"); drawRoundedRect(statsX, barY, barW * player.arcHeat / 100, 12, 6, heatGradient); }
  ctx.fillStyle = "#d4ac91"; ctx.font = "11px Arial"; ctx.fillText(player.arcHeat >= 100 ? "과열: 다음 광역 기술 2회 폭발" : player.arcHeat >= 50 ? "고열: 범위 증가 · 화상 지대 생성" : "다수 적중 시 열기 획득", statsX, panelY + 95);
  const skills = [["Q","일륜",player.arcQCooldown,ARC_Q_COOLDOWN],["E","홍염 파동",player.arcECooldown,ARC_E_COOLDOWN],["X","태양 낙하",player.arcXCooldown,ARC_X_COOLDOWN],["R",player.level < 10 ? "10레벨 해금" : "초신성",player.arcRCooldown,ARC_R_COOLDOWN]];
  skills.forEach((skill, index) => {
    const x = panelX + panelW - 325 + index * 78, y = panelY + 49, radius = 27, locked = index === 3 && player.level < 10;
    ctx.save(); ctx.translate(x,y); ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fillStyle = skill[2] > 0 || locked ? "#29231f" : "#42120b"; ctx.fill(); ctx.strokeStyle = skill[2] > 0 || locked ? "#665b54" : "#ff9b35"; ctx.lineWidth=2; ctx.stroke(); ctx.clip();
    if (arcSkillIconAtlas.complete && arcSkillIconAtlas.naturalWidth > 0) { const sw=arcSkillIconAtlas.naturalWidth/2, sh=arcSkillIconAtlas.naturalHeight/2; ctx.globalAlpha=skill[2]>0||locked?0.3:1; ctx.drawImage(arcSkillIconAtlas,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,-radius,-radius,radius*2,radius*2); } ctx.restore();
    if (skill[2] > 0) drawCooldownCover(x,y,radius,skill[2]/skill[3],skill[2]);
    drawSkillHudLabel(x,panelY+96,skill[1],skill[0],"#f3d3b7");
  });
  ctx.restore();
}

function drawTerraInterface(){
  if(selectedCharacter!=="terra"||screenMode!=="game")return;
  const w=Math.min(690,canvas.width-32),h=120,x=(canvas.width-w)/2,y=canvas.height-178;ctx.save();
  const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(14,18,13,.97)");g.addColorStop(.52,"rgba(48,38,18,.97)");g.addColorStop(1,"rgba(10,20,14,.97)");drawRoundedRect(x,y,w,h,24,g,"#b8d45c",2);
  ctx.save();ctx.beginPath();ctx.arc(x+55,y+58,40,0,Math.PI*2);ctx.clip();ctx.fillStyle="#202819";ctx.fillRect(x+15,y+18,80,80);if(terraSpriteLoaded)ctx.drawImage(terraSprite,x+9,y+8,92,92);ctx.restore();ctx.strokeStyle="#d6b85c";ctx.shadowColor="#74ff75";ctx.shadowBlur=15;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+55,y+58,40,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  const sx=x+108;ctx.textAlign="left";ctx.fillStyle="#f8f0d4";ctx.font="bold 18px Arial";ctx.fillText("테라",sx,y+28);ctx.fillStyle="#cbdf68";ctx.font="bold 13px Arial";ctx.fillText(`진동 ${Math.floor(player.terraVibration)} / 100`,sx,y+49);
  const bw=160,by=y+61;drawRoundedRect(sx,by,bw,12,6,"rgba(255,255,255,.09)","rgba(190,220,90,.25)",1);if(player.terraVibration>0){const bg=ctx.createLinearGradient(sx,0,sx+bw,0);bg.addColorStop(0,"#6e7936");bg.addColorStop(.65,"#c59d3f");bg.addColorStop(1,"#cfff82");drawRoundedRect(sx,by,bw*player.terraVibration/100,12,6,bg);}
  ctx.fillStyle="#c9c4a0";ctx.font="11px Arial";ctx.fillText(player.terraVibration>=100?"공명 폭주: 다음 스킬 범위 증가 · 2회 타격 · 여진":"진동 100에서만 다음 스킬 강화",sx,y+95);
  const skills=[["Q","단층 붕괴",player.terraQCooldown,TERRA_Q_COOLDOWN],["E","암벽 융기",player.terraECooldown,TERRA_E_COOLDOWN],["X","지각 압축",player.terraXCooldown,TERRA_X_COOLDOWN],["R",player.level<10?"10레벨 해금":"대륙 분쇄",player.terraRCooldown,TERRA_R_COOLDOWN]];
  skills.forEach((s,i)=>{const ix=x+w-325+i*78,iy=y+49,r=27,locked=i===3&&player.level<10;ctx.save();ctx.translate(ix,iy);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=s[2]>0||locked?"#292b25":"#25230f";ctx.fill();ctx.strokeStyle=s[2]>0||locked?"#64675d":"#cddc65";ctx.lineWidth=2;ctx.stroke();ctx.clip();if(terraSkillIconAtlas.complete&&terraSkillIconAtlas.naturalWidth){const sw=terraSkillIconAtlas.naturalWidth/2,sh=terraSkillIconAtlas.naturalHeight/2;ctx.globalAlpha=s[2]>0||locked?.3:1;ctx.drawImage(terraSkillIconAtlas,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,-r,-r,r*2,r*2);}ctx.restore();if(s[2]>0)drawCooldownCover(ix,iy,r,s[2]/s[3],s[2]);drawSkillHudLabel(ix,y+96,s[1],s[0],"#e7dfb7");});ctx.restore();
}

function drawVoidInterface(){if(selectedCharacter!=="void"||screenMode!=="game")return;const w=Math.min(690,canvas.width-32),h=120,x=(canvas.width-w)/2,y=canvas.height-178;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(7,5,15,.97)");g.addColorStop(.52,"rgba(35,10,58,.97)");g.addColorStop(1,"rgba(4,7,18,.97)");drawRoundedRect(x,y,w,h,24,g,"#a85cff",2);ctx.save();ctx.beginPath();ctx.arc(x+55,y+58,40,0,Math.PI*2);ctx.clip();ctx.fillStyle="#100718";ctx.fillRect(x+15,y+18,80,80);if(voidSpriteLoaded)ctx.drawImage(voidSprite,x+9,y+8,92,92);ctx.restore();ctx.strokeStyle="#bd73ff";ctx.shadowColor="#7f24ff";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x+55,y+58,40,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;const sx=x+108,max=100+player.voidCapacityLevel*20;ctx.textAlign="left";ctx.fillStyle="#f5eaff";ctx.font="bold 18px Arial";ctx.fillText("보이드",sx,y+28);ctx.fillStyle="#ca8cff";ctx.font="bold 13px Arial";ctx.fillText(`공허 질량 ${Math.floor(player.voidMass)} / ${max}`,sx,y+49);drawRoundedRect(sx,y+61,160,12,6,"rgba(255,255,255,.08)","rgba(188,100,255,.24)",1);if(player.voidMass>0){const bg=ctx.createLinearGradient(sx,0,sx+160,0);bg.addColorStop(0,"#43205c");bg.addColorStop(.7,"#a13be2");bg.addColorStop(1,"#eee3ff");drawRoundedRect(sx,y+61,160*Math.min(1,player.voidMass/max),12,6,bg);}ctx.fillStyle="#bfaaca";ctx.font="11px Arial";ctx.fillText(player.voidMass>=100?"특이점 준비 완료":"지면을 포식해 질량 획득",sx,y+95);const skills=[["Q","심층 포식",player.voidQCooldown,VOID_Q_COOLDOWN],["E","대지 방출",player.voidECooldown,VOID_E_COOLDOWN],["X","지반 붕괴",player.voidXCooldown,VOID_X_COOLDOWN],["R",player.level<10?"10레벨 해금":"제어 불능",player.voidRCooldown,VOID_R_COOLDOWN]];skills.forEach((s,i)=>{const ix=x+w-325+i*78,iy=y+49,r=27,locked=i===3&&(player.level<10||player.voidMass<100);ctx.save();ctx.translate(ix,iy);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=s[2]>0||locked?"#29252d":"#1b092b";ctx.fill();ctx.strokeStyle=s[2]>0||locked?"#645d69":"#be6cff";ctx.lineWidth=2;ctx.stroke();ctx.clip();if(voidSkillIconAtlas.complete&&voidSkillIconAtlas.naturalWidth){const sw=voidSkillIconAtlas.naturalWidth/2,sh=voidSkillIconAtlas.naturalHeight/2;ctx.globalAlpha=s[2]>0||locked?.3:1;ctx.drawImage(voidSkillIconAtlas,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,-r,-r,r*2,r*2);}ctx.restore();if(s[2]>0)drawCooldownCover(ix,iy,r,s[2]/s[3],s[2]);drawSkillHudLabel(ix,y+96,s[1],s[0],"#e5ccf2");});ctx.restore();}

function drawCarmillaInterface(){if(selectedCharacter!=="carmilla"||screenMode!=="game")return;const w=Math.min(560,canvas.width-32),h=112,x=(canvas.width-w)/2,y=canvas.height-170;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(15,5,10,.97)");g.addColorStop(.55,"rgba(76,7,25,.96)");g.addColorStop(1,"rgba(12,3,8,.97)");drawRoundedRect(x,y,w,h,23,g,"#ff315d",2);ctx.save();ctx.beginPath();ctx.arc(x+52,y+54,38,0,Math.PI*2);ctx.clip();if(carmillaSpriteLoaded)ctx.drawImage(carmillaSprite,x+10,y+8,84,84);ctx.restore();ctx.strokeStyle="#ff5373";ctx.beginPath();ctx.arc(x+52,y+54,38,0,Math.PI*2);ctx.stroke();const sx=x+102,need=Math.max(12,30-(player.carmillaResonanceLevel||0)*4);ctx.textAlign="left";ctx.fillStyle="#fff0f3";ctx.font="bold 18px Arial";ctx.fillText("카르밀라",sx,y+27);ctx.fillStyle="#ff6d89";ctx.font="bold 13px Arial";ctx.fillText(`혈월 ${Math.min(bloodDrops.length,need)} / ${need}`,sx,y+50);drawRoundedRect(sx,y+61,150,11,6,"rgba(255,255,255,.08)");drawRoundedRect(sx,y+61,150*Math.min(1,bloodDrops.length/need),11,6,"#d91643");ctx.fillStyle="#d7aebb";ctx.font="11px Arial";ctx.fillText(player.carmillaBloodMoonTime>0?`적월 ${Math.ceil(player.carmillaBloodMoonTime/60)}초`:`바닥의 피 ${bloodDrops.length}개`,sx,y+92);const ix=x+w-74,iy=y+48,r=30;ctx.save();ctx.beginPath();ctx.arc(ix,iy,r,0,Math.PI*2);ctx.clip();if(carmillaSkillIconAtlas.complete){const sw=carmillaSkillIconAtlas.naturalWidth/2,sh=carmillaSkillIconAtlas.naturalHeight/2;ctx.drawImage(carmillaSkillIconAtlas,0,0,sw,sh,ix-r,iy-r,r*2,r*2);}ctx.restore();if(player.carmillaQCooldown>0)drawCooldownCover(ix,iy,r,player.carmillaQCooldown/CARMILLA_Q_COOLDOWN,player.carmillaQCooldown);drawSkillHudLabel(ix,y+91,"피의 회수","Q","#ffd3dc");ctx.restore();}

function roundedRectPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawYupiterHudIcon(x, y, radius, image, ready, fillCrop = false) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  if (!fillCrop && ready) {
    const pulse = 0.5 + Math.sin(performance.now() * 0.0025) * 0.08;
    const backdrop = ctx.createRadialGradient(
      x - radius * 0.28, y - radius * 0.32, radius * 0.06,
      x, y, radius * 1.08
    );
    backdrop.addColorStop(0, "#dffbff");
    backdrop.addColorStop(0.2, `rgba(68,222,255,${pulse})`);
    backdrop.addColorStop(0.55, "#3340a5");
    backdrop.addColorStop(0.82, "#32115f");
    backdrop.addColorStop(1, "#090d25");
    ctx.fillStyle = backdrop;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(performance.now() * 0.00035);
    ctx.strokeStyle = "rgba(157,245,255,0.55)";
    ctx.lineWidth = Math.max(1.5, radius * 0.055);
    ctx.shadowColor = "#72eaff";
    ctx.shadowBlur = radius * 0.24;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, -0.45, 1.7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(210,145,255,0.48)";
    ctx.shadowColor = "#bd68ff";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.87, 2.4, 5.45);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let sparkle = 0; sparkle < 6; sparkle++) {
      const angle = sparkle * Math.PI / 3 + 0.35;
      const distance = radius * (0.55 + (sparkle % 2) * 0.2);
      const sparkleRadius = sparkle % 3 === 0 ? 1.8 : 1;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, sparkleRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = ready ? "#202536" : "#555861";
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.globalAlpha = ready ? 1 : 0.4;
    const padding = fillCrop ? 0 : radius * 0.25;
    ctx.drawImage(image, x - radius + padding, y - radius + padding, (radius - padding) * 2, (radius - padding) * 2);
  }
  ctx.restore();
  ctx.save();
  ctx.shadowColor = ready && !fillCrop ? "#82eaff" : "transparent";
  ctx.shadowBlur = ready && !fillCrop ? 14 : 0;
  ctx.strokeStyle = ready ? "#88dfff" : "#8a8d96";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCooldownCover(x, y, radius, ratio, frames) {
  ctx.save();
  ctx.fillStyle = "rgba(35,36,42,0.74)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, ratio)));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(14, radius * 0.48)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.ceil(frames / 60)}`, x, y);
  ctx.restore();
}

function drawSkillHudLabel(x, nameY, name, key, color = "#eadfc7") {
  ctx.fillStyle = color; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText(name, x, nameY);
  ctx.fillStyle = "#ffffff"; ctx.font = "900 11px Arial"; ctx.fillText(key, x, nameY + 13);
}

function drawYupiterHudLabel(x, y, text) {
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
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

let totalKillsSaveTimer = null;
function saveTotalKills() {
  if (totalKillsSaveTimer !== null) clearTimeout(totalKillsSaveTimer);
  totalKillsSaveTimer = setTimeout(flushTotalKills, 180);
}

function flushTotalKills() {
  totalKillsSaveTimer = null;
  try {
    localStorage.setItem("zombieSurvivalTotalKills", String(totalZombieKills));
  } catch (error) {
    // 저장소를 사용할 수 없는 환경에서는 현재 세션 값만 유지
  }
}

addEventListener("beforeunload", flushTotalKills);

function isSuncallUnlocked() {
  return true;
}

function isLuminousUnlocked() {
  return true;
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

function drawMenuBackdrop(alpha = 0.48) {
  ctx.fillStyle = "#050710";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (backgroundLoaded) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(
    canvas.width / 2, canvas.height * 0.42, 40,
    canvas.width / 2, canvas.height * 0.48, Math.max(canvas.width, canvas.height) * 0.72
  );
  vignette.addColorStop(0, "rgba(18, 25, 43, 0.02)");
  vignette.addColorStop(0.58, "rgba(4, 6, 15, 0.3)");
  vignette.addColorStop(1, "rgba(2, 3, 9, 0.94)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(
    canvas.width / 2, canvas.height * 0.36, 0,
    canvas.width / 2, canvas.height * 0.36, Math.min(canvas.width, canvas.height) * 0.58
  );
  glow.addColorStop(0, "rgba(88, 52, 154, 0.15)");
  glow.addColorStop(0.45, "rgba(19, 127, 153, 0.06)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(155, 190, 255, 0.035)";
  ctx.lineWidth = 1;
  for (let x = -canvas.height; x < canvas.width + canvas.height; x += 92) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + canvas.height, canvas.height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMenuButton(rect, hover, color, label, sublabel, glyph) {
  const lift = hover ? -3 : 0;
  const x = rect.x;
  const y = rect.y + lift;
  const gradient = ctx.createLinearGradient(x, y, x + rect.w, y + rect.h);
  gradient.addColorStop(0, hover ? "rgba(25,34,49,0.98)" : "rgba(12,18,31,0.96)");
  gradient.addColorStop(1, hover ? `${color}2e` : `${color}16`);

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = hover ? 28 : 12;
  drawRoundedRect(x, y, rect.w, rect.h, 13, gradient, hover ? color : `${color}bb`, hover ? 2.5 : 1.5);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 13, 3, rect.h - 26);

  ctx.beginPath();
  ctx.arc(x + 34, y + rect.h / 2, 17, 0, Math.PI * 2);
  ctx.fillStyle = `${color}22`;
  ctx.fill();
  ctx.strokeStyle = `${color}aa`;
  ctx.stroke();
  ctx.fillStyle = "#f5f7ff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(glyph, x + 34, y + rect.h / 2 + 6);

  ctx.textAlign = "left";
  ctx.fillStyle = "#f5f7ff";
  ctx.font = "bold 21px Arial";
  ctx.fillText(label, x + 64, y + 29);
  ctx.fillStyle = "rgba(220,228,246,0.62)";
  ctx.font = "12px Arial";
  ctx.fillText(sublabel, x + 64, y + 49);
  ctx.fillStyle = hover ? color : "rgba(255,255,255,0.42)";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("›", x + rect.w - 25, y + rect.h / 2 + 7);
  ctx.restore();
}

function drawHomeScreen() {
  drawMenuBackdrop(0.48);

  const centerX = canvas.width / 2;

  ctx.save();
  const contentW = Math.min(620, canvas.width - 48);
  const titleY = Math.max(150, canvas.height * 0.24);
  const centerShade = ctx.createLinearGradient(centerX - contentW, 0, centerX + contentW, 0);
  centerShade.addColorStop(0, "rgba(3,5,12,0)");
  centerShade.addColorStop(0.25, "rgba(3,5,12,0.3)");
  centerShade.addColorStop(0.5, "rgba(3,5,12,0.56)");
  centerShade.addColorStop(0.75, "rgba(3,5,12,0.3)");
  centerShade.addColorStop(1, "rgba(3,5,12,0)");
  ctx.fillStyle = centerShade;
  ctx.fillRect(centerX - contentW, titleY - 115, contentW * 2, 510);

  ctx.fillStyle = "#ff4d67";
  ctx.fillRect(centerX - 38, titleY - 73, 76, 3);
  ctx.fillStyle = "rgba(255,77,103,0.2)";
  ctx.fillRect(centerX - 78, titleY - 72, 156, 1);

  ctx.textAlign = "center";
  const titleGradient = ctx.createLinearGradient(centerX - 260, 0, centerX + 260, 0);
  titleGradient.addColorStop(0, "#dce8ff");
  titleGradient.addColorStop(0.5, "#ffffff");
  titleGradient.addColorStop(1, "#bea9e8");
  ctx.fillStyle = titleGradient;
  ctx.shadowColor = "rgba(145,180,255,0.28)";
  ctx.shadowBlur = 22;
  ctx.font = `900 ${Math.min(64, canvas.width * 0.052)}px Arial`;
  ctx.fillText("ZOMBIE SURVIVAL", centerX, titleY);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 12px Arial";
  ctx.letterSpacing = "4px";
  ctx.fillText("LAST NIGHT PROTOCOL", centerX, titleY + 32);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#bcaee8";
  ctx.font = "17px Arial";
  ctx.fillText("몰려오는 밤을 버티고, 증강으로 한계를 넘어라.", centerX, titleY + 67);

  homeStartRect = {
    x: centerX - Math.min(190, contentW / 2 - 42),
    y: titleY + 127,
    w: Math.min(380, contentW - 84),
    h: 70
  };

  homeCharacterRect = {
    x: homeStartRect.x,
    y: homeStartRect.y + 86,
    w: homeStartRect.w,
    h: 70
  };

  const startHover = pointInRect(mouse.x, mouse.y, homeStartRect);
  const charHover = pointInRect(mouse.x, mouse.y, homeCharacterRect);

  drawMenuButton(homeStartRect, startHover, "#22d9ff", "게임 시작", "선택한 캐릭터로 생존 시작", "▶");
  drawMenuButton(homeCharacterRect, charHover, "#b46cff", "캐릭터 선택", "생존자와 전투 방식을 변경", "◆");

  const selectedName = selectedCharacter === "default" ? "기본 캐릭터" : selectedCharacter === "suncall" ? "썬콜" : selectedCharacter === "luminous" ? "루미너스" : selectedCharacter === "yupiter" ? "유피테르" : selectedCharacter === "ren" ? "렌" : selectedCharacter === "nightLord" ? "나이트 로드" : selectedCharacter === "zero" ? "제로" : selectedCharacter === "paladin" ? "팔라딘" : selectedCharacter === "arc" ? "아크" : selectedCharacter === "terra" ? "테라" : "보이드";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  ctx.font = "12px Arial";
  ctx.fillText("현재 생존자", centerX, titleY + 334);
  ctx.fillStyle = "#dce9ff";
  ctx.font = "bold 16px Arial";
  ctx.fillText(selectedName, centerX, titleY + 358);

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(centerX - 245, canvas.height - 72);
  ctx.lineTo(centerX + 245, canvas.height - 72);
  ctx.stroke();
  ctx.fillStyle = "rgba(218,225,240,0.5)";
  ctx.font = "12px Arial";
  ctx.fillText("WASD 이동   ·   마우스 조준/공격   ·   SPACE 일시정지", centerX, canvas.height - 43);
  ctx.restore();

  ctx.textAlign = "left";
}

const characterSkillGuide = {
  default:{name:"기본 캐릭터",color:"#b05cff",passive:"안정적인 능력치로 총기와 공용 증강을 자유롭게 조합합니다.",skills:[["기본 공격","마우스 방향으로 총알을 발사합니다."],["R 재장전","탄창을 다시 채웁니다."]]},
  suncall:{name:"썬콜",color:"#48d8ff",passive:"이동속도가 15% 증가하며 공격 시 10% 확률로 둔화 얼음 지대를 만듭니다.",skills:[["기본 공격","빠른 총격으로 적을 공격하고 얼음 지대를 생성합니다."],["R 재장전","탄창을 다시 채웁니다."]]},
  luminous:{name:"루미너스",color:"#59e9ff",passive:"8개의 마력탄이 발사 순간 지정한 적을 자동 추적합니다.",skills:[["유도 마력탄","손끝에서 발사한 마력탄이 궤도를 휘어 적을 끝까지 추적합니다."]]},
  yupiter:{name:"유피테르",color:"#64ef91",passive:"Q로 반월검·절단검·화염포를 전환하며 각 무기마다 E와 R이 달라집니다.",skills:[["Q 무기 전환","세 무기를 순서대로 교체합니다."],["E 무기 기술","현재 무기의 강화 기술을 사용합니다."],["R 무기 궁극기","현재 무기에 맞는 강력한 궁극기를 사용합니다."]]},
  ren:{name:"렌",color:"#ff496f",passive:"그림자 조각을 흡수해 공격력을 높이고 분신을 강화합니다.",skills:[["Q 분신 배치","분신을 커서 방향의 제한 거리까지 내보냅니다."],["X 그림자 이동","가장 최근 분신 위치로 순간이동합니다."],["E 분신 습격","분신이 적을 찾아 강하게 습격합니다."],["R 그림자 지대","거대한 마법진을 펼쳐 적을 둔화하고 지속 피해를 줍니다."]]},
  nightLord:{name:"나이트 로드",color:"#a855f7",passive:"잃은 체력에 비례해 공격력이 증가하며 처형과 흡혈로 역전합니다.",skills:[["Q 그림자 추격","적에게 파고들어 베고 잠시 공격속도가 증가합니다."],["E 광란","현재 체력을 대가로 연속 참격을 사용합니다."],["X 처형","기준 이하 체력의 적을 마무리합니다."],["R 불사의 밤","체력이 1 아래로 내려가지 않는 강화 상태가 됩니다."]]},
  zero:{name:"제로",color:"#ffd85a",passive:"평타 적중으로 Q·E·X의 쿨타임을 줄이며 후반으로 갈수록 검술 피해가 증가합니다.",skills:[["Q 참격","짧게 돌진해 전방의 적을 찌릅니다."],["E 급소","평타를 강화하고 다음 강화 평타를 적중할 때까지 보존합니다."],["X 심판","원형 지역에 다수의 칼을 쏟아붓습니다."],["R 검의 왈츠","가까운 적부터 연속으로 빠르게 베어냅니다."]]},
  paladin:{name:"팔라딘",color:"#ffe48b",passive:"공격과 반격으로 콤보를 쌓아 성검의 공격 방식과 파동을 해방합니다.",skills:[["Q 성스러운 반격","방어 중 받은 피해를 무효화하고 넓게 반격합니다."],["E 연속 절단","전방을 빠르게 여러 번 베어 콤보를 쌓습니다."],["X 콤보 전환","현재 콤보 단계의 성검 공격을 사용합니다."],["R 한계 돌파","10레벨부터 최고 콤보 상태와 강화된 반격을 사용합니다."]]},
  arc:{name:"아크",color:"#ff8b32",passive:"광역 평타로 열기를 얻고 스킬 사용 시 열기를 소모해 위력을 높입니다.",skills:[["Q 일륜","원형 화염장을 펼쳐 적을 중앙으로 끌어당깁니다."],["E 홍염 파동","전방 넓은 범위를 강한 화염으로 휩씁니다."],["X 태양 낙하","지정 위치에 태양을 떨어뜨려 폭발시킵니다."],["R 초신성","10레벨부터 저장된 화염과 열기를 폭발시킵니다."]]},
  terra:{name:"테라",color:"#c5d965",passive:"평타로 진동을 모으며 진동 100에서만 스킬이 강화됩니다.",skills:[["Q 단층 붕괴","지면 균열로 적을 중앙에 모은 뒤 폭발시킵니다."],["E 암벽 융기","부서질 때까지 유지되는 실제 암석을 생성합니다."],["X 지각 압축","바위를 사방으로 파쇄해 넓은 범위를 공격합니다."],["R 대륙 분쇄","직사각형 지각을 붕괴시키고 추가 바위를 생성합니다."]]},
  void:{name:"보이드",color:"#b665ff",passive:"지면과 적을 포식해 질량을 모으고 스킬 크기와 위력을 높입니다.",skills:[["Q 심층 포식","전방을 포식하고 적을 중심으로 끌어당깁니다."],["E 대지 방출","모든 질량을 소모해 직사각형 공허 지대를 만듭니다."],["X 지반 붕괴","설치된 지대를 폭파시켜 큰 피해를 줍니다."],["R 제어 불능","적을 공격 불가 상태로 빨아들이는 거대한 특이점을 만듭니다."]]},
  carmilla:{name:"카르밀라",color:"#ff315d",passive:"공격한 자리에 핏방울을 남기고 회수해 회복과 혈월을 개방합니다.",skills:[["기본 공격","전방을 세 갈래 혈조로 베어 핏방울을 남깁니다."],["Q 피의 회수","바닥의 모든 핏방울을 되돌려 경로의 적을 공격하고 회복합니다."]]},
};

function getCharacterPreviewSprite(id){return id==="default"?playerSprite:id==="suncall"?suncallSprite:id==="luminous"?luminousSprite:id==="yupiter"?yupiterSprite:id==="ren"?renSprite:id==="nightLord"?nightLordSprite:id==="zero"?zeroSprite:id==="paladin"?paladinSprite:id==="arc"?arcSprite:id==="terra"?terraSprite:id==="void"?voidSprite:carmillaSprite;}

const characterSkillVideoKeys = {
  default:["attack","reload"], suncall:["attack","reload"], luminous:["attack"],
  yupiter:["q","e","r"], ren:["q","x","e","r"], nightLord:["q","e","x","r"],
  zero:["q","e","x","r"], paladin:["q","e","x","r"], arc:["q","e","x","r"],
  terra:["q","e","x","r"], void:["q","e","x","r"], carmilla:["attack","q"]
};
const characterSkillVideoCache = new Map();
function getCharacterSkillVideo(id, skillIndex) {
  const key = characterSkillVideoKeys[id]?.[skillIndex];
  if (!key) return null;
  const path = `assets/skill-videos/${id}-${key}.webm`;
  if (!characterSkillVideoCache.has(path)) {
    const video = document.createElement("video");
    video.src = path;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    characterSkillVideoCache.set(path, video);
  }
  return characterSkillVideoCache.get(path);
}

function drawCharacterGameplayPreview(id,skillIndex,skillName,x,y,w,h,color){
  const video=getCharacterSkillVideo(id,skillIndex);
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.clip();ctx.fillStyle="#070911";ctx.fillRect(x,y,w,h);
  if(video){
    if(video.dataset.openedAt!==String(characterDetailOpenedAt)){video.dataset.openedAt=String(characterDetailOpenedAt);video.currentTime=0;video.play().catch(()=>{});}
    if(video.readyState>=2){
      // 스킬 전체 범위가 잘리지 않도록 확대 크롭 대신 레터박스 방식으로 맞춘다.
      const scale=Math.min(w/video.videoWidth,h/video.videoHeight),dw=video.videoWidth*scale,dh=video.videoHeight*scale;
      ctx.drawImage(video,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
    } else {ctx.fillStyle="#aab8d0";ctx.font="bold 15px Arial";ctx.textAlign="center";ctx.fillText("실제 플레이 영상 불러오는 중…",x+w/2,y+h/2);}
  }
  const shade=ctx.createLinearGradient(0,y+h-58,0,y+h);shade.addColorStop(0,"rgba(4,7,14,0)");shade.addColorStop(1,"rgba(4,7,14,.9)");ctx.fillStyle=shade;ctx.fillRect(x,y+h-58,w,58);
  ctx.fillStyle="#d9e5fa";ctx.font="bold 11px Arial";ctx.textAlign="left";ctx.fillText(`RECORDED GAMEPLAY  ·  ${skillName}`,x+13,y+h-13);ctx.restore();
  drawRoundedRect(x,y,w,h,18,"rgba(0,0,0,0)",`${color}aa`,2);
}

function drawCharacterDetailOverlay(){
  if(!characterDetailId)return;const info=characterSkillGuide[characterDetailId]||characterSkillGuide.default;
  ctx.save();ctx.fillStyle="rgba(2,4,10,.88)";ctx.fillRect(0,0,canvas.width,canvas.height);
  const w=Math.min(1040,canvas.width-36),h=Math.min(650,canvas.height-40),x=(canvas.width-w)/2,y=(canvas.height-h)/2;const panel=ctx.createLinearGradient(x,y,x+w,y+h);panel.addColorStop(0,"rgba(15,21,36,.99)");panel.addColorStop(1,"rgba(7,9,18,.99)");drawRoundedRect(x,y,w,h,24,panel,info.color,2);
  characterDetailCloseRect={x:x+w-58,y:y+14,w:42,h:42};drawRoundedRect(characterDetailCloseRect.x,characterDetailCloseRect.y,42,42,12,"rgba(255,255,255,.06)","rgba(255,255,255,.18)",1);ctx.fillStyle="#fff";ctx.font="bold 24px Arial";ctx.textAlign="center";ctx.fillText("×",characterDetailCloseRect.x+21,characterDetailCloseRect.y+29);
  ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="900 32px Arial";ctx.fillText(info.name,x+30,y+47);ctx.fillStyle=info.color;ctx.font="bold 13px Arial";ctx.fillText("우클릭 상세 정보  ·  ESC 또는 × 닫기",x+30,y+70);
  const previewW=Math.min(540,w*.54),previewH=Math.min(440,h-120);const activeSkill=info.skills[Math.min(characterDetailSkillIndex,info.skills.length-1)];drawCharacterGameplayPreview(characterDetailId,characterDetailSkillIndex,activeSkill[0],x+26,y+92,previewW,previewH,info.color);
  const tx=x+previewW+52,tw=w-previewW-80;ctx.fillStyle="#f3f6ff";ctx.font="bold 18px Arial";ctx.fillText("패시브",tx,y+108);ctx.fillStyle="#b9c5d8";ctx.font="14px Arial";wrapTextLeft(info.passive,tx,y+136,tw,22);
  characterDetailSkillRects=[];let sy=y+202;for(let i=0;i<info.skills.length;i++){const skill=info.skills[i],selected=i===characterDetailSkillIndex,rect={x:tx,y:sy,w:tw,h:72};characterDetailSkillRects.push(rect);const hover=pointInRect(mouse.x,mouse.y,rect);drawRoundedRect(tx,sy,tw,72,12,selected?`${info.color}24`:(hover?"rgba(255,255,255,.075)":"rgba(255,255,255,.035)"),selected?info.color:`${info.color}55`,selected?2:1);ctx.fillStyle=info.color;ctx.font="bold 15px Arial";ctx.fillText(`${selected?"▶ ":""}${skill[0]}`,tx+14,sy+23);ctx.fillStyle="#c9d2e2";ctx.font="13px Arial";wrapTextLeft(skill[1],tx+14,sy+46,tw-28,18);sy+=82;}
  ctx.restore();
}

function drawCharacterSelectScreen() {
  drawMenuBackdrop(0.2);
  const centerX = canvas.width / 2;
  const headerGlow = ctx.createRadialGradient(centerX, 65, 0, centerX, 65, 350);
  headerGlow.addColorStop(0, "rgba(122,88,206,0.22)");
  headerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = headerGlow;
  ctx.fillRect(0, 0, canvas.width, 210);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f3f6ff";
  ctx.shadowColor = "rgba(171,133,255,0.45)";
  ctx.shadowBlur = 18;
  ctx.font = `900 ${Math.min(46, Math.max(31, canvas.width * 0.066))}px Arial`;
  ctx.fillText("생존자 선택", centerX, 61);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = "12px Arial";
  ctx.fillText("SELECT YOUR SURVIVOR", centerX, 84);
  drawRoundedRect(centerX - 94, 98, 188, 30, 15, "rgba(10,14,27,0.82)", "rgba(152,175,220,0.22)", 1);
  ctx.fillStyle = "#c8d5ec";
  ctx.font = "bold 13px Arial";
  ctx.fillText(`☠  누적 처치  ${totalZombieKills.toLocaleString()}`, centerX, 118);

  const gap = Math.max(10, Math.min(22, canvas.width * 0.014));
  const maxCardsPerRow = 3;
  const characterIds = ["default", "suncall", "luminous", "yupiter", "ren", "nightLord", "zero", "paladin", "arc", "terra", "void","carmilla"];
  const cardW = Math.min(200, (canvas.width - 48 - gap * (maxCardsPerRow - 1)) / maxCardsPerRow);
  const y = 151;
  const rowCount = Math.ceil(characterIds.length / maxCardsPerRow);
  const cardH = 390;
  const contentHeight = rowCount * cardH + (rowCount - 1) * gap;
  characterScrollMax = Math.max(0, contentHeight - (canvas.height - y - 18));
  characterScrollY = Math.max(0, Math.min(characterScrollMax, characterScrollY));
  const rowStartX = centerX - (cardW * maxCardsPerRow + gap * (maxCardsPerRow - 1)) / 2;
  characterCards = characterIds.map((id, index) => {
    const row = Math.floor(index / maxCardsPerRow);
    const column = index % maxCardsPerRow;
    return {
      id,
      x: rowStartX + (cardW + gap) * column,
      y: y + row * (cardH + gap) - characterScrollY,
      w: cardW,
      h: cardH
    };
  });

  const themes = {
    default: { color: "#b05cff", color2: "#6237b9", role: "BALANCED", number: "01" },
    suncall: { color: "#48d8ff", color2: "#2469c7", role: "MOBILITY", number: "02" },
    luminous: { color: "#f0c65a", color2: "#3ecdf3", role: "HOMING MAGE", number: "03" },
    yupiter: { color: "#64ef91", color2: "#148b69", role: "WEAPON MASTER", number: "04" },
    ren: { color: "#ff496f", color2: "#6e36c8", role: "SHADOW ASSASSIN", number: "05" },
    nightLord: { color: "#a855f7", color2: "#3b1769", role: "DARK SLAYER", number: "06" },
    zero: { color: "#ffd85a", color2: "#bf342f", role: "SWORD DANCER", number: "07" },
    paladin: { color: "#ffe48b", color2: "#315a94", role: "COMBO KNIGHT", number: "08" },
    arc: { color: "#ff8b32", color2: "#7d1e12", role: "SOLAR MAGE", number: "09" },
    terra: { color: "#c5d965", color2: "#526b2d", role: "EARTH BREAKER", number: "10" },
    void: { color: "#b665ff", color2: "#32104f", role: "VOID DEVOURER", number: "11" },carmilla:{color:"#ff315d",color2:"#5c071d",role:"TRUE VAMPIRE",number:"12"}
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - 8, canvas.width, canvas.height - y + 8);
  ctx.clip();
  for (const card of characterCards) {
    const cardScale = 1;
    if (card.y + card.h < y - 8 || card.y > canvas.height) continue;
    const isSelected = selectedCharacter === card.id;
    const unlocked = card.id === "default" || card.id === "yupiter" || card.id === "ren" || card.id === "nightLord" || card.id === "zero" || card.id === "paladin" || card.id === "arc" || card.id === "terra" || card.id === "void"||card.id==="carmilla" || (card.id === "suncall" ? isSuncallUnlocked() : isLuminousUnlocked());
    const hover = pointInRect(mouse.x, mouse.y, card);
    const theme = themes[card.id];
    const displayY = card.y + (hover && unlocked ? -7 : 0);
    const stroke = unlocked ? (isSelected ? theme.color : `${theme.color}9a`) : "#4c5261";
    const cardGradient = ctx.createLinearGradient(card.x, displayY, card.x + card.w, displayY + card.h);
    cardGradient.addColorStop(0, unlocked ? "rgba(18,23,38,0.98)" : "rgba(12,14,21,0.98)");
    cardGradient.addColorStop(0.58, unlocked ? `${theme.color2}20` : "rgba(25,27,34,0.6)");
    cardGradient.addColorStop(1, "rgba(7,9,17,0.98)");

    ctx.save();
    ctx.shadowColor = stroke;
    ctx.shadowBlur = isSelected ? 28 : (hover && unlocked ? 20 : 7);
    drawRoundedRect(card.x, displayY, card.w, card.h, 18, cardGradient, stroke, isSelected ? 3 : 1.5);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect(card.x + 1, displayY + 1, card.w - 2, 205 * cardScale, [17, 17, 0, 0]);
    ctx.clip();
    const portraitGlow = ctx.createRadialGradient(card.x + card.w / 2, displayY + 118, 5, card.x + card.w / 2, displayY + 118, card.w * 0.68);
    portraitGlow.addColorStop(0, unlocked ? `${theme.color}3d` : "rgba(70,74,84,0.18)");
    portraitGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = portraitGlow;
    ctx.fillRect(card.x, displayY, card.w, 205 * cardScale);
    ctx.restore();

    ctx.fillStyle = unlocked ? `${theme.color}dd` : "#646a76";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(theme.number, card.x + 17, displayY + 25);
    if (card.w >= 145) {
      ctx.textAlign = "right";
      ctx.fillText(theme.role, card.x + card.w - 16, displayY + 25);
    }
    ctx.textAlign = "center";

    const sprite = card.id === "default" ? playerSprite : card.id === "suncall" ? suncallSprite : card.id === "luminous" ? luminousSprite : card.id === "yupiter" ? yupiterSprite : card.id === "ren" ? renSprite : card.id === "nightLord" ? nightLordSprite : card.id === "zero" ? zeroSprite : card.id === "paladin" ? paladinSprite : card.id === "arc" ? arcSprite : card.id === "terra" ? terraSprite :card.id==="void"?voidSprite:carmillaSprite;
    const loaded = card.id === "default" ? playerSpriteLoaded : card.id === "suncall" ? suncallSpriteLoaded : card.id === "luminous" ? luminousSpriteLoaded : card.id === "yupiter" ? yupiterSpriteLoaded : card.id === "ren" ? renSpriteLoaded : card.id === "nightLord" ? nightLordSpriteLoaded : card.id === "zero" ? zeroSpriteLoaded : card.id === "paladin" ? paladinSpriteLoaded : card.id === "arc" ? arcSpriteLoaded : card.id === "terra" ? terraSpriteLoaded :card.id==="void"?voidSpriteLoaded:carmillaSpriteLoaded;
    if (loaded) {
      ctx.save();
      if (!unlocked) ctx.globalAlpha = 0.24;
      const maxSpriteW = Math.max(42, card.w - (card.w < 110 ? 16 : 60));
      const maxSpriteH = (card.w < 110 ? 150 : 205) * cardScale;
      const spriteScale = Math.min(maxSpriteW / sprite.naturalWidth, maxSpriteH / sprite.naturalHeight);
      const spriteW = sprite.naturalWidth * spriteScale;
      const spriteH = sprite.naturalHeight * spriteScale;
      ctx.shadowColor = unlocked ? theme.color : "transparent";
      ctx.shadowBlur = unlocked ? 16 : 0;
      ctx.drawImage(sprite, card.x + (card.w - spriteW) / 2, displayY + 28 * cardScale + (maxSpriteH - spriteH) / 2, spriteW, spriteH);
      ctx.restore();
    }

    const name = card.id === "default" ? "기본 캐릭터" : card.id === "suncall" ? "썬콜" : card.id === "luminous" ? "루미너스" : card.id === "yupiter" ? "유피테르" : card.id === "ren" ? "렌" : card.id === "nightLord" ? "나이트 로드" : card.id === "zero" ? "제로" : card.id === "paladin" ? "팔라딘" : card.id === "arc" ? "아크" : card.id === "terra" ? "테라" :card.id==="void"?"보이드":"카르밀라";
    const passive = card.id === "default" ? "기본 능력치" : card.id === "suncall" ? "패시브: 이동속도 +15% · 공격 시 10% 확률로 얼음 지대 생성" : card.id === "luminous" ? "패시브: 총알이 자동으로 적을 추적" : card.id === "yupiter" ? "패시브: 3가지 무기를 골라서 사용" : card.id === "ren" ? "패시브: 그림자를 수집해 분신 강화" : card.id === "nightLord" ? "패시브: 잃은 체력에 비례해 공격 강화" : card.id === "zero" ? "패시브: 레벨당 검술 피해 +4% · 평타 적중 시 스킬 쿨타임 감소" : card.id === "paladin" ? "패시브: 콤보에 따라 성검과 공격 방식이 해방" : card.id === "arc" ? "패시브: 다수 적중 시 열기를 모아 태양 기술 강화" : card.id === "terra" ? "패시브: 평타 다중 적중으로 진동을 모아 지형 스킬 강화" : card.id === "void" ? "패시브: 지면을 삼켜 공허 질량으로 변환" : "패시브: 피를 남기고 회수해 혈월을 개방";
    ctx.fillStyle = unlocked ? "#f4f7ff" : "#777d88";
    ctx.font = `bold ${Math.max(12, (card.w < 145 ? 16 : 23) * Math.min(1, cardScale + .12))}px Arial`;
    ctx.fillText(name, card.x + card.w / 2, displayY + 252 * cardScale);
    ctx.fillStyle = unlocked ? theme.color : "#59606d";
    ctx.fillRect(card.x + card.w / 2 - 18, displayY + 266 * cardScale, 36, 2);
    ctx.font = `${Math.max(8, (card.w < 145 ? 11 : 14) * Math.min(1, cardScale + .18))}px Arial`;
    ctx.fillStyle = unlocked ? "#b7c7df" : "#747985";
    wrapText(passive, card.x + card.w / 2, displayY + 291 * cardScale, card.w - 26, Math.max(10, 18 * cardScale));

    if (unlocked) {
      ctx.fillStyle="rgba(218,226,242,.52)";ctx.font="bold 10px Arial";ctx.fillText("우클릭: 스킬 보기",card.x+card.w/2,displayY+326*cardScale);
      drawRoundedRect(card.x + 22, displayY + 339 * cardScale, card.w - 44, Math.max(20, 31 * cardScale), 15, isSelected ? `${theme.color}28` : "rgba(255,255,255,0.035)", isSelected ? theme.color : "rgba(255,255,255,0.12)", 1);
      ctx.fillStyle = isSelected ? theme.color : "rgba(224,231,244,0.62)";
      ctx.font = `bold ${card.w < 145 ? 10 : 13}px Arial`;
      ctx.fillText(isSelected ? "✓  현재 선택됨" : "선택하기", card.x + card.w / 2, displayY + 360 * cardScale);
    } else {
      const unlockKills = card.id === "luminous" ? 1000 : 200;
      const remaining = Math.max(0, unlockKills - totalZombieKills);
      const progress = Math.min(1, totalZombieKills / unlockKills);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(card.x + 21, displayY + 336 * cardScale, card.w - 42, 4);
      ctx.fillStyle = "#ff657e";
      ctx.fillRect(card.x + 21, displayY + 336 * cardScale, (card.w - 42) * progress, 4);
      ctx.fillStyle = "#e0798b";
      ctx.font = `bold ${card.w < 145 ? 9 : (card.w < 210 ? 12 : 13)}px Arial`;
      ctx.fillText(`🔒 ${remaining} 처치 남음`, card.x + card.w / 2, displayY + 360 * cardScale);
    }
  }
  ctx.restore();

  if (characterScrollMax > 0) {
    const trackY = y, trackH = canvas.height - y - 18;
    const thumbH = Math.max(48, trackH * trackH / contentHeight);
    const thumbY = trackY + (trackH - thumbH) * characterScrollY / characterScrollMax;
    drawRoundedRect(canvas.width - 13, trackY, 5, trackH, 3, "rgba(255,255,255,.08)");
    drawRoundedRect(canvas.width - 13, thumbY, 5, thumbH, 3, "rgba(174,132,255,.72)");
  }

  const compactSelect = canvas.width < 760;
  characterBackRect = { x: compactSelect ? 18 : 28, y: compactSelect ? 18 : 28, w: compactSelect ? 112 : 180, h: compactSelect ? 42 : 54 };
  const backHover = pointInRect(mouse.x, mouse.y, characterBackRect);
  ctx.save();
  ctx.shadowColor = backHover ? "#8b7cff" : "transparent";
  ctx.shadowBlur = 16;
  drawRoundedRect(characterBackRect.x, characterBackRect.y, characterBackRect.w, characterBackRect.h, 12, backHover ? "rgba(35,37,58,0.96)" : "rgba(13,17,29,0.9)", backHover ? "#9d8cff" : "rgba(210,220,240,0.45)", backHover ? 2 : 1);
  ctx.restore();
  ctx.fillStyle = backHover ? "#ffffff" : "#d6ddea";
  ctx.font = `bold ${compactSelect ? 13 : 16}px Arial`;
  ctx.fillText("←  홈으로", characterBackRect.x + characterBackRect.w / 2, characterBackRect.y + (compactSelect ? 27 : 34));
  ctx.textAlign = "left";
  drawCharacterDetailOverlay();
}

function drawPauseButton() {
  if (screenMode !== "game") return;

  pauseButtonRect = paused
    ? {
        x: canvas.width / 2 - 110,
        y: 138 + Math.min(545, canvas.height - 190) - 62,
        w: 220,
        h: 44
      }
    : { x: canvas.width - 74, y: 18, w: 54, h: 54 };

  const hover = pointInRect(mouse.x, mouse.y, pauseButtonRect);

  drawRoundedRect(
    pauseButtonRect.x,
    pauseButtonRect.y,
    pauseButtonRect.w,
    pauseButtonRect.h,
    paused ? 11 : 12,
    hover ? "rgba(50,50,70,0.96)" : "rgba(20,20,30,0.88)",
    paused ? "#b967ff" : "white",
    hover ? 3 : 2
  );

  ctx.fillStyle = "white";
  ctx.font = paused ? "bold 18px Arial" : "bold 25px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    paused ? "게임 재개" : "Ⅱ",
    pauseButtonRect.x + pauseButtonRect.w / 2,
    pauseButtonRect.y + (paused ? 29 : 36)
  );
  ctx.textAlign = "left";
}

function getSelectedAugmentDisplayName(item) {
  const upgrade = upgrades.find(u => u.id === item.id);
  if (!upgrade) return item.name;

  const isCombat = upgrade.category === "combat" || upgrade.singleChoice === true;
  const isTranscended = !isCombat && item.count >= 4 && upgrade.transcendName;

  return isTranscended ? upgrade.transcendName : upgrade.name;
}

function getSelectedAugmentDescription(item) {
  const upgrade = upgrades.find(u => u.id === item.id);
  if (!upgrade) return "설명 정보가 없습니다.";
  const isTranscended =
    upgrade.category !== "combat" &&
    upgrade.category !== "emerald" &&
    item.count >= 4 &&
    upgrade.transcendDesc;
  return isTranscended ? upgrade.transcendDesc : upgrade.desc;
}

function drawPauseOverlay() {
  if (!paused || screenMode !== "game") return;
  pauseAugmentCardRects = [];

  ctx.fillStyle = "rgba(0,0,0,0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 64px Arial";
  ctx.fillText("PAUSED", canvas.width / 2, 82);

  ctx.fillStyle = "#b967ff";
  ctx.font = "18px Arial";
  ctx.fillText("아래 게임 재개 버튼을 누르면 계속됩니다.", canvas.width / 2, 116);

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
  ctx.fillStyle = "rgba(205,210,225,0.62)";
  ctx.font = "12px Arial";
  ctx.fillText("증강을 클릭하면 상세 설명을 볼 수 있습니다.", canvas.width / 2, panelY + 57);

  const listTop = panelY + 70;
  const selectedPauseItem = selectedAugments.find(item => item.id === selectedPauseAugmentId);
  const listBottom = panelY + panelH - (selectedPauseItem ? 180 : 82);
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
      const cardHovered = pointInRect(mouse.x, mouse.y, { x, y, w: cardW, h: cardH });
      const cardSelected = selectedPauseAugmentId === item.id;
      pauseAugmentCardRects.push({ id: item.id, x, y, w: cardW, h: cardH });

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
      ctx.shadowBlur = cardHovered || cardSelected ? glow + 12 : glow;

      drawRoundedRect(
        x,
        y,
        cardW,
        cardH,
        9,
        cardSelected ? "rgba(255,255,255,0.16)" : (cardHovered ? "rgba(255,255,255,0.11)" : fill),
        stroke,
        cardSelected ? 3 : 2
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

  if (selectedPauseItem) {
    const detailX = panelX + 20;
    const detailY = panelY + panelH - 166;
    const detailW = panelW - 40;
    const detailH = 88;
    const detailUpgrade = upgrades.find(u => u.id === selectedPauseItem.id);
    const detailTranscended = detailUpgrade && detailUpgrade.category !== "combat" && detailUpgrade.category !== "emerald" && selectedPauseItem.count >= 4;
    const detailStroke = detailTranscended ? "#ffd700" : (selectedPauseItem.category === "combat" ? "#00e5ff" : selectedPauseItem.category === "emerald" ? "#00ff88" : "#aeb3bd");

    ctx.save();
    ctx.shadowColor = detailStroke;
    ctx.shadowBlur = detailTranscended ? 18 : 8;
    drawRoundedRect(detailX, detailY, detailW, detailH, 12, "rgba(5,7,14,0.96)", detailStroke, 2);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.fillStyle = detailStroke;
    ctx.font = "bold 17px Arial";
    ctx.fillText(getSelectedAugmentDisplayName(selectedPauseItem), detailX + 18, detailY + 27);
    ctx.fillStyle = "rgba(240,243,252,0.88)";
    ctx.font = "14px Arial";
    wrapTextLeft(getSelectedAugmentDescription(selectedPauseItem), detailX + 18, detailY + 52, detailW - 36, 19);
  }

  pauseHomeButtonRect = {
    x: canvas.width - 74,
    y: 18,
    w: 54,
    h: 54
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
    12,
    homeHover ? "#4a1622" : "#2e1118",
    "#ff5f7a",
    homeHover ? 4 : 2
  );

  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.font = "bold 25px Arial";
  ctx.fillText(
    "⌂",
    pauseHomeButtonRect.x + pauseHomeButtonRect.w / 2,
    pauseHomeButtonRect.y + 36
  );

  ctx.textAlign = "left";
}

function drawUpgradeMenu() {
  if (!choosingUpgrade) return;
  upgradeAnimTime++;
  upgradeCardRects = [];

  ctx.fillStyle = "rgba(2,5,13,0.91)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const haze = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.45, 40, canvas.width / 2, canvas.height * 0.45, canvas.width * 0.55);
  haze.addColorStop(0, "rgba(49,72,125,0.24)");
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f7e8b2";
  ctx.shadowColor = "rgba(255,211,105,0.6)";
  ctx.shadowBlur = 18;
  ctx.font = "bold 36px Arial";
  ctx.fillText("증강 선택", canvas.width / 2, 72);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(225,235,255,0.76)";
  ctx.font = "15px Arial";
  ctx.fillText(
    player.level >= 5 && player.level % 5 === 0
      ? "전투 증강 · 하나를 선택해 즉시 활성화하세요"
      : "보조 증강 · 하나를 선택해 생존 능력을 강화하세요",
    canvas.width / 2,
    103
  );

  const gap = Math.max(14, Math.min(30, canvas.width * 0.02));
  const cardW = Math.min(300, (canvas.width - 56 - gap * 2) / 3);
  const cardH = Math.min(410, canvas.height - 170);
  const totalW = cardW * upgradeChoices.length + gap * Math.max(0, upgradeChoices.length - 1);
  const startX = canvas.width / 2 - totalW / 2;
  const baseY = 126 + Math.max(0, (canvas.height - 126 - cardH) / 2 - 12);

  for (let i = 0; i < upgradeChoices.length; i++) {
    const u = upgradeChoices[i], count = upgradeCount[u.id] || 0;
    const isSkillUpgrade = u.category === "combat" || u.singleChoice === true;
    const isTranscendReady = !isSkillUpgrade && count >= 3 && Boolean(u.transcendName);
    const title = isTranscendReady && u.transcendName ? u.transcendName : u.name;
    const desc = isTranscendReady && u.transcendDesc ? u.transcendDesc : (typeof u.getDesc === "function" ? u.getDesc() : u.desc);
    const x = startX + i * (cardW + gap);
    const revealProgress = Math.max(0, Math.min(1, (upgradeAnimTime - 18 - i * 3) / 28));
    const revealEase = 1 - Math.pow(1 - revealProgress, 3);
    const settledY = baseY + Math.sin((upgradeAnimTime + i * 12) * 0.045) * 3;
    const y = settledY - (baseY + cardH + 30) * (1 - revealEase);
    const hovered = mouse.x >= x && mouse.x <= x + cardW && mouse.y >= y && mouse.y <= y + cardH;
    upgradeCardRects.push(
      upgradeAnimTime >= 18 && revealProgress > 0.25
        ? { x, y, w: cardW, h: cardH }
        : { x: -9999, y: -9999, w: 0, h: 0 }
    );
    let stroke = "#8f96a3", accent = "#d5d8de", fillTop = "#292b31", fillMiddle = "#1b1c21", fillBottom = "#101116", glow = 7;
    if (u.category === "combat") { stroke = "#47dcec"; accent = "#8cf5ff"; fillTop = "#102b42"; fillMiddle = "#0b1c2b"; fillBottom = "#07101d"; glow = 20; }
    if (u.category === "emerald") { stroke = "#35e89a"; accent = "#8affc9"; fillTop = "#10382d"; fillMiddle = "#0a251d"; fillBottom = "#061710"; glow = 23; }
    if (isTranscendReady && !isSkillUpgrade) { stroke = "#ffe16b"; accent = "#fff6bd"; fillTop = "#72510b"; fillMiddle = "#3f2a05"; fillBottom = "#170d00"; glow = 38; }

    ctx.save();
    const selectionActive = upgradeSelectionEffect !== null;
    const selectedForEffect = selectionActive && upgradeSelectionEffect.index === i;
    ctx.globalAlpha = revealProgress * (selectionActive && !selectedForEffect ? 0.32 : 1);
    if (selectedForEffect) {
      ctx.filter = `blur(${Math.min(2.4, upgradeSelectionEffect.time * 0.11)}px)`;
    }
    if (isTranscendReady && !isSkillUpgrade) {
      drawTranscendAurora(x, y, cardW, cardH, i);
      ctx.save();
      ctx.shadowColor = "#ffd928";
      ctx.shadowBlur = 30 + Math.sin(upgradeAnimTime * 0.1 + i) * 8;
      drawRoundedRect(x - 4, y - 4, cardW + 8, cardH + 8, 23, null, "rgba(255,223,75,0.9)", 3);
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = stroke;
    ctx.shadowBlur = hovered ? glow + 13 : glow;
    const cardGradient = ctx.createLinearGradient(x, y, x, y + cardH);
    cardGradient.addColorStop(0, fillTop);
    cardGradient.addColorStop(0.55, fillMiddle);
    cardGradient.addColorStop(1, fillBottom);
    drawRoundedRect(x, y, cardW, cardH, 20, cardGradient, stroke, hovered ? 4 : 2.5);
    ctx.shadowBlur = 0;
    drawRoundedRect(x + 7, y + 7, cardW - 14, cardH - 14, 15, null, "rgba(255,255,255,0.13)", 1);
    ctx.restore();

    if (hovered) {
      ctx.save();
      ctx.globalAlpha = 0.11;
      drawRoundedRect(x + 3, y + 3, cardW - 6, cardH - 6, 17, "white");
      ctx.restore();
    }

    const badgeW = Math.min(118, cardW - 44);
    drawRoundedRect(x + cardW / 2 - badgeW / 2, y + 18, badgeW, 26, 13, "rgba(0,0,0,0.42)", stroke, 1);
    ctx.fillStyle = accent;
    ctx.font = "bold 12px Arial";
    ctx.fillText(u.category === "emerald" ? "에메랄드" : (u.category === "combat" ? "전투 증강" : (isTranscendReady ? "초월 증강" : "보조 증강")), x + cardW / 2, y + 36);

    const iconSize = Math.min(124, cardW * 0.46, cardH * 0.32);
    const iconX = x + cardW / 2 - iconSize / 2;
    const iconY = y + 57;
    ctx.save();
    ctx.shadowColor = stroke;
    ctx.shadowBlur = hovered ? 24 : 14;
    ctx.beginPath();
    ctx.arc(x + cardW / 2, iconY + iconSize / 2, iconSize * 0.49, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(3,6,14,0.78)";
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    drawAugmentIcon(u.id, iconX + 6, iconY + 6, iconSize - 12, isTranscendReady && !isSkillUpgrade);

    const titleY = iconY + iconSize + 30;
    ctx.fillStyle = "#fff8e8";
    ctx.font = `bold ${Math.max(16, Math.min(21, cardW * 0.072))}px Arial`;
    ctx.fillText(title, x + cardW / 2, titleY);
    ctx.fillStyle = "rgba(235,239,250,0.82)";
    ctx.font = `${Math.max(12, Math.min(15, cardW * 0.052))}px Arial`;
    wrapText(desc, x + cardW / 2, titleY + 34, cardW - 34, 20);

    ctx.fillStyle = isTranscendReady ? accent : "rgba(205,211,226,0.66)";
    ctx.font = "13px Arial";
    let statusText = `선택 횟수: ${count}/4`;
    if (isSkillUpgrade) statusText = "1회 선택 · 즉시 활성화";
    else if (isTranscendReady) statusText = "이번 선택 시 초월 발동";
    ctx.fillText(statusText, x + cardW / 2, y + cardH - 27);

    ctx.fillStyle = accent;
    ctx.font = "bold 13px Arial";
    ctx.fillText(`[ ${i + 1} ]`, x + cardW / 2, y + cardH - 8);
    ctx.restore();
  }

  drawUpgradeSelectionEffect();
  ctx.textAlign = "left";
}

const augmentIconCells = {
  ammo: 0, damage: 1, hp: 2, speed: 3,
  fireRate: 4, greed: 5, vision: 6, quantum: 7,
  gravity: 8, drone: 9, droneB: 9, worldEnder: 9, timeRewind: 6, dodge: 10, crown: 11,
  maliciousProfit: 12
};

const transcendIconCells = {
  ammo: 0, damage: 1, hp: 2,
  speed: 3, fireRate: 4, greed: 5
};

function drawAugmentIcon(id, x, y, size, transcendent = false) {
  if(id==="carmillaPreserve"||id==="carmillaResonance"||id==="carmillaFeast"){if(carmillaAugmentIconAtlas.complete&&carmillaAugmentIconAtlas.naturalWidth){const base={carmillaPreserve:0,carmillaResonance:1,carmillaFeast:2}[id],cell=transcendent?3:base,sw=carmillaAugmentIconAtlas.naturalWidth/2,sh=carmillaAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(carmillaAugmentIconAtlas,(cell%2)*sw,Math.floor(cell/2)*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if(id==="voidCapacity"||id==="voidTerrain"||id==="voidChain"){if(voidAugmentIconAtlas.complete&&voidAugmentIconAtlas.naturalWidth){const cell={voidCapacity:0,voidTerrain:1,voidChain:2}[id]+(transcendent?1:0);const sw=voidAugmentIconAtlas.naturalWidth/2,sh=voidAugmentIconAtlas.naturalHeight/2,col=cell%2,row=Math.floor(cell/2)%2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(voidAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if (id === "terraResonance" || id === "terraFault" || id === "terraRampart") {
    if (terraAugmentIconAtlas.complete && terraAugmentIconAtlas.naturalWidth > 0) {
      const column = { terraResonance: 0, terraFault: 1, terraRampart: 2 }[id], row = transcendent ? 1 : 0;
      const sw = terraAugmentIconAtlas.naturalWidth / 3, sh = terraAugmentIconAtlas.naturalHeight / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(terraAugmentIconAtlas, column * sw, row * sh, sw, sh, x, y, size, size); ctx.restore(); return;
    }
  }
  if (id === "arcBrand" || id === "arcCorona" || id === "arcHeat") {
    if (arcAugmentIconAtlas.complete && arcAugmentIconAtlas.naturalWidth > 0) {
      const column = { arcBrand: 0, arcCorona: 1, arcHeat: 2 }[id];
      const row = transcendent ? 1 : 0;
      const sw = arcAugmentIconAtlas.naturalWidth / 3, sh = arcAugmentIconAtlas.naturalHeight / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(arcAugmentIconAtlas, column * sw, row * sh, sw, sh, x, y, size, size); ctx.restore();
      return;
    }
  }
  if (id === "paladinCombo" || id === "paladinSpeed" || id === "paladinRelease") {
    const iconKey = transcendent ? `${id}Transcend` : id;
    const icon = paladinAugmentIcons[iconKey];
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(icon, x, y, size, size); ctx.restore();
      return;
    }
  }
  if (id === "zeroThrust" || id === "zeroVital" || id === "zeroJudgment") {
    const iconKey = transcendent ? `${id}Transcend` : id;
    const icon = zeroAugmentIcons[iconKey];
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(icon, x, y, size, size);
      ctx.restore();
      return;
    }
  }
  if (id === "nightReach" || id === "nightBlood" || id === "nightExecution") {
    const iconKey = transcendent ? `${id}Transcend` : id;
    const icon = nightLordAugmentIcons[iconKey];
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(icon, x, y, size, size);
      ctx.restore();
      return;
    }
    const cx = x + size / 2, cy = y + size / 2;
    ctx.save();
    const glow = transcendent ? "#ffd65a" : "#a64dff";
    ctx.fillStyle = "rgba(18,6,32,0.94)"; ctx.strokeStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = transcendent ? 24 : 16; ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.beginPath(); ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.translate(cx, cy); ctx.strokeStyle = transcendent ? "#ffe793" : "#d5a0ff"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(3, size * 0.06); ctx.lineCap = "round";
    if (id === "nightReach") {
      ctx.beginPath(); ctx.arc(0, 0, size * 0.27, -Math.PI * 0.8, Math.PI * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(size * 0.18, size * 0.16); ctx.lineTo(size * 0.34, size * 0.25); ctx.lineTo(size * 0.29, size * 0.07); ctx.fill();
    } else if (id === "nightBlood") {
      ctx.beginPath(); ctx.moveTo(0, -size * 0.3); ctx.bezierCurveTo(size * 0.24, -size * 0.05, size * 0.22, size * 0.22, 0, size * 0.3); ctx.bezierCurveTo(-size * 0.22, size * 0.22, -size * 0.24, -size * 0.05, 0, -size * 0.3); ctx.fill();
      ctx.fillStyle = "rgba(36,7,48,0.75)"; ctx.beginPath(); ctx.arc(size * 0.05, size * 0.08, size * 0.09, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(-size * 0.27, -size * 0.2); ctx.lineTo(size * 0.25, size * 0.2); ctx.moveTo(size * 0.27, -size * 0.2); ctx.lineTo(-size * 0.25, size * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return;
  }
  if (id === "afterimage" || id === "darkDevour") {
    const icon = id === "afterimage"
      ? (transcendent ? renAugmentIcons.totalEclipse : renAugmentIcons.afterimage)
      : (transcendent ? renAugmentIcons.reaperFootsteps : renAugmentIcons.darkDevour);
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(icon, x, y, size, size);
      ctx.restore();
      return;
    }
  }
  if (id === "recall" && transcendent && martialLawIconLoaded) {
    ctx.drawImage(martialLawIcon, x, y, size, size);
    return;
  }
  if (id === "swordAura" && ((transcendent && trackerIconLoaded) || (!transcendent && swordAuraIconLoaded))) {
    ctx.drawImage(transcendent ? trackerIcon : swordAuraIcon, x, y, size, size);
    return;
  }
  if (id === "recall") {
    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.save();
    ctx.strokeStyle = transcendent ? "#ffe878" : "#d9e0e8";
    ctx.fillStyle = transcendent ? "#fff3ad" : "#aeb9c7";
    ctx.shadowColor = transcendent ? "#ffd43b" : "#cdefff";
    ctx.shadowBlur = transcendent ? 22 : 12;
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.31, Math.PI * 0.15, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.29, cy - size * 0.08);
    ctx.lineTo(cx + size * 0.39, cy + size * 0.02);
    ctx.lineTo(cx + size * 0.25, cy + size * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.16, -Math.PI * 0.72, Math.PI * 0.72);
    ctx.stroke();
    if (transcendent) {
      ctx.fillStyle = "#fff4b0";
      ctx.fillRect(cx - size * 0.05, cy - size * 0.2, size * 0.1, size * 0.39);
      ctx.fillRect(cx - size * 0.2, cy - size * 0.26, size * 0.4, size * 0.13);
    }
    ctx.restore();
    return;
  }
  if (id === "swordAura") {
    const cx = x + size / 2, cy = y + size / 2;
    ctx.save();
    ctx.strokeStyle = transcendent ? "#ffe878" : "#dce8f5";
    ctx.shadowColor = transcendent ? "#ffd43b" : "#b9dfff";
    ctx.shadowBlur = transcendent ? 22 : 13;
    ctx.lineWidth = Math.max(3, size * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.31, transcendent ? 0 : -Math.PI * 0.72, transcendent ? Math.PI * 2 : Math.PI * 0.72);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.08, cy + size * 0.27);
    ctx.lineTo(cx + size * 0.16, cy - size * 0.28);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (id === "timeRewind") {
    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.save();
    ctx.strokeStyle = "#78fff1";
    ctx.fillStyle = "rgba(16,45,60,0.9)";
    ctx.shadowColor = "#78fff1";
    ctx.shadowBlur = 14;
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.31, -Math.PI * 0.25, Math.PI * 1.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.28, cy - size * 0.2);
    ctx.lineTo(cx - size * 0.4, cy - size * 0.22);
    ctx.lineTo(cx - size * 0.33, cy - size * 0.1);
    ctx.closePath();
    ctx.fillStyle = "#b987ff";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.23, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - size * 0.14);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + size * 0.12, cy + size * 0.07);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (
    transcendent &&
    (transcendIconAtlasLoaded || (transcendIconAtlas.complete && transcendIconAtlas.naturalWidth > 0))
  ) {
    const cell = transcendIconCells[id] ?? 0;
    const sourceW = transcendIconAtlas.naturalWidth / 3;
    const sourceH = transcendIconAtlas.naturalHeight / 2;
    ctx.drawImage(
      transcendIconAtlas,
      (cell % 3) * sourceW,
      Math.floor(cell / 3) * sourceH,
      sourceW,
      sourceH,
      x,
      y,
      size,
      size
    );
    return;
  }
  if (id === "immortal" && immortalIconLoaded) {
    ctx.drawImage(immortalIcon, x, y, size, size);
    return;
  }
  if (!augmentIconAtlasLoaded) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `bold ${Math.floor(size * 0.48)}px Arial`;
    ctx.fillText("✦", x + size / 2, y + size * 0.68);
    return;
  }
  const cell = augmentIconCells[id] ?? 0;
  const sourceW = augmentIconAtlas.naturalWidth / 4;
  const sourceH = augmentIconAtlas.naturalHeight / 4;
  const sx = (cell % 4) * sourceW;
  const sy = Math.floor(cell / 4) * sourceH;
  ctx.drawImage(augmentIconAtlas, sx, sy, sourceW, sourceH, x, y, size, size);
}

function drawTranscendAurora(x, y, w, h, index) {
  const t = upgradeAnimTime * 0.035 + index * 1.9;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.globalCompositeOperation = "screen";

  for (let ring = 0; ring < 3; ring++) {
    const phase = t + ring * Math.PI * 0.66;
    const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    gradient.addColorStop(0, "rgba(255,190,20,0)");
    gradient.addColorStop(0.45, "rgba(255,222,74,0.72)");
    gradient.addColorStop(0.62, "rgba(255,248,181,0.95)");
    gradient.addColorStop(1, "rgba(255,190,20,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 + ring;
    ctx.shadowColor = "#ffd52f";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * (0.54 + ring * 0.025), h * (0.48 + ring * 0.014), phase, phase, phase + Math.PI * 0.78);
    ctx.stroke();
  }

  for (let p = 0; p < 7; p++) {
    const angle = t * (0.8 + p * 0.035) + p * Math.PI * 2 / 7;
    const px = Math.cos(angle) * w * 0.55;
    const py = Math.sin(angle) * h * 0.48;
    ctx.fillStyle = p % 2 ? "#fff5ad" : "#ffc928";
    ctx.shadowColor = "#ffd52f";
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.arc(px, py, 2.2 + (p % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawUpgradeSelectionEffect() {
  if (!upgradeSelectionEffect) return;
  const effect = upgradeSelectionEffect;
  effect.time++;

  const veilAlpha = Math.min(0.3, effect.time / 70);
  ctx.save();
  ctx.fillStyle = `rgba(7,9,16,${veilAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";

  const pulse = 32 + effect.time * 7;
  const radial = ctx.createRadialGradient(effect.centerX, effect.centerY, 0, effect.centerX, effect.centerY, pulse);
  radial.addColorStop(0, `rgba(255,244,190,${Math.max(0, 0.55 - effect.time * 0.018)})`);
  radial.addColorStop(1, "rgba(255,210,70,0)");
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(effect.centerX, effect.centerY, pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (effect.time >= 24) {
    finalizeUpgradeChoice(effect.index);
  }
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

function wrapTextLeft(text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  ctx.textAlign = "left";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
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
