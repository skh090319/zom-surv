// 게임 초기화와 메인 루프

function draw() {
  if (screenMode === "home") {
    drawHomeScreen();
    return;
  }

  if (screenMode === "character") {
    drawCharacterSelectScreen();
    return;
  }

  drawBackground();
  drawStickyZones();
  drawFireTrails();
  drawParticles();
  drawTimeRewindEffect();
  drawRenEffects();
  drawNightLordEffects();
  drawZeroEffects();
  drawPaladinEffects();
  drawArcEffects();
  drawTerraEffects();
  drawVoidEffects();
  drawVoidUltimateDarkness();
  drawVoidUltimateDetail();
  drawCarmillaEffects();
  drawCarmillaPolish();
  drawVargasEffectsV2();
  drawEchoEffects();
  drawItems();
  drawExpOrbs();
  drawBullets();
  drawCrescentBlades();
  drawLaserSlashes();
  drawGravityFields();
  drawDroneBullets();
  drawZombies();
  drawDaggers();
  drawPlayer();
  drawRenAttackOverlay();
  drawYupiterWeapons();
  drawHealthBar();
  drawHUD();
  drawYupiterInterface();
  drawRenInterface();
  drawNightLordInterface();
  drawZeroInterface();
  drawPaladinInterface();
  drawArcInterface();
  drawTerraInterface();
  drawVoidInterface();
  drawCarmillaInterface();
  drawVargasInterface();
  drawEchoInterface();
  drawReloadingOverlay();
  drawExpBar();
  drawMiniMap();
  drawVisionEffect();
  drawUpgradeMenu();
  drawGameOver();
  drawPauseOverlay();
  drawPauseButton();
}

