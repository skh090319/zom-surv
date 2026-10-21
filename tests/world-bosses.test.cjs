const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..','js',name+'.js'),'utf8');
const documentFixture=require('./fixtures/boss-balance-document-20261021.json');
const number=value=>Number(value.replace(/[,％%]|마리/g,'').trim());
const tiers=['easy','medium','hard'];
function game(world=1,withNewModule=true,tier='easy') {
  let seed=11,calls=0;
  const noop=()=>{};
  const c={console,Math:Object.create(Math),Date:{now:()=>1000},selectedWorld:world,selectedDifficulty:world===2?tier:'easy',selectedStageDifficulty:tier,wave:8,
    WORLD:{width:2400,height:1800},Image:class{complete=false;naturalWidth=0},setGameImageSource:noop,
    player:{x:1200,y:900,r:20,hp:100,maxHp:100,damage:35,speed:4.2,invincibleTime:0,crownLevel:0,
      dodgeLevel:0,immortalLevel:0,score:0,kills:0,paladinCombo:30,paladinUltimateTime:0},selectedCharacter:'arc',transcended:{},
    zombies:[],bullets:[],droneBullets:[],particles:[],gravityFields:[],stickyZones:[],fireTrails:[],terraStructures:[],
    zombieSlowTimer:0,expOrbs:[],totalZombieKills:0,screenMode:'game',paused:false,choosingUpgrade:false,gameOver:false,
    saveTotalKills:noop,onRenZombieKilled:noop,onVargasZombieKilled:noop,
    getZombieDifficultySpeedMultiplier:()=>1,getZombieDifficultyDamageMultiplier:()=>1,getRaidBossDifficultySpeedMultiplier:()=>c.selectedDifficulty==='easy'?1:1.2,
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
test('each new world selects its requested boss species with the revised document Easy HP',()=>{
  const order={1:['iron-hauler','glass-thrower','alarm-infected'],3:['rift-hunter','stitcher','abyss-eye']};
  for(const world of [1,3])for(let index=0;index<3;index++){
    const g=game(world),b=g.start(index);assert.equal(b.worldRaidType,order[world][index]);
    assert.equal(b.isWorldRaidBoss,true);assert.equal(b.isRaidBoss,true);assert.equal(b.hp,({1:[27500,100000,150000],3:[67500,250000,30000000]})[world][index]);
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
test('actual Paladin counter can kill a boss from multiple simultaneous zones, waves or projectiles without stale-array crashes',()=>{
  for(const mode of ['zones','shockwaves','projectiles']) {
    const g=game(1),boss=g.start(1);g.c.owner=boss;g.c.selectedCharacter='paladin';
    g.c.player.x=boss.x;g.c.player.y=boss.y+110;g.c.player.paladinGuardTime=40;g.c.player.paladinGuardTriggered=false;
    g.c.player.paladinCombo=0;g.c.player.paladinComboLevel=0;g.c.paladinEffects=[];g.c.scaledDamage=n=>n;
    g.run(read('04-paladin'));boss.hp=1;
    if(mode==='zones')g.run("for(let n=0;n<4;n++)worldRaidZone(owner,'rain',{x:player.x,y:player.y,r:75,delay:1,duration:12,damage:.2})");
    else if(mode==='shockwaves')g.run("for(let n=0;n<4;n++)worldRaidZone(owner,'shockwave',{x:player.x-380,y:player.y,angle:0,minR:380,r:380,maxR:620,width:32,arc:1.8,delay:1,duration:40,damage:.25})");
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
    assert.ok(minions.every(z=>z.worldRaidMinionType===(world===1?'alley-hound':'split-larva')),'summons never reuse exclusive elite art');
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
test('rift speed adds 3% of initial speed per actual teleport, persists through casts and BREAK, and resets each encounter',()=>{
  const g=game(3),boss=g.start(0);g.c.owner=boss;
  assert.equal(boss.worldRaidBaseSpeed,2.3);assert.equal(boss.worldRaidTeleportCount,0);assert.equal(boss.worldRaidSpeedBonus,0);
  g.run('startWorldRaidPattern(owner,0);for(let n=0;n<47;n++)updateWorldRaidHazards(owner)');
  assert.equal(boss.speed,2.3);assert.equal(boss.worldRaidTeleportCount,0);
  g.c.paused=true;g.run('updateWorldRaidHazards(owner)');assert.equal(boss.worldRaidTeleportCount,0);g.c.paused=false;
  g.run('updateWorldRaidHazards(owner)');assert.equal(boss.worldRaidTeleportCount,1);assert.equal(boss.speed,2.3*1.03);
  g.run('for(let n=0;n<49;n++)updateWorldRaidHazards(owner)');assert.equal(boss.worldRaidTeleportCount,1);
  g.run('updateWorldRaidHazards(owner)');assert.equal(boss.worldRaidTeleportCount,2);assert.equal(boss.speed,2.3*1.06);
  g.run('for(let n=0;n<64;n++)updateWorldRaidHazards(owner)');assert.equal(boss.worldRaidTeleportCount,3);assert.equal(boss.speed,2.3*1.09);
  g.run('cancelWorldRaidPattern(owner);startWorldRaidPattern(owner,1);cancelWorldRaidPattern(owner)');
  assert.equal(boss.speed,2.3*1.09);assert.equal(boss.worldRaidSpeedBonus,.09);
  g.run('startWorldRaidPattern(owner,0);owner.relicInterruptTime=30;updateWorldRaidBoss(owner,false);updateWorldRaidHazards(owner)');
  assert.equal(boss.worldRaidTeleportCount,3);assert.equal(boss.speed,2.3*1.09);
  g.run('owner.relicInterruptTime=0;startWorldRaidPattern(owner,0);for(let n=0;n<48;n++)updateWorldRaidHazards(owner)');
  assert.equal(boss.worldRaidTeleportCount,4);assert.equal(boss.speed,2.3*1.12);
  g.run('cancelWorldRaidPattern(owner);owner.x=800;owner.y=800;player.x=1400;player.y=800;owner.cooldown=100;updateWorldRaidBoss(owner,true)');
  assert.ok(Math.abs(boss.x-(800+2.3*1.12*.65))<1e-9);
  const fresh=g.start(0);assert.notEqual(fresh,boss);assert.equal(fresh.speed,2.3);
  assert.equal(fresh.worldRaidTeleportCount,0);assert.equal(fresh.worldRaidSpeedBonus,0);
});
test('rift slash keeps its original hit and announces a locked outward wave before it travels from 380 to 620px',()=>{
  const g=game(3),boss=g.start(0);g.c.owner=boss;g.c.player.x=boss.x+500;g.c.player.y=boss.y;
  g.run('startWorldRaidPattern(owner,1)');const [cone,wave]=g.run('worldRaidZones');
  assert.equal(cone.type,'cone');assert.equal(cone.r,380);assert.equal(cone.delay,65);assert.equal(cone.maxLife-cone.maxDelay,14);
  assert.equal(wave.type,'shockwave');assert.equal(wave.minR,380);assert.equal(wave.maxR,620);assert.equal(wave.width,32);
  assert.equal(wave.arc,cone.arc);assert.equal(wave.angle,cone.angle);assert.equal(wave.delay,79);assert.equal(wave.hitGroup,cone.hitGroup);
  g.run('for(let n=0;n<78;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);assert.equal(wave.r,380);
  g.run('updateWorldRaidHazards(owner)');assert.equal(wave.r,386);assert.equal(g.c.player.hp,100);
  g.run('for(let n=0;n<15;n++)updateWorldRaidHazards(owner)');assert.equal(wave.r,476);assert.equal(g.c.player.hp,100);
  g.run('updateWorldRaidHazards(owner)');assert.equal(wave.r,482);assert.equal(g.c.player.hp,30);
  const x=boss.x,y=boss.y;g.run('for(let n=0;n<23;n++){player.invincibleTime=0;updateWorldRaidHazards(owner)}');
  assert.equal(wave.r,620);assert.equal(g.c.player.hp,30);assert.equal(boss.x,x);assert.equal(boss.y,y);
  g.run('updateWorldRaidHazards(owner)');assert.equal(g.run('worldRaidZones.length'),0);assert.equal(wave.r,620);
});
test('rift slash and following wave share one revised 70% hit even after invincibility ends, and a later cast gets a new hit',()=>{
  const g=game(3),boss=g.start(0);g.c.owner=boss;g.c.player.x=boss.x+300;g.c.player.y=boss.y;
  g.run('startWorldRaidPattern(owner,1);for(let n=0;n<64;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);
  g.run('updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,30);
  g.c.player.x=boss.x+500;g.run('for(let n=0;n<54;n++){player.invincibleTime=0;updateWorldRaidHazards(owner)}');assert.equal(g.c.player.hp,30);
  g.run('startWorldRaidPattern(owner,1);for(let n=0;n<95;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,-40);
});
test('rift wave collision matches the annular-sector preview, including swept edges and the empty area behind it',()=>{
  const g=game(3),boss=g.start(0);g.c.owner=boss;
  g.c.waveShape={x:0,y:0,angle:0,arc:1.8,minR:380,maxR:620,width:32};
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,614,620,640,0,20)'),true);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,614,620,641,0,20)'),false);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,380,386,359,0,20)'),false);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,500,600,550,0,2)'),true);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,500,506,400,0,20)'),false);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,500,506,-500,0,20)'),false);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,500,506,500*Math.cos(.93),500*Math.sin(.93),20)'),true);
  assert.equal(g.run('worldRaidShockwaveHits(waveShape,500,506,500*Math.cos(.95),500*Math.sin(.95),20)'),false);
  for(const [distance,angle]of[[641,0],[500,1.1],[200,Math.PI]]){
    g.c.player.x=boss.x+500;g.c.player.y=boss.y;g.run('startWorldRaidPattern(owner,1)');
    g.c.player.x=boss.x+Math.cos(angle)*distance;g.c.player.y=boss.y+Math.sin(angle)*distance;
    g.run('for(let n=0;n<119;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);
  }
  g.c.player.x=boss.x+700;g.c.player.y=boss.y;g.run('startWorldRaidPattern(owner,1);for(let n=0;n<105;n++)updateWorldRaidHazards(owner)');
  g.c.player.x=boss.x+300;g.run('for(let n=0;n<14;n++)updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,100);
});
test('an active rift wave pauses in place, is canceled by BREAK, and cannot outlive its owner',()=>{
  const g=game(3),boss=g.start(0);g.c.owner=boss;g.c.player.x=boss.x+550;g.c.player.y=boss.y;
  g.run('startWorldRaidPattern(owner,1);for(let n=0;n<90;n++)updateWorldRaidHazards(owner)');
  const wave=g.run('worldRaidZones[0]'),radius=wave.r,life=wave.life;
  g.c.paused=true;g.run('for(let n=0;n<20;n++)updateWorldRaidHazards(owner)');assert.equal(wave.r,radius);assert.equal(wave.life,life);
  g.c.paused=false;g.run('owner.relicInterruptTime=30;updateWorldRaidBoss(owner,false);updateWorldRaidHazards(owner)');
  assert.equal(g.run('worldRaidZones.length'),0);assert.equal(g.c.player.hp,100);
  g.run('owner.relicInterruptTime=0;startWorldRaidPattern(owner,1);for(let n=0;n<90;n++)updateWorldRaidHazards(owner);owner.hp=0;updateWorldRaidHazards(owner)');
  assert.equal(g.run('worldRaidZones.length'),0);assert.equal(g.c.player.hp,100);
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
  assert.equal(boss.relicShield,30000000*.3);assert.equal(g.run('enemyMaxHpDamage(owner,.01)'),90);
  const hp=boss.hp;g.run("relicTagTarget(owner,null,{kind:'basic'});owner.hp-=1000");
  assert.equal(boss.hp,hp);assert.equal(boss.relicShield,8999000);
});

test('every new-world boss HP and speed matches every edited document cell, independent of ordinary-wave profiles',()=>{
  const hpRows=documentFixture.tables[0].slice(1).filter(row=>row[0]);
  for(const row of hpRows)for(const [ti,tier]of tiers.entries()){
    const world=number(row[0]),index=hpRows.filter(r=>r[0]===row[0]).indexOf(row),g=game(world,true,tier),boss=g.start(index);
    const speedRow=documentFixture.tables[1].find(r=>r[1]===row[1]);
    assert.equal(boss.maxHp,number(row[ti+2]),`${row[1]} ${tier} HP`);assert.equal(boss.hp,boss.maxHp);
    assert.equal(boss.speed,number(speedRow[ti+2]),`${row[1]} ${tier} speed`);assert.equal(boss.worldRaidBaseSpeed,boss.speed);
    assert.equal(boss.worldRaidDifficulty,tier);assert.equal(g.c.selectedDifficulty,'easy');
  }
});

test('every new-world contact, zone, minion and projectile damage ratio matches the document',()=>{
  const keys={1:['contact','cone','charge','contact','glass','rain','contact','ring','minion'],3:['contact','rift','cone','shockwave','contact','beam','minion','contact','beam','orb']};
  for(const world of [1,3])for(const [ti,tier]of tiers.entries()){
    const names=documentFixture.tables[0].slice(1).filter(r=>r[0]===String(world)).map(r=>r[1]);
    for(const [ri,row]of documentFixture.tables[world===1?2:4].slice(1).entries()){
      const g=game(world,true,tier),boss=g.start(names.indexOf(row[0]));g.c.owner=boss;const key=keys[world][ri],expected=number(row[ti+2])/100;
      assert.equal(g.run(`getWorldRaidBossBalance(owner).damage['${key}']`),expected,`${row[0]} ${row[1]} ${tier}`);
      if(key==='contact'){
        boss.cooldown=999;g.c.player.x=boss.x;g.c.player.y=boss.y;g.run('updateRaidBossSystem()');
        assert.ok(Math.abs(g.c.player.hp-(100-100*expected))<1e-8);
      }else if(key==='minion'){
        g.c.player.maxHp=1000;g.run('worldRaidSummon(owner)');const minion=g.c.zombies.find(z=>z.worldRaidMinion);g.c.minion=minion;
        assert.equal(g.run('getRaidBossMinionDamage(minion)'),Math.max(1000*expected,g.run('getWorldRaidBossBalance(owner).summon.minimum')));
      }else if(['glass','orb'].includes(key)){
        g.c.player.invincibleTime=9999;g.c.player.x=-1000;g.c.player.y=-1000;
        g.run(`startWorldRaidPattern(owner,${key==='glass'?0:1});for(let n=0;n<${key==='glass'?65:72};n++)updateWorldRaidHazards(owner)`);
        const shots=g.run('worldRaidProjectiles');assert.equal(shots.length,key==='glass'?5:12);assert.ok(shots.every(p=>p.damage===expected));
      }else{
        const pattern=({cone:0,charge:1,rain:1,ring:0,rift:0,shockwave:1,beam:1})[key];
        const actualPattern=world===3&&boss.raidIndex===0&&key==='cone'?1:world===3&&boss.raidIndex===2&&key==='beam'?0:pattern;
        g.run(`startWorldRaidPattern(owner,${actualPattern})`);
        const zone=g.run('worldRaidZones').find(z=>z.type===key);assert.ok(zone,`${key} zone`);assert.equal(zone.damage,expected);
      }
    }
  }
});

test('edited summons use the document HP, per-cast count, cap and contact minimum on all tiers',()=>{
  for(const world of [1,3])for(const [ti,tier]of tiers.entries()){
    const rows=documentFixture.tables[world===1?3:5],index=world===1?2:1,g=game(world,true,tier),boss=g.start(index);g.c.owner=boss;
    g.run(`startWorldRaidPattern(owner,${world===1?1:0});for(let n=0;n<65;n++)updateWorldRaidHazards(owner)`);
    const expectedHp=number(rows[1][ti+1]),count=number(rows[2][ti+1]),cap=number(rows[world===1?3:2][ti+1]),minimum=number(rows[world===1?4:3][ti+1]);
    let minions=g.c.zombies.filter(z=>z.worldRaidMinion);assert.equal(minions.length,count);assert.ok(minions.every(z=>z.hp===expectedHp&&z.maxHp===expectedHp&&z.speed===1.8));
    g.run('worldRaidSummon(owner,100)');minions=g.c.zombies.filter(z=>z.worldRaidMinion);assert.equal(minions.length,cap);
    if(world===3)assert.equal(boss.worldRaidLinks.length,cap);
    const minion=minions[0];g.c.minion=minion;g.c.player.hp=g.c.player.maxHp=100;
    const ratio=g.run('getWorldRaidBossBalance(owner).damage.minion');assert.equal(g.run('getRaidBossMinionDamage(minion)'),Math.max(minimum,100*ratio));
    minion.x=minion.controlImmuneX=g.c.player.x;minion.y=minion.controlImmuneY=g.c.player.y;minion.worldMonsterGrace=0;
    g.run('updateZombies()');assert.equal(g.c.player.hp,100-Math.max(minimum,100*ratio));
  }
});

test('boss tier is frozen at encounter spawn and does not change when the stage selection changes',()=>{
  const g=game(3,true,'hard'),boss=g.start(0);g.c.owner=boss;
  g.c.selectedStageDifficulty='easy';g.c.selectedWorld=1;g.run('startWorldRaidPattern(owner,0)');
  assert.equal(boss.maxHp,187500);assert.equal(boss.speed,4.3);assert.equal(g.run('worldRaidZones[0].damage'),.92);
  g.run('for(let n=0;n<48;n++)updateWorldRaidHazards(owner)');assert.equal(boss.speed,4.3*1.03);
});

test('the edited 99 percent beams remain repeat hits rather than instant death and still respect shields',()=>{
  for(const index of [1,2]){
    const g=game(3),boss=g.start(index);g.c.owner=boss;g.c.player.x=boss.x+100;g.c.player.y=boss.y;
    g.run(`startWorldRaidPattern(owner,${index===1?1:0});Object.assign(worldRaidZones[0],{delay:1,baseAngle:0,arc:0});updateWorldRaidHazards(owner)`);
    assert.equal(g.c.player.hp,1);assert.equal(g.c.gameOver,false);
    g.run('updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,1,'invincibility still protects');
    g.c.player.invincibleTime=0;g.run('updateWorldRaidHazards(owner)');assert.equal(g.c.player.hp,-98);assert.equal(g.c.gameOver,true);
    const shielded=game(3);shielded.c.owner=shielded.start(index);shielded.c.absorbSuncallShield=damage=>Math.max(0,damage-50);
    shielded.run('worldRaidDamage(owner,getWorldRaidBossBalance(owner).damage.beam)');assert.equal(shielded.c.player.hp,51);
  }
});

test('unchanged World 2 document HP, speed and minimum summon damage remain exact on every tier',()=>{
  for(const [ti,tier]of tiers.entries())for(let index=0;index<3;index++){
    const g=game(2,true,tier),boss=g.start(index),speedRow=documentFixture.tables[7][index*2+1];
    assert.equal(boss.maxHp,number(documentFixture.tables[6][index+1][ti+1]));assert.ok(Math.abs(boss.speed-number(speedRow[ti+2]))<1e-9);
    g.c.player.maxHp=1;assert.equal(g.run('getRaidBossMinionDamage()'),number(documentFixture.tables[8][4][ti+1]));
  }
});

test('all World 2 damage cells and Mors summon HP, count and movement match the supplied document',()=>{
  const attacks=['contact','poison','venom','venomSmall','vine','contact','charge','scythe','scytheReturn','minion','contact','abyssOrb','lightning','dash'];
  for(const [ti,tier]of tiers.entries()){
    for(const [ri,row]of documentFixture.tables[9].slice(1).entries()){
      const index=ri<5?0:ri<10?1:2,g=game(2,true,tier),boss=g.start(index);g.c.owner=boss;
      if(attacks[ri]==='dash'){
        assert.equal(row[ti+2],'즉사');g.run('raidPlayerDamage(0,true,owner)');assert.equal(g.c.player.hp,0);assert.equal(g.c.gameOver,true);
      }else assert.ok(Math.abs(g.run(`getRaidBossDamageRatio('${attacks[ri]}')`)-number(row[ti+2])/100)<1e-12,row.join(' / '));
    }
    const g=game(2,true,tier);g.c.owner=g.start(1);g.run('summonReaperMinions(owner)');const minions=g.c.zombies.filter(z=>z.isBossMinion),table=documentFixture.tables[8];
    assert.equal(minions.length,number(table[2][ti+1]));assert.ok(minions.every(z=>z.hp===number(table[1][ti+1])&&Math.abs(z.speed-number(table[3][ti+1]))<1e-12));
  }
});

test('the edited document has no descending Easy to Medium to Hard numerical rows',()=>{
  for(const [index,table]of documentFixture.tables.entries())for(const row of table.slice(1)){
    if(row.every(cell=>!cell.trim()))continue;
    const start=[0,1,2,4,7,9].includes(index)?2:1;
    const cells=row.slice(start,start+3);if(cells.some(c=>c==='즉사'))continue;
    const values=cells.map(number);assert.ok(values[0]<=values[1]&&values[1]<=values[2],row.join(' / '));
  }
});
