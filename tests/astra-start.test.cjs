const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game(character = 'astra') {
  const context = {
    console, Math, performance: { now: () => 0 }, selectedCharacter: character,
    player: {}, WORLD: { width: 4000, height: 4000 }, mouse: {}, keys: {},
    canvas: { width: 1280, height: 720 }, selectedAugments: [],
    choosingUpgrade: false, upgradeChoices: [], upgradeCardRects: [], upgradeSelectionEffect: null,
    raidRewardChoicesPending: 0, triggerCounts: { vision: 0, gravity: 0 },
    triggerVisionStun() { context.triggerCounts.vision++; },
    triggerGravityField() { context.triggerCounts.gravity++; },
    triggerQuantumLaser() {},
    resetRaidBossSystem() { context.raidRewardChoicesPending = 0; },
    updateCamera() {}, screenToWorld() {}, addEventListener() {},
  };
  vm.createContext(context);
  for (const file of ['02-upgrades.js', '04-astra.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  const main = fs.readFileSync(path.join(root, 'js/09-main.js'), 'utf8');
  vm.runInContext(main.slice(main.indexOf('function restart()'), main.indexOf('let lastLoopTime')), context);
  return { context, run: code => vm.runInContext(code, context) };
}

test('Astra owns both starter augments before either introductory card is confirmed', () => {
  const g = game();
  g.run('restart()');
  assert.equal(g.context.player.visionLevel, 1);
  assert.equal(g.context.player.gravityLevel, 1);
  assert.deepEqual(Array.from(g.context.selectedAugments, u => [u.id, u.count]), [['vision', 1], ['gravity', 1]]);
  assert.equal(g.run('transcended.vision && transcended.gravity'), true);
  assert.deepEqual(Array.from(g.context.upgradeChoices, u => u.id), ['vision', 'gravity']);
  assert.equal(g.context.choosingUpgrade, true);
  assert.equal(g.context.player.level, 1);
  assert.deepEqual(g.context.triggerCounts, { vision: 1, gravity: 1 });

  for (const index of [0, 1]) {
    g.run('restart()');
    const before = { ...g.context.triggerCounts };
    g.context.raidRewardChoicesPending = 2;
    g.run(`chooseUpgrade(${index}); finalizeUpgradeChoice(${index}); finalizeUpgradeChoice(${index})`);
    assert.equal(g.context.choosingUpgrade, false);
    assert.equal(g.run('astraStartingAugmentsIntro'), false);
    assert.equal(g.run('upgradeCount.vision + upgradeCount.gravity'), 2);
    assert.equal(g.context.selectedAugments.length, 2);
    assert.deepEqual(g.context.triggerCounts, before);
    assert.equal(g.context.raidRewardChoicesPending, 2);
  }
});

test('starting augments reset each run, remain out of reward pools, and are Astra-only', () => {
  const g = game();
  g.run('restart(); finalizeUpgradeChoice(1); player.level = 5; openUpgradeMenu()');
  assert.ok(g.context.upgradeChoices.every(u => u.id !== 'vision' && u.id !== 'gravity'));
  const chosen = g.context.upgradeChoices[0].id;
  g.run('finalizeUpgradeChoice(0)');
  assert.equal(g.run(`upgradeCount[${JSON.stringify(chosen)}]`), 1);
  assert.equal(g.context.selectedAugments.length, 3);
  g.run('restart()');
  assert.deepEqual(Array.from(g.context.selectedAugments, u => [u.id, u.count]), [['vision', 1], ['gravity', 1]]);
  g.context.selectedCharacter = 'mare';
  g.run('restart()');
  assert.equal(g.context.player.visionLevel, 0);
  assert.equal(g.context.player.gravityLevel, 0);
  assert.equal(g.context.selectedAugments.length, 0);
  assert.equal(g.context.choosingUpgrade, false);
  assert.equal(g.run('astraStartingAugmentsIntro'), false);
});

test('ultimate XP stacks additively, combines with existing XP augments, and is run-local', () => {
  const g = game();
  g.run('restart(); finalizeUpgradeChoice(0); player.expNeed = 100000');
  for (const casts of [0, 1, 2, 5]) {
    g.context.player.astraUltimateCasts = casts;
    g.context.player.exp = 0;
    g.run('gainExp(100)');
    assert.equal(g.context.player.exp, 100 + casts * 20);
  }
  g.run('player.exp = 0; player.astraUltimateCasts = 2; player.greedLevel = 3; player.maliciousProfitLevel = 1; gainExp(100)');
  assert.equal(g.context.player.exp, 273);
  g.context.selectedCharacter = 'mare';
  g.run('player.exp = 0; gainExp(100)');
  assert.equal(g.context.player.exp, 195);
  g.context.selectedCharacter = 'astra';
  g.run('restart(); finalizeUpgradeChoice(0); player.expNeed = 100000; gainExp(100)');
  assert.equal(g.context.player.exp, 100);
});

test('both introductory cards fit phone, tablet and desktop with active ownership labels', () => {
  const g = game(), text = [];
  let mobile = false;
  g.context.isMobileTouchDevice = () => mobile;
  g.context.ctx = new Proxy({
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    fillText: value => text.push(value), measureText: value => ({ width: value.length * 7 }),
  }, { get: (target, key) => target[key] || (() => {}) });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/08-ui.js'), 'utf8'), g.context);
  g.run('drawAugmentIcon = () => {}');
  for (const [width, height, touch] of [[667, 320, true], [844, 390, true], [1180, 820, true], [1920, 1080, false]]) {
    Object.assign(g.context.canvas, { width, height }); mobile = touch; text.length = 0;
    g.run('restart(); upgradeAnimTime = 90; drawUpgradeMenu()');
    assert.equal(g.context.upgradeCardRects.length, 2);
    for (const card of g.context.upgradeCardRects) {
      assert.ok(card.x >= 0 && card.y >= 0 && card.x + card.w <= width && card.y + card.h <= height);
    }
    assert.ok(text.includes('시작 증강 2종 획득'));
    assert.ok(text.includes('비전') && text.includes('중력장'));
    assert.equal(text.filter(line => line === '획득 완료 · 터치하여 전투 시작').length, 2);
  }
});
