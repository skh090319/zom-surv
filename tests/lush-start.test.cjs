const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game(character = 'lush') {
  const c = {
    console, Math: Object.create(Math), performance: { now: () => 0 }, selectedCharacter: character,
    player: {}, WORLD: { width: 4000, height: 4000 }, mouse: {}, keys: {},
    canvas: { width: 1280, height: 720 }, selectedAugments: [],
    choosingUpgrade: false, upgradeChoices: [], upgradeCardRects: [], upgradeSelectionEffect: null,
    raidRewardChoicesPending: 0, totalZombieKills: 0,
    characterSkillGuide: {}, guideCharacterOrder: [], MOBILE_SKILL_KEYS: {}, exclusiveAugmentOwners: {},
    absorbSuncallShield: value => value,
  };
  for (const name of [
    'triggerVisionStun', 'triggerGravityField', 'triggerQuantumLaser', 'resetRaidBossSystem', 'resetAstra',
    'updateCamera', 'screenToWorld', 'addEventListener', 'saveTotalKills', 'onRenZombieKilled', 'onVargasZombieKilled',
    'update', 'updatePlayer', 'getCharacterPreviewSprite', 'drawPlayer', 'drawParticles', 'drawBackground', 'draw',
    'drawHUD', 'drawHealthBar', 'drawExpBar', 'drawMobileCharacterResource', 'getMobileHudBounds',
    'drawMobileControls', 'getMobileSkillIcon', 'getMobileSkillName', 'getMobileSkillCooldown',
    'getMobileSkillTargetSpec', 'getMobileAttackTargetSpec', 'drawAugmentIcon'
  ]) c[name] = () => {};
  vm.createContext(c);
  const run = source => vm.runInContext(source, c);
  for (const file of ['02-upgrades.js', '04-weapons-spawn.js', '10-lush.js']) {
    run(fs.readFileSync(path.join(root, 'js', file), 'utf8'));
  }
  // Exercise the real complete reset without starting a browser render loop.
  const main = fs.readFileSync(path.join(root, 'js/09-main.js'), 'utf8');
  run(main.slice(main.indexOf('function restart()'), main.indexOf('let lastLoopTime')));
  run(fs.readFileSync(path.join(root, 'js/12-lush-integration.js'), 'utf8'));
  const ui = fs.readFileSync(path.join(root, 'js/08-ui.js'), 'utf8');
  run(ui.slice(ui.indexOf('function getSelectedAugmentDisplayName'), ui.indexOf('function drawPauseOverlay')));
  return { c, run };
}

test('LusH starts with every Greed tier, Vampire Lord and Malicious Profit already owned without a choice screen', () => {
  const g = game(); g.run('restart()');
  assert.equal(g.run('upgradeCount.greed'), 4);
  assert.equal(g.run('upgradeCount.maliciousProfit'), 1);
  assert.equal(g.run('transcended.greed && transcended.maliciousProfit'), true);
  assert.equal(g.c.player.greedLevel, 3);
  assert.equal(g.c.player.lifeStealLevel, 1);
  assert.equal(g.c.player.maliciousProfitLevel, 1);
  assert.deepEqual(Array.from(g.c.selectedAugments, item => ({ ...item })), [
    { id: 'greed', name: '탐욕', category: 'support', count: 4 },
    { id: 'maliciousProfit', name: '악의적 수익 창출', category: 'combat', count: 1 }
  ]);
  assert.deepEqual(Array.from(g.run('selectedAugments.map(getSelectedAugmentDisplayName)')), ['초월: 흡혈 군주', '악의적 수익 창출']);
  assert.equal(g.c.choosingUpgrade, false);
  assert.equal(g.c.upgradeChoices.length, 0);
  assert.equal(g.run('astraStartingAugmentsIntro'), false);
  assert.equal(g.c.player.level, 1);
  assert.equal(g.c.player.exp, 0);
});

test('regranting is idempotent, preserves earned progress, and every new run receives exactly the same kit', () => {
  const g = game();
  for (let run = 0; run < 3; run++) {
    g.run('restart(); player.expNeed=100000; gainExp(100); player.hp=61; lushState.totalAssets=700; upgradeCount.lushLoaded=3');
    const before = g.run('JSON.stringify({player,selectedAugments,upgradeCount,transcended,lushState})');
    g.run('grantLushStartingAugments(); grantLushStartingAugments()');
    assert.equal(g.run('JSON.stringify({player,selectedAugments,upgradeCount,transcended,lushState})'), before);
    assert.equal(g.c.player.exp, 195);
    assert.equal(g.c.selectedAugments.length, 2);
  }
  g.run('restart()');
  assert.equal(g.c.player.hp, 100);
  assert.equal(g.c.player.exp, 0);
  assert.equal(g.run('lushState.totalAssets'), 0);
  assert.equal(g.run('upgradeCount.lushLoaded'), 0);
  assert.equal(g.c.selectedAugments.length, 2);
  assert.equal(g.c.choosingUpgrade, false);
});

