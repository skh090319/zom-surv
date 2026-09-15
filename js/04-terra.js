// 테라: 진동을 모아 지형을 만들고 한 번에 붕괴시키는 광역 전사
const TERRA_Q_COOLDOWN = 300, TERRA_E_COOLDOWN = 420, TERRA_X_COOLDOWN = 660, TERRA_R_COOLDOWN = 3300;

function addTerraVibration(amount) {
  player.terraVibration = Math.min(100, player.terraVibration + amount * (1 + player.terraResonanceLevel * 0.2));
  player.terraVibrationDelay = 180;
}

function prepareTerraSkill(cost) {
  const vibration = player.terraVibration;
  const empowered = vibration >= 100;
  // 진동은 스킬 비용으로 쓰지 않는다. 100에 도달했을 때만 강화 발동 후 전부 소모한다.
  if (empowered) player.terraVibration = 0;
  return { vibration, wide: empowered, double: empowered, overdrive: empowered };
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
    for (let s = terraStructures.length - 1; s >= 0; s--) {
      const structure = terraStructures[s];
      if (structure.type !== "wall" || !structure.rocks) continue;
      for (let r = structure.rocks.length - 1; r >= 0; r--) {
        const rock = structure.rocks[r], dx = rock.x - player.x, dy = rock.y - player.y;
        if (Math.hypot(dx, dy) > range + rock.size || Math.abs(paladinAngleDifference(Math.atan2(dy, dx), angle)) > arc / 2) continue;
        const spread = paladinAngleDifference(Math.atan2(dy, dx), angle) * .22;
        terraRockProjectiles.push({ x:rock.x,y:rock.y,r:rock.size,variant:rock.variant??r%4,angle:rock.angle||0,vx:Math.cos(angle+spread)*14,vy:Math.sin(angle+spread)*14,damage:scaledDamage(player.damage*2.1),life:48,spin:(r%2?1:-1)*.16 });
        structure.rocks.splice(r,1);
      }
      if (structure.rocks.length === 0) terraStructures.splice(s,1);
    }
    terraEffects.push({ type: "shockwave", x: player.x, y: player.y, angle, range, arc, life: 30, maxLife: 30 });
  }
  player.fireCooldown = Math.max(18, 29 - player.fireRateBonus);
}

function activateTerraQ() {
  if (player.terraQCooldown > 0) return;
  const state = prepareTerraSkill(20), angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  const length = (state.wide ? 570 : 460) * (1 + player.terraFaultLevel * 0.1), width = state.wide ? 120 : 90;
  const x2 = player.x + Math.cos(angle) * length, y2 = player.y + Math.sin(angle) * length;
  const pulls = [];
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i]; if (distanceToNightLordSegment(z.x,z.y,player.x,player.y,x2,y2) > width + z.r) continue;
    z.hp -= scaledDamage(player.damage * (state.double ? 2.8 : 1.7));
    const along = (z.x-player.x)*Math.cos(angle)+(z.y-player.y)*Math.sin(angle);
    const cx=player.x+Math.cos(angle)*along, cy=player.y+Math.sin(angle)*along;
    pulls.push({ id:z.id, fromX:z.x, fromY:z.y, toX:cx, toY:cy });
    if (z.hp <= 0) killZombie(i,z);
  }
  terraStructures.push({ type:"fault", x:player.x, y:player.y, x2,y2, width, life:300 });
  terraEffects.push({ type:"fault", x:player.x,y:player.y,x2,y2,width,pulls,life:32,maxLife:32 });
  if (state.overdrive || transcended.terraFault) terraEffects.push({ type:"aftershock",x:x2,y:y2,r:220,delay:24,life:55,maxLife:55,damage:scaledDamage(player.damage*2.4) });
  player.terraQCooldown=TERRA_Q_COOLDOWN;
}

