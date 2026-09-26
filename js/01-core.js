// 캔버스, 이미지, 전역 상태, 공통 계산

const canvas = document.getElementById("game");
// 불투명 캔버스는 유지하되 desynchronized 모드는 일부 GPU에서
// 화면 깜빡임/티어링을 만들 수 있어 사용하지 않는다.
const ctx = canvas.getContext("2d", { alpha: false });

const playerSprite = new Image();
playerSprite.src = "player.webp";
let playerSpriteLoaded = false;
playerSprite.onload = () => {
  playerSpriteLoaded = true;
};

const suncallSprite = new Image();
suncallSprite.src = "suncall.webp";
let suncallSpriteLoaded = false;
suncallSprite.onload = () => {
  suncallSpriteLoaded = true;
};

const luminousSprite = new Image();
luminousSprite.src = "assets/luminous.webp";
let luminousSpriteLoaded = false;
luminousSprite.onload = () => {
  luminousSpriteLoaded = true;
};

const luminousAttackSprite = new Image();
luminousAttackSprite.src = "assets/luminous-attack.webp";
let luminousAttackSpriteLoaded = false;
luminousAttackSprite.onload = () => {
  luminousAttackSpriteLoaded = true;
};

const luminousBulletSprite = new Image();
luminousBulletSprite.src = "assets/luminous-bullet.webp";
let luminousBulletSpriteLoaded = false;
luminousBulletSprite.onload = () => {
  luminousBulletSpriteLoaded = true;
};

const yupiterSprite = new Image();
yupiterSprite.src = "assets/yupiter.webp";
let yupiterSpriteLoaded = false;
yupiterSprite.onload = () => {
  yupiterSpriteLoaded = true;
};

const yupiterCrescentSprite = new Image();
yupiterCrescentSprite.src = "assets/yupiter-crescent.webp";
let yupiterCrescentSpriteLoaded = false;
yupiterCrescentSprite.onload = () => { yupiterCrescentSpriteLoaded = true; };

const yupiterCrescentThrownSprite = new Image();
yupiterCrescentThrownSprite.src = "assets/yupiter-crescent-thrown.webp";
let yupiterCrescentThrownSpriteLoaded = false;
yupiterCrescentThrownSprite.onload = () => { yupiterCrescentThrownSpriteLoaded = true; };

const yupiterSeveringSprite = new Image();
yupiterSeveringSprite.src = "assets/yupiter-severing.webp";
let yupiterSeveringSpriteLoaded = false;
yupiterSeveringSprite.onload = () => { yupiterSeveringSpriteLoaded = true; };

const yupiterFlameSprite = new Image();
yupiterFlameSprite.src = "assets/yupiter-flame.webp";
let yupiterFlameSpriteLoaded = false;
yupiterFlameSprite.onload = () => { yupiterFlameSpriteLoaded = true; };

const yupiterHudPortrait = new Image();
yupiterHudPortrait.src = "assets/yupiter-hud-portrait-user.webp";

const yupiterUltimateIcon = new Image();
yupiterUltimateIcon.src = "assets/yupiter-ultimate-icon-user.webp";

const yupiterESkillIcons = [
  "assets/yupiter-e-crescent.webp",
  "assets/yupiter-e-severing.webp",
  "assets/yupiter-e-flame.webp"
].map(source => {
  const image = new Image();
  image.src = source;
  return image;
});

const renSprite = new Image();
renSprite.src = "assets/ren.webp";
let renSpriteLoaded = false;
renSprite.onload = () => { renSpriteLoaded = true; };

const renAttackSprite = new Image();
renAttackSprite.src = "assets/ren-attack.webp";
let renAttackSpriteLoaded = false;
renAttackSprite.onload = () => { renAttackSpriteLoaded = true; };

const nightLordSprite = new Image();
nightLordSprite.src = "assets/night-lord.webp";
let nightLordSpriteLoaded = false;
nightLordSprite.onload = () => { nightLordSpriteLoaded = true; };

