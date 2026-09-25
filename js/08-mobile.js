// 모바일 가로 화면 전용 조작 UI와 터치 입력

let mobileJoystickTouchId = null;
let mobileAttackTouchId = null;
let mobileMoveX = 0;
let mobileMoveY = 0;
let mobileStickX = 0;
let mobileStickY = 0;
let mobileJoystickOrigin = null;
let mobileUiGesture = null;
let mobileScrollVelocity = 0;
let mobileScrollFrame = 0;

const MOBILE_SKILL_KEYS = {
  default:["r"],suncall:["r"],luminous:["r"],yupiter:["q","e","r"],ren:["q","x","e","r"],
  nightLord:["q","e","x","r"],zero:["q","e","x","r"],paladin:["q","e","x","r"],arc:["q","e","x","r"],
  terra:["q","e","x","r"],void:["q","e","x","r"],carmilla:["q"],vargas:["q","e","x","r"],
  echo:["q","e","r"],aria:["q","e","x","r"],moira:["q","e","x","r"],mare:["q","e","x","r"]
};

function isMobileTouchDevice(){return (navigator.maxTouchPoints>0&&matchMedia("(pointer: coarse)").matches)||new URLSearchParams(location.search).has("mobile");}
function isMobilePortraitMode(){return isMobileTouchDevice()&&canvas.height>canvas.width;}

function getMobileControlLayout(){
  const minSide=Math.min(canvas.width,canvas.height),joyR=Math.max(48,Math.min(68,minSide*.115)),attackR=Math.max(39,Math.min(52,minSide*.088)),safe=Math.max(18,minSide*.035);
  const defaultJoystick={x:safe+joyR,y:canvas.height-safe-joyR};
  const joystick={x:mobileJoystickOrigin?.x??defaultJoystick.x,y:mobileJoystickOrigin?.y??defaultJoystick.y,r:joyR};
  const attack={x:canvas.width-safe-attackR,y:canvas.height-safe-attackR,r:attackR};
  const keys=MOBILE_SKILL_KEYS[selectedCharacter]||[];
  const angles=keys.length===1?[-2.15]:keys.length===2?[-2.65,-1.7]:keys.length===3?[-2.85,-2.15,-1.45]:[-3.02,-2.52,-2.02,-1.52];
  const orbit=attackR+Math.max(49,minSide*.09),skillR=Math.max(24,Math.min(32,minSide*.052));
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
  if(mobileAttackTouchId===null&&!force)return;
  let target=null,best=Infinity;
  for(const enemy of zombies){if(!enemy||enemy.hp<=0)continue;const d=(enemy.x-player.x)**2+(enemy.y-player.y)**2;if(d<best){best=d;target=enemy;}}
  const viewScale=getWorldViewScale();mouse.x=target?(target.x-camera.x)*viewScale:(player.x-camera.x)*viewScale+180;mouse.y=target?(target.y-camera.y)*viewScale:(player.y-camera.y)*viewScale;screenToWorld();
}

function triggerMobileSkill(key){
  updateMobileAttackAim(true);
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
  if(screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory){
    const t=event.changedTouches[0],p=canvasTouchPoint(t);
    stopMobileScrollInertia();
    mobileUiGesture={id:t.identifier,startX:p.x,startY:p.y,lastY:p.y,lastTime:performance.now(),moved:false,longPressed:false};
    if(screenMode==="character"&&!characterDetailId){mobileUiGesture.longTimer=setTimeout(()=>{if(mobileUiGesture&&!mobileUiGesture.moved){mobileUiGesture.longPressed=openMobileCharacterDetail(p);}},520);}
    return;
  }
  const layout=getMobileControlLayout();
  for(const touch of event.changedTouches){const p=canvasTouchPoint(touch);
    const skill=layout.skills.find(button=>pointInCircle(p,{...button,r:button.r*1.48}));if(skill){triggerMobileSkill(skill.key);continue;}
    if(mobileAttackTouchId===null&&pointInCircle(p,{...layout.attack,r:layout.attack.r*1.42})){mobileAttackTouchId=touch.identifier;mouse.down=true;updateMobileAttackAim();continue;}
    const nearJoystick=pointInCircle(p,{...layout.joystick,r:layout.joystick.r*2.25})||(p.x<canvas.width*.38&&p.y>canvas.height*.42);
    if(mobileJoystickTouchId===null&&nearJoystick){const r=layout.joystick.r,safe=14;mobileJoystickOrigin={x:Math.max(safe+r,Math.min(canvas.width*.42-r,p.x)),y:Math.max(canvas.height*.42+r,Math.min(canvas.height-safe-r,p.y))};mobileJoystickTouchId=touch.identifier;updateMobileJoystick(p.x,p.y);continue;}
    if(pointInRect(p.x,p.y,pauseButtonRect))dispatchMobileCanvasClick(p);
  }
},{passive:false});

