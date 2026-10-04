const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function game(){
  const c={console,Math:Object.create(Math),selectedCharacter:'lush',player:{x:1000,y:1000,r:16,damage:10,hp:100,maxHp:100,level:10,fireCooldown:0},mouse:{worldX:1600,worldY:1000},upgradeCount:{},transcended:{},zombies:[],scaledDamage:n=>n,killZombie(i){c.zombies.splice(i,1);},raidPlayerDamage(n){c.player.hp-=100*n;}};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/10-lush.js'),'utf8'),c);const run=s=>vm.runInContext(s,c);run('resetLush()');return{c,run,enemy(x,y){const z={x,y,r:18,hp:10000};c.zombies.push(z);return z;}};
}
test('four bets decrease by exactly 7.5 percentage points and cash out a fourth win',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('lushState.chips=20;lushState.ready=true');
  for(const expected of [.7,.625,.55,.475]){assert.equal(g.run('lushOdds()'),expected);g.run('player.lusheCooldown=0;activateLushE();lushResolveBet()');}
  assert.equal(g.run('lushState.pot'),0);assert.equal(g.run('lushState.wins'),0);assert.equal(g.run('lushState.ready'),false);assert.ok(g.run('lushState.buffTime')>0);assert.equal(g.run("lushState.effects.some(e=>e.type==='jackpot')"),true);
});
test('new chips stay outside an active bet; failed bet preserves secured buff and bank',()=>{
  const g=game();g.c.Math.random=()=>.99;g.run('lushState.chips=20;lushState.ready=true;lushState.buff=.5;lushState.buffTime=500;activateLushE();lushState.chips+=7;lushResolveBet()');
  assert.equal(g.run('lushState.chips'),7);assert.equal(g.run('lushState.pot'),0);assert.equal(g.run('lushState.buff'),.5);assert.equal(g.run('lushState.hazards.length'),1);
  g.c.player.x=1400;g.run('for(let i=0;i<65;i++)updateLush()');assert.equal(g.c.player.hp,100);
});
test('success is strictly below displayed odds, repeated input does not spend twice, and cash-out waits for result',()=>{
  const g=game();g.c.Math.random=()=>.7;g.run('lushState.chips=10;lushState.ready=true;activateLushE();activateLushE();activateLushX()');assert.equal(g.run('lushState.bet.amount'),10);assert.equal(g.run('lushState.chips'),0);assert.equal(g.run('lushState.pot'),10);g.run('lushResolveBet()');assert.equal(g.run('lushState.pot'),0);
});
test('Q opens betting only after its rolled pulse count, pierces enemies and respects cooldown',()=>{
  const g=game();g.c.Math.random=()=>0;const z=g.enemy(1250,1000);g.run('activateLushQ();activateLushQ()');assert.equal(g.run('lushState.dice.length'),1);assert.equal(g.run('lushState.ready'),false);
  g.run('for(let i=0;i<60;i++)updateLush()');assert.equal(g.run('lushState.ready'),true);assert.equal(g.run('lushState.dice.length'),0);assert.equal(z.hp,9982);
});
test('ultimate requires level 10, resolves without input and fades realm back to zero',()=>{
  const g=game();g.c.player.level=9;g.run('activateLushR()');assert.equal(g.run('lushState.ultimate'),null);g.c.player.level=10;g.c.Math.random=()=>0;
  const z=g.enemy(1100,1000);g.run('lushState.chips=20;activateLushR();for(let i=0;i<420;i++)updateLush()');assert.equal(g.run('lushState.ultimate'),null);assert.equal(g.run('lushState.realm'),0);assert.equal(g.run('lushState.chips'),0);assert.ok(z.hp<9900);
});
test('collateral cannot kill player and successful transcended collateral refunds its cost',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('upgradeCount.lushCollateral=4;transcended.lushCollateral=true;lushState.ready=true;player.hp=20;activateLushE()');assert.equal(g.run('lushState.bet'),null);
  g.run('player.hp=100;activateLushE()');assert.equal(g.c.player.hp,85);g.run('lushResolveBet()');assert.equal(g.c.player.hp,100);
});
test('All In consumes an unfinished Q round without allowing it to reopen betting',()=>{
  const g=game();g.c.Math.random=()=>0;g.run('activateLushQ();activateLushR();for(let i=0;i<100;i++)updateLush()');assert.equal(g.run('lushState.ready'),false);assert.equal(g.run('lushState.dice.length'),0);
});
test('run reset clears chips, odds, effects, cooldowns and exclusive augments',()=>{
  const g=game();g.run('lushState.chips=100;lushState.wins=3;upgradeCount.lushLoaded=3;activateLushR();resetLush()');assert.equal(g.run('lushState.chips'),0);assert.equal(g.run('lushOdds()'),.7);assert.equal(g.run('lushState.effects.length'),0);assert.equal(g.run('upgradeCount.lushLoaded'),0);assert.equal(g.c.player.lushrCooldown,0);
});
