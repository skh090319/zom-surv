const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function healthbar() {
  const calls = [], surfaces = [], saved = [];
  function context(log) {
    const state = {globalAlpha:.73, globalCompositeOperation:'source-over',
      save() { saved.push([this.globalAlpha,this.globalCompositeOperation]); },
      restore() { [this.globalAlpha,this.globalCompositeOperation] = saved.pop(); }};
    return new Proxy(state, {get(target,key) {
      if (key in target) return target[key];
      return (...args) => {
        args.filter(value=>typeof value==='number').forEach(value=>assert.ok(Number.isFinite(value)));
        log.push([key,...args]);
        if (key.startsWith('create')) return {addColorStop() {}};
      };
    }});
  }
  class Surface {
    constructor(width,height) { this.width=width;this.height=height;this.calls=[];this.ctx=context(this.calls);surfaces.push(this); }
    getContext() { return this.ctx; }
  }
  const sandbox = {console,Math,OffscreenCanvas:Surface,ctx:context(calls),astraFrame:0,
    player:{hp:50,maxHp:100},canvas:{width:844,height:390},selectedCharacter:'astra'};
  vm.createContext(sandbox);
  for(const filename of ['08-astra-healthbar.js','08-ui.js']) {
    let source=fs.readFileSync(path.join(__dirname,'../js',filename),'utf8');
    if(filename==='08-ui.js') source=source.slice(0,source.indexOf('\nfunction drawHUD('));
    vm.runInContext(source,sandbox);
  }
  return {calls,surfaces,sandbox,run:code=>vm.runInContext(code,sandbox)};
}

test('Astra HP is clipped to exact health on phone and desktop, including zero and full health',()=>{
  const game=healthbar();
  for(const width of [640,844,1920]) for(const hp of [0,1,25,100,130,-3]) {
    game.sandbox.canvas.width=width;game.sandbox.player.hp=hp;game.calls.length=0;
    game.run('drawHealthBar()');
    const barWidth=Math.min(520,width-80),ratio=Math.max(0,Math.min(1,hp/100));
    const clips=game.calls.filter(call=>call[0]==='rect');
    if(ratio===0) assert.equal(clips.length,0);
    else assert.deepEqual(clips[0],['rect',width/2-barWidth/2,18,barWidth*ratio,24]);
    assert.equal(game.sandbox.ctx.globalAlpha,.73);
    assert.equal(game.sandbox.ctx.globalCompositeOperation,'source-over');
    assert.equal(game.calls.filter(call=>call[0]==='fillText').length,1);
    assert.equal(game.calls.filter(call=>call[0]==='strokeText').length,1,'dark text outline protects readability');
  }
});

test('nebula uses two reusable texture surfaces with bounded draw work over time',()=>{
  const game=healthbar(),draws=[];
  for(let frame=0;frame<600;frame+=5) {
    game.sandbox.astraFrame=frame;game.calls.length=0;game.run('drawAstraHealthFlow(10,20,520,24,.85)');
    draws.push(game.calls.filter(call=>call[0]==='drawImage').length);
  }
  assert.equal(game.surfaces.length,2);
  assert.ok(draws.every(count=>count>=3&&count<=6));
  assert.ok(game.surfaces.every(surface=>surface.width===1024&&surface.height===128));
});

test('nebula and stars flow independently, and pause freezes their motion',()=>{
  const game=healthbar();
  const snapshot=()=>{game.calls.length=0;game.run('drawAstraHealthFlow(10,20,520,24,1)');return game.calls.map(call=>[call[0],...call.slice(1).filter(value=>typeof value==='number')]);};
  const before=snapshot();game.sandbox.astraFrame=90;const after=snapshot();
  assert.notDeepEqual(after,before);
  assert.deepEqual(snapshot(),after,'same simulation frame must render the same flow');
});

test('non-Astra health stays red and does not allocate galaxy textures',()=>{
  const game=healthbar();game.sandbox.selectedCharacter='mare';game.run('drawHealthBar()');
  assert.equal(game.surfaces.length,0);
  assert.equal(game.calls.filter(call=>call[0]==='drawImage').length,0);
  assert.equal(game.calls.filter(call=>call[0]==='strokeText').length,0);
});

test('missing canvas texture support retains the colored health fill and animated star flares',()=>{
  const game=healthbar();delete game.sandbox.OffscreenCanvas;
  game.run('drawAstraHealthFlow(10,20,520,24,.5)');
  assert.equal(game.surfaces.length,0);
  assert.equal(game.calls.filter(call=>call[0]==='stroke').length,9);
  assert.ok(game.calls.some(call=>call[0]==='fillRect'&&call[3]===260));
});
