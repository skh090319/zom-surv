const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function scene() {
  const calls = { textures: 0, images: 0, diamonds: 0, glow: 0, nebula: 0, depth: 0, strokes: 0, paths: 0, strokePaths: [], labels: [], translations: [], scales: [] };
  const gradient = () => ({ addColorStop() {} });
  const noop = () => {};
  const surface = new Proxy({ createRadialGradient: gradient, createLinearGradient: gradient }, { get: (o, k) => o[k] || noop });
  const stack = []; let activePath = [];
  const ctx = new Proxy({
    globalAlpha: .8, globalCompositeOperation: 'source-over',
    save() { calls.depth++; stack.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { calls.depth--; [this.globalAlpha, this.globalCompositeOperation] = stack.pop(); },
    drawImage(...args) { calls.images++; assert.ok(args.slice(1).every(Number.isFinite)); },
    translate(x, y) { calls.translations.push([x, y]); }, scale(x, y) { calls.scales.push([x, y]); },
    beginPath() { activePath = []; },
    moveTo(x, y) { activePath.push(['M', x, y]); },
    lineTo(x, y) { activePath.push(['L', x, y]); },
    closePath() { activePath.push(['Z']); },
    stroke(path) { calls.strokes++; calls.strokePaths.push({ width: this.lineWidth, alpha: this.globalAlpha, commands: path ? path.commands.slice() : activePath.slice() }); },
    fillText(text, x, y) { calls.labels.push({ text, x, y, font: this.font, align: this.textAlign }); }, createRadialGradient: gradient, createLinearGradient: gradient,
  }, { get: (o, k) => o[k] || noop });
  class FakePath {
    constructor() { calls.paths++; this.commands = []; } arc() {}
    moveTo(x, y) { this.commands.push(['M', x, y]); } lineTo(x, y) { this.commands.push(['L', x, y]); }
    closePath() { this.commands.push(['Z']); }
  }
  const context = {
    Math, ctx, Path2D: FakePath, player: { x: 100, y: 150, astraOrbitBlend: 0, astraStardust: 0 }, astraFrame: 0, astraWake: [],
    astraEase(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
    document: { createElement() { calls.textures++; return { getContext: () => surface }; } },
  };
  context.astraOrbitRadius = () => 120 + context.player.astraOrbitBlend * 82;
  context.astraOrbitCount = () => 3;
  context.astraQFlights = () => [];
  context.astraOrbitSlot = (i, count) => {
    const a = (context.player.astraOrbitAngle || 0) + i * Math.PI * 2 / count, r = context.astraOrbitRadius();
    return { x: context.player.x + Math.cos(a) * r, y: context.player.y + Math.sin(a) * r, a };
  };
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
  assert.equal(g.calls.textures, 2); assert.equal(g.calls.images, 600);
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

function reviewConstellation() {
  // An open, branched graph: joining the final node to the first would invent a
  // non-existent sky-chart edge, as would connecting the two separate branches.
  return { id: 'review', name: '검증 별자리', latin: 'Review',
    points: [{ x: -120, y: -95 }, { x: 0, y: -40 }, { x: 70, y: -100 }, { x: 135, y: 30 }, { x: 55, y: 110 }],
    edges: [[0, 1], [1, 2], [1, 3], [3, 4]] };
}
function setupFormation(g, count = 5, formation = 1) {
  g.context.astraGlow = () => g.calls.glow++;
  g.context.astraDiamond = () => g.calls.diamonds++;
  g.context.reviewGravity = { x: 100, y: 150, age: 350, state: 'orbit', constellationProgress: formation,
    constellation: reviewConstellation(),
    bodies: Array.from({ length: count }, (_, i) => ({ x: i * 25, y: i * 10, state: 'orbit' })) };
}

test('completed and fading constellation draws only the selected graph edges and preserves bodies', () => {
  const g = scene();
  setupFormation(g);
  const definition = g.context.reviewGravity.constellation;
  const expected = definition.edges.flatMap(([a, b]) => [['M', definition.points[a].x, definition.points[a].y], ['L', definition.points[b].x, definition.points[b].y]]);
  const before = JSON.stringify(g.context.reviewGravity.bodies);
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.glow, definition.points.length); assert.equal(g.calls.diamonds, definition.points.length);
  assert.equal(g.calls.strokes, 4);
  for (const stroke of g.calls.strokePaths.slice(0, 3)) assert.deepEqual(stroke.commands, expected);
  assert.deepEqual(g.calls.labels, [], 'constellation names are intentionally not shown');
  g.context.reviewGravity.state = 'launch'; g.context.reviewGravity.launchAge = 12;
  g.context.reviewGravity.bodies.forEach(b => b.state = 'flight');
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.glow, 10); assert.equal(g.calls.depth, 0);
  assert.equal(g.calls.paths, 1, 'full graph path is cached between orbit and launch');
  assert.equal(g.context.ctx.globalAlpha, .8); assert.equal(g.context.ctx.globalCompositeOperation, 'source-over');
  assert.equal(g.calls.strokePaths[4].alpha, g.calls.strokePaths[0].alpha * .5);
  g.context.reviewGravity.bodies.forEach(b => b.state = 'orbit');
  assert.equal(JSON.stringify(g.context.reviewGravity.bodies), before);
});

test('graph tracing respects disconnected edge starts and does not close or join branches', () => {
  const g = scene(); setupFormation(g, 0, .4);
  const geometry = g.run('astraConstellationGeometry(reviewGravity.constellation)');
  const distance = geometry.length * .48;
  const expected = [];
  for (let n = 0; n < geometry.segments.length; n += 6) {
    const s = geometry.segments, left = distance - s[n + 4];
    if (left <= 0) break;
    const q = Math.min(1, left / s[n + 5]);
    expected.push(['M', s[n], s[n + 1]], ['L', s[n] + (s[n + 2] - s[n]) * q, s[n + 1] + (s[n + 3] - s[n + 1]) * q]);
  }
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.strokes, 3);
  for (const stroke of g.calls.strokePaths) assert.deepEqual(stroke.commands, expected);
  assert.equal(g.calls.labels.length, 0, 'caption only appears when the formation is almost complete');
});

