const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..','js',name+'.js'),'utf8');
function game(world=1,withNewModule=true) {
  let seed=11,calls=0;
  const noop=()=>{};
  const c={console,Math:Object.create(Math),Date:{now:()=>1000},selectedWorld:world,selectedDifficulty:'easy',wave:8,
    WORLD:{width:2400,height:1800},Image:class{complete=false;naturalWidth=0},setGameImageSource:noop,
    player:{x:1200,y:900,r:20,hp:100,maxHp:100,damage:35,speed:4.2,invincibleTime:0,crownLevel:0,
      dodgeLevel:0,immortalLevel:0,score:0,kills:0,paladinCombo:30,paladinUltimateTime:0},selectedCharacter:'arc',transcended:{},
    zombies:[],bullets:[],droneBullets:[],particles:[],gravityFields:[],stickyZones:[],fireTrails:[],terraStructures:[],
    zombieSlowTimer:0,expOrbs:[],totalZombieKills:0,screenMode:'game',paused:false,choosingUpgrade:false,gameOver:false,
    saveTotalKills:noop,onRenZombieKilled:noop,onVargasZombieKilled:noop,
    getZombieDifficultySpeedMultiplier:()=>1,getZombieDifficultyDamageMultiplier:()=>1,getRaidBossDifficultySpeedMultiplier:()=>1,
    astraEnemyMoveScale:()=>1,astraWellSuppressesEnemy:()=>false,astraControlled:z=>!!z?.astraControl,
    openUpgradeMenu:()=>{c.upgradeOpened=(c.upgradeOpened||0)+1;},isInCameraView:()=>true,
    crypto:{randomUUID:()=>`id-${calls}`},localStorage:{getItem:()=>null,setItem:noop}};
  c.Math.random=()=>{calls++;seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};c.window=c;
  vm.createContext(c);const run=s=>vm.runInContext(s,c);
  for(const file of ['04-weapons-spawn','04-world-monsters','04-bosses','06-entities-update'])run(read(file));
  if(withNewModule)run(read('04-world-bosses'));
  run('resetWorldMonsters();resetRaidBossSystem()');
  return {c,run,calls:()=>calls,start(index){run(`startRaidBoss(${index});raidIntroTime=0`);return run('activeRaidBoss');},
    step(n){run(`for(let n=0;n<${n};n++){updateRaidBossSystem();if(player.invincibleTime>0)player.invincibleTime--;}`);}};
}
test('each new world selects its three requested boss species, with final world eye and preserved easy HP',()=>{
  const order={1:['iron-hauler','glass-thrower','alarm-infected'],3:['rift-hunter','stitcher','abyss-eye']};
  for(const world of [1,3])for(let index=0;index<3;index++){
    const g=game(world),b=g.start(index);assert.equal(b.worldRaidType,order[world][index]);
    assert.equal(b.isWorldRaidBoss,true);assert.equal(b.isRaidBoss,true);assert.equal(b.hp,[37500,150000,600000][index]);
    assert.equal(b.worldRaidWorld,world);assert.equal(g.run(`getRaidBossName(${index},${world})`),g.run(`getWorldRaidBossDefinition(${index},${world}).name`));
  }
});
test('World 2 startup, AI, projectiles, zones, HP and RNG are byte-identical with new module loaded',()=>{
  for(let index=0;index<3;index++){
    const current=game(2),legacy=game(2,false);current.start(index);legacy.start(index);
    current.step(650);legacy.step(650);
    const snapshot='JSON.stringify({boss:activeRaidBoss,projectiles:raidBossProjectiles,zones:raidBossZones,effects:raidBossEffects,player,zombies})';
    assert.equal(current.run(snapshot),legacy.run(snapshot));assert.equal(current.calls(),legacy.calls());
    assert.equal(current.run('worldRaidZones.length'),0);assert.equal(current.run('worldRaidProjectiles.length'),0);
  }
});
test('raid timeline remains 2, 4, 6 minutes and new boss movement is not pinned to the old stationary first boss',()=>{
  const g=game(1);assert.equal(g.run('JSON.stringify(RAID_BOSS_TIMES)'),JSON.stringify([7200,14400,21600]));
  g.run('survivalFrames=7199;updateRaidBossSystem()');const b=g.run('activeRaidBoss');assert.equal(b.worldRaidType,'iron-hauler');
  g.run('raidIntroTime=0');const y=b.y;g.step(20);assert.notEqual(b.y,y);
  g.run('enforceImmobileRaidBoss()');assert.notEqual(b.y,b.anchorY);assert.equal(b.y,b.frameY);
});
test('all six new raids create readable telegraphs before the first damage frame',()=>{
  for(const world of [1,3])for(let index=0;index<3;index++){
    const g=game(world),b=g.start(index);g.c.owner=b;g.run('startWorldRaidPattern(owner,0)');
    const zones=g.run('worldRaidZones');assert.ok(zones.length>0);assert.ok(zones.every(z=>z.delay>=48));
    g.run('for(let n=0;n<40;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);
  }
});
test('iron cone damage starts only after 72 frames and BREAK cancels active raid hazards',()=>{
  const g=game(1),b=g.start(0);g.c.owner=b;g.c.player.x=b.x;g.c.player.y=b.y+200;
  g.run('startWorldRaidPattern(owner,0);for(let n=0;n<71;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);
  g.run('updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,78);
  g.c.player.invincibleTime=0;g.run('startWorldRaidPattern(owner,1);owner.relicInterruptTime=30;updateWorldRaidBoss(owner,false);updateWorldRaidHazards(owner)');
  assert.equal(g.run('worldRaidZones.length'),0);assert.equal(b.pattern,null);assert.equal(g.c.player.hp,78);
});
test('iron charge travels exactly 480px and never damages outside its 110px preview corridor',()=>{
  const g=game(1),boss=g.start(0);g.c.owner=boss;const startX=boss.x,startY=boss.y;
  g.c.player.x=startX+300;g.c.player.y=startY;g.run('startWorldRaidPattern(owner,1)');
  const zone=g.run('worldRaidZones[0]');assert.equal(zone.length,480);assert.equal(zone.width,110);
  // Center 76px off-axis is outside a 55px half-width even including r=20.
  g.c.player.x=startX+240;g.c.player.y=startY+76;
  g.step(96);assert.equal(zone.travel,480);assert.equal(boss.x-startX,480);assert.equal(boss.y,startY);assert.equal(g.c.player.hp,100);
  g.step(20);assert.equal(boss.x-startX,480);assert.equal(g.c.player.hp,100);
  assert.equal(g.run('worldRaidChargeHits({x:0,y:0,angle:0,width:110},0,480,240,76,20)'),false);
  assert.equal(g.run('worldRaidChargeHits({x:0,y:0,angle:0,width:110},0,480,240,74,20)'),true);
});
test('actual Paladin counter can kill a boss from multiple simultaneous zones or projectiles without stale-array crashes',()=>{
  for(const mode of ['zones','projectiles']) {
    const g=game(1),boss=g.start(1);g.c.owner=boss;g.c.selectedCharacter='paladin';
    g.c.player.x=boss.x;g.c.player.y=boss.y+110;g.c.player.paladinGuardTime=40;g.c.player.paladinGuardTriggered=false;
    g.c.player.paladinCombo=0;g.c.player.paladinComboLevel=0;g.c.paladinEffects=[];g.c.scaledDamage=n=>n;
    g.run(read('04-paladin'));boss.hp=1;
    if(mode==='zones')g.run("for(let n=0;n<4;n++)worldRaidZone(owner,'rain',{x:player.x,y:player.y,r:75,delay:1,duration:12,damage:.2})");
    else g.run("for(let n=0;n<4;n++)worldRaidProjectiles.push({owner,type:'glass',x:player.x,y:player.y,vx:0,vy:0,r:8,life:30,maxLife:30,spin:0,damage:.2})");
    assert.doesNotThrow(()=>g.run('updateWorldRaidHazards(owner)'));
    assert.equal(g.run('activeRaidBoss'),null);assert.equal(g.run('worldRaidZones.length'),0);assert.equal(g.run('worldRaidProjectiles.length'),0);
    assert.equal(g.c.player.hp,100);assert.equal(g.c.player.paladinGuardTriggered,true);assert.equal(g.c.upgradeOpened,1);
  }
});
test('charge movement obeys Astra suppression scale and projectiles reuse harmless one-second absorption',()=>{
  const normal=game(1),slow=game(1);normal.c.owner=normal.start(0);slow.c.owner=slow.start(0);slow.c.astraEnemyMoveScale=()=>.35;
  for(const g of [normal,slow])g.run('startWorldRaidPattern(owner,1);for(let n=0;n<80;n++)updateWorldRaidHazards(owner)');
  const n=normal.c.owner,s=slow.c.owner;assert.ok(Math.abs((s.y-s.anchorY)/(n.y-n.anchorY)-.35)<1e-6);
  const shots=game(3),boss=shots.start(2);shots.c.owner=boss;let capturedTypes=[];
  shots.c.astraAbsorbRaidProjectile=p=>{capturedTypes.push(p.type);p.life=0;p.hit=true;return true;};
  shots.run('worldRaidVolley(owner,12,Math.PI*2,4.8,.25,true);updateWorldRaidHazards(owner)');
  assert.equal(capturedTypes.length,12);assert.ok(capturedTypes.every(type=>type==='abyssOrb'));assert.equal(shots.run('worldRaidProjectiles.length'),0);assert.equal(shots.c.player.hp,100);
});
test('world-native summon population is capped, uses correct species and contact grace expires',()=>{
  for(const [world,index,cap]of[[1,2,6],[3,1,4]]){
    const g=game(world),b=g.start(index);g.c.owner=b;
    g.run('for(let n=0;n<10;n++)worldRaidSummon(owner,4)');
    const minions=g.c.zombies.filter(z=>z.worldRaidMinion);assert.equal(minions.length,cap);
    assert.ok(minions.every(z=>z.isBossMinion&&z.owner===b&&z.worldRaidWorld===world));
    assert.ok(minions.every(z=>z.worldRaidMinionType!=='winged-reaper'));
    g.run('for(let n=0;n<46;n++)updateZombies()');assert.ok(minions.every(z=>z.worldMonsterGrace===0));
    const contact=minions[0];contact.x=g.c.player.x;contact.y=g.c.player.y;
    contact.controlImmuneX=contact.x;contact.controlImmuneY=contact.y;g.c.player.invincibleTime=0;
    const hp=g.c.player.hp;g.run('updateZombies()');assert.ok(g.c.player.hp<hp);
  }
});
test('stitcher links only its living summons, heals within a finite budget, and loses its pattern when all links die',()=>{
  const g=game(3),boss=g.start(1);g.c.owner=boss;g.run('worldRaidSummon(owner,4)');
  const minion=g.c.zombies.find(z=>z.worldRaidMinion);minion.hp=100;boss.hp-=5000;const hp=boss.hp;
  g.run('owner.worldRaidAge=59;updateWorldRaidBoss(owner,true)');assert.ok(minion.hp>100);assert.ok(boss.hp>hp);
  assert.ok(boss.worldRaidHealBudget<boss.maxHp*.02);
  g.run('startWorldRaidPattern(owner,1);for(const z of zombies)if(z.worldRaidMinion)z.hp=0;owner.worldRaidAge=74;updateWorldRaidBoss(owner,true)');
  assert.equal(boss.worldRaidLinks.length,0);assert.equal(boss.pattern,null);assert.equal(boss.worldRaidFrayed,150);assert.equal(g.run('worldRaidZones.length'),0);
});
test('rift arrival grants contact grace and final eye has an aimed sweep plus a 360-degree orb pattern',()=>{
  const rift=game(3),b=rift.start(0);rift.c.owner=b;rift.run('startWorldRaidPattern(owner,0);for(let n=0;n<48;n++)updateWorldRaidHazards(owner)');
  assert.equal(b.worldRaidGrace,20);assert.equal(rift.run('worldRaidZones.filter(z=>z.type==="rift").length'),3);
  const eye=game(3),e=eye.start(2);eye.c.owner=e;eye.run('startWorldRaidPattern(owner,0)');
  assert.equal(eye.run('worldRaidZones[0].type'),'beam');assert.equal(eye.run('worldRaidZones[0].delay'),90);
  eye.run('cancelWorldRaidPattern(owner);startWorldRaidPattern(owner,1);for(let n=0;n<72;n++)updateWorldRaidHazards(owner)');
  assert.equal(eye.run('worldRaidProjectiles.length'),12);
  const angles=eye.run('worldRaidProjectiles.map(p=>Math.atan2(p.vy,p.vx))');assert.ok(Math.max(...angles)-Math.min(...angles)>5.5);
});
test('new hazards honor shields, dodge, source suppression and pause without hurting after owner death',()=>{
  const g=game(1),boss=g.start(0);g.c.owner=boss;
  g.c.absorbSuncallShield=damage=>Math.max(0,damage-5);g.c.absorbAriaShield=damage=>Math.max(0,damage-5);
  g.run('worldRaidDamage(owner,.22)');assert.equal(g.c.player.hp,88);
  g.c.player.invincibleTime=0;g.c.tryDodgeAttack=()=>true;g.run('worldRaidDamage(owner,.22)');assert.equal(g.c.player.hp,88);
  g.c.tryDodgeAttack=()=>false;g.c.astraWellSuppressesEnemy=()=>true;g.run('worldRaidDamage(owner,.22)');assert.equal(g.c.player.hp,88);
  g.run('startWorldRaidPattern(owner,0)');g.c.paused=true;g.run('updateWorldRaidHazards(owner)');assert.equal(g.run('worldRaidZones[0].delay'),72);
  g.c.paused=false;boss.hp=0;g.run('updateWorldRaidHazards(owner)');assert.equal(g.run('worldRaidZones.length'),0);
});
test('boss clear preserves rewards and deletes minions, links and hazards; resets cannot leak worlds',()=>{
  for(const world of [1,3]){
    const g=game(world),boss=g.start(2);g.c.owner=boss;g.run('worldRaidSummon(owner,4);worldRaidVolley(owner,12,6);startWorldRaidPattern(owner,0);defeatRaidBoss(owner)');
    assert.equal(g.run('raidVictory'),true);assert.equal(g.c.player.score,3600);assert.equal(g.c.zombies.length,0);
    assert.equal(g.run('worldRaidZones.length+worldRaidProjectiles.length+worldRaidEffects.length'),0);
    g.run('resetRaidBossSystem()');assert.equal(g.run('survivalFrames'),0);assert.equal(g.run('raidVictory'),false);
  }
});
test('raid shields and percentage damage adapters continue to treat new bosses as real raid encounters',()=>{
  const g=game(3);g.run(read('18-relic-combat'));g.run('relicBeginRun()');const boss=g.start(2);g.c.owner=boss;g.c.Math.random=()=>.99;
  assert.equal(boss.relicShield,600000*.3);assert.equal(g.run('enemyMaxHpDamage(owner,.01)'),90);
  const hp=boss.hp;g.run("relicTagTarget(owner,null,{kind:'basic'});owner.hp-=1000");
  assert.equal(boss.hp,hp);assert.equal(boss.relicShield,179000);
});
