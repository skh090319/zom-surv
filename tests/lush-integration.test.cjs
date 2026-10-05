const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function game() {
  const listeners = new Map(), calls = {}, draws = [];
  let depth = 0;
  const count = name => calls[name] = (calls[name] || 0) + 1;
  const c = {
    console, Math, URLSearchParams, performance, setTimeout, clearTimeout,
    navigator: {maxTouchPoints: 1}, matchMedia: () => ({matches: true}), location: {search: ''},
    localStorage: {getItem: () => null, setItem() {}},
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    addEventListener(type, fn, capture = false) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({fn, capture: capture === true || capture.capture === true});
    },
    dispatchEvent(event) {
      for (const {fn} of [...(listeners.get(event.type) || [])].sort((a,b) => Number(b.capture) - Number(a.capture))) {
        fn(event);
        if (event.stopped) break;
      }
    },
    KeyboardEvent: class {
      constructor(type, data) { Object.assign(this, {type, repeat: false}, data); }
      stopImmediatePropagation() { this.stopped = true; }
    },
    Image: class { constructor() { this.complete = true; this.naturalWidth = this.naturalHeight = 256; } },
    setGameImageSource(image, src) { image.src = src; return image; },
    ensureGameImage: image => image,
    player: {x:1000,y:1000,r:20,level:1,damage:35,speed:4.2,hp:100,maxHp:100,fireCooldown:0,globalDamageMultiplier:1,crownLevel:0},
    camera:{x:500,y:700}, mouse:{x:0,y:0,worldX:1200,worldY:1000},
    zombies:[], selectedAugments:[], selectedCharacter:'lush', screenMode:'game', paused:false, choosingUpgrade:false, gameOver:false, raidVictory:false,
    characterSkillGuide:{}, guideCharacterOrder:[], exclusiveAugmentOwners:{},
    getWorldViewScale: () => .78, WORLD:{width:4000,height:4000},
    screenToWorld() { c.mouse.worldX = c.mouse.x / .78 + c.camera.x; c.mouse.worldY = c.mouse.y / .78 + c.camera.y; },
    pointInRect: () => false, pauseButtonRect:{x:0,y:0,w:0,h:0},
    getCharacterPreviewSprite: id => ({id}),
    getMobileHudBounds: () => ({x:1,y:2,w:3,h:4}),
    absorbSuncallShield: damage => {count('baseShield'); return damage - 2;},
    killZombie(index, zombie) { count('baseKill'); const actual = c.zombies.indexOf(zombie); if (actual >= 0) c.zombies.splice(actual, 1); },
    scaledDamage: damage => damage * c.player.globalDamageMultiplier * (c.player.crownLevel > 0 ? 2 : 1),
    update() { count('baseUpdate'); if (c.onBaseUpdate) c.onBaseUpdate(); },
    updatePlayer() { count('baseMove'); calls.movementSpeed = c.player.speed; },
    shoot: () => count('baseShoot'), reload: () => count('baseReload'), restart: () => count('baseRestart'),
    drawPlayer() {}, drawParticles() {}, drawBackground() {}, draw() {}, drawHUD() {}, drawHealthBar() {}, drawExpBar() {},
    drawMobileCharacterResource() {}, drawAugmentIcon() {},
    ctx: new Proxy({}, {
      get(obj, key) {
        if (key in obj) return obj[key];
        if (key === 'save') return () => {depth++;};
        if (key === 'restore') return () => {assert.ok(--depth >= 0);};
        return (...args) => {
          for (const n of args) if (typeof n === 'number') assert.ok(Number.isFinite(n), `${key} received ${n}`);
          draws.push([key,...args]);
          if (key.startsWith('create')) return {addColorStop() {}};
          if (key === 'measureText') return {width:70};
        };
      }
    })
  };
  c.canvas = {width:844,height:390,addEventListener() {},getBoundingClientRect:() => ({left:0,top:0,width:844,height:390})};
  c.addEventListener('keydown', () => count('otherKeyHandler'));
  vm.createContext(c);
  for (const file of ['02-upgrades.js','08-mobile.js','08-mobile-targeting.js','10-lush.js','11-lush-presentation.js','12-lush-integration.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), c, {filename:file});
  }
  return {c,calls,draws,run:source => vm.runInContext(source,c),depth:() => depth};
}

