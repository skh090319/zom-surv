const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function presentation() {
  const calls = [], saved = [];
  const base = {
    globalAlpha: .8, globalCompositeOperation: 'source-over',
    save() { saved.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { [this.globalAlpha, this.globalCompositeOperation] = saved.pop(); },
  };
  const ctx = new Proxy(base, {get(target, key) {
    if (key in target) return target[key];
    return (...args) => {
      for (const value of args) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key}: finite geometry`);
      calls.push([key, ...args]);
      if (key.startsWith('create')) return {addColorStop() {}};
    };
  }});
  const context = {ctx, Math, selectedCharacter: 'astra', screenMode: 'game', player: {x:0,y:0,astraHorizonLevel:0,astraStardust:0},
    transcended: {}, WORLD: {width:4000,height:4000}, camera:{x:0,y:0}, getCameraViewWidth:()=>844,getCameraViewHeight:()=>390};
  vm.createContext(context);
  for (const file of ['04-astra.js', '04-astra-vfx.js', '08-mobile-targeting.js']) vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context);
  return {context, calls, run: source=>vm.runInContext(source,context)};
}

test('E aim preview matches stardust growth for both damage and the larger suction area', () => {
  const g = presentation();
  const initial = g.run('getMobileAimedSkillTargetSpec("e")');
  assert.equal(initial.range,520); assert.equal(initial.radius,85); assert.equal(initial.pullRadius,136);
  g.context.player.astraStardust=100;
  const grown = g.run('getMobileAimedSkillTargetSpec("e")');
  assert.equal(grown.radius,170); assert.equal(grown.range,520); assert.equal(grown.pullRadius,272);
  g.context.player.astraHorizonLevel=3;
  const upgraded = g.run('getMobileAimedSkillTargetSpec("e")');
  assert.equal(upgraded.radius,278); assert.equal(upgraded.pullRadius,139*1.6*2);
  g.run('resetAstra()');
  assert.equal(g.run('getMobileAimedSkillTargetSpec("e").pullRadius'),136);
});

test('large stardust suction fields retain the same bounded draw workload and restore canvas state', () => {
  const g = presentation(), counts=[];
  for(const pullR of [272,544,2992,27472]){
    g.calls.length=0;g.context.reviewWell={r:170,pullR,phase:4.5,maxLife:270,life:170};
    g.run('drawAstraAccretionReach(reviewWell,.7)');counts.push(g.calls.length);
    const boundary=g.calls.filter(call=>call[0]==='arc'&&call[3]===pullR);
    assert.ok(boundary.length>=2,'suction boundary uses the actual gameplay radius');
    assert.equal(g.context.ctx.globalAlpha,.8); assert.equal(g.context.ctx.globalCompositeOperation,'source-over');
  }
  assert.ok(counts[0]>0); assert.ok(counts.every(count=>count===counts[0]));
  g.calls.length=0;g.run('drawAstraAccretionReach(reviewWell,0)');assert.equal(g.calls.length,0);
});
