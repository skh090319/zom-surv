const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/00-worlds.js'),'utf8');
function game(legacy='easy',save=null){
  const storage=new Map(save===null?[]:[['zombieSurvivalWorldStage',save]]),c={selectedDifficulty:legacy,Image:class{},backgroundImage:{complete:true,naturalWidth:1280,naturalHeight:853},setGameImageSource:(image,src)=>Object.assign(image,{assetSource:src}),ensureGameImage:image=>image};
  c.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};vm.createContext(c);vm.runInContext(source,c);return{c,storage,run:s=>vm.runInContext(s,c)};
}
test('legacy easy/medium/hard saves become World 2 stages without losing their balance',()=>{
  for(const [tier,stage] of [['easy','2-1'],['medium','2-2'],['hard','2-3']]){const g=game(tier);assert.equal(g.run('getWorldStageLabel()'),stage);assert.equal(g.c.selectedDifficulty,tier);}
});
test('all nine stages persist their identity and only World 2 retains medium and hard profiles',()=>{
  const g=game();
  for(const world of [1,2,3])for(const [i,tier] of ['easy','medium','hard'].entries()){
    assert.equal(g.run(`selectWorldStage(${world},'${tier}')`),true);assert.equal(g.run('getWorldStageLabel()'),`${world}-${i+1}`);
    const expected=world===2?tier:'easy';assert.equal(g.c.selectedDifficulty,expected);
    const reload=game(expected,g.storage.get('zombieSurvivalWorldStage'));assert.equal(reload.run('getWorldStageLabel()'),`${world}-${i+1}`);assert.equal(reload.c.selectedDifficulty,expected);
  }
});
test('invalid selections and malformed saves cannot create an undefined balance',()=>{
  for(const save of ['{broken','null','{"world":9,"tier":"hard"}','{"world":1,"tier":"nightmare"}']){const g=game('medium',save);assert.equal(g.run('getWorldStageLabel()'),'2-2');assert.equal(g.c.selectedDifficulty,'medium');}
  const g=game();for(const [world,tier] of [[0,'easy'],[3,'unknown'],['1','hard']]){g.c.badWorld=world;g.c.badTier=tier;assert.equal(g.run('selectWorldStage(badWorld,badTier)'),false);assert.equal(g.run('getWorldStageLabel()'),'2-1');}
  g.c.localStorage.setItem=()=>{throw Error('quota');};assert.equal(g.run("selectWorldStage(3,'hard')"),true);assert.equal(g.run('getWorldStageLabel()'),'3-3');assert.equal(g.c.selectedDifficulty,'easy');
});
test('each world uses its own image with one cached Image per new map',()=>{
  const g=game();assert.equal(g.run('getWorldBackgroundImage(1)'),g.c.backgroundImage);
  assert.equal(g.run('getWorldBackgroundImage(2).assetSource'),'assets/worlds-v1/world-2-quarantine.webp');assert.equal(g.run('getWorldBackgroundImage(3).assetSource'),'assets/worlds-v1/world-3-origin.webp');
  assert.equal(g.run('getWorldBackgroundImage(2)===getWorldBackgroundImage(2)'),true);
  const calls=[];Object.assign(g.c,{ctx:new Proxy({drawImage:(...args)=>calls.push(args)},{get:(o,k)=>o[k]||(()=>{})}),canvas:{width:800,height:400},WORLD:{width:4000,height:4000},camera:{x:1200,y:1400},getCameraViewWidth:()=>800,getCameraViewHeight:()=>400,backgroundLoaded:true,astraBackdropProgress:()=>0,drawAstraUltimateBackdrop(){}});
  const render=fs.readFileSync(path.join(root,'js/07-world-render.js'),'utf8');g.run(render.slice(render.indexOf('function drawBackground()'),render.indexOf('function drawFireTrails()')));
  for(const world of [1,2,3]){g.run(`selectWorldStage(${world},'hard');Object.assign(getWorldBackgroundImage(),{complete:true,naturalWidth:1536,naturalHeight:1024});drawBackground()`);assert.equal(calls.at(-1)[0],g.run('getWorldBackgroundImage()'));assert.ok(calls.at(-1).slice(1).every(Number.isFinite));}
});