canvas.addEventListener("touchmove",event=>{event.preventDefault();for(const touch of event.changedTouches){const p=canvasTouchPoint(touch);if(touch.identifier===mobileJoystickTouchId){updateMobileJoystick(p.x,p.y);continue;}if(mobileUiGesture&&touch.identifier===mobileUiGesture.id){const now=performance.now(),total=Math.hypot(p.x-mobileUiGesture.startX,p.y-mobileUiGesture.startY);if(total>7){mobileUiGesture.moved=true;clearTimeout(mobileUiGesture.longTimer);}const dy=p.y-mobileUiGesture.lastY,dt=Math.max(8,now-mobileUiGesture.lastTime),delta=-dy;mobileUiGesture.lastY=p.y;mobileUiGesture.lastTime=now;mobileScrollVelocity=mobileScrollVelocity*.55+(delta*(16.67/dt))*.45;setMobileScroll(getMobileScroll()+delta);}}},{passive:false});

function endMobileTouches(event){event.preventDefault();for(const touch of event.changedTouches){if(touch.identifier===mobileJoystickTouchId)releaseMobileJoystick();if(touch.identifier===mobileAttackTouchId){mobileAttackTouchId=null;mouse.down=false;}if(mobileUiGesture&&touch.identifier===mobileUiGesture.id){clearTimeout(mobileUiGesture.longTimer);const p=canvasTouchPoint(touch),shouldGlide=mobileUiGesture.moved;if(!mobileUiGesture.moved&&!mobileUiGesture.longPressed)dispatchMobileCanvasClick(p);mobileUiGesture=null;if(shouldGlide)startMobileScrollInertia();}}}
canvas.addEventListener("touchend",endMobileTouches,{passive:false});canvas.addEventListener("touchcancel",endMobileTouches,{passive:false});
addEventListener("orientationchange",()=>{releaseMobileJoystick();mobileAttackTouchId=null;mouse.down=false;});

function getMobileSkillIcon(key){
  const index={q:0,e:1,x:2,r:3}[key]??0;
  if(selectedCharacter==="yupiter"){if(key==="q")return{image:[crescentBladeSprite,severingBladeSprite,flameCannonSprite][player.yupiterWeapon]};if(key==="e")return{image:yupiterESkillIcons[player.yupiterWeapon]};if(key==="r")return{image:yupiterUltimateIcon};}
  if(selectedCharacter==="ren")return{image:renSkillIcons[{q:0,x:1,e:2,r:3}[key]]};
  if(selectedCharacter==="nightLord")return{image:nightLordSkillIcons[index]};if(selectedCharacter==="zero")return{image:zeroSkillIcons[index]};if(selectedCharacter==="paladin")return{image:paladinSkillIcons[index]};
  const atlases={arc:arcSkillIconAtlas,terra:terraSkillIconAtlas,void:voidSkillIconAtlas,carmilla:carmillaSkillIconAtlas,vargas:vargasSkillIconAtlas,echo:echoSkillIconAtlas,aria:ariaSkillIconAtlas,moira:moiraSkillIconAtlas,mare:mareSkillIconAtlas};
  return atlases[selectedCharacter]?{atlas:atlases[selectedCharacter],index}:null;
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

function drawMobileIcon(icon,cx,cy,r){
  if(!icon)return false;const image=icon.image||icon.atlas;if(!image?.complete||!image.naturalWidth)return false;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-3,0,Math.PI*2);ctx.clip();if(icon.atlas){const sw=image.naturalWidth/2,sh=image.naturalHeight/2;ctx.drawImage(image,(icon.index%2)*sw,Math.floor(icon.index/2)*sh,sw,sh,cx-r,cy-r,r*2,r*2);}else ctx.drawImage(image,cx-r,cy-r,r*2,r*2);ctx.restore();return true;
}

