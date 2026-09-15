// 테라: 진동을 모아 지형을 만들고 한 번에 붕괴시키는 광역 전사
const TERRA_Q_COOLDOWN = 300, TERRA_E_COOLDOWN = 420, TERRA_X_COOLDOWN = 660, TERRA_R_COOLDOWN = 3300;

function addTerraVibration(amount) {
  player.terraVibration = Math.min(100, player.terraVibration + amount * (1 + player.terraResonanceLevel * 0.2));
  player.terraVibrationDelay = 180;
}

function prepareTerraSkill(cost) {
  const vibration = player.terraVibration;
  const free = vibration >= 100;
  if (!free) player.terraVibration = Math.max(0, vibration - cost);
  else player.terraVibration = 0;
  return { vibration, wide: vibration >= 30, double: vibration >= 60, overdrive: free };
}

function terraDamageCircle(x, y, radius, damage, maxHpRatio = 0) {
  let hits = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i]; if (Math.hypot(z.x - x, z.y - y) > radius + z.r) continue;
    z.hp -= damage + z.maxHp * maxHpRatio; hits++;
    if (z.hp <= 0) killZombie(i, z);
  }
  return hits;
}

function terraPointInField(x, y, field, padding = 0) {
  const dx = x - field.x, dy = y - field.y;
  const forward = dx * Math.cos(field.angle) + dy * Math.sin(field.angle);
  const side = -dx * Math.sin(field.angle) + dy * Math.cos(field.angle);
  return forward >= -padding && forward <= field.length + padding && Math.abs(side) <= field.width / 2 + padding;
}

function attackWithTerra() {
  if (player.fireCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const x = player.x + Math.cos(angle) * 72, y = player.y + Math.sin(angle) * 72;
  const radius = 92 + player.terraResonanceLevel * 5;
  const hits = terraDamageCircle(x, y, radius, scaledDamage(player.damage * 1.08));
  if (hits) addTerraVibration(Math.min(18, hits * 4));
  terraEffects.push({ type: "slam", x, y, r: radius, angle, life: 20, maxLife: 20 });
  player.terraAttackCounter++;
  if (player.terraAttackCounter % 3 === 0) {
    const range = 410, arc = Math.PI * 0.42;
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      const dx = z.x - player.x, dy = z.y - player.y;
      if (Math.hypot(dx, dy) > range + z.r || Math.abs(paladinAngleDifference(Math.atan2(dy, dx), angle)) > arc / 2) continue;
      z.hp -= scaledDamage(player.damage * 1.35);
      if (z.hp <= 0) killZombie(i, z);
    }
    terraEffects.push({ type: "shockwave", x: player.x, y: player.y, angle, range, arc, life: 30, maxLife: 30 });
  }
  player.fireCooldown = Math.max(18, 29 - player.fireRateBonus);
}

function activateTerraQ() {
  if (player.terraQCooldown > 0) return;
  const state = prepareTerraSkill(20), angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const length = (state.wide ? 570 : 460) * (1 + player.terraFaultLevel * 0.1), width = state.wide ? 80 : 60;
  const x2 = player.x + Math.cos(angle) * length, y2 = player.y + Math.sin(angle) * length;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i]; if (distanceToNightLordSegment(z.x,z.y,player.x,player.y,x2,y2) > width + z.r) continue;
    z.hp -= scaledDamage(player.damage * (state.double ? 2.8 : 1.7));
    const along = (z.x-player.x)*Math.cos(angle)+(z.y-player.y)*Math.sin(angle);
    const cx=player.x+Math.cos(angle)*along, cy=player.y+Math.sin(angle)*along;
    z.x += (cx-z.x)*0.7; z.y += (cy-z.y)*0.7;
    if (z.hp <= 0) killZombie(i,z);
  }
  terraStructures.push({ type:"fault", x:player.x, y:player.y, x2,y2, width, life:300 });
  terraEffects.push({ type:"fault", x:player.x,y:player.y,x2,y2,width,life:32,maxLife:32 });
  if (state.overdrive || transcended.terraFault) terraEffects.push({ type:"aftershock",x:x2,y:y2,r:220,delay:24,life:55,maxLife:55,damage:scaledDamage(player.damage*2.4) });
  player.terraQCooldown=TERRA_Q_COOLDOWN;
}

