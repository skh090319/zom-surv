// Presentation for worlds 1 and 3 only. Legacy world-2 raid artwork/UI is untouched.
function worldRaidRenderDefinition(boss=activeRaidBoss) {
  if(!boss?.isWorldRaidBoss||typeof getWorldRaidBossDefinition!=='function')return null;
  return getWorldRaidBossDefinition(boss.raidIndex,boss.worldRaidWorld);
}

function drawWorldRaidArena() {
  const definition=worldRaidRenderDefinition();if(!definition)return false;
  if(!raidArena)return true;
  const color=definition.color,pulse=Math.sin(raidArena.pulse||0)*5;
  worldStart();ctx.save();ctx.fillStyle='#070b1426';ctx.strokeStyle=color+'a0';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(raidArena.x,raidArena.y,raidArena.r+pulse,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=color+'55';ctx.lineWidth=1.5;ctx.setLineDash([18,14]);ctx.beginPath();ctx.arc(raidArena.x,raidArena.y,raidArena.r-17-pulse*.4,0,Math.PI*2);ctx.stroke();
  ctx.restore();worldEnd();return true;
}

function drawWorldRaidBoss(boss) {
  const definition=worldRaidRenderDefinition(boss);if(!definition)return false;
  const age=boss.worldRaidAge||0,color=definition.color,size=definition.id==='abyss-eye'?292:274;
  const hovering=['stitcher','abyss-eye'].includes(definition.id),bob=Math.sin(age*(hovering?.026:.065))*(hovering?4:1.6);
  const image=getWorldBossImage(definition.id,definition.world),footY=boss.y+boss.r*.58;
  worldStart();ctx.save();
  ctx.fillStyle='#02040b66';ctx.beginPath();ctx.ellipse(boss.x,footY,size*.31,size*.085,0,0,Math.PI*2);ctx.fill();
  // Segmented metal/seal halo identifies the encounter rank, without covering its body.
  ctx.strokeStyle=color+'b0';ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(boss.x,footY,size*.35,size*.11,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=color+'60';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(boss.x,footY,size*.39,size*.13,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<8;i++){const angle=i*Math.PI/4+age*.004;ctx.strokeStyle=i%2?color+'55':color+'b0';ctx.lineWidth=i%2?1:2.5;ctx.beginPath();ctx.ellipse(boss.x,footY,size*.37,size*.12,0,angle,angle+.18);ctx.stroke();}
  const aura=ctx.createRadialGradient(boss.x,boss.y-36,8,boss.x,boss.y-36,size*.50);aura.addColorStop(0,color+'1e');aura.addColorStop(1,color+'00');ctx.fillStyle=aura;ctx.fillRect(boss.x-size*.55,boss.y-size*.66,size*1.1,size*1.1);
  ctx.translate(boss.x,boss.y-size*.12+bob);ctx.scale(boss.facing||1,1);
  const casting=boss.worldRaidState==='windup';ctx.rotate(Math.sin(age*.035)*(casting?.012:.008));
  if(boss.flash>0){ctx.shadowColor='#ffffff';ctx.shadowBlur=20;ctx.globalAlpha=.88;}
  else{ctx.shadowColor=color+'8c';ctx.shadowBlur=8;}
  if(image?.complete&&image.naturalWidth){const scale=Math.min(size/image.naturalWidth,size/image.naturalHeight);ctx.imageSmoothingEnabled=true;ctx.drawImage(image,-image.naturalWidth*scale/2,-image.naturalHeight*scale/2,image.naturalWidth*scale,image.naturalHeight*scale);}
  else{ctx.fillStyle=definition.world===1?'#45453e':'#30223f';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,size*.23,size*.38,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();drawWorldRaidCastFocus(boss,definition);worldEnd();return true;
}

function drawWorldRaidCastFocus(boss,definition) {
  const casting=boss.worldRaidState==='windup',active=boss.worldRaidState==='active',rift=definition.id==='rift-hunter';
  if(!casting&&!active&&!(rift&&boss.worldRaidTeleportCount>0))return;
  const age=boss.worldRaidAge||0,color=definition.color,charge=casting?Math.min(1,(boss.patternTime||0)/65):1;
  ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(boss.worldRaidAim||0);
  if(rift){
    const stacks=Math.min(8,boss.worldRaidTeleportCount||0);
    for(let i=0;i<Math.max(casting?3:0,stacks);i++){
      const a=age*.023+i*Math.PI*.75,r=boss.r+14+i%3*7;
      ctx.strokeStyle=color+(casting?'b0':'65');ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,r,a,a+.23);ctx.stroke();
    }
  }
  if(casting||active){
    ctx.translate(boss.r*.85,-12);ctx.globalAlpha=casting?.5+charge*.5:.8;
    if(definition.id==='iron-hauler'){
      for(let i=0;i<3;i++){ctx.strokeStyle=i===1?'#ffefd0':color;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(18+i*8,-34+i*4);ctx.lineTo(28+i*8,0);ctx.lineTo(18+i*8,34-i*4);ctx.stroke();}
    }else if(definition.id==='glass-thrower'){
      for(let i=0;i<5;i++){const a=-1.2+i*.6,r=38+(1-charge)*14;worldRaidVfxShard(Math.cos(a)*r,Math.sin(a)*r,8+charge*4,a+age*.015,color);}
    }else if(definition.id==='alarm-infected'){
      for(let i=0;i<3;i++){ctx.strokeStyle=color+(i?'85':'ed');ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,22+i*12+(age%18)*.3,-1.1,1.1);ctx.stroke();}
    }else if(rift){
      ctx.strokeStyle='#f3ddff';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(14,-39);ctx.lineTo(4,-9);ctx.lineTo(16,8);ctx.lineTo(3,36);ctx.stroke();
      ctx.strokeStyle=color+'70';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,-28);ctx.lineTo(24,3);ctx.lineTo(14,29);ctx.stroke();
    }else if(definition.id==='stitcher'){
      ctx.strokeStyle=color;ctx.lineWidth=1.7;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(10,0,26+i*5,10+i*3,age*.022+i*Math.PI/3,0,Math.PI*2);ctx.stroke();}
      worldRaidVfxShard(13,0,17+charge*5,0,'#dcfff0');
    }else{
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(9,0,35,25,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#fceaff';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(9,0,7+charge*6,20,0,0,Math.PI*2);ctx.stroke();
      worldRaidVfxSeal(42,8,-age*.018,color,charge);
    }
  }
  ctx.restore();
}

