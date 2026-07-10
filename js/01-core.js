// 캔버스, 이미지, 전역 상태, 공통 계산

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const playerSprite = new Image();
playerSprite.src = "player.png";
let playerSpriteLoaded = false;
playerSprite.onload = () => {
  playerSpriteLoaded = true;
};

const suncallSprite = new Image();
suncallSprite.src = "suncall.png";
let suncallSpriteLoaded = false;
suncallSprite.onload = () => {
  suncallSpriteLoaded = true;
};

const gunSprite = new Image();
gunSprite.src = "gun.png";
let gunSpriteLoaded = false;
gunSprite.onload = () => {
  gunSpriteLoaded = true;
};

const backgroundImage = new Image();
backgroundImage.src = "background.png";
let backgroundLoaded = false;
backgroundImage.onload = () => {
  backgroundLoaded = true;
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

let paused = false;
let selectedAugments = [];
let pauseButtonRect = { x: 0, y: 0, w: 54, h: 54 };
let pauseHomeButtonRect = { x: 0, y: 0, w: 220, h: 54 };
let homeStartRect = { x: 0, y: 0, w: 260, h: 64 };
let homeCharacterRect = { x: 0, y: 0, w: 260, h: 64 };
let characterBackRect = { x: 0, y: 0, w: 180, h: 54 };
let characterSelectRect = { x: 0, y: 0, w: 240, h: 300 };

let spawnTimer = 0;
let itemSpawnTimer = 180;
let zombieSlowTimer = 0;
let choosingUpgrade = false;
let upgradeChoices = [];
let upgradeCardRects = [];
let upgradeAnimTime = 0;
let visionEffectTime = 0;

function getDamageMultiplier() {
  return player.globalDamageMultiplier || 1;
}

function scaledDamage(baseDamage) {
  const crownMultiplier = player.crownLevel > 0 ? 2 : 1;
  return baseDamage * getDamageMultiplier() * crownMultiplier;
}

function screenToWorld() {
  mouse.worldX = mouse.x + camera.x;
  mouse.worldY = mouse.y + camera.y;
}

function updateCamera() {
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;

  camera.x = Math.max(0, Math.min(WORLD.width - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(WORLD.height - canvas.height, camera.y));
}
