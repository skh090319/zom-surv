// 아리아 — 중앙에 뿌리내린 세계수와 끝없이 자라는 생명 정수.
let ariaSoils=[],ariaJudgments=[],ariaPetalStorm=null,ariaWorldTree=null;
let ariaBolts=[],ariaBlooms=[],ariaSpirits=[],ariaEffects=[],ariaDeathQueue=[];
let ariaGrowth={essence:0,stage:0,visualStage:0,frame:0,treeX:0,treeY:0,treeTick:0,shield:0,shieldTime:0,harvestTime:0};
let ariaAttackSequence=0,ariaDeadEnemies=new WeakSet(),ariaBossHits=new WeakMap();
const ARIA_Q_CD=270,ARIA_E_CD=420,ARIA_X_CD=540,ARIA_R_CD=1500;
const ARIA_BASIC_RANGE=840,ARIA_Q_WIDTH=48,ARIA_E_RANGE=520,ARIA_R_RANGE=0,ARIA_HARVEST_RADIUS=650,ARIA_WORLD_TREE_RADIUS=650;
const ARIA_GROWTH_THRESHOLDS=[100,300,600,1200],ARIA_GROWTH_NAMES=["생명의 씨앗","새싹의 수호","뿌리의 연결","영혼의 성목","완전한 에덴"];
function getAriaTreePosition(){return {x:WORLD.width/2,y:WORLD.height/2}}
function getAriaGrowthStage(){return ARIA_GROWTH_THRESHOLDS.filter(value=>ariaGrowth.essence>=value).length}
function getAriaGrowthProgress(){
  const stage=getAriaGrowthStage(),previous=stage?ARIA_GROWTH_THRESHOLDS[stage-1]:0,next=ARIA_GROWTH_THRESHOLDS[stage]??null;
  return {essence:ariaGrowth.essence,stage,name:ARIA_GROWTH_NAMES[stage],next,ratio:next===null?1:Math.max(0,Math.min(1,(ariaGrowth.essence-previous)/(next-previous))),damageBonus:ariaGrowth.essence*.0015};
}
function ariaAddEssence(amount,x=player.x,y=player.y){
  if(selectedCharacter!=="aria"||!Number.isFinite(amount)||amount<=0)return 0;
  const gained=amount*(1+(player.ariaSoilLevel||0)*.1+(transcended.ariaSoil?.25:0));
  ariaGrowth.essence+=gained;
  const previous=ariaGrowth.stage;ariaGrowth.stage=getAriaGrowthStage();
  const tree=getAriaTreePosition();
  ariaEmit("essence",{x,y,tx:tree.x,ty:tree.y,amount:gained,r:8},32);
  if(ariaGrowth.stage>previous)ariaEmit("growth",{...tree,stage:ariaGrowth.stage,r:180+ariaGrowth.stage*45},85);
  return gained;
}
function ariaDamage(multiplier){return scaledDamage(player.damage*multiplier*(1+ariaGrowth.essence*.0015))}
function ariaQRange(){return 780+(player.ariaThornLevel||0)*30}
function ariaInfectionRadius(){return 240+(player.ariaNightLevel||0)*15}
function ariaJudgmentRadius(){return ariaInfectionRadius()}
function ariaPetalStormRadius(){return ARIA_HARVEST_RADIUS}
function ariaGardenCount(){return 0}
function getAriaMoveMultiplier(){return selectedCharacter==="aria"&&ariaGrowth.harvestTime>0?1.25:1}
function absorbAriaShield(damage){
  if(selectedCharacter!=="aria"||ariaGrowth.shieldTime<=0||ariaGrowth.shield<=0)return damage;
  const absorbed=Math.min(ariaGrowth.shield,Math.max(0,damage));ariaGrowth.shield-=absorbed;return damage-absorbed;
}
function ariaClampPoint(x,y){return {x:Math.max(20,Math.min(WORLD.width-20,x)),y:Math.max(20,Math.min(WORLD.height-20,y))}}
function ariaCastPoint(range){
  const dx=mouse.worldX-player.x,dy=mouse.worldY-player.y,d=Math.hypot(dx,dy),scale=d>range?range/d:1;
  return ariaClampPoint(player.x+dx*scale,player.y+dy*scale);
}
function ariaEmit(type,data,life=30){
  ariaEffects.push({type,r:24,...data,life,maxLife:life});
  if(ariaEffects.length>120)ariaEffects.splice(0,ariaEffects.length-120);
}
function ariaMakeSource(tags={},original=null){
  const source={ariaId:++ariaAttackSequence,tags:{kind:"skill",area:true,...tags}};
  if(original?.relicAttack)source.relicAttack=Object.freeze({...original.relicAttack,...source.tags,activeSkill:false});
  else if(typeof relicCaptureAttack==="function")source.relicAttack=Object.freeze({...relicCaptureAttack(source.tags),activeSkill:false});
  return source;
}
function ariaIsMarked(z){return (z.ariaMarkTime||0)>0}
function ariaIsInfected(z){return !!z.ariaInfection&&z.ariaInfection.life>0}
function ariaTargets(x,y,range,count,exclude=null,aimAngle=null){
  const candidates=[];
  for(const z of zombies){
    if(z.hp<=0||exclude?.has(z))continue;
    const distance=Math.hypot(z.x-x,z.y-y);if(distance>range+z.r)continue;
    if(aimAngle!==null&&Math.cos(Math.atan2(z.y-y,z.x-x)-aimAngle)<.5)continue;
    candidates.push({z,score:distance-(ariaIsMarked(z)?range*2:ariaIsInfected(z)?range:0)});
  }
  candidates.sort((a,b)=>a.score-b.score);return candidates.slice(0,count).map(entry=>entry.z);
}
function ariaBossDirectHit(z,source){
  if(!(z.boss||z.isRaidBoss))return;
  let record=ariaBossHits.get(z);
  if(!record){record={hits:0,lastFrame:-100,sources:new Set(),order:[]};ariaBossHits.set(z,record);}
  const id=source?.ariaId;
  if(record.sources.has(id)||ariaGrowth.frame-record.lastFrame<6)return;
  record.lastFrame=ariaGrowth.frame;record.sources.add(id);record.order.push(id);
  if(record.order.length>32)record.sources.delete(record.order.shift());
  if(++record.hits%8===0)ariaAddEssence(3,z.x,z.y);
}
function ariaDealDamage(z,multiplier,source,tags={},percent=0){
  if(selectedCharacter!=="aria"||!z||z.hp<=0||!zombies.includes(z))return false;
  const context={kind:"skill",area:true,...source?.tags,...tags};
  const marked=ariaIsMarked(z)?1.25+(player.ariaThornLevel||0)*.05:1;
  if(typeof relicTagTarget==="function")relicTagTarget(z,source,context);
  const previous=z.ariaSuppressSpiritDeath;z.ariaSuppressSpiritDeath=!!context.secondary;
  z.hp-=ariaDamage(multiplier)*marked+(percent?enemyMaxHpDamage(z,percent):0);
  if(context.direct)ariaBossDirectHit(z,source);
  if(z.hp<=0)killZombie(zombies.indexOf(z),z);
  else z.ariaSuppressSpiritDeath=previous;
  if(context.direct&&!context.secondary&&getAriaGrowthStage()>=2){
    const linked=ariaTargets(z.x,z.y,300,2,new Set([z]));
    for(const other of linked){
      ariaEmit("treeRoot",{x:z.x,y:z.y,tx:other.x,ty:other.y,r:20,shared:true},22);
      ariaDealDamage(other,multiplier*.35,source,{kind:"skill",garden:true,secondary:true,direct:false,canCrit:false});
    }
  }
  return true;
}
// Compatibility entry point for the equipment adapter; new attacks carry explicit sources.
function ariaHit(x,y,r,damage,slow=0){
  const source=ariaMakeSource();
  for(const z of [...zombies])if(Math.hypot(z.x-x,z.y-y)<=r+z.r){
    if(typeof relicTagTarget==="function")relicTagTarget(z,source,{kind:"skill",area:true});
    z.hp-=damage;if(slow)z.slowTime=Math.max(z.slowTime||0,slow);
    if(z.hp<=0)killZombie(zombies.indexOf(z),z);
  }
}
function ariaSpawnBolt(origin,target,angle,multiplier,source,type="petal",pierce=1){
  const bolt={...source,type,x:origin.x,y:origin.y,px:origin.x,py:origin.y,angle,speed:type==="spirit"?17:21,r:type==="spirit"?13:10,life:90,maxLife:90,target,hits:new Set(),pierce,multiplier,phase:0};
  const pool=type==="spirit"?ariaSpirits:ariaBolts;pool.push(bolt);
  const limit=type==="spirit"?32:96;if(pool.length>limit)pool.shift();
  return bolt;
}
function attackWithAria(){
  if(selectedCharacter!=="aria"||player.fireCooldown>0)return;
  const dragAngle=typeof mobileAttackAim!=="undefined"&&mobileAttackAim?.dragged&&Number.isFinite(mobileAttackAim.angle)?mobileAttackAim.angle:null;
  const stage=getAriaGrowthStage(),count=stage>=1?4:3,targets=ariaTargets(player.x,player.y,ARIA_BASIC_RANGE,count,null,dragAngle);
  const source=ariaMakeSource({kind:"basic",area:stage>=1,direct:true});
  const aim=dragAngle??Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);
  for(let n=0;n<count;n++){
    const target=targets[n%Math.max(1,targets.length)]||null,angle=dragAngle===null&&target?Math.atan2(target.y-player.y,target.x-player.x):aim+(n-(count-1)/2)*.12;
    const bolt=ariaSpawnBolt(player,target,angle,1.2,source,"petal",stage>=2?3:stage>=1?2:1);
    // Manual launch direction remains visible before petals seek targets ahead;
    // an enemy behind the player must never reverse a dragged shot immediately.
    if(dragAngle!==null){bolt.aimAngle=dragAngle;bolt.homingDelay=6;}
  }
  if(ariaWorldTree&&targets.length){
    const target=targets[0],tree=getAriaTreePosition(),echo=ariaMakeSource({kind:"basic",area:true,secondary:true,direct:false},source);
    ariaEmit("treeEcho",{...tree,tx:target.x,ty:target.y,r:55},30);
    ariaDealDamage(target,1.8,echo,{kind:"basic",secondary:true,direct:false});
  }
  player.fireCooldown=24;
}
function ariaMark(z){z.ariaMarkTime=transcended.ariaThorn?720:480}
function activateAriaQ(){
  if(selectedCharacter!=="aria"||player.ariaQCooldown>0)return;
  const angle=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x),length=ariaQRange(),source=ariaMakeSource({thorn:true,direct:true});
  const c=Math.cos(angle),s=Math.sin(angle),targets=[];
  for(const z of [...zombies]){
    const dx=z.x-player.x,dy=z.y-player.y,forward=dx*c+dy*s,side=Math.abs(-dx*s+dy*c);
    if(forward < -z.r||forward>length+z.r||side>ARIA_Q_WIDTH/2+z.r)continue;
    targets.push(z);ariaDealDamage(z,6*(1+(player.ariaThornLevel||0)*.15),source,{thorn:true,direct:true},transcended.ariaThorn?.03:0);
    if(z.hp>0){ariaMark(z);z.slowTime=Math.max(z.slowTime||0,75);}
  }
  ariaEmit("thornLance",{x:player.x,y:player.y,angle,length,width:ARIA_Q_WIDTH,r:length*.5},36);
  if(ariaWorldTree&&targets.length){
    const tree=getAriaTreePosition(),echo=ariaMakeSource({thorn:true,secondary:true},source);
    for(const z of targets.slice(0,6))if(z.hp>0){
      ariaEmit("treeEcho",{...tree,tx:z.x,ty:z.y,r:70},36);
      ariaDealDamage(z,3*(1+(player.ariaThornLevel||0)*.15),echo,{thorn:true,secondary:true,direct:false});
    }
  }
  player.ariaQCooldown=ARIA_Q_CD;
}
function ariaInfect(z,source,generation=0,refresh=false){
  if(!z||z.hp<=0||generation>3)return;
  if(ariaIsInfected(z)&&!refresh)return;
  z.ariaInfection={life:generation?240:360,maxLife:generation?240:360,age:0,generation,source};
  z.slowTime=Math.max(z.slowTime||0,45);
}
function activateAriaE(){
  if(selectedCharacter!=="aria"||player.ariaECooldown>0)return;
  const point=ariaCastPoint(ARIA_E_RANGE),source=ariaMakeSource({bloom:true}),field={type:"parasiticBloom",...point,r:ariaInfectionRadius(),life:180,maxLife:180,age:0,phase:0,source};
  ariaBlooms.push(field);if(ariaBlooms.length>6)ariaBlooms.shift();
  for(const z of [...zombies])if(Math.hypot(z.x-point.x,z.y-point.y)<=field.r+z.r){
    ariaInfect(z,source,0,true);ariaDealDamage(z,2.8*(1+(player.ariaNightLevel||0)*.12),source,{bloom:true,direct:true});
  }
  ariaEmit("parasiticBloom",field,50);player.ariaECooldown=ARIA_E_CD;
}
function activateAriaX(){
  if(selectedCharacter!=="aria"||player.ariaXCooldown>0)return;
  const source=ariaMakeSource({harvest:true});
  for(const z of [...zombies]){
    const marked=ariaIsMarked(z),infected=ariaIsInfected(z);
    if(!marked&&!infected&&Math.hypot(z.x-player.x,z.y-player.y)>ARIA_HARVEST_RADIUS+z.r)continue;
    ariaDealDamage(z,4.5*(1+(player.ariaNightLevel||0)*.12)*(1+(marked?.35:0)+(infected?.35:0)),source,{harvest:true,direct:true});
    if(z.hp>0)z.slowTime=Math.max(z.slowTime||0,90);
  }
  if(typeof relicInstallShield==="function")relicInstallShield(ariaGrowth,"shield",.5);
  ariaGrowth.shield=Math.max(ariaGrowth.shield,player.maxHp*(.2+(player.ariaNightLevel||0)*.02));
  ariaGrowth.shieldTime=240;ariaGrowth.harvestTime=240;
  ariaEmit("harvest",{x:player.x,y:player.y,r:ARIA_HARVEST_RADIUS},55);player.ariaXCooldown=ARIA_X_CD;
}
function activateAriaR(){
  if(selectedCharacter!=="aria"||player.level<10||player.ariaRCooldown>0)return;
  const tree=getAriaTreePosition(),source=ariaMakeSource({garden:true});
  ariaWorldTree={type:"worldTree",...tree,r:ARIA_WORLD_TREE_RADIUS,life:720,maxLife:720,age:0,phase:0,source};
  ariaGrowth.treeTick=0;player.ariaUltimateTime=720;player.ariaRCooldown=ARIA_R_CD;
  ariaEmit("worldTreeCast",ariaWorldTree,75);
}
function ariaFinalBloom(tree){
  const targets=[...zombies].filter(z=>ariaIsMarked(z)||ariaIsInfected(z)||Math.hypot(z.x-player.x,z.y-player.y)<=tree.r+z.r||Math.hypot(z.x-tree.x,z.y-tree.y)<=tree.r+z.r);
  const secondary=ariaMakeSource({garden:true,secondary:true},tree.source);
  let chainSeeds=0;
  for(const z of targets)if(z.hp>0){
    ariaDealDamage(z,8,tree.source,{garden:true,direct:false},(z.boss||z.isRaidBoss)? .06:0);
    if(getAriaGrowthStage()>=4&&chainSeeds++<12)for(const other of ariaTargets(z.x,z.y,210,3,new Set([z]))){
      ariaDealDamage(other,2.5,secondary,{garden:true,secondary:true,direct:false,canCrit:false});
      ariaEmit("infectionBurst",{x:other.x,y:other.y,r:100},30);
    }
  }
  ariaEmit("worldTreeFinal",tree,100);
}
function onAriaEnemyKilled(z){
  if(selectedCharacter!=="aria"||!z||ariaDeadEnemies.has(z))return;
  ariaDeadEnemies.add(z);ariaAddEssence(z.boss||z.isRaidBoss?50:1,z.x,z.y);
  const infection=z.ariaInfection;
  if(infection&&ariaDeathQueue.length<64)ariaDeathQueue.push({x:z.x,y:z.y,generation:infection.generation,source:infection.source});
  if(getAriaGrowthStage()>=3&&!z.ariaSuppressSpiritDeath){
    if(ariaGrowth.spiritBirthFrame!==ariaGrowth.frame){ariaGrowth.spiritBirthFrame=ariaGrowth.frame;ariaGrowth.spiritBirths=0;}
    if(ariaGrowth.spiritBirths<8){
      ariaGrowth.spiritBirths++;
      const target=ariaTargets(z.x,z.y,900,1,new Set([z]))[0]||null,angle=target?Math.atan2(target.y-z.y,target.x-z.x):0;
      ariaSpawnBolt(z,target,angle,2.5,ariaMakeSource({secondary:true,canCrit:false}),"spirit");
    }
  }
}
function ariaUpdateBolts(pool){
  const enemies=zombies.slice();
  for(let i=pool.length-1;i>=0;i--){
    const bolt=pool[i];if(--bolt.life<=0){pool.splice(i,1);continue;}
    bolt.px=bolt.x;bolt.py=bolt.y;bolt.phase+=.12;
    const aimAngle=bolt.aimAngle??null,turning=!(bolt.homingDelay>0);
    if(!turning)bolt.homingDelay--;
    if(!bolt.target||bolt.target.hp<=0||!zombies.includes(bolt.target)||bolt.hits.has(bolt.target)||(aimAngle!==null&&Math.cos(Math.atan2(bolt.target.y-bolt.y,bolt.target.x-bolt.x)-aimAngle)<.5))bolt.target=ariaTargets(bolt.x,bolt.y,500,1,bolt.hits,aimAngle)[0]||null;
    if(bolt.target&&turning){
      const desired=Math.atan2(bolt.target.y-bolt.y,bolt.target.x-bolt.x),turn=Math.atan2(Math.sin(desired-bolt.angle),Math.cos(desired-bolt.angle));
      bolt.angle+=Math.max(-.22,Math.min(.22,turn));
    }
    bolt.x+=Math.cos(bolt.angle)*bolt.speed;bolt.y+=Math.sin(bolt.angle)*bolt.speed;
    for(const z of enemies){
      if(z.hp<=0||bolt.hits.has(z))continue;
      const dx=bolt.x-bolt.px,dy=bolt.y-bolt.py,den=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((z.x-bolt.px)*dx+(z.y-bolt.py)*dy)/(den||1)));
      if(Math.hypot(z.x-bolt.px-dx*t,z.y-bolt.py-dy*t)>z.r+bolt.r)continue;
      bolt.hits.add(z);ariaDealDamage(z,bolt.multiplier,bolt,{...bolt.tags,secondary:bolt.type==="spirit",direct:bolt.type!=="spirit"});
      ariaEmit("petalHit",{x:z.x,y:z.y,r:30},20);
      if(--bolt.pierce<=0){pool.splice(i,1);break;}
    }
  }
}
function ariaTreeAttack(){
  const tree=getAriaTreePosition(),candidates=[];
  for(const z of zombies)if(z.hp>0){
    const distance=Math.min(Math.hypot(z.x-player.x,z.y-player.y),Math.hypot(z.x-tree.x,z.y-tree.y)*900/1100);
    if(distance<=900+z.r)candidates.push({z,score:distance-(ariaIsMarked(z)?2000:ariaIsInfected(z)?1000:0)});
  }
  candidates.sort((a,b)=>a.score-b.score);
  const count=1+getAriaGrowthStage()+(transcended.ariaSoil?1:0)+(ariaWorldTree?1:0),source=ariaMakeSource({garden:true});
  for(const {z} of candidates.slice(0,count)){
    ariaEmit("treeRoot",{...tree,tx:z.x,ty:z.y,r:45},30);
    ariaDealDamage(z,2.2*(1+(player.ariaSoilLevel||0)*.12),source,{garden:true,direct:true});
  }
}
function ariaProcessDeaths(){
  const amount=Math.min(12,ariaDeathQueue.length),batch=ariaDeathQueue.splice(0,amount);
  for(const death of batch){
    const source=ariaMakeSource({bloom:true,secondary:true,canCrit:false},death.source),radius=130+(player.ariaNightLevel||0)*10;
    const transfer=death.generation<3?ariaTargets(death.x,death.y,300,transcended.ariaNight?5:3):[];
    for(const z of transfer)ariaInfect(z,source,death.generation+1);
    for(const z of [...zombies])if(Math.hypot(z.x-death.x,z.y-death.y)<=radius+z.r)ariaDealDamage(z,2.4*(1+(player.ariaNightLevel||0)*.12),source,{bloom:true,secondary:true,direct:false,canCrit:false});
    ariaEmit("infectionBurst",{x:death.x,y:death.y,r:radius},36);
  }
}
function resetAriaRework(){
  const tree=getAriaTreePosition();
  ariaGrowth={essence:0,stage:0,visualStage:0,frame:0,treeX:tree.x,treeY:tree.y,treeTick:0,shield:0,shieldTime:0,harvestTime:0};
  ariaBolts=[];ariaBlooms=[];ariaSpirits=[];ariaEffects=[];ariaDeathQueue=[];ariaSoils=[];ariaJudgments=[];ariaPetalStorm=null;ariaWorldTree=null;
  ariaDeadEnemies=new WeakSet();ariaBossHits=new WeakMap();ariaAttackSequence=0;player.ariaUltimateTime=0;
  for(const z of zombies){delete z.ariaInfection;delete z.ariaMarkTime;delete z.ariaSuppressSpiritDeath;}
}
function updateAria(){
  if(selectedCharacter!=="aria")return;
  ariaGrowth.frame++;ariaGrowth.stage=getAriaGrowthStage();ariaGrowth.visualStage+=(ariaGrowth.stage-ariaGrowth.visualStage)*.04;
  const tree=getAriaTreePosition();ariaGrowth.treeX=tree.x;ariaGrowth.treeY=tree.y;
  for(const key of ["ariaQCooldown","ariaECooldown","ariaXCooldown","ariaRCooldown"])if(player[key]>0)player[key]--;
  if(ariaGrowth.harvestTime>0)ariaGrowth.harvestTime--;
  if(ariaGrowth.shieldTime>0&&--ariaGrowth.shieldTime===0)ariaGrowth.shield=0;
  for(const z of [...zombies]){
    if(z.ariaMarkTime>0)z.ariaMarkTime--;
    const infection=z.ariaInfection;if(!infection)continue;
    infection.life--;infection.age++;
    if(infection.life<=0){
      delete z.ariaInfection;
      if(z.hp>0&&(z.boss||z.isRaidBoss))ariaAddEssence(8+(transcended.ariaNight?5:0),z.x,z.y);
      ariaDealDamage(z,3*(1+(player.ariaNightLevel||0)*.12),infection.source,{bloom:true,secondary:true,direct:false,canCrit:false});
      ariaEmit("infectionBurst",{x:z.x,y:z.y,r:95},32);
    }else if(infection.age%30===0){
      z.slowTime=Math.max(z.slowTime||0,45);
      ariaDealDamage(z,.8*(1+(player.ariaNightLevel||0)*.12),infection.source,{bloom:true,dot:true,secondary:true,direct:false,canCrit:false});
    }
  }
  for(let i=ariaBlooms.length-1;i>=0;i--){
    const bloom=ariaBlooms[i];bloom.age++;bloom.phase+=.035;
    if(--bloom.life<=0){ariaBlooms.splice(i,1);continue;}
    if(bloom.age%30===0)for(const z of zombies)if(Math.hypot(z.x-bloom.x,z.y-bloom.y)<=bloom.r+z.r)ariaInfect(z,bloom.source);
  }
  ariaUpdateBolts(ariaBolts);ariaUpdateBolts(ariaSpirits);
  if(--ariaGrowth.treeTick<=0){ariaTreeAttack();ariaGrowth.treeTick=ariaWorldTree?18:54;}
  if(ariaWorldTree){
    const active=ariaWorldTree;active.x=tree.x;active.y=tree.y;active.age++;active.phase+=.016;
    if(--active.life<=0){ariaFinalBloom(active);ariaWorldTree=null;}
  }
  player.ariaUltimateTime=ariaWorldTree?ariaWorldTree.life:0;
  ariaProcessDeaths();
  for(let i=ariaEffects.length-1;i>=0;i--)if(--ariaEffects[i].life<=0)ariaEffects.splice(i,1);
}
function ariaPetal(x,y,size,a,alpha,color){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=color||`rgba(255,139,194,${alpha})`;ctx.beginPath();ctx.moveTo(0,-size);ctx.bezierCurveTo(size*.8,-size*.4,size*.65,size*.55,0,size);ctx.bezierCurveTo(-size*.65,size*.55,-size*.8,-size*.4,0,-size);ctx.fill();ctx.restore()}
function drawAriaEffects(){if(selectedCharacter!=="aria")return;worldStart();ctx.save();const now=performance.now();for(const s of ariaSoils){const a=Math.min(.55,s.life/50),pulse=1+Math.sin(s.phase)*.06;ctx.globalCompositeOperation="source-over";const g=ctx.createRadialGradient(s.x,s.y,5,s.x,s.y,s.r*pulse);g.addColorStop(0,`rgba(58,118,108,${a*.2})`);g.addColorStop(.7,`rgba(74,36,76,${a*.12})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r*pulse,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(92,225,211,${a*.65})`;ctx.lineWidth=1.5;ctx.beginPath();for(let n=0;n<6;n++){const q=n*Math.PI/3+Math.PI/6,rr=s.r*.7*pulse;n?ctx.lineTo(s.x+Math.cos(q)*rr,s.y+Math.sin(q)*rr):ctx.moveTo(s.x+Math.cos(q)*rr,s.y+Math.sin(q)*rr)}ctx.closePath();ctx.stroke();for(let n=0;n<s.stage*2+2;n++){const q=n*Math.PI/(s.stage+1)+s.phase*.2;ariaPetal(s.x+Math.cos(q)*s.r*.42,s.y+Math.sin(q)*s.r*.42,7+s.stage*2,q+Math.PI/2,a*.75,n%2?`rgba(98,232,221,${a*.65})`:`rgba(255,139,194,${a*.75})`)}}
  for(const e of ariaEffects){const p=1-e.life/e.maxLife,a=Math.max(0,1-p);ctx.globalCompositeOperation="lighter";if(e.type==="bloom"||e.type==="echoBloom"){const petals=6+(e.stage||1)*2,rr=e.r*Math.min(1,p*3);for(let n=0;n<petals;n++){const q=n*Math.PI*2/petals;ariaPetal(e.x+Math.cos(q)*rr*.42,e.y+Math.sin(q)*rr*.42,14+(e.stage||1)*3,q+Math.PI/2,a,n%2?`rgba(103,241,226,${a*.7})`:`rgba(255,145,201,${a})`)}ctx.fillStyle=`rgba(255,235,245,${a})`;ctx.beginPath();ctx.arc(e.x,e.y,10+8*a,0,Math.PI*2);ctx.fill()}else if(e.type==="thorns"){for(let n=0;n<8;n++){const q=n*Math.PI/4+.2,rr=e.r*Math.min(1,p*3);ctx.strokeStyle=`rgba(${n%2?255:85},${n%2?92:222},${n%2?151:205},${a})`;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.quadraticCurveTo(e.x+Math.cos(q+.35)*rr*.55,e.y+Math.sin(q+.35)*rr*.55,e.x+Math.cos(q)*rr,e.y+Math.sin(q)*rr);ctx.stroke();ariaPetal(e.x+Math.cos(q)*rr,e.y+Math.sin(q)*rr,10,q,a)}}else if(e.type==="grandBloom"){const rr=e.r*(.25+.75*Math.min(1,p*2));ctx.fillStyle=`rgba(255,120,187,${a*.14})`;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill();for(let ring=0;ring<3;ring++)for(let n=0;n<8+ring*3;n++){const q=n*Math.PI*2/(8+ring*3)+ring*.3;ariaPetal(e.x+Math.cos(q)*rr*(.28+ring*.25),e.y+Math.sin(q)*rr*(.28+ring*.25),24-ring*4,q+Math.PI/2,a*(1-ring*.15),ring%2?`rgba(93,235,220,${a*.75})`:`rgba(255,145,201,${a})`)}}else if(e.type==="petalStep"){const dx=e.x2-e.x1,dy=e.y2-e.y1;for(let n=0;n<12;n++){const t=(n/12+p*.45)%1;ariaPetal(e.x1+dx*t,e.y1+dy*t,9+n%3,Math.atan2(dy,dx)+t*3,a,n%2?`rgba(95,235,222,${a})`:`rgba(255,143,198,${a})`)}}else if(e.type==="eternal"){const alpha=Math.min(.45,e.life/40),pulse=1+Math.sin(now*.003)*.025;ctx.globalCompositeOperation="source-over";const g=ctx.createRadialGradient(e.x,e.y,40,e.x,e.y,e.r*pulse);g.addColorStop(0,"rgba(255,145,200,.05)");g.addColorStop(.75,"rgba(74,220,207,.04)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,e.r*pulse,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="lighter";ctx.strokeStyle=`rgba(255,168,210,${alpha})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r*.72*pulse,0,Math.PI*2);ctx.stroke();for(let n=0;n<14;n++){const q=n*Math.PI/7+now*.00015;ariaPetal(e.x+Math.cos(q)*e.r*.68,e.y+Math.sin(q)*e.r*.68,13,q+Math.PI/2,alpha)}}}ctx.restore();worldEnd()}
function drawAriaInterface(){if(selectedCharacter!=="aria"||screenMode!=="game")return;const w=Math.min(720,canvas.width-24),h=116,x=(canvas.width-w)/2,y=canvas.height-174;ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"rgba(20,7,20,.97)");g.addColorStop(.55,"rgba(42,15,39,.97)");g.addColorStop(1,"rgba(7,27,29,.97)");drawRoundedRect(x,y,w,h,24,g,"#ff83bd",2);ctx.save();ctx.beginPath();ctx.arc(x+55,y+56,40,0,Math.PI*2);ctx.clip();if(ariaSpriteLoaded)ctx.drawImage(ariaSprite,x+5,y+5,100,100);ctx.restore();ctx.strokeStyle="#ff9dcc";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+55,y+56,40,0,Math.PI*2);ctx.stroke();ctx.textAlign="left";ctx.fillStyle="#fff1f8";ctx.font="bold 18px Arial";ctx.fillText("아리아",x+105,y+27);ctx.fillStyle="#82eadf";ctx.font="bold 12px Arial";ctx.fillText(`몽환 토양 ${ariaSoils.length}  ·  연결 화원 ${ariaGardenCount()}`,x+105,y+50);ctx.fillStyle="#dac5d4";ctx.font="11px Arial";ctx.fillText(player.ariaUltimateTime>0?`영원한 봄 ${Math.ceil(player.ariaUltimateTime/60)}초 · 토양 유지`:`반복 공격으로 꽃을 3단계까지 성장`,x+105,y+72);const arr=[["Q","가시",player.ariaQCooldown,ARIA_Q_CD],["E","만개",player.ariaECooldown,ARIA_E_CD],["X","이동",player.ariaXCooldown,ARIA_X_CD],["R",player.level<10?"10레벨":"영원한 봄",player.ariaRCooldown,ARIA_R_CD]];arr.forEach((s,i)=>{const cx=x+w-270+i*67,cy=y+48,r=25;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();if(ariaSkillIconAtlas.complete&&ariaSkillIconAtlas.naturalWidth){const sw=ariaSkillIconAtlas.naturalWidth/2,sh=ariaSkillIconAtlas.naturalHeight/2;ctx.drawImage(ariaSkillIconAtlas,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,cx-r,cy-r,r*2,r*2)}ctx.restore();ctx.strokeStyle="#ff9dcc";ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();if(s[2]>0)drawCooldownCover(cx,cy,r,s[2]/s[3],s[2]);drawSkillHudLabel(cx,y+98,s[1],s[0],"#ffe3f1")});ctx.restore()}
