// LusH: independent combat skills and a bank whose realised net profit grows this run.
// Damage multipliers below affect LusH attacks only, never shared augment damage.
const LUSH_CD={q:210,e:150,x:300,r:2100};
const LUSH_ODDS=[.70,.625,.55,.475];
const LUSH_TIERS=[50,150,350,700];
let lushState;
function resetLush(){
  lushState={chips:0,pot:0,principal:0,totalAssets:0,wins:0,ready:true,bet:null,
    dice:[],cards:[],effects:[],hazards:[],qBursts:[],chipStorms:[],finishers:[],
    awardedKills:new WeakSet(),frame:0,shots:0,castId:0,lastDie:1,lastAngle:0,
    shield:0,buff:0,buffTime:0,failureTime:0,ultimate:null,realm:0,portrait:0,pity:0,
    message:'처치로 자산 성장 · E 베팅 / X 정산',messageTime:180};
  for(const key of ['q','e','x','r'])player['lush'+key+'Cooldown']=0;
  for(const key of ['lushLoaded','lushCollateral','lushRecovery','lushJackpot']){upgradeCount[key]=0;transcended[key]=false;}
}
function lushTier(){return LUSH_TIERS.filter(n=>lushState.totalAssets>=n).length;}
function lushGainAssets(value){
  const before=lushTier();lushState.totalAssets+=Math.max(0,value);
  if(lushTier()>before){lushFx('assetTier',player.x,player.y,180,{tier:lushTier(),life:90,maxLife:90});lushMessage(`하우스 확장 ${lushTier()}단계 · 추가 사격 해금`);}
}
function lushAwardKill(z){
  if(!z||!zombies.includes(z)||lushState.awardedKills.has(z))return false;
  lushState.awardedKills.add(z);lushState.chips++;lushGainAssets(1);return true;
}
function lushOdds(){return LUSH_ODDS[Math.min(3,lushState.wins)];}
function lushMessage(text){lushState.message=text;lushState.messageTime=180;}
function lushFx(type,x,y,r=70,extra={}){
  if(lushState.effects.length>=128)lushState.effects.shift();
  lushState.effects.push({type,x,y,r,age:0,life:48,maxLife:48,seed:lushState.frame,...extra});
}
function lushPower(mult){return scaledDamage(player.damage*mult*(1+lushState.totalAssets*.005)*(1+(lushState.buffTime>0?lushState.buff:0)));}
function lushDamage(z,damage){
  if(!z||z.hp<=0)return false;const index=zombies.indexOf(z);if(index<0)return false;
  z.hp-=damage;if(z.hp<=0)killZombie(index,z);return true;
}
function lushCircle(x,y,r,power){for(const z of [...zombies])if(Math.hypot(z.x-x,z.y-y)<=r+(z.r||0))lushDamage(z,lushPower(power));}
function lushSegmentDistance(z,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((z.x-a.x)*dx+(z.y-a.y)*dy)/d)):0;return Math.hypot(z.x-a.x-dx*t,z.y-a.y-dy*t);}
function lushAim(){return Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);}
function lushRoll(){const min=Math.min(3,1+(upgradeCount.lushLoaded||0));return min+Math.floor(Math.random()*(7-min));}
function lushAngleDelta(to,from){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
function lushTarget(x,y,range=1000,angle=null){
  let best=null,distance=range;
  for(const z of zombies){if(z.hp<=0)continue;const d=Math.hypot(z.x-x,z.y-y);if(d>=distance)continue;
    if(angle!==null&&Math.abs(lushAngleDelta(Math.atan2(z.y-y,z.x-x),angle))>.55)continue;
    best=z;distance=d;
  }return best;
}
function lushSpawnCard(x,y,a,extra={}){
  const c={x,y,a,life:75,maxLife:75,suit:0,kind:'basic',rank:0,power:1.2,radius:10,speed:19,range:980,distance:0,homing:.014,ricochetEligible:false,hits:new Set(),trail:[],...extra};
  // Old basic cards are the first to expire in prolonged late-game fights.
  if(lushState.cards.length>=176){const i=lushState.cards.findIndex(card=>card.kind==='basic'||card.kind==='dealer');lushState.cards.splice(i<0?0:i,1);}
  lushState.cards.push(c);return c;
}
function lushRicochetTarget(x,y,origin){
  let best=null,distance=600;
  for(const z of zombies){if(z===origin||z.hp<=0)continue;const d=Math.hypot(z.x-x,z.y-y);if(d<=distance){best=z;distance=d;}}
  return best||(origin.hp>0&&zombies.includes(origin)&&Math.hypot(origin.x-x,origin.y-y)<=600?origin:null);
}
function lushBeginRicochetLoop(c){
  c.ricochetPhase='loop';c.loopRadius=72;c.loopProgress=0;c.loopStartAngle=c.a-Math.PI/2;
  c.loopCenterX=c.x-Math.sin(c.a)*c.loopRadius;c.loopCenterY=c.y+Math.cos(c.a)*c.loopRadius;
}
function lushSpawnRicochet(source,origin,damage){
  const target=lushRicochetTarget(source.x,source.y,origin);if(!target)return;
  const c=lushSpawnCard(source.x,source.y,source.a,{kind:'ricochet',sourceKind:source.kind,suit:source.suit,rank:source.rank,
    power:source.power*.5,damage:damage*.5,radius:source.radius,speed:source.speed+3,homing:0,life:90,maxLife:90,range:1800,
    target,originTarget:origin,ricochetUsed:true,ricochetPhase:'seek',age:0,looped:false});
  if(target===origin)lushBeginRicochetLoop(c);
  lushFx('ricochet',c.x,c.y,32,{angle:c.a,life:24,maxLife:24});
}
function lushUpdateRicochet(c){
  const old={x:c.x,y:c.y};c.age++;c.life--;
  if(c.target.hp<=0||!zombies.includes(c.target)){
    c.target=lushRicochetTarget(c.x,c.y,c.originTarget);if(!c.target)return false;
    if(c.target===c.originTarget&&!c.looped&&c.ricochetPhase!=='loop')lushBeginRicochetLoop(c);
  }
  if(c.ricochetPhase==='loop'){
    // Collision stays disabled until the entire circle has finished, even for large targets.
    const step=Math.min(c.speed,(Math.PI*2-c.loopProgress)*c.loopRadius);c.distance+=step;
    c.loopProgress=Math.min(Math.PI*2,c.loopProgress+step/c.loopRadius);
    const angle=c.loopStartAngle+c.loopProgress;c.x=c.loopCenterX+Math.cos(angle)*c.loopRadius;c.y=c.loopCenterY+Math.sin(angle)*c.loopRadius;c.a=angle+Math.PI/2;
    if(c.loopProgress>=Math.PI*2){c.looped=true;c.ricochetPhase='seek';}
  }else{
    c.a=Math.atan2(c.target.y-c.y,c.target.x-c.x);const step=Math.min(c.speed,Math.hypot(c.target.x-c.x,c.target.y-c.y));
    c.x+=Math.cos(c.a)*step;c.y+=Math.sin(c.a)*step;c.distance+=step;
    if(lushSegmentDistance(c.target,old,c)<=(c.target.r||0)+c.radius){
      if(lushDamage(c.target,c.damage))lushFx('hit',c.x,c.y,30);
      return false;
    }
  }
  c.trail.push(old);if(c.trail.length>12)c.trail.shift();
  return c.life>0&&c.distance<c.range;
}
function lushLaunchDie(power=1,opensBet=false,extra={}){
  const angle=extra.a===undefined?lushAim():extra.a,eye=extra.eye||lushRoll();lushState.lastDie=eye;lushState.lastAngle=angle;
  const d={x:player.x,y:player.y,a:angle,eye,power,age:0,travel:0,range:500,speed:16,pulses:0,opensBet:false,golden:false,hits:new Set(),...extra};
  if(lushState.dice.length>=16)lushState.dice.shift();lushState.dice.push(d);
  lushFx('cast',d.x,d.y,75,{angle});return eye;
}
function attackWithLush(){
  if(player.fireCooldown>0)return;const s=lushState,a=lushAim(),tier=lushTier();s.shots++;
  for(const off of [-.17,0,.17])lushSpawnCard(player.x,player.y,a+off,{suit:s.shots%4,ricochetEligible:true});
  if(s.shots%4===0){lushSpawnCard(player.x,player.y,a,{kind:'ace',rank:4,suit:0,power:3.6,radius:21,speed:23,range:1120,homing:.008,ricochetEligible:true});lushFx('ace',player.x,player.y,70,{angle:a});}
  for(let i=0;i<tier;i++){
    const side=i%2?-1:1,offset=side*(34+Math.floor(i/2)*20);
    lushSpawnCard(player.x-Math.sin(a)*offset,player.y+Math.cos(a)*offset,a,{kind:'dealer',power:1.15,homing:.025,suit:i%4,ricochetEligible:true});
  }
  player.fireCooldown=s.failureTime>0&&upgradeCount.lushRecovery>0?15:23;
  if(s.ultimate&&s.ultimate.age>=24)lushStopReel();
}
function lushQueueRoyal(x,y,a,power=1,replica=false){
  if(lushState.qBursts.length>=12)return;
  lushState.qBursts.push({x,y,a,power,replica,age:0,next:0,castId:++lushState.castId});
  lushFx('royalCast',x,y,100,{angle:a,replica,life:42,maxLife:42});
}
function activateLushQ(){
  if(player.lushqCooldown>0)return;const a=lushAim();lushQueueRoyal(player.x,player.y,a);
  const u=lushState.ultimate;
  if(u&&!u.resolved)for(const dealer of u.dealers)lushQueueRoyal(dealer.x,dealer.y,a,.42+u.strength*.07,true);
  player.lushqCooldown=LUSH_CD.q;
}
function activateLushE(){
  const s=lushState;if(player.lusheCooldown>0||s.bet)return;
  const angle=lushAim();lushLaunchDie(1.55,false,{a:angle});player.lusheCooldown=LUSH_CD.e;
  if(!s.pot&&s.chips>0){s.pot=s.chips;s.principal=s.chips;s.chips=0;s.wins=0;}
  if(s.pot<=0){lushMessage('유리 주사위 · 칩이 없어도 공격 가능');return;}
  s.bet={age:0,chance:lushOdds(),amount:s.pot,angle};s.ready=false;
  lushFx('wager',player.x,player.y,120,{life:42,maxLife:42});
}
function lushResolveBet(){
  const s=lushState,b=s.bet;if(!b)return;s.bet=null;s.ready=true;
  if(Math.random()<b.chance){
    if(transcended.lushLoaded)s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*.1);
    s.pot=b.amount*2;s.wins++;
    lushLaunchDie(2+s.wins*.6,false,{a:b.angle,golden:true});
    lushFx('win',player.x,player.y,170,{wins:s.wins,life:65,maxLife:65});
    if(s.ultimate&&!s.ultimate.resolved){s.ultimate.strength++;lushFx('dealerVolley',player.x,player.y,420,{strength:s.ultimate.strength});}
    lushMessage(`${s.wins}연승 · 판돈 ${s.pot} · 다음 ${(lushOdds()*100).toFixed(1).replace('.0','')}%`);
    if(s.wins===4){
      if(s.ultimate&&!s.ultimate.resolved){s.ultimate.force777=true;s.ultimate.reels=[7,7,7];}
      lushCircle(player.x,player.y,520,14+Math.min(3,upgradeCount.lushJackpot||0)*2);
      lushFx('jackpot',player.x,player.y,520,{life:100,maxLife:100});lushCashOut(true);
    }
  }else{
    s.pot=0;s.principal=0;s.wins=0;s.failureTime=180+Math.min(3,upgradeCount.lushRecovery||0)*60;
    if(transcended.lushRecovery)s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*.15);
    lushFx('loss',player.x,player.y,120,{life:55,maxLife:55});lushMessage('판돈 손실 · 확정 자산과 새로 번 칩은 유지');
  }
}
function lushSettlementBenefits(value=0){
  const s=lushState,greed=Math.min(3,upgradeCount.lushJackpot||0);
  s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*Math.min(.65,.12+value*.004)*(1-greed*.10));
  s.buff=Math.max(s.buffTime>0?s.buff:0,Math.min(2.5,.2+value*.008)*(1+greed*.10));
  s.buffTime=600+(transcended.lushJackpot?180:0);
}
function lushCashOut(jackpot=false){
  const s=lushState;if(s.bet||s.pot<=0)return false;
  const value=s.pot,profit=Math.max(0,value-s.principal),ledger=Math.min(3,upgradeCount.lushCollateral||0);
  s.chips+=value;lushGainAssets(profit*(1+ledger*.1));
  if(transcended.lushCollateral&&profit>0)player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.1);
  lushSettlementBenefits(value);s.pot=0;s.principal=0;s.wins=0;s.ready=true;
  lushFx('cash',player.x,player.y,190,{value,profit,life:75,maxLife:75});
  lushMessage(jackpot?'4연승 JACKPOT · 순이익 영구 자산화':`정산 ${value}칩 · 순이익 ${profit} 자산화`);return true;
}
function activateLushX(){
  if(player.lushxCooldown>0)return;
  if(!lushCashOut())lushSettlementBenefits();
  const tier=lushTier(),storm={x:player.x,y:player.y,age:0,life:72,power:2.8,radius:360+tier*20,currentRadius:0,hitsOut:new Set(),hitsIn:new Set(),phase:'out',particles:20+tier*4};
  lushState.chipStorms.push(storm);lushFx('chipStorm',player.x,player.y,storm.radius,{life:72,maxLife:72});
  player.lushxCooldown=LUSH_CD.x;
}
function activateLushR(){
  const s=lushState;if(player.level<10||player.lushrCooldown>0||s.ultimate)return;
  s.ultimate={age:0,duration:600,reels:[],stake:s.chips+s.pot,resolveAt:600,resolved:false,strength:0,force777:false,finaleAge:0,
    dealers:Array.from({length:4},(_,i)=>{const a=i*Math.PI/2+Math.PI/4;return{x:player.x+Math.cos(a)*230,y:player.y+Math.sin(a)*230,a,phase:i};})};
  s.portrait=120;player.lushrCooldown=LUSH_CD.r;
  lushFx('house',player.x,player.y,580,{life:100,maxLife:100});lushMessage('HOUSE ALL IN · 환영 딜러 집중포화 / 4연승은 777 확정');
}
function lushStopReel(){
  const u=lushState.ultimate;if(!u||u.resolved||u.reels.length>=3)return;
  const sevenChance=Math.min(.55,.22+lushState.pity*.055);
  u.reels.push(Math.random()<sevenChance?7:1+Math.floor(Math.random()*3));
  lushFx('reel',player.x,player.y,110+u.reels.length*35);
}
function lushQueueFinisher(type,x,y,radius,power,delay=0){
  if(lushState.finishers.length>=32)return;
  lushState.finishers.push({type,kind:type,x,y,age:-delay,delay,life:60,radius,power,triggered:false});
  if(type==='die')lushFx('giantDrop',x,y,radius,{delay:Math.max(0,delay-24),life:36,maxLife:36});
}
function lushRadialCards(count,power,kind='finisher'){
  for(let i=0;i<count;i++)lushSpawnCard(player.x,player.y,i*Math.PI*2/count,{kind,rank:4,power,radius:22,speed:24,range:1050,homing:0,suit:i%4,life:55});
}
function lushResolveUltimate(){
  const s=lushState,u=s.ultimate;if(!u||u.resolved)return;
  while(u.reels.length<3)lushStopReel();if(u.force777)u.reels=[7,7,7];
  const seven=u.reels.every(n=>n===7),triple=new Set(u.reels).size===1;
  u.resolved=true;u.finaleAge=0;u.jackpot=seven;u.result=seven?'jackpot':triple?'triple':'normal';u.finish=u.result;
  const bonus=1+Math.min(1.5,u.stake*.003)+u.strength*.12;
  if(seven){
    s.pity=0;lushRadialCards(48,5.5*bonus);lushCircle(player.x,player.y,620,6*bonus);
    lushQueueFinisher('die',player.x,player.y,400,16*bonus,24);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;lushQueueFinisher('cascade',player.x+Math.cos(a)*300,player.y+Math.sin(a)*300,225,8*bonus,40+i*4);}
    lushFx('jackpot',player.x,player.y,620,{life:110,maxLife:110});
  }else if(triple){
    s.pity=Math.min(6,s.pity+1);const targets=[...zombies].filter(z=>z.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,3);
    for(let i=0;i<3;i++){const target=targets[i]||targets[0],a=lushAim()+(i-1)*.4;lushQueueFinisher('die',target?target.x:player.x+Math.cos(a)*280,target?target.y:player.y+Math.sin(a)*280,280,14*bonus,12+i*18);}
    lushCircle(player.x,player.y,620,4*bonus);lushFx('house',player.x,player.y,620,{life:100,maxLife:100});
  }else{
    s.pity=Math.min(6,s.pity+1);lushRadialCards(36,5.8*bonus);lushCircle(player.x,player.y,620,6*bonus);
    lushFx('house',player.x,player.y,620,{life:100,maxLife:100});
  }
  s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*(seven?.4:.2));
  lushMessage(seven?'777 · ROYAL JACKPOT':triple?'TRIPLE · 거대 유리 주사위 연속 낙하':'하우스 정산 · 데드맨즈 카드 폭풍');
}
function lushUpdateRoyalBursts(){
  const s=lushState;
  for(let i=s.qBursts.length-1;i>=0;i--){const b=s.qBursts[i];
    if(b.age%7===0&&b.next<5){const rank=b.next++;
      lushSpawnCard(b.x,b.y,b.a,{kind:'royal',rank,suit:rank%4,castId:b.castId,replica:b.replica,power:(rank===4?3.8:1.65)*b.power,markPower:b.power,radius:34,speed:25,range:1100,homing:0,life:65});}
    b.age++;if(b.next===5)s.qBursts.splice(i,1);
  }
}
function lushUpdateCards(){
  const s=lushState,targets=[...zombies],ricochets=[];
  for(let i=s.cards.length-1;i>=0;i--){const c=s.cards[i],old={x:c.x,y:c.y};
    if(c.kind==='ricochet'){if(!lushUpdateRicochet(c))s.cards.splice(i,1);continue;}
    if(c.homing&&s.frame%3===0){const z=lushTarget(c.x,c.y,500,c.a);if(z)c.a+=Math.max(-c.homing*3,Math.min(c.homing*3,lushAngleDelta(Math.atan2(z.y-c.y,z.x-c.x),c.a)));}
    c.x+=Math.cos(c.a)*c.speed;c.y+=Math.sin(c.a)*c.speed;c.distance+=c.speed;c.life--;c.trail.push(old);if(c.trail.length>9)c.trail.shift();
    for(const z of targets){if(z.hp<=0||c.hits.has(z)||lushSegmentDistance(z,old,c)>(z.r||0)+c.radius)continue;
      c.hits.add(z);const marks=z.lushMarkUntil>=s.frame?z.lushMarks||0:0;
      if(c.kind==='royal'&&c.rank<4){z.lushMarks=Math.min(8,marks+1);z.lushMarkUntil=s.frame+180;lushFx('royalMark',z.x,z.y,42,{rank:c.rank,count:z.lushMarks,life:28,maxLife:28});}
      if(c.kind==='royal'&&c.rank===4&&marks){
        z.lushMarks=0;z.lushMarkUntil=0;const power=c.markPower||1;
        lushDamage(z,lushPower(c.power+marks*1.9*power));lushCircle(z.x,z.y,115+marks*9,marks*1.15*power);
        lushFx('royalDetonate',z.x,z.y,115+marks*9,{count:marks,life:56,maxLife:56});
      }else{
        const damage=lushPower(c.power);
        if(lushDamage(z,damage)&&c.ricochetEligible&&!c.ricochetUsed){c.ricochetUsed=true;ricochets.push({source:c,origin:z,damage});}
      }
      lushFx('hit',c.x,c.y,c.kind==='royal'?38:24);
    }
    if(c.life<=0||c.distance>=c.range)s.cards.splice(i,1);
  }
  // Spawning after iteration keeps the shared card cap from shifting active card indices.
  for(const r of ricochets)lushSpawnRicochet(r.source,r.origin,r.damage);
}
function lushUpdateDice(){
  const s=lushState;
  for(let i=s.dice.length-1;i>=0;i--){const d=s.dice[i];d.age++;
    if(d.travel<d.range){const old={x:d.x,y:d.y},step=Math.min(d.speed,d.range-d.travel);d.travel+=step;d.x+=Math.cos(d.a)*step;d.y+=Math.sin(d.a)*step;
      for(const z of [...zombies])if(!d.hits.has(z)&&lushSegmentDistance(z,old,d)<=(z.r||0)+36){d.hits.add(z);lushDamage(z,lushPower(2*d.power));}
      if(d.travel>=d.range)d.landedAt=d.age;
    }else if((d.age-d.landedAt)%10===0){
      const radius=160+d.pulses*10;lushCircle(d.x,d.y,radius,d.power);lushFx('pulse',d.x,d.y,radius,{golden:d.golden,eye:d.eye});d.pulses++;
      if(d.pulses>=d.eye){if(d.eye===6){const loaded=upgradeCount.lushLoaded||0;lushCircle(d.x,d.y,280,3.8*d.power*(loaded>0&&loaded<3?.8:1));lushFx('six',d.x,d.y,280,{golden:true,life:70,maxLife:70});}s.dice.splice(i,1);}
    }
  }
}
function lushUpdateChipStorms(){
  const s=lushState;
  for(let i=s.chipStorms.length-1;i>=0;i--){const c=s.chipStorms[i],previous=c.currentRadius;
    c.x=player.x;c.y=player.y;c.age++;c.phase=c.age<=36?'out':'in';c.currentRadius=c.radius*Math.sin(Math.min(1,c.age/72)*Math.PI);
    const hitSet=c.phase==='out'?c.hitsOut:c.hitsIn,lo=Math.min(previous,c.currentRadius)-28,hi=Math.max(previous,c.currentRadius)+28;
    for(const z of [...zombies]){const distance=Math.hypot(z.x-c.x,z.y-c.y);if(!hitSet.has(z)&&distance+(z.r||0)>=lo&&distance-(z.r||0)<=hi){hitSet.add(z);lushDamage(z,lushPower(c.power));lushFx('hit',z.x,z.y,28);}}
    if(c.age>=c.life)s.chipStorms.splice(i,1);
  }
}
function lushUpdateUltimate(){
  const s=lushState,u=s.ultimate;if(!u)return;u.age++;
  for(let i=0;i<u.dealers.length;i++){const d=u.dealers[i],a=i*Math.PI/2+Math.PI/4+Math.sin(u.age*.008)*.12;
    d.x+=(player.x+Math.cos(a)*230-d.x)*.18;d.y+=(player.y+Math.sin(a)*230-d.y)*.18;d.a=a;
    if(!u.resolved&&u.age%Math.max(12,36-u.strength*3)===0){const target=lushTarget(d.x,d.y,1200),angle=target?Math.atan2(target.y-d.y,target.x-d.x):lushAim();
      for(const off of [-.075,.075])lushSpawnCard(d.x,d.y,angle+off,{kind:'dealer',power:1.7+u.strength*.18,suit:i,homing:.027,range:1200,life:75});
      lushFx('dealerVolley',d.x,d.y,55,{angle,phase:i,life:24,maxLife:24});}
  }
  if(!u.resolved&&u.age%160===0)lushStopReel();
  if(!u.resolved&&u.age>=u.duration)lushResolveUltimate();
  if(u.resolved&&++u.finaleAge>=90)s.ultimate=null;
}
function lushUpdateFinishers(){
  const s=lushState;
  for(let i=s.finishers.length-1;i>=0;i--){const f=s.finishers[i];f.age++;
    if(f.age>=0&&!f.triggered){f.triggered=true;lushCircle(f.x,f.y,f.radius,f.power);lushFx(f.type==='die'?'six':'cascade',f.x,f.y,f.radius,{life:70,maxLife:70,golden:true});}
    if(f.age>=f.life)s.finishers.splice(i,1);
  }
}
function updateLush(){
  if(selectedCharacter!=='lush')return;const s=lushState;s.frame++;
  for(const key of ['q','e','x','r'])if(player['lush'+key+'Cooldown']>0)player['lush'+key+'Cooldown']--;
  if(s.buffTime>0)s.buffTime--;if(s.failureTime>0)s.failureTime--;if(s.messageTime>0)s.messageTime--;if(s.portrait>0)s.portrait--;
  if(s.bet&&++s.bet.age>=36)lushResolveBet();
  lushUpdateRoyalBursts();lushUpdateCards();lushUpdateDice();lushUpdateChipStorms();lushUpdateUltimate();lushUpdateFinishers();
  s.realm=Math.max(0,Math.min(1,s.realm+(s.ultimate?1/48:-1/60)));
  for(let i=s.effects.length-1;i>=0;i--){const e=s.effects[i];if(e.delay>0){e.delay--;continue;}e.age++;if(--e.life<=0)s.effects.splice(i,1);}
}
