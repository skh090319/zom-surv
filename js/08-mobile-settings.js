// Mobile preferences: navigation, camera zoom and independently editable controls.
let mobileSettingsPage = "menu";
let mobileSettingsTarget = "joystick";
let mobileSettingsEditGroup="buttons";
let mobileSettingsGroupRects=[];
let mobileSettingsUndoRect={x:0,y:0,w:0,h:0},mobileSettingsRedoRect={x:0,y:0,w:0,h:0};
let mobileSettingsUndo=[],mobileSettingsRedo=[],mobileSettingsHistoryCurrent=null;
function recordMobileSettingsHistory(){
  const current=JSON.stringify(mobileControlSettings);
  if(screenMode==='mobileSettings'&&mobileSettingsHistoryCurrent!==null&&current!==mobileSettingsHistoryCurrent){
    mobileSettingsUndo.push(mobileSettingsHistoryCurrent);if(mobileSettingsUndo.length>100)mobileSettingsUndo.shift();mobileSettingsRedo=[];
  }
  mobileSettingsHistoryCurrent=current;
}
function replayMobileSettingsHistory(redo=false){
  const source=redo?mobileSettingsRedo:mobileSettingsUndo,dest=redo?mobileSettingsUndo:mobileSettingsRedo;
  if(!source.length)return;
  dest.push(JSON.stringify(mobileControlSettings));mobileControlSettings=JSON.parse(source.pop());
  mobileSettingsHistoryCurrent=JSON.stringify(mobileControlSettings);saveMobileControlSettings();
}
function getMobileHudBounds(id){
  const cw=canvas.width,ch=canvas.height,margin=Math.max(120,cw*.29);
  const layouts={health:{x:cw/2,y:30,w:Math.min(520,cw-80)+8,h:32},exp:{x:cw/2,y:ch-52,w:Math.max(150,cw-margin*2),h:38},
    boss:{x:cw/2,y:73,w:Math.min(400,cw*.62)+6,h:60},timer:{x:cw/2,y:73,w:Math.min(400,cw*.62),h:48},
    resource:{x:cw/2,y:ch-(['astra','mare'].includes(selectedCharacter)?91:85),w:['astra','mare'].includes(selectedCharacter)?Math.min(370,cw*.44):Math.min(330,Math.max(180,cw*.36))+8,h:['astra','mare'].includes(selectedCharacter)?34:36},
    pause:{x:cw-47,y:45,w:54,h:54}};
  return layouts[id];
}
function getMobileHudLayout(id){
  const base=getMobileHudBounds(id),saved=mobileControlSettings.hud?.[id]||{},scale=Math.max(.2,saved.scale||1);
  return {...base,id,name:{health:'내 체력',exp:'경험치',boss:'보스 체력',timer:'타이머·주의',resource:'스택·게이지',pause:'일시정지'}[id],hud:true,scale,
    x:saved.x===null||saved.x===undefined?base.x:saved.x*canvas.width,y:saved.y===null||saved.y===undefined?base.y:saved.y*canvas.height,w:base.w*scale,h:base.h*scale,r:Math.max(base.w,base.h)*scale/2};
}
function drawMobileEditableHud(id,draw){
  if(!isMobileTouchDevice())return draw();
  const base=getMobileHudBounds(id),layout=getMobileHudLayout(id);
  ctx.save();ctx.translate(layout.x,layout.y);ctx.scale(layout.scale,layout.scale);ctx.translate(-base.x,-base.y);
  try{return draw();}finally{ctx.restore();}
}
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
  mobileSettingsUndo=[];mobileSettingsRedo=[];mobileSettingsHistoryCurrent=JSON.stringify(mobileControlSettings);
  mobileSettingsEditGroup='buttons';
}

function leaveMobileSettingsPage(){
  saveMobileControlSettings();resetMobileSettingsGestures();mobileUiGesture=null;
  if(mobileSettingsPage==="menu")screenMode="home";
  else mobileSettingsPage="menu";
}