function activateTerraE() {
  if (player.terraECooldown > 0) return;
  const state=prepareTerraSkill(30), dx=mouse.worldX-player.x,dy=mouse.worldY-player.y,len=Math.hypot(dx,dy)||1,dist=Math.min(520,len);
  const x=player.x+dx/len*dist,y=player.y+dy/len*dist,r=(state.wide?205:165)*(1+player.terraRampartLevel*0.1);
  terraDamageCircle(x,y,r,scaledDamage(player.damage*(state.double?2.5:1.55)));
  for(const z of zombies) if(Math.hypot(z.x-x,z.y-y)<r+z.r) z.stunTime=Math.max(z.stunTime||0,45);
  terraStructures.push({type:"wall",x,y,r,life:300}); terraEffects.push({type:"wall",x,y,r,life:38,maxLife:38});
  if(state.overdrive || transcended.terraFault) terraEffects.push({type:"aftershock",x,y,r:r*1.35,delay:26,life:58,maxLife:58,damage:scaledDamage(player.damage*2.2)});
  player.terraECooldown=TERRA_E_COOLDOWN;
}

function activateTerraX() {
  if(player.terraXCooldown>0)return;
  const state=prepareTerraSkill(45);
  let x=player.x,y=player.y;
  if(terraStructures.length){x=terraStructures.reduce((s,v)=>s+(v.x2??v.x),0)/terraStructures.length;y=terraStructures.reduce((s,v)=>s+(v.y2??v.y),0)/terraStructures.length;}
  const count=terraStructures.length,r=(250+count*28)*(state.wide?1.25:1)*(transcended.terraRampart?1.3:1);
  for(const z of zombies){if(Math.hypot(z.x-x,z.y-y)<r*1.8){z.x+=(x-z.x)*0.55;z.y+=(y-z.y)*0.55;}}
  terraDamageCircle(x,y,r,scaledDamage(player.damage*(3.2+count*0.35)*(transcended.terraRampart?1.45:1)),state.double?0.05:0);
  if(state.double) terraEffects.push({type:"aftershock",x,y,r:r*1.12,delay:20,life:52,maxLife:52,damage:scaledDamage(player.damage*2.1)});
  if(state.overdrive) terraEffects.push({type:"aftershock",x,y,r:r*1.35,delay:38,life:70,maxLife:70,damage:scaledDamage(player.damage*2.8)});
  terraStructures.length=0; terraEffects.push({type:"collapse",x,y,r,life:42,maxLife:42}); player.terraXCooldown=TERRA_X_COOLDOWN;
}

function activateTerraR(){
  if(player.level<10||player.terraRCooldown>0)return;
  const state=prepareTerraSkill(100),angle=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);
  const length=state.wide?940:820,width=(state.wide?410:340)*(transcended.terraRampart?1.2:1);
  const field={type:"collapseField",x:player.x+Math.cos(angle)*45,y:player.y+Math.sin(angle)*45,angle,length,width,life:420,tick:0};
  for(let i=zombies.length-1;i>=0;i--){const z=zombies[i];if(!terraPointInField(z.x,z.y,field,z.r))continue;z.hp-=scaledDamage(player.damage*(state.double?7.5:5.5))+z.maxHp*(state.double?.12:.08);if(z.hp<=0)killZombie(i,z);}
  terraStructures.length=0;terraStructures.push(field);terraEffects.push({type:"continent",x:field.x,y:field.y,angle,length,width,life:72,maxLife:72});player.terraRCooldown=TERRA_R_COOLDOWN;
}

function updateTerra(){
  if(selectedCharacter!=="terra")return;
  for(const key of ["terraQCooldown","terraECooldown","terraXCooldown","terraRCooldown"])if(player[key]>0)player[key]--;
  if(player.terraVibrationDelay>0)player.terraVibrationDelay--;else if(!transcended.terraResonance&&player.terraVibration>0)player.terraVibration=Math.max(0,player.terraVibration-0.035);
  for(let i=terraStructures.length-1;i>=0;i--){const s=terraStructures[i];if(s.type==="collapseField"&&--s.tick<=0){s.tick=15;for(let j=zombies.length-1;j>=0;j--){const z=zombies[j];if(!terraPointInField(z.x,z.y,s,z.r))continue;z.hp-=scaledDamage(player.damage*.38)+z.maxHp*.006;if(z.hp<=0)killZombie(j,z);}}if(--s.life<=0)terraStructures.splice(i,1);}
  for(let i=terraEffects.length-1;i>=0;i--){const e=terraEffects[i];if(e.type==="aftershock"&&e.delay--===0)terraDamageCircle(e.x,e.y,e.r,e.damage);if(--e.life<=0)terraEffects.splice(i,1);}
}

