const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const files = ['01-core','02-upgrades','04-weapons-spawn','04-yupiter-weapons','04-ren','04-night-lord','04-zero','04-paladin','04-arc','04-terra','04-void','04-carmilla','04-vargas','04-echo','04-aria','04-moira','04-mare','04-null-zero','04-suncall','04-astra-constellations','04-astra','04-mare-flow','04-bosses','05-skills','06-entities-update','10-lush','13-oblivion-combat'];
function game(hero='arc',sets={},stats={}) {
  const noop=()=>{}, ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop});
  const c={console,Math:Object.create(Math),performance:{now:()=>0},Image:class{},innerWidth:1280,innerHeight:720,
    document:{getElementById:()=>({width:1280,height:720,getContext:()=>ctx}),createElement:()=>({getContext:()=>ctx})},localStorage:{getItem:()=>null,setItem:noop},
    addEventListener:noop,updateOblivionPresentation:noop,setGameImageSource:(image,src)=>Object.assign(image,{src}),isMobilePortraitMode:()=>false,isMobileTouchDevice:()=>false,
    testStats:stats,testSets:sets,testItems:[{id:'snapshot',nested:{level:1}}],relicEquippedItems:()=>c.testItems,
    relicStatsForItems:()=>({stats:c.testStats,setCounts:c.testSets}),rewards:[],
    relicGrantReward:arg=>{c.rewards.push(arg);return{ok:true};}
  };
  c.window=c;vm.createContext(c);
  const run=code=>vm.runInContext(code,c);
  for(const name of files)run(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'));
  const main=fs.readFileSync(path.join(root,'js/09-main.js'),'utf8');
  run(main.slice(main.indexOf('function restart()'),main.indexOf('let lastLoopTime')));
  run(`const relicTestRestart=restart;restart=function(){relicTestRestart();resetLush();resetOblivionCombat()};`);
  run(fs.readFileSync(path.join(root,'js/18-relic-combat.js'),'utf8'));
  run(`selectedCharacter=${JSON.stringify(hero)};restart();screenMode='game';choosingUpgrade=false;player.level=10;mouse.worldX=player.x+300;mouse.worldY=player.y;`);
  c.Math.random=()=>.99;
  return {c,run,player:run('player'),enemy(dx=120,dy=0,hp=100000,extra={}){
    c.newEnemy={id:'enemy-'+run('zombies.length'),x:run('player.x')+dx,y:run('player.y')+dy,r:18,hp,maxHp:hp,speed:0,...extra};
    run('zombies.push(newEnemy);relicTrackEnemy(newEnemy)');return c.newEnemy;
  },hit(enemy,amount,tags={}){c.hitEnemy=enemy;c.hitTags=tags;c.hitAmount=amount;run('relicTagTarget(hitEnemy,null,relicNewAttack(hitTags));hitEnemy.hp-=hitAmount');},step(n){run(`for(let n=0;n<${n};n++)relicTick()`);}};
}
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
function damage(g,e){return e.maxHp-e.hp;}