function drawCommonAttackIcon(cx,cy,r){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.35);ctx.lineCap="round";const g=ctx.createLinearGradient(-r*.5,-r*.5,r*.55,r*.55);g.addColorStop(0,"#ffffff");g.addColorStop(.35,"#79efff");g.addColorStop(1,"#1687c8");ctx.strokeStyle=g;ctx.shadowColor="#35dfff";ctx.shadowBlur=10;for(let i=-1;i<=1;i++){ctx.lineWidth=i===0?5:3;ctx.beginPath();ctx.moveTo(-r*.45,i*10+r*.18);ctx.quadraticCurveTo(0,-r*.15+i*7,r*.46,-r*.42+i*4);ctx.stroke();}ctx.restore();}

function drawMobileHomeScreen(){
  drawMenuBackdrop(.66);const info=characterSkillGuide[selectedCharacter]||characterSkillGuide.default,accent=info.color||"#57ddff",sprite=getCharacterPreviewSprite(selectedCharacter),pad=Math.max(20,canvas.width*.035),top=50,leftW=Math.min(430,canvas.width*.52),heroX=canvas.width*.76;
  const shade=ctx.createLinearGradient(0,0,canvas.width,0);shade.addColorStop(0,"rgba(2,5,13,.96)");shade.addColorStop(.58,"rgba(4,7,16,.45)");shade.addColorStop(1,"rgba(2,3,9,.86)");ctx.fillStyle=shade;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="rgba(2,4,10,.82)";ctx.fillRect(0,0,canvas.width,42);
  ctx.textAlign="left";ctx.fillStyle="#ff536d";ctx.font="900 10px Arial";ctx.fillText("NIGHT PROTOCOL / 03",pad,20);ctx.fillStyle="#fff";ctx.font="900 24px Arial";ctx.fillText("ZOMBIE SURVIVAL",pad,38);
  const glow=ctx.createRadialGradient(heroX,canvas.height*.47,10,heroX,canvas.height*.47,canvas.height*.48);glow.addColorStop(0,`${accent}45`);glow.addColorStop(1,`${accent}00`);ctx.fillStyle=glow;ctx.fillRect(canvas.width*.5,42,canvas.width*.5,canvas.height-42);
  if(sprite?.complete&&sprite.naturalWidth){const maxW=canvas.width*.29,maxH=canvas.height*.68,scale=Math.min(maxW/sprite.naturalWidth,maxH/sprite.naturalHeight),dw=sprite.naturalWidth*scale,dh=sprite.naturalHeight*scale;ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=24;ctx.drawImage(sprite,heroX-dw/2,canvas.height*.48-dh/2,dw,dh);ctx.restore();}
  ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 21px Arial";ctx.fillText(info.name,heroX,canvas.height-31);ctx.fillStyle=accent;ctx.fillRect(heroX-38,canvas.height-20,76,2);
  const menuW=leftW,startY=top;homeStartRect={x:pad,y:startY,w:menuW,h:62};const pg=ctx.createLinearGradient(pad,startY,pad+menuW,startY);pg.addColorStop(0,"#14899f");pg.addColorStop(1,"#293e83");ctx.save();ctx.shadowColor="#2edfff";ctx.shadowBlur=18;drawRoundedRect(pad,startY,menuW,62,11,pg,"#74efff",2);ctx.restore();ctx.fillStyle="#fff";ctx.font="900 20px Arial";ctx.textAlign="left";ctx.fillText("▶  작전 시작",pad+22,startY+30);ctx.fillStyle="rgba(235,250,255,.7)";ctx.font="11px Arial";ctx.fillText(`${info.name}으로 생존 시작`,pad+51,startY+49);
  const gap=8,cardY=startY+72,cardH=72,cardW=(menuW-gap)/2,cardData=[["#b875ff","◆","캐릭터"],["#ffd15b","✦","증강 도감"],["#5fe3ad","?","게임 가이드"],["#ff6b83","☣","몬스터 도감"]],rects=[];for(let i=0;i<4;i++){const rect={x:pad+(i%2)*(cardW+gap),y:cardY+Math.floor(i/2)*(cardH+gap),w:cardW,h:cardH};rects.push(rect);const [color,icon,label]=cardData[i],g=ctx.createLinearGradient(rect.x,rect.y,rect.x+rect.w,rect.y+rect.h);g.addColorStop(0,`${color}58`);g.addColorStop(1,`${color}20`);ctx.save();ctx.shadowColor=color;ctx.shadowBlur=13;drawRoundedRect(rect.x,rect.y,rect.w,rect.h,10,g,`${color}a8`,1.5);ctx.restore();ctx.fillStyle=color;ctx.font="bold 18px Arial";ctx.textAlign="center";ctx.fillText(icon,rect.x+25,rect.y+31);ctx.fillStyle="#fff";ctx.font="900 14px Arial";ctx.textAlign="left";ctx.fillText(label,rect.x+48,rect.y+29);ctx.fillStyle="rgba(225,233,246,.62)";ctx.font="10px Arial";ctx.fillText(i===0?"생존자 선택":i===1?"빌드 확인":i===2?"조작·보스":"적·보스 정보",rect.x+15,rect.y+55);} [homeCharacterRect,homeAugmentGuideRect,homeGameGuideRect,homeMonsterGuideRect]=rects;
  ctx.textAlign="left";
}

