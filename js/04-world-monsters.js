// World-specific street/abyss enemies. World 2, raid bosses and summons keep
// their original simulation; identity is frozen when an enemy is spawned.
// Retain the complete art/preview catalog, but reserve these identities for raids.
const WORLD_BOSS_ONLY_MONSTER_IDS = Object.freeze(['iron-hauler','glass-thrower','alarm-infected','rift-hunter','stitcher','abyss-eye']);
const WORLD_MONSTER_TYPES = Object.freeze(Object.fromEntries([
  ['street-walker',1,'거리 배회자','#bdaf93','찢어진 일상복을 입은 감염자. 무리가 넓게 돌아 포위합니다.','포위되기 전에 한쪽 길을 열어 이동하세요.',21,1,1,1,44],
  ['alley-hound',1,'굶주린 광견','#d7a371','감염된 들개. 옆으로 돌다가 가까워지면 빠르게 달려듭니다.','측면 접근을 살피고 뛰어들기 전에 거리를 벌리세요.',18,.72,1.30,2,24],
  ['iron-hauler',1,'철판 운반자','#d9b765','도로 표지판을 든 거구. 정면 피해는 절반, 등 뒤 피해는 20% 증가합니다.','돌아서 뒤를 노리거나 넓은 범위 공격을 사용하세요.',26,1.75,.70,2,14],
  ['glass-thrower',1,'유리 투척자','#82cbd1','유리 파편을 세 갈래로 던진 뒤 잠시 무방비가 됩니다.','파편 예고선 사이로 피한 뒤 공격하세요.',21,.85,.80,3,12],
  ['alarm-infected',1,'경보 감염자','#ef746d','경보를 울려 주변 일반 적의 이동속도를 잠시 높입니다.','경보가 완성되기 전에 처치하거나 기절시키세요.',23,1.10,.75,4,6],
  ['hollow-husk',3,'공허의 허물','#b2a2df','내부의 핵만 떠 있는 빈 껍질. 접히고 펼쳐지며 접근합니다.','맥동하는 움직임을 살피며 포위망을 벗어나세요.',21,1,1,1,43],
  ['rift-hunter',3,'균열 사냥꾼','#bd8af3','균열에 도착 지점을 새긴 뒤 짧은 거리를 이동합니다.','밝아지는 균열에서 물러나세요. 출현 직후에는 공격하지 못합니다.',23,.92,1.04,2,21],
  ['split-larva',3,'분열 유생','#d996d9','반투명 막 속의 생명체. 죽으면 작은 유생 둘로 한 번만 분열합니다.','처치 후 생기는 작은 개체까지 정리하세요.',23,1.15,.88,2,18],
  ['stitcher',3,'봉합자','#80e5c3','신경선으로 연결한 일반 적 최대 셋의 체력을 회복합니다.','봉합자를 먼저 처치하면 연결된 적이 잠시 약해집니다.',23,1.05,.72,3,10],
  ['abyss-eye',3,'심연의 관측안','#da98ff','시선을 고정한 뒤 좁은 광선을 천천히 쓸어냅니다.','점선으로 예고하는 방향을 피해 옆으로 이동하세요.',24,1.30,.64,4,8]
].map(([id,world,name,color,desc,tips,r,hpScale,speedScale,minWave,weight])=>[id,Object.freeze({id,world,name,color,desc,tips,r,hpScale,speedScale,minWave,weight,bossOnly:WORLD_BOSS_ONLY_MONSTER_IDS.includes(id),image:`assets/world-monsters-v1/${id}.webp`})])));
function getWorldOrdinaryMonsterDefinitions(world) {
  return Object.values(WORLD_MONSTER_TYPES).filter(def=>def.world===world&&!def.bossOnly);
}
const worldMonsterProjectiles = [];
const worldMonsterEffects = [];
const worldMonsterLiveEnemies = new Set();
const WORLD_MONSTER_PROJECTILE_CAP = 48;
const WORLD_MONSTER_EFFECT_CAP = 80;
const WORLD_MONSTER_ENEMY_CAP = 240;
let worldMonsterSequence = 0;
let worldMonsterFrame = 0;
let worldMonsterRunWorld = 0;