test('complete sky chart geometry and drawing costs stay independent of captured-body count', () => {
  for (const count of [0, 1, 10, 1000]) {
    const g = scene(); setupFormation(g, count);
    g.run('for(let n=0;n<120;n++)drawAstraConstellation(reviewGravity)');
    assert.equal(g.calls.paths, 1); assert.equal(g.calls.glow, 5 * 120); assert.equal(g.calls.diamonds, 5 * 120);
    assert.equal(g.calls.strokes, 4 * 120); assert.equal(g.calls.depth, 0);
    g.context.reviewGravity.state = 'launch'; g.context.reviewGravity.launchAge = 24;
    g.run('drawAstraConstellation(reviewGravity)');
    assert.equal(g.calls.strokes, 4 * 120, 'expired chart does not emit invisible draw calls');
  }
});

test('arbitrary orbit links disappear before the actual constellation finishes tracing', () => {
  const g = scene(); setupFormation(g, 1000, .62);
  g.run('drawAstraConstellation(reviewGravity)');
  assert.equal(g.calls.strokes, 3, 'only the three actual-graph glow passes remain');
  assert.ok(g.calls.diamonds <= 5);
});

test('all ten sourced sky charts retain every real edge and illuminate every star', () => {
  const g = scene(); setupFormation(g, 0);
  g.run(fs.readFileSync(path.join(__dirname, '..', 'js/04-astra-constellations.js'), 'utf8'));
  const definitions = g.run('ASTRA_CONSTELLATIONS');
  assert.equal(definitions.length, 10); assert.ok(definitions.some(d => d.id === 'pisces'));
  for (const definition of definitions) {
    const start = g.calls.strokePaths.length, stars = g.calls.glow;
    g.context.reviewGravity.constellation = definition;
    g.run('drawAstraConstellation(reviewGravity)');
    const expected = Array.from(definition.edges).flatMap(([a, b]) => [
      ['M', definition.points[a].x, definition.points[a].y], ['L', definition.points[b].x, definition.points[b].y],
    ]);
    for (const stroke of g.calls.strokePaths.slice(start, start + 3)) assert.deepEqual(stroke.commands, expected, definition.latin);
    assert.equal(g.calls.glow - stars, definition.points.length, definition.latin);
  }
  assert.equal(g.calls.paths, 10, 'one cached path per immutable sky chart');
  assert.equal(g.calls.depth, 0);
});