function activateTerraE() {
  if (player.terraECooldown > 0) return;
  const state=prepareTerraSkill(30), dx=mouse.worldX-player.x,dy=mouse.worldY-player.y,len=Math.hypot(dx,dy)||1,dist=Math.min(520,len);
  const x=player.x+dx/len*dist,y=player.y+dy/len*dist,r=(state.wide?205:165)*(1+player.terraRampartLevel*0.1);
  terraDamageCircle(x,y,r,scaledDamage(player.damage*(state.double?2.5:1.55)));
  for(const z of zombies) if(Math.hypot(z.x-x,z.y-y)<r+z.r) z.stunTime=Math.max(z.stunTime||0,45);
  const rocks=Array.from({length:14},(_,n)=>{const a=n*Math.PI*2/14;return{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,size:22+(n%4)*4,angle:a,variant:n%4};});
  terraStructures.push({type:"wall",x,y,r,rocks,persistent:true}); terraEffects.push({type:"wall",x,y,r,rocks,life:38,maxLife:38});
  if(state.overdrive || transcended.terraFault) terraEffects.push({type:"aftershock",x,y,r:r*1.35,delay:26,life:58,maxLife:58,damage:scaledDamage(player.damage*2.2)});
  player.terraECooldown=TERRA_E_COOLDOWN;
}

function activateTerraX() {
  if(player.terraXCooldown>0)return;
  const state=prepareTerraSkill(45);
  const destructible=terraStructures.filter(s=>s.type!=="collapseField");
  let x=player.x,y=player.y;
  if(destructible.length){x=destructible.reduce((s,v)=>s+(v.x2??v.x),0)/destructible.length;y=destructible.reduce((s,v)=>s+(v.y2??v.y),0)/destructible.length;}
  const count=destructible.length,r=(250+count*28)*(state.wide?1.25:1)*(transcended.terraRampart?1.3:1);
  const debris=[];
  for(const s of destructible){if(s.type==="wall"&&s.rocks)debris.push(...s.rocks.map(v=>({...v})));else if(s.type==="fault")for(let n=1;n<=9;n++){const t=n/10;debris.push({x:s.x+(s.x2-s.x)*t+(n%2?1:-1)*s.width*.22,y:s.y+(s.y2-s.y)*t,size:13+n%3*5,angle:n});}}
  debris.forEach((rock,n)=>{const launchAngle=n*Math.PI*2/Math.max(1,debris.length)+(Math.sin(n*8.31)*.16);const speed=10+(n%5)*1.15;terraRockProjectiles.push({x,y,r:rock.size,variant:rock.variant??n%4,angle:rock.angle||launchAngle,vx:Math.cos(launchAngle)*speed,vy:Math.sin(launchAngle)*speed,damage:scaledDamage(player.damage*1.75),life:52+(n%4)*5,delay:8+(n%3)*2,spin:(n%2?1:-1)*(.13+(n%3)*.03)});});
  for(const z of zombies){if(Math.hypot(z.x-x,z.y-y)<r*1.8){z.x+=(x-z.x)*0.55;z.y+=(y-z.y)*0.55;}}
  terraDamageCircle(x,y,r,scaledDamage(player.damage*(3.2+count*0.35)*(transcended.terraRampart?1.45:1)),state.double?0.05:0);
  if(state.double) terraEffects.push({type:"aftershock",x,y,r:r*1.12,delay:20,life:52,maxLife:52,damage:scaledDamage(player.damage*2.1)});
  if(state.overdrive) terraEffects.push({type:"aftershock",x,y,r:r*1.35,delay:38,life:70,maxLife:70,damage:scaledDamage(player.damage*2.8)});
  // X는 설치한 바위와 일반 균열만 부수며, 진행 중인 궁극기 지대는 유지한다.
  terraStructures = terraStructures.filter(s=>s.type==="collapseField"); terraEffects.push({type:"collapse",x,y,r,debris:[],life:48,maxLife:48}); player.terraXCooldown=TERRA_X_COOLDOWN;
}

