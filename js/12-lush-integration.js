// Registration is isolated so existing heroes retain their own behavior.
characterSkillGuide.lush={name:'LusH',color:'#e8bc6c',passive:'탐욕 3단계와 초월: 흡혈 군주, 악의적 수익 창출을 보유하고 시작합니다. 처치 수익과 정산 순이익이 총자산으로 영구 누적됩니다. 자산이 커질수록 화력과 공격 단계가 성장하며, 4연승하면 대형 잭팟과 자동 정산이 발동합니다.',skills:[
  ['패시브 · 하우스 어드밴티지','탐욕 3단계·초월: 흡혈 군주·악의적 수익 창출을 보유하고 시작합니다. 경험치 획득량 1.95배, 일반 적 처치 시 최대 체력의 1% 회복. 처치당 칩과 총자산 +1. 총자산 1당 본체 피해 +0.5%. 자산 50/150/350/700에서 평타의 추가 카드 사격이 단계별로 늘어납니다. 총자산은 이번 게임 동안 유지되며 실패해도 줄지 않습니다. 원금은 중복 계산하지 않습니다.'],
  ['기본 공격 · 데드맨즈 핸드','약하게 유도되는 카드 세 장을 발사합니다. 첫 적을 맞힌 카드는 한 번 튕겨 주변의 다른 적에게 피해의 50%를 줍니다. 주변에 다른 적이 없으면 원래 적에게 돌아와 50% 피해를 줍니다. 네 번째 공격은 황금 에이스를 추가로 날리고, 자산이 성장할수록 추가 카드와 보조 사격이 생깁니다.'],
  ['Q · 로열 스트레이트','1100 거리까지 10·J·Q·K·A 다섯 장을 연속 관통 발사합니다. 각 카드는 첫 적에게 맞을 때까지 유도되며, 첫 적중 후에는 직선으로 관통합니다. 앞의 네 장이 문양을 새기고, 마지막 에이스가 문양을 연쇄 폭발시킵니다. 여러 문양이 쌓인 보스에게도 강력합니다.'],
  ['E · 더블 오어 다이','유리 주사위를 던져 관통·충격파 공격과 베팅을 동시에 진행합니다. 성공률 70% → 62.5% → 55% → 47.5%. 성공하면 판돈 두 배와 황금 주사위 추가 공격, 실패하면 미정산 판돈만 잃습니다. 칩이 없어도 공격은 발동합니다.'],
  ['X · 캐시아웃','유리 보호막과 왕복 칩 폭풍을 생성합니다. 판돈이 있으면 은행으로 정산하고 순이익만 총자산에 더하며, 10초 공격 강화를 얻습니다. 판돈이 없어도 기본 방어·공격은 사용 가능합니다.'],
  ['R · 하우스 올인','10레벨부터 사용. 10초간 카지노를 열고 네 환영 딜러가 함께 이동하며 카드 사격과 Q 복제를 수행합니다. E 성공 시 딜러 강화. 종료 시 카드 폭풍/거대 주사위 3개/777 연쇄 폭발로 마무리합니다. 궁극기 중 4연승은 777 확정!']
]};
guideCharacterOrder.push('lush');MOBILE_SKILL_KEYS.lush=['q','e','x','r'];
const lushAugmentDefs=[
  {id:'lushLoaded',name:'사기 주사위',desc:'최저 눈 2→3→3 · 6의 추가 낙하 피해 -20% (3단계에서 해제)',transcendName:'초월: 설계된 행운',transcendDesc:'최저 눈 3을 유지하고 베팅 성공 시 보호막 10%를 얻습니다.'},
  {id:'lushCollateral',name:'황금 장부',desc:'정산 순이익의 총자산 반영량 +10% (최대 +30%)',transcendName:'초월: 황금 결산',transcendDesc:'판돈을 정산할 때 최대 체력의 10%를 회복합니다.'},
  {id:'lushRecovery',name:'잃을 게 없는 자',desc:'실패 후 공격 간격 감소 · 이동 속도 +8% · 지속시간 +1초',transcendName:'초월: 역전의 발걸음',transcendDesc:'베팅 실패 시 체력 15% 보호막을 얻습니다.'},
  {id:'lushJackpot',name:'잭팟 중독',desc:'캐시아웃 공격 강화 +10% · 보호막 보상 -10%',transcendName:'초월: 끝없는 여운',transcendDesc:'캐시아웃 공격 강화의 지속시간이 3초 증가합니다.'}
];
lushAugmentDefs.forEach(def=>{exclusiveAugmentOwners[def.id]='lush';upgradeCount[def.id]=0;transcended[def.id]=false;upgrades.push({...def,category:'support',requires(){return selectedCharacter==='lush';},apply(){upgradeCount[def.id]=(upgradeCount[def.id]||0)+1;if(upgradeCount[def.id]>=4)transcended[def.id]=true;}});});
function grantLushStartingAugments(){
  if(selectedCharacter!=='lush')return;
  for(const [id,count] of [['greed',4],['maliciousProfit',1]]){
    const upgrade=upgrades.find(item=>item.id===id);
    // Use the real selections so their gameplay effects and reward exclusions agree.
    while((upgradeCount[id]||0)<count)upgrade.apply();
    let owned=selectedAugments.find(item=>item.id===id);
    if(!owned){owned={id};selectedAugments.push(owned);}
    Object.assign(owned,{name:upgrade.name,category:upgrade.category,count:upgradeCount[id]});
  }
}
const lushRestartBase=restart;
restart=function(){lushRestartBase();resetLush();grantLushStartingAugments();};
resetLush();
const lushShootBase=shoot;
shoot=function(){return selectedCharacter==='lush'?attackWithLush():lushShootBase();};
const lushReloadBase=reload;
reload=function(){if(selectedCharacter!=='lush')return lushReloadBase();};
const lushKillBase=killZombie;
killZombie=function(index,zombie,allowExplosion=true){
  if(selectedCharacter==='lush'&&zombies.includes(zombie))lushAwardKill(zombie);
  return lushKillBase(index,zombie,allowExplosion);
};
const lushShieldBase=absorbSuncallShield;
absorbSuncallShield=function(damage){
  if(selectedCharacter!=='lush')return lushShieldBase(damage);
  const absorbed=Math.min(damage,lushState.shield);lushState.shield-=absorbed;return damage-absorbed;
};
const lushUpdateBase=update;
update=function(){
  const active=screenMode==='game'&&!paused&&!gameOver&&!raidVictory&&!choosingUpgrade&&!isMobilePortraitMode();
  lushUpdateBase();if(active&&!gameOver&&!raidVictory&&!choosingUpgrade)updateLush();
};
const lushMoveBase=updatePlayer;
updatePlayer=function(){const speed=player.speed;if(selectedCharacter==='lush'&&lushState.failureTime>0)player.speed*=1+Math.min(3,upgradeCount.lushRecovery||0)*.08;try{return lushMoveBase();}finally{player.speed=speed;}};
addEventListener('keydown',e=>{
  if(selectedCharacter!=='lush'||!['q','e','x','r'].includes(e.key.toLowerCase())||screenMode!=='game'||paused||gameOver||raidVictory||choosingUpgrade)return;
  e.stopImmediatePropagation();if(e.repeat)return;({q:activateLushQ,e:activateLushE,x:activateLushX,r:activateLushR})[e.key.toLowerCase()]();
},true);
const lushPreviewBase=getCharacterPreviewSprite;
getCharacterPreviewSprite=function(id,thumbnail=false){return id==='lush'?ensureGameImage(thumbnail?lushArt.thumb:lushArt.body,'high'):lushPreviewBase(id,thumbnail);};
const lushPlayerBase=drawPlayer;
drawPlayer=function(){return selectedCharacter==='lush'?drawLushPlayer():lushPlayerBase();};
const lushParticlesBase=drawParticles;
drawParticles=function(){lushParticlesBase();drawLushEffects();};
const lushBackgroundBase=drawBackground;
drawBackground=function(){lushBackgroundBase();drawLushRealm();};
const lushDrawBase=draw;
draw=function(){lushDrawBase();if(!isMobilePortraitMode())drawLushUltimatePortrait();};
const lushHudBase=drawHUD;
drawHUD=function(){if(selectedCharacter!=='lush')return lushHudBase();ctx.save();ctx.textAlign='left';ctx.fillStyle='#ffe3ad';ctx.font='bold 16px DoHyeon, Arial';ctx.fillText('LusH · 운명의 도박사',20,85);ctx.font='12px Arial';ctx.fillText(`처치 ${player.kills} · 점수 ${player.score}`,20,107);ctx.restore();drawLushInterface();};
const lushHpBase=drawHealthBar;
drawHealthBar=function(){if(selectedCharacter!=='lush')return lushHpBase();const w=Math.min(520,canvas.width-80);drawLushBar((canvas.width-w)/2,16,w,30,player.hp/player.maxHp,`HP ${Math.ceil(Math.max(0,player.hp))}/${player.maxHp}  ·  보호막 ${Math.ceil(lushState.shield)}`,'hp');};
const lushXpBase=drawExpBar;
drawExpBar=function(){if(selectedCharacter!=='lush')return lushXpBase();const mobile=isMobileTouchDevice(),margin=mobile?Math.max(120,canvas.width*.29):Math.min(260,canvas.width*.22),w=Math.max(150,canvas.width-margin*2);drawLushBar((canvas.width-w)/2,canvas.height-(mobile?57:35),w,22,player.exp/player.expNeed,`LV.${player.level} · EXP ${Math.floor(player.exp)}/${player.expNeed}`,'xp');};
const lushResourceBase=drawMobileCharacterResource;
drawMobileCharacterResource=function(){if(selectedCharacter!=='lush')return lushResourceBase();const b=getLushMobileResourceBounds();drawLushResource(b.x-b.w/2,b.y-b.h/2,b.w,b.h,true);};
const lushHudBoundsBase=getMobileHudBounds;
getMobileHudBounds=function(id){if(selectedCharacter==='lush'){if(id==='resource')return getLushMobileResourceBounds();if(id==='exp'){const m=Math.max(120,canvas.width*.29);return{x:canvas.width/2,y:canvas.height-46,w:Math.max(150,canvas.width-m*2)+20,h:32};}}return lushHudBoundsBase(id);};
const lushMobileControlsBase=drawMobileControls;
drawMobileControls=function(){return selectedCharacter==='lush'?drawLushMobileControls():lushMobileControlsBase();};
const lushSkillIconBase=getMobileSkillIcon;
getMobileSkillIcon=function(key){return selectedCharacter==='lush'?{image:ensureGameImage(lushArt.skills[{q:0,e:1,x:2,r:3}[key]])}:lushSkillIconBase(key);};
const lushSkillNameBase=getMobileSkillName;
getMobileSkillName=function(key){return selectedCharacter==='lush'?{q:'로열 스트레이트',e:'더블 오어 다이',x:'캐시아웃',r:'하우스 올인'}[key]:lushSkillNameBase(key);};
const lushSkillCooldownBase=getMobileSkillCooldown;
getMobileSkillCooldown=function(key){return selectedCharacter==='lush'?{value:player['lush'+key+'Cooldown']||0,max:LUSH_CD[key]||1}:lushSkillCooldownBase(key);};
const lushSkillTargetBase=getMobileSkillTargetSpec;
getMobileSkillTargetSpec=function(key){
  if(selectedCharacter!=='lush')return lushSkillTargetBase(key);
  if(key==='q')return {type:'line',range:1100,width:68,capsule:true};
  if(key==='e')return {type:'line',range:500,width:72,endRadius:280,capsule:true};
  if(key==='x')return {type:'self',range:360+lushTier()*20,aim:false};
  if(key==='r')return {type:'self',range:620,aim:false};
  return null;
};
const lushAttackTargetBase=getMobileAttackTargetSpec;
getMobileAttackTargetSpec=function(){return selectedCharacter==='lush'?{type:'cone',range:980,arc:.34,centerArrow:true}:lushAttackTargetBase();};
const lushAugmentIconBase=drawAugmentIcon;
drawAugmentIcon=function(id,x,y,size,transcendent=false){
  const i=lushAugmentDefs.findIndex(d=>d.id===id);if(i<0)return lushAugmentIconBase(id,x,y,size,transcendent);if(size<=0)return;
  const im=ensureGameImage(lushArt.augments[i]),cx=x+size/2,cy=y+size/2,r=size/2;ctx.save();ctx.shadowBlur=0;
  // Each source has a square decorative border. Crop it away before fitting the art
  // to the same circular bounds used in both upgrade cards and the character guide.
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#260d1a';ctx.fill();
  if(im.complete&&im.naturalWidth&&im.naturalHeight){const crop=Math.min(im.naturalWidth,im.naturalHeight)*.90;ctx.drawImage(im,(im.naturalWidth-crop)/2,(im.naturalHeight-crop)/2,crop,crop,x,y,size,size);}
  const line=Math.max(1,Math.min(2,size*.025));ctx.strokeStyle=transcendent?'#ffedb2':'#d4a15d';ctx.lineWidth=line;ctx.beginPath();ctx.arc(cx,cy,Math.max(0,r-line/2),0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=transcendent?'#fff4d2b0':'#8a3a4c';ctx.lineWidth=line*.55;ctx.beginPath();ctx.arc(cx,cy,Math.max(0,r-line*1.8),0,Math.PI*2);ctx.stroke();ctx.restore();
};
