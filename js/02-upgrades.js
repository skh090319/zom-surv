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
  dodge: 0,
  immortal: 0,
  crown: 0,
  maliciousProfit: 0


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
  dodge: false,
  immortal: false,
  crown: false,
  maliciousProfit: false


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
  { id: "fireRate", category: "support", name: "연사속도 증가", desc: "발사 쿨타임 감소", transcendName: "초월: 튕기는 총알", transcendDesc: "총알이 좀비 사이에서 튕김",
    apply() { upgradeCount.fireRate++; if (upgradeCount.fireRate < 4) { player.fireRateBonus++; } else if (!transcended.fireRate) { transcended.fireRate = true; player.ricochetLevel++; } } },
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
  { id: "drone", category: "combat", minLevel: 5, name: "드론", desc: "0.2초마다 가장 가까운 적을 따라가는 탄환 1발, 발당 최대체력 5% 피해", transcendName: "드론", transcendDesc: "선택 즉시 활성화 · 유도 드론 탄환",
    apply() { upgradeCount.drone++; if (!transcended.drone) { transcended.drone = true; player.droneLevel = 1; player.droneTimer = 12; } } },
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
    player.expNeed = Math.floor(player.expNeed * 1.25 + 2);
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
      return true;
    });
  } else {
    // 나머지 레벨에서는 전투 증강이 절대 등장하지 않음
    const normalPool = upgrades.filter(u => {
      if (u.category === "combat") return false;
      if (u.category === "emerald") return false;
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

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    upgradeChoices.push(pool[index]);
    pool.splice(index, 1);
  }
}

function chooseUpgrade(index) {
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

  if (player.exp >= player.expNeed) {
    gainExp(0);
  }
}
