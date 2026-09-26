// Mobile preferences: navigation, camera zoom and independently editable controls.
let mobileSettingsPage = "menu";
let mobileSettingsTarget = "joystick";
let mobileSettingsCategoryRects = [];
let mobileSettingsTargetRects = [];
let mobileSettingsMinusRect = {x:0,y:0,w:0,h:0};
let mobileSettingsPlusRect = {x:0,y:0,w:0,h:0};
const mobileViewTouches = new Map();
let mobileViewPinch = null;
let mobileViewPinchConsumed = false;

function resetMobileSettingsGestures(){
  mobileViewTouches.clear();mobileViewPinch=null;mobileViewPinchConsumed=false;
  mobileSettingsMouseDrag=null;
}

function openMobileSettings(){
  stopMobileScrollInertia();releaseMobileJoystick();mobileAttackTouchId=null;
  mobileAttackAim=null;mobileSkillAim=null;mobileUiGesture=null;mouse.down=false;
  resetMobileSettingsGestures();mobileSettingsCategoryRects=[];mobileSettingsPage="menu";screenMode="mobileSettings";
}

function leaveMobileSettingsPage(){
  saveMobileControlSettings();resetMobileSettingsGestures();mobileUiGesture=null;
  if(mobileSettingsPage==="menu")screenMode="home";
  else mobileSettingsPage="menu";
}

function getMobileSettingControls(){
  const layout=getMobileControlLayout();
  return [{...layout.joystick,id:"joystick",name:"이동"},{...layout.attack,id:"attack",name:"평타"},
    ...layout.skills.map(skill=>({...skill,id:skill.key,name:getMobileSkillName(skill.key)}))];
}

function getMobileSettingScale(){
  if(mobileSettingsTarget==="joystick")return mobileControlSettings.joystickScale;
  if(mobileSettingsTarget==="attack")return mobileControlSettings.actionScale;
  return mobileControlSettings.skills[mobileSettingsTarget].scale;
}

function setMobileSettingScale(value){
  const scale=clampMobileControlScale(value);
  if(mobileSettingsTarget==="joystick")mobileControlSettings.joystickScale=scale;
  else if(mobileSettingsTarget==="attack")mobileControlSettings.actionScale=scale;
  else mobileControlSettings.skills[mobileSettingsTarget].scale=scale;
  saveMobileControlSettings();
}

function setMobileViewZoom(value){
  mobileControlSettings.viewZoom=clampMobileViewZoom(value);
  updateCamera();screenToWorld();
}

function beginMobileSettingDrag(p){
  if(mobileSettingsPage!=="controls"||p.y<116)return null;
  const control=getMobileSettingControls().filter(c=>pointInCircle(p,{...c,r:c.r*1.15}))
    .sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)/a.r-Math.hypot(p.x-b.x,p.y-b.y)/b.r)[0];
  if(!control)return null;
  mobileSettingsTarget=control.id;
  return {controlTarget:control.id,offsetX:p.x-control.x,offsetY:p.y-control.y};
}

function moveMobileSettingControl(gesture,p){
  const target=gesture.controlTarget,control=getMobileSettingControls().find(c=>c.id===target);
  if(!control)return;
  const minX=target==="attack"?canvas.width*.5:12,maxX=target==="joystick"?canvas.width*.45:canvas.width-12;
  const x=fitMobileControlCenter(p.x-gesture.offsetX,control.r,minX,maxX)/canvas.width;
  const y=fitMobileControlCenter(p.y-gesture.offsetY,control.r,118,canvas.height-14)/canvas.height;
  if(target==="joystick"||target==="attack"){
    mobileControlSettings[target+"X"]=x;mobileControlSettings[target+"Y"]=y;
  }else Object.assign(mobileControlSettings.skills[target],{x,y});
}

