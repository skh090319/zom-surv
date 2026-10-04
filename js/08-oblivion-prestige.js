// Retained menu ornaments and portrait artwork. No combat effects or skill hooks.
const oblivionVfxSurfaces=new Map();
function oblivionVfxTexture(kind){
  if(oblivionVfxSurfaces.has(kind))return oblivionVfxSurfaces.get(kind);
  const c=document.createElement('canvas');c.width=c.height=384;
  const t=c.getContext('2d'),w=c.width,h=c.height;
  {
    const g=t.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,kind==='core'?'#ffdeebcc':'#ff557d33');g.addColorStop(.12,'#ff477b88');g.addColorStop(.35,'#b3155744');g.addColorStop(.65,'#78104a18');g.addColorStop(1,'#ff174a00');t.fillStyle=g;t.fillRect(0,0,w,h);
    if(kind==='cloud')for(let i=0;i<38;i++){const a=i*2.39996,r=35+i%7*19;t.strokeStyle=`rgba(238,40,104,${.06+i%4*.025})`;t.lineWidth=2+i%4;t.beginPath();t.ellipse(w/2+Math.cos(a)*r*.3,h/2+Math.sin(a)*r*.3,35+i%5*13,12+i%3*5,a,0,Math.PI*2);t.stroke();}
  }
  oblivionVfxSurfaces.set(kind,c);return c;
}
function oblivionGlow(x,y,r,alpha,kind='cloud'){ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.globalCompositeOperation='lighter';ctx.drawImage(oblivionVfxTexture(kind),x-r,y-r,r*2,r*2);ctx.restore();}
function oblivionCorona(x,y,r,time,alpha,segments=12){
  ctx.save();ctx.translate(x,y);ctx.rotate(time);ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(${i===1?'255,188,215':'245,39,100'},${alpha*(i===1?.6:.32)})`;ctx.lineWidth=i===1?1:2.5;ctx.beginPath();ctx.ellipse(0,0,r*(1+i*.06),r*(.36+i*.07),-.25+i*.16,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,r0=r*(.75+i%3*.08),r1=r*(1.13+i%2*.08);ctx.strokeStyle=`rgba(255,${i%3?82:196},${i%3?133:223},${alpha*.55})`;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0*.5);ctx.quadraticCurveTo(Math.cos(a+.14)*r1,Math.sin(a+.14)*r1*.5,Math.cos(a+.22)*r1,Math.sin(a+.22)*r1*.5);ctx.stroke();}
  ctx.restore();
}
const oblivionMenuAuraBase=drawOblivionMenuAura;
drawOblivionMenuAura=function(id,x,y,w,h){
  if(id!=='oblivion'||!['home','character'].includes(screenMode))return;
  const cx=x+w/2,cy=y+h*.52,s=h/440,t=performance.now()*.00025;
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  oblivionGlow(0,10,205,.7);oblivionCorona(0,20,147,t,.6,22);
  for(let i=0;i<3;i++){const a=i*2.094+t*.22;ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff75aa60';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.cos(a)*112,Math.sin(a)*165);ctx.bezierCurveTo(Math.cos(a+.3)*150,Math.sin(a+.3)*175,Math.cos(a+.7)*100,Math.sin(a+.7)*110,Math.cos(a+1)*115,Math.sin(a+1)*165);ctx.stroke();ctx.restore();}
  ctx.restore();oblivionMenuAuraBase(id,x,y,w,h);
};
function heroUltimatePortraitState(){
  if(screenMode!=='game')return null;
  const id=selectedCharacter,life=id==='oblivion'?oblivionBackdropTime:id==='mare'?player.mareUltimateTime:0,max=id==='oblivion'?300:420;
  if(!life)return null;const age=max-life;if(age>=138)return null;
  const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},enter=ease(age/20),exit=ease((age-105)/33);
  return{id,age,alpha:enter*(1-exit),slide:(1-enter)*.22+exit*.08};
}
function drawOblivionPortraitVoid(x,w,h,state){
  const art=typeof heroUltimateBackdrops==='undefined'?null:heroUltimateBackdrops.oblivion;
  if(art?.complete&&art.naturalWidth&&art.naturalHeight){
    const s=Math.max(w/art.naturalWidth,h/art.naturalHeight),dw=art.naturalWidth*s,dh=art.naturalHeight*s;
    ctx.globalAlpha=state.alpha*.78;ctx.drawImage(art,x+(w-dw)/2,-dh*.035,dw,dh);
  }
  const cx=x+w*.49,cy=h*.22,r=h*.18,t=state.age*.012;
  ctx.globalAlpha=state.alpha;
  // A compact singularity occupies the empty middle, safely left of the face.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.28);
  ctx.globalCompositeOperation='lighter';
  ctx.drawImage(oblivionVfxTexture('cloud'),-r*2.3,-r*1.7,r*4.6,r*3.4);
  for(let i=0;i<4;i++){
    ctx.strokeStyle=i===1?'#ffd6eadd':i===2?'#ff2e6ea8':'#ff719d66';ctx.lineWidth=i===1?1.5:1;
    ctx.beginPath();ctx.ellipse(0,0,r*(1.1+i*.16),r*(.38+i*.09),t*.07,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalCompositeOperation='source-over';ctx.fillStyle='#060208';
  ctx.beginPath();ctx.arc(0,0,r*.75,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ff5d97';ctx.lineWidth=1.5;ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffd4ea';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(0,0,r*.78,-2.8+t*.08,-.4+t*.08);ctx.stroke();ctx.restore();
  // Fine branching cracks fill the narrow left tip without crossing the face.
  ctx.strokeStyle='#ff91b8a0';ctx.lineWidth=.8;
  for(let i=0;i<6;i++){
    const px=x+w*(.15+i*.085),py=h*(.025+i*.027);
    ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px+w*.025,py);ctx.lineTo(px-w*.015,py+h*.055);ctx.lineTo(px+w*.06,py+h*.10);ctx.stroke();
    ctx.fillStyle=i%2?'#ff81af':'#ffd2e4';ctx.fillRect(px+w*.025,py,1.6,1.6);
  }
}
function drawHeroUltimatePortrait(){
  const state=heroUltimatePortraitState();if(!state||state.alpha<=0)return;
  const sea=state.id==='mare',im=sea?mareSprite:oblivionSprite;if(!im.complete||!im.naturalWidth)return;
  const w=canvas.width*.52,h=canvas.height*.27,x=canvas.width-w,color=sea?'#83f3ff':'#ff79ac';
  ctx.save();ctx.globalAlpha=state.alpha;ctx.translate(w*state.slide,0);
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,0);ctx.lineTo(canvas.width,h);ctx.closePath();ctx.clip();
  const g=ctx.createLinearGradient(x,0,canvas.width,h);g.addColorStop(0,sea?'#08253a33':'#250a1833');g.addColorStop(.4,sea?'#063449e8':'#480d2ee8');g.addColorStop(1,sea?'#07213df5':'#150712f5');ctx.fillStyle=g;ctx.fillRect(x,0,w,h);
  if(!sea)drawOblivionPortraitVoid(x,w,h,state);
  ctx.strokeStyle=sea?'#8afff866':'#ff83bc66';ctx.lineWidth=1;for(let i=0;i<9;i++){const py=h*(.12+i*.085),offset=state.age*w*.001;ctx.beginPath();ctx.moveTo(x+w*.38-offset,py);ctx.bezierCurveTo(x+w*.6,py-h*.12,canvas.width-w*.1,py+h*.1,canvas.width,py-h*.04);ctx.stroke();}
  // Keep the face inside the triangle and mirror only the portrait to face left.
  const faceX=im.naturalWidth*(sea?.495:.54),faceY=im.naturalHeight*(sea?.148:.12);
  const scale=h*.62/(im.naturalHeight*(sea?.105:.13));
  ctx.save();ctx.translate(x+w*.81,h*.38);ctx.scale(-1,1);
  ctx.drawImage(im,-faceX*scale,-faceY*scale,im.naturalWidth*scale,im.naturalHeight*scale);ctx.restore();
  ctx.fillStyle=sea?'#a9fffc':'#ffc5e0';for(let i=0;i<16;i++){const px=x+w*((i*.137+state.age*.0015)%1),py=h*(.1+(i%5)*.15);ctx.globalAlpha=state.alpha*.65;ctx.fillRect(px,py,1.5,1.5);}
  ctx.restore();ctx.save();ctx.globalAlpha=state.alpha;ctx.translate(w*state.slide,0);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.stroke();ctx.strokeStyle=sea?'#b6fff344':'#ff407b44';ctx.lineWidth=7;ctx.stroke();ctx.restore();
}