function activateTerraR(){
  if(player.level<10||player.terraRCooldown>0)return;
  const state=prepareTerraSkill(100),angle=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);
  const length=state.wide?940:820,width=(state.wide?410:340)*(transcended.terraRampart?1.2:1);
  const fieldX=player.x+Math.cos(angle)*45,fieldY=player.y+Math.sin(angle)*45;
  const borderRocks=[];
  const rockCount=Math.max(14,Math.floor(length/58));
  for(let side=-1;side<=1;side+=2)for(let n=0;n<=rockCount;n++){
    const forward=length*n/rockCount,offset=side*width*.5;
    borderRocks.push({x:fieldX+Math.cos(angle)*forward-Math.sin(angle)*offset,y:fieldY+Math.sin(angle)*forward+Math.cos(angle)*offset,size:18+(n%4)*4,angle:angle+n*.71+side,variant:(n+(side>0?1:3))%4,delay:Math.floor(n*1.25)});
  }
  const field={type:"collapseField",x:fieldX,y:fieldY,angle,length,width,life:420,tick:0,borderRocks};
  for(let i=zombies.length-1;i>=0;i--){const z=zombies[i];if(!terraPointInField(z.x,z.y,field,z.r))continue;z.hp-=scaledDamage(player.damage*(state.double?7.5:5.5))+z.maxHp*(state.double?.12:.08);if(z.hp<=0)killZombie(i,z);}
  terraStructures.push(field);terraEffects.push({type:"continent",x:field.x,y:field.y,angle,length,width,borderRocks,life:96,maxLife:96});player.terraRCooldown=TERRA_R_COOLDOWN;
}

function updateTerra(){
  if(selectedCharacter!=="terra")return;
  for(const key of ["terraQCooldown","terraECooldown","terraXCooldown","terraRCooldown"])if(player[key]>0)player[key]--;
  if(player.terraVibrationDelay>0)player.terraVibrationDelay--;else if(!transcended.terraResonance&&player.terraVibration>0)player.terraVibration=Math.max(0,player.terraVibration-0.035);
  for(let i=terraStructures.length-1;i>=0;i--){const s=terraStructures[i];if(s.type==="collapseField"&&--s.tick<=0){s.tick=15;for(let j=zombies.length-1;j>=0;j--){const z=zombies[j];if(!terraPointInField(z.x,z.y,s,z.r))continue;z.hp-=scaledDamage(player.damage*.38)+z.maxHp*.006;if(z.hp<=0)killZombie(j,z);}}if(!s.persistent&&--s.life<=0)terraStructures.splice(i,1);}
  for(let i=terraRockProjectiles.length-1;i>=0;i--){const rock=terraRockProjectiles[i];if(rock.delay>0){rock.delay--;continue;}rock.x+=rock.vx;rock.y+=rock.vy;rock.angle+=rock.spin;rock.vx*=.992;rock.vy*=.992;rock.life--;let broken=rock.life<=0||rock.x<-80||rock.y<-80||rock.x>WORLD.width+80||rock.y>WORLD.height+80;for(let j=zombies.length-1;j>=0&&!broken;j--){const z=zombies[j];if(Math.hypot(z.x-rock.x,z.y-rock.y)>z.r+rock.r*.78)continue;z.hp-=rock.damage;terraDamageCircle(rock.x,rock.y,rock.r*2.3,scaledDamage(player.damage*.48));broken=true;if(z.hp<=0){const index=zombies.indexOf(z);if(index>=0)killZombie(index,z);}}if(broken){terraEffects.push({type:"rockBreak",x:rock.x,y:rock.y,r:rock.r,variant:rock.variant,angle:rock.angle,life:24,maxLife:24});terraRockProjectiles.splice(i,1);}}
  for(let i=terraEffects.length-1;i>=0;i--){const e=terraEffects[i];if(e.type==="fault"&&e.pulls){const progress=Math.min(1,(e.maxLife-e.life)/18),ease=1-Math.pow(1-progress,3);for(const pull of e.pulls){const z=zombies.find(v=>v.id===pull.id);if(z){z.x=pull.fromX+(pull.toX-pull.fromX)*ease;z.y=pull.fromY+(pull.toY-pull.fromY)*ease;}}}if(e.type==="aftershock"&&e.delay--===0)terraDamageCircle(e.x,e.y,e.r,e.damage);if(--e.life<=0)terraEffects.splice(i,1);}
}

