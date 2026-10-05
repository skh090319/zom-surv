const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/11-lush-vfx.js'),'utf8');
function scene({loaded=true}={}){
  let depth=0,canvases=0,calls=0,playerDraws=0;
  const gradient={addColorStop(){}};
  function fakeContext(track=false){return new Proxy({},{get(target,key){if(key in target)return target[key];if(key==='save')return()=>{if(track)depth++;};if(key==='restore')return()=>{if(track)assert.ok(--depth>=0,'unmatched restore');};if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;return(...args)=>{calls++;for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),`${key} received ${n}`);};},set(target,key,value){if(typeof value==='number')assert.ok(Number.isFinite(value),`${key} received ${value}`);target[key]=value;return true;}});}
  const image=()=>({complete:loaded,naturalWidth:loaded?512:0,naturalHeight:512});
  const ctx=fakeContext(true),state={frame:100,totalAssets:800,realm:1,cards:[],dice:[],effects:[],hazards:[],finishers:[],chipStorms:[],shield:30};
  const c={console,Math,ctx,selectedCharacter:'lush',lushState:state,player:{x:500,y:500},camera:{x:0,y:0},canvas:{width:1280,height:760},zombies:[],lushArt:{body:image(),vfx:Object.fromEntries(['card','die','shatter','dealer','burst','sigil'].map(k=>[k,image()]))},Image:class{},document:{createElement(){canvases++;return{getContext:()=>fakeContext()};}},setGameImageSource:im=>im,ensureGameImage:im=>im,lushAim:()=>0,lushGlow(){},lushDiamond(){},getWorldViewScale:()=>1,worldStart(){ctx.save();},worldEnd(){ctx.restore();},drawLushPlayer(){playerDraws++;},drawLushRealm(){}};
  vm.createContext(c);vm.runInContext(source,c);return{c,state,run:s=>vm.runInContext(s,c),depth:()=>depth,canvases:()=>canvases,calls:()=>calls,playerDraws:()=>playerDraws};
}
function populate(g){
  const s=g.state;s.ultimate={age:100,dealers:Array.from({length:4},(_,i)=>({x:450+i*50,y:400+i%2*150,a:0,phase:i})),reels:[7,7],force777:true};
  s.cards=['basic','ace','royal','dealer','finisher'].map((kind,i)=>({kind,x:600+i*20,y:500,a:.1,rank:i,suit:i%4,trail:[{x:570,y:500},{x:590,y:500}]}));
  s.dice=[{x:620,y:400,a:0,travel:250,range:500,age:24,eye:4},{x:530,y:570,a:1,travel:500,range:500,age:58,eye:6,golden:true,giant:true}];
  s.chipStorms=[{x:500,y:500,age:20,life:72,radius:360}];s.finishers=[{type:'die',x:700,y:450,age:-8,delay:30,radius:220}];s.hazards=[{x:400,y:500,age:35,r:100}];
  s.effects=['hit','ace','dealerVolley','royalCast','royalMark','wager','cast','assetTier','pulse','cash','chipStorm','win','reel','jackpot','house','six','cascade','royalDetonate','finishFracture','loss','giantDrop'].map((type,i)=>({type,x:500+(i%4)*35,y:400+Math.floor(i/4)*30,r:100+(i%3)*50,age:10,maxLife:60,seed:1,rank:i%5,count:3}));
  g.c.zombies=[{x:750,y:500,r:18,hp:100,lushMarks:4}];
}
test('all LusH prestige effects render finite geometry and balance canvas state',()=>{const g=scene();populate(g);g.run('drawLushEffects();drawLushPlayer();drawLushRealm()');assert.equal(g.depth(),0);assert.equal(g.playerDraws(),1);assert.ok(g.calls()>100);});
test('image-loading fallback covers every spell without throwing or suppressing geometry',()=>{const g=scene({loaded:false});populate(g);g.run('drawLushEffects();drawLushPlayer();drawLushRealm()');assert.equal(g.depth(),0);assert.ok(g.canvases()>10);});
test('rendering is read-only and reusable canvases are not reallocated per frame',()=>{const g=scene();populate(g);const before=JSON.stringify(g.state);g.run('drawLushEffects();drawLushPlayer();drawLushRealm()');const warm=g.canvases();g.run('for(let i=0;i<20;i++){drawLushEffects();drawLushPlayer();drawLushRealm();}');assert.equal(g.canvases(),warm);assert.equal(JSON.stringify(g.state),before);assert.equal(g.depth(),0);});
test('incoming giant dice, outgoing chips and finale fades remain valid at boundaries',()=>{const g=scene();populate(g);for(const age of [0,1,30,59,60,72,90,120]){g.state.chipStorms[0].age=age;g.state.ultimate.resolved=true;g.state.ultimate.finaleAge=age;for(const e of g.state.effects)e.age=age;g.state.finishers[0].age=age-30;g.run('drawLushEffects()');assert.equal(g.depth(),0);}});
test('other heroes do not render LusH world effects or load its textures',()=>{const g=scene();populate(g);g.c.selectedCharacter='astra';g.run('drawLushEffects()');assert.equal(g.canvases(),0);assert.equal(g.calls(),0);assert.equal(g.depth(),0);});
test('dense glass fragments are batched without dropping their silhouettes',()=>{const g=scene();let fills=0,strokes=0,polygons=0;g.c.ctx.fill=()=>fills++;g.c.ctx.stroke=()=>strokes++;g.c.ctx.closePath=()=>polygons++;g.run('lushVfxShards(100,100,300,20,60,12,true,false)');assert.equal(polygons,32);assert.equal(fills,2);assert.equal(strokes,4);assert.equal(g.depth(),0);});
