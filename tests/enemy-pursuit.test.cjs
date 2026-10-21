const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = name => fs.readFileSync(path.join(__dirname, '..', 'js', `${name}.js`), 'utf8');
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);

function game({world = 1, difficultySpeed = 1} = {}) {
  const draws = [];
  const c = {
    console, Math: Object.create(Math), selectedWorld: world, wave: 7,
    WORLD: {width: 1800, height: 1400}, zombies: [],
    player: {x: 900, y: 700, r: 20, hp: 10000, maxHp: 10000, invincibleTime: 0, crownLevel: 0, dodgeLevel: 0},
    selectedCharacter: 'arc', transcended: {}, zombieSlowTimer: 0,
    stickyZones: [], fireTrails: [], terraStructures: [], gravityFields: [], particles: [],
    getZombieDifficultySpeedMultiplier: () => difficultySpeed,
    getZombieDifficultyDamageMultiplier: () => 1,
    getRaidBossMinionDamage: () => 10,
    astraControlled: enemy => !!enemy.captured,
    astraWellSuppressesEnemy: () => false,
    isInCameraView: () => true,
    getWorldMonsterImage: () => ({complete: true, naturalWidth: 640, naturalHeight: 640}),
    ctx: new Proxy({}, {get: (_, name) => (...args) => draws.push([name, ...args])})
  };
  c.Math.random = () => .5;
  vm.createContext(c);
  const run = source => vm.runInContext(source, c);
  for (const name of ['04-world-monsters', '06-entities-update', '07-world-monsters-render']) run(read(name));
  run('resetWorldMonsters()');
  return {
    c, run,
    hound(x = 600, y = 700, options = {}) {
      c.options = options;
      const enemy = run(`createWorldMonster('alley-hound', ${x}, ${y}, options)`);
      c.zombies.push(enemy);
      return enemy;
    },
    tick() {
      run('updateZombies(); if (player.invincibleTime > 0) player.invincibleTime--;');
    },
    renderFacing(enemy) {
      draws.length = 0;
      c.renderEnemy = enemy;
      assert.equal(run('drawWorldMonsterSprite(renderEnemy, 64, renderEnemy.y - 48)'), true);
      const flip = draws.find(call => call[0] === 'scale');
      assert.ok(flip, 'world monster sprite renders a horizontal orientation');
      assert.equal(flip[2], 1, 'the sprite remains upright');
      return flip[1];
    }
  };
}

test('World 1 hounds stay at contact range instead of crossing through a stationary player', () => {
  for (const {wave, difficultySpeed} of [{wave: 7, difficultySpeed: 1}, {wave: 1, difficultySpeed: 1.4}]) {
    const g = game({difficultySpeed});
    const enemy = g.hound(861, 700, {wave});
    const contact = enemy.r + g.c.player.r;
    for (let frame = 0; frame < 600; frame++) {
      g.tick();
      assert.ok(enemy.x < g.c.player.x, `hound stays on its approach side at frame ${frame}`);
      close(Math.hypot(enemy.x - g.c.player.x, enemy.y - g.c.player.y), contact, `stable contact at frame ${frame}`);
    }
  }
});

test('a slowed hound maintains the normal twelve-frame damage cadence while touching the player', () => {
  const g = game();
  const enemy = g.hound(862, 700, {speed: .4});
  g.c.zombieSlowTimer = 100;
  const hitFrames = [];
  for (let frame = 1; frame <= 37; frame++) {
    const before = g.c.player.hp;
    g.tick();
    if (g.c.player.hp < before) hitFrames.push(frame);
    close(Math.hypot(enemy.x - g.c.player.x, enemy.y - g.c.player.y), enemy.r + g.c.player.r, 'slowing does not bounce the hound out of contact');
  }
  assert.deepEqual(hitFrames, [1, 13, 25, 37]);
  assert.equal(g.c.player.hp, 9960);
});

test('hound movement and the rendered sprite reverse on the first frame after the player changes sides', () => {
  const g = game();
  const enemy = g.hound(600, 700, {speed: 1});
  g.tick();
  assert.equal(g.renderFacing(enemy), 1);
  g.c.player.x = enemy.x - 300;
  g.c.player.y = enemy.y;
  const before = enemy.x;
  g.tick();
  assert.ok(enemy.x < before, 'the hound immediately pursues the new player position');
  assert.equal(g.renderFacing(enemy), -1, 'the sprite faces its new horizontal movement immediately');
});

test('a hound flanking a vertically aligned player faces its actual sideways movement', () => {
  const g = game();
  const enemy = g.hound(900, 400, {speed: 1});
  g.tick();
  assert.ok(enemy.x < 900, 'the hound circles left while approaching from above');
  assert.ok(enemy.y > 400, 'the flank still advances toward the player');
  assert.equal(g.renderFacing(enemy), -1, 'the body follows the sideways flank instead of the target bearing');
});

