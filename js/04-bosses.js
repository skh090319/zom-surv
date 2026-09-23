// 2·4·6분 보스전: 타임라인, 패턴, 전용 투사체와 렌더링

const RAID_BOSS_TIMES = [120 * 60, 240 * 60, 360 * 60];
const RAID_BOSS_NAMES = ["맹독의 꽃 아마란스", "날개 달린 사신 모르스", "심연의 집행자 녹스"];
const RAID_BOSS_HP = [25000, 100000, 300000];
const RAID_BOSS_PERCENT_FLAT_PER_POINT = [140, 220, 320];
const raidBossImages = ["venom-bloom", "winged-reaper", "abyss-knight"].map(name => {
  const image = new Image();
  image.src = `assets/bosses/${name}.png`;
  return image;
});

let survivalFrames = 0;
let nextRaidBossIndex = 0;
let activeRaidBoss = null;
let raidBossProjectiles = [];
let raidBossZones = [];
let raidBossEffects = [];
let raidArena = null;
let raidIntroTime = 0;
let raidVictory = false;
let raidWarningPulse = 0;

function resetRaidBossSystem() {
  survivalFrames = 0;
  nextRaidBossIndex = 0;
  activeRaidBoss = null;
  raidBossProjectiles = [];
  raidBossZones = [];
  raidBossEffects = [];
  raidArena = null;
  raidIntroTime = 0;
  raidVictory = false;
  raidWarningPulse = 0;
  player.bossRootTime = 0;
  player.bossSlowTime = 0;
}

function purgeEnemiesForRaid() {
  // killZombie를 거치지 않으므로 점수·처치·경험치가 발생하지 않는다.
  zombies.length = 0;
  bullets.length = 0;
  droneBullets.length = 0;
}

// 일반 적에게는 기존 최대 체력 비례 피해를 유지하고, 보스에게는
// 비율 1%마다 정해진 고정 피해로 바꿔 체력 규모가 공략 시간을 무너뜨리지 않게 한다.
function enemyMaxHpDamage(enemy, ratio) {
  if (!enemy || !enemy.isRaidBoss) return (enemy?.maxHp || 0) * ratio;
  return RAID_BOSS_PERCENT_FLAT_PER_POINT[enemy.raidIndex] * ratio * 100;
}

function startRaidBoss(index) {
  purgeEnemiesForRaid();
  const centerX = Math.max(580, Math.min(WORLD.width - 580, player.x));
  const centerY = Math.max(580, Math.min(WORLD.height - 580, player.y));
  raidArena = index === 0 ? { x: centerX, y: centerY, r: 1000, pulse: 0 } : null;
  if (index === 0) {
    player.x = centerX;
    player.y = centerY + 140;
  }
  const spawnX = centerX;
  const spawnY = index === 0 ? centerY + 20 : Math.max(180, player.y - 340);
  activeRaidBoss = {
    id: `raid-${index}-${Date.now()}`,
    isRaidBoss: true,
    raidIndex: index,
    x: spawnX, y: spawnY,
    r: index === 0 ? 82 : 76,
    hp: RAID_BOSS_HP[index], maxHp: RAID_BOSS_HP[index],
    speed: index === 0 ? 0 : (index === 1 ? 1.15 : 1.3),
    boss: true,
    pattern: null, patternTime: 0, patternStep: 0,
    cooldown: 115, lastPattern: -1, facing: 1,
    anim: 0, flash: 0, lastHp: RAID_BOSS_HP[index],
    dashVx: 0, dashVy: 0, queuedVolley: false
  };
  zombies.push(activeRaidBoss);
  raidBossProjectiles.length = 0;
  raidBossZones.length = 0;
  raidBossEffects.length = 0;
  raidIntroTime = 150;
  for (let i = 0; i < 54; i++) {
    const a = Math.random() * Math.PI * 2;
    raidBossEffects.push({ type: "spawn", x: spawnX, y: spawnY, angle: a, r: 40 + Math.random() * 210, life: 55 + Math.random() * 35, maxLife: 90 });
  }
}

