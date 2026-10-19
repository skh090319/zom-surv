const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..');
function extract(file, name, next) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return text.slice(text.indexOf(`function ${name}(`), text.indexOf(`function ${next}(`));
}
function scene() {
  const images = [], original = {complete:true,naturalWidth:512,naturalHeight:256};
  const custom = {complete:true,naturalWidth:640,naturalHeight:640};
  const ctx = new Proxy({globalAlpha:1,drawImage:(...args)=>images.push(args)}, {get:(o,k)=>k in o?o[k]:(()=>{})});
  const c = {ctx,Math,zombieSpriteAtlas:original,getWorldMonsterImage:()=>custom,
    ASTRA_TAU:Math.PI*2,astraGlow(){},astraRibbon(){},astraStar(){},ariaVfxVisible:()=>true,ariaVfxPetal(){},
    ariaDevouredEnemies:[],ariaGrowth:{frame:10},getAriaTreePosition:()=>({x:100,y:100})};
  vm.createContext(c);
  vm.runInContext(extract('js/04-astra-vfx.js','drawAstraCapturedBody','drawAstraBurst'),c);
  vm.runInContext(extract('js/20-aria-vfx.js','ariaDrawDevouredEnemyArt','ariaDrawDevouredEnemies'),c);
  vm.runInContext(extract('js/04-aria.js','ariaQueueDevouredEnemy','onAriaEnemyKilled'),c);
  return {c,images,original,custom};
}
test('Astra keeps the custom world monster sprite during capture and meteor flight',()=>{
  const g=scene();
  for(const state of ['orbit','flight']) {
    g.c.drawAstraCapturedBody({x:40,y:50,r:21,a:0,state,trail:[],zombie:{hp:100,worldMonsterType:'hollow-husk'}},false);
    assert.equal(g.images.at(-1)[0],g.custom);
  }
  g.c.drawAstraCapturedBody({x:40,y:50,r:21,a:0,state:'orbit',zombie:{hp:100,boss:false}},false);
  assert.equal(g.images.at(-1)[0],g.original);
});
test('Aria devour snapshot preserves only custom sprite identity, not live attack state',()=>{
  const g=scene();
  g.c.ariaQueueDevouredEnemy({x:200,y:250,r:21,worldMonsterType:'stitcher',attackTimer:80,links:[{}]});
  const snapshot=g.c.ariaDevouredEnemies[0];
  assert.equal(snapshot.worldMonsterType,'stitcher');
  assert.equal(snapshot.attackTimer,undefined);assert.equal(snapshot.links,undefined);
  g.c.ariaDrawDevouredEnemyArt(snapshot,{alpha:1,scale:.8,x:200,y:220,p:.2,t:.2});
  assert.equal(g.images.at(-1)[0],g.custom);
});
test('capture and devour still use the old atlas for World 2 and unloaded custom art',()=>{
  const g=scene();g.custom.complete=false;
  g.c.drawAstraCapturedBody({x:40,y:50,r:21,a:0,state:'orbit',zombie:{hp:100,worldMonsterType:'street-walker'}},false);
  assert.equal(g.images.at(-1)[0],g.original);
  g.c.ariaDrawDevouredEnemyArt({r:21,boss:true},{alpha:1,scale:1,x:0,y:0,p:0,t:0});
  assert.equal(g.images.at(-1)[0],g.original);
  assert.equal(g.images.at(-1)[1],256);
});

test('Aria devours world raids and their minions using the correct separate art',()=>{
  const g=scene(),bossArt={complete:true,naturalWidth:640,naturalHeight:640};
  g.c.getWorldBossImage=(id,world)=>{assert.equal(id,'iron-hauler');assert.equal(world,1);return bossArt;};
  g.c.raidBossImages=[g.original,g.original,g.original];
  for(const enemy of [{x:200,y:250,r:70,isRaidBoss:true,boss:true,worldRaidType:'iron-hauler',worldRaidWorld:1},
    {x:200,y:250,r:23,isBossMinion:true,worldRaidMinionType:'street-walker',worldRaidWorld:1}]){
    g.c.ariaQueueDevouredEnemy({...enemy,owner:{},worldRaidLinks:[{}]});
    const snapshot=g.c.ariaDevouredEnemies.at(-1);
    assert.equal(snapshot.owner,undefined);assert.equal(snapshot.worldRaidLinks,undefined);
    g.c.ariaDrawDevouredEnemyArt(snapshot,{alpha:1,scale:.8,x:200,y:220,p:.2,t:.2});
    assert.equal(g.images.at(-1)[0],enemy.isRaidBoss?bossArt:g.custom);
  }
});
