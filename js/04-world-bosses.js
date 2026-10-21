// Six world-native raids reuse the generated species art, not World 2's bosses.
// Patterns run on bounded hazard arrays and keep the original 2/4/6-minute,
// reward, break-shield and percentage-damage infrastructure.
// Revised Word balance table, 2026-10-21. Stage tier applies to bosses only;
// ordinary waves and relic rewards keep their separate existing profiles.
const WORLD_RAID_BOSS_BALANCE = Object.freeze({
  1:Object.freeze({
    easy:Object.freeze([
      {"hp":27500,"speed":1.7,"damage":{"contact":0.12,"cone":0.22,"charge":0.28}},
      {"hp":100000,"speed":1.8,"damage":{"contact":0.18,"glass":0.18,"rain":0.23}},
      {"hp":150000,"speed":1.4,"damage":{"contact":0.25,"ring":0.2,"minion":0.05},"summon":{"hp":750,"count":4,"cap":6,"minimum":4,"speed":1.8}}
    ]),
    medium:Object.freeze([
      {"hp":40500,"speed":1.7,"damage":{"contact":0.15,"cone":0.25,"charge":0.3}},
      {"hp":130000,"speed":1.8,"damage":{"contact":0.21,"glass":0.21,"rain":0.26}},
      {"hp":180000,"speed":1.4,"damage":{"contact":0.3,"ring":0.3,"minion":0.1},"summon":{"hp":1750,"count":4,"cap":6,"minimum":10,"speed":1.8}}
    ]),
    hard:Object.freeze([
      {"hp":57500,"speed":1.7,"damage":{"contact":0.18,"cone":0.28,"charge":0.32}},
      {"hp":150000,"speed":1.8,"damage":{"contact":0.24,"glass":0.24,"rain":0.29}},
      {"hp":200000,"speed":1.4,"damage":{"contact":0.35,"ring":0.4,"minion":0.15},"summon":{"hp":2750,"count":6,"cap":12,"minimum":20,"speed":1.8}}
    ]),
  }),
  3:Object.freeze({
    easy:Object.freeze([
      {"hp":67500,"speed":2.3,"damage":{"contact":0.22,"rift":0.52,"cone":0.7,"shockwave":0.7}},
      {"hp":250000,"speed":5.6,"damage":{"contact":0.4,"beam":0.99,"minion":0.2},"summon":{"hp":2600,"count":4,"cap":4,"minimum":40,"speed":1.8}},
      {"hp":30000000,"speed":3.25,"damage":{"contact":0.75,"beam":0.99,"orb":0.99}}
    ]),
    medium:Object.freeze([
      {"hp":117500,"speed":4.3,"damage":{"contact":0.32,"rift":0.72,"cone":0.8,"shockwave":0.8}},
      {"hp":500000,"speed":5.6,"damage":{"contact":0.4,"beam":0.99,"minion":0.35},"summon":{"hp":3600,"count":4,"cap":4,"minimum":50,"speed":1.8}},
      {"hp":60000000,"speed":3.25,"damage":{"contact":0.85,"beam":0.99,"orb":0.99}}
    ]),
    hard:Object.freeze([
      {"hp":187500,"speed":4.3,"damage":{"contact":0.42,"rift":0.92,"cone":0.9,"shockwave":0.9}},
      {"hp":800000,"speed":5.6,"damage":{"contact":0.4,"beam":0.99,"minion":0.45},"summon":{"hp":4600,"count":10,"cap":10,"minimum":60,"speed":1.8}},
      {"hp":100300000,"speed":3.25,"damage":{"contact":0.95,"beam":0.99,"orb":0.99}}
    ]),
  }),
});
function getWorldRaidSelectedDifficulty() {
  return typeof selectedStageDifficulty==='string'?selectedStageDifficulty:typeof selectedDifficulty==='string'?selectedDifficulty:'easy';
}
function getWorldRaidBossBalance(boss) {
  const world=boss?.worldRaidWorld??(typeof selectedWorld==='number'?selectedWorld:2);
  const profiles=WORLD_RAID_BOSS_BALANCE[world];
  const tier=boss?.worldRaidDifficulty||getWorldRaidSelectedDifficulty();
  return (profiles?.[tier]||profiles?.easy)?.[boss?.raidIndex??0]||null;
}

