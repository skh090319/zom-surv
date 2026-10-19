const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');

function scene(loaded=true){
  let depth=0,surfaces=0,gradients=0;const calls=[];
  function context(track=false){
    const state={globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,lineCap:'butt'},stack=[];
    const finite=(name,values)=>{for(const value of values)if(typeof value==='number')assert.ok(Number.isFinite(value),`${name}: ${value}`);};
    return new Proxy(state,{
      get(o,key){
        if(key in o)return o[key];
        if(key==='save')return()=>{stack.push({...o});if(track)depth++;};
        if(key==='restore')return()=>{assert.ok(stack.length);const saved=stack.pop();for(const k of Object.keys(o))delete o[k];Object.assign(o,saved);if(track)depth--;};
        if(key==='createLinearGradient'||key==='createRadialGradient')return(...args)=>{finite(key,args);if(track)gradients++;return{addColorStop(){}};};
        return(...args)=>{finite(key,args);if(track)calls.push({key,args,alpha:o.globalAlpha});};
      },
      set(o,key,value){finite(key,[value]);if(key==='globalAlpha')assert.ok(value>=0&&value<=1);o[key]=value;return true;}
    });
  }
  const ctx=context(true),c={console,Math,ctx,camera:{x:0,y:0},getCameraViewWidth:()=>1280,getCameraViewHeight:()=>720,
    Image:class{constructor(){this.complete=loaded;this.naturalWidth=loaded?512:0;this.naturalHeight=loaded?512:0;}},
    setGameImageSource:(im,src)=>Object.assign(im,{src}),ensureGameImage:()=>{},document:{createElement(){surfaces++;return{getContext:()=>context()};}},
    ariaPetal(x,y,size,angle,alpha){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.ellipse(0,0,size*.4,size,0,0,Math.PI*2);ctx.fill();ctx.restore();}};
  vm.createContext(c);const run=s=>vm.runInContext(s,c);run(fs.readFileSync(path.join(root,'js/20-aria-vfx.js'),'utf8'));
  return{c,run,calls,depth:()=>depth,surfaces:()=>surfaces,gradients:()=>gradients};
}
const lance={x:200,y:300,angle:.3,length:780,width:48,life:24,maxLife:36};
const impact={x:600,y:320,angle:.3,r:40,phase:1.2,life:24,maxLife:30};

test('Q spear stays inside the real forward segment at every animation frame',()=>{
  const g=scene();g.c.effect={...lance};
  for(let age=0;age<=36;age++){
    g.c.effect.life=36-age;const state=g.run('ariaQLanceState(effect)');
    if(state){assert.ok(state.head>=0&&state.head<=780);assert.ok(state.tail>=0&&state.tail<=state.head);}
    g.run('ariaDrawLance(effect)');assert.equal(g.depth(),0);
  }
  const bounds=g.calls.filter(c=>c.key==='rect');assert.ok(bounds.length>25);
  for(const call of bounds)assert.deepEqual(call.args,[0,-57.599999999999994,780,115.19999999999999]);
  assert.equal(g.calls.filter(c=>c.key==='clip').length,bounds.length);
  assert.ok(g.calls.some(c=>c.key==='drawImage'&&c.args[0]===g.run('ariaSpellArt.thorn')));
  assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');assert.equal(g.gradients(),0);
});

test('Q launch unfurls rapidly and tail dissolves without visual range overshoot',()=>{
  const g=scene();g.c.effect={...lance,life:36};assert.equal(g.run('ariaQLanceState(effect).head'),0);
  g.c.effect.life=32;const growing=g.run('ariaQLanceState(effect).head');assert.ok(growing>0&&growing<780);
  g.c.effect.life=28;assert.equal(g.run('ariaQLanceState(effect).head'),780);assert.equal(g.run('ariaQLanceState(effect).tail'),0);
  g.c.effect.life=6;assert.ok(g.run('ariaQLanceState(effect).tail')>500);
  const n=g.calls.length;g.c.effect.life=0;g.run('ariaDrawLance(effect)');assert.equal(g.calls.length,n);
});

test('an offscreen cast remains visible when its Q segment crosses the screen',()=>{
  const g=scene();g.c.effect={...lance,x:-400,y:300,angle:0,length:900};g.run('ariaDrawLance(effect)');assert.ok(g.calls.length>100);
  const before=g.calls.length;g.c.effect.x=-3000;g.run('ariaDrawLance(effect)');assert.equal(g.calls.length,before);
  assert.equal(g.depth(),0);
});

test('Q geometry is finite and balanced for missing art, tiny ranges, and invalid events',()=>{
  for(const loaded of [true,false]){
    const g=scene(loaded);
    for(const length of [.1,2,30,780,3000])for(const width of [0,6,48,Infinity])for(const life of [35.999,20,1,.001]){
      g.c.effect={...lance,length,width,life};g.run('ariaDrawLance(effect)');assert.equal(g.depth(),0);
    }
    for(const bad of [{life:0},{life:NaN},{life:Infinity},{maxLife:0},{maxLife:Infinity},{x:Infinity},{y:NaN},{length:0},{length:-2}]){
      g.c.effect={...lance,...bad};const n=g.calls.length;g.run('ariaDrawLance(effect)');assert.equal(g.calls.length,n);
    }
    for(const life of [30,29.99,15,.001,0]){g.c.effect={...impact,life};g.run('ariaDrawThornImpact(effect)');assert.equal(g.depth(),0);}
    assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.gradients(),0);
  }
});

test('Q hit petals and crown use frozen simulation time and bounded cached art',()=>{
  for(const loaded of [true,false]){
    const g=scene(loaded);g.c.lance={...lance};g.c.impact={...impact};const before=JSON.stringify([g.c.lance,g.c.impact]);
    g.run('ariaDrawLance(lance);ariaDrawThornImpact(impact)');const first=g.calls.slice(),surfaces=g.surfaces();assert.ok(first.length>100&&first.length<1000);
    g.run('ariaDrawLance(lance);ariaDrawThornImpact(impact)');assert.deepEqual(g.calls.slice(first.length),first);
    for(let i=0;i<20;i++)g.run('ariaDrawLance(lance);ariaDrawThornImpact(impact)');
    assert.equal(g.surfaces(),surfaces);assert.ok(surfaces<=1);assert.equal(g.gradients(),0);assert.equal(g.depth(),0);assert.equal(JSON.stringify([g.c.lance,g.c.impact]),before);
  }
});

test('expired or offscreen hit events cannot allocate or draw',()=>{
  const g=scene(false);
  for(const patch of [{x:5000},{life:0},{maxLife:0},{life:Infinity},{maxLife:Infinity},{x:NaN}]){
    g.c.effect={...impact,...patch};g.run('ariaDrawThornImpact(effect)');
  }
  assert.equal(g.calls.length,0);assert.equal(g.surfaces(),0);assert.equal(g.depth(),0);
});

test('actual-hit effect has its own dispatch instead of an oversized generic bloom',()=>{
  const source=fs.readFileSync(path.join(root,'js/20-aria-vfx.js'),'utf8');
  assert.match(source,/e\.type==='thornImpact'\)\{ariaDrawThornImpact\(e\);continue;/);
  assert.doesNotMatch(source,/ariaGleam\(head\+18/);
});
