// Menu ornament is deliberately independent of combat effects and player state.
function drawOblivionMenuAura(id,x,y,w,h){
  if(id!=='oblivion'||!['home','character'].includes(screenMode))return;
  const t=performance.now()*.00035,cx=x+w/2,cy=y+h*.5,s=h/440;
  ctx.save();ctx.shadowBlur=0;
  // Broken elliptical halo stays behind the face and coat.
  ctx.translate(cx,cy);ctx.scale(s,s);
  ctx.strokeStyle='#ff365849';ctx.lineWidth=1.2;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(0,10,118,180,-.22,i*1.256+t*.1,i*1.256+.8+t*.1);ctx.stroke();}
  for(let i=0;i<3;i++){const a=t*(i===1?-.3:.22)+i*2.094,px=Math.cos(a)*116,py=Math.sin(a)*158;drawOblivionRift(px,py,19+i*3,a+.5,.65);}
  // Floating obsidian fragments, with a fine illuminated fracture edge.
  for(let i=0;i<12;i++){const a=i*2.39996,px=Math.cos(a)*(100+i%3*16),py=Math.sin(a)*177+Math.sin(t+i)*5,k=3+i%3;ctx.fillStyle='#08050de0';ctx.strokeStyle=i%3?'#b5667955':'#ff658baa';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(px-k,py-k*2);ctx.lineTo(px+k,py-k);ctx.lineTo(px+k*.3,py+k*2);ctx.lineTo(px-k*.8,py+k);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.strokeStyle='#ff3a6655';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,192,94,18,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<18;i++){const a=i*2.39996,px=Math.cos(a)*(105+i%4*11),py=Math.sin(a)*185;ctx.fillStyle=`rgba(255,100,142,${.25+.2*Math.sin(t+i)**2})`;ctx.fillRect(px,py,1.5,1.5);}
  ctx.restore();
}
// The character has no skills or exclusive augments until they are designed again.
characterSkillGuide.oblivion={name:'오블리비언',color:'#ff4263',passive:'현재 외형과 전용 UI만 적용되어 있습니다. 평타·패시브·스킬·전용 증강은 없습니다.',skills:[]};
guideCharacterOrder.push('oblivion');
MOBILE_SKILL_KEYS.oblivion=[];
let oblivionBars=null;
function resetOblivionBars(){oblivionBars=null;}
function updateOblivionBars(){
  const hp=Math.max(0,Math.min(1,player.hp/Math.max(1,player.maxHp))),xp=Math.max(0,Math.min(1,player.exp/Math.max(1,player.expNeed)));
  if(!oblivionBars){oblivionBars={hp,trail:hp,xp,lastHp:hp,lastXp:xp,level:player.level,delay:0,hpFlash:0,xpFlash:0};return;}
  const b=oblivionBars;
  if(hp<b.lastHp){b.delay=24;b.hpFlash=36;}
  if(hp>b.lastHp)b.hpFlash=24;
  if(xp>b.lastXp||player.level!==b.level)b.xpFlash=40;
  if(player.level!==b.level)b.xp=0;
  b.hp+=(hp-b.hp)*.22;b.xp+=(xp-b.xp)*.12;
  if(b.delay>0)b.delay--;else b.trail+=(hp-b.trail)*.055;
  b.trail=Math.max(b.trail,b.hp);
  b.hpFlash=Math.max(0,b.hpFlash-1);b.xpFlash=Math.max(0,b.xpFlash-1);
  b.lastHp=hp;b.lastXp=xp;b.level=player.level;
}
function drawOblivionFrame(x,y,w,h,color='#bcaab7'){
  ctx.save();ctx.fillStyle='#09070fee';ctx.strokeStyle=color;ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+w-10,y);ctx.lineTo(x+w,y+h/2);ctx.lineTo(x+w-10,y+h);ctx.lineTo(x+10,y+h);ctx.lineTo(x,y+h/2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#ff365855';ctx.strokeRect(x+12,y+4,w-24,h-8);ctx.restore();
}
function drawOblivionBar(x,y,w,h,ratio,color,label,kind){
  drawOblivionFrame(x,y,w,h);
  const b=oblivionBars,t=oblivionPresentationTime,inner=w-26,fill=Math.max(0,Math.min(1,b?b[kind]:ratio)),flash=b?(kind==='hp'?b.hpFlash/36:b.xpFlash/40):0;
  ctx.save();ctx.beginPath();ctx.rect(x+13,y+5,inner,h-10);ctx.clip();
  if(kind==='hp'&&b){ctx.fillStyle='#ffd3b578';ctx.fillRect(x+13,y+5,inner*b.trail,h-10);}
  ctx.beginPath();ctx.rect(x+13,y+5,inner*fill,h-10);ctx.clip();
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#f8d6e2');g.addColorStop(.28,color);g.addColorStop(1,'#230b23');ctx.fillStyle=g;ctx.fillRect(x+13,y+5,inner,h-10);
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffffff27';ctx.lineWidth=1;
  for(let i=0;i<9;i++){const px=x+13+((i*inner/8+t*.75)%(inner+36))-18;ctx.beginPath();ctx.moveTo(px,y+h-5);ctx.lineTo(px+18,y+5);ctx.stroke();}
  const sx=x+13+((t*1.7)%(inner+90))-90,sheen=ctx.createLinearGradient(sx,0,sx+90,0);sheen.addColorStop(0,'#ffffff00');sheen.addColorStop(.5,'#ffd6eb33');sheen.addColorStop(1,'#ffffff00');ctx.fillStyle=sheen;ctx.fillRect(sx,y+5,90,h-10);
  ctx.fillStyle=`rgba(255,216,238,${flash*.4})`;ctx.fillRect(x+13,y+5,inner,h-10);ctx.restore();
  ctx.save();ctx.strokeStyle='#ffb9d8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+13+inner*fill,y+4);ctx.lineTo(x+13+inner*fill,y+h-4);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeStyle='#08040c';ctx.lineWidth=3;ctx.strokeText(label,x+w/2,y+h/2);ctx.fillText(label,x+w/2,y+h/2);ctx.restore();
}
function drawOblivionPortrait(cx,cy,r){
  const im=oblivionSprite;if(!im.complete||!im.naturalWidth)return;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#1b0916';ctx.fillRect(cx-r,cy-r,r*2,r*2);
  // Frame the face and collar rather than squeezing the full body into the socket.
  const scale=r*1.45/(im.naturalHeight*.13);
  ctx.translate(cx,cy);ctx.scale(-1,1);ctx.drawImage(im,-im.naturalWidth*.54*scale,-im.naturalHeight*.125*scale,im.naturalWidth*scale,im.naturalHeight*scale);ctx.restore();
}
function drawOblivionIdentityPanel(x,y,w,h,compact=false){
  ctx.save();const im=oblivionUiPanel;
  if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,w,h);else drawOblivionFrame(x,y,w,h);
  drawOblivionPortrait(x+w*.183,y+h*.475,h*.215);
  const tx=x+w*.34,tw=w*.55;ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#ffe2ec';ctx.font=`bold ${compact?12:18}px Arial`;ctx.fillText('오블리비언',tx,y+h*.36,tw);
  ctx.fillStyle='#d2acbc';ctx.font=`${compact?10:12}px Arial`;ctx.fillText(`LV.${player.level} · 처치 ${player.kills||0}`,tx,y+h*.53,tw);
  ctx.fillStyle='#fa90b0';ctx.font=`${compact?9:11}px Arial`;ctx.fillText('스킬 · 증강 미설정',tx,y+h*.64,tw);ctx.restore();
}
const oblivionHealthBase=drawHealthBar;
drawHealthBar=function(){if(selectedCharacter!=='oblivion')return oblivionHealthBase();const w=Math.min(520,canvas.width-80);drawOblivionBar((canvas.width-w)/2,18,w,30,player.hp/player.maxHp,'#ed244c',`HP ${Math.max(0,Math.floor(player.hp))} / ${player.maxHp}`,'hp');};
const oblivionExpBase=drawExpBar;
drawExpBar=function(){if(selectedCharacter!=='oblivion')return oblivionExpBase();const mobile=isMobileTouchDevice(),margin=mobile?Math.max(120,canvas.width*.29):260,w=Math.max(150,canvas.width-margin*2);drawOblivionBar(margin,canvas.height-(mobile?52:32),w,mobile?18:22,player.exp/player.expNeed,'#a98bdf',`LV.${player.level} · ${Math.floor(player.exp)} / ${player.expNeed}`,'xp');};
const oblivionHudBase=drawHUD;
drawHUD=function(){if(selectedCharacter!=='oblivion')return oblivionHudBase();ctx.save();ctx.fillStyle='#ffcadf';ctx.font='bold 13px Arial';ctx.textAlign='left';ctx.fillText('OBLIVION',20,83);ctx.fillStyle='#c6adb9';ctx.font='12px Arial';ctx.fillText(`처치 ${player.kills||0}`,20,103);ctx.restore();};
function drawOblivionInterface(){if(selectedCharacter!=='oblivion')return;const w=Math.min(450,canvas.width-24),h=w/3;drawOblivionIdentityPanel((canvas.width-w)/2,canvas.height-h-40,w,h);}
function drawOblivionControl(x,y,r,kind,active,dx=0,dy=0){
  ctx.save();ctx.fillStyle='#09050ddb';ctx.strokeStyle=active?'#ff5474':'#b5a6b8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(kind!=='frame')ctx.fill();ctx.stroke();ctx.strokeStyle='#e8345e80';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*.89,0,Math.PI*2);ctx.stroke();
  if(kind==='joystick'){ctx.strokeStyle='#ab96ae60';ctx.beginPath();ctx.arc(x,y,r*.63,0,Math.PI*2);ctx.stroke();drawOblivionRift(x+dx,y+dy,r*.3,Math.PI/2);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.fillStyle='#d4bccb';ctx.beginPath();ctx.moveTo(x+Math.cos(a)*(r+4),y+Math.sin(a)*(r+4));ctx.lineTo(x+Math.cos(a+.055)*(r-3),y+Math.sin(a+.055)*(r-3));ctx.lineTo(x+Math.cos(a-.055)*(r-3),y+Math.sin(a-.055)*(r-3));ctx.closePath();ctx.fill();}ctx.restore();
}
const oblivionPreviewBase=getCharacterPreviewSprite;
getCharacterPreviewSprite=function(id,thumbnail=false){return id==='oblivion'?ensureGameImage(oblivionSprite,'high'):oblivionPreviewBase(id,thumbnail);};
const oblivionMobileResourceBase=drawMobileCharacterResource;
drawMobileCharacterResource=function(){
  if(selectedCharacter!=='oblivion')return oblivionMobileResourceBase();
  if(!isMobileTouchDevice())return;
  const w=Math.min(300,canvas.width*.42),h=w/3;drawOblivionIdentityPanel((canvas.width-w)/2,canvas.height-61-h,w,h,true);
};
