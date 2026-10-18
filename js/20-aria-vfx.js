// Aria: botanical spell layers. Fixed textures are cached; gameplay owns timing.
const ariaWorldTreeImage=setGameImageSource(new Image(),"assets/aria-v2/world-tree.webp");
ariaWorldTreeImage.assetGroup="aria";
const ariaSpellArt=Object.fromEntries(['thorn','bloom','petal'].map(name=>[name,setGameImageSource(new Image(),`assets/aria-v2/${name}-sprite.webp`)]));
function ariaSpellArtReady(image){ensureGameImage(image);return image.complete&&image.naturalWidth>0;}
let ariaSpellTexture=null,ariaBloomTexture=null;
function ariaVfxSurface(size){
  const c=typeof OffscreenCanvas!=="undefined"?new OffscreenCanvas(size,size):document.createElement("canvas");
  c.width=c.height=size;return c;
}
function ariaBuildSpellTexture(){
  if(ariaSpellTexture)return ariaSpellTexture;
  const c=ariaVfxSurface(512),p=c.getContext("2d");p.translate(256,256);
  const glow=p.createRadialGradient(0,0,10,0,0,250);
  glow.addColorStop(0,"rgba(109,255,210,.09)");glow.addColorStop(.7,"rgba(255,134,191,.055)");glow.addColorStop(1,"rgba(255,174,211,0)");
  p.fillStyle=glow;p.fillRect(-256,-256,512,512);
  p.strokeStyle="rgba(200,248,218,.7)";p.lineWidth=1.3;
  for(const r of [180,218,228]){p.beginPath();p.arc(0,0,r,0,Math.PI*2);p.stroke();}
  for(let n=0;n<12;n++){
    const a=n*Math.PI/6;p.save();p.rotate(a);p.strokeStyle="rgba(229,182,130,.85)";
    p.beginPath();p.moveTo(192,-9);p.quadraticCurveTo(235,-18,242,0);p.quadraticCurveTo(235,18,192,9);p.stroke();
    p.strokeStyle="rgba(122,245,210,.45)";p.beginPath();p.moveTo(0,0);p.bezierCurveTo(30,-100,160,-80,210,0);p.bezierCurveTo(160,80,30,100,0,0);p.stroke();p.restore();
  }
  for(let n=0;n<48;n++){const a=n*Math.PI/24,r=n%4?224:234;p.fillStyle=n%4?"#8acbb7":"#fff4d5";p.beginPath();p.arc(Math.cos(a)*r,Math.sin(a)*r,n%4?.7:2,0,Math.PI*2);p.fill();}
  return ariaSpellTexture=c;
}
function ariaBuildBloomTexture(){
  if(ariaBloomTexture)return ariaBloomTexture;
  const c=ariaVfxSurface(256),p=c.getContext("2d");p.translate(128,128);
  const haze=p.createRadialGradient(0,0,3,0,0,124);haze.addColorStop(0,"rgba(255,238,205,.9)");haze.addColorStop(.35,"rgba(250,111,168,.2)");haze.addColorStop(1,"rgba(255,145,201,0)");
  p.fillStyle=haze;p.fillRect(-128,-128,256,256);
  for(let layer=0;layer<4;layer++)for(let n=0;n<9;n++){
    p.save();p.rotate(n*Math.PI*2/9+layer*.37);const s=100-layer*21;
    const g=p.createLinearGradient(0,-s,0,8);g.addColorStop(0,"#ffe9c5");g.addColorStop(.22,layer%2?"#d0ffde":"#ffbfd7");g.addColorStop(.7,"#c44780");g.addColorStop(1,"#4c264d");
    p.fillStyle=g;p.strokeStyle="rgba(255,236,220,.6)";p.lineWidth=.7;p.beginPath();p.moveTo(0,8);p.bezierCurveTo(-s*.55,-s*.22,-s*.5,-s*.8,0,-s);p.bezierCurveTo(s*.5,-s*.8,s*.55,-s*.22,0,8);p.fill();p.stroke();p.restore();
  }
  p.fillStyle="#fff9cd";p.beginPath();p.arc(0,0,6,0,Math.PI*2);p.fill();return ariaBloomTexture=c;
}
function ariaVfxVisible(x,y,r){
  return x+r>camera.x&&x-r<camera.x+getCameraViewWidth()&&y+r>camera.y&&y-r<camera.y+getCameraViewHeight();
}
function ariaSigil(x,y,r,phase,alpha){
  if(r<=0||alpha<=0)return;ctx.save();ctx.translate(x,y);ctx.rotate(phase);ctx.globalAlpha*=alpha;
  ctx.drawImage(ariaBuildSpellTexture(),-r,-r,r*2,r*2);ctx.restore();
}
function ariaBloom(x,y,r,phase,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(phase);ctx.globalAlpha*=alpha;
  ctx.drawImage(ariaSpellArtReady(ariaSpellArt.bloom)?ariaSpellArt.bloom:ariaBuildBloomTexture(),-r,-r,r*2,r*2);ctx.restore();
}
function ariaGleam(x,y,r,alpha){
  ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle="#fff7d9";ctx.beginPath();ctx.moveTo(x,y-r);ctx.quadraticCurveTo(x+1,y-1,x+r,y);ctx.quadraticCurveTo(x+1,y+1,x,y+r);ctx.quadraticCurveTo(x-1,y+1,x-r,y);ctx.quadraticCurveTo(x-1,y-1,x,y-r);ctx.fill();ctx.restore();
}
function ariaPetalRibbon(x,y,r,angle,alpha,length=.75){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.lineCap="round";
  for(let layer=0;layer<3;layer++){
    ctx.strokeStyle=["rgba(255,107,167,.08)","rgba(255,164,206,.25)","#fff1d1"][layer];ctx.lineWidth=[16,6,1.2][layer];
    ctx.beginPath();ctx.arc(0,0,r,-length,0);ctx.stroke();
  }
  ctx.translate(r,0);ctx.rotate(Math.PI/2);ctx.fillStyle="#ffb4d6";ctx.strokeStyle="#fff9d8";ctx.lineWidth=1;
  if(ariaSpellArtReady(ariaSpellArt.petal)){
    ctx.rotate(-Math.PI/4);ctx.drawImage(ariaSpellArt.petal,-33,-33,66,66);ctx.restore();return;
  }
  ctx.beginPath();ctx.moveTo(0,-21);ctx.bezierCurveTo(-14,-6,-9,12,0,23);ctx.bezierCurveTo(10,10,15,-9,0,-21);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,16);ctx.stroke();ctx.restore();
}
function ariaDrawThorns(e){
  const p=1-e.life/e.maxLife,grow=1-Math.pow(1-Math.min(1,p*3),3),alpha=Math.min(1,e.life/14),r=e.r*grow;
  ariaSigil(e.x,e.y,e.r*1.12,p*.16,alpha*.65);ctx.save();ctx.translate(e.x,e.y);ctx.lineCap="round";
  for(let n=0;n<10;n++){
    ctx.save();ctx.rotate(n*Math.PI/5+.15);const length=r*(.82+(n%3)*.08);
    for(let layer=0;layer<3;layer++){ctx.strokeStyle=["rgba(10,42,30,.85)","#52b999","#d1ffe0"][layer];ctx.lineWidth=[9,5,1.1][layer];ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(length*.25,-26,length*.73,22,length,0);ctx.globalAlpha=alpha;ctx.stroke();}
    for(let k=1;k<4;k++){const px=length*k/4,py=Math.sin(k/4*Math.PI*2)*9;
      ctx.fillStyle=k%2?"#ffaad2":"#9af5c8";ctx.beginPath();ctx.moveTo(px-6,py);ctx.lineTo(px+3,py-16-k*2);ctx.lineTo(px+9,py+2);ctx.closePath();ctx.fill();}
    ctx.restore();ariaGleam(Math.cos(n*Math.PI/5+.15)*length,Math.sin(n*Math.PI/5+.15)*length,5+4*(1-p),alpha);
  }ctx.restore();
  if(ariaSpellArtReady(ariaSpellArt.thorn)){
    ctx.save();ctx.globalAlpha*=alpha;
    const h=e.r*(.5+.9*grow),w=h*.84;
    ctx.drawImage(ariaSpellArt.thorn,e.x-w/2,e.y-h*.8,w,h);
    ctx.restore();
  }else ariaBloom(e.x,e.y,30+30*grow,p*.25,alpha);
}
function ariaDrawWorldTree(tree,ending=false){
  const age=tree.age||0,enter=Math.min(1,age/65),ease=1-Math.pow(1-enter,3),fade=ending?tree.life/tree.maxLife:Math.min(1,tree.life/70);
  const alpha=Math.max(0,fade),phase=tree.phase||age*.016,r=tree.r;
  if(!ariaVfxVisible(tree.x,tree.y-160,r+350))return;
  ariaSigil(tree.x,tree.y,r,-phase*.07,alpha*.8);
  ctx.save();ctx.translate(tree.x,tree.y);ctx.globalAlpha=alpha;ctx.lineCap="round";
  for(let n=0;n<12;n++){const a=n*Math.PI/6,rr=r*.77*ease;ctx.save();ctx.rotate(a);ctx.strokeStyle="rgba(109,239,181,.24)";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(rr*.3,-40,rr*.68,40,rr,0);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle="#d9d2a2";ctx.stroke();ctx.restore();}
  const im=ensureGameImage(ariaWorldTreeImage,"high");
  if(im.complete&&im.naturalWidth){
    const h=590*(.18+.82*ease),w=h*im.naturalWidth/im.naturalHeight;
    ctx.globalAlpha=alpha*.87;ctx.drawImage(im,-w/2,-h*.87,w,h);
  }
  ctx.globalCompositeOperation="lighter";
  for(let n=0;n<36;n++){
    const seed=n*.618033,t=(age*.003+n*.117)%1,a=seed*6.283,radius=80+(n%7)*32;
    const px=Math.cos(a+phase*.05)*radius,py=-60-t*400;
    ctx.globalAlpha=alpha*Math.sin(t*Math.PI)*.75;
    ariaPetal(px,py,3+n%4,phase*.4+n,.8,n%2?"#ffc1d8":"#b9ffd2");
    if(n%5===0)ariaGleam(px,py,5,alpha*Math.sin(t*Math.PI));
  }
  ctx.restore();
}
function drawAriaRoyalEffects(){
  if(selectedCharacter!=="aria")return;worldStart();ctx.save();
  const now=performance.now()*.001;
  // Static flower art is reused for every soil instead of rebuilding gradients.
  for(const s of ariaSoils){if(!ariaVfxVisible(s.x,s.y,100))continue;
    const a=Math.min(1,s.life/45);ariaSigil(s.x,s.y,s.r*.95,s.phase*.04,a*.4);ariaBloom(s.x,s.y,18+s.stage*8,s.phase*.03,a*.65);
  }
  if(typeof getAriaGardenLinks==="function"){
    ctx.strokeStyle="rgba(120,239,190,.2)";ctx.lineWidth=1.3;ctx.setLineDash([3,9]);ctx.lineDashOffset=-now*12;
    for(const [a,b]of getAriaGardenLinks()){if(!ariaVfxVisible(a.x,a.y,240))continue;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-24,b.x,b.y);ctx.stroke();}ctx.setLineDash([]);
  }
  for(const field of ariaJudgments){
    if(!ariaVfxVisible(field.x,field.y,field.r))continue;
    const a=Math.min(1,field.age/18,field.life/35);ariaSigil(field.x,field.y,field.r,field.phase*.08,a*.85);
    ariaBloom(field.x,field.y,field.r*.36*(1+Math.sin(field.phase)*.05),-field.phase*.1,a*.9);
    for(let n=0;n<10;n++){const angle=n*Math.PI/5+field.phase*.1,rr=field.r*.73;ariaBloom(field.x+Math.cos(angle)*rr,field.y+Math.sin(angle)*rr,20+Math.sin(field.phase+n)*5,angle,a*.65);}
  }
  if(ariaWorldTree)ariaDrawWorldTree(ariaWorldTree);
  if(ariaPetalStorm){const s=ariaPetalStorm,a=Math.min(1,s.age/15,s.life/30);ariaSigil(s.x,s.y,s.r,-s.phase*.13,a*.35);
    for(let n=0;n<8;n++)ariaPetalRibbon(s.x,s.y,s.r*(n%2?.88:.68),s.phase+n*Math.PI/4,a,n%2?.9:1.3);
  }
  for(const e of ariaEffects){
    if(!ariaVfxVisible(e.x,e.y,(e.r||100)+400))continue;
    const p=1-e.life/e.maxLife,a=Math.min(1,e.life/18);
    if(e.type==="thorns"){ariaDrawThorns(e);continue;}
    if(e.type==="bloom"||e.type==="echoBloom"){ariaBloom(e.x,e.y,e.r*(.3+.6*Math.sin(p*Math.PI*.7)),p*.3,a);continue;}
    const final=e.type==="worldTreeFinal"||e.type==="judgmentFinal";
    if(e.type==="worldTreeFinal")ariaDrawWorldTree({...e,age:720+(e.maxLife-e.life),phase:12},true);
    const isTree=e.type.startsWith("worldTree"),isJudgment=e.type.startsWith("judgment");
    if(isTree||isJudgment||e.type==="petalStormCast"){
      const expand=1-Math.pow(1-p,3),rr=e.r*(.15+.85*expand);
      ariaSigil(e.x,e.y,rr,p*.12,(1-p)*(final?.95:.45));
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=final?"#fff1d5":"#b9ffe0";ctx.globalAlpha=(1-p)*.7;ctx.lineWidth=final?2.5:1;
      for(let ring=0;ring<(final?3:1);ring++){ctx.beginPath();ctx.arc(e.x,e.y,rr*(1-ring*.1),0,Math.PI*2);ctx.stroke();}ctx.restore();
      if(final||e.type.endsWith("Cast"))for(let n=0;n<18;n++){const angle=n*2.399,pr=rr*(.3+(n%5)*.14);ariaGleam(e.x+Math.cos(angle)*pr,e.y+Math.sin(angle)*pr-p*35,3+n%4,(1-p)*.8);}
    }
  }
  ctx.restore();worldEnd();
}
drawAriaEffectsV3=drawAriaRoyalEffects;
