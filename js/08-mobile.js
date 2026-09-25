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
let mobileJoystickMinusRect = {x:0,y:0,w:0,h:0};
let mobileJoystickPlusRect = {x:0,y:0,w:0,h:0};
let mobileActionMinusRect = {x:0,y:0,w:0,h:0};
let mobileActionPlusRect = {x:0,y:0,w:0,h:0};

const MOBILE_CONTROL_DEFAULTS={joystickX:null,joystickY:null,attackX:null,attackY:null,joystickScale:1,actionScale:1};
let mobileControlSettings=loadMobileControlSettings();

function loadMobileControlSettings(){
  try{const saved=JSON.parse(localStorage.getItem("zombieSurvivalMobileControls")||"null");return saved?{...MOBILE_CONTROL_DEFAULTS,...saved}:{...MOBILE_CONTROL_DEFAULTS};}catch(error){return{...MOBILE_CONTROL_DEFAULTS};}
}
function saveMobileControlSettings(){try{localStorage.setItem("zombieSurvivalMobileControls",JSON.stringify(mobileControlSettings));}catch(error){}}
function clampMobileControlScale(value){return Math.max(.72,Number.isFinite(value)?value:1);}

const MOBILE_SKILL_KEYS = {
  default:["r"],suncall:["r"],luminous:["r"],yupiter:["q","e","r"],ren:["q","x","e","r"],
  nightLord:["q","e","x","r"],zero:["q","e","x","r"],paladin:["q","e","x","r"],arc:["q","e","x","r"],
  terra:["q","e","x","r"],void:["q","e","x","r"],carmilla:["q"],vargas:["q","e","x","r"],
  echo:["q","e","r"],aria:["q","e","x","r"],moira:["q","e","x","r"],mare:["q","e","x","r"]
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
  const orbit=attackR+Math.max(42,Math.min(58,minSide*.09))*mobileControlSettings.actionScale,skillR=Math.max(20,Math.min(28,minSide*.052))*mobileControlSettings.actionScale;
  joystick.x=Math.max(safe+joyR,Math.min(canvas.width*.45-joyR,joystick.x));
  joystick.y=Math.max(118+joyR,Math.min(canvas.height-safe-joyR,joystick.y));
  const maxAttackY=canvas.height-safe-attackR;
  attack.x=Math.max(canvas.width*.5+orbit+skillR,Math.min(canvas.width-safe-attackR,attack.x));
  attack.y=Math.max(Math.min(maxAttackY,118+orbit+skillR),Math.min(maxAttackY,attack.y));
  const skills=keys.map((key,index)=>({key,x:attack.x+Math.cos(angles[index])*orbit,y:attack.y+Math.sin(angles[index])*orbit,r:skillR}));
  return {joystick,attack,skills};
}

function getMobileMoveVector(){return {active:mobileJoystickTouchId!==null,x:mobileMoveX,y:mobileMoveY};}

function updateMobileJoystick(x,y){
  const joy=getMobileControlLayout().joystick,dx=x-joy.x,dy=y-joy.y,d=Math.hypot(dx,dy),limit=joy.r*.62,clamped=Math.min(d,limit),nx=d?dx/d:0,ny=d?dy/d:0;
  mobileStickX=nx*clamped;mobileStickY=ny*clamped;mobileMoveX=nx*Math.min(1,d/limit);mobileMoveY=ny*Math.min(1,d/limit);
}

function releaseMobileJoystick(){mobileJoystickTouchId=null;mobileMoveX=0;mobileMoveY=0;mobileStickX=0;mobileStickY=0;mobileJoystickOrigin=null;}

function updateMobileAttackAim(force=false){
  if(!force&&mobileSkillAim?.dragged){applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec(mobileSkillAim.key));return;}
  if(mobileAttackTouchId===null&&!force)return;
  if(mobileAttackAim?.dragged&&!force){applyMobileDragAim(mobileAttackAim,getMobileAttackTargetSpec());return;}
  let target=null,best=Infinity;
  for(const enemy of zombies){if(!enemy||enemy.hp<=0)continue;const d=(enemy.x-player.x)**2+(enemy.y-player.y)**2;if(d<best){best=d;target=enemy;}}
  const viewScale=getWorldViewScale();mouse.x=target?(target.x-camera.x)*viewScale:(player.x-camera.x)*viewScale+180;mouse.y=target?(target.y-camera.y)*viewScale:(player.y-camera.y)*viewScale;screenToWorld();
}