function defeatRaidBoss(boss) {
  if (!activeRaidBoss || boss !== activeRaidBoss) return;
  const index = boss.raidIndex;
  zombies = zombies.filter(z => z !== boss && !z.isBossMinion);
  raidBossProjectiles.length = 0;
  raidBossZones.length = 0;
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    raidBossEffects.push({ type: "death", x: boss.x, y: boss.y, angle: a, speed: 2 + Math.random() * 9, life: 65 + Math.random() * 35, maxLife: 100 });
  }
  player.score += 1200 * (index + 1);
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
  activeRaidBoss = null;
  raidArena = null;
  nextRaidBossIndex = index + 1;
  if (index === 2) raidVictory = true;
}

function pickRaidPattern(boss) {
  let pattern = Math.floor(Math.random() * 3);
  if (pattern === boss.lastPattern) pattern = (pattern + 1 + Math.floor(Math.random() * 2)) % 3;
  boss.lastPattern = pattern;
  boss.pattern = pattern;
  boss.patternTime = 0;
  boss.patternStep = 0;
  boss.anim = 1;
  if (boss.raidIndex === 0 && boss.queuedVolley) {
    boss.pattern = 1;
    boss.queuedVolley = false;
  }
}

function finishRaidPattern(boss, cooldown = 90) {
  boss.pattern = null;
  boss.patternTime = 0;
  boss.patternStep = 0;
  boss.cooldown = cooldown;
  boss.anim = 0;
}

function raidPlayerDamage(ratio, lethal = false) {
  if (lethal) {
    player.hp = 0;
    gameOver = !tryRevive();
    return;
  }
  if (player.invincibleTime > 0 || tryDodgeAttack()) return;
  let damage = player.maxHp * ratio;
  if (selectedCharacter === "vargas" && player.vargasShield > 0) {
    const absorbed = Math.min(player.vargasShield, damage);
    player.vargasShield -= absorbed;
    damage -= absorbed;
  }
  const protectedBloodMoon = selectedCharacter === "carmilla" && player.carmillaBloodMoonTime > 0 && transcended.carmillaFeast;
  player.hp -= protectedBloodMoon ? Math.min(damage, Math.max(0, player.hp - 1)) : damage;
  if (selectedCharacter === "nightLord" && player.nightLordUltimateTime > 0) player.hp = Math.max(1, player.hp);
  player.invincibleTime = 20;
  raidBossEffects.push({ type: "playerHit", x: player.x, y: player.y, life: 24, maxLife: 24 });
  if (player.hp <= 0 && !tryRevive()) gameOver = true;
}

function addRaidProjectile(data) {
  raidBossProjectiles.push(Object.assign({ r: 12, life: 260, spin: 0, hit: false }, data));
}

function firePoisonVolley(boss) {
  const base = Math.atan2(player.y - boss.y, player.x - boss.x);
  for (let i = -1; i <= 1; i++) {
    const a = base + i * 0.18;
    addRaidProjectile({ type: "venom", x: boss.x, y: boss.y, vx: Math.cos(a) * 7.2, vy: Math.sin(a) * 7.2, r: 15, damage: 0.14 });
  }
}

function splitVenomProjectile(p) {
  for (let i = 0; i < 5; i++) {
    const a = Math.atan2(player.y - p.y, player.x - p.x) + (i - 2) * 0.34;
    addRaidProjectile({ type: "venomSmall", x: p.x, y: p.y, vx: Math.cos(a) * 6.3, vy: Math.sin(a) * 6.3, r: 7, damage: 0.07, life: 150 });
  }
  raidBossEffects.push({ type: "poisonBurst", x: p.x, y: p.y, life: 30, maxLife: 30 });
}

function updateBloomBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if (boss.patternTime === 1) {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + 0.18;
        const d = 175 + (i % 2) * 120;
        raidBossZones.push({ type: "poison", x: boss.x + Math.cos(a) * d, y: boss.y + Math.sin(a) * d, r: 72, delay: 48 + i * 3, life: 260, tick: 0 });
      }
    }
    if (boss.patternTime > 72) finishRaidPattern(boss, 95);
  } else if (boss.pattern === 1) {
    if (boss.patternTime === 22) firePoisonVolley(boss);
    if (boss.patternTime > 55) finishRaidPattern(boss, 85);
  } else if (boss.pattern === 2) {
    if (boss.patternTime === 24) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      addRaidProjectile({ type: "vine", x: boss.x, y: boss.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, r: 13, damage: 0.08, life: 95 });
    }
    if (boss.patternTime > 58) finishRaidPattern(boss, 75);
  }
}

function summonReaperMinions(boss) {
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    zombies.push({
      id: `reaper-minion-${Date.now()}-${i}`, isBossMinion: true, raidSprite: 1,
      x: boss.x + Math.cos(a) * 120, y: boss.y + Math.sin(a) * 120,
      r: 26, hp: 420, maxHp: 420, speed: 1.45, boss: false, damage: 5
    });
  }
}

function updateReaperBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if (boss.patternTime === 1) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.dashVx = Math.cos(a) * 16; boss.dashVy = Math.sin(a) * 16;
      raidBossZones.push({ type: "chargeTelegraph", boss, angle: a, x: boss.x, y: boss.y, length: 520, width: 92, delay: 35, life: 55 });
    }
    if (boss.patternTime >= 36 && boss.patternTime <= 58) {
      boss.x += boss.dashVx; boss.y += boss.dashVy;
      if (Math.hypot(player.x - boss.x, player.y - boss.y) < boss.r + player.r + 15) raidPlayerDamage(0.28);
    }
    if (boss.patternTime > 65) finishRaidPattern(boss, 90);
  } else if (boss.pattern === 1) {
    if (boss.patternTime === 22) {
      const a = Math.atan2(player.y - boss.y, player.x - boss.x);
      addRaidProjectile({ type: "scythe", x: boss.x, y: boss.y, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, r: 28, damage: 0.2, life: 170, owner: boss, returning: false, travel: 0 });
    }
    if (boss.patternTime > 150) finishRaidPattern(boss, 100);
  } else if (boss.pattern === 2) {
    if (boss.patternTime === 30) summonReaperMinions(boss);
    if (boss.patternTime > 62) finishRaidPattern(boss, 120);
  }
}

function fireAbyssOrb(boss) {
  const a = Math.atan2(player.y - boss.y, player.x - boss.x);
  addRaidProjectile({ type: "abyssOrb", x: boss.x, y: boss.y, vx: Math.cos(a) * 8.2, vy: Math.sin(a) * 8.2, r: 16, damage: 0.6, life: 180 });
}

function setupAbyssDash(boss) {
  const a = Math.atan2(player.y - boss.y, player.x - boss.x);
  boss.dashVx = Math.cos(a) * 24; boss.dashVy = Math.sin(a) * 24;
  boss.dashHit = false;
  raidBossZones.push({ type: "deathDash", boss, angle: a, x: boss.x, y: boss.y, length: 650, width: 108, delay: 38, life: 55 });
}

function updateAbyssBoss(boss) {
  boss.patternTime++;
  if (boss.pattern === 0) {
    if ([18, 34, 50, 66].includes(boss.patternTime)) fireAbyssOrb(boss);
    if (boss.patternTime > 92) finishRaidPattern(boss, 90);
  } else if (boss.pattern === 1) {
    if (boss.patternTime === 1) raidBossZones.push({ type: "lightning", x: player.x, y: player.y, r: 92, delay: 42, life: 62, struck: false });
    if (boss.patternTime > 70) finishRaidPattern(boss, 92);
  } else if (boss.pattern === 2) {
    const cycle = boss.patternTime % 62;
    if (boss.patternTime === 1 || cycle === 1) setupAbyssDash(boss);
    if (cycle >= 39 && cycle <= 51) {
      boss.x += boss.dashVx; boss.y += boss.dashVy;
      if (!boss.dashHit && Math.hypot(player.x - boss.x, player.y - boss.y) < boss.r + player.r + 22) {
        boss.dashHit = true;
        raidPlayerDamage(1, true);
      }
    }
    if (boss.patternTime > 186) finishRaidPattern(boss, 125);
  }
}

