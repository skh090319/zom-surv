// Canvas images need explicit demand loading: HTML loading="lazy" does not apply.
const gameImageRegistry = [];
const characterThumbnailImages = new Map();
let preparedImageScreen = "";

function gameImageGroup(source) {
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

function getCharacterThumbnail(id) {
  const fileId = id === "nightLord" ? "night-lord" : (id === "nullZero" ? "null-zero" : id);
  if (!characterThumbnailImages.has(fileId)) {
    const redesigned = ["suncall", "luminous", "yupiter", "ren", "night-lord", "zero", "paladin", "arc", "null-zero", "astra"].includes(fileId);
    const swappedPortraitRevision = fileId === "zero" || fileId === "paladin" ? "?v=20260928-swap1" : "";
    const source = fileId==='mare'?'assets/character-thumbs-v1/mare-mature-v1.webp':redesigned ? `assets/characters-original-v2/${fileId}-thumb.webp${swappedPortraitRevision}` : `assets/character-thumbs-v1/${fileId}.webp`;
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
  const key = [screenMode, selectedCharacter, page, tab, owner, detail, settings, upgrade].join("/");
  if (key === preparedImageScreen) return;
  preparedImageScreen = key;
  const assetOwner = id => id === "nightLord" ? "night-lord" : (id === "nullZero" ? "null-zero" : id);
  const selected = assetOwner(selectedCharacter);
  if(screenMode==="home"&&selected==="astra"&&typeof prepareAstraVfx==="function")prepareAstraVfx();
  const exclusive = assetOwner(owner);
  const modal = assetOwner(detail);
  const playing = screenMode === "game" || (screenMode === "mobileSettings" && settings === "view");
  for (const image of gameImageRegistry) {
    const group = image.assetGroup;
    let needed = image.assetSource === "background.webp";
    if (screenMode === "home" || screenMode === "mobileSettings") needed ||= group === "lobby";
    // Prepare Astra's realm before a run without adding it to every hero's load.
    if (screenMode === "home" && selected === "astra") needed ||= image.assetSource === "assets/astra-ultimate-nebula-v1.webp" || image.assetSource === "assets/astra-ultimate-portrait-v1.webp";
    if (screenMode === "home" && selected === "oblivion") needed ||= image.assetSource.startsWith("assets/oblivion-v4/");
    if (screenMode === "home" && group === selected) needed ||= image.assetSource.includes('/ultimate-backgrounds-v1/');
    if (screenMode === "mobileSettings" && settings === "controls") needed ||= group === selected;
    if (playing) needed ||= group === "world" || group === "boss" || group === selected || group === "augment";
    if (screenMode === "character" && modal) needed ||= group === modal;
    if (screenMode === "guide") {
      if (page === "monster") needed ||= group === "boss" || group === "world";
      if (page === "augment") needed ||= group === "augment" || (tab === "exclusive" && group === exclusive);
    }
    if (needed) ensureGameImage(image, group === "lobby" ? "high" : "auto");
  }
}
