const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function game(){
  const c={console,Math:Object.create(Math),selectedCharacter:'lush',player:{x:1000,y:1000,r:16,damage:10,hp:100,maxHp:100,level:10,fireCooldown:0},mouse:{worldX:1600,worldY:1000},upgradeCount:{},transcended:{},zombies:[],scaledDamage:n=>n,killZombie(i,z){vm.runInContext('lushAwardKill',c)(z);c.zombies.splice(i,1);}};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/10-lush.js'),'utf8'),c);const run=s=>vm.runInContext(s,c);run('resetLush()');return{c,run,step(n){run(`for(let i=0;i<${n};i++)updateLush()`);},enemy(x,y,hp=100000){const z={x,y,r:18,hp};c.zombies.push(z);return z;}};
}
test('four wagers reduce odds by exactly 7.5 points; fourth win settles only net profit',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('lushState.chips=20;lushState.totalAssets=20');
  for(const expected of [.7,.625,.55,.475]){assert.equal(g.run('lushOdds()'),expected);g.run('player.lusheCooldown=0;activateLushE();lushResolveBet()');}
  assert.equal(g.run('lushState.chips'),320);assert.equal(g.run('lushState.pot'),0);assert.equal(g.run('lushState.totalAssets'),320);assert.equal(g.run('lushState.wins'),0);assert.equal(g.run('lushTier()'),2);assert.ok(g.run('lushState.buffTime')>0);
});
test('cashout banks principal but never counts it twice; empty X cannot farm permanent assets',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('lushState.chips=20;lushState.totalAssets=20;activateLushE();lushResolveBet();activateLushX()');
  assert.equal(g.run('lushState.chips'),40);assert.equal(g.run('lushState.totalAssets'),40);
  g.run('player.lushxCooldown=0;activateLushX();player.lushxCooldown=0;activateLushX()');assert.equal(g.run('lushState.totalAssets'),40);
  g.run('player.lusheCooldown=0;activateLushE();lushResolveBet();player.lushxCooldown=0;activateLushX()');assert.equal(g.run('lushState.totalAssets'),80);assert.equal(g.run('lushState.chips'),80);
});
test('failure loses only unsettled pot; retains new chips, permanent wealth and secured buffs, without self-damage',()=>{
  const g=game();g.c.Math.random=()=>.99;g.run('lushState.chips=20;lushState.totalAssets=70;lushState.buff=.5;lushState.buffTime=500;activateLushE();lushState.chips+=7;lushResolveBet()');
  assert.equal(g.run('lushState.chips'),7);assert.equal(g.run('lushState.totalAssets'),70);assert.equal(g.run('lushState.pot'),0);assert.equal(g.run('lushState.principal'),0);assert.equal(g.run('lushState.buff'),.5);assert.equal(g.run('lushState.hazards.length'),0);g.step(100);assert.equal(g.c.player.hp,100);
});
test('bet boundary is strict, repeat input cannot double-spend, X defends without settling pending wager',()=>{
  const g=game();g.c.Math.random=()=>.7;g.run('lushState.chips=10;activateLushE();activateLushE();activateLushX()');
  assert.equal(g.run('lushState.bet.amount'),10);assert.equal(g.run('lushState.dice.length'),1);assert.equal(g.run('lushState.chips'),0);assert.equal(g.run('lushState.pot'),10);assert.ok(g.run('lushState.shield')>0);g.run('lushResolveBet()');assert.equal(g.run('lushState.pot'),0);
});
test('E is an independent piercing pulse attack even with zero chips or low health',()=>{
  const g=game();g.c.Math.random=()=>0;g.c.player.hp=1;const line=g.enemy(1250,1000),impact=g.enemy(1500,1000);
  g.run('activateLushE()');assert.equal(g.run('lushState.bet'),null);assert.equal(g.run('lushState.dice.length'),1);g.step(90);
  assert.ok(line.hp<100000);assert.ok(impact.hp<line.hp);assert.equal(g.c.player.hp,1);assert.equal(g.run('lushState.dice.length'),0);
});
test('Q launches all five ranks, pierces multiple enemies, marks and detonates for boss damage',()=>{
  const g=game(),a=g.enemy(1250,1000),b=g.enemy(1700,1000);g.run('activateLushQ();activateLushQ()');assert.equal(g.run('lushState.qBursts.length'),1);
  g.step(15);assert.ok(a.lushMarks>0);g.step(70);assert.equal(a.lushMarks,0);assert.equal(b.lushMarks,0);assert.equal(a.hp,99774);assert.equal(b.hp,99774);assert.equal(g.run('lushState.qBursts.length'),0);
});
test('Q remains available during an unresolved wager and the ultimate mirrors its five-card volley',()=>{
  const g=game();g.run('lushState.chips=10;activateLushE();activateLushR();activateLushQ()');assert.equal(g.run('lushState.qBursts.length'),5);assert.ok(g.run('lushState.bet'));g.step(1);assert.equal(g.run("lushState.cards.filter(c=>c.kind==='royal').length"),5);
});
test('basic attacks have three piercing cards, every fourth ace and permanent tier extra shots',()=>{
  const g=game(),a=g.enemy(1250,1000),b=g.enemy(1500,1000);g.run('attackWithLush()');assert.equal(g.run('lushState.cards.length'),3);g.step(40);assert.ok(a.hp<100000&&b.hp<100000);
  g.run('lushState.cards=[];lushState.shots=3;player.fireCooldown=0;lushState.totalAssets=700;attackWithLush()');assert.equal(g.run('lushState.cards.length'),8);assert.equal(g.run("lushState.cards.filter(c=>c.kind==='ace').length"),1);
});
test('each basic card makes one complete collision-free circle before hitting a lone target for half damage',()=>{
  const g=game(),z=g.enemy(1100,1000);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  assert.equal(z.hp,99988);const bounce=g.run("lushState.cards.find(c=>c.kind==='ricochet')");
  assert.ok(bounce);assert.equal(bounce.damage,6);assert.equal(bounce.target,z);assert.equal(bounce.ricochetPhase,'loop');assert.equal(bounce.age,0);
  const start={x:bounce.x,y:bounce.y},positions=[];
  while(bounce.ricochetPhase==='loop'){
    g.step(1);positions.push({x:bounce.x,y:bounce.y});assert.equal(z.hp,99988);
    assert.ok(Math.abs(Math.hypot(bounce.x-bounce.loopCenterX,bounce.y-bounce.loopCenterY)-72)<1e-8);
    assert.ok(positions.length<30);
  }
  assert.equal(positions.length,21);assert.equal(bounce.loopProgress,Math.PI*2);assert.equal(bounce.looped,true);
  assert.ok(Math.hypot(bounce.x-start.x,bounce.y-start.y)<1e-8);assert.ok(Math.max(...positions.map(p=>p.y))-Math.min(...positions.map(p=>p.y))>140);
  g.step(1);assert.equal(z.hp,99982);assert.equal(g.run("lushState.cards.some(c=>c.kind==='ricochet')"),false);
  g.step(100);assert.equal(z.hp,99982);assert.equal(g.run('lushState.cards.length'),0);
});
test('ricochet chooses the nearest other live enemy within 600 and cannot chain to a third enemy',()=>{
  const g=game(),a=g.enemy(1100,1000),b=g.enemy(1100,1120),c=g.enemy(1100,1250),dead=g.enemy(1100,1040,0);
  g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  const bounce=g.run("lushState.cards.find(c=>c.kind==='ricochet')");assert.equal(bounce.target,b);assert.equal(bounce.ricochetPhase,'seek');assert.equal(bounce.ricochetEligible,false);
  g.step(120);assert.equal(a.hp,99988);assert.equal(b.hp,99994);assert.equal(c.hp,100000);assert.equal(dead.hp,0);assert.equal(g.run('lushState.cards.length'),0);
});
test('original cards still pierce but only their first successful hit creates a ricochet',()=>{
  const g=game(),a=g.enemy(1100,1000),b=g.enemy(1300,1000),c=g.enemy(1600,1000);
  g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');let count=0;
  for(let i=0;i<100;i++){g.step(1);count+=g.run("lushState.cards.filter(c=>c.kind==='ricochet'&&c.age===0).length");}
  assert.equal(count,1);assert.equal(a.hp,99988);assert.equal(b.hp,99982);assert.equal(c.hp,99988);
});
test('ricochet freezes half of the actual scaled hit even if assets and buffs later change',()=>{
  const g=game(),a=g.enemy(1100,1000),b=g.enemy(1100,1200);g.c.scaledDamage=n=>n*2;
  g.run('lushState.totalAssets=200;lushState.buff=.5;lushState.buffTime=500;lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  assert.equal(a.hp,99928);assert.equal(g.run("lushState.cards.find(c=>c.kind==='ricochet').damage"),36);
  g.run('lushState.totalAssets=2000;lushState.buff=3');g.step(50);assert.equal(b.hp,99964);
});
test('fourth-shot golden ace and wealth side cards each get one correctly scaled ricochet',()=>{
  for(const kind of ['basic','ace','dealer']){
    const g=game(),z=g.enemy(1100,1000);g.run(`lushState.shots=3;lushState.totalAssets=700;attackWithLush();lushState.cards=[lushState.cards.find(c=>c.kind==='${kind}')];lushState.cards[0].x=1000;lushState.cards[0].y=1000;lushState.cards[0].a=0;lushState.cards[0].homing=0`);
    const expected=g.run('lushPower(lushState.cards[0].power)');g.step(4);const bounce=g.run("lushState.cards.find(c=>c.kind==='ricochet')");
    assert.ok(bounce,kind);assert.equal(bounce.sourceKind,kind);assert.equal(bounce.damage,expected*.5);g.step(120);assert.ok(Math.abs(100000-z.hp-expected*1.5)<1e-8,kind);
  }
});
test('ricochets do not shorten normal or recovery fire cadence or create additional base shots',()=>{
  for(const recovery of [false,true]){
    const g=game();g.enemy(1100,1000);g.run(recovery?'lushState.failureTime=180;upgradeCount.lushRecovery=1':'0');const cadence=recovery?15:23;
    g.run('attackWithLush()');assert.equal(g.c.player.fireCooldown,cadence);
    for(let i=1;i<cadence;i++){g.run('player.fireCooldown--;updateLush();attackWithLush()');assert.equal(g.run('lushState.shots'),1);}
    assert.ok(g.run("lushState.cards.some(c=>c.kind==='ricochet')"));g.run('player.fireCooldown--;updateLush();attackWithLush()');assert.equal(g.run('lushState.shots'),2);assert.equal(g.c.player.fireCooldown,cadence);
  }
});
test('a lethal initial hit can ricochet to another live enemy without extra kill credit',()=>{
  const g=game(),a=g.enemy(1100,1000,1),b=g.enemy(1100,1120);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  assert.equal(g.c.zombies.includes(a),false);assert.equal(g.run("lushState.cards.find(c=>c.kind==='ricochet').damage"),6);g.step(100);
  assert.equal(b.hp,99994);assert.equal(g.run('lushState.chips'),1);assert.equal(g.run('lushState.totalAssets'),1);
});
test('a ricochet kill earns exactly one chip and asset with no recursive hit or extra attack',()=>{
  const g=game();g.enemy(1100,1000);g.enemy(1100,1120,6);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(100);
  assert.equal(g.c.zombies.length,1);assert.equal(g.run('lushState.chips'),1);assert.equal(g.run('lushState.totalAssets'),1);assert.equal(g.run('lushState.cards.length'),0);
});
test('ricochet sweeps only its selected target, ignoring enemies crossing the path',()=>{
  const g=game();g.enemy(1100,1000);const target=g.enemy(1100,1300);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  const bystander=g.enemy(1100,1140);g.run("lushState.cards.find(c=>c.kind==='ricochet').speed=400");g.step(1);
  assert.equal(target.hp,99994);assert.equal(bystander.hp,100000);assert.equal(g.run("lushState.cards.some(c=>c.kind==='ricochet')"),false);
});
test('a dead ricochet target retargets safely, or circles back to the surviving original',()=>{
  const g=game(),a=g.enemy(1100,1000),b=g.enemy(1100,1200),c=g.enemy(1100,1400);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);b.hp=0;g.step(1);
  assert.equal(g.run("lushState.cards.find(c=>c.kind==='ricochet').target"),c);g.step(100);assert.equal(a.hp,99988);assert.equal(c.hp,99994);
  const h=game(),original=h.enemy(1100,1000),other=h.enemy(1100,1200);h.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');h.step(4);h.c.zombies.splice(h.c.zombies.indexOf(other),1);h.step(1);
  assert.equal(h.run("lushState.cards.find(c=>c.kind==='ricochet').ricochetPhase"),'loop');assert.equal(original.hp,99988);h.step(100);assert.equal(original.hp,99982);
});
test('isolated dead targets despawn, distant enemies do not prevent the circle, and chase lifetime is bounded',()=>{
  const g=game(),a=g.enemy(1100,1000);g.enemy(1100,1700);g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(4);
  assert.equal(g.run("lushState.cards.find(c=>c.kind==='ricochet').ricochetPhase"),'loop');a.hp=0;g.step(1);assert.equal(g.run("lushState.cards.some(c=>c.kind==='ricochet')"),false);
  const h=game(),dead=h.enemy(1100,1000,1);h.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');h.step(4);assert.equal(h.c.zombies.includes(dead),false);assert.equal(h.run("lushState.cards.some(c=>c.kind==='ricochet')"),false);
  const k=game();k.enemy(1100,1000);const runner=k.enemy(1100,1300);k.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');k.step(4);
  for(let i=0;i<100;i++){runner.y+=30;k.step(1);}assert.equal(runner.hp,100000);assert.equal(k.run('lushState.cards.length'),0);
});
test('a large lone enemy cannot be hit again during the full circular flight',()=>{
  const g=game(),z=g.enemy(1100,1000);z.r=200;g.run('lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(1);assert.equal(z.hp,99988);
  g.step(21);assert.equal(z.hp,99988);g.step(1);assert.equal(z.hp,99982);
});
test('Q, automatic ultimate dealers and finisher cards never gain basic ricochets',()=>{
  const q=game();q.enemy(1250,1000);q.run('activateLushQ()');let qBounces=0;
  for(let i=0;i<100;i++){q.step(1);qBounces+=q.run("lushState.cards.filter(c=>c.kind==='ricochet'||c.ricochetEligible).length");}assert.equal(qBounces,0);
  const r=game();r.enemy(1250,1000);r.run('activateLushR()');let rBounces=0;
  for(let i=0;i<180;i++){r.step(1);rBounces+=r.run("lushState.cards.filter(c=>c.kind==='ricochet'||c.ricochetEligible).length");}assert.equal(rBounces,0);
  r.run('lushRadialCards(36,5.8)');assert.equal(r.run('lushState.cards.some(c=>c.ricochetEligible)'),false);
});
test('ricochet spawning at the card cap cannot update a source twice or grow the card pool',()=>{
  const g=game(),z=g.enemy(1019,1000);g.run('for(let i=0;i<176;i++)lushSpawnCard(1000,1000,0,{ricochetEligible:true,homing:0})');g.step(1);
  assert.equal(z.hp,100000-176*12);assert.equal(g.run('lushState.cards.length'),176);assert.equal(g.run("lushState.cards.filter(c=>c.kind==='ricochet').length"),176);
  g.step(150);assert.equal(z.hp,100000-176*18);assert.equal(g.run('lushState.cards.length'),0);
});
test('kill awards exactly one chip and permanent asset even under repeated kill processing',()=>{
  const g=game(),z=g.enemy(1100,1000,1);g.c.victim=z;g.run('lushAwardKill(victim);lushAwardKill(victim);lushDamage(victim,100);lushDamage(victim,100)');assert.equal(g.run('lushState.chips'),1);assert.equal(g.run('lushState.totalAssets'),1);assert.equal(g.c.zombies.length,0);
});
test('X has baseline defense and an outward/returning damage pass with no pot',()=>{
  const g=game(),z=g.enemy(1200,1000);g.run('activateLushX()');assert.ok(g.run('lushState.shield')>=12);g.step(35);const outward=z.hp;assert.ok(outward<100000);g.step(40);assert.ok(z.hp<outward);assert.equal(g.run('lushState.chipStorms.length'),0);
});
test('golden ledger enhances only realised net gain, transcended heal does not trigger from empty X',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('upgradeCount.lushCollateral=4;transcended.lushCollateral=true;player.hp=50;lushState.chips=20;lushState.totalAssets=20;activateLushE();lushResolveBet();activateLushX()');assert.equal(g.run('lushState.totalAssets'),46);assert.equal(g.c.player.hp,60);
  g.run('player.lushxCooldown=0;activateLushX()');assert.equal(g.c.player.hp,60);
});
test('ultimate unlocks at 10, preserves bankroll, follows player and dealers deal real damage',()=>{
  const g=game();g.c.player.level=9;g.run('activateLushR()');assert.equal(g.run('lushState.ultimate'),null);g.c.player.level=10;const z=g.enemy(1300,1000);g.run('lushState.chips=25;activateLushR()');assert.equal(g.run('lushState.chips'),25);
  const oldX=g.run('lushState.ultimate.dealers[0].x');g.c.player.x+=100;g.step(100);assert.ok(g.run('lushState.ultimate.dealers[0].x')>oldX);assert.ok(z.hp<100000);g.step(650);assert.equal(g.run('lushState.ultimate'),null);assert.equal(g.run('lushState.realm'),0);
});
test('four E wins fit inside the ultimate and guarantee 777 without stopping ongoing combat',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('lushState.chips=20;activateLushR()');
  for(let i=0;i<4;i++){g.run('activateLushE()');g.step(150);}
  assert.equal(g.run('lushState.ultimate.force777'),true);assert.equal(g.run('lushState.ultimate.result'),'jackpot');assert.ok(g.run('lushState.ultimate.strength')>=4);assert.ok(g.run('lushState.finishers.length')>=9);
});
test('normal, triple and 777 finishes all damage enemies; cascades are not visual-only',()=>{
  for(const reels of [[1,2,3],[2,2,2],[7,7,7]]){
    const g=game(),z=g.enemy(1000,1000);g.run(`activateLushR();lushState.ultimate.reels=${JSON.stringify(reels)};lushResolveUltimate()`);const start=z.hp;assert.ok(start<100000);
    g.step(85);assert.ok(z.hp<start||reels[0]!==reels[1]);assert.equal(g.run('lushState.finishers.some(f=>!f.triggered)'),false);
  }
  const g=game(),z=g.enemy(1300,1000);g.run('lushQueueFinisher("cascade",1300,1000,100,8,5)');g.step(4);assert.equal(z.hp,100000);g.step(1);assert.equal(z.hp,99920);g.step(30);assert.equal(z.hp,99920);
});
test('own damage growth does not modify global player damage or shared damage scaling',()=>{
  const g=game();g.run('lushState.totalAssets=200');assert.equal(g.run('lushPower(1)'),20);assert.equal(g.c.player.damage,10);assert.equal(g.c.scaledDamage(10),10);
});
test('loaded dice third rank removes the six-face damage penalty instead of being a dead upgrade',()=>{
  const damages=[];
  for(const rank of [1,2,3]){const g=game(),z=g.enemy(1500,1000);g.c.Math.random=()=>0;
    g.run(`upgradeCount.lushLoaded=${rank}`);assert.equal(g.run('lushRoll()'),rank===1?2:3);
    g.run('lushLaunchDie(1,false,{eye:6})');g.step(100);damages.push(100000-z.hp);
  }
  assert.equal(damages[0],damages[1]);assert.ok(damages[2]>damages[1]);
});
test('rapid repeated attacks remain bounded and drain after combat stops',()=>{
  const g=game();g.run('lushState.totalAssets=700;activateLushR();for(let i=0;i<200;i++){player.fireCooldown=0;attackWithLush();updateLush()}');
  assert.ok(g.run('lushState.cards.length')<=176);assert.ok(g.run('lushState.effects.length')<=128);g.step(700);
  assert.equal(g.run('lushState.cards.length'),0);assert.equal(g.run('lushState.effects.length'),0);assert.equal(g.run('lushState.finishers.length'),0);
});
test('run reset clears all financial, attack and cinematic state plus exclusive augments',()=>{
  const g=game();g.run('lushState.chips=100;lushState.totalAssets=900;upgradeCount.lushLoaded=3;activateLushQ();activateLushX();activateLushR();resetLush()');
  for(const key of ['chips','totalAssets','pot','principal','wins','realm'])assert.equal(g.run('lushState.'+key),0);
  for(const key of ['effects','dice','cards','qBursts','chipStorms','finishers'])assert.equal(g.run('lushState.'+key+'.length'),0);
  assert.equal(g.run('lushOdds()'),.7);assert.equal(g.run('upgradeCount.lushLoaded'),0);assert.equal(g.c.player.lushrCooldown,0);
});
