const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');
function fixture(world=1) {
  let calls=0;
  const c={Math:Object.create(Math),console,selectedWorld:world,wave:5,WORLD:{width:1800,height:1400},
    zombies:[],player:{x:900,y:700,r:20,maxHp:100,hp:100,invincibleTime:0,crownLevel:0,score:0,kills:0,
      lifeStealLevel:0,stickyLevel:0,explosionLevel:0,dodgeLevel:0,paladinCombo:30,paladinUltimateTime:0},
    selectedCharacter:'arc',transcended:{},zombieSlowTimer:0,stickyZones:[],fireTrails:[],terraStructures:[],gravityFields:[],
    particles:[],expOrbs:[],totalZombieKills:0,gameOver:false,raidVictory:false,choosingUpgrade:false,paused:false,
    getZombieDifficultySpeedMultiplier:()=>1,getZombieDifficultyDamageMultiplier:()=>1,
    isInCameraView:()=>true,astraControlled:e=>!!e?.captured,astraWellSuppressesEnemy:e=>!!e?.inWell,
    saveTotalKills:()=>{},onRenZombieKilled:()=>{},onVargasZombieKilled:()=>{},
    crypto:{randomUUID:()=>`id-${calls}`}};
  c.window=c;c.Math.random=()=>{calls++;return .4;};vm.createContext(c);
  const run=s=>vm.runInContext(s,c);
  run(read('04-weapons-spawn'));run(read('04-world-monsters'));run(read('06-entities-update'));
  run('resetWorldMonsters()');
  return {c,run,randomCalls:()=>calls,spawn(id,x=600,y=700,options={}){
    c.spawnOptions=options;run(`zombies.push(createWorldMonster(${JSON.stringify(id)},${x},${y},spawnOptions));worldMonsterBeginFrame()`);
    return c.zombies[c.zombies.length-1];
  },step(n=1){run(`for(let tick=0;tick<${n};tick++){updateZombies();updateWorldMonsterCombat();if(player.invincibleTime>0)player.invincibleTime--;}`);}};
}
test('catalog has exactly five unique species per new world with bounded image paths',()=>{
  const g=fixture();const defs=g.run('Object.values(WORLD_MONSTER_TYPES)');
  assert.equal(defs.length,10);for(const world of [1,3])assert.equal(defs.filter(d=>d.world===world).length,5);
  for(const d of defs){assert.ok(d.desc&&d.tips&&d.name);assert.equal(d.image,`assets/world-monsters-v1/${d.id}.webp`);}
});
test('World 2 spawn output and RNG sequence are byte-identical to legacy spawning',()=>{
  const g=fixture(2),old=fixture(2);
  const source=read('04-weapons-spawn').slice(read('04-weapons-spawn').indexOf('function spawnZombie()'),read('04-weapons-spawn').indexOf('function spawnItem()'))
    .replace("  if(typeof attachWorldMonster==='function')attachWorldMonster(zombie);",'');
  old.run(source);g.run('for(let n=0;n<30;n++)spawnZombie()');old.run('for(let n=0;n<30;n++)spawnZombie()');
  assert.equal(JSON.stringify(g.c.zombies),JSON.stringify(old.c.zombies));assert.equal(g.randomCalls(),old.randomCalls());
  assert.ok(g.c.zombies.every(z=>!z.worldMonsterType));
  const positions=JSON.stringify(g.c.zombies);g.run('worldMonsterBeginFrame();updateWorldMonsterCombat()');assert.equal(JSON.stringify(g.c.zombies),positions);
});
test('World 2 movement, contact damage, elite and boss behavior remain on the original branch',()=>{
  const g=fixture(2),z={id:'old',x:880,y:700,hp:100,maxHp:100,r:21,speed:1,boss:false};
  g.c.zombies.push(z);g.step();assert.equal(g.c.player.hp,90);assert.equal(z.x,878);
  for(const extra of [{isRaidBoss:true},{isBossMinion:true}]){
    g.c.raw={id:'boss',x:0,y:0,hp:100,maxHp:100,r:36,speed:1,...extra};
    g.run('selectedWorld=1;resetWorldMonsters();attachWorldMonster(raw)');assert.equal(g.c.raw.worldMonsterType,undefined);assert.equal(g.c.raw.hp,100);
  }
});
test('large-wave zombies use new-world species without changing elite HP, radius or rewards',()=>{
  for(const world of [1,3]){
    const g=fixture(world);g.c.raw={id:'elite',x:0,y:0,hp:415,maxHp:415,r:36,speed:1.1,boss:true};
    g.run('attachWorldMonster(raw)');
    assert.equal(g.c.raw.worldMonsterType,world===1?'iron-hauler':'hollow-husk');
    assert.equal(g.c.raw.hp,415);assert.equal(g.c.raw.r,36);assert.equal(g.c.raw.speed,1.1);assert.equal(g.c.raw.boss,true);
  }
});
test('world-specific spawn selection respects wave unlocks and caps ranged/support enemies',()=>{
  for(const world of [1,3]){
    const g=fixture(world);g.c.wave=1;g.run('for(let n=0;n<10;n++)spawnZombie()');
    assert.ok(g.c.zombies.every(z=>z.worldMonsterWorld===world));
    assert.ok(g.c.zombies.every(z=>z.worldMonsterType===(world===1?'street-walker':'hollow-husk')));
    g.c.wave=15;g.c.Math.random=()=>.99;g.run('for(let n=0;n<50;n++)spawnZombie()');
    for(const id of ['alarm-infected','stitcher','abyss-eye','glass-thrower'])assert.ok(g.c.zombies.filter(z=>z.worldMonsterType===id).length<=3);
  }
});
test('explicit factory is deterministic, preserves selection and never inserts automatically',()=>{
  const g=fixture(2);const before=g.randomCalls();const enemy=g.run("createWorldMonster('alley-hound',100,200,{wave:1})");
  assert.equal(g.c.zombies.length,0);assert.equal(g.c.selectedWorld,2);assert.equal(g.randomCalls(),before);
  assert.equal(enemy.worldMonsterWorld,1);assert.equal(enemy.maxHp,87*.72);assert.equal(enemy.speed,1.5*1.3);
});
test('glass throw has a complete 48 frame windup, three shots, then recovery',()=>{
  const g=fixture(),z=g.spawn('glass-thrower');z.worldMonsterCooldown=0;g.step();
  assert.equal(z.worldMonsterState,'windup');assert.equal(z.worldMonsterTimer,48);g.step(47);
  assert.equal(g.run('worldMonsterProjectiles.length'),0);g.step();
  assert.equal(g.run('worldMonsterProjectiles.length'),3);assert.equal(z.worldMonsterState,'recover');
  const angles=g.run('worldMonsterProjectiles.map(p=>Math.atan2(p.vy,p.vx))');
  assert.ok(Math.abs(angles[2]-angles[0]-.46)<1e-6);
});
test('stun, Astra capture and black-hole suppression cancel casts and remove outgoing hazards',()=>{
  for(const status of ['stunTime','captured','inWell']){
    const g=fixture(),z=g.spawn('glass-thrower');z.worldMonsterCooldown=0;g.step(49);
    assert.equal(g.run('worldMonsterProjectiles.length'),3);z[status]=status==='stunTime'?20:true;g.step();
    assert.equal(g.run('worldMonsterProjectiles.length'),0);assert.equal(z.worldMonsterState,'move');
    assert.ok(z.worldMonsterCooldown>0);
  }
});
test('glass hazards use swept collision and stop on death, invincibility or pause',()=>{
  const g=fixture(),z=g.spawn('glass-thrower');
  g.c.owner=z;g.run("worldMonsterProjectiles.push({type:'glass',owner,x:860,y:700,vx:80,vy:0,r:6,life:10,maxLife:10})");g.run('updateWorldMonsterCombat()');
  assert.equal(g.c.player.hp,91.5);assert.equal(g.run('worldMonsterProjectiles.length'),0);
  g.run("worldMonsterProjectiles.push({type:'glass',owner,x:860,y:700,vx:80,vy:0,r:6,life:10,maxLife:10})");
  g.c.paused=true;g.run('updateWorldMonsterCombat()');assert.equal(g.run('worldMonsterProjectiles[0].life'),10);
  g.c.paused=false;g.run('updateWorldMonsterCombat()');assert.equal(g.c.player.hp,91.5);
  g.run("worldMonsterProjectiles.push({type:'glass',owner,x:860,y:700,vx:80,vy:0,r:6,life:10,maxLife:10});owner.hp=0;updateWorldMonsterCombat()");
  assert.equal(g.c.player.hp,91.5);assert.equal(g.run('worldMonsterProjectiles.length'),0);
});
test('shield, dodge, gravity safety, counters, revival and character survival protections apply to new hazards',()=>{
  const g=fixture(),z=g.spawn('glass-thrower');g.c.owner=z;
  g.c.absorbSuncallShield=amount=>amount-3;g.c.absorbAriaShield=amount=>amount-2;
  g.run('worldMonsterPlayerDamage(owner,10)');assert.equal(g.c.player.hp,95);
  g.c.player.invincibleTime=0;g.c.tryDodgeAttack=()=>true;g.run('worldMonsterPlayerDamage(owner,100)');assert.equal(g.c.player.hp,95);
  g.c.tryDodgeAttack=()=>false;g.c.gravityFields.push({x:z.x,y:z.y,r:100});g.run('worldMonsterPlayerDamage(owner,100)');assert.equal(g.c.player.hp,95);
  g.c.gravityFields=[];g.c.selectedCharacter='carmilla';g.c.player.carmillaBloodMoonTime=1;g.c.transcended.carmillaFeast=true;
  g.run('worldMonsterPlayerDamage(owner,1000)');assert.equal(g.c.player.hp,1);
  g.c.player.invincibleTime=0;g.c.selectedCharacter='nightLord';g.c.player.nightLordUltimateTime=1;
  g.run('worldMonsterPlayerDamage(owner,1000)');assert.equal(g.c.player.hp,1);
  g.c.player.invincibleTime=0;g.c.selectedCharacter='arc';g.c.tryRevive=()=>{g.c.player.hp=40;return true;};
  g.run('worldMonsterPlayerDamage(owner,1000)');assert.equal(g.c.player.hp,40);assert.equal(g.c.gameOver,false);
});
test('iron hauler shields its front but has a vulnerable rear; projectile side beats current player position',()=>{
  const g=fixture(),z=g.spawn('iron-hauler');g.c.enemy=z;z.worldMonsterFacing=0;
  assert.equal(g.run('worldMonsterDamageMultiplier(enemy)'),.5);
  assert.equal(g.run('worldMonsterDamageMultiplier(enemy,{hitOriginX:500,hitOriginY:700})'),1.2);
  assert.equal(g.run('worldMonsterDamageMultiplier(enemy,{area:true})'),1);
  assert.equal(g.run('worldMonsterDamageMultiplier(enemy,{dot:true})'),1);
});
test('actual relic damage path applies directional armor once using the incoming projectile side',()=>{
  const g=fixture(),z=g.spawn('iron-hauler');g.c.enemy=z;z.worldMonsterFacing=0;
  g.c.screenMode='game';g.c.player.damage=35;g.c.player.speed=4.2;g.c.localStorage={getItem:()=>null,setItem:()=>{}};
  g.run(read('18-relic-combat'));g.run('relicBeginRun()');g.c.Math.random=()=>.99;
  const before=z.hp;
  g.run("relicTagTarget(enemy,{x:enemy.x+5,y:enemy.y,vx:-7,vy:0},{kind:'basic'});enemy.hp-=40");
  assert.equal(before-z.hp,20);
  g.run("relicTagTarget(enemy,{x:enemy.x-5,y:enemy.y,vx:7,vy:0},{kind:'basic'});enemy.hp-=40");
  assert.equal(before-z.hp,68);
  g.c.Math.random=()=>0;
  g.run("relicTagTarget(enemy,null,{kind:'skill',area:true});enemy.hp-=40");
  assert.ok(Math.abs(before-z.hp-120)<1e-9);
});
test('item bombs bypass hauler facing armor through the real HP setter, including guaranteed early-wave kills',()=>{
  for (const level of [5,11]) {
    const g=fixture(),z=g.spawn('iron-hauler');z.hp=z.maxHp=100;z.worldMonsterFacing=0;g.c.wave=level;
    g.c.screenMode='game';g.c.player.damage=35;g.c.player.speed=4.2;g.c.enemyMaxHpDamage=(enemy,ratio)=>enemy.maxHp*ratio;
    g.run(read('18-relic-combat'));g.run('relicBeginRun()');g.c.Math.random=()=>.99;
    g.run('bombAllNearbyZombies()');
    assert.equal(z.hp,level<=10?0:70);
    assert.equal(g.c.zombies.includes(z),level>10);
    assert.equal(z.relicLastHit.kind,'augment');
  }
});
test('World 2 item bombs do not receive a new hit tag or change the damage RNG sequence',()=>{
  const g=fixture(2),z={id:'legacy',x:600,y:700,r:21,hp:100,maxHp:100,speed:1,boss:false};g.c.zombies.push(z);
  g.c.screenMode='game';g.c.player.damage=35;g.c.player.speed=4.2;
  g.run(read('18-relic-combat'));g.run('relicBeginRun()');
  let tags=0,rolls=0;g.c.relicTagTarget=()=>{tags++;};g.c.Math.random=()=>{rolls++;return .99;};
  g.run('bombAllNearbyZombies()');
  assert.equal(tags,0);assert.equal(z.hp,0);assert.equal(g.c.zombies.length,0);
  // One damage crit roll, six XP scatter rolls and 220 explosion-particle rolls.
  assert.equal(rolls,227);
});
test('alarm kill before completion prevents buffs; completed alarm buffs only nearby ordinary enemies',()=>{
  const g=fixture(),alarm=g.spawn('alarm-infected'),ally=g.spawn('street-walker',630,750);
  const boss={id:'boss',x:630,y:750,r:36,hp:100,maxHp:100,speed:0,isRaidBoss:true};g.c.zombies.push(boss);
  alarm.worldMonsterCooldown=0;g.step(75);assert.equal(ally.worldMonsterHasteTime,undefined);
  g.step();assert.ok(ally.worldMonsterHasteTime>=209);assert.equal(boss.worldMonsterHasteTime,undefined);
  const cancelled=fixture(),source=cancelled.spawn('alarm-infected'),target=cancelled.spawn('street-walker',630,750);
  source.worldMonsterCooldown=0;cancelled.step(30);cancelled.c.source=source;cancelled.run('killZombie(zombies.indexOf(source),source)');cancelled.step(80);
  assert.equal(target.worldMonsterHasteTime,undefined);
});
test('rift arrival is telegraphed, has post-arrival contact grace and cannot blink while stunned',()=>{
  const g=fixture(3),z=g.spawn('rift-hunter',550,700);z.worldMonsterCooldown=0;g.step();
  assert.equal(z.worldMonsterTimer,54);const targetX=z.worldMonsterTargetX;g.step(53);assert.notEqual(z.x,targetX);g.step();
  assert.equal(z.x,targetX);assert.equal(z.worldMonsterGrace,36);assert.equal(z.worldMonsterState,'recover');
  g.c.player.x=z.x;g.c.player.y=z.y;g.c.player.invincibleTime=0;g.step();assert.equal(g.c.player.hp,100);
});
test('larvae produce exactly two smaller once-only children and honor encounter cap',()=>{
  const g=fixture(3),parent=g.spawn('split-larva');g.c.parent=parent;g.run('killZombie(zombies.indexOf(parent),parent)');
  assert.equal(g.c.zombies.length,2);assert.ok(g.c.zombies.every(z=>z.worldMonsterChild&&z.r===14));
  const maxHp=parent.maxHp;assert.equal(g.c.zombies[0].maxHp,maxHp*.27);
  g.run('killZombie(1,zombies[1]);killZombie(0,zombies[0])');assert.equal(g.c.zombies.length,0);
  const capped=fixture(3),p=capped.spawn('split-larva');capped.c.p=p;
  for(let n=0;n<239;n++)capped.c.zombies.push({id:n,hp:1,maxHp:1});
  capped.run('killZombie(0,p)');assert.equal(capped.c.zombies.length,239);
});
test('stitcher heals at most three ordinary links, cannot heal bosses, and its death weakens links',()=>{
  const g=fixture(3),support=g.spawn('stitcher');support.speed=0;
  for(let n=0;n<5;n++){const z=g.spawn('hollow-husk',630+n*10,700);z.speed=0;z.hp=z.maxHp*.5;}
  const boss={id:'boss',x:650,y:700,r:36,hp:50,maxHp:100,speed:0,isRaidBoss:true};g.c.zombies.push(boss);g.step(65);
  assert.equal(support.worldMonsterLinks.length,3);assert.equal(boss.hp,50);
  assert.equal(g.c.zombies.filter(z=>z.worldMonsterType==='hollow-husk'&&z.hp>z.maxHp*.5).length,3);
  const linked=[...support.worldMonsterLinks];g.c.support=support;g.run('killZombie(zombies.indexOf(support),support)');
  assert.ok(linked.every(z=>z.worldMonsterWeakenTime===180));
});
test('eye locks a visible 90 frame aim, sweeps only during active beam and cancels offscreen damage',()=>{
  const g=fixture(3),eye=g.spawn('abyss-eye');eye.speed=0;eye.worldMonsterCooldown=0;g.step();
  assert.equal(eye.worldMonsterTimer,90);g.step(89);assert.equal(g.c.player.hp,100);g.step();assert.equal(eye.worldMonsterState,'beam');
  g.c.isInCameraView=()=>false;g.step(40);assert.equal(g.c.player.hp,100);
  g.c.isInCameraView=()=>true;g.c.player.x=eye.x+Math.cos(eye.worldMonsterAim)*200;g.c.player.y=eye.y+Math.sin(eye.worldMonsterAim)*200;
  g.run('updateWorldMonsterCombat()');assert.equal(g.c.player.hp,91.5);
});
test('hazard/effect budgets are bounded and reset clears old-world combat state',()=>{
  const g=fixture(),z=g.spawn('glass-thrower');g.c.owner=z;
  g.run("for(let n=0;n<100;n++){worldMonsterLaunchGlass(owner);worldMonsterEmit('impact',0,0,10,'#fff')}");
  assert.equal(g.run('worldMonsterProjectiles.length'),48);assert.equal(g.run('worldMonsterEffects.length'),80);
  g.c.selectedWorld=3;g.run('worldMonsterBeginFrame()');assert.equal(g.run('worldMonsterProjectiles.length'),0);assert.equal(g.run('worldMonsterEffects.length'),0);
  g.run('resetWorldMonsters()');assert.equal(g.run('worldMonsterLiveEnemies.size'),0);
});
