const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function game(character='ren'){
  const c={Math:Object.create(Math),selectedCharacter:character,player:{x:100,y:100,r:20,hp:80,maxHp:100,renShards:0,renTotalEclipseLevel:0,renReaperFootstepsLevel:0,renDarkDevourLevel:0,vargasGainedHp:0,vargasUltimateTime:0},
    renShadowShards:[],renShadowShardBuckets:new Map(),renShadowFields:[],particles:[],transcended:{}};
  vm.createContext(c);for(const file of ['04-ren.js','04-vargas.js'])vm.runInContext(fs.readFileSync('js/'+file,'utf8'),c);
  return{c,run:code=>vm.runInContext(code,c)};
}
test('Ren drops one shard on every eligible kill even at the top of the RNG interval',()=>{
  const g=game();g.c.Math.random=()=>.999999;
  g.run('for(let i=0;i<100;i++)onRenZombieKilled({x:100+i%3,y:100,boss:i%2===0})');
  assert.equal(g.c.renShadowShards.length,1);assert.equal(g.c.renShadowShards[0].amount,100);
  g.run('updateRenShadowShards()');assert.equal(g.c.player.renShards,100);assert.equal(g.c.renShadowShards.length,0);assert.equal(g.c.renShadowShardBuckets.size,0);
});
test('Ren gains additive 0.5 percent attack per collected shard without changing clone limits',()=>{
  const g=game();for(const [count,multiplier]of [[0,1],[1,1.005],[10,1.05],[100,1.5],[200,2]]){
    g.c.player.renShards=count;assert.equal(g.run('getRenAttackMultiplier()'),multiplier);
  }
  g.c.player.renShards=2;assert.equal(g.run('getRenCloneCount()'),0);g.c.player.renShards=3;assert.equal(g.run('getRenCloneCount()'),1);
  g.c.player.renShards=100;assert.equal(g.run('getRenCloneCount()'),4);g.c.player.renTotalEclipseLevel=1;assert.equal(g.run('getRenCloneCount()'),8);
});
test('Ren guaranteed drops retain spatial stacks and per-shard healing, and other heroes cannot receive them',()=>{
  const g=game();g.c.player.renDarkDevourLevel=2;
  g.run('onRenZombieKilled({x:100,y:100});onRenZombieKilled({x:101,y:100});onRenZombieKilled({x:500,y:500});updateRenShadowShards()');
  assert.equal(g.c.player.renShards,2);assert.equal(g.c.player.hp,82);assert.equal(g.c.renShadowShards.length,1);
  g.c.selectedCharacter='vargas';g.run('onRenZombieKilled({x:100,y:100})');assert.equal(g.c.renShadowShards.length,1);
});
test('Vargas growth uses an exact 50 percent boundary and keeps normal and elite gains unchanged',()=>{
  for(const roll of [0,.2,.499999,.5,.999999])for(const boss of [false,true]){
    const g=game('vargas');g.c.Math.random=()=>roll;g.run(`onVargasZombieKilled({boss:${boss}})`);
    const expected=roll<.5?(boss?1.5:.3):0;
    assert.equal(g.c.player.maxHp,100+expected);assert.equal(g.c.player.hp,80+expected);assert.equal(g.c.player.vargasGainedHp,expected);
  }
});
test('Vargas growth still honors upgrades and ultimate doubling without affecting other heroes',()=>{
  const g=game('vargas');g.c.Math.random=()=>.49;g.c.player.vargasPredatorLevel=2;g.c.player.vargasUltimateTime=60;
  g.run('onVargasZombieKilled({boss:true})');assert.equal(g.c.player.vargasGainedHp,4.5);
  g.c.selectedCharacter='ren';g.c.Math.random=()=>{throw new Error('non-Vargas must not roll')};g.run('onVargasZombieKilled({boss:true})');assert.equal(g.c.player.vargasGainedHp,4.5);
});
