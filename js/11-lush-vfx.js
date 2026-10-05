// LusH prestige VFX: image-backed glass, gilded cards and a four-dealer casino.
// All reusable canvases are cached. Effects are analytical, never spawn render-time particles.
const lushVfxCache=new Map();
const LUSH_TAU=Math.PI*2;
const lushVfxShardWork=new Float64Array(32*8);
const lushVfxRayWork=new Float64Array(12*4);
function lushVfxClamp(v){return Math.max(0,Math.min(1,v));}
function lushVfxEase(v){v=lushVfxClamp(v);return 1-Math.pow(1-v,3);}
function lushVfxTier(){return typeof lushTier==='function'?lushTier():[50,150,350,700].filter(n=>(lushState.totalAssets||0)>=n).length;}
function lushVfxCanvas(key,size,paint){
  if(lushVfxCache.has(key))return lushVfxCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);lushVfxCache.set(key,c);return c;
}
function lushVfxImage(file){
  const shared=lushArt.vfx?.[file.replace('vfx-','')];if(shared)return ensureGameImage(shared);
  const key='image:'+file;
  if(!lushVfxCache.has(key)){const im=setGameImageSource(new Image(),'assets/lush-v2/'+file+'.webp');im.assetGroup='lush';lushVfxCache.set(key,im);}
  return ensureGameImage(lushVfxCache.get(key));
}
function lushVfxSprite(file,x,y,w,h=w,a=0,alpha=1,add=false){
  const im=lushVfxImage(file);if(!im.complete||!im.naturalWidth)return false;
  ctx.save();ctx.globalAlpha*=alpha;if(add)ctx.globalCompositeOperation='lighter';ctx.translate(x,y);ctx.rotate(a);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();return true;
}
function lushVfxFlare(x,y,r,alpha=1,red=false){
  if(alpha<=0||r<=0)return;
  const sprite=lushVfxCanvas(red?'flare-red':'flare-gold',256,(g,n)=>{
    const q=n/2,grad=g.createRadialGradient(q,q,0,q,q,q);grad.addColorStop(0,'#fff9e8');grad.addColorStop(.025,'#fff5bc');grad.addColorStop(.09,red?'#ff759599':'#ffd784aa');grad.addColorStop(.3,red?'#db185523':'#f6a8452b');grad.addColorStop(1,'#d4702000');g.fillStyle=grad;g.fillRect(0,0,n,n);
    g.translate(q,q);g.fillStyle=red?'#ffd8dfc0':'#fff9dcd0';g.beginPath();g.moveTo(-q,0);g.quadraticCurveTo(-5,-3,0,-q*.6);g.quadraticCurveTo(3,-4,q,0);g.quadraticCurveTo(4,3,0,q*.6);g.quadraticCurveTo(-3,4,-q,0);g.fill();
  });
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;ctx.drawImage(sprite,x-r,y-r,r*2,r*2);ctx.restore();
}
function lushVfxCardTexture(rank=0,suit=0){
  rank=Math.max(0,Math.min(4,rank|0));suit=((suit%4)+4)%4;
  return lushVfxCanvas('card:'+rank+':'+suit,192,(g,n)=>{
    const x=35,y=9,w=122,h=174,r=9;g.lineJoin='round';g.shadowBlur=8;g.shadowColor='#ffc653aa';
    let grad=g.createLinearGradient(x,y,x+w,y+h);grad.addColorStop(0,'#fff2cb');grad.addColorStop(.12,'#9b6837');grad.addColorStop(.2,'#efd18c');grad.addColorStop(.5,'#563524');grad.addColorStop(.84,'#eed796');grad.addColorStop(1,'#fff7db');g.fillStyle=grad;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();g.shadowBlur=0;
    grad=g.createLinearGradient(x,y,x+w,y+h);grad.addColorStop(0,'#fff9e7');grad.addColorStop(.46,'#d9cfad');grad.addColorStop(1,'#ae9977');g.fillStyle=grad;g.beginPath();g.roundRect(x+5,y+5,w-10,h-10,5);g.fill();
    g.strokeStyle='#a8874a';g.lineWidth=1;g.strokeRect(x+11,y+11,w-22,h-22);g.strokeStyle='#a8874a65';
    for(let i=0;i<7;i++){g.beginPath();g.moveTo(x+11,y+30+i*16);g.lineTo(x+w-11,y+80+i*16);g.stroke();}
    const red=suit%2===1,mark=['♠','♦','♣','♥'][suit],label=['10','J','Q','K','A'][rank];g.fillStyle=red?'#a6163c':'#261727';g.textAlign='center';g.textBaseline='middle';g.font='bold 70px Georgia';g.fillText(mark,n/2,n/2+5);
    g.font='bold 25px Georgia';g.fillText(label,x+22,y+25);g.font='20px Georgia';g.fillText(mark,x+22,y+47);g.save();g.translate(x+w-22,y+h-25);g.rotate(Math.PI);g.font='bold 25px Georgia';g.fillText(label,0,0);g.font='20px Georgia';g.fillText(mark,0,22);g.restore();
    g.strokeStyle='#fff9e9e0';g.lineWidth=2;g.beginPath();g.moveTo(x+8,y+h-15);g.lineTo(x+8,y+9);g.lineTo(x+w-15,y+9);g.stroke();
  });
}
function lushVfxCard(x,y,a,size=22,rank=4,suit=0,alpha=1){
  if(rank===4&&suit%2===0&&lushVfxSprite('vfx-card',x,y,size*1.38,size*1.8,a,alpha))return;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(a);ctx.drawImage(lushVfxCardTexture(rank,suit),-size,-size,size*2,size*2);ctx.restore();
}
function lushVfxDieTexture(eye,gold){
  return lushVfxCanvas('die:'+eye+':'+gold,256,(g,n)=>{
    const q=n/2;g.translate(q,q);g.lineJoin='round';g.lineWidth=2;
    const faces=[[[0,-98],[88,-47],[0,2],[-88,-47]],[[0,2],[88,-47],[88,56],[0,105]],[[-88,-47],[0,2],[0,105],[-88,56]]];
    faces.forEach((points,j)=>{const grad=g.createLinearGradient(-80,-90,85,90);grad.addColorStop(0,gold?'#fff4bfdc':'#fbe9e2dd');grad.addColorStop(.18,gold?'#ffe09e8f':'#ffa0b367');grad.addColorStop(.46,gold?'#a2723944':'#4b173f34');grad.addColorStop(.8,gold?'#de9e57b0':'#a6517887');grad.addColorStop(1,'#fff0cde0');g.fillStyle=grad;g.strokeStyle='#ffedc4';g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();g.stroke();});
    g.lineWidth=1;g.strokeStyle='#fff3ca80';for(let i=0;i<3;i++){g.beginPath();g.moveTo(-79+i*8,-42+i*4);g.lineTo(-79+i*8,50-i*3);g.lineTo(-10,89-i*9);g.stroke();}
    g.save();g.transform(1,.55,0,1,-46,26);g.fillStyle='#fff8db';g.shadowColor='#fff4cb';g.shadowBlur=5;const dots={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[eye]||[[0,0]];
    dots.forEach(p=>{g.beginPath();g.arc(p[0]*19,p[1]*23,4.8,0,LUSH_TAU);g.fill();});g.restore();
    g.save();g.transform(1,-.55,0,1,44,30);g.fillStyle='#fff6d5';for(let i=-1;i<=1;i++){g.beginPath();g.arc(0,i*23,4.5,0,LUSH_TAU);g.fill();}g.restore();
    g.strokeStyle='#fffbe9';g.lineWidth=3;g.beginPath();g.moveTo(-87,-47);g.lineTo(0,-98);g.lineTo(87,-47);g.moveTo(0,2);g.lineTo(0,104);g.stroke();
    g.fillStyle='#fff8ec88';g.beginPath();g.moveTo(-66,-40);g.lineTo(-53,-33);g.lineTo(-32,55);g.lineTo(-44,49);g.closePath();g.fill();g.beginPath();g.moveTo(17,-85);g.lineTo(30,-77);g.lineTo(-12,-54);g.lineTo(-24,-61);g.closePath();g.fill();
  });
}
function lushVfxDie(x,y,size,eye=6,angle=0,gold=false,alpha=1){
  if(gold&&size>=70&&lushVfxSprite('vfx-die',x,y,size*2,size*1.87,angle,alpha))return;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(lushVfxDieTexture(eye,gold),-size,-size,size*2,size*2);ctx.restore();
}
function lushVfxFloor(){
  return lushVfxCanvas('roulette-floor',1024,(g,n)=>{
    const c=n/2;g.translate(c,c);g.lineWidth=1.5;g.strokeStyle='#f1c47d88';
    for(const r of [490,477,425,408,316,305]){g.beginPath();g.arc(0,0,r,0,LUSH_TAU);g.stroke();}
    for(let i=0;i<40;i++){const a=i*LUSH_TAU/40,b=(i+1)*LUSH_TAU/40;g.fillStyle=i%2?'#ae28451c':'#e9b66813';g.beginPath();g.arc(0,0,475,a+.007,b-.007);g.arc(0,0,427,b-.007,a+.007,true);g.closePath();g.fill();g.strokeStyle=i%5?'#d7a95b66':'#ffedbdcc';g.beginPath();g.moveTo(Math.cos(a)*427,Math.sin(a)*427);g.lineTo(Math.cos(a)*475,Math.sin(a)*475);g.stroke();
      if(i%5===0){g.save();g.rotate(a);g.translate(0,-368);g.rotate(-a);g.fillStyle='#fce9b9b0';g.font='31px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(['♠','♦','♣','♥'][(i/5)%4],0,0);g.restore();}}
    g.strokeStyle='#c79a5266';g.lineWidth=1;
    for(let k=0;k<8;k++){const a=k*Math.PI/4;g.save();g.rotate(a);g.beginPath();g.moveTo(110,0);g.bezierCurveTo(230,-40,250,-105,308,-125);g.bezierCurveTo(275,-65,240,-10,315,0);g.bezierCurveTo(240,10,275,65,308,125);g.bezierCurveTo(250,105,230,40,110,0);g.stroke();g.restore();}
  });
}
function lushVfxRibbon(points,tip,width,red=false,alpha=1){
  if(!points?.length)return;ctx.save();ctx.globalAlpha*=alpha;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation='lighter';
  const start=Math.max(0,points.length-12);const n=points.length-start;
  // Three continuous tapered meshes replace per-segment strokes without losing trail layers.
  for(let layer=0;layer<3;layer++){ctx.fillStyle=layer===0?(red?'#fc315023':'#ffa74b23'):layer===1?(red?'#f7607470':'#ffd38185'):'#fff7d5d0';ctx.beginPath();
    for(let side=0;side<2;side++)for(let j=0;j<=n;j++){const i=side?n-j:j,p=i===n?tip:points[start+i],prev=points[Math.max(start,start+i-1)]||p,next=points[start+i+1]||tip,dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1,half=width*(layer===0?.95:layer===1?.325:.08)*(i/n)*(side?-1:1),x=p.x-dy/len*half,y=p.y+dx/len*half;
      if(side===0&&j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    ctx.closePath();ctx.fill();}
  ctx.restore();
}
function lushVfxShards(x,y,r,age,life,seed=0,major=false,red=false){
  const p=lushVfxClamp(age/life),out=1-p,count=major?32:14;if(p<=0||out<=0)return;
  // Identical transformed shards, batched by their two opacities and two line widths.
  // No per-shard save/rotate/fill: dense Royal Flush chains retain every fragment.
  for(let i=0;i<count;i++){const a=i*2.399963+seed*.17,spread=.32+(i%7)*.10,d=r*lushVfxEase(p)*spread,xx=x+Math.cos(a)*d,yy=y+Math.sin(a)*d+45*p*p;
    const q=i*8,rotation=a+p*(i%2?4:-5),rr=(4+i%5)*out;lushVfxShardWork[q]=xx;lushVfxShardWork[q+1]=yy;lushVfxShardWork[q+2]=Math.cos(rotation)*rr;lushVfxShardWork[q+3]=Math.sin(rotation)*rr;lushVfxShardWork[q+4]=xx-Math.cos(a)*(10+24*out);lushVfxShardWork[q+5]=yy-Math.sin(a)*(10+24*out);
  }
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=red?'#ff6a94':'#ffeac0';
  for(let bright=0;bright<2;bright++){ctx.globalAlpha=out*(bright?.95:.65);
    for(let thick=0;thick<2;thick++){ctx.lineWidth=thick?1.8:.9;ctx.beginPath();for(let i=0;i<count;i++)if((i%3===0)===!!bright&&(i%4===0)===!!thick){const q=i*8;ctx.moveTo(lushVfxShardWork[q+4],lushVfxShardWork[q+5]);ctx.lineTo(lushVfxShardWork[q],lushVfxShardWork[q+1]);}ctx.stroke();}
    ctx.fillStyle=bright?'#fff9e6':red?'#f35c8490':'#f8c78590';ctx.beginPath();
    for(let i=0;i<count;i++)if((i%3===0)===!!bright){const q=i*8,xx=lushVfxShardWork[q],yy=lushVfxShardWork[q+1],c=lushVfxShardWork[q+2],s=lushVfxShardWork[q+3];ctx.moveTo(xx-c*.5+s,yy-s*.5-c);ctx.lineTo(xx+c*.65+s*.4,yy+s*.65-c*.4);ctx.lineTo(xx+c*.3-s,yy+s*.3+c);ctx.lineTo(xx-c*.6-s*.35,yy-s*.6+c*.35);ctx.closePath();}ctx.fill();
  }ctx.restore();
}
function lushVfxShock(x,y,r,progress,alpha=1,red=false){
  const p=lushVfxClamp(progress),out=1-p,rr=r*lushVfxEase(p);if(rr<1)return;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha*out;ctx.translate(x,y);
  for(let layer=0;layer<3;layer++){ctx.strokeStyle=layer===0?(red?'#ff477947':'#ffa35047'):layer===1?(red?'#ff8dadb0':'#ffe2a7b0'):'#fff9d7';ctx.lineWidth=layer===0?13*out+2:layer===1?3:1;ctx.beginPath();ctx.ellipse(0,0,rr*(1-layer*.022),rr*(.68-layer*.014),0,0,LUSH_TAU);ctx.stroke();}
  for(let k=0;k<8;k++){const a=k*Math.PI/4+progress*.18;ctx.strokeStyle=red?'#ff7b9a':'#ffe5aa';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,rr*.85,a,a+.25);ctx.stroke();}ctx.restore();
}
function lushVfxLance(x,y,a,length,width,alpha=1,red=false){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;
  for(let j=0;j<3;j++){const w=width*(1-j*.31);ctx.fillStyle=j===0?(red?'#e22c5525':'#eda43e23'):j===1?(red?'#ff729968':'#ffd99178'):'#fff8d7bd';ctx.beginPath();ctx.moveTo(-length,0);ctx.quadraticCurveTo(-length*.23,-w,0,-w*.18);ctx.lineTo(width*.75,0);ctx.lineTo(0,w*.18);ctx.quadraticCurveTo(-length*.23,w,-length,0);ctx.fill();}ctx.restore();
}
function lushVfxBurstRays(e,p,out,r,seed,count){
  const radius=r*(.1+lushVfxEase(p)*.55),length=r*.42,width=16+35*out;
  for(let i=0;i<count;i++){const a=i*LUSH_TAU/count+seed*.03,c=Math.cos(a),s=Math.sin(a),q=i*4;lushVfxRayWork[q]=e.x+c*radius;lushVfxRayWork[q+1]=e.y+s*radius;lushVfxRayWork[q+2]=c;lushVfxRayWork[q+3]=s;}
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=out*.58;
  for(let color=0;color<2;color++)for(let layer=0;layer<3;layer++){const red=!!color,w=width*(1-layer*.31);ctx.fillStyle=layer===0?(red?'#e22c5525':'#eda43e23'):layer===1?(red?'#ff729968':'#ffd99178'):'#fff8d7bd';ctx.beginPath();
    for(let i=0;i<count;i++)if((i%3===0)===red){const q=i*4,x=lushVfxRayWork[q],y=lushVfxRayWork[q+1],c=lushVfxRayWork[q+2],s=lushVfxRayWork[q+3];ctx.moveTo(x-length*c,y-length*s);ctx.quadraticCurveTo(x-length*.23*c+w*s,y-length*.23*s-w*c,x+w*.18*s,y-w*.18*c);ctx.lineTo(x+width*.75*c,y+width*.75*s);ctx.lineTo(x-w*.18*s,y+w*.18*c);ctx.quadraticCurveTo(x-length*.23*c-w*s,y-length*.23*s+w*c,x-length*c,y-length*s);ctx.closePath();}ctx.fill();
  }ctx.restore();
}
function lushVfxRoyalCast(e,p){
  const a=e.angle??e.a??lushState.lastAngle??lushAim(),out=1-p,reach=200+lushVfxEase(p)*240;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=out*.65;
  ctx.strokeStyle='#ebac63';ctx.lineWidth=1.3;for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-25,sign*42);ctx.bezierCurveTo(55,sign*64,160,sign*24,reach,sign*26);ctx.stroke();}
  for(let i=0;i<6;i++){const xx=22+i*46+e.age*2;ctx.strokeStyle=i%2?'#f3c67b66':'#ffefbfa0';ctx.beginPath();ctx.moveTo(xx-12,-12);ctx.lineTo(xx,0);ctx.lineTo(xx-12,12);ctx.stroke();}ctx.restore();
  for(let i=0;i<5;i++){const spread=(i-2)*.20,rr=42+p*30;lushVfxCard(e.x+Math.cos(a+spread)*rr,e.y+Math.sin(a+spread)*rr,a+Math.PI/2+spread,22+5*p,i,i%2,out*.7);}
  lushVfxFlare(e.x,e.y,80,out*.6);
}
function lushVfxMarkedEnemies(){
  for(const z of zombies){if(!(z.lushMarks>0)||z.hp<=0||z.lushMarkUntil<lushState.frame)continue;const n=Math.min(4,z.lushMarks),r=(z.r||18)+10;
    if(!lushVfxVisible(z.x,z.y,r+35))continue;
    ctx.save();ctx.globalAlpha=.8;for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.45-Math.PI/2;lushVfxCard(z.x+Math.cos(a)*r,z.y+Math.sin(a)*r,0,12,i,i%2,.85);}ctx.restore();}
}
function lushVfxVisible(x,y,r=100){
  const scale=typeof getWorldViewScale==='function'?getWorldViewScale():1;
  return x+r>=camera.x&&y+r>=camera.y&&x-r<=camera.x+canvas.width/scale&&y-r<=camera.y+canvas.height/scale;
}
function lushVfxDealer(d,index,u){
  const age=u.age,t=lushState.frame,bob=Math.sin(age*.035+index)*6,fade=lushVfxClamp(age/30)*(u.resolved?1-lushVfxClamp((u.finaleAge||0)/60):1);if(fade<=0)return;
  const x=d.x,y=d.y+bob,height=115,width=height*.74;
  ctx.save();ctx.globalAlpha=fade;lushGlow(x,y-35,100,.18);ctx.strokeStyle='#eac78877';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.ellipse(x,y+35,46,14,t*.004,0,LUSH_TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(x-38,y+23);ctx.lineTo(x-44,y-72);ctx.lineTo(x,y-93);ctx.lineTo(x+44,y-72);ctx.lineTo(x+38,y+23);ctx.stroke();
  // A translucent dealer is a silhouette, not an opaque extra player sprite.
  if(!lushVfxSprite('vfx-dealer',x,y-24,width,height,0,.72)){const im=ensureGameImage(lushArt.body);if(im.complete&&im.naturalWidth){ctx.globalAlpha=fade*.5;ctx.drawImage(im,x-width/2,y-height*.8,width,height);ctx.globalAlpha=fade;}}
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffdd9580';ctx.lineWidth=.8;
  for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x-30+j*30,y+31);ctx.bezierCurveTo(x-45+j*30,y+53,x+22-j*12,y+58,x+Math.sin(t*.03+index+j)*20,y+70);ctx.stroke();}
  ctx.restore();
  for(let j=0;j<3;j++){const a=(j-1)*.33+Math.sin(t*.015+index)*.07;lushVfxCard(x+(j-1)*19,y+12-Math.abs(j-1)*4,a,18,3+j%2,index%2,fade*.8);}
}
function lushVfxCasino(){
  const u=lushState.ultimate;if(!u)return;const t=lushState.frame,fade=lushVfxClamp(u.age/40)*(u.resolved?1-lushVfxClamp((u.finaleAge||0)/110):1),radius=530;
  ctx.save();ctx.globalAlpha=fade*.60;ctx.translate(player.x,player.y);ctx.rotate(t*.0009);ctx.drawImage(lushVfxFloor(),-radius,-radius,radius*2,radius*2);ctx.restore();
  lushVfxSprite('vfx-sigil',player.x,player.y,650,650,-t*.0005,fade*.14,true);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade;
  // Narrow travelling light curtains leave the centre and enemy silhouettes readable.
  for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.004;ctx.save();ctx.translate(player.x,player.y);ctx.rotate(a);ctx.fillStyle=i%2?'#d2315314':'#edbb5a17';ctx.beginPath();ctx.moveTo(90,-3);ctx.lineTo(radius,-46);ctx.quadraticCurveTo(radius+10,0,radius,46);ctx.lineTo(90,3);ctx.closePath();ctx.fill();ctx.strokeStyle='#f6d99445';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(110,0);ctx.lineTo(radius,0);ctx.stroke();ctx.restore();}
  for(let i=0;i<16;i++){const a=i*LUSH_TAU/16+t*.0017,r=430+Math.sin(t*.02+i)*24;lushDiamond(player.x+Math.cos(a)*r,player.y+Math.sin(a)*r,3+(i%3),'#ffe8b5a0',a+t*.016);}
  ctx.restore();
  const dealers=u.dealers||Array.from({length:4},(_,i)=>({x:player.x+Math.cos(i*Math.PI/2+.7)*175,y:player.y+Math.sin(i*Math.PI/2+.7)*175}));
  dealers.forEach((d,i)=>lushVfxDealer(d,i,u));
  if((u.force777||u.jackpot)&&!u.resolved){for(let i=0;i<3;i++)lushVfxFlare(player.x+(i-1)*38,player.y-224,32,.3+Math.sin(t*.08+i)*.08);}
}
function lushVfxChipStorm(storm){
  const p=lushVfxClamp(storm.age/(storm.life||72)),expand=Math.sin(p*Math.PI),radius=storm.currentRadius??storm.radius*expand,count=24+lushVfxTier()*4,spin=storm.age*.075;
  lushVfxShock(storm.x,storm.y,storm.radius,Math.min(1,p*2),.65);
  for(let i=0;i<count;i++){const a=i*LUSH_TAU/count+spin,r=radius+(i%3-1)*8*expand,x=storm.x+Math.cos(a)*r,y=storm.y+Math.sin(a)*r;
    const tx=storm.x+Math.cos(a-.12)*r*.94,ty=storm.y+Math.sin(a-.12)*r*.94;
    lushVfxRibbon([{x:tx,y:ty},{x:(tx+x)/2,y:(ty+y)/2}],{x,y},8,i%4===0,.8);
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(1,.72);ctx.fillStyle=i%3?'#e7c07a':'#932b49';ctx.strokeStyle='#fff0bc';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,8+i%3,0,LUSH_TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#fff1c666';ctx.beginPath();ctx.arc(0,0,5+i%3,0,LUSH_TAU);ctx.stroke();ctx.restore();
  }
  if(p>.75)lushVfxFlare(storm.x,storm.y,100,Math.sin((p-.75)*4*Math.PI)*.6);
}
function lushVfxEvent(e){
  if(e.delay>0)return;const life=e.maxLife||48,p=lushVfxClamp(e.age/life),out=1-p,r=e.r||90,seed=e.seed||0,type=e.type;
  if(type==='royalCast'){lushVfxRoyalCast(e,p);return;}
  if(type==='royalMark'){lushVfxFlare(e.x,e.y,35,out*.7);return;}
  if(type==='hit'||type==='ace'||type==='dealerVolley'){
    const major=type!=='hit';lushVfxFlare(e.x,e.y,major?80:40,out*.8);if(major)lushVfxLance(e.x,e.y,e.angle??e.a??0,100+90*p,25,out*.7);lushVfxShards(e.x,e.y,major?90:40,e.age,life,seed,false);return;
  }
  if(type==='wager'||type==='cast'){
    lushVfxShock(e.x,e.y,r,p,.65);for(let i=0;i<8;i++){const a=i*Math.PI/4-p;lushDiamond(e.x+Math.cos(a)*r*(1-p*.8),e.y+Math.sin(a)*r*(1-p*.8),5*out,'#f6ce80',a);}return;
  }
  if(type==='giantDrop')return; // The scheduled finisher draws its unambiguous arrival telegraph.
  if(type==='assetTier'){
    for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.22;lushVfxLance(e.x+Math.cos(a)*40,e.y+Math.sin(a)*40,a,130,22,Math.sin(p*Math.PI)*.5);lushVfxCard(e.x+Math.cos(a)*(70+p*40),e.y+Math.sin(a)*(70+p*40),a+Math.PI/2,25,i,i%2,out);}
    lushVfxShock(e.x,e.y,180,p,.8);return;
  }
  const red=type==='loss',major=['jackpot','house','six','cascade','royalDetonate','finishFracture'].includes(type),impact=p<.14?Math.sin(p/.14*Math.PI):0;
  lushGlow(e.x,e.y,Math.max(25,r*.6),out*(major?.24:.12),red?'red':'gold');
  if(type==='pulse'){
    lushVfxShock(e.x,e.y,r,p,.95);lushVfxShards(e.x,e.y,r*.9,e.age,life,seed,false);lushVfxFlare(e.x,e.y,70,out*.5);return;
  }
  if(type==='cash'||type==='chipStorm'){
    lushVfxShock(e.x,e.y,r,p,.75);if(type==='cash')lushVfxFlare(e.x,e.y,90,out*.6);return;
  }
  if(type==='win'||type==='reel'){
    for(let i=0;i<6;i++){const a=i*Math.PI/3+p*.5;lushVfxCard(e.x+Math.cos(a)*r*lushVfxEase(p),e.y+Math.sin(a)*r*lushVfxEase(p),a+p,18+8*out,i%5,i%2,out*.9);}
    lushVfxShock(e.x,e.y,r,p,.6);lushVfxFlare(e.x,e.y,120,out*.6);return;
  }
  if(major||red){
    lushVfxShock(e.x,e.y,r,p,major?1:.7,red);lushVfxShards(e.x,e.y,r,e.age,life,seed,major,red);
    if(major){lushVfxShock(e.x,e.y,r*.78,lushVfxClamp(p*1.2-.13),.75);lushVfxFlare(e.x,e.y,r*.62,impact*.65);
      const bloom=Math.sin(lushVfxClamp(p*2.8)*Math.PI);
      if(bloom>0){lushVfxSprite('vfx-shatter',e.x,e.y,r*(.6+lushVfxEase(p)*.9),r*(.6+lushVfxEase(p)*.9),seed*.17,bloom*.55);lushVfxSprite('vfx-burst',e.x,e.y,r*(.35+p*.7),r*(.35+p*.7),seed*.19,impact*.65,true);}
      lushVfxBurstRays(e,p,out,r,seed,type==='jackpot'?12:8);
      if(type==='royalDetonate'){for(let i=0;i<5;i++){const a=i*LUSH_TAU/5+p*.35;lushVfxCard(e.x+Math.cos(a)*r*p*.75,e.y+Math.sin(a)*r*p*.75,a+p,30+12*out,i,i%2,out*.9);}}
      if(type==='six'&&p<.48)lushVfxDie(e.x,e.y-(1-lushVfxEase(p/.48))*120,65+25*p,6,-.12,true,(1-p/.48)*.9);
      if(type==='jackpot'||type==='finishFracture'){
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffdf9e';ctx.lineWidth=1.5;ctx.globalAlpha=out*.8;
        for(let i=0;i<9;i++){const a=i*2.39996+seed,reach=r*lushVfxEase(p);ctx.beginPath();ctx.moveTo(e.x,e.y);for(let j=1;j<=4;j++){const aa=a+Math.sin(i*17+j)*.07;ctx.lineTo(e.x+Math.cos(aa)*reach*j/4,e.y+Math.sin(aa)*reach*j/4);}ctx.stroke();}ctx.restore();
      }
    }return;
  }
  lushVfxShock(e.x,e.y,r,p,.5);
}
function drawLushEffects(){
  if(selectedCharacter!=='lush')return;const s=lushState;worldStart();ctx.save();
  lushVfxCasino();
  for(const h of s.hazards||[]){const p=lushVfxClamp(h.age/60);ctx.save();ctx.globalAlpha=.65;ctx.strokeStyle='#ff416d';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,LUSH_TAU);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,h.r,-Math.PI/2,-Math.PI/2+LUSH_TAU*p);ctx.stroke();ctx.restore();}
  for(const f of s.finishers||[]){if(f.age>=0||!lushVfxVisible(f.x,f.y,f.radius+220))continue;const p=1-lushVfxClamp(-f.age/Math.max(1,f.delay||30));lushVfxShock(f.x,f.y,f.radius,p,.45);if(f.type==='die'||f.kind==='die'){const y=f.y-260*(1-p),size=48+60*p;lushVfxLance(f.x,y,-Math.PI/2,170,25,p*.55);lushVfxDie(f.x,y,size,6,-.13+(1-p)*.4,true,.35+p*.65);}}
  for(const storm of s.chipStorms||[])lushVfxChipStorm(storm);
  for(const c of s.cards){if(!lushVfxVisible(c.x,c.y,150))continue;const royal=c.kind==='royal',ricochet=c.kind==='ricochet',ace=c.kind==='ace'||c.kind==='finisher',dealer=c.kind==='dealer',size=royal?37:ace?32:ricochet?20:dealer?19:17,red=(c.suit||0)%2===1;
    lushVfxRibbon(c.trail,c,royal?23:ace?18:10,red,royal?.95:.78);
    if(royal||ace){lushVfxLance(c.x,c.y,c.a,royal?120:75,royal?18:12,.6,red);lushVfxFlare(c.x,c.y,royal?65:42,.45);}
    if(ricochet){lushVfxFlare(c.x,c.y,30,.28);const tail=c.trail||[];for(let k=3;k<tail.length;k+=4){const p=tail[k];lushDiamond(p.x,p.y,1.6,'#fff0cba8',c.a+k*.5);}}
    lushVfxCard(c.x,c.y,c.a+Math.PI/2,size,c.rank??(ace?4:0),c.suit<0?0:c.suit??0,1);
    if(royal){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#fff0b4aa';ctx.lineWidth=1;ctx.translate(c.x,c.y);ctx.rotate(c.a);for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-95,sign*19);ctx.quadraticCurveTo(-30,sign*29,20,sign*12);ctx.stroke();}ctx.restore();}
  }
  for(const d of s.dice){if(!lushVfxVisible(d.x,d.y,140))continue;const moving=d.travel<(d.range||500),size=d.giant?82:d.golden?61:51,bounce=moving?Math.abs(Math.sin(d.age*.17))*17:Math.sin(d.age*.055)*3;
    lushGlow(d.x,d.y,size*1.3,.22);if(moving){lushVfxLance(d.x,d.y,d.a,100,size*.35,.45,d.golden!==true);for(let i=3;i>0;i--)lushVfxDie(d.x-Math.cos(d.a)*i*19,d.y-Math.sin(d.a)*i*19-bounce,size*(1-i*.08),d.eye,d.age*.075,d.golden,.055*(4-i));}
    lushVfxDie(d.x,d.y-8-bounce,size,d.eye,moving?d.age*.075:Math.sin(d.age*.02)*.08,!!d.golden);lushVfxFlare(d.x-size*.28,d.y-size*.56-bounce,26,.58);
  }
  lushVfxMarkedEnemies();
  for(const e of s.effects)if(lushVfxVisible(e.x,e.y,(e.r||100)+200))lushVfxEvent(e);
  ctx.restore();worldEnd();
}
const lushPrestigePlayerBase=drawLushPlayer;
drawLushPlayer=function(){
  worldStart();const s=lushState,t=s.frame,tier=lushVfxTier();ctx.save();
  if(s.shield>0){const r=43+Math.sin(t*.045)*1.2;ctx.globalAlpha=.65;ctx.strokeStyle='#ffe7ab';ctx.lineWidth=1.1;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.003,x=player.x+Math.cos(a)*r,y=player.y-17+Math.sin(a)*r*1.17;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();ctx.globalAlpha=1;for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.012;lushVfxFlare(player.x+Math.cos(a)*r,player.y-17+Math.sin(a)*r,23,.4);}}
  if(tier>0){const aim=lushAim();for(let i=0;i<tier+2;i++){const a=aim+Math.PI+(i-(tier+1)/2)*.24,rr=56+Math.sin(t*.025+i)*3;lushVfxCard(player.x+Math.cos(a)*rr,player.y+Math.sin(a)*rr-22,a-Math.PI/2,20,i%5,i%2,.75);}}
  ctx.restore();worldEnd();lushPrestigePlayerBase();
};
const lushPrestigeRealmBase=drawLushRealm;
drawLushRealm=function(){
  lushPrestigeRealmBase();if(selectedCharacter!=='lush'||!lushState.realm)return;
  // The atmosphere moves independently from the floor without repainting opaque world fog.
  const t=lushState.frame,alpha=lushState.realm;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*.40;
  for(let i=0;i<20;i++){const x=((i*173.73+t*(.08+i%3*.035))%(canvas.width+60))-30,y=canvas.height-((t*(.19+i%4*.035)+i*83.71)%(canvas.height+40));lushDiamond(x,y,1.1+i%3*.5,i%3?'#ffd99388':'#ff638866',t*.013+i);}
  ctx.restore();
};
