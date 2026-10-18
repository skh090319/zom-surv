const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene({width=1280,height=760,mobile=false,loaded=true}={}){
  const calls=[],stack=[],surfaces=[],images=[],state={font:'10px Arial',fillStyle:'#fff',textAlign:'left',textBaseline:'alphabetic',globalAlpha:.8,globalCompositeOperation:'source-over',shadowBlur:4};
  function context(target,log,saves){return new Proxy(target,{get(o,k){
    if(k in o)return o[k];
    if(k==='save')return()=>saves.push({...o});
    if(k==='restore')return()=>{assert.ok(saves.length,'unmatched restore');const prior=saves.pop();for(const key of Object.keys(o))delete o[key];Object.assign(o,prior);};
    if(k==='measureText')return text=>({width:[...text].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*(parseFloat(o.font.match(/[\d.]+px/)?.[0])||10)});
    return(...args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${k} ${value}`);log.push({method:k,args,font:o.font});if(k.startsWith('create'))return{addColorStop(){}};};
  }});}
  class Surface{constructor(w,h){this.width=w;this.height=h;this.ctx=context({},[],[]);surfaces.push(this);}getContext(){return this.ctx;}}
  class Image{constructor(){this.complete=loaded;this.naturalWidth=loaded?512:0;this.naturalHeight=loaded?512:0;images.push(this);}}
  const c={Math,Image,OffscreenCanvas:Surface,canvas:{width,height},ctx:context(state,calls,stack),selectedCharacter:'aria',screenMode:'game',wave:2,player:{hp:75,maxHp:100,exp:10,expNeed:50,level:10,damage:20,kills:8,ariaUltimateTime:0,ariaQCooldown:15,ariaECooldown:30,ariaXCooldown:45,ariaRCooldown:90},ariaSoils:[{stage:1},{stage:2}],ariaJudgments:[],ariaPetalStorm:null,ariaWorldTree:null,ariaGardenCount:()=>1,ARIA_Q_CD:270,ARIA_E_CD:420,ARIA_X_CD:540,ARIA_R_CD:1500,ariaSkillIconAtlas:new Image(),characterSkillGuide:{},characterSkillVideoKeys:{},mobileControlSettings:{hud:{}},
    addEventListener(){},setGameImageSource(im,source){im.assetSource=source;return im;},ensureGameImage(im){if(im)im.assetRequested=true;return im;},isMobileTouchDevice:()=>mobile,drawMobileIcon(...args){calls.push({method:'icon',args});},drawCooldownCover(...args){calls.push({method:'cooldown',args});}};
  for(const name of ['updateAria','drawAriaInterface','drawHealthBar','drawExpBar','drawMobileCharacterResource','drawHUD','drawCharacterGameplayPreview'])c[name]=(...args)=>calls.push({method:'base:'+name,args});
  c.getMobileHudBounds=id=>({x:640,y:30,w:520,h:32,id});
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js/08-mobile-settings.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'js/20-aria-prestige.js'),'utf8'),c);
  return{c,calls,images,surfaces,state,stack,run:s=>vm.runInContext(s,c)};
}
function inside(outer,inner){assert.ok(inner.x>=outer.x-1e-6&&inner.y>=outer.y-1e-6&&inner.x+inner.w<=outer.x+outer.w+1e-6&&inner.y+inner.h<=outer.y+outer.h+1e-6,JSON.stringify({outer,inner}));}

test('Aria desktop panel contains portrait and four skills from wide desktop to narrow landscape',()=>{
  for(const [width,height]of [[1920,1080],[1280,760],[800,600],[640,480],[480,320]]){
    const g=scene({width,height}),b=g.run('getAriaDesktopHudLayout()'),before={...g.state};inside({x:0,y:0,w:width,h:height},b);
    inside(b,{x:b.portrait.x-b.portrait.r*1.23,y:b.portrait.y-b.portrait.r*1.23,w:b.portrait.r*2.46,h:b.portrait.r*2.46});
    for(const s of b.skills){inside(b,{x:s.x-s.r*1.23,y:s.y-s.r*1.23,w:s.r*2.46,h:s.r*2.46});inside(b,{x:s.x-s.width/2,y:s.labelY-6,w:s.width,h:12});}
    g.run('drawAriaInterface()');assert.equal(g.calls.filter(c=>c.method==='icon').length,4);assert.equal(g.calls.filter(c=>c.method==='cooldown').length,4);assert.equal(g.stack.length,0);assert.deepEqual(g.state,before);
  }
});
test('Aria mobile resources and bars retain editable HUD position/scale and do not draw desktop skills',()=>{
  for(const [width,height]of [[568,320],[844,390],[1024,768]]){
    const g=scene({width,height,mobile:true}),base=g.run('getMobileHudBounds("resource")');inside({x:0,y:0,w:width,h:height},{x:base.x-base.w/2,y:base.y-base.h/2,w:base.w,h:base.h});
    g.run('drawAriaInterface()');assert.equal(g.calls.length,0);g.run('mobileControlSettings.hud.resource={x:.42,y:.48,scale:1.6}');const settings=g.run('JSON.stringify(mobileControlSettings)');
    g.run('drawMobileEditableHud("resource",drawMobileCharacterResource);drawMobileEditableHud("health",drawHealthBar);drawMobileEditableHud("exp",drawExpBar)');assert.equal(g.stack.length,0);assert.equal(g.run('JSON.stringify(mobileControlSettings)'),settings);assert.ok(g.calls.some(c=>c.method==='scale'&&c.args[0]===1.6));
    assert.ok(base.y+base.h/2<g.run('getMobileHudBounds("exp").y-getMobileHudBounds("exp").h/2'));
  }
});
test('two mobile resource rows stay clear of filigree while the enlarged card remains above EXP',()=>{
  for(const [width,height]of [[568,320],[844,390],[1024,768]]){
    const g=scene({width,height,mobile:true}),b=g.run('getAriaMobileResourceBounds()'),x=b.x-b.w/2,y=b.y-b.h/2,dx=Math.min(30,b.w*.12,b.h*.38),clear={x:x+dx,y:y+18,w:b.w-dx*2,h:b.h-36};
    assert.equal(b.h,68);assert.equal(b.y,height-111);g.run('drawAriaMobileResource()');const rows=g.calls.filter(c=>c.method==='fillText');assert.equal(rows.length,2);
    for(const row of rows){const size=parseFloat(row.font.match(/[\d.]+px/)[0]),width=[...row.args[0]].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*size;inside(clear,{x:row.args[1],y:row.args[2]-size/2,w:width,h:size});}
    assert.ok(y+b.h<g.run('getAriaExpBounds().y-getAriaExpBounds().h/2'));assert.equal(g.stack.length,0);
  }
});
test('non-Aria characters delegate every HUD hook without requesting Aria images',()=>{
  const g=scene();g.c.selectedCharacter='mare';g.run('drawHealthBar();drawExpBar();drawHUD();drawMobileCharacterResource();drawCharacterGameplayPreview("mare",3,"R",0,0,200,200,"#fff");updateAria()');
  for(const method of ['drawHealthBar','drawExpBar','drawHUD','drawMobileCharacterResource','drawCharacterGameplayPreview','updateAria'])assert.equal(g.calls.filter(c=>c.method==='base:'+method).length,1);
  assert.ok(g.images.every(im=>!im.assetRequested));assert.equal(g.run('ariaHudFrame'),0);
});
test('sap fills clamp to health, cache one texture and restore all canvas state',()=>{
  const g=scene(),before={...g.state};g.run('drawAriaSapFlow(10,20,300,24,0)');assert.equal(g.surfaces.length,0);
  for(const ratio of [-1,.01,.5,1,2]){g.calls.length=0;g.run(`drawAriaSapFlow(10,20,300,24,${ratio})`);const rect=g.calls.find(c=>c.method==='rect');if(ratio<0)assert.equal(rect,undefined);else assert.deepEqual(rect.args,[10,20,300*Math.min(1,ratio),24]);}
  assert.equal(g.surfaces.length,1);assert.deepEqual(g.state,before);assert.equal(g.stack.length,0);g.run('updateAria()');assert.equal(g.run('ariaHudFrame'),1);
});
test('unloaded assets have finite fallback controls and never modify combat state',()=>{
  const g=scene({loaded:false}),before=g.run('JSON.stringify({player,ariaSoils,ariaJudgments,ariaPetalStorm,ariaWorldTree})'),canvasBefore={...g.state};
  g.run('drawAriaControlIcon(70,310,45,"joystick",true,900,-500);drawAriaControlIcon(770,310,34,"attack",true);drawAriaInterface();drawHealthBar();drawExpBar();drawAriaMobileResource()');
  assert.equal(g.run('JSON.stringify({player,ariaSoils,ariaJudgments,ariaPetalStorm,ariaWorldTree})'),before);assert.equal(g.stack.length,0);assert.deepEqual(g.state,canvasBefore);assert.ok(g.calls.some(c=>c.method==='fill'));
});
test('statistics text stays inside the transparent center between the actual filigree rails',()=>{
  for(const height of [760,320]){
    const g=scene({height});g.c.player.score=999999999;g.run('drawHUD()');const compact=height<420,x=16,y=compact?50:66,w=218,h=compact?42:120,dx=Math.min(30,w*.12,h*.38),dy=Math.min(28,h*.38),clear={x:x+dx,y:y+dy,w:w-dx*2,h:h-dy*2};
    const text=g.calls.filter(c=>c.method==='fillText');assert.equal(text.length,compact?1:3);
    for(const line of text){const fontSize=parseFloat(line.font.match(/[\d.]+px/)[0]),width=[...line.args[0]].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*fontSize;inside(clear,{x:line.args[1],y:line.args[2]-fontSize/2,w:width,h:fontSize});}
    assert.equal(g.stack.length,0);
  }
});
test('guide uses new character and skill art for all five entries without obsolete recordings',()=>{
  const g=scene();assert.deepEqual(Array.from(g.run('characterSkillVideoKeys.aria')),[]);assert.match(g.run('characterSkillGuide.aria.skills[4][0]'),/세계수/);
  for(let index=0;index<5;index++)g.run(`drawCharacterGameplayPreview("aria",${index},"아리아 스킬",10,20,400,300,"#fff")`);
  assert.equal(g.calls.filter(c=>c.method==='base:drawCharacterGameplayPreview').length,0);assert.equal(g.calls.filter(c=>c.method==='icon').length,4);assert.ok(g.calls.some(c=>c.method==='drawImage'&&c.args[0].assetSource.endsWith('/portrait.webp')));assert.equal(g.stack.length,0);
});
