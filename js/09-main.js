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
  drawItems();
  drawExpOrbs();
  drawBullets();
  drawLaserSlashes();
  drawGravityFields();
  drawDroneBullets();
  drawZombies();
  drawDaggers();
  drawPlayer();
  drawHealthBar();
  drawHUD();
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

  player.hp = 100;
  player.maxHp = 100;

  player.ammo = 12;
  player.maxAmmo = 12;
  player.damage = 35;
  player.fireRateBonus = 0;
  player.reloadTime = 0;
  player.fireCooldown = 0;

  player.score = 0;
  player.level = 1;
  player.exp = 0;
  player.expNeed = 4;
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

  choosingUpgrade = false;
  upgradeChoices = [];
  upgradeCardRects = [];

  // 이전 판에서 선택한 증강 목록 제거
  selectedAugments = [];

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