function resetMobileSettingsPage(){
  if(mobileSettingsPage==="view")setMobileViewZoom(1);
  else if(mobileSettingsPage==="controls"){
    const zoom=getMobileViewZoom();
    mobileControlSettings={...MOBILE_CONTROL_DEFAULTS,version:2,viewZoom:zoom,skills:{}};
    for(const key of ["q","e","x","r"])mobileControlSettings.skills[key]={x:null,y:null,scale:1};
  }
  saveMobileControlSettings();
}

function handleMobileSettingsTap(p){
  if(pointInRect(p.x,p.y,mobileSettingsBackRect)){leaveMobileSettingsPage();return true;}
  if(mobileSettingsPage==="menu"){
    const entry=mobileSettingsCategoryRects.find(rect=>pointInRect(p.x,p.y,rect));
    if(entry){mobileSettingsPage=entry.page;mobileSettingsTarget="joystick";resetMobileSettingsGestures();}
    return !!entry;
  }
  if(pointInRect(p.x,p.y,mobileSettingsResetRect)){resetMobileSettingsPage();return true;}
  const delta=pointInRect(p.x,p.y,mobileSettingsMinusRect)?-.1:pointInRect(p.x,p.y,mobileSettingsPlusRect)?.1:0;
  if(delta){
    if(mobileSettingsPage==="view"){setMobileViewZoom(getMobileViewZoom()+delta);saveMobileControlSettings();}
    else setMobileSettingScale(getMobileSettingScale()+delta);
    return true;
  }
  if(mobileSettingsPage==="controls"){
    const target=mobileSettingsTargetRects.find(rect=>pointInRect(p.x,p.y,rect));
    if(target){mobileSettingsTarget=target.id;return true;}
  }
  return false;
}

// Pinch is settings-only: combat multitouch still moves, attacks and casts normally.
function handleMobileViewTouches(event){
  const ending=event.type==="touchend"||event.type==="touchcancel";
  if(ending){
    const consumed=mobileViewPinchConsumed;
    for(const touch of event.changedTouches)mobileViewTouches.delete(touch.identifier);
    if(mobileViewTouches.size<2)mobileViewPinch=null;
    if(consumed){mobileUiGesture=null;saveMobileControlSettings();}
    if(mobileViewTouches.size===0)mobileViewPinchConsumed=false;
    return consumed;
  }
  for(const touch of event.changedTouches)mobileViewTouches.set(touch.identifier,canvasTouchPoint(touch));
  const points=[...mobileViewTouches.values()].filter(p=>p.y>76&&p.y<canvas.height-68).slice(0,2);
  if(points.length===2){
    const distance=Math.max(1,Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y));
    if(!mobileViewPinch)mobileViewPinch={distance,zoom:getMobileViewZoom()};
    else setMobileViewZoom(mobileViewPinch.zoom*distance/mobileViewPinch.distance);
    mobileViewPinchConsumed=true;mobileUiGesture=null;
    return true;
  }
  return mobileViewPinchConsumed;
}

addEventListener("blur",()=>{if(screenMode==="mobileSettings")saveMobileControlSettings();resetMobileSettingsGestures();mobileUiGesture=null;});
addEventListener("resize",()=>{resetMobileSettingsGestures();mobileUiGesture=null;});

function drawMobileSettingsButton(rect,label,active=false){
  drawRoundedRect(rect.x,rect.y,rect.w,rect.h,7,active?"#254353":"#121f2a",active?"#77d6e5":"#4c6170",1);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=active?"#e9fcff":"#cad6df";
  ctx.font="bold 12px Arial";
  if(rect.w<105&&label.length>5){
    const split=Math.ceil(label.length/2);ctx.font="bold 10px Arial";
    ctx.fillText(label.slice(0,split).trim(),rect.x+rect.w/2,rect.y+rect.h/2-6,rect.w-8);
    ctx.fillText(label.slice(split).trim(),rect.x+rect.w/2,rect.y+rect.h/2+6,rect.w-8);
  }else ctx.fillText(label,rect.x+rect.w/2,rect.y+rect.h/2,rect.w-10);
  ctx.textBaseline="alphabetic";
}

