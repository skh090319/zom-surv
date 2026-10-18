const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game() {
  const context = {
    Math, Image: class {}, selectedCharacter: 'aria', transcended: {},
    WORLD: {width: 4000, height: 4000},
    player: {x: 1000, y: 1000, r: 20, damage: 100, level: 10, fireCooldown: 0,
      ariaQCooldown: 0, ariaECooldown: 0, ariaXCooldown: 0, ariaRCooldown: 0,
      ariaUltimateTime: 0, ariaSoilLevel: 0, ariaThornLevel: 0, ariaNightLevel: 0, ariaNightTick: 0},
    mouse: {worldX: 1000, worldY: 1000}, zombies: [], scaledDamage: value => value,
    killZombie(index) {context.zombies.splice(index, 1);},
    MOBILE_SKILL_KEYS: {aria: ['q','e','x','r']}
  };
  vm.createContext(context);
  const run = code => vm.runInContext(code, context);
  for (const name of ['04-aria', '04-bosses', '08-mobile-targeting']) {
    run(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'));
  }
  return {context, run, step(n) {run(`for(let frame=0;frame<${n};frame++)updateAria()`);},
    enemy(x=1000,y=1000,extra={}) {
      const enemy = {x,y,r:18,hp:100000,maxHp:100000,...extra};
      context.zombies.push(enemy);return enemy;
    }};
}
function near(actual, expected) {assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);}

test('Q preserves its soil requirement, stage damage, slow duration and cooldown', () => {
  const g = game(), enemy = g.enemy();
  g.run('activateAriaQ()');assert.equal(enemy.hp,100000);assert.equal(g.context.player.ariaQCooldown,0);
  g.run('createAriaSoil(1000,1000);createAriaSoil(1000,1000);player.ariaThornLevel=2;player.ariaNightLevel=1;activateAriaQ()');
  near(100000-enemy.hp,100*(1.15+2*.18)*1.26*1.07);
  assert.equal(enemy.slowTime,57);assert.equal(g.context.player.ariaQCooldown,270);
  const hp=enemy.hp;g.run('activateAriaQ()');assert.equal(enemy.hp,hp);
  g.step(270);assert.equal(g.context.player.ariaQCooldown,0);
});

test('Q thorn transcendence still uses the existing raid percentage conversion', () => {
  const g = game(), boss = g.enemy(1000,1000,{isRaidBoss:true,raidIndex:1});
  g.run('createAriaSoil(1000,1000);transcended.ariaThorn=true;activateAriaQ()');
  near(100000-boss.hp,100*1.33+300);
});

test('E casts without a garden, clamps its target, and creates a connected five-flower garden', () => {
  const g = game(), enemy = g.enemy(1520,1000), outside = g.enemy(1800,1000);
  g.context.mouse.worldX=3000;g.run('activateAriaE()');
  const field=g.run('ariaJudgments[0]');assert.equal(field.x,1520);assert.equal(field.y,1000);
  near(100000-enemy.hp,350);assert.equal(outside.hp,100000);
  assert.equal(g.run('ariaSoils.length'),5);assert.ok(g.run('ariaGardenCount()')>0);
  assert.equal(g.run('ariaSoils.every(s=>s.stage===2)'),true);
  g.run('activateAriaE()');assert.equal(g.run('ariaJudgments.length'),1);
});

test('E applies nine timed waves and a final burst exactly once across five seconds', () => {
  const g = game(), enemy = g.enemy();g.run('activateAriaE()');
  g.step(29);near(100000-enemy.hp,350);
  g.step(1);near(100000-enemy.hp,500);
  g.step(269);near(100000-enemy.hp,1700);
  g.step(1);near(100000-enemy.hp,2200);assert.equal(g.run('ariaJudgments.length'),0);
  g.step(50);near(100000-enemy.hp,2200);
});

test('E soil upgrade changes the real target area and transcendence grows mature flowers', () => {
  const g = game(), enemy = g.enemy(1290,1000);
  g.context.player.ariaSoilLevel=3;g.context.transcended.ariaSoil=true;g.run('activateAriaE()');
  near(100000-enemy.hp,350);assert.equal(g.run('ariaJudgments[0].r'),290);
  assert.equal(g.run('ariaSoils.every(s=>s.stage===3)'),true);
});

