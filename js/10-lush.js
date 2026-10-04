// LusH: run-local chips, explicit press-your-luck rounds and a four-win jackpot.
const LUSH_CD={q:240,e:42,x:60,r:1800};
const LUSH_ODDS=[.70,.625,.55,.475];
let lushState;
function resetLush(){
  lushState={chips:0,pot:0,wins:0,ready:false,bet:null,dice:[],cards:[],effects:[],hazards:[],
    frame:0,shots:0,lastDie:1,lastAngle:0,shield:0,buff:0,buffTime:0,failureTime:0,
    ultimate:null,realm:0,portrait:0,pity:0,message:'Q로 판을 열고 E로 베팅',messageTime:0};
  for(const key of ['q','e','x','r'])player['lush'+key+'Cooldown']=0;
  for(const key of ['lushLoaded','lushCollateral','lushRecovery','lushJackpot']){upgradeCount[key]=0;transcended[key]=false;}
}
function lushOdds(){return LUSH_ODDS[Math.min(3,lushState.wins)];}
function lushMessage(text){lushState.message=text;lushState.messageTime=180;}
function lushFx(type,x,y,r=70,extra={}){
  if(lushState.effects.length>=96)lushState.effects.shift();
  lushState.effects.push({type,x,y,r,age:0,life:48,maxLife:48,seed:lushState.frame,...extra});
}
function lushPower(mult){return scaledDamage(player.damage*mult*(1+(lushState.buffTime>0?lushState.buff:0)));}
function lushDamage(z,damage){if(!z||z.hp<=0||!zombies.includes(z))return false;z.hp-=damage;if(z.hp<=0)killZombie(zombies.indexOf(z),z);return true;}
function lushCircle(x,y,r,power){for(const z of [...zombies])if(Math.hypot(z.x-x,z.y-y)<=r+(z.r||0))lushDamage(z,lushPower(power));}
function lushSegmentDistance(z,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((z.x-a.x)*dx+(z.y-a.y)*dy)/d)):0;return Math.hypot(z.x-a.x-dx*t,z.y-a.y-dy*t);}
function lushAim(){return Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);}
function lushRoll(){const min=Math.min(3,1+(upgradeCount.lushLoaded||0));return min+Math.floor(Math.random()*(7-min));}
function lushLaunchDie(power=1,opensBet=false){
  const angle=lushAim(),eye=lushRoll();lushState.lastDie=eye;lushState.lastAngle=angle;
  lushState.dice.push({x:player.x,y:player.y,a:angle,eye,power,age:0,travel:0,pulses:0,opensBet,hits:new Set()});
  lushFx('cast',player.x,player.y,70);return eye;
}
function attackWithLush(){
  if(player.fireCooldown>0)return;
  const empowered=++lushState.shots%4===0,suit=empowered?Math.floor(Math.random()*4):-1,a=lushAim();
  for(const off of suit===1?[-.16,0,.16]:[0])lushState.cards.push({x:player.x,y:player.y,a:a+off,life:45,suit,hits:new Set(),trail:[]});
  player.fireCooldown=lushState.failureTime>0&&upgradeCount.lushRecovery>0?15:23;
  // Each attack stops one reel; a fallback timer resolves it even without targets.
  if(lushState.ultimate&&lushState.ultimate.age>=24)lushStopReel();
}
function activateLushQ(){
  if(player.lushqCooldown>0||lushState.bet||lushState.ultimate)return;
  if(lushState.pot>0||lushState.ready){lushMessage('E 재베팅 또는 X 보상 확정');return;}
  lushLaunchDie(1,true);player.lushqCooldown=LUSH_CD.q;
}
function activateLushE(){
  const s=lushState;if(player.lusheCooldown>0||s.bet||s.ultimate||!s.ready||s.wins>=4)return;
  let collateral=false;
  if(!s.pot){
    if(s.chips<=0){
      if(!(upgradeCount.lushCollateral>0)||player.hp<=player.maxHp*.2){lushMessage('적 처치로 칩을 모으세요');return;}
      player.hp-=player.maxHp*.15;s.pot=12+Math.min(3,upgradeCount.lushCollateral)*4;collateral=true;
    }else{s.pot=s.chips;s.chips=0;}
  }
  s.bet={age:0,chance:lushOdds(),amount:s.pot,collateral};s.ready=false;player.lusheCooldown=LUSH_CD.e;
  lushFx('wager',player.x,player.y,100,{life:42,maxLife:42});
}
function lushResolveBet(){
  const s=lushState,b=s.bet;if(!b)return;s.bet=null;
  if(Math.random()<b.chance){
    if(transcended.lushLoaded)s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*.1);
    if(transcended.lushCollateral&&b.collateral)player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.15);
    s.pot=b.amount*2;s.wins++;s.ready=true;
    lushLaunchDie(1+s.wins*.5,false);lushFx('win',player.x,player.y,150,{life:65,maxLife:65});
    lushMessage(`${s.wins}연승 · 판돈 ${s.pot} · 다음 ${(lushOdds()*100).toFixed(1).replace('.0','')}%`);
    if(s.wins===4){lushCircle(player.x,player.y,500,9+(upgradeCount.lushJackpot||0));lushFx('jackpot',player.x,player.y,500,{life:90,maxLife:90});lushCashOut(true);}
  }else{
    s.pot=0;s.wins=0;s.ready=false;s.failureTime=180+Math.min(3,upgradeCount.lushRecovery||0)*60;
    if(transcended.lushRecovery)s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*.15);
    s.hazards.push({x:player.x,y:player.y,r:100,age:0});
    lushFx('loss',player.x,player.y,110,{life:70,maxLife:70});lushMessage('베팅 실패 · 붉은 파열 지대에서 이탈');
  }
}
function lushCashOut(jackpot=false){
  const s=lushState;if(s.bet||!s.ready||s.pot<=0)return false;
  const value=s.pot,greed=Math.min(3,upgradeCount.lushJackpot||0);
  s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*Math.min(.8,.10+value*.007)*(1-greed*.10));
  s.buff=Math.min(2.5,.15+value*.008)*(1+greed*.10);s.buffTime=600+(transcended.lushJackpot?180:0);
  s.pot=0;s.wins=0;s.ready=false;lushFx('cash',player.x,player.y,160,{life:75,maxLife:75});
  lushMessage(jackpot?'4연승 JACKPOT · 보상 자동 확정':`보상 확정 · ${value} 칩`);return true;
}
function activateLushX(){
  if(player.lushxCooldown>0||lushState.bet)return;
  if(lushCashOut()){player.lushxCooldown=LUSH_CD.x;return;}
  if(lushState.ready&&!lushState.pot){lushState.ready=false;lushMessage('판 종료 · 칩은 보관됩니다');}
}
function activateLushR(){
  const s=lushState;if(player.level<10||player.lushrCooldown>0||s.bet||s.ultimate)return;
  const stake=s.chips+s.pot;s.chips=0;s.pot=0;s.wins=0;s.ready=false;
  // An in-flight opening die must not reopen the round consumed by All In.
  for(const die of s.dice)die.opensBet=false;
  s.ultimate={age:0,reels:[],stake,resolveAt:0};s.portrait=120;player.lushrCooldown=LUSH_CD.r;
  lushFx('house',player.x,player.y,520,{life:90,maxLife:90});lushMessage('HOUSE ALL IN · 평타로 릴을 멈추세요');
}
function lushStopReel(){
  const u=lushState.ultimate;if(!u||u.reels.length>=3)return;
  const sevenChance=Math.min(.55,.22+lushState.pity*.055);
  u.reels.push(Math.random()<sevenChance?7:1+Math.floor(Math.random()*3));
  lushFx('reel',player.x,player.y,100+u.reels.length*35);
  if(u.reels.length===3)u.resolveAt=u.age+35;
}
function lushResolveUltimate(){
  const s=lushState,u=s.ultimate,seven=u.reels.every(n=>n===7),triple=new Set(u.reels).size===1,pair=new Set(u.reels).size===2;
  const power=(seven?22:triple?13:pair?9:6)*(1+Math.min(1.5,u.stake*.008));
  lushCircle(player.x,player.y,600,power);lushFx(seven?'jackpot':'house',player.x,player.y,600,{life:100,maxLife:100});
  if(seven){s.pity=0;for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=player.x+Math.cos(a)*360,y=player.y+Math.sin(a)*360;lushFx('cascade',x,y,155,{life:100,maxLife:100,delay:i*7});}}
  else s.pity=Math.min(6,s.pity+1);
  s.shield=Math.min(player.maxHp*.8,s.shield+player.maxHp*(triple?.35:.15));
  lushMessage(seven?'777 · JACKPOT':triple?'TRIPLE · 골든 플러시':pair?'PAIR · 더블 스트라이크':'하우스 정산 · 카드 폭풍');u.resolved=true;
}
function updateLush(){
  if(selectedCharacter!=='lush')return;const s=lushState;s.frame++;
  for(const key of ['q','e','x','r'])if(player['lush'+key+'Cooldown']>0)player['lush'+key+'Cooldown']--;
  if(s.buffTime>0)s.buffTime--;if(s.failureTime>0)s.failureTime--;if(s.messageTime>0)s.messageTime--;if(s.portrait>0)s.portrait--;
  if(s.bet&&++s.bet.age>=36)lushResolveBet();
  for(let i=s.cards.length-1;i>=0;i--){const c=s.cards[i],old={x:c.x,y:c.y};c.x+=Math.cos(c.a)*17;c.y+=Math.sin(c.a)*17;c.life--;c.trail.push(old);if(c.trail.length>6)c.trail.shift();
    for(const z of [...zombies])if(!c.hits.has(z)&&lushSegmentDistance(z,old,c)<=z.r+9){c.hits.add(z);const hit=lushDamage(z,lushPower(c.suit<0?1:1.5));
      if(c.suit===2){lushCircle(c.x,c.y,85,1.2);lushFx('pulse',c.x,c.y,85);}if(c.suit===3&&hit)player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.025);
      lushFx('hit',c.x,c.y,25);if(c.suit!==0){c.life=0;break;}}
    if(c.life<=0)s.cards.splice(i,1);
  }
  for(let i=s.dice.length-1;i>=0;i--){const d=s.dice[i];d.age++;
    if(d.travel<500){const old={x:d.x,y:d.y},step=Math.min(15,500-d.travel);d.travel+=step;d.x+=Math.cos(d.a)*step;d.y+=Math.sin(d.a)*step;
      for(const z of [...zombies])if(!d.hits.has(z)&&lushSegmentDistance(z,old,d)<=z.r+34){d.hits.add(z);lushDamage(z,lushPower(1.8*d.power));}
    }else if((d.age-34)%10===0){
      const radius=145+d.pulses*9;lushCircle(d.x,d.y,radius,d.power);lushFx('pulse',d.x,d.y,radius);d.pulses++;
      if(d.pulses>=d.eye){if(d.eye===6){lushCircle(d.x,d.y,245,3*d.power*(upgradeCount.lushLoaded>0?.8:1));lushFx('six',d.x,d.y,245,{life:70,maxLife:70});}
        if(d.opensBet){s.ready=true;lushMessage(`주사위 ${d.eye} · E 베팅 ${(lushOdds()*100).toFixed(1).replace('.0','')}%`);}s.dice.splice(i,1);}
    }
  }
  for(let i=s.hazards.length-1;i>=0;i--){const h=s.hazards[i];if(++h.age===60){if(Math.hypot(player.x-h.x,player.y-h.y)<h.r+player.r)raidPlayerDamage(.12);lushFx('loss',h.x,h.y,h.r);}if(h.age>85)s.hazards.splice(i,1);}
  const u=s.ultimate;if(u){u.age++;if(u.age>=60&&u.age%50===0)lushStopReel();if(u.resolveAt&&u.age>=u.resolveAt&&!u.resolved)lushResolveUltimate();
    if(u.resolved&&u.age%18===0){const a=u.age*.3;lushCircle(player.x+Math.cos(a)*260,player.y+Math.sin(a)*260,150,1.4);lushFx('pulse',player.x+Math.cos(a)*260,player.y+Math.sin(a)*260,150);}
    if(u.age>=360)s.ultimate=null;}
  s.realm=Math.max(0,Math.min(1,s.realm+(s.ultimate?1/48:-1/60)));
  for(let i=s.effects.length-1;i>=0;i--){const e=s.effects[i];if(e.delay>0){e.delay--;continue;}e.age++;if(--e.life<=0)s.effects.splice(i,1);}
}
