// 아크: 태양 표식과 열기를 폭발시키는 광역 마법사
const ARC_Q_COOLDOWN = 360;
const ARC_E_COOLDOWN = 300;
const ARC_X_COOLDOWN = 600;
const ARC_R_COOLDOWN = 3000;

function addArcHeat(amount) {
  const gain = amount * (1 + player.arcHeatLevel * 0.2);
  player.arcHeat = Math.min(100, player.arcHeat + gain);
  player.arcHeatDelay = 150;
}

function spendArcHeat(amount) {
  player.arcHeat = Math.max(0, player.arcHeat - amount);
}

function arcAreaScale() {
  return (1 + player.arcCoronaLevel * 0.12) * (1 + player.arcHeat * 0.003);
}

function damageArcArea(x, y, radius, damage, mark = false, maxHpRatio = 0) {
  let hits = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (Math.hypot(z.x - x, z.y - y) > radius + z.r) continue;
    let dealt = damage + z.maxHp * maxHpRatio;
    if (z.arcMark) dealt *= 1 + player.arcBrandLevel * 0.15;
    z.hp -= dealt;
    if (mark) z.arcMark = 300;
    hits++;
    if (z.hp <= 0) killZombie(i, z);
  }
  return hits;
}

function attackWithArc() {
  if (player.fireCooldown > 0) return;
  const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  arcProjectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, r: 11, damage: scaledDamage(player.damage), life: 42 });
  player.fireCooldown = Math.max(13, 22 - player.fireRateBonus);
  arcEffects.push({ type: "cast", x: player.x, y: player.y, angle, life: 12, maxLife: 12 });
}

function activateArcQ() {
  if (player.arcQCooldown > 0) return;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y;
  const length = Math.hypot(dx, dy) || 1, distance = Math.min(520, length);
  const x = player.x + dx / length * distance, y = player.y + dy / length * distance;
  const radius = 150 * arcAreaScale();
  spendArcHeat(12);
  arcZones.push({ x, y, r: radius, life: 240, tick: 0, type: "sun" });
  arcEffects.push({ type: "sunCast", x, y, r: radius, life: 34, maxLife: 34 });
  if (transcended.arcCorona) arcZones.push({ x: x + 95, y: y - 55, r: radius * 0.72, life: 240, tick: 8, type: "sun" });
  player.arcQCooldown = ARC_Q_COOLDOWN;
}

function activateArcE() {
  if (player.arcECooldown > 0) return;
  const heatBeforeCast = player.arcHeat;
  const radius = 245 * arcAreaScale();
  spendArcHeat(18);
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i], dx = z.x - player.x, dy = z.y - player.y, distance = Math.hypot(dx, dy);
    if (distance > radius + z.r) continue;
    if (z.arcMark) {
      z.hp -= scaledDamage(player.damage * (2.1 + player.arcBrandLevel * 0.25));
      z.arcMark = 0;
    } else {
      const push = 70, safe = distance || 1;
      z.x += dx / safe * push; z.y += dy / safe * push;
      z.hp -= scaledDamage(player.damage * 1.25);
    }
    if (z.hp <= 0) killZombie(i, z);
  }
  arcEffects.push({ type: "wave", x: player.x, y: player.y, r: radius, life: 28, maxLife: 28 });
  if (heatBeforeCast >= 50) arcZones.push({ x: player.x, y: player.y, r: radius * 0.72, life: 150, tick: 0, type: "burn" });
  player.arcECooldown = ARC_E_COOLDOWN;
}

function activateArcX() {
  if (player.arcXCooldown > 0) return;
  const heatBeforeCast = player.arcHeat;
  const dx = mouse.worldX - player.x, dy = mouse.worldY - player.y, length = Math.hypot(dx, dy) || 1;
  const distance = Math.min(620, length);
  const radius = 255 * arcAreaScale();
  spendArcHeat(25);
  arcEffects.push({ type: "meteor", x: player.x + dx / length * distance, y: player.y + dy / length * distance, r: radius, highHeat: heatBeforeCast >= 50, doubleBurst: heatBeforeCast >= 100, delay: 42, life: 76, maxLife: 76 });
  player.arcXCooldown = ARC_X_COOLDOWN;
}

