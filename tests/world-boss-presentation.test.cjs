const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
function scene(){
  const calls=[],c={Math,console,Image:class{constructor(){this.complete=true;this.naturalWidth=640;this.naturalHeight=640;}},selectedWorld:2,selectedCharacter:'ren',selectedDifficulty:'easy',screenMode:'game',canvas:{width:1280,height:720},camera:{x:0,y:0},zombies:[],player:{x:0,y:0},mouse:{x:0,y:0},
    getCameraViewWidth:()=>1280,getCameraViewHeight:()=>720,worldStart(){},worldEnd(){},drawAugmentGuide(){},drawMonsterGuide(){},drawRoundedRect(){},wrapTextLeft(){},pointInRect:()=>false,performance:{now:()=>1000}};
  c.ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:text=>({width:text.length*8})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  vm.createContext(c);const run=code=>vm.runInContext(code,c);
  for(const file of ['js/00-assets.js','js/04-world-monsters.js','js/04-bosses.js','js/04-world-bosses.js','js/07-world-monsters-render.js','js/07-world-bosses-render.js','js/08-guide.js'])run(read(file));
  const boss=(world,index)=>{c.selectedWorld=world;return run(`activeRaidBoss={isWorldRaidBoss:true,isRaidBoss:true,worldRaidWorld:${world},worldRaidType:getWorldRaidBossDefinition(${index},${world}).id,raidIndex:${index},hp:400,maxHp:1000,r:70,x:400,y:280,facing:1,worldRaidAge:30,worldRaidState:'windup',worldRaidLinks:[]}`);};
  return{c,run,calls,boss};
}

test('nine raid guide entries preserve the world-2 trio and put the abyss eye last',()=>{
  const s=scene(),entries=Array.from(s.run('getWorldRaidBossGuideEntries()'));
  assert.equal(entries.length,9);
  assert.deepEqual(entries.map(entry=>entry.guideWorld),[1,1,1,2,2,2,3,3,3]);
  assert.deepEqual(entries.slice(0,3).map(entry=>entry.worldBossType),['iron-hauler','glass-thrower','alarm-infected']);
  assert.deepEqual(entries.slice(3,6).map(entry=>entry.name),['아마란스','모르스','녹스']);
  assert.deepEqual(entries.slice(6).map(entry=>entry.worldBossType),['rift-hunter','stitcher','abyss-eye']);
  assert.ok(entries.every(entry=>entry.tips.length>0&&entry.desc));
});

test('new boss sprite reuses the correct species art at a distinctly larger scale',()=>{
  const s=scene();
  for(const world of [1,3])for(let index=0;index<3;index++){
    const boss=s.boss(world,index);s.calls.length=0;assert.equal(s.run('drawWorldRaidBoss(activeRaidBoss)'),true);
    const image=s.calls.find(call=>call[0]==='drawImage');assert.ok(image);assert.ok(image[4]>=274);
    assert.equal(image[1].assetSource,`assets/${world===1?'world-bosses-v1':'world-monsters-v1'}/${boss.worldRaidType}.webp`);
    assert.ok(s.calls.filter(call=>call[0]==='ellipse').length>=10,'segmented encounter insignia stays under the feet');
  }
});

test('world-1 boss portraits stay separate from chibi enemies and only selected-world art prewarms',()=>{
  const s=scene();s.c.screenMode='home';s.c.selectedWorld=1;s.run('prepareGameImages()');
  assert.equal(s.run('worldBossImages.size'),3);assert.equal(s.run('worldMonsterImages.size'),5);
  assert.equal(s.run("getWorldBossImage('iron-hauler',1).assetGroup"),'world-boss-1');
  assert.notEqual(s.run("getWorldBossImage('iron-hauler',1)"),s.run("getWorldMonsterImage('iron-hauler')"));
  assert.equal(s.run("getWorldBossImage('abyss-eye',3)"),s.run("getWorldMonsterImage('abyss-eye')"));
  assert.equal(s.run("getWorldBossImage('iron-hauler',2)"),null);
  const fresh=scene();fresh.c.screenMode='home';fresh.c.selectedWorld=2;fresh.run('prepareGameImages()');
  assert.equal(fresh.run('worldBossImages.size'),0);assert.equal(fresh.run('worldMonsterImages.size'),0);
});