function worldRaidZonePath(zone) {
  const type=zone.type;
  ctx.beginPath();
  if(type==='cone'){ctx.moveTo(0,0);ctx.arc(0,0,zone.r||zone.length,-(zone.arc||1.55)/2,(zone.arc||1.55)/2);ctx.closePath();}
  else if(type==='shockwave'){
    const outer=Math.max(0,zone.delay>0?zone.maxR:zone.r),inner=zone.delay>0?zone.minR||0:Math.max(zone.minR||0,outer-zone.width),half=(zone.arc||1.8)/2;
    ctx.arc(0,0,outer,-half,half);if(inner>0)ctx.arc(0,0,inner,half,-half,true);else ctx.lineTo(0,0);ctx.closePath();
  }
  else if(type==='charge'||type==='beam')ctx.rect(0,-zone.width/2,zone.length,zone.width);
  else ctx.arc(0,0,Math.max(1,zone.r||zone.maxR||90),0,Math.PI*2);
}

// Deterministic, bounded geometry keeps the six encounter styles readable even
// when several hazards overlap. These helpers never allocate gameplay effects.
function worldRaidVfxTheme(source) {
  return source.owner?.worldRaidType||source.worldRaidType||(typeof activeRaidBoss!=='undefined'?activeRaidBoss?.worldRaidType:'')||'';
}
function worldRaidVfxShard(x,y,size,angle,color,solid=true) {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*.42,-size*.36);ctx.lineTo(-size*.72,size*.12);ctx.lineTo(-size*.22,size*.4);ctx.closePath();
  ctx.fillStyle=color+'72';if(solid)ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.stroke();
  ctx.beginPath();ctx.moveTo(size*.78,0);ctx.lineTo(-size*.4,size*.1);ctx.strokeStyle='#edffffb0';ctx.stroke();ctx.restore();
}
function worldRaidVfxSeal(radius,count,phase,color,progress=1) {
  ctx.strokeStyle=color+'70';ctx.lineWidth=1.2;
  for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count+phase,c=Math.cos(a),s=Math.sin(a),r=radius*(i%2?.88:.91);
    ctx.beginPath();ctx.moveTo(c*r,s*r);ctx.lineTo(c*radius,s*radius);ctx.stroke();
  }
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,radius*.78,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();
}
function drawWorldRaidConeDetail(zone,warning,progress,color,theme) {
  const radius=zone.r||zone.length,half=(zone.arc||1.55)/2,age=zone.age||0;
  if(warning){
    ctx.strokeStyle=color+'55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,radius*.64,-half,half);ctx.stroke();
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,radius,-half,-half+half*2*progress);ctx.stroke();
  }
  if(theme==='glass-thrower'||zone.action==='glassVolley'){
    // The sector announces projectile aim; the individual glass pieces are the
    // damaging objects. Never paint it as one solid active hit area.
    for(let i=0;i<5;i++){
      const a=-half+i*half*.5,r=warning?radius*.38:48+(age%20)/20*(radius*.78);
      ctx.strokeStyle=color+'35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.cos(a)*28,Math.sin(a)*28);ctx.lineTo(Math.cos(a)*radius,Math.sin(a)*radius);ctx.stroke();
      worldRaidVfxShard(Math.cos(a)*r,Math.sin(a)*r,warning?11:15,a,color,!warning);
    }
  }else if(theme==='rift-hunter'){
    for(let i=0;i<3;i++){
      const radiusPart=radius*(.48+i*.2),sweep=warning?progress:1;
      ctx.strokeStyle=i===2?'#f2ddff':color+(warning?'75':'c5');ctx.lineWidth=warning?1.2:5-i;
      ctx.beginPath();ctx.arc(0,0,radiusPart,-half+.12,Math.min(half-.08,-half+.12+(half*2-.2)*sweep));ctx.stroke();
    }
  }else{
    // Iron teeth follow the advertised fan, with metal stress seams inside it.
    for(let i=0;i<7;i++){
      const a=-half+.1+i*(half*2-.2)/6,c=Math.cos(a),s=Math.sin(a);
      ctx.strokeStyle=color+(warning?'48':'b0');ctx.lineWidth=warning?1:2.2;ctx.beginPath();ctx.moveTo(c*radius*.37,s*radius*.37);ctx.lineTo(c*radius*.70-s*7,s*radius*.70+c*7);ctx.lineTo(c*radius*.94,s*radius*.94);ctx.stroke();
      if(!warning)worldRaidVfxShard(c*radius*.82,s*radius*.82,9+i%3*3,a,color);
    }
    if(!warning){ctx.strokeStyle='#fff0c3';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,radius*.94,-half+.08,half-.08);ctx.stroke();}
  }
}
function drawWorldRaidBeamDetail(zone,warning,progress,color,theme) {
  const length=zone.length,width=zone.width,age=zone.age||0;
  if(warning){
    ctx.strokeStyle=color+'b0';ctx.lineWidth=1;ctx.setLineDash([5,12]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,0);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,26+progress*10,-Math.PI,Math.PI*progress);ctx.stroke();
    for(let i=1;i<=4;i++){const x=length*i/5;ctx.beginPath();ctx.moveTo(x-6,-width/2-5);ctx.lineTo(x,-width/2);ctx.moveTo(x-6,width/2+5);ctx.lineTo(x,width/2);ctx.stroke();}
    return;
  }
  const beam=ctx.createLinearGradient(0,-width/2,0,width/2);beam.addColorStop(0,color+'45');beam.addColorStop(.38,color+'d0');beam.addColorStop(.5,'#ffffff');beam.addColorStop(.62,color+'d0');beam.addColorStop(1,color+'45');
  ctx.fillStyle=beam;ctx.fillRect(0,-width/2,length,width);
  ctx.strokeStyle='#f4fff4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length,0);ctx.stroke();
  ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();
  for(let i=0;i<=16;i++){const x=length*i/16,y=Math.sin(i*1.8+age*.3)*width*.32;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  for(let i=0;i<8;i++){
    const x=((i/8+age*.009)%1)*length;
    if(theme==='stitcher'){
      // Crossing sutures distinguish the thread laser from the eye's hard ray.
      ctx.strokeStyle='#d5fff0';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-5,-width*.45);ctx.lineTo(x+5,width*.45);ctx.moveTo(x+5,-width*.45);ctx.lineTo(x-5,width*.45);ctx.stroke();
    }else{
      ctx.strokeStyle='#faeaffb0';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-11,-width*.34);ctx.lineTo(x,0);ctx.lineTo(x-11,width*.34);ctx.stroke();
    }
  }
  ctx.fillStyle='#fff3ff';ctx.beginPath();ctx.ellipse(0,0,9,width*.57,0,0,Math.PI*2);ctx.fill();
}
function drawWorldRaidCircularDetail(zone,warning,progress,color,theme) {
  const radius=zone.r||90,age=zone.age||0,active=zone.maxDelay?Math.min(1,Math.max(0,-zone.delay)/14):.5;
  worldRaidVfxSeal(radius*.92,zone.type==='summon'?12:8,zone.type==='rift'?age*.008:0,color,warning?progress:1);
  if(zone.type==='rain'){
    for(let i=0;i<5;i++){
      const a=i*Math.PI*.4+.35,rr=radius*(i?.52:.1),x=Math.cos(a)*rr,y=Math.sin(a)*rr,lift=warning?(1-progress)*68:0;
      ctx.strokeStyle=color+(warning?'45':'7a');ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-lift-25);ctx.lineTo(x,y+6);ctx.stroke();
      worldRaidVfxShard(x,y-lift,warning?8+progress*5:16-active*5,Math.PI*.59,color,!warning||progress>.6);
    }
    if(!warning){ctx.strokeStyle='#e4ffff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,radius*(.3+active*.55),radius*(.12+active*.3),0,0,Math.PI*2);ctx.stroke();}
  }else if(zone.type==='rift'){
    ctx.fillStyle='#110c20'+(warning?'80':'ee');ctx.beginPath();ctx.ellipse(0,-6,radius*(warning?.09:.22),radius*.62,.2,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){
      const a=i*Math.PI*.4+age*.012,rr=radius*(.68+(warning?1-progress:0)*.13);
      ctx.strokeStyle=i%2?color+'a0':'#ebd8ff';ctx.lineWidth=i%2?1.2:2;ctx.beginPath();ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);ctx.quadraticCurveTo(Math.cos(a+.65)*rr*.7,Math.sin(a+.65)*rr*.7,Math.cos(a+1)*radius*.15,Math.sin(a+1)*radius*.15);ctx.stroke();
    }
    ctx.strokeStyle=warning?color:'#fff1ff';ctx.lineWidth=warning?1.8:3;ctx.beginPath();ctx.moveTo(8,-radius*.64);ctx.lineTo(-5,-radius*.18);ctx.lineTo(7,radius*.13);ctx.lineTo(-8,radius*.62);ctx.stroke();
  }else if(zone.type==='summon'){
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+Math.PI/4,x=Math.cos(a)*radius*.55,y=Math.sin(a)*radius*.55;
      ctx.save();ctx.translate(x,y);ctx.rotate(a);
      ctx.strokeStyle=color+(warning?'8a':'e0');ctx.lineWidth=2;ctx.beginPath();
      if(theme==='stitcher'){ctx.moveTo(-16,0);ctx.lineTo(16,0);ctx.moveTo(-6,-8);ctx.lineTo(3,8);ctx.moveTo(2,-8);ctx.lineTo(11,8);}
      else{ctx.moveTo(-12,9);ctx.lineTo(0,-12);ctx.lineTo(12,9);ctx.closePath();ctx.moveTo(0,-4);ctx.lineTo(0,2);}
      ctx.stroke();ctx.restore();
    }
    ctx.strokeStyle=color+'75';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,radius*.4,age*.025,age*.025+Math.PI*1.5);ctx.stroke();
  }
}

