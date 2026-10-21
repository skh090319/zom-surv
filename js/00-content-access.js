// Owner-controlled release locks. Keep enabled until an explicit unlock request;
// there is no timer, progression unlock, or local-storage override.
const TEMPORARY_TALL_CHARACTER_IDS = Object.freeze(['oblivion','lush','mare','astra','aria']);
const TEMPORARY_CONTENT_LOCKS = Object.freeze({
  enabled: true,
  characters: TEMPORARY_TALL_CHARACTER_IDS,
  world: 2,
  tier: 'hard',
  relicMenu: true,
  fallbackCharacter: 'yupiter'
});

function isCharacterTemporarilyLocked(id) {
  return TEMPORARY_CONTENT_LOCKS.enabled && TEMPORARY_CONTENT_LOCKS.characters.includes(id);
}
function isWorldStageTemporarilyLocked(world,tier) {
  return TEMPORARY_CONTENT_LOCKS.enabled &&
    (world !== TEMPORARY_CONTENT_LOCKS.world || tier !== TEMPORARY_CONTENT_LOCKS.tier);
}
function isRelicMenuTemporarilyLocked() {
  return TEMPORARY_CONTENT_LOCKS.enabled && TEMPORARY_CONTENT_LOCKS.relicMenu;
}
function enforceTemporaryContentSelection() {
  if (!TEMPORARY_CONTENT_LOCKS.enabled) return;
  if (isCharacterTemporarilyLocked(selectedCharacter)) {
    selectedCharacter = TEMPORARY_CONTENT_LOCKS.fallbackCharacter;
  }
  if (typeof characterDetailId !== 'undefined' && isCharacterTemporarilyLocked(characterDetailId)) {
    characterDetailId = null;
  }
  // Do not overwrite earlier saved choices or any owned relic/loadout data.
  selectedWorld = TEMPORARY_CONTENT_LOCKS.world;
  selectedStageDifficulty = TEMPORARY_CONTENT_LOCKS.tier;
  selectedDifficulty = TEMPORARY_CONTENT_LOCKS.tier;
}
