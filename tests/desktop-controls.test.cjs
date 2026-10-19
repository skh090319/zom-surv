const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function game(saved){
  let now=0;
  const listeners={},canvasListeners={},storage=new Map(saved?[['zombieSurvivalDesktopControls',saved]]:[]),casts=[],draws=[];
  const c={console,Math,performance:{now:()=>now},keys:{},mouse:{down:false,x:0,y:0,worldX:1800,worldY:1000},camera:{x:500,y:600},WORLD:{width:4000,height:4000},
    player:{x:1000,y:1000,r:20,speed:3.2,bossRootTime:0,bossSlowTime:0,fireCooldown:0,luminousAttackTime:0,invincibleTime:0,regenLevel:0,reloadTime:0},
    selectedCharacter:'zero',screenMode:'game',paused:false,gameOver:false,choosingUpgrade:false,raidVictory:false,homeDifficultyOpen:false,
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},getWorldViewScale:()=>.5,createFireTrail(){},shoot(){casts.push('attack')},
    getMobileMoveVector:()=>({active:false,x:0,y:0}),getAriaMoveMultiplier:()=>1,isMobilePortraitMode:()=>false,
    addEventListener:(type,fn,capture)=>(listeners[type]||=[])[capture?'unshift':'push'](fn),
    ctx:new Proxy({},{get:(o,k)=>o[k]||((...args)=>draws.push([k,...args]))}),
    canvas:{width:1000,height:600,getBoundingClientRect:()=>({left:50,top:30,width:500,height:300}),addEventListener:(type,fn)=>(canvasListeners[type]||=[]).push(fn)},
    pointInRect:()=>false,pauseButtonRect:{},reload(){casts.push('reload')}
  };
  for(const character of ['Suncall','NightLord','Zero','Paladin','Arc','Terra','Void','Carmilla','Vargas','Aria','Moira','Mare','NullZero','Astra','Lush','Oblivion']){
    for(const key of ['Q','E','X','R'])c['activate'+character+key]=()=>casts.push(character+key);
  }
  Object.assign(c,{activateYupiterSkill:()=>casts.push('YupiterE'),activateYupiterUltimate:()=>casts.push('YupiterR'),deployRenShadow:()=>casts.push('RenQ'),teleportToLatestRenShadow:()=>casts.push('RenX'),activateRenSkill:()=>casts.push('RenE'),activateRenUltimate:()=>casts.push('RenR'),replayEchoMemory:()=>casts.push('EchoQ'),activateEchoPhase:()=>casts.push('EchoE'),activateEchoCollapse:()=>casts.push('EchoR')});
  vm.createContext(c);const run=s=>vm.runInContext(s,c),load=file=>run(fs.readFileSync('js/'+file,'utf8'));
  load('03-input.js');load('06-entities-update.js');
  const key=(key,repeat=false)=>{let stopped=false;const e={key,repeat,stopImmediatePropagation(){stopped=true;}};for(const fn of listeners.keydown){if(stopped)break;fn(e);}};
  const click=(x,y,button=2)=>{const event={button,clientX:x,clientY:y,preventDefault(){this.prevented=true;}};for(const fn of canvasListeners.mousedown)fn(event);return event;};
  const move=(x,y,buttons=2)=>{for(const fn of canvasListeners.mousemove)fn({clientX:x,clientY:y,buttons,preventDefault(){}});};
  const release=(x,y,button=2,outside=false)=>{const e={button,clientX:x,clientY:y,preventDefault(){}};if(!outside)for(const fn of canvasListeners.mouseup||[])fn(e);for(const fn of listeners.mouseup||[])fn(e);};
  return{c,run,load,key,click,move,release,casts,draws,listeners,storage,time:ms=>{now+=ms;}};
}
test('WASD is the default, old skills are unchanged, and saved modes safely reload',()=>{
  for(const value of [undefined,'bad','wasd'])assert.equal(game(value).run('desktopControlMode'),'wasd');
  assert.equal(game('rightClick').run('desktopControlMode'),'rightClick');
  const g=game();g.c.keys.w=true;g.run('updatePlayer()');assert.equal(g.c.player.y,996.8);
  for(const key of ['q','e','x','r'])g.key(key);assert.deepEqual(g.casts,['ZeroQ','ZeroE','ZeroX','ZeroR']);
  g.click(200,120);assert.equal(g.run('desktopMoveTarget'),null);
});
test('right click maps client coordinates through canvas size, zoom and camera, and cannot shoot',()=>{
  const g=game('rightClick'),e=g.click(200,130);
  assert.equal(e.prevented,true);assert.equal(g.run('desktopMoveTarget.x'),1100);assert.equal(g.run('desktopMoveTarget.y'),1000);
  g.c.keys.w=true;g.c.keys.d=true;g.run('updatePlayer()');assert.equal(g.c.player.y,1000);assert.equal(g.c.player.x,1003.2);assert.deepEqual(g.casts,[]);
});
test('point movement reaches the exact point without overshoot, jitter, or changing aim',()=>{
  for(const speed of [.2,3.2,70]){
    const g=game('rightClick');g.c.player.speed=speed;g.click(200,130);
    const aim=JSON.stringify(g.c.mouse);g.run('for(let i=0;i<700;i++)updatePlayer()');
    assert.equal(g.c.player.x,1100);assert.equal(g.c.player.y,1000);assert.equal(g.run('desktopMoveTarget'),null);assert.equal(JSON.stringify(g.c.mouse),aim);
    g.run('for(let i=0;i<20;i++)updatePlayer()');assert.equal(g.c.player.x,1100);
  }
});
test('blocked screens cannot set destinations; root pauses travel, bounds clamp, and blur clears input',()=>{
  for(const state of ['paused','gameOver','choosingUpgrade','raidVictory']){
    const g=game('rightClick');g.c[state]=true;g.click(200,130);assert.equal(g.run('desktopMoveTarget'),null);
  }
  const g=game('rightClick');g.c.screenMode='home';g.click(200,130);assert.equal(g.run('desktopMoveTarget'),null);g.c.screenMode='game';
  g.click(200,130);g.c.player.bossRootTime=30;g.run('updatePlayer()');assert.equal(g.c.player.x,1000);assert.ok(g.run('desktopMoveTarget'));
  g.c.player.bossRootTime=0;g.run('updatePlayer()');assert.ok(g.c.player.x>1000);
  g.click(9999,-9999);assert.equal(g.run('desktopMoveTarget.x'),3980);assert.equal(g.run('desktopMoveTarget.y'),20);
  for(const fn of g.listeners.blur)fn();assert.equal(g.run('desktopMoveTarget'),null);
});
test('changing mode clears destinations and keys, persists, and cannot combine movement types',()=>{
  const g=game('rightClick');g.click(200,130);g.c.keys.w=true;g.run("setDesktopControlMode('wasd')");
  assert.equal(g.run('desktopMoveTarget'),null);assert.equal(g.c.keys.w,false);assert.equal(g.storage.get('zombieSurvivalDesktopControls'),'wasd');
  g.run('updatePlayer()');assert.equal(g.c.player.x,1000);g.c.keys.w=true;g.run('updatePlayer()');assert.equal(g.c.player.y,996.8);
  g.run("setDesktopControlMode('rightClick');updatePlayer()");assert.equal(g.c.player.y,996.8);
});
test('all regular characters use QWER in skill order with no legacy X activation or repeat double casts',()=>{
  for(const character of ['suncall','nightLord','zero','paladin','arc','terra','void','vargas','aria','moira','mare','nullZero','astra']){
    const g=game('rightClick');g.c.selectedCharacter=character;for(const key of ['q','w','e','r','x'])g.key(key);
    assert.equal(g.casts.length,4,character);assert.deepEqual(g.casts.map(s=>s.at(-1)),['Q','E','X','R']);
    g.key('w',true);assert.equal(g.casts.length,4);
    assert.equal(g.run("['q','e','x','r'].map(k=>getSkillHotkey(k)).join('')"),'QWER');
  }
});
test('Ren maps by displayed skill order; characters with fewer skills keep the ultimate on R',()=>{
  const g=game('rightClick');g.c.selectedCharacter='ren';for(const k of ['q','w','e','r'])g.key(k);
  assert.deepEqual(g.casts,['RenQ','RenX','RenE','RenR']);assert.equal(g.run("formatSkillControlText('Q · 분신 / X · 귀환 / E · 습격 / R · 궁')"),'Q · 분신 / W · 귀환 / E · 습격 / R · 궁');
  g.casts.length=0;g.c.selectedCharacter='yupiter';for(const k of ['q','w','e','r'])g.key(k);assert.deepEqual(g.casts,['YupiterE','YupiterR']);
  g.casts.length=0;g.c.selectedCharacter='echo';for(const k of ['q','w','e','r'])g.key(k);assert.deepEqual(g.casts,['EchoQ','EchoE','EchoR']);
});
test('capture-phase LusH and Oblivion hooks resolve bindings once and preserve touch skill IDs',()=>{
  for(const [file,character,name] of [['12-lush-integration.js','lush','Lush'],['16-oblivion-integration.js','oblivion','Oblivion']]){
    const g=game('rightClick');g.c.selectedCharacter=character;
    const source=fs.readFileSync('js/'+file,'utf8'),start=source.indexOf("addEventListener('keydown',e=>{"),end=source.indexOf('},true);',start)+8;
    g.run(source.slice(start,end));for(const k of ['q','w','e','r','x'])g.key(k);
    assert.deepEqual(g.casts,['Q','E','X','R'].map(k=>name+k));
    const event={key:'e',gameSkillKey:'e',stopImmediatePropagation(){}};g.listeners.keydown[0](event);assert.equal(g.casts.at(-1),name+'E');
  }
});
test('shared skill HUD emits the selected hotkeys, leaving names and empty resource labels intact',()=>{
  const g=game('rightClick'),source=fs.readFileSync('js/08-ui.js','utf8');g.run(source.slice(source.indexOf('function drawSkillHudLabel('),source.indexOf('function drawYupiterHudLabel(')));
  for(const k of ['Q','E','X','R',''])g.run(`drawSkillHudLabel(20,30,'스킬','${k}')`);
  assert.deepEqual(g.draws.filter(d=>d[0]==='fillText').map(d=>d[1]),['스킬','Q','스킬','W','스킬','E','스킬','R','스킬','']);
});
test('mobile joystick overrides destinations while Mare point movement keeps its speed and stops at arrival',()=>{
  const g=game('rightClick');g.c.selectedCharacter='mare';g.c.player.mareUltimateTime=100;g.c.player.mareChargeTime=0;g.click(200,130);
  g.run('updatePlayer()');assert.equal(g.c.player.x,1006);g.run('for(let i=0;i<30;i++)updatePlayer()');assert.equal(g.c.player.x,1100);assert.equal(g.run('desktopMoveTarget'),null);
  g.click(220,130);g.c.getMobileMoveVector=()=>({active:true,x:0,y:-1});g.run('updatePlayer()');assert.equal(g.run('desktopMoveTarget'),null);assert.equal(g.c.player.x,1100);assert.equal(g.c.player.y,996.8);
});

