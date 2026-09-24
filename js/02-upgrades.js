// 증강 정의, 레벨업, 증강 선택

const upgradeCount = {
  ammo: 0,
  damage: 0,
  hp: 0,
  speed: 0,
  fireRate: 0,
  vision: 0,
  quantum: 0,
  greed: 0,
  gravity: 0,
  drone: 0,
  droneB: 0,
  worldEnder: 0,
  timeRewind: 0,
  recall: 0,
  swordAura: 0,
  dodge: 0,
  immortal: 0,
  crown: 0,
  maliciousProfit: 0,
  afterimage: 0,
  darkDevour: 0
  ,nightReach: 0
  ,nightBlood: 0
  ,nightExecution: 0
  ,zeroThrust: 0
  ,zeroVital: 0
  ,zeroJudgment: 0
  ,paladinCombo: 0
  ,paladinSpeed: 0
  ,paladinRelease: 0
  ,arcBrand: 0
  ,arcCorona: 0
  ,arcHeat: 0
  ,terraResonance: 0
  ,terraFault: 0
  ,terraRampart: 0
  ,voidCapacity: 0
  ,voidTerrain: 0
  ,voidChain: 0
  ,carmillaPreserve:0,carmillaResonance:0,carmillaFeast:0
  ,vargasPredator:0,vargasSkeleton:0,vargasPulse:0
  ,echoAfterimage:0,echoPitch:0,echoArchive:0
  ,ariaSoil:0,ariaThorn:0,ariaNight:0
  ,moiraThread:0,moiraNeedle:0,moiraDoll:0
  ,mareDepth:0,mareCurrent:0,mareFoam:0


};

const transcended = {
  ammo: false,
  damage: false,
  hp: false,
  speed: false,
  fireRate: false,
  vision: false,
  quantum: false,
  greed: false,
  gravity: false,
  drone: false,
  droneB: false,
  worldEnder: false,
  timeRewind: false,
  recall: false,
  swordAura: false,
  dodge: false,
  immortal: false,
  crown: false,
  maliciousProfit: false,
  afterimage: false,
  darkDevour: false
  ,nightReach: false
  ,nightBlood: false
  ,nightExecution: false
  ,zeroThrust: false
  ,zeroVital: false
  ,zeroJudgment: false
  ,paladinCombo: false
  ,paladinSpeed: false
  ,paladinRelease: false
  ,arcBrand: false
  ,arcCorona: false
  ,arcHeat: false
  ,terraResonance: false
  ,terraFault: false
  ,terraRampart: false
  ,voidCapacity: false
  ,voidTerrain: false
  ,voidChain: false
  ,carmillaPreserve:false,carmillaResonance:false,carmillaFeast:false
  ,vargasPredator:false,vargasSkeleton:false,vargasPulse:false
  ,echoAfterimage:false,echoPitch:false,echoArchive:false
  ,ariaSoil:false,ariaThorn:false,ariaNight:false
  ,moiraThread:false,moiraNeedle:false,moiraDoll:false
  ,mareDepth:false,mareCurrent:false,mareFoam:false


};

