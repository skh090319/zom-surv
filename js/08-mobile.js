// 모바일 가로 화면 전용 조작 UI와 터치 입력

let mobileJoystickTouchId = null;
let mobileAttackTouchId = null;
let mobileMoveX = 0;
let mobileMoveY = 0;
let mobileStickX = 0;
let mobileStickY = 0;
let mobileJoystickOrigin = null;
let mobileAttackAim = null;
let mobileSkillAim = null;
let mobileUiGesture = null;
let mobileScrollVelocity = 0;
let mobileScrollFrame = 0;
let mobileSettingsHomeRect = {x:0,y:0,w:0,h:0};
let mobileSettingsBackRect = {x:0,y:0,w:0,h:0};
let mobileSettingsResetRect = {x:0,y:0,w:0,h:0};
const MOBILE_CONTROL_DEFAULTS={joystickX:null,joystickY:null,attackX:null,attackY:null,joystickScale:1,actionScale:1,viewZoom:1,skillAnchorX:null,skillAnchorY:null,skillAnchorScale:1};
let mobileControlSettings=loadMobileControlSettings();

function loadMobileControlSettings(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem("zombieSurvivalMobileControls")||"null")||{};}catch(error){}
  const settings={...MOBILE_CONTROL_DEFAULTS,skills:{},hud:{},version:2};
  const position=value=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):null;
  for(const key of ["joystickX","joystickY","attackX","attackY"])settings[key]=position(saved[key]);
  for(const key of ["joystickScale","actionScale"])settings[key]=clampMobileControlScale(saved[key]);
  settings.viewZoom=clampMobileViewZoom(saved.viewZoom);
  // Keep the old skill formation, then decouple it from basic-attack edits.
  settings.skillAnchorX=position(saved.version===2?saved.skillAnchorX:saved.attackX);
  settings.skillAnchorY=position(saved.version===2?saved.skillAnchorY:saved.attackY);
  settings.skillAnchorScale=clampMobileControlScale(saved.version===2?saved.skillAnchorScale:saved.actionScale);
  for(const key of ["q","e","x","r"]){
    const skill=saved.skills?.[key]||{};
    settings.skills[key]={x:position(skill.x),y:position(skill.y),scale:clampMobileControlScale(skill.scale??settings.skillAnchorScale)};
  }
  for(const key of ["health","exp","boss","timer","resource","pause"]){
    const item=saved.hud?.[key]||{};
    settings.hud[key]={x:position(item.x),y:position(item.y),scale:Math.max(.2,Number.isFinite(item.scale)?item.scale:1)};
  }
  return settings;
}
function saveMobileControlSettings(){if(typeof recordMobileSettingsHistory==='function')recordMobileSettingsHistory();try{localStorage.setItem("zombieSurvivalMobileControls",JSON.stringify(mobileControlSettings));}catch(error){}}
function clampMobileControlScale(value){return Math.max(.72,Number.isFinite(value)?value:1);}
function clampMobileViewZoom(value){return Math.max(.5,Math.min(2,Number.isFinite(value)?value:1));}
function getMobileViewZoom(){return clampMobileViewZoom(mobileControlSettings.viewZoom);}
function fitMobileControlCenter(value,r,min,max){const inset=Math.min(r,Math.max(0,(max-min)/2));return Math.max(min+inset,Math.min(max-inset,value));}

const MOBILE_SKILL_KEYS = {
  suncall:["q","e","x","r"],yupiter:["q","e","r"],ren:["q","x","e","r"],
  nightLord:["q","e","x","r"],zero:["q","e","x","r"],paladin:["q","e","x","r"],arc:["q","e","x","r"],
  terra:["q","e","x","r"],void:["q","e","x","r"],carmilla:["q"],vargas:["q","e","x","r"],
  echo:["q","e","r"],aria:["q","e","x","r"],moira:["q","e","x","r"],mare:["q","e","x","r"],nullZero:["q","e","x","r"],astra:["q","e","x","r"]
};

function isMobileTouchDevice(){return (navigator.maxTouchPoints>0&&(matchMedia("(pointer: coarse)").matches||matchMedia("(any-pointer: coarse)").matches))||new URLSearchParams(location.search).has("mobile");}
function isMobilePortraitMode(){return isMobileTouchDevice()&&canvas.height>canvas.width;}

function getMobileControlLayout(){
  const minSide=Math.min(canvas.width,canvas.height),joyR=Math.max(42,Math.min(58,minSide*.115))*mobileControlSettings.joystickScale,attackR=Math.max(34,Math.min(48,minSide*.088))*mobileControlSettings.actionScale,safe=Math.max(14,minSide*.03);
  const defaultJoystick={x:mobileControlSettings.joystickX===null?safe+joyR:canvas.width*mobileControlSettings.joystickX,y:mobileControlSettings.joystickY===null?canvas.height-safe-joyR:canvas.height*mobileControlSettings.joystickY};
  const joystick={x:mobileJoystickOrigin?.x??defaultJoystick.x,y:mobileJoystickOrigin?.y??defaultJoystick.y,r:joyR};
  const attack={x:mobileControlSettings.attackX===null?canvas.width-safe-attackR:canvas.width*mobileControlSettings.attackX,y:mobileControlSettings.attackY===null?canvas.height-safe-attackR:canvas.height*mobileControlSettings.attackY,r:attackR};
  const keys=MOBILE_SKILL_KEYS[selectedCharacter]||[];
  const angles=keys.length===1?[-2.15]:keys.length===2?[-2.65,-1.7]:keys.length===3?[-2.85,-2.15,-1.45]:[-3.02,-2.52,-2.02,-1.52];
  const anchorScale=mobileControlSettings.skillAnchorScale,anchorR=Math.max(34,Math.min(48,minSide*.088))*anchorScale;
  const orbit=anchorR+Math.max(42,Math.min(58,minSide*.09))*anchorScale,baseSkillR=Math.max(20,Math.min(28,minSide*.052));
  const anchorX=Math.max(canvas.width*.5+orbit+baseSkillR*anchorScale,Math.min(canvas.width-safe-anchorR,mobileControlSettings.skillAnchorX===null?canvas.width-safe-anchorR:canvas.width*mobileControlSettings.skillAnchorX));
  const maxAnchorY=canvas.height-safe-anchorR;
  const anchorY=Math.max(Math.min(maxAnchorY,118+orbit+baseSkillR*anchorScale),Math.min(maxAnchorY,mobileControlSettings.skillAnchorY===null?maxAnchorY:canvas.height*mobileControlSettings.skillAnchorY));
  joystick.x=fitMobileControlCenter(joystick.x,joyR,safe,canvas.width*.45);
  joystick.y=fitMobileControlCenter(joystick.y,joyR,118,canvas.height-safe);
  attack.x=fitMobileControlCenter(attack.x,attackR,canvas.width*.5,canvas.width-safe);
  attack.y=fitMobileControlCenter(attack.y,attackR,118,canvas.height-safe);
  const skills=keys.map((key,index)=>{
    const saved=mobileControlSettings.skills[key],r=baseSkillR*saved.scale;
    return{key,r,x:fitMobileControlCenter(saved.x===null?anchorX+Math.cos(angles[index])*orbit:canvas.width*saved.x,r,safe,canvas.width-safe),y:fitMobileControlCenter(saved.y===null?anchorY+Math.sin(angles[index])*orbit:canvas.height*saved.y,r,116,canvas.height-safe)};
  });
  return {joystick,attack,skills};
}