const nightLordAttackSprite = new Image();
nightLordAttackSprite.src = "assets/night-lord-attack.webp";
let nightLordAttackSpriteLoaded = false;
nightLordAttackSprite.onload = () => { nightLordAttackSpriteLoaded = true; };

const nightLordSkillIcons = ["q", "e", "x", "r"].map(key => {
  const image = new Image();
  image.src = `assets/night-lord-skill-${key}.webp`;
  return image;
});

const nightLordAugmentIcons = {};
for (const [id, source] of Object.entries({
  nightReach: "assets/night-lord-augment-reach.webp",
  nightBlood: "assets/night-lord-augment-blood.webp",
  nightExecution: "assets/night-lord-augment-execution.webp",
  nightReachTranscend: "assets/night-lord-augment-purple-storm.webp",
  nightBloodTranscend: "assets/night-lord-augment-defy-death.webp",
  nightExecutionTranscend: "assets/night-lord-augment-slaughterer.webp"
})) {
  const image = new Image();
  image.src = source;
  nightLordAugmentIcons[id] = image;
}

const zeroSprite = new Image();
zeroSprite.src = "assets/zero.webp";
let zeroSpriteLoaded = false;
zeroSprite.onload = () => { zeroSpriteLoaded = true; };

const zeroSkillIcons = ["q", "e", "x", "r"].map(key => {
  const image = new Image();
  image.src = `assets/zero-skill-${key}.webp`;
  return image;
});

const zeroAugmentIcons = {};
for (const [id, source] of Object.entries({
  zeroThrust: "assets/zero-augment-thrust.webp",
  zeroVital: "assets/zero-augment-vital.webp",
  zeroJudgment: "assets/zero-augment-judgment.webp",
  zeroThrustTranscend: "assets/zero-augment-horizon.webp",
  zeroVitalTranscend: "assets/zero-attack.webp",
  zeroJudgmentTranscend: "assets/zero-augment-eternal.webp"
})) {
  const image = new Image();
  image.src = source;
  zeroAugmentIcons[id] = image;
}

const paladinSprite = new Image();
paladinSprite.src = "assets/paladin.webp";
let paladinSpriteLoaded = false;
paladinSprite.onload = () => { paladinSpriteLoaded = true; };

const paladinSkillIcons = ["q", "e", "x", "r"].map(key => {
  const image = new Image();
  image.src = `assets/paladin-skill-${key}.webp`;
  return image;
});

const paladinAugmentIcons = {};
for (const id of ["combo", "speed", "release"]) {
  const normal = new Image(); normal.src = `assets/paladin-augment-${id}.webp`;
  const transcend = new Image(); transcend.src = `assets/paladin-augment-${id}-transcend.webp`;
  paladinAugmentIcons[`paladin${id[0].toUpperCase()}${id.slice(1)}`] = normal;
  paladinAugmentIcons[`paladin${id[0].toUpperCase()}${id.slice(1)}Transcend`] = transcend;
}