function drawMobileSettingsHeader(title,subtitle){
  const pad=Math.max(16,canvas.width*.025);
  ctx.fillStyle="rgba(5,11,18,.94)";ctx.fillRect(0,0,canvas.width,mobileSettingsPage==="controls"?116:76);
  ctx.textAlign="left";ctx.fillStyle="#f3f7fb";ctx.font="bold 21px Arial";ctx.fillText(title,pad,31);
  ctx.fillStyle="#a4b6c5";ctx.font="12px Arial";ctx.fillText(subtitle,pad,54,canvas.width-pad-195);
  mobileSettingsBackRect={x:canvas.width-94,y:14,w:78,h:40};
  drawMobileSettingsButton(mobileSettingsBackRect,mobileSettingsPage==="menu"?"홈으로":"뒤로",true);
  mobileSettingsResetRect={x:canvas.width-180,y:14,w:78,h:40};
  if(mobileSettingsPage!=="menu")drawMobileSettingsButton(mobileSettingsResetRect,"초기화");
}

function drawMobileSettingsMenu(){
  drawMobileSettingsHeader("모바일 설정","조절할 항목을 선택하세요 · 변경사항은 자동 저장됩니다");
  const gap=18,w=Math.min(320,(canvas.width-54)/2),h=Math.min(170,canvas.height-112),y=80+(canvas.height-80-h)/2;
  const entries=[{page:"view",title:"화면 크기",icon:"−  /  +",subtitle:"두 손가락 또는 ±로 확대·축소",detail:`현재 배율 ${Math.round(getMobileViewZoom()*100)}%`,color:"#75c9df"},
    {page:"controls",title:"조이스틱 편집",icon:"⊕",subtitle:"이동 · 평타 · 스킬을 각각 편집",detail:"버튼별 위치와 크기 저장",color:"#b99ada"}];
  mobileSettingsCategoryRects=entries.map((entry,i)=>({...entry,x:(canvas.width-w*2-gap)/2+i*(w+gap),y,w,h}));
  for(const rect of mobileSettingsCategoryRects){
    drawRoundedRect(rect.x,rect.y,w,h,10,"rgba(12,24,34,.95)",rect.color,1.4);
    ctx.textAlign="center";ctx.fillStyle=rect.color;ctx.font="25px Arial";ctx.fillText(rect.icon,rect.x+w/2,y+35);
    ctx.fillStyle="#f1f6fb";ctx.font="bold 21px Arial";ctx.fillText(rect.title,rect.x+w/2,y+68);
    ctx.fillStyle="#bccbd7";ctx.font="12px Arial";ctx.fillText(rect.subtitle,rect.x+w/2,y+96);
    ctx.fillStyle="#8098aa";ctx.font="11px Arial";ctx.fillText(rect.detail,rect.x+w/2,y+121);
  }
}

function drawMobileViewSettings(){
  // Draw the real world at the chosen scale without advancing the simulation.
  updateCamera();
  const scale=getWorldViewScale(),previewOffset=18*scale+4;
  ctx.save();ctx.translate(0,previewOffset);drawBackground();drawZombies();drawPlayer();ctx.restore();
  const cx=(player.x-camera.x)*scale,cy=(player.y-camera.y)*scale+previewOffset;
  ctx.strokeStyle="rgba(120,218,231,.4)";ctx.lineWidth=1;ctx.setLineDash([5,7]);
  for(const distance of [150,300]){ctx.beginPath();ctx.arc(cx,cy,distance*scale,0,Math.PI*2);ctx.stroke();}
  ctx.setLineDash([]);
  drawMobileSettingsHeader("화면 크기","캐릭터를 중심으로 확대·축소 · 아래 미리보기에서 두 손가락 사용");
  const y=canvas.height-62,cxBar=canvas.width/2;
  drawRoundedRect(cxBar-170,y,340,48,9,"rgba(5,13,22,.96)","#466172",1);
  mobileSettingsMinusRect={x:cxBar-162,y:y+4,w:48,h:40};mobileSettingsPlusRect={x:cxBar+114,y:y+4,w:48,h:40};
  drawMobileSettingsButton(mobileSettingsMinusRect,"−");drawMobileSettingsButton(mobileSettingsPlusRect,"+");
  ctx.textAlign="center";ctx.fillStyle="#eefaff";ctx.font="bold 18px Arial";ctx.fillText(`${Math.round(getMobileViewZoom()*100)}%`,cxBar,y+21);
  ctx.fillStyle="#9cb6c8";ctx.font="11px Arial";ctx.fillText("축소 50%  ·  확대 200%",cxBar,y+38);
}