function getMobileMoveVector(){return {active:mobileJoystickTouchId!==null,x:mobileMoveX,y:mobileMoveY};}

// This is a screen-space drop target, independent of skill range or camera zoom.
function getMobileSkillCancelButton(layout=getMobileControlLayout()){
  const skills=layout.skills;if(!skills.length)return null;
  const r=Math.max(26,Math.min(34,Math.min(canvas.width,canvas.height)*.07)),margin=16;
  const left=Math.min(...skills.map(s=>s.x-s.r)),right=Math.max(...skills.map(s=>s.x+s.r));
  const top=Math.min(...skills.map(s=>s.y-s.r));
  const fitX=x=>Math.max(r+margin,Math.min(canvas.width-r-margin,x));
  const preferred=fitX((left+right)/2),y=Math.max(r+margin,Math.min(canvas.height-r-margin,top-r-24));
  // Custom skills may sit near the top HUD. Stay above them, moving sideways
  // into free space if needed instead of pushing the cancel target onto a skill.
  const hpW=Math.min(520,canvas.width-80),blockers=[{x:(canvas.width-hpW)/2-5,y:13,w:hpW+10,h:34},
    {x:canvas.width/2-52,y:48,w:104,h:32},pauseButtonRect];
  let x=preferred,best=Infinity;
  for(const candidate of [preferred,fitX(left-r-24),fitX(right+r+24),fitX(margin+r),fitX(canvas.width-margin-r)]){
    let score=Math.abs(candidate-preferred);
    for(const rect of blockers){
      if(!rect?.w||!rect?.h)continue;
      const dx=candidate-Math.max(rect.x,Math.min(rect.x+rect.w,candidate)),dy=y-Math.max(rect.y,Math.min(rect.y+rect.h,y));
      if(Math.hypot(dx,dy)<r+10)score+=10000;
    }
    for(const skill of skills)if(Math.hypot(candidate-skill.x,y-skill.y)<r+skill.r+12)score+=10000;
    if(score<best){best=score;x=candidate;}
  }
  return {x,y,r};
}
function mobileSkillOverCancel(p){
  if(!mobileSkillAim?.dragged)return false;
  const button=getMobileSkillCancelButton();
  return Boolean(button&&pointInCircle(p,{...button,r:button.r+9}));
}
function cancelMobileSkillAim(){
  mobileSkillAim=null;
  if(mobileAttackTouchId!==null)updateMobileAttackAim();
}

function updateMobileJoystick(x,y){
  const joy=getMobileControlLayout().joystick,dx=x-joy.x,dy=y-joy.y,d=Math.hypot(dx,dy),limit=joy.r*.62,clamped=Math.min(d,limit),nx=d?dx/d:0,ny=d?dy/d:0;
  mobileStickX=nx*clamped;mobileStickY=ny*clamped;mobileMoveX=nx*Math.min(1,d/limit);mobileMoveY=ny*Math.min(1,d/limit);
}

function releaseMobileJoystick(){mobileJoystickTouchId=null;mobileMoveX=0;mobileMoveY=0;mobileStickX=0;mobileStickY=0;mobileJoystickOrigin=null;}

function updateMobileAttackAim(force=false){
  if(!force&&mobileSkillAim?.dragged&&!mobileSkillAim.cancelHover){applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec(mobileSkillAim.key));return;}
  if(mobileAttackTouchId===null&&!force)return;
  if(mobileAttackAim?.dragged&&!force){applyMobileDragAim(mobileAttackAim,getMobileAttackTargetSpec());return;}
  let target=null,best=Infinity;
  for(const enemy of zombies){if(!enemy||enemy.hp<=0||enemy.astraControl)continue;const d=(enemy.x-player.x)**2+(enemy.y-player.y)**2;if(d<best){best=d;target=enemy;}}
  const viewScale=getWorldViewScale();mouse.x=target?(target.x-camera.x)*viewScale:(player.x-camera.x)*viewScale+180;mouse.y=target?(target.y-camera.y)*viewScale:(player.y-camera.y)*viewScale;screenToWorld();
}

function updateMobileDragAim(state,p,spec){
  const dx=p.x-state.startX,dy=p.y-state.startY,d=Math.hypot(dx,dy);
  state.currentX=p.x;state.currentY=p.y;state.dragged=d>=10;
  if(state===mobileSkillAim){state.cancelHover=mobileSkillOverCancel(p);if(state.cancelHover)return;}
  if(!state.dragged)return;
  state.angle=Math.atan2(dy,dx);
  state.strength=Math.min(1,d/Math.max(62,Math.min(canvas.width,canvas.height)*.2));
  applyMobileDragAim(state,spec);
}

function applyMobileDragAim(state,spec){
  if(!spec||spec.aim===false||!state.dragged||state.cancelHover)return;
  const target=getMobileAimPoint(state,spec),scale=getWorldViewScale();
  mouse.x=(target.x-camera.x)*scale;mouse.y=(target.y-camera.y)*scale;screenToWorld();
}

function triggerMobileSkill(key,keepAim=false){
  if(!keepAim)updateMobileAttackAim(true);
  dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true}));
  dispatchEvent(new KeyboardEvent("keyup",{key,bubbles:true}));
}

function dispatchMobileCanvasClick(p){
  const rect=canvas.getBoundingClientRect();
  mouse.x=p.x;mouse.y=p.y;
  canvas.dispatchEvent(new MouseEvent("mousedown",{clientX:rect.left+p.x*rect.width/canvas.width,clientY:rect.top+p.y*rect.height/canvas.height,button:0,bubbles:true}));
  canvas.dispatchEvent(new MouseEvent("mouseup",{clientX:rect.left+p.x*rect.width/canvas.width,clientY:rect.top+p.y*rect.height/canvas.height,button:0,bubbles:true}));
}