function updateMobileDragAim(state,p,spec){
  const dx=p.x-state.startX,dy=p.y-state.startY,d=Math.hypot(dx,dy);
  state.currentX=p.x;state.currentY=p.y;state.dragged=d>=10;
  if(!state.dragged)return;
  state.angle=Math.atan2(dy,dx);
  state.strength=Math.min(1,d/Math.max(62,Math.min(canvas.width,canvas.height)*.2));
  applyMobileDragAim(state,spec);
}

function applyMobileDragAim(state,spec){
  if(!spec||!state.dragged)return;
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
function clampMobileControlPosition(kind,p){
  const layout=getMobileControlLayout(),r=kind==="joystick"?layout.joystick.r:layout.attack.r,safe=12;
  const minX=kind==="joystick"?safe+r:canvas.width*.55+r,maxX=kind==="joystick"?canvas.width*.45-r:canvas.width-safe-r;
  return{x:Math.max(minX,Math.min(maxX,p.x)),y:Math.max(118+r,Math.min(canvas.height-safe-r,p.y))};
}
function beginMobileSettingDrag(p){
  if(p.y<116)return null;
  const layout=getMobileControlLayout();
  const kind=pointInCircle(p,{...layout.joystick,r:layout.joystick.r*1.25})?"joystick":
    (pointInCircle(p,{...layout.attack,r:layout.attack.r*1.3})||layout.skills.some(s=>pointInCircle(p,{...s,r:s.r*1.2})))?"action":null;
  if(!kind)return null;
  const center=kind==="joystick"?layout.joystick:layout.attack;
  return {controlTarget:kind,offsetX:p.x-center.x,offsetY:p.y-center.y};
}
function moveMobileSettingControl(gesture,p){
  const pos=clampMobileControlPosition(gesture.controlTarget,{x:p.x-gesture.offsetX,y:p.y-gesture.offsetY});
  const prefix=gesture.controlTarget==="joystick"?"joystick":"attack";
  mobileControlSettings[prefix+"X"]=pos.x/canvas.width;mobileControlSettings[prefix+"Y"]=pos.y/canvas.height;
}
function openMobileSettings(){
  stopMobileScrollInertia();releaseMobileJoystick();mobileAttackTouchId=null;mobileAttackAim=null;mobileSkillAim=null;mouse.down=false;
  screenMode="mobileSettings";
}
function handleMobileSettingsTap(p){
  if(pointInRect(p.x,p.y,mobileSettingsBackRect)){saveMobileControlSettings();screenMode="home";return true;}
  if(pointInRect(p.x,p.y,mobileSettingsResetRect)){mobileControlSettings={...MOBILE_CONTROL_DEFAULTS};saveMobileControlSettings();return true;}
  const adjust=(key,delta)=>{mobileControlSettings[key]=clampMobileControlScale(mobileControlSettings[key]+delta);saveMobileControlSettings();};
  if(pointInRect(p.x,p.y,mobileJoystickMinusRect)){adjust("joystickScale",-.1);return true;}
  if(pointInRect(p.x,p.y,mobileJoystickPlusRect)){adjust("joystickScale",.1);return true;}
  if(pointInRect(p.x,p.y,mobileActionMinusRect)){adjust("actionScale",-.1);return true;}
  if(pointInRect(p.x,p.y,mobileActionPlusRect)){adjust("actionScale",.1);return true;}
  return false;
}

canvas.addEventListener("touchstart",event=>{
  event.preventDefault();
  if(isMobilePortraitMode())return;
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
    const skill=layout.skills.find(button=>pointInCircle(p,{...button,r:button.r*1.48}));if(skill&&mobileSkillAim===null){mobileSkillAim={touchId:touch.identifier,key:skill.key,startX:p.x,startY:p.y,currentX:p.x,currentY:p.y,dragged:false};updateMobileAttackAim(true);continue;}
    if(mobileAttackTouchId===null&&pointInCircle(p,{...layout.attack,r:layout.attack.r*1.42})){mobileAttackTouchId=touch.identifier;mobileAttackAim={startX:p.x,startY:p.y,currentX:p.x,currentY:p.y,dragged:false};mouse.down=true;updateMobileAttackAim();continue;}
    const nearJoystick=pointInCircle(p,{...layout.joystick,r:layout.joystick.r*2.25})||(p.x<canvas.width*.38&&p.y>canvas.height*.42);
    if(mobileJoystickTouchId===null&&nearJoystick){const r=layout.joystick.r,safe=14;mobileJoystickOrigin={x:Math.max(safe+r,Math.min(canvas.width*.42-r,p.x)),y:Math.max(canvas.height*.42+r,Math.min(canvas.height-safe-r,p.y))};mobileJoystickTouchId=touch.identifier;updateMobileJoystick(p.x,p.y);continue;}
    if(pointInRect(p.x,p.y,pauseButtonRect))dispatchMobileCanvasClick(p);
  }
},{passive:false});

