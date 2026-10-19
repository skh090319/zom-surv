const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function game(){
  const c={Math,Image:class{},selectedCharacter:'aria',transcended:{},WORLD:{width:4000,height:3000},wave:1,totalZombieKills:0,
    player:{x:1000,y:1000,r:20,hp:1000,maxHp:1000,damage:100,level:10,fireCooldown:0,invincibleTime:0,score:0,kills:0,speed:4,dodgeLevel:0,
      ariaQCooldown:0,ariaECooldown:0,ariaXCooldown:0,ariaRCooldown:0,ariaUltimateTime:0,ariaSoilLevel:0,ariaThornLevel:0,ariaNightLevel:0},
    mouse:{worldX:1600,worldY:1000,down:false},zombies:[],particles:[],keys:{},stickyZones:[],fireTrails:[],terraStructures:[],gravityFields:[],zombieSlowTimer:0,
    scaledDamage:n=>n,saveTotalKills(){},onRenZombieKilled(){},onVargasZombieKilled(){},createFireTrail(){},getZombieDifficultyDamageMultiplier:()=>1};
  vm.createContext(c);const run=s=>vm.runInContext(s,c);
  for(const name of ['04-weapons-spawn','04-bosses','04-aria','06-entities-update'])run(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'));
  c.dropExp=()=>{};c.defeatRaidBoss=()=>{};
  run('resetAriaRework();ariaGrowth.treeTick=10000');
  return{c,run,step(n){run('for(let frame=0;frame<'+n+';frame++)updateAria()');},enemy(x=1200,y=1000,extra={}){
    const z={x,y,r:18,hp:1000000,maxHp:1000000,speed:0,...extra};c.zombies.push(z);return z;}};
}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-7,actual+' != '+expected);}
test('the permanent tree starts at exact world center and never follows movement, aiming, or the ultimate',()=>{
  const g=game();assert.deepEqual({...g.run('getAriaTreePosition()')},{x:2000,y:1500});
  assert.equal(g.run('ariaGrowth.treeX'),2000);assert.equal(g.run('ariaGrowth.treeY'),1500);
  g.c.player.x=3500;g.c.player.y=2800;g.c.mouse.worldX=10;g.c.mouse.worldY=10;g.run('activateAriaR()');
  assert.equal(g.run('ariaWorldTree.x'),2000);assert.equal(g.run('ariaWorldTree.y'),1500);
  g.c.player.x=100;g.step(720);assert.equal(g.run('ariaWorldTree'),null);assert.equal(g.run('ariaGrowth.treeX'),2000);
  assert.deepEqual({...g.run('getAriaTreePosition()')},{x:2000,y:1500});
});
test('growth has four unlock thresholds while essence damage continues beyond the last stage',()=>{
  const g=game();
  for(const [essence,stage]of [[0,0],[99,0],[100,1],[300,2],[600,3],[1200,4],[5000,4]]){
    g.run('ariaGrowth.essence='+essence);assert.equal(g.run('getAriaGrowthStage()'),stage);
    near(g.run('ariaDamage(1)'),100*(1+essence*.0015));
    near(g.run('getAriaGrowthProgress().damageBonus'),essence*.0015);
  }
  assert.equal(g.run('getAriaGrowthProgress().next'),null);assert.equal(g.run('getAriaGrowthProgress().ratio'),1);
});
test('actual kill handling awards each ordinary or boss death once, including non-Aria damage sources',()=>{
  const g=game(),normal=g.enemy(),boss=g.enemy(1300,1000,{isRaidBoss:true,raidIndex:1}),minion=g.enemy(1400,1000,{isBossMinion:true});
  g.c.normal=normal;g.c.boss=boss;g.c.minion=minion;
  g.run('killZombie(0,normal);killZombie(0,normal);onAriaEnemyKilled(normal)');
  assert.equal(g.run('ariaGrowth.essence'),1);assert.equal(g.c.player.kills,1);
  g.run('killZombie(0,boss);killZombie(0,minion)');assert.equal(g.run('ariaGrowth.essence'),52);
  g.c.selectedCharacter='mare';const other=g.enemy();g.c.other=other;g.run('killZombie(0,other)');
  assert.equal(g.run('ariaGrowth.essence'),52);
});
test('boss essence requires eight distinct, spaced direct attacks and excludes DOT or recursive hits',()=>{
  const g=game(),boss=g.enemy(1200,1000,{isRaidBoss:true,raidIndex:1});g.c.boss=boss;
  g.run('for(let i=0;i<8;i++){ariaGrowth.frame=i*6;const s=ariaMakeSource();ariaDealDamage(boss,.01,s,{direct:true});ariaDealDamage(boss,.01,s,{direct:true});}');
  assert.equal(g.run('ariaGrowth.essence'),3);
  g.run('for(let i=0;i<100;i++)ariaDealDamage(boss,.01,ariaMakeSource(),{dot:true,secondary:true,direct:false})');
  assert.equal(g.run('ariaGrowth.essence'),3);
});
test('basic petals home into a moving target, hit asynchronously, and gain piercing at the first growth stage',()=>{
  const g=game(),target=g.enemy(1260,1050);g.run('attackWithAria()');
  assert.equal(target.hp,target.maxHp);assert.equal(g.run('ariaBolts.length'),3);assert.equal(g.c.player.fireCooldown,24);
  target.y=1100;g.step(25);assert.ok(target.hp<target.maxHp);assert.equal(g.run('ariaSoils.length'),0);
  const h=game(),front=h.enemy(1100,1000),back=h.enemy(1200,1000);h.c.front=front;
  h.run('ariaGrowth.essence=100;ariaSpawnBolt(player,front,0,1,ariaMakeSource({kind:"basic",direct:true}),"petal",2)');h.step(15);
  near(front.maxHp-front.hp,115);near(back.maxHp-back.hp,115);
  h.c.player.fireCooldown=0;h.run('attackWithAria()');assert.equal(h.run('ariaBolts.length'),4);
});
test('holding auto-aims petals while mobile dragging launches along the chosen direction and only homes forward',()=>{
  const hold=game(),behind=hold.enemy(800,1000);hold.c.mobileAttackAim={dragged:false,angle:0};
  hold.run('attackWithAria()');assert.equal(hold.run('ariaBolts.every(b=>Math.cos(b.angle)<-.99)'),true);
  hold.step(15);assert.ok(behind.hp<behind.maxHp);
  const drag=game(),rear=drag.enemy(850,1000),front=drag.enemy(1400,1180);drag.c.front=front;
  drag.c.mobileAttackAim={dragged:true,angle:0};drag.c.mouse.worldX=850;drag.c.mouse.worldY=1000;
  drag.run('attackWithAria()');
  near(drag.run('ariaBolts[1].angle'),0);assert.equal(drag.run('ariaBolts.every(b=>b.target===front)'),true);
  drag.step(6);near(drag.run('ariaBolts[1].angle'),0);near(drag.run('ariaBolts[1].y'),1000);
  drag.step(29);assert.ok(front.hp<front.maxHp);assert.equal(rear.hp,rear.maxHp);
  const empty=game(),onlyRear=empty.enemy(850,1000);empty.c.mobileAttackAim={dragged:true,angle:Math.PI/2};
  empty.run('attackWithAria()');empty.step(30);
  assert.equal(onlyRear.hp,onlyRear.maxHp);assert.equal(empty.run('ariaBolts.every(b=>b.y>player.y&&b.target===null)'),true);
});
test('tree attacks prioritize marks near the player even when the tree is far away',()=>{
  const g=game(),nearby=g.enemy(1050,1000),marked=g.enemy(1750,1000);g.c.marked=marked;
  g.run('ariaMark(marked);ariaTreeAttack()');assert.equal(nearby.hp,nearby.maxHp);near(marked.maxHp-marked.hp,275);
  assert.equal(g.run('ariaEffects.find(e=>e.type==="treeRoot").x'),2000);
  assert.equal(g.run('ariaEffects.find(e=>e.type==="treeRoot").tx'),1750);
});
test('stage 300 shares a direct hit with two nearby enemies exactly once without recursive sharing',()=>{
  const g=game(),a=g.enemy(),b=g.enemy(1250),c=g.enemy(1300),d=g.enemy(1400);g.c.a=a;
  g.run('ariaGrowth.essence=300;ariaDealDamage(a,1,ariaMakeSource(),{direct:true})');
  near(a.maxHp-a.hp,145);near(b.maxHp-b.hp,50.75);near(c.maxHp-c.hp,50.75);assert.equal(d.hp,d.maxHp);
});
test('Q pierces the aim line and marks survivors without any soil requirement',()=>{
  const g=game(),a=g.enemy(1200),b=g.enemy(1600),side=g.enemy(1200,1150),behind=g.enemy(800);
  g.run('activateAriaQ()');near(a.maxHp-a.hp,600);near(b.maxHp-b.hp,600);assert.equal(side.hp,side.maxHp);assert.equal(behind.hp,behind.maxHp);
  assert.equal(a.ariaMarkTime,480);assert.equal(g.c.player.ariaQCooldown,270);
  const hp=a.hp;g.run('activateAriaQ()');assert.equal(a.hp,hp);
});
test('infection persists after its field fades, pulses eleven times, then grants boss essence on expiry',()=>{
  const g=game(),boss=g.enemy(1520,1000,{isRaidBoss:true,raidIndex:1});g.c.mouse.worldX=3000;
  g.run('activateAriaE()');assert.equal(g.run('ariaBlooms[0].x'),1520);near(boss.maxHp-boss.hp,280);
  g.step(30);near(boss.maxHp-boss.hp,360);g.step(150);assert.equal(g.run('ariaBlooms.length'),0);assert.ok(boss.ariaInfection);
  g.step(180);assert.equal(boss.ariaInfection,undefined);assert.equal(g.run('ariaGrowth.essence'),8);near(boss.maxHp-boss.hp,1463.6);
});
test('infection immediately slows normal movement and refreshes the slow on each DOT pulse without shortening stronger control',()=>{
  const g=game(),enemy=g.enemy(1520,1000,{speed:10});g.c.enemy=enemy;
  g.run('ariaInfect(enemy,ariaMakeSource({bloom:true}));updateZombies()');
  near(enemy.x,1514.5);assert.equal(enemy.slowTime,44);
  enemy.slowTime=3;g.step(30);assert.equal(enemy.slowTime,45);
  enemy.slowTime=100;g.step(30);assert.equal(enemy.slowTime,100);
  enemy.slowTime=0;g.step(270);assert.equal(enemy.slowTime,45);
  g.step(30);assert.equal(enemy.ariaInfection,undefined);
  enemy.slowTime=0;g.step(30);assert.equal(enemy.slowTime,0);
});
test('infected deaths explode and transfer without synchronous recursion or more than three generations',()=>{
  const g=game(),a=g.enemy(1200,1000,{hp:1}),b=g.enemy(1320,1000),c=g.enemy(1450,1000);g.c.a=a;
  g.run('ariaInfect(a,ariaMakeSource({bloom:true}));killZombie(0,a)');
  assert.equal(b.ariaInfection,undefined);assert.equal(g.run('ariaDeathQueue.length'),1);
  g.step(1);assert.equal(b.ariaInfection.generation,1);assert.equal(c.ariaInfection.generation,1);assert.ok(b.hp<b.maxHp);
  g.c.b=b;g.run('b.ariaInfection.generation=3;killZombie(zombies.indexOf(b),b)');delete c.ariaInfection;
  g.step(1);assert.equal(c.ariaInfection,undefined);assert.equal(g.run('ariaDeathQueue.length'),0);
});
test('X detonates existing marks and infection without consuming them and its shield covers contact and raid damage',()=>{
  const g=game(),enemy=g.enemy(3000,1000);g.c.enemy=enemy;
  g.run('ariaMark(enemy);ariaInfect(enemy,ariaMakeSource({bloom:true}));activateAriaX()');
  near(enemy.maxHp-enemy.hp,956.25);assert.equal(enemy.ariaMarkTime,480);assert.equal(enemy.ariaInfection.life,360);
  assert.equal(g.run('getAriaMoveMultiplier()'),1.25);assert.equal(g.run('ariaGrowth.shield'),200);
  g.enemy(1000,1000);g.run('updateZombies()');assert.equal(g.c.player.hp,1000);assert.equal(g.run('ariaGrowth.shield'),190);
  g.c.player.invincibleTime=0;g.run('raidPlayerDamage(.3)');assert.equal(g.c.player.hp,890);assert.equal(g.run('ariaGrowth.shield'),0);
  g.step(240);assert.equal(g.run('getAriaMoveMultiplier()'),1);
});
test('R keeps its level lock, accelerates independent roots for twelve seconds, and retains its fixed center',()=>{
  const g=game();g.c.player.level=9;g.run('activateAriaR()');assert.equal(g.run('ariaWorldTree'),null);
  g.c.player.level=10;g.c.rootCount=0;g.run('ariaTreeAttack=()=>rootCount++;activateAriaR()');g.step(720);
  assert.equal(g.c.rootCount,40);assert.equal(g.run('ariaWorldTree'),null);assert.equal(g.c.player.ariaUltimateTime,0);assert.equal(g.c.player.ariaRCooldown,780);
});
test('R echoes basics and up to six Q targets from the center tree without recursive echoes',()=>{
  const basic=game(),target=basic.enemy();basic.run('activateAriaR();ariaGrowth.treeTick=10000;attackWithAria()');
  near(target.maxHp-target.hp,180);assert.equal(basic.run('ariaBolts.length'),3);
  basic.step(15);near(target.maxHp-target.hp,540);
  assert.equal(basic.run('ariaEffects.filter(e=>e.type==="treeEcho").length'),1);
  const spear=game(),targets=Array.from({length:7},(_,n)=>spear.enemy(1100+n*75,1000));
  spear.run('activateAriaR();activateAriaQ()');
  for(const target of targets.slice(0,6))near(target.maxHp-target.hp,975);
  near(targets[6].maxHp-targets[6].hp,600);
  assert.equal(spear.run('ariaEffects.filter(e=>e.type==="treeEcho").length'),6);
  assert.equal(spear.run('ariaEffects.filter(e=>e.type==="treeEcho").every(e=>e.x===WORLD.width/2&&e.y===WORLD.height/2)'),true);
});
test('ultimate finale reaches distant marks and uses fixed raid percentage conversion, with bounded 1200-stage chains',()=>{
  const g=game(),boss=g.enemy(3500,2600,{isRaidBoss:true,raidIndex:1});g.c.boss=boss;
  g.run('ariaMark(boss);activateAriaR();ariaFinalBloom(ariaWorldTree)');near(boss.maxHp-boss.hp,1300);
  const h=game();for(let i=0;i<200;i++)h.enemy(2000+i%10,1500);
  h.run('ariaGrowth.essence=1200;activateAriaR()');h.c.calls=0;h.run('ariaDealDamage=()=>calls++;ariaFinalBloom(ariaWorldTree)');
  assert.equal(h.c.calls,236);
});
test('600-stage spirits cannot reproduce themselves, and all combat queues have hard limits',()=>{
  const g=game();g.run('ariaGrowth.essence=600');const first=g.enemy(1200,1000,{hp:1}),next=g.enemy(1250,1000,{hp:1});g.c.first=first;g.c.next=next;
  g.run('killZombie(0,first)');assert.equal(g.run('ariaSpirits.length'),1);
  g.run('ariaDealDamage(next,1,ariaMakeSource(),{secondary:true})');assert.equal(g.run('ariaSpirits.length'),1);
  for(let i=0;i<150;i++)g.enemy(1400+i%5,1000,{hp:1});
  g.run('for(const z of [...zombies]){ariaInfect(z,ariaMakeSource());killZombie(zombies.indexOf(z),z);}for(let i=0;i<150;i++){player.fireCooldown=0;attackWithAria();player.ariaECooldown=0;activateAriaE();}');
  assert.ok(g.run('ariaBolts.length')<=96);assert.ok(g.run('ariaSpirits.length')<=32);assert.ok(g.run('ariaBlooms.length')<=6);assert.ok(g.run('ariaDeathQueue.length')<=64);assert.ok(g.run('ariaEffects.length')<=120);
});
test('restart clears growth, shields, projectiles and enemy statuses; other heroes gain no Aria effects',()=>{
  const g=game(),enemy=g.enemy();g.c.enemy=enemy;
  g.run('ariaGrowth.essence=1200;ariaMark(enemy);ariaInfect(enemy,ariaMakeSource());activateAriaX();activateAriaR();attackWithAria();resetAriaRework()');
  assert.equal(g.run('ariaGrowth.essence'),0);assert.equal(g.run('ariaGrowth.shield'),0);assert.equal(g.run('ariaBolts.length'),0);assert.equal(g.run('ariaWorldTree'),null);assert.equal(enemy.ariaMarkTime,undefined);assert.equal(enemy.ariaInfection,undefined);
  g.c.selectedCharacter='mare';g.run('ariaAddEssence(100);attackWithAria();activateAriaQ();activateAriaE();activateAriaX();activateAriaR();updateAria()');
  assert.equal(g.run('ariaGrowth.essence'),0);assert.equal(g.run('ariaGrowth.frame'),0);assert.equal(g.run('ariaBolts.length'),0);assert.equal(g.run('getAriaMoveMultiplier()'),1);assert.equal(g.run('absorbAriaShield(100)'),100);
});
