const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const policySource = read('js/00-content-access.js');
const lockedCharacters = ['oblivion', 'lush', 'mare', 'astra', 'aria'];
const regularCharacters = ['suncall', 'yupiter', 'ren', 'nightLord', 'zero', 'paladin', 'arc', 'terra', 'void', 'carmilla', 'vargas', 'echo', 'moira', 'nullZero'];
const tiers = ['easy', 'medium', 'hard'];

function game({ enabled = true, saved = [], character = 'yupiter' } = {}) {
  const storage = new Map(saved), writes = [];
  const c = {
    console, Math, selectedCharacter: character, characterDetailId: null,
    selectedDifficulty: storage.get('zombieSurvivalDifficulty') || 'easy',
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) { writes.push([key, value]); storage.set(key, value); }
    },
    Image: class {}, backgroundImage: {},
    setGameImageSource: (image, src) => Object.assign(image, { assetSource: src }),
    ensureGameImage: image => image
  };
  vm.createContext(c);
  const run = code => vm.runInContext(code, c);
  // Exercise the owner's future source change, not an in-game bypass flag.
  const source = enabled ? policySource : policySource.replace(/enabled:\s*true/, 'enabled: false');
  if (!enabled) assert.notEqual(source, policySource, 'the release switch must exist');
  run(source);
  run(read('js/00-worlds.js'));
  const core = read('js/01-core.js');
  run(core.slice(core.indexOf('function difficultyValue('), core.indexOf('let characterBackRect')));
  return { c, storage, writes, run };
}

function inputGame(options) {
  const g = game(options), listeners = {}, canvasListeners = {}, relicOpens = [];
  const outside = { x: -1000, y: -1000, w: 1, h: 1 };
  Object.assign(g.c, {
    performance: { now: () => 1234 }, keys: {}, mouse: { x: 0, y: 0, down: false },
    screenMode: 'character', paused: false, gameOver: false, choosingUpgrade: false,
    characterDetailId: null, characterDetailOpenedAt: 0, characterDetailSkillIndex: 0,
    characterDetailSkillRects: [], characterDetailCloseRect: outside, characterBackRect: outside,
    characterCards: [], characterScrollY: 0, characterScrollMax: 0,
    homeDifficultyOpen: false, homeDifficultyChoiceRects: [],
    homeSettingsRect: outside, homeDifficultyRect: outside, homeStartRect: outside,
    homeCharacterRect: outside, homeCodexRect: outside,
    homeRelicRect: { x: 600, y: 200, w: 160, h: 80 },
    canvas: {
      width: 1000, height: 600,
      addEventListener: (type, fn) => (canvasListeners[type] ||= []).push(fn)
    },
    addEventListener: (type, fn) => (listeners[type] ||= []).push(fn),
    pointInRect: (x, y, rect) => !!rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h,
    openRelicInventory() { relicOpens.push(g.c.screenMode); g.c.screenMode = 'relics'; }
  });
  g.run(read('js/03-input.js'));
  function event(type, x, y, button = 0) {
    for (const fn of canvasListeners.mousemove) fn({ clientX: x, clientY: y });
    const e = { clientX: x, clientY: y, button, prevented: false, preventDefault() { this.prevented = true; } };
    for (const fn of canvasListeners[type] || []) fn(e);
    return e;
  }
  function card(id, overrides = {}) {
    g.c.characterCards = [{ id, x: 50, y: 160, w: 140, h: 400, visibleTop: 143, visibleBottom: 592, ...overrides }];
    g.c.selectedCharacter = 'yupiter';
    g.c.characterDetailId = null;
  }
  return { ...g, event, card, relicOpens };
}

test('the production page loads the release gate before world initialization and input handlers', () => {
  const html = read('index.html');
  const gate = html.indexOf('js/00-content-access.js');
  assert.ok(gate >= 0);
  for (const dependency of ['js/00-worlds.js', 'js/03-input.js', 'js/09-main.js']) {
    assert.ok(html.indexOf(dependency) > gate, dependency);
  }
});