function updateRaidBossProjectiles() {
  for (let i = raidBossProjectiles.length - 1; i >= 0; i--) {
    const p = raidBossProjectiles[i];
    p.life--; p.spin += 0.22;
    if (p.type === "scythe") {
      p.travel++;
      if (!p.returning && p.travel > 52) { p.returning = true; p.hit = false; }
      if (p.returning) {
        const a = Math.atan2(p.owner.y - p.y, p.owner.x - p.x);
        p.vx = Math.cos(a) * 12; p.vy = Math.sin(a) * 12; p.damage = 0.5;
        if (Math.hypot(p.owner.x - p.x, p.owner.y - p.y) < p.owner.r) { raidBossProjectiles.splice(i, 1); continue; }
      }
    }
    p.x += p.vx; p.y += p.vy;
    if (p.type === "venom" && raidArena && Math.hypot(p.x - raidArena.x, p.y - raidArena.y) > raidArena.r - 18) {
      splitVenomProjectile(p); raidBossProjectiles.splice(i, 1); continue;
    }
    if (!p.hit && Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      raidPlayerDamage(p.damage || 0.1);
      p.hit = true;
      if (p.type === "vine") {
        player.bossRootTime = 120;
        if (activeRaidBoss && activeRaidBoss.raidIndex === 0) {
          activeRaidBoss.pattern = 1;
          activeRaidBoss.patternTime = 0;
          activeRaidBoss.patternStep = 0;
          activeRaidBoss.anim = 1;
        }
      }
      if (p.type === "abyssOrb") player.bossSlowTime = 150;
      if (p.type !== "scythe") { raidBossProjectiles.splice(i, 1); continue; }
    }
    if (p.life <= 0) raidBossProjectiles.splice(i, 1);
  }
}

function updateRaidBossZones() {
  for (let i = raidBossZones.length - 1; i >= 0; i--) {
    const z = raidBossZones[i];
    z.life--; if (z.delay > 0) z.delay--;
    if (z.type === "poison" && z.delay <= 0) {
      z.tick = (z.tick || 0) - 1;
      if (z.tick <= 0 && Math.hypot(player.x - z.x, player.y - z.y) < z.r + player.r) { raidPlayerDamage(0.06); z.tick = 28; }
    }
    if (z.type === "lightning" && z.delay <= 0 && !z.struck) {
      z.struck = true;
      if (Math.hypot(player.x - z.x, player.y - z.y) < z.r + player.r) raidPlayerDamage(0.8);
      raidBossEffects.push({ type: "lightning", x: z.x, y: z.y, life: 28, maxLife: 28 });
    }
    if (z.life <= 0) raidBossZones.splice(i, 1);
  }
}

function clampPlayerToRaidArena() {
  if (!raidArena) return;
  const dx = player.x - raidArena.x, dy = player.y - raidArena.y;
  const dist = Math.hypot(dx, dy), limit = raidArena.r - player.r - 12;
  if (dist > limit) { player.x = raidArena.x + dx / dist * limit; player.y = raidArena.y + dy / dist * limit; }
}