function openMobileCharacterDetail(p){
  if(screenMode!=="character"||characterDetailId)return false;
  const card=characterCards.find(item=>pointInRect(p.x,p.y,item));if(!card)return false;
  characterDetailId=card.id;characterDetailOpenedAt=performance.now();characterDetailSkillIndex=0;mouse.down=false;return true;
}

function stopMobileScrollInertia(){
  if(mobileScrollFrame)cancelAnimationFrame(mobileScrollFrame);
  mobileScrollFrame=0;mobileScrollVelocity=0;
}

function setMobileScroll(value){
  if(screenMode==="character"&&!characterDetailId)characterScrollY=Math.max(0,Math.min(characterScrollMax,value));
  else if(screenMode==="guide")guideScrollY=Math.max(0,Math.min(guideScrollMax,value));
}

function getMobileScroll(){
  if(screenMode==="character"&&!characterDetailId)return characterScrollY;
  if(screenMode==="guide")return guideScrollY;
  return 0;
}

function startMobileScrollInertia(){
  if(Math.abs(mobileScrollVelocity)<.45)return;
  const mode=screenMode;
  const glide=()=>{
    if(screenMode!==mode||Math.abs(mobileScrollVelocity)<.18){stopMobileScrollInertia();return;}
    const before=getMobileScroll();setMobileScroll(before+mobileScrollVelocity);
    if(getMobileScroll()===before)mobileScrollVelocity*=.45;
    else mobileScrollVelocity*=.92;
    mobileScrollFrame=requestAnimationFrame(glide);
  };
  mobileScrollFrame=requestAnimationFrame(glide);
}

function canvasTouchPoint(touch){const rect=canvas.getBoundingClientRect();return{x:(touch.clientX-rect.left)*canvas.width/rect.width,y:(touch.clientY-rect.top)*canvas.height/rect.height};}
function pointInCircle(p,c){return Math.hypot(p.x-c.x,p.y-c.y)<=c.r;}
canvas.addEventListener("touchstart",event=>{
  event.preventDefault();
  if(isMobilePortraitMode())return;
  if(screenMode==="mobileSettings"&&mobileSettingsPage==="view"&&handleMobileViewTouches(event))return;
  if(screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory){
    const t=event.changedTouches[0],p=canvasTouchPoint(t);
    stopMobileScrollInertia();
    mobileUiGesture={id:t.identifier,startX:p.x,startY:p.y,lastY:p.y,lastTime:performance.now(),moved:false,longPressed:false};
    if(screenMode==="mobileSettings"){
      Object.assign(mobileUiGesture,beginMobileSettingDrag(p));
    }
    if(screenMode==="character"&&!characterDetailId){mobileUiGesture.longTimer=setTimeout(()=>{if(mobileUiGesture&&!mobileUiGesture.moved){mobileUiGesture.longPressed=openMobileCharacterDetail(p);}},520);}
    return;
  }
  const layout=getMobileControlLayout();
  for(const touch of event.changedTouches){const p=canvasTouchPoint(touch);
    if(pointInRect(p.x,p.y,pauseButtonRect)){dispatchMobileCanvasClick(p);continue;}
    // Also allow a second finger to tap X while the skill finger stays held.
    if(mobileSkillOverCancel(p)){cancelMobileSkillAim();continue;}
    const skill=layout.skills.find(button=>pointInCircle(p,{...button,r:button.r*1.48}));if(skill&&mobileSkillAim===null){mobileSkillAim={touchId:touch.identifier,key:skill.key,startX:p.x,startY:p.y,currentX:p.x,currentY:p.y,dragged:false};updateMobileAttackAim(true);continue;}
    if(mobileAttackTouchId===null&&pointInCircle(p,{...layout.attack,r:layout.attack.r*1.42})){mobileAttackTouchId=touch.identifier;mobileAttackAim={startX:p.x,startY:p.y,currentX:p.x,currentY:p.y,dragged:false};mouse.down=true;updateMobileAttackAim();continue;}
    const nearJoystick=pointInCircle(p,{...layout.joystick,r:layout.joystick.r*2.25})||(p.x<canvas.width*.38&&p.y>canvas.height*.42);
    if(mobileJoystickTouchId===null&&nearJoystick){const r=layout.joystick.r,safe=14;mobileJoystickOrigin={x:Math.max(safe+r,Math.min(canvas.width*.42-r,p.x)),y:Math.max(canvas.height*.42+r,Math.min(canvas.height-safe-r,p.y))};mobileJoystickTouchId=touch.identifier;updateMobileJoystick(p.x,p.y);continue;}
    if(pointInRect(p.x,p.y,pauseButtonRect))dispatchMobileCanvasClick(p);
  }
},{passive:false});

canvas.addEventListener("touchmove",event=>{
  event.preventDefault();
  if(screenMode==="mobileSettings"&&mobileSettingsPage==="view"&&handleMobileViewTouches(event))return;
  for(const touch of event.changedTouches){
    const p=canvasTouchPoint(touch);
    if(touch.identifier===mobileJoystickTouchId){updateMobileJoystick(p.x,p.y);continue;}
    if(touch.identifier===mobileAttackTouchId&&mobileAttackAim){updateMobileDragAim(mobileAttackAim,p,getMobileAttackTargetSpec());continue;}
    if(mobileSkillAim&&touch.identifier===mobileSkillAim.touchId){updateMobileDragAim(mobileSkillAim,p,getMobileSkillTargetSpec(mobileSkillAim.key));continue;}
    if(!mobileUiGesture||touch.identifier!==mobileUiGesture.id)continue;
    const now=performance.now(),total=Math.hypot(p.x-mobileUiGesture.startX,p.y-mobileUiGesture.startY);
    if(total>7){mobileUiGesture.moved=true;clearTimeout(mobileUiGesture.longTimer);}
    if(screenMode==="mobileSettings"&&mobileUiGesture.controlTarget){
      if(mobileUiGesture.moved)moveMobileSettingControl(mobileUiGesture,p);
      continue;
    }
    const dy=p.y-mobileUiGesture.lastY,dt=Math.max(8,now-mobileUiGesture.lastTime),delta=-dy;
    mobileUiGesture.lastY=p.y;mobileUiGesture.lastTime=now;
    mobileScrollVelocity=mobileScrollVelocity*.55+(delta*(16.67/dt))*.45;setMobileScroll(getMobileScroll()+delta);
  }
},{passive:false});