test('the active release policy locks exactly the five tall characters, eight stages, and relic menu', () => {
  const g = game();
  assert.equal(g.run('TEMPORARY_CONTENT_LOCKS.enabled'), true);
  for (const id of [...lockedCharacters, ...regularCharacters]) {
    assert.equal(g.run(`isCharacterTemporarilyLocked('${id}')`), lockedCharacters.includes(id), id);
  }
  for (const world of [1, 2, 3]) for (const tier of tiers) {
    assert.equal(g.run(`isWorldStageTemporarilyLocked(${world},'${tier}')`), !(world === 2 && tier === 'hard'));
  }
  assert.equal(g.run('isRelicMenuTemporarilyLocked()'), true);
});

test('all old stage saves run as World 2 Hard without overwriting saved stage, balance, or relics', () => {
  for (const world of [1, 2, 3]) for (const tier of tiers) {
    const saved = [
      ['zombieSurvivalWorldStage', JSON.stringify({ world, tier })],
      ['zombieSurvivalDifficulty', world === 2 ? tier : 'easy'],
      ['zombieSurvivalRelicsV1', JSON.stringify({ inventory: [{ id: 'owned-relic' }], loadouts: { astra: { core: 'owned-relic' } } })]
    ];
    const g = game({ saved });
    assert.equal(g.run('getWorldStageLabel()'), '2-3');
    assert.equal(g.c.selectedDifficulty, 'hard');
    assert.equal(g.run('getZombieDifficultyDamageMultiplier()'), 2.5);
    assert.equal(g.run('getZombieDifficultySpeedMultiplier()'), 1.4);
    assert.equal(g.run('getRaidBossDifficultySpeedMultiplier()'), 1.2);
    assert.deepEqual([...g.storage], saved);
    assert.deepEqual(g.writes, []);
  }
});

test('legacy, absent, and malformed saves still initialize to World 2 Hard without a migration write', () => {
  for (const difficulty of tiers) for (const stage of [undefined, '{broken', 'null', '{"world":9,"tier":"hard"}']) {
    const saved = [['zombieSurvivalDifficulty', difficulty]];
    if (stage !== undefined) saved.push(['zombieSurvivalWorldStage', stage]);
    const g = game({ saved });
    assert.equal(g.run('getWorldStageLabel()'), '2-3');
    assert.equal(g.c.selectedDifficulty, 'hard');
    assert.deepEqual([...g.storage], saved);
    assert.deepEqual(g.writes, []);
  }
});

test('blocked world selections cannot change the live stage or any saved values', () => {
  const saved = [['zombieSurvivalWorldStage', '{"world":3,"tier":"medium"}'], ['zombieSurvivalDifficulty', 'easy']];
  const g = game({ saved });
  for (const world of [1, 2, 3]) for (const tier of tiers) {
    if (world === 2 && tier === 'hard') continue;
    assert.equal(g.run(`selectWorldStage(${world},'${tier}')`), false);
    assert.equal(g.run('getWorldStageLabel()'), '2-3');
    assert.equal(g.c.selectedDifficulty, 'hard');
    assert.deepEqual([...g.storage], saved);
    assert.deepEqual(g.writes, []);
  }
  assert.equal(g.run("selectWorldStage(2,'hard')"), true);
  assert.deepEqual(JSON.parse(g.storage.get('zombieSurvivalWorldStage')), { world: 2, tier: 'hard' });
  assert.equal(g.storage.get('zombieSurvivalDifficulty'), 'hard');
});

test('enforcement restores Yupiter and closes locked details while preserving available selections', () => {
  const g = game();
  for (const id of lockedCharacters) {
    g.run(`selectedCharacter='${id}';characterDetailId='${id}';selectedWorld=3;selectedStageDifficulty='easy';selectedDifficulty='easy';enforceTemporaryContentSelection()`);
    assert.equal(g.c.selectedCharacter, 'yupiter', id);
    assert.equal(g.c.characterDetailId, null, id);
    assert.equal(g.run('getWorldStageLabel()'), '2-3');
    assert.equal(g.c.selectedDifficulty, 'hard');
  }
  for (const id of regularCharacters) {
    g.run(`selectedCharacter='${id}';characterDetailId='${id}';enforceTemporaryContentSelection()`);
    assert.equal(g.c.selectedCharacter, id);
    assert.equal(g.c.characterDetailId, id);
  }
  assert.deepEqual(g.writes, []);
});