function drawTerraBoulder(rock, x, y, size, alpha = 1, rotation = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation + (rock.angle || 0) * .17); ctx.globalAlpha *= alpha;
  if (terraRockAtlasLoaded || (terraRockAtlas.complete && terraRockAtlas.naturalWidth > 0)) {
    const variant = Math.abs(rock.variant ?? Math.floor((rock.angle || 0) * 17)) % 4;
    const sw = terraRockAtlas.naturalWidth / 2, sh = terraRockAtlas.naturalHeight / 2;
    ctx.shadowColor = "rgba(0,0,0,.76)"; ctx.shadowBlur = 9; ctx.shadowOffsetY = 5;
    ctx.drawImage(terraRockAtlas, (variant % 2) * sw, Math.floor(variant / 2) * sh, sw, sh, -size * 1.08, -size * 1.08, size * 2.16, size * 2.16);
    ctx.restore(); return;
  }
  const points = 9, seed = (rock.angle || 1) * 13.71 + size;
  const stone = ctx.createRadialGradient(-size * .32, -size * .38, 1, 0, 0, size * 1.1);
  stone.addColorStop(0, "#a18a68"); stone.addColorStop(.28, "#75654f"); stone.addColorStop(.7, "#4b4439"); stone.addColorStop(1, "#25231f");
  ctx.fillStyle = stone; ctx.strokeStyle = "rgba(24,22,19,.95)"; ctx.lineWidth = Math.max(1.5, size * .075); ctx.shadowColor = "rgba(0,0,0,.72)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  ctx.beginPath();
  for (let n = 0; n < points; n++) { const q = n * Math.PI * 2 / points; const jag = .78 + ((Math.sin(seed + n * 5.17) + 1) * .11); const px = Math.cos(q) * size * jag, py = Math.sin(q) * size * jag; if (!n) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "rgba(205,186,151,.16)"; ctx.beginPath(); ctx.moveTo(-size*.58,-size*.18);ctx.lineTo(-size*.18,-size*.62);ctx.lineTo(size*.18,-size*.42);ctx.lineTo(-size*.08,-size*.05);ctx.closePath();ctx.fill();
  ctx.strokeStyle = "rgba(32,29,25,.82)"; ctx.lineWidth = Math.max(1.2,size*.055); ctx.beginPath();ctx.moveTo(-size*.35,-size*.22);ctx.lineTo(size*.02,size*.02);ctx.lineTo(size*.34,-size*.18);ctx.moveTo(size*.02,size*.02);ctx.lineTo(-size*.12,size*.45);ctx.moveTo(size*.02,size*.02);ctx.lineTo(size*.42,size*.32);ctx.stroke();
  ctx.strokeStyle = "rgba(192,163,105,.22)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-size*.5,size*.18);ctx.quadraticCurveTo(0,size*.36,size*.52,size*.08);ctx.stroke();ctx.restore();
}

