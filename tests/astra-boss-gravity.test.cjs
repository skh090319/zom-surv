const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game() {
  const context = {
    console, Math, Date, performance: { now: () => 0 },
    Image: class { set src(value) { this._src = value; } },
    selectedDifficulty: 'easy', selectedCharacter: 'astra', screenMode: 'game',
    transcended: {}, WORLD: { width: 6000, height: 6000 },
    player: { x: 2000, y: 2000, r: 20, hp: 1000, maxHp: 1000, score: 0, damage: 10, level: 10, invincibleTime: 0, dodgeLevel: 0, bossRootTime: 0, bossSlowTime: 0, astraStardust: 0 },
    mouse: { worldX: 2000, worldY: 2000 },
    zombies: [], bullets: [], droneBullets: [], stickyZones: [], fireTrails: [], terraStructures: [], gravityFields: [], zombieSlowTimer: 0,
    gameOver: false, choosingUpgrade: false,
    tryRevive: () => false, tryDodgeAttack: () => false, openUpgradeMenu() {},
    getRaidBossDifficultySpeedMultiplier: () => 1,
    getZombieDifficultyDamageMultiplier: () => 1,
    getAstraStardustMultiplier() { return context.selectedCharacter === 'astra' ? 1 + context.player.astraStardust * .01 : 1; },
    scaledDamage: n => n,
    killZombie(i) { context.zombies.splice(i, 1); },
    worldStart() {}, worldEnd() {}, ctx: new Proxy({}, { get: () => () => {} })
  };
  vm.createContext(context);
  for (const file of ['04-bosses.js', '04-astra-constellations.js', '04-astra.js', '06-entities-update.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  return { context, run: code => vm.runInContext(code, context) };
}

function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`); }

test('R slows uncaptured ground enemies and immune summons by 90%, then restores their original movement', () => {
  const g = game();
  g.run(`zombies.push(
    {x: 3200, y: 2000, r: 18, hp: 10000, maxHp: 10000, speed: 4},
    {x: 3200, y: 2200, r: 18, hp: 10000, maxHp: 10000, speed: 4, isBossMinion: true, slowTime: 50, stunTime: 50},
    {x: 2100, y: 2000, r: 18, hp: 10000, maxHp: 10000, speed: 4}
  ); activateAstraR();`);
  const [normal, minion, captured] = g.context.zombies;
  const originalMinion = { x: minion.x, y: minion.y };
  g.run('updateZombies()');
  near(3200 - normal.x, .4);
  near(Math.hypot(minion.x - originalMinion.x, minion.y - originalMinion.y), .4);
  assert.equal(minion.slowTime, 0); assert.equal(minion.stunTime, 0);
  assert.equal(captured.x, 2100); assert.equal(captured.y, 2000);
  g.run('resetAstra()');
  const beforeNormal = normal.x, beforeMinion = { x: minion.x, y: minion.y };
  g.run('updateZombies()');
  near(beforeNormal - normal.x, 4);
  near(Math.hypot(minion.x - beforeMinion.x, minion.y - beforeMinion.y), 4);
});

test('E constrains boss pursuit and both dash patterns; R takes priority and expiration restores movement', () => {
  const g = game();
  g.run(`startRaidBoss(1); Object.assign(activeRaidBoss,{x:2000,y:2000});
    player.x=2300; player.y=2000; mouse.worldX=2000; mouse.worldY=2000;
    activateAstraE(); for(let i=0;i<24;i++)updateAstraWells(); raidIntroTime=0;`);
  const boss = g.run('activeRaidBoss');
  g.run('updateRaidBossSystem()');
  near(boss.x - 2000, 2.3 * .48 * .35);
  g.run('Object.assign(activeRaidBoss,{x:2000,y:2000,pattern:0,patternTime:35,dashVx:16,dashVy:0});updateReaperBoss(activeRaidBoss)');
  near(boss.x - 2000, 16 * .35);
  g.run('Object.assign(activeRaidBoss,{x:2000,y:2000,pattern:2,patternTime:38,dashVx:50,dashVy:0});updateAbyssBoss(activeRaidBoss)');
  near(boss.x - 2000, 50 * .35);
  g.run('activateAstraR();Object.assign(activeRaidBoss,{x:2000,patternTime:38});updateAbyssBoss(activeRaidBoss)');
  near(boss.x - 2000, 50 * .1);
  g.run('resetAstra();Object.assign(activeRaidBoss,{x:2000,patternTime:38});updateAbyssBoss(activeRaidBoss)');
  near(boss.x - 2000, 50);
});

test('E captures every raid missile type before hits, poison splitting and scythe return, and removes them after one second', () => {
  for (const type of ['venom', 'venomSmall', 'vine', 'scythe', 'abyssOrb']) {
    const g = game();
    g.run(`activateAstraE();for(let i=0;i<24;i++)updateAstraWells();
      raidArena={x:0,y:0,r:100};
      addRaidProjectile({type:'${type}',x:2000,y:2000,vx:0,vy:0,r:62,damage:.8,life:1,returning:true,travel:60,owner:{x:2000,y:2000,r:76}});
      updateRaidBossProjectiles();`);
    assert.equal(g.context.player.hp, 1000, `${type} must not damage during capture`);
    assert.equal(g.context.player.bossRootTime, 0, `${type} must not root during capture`);
    assert.equal(g.context.player.bossSlowTime, 0, `${type} must not slow during capture`);
    assert.equal(g.run('raidBossProjectiles.length'), 1, `${type} must not split, return or expire before its capture timer`);
    g.run('for(let i=0;i<58;i++)updateRaidBossProjectiles()');
    assert.equal(g.run('raidBossProjectiles.length'), 1, `${type} remains until the full second`);
    g.run('updateRaidBossProjectiles()');
    assert.equal(g.run('raidBossProjectiles.length'), 0, `${type} vanishes after sixty ticks`);
    assert.equal(g.context.player.hp, 1000);
  }
});

test('E attack suppression follows the active suction phase and live radius, not stale status flags', () => {
  const g = game();
  g.run(`zombies.push({x:2000,y:2000,r:18,hp:10000,maxHp:10000,speed:0});activateAstraE();`);
  assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('for(let i=0;i<23;i++)updateAstraWells()');
  assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('updateAstraWells()');
  assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), true, 'core-trapped enemies stay suppressed');
  g.run('zombies[0].x=2000+astraEPullRadius()+zombies[0].r+.01');
  assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false, 'leaving suction restores attacks immediately');
  g.run('zombies[0].x-=.02'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), true);
  g.run('zombies[0].isBossMinion=true'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('zombies[0].isBossMinion=false;zombies[0].astraControl={}'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('delete zombies[0].astraControl;zombies[0].hp=0'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('zombies[0].hp=10000;astraWells[0].life=25'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), true);
  g.run('astraWells[0].life=24'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('astraWells[0].life=100;selectedCharacter="mare"'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
  g.run('selectedCharacter="astra";resetAstra()'); assert.equal(g.run('astraWellSuppressesEnemy(zombies[0])'), false);
});

test('sucked-in contact enemies cannot hurt Astra, while outside enemies and immune minions still can', () => {
  const g = game();
  g.run(`activateAstraE();for(let i=0;i<24;i++)updateAstraWells();
    zombies.push({x:2000,y:2000,r:18,hp:10000,maxHp:10000,speed:0});updateZombies();`);
  assert.equal(g.context.player.hp, 1000); assert.equal(g.context.player.invincibleTime, 0);
  // Astra herself is still within the well; only the attacker's position matters.
  g.run('player.x=2130;zombies[0].x=2155;updateZombies()');
  assert.equal(g.context.player.hp, 990);
  g.run('player.invincibleTime=0;player.hp=1000;player.x=2000;zombies[0].x=2000;zombies[0].isBossMinion=true;updateZombies()');
  assert.equal(g.context.player.hp, 950);
  g.run('player.invincibleTime=0;player.hp=1000;delete zombies[0].isBossMinion;zombies[0].x=2000;astraWells[0].life=24;updateZombies()');
  assert.equal(g.context.player.hp, 990);
});

test('boss E suppression covers contact, charge and lethal dash, but ends immediately outside the well', () => {
  for (const index of [0,1,2]) {
    const g = game();
    g.run(`startRaidBoss(${index});Object.assign(activeRaidBoss,{x:2000,y:2000});player.y=2000;
      activateAstraE();for(let i=0;i<24;i++)updateAstraWells();player.invincibleTime=0;updateRaidBossSystem();`);
    assert.equal(g.context.player.hp, 1000, `boss ${index} contact suppressed`);
    g.run('activeRaidBoss.x=2500;player.x=2500;player.y=2000;player.invincibleTime=0;updateRaidBossSystem()');
    near(g.context.player.hp,1000*(1-g.run(`getRaidBossDamageRatio("contact",${index})`)));
  }
  for (const [index,call] of [[1,'updateReaperBoss(activeRaidBoss)'],[2,'updateAbyssBoss(activeRaidBoss)']]) {
    const g = game();
    g.run(`startRaidBoss(${index});Object.assign(activeRaidBoss,{x:2000,y:2000,dashVx:0,dashVy:0,pattern:${index===1?0:2},patternTime:${index===1?35:38}});player.y=2000;
      activateAstraE();for(let i=0;i<24;i++)updateAstraWells();player.invincibleTime=0;${call}`);
    assert.equal(g.context.player.hp,1000);assert.equal(g.context.gameOver,false);
    g.run(`activeRaidBoss.x=2500;player.x=2500;activeRaidBoss.dashHit=false;activeRaidBoss.patternTime=${index===1?35:38};${call}`);
    assert.equal(g.context.player.hp,index===1?720:0);assert.equal(g.context.gameOver,index===2);
  }
});

test('a suppressed boss cannot damage or root Astra with remote missiles; outside sources are unaffected', () => {
  for (const type of ['venom','venomSmall','vine','scythe','abyssOrb']) {
    const g = game();
    g.run(`startRaidBoss(0);Object.assign(activeRaidBoss,{x:2000,y:2000});activateAstraE();
      for(let i=0;i<24;i++)updateAstraWells();player.invincibleTime=0;player.x=2500;player.y=2000;raidArena=null;
      addRaidProjectile({type:'${type}',owner:activeRaidBoss,x:2500,y:2000,vx:0,vy:0,r:12,damage:.2,life:100,travel:0});
      updateRaidBossProjectiles();`);
    assert.equal(g.context.player.hp,1000,type);assert.equal(g.context.player.bossRootTime,0,type);assert.equal(g.context.player.bossSlowTime,0,type);
    assert.equal(g.run('raidBossProjectiles[0].astraAbsorb'),undefined,'remote missile was not itself absorbed');
    g.run('activeRaidBoss.x=2800;updateRaidBossProjectiles()');
    assert.equal(g.context.player.hp,800,type);
  }
});

test('poison and lightning use their source boss suppression without granting global invulnerability', () => {
  for (const type of ['poison','lightning']) {
    const g = game();
    g.run(`startRaidBoss(${type==='poison'?0:2});Object.assign(activeRaidBoss,{x:2000,y:2000});activateAstraE();
      for(let i=0;i<24;i++)updateAstraWells();player.invincibleTime=0;player.x=2500;player.y=2000;
      raidBossZones.push({type:'${type}',owner:activeRaidBoss,x:2500,y:2000,r:92,delay:0,life:100,tick:0});updateRaidBossZones();`);
    assert.equal(g.context.player.hp,1000,type);
    g.run(`activeRaidBoss.x=2800;raidBossZones.length=0;
      raidBossZones.push({type:'${type}',owner:activeRaidBoss,x:2500,y:2000,r:92,delay:0,life:100,tick:0});updateRaidBossZones();`);
    near(g.context.player.hp,1000*(1-g.run(`getRaidBossDamageRatio('${type}')`)));
  }
});

test('every boss ranged spawn retains its actual owner, including split poison and ground hazards', () => {
  const g = game();
  g.run(`startRaidBoss(0);firePoisonVolley(activeRaidBoss);splitVenomProjectile(raidBossProjectiles[0]);
    activeRaidBoss.pattern=2;activeRaidBoss.patternTime=23;updateBloomBoss(activeRaidBoss);
    activeRaidBoss.pattern=0;activeRaidBoss.patternTime=0;updateBloomBoss(activeRaidBoss);`);
  assert.equal(g.run('raidBossProjectiles.every(p=>p.owner===activeRaidBoss)'),true);
  assert.equal(g.run('raidBossZones.every(z=>z.owner===activeRaidBoss)'),true);
  g.run(`raidBossProjectiles.length=0;raidBossZones.length=0;fireAbyssOrb(activeRaidBoss);fireAbyssOrbRing(activeRaidBoss);
    activeRaidBoss.pattern=1;activeRaidBoss.patternTime=0;updateAbyssBoss(activeRaidBoss);
    activeRaidBoss.pattern=1;activeRaidBoss.patternTime=21;updateReaperBoss(activeRaidBoss);`);
  assert.equal(g.run('raidBossProjectiles.every(p=>p.owner===activeRaidBoss)'),true);
  assert.equal(g.run('raidBossZones.every(z=>z.owner===activeRaidBoss)'),true);
});

test('stardust does not amplify augment percentage damage or the fixed raid conversion', () => {
  const g = game();
  g.context.player.astraStardust = 50;
  near(g.run('enemyMaxHpDamage({maxHp:1000}, .1)'), 100);
  near(g.run('enemyMaxHpDamage({isRaidBoss:true,raidIndex:1,maxHp:150000}, .01)'), 50);
  g.context.selectedCharacter = 'mare';
  near(g.run('enemyMaxHpDamage({maxHp:1000}, .1)'), 100);
  near(g.run('enemyMaxHpDamage({isRaidBoss:true,raidIndex:1,maxHp:150000}, .01)'), 50);
});

test('dagger augment damage ignores stardust for Astra and stays unchanged for other characters', () => {
  const g = game();
  g.context.player.daggerLevel = 1;
  g.context.player.astraStardust = 100;
  g.context.scaledDamage = n => n * g.context.getAstraStardustMultiplier();
  g.context.daggers = [{ angle: -.065, radius: 100, cooldown: 0, damage: 35 }];
  g.context.zombies.push({ x: 2100, y: 2000, r: 18, hp: 1000 });
  g.run('updateDaggers()');
  near(g.context.zombies[0].hp, 965);
  g.run('selectedCharacter="mare";daggers[0].angle=-.065;daggers[0].cooldown=0;updateDaggers()');
  near(g.context.zombies[0].hp, 930);
});
