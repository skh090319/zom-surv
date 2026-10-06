// Late registration restores combat without altering the existing human/menu presentation.
characterSkillGuide.oblivion={name:'오블리비언',color:'#f25277',passive:'적중과 처치로 붕괴를 모으고, 처치 시 최대 체력의 8% 보호막을 얻습니다. X로 괴수의 힘을 해방해 평타·Q·E를 강화하고, R로 재앙의 화신을 불러 10초간 완전한 힘을 펼칩니다.',skills:[
  ['패시브 · 붕괴의 잔재','적중 시 붕괴 +2(프레임당 최대 12), 처치 시 +5. 처치할 때 최대 체력의 8% 보호막을 얻으며 최대 50%까지 중첩됩니다. 보호막은 마지막 처치 후 5초간 유지됩니다.'],
  ['기본 공격 · 봉인 파편','1050 거리까지 적을 관통하는 검붉은 파편 세 개를 나란히 발사합니다. 봉인 해제 시 기본 공격이 전방 300 범위를 크게 가르는 재앙의 손톱으로 변합니다.'],
  ['Q · 공간 파쇄','전방의 차원을 길게 찢어 관통 피해를 주고, 잠시 뒤 균열을 닫으며 다시 절단합니다. 해방 중에는 세 갈래 균열과 끝점 붕괴로 강화됩니다.'],
  ['E · 재앙의 손','600 거리 내 지정 위치에 거대한 양손을 불러 적을 조인 뒤 압살합니다. 해방 중에는 범위와 위력이 증가하고 거대한 손이 위에서 한 번 더 내려칩니다.'],
  ['X · 봉인 해제','붕괴 20 이상에서 괴수 형태로 전환합니다. 초당 붕괴 6을 소모하며 평타·Q·E를 강화합니다. 다시 누르면 즉시 봉인해 남은 붕괴를 보존합니다. 체력은 소모하지 않습니다.'],
  ['R · 종언의 현현','10레벨부터 사용. 10초간 완전히 해방되고 붕괴 소모가 멈춥니다. 뒤따르는 재앙의 화신이 평타·Q·E를 72% 위력으로 재현합니다. 종료 시 조준 방향으로 거대한 차원을 찢고 닫으며 마무리합니다.']
]};
if(!guideCharacterOrder.includes('oblivion'))guideCharacterOrder.push('oblivion');
MOBILE_SKILL_KEYS.oblivion=['q','e','x','r'];
const oblivionCombatRestartBase=restart;
restart=function(){oblivionCombatRestartBase();resetOblivionCombat();resetOblivionCombatHud();};
resetOblivionCombat();resetOblivionCombatHud();
const oblivionCombatShootBase=shoot;
shoot=function(){return selectedCharacter==='oblivion'?attackWithOblivion():oblivionCombatShootBase();};
const oblivionCombatReloadBase=reload;
reload=function(){if(selectedCharacter!=='oblivion')return oblivionCombatReloadBase();};
const oblivionCombatKillBase=killZombie;
killZombie=function(index,zombie,allowExplosion=true){if(selectedCharacter==='oblivion'&&zombies.includes(zombie))oblivionAwardKill(zombie);return oblivionCombatKillBase(index,zombie,allowExplosion);};
const oblivionCombatShieldBase=absorbSuncallShield;
absorbSuncallShield=function(damage){if(selectedCharacter!=='oblivion')return oblivionCombatShieldBase(damage);const absorbed=Math.min(Math.max(0,damage),oblivionState.shield);oblivionState.shield-=absorbed;return damage-absorbed;};
const oblivionCombatUpdateBase=update;
update=function(){
  const active=selectedCharacter==='oblivion'&&screenMode==='game'&&!paused&&!gameOver&&!raidVictory&&!choosingUpgrade&&!isMobilePortraitMode();
  oblivionCombatUpdateBase();if(active&&!paused&&!gameOver&&!raidVictory&&!choosingUpgrade){updateOblivionCombat();updateOblivionCombatHud();}
};
addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(selectedCharacter!=='oblivion'||!['q','e','x','r'].includes(key)||screenMode!=='game'||paused||gameOver||raidVictory||choosingUpgrade||isMobilePortraitMode())return;
  e.stopImmediatePropagation();if(e.repeat)return;({q:activateOblivionQ,e:activateOblivionE,x:activateOblivionX,r:activateOblivionR})[key]();
},true);
const oblivionCombatPlayerBase=drawPlayer;
drawPlayer=function(){if(selectedCharacter==='oblivion'&&drawOblivionCombatPlayer())return;return oblivionCombatPlayerBase();};
const oblivionCombatParticlesBase=drawParticles;
drawParticles=function(){oblivionCombatParticlesBase();if(selectedCharacter==='oblivion')drawOblivionCombatEffects();};
const oblivionCombatBackgroundBase=drawBackground;
drawBackground=function(){oblivionCombatBackgroundBase();if(selectedCharacter==='oblivion')drawOblivionCombatRealm();};
// The replacement backdrop/cut-in owns Oblivion only; Mare keeps the shared renderer.
const oblivionCombatLegacyBackdropBase=drawHeroUltimateBackdrop;
drawHeroUltimateBackdrop=function(){if(selectedCharacter!=='oblivion')return oblivionCombatLegacyBackdropBase();};
const oblivionCombatLegacyPortraitBase=drawHeroUltimatePortrait;
drawHeroUltimatePortrait=function(){if(selectedCharacter!=='oblivion')return oblivionCombatLegacyPortraitBase();};
const oblivionCombatDrawBase=draw;
draw=function(){oblivionCombatDrawBase();if(selectedCharacter==='oblivion'&&!isMobilePortraitMode())drawOblivionCombatPortrait();};
const oblivionCombatHudBase=drawHUD;
drawHUD=function(){if(selectedCharacter!=='oblivion')return oblivionCombatHudBase();};
const oblivionCombatHpBase=drawHealthBar;
drawHealthBar=function(){return selectedCharacter==='oblivion'?drawOblivionCombatBar(getOblivionHealthBounds(),'hp'):oblivionCombatHpBase();};
const oblivionCombatXpBase=drawExpBar;
drawExpBar=function(){return selectedCharacter==='oblivion'?drawOblivionCombatBar(getOblivionExpBounds(),'xp'):oblivionCombatXpBase();};
const oblivionCombatMobileResourceBase=drawMobileCharacterResource;
drawMobileCharacterResource=function(){if(selectedCharacter!=='oblivion')return oblivionCombatMobileResourceBase();const b=getOblivionMobileResourceBounds();drawOblivionResource(b.x-b.w/2,b.y-b.h/2,b.w,b.h,true);};
const oblivionCombatHudBoundsBase=getMobileHudBounds;
getMobileHudBounds=function(id){if(selectedCharacter==='oblivion'){if(id==='resource')return getOblivionMobileResourceBounds();if(id==='health')return getOblivionHealthBounds();if(id==='exp')return getOblivionExpBounds();}return oblivionCombatHudBoundsBase(id);};
const oblivionCombatControlsBase=drawMobileControls;
drawMobileControls=function(){return selectedCharacter==='oblivion'?drawOblivionMobileControls():oblivionCombatControlsBase();};
const oblivionCombatSkillIconBase=getMobileSkillIcon;
getMobileSkillIcon=function(key){return selectedCharacter==='oblivion'?{image:ensureGameImage(oblivionCombatArt.skills[{q:0,e:1,x:2,r:3}[key]])}:oblivionCombatSkillIconBase(key);};
const oblivionCombatSkillNameBase=getMobileSkillName;
getMobileSkillName=function(key){return selectedCharacter==='oblivion'?OBLIVION_SKILL_NAMES[key]:oblivionCombatSkillNameBase(key);};
const oblivionCombatSkillCooldownBase=getMobileSkillCooldown;
getMobileSkillCooldown=function(key){return selectedCharacter==='oblivion'?{value:key==='x'&&oblivionState.empowered&&oblivionState.ultimateTime<=0?0:player['oblivion'+key+'Cooldown']||0,max:OBLIVION_CD[key]||1}:oblivionCombatSkillCooldownBase(key);};
const oblivionCombatSkillTargetBase=getMobileSkillTargetSpec;
getMobileSkillTargetSpec=function(key){
  if(selectedCharacter!=='oblivion')return oblivionCombatSkillTargetBase(key);const empowered=oblivionEmpowered();
  if(key==='q')return{type:'line',range:empowered?1120:1020,width:empowered?112:96,capsule:true};
  if(key==='e')return{type:'target',range:600,radius:empowered?255:205,variable:true};
  if(key==='x')return{type:'status',range:0,aim:false,label:oblivionState.ultimateTime>0?'현현 중 · 완전 해방':empowered?'재봉인 · 남은 붕괴 보존':oblivionState.gauge>=20?'봉인 해제 · 초당 붕괴 6':'붕괴 20 필요'};
  if(key==='r')return{type:'status',range:0,aim:false,label:player.level<10?'10레벨 해금':'10초간 완전 해방 · 재앙의 화신'};
  return null;
};
const oblivionCombatAttackTargetBase=getMobileAttackTargetSpec;
getMobileAttackTargetSpec=function(){return selectedCharacter==='oblivion'?(oblivionEmpowered()?{type:'cone',range:300,arc:2.25,centerArrow:true}:{type:'line',range:1050,width:66,capsule:true}):oblivionCombatAttackTargetBase();};
const oblivionCombatTargetingBase=drawMobileTargetingIndicator;
drawMobileTargetingIndicator=function(){
  oblivionCombatTargetingBase();
  if(selectedCharacter!=='oblivion'||!oblivionEmpowered()||!isMobileTouchDevice()||screenMode!=='game'||paused||choosingUpgrade||gameOver||raidVictory||mobileSkillAim?.key!=='q'||!mobileSkillAim.dragged||mobileSkillAim.cancelHover)return;
  const scale=getWorldViewScale(),angle=mobileSkillAim.angle||0;ctx.save();ctx.translate((player.x-camera.x)*scale,(player.y-camera.y)*scale);ctx.lineCap='round';ctx.lineJoin='round';
  for(const offset of [-.20,0,.20]){ctx.save();ctx.rotate(angle+offset);if(offset)drawMobileAimLane(1120*scale,112*scale,{arrow:true,capsule:true});drawMobileAimRing(1120*scale,0,170*scale,{simple:true});ctx.restore();}ctx.restore();
};