function getMobileSettingControls(){
  if(mobileSettingsEditGroup==='hud'){
    // Fit the entire game HUD below the toolbar, including bars normally at the very top.
    const factor=Math.max(.1,(canvas.height-138)/canvas.height),offsetX=canvas.width*(1-factor)/2;
    return ['health','exp','boss','timer','resource','pause'].map(id=>{
      const layout=getMobileHudLayout(id);
      return {...layout,x:offsetX+layout.x*factor,y:124+layout.y*factor,w:layout.w*factor,h:layout.h*factor,r:layout.r*factor,editorScale:factor,editorOffsetX:offsetX};
    });
  }
  const layout=getMobileControlLayout();
  return [{...layout.joystick,id:"joystick",name:"이동"},{...layout.attack,id:"attack",name:"평타"},
    ...layout.skills.map(skill=>({...skill,id:skill.key,name:getMobileSkillName(skill.key)}))];
}

function getMobileSettingScale(){
  if(mobileControlSettings.hud?.[mobileSettingsTarget])return mobileControlSettings.hud[mobileSettingsTarget].scale;
  if(mobileSettingsTarget==="joystick")return mobileControlSettings.joystickScale;
  if(mobileSettingsTarget==="attack")return mobileControlSettings.actionScale;
  return mobileControlSettings.skills[mobileSettingsTarget].scale;
}

function setMobileSettingScale(value){
  if(mobileControlSettings.hud?.[mobileSettingsTarget]){mobileControlSettings.hud[mobileSettingsTarget].scale=Math.max(.2,value);saveMobileControlSettings();return;}
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
  const control=getMobileSettingControls().filter(c=>c.hud?pointInRect(p.x,p.y,{x:c.x-c.w/2,y:c.y-c.h/2,w:c.w,h:c.h}):pointInCircle(p,{...c,r:c.r*1.15}))
    .sort((a,b)=>a.id===mobileSettingsTarget?-1:b.id===mobileSettingsTarget?1:Math.hypot(p.x-a.x,p.y-a.y)/a.r-Math.hypot(p.x-b.x,p.y-b.y)/b.r)[0];
  if(!control)return null;
  mobileSettingsTarget=control.id;
  return {controlTarget:control.id,offsetX:p.x-control.x,offsetY:p.y-control.y};
}

