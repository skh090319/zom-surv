// Canvas images need explicit demand loading: HTML loading="lazy" does not apply.
const gameImageRegistry = [];
const characterThumbnailImages = new Map();
const worldMonsterImages = new Map();
const worldBossImages = new Map();
let preparedImageScreen = "";

function gameImageGroup(source) {
  if(source.includes('/world-bosses-v1/'))return 'world-boss-1';
  if(source.includes('/world-monsters-v1/'))return /\/(street-walker|alley-hound|iron-hauler|glass-thrower|alarm-infected)\.webp/.test(source)?'world-monster-1':'world-monster-3';
  if(source.includes('/aria-v2/')||source.includes('/aria-v3/'))return 'aria';
  if(source.includes('/worlds-v1/'))return 'stage';
  const file = source.split("/").pop();
  if (source.includes("/bosses/")) return "boss";
  if (file.startsWith("lobby-")) return "lobby";
  const owner = file.match(/^(suncall|luminous|yupiter|ren|night-lord|zero|paladin|arc|terra|void|carmilla|vargas|echo|aria|moira|mare|null-zero|astra)(?:[-.]|$)/);
  if (owner) return owner[1];
  if (/^(crescent-blade|severing-blade|flame-cannon|augment-sword-aura)/.test(file)) return "yupiter";
  if (/^(augment-|transcend-)/.test(file)) return "augment";
  return "world";
}

function setGameImageSource(image, source) {
  image.assetSource = source;
  image.assetGroup = gameImageGroup(source);
  image.decoding = "async";
  gameImageRegistry.push(image);
  return image;
}

function ensureGameImage(image, priority = "auto") {
  if (!image || !image.assetSource || image.assetRequested) return image;
  image.assetRequested = true;
  image.fetchPriority = priority;
  image.src = image.assetSource;
  return image;
}

// Register on demand, so visiting world 2 does not download the other ten enemies.
function getWorldMonsterImage(id) {
  const definition=typeof WORLD_MONSTER_TYPES==='object'?WORLD_MONSTER_TYPES[id]:null;
  if(!definition||!definition.image)return null;
  if(!worldMonsterImages.has(id))worldMonsterImages.set(id,setGameImageSource(new Image(),definition.image));
  return ensureGameImage(worldMonsterImages.get(id));
}

function prepareWorldMonsterImages(world) {
  if(typeof getWorldFieldMonsterDefinitions!=='function'||(world!==1&&world!==3))return;
  for(const definition of getWorldFieldMonsterDefinitions(world))getWorldMonsterImage(definition.id);
}

function getWorldBossImage(id,world=typeof selectedWorld==='number'?selectedWorld:2) {
  const definition=typeof WORLD_RAID_BOSS_TYPES==='object'?WORLD_RAID_BOSS_TYPES[world]?.find(entry=>entry.id===id):null;
  if(!definition)return null;
  if(world!==1)return getWorldMonsterImage(id);
  if(!worldBossImages.has(id))worldBossImages.set(id,setGameImageSource(new Image(),`assets/world-bosses-v1/${id}.webp`));
  return ensureGameImage(worldBossImages.get(id));
}

function prepareWorldBossImages(world) {
  if(typeof WORLD_RAID_BOSS_TYPES!=='object')return;
  for(const definition of WORLD_RAID_BOSS_TYPES[world]||[])getWorldBossImage(definition.id,world);
}

function getCharacterThumbnail(id) {
  const fileId = id === "nightLord" ? "night-lord" : (id === "nullZero" ? "null-zero" : id);
  if (!characterThumbnailImages.has(fileId)) {
    const redesigned = ["suncall", "luminous", "yupiter", "ren", "night-lord", "zero", "paladin", "arc", "null-zero", "astra"].includes(fileId);
    const swappedPortraitRevision = fileId === "zero" || fileId === "paladin" ? "?v=20260928-swap1" : "";
    const source = fileId==='aria'?'assets/aria-v2/thumb.webp':fileId==='mare'?'assets/character-thumbs-v1/mare-mature-v1.webp':redesigned ? `assets/characters-original-v2/${fileId}-thumb.webp${swappedPortraitRevision}` : `assets/character-thumbs-v1/${fileId}.webp`;
    characterThumbnailImages.set(fileId, setGameImageSource(new Image(), source));
  }
  return ensureGameImage(characterThumbnailImages.get(fileId));
}

function prepareGameImages() {
  const page = typeof guidePage === "string" ? guidePage : "";
  const tab = typeof guideAugmentTab === "string" ? guideAugmentTab : "";
  const owner = typeof guideExclusiveCharacter === "string" ? guideExclusiveCharacter : "";
  const detail = typeof characterDetailId === "string" ? characterDetailId : "";
  const settings = typeof mobileSettingsPage === "string" ? mobileSettingsPage : "";
  const upgrade = typeof choosingUpgrade !== "undefined" && choosingUpgrade;
  const world=typeof selectedWorld==='number'?selectedWorld:2;
  const key = [screenMode, selectedCharacter, world, page, tab, owner, detail, settings, upgrade].join("/");
  if (key === preparedImageScreen) return;
  preparedImageScreen = key;
  const assetOwner = id => id === "nightLord" ? "night-lord" : (id === "nullZero" ? "null-zero" : id);
  const selected = assetOwner(selectedCharacter);
  if(screenMode==="home"&&selected==="astra"&&typeof prepareAstraVfx==="function")prepareAstraVfx();
  const exclusive = assetOwner(owner);
  const modal = assetOwner(detail);
  const playing = screenMode === "game" || (screenMode === "mobileSettings" && settings === "view");
  if(playing||screenMode==='home'){prepareWorldMonsterImages(world);prepareWorldBossImages(world);}
  if((playing||screenMode==='home')&&typeof getWorldBackgroundImage==='function')getWorldBackgroundImage();
  for (const image of gameImageRegistry) {
    const group = image.assetGroup;
    let needed = image.assetSource === "background.webp";
    if (screenMode === "home" || screenMode === "mobileSettings") needed ||= group === "lobby";
    // Prepare Astra's realm before a run without adding it to every hero's load.
    if (screenMode === "home" && selected === "astra") needed ||= image.assetSource === "assets/astra-ultimate-nebula-v1.webp" || image.assetSource === "assets/astra-ultimate-portrait-v1.webp";
    if (screenMode === "home" && selected === "oblivion") needed ||= image.assetSource.startsWith("assets/oblivion-v4/");
    if (screenMode === "home" && group === selected) needed ||= image.assetSource.includes('/ultimate-backgrounds-v1/');
    // Prewarm only the selected Aria's cut-in and realm, not every hero's lobby.
    if (screenMode === "home" && selected === "aria") needed ||= image.assetSource.startsWith('assets/aria-v2/ultimate-')||image.assetSource.startsWith('assets/aria-v3/ultimate-');
    if (screenMode === "mobileSettings" && settings === "controls") needed ||= group === selected;
    if (playing) needed ||= group === "world" || (world===2&&group === "boss") || group === selected || group === "augment";
    if (screenMode === "character" && modal) needed ||= group === modal;
    if (screenMode === "guide") {
      if (page === "monsters") needed ||= group === "boss" || group === "world";
      if (page === "augment") needed ||= group === "augment" || (tab === "exclusive" && group === exclusive);
    }
    if (needed) ensureGameImage(image, group === "lobby" ? "high" : "auto");
  }
}