function activateArcR() {
  if (player.level < 10 || player.arcRCooldown > 0) return;
  const storedZones = arcZones.length;
  arcZones.length = 0;
  let marks = 0;
  for (const z of zombies) { if (z.arcMark) { marks++; z.arcMark = 0; } }
  const radius = Math.min(900, (590 + storedZones * 28 + marks * 4) * arcAreaScale());
  const doubleBurst = player.arcHeat >= 100;
  damageArcArea(player.x, player.y, radius, scaledDamage(player.damage * (5.5 + storedZones * 0.35)), 0, 0.1);
  if (doubleBurst) damageArcArea(player.x, player.y, radius, scaledDamage(player.damage * 3), true, 0.05);
  player.arcHeat = 0;
  player.arcRCooldown = ARC_R_COOLDOWN;
  arcEffects.push({ type: "supernova", x: player.x, y: player.y, r: radius, life: 55, maxLife: 55 });
}

function updateArc() {
  if (selectedCharacter !== "arc") return;
  for (const key of ["arcQCooldown", "arcECooldown", "arcXCooldown", "arcRCooldown"]) if (player[key] > 0) player[key]--;
  if (player.arcHeatDelay > 0) player.arcHeatDelay--;
  else if (!transcended.arcHeat && player.arcHeat > 0) player.arcHeat = Math.max(0, player.arcHeat - 0.045);
  for (const z of zombies) if (z.arcMark > 0) z.arcMark--;

  for (let i = arcProjectiles.length - 1; i >= 0; i--) {
    const p = arcProjectiles[i]; p.x += p.vx; p.y += p.vy; p.life--;
    let remove = p.life <= 0;
    for (let j = zombies.length - 1; j >= 0 && !remove; j--) {
      const z = zombies[j];
      if (Math.hypot(z.x - p.x, z.y - p.y) > z.r + p.r) continue;
      const blastRadius = 82 * arcAreaScale();
      const hits = damageArcArea(p.x, p.y, blastRadius, p.damage, true);
      addArcHeat(Math.min(20, hits * 4));
      remove = true;
      arcEffects.push({ type: "burst", x: p.x, y: p.y, r: blastRadius, life: 18, maxLife: 18 });
    }
    if (remove) arcProjectiles.splice(i, 1);
  }

  for (let i = arcZones.length - 1; i >= 0; i--) {
    const zone = arcZones[i]; zone.life--; zone.tick--;
    if (zone.tick <= 0) {
      zone.tick = zone.type === "sun" ? 18 : 24;
      damageArcArea(zone.x, zone.y, zone.r, scaledDamage(player.damage * (zone.type === "sun" ? 0.42 : 0.3)), zone.type === "sun");
      for (const z of zombies) if (zone.type === "sun" && Math.hypot(z.x - zone.x, z.y - zone.y) < zone.r) { z.x += (zone.x - z.x) * 0.035; z.y += (zone.y - z.y) * 0.035; }
    }
    if (zone.life <= 0) arcZones.splice(i, 1);
  }

  for (let i = arcEffects.length - 1; i >= 0; i--) {
    const effect = arcEffects[i];
    if (effect.type === "meteor" && effect.delay-- === 0) {
      const doubleBurst = effect.doubleBurst;
      damageArcArea(effect.x, effect.y, effect.r, scaledDamage(player.damage * 4.2), true, 0.06);
      if (doubleBurst) damageArcArea(effect.x, effect.y, effect.r * 1.08, scaledDamage(player.damage * 2.2), true, 0.03);
      if (effect.highHeat) arcZones.push({ x: effect.x, y: effect.y, r: effect.r * 0.68, life: 180, tick: 0, type: "burn" });
    }
    effect.life--;
    if (effect.life <= 0) arcEffects.splice(i, 1);
  }
}

