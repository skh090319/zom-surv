// Aria: botanical spell layers. Fixed textures are cached; gameplay owns timing.
const ariaWorldTreeImage=setGameImageSource(new Image(),"assets/aria-v2/world-tree.webp");
ariaWorldTreeImage.assetGroup="aria";
const ariaTreeGrowthImage=setGameImageSource(new Image(),"assets/aria-v3/tree-growth.webp");
ariaTreeGrowthImage.assetGroup="aria";
const ariaSpellArt=Object.fromEntries(['thorn','bloom','petal'].map(name=>[name,setGameImageSource(new Image(),`assets/aria-v2/${name}-sprite.webp`)]));
function ariaSpellArtReady(image){ensureGameImage(image);return image.complete&&image.naturalWidth>0&&image.naturalHeight>0;}
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
function ariaVfxClamp(v){return Math.max(0,Math.min(1,v));}
function ariaVfxEase(v){v=ariaVfxClamp(v);return v*v*(3-2*v);}
function ariaVfxPetal(x,y,size,angle,alpha,color){
  ctx.save();ctx.globalAlpha*=ariaVfxClamp(alpha);ariaPetal(x,y,size,angle,1,color);ctx.restore();
}
function ariaSegmentVisible(x,y,tx,ty,pad=65){
  return Math.max(x,tx)+pad>camera.x&&Math.min(x,tx)-pad<camera.x+getCameraViewWidth()&&Math.max(y,ty)+pad>camera.y&&Math.min(y,ty)-pad<camera.y+getCameraViewHeight();
}
// Different branch silhouettes share a ground anchor. Cross-fades follow the
// simulation clock and remain frozen while the game is paused.
function ariaTreeVisualState(){
  const growth=typeof ariaGrowth==='undefined'?null:ariaGrowth;
  const point=typeof getAriaTreePosition==='function'?getAriaTreePosition():{x:growth?.treeX||0,y:growth?.treeY||0};
  const stage=Math.max(0,Math.min(4,growth?.visualStage??growth?.stage??0)),low=Math.floor(stage),mix=stage-low;
  const heights=[155,260,365,475,570],h=heights[low]+((heights[low+1]||heights[low])-heights[low])*mix;
  const ultimate=typeof ariaWorldTree==='undefined'?null:ariaWorldTree;
  const awaken=ultimate?ariaVfxEase((ultimate.age||0)/60)*ariaVfxEase(ultimate.life/65):0;
  const viewportScale=Math.min(1,getCameraViewHeight()*.45/600);
  return{x:point.x,y:point.y,stage,low,mix:ariaVfxEase(mix),h:Math.min(600,h+awaken*30)*viewportScale,frame:growth?.frame||0,awaken};
}
function ariaDrawTreeFallback(h,stage,alpha){
  ctx.save();ctx.globalAlpha*=alpha;ctx.lineCap='round';
  for(let layer=0;layer<3;layer++){
    ctx.strokeStyle=['#35483c','#b8c2a0','#e6d9b7'][layer];ctx.lineWidth=[h*.063,h*.034,h*.008][layer];
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-h*.09,-h*.27,h*.07,-h*.48,0,-h*.85);ctx.stroke();
    for(let n=0;n<3+Math.ceil(stage*2);n++){
      const side=n%2?1:-1,t=.3+n*.055,spread=h*(.1+.025*(n%4));
      ctx.lineWidth=Math.max(1,(h*.022-n*.5)/(layer+1));ctx.beginPath();ctx.moveTo(0,-h*t);ctx.bezierCurveTo(side*spread*.5,-h*(t+.03),side*spread,-h*(t+.11),side*spread,-h*(t+.22));ctx.stroke();
      if(layer===2)ariaBloom(side*spread,-h*(t+.2),h*(.045+.006*stage),n*.6,.7);
    }
  }ctx.restore();
}
function ariaDrawTreeArt(stage,h,alpha){
  if(alpha<=0)return;
  const image=stage<3?ariaTreeGrowthImage:ariaWorldTreeImage;
  if(!ariaSpellArtReady(image)){ariaDrawTreeFallback(h,stage,alpha);return;}
  ctx.save();ctx.globalAlpha*=alpha;
  if(stage<3){const sw=image.naturalWidth/3,sh=image.naturalHeight,w=h*sw/sh;ctx.drawImage(image,stage*sw,0,sw,sh,-w/2,-h*.92,w,h);}
  else{const w=h*image.naturalWidth/image.naturalHeight;ctx.drawImage(image,-w/2,-h*.99,w,h);}
  ctx.restore();
}
function ariaDrawPermanentTree(){
  const v=ariaTreeVisualState(),h=v.h;
  if(!ariaVfxVisible(v.x,v.y-h*.4,h*.7+70))return;
  const sway=Math.sin(v.frame*.011)*.005,roots=68+v.stage*25;
  ctx.save();ctx.translate(v.x,v.y);ctx.lineCap='round';
  for(let n=0;n<7;n++){
    const a=n*Math.PI*2/7+.2,rr=roots*(.7+n%3*.12),tx=Math.cos(a)*rr,ty=Math.sin(a)*rr*.4;
    ctx.beginPath();ctx.moveTo(0,-5);ctx.bezierCurveTo(tx*.3,ty-22,tx*.7,ty+15,tx,ty);
    ctx.strokeStyle='rgba(8,21,19,.8)';ctx.lineWidth=5+v.stage;ctx.stroke();ctx.strokeStyle='rgba(177,202,151,.4)';ctx.lineWidth=1.1;ctx.stroke();
  }
  if(v.awaken>0)ariaSigil(0,0,roots*1.45,-v.frame*.0007,v.awaken*.3);
  ctx.save();ctx.rotate(sway);ariaDrawTreeArt(v.low,h,(1-v.mix)*.96);if(v.mix>0)ariaDrawTreeArt(Math.min(4,v.low+1),h,v.mix*.96);ctx.restore();
  const adorn=ariaVfxClamp(v.stage-2),count=8+Math.ceil(v.stage*3);
  if(adorn>0)for(let n=0;n<8;n++){
    const a=n*2.399,px=Math.cos(a)*h*(.14+(n%3)*.045),py=-h*(.42+(n%4)*.095),pulse=.8+Math.sin(v.frame*.025+n)*.12;
    ariaBloom(px,py,h*.034*pulse,a,adorn*.5);ctx.strokeStyle='rgba(236,209,139,.34)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+Math.sin(v.frame*.018+n)*5,py+13,px+3,py+25);ctx.stroke();ariaGleam(px+3,py+25,2.5+v.awaken*2,adorn*.75);
  }
  ctx.globalCompositeOperation='lighter';
  for(let n=0;n<count;n++){
    const t=(v.frame*.0013+n*.137)%1,a=n*2.399,px=Math.cos(a+v.frame*.002)*h*(.12+(n%4)*.045),py=-h*(.18+t*.65),alpha=Math.sin(t*Math.PI)*(.42+v.awaken*.24);
    ariaGleam(px,py,1.7+n%3+v.awaken,alpha);
    if(n%4===0)ariaVfxPetal(px+8,py+11,3+n%2,v.frame*.008+n,alpha,'#e7a5c3');
  }
  ctx.restore();
}
function ariaDrawRootThread(e,alpha=1){
  const tx=e.tx??e.x,ty=e.ty??e.y;if(!ariaSegmentVisible(e.x,e.y,tx,ty,90))return;
  const age=1-e.life/e.maxLife,grow=1-Math.pow(1-ariaVfxClamp(age*4),3),dx=(tx-e.x)*grow,dy=(ty-e.y)*grow,d=Math.hypot(dx,dy),bend=Math.min(90,d*.16),a=Math.atan2(dy,dx);
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);ctx.globalAlpha*=alpha;ctx.lineCap='round';
  for(let layer=0;layer<4;layer++){
    ctx.strokeStyle=['rgba(11,32,25,.85)','rgba(83,222,152,.17)','#7ab694','#eee3ba'][layer];ctx.lineWidth=[12,20,5,1.3][layer];
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(d*.24,-bend,d*.7,bend*.55,d,0);ctx.stroke();
  }
  for(let n=1;n<6;n++){
    const t=n/6,px=d*t,py=-3*bend*(1-t)*(1-t)*t+3*bend*.55*(1-t)*t*t;
    ctx.save();ctx.translate(px,py);ctx.rotate(n%2?-.7:.7);ctx.fillStyle=n%2?'#8ed1a3':'#e1b2b9';ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(1,-14,14,-7);ctx.quadraticCurveTo(6,2,-5,0);ctx.fill();ctx.restore();
  }
  const pulse=(age*3)%1,px=d*pulse,py=-3*bend*(1-pulse)*(1-pulse)*pulse+3*bend*.55*(1-pulse)*pulse*pulse;
  ariaGleam(px,py,5,alpha);ariaBloom(d,0,18+22*Math.sin(Math.PI*ariaVfxClamp(age*2)),age*.2,alpha*.8);ctx.restore();
}
function ariaDrawLance(e){
  const p=ariaVfxClamp(1-e.life/e.maxLife),a=ariaVfxClamp(e.life/12),length=e.length||600,width=e.width||22,head=length*ariaVfxEase(Math.min(1,p*4));
  const tx=e.x+Math.cos(e.angle||0)*length,ty=e.y+Math.sin(e.angle||0)*length;
  if(!ariaSegmentVisible(e.x,e.y,tx,ty,width+45))return;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);ctx.globalAlpha*=a;ctx.lineCap='round';
  for(let layer=0;layer<3;layer++){
    ctx.strokeStyle=['rgba(104,233,174,.09)','rgba(255,162,204,.25)','#bceac9'][layer];ctx.lineWidth=[width*2.5,width*.8,2][layer];ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(head*.25,-width*.3,head*.7,width*.3,head,0);ctx.stroke();
  }
  for(let side=-1;side<=1;side+=2){ctx.fillStyle=side<0?'#406956':'#8be0b3';ctx.strokeStyle='#f8e6c6';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(head-84,side*width*.18);ctx.lineTo(head-32,side*width*.54);ctx.lineTo(head+22,0);ctx.lineTo(head-57,side*width*.08);ctx.closePath();ctx.fill();ctx.stroke();}
  for(let n=1;n<7;n++){const x=head*n/7;ctx.strokeStyle=n%2?'rgba(255,171,201,.6)':'rgba(184,255,206,.45)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-17,0);ctx.quadraticCurveTo(x-4,-width*(n%2?1:-1),x+15,-width*.45*(n%2?1:-1));ctx.stroke();ariaGleam(x,-Math.sin(n)*width,2+n%3,a*(1-p));}
  if(ariaSpellArtReady(ariaSpellArt.thorn)){ctx.save();ctx.translate(head-24,0);ctx.rotate(Math.PI/2);ctx.globalAlpha*=.7;ctx.drawImage(ariaSpellArt.thorn,-34,-44,68,88);ctx.restore();}
  ariaGleam(head+18,0,10,a);ctx.restore();
}
function ariaDrawBolt(b){
  if(!ariaVfxVisible(b.x,b.y,105))return;
  const spirit=b.type==='spirit',echo=b.type==='echo',angle=b.angle??Math.atan2(b.y-(b.py??b.y),b.x-(b.px??b.x)),age=(b.maxLife||120)-b.life,alpha=ariaVfxClamp(b.life/8),size=spirit?26:echo?21:17;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.lineCap='round';
  for(let layer=0;layer<3;layer++){
    ctx.strokeStyle=layer===0?'rgba(255,147,197,.08)':layer===1?'rgba(122,242,183,.22)':'#dff4ca';ctx.lineWidth=[size*.8,4,1][layer];ctx.beginPath();ctx.moveTo(-size*3,Math.sin(age*.08)*5);ctx.quadraticCurveTo(-size*1.8,-7,-size*.2,0);ctx.stroke();
  }
  if(ariaSpellArtReady(ariaSpellArt.petal)){ctx.save();ctx.rotate(Math.PI/4);ctx.drawImage(ariaSpellArt.petal,-size,-size,size*2,size*2);ctx.restore();}
  else ariaVfxPetal(0,0,size*.65,Math.PI/2,alpha,'#ffd8e6');
  if(spirit){ariaBloom(-2,0,14,age*.025,.8);for(let n=0;n<3;n++)ariaGleam(-22-n*15,Math.sin(age*.06+n)*8,2+n%2,alpha*.5);}
  ariaGleam(6,0,4,alpha);ctx.restore();
}
function ariaDrawParasiticField(field){
  if(!ariaVfxVisible(field.x,field.y,field.r+30))return;
  const a=ariaVfxEase((field.age||0)/18)*ariaVfxEase(field.life/35),phase=field.phase||0;
  ariaSigil(field.x,field.y,field.r,phase*.018,a*.25);
  for(let n=0;n<9;n++){
    const angle=n*2.399,rr=field.r*(.25+(n%4)*.18),x=field.x+Math.cos(angle)*rr,y=field.y+Math.sin(angle)*rr;
    ariaBloom(x,y,15+Math.sin(phase*.7+n)*3,angle,a*.65);
    ctx.strokeStyle='rgba(124,208,157,.22)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(field.x,field.y);ctx.bezierCurveTo(field.x+(x-field.x)*.35,field.y-25,x-16,y+18,x,y);ctx.stroke();
  }
}
function ariaDrawEnemyBotany(){
  if(typeof zombies==='undefined')return;let visible=0;
  const frame=typeof ariaGrowth==='undefined'?0:ariaGrowth.frame||0;
  for(let i=0;i<zombies.length&&visible<72;i++){
    const z=zombies[i];if(z.hp<=0||(!z.ariaMarkTime&&!z.ariaInfection)||!ariaVfxVisible(z.x,z.y,80))continue;visible++;
    if(z.ariaInfection){const infection=z.ariaInfection,alpha=ariaVfxEase(infection.life/20);ariaBloom(z.x,z.y-(z.r||18)*.45,16+Math.sin(frame*.045+i)*2,frame*.008,alpha*.8);}
    if(z.ariaMarkTime>0){
      const y=z.y-(z.r||18)-12,alpha=ariaVfxClamp(z.ariaMarkTime/15);ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle='#f2d0b2';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(z.x-10,y+3);ctx.lineTo(z.x-8,y-6);ctx.lineTo(z.x-3,y-2);ctx.lineTo(z.x,y-11);ctx.lineTo(z.x+3,y-2);ctx.lineTo(z.x+8,y-6);ctx.lineTo(z.x+10,y+3);ctx.closePath();ctx.stroke();ariaGleam(z.x,y-2,2,.9);ctx.restore();
    }
  }
}
function ariaDrawBlossomBurst(e,royal=false){
  const p=ariaVfxClamp(1-e.life/e.maxLife),a=1-p,expand=1-Math.pow(1-p,3),r=(e.r||90)*(.16+.84*expand),count=royal?24:12;
  ariaSigil(e.x,e.y,r,p*.1,a*(royal?.65:.3));ariaBloom(e.x,e.y,Math.min(royal?145:72,r*.55),p*.4,a*.85);
  for(let n=0;n<count;n++){
    const angle=n*2.399,rr=r*(.3+(n%5)*.14),x=e.x+Math.cos(angle)*rr,y=e.y+Math.sin(angle)*rr-p*(royal?38:15);
    if(n%3===0)ariaBloom(x,y,(royal?23:12)*(1+p*.5),angle+p,a*.6);
    else ariaVfxPetal(x,y,royal?7+n%4:4+n%3,angle+p*1.3,a,n%2?'#ffd4e2':'#b8efbd');
    ariaGleam(x,y,3+n%3,a*.7);
  }
}
function ariaDrawHarvest(e){
  const p=ariaVfxClamp(1-e.life/e.maxLife),a=ariaVfxClamp(e.life/18),radius=(e.r||280)*(1-ariaVfxEase(p));
  ariaSigil(e.x,e.y,70+radius*.48,p*.15,a*.25);
  for(let n=0;n<12;n++){const angle=n*Math.PI/6+p*.8;ariaPetalRibbon(e.x,e.y,18+radius*(.7+n%3*.1),angle,a*.6,.24);}
  ariaBloom(e.x,e.y,24+Math.sin(p*Math.PI)*32,-p*.6,a*.65);
}
function ariaDrawEssence(e){
  const p=ariaVfxClamp(1-e.life/e.maxLife),t=ariaVfxEase(p),tx=e.tx??e.x,ty=e.ty??e.y;
  if(!ariaSegmentVisible(e.x,e.y,tx,ty,70))return;
  const x=e.x+(tx-e.x)*t,y=e.y+(ty-e.y)*t-Math.sin(p*Math.PI)*55;
  if(!ariaVfxVisible(x,y,45))return;
  ariaGleam(x,y,4+Math.min(3,e.amount||1),Math.sin(p*Math.PI));
  ariaVfxPetal(x-8,y+4,4,p*3,.65,'#c3ffcb');
}
function drawAriaRoyalEffects(){
  if(selectedCharacter!=="aria")return;worldStart();ctx.save();
  ariaDrawPermanentTree();
  if(typeof ariaBlooms!=='undefined')for(let i=0;i<ariaBlooms.length&&i<8;i++)ariaDrawParasiticField(ariaBlooms[i]);
  ariaDrawEnemyBotany();
  if(typeof ariaBolts!=='undefined')for(let i=0;i<ariaBolts.length&&i<90;i++)ariaDrawBolt(ariaBolts[i]);
  if(typeof ariaSpirits!=='undefined')for(let i=0;i<ariaSpirits.length&&i<32;i++)ariaDrawBolt(ariaSpirits[i]);
  for(let i=0;i<ariaEffects.length&&i<120;i++){
    const e=ariaEffects[i];if(e.life<=0||!(e.maxLife>0))continue;
    const a=ariaVfxClamp(e.life/18),p=ariaVfxClamp(1-e.life/e.maxLife);
    if(e.type==='thornLance'){ariaDrawLance(e);continue;}
    if(e.type==='treeRoot'||e.type==='treeEcho'){ariaDrawRootThread(e,a);continue;}
    if(e.type==='essence'){ariaDrawEssence(e);continue;}
    if(!ariaVfxVisible(e.x,e.y,(e.r||100)+90))continue;
    if(e.type==='harvest'){ariaDrawHarvest(e);continue;}
    if(e.type==='worldTreeFinal'||e.type==='growth'){ariaDrawBlossomBurst(e,true);continue;}
    if(e.type==='worldTreeCast'){
      ariaSigil(e.x,e.y,(e.r||650)*(.2+.8*ariaVfxEase(p)),p*.08,(1-p)*.45);
      for(let n=0;n<18;n++){const angle=n*2.399,r=(e.r||650)*(.18+n%5*.09),height=p*160;ariaVfxPetal(e.x+Math.cos(angle)*r,e.y+Math.sin(angle)*r-height,8+n%5,angle+p,.7*(1-p),n%2?'#f9c9de':'#b7e6be');ariaGleam(e.x+Math.cos(angle)*r,e.y+Math.sin(angle)*r-height,3+n%3,(1-p)*.8);}
      continue;
    }
    if(e.type==='infectionBurst'||e.type==='parasiticBloom'||e.type==='petalHit'||e.type==='bloom'||e.type==='echoBloom')ariaDrawBlossomBurst(e);
  }
  const growth=typeof ariaGrowth==='undefined'?null:ariaGrowth;
  if(growth?.shield>0&&ariaVfxVisible(player.x,player.y,90)){
    const fade=ariaVfxClamp((growth.shieldTime||60)/30),phase=(growth.frame||0)*.015;
    for(let n=0;n<3;n++)ariaPetalRibbon(player.x,player.y,40+n*5,phase+n*Math.PI*2/3,fade*.45,.38);
  }
  ctx.restore();worldEnd();
}
drawAriaEffectsV3=drawAriaRoyalEffects;