test('sortie snapshots are immutable; restart does not double stats or retain temporary buffs',()=>{
  const g=game('vargas',{A04:4},{atkFlat:8,atkPct:.2,hpFlat:80,hpPct:.12,moveSpeed:.1});
  near(g.player.maxHp,291.2);near(g.player.damage,(35+8+5.824)*1.2);near(g.player.speed,4.62);
  g.c.testItems[0].nested.level=15;
  assert.equal(g.run('relicRun.snapshot[0].nested.level'),1);
  assert.equal(g.run('Object.isFrozen(relicRun.snapshot[0].nested)'),true);
  const damageBefore=g.player.damage;
  g.run('relicSetBuff("healed",300);restart()');
  near(g.player.damage,damageBefore);assert.equal(g.run('relicBuff("healed")'),false);
  g.player.maxHp=100000;assert.equal(g.player.damage,damageBefore,'HP conversion is calculated once, not recursively');
});
test('boss shields use damage budget overflow; breaking hit receives no new break bonus and shield never regenerates',()=>{
  const g=game('arc',{A07:4},{shieldDamage:.5}),e=g.enemy(0,0,5000,{isRaidBoss:true,raidIndex:0});
  near(e.relicShield,1500);e.relicShield=600;
  g.hit(e,1000,{kind:'skill'});near(e.hp,4400);near(e.relicShield,0);assert.equal(e.relicBreakTime,360);
  g.hit(e,100,{kind:'skill'});near(e.hp,4275);
  g.step(359);assert.equal(e.relicBreakTime,1);g.step(1);g.hit(e,100);near(e.hp,4175);
  g.run('relicTrackEnemy(hitEnemy)');assert.equal(e.relicShield,0);
  const other=g.enemy(0,0,1000,{isRaidBoss:true});other.relicShield=0;g.hit(other,100);near(other.hp,900);
});
test('crit and A08 are additive percentage points and apply after the breaking hit only',()=>{
  const g=game('arc',{A08:4},{critChance:1,critDamage:.3}),e=g.enemy(0,0,1000,{isRaidBoss:true});e.relicShield=100;
  g.hit(e,100);near(e.hp,920);g.hit(e,100);near(e.hp,700);
  const dot=g.enemy();g.hit(dot,100,{dot:true});near(damage(g,dot),100);
});
test('A01 stacks once for a multi-pellet attack and expires; A06 counts distinct targets in one attack',()=>{
  const g=game('yupiter',{A01:4}),e=g.enemy();g.c.e=e;
  g.run('const shared=relicNewAttack({kind:"basic"});for(let i=0;i<5;i++){relicTagTarget(e,null,shared);e.hp-=10}');
  assert.equal(g.run('relicRun.basicStacks'),1);g.step(240);g.hit(e,10,{kind:'basic'});assert.equal(g.run('relicRun.basicStacks'),1);
  const a=game('arc',{A06:4});a.c.es=Array.from({length:5},()=>a.enemy());
  a.run('const one=relicNewAttack({area:true});for(let i=0;i<5;i++){relicTagTarget(es[0],null,one);es[0].hp-=1}');
  assert.equal(a.run('relicBuff("area")'),false);
  a.run('for(const e of es){relicTagTarget(e,null,one);e.hp-=1}');assert.equal(a.run('relicBuff("area")'),true);
});
test('A02 and B01 require successful manual casts, not automatic effects or failed cooldown attempts',()=>{
  const g=game('arc',{A02:4,B01:2}),e=g.enemy();
  g.run('activateArcE()');assert.equal(g.run('relicBuff("skill")'),true);assert.equal(g.run('relicRun.casts'),1);
  g.run('activateArcE();updateArc()');assert.equal(g.run('relicRun.casts'),1);
  g.run('activateArcQ();activateArcX()');assert.equal(g.run('relicRun.casts'),0);assert.equal(g.run('relicBuff("orbit")'),true);
});
test('A03 movement requires three continuous seconds and a stop before it can trigger again',()=>{
  const g=game('arc',{A03:4});g.run('keys.d=true;for(let n=0;n<180;n++){relicTick();updatePlayer()}');assert.equal(g.run('relicBuff("moving")'),true);
  g.run('for(let n=0;n<301;n++){relicTick();updatePlayer()}');assert.equal(g.run('relicBuff("moving")'),false);
  g.run('keys.d=false;updatePlayer();keys.a=true;for(let n=0;n<180;n++){relicTick();updatePlayer()}');assert.equal(g.run('relicBuff("moving")'),true);
});
test('A05 actual healing, C04 low-HP healing and B03 defense exclude shields and self-costs',()=>{
  const g=game('vargas',{A05:4,C04:4,B03:2},{healing:.15});g.run('player.hp=player.maxHp');assert.equal(g.run('relicBuff("healed")'),false);
  g.player.hp=50;g.run('player.hp+=10');near(g.player.hp,62.5);assert.equal(g.run('relicBuff("healed")'),true);
  near(g.run('relicIncomingDamage(100)'),90);
  g.run('relicRun.buffs={};activateVargasE()');assert.equal(g.run('relicBuff("healed")'),false);
  near(g.player.hp,62.5-g.player.maxHp*.08);
});
test('B02 uses permanent relic attack speed; B04 opens once per boss; curse penalties are only active when aggregated',()=>{
  const g=game('arc',{B02:2,B04:2},{attackSpeed:.25,incomingDamage:.08});g.player.fireRateBonus=999;
  const e=g.enemy(0,0,1000,{boss:true});g.hit(e,100,{kind:'basic'});near(e.hp,878);
  g.step(600);g.hit(e,100,{kind:'basic'});near(e.hp,766);near(g.run('relicIncomingDamage(100)'),108);
  const clean=game('arc',{},{});near(clean.run('relicIncomingDamage(100)'),100);
});
test('all run clocks stop while paused, in a menu, choosing an augment, dead, victorious or portrait-locked',()=>{
  const g=game();for(const condition of ['paused=true','screenMode="home"','choosingUpgrade=true','gameOver=true','raidVictory=true']){
    g.run('paused=false;screenMode="game";choosingUpgrade=false;gameOver=false;raidVictory=false;'+condition);
    const frame=g.run('relicRun.frame');g.step(100);assert.equal(g.run('relicRun.frame'),frame);
  }
});
test('Arc projectile retains basic type while its sun zone is skill and DOT; expired buffs are not baked into bullets',()=>{
  const g=game('arc',{}, {basicDamage:.2,skillDamage:.8,dotDamage:.3}),e=g.enemy(50);
  g.run('attackWithArc();for(let n=0;n<4;n++)updateArc()');near(damage(g,e),35*1.2);
  g.run('zombies=[];arcProjectiles=[];mouse.worldX=player.x+300');const z=g.enemy(300);
  g.run('activateArcQ();updateArc()');near(damage(g,z),35*.42*2.1);
});
test('C01 only changes crystal/circuit hits, not basic ice bolts or cold-stack rules',()=>{
  const g=game('suncall',{C01:4}),e=g.enemy(300);g.run('activateSuncallE()');near(damage(g,e),35*3.4*1.15);
  g.run('zombies=[];suncallPlant(player.x+300,player.y)');const z=g.enemy(300);g.run('activateSuncallX()');near(damage(g,z),35*2.4*1.2);
});
test('C02 weapon swap is temporary and only strengthens the weapon that fired the hit',()=>{
  const g=game('yupiter',{C02:4}),e=g.enemy();g.run('switchYupiterWeapon();attackWithYupiterWeapon();for(let n=0;n<13;n++)updateYupiterWeapons()');near(damage(g,e),Math.floor(70*1.15)*1.2);
});
test('C03 delayed clone basic and clone raid add correctly without modifying the player body',()=>{
  const g=game('ren',{C03:4}),e=g.enemy();g.run('renPlacedClones.push({x:player.x,y:player.y});attackWithRen();for(let n=0;n<8;n++)updateRen()');near(damage(g,e),35+35*.2*1.25);
  const before=e.hp;g.run('activateRenSkill();for(let n=0;n<8;n++)updateRen()');near(before-e.hp,35*.7*1.4);
});
test('C04 low HP and C05 next basic work on other heroes; multihit consumes only one charge, misses consume it too',()=>{
  const g=game('terra',{C05:4}),e=g.enemy(72);g.run('activateTerraQ();attackWithTerra()');assert.equal(g.run('relicBuff("nextBasic")'),false);
  const before=e.hp;g.run('player.fireCooldown=0;attackWithTerra()');near(before-e.hp,35*1.08);
  g.run('player.terraQCooldown=0;activateTerraQ();zombies=[];player.fireCooldown=0;attackWithTerra()');assert.equal(g.run('relicBuff("nextBasic")'),false);
  const other=game('arc',{C04:4});other.player.hp=40;const target=other.enemy();other.hit(target,100,{kind:'basic'});near(damage(other,target),118);
});
test('C06 combo and C07 heat keep caps; boosted skill conditions use pre-cast resource',()=>{
  const p=game('paladin',{C06:4},{resourceGain:.2});p.run('addPaladinCombo(50)');near(p.player.paladinCombo,65);p.run('addPaladinCombo(100)');near(p.player.paladinCombo,100);
  const g=game('arc',{C07:4},{resourceGain:.2});g.run('addArcHeat(50)');near(g.player.arcHeat,65);const e=g.enemy();g.run('activateArcE()');near(damage(g,e),35*1.25*1.22);
});
test('C08 empowered Terra aftershock retains cast resource and does not grant the bonus to uncharged casts',()=>{
  const g=game('terra',{C08:4}),e=g.enemy(460);g.player.terraVibration=100;g.run('activateTerraQ();for(let n=0;n<25;n++)updateTerra()');near(damage(g,e),35*2.8*1.25+35*2.4*1.4);near(g.player.terraVibration,0);
  const plain=game('terra',{C08:4}),target=plain.enemy(120);plain.run('activateTerraQ()');near(damage(plain,target),35*1.7);
});
test('C09 mass spend and terrain damage are tagged separately, and mass cap is unchanged',()=>{
  const g=game('void',{C09:4}),e=g.enemy(180);g.player.voidMass=50;g.run('activateVoidE()');near(damage(g,e),35*(1.25+50*.04)*1.2);near(g.player.voidMass,0);
  const before=e.hp;g.run('activateVoidX()');near(before-e.hp,35*2.5*1.15);
});
test('C10 blood moon attacks and real heals; C11 boosts shield creation but does not boost HP growth',()=>{
  const g=game('carmilla',{C10:4}),e=g.enemy();g.player.carmillaBloodMoonTime=30;g.run('attackWithCarmilla()');near(damage(g,e),35*1.75*1.18);
  g.player.hp=50;g.run('player.hp+=1');assert.equal(g.run('relicBuff("bloodHeal")'),true);
  const v=game('vargas',{C11:4});const hp=v.player.maxHp;v.run('addVargasMaxHp(10);activateVargasE()');near(v.player.maxHp,hp+10);near(v.player.vargasShield,(hp+10)*.25*1.15);
  const s=game('suncall',{C11:4});s.run('activateSuncallX()');near(s.player.suncallShield,100*.12*1.15);
});
test('C12 knots and closing rifts, C13 garden and bloom use their actual damage paths',()=>{
  const e=game('echo',{C12:4}),z=e.enemy(100);e.run('echoRifts.push({x1:player.x,y1:player.y,x2:player.x+200,y2:player.y});replayEchoMemory()');near(damage(e,z),35*1.25*1.2);
  const a=game('aria',{C13:4}),b=a.enemy(100);a.run('createAriaSoil(player.x+100,player.y);createAriaSoil(player.x+200,player.y);activateAriaE()');near(damage(a,b),35*(2.1+2*.22)*1.35);
});
test('C14 stores up to 120 percent pain but release bonus never feeds the doll again',()=>{
  const g=game('moira',{C14:4}),e=g.enemy();g.run('activateMoiraE();moiraAddLink(newEnemy);moiraDamage(newEnemy,10000)');near(g.player.moiraStoredPain,35*35*1.2);
  const before=e.hp,stored=g.player.moiraStoredPain;g.run('activateMoiraX()');near(before-e.hp,stored*1.15);near(g.player.moiraStoredPain,0);
});
test('C15 confluence and wet skill do not increase dry basic damage',()=>{
  const g=game('mare',{C15:4}),e=g.enemy(140);g.run('activateMareQ()');near(damage(g,e),35*1.35*1.12);
  const b=game('mare',{C15:4}),z=b.enemy(100);b.run('attackWithMare()');near(damage(b,z),35*.82);
});
test('C16 fork packets keep basic IDs and only replicas get bonus; infection burst is separate',()=>{
  const g=game('nullZero',{C16:4}),e=g.enemy(70,0,100000,{r:100});g.player.nullZeroForkTime=100;
  g.run('attackWithNullZero();for(let n=0;n<4;n++)updateNullZero()');near(damage(g,e),35+2*35*.56*1.15);
  const before=e.hp;g.run('detonateNullZeroInfection(newEnemy,5)');near(before-e.hp,35*(1.15+5*.13)*1.2);
});
test('C17 stardust buff does not multiply permanent stardust or leak onto other heroes',()=>{
  const g=game('astra',{C17:4},{resourceGain:1});const e=g.enemy(0,0,1);g.hit(e,2);g.run('onAstraEnemyKilled(newEnemy)');near(g.player.astraStardust,1);assert.equal(g.run('relicRun.stardustStacks'),1);
  g.step(240);assert.equal(g.run('relicBuff("stardust")'),false);
  const other=game('arc',{C17:4});other.run('onAstraEnemyKilled({hp:0})');assert.equal(other.run('relicRun.stardustStacks'),0);
});
test('C18 profitable cashout temporarily boosts attack without multiplying permanent assets; direct cards only',()=>{
  const g=game('lush',{C18:4},{resourceGain:1});g.run('lushState.pot=20;lushState.principal=10;lushCashOut()');near(g.run('lushState.totalAssets'),10);near(g.player.damage,42);
  g.step(480);near(g.player.damage,35);
  const empty=game('lush',{C18:4});empty.run('activateLushX()');assert.equal(empty.run('relicBuff("profit")'),false);
});
test('real enemy assignments and healing remain transparent; augment damage does not inherit basic/skill modifiers',()=>{
  const g=game('arc',{}, {basicDamage:1,skillDamage:2,allDamage:.1}),e=g.enemy();g.hit(e,100,{kind:'augment'});near(damage(g,e),110);
  e.hp+=50;near(damage(g,e),60);g.run('screenMode="home"');e.hp=100;near(e.hp,100);
});
test('rewards are stable once per boss and end, and failed storage writes can retry',()=>{
  const g=game();g.run('relicGrantCombatReward("boss",0);relicGrantCombatReward("boss",0);relicGrantCombatReward("defeat")');assert.equal(g.c.rewards.length,2);
  assert.equal(g.c.rewards[0].runId,g.c.rewards[1].runId);
  g.c.relicGrantReward=()=>({ok:false});g.run('relicGrantCombatReward("boss",1)');assert.equal(g.run('relicRun.rewards.has("boss:1")'),false);
});
test('cooldown, attack speed and XP apply once through actual actions, and no relic rewrites augment damage scaling',()=>{
  const g=game('arc',{}, {cooldown:.25,attackSpeed:.25,xpGain:.2});
  g.run('activateArcQ();attackWithArc();player.expNeed=100000;gainExp(100)');
  near(g.player.arcQCooldown,270);near(g.player.fireCooldown,18);near(g.player.exp,120);
  near(g.run('scaledDamage(100)'),100);
});
test('boss BREAK interrupts exactly the first second; paused combat does not advance either boss clock',()=>{
  const g=game();g.run('startRaidBoss(1);raidIntroTime=0');const b=g.run('activeRaidBoss');
  b.relicShield=1;g.hit(b,1);b.pattern=1;
  g.run('paused=true');g.step(120);near(b.relicBreakTime,360);near(b.relicInterruptTime,60);
  g.run('paused=false');g.step(59);g.run('pickRaidPattern(activeRaidBoss)');near(b.patternTime,0);near(b.relicInterruptTime,1);
  g.step(1);near(b.relicInterruptTime,0);near(b.relicBreakTime,300);
});
test('incoming reduction/curse modifies the shield budget before HP and never changes guaranteed lethal mechanics',()=>{
  const g=game('vargas',{B03:2},{incomingDamage:.08});g.player.hp=50;g.player.vargasShield=10;
  g.run('raidPlayerDamage(.1)');near(g.player.vargasShield,0);near(g.player.hp,50-(18*1.08*.9-10));
  g.run('raidPlayerDamage(1,true)');near(g.player.hp,0);assert.equal(g.run('gameOver'),true);
});
test('C12 knot damage is not also labelled closing-rift damage; C15 confluence is separate from wet skill bonus',()=>{
  const e=game('echo',{C12:4}),z=e.enemy(100);e.run('echoRifts.push({x1:0,y1:0,x2:1,y2:1});createEchoKnot(player.x+100,player.y);replayEchoMemory()');near(damage(e,z),35*1.4*1.2);
  const m=game('mare',{C15:4}),target=m.enemy(150);m.run('relicWithSource(null,()=>{addMareCurrent(player.x,player.y,0);addMareCurrent(player.x+150,player.y-150,Math.PI/2)},{kind:"basic"})');near(damage(m,target),35*.8*1.2);
});
test('LusH C18 boosts direct basic cards but not dice, and copies keep the source attack ID',()=>{
  const g=game('lush',{C18:4,A01:4},{basicDamage:.2,skillDamage:.8}),z=g.enemy(100,0,100000,{r:100});
  g.run('attackWithLush();for(let n=0;n<6;n++)updateLush()');
  assert.equal(g.run('relicRun.basicStacks'),1);
  assert.equal(z.relicLastHit.kind,'basic');
  const q=game('lush',{A01:4});q.enemy(300);q.run('activateLushQ();for(let n=0;n<60;n++)updateLush()');assert.equal(q.run('relicRun.basicStacks'),0);
});
test('independent Suncall X casts do not reuse player coordinates as a persistent A06 attack source',()=>{
  const g=game('suncall',{A06:4}),first=Array.from({length:3},()=>g.enemy(100));
  g.run('suncallPlant(player.x+100,player.y);activateSuncallX()');
  const firstId=first[0].relicLastHit.attackId;
  assert.equal(g.run('relicBuff("area")'),false);
  g.run('zombies=[];player.suncallXCooldown=0');
  const second=Array.from({length:2},()=>g.enemy(100));
  g.run('suncallPlant(player.x+100,player.y);activateSuncallX()');
  assert.notEqual(second[0].relicLastHit.attackId,firstId);
  assert.equal(g.run('relicBuff("area")'),false);
});
test('Lush temporary attack buffs cannot change permanent augment rounding and cannot survive restart',()=>{
  const g=game('lush',{C18:4});
  g.run('lushState.pot=20;lushState.principal=10;lushCashOut();upgrades.find(u=>u.id==="damage").apply()');
  near(g.player.damage,37*1.2);g.step(480);near(g.player.damage,37);
  g.run('lushState.pot=20;lushState.principal=10;lushCashOut();restart()');near(g.player.damage,35);
});
test('BREAK cancels an in-progress dash and suppresses contact damage without extending the window',()=>{
  const g=game();g.run('startRaidBoss(1);raidIntroTime=0');const b=g.run('activeRaidBoss');
  b.x=g.player.x;b.y=g.player.y;b.pattern=1;b.dashVx=16;b.dashVy=16;b.relicShield=1;
  g.hit(b,1);near(b.dashVx,0);near(b.dashVy,0);assert.equal(b.pattern,null);
  const hp=g.player.hp,x=b.x,y=b.y;g.run('updateRaidBossSystem()');
  near(g.player.hp,hp);near(b.x,x);near(b.y,y);near(b.relicBreakTime,360);
});
test('all selected heroes run their real update and attack loop with equipment without non-finite stats or exceptions',()=>{
  for(const hero of ['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','aria','moira','mare','nullZero','astra','lush','oblivion']) {
    const g=game(hero,{A06:4,B01:2},{allDamage:.08,critChance:.05,attackSpeed:.1,cooldown:.1});g.enemy(200);g.run('mouse.down=true');
    for(let n=0;n<20;n++)g.run(`update();${hero==='lush'?'updateLush()':hero==='oblivion'?'updateOblivionCombat()':''}`);
    assert.ok(Number.isFinite(g.player.hp)&&Number.isFinite(g.player.damage),hero);
  }
});
test('every hero basic attack reaches a raid shield through its real damage path before removing boss HP',()=>{
  for(const hero of ['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','aria','moira','mare','nullZero','astra','lush','oblivion']) {
    const g=game(hero,{}, {shieldDamage:.2,critChance:1}),boss=g.enemy(120,0,100000,{isRaidBoss:true,boss:true,raidIndex:0,r:65});
    const hp=boss.hp,shield=boss.relicShield;
    // This combat-only fixture omits the separate Lush/Oblivion UI integration
    // dispatchers, so invoke every hero's actual basic directly and consistently.
    const attack=hero==='yupiter'?'attackWithYupiterWeapon':`attackWith${hero[0].toUpperCase()+hero.slice(1)}`;
    for(let n=0;n<45;n++)g.run(`${attack}();update();${hero==='lush'?'updateLush()':hero==='oblivion'?'updateOblivionCombat()':''}`);
    assert.equal(boss.hp,hp,`${hero}: shield must absorb HP damage`);assert.ok(boss.relicShield<shield,`${hero}: its basic must damage the shield`);
  }
});
test('single-projectile creators never scan unrelated pools; a full cast only reads their tail boundaries',()=>{
  const g=game('lush');
  g.run(`let relicTestPoolReads=0;bullets=new Proxy(Array.from({length:5000},()=>({})),{get(target,key,receiver){if(/^\\d+$/.test(String(key)))relicTestPoolReads++;return Reflect.get(target,key,receiver)}});
    for(let n=0;n<1000;n++)lushSpawnCard(player.x,player.y,0);`);
  assert.equal(g.run('relicTestPoolReads'),0);
  g.run('activateLushQ()');assert.ok(g.run('relicTestPoolReads')<=3);
  assert.equal(g.run('lushState.cards.length'),176);
});
test('capped card and echo queues retain new source IDs, including passive-frame ricochets',()=>{
  const g=game('lush',{A01:4}),e=g.enemy(100);g.c.origin=e;
  g.run(`for(let n=0;n<176;n++)lushSpawnCard(player.x,player.y,0);
    const relicTestOriginal={x:player.x,y:player.y,a:0,power:1,radius:10,speed:19,kind:'basic',relicAttack:relicNewAttack({kind:'basic',weapon:2})};
    relicAttackContext=relicNewAttack({kind:'skill'});lushSpawnRicochet(relicTestOriginal,origin,10);relicAttackContext=null;`);
  assert.equal(g.run('lushState.cards.at(-1).relicAttack.id===relicTestOriginal.relicAttack.id'),true);
  assert.equal(g.run('lushState.cards.at(-1).relicAttack.kind'),'basic');
  const o=game('oblivion');
  o.run(`oblivionState.ultimateTime=600;for(let n=0;n<OBLIVION_LIMITS.echoes;n++)oblivionQueueEcho('q',{});
    const relicTestEchoContext=relicNewAttack({kind:'skill'});relicAttackContext=relicTestEchoContext;oblivionQueueEcho('e',{});relicAttackContext=null;`);
  assert.equal(o.run('oblivionState.echoes.at(-1).relicAttack.id===relicTestEchoContext.id'),true);
});