test('hound flanking, close-range rush, and slow effects retain their movement behavior', () => {
  const samples = [];
  for (const {distance, slowed} of [{distance: 300, slowed: false}, {distance: 100, slowed: false}, {distance: 300, slowed: true}]) {
    const g = game();
    const enemy = g.hound(g.c.player.x - distance, g.c.player.y, {speed: 1});
    if (slowed) g.c.zombieSlowTimer = 30;
    const start = {x: enemy.x, y: enemy.y};
    g.tick();
    const dx = enemy.x - start.x, dy = enemy.y - start.y;
    assert.ok(dx > 0, 'all variants approach the player');
    samples.push({dx, dy, travel: Math.hypot(dx, dy)});
  }
  assert.ok(samples[0].dy > 0, 'the mid-distance hound flanks instead of losing its species pattern');
  close(Math.atan2(samples[0].dy, samples[0].dx), .67, 'flank angle');
  close(samples[1].dy, 0, 'the close hound runs directly toward the player');
  close(samples[1].travel / samples[0].travel, 1.3, 'close-range speed boost');
  close(samples[2].travel / samples[0].travel, .45, 'slow-field speed multiplier');
});

test('shared World 2 pursuit resolves contact consistently at low and high movement speeds', () => {
  for (const speed of [.4, 8]) {
    const g = game({world: 2});
    const enemy = {x: 860, y: 700, r: 21, hp: 100, maxHp: 100, speed, boss: false};
    g.c.zombies.push(enemy);
    for (let frame = 0; frame < 240; frame++) {
      g.tick();
      close(enemy.x, 859, `World 2 contact position at speed ${speed}`);
      close(enemy.y, 700, 'contact does not introduce lateral movement');
    }
  }
});

test('an enemy initially at the player center separates to a finite and stable contact position', () => {
  const g = game();
  const enemy = g.hound(900, 700, {speed: 6});
  g.tick();
  const settled = {x: enemy.x, y: enemy.y};
  close(Math.hypot(enemy.x - g.c.player.x, enemy.y - g.c.player.y), enemy.r + g.c.player.r, 'center overlap is resolved');
  for (let frame = 0; frame < 30; frame++) {
    g.tick();
    close(enemy.x, settled.x, 'contact x remains stable');
    close(enemy.y, settled.y, 'contact y remains stable');
  }
});

function addRaidHound(g, x, speed) {
  const enemy = {
    x, y: 700, r: 23, hp: 100, maxHp: 100, speed, boss: false,
    isBossMinion: true, worldRaidMinion: true, worldRaidMinionType: 'alley-hound',
    worldMonsterGrace: 45, controlImmuneX: x, controlImmuneY: 700
  };
  g.c.zombies.push(enemy);
  return enemy;
}

test('fast raid summons stop at the player center without overshooting on later frames', () => {
  const g = game();
  const enemy = addRaidHound(g, 899, 20);
  for (let frame = 0; frame < 12; frame++) {
    g.tick();
    close(enemy.x, g.c.player.x, 'summon x arrives without overshoot');
    close(enemy.y, g.c.player.y, 'summon y arrives without overshoot');
  }
  assert.equal(g.c.player.hp, 10000, 'arrival grace still prevents damage');
});

test('raid hound sprites face left and right with their actual shared chase direction', () => {
  const g = game();
  const enemy = addRaidHound(g, 1100, 4);
  const before = enemy.x;
  g.tick();
  assert.ok(enemy.x < before);
  assert.equal(g.renderFacing(enemy), -1, 'left-moving raid hound is not stuck facing right');
  g.c.player.x = enemy.x + 200;
  g.tick();
  assert.equal(g.renderFacing(enemy), 1, 'raid hound also follows a later direction change');
});

test('near-vertical pursuit preserves the last sprite direction through tiny horizontal changes', () => {
  const g = game();
  const enemy = addRaidHound(g, 700, 4);
  g.tick();
  assert.equal(g.renderFacing(enemy), 1);
  for (const offset of [-.1, .1, -.1, .1]) {
    g.c.player.x = enemy.x + offset;
    g.c.player.y = enemy.y + 200;
    g.tick();
    assert.equal(g.renderFacing(enemy), 1, 'small horizontal motion does not flicker the sprite');
  }
});

test('captured and stunned hounds do not chase, separate, or deal contact damage', () => {
  for (const status of [{captured: true}, {stunTime: 10}]) {
    const g = game();
    const enemy = g.hound(890, 700, {speed: 6});
    Object.assign(enemy, status);
    for (let frame = 0; frame < 5; frame++) g.tick();
    assert.equal(enemy.x, 890);
    assert.equal(enemy.y, 700);
    assert.equal(g.c.player.hp, 10000);
  }
});
