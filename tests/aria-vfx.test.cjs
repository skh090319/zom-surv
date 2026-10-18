const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');

function scene(loaded=true){
  let depth=0,surfaces=0,operations=0,frameGradients=0;
  const images=[],gleams=[],calls={};
  function context(track=false){
    const stack=[],state={globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,lineCap:'butt',shadowBlur:0,lineDashOffset:0};
    let transform=[1,0,0,1,0,0];
    const finite=(key,args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${key} received ${value}`);};
    const point=(x,y)=>({x:transform[0]*x+transform[2]*y+transform[4],y:transform[1]*x+transform[3]*y+transform[5]});
    return new Proxy(state,{
      get(o,key){
        if(key in o)return o[key];
        if(key==='point')return point;
        if(key==='save')return()=>{stack.push({state:{...o},transform:transform.slice()});if(track)depth++;};
        if(key==='restore')return()=>{const saved=stack.pop();assert.ok(saved,'unmatched restore');for(const k of Object.keys(o))delete o[k];Object.assign(o,saved.state);transform=saved.transform;if(track)depth--;};
        if(key==='translate')return(x,y)=>{finite(key,[x,y]);const p=point(x,y);transform[4]=p.x;transform[5]=p.y;};
        if(key==='rotate')return(angle)=>{finite(key,[angle]);const c=Math.cos(angle),s=Math.sin(angle),[a,b,d,e]=transform;transform[0]=a*c+d*s;transform[1]=b*c+e*s;transform[2]=d*c-a*s;transform[3]=e*c-b*s;};
        if(key==='createLinearGradient'||key==='createRadialGradient')return(...args)=>{finite(key,args);if(track)frameGradients++;return{addColorStop(){}};};
        return(...args)=>{finite(key,args);if(track){operations++;calls[key]=(calls[key]||0)+1;if(key==='drawImage')images.push({args,alpha:o.globalAlpha});}if(key==='arc')assert.ok(args[2]>=0,'nonnegative arc radius');};
      },
      set(o,key,value){finite(key,[value]);if(key==='globalAlpha')assert.ok(value>=0&&value<=1,`alpha ${value}`);o[key]=value;return true;}
    });
  }
  const ctx=context(true);
  const c={console,Math,performance:{now:()=>1234},ctx,selectedCharacter:'aria',player:{x:500,y:400,ariaSoilLevel:0},camera:{x:0,y:0},
    getCameraViewWidth:()=>1280,getCameraViewHeight:()=>720,
    Image:class{constructor(){this.complete=loaded;this.naturalWidth=loaded?1024:0;this.naturalHeight=loaded?1536:0;}},
    setGameImageSource:(im,src)=>Object.assign(im,{src}),ensureGameImage:im=>im,
    document:{createElement(){surfaces++;return{getContext:()=>context()};}},
    worldStart(){ctx.save();},worldEnd(){ctx.restore();},gleams};
  vm.createContext(c);const run=s=>vm.runInContext(s,c);
  for(const file of ['04-aria.js','04-aria-polish.js','20-aria-vfx.js'])run(fs.readFileSync(path.join(root,'js',file),'utf8'));
  return{c,images,gleams,calls,run,depth:()=>depth,surfaces:()=>surfaces,operations:()=>operations,gradients:()=>frameGradients};
}
function populate(g){
  g.run(`
    ariaSoils=[1,2,3].map((stage,i)=>({x:500+i*100,y:450,r:62,stage,life:300,maxLife:600,phase:i}));
    ariaJudgments=[{type:'judgment',x:600,y:400,r:230,life:270,maxLife:300,age:30,phase:1}];
    ariaPetalStorm={type:'petalStorm',x:500,y:400,r:180,life:330,maxLife:360,age:30,phase:1};
    ariaWorldTree={type:'worldTree',x:700,y:500,r:520,life:630,maxLife:720,age:90,phase:1.5};
    ariaEffects=['bloom','echoBloom','thorns','judgmentCast','judgmentPulse','judgmentFinal','petalStormCast','petalStormPulse','worldTreeCast','worldTreePulse','worldTreeFinal'].map((type,i)=>({type,x:500+(i%3)*60,y:400+Math.floor(i/3)*40,r:type.startsWith('worldTree')?520:120,life:30,maxLife:60}));
  `);
}

test('Aria skill layers render finite geometry and restore all canvas state',()=>{
  const g=scene();populate(g);g.run('drawAriaRoyalEffects()');
  assert.ok(g.operations()>500);assert.equal(g.depth(),0);assert.equal(g.c.ctx.globalAlpha,1);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');
  assert.equal(g.c.ctx.lineDashOffset,0);assert.equal(g.c.ctx.lineWidth,1);assert.equal(g.gradients(),0);
});

test('Q tip gleams stay around their soil instead of receiving the world origin twice',()=>{
  const g=scene();g.run(`ariaGleam=(x,y,r,a)=>gleams.push(ctx.point(x,y));ariaDrawThorns({x:1000,y:500,r:120,life:20,maxLife:42})`);
  assert.equal(g.gleams.length,10);
  for(const tip of g.gleams){const distance=Math.hypot(tip.x-1000,tip.y-500);assert.ok(distance>=98&&distance<=118,`tip at ${tip.x}, ${tip.y}`);}
  assert.equal(g.depth(),0);
});

test('all birth and expiry frames, including the world-tree finale, remain safe',()=>{
  const g=scene();populate(g);
  for(const fraction of [0,.001,.05,.5,.99,1]){
    g.c.fraction=fraction;
    g.run(`for(const e of [...ariaEffects,...ariaJudgments,ariaPetalStorm,ariaWorldTree]){e.life=e.maxLife*(1-fraction);e.age=e.maxLife*fraction;}drawAriaRoyalEffects()`);
    assert.equal(g.depth(),0);
  }
});

test('spell textures are cached and rendering never changes live combat state',()=>{
  for(const loaded of [true,false]){
  const g=scene(loaded);populate(g);const snapshot='JSON.stringify([ariaSoils,ariaJudgments,ariaPetalStorm,ariaWorldTree,ariaEffects])';
  const before=g.run(snapshot);g.run('drawAriaRoyalEffects()');assert.equal(g.surfaces(),loaded?1:2);
  g.run('for(let frame=0;frame<30;frame++)drawAriaRoyalEffects()');
  assert.equal(g.surfaces(),loaded?1:2);assert.equal(g.run(snapshot),before);assert.equal(g.gradients(),0);assert.equal(g.depth(),0);
  }
});

test('generated thorn, bloom and petal textures are all used in their actual skill paths',()=>{
  const g=scene();populate(g);g.run('drawAriaRoyalEffects()');
  for(const kind of ['thorn','bloom','petal'])assert.ok(g.images.some(call=>call.args[0]===g.run(`ariaSpellArt.${kind}`)),kind+' sprite missing');
});

test('offscreen gardens and spell fields do not build textures or draw geometry',()=>{
  const g=scene();populate(g);
  g.run(`ariaPetalStorm=null;for(const e of [...ariaSoils,...ariaEffects,...ariaJudgments,ariaWorldTree]){e.x=5000;e.y=5000;}drawAriaRoyalEffects()`);
  assert.equal(g.surfaces(),0);assert.equal(g.images.length,0);assert.equal(g.depth(),0);
});

test('world tree keeps its sigil and rising petals visible before its artwork loads',()=>{
  const g=scene(false);g.run(`ariaWorldTree={x:600,y:500,r:520,age:90,life:630,maxLife:720,phase:1.5};drawAriaRoyalEffects()`);
  assert.ok(g.calls.fill>=36,'rising petals remain visible');assert.ok(g.images.length>0,'the ground sigil remains visible');
  assert.ok(g.images.every(call=>call.args[0]!==g.run('ariaWorldTreeImage')));assert.equal(g.depth(),0);
});

test('other characters skip Aria effects and texture creation',()=>{
  const g=scene();populate(g);g.c.selectedCharacter='mare';g.run('drawAriaRoyalEffects()');
  assert.equal(g.surfaces(),0);assert.equal(g.operations(),0);assert.equal(g.depth(),0);
});
