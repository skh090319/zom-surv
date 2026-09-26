// Canvas images need explicit demand loading: HTML loading="lazy" does not apply.
const gameImageRegistry = [];
const characterThumbnailImages = new Map();
let preparedImageScreen = "";

function gameImageGroup(source) {
  const file = source.split("/").pop();
  if (source.includes("/bosses/")) return "boss";
  if (file.startsWith("lobby-")) return "lobby";
  const owner = file.match(/^(default|suncall|luminous|yupiter|ren|night-lord|zero|paladin|arc|terra|void|carmilla|vargas|echo|aria|moira|mare)(?:[-.]|$)/);
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
  const fileId = id === "nightLord" ? "night-lord" : id;
  if (!characterThumbnailImages.has(fileId)) {
    const redesigned = ["default", "suncall", "luminous", "yupiter", "ren", "night-lord", "zero", "paladin", "arc"].includes(fileId);
    const source = redesigned ? `assets/characters-original-v2/${fileId}-thumb.webp` : `assets/character-thumbs-v1/${fileId}.webp`;
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
  const selected = selectedCharacter === "nightLord" ? "night-lord" : selectedCharacter;
  const exclusive = owner === "nightLord" ? "night-lord" : owner;
  const modal = detail === "nightLord" ? "night-lord" : detail;
  const playing = screenMode === "game" || (screenMode === "mobileSettings" && settings === "view");
  for (const image of gameImageRegistry) {
    const group = image.assetGroup;
    let needed = image.assetSource === "background.webp";
    if (screenMode === "home" || screenMode === "mobileSettings") needed ||= group === "lobby";
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
