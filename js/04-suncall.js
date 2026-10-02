// Frost Circuit: finite crystals, swept ice projectiles and connected lightning.
let suncallCrystals=[],suncallShots=[],suncallEffects=[],suncallStorm=null,suncallFrame=0;
const SUNCALL_Q_CD=240,SUNCALL_E_CD=420,SUNCALL_X_CD=600,SUNCALL_R_CD=1680;
function resetSuncall(){
  suncallCrystals=[];suncallShots=[];suncallEffects=[];suncallStorm=null;suncallFrame=0;
  for(const name of ['QCooldown','ECooldown','XCooldown','RCooldown','CrystalLevel','CircuitLevel','GuardLevel','Shield','ShieldTime'])player['suncall'+name]=0;
}
function suncallQRange(){return 700+(player.suncallCrystalLevel||0)*35;}
function suncallCircuitRange(){return 800+(player.suncallCircuitLevel||0)*35;}
function suncallStormRadius(){return 500+(player.suncallCircuitLevel||0)*20;}
function suncallCapacity(){return 6+(player.suncallCrystalLevel||0)+(transcended.suncallCrystal?2:0);}
function suncallDamage(z,amount){
  if(!z||z.hp<=0||!zombies.includes(z))return;
  z.hp-=amount;if(z.hp<=0){const i=zombies.indexOf(z);if(i>=0)killZombie(i,z);}
}
function suncallCold(z,amount=1){
  if(!z||z.hp<=0)return;
  z.suncallCold=Math.min(3,(z.suncallCold||0)+amount);z.suncallColdTime=240;
  if(z.suncallCold<3)return;
  z.suncallCold=0;z.suncallConductTime=150;
  if(!z.isRaidBoss&&!z.isBossMinion&&!z.movementImmune){z.stunTime=Math.max(z.stunTime||0,90);z.suncallFrozenTime=90;}
  else suncallDamage(z,scaledDamage(player.damage*1.5));
  suncallBurst(z.x,z.y,45,'freeze');
}
function suncallBurst(x,y,r,type='burst'){
  if(suncallEffects.length>=100)suncallEffects.shift();
  suncallEffects.push({type,x,y,r,life:42,maxLife:42,seed:suncallFrame});
}
function suncallPlant(x,y){
  x=Math.max(28,Math.min(WORLD.width-28,x));y=Math.max(28,Math.min(WORLD.height-28,y));
  while(suncallCrystals.length>=suncallCapacity())suncallCrystals.shift();
  const crystal={x,y,life:720+(player.suncallCrystalLevel||0)*90,phase:suncallFrame*.07};
  suncallCrystals.push(crystal);suncallBurst(x,y,65,'plant');return crystal;
}
function suncallSpawnShot(spear=false){
  const angle=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x),range=spear?suncallQRange():675,speed=spear?20:15;
  suncallShots.push({x:player.x,y:player.y,angle,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,remaining:range,
    width:spear?40:10,spear,totalRange:range,relayPlanted:false,damage:scaledDamage(player.damage*(spear?3+(player.suncallCrystalLevel||0)*.3:1.25)),hits:new Set(),trail:[]});
  suncallBurst(player.x,player.y,spear?50:22,'cast');
}
function attackWithSuncall(){if(player.fireCooldown>0)return;suncallSpawnShot();player.fireCooldown=22;}
function activateSuncallQ(){if(player.suncallQCooldown>0)return;suncallSpawnShot(true);player.suncallQCooldown=SUNCALL_Q_CD;}
function suncallDistanceToSegment(z,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;
  const t=d?Math.max(0,Math.min(1,((z.x-a.x)*dx+(z.y-a.y)*dy)/d)):0;
  return Math.hypot(z.x-a.x-dx*t,z.y-a.y-dy*t);
}
function suncallGraph(origin={x:player.x,y:player.y},range=suncallCircuitRange()){
  const nodes=[...suncallCrystals,...zombies.filter(z=>z.hp>0&&z.suncallConductTime>0)]
    .filter(p=>Math.hypot(p.x-origin.x,p.y-origin.y)<=range).slice(0,32);
  const graph=[],visited=[origin],limit=10+(player.suncallCircuitLevel||0)*2+(transcended.suncallCircuit?6:0);
  while(nodes.length&&graph.length<limit){
    let best=-1,parent=null,score=Infinity;
    for(let i=0;i<nodes.length;i++)for(const from of visited){const d=Math.hypot(nodes[i].x-from.x,nodes[i].y-from.y);if(d<score){score=d;best=i;parent=from;}}
    if(score>520+(player.suncallCircuitLevel||0)*40)break;
    const node=nodes.splice(best,1)[0];graph.push({a:{x:parent.x,y:parent.y},b:{x:node.x,y:node.y}});visited.push(node);
  }
  return graph;
}
function suncallLightning(edge,index){
  const dx=edge.b.x-edge.a.x,dy=edge.b.y-edge.a.y,len=Math.hypot(dx,dy)||1,points=[];
  for(let i=0;i<=18;i++){const t=i/18,offset=i===0||i===18?0:Math.sin(i*13.7+index*3.1+suncallFrame)*Math.min(19,len*.07);
    points.push({x:edge.a.x+dx*t-dy/len*offset,y:edge.a.y+dy*t+dx/len*offset});}
  if(suncallEffects.length>=100)suncallEffects.shift();
  suncallEffects.push({type:'bolt',points,life:26,maxLife:26,seed:index});
  suncallBurst(edge.b.x,edge.b.y,90,'spark');
}
function suncallPulse(origin,range,power,fallback=null){
  const graph=suncallGraph(origin,range);
  if(!graph.length&&fallback)graph.push({a:origin,b:fallback});
  graph.forEach(suncallLightning);
  const damage=scaledDamage(player.damage*power*(1+(player.suncallCircuitLevel||0)*.15));
  for(const z of [...zombies]){
    if(!graph.some(e=>suncallDistanceToSegment(z,e.a,e.b)<=z.r+65||Math.hypot(z.x-e.b.x,z.y-e.b.y)<=z.r+90))continue;
    suncallCold(z,1);suncallDamage(z,damage);
  }
  return graph;
}
function activateSuncallE(){
  if(player.suncallECooldown>0)return;
  const angle=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x),d=suncallCircuitRange();
  suncallPulse({x:player.x,y:player.y},suncallCircuitRange(),3.4,{x:player.x+Math.cos(angle)*d,y:player.y+Math.sin(angle)*d});
  player.suncallECooldown=SUNCALL_E_CD;
}
function suncallShatter(center,range,power){
  const nodes=suncallCrystals.filter(c=>Math.hypot(c.x-center.x,c.y-center.y)<=range),radius=160+(player.suncallCrystalLevel||0)*12;
  const chosen=new Set(nodes);suncallCrystals=suncallCrystals.filter(c=>!chosen.has(c));
  for(const c of nodes){suncallBurst(c.x,c.y,radius);for(const z of [...zombies])if(Math.hypot(z.x-c.x,z.y-c.y)<=radius+z.r){suncallCold(z,1);suncallDamage(z,scaledDamage(player.damage*power));}}
  return nodes.length;
}
function activateSuncallX(){
  if(player.suncallXCooldown>0)return;
  const count=suncallShatter(player,suncallCircuitRange(),2.4);
  player.suncallShield=Math.min(player.maxHp*.7,(player.suncallShield||0)+player.maxHp*(.12+count*.035)*(1+(player.suncallGuardLevel||0)*.2));
  player.suncallShieldTime=300+(player.suncallGuardLevel||0)*60;
  suncallBurst(player.x,player.y,95,'shield');player.suncallXCooldown=SUNCALL_X_CD;
}
function absorbSuncallShield(damage){
  if(selectedCharacter!=='suncall'||!(player.suncallShield>0))return damage;
  const absorbed=Math.min(damage,player.suncallShield);player.suncallShield-=absorbed;
  if(transcended.suncallGuard&&absorbed>0){suncallBurst(player.x,player.y,140,'shield');for(const z of [...zombies])if(Math.hypot(z.x-player.x,z.y-player.y)<140+z.r){suncallCold(z,1);suncallDamage(z,scaledDamage(absorbed*1.5));}}
  return damage-absorbed;
}
function activateSuncallR(){
  if(player.level<10||player.suncallRCooldown>0||suncallStorm)return;
  const r=suncallStormRadius();
  suncallStorm={x:player.x,y:player.y,r,age:0,life:360};
  for(let i=0;i<6;i++){const a=i*Math.PI/3;suncallPlant(player.x+Math.cos(a)*r*.62,player.y+Math.sin(a)*r*.62);}
  suncallBurst(player.x,player.y,r,'storm');player.suncallRCooldown=SUNCALL_R_CD;
}
function updateSuncall(){
  if(selectedCharacter!=='suncall')return;suncallFrame++;
  for(const k of ['QCooldown','ECooldown','XCooldown','RCooldown','ShieldTime'])if(player['suncall'+k]>0)player['suncall'+k]--;
  if(!player.suncallShieldTime)player.suncallShield=0;
  for(const z of zombies){for(const k of ['suncallColdTime','suncallConductTime','suncallFrozenTime'])if(z[k]>0)z[k]--;if(!z.suncallColdTime)z.suncallCold=0;}
  for(let i=suncallShots.length-1;i>=0;i--){
    const s=suncallShots[i],a={x:s.x,y:s.y},speed=Math.hypot(s.vx,s.vy),step=Math.min(speed,s.remaining);
    s.x+=s.vx/speed*step;s.y+=s.vy/speed*step;s.remaining-=step;s.trail.push(a);if(s.trail.length>7)s.trail.shift();
    if(s.spear&&!s.relayPlanted&&s.remaining<=s.totalRange*.5){s.relayPlanted=true;const overshoot=s.totalRange*.5-s.remaining;suncallPlant(s.x-s.vx/speed*overshoot,s.y-s.vy/speed*overshoot);}
    for(const z of [...zombies])if(z.hp>0&&!s.hits.has(z)&&suncallDistanceToSegment(z,a,s)<=z.r+s.width){s.hits.add(z);suncallCold(z,s.spear?3:1);suncallDamage(z,s.damage);if(!s.spear){s.remaining=0;break;}}
    if(s.remaining<=0){if(s.spear)suncallPlant(s.x,s.y);suncallShots.splice(i,1);}
  }
  for(let i=suncallCrystals.length-1;i>=0;i--){if(--suncallCrystals[i].life<=0)suncallCrystals.splice(i,1);}
  if(suncallStorm){const storm=suncallStorm;storm.age++;storm.life--;
    storm.x+=(player.x-storm.x)*.08;storm.y+=(player.y-storm.y)*.08;
    if(storm.age%24===0){suncallPulse(storm,storm.r+120,1.6);for(const z of [...zombies])if(Math.hypot(z.x-storm.x,z.y-storm.y)<=storm.r+z.r){suncallCold(z,1);suncallDamage(z,scaledDamage(player.damage*.6));}}
    if(storm.life<=0){suncallShatter(storm,storm.r+120,4.5);suncallBurst(storm.x,storm.y,storm.r,'final');
      for(const z of [...zombies])if(Math.hypot(z.x-storm.x,z.y-storm.y)<=storm.r+z.r)suncallDamage(z,scaledDamage(player.damage*3));suncallStorm=null;}
  }
  for(let i=suncallEffects.length-1;i>=0;i--)if(--suncallEffects[i].life<=0)suncallEffects.splice(i,1);
}