function restart() {
  // 기본 능력치 초기화
  player.x = WORLD.width / 2;
  player.y = WORLD.height / 2;
  player.speed = selectedCharacter === "suncall" ? 4.2 * 1.15 : 4.2;

  player.maxHp = selectedCharacter === "ren" ? 50 : (selectedCharacter === "nightLord" ? 150 : (selectedCharacter === "paladin" ? 125 : (selectedCharacter === "vargas" ? 180 : 100)));
  player.hp = player.maxHp;

  player.maxAmmo = selectedCharacter === "luminous" ? 8 : 12;
  player.ammo = player.maxAmmo;
  // 유피테르는 세 무기 모두 다른 캐릭터의 두 배인 기본 공격력을 사용한다.
  player.damage = selectedCharacter === "yupiter" ? 70 : (selectedCharacter === "zero" ? 45 : (selectedCharacter === "paladin" ? 42 : 35));
  player.fireRateBonus = 0;
  player.reloadTime = 0;
  player.fireCooldown = 0;
  player.luminousAttackTime = 0;
  player.luminousAttackAngle = 0;

  player.score = 0;
  player.level = 1;
  player.exp = 0;
  player.expNeed = 3;
  player.kills = 0;

  player.invincibleTime = 0;

  // 일반/초월 증강 효과 초기화
  player.stickyLevel = 0;
  player.ricochetLevel = 0;
  player.explosionLevel = 0;
  player.daggerLevel = 0;
  player.regenLevel = 0;
  player.gatlingLevel = 0;
  player.fireTrailLevel = 0;

  player.globalDamageMultiplier = 1;

  // 전투 증강 효과 초기화
  player.visionLevel = 0;
  player.visionTimer = 600;

  player.quantumLevel = 0;
  player.quantumTimer = 240;
  player.quantumAngle = 0;

  player.gravityLevel = 0;
  player.gravityTimer = 720;

  player.droneLevel = 0;
  player.droneTimer = 12;
  player.droneBLevel = 0;
  player.droneBTimer = 18;
  player.worldEnderLevel = 0;
  player.timeRewindLevel = 0;
  player.timeRewindTimer = 1200;
  player.timeRewindEffectTime = 0;
  player.yupiterWeapon = 0;
  player.yupiterSkillCooldowns = [0, 0, 0];
  player.yupiterUltimateCooldown = 0;
  player.crescentUltimateTime = 0;
  player.severingUltimateTime = 0;
  player.crescentOverdriveTime = 0;
  player.crescentReturnMultiplier = 1;
  player.crescentMartialLawLevel = 0;
  player.swordAuraLevel = 0;
  player.trackerLevel = 0;
  player.severingFrenzyTime = 0;
  player.renShards = 0;
  player.renAfterimageLevel = 0;
  player.renDarkDevourLevel = 0;
  player.renTotalEclipseLevel = 0;
  player.renReaperFootstepsLevel = 0;
  player.renSwapCooldown = 0;
  player.renDeployCooldown = 0;
  player.renSkillCooldown = 0;
  player.renUltimateCooldown = 0;
  player.renUltimateTime = 0;
  player.renUltimateStrikeTimer = 0;
  player.renUltimateX = 0;
  player.renUltimateY = 0;
  player.renSwapTrailTime = 0;
  player.renSwapStartX = 0;
  player.renSwapStartY = 0;
  player.renSwapEndX = 0;
  player.renSwapEndY = 0;
  player.nightLordQCooldown = 0;
  player.nightLordECooldown = 0;
  player.nightLordXCooldown = 0;
  player.nightLordRCooldown = 0;
  player.nightLordFrenzyTime = 0;
  player.nightLordUltimateTime = 0;
  player.nightLordChaseHasteTime = 0;
  player.nightLordSpinTimer = 0;
  player.nightLordAttackDirection = 1;
  player.nightLordReachLevel = 0;
  player.nightLordBloodLevel = 0;
  player.nightLordExecutionLevel = 0;
  player.zeroQCooldown = 0;
  player.zeroECooldown = 0;
  player.zeroXCooldown = 0;
  player.zeroRCooldown = 0;
  player.zeroVitalTime = 0;
  player.zeroUltimateTime = 0;
  player.zeroUltimateStrikeTimer = 0;
  player.zeroEmpoweredAttack = false;
  player.zeroThrustLevel = 0;
  player.zeroVitalLevel = 0;
  player.zeroJudgmentLevel = 0;
  player.paladinCombo = 0;
  player.paladinComboTimer = 0;
  player.paladinComboDecayTimer = 0;
  player.paladinAttackCounter = 0;
  player.paladinQCooldown = 0;
  player.paladinGuardTime = 0;
  player.paladinGuardTriggered = false;
  player.paladinCounterGraceTime = 0;
  player.paladinECooldown = 0;
  player.paladinXCooldown = 0;
  player.paladinRCooldown = 0;
  player.paladinUltimateTime = 0;
  player.paladinComboLevel = 0;
  player.paladinSpeedLevel = 0;
  player.paladinReleaseLevel = 0;
  player.arcHeat = 0;
  player.arcHeatDelay = 0;
  player.arcQCooldown = 0;
  player.arcECooldown = 0;
  player.arcXCooldown = 0;
  player.arcRCooldown = 0;
  player.arcBrandLevel = 0;
  player.arcCoronaLevel = 0;
  player.arcHeatLevel = 0;
  player.terraVibration = 0;
  player.terraVibrationDelay = 0;
  player.terraAttackCounter = 0;
  player.terraQCooldown = 0;
  player.terraECooldown = 0;
  player.terraXCooldown = 0;
  player.terraRCooldown = 0;
  player.terraResonanceLevel = 0;
  player.terraFaultLevel = 0;
  player.terraRampartLevel = 0;
  player.voidMass=0;player.voidQCooldown=0;player.voidECooldown=0;player.voidXCooldown=0;player.voidRCooldown=0;player.voidUltimateTime=0;player.voidUltimateTick=0;player.voidCapacityLevel=0;player.voidTerrainLevel=0;player.voidChainLevel=0;
  player.carmillaQCooldown=0;player.carmillaBloodMoonTime=0;player.carmillaFeastLevel=0;player.carmillaPreserveLevel=0;player.carmillaResonanceLevel=0;
  player.vargasGainedHp=0;player.vargasShield=0;player.vargasArmorTime=0;player.vargasUltimateTime=0;player.vargasQCooldown=0;player.vargasECooldown=0;player.vargasXCooldown=0;player.vargasRCooldown=0;player.vargasSecondHeartCooldown=0;player.vargasPredatorLevel=0;player.vargasSkeletonLevel=0;player.vargasPulseLevel=0;vargasEffects=[];
  player.echoReplayCooldown=0;player.echoPhaseCooldown=0;player.echoCollapseCooldown=0;player.echoSwingSide=-1;player.echoAfterimageLevel=0;player.echoPitchLevel=0;player.echoArchiveLevel=0;echoRifts=[];echoKnots=[];echoEffects=[];

  player.dodgeLevel = 0;
  player.crownLevel = 0;
  player.maliciousProfitLevel = 0;

  // 탐욕/흡혈/불사 초기화
  player.greedLevel = 0;
  player.lifeStealLevel = 0;
  player.immortalLevel = 0;
  player.immortalUsed = false;

  player.lastFireTrailX = null;
  player.lastFireTrailY = null;

  // 선택 횟수 초기화
  for (const key of Object.keys(upgradeCount)) {
    upgradeCount[key] = 0;
  }

  // 초월/1회성 획득 상태 초기화
  for (const key of Object.keys(transcended)) {
    transcended[key] = false;
  }

  // 게임 오브젝트 전체 초기화
  bullets = [];
  zombies = [];
  particles = [];
  items = [];
  expOrbs = [];
  stickyZones = [];
  fireTrails = [];
  daggers = [];
  crescentBlades = [];
  yupiterSlashes = [];
  flameProjectiles = [];
  flameExplosions = [];
  flameUltimateOrbs = [];
  flameUltimateShots = [];
  renAttackEffects = [];
  renShadowFields = [];
  renShadowShards = [];
  renShadowShardBuckets = new Map();
  renPlacedClones = [];
  renFlyingClones = [];
  renRecallingClones = [];
  nightLordEffects = [];
  zeroEffects = [];
  paladinEffects = [];
  arcProjectiles = [];
  arcZones = [];
  arcEffects = [];
  terraStructures = [];
  terraEffects = [];
  terraRockProjectiles = [];
  voidTerrains = [];
  voidEffects = [];
  bloodDrops=[];bloodEffects=[];
  laserSlashes = [];
  gravityFields = [];
  droneBullets = [];

  // 전역 상태 초기화
  wave = 1;
  gameOver = false;
  paused = false;

  spawnTimer = 0;
  itemSpawnTimer = 180;
  zombieSlowTimer = 0;
  visionEffectTime = 0;
  upgradeAnimTime = 0;
  upgradeSelectionEffect = null;

  choosingUpgrade = false;
  upgradeChoices = [];
  upgradeCardRects = [];

  // 이전 판에서 선택한 증강 목록 제거
  selectedAugments = [];
  pauseAugmentCardRects = [];
  selectedPauseAugmentId = null;

  // 입력 상태 초기화
  mouse.down = false;

  for (const key of Object.keys(keys)) {
    keys[key] = false;
  }

  updateCamera();
  screenToWorld();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}


restart();
screenMode = "home";
paused = false;
loop();