function drawTerraEffects(){
  if(selectedCharacter!=="terra")return;worldStart();ctx.save();ctx.globalCompositeOperation="lighter";
  for(const s of terraStructures){ctx.strokeStyle="rgba(137,255,107,0.38)";ctx.shadowColor="#d4a94b";ctx.shadowBlur=12;ctx.lineWidth=s.type==="fault"?s.width*.18:5;ctx.beginPath();if(s.type==="fault"){ctx.moveTo(s.x,s.y);ctx.lineTo(s.x2,s.y2);ctx.stroke();}else if(s.type==="wall"){ctx.globalCompositeOperation="source-over";for(const rock of s.rocks)drawTerraBoulder(rock,rock.x,rock.y,rock.size,1);ctx.globalCompositeOperation="lighter";}else if(s.type==="collapseField"){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);const gr=ctx.createLinearGradient(0,0,s.length,0);gr.addColorStop(0,"rgba(53,42,22,.35)");gr.addColorStop(.5,"rgba(97,78,32,.3)");gr.addColorStop(1,"rgba(37,70,29,.12)");ctx.fillStyle=gr;ctx.strokeStyle="rgba(170,229,92,.62)";ctx.lineWidth=6;ctx.rect(0,-s.width/2,s.length,s.width);ctx.fill();ctx.stroke();for(let n=0;n<13;n++){const px=s.length*(n+1)/14;ctx.strokeStyle=`rgba(230,180,73,${.25+(n%2)*.15})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,-s.width*.42);ctx.lineTo(px-45,s.width*.05);ctx.lineTo(px+28,s.width*.4);ctx.stroke();}ctx.restore();ctx.globalCompositeOperation="source-over";for(const rock of s.borderRocks||[])drawTerraBoulder(rock,rock.x,rock.y,rock.size,1);ctx.globalCompositeOperation="lighter";}else{ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.stroke();}}
  ctx.globalCompositeOperation="source-over";for(const rock of terraRockProjectiles)drawTerraBoulder(rock,rock.x,rock.y,rock.r,rock.delay>0?.7:1,rock.angle);ctx.globalCompositeOperation="lighter";
  for(const e of terraEffects){const p=1-e.life/e.maxLife,a=Math.max(0,1-p);ctx.strokeStyle=`rgba(218,181,82,${a})`;ctx.shadowColor="#7aff78";ctx.shadowBlur=25;ctx.lineWidth=8;
    if(e.type==="fault"){ctx.save();const angle=Math.atan2(e.y2-e.y,e.x2-e.x),length=Math.hypot(e.x2-e.x,e.y2-e.y);ctx.translate(e.x,e.y);ctx.rotate(angle);ctx.lineWidth=Math.max(4,e.width*(1-p)*.32);ctx.strokeStyle=`rgba(189,235,101,${a*.5})`;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(length*Math.min(1,p*2.4),0);ctx.stroke();ctx.lineWidth=3;for(let n=1;n<9;n++){const px=length*n/9,jag=(n%2?1:-1)*e.width*.32;ctx.strokeStyle=`rgba(235,185,79,${a})`;ctx.beginPath();ctx.moveTo(px-38,jag);ctx.lineTo(px,0);ctx.lineTo(px+28,-jag*.65);ctx.stroke();const pull=Math.max(0,1-p*1.4);ctx.strokeStyle=`rgba(164,255,130,${a*.85})`;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,jag*(1+pull));ctx.lineTo(px,jag*.2);ctx.stroke();ctx.beginPath();ctx.moveTo(px-7,jag*.34);ctx.lineTo(px,jag*.2);ctx.lineTo(px+7,jag*.34);ctx.stroke();}ctx.restore();}
    else if(e.type==="shockwave"){
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const reach=e.range*Math.min(1,p*2.15),half=e.arc/2;
      const fan=ctx.createRadialGradient(0,0,28,0,0,reach);fan.addColorStop(0,`rgba(255,224,128,${a*.18})`);fan.addColorStop(.58,`rgba(131,190,77,${a*.34})`);fan.addColorStop(.88,`rgba(215,174,71,${a*.72})`);fan.addColorStop(1,"rgba(255,235,145,0)");ctx.fillStyle=fan;ctx.shadowColor="#aaff72";ctx.shadowBlur=28;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,reach,-half,half);ctx.closePath();ctx.fill();
      ctx.strokeStyle=`rgba(236,212,119,${a})`;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,reach*.92,-half,half);ctx.stroke();
      for(let n=0;n<9;n++){const q=-half+(e.arc*n/8),d=reach*(.38+(n%3)*.18);ctx.fillStyle=n%2?`rgba(104,78,42,${a})`:`rgba(168,131,58,${a})`;ctx.beginPath();ctx.moveTo(Math.cos(q)*d,Math.sin(q)*d);ctx.lineTo(Math.cos(q-.055)*(d+25),Math.sin(q-.055)*(d+25));ctx.lineTo(Math.cos(q+.055)*(d+20),Math.sin(q+.055)*(d+20));ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    else if(e.type==="continent"){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const reach=e.length*Math.min(1,p*2.35),quake=Math.sin(p*Math.PI*12)*(1-p)*7;ctx.translate(0,quake);const earth=ctx.createLinearGradient(0,-e.width/2,0,e.width/2);earth.addColorStop(0,`rgba(48,35,19,${a*.18})`);earth.addColorStop(.5,`rgba(174,119,35,${a*.42})`);earth.addColorStop(1,`rgba(49,76,27,${a*.2})`);ctx.fillStyle=earth;ctx.strokeStyle=`rgba(208,255,126,${a})`;ctx.lineWidth=10;ctx.shadowBlur=38;ctx.beginPath();ctx.rect(0,-e.width/2,reach,e.width);ctx.fill();ctx.stroke();for(let n=1;n<16;n++){const px=reach*n/16,zig=(n%2?1:-1)*e.width*.22;ctx.strokeStyle=`rgba(255,203,92,${a*(.45+n%3*.12)})`;ctx.lineWidth=2+n%3;ctx.beginPath();ctx.moveTo(px,-e.width*.44);ctx.lineTo(px-28,zig);ctx.lineTo(px+19,e.width*.42);ctx.stroke();}ctx.restore();ctx.globalCompositeOperation="source-over";for(const rock of e.borderRocks||[]){const local=(e.maxLife-e.life)-rock.delay;if(local<0)continue;const rise=Math.min(1,local/14);drawTerraBoulder(rock,rock.x,rock.y+((1-rise)*34),rock.size*(.45+.55*rise),a,Math.sin(local*.18)*.08);}ctx.globalCompositeOperation="lighter";}
    else if(e.type==="collapse"){const gather=Math.min(1,p/.42),burst=Math.max(0,(p-.42)/.58),ease=1-Math.pow(1,gather,3);ctx.globalCompositeOperation="source-over";for(const rock of e.debris){const baseX=rock.x+(e.x-rock.x)*ease*.9,baseY=rock.y+(e.y-rock.y)*ease*.9;if(burst<=0){drawTerraBoulder(rock,baseX,baseY,Math.max(4,rock.size*(1-ease*.35)),a,p*4);}else{for(let shard=0;shard<4;shard++){const q=(rock.angle||0)+shard*Math.PI*.5+Math.sin(rock.size+shard)*.35;const force=(36+rock.size*1.8)*(1-Math.pow(1-burst,2));const sx=baseX+Math.cos(q)*force,sy=baseY+Math.sin(q)*force;drawTerraBoulder({...rock,angle:q},sx,sy,Math.max(2,rock.size*(.34-shard*.035)*(1-burst*.7)),a,burst*9*(shard%2?1:-1));}}}ctx.globalCompositeOperation="lighter";if(burst>0){for(let dust=0;dust<18;dust++){const q=dust*Math.PI*2/18+(Math.sin(dust*12.73)*.5+.5)*.2,d=e.r*burst*(.18+(dust%5)*.045);ctx.fillStyle=`rgba(151,126,89,${a*.22})`;ctx.beginPath();ctx.arc(e.x+Math.cos(q)*d,e.y+Math.sin(q)*d,8+(dust%4)*3,0,Math.PI*2);ctx.fill();}}ctx.strokeStyle=`rgba(224,188,95,${a})`;ctx.lineWidth=10;ctx.beginPath();ctx.arc(e.x,e.y,e.r*Math.min(1,burst*1.8),0,Math.PI*2);ctx.stroke();}
    else if(e.type==="rockBreak"){ctx.globalCompositeOperation="source-over";for(let shard=0;shard<6;shard++){const q=e.angle+shard*Math.PI/3,dist=p*e.r*3.4;drawTerraBoulder({angle:q,size:e.r,variant:(e.variant+shard)%4},e.x+Math.cos(q)*dist,e.y+Math.sin(q)*dist,e.r*(.34-shard*.018)*(1-p*.72),a,p*8*(shard%2?1:-1));}ctx.globalCompositeOperation="lighter";ctx.fillStyle=`rgba(157,132,94,${a*.28})`;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1+p*2),0,Math.PI*2);ctx.fill();}
    else{const rr=e.r*Math.min(1,p*2.3);if(e.type==="slam"){const grd=ctx.createRadialGradient(e.x,e.y,8,e.x,e.y,rr);grd.addColorStop(0,`rgba(255,220,116,${a*.5})`);grd.addColorStop(.55,`rgba(92,152,68,${a*.22})`);grd.addColorStop(1,"rgba(80,55,25,0)");ctx.fillStyle=grd;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill();for(let n=0;n<7;n++){const q=e.angle+n*Math.PI*2/7,d=rr*(.25+(n%3)*.12);ctx.strokeStyle=`rgba(224,179,78,${a*.85})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*12,e.y+Math.sin(q)*12);ctx.lineTo(e.x+Math.cos(q-.12)*d,e.y+Math.sin(q-.12)*d);ctx.lineTo(e.x+Math.cos(q+.08)*rr*.82,e.y+Math.sin(q+.08)*rr*.82);ctx.stroke();}ctx.strokeStyle=`rgba(196,255,122,${a*.75})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,rr*.66,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.stroke();}if(e.type==="wall"){const rise=Math.min(1,p*3);ctx.globalCompositeOperation="source-over";for(const rock of e.rocks){const rx=e.x+(rock.x-e.x)*Math.min(1,p*2),ry=e.y+(rock.y-e.y)*Math.min(1,p*2);drawTerraBoulder(rock,rx,ry,rock.size*rise,a,(1-rise)*-.4);}ctx.globalCompositeOperation="lighter";}}
  }ctx.restore();worldEnd();
}
