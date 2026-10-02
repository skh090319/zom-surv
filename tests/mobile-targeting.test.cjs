const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game() {
  const listeners = {}, globalListeners = {}, storage = new Map(), draws = [];
  const context = {
    console, URLSearchParams, Math, performance, setTimeout, clearTimeout,
    navigator: {maxTouchPoints: 1}, matchMedia: () => ({matches: true}), location: {search: ''},
    localStorage: {getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    addEventListener: (type,fn) => (globalListeners[type] ||= []).push(fn),
    dispatchEvent: event => (globalListeners[event.type] || []).forEach(fn => fn(event)),
    KeyboardEvent: class {constructor(type,data) {Object.assign(this,{type},data);}},
    MouseEvent: class {constructor(type,data) {Object.assign(this,{type},data);}},
    ctx: new Proxy({}, {get(obj,key) {
      if (key in obj) return obj[key];
      return (...args) => {
        for(const arg of args) if(typeof arg === 'number') assert.ok(Number.isFinite(arg), key+' finite');
        draws.push([key,...args]);
        if(key.startsWith('create')) return {addColorStop() {}};
        if(key==='measureText') return {width: 90};
      };
    }}),
    player: new Proxy({x:1000,y:1000,level:20,r:20,yupiterWeapon:0}, {get:(obj,k)=>obj[k]??0}),
    camera:{x:500,y:750}, mouse:{x:0,y:0,worldX:0,worldY:0}, keys:{},
    zombies:[], selectedCharacter:'mare', screenMode:'game', paused:false, choosingUpgrade:false, gameOver:false, raidVictory:false,
    transcended:{}, renPlacedClones:[], renFlyingClones:[], arcZones:[], echoKnots:[], echoRifts:[], ariaSoils:[],
    terraStructures:[],voidTerrains:[],bloodDrops:[],moiraLinks:[],
    scaledDamage:value=>value,enemyMaxHpDamage:(enemy,ratio)=>enemy.maxHp*ratio,killZombie(index){context.zombies.splice(index,1);},
    REN_CLONE_THROW_RANGE:320, REN_ULTIMATE_RADIUS:429, REN_ATTACK_RANGE:216, ZERO_ATTACK_RANGE:200,
    getRenCloneCount:()=>4, arcAreaScale:()=>1, getPaladinTier:()=>0,
    getWorldViewScale:()=>.78, WORLD:{width:4000,height:4000},
    pointInRect:(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
    screenToWorld(){context.mouse.worldX=context.mouse.x/.78+context.camera.x;context.mouse.worldY=context.mouse.y/.78+context.camera.y;},
    characterSkillGuide:{yupiter:{name:'유피테르',color:'#64ef91'}}, getCharacterPreviewSprite:()=>null,
    drawMenuBackdrop(){}, drawLobbyBackdrop(){}, drawLobbyPanel(){}, drawBloodiedLobbyTitle(){}, drawRoundedRect(){},
    difficultyLabel:()=> 'MEDIUM', drawHomeDifficultyPicker(){},
    homeStartRect:{},homeCharacterRect:{},homeAugmentGuideRect:{},homeGameGuideRect:{},homeMonsterGuideRect:{},
    homeSettingsRect:{x:0,y:0,w:0,h:0},homeDifficultyRect:{x:0,y:0,w:0,h:0},homeDifficultyOpen:false,homeDifficultyChoiceRects:[],selectedDifficulty:'medium',
    pauseButtonRect:{x:0,y:0,w:0,h:0}
  };
  context.canvas={width:844,height:390, getBoundingClientRect:()=>({left:0,top:0,width:context.canvas.width,height:context.canvas.height}),
    addEventListener:(type,fn)=>(listeners[type] ||= []).push(fn),
    dispatchEvent:event=>(listeners[event.type]||[]).forEach(fn=>fn(event))};
  vm.createContext(context);
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
  load('03-input.js');
  // Load the real entry-point order, including overrides of the original casts.
  for(const file of ['04-mare.js','04-mare-polish.js','04-mare-skills-polish.js','04-mare-flow.js','04-mare-whale.js','04-null-zero.js','04-astra-constellations.js','04-astra.js','08-mobile.js','08-mobile-settings.js','08-mobile-targeting.js'])load(file);
  return {context,draws,storage,run:code=>vm.runInContext(code,context),touch(type,id,x,y){context.canvas.dispatchEvent({type,preventDefault(){},changedTouches:[{identifier:id,clientX:x,clientY:y}]});}};
}

test('every HUD element moves and scales independently, round-trips through storage and remains uncapped',()=>{
  const g=game();g.run("openMobileSettings();mobileSettingsPage='controls';mobileSettingsEditGroup='hud'");
  for(const id of ['health','exp','boss','timer','resource','pause']){
    g.run(`mobileSettingsTarget='${id}';setMobileSettingScale(4);`);
    const item=g.run(`getMobileSettingControls().find(c=>c.id==='${id}')`);
    // Drag in the fitted editor: the normalized game position is recovered, not the preview offset.
    g.run(`moveMobileSettingControl({controlTarget:'${id}',offsetX:0,offsetY:0},{x:${item.editorOffsetX+844*.7*item.editorScale},y:${124+390*.6*item.editorScale}});saveMobileControlSettings()`);
    const saved=g.run(`loadMobileControlSettings().hud['${id}']`);
    assert.ok(Math.abs(saved.x-.7)<1e-9);assert.ok(Math.abs(saved.y-.6)<1e-9);assert.equal(saved.scale,4);
  }
  assert.equal(g.run('mobileControlSettings.actionScale'),1);
  assert.equal(g.run('mobileControlSettings.joystickScale'),1);
});

test('touch drag is one undo step and redo restores all HUD data; a new edit clears redo',()=>{
  const g=game();g.run("openMobileSettings();mobileSettingsPage='controls';mobileSettingsEditGroup='hud';mobileSettingsTarget='health'");
  const item=g.run("getMobileSettingControls().find(c=>c.id==='health')");
  g.touch('touchstart',77,item.x,item.y);
  g.touch('touchmove',77,item.x+10,item.y+10);
  g.touch('touchmove',77,item.x+20,item.y+20);
  g.touch('touchend',77,item.x+20,item.y+20);
  assert.equal(g.run('mobileSettingsUndo.length'),1);
  const edited=g.run('JSON.stringify(mobileControlSettings)');
  g.run('replayMobileSettingsHistory()');assert.equal(g.run('mobileControlSettings.hud.health.x'),null);
  g.run('replayMobileSettingsHistory(true)');assert.equal(g.run('JSON.stringify(mobileControlSettings)'),edited);
  g.run('replayMobileSettingsHistory();setMobileSettingScale(1.5)');assert.equal(g.run('mobileSettingsRedo.length'),0);
});

test('HUD and control resets are isolated and both are reversible',()=>{
  const g=game();g.run("openMobileSettings();mobileSettingsPage='controls';mobileSettingsTarget='attack';setMobileSettingScale(2);mobileSettingsTarget='exp';setMobileSettingScale(3);mobileSettingsEditGroup='hud';resetMobileSettingsPage()");
  assert.equal(g.run('mobileControlSettings.hud.exp.scale'),1);assert.equal(g.run('mobileControlSettings.actionScale'),2);
  g.run('replayMobileSettingsHistory()');assert.equal(g.run('mobileControlSettings.hud.exp.scale'),3);
  g.run("mobileSettingsEditGroup='buttons';resetMobileSettingsPage()");
  assert.equal(g.run('mobileControlSettings.hud.exp.scale'),3);assert.equal(g.run('mobileControlSettings.actionScale'),1);
  g.run('replayMobileSettingsHistory()');assert.equal(g.run('mobileControlSettings.actionScale'),2);
});

test('HUD rendering transforms geometry only on mobile and restores canvas after exceptions',()=>{
  const g=game();g.run("mobileControlSettings.hud.health={x:.3,y:.4,scale:2};drawMobileEditableHud('health',()=>ctx.fillRect(1,2,3,4))");
  assert.ok(g.draws.some(c=>c[0]==='scale'&&c[1]===2));assert.equal(g.draws.at(-1)[0],'restore');
  g.draws.length=0;assert.throws(()=>g.run("drawMobileEditableHud('health',()=>{throw Error('draw')})"));assert.equal(g.draws.at(-1)[0],'restore');
  g.draws.length=0;g.run("isMobileTouchDevice=()=>false;drawMobileEditableHud('health',()=>ctx.fillRect(1,2,3,4))");
  assert.equal(g.draws.length,1);assert.equal(g.draws[0][0],'fillRect');
});

test('the UI tab and undo/redo controls are tappable on phone and tablet toolbar widths',()=>{
  for(const width of [568,844,1180]){
    const g=game();g.context.canvas.width=width;
    g.run("getMobileSkillIcon=()=>null;openMobileSettings();mobileSettingsPage='controls';drawMobileControlEditor()");
    const ui=g.run("mobileSettingsGroupRects.find(r=>r.id==='hud')");
    g.run(`handleMobileSettingsTap({x:${ui.x+ui.w/2},y:${ui.y+ui.h/2}});drawMobileControlEditor()`);
    assert.equal(g.run('mobileSettingsEditGroup'),'hud');assert.equal(g.run('mobileSettingsTarget'),'health');
    for(const c of g.run('mobileSettingsTargetRects'))assert.ok(c.w>0&&c.x+c.w<=width);
    g.run('setMobileSettingScale(2)');
    const undo=g.run('mobileSettingsUndoRect');g.run(`handleMobileSettingsTap({x:${undo.x+10},y:${undo.y+10}})`);
    assert.equal(g.run('mobileControlSettings.hud.health.scale'),1);
    const redo=g.run('mobileSettingsRedoRect');g.run(`handleMobileSettingsTap({x:${redo.x+10},y:${redo.y+10}})`);
    assert.equal(g.run('mobileControlSettings.hud.health.scale'),2);
  }
});

test('holding is silent; dragging shows a preview; recentering hides it',()=>{
  const g=game(),button=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
  g.touch('touchstart',7,button.x,button.y);g.run('drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
  g.touch('touchmove',7,button.x-45,button.y-5);g.run('drawMobileTargetingIndicator()');assert.ok(g.draws.length>0);
  g.draws.length=0;g.touch('touchmove',7,button.x+2,button.y);g.run('drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
});

test('Astra drag previews use real Q slots, recall, E radius and R capture/launch geometry',()=>{
  const g=game();g.context.selectedCharacter='astra';
  g.run('mobileSkillAim={key:"q",dragged:false,angle:.4,strength:.5};drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
  g.run('mobileSkillAim.dragged=true;drawMobileTargetingIndicator()');assert.ok(g.draws.length>0);
  const q=g.run('getMobileSkillTargetSpec("q")');assert.equal(q.range,g.run('astraQGeometry().range'));assert.equal(q.radius,g.run('astraQGeometry().radius'));
  g.run('applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec("q"));activateAstraQ();drawMobileTargetingIndicator()');
  assert.equal(g.run('astraQFlights().length'),3);assert.equal(g.run('getMobileSkillName("q")'),'공전성 회수');
  assert.equal(g.run('getMobileSkillCooldown("q").value'),0);
  assert.ok(g.run('getMobileSkillTargetSpec("q").label.includes("회수")'));
  assert.equal(g.run('getMobileSkillTargetSpec("e").radius'),g.run('astraERadius()'));
  g.context.player.astraHorizonLevel=3;assert.equal(g.run('getMobileSkillTargetSpec("e").radius'),139);
  g.run('mobileSkillAim={key:"r",dragged:true,angle:1,strength:.1};drawMobileTargetingIndicator()');
  assert.equal(g.run('getMobileSkillTargetSpec("r").radius'),620);
  assert.ok(Math.abs(g.run('Math.hypot(getMobileAimPoint(mobileSkillAim,getMobileSkillTargetSpec("r")).x-player.x,getMobileAimPoint(mobileSkillAim,getMobileSkillTargetSpec("r")).y-player.y)')-320)<1e-9);
  g.run('activateAstraR();drawMobileTargetingIndicator()');assert.equal(g.run('getMobileSkillTargetSpec("r").radius'),0);
  g.draws.length=0;g.run('mobileSkillAim.dragged=false;drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
});

test('Astra mobile auto-aim ignores its own captured celestial bodies',()=>{
  const g=game();g.context.selectedCharacter='astra';
  g.context.zombies.push({x:1020,y:1000,r:15,hp:100}, {x:1500,y:1200,r:60,hp:10000,isRaidBoss:true});
  g.run('activateAstraR();updateMobileAttackAim(true)');
  assert.ok(Math.abs(g.context.mouse.worldX-1500)<1e-9);assert.ok(Math.abs(g.context.mouse.worldY-1200)<1e-9);
});

test('marker and released Mare core use the same position, even while moving and holding attack',()=>{
  const g=game(),button=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")'),attack=g.run('getMobileControlLayout().attack');
  g.context.zombies.push({x:1300,y:1000,hp:100});
  g.touch('touchstart',1,attack.x,attack.y);g.touch('touchstart',2,button.x,button.y);
  g.touch('touchmove',2,button.x-35,button.y-10);
  const first=g.run('getMobileAimPoint(mobileSkillAim,getMobileSkillTargetSpec("e"))');
  assert.ok(Math.hypot(first.x-1000,first.y-1000)<360);
  g.context.player.x+=80;g.context.camera.x+=40;
  g.run('updateMobileAttackAim()');
  const expected=g.run('getMobileAimPoint(mobileSkillAim,getMobileSkillTargetSpec("e"))');
  assert.ok(Math.abs(g.context.mouse.worldX-expected.x)<.00001);
  g.touch('touchend',2,button.x-35,button.y-10);
  const core=g.run('mareCore');assert.ok(Math.hypot(core.x-expected.x,core.y-expected.y)<.00001);
  const recast=g.run('getMobileSkillTargetSpec("e")');
  assert.equal(recast.aim,false);assert.equal(recast.shapes[0].x,core.x);assert.equal(recast.shapes[0].r,210);
});

test('buffs, recall and automatic casts show effects without changing aim',()=>{
  const g=game();
  const noAim={suncall:['r'],yupiter:['q','e','r'],ren:['x','e'],nightLord:['e','x','r'],zero:['e','r'],paladin:['q','r'],terra:['x'],void:['x'],carmilla:['q'],vargas:['e','r'],echo:['q','r'],aria:['q','r'],moira:['x','r'],mare:['x']};
  for(const [character,keys] of Object.entries(noAim))for(const key of keys){
    g.context.selectedCharacter=character;
    assert.equal(g.run(`getMobileSkillTargetSpec('${key}').aim`),false,character+' '+key);
    g.draws.length=0;
    g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:0,strength:1};drawMobileTargetingIndicator()`);
    assert.ok(g.draws.length>0,character+' '+key+' has an effect or status preview');
    g.context.mouse.worldX=1789;g.context.mouse.worldY=654;
    g.run(`applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec('${key}'))`);
    assert.equal(g.context.mouse.worldX,1789);assert.equal(g.context.mouse.worldY,654);
  }
});

test('cancelled or interrupted touches cannot cast a skill',()=>{
  for(const interrupt of ['cancel','paused','choosingUpgrade','gameOver']){
    const g=game(),button=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
    g.touch('touchstart',2,button.x,button.y);g.touch('touchmove',2,button.x-50,button.y);
    if(interrupt!=='cancel')g.context[interrupt]=true;
    g.touch(interrupt==='cancel'?'touchcancel':'touchend',2,button.x-50,button.y);
    assert.equal(g.run('mareCore'),null);assert.equal(g.run('mobileSkillAim'),null);
  }
});

test('dragging a skill onto neon cancel and releasing spends no cooldown or cast',()=>{
  const g=game(),skill=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
  g.touch('touchstart',9,skill.x,skill.y);g.run('drawMobileSkillCancelButton()');assert.equal(g.draws.length,0);
  g.touch('touchmove',9,skill.x-40,skill.y);g.run('drawMobileSkillCancelButton()');assert.ok(g.draws.some(d=>d[0]==='arc'));
  const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchmove',9,cancel.x,cancel.y);
  assert.equal(g.run('mobileSkillAim.cancelHover'),true);g.draws.length=0;g.run('drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
  g.touch('touchend',9,cancel.x,cancel.y);assert.equal(g.run('mareCore'),null);assert.equal(g.context.player.mareECooldown,0);assert.equal(g.run('mobileSkillAim'),null);
});

test('leaving the cancel circle restores aim and releasing casts normally',()=>{
  const g=game(),skill=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
  g.touch('touchstart',9,skill.x,skill.y);g.touch('touchmove',9,skill.x-40,skill.y);
  const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchmove',9,cancel.x,cancel.y);
  g.touch('touchmove',9,skill.x-40,skill.y);assert.equal(g.run('mobileSkillAim.cancelHover'),false);
  g.touch('touchend',9,skill.x-40,skill.y);assert.ok(g.run('mareCore'));
});

test('second-finger cancel preserves movement and basic attack, and cannot cast on later release',()=>{
  const g=game(),layout=g.run('getMobileControlLayout()'),skill=layout.skills.find(s=>s.key==='e');
  g.touch('touchstart',1,layout.joystick.x,layout.joystick.y);g.touch('touchstart',2,layout.attack.x,layout.attack.y);
  g.touch('touchstart',3,skill.x,skill.y);g.touch('touchmove',3,skill.x-45,skill.y);
  const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchstart',4,cancel.x,cancel.y);
  assert.equal(g.run('mobileSkillAim'),null);assert.equal(g.run('mobileJoystickTouchId'),1);assert.equal(g.run('mobileAttackTouchId'),2);assert.equal(g.context.mouse.down,true);
  g.touch('touchend',4,cancel.x,cancel.y);g.touch('touchend',3,skill.x-45,skill.y);assert.equal(g.run('mareCore'),null);
});

test('cancel checks final release coordinates and works for non-targeted buff skills too',()=>{
  for(const key of ['e','x']){
    const g=game(),skill=g.run(`getMobileControlLayout().skills.find(s=>s.key==='${key}')`);
    g.touch('touchstart',3,skill.x,skill.y);g.touch('touchmove',3,skill.x-35,skill.y);
    const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchend',3,cancel.x,cancel.y);
    assert.equal(g.run('mareCore'),null);assert.equal(g.context.player.mareFlowTime,0);assert.equal(g.context.player.mareXCooldown,0);
  }
});

test('cancel target remains above default skills on phone and tablet, and follows custom positions',()=>{
  const g=game();
  for(const [w,h] of [[667,320],[844,390],[1024,768],[1366,1024]]){
    g.context.canvas.width=w;g.context.canvas.height=h;
    const layout=g.run('getMobileControlLayout()'),button=g.run('getMobileSkillCancelButton()');
    assert.ok(button.y+button.r<Math.min(...layout.skills.map(s=>s.y-s.r)));
    assert.ok(button.x-button.r>=0&&button.x+button.r<=w&&button.y-button.r>=0&&button.y+button.r<=h);
  }
  g.run('mobileControlSettings.skills.e.x=.3;mobileControlSettings.skills.e.y=.3');
  const custom=g.run('getMobileSkillCancelButton()');assert.ok(custom.x<1000);
});

test('cancel target cannot overlap custom skills placed at the upper editor limit',()=>{
  const g=game();
  for(const [w,h] of [[667,320],[844,390],[1366,1024]]){
    g.context.canvas.width=w;g.context.canvas.height=h;
    g.run('for(const key of ["q","e","x","r"]){mobileControlSettings.skills[key].y=0;mobileControlSettings.skills[key].x=.5;}');
    const layout=g.run('getMobileControlLayout()'),cancel=g.run('getMobileSkillCancelButton()');
    for(const skill of layout.skills)assert.ok(Math.hypot(cancel.x-skill.x,cancel.y-skill.y)>cancel.r+9+skill.r);
    assert.ok(cancel.y+cancel.r<Math.min(...layout.skills.map(s=>s.y-s.r)));
  }
});

test('neon cancel is available to every character skill and hidden for basic-attack dragging',()=>{
  const g=game();g.context.reviewCasts=[];g.run('triggerMobileSkill=key=>reviewCasts.push(key)');
  const characters=g.run('Object.keys(MOBILE_SKILL_KEYS)');
  for(const character of characters){
    g.context.selectedCharacter=character;
    for(const skill of g.run('getMobileControlLayout().skills')){
      g.touch('touchstart',3,skill.x,skill.y);g.touch('touchmove',3,skill.x-35,skill.y);
      const cancel=g.run('getMobileSkillCancelButton()');g.touch('touchend',3,cancel.x,cancel.y);
      assert.equal(g.run('mobileSkillAim'),null);
    }
  }
  assert.equal(g.context.reviewCasts.length,0);
  g.run('mobileAttackAim={dragged:true,angle:0,strength:1};drawMobileSkillCancelButton()');assert.equal(g.draws.length,0);
});

test('geometry matches cast dimensions and empowered states',()=>{
  const g=game();g.context.selectedCharacter='terra';
  assert.equal(g.run('getMobileSkillTargetSpec("r").range'),820);
  g.context.player.terraVibration=100;assert.equal(g.run('getMobileSkillTargetSpec("r").range'),940);
  g.context.selectedCharacter='arc';assert.equal(g.run('getMobileSkillTargetSpec("q").type'),'target');
  assert.equal(g.run('getMobileSkillTargetSpec("x").range'),620);
  g.context.selectedCharacter='vargas';assert.equal(g.run('getMobileSkillTargetSpec("q").type'),'self');
  g.context.selectedCharacter='mare';assert.ok(g.run('getMobileSkillTargetSpec("q").range')>700);
  assert.equal(g.run('getMobileSkillTargetSpec("q").centered'),undefined);
  g.context.player.mareUltimateTime=420;
  assert.equal(g.run('getMobileSkillTargetSpec("q").range'),252);
  assert.equal(g.run('getMobileSkillTargetSpec("e").type'),'rect');
});

test('every mobile skill has a finite drag preview, and no hold preview',()=>{
  const g=game();
  for(const character of ['ren','nightLord','zero','paladin','arc','terra','void','vargas','echo','aria','moira','mare','nullZero','carmilla','yupiter']){
    g.context.selectedCharacter=character;g.context.player.voidMass=100;
    for(const key of g.run('MOBILE_SKILL_KEYS[selectedCharacter]')){
      assert.ok(g.run(`getMobileSkillTargetSpec('${key}')`),character+' '+key);
      g.draws.length=0;g.run(`mobileSkillAim={key:'${key}',dragged:false,angle:.3,strength:.6};drawMobileTargetingIndicator()`);assert.equal(g.draws.length,0);
      g.run('mobileSkillAim.dragged=true;drawMobileTargetingIndicator()');assert.ok(g.draws.length>0);
    }
    g.run('mobileSkillAim=null;mobileAttackAim={dragged:true,angle:.2,strength:.7};drawMobileTargetingIndicator()');
  }
});

test('Mare tide preview matches the final travelling-wave collision, only in front',()=>{
  const g=game();Object.assign(g.context.player,{damage:100,mareFoamLevel:0});
  const range=g.run('getMobileSkillTargetSpec("q").range');
  const enemy=(id,x,y)=>({id,x,y,r:0,hp:10000,maxHp:10000});
  const inside=enemy('front',1600,1000),behind=enemy('behind',800,1000),tooFar=enemy('far',1000+range+1,1000),side=enemy('side',1600,1216);
  g.context.zombies.push(inside,behind,tooFar,side);
  g.context.mouse.worldX=1800;g.context.mouse.worldY=1000;g.run('activateMareQ()');
  const tide=g.run('mareEffects.find(e=>e.type==="tide")');
  assert.ok(tide.hit instanceof Set||typeof tide.hit.has==='function');
  for(let i=0;i<64;i++)g.run('updateMare()');
  assert.ok(tide.hit.has(inside));assert.equal(tide.hit.has(behind),false);
  assert.equal(tide.hit.has(tooFar),false);assert.equal(tide.hit.has(side),false);
});

test('dragging Mare ultimate sets the actual whale summon angle on release',()=>{
  const g=game(),button=g.run('getMobileControlLayout().skills.find(s=>s.key==="r")');
  assert.equal(g.run('getMobileSkillTargetSpec("r").type'),'direction');
  g.touch('touchstart',8,button.x,button.y);g.touch('touchmove',8,button.x-50,button.y-30);
  g.context.player.x+=75;g.run('updateMobileAttackAim()');
  g.touch('touchend',8,button.x-50,button.y-30);
  assert.ok(Math.abs(g.context.player.mareUltimateAngle-Math.atan2(-30,-50))<1e-9);
  assert.equal(g.context.player.mareUltimateTime,420);
});

test('settings stay below controls and on screen on small phones and tablets, and open via touch',()=>{
  for(const [width,height] of [[568,280],[667,320],[844,390],[1024,768],[1366,1024]]){
    const g=game();Object.assign(g.context.canvas,{width,height});g.context.screenMode='home';g.context.selectedCharacter='yupiter';
    g.run('drawMobileHomeScreen()');const button=g.run('mobileSettingsHomeRect'),guide=g.context.homeGameGuideRect;
    assert.ok(button.y>=guide.y+guide.h);assert.ok(button.y+button.h<=height-5);
    g.touch('touchstart',3,button.x+button.w/2,button.y+button.h/2);g.touch('touchend',3,button.x+button.w/2,button.y+button.h/2);
    assert.equal(g.context.screenMode,'mobileSettings');
  }
});

test('control edits save and restore, and size controls actually change radii',()=>{
  const g=game();const before=g.run('getMobileControlLayout().joystick.r');
  g.run('mobileControlSettings.joystickScale=.8;mobileControlSettings.attackX=.8;mobileControlSettings.attackY=.8;saveMobileControlSettings();mobileControlSettings=loadMobileControlSettings()');
  assert.ok(g.run('getMobileControlLayout().joystick.r')<before);
  assert.equal(g.run('mobileControlSettings.attackX'),.8);
  assert.ok(g.storage.has('zombieSurvivalMobileControls'));
});

test('control size has no upper limit',()=>{
  const g=game();
  assert.equal(g.run('clampMobileControlScale(1.38)'),1.38);
  assert.equal(g.run('clampMobileControlScale(2.5)'),2.5);
  assert.equal(g.run('clampMobileControlScale(8)'),8);
  assert.equal(g.run('clampMobileControlScale(.1)'),.72);
});

for(const input of ['mouse','touch']){
  test(`${input} difficulty selection applies and stays open until dismissed`,()=>{
    const g=game();g.context.screenMode='home';
    const click=(x,y)=>{
      if(input==='touch'){
        g.touch('touchstart',4,x,y);g.touch('touchend',4,x,y);
      }else g.context.canvas.dispatchEvent({type:'mousedown',button:0,clientX:x,clientY:y});
    };
    g.context.homeDifficultyRect={x:300,y:200,w:120,h:60};
    click(340,220);assert.equal(g.context.homeDifficultyOpen,true);
    g.context.homeDifficultyChoiceRects=['easy','medium','hard'].map((value,i)=>({value,x:200+i*110,y:100,w:100,h:80}));
    for(const index of [2,0,1,1]){
      const choice=g.context.homeDifficultyChoiceRects[index];
      click(choice.x+50,140);
      assert.equal(g.context.selectedDifficulty,choice.value);
      assert.equal(g.storage.get('zombieSurvivalDifficulty'),choice.value);
      assert.equal(g.context.homeDifficultyOpen,true);
      assert.equal(g.context.screenMode,'home');
    }
    click(10,10);assert.equal(g.context.homeDifficultyOpen,false);
    assert.equal(g.context.selectedDifficulty,'medium');
    click(340,220);assert.equal(g.context.homeDifficultyOpen,true);
    g.context.dispatchEvent({type:'keydown',key:'Escape'});
    assert.equal(g.context.homeDifficultyOpen,false);
    assert.equal(g.context.selectedDifficulty,'medium');
  });
}

test('difficulty selection stays open even when storage is unavailable',()=>{
  const g=game();g.context.screenMode='home';g.context.homeDifficultyOpen=true;
  g.context.homeDifficultyChoiceRects=[{value:'hard',x:400,y:100,w:100,h:80}];
  g.context.localStorage.setItem=()=>{throw new Error('Storage unavailable');};
  g.context.canvas.dispatchEvent({type:'mousedown',button:0,clientX:450,clientY:140});
  assert.equal(g.context.selectedDifficulty,'hard');
  assert.equal(g.context.homeDifficultyOpen,true);
});

test('settings open a category menu and return one level at a time',()=>{
  const g=game();g.run('openMobileSettings();drawMobileControlSettings()');
  assert.equal(g.run('mobileSettingsPage'),'menu');
  const entries=g.run('mobileSettingsCategoryRects');
  assert.deepEqual(Array.from(entries,c=>c.page),['view','controls']);
  const entry=entries[1];
  g.touch('touchstart',3,entry.x+40,entry.y+40);g.touch('touchend',3,entry.x+40,entry.y+40);
  assert.equal(g.run('mobileSettingsPage'),'controls');
  g.context.dispatchEvent({type:'keydown',key:'Escape'});
  assert.equal(g.context.screenMode,'mobileSettings');assert.equal(g.run('mobileSettingsPage'),'menu');
  g.context.dispatchEvent({type:'keydown',key:'Escape'});assert.equal(g.context.screenMode,'home');
});

test('attack, joystick and every skill can move and resize independently',()=>{
  const g=game();g.run('openMobileSettings();mobileSettingsPage="controls"');
  const snapshot=()=>JSON.parse(g.run('JSON.stringify(getMobileControlLayout())'));
  for(const target of ['attack','q','e','x','r','joystick']){
    const before=snapshot();
    g.run(`mobileSettingsTarget='${target}';setMobileSettingScale(1.3);moveMobileSettingControl({controlTarget:'${target}',offsetX:0,offsetY:0},{x:${target==='joystick'?200:600},y:260});saveMobileControlSettings()`);
    const after=snapshot();
    if(target!=='attack')assert.deepEqual(after.attack,before.attack);
    if(target!=='joystick')assert.deepEqual(after.joystick,before.joystick);
    for(const skill of before.skills)if(skill.key!==target)assert.deepEqual(after.skills.find(s=>s.key===skill.key),skill);
    const control=target==='attack'||target==='joystick'?after[target]:after.skills.find(s=>s.key===target);
    const original=target==='attack'||target==='joystick'?before[target]:before.skills.find(s=>s.key===target);
    assert.ok(control.r>original.r,target+' changes its own radius');
    const saved=g.run('JSON.stringify(mobileControlSettings)');
    g.run('mobileControlSettings=loadMobileControlSettings()');assert.equal(g.run('JSON.stringify(mobileControlSettings)'),saved);
  }
});

test('touching a skill selects that skill, not the basic attack group',()=>{
  const g=game();g.run('openMobileSettings();mobileSettingsPage="controls"');
  const skill=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
  const before=g.run('JSON.stringify(getMobileControlLayout().attack)');
  g.touch('touchstart',8,skill.x,skill.y);
  assert.equal(g.run('mobileSettingsTarget'),'e');
  g.touch('touchmove',8,skill.x-30,skill.y+25);g.touch('touchend',8,skill.x-30,skill.y+25);
  assert.equal(g.run('JSON.stringify(getMobileControlLayout().attack)'),before);
  assert.ok(g.run('mobileControlSettings.skills.e.x!==null'));
});

test('legacy settings migrate without coupling future skill edits',()=>{
  const g=game();g.storage.set('zombieSurvivalMobileControls',JSON.stringify({attackX:.82,attackY:.8,actionScale:1.2,joystickScale:1.1}));
  g.run('mobileControlSettings=loadMobileControlSettings()');
  assert.equal(g.run('mobileControlSettings.actionScale'),1.2);
  assert.equal(g.run('mobileControlSettings.skillAnchorX'),.82);
  assert.equal(g.run('mobileControlSettings.skills.e.scale'),1.2);
  const before=g.run('JSON.stringify(getMobileControlLayout().skills)');
  g.run('mobileSettingsTarget="attack";setMobileSettingScale(2);mobileControlSettings.attackX=.95');
  assert.equal(g.run('JSON.stringify(getMobileControlLayout().skills)'),before);
});

function loadCamera(g){
  const source=fs.readFileSync(path.join(root,'js/01-core.js'),'utf8');
  vm.runInContext(source.slice(source.indexOf('function screenToWorld()')),g.context);
}

test('pinch and plus/minus use the same saved zoom with a player-centered camera',()=>{
  const g=game();loadCamera(g);g.run('openMobileSettings();mobileSettingsPage="view"');
  const send=(type,points)=>g.context.canvas.dispatchEvent({type,preventDefault(){},changedTouches:points.map(([identifier,clientX,clientY])=>({identifier,clientX,clientY}))});
  send('touchstart',[[1,300,180]]);send('touchstart',[[2,400,180]]);
  send('touchmove',[[1,275,180],[2,425,180]]);
  assert.equal(g.run('getMobileViewZoom()'),1.5);assert.equal(g.run('getWorldViewScale()'),.62*1.5);
  assert.ok(Math.abs(g.run('(player.x-camera.x)*getWorldViewScale()')-422)<1e-8);
  assert.ok(Math.abs(g.run('(player.y-camera.y)*getWorldViewScale()')-195)<1e-8);
  send('touchend',[[1,275,180]]);send('touchend',[[2,425,180]]);
  assert.equal(g.run('mobileUiGesture'),null);assert.equal(g.run('mobileSettingsPage'),'view');
  g.run('mobileSettingsPlusRect={x:620,y:330,w:48,h:40};mobileSettingsMinusRect={x:160,y:330,w:48,h:40}');
  g.touch('touchstart',4,640,350);g.touch('touchend',4,640,350);
  assert.equal(g.run('getMobileViewZoom()'),1.6);
  g.touch('touchstart',4,180,350);g.touch('touchend',4,180,350);
  assert.equal(g.run('getMobileViewZoom()'),1.5);
  g.run('mobileControlSettings=loadMobileControlSettings()');assert.equal(g.run('getMobileViewZoom()'),1.5);
  g.context.mouse.x=422;g.context.mouse.y=195;g.run('screenToWorld()');
  assert.ok(Math.abs(g.context.mouse.worldX-g.context.player.x)<1e-8);
});

test('zoom cancellation cannot click controls and is isolated from desktop and gameplay input',()=>{
  const g=game();loadCamera(g);g.run('openMobileSettings();mobileSettingsPage="view"');
  g.touch('touchstart',1,250,180);g.touch('touchstart',2,400,180);g.touch('touchmove',2,550,180);
  g.touch('touchcancel',1,250,180);g.touch('touchend',2,550,180);
  assert.equal(g.run('mobileViewTouches.size'),0);assert.equal(g.run('mobileViewPinchConsumed'),false);
  g.context.navigator.maxTouchPoints=0;assert.equal(g.run('getWorldViewScale()'),1);
  g.context.navigator.maxTouchPoints=1;
  g.run('mobileSettingsPage="controls";mobileSettingsTarget="e";setMobileSettingScale(9)');
  assert.equal(g.run('getMobileSettingScale()'),9);
  g.run('setMobileViewZoom(.1)');assert.equal(g.run('getMobileViewZoom()'),.5);
  g.run('setMobileViewZoom(100)');assert.equal(g.run('getMobileViewZoom()'),2);
});

test('resetting one settings category leaves the other category unchanged',()=>{
  const g=game();loadCamera(g);
  g.run('mobileControlSettings.viewZoom=1.5;mobileControlSettings.skills.q.scale=2;mobileSettingsPage="controls";resetMobileSettingsPage()');
  assert.equal(g.run('getMobileViewZoom()'),1.5);assert.equal(g.run('mobileControlSettings.skills.q.scale'),1);
  g.run('mobileControlSettings.skills.q.scale=2;mobileSettingsPage="view";resetMobileSettingsPage()');
  assert.equal(g.run('getMobileViewZoom()'),1);assert.equal(g.run('mobileControlSettings.skills.q.scale'),2);
});
