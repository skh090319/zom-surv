const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function game() {
  const context = {
    Math,
    performance: { now: () => 1000 },
    player: new Proxy({ x: 100, y: 100, damage: 40, level: 10, fireCooldown: 0, fireRateBonus: 0 }, { get: (target, key) => target[key] ?? 0 }),
    mouse: { worldX: 600, worldY: 100 },
    zombies: [],
    selectedCharacter: 'nullZero',
    screenMode: 'game',
    transcended: { nullZeroPacket: false, nullZeroQuarantine: false, nullZeroFork: false },
    scaledDamage: value => value,
    enemyMaxHpDamage: (enemy, ratio) => enemy.maxHp * ratio,
    killZombie(index) { context.zombies.splice(index, 1); },
    worldStart() {}, worldEnd() {}, drawRoundedRect() {}, drawCooldownCover() {}, drawSkillHudLabel() {},
    nullZeroSpriteLoaded: false,
    nullZeroSkillIconAtlas: { complete: false, naturalWidth: 0 },
    ctx: new Proxy({}, { get(target, key) { return target[key] ?? (() => ({ addColorStop() {} })); } }),
    canvas: { width: 1280, height: 720 }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/04-null-zero.js'), 'utf8'), context);
  return { context, run: code => vm.runInContext(code, context) };
}

test('malicious packets apply infection and five stacks detonate into nearby enemies', () => {
  const g = game();
  g.context.zombies.push({ id: 1, x: 145, y: 100, r: 20, hp: 1000, maxHp: 1000 }, { id: 2, x: 205, y: 100, r: 20, hp: 1000, maxHp: 1000 });
  g.run('for(let i=0;i<4;i++)infectNullZero(zombies[0]);');
  assert.equal(g.context.zombies[0].nullZeroInfection, 4);
  g.run('infectNullZero(zombies[0]);');
  assert.equal(g.context.zombies[0].nullZeroInfection, 0);
  assert.equal(g.context.zombies[1].nullZeroInfection, 2);
  assert.ok(g.context.zombies[0].hp < 1000);
});

test('basic attack creates a sharp packet and fork mode creates two additional packets', () => {
  const g = game();
  g.run('attackWithNullZero()');
  assert.equal(g.run('nullZeroProjectiles.length'), 1);
  g.context.player.fireCooldown = 0;
  g.context.player.nullZeroForkTime = 120;
  g.run('attackWithNullZero()');
  assert.equal(g.run('nullZeroProjectiles.length'), 4);
});

test('kernel panic is locked before level ten and detonates infected targets after unlock', () => {
  const g = game();
  g.context.zombies.push({ id: 3, x: 240, y: 100, r: 22, hp: 1200, maxHp: 1200 });
  g.context.player.level = 9;
  g.run('activateNullZeroR()');
  assert.equal(g.context.player.nullZeroRCooldown ?? 0, 0);
  g.context.player.level = 10;
  g.run('activateNullZeroR()');
  assert.equal(g.context.player.nullZeroRCooldown, g.run('NULL_ZERO_R_CD'));
  assert.ok(g.context.zombies[0].hp < 1200);
  assert.ok(g.run('nullZeroEffects.some(effect=>effect.type==="kernel")'));
});
