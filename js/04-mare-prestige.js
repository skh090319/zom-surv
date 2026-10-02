// Moonlit ocean presentation. Existing Q/E/X/R mechanics and collision are unchanged.
let marePresentationFrame=0,mareOceanTexture=null,mareVortexTexture=null;
function mareSurface(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  if(typeof document==='undefined'||!document.createElement)return null;
  const c=document.createElement('canvas');c.width=w;c.height=h;return c;
}
function getMareOceanTexture(){
  if(mareOceanTexture)return mareOceanTexture;
  const c=mareSurface(512,128);if(!c)return null;const p=c.getContext('2d');if(!p)return null;
  p.lineCap='round';
  for(let band=0;band<26;band++){
    p.strokeStyle=`rgba(${band%3?100:220},245,255,${band%3?.22:.5})`;p.lineWidth=band%4?1.1:2.4;p.beginPath();
    for(let i=0;i<=96;i++){const x=i/96*512,y=band/26*128+Math.sin(i/96*Math.PI*4+band*.8)*9+Math.sin(i/96*Math.PI*8+band*1.4)*4;i?p.lineTo(x,y):p.moveTo(x,y);}p.stroke();
  }
  for(let i=0;i<130;i++){const x=(i*.618033%1)*512,y=(i*.381966%1)*128;p.fillStyle=`rgba(232,255,255,${.12+i%5*.08})`;p.beginPath();p.arc(x,y,i%11? .6:1.6,0,Math.PI*2);p.fill();}
  return mareOceanTexture=c;
}
function getMareVortexTexture(){
  if(mareVortexTexture)return mareVortexTexture;
  const c=mareSurface(512,512);if(!c)return null;const p=c.getContext('2d');if(!p)return null;
  p.translate(256,256);p.lineCap='round';
  for(let arm=0;arm<8;arm++)for(let layer=0;layer<3;layer++){
    p.strokeStyle=layer===0?'rgba(180,252,255,.72)':layer===1?'rgba(47,194,234,.26)':'rgba(79,216,231,.11)';p.lineWidth=[1.4,4,10][layer];p.beginPath();
    for(let i=0;i<=90;i++){const u=i/90,a=arm*Math.PI/4+u*5.3,r=12+u*u*230,x=Math.cos(a)*r,y=Math.sin(a)*r;i?p.lineTo(x,y):p.moveTo(x,y);}p.stroke();
  }
  for(let i=0;i<110;i++){const u=i/110,a=i*2.399,r=24+Math.sqrt(u)*215;p.fillStyle='rgba(213,252,255,.5)';p.beginPath();p.arc(Math.cos(a)*r,Math.sin(a)*r,i%7?1:2.4,0,Math.PI*2);p.fill();}
  return mareVortexTexture=c;
}
const updateMarePresentationBase=updateMare;
updateMare=function(){if(selectedCharacter==='mare')marePresentationFrame++;updateMarePresentationBase();};
function resetMarePresentation(){marePresentationFrame=0;}
function drawMareHealthFlow(x,y,w,h,ratio){
  const fill=w*Math.max(0,Math.min(1,ratio));if(fill<=0||w<=0||h<=0)return;
  ctx.save();ctx.beginPath();ctx.rect(x,y,fill,h);ctx.clip();
  const base=ctx.createLinearGradient(x,y,x+w,y+h);base.addColorStop(0,'#075475');base.addColorStop(.38,'#159bb0');base.addColorStop(.7,'#32c5c3');base.addColorStop(1,'#1868a1');ctx.fillStyle=base;ctx.fillRect(x,y,fill,h);
  const texture=getMareOceanTexture();ctx.globalCompositeOperation='screen';
  if(texture)for(const [span,speed,alpha] of [[w*1.3,-.38,.7],[w*1.75,.18,.3]]){
    const shift=((marePresentationFrame*speed%span)+span)%span;ctx.globalAlpha=alpha;
    for(let offset=-shift;offset<w;offset+=span)ctx.drawImage(texture,x+offset,y-h*.45,span,h*1.8);
  }
  ctx.globalAlpha=.75;ctx.strokeStyle='#d9ffff';ctx.lineWidth=.65;
  for(let i=0;i<8;i++){const px=x+w*((i*.618+marePresentationFrame*.0007)%1),py=y+h*(.3+.19*Math.sin(marePresentationFrame*.03+i));ctx.beginPath();ctx.arc(px,py,1+i%2,0,Math.PI*2);ctx.stroke();}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;const glass=ctx.createLinearGradient(x,y,x,y+h);glass.addColorStop(0,'rgba(235,255,255,.3)');glass.addColorStop(.45,'rgba(20,54,79,0)');glass.addColorStop(1,'rgba(1,18,38,.4)');ctx.fillStyle=glass;ctx.fillRect(x,y,fill,h);ctx.restore();
}
function drawMareOceanPanel(x,y,w,h){
  ctx.save();ctx.fillStyle='rgba(3,21,35,.96)';ctx.fillRect(x+8,y+8,w-16,h-16);
  if(mareUiPanelImage.complete&&mareUiPanelImage.naturalWidth){
    // Three horizontal slices preserve the left portrait bezel and sculpted corners.
    const sw=mareUiPanelImage.naturalWidth,sh=mareUiPanelImage.naturalHeight,left=Math.floor(sw*.29),right=Math.floor(sw*.16),scale=h/sh,lw=left*scale,rw=right*scale;
    ctx.drawImage(mareUiPanelImage,0,0,left,sh,x,y,lw,h);
    ctx.drawImage(mareUiPanelImage,left,0,sw-left-right,sh,x+lw,y,Math.max(1,w-lw-rw),h);
    ctx.drawImage(mareUiPanelImage,sw-right,0,right,sh,x+w-rw,y,rw,h);
  }else drawRoundedRect(x,y,w,h,12,'rgba(3,23,38,.95)','#a9dde1',1.4);
  ctx.restore();
}
function drawMarePortrait(cx,cy,r){
  ctx.save();ctx.fillStyle='#0b4058';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.save();ctx.clip();
  if(marePortraitImage.complete&&marePortraitImage.naturalWidth)ctx.drawImage(marePortraitImage,cx-r,cy-r,r*2,r*2);
  ctx.restore();drawMareSkillFrame(cx,cy,r);ctx.restore();
}
function drawMareSkillFrame(x,y,r){
  if(!mareSkillFrameImage.complete||!mareSkillFrameImage.naturalWidth)return;
  const size=r*2.7;ctx.save();ctx.imageSmoothingEnabled=true;ctx.shadowBlur=0;ctx.drawImage(mareSkillFrameImage,x-size/2,y-size/2,size,size);ctx.restore();
}
function drawMareControlIcon(x,y,r,kind,active=false,dx=0,dy=0){
  ctx.save();ctx.globalAlpha=1;
  const index=kind==='joystick'?0:player.mareUltimateTime>0?3:2;
  drawMobileIcon({atlas:mareControlIconAtlas,index},x,y,r);drawMareSkillFrame(x,y,r);
  if(kind==='joystick'){const knob=r*.37;drawMobileIcon({atlas:mareControlIconAtlas,index:1},x+dx,y+dy,knob);ctx.strokeStyle=active?'#e5ffff':'#70c7d5';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+dx,y+dy,knob,0,Math.PI*2);ctx.stroke();}
  if(active){ctx.strokeStyle='#d9ffff';ctx.lineWidth=1.4;for(let i=0;i<3;i++){const a=marePresentationFrame*.025+i*Math.PI*2/3;ctx.beginPath();ctx.arc(x,y,r*.82,a,a+.45);ctx.stroke();}}
  ctx.restore();
}
function mareWaterRing(x,y,r,phase,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(phase);ctx.globalAlpha*=alpha;ctx.strokeStyle='#b8f6f3';ctx.lineWidth=1;
  for(const f of [.88,1]){ctx.beginPath();ctx.arc(0,0,r*f,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r*.9,-3);ctx.quadraticCurveTo(r*1.02,0,r*.9,3);ctx.stroke();ctx.restore();}ctx.restore();
}
function mareFoam(x,y,r,phase,alpha,count=16){
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(218,255,253,${alpha})`;
  for(let i=0;i<count;i++){const a=i*2.399+phase,rr=r*(.74+i%4*.085),px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;ctx.beginPath();ctx.ellipse(px,py,1.1+i%3*.55,2.4+i%4*.75,a,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function mareCrestArc(x,y,rx,ry,start,span,t,alpha,width=16){
  if(typeof mareSpellWaterImage==='undefined'||!mareSpellWaterImage.complete||!mareSpellWaterImage.naturalWidth)return;
  const image=mareSpellWaterImage,sw=image.naturalWidth,sh=image.naturalHeight;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=alpha;
  for(let i=0;i<36;i++){const u=i/36,a=start+span*u,b=start+span*(i+1)/36,px=x+Math.cos(a)*rx,py=y+Math.sin(a)*ry,qx=x+Math.cos(b)*rx,qy=y+Math.sin(b)*ry,len=Math.hypot(qx-px,qy-py),sx=((u*2+t*.18)%1+1)%1*sw,part=sw/18,first=Math.min(part,sw-sx),f=first/part,h=width*(.35+.65*Math.sin(u*Math.PI));
    ctx.save();ctx.translate(px,py);ctx.rotate(Math.atan2(qy-py,qx-px));ctx.drawImage(image,sx,0,first,sh,-1,-h*1.5,(len+2)*f,h*3);if(first<part)ctx.drawImage(image,0,0,part-first,sh,-1+(len+2)*f,-h*1.5,(len+2)*(1-f),h*3);ctx.restore();
  }ctx.restore();
}
function mareWaterSheet(x,y,w,h,t,alpha){
  if(typeof mareSpellWaterImage==='undefined'||!mareSpellWaterImage.complete||!mareSpellWaterImage.naturalWidth)return;
  ctx.save();ctx.globalAlpha*=alpha;const shift=((t*.2)%1+1)%1*w;ctx.drawImage(mareSpellWaterImage,x-shift,y,w,h);ctx.drawImage(mareSpellWaterImage,x-shift+w,y,w,h);ctx.restore();
}
function drawMareOceanCore(){
  if(!mareCore)return;const c=mareCore,t=marePresentationFrame/60,r=250,texture=getMareVortexTexture();
  ctx.save();const sea=ctx.createRadialGradient(c.x,c.y,8,c.x,c.y,r);sea.addColorStop(0,'rgba(4,37,68,.82)');sea.addColorStop(.18,'rgba(1,52,78,.48)');sea.addColorStop(.78,'rgba(9,104,137,.13)');sea.addColorStop(1,'rgba(15,178,189,0)');ctx.fillStyle=sea;ctx.fillRect(c.x-r,c.y-r,r*2,r*2);
  if(texture){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(-t*.38);ctx.globalCompositeOperation='screen';ctx.globalAlpha=.7;ctx.drawImage(texture,-r,-r,r*2,r*2);ctx.rotate(t*.9);ctx.globalAlpha=.2;ctx.drawImage(texture,-r*.75,-r*.75,r*1.5,r*1.5);ctx.restore();}
  mareWaterRing(c.x,c.y,57+Math.sin(t*2)*3,-t*.3,.8);mareFoam(c.x,c.y,66,t,.7,18);
  for(let arm=0;arm<3;arm++)mareCrestArc(c.x,c.y,r*(.6+arm*.12),r*(.55+arm*.11),-t*.32+arm*2.1,Math.PI*1.2,t,.43,11+arm*3);
  const heart=ctx.createRadialGradient(c.x-4,c.y-6,1,c.x,c.y,35);heart.addColorStop(0,'#e2ffff');heart.addColorStop(.2,'#81f7ee');heart.addColorStop(.48,'rgba(44,164,205,.8)');heart.addColorStop(1,'rgba(11,54,97,0)');ctx.fillStyle=heart;ctx.fillRect(c.x-35,c.y-35,70,70);ctx.restore();
}
function drawMareOceanCurrent(c,t,temporary=false){
  const alpha=Math.min(1,c.life/45),length=c.len||c.range,half=c.width*.5;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.globalCompositeOperation='screen';
  const water=ctx.createLinearGradient(0,0,length,0);water.addColorStop(0,'rgba(7,87,126,0)');water.addColorStop(.2,`rgba(22,150,177,${alpha*.13})`);water.addColorStop(.78,`rgba(57,204,219,${alpha*.2})`);water.addColorStop(1,'rgba(182,255,242,0)');ctx.fillStyle=water;
  ctx.beginPath();ctx.moveTo(0,-half*.5);ctx.bezierCurveTo(length*.25,-half,length*.65,-half*.55,length,0);ctx.bezierCurveTo(length*.65,half*.55,length*.25,half,0,half*.5);ctx.closePath();ctx.fill();ctx.clip();
  mareWaterSheet(0,-half,length,half*2,t,alpha*.64);
  const texture=getMareOceanTexture();if(texture){ctx.globalAlpha=alpha*.4;const shift=t*35%length;ctx.drawImage(texture,shift-length,-half,length,half*2);ctx.drawImage(texture,shift,-half,length,half*2);ctx.globalAlpha=1;}
  for(let band=0;band<4;band++){const y=(band-1.5)*half*.35;ctx.strokeStyle=`rgba(${band===1?227:104},245,255,${alpha*(band===1?.8:.35)})`;ctx.lineWidth=band===1?2.6:1.2;ctx.beginPath();ctx.moveTo(3,y);ctx.bezierCurveTo(length*.3,y-half*.36,length*.62,y+half*.25,length-2,0);ctx.stroke();}
  for(let i=0;i<9;i++){const u=(i/9+t*.38)%1,px=u*length,py=Math.sin(u*8+i)*half*.35;ctx.fillStyle=`rgba(238,255,255,${alpha*.6})`;ctx.beginPath();ctx.ellipse(px,py,temporary?3:2,1,0,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function drawMareOceanWhale(e,t){
  const fade=Math.min(1,(e.maxLife-e.life)/24,e.life/35),a=player.mareUltimateAngle||0;
  ctx.save();ctx.translate(player.x,player.y+18+Math.sin(t*1.5)*3);ctx.rotate(a);if(Math.cos(a)<0)ctx.scale(1,-1);
  ctx.globalAlpha=fade*.88;ctx.globalCompositeOperation='screen';
  if(mareLeviathanLoaded)ctx.drawImage(mareLeviathanSprite,-190,-95,380,190);
  mareCrestArc(-85,8,225,95,-t*.12,Math.PI*1.45,t,fade*.65,21);mareCrestArc(-55,-8,205,115,t*.1+Math.PI,Math.PI*1.2,t,fade*.38,14);
  for(let band=0;band<6;band++){ctx.strokeStyle=`rgba(${band%2?78:210},247,255,${fade*(.55-band*.055)})`;ctx.lineWidth=band%2?1.3:2.6;ctx.beginPath();ctx.moveTo(-310,-45+band*18);ctx.bezierCurveTo(-245,-90+band*30,-180,-54+band*19,-100,-30+band*11);ctx.stroke();}
  for(let i=0;i<30;i++){const u=(i/30+t*.28)%1,px=-310+u*220,py=Math.sin(i*2.4+t)*60*(1-u);ctx.fillStyle=`rgba(200,255,255,${fade*(1-u)*.75})`;ctx.beginPath();ctx.ellipse(px,py,2+i%3,1+i%2,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  mareWaterRing(player.x,player.y,180+Math.sin(t)*8,-t*.07,fade*.18);
}
drawMareEffects=function(){
  if(selectedCharacter!=='mare')return;worldStart();ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const t=marePresentationFrame/60;
  drawMareOceanCore();for(const c of mareCurrents)drawMareOceanCurrent(c,t);
  for(const e of mareEffects){const p=Math.max(0,Math.min(1,1-e.life/e.maxLife)),alpha=1-p;ctx.save();ctx.globalCompositeOperation='screen';
    if(e.type==='current')drawMareOceanCurrent({...e,len:e.range},t,true);
    else if(e.type==='tide'){
      const crest=MARE_TIDE_GEOMETRY.start+p*MARE_TIDE_GEOMETRY.travel,half=e.width*.5;ctx.translate(e.x,e.y);ctx.rotate(e.a);ctx.translate(crest,0);
      const body=ctx.createLinearGradient(-125,0,48,0);body.addColorStop(0,'rgba(3,51,98,0)');body.addColorStop(.35,`rgba(13,105,161,${alpha*.3})`);body.addColorStop(.78,`rgba(44,217,221,${alpha*.6})`);body.addColorStop(1,`rgba(232,255,247,${alpha*.86})`);ctx.fillStyle=body;
      ctx.beginPath();ctx.moveTo(-125,-half);ctx.bezierCurveTo(-30,-half-12,72,-half+30,42,0);ctx.bezierCurveTo(72,half-30,-30,half+12,-125,half);ctx.closePath();ctx.fill();
      ctx.save();ctx.clip();mareWaterSheet(-125,-half,185,e.width,t,alpha*.95);ctx.restore();
      for(let band=0;band<6;band++){ctx.strokeStyle=`rgba(${band%2?90:230},250,255,${alpha*(.83-band*.08)})`;ctx.lineWidth=band<2?3.5:1.2;ctx.beginPath();for(let i=0;i<=30;i++){const u=i/30,yy=-half+u*e.width,xx=38-band*17+Math.sin(u*Math.PI)*17+Math.sin(u*26+t*3+band)*4;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}
      for(let i=0;i<36;i++){const u=i/35,yy=-half+u*e.width,xx=48+Math.sin(u*24+t*5)*7+(i%4)*6;ctx.fillStyle=`rgba(234,255,253,${alpha*.8})`;ctx.beginPath();ctx.ellipse(xx,yy,2+i%3,1.1+i%2*.6,u*4,0,Math.PI*2);ctx.fill();}
    }else if(e.type==='whaleMode')drawMareOceanWhale(e,t);
    else if(e.type==='abyss'){
      const fade=Math.min(1,p*18,e.life/35),r=180+Math.min(1,p*8)*280;const sea=ctx.createRadialGradient(player.x,player.y,40,player.x,player.y,r);sea.addColorStop(0,'rgba(5,39,65,0)');sea.addColorStop(.75,`rgba(5,114,145,${fade*.055})`);sea.addColorStop(1,'rgba(7,72,121,0)');ctx.fillStyle=sea;ctx.fillRect(player.x-r,player.y-r,r*2,r*2);mareFoam(player.x,player.y,r,t*.12,fade*.24,36);
    }else if(e.type==='whaleBreath'||e.type==='whaleDash'||e.type==='whaleDashTrail'){
      drawMareOceanCurrent({x:e.x,y:e.y,a:e.a,len:e.range||280,width:e.width||100,life:e.life,strong:true},t,true);ctx.translate(e.x,e.y);ctx.rotate(e.a);for(let i=0;i<18;i++){const u=(i/18+p)%1,xx=(e.range||280)*u,yy=Math.sin(i*2.4+t*4)*(e.width||100)*.3*(1-u);ctx.fillStyle=`rgba(218,255,250,${alpha*.7})`;ctx.beginPath();ctx.ellipse(xx,yy,2+i%3,1,0,0,Math.PI*2);ctx.fill();}
    }else if(e.type==='pressure'){
      const r=e.r*(1-p*.76);mareWaterRing(e.x,e.y,r,-t*.7,alpha);mareFoam(e.x,e.y,r*1.15,p*3,alpha*.8,12);
      mareCrestArc(e.x,e.y,r*1.15,r*1.15,-t*.6,Math.PI*1.7,t,alpha*.85,18);
      for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.sin(p*Math.PI)*.3;ctx.strokeStyle=`rgba(171,252,255,${alpha*.8})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x+Math.cos(a)*r*1.5,e.y+Math.sin(a)*r*1.5);ctx.quadraticCurveTo(e.x+Math.cos(a+.35)*r,e.y+Math.sin(a+.35)*r,e.x,e.y);ctx.stroke();}
    }else if(['coreSpawn','coreBurst','confluence','oceanCollapse','pressureRing','foamHit'].includes(e.type)){
      const max=e.type==='oceanCollapse'?310:e.type==='coreBurst'?210:e.type==='pressureRing'?355:e.type==='confluence'?115:e.type==='coreSpawn'?75:48,r=Math.max(1,max*(1-Math.pow(1-p,3))),fade=alpha*alpha;
      const glow=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);glow.addColorStop(0,`rgba(237,255,255,${fade*.62})`);glow.addColorStop(.25,`rgba(65,217,229,${fade*.38})`);glow.addColorStop(1,'rgba(7,79,144,0)');ctx.fillStyle=glow;ctx.fillRect(e.x-r,e.y-r,r*2,r*2);
      for(let band=0;band<(e.type==='oceanCollapse'?5:3);band++){ctx.strokeStyle=`rgba(170,254,247,${fade/(band+1)})`;ctx.lineWidth=band?1:2.5;ctx.beginPath();ctx.arc(e.x,e.y,r*(1-band*.1),0,Math.PI*2);ctx.stroke();}mareFoam(e.x,e.y,r,p*2,fade,e.type==='oceanCollapse'?40:16);
      if(e.type!=='foamHit')for(let arm=0;arm<(e.type==='oceanCollapse'?3:2);arm++)mareCrestArc(e.x,e.y,r*(1-arm*.12),r*(1-arm*.12),arm*Math.PI*1.1+p*.6,Math.PI*1.1,t,fade*.8,14+arm*5);
    }
    ctx.restore();
  }
  ctx.restore();worldEnd();
};
drawMareInterface=function(){
  if(selectedCharacter!=='mare'||screenMode!=='game')return;
  const w=Math.min(780,canvas.width-28),h=120,x=(canvas.width-w)/2,y=canvas.height-178,ultimate=player.mareUltimateTime>0;
  ctx.save();drawMareOceanPanel(x,y,w,h);drawMarePortrait(x+58,y+57,37);
  const sx=x+112,textW=Math.max(60,w-436);ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#e7ffff';ctx.font='22px DoHyeon, Arial';ctx.fillText(ultimate?'마레 · 심해 개방':'마레 · 심해의 지휘자',sx,y+30,textW);
  ctx.font='bold 12px Arial';ctx.fillStyle='#8bf2ee';ctx.fillText(ultimate?`레비아탄 · ${Math.ceil(player.mareUltimateTime/60)}초`: `침수 ${zombies.filter(z=>z.mareWet>0).length} · 해류 ${mareCurrents.length} · 핵 ${mareCore?'활성':'대기'}`,sx,y+54,textW);
  ctx.font='11px Arial';ctx.fillStyle='#badbdf';ctx.fillText(ultimate?'강화 해류 · 고래 돌진 · 심해 흡입':'해류를 교차시키고 침수 후 수압 폭발',sx,y+77,textW);
  if(ultimate)drawMareHealthFlow(sx,y+87,textW,6,player.mareUltimateTime/420);
  ['q','e','x','r'].forEach((key,i)=>{const cx=x+w-275+i*68,cy=y+49,r=24;drawMobileIcon({atlas:mareSkillIconAtlas,index:i},cx,cy,r);const cd=player['mare'+key.toUpperCase()+'Cooldown'],max=ultimate?[120,150,MARE_X_CD,MARE_R_CD][i]:[MARE_Q_CD,MARE_E_CD,MARE_X_CD,MARE_R_CD][i];if(cd>0)drawCooldownCover(cx,cy,r,cd/max,cd);drawMareSkillFrame(cx,cy,r);drawSkillHudLabel(cx,y+96,ultimate?['고래 돌진','심해 흡입','수압','개방 중'][i]:['밀물',mareCore?'핵 붕괴':'소용돌이 핵','수압',player.level<10?'10레벨':'심해 개방'][i],key.toUpperCase(),'#e2ffff');});ctx.restore();
};
function drawMareMobileResource(){
  const w=Math.min(370,canvas.width*.44),h=34,x=(canvas.width-w)/2,y=canvas.height-108,ultimate=player.mareUltimateTime>0;
  ctx.save();drawMareOceanPanel(x,y,w,h);drawMarePortrait(x+23,y+h/2,12);
  ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e0ffff';
  ctx.fillText(ultimate?`레비아탄 ${Math.ceil(player.mareUltimateTime/60)}초 · 해류 ${mareCurrents.length}`:`침수 ${zombies.filter(z=>z.mareWet>0).length} · 해류 ${mareCurrents.length} · 핵 ${mareCore?'활성':'대기'}`,x+48+(w-58)/2,y+h/2,w-58);ctx.restore();
}