const upgrades = [
  { id: "ammo", category: "support", name: "탄창 증가", desc: "최대 총알 +4", transcendName: "초월: 게틀링 건", transcendDesc: "탄 소모 없이 초고속 자동 사격",
    apply() { upgradeCount.ammo++; if (upgradeCount.ammo < 4) { player.maxAmmo += 4; player.ammo = player.maxAmmo; } else if (!transcended.ammo) { transcended.ammo = true; player.gatlingLevel = 1; player.fireRateBonus += 3; } } },
  { id: "damage", category: "support", name: "데미지 증가", desc: "모든 데미지 +12%", transcendName: "초월: 사망 폭발", transcendDesc: "좀비 사망 시 폭발",
    apply() { upgradeCount.damage++; if (upgradeCount.damage < 4) { player.globalDamageMultiplier += 0.12; player.damage = Math.floor(player.damage * 1.08); } else if (!transcended.damage) { transcended.damage = true; player.explosionLevel++; } } },
  { id: "hp", category: "support", name: "최대 체력 증가", desc: "최대 체력 +25", transcendName: "초월: 재생력", transcendDesc: "매초 최대 체력의 2% 회복",
    apply() { upgradeCount.hp++; if (upgradeCount.hp < 4) { player.maxHp += 25; player.hp = player.maxHp; } else if (!transcended.hp) { transcended.hp = true; player.regenLevel = 1; } } },
  { id: "speed", category: "support", name: "이동속도 증가", desc: "이동속도 +0.25", transcendName: "초월: 화염 질주", transcendDesc: "이동 경로에 불 자취를 남김",
    apply() { upgradeCount.speed++; if (upgradeCount.speed < 4) { player.speed += 0.25; } else if (!transcended.speed) { transcended.speed = true; player.fireTrailLevel = 1; } } },
  { id: "fireRate", category: "support", name: "연사속도 증가", desc: "발사 쿨타임 감소", transcendName: "초월: 춤추는 유탄", transcendDesc: "유탄이 좀비 사이를 춤추듯 튕깁니다",
    apply() { upgradeCount.fireRate++; if (upgradeCount.fireRate < 4) { player.fireRateBonus++; } else if (!transcended.fireRate) { transcended.fireRate = true; player.ricochetLevel++; } } },
  { id: "recall", category: "support", name: "회수", desc: "반월검의 귀환 속도가 20% 증가합니다", transcendName: "초월: 계엄령", transcendDesc: "반월검 타격이 적을 강하게 밀어냅니다. 귀환 타격은 더 강한 넉백을 적용합니다",
    requires() { return selectedCharacter === "yupiter"; },
    apply() {
      upgradeCount.recall++;
      if (upgradeCount.recall < 4) {
        player.crescentReturnMultiplier += 0.2;
      } else if (!transcended.recall) {
        transcended.recall = true;
        player.crescentMartialLawLevel = 1;
      }
    } },
  { id: "swordAura", category: "support", name: "검의 기운", desc: "절단검으로 베는 각도가 30도 증가합니다", transcendName: "초월: 추적자", transcendDesc: "더 넓은 범위의 360도 참격으로 모든 방향을 베고 출혈과 둔화를 적용합니다",
    requires() { return selectedCharacter === "yupiter"; },
    apply() {
      upgradeCount.swordAura++;
      if (upgradeCount.swordAura < 4) player.swordAuraLevel++;
      else if (!transcended.swordAura) { transcended.swordAura = true; player.trackerLevel = 1; }
    } },
  { id: "afterimage", category: "support", name: "잔영", desc: "순간이동 공격 후 그림자 분신이 공격을 반복합니다", transcendName: "초월: 개기일식", transcendDesc: "분신 최대치가 8개로 증가합니다",
    requires() { return selectedCharacter === "ren"; },
    getDesc() {
      const current = upgradeCount.afterimage || 0;
      if (current >= 3) return this.transcendDesc;
      const nextRepeats = current + 1;
      return `이번 선택 시 잔영 ${nextRepeats}회 · 총 추가 피해 ${nextRepeats * 42}%`;
    },
    apply() {
      upgradeCount.afterimage++;
      if (upgradeCount.afterimage < 4) player.renAfterimageLevel++;
      else if (!transcended.afterimage) { transcended.afterimage = true; player.renTotalEclipseLevel = 1; }
    } },
  { id: "darkDevour", category: "support", name: "어둠 포식", desc: "그림자 조각 획득 시 단계마다 최대 체력의 0.5%를 회복합니다", transcendName: "초월: 사신의 발자국", transcendDesc: "처치한 적의 위치에 피해와 둔화를 주는 그림자 지대를 생성합니다",
    requires() { return selectedCharacter === "ren"; },
    apply() {
      upgradeCount.darkDevour++;
      if (upgradeCount.darkDevour < 4) player.renDarkDevourLevel++;
      else if (!transcended.darkDevour) { transcended.darkDevour = true; player.renReaperFootstepsLevel = 1; }
    } },
  { id: "nightReach", category: "support", name: "긴 월도", desc: "기본 공격 범위가 단계마다 15% 증가합니다", transcendName: "초월: 보랏빛 폭풍", transcendDesc: "모든 기본 공격이 360도 그림자 참격으로 변합니다",
    requires() { return selectedCharacter === "nightLord"; },
    apply() { upgradeCount.nightReach++; if (upgradeCount.nightReach < 4) player.nightLordReachLevel++; else if (!transcended.nightReach) transcended.nightReach = true; } },
  { id: "nightBlood", category: "support", name: "들끓는 그림자", desc: "잃은 체력에 따른 공격력 증가량이 단계마다 20% 상승합니다", transcendName: "초월: 죽음 거부", transcendDesc: "불사의 밤 동안 공격할 때 더 강한 흡혈을 얻습니다",
    requires() { return selectedCharacter === "nightLord"; },
    apply() { upgradeCount.nightBlood++; if (upgradeCount.nightBlood < 4) player.nightLordBloodLevel++; else if (!transcended.nightBlood) transcended.nightBlood = true; } },
  { id: "nightExecution", category: "support", name: "사냥의 전율", desc: "처형 가능한 체력 기준이 단계마다 3% 증가합니다", transcendName: "초월: 학살자", transcendDesc: "처형한 적이 보랏빛 폭발을 일으켜 주변 적에게 피해를 줍니다",
    requires() { return selectedCharacter === "nightLord"; },
    apply() { upgradeCount.nightExecution++; if (upgradeCount.nightExecution < 4) player.nightLordExecutionLevel++; else if (!transcended.nightExecution) transcended.nightExecution = true; } },
  { id: "zeroThrust", category: "support", name: "관통의 보법", desc: "참격의 이동 거리 +15%, 피해량 +25%", transcendName: "초월: 지평선 절단", transcendDesc: "참격의 거리가 크게 증가하고 적 처치 시 쿨타임이 절반으로 감소합니다",
    requires() { return selectedCharacter === "zero"; },
    apply() { upgradeCount.zeroThrust++; if (upgradeCount.zeroThrust < 4) player.zeroThrustLevel++; else if (!transcended.zeroThrust) transcended.zeroThrust = true; } },
  { id: "zeroVital", category: "support", name: "급소 개방", desc: "급소 강화 피해량 +20%, 지속시간 +1초", transcendName: "초월: 절대 급소", transcendDesc: "급소 지속 중 피해가 추가로 증가하고 체력 12% 이하의 적을 처형합니다",
    requires() { return selectedCharacter === "zero"; },
    apply() { upgradeCount.zeroVital++; if (upgradeCount.zeroVital < 4) player.zeroVitalLevel++; else if (!transcended.zeroVital) transcended.zeroVital = true; } },
  { id: "zeroJudgment", category: "support", name: "심판의 비", desc: "심판 범위 +15%, 검의 피해량 증가", transcendName: "초월: 무한 검무", transcendDesc: "심판에 더 많은 검이 빠르게 쏟아져 지속 피해 주기가 감소합니다",
    requires() { return selectedCharacter === "zero"; },
    apply() { upgradeCount.zeroJudgment++; if (upgradeCount.zeroJudgment < 4) player.zeroJudgmentLevel++; else if (!transcended.zeroJudgment) transcended.zeroJudgment = true; } },
  { id: "paladinCombo", category: "support", name: "전투 감각", desc: "콤보 유지시간이 단계마다 0.5초 증가합니다", transcendName: "초월: 멈추지 않는 심장", transcendDesc: "콤보 감소 속도가 크게 느려지고 피격 시에도 콤보를 잃지 않습니다",
    requires() { return selectedCharacter === "paladin"; },
    apply() { upgradeCount.paladinCombo++; if (upgradeCount.paladinCombo < 4) player.paladinComboLevel++; else if (!transcended.paladinCombo) transcended.paladinCombo = true; } },
  { id: "paladinSpeed", category: "support", name: "가속하는 검", desc: "해방 단계별 기본 공격 간격이 감소합니다", transcendName: "초월: 광속", transcendDesc: "기본 공격이 푸른 잔상을 남겨 45% 피해로 한 번 더 타격합니다",
    requires() { return selectedCharacter === "paladin"; },
    apply() { upgradeCount.paladinSpeed++; if (upgradeCount.paladinSpeed < 4) player.paladinSpeedLevel++; else if (!transcended.paladinSpeed) transcended.paladinSpeed = true; } },
  { id: "paladinRelease", category: "support", name: "해방 압축", desc: "콤보 전환이 소모하는 콤보가 단계마다 5 감소합니다", transcendName: "초월: 완전 해방", transcendDesc: "콤보 전환을 사용해도 현재 해방 단계 아래로 콤보가 감소하지 않습니다",
    requires() { return selectedCharacter === "paladin"; },
    apply() { upgradeCount.paladinRelease++; if (upgradeCount.paladinRelease < 4) player.paladinReleaseLevel++; else if (!transcended.paladinRelease) transcended.paladinRelease = true; } },
  { id: "arcBrand", category: "support", name: "태양 각인", desc: "표식이 있는 적에게 주는 광역 피해가 단계마다 15% 증가합니다", transcendName: "초월: 연쇄 점화", transcendDesc: "표식 폭발이 주변의 다른 표식까지 연쇄적으로 점화합니다",
    requires() { return selectedCharacter === "arc"; },
    apply() { upgradeCount.arcBrand++; if (upgradeCount.arcBrand < 4) player.arcBrandLevel++; else if (!transcended.arcBrand) transcended.arcBrand = true; } },
  { id: "arcCorona", category: "support", name: "팽창하는 코로나", desc: "모든 태양 기술의 범위가 단계마다 12% 증가합니다", transcendName: "초월: 태양의 지배", transcendDesc: "일륜 생성 시 작은 일륜을 하나 더 생성합니다",
    requires() { return selectedCharacter === "arc"; },
    apply() { upgradeCount.arcCorona++; if (upgradeCount.arcCorona < 4) player.arcCoronaLevel++; else if (!transcended.arcCorona) transcended.arcCorona = true; } },
  { id: "arcHeat", category: "support", name: "열기 순환", desc: "열기 획득량이 단계마다 20% 증가합니다", transcendName: "초월: 백색왜성", transcendDesc: "열기가 더 이상 자연 감소하지 않습니다",
    requires() { return selectedCharacter === "arc"; },
    apply() { upgradeCount.arcHeat++; if (upgradeCount.arcHeat < 4) player.arcHeatLevel++; else if (!transcended.arcHeat) transcended.arcHeat = true; } },
  { id:"terraResonance",category:"support",name:"공명핵",desc:"진동 획득량이 단계마다 20% 증가합니다",transcendName:"초월: 세계의 맥동",transcendDesc:"진동이 더 이상 자연 감소하지 않습니다",requires(){return selectedCharacter==="terra";},apply(){upgradeCount.terraResonance++;if(upgradeCount.terraResonance<4)player.terraResonanceLevel++;else transcended.terraResonance=true;}},
  { id:"terraFault",category:"support",name:"확장 단층",desc:"단층 붕괴의 길이와 피해가 증가합니다",transcendName:"초월: 끝없는 여진",transcendDesc:"강화 스킬이 추가 여진을 일으킵니다",requires(){return selectedCharacter==="terra";},apply(){upgradeCount.terraFault++;if(upgradeCount.terraFault<4)player.terraFaultLevel++;else transcended.terraFault=true;}},
  { id:"terraRampart",category:"support",name:"암석 지배",desc:"암벽 융기의 범위가 단계마다 10% 증가합니다",transcendName:"초월: 가이아의 심장",transcendDesc:"지형 붕괴의 피해와 최대 범위가 크게 증가합니다",requires(){return selectedCharacter==="terra";},apply(){upgradeCount.terraRampart++;if(upgradeCount.terraRampart<4)player.terraRampartLevel++;else transcended.terraRampart=true;}},
  {id:"voidCapacity",category:"support",name:"고밀도 특이점",desc:"공허 질량 최대치가 20 증가하고 궁극기 범위가 커집니다",transcendName:"초월: 무한 밀도",transcendDesc:"지면 포식 시 획득하는 질량이 2배가 됩니다",requires(){return selectedCharacter==="void";},apply(){upgradeCount.voidCapacity++;if(upgradeCount.voidCapacity<4)player.voidCapacityLevel++;else transcended.voidCapacity=true;}},
  {id:"voidTerrain",category:"support",name:"포식 지형",desc:"지면 포식과 토해낸 대지의 범위가 증가합니다",transcendName:"초월: 공허 결정",transcendDesc:"토해낸 지형이 적에게 지속 피해를 줍니다",requires(){return selectedCharacter==="void";},apply(){upgradeCount.voidTerrain++;if(upgradeCount.voidTerrain<4)player.voidTerrainLevel++;else transcended.voidTerrain=true;}},
  {id:"voidChain",category:"support",name:"연쇄 붕괴",desc:"지반 붕괴 피해가 단계마다 18% 증가합니다",transcendName:"초월: 세계 포식자",transcendDesc:"붕괴한 지형마다 추가 소형 특이점이 생성됩니다",requires(){return selectedCharacter==="void";},apply(){upgradeCount.voidChain++;if(upgradeCount.voidChain<4)player.voidChainLevel++;else transcended.voidChain=true;}},
  {id:"carmillaPreserve",category:"support",name:"선혈 보존",desc:"피 방울 생성량과 회수 피해가 증가합니다",transcendName:"초월: 피의 바다",transcendDesc:"기본 공격 적중 시 피 방울을 추가 생성합니다",requires(){return selectedCharacter==="carmilla";},apply(){upgradeCount.carmillaPreserve++;if(upgradeCount.carmillaPreserve<4)player.carmillaPreserveLevel=(player.carmillaPreserveLevel||0)+1;else transcended.carmillaPreserve=true;}},
  {id:"carmillaResonance",category:"support",name:"혈액 공명",desc:"혈월 발동에 필요한 피 방울 수가 감소합니다",transcendName:"초월: 영원한 적월",transcendDesc:"혈월 지속시간이 크게 증가합니다",requires(){return selectedCharacter==="carmilla";},apply(){upgradeCount.carmillaResonance++;if(upgradeCount.carmillaResonance<4)player.carmillaResonanceLevel=(player.carmillaResonanceLevel||0)+1;else transcended.carmillaResonance=true;}},
  {id:"carmillaFeast",category:"support",name:"탐식",desc:"회수한 피 방울의 회복량이 증가합니다",transcendName:"초월: 진조",transcendDesc:"혈월 동안 체력이 1 아래로 내려가지 않습니다",requires(){return selectedCharacter==="carmilla";},apply(){upgradeCount.carmillaFeast++;if(upgradeCount.carmillaFeast<4)player.carmillaFeastLevel++;else transcended.carmillaFeast=true;}},
  {id:"vargasPredator",category:"support",name:"포식 본능",desc:"처치로 얻는 최대 체력이 단계마다 25% 증가합니다",transcendName:"초월: 끝없는 식욕",transcendDesc:"성장량이 2배가 되고 큰 적 처치 시 현재 최대 체력의 1%를 추가 획득합니다",requires(){return selectedCharacter==="vargas";},apply(){upgradeCount.vargasPredator++;if(upgradeCount.vargasPredator<4)player.vargasPredatorLevel++;else transcended.vargasPredator=true;}},
  {id:"vargasSkeleton",category:"support",name:"거신의 골격",desc:"스킬 피해와 범위가 단계마다 증가합니다",transcendName:"초월: 세계수의 몸",transcendDesc:"모든 공격과 스킬 범위가 25% 증가합니다",requires(){return selectedCharacter==="vargas";},apply(){upgradeCount.vargasSkeleton++;if(upgradeCount.vargasSkeleton<4)player.vargasSkeletonLevel++;else transcended.vargasSkeleton=true;}},
  {id:"vargasPulse",category:"support",name:"불사의 맥박",desc:"최대 체력 증가 시 회복량과 혈육 갑주의 보호막이 증가합니다",transcendName:"초월: 두 번째 심장",transcendDesc:"30초마다 치명적인 피해를 막고 최대 체력의 30%를 회복합니다",requires(){return selectedCharacter==="vargas";},apply(){upgradeCount.vargasPulse++;if(upgradeCount.vargasPulse<4)player.vargasPulseLevel++;else transcended.vargasPulse=true;}},
  {id:"echoAfterimage",category:"support",name:"긴 솔기",desc:"균열의 길이와 최대 설치 수가 단계마다 증가합니다",transcendName:"초월: 지평선 절단",transcendDesc:"일괄 절단 피해와 균열 폭이 크게 증가합니다",requires(){return selectedCharacter==="echo";},apply(){upgradeCount.echoAfterimage++;if(upgradeCount.echoAfterimage<4)player.echoAfterimageLevel++;else transcended.echoAfterimage=true;}},
  {id:"echoPitch",category:"support",name:"조여진 매듭",desc:"균열과 매듭의 피해가 단계마다 14% 증가합니다",transcendName:"초월: 특이점 매듭",transcendDesc:"세계선 붕괴가 적 최대 체력의 15% 추가 피해를 줍니다",requires(){return selectedCharacter==="echo";},apply(){upgradeCount.echoPitch++;if(upgradeCount.echoPitch<4)player.echoPitchLevel++;else transcended.echoPitch=true;}},
  {id:"echoArchive",category:"support",name:"접힌 날",desc:"공간 매듭의 범위와 최대 개수가 증가합니다",transcendName:"초월: 세계 봉합",transcendDesc:"공간 매듭을 최대 3개 더 유지할 수 있습니다",requires(){return selectedCharacter==="echo";},apply(){upgradeCount.echoArchive++;if(upgradeCount.echoArchive<4)player.echoArchiveLevel++;else transcended.echoArchive=true;}},
  {id:"ariaSoil",category:"support",name:"비옥한 토양",desc:"토양 유지시간·연결 거리·만개 범위가 증가합니다",transcendName:"초월: 에덴",transcendDesc:"영원한 봄 동안 꽃 공격이 더 많은 토양에서 동시에 피어납니다",requires(){return selectedCharacter==="aria";},apply(){upgradeCount.ariaSoil++;if(upgradeCount.ariaSoil<4)player.ariaSoilLevel++;else transcended.ariaSoil=true;}},
  {id:"ariaThorn",category:"support",name:"가시 장미",desc:"모든 꽃과 가시 피해가 단계마다 13% 증가합니다",transcendName:"초월: 선혈 가시관",transcendDesc:"가시 성장이 적 최대 체력 비례 추가 피해를 줍니다",requires(){return selectedCharacter==="aria";},apply(){upgradeCount.ariaThorn++;if(upgradeCount.ariaThorn<4)player.ariaThornLevel++;else transcended.ariaThorn=true;}},
  {id:"ariaNight",category:"support",name:"밤의 꽃",desc:"화원 공격의 둔화 지속시간과 위력이 증가합니다",transcendName:"초월: 영원한 밤의 정원",transcendDesc:"토양 안의 적이 지속적으로 둔화되고 약화됩니다",requires(){return selectedCharacter==="aria";},apply(){upgradeCount.ariaNight++;if(upgradeCount.ariaNight<4)player.ariaNightLevel++;else transcended.ariaNight=true;}},
  {id:"moiraThread",category:"support",name:"질긴 실",desc:"연결 가능한 적과 실의 사거리가 증가합니다",transcendName:"초월: 운명의 붉은 실",transcendDesc:"실이 거리로 끊어지지 않고 연결 수가 크게 증가합니다",requires(){return selectedCharacter==="moira";},apply(){upgradeCount.moiraThread++;if(upgradeCount.moiraThread<4)player.moiraThreadLevel++;else transcended.moiraThread=true;}},
  {id:"moiraNeedle",category:"support",name:"녹슨 바늘",desc:"바늘땀과 고통 공유의 피해가 증가합니다",transcendName:"초월: 천 개의 바늘",transcendDesc:"고통 전이가 적 최대 체력의 10%를 추가로 입힙니다",requires(){return selectedCharacter==="moira";},apply(){upgradeCount.moiraNeedle++;if(upgradeCount.moiraNeedle<4)player.moiraNeedleLevel++;else transcended.moiraNeedle=true;}},
  {id:"moiraDoll",category:"support",name:"대리 고통",desc:"대리 인형이 저장하는 피해량이 증가합니다",transcendName:"초월: 마지막 공연",transcendDesc:"꼭두각시 극장이 끝날 때 연결된 적들이 폭발합니다",requires(){return selectedCharacter==="moira";},apply(){upgradeCount.moiraDoll++;if(upgradeCount.moiraDoll<4)player.moiraDollLevel++;else transcended.moiraDoll=true;}},
  {id:"mareDepth",category:"support",name:"깊은 물",desc:"침수 최대 중첩과 밀물의 폭이 증가합니다",transcendName:"초월: 해일",transcendDesc:"밀물이 화면 전체를 뒤덮을 만큼 크게 확장됩니다",requires(){return selectedCharacter==="mare";},apply(){upgradeCount.mareDepth++;if(upgradeCount.mareDepth<4)player.mareDepthLevel++;else transcended.mareDepth=true;}},
  {id:"mareCurrent",category:"support",name:"역류",desc:"소용돌이 핵의 흡인력과 붕괴 피해가 증가합니다",transcendName:"초월: 마리아나",transcendDesc:"수압이 침수된 적의 최대 체력 비례 피해를 추가합니다",requires(){return selectedCharacter==="mare";},apply(){upgradeCount.mareCurrent++;if(upgradeCount.mareCurrent<4)player.mareCurrentLevel++;else transcended.mareCurrent=true;}},
  {id:"mareFoam",category:"support",name:"백색 거품",desc:"해류와 밀물 피해가 단계마다 증가합니다",transcendName:"초월: 레비아탄",transcendDesc:"심해 개방의 고래 해류가 더 강하게 반복 공격합니다",requires(){return selectedCharacter==="mare";},apply(){upgradeCount.mareFoam++;if(upgradeCount.mareFoam<4)player.mareFoamLevel++;else transcended.mareFoam=true;}},
  { id: "greed", category: "support", name: "탐욕", desc: "다음 선택 시 경험치 획득량 +10%", transcendName: "초월: 흡혈 군주", transcendDesc: "적 처치 시 최대 체력의 1% 회복",
    getDesc() {
      const next = Math.min(3, (upgradeCount.greed || 0) + 1);
      if ((upgradeCount.greed || 0) >= 3) return "초월 시 적 처치마다 최대 체력의 3% 회복";
      return `이번 선택 시 경험치 획득량 +${next * 10}%`;
    },
    apply() { upgradeCount.greed++; if (upgradeCount.greed < 4) { player.greedLevel = Math.min(3, upgradeCount.greed); } else if (!transcended.greed) { transcended.greed = true; player.lifeStealLevel = 1; } } },
  { id: "vision", category: "combat", minLevel: 5, name: "비전", desc: "매 10초마다 맵 전체 적을 1초동안 기절시킵니다", transcendName: "비전", transcendDesc: "선택 즉시 활성화 · 맵 전체 적 기절",
    apply() { upgradeCount.vision++; if (!transcended.vision) { transcended.vision = true; player.visionLevel = 1; player.visionTimer = 600; triggerVisionStun(); } } },
  { id: "quantum", category: "combat", minLevel: 5, name: "양자", desc: "주위를 한 바퀴 도는 레이저, 적 최대체력 20% 피해", transcendName: "양자", transcendDesc: "선택 즉시 활성화 · 회전 레이저",
    apply() { upgradeCount.quantum++; if (!transcended.quantum) { transcended.quantum = true; player.quantumLevel = 1; player.quantumTimer = 120; triggerQuantumLaser(); } } },
  { id: "gravity", category: "combat", minLevel: 5, name: "중력장", desc: "화면 안에서 적이 가장 많은 곳에 중력장을 생성하고 최대체력 30% 피해", transcendName: "중력장", transcendDesc: "선택 즉시 활성화 · 화면 내 최대 밀집 지역에 블랙홀 생성",
    apply() { upgradeCount.gravity++; if (!transcended.gravity) { transcended.gravity = true; player.gravityLevel = 1; player.gravityTimer = 420; triggerGravityField(); } } },
  { id: "drone", category: "combat", minLevel: 5, name: "드론 A", desc: "0.2초마다 가장 가까운 적을 추적해 최대 체력의 5% 피해를 줍니다", transcendName: "드론 A", transcendDesc: "선택 즉시 활성화 · 청록색 유도 드론",
    apply() { upgradeCount.drone++; if (!transcended.drone) { transcended.drone = true; player.droneLevel = 1; player.droneTimer = 12; } } },
  { id: "droneB", category: "combat", minLevel: 5, name: "드론 B", desc: "0.3초마다 가장 가까운 적을 추적해 최대 체력의 5% 피해를 줍니다", transcendName: "드론 B", transcendDesc: "선택 즉시 활성화 · 자홍색 유도 드론",
    apply() { upgradeCount.droneB++; if (!transcended.droneB) { transcended.droneB = true; player.droneBLevel = 1; player.droneBTimer = 18; } } },
  { id: "worldEnder", category: "combat", minLevel: 5, singleChoice: true, name: "세계의 종결자", desc: "드론 A와 B를 합체합니다. 공격마다 적 최대 체력의 12.5% 피해를 주며, 처치한 적은 넓은 범위에 최대 체력 10%의 폭발 피해를 줍니다",
    requires() { return player.droneLevel > 0 && player.droneBLevel > 0; },
    apply() {
      upgradeCount.worldEnder = 1;
      transcended.worldEnder = true;
      player.worldEnderLevel = 1;
      player.droneTimer = 12;
    } },
  { id: "timeRewind", category: "combat", minLevel: 5, singleChoice: true, name: "시간 역행", desc: "20초마다 잃은 체력의 70%를 회복합니다",
    apply() {
      upgradeCount.timeRewind = 1;
      transcended.timeRewind = true;
      player.timeRewindLevel = 1;
      player.timeRewindTimer = 1200;
    } },
  { id: "dodge", category: "combat", minLevel: 5, singleChoice: true, name: "그건 제 잔상입니다만", desc: "30% 확률로 적의 공격을 회피합니다",
    apply() {
      upgradeCount.dodge = 1;
      transcended.dodge = true;
      player.dodgeLevel = 1;
    }
  },
  { id: "crown", category: "combat", minLevel: 5, singleChoice: true, name: "왕관의 무게", desc: "주는 모든 데미지가 2배가 되지만 받는 데미지도 2배가 됩니다",
    apply() {
      upgradeCount.crown = 1;
      transcended.crown = true;
      player.crownLevel = 1;
    }
  },
  { id: "maliciousProfit", category: "combat", minLevel: 5, singleChoice: true, name: "악의적 수익 창출", desc: "좀비 처치 시 드롭되는 경험치가 1.5배가 됩니다",
    apply() {
      upgradeCount.maliciousProfit = 1;
      transcended.maliciousProfit = true;
      player.maliciousProfitLevel = 1;
    }
  },
  { id: "immortal", category: "emerald", name: "불사", desc: "죽으면 3초 무적과 함께 체력 40%로 1회 부활", transcendName: "에메랄드: 불사", transcendDesc: "죽으면 3초 무적 + 체력 40% 부활",
    apply() { upgradeCount.immortal++; if (!transcended.immortal) { transcended.immortal = true; player.immortalLevel = 1; player.immortalUsed = false; } } }
];