function endMobileTouches(event){
  event.preventDefault();
  if(screenMode==="mobileSettings"&&mobileSettingsPage==="view"&&handleMobileViewTouches(event))return;
  const cancelled=event.type==="touchcancel";
  for(const touch of event.changedTouches){
    if(touch.identifier===mobileJoystickTouchId)releaseMobileJoystick();
    if(touch.identifier===mobileAttackTouchId){mobileAttackTouchId=null;mobileAttackAim=null;mouse.down=false;}
    if(mobileSkillAim&&touch.identifier===mobileSkillAim.touchId){
      if(!cancelled)updateMobileDragAim(mobileSkillAim,canvasTouchPoint(touch),getMobileSkillTargetSpec(mobileSkillAim.key));
      if(!cancelled&&!mobileSkillAim.cancelHover&&screenMode==="game"&&!paused&&!choosingUpgrade&&!gameOver&&!raidVictory){
        const spec=getMobileSkillTargetSpec(mobileSkillAim.key);
        if(mobileSkillAim.dragged)applyMobileDragAim(mobileSkillAim,spec);
        else if(spec)updateMobileAttackAim(true);
        triggerMobileSkill(mobileSkillAim.key,true);
      }
      cancelMobileSkillAim();
    }
    if(mobileUiGesture&&touch.identifier===mobileUiGesture.id){
      clearTimeout(mobileUiGesture.longTimer);
      const p=canvasTouchPoint(touch),shouldGlide=!cancelled&&mobileUiGesture.moved&&!mobileUiGesture.controlTarget;
      if(screenMode==="mobileSettings"){
        if(mobileUiGesture.controlTarget)saveMobileControlSettings();
        else if(!cancelled&&!mobileUiGesture.moved)handleMobileSettingsTap(p);
      }else if(!cancelled&&!mobileUiGesture.moved&&!mobileUiGesture.longPressed)dispatchMobileCanvasClick(p);
      mobileUiGesture=null;if(shouldGlide)startMobileScrollInertia();
    }
  }
}
canvas.addEventListener("touchend",endMobileTouches,{passive:false});canvas.addEventListener("touchcancel",endMobileTouches,{passive:false});
addEventListener("orientationchange",()=>{releaseMobileJoystick();mobileAttackTouchId=null;mobileAttackAim=null;mobileSkillAim=null;mobileUiGesture=null;resetMobileSettingsGestures();mouse.down=false;});

// Settings work with touch, a stylus or a mouse attached to a tablet.
let mobileSettingsMouseDrag=null;
canvas.addEventListener("mousedown",event=>{
  if(event.button!==0||screenMode!=="mobileSettings")return;
  const p=canvasTouchPoint(event);mobileSettingsMouseDrag=beginMobileSettingDrag(p);
  if(!mobileSettingsMouseDrag)handleMobileSettingsTap(p);
});
canvas.addEventListener("mousemove",event=>{
  if(screenMode==="mobileSettings"&&mobileSettingsMouseDrag)moveMobileSettingControl(mobileSettingsMouseDrag,canvasTouchPoint(event));
});
addEventListener("mouseup",()=>{if(mobileSettingsMouseDrag)saveMobileControlSettings();mobileSettingsMouseDrag=null;});

function getMobileSkillIcon(key){
  const index={q:0,e:1,x:2,r:3}[key]??0;
  if(selectedCharacter==='suncall')return {atlas:suncallSkillIconAtlas,index};
  if(selectedCharacter==="yupiter"){if(key==="q")return{image:[crescentBladeSprite,severingBladeSprite,flameCannonSprite][player.yupiterWeapon]};if(key==="e")return{image:yupiterESkillIcons[player.yupiterWeapon]};if(key==="r")return{image:yupiterUltimateIcon};}
  if(selectedCharacter==="ren")return{image:renSkillIcons[{q:0,x:1,e:2,r:3}[key]]};
  if(selectedCharacter==="nightLord")return{image:nightLordSkillIcons[index]};if(selectedCharacter==="zero")return{image:zeroSkillIcons[index]};if(selectedCharacter==="paladin")return{image:paladinSkillIcons[index]};
  const atlases={arc:arcSkillIconAtlas,terra:terraSkillIconAtlas,void:voidSkillIconAtlas,carmilla:carmillaSkillIconAtlas,vargas:vargasSkillIconAtlas,echo:echoSkillIconAtlas,aria:ariaSkillIconAtlas,moira:moiraSkillIconAtlas,mare:mareSkillIconAtlas,nullZero:nullZeroSkillIconAtlas,astra:astraSkillIconAtlas};
  return atlases[selectedCharacter]?{atlas:atlases[selectedCharacter],index}:null;
}

function getMobileSkillName(key){
  const names={
    suncall:{q:'서리창',e:'뇌전 회로',x:'결정 회수',r:'백야의 뇌폭'},
    ren:{q:"분신 배치",x:"그림자 이동",e:"분신 습격",r:"그림자 지대"},nightLord:{q:"그림자 추격",e:"광란",x:"처형",r:"불사의 밤"},
    zero:{q:"참격",e:"급소",x:"심판",r:"검의 왈츠"},paladin:{q:"성스러운 반격",e:"연속 절단",x:"콤보 전환",r:"한계 돌파"},
    arc:{q:"일륜",e:"홍염 파동",x:"태양 낙하",r:"초신성"},terra:{q:"단층 붕괴",e:"암벽 융기",x:"지각 압축",r:"대륙 분쇄"},
    void:{q:"심층 포식",e:"대지 방출",x:"지반 붕괴",r:"제어 불능"},carmilla:{q:"피의 회수"},
    vargas:{q:"생명 포식",e:"혈육 갑주",x:"거신 강타",r:"불멸의 형상"},echo:{q:"절단",e:"위상 전환",r:"세계선 붕괴"},
    aria:{q:"가시 성장",e:"만개",x:"정원 이동",r:"영원한 봄"},moira:{q:"조종",e:"대리 인형",x:"고통 전이",r:"꼭두각시 극장"},
    mare:{q:player.mareUltimateTime>0?'고래 돌진':"밀물",e:player.mareUltimateTime>0?'심해 흡입':"소용돌이 핵",x:"수압",r:"세계를 삼킨 바다"},nullZero:{q:"데이터 절단",e:"격리 구역",x:"코드 복제",r:"커널 패닉"},astra:{q:astraQFlights().length?"공전성 회수":"성궤 투사",e:"중력 붕괴",x:"궤도 가속",r:"만유인력 역전"}
  };
  if(selectedCharacter==="yupiter"){if(key==="q")return"무기 전환";const weapon=["반월검","절단검","화염포"][player.yupiterWeapon]||"무기";return key==="e"?`${weapon} 강화`:`${weapon} 궁극기`;}
  return names[selectedCharacter]?.[key]||"스킬";
}