function drawArcEffects() {
  if (selectedCharacter !== "arc") return;
  worldStart();
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const zone of arcZones) {
    const pulse = 0.94 + Math.sin(zone.life * 0.12) * 0.04;
    const gradient = ctx.createRadialGradient(zone.x, zone.y, 10, zone.x, zone.y, zone.r);
    gradient.addColorStop(0, zone.type === "sun" ? "rgba(255,210,70,0.32)" : "rgba(255,80,15,0.2)"); gradient.addColorStop(0.72, "rgba(255,75,8,0.11)"); gradient.addColorStop(1, "rgba(255,55,0,0)");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = zone.type === "sun" ? "rgba(255,190,48,0.8)" : "rgba(255,80,25,0.55)"; ctx.shadowColor = "#ff6d18"; ctx.shadowBlur = 18; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(zone.x, zone.y, zone.r * 0.58, -zone.life * 0.02, Math.PI * 1.5 - zone.life * 0.02); ctx.stroke();
    for(let ray=0;ray<12;ray++){const q=ray*Math.PI/6-zone.life*.006,inner=zone.r*.64,outer=zone.r*(.78+(ray%3)*.055);ctx.strokeStyle=`rgba(255,205,72,${zone.type==="sun"?.34:.18})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(zone.x+Math.cos(q)*inner,zone.y+Math.sin(q)*inner);ctx.lineTo(zone.x+Math.cos(q)*outer,zone.y+Math.sin(q)*outer);ctx.stroke();}
  }
  for (const p of arcProjectiles) { ctx.fillStyle = "#fff4a8"; ctx.shadowColor = "#ff6b16"; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  for (const effect of arcEffects) {
    const progress = 1 - effect.life / effect.maxLife, alpha = Math.max(0, 1 - progress);
    if(effect.type==="sunCast"){
      const radius=effect.r*(.25+progress*.75);ctx.strokeStyle=`rgba(255,231,129,${alpha})`;ctx.lineWidth=5;ctx.shadowColor="#ff7b18";ctx.shadowBlur=28;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.arc(effect.x,effect.y,radius*(.45+ring*.25),-progress*4+ring,Math.PI*1.5-progress*4+ring);ctx.stroke();}for(let ray=0;ray<8;ray++){const q=ray*Math.PI/4+progress*1.8;ctx.beginPath();ctx.moveTo(effect.x+Math.cos(q)*radius*.18,effect.y+Math.sin(q)*radius*.18);ctx.lineTo(effect.x+Math.cos(q)*radius,effect.y+Math.sin(q)*radius);ctx.stroke();}
    } else if (effect.type === "wave" || effect.type === "burst" || effect.type === "supernova") {
      const radius = effect.r * Math.min(1, progress * 2.3); ctx.strokeStyle = effect.type === "supernova" ? `rgba(255,250,210,${alpha})` : `rgba(255,122,25,${alpha})`; ctx.shadowColor = "#ff9d20"; ctx.shadowBlur = effect.type === "supernova" ? 48 : 25; ctx.lineWidth = effect.type === "supernova" ? 22 : 9; ctx.beginPath(); ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2); ctx.stroke();
      const rays=effect.type==="supernova"?28:12;for(let n=0;n<rays;n++){const q=n*Math.PI*2/rays+progress*(effect.type==="supernova"?1.2:-.7),inner=radius*(effect.type==="supernova"?.18:.55),outer=radius*(.82+(n%4)*.08);ctx.strokeStyle=`rgba(255,${effect.type==="supernova"?240:145},70,${alpha*.72})`;ctx.lineWidth=effect.type==="supernova"?5:3;ctx.beginPath();ctx.moveTo(effect.x+Math.cos(q)*inner,effect.y+Math.sin(q)*inner);ctx.lineTo(effect.x+Math.cos(q)*outer,effect.y+Math.sin(q)*outer);ctx.stroke();}
    } else if (effect.type === "meteor") {
      const warning = effect.delay > 0; ctx.strokeStyle = warning ? "rgba(255,105,22,0.8)" : `rgba(255,245,190,${alpha})`; ctx.shadowColor = "#ff5417"; ctx.shadowBlur = 30; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.r * (warning ? 0.9 + Math.sin(effect.delay * 0.3) * 0.05 : Math.min(1, progress * 2)), 0, Math.PI * 2); ctx.stroke(); if(warning){const fall=1-effect.delay/42;const mx=effect.x+effect.r*(.55-fall*.55),my=effect.y-effect.r*(1.8-fall*1.8);const trail=ctx.createLinearGradient(mx,my,mx-effect.r*.42,my-effect.r*.75);trail.addColorStop(0,"rgba(255,248,190,.95)");trail.addColorStop(1,"rgba(255,55,8,0)");ctx.strokeStyle=trail;ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx-effect.r*.42,my-effect.r*.75);ctx.stroke();ctx.fillStyle="#fff4b0";ctx.beginPath();ctx.arc(mx,my,12+fall*14,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle=`rgba(255,90,10,${alpha * 0.2})`;ctx.fill();for(let n=0;n<16;n++){const q=n*Math.PI/8,rr=effect.r*progress*(.2+(n%4)*.12);ctx.fillStyle=`rgba(255,176,55,${alpha})`;ctx.beginPath();ctx.arc(effect.x+Math.cos(q)*rr,effect.y+Math.sin(q)*rr,3+n%3,0,Math.PI*2);ctx.fill();}}
    }
  }
  ctx.restore(); worldEnd();
}
