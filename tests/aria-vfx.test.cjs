const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');

function scene(loaded=true,paths=false){
  let depth=0,surfaces=0,operations=0,frameGradients=0,pathAllocations=0;
  const images=[],gleams=[],arcs=[],calls={};
  function context(track=false){
    const stack=[],state={globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,lineCap:'butt',shadowBlur:0,lineDashOffset:0};
    let transform=[1,0,0,1,0,0];
    const finite=(key,args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${key} received ${value}`);};
    const point=(x,y)=>({x:transform[0]*x+transform[2]*y+transform[4],y:transform[1]*x+transform[3]*y+transform[5]});
    return new Proxy(state,{
      get(o,key){
        if(key in o)return o[key];
        if(key==='point')return point;
        if(key==='save')return()=>{stack.push({state:{...o},transform:transform.slice()});if(track)depth++;};
        if(key==='restore')return()=>{const saved=stack.pop();assert.ok(saved,'unmatched restore');for(const k of Object.keys(o))delete o[k];Object.assign(o,saved.state);transform=saved.transform;if(track)depth--;};
        if(key==='translate')return(x,y)=>{finite(key,[x,y]);const p=point(x,y);transform[4]=p.x;transform[5]=p.y;};
        if(key==='rotate')return(angle)=>{finite(key,[angle]);const c=Math.cos(angle),s=Math.sin(angle),[a,b,d,e]=transform;transform[0]=a*c+d*s;transform[1]=b*c+e*s;transform[2]=d*c-a*s;transform[3]=e*c-b*s;};
        if(key==='createLinearGradient'||key==='createRadialGradient')return(...args)=>{finite(key,args);if(track)frameGradients++;return{addColorStop(){}};};
        return(...args)=>{finite(key,args);if(track){operations++;calls[key]=(calls[key]||0)+1;if(key==='drawImage')images.push({args,alpha:o.globalAlpha,origin:point(0,0)});if(key==='arc')arcs.push({args,origin:point(0,0),composite:o.globalCompositeOperation});}if(key==='arc')assert.ok(args[2]>=0,'nonnegative arc radius');};
      },
      set(o,key,value){finite(key,[value]);if(key==='globalAlpha')assert.ok(value>=0&&value<=1,`alpha ${value}`);o[key]=value;return true;}
    });
  }
  const ctx=context(true);
  const c={console,Math,performance:{now:()=>1234},ctx,selectedCharacter:'aria',player:{x:500,y:400},camera:{x:0,y:0},zombies:[],
    ariaGrowth:{essence:0,stage:0,visualStage:0,frame:0,treeX:640,treeY:500},ariaWorldTree:null,ariaEffects:[],ariaBolts:[],ariaBlooms:[],ariaSpirits:[],
    getCameraViewWidth:()=>1280,getCameraViewHeight:()=>720,
    Image:class{constructor(){this.complete=loaded;this.naturalWidth=loaded?1536:0;this.naturalHeight=loaded?1024:0;}},
    setGameImageSource:(im,src)=>Object.assign(im,{src}),ensureGameImage:im=>im,
    document:{createElement(){surfaces++;return{getContext:()=>context()};}},
    worldStart(){ctx.save();},worldEnd(){ctx.restore();},gleams,
    ariaPetal(x,y,size,angle,alpha){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.ellipse(0,0,size*.4,size,0,0,Math.PI*2);ctx.fill();ctx.restore();}};
  c.getAriaTreePosition=()=>({x:c.ariaGrowth.treeX,y:c.ariaGrowth.treeY});
  c.getAriaTreeAttackRange=()=>600;
  if(paths)c.Path2D=class{constructor(){pathAllocations++;}arc(...args){this.arcArgs=args;}};
  vm.createContext(c);const run=s=>vm.runInContext(s,c);
  run(fs.readFileSync(path.join(root,'js/20-aria-vfx.js'),'utf8'));
  return{c,images,gleams,arcs,calls,run,depth:()=>depth,surfaces:()=>surfaces,operations:()=>operations,gradients:()=>frameGradients,paths:()=>pathAllocations};
}
function populate(g){
  g.c.ariaGrowth={essence:800,stage:3,visualStage:2.7,frame:125,treeX:700,treeY:500,shield:30,shieldTime:200};
  g.c.ariaWorldTree={x:700,y:500,r:650,life:630,maxLife:720,age:90};
  g.c.ariaBlooms=[{x:500,y:450,r:230,life:150,maxLife:180,age:30,phase:1}];
  g.c.ariaBolts=['petal','echo'].map((type,i)=>({type,x:500+i*90,y:320,px:495,py:320,angle:i*.2,life:80,maxLife:120}));
  g.c.ariaSpirits=[{type:'spirit',x:650,y:350,angle:1,life:100,maxLife:180}];
  g.c.zombies=[{x:800,y:400,r:18,hp:100,ariaMarkTime:180,ariaInfection:{life:320,maxLife:360}}];
  g.c.ariaEffects=['thornLance','parasiticBloom','harvest','treeRoot','treeEcho','worldTreeCast','worldTreeFinal','essence','growth','infectionBurst','petalHit'].map((type,i)=>({type,x:500+i%3*60,y:400+Math.floor(i/3)*40,tx:750,ty:450,r:type.startsWith('worldTree')?650:120,length:600,width:24,angle:.2,life:30,maxLife:60,amount:2}));
}
test('new Aria combat VFX keep finite geometry and restore canvas state',()=>{
  const g=scene();populate(g);g.run('drawAriaRoyalEffects()');
  assert.ok(g.operations()>500);assert.equal(g.depth(),0);assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');
  assert.equal(g.c.ctx.lineDashOffset,0);assert.equal(g.c.ctx.lineWidth,1);assert.equal(g.gradients(),0);
  for(const kind of ['thorn','bloom','petal'])assert.ok(g.images.some(call=>call.args[0]===g.run('ariaSpellArt.'+kind)),kind+' sprite missing');
});
test('permanent seedling remains at map center when Aria moves and without an ultimate',()=>{
  const g=scene();g.run('drawAriaRoyalEffects()');
  let trees=g.images.filter(call=>call.args[0]===g.run('ariaTreeGrowthImage'));
  assert.equal(trees.length,1);assert.deepEqual(trees[0].origin,{x:640,y:500});
  g.c.player.x=1100;g.c.player.y=200;g.run('drawAriaRoyalEffects()');
  trees=g.images.filter(call=>call.args[0]===g.run('ariaTreeGrowthImage'));
  assert.equal(trees.length,2);assert.deepEqual(trees[1].origin,trees[0].origin);assert.equal(g.c.ariaWorldTree,null);
});
test('growth cross-fades distinct branches while preserving a common root anchor',()=>{
  const g=scene();g.c.ariaGrowth.visualStage=3;g.run('drawAriaRoyalEffects()');
  const trees=g.images.filter(call=>call.args[0]===g.run('ariaTreeGrowthImage'));
  assert.equal(trees.length,2);assert.equal(trees[0].args[1],512);assert.equal(trees[1].args[1],1024);
  assert.equal(trees[0].alpha,.48);assert.equal(trees[1].alpha,.48);assert.deepEqual(trees[0].origin,trees[1].origin);
  for(const tree of trees)assert.ok(Math.abs(tree.args[6]+tree.args[8]*.92)<1e-8);
  g.c.ariaGrowth.visualStage=8;g.c.ariaWorldTree={age:90,life:600};assert.equal(g.run('ariaTreeVisualState().h'),324);
  g.c.getCameraViewHeight=()=>390;assert.ok(Math.abs(g.run('ariaTreeVisualState().h')-175.5)<1e-8);
});
test('birth, transition and expiry frames remain safe at every growth stage',()=>{
  const g=scene();populate(g);
  for(const stage of [0,.01,.5,1,1.99,2,2.5,3,3.99,4,4.5,5,5.99,6,6.5,7,7.99,8])for(const fraction of [0,.001,.5,.999,1]){
    g.c.ariaGrowth.visualStage=stage;
    for(const e of [...g.c.ariaEffects,...g.c.ariaBlooms,g.c.ariaWorldTree]){e.life=e.maxLife*(1-fraction);e.age=e.maxLife*fraction;}
    g.run('drawAriaRoyalEffects()');assert.equal(g.depth(),0);
  }
});

test('nine growth stages keep increasing in height and retain the original final size',()=>{
  const g=scene(),heights=[];
  for(let stage=0;stage<=8;stage++){
    g.c.ariaGrowth.visualStage=stage;
    const v=g.run('ariaTreeVisualState()');heights.push(v.h);
    assert.equal(v.stage,stage);assert.equal(v.artLow,Math.floor(stage/2));
    g.run('ariaDrawPermanentTree()');assert.equal(g.depth(),0);
  }
  assert.equal(new Set(heights).size,9);
  for(let n=1;n<heights.length;n++)assert.ok(heights[n]>heights[n-1]);
  assert.equal(heights[8],570*.54);
  for(const stage of [1,2,3,4,5,6,7]){
    g.c.ariaGrowth.visualStage=stage-.0001;const before=g.run('ariaTreeVisualState().h');
    g.c.ariaGrowth.visualStage=stage+.0001;const after=g.run('ariaTreeVisualState().h');
    assert.ok(Math.abs(after-before)<.001,'height must not jump across a growth stage');
  }
});

test('subtle range contour uses the actual combat radius and fixed tree center without a filled disc',()=>{
  const g=scene();g.c.ariaGrowth.frame=125;g.run('ariaDrawTreeRange()');
  assert.ok(g.arcs.filter(arc=>arc.args[2]===600).length>=9);
  for(const arc of g.arcs){assert.deepEqual(arc.origin,{x:640,y:500});assert.equal(arc.composite,'source-over');}
  assert.equal(g.calls.fill||0,0);assert.equal(g.calls.fillRect||0,0);assert.equal(g.calls.ellipse||0,0);assert.equal(g.gradients(),0);assert.equal(g.surfaces(),0);assert.equal(g.depth(),0);
  const before=g.arcs.length;g.c.player.x=1100;g.c.player.y=200;g.c.getAriaTreeAttackRange=()=>480;g.run('ariaDrawTreeRange()');
  assert.ok(g.arcs.slice(before).some(arc=>arc.args[2]===480));
  for(const arc of g.arcs.slice(before))assert.deepEqual(arc.origin,{x:640,y:500});
});

test('range edge remains visible with its tree offscreen and skips a viewport wholly inside the ring',()=>{
  const edge=scene();edge.c.ariaGrowth.treeX=-500;edge.c.ariaGrowth.treeY=360;edge.run('drawAriaRoyalEffects()');
  assert.ok(edge.arcs.some(arc=>arc.args[2]===600));assert.equal(edge.images.length,0);assert.equal(edge.surfaces(),0);assert.equal(edge.depth(),0);
  const inside=scene();inside.c.camera={x:500,y:350};inside.c.getCameraViewWidth=()=>180;inside.c.getCameraViewHeight=()=>180;inside.run('ariaDrawTreeRange()');
  assert.equal(inside.operations(),0);assert.equal(inside.surfaces(),0);
  const outside=scene();outside.c.ariaGrowth.treeX=-650;outside.run('ariaDrawTreeRange()');assert.equal(outside.operations(),0);
});

test('range path and simulation-time highlights remain cached and stable while paused',()=>{
  const g=scene(true,true);g.c.ariaGrowth.frame=100;g.run('ariaDrawTreeRange()');
  assert.equal(g.paths(),1);const snapshot=JSON.stringify(g.arcs),before=g.arcs.length;
  g.run('ariaDrawTreeRange()');assert.equal(g.paths(),1);assert.equal(JSON.stringify(g.arcs.slice(before)),snapshot);
  g.run('for(let n=0;n<60;n++)ariaDrawTreeRange()');assert.equal(g.paths(),1);assert.equal(g.surfaces(),0);assert.equal(g.gradients(),0);
  g.c.getAriaTreeAttackRange=()=>480;g.run('ariaDrawTreeRange()');assert.equal(g.paths(),2);assert.equal(g.run('ariaTreeRangePath.arcArgs[2]'),480);assert.equal(g.depth(),0);
});

test('devoured enemy snapshots curve into the fixed root using their original sprite without combat mutation',()=>{
  const g=scene(),enemy={x:1100,y:450,tx:640,ty:500,r:18,boss:false,phase:.8,age:12,life:42,maxLife:54};
  g.c.zombieSpriteAtlas={complete:true,naturalWidth:512,naturalHeight:256};g.c.ariaDevouredEnemies=[enemy];
  const snapshot=JSON.stringify(enemy);g.run('ariaDrawDevouredEnemies()');
  const sprite=g.images.find(call=>call.args[0]===g.c.zombieSpriteAtlas);assert.ok(sprite);assert.equal(sprite.args[1],0);assert.equal(sprite.args[3],256);
  assert.ok(sprite.origin.x<enemy.x&&sprite.origin.x>enemy.tx);assert.equal(JSON.stringify(enemy),snapshot);assert.equal(g.depth(),0);assert.equal(g.gradients(),0);
  let previousDistance=Infinity,previousSize=Infinity;
  for(const life of [54,48,40,30,20,10,1]){
    enemy.life=life;const v=g.run('ariaDevourVisualState(ariaDevouredEnemies[0])'),distance=Math.hypot(v.x-enemy.tx,v.y-enemy.ty);
    assert.ok(distance<=previousDistance+1e-8);assert.ok(v.scale<=previousSize);previousDistance=distance;previousSize=v.scale;
    g.run('ariaDrawDevouredEnemies()');assert.equal(g.depth(),0);
  }
  assert.equal(previousDistance,0);assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');
});

test('devouring supports minion and raid sprites, fallback art, paused state and bounded culling',()=>{
  const g=scene(),enemy={x:1100,y:450,tx:640,ty:500,r:18,phase:.3,life:35,maxLife:54};
  g.c.zombieSpriteAtlas={complete:true,naturalWidth:512,naturalHeight:256};
  g.c.raidBossImages=Array.from({length:3},()=>({complete:true,naturalWidth:256,naturalHeight:256}));
  g.c.ariaDevouredEnemies=[{...enemy,isBossMinion:true},{...enemy,isRaidBoss:true,raidIndex:2,facing:-1}];
  const before=JSON.stringify(g.c.ariaDevouredEnemies);g.run('ariaDrawDevouredEnemies()');
  assert.ok(g.images.some(call=>call.args[0]===g.c.raidBossImages[1]));assert.ok(g.images.some(call=>call.args[0]===g.c.raidBossImages[2]));
  const count=g.images.length,snapshot=g.images.map(call=>call.args.slice(1));g.run('ariaDrawDevouredEnemies()');
  assert.deepEqual(g.images.slice(count).map(call=>call.args.slice(1)),snapshot);assert.equal(JSON.stringify(g.c.ariaDevouredEnemies),before);assert.equal(g.depth(),0);
  const bounded=scene();bounded.c.ariaDevouredEnemies=Array(32).fill(enemy);bounded.run('ariaDrawDevouredEnemies()');const cost=bounded.operations();
  bounded.c.ariaDevouredEnemies=Array(320).fill(enemy);bounded.run('ariaDrawDevouredEnemies()');assert.equal(bounded.operations(),cost*2);assert.equal(bounded.gradients(),0);assert.equal(bounded.depth(),0);
  const off=scene();off.c.ariaDevouredEnemies=[{...enemy,x:5000,y:5000,tx:5500,ty:5500}];off.run('ariaDrawDevouredEnemies()');assert.equal(off.operations(),0);assert.equal(off.surfaces(),0);
});
test('cached textures and paused growth animation never change live combat state',()=>{
  for(const loaded of [true,false]){
    const g=scene(loaded);populate(g);const snapshot='JSON.stringify([ariaGrowth,ariaBolts,ariaBlooms,ariaSpirits,ariaWorldTree,ariaEffects,zombies])',before=g.run(snapshot);
    g.run('drawAriaRoyalEffects()');const surfaces=g.surfaces();assert.ok(surfaces>=1&&surfaces<=2);
    const state=g.run('JSON.stringify(ariaTreeVisualState())');
    g.run('for(let frame=0;frame<30;frame++)drawAriaRoyalEffects()');
    assert.equal(g.surfaces(),surfaces);assert.equal(g.run(snapshot),before);assert.equal(g.run('JSON.stringify(ariaTreeVisualState())'),state);assert.equal(g.gradients(),0);assert.equal(g.depth(),0);
  }
});
test('offscreen tree and combat objects skip texture allocation and drawing',()=>{
  const g=scene();populate(g);g.c.ariaGrowth.treeX=5000;g.c.ariaGrowth.treeY=5000;g.c.ariaGrowth.shield=0;
  for(const e of [...g.c.ariaEffects,...g.c.ariaBlooms,...g.c.ariaBolts,...g.c.ariaSpirits,...g.c.zombies,g.c.ariaWorldTree]){e.x=5000;e.y=5000;e.tx=5500;e.ty=5500;}
  g.run('drawAriaRoyalEffects()');assert.equal(g.surfaces(),0);assert.equal(g.images.length,0);assert.equal(g.operations(),0);assert.equal(g.depth(),0);
});
test('roots and Q stay visible when an offscreen source targets an onscreen enemy',()=>{
  const g=scene();g.c.ariaGrowth.treeX=-2000;g.c.ariaEffects=[{type:'treeRoot',x:-500,y:300,tx:500,ty:300,r:10,life:20,maxLife:60},{type:'thornLance',x:-500,y:400,angle:0,length:900,width:24,life:20,maxLife:60}];
  g.run('drawAriaRoyalEffects()');assert.ok(g.operations()>60);assert.ok(g.images.some(call=>call.args[0]===g.run('ariaSpellArt.thorn')));assert.equal(g.depth(),0);
});
test('tree fallback stays visible while art loads and particle costs remain bounded',()=>{
  const missing=scene(false);missing.run('drawAriaRoyalEffects()');assert.ok(missing.calls.stroke>=15);assert.ok(missing.images.length>0);assert.equal(missing.depth(),0);
  const g=scene();g.c.ariaGrowth.treeX=5000;g.c.ariaGrowth.treeY=5000;
  const bolt={type:'petal',x:500,y:350,angle:0,life:100,maxLife:120};g.c.ariaBolts=Array(90).fill(bolt);g.run('drawAriaRoyalEffects()');const bounded=g.operations();
  g.c.ariaBolts=Array(900).fill(bolt);g.run('drawAriaRoyalEffects()');assert.equal(g.operations(),bounded*2);
});
test('other characters skip Aria effects and texture creation',()=>{
  const g=scene();populate(g);g.c.selectedCharacter='mare';g.run('drawAriaRoyalEffects()');assert.equal(g.surfaces(),0);assert.equal(g.operations(),0);assert.equal(g.depth(),0);
});