test('mobile aim previews use finite geometry and track actual attack reach', () => {
  const g = game();
  const attack = g.run('getMobileAttackTargetSpec()');
  assert.equal(attack.arc, .34); assert.equal(attack.range, 980);
  g.run('mobileAttackAim={dragged:true,angle:.4,strength:1};drawMobileTargetingIndicator()');
  assert.ok(g.draws.some(call => call[0] === 'arc')); assert.equal(g.depth(), 0);
  const q = g.run('getMobileSkillTargetSpec("q")'), e = g.run('getMobileSkillTargetSpec("e")');
  assert.equal(q.range, 1100); assert.equal(q.width, 68);
  assert.equal(e.range, 500); assert.equal(e.width, 72); assert.equal(e.endRadius, 280);
  g.run('activateLushQ();lushUpdateRoyalBursts();activateLushE()');
  assert.equal(g.run('lushState.cards[0].range'), q.range);
  assert.equal(g.run('lushState.cards[0].radius*2'), q.width);
  assert.equal(g.run('lushState.dice[0].range'), e.range);
  for (const assets of [0,50,150,350,700,1000000]) {
    g.run(`lushState.totalAssets=${assets};player.lushxCooldown=0;activateLushX()`);
    const x = g.run('getMobileSkillTargetSpec("x")');
    assert.equal(x.range, g.run('lushState.chipStorms.at(-1).radius'));
    assert.equal(x.aim, false);
  }
  assert.equal(g.run('getMobileSkillTargetSpec("r").range'), 620);
  assert.equal(g.run('getMobileSkillTargetSpec("r").aim'), false);
});

