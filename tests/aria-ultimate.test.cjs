const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene({loaded=true,mobile=false,width=1280,height=760}={}){
  const calls=[],stack=[],images=[],state={globalAlpha:.7,globalCompositeOperation:'lighter',lineWidth:2,shadowBlur:6};
  const ctx=new Proxy(state,{get(o,key){
    if(key in o)return o[key];
    if(key==='save')return()=>stack.push({...o});
    if(key==='restore')return()=>{const saved=stack.pop();assert.ok(saved,'unmatched restore');for(const key of Object.keys(o))delete o[key];Object.assign(o,saved);};
    return(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),`${key} received ${v}`);calls.push({method:key,args,alpha:o.globalAlpha});if(key.startsWith('create'))return{addColorStop(){}};};
  }});
  class Image{constructor(){this.complete=loaded;this.naturalWidth=loaded?1672:0;this.naturalHeight=loaded?941:0;images.push(this);}}
  const c={Math,Image,ctx,canvas:{width,height},selectedCharacter:'aria',screenMode:'game',paused:false,choosingUpgrade:false,gameOver:false,raidVictory:false,
    player:{hp:100,ariaUltimateTime:720,mareUltimateTime:200},ariaWorldTree:{x:500,y:500,r:520,age:0,life:720,maxLife:720},oblivionBackdropTime:200,
    backgroundLoaded:true,backgroundImage:{naturalWidth:2000,naturalHeight:2000},camera:{x:300,y:200},WORLD:{width:4000,height:4000},
    getCameraViewWidth:()=>width,getCameraViewHeight:()=>height,getWorldViewScale:()=>1,astraBackdropProgress:()=>0,drawAstraUltimateBackdrop(){},isMobileTouchDevice:()=>mobile,isMobilePortraitMode:()=>false,
    drawHeroUltimatePortrait(){calls.push({method:'basePortrait',args:[]});},resetAriaRework(){c.ariaWorldTree=null;c.player.ariaUltimateTime=0;calls.push({method:'baseReset',args:[]});}};
  vm.createContext(c);const run=source=>vm.runInContext(source,c);
  for(const name of ['00-assets','07-hero-ultimate-background','07-world-render','21-aria-ultimate'])run(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'));
  if(loaded)run('ariaUltimateArt.portrait.naturalWidth=1280;ariaUltimateArt.portrait.naturalHeight=853');
  return{c,calls,stack,images,state,run,age(age){c.ariaWorldTree.age=age;c.ariaWorldTree.life=720-age;c.player.ariaUltimateTime=720-age;},ready(kind){run(`Object.assign(ariaUltimateArt.${kind},{complete:true,naturalWidth:${kind==='portrait'?1280:1672},naturalHeight:${kind==='portrait'?853:941}})`);}};
}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);}
function imageCalls(g){return g.calls.filter(c=>c.method==='drawImage');}