test('actual restart normalizes stale character and stage before world monsters are initialized', () => {
  const main = read('js/09-main.js');
  const start = main.indexOf('function restart()'), end = main.indexOf('let lastLoopTime', start);
  assert.ok(start >= 0 && end > start);
  for (const id of lockedCharacters) {
    const g = game(), stop = new Error('reached world initialization'), observed = [];
    g.c.resetWorldMonsters = () => {
      observed.push([g.c.selectedCharacter, g.c.characterDetailId, g.run('getWorldStageLabel()'), g.c.selectedDifficulty]);
      throw stop;
    };
    g.run(main.slice(start, end));
    g.run(`selectedCharacter='${id}';characterDetailId='${id}';selectedWorld=1;selectedStageDifficulty='medium';selectedDifficulty='easy'`);
    assert.throws(() => g.run('restart()'), error => error === stop);
    assert.deepEqual(observed, [['yupiter', null, '2-3', 'hard']]);
    assert.deepEqual(g.writes, []);
  }
});

test('actual left-click, right-click, and context-menu handlers cannot select or inspect locked cards', () => {
  const g = inputGame();
  for (const id of lockedCharacters) for (const [type, button] of [['mousedown', 0], ['mousedown', 2], ['contextmenu', 2]]) {
    // Omit disabled deliberately: the event guard must also enforce the policy.
    g.card(id);
    const e = g.event(type, 100, 200, button);
    assert.equal(g.c.selectedCharacter, 'yupiter', `${id} ${type} ${button}`);
    assert.equal(g.c.characterDetailId, null, `${id} ${type} ${button}`);
    if (button === 2) assert.equal(e.prevented, true);
  }
});

test('actual handlers preserve selection and detail access for every available character', () => {
  const g = inputGame();
  for (const id of regularCharacters) {
    g.card(id);
    g.event('mousedown', 100, 200);
    assert.equal(g.c.selectedCharacter, id);
    assert.equal(g.c.characterDetailId, null);
    for (const type of ['mousedown', 'contextmenu']) {
      g.card(id);
      g.event(type, 100, 200, 2);
      assert.equal(g.c.characterDetailId, id, `${id} ${type}`);
      assert.equal(g.c.characterDetailOpenedAt, 1234);
    }
  }
});

test('clipped portions and disabled cards reject all three desktop input paths', () => {
  const g = inputGame();
  const cases = [
    [{ y: 90, visibleTop: 143 }, 120],
    [{ y: 400, visibleBottom: 580 }, 590],
    [{ y: 90, visibleTop: undefined }, 120],
    [{ y: 400, visibleBottom: undefined }, 596],
    [{ disabled: true }, 200]
  ];
  for (const [overrides, y] of cases) for (const [type, button] of [['mousedown', 0], ['mousedown', 2], ['contextmenu', 2]]) {
    g.card('ren', overrides);
    g.event(type, 100, y, button);
    assert.equal(g.c.selectedCharacter, 'yupiter');
    assert.equal(g.c.characterDetailId, null);
  }
  g.card('ren', { y: 90, visibleTop: 143 });
  g.event('mousedown', 100, 150);
  assert.equal(g.c.selectedCharacter, 'ren', 'the visible portion remains selectable');
});

test('the actual home relic button is blocked while locked and opens after the owner disables the policy', () => {
  for (const enabled of [true, false]) {
    const g = inputGame({ enabled });
    g.c.screenMode = 'home';
    g.event('mousedown', 650, 240);
    assert.deepEqual(g.relicOpens, enabled ? [] : ['home']);
    assert.equal(g.c.screenMode, enabled ? 'home' : 'relics');
  }
});