function getMobileSkillCooldown(key){
  if(selectedCharacter==='suncall')return {value:player['suncall'+key.toUpperCase()+'Cooldown']||0,max:{q:SUNCALL_Q_CD,e:SUNCALL_E_CD,x:SUNCALL_X_CD,r:SUNCALL_R_CD}[key]||1};
  if(selectedCharacter==="astra"&&key==="q"&&astraQFlights().length)return {value:0,max:ASTRA_Q_CD};
  const reloadInfo=()=>({value:player.reloadTime||0,max:90,label:"재장전"});
  if(["suncall","luminous"].includes(selectedCharacter))return key==="r"?reloadInfo():null;
  const table={
    yupiter:{q:[0,1],e:[player.yupiterSkillCooldowns[player.yupiterWeapon],YUPITER_SKILL_COOLDOWNS[player.yupiterWeapon]],r:[player.yupiterUltimateCooldown,YUPITER_ULTIMATE_COOLDOWN]},
    ren:{q:[player.renDeployCooldown,REN_DEPLOY_COOLDOWN],x:[player.renSwapCooldown,REN_SWAP_COOLDOWN],e:[player.renSkillCooldown,REN_SKILL_COOLDOWN],r:[player.renUltimateCooldown,REN_ULTIMATE_COOLDOWN]},
    nightLord:{q:[player.nightLordQCooldown,NIGHT_LORD_Q_COOLDOWN],e:[player.nightLordECooldown,NIGHT_LORD_E_COOLDOWN],x:[player.nightLordXCooldown,NIGHT_LORD_X_COOLDOWN],r:[player.nightLordRCooldown,NIGHT_LORD_R_COOLDOWN]},
    zero:{q:[player.zeroQCooldown,ZERO_Q_COOLDOWN],e:[player.zeroECooldown,ZERO_E_COOLDOWN],x:[player.zeroXCooldown,ZERO_X_COOLDOWN],r:[player.zeroRCooldown,ZERO_R_COOLDOWN]},
    paladin:{q:[player.paladinQCooldown,PALADIN_Q_COOLDOWN],e:[player.paladinECooldown,PALADIN_E_COOLDOWN],x:[player.paladinXCooldown,PALADIN_X_COOLDOWN],r:[player.paladinRCooldown,PALADIN_R_COOLDOWN]},
    arc:{q:[player.arcQCooldown,ARC_Q_COOLDOWN],e:[player.arcECooldown,ARC_E_COOLDOWN],x:[player.arcXCooldown,ARC_X_COOLDOWN],r:[player.arcRCooldown,ARC_R_COOLDOWN]},
    terra:{q:[player.terraQCooldown,TERRA_Q_COOLDOWN],e:[player.terraECooldown,TERRA_E_COOLDOWN],x:[player.terraXCooldown,TERRA_X_COOLDOWN],r:[player.terraRCooldown,TERRA_R_COOLDOWN]},
    void:{q:[player.voidQCooldown,VOID_Q_COOLDOWN],e:[player.voidECooldown,VOID_E_COOLDOWN],x:[player.voidXCooldown,VOID_X_COOLDOWN],r:[player.voidRCooldown,VOID_R_COOLDOWN]},
    carmilla:{q:[player.carmillaQCooldown,CARMILLA_Q_COOLDOWN]},
    vargas:{q:[player.vargasQCooldown,VARGAS_Q_COOLDOWN],e:[player.vargasECooldown,VARGAS_E_COOLDOWN],x:[player.vargasXCooldown,VARGAS_X_COOLDOWN],r:[player.vargasRCooldown,VARGAS_R_COOLDOWN]},
    echo:{q:[player.echoReplayCooldown,55],e:[player.echoPhaseCooldown,ECHO_PHASE_COOLDOWN],r:[player.echoCollapseCooldown,ECHO_COLLAPSE_COOLDOWN]},
    aria:{q:[player.ariaQCooldown,ARIA_Q_CD],e:[player.ariaECooldown,ARIA_E_CD],x:[player.ariaXCooldown,ARIA_X_CD],r:[player.ariaRCooldown,ARIA_R_CD]},
    moira:{q:[player.moiraQCooldown,MOIRA_Q_CD],e:[player.moiraECooldown,MOIRA_E_CD],x:[player.moiraXCooldown,MOIRA_X_CD],r:[player.moiraRCooldown,MOIRA_R_CD]},
    mare:{q:[player.mareQCooldown,player.mareUltimateTime>0?120:MARE_Q_CD],e:[player.mareECooldown,player.mareUltimateTime>0?150:MARE_E_CD],x:[player.mareXCooldown,MARE_X_CD],r:[player.mareRCooldown,MARE_R_CD]},
    nullZero:{q:[player.nullZeroQCooldown,NULL_ZERO_Q_CD],e:[player.nullZeroECooldown,NULL_ZERO_E_CD],x:[player.nullZeroXCooldown,NULL_ZERO_X_CD],r:[player.nullZeroRCooldown,NULL_ZERO_R_CD]},
    astra:{q:[player.astraQCooldown,ASTRA_Q_CD],e:[player.astraECooldown,ASTRA_E_CD],x:[player.astraXCooldown,ASTRA_X_CD],r:[player.astraRCooldown,ASTRA_R_CD]}
  };
  const data=table[selectedCharacter]?.[key];return data?{value:data[0]||0,max:data[1]||1}:null;
}

function isMobileUltimateLocked(key){
  return key==="r"&&player.level<10&&!["luminous","carmilla"].includes(selectedCharacter);
}

function drawMobileIcon(icon,cx,cy,r){
  if(!icon)return false;const image=icon.image||icon.atlas;if(!image?.complete||!image.naturalWidth)return false;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-3,0,Math.PI*2);ctx.clip();if(icon.atlas){const sw=image.naturalWidth/2,sh=image.naturalHeight/2;ctx.drawImage(image,(icon.index%2)*sw,Math.floor(icon.index/2)*sh,sw,sh,cx-r,cy-r,r*2,r*2);}else ctx.drawImage(image,cx-r,cy-r,r*2,r*2);ctx.restore();return true;
}