function updateRaidBossSystem() {
  if (raidVictory) return;
  if (!activeRaidBoss) {
    survivalFrames++;
    raidWarningPulse += 0.12;
    if (nextRaidBossIndex < RAID_BOSS_TIMES.length && survivalFrames >= RAID_BOSS_TIMES[nextRaidBossIndex]) startRaidBoss(nextRaidBossIndex);
    return;
  }
  const boss = activeRaidBoss;
  if (boss.hp <= 0 || !zombies.includes(boss)) { defeatRaidBoss(boss); return; }
  if (boss.hp < boss.lastHp) { boss.flash = 5; boss.lastHp = boss.hp; }
  if (boss.flash > 0) boss.flash--;
  if (raidIntroTime > 0) raidIntroTime--;
  if (player.bossRootTime > 0) player.bossRootTime--;
  if (player.bossSlowTime > 0) player.bossSlowTime--;
  if (raidArena) raidArena.pulse += 0.025;
  clampPlayerToRaidArena();
  if (raidIntroTime <= 0) {
    if (boss.pattern === null) {
      boss.cooldown--;
      if (boss.cooldown <= 0) pickRaidPattern(boss);
      else if (boss.raidIndex > 0) {
        const a = Math.atan2(player.y - boss.y, player.x - boss.x);
        boss.x += Math.cos(a) * boss.speed * 0.48; boss.y += Math.sin(a) * boss.speed * 0.48;
      }
    } else if (boss.raidIndex === 0) updateBloomBoss(boss);
    else if (boss.raidIndex === 1) updateReaperBoss(boss);
    else updateAbyssBoss(boss);
  }
  boss.facing = player.x < boss.x ? -1 : 1;
  const contactDistance = boss.r + player.r + (boss.raidIndex === 0 ? 8 : 14);
  if (Math.hypot(player.x - boss.x, player.y - boss.y) < contactDistance) {
    raidPlayerDamage([0.12, 0.18, 0.25][boss.raidIndex]);
    const pushAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
    player.x += Math.cos(pushAngle) * 18;
    player.y += Math.sin(pushAngle) * 18;
  }
  updateRaidBossProjectiles();
  updateRaidBossZones();
  for (let i = raidBossEffects.length - 1; i >= 0; i--) if (--raidBossEffects[i].life <= 0) raidBossEffects.splice(i, 1);
}