test('the sticky back button consumes clicks without opening the character card beneath it', () => {
  const g = inputGame();
  g.c.characterBackRect = { x: 18, y: 18, w: 112, h: 42 };
  for (const [type, button] of [['mousedown', 0], ['mousedown', 2], ['contextmenu', 2]]) {
    g.c.screenMode = 'character';
    g.card('ren', { x: 18, y: 18, w: 140, h: 400, visibleTop: 8 });
    g.event(type, 50, 30, button);
    assert.equal(g.c.selectedCharacter, 'yupiter');
    assert.equal(g.c.characterDetailId, null, `${type} ${button}`);
    assert.equal(g.c.screenMode, button === 0 ? 'home' : 'character');
  }
  g.c.screenMode = 'character';
  g.event('mousedown', 50, 80, 2);
  assert.equal(g.c.characterDetailId, 'ren', 'visible card area below the button still opens');
});

test('disabling the source switch restores all stages and characters without losing earlier saves', () => {
  const relicSave = JSON.stringify({ inventory: [{ id: 'owned-relic' }], loadouts: { astra: { core: 'owned-relic' } }, presets: { astra: [{ core: 'owned-relic' }] } });
  for (const world of [1, 2, 3]) for (const tier of tiers) {
    const saved = [['zombieSurvivalWorldStage', JSON.stringify({ world, tier })], ['zombieSurvivalDifficulty', world === 2 ? tier : 'easy'], ['zombieSurvivalRelicsV1', relicSave]];
    const locked = game({ saved });
    const g = game({ enabled: false, saved: locked.storage, character: 'astra' });
    assert.equal(g.run('getWorldStageLabel()'), `${world}-${tiers.indexOf(tier) + 1}`);
    assert.equal(g.c.selectedDifficulty, world === 2 ? tier : 'easy');
    assert.equal(g.c.selectedCharacter, 'astra');
    assert.deepEqual([...g.storage], saved);
    assert.deepEqual(g.writes, []);
    assert.equal(g.run('isRelicMenuTemporarilyLocked()'), false);
    assert.equal(g.run(`selectWorldStage(${world},'${tier}')`), true);
    assert.equal(g.storage.get('zombieSurvivalRelicsV1'), relicSave);
  }
  const g = inputGame({ enabled: false });
  for (const id of lockedCharacters) {
    assert.equal(g.run(`isCharacterTemporarilyLocked('${id}')`), false);
    g.card(id);
    g.event('mousedown', 100, 200);
    assert.equal(g.c.selectedCharacter, id);
    g.event('contextmenu', 100, 200, 2);
    assert.equal(g.c.characterDetailId, id);
    g.run('enforceTemporaryContentSelection()');
    assert.equal(g.c.selectedCharacter, id);
    assert.equal(g.c.characterDetailId, id);
  }
});

test('the same five tall cards remain together in five columns after temporary locks are removed', () => {
  const ui = read('js/08-ui.js');
  const start = ui.indexOf('function getCharacterSelectLayout()'), end = ui.indexOf('function drawCharacterSelectScreen()', start);
  assert.ok(start >= 0 && end > start);
  for (const enabled of [true, false]) for (const width of [390, 844, 1440]) {
    const g = game({ enabled });
    Object.assign(g.c, { canvas: { width, height: 800 }, characterScrollY: 0, characterSkillGuide: { lush: {} }, isMobileTouchDevice: () => width < 1000 });
    g.run(ui.slice(start, end));
    const layout = JSON.parse(g.run('JSON.stringify(getCharacterSelectLayout())'));
    assert.equal(layout.columns, 5);
    assert.deepEqual(layout.tallIds, lockedCharacters);
    const tallCards = layout.cards.slice(-5);
    assert.deepEqual(tallCards.map(card => card.id), lockedCharacters);
    assert.equal(new Set(tallCards.map(card => card.y)).size, 1);
    assert.equal(new Set(tallCards.map(card => card.x)).size, 5);
    assert.ok(tallCards.every(card => card.disabled === enabled));
    assert.ok(layout.cards.slice(0, -5).every(card => !card.disabled));
  }
});