const arcSprite = new Image();
arcSprite.src = "assets/arc.webp";
let arcSpriteLoaded = false;
arcSprite.onload = () => { arcSpriteLoaded = true; };
const arcSkillIconAtlas = new Image();
arcSkillIconAtlas.src = "assets/arc-skill-icons.webp";
const arcAugmentIconAtlas = new Image();
arcAugmentIconAtlas.src = "assets/arc-augment-icons.webp";
const terraSprite = new Image();
terraSprite.src = "assets/terra.webp";
let terraSpriteLoaded = false;
terraSprite.onload = () => { terraSpriteLoaded = true; };
const terraSkillIconAtlas = new Image();
terraSkillIconAtlas.src = "assets/terra-skill-icons.webp";
const terraAugmentIconAtlas = new Image();
terraAugmentIconAtlas.src = "assets/terra-augment-icons.webp";
const terraRockAtlas = new Image();
terraRockAtlas.src = "assets/terra-rock-atlas.webp";
let terraRockAtlasLoaded = false;
terraRockAtlas.onload = () => { terraRockAtlasLoaded = true; };
const voidSprite = new Image(); voidSprite.src = "assets/void.webp";
let voidSpriteLoaded = false; voidSprite.onload = () => { voidSpriteLoaded = true; };
const voidSkillIconAtlas = new Image(); voidSkillIconAtlas.src = "assets/void-skill-icons.webp";
const voidAugmentIconAtlas = new Image(); voidAugmentIconAtlas.src = "assets/void-augment-icons.webp";
const carmillaSprite=new Image();carmillaSprite.src="assets/carmilla.webp";let carmillaSpriteLoaded=false;carmillaSprite.onload=()=>carmillaSpriteLoaded=true;
const carmillaSkillIconAtlas=new Image();carmillaSkillIconAtlas.src="assets/carmilla-skill-icons.webp";
const carmillaAugmentIconAtlas=new Image();carmillaAugmentIconAtlas.src="assets/carmilla-augment-icons.webp";
const vargasSprite=new Image();vargasSprite.src="assets/vargas.webp";let vargasSpriteLoaded=false;vargasSprite.onload=()=>vargasSpriteLoaded=true;
const vargasSkillIconAtlas=new Image();vargasSkillIconAtlas.src="assets/vargas-skill-icons.webp";
const vargasAugmentIconAtlas=new Image();vargasAugmentIconAtlas.src="assets/vargas-augment-icons.webp";
const echoSprite=new Image();echoSprite.src="assets/echo.webp";let echoSpriteLoaded=false;echoSprite.onload=()=>echoSpriteLoaded=true;
const echoSkillIconAtlas=new Image();echoSkillIconAtlas.src="assets/echo-skill-icons.webp";
const echoAugmentIconAtlas=new Image();echoAugmentIconAtlas.src="assets/echo-augment-icons.webp";
const ariaSprite=new Image();ariaSprite.src="assets/aria.webp";let ariaSpriteLoaded=false;ariaSprite.onload=()=>ariaSpriteLoaded=true;
const ariaSkillIconAtlas=new Image();ariaSkillIconAtlas.src="assets/aria-skill-icons.webp";
const ariaAugmentIconAtlas=new Image();ariaAugmentIconAtlas.src="assets/aria-augment-icons.webp";
const moiraSprite=new Image();moiraSprite.src="assets/moira.webp";let moiraSpriteLoaded=false;moiraSprite.onload=()=>moiraSpriteLoaded=true;
const moiraSkillIconAtlas=new Image();moiraSkillIconAtlas.src="assets/moira-skill-icons.webp";
const moiraAugmentIconAtlas=new Image();moiraAugmentIconAtlas.src="assets/moira-augment-icons.webp";
const mareSprite=new Image();mareSprite.src="assets/mare.webp";let mareSpriteLoaded=false;mareSprite.onload=()=>mareSpriteLoaded=true;
const mareSkillIconAtlas=new Image();mareSkillIconAtlas.src="assets/mare-skill-icons.webp";
const mareAugmentIconAtlas=new Image();mareAugmentIconAtlas.src="assets/mare-augment-icons.webp";
const mareLeviathanSprite=new Image();mareLeviathanSprite.src="assets/mare-leviathan.webp";let mareLeviathanLoaded=false;mareLeviathanSprite.onload=()=>mareLeviathanLoaded=true;

const renHudPortrait = new Image();
renHudPortrait.src = "assets/ren-hud-portrait.webp";

const renSkillIcons = ["q-deploy", "x", "e", "r"].map(key => {
  const image = new Image();
  image.src = `assets/ren-skill-${key}.webp`;
  return image;
});

const renShadowShardSprite = new Image();
renShadowShardSprite.src = "assets/ren-shadow-shard.webp";
let renShadowShardSpriteLoaded = false;
renShadowShardSprite.onload = () => { renShadowShardSpriteLoaded = true; };

const renAugmentIcons = {};
for (const [id, source] of Object.entries({
  afterimage: "assets/ren-augment-afterimage.webp",
  darkDevour: "assets/ren-augment-dark-devour.webp",
  totalEclipse: "assets/ren-augment-total-eclipse.webp",
  reaperFootsteps: "assets/ren-augment-reaper-footsteps.webp"
})) {
  const image = new Image();
  image.src = source;
  renAugmentIcons[id] = image;
}

