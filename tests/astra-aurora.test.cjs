const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function scene() {
  const calls = { textures: 0, images: 0, diamonds: 0, glow: 0, nebula: 0, depth: 0, strokes: 0, paths: 0 };
  const gradient = () => ({ addColorStop() {} });
  const noop = () => {};
  const surface = new Proxy({ createRadialGradient: gradient, createLinearGradient: gradient }, { get: (o, k) => o[k] || noop });
  const stack = [];
  const ctx = new Proxy({
    globalAlpha: .8, globalCompositeOperation: 'source-over',
    save() { calls.depth++; stack.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { calls.depth--; [this.globalAlpha, this.globalCompositeOperation] = stack.pop(); },
    drawImage(...args) { calls.images++; assert.ok(args.slice(1).every(Number.isFinite)); },
    stroke() { calls.strokes++; }, createRadialGradient: gradient, createLinearGradient: gradient,
  }, { get: (o, k) => o[k] || noop });
  class FakePath { constructor() { calls.paths++; } arc() {} moveTo() {} lineTo() {} closePath() {} }
  const context = {
    Math, ctx, Path2D: FakePath, player: { x: 100, y: 150, astraOrbitBlend: 0, astraStardust: 0 }, astraFrame: 0, astraWake: [],
    astraEase(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
    document: { createElement() { calls.textures++; return { getContext: () => surface }; } },
  };
  context.astraOrbitRadius = () => 120 + context.player.astraOrbitBlend * 82;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/04-astra-vfx.js'), 'utf8'), context);
  return { context, calls, run: c => vm.runInContext(c, context) };
}

test('X aurora unfolds continuously with the real orbit and folds completely away', () => {
  const g = scene(); let previous = { alpha: 0, radius: 0 };
  for (let n = 0; n <= 100; n++) {
    g.context.player.astraOrbitBlend = n / 100;
    const state = g.run('astraAuroraState()');
    assert.ok(state.alpha >= previous.alpha && state.alpha <= 1);
    assert.ok(state.radius >= previous.radius);
    if (n > 0) { assert.ok(state.alpha - previous.alpha < .016); assert.ok(state.radius - previous.radius < 2); }
    previous = state;
  }
  assert.equal(previous.radius, 202); assert.equal(previous.alpha, 1);
  g.context.player.astraOrbitBlend = 0;
  g.run('drawAstraAurora()'); assert.equal(g.calls.images, 0); assert.equal(g.calls.textures, 0);
});

test('X aurora keeps its detailed texture bounded and restores render state across frames', () => {
  const g = scene(); g.context.player.astraOrbitBlend = 1;
  g.run('for(let n=0;n<100;n++){astraFrame=n;drawAstraAurora()}');
  assert.equal(g.calls.textures, 2); assert.equal(g.calls.images, 200);
  assert.equal(g.calls.depth, 0); assert.equal(g.context.ctx.globalAlpha, .8);
  assert.equal(g.context.ctx.globalCompositeOperation, 'source-over');
  assert.equal(g.run('astraVfxTextures.size'), 2);
});

test('300-stardust keeps body stars and nebula without the overhead crown', () => {
  const g = scene(); g.context.player.astraStardust = 300;
  g.context.astraDiamond = () => g.calls.diamonds++;
  g.context.astraGlow = () => g.calls.glow++;
  g.context.astraNebula = () => g.calls.nebula++;
  g.run('drawAstraGrowth(true);drawAstraGrowth(false)');
  assert.equal(g.calls.diamonds, 12); assert.equal(g.calls.glow, 0); assert.equal(g.calls.nebula, 1);
  assert.equal(g.calls.depth, 0);
});

test('cached E spirals retain the original well and suction vertices exactly', () => {
  const g = scene();
  for (const ratio of [undefined, .625, .437]) {
    const geometry = g.run(ratio === undefined ? 'astraSpiralGeometry()' : `astraSpiralGeometry(${ratio})`);
    const steps = ratio === undefined ? 40 : 24;
    for (const radius of [18.5, 85, 8500]) for (const angle of [0, 1.25, 6.1]) for (let i = 0; i <= steps; i++) {
      const q = i / steps, rr = ratio === undefined ? radius * (.12 + .8 * q) : radius * ratio * .58 + (radius - radius * ratio * .58) * q;
      const a = angle + (ratio === undefined ? -q * 3.6 : (1 - q) ** 1.5 * 2.15);
      const x = (geometry.points[i * 2] * Math.cos(angle) - geometry.points[i * 2 + 1] * Math.sin(angle)) * radius;
      const y = (geometry.points[i * 2] * Math.sin(angle) + geometry.points[i * 2 + 1] * Math.cos(angle)) * radius;
      assert.ok(Math.abs(x - Math.cos(a) * rr) < 1e-8); assert.ok(Math.abs(y - Math.sin(a) * rr) < 1e-8);
    }
    assert.equal(geometry, g.run(ratio === undefined ? 'astraSpiralGeometry()' : `astraSpiralGeometry(${ratio})`));
  }
  g.run('for(let n=1;n<30;n++)astraSpiralGeometry(n/100)');
  assert.equal(g.run('astraSuctionArmCache.size'), 8);
});

test('continuous rune radii do not allocate or evict cached fixed-radius paths', () => {
  const g = scene();
  g.run('astraRuneRing(0,0,120,0)');
  assert.equal(g.calls.paths, 5);
  g.run('for(let n=1;n<100;n++)astraRuneRing(0,0,120+n/100,0)');
  assert.equal(g.calls.paths, 5); assert.equal(g.run('astraRuneGeometry.size'), 1);
  g.run('astraRuneRing(0,0,120,1)'); assert.equal(g.calls.paths, 5);
  assert.equal(g.calls.depth, 0);
});

test('prelaunch celestial star renders completed and fading formations without changing bodies', () => {
  const g = scene();
  g.context.astraConstellationPoint = (i, count, gravity) => {
    const a = i / count * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 99 : 220;
    return { x: gravity.x + Math.cos(a) * r, y: gravity.y - 38 + Math.sin(a) * r };
  };
  g.context.astraGlow = () => g.calls.glow++;
  g.context.reviewGravity = { x: 100, y: 150, age: 350, state: 'orbit', constellationProgress: 1,
    bodies: Array.from({ length: 5 }, (_, i) => ({ x: i * 25, y: i * 10, state: 'orbit' })) };
  const before = JSON.stringify(g.context.reviewGravity.bodies);
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.glow, 5); assert.ok(g.calls.strokes >= 5);
  g.context.reviewGravity.state = 'launch'; g.context.reviewGravity.launchAge = 12;
  g.context.reviewGravity.bodies.forEach(b => b.state = 'flight');
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.glow, 10); assert.equal(g.calls.depth, 0);
  g.context.reviewGravity.bodies.forEach(b => b.state = 'orbit');
  assert.equal(JSON.stringify(g.context.reviewGravity.bodies), before);
});