canvas.addEventListener("touchmove",event=>{
  event.preventDefault();
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
  const cancelled=event.type==="touchcancel";
  for(const touch of event.changedTouches){
    if(touch.identifier===mobileJoystickTouchId)releaseMobileJoystick();
    if(touch.identifier===mobileAttackTouchId){mobileAttackTouchId=null;mobileAttackAim=null;mouse.down=false;}
    if(mobileSkillAim&&touch.identifier===mobileSkillAim.touchId){
      if(!cancelled&&screenMode==="game"&&!paused&&!choosingUpgrade&&!gameOver&&!raidVictory){
        const spec=getMobileSkillTargetSpec(mobileSkillAim.key);
        if(mobileSkillAim.dragged)applyMobileDragAim(mobileSkillAim,spec);
        else if(spec)updateMobileAttackAim(true);
        triggerMobileSkill(mobileSkillAim.key,true);
      }
      mobileSkillAim=null;
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
addEventListener("orientationchange",()=>{releaseMobileJoystick();mobileAttackTouchId=null;mobileAttackAim=null;mobileSkillAim=null;mouse.down=false;});

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
  if(selectedCharacter==="yupiter"){if(key==="q")return{image:[crescentBladeSprite,severingBladeSprite,flameCannonSprite][player.yupiterWeapon]};if(key==="e")return{image:yupiterESkillIcons[player.yupiterWeapon]};if(key==="r")return{image:yupiterUltimateIcon};}
  if(selectedCharacter==="ren")return{image:renSkillIcons[{q:0,x:1,e:2,r:3}[key]]};
  if(selectedCharacter==="nightLord")return{image:nightLordSkillIcons[index]};if(selectedCharacter==="zero")return{image:zeroSkillIcons[index]};if(selectedCharacter==="paladin")return{image:paladinSkillIcons[index]};
  const atlases={arc:arcSkillIconAtlas,terra:terraSkillIconAtlas,void:voidSkillIconAtlas,carmilla:carmillaSkillIconAtlas,vargas:vargasSkillIconAtlas,echo:echoSkillIconAtlas,aria:ariaSkillIconAtlas,moira:moiraSkillIconAtlas,mare:mareSkillIconAtlas};
  return atlases[selectedCharacter]?{atlas:atlases[selectedCharacter],index}:null;
}

function getMobileSkillName(key){
  const names={
    default:{r:"재장전"},suncall:{r:"재장전"},luminous:{r:"재장전"},
    ren:{q:"분신 배치",x:"그림자 이동",e:"분신 습격",r:"그림자 지대"},nightLord:{q:"그림자 추격",e:"광란",x:"처형",r:"불사의 밤"},
    zero:{q:"참격",e:"급소",x:"심판",r:"검의 왈츠"},paladin:{q:"성스러운 반격",e:"연속 절단",x:"콤보 전환",r:"한계 돌파"},
    arc:{q:"일륜",e:"홍염 파동",x:"태양 낙하",r:"초신성"},terra:{q:"단층 붕괴",e:"암벽 융기",x:"지각 압축",r:"대륙 분쇄"},
    void:{q:"심층 포식",e:"대지 방출",x:"지반 붕괴",r:"제어 불능"},carmilla:{q:"피의 회수"},
    vargas:{q:"생명 포식",e:"혈육 갑주",x:"거신 강타",r:"불멸의 형상"},echo:{q:"절단",e:"위상 전환",r:"세계선 붕괴"},
    aria:{q:"가시 성장",e:"만개",x:"정원 이동",r:"영원한 봄"},moira:{q:"조종",e:"대리 인형",x:"고통 전이",r:"꼭두각시 극장"},
    mare:{q:"밀물",e:"소용돌이 핵",x:"수압",r:"세계를 삼킨 바다"}
  };
  if(selectedCharacter==="yupiter"){if(key==="q")return"무기 전환";const weapon=["반월검","절단검","화염포"][player.yupiterWeapon]||"무기";return key==="e"?`${weapon} 강화`:`${weapon} 궁극기`;}
  return names[selectedCharacter]?.[key]||"스킬";
}

function getMobileSkillCooldown(key){
  const reloadInfo=()=>({value:player.reloadTime||0,max:90,label:"재장전"});
  if(["default","suncall","luminous"].includes(selectedCharacter))return key==="r"?reloadInfo():null;
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
    mare:{q:[player.mareQCooldown,MARE_Q_CD],e:[player.mareECooldown,MARE_E_CD],x:[player.mareXCooldown,MARE_X_CD],r:[player.mareRCooldown,MARE_R_CD]}
  };
  const data=table[selectedCharacter]?.[key];return data?{value:data[0]||0,max:data[1]||1}:null;
}

function isMobileUltimateLocked(key){
  return key==="r"&&player.level<10&&!["default","suncall","luminous","carmilla"].includes(selectedCharacter);
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

function drawMobileHomeScreen(){
  drawMenuBackdrop(.66);
  const info=characterSkillGuide[selectedCharacter]||characterSkillGuide.default,accent=info.color||"#57ddff";
  const sprite=getCharacterPreviewSprite(selectedCharacter),short=canvas.height<390;
  const gap=short?6:9,titleH=short?28:38,startH=short?48:62,settingsH=short?38:46;
  const usableH=Math.min(canvas.height-(short?24:48),420),cardH=Math.max(short?37:48,Math.min(82,(usableH-titleH-startH-settingsH-gap*4)/2));
  const frameH=titleH+startH+settingsH+cardH*2+gap*4,outerY=Math.max(short?8:18,(canvas.height-frameH)/2),outerX=Math.max(18,canvas.width*.035);
  const frameW=canvas.width-outerX*2,menuW=Math.min(520,frameW*.52),heroLeft=outerX+menuW+Math.max(18,frameW*.035),heroRight=outerX+frameW;
  const heroX=(heroLeft+heroRight)/2,top=outerY+titleH+gap,cardY=top+startH+gap,cardW=(menuW-gap)/2;
  ctx.save();
  const shade=ctx.createLinearGradient(0,0,canvas.width,0);
  shade.addColorStop(0,"rgba(2,5,13,.96)");shade.addColorStop(.58,"rgba(4,7,16,.45)");shade.addColorStop(1,"rgba(2,3,9,.86)");
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
    ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=24;ctx.drawImage(sprite,heroX-dw/2,heroCenterY-dh/2,dw,dh);ctx.restore();
  }
  const nameY=outerY+frameH-(short?9:20);
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font=`900 ${short?17:22}px Arial`;ctx.fillText(info.name,heroX,nameY);ctx.fillStyle=accent;ctx.fillRect(heroX-38,nameY+8,76,2);
  homeStartRect={x:outerX,y:top,w:menuW,h:startH};
  const play=ctx.createLinearGradient(outerX,top,outerX+menuW,top);play.addColorStop(0,"#14899f");play.addColorStop(1,"#293e83");
  ctx.save();ctx.shadowColor="#2edfff";ctx.shadowBlur=14;drawRoundedRect(outerX,top,menuW,startH,11,play,"#74efff",2);ctx.restore();
  ctx.fillStyle="#fff";ctx.font=`900 ${short?16:20}px Arial`;ctx.textAlign="left";ctx.fillText("▶  작전 시작",outerX+22,top+(short?22:28));
  ctx.fillStyle="rgba(235,250,255,.7)";ctx.font=`${short?9:11}px Arial`;ctx.fillText(info.name+"으로 생존 시작",outerX+51,top+startH-(short?7:11));
  const cards=[["#b875ff","◆","캐릭터","생존자 선택"],["#ffd15b","✦","증강 도감","빌드 확인"],["#5fe3ad","?","기본 조작법","이동·공격·스킬"],["#ff6b83","☣","몬스터 도감","적·보스 정보"]];
  const rects=[];
  for(let i=0;i<cards.length;i++){
    const rect={x:outerX+(i%2)*(cardW+gap),y:cardY+Math.floor(i/2)*(cardH+gap),w:cardW,h:cardH};
    rects.push(rect);
    const [color,icon,label,sub]=cards[i],fill=ctx.createLinearGradient(rect.x,rect.y,rect.x+rect.w,rect.y+rect.h);
    fill.addColorStop(0,color+"58");fill.addColorStop(1,color+"20");
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=10;drawRoundedRect(rect.x,rect.y,rect.w,rect.h,10,fill,color+"a8",1.5);ctx.restore();
    ctx.fillStyle=color;ctx.font=`bold ${short?15:18}px Arial`;ctx.textAlign="center";ctx.fillText(icon,rect.x+(short?19:23),rect.y+cardH*.45);
    ctx.fillStyle="#fff";ctx.font=`900 ${short?11:14}px Arial`;ctx.textAlign="left";ctx.fillText(label,rect.x+(short?35:43),rect.y+cardH*.43);
    if(cardH>=46){ctx.fillStyle="rgba(225,233,246,.7)";ctx.font=`${short?8:10}px Arial`;ctx.fillText(sub,rect.x+15,rect.y+cardH-11);}
  }
  [homeCharacterRect,homeAugmentGuideRect,homeGameGuideRect,homeMonsterGuideRect]=rects;
  mobileSettingsHomeRect={x:outerX,y:cardY+2*(cardH+gap),w:menuW,h:settingsH};
  const rect=mobileSettingsHomeRect,fill=ctx.createLinearGradient(rect.x,rect.y,rect.x+rect.w,rect.y+rect.h);
  fill.addColorStop(0,"rgba(84,216,255,.34)");fill.addColorStop(1,"rgba(84,216,255,.1)");
  ctx.save();ctx.shadowColor="#54d8ff";ctx.shadowBlur=10;drawRoundedRect(rect.x,rect.y,rect.w,rect.h,10,fill,"rgba(105,226,255,.62)",1.3);ctx.restore();
  ctx.fillStyle="#7be7ff";ctx.font=`bold ${short?16:18}px Arial`;ctx.textAlign="center";ctx.fillText("⚙",rect.x+23,rect.y+settingsH*.64);
  ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font=`900 ${short?11:13}px Arial`;ctx.fillText("조작 설정",rect.x+43,rect.y+(short?16:20));
  ctx.fillStyle="#a8c8da";ctx.font=`${short?8:10}px Arial`;ctx.fillText("버튼 위치·크기",rect.x+43,rect.y+settingsH-(short?7:10));
  ctx.restore();
}

function drawMobileControlSettings(){
  drawMenuBackdrop(.76);ctx.save();ctx.fillStyle="rgba(2,6,14,.86)";ctx.fillRect(0,0,canvas.width,canvas.height);const pad=Math.max(18,canvas.width*.025),top=16;ctx.textAlign="left";ctx.fillStyle="#fff";ctx.font="900 23px Arial";ctx.fillText("모바일 조작 설정",pad,top+24);ctx.fillStyle="#8ea8bd";ctx.font="12px Arial";ctx.fillText("버튼을 직접 끌어 위치를 변경하세요 · 변경사항은 자동 저장됩니다",pad,top+44);
  mobileSettingsBackRect={x:canvas.width-92,y:14,w:76,h:34};mobileSettingsResetRect={x:canvas.width-178,y:14,w:76,h:34};drawRoundedRect(mobileSettingsResetRect.x,mobileSettingsResetRect.y,mobileSettingsResetRect.w,mobileSettingsResetRect.h,8,"rgba(255,255,255,.07)","rgba(180,198,218,.38)",1);drawRoundedRect(mobileSettingsBackRect.x,mobileSettingsBackRect.y,mobileSettingsBackRect.w,mobileSettingsBackRect.h,8,"rgba(61,205,238,.18)","#55dfff",1.4);ctx.textAlign="center";ctx.fillStyle="#c7d3df";ctx.font="bold 12px Arial";ctx.fillText("초기화",mobileSettingsResetRect.x+38,mobileSettingsResetRect.y+22);ctx.fillStyle="#eafcff";ctx.fillText("완료",mobileSettingsBackRect.x+38,mobileSettingsBackRect.y+22);
  const drawSizer=(cx,label,value,isAction)=>{const y=64,w=230,h=44;drawRoundedRect(cx-w/2,y,w,h,10,"rgba(11,23,38,.82)",isAction?"rgba(167,126,255,.55)":"rgba(84,216,255,.55)",1.2);ctx.fillStyle="#eaf4ff";ctx.font="bold 12px Arial";ctx.textAlign="center";ctx.fillText(label,cx,y+17);ctx.fillStyle="#8fa5b8";ctx.font="10px Arial";ctx.fillText(`${Math.round(value*100)}%`,cx,y+34);const minus={x:cx-w/2+9,y:y+7,w:34,h:30},plus={x:cx+w/2-43,y:y+7,w:34,h:30};drawRoundedRect(minus.x,minus.y,minus.w,minus.h,7,"rgba(255,255,255,.08)","rgba(255,255,255,.2)",1);drawRoundedRect(plus.x,plus.y,plus.w,plus.h,7,"rgba(255,255,255,.08)","rgba(255,255,255,.2)",1);ctx.fillStyle="#fff";ctx.font="900 19px Arial";ctx.fillText("−",minus.x+17,minus.y+21);ctx.fillText("+",plus.x+17,plus.y+21);return{minus,plus};};const js=drawSizer(canvas.width*.27,"이동 버튼 크기",mobileControlSettings.joystickScale,false),as=drawSizer(canvas.width*.72,"공격·스킬 크기",mobileControlSettings.actionScale,true);mobileJoystickMinusRect=js.minus;mobileJoystickPlusRect=js.plus;mobileActionMinusRect=as.minus;mobileActionPlusRect=as.plus;
  ctx.setLineDash([7,7]);ctx.strokeStyle="rgba(104,206,240,.18)";ctx.lineWidth=1;ctx.strokeRect(10,116,canvas.width*.45-20,canvas.height-128);ctx.strokeStyle="rgba(170,125,255,.18)";ctx.strokeRect(canvas.width*.55+10,116,canvas.width*.45-20,canvas.height-128);ctx.setLineDash([]);const {joystick,attack}=getMobileControlLayout();ctx.fillStyle="rgba(8,16,29,.76)";ctx.strokeStyle="#58dfff";ctx.lineWidth=2;ctx.shadowColor="#32d9ff";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="rgba(93,215,255,.4)";ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r*.36,0,Math.PI*2);ctx.fill();
  const ag=ctx.createRadialGradient(attack.x-8,attack.y-9,3,attack.x,attack.y,attack.r);ag.addColorStop(0,"#214f6d");ag.addColorStop(1,"#07131f");
  ctx.fillStyle=ag;ctx.strokeStyle="#55ddf5";ctx.lineWidth=3;ctx.beginPath();ctx.arc(attack.x,attack.y,attack.r,0,Math.PI*2);ctx.fill();ctx.stroke();drawCommonAttackIcon(attack.x,attack.y,attack.r*.7);
  for(const skill of getMobileControlLayout().skills){
    const name=getMobileSkillName(skill.key),{x,y,r}=skill;ctx.fillStyle="rgba(18,15,36,.94)";ctx.strokeStyle="#b99cff";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(!drawMobileIcon(getMobileSkillIcon(skill.key),x,y,r)){ctx.fillStyle="#fff";ctx.font="900 9px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(name,x,y+1,r*1.8);}
    ctx.fillStyle="#eaf6ff";ctx.font="900 9px Arial";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(name,x,y+r+11);
  }
  ctx.fillStyle="rgba(204,223,238,.72)";ctx.font="11px Arial";ctx.textAlign="center";ctx.fillText("이동 영역",canvas.width*.225,132);ctx.fillText("전투 버튼 영역",canvas.width*.775,132);ctx.restore();
}

function drawMobileControls(){
  if(!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory)return;const {joystick,attack,skills}=getMobileControlLayout();ctx.save();
  ctx.globalAlpha=.86;ctx.fillStyle="rgba(8,16,29,.68)";ctx.strokeStyle="rgba(123,220,255,.58)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="rgba(123,220,255,.16)";ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r*.68,0,Math.PI*2);ctx.stroke();
  const knobR=joystick.r*.37,kx=joystick.x+mobileStickX,ky=joystick.y+mobileStickY;ctx.fillStyle="rgba(103,218,255,.45)";ctx.shadowColor="#53d9ff";ctx.shadowBlur=mobileJoystickTouchId===null?8:18;ctx.beginPath();ctx.arc(kx,ky,knobR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b6f2ff";ctx.stroke();ctx.shadowBlur=0;
  const attackGlow=mobileAttackTouchId!==null;const ag=ctx.createRadialGradient(attack.x-10,attack.y-12,4,attack.x,attack.y,attack.r);ag.addColorStop(0,attackGlow?"#247ba2":"#183d56");ag.addColorStop(1,"#07131f");ctx.fillStyle=ag;ctx.strokeStyle=attackGlow?"#8cf3ff":"#46cce9";ctx.lineWidth=3;ctx.shadowColor="#33dfff";ctx.shadowBlur=attackGlow?24:12;ctx.beginPath();ctx.arc(attack.x,attack.y,attack.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;drawCommonAttackIcon(attack.x,attack.y,attack.r*.72);
  for(const skill of skills){const skillName=getMobileSkillName(skill.key);ctx.fillStyle="rgba(9,12,24,.88)";ctx.strokeStyle="#c8d5ed";ctx.lineWidth=2;ctx.shadowColor="#7b8fff";ctx.shadowBlur=10;ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;if(!drawMobileIcon(getMobileSkillIcon(skill.key),skill.x,skill.y,skill.r)){ctx.fillStyle="#fff";ctx.font=`900 ${Math.max(8,skill.r*.28)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(skillName,skill.x,skill.y+1);}const cooldown=getMobileSkillCooldown(skill.key),locked=isMobileUltimateLocked(skill.key);if(cooldown?.value>0)drawCooldownCover(skill.x,skill.y,skill.r,cooldown.value/cooldown.max,cooldown.value);if(locked){ctx.fillStyle="rgba(5,7,13,.72)";ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font=`900 ${Math.max(13,skill.r*.58)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("10",skill.x,skill.y);}ctx.fillStyle="#fff";ctx.font="900 9px Arial";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(skillName,skill.x,skill.y+skill.r+12);}
  ctx.restore();
}

function drawMobilePortraitLock(){
  const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#07101d");g.addColorStop(1,"#170927");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height/2-45);ctx.rotate(-Math.PI/2);ctx.strokeStyle="#7ceaff";ctx.lineWidth=6;ctx.shadowColor="#50dfff";ctx.shadowBlur=22;drawRoundedRect(-58,-96,116,192,18,"rgba(15,31,52,.9)","#7ceaff",5);ctx.fillStyle="#b975ff";ctx.beginPath();ctx.arc(0,72,7,0,Math.PI*2);ctx.fill();ctx.restore();ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 26px Arial";ctx.fillText("기기를 가로로 돌려주세요",canvas.width/2,canvas.height/2+95);ctx.fillStyle="#9fb3cb";ctx.font="14px Arial";ctx.fillText("모바일 플레이는 가로 화면에서만 지원됩니다",canvas.width/2,canvas.height/2+124);ctx.textAlign="left";
}
