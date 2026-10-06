// Image-backed casino ornament, animated glass bars and layered world-space VFX.
function lushAsset(file){const image=setGameImageSource(new Image(),'assets/lush-v1/'+file+'.webp');image.assetGroup='lush';return image;}
function lushV2Asset(file){const image=setGameImageSource(new Image(),'assets/lush-v2/'+file+'.webp');image.assetGroup='lush';return image;}
function lushV3Asset(file){const image=setGameImageSource(new Image(),'assets/lush-v3/'+file+'.webp');image.assetGroup='lush';return image;}
const lushArt={body:lushAsset('lush'),thumb:lushAsset('lush-thumb'),portrait:lushAsset('portrait'),realm:lushAsset('casino-realm'),slot:lushAsset('slot-machine'),
  skills:[0,1,2,3].map(i=>lushV2Asset('skill-'+i)),augments:[0,1,2,3].map(i=>lushV2Asset('augment-'+i)),controls:[0,1,2,3].map(i=>lushAsset('control-'+i)),resourceFrame:lushV3Asset('resource-frame')};
lushArt.vfx=Object.fromEntries(['card','die','shatter','dealer','burst','sigil'].map(name=>[name,lushV2Asset('vfx-'+name)]));
const lushTextures=new Map();
function lushGlowTexture(color='gold'){
  if(lushTextures.has(color))return lushTextures.get(color);
  const c=document.createElement('canvas');c.width=c.height=192;const t=c.getContext('2d'),g=t.createRadialGradient(96,96,0,96,96,96);
  const rgb=color==='red'?'255,30,80':'255,187,65';g.addColorStop(0,'rgba(255,241,186,.9)');g.addColorStop(.09,`rgba(${rgb},.7)`);g.addColorStop(.35,`rgba(${rgb},.14)`);g.addColorStop(1,`rgba(${rgb},0)`);t.fillStyle=g;t.fillRect(0,0,192,192);lushTextures.set(color,c);return c;
}
function lushGlow(x,y,r,alpha=1,color='gold'){
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;ctx.drawImage(lushGlowTexture(color),x-r,y-r,r*2,r*2);ctx.restore();
}
function lushDiamond(x,y,r,color='#ffe5a4',angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.48,0);ctx.lineTo(0,r);ctx.lineTo(-r*.48,0);ctx.closePath();ctx.fill();ctx.restore();}
function lushDie(x,y,size,eye=6,angle=0,gold=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.lineJoin='round';ctx.lineWidth=1.2;
  const grad=ctx.createLinearGradient(-size,-size,size,size);grad.addColorStop(0,gold?'#fff2accc':'#ffe9de99');grad.addColorStop(.25,gold?'#cd8b37b0':'#92324055');grad.addColorStop(.7,'#240c2466');grad.addColorStop(1,'#ffc969cc');ctx.fillStyle=grad;ctx.strokeStyle='#ffdda7';
  ctx.beginPath();ctx.moveTo(-size*.62,-size*.25);ctx.lineTo(0,-size*.62);ctx.lineTo(size*.62,-size*.26);ctx.lineTo(size*.62,size*.42);ctx.lineTo(0,size*.77);ctx.lineTo(-size*.62,size*.40);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff6cfb0';ctx.beginPath();ctx.moveTo(-size*.62,-size*.25);ctx.lineTo(0,size*.12);ctx.lineTo(size*.62,-size*.26);ctx.moveTo(0,size*.12);ctx.lineTo(0,size*.77);ctx.stroke();
  ctx.strokeStyle='#ffdc9f55';ctx.beginPath();ctx.moveTo(-size*.50,-size*.20);ctx.lineTo(-size*.50,size*.34);ctx.lineTo(-size*.12,size*.58);ctx.stroke();
  const dots={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[eye]||[[0,0]];
  for(const [u,v]of dots){const px=size*(-.31+u*.13),py=size*(.24+v*.15+u*.07);ctx.fillStyle='#fff5cb';ctx.beginPath();ctx.ellipse(px,py,size*.035,size*.048,-.2,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<3;i++){ctx.fillStyle='#ffe296';ctx.beginPath();ctx.ellipse(size*.30,size*(.19+i*.13),size*.035,size*.048,.2,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#fffbea';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-size*.55,-size*.27);ctx.lineTo(-size*.08,-size*.55);ctx.stroke();ctx.restore();
}
function lushCard(x,y,a,suit=0,size=20){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);const g=ctx.createLinearGradient(-size,0,size,0);g.addColorStop(0,'#fff0ce');g.addColorStop(1,'#a67a4c');ctx.fillStyle=g;ctx.strokeStyle='#fff4c8';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-size*.65,-size,size*1.3,size*2,size*.13);ctx.fill();ctx.stroke();ctx.fillStyle=suit%2?'#a71539':'#291323';ctx.font=`bold ${size*1.4}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(['♠','♦','♣','♥'][(suit+4)%4],0,1);ctx.restore();
}
function lushRing(x,y,r,t,alpha=1,red=false){
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(t);ctx.strokeStyle=red?'#ff537fa0':'#ffd88aa0';ctx.lineWidth=1.4;
  for(const k of [1,.91]){ctx.beginPath();ctx.arc(0,0,r*k,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<24;i++){const a=i*Math.PI/12;ctx.strokeStyle=i%2?'#f8d78d88':'#ed537277';ctx.lineWidth=i%3?1:2.5;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.91,Math.sin(a)*r*.91);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();if(i%6===0)lushDiamond(Math.cos(a)*r,Math.sin(a)*r,8,red?'#ff567c':'#fff0bb',a);}
  ctx.restore();
}
function drawLushRealm(){
  if(selectedCharacter!=='lush'||!lushState.realm)return;const im=ensureGameImage(lushArt.realm),p=lushState.realm;if(!im.complete||!im.naturalWidth)return;
  ctx.save();const cx=(player.x-camera.x)*getWorldViewScale(),cy=(player.y-camera.y)*getWorldViewScale();
  ctx.beginPath();ctx.arc(cx,cy,Math.hypot(canvas.width,canvas.height)*p,0,Math.PI*2);ctx.clip();ctx.globalAlpha=p*p*(3-2*p);
  const s=Math.max(canvas.width/im.naturalWidth,canvas.height/im.naturalHeight);ctx.drawImage(im,(canvas.width-im.naturalWidth*s)/2,(canvas.height-im.naturalHeight*s)/2,im.naturalWidth*s,im.naturalHeight*s);
  ctx.restore();
}
function drawLushEffects(){
  if(selectedCharacter!=='lush')return;const s=lushState,t=s.frame;worldStart();
  if(s.ultimate){const u=s.ultimate,a=Math.min(1,u.age/30);lushRing(player.x,player.y,520,t*.001,a*.8);lushRing(player.x,player.y,470,-t*.0014,a*.45,true);
    ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const angle=i*Math.PI*2/3+t*.003;ctx.strokeStyle='#ffa23b1c';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(player.x+Math.cos(angle)*80,player.y+Math.sin(angle)*80);ctx.lineTo(player.x+Math.cos(angle)*500,player.y+Math.sin(angle)*500);ctx.stroke();}ctx.restore();
  }
  for(const h of s.hazards){const ratio=Math.min(1,h.age/60);ctx.save();ctx.fillStyle='#f82d5330';ctx.strokeStyle='#ff456b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(h.x,h.y,h.r*ratio,0,Math.PI*2);ctx.stroke();ctx.restore();}
  for(const c of s.cards){ctx.save();ctx.strokeStyle=c.suit===0?'#ffd270a0':'#f37d7580';ctx.lineWidth=5;ctx.beginPath();c.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(c.x,c.y);ctx.stroke();ctx.restore();lushCard(c.x,c.y,c.a+Math.PI/2,c.suit<0?0:c.suit,12);}
  for(const d of s.dice){
    lushGlow(d.x,d.y,80,.45);for(let i=1;i<5;i++){ctx.save();ctx.globalAlpha=.12*(1-i/5);lushDie(d.x-Math.cos(d.a)*i*14,d.y-Math.sin(d.a)*i*14,42,d.eye,d.age*.16);ctx.restore();}
    lushDie(d.x,d.y-8-Math.abs(Math.sin(d.age*.19))*14,46,d.eye,d.travel<500?d.age*.17:Math.sin(d.age*.03)*.1);}
  for(const e of s.effects){if(e.delay>0)continue;const p=e.age/e.maxLife,fade=Math.sin(Math.min(1,p)*Math.PI),out=1-p;
    if(e.type==='hit'){lushGlow(e.x,e.y,45,out);for(let i=0;i<5;i++){const a=i*1.256;lushDiamond(e.x+Math.cos(a)*p*36,e.y+Math.sin(a)*p*36,3*out,'#ffedb6',a);}continue;}
    const big=['jackpot','house','six','cascade'].includes(e.type),red=e.type==='loss';
    lushGlow(e.x,e.y,e.r*(big?1.15:.65),fade*(big?.60:.35),red?'red':'gold');
    lushRing(e.x,e.y,Math.max(2,e.r*(.25+.75*Math.sin(Math.min(1,p*1.5)*Math.PI/2))),e.seed*.01+p*.3,fade*.8,red);
    if(big)for(let j=1;j<3;j++)lushRing(e.x,e.y,e.r*Math.min(1,p*2+j*.17),-p*.25,fade*.32,j===2);
    const count=big?40:18;ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<count;i++){const a=i*2.39996+e.seed*.17,rr=e.r*(.2+p*(.8+(i%4)*.08)),px=e.x+Math.cos(a)*rr,py=e.y+Math.sin(a)*rr;
      ctx.strokeStyle=i%3?'#fca05260':'#fff5baaa';ctx.lineWidth=i%5?1:2;ctx.beginPath();ctx.moveTo(px-Math.cos(a)*15*out,py-Math.sin(a)*15*out);ctx.lineTo(px,py);ctx.stroke();lushDiamond(px,py,(2+i%3)*out,red?'#ff638a':'#ffe7a5',a+p);}
    ctx.restore();
    if(e.type==='six'){ctx.save();ctx.globalAlpha=out;lushDie(e.x,e.y-Math.max(0,1-p*3)*140,80+p*20,6,-.1,true);ctx.restore();}
    if(big)for(let i=0;i<8;i++){const a=i*Math.PI/4+p*.35;ctx.save();ctx.globalAlpha=fade*.8;lushCard(e.x+Math.cos(a)*e.r*.7*p,e.y+Math.sin(a)*e.r*.7*p,a+p,i%4,14);ctx.restore();}
  }
  worldEnd();
}
function drawLushPlayer(){
  const s=lushState,im=ensureGameImage(lushArt.body,'high');worldStart();
  ctx.save();ctx.translate(player.x,player.y);if(player.invincibleTime>0&&Math.floor(player.invincibleTime/4)%2===0)ctx.globalAlpha=.48;
  if(s.shield>0){lushGlow(0,-12,90,.28,'red');lushRing(0,0,43,s.frame*.006,.7);}
  if(im.complete&&im.naturalWidth){const h=132,w=h*im.naturalWidth/im.naturalHeight;if(Math.cos(lushAim())<0)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h*.7,w,h);}ctx.restore();
  if(s.bet){const y=player.y-90;lushGlow(player.x,y,65,.5);lushDie(player.x,y,34,1+Math.floor(s.bet.age/3)%6,s.bet.age*.18);}
  const u=s.ultimate;if(u){const x=player.x,y=player.y-147,w=280,h=138,im=ensureGameImage(lushArt.slot);ctx.save();lushGlow(x,y,150,.3);
    if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-w/2,y-h/2,w,h);
    for(let i=0;i<3;i++){const sx=x-w/2+w*(.271+i*.220),sy=y-h/2+h*.515,rw=w*.175,rh=h*.35,val=u.reels[i],rolling=val===undefined;
      ctx.save();ctx.beginPath();ctx.roundRect(sx-rw/2,sy-rh/2,rw,rh,4);ctx.clip();const face=ctx.createLinearGradient(0,sy-rh/2,0,sy+rh/2);face.addColorStop(0,'#361121');face.addColorStop(.5,'#571c2c');face.addColorStop(1,'#160912');ctx.fillStyle=face;ctx.fillRect(sx-rw/2,sy-rh/2,rw,rh);ctx.fillStyle=val===7?'#fff0ad':'#efc983';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 38px Georgia';ctx.shadowColor='#e58e3d';ctx.shadowBlur=rolling?0:9;
      const sym=v=>v===7?'7':['◆','♠','♥'][((v||1)-1)%3];if(rolling){const off=(u.age*(7+i))%rh;for(let j=-1;j<2;j++)ctx.fillText(sym(1+(Math.floor(u.age/7)+j+9)%3),sx,sy+off+j*rh);}else ctx.fillText(sym(val),sx,sy);ctx.restore();}ctx.restore();}
  worldEnd();
}
function lushControlArt(index,x,y,w,h=w){const im=ensureGameImage(lushArt.controls[index]);if(im.complete&&im.naturalWidth){
  if(index===3){const sw=im.naturalWidth,sh=im.naturalHeight,cap=sw*.23,d=Math.min(w*.24,cap*h/sh);ctx.drawImage(im,0,0,cap,sh,x,y,d,h);ctx.drawImage(im,cap,0,sw-cap*2,sh,x+d,y,w-d*2,h);ctx.drawImage(im,sw-cap,0,cap,sh,x+w-d,y,d,h);}
  // The original skill frame's square crop includes an unrelated sliver on its right.
  else if(index===2)ctx.drawImage(im,0,0,im.naturalWidth*.8125,im.naturalHeight,x,y,w,h);
  else ctx.drawImage(im,x,y,w,h);return true;}return false;}
function drawLushSkillFrame(x,y,r){ctx.save();lushControlArt(2,x-r*1.13,y-r*1.13,r*2.26);ctx.restore();}
function drawLushBar(x,y,w,h,ratio,label,kind){
  const t=lushState.frame,clamped=Math.max(0,Math.min(1,ratio)),ix=x+17,iy=y-5+(h+10)*.33,iw=w-34,ih=(h+10)*.35;
  ctx.save();ctx.fillStyle='#100814ec';ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();ctx.beginPath();ctx.roundRect(ix,iy,iw,ih,6);ctx.clip();
  ctx.fillStyle='#39202a';ctx.fillRect(ix,iy,iw,ih);ctx.beginPath();ctx.rect(ix,iy,iw*clamped,ih);ctx.clip();
  const g=ctx.createLinearGradient(0,iy,0,iy+ih);g.addColorStop(0,kind==='hp'?'#ffadc1':'#fff4c8');g.addColorStop(.35,kind==='hp'?'#d72853':'#dca540');g.addColorStop(1,kind==='hp'?'#530f34':'#703918');ctx.fillStyle=g;ctx.fillRect(ix,iy,iw,ih);
  ctx.globalCompositeOperation='lighter';for(let k=0;k<3;k++){ctx.strokeStyle=k===1?'#ffd89570':'#ffbec838';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<=48;i++){const px=ix+iw*i/48,py=iy+ih*(.48+Math.sin(i*.23-t*.026+k*2)*.28);i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();}
  for(let i=0;i<18;i++){const px=ix+(i*iw/18+t*(kind==='hp'?.6:1.1))%iw,py=iy+ih*(.5+Math.sin(i+t*.035)*.26);lushDiamond(px,py,1.6,'#fff0bba8',t*.015+i);}
  const sx=ix+((t*1.8)%(iw+90))-90,sheen=ctx.createLinearGradient(sx,0,sx+90,0);sheen.addColorStop(0,'#fff8db00');sheen.addColorStop(.5,'#fff8db55');sheen.addColorStop(1,'#fff8db00');ctx.fillStyle=sheen;ctx.fillRect(sx,iy,90,ih);ctx.restore();
  // Keep the image border's bevels visible while reserving a full-width bar interior.
  ctx.save();lushControlArt(3,x-10,y-5,w+20,h+10);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${h<25?10:12}px Arial`;ctx.lineWidth=3;ctx.strokeStyle='#1b0810';ctx.fillStyle='#fff8dd';ctx.strokeText(label,x+w/2,y+h/2);ctx.fillText(label,x+w/2,y+h/2);ctx.restore();
}
function lushHudNumber(value){const n=Math.max(0,Number(value)||0);return n>=1e8?(n/1e8).toFixed(1).replace(/\.0$/,'')+'억':n>=1e4?(n/1e4).toFixed(1).replace(/\.0$/,'')+'만':String(Math.round(n*10)/10);}
function lushHudText(text,x,y,width,size=12,minSize=size,bold=false){
  let fontSize=size;const setFont=()=>ctx.font=`${bold?'bold ':''}${fontSize}px Arial`;setFont();
  while(fontSize>minSize&&ctx.measureText(text).width>width){fontSize--;setFont();}
  if(ctx.measureText(text).width>width){while(text.length&&ctx.measureText(text+'…').width>width)text=text.slice(0,-1);text+='…';}
  // Canvas maxWidth scales glyphs horizontally; use measured text at its true font size.
  ctx.fillText(text,x,y);
}
function drawLushResourceFrame(x,y,w,h){
  const im=ensureGameImage(lushArt.resourceFrame);ctx.save();
  if(im.complete&&im.naturalWidth&&im.naturalHeight){
    const sw=im.naturalWidth,sh=im.naturalHeight,sx=sw*.14,sy=sh*.30,dx=h<70?13:22,dy=h<70?13:22;
    const sourceX=[0,sx,sw-sx,sw],sourceY=[0,sy,sh-sy,sh],targetX=[x,x+dx,x+w-dx,x+w],targetY=[y,y+dy,y+h-dy,y+h];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(im,sourceX[col],sourceY[row],sourceX[col+1]-sourceX[col],sourceY[row+1]-sourceY[row],targetX[col],targetY[row],targetX[col+1]-targetX[col],targetY[row+1]-targetY[row]);
  }else{
    ctx.strokeStyle='#d6ae6d';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x+1,y+1,w-2,h-2,8);ctx.stroke();
    ctx.strokeStyle='#8d3a51';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+5,y+5,w-10,h-10,5);ctx.stroke();
    for(const px of [x+7,x+w-7])for(const py of [y+7,y+h-7])lushDiamond(px,py,4,'#da6176');
  }ctx.restore();
}
function drawLushPanelBackground(x,y,w,h){
  const fill=ctx.createLinearGradient(x,y,x,y+h);fill.addColorStop(0,'#291220f5');fill.addColorStop(1,'#100914f5');ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x+3,y+3,w-6,h-6,8);ctx.fill();
}
function drawLushResource(x,y,w,h,compact=false,framed=true){
  const s=lushState;ctx.save();if(framed)drawLushPanelBackground(x,y,w,h);
  const im=ensureGameImage(lushArt.portrait),r=compact?17:31,cx=x+(compact?27:46),cy=y+h/2;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#421c2c';ctx.fill();
  if(im.complete&&im.naturalWidth&&im.naturalHeight){const crop=im.naturalWidth*.69;ctx.drawImage(im,im.naturalWidth*.21,0,crop,crop,cx-r,cy-r,r*2,r*2);}ctx.restore();
  ctx.strokeStyle='#dfb66b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,r+.75,0,Math.PI*2);ctx.stroke();
  const tx=cx+r+(compact?8:14),width=x+w-12-tx,assets=lushHudNumber(s.totalAssets),tier=typeof lushTier==='function'?lushTier():0,chance=(lushOdds()*100).toFixed(1).replace(/\.0$/,'');
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#ffe7b2';
  lushHudText(`${compact?'자산':'총자산'} ${assets} · ${compact?'T':'TIER '}${tier} · 피해 +${lushHudNumber((s.totalAssets||0)*.5)}%`,tx,y+h/2-(compact?14:24),width,compact?11:14,compact?10:12,true);
  ctx.fillStyle='#f5d4b0';lushHudText(`칩 ${lushHudNumber(s.chips)} · 판돈 ${lushHudNumber(s.pot)} · ${s.wins}/4연승`,tx,y+h/2,width,compact?11:12,compact?10:11);
  const message=s.bet?'주사위 판정 중…':s.messageTime?s.message:`E ${chance}% · X ${s.pot?'판돈 정산':'보호막'}`;
  ctx.fillStyle=s.bet?'#ffc18d':'#dca7b4';lushHudText(message,tx,y+h/2+(compact?14:24),width,compact?10:12,compact?10:11);if(framed)drawLushResourceFrame(x,y,w,h);ctx.restore();
}
function getLushDesktopHudLayout(){
  const available=Math.max(240,canvas.width-28),pad=12,insetY=10,innerWidth=available-pad*2;
  const cell=Math.min(98,innerWidth/4),skillWidth=cell*4,resourceWidth=Math.min(340,innerWidth),stacked=available<resourceWidth+skillWidth+14+pad*2;
  const compact=stacked&&canvas.height<420,resourceHeight=compact?64:96,skillHeight=compact?82:96,gap=compact?8:14;
  const panelWidth=(stacked?Math.max(resourceWidth,skillWidth):resourceWidth+gap+skillWidth)+pad*2,panelHeight=(stacked?resourceHeight+gap+skillHeight:96)+insetY*2;
  const bottom=canvas.height-60,top=bottom-panelHeight,panel={x:(canvas.width-panelWidth)/2,y:top,w:panelWidth,h:panelHeight};
  const resource={x:stacked?(canvas.width-resourceWidth)/2:panel.x+pad,y:top+insetY,w:resourceWidth,h:resourceHeight};
  const skillX=stacked?(canvas.width-skillWidth)/2:resource.x+resourceWidth+gap,skillY=stacked?resource.y+resource.h+gap:resource.y;
  const divider=stacked?{x1:panel.x+22,y1:resource.y+resource.h+gap/2,x2:panel.x+panel.w-22,y2:resource.y+resource.h+gap/2}:{x1:resource.x+resource.w+gap/2,y1:panel.y+18,x2:resource.x+resource.w+gap/2,y2:panel.y+panel.h-18};
  return{panel,resource,divider,skills:['q','e','x','r'].map((key,i)=>({key,x:skillX+cell*(i+.5),y:skillY+(compact?29:34),r:compact?24:27,labelY:skillY+(compact?71:83),keyY:skillY+(compact?54:59),width:cell-6})),top,bottom,stacked};
}
function getLushMobileResourceBounds(){const w=Math.min(370,Math.max(230,canvas.width*.44),canvas.width-24),h=54;return{x:canvas.width/2,y:canvas.height-97,w,h};}
function drawLushInterface(){
  if(selectedCharacter!=='lush'||isMobileTouchDevice())return;const layout=getLushDesktopHudLayout(),box=layout.resource,panel=layout.panel,d=layout.divider;
  ctx.save();drawLushPanelBackground(panel.x,panel.y,panel.w,panel.h);drawLushResource(box.x,box.y,box.w,box.h,false,false);
  ctx.strokeStyle='#d6ac6455';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d.x1,d.y1);ctx.lineTo(d.x2,d.y2);ctx.stroke();
  lushDiamond(d.x1,d.y1,2.5,'#edc47f');lushDiamond(d.x2,d.y2,2.5,'#edc47f');
  for(const [i,sk]of layout.skills.entries()){const {key,x:cx,y:cy,r}=sk;drawMobileIcon({image:lushArt.skills[i]},cx,cy,r);const cd=player['lush'+key+'Cooldown'];if(cd>0)drawCooldownCover(cx,cy,r,cd/LUSH_CD[key],cd);drawLushSkillFrame(cx,cy,r);
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    if(key==='r'&&player.level<10){ctx.fillStyle='#140512cf';ctx.beginPath();ctx.arc(cx,cy,r*.91,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.fillText('10레벨',cx,cy);}
    ctx.fillStyle='#2b1020';ctx.strokeStyle='#cfab69';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cx+18,sk.keyY-12,20,20,4);ctx.fill();ctx.stroke();ctx.fillStyle='#fff0c5';ctx.font='bold 12px Arial';ctx.fillText(key.toUpperCase(),cx+28,sk.keyY-2);
    ctx.fillStyle='#ffe5b4';lushHudText(getMobileSkillName(key),cx,sk.labelY,sk.width,12,11,true);ctx.restore();}
  // One ornament surrounds the resource section and all four skills together.
  drawLushResourceFrame(panel.x,panel.y,panel.w,panel.h);ctx.restore();
}
function drawLushMobileSkillLabel(sk){
  const lines={q:['로열','스트레이트'],e:['더블','오어 다이'],x:['캐시아웃'],r:['하우스','올인']}[sk.key]||[getMobileSkillName(sk.key)];
  ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#fff3d2';ctx.shadowColor='#100813';ctx.shadowBlur=3;
  // The default X and R centers are close together. Keep each complete line inside
  // its own button diameter instead of widening or squeezing a single-line name.
  for(const [i,line]of lines.entries())lushHudText(line,sk.x,sk.y+sk.r+11+i*11,sk.r*2,11,Math.min(8,Math.floor(sk.r*2/line.length)),true);
  ctx.restore();
}
function drawLushMobileControls(){
  if(!isMobileTouchDevice()||isMobilePortraitMode()||screenMode!=='game'||paused||choosingUpgrade||gameOver||raidVictory)return;
  const {joystick:j,attack:a,skills}=getMobileControlLayout();ctx.save();
  lushControlArt(0,j.x-j.r,j.y-j.r,j.r*2);ctx.save();ctx.beginPath();ctx.arc(j.x+mobileStickX,j.y+mobileStickY,j.r*.29,0,Math.PI*2);ctx.fillStyle='#28101de8';ctx.fill();lushDie(j.x+mobileStickX,j.y+mobileStickY,j.r*.32,6,0,true);ctx.restore();
  lushControlArt(1,a.x-a.r,a.y-a.r,a.r*2);if(mobileAttackTouchId!==null)lushRing(a.x,a.y,a.r*.93,lushState.frame*.018,.85);
  for(const sk of skills){const i=['q','e','x','r'].indexOf(sk.key);drawMobileIcon({image:lushArt.skills[i]},sk.x,sk.y,sk.r);
    const cd=getMobileSkillCooldown(sk.key);if(cd?.value>0)drawCooldownCover(sk.x,sk.y,sk.r,cd.value/cd.max,cd.value);
    if(isMobileUltimateLocked(sk.key)){ctx.fillStyle='#120814cc';ctx.beginPath();ctx.arc(sk.x,sk.y,sk.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 14px Arial';ctx.fillText('10',sk.x,sk.y+4);}
    drawLushSkillFrame(sk.x,sk.y,sk.r);drawLushMobileSkillLabel(sk);
  }ctx.restore();drawMobileSkillCancelButton();
}
function drawLushUltimatePortrait(){
  const life=lushState.portrait;if(selectedCharacter!=='lush'||screenMode!=='game'||life<=0)return;const im=ensureGameImage(lushArt.portrait);if(!im.complete||!im.naturalWidth)return;
  const age=120-life,alpha=Math.min(1,age/16,life/25),w=canvas.width*.50,h=canvas.height*.24,x=canvas.width-w;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate((1-alpha)*w*.20,0);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,0);ctx.lineTo(canvas.width,h);ctx.closePath();ctx.clip();ctx.fillStyle='#220916ec';ctx.fillRect(x,0,w,h);
  const realm=lushArt.realm;if(realm.complete&&realm.naturalWidth){ctx.globalAlpha=alpha*.4;ctx.drawImage(realm,x,0,w,h*2);ctx.globalAlpha=alpha;}
  for(let i=0;i<12;i++){const px=x+w*((i*.137+age*.002)%1),py=h*(.1+i%4*.19);lushDiamond(px,py,3,'#ffdba7',age*.02);}
  const ih=h*2.6,iw=ih*im.naturalWidth/im.naturalHeight;ctx.drawImage(im,canvas.width-iw*.86,-h*.12,iw,ih);ctx.restore();
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#fbd18d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.stroke();ctx.restore();
}
