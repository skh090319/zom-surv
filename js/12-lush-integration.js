// Registration is isolated so existing heroes retain their own behavior.
characterSkillGuide.lush={name:'LusH',color:'#e8bc6c',passive:'처치로 칩을 모아 판돈을 두 배로 불립니다. 연속 성공 확률은 70% → 62.5% → 55% → 47.5%. 4연승하면 잭팟과 자동 정산! 새로 얻는 칩은 판돈과 별도로 보관됩니다.',skills:[
  ['기본 공격 · 밑장 빼기','카드를 던집니다. 네 번째 공격은 관통·분열·폭발·흡혈 중 하나로 강화됩니다.'],
  ['Q · 데드 다이스','500 거리까지 유리 주사위를 굴려 관통하고, 멈춘 자리에서 주사위 눈만큼 충격파를 냅니다. 6이면 거대 주사위가 추가 낙하합니다. 공격 종료 후 베팅이 열립니다.'],
  ['E · 더블 오어 낫싱','보유 칩을 베팅하거나 현재 판돈을 다시 겁니다. 성공하면 두 배의 판돈과 강화 주사위 공격. 실패하면 판돈을 잃고 발밑에 1초 뒤 터지는 위험 지대가 생깁니다.'],
  ['X · 캐시아웃','판돈을 보호막과 10초 공격 강화로 확정합니다. 첫 베팅 전에는 칩을 잃지 않고 판을 닫습니다.'],
  ['R · 하우스 올인','10레벨부터 사용. 칩과 판돈을 모두 걸어 6초간 카지노를 엽니다. 평타로 슬롯 릴을 멈추며, 미조작 시 자동 정지합니다. 777은 대형 잭팟, 다른 조합도 광역 공격을 냅니다. 실패한 궁극기마다 다음 7 출현 확률이 증가합니다.']
]};
guideCharacterOrder.push('lush');MOBILE_SKILL_KEYS.lush=['q','e','x','r'];
const lushAugmentDefs=[
  {id:'lushLoaded',name:'사기 주사위',desc:'주사위 최저 눈 +1 (최대 3) · 6의 추가 낙하 피해 -20%',transcendName:'초월: 설계된 행운',transcendDesc:'최저 눈 3을 유지하고 베팅 성공 시 보호막 10%를 얻습니다.'},
  {id:'lushCollateral',name:'목숨 담보',desc:'칩이 없을 때 체력 15%를 걸어 베팅 · 담보 칩 16/20/24',transcendName:'초월: 최후의 담보',transcendDesc:'담보로 시작한 판의 성공 시 소모 체력을 회복합니다.'},
  {id:'lushRecovery',name:'잃을 게 없는 자',desc:'실패 후 공격 간격 감소 · 이동 속도 +8% · 지속시간 +1초',transcendName:'초월: 역전의 발걸음',transcendDesc:'베팅 실패 시 체력 15% 보호막을 얻습니다.'},
  {id:'lushJackpot',name:'잭팟 중독',desc:'캐시아웃 공격 강화 +10% · 보호막 보상 -10%',transcendName:'초월: 끝없는 여운',transcendDesc:'캐시아웃 공격 강화의 지속시간이 3초 증가합니다.'}
];
lushAugmentDefs.forEach(def=>{exclusiveAugmentOwners[def.id]='lush';upgradeCount[def.id]=0;transcended[def.id]=false;upgrades.push({...def,category:'support',requires(){return selectedCharacter==='lush';},apply(){upgradeCount[def.id]=(upgradeCount[def.id]||0)+1;if(upgradeCount[def.id]>=4)transcended[def.id]=true;}});});
const lushRestartBase=restart;
restart=function(){lushRestartBase();resetLush();};
resetLush();
const lushShootBase=shoot;
shoot=function(){return selectedCharacter==='lush'?attackWithLush():lushShootBase();};
const lushReloadBase=reload;
reload=function(){if(selectedCharacter!=='lush')return lushReloadBase();};
const lushKillBase=killZombie;
killZombie=function(index,zombie,allowExplosion=true){
  if(selectedCharacter==='lush'&&zombies.includes(zombie))lushState.chips++;
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
drawMobileCharacterResource=function(){if(selectedCharacter!=='lush')return lushResourceBase();const w=Math.min(370,canvas.width*.44);drawLushResource((canvas.width-w)/2,canvas.height-110,w,38,true);};
const lushHudBoundsBase=getMobileHudBounds;
getMobileHudBounds=function(id){if(selectedCharacter==='lush'){if(id==='resource')return{x:canvas.width/2,y:canvas.height-91,w:Math.min(370,canvas.width*.44),h:38};if(id==='exp'){const m=Math.max(120,canvas.width*.29);return{x:canvas.width/2,y:canvas.height-46,w:Math.max(150,canvas.width-m*2)+20,h:32};}}return lushHudBoundsBase(id);};
const lushMobileControlsBase=drawMobileControls;
drawMobileControls=function(){return selectedCharacter==='lush'?drawLushMobileControls():lushMobileControlsBase();};
const lushSkillIconBase=getMobileSkillIcon;
getMobileSkillIcon=function(key){return selectedCharacter==='lush'?{image:ensureGameImage(lushArt.skills[{q:0,e:1,x:2,r:3}[key]])}:lushSkillIconBase(key);};
const lushSkillNameBase=getMobileSkillName;
getMobileSkillName=function(key){return selectedCharacter==='lush'?{q:'데드 다이스',e:lushState.pot?'재베팅':'베팅',x:'보상 확정',r:'하우스 올인'}[key]:lushSkillNameBase(key);};
const lushSkillCooldownBase=getMobileSkillCooldown;
getMobileSkillCooldown=function(key){return selectedCharacter==='lush'?{value:player['lush'+key+'Cooldown']||0,max:LUSH_CD[key]||1}:lushSkillCooldownBase(key);};
const lushSkillTargetBase=getMobileSkillTargetSpec;
getMobileSkillTargetSpec=function(key){
  if(selectedCharacter!=='lush')return lushSkillTargetBase(key);
  if(key==='q')return {type:'line',range:500,width:68,endRadius:245,capsule:true};
  if(key==='r')return {type:'self',range:600,aim:false};
  return null;
};
const lushAttackTargetBase=getMobileAttackTargetSpec;
getMobileAttackTargetSpec=function(){return selectedCharacter==='lush'?{type:'line',range:765,width:18}:lushAttackTargetBase();};
const lushAugmentIconBase=drawAugmentIcon;
drawAugmentIcon=function(id,x,y,size,transcendent=false){const i=lushAugmentDefs.findIndex(d=>d.id===id);if(i<0)return lushAugmentIconBase(id,x,y,size,transcendent);const im=ensureGameImage(lushArt.augments[i]);if(im.complete&&im.naturalWidth)ctx.drawImage(im,x,y,size,size);};