function drawCommonAttackIcon(cx,cy,r){
  ctx.save();ctx.translate(cx,cy);ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor="#48e5ff";ctx.shadowBlur=9;
  ctx.strokeStyle="rgba(85,218,250,.7)";ctx.lineWidth=Math.max(4,r*.12);ctx.beginPath();ctx.arc(0,0,r*.72,-2.62,-.72);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.72,.55,2.28);ctx.stroke();
  const blade=ctx.createLinearGradient(-r*.58,-r*.58,r*.38,r*.38);blade.addColorStop(0,"#d9fbff");blade.addColorStop(.35,"#79e9ff");blade.addColorStop(1,"#168fbd");ctx.fillStyle=blade;ctx.strokeStyle="#9ef5ff";ctx.lineWidth=Math.max(1.5,r*.045);ctx.beginPath();ctx.moveTo(-r*.62,-r*.62);ctx.lineTo(r*.27,r*.13);ctx.lineTo(r*.12,r*.29);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(225,253,255,.82)";ctx.lineWidth=Math.max(1,r*.035);ctx.beginPath();ctx.moveTo(-r*.48,-r*.48);ctx.lineTo(r*.12,r*.15);ctx.stroke();
  ctx.fillStyle="#49cce9";ctx.strokeStyle="#a8f5ff";ctx.lineWidth=Math.max(2,r*.055);ctx.beginPath();ctx.moveTo(r*.06,r*.18);ctx.lineTo(r*.39,r*.08);ctx.lineTo(r*.31,r*.35);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(r*.24,r*.27);ctx.lineTo(r*.53,r*.54);ctx.stroke();ctx.fillStyle="#bdf8ff";ctx.beginPath();ctx.arc(r*.56,r*.57,r*.08,0,Math.PI*2);ctx.fill();ctx.restore();
}

const MOBILE_LOBBY_DISPLAY_FONT='"Black Han Sans", "Arial Black", "Malgun Gothic", sans-serif';
const MOBILE_LOBBY_BUTTON_FONT='"Do Hyeon", "Malgun Gothic", sans-serif';

function drawMobileLobbyEmblem(cx,cy,r,color,glyph){
  ctx.save();ctx.translate(cx,cy);ctx.shadowColor=color;ctx.shadowBlur=7;ctx.fillStyle="rgba(3,7,11,.72)";ctx.strokeStyle=`${color}e8`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle=`${color}70`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.68,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillStyle=`${color}c8`;ctx.fillRect(-1,-r-3,2,5);ctx.restore();}ctx.fillStyle="#f3f7ff";ctx.shadowColor=color;ctx.shadowBlur=4;ctx.font=`bold ${Math.max(12,r*.92)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(glyph,0,1);ctx.restore();ctx.textBaseline="alphabetic";
}

function drawMobileHomeScreen(){
  drawLobbyBackdrop();
  const info=characterSkillGuide[selectedCharacter]||characterSkillGuide.yupiter,accent=info.color||"#57ddff";
  const sprite=getCharacterPreviewSprite(selectedCharacter),short=canvas.height<390;
  const gap=short?6:9,titleH=short?28:38,startH=short?48:62;
  const usableH=Math.min(canvas.height-(short?24:48),420),cardH=Math.max(short?38:48,Math.min(68,(usableH-titleH-startH-gap*4)/3));
  const frameH=titleH+startH+cardH*3+gap*4,outerY=Math.max(short?8:18,(canvas.height-frameH)/2),outerX=Math.max(18,canvas.width*.035);
  const frameW=canvas.width-outerX*2,menuW=Math.min(520,frameW*.52),heroLeft=outerX+menuW+Math.max(18,frameW*.035),heroRight=outerX+frameW;
  const heroX=(heroLeft+heroRight)/2,top=outerY+titleH+gap,cardY=top+startH+gap,cardW=(menuW-gap)/2;
  ctx.save();
  const shade=ctx.createLinearGradient(0,0,canvas.width,0);
  shade.addColorStop(0,"rgba(2,5,10,.48)");shade.addColorStop(.58,"rgba(4,7,12,.12)");shade.addColorStop(1,"rgba(2,3,7,.3)");
  ctx.fillStyle=shade;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="rgba(2,4,10,.72)";ctx.fillRect(0,0,canvas.width,Math.max(28,outerY-8));
  ctx.textAlign="left";ctx.fillStyle="#ff536d";ctx.font=`900 ${short?8:10}px Arial`;ctx.fillText("NIGHT PROTOCOL / 03",outerX,outerY-4);
  drawBloodiedLobbyTitle("ZOMBIE SURVIVAL",outerX,outerY+titleH-5,short?19:25,"#f4f5ff");
  const heroCenterY=outerY+frameH*.46,glowRadius=Math.min(frameH*.52,(heroRight-heroLeft)*.72);
  const glow=ctx.createRadialGradient(heroX,heroCenterY,10,heroX,heroCenterY,glowRadius);
  glow.addColorStop(0,accent+"45");glow.addColorStop(1,accent+"00");ctx.fillStyle=glow;ctx.fillRect(heroLeft,outerY,heroRight-heroLeft,frameH);
  ctx.strokeStyle="rgba(151,178,214,.12)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(heroLeft-gap*.5,outerY+titleH);ctx.lineTo(heroLeft-gap*.5,outerY+frameH);ctx.stroke();
  if(sprite?.complete&&sprite.naturalWidth){
    const heroW=heroRight-heroLeft,availableH=frameH-(short?42:62);
    const scale=Math.min(heroW*.74/sprite.naturalWidth,availableH*.82/sprite.naturalHeight),dw=sprite.naturalWidth*scale,dh=sprite.naturalHeight*scale;
    if(typeof drawOblivionMenuAura==='function')drawOblivionMenuAura(selectedCharacter,heroX-dw/2,heroCenterY-dh/2,dw,dh);
    ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=24;
    const animated=typeof drawLobbyAnimatedHero==='function'&&drawLobbyAnimatedHero(selectedCharacter,heroX-dh/3,heroCenterY-dh/2,dh*2/3,dh);
    if(!animated)ctx.drawImage(sprite,heroX-dw/2,heroCenterY-dh/2,dw,dh);ctx.restore();
  }
  const nameY=outerY+frameH-(short?9:20);
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font=`${short?17:22}px ${MOBILE_LOBBY_DISPLAY_FONT}`;ctx.fillText(info.name,heroX,nameY);ctx.fillStyle=accent;ctx.fillRect(heroX-38,nameY+8,76,2);
  homeStartRect={x:outerX,y:top,w:menuW,h:startH};
  drawLobbyPanel(homeStartRect,"#d94a50",{primary:true});
  drawMobileLobbyEmblem(outerX+(short?22:27),top+startH/2,short?14:18,"#d94a50","▶");
  ctx.fillStyle="#fff";ctx.shadowColor="rgba(255,255,255,.2)";ctx.shadowBlur=4;ctx.font=`${short?18:23}px ${MOBILE_LOBBY_BUTTON_FONT}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("작전 시작",outerX+menuW/2,top+startH/2+1);ctx.shadowBlur=0;ctx.textBaseline="alphabetic";
  const cards=[["#9874c4","◆","캐릭터"],["#b99a55","✦","증강 도감"],["#5d9b84","?","기본 조작법"],["#a64e59","☣","몬스터 도감"]];
  const rects=[];
  for(let i=0;i<cards.length;i++){
    const rect={x:outerX+(i%2)*(cardW+gap),y:cardY+Math.floor(i/2)*(cardH+gap),w:cardW,h:cardH};
    rects.push(rect);
    const [color,icon,label]=cards[i];drawLobbyPanel(rect,color);
    drawMobileLobbyEmblem(rect.x+(short?19:24),rect.y+cardH/2,short?12:15,color,icon);
    ctx.fillStyle="#fff";ctx.shadowColor="rgba(255,255,255,.18)";ctx.shadowBlur=3;ctx.font=`${short?13:17}px ${MOBILE_LOBBY_BUTTON_FONT}`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label,rect.x+rect.w/2,rect.y+cardH/2+1);ctx.shadowBlur=0;ctx.textBaseline="alphabetic";
  }
  [homeCharacterRect,homeAugmentGuideRect,homeGameGuideRect,homeMonsterGuideRect]=rects;
  homeSettingsRect=mobileSettingsHomeRect={x:outerX,y:cardY+2*(cardH+gap),w:cardW,h:cardH};
  homeDifficultyRect={x:outerX+cardW+gap,y:homeSettingsRect.y,w:cardW,h:cardH};
  const bottomCards=[[homeSettingsRect,"#568da1","⚙","조작 설정"],[homeDifficultyRect,"#b86a51","▲","난이도"]];
  for(const [rect,color,icon,label] of bottomCards){
    drawLobbyPanel(rect,color);drawMobileLobbyEmblem(rect.x+(short?19:24),rect.y+cardH/2,short?12:15,color,icon);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";ctx.font=`${short?13:17}px ${MOBILE_LOBBY_BUTTON_FONT}`;ctx.fillText(label,rect.x+rect.w/2,rect.y+cardH/2+1);ctx.textBaseline="alphabetic";
  }
  ctx.restore();drawHomeDifficultyPicker();
}


