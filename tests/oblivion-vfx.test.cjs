const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/14-oblivion-vfx.js'),'utf8');
function scene(loaded=true){
  let depth=0,surfaces=0,operations=0,screenGradients=0;const images=[],geometry=[];
  function context(track=false){
    const stack=[],values={globalAlpha:1,globalCompositeOperation:'source-over',shadowBlur:0};
    return new Proxy(values,{get(o,k){
      if(k in o)return o[k];
      if(k==='save')return()=>{stack.push({...o});if(track)depth++;};
      if(k==='restore')return()=>{const prior=stack.pop();assert.ok(prior,'balanced restore');Object.assign(o,prior);if(track)depth--;};
      if(k==='createRadialGradient'||k==='createLinearGradient')return()=>{if(track)screenGradients++;return{addColorStop(){}};};
      return(...args)=>{operations++;for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${k}: ${value}`);if(track&&k==='drawImage')images.push({args,alpha:o.globalAlpha,composite:o.globalCompositeOperation});if(track&&(k==='moveTo'||k==='lineTo'||k==='translate'))geometry.push([k,...args]);};
    },set(o,k,v){if(typeof v==='number')assert.ok(Number.isFinite(v),`${k}: ${v}`);if(k==='shadowBlur')assert.equal(v,0,'frame rendering must not enable expensive blur');o[k]=v;return true;}});
  }
  const image=()=>({complete:loaded,naturalWidth:loaded?768:0,naturalHeight:1024}),ctx=context(true);
  const state={frame:150,gauge:80,empowered:true,ultimateTime:570,ultimateMax:600,formBlend:1,lastAngle:.2,avatarPulse:12,avatarX:440,avatarY:440,shield:30,projectiles:[],casts:[],effects:[]};
  const c={Math,console,Map,Float64Array,ctx,oblivionState:state,selectedCharacter:'oblivion',screenMode:'game',player:{x:500,y:500,invincibleTime:0},camera:{x:0,y:0},canvas:{width:1280,height:760},paused:false,choosingUpgrade:false,gameOver:false,raidVictory:false,isMobileTouchDevice:()=>false,oblivionSprite:image(),oblivionCombatArt:{monster:image()},heroUltimateBackdrops:{oblivion:image()},ensureGameImage:im=>im,getWorldViewScale:()=>1,worldStart(){ctx.save();},worldEnd(){ctx.restore();},document:{createElement(){surfaces++;return{getContext:()=>context()};}}};
  vm.createContext(c);vm.runInContext(source,c);
  return{c,state,images,geometry,run:s=>vm.runInContext(s,c),depth:()=>depth,surfaces:()=>surfaces,operations:()=>operations,gradients:()=>screenGradients};
}
function populate(g){
  g.state.projectiles=[{x:600,y:400,a:.2,r:13,trail:Array.from({length:10},(_,i)=>({x:450+i*15,y:400-i*2}))}];
  const lines=[-.2,0,.2].map(a=>({x1:300,y1:500,x2:300+Math.cos(a)*1000,y2:500+Math.sin(a)*1000}));
  g.state.casts=[{kind:'tear',x:300,y:500,a:0,age:18,closeAt:26,maxLife:68,width:56,lines,empowered:true},{kind:'grasp',x:650,y:470,a:.2,age:25,impactAt:34,overheadAt:52,maxLife:90,r:255,empowered:true},{kind:'finale',x:200,y:400,a:0,age:20,closeAt:28,maxLife:90,width:180,length:1500}];
  g.state.effects=['shardCast','hit','slash','tearOpen','tearClose','implosion','graspCast','graspImpact','overhead','formOn','formOff','shield','ultimateOpen','avatarEcho','finale'].map((kind,i)=>({kind,x:450+i%4*60,y:320+Math.floor(i/4)*55,r:kind==='slash'?270:180,age:12,maxLife:50,a:.25,empowered:true,echo:i%4===0}));
}
test('all spells and transformed layers preserve finite geometry and canvas state',()=>{
  const g=scene();populate(g);g.run('drawOblivionCombatEffects();drawOblivionCombatPlayer();drawOblivionCombatRealm();drawOblivionCombatPortrait()');
  assert.equal(g.depth(),0);assert.ok(g.operations()>500);assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');assert.equal(g.gradients(),0);
});
test('missing monster and backdrop images retain a complete geometric combat fallback',()=>{
  const g=scene(false);populate(g);assert.equal(g.run('drawOblivionCombatPlayer()'),true);g.run('drawOblivionCombatEffects();drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.depth(),0);assert.ok(g.operations()>500);
});
test('every animation boundary is safe including form reveal, Q closure and third-hand impact',()=>{
  const g=scene();populate(g);
  for(const age of [0,1,10,25,26,27,34,35,51,52,53,68,89,120,600]){
    for(const c of g.state.casts)c.age=age;for(const e of g.state.effects)e.age=age;
    g.state.ultimateTime=600-age;g.state.formBlend=age/600;g.state.avatarPulse=age%17;
    g.run('drawOblivionCombatEffects();drawOblivionCombatPlayer();drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.depth(),0);
  }
});
test('rendering does not mutate combat state or allocate recurring texture surfaces',()=>{
  const g=scene();populate(g);const before=JSON.stringify(g.state);
  g.run('drawOblivionCombatEffects();drawOblivionCombatPlayer();drawOblivionCombatRealm();drawOblivionCombatPortrait()');const warm=g.surfaces();
  g.run('for(let i=0;i<30;i++){drawOblivionCombatEffects();drawOblivionCombatPlayer();drawOblivionCombatRealm();drawOblivionCombatPortrait();}');
  assert.equal(g.surfaces(),warm);assert.ok(warm<=4);assert.equal(JSON.stringify(g.state),before);assert.equal(g.gradients(),0);assert.equal(g.depth(),0);
});
test('enemy hit crowds have bounded drawing work while major attacks remain visible',()=>{
  const g=scene();g.state.ultimateTime=0;g.state.effects=Array.from({length:10000},()=>({kind:'hit',x:500,y:500,r:80,age:8,maxLife:30}));
  g.run('drawOblivionCombatEffects()');const dense=g.operations();
  const few=scene();few.state.ultimateTime=0;few.state.effects=g.state.effects.slice(0,12);few.run('drawOblivionCombatEffects()');
  assert.equal(dense,few.operations());assert.equal(g.depth(),0);
});
test('other characters never load or draw Oblivion combat assets; sealed player uses original draw',()=>{
  const g=scene();populate(g);g.c.selectedCharacter='lush';g.run('drawOblivionCombatEffects();drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.run('drawOblivionCombatPlayer()'),false);assert.equal(g.surfaces(),0);assert.equal(g.operations(),0);
  g.c.selectedCharacter='oblivion';g.state.empowered=false;g.state.ultimateTime=0;g.state.formBlend=0;assert.equal(g.run('drawOblivionCombatPlayer()'),false);
});
test('realm progress uses the 600-frame ultimate with 36-frame entry and 48-frame exit',()=>{
  const g=scene();
  for(const [life,expected] of [[600,0],[582,.5],[564,1],[300,1],[48,1],[24,.5],[0,0]]){
    g.state.ultimateTime=life;assert.equal(g.run('getOblivionCombatRealmProgress()'),expected,`life ${life}`);
  }
  g.state.ultimateTime=300;g.c.paused=true;
  assert.equal(g.run('getOblivionCombatRealmProgress()'),1,'paused realm holds simulation position');
  delete g.c.player;assert.equal(g.run('getOblivionCombatRealmProgress()'),1,'minimal preview without player is safe');
  delete g.c.oblivionState;assert.equal(g.run('getOblivionCombatRealmProgress()'),0,'no combat state is inactive');
});
test('loaded realm is a fully opaque image and covers PC/phone through its drift without stretching',()=>{
  const g=scene(),im=g.c.heroUltimateBackdrops.oblivion;im.naturalWidth=1599;im.naturalHeight=900;
  g.c.ctx.globalAlpha=.61;g.c.ctx.globalCompositeOperation='lighter';
  for(const [width,height] of [[1280,720],[844,390]])for(const life of [564,300,48]){
    g.c.canvas={width,height};g.state.ultimateTime=life;g.images.length=0;g.run('drawOblivionCombatRealm()');
    assert.equal(g.images.length,1);const call=g.images[0],[drawn,x,y,w,h]=call.args;
    assert.equal(drawn,im);assert.equal(call.alpha,1);assert.equal(call.composite,'source-over');
    assert.ok(x<=0&&y<=0&&x+w>=width&&y+h>=height,'drift covers all edges');assert.ok(Math.abs(w/h-im.naturalWidth/im.naturalHeight)<1e-12);
    assert.equal(g.c.ctx.globalAlpha,.61);assert.equal(g.c.ctx.globalCompositeOperation,'lighter');assert.equal(g.depth(),0);
  }
});
test('cold or failed image loads retain the map and never substitute the monster for the human portrait',()=>{
  const g=scene(false);g.state.ultimateTime=540;
  assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.images.length,0);assert.equal(g.operations(),0);
  const human=g.c.oblivionSprite;Object.assign(human,{complete:true,naturalWidth:768,naturalHeight:1152});
  g.run('drawOblivionCombatPortrait()');assert.equal(g.images.length,1);assert.equal(g.images[0].args[0],human,'human cut-in works even while realm art is loading');
  Object.assign(g.c.heroUltimateBackdrops.oblivion,{complete:true,naturalWidth:1599,naturalHeight:900});
  assert.equal(g.run('getOblivionCombatRealmProgress()'),1);g.run('drawOblivionCombatRealm()');assert.equal(g.images.at(-1).args[0],g.c.heroUltimateBackdrops.oblivion);
  delete g.c.heroUltimateBackdrops;assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.depth(),0);
});
test('human face cut-in uses the upper-right triangle, 150-frame lifetime and a 95px phone cap',()=>{
  const g=scene(),human=g.c.oblivionSprite;human.naturalWidth=768;human.naturalHeight=1152;
  for(const mobile of [false,true]){
    g.c.isMobileTouchDevice=()=>mobile;g.c.canvas=mobile?{width:844,height:390}:{width:1280,height:720};g.state.ultimateTime=570;g.images.length=0;g.geometry.length=0;
    g.run('drawOblivionCombatPortrait()');const face=g.images.find(call=>call.args[0]===human);assert.ok(face);assert.ok(!g.images.some(call=>call.args[0]===g.c.oblivionCombatArt.monster));
    const [,x,y,w,h]=face.args;assert.ok(Math.abs(w/h-human.naturalWidth/human.naturalHeight)<1e-12);assert.ok(Math.abs(-x/w-.54)<1e-12);assert.ok(Math.abs(-y/h-.12)<1e-12);
    const expectedHeight=mobile?95:720*.27;assert.ok(g.geometry.some(p=>p[0]==='lineTo'&&p[1]===g.c.canvas.width&&p[2]===expectedHeight));assert.equal(g.depth(),0);
  }
  for(const age of [0,150,151,600]){g.state.ultimateTime=600-age;g.images.length=0;g.run('drawOblivionCombatPortrait()');assert.equal(g.images.length,0,`age ${age}`);}
  g.state.ultimateTime=451;g.images.length=0;g.run('drawOblivionCombatPortrait()');assert.ok(g.images.some(call=>call.args[0]===human&&call.alpha>0&&call.alpha<.01));
});
test('new realm and portrait stop on death, victory, menus, hero changes and inactive ultimates',()=>{
  const g=scene();g.state.ultimateTime=540;
  for(const mode of ['home','character','guide','mobileSettings']){g.c.screenMode=mode;assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');}
  g.c.screenMode='game';
  for(const key of ['gameOver','raidVictory']){g.c[key]=true;assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');g.c[key]=false;}
  g.c.player.hp=0;assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');g.c.player.hp=100;
  g.c.selectedCharacter='mare';assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');g.c.selectedCharacter='oblivion';
  g.state.ultimateTime=0;assert.equal(g.run('getOblivionCombatRealmProgress()'),0);g.run('drawOblivionCombatRealm();drawOblivionCombatPortrait()');assert.equal(g.operations(),0);
  g.state.ultimateTime=540;for(const key of ['paused','choosingUpgrade']){g.c[key]=true;g.run('drawOblivionCombatPortrait()');g.c[key]=false;}assert.equal(g.operations(),0,'cut-in does not cover frozen UI');assert.equal(g.depth(),0);
});
