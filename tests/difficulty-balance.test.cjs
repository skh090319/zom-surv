const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function bossGame(difficulty = 'easy') {
  const context = {
    console, Math, Date,
    Image: class { set src(value) { this._src = value; } },
    selectedDifficulty: difficulty,
    selectedCharacter: 'default',
    transcended: {},
    WORLD: { width: 4000, height: 4000 },
    player: { x: 2000, y: 2000, r: 20, hp: 1000, maxHp: 1000, score: 0, invincibleTime: 0, bossRootTime: 0, bossSlowTime: 0 },
    zombies: [], bullets: [], droneBullets: [],
    gameOver: false, choosingUpgrade: false,
    tryRevive: () => false, tryDodgeAttack: () => false, openUpgradeMenu() {},
    getRaidBossDifficultySpeedMultiplier() { return context.selectedDifficulty === 'easy' ? 1 : 1.2; },
    worldStart() {}, worldEnd() {}, ctx: new Proxy({}, { get: () => () => {} })
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js', '04-bosses.js'), 'utf8'), context);
  return { context, run: code => vm.runInContext(code, context) };
}

test('boss health matches the revised table while movement stays unchanged', () => {
  const expected = {
    easy: [[37500, 0], [150000, 2.3], [600000, 5.07]],
    medium: [[67500, 0], [270000, 2.76], [1080000, 6.084]],
    hard: [[97500, 0], [400000, 2.76], [1300000, 6.084]]
  };
  for (const [difficulty, bosses] of Object.entries(expected)) {
    const game = bossGame(difficulty);
    bosses.forEach(([hp, speed], index) => {
      game.run(`startRaidBoss(${index})`);
      assert.equal(game.run('activeRaidBoss.maxHp'), hp);
      assert.ok(Math.abs(game.run('activeRaidBoss.speed') - speed) < 1e-9);
    });
  }
});

test('Hard boss patterns use requested projectile and summon counts', () => {
  const game = bossGame('hard');
  game.run('startRaidBoss(0); raidBossProjectiles.length=0; firePoisonVolley(activeRaidBoss)');
  assert.equal(game.run('raidBossProjectiles.length'), 5);
  game.run('raidBossProjectiles.length=0; activeRaidBoss.pattern=2; activeRaidBoss.patternTime=23; updateBloomBoss(activeRaidBoss)');
  assert.equal(game.run('raidBossProjectiles.filter(p=>p.type==="vine").length'), 2);

  game.run('startRaidBoss(1); summonReaperMinions(activeRaidBoss)');
  assert.equal(game.run('zombies.filter(z=>z.isBossMinion).length'), 10);
  assert.equal(game.run('zombies.find(z=>z.isBossMinion).speed'), 1.45 * 3);

  game.run('startRaidBoss(2); raidBossProjectiles.length=0; activeRaidBoss.pattern=0; activeRaidBoss.patternTime=17; updateAbyssBoss(activeRaidBoss)');
  assert.equal(game.run('raidBossProjectiles.filter(p=>p.type==="abyssOrb").length'), 12);
});

test('Hard Nox schedules eight lightning strikes and five complete dashes', () => {
  const source = fs.readFileSync(path.join(root, 'js', '04-bosses.js'), 'utf8');
  assert.match(source, /\[1, 23, 45, 67, 89, 111, 133, 155\]/);
  assert.match(source, /\[1, 63, 125, 187, 249\]/);
  assert.match(source, /selectedDifficulty === "hard" \? 310 : 186/);
});

const attacks = [
  [0, 'contact', [12, 15.6, 20]],
  [0, 'poison', [6, 7.8, 12]],
  [0, 'venom', [14, 18.2, 30]],
  [0, 'venomSmall', [7, 9.1, 15]],
  [0, 'vine', [8, 10.4, 24]],
  [1, 'contact', [18, 23.4, 30]],
  [1, 'charge', [28, 36.4, 40]],
  [1, 'scythe', [15, 26, 50]],
  [1, 'scytheReturn', [30, 45, 80]],
  [1, 'minion', [5, 6.5, 15]],
  [2, 'contact', [25, 30, 35]],
  [2, 'abyssOrb', [60, 70, 80]],
  [2, 'lightning', [80, 85, 90]]
];

// Drive the actual spawning/collision paths, not just the configuration lookup.
function hitWithAttack(game, attack) {
  if (attack === 'contact') {
    game.run('player.x=activeRaidBoss.x;player.y=activeRaidBoss.y;updateRaidBossSystem()');
  } else if (attack === 'poison' || attack === 'lightning') {
    game.run(`raidBossZones.push({type:'${attack}',x:player.x,y:player.y,r:92,delay:0,life:100,tick:0});updateRaidBossZones()`);
  } else if (attack === 'charge') {
    game.run('activeRaidBoss.pattern=0;activeRaidBoss.patternTime=35;activeRaidBoss.dashVx=0;activeRaidBoss.dashVy=0;player.x=activeRaidBoss.x;player.y=activeRaidBoss.y;updateReaperBoss(activeRaidBoss)');
  } else if (attack === 'minion') {
    game.run('player.hp-=getRaidBossMinionDamage()');
  } else {
    const spawn = {
      venom: 'firePoisonVolley(activeRaidBoss)',
      venomSmall: 'splitVenomProjectile(activeRaidBoss)',
      vine: 'activeRaidBoss.pattern=2;activeRaidBoss.patternTime=23;updateBloomBoss(activeRaidBoss)',
      scythe: 'activeRaidBoss.pattern=1;activeRaidBoss.patternTime=21;updateReaperBoss(activeRaidBoss)',
      scytheReturn: 'activeRaidBoss.pattern=1;activeRaidBoss.patternTime=21;updateReaperBoss(activeRaidBoss)',
      abyssOrb: 'selectedDifficulty==="hard"?fireAbyssOrbRing(activeRaidBoss):fireAbyssOrb(activeRaidBoss)'
    }[attack];
    game.run(spawn);
    game.run('raidBossProjectiles=[raidBossProjectiles[0]];Object.assign(raidBossProjectiles[0],{x:player.x,y:player.y,vx:0,vy:0})');
    if (attack === 'scytheReturn') {
      game.run('Object.assign(raidBossProjectiles[0],{x:player.x+12,travel:52,owner:{x:player.x-500,y:player.y,r:76}})');
    }
    game.run('updateRaidBossProjectiles()');
  }
}

for (const [difficultyIndex, difficulty] of ['easy', 'medium', 'hard'].entries()) {
  for (const [index, attack, percentages] of attacks) {
    test(`${difficulty} boss ${index + 1} ${attack} deals ${percentages[difficultyIndex]}% without double scaling`, () => {
      const game = bossGame(difficulty);
      game.run(`startRaidBoss(${index})`);
      hitWithAttack(game, attack);
      assert.ok(Math.abs(game.context.player.hp - (1000 - percentages[difficultyIndex] * 10)) < 1e-8);
    });
  }
  test(`${difficulty} Nox dash remains lethal, including the revival path`, () => {
    const game = bossGame(difficulty);
    game.run('startRaidBoss(2);activeRaidBoss.pattern=2;activeRaidBoss.patternTime=38;player.x=activeRaidBoss.x;player.y=activeRaidBoss.y;player.invincibleTime=100;updateAbyssBoss(activeRaidBoss)');
    assert.equal(game.context.player.hp, 0);
    assert.equal(game.context.gameOver, true);
    game.context.tryRevive = () => { game.context.player.hp = 400; return true; };
    game.run('activeRaidBoss.dashHit=false;activeRaidBoss.patternTime=38;updateAbyssBoss(activeRaidBoss)');
    assert.equal(game.context.player.hp, 400);
    assert.equal(game.context.gameOver, false);
  });
  test(`${difficulty} minions retain their minimum damage`, () => {
    const game = bossGame(difficulty);
    game.context.player.maxHp = 50;
    assert.equal(game.run('getRaidBossMinionDamage()'), [4, 5.2, 12][difficultyIndex]);
  });
}

test('boss attacks still respect invincibility, dodge and shields', () => {
  const game = bossGame('hard');
  game.run('startRaidBoss(0);player.invincibleTime=20;raidPlayerDamage(getRaidBossDamageRatio("venom"))');
  assert.equal(game.context.player.hp, 1000);
  game.context.tryDodgeAttack = () => true;
  game.run('player.invincibleTime=0;raidPlayerDamage(getRaidBossDamageRatio("venom"))');
  assert.equal(game.context.player.hp, 1000);
  game.context.tryDodgeAttack = () => false;
  game.run('selectedCharacter="vargas";player.vargasShield=100;raidPlayerDamage(getRaidBossDamageRatio("venom"))');
  assert.equal(game.context.player.hp, 800);
  assert.equal(game.context.player.vargasShield, 0);
});

test('normal enemy scaling is unchanged and boss minions use the table', () => {
  const source = fs.readFileSync(path.join(root, 'js', '06-entities-update.js'), 'utf8');
  assert.match(source, /z\.isBossMinion\s*\? getRaidBossMinionDamage\(\)/);
  assert.match(source, /\(player\.crownLevel > 0 \? 20 : 10\) \* getZombieDifficultyDamageMultiplier\(\)/);
});

test('mobile boss notices stay within the top HUD on phone and tablet sizes',()=>{
  for(const [width,height] of [[568,280],[844,390],[1024,768]]){
    const game=bossGame(),rects=[],labels=[];
    game.context.canvas={width,height};game.context.isMobileTouchDevice=()=>true;
    game.context.ctx=new Proxy({}, {get:(obj,key)=>key in obj?obj[key]:(...args)=>{
      if(key==='fillRect'||key==='strokeRect')rects.push(args);
      if(key==='fillText')labels.push(args);
      if(key==='createLinearGradient')return {addColorStop(){}};
    }});
    for(const code of ['survivalFrames=RAID_BOSS_TIMES[0]-120;drawRaidBossUI()', 'startRaidBoss(0);raidIntroTime=120;drawRaidBossUI()', 'raidIntroTime=1;drawRaidBossUI()']){
      rects.length=0;labels.length=0;game.run(code);
      assert.ok(rects.length>0);assert.ok(labels.length>0);
      for(const [x,y,w,h] of rects){assert.ok(x>=0&&x+w<=width);assert.ok(y>=48&&y+h<=106);assert.ok(w<=406);}
      assert.ok(labels.some(([text])=>text.includes('주의')));
      assert.ok(labels.some(([text])=>text.includes('아마란스')));
      assert.ok(labels.every(([,x,y])=>x>=0&&x<=width&&y>=48&&y<=106));
      if(game.run('!!activeRaidBoss'))assert.ok(labels.some(([text])=>text.includes('BOSS ENCOUNTER')));
      else assert.ok(labels.some(([text])=>text.includes('2초')));
    }
    game.run('raidIntroTime=0');labels.length=0;game.run('drawRaidBossUI()');
    assert.ok(labels.some(([text])=>text.includes('시간 정지')));
    assert.ok(labels.every(([text])=>!text.includes('주의')));
  }
});
