const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function game() {
  const killed = [];
  const c = {
    console, Math: Object.create(Math), selectedCharacter: 'oblivion',
    player: { x: 1000, y: 1000, r: 16, damage: 10, hp: 100, maxHp: 100, level: 10, fireCooldown: 0 },
    mouse: { worldX: 1600, worldY: 1000 }, zombies: [], scaledDamage: n => n,
    killZombie(index, z) {
      assert.equal(c.zombies[index], z, 'death must use the current live enemy index');
      vm.runInContext('oblivionAwardKill', c)(z);
      killed.push(z); c.zombies.splice(index, 1);
      if (c.onKill) c.onKill(z);
    }
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/13-oblivion-combat.js'), 'utf8'), c);
  const run = source => vm.runInContext(source, c);
  run('resetOblivionCombat()');
  return {
    c, run, killed, step(frames) { run(`for(let i=0;i<${frames};i++)updateOblivionCombat()`); },
    enemy(x, y, hp = 100000, extra = {}) { const z = { x, y, r: 18, hp, maxHp: hp, ...extra }; c.zombies.push(z); return z; }
  };
}
function near(actual, expected, label) { assert.ok(Math.abs(actual - expected) < 1e-6, `${label || ''}: ${actual} != ${expected}`); }

test('sealed basic is a real piercing projectile, hits once per enemy, and uses shared damage scaling', () => {
  const g = game(), a = g.enemy(1100, 1000), b = g.enemy(1300, 1000), side = g.enemy(1150, 1100);
  g.c.scaledDamage = n => n * 3;
  assert.equal(g.run('attackWithOblivion()'), true);
  assert.equal(g.run('attackWithOblivion()'), false);
  assert.equal(g.run('oblivionState.shots'), 1);
  g.step(50);
  near(a.hp, 100000 - 288); near(b.hp, 100000 - 288); assert.equal(side.hp, 100000);
  assert.equal(g.run('oblivionState.projectiles.length'), 0);
  assert.equal(g.run('oblivionState.gauge'), 12);
  assert.equal(g.c.player.damage, 10); assert.equal(g.c.scaledDamage(10), 30);
});

test('enhanced basic damages a broad forward wedge with radius-aware edges and no rear hit', () => {
  const g = game(), center = g.enemy(1200, 1000), flank = g.enemy(1120, 1170), rear = g.enemy(800, 1000), far = g.enemy(1340, 1000);
  g.run('oblivionState.empowered=true;oblivionState.gauge=80;attackWithOblivion()');
  near(center.hp, 99880); near(flank.hp, 99880); assert.equal(rear.hp, 100000); assert.equal(far.hp, 100000);
  assert.equal(g.run('oblivionState.projectiles.length'), 0);
  assert.equal(g.run('oblivionState.effects.find(e=>e.kind==="slash").arc'), 2.25);
});

test('Q tears and closes the same fixed long line in two distinct damage phases', () => {
  const g = game(), nearTarget = g.enemy(1200, 1000), far = g.enemy(2010, 1000), side = g.enemy(1400, 1080), rear = g.enemy(900, 1000);
  g.run('activateOblivionQ()');
  near(nearTarget.hp, 99920); near(far.hp, 99920); assert.equal(side.hp, 100000); assert.equal(rear.hp, 100000);
  assert.equal(g.c.player.oblivionqCooldown, 210);
  assert.equal(g.run('activateOblivionQ()'), false);
  g.c.player.y += 300; g.c.mouse.worldY += 300;
  g.step(25); near(nearTarget.hp, 99920);
  g.step(1); near(nearTarget.hp, 99800); near(far.hp, 99800);
  g.step(100); near(nearTarget.hp, 99800); assert.equal(g.run('oblivionState.casts.length'), 0);
});

test('empowered Q has three real prongs but overlaps share a damage budget, including endpoint implosions', () => {
  const g = game(), overlap = g.enemy(1050, 1000), prong = g.enemy(1000 + Math.cos(.20) * 650, 1000 + Math.sin(.20) * 650);
  const tip = g.enemy(2120, 1000, 100000, { r: 300, isRaidBoss: true });
  g.run('oblivionState.empowered=true;oblivionState.gauge=100;activateOblivionQ()');
  assert.equal(g.run('oblivionState.casts[0].lines.length'), 3);
  near(overlap.hp, 99880); near(prong.hp, 99880); near(tip.hp, 99880);
  g.step(26);
  near(overlap.hp, 99700); near(prong.hp, 99700); near(tip.hp, 99620);
  assert.equal(g.run('oblivionState.effects.filter(e=>e.kind==="implosion").length'), 3);
});

test('E follows cursor distance up to 600, squeezes normal enemies, then deals delayed smash damage', () => {
  const g = game(); g.c.mouse.worldX = 1450;
  const normal = g.enemy(1610, 1000), side = g.enemy(1450, 1210), outside = g.enemy(1700, 1000);
  g.run('activateOblivionE()');
  assert.equal(g.run('oblivionState.casts[0].x'), 1450);
  assert.equal(g.run('oblivionState.casts[0].r'), 205);
  g.step(33);
  assert.ok(normal.x < 1500); assert.ok(side.y < 1080); assert.equal(normal.hp, 100000);
  g.step(1); near(normal.hp, 99800); near(side.hp, 99800); assert.equal(outside.hp, 100000);
  g.step(60); near(normal.hp, 99800);
  g.c.mouse.worldX = 5000; g.run('player.oblivioneCooldown=0;activateOblivionE()');
  assert.equal(g.run('oblivionState.casts[0].x'), 1600);
});

test('enhanced E adds the overhead hit and never displaces bosses or movement-immune summons', () => {
  const g = game(), kinds = [{ boss: true }, { isRaidBoss: true }, { isBossMinion: true }, { astraControl: true }];
  const targets = kinds.map((extra, i) => g.enemy(1490 + i * 15, 1100, 100000, extra));
  g.run('oblivionState.empowered=true;oblivionState.gauge=100;activateOblivionE()');
  g.step(34);
  for (let i = 0; i < targets.length; i++) { near(targets[i].hp, 99720); assert.equal(targets[i].x, 1490 + i * 15); assert.equal(targets[i].y, 1100); assert.equal(targets[i].slowTime, undefined); }
  g.step(17); for (const z of targets) near(z.hp, 99720);
  g.step(1); for (const z of targets) near(z.hp, 99540);
  g.step(100); for (const z of targets) near(z.hp, 99540);
});

test('hit gain is capped per frame, cannot farm dead or removed enemies, and gauge never exceeds 100', () => {
  const g = game(); for (let i = 0; i < 20; i++) g.enemy(1100 + i * 4, 1000);
  g.run('activateOblivionQ()'); assert.equal(g.run('oblivionState.gauge'), 12);
  g.step(26); assert.equal(g.run('oblivionState.gauge'), 24);
  const dead = g.enemy(1100, 1000, 0); g.c.dead = dead;
  assert.equal(g.run('oblivionDamage(dead,100)'), false);
  assert.equal(g.run('oblivionDamage({x:1100,y:1000,hp:100},10)'), false);
  assert.equal(g.run('oblivionDamage(zombies[0],NaN)'), false);
  g.run('oblivionGainGauge(200)'); assert.equal(g.run('oblivionState.gauge'), 100);
});

test('canonical deaths award kills once, preserve explosion chains, and cannot splice unrelated enemies', () => {
  const g = game(), a = g.enemy(1100, 1000, 1), chained = g.enemy(1400, 1000, 1), healthy = g.enemy(1500, 1000), bystander = g.enemy(1700, 1200);
  g.c.onKill = z => { if (z === a) { chained.hp = 0; g.c.killZombie(g.c.zombies.indexOf(chained), chained); } };
  g.run('activateOblivionQ()');
  assert.deepEqual(g.killed, [a, chained]); assert.ok(g.c.zombies.includes(bystander)); near(healthy.hp, 99920);
  assert.equal(g.run('oblivionState.shield'), 16);
  g.c.a = a; assert.equal(g.run('oblivionAwardKill(a)'), false); assert.equal(g.run('oblivionDamage(a,100)'), false);
  assert.equal(g.run('oblivionState.shield'), 16);
});

test('passive shield is capped at half max HP and expires 300 active frames after the last kill', () => {
  const g = game(); for (let i = 0; i < 10; i++) g.enemy(1100 + i, 1000, 1);
  g.run('activateOblivionQ()'); assert.equal(g.run('oblivionState.shield'), 50); assert.equal(g.run('oblivionState.shieldTime'), 300);
  g.step(299); assert.equal(g.run('oblivionState.shield'), 50);
  g.step(1); assert.equal(g.run('oblivionState.shield'), 0);
  assert.equal(g.c.player.hp, 100);
});

test('X requires 20 collapse, consumes six per second, can turn off during cooldown, and never costs HP', () => {
  const g = game(); assert.equal(g.run('activateOblivionX()'), false);
  g.run('oblivionState.gauge=20'); assert.equal(g.run('activateOblivionX()'), true);
  assert.equal(g.run('oblivionState.gauge'), 20);
  g.step(60); near(g.run('oblivionState.gauge'), 14); assert.equal(g.run('oblivionEmpowered()'), true);
  g.run('player.oblivionxCooldown=40'); assert.equal(g.run('activateOblivionX()'), true);
  const remaining = g.run('oblivionState.gauge'); g.step(120); assert.equal(g.run('oblivionState.gauge'), remaining);
  assert.equal(g.run('oblivionEmpowered()'), false); assert.equal(g.c.player.hp, 100);
  g.run('oblivionState.gauge=20;activateOblivionX()'); g.step(200);
  assert.equal(g.run('oblivionState.gauge'), 0); assert.equal(g.run('oblivionEmpowered()'), false); assert.equal(g.c.player.hp, 100);
});

test('R unlocks at 10, grants exactly 600 frames of full power and preserves X gauge and preference', () => {
  const g = game(); g.c.player.level = 9;
  assert.equal(g.run('activateOblivionR()'), false); assert.equal(g.c.player.oblivionrCooldown, 0);
  g.c.player.level = 10; g.run('oblivionState.gauge=40;activateOblivionX();activateOblivionR()');
  assert.equal(g.run('oblivionState.ultimateTime'), 600); assert.equal(g.run('oblivionEmpowered()'), true);
  assert.equal(g.run('activateOblivionR()'), false); assert.equal(g.run('activateOblivionX()'), false);
  g.step(599); assert.equal(g.run('oblivionState.ultimateTime'), 1); assert.equal(g.run('oblivionState.gauge'), 40);
  g.step(1); assert.equal(g.run('oblivionState.ultimateTime'), 0); assert.equal(g.run('oblivionState.empowered'), true); assert.equal(g.run('oblivionState.gauge'), 40);
  assert.equal(g.run('oblivionState.casts.filter(c=>c.kind==="finale").length'), 1);
  g.step(1); near(g.run('oblivionState.gauge'), 39.9);
});

test('R avatar mirrors basic/Q/E after 18 frames with real scaled damage and never recursively echoes', () => {
  const g = game(), z = g.enemy(1160, 1000);
  g.run('activateOblivionR();attackWithOblivion();activateOblivionQ();activateOblivionE()');
  near(z.hp, 100000 - 120 - 120); assert.equal(g.run('oblivionState.echoes.length'), 3);
  g.step(17); near(z.hp, 99760);
  g.step(1); near(z.hp, 99760 - 120 * .72 - 120 * .72);
  assert.equal(g.run('oblivionState.echoes.length'), 0);
  assert.equal(g.run('oblivionState.casts.filter(c=>c.echo).length'), 2);
  assert.equal(g.run('oblivionState.avatarPulse'), 24);
  assert.equal(g.run('oblivionState.shots'), 1);
  g.step(100); assert.equal(g.run('oblivionState.echoes.length'), 0);
});

test('R ending tear aims at the current cursor, damages bosses without max-HP execution, and closes once', () => {
  const g = game(), front = g.enemy(1000, 1800, 1000000, { isRaidBoss: true }), side = g.enemy(1800, 1000);
  g.run('activateOblivionR()'); g.c.mouse.worldX = 1000; g.c.mouse.worldY = 2000;
  g.step(600); near(front.hp, 1000000 - 500); assert.equal(side.hp, 100000);
  assert.equal(front.x, 1000); assert.equal(front.y, 1800); assert.equal(g.run('oblivionEmpowered()'), false);
  g.step(32); near(front.hp, 1000000 - 800);
  g.step(100); near(front.hp, 1000000 - 800); assert.equal(g.run('oblivionState.casts.length'), 0);
});

test('R copied E applies both real smash phases at 72 percent and the avatar follows movement', () => {
  const g = game(), boss = g.enemy(1600, 1000, 100000, { isRaidBoss: true });
  g.run('activateOblivionR();activateOblivionE()');
  const initialX = g.run('oblivionState.avatarX');
  g.c.player.x += 100; g.step(33);
  assert.ok(g.run('oblivionState.avatarX') > initialX); assert.equal(boss.hp, 100000);
  g.step(1); near(boss.hp, 100000 - 280);
  g.step(18); near(boss.hp, 100000 - 280 - 180 - 280 * .72);
  g.step(18); near(boss.hp, 100000 - 460 * 1.72);
  assert.equal(boss.x, 1600); assert.equal(boss.y, 1000);
});

test('starting attack power is emphatic but a fresh Q/E/R combo cannot instantly execute a raid boss', () => {
  const g = game(); g.c.player.damage = 35;
  const boss = g.enemy(1200, 1000, 37500, { isRaidBoss: true }); g.c.mouse.worldX = 1200;
  g.run('activateOblivionR();attackWithOblivion();activateOblivionQ();activateOblivionE()');
  g.step(80);
  // Basic 12x + Q 30x + E 46x, each followed by its 72-percent avatar attack.
  near(37500 - boss.hp, 35 * 88 * 1.72);
  assert.ok(boss.hp > 30000); assert.equal(g.killed.length, 0);
});

test('ultimate cancellation clears pending echoes at the end and cannot schedule new replicas afterward', () => {
  const g = game(); g.run('activateOblivionR()'); g.step(592);
  g.run('attackWithOblivion()'); assert.equal(g.run('oblivionState.echoes.length'), 1);
  g.step(8); assert.equal(g.run('oblivionState.echoes.length'), 0);
  g.step(30); assert.equal(g.run('oblivionState.effects.some(e=>e.kind==="avatarEcho")'), false);
});

test('projectile, cast, effect and echo pools remain bounded and fully drain after combat stops', () => {
  const g = game();
  g.run(`activateOblivionR();for(let i=0;i<300;i++){
    oblivionSpawnShard(player.x,player.y,0);player.fireCooldown=0;attackWithOblivion();
    player.oblivionqCooldown=0;activateOblivionQ();player.oblivioneCooldown=0;activateOblivionE();
  }`);
  for (const key of ['projectiles', 'casts', 'effects', 'echoes']) assert.ok(g.run(`oblivionState.${key}.length<=OBLIVION_LIMITS.${key}`), key);
  g.step(800);
  for (const key of ['projectiles', 'casts', 'effects', 'echoes']) assert.equal(g.run(`oblivionState.${key}.length`), 0, key);
});

test('restart clears every combat resource, visual transition, pending attack, and cooldown', () => {
  const g = game(); g.enemy(1200, 1000, 1);
  g.run('oblivionState.gauge=100;activateOblivionX();activateOblivionR();attackWithOblivion();activateOblivionQ();activateOblivionE()');
  g.step(5); g.run('resetOblivionCombat()');
  for (const key of ['gauge', 'shield', 'shieldTime', 'ultimateTime', 'formBlend', 'frame', 'shots', 'avatarPulse']) assert.equal(g.run(`oblivionState.${key}`), 0, key);
  for (const key of ['projectiles', 'casts', 'effects', 'echoes']) assert.equal(g.run(`oblivionState.${key}.length`), 0, key);
  for (const key of ['q', 'e', 'x', 'r']) assert.equal(g.c.player['oblivion' + key + 'Cooldown'], 0);
  assert.equal(g.run('oblivionState.empowered'), false);
});

test('another selected hero cannot advance or consume Oblivion combat state', () => {
  const g = game(); g.run('oblivionState.gauge=80;activateOblivionX();activateOblivionQ()');
  g.c.selectedCharacter = 'astra'; g.step(120);
  assert.equal(g.run('oblivionState.frame'), 0); assert.equal(g.run('oblivionState.gauge'), 80);
  assert.equal(g.c.player.oblivionqCooldown, 210); assert.equal(g.run('oblivionState.casts[0].age'), 0);
});