function drawAstraControlIcon(x,y,r,kind,active=false,dx=0,dy=0){
  if(kind==='attack'&&typeof astraBasicAttackIcon!=='undefined'&&astraBasicAttackIcon.complete&&astraBasicAttackIcon.naturalWidth){
    ctx.save();ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;
    ctx.drawImage(astraBasicAttackIcon,x-r,y-r,r*2,r*2);
    if(active){
      const phase=typeof astraFrame==='number'?astraFrame*.07:0;
      ctx.strokeStyle='rgba(195,244,255,.95)';ctx.lineWidth=1.5;
      for(let i=0;i<3;i++){const a=phase+i*Math.PI*2/3;ctx.beginPath();ctx.arc(x,y,r*.84,a,a+.42);ctx.stroke();}
    }
    ctx.restore();return;
  }
  ctx.save();ctx.translate(x,y);ctx.scale(r,r);ctx.globalAlpha=1;
  const phase=typeof astraFrame==='number'?astraFrame*.012:0;
  const bg=ctx.createRadialGradient(-.24,-.3,.03,0,0,1);
  bg.addColorStop(0,active?'#416692':'#293559');bg.addColorStop(.55,'#191730');bg.addColorStop(1,'#080e20');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=.025;ctx.strokeStyle='#c5ac79';ctx.stroke();
  ctx.strokeStyle=active?'#d7faff':'#709cbb';ctx.lineWidth=.012;
  ctx.beginPath();ctx.arc(0,0,.87,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);
    ctx.strokeStyle=i%3?'#667aa5':'#ebd6a2';ctx.beginPath();ctx.moveTo(c*.89,s*.89);ctx.lineTo(c*(i%3?.94:1),s*(i%3?.94:1));ctx.stroke();
  }
  for(let i=0;i<6;i++){
    const a=phase*(active?2:1)+i*Math.PI/3;
    ctx.fillStyle=i%2?'#a8eaff':'#eed3a0';ctx.globalAlpha=active?.9:.48;
    ctx.beginPath();ctx.arc(Math.cos(a)*.78,Math.sin(a)*.78,.016+(i%2)*.008,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.strokeStyle='#bba0e5';ctx.lineWidth=.02;
  ctx.beginPath();ctx.ellipse(0,0,.68,.27,-.6,0,Math.PI*2);ctx.stroke();
  if(kind==='joystick'){
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillStyle='#93bfd9';ctx.beginPath();ctx.moveTo(0,-.65);ctx.lineTo(.065,-.5);ctx.lineTo(0,-.54);ctx.lineTo(-.065,-.5);ctx.closePath();ctx.fill();ctx.restore();
    }
    ctx.translate(dx/r,dy/r);ctx.fillStyle='#202945';ctx.strokeStyle=active?'#e1faff':'#a7bfdf';
    ctx.beginPath();ctx.arc(0,0,.34,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else{
    for(let i=0;i<3;i++){
      ctx.strokeStyle=i===1?'#d5faff':'#648dd6';ctx.lineWidth=i===1?.045:.018;
      ctx.beginPath();ctx.moveTo(-.61+i*.04,.57);ctx.bezierCurveTo(-.42,.26,-.48,-.18,.12,-.14+i*.07);ctx.stroke();
    }
    ctx.translate(.12,-.1);ctx.scale(1.35,1.35);
  }
  const face=ctx.createLinearGradient(-.24,-.3,.24,.3);face.addColorStop(0,'#fff4cf');face.addColorStop(.4,'#d5fcff');face.addColorStop(1,'#579ee4');ctx.fillStyle=face;
  ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,length=i%2?.075:.29;const px=Math.cos(a)*length,py=Math.sin(a)*length;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawMobileControls(){
  if(!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory)return;const {joystick,attack,skills}=getMobileControlLayout();ctx.save();
  const attackGlow=mobileAttackTouchId!==null;
  if(selectedCharacter==='oblivion'){
    drawOblivionControl(joystick.x,joystick.y,joystick.r,'joystick',mobileJoystickTouchId!==null,mobileStickX,mobileStickY);
    drawOblivionControl(attack.x,attack.y,attack.r,'attack',attackGlow);
  }else if(selectedCharacter==='mare'){
    drawMareControlIcon(joystick.x,joystick.y,joystick.r,'joystick',mobileJoystickTouchId!==null,mobileStickX,mobileStickY);
    drawMareControlIcon(attack.x,attack.y,attack.r,'attack',attackGlow);
  }else if(selectedCharacter!=='astra'){
  ctx.globalAlpha=.86;ctx.fillStyle="rgba(8,16,29,.68)";ctx.strokeStyle="rgba(123,220,255,.58)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="rgba(123,220,255,.16)";ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r*.68,0,Math.PI*2);ctx.stroke();
  const knobR=joystick.r*.37,kx=joystick.x+mobileStickX,ky=joystick.y+mobileStickY;ctx.fillStyle="rgba(103,218,255,.45)";ctx.shadowColor="#53d9ff";ctx.shadowBlur=mobileJoystickTouchId===null?8:18;ctx.beginPath();ctx.arc(kx,ky,knobR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b6f2ff";ctx.stroke();ctx.shadowBlur=0;
  const attackGlow=mobileAttackTouchId!==null;const ag=ctx.createRadialGradient(attack.x-10,attack.y-12,4,attack.x,attack.y,attack.r);ag.addColorStop(0,attackGlow?"#247ba2":"#183d56");ag.addColorStop(1,"#07131f");ctx.fillStyle=ag;ctx.strokeStyle=attackGlow?"#8cf3ff":"#46cce9";ctx.lineWidth=3;ctx.shadowColor="#33dfff";ctx.shadowBlur=attackGlow?24:12;ctx.beginPath();ctx.arc(attack.x,attack.y,attack.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;drawCommonAttackIcon(attack.x,attack.y,attack.r*.72);
  }else{
    drawAstraControlIcon(joystick.x,joystick.y,joystick.r,'joystick',mobileJoystickTouchId!==null,mobileStickX,mobileStickY);
    drawAstraControlIcon(attack.x,attack.y,attack.r,'attack',attackGlow);
  }
  for(const skill of skills){
    const skillName=getMobileSkillName(skill.key);
    ctx.fillStyle="rgba(9,12,24,.88)";ctx.strokeStyle="#c8d5ed";ctx.lineWidth=2;ctx.shadowColor="#7b8fff";ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    if(!drawMobileIcon(getMobileSkillIcon(skill.key),skill.x,skill.y,skill.r)){
      ctx.fillStyle="#fff";ctx.font=`900 ${Math.max(8,skill.r*.28)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(skillName,skill.x,skill.y+1);
    }
    const cooldown=getMobileSkillCooldown(skill.key),locked=isMobileUltimateLocked(skill.key);
    if(cooldown?.value>0)drawCooldownCover(skill.x,skill.y,skill.r,cooldown.value/cooldown.max,cooldown.value);
    if(locked){ctx.fillStyle="rgba(5,7,13,.72)";ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`900 ${Math.max(13,skill.r*.58)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("10",skill.x,skill.y);}
    ctx.fillStyle="#fff";ctx.font="900 9px Arial";ctx.textAlign="center";ctx.textBaseline="alphabetic";
    if(selectedCharacter==='oblivion'){
      drawOblivionControl(skill.x,skill.y,skill.r,'frame',false);
      ctx.fillStyle='#ffe2eb';ctx.font='bold 9px Arial';ctx.fillText({q:'침입',e:'공허',x:'이탈',r:'종말'}[skill.key],skill.x,skill.y+skill.r+12,skill.r*2+8);
    }else if(selectedCharacter==="astra"){
      drawAstraSkillFrame(skill.x,skill.y,skill.r);
      const lines=skill.key==="r"?["만유인력","역전"]:[skillName];
      lines.forEach((label,i)=>ctx.fillText(label,skill.x,skill.y+skill.r+12+i*10,skill.r*2+8));
    }else if(selectedCharacter==='mare'){
      drawMareSkillFrame(skill.x,skill.y,skill.r);
      const lines=skill.key==='r'?['세계를 삼킨','바다']:[skillName];
      lines.forEach((label,i)=>ctx.fillText(label,skill.x,skill.y+skill.r+13+i*10,skill.r*2+10));
    }else ctx.fillText(skillName,skill.x,skill.y+skill.r+12);
  }
  ctx.restore();
  drawMobileSkillCancelButton();
}

function drawMobileSkillCancelButton(){
  if(!mobileSkillAim?.dragged||!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory)return;
  const button=getMobileSkillCancelButton();if(!button)return;
  const {x,y,r}=button,hover=mobileSkillAim.cancelHover;
  ctx.save();ctx.translate(x,y);ctx.lineCap="round";ctx.lineJoin="round";
  ctx.fillStyle=hover?"rgba(119,8,28,.68)":"rgba(40,4,17,.36)";
  ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  // Layered neon tubes: crisp hot core, red emission and soft outer halo.
  for(const [width,color] of [[12,"rgba(255,31,68,.09)"],[7,"rgba(255,41,76,.19)"],[3,hover?"#ff3c60":"#ef3154"],[1.15,"#ffb7c5"]]){
    ctx.lineWidth=width;ctx.strokeStyle=color;
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    const d=r*.34;ctx.beginPath();ctx.moveTo(-d,-d);ctx.lineTo(d,d);ctx.moveTo(d,-d);ctx.lineTo(-d,d);ctx.stroke();
  }
  ctx.fillStyle=hover?"#ffc2ce":"#ff718a";ctx.font="13px DoHyeon, Arial";ctx.textAlign="center";ctx.textBaseline="top";
  ctx.fillText(hover?"놓아서 취소":"시전 취소",0,r+7);ctx.restore();
}

function drawMobilePortraitLock(){
  const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#07101d");g.addColorStop(1,"#170927");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height/2-45);ctx.rotate(-Math.PI/2);ctx.strokeStyle="#7ceaff";ctx.lineWidth=6;ctx.shadowColor="#50dfff";ctx.shadowBlur=22;drawRoundedRect(-58,-96,116,192,18,"rgba(15,31,52,.9)","#7ceaff",5);ctx.fillStyle="#b975ff";ctx.beginPath();ctx.arc(0,72,7,0,Math.PI*2);ctx.fill();ctx.restore();ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 26px Arial";ctx.fillText("기기를 가로로 돌려주세요",canvas.width/2,canvas.height/2+95);ctx.fillStyle="#9fb3cb";ctx.font="14px Arial";ctx.fillText("모바일 플레이는 가로 화면에서만 지원됩니다",canvas.width/2,canvas.height/2+124);ctx.textAlign="left";
}