function drawMobileControls(){
  if(!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory)return;const {joystick,attack,skills}=getMobileControlLayout();ctx.save();
  ctx.globalAlpha=.86;ctx.fillStyle="rgba(8,16,29,.68)";ctx.strokeStyle="rgba(123,220,255,.58)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="rgba(123,220,255,.16)";ctx.beginPath();ctx.arc(joystick.x,joystick.y,joystick.r*.68,0,Math.PI*2);ctx.stroke();
  const knobR=joystick.r*.37,kx=joystick.x+mobileStickX,ky=joystick.y+mobileStickY;ctx.fillStyle="rgba(103,218,255,.45)";ctx.shadowColor="#53d9ff";ctx.shadowBlur=mobileJoystickTouchId===null?8:18;ctx.beginPath();ctx.arc(kx,ky,knobR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b6f2ff";ctx.stroke();ctx.shadowBlur=0;
  const attackGlow=mobileAttackTouchId!==null;const ag=ctx.createRadialGradient(attack.x-10,attack.y-12,4,attack.x,attack.y,attack.r);ag.addColorStop(0,attackGlow?"#247ba2":"#183d56");ag.addColorStop(1,"#07131f");ctx.fillStyle=ag;ctx.strokeStyle=attackGlow?"#8cf3ff":"#46cce9";ctx.lineWidth=3;ctx.shadowColor="#33dfff";ctx.shadowBlur=attackGlow?24:12;ctx.beginPath();ctx.arc(attack.x,attack.y,attack.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;drawCommonAttackIcon(attack.x,attack.y,attack.r*.72);
  for(const skill of skills){ctx.fillStyle="rgba(9,12,24,.88)";ctx.strokeStyle="#c8d5ed";ctx.lineWidth=2;ctx.shadowColor="#7b8fff";ctx.shadowBlur=10;ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;if(!drawMobileIcon(getMobileSkillIcon(skill.key),skill.x,skill.y,skill.r)){ctx.fillStyle="#fff";ctx.font=`900 ${skill.r*.7}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(skill.key.toUpperCase(),skill.x,skill.y+1);}const cooldown=getMobileSkillCooldown(skill.key);if(cooldown?.value>0)drawCooldownCover(skill.x,skill.y,skill.r,cooldown.value/cooldown.max,cooldown.value);ctx.fillStyle="#fff";ctx.font="900 10px Arial";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(cooldown?.label||skill.key.toUpperCase(),skill.x,skill.y+skill.r+12);}
  ctx.restore();
}

function drawMobilePortraitLock(){
  const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#07101d");g.addColorStop(1,"#170927");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height/2-45);ctx.rotate(-Math.PI/2);ctx.strokeStyle="#7ceaff";ctx.lineWidth=6;ctx.shadowColor="#50dfff";ctx.shadowBlur=22;drawRoundedRect(-58,-96,116,192,18,"rgba(15,31,52,.9)","#7ceaff",5);ctx.fillStyle="#b975ff";ctx.beginPath();ctx.arc(0,72,7,0,Math.PI*2);ctx.fill();ctx.restore();ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="900 26px Arial";ctx.fillText("기기를 가로로 돌려주세요",canvas.width/2,canvas.height/2+95);ctx.fillStyle="#9fb3cb";ctx.font="14px Arial";ctx.fillText("모바일 플레이는 가로 화면에서만 지원됩니다",canvas.width/2,canvas.height/2+124);ctx.textAlign="left";
}