test('real XP and kill rewards apply 1.95x XP and capped 1% max-HP healing without duplicate kills', () => {
  const g = game(); g.run('restart(); player.expNeed=100000; gainExp(100)');
  assert.equal(g.c.player.exp, 195);
  g.run('player.maxHp=200; player.hp=140; var victim={x:10,y:20,hp:0,r:12}; zombies.push(victim); killZombie(999,victim)');
  assert.equal(g.c.player.hp, 142);
  assert.equal(g.c.player.kills, 1);
  assert.equal(g.run('lushState.chips'), 1);
  assert.equal(g.run('lushState.totalAssets'), 1);
  assert.equal(g.run('expOrbs.reduce((sum,orb)=>sum+orb.value,0)'), 3);
  g.run('killZombie(0,victim)');
  assert.equal(g.c.player.hp, 142);
  assert.equal(g.c.player.kills, 1);
  g.run('player.hp=199; zombies.push({x:0,y:0,hp:0}); killZombie(0,zombies[0])');
  assert.equal(g.c.player.hp, 200);
});

test('owned starters are absent from actual normal and combat reward pools', () => {
  const g = game(); g.run('restart()');
  // Exhaust every other reward to make accidental re-offering deterministic.
  g.run('for(const upgrade of upgrades)if(!["greed","maliciousProfit"].includes(upgrade.id))transcended[upgrade.id]=true');
  for (const level of [2, 5, 6, 10, 15]) {
    g.run(`player.level=${level}; choosingUpgrade=false; upgradeChoices=[]; openUpgradeMenu()`);
    assert.equal(g.c.choosingUpgrade, false);
    assert.equal(g.c.upgradeChoices.length, 0);
  }
  // A genuinely unowned reward can still appear alongside the starter exclusions.
  g.run('transcended.lushLoaded=false; player.level=2; openUpgradeMenu()');
  assert.deepEqual(Array.from(g.c.upgradeChoices, item => item.id), ['lushLoaded']);
  g.run('finalizeUpgradeChoice(0); transcended.quantum=false; player.level=5; openUpgradeMenu()');
  assert.deepEqual(Array.from(g.c.upgradeChoices, item => item.id), ['quantum']);
});

test('switching heroes removes LusH starters and preserves Astra starting augments and ordinary reward eligibility', () => {
  const g = game(); g.run('restart()');
  for (const character of ['mare', 'suncall', 'astra']) {
    g.c.selectedCharacter = character; g.run('restart(); grantLushStartingAugments()');
    assert.equal(g.c.player.greedLevel, 0);
    assert.equal(g.c.player.lifeStealLevel, 0);
    assert.equal(g.c.player.maliciousProfitLevel, 0);
    assert.equal(g.run('upgradeCount.greed + upgradeCount.maliciousProfit'), 0);
    assert.equal(g.run('transcended.greed || transcended.maliciousProfit'), false);
    assert.deepEqual(Array.from(g.c.selectedAugments, item => item.id), character === 'astra' ? ['vision', 'gravity'] : []);
    assert.equal(g.c.choosingUpgrade, character === 'astra');
  }
  g.c.selectedCharacter = 'mare'; g.run('restart(); for(const upgrade of upgrades)transcended[upgrade.id]=true; transcended.greed=false; transcended.maliciousProfit=false');
  for (const [level, id] of [[2, 'greed'], [5, 'maliciousProfit']]) {
    g.run(`player.level=${level}; choosingUpgrade=false; openUpgradeMenu()`);
    assert.deepEqual(Array.from(g.c.upgradeChoices, item => item.id), [id]);
  }
  g.c.selectedCharacter = 'lush'; g.run('restart()');
  assert.equal(g.c.selectedAugments.length, 2);
  assert.equal(g.c.player.lifeStealLevel, 1);
});

test('LusH guide describes the starter kit and Q homing only until its first hit', () => {
  const g = game();
  assert.match(g.c.characterSkillGuide.lush.passive, /탐욕 3단계.*초월: 흡혈 군주.*악의적 수익 창출/);
  const passive = g.c.characterSkillGuide.lush.skills.find(([name]) => name.startsWith('패시브'))[1];
  assert.match(passive, /1\.95배/);
  assert.match(passive, /1% 회복/);
  const q = g.c.characterSkillGuide.lush.skills.find(([name]) => name.startsWith('Q'))[1];
  assert.match(q, /첫 적에게 맞을 때까지 유도/);
  assert.match(q, /첫 적중 후에는 직선으로 관통/);
});
