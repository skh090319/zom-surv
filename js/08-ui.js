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
  const healthText=selectedCharacter==="vargas"?`${Math.max(0,player.hp).toFixed(1)} / ${player.maxHp.toFixed(1)}`:`${Math.max(0,Math.floor(player.hp))} / ${Math.floor(player.maxHp)}`;
  ctx.fillText(
    healthText,
    canvas.width / 2,
    y + barH / 2
  );

  ctx.restore();
}

function drawHUD() {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  const hudW = (selectedCharacter === "ren" || selectedCharacter === "vargas") ? 240 : (selectedCharacter === "yupiter" ? 350 : 190);
  const hudH = 190;
  ctx.fillRect(12, 12, hudW, hudH);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";

  const x = 25;
  let y = 40;
  const gap = 28;

  // HP는 화면 상단 체력바로 표시

  const weaponText = selectedCharacter === "mare"
    ? "마레 · 심해의 지휘자"
    : selectedCharacter === "moira"
    ? "모이라 · 저주의 인형사"
    : selectedCharacter === "aria"
    ? "아리아 · 몽환의 화원사"
    : selectedCharacter === "echo"
    ? "에코 · 차원 재단사"
    : selectedCharacter === "yupiter"
    ? `Weapon: ${YUPITER_WEAPON_NAMES[player.yupiterWeapon]}`
    : (selectedCharacter === "vargas"
      ? "바르가스 · 심연의 거신"
      : (selectedCharacter === "ren"
      ? "렌 · 그림자 암살자"
      : (selectedCharacter === "nightLord" ? "나이트 로드 · 암흑 월도" : (selectedCharacter === "zero" ? "제로 · 성검" : (selectedCharacter === "paladin" ? "팔라딘 · 해방검" : (selectedCharacter === "arc" ? "아크 · 태양술사" : (selectedCharacter === "terra" ? "테라 · 대지 권사" : (selectedCharacter === "void" ? "보이드 · 공허 포식자" : (selectedCharacter === "carmilla" ? "카르밀라 · 혈조" : (player.gatlingLevel > 0 ? "Ammo: ∞" : `Ammo: ${player.ammo}/${player.maxAmmo}`))))))))));
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
    : (selectedCharacter === "vargas" ? Math.floor(vargasDamage(player.vargasUltimateTime>0?1.65:1.1,.025)) : (selectedCharacter === "nightLord" ? Math.floor(scaledDamage(player.damage * (1 + getNightLordRage() * 0.8))) : (selectedCharacter === "zero" ? Math.floor(scaledDamage(player.damage * getZeroDamageMultiplier())) : (selectedCharacter === "paladin" ? Math.floor(scaledDamage(player.damage * [1, 1.16, 1.36, 1.68][getPaladinTier()])) : player.damage))));
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
  drawYupiterHudIcon(ultimateX, cy, radius, yupiterUltimateIcon, player.level >= 10 && ultimateCooldown <= 0, true);
  if (ultimateCooldown > 0) drawCooldownCover(ultimateX, cy, radius, ultimateCooldown / YUPITER_ULTIMATE_COOLDOWN, ultimateCooldown);
  drawSkillHudLabel(ultimateX, panelY + 103, player.level < 10 ? "10레벨 해금" : "궁극기", "R", "#ffffff");
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

  const rReady = player.level >= 10 && player.renUltimateCooldown <= 0;
  drawYupiterHudIcon(rX, cy, radius, renSkillIcons[3], rReady, true);
  if (player.renUltimateCooldown > 0) drawCooldownCover(rX, cy, radius, player.renUltimateCooldown / REN_ULTIMATE_COOLDOWN, player.renUltimateCooldown);
  drawSkillHudLabel(rX, panelY + 99, player.level < 10 ? "10레벨 해금" : "밤의 군주", "R");
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
    ["R", player.level < 10 ? "10레벨 해금" : "불사의 밤", player.nightLordRCooldown, NIGHT_LORD_R_COOLDOWN]
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
    ["R", player.level < 10 ? "10레벨 해금" : "검의 왈츠", player.zeroRCooldown, ZERO_R_COOLDOWN]
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

function drawCarmillaInterface(){if(selectedCharacter!=="carmilla"||screenMode!=="game")return;const w=Math.min(560,canvas.width-32),h=112,x=(canvas.width-w)/2,y=canvas.height-170,count=getCarmillaBloodCount(),need=getCarmillaBloodMoonNeed(),moon=player.carmillaBloodMoonTime>0;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(15,5,10,.97)");g.addColorStop(.55,"rgba(76,7,25,.96)");g.addColorStop(1,"rgba(12,3,8,.97)");drawRoundedRect(x,y,w,h,23,g,"#ff315d",2);ctx.save();ctx.beginPath();ctx.arc(x+52,y+54,38,0,Math.PI*2);ctx.clip();if(carmillaSpriteLoaded)ctx.drawImage(carmillaSprite,x+10,y+8,84,84);ctx.restore();ctx.strokeStyle="#ff5373";ctx.beginPath();ctx.arc(x+52,y+54,38,0,Math.PI*2);ctx.stroke();const sx=x+102;ctx.textAlign="left";ctx.fillStyle="#fff0f3";ctx.font="bold 18px Arial";ctx.fillText("카르밀라",sx,y+27);ctx.fillStyle="#ff6d89";ctx.font="bold 13px Arial";ctx.fillText(moon?"혈월 활성 · 기본 공격 175%":`혈월 ${Math.min(Math.floor(count),need)} / ${need}`,sx,y+50);drawRoundedRect(sx,y+61,150,11,6,"rgba(255,255,255,.08)");drawRoundedRect(sx,y+61,150*(moon?1:Math.min(1,count/need)),11,6,"#d91643");ctx.fillStyle="#d7aebb";ctx.font="11px Arial";ctx.fillText(moon?`남은 시간 ${Math.ceil(player.carmillaBloodMoonTime/60)}초${transcended.carmillaFeast?" · 치명 피해 시 1에서 보호":""}`:`흡수 대기 ${Math.floor(count)}`,sx,y+92);const ix=x+w-74,iy=y+48,r=30;ctx.save();ctx.beginPath();ctx.arc(ix,iy,r,0,Math.PI*2);ctx.clip();if(carmillaSkillIconAtlas.complete){const sw=carmillaSkillIconAtlas.naturalWidth/2,sh=carmillaSkillIconAtlas.naturalHeight/2;ctx.drawImage(carmillaSkillIconAtlas,0,0,sw,sh,ix-r,iy-r,r*2,r*2);}ctx.restore();if(player.carmillaQCooldown>0)drawCooldownCover(ix,iy,r,player.carmillaQCooldown/CARMILLA_Q_COOLDOWN,player.carmillaQCooldown);drawSkillHudLabel(ix,y+91,"피의 회수","Q","#ffd3dc");ctx.restore();}

function drawVargasInterface(){if(selectedCharacter!=="vargas"||screenMode!=="game")return;const w=Math.min(760,canvas.width-28),h=122,x=(canvas.width-w)/2,y=canvas.height-180;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(5,13,10,.97)");g.addColorStop(.5,"rgba(34,13,18,.97)");g.addColorStop(1,"rgba(5,9,8,.97)");drawRoundedRect(x,y,w,h,24,g,"#58f39a",2);ctx.save();ctx.beginPath();ctx.arc(x+56,y+59,42,0,Math.PI*2);ctx.clip();if(vargasSpriteLoaded)ctx.drawImage(vargasSprite,x+4,y+2,108,108);ctx.restore();ctx.strokeStyle="#77ffae";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+56,y+59,42,0,Math.PI*2);ctx.stroke();const sx=x+112;ctx.textAlign="left";ctx.fillStyle="#effff5";ctx.font="bold 18px Arial";ctx.fillText("바르가스",sx,y+27);ctx.fillStyle="#72f3a8";ctx.font="bold 13px Arial";ctx.fillText(`최대 체력 ${player.maxHp.toFixed(1)}  ·  누적 성장 +${player.vargasGainedHp.toFixed(1)}`,sx,y+50);ctx.fillStyle="#b8d8c4";ctx.font="11px Arial";ctx.fillText(player.vargasUltimateTime>0?`불멸의 형상 ${Math.ceil(player.vargasUltimateTime/60)}초 · 성장 2배`:`일반 +0.3 · 큰 좀비 +1.5 · 보호막 ${player.vargasShield.toFixed(1)}`,sx,y+72);drawRoundedRect(sx,y+82,185,10,5,"rgba(255,255,255,.08)");if(player.vargasShield>0)drawRoundedRect(sx,y+82,185*Math.min(1,player.vargasShield/(player.maxHp*.25)),10,5,"#53e895");const skills=[["Q","생명 포식",player.vargasQCooldown,VARGAS_Q_COOLDOWN],["E","혈육 갑주",player.vargasECooldown,VARGAS_E_COOLDOWN],["X","거신 강타",player.vargasXCooldown,VARGAS_X_COOLDOWN],["R",player.level<10?"10레벨 해금":"불멸의 형상",player.vargasRCooldown,VARGAS_R_COOLDOWN]];skills.forEach((s,i)=>{const ix=x+w-290+i*70,iy=y+48,r=26,locked=i===3&&player.level<10;ctx.save();ctx.beginPath();ctx.arc(ix,iy,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=s[2]>0||locked?.35:1;if(vargasSkillIconAtlas.complete&&vargasSkillIconAtlas.naturalWidth){const sw=vargasSkillIconAtlas.naturalWidth/2,sh=vargasSkillIconAtlas.naturalHeight/2;ctx.drawImage(vargasSkillIconAtlas,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,ix-r,iy-r,r*2,r*2)}ctx.restore();if(s[2]>0)drawCooldownCover(ix,iy,r,s[2]/s[3],s[2]);drawSkillHudLabel(ix,y+98,s[1],s[0],"#caffdd")});ctx.restore()}

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
  const mobileTouch = typeof isMobileTouchDevice === "function" && isMobileTouchDevice();
  const margin = mobileTouch ? Math.max(120, canvas.width * 0.29) : 260;
  const barX = margin;
  const barY = canvas.height - 32;
  const barW = mobileTouch ? Math.max(150, canvas.width - margin * 2) : Math.max(200, canvas.width - margin * 2);
  const barH = mobileTouch ? 14 : 18;
  const ratio = player.exp / player.expNeed;

  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barW, barH);

  ctx.fillStyle = "#b84dff";
  ctx.fillRect(barX, barY, barW * ratio, barH);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = "white";
  ctx.font = mobileTouch ? "bold 12px Arial" : "16px Arial";
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

function drawBloodiedLobbyTitle(text,x,y,size,baseFill){
  ctx.save();ctx.textAlign="left";ctx.font=`900 ${size}px Arial`;ctx.fillStyle=baseFill;ctx.shadowColor="rgba(144,175,255,.28)";ctx.shadowBlur=Math.max(8,size*.34);ctx.fillText(text,x,y);ctx.shadowBlur=0;
  const width=ctx.measureText(text).width,blood=ctx.createLinearGradient(0,y-size*.42,0,y+3);blood.addColorStop(0,"rgba(116,8,24,0)");blood.addColorStop(.45,"rgba(154,10,31,.42)");blood.addColorStop(1,"rgba(87,3,18,.94)");ctx.beginPath();ctx.rect(x-2,y-size*.48,width+4,size*.54);ctx.clip();ctx.fillStyle=blood;ctx.fillText(text,x,y);ctx.restore();
  ctx.save();ctx.lineCap="round";const marks=[.085,.245,.43,.615,.79,.925];for(let i=0;i<marks.length;i++){const mx=x+width*marks[i],top=y-(i%3===0?3:1),length=size*(.07+(i%3)*.045);ctx.strokeStyle=i%2?"rgba(111,5,22,.9)":"rgba(181,15,39,.82)";ctx.lineWidth=Math.max(1.5,size*(i%3===1?.035:.024));ctx.beginPath();ctx.moveTo(mx,top-size*.05);ctx.quadraticCurveTo(mx+size*.018,top+length*.45,mx-size*.006,top+length);ctx.stroke();ctx.fillStyle="rgba(126,6,25,.9)";ctx.beginPath();ctx.arc(mx-size*.006,top+length+size*.018,Math.max(1.4,size*.025),0,Math.PI*2);ctx.fill();}
  const splashes=[[.14,-.64,.018],[.36,-.31,.026],[.57,-.56,.015],[.73,-.25,.022],[.88,-.48,.018]];for(const [rx,ry,rr] of splashes){ctx.fillStyle="rgba(177,14,39,.72)";ctx.beginPath();ctx.arc(x+width*rx,y+size*ry,Math.max(1,size*rr),0,Math.PI*2);ctx.fill();}ctx.restore();
}

function drawHomeScreen() {
  if(typeof isMobileTouchDevice==="function"&&isMobileTouchDevice()&&canvas.height<520){drawMobileHomeScreen();return;}
  drawMenuBackdrop(0.62);
  const t=performance.now()*.001,wide=canvas.width>=900,margin=Math.max(28,canvas.width*.045);
  const info=characterSkillGuide[selectedCharacter]||characterSkillGuide.default;
  const accent=info.color||"#57ddff",sprite=getCharacterPreviewSprite(selectedCharacter);
  ctx.save();

  // 시네마틱 로비 조명과 상하 레터박스
  const sideShade=ctx.createLinearGradient(0,0,canvas.width,0);
  sideShade.addColorStop(0,"rgba(2,4,11,.96)");sideShade.addColorStop(.42,"rgba(3,5,13,.58)");sideShade.addColorStop(.72,"rgba(6,8,17,.18)");sideShade.addColorStop(1,"rgba(2,3,9,.82)");
  ctx.fillStyle=sideShade;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="rgba(1,2,7,.8)";ctx.fillRect(0,0,canvas.width,54);ctx.fillRect(0,canvas.height-54,canvas.width,54);
  ctx.strokeStyle="rgba(255,255,255,.08)";ctx.beginPath();ctx.moveTo(0,54);ctx.lineTo(canvas.width,54);ctx.moveTo(0,canvas.height-54);ctx.lineTo(canvas.width,canvas.height-54);ctx.stroke();

  // 선택 캐릭터 키 비주얼
  const heroX=wide?canvas.width*.665:canvas.width*.73,heroY=canvas.height*.48;
  const heroGlow=ctx.createRadialGradient(heroX,heroY,10,heroX,heroY,Math.min(canvas.width,canvas.height)*.42);
  heroGlow.addColorStop(0,`${accent}42`);heroGlow.addColorStop(.42,`${accent}15`);heroGlow.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=heroGlow;ctx.fillRect(0,54,canvas.width,canvas.height-108);
  ctx.save();ctx.translate(heroX,canvas.height*.735);ctx.scale(1,.25);ctx.strokeStyle=`${accent}92`;ctx.shadowColor=accent;ctx.shadowBlur=24;ctx.lineWidth=3;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,88+i*31+Math.sin(t*2+i)*5,0,Math.PI*2);ctx.stroke();}ctx.restore();
  for(let i=0;i<16;i++){const a=i*2.399+t*(i%2?.14:-.1),r=105+(i%5)*38,x=heroX+Math.cos(a)*r,y=heroY+Math.sin(a)*r*.65;ctx.fillStyle=i%3===0?accent:"rgba(205,225,255,.42)";ctx.fillRect(x,y,2+(i%2),2+(i%2));}
  if(sprite&&sprite.complete&&sprite.naturalWidth){
    const maxW=wide?Math.min(510,canvas.width*.38):Math.min(280,canvas.width*.4),maxH=canvas.height*.63;
    const scale=Math.min(maxW/sprite.naturalWidth,maxH/sprite.naturalHeight),dw=sprite.naturalWidth*scale,dh=sprite.naturalHeight*scale;
    ctx.save();ctx.globalAlpha=.25;ctx.filter="blur(18px)";ctx.drawImage(sprite,heroX-dw*.53,heroY-dh*.48+10,dw*1.06,dh*1.06);ctx.restore();
    ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=30;ctx.drawImage(sprite,heroX-dw/2,heroY-dh/2,dw,dh);ctx.restore();
  }
  const heroLabelY=canvas.height*.82;
  drawRoundedRect(heroX-92,heroLabelY-17,184,25,13,"rgba(3,6,14,.82)",`${accent}55`,1);
  ctx.textAlign="center";ctx.fillStyle="#cbd7ea";ctx.font="bold 11px Arial";ctx.fillText("SELECTED SURVIVOR",heroX,heroLabelY);
  ctx.fillStyle="#fff";ctx.shadowColor=accent;ctx.shadowBlur=12;ctx.font=`900 ${wide?30:22}px Arial`;ctx.fillText(info.name,heroX,heroLabelY+35);ctx.shadowBlur=0;
  ctx.fillStyle=accent;ctx.fillRect(heroX-38,heroLabelY+48,76,2);

  // 왼쪽 타이틀 및 시즌 정보
  const leftX=margin,titleY=Math.max(130,canvas.height*.2),titleSize=Math.min(76,canvas.width*(wide?.056:.075));
  ctx.textAlign="left";ctx.fillStyle="#ff4765";ctx.font="900 12px Arial";ctx.fillText("NIGHT PROTOCOL  /  03",leftX,titleY-58);
  ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(leftX,titleY-42,wide?470:canvas.width*.48,1);ctx.fillStyle="#ff4765";ctx.fillRect(leftX,titleY-43,72,3);
  const titleGradient=ctx.createLinearGradient(leftX,0,leftX+540,0);titleGradient.addColorStop(0,"#ffffff");titleGradient.addColorStop(.58,"#e8ecff");titleGradient.addColorStop(1,"#9f8ed1");
  drawBloodiedLobbyTitle("ZOMBIE",leftX,titleY+20,titleSize,titleGradient);drawBloodiedLobbyTitle("SURVIVAL",leftX,titleY+20+titleSize*.9,titleSize,titleGradient);
  ctx.fillStyle="#aeb8cb";ctx.font=`${wide?16:13}px Arial`;ctx.fillText("밤이 끝나기 전에 살아남아라.",leftX,titleY+54+titleSize*.9);

  // 메인 플레이 버튼
  const menuW=wide?Math.min(500,canvas.width*.41):Math.min(410,canvas.width*.55),startY=Math.min(canvas.height-292,titleY+82+titleSize*.9);
  homeStartRect={x:leftX,y:startY,w:menuW,h:76};
  const startHover=pointInRect(mouse.x,mouse.y,homeStartRect),lift=startHover?-4:0;
  const playGradient=ctx.createLinearGradient(leftX,startY,leftX+menuW,startY);playGradient.addColorStop(0,startHover?"#159bb5":"#126e82");playGradient.addColorStop(1,startHover?"#3854ae":"#26386d");
  ctx.save();ctx.shadowColor="#21d8ff";ctx.shadowBlur=startHover?34:17;drawRoundedRect(leftX,startY+lift,menuW,76,10,playGradient,"#73edff",2);ctx.restore();
  ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.arc(leftX+39,startY+38+lift,24,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.48)";ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 20px Arial";ctx.textAlign="center";ctx.fillText("▶",leftX+41,startY+45+lift);
  ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="900 23px Arial";ctx.fillText("작전 시작",leftX+78,startY+32+lift);ctx.fillStyle="rgba(235,250,255,.68)";ctx.font="12px Arial";ctx.fillText(`${info.name}으로 생존 작전을 시작합니다`,leftX+78,startY+54+lift);ctx.font="bold 23px Arial";ctx.fillStyle="rgba(255,255,255,.75)";ctx.fillText("›",leftX+menuW-35,startY+47+lift);

  // 보조 메뉴: 언제나 두 칸씩 배치
  const gap=10,cardY=startY+86,cardH=98,cardCols=2,cardW=(menuW-gap)/2;
  const cardRect=i=>({x:leftX+(i%cardCols)*(cardW+gap),y:cardY+Math.floor(i/cardCols)*(cardH+gap),w:cardW,h:cardH});
  homeCharacterRect=cardRect(0);homeAugmentGuideRect=cardRect(1);homeGameGuideRect=cardRect(2);homeMonsterGuideRect=cardRect(3);
  const cards=[[homeCharacterRect,"#b875ff","◆","캐릭터","생존자 선택","01"],[homeAugmentGuideRect,"#ffd15b","✦","증강 도감","빌드 설계","02"],[homeGameGuideRect,"#5fe3ad","?","게임 가이드","조작·보스","03"],[homeMonsterGuideRect,"#ff6b83","☣","몬스터 도감","적·보스 정보","04"]];
  for(const [rect,color,glyph,label,sub,no] of cards){
    const hover=pointInRect(mouse.x,mouse.y,rect),cy=rect.y+(hover?-4:0),g=ctx.createLinearGradient(rect.x,cy,rect.x+rect.w,cy+rect.h);
    g.addColorStop(0,hover?`${color}70`:`${color}52`);g.addColorStop(.55,hover?`${color}48`:`${color}34`);g.addColorStop(1,hover?`${color}28`:`${color}1c`);
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=hover?34:20;drawRoundedRect(rect.x,cy,rect.w,rect.h,12,g,hover?`${color}ee`:`${color}9c`,hover?2:1.5);ctx.restore();
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=hover?20:12;ctx.fillStyle=color;ctx.fillRect(rect.x+1,cy+1,rect.w-2,3);ctx.restore();ctx.fillStyle=`${color}2e`;ctx.beginPath();ctx.arc(rect.x+27,cy+31,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`${color}cc`;ctx.stroke();
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=hover?16:9;ctx.textAlign="center";ctx.fillStyle=color;ctx.font="bold 17px Arial";ctx.fillText(glyph,rect.x+27,cy+37);ctx.restore();
    ctx.textAlign="left";ctx.fillStyle="#f7f8ff";ctx.font=`900 ${cardW<130?13:15}px Arial`;ctx.fillText(label,rect.x+51,cy+34);
    ctx.fillStyle="rgba(211,220,237,.62)";ctx.font=`${cardW<130?10:11}px Arial`;ctx.fillText(sub,rect.x+15,cy+68);
    ctx.fillStyle=hover?color:"rgba(255,255,255,.35)";ctx.font="bold 17px Arial";ctx.fillText("›",rect.x+rect.w-22,cy+72);
    ctx.textAlign="right";ctx.fillStyle="rgba(255,255,255,.16)";ctx.font="bold 10px monospace";ctx.fillText(no,rect.x+rect.w-11,cy+18);
  }
  const briefingY=cardY+Math.ceil(cards.length/cardCols)*(cardH+gap)-gap+12;
  ctx.fillStyle="rgba(7,10,18,.74)";drawRoundedRect(leftX,briefingY,menuW,34,8,"rgba(7,10,18,.74)","rgba(255,255,255,.1)",1);
  ctx.textAlign="left";ctx.fillStyle="rgba(196,209,231,.58)";ctx.font="bold 10px Arial";ctx.fillText("OPERATION",leftX+13,briefingY+21);ctx.fillStyle="#ff637a";ctx.fillText("BOSS  02:00 · 04:00 · 06:00",leftX+92,briefingY+21);

  // 상단 상태바 / 하단 조작 정보
  ctx.textAlign="left";ctx.fillStyle="#d9e2f4";ctx.font="bold 12px Arial";ctx.fillText("Z/S  //  OPERATIONS",margin,34);ctx.fillStyle="rgba(220,230,248,.46)";ctx.font="11px Arial";ctx.textAlign="right";ctx.fillText(`누적 처치 ${totalZombieKills.toLocaleString()}  ·  생존자 ${info.name}`,canvas.width-margin,34);
  ctx.textAlign="left";ctx.fillStyle="rgba(218,225,240,.5)";ctx.font="11px Arial";ctx.fillText("WASD  이동     MOUSE  조준·공격     Q E X R  스킬",margin,canvas.height-24);ctx.textAlign="right";ctx.fillText("BUILD 2026.09  ·  ONLINE",canvas.width-margin,canvas.height-24);
  ctx.restore();ctx.textAlign="left";
}

const characterSkillGuide = {
  default:{name:"기본 캐릭터",color:"#b05cff",passive:"안정적인 능력치로 총기와 공용 증강을 자유롭게 조합합니다.",skills:[["기본 공격","마우스 방향으로 총알을 발사합니다."],["R 재장전","탄창을 다시 채웁니다."]]},
  suncall:{name:"썬콜",color:"#48d8ff",passive:"이동속도가 15% 증가하며 공격 시 10% 확률로 둔화 얼음 지대를 만듭니다.",skills:[["기본 공격","빠른 총격으로 적을 공격하고 얼음 지대를 생성합니다."],["R 재장전","탄창을 다시 채웁니다."]]},
  luminous:{name:"루미너스",color:"#59e9ff",passive:"8개의 마력탄이 발사 순간 지정한 적을 자동 추적합니다.",skills:[["유도 마력탄","손끝에서 발사한 마력탄이 궤도를 휘어 적을 끝까지 추적합니다."]]},
  yupiter:{name:"유피테르",color:"#64ef91",passive:"Q로 반월검·절단검·화염포를 전환하며 각 무기마다 E와 R이 달라집니다.",skills:[["Q 무기 전환","반월검·절단검·화염포를 교체하며 각 무기의 기본 공격을 확인합니다."],["E 반월검 증식","반월검을 4개로 늘려 한 번의 공격으로 더 큰 피해를 줍니다."],["E 절단검 가속","공격속도를 폭발적으로 높여 연속 참격을 가합니다."],["E 화염포 폭파","화염포 표식이 묻은 적들을 한꺼번에 폭발시킵니다."],["R 반월검 궁극기","10레벨부터 10개의 반월검이 점점 넓게 공전하며 적을 공격합니다."],["R 절단검 궁극기","10레벨부터 이동속도·공격 범위가 증가하고 낮은 체력의 적을 처형합니다."],["R 화염포 궁극기","10레벨부터 에너지 구체 적중 지점에서 모든 적에게 화염탄을 퍼뜨립니다."]]},
  ren:{name:"렌",color:"#ff496f",passive:"그림자 조각을 흡수해 공격력을 높이고 분신을 강화합니다.",skills:[["Q 분신 배치","분신을 커서 방향의 제한 거리까지 내보냅니다."],["X 그림자 이동","가장 최근 분신 위치로 순간이동합니다."],["E 분신 습격","분신이 적을 찾아 강하게 습격합니다."],["R 그림자 지대","10레벨부터 거대한 마법진을 펼쳐 적을 둔화하고 지속 피해를 줍니다."]]},
  nightLord:{name:"나이트 로드",color:"#a855f7",passive:"잃은 체력에 비례해 공격력이 증가하며 처형과 흡혈로 역전합니다.",skills:[["Q 그림자 추격","적에게 파고들어 베고 잠시 공격속도가 증가합니다."],["E 광란","현재 체력을 대가로 연속 참격을 사용합니다."],["X 처형","기준 이하 체력의 적을 마무리합니다."],["R 불사의 밤","10레벨부터 체력이 1 아래로 내려가지 않는 강화 상태가 됩니다."]]},
  zero:{name:"제로",color:"#ffd85a",passive:"평타 적중으로 Q·E·X의 쿨타임을 줄이며 후반으로 갈수록 검술 피해가 증가합니다.",skills:[["Q 참격","짧게 돌진해 전방의 적을 찌릅니다."],["E 급소","평타를 강화하고 다음 강화 평타를 적중할 때까지 보존합니다."],["X 심판","원형 지역에 다수의 칼을 쏟아붓습니다."],["R 검의 왈츠","10레벨부터 가까운 적부터 연속으로 빠르게 베어냅니다."]]},
  paladin:{name:"팔라딘",color:"#ffe48b",passive:"공격과 반격으로 콤보를 쌓아 성검의 공격 방식과 파동을 해방합니다.",skills:[["Q 성스러운 반격","방어 중 받은 피해를 무효화하고 넓게 반격합니다."],["E 연속 절단","전방을 빠르게 여러 번 베어 콤보를 쌓습니다."],["X 콤보 전환","현재 콤보 단계의 성검 공격을 사용합니다."],["R 한계 돌파","10레벨부터 최고 콤보 상태와 강화된 반격을 사용합니다."]]},
  arc:{name:"아크",color:"#ff8b32",passive:"광역 평타로 열기를 얻고 스킬 사용 시 열기를 소모해 위력을 높입니다.",skills:[["Q 일륜","원형 화염장을 펼쳐 적을 중앙으로 끌어당깁니다."],["E 홍염 파동","전방 넓은 범위를 강한 화염으로 휩씁니다."],["X 태양 낙하","지정 위치에 태양을 떨어뜨려 폭발시킵니다."],["R 초신성","10레벨부터 저장된 화염과 열기를 폭발시킵니다."]]},
  terra:{name:"테라",color:"#c5d965",passive:"평타로 진동을 모으며 진동 100에서만 스킬이 강화됩니다.",skills:[["Q 단층 붕괴","지면 균열로 적을 중앙에 모은 뒤 폭발시킵니다."],["E 암벽 융기","부서질 때까지 유지되는 실제 암석을 생성합니다."],["X 지각 압축","바위를 사방으로 파쇄해 넓은 범위를 공격합니다."],["R 대륙 분쇄","10레벨부터 직사각형 지각을 붕괴시키고 추가 바위를 생성합니다."]]},
  void:{name:"보이드",color:"#b665ff",passive:"지면과 적을 포식해 질량을 모으고 스킬 크기와 위력을 높입니다.",skills:[["Q 심층 포식","전방을 포식하고 적을 중심으로 끌어당깁니다."],["E 대지 방출","모든 질량을 소모해 직사각형 공허 지대를 만듭니다."],["X 지반 붕괴","설치된 지대를 폭파시켜 큰 피해를 줍니다."],["R 제어 불능","10레벨부터 적을 공격 불가 상태로 빨아들이는 거대한 특이점을 만듭니다."]]},
  carmilla:{name:"카르밀라",color:"#ff315d",passive:"공격한 자리에 핏방울을 남기고 회수해 회복과 혈월을 개방합니다.",skills:[["기본 공격","전방을 세 갈래 혈조로 베어 핏방울을 남깁니다."],["Q 피의 회수","바닥의 모든 핏방울을 되돌려 경로의 적을 공격하고 회복합니다."]]},
  vargas:{name:"바르가스",color:"#58f39a",passive:"적 처치 시 20% 확률로 최대 체력이 영구적으로 증가하며 성장에는 상한이 없습니다.",skills:[["기본 공격","거대한 심연의 건틀릿으로 전방을 휩쓸며 최대 체력에 비례한 피해를 줍니다."],["Q 생명 포식","주변 적을 끌어당기고 넓은 범위에 최대 체력 비례 피해를 줍니다."],["E 혈육 갑주","현재 체력 일부를 사용해 최대 체력에 비례한 보호막을 얻습니다."],["X 거신 강타","커서 방향으로 거대한 충격파를 내려찍습니다."],["R 불멸의 형상","10레벨부터 거신화하여 8초간 재생·범위·공격·성장량을 강화합니다."]]},
  echo:{name:"에코",color:"#65e8ff",passive:"공간에 남긴 균열이 가까이 겹치면 공간 매듭이 생성됩니다. 매듭 주변의 적은 균열 피해를 더 받습니다.",skills:[["기본 공격 · 균열","커서 방향으로 공간을 베어 지속되는 균열을 그립니다."],["Q · 절단","설치된 모든 균열을 동시에 닫아 경로의 적을 다시 공격합니다."],["E · 위상 전환","커서와 가까운 공간 매듭으로 순간이동하고 잠시 무적이 됩니다."],["R · 세계선 붕괴","10레벨부터 매듭 3개 이상일 때 모든 매듭을 연결해 접힌 공간을 붕괴시킵니다."]]},
  aria:{name:"아리아",color:"#ff83bd",passive:"공격한 자리에 몽환 토양을 남깁니다. 반복 공격하면 꽃이 성장하고 가까운 토양들은 화원으로 연결됩니다.",skills:[["기본 공격 · 개화","커서 위치에 꽃을 피워 원형 피해를 주고 토양을 최대 3단계까지 성장시킵니다."],["Q · 가시 성장","모든 토양에서 가시를 솟구쳐 주변 적을 공격하고 둔화시킵니다."],["E · 만개","커서와 가까운 연결 화원 전체를 거대한 꽃으로 피워 광역 피해를 줍니다."],["X · 정원 이동","가까운 화원에서 커서 방향의 화원으로 꽃잎이 되어 순간이동합니다."],["R · 영원한 봄","10레벨부터 토양이 사라지지 않고 평타가 여러 토양에서 동시에 피어납니다."]]},
  moira:{name:"모이라",color:"#ff315b",passive:"바늘에 맞은 적을 붉은 실로 연결하고, 한 적이 받은 고통의 일부를 다른 연결 대상에게 공유합니다.",skills:[["기본 공격 · 바늘땀","전방의 적에게 저주 바늘을 꽂고 붉은 실로 연결합니다."],["Q · 조종","연결된 적들을 커서 지점으로 강하게 끌어당깁니다."],["E · 대리 인형","커서 위치에 인형을 설치해 연결된 적이 받는 피해 일부를 저장합니다."],["X · 고통 전이","인형이 저장한 고통을 연결된 모든 적에게 동시에 폭발시킵니다."],["R · 꼭두각시 극장","10레벨부터 다수의 적을 연결하고 서로 충돌할 때마다 폭발시킵니다."]]},
  mare:{name:"마레",color:"#45dff0",passive:"물 공격을 반복 적중시키면 침수가 중첩됩니다. 교차한 해류는 합류 폭발을 일으킵니다.",skills:[["기본 공격 · 물길 가르기","전방에 지속되는 해류를 남겨 적을 운반합니다. 해류가 교차하면 광역 피해가 발생합니다."],["Q · 밀물","실제로 전진하는 거대한 파도가 닿은 적을 밀어내고 침수를 중첩합니다."],["E · 소용돌이 핵","물의 핵을 설치해 적을 끌어당깁니다. 다시 사용하면 핵이 폭발합니다."],["X · 수압","침수된 모든 적을 압축해 중첩에 비례한 피해를 줍니다."],["R · 세계를 삼킨 바다","10레벨부터 영체 고래를 직접 조종하며 강화 해류를 남깁니다. 종료 시 모든 해류가 모여 폭발합니다."]]},
};

function getCharacterPreviewSprite(id){return id==="default"?playerSprite:id==="suncall"?suncallSprite:id==="luminous"?luminousSprite:id==="yupiter"?yupiterSprite:id==="ren"?renSprite:id==="nightLord"?nightLordSprite:id==="zero"?zeroSprite:id==="paladin"?paladinSprite:id==="arc"?arcSprite:id==="terra"?terraSprite:id==="void"?voidSprite:id==="carmilla"?carmillaSprite:id==="echo"?echoSprite:id==="aria"?ariaSprite:id==="moira"?moiraSprite:id==="mare"?mareSprite:vargasSprite;}

const characterSkillVideoKeys = {
  default:["attack","reload"], suncall:["attack","reload"], luminous:["attack"],
  yupiter:["q","e-crescent","e-severing","e-flame","r-crescent","r-severing","r-flame"], ren:["q","x","e","r"], nightLord:["q","e","x","r"],
  zero:["q","e","x","r"], paladin:["q","e","x","r"], arc:["q","e","x","r"],
  terra:["q","e","x","r"], void:["q","e","x","r"], carmilla:["attack","q"],vargas:["attack","q","e","x","r"],echo:["attack","close","phase","r"],aria:["attack","q","e","x","r"],moira:["attack","q","e","x","r"],mare:["attack","q","e","x","r"]
};
const characterSkillVideoCache = new Map();
function getCharacterSkillVideo(id, skillIndex) {
  const key = characterSkillVideoKeys[id]?.[skillIndex];
  if (!key) return null;
  const path = `assets/skill-videos/${id}-${key}.webm?v=20260925-2`;
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
  const mobileDetail=typeof isMobileTouchDevice==="function"&&isMobileTouchDevice();ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="900 32px Arial";ctx.fillText(info.name,x+30,y+47);ctx.fillStyle=info.color;ctx.font="bold 13px Arial";ctx.fillText(mobileDetail?"길게 눌러 연 상세 정보  ·  × 닫기":"우클릭 상세 정보  ·  ESC 또는 × 닫기",x+30,y+70);
  const previewW=Math.min(540,w*(mobileDetail ? .48 : .54)),previewH=Math.min(440,h-(mobileDetail?100:120));const activeSkill=info.skills[Math.min(characterDetailSkillIndex,info.skills.length-1)];drawCharacterGameplayPreview(characterDetailId,characterDetailSkillIndex,activeSkill[0],x+26,y+92,previewW,previewH,info.color);
  const tx=x+previewW+(mobileDetail?42:52),tw=w-previewW-(mobileDetail?68:80);ctx.fillStyle="#f3f6ff";ctx.font=`bold ${mobileDetail?14:18}px Arial`;ctx.fillText("패시브",tx,y+(mobileDetail?88:108));ctx.fillStyle="#b9c5d8";ctx.font=`${mobileDetail?11:14}px Arial`;wrapTextLeft(info.passive,tx,y+(mobileDetail?108:136),tw,mobileDetail?15:22);
  characterDetailSkillRects=[];const compact=info.skills.length>5,itemH=mobileDetail?(compact?30:38):(compact?50:72),itemGap=mobileDetail?(compact?33:42):(compact?56:82);let sy=mobileDetail?(compact?y+126:y+154):(compact?y+174:y+202);for(let i=0;i<info.skills.length;i++){const skill=info.skills[i],selected=i===characterDetailSkillIndex,rect={x:tx,y:sy,w:tw,h:itemH};characterDetailSkillRects.push(rect);const hover=pointInRect(mouse.x,mouse.y,rect);drawRoundedRect(tx,sy,tw,itemH,mobileDetail?8:12,selected?`${info.color}24`:(hover?"rgba(255,255,255,.075)":"rgba(255,255,255,.035)"),selected?info.color:`${info.color}55`,selected?2:1);ctx.fillStyle=info.color;ctx.font=`bold ${mobileDetail?10:(compact?13:15)}px Arial`;ctx.fillText(`${selected?"▶ ":""}${skill[0]}`,tx+9,sy+(mobileDetail?13:(compact?18:23)));ctx.fillStyle="#c9d2e2";ctx.font=`${mobileDetail?9:(compact?11:13)}px Arial`;wrapTextLeft(skill[1],tx+9,sy+(mobileDetail?27:(compact?36:46)),tw-18,mobileDetail?11:(compact?14:18));sy+=itemGap;}
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
  const maxCardsPerRow = 4;
  const characterIds = ["default", "suncall", "luminous", "yupiter", "ren", "nightLord", "zero", "paladin", "arc", "terra", "void","carmilla","vargas","echo","aria","moira","mare"];
  const cardW = Math.min(200, (canvas.width - 48 - gap * (maxCardsPerRow - 1)) / maxCardsPerRow);
  const y = 151;
  const rowCount = Math.ceil(characterIds.length / maxCardsPerRow);
  const cardH = 490;
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
    void: { color: "#b665ff", color2: "#32104f", role: "VOID DEVOURER", number: "11" },carmilla:{color:"#ff315d",color2:"#5c071d",role:"TRUE VAMPIRE",number:"12"},vargas:{color:"#58f39a",color2:"#4b1321",role:"ABYSSAL COLOSSUS",number:"13"},echo:{color:"#65e8ff",color2:"#6044a8",role:"DIMENSION TAILOR",number:"14"},aria:{color:"#ff83bd",color2:"#3d817d",role:"DREAM GARDENER",number:"15"},moira:{color:"#ff315b",color2:"#4d071d",role:"CURSED PUPPETEER",number:"16"},mare:{color:"#45dff0",color2:"#075772",role:"ABYSS CONDUCTOR",number:"17"}
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - 8, canvas.width, canvas.height - y + 8);
  ctx.clip();
  for (const card of characterCards) {
    const cardScale = 1;
    if (card.y + card.h < y - 8 || card.y > canvas.height) continue;
    const isSelected = selectedCharacter === card.id;
    const unlocked = card.id === "default" || card.id === "yupiter" || card.id === "ren" || card.id === "nightLord" || card.id === "zero" || card.id === "paladin" || card.id === "arc" || card.id === "terra" || card.id === "void"||card.id==="carmilla"||card.id==="vargas"||card.id==="echo"||card.id==="aria"||card.id==="moira"||card.id==="mare" || (card.id === "suncall" ? isSuncallUnlocked() : isLuminousUnlocked());
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

    const sprite = getCharacterPreviewSprite(card.id);
    const loaded = sprite&&sprite.complete&&sprite.naturalWidth>0;
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

    const name = characterSkillGuide[card.id]?.name||"기본 캐릭터";
    const passive = `패시브: ${characterSkillGuide[card.id]?.passive||"기본 능력치"}`;
    ctx.fillStyle = unlocked ? "#f4f7ff" : "#777d88";
    ctx.font = `bold ${Math.max(12, (card.w < 145 ? 16 : 23) * Math.min(1, cardScale + .12))}px Arial`;
    ctx.fillText(name, card.x + card.w / 2, displayY + 252 * cardScale);
    ctx.fillStyle = unlocked ? theme.color : "#59606d";
    ctx.fillRect(card.x + card.w / 2 - 18, displayY + 266 * cardScale, 36, 2);
    ctx.font = `${Math.max(8, (card.w < 145 ? 11 : 14) * Math.min(1, cardScale + .18))}px Arial`;
    ctx.fillStyle = unlocked ? "#b7c7df" : "#747985";
    const passiveLineHeight = card.w < 145 ? 14 : 18;
    wrapText(passive, card.x + card.w / 2, displayY + 287 * cardScale, card.w - 24, passiveLineHeight);

    if (unlocked) {
      ctx.fillStyle="rgba(218,226,242,.52)";ctx.font=`bold ${card.w < 145 ? 9 : 10}px Arial`;ctx.fillText(typeof isMobileTouchDevice==="function"&&isMobileTouchDevice()?"길게 누르기: 스킬 보기":"우클릭: 스킬 보기",card.x+card.w/2,displayY+425*cardScale);
      drawRoundedRect(card.x + 16, displayY + 440 * cardScale, card.w - 32, Math.max(20, 31 * cardScale), 15, isSelected ? `${theme.color}28` : "rgba(255,255,255,0.035)", isSelected ? theme.color : "rgba(255,255,255,0.12)", 1);
      ctx.fillStyle = isSelected ? theme.color : "rgba(224,231,244,0.62)";
      ctx.font = `bold ${card.w < 145 ? 10 : 13}px Arial`;
      ctx.fillText(isSelected ? "✓ 현재 선택됨" : "선택하기", card.x + card.w / 2, displayY + 461 * cardScale);
    } else {
      const unlockKills = card.id === "luminous" ? 1000 : 200;
      const remaining = Math.max(0, unlockKills - totalZombieKills);
      const progress = Math.min(1, totalZombieKills / unlockKills);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(card.x + 18, displayY + 440 * cardScale, card.w - 36, 4);
      ctx.fillStyle = "#ff657e";
      ctx.fillRect(card.x + 18, displayY + 440 * cardScale, (card.w - 36) * progress, 4);
      ctx.fillStyle = "#e0798b";
      ctx.font = `bold ${card.w < 145 ? 9 : (card.w < 210 ? 12 : 13)}px Arial`;
      ctx.fillText(`🔒 ${remaining} 처치 남음`, card.x + card.w / 2, displayY + 464 * cardScale);
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
  const mobileUpgrade = typeof isMobileTouchDevice === "function" && isMobileTouchDevice() && canvas.height < 520;

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
  ctx.font = `bold ${mobileUpgrade ? 24 : 36}px Arial`;
  ctx.fillText("증강 선택", canvas.width / 2, mobileUpgrade ? 34 : 72);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(225,235,255,0.76)";
  ctx.font = `${mobileUpgrade ? 11 : 15}px Arial`;
  ctx.fillText(
    player.level >= 5 && player.level % 5 === 0
      ? "전투 증강 · 하나를 선택해 즉시 활성화하세요"
      : "보조 증강 · 하나를 선택해 생존 능력을 강화하세요",
    canvas.width / 2,
    mobileUpgrade ? 55 : 103
  );

  const gap = mobileUpgrade ? Math.max(8, Math.min(14, canvas.width * 0.014)) : Math.max(14, Math.min(30, canvas.width * 0.02));
  const cardW = Math.min(mobileUpgrade ? 280 : 300, (canvas.width - (mobileUpgrade ? 30 : 56) - gap * 2) / 3);
  const cardH = mobileUpgrade ? Math.min(306, canvas.height - 82) : Math.min(410, canvas.height - 170);
  const totalW = cardW * upgradeChoices.length + gap * Math.max(0, upgradeChoices.length - 1);
  const startX = canvas.width / 2 - totalW / 2;
  const baseY = mobileUpgrade ? 68 + Math.max(0, (canvas.height - 74 - cardH) / 2) : 126 + Math.max(0, (canvas.height - 126 - cardH) / 2 - 12);

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

    const badgeW = Math.min(mobileUpgrade ? 104 : 118, cardW - (mobileUpgrade ? 28 : 44));
    const badgeY = y + (mobileUpgrade ? 10 : 18), badgeH = mobileUpgrade ? 22 : 26;
    drawRoundedRect(x + cardW / 2 - badgeW / 2, badgeY, badgeW, badgeH, badgeH / 2, "rgba(0,0,0,0.42)", stroke, 1);
    ctx.fillStyle = accent;
    ctx.font = `bold ${mobileUpgrade ? 10 : 12}px Arial`;
    ctx.fillText(u.category === "emerald" ? "에메랄드" : (u.category === "combat" ? "전투 증강" : (isTranscendReady ? "초월 증강" : "보조 증강")), x + cardW / 2, badgeY + (mobileUpgrade ? 15 : 18));

    const iconSize = Math.min(mobileUpgrade ? 84 : 124, cardW * (mobileUpgrade ? 0.38 : 0.46), cardH * (mobileUpgrade ? 0.29 : 0.32));
    const iconX = x + cardW / 2 - iconSize / 2;
    const iconY = y + (mobileUpgrade ? 40 : 57);
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

    const titleY = iconY + iconSize + (mobileUpgrade ? 23 : 30);
    ctx.fillStyle = "#fff8e8";
    ctx.font = `bold ${mobileUpgrade ? Math.max(14, Math.min(18, cardW * 0.068)) : Math.max(16, Math.min(21, cardW * 0.072))}px Arial`;
    ctx.fillText(title, x + cardW / 2, titleY);
    ctx.fillStyle = "rgba(235,239,250,0.82)";
    ctx.font = `${mobileUpgrade ? Math.max(10, Math.min(12, cardW * 0.048)) : Math.max(12, Math.min(15, cardW * 0.052))}px Arial`;
    wrapText(desc, x + cardW / 2, titleY + (mobileUpgrade ? 25 : 34), cardW - (mobileUpgrade ? 24 : 34), mobileUpgrade ? 16 : 20);

    ctx.fillStyle = isTranscendReady ? accent : "rgba(205,211,226,0.66)";
    ctx.font = `${mobileUpgrade ? 10 : 13}px Arial`;
    let statusText = `선택 횟수: ${count}/4`;
    if (isSkillUpgrade) statusText = "1회 선택 · 즉시 활성화";
    else if (isTranscendReady) statusText = "이번 선택 시 초월 발동";
    ctx.fillText(statusText, x + cardW / 2, y + cardH - (mobileUpgrade ? 13 : 27));

    if (!mobileUpgrade) {
      ctx.fillStyle = accent;
      ctx.font = "bold 13px Arial";
      ctx.fillText(`[ ${i + 1} ]`, x + cardW / 2, y + cardH - 8);
    }
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
  if (id === "immortal" && immortalIconLoaded) {
    ctx.drawImage(immortalIcon, x, y, size, size);
    return;
  }
  if(id==="mareDepth"||id==="mareCurrent"||id==="mareFoam"){if(mareAugmentIconAtlas.complete&&mareAugmentIconAtlas.naturalWidth){const col={mareDepth:0,mareCurrent:1,mareFoam:2}[id],row=transcendent?1:0,sw=mareAugmentIconAtlas.naturalWidth/3,sh=mareAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(mareAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if(id==="moiraThread"||id==="moiraNeedle"||id==="moiraDoll"){if(moiraAugmentIconAtlas.complete&&moiraAugmentIconAtlas.naturalWidth){const col={moiraThread:0,moiraNeedle:1,moiraDoll:2}[id],row=transcendent?1:0,sw=moiraAugmentIconAtlas.naturalWidth/3,sh=moiraAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(moiraAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if(id==="ariaSoil"||id==="ariaThorn"||id==="ariaNight"){if(ariaAugmentIconAtlas.complete&&ariaAugmentIconAtlas.naturalWidth){const col={ariaSoil:0,ariaThorn:1,ariaNight:2}[id],row=transcendent?1:0,sw=ariaAugmentIconAtlas.naturalWidth/3,sh=ariaAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(ariaAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if(id==="echoAfterimage"||id==="echoPitch"||id==="echoArchive"){if(echoAugmentIconAtlas.complete&&echoAugmentIconAtlas.naturalWidth){const col={echoAfterimage:0,echoPitch:1,echoArchive:2}[id],row=transcendent?1:0,sw=echoAugmentIconAtlas.naturalWidth/3,sh=echoAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(echoAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
  if(id==="vargasPredator"||id==="vargasSkeleton"||id==="vargasPulse"){if(vargasAugmentIconAtlas.complete&&vargasAugmentIconAtlas.naturalWidth){const col={vargasPredator:0,vargasSkeleton:1,vargasPulse:2}[id],row=transcendent?1:0,sw=vargasAugmentIconAtlas.naturalWidth/3,sh=vargasAugmentIconAtlas.naturalHeight/2;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.drawImage(vargasAugmentIconAtlas,col*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}}
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

function wrapTextClamped(text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trim()}…`;
  }
  ctx.textAlign = "center";
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
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
