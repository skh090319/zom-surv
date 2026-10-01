const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ Math });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/04-astra-constellations.js'), 'utf8'), context);
const catalog = vm.runInContext('ASTRA_CONSTELLATIONS', context);

test('R catalog has exactly ten distinct real constellations, including Pisces', () => {
  assert.equal(catalog.length, 10);
  assert.equal(new Set(catalog.map(c => c.id)).size, 10);
  assert.equal(new Set(catalog.map(c => c.name)).size, 10);
  assert.deepEqual(Array.from(catalog, c => c.latin),
    ['Pisces', 'Orion', 'Cassiopeia', 'Cygnus', 'Lyra', 'Leo', 'Scorpius', 'Taurus', 'Gemini', 'Pegasus']);
  assert.equal(catalog[0].name, '물고기자리');
  assert.ok(Object.isFrozen(catalog));
});

test('source line figures retain their complete node and edge counts', () => {
  const expected = [[22,23],[23,24],[5,4],[9,8],[6,7],[9,9],[14,13],[12,11],[12,11],[14,14]];
  catalog.forEach((c, i) => assert.deepEqual([c.points.length, c.edges.length], expected[i], c.id));
});

test('constellation graphs are bounded, connected, immutable and cache all edge lengths', () => {
  for (const c of catalog) {
    assert.ok(Object.isFrozen(c) && Object.isFrozen(c.points) && Object.isFrozen(c.edges));
    assert.ok(c.points.length <= 24);
    assert.ok(c.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Object.isFrozen(p)));
    const radii = c.points.map(p => Math.hypot(p.x, p.y));
    assert.ok(Math.max(...radii) <= 220 + 1e-8, c.id);
    assert.ok(Math.abs(Math.max(...radii) - 220) < 1e-8, c.id);
    assert.ok(Math.abs(Math.min(...c.points.map(p => p.x)) + Math.max(...c.points.map(p => p.x))) < 1e-8);
    assert.ok(Math.abs(Math.min(...c.points.map(p => p.y)) + Math.max(...c.points.map(p => p.y))) < 1e-8);
    const edgeKeys = new Set(), visited = new Set([0]);
    let length = 0;
    c.edges.forEach(([a, b], i) => {
      assert.ok(a !== b && a >= 0 && b >= 0 && a < c.points.length && b < c.points.length);
      const key = [a, b].sort((x, y) => x - y).join(':');
      assert.ok(!edgeKeys.has(key)); edgeKeys.add(key);
      const d = Math.hypot(c.points[a].x - c.points[b].x, c.points[a].y - c.points[b].y);
      assert.ok(Math.abs(d - c.edgeLengths[i]) < 1e-8); length += d;
      assert.ok(Math.abs(length - c.edgeEnds[i]) < 1e-8);
    });
    for (let n = 0; n < c.points.length; n++) for (const [a, b] of c.edges) {
      if (visited.has(a)) visited.add(b);
      if (visited.has(b)) visited.add(a);
    }
    assert.equal(visited.size, c.points.length, c.id);
    assert.ok(Math.abs(length - c.totalLength) < 1e-8);
  }
});

test('sky projection treats equivalent RA wraps identically and keeps north up / east left', () => {
  const a = vm.runInContext("astraBuildConstellation('test','test','Test', [[[359,8],[1,12],[3,7]]])", context);
  const b = vm.runInContext("astraBuildConstellation('test','test','Test', [[[-1,8],[1,12],[3,7]]])", context);
  a.points.forEach((p, i) => {
    assert.ok(Math.abs(p.x - b.points[i].x) < 1e-8);
    assert.ok(Math.abs(p.y - b.points[i].y) < 1e-8);
  });
  assert.ok(a.points[0].x > a.points[1].x && a.points[1].x > a.points[2].x);
  assert.ok(a.points[1].y < a.points[0].y && a.points[1].y < a.points[2].y);
});
