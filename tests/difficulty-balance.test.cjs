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
    getRaidBossDifficultyHpMultiplier() { return context.selectedDifficulty === 'hard' ? 4 : context.selectedDifficulty === 'medium' ? 1.8 : 1; },
    getRaidBossDifficultySpeedMultiplier() { return context.selectedDifficulty === 'easy' ? 1 : 1.2; },
    worldStart() {}, worldEnd() {}, ctx: new Proxy({}, { get: () => () => {} })
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js', '04-bosses.js'), 'utf8'), context);
  return { context, run: code => vm.runInContext(code, context) };
}

test('boss health and movement always scale from Easy values', () => {
  const expected = {
    easy: [[37500, 0], [150000, 2.3], [600000, 5.07]],
    medium: [[67500, 0], [270000, 2.76], [1080000, 6.084]],
    hard: [[105000, 0], [600000, 2.76], [2400000, 6.084]]
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

test('raid boss damage uses Easy as the baseline', () => {
  for (const [difficulty, index, expectedHp] of [
    ['easy', 0, 900], ['medium', 0, 870], ['hard', 0, 700], ['hard', 2, 900]
  ]) {
    const game = bossGame(difficulty);
    game.run(`startRaidBoss(${index}); player.hp=1000; player.invincibleTime=0; raidPlayerDamage(.1)`);
    assert.equal(game.context.player.hp, expectedHp);
  }
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
    for(const code of ['survivalFrames=RAID_BOSS_TIMES[0]-120;drawRaidBossUI()', 'startRaidBoss(0);raidIntroTime=120;drawRaidBossUI()']){
      rects.length=0;labels.length=0;game.run(code);
      assert.ok(rects.length>0);assert.ok(labels.length>0);
      for(const [x,y,w,h] of rects){assert.ok(x>=0&&x+w<=width);assert.ok(y>=48&&y+h<=96);}
      assert.ok(labels.every(([text])=>text!=='BOSS ENCOUNTER'));
    }
  }
});
