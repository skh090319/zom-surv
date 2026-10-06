const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene({width=1280,height=760,mobile=false,loaded=true}={}){
  const calls=[],stack=[],listeners=new Map(),touchListeners=new Map(),storage=new Map(),count={};
  const state={font:'10px Arial',fillStyle:'#fff',textAlign:'left',textBaseline:'alphabetic',globalAlpha:.83,shadowBlur:4};
  const ctx=new Proxy(state,{get(target,key){
    if(key in target)return target[key];
    if(key==='save')return()=>stack.push({...target});
    if(key==='restore')return()=>{assert.ok(stack.length,'balanced canvas restore');const saved=stack.pop();for(const k of Object.keys(target))delete target[k];Object.assign(target,saved);};
    if(key==='measureText')return text=>({width:[...text].reduce((n,ch)=>n+(/[^\x00-\x7f]/.test(ch)?1:.56),0)*(parseFloat(target.font.match(/[\d.]+px/)?.[0])||10)});
    return(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),`${key} received ${a}`);calls.push({method:key,args,font:target.font,textAlign:target.textAlign,textBaseline:target.textBaseline});if(key.startsWith('create'))return{addColorStop(){}};};
  }});
  const c={console,Math,performance,URLSearchParams,setTimeout,clearTimeout,ctx,navigator:{maxTouchPoints:mobile?1:0},matchMedia:()=>({matches:mobile}),location:{search:''},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    addEventListener(type,fn,capture=false){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push({fn,capture:capture===true});},
    dispatchEvent(e){for(const {fn}of[...(listeners.get(e.type)||[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){fn(e);if(e.stopped)break;}},
    KeyboardEvent:class{constructor(type,data){Object.assign(this,{type,repeat:false},data);}stopImmediatePropagation(){this.stopped=true;}},
    Image:class{constructor(){this.complete=loaded;this.naturalWidth=loaded?512:0;this.naturalHeight=loaded?768:0;}},setGameImageSource:(im,src)=>Object.assign(im,{src}),ensureGameImage:im=>im,
    player:{x:1000,y:1000,r:20,damage:35,level:10,hp:73,maxHp:100,exp:4,expNeed:12,kills:15,fireCooldown:0},camera:{x:500,y:700},mouse:{x:0,y:0,worldX:1300,worldY:1000},selectedCharacter:'oblivion',screenMode:'game',paused:false,gameOver:false,raidVictory:false,choosingUpgrade:false,
    zombies:[],characterSkillGuide:{},guideCharacterOrder:[],scaledDamage:x=>x,getWorldViewScale:()=>.78,WORLD:{width:4000,height:4000},pauseButtonRect:{x:0,y:0,w:0,h:0},pointInRect:(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
    screenToWorld(){c.mouse.worldX=c.mouse.x/.78+c.camera.x;c.mouse.worldY=c.mouse.y/.78+c.camera.y;},
    killZombie(i,z){const at=c.zombies.indexOf(z);if(at>=0)c.zombies.splice(at,1);},absorbSuncallShield:d=>d-2,
    drawCooldownCover(...args){calls.push({method:'cooldown',args});},drawOblivionCombatPlayer:()=>false,
    getOblivionCombatRealmProgress:()=>0,drawOblivionCombatEffects(){count.effects=(count.effects||0)+1;},drawOblivionCombatRealm(){count.realm=(count.realm||0)+1;},drawOblivionCombatPortrait(){count.portrait=(count.portrait||0)+1;}};
  for(const name of ['restart','shoot','reload','update','drawPlayer','drawParticles','drawBackground','draw','drawHUD','drawHealthBar','drawExpBar','drawMobileCharacterResource','getCharacterPreviewSprite','drawHeroUltimateBackdrop','drawHeroUltimatePortrait'])c[name]=()=>{count[name]=(count[name]||0)+1;};
  c.canvas={width,height,addEventListener(type,fn){if(!touchListeners.has(type))touchListeners.set(type,[]);touchListeners.get(type).push(fn);},getBoundingClientRect:()=>({left:0,top:0,width:c.canvas.width,height:c.canvas.height})};
  c.oblivionCombatArt=Object.fromEntries(['panel','hpFrame','xpFrame','joystickBase','joystickThumb','attack','skillFrame'].map(name=>[name,Object.assign(new c.Image(),{src:name})]));c.oblivionCombatArt.skills=[0,1,2,3].map(i=>Object.assign(new c.Image(),{src:'skill-'+i}));
  vm.createContext(c);for(const file of ['04-oblivion.js','08-mobile.js','08-mobile-settings.js','08-mobile-targeting.js','08-oblivion-ui.js','13-oblivion-combat.js','15-oblivion-ui.js','16-oblivion-integration.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
  return{c,calls,count,run:s=>vm.runInContext(s,c),depth:()=>stack.length,state:()=>({...state}),touch(type,id,x,y){for(const fn of touchListeners.get(type)||[])fn({type,preventDefault(){},changedTouches:[{identifier:id,clientX:x,clientY:y}]});}};
}
function inside(p,b,label){assert.ok(b.x>=p.x-1e-8&&b.y>=p.y-1e-8&&b.x+b.w<=p.x+p.w+1e-8&&b.y+b.h<=p.y+p.h+1e-8,`${label}: ${JSON.stringify({p,b})}`);}

test('desktop portrait, collapse and Q/E/X/R share one bounded frame at wide and narrow sizes',()=>{
  for(const[width,height]of[[1920,1080],[1280,760],[800,600],[640,480],[480,320]]){
    const g=scene({width,height}),l=g.run('getOblivionDesktopHudLayout()'),before=g.state();inside({x:0,y:60,w:width,h:height-110},l.panel,'panel');inside(l.panel,l.resource,'portrait and collapse');
    for(const s of l.skills){inside(l.panel,{x:s.x-s.r*1.12,y:s.y-s.r*1.12,w:s.r*2.24,h:s.r*2.24},s.key+' art');inside(l.panel,{x:s.x-s.width/2,y:s.labelY-7,w:s.width,h:14},s.key+' name');}
    g.run('drawHUD();drawOblivionInterface()');assert.equal(g.count.drawHUD,undefined,'no duplicate top-left identity');
    const frame=g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src==='panel');assert.equal(frame.length,9,'one nine-sliced outer panel');
    assert.equal(Math.min(...frame.map(c=>c.args[5])),l.panel.x);assert.equal(Math.max(...frame.map(c=>c.args[5]+c.args[7])),l.panel.x+l.panel.w);
    const labels=g.calls.filter(c=>c.method==='fillText'&&['공간 파쇄','재앙의 손','봉인 해제','종언의 현현'].includes(c.args[0]));assert.equal(labels.length,4);assert.ok(labels.every(c=>parseFloat(c.font.match(/[\d.]+px/)[0])>=11));
    assert.ok(g.calls.filter(c=>c.method==='fillText').every(c=>c.args.length===3),'glyphs never horizontally squeezed');assert.equal(g.depth(),0);assert.deepEqual(g.state(),before);
  }
});
test('all cooldowns use their combat values, with a visible level-ten ultimate lock',()=>{
  const g=scene();g.run('player.level=9;player.oblivionqCooldown=105;player.oblivioneCooldown=180;player.oblivionxCooldown=21;player.oblivionrCooldown=1050;drawOblivionInterface()');
  const cds=g.calls.filter(c=>c.method==='cooldown');assert.equal(cds.length,4);assert.ok(cds.every(c=>c.args[3]===.5));assert.equal(g.calls.filter(c=>c.method==='fillText'&&c.args[0]==='LV.10').length,1);
  g.calls.length=0;g.run('player.level=10;drawOblivionInterface()');assert.equal(g.calls.filter(c=>c.method==='fillText'&&c.args[0]==='LV.10').length,0);assert.equal(g.depth(),0);
  g.run('oblivionState.empowered=true');assert.equal(g.run('getMobileSkillCooldown("x").value'),0,'the immediately available re-seal must not look locked');
});
test('HP and EXP retain animated actual/trailing values with their own metal frames',()=>{
  for(const loaded of[true,false]){
    const g=scene({loaded}),before=g.state();g.run('updateOblivionPresentation();player.hp=20;player.exp=10;updateOblivionPresentation();oblivionState.shield=24;drawHealthBar();drawExpBar()');
    assert.ok(g.run('oblivionBars.trail>oblivionBars.hp'));assert.ok(g.run('oblivionBars.xp>4/12&&oblivionBars.xp<10/12'));
    assert.ok(g.calls.some(c=>c.method==='fillText'&&c.args[0].includes('보호막 24')));assert.ok(g.calls.some(c=>c.method==='fillText'&&c.args[0].includes('EXP 10 / 12')));
    if(loaded)for(const frame of['hpFrame','xpFrame'])assert.equal(g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src===frame).length,9);
    assert.equal(g.depth(),0);assert.deepEqual(g.state(),before);
  }
});
test('mobile HP, EXP and identity use exact editable bounds and preserve saved transforms',()=>{
  for(const[width,height]of[[568,320],[844,390],[1366,1024]]){
    const g=scene({width,height,mobile:true});g.run('drawOblivionInterface()');assert.equal(g.calls.length,0,'no desktop skill row on touch');
    for(const id of['health','exp','resource']){
      const base=g.run(`getMobileHudBounds('${id}')`);inside({x:0,y:0,w:width,h:height},{x:base.x-base.w/2,y:base.y-base.h/2,w:base.w,h:base.h},id);
      g.run(`mobileControlSettings.hud.${id}={x:.38,y:.44,scale:1.7}`);const saved=g.run('JSON.stringify(mobileControlSettings)'),layout=g.run(`getMobileHudLayout('${id}')`);
      assert.equal(layout.x,width*.38);assert.equal(layout.y,height*.44);assert.equal(layout.w,base.w*1.7);
      g.run(`drawMobileEditableHud('${id}',${{health:'drawHealthBar',exp:'drawExpBar',resource:'drawMobileCharacterResource'}[id]})`);
      assert.equal(g.run('JSON.stringify(mobileControlSettings)'),saved);assert.ok(g.calls.some(c=>c.method==='scale'&&c.args[0]===1.7));assert.equal(g.depth(),0);
    }
  }
});
test('mobile uses custom joystick, thumb, attack, four framed icons and complete Korean labels',()=>{
  for(const[width,height]of[[568,320],[844,390],[1024,768]]){
    const g=scene({width,height,mobile:true}),before=g.run('JSON.stringify(mobileControlSettings)');g.run('drawMobileControls()');
    for(const name of['joystickBase','joystickThumb','attack'])assert.equal(g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src===name).length,1);
    assert.equal(g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src==='skillFrame').length,4);
    const text=g.calls.filter(c=>c.method==='fillText');assert.deepEqual(text.map(c=>c.args[0]),['공간','파쇄','재앙의','손','봉인','해제','종언의','현현']);
    assert.ok(text.every(c=>c.args.length===3&&c.args[2]<=height-5));assert.equal(g.run('JSON.stringify(mobileControlSettings)'),before);assert.equal(g.depth(),0);
    g.calls.length=0;g.run('mobileControlSettings.joystickX=.23;mobileControlSettings.joystickY=.67;mobileControlSettings.attackX=.74;mobileControlSettings.attackY=.78;mobileControlSettings.skills.q={x:.42,y:.49,scale:1.35};drawMobileControls()');
    const layout=g.run('getMobileControlLayout()');for(const[name,shape]of[['joystickBase',layout.joystick],['attack',layout.attack]]){const draw=g.calls.find(c=>c.method==='drawImage'&&c.args[0].src===name);assert.deepEqual(draw.args.slice(1),[shape.x-shape.r,shape.y-shape.r,shape.r*2,shape.r*2]);}
    const q=g.calls.find(c=>c.method==='drawImage'&&c.args[0].src==='skill-0'),sk=layout.skills[0];assert.deepEqual(q.args.slice(1),[sk.x-sk.r,sk.y-sk.r,sk.r*2,sk.r*2]);assert.equal(sk.x,width*.42);assert.equal(sk.y,height*.49);assert.equal(sk.r,Math.max(20,Math.min(28,Math.min(width,height)*.052))*1.35);
  }
});
test('default mobile skill artwork and two-line names never overlap neighboring icons or the resource/EXP HUD',()=>{
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const[width,height]of[[568,320],[844,390],[1024,768]]){
    const g=scene({width,height,mobile:true}),skills=g.run('getMobileControlLayout().skills');g.run('drawMobileControls()');
    const frames=g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src==='skillFrame').map((c,i)=>({key:skills[i].key,x:c.args[1],y:c.args[2],w:c.args[3],h:c.args[4]}));
    const labels=g.calls.filter(c=>c.method==='fillText').map(c=>{
      const sk=skills.find(s=>s.x===c.args[1]),fontSize=parseFloat(c.font.match(/[\d.]+px/)[0]),textWidth=[...c.args[0]].reduce((n,ch)=>n+(/[^\x00-\x7f]/.test(ch)?1:.56),0)*fontSize;
      assert.ok(sk,'each label belongs to a live skill');return{key:sk.key,text:c.args[0],x:c.args[1]-textWidth/2,y:c.args[2]-fontSize,w:textWidth,h:fontSize};
    });
    const hud=['resource','exp'].map(id=>{const b=g.run(`getMobileHudLayout('${id}')`);return{id,x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h};});
    for(const frame of frames){inside({x:0,y:0,w:width,h:height},frame,'skill frame');for(const other of frames)if(frame.key!==other.key)assert.equal(overlaps(frame,other),false,`${width}: ${frame.key}/${other.key} frames overlap`);}
    for(const label of labels){inside({x:0,y:0,w:width,h:height},label,'skill name');for(const frame of frames)if(frame.key!==label.key)assert.equal(overlaps(label,frame),false,`${width}: ${label.key} name ${label.text} overlaps ${frame.key} frame`);}
    for(const box of[...frames,...labels])for(const h of hud)assert.equal(overlaps(box,h),false,`${width}: ${box.key} ${box.text||'frame'} overlaps ${h.id}`);
    assert.equal(g.depth(),0);
  }
});
test('touch attack is available and all six buttons remain configurable',()=>{
  const g=scene({width:844,height:390,mobile:true}),a=g.run('getMobileControlLayout().attack');g.touch('touchstart',4,a.x,a.y);assert.equal(g.c.mouse.down,true);assert.equal(g.run('mobileAttackTouchId'),4);g.touch('touchend',4,a.x,a.y);assert.equal(g.c.mouse.down,false);
  const ids=Array.from(g.run('getMobileSettingControls()'),c=>c.id);assert.deepEqual(ids,['joystick','attack','q','e','x','r']);
});
test('Q/E drag previews match cast geometry and empowered Q adds both branches and three tips',()=>{
  const g=scene({width:844,height:390,mobile:true});
  for(const empowered of[false,true]){
    g.run(`oblivionState.empowered=${empowered};player.oblivionqCooldown=0;player.oblivioneCooldown=0;mobileSkillAim={key:'q',dragged:true,angle:.7,strength:1};applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec('q'));triggerMobileSkill('q',true)`);
    const q=g.run('getMobileSkillTargetSpec("q")'),cast=g.run('oblivionState.casts.at(-1)');assert.equal(q.range,cast.length);assert.equal(q.width,cast.width*2);assert.ok(Math.abs(cast.a-.7)<1e-8);
    g.run('mobileSkillAim={key:"e",dragged:true,angle:1,strength:.45};applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec("e"));triggerMobileSkill("e",true)');const e=g.run('getMobileSkillTargetSpec("e")'),grasp=g.run('oblivionState.casts.at(-1)');assert.equal(e.radius,grasp.r);assert.ok(Math.abs(Math.hypot(grasp.x-1000,grasp.y-1000)-270)<1e-8);
  }
  g.calls.length=0;g.run('mobileSkillAim={key:"q",dragged:true,angle:.3,strength:1};drawMobileTargetingIndicator()');assert.ok(g.calls.some(c=>c.method==='rotate'&&Math.abs(c.args[0]-.1)<1e-8));assert.ok(g.calls.some(c=>c.method==='rotate'&&Math.abs(c.args[0]-.5)<1e-8));assert.equal(g.depth(),0);
  const before={...g.c.mouse};for(const key of['x','r']){assert.equal(g.run(`getMobileSkillTargetSpec('${key}').aim`),false);g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:-2,strength:1};applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec('${key}'))`);}assert.deepEqual(g.c.mouse,before);
});
test('touch cancellation never spends a cast or cooldown, including X',()=>{
  for(const key of['q','e','x','r']){
    const g=scene({width:844,height:390,mobile:true});g.run('oblivionState.gauge=70');const sk=g.run(`getMobileControlLayout().skills.find(s=>s.key==='${key}')`);
    g.touch('touchstart',3,sk.x,sk.y);g.touch('touchmove',3,sk.x-35,sk.y);const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchend',3,cancel.x,cancel.y);
    assert.equal(g.run('oblivionState.casts.length'),0);assert.equal(g.run('oblivionState.empowered'),false);assert.equal(g.run('oblivionState.ultimateTime'),0);assert.equal(g.c.player['oblivion'+key+'Cooldown'],0);assert.equal(g.run('mobileSkillAim'),null);
  }
});
test('small-phone default HUD clears controls and very large saved HUDs do not alter cancellation coordinates',()=>{
  const g=scene({width:568,height:320,mobile:true}),layout=g.run('getMobileControlLayout()'),resource=g.run('getMobileHudLayout("resource")'),xp=g.run('getMobileHudLayout("exp")'),cancel=g.run('getMobileSkillCancelButton()');
  const right=resource.x+resource.w/2;assert.ok(layout.skills.every(s=>s.x-s.r*1.12>right),'identity frame leaves the entire default skill formation clear');
  assert.ok(resource.y+resource.h/2<xp.y-xp.h/2,'resource and EXP remain separate');assert.ok(cancel.y+cancel.r<Math.min(...layout.skills.map(s=>s.y-s.r)),'cancel circle clears default skill art');
  g.run('mobileControlSettings.hud.health={x:.5,y:.5,scale:5};mobileControlSettings.hud.resource={x:.5,y:.6,scale:5};');const settings=g.run('JSON.stringify(mobileControlSettings)');
  g.run('drawMobileEditableHud("health",drawHealthBar);drawMobileEditableHud("resource",drawMobileCharacterResource);drawMobileControls()');
  const sk=layout.skills.find(s=>s.key==='e');g.touch('touchstart',3,sk.x,sk.y);g.touch('touchmove',3,sk.x-35,sk.y);g.touch('touchend',3,cancel.x,cancel.y);
  assert.equal(g.run('oblivionState.casts.length'),0);assert.equal(g.c.player.oblivioneCooldown,0);assert.equal(g.run('mobileSkillAim'),null);assert.equal(g.run('JSON.stringify(mobileControlSettings)'),settings);assert.equal(g.depth(),0);
});
test('input, pause, restart, shields and renderer wrappers stay isolated to Oblivion',()=>{
  const g=scene();g.run('player.level=9;triggerMobileSkill("r",true)');assert.equal(g.run('oblivionState.ultimateTime'),0);g.run('player.level=10;triggerMobileSkill("r",true)');assert.equal(g.run('oblivionState.ultimateTime'),600);
  g.run('dispatchEvent(new KeyboardEvent("keydown",{key:"q",repeat:true}))');assert.equal(g.run('oblivionState.casts.length'),0);
  for(const gate of['paused','choosingUpgrade','gameOver','raidVictory']){g.c[gate]=true;g.run('update();triggerMobileSkill("q",true)');assert.equal(g.run('oblivionState.frame'),0);assert.equal(g.run('oblivionState.casts.length'),0);g.c[gate]=false;}
  g.run('oblivionState.shield=8');assert.equal(g.run('absorbSuncallShield(12)'),4);g.run('drawHeroUltimateBackdrop();drawHeroUltimatePortrait();draw()');assert.equal(g.count.drawHeroUltimateBackdrop,undefined);assert.equal(g.count.drawHeroUltimatePortrait,undefined);assert.equal(g.count.portrait,1);
  g.run('restart()');assert.equal(g.run('oblivionState.ultimateTime'),0);assert.equal(g.run('oblivionState.gauge'),0);
  g.c.selectedCharacter='mare';g.run('shoot();reload();drawHUD();drawHeroUltimateBackdrop();drawHeroUltimatePortrait()');assert.equal(g.count.shoot,1);assert.equal(g.count.reload,1);assert.equal(g.count.drawHUD,1);assert.equal(g.count.drawHeroUltimateBackdrop,1);assert.equal(g.count.drawHeroUltimatePortrait,1);assert.equal(g.run('absorbSuncallShield(12)'),10);
});

test('ultimate preloads human cut-in and realm, skips only a fully opaque map, and keeps the portrait last',()=>{
  const g=scene(),requested=[],order=[];
  g.c.heroUltimateBackdrops={oblivion:{src:'realm'}};
  g.c.ensureGameImage=(image,priority)=>{requested.push([image.src,priority]);return image;};
  g.run('player.level=9;activateOblivionR()');assert.equal(requested.length,0);
  g.run('player.level=10;activateOblivionR()');assert.deepEqual(requested,[['realm','high'],[g.run('oblivionSprite.src'),'high']]);
  g.run('activateOblivionR()');assert.equal(requested.length,2,'a blocked cast must not repeat presentation requests');
  g.c.getOblivionCombatRealmProgress=()=>.5;g.run('drawBackground()');assert.equal(g.count.drawBackground,1);assert.equal(g.count.realm,1);
  g.c.getOblivionCombatRealmProgress=()=>1;g.run('drawBackground()');assert.equal(g.count.drawBackground,1);assert.equal(g.count.realm,2);
  g.c.getOblivionCombatRealmProgress=()=>0;g.run('drawBackground()');assert.equal(g.count.drawBackground,2);
  // The wrapped base is lexical; its renderer counter must already advance at cut-in time.
  g.c.drawOblivionCombatPortrait=()=>{assert.equal(g.count.draw,1);order.push('portrait');};
  g.run('draw()');assert.deepEqual(order,['portrait']);
  g.c.selectedCharacter='mare';g.run('drawBackground();draw()');assert.equal(g.count.drawBackground,3);assert.equal(order.length,1);
});
