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
    transcended:{}, renPlacedClones:[], renFlyingClones:[], arcZones:[], echoKnots:[], ariaSoils:[],
    REN_CLONE_THROW_RANGE:320, REN_ULTIMATE_RADIUS:429, REN_ATTACK_RANGE:216, ZERO_ATTACK_RANGE:200,
    getRenCloneCount:()=>4, arcAreaScale:()=>1, getPaladinTier:()=>0,
    getWorldViewScale:()=>.78, WORLD:{width:4000,height:4000},
    pointInRect:(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
    screenToWorld(){context.mouse.worldX=context.mouse.x/.78+context.camera.x;context.mouse.worldY=context.mouse.y/.78+context.camera.y;},
    characterSkillGuide:{default:{name:'기본 캐릭터',color:'#bb66ff'}}, getCharacterPreviewSprite:()=>null,
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
  load('03-input.js');load('08-mobile.js');load('08-mobile-targeting.js');load('04-mare.js');
  return {context,draws,storage,run:code=>vm.runInContext(code,context),touch(type,id,x,y){context.canvas.dispatchEvent({type,preventDefault(){},changedTouches:[{identifier:id,clientX:x,clientY:y}]});}};
}

test('holding is silent; dragging shows a preview; recentering hides it',()=>{
  const g=game(),button=g.run('getMobileControlLayout().skills.find(s=>s.key==="e")');
  g.touch('touchstart',7,button.x,button.y);g.run('drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
  g.touch('touchmove',7,button.x-45,button.y-5);g.run('drawMobileTargetingIndicator()');assert.ok(g.draws.length>0);
  g.draws.length=0;g.touch('touchmove',7,button.x+2,button.y);g.run('drawMobileTargetingIndicator()');assert.equal(g.draws.length,0);
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
  assert.equal(g.run('getMobileSkillTargetSpec("e")'),null); // Recast detonates, not a new location.
});

test('buffs, recall, automatic and mark detonations never invent a range',()=>{
  const g=game();
  const noAim={default:['r'],suncall:['r'],luminous:['r'],yupiter:['q','e','r'],ren:['x','e'],nightLord:['e','x','r'],zero:['e','r'],paladin:['q','r'],terra:['x'],void:['x'],carmilla:['q'],vargas:['e','r'],echo:['q','r'],aria:['q','r'],moira:['x','r'],mare:['x','r']};
  for(const [character,keys] of Object.entries(noAim))for(const key of keys){
    g.context.selectedCharacter=character;
    assert.equal(g.run(`getMobileSkillTargetSpec('${key}')`),null,character+' '+key);
    g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:0,strength:1};drawMobileTargetingIndicator()`);
    assert.equal(g.draws.length,0,character+' '+key+' draws nothing');
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

test('geometry matches cast dimensions and empowered states',()=>{
  const g=game();g.context.selectedCharacter='terra';
  assert.equal(g.run('getMobileSkillTargetSpec("r").range'),820);
  g.context.player.terraVibration=100;assert.equal(g.run('getMobileSkillTargetSpec("r").range'),940);
  g.context.selectedCharacter='arc';assert.equal(g.run('getMobileSkillTargetSpec("q").type'),'target');
  assert.equal(g.run('getMobileSkillTargetSpec("x").range'),620);
  g.context.selectedCharacter='vargas';assert.equal(g.run('getMobileSkillTargetSpec("q").type'),'self');
  g.context.selectedCharacter='mare';assert.equal(g.run('getMobileSkillTargetSpec("q").range'),420);
  assert.equal(g.run('getMobileSkillTargetSpec("q").centered'),true);
  g.context.player.mareUltimateTime=420;
  assert.equal(g.run('getMobileSkillTargetSpec("q").range'),252);
  assert.equal(g.run('getMobileSkillTargetSpec("e").type'),'rect');
});

test('all skill shapes render with finite geometry',()=>{
  const g=game();
  for(const character of ['ren','nightLord','zero','paladin','arc','terra','void','vargas','echo','aria','moira','mare','carmilla','yupiter']){
    g.context.selectedCharacter=character;g.context.player.voidMass=100;
    for(const key of ['q','e','x','r'])g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:.3,strength:.6};drawMobileTargetingIndicator()`);
    g.run('mobileSkillAim=null;mobileAttackAim={dragged:true,angle:.2,strength:.7};drawMobileTargetingIndicator()');
  }
});

test('settings stay below controls and on screen on small phones and tablets, and open via touch',()=>{
  for(const [width,height] of [[568,280],[667,320],[844,390],[1024,768],[1366,1024]]){
    const g=game();Object.assign(g.context.canvas,{width,height});g.context.screenMode='home';g.context.selectedCharacter='default';
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

test('difficulty selector stores the selected mode',()=>{
  const g=game();g.context.screenMode='home';
  g.context.homeDifficultyRect={x:300,y:200,w:120,h:60};
  g.context.canvas.dispatchEvent({type:'mousedown',button:0,clientX:340,clientY:220});
  assert.equal(g.context.homeDifficultyOpen,true);
  g.context.homeDifficultyChoiceRects=[{value:'hard',x:400,y:100,w:100,h:80}];
  g.context.canvas.dispatchEvent({type:'mousedown',button:0,clientX:450,clientY:140});
  assert.equal(g.context.selectedDifficulty,'hard');
  assert.equal(g.storage.get('zombieSurvivalDifficulty'),'hard');
  assert.equal(g.context.homeDifficultyOpen,false);
});