test('mobile Q and E retain drag direction while self casts leave aim untouched', () => {
  const g = game();
  for (const key of ['q','e']) {
    g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:Math.PI/2,strength:1};applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec('${key}'));triggerMobileSkill('${key}',true)`);
  }
  assert.ok(Math.abs(g.run('lushState.qBursts[0].a') - Math.PI/2) < 1e-9);
  assert.ok(Math.abs(g.run('lushState.dice[0].a') - Math.PI/2) < 1e-9);
  const before = {...g.c.mouse};
  for (const key of ['x','r']) g.run(`mobileSkillAim={key:'${key}',dragged:true,angle:-1,strength:1};applyMobileDragAim(mobileSkillAim,getMobileSkillTargetSpec('${key}'))`);
  assert.deepEqual(g.c.mouse, before);
  assert.equal(g.calls.otherKeyHandler, undefined, 'LusH skill dispatch is intercepted once');
});

test('ultimate unlock, repeat suppression and inactive-screen input guards apply through real dispatch', () => {
  const g = game();
  g.run('triggerMobileSkill("r",true)'); assert.equal(g.run('lushState.ultimate'), null);
  g.c.player.level = 10; g.run('triggerMobileSkill("r",true)'); assert.ok(g.run('lushState.ultimate'));
  g.run('dispatchEvent(new KeyboardEvent("keydown",{key:"q",repeat:true}))');
  assert.equal(g.run('lushState.qBursts.length'), 0);
  for (const mode of ['paused','choosingUpgrade','gameOver','raidVictory']) {
    g.c[mode] = true; g.run('triggerMobileSkill("q",true)'); g.c[mode] = false;
    assert.equal(g.run('lushState.qBursts.length'), 0);
  }
  g.c.screenMode = 'home'; g.run('triggerMobileSkill("q",true)');
  assert.equal(g.run('lushState.qBursts.length'), 0);
});

test('kill rewards are awarded once, stale removals are harmless and asset damage stays LusH-only', () => {
  const g = game(), dead = {x:0,y:0,hp:0}; g.c.zombies.push(dead); g.c.dead = dead;
  g.run('killZombie(999,dead);killZombie(0,dead)');
  assert.equal(g.run('lushState.chips'), 1); assert.equal(g.run('lushState.totalAssets'), 1);
  g.c.selectedCharacter = 'astra'; g.c.zombies.push({hp:0}); g.run('killZombie(0,zombies[0])');
  assert.equal(g.run('lushState.totalAssets'), 1);
  g.c.selectedCharacter = 'lush'; g.run('lushState.totalAssets=200');
  assert.equal(g.run('scaledDamage(35)'), 35); assert.equal(g.run('lushPower(1)'), 70);
  g.c.player.globalDamageMultiplier = 1.4; g.c.player.crownLevel = 1;
  assert.equal(g.run('scaledDamage(35)'), 98); assert.equal(g.run('lushPower(1)'), 196);
});

test('pause and upgrade transitions freeze LusH state and foreign heroes keep base behavior', () => {
  const g = game(); g.run('activateLushE()');
  for (const mode of ['paused','choosingUpgrade','gameOver','raidVictory']) {
    const before = g.run('JSON.stringify(lushState)'); g.c[mode] = true; g.run('update()'); g.c[mode] = false;
    assert.equal(g.run('JSON.stringify(lushState)'), before);
  }
  g.c.onBaseUpdate = () => {g.c.choosingUpgrade = true;};
  const before = g.run('lushState.frame'); g.run('update()'); assert.equal(g.run('lushState.frame'), before);
  g.c.onBaseUpdate = null; g.c.choosingUpgrade = false; g.run('update()'); assert.equal(g.run('lushState.frame'), before + 1);
  g.c.selectedCharacter = 'astra'; g.run('shoot();reload();triggerMobileSkill("q",true)');
  assert.equal(g.calls.baseShoot, 1); assert.equal(g.calls.baseReload, 1); assert.ok(g.calls.otherKeyHandler >= 1);
  assert.equal(g.run('absorbSuncallShield(12)'), 10); assert.equal(g.calls.baseShield, 1);
  g.c.selectedCharacter = 'lush'; g.run('lushState.shield=8');
  assert.equal(g.run('absorbSuncallShield(12)'), 4); assert.equal(g.run('lushState.shield'), 0);
  g.run('lushState.failureTime=100;upgradeCount.lushRecovery=3;updatePlayer()');
  assert.ok(Math.abs(g.calls.movementSpeed - 4.2*1.24) < 1e-9); assert.equal(g.c.player.speed, 4.2);
  g.run('restart()'); assert.equal(g.calls.baseRestart, 1); assert.equal(g.run('lushState.totalAssets'), 0);
});

test('registration retains existing control art, owns all four augments and loads VFX before integration', () => {
  const g = game();
  assert.deepEqual(Array.from(g.run('lushArt.controls'), image => image.src), [0,1,2,3].map(i => `assets/lush-v1/control-${i}.webp`));
  assert.equal(g.run('lushArt.body.src'), 'assets/lush-v1/lush.webp');
  assert.equal(g.run('lushArt.realm.src'), 'assets/lush-v1/casino-realm.webp');
  assert.deepEqual(Array.from(g.run('MOBILE_SKILL_KEYS.lush')), ['q','e','x','r']);
  const ids = Array.from(g.run('lushAugmentDefs'), item => item.id);
  assert.equal(ids.length, 4);
  for (const id of ids) {
    assert.equal(g.c.exclusiveAugmentOwners[id], 'lush');
    g.run(`for(let n=0;n<4;n++)upgrades.find(u=>u.id==='${id}').apply()`);
    assert.equal(g.run(`upgradeCount.${id}`), 4); assert.equal(g.run(`transcended.${id}`), true);
    g.c.selectedCharacter = 'astra'; assert.equal(g.run(`upgrades.find(u=>u.id==='${id}').requires()`), false); g.c.selectedCharacter = 'lush';
  }
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ordered = ['10-lush.js','11-lush-presentation.js','11-lush-vfx.js','12-lush-integration.js'].map(file => html.indexOf(`js/${file}?`));
  assert.ok(ordered.every((position,i) => position >= 0 && (i === 0 || position > ordered[i-1])));
});
