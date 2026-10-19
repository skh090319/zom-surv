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
  ctx.restore();worldEnd();return true;
}

function worldRaidZonePath(zone) {
  const type=zone.type;
  ctx.beginPath();
  if(type==='cone'){ctx.moveTo(0,0);ctx.arc(0,0,zone.r||zone.length,-(zone.arc||1.55)/2,(zone.arc||1.55)/2);ctx.closePath();}
  else if(type==='charge'||type==='beam')ctx.rect(0,-zone.width/2,zone.length,zone.width);
  else ctx.arc(0,0,Math.max(1,zone.r||zone.maxR||90),0,Math.PI*2);
}

function drawWorldRaidZones() {
  if(typeof worldRaidZones==='undefined'||!worldRaidZones.length)return;
  for(const zone of worldRaidZones){
    const warning=zone.delay>0,color=zone.color||'#b5a3ef',progress=1-Math.max(0,zone.delay)/Math.max(1,zone.maxDelay||1);
    ctx.save();ctx.translate(zone.x,zone.y);ctx.rotate(zone.angle||0);ctx.lineCap='round';
    if(zone.type==='ring'){
      const radius=warning?(zone.maxR||520):Math.max(1,zone.r);
      ctx.strokeStyle=color+(warning?'30':'25');ctx.lineWidth=warning?1:(zone.width||18)+10;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=color+(warning?'9a':'dd');ctx.lineWidth=warning?2:zone.width||18;
      ctx.beginPath();ctx.arc(0,0,warning?42+progress*22:radius,0,Math.PI*2);ctx.stroke();
      if(!warning){ctx.strokeStyle='#fff4e8';ctx.lineWidth=2;ctx.stroke();}
      ctx.restore();continue;
    }
    if(zone.type==='beam'&&warning){
      // The full sweep is announced before the narrow active ray starts moving.
      ctx.fillStyle=color+'07';ctx.strokeStyle=color+'35';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,zone.length,0,zone.arc||.95);ctx.closePath();ctx.fill();ctx.stroke();
    }
    worldRaidZonePath(zone);
    ctx.fillStyle=color+(warning?'14':'25');ctx.fill();ctx.strokeStyle=color+(warning?'9d':'ec');ctx.lineWidth=warning?1.8:3;
    if(warning)ctx.setLineDash([10,8]);ctx.stroke();ctx.setLineDash([]);
    if(zone.type==='beam'&&!warning){ctx.strokeStyle=color+'42';ctx.lineWidth=zone.width+16;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(zone.length,0);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=zone.width;ctx.stroke();ctx.strokeStyle='#fff5ff';ctx.lineWidth=4;ctx.stroke();}
    else if(zone.type==='charge'){
      ctx.strokeStyle=color+(warning?'b0':'e6');ctx.lineWidth=2;
      for(let i=1;i<=4;i++){const x=zone.length*i/5;ctx.beginPath();ctx.moveTo(x-11,-zone.width*.19);ctx.lineTo(x+10,0);ctx.lineTo(x-11,zone.width*.19);ctx.stroke();}
    }else if(['rain','rift','summon'].includes(zone.type)){
      const radius=zone.r||90;ctx.strokeStyle=color+(warning?'cd':'a5');ctx.lineWidth=warning?2:1.2;
      ctx.beginPath();ctx.arc(0,0,radius*.83,-Math.PI/2,-Math.PI/2+Math.PI*2*(warning?progress:1));ctx.stroke();
      if(warning){ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.stroke();}
      else if(zone.type==='rain'){
        for(let i=0;i<5;i++){const a=i*Math.PI*.4,rr=radius*.55;ctx.fillStyle=color+'ba';ctx.beginPath();ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr-18);ctx.lineTo(Math.cos(a)*rr+5,Math.sin(a)*rr+3);ctx.lineTo(Math.cos(a)*rr-5,Math.sin(a)*rr+6);ctx.closePath();ctx.fill();}
      }
    }
    ctx.restore();
  }
}