function drawRaidArena() {
  if (!raidArena) return;
  worldStart();
  const pulse = Math.sin(raidArena.pulse) * 7;
  ctx.save();
  ctx.fillStyle = "rgba(7,5,15,0.28)";
  ctx.strokeStyle = activeRaidBoss && activeRaidBoss.raidIndex === 0 ? "rgba(119,255,63,0.78)" : "rgba(153,78,255,0.72)";
  ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 22; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(raidArena.x, raidArena.y, raidArena.r + pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([22, 15]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(raidArena.x, raidArena.y, raidArena.r - 18 - pulse * .4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore(); worldEnd();
}

function drawRaidBossZones() {
  worldStart();
  for (const z of raidBossZones) {
    ctx.save();
    if (z.type === "poison") {
      const ready = z.delay <= 0;
      ctx.globalAlpha = ready ? .66 : .28;
      const g = ctx.createRadialGradient(z.x,z.y,5,z.x,z.y,z.r);
      g.addColorStop(0, ready ? "#d7ff4b" : "#9dff45"); g.addColorStop(.52,"#43b91e"); g.addColorStop(1,"rgba(28,79,11,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#b8ff58";ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.stroke();
    } else if (z.type === "lightning") {
      ctx.fillStyle = z.delay > 0 ? "rgba(117,53,189,.18)" : "rgba(232,221,255,.55)";
      ctx.strokeStyle = z.delay > 0 ? "#df4cff" : "#ffffff";ctx.lineWidth=4;ctx.shadowColor="#bc4cff";ctx.shadowBlur=18;
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(let k=0;k<8;k++){const a=k*Math.PI/4;ctx.beginPath();ctx.moveTo(z.x+Math.cos(a)*20,z.y+Math.sin(a)*20);ctx.lineTo(z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r);ctx.stroke();}
    } else if (z.type === "chargeTelegraph" || z.type === "deathDash") {
      ctx.translate(z.x,z.y);ctx.rotate(z.angle);
      ctx.fillStyle=z.type === "deathDash"?"rgba(255,22,40,.24)":"rgba(181,41,255,.18)";
      ctx.strokeStyle=z.type === "deathDash"?"#ff283e":"#c75bff";ctx.lineWidth=4;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=16;
      ctx.fillRect(0,-z.width/2,z.length,z.width);ctx.strokeRect(0,-z.width/2,z.length,z.width);
    }
    ctx.restore();
  }
  worldEnd();
}

function drawRaidBossProjectiles() {
  worldStart();
  for (const p of raidBossProjectiles) {
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spin);
    if (p.type === "vine") {
      ctx.strokeStyle="#7eff45";ctx.shadowColor="#4eff28";ctx.shadowBlur=14;ctx.lineWidth=8;
      ctx.beginPath();ctx.moveTo(-28,0);ctx.quadraticCurveTo(-4,-16,22,0);ctx.stroke();
      for(let j=-1;j<=1;j+=2){ctx.beginPath();ctx.moveTo(j*5,0);ctx.lineTo(j*12,-13);ctx.stroke();}
    } else if (p.type === "scythe") {
      ctx.strokeStyle="#f1ecff";ctx.shadowColor="#a342ff";ctx.shadowBlur=18;ctx.lineWidth=7;
      ctx.beginPath();ctx.arc(0,0,25,-1.2,1.4);ctx.stroke();ctx.strokeStyle="#6d2b95";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-18);ctx.lineTo(21,20);ctx.stroke();
    } else {
      const abyss=p.type==="abyssOrb";
      ctx.fillStyle=abyss?"#14051f":(p.type==="venomSmall"?"#baff35":"#61cf20");ctx.strokeStyle=abyss?"#d05cff":"#eaff75";
      ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=20;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(abyss){ctx.rotate(-p.spin*2);for(let k=0;k<4;k++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(p.r+2,0);ctx.lineTo(p.r+13,0);ctx.stroke();}}
    }
    ctx.restore();
  }
  worldEnd();
}

function drawRaidBoss() {
  if (!activeRaidBoss) return;
  const b=activeRaidBoss,img=raidBossImages[b.raidIndex];
  worldStart();ctx.save();ctx.translate(b.x,b.y);
  const attackPulse=b.pattern!==null?Math.sin(b.patternTime*.22)*.055:0;
  const size=b.raidIndex===0?250:285;
  ctx.scale(b.facing*(1+attackPulse),1-attackPulse*.7);
  if(b.flash>0){ctx.shadowColor="#ffffff";ctx.shadowBlur=34;ctx.globalAlpha=.82;}
  else{ctx.shadowColor=b.raidIndex===0?"#75ff32":"#8d37ff";ctx.shadowBlur=18;}
  if(img.complete&&img.naturalWidth)ctx.drawImage(img,-size/2,-size*.62,size,size);
  else{ctx.fillStyle=b.raidIndex===0?"#7bdc33":"#241533";ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  if(player.bossRootTime>0){ctx.strokeStyle="#6cff3d";ctx.lineWidth=7;ctx.shadowColor="#76ff41";ctx.shadowBlur=15;for(let i=0;i<4;i++){const a=i*Math.PI/2+performance.now()*.002;ctx.beginPath();ctx.arc(player.x,player.y,28+i*5,a,a+1.1);ctx.stroke();}}
  worldEnd();
}

function drawRaidBossEffects() {
  worldStart();
  for(const e of raidBossEffects){const p=1-e.life/e.maxLife;ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.translate(e.x,e.y);
    if(e.type==="spawn"){ctx.rotate(e.angle);ctx.strokeStyle="#b74cff";ctx.shadowColor="#8b2cff";ctx.shadowBlur=12;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.r*(1-p),0);ctx.lineTo(e.r,0);ctx.stroke();}
    else if(e.type==="death"){ctx.rotate(e.angle);ctx.fillStyle="#d78bff";ctx.shadowColor="#8d2cff";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(e.speed*p*8,0,5*(1-p)+1,0,Math.PI*2);ctx.fill();}
    else if(e.type==="poisonBurst"){ctx.strokeStyle="#aaff3f";ctx.lineWidth=9*(1-p)+2;ctx.beginPath();ctx.arc(0,0,70*p,0,Math.PI*2);ctx.stroke();}
    else if(e.type==="lightning"){ctx.strokeStyle="#fff";ctx.shadowColor="#c557ff";ctx.shadowBlur=25;ctx.lineWidth=10*(1-p)+2;ctx.beginPath();ctx.moveTo(-18,-500);for(let y=-450;y<0;y+=55)ctx.lineTo((Math.random()-.5)*38,y);ctx.lineTo(0,0);ctx.stroke();}
    else{ctx.strokeStyle="#ff385d";ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,45*p,0,Math.PI*2);ctx.stroke();}
    ctx.restore();}
  worldEnd();
}

function formatRaidTime(frames) {
  const seconds=Math.floor(frames/60);return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

function drawRaidBossUI() {
  ctx.save();
  ctx.textAlign="center";
  if(activeRaidBoss){
    const w=Math.min(760,canvas.width-80),x=(canvas.width-w)/2,y=54,ratio=Math.max(0,activeRaidBoss.hp/activeRaidBoss.maxHp);
    ctx.fillStyle="rgba(6,5,12,.9)";ctx.fillRect(x-6,y-6,w+12,38);
    const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,"#8f22cc");g.addColorStop(.5,"#ff3e6d");g.addColorStop(1,"#5211aa");ctx.fillStyle=g;ctx.fillRect(x,y,w*ratio,26);
    ctx.strokeStyle="#f3d9ff";ctx.lineWidth=2;ctx.strokeRect(x,y,w,26);
    ctx.fillStyle="#fff";ctx.font="bold 17px Arial";ctx.fillText(RAID_BOSS_NAMES[activeRaidBoss.raidIndex],canvas.width/2,y+19);
    ctx.fillStyle="#ffdf73";ctx.font="bold 14px Arial";ctx.fillText("보스전 · 시간 정지",canvas.width/2,y+49);
  } else if(!raidVictory){
    ctx.fillStyle="rgba(4,6,12,.72)";ctx.fillRect(canvas.width/2-58,52,116,30);ctx.fillStyle="#fff";ctx.font="bold 18px monospace";ctx.fillText(formatRaidTime(survivalFrames),canvas.width/2,73);
    if(nextRaidBossIndex<RAID_BOSS_TIMES.length){
      const remaining=RAID_BOSS_TIMES[nextRaidBossIndex]-survivalFrames;
      if(remaining>0&&remaining<=300){
        const seconds=Math.ceil(remaining/60),pulse=1+Math.sin(raidWarningPulse)*.045;
        ctx.save();ctx.translate(canvas.width/2,canvas.height*.25);ctx.scale(pulse,pulse);
        ctx.fillStyle="rgba(15,2,9,.82)";ctx.strokeStyle="#ff355d";ctx.shadowColor="#ff244f";ctx.shadowBlur=24;ctx.lineWidth=3;
        roundedRectPath(-245,-53,490,106,18);ctx.fill();ctx.stroke();
        ctx.fillStyle="#ff4e70";ctx.font="900 27px Arial";ctx.fillText("⚠ 보스 접근 감지",0,-13);
        ctx.fillStyle="#fff";ctx.font="bold 22px Arial";ctx.fillText(`${RAID_BOSS_NAMES[nextRaidBossIndex]} · ${seconds}초`,0,25);
        ctx.restore();
      }
    }
  }
  if(raidIntroTime>0&&activeRaidBoss){const a=Math.min(1,(150-raidIntroTime)/22,raidIntroTime/30);ctx.globalAlpha=a;ctx.fillStyle="rgba(0,0,0,.48)";ctx.fillRect(0,canvas.height*.33,canvas.width,150);ctx.fillStyle="#ff416c";ctx.shadowColor="#a52cff";ctx.shadowBlur=22;ctx.font="900 46px Arial";ctx.fillText("BOSS ENCOUNTER",canvas.width/2,canvas.height*.33+58);ctx.fillStyle="#fff";ctx.font="bold 25px Arial";ctx.fillText(RAID_BOSS_NAMES[activeRaidBoss.raidIndex],canvas.width/2,canvas.height*.33+105);}
  if(raidVictory){ctx.fillStyle="rgba(3,3,10,.82)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#ffd867";ctx.shadowColor="#c55cff";ctx.shadowBlur=28;ctx.font="900 60px Arial";ctx.fillText("SURVIVAL COMPLETE",canvas.width/2,canvas.height/2-34);ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="24px Arial";ctx.fillText("세 명의 보스를 모두 처치했습니다",canvas.width/2,canvas.height/2+18);ctx.font="18px Arial";ctx.fillText("ENTER 키로 다시 시작",canvas.width/2,canvas.height/2+62);}
  ctx.restore();
}