function resetWorldMonsters() {
  worldMonsterProjectiles.length = 0;
  worldMonsterEffects.length = 0;
  worldMonsterLiveEnemies.clear();
  worldMonsterFrame = 0; worldMonsterSequence = 0;
  worldMonsterRunWorld = typeof selectedWorld === 'number' ? selectedWorld : 2;
}
function worldMonsterDefinition(enemy) { return enemy && WORLD_MONSTER_TYPES[enemy.worldMonsterType]; }
function worldMonsterIsOrdinary(enemy) { return !!enemy && !enemy.boss && !enemy.isRaidBoss && !enemy.isBossMinion; }
function worldMonsterIsControlled(enemy) {
  return !!enemy && (enemy.stunTime > 0 || (typeof astraControlled === 'function' && astraControlled(enemy)) ||
    (typeof astraWellSuppressesEnemy === 'function' && astraWellSuppressesEnemy(enemy)));
}
function worldMonsterOwnerActive(enemy) {
  return !!enemy && enemy.hp > 0 && !enemy.worldMonsterDead && worldMonsterLiveEnemies.has(enemy) && !worldMonsterIsControlled(enemy);
}
function worldMonsterEmit(type,x,y,r,color,life=30) {
  if (worldMonsterEffects.length >= WORLD_MONSTER_EFFECT_CAP) worldMonsterEffects.shift();
  worldMonsterEffects.push({type,x,y,r,color,life,maxLife:life});
}
function attachWorldMonster(enemy, forceType = null) {
  const world = worldMonsterRunWorld || (typeof selectedWorld === 'number' ? selectedWorld : 2);
  // This early return deliberately consumes no randomness in the original world.
  if ((world !== 1 && world !== 3) || enemy.isRaidBoss || enemy.isBossMinion) return enemy;
  let def = enemy.boss ? WORLD_MONSTER_TYPES[world===1?'street-walker':'hollow-husk'] : forceType && WORLD_MONSTER_TYPES[forceType];
  if(def&&(def.bossOnly||def.world!==world))def=null;
  if (!def) {
    const pool = getWorldOrdinaryMonsterDefinitions(world).filter(entry=>entry.minWave<=wave);
    let roll = Math.random() * pool.reduce((sum,entry)=>sum+entry.weight,0);
    def = pool.find(entry=>(roll-=entry.weight)<0) || pool[0];
  }
  if (!def || def.world !== world) return enemy;
  return initializeWorldMonster(enemy,def);
}
function initializeWorldMonster(enemy,def) {
  enemy.worldMonsterType=def.id; enemy.worldMonsterWorld=def.world;
  // Large-wave zombies keep their existing radius/HP/speed and reward flag;
  // only their species/appearance changes, without multiplying elite HP twice.
  enemy.worldMonsterElite=!!enemy.boss;
  if(!enemy.boss){enemy.r=def.r;enemy.hp*=def.hpScale;enemy.maxHp*=def.hpScale;enemy.speed*=def.speedScale;}
  enemy.worldMonsterAge=0; enemy.worldMonsterSeed=++worldMonsterSequence;
  enemy.worldMonsterFacing=Math.atan2(player.y-enemy.y,player.x-enemy.x);
  enemy.worldMonsterAim=enemy.worldMonsterFacing; enemy.worldMonsterState='move';
  enemy.worldMonsterTimer=0; enemy.worldMonsterMaxTimer=1;
  enemy.worldMonsterCooldown=90+(enemy.worldMonsterSeed%5)*17;
  enemy.worldMonsterLinks=[];
  return enemy;
}
// Explicit catalog factory for previews/tests, including retired ordinary forms.
// Gameplay spawn selection must use attachWorldMonster's ordinary-only pool.
// The caller owns insertion; this never changes the selected world or zombie array.
function createWorldMonster(typeId,x,y,options={}) {
  const def=WORLD_MONSTER_TYPES[typeId];if(!def)return null;
  const level=Number.isFinite(options.wave)?options.wave:wave;
  const hp=Number.isFinite(options.hp)?options.hp:75+level*12;
  const speed=Number.isFinite(options.speed)?options.speed:(1.45+level*.05)*getZombieDifficultySpeedMultiplier();
  return initializeWorldMonster({id:options.id||`world-monster-${worldMonsterSequence+1}`,x,y,r:21,hp,maxHp:hp,speed,boss:false},def);
}
function worldMonsterBeginFrame() {
  const selected = typeof selectedWorld === 'number' ? selectedWorld : 2;
  if (worldMonsterRunWorld && selected !== worldMonsterRunWorld) resetWorldMonsters();
  if (selected !== 1 && selected !== 3 && !worldMonsterProjectiles.length && !worldMonsterEffects.length) return;
  worldMonsterFrame++;
  worldMonsterLiveEnemies.clear();
  for (const enemy of zombies) if (enemy.hp > 0) worldMonsterLiveEnemies.add(enemy);
}
function worldMonsterCancelAbility(enemy) {
  if (!worldMonsterDefinition(enemy)) return;
  if (enemy.worldMonsterState !== 'move') {
    enemy.worldMonsterState='move'; enemy.worldMonsterTimer=0;
    enemy.worldMonsterCooldown=Math.max(enemy.worldMonsterCooldown||0,90);
  }
  enemy.worldMonsterLinks=[];
}
function worldMonsterPrepareEnemy(enemy) {
  if (!worldMonsterDefinition(enemy)) {
    // World-raid summons use the shared summon AI, but their arrival grace is
    // still a ground-contact timer and must expire in updateZombies itself.
    if(enemy.worldRaidMinion&&enemy.worldMonsterGrace>0)enemy.worldMonsterGrace--;
    return;
  }
  enemy.worldMonsterAge++;
  if (enemy.worldMonsterHasteTime>0) enemy.worldMonsterHasteTime--;
  if (enemy.worldMonsterWeakenTime>0) enemy.worldMonsterWeakenTime--;
  if (enemy.worldMonsterGrace>0) enemy.worldMonsterGrace--;
  if (worldMonsterIsControlled(enemy)) worldMonsterCancelAbility(enemy);
}
function worldMonsterStartState(enemy,state,time) {
  enemy.worldMonsterState=state; enemy.worldMonsterTimer=time; enemy.worldMonsterMaxTimer=time;
}
function worldMonsterCanCast(enemy,distance,maxDistance=620) {
  return distance<maxDistance && distance>55 && (typeof isInCameraView!=='function' || isInCameraView(enemy.x,enemy.y,45));
}
function worldMonsterNearby(enemy,radius,limit,filter=()=>true) {
  const found=[];
  for (const other of zombies) {
    if(other===enemy || other.hp<=0 || !worldMonsterIsOrdinary(other) || worldMonsterIsControlled(other) || !filter(other))continue;
    if((other.x-enemy.x)**2+(other.y-enemy.y)**2>radius*radius)continue;
    found.push(other); if(found.length>=limit)break;
  }
  return found;
}
function worldMonsterLaunchGlass(enemy) {
  for(let n=-1;n<=1;n++) {
    if(worldMonsterProjectiles.length>=WORLD_MONSTER_PROJECTILE_CAP)break;
    const angle=enemy.worldMonsterAim+n*.23;
    worldMonsterProjectiles.push({type:'glass',owner:enemy,x:enemy.x,y:enemy.y,prevX:enemy.x,prevY:enemy.y,
      vx:Math.cos(angle)*5.8,vy:Math.sin(angle)*5.8,r:6,life:110,maxLife:110,color:'#b6f0ef'});
  }
}
// Called after the existing slow-field calculations. It only replaces movement
// for the ten new species, leaving the shared collision/protection code intact.
function updateWorldMonsterEnemy(enemy,slow) {
  const def=worldMonsterDefinition(enemy); if(!def)return false;
  if(worldMonsterIsControlled(enemy)) { worldMonsterCancelAbility(enemy); return false; }
  const dx=player.x-enemy.x,dy=player.y-enemy.y,d=Math.hypot(dx,dy),toward=Math.atan2(dy,dx);
  const turn=Math.atan2(Math.sin(toward-enemy.worldMonsterFacing),Math.cos(toward-enemy.worldMonsterFacing));
  enemy.worldMonsterFacing+=Math.max(-.035,Math.min(.035,turn));
  if(enemy.worldMonsterCooldown>0)enemy.worldMonsterCooldown--;
  const haste=enemy.worldMonsterHasteTime>0?1.24:1,weak=enemy.worldMonsterWeakenTime>0?.65:1;
  let speed=enemy.speed*slow*haste*weak,angle=toward;
  const state=enemy.worldMonsterState;
  if(state==='windup') {
    speed=0;
    if(--enemy.worldMonsterTimer<=0) {
      if(def.id==='glass-thrower') {worldMonsterLaunchGlass(enemy);worldMonsterStartState(enemy,'recover',85);}
      else if(def.id==='alarm-infected') {
        for(const other of worldMonsterNearby(enemy,280,18))other.worldMonsterHasteTime=210;
        worldMonsterEmit('alarm',enemy.x,enemy.y,280,def.color,45);
        worldMonsterStartState(enemy,'recover',100);
      } else if(def.id==='rift-hunter') {
        worldMonsterEmit('rift',enemy.x,enemy.y,45,def.color);
        enemy.x=enemy.worldMonsterTargetX;enemy.y=enemy.worldMonsterTargetY;
        worldMonsterEmit('rift',enemy.x,enemy.y,60,def.color,40);
        enemy.worldMonsterGrace=36;worldMonsterStartState(enemy,'recover',36);
      } else if(def.id==='abyss-eye') {
        enemy.worldMonsterBeamStart=enemy.worldMonsterAim-.32;
        enemy.worldMonsterAim=enemy.worldMonsterBeamStart;
        enemy.worldMonsterBeamLength=480;enemy.worldMonsterBeamWidth=12;
        worldMonsterStartState(enemy,'beam',72);
      }
      enemy.worldMonsterCooldown=def.id==='alarm-infected'?360:230;
    }
  } else if(state==='beam') {
    speed=0;enemy.worldMonsterAim=enemy.worldMonsterBeamStart+.64*(1-enemy.worldMonsterTimer/enemy.worldMonsterMaxTimer);
    if(--enemy.worldMonsterTimer<=0)worldMonsterStartState(enemy,'recover',85);
  } else if(state==='recover') {
    speed*=.18;if(--enemy.worldMonsterTimer<=0)enemy.worldMonsterState='move';
  } else {
    if(def.id==='street-walker') angle+=Math.sin(enemy.worldMonsterSeed*2.399)*Math.min(.38,d/700);
    if(def.id==='alley-hound') {angle+=(enemy.worldMonsterSeed%2?1:-1)*(d>105&&d<350?.67:0);speed*=d<125?1.30:1;}
    if(def.id==='hollow-husk')speed*=.84+Math.sin(enemy.worldMonsterAge*.052+enemy.worldMonsterSeed)*.22;
    if(['glass-thrower','abyss-eye','stitcher'].includes(def.id)) {
      if(d<180){angle=toward+Math.PI;speed*=.6;}else if(d<300)speed*=.15;
    }
    if(enemy.worldMonsterCooldown<=0&&worldMonsterCanCast(enemy,d)) {
      enemy.worldMonsterAim=toward;
      if(def.id==='glass-thrower')worldMonsterStartState(enemy,'windup',48);
      if(def.id==='alarm-infected')worldMonsterStartState(enemy,'windup',75);
      if(def.id==='abyss-eye'&&d<450)worldMonsterStartState(enemy,'windup',90);
      if(def.id==='rift-hunter'&&d>180) {
        const side=enemy.worldMonsterSeed%2?1:-1,targetAngle=toward+side*.4,travel=Math.min(230,d-110);
        enemy.worldMonsterTargetX=Math.max(enemy.r,Math.min(WORLD.width-enemy.r,enemy.x+Math.cos(targetAngle)*travel));
        enemy.worldMonsterTargetY=Math.max(enemy.r,Math.min(WORLD.height-enemy.r,enemy.y+Math.sin(targetAngle)*travel));
        worldMonsterStartState(enemy,'windup',54);
      }
    }
  }
  if(def.id==='stitcher') {
    if((enemy.worldMonsterAge+enemy.worldMonsterSeed)%30===0)enemy.worldMonsterLinks=worldMonsterNearby(enemy,280,3,other=>other.worldMonsterType!=='stitcher');
    enemy.worldMonsterLinks=enemy.worldMonsterLinks.filter(other=>worldMonsterOwnerActive(other)&&Math.hypot(other.x-enemy.x,other.y-enemy.y)<=310);
    if((enemy.worldMonsterAge+enemy.worldMonsterSeed)%60===0)for(const other of enemy.worldMonsterLinks) {
      const before=other.hp;other.hp=Math.min(other.maxHp,other.hp+other.maxHp*.035);
      if(other.hp>before)worldMonsterEmit('heal',other.x,other.y,other.r+12,def.color,24);
    }
  }
  enemy.x+=Math.cos(angle)*speed;enemy.y+=Math.sin(angle)*speed;
  return true;
}
function worldMonsterDamageMultiplier(enemy,context={}) {
  if(!worldMonsterDefinition(enemy))return 1;
  let multiplier=enemy.worldMonsterWeakenTime>0?1.2:1;
  if(enemy.worldMonsterType!=='iron-hauler'||context.dot||context.area)return multiplier;
  const x=Number.isFinite(context.hitOriginX)?context.hitOriginX:player.x;
  const y=Number.isFinite(context.hitOriginY)?context.hitOriginY:player.y;
  const from=Math.atan2(y-enemy.y,x-enemy.x),facing=enemy.worldMonsterFacing||0;
  const cosine=Math.cos(from-facing);
  if(cosine>.35)multiplier*=.5;else if(cosine<-.35)multiplier*=1.2;
  return multiplier;
}
function onWorldMonsterKilled(enemy) {
  const def=worldMonsterDefinition(enemy);if(!def||enemy.worldMonsterDead)return;
  enemy.worldMonsterDead=true;worldMonsterLiveEnemies.delete(enemy);
  if(def.id==='stitcher')for(const other of enemy.worldMonsterLinks||[])if(other.hp>0) {
    other.worldMonsterWeakenTime=180;worldMonsterEmit('linkBreak',other.x,other.y,other.r+18,def.color,32);
  }
  if(def.id==='split-larva'&&!enemy.worldMonsterChild) {
    for(let n=0;n<2&&zombies.length<WORLD_MONSTER_ENEMY_CAP;n++) {
      const a=n*Math.PI+enemy.worldMonsterSeed;
      const child={id:`world-larva-${++worldMonsterSequence}`,x:enemy.x+Math.cos(a)*22,y:enemy.y+Math.sin(a)*22,
        r:14,speed:enemy.speed*1.15,hp:enemy.maxHp*.27,maxHp:enemy.maxHp*.27,boss:false,
        worldMonsterType:def.id,worldMonsterWorld:enemy.worldMonsterWorld,worldMonsterChild:true,
        worldMonsterAge:0,worldMonsterSeed:worldMonsterSequence,worldMonsterState:'move',worldMonsterFacing:a,
        worldMonsterCooldown:120,worldMonsterGrace:35,worldMonsterLinks:[]};
      zombies.push(child);worldMonsterLiveEnemies.add(child);
      if(typeof relicTrackEnemy==='function')relicTrackEnemy(child);
    }
    worldMonsterEmit('split',enemy.x,enemy.y,60,def.color,40);
  }
  worldMonsterCancelAbility(enemy);
}
function worldMonsterPlayerDamage(enemy,amount) {
  if(!worldMonsterOwnerActive(enemy)||enemy.worldMonsterGrace>0||player.invincibleTime>0||!(amount>0))return false;
  if(typeof isZombieInsideGravityField==='function'&&isZombieInsideGravityField(enemy))return false;
  if(selectedCharacter==='paladin'&&player.paladinGuardTime>0&&typeof triggerPaladinCounter==='function'&&triggerPaladinCounter(enemy))return false;
  if(typeof tryDodgeAttack==='function'&&tryDodgeAttack())return false;
  let damage=typeof relicIncomingDamage==='function'?relicIncomingDamage(amount):amount;
  if(typeof absorbSuncallShield==='function')damage=absorbSuncallShield(damage);
  if(typeof absorbAriaShield==='function')damage=absorbAriaShield(damage);
  if(selectedCharacter==='vargas'&&player.vargasShield>0){const absorbed=Math.min(player.vargasShield,damage);player.vargasShield-=absorbed;damage-=absorbed;}
  const bloodGuard=selectedCharacter==='carmilla'&&player.carmillaBloodMoonTime>0&&transcended.carmillaFeast;
  player.hp-=bloodGuard?Math.min(damage,Math.max(0,player.hp-1)):damage;
  player.invincibleTime=20;
  if(selectedCharacter==='nightLord'&&player.nightLordUltimateTime>0)player.hp=Math.max(1,player.hp);
  if(selectedCharacter==='vargas'&&player.hp<=0&&transcended.vargasPulse&&player.vargasSecondHeartCooldown<=0){
    player.hp=player.maxHp*.3;player.vargasSecondHeartCooldown=1800;
    if(typeof vargasEffects!=='undefined')vargasEffects.push({type:'devour',x:player.x,y:player.y,r:220,life:55,maxLife:55});
  }
  if(selectedCharacter==='paladin'&&player.paladinUltimateTime<=0&&!transcended.paladinCombo)player.paladinCombo=Math.max(0,player.paladinCombo-12);
  if(player.hp<=0&&!(typeof tryRevive==='function'&&tryRevive()))gameOver=true;
  worldMonsterEmit('impact',player.x,player.y,30,worldMonsterDefinition(enemy).color,20);
  return true;
}
function worldMonsterSegmentDistance(px,py,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  const t=l2?Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2)):0;
  return Math.hypot(px-x1-dx*t,py-y1-dy*t);
}
function updateWorldMonsterCombat() {
  if(typeof paused!=='undefined'&&(paused||gameOver||choosingUpgrade||raidVictory))return;
  for(let i=worldMonsterEffects.length-1;i>=0;i--)if(--worldMonsterEffects[i].life<=0)worldMonsterEffects.splice(i,1);
  const damage=(player.crownLevel>0?20:10)*getZombieDifficultyDamageMultiplier();
  for(let i=worldMonsterProjectiles.length-1;i>=0;i--) {
    const shot=worldMonsterProjectiles[i];
    if(!worldMonsterOwnerActive(shot.owner)||--shot.life<=0){worldMonsterProjectiles.splice(i,1);continue;}
    shot.prevX=shot.x;shot.prevY=shot.y;shot.x+=shot.vx;shot.y+=shot.vy;
    if(worldMonsterSegmentDistance(player.x,player.y,shot.prevX,shot.prevY,shot.x,shot.y)<player.r+shot.r) {
      worldMonsterPlayerDamage(shot.owner,damage*.85);worldMonsterProjectiles.splice(i,1);
    }
  }
  for(const enemy of worldMonsterLiveEnemies) {
    if(enemy.worldMonsterState!=='beam'||!worldMonsterOwnerActive(enemy)||
      (typeof isInCameraView==='function'&&!isInCameraView(enemy.x,enemy.y,45)))continue;
    const x2=enemy.x+Math.cos(enemy.worldMonsterAim)*enemy.worldMonsterBeamLength;
    const y2=enemy.y+Math.sin(enemy.worldMonsterAim)*enemy.worldMonsterBeamLength;
    if(worldMonsterSegmentDistance(player.x,player.y,enemy.x,enemy.y,x2,y2)<player.r+enemy.worldMonsterBeamWidth/2)
      worldMonsterPlayerDamage(enemy,damage*.85);
  }
}