test('phone constellation keeps a visible line core without showing any names', () => {
  for (const scale of [.4, .5, .6, 1]) {
    const g = scene(); setupFormation(g);
    g.context.canvas = { width: 844, height: 390 };
    g.context.isMobileTouchDevice = () => true;
    g.context.getWorldViewScale = () => scale;
    g.run('drawAstraConstellation(reviewGravity)');
    assert.equal(g.calls.labels.length, 0);
    assert.ok(g.calls.strokePaths[2].width * scale >= .75);
    assert.equal(g.calls.strokes, 4); assert.equal(g.calls.depth, 0);
  }
});

test('X aurora is anchored to actual stars and disappears for stars deployed by Q', () => {
  const g = scene(); g.context.player.astraOrbitBlend = 1; g.context.player.astraOrbitAngle = 1.1;
  g.context.astraDiamond = () => {};
  g.context.astraQFlights = () => [{ slot: 1 }];
  g.run('drawAstraAurora()');
  assert.equal(g.calls.images, 4, 'two layered wakes, not a complete orbit band');
  const expected = [0, 2].map(i => { const p = g.context.astraOrbitSlot(i, 3); return [p.x, p.y]; });
  assert.deepEqual(g.calls.translations, expected);
  g.context.astraQFlights = () => [{ slot: 0 }, { slot: 1 }, { slot: 2 }];
  g.run('drawAstraAurora()'); assert.equal(g.calls.images, 4, 'no lingering ring without its stars');
  assert.equal(g.calls.depth, 0);
});

test('aurora texture variants stay bounded as orbit-star counts change', () => {
  const g = scene(); g.context.player.astraOrbitBlend = 1; g.context.astraDiamond = () => {};
  for (let count = 3; count <= 20; count++) {
    g.context.astraOrbitCount = () => count;
    g.run('drawAstraAurora()');
    assert.ok(g.run('astraAuroraTextureKeys.length') <= 6);
    assert.ok(g.run('Array.from(astraVfxTextures.keys()).filter(k=>k.startsWith("aurora:")).length') <= 6);
  }
  assert.equal(g.calls.depth, 0);
});

test('E curved energy wakes reuse one detailed texture and never grow with suction distance', () => {
  const g = scene(); g.context.astraDiamond = () => g.calls.diamonds++;
  for (const distance of [10, 100, 1000, 100000]) {
    for (let n = 0; n < 50; n++) g.run(`drawAstraSuctionWake(${distance},0,0,0,40,${n / 10},.5)`);
  }
  assert.equal(g.calls.textures, 1); assert.equal(g.calls.images, 200); assert.equal(g.calls.diamonds, 400);
  assert.ok(g.calls.scales.every(([x, y]) => Number.isFinite(x) && x > 0 && x <= 104 / 264 && x === y));
  g.run('drawAstraSuctionWake(100,0,0,0,40,0,0);drawAstraSuctionWake(0,0,0,0,40,0,1)');
  assert.equal(g.calls.images, 200); assert.equal(g.calls.depth, 0);
  assert.equal(g.context.ctx.globalAlpha, .8); assert.equal(g.context.ctx.globalCompositeOperation, 'source-over');
});