test('X follows movement with repeated damage, no teleport, and an expiring movement buff', () => {
  const g = game(), origin = g.enemy(), destination = g.enemy(1500,1000);
  g.context.mouse.worldX=3000;g.run('activateAriaX()');
  assert.equal(g.context.player.x,1000);near(100000-origin.hp,200);
  assert.equal(g.run('getAriaMoveMultiplier()'),1.25);
  g.context.player.x=1500;g.step(18);
  near(100000-origin.hp,200);near(100000-destination.hp,120);
  assert.equal(g.run('ariaPetalStorm.x'),1500);assert.ok(destination.slowTime>=40);
  g.step(342);assert.equal(g.run('ariaPetalStorm'),null);assert.equal(g.run('getAriaMoveMultiplier()'),1);
  near(100000-destination.hp,2400);
});

test('R is level locked, creates a stationary twelve-second world tree, and matures nearby soils', () => {
  const g = game();g.context.player.level=9;g.run('activateAriaR()');assert.equal(g.run('ariaWorldTree'),null);
  g.context.player.level=10;g.context.mouse.worldX=3000;
  g.run('createAriaSoil(1800,1000);createAriaSoil(2500,1000);ariaSoils.forEach(s=>s.life=2);activateAriaR()');
  assert.equal(g.run('ariaWorldTree.x'),1450);assert.equal(g.context.player.ariaUltimateTime,720);
  assert.equal(g.run('ariaSoils.find(s=>s.x===1800).stage'),3);
  g.context.player.x=3000;g.step(2);
  assert.equal(g.run('ariaWorldTree.x'),1450);assert.equal(g.run('ariaSoils.some(s=>s.x===2500)'),false);
  assert.equal(g.run('ariaSoils.find(s=>s.x===1800).life===ariaSoils.find(s=>s.x===1800).maxLife'),true);
  assert.equal(g.context.player.ariaUltimateTime,718);
});

test('R has fifteen waves and one finale, with bounded raid bonus independent of raid HP', () => {
  const g = game(), small = g.enemy(1000,1000,{isRaidBoss:true,raidIndex:1}), large = g.enemy(1000,1000,{isRaidBoss:true,raidIndex:1,hp:10000000,maxHp:10000000});
  g.run('activateAriaR()');near(100000-small.hp,800);
  g.step(45);near(100000-small.hp,1040);
  g.step(674);near(100000-small.hp,4400);
  g.step(1);near(100000-small.hp,6200);near(10000000-large.hp,6200);
  assert.equal(g.run('ariaWorldTree'),null);assert.equal(g.context.player.ariaUltimateTime,0);
  g.step(45);near(100000-small.hp,6200);
});

test('mobile E/R previews match actual cast points at world boundaries; X is a self area', () => {
  for(const key of ['e','r']){
    const g=game();g.context.player.x=25;g.context.player.y=30;
    const spec=g.run(`getMobileSkillTargetSpec('${key}')`);
    const point=g.run(`getMobileAimPoint({angle:Math.PI,strength:1},getMobileSkillTargetSpec('${key}'))`);
    g.context.mouse.worldX=point.x;g.context.mouse.worldY=point.y;
    g.run(`activateAria${key.toUpperCase()}()`);
    const field=g.run(key==='e'?'ariaJudgments[0]':'ariaWorldTree');
    near(field.x,point.x);near(field.y,point.y);assert.equal(field.r,spec.radius);assert.equal(field.x,20);
  }
  const g=game(),spec=g.run('getMobileSkillTargetSpec("x")');
  assert.equal(spec.aim,false);assert.equal(spec.shapes[0].r,180);assert.equal(spec.shapes[0].x,1000);
});

test('new fields are bounded, restart clears active effects, and inactive heroes do not advance them', () => {
  const g=game();g.run('for(let i=0;i<150;i++){player.ariaECooldown=0;activateAriaE()}activateAriaX();activateAriaR()');
  assert.ok(g.run('ariaJudgments.length')<=3);assert.ok(g.run('ariaEffects.length')<=90);assert.ok(g.run('ariaSoils.length')<=18);
  g.context.selectedCharacter='mare';g.step(20);assert.equal(g.run('ariaWorldTree.life'),720);assert.equal(g.run('getAriaMoveMultiplier()'),1);
  g.run('resetAriaRework()');assert.equal(g.run('ariaJudgments.length'),0);assert.equal(g.run('ariaPetalStorm'),null);assert.equal(g.run('ariaWorldTree'),null);assert.equal(g.context.player.ariaUltimateTime,0);
});
