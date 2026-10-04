// Presentation only: original character assets and combat rules are preserved.
const oblivionVfxSurfaces=new Map();
function oblivionVfxTexture(kind){
  if(oblivionVfxSurfaces.has(kind))return oblivionVfxSurfaces.get(kind);
  const c=document.createElement('canvas');c.width=kind==='blade'?768:384;c.height=kind==='blade'?96:384;
  const t=c.getContext('2d'),w=c.width,h=c.height;
  if(kind==='blade'){
    const g=t.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ff174a00');g.addColorStop(.35,'#b90d4440');g.addColorStop(.48,'#ff477fdd');g.addColorStop(.5,'#fff1f8');g.addColorStop(.52,'#ff809ddd');g.addColorStop(.65,'#b90d4430');g.addColorStop(1,'#ff174a00');
    t.fillStyle=g;t.beginPath();t.moveTo(0,h*.5);t.bezierCurveTo(w*.25,-h*.15,w*.6,h*.3,w,h*.5);t.bezierCurveTo(w*.65,h*.62,w*.25,h*1.1,0,h*.5);t.fill();
    for(let i=0;i<6;i++){t.strokeStyle=i%2?'#ffd5e688':'#ff295d55';t.lineWidth=i===0?2:.8;t.beginPath();t.moveTo(0,h*.5);t.bezierCurveTo(w*.2,h*(.1+i*.13),w*.6,h*(.25+i*.07),w,h*.5);t.stroke();}
  }else{
    const g=t.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);g.addColorStop(0,kind==='core'?'#ffdeebcc':'#ff557d33');g.addColorStop(.12,'#ff477b88');g.addColorStop(.35,'#b3155744');g.addColorStop(.65,'#78104a18');g.addColorStop(1,'#ff174a00');t.fillStyle=g;t.fillRect(0,0,w,h);
    if(kind==='cloud')for(let i=0;i<38;i++){const a=i*2.39996,r=35+i%7*19;t.strokeStyle=`rgba(238,40,104,${.06+i%4*.025})`;t.lineWidth=2+i%4;t.beginPath();t.ellipse(w/2+Math.cos(a)*r*.3,h/2+Math.sin(a)*r*.3,35+i%5*13,12+i%3*5,a,0,Math.PI*2);t.stroke();}
  }
  oblivionVfxSurfaces.set(kind,c);return c;
}
function oblivionGlow(x,y,r,alpha,kind='cloud'){ctx.save();ctx.globalAlpha=Math.max(0,alpha);ctx.globalCompositeOperation='lighter';ctx.drawImage(oblivionVfxTexture(kind),x-r,y-r,r*2,r*2);ctx.restore();}
function oblivionVisible(x,y,r){const s=getWorldViewScale();return x+r>=camera.x&&y+r>=camera.y&&x-r<=camera.x+canvas.width/s&&y-r<=camera.y+canvas.height/s;}
function oblivionCorona(x,y,r,time,alpha,segments=12){
  ctx.save();ctx.translate(x,y);ctx.rotate(time);ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(${i===1?'255,188,215':'245,39,100'},${alpha*(i===1?.6:.32)})`;ctx.lineWidth=i===1?1:2.5;ctx.beginPath();ctx.ellipse(0,0,r*(1+i*.06),r*(.36+i*.07),-.25+i*.16,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,r0=r*(.75+i%3*.08),r1=r*(1.13+i%2*.08);ctx.strokeStyle=`rgba(255,${i%3?82:196},${i%3?133:223},${alpha*.55})`;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0*.5);ctx.quadraticCurveTo(Math.cos(a+.14)*r1,Math.sin(a+.14)*r1*.5,Math.cos(a+.22)*r1,Math.sin(a+.22)*r1*.5);ctx.stroke();}
  ctx.restore();
}
function oblivionShards(x,y,r,p,alpha,count=12){ctx.save();ctx.translate(x,y);for(let i=0;i<count;i++){const a=i*2.39996,rr=r*(.35+p*.8+i%3*.055),sx=Math.cos(a)*rr,sy=Math.sin(a)*rr,k=(2+i%3)*(1-p*.65);ctx.fillStyle='#09050edf';ctx.strokeStyle=`rgba(255,119,165,${alpha*.75})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(sx-k,sy-k*2.5);ctx.lineTo(sx+k*1.7,sy-k*.4);ctx.lineTo(sx+k*.2,sy+k*2);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}
function drawOblivionPrestigeBurst(e,detail){const p=1-e.life/e.max,fade=(1-p)**1.5,rr=Math.max(1,e.r*(1-(1-p)**3));
  oblivionGlow(e.x,e.y,e.r*(.9+p*.45),fade*.5);ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<(detail?3:1);i++){const q=Math.max(0,(p-i*.07)/(1-i*.07));ctx.strokeStyle=`rgba(${i===1?'255,207,229':'250,56,121'},${(1-q)**2*.7})`;ctx.lineWidth=i===1?1:2;ctx.beginPath();ctx.arc(e.x,e.y,Math.max(1,e.r*(1-(1-q)**3)*(1+i*.1)),0,Math.PI*2);ctx.stroke();}
  if(detail){ctx.strokeStyle=`rgba(255,185,215,${fade*.62})`;ctx.lineWidth=1;for(let i=0;i<8;i++){const a=i*Math.PI/4+.25;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*rr*.35,e.y+Math.sin(a)*rr*.35);ctx.lineTo(e.x+Math.cos(a)*rr*1.15,e.y+Math.sin(a)*rr*1.15);ctx.stroke();}}ctx.restore();if(detail)oblivionShards(e.x,e.y,e.r,p,fade);
}
drawOblivionEffects=function(){
  if(selectedCharacter!=='oblivion')return;
  worldStart();ctx.save();ctx.lineCap='round';const t=oblivionTick*.012;
  for(const g of oblivionGates)if(oblivionVisible(g.x,g.y,120)){oblivionGlow(g.x,g.y,115,.5);oblivionCorona(g.x,g.y,65,-t,.6,10);drawOblivionRift(g.x,g.y,55,Math.sin(t)*.1);}
  if(oblivionRealm&&oblivionVisible(oblivionRealm.x,oblivionRealm.y,450)){
    const c=oblivionRealm,age=300-c.life,enter=Math.min(1,age/24),ending=Math.max(0,1-c.life/45),radius=c.r*enter;
    oblivionGlow(c.x,c.y,radius*1.3,.48);ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff7ba866';ctx.lineWidth=1;
    for(let plane=0;plane<3;plane++){ctx.beginPath();ctx.ellipse(c.x,c.y,radius*(.95-plane*.07),radius*(.44+plane*.05),plane*Math.PI/3+t*.08,0,Math.PI*2);ctx.stroke();}
    // Curved accretion filaments connect satellite rifts to the singularity.
    for(let i=0;i<12;i++){const a=i*Math.PI/6+t*.28,outer=radius*(.78+i%3*.06),inner=90*(1-ending*.5);ctx.strokeStyle=i%3?'#ff367354':'#ffd6eaa0';ctx.lineWidth=i%3?.9:1.4;ctx.beginPath();ctx.moveTo(c.x+Math.cos(a)*outer,c.y+Math.sin(a)*outer);ctx.bezierCurveTo(c.x+Math.cos(a+.5)*outer*.7,c.y+Math.sin(a+.5)*outer*.7,c.x+Math.cos(a+1.1)*inner*1.3,c.y+Math.sin(a+1.1)*inner*1.3,c.x+Math.cos(a+1.4)*inner,c.y+Math.sin(a+1.4)*inner);ctx.stroke();}
    ctx.restore();oblivionCorona(c.x,c.y,114*(1-ending*.45),-t*.35,.9,20);drawOblivionRift(c.x,c.y,92*(1-ending*.5),t*.18);
    for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.28,r=radius*.72;drawOblivionRift(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r,24,a+.4,.85);}
    oblivionShards(c.x,c.y,radius,.25+Math.sin(t)*.04,.8,20);
  }
  let detailed=0;
  for(let i=oblivionEffects.length-1;i>=0;i--){const e=oblivionEffects[i];if(!oblivionVisible(e.x,e.y,e.r*1.6))continue;const p=1-e.life/e.max,fade=1-p,detail=detailed++<14;
    if(e.type==='slash'){
      drawOblivionRift(e.x,e.y,30,e.a+Math.PI/2,fade);ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';ctx.drawImage(oblivionVfxTexture('blade'),0,-32*(1-p*.5),e.r,64*(1-p*.5));ctx.restore();
      if(detail){for(let n=0;n<7;n++){const f=(n+.3)/7,side=n%2?1:-1,x=e.x+Math.cos(e.a)*e.r*f-Math.sin(e.a)*side*(6+p*28),y=e.y+Math.sin(e.a)*e.r*f+Math.cos(e.a)*side*(6+p*28);ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,166,210,${fade*.7})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(e.a)*(8+n%3*6),y-Math.sin(e.a)*(8+n%3*6));ctx.stroke();ctx.restore();}}
    }else if(e.type==='dash'){
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);ctx.globalAlpha=fade*.7;ctx.globalCompositeOperation='lighter';ctx.drawImage(oblivionVfxTexture('blade'),0,-26,e.r,52);ctx.restore();
      if(detail&&oblivionSprite.complete&&oblivionSprite.naturalWidth){for(let n=1;n<=4;n++){const f=n/5,px=e.x+Math.cos(e.a)*e.r*f,py=e.y+Math.sin(e.a)*e.r*f,sh=130,sw=sh*oblivionSprite.naturalWidth/oblivionSprite.naturalHeight;ctx.save();ctx.globalAlpha=fade*(.04+n*.025);ctx.drawImage(oblivionSprite,px-sw/2,py-sh*.65,sw,sh);ctx.restore();}}
    }else if(e.type==='scar'){oblivionGlow(e.x,e.y,e.r,.38*fade);drawOblivionRift(e.x,e.y,75*(.45+fade*.55),-.35,fade);if(detail)oblivionCorona(e.x,e.y,e.r*.7,p*.6,fade*.8);}
    else if(e.type==='return'){drawOblivionRift(e.x,e.y,35,e.a+Math.PI/2,Math.sin(p*Math.PI));}
    else drawOblivionPrestigeBurst(e,detail);
  }
  ctx.globalAlpha=1;let marked=0;for(const z of zombies){if(!z.oblivionMark||marked++>=90||!oblivionVisible(z.x,z.y,40))continue;ctx.strokeStyle='#ff69a199';ctx.lineWidth=1;ctx.beginPath();ctx.arc(z.x,z.y,z.r+5,-1.5,-1.5+z.oblivionMark*1.8);ctx.stroke();ctx.fillStyle='#ffabc9';for(let i=0;i<z.oblivionMark;i++)ctx.fillRect(z.x-8+i*7,z.y-z.r-10,4,4);}
  ctx.restore();worldEnd();
};
const oblivionMenuAuraBase=drawOblivionMenuAura;
const oblivionPrestigeDashBase=activateOblivionX;
activateOblivionX=function(){if(player.oblivionxCD>0)return;const x=player.x,y=player.y;oblivionPrestigeDashBase();const dx=player.x-x,dy=player.y-y;oblivionFx('dash',x,y,Math.hypot(dx,dy),Math.atan2(dy,dx),26);oblivionFx('burst',player.x,player.y,62,0,24);};
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
  const id=selectedCharacter,life=id==='oblivion'?oblivionRealm?.life:id==='mare'?player.mareUltimateTime:0,max=id==='oblivion'?300:420;
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
  const faceX=im.naturalWidth*(sea?.495:.535),faceY=im.naturalHeight*(sea?.148:.078);
  const scale=h*.62/(im.naturalHeight*(sea?.105:.10));
  ctx.save();ctx.translate(x+w*.81,h*.38);ctx.scale(-1,1);
  ctx.drawImage(im,-faceX*scale,-faceY*scale,im.naturalWidth*scale,im.naturalHeight*scale);ctx.restore();
  ctx.fillStyle=sea?'#a9fffc':'#ffc5e0';for(let i=0;i<16;i++){const px=x+w*((i*.137+state.age*.0015)%1),py=h*(.1+(i%5)*.15);ctx.globalAlpha=state.alpha*.65;ctx.fillRect(px,py,1.5,1.5);}
  ctx.restore();ctx.save();ctx.globalAlpha=state.alpha;ctx.translate(w*state.slide,0);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.stroke();ctx.strokeStyle=sea?'#b6fff344':'#ff407b44';ctx.lineWidth=7;ctx.stroke();ctx.restore();
}