test('original world-2 boss drawing and UI are left to the existing renderer',()=>{
  const s=scene();s.run('activeRaidBoss={isRaidBoss:true,raidIndex:1,x:400,y:280,hp:10,maxHp:10}');
  assert.equal(s.run('drawWorldRaidBoss(activeRaidBoss)'),false);assert.equal(s.run('drawWorldRaidArena()'),false);assert.equal(s.run('drawWorldRaidUI(false)'),false);
  assert.equal(s.calls.length,0);
  s.run('activeRaidBoss=null;nextRaidBossIndex=2');assert.equal(s.run('drawWorldRaidUI(true)'),false);assert.equal(s.calls.length,0);
});

test('every new boss uses its own name in desktop/mobile health bars and intro warnings',()=>{
  const s=scene();for(const world of [1,3])for(let index=0;index<3;index++)for(const mobile of [false,true]){
    s.boss(world,index);s.run('raidIntroTime=100');s.calls.length=0;
    assert.equal(s.run(`drawWorldRaidUI(${mobile})`),true);
    const name=s.run('getWorldRaidBossDefinition(activeRaidBoss.raidIndex,activeRaidBoss.worldRaidWorld).name');
    const labels=s.calls.filter(call=>call[0]==='fillText').map(call=>call[1]);
    assert.ok(labels.includes(name));assert.ok(labels.includes(`주의 · ${name} 등장`));
    assert.equal(labels.some(label=>/아마란스|모르스|녹스/.test(label)),false);
  }
});

test('upcoming world-3 final warning names the eye and mobile intro stays in a compact top strip',()=>{
  const s=scene();s.c.selectedWorld=3;s.c.canvas={width:568,height:320};
  s.run('nextRaidBossIndex=2;survivalFrames=RAID_BOSS_TIMES[2]-180;drawWorldRaidUI(true)');
  assert.ok(s.calls.some(call=>call[0]==='fillText'&&call[1].includes('심연의 관측안')));
  s.boss(3,2);s.run('raidIntroTime=100');s.calls.length=0;s.run('drawWorldRaidUI(true)');
  const rects=s.calls.filter(call=>call[0]==='fillRect');assert.ok(rects.length>0);
  for(const rect of rects){assert.ok(rect[3]<568*.65);assert.ok(rect[2]+rect[4]<=107);}
});

test('new boss summons use world species imagery while old reaper clones retain their old path',()=>{
  const s=scene();s.c.minion={x:100,y:100,r:23,isBossMinion:true,worldRaidMinion:true,worldRaidMinionType:'hollow-husk'};
  assert.equal(s.run('drawWorldMonsterSprite(minion,99,42)'),true);
  assert.ok(s.calls.some(call=>call[0]==='drawImage'&&call[1].assetSource.endsWith('hollow-husk.webp')));
  s.calls.length=0;s.c.minion={x:100,y:100,r:23,isBossMinion:true};assert.equal(s.run('drawWorldMonsterSprite(minion,99,42)'),false);assert.equal(s.calls.length,0);
});

test('boss cone, charge and eye telegraphs use actual collision dimensions and full sweep',()=>{
  const s=scene();s.run(`worldRaidZones.push(
    {type:'cone',x:100,y:100,angle:0,r:300,arc:1.55,delay:36,maxDelay:72,color:'#d9b765'},
    {type:'charge',x:100,y:100,angle:0,width:110,length:480,delay:36,maxDelay:72,color:'#d9b765'},
    {type:'beam',x:400,y:200,angle:-.475,width:22,length:760,arc:.95,delay:45,maxDelay:90,color:'#da98ff'});drawWorldRaidZones()`);
  assert.ok(s.calls.some(call=>call[0]==='arc'&&call[3]===300&&call[4]===-1.55/2&&call[5]===1.55/2));
  assert.ok(s.calls.some(call=>call[0]==='rect'&&call[1]===0&&call[2]===-55&&call[3]===480&&call[4]===110));
  assert.ok(s.calls.some(call=>call[0]==='arc'&&call[3]===760&&call[4]===0&&call[5]===.95));
  assert.ok(s.calls.some(call=>call[0]==='rotate'&&call[1]===-.475));
});
