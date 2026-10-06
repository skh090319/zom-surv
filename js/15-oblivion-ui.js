// One black-metal language for the identity panel, status bars and touch controls.
const OBLIVION_SKILL_NAMES={q:'공간 파쇄',e:'재앙의 손',x:'봉인 해제',r:'종언의 현현'};
let oblivionHudGauge=0;
function resetOblivionCombatHud(){oblivionHudGauge=0;}
function updateOblivionCombatHud(){oblivionHudGauge+=(Math.max(0,Math.min(100,oblivionState.gauge))-oblivionHudGauge)*.16;}
function oblivionUiTime(){return oblivionState.frame||0;}
function oblivionUiText(text,x,y,width,size=12,min=size,bold=false){
  let font=size;const set=()=>ctx.font=`${bold?'bold ':''}${font}px Arial`;set();
  while(font>min&&ctx.measureText(text).width>width){font--;set();}
  if(ctx.measureText(text).width>width){while(text.length&&ctx.measureText(text+'…').width>width)text=text.slice(0,-1);text+='…';}
  ctx.fillText(text,x,y);
}
function oblivionUiImage(image,x,y,w,h=w){
  const im=ensureGameImage(image);if(!im?.complete||!im.naturalWidth||!im.naturalHeight)return false;
  ctx.drawImage(im,x,y,w,h);return true;
}
function oblivionUiShard(x,y,r,color='#d3ccd8',angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.4,-r*.15);ctx.lineTo(0,r);ctx.lineTo(-r*.4,r*.12);ctx.closePath();ctx.fill();ctx.restore();
}
function drawOblivionMetalFrame(x,y,w,h,image=oblivionCombatArt.panel){
  ctx.save();const im=ensureGameImage(image);
  if(im?.complete&&im.naturalWidth&&im.naturalHeight){
    const sx=im.naturalWidth*.14,sy=im.naturalHeight*.28,dx=Math.min(23,w*.15),dy=Math.min(22,h*.30);
    const xs=[0,sx,im.naturalWidth-sx,im.naturalWidth],ys=[0,sy,im.naturalHeight-sy,im.naturalHeight],tx=[x,x+dx,x+w-dx,x+w],ty=[y,y+dy,y+h-dy,y+h];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(im,xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row],tx[col],ty[row],tx[col+1]-tx[col],ty[row+1]-ty[row]);
  }else{
    ctx.strokeStyle='#a9a6b5';ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,h-2,8);ctx.stroke();
    ctx.strokeStyle='#a129485c';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+5,y+5,w-10,h-10,4);ctx.stroke();
    for(const px of [x+9,x+w-9])for(const py of [y+9,y+h-9])oblivionUiShard(px,py,4,'#f15c79',.7);
  }ctx.restore();
}
function drawOblivionPanelSurface(x,y,w,h){
  ctx.save();const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#1d1422f5');g.addColorStop(.48,'#0a0810f8');g.addColorStop(1,'#1c0c17f5');
  ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x+3,y+3,w-6,h-6,8);ctx.fill();
  ctx.strokeStyle='#d8c7da11';ctx.lineWidth=.6;for(let i=0;i<4;i++){const px=x+25+(w-50)*i/3;ctx.beginPath();ctx.moveTo(px,y+8);ctx.lineTo(px+9,y+h*.35);ctx.lineTo(px-5,y+h*.57);ctx.lineTo(px+14,y+h-8);ctx.stroke();}ctx.restore();
}
function drawOblivionHudPortrait(cx,cy,r){
  const im=ensureGameImage(oblivionSprite,'high');ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const glow=ctx.createRadialGradient(cx,cy-r*.2,2,cx,cy,r);glow.addColorStop(0,'#6b1539');glow.addColorStop(1,'#090710');ctx.fillStyle=glow;ctx.fillRect(cx-r,cy-r,r*2,r*2);
  if(im?.complete&&im.naturalWidth&&im.naturalHeight){
    // Source cropping keeps the face inside the socket without oversized draw bounds.
    const side=Math.min(im.naturalWidth,im.naturalHeight*.26),sx=Math.max(0,Math.min(im.naturalWidth-side,im.naturalWidth*.54-side/2)),sy=Math.max(0,im.naturalHeight*.13-side*.43);
    ctx.translate(cx,cy);ctx.scale(-1,1);ctx.drawImage(im,sx,sy,side,side,-r,-r,r*2,r*2);
  }ctx.restore();ctx.save();ctx.strokeStyle=oblivionEmpowered()?'#ff6a89':'#c6bccd';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r+1,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#b2224a80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r+4,-1.1,3.7);ctx.stroke();
  oblivionUiShard(cx,cy-r-4,4,'#fa6684');oblivionUiShard(cx,cy+r+4,3,'#9c96ac');ctx.restore();
}
function drawOblivionCollapseGauge(x,y,w,h,compact=false){
  const s=oblivionState,t=oblivionUiTime(),value=Math.max(0,Math.min(100,s.gauge)),fill=Math.max(0,Math.min(1,oblivionHudGauge/100));
  const active=oblivionEmpowered(),ultimate=s.ultimateTime>0;ctx.save();ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#ddd3e0';
  oblivionUiText(`붕괴 ${Math.floor(value)} / 100`,x,y-9,w*.61,compact?10:12,compact?10:11,true);
  ctx.textAlign='right';ctx.fillStyle=active?'#ff89a0':'#9e94a8';
  oblivionUiText(ultimate?`현현 ${(s.ultimateTime/60).toFixed(1)}초`:active?'해방 중':'봉인',x+w,y-9,w*.39,compact?10:11,10,true);
  ctx.fillStyle='#05050b';ctx.strokeStyle='#645469';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,w,h,2);ctx.fill();ctx.stroke();
  ctx.save();ctx.beginPath();ctx.rect(x+2,y+2,(w-4)*fill,h-4);ctx.clip();
  const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#581630');g.addColorStop(.5,'#b3294d');g.addColorStop(1,active?'#ffb2c1':'#ec597b');ctx.fillStyle=g;ctx.fillRect(x+2,y+2,w-4,h-4);
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffc2dd77';ctx.lineWidth=1;
  for(let i=0;i<8;i++){const px=x+(i*w/7+t*.48)%(w+18)-9;ctx.beginPath();ctx.moveTo(px,y+h);ctx.lineTo(px+8,y+h*.48);ctx.lineTo(px+4,y);ctx.stroke();}ctx.restore();
  for(let i=1;i<5;i++){ctx.fillStyle='#07050b99';ctx.fillRect(x+w*i/5-1,y+2,2,h-4);}
  const threshold=x+w*.2;ctx.strokeStyle=value<20?'#ddd1de':'#ff98b5';ctx.beginPath();ctx.moveTo(threshold-3,y-3);ctx.lineTo(threshold,y);ctx.lineTo(threshold+3,y-3);ctx.stroke();
  if(ultimate){ctx.fillStyle='#f4cbd8';ctx.fillRect(x,y+h+4,w*Math.max(0,Math.min(1,s.ultimateTime/(s.ultimateMax||600))),2);}
  ctx.restore();
}
function drawOblivionResource(x,y,w,h,compact=false,framed=true){
  ctx.save();if(framed)drawOblivionPanelSurface(x,y,w,h);
  const r=compact?19:30,cx=x+(compact?29:44),cy=y+h/2,tx=cx+r+(compact?10:15),tw=x+w-15-tx;
  drawOblivionHudPortrait(cx,cy,r);ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#f1e4ed';
  oblivionUiText(compact?`오블리비언 · LV.${player.level}`:'오블리비언',tx,y+(compact?14:20),tw,compact?11:17,compact?10:15,true);
  if(!compact){ctx.fillStyle='#a79aaa';oblivionUiText(`LV.${player.level} · 처치 ${player.kills||0}`,tx,y+39,tw,11,11);}
  drawOblivionCollapseGauge(tx,y+(compact?38:65),tw,compact?10:13,compact);
  if(!compact){ctx.fillStyle='#b9a2b4';oblivionUiText(oblivionState.ultimateTime>0?'게이지 보존 · 재앙의 화신':oblivionEmpowered()?'초당 붕괴 6 소모 · X 재봉인':'붕괴 20 이상 · X 봉인 해제',tx,y+89,tw,10,10);}
  if(framed)drawOblivionMetalFrame(x,y,w,h);ctx.restore();
}
function getOblivionDesktopHudLayout(){
  const available=Math.max(252,canvas.width-24),pad=14,gap=16,cell=Math.min(91,(available-pad*2)/4),skillsWidth=cell*4,resourceWidth=Math.min(330,available-pad*2),stacked=available<resourceWidth+skillsWidth+gap+pad*2;
  const short=stacked&&canvas.height<430,resourceHeight=short?62:102,skillHeight=short?78:102,space=short?8:12;
  const w=(stacked?Math.max(resourceWidth,skillsWidth):resourceWidth+gap+skillsWidth)+pad*2,h=(stacked?resourceHeight+space+skillHeight:102)+20;
  const panel={x:(canvas.width-w)/2,y:canvas.height-55-h,w,h};
  const resource={x:stacked?(canvas.width-resourceWidth)/2:panel.x+pad,y:panel.y+10,w:resourceWidth,h:resourceHeight};
  const skillX=stacked?(canvas.width-skillsWidth)/2:resource.x+resource.w+gap,skillY=stacked?resource.y+resource.h+space:resource.y;
  const divider=stacked?{x1:panel.x+20,y1:skillY-space/2,x2:panel.x+w-20,y2:skillY-space/2}:{x1:resource.x+resource.w+gap/2,y1:panel.y+18,x2:resource.x+resource.w+gap/2,y2:panel.y+h-18};
  const radius=short?22:27;
  return{panel,resource,divider,stacked,compact:short,skills:['q','e','x','r'].map((key,i)=>({key,x:skillX+cell*(i+.5),y:skillY+(short?26:36),r:radius,labelY:skillY+(short?66:85),width:cell-6}))};
}
function getOblivionMobileResourceBounds(){const w=Math.min(330,Math.max(216,canvas.width*.40),canvas.width-24);return{x:canvas.width*(canvas.width<680?.42:.5),y:canvas.height-102,w,h:60};}
function getOblivionHealthBounds(){return{x:canvas.width/2,y:31,w:Math.max(200,Math.min(540,canvas.width-164)),h:34};}
function getOblivionExpBounds(){const mobile=isMobileTouchDevice(),w=mobile?Math.min(330,Math.max(164,canvas.width*.38)):Math.min(650,canvas.width-96);return{x:canvas.width*(mobile&&canvas.width<680?.42:.5),y:canvas.height-(mobile?48:21),w,h:22};}
function drawOblivionSkillSocket(sk,mobile=false){
  const {key,x,y,r}=sk,cd=getMobileSkillCooldown(key),locked=key==='r'&&player.level<10,active=key==='x'&&oblivionEmpowered()||key==='r'&&oblivionState.ultimateTime>0;
  ctx.save();ctx.fillStyle='#130913';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  if(!drawMobileIcon(getMobileSkillIcon(key),x,y,r)){oblivionUiShard(x,y,r*.48,'#d65272',Math.PI/4);}
  if(cd?.value>0)drawCooldownCover(x,y,r,Math.max(0,Math.min(1,cd.value/cd.max)),cd.value);
  if(locked){ctx.fillStyle='#08060de0';ctx.beginPath();ctx.arc(x,y,r-2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f5e7f0';ctx.font=`bold ${mobile?11:12}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mobile?'10레벨':'LV.10',x,y);}
  if(!oblivionUiImage(oblivionCombatArt.skillFrame,x-r*1.12,y-r*1.12,r*2.24)){ctx.strokeStyle='#b8aabd';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
  if(active){ctx.strokeStyle='#ff708f';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r*1.03,-Math.PI/2,-Math.PI/2+Math.PI*2*(key==='r'?oblivionState.ultimateTime/(oblivionState.ultimateMax||600):1));ctx.stroke();}
  if(!mobile){ctx.fillStyle='#140a16';ctx.strokeStyle='#ad879e';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-r+1,y+r-10,18,18,3);ctx.fill();ctx.stroke();ctx.fillStyle='#f6dfe9';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(key.toUpperCase(),x-r+10,y+r-1);ctx.fillStyle='#e5d7e3';oblivionUiText(OBLIVION_SKILL_NAMES[key],x,sk.labelY,sk.width,12,11,true);}
  ctx.restore();
}
drawOblivionInterface=function(){
  if(selectedCharacter!=='oblivion'||isMobileTouchDevice())return;
  const l=getOblivionDesktopHudLayout(),p=l.panel,d=l.divider;ctx.save();drawOblivionPanelSurface(p.x,p.y,p.w,p.h);drawOblivionResource(l.resource.x,l.resource.y,l.resource.w,l.resource.h,l.compact,false);
  ctx.strokeStyle='#bc53614f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x1,d.y1);ctx.lineTo(d.x2,d.y2);ctx.stroke();oblivionUiShard(d.x1,d.y1,2,'#b4a5bb');oblivionUiShard(d.x2,d.y2,2,'#b4a5bb');
  for(const sk of l.skills)drawOblivionSkillSocket(sk);
  drawOblivionMetalFrame(p.x,p.y,p.w,p.h);ctx.restore();
};
function drawOblivionCombatBar(bounds,kind){
  const {x:cx,y:cy,w,h}=bounds,x=cx-w/2,y=cy-h/2,b=oblivionBars,t=oblivionUiTime(),hp=kind==='hp',actual=hp?player.hp/Math.max(1,player.maxHp):player.exp/Math.max(1,player.expNeed),ratio=Math.max(0,Math.min(1,b?b[hp?'hp':'xp']:actual));
  const ix=x+17,iy=y+7,iw=w-34,ih=h-14,flash=b?(hp?b.hpFlash/36:b.xpFlash/40):0;
  ctx.save();ctx.fillStyle='#09060fe8';ctx.beginPath();ctx.roundRect(x+4,y+3,w-8,h-6,5);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(ix,iy,iw,ih);ctx.clip();ctx.fillStyle='#231326';ctx.fillRect(ix,iy,iw,ih);
  if(hp&&b){ctx.fillStyle='#f5b7cb88';ctx.fillRect(ix,iy,iw*b.trail,ih);}
  ctx.save();ctx.beginPath();ctx.rect(ix,iy,iw*ratio,ih);ctx.clip();const g=ctx.createLinearGradient(0,iy,0,iy+ih);g.addColorStop(0,hp?'#ffc2d0':'#e9defa');g.addColorStop(.25,hp?'#e65272':'#b996de');g.addColorStop(.6,hp?'#941b45':'#6a416f');g.addColorStop(1,hp?'#390d25':'#2e123a');ctx.fillStyle=g;ctx.fillRect(ix,iy,iw,ih);
  ctx.globalCompositeOperation='lighter';for(let j=0;j<2;j++){ctx.strokeStyle=j?'#ffe1f334':'#ffc5dd77';ctx.lineWidth=1;ctx.beginPath();for(let k=0;k<=36;k++){const px=ix+iw*k/36,py=iy+ih*(.5+Math.sin(k*.38+t*.035+j*2)*.22);k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}
  for(let i=0;i<14;i++)oblivionUiShard(ix+(i*iw/14+t*(hp?.45:1.1))%iw,iy+ih*(.2+(i%4)*.2),hp?1.5:1,'#ffdae699',.3+t*.006);
  const sx=ix+(t*1.8)%(iw+85)-85,shine=ctx.createLinearGradient(sx,0,sx+85,0);shine.addColorStop(0,'#ffffff00');shine.addColorStop(.5,'#f9dce755');shine.addColorStop(1,'#ffffff00');ctx.fillStyle=shine;ctx.fillRect(sx,iy,85,ih);ctx.fillStyle=`rgba(255,226,239,${Math.max(0,Math.min(1,flash))*.30})`;ctx.fillRect(ix,iy,iw,ih);ctx.restore();ctx.restore();
  // The dedicated art only supplies metal ornament: live values remain readable above it.
  drawOblivionMetalFrame(x,y,w,h,hp?oblivionCombatArt.hpFrame:oblivionCombatArt.xpFrame);
  const shield=Math.ceil(oblivionState.shield||0),label=hp?`HP ${Math.ceil(Math.max(0,player.hp))} / ${player.maxHp}${shield?' · 보호막 '+shield:''}`:`LV.${player.level} · EXP ${Math.floor(player.exp)} / ${player.expNeed}`;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${hp?12:10}px Arial`;ctx.strokeStyle='#09060e';ctx.lineWidth=3;ctx.strokeText(label,cx,cy);ctx.fillStyle=hp?'#fff1f5':'#e9dcef';ctx.fillText(label,cx,cy);ctx.restore();
}
function drawOblivionMobileSkillName(sk){
  const lines={q:['공간','파쇄'],e:['재앙의','손'],x:['봉인','해제'],r:['종언의','현현']}[sk.key];ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#f0dce9';ctx.shadowColor='#07020a';ctx.shadowBlur=3;
  const top=Math.min(sk.y+sk.r+11,canvas.height-16);
  lines.forEach((line,i)=>oblivionUiText(line,sk.x,top+i*10,sk.r*2,10,9,true));ctx.restore();
}
function drawOblivionMobileControls(){
  if(!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=='game'||paused||choosingUpgrade||gameOver||raidVictory)return;
  const {joystick:j,attack:a,skills}=getMobileControlLayout();ctx.save();
  if(!oblivionUiImage(oblivionCombatArt.joystickBase,j.x-j.r,j.y-j.r,j.r*2))drawOblivionControl(j.x,j.y,j.r,'frame',mobileJoystickTouchId!==null);
  const thumb=j.r*.36,tx=j.x+mobileStickX,ty=j.y+mobileStickY;
  if(!oblivionUiImage(oblivionCombatArt.joystickThumb,tx-thumb,ty-thumb,thumb*2))drawOblivionControl(tx,ty,thumb,'frame',mobileJoystickTouchId!==null);
  if(!oblivionUiImage(oblivionCombatArt.attack,a.x-a.r,a.y-a.r,a.r*2))drawOblivionControl(a.x,a.y,a.r,'attack',mobileAttackTouchId!==null);
  if(mobileAttackTouchId!==null||oblivionEmpowered()){ctx.strokeStyle=mobileAttackTouchId!==null?'#ffd0df':'#fa416d';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(a.x,a.y,a.r*.92,-Math.PI/2,Math.PI*1.5);ctx.stroke();}
  for(const sk of skills){drawOblivionSkillSocket(sk,true);drawOblivionMobileSkillName(sk);}ctx.restore();drawMobileSkillCancelButton();
}