function drawWorldRaidZones() {
  if(typeof worldRaidZones==='undefined'||!worldRaidZones.length)return;
  for(const zone of worldRaidZones){
    const warning=zone.delay>0,color=zone.color||'#b5a3ef',progress=Math.max(0,Math.min(1,1-Math.max(0,zone.delay)/Math.max(1,zone.maxDelay||1))),theme=worldRaidVfxTheme(zone),age=zone.age||0;
    ctx.save();ctx.translate(zone.x,zone.y);ctx.rotate(zone.angle||0);ctx.lineCap='round';
    if(zone.type==='ring'){
      const radius=warning?(zone.maxR||520):Math.max(1,zone.r),orb=zone.action==='orbVolley';
      if(warning){
        ctx.strokeStyle=color+'30';ctx.lineWidth=1;ctx.setLineDash([7,16]);ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        worldRaidVfxSeal(42+progress*22,orb?12:16,age*.006,color,progress);
        for(let i=0;i<(orb?12:8);i++){const a=i*Math.PI*2/(orb?12:8),r=80+(1-progress)*38;worldRaidVfxShard(Math.cos(a)*r,Math.sin(a)*r,orb?7:5,a+(orb?Math.PI:0),color,false);}
      }else if(!orb){
        // The outer sound-wave border has exactly the combat ring's width.
        ctx.strokeStyle=color+'a0';ctx.lineWidth=zone.width||18;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#ffe7df';ctx.lineWidth=2;ctx.stroke();
        ctx.strokeStyle=color+'48';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,Math.max(1,radius-24),0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=color+'85';ctx.lineWidth=1.5;ctx.beginPath();
        for(let i=0;i<=48;i++){const a=i*Math.PI/24,r=Math.max(1,radius-8+(i%2?1:-1)*Math.min(5,radius*.08));if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();
      }else{
        // Orb volleys have no damaging ring, so only render the source iris.
        worldRaidVfxSeal(54,12,age*.012,color);ctx.strokeStyle='#efd8ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,32,12,age*.014,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();continue;
    }
    if(zone.type==='beam'&&warning){
      // The full sweep is announced before the narrow active ray starts moving.
      ctx.fillStyle=color+'07';ctx.strokeStyle=color+'35';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,zone.length,0,zone.arc||.95);ctx.closePath();ctx.fill();ctx.stroke();
    }
    worldRaidZonePath(zone);
    if(zone.type!=='shockwave'||warning){
      ctx.fillStyle=color+(warning?(zone.type==='shockwave'?'08':'12'):zone.action==='glassVolley'?'06':'28');ctx.fill();ctx.strokeStyle=color+(warning?(zone.type==='shockwave'?'60':'a8'):'e8');ctx.lineWidth=warning?1.8:2;
      if(warning)ctx.setLineDash([10,8]);ctx.stroke();ctx.setLineDash([]);
    }
    if(zone.type==='shockwave'){
      const outer=warning?zone.maxR:zone.r,inner=warning?zone.minR||0:Math.max(zone.minR||0,outer-zone.width),half=(zone.arc||1.8)/2;
      if(warning){
        ctx.strokeStyle=color+'55';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,inner+(outer-inner)*.5,-half,half);ctx.stroke();
        ctx.strokeStyle=color+'b0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,outer,-half,-half+half*2*progress);ctx.stroke();
        for(let i=0;i<5;i++){const a=-half*.8+i*half*.4,r=inner+(outer-inner)*(.25+progress*.35);worldRaidVfxShard(Math.cos(a)*r,Math.sin(a)*r,8,a,color,false);}
      }else if(outer>inner){
        // All energy stays inside the actual 32px band. A luminous leading
        // edge and translucent wake give it depth without a blurred glow or
        // solid radial end caps that would make it look like a wireframe.
        const depth=outer-inner,energy=ctx.createRadialGradient(0,0,inner,0,0,outer);
        energy.addColorStop(0,color+'00');energy.addColorStop(.18,color+'12');energy.addColorStop(.46,'#9160cd86');energy.addColorStop(.74,color+'df');energy.addColorStop(.90,'#ecd1fff0');energy.addColorStop(.97,'#fff4ffff');energy.addColorStop(1,'#e4c3ffb0');
        ctx.fillStyle=energy;ctx.fill();
        ctx.strokeStyle='#fff4fff0';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,0,outer-.8,-half+.005,half-.005);ctx.stroke();
        for(let i=0;i<15;i++){
          const a=-half+.055+i*(half*2-.11)/14+Math.sin(age*.13+i*2.1)*.008;
          const tail=inner+depth*(.14+(i%3)*.10),bend=inner+depth*.64,tip=outer-Math.min(2.5,depth*.16),twist=(i%2?1:-1)*.009;
          ctx.strokeStyle=i%3?'#e5c7ffa0':'#fff1ffd8';ctx.lineWidth=i%3?.9:1.2;ctx.beginPath();
          ctx.moveTo(Math.cos(a-twist)*tail,Math.sin(a-twist)*tail);ctx.lineTo(Math.cos(a+twist*.5)*bend,Math.sin(a+twist*.5)*bend);ctx.lineTo(Math.cos(a)*tip,Math.sin(a)*tip);ctx.stroke();
          if(i%2===0){const fork=inner+depth*.79;ctx.strokeStyle=color+'c0';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(Math.cos(a+twist*.5)*bend,Math.sin(a+twist*.5)*bend);ctx.lineTo(Math.cos(a+twist*1.8)*fork,Math.sin(a+twist*1.8)*fork);ctx.stroke();}
        }
        for(let i=0;i<7;i++){
          const a=-half+.06+i*(half*2-.2)/7,r=inner+depth*(i%2?.30:.16);
          ctx.strokeStyle=color+(i%2?'52':'38');ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r,a,a+.08+(i%3)*.025);ctx.stroke();
        }
      }
    }
    else if(zone.type==='cone')drawWorldRaidConeDetail(zone,warning,progress,color,theme);
    else if(zone.type==='beam')drawWorldRaidBeamDetail(zone,warning,progress,color,theme);
    else if(zone.type==='charge'){
      ctx.strokeStyle=color+(warning?'90':'80');ctx.lineWidth=2;
      for(let i=1;i<=4;i++){const x=zone.length*i/5;ctx.beginPath();ctx.moveTo(x-11,-zone.width*.19);ctx.lineTo(x+10,0);ctx.lineTo(x-11,zone.width*.19);ctx.stroke();}
      if(warning){ctx.fillStyle=color+'20';ctx.fillRect(0,-zone.width/2,zone.length*progress,zone.width);}
      else{
        const front=Math.max(0,Math.min(zone.length,zone.travel||0)),tail=Math.max(0,front-130),trail=ctx.createLinearGradient(tail,0,Math.max(tail+1,front),0);trail.addColorStop(0,color+'00');trail.addColorStop(1,color+'65');ctx.fillStyle=trail;ctx.fillRect(tail,-zone.width/2,front-tail,zone.width);
        ctx.strokeStyle='#fff1cf';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(front,-zone.width*.46);ctx.lineTo(front,zone.width*.46);ctx.stroke();
        for(let i=0;i<6;i++){const x=Math.max(0,front-15-i*17),y=(i%2?1:-1)*zone.width*.42;ctx.strokeStyle=color+'a0';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(Math.max(0,x-12),y*.9);ctx.stroke();}
      }
    }else if(['rain','rift','summon'].includes(zone.type)){
      drawWorldRaidCircularDetail(zone,warning,progress,color,theme);
    }
    ctx.restore();
  }
}

