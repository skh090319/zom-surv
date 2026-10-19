const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

function scene(){
  const calls=[],stack=[],state={globalAlpha:1,lineWidth:1,shadowBlur:0};
  const context={Math:Object.create(Math),console,activeRaidBoss:null,selectedWorld:1,player:{x:720,y:420,r:20},WORLD:{width:2400,height:1800},
    RAID_BOSS_BALANCE:{easy:{hp:[37500,150000,600000]}},worldStart(){},worldEnd(){},getWorldBossImage:()=>null};
  context.Math.random=()=>{throw new Error('Rendering must not consume combat RNG');};
  const methods=['beginPath','closePath','moveTo','lineTo','quadraticCurveTo','arc','ellipse','rect','fillRect','strokeRect','fill','stroke','translate','rotate','scale','setLineDash','drawImage','fillText'];
  const api={save(){stack.push({...state});},restore(){assert.ok(stack.length,'unbalanced canvas restore');Object.assign(state,stack.pop());},
    createLinearGradient(...args){checkNumbers(args);return {addColorStop(){}};},createRadialGradient(...args){checkNumbers(args);return {addColorStop(){}};}};
  function checkNumbers(args){for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`invalid canvas coordinate ${value}`);}
  for(const method of methods)api[method]=(...args)=>{checkNumbers(args);if(method==='arc')assert.ok(args[2]>=0);if(method==='ellipse')assert.ok(args[2]>=0&&args[3]>=0);calls.push({method,args,state:{...state}});};
  context.ctx=new Proxy(api,{get:(object,key)=>key in object?object[key]:state[key],set:(object,key,value)=>{state[key]=value;return true;}});
  vm.createContext(context);const run=code=>vm.runInContext(code,context);
  run(read('js/04-world-bosses.js'));run(read('js/07-world-bosses-render.js'));
  function boss(world,index){context.selectedWorld=world;run(`activeRaidBoss={raidIndex:${index},hp:1000,x:400,y:300,r:64,worldRaidAge:60,facing:1};initializeWorldRaidBoss(activeRaidBoss);activeRaidBoss.patternTime=35`);return context.activeRaidBoss;}
  return {context,calls,state,stack,run,boss};
}

test('all six boss patterns render warning, activation and late phases with finite geometry and no state mutations',()=>{
  const s=scene();
  for(const world of [1,3])for(let index=0;index<3;index++)for(const pattern of [0,1]){
    s.boss(world,index);s.run(`startWorldRaidPattern(activeRaidBoss,${pattern})`);
    for(const phase of ['early','late','start','active']){
      s.run(`for(const zone of worldRaidZones){zone.delay=${phase==='early'?'zone.maxDelay':phase==='late'?'1':phase==='start'?'0':'-20'};zone.age=zone.maxDelay-zone.delay;if(zone.type==='ring'&&zone.delay<=0)zone.r=220;if(zone.type==='shockwave'&&zone.delay<=0)zone.r=phaseRadius;zone.travel=170;}`.replace('phaseRadius',phase==='start'?'380':'500'));
      s.run(`activeRaidBoss.worldRaidState=${JSON.stringify(phase==='early'||phase==='late'?'windup':'active')}`);
      const before=s.run('JSON.stringify({boss:activeRaidBoss,zones:worldRaidZones})');s.calls.length=0;
      assert.doesNotThrow(()=>s.run('drawWorldRaidZones();drawWorldRaidBoss(activeRaidBoss);drawWorldRaidEffects()'),`${world}/${index}/${pattern}/${phase}`);
      assert.equal(s.run('JSON.stringify({boss:activeRaidBoss,zones:worldRaidZones})'),before);
      assert.equal(s.stack.length,0);assert.ok(s.calls.length<2200,'bounded per-encounter drawing');
    }
  }
});