function drawTerraEffects(){
  if(selectedCharacter!=="terra")return;worldStart();ctx.save();ctx.globalCompositeOperation="lighter";
  for(const s of terraStructures){ctx.strokeStyle="rgba(137,255,107,0.38)";ctx.shadowColor="#d4a94b";ctx.shadowBlur=12;ctx.lineWidth=s.type==="fault"?s.width*.18:5;ctx.beginPath();if(s.type==="fault"){ctx.moveTo(s.x,s.y);ctx.lineTo(s.x2,s.y2);ctx.stroke();}else if(s.type==="collapseField"){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);const gr=ctx.createLinearGradient(0,0,s.length,0);gr.addColorStop(0,"rgba(53,42,22,.35)");gr.addColorStop(.5,"rgba(97,78,32,.3)");gr.addColorStop(1,"rgba(37,70,29,.12)");ctx.fillStyle=gr;ctx.strokeStyle="rgba(170,229,92,.62)";ctx.lineWidth=6;ctx.rect(0,-s.width/2,s.length,s.width);ctx.fill();ctx.stroke();for(let n=0;n<9;n++){const px=s.length*(n+1)/10;ctx.strokeStyle=`rgba(230,180,73,${.25+(n%2)*.15})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,-s.width*.42);ctx.lineTo(px-45,s.width*.05);ctx.lineTo(px+28,s.width*.4);ctx.stroke();}ctx.restore();}else{ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.stroke();}}
  for(const e of terraEffects){const p=1-e.life/e.maxLife,a=Math.max(0,1-p);ctx.strokeStyle=`rgba(218,181,82,${a})`;ctx.shadowColor="#7aff78";ctx.shadowBlur=25;ctx.lineWidth=8;
    if(e.type==="fault"){ctx.lineWidth=Math.max(4,e.width*(1-p)*.45);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x2,e.y2);ctx.stroke();}
    else if(e.type==="shockwave"){
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const reach=e.range*Math.min(1,p*2.15),half=e.arc/2;
      const fan=ctx.createRadialGradient(0,0,28,0,0,reach);fan.addColorStop(0,`rgba(255,224,128,${a*.18})`);fan.addColorStop(.58,`rgba(131,190,77,${a*.34})`);fan.addColorStop(.88,`rgba(215,174,71,${a*.72})`);fan.addColorStop(1,"rgba(255,235,145,0)");ctx.fillStyle=fan;ctx.shadowColor="#aaff72";ctx.shadowBlur=28;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,reach,-half,half);ctx.closePath();ctx.fill();
      ctx.strokeStyle=`rgba(236,212,119,${a})`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,reach*.92,-half,half);ctx.stroke();
      for(let n=0;n<9;n++){const q=-half+(e.arc*n/8),d=reach*(.38+(n%3)*.18);ctx.fillStyle=n%2?`rgba(104,78,42,${a})`:`rgba(168,131,58,${a})`;ctx.beginPath();ctx.moveTo(Math.cos(q)*d,Math.sin(q)*d);ctx.lineTo(Math.cos(q-.055)*(d+25),Math.sin(q-.055)*(d+25));ctx.lineTo(Math.cos(q+.055)*(d+20),Math.sin(q+.055)*(d+20));ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    else if(e.type==="continent"){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const reach=e.length*Math.min(1,p*2.1);ctx.fillStyle=`rgba(121,94,35,${a*.28})`;ctx.strokeStyle=`rgba(188,255,104,${a})`;ctx.lineWidth=12;ctx.shadowBlur=35;ctx.beginPath();ctx.rect(0,-e.width/2,reach,e.width);ctx.fill();ctx.stroke();ctx.restore();}
    else{const rr=e.r*Math.min(1,p*2.3);if(e.type==="slam"){const grd=ctx.createRadialGradient(e.x,e.y,8,e.x,e.y,rr);grd.addColorStop(0,`rgba(255,220,116,${a*.5})`);grd.addColorStop(.55,`rgba(92,152,68,${a*.22})`);grd.addColorStop(1,"rgba(80,55,25,0)");ctx.fillStyle=grd;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill();for(let n=0;n<7;n++){const q=e.angle+n*Math.PI*2/7,d=rr*(.25+(n%3)*.12);ctx.strokeStyle=`rgba(224,179,78,${a*.85})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*12,e.y+Math.sin(q)*12);ctx.lineTo(e.x+Math.cos(q-.12)*d,e.y+Math.sin(q-.12)*d);ctx.lineTo(e.x+Math.cos(q+.08)*rr*.82,e.y+Math.sin(q+.08)*rr*.82);ctx.stroke();}ctx.strokeStyle=`rgba(196,255,122,${a*.75})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,rr*.66,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.stroke();}if(e.type==="wall"){for(let n=0;n<10;n++){const q=n*Math.PI*.2;ctx.fillStyle=`rgba(92,69,42,${a})`;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*rr,e.y+Math.sin(q)*rr);ctx.lineTo(e.x+Math.cos(q-.08)*(rr+42),e.y+Math.sin(q-.08)*(rr+42));ctx.lineTo(e.x+Math.cos(q+.08)*(rr+42),e.y+Math.sin(q+.08)*(rr+42));ctx.fill();}}}
  }ctx.restore();worldEnd();
}