function moveMobileSettingControl(gesture,p){
  const target=gesture.controlTarget,control=getMobileSettingControls().find(c=>c.id===target);
  if(!control)return;
  if(control.hud){Object.assign(mobileControlSettings.hud[target],{
    x:Math.max(0,Math.min(1,(p.x-gesture.offsetX-control.editorOffsetX)/control.editorScale/canvas.width)),
    y:Math.max(0,Math.min(1,(p.y-gesture.offsetY-124)/control.editorScale/canvas.height))});return;}
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
    const hud=mobileSettingsEditGroup==='hud'?null:mobileControlSettings.hud;
    if(mobileSettingsEditGroup==='hud'){
      for(const key of Object.keys(mobileControlSettings.hud))mobileControlSettings.hud[key]={x:null,y:null,scale:1};
      saveMobileControlSettings();return;
    }
    const zoom=getMobileViewZoom();
    mobileControlSettings={...MOBILE_CONTROL_DEFAULTS,version:2,viewZoom:zoom,skills:{},hud};
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
    if(pointInRect(p.x,p.y,mobileSettingsUndoRect)){replayMobileSettingsHistory();return true;}
    if(pointInRect(p.x,p.y,mobileSettingsRedoRect)){replayMobileSettingsHistory(true);return true;}
    const group=mobileSettingsGroupRects.find(rect=>pointInRect(p.x,p.y,rect));
    if(group){mobileSettingsEditGroup=group.id;mobileSettingsTarget=group.id==='hud'?'health':'joystick';return true;}
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
    {page:"controls",title:"버튼·UI 편집",icon:"⊕",subtitle:"조작 버튼 · 체력 · 경험치 · 스택",detail:"각각 이동·크기 조절 · 실행 취소",color:"#b99ada"}];
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
  if(!controls.some(c=>c.id===mobileSettingsTarget))mobileSettingsTarget=controls[0].id;
  ctx.setLineDash([5,8]);ctx.strokeStyle="rgba(128,182,210,.16)";ctx.strokeRect(12,120,canvas.width-24,canvas.height-134);ctx.setLineDash([]);
  // Timer and boss health occupy the same default slot in different combat states.
  // Draw the selected element last so either can be edited without being hidden.
  for(const control of [...controls].sort((a,b)=>Number(a.id===mobileSettingsTarget)-Number(b.id===mobileSettingsTarget))){
    const {x,y,r,id,name}=control,selected=id===mobileSettingsTarget;
    if(control.hud){
      const rect={x:x-control.w/2,y:y-control.h/2,w:control.w,h:control.h};
      drawRoundedRect(rect.x,rect.y,rect.w,rect.h,5,'rgba(16,38,56,.9)',selected?'#e8f7c1':'#7fa7c5',selected?3:1);
      ctx.fillStyle={health:'#e7617e',exp:'#b84dff',boss:'#cc487f',resource:'#64b9db'}[id]||'#819eb5';
      ctx.fillRect(rect.x+3,rect.y+rect.h*.6,Math.max(1,rect.w-6)*.65,Math.max(2,rect.h*.23));
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(9,12*control.scale)}px Arial`;
      ctx.fillText(name,x,y,Math.max(1,control.w-8));ctx.textBaseline='alphabetic';continue;
    }
    ctx.fillStyle="rgba(9,21,31,.92)";ctx.strokeStyle=selected?"#e8f7c1":id==="joystick"?"#6bcfe7":"#a99ed3";ctx.lineWidth=selected?3:1.5;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(selectedCharacter==='astra'&&(id==='joystick'||id==='attack')){
      drawAstraControlIcon(x,y,r,id,selected);
    }else if(id==="joystick"){
      ctx.fillStyle="#47778b";ctx.beginPath();ctx.arc(x,y,r*.35,0,Math.PI*2);ctx.fill();
    }else if(id==="attack")drawCommonAttackIcon(x,y,r*.7);
    else if(!drawMobileIcon(getMobileSkillIcon(id),x,y,r)){
      ctx.textAlign="center";ctx.fillStyle="#eaf4ff";ctx.font="bold 10px Arial";ctx.fillText(name,x,y+4,r*1.7);
    }
    if(selectedCharacter==='astra'&&id!=='joystick'&&id!=='attack')drawAstraSkillFrame(x,y,r);
    if(selected){ctx.strokeStyle="#e8f7c1";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+5,0,Math.PI*2);ctx.stroke();}
    ctx.textAlign="center";ctx.fillStyle="#f0f7fd";ctx.font="bold 10px Arial";
    if(id==="joystick"||id==="attack")ctx.fillText(name,x,Math.min(canvas.height-5,y+r+13));
  }
  // Draw the editor toolbar last so oversized controls cannot cover it.
  drawMobileSettingsHeader("버튼·UI 편집","항목 선택 → 끌어서 이동 · ± 크기 조절 · 변경 자동 저장");
  mobileSettingsUndoRect={x:canvas.width-376,y:14,w:90,h:40};mobileSettingsRedoRect={x:canvas.width-282,y:14,w:94,h:40};
  ctx.globalAlpha=mobileSettingsUndo.length?1:.4;drawMobileSettingsButton(mobileSettingsUndoRect,'실행 취소');
  ctx.globalAlpha=mobileSettingsRedo.length?1:.4;drawMobileSettingsButton(mobileSettingsRedoRect,'다시 실행');ctx.globalAlpha=1;
  mobileSettingsGroupRects=[{id:'buttons',x:16,y:72,w:58,h:36},{id:'hud',x:79,y:72,w:58,h:36}];
  for(const rect of mobileSettingsGroupRects)drawMobileSettingsButton(rect,rect.id==='hud'?'UI':'버튼',rect.id===mobileSettingsEditGroup);
  const gap=5,left=146,sizeW=154,available=canvas.width-left-16-sizeW-10,tabW=(available-gap*(controls.length-1))/controls.length;
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