test('Rift wave telegraph is the separate 380–620 annular sector, and active band follows exact combat radii',()=>{
  const s=scene();s.boss(3,0);s.run('startWorldRaidPattern(activeRaidBoss,1)');
  s.calls.length=0;s.run("worldRaidZonePath(worldRaidZones.find(z=>z.type==='shockwave'))");
  let arcs=s.calls.filter(c=>c.method==='arc');
  assert.deepEqual(arcs.map(c=>c.args[2]),[620,380]);assert.equal(arcs[0].args[3],-.9);assert.equal(arcs[0].args[4],.9);assert.equal(arcs[1].args[5],true);
  s.calls.length=0;s.run("Object.assign(worldRaidZones.find(z=>z.type==='shockwave'),{delay:-20,r:500});worldRaidZonePath(worldRaidZones.find(z=>z.type==='shockwave'))");
  arcs=s.calls.filter(c=>c.method==='arc');assert.deepEqual(arcs.map(c=>c.args[2]),[500,468]);
  s.calls.length=0;s.run("Object.assign(worldRaidZones.find(z=>z.type==='shockwave'),{r:386});worldRaidZonePath(worldRaidZones.find(z=>z.type==='shockwave'))");
  assert.deepEqual(s.calls.filter(c=>c.method==='arc').map(c=>c.args[2]),[386,380]);
});

test('beam and sound-wave drawings preserve the actual damage width; orb volleys do not draw a damaging ring',()=>{
  const s=scene();s.boss(3,2);s.run("worldRaidZones.push({owner:activeRaidBoss,type:'beam',x:0,y:0,angle:0,length:760,width:22,delay:0,maxDelay:90,age:100,arc:.95,color:'#da98ff'})");
  s.run('drawWorldRaidZones()');assert.ok(s.calls.some(c=>c.method==='fillRect'&&c.args[0]===0&&c.args[1]===-11&&c.args[2]===760&&c.args[3]===22));
  s.calls.length=0;s.run("worldRaidZones.length=0;worldRaidZones.push({type:'ring',x:0,y:0,r:220,maxR:520,width:18,delay:0,color:'#ef746d'});drawWorldRaidZones()");
  assert.ok(s.calls.some(c=>c.method==='stroke'&&c.state.lineWidth===18));
  s.calls.length=0;s.run("worldRaidZones[0].action='orbVolley';worldRaidZones[0].width=0;drawWorldRaidZones()");
  assert.equal(s.calls.some(c=>c.method==='arc'&&c.args[2]===220),false);
});

test('glass shards, iris orbs, teleport and broken thread effects restore canvas and keep finite geometry at lifetime edges',()=>{
  const s=scene();s.boss(3,1);s.run(`activeRaidBoss.worldRaidLinks=[{x:600,y:450,hp:100}];
    for(const type of ['glass','orb'])worldRaidProjectiles.push({type,x:500,y:400,vx:5,vy:-2,r:12,spin:4,color:'#80e5c3',astraAbsorb:{age:40}});
    for(const type of ['teleport','linkBreak','summon','impact'])for(const life of [0,1,30])worldRaidEffects.push({type,x:400,y:300,r:380,color:'#bd8af3',life,maxLife:30});`);
  s.run('drawWorldRaidProjectiles();drawWorldRaidEffects()');
  assert.equal(s.stack.length,0);assert.equal(s.state.globalAlpha,1);assert.equal(s.state.shadowBlur,0);
  assert.ok(s.calls.some(c=>c.method==='quadraticCurveTo'));assert.ok(s.calls.some(c=>c.method==='ellipse'));
  assert.equal(s.calls.some(c=>c.method==='arc'&&c.args[2]>100),false,'impact accents do not suggest a larger circular hitbox');
});

test('many Rift teleport bonuses add at most eight cosmetic streaks and never alter the permanent stack count',()=>{
  const s=scene(),boss=s.boss(3,0);boss.worldRaidState='move';boss.worldRaidTeleportCount=500;
  s.run('drawWorldRaidCastFocus(activeRaidBoss,worldRaidRenderDefinition(activeRaidBoss))');
  assert.equal(s.calls.filter(c=>c.method==='arc').length,8);assert.equal(boss.worldRaidTeleportCount,500);assert.equal(s.stack.length,0);
});