const WORLD_RAID_BOSS_TYPES = Object.freeze({
  1:Object.freeze([
    {id:'iron-hauler',name:'철판의 파수꾼',subtitle:'철판 운반자',color:'#d9b765',desc:'방패로 길을 막고 거대한 철판을 휘두릅니다.',tips:'부채꼴 강타와 직선 돌진 예고 밖으로 이동하세요.',speed:1.7},
    {id:'glass-thrower',name:'유리폭풍의 투척자',subtitle:'유리 투척자',color:'#82cbd1',desc:'세 겹의 파편탄과 머리 위의 유리 폭우로 이동 경로를 압박합니다.',tips:'부채탄 사이의 틈을 통과하고 원형 낙하 예고에서 빠져나오세요.',speed:1.8},
    {id:'alarm-infected',name:'최후의 경보',subtitle:'경보 감염자',color:'#ef746d',desc:'퍼져 나가는 음파와 거리의 감염자들을 지휘합니다.',tips:'음파 고리를 넘겨 피하고 소환된 감염자를 먼저 정리하세요.',speed:1.4}
  ].map((d,index)=>Object.freeze({...d,index,world:1,image:`assets/world-bosses-v1/${d.id}.webp`})) ),
  3:Object.freeze([
    {id:'rift-hunter',name:'균열의 추격자',subtitle:'균열 사냥꾼',color:'#bd8af3',desc:'순간이동할 때마다 빨라지며 전방으로 균열 충격파를 내보냅니다.',tips:'순간이동마다 기본 이동속도가 3%씩 누적됩니다. 균열 표식과 부채꼴 충격파를 피하세요. 출현 직후 접촉 피해는 잠시 유예됩니다.',speed:2.3},
    {id:'stitcher',name:'심연의 봉합자',subtitle:'봉합자',color:'#80e5c3',desc:'소환체와 생명의 실을 연결해 회복하며 봉합 광선을 쏩니다.',tips:'연결된 소환체를 모두 처치하면 회복이 끊기고 잠시 무방비가 됩니다.',speed:5.6},
    {id:'abyss-eye',name:'심연의 관측안',subtitle:'최종 관측체',color:'#da98ff',desc:'서서히 회전하는 광선과 전방위 구체로 발원지를 지킵니다.',tips:'넓은 회전 구간 예고를 살피고 구체 사이의 틈을 이용하세요.',speed:3.25}
  ].map((d,index)=>Object.freeze({...d,index,world:3,image:`assets/world-monsters-v1/${d.id}.webp`})) )
});
const worldRaidZones=[];
const worldRaidProjectiles=[];
const worldRaidEffects=[];
const WORLD_RAID_ZONE_CAP=24,WORLD_RAID_PROJECTILE_CAP=96,WORLD_RAID_EFFECT_CAP=80;
let worldRaidSequence=0;
function getWorldRaidBossDefinition(index,world=typeof selectedWorld==='number'?selectedWorld:2) {
  return WORLD_RAID_BOSS_TYPES[world]?.[index]||null;
}
function getRaidBossName(index,world=typeof selectedWorld==='number'?selectedWorld:2) {
  return getWorldRaidBossDefinition(index,world)?.name||RAID_BOSS_NAMES[index];
}
function resetWorldRaidBosses() {
  worldRaidZones.length=0;worldRaidProjectiles.length=0;worldRaidEffects.length=0;worldRaidSequence=0;
}
function initializeWorldRaidBoss(boss) {
  const def=getWorldRaidBossDefinition(boss.raidIndex);if(!def)return false;
  resetWorldRaidBosses();
  // Clear stale ordinary-enemy projectiles at the encounter boundary too.
  if(typeof resetWorldMonsters==='function')resetWorldMonsters();
  boss.isWorldRaidBoss=true;boss.worldRaidType=def.id;boss.worldRaidWorld=def.world;
  boss.worldRaidDifficulty=getWorldRaidSelectedDifficulty();
  const balance=getWorldRaidBossBalance(boss);
  boss.hp=boss.maxHp=balance.hp;boss.lastHp=boss.hp;
  boss.r=def.id==='abyss-eye'?78:def.id==='iron-hauler'?72:64;boss.speed=balance.speed;
  boss.worldRaidBaseSpeed=balance.speed;boss.worldRaidTeleportCount=0;boss.worldRaidSpeedBonus=0;
  boss.worldRaidState='move';boss.worldRaidAge=0;boss.worldRaidTimer=0;boss.worldRaidMaxTimer=1;
  boss.worldRaidAim=Math.atan2(player.y-boss.y,player.x-boss.x);boss.worldRaidLinks=[];boss.worldRaidPatternSequence=0;
  boss.worldRaidGrace=0;boss.worldRaidFrayed=0;boss.worldRaidHealBudget=boss.maxHp*.02;
  boss.worldRaidColor=def.color;
  return true;
}
function enforceWorldRaidBossPosition(boss) {
  if(!boss?.isWorldRaidBoss)return false;
  if(Number.isFinite(boss.frameX)&&Number.isFinite(boss.frameY)){boss.x=boss.frameX;boss.y=boss.frameY;}
  boss.slowTime=0;boss.stunTime=0;boss.stunFlash=0;return true;
}
function worldRaidAlive(boss) { return !!boss&&boss===activeRaidBoss&&boss.hp>0&&zombies.includes(boss); }
function worldRaidEmit(type,x,y,r,color,life=32,details={}) {
  if(worldRaidEffects.length>=WORLD_RAID_EFFECT_CAP)worldRaidEffects.shift();
  worldRaidEffects.push({type,x,y,r,color,life,maxLife:life,...details});
}
function worldRaidZone(owner,type,options={}) {
  if(worldRaidZones.length>=WORLD_RAID_ZONE_CAP)return null;
  const delay=options.delay??60,duration=options.duration??15;
  const zone={owner,type,x:owner.x,y:owner.y,angle:owner.worldRaidAim,color:owner.worldRaidColor,
    r:100,width:18,length:480,arc:1.55,delay,maxDelay:delay,life:delay+duration,maxLife:delay+duration,
    age:0,damage:.20,activated:false,...options};
  worldRaidZones.push(zone);return zone;
}
function worldRaidVolley(boss,count,spread,speed=6.5,damage=.18,fullCircle=false) {
  for(let n=0;n<count&&worldRaidProjectiles.length<WORLD_RAID_PROJECTILE_CAP;n++) {
    const angle=fullCircle?boss.worldRaidAim+n*Math.PI*2/count:boss.worldRaidAim+(n/(count-1||1)-.5)*spread;
    worldRaidProjectiles.push({owner:boss,type:boss.worldRaidType==='glass-thrower'?'glass':'orb',
      x:boss.x,y:boss.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:fullCircle?12:9,
      spin:n,life:160,maxLife:160,color:boss.worldRaidColor,damage});
  }
}
function worldRaidDamage(boss,ratio) {
  if(!worldRaidAlive(boss)||boss.relicInterruptTime>0||boss.worldRaidGrace>0)return;
  if(typeof isZombieInsideGravityField==='function'&&isZombieInsideGravityField(boss))return;
  if(selectedCharacter==='paladin'&&player.paladinGuardTime>0&&typeof triggerPaladinCounter==='function'&&triggerPaladinCounter(boss))return;
  raidPlayerDamage(ratio,false,boss);
}
function worldRaidSummon(boss,count) {
  const summon=getWorldRaidBossBalance(boss)?.summon;if(!summon)return;
  count=count??summon.count;
  const owned=zombies.filter(z=>z.worldRaidMinion&&z.owner===boss&&z.hp>0),cap=summon.cap;
  // Raid summons also avoid species reserved for exclusive field elites.
  const ids=boss.worldRaidWorld===1?['alley-hound']:['split-larva'];
  for(let n=0;n<count&&owned.length<cap;n++) {
    const a=(n+.5)*Math.PI*2/count+boss.worldRaidAge*.005,x=boss.x+Math.cos(a)*160,y=boss.y+Math.sin(a)*160;
    const hp=summon.hp;
    const minion={id:`world-raid-minion-${++worldRaidSequence}`,owner:boss,isBossMinion:true,worldRaidMinion:true,
      worldRaidMinionType:ids[n%ids.length],worldRaidWorld:boss.worldRaidWorld,
      x:Math.max(30,Math.min(WORLD.width-30,x)),y:Math.max(30,Math.min(WORLD.height-30,y)),r:23,
      hp,maxHp:hp,speed:summon.speed,boss:false,worldMonsterGrace:45};
    minion.controlImmuneX=minion.x;minion.controlImmuneY=minion.y;
    zombies.push(minion);owned.push(minion);if(typeof relicTrackEnemy==='function')relicTrackEnemy(minion);
    worldRaidEmit('summon',minion.x,minion.y,55,boss.worldRaidColor,40);
  }
  boss.worldRaidLinks=boss.worldRaidType==='stitcher'?owned.slice(0,cap):[];
}
function cancelWorldRaidPattern(boss) {
  for(let i=worldRaidZones.length-1;i>=0;i--)if(worldRaidZones[i].owner===boss)worldRaidZones.splice(i,1);
  boss.pattern=null;boss.worldRaidState='move';boss.worldRaidTimer=0;boss.dashVx=0;boss.dashVy=0;
  boss.cooldown=Math.max(boss.cooldown||0,90);
}
function startWorldRaidPattern(boss,pattern) {
  boss.pattern=pattern;boss.patternTime=0;boss.worldRaidAim=Math.atan2(player.y-boss.y,player.x-boss.x);
  boss.worldRaidState='windup';boss.worldRaidTimer=0;boss.worldRaidMaxTimer=1;
  const type=boss.worldRaidType,balance=getWorldRaidBossBalance(boss),damage=balance.damage;
  if(type==='iron-hauler') {
    if(pattern===0)worldRaidZone(boss,'cone',{r:300,arc:1.55,delay:72,duration:14,damage:damage.cone});
    else worldRaidZone(boss,'charge',{length:480,width:110,delay:72,duration:24,damage:damage.charge});
  } else if(type==='glass-thrower') {
    if(pattern===0)worldRaidZone(boss,'cone',{r:630,arc:1.02,delay:65,duration:60,action:'glassVolley',damage:0});
    else for(let n=0;n<5;n++) {
      const a=n*Math.PI*2/5,d=n?150:0;
      worldRaidZone(boss,'rain',{x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:72,delay:54+n*5,duration:14,damage:damage.rain});
    }
  } else if(type==='alarm-infected') {
    if(pattern===0)worldRaidZone(boss,'ring',{r:0,maxR:520,width:18,delay:65,duration:90,damage:damage.ring});
    else worldRaidZone(boss,'summon',{r:150,delay:65,duration:12,count:balance.summon.count});
  } else if(type==='rift-hunter') {
    if(pattern===0) {
      for(let n=0;n<3;n++) {
        const a=boss.worldRaidAim+(n-1)*1.15;
        worldRaidZone(boss,'rift',{x:Math.max(110,Math.min(WORLD.width-110,player.x+Math.cos(a)*150)),
          y:Math.max(110,Math.min(WORLD.height-110,player.y+Math.sin(a)*150)),r:105,delay:48+n*50,duration:14,damage:damage.rift,teleport:true});
      }
    } else {
      // One slash launches one wave. Both previews appear when the cast begins,
      // and share a hit record so remaining in the path cannot take both hits.
      const hitGroup={hit:false};
      worldRaidZone(boss,'cone',{r:380,arc:1.8,delay:65,duration:14,damage:damage.cone,hitGroup});
      worldRaidZone(boss,'shockwave',{minR:380,r:380,maxR:620,width:32,arc:1.8,delay:79,duration:40,damage:damage.shockwave,hitGroup});
    }
  } else if(type==='stitcher') {
    if(pattern===0)worldRaidZone(boss,'summon',{r:150,delay:65,duration:12,count:balance.summon.count});
    else worldRaidZone(boss,'beam',{length:640,width:18,baseAngle:boss.worldRaidAim-.35,angle:boss.worldRaidAim-.35,arc:.7,delay:80,duration:85,damage:damage.beam});
  } else if(type==='abyss-eye') {
    if(pattern===0)worldRaidZone(boss,'beam',{length:760,width:22,baseAngle:boss.worldRaidAim-.475,angle:boss.worldRaidAim-.475,arc:.95,delay:90,duration:110,damage:damage.beam});
    else worldRaidZone(boss,'ring',{r:0,maxR:440,width:0,delay:72,duration:62,action:'orbVolley',damage:0});
  }
  const zones=worldRaidZones.filter(z=>z.owner===boss);
  boss.worldRaidMaxTimer=Math.max(1,...zones.map(z=>z.maxLife));boss.worldRaidTimer=boss.worldRaidMaxTimer+60;
}
function updateWorldRaidBoss(boss,canAct) {
  if(!boss.isWorldRaidBoss)return false;
  boss.worldRaidAge++;
  if(boss.worldRaidGrace>0)boss.worldRaidGrace--;
  if(boss.worldRaidFrayed>0)boss.worldRaidFrayed--;
  if(boss.relicInterruptTime>0) {cancelWorldRaidPattern(boss);return true;}
  if(!canAct)return true;
  if(boss.pattern===null) {
    if(boss.worldRaidState!=='move')cancelWorldRaidPattern(boss);
    if(--boss.cooldown<=0)startWorldRaidPattern(boss,(boss.worldRaidPatternSequence++)%2);
    else {
      const dx=player.x-boss.x,dy=player.y-boss.y,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      const desired=['glass-thrower','alarm-infected','stitcher','abyss-eye'].includes(boss.worldRaidType)?330:175;
      const scale=typeof astraEnemyMoveScale==='function'?astraEnemyMoveScale(boss):1;
      const speed=boss.speed*.65*scale*(boss.worldRaidFrayed>0?.65:1)*(d<desired-45?-.4:d>desired?1:0);
      boss.x+=Math.cos(a)*speed;boss.y+=Math.sin(a)*speed;boss.worldRaidAim=a;
    }
  } else {
    boss.patternTime++;boss.worldRaidTimer--;
    const zones=worldRaidZones.filter(z=>z.owner===boss);
    boss.worldRaidState=zones.some(z=>z.delay<=0)?'active':zones.length?'windup':'recover';
    if(boss.worldRaidTimer<=0){boss.pattern=null;boss.worldRaidState='move';boss.cooldown=100;}
  }
  if(boss.worldRaidType==='stitcher'&&boss.worldRaidAge%15===0) {
    const previous=boss.worldRaidLinks||[],live=previous.filter(z=>z.hp>0&&zombies.includes(z));
    for(const z of previous)if(!live.includes(z))worldRaidEmit('linkBreak',z.x,z.y,55,boss.worldRaidColor,35);
    if(previous.length&&!live.length){boss.worldRaidFrayed=150;cancelWorldRaidPattern(boss);boss.cooldown=150;}
    boss.worldRaidLinks=live;
    if(boss.worldRaidAge%60===0&&live.length) {
      for(const z of live)z.hp=Math.min(z.maxHp,z.hp+z.maxHp*.07);
      const heal=Math.min(boss.maxHp*.0015,boss.maxHp-boss.hp,boss.worldRaidHealBudget);
      boss.hp+=heal;boss.worldRaidHealBudget-=heal;
    }
  }
  boss.x=Math.max(boss.r,Math.min(WORLD.width-boss.r,boss.x));boss.y=Math.max(boss.r,Math.min(WORLD.height-boss.r,boss.y));
  return true;
}
function worldRaidPointInCone(zone,x,y,r=0) {
  const dx=x-zone.x,dy=y-zone.y,d=Math.hypot(dx,dy);
  return d<=zone.r+r&&Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-zone.angle),Math.cos(Math.atan2(dy,dx)-zone.angle)))<=zone.arc/2+Math.asin(Math.min(1,r/Math.max(r,d)));
}
function worldRaidSuppressesContact(boss) {
  // The iron charge has a narrower advertised corridor than its sprite/body.
  // Use only that corridor during its cast and recovery, not a second body hit.
  return boss?.isWorldRaidBoss&&boss.worldRaidType==='iron-hauler'&&boss.pattern===1;
}
function worldRaidRemoveHazard(pool,hazard) {
  const index=pool.indexOf(hazard);if(index>=0)pool.splice(index,1);
}
function worldRaidChargeHits(zone,from,to,x,y,r) {
  const dx=x-zone.x,dy=y-zone.y,along=dx*Math.cos(zone.angle)+dy*Math.sin(zone.angle);
  const side=-dx*Math.sin(zone.angle)+dy*Math.cos(zone.angle);
  const nearestAlong=Math.max(from,Math.min(to,along)),nearestSide=Math.max(-zone.width/2,Math.min(zone.width/2,side));
  return (along-nearestAlong)**2+(side-nearestSide)**2<=r*r;
}
function worldRaidShockwaveHits(zone,from,to,x,y,r) {
  // Radius is the outer edge, so the moving band never exceeds its preview.
  // Sweep the previous trailing edge through the new front to prevent tunneling.
  const inner=Math.max(zone.minR||0,from-zone.width),outer=Math.min(zone.maxR,to);
  const dx=x-zone.x,dy=y-zone.y,d=Math.hypot(dx,dy);
  const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-zone.angle),Math.cos(Math.atan2(dy,dx)-zone.angle));
  const nearestAngle=Math.max(-zone.arc/2,Math.min(zone.arc/2,delta));
  const nearestRadius=Math.max(inner,Math.min(outer,d*Math.cos(delta-nearestAngle)));
  const angle=zone.angle+nearestAngle;
  return (dx-Math.cos(angle)*nearestRadius)**2+(dy-Math.sin(angle)*nearestRadius)**2<=r*r;
}
function updateWorldRaidHazards(boss) {
  if(!boss?.isWorldRaidBoss)return;
  if(typeof paused!=='undefined'&&(paused||gameOver||choosingUpgrade||raidVictory))return;
  if(!worldRaidAlive(boss)) {
    for(let n=worldRaidZones.length-1;n>=0;n--)if(worldRaidZones[n]?.owner===boss)worldRaidZones.splice(n,1);
    for(let n=worldRaidProjectiles.length-1;n>=0;n--)if(worldRaidProjectiles[n]?.owner===boss)worldRaidProjectiles.splice(n,1);
    return;
  }
  for(let n=worldRaidEffects.length-1;n>=0;n--)if(--worldRaidEffects[n].life<=0)worldRaidEffects.splice(n,1);
  for(let n=worldRaidZones.length-1;n>=0;n--) {
    const z=worldRaidZones[n];if(!z)continue;
    if(!worldRaidAlive(z.owner)||z.owner.relicInterruptTime>0){worldRaidRemoveHazard(worldRaidZones,z);continue;}
    z.life--;z.delay--;z.age++;
    if(z.delay<=0) {
      const elapsed=-z.delay,duration=z.maxLife-z.maxDelay;
      if(!z.activated){
        z.activated=true;
        if(z.type!=='shockwave')worldRaidEmit('impact',z.x,z.y,z.r||70,z.color,26,{worldRaidType:z.owner.worldRaidType,zoneType:z.type,angle:z.angle,arc:z.arc});
      }
      if(z.type==='summon') {if(!z.fired){z.fired=true;worldRaidSummon(boss,z.count);}}
      else if(z.action==='glassVolley') {if(elapsed===0||elapsed===20||elapsed===40)worldRaidVolley(boss,5,1.02,6.5,getWorldRaidBossBalance(boss).damage.glass);}
      else if(z.action==='orbVolley') {if(elapsed===0||elapsed===30){boss.worldRaidAim+=.12;worldRaidVolley(boss,12,Math.PI*2,4.8,getWorldRaidBossBalance(boss).damage.orb,true);}}
      else if(z.type==='cone') {
        if(!z.hit&&!z.hitGroup?.hit&&worldRaidPointInCone(z,player.x,player.y,player.r)){
          z.hit=true;if(z.hitGroup)z.hitGroup.hit=true;worldRaidDamage(boss,z.damage);
        }
      }
      else if(z.type==='shockwave') {
        if(elapsed<duration) {
          const from=z.r,to=Math.min(z.maxR,from+(z.maxR-(z.minR||0))/duration);z.r=to;
          if(!z.hit&&!z.hitGroup?.hit&&worldRaidShockwaveHits(z,from,to,player.x,player.y,player.r)){
            z.hit=true;if(z.hitGroup)z.hitGroup.hit=true;worldRaidDamage(boss,z.damage);
          }
        }
      }
      else if(z.type==='rain'||z.type==='rift') {
        if(z.teleport&&!z.teleported){
          worldRaidEmit('teleport',boss.x,boss.y,boss.r,z.color);boss.x=z.x;boss.y=z.y;boss.worldRaidGrace=20;z.teleported=true;
          if(boss.worldRaidType==='rift-hunter') {
            // Add a fixed share of the encounter's base speed, never compound it.
            boss.worldRaidTeleportCount++;boss.worldRaidSpeedBonus=boss.worldRaidTeleportCount*.03;
            boss.speed=boss.worldRaidBaseSpeed*(1+boss.worldRaidSpeedBonus);
          }
        }
        // The rupture itself damages at its advertised location; grace protects
        // contact after arrival, not a hit inside the completed telegraph.
        if(!z.hit&&Math.hypot(player.x-z.x,player.y-z.y)<z.r+player.r){
          const grace=boss.worldRaidGrace;boss.worldRaidGrace=0;worldRaidDamage(boss,z.damage);boss.worldRaidGrace=grace;z.hit=true;
        }
      } else if(z.type==='charge') {
        // elapsed 0..23 are exactly 24 steps; the final expiry frame cannot
        // add a 25th step beyond the 480px preview. Sweep its actual 110px width.
        if(elapsed<duration) {
          const scale=typeof astraEnemyMoveScale==='function'?astraEnemyMoveScale(boss):1;
          const from=z.travel||0,to=Math.min(z.length,from+z.length/duration*scale);z.travel=to;
          boss.x=z.x+Math.cos(z.angle)*to;boss.y=z.y+Math.sin(z.angle)*to;
          if(!z.hit&&worldRaidChargeHits(z,from,to,player.x,player.y,player.r)){worldRaidDamage(boss,z.damage);z.hit=true;}
        }
      } else if(z.type==='ring') {
        z.r=Math.min(z.maxR,elapsed*z.maxR/duration);
        if(!z.hit&&Math.abs(Math.hypot(player.x-z.x,player.y-z.y)-z.r)<player.r+z.width/2){worldRaidDamage(boss,z.damage);z.hit=true;}
      } else if(z.type==='beam') {
        z.angle=z.baseAngle+z.arc*Math.min(1,elapsed/duration);boss.worldRaidAim=z.angle;
        const x2=z.x+Math.cos(z.angle)*z.length,y2=z.y+Math.sin(z.angle)*z.length;
        if(typeof worldMonsterSegmentDistance==='function'&&worldMonsterSegmentDistance(player.x,player.y,z.x,z.y,x2,y2)<player.r+z.width/2)worldRaidDamage(boss,z.damage);
      }
    }
    // A Paladin counter can synchronously kill this owner, clear both arrays,
    // open upgrades or finish the run. Do not continue with stale array slots.
    if(!worldRaidAlive(boss))return;
    if(z.life<=0)worldRaidRemoveHazard(worldRaidZones,z);
  }
  for(let n=worldRaidProjectiles.length-1;n>=0;n--) {
    const p=worldRaidProjectiles[n];if(!p)continue;
    if(!worldRaidAlive(p.owner)){worldRaidRemoveHazard(worldRaidProjectiles,p);continue;}
    if(typeof astraAbsorbRaidProjectile==='function') {
      // Reuse Astra's proven spiral capture without changing legacy projectile
      // classification or the ordinary world's original projectile array.
      const type=p.type;p.type=type==='glass'?'venomSmall':'abyssOrb';
      const absorbed=astraAbsorbRaidProjectile(p);p.type=type;
      if(!worldRaidAlive(boss))return;
      if(!worldRaidProjectiles.includes(p))continue;
      if(absorbed){if(p.life<=0)worldRaidRemoveHazard(worldRaidProjectiles,p);continue;}
    }
    const x=p.x,y=p.y;p.x+=p.vx;p.y+=p.vy;p.life--;p.spin+=.16;
    if(typeof worldMonsterSegmentDistance==='function'&&worldMonsterSegmentDistance(player.x,player.y,x,y,p.x,p.y)<player.r+p.r) {
      worldRaidDamage(p.owner,p.damage);
      if(!worldRaidAlive(boss))return;
      worldRaidRemoveHazard(worldRaidProjectiles,p);continue;
    }
    if(p.life<=0)worldRaidRemoveHazard(worldRaidProjectiles,p);
  }
  // A long charge must not strand a new boss beyond the playable map edge.
  boss.x=Math.max(boss.r,Math.min(WORLD.width-boss.r,boss.x));
  boss.y=Math.max(boss.r,Math.min(WORLD.height-boss.r,boss.y));
}