const crescentBladeSprite = new Image();
crescentBladeSprite.src = "assets/crescent-blade.webp";
let crescentBladeSpriteLoaded = false;
crescentBladeSprite.onload = () => {
  crescentBladeSpriteLoaded = true;
};

const severingBladeSprite = new Image();
severingBladeSprite.src = "assets/severing-blade.webp";
let severingBladeSpriteLoaded = false;
severingBladeSprite.onload = () => { severingBladeSpriteLoaded = true; };

const flameCannonSprite = new Image();
flameCannonSprite.src = "assets/flame-cannon.webp";
let flameCannonSpriteLoaded = false;
flameCannonSprite.onload = () => { flameCannonSpriteLoaded = true; };

const martialLawIcon = new Image();
martialLawIcon.src = "assets/augment-martial-law.webp";
let martialLawIconLoaded = false;
martialLawIcon.onload = () => { martialLawIconLoaded = true; };
const swordAuraIcon = new Image();
swordAuraIcon.src = "assets/augment-sword-aura.webp";
let swordAuraIconLoaded = false;
swordAuraIcon.onload = () => { swordAuraIconLoaded = true; };
const trackerIcon = new Image();
trackerIcon.src = "assets/augment-tracker.webp";
let trackerIconLoaded = false;
trackerIcon.onload = () => { trackerIconLoaded = true; };

const gunSprite = new Image();
gunSprite.src = "gun.webp";
let gunSpriteLoaded = false;
gunSprite.onload = () => {
  gunSpriteLoaded = true;
};

const backgroundImage = new Image();
backgroundImage.src = "background.webp";
let backgroundLoaded = false;
backgroundImage.onload = () => {
  backgroundLoaded = true;
};

const lobbyBackgroundImage = new Image();
lobbyBackgroundImage.src = "assets/lobby-background-v1.webp";
let lobbyBackgroundLoaded = false;
lobbyBackgroundImage.onload = () => { lobbyBackgroundLoaded = true; };

const lobbyButtonPanelImage = new Image();
lobbyButtonPanelImage.src = "assets/lobby-button-panel-v1.webp";
let lobbyButtonPanelLoaded = false;
lobbyButtonPanelImage.onload = () => { lobbyButtonPanelLoaded = true; };

const augmentIconAtlas = new Image();
augmentIconAtlas.src = "assets/augment-icons.webp";
let augmentIconAtlasLoaded = false;
augmentIconAtlas.onload = () => {
  augmentIconAtlasLoaded = true;
};

const immortalIcon = new Image();
immortalIcon.src = "assets/augment-immortal.webp";
let immortalIconLoaded = false;
immortalIcon.onload = () => {
  immortalIconLoaded = true;
};

const magnetItemSprite = new Image();
magnetItemSprite.src = "assets/item-magnet.webp";
let magnetItemSpriteLoaded = false;
magnetItemSprite.onload = () => { magnetItemSpriteLoaded = true; };

const zombieSpriteAtlas = new Image();
zombieSpriteAtlas.src = "assets/zombie-characters.webp";
let zombieSpriteAtlasLoaded = false;
zombieSpriteAtlas.onload = () => {
  zombieSpriteAtlasLoaded = true;
};

const transcendIconAtlas = new Image();
transcendIconAtlas.src = "assets/transcend-icons.webp";
let transcendIconAtlasLoaded = false;
transcendIconAtlas.onload = () => {
  transcendIconAtlasLoaded = true;
};

canvas.width = innerWidth;
canvas.height = innerHeight;

const WORLD = { width: 3600, height: 2400 };
const camera = { x: 0, y: 0 };

const keys = {};
const mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  worldX: 0,
  worldY: 0,
  down: false
};