test('world-tree background follows all 720 frames with smooth entry and exit',()=>{
  const g=scene();
  for(const [age,expected]of [[0,0],[18,.5],[36,1],[120,1],[360,1],[660,1],[690,.5],[720,0]]){g.age(age);near(g.run('heroUltimateBackdropProgress()'),expected);}
  g.age(48);assert.equal(g.run('heroUltimateBackdropLife()'),672);
});
test('normal map remains during fades and is omitted only while the complete Aria background covers it',()=>{
  const g=scene();
  for(const [age,count]of [[0,1],[18,2],[36,1],[360,1],[690,2],[720,1]]){
    g.age(age);g.calls.length=0;g.run('drawBackground()');const rendered=imageCalls(g);assert.equal(rendered.length,count,`age ${age}`);
    if(age===36||age===360)assert.equal(rendered[0].args[0],g.run('ariaUltimateArt.background'));else assert.equal(rendered[0].args[0],g.c.backgroundImage);
  }
});
test('background covers PC and phone viewports without distortion, allocation or combat mutation',()=>{
  for(const [width,height]of [[1920,1080],[1280,760],[844,390],[568,320]]){
    const g=scene({width,height}),canvasState={...g.state};g.age(60);const combat=JSON.stringify([g.c.player,g.c.ariaWorldTree]),count=g.images.length;g.run('drawAriaUltimateBackdrop()');
    const [image,x,y,w,h]=imageCalls(g)[0].args;assert.ok(x<=0&&y<=0&&w>=width&&h>=height);near(w/h,image.naturalWidth/image.naturalHeight);
    for(let i=0;i<10;i++)g.run('drawAriaUltimateBackdrop();drawAriaUltimatePortrait()');assert.equal(g.images.length,count);assert.equal(JSON.stringify([g.c.player,g.c.ariaWorldTree]),combat);assert.deepEqual(g.state,canvasState);assert.equal(g.stack.length,0);
  }
});
test('portrait is a two-second upper-right triangle with the entire generated face inside on desktop and mobile',()=>{
  for(const [width,height,mobile]of [[1920,1080,false],[1280,760,false],[1280,400,false],[1366,768,true],[844,390,true],[568,320,true]]){
    const g=scene({width,height,mobile});g.age(30);const b=g.run('getAriaUltimatePortraitLayout(30)'),face={left:b.imageX+b.imageW*.58,right:b.imageX+b.imageW*.80,top:b.imageY+b.imageH*.24,bottom:b.imageY+b.imageH*.48};
    assert.ok(face.left>=b.x&&face.right<=width&&face.top>=0,'face stays inside viewport');assert.ok(face.bottom<=b.h*(face.left-b.x)/b.w,'entire face stays above diagonal');
    g.run('drawHeroUltimatePortrait()');assert.equal(imageCalls(g).length,1);assert.deepEqual(g.calls.find(c=>c.method==='moveTo').args,[b.x,0]);assert.ok(g.calls.some(c=>c.method==='lineTo'&&c.args[0]===width&&c.args[1]===b.h));
    if(mobile){assert.ok(b.w<=width*.46);assert.ok(b.h<=100);}assert.equal(g.stack.length,0);
    g.age(120);g.calls.length=0;g.run('drawHeroUltimatePortrait()');assert.equal(imageCalls(g).length,0);
  }
});
test('pause freezes visual timing and cut-in never covers pause, upgrade or portrait-orientation controls',()=>{
  const g=scene();g.age(42);const before=g.run('JSON.stringify(getAriaUltimatePortraitState())'),progress=g.run('getAriaUltimateBackdropProgress()');g.run('drawAriaUltimateBackdrop()');const backdrop=g.calls.map(c=>({method:c.method,args:c.args,alpha:c.alpha}));
  g.c.paused=true;assert.equal(g.run('JSON.stringify(getAriaUltimatePortraitState())'),before);assert.equal(g.run('getAriaUltimateBackdropProgress()'),progress);g.calls.length=0;g.run('drawAriaUltimateBackdrop()');assert.deepEqual(g.calls,backdrop);g.calls.length=0;g.run('drawHeroUltimatePortrait()');assert.equal(g.calls.length,0);
  g.c.paused=false;g.c.choosingUpgrade=true;g.run('drawHeroUltimatePortrait()');assert.equal(g.calls.length,0);g.c.choosingUpgrade=false;g.c.isMobilePortraitMode=()=>true;g.run('drawHeroUltimatePortrait()');assert.equal(g.calls.length,0);g.c.isMobilePortraitMode=()=>false;g.run('drawHeroUltimatePortrait()');assert.equal(imageCalls(g).length,1);
});
test('late assets fade in on simulation time and do not replay the portrait after its cast window',()=>{
  const g=scene({loaded:false});assert.equal(g.run('getAriaUltimateBackdropProgress()'),0);assert.equal(g.run('getAriaUltimatePortraitState()'),null);g.age(180);g.ready('background');g.ready('portrait');assert.equal(g.run('getAriaUltimateBackdropProgress()'),0);assert.equal(g.run('getAriaUltimatePortraitState()'),null);g.age(198);near(g.run('getAriaUltimateBackdropProgress()'),.5);g.age(216);near(g.run('getAriaUltimateBackdropProgress()'),1);
  const early=scene({loaded:false});early.run('getAriaUltimatePortraitState()');early.age(30);early.ready('portrait');near(early.run('getAriaUltimatePortraitState().alpha'),0);early.age(48);near(early.run('getAriaUltimatePortraitState().alpha'),1);
});
test('match end, menus and reset clear Aria presentation, while every other hero keeps its original hooks',()=>{
  const g=scene();g.age(48);
  for(const flag of ['gameOver','raidVictory']){g.c[flag]=true;assert.equal(g.run('getAriaUltimateBackdropProgress()'),0);assert.equal(g.run('getAriaUltimatePortraitState()'),null);g.c[flag]=false;}
  g.c.player.hp=0;assert.equal(g.run('getAriaUltimateBackdropProgress()'),0);g.c.player.hp=100;
  for(const screen of ['home','character','guide','mobileSettings']){g.c.screenMode=screen;assert.equal(g.run('getAriaUltimateBackdropProgress()'),0);assert.equal(g.run('getAriaUltimatePortraitState()'),null);}g.c.screenMode='game';
  g.run('resetAriaRework()');assert.equal(g.run('ariaUltimateVisual.tree'),null);assert.equal(g.c.ariaWorldTree,null);assert.equal(g.c.player.ariaUltimateTime,0);assert.equal(g.calls.filter(c=>c.method==='baseReset').length,1);
  for(const id of ['mare','oblivion','astra','lush']){g.c.selectedCharacter=id;assert.equal(g.run('heroUltimateBackdropProgress()'),g.run('ariaUltimateBackdropProgressBase()'));g.calls.length=0;g.run('drawHeroUltimatePortrait()');assert.equal(g.calls.filter(c=>c.method==='basePortrait').length,1);}
});
test('ultimate images are registered once and prewarm only for selected Aria at home',()=>{
  const g=scene();g.c.screenMode='home';g.c.selectedCharacter='ren';g.run('prepareGameImages()');assert.equal(g.run('ariaUltimateArt.background.assetRequested'),undefined);assert.equal(g.run('ariaUltimateArt.portrait.assetRequested'),undefined);
  g.c.selectedCharacter='aria';g.run('prepareGameImages()');assert.equal(g.run('ariaUltimateArt.background.assetRequested'),true);assert.equal(g.run('ariaUltimateArt.portrait.assetRequested'),true);assert.equal(g.run('ariaUltimateArt.background.assetGroup'),'aria');assert.equal(g.run('ariaUltimateArt.portrait.assetGroup'),'aria');
  assert.equal(g.run('gameImageRegistry.filter(image=>/aria-v[23]\\/ultimate-/.test(image.assetSource)).length'),2);
});