function drawMobileControlEditor(){
  const controls=getMobileSettingControls();
  if(!controls.some(c=>c.id===mobileSettingsTarget))mobileSettingsTarget="joystick";
  ctx.setLineDash([5,8]);ctx.strokeStyle="rgba(128,182,210,.16)";ctx.strokeRect(12,120,canvas.width-24,canvas.height-134);ctx.setLineDash([]);
  for(const control of controls){
    const {x,y,r,id,name}=control,selected=id===mobileSettingsTarget;
    ctx.fillStyle="rgba(9,21,31,.92)";ctx.strokeStyle=selected?"#e8f7c1":id==="joystick"?"#6bcfe7":"#a99ed3";ctx.lineWidth=selected?3:1.5;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(id==="joystick"){
      ctx.fillStyle="#47778b";ctx.beginPath();ctx.arc(x,y,r*.35,0,Math.PI*2);ctx.fill();
    }else if(id==="attack")drawCommonAttackIcon(x,y,r*.7);
    else if(!drawMobileIcon(getMobileSkillIcon(id),x,y,r)){
      ctx.textAlign="center";ctx.fillStyle="#eaf4ff";ctx.font="bold 10px Arial";ctx.fillText(name,x,y+4,r*1.7);
    }
    if(selected){ctx.strokeStyle="#e8f7c1";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();}
    ctx.textAlign="center";ctx.fillStyle="#f0f7fd";ctx.font="bold 10px Arial";
    if(id==="joystick"||id==="attack")ctx.fillText(name,x,Math.min(canvas.height-5,y+r+13));
  }
  // Draw the editor toolbar last so oversized controls cannot cover it.
  drawMobileSettingsHeader("조이스틱 편집","버튼을 선택해 크기 조절 · 직접 끌어 위치 변경 · 각각 따로 저장");
  const gap=5,left=16,sizeW=154,available=canvas.width-left*2-sizeW-10,tabW=(available-gap*(controls.length-1))/controls.length;
  mobileSettingsTargetRects=controls.map((control,i)=>({...control,x:left+i*(tabW+gap),y:72,w:tabW,h:36}));
  for(const rect of mobileSettingsTargetRects)drawMobileSettingsButton(rect,rect.name,rect.id===mobileSettingsTarget);
  mobileSettingsMinusRect={x:canvas.width-16-sizeW,y:72,w:38,h:36};mobileSettingsPlusRect={x:canvas.width-54,y:72,w:38,h:36};
  drawMobileSettingsButton(mobileSettingsMinusRect,"−");drawMobileSettingsButton(mobileSettingsPlusRect,"+");
  ctx.textAlign="center";ctx.fillStyle="#e8f7c1";ctx.font="bold 13px Arial";ctx.fillText(`${Math.round(getMobileSettingScale()*100)}%`,canvas.width-16-sizeW/2,95);
}

function drawMobileControlSettings(){
  ctx.save();
  if(mobileSettingsPage==="view")drawMobileViewSettings();
  else{
    drawMenuBackdrop(.76);ctx.fillStyle="rgba(3,9,15,.85)";ctx.fillRect(0,0,canvas.width,canvas.height);
    if(mobileSettingsPage==="menu")drawMobileSettingsMenu();else drawMobileControlEditor();
  }
  ctx.restore();
}