const player = {
  x: WORLD.width / 2,
  y: WORLD.height / 2,
  r: 24,
  speed: 4.2,
  hp: 100,
  maxHp: 100,
  ammo: 12,
  maxAmmo: 12,
  damage: 35,
  fireRateBonus: 0,
  reloadTime: 0,
  fireCooldown: 0,
  luminousAttackTime: 0,
  luminousAttackAngle: 0,
  score: 0,
  level: 1,
  exp: 0,
  expNeed: 4,
  kills: 0,
  invincibleTime: 0,
  stickyLevel: 0,
  ricochetLevel: 0,
  explosionLevel: 0,
  daggerLevel: 0,
  regenLevel: 0,
  gatlingLevel: 0,
  globalDamageMultiplier: 1,
  visionLevel: 0,
  visionTimer: 600,
  quantumLevel: 0,
  quantumTimer: 240,
  quantumAngle: 0,
  greedLevel: 0,
  lifeStealLevel: 0,
  gravityLevel: 0,
  gravityTimer: 720,
  droneLevel: 0,
  droneTimer: 12,
  droneBLevel: 0,
  droneBTimer: 18,
  worldEnderLevel: 0,
  timeRewindLevel: 0,
  timeRewindTimer: 1200,
  timeRewindEffectTime: 0,
  yupiterWeapon: 0,
  yupiterSkillCooldowns: [0, 0, 0],
  yupiterUltimateCooldown: 0,
  crescentUltimateTime: 0,
  severingUltimateTime: 0,
  crescentOverdriveTime: 0,
  crescentReturnMultiplier: 1,
  crescentMartialLawLevel: 0,
  swordAuraLevel: 0,
  trackerLevel: 0,
  severingFrenzyTime: 0,
  renShards: 0,
  renAfterimageLevel: 0,
  renDarkDevourLevel: 0,
  renTotalEclipseLevel: 0,
  renReaperFootstepsLevel: 0,
  renSwapCooldown: 0,
  renDeployCooldown: 0,
  renSkillCooldown: 0,
  renUltimateCooldown: 0,
  renUltimateTime: 0,
  renUltimateStrikeTimer: 0,
  renUltimateX: 0,
  renUltimateY: 0,
  renSwapTrailTime: 0,
  renSwapStartX: 0,
  renSwapStartY: 0,
  renSwapEndX: 0,
  renSwapEndY: 0,
  nightLordQCooldown: 0,
  nightLordECooldown: 0,
  nightLordXCooldown: 0,
  nightLordRCooldown: 0,
  nightLordFrenzyTime: 0,
  nightLordUltimateTime: 0,
  nightLordChaseHasteTime: 0,
  nightLordSpinTimer: 0,
  nightLordAttackDirection: 1,
  nightLordReachLevel: 0,
  nightLordBloodLevel: 0,
  nightLordExecutionLevel: 0,
  zeroQCooldown: 0,
  zeroECooldown: 0,
  zeroXCooldown: 0,
  zeroRCooldown: 0,
  zeroVitalTime: 0,
  zeroUltimateTime: 0,
  zeroUltimateStrikeTimer: 0,
  zeroEmpoweredAttack: false,
  zeroThrustLevel: 0,
  zeroVitalLevel: 0,
  zeroJudgmentLevel: 0,
  paladinCombo: 0,
  paladinComboTimer: 0,
  paladinComboDecayTimer: 0,
  paladinAttackCounter: 0,
  paladinQCooldown: 0,
  paladinGuardTime: 0,
  paladinGuardTriggered: false,
  paladinCounterGraceTime: 0,
  paladinECooldown: 0,
  paladinXCooldown: 0,
  paladinRCooldown: 0,
  paladinUltimateTime: 0,
  paladinComboLevel: 0,
  paladinSpeedLevel: 0,
  paladinReleaseLevel: 0,
  arcHeat: 0,
  arcHeatDelay: 0,
  arcQCooldown: 0,
  arcECooldown: 0,
  arcXCooldown: 0,
  arcRCooldown: 0,
  arcBrandLevel: 0,
  arcCoronaLevel: 0,
  arcHeatLevel: 0,
  terraVibration: 0,
  terraVibrationDelay: 0,
  terraAttackCounter: 0,
  terraQCooldown: 0,
  terraECooldown: 0,
  terraXCooldown: 0,
  terraRCooldown: 0,
  terraResonanceLevel: 0,
  terraFaultLevel: 0,
  terraRampartLevel: 0,
  voidMass: 0, voidQCooldown: 0, voidECooldown: 0, voidXCooldown: 0, voidRCooldown: 0,
  voidUltimateTime: 0, voidUltimateTick: 0, voidCapacityLevel: 0, voidTerrainLevel: 0, voidChainLevel: 0,
  carmillaQCooldown:0,carmillaBloodMoonTime:0,carmillaFeastLevel:0,carmillaPreserveLevel:0,carmillaResonanceLevel:0,
  vargasGainedHp:0,vargasShield:0,vargasArmorTime:0,vargasUltimateTime:0,vargasQCooldown:0,vargasECooldown:0,vargasXCooldown:0,vargasRCooldown:0,vargasSecondHeartCooldown:0,vargasPredatorLevel:0,vargasSkeletonLevel:0,vargasPulseLevel:0,
  echoReplayCooldown:0,echoPhaseCooldown:0,echoCollapseCooldown:0,echoSwingSide:-1,echoAfterimageLevel:0,echoPitchLevel:0,echoArchiveLevel:0,
  ariaQCooldown:0,ariaECooldown:0,ariaXCooldown:0,ariaRCooldown:0,ariaUltimateTime:0,ariaSoilLevel:0,ariaThornLevel:0,ariaNightLevel:0,ariaNightTick:0,
  moiraQCooldown:0,moiraECooldown:0,moiraXCooldown:0,moiraRCooldown:0,moiraUltimateTime:0,moiraStoredPain:0,moiraThreadLevel:0,moiraNeedleLevel:0,moiraDollLevel:0,
  mareQCooldown:0,mareECooldown:0,mareXCooldown:0,mareRCooldown:0,mareUltimateTime:0,mareUltimateTick:0,mareUltimateAngle:0,mareDepthLevel:0,mareCurrentLevel:0,mareFoamLevel:0,mareChargeTime:0,mareChargeAngle:0,mareChargeStartX:0,mareChargeStartY:0,mareChargeHitIds:new Set(),
  mareWhaleTrailTick:0,
  immortalLevel: 0,
  immortalUsed: false,
  dodgeLevel: 0,
  fireTrailLevel: 0,
  lastFireTrailX: null,
  lastFireTrailY: null,
  crownLevel: 0
,
  maliciousProfitLevel: 0
};

