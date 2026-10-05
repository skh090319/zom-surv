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
