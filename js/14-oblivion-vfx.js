// Obsidian, hairline crimson fractures and white-hot edges. Reusable textures are
// baked once; all motion follows simulation frames, with no render-time particles.
const OBLIVION_VFX_TAU=Math.PI*2;
const oblivionCombatVfxCache=new Map();
const oblivionCombatVfxWork=new Float64Array(28*6);
function oblivionVfxClamp01(v){return Math.max(0,Math.min(1,v));}
function oblivionVfxEaseOut(v){v=oblivionVfxClamp01(v);return 1-(1-v)**3;}
function oblivionVfxSmooth(v){v=oblivionVfxClamp01(v);return v*v*(3-2*v);}
function oblivionVfxReady(im){if(im&&typeof ensureGameImage==='function')ensureGameImage(im);return !!(im?.complete&&im.naturalWidth>0&&im.naturalHeight>0);}
function oblivionVfxMonster(){return typeof oblivionCombatArt==='undefined'?null:oblivionCombatArt.monster;}
function oblivionVfxVisible(x,y,r=100){
  const scale=typeof getWorldViewScale==='function'?getWorldViewScale():1;
  return x+r>=camera.x&&y+r>=camera.y&&x-r<=camera.x+canvas.width/scale&&y-r<=camera.y+canvas.height/scale;
}
function oblivionCombatTexture(key){
  if(oblivionCombatVfxCache.has(key))return oblivionCombatVfxCache.get(key);
  const c=document.createElement('canvas');c.width=c.height=key==='hand'?512:256;
  const g=c.getContext('2d'),n=c.width,q=n/2;
  if(key==='flare'||key==='haze'){
    const grad=g.createRadialGradient(q,q,0,q,q,q);
    if(key==='flare'){grad.addColorStop(0,'#fffdf4');grad.addColorStop(.025,'#fff3e4');grad.addColorStop(.10,'#ffb0a4a0');grad.addColorStop(.28,'#ff2b503b');}
    else{grad.addColorStop(0,'#ec244d4d');grad.addColorStop(.30,'#aa123138');grad.addColorStop(.60,'#560e2220');}
    grad.addColorStop(1,'#e6254900');g.fillStyle=grad;g.fillRect(0,0,n,n);
    if(key==='flare'){g.translate(q,q);g.fillStyle='#fff0dce0';g.beginPath();g.moveTo(-q,0);g.quadraticCurveTo(-5,-2,0,-q*.36);g.quadraticCurveTo(2,-3,q,0);g.quadraticCurveTo(3,2,0,q*.36);g.quadraticCurveTo(-2,3,-q,0);g.fill();}
  }else if(key==='hand'){
    // A fully shaded claw is cached once and articulated by its wrist at runtime.
    g.translate(q,q);g.scale(1.12,1.12);g.lineJoin='bevel';
    const material=g.createLinearGradient(-170,-80,150,75);material.addColorStop(0,'#07070cee');material.addColorStop(.4,'#191521');material.addColorStop(.63,'#302129');material.addColorStop(1,'#07090f');
    g.fillStyle=material;g.strokeStyle='#8b2440';g.lineWidth=2;
    g.beginPath();g.moveTo(-213,-54);g.lineTo(-120,-70);g.lineTo(-63,-63);g.lineTo(-30,-90);g.lineTo(42,-83);g.lineTo(82,-35);g.lineTo(77,41);g.lineTo(30,84);g.lineTo(-65,79);g.lineTo(-127,57);g.lineTo(-213,61);g.closePath();g.fill();g.stroke();
    for(let i=0;i<4;i++){
      const y=-74+i*42,reach=137+(i===1?48:i===2?35:i===0?5:0),bend=y*.55;
      g.fillStyle=material;g.beginPath();g.moveTo(16,y-14);g.lineTo(76,y-25);g.lineTo(reach-24,bend-19);g.lineTo(reach+25,bend+9);g.lineTo(reach+38,bend+51);g.lineTo(reach-2,bend+22);g.lineTo(reach-34,bend+13);g.lineTo(70,y+7);g.lineTo(10,y+13);g.closePath();g.fill();g.stroke();
      g.strokeStyle=i===1?'#fff0dc':'#fb5a75';g.lineWidth=i===1?1.8:1.2;g.beginPath();g.moveTo(70,y-21);g.lineTo(reach-25,bend-14);g.lineTo(reach+22,bend+12);g.lineTo(reach+35,bend+46);g.stroke();g.strokeStyle='#8b2440';
      g.fillStyle='#e8506640';g.beginPath();g.moveTo(37,y-7);g.lineTo(91,y-12);g.lineTo(reach-31,bend);g.lineTo(77,y+1);g.closePath();g.fill();
    }
    g.fillStyle=material;g.beginPath();g.moveTo(-53,40);g.lineTo(-5,73);g.lineTo(45,107);g.lineTo(86,99);g.lineTo(129,67);g.lineTo(103,124);g.lineTo(54,151);g.lineTo(-10,127);g.lineTo(-70,80);g.closePath();g.fill();g.stroke();
    g.strokeStyle='#ef4a6b';g.lineWidth=1.2;g.beginPath();g.moveTo(-171,-32);g.lineTo(-117,-17);g.lineTo(-86,-38);g.lineTo(-33,-11);g.lineTo(-7,33);g.lineTo(28,43);g.moveTo(-116,-17);g.lineTo(-100,25);g.lineTo(-49,45);g.lineTo(-34,71);g.moveTo(-33,-11);g.lineTo(8,-36);g.lineTo(40,-35);g.stroke();
    g.strokeStyle='#fff0d5';g.lineWidth=1.1;g.beginPath();g.moveTo(-32,-12);g.lineTo(-7,31);g.lineTo(24,42);g.stroke();
    g.fillStyle='#fff2cf';g.beginPath();g.moveTo(-18,-5);g.lineTo(1,10);g.lineTo(-2,31);g.lineTo(-17,18);g.closePath();g.fill();
  }else if(key==='seal'){
    g.translate(q,q);g.lineWidth=1;g.strokeStyle='#fa5e7760';
    for(let j=0;j<3;j++){const r=93-j*15;g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+.5236;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.stroke();}
    g.strokeStyle='#ffd8bcaa';
    for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);g.beginPath();g.moveTo(25,0);g.lineTo(42,-5);g.lineTo(62,0);g.lineTo(83,-9);g.lineTo(112,0);g.moveTo(62,0);g.lineTo(81,9);g.stroke();g.restore();}
  }
  oblivionCombatVfxCache.set(key,c);return c;
}
function oblivionCombatBloom(x,y,r,alpha=1,haze=false){
  if(!(r>0&&alpha>0))return;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;
  ctx.drawImage(oblivionCombatTexture(haze?'haze':'flare'),x-r,y-r,r*2,r*2);ctx.restore();
}
function oblivionCombatShard(x,y,r,a=0,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;
  ctx.fillStyle='#08070e';ctx.strokeStyle='#fa4668';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(r*1.7,0);ctx.lineTo(-r*.6,-r*.4);ctx.lineTo(-r*1.2,r*.12);ctx.lineTo(-r*.4,r*.43);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ef4b6870';ctx.beginPath();ctx.moveTo(r*1.55,0);ctx.lineTo(-r*.6,-r*.3);ctx.lineTo(-r*.12,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffe6d3';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-r*.6,-r*.32);ctx.lineTo(r*1.55,0);ctx.stroke();ctx.restore();
}
function oblivionCombatFragments(x,y,r,p,alpha=1,seed=0,count=18,inward=false){
  p=oblivionVfxClamp01(p);if(p>=1||alpha<=0)return;count=Math.min(28,count);
  const out=1-p,travel=inward?1-oblivionVfxEaseOut(p):oblivionVfxEaseOut(p);
  for(let i=0;i<count;i++){
    const a=i*2.399963+seed*.33,d=r*(.3+i%7*.105)*travel,rr=(4+i%4*1.8)*(inward?.5+p*.5:out),q=i*6;
    oblivionCombatVfxWork[q]=x+Math.cos(a)*d;oblivionCombatVfxWork[q+1]=y+Math.sin(a)*d;
    oblivionCombatVfxWork[q+2]=Math.cos(a+p*3)*rr;oblivionCombatVfxWork[q+3]=Math.sin(a+p*3)*rr;
    oblivionCombatVfxWork[q+4]=Math.cos(a)*(12+20*out);oblivionCombatVfxWork[q+5]=Math.sin(a)*(12+20*out);
  }
  ctx.save();ctx.globalAlpha*=alpha*out;ctx.fillStyle='#0b0811';ctx.strokeStyle='#ea4261';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<count;i++){const q=i*6,x0=oblivionCombatVfxWork[q],y0=oblivionCombatVfxWork[q+1],c=oblivionCombatVfxWork[q+2],s=oblivionCombatVfxWork[q+3];ctx.moveTo(x0+c*1.7,y0+s*1.7);ctx.lineTo(x0-s*.55,y0+c*.55);ctx.lineTo(x0-c,y0-s);ctx.lineTo(x0+s*.4,y0-c*.4);ctx.closePath();}ctx.fill();ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffc5b7';ctx.lineWidth=.85;ctx.beginPath();
  for(let i=0;i<count;i++){const q=i*6,x0=oblivionCombatVfxWork[q],y0=oblivionCombatVfxWork[q+1];ctx.moveTo(x0,y0);ctx.lineTo(x0-oblivionCombatVfxWork[q+4],y0-oblivionCombatVfxWork[q+5]);}ctx.stroke();ctx.restore();
}
function oblivionCombatShock(x,y,r,p,alpha=1){
  p=oblivionVfxClamp01(p);const rr=r*oblivionVfxEaseOut(p),out=1-p;if(rr<1||out<=0)return;
  ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=out*alpha;
  for(let j=0;j<3;j++){ctx.strokeStyle=j===0?'#e62e4935':j===1?'#fa627bb0':'#ffe9d4';ctx.lineWidth=j===0?12*out+2:j===1?2.4:1;ctx.beginPath();ctx.ellipse(0,0,rr*(1-j*.018),rr*(.62-j*.012),-.08,0,OBLIVION_VFX_TAU);ctx.stroke();}ctx.restore();
}
function oblivionCombatCracks(x,y,r,alpha=1,seed=0,count=9){
  if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle='#e94c6c';ctx.lineWidth=1.15;ctx.beginPath();
  for(let i=0;i<count;i++){const a=i*OBLIVION_VFX_TAU/count+seed*.41,c=Math.cos(a),s=Math.sin(a),d=r*(.7+(i%3)*.13),k=i%2?1:-1;
    ctx.moveTo(x+c*d*.12,y+s*d*.12);ctx.lineTo(x+c*d*.35-s*d*.07*k,y+s*d*.35+c*d*.07*k);ctx.lineTo(x+c*d*.62+s*d*.04*k,y+s*d*.62-c*d*.04*k);ctx.lineTo(x+c*d,y+s*d);ctx.moveTo(x+c*d*.62+s*d*.04*k,y+s*d*.62-c*d*.04*k);ctx.lineTo(x+c*d*.78-s*d*.17*k,y+s*d*.78+c*d*.17*k);
  }ctx.stroke();ctx.restore();
}
function oblivionCombatRibbon(points,tip,width=12,alpha=1){
  if(!points?.length)return;const start=Math.max(0,points.length-10),n=points.length-start;
  ctx.save();ctx.globalAlpha*=alpha;ctx.globalCompositeOperation='lighter';
  for(let layer=0;layer<3;layer++){
    ctx.fillStyle=layer===0?'#e3244a28':layer===1?'#ff496b9c':'#fff0d9d9';ctx.beginPath();
    for(let side=0;side<2;side++)for(let j=0;j<=n;j++){
      const i=side?n-j:j,p=i===n?tip:points[start+i],prev=points[Math.max(start,start+i-1)]||p,next=points[start+i+1]||tip,dx=next.x-prev.x,dy=next.y-prev.y,l=Math.hypot(dx,dy)||1,w=width*(layer===0?1:layer===1?.32:.08)*(i/n)*(side?-1:1);
      const x=p.x-dy/l*w,y=p.y+dx/l*w;if(!side&&!j)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }ctx.closePath();ctx.fill();
  }ctx.restore();
}
function oblivionCombatClawTexture(){
  const im=oblivionVfxMonster();if(!oblivionVfxReady(im))return oblivionCombatTexture('hand');
  if(oblivionCombatVfxCache.has('monster-claw'))return oblivionCombatVfxCache.get('monster-claw');
  // Reuse the transformed body's actual left talon, retaining its transparent
  // silhouette, obsidian material and engraved fissures at every spell scale.
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
  g.translate(256,256);g.rotate(-Math.PI/2);
  // Trace only the detached forearm and fingers; the neighbouring coat in the
  // source must never become a rectangular piece of scenery around the claw.
  const outline=[[70,10],[110,40],[147,69],[193,87],[220,132],[220,169],[193,144],[156,126],[154,158],[183,205],[226,253],[180,240],[146,221],[146,238],[170,270],[214,291],[178,292],[138,272],[117,245],[117,272],[159,313],[123,310],[87,284],[59,246],[50,195],[23,168],[16,135],[27,92],[40,51]];
  g.beginPath();outline.forEach((p,i)=>{const x=-148+p[0]/236*296,y=-220+p[1]/357*440;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();
  g.drawImage(im,im.naturalWidth*.075,im.naturalHeight*.29,im.naturalWidth*.315,im.naturalHeight*.31,-148,-220,296,440);
  const fade=g.createLinearGradient(0,-220,0,-133);fade.addColorStop(0,'#ffffff00');fade.addColorStop(1,'#ffffffff');g.globalCompositeOperation='destination-in';g.fillStyle=fade;g.fillRect(-256,-256,512,512);
  oblivionCombatVfxCache.set('monster-claw',c);return c;
}
function oblivionCombatClaw(x,y,a,size,alpha=1,stretch=1){
  if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(a);ctx.scale(stretch,1);ctx.drawImage(oblivionCombatClawTexture(),-size,-size,size*2,size*2);ctx.restore();
}
function oblivionCombatSlash(e){
  const p=oblivionVfxClamp01(e.age/(e.maxLife||24)),out=1-p;if(out<=0)return;
  const r=e.r||260,a=e.a||0,sweep=oblivionVfxEaseOut(p),echo=e.echo?.58:1;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a-.24+sweep*.42);ctx.globalAlpha*=out*echo;ctx.lineJoin='round';
  // Three broad, asymmetric claw ribbons; the filled dark cut stays visibly hollow.
  for(let i=0;i<3;i++){
    const y=(i-1)*r*.20,start=r*(.04+i*.07),end=r*(.99-i*.045),w=r*(.085-i*.012)*Math.sin(Math.PI*Math.min(.98,.18+sweep*.8));
    for(let layer=0;layer<3;layer++){
      const ww=w*(1-layer*.37);ctx.fillStyle=layer===0?'#ef234434':layer===1?'#ce233cc9':'#ffe4cddd';ctx.globalCompositeOperation=layer?'lighter':'source-over';
      ctx.beginPath();ctx.moveTo(start,y-r*.46);ctx.bezierCurveTo(end*.85,y-r*.38,end+ww,y-r*.02,end,y+r*.36);ctx.bezierCurveTo(end-ww,y+r*.02,end*.78,y-r*.31,start,y-r*.46);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#07050bcc';ctx.lineWidth=Math.max(1,w*.16);ctx.beginPath();ctx.moveTo(start,y-r*.46);ctx.bezierCurveTo(end*.85,y-r*.38,end+w*.18,y-r*.02,end,y+r*.36);ctx.stroke();
  }ctx.restore();
  oblivionCombatBloom(e.x+Math.cos(a)*r*.63,e.y+Math.sin(a)*r*.63,82,out*.32*echo);
}
function oblivionCombatTearLine(line,age,closeAt,life,width,alpha=1,finale=false){
  const dx=line.x2-line.x1,dy=line.y2-line.y1,length=Math.hypot(dx,dy);if(length<1)return;
  const a=Math.atan2(dy,dx),opening=oblivionVfxSmooth(age/11),closing=age>closeAt?1-oblivionVfxEaseOut((age-closeAt)/12):1,fade=1-oblivionVfxClamp01((age-closeAt-10)/Math.max(1,life-closeAt-10)),spread=Math.max(.035,opening*closing),n=18,w=width*spread;
  if(fade<=0)return;
  ctx.save();ctx.translate(line.x1,line.y1);ctx.rotate(a);ctx.globalAlpha*=alpha*fade;ctx.lineJoin='bevel';
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.55;ctx.drawImage(oblivionCombatTexture('haze'),0,-width*1.5,length,width*3);ctx.globalAlpha/= .55;
  ctx.globalCompositeOperation='source-over';ctx.fillStyle=finale?'#030207ee':'#08050dcf';ctx.strokeStyle='#ea2b4d';ctx.lineWidth=finale?4:2.6;ctx.beginPath();
  for(let side=0;side<2;side++)for(let j=0;j<=n;j++){
    const i=side?n-j:j,t=i/n,edge=Math.sin(t*Math.PI)**.72,cut=(Math.sin(i*2.17)+Math.sin(i*4.63))*.12*edge,yy=(edge+cut)*w*(side?-1:1),xx=t*length;
    if(!side&&!j)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
  }ctx.closePath();ctx.fill();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ed254127';ctx.lineWidth=finale?17:11;ctx.stroke();
  ctx.strokeStyle='#ff355857';ctx.lineWidth=finale?7:5;ctx.stroke();ctx.strokeStyle='#ed4265';ctx.lineWidth=finale?2.7:1.9;ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffe6d2';ctx.lineWidth=finale?1.8:1;ctx.beginPath();
  for(let j=0;j<=n;j++){const t=j/n,edge=Math.sin(t*Math.PI)**.72,yy=(edge+(Math.sin(j*2.17)+Math.sin(j*4.63))*.12*edge)*w;j?ctx.lineTo(t*length,yy):ctx.moveTo(0,yy);}ctx.stroke();
  // Fine light drifts through the hollow cut, giving depth without a solid beam.
  ctx.strokeStyle='#ef416244';ctx.lineWidth=.8;ctx.beginPath();
  for(let j=0;j<5;j++){const t=(j*.183+age*.007)%1,xx=t*length,yy=Math.sin(t*Math.PI)*w*(j%2?.52:-.48),d=length*.10;ctx.moveTo(xx-d*.5,yy*.65);ctx.quadraticCurveTo(xx,yy,xx+d*.5,yy*.6);}ctx.stroke();
  // Branches are short and fine, leaving the battlefield between cuts readable.
  ctx.strokeStyle='#fb64749a';ctx.lineWidth=1;ctx.beginPath();
  for(let i=1;i<=9;i++){const t=i/10,sg=i%2?1:-1,xx=t*length,yy=Math.sin(t*Math.PI)*w*sg,reach=width*(.4+(i%3)*.17)*opening;
    ctx.moveTo(xx,yy);ctx.lineTo(xx+13,yy+reach*sg*.45);ctx.lineTo(xx-5,yy+reach*sg*.72);ctx.lineTo(xx+21,yy+reach*sg);}
  ctx.stroke();
  // Chips hang at the torn lip, then fall back into the closing dimension.
  const chips=finale?12:7;ctx.globalCompositeOperation='source-over';
  for(let i=0;i<chips;i++){const t=(i+.65)/chips,sg=i%2?1:-1,xx=t*length,yy=sg*(Math.sin(t*Math.PI)*w+11+Math.sin(age*.075+i)*6)*closing;oblivionCombatShard(xx,yy,finale?8+i%3:4+i%3,sg*.45+age*.015,opening*.75);}
  if(age>=closeAt){const flash=1-oblivionVfxClamp01((age-closeAt)/10);ctx.globalAlpha*=flash;ctx.strokeStyle='#ffeed9';ctx.lineWidth=finale?7:3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,0);ctx.stroke();}
  ctx.restore();
  if(age<closeAt){const light=(1-oblivionVfxClamp01(age/Math.max(1,closeAt)))*alpha;oblivionCombatBloom(line.x2,line.y2,finale?110:58,light*.6);}
}
function oblivionCombatGrasp(c){
  const age=c.age,impact=c.impactAt||34,r=c.r||205,echo=c.echo?.56:1;
  const appear=oblivionVfxSmooth(age/12),squeeze=oblivionVfxEaseOut((age-impact+16)/16),fade=1-oblivionVfxClamp01((age-impact)/22),a=c.a||0;
  if(fade>0){
    ctx.save();ctx.translate(c.x,c.y);ctx.rotate(a);ctx.globalAlpha*=appear*fade*echo;
    const offset=r*(1.17-.86*squeeze),size=r*.74;
    oblivionCombatClaw(-offset,-r*.10,.09*(1-squeeze),size,1,1+squeeze*.12);
    oblivionCombatClaw(offset,r*.10,Math.PI+.09*(1-squeeze),size,1,1+squeeze*.12);
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff7c8d80';ctx.lineWidth=1.1;ctx.beginPath();
    for(let i=0;i<4;i++){const yy=(i-1.5)*r*.24;ctx.moveTo(-offset-r*.1,yy);ctx.bezierCurveTo(-r*.25,yy-r*.08,r*.25,yy+r*.08,offset+r*.1,yy);}ctx.stroke();ctx.restore();
    if(age<impact){oblivionCombatBloom(c.x,c.y,r*.7,appear*.23,true);oblivionCombatCracks(c.x,c.y,r*.64,appear*.36,1,6);}
  }
  if(c.empowered){
    const overhead=c.overheadAt||52,start=overhead-18,p=oblivionVfxClamp01((age-start)/18),tail=1-oblivionVfxClamp01((age-overhead)/18);
    if(age>=start&&tail>0){
      const drop=oblivionVfxEaseOut(p),yy=c.y-r*1.40*(1-drop),size=r*(.72+drop*.26);
      ctx.save();ctx.globalAlpha*=tail*echo;
      // The third hand descends from above after the squeeze, with a falling wake.
      ctx.strokeStyle='#ef395947';ctx.lineWidth=3;ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(c.x+i*r*.28,c.y-r*1.75);ctx.lineTo(c.x+i*r*.28,yy-r*.10);}ctx.stroke();
      oblivionCombatClaw(c.x,yy,Math.PI/2,size,oblivionVfxSmooth(p*3),1+drop*.10);ctx.restore();
    }
  }
}
function oblivionCombatCast(c){
  if(c.age<0)return;
  if(c.kind==='grasp'){if(oblivionVfxVisible(c.x,c.y,(c.r||255)*2))oblivionCombatGrasp(c);return;}
  if(c.kind!=='tear'&&c.kind!=='finale')return;
  const finale=c.kind==='finale',lines=c.lines?.length?c.lines:[{x1:c.x,y1:c.y,x2:c.x+Math.cos(c.a||0)*(c.length||1500),y2:c.y+Math.sin(c.a||0)*(c.length||1500)}];
  for(let i=0;i<Math.min(3,lines.length);i++){
    const l=lines[i],cx=(l.x1+l.x2)/2,cy=(l.y1+l.y2)/2,r=Math.hypot(l.x2-l.x1,l.y2-l.y1)/2+(c.width||56)*2;
    if(oblivionVfxVisible(cx,cy,r))oblivionCombatTearLine(l,c.age,c.closeAt||(finale?28:26),c.maxLife||66,c.width||(finale?180:56),c.echo?.5:1,finale);
  }
}
function oblivionCombatImplosion(e,p,out){
  const r=e.r||200,pinch=1-oblivionVfxEaseOut(Math.min(1,p*1.7)),size=Math.max(4,r*.38*pinch);
  oblivionCombatFragments(e.x,e.y,r,p,out,3,24,true);
  ctx.save();ctx.globalAlpha*=out;ctx.fillStyle='#030207';ctx.strokeStyle='#ff4765';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(e.x,e.y,size*.72,size,0,0,OBLIVION_VFX_TAU);ctx.fill();ctx.stroke();
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffe7d7';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(e.x,e.y,size*.8,size*1.07,-.24,-2.5,.9);ctx.stroke();ctx.restore();
  if(p>.46){const hit=(p-.46)/.54;oblivionCombatBloom(e.x,e.y,r*.76,(1-hit)*.8);oblivionCombatShock(e.x,e.y,r*.8,hit,.75);}
}
function oblivionCombatEvent(e){
  if(e.age<0||e.delay>0)return;const p=oblivionVfxClamp01(e.age/(e.maxLife||36)),out=1-p,r=e.r||90,type=e.kind||e.type,alpha=e.echo?.52:1;if(out<=0)return;
  ctx.save();ctx.globalAlpha*=alpha;
  if(type==='slash'){oblivionCombatSlash(e);}
  else if(type==='hit'||type==='shardCast'){
    oblivionCombatBloom(e.x,e.y,type==='hit'?45:60,out*(type==='hit'?.55:.4));
    if(type==='hit')oblivionCombatFragments(e.x,e.y,r,p,.78,e.a||0,6);
  }else if(type==='tearOpen'||type==='graspCast'){
    oblivionCombatBloom(e.x,e.y,85,out*.48);oblivionCombatFragments(e.x,e.y,100,p,.65,e.a||0,10);
  }else if(type==='tearClose'){
    oblivionCombatBloom(e.x,e.y,Math.min(150,r),out*.7);
  }else if(type==='implosion'){oblivionCombatImplosion(e,p,out);}
  else if(type==='graspImpact'||type==='overhead'){
    oblivionCombatCracks(e.x,e.y,r*oblivionVfxEaseOut(p*5),out*.9,type==='overhead'?2:0,11);
    oblivionCombatShock(e.x,e.y,r*1.1,p,.85);oblivionCombatBloom(e.x,e.y,r*.76,out*(type==='overhead'?1:.65));
    oblivionCombatFragments(e.x,e.y,r*1.2,p,.9,type==='overhead'?2:0,24);
  }else if(type==='formOn'||type==='formOff'||type==='ultimateOpen'){
    const major=type==='ultimateOpen';oblivionCombatShock(e.x,e.y,major?330:195,p,major?.9:.6);
    oblivionCombatFragments(e.x,e.y,major?330:210,p,.85,2,major?26:18,type==='formOn');
    oblivionCombatBloom(e.x,e.y-20,major?185:125,out*.6);
  }else if(type==='shield'){
    oblivionCombatShock(e.x,e.y,r,p,.5);
  }else if(type==='avatarEcho'){
    oblivionCombatBloom(e.x,e.y,r,out*.3,true);
  }else if(type==='finale'){
    // The cast owns the long world cut; this is its localized impact punctuation.
    oblivionCombatFragments(e.x,e.y,Math.min(r,380),p,1,4,28);oblivionCombatBloom(e.x,e.y,200,out*.85);
  }
  ctx.restore();
}
function oblivionCombatFallbackBody(height,phase){
  const s=height/220;ctx.save();ctx.scale(s,s);ctx.fillStyle='#0b0812';ctx.strokeStyle='#f64c6b';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(-12,-150);ctx.lineTo(-25,-166);ctx.lineTo(-14,-196);ctx.lineTo(-5,-177);ctx.lineTo(12,-178);ctx.lineTo(22,-199);ctx.lineTo(25,-163);ctx.lineTo(15,-146);ctx.lineTo(51,-139);ctx.lineTo(72,-155);ctx.lineTo(61,-112);ctx.lineTo(38,-81);ctx.lineTo(29,-29);ctx.lineTo(50,27);ctx.lineTo(21,32);ctx.lineTo(0,-10);ctx.lineTo(-19,31);ctx.lineTo(-46,28);ctx.lineTo(-29,-26);ctx.lineTo(-36,-82);ctx.lineTo(-64,-111);ctx.lineTo(-77,-152);ctx.lineTo(-47,-137);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#ffedda';ctx.beginPath();ctx.moveTo(-8,-163);ctx.lineTo(-2,-161);ctx.moveTo(7,-163);ctx.lineTo(14,-164);ctx.stroke();
  oblivionCombatClaw(-45,-80,1.05+Math.sin(phase)*.04,67,1);oblivionCombatClaw(45,-80,2.09-Math.sin(phase)*.04,67,1);ctx.restore();
}
function oblivionCombatBody(im,x,y,height,phase,alpha=1,reveal=1,lean=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(lean);ctx.globalAlpha*=alpha;
  const breathing=1+Math.sin(phase)*.013;ctx.scale(1/breathing,breathing);
  if(oblivionVfxReady(im)){
    const w=height*im.naturalWidth/im.naturalHeight;
    if(reveal<1){ctx.beginPath();ctx.rect(-w*.65,height*.29-height*reveal,w*1.3,height*reveal+4);ctx.clip();}
    ctx.drawImage(im,-w/2,-height*.73,w,height);
  }else oblivionCombatFallbackBody(height,phase);
  ctx.restore();
}
function oblivionCombatAvatar(){
  const s=oblivionState;if(!(s.ultimateTime>0))return;
  const age=(s.ultimateMax||600)-s.ultimateTime,fade=oblivionVfxSmooth(age/26)*oblivionVfxSmooth(s.ultimateTime/45),pulse=oblivionVfxClamp01((s.avatarPulse||0)/16),a=s.lastAngle||0,t=s.frame||0;
  const x=Number.isFinite(s.avatarX)?s.avatarX:player.x-Math.cos(a)*65,y=(Number.isFinite(s.avatarY)?s.avatarY:player.y-Math.sin(a)*65)-100;
  if(!oblivionVfxVisible(x,y,400))return;
  const h=378+Math.sin(t*.026)*5,lean=Math.cos(a)*pulse*.034;
  ctx.save();ctx.globalAlpha*=fade;
  oblivionCombatBloom(x,y-h*.3,250,.36,true);
  oblivionCombatBody(oblivionVfxMonster(),x+Math.cos(a)*pulse*15,y+Math.sin(a)*pulse*10,h,t*.032,.44+pulse*.24,oblivionVfxSmooth(age/28),lean);
  // Separate spectral wrists visibly echo each attack, not just an opacity pulse.
  const reach=38+pulse*58;
  oblivionCombatClaw(x-100+Math.cos(a)*reach,y-39+Math.sin(a)*reach,a,96,.25+pulse*.47,1+pulse*.14);
  oblivionCombatClaw(x+100+Math.cos(a)*reach,y-47+Math.sin(a)*reach,a,96,.25+pulse*.47,1+pulse*.14);
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#f356765c';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<4;i++){const xx=x+(i-1.5)*36;ctx.moveTo(xx,y+65);ctx.bezierCurveTo(xx+Math.sin(t*.02+i)*18,y+120,player.x+(i-1.5)*24,player.y-5,player.x+(i-1.5)*15,player.y+28);}ctx.stroke();ctx.restore();
}
function drawOblivionCombatEffects(){
  if(selectedCharacter!=='oblivion'||typeof oblivionState==='undefined')return;
  const s=oblivionState;worldStart();ctx.shadowBlur=0;
  oblivionCombatAvatar();
  const casts=s.casts||[];for(let i=Math.max(0,casts.length-12);i<casts.length;i++)oblivionCombatCast(casts[i]);
  const shots=s.projectiles||[];for(let i=Math.max(0,shots.length-72);i<shots.length;i++){
    const p=shots[i];if(!oblivionVfxVisible(p.x,p.y,120))continue;
    oblivionCombatRibbon(p.trail,p,15,.84);oblivionCombatShard(p.x,p.y,p.r||13,p.a||0,1);
    oblivionCombatBloom(p.x,p.y,29,.34);
  }
  const effects=s.effects||[];let small=0;
  for(let i=effects.length-1,drawn=0;i>=0&&drawn<64;i--){
    const e=effects[i],type=e.kind||e.type;if((type==='hit'||type==='shardCast')&&small++>=12)continue;
    if(!oblivionVfxVisible(e.x,e.y,(e.r||90)+170))continue;oblivionCombatEvent(e);drawn++;
  }worldEnd();
}
function drawOblivionCombatPlayer(){
  if(selectedCharacter!=='oblivion'||typeof oblivionState==='undefined')return false;
  const s=oblivionState,blend=oblivionVfxClamp01(s.formBlend||0),active=s.empowered||s.ultimateTime>0;
  if(!active&&blend<=.001)return false;
  const t=s.frame||0,im=oblivionVfxMonster(),a=s.lastAngle||0,pulse=oblivionVfxClamp01((s.avatarPulse||0)/16),bob=Math.sin(t*.05)*2.1,height=168+blend*17;
  worldStart();ctx.shadowBlur=0;
  if(player.invincibleTime>0&&Math.floor(player.invincibleTime/4)%2===0)ctx.globalAlpha=.48;
  const visibleBlend=active?Math.max(.06,blend):blend;
  ctx.save();ctx.translate(player.x,player.y+29);ctx.scale(1,.40);ctx.rotate(t*.006);ctx.globalAlpha*=visibleBlend*.62;ctx.drawImage(oblivionCombatTexture('seal'),-65,-65,130,130);ctx.restore();
  oblivionCombatBloom(player.x,player.y-22,92,visibleBlend*.29,true);
  if(blend<.94&&typeof oblivionSprite!=='undefined')oblivionCombatBody(oblivionSprite,player.x,player.y,139,t*.018,(1-blend)*.9);
  const lean=Math.cos(a)*(.018+pulse*.035);
  oblivionCombatBody(im,player.x+Math.cos(a)*pulse*3,player.y+bob,height,t*.06,visibleBlend,oblivionVfxSmooth(visibleBlend*1.3),lean);
  // Breathing core, independent talons and orbiting broken seals animate the form.
  const breathe=.62+Math.sin(t*.054)*.17,coreX=player.x+height*.036,coreY=player.y-height*.503+bob;
  oblivionCombatBloom(coreX+5,coreY-5,19,visibleBlend*breathe*.58);
  ctx.save();ctx.globalAlpha*=visibleBlend;ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff749787';ctx.lineWidth=.8;ctx.beginPath();
  for(let j=0;j<2;j++){const sign=j?-1:1,xx=coreX+sign*9,yy=coreY+5;ctx.moveTo(xx,yy);ctx.lineTo(xx+sign*6,yy+18);ctx.lineTo(xx-sign*3,yy+27);ctx.lineTo(xx+sign*9,yy+39);}ctx.stroke();ctx.restore();
  for(let i=0;i<4;i++){const angle=i*Math.PI/2+t*.018,r=45+(i%2)*8,xx=player.x+Math.cos(angle)*r,yy=player.y-25+Math.sin(angle)*23+Math.sin(t*.06+i)*5;oblivionCombatShard(xx,yy,6.5+i%2,angle+.8,visibleBlend*.8);}
  if(blend<.95){const r=60*(1-blend)+22;oblivionCombatFragments(player.x,player.y-12,r,1-blend,.8,2,10,true);}
  if(s.shield>0){ctx.save();ctx.globalAlpha*=visibleBlend*.46;ctx.strokeStyle='#f6ad9d';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(player.x,player.y-20,46,71,-.1,-2.9,-.9);ctx.ellipse(player.x,player.y-20,46,71,-.1,.25,1.7);ctx.stroke();ctx.restore();}
  worldEnd();return true;
}
function drawOblivionCombatRealm(){
  if(selectedCharacter!=='oblivion'||typeof oblivionState==='undefined'||screenMode!=='game')return;
  const s=oblivionState;if(!(s.ultimateTime>0))return;
  const age=(s.ultimateMax||600)-s.ultimateTime,fade=oblivionVfxSmooth(age/30)*oblivionVfxSmooth(s.ultimateTime/42),w=canvas.width,h=canvas.height;
  const im=typeof heroUltimateBackdrops==='undefined'?null:heroUltimateBackdrops.oblivion;
  ctx.save();ctx.globalAlpha*=fade;
  if(oblivionVfxReady(im)){
    const scale=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
    ctx.globalAlpha*=.90;ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);ctx.globalAlpha/=.90;
  }
  ctx.fillStyle='#08030b';ctx.globalAlpha*=.24;ctx.fillRect(0,0,w,h);ctx.globalAlpha/=.24;
  // Geometry stays in the outer 12% and below all enemy/boss warning passes.
  ctx.strokeStyle='#ff5c7959';ctx.lineWidth=1.05;ctx.beginPath();
  for(let i=0;i<12;i++){
    const side=i%2,base=w*(side?.98:.02),y=h*((i*.177-age*.00029+2)%1),sg=side?-1:1;
    ctx.moveTo(base,y-55);ctx.lineTo(base+sg*w*.025,y-18);ctx.lineTo(base+sg*w*.011,y+5);ctx.lineTo(base+sg*w*.061,y+54);ctx.moveTo(base+sg*w*.025,y-18);ctx.lineTo(base+sg*w*.065,y-3);
  }ctx.stroke();ctx.restore();
}
function drawOblivionCombatPortrait(){
  if(selectedCharacter!=='oblivion'||typeof oblivionState==='undefined'||screenMode!=='game')return;
  const s=oblivionState;if(!(s.ultimateTime>0))return;
  const age=(s.ultimateMax||600)-s.ultimateTime;if(age>=122)return;
  const alpha=oblivionVfxSmooth(age/14)*(1-oblivionVfxSmooth((age-89)/33)),im=oblivionVfxMonster();if(alpha<=0||!oblivionVfxReady(im))return;
  const w=canvas.width*.50,h=canvas.height*.27,x=canvas.width-w,slide=(1-oblivionVfxEaseOut(age/20))*w*.28;
  ctx.save();ctx.translate(slide,0);ctx.globalAlpha*=alpha;
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,0);ctx.lineTo(canvas.width,h);ctx.closePath();ctx.clip();ctx.fillStyle='#0b060eea';ctx.fillRect(x,0,w,h);
  const art=typeof heroUltimateBackdrops==='undefined'?null:heroUltimateBackdrops.oblivion;
  if(oblivionVfxReady(art)){ctx.globalAlpha*=.45;ctx.drawImage(art,x,-h*.10,w,h*1.7);ctx.globalAlpha/=.45;}
  const sh=im.naturalHeight*.37,sw=Math.min(im.naturalWidth,sh*w/h),sx=(im.naturalWidth-sw)/2;
  const portraitScale=Math.max(w*.62/sw,h*1.10/sh),portraitW=sw*portraitScale,portraitH=sh*portraitScale;
  ctx.drawImage(im,sx,0,sw,sh,x+w*.69-portraitW/2,-h*.05,portraitW,portraitH);
  ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ff667b96';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<5;i++){const xx=x+w*(.24+i*.06);ctx.moveTo(xx,0);ctx.lineTo(xx+w*.026,h*.12);ctx.lineTo(xx-w*.008,h*.22);ctx.lineTo(xx+w*.08,h*.40);}ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(slide,0);ctx.globalAlpha*=alpha;ctx.strokeStyle='#fa5474';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.stroke();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffd2b5';ctx.lineWidth=.8;ctx.stroke();ctx.restore();
}