let bullets = [];
let zombies = [];
let particles = [];
let items = [];
let expOrbs = [];
let stickyZones = [];
let fireTrails = [];
let laserSlashes = [];
let gravityFields = [];
let droneBullets = [];
let daggers = [];
let crescentBlades = [];
let yupiterSlashes = [];
let flameProjectiles = [];
let flameExplosions = [];
let flameUltimateOrbs = [];
let flameUltimateShots = [];
let renAttackEffects = [];
let renShadowFields = [];
let renShadowShards = [];
let renShadowShardBuckets = new Map();
let renPlacedClones = [];
let renFlyingClones = [];
let renRecallingClones = [];
let nightLordEffects = [];
let zeroEffects = [];
let paladinEffects = [];
let arcProjectiles = [];
let arcZones = [];
let arcEffects = [];
let terraStructures = [];
let terraEffects = [];
let terraRockProjectiles = [];
let voidTerrains = [];
let voidEffects = [];
let bloodDrops=[],bloodEffects=[];

let wave = 1;
let gameOver = false;
let screenMode = "home";
let selectedCharacter = "default";
let totalZombieKills = 0;
try {
  totalZombieKills = Number(localStorage.getItem("zombieSurvivalTotalKills") || 0);
} catch (error) {
  totalZombieKills = 0;
}
let characterCards = [];
let characterScrollY = 0;
let characterScrollMax = 0;
let characterDetailId = null;
let characterDetailOpenedAt = 0;
let characterDetailSkillIndex = 0;
let characterDetailSkillRects = [];
let characterDetailCloseRect = { x: 0, y: 0, w: 46, h: 46 };