function drawWorldRaidProjectiles() {
  if(typeof worldRaidProjectiles==='undefined'||!worldRaidProjectiles.length)return;
  for(const projectile of worldRaidProjectiles){
    const color=projectile.color||'#b8e9ef',angle=Math.atan2(projectile.vy,projectile.vx),r=projectile.r||9;
    ctx.save();
    ctx.strokeStyle=color+'48';ctx.lineWidth=r*.8;ctx.beginPath();ctx.moveTo(projectile.x-Math.cos(angle)*r*3,projectile.y-Math.sin(angle)*r*3);ctx.lineTo(projectile.x,projectile.y);ctx.stroke();
    ctx.translate(projectile.x,projectile.y);ctx.rotate(projectile.spin||angle);
    if(projectile.astraAbsorb)ctx.globalAlpha*=1-Math.min(.8,(projectile.astraAbsorb.age||0)/75);
    if(projectile.type==='glass'){
      ctx.fillStyle=color+'9e';ctx.strokeStyle='#edffff';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(r*1.55,0);ctx.lineTo(-r*.6,-r*.6);ctx.lineTo(-r,0);ctx.lineTo(-r*.55,r*.7);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#fff9';ctx.beginPath();ctx.moveTo(r*1.3,0);ctx.lineTo(-r*.4,r*.2);ctx.stroke();
    }else{
      const glow=ctx.createRadialGradient(-r*.2,-r*.25,1,0,0,r*1.8);glow.addColorStop(0,'#fff8ff');glow.addColorStop(.22,color);glow.addColorStop(.58,color+'a0');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color+'b0';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,0,r*1.2,r*.65,.4,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawWorldRaidEffects() {
  if(typeof worldRaidEffects==='undefined')return;
  const boss=activeRaidBoss,definition=worldRaidRenderDefinition(boss);
  if(definition&&boss.worldRaidLinks?.length){
    for(const enemy of boss.worldRaidLinks){if(!enemy||enemy.hp<=0)continue;const color=definition.color,mx=(boss.x+enemy.x)/2,my=(boss.y+enemy.y)/2-34;
      ctx.save();ctx.strokeStyle=color+'30';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(boss.x,boss.y-20);ctx.quadraticCurveTo(mx,my,enemy.x,enemy.y);ctx.stroke();ctx.strokeStyle=color+'c0';ctx.lineWidth=1.6;ctx.setLineDash([6,11]);ctx.lineDashOffset=-(boss.worldRaidAge||0)*.7;ctx.stroke();ctx.restore();}
  }
  for(const effect of worldRaidEffects){
    const progress=1-effect.life/Math.max(1,effect.maxLife),color=effect.color||'#b4a6f5',radius=Math.max(3,(effect.r||60)*(.2+progress*.8));
    ctx.save();ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=color;ctx.lineWidth=3*(1-progress)+1;
    ctx.beginPath();ctx.arc(effect.x,effect.y,radius,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=color+'58';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(effect.x,effect.y,radius*.78,0,Math.PI*2);ctx.stroke();
    if(effect.type==='teleport'||effect.type==='linkBreak')for(let i=0;i<6;i++){const a=i*Math.PI/3+progress*.3;ctx.strokeStyle=color+'bf';ctx.beginPath();ctx.moveTo(effect.x+Math.cos(a)*radius*.65,effect.y+Math.sin(a)*radius*.65);ctx.lineTo(effect.x+Math.cos(a)*radius*1.2,effect.y+Math.sin(a)*radius*1.2);ctx.stroke();}
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
    const ratio=Math.max(0,Math.min(1,boss.hp/boss.maxHp)),bar=ctx.createLinearGradient(x,0,x+width,0);bar.addColorStop(0,color+'90');bar.addColorStop(.52,color);bar.addColorStop(1,color+'a6');
    ctx.fillStyle='#07101ce6';ctx.fillRect(x-3,y-3,width+6,h+6);ctx.fillStyle=bar;ctx.fillRect(x,y,width*ratio,h);ctx.strokeStyle=color+'d0';ctx.lineWidth=1;ctx.strokeRect(x,y,width,h);
    ctx.font=`bold ${mobile?11:17}px Arial`;ctx.fillStyle='#fff';ctx.fillText(definition.name,canvas.width/2,y+h/2,width-14);
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