test('a short right click remains a fixed world destination after camera movement',()=>{
  const g=game('rightClick');g.click(200,130);g.time(30);g.release(200,130);
  assert.equal(g.run('desktopMoveHold'),null);g.c.camera.x+=100;g.run('updatePlayer()');
  assert.equal(g.run('desktopMoveTarget.x'),1100);assert.equal(g.run('desktopMoveTarget.y'),1000);
});
test('holding right click follows the latest cursor and reprojects a stationary cursor with camera motion',()=>{
  const g=game('rightClick');g.click(200,130);g.time(200);g.run('updatePlayer()');
  assert.equal(g.run('desktopMoveHold.tracking'),true);assert.equal(g.run('desktopMoveTarget.x'),1100);
  g.c.camera.x+=100;g.run('updatePlayer()');assert.equal(g.run('desktopMoveTarget.x'),1200);
  const before={...g.c.player};g.move(100,200);g.run('updatePlayer()');
  assert.equal(g.run('desktopMoveTarget.x'),800);assert.equal(g.run('desktopMoveTarget.y'),1280);
  assert.ok(g.c.player.x<before.x);assert.ok(g.c.player.y>before.y);assert.deepEqual(g.casts,[]);
});
test('hold can continue past the original clicked location without any further mousemove events',()=>{
  const g=game('rightClick');g.click(200,130);g.time(200);
  for(let i=0;i<100;i++){g.run('updatePlayer()');g.c.camera.x=g.c.player.x-500;}
  assert.ok(g.c.player.x>1300);assert.ok(g.run('desktopMoveTarget.x')>g.c.player.x);assert.deepEqual(g.casts,[]);
});
test('releasing a held right button freezes its final destination, including release outside the canvas',()=>{
  for(const outside of [false,true]){
    const g=game('rightClick');g.click(200,130);g.time(200);g.run('updatePlayer()');g.release(220,150,2,outside);
    assert.equal(g.run('desktopMoveHold'),null);assert.equal(g.run('desktopMoveTarget.x'),1180);assert.equal(g.run('desktopMoveTarget.y'),1080);
    g.c.camera.x+=100;g.move(50,50,0);g.run('updatePlayer()');assert.equal(g.run('desktopMoveTarget.x'),1180);
  }
});
test('left attack and QWER casting remain independent while the right button is held',()=>{
  const g=game('rightClick');g.click(200,130);g.time(200);g.c.mouse.down=true;g.key('w');g.run('updatePlayer()');
  assert.deepEqual(g.casts,['ZeroE','attack']);g.release(200,130);assert.equal(g.c.mouse.down,true);
  g.release(200,130,0);assert.equal(g.c.mouse.down,false);
});
test('mode changes, blur, mobile movement and lost-button mousemove cancel held tracking',()=>{
  for(const action of ['mode','blur','mobile','lost']){
    const g=game('rightClick');g.click(200,130);g.time(200);g.run('updatePlayer()');
    if(action==='mode')g.run("setDesktopControlMode('wasd')");
    if(action==='blur')for(const fn of g.listeners.blur)fn();
    if(action==='mobile'){g.c.getMobileMoveVector=()=>({active:true,x:0,y:1});g.run('updatePlayer()');}
    if(action==='lost')g.move(200,130,0);
    assert.equal(g.run('desktopMoveHold'),null,action);
  }
});