// 화면 밖 오브젝트는 그리지 않되 게임 로직과 이펙트 자체는 그대로 유지한다.
function isInCameraView(x, y, padding = 80) {
  return x >= camera.x - padding && x <= camera.x + getCameraViewWidth() + padding &&
    y >= camera.y - padding && y <= camera.y + getCameraViewHeight() + padding;
}

let paused = false;
let selectedAugments = [];
let pauseAugmentCardRects = [];
let selectedPauseAugmentId = null;
let pauseButtonRect = { x: 0, y: 0, w: 54, h: 54 };
let pauseHomeButtonRect = { x: 0, y: 0, w: 220, h: 54 };
let homeStartRect = { x: 0, y: 0, w: 260, h: 64 };
let homeCharacterRect = { x: 0, y: 0, w: 260, h: 64 };
let homeAugmentGuideRect = { x: 0, y: 0, w: 260, h: 64 };
let homeGameGuideRect = { x: 0, y: 0, w: 260, h: 64 };
let homeMonsterGuideRect = { x: 0, y: 0, w: 260, h: 64 };
let homeSettingsRect = { x: 0, y: 0, w: 260, h: 64 };
let homeDifficultyRect = { x: 0, y: 0, w: 260, h: 64 };
let homeDifficultyOpen = false;
let homeDifficultyChoiceRects = [];
let selectedDifficulty = (() => {
  try { const value = localStorage.getItem("zombieSurvivalDifficulty"); return ["easy","medium","hard"].includes(value) ? value : "easy"; }
  catch (error) { return "easy"; }
})();
function difficultyValue(easy, medium, hard) {
  return selectedDifficulty === "hard" ? hard : (selectedDifficulty === "medium" ? medium : easy);
}
function getZombieDifficultyDamageMultiplier() { return difficultyValue(1, 1.5, 2.5); }
function getZombieDifficultySpeedMultiplier() { return difficultyValue(1, 1.2, 1.4); }
function getRaidBossDifficultyHpMultiplier() { return difficultyValue(1, 1.8, 4); }
function getRaidBossDifficultySpeedMultiplier() { return difficultyValue(1, 1.2, 1.2); }
let characterBackRect = { x: 0, y: 0, w: 180, h: 54 };
let characterSelectRect = { x: 0, y: 0, w: 240, h: 300 };

let spawnTimer = 0;
let itemSpawnTimer = 180;
let zombieSlowTimer = 0;
let choosingUpgrade = false;
let upgradeChoices = [];
let upgradeCardRects = [];
let upgradeAnimTime = 0;
let upgradeSelectionEffect = null;
let visionEffectTime = 0;

function getDamageMultiplier() {
  return player.globalDamageMultiplier || 1;
}

function scaledDamage(baseDamage) {
  const crownMultiplier = player.crownLevel > 0 ? 2 : 1;
  return baseDamage * getDamageMultiplier() * crownMultiplier;
}

function screenToWorld() {
  const viewScale = getWorldViewScale();
  mouse.worldX = mouse.x / viewScale + camera.x;
  mouse.worldY = mouse.y / viewScale + camera.y;
}

function getWorldViewScale() {
  if(!(typeof isMobileTouchDevice === "function" && isMobileTouchDevice() && canvas.height < canvas.width))return 1;
  return Math.min(canvas.width,canvas.height)<520?0.62:0.78;
}

function getCameraViewWidth() { return canvas.width / getWorldViewScale(); }
function getCameraViewHeight() { return canvas.height / getWorldViewScale(); }

function updateCamera() {
  const viewW = getCameraViewWidth();
  const viewH = getCameraViewHeight();
  camera.x = player.x - viewW / 2;
  camera.y = player.y - viewH / 2;

  camera.x = Math.max(0, Math.min(WORLD.width - viewW, camera.x));
  camera.y = Math.max(0, Math.min(WORLD.height - viewH, camera.y));
}