function drawWorldRaidProjectiles() {
  if(typeof worldRaidProjectiles==='undefined'||!worldRaidProjectiles.length)return;
  for(const projectile of worldRaidProjectiles){
    const color=projectile.color||'#b8e9ef',angle=Math.atan2(projectile.vy,projectile.vx),r=projectile.r||9;
    ctx.save();ctx.translate(projectile.x,projectile.y);ctx.rotate(angle);
    if(projectile.astraAbsorb)ctx.globalAlpha*=1-Math.min(.8,(projectile.astraAbsorb.age||0)/75);
    const trail=r*(projectile.type==='glass'?4.6:3.8),tail=ctx.createLinearGradient(-trail,0,r,0);tail.addColorStop(0,color+'00');tail.addColorStop(.65,color+'65');tail.addColorStop(1,color+'c0');
    ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(-trail,0);ctx.quadraticCurveTo(-r*1.4,-r*.65,r*.25,-r*.55);ctx.lineTo(r*.25,r*.55);ctx.quadraticCurveTo(-r*1.4,r*.65,-trail,0);ctx.fill();
    ctx.strokeStyle=color+'65';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-trail*.8,-r*.45);ctx.lineTo(-r*.4,-r*.3);ctx.moveTo(-trail*.7,r*.5);ctx.lineTo(-r*.5,r*.34);ctx.stroke();
    if(projectile.type==='glass'){
      worldRaidVfxShard(0,0,r*1.2,Math.sin(projectile.spin||0)*.18,color);
      worldRaidVfxShard(-r*2,-r*.55,r*.25,(projectile.spin||0)*.6,color);
      ctx.fillStyle='#f0ffff';ctx.beginPath();ctx.arc(r*.55,0,1.7,0,Math.PI*2);ctx.fill();
    }else{
      const glow=ctx.createRadialGradient(-r*.2,-r*.25,1,0,0,r*1.65);glow.addColorStop(0,'#fff8ff');glow.addColorStop(.22,color);glow.addColorStop(.55,color+'90');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.65,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#281b3e';ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#fbeaff';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,r*.46,r*.17,(projectile.spin||0)*.5,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=color+'b0';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(0,0,r*1.1,r*.52,(projectile.spin||0)*.35,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawWorldRaidEffects() {
  if(typeof worldRaidEffects==='undefined')return;
  const boss=activeRaidBoss,definition=worldRaidRenderDefinition(boss);
  if(definition&&boss.worldRaidLinks?.length){
    for(const enemy of boss.worldRaidLinks){if(!enemy||enemy.hp<=0)continue;const color=definition.color,mx=(boss.x+enemy.x)/2,my=(boss.y+enemy.y)/2-34;
      ctx.save();ctx.strokeStyle=color+'26';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(boss.x,boss.y-20);ctx.quadraticCurveTo(mx,my,enemy.x,enemy.y);ctx.stroke();ctx.strokeStyle=color+'b0';ctx.lineWidth=1.4;ctx.stroke();
      for(let i=0;i<3;i++){const t=((boss.worldRaidAge||0)*.007+i/3)%1,u=1-t,x=u*u*boss.x+2*u*t*mx+t*t*enemy.x,y=u*u*(boss.y-20)+2*u*t*my+t*t*enemy.y;ctx.fillStyle='#dcfff0';ctx.beginPath();ctx.arc(x,y,2.1,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle=color+'a0';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(enemy.x,enemy.y,13,6,(boss.worldRaidAge||0)*.015,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  for(const effect of worldRaidEffects){
    const progress=Math.max(0,Math.min(1,1-effect.life/Math.max(1,effect.maxLife))),color=effect.color||'#b4a6f5',theme=effect.worldRaidType||definition?.id||'',radius=Math.max(3,Math.min(effect.r||60,100)*(.2+progress*.8));
    ctx.save();ctx.translate(effect.x,effect.y);ctx.globalAlpha=(1-progress)*(1-progress);ctx.strokeStyle=color;ctx.lineWidth=3*(1-progress)+1;
    if(effect.type==='teleport'){
      ctx.fillStyle='#150c25b0';ctx.beginPath();ctx.ellipse(0,-12,radius*.3*(1-progress),radius,progress*.4,0,Math.PI*2);ctx.fill();
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7+progress*.5,r=radius*(.6+progress*.3);ctx.strokeStyle=i%2?color:'#efd9ff';ctx.lineWidth=i%2?1.2:2.2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);ctx.lineTo(Math.cos(a+.2)*r*.7,Math.sin(a+.2)*r*.7);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();
      }
    }else if(effect.type==='linkBreak'){
      for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.strokeStyle=i%2?color:'#dffff0';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(Math.cos(a)*radius*.3,Math.sin(a)*radius*.3);ctx.quadraticCurveTo(Math.cos(a+.6)*radius*.6,Math.sin(a+.6)*radius*.6,Math.cos(a)*radius,Math.sin(a)*radius);ctx.stroke();}
    }else{
      // Impact accents are intentionally compact; collision boundaries live in
      // the zone renderer, rather than oversized decorative circular flashes.
      ctx.strokeStyle=color+'90';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,radius,radius*.38,0,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4+.2,x=Math.cos(a)*radius*.8,y=Math.sin(a)*radius*.55-progress*15;
        if(theme==='glass-thrower'||theme==='iron-hauler')worldRaidVfxShard(x,y,Math.max(2,8*(1-progress)),a+progress,color);
        else{ctx.strokeStyle=i%2?color:'#f0eaff';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x*.5,y*.5);ctx.lineTo(x,y);ctx.stroke();}
      }
      if(effect.type==='summon')worldRaidVfxSeal(radius*.85,8,progress*.2,color);
    }
    ctx.restore();
  }
}

function drawWorldRaidUI(mobile=false) {
  if(raidVictory||typeof getWorldRaidBossDefinition!=='function')return false;
  const boss=activeRaidBoss,definition=boss?worldRaidRenderDefinition(boss):getWorldRaidBossDefinition(nextRaidBossIndex);
  if(!definition)return false;
  const color=definition.color,width=Math.min(mobile?400:760,canvas.width*(mobile?.62:.86)),x=(canvas.width-width)/2,y=mobile?52:54,h=mobile?16:26;
  const remaining=(RAID_BOSS_TIMES[nextRaidBossIndex]||0)-survivalFrames,warning=!boss&&remaining>0&&remaining<=300;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=0;
  if(boss){
    drawRaidBossVitalBar(boss,{x,y,w:width,h,mobile,name:definition.name,colors:[color+'90',color,color+'a6'],border:color+'d0'});
    if(raidIntroTime<=0){ctx.font=`${mobile?11:13}px Arial`;ctx.fillStyle='#dce1e8';ctx.fillText(`${formatRaidTime(survivalFrames)} · ${definition.world}세계 보스전 · 시간 정지`,canvas.width/2,y+h+(mobile?14:19),width-12);}
    if(raidIntroTime>0){
      const bannerY=y+h+(mobile?6:10),bannerH=mobile?32:48;
      ctx.fillStyle='#111324e8';ctx.fillRect(x,bannerY,width,bannerH);ctx.strokeStyle=color+'90';ctx.strokeRect(x,bannerY,width,bannerH);
      ctx.fillStyle=color;ctx.font=`bold ${mobile?12:20}px Arial`;ctx.fillText(`주의 · ${definition.name} 등장`,canvas.width/2,bannerY+(mobile?10:16),width-18);
      ctx.fillStyle='#dce1e8';ctx.font=`${mobile?10:12}px Arial`;ctx.fillText(`${formatRaidTime(survivalFrames)} · ${definition.world}세계 보스전 · 시간 정지`,canvas.width/2,bannerY+(mobile?24:36),width-18);
    }
  }else if(warning){
    const panelH=mobile?44:62;ctx.fillStyle='#111324e8';ctx.fillRect(x,y,width,panelH);ctx.strokeStyle=color+'b0';ctx.lineWidth=1;ctx.strokeRect(x,y,width,panelH);
    ctx.fillStyle=color;ctx.font=`bold ${mobile?13:18}px Arial`;ctx.fillText(`주의 · 보스 접근 감지 · ${Math.ceil(remaining/60)}초`,canvas.width/2,y+(mobile?12:19),width-18);
    ctx.font=`${mobile?11:15}px Arial`;ctx.fillStyle='#f1e9f5';ctx.fillText(`${definition.name} · ${formatRaidTime(survivalFrames)}`,canvas.width/2,y+(mobile?29:43),width-18);ctx.fillStyle=color;ctx.fillRect(x,y+panelH-2,width*remaining/300,2);
  }else{
    ctx.fillStyle='#060a12bd';ctx.fillRect(canvas.width/2-48,y,96,mobile?24:30);ctx.font=`bold ${mobile?12:18}px monospace`;ctx.fillStyle='#fff';ctx.fillText(formatRaidTime(survivalFrames),canvas.width/2,y+(mobile?12:15),84);
  }
  ctx.restore();return true;
}
