const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game() {
  const context = {
    console, Math, selectedCharacter: 'astra', screenMode: 'game', zombies: [],
    player: {x:0,y:0,r:20,damage:10,level:10,fireCooldown:0,fireRateBonus:0,astraOrbitAngle:0,astraOrbitBlend:0,astraStardust:0,astraUltimateCasts:0},
    mouse: {worldX:500,worldY:0}, transcended: {}, killed: [],
    killZombie(index,z) {context.onAstraEnemyKilled(z);context.killed.push(z);context.zombies.splice(index,1);},
  };
  vm.createContext(context);
  // Use the production shared scaling path, including its existing damage augments.
  const core = fs.readFileSync(path.join(root,'js/01-core.js'),'utf8');
  vm.runInContext(core.slice(core.indexOf('function getAstraStardustMultiplier()'),core.indexOf('function screenToWorld()')),context);
  vm.runInContext(fs.readFileSync(path.join(root,'js/04-astra.js'),'utf8'),context);
  return {context,run:code=>vm.runInContext(code,context)};
}

function enemy(x,y,extra={}) {return {x,y,r:10,hp:10000,maxHp:10000,speed:1,...extra};}
function near(actual,expected) {assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);}

test('every unique defeated enemy awards one stardust only to Astra, and a new run clears deduplication',()=>{
  const g=game(),dead=enemy(0,0,{hp:0}),living=enemy(0,0),boss=enemy(0,0,{hp:-10,isRaidBoss:true}),minion=enemy(0,0,{hp:0,isBossMinion:true});
  Object.assign(g.context,{dead,living,boss,minion});
  g.run('onAstraEnemyKilled(null);onAstraEnemyKilled(living);onAstraEnemyKilled(dead);onAstraEnemyKilled(dead);onAstraEnemyKilled(boss);onAstraEnemyKilled(minion)');
  assert.equal(g.context.player.astraStardust,3);
  g.context.selectedCharacter='mare';g.run('living.hp=0;onAstraEnemyKilled(living)');assert.equal(g.context.player.astraStardust,3);
  g.context.selectedCharacter='astra';g.run('onAstraEnemyKilled(living);onAstraEnemyKilled(living)');assert.equal(g.context.player.astraStardust,4);
  g.run('resetAstra();onAstraEnemyKilled(dead)');assert.equal(g.context.player.astraStardust,1);
});

test('stardust expands both E radii on an already-active well and exposes new enemies to pull and damage',()=>{
  const g=game(),target=enemy(800,0);g.context.zombies.push(target);
  g.run('activateAstraE();for(let i=0;i<24;i++)updateAstraWells()');
  const well=g.run('astraWells[0]');
  assert.equal(well.r,170);assert.equal(well.pullR,272);assert.equal(target.x,800);assert.equal(target.hp,10000);
  g.context.player.astraStardust=100;
  g.run('updateAstraWells()');
  assert.equal(g.run('astraWells[0]'),well);assert.equal(well.r,340);assert.equal(well.pullR,544);assert.ok(target.x<800);
  g.run('for(let i=0;i<17;i++)updateAstraWells()');near(target.hp,10000-4.4);
  g.context.player.astraHorizonLevel=2;g.context.player.astraStardust=50;g.run('updateAstraWells()');
  near(well.r,206*1.5);near(well.pullR,206*1.5*1.6);
  g.run('resetAstra()');assert.equal(g.context.player.astraStardust,0);assert.equal(g.run('astraWells.length'),0);
  assert.equal(g.run('astraERadius()'),170);assert.equal(g.run('astraEPullRadius()'),272);
});

test('shared damage scaling applies stardust once with global and crown augments, including actual basic projectile impact',()=>{
  const g=game();Object.assign(g.context.player,{globalDamageMultiplier:1.5,crownLevel:1,astraStardust:100});
  near(g.run('getDamageMultiplier()'),3);near(g.run('scaledDamage(10)'),60);
  const target=enemy(40,0);g.context.zombies.push(target);
  g.run('attackWithAstra();astraMeteors[0].curve=0;for(let i=0;i<8;i++)updateAstraMeteors()');
  near(target.hp,10000-20.4*6);assert.equal(g.context.player.damage,10);
  const shot=g.run('astraMeteors[0]');assert.equal(shot.hits.size,1);
  g.context.selectedCharacter='mare';near(g.run('getDamageMultiplier()'),1.5);near(g.run('scaledDamage(10)'),30);
  g.context.selectedCharacter='astra';g.run('resetAstra()');near(g.run('scaledDamage(10)'),30);
});

test('stardust damage scales Q, passive contact, E ticks and R fixed plus boss-health damage once',()=>{
  for(const dust of [0,50,100]){
    const multiplier=1+dust*.01;
    const q=game();q.context.player.astraStardust=dust;q.run('activateAstraQ()');
    for(const star of q.run('astraQFlights()'))near(star.damage,63*multiplier);
    const passive=game();passive.context.player.astraStardust=dust;
    const contact=enemy(120,0);passive.context.zombies.push(contact);passive.run('updateAstra()');near(contact.hp,10000-15.6*multiplier);
    const e=game();e.context.player.astraStardust=dust;const center=enemy(500,0);e.context.zombies.push(center);
    e.run('activateAstraE();for(let i=0;i<24;i++)updateAstraWells()');near(center.hp,10000-2.2*multiplier);
    const r=game();r.context.player.astraStardust=dust;const boss=enemy(500,0,{isRaidBoss:true});r.context.zombies.push(boss);
    r.run('activateAstraR();for(const body of astraGravity.bodies){body.x=500;body.y=0;astraDetonateBody(body,astraGravity)}');
    near(boss.hp,10000-(5*25+10000*.045)*multiplier);
  }
});

test('ultimate XP stack count increments only after successful casts and resets with the run',()=>{
  const g=game();g.context.player.level=9;g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,0);
  g.context.player.level=10;g.context.player.astraRCooldown=1;g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,0);
  g.context.player.astraRCooldown=0;g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,1);
  g.context.player.astraRCooldown=0;g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,1);
  g.run('for(let i=0;i<500;i++)updateAstraGravity()');assert.equal(g.run('astraGravity'),null);
  g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,2);
  g.run('resetAstra()');assert.equal(g.context.player.astraUltimateCasts,0);
  g.run('activateAstraR()');assert.equal(g.context.player.astraUltimateCasts,1);
});

test('passive orbit sweep catches an enemy crossing between frames and enforces the per-enemy contact cooldown',()=>{
  const g=game(),target=enemy(120,70);g.context.zombies.push(target);g.run('updateAstra()');
  assert.equal(target.hp,10000);target.y=-70;
  g.run('updateAstra()');near(target.hp,10000-15.6);assert.equal(target.astraOrbitHit,16);
  // Stay in contact by following the star. Contact cannot tick again before frame 16.
  for(let i=0;i<15;i++)g.run('Object.assign(zombies[0],astraOrbitSlot(0));updateAstra()');
  near(target.hp,10000-15.6);assert.equal(target.astraOrbitHit,1);
  g.run('Object.assign(zombies[0],astraOrbitSlot(0));updateAstra()');near(target.hp,10000-31.2);assert.equal(target.astraOrbitHit,16);
});

test('orbit sweep does not damage an enemy merely teleported through its path',()=>{
  const g=game(),target=enemy(120,240);g.context.zombies.push(target);g.run('updateAstra()');
  target.y=-240;g.run('updateAstra()');assert.equal(target.hp,10000);assert.equal(target.astraOrbitHit,undefined);
});