function gainExp(value) {
  const greedBonus = player.greedLevel > 0 ? 1 + player.greedLevel * 0.1 : 1;
  const maliciousProfitBonus = player.maliciousProfitLevel > 0 ? 1.5 : 1;

  player.exp += value * greedBonus * maliciousProfitBonus;

  while (player.exp >= player.expNeed) {
    player.exp -= player.expNeed;
    player.level++;
    player.expNeed = Math.max(1, Math.floor(player.expNeed * 1.25 + 1.5));
    openUpgradeMenu();
  }

  player.exp = Math.round(player.exp * 10) / 10;
}

function openUpgradeMenu() {
  if (choosingUpgrade) return;

  const isCombatLevel = player.level >= 5 && player.level % 5 === 0;

  let pool = [];

  if (isCombatLevel) {
    // 5, 10, 15... 레벨에서는 전투 증강만 등장
    pool = upgrades.filter(u => {
      if (u.category !== "combat") return false;
      if (transcended[u.id]) return false;
      if (typeof u.requires === "function" && !u.requires()) return false;
      return true;
    });
  } else {
    // 나머지 레벨에서는 전투 증강이 절대 등장하지 않음
    const normalPool = upgrades.filter(u => {
      if (u.category === "combat") return false;
      if (u.category === "emerald") return false;
      if (selectedCharacter === "yupiter" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (selectedCharacter === "ren" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (selectedCharacter === "nightLord" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (selectedCharacter === "zero" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (selectedCharacter === "paladin" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (selectedCharacter === "arc" && (u.id === "ammo" || u.id === "fireRate")) return false;
      if ((selectedCharacter === "terra" || selectedCharacter === "void" || selectedCharacter === "carmilla" || selectedCharacter === "vargas" || selectedCharacter === "echo" || selectedCharacter === "aria" || selectedCharacter === "moira" || selectedCharacter === "mare") && (u.id === "ammo" || u.id === "fireRate")) return false;
      if (typeof u.requires === "function" && !u.requires()) return false;
      if (transcended[u.id]) return false;
      return true;
    });

    const emeraldPool = upgrades.filter(u => {
      if (u.category !== "emerald") return false;
      if (transcended[u.id]) return false;
      return true;
    });

    pool = [...normalPool];

    // 에메랄드 증강은 기존대로 5% 확률
    if (emeraldPool.length > 0 && Math.random() < 0.05) {
      const emeraldIndex = Math.floor(Math.random() * emeraldPool.length);
      pool.push(emeraldPool[emeraldIndex]);
    }
  }

  if (pool.length === 0) {
    choosingUpgrade = false;
    return;
  }

  choosingUpgrade = true;
  upgradeChoices = [];
  upgradeAnimTime = 0;
  upgradeSelectionEffect = null;
  mouse.down = false;

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    upgradeChoices.push(pool[index]);
    pool.splice(index, 1);
  }
}

function chooseUpgrade(index) {
  if (upgradeSelectionEffect) return;
  const upgrade = upgradeChoices[index];
  if (!upgrade) return;

  const rect = upgradeCardRects[index];
  const centerX = rect && rect.w > 0 ? rect.x + rect.w / 2 : canvas.width / 2;
  const centerY = rect && rect.h > 0 ? rect.y + rect.h / 2 : canvas.height / 2;
  upgradeSelectionEffect = {
    index,
    time: 0,
    centerX,
    centerY,
    particles: []
  };
  mouse.down = false;
}

function finalizeUpgradeChoice(index) {
  const upgrade = upgradeChoices[index];
  if (!upgrade) return;

  let existing = selectedAugments.find(item => item.id === upgrade.id);

  if (!existing) {
    existing = {
      id: upgrade.id,
      name: upgrade.name,
      category: upgrade.category,
      count: 0
    };

    selectedAugments.push(existing);
  }

  existing.count += 1;
  existing.name = upgrade.name;
  existing.category = upgrade.category;

  upgrade.apply();
  choosingUpgrade = false;
  upgradeChoices = [];
  upgradeSelectionEffect = null;

  if (typeof raidRewardChoicesPending !== "undefined" && raidRewardChoicesPending > 0) {
    raidRewardChoicesPending--;
    if (raidRewardChoicesPending > 0) {
      openUpgradeMenu();
      return;
    }
  }

  if (player.exp >= player.expNeed) {
    gainExp(0);
  }
}
