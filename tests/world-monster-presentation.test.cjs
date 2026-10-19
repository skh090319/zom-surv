const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
function fixture(){
  const calls=[],c={console,Math,Image:class{constructor(){this.complete=false;this.naturalWidth=0;}},screenMode:'home',selectedCharacter:'ren',selectedWorld:2,
    camera:{x:0,y:0},getCameraViewWidth:()=>1000,getCameraViewHeight:()=>600,zombies:[],canvas:{width:1280,height:720},mouse:{x:0,y:0},performance:{now:()=>1000},
    drawAugmentGuide(){},drawMonsterGuide(){},drawRoundedRect(){},wrapTextLeft(){},pointInRect:()=>false};
  c.ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:text=>({width:text.length*8})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  vm.createContext(c);
  const run=code=>vm.runInContext(code,c);
  run(read('js/00-assets.js'));run(read('js/04-world-monsters.js'));run(read('js/07-world-monsters-render.js'));run(read('js/08-guide.js'));
  return{c,calls,run};
}

test('all ten illustrations have distinct world-scoped lazy registrations',()=>{
  const f=fixture(),definitions=f.run('Object.values(WORLD_MONSTER_TYPES)');assert.equal(definitions.length,10);
  for(const definition of definitions){
    const image=f.run(`getWorldMonsterImage('${definition.id}')`);
    assert.equal(image.assetSource,`assets/world-monsters-v1/${definition.id}.webp`);
    assert.equal(image.assetGroup,`world-monster-${definition.world}`);
    assert.equal(image.decoding,'async');assert.equal(image.assetRequested,true);
    assert.equal(f.run(`getWorldMonsterImage('${definition.id}')`),image);
  }
  assert.equal(f.run("getWorldMonsterImage('not-a-species')"),null);
  assert.equal(f.run('worldMonsterImages.size'),10);
});

test('world 2 requests none, selected worlds 1 and 3 each prewarm only their own five',()=>{
  for(const world of [1,2,3]){
    const f=fixture();f.c.selectedWorld=world;f.run('prepareGameImages()');
    assert.equal(f.run('worldMonsterImages.size'),world===2?0:5);
    assert.equal(f.run(`gameImageRegistry.every(image=>image.assetGroup==='world-monster-${world}')`),true);
    const count=f.run('gameImageRegistry.length');f.run('prepareGameImages()');assert.equal(f.run('gameImageRegistry.length'),count);
  }
});

test('guide navigation does not eagerly fetch the ten offscreen images',()=>{
  const f=fixture();f.c.screenMode='guide';f.run("guidePage='monsters';prepareGameImages()");
  assert.equal(f.run('worldMonsterImages.size'),0);
  f.run("getWorldMonsterImage('hollow-husk')");assert.equal(f.run('worldMonsterImages.size'),1);
});

test('world-2, raids and boss-minion renderers are never replaced by world sprites',()=>{
  const f=fixture();
  for(const enemy of [{x:100,y:100,r:21},{x:100,y:100,r:80,isRaidBoss:true,worldMonsterType:'abyss-eye'},{x:100,y:100,r:12,isBossMinion:true,worldMonsterType:'hollow-husk'}]){
    f.c.enemy=enemy;assert.equal(f.run('drawWorldMonsterSprite(enemy,64,64)'),false);
  }
  assert.equal(f.calls.length,0);
  const source=read('js/07-world-render.js');
  assert.match(source,/else if \(z\.isBossMinion && raidBossImages\[1\]/);
  assert.match(source,/else if \(zombieSpriteAtlasLoaded/);
  assert.match(source,/const sourceX = z\.boss \? sourceW : 0/);
});

test('world sprites preserve upright aspect ratio, softly bob and flip horizontally only',()=>{
  const f=fixture();f.run("Object.assign(getWorldMonsterImage('street-walker'),{complete:true,naturalWidth:640,naturalHeight:640})");
  f.c.enemy={x:100,y:100,r:21,worldMonsterType:'street-walker',worldMonsterFacing:Math.PI,worldMonsterAge:45};
  assert.equal(f.run('drawWorldMonsterSprite(enemy,64,60)'),true);
  assert.ok(f.calls.some(call=>call[0]==='scale'&&call[1]===-1&&call[2]===1));
  assert.ok(f.calls.filter(call=>call[0]==='rotate').every(call=>Math.abs(call[1])<.06));
  const draw=f.calls.find(call=>call[0]==='drawImage');assert.equal(draw[4],64);assert.equal(draw[5],64);
});

test('telegraphs cover actual glass trajectories and eye sweep while staying world-space',()=>{
  const f=fixture();f.c.selectedWorld=1;
  f.c.zombies=[{x:100,y:100,r:21,hp:100,worldMonsterType:'glass-thrower',worldMonsterState:'windup',worldMonsterTimer:24,worldMonsterMaxTimer:48,worldMonsterAim:0},
    {x:500,y:200,r:24,hp:100,worldMonsterType:'abyss-eye',worldMonsterState:'windup',worldMonsterTimer:45,worldMonsterMaxTimer:90,worldMonsterAim:0}];
  f.run('drawWorldMonsterEffects()');
  assert.ok(f.calls.some(call=>call[0]==='arc'&&call[3]===5.8*110&&call[4]===-.23&&call[5]===.23));
  assert.ok(f.calls.some(call=>call[0]==='arc'&&call[3]===480&&call[4]===-.32&&call[5]===.32));
  assert.equal(f.calls.some(call=>call[0]==='fillRect'),false,'no fullscreen warning overlay');
});

test('guide groups the ten new species separately and leaves all original boss entries intact',()=>{
  const f=fixture(),sections=f.run('getWorldMonsterGuideSections()');
  assert.deepEqual(Array.from(sections,section=>section.world),[1,2,3]);
  assert.deepEqual(Array.from(sections,section=>section.entries.length),[5,3,5]);
  assert.equal(f.run("monsterGuideEntries.filter(entry=>entry.tag.startsWith('BOSS 0')).map(entry=>entry.name).join(',')"),'아마란스,모르스,녹스');
});

test('world guide cards remain within phone, tablet and desktop widths without overlapping rows',()=>{
  const f=fixture();for(const width of [320,390,568,844,1024,1280,1920]){
    const layout=f.run(`getWorldMonsterGuideLayout(${width},110)`);let bottom=0;
    for(const section of layout.sections){
      assert.ok(section.headerY>bottom);const cards=Array.from(section.cards);
      for(const card of cards){assert.ok(card.x>=23.9);assert.ok(card.x+card.w<=width-23.9);assert.ok(card.y>section.headerY);assert.ok(card.w>=220);}
      bottom=Math.max(...cards.map(card=>card.y+card.h));
    }
    assert.ok(layout.bottom>bottom);
  }
});

test('legacy world-2 archive keeps its original phone breakpoint and bounds long survival tips',()=>{
  const f=fixture();
  for(const width of [520,568,667,719]){
    const cards=Array.from(f.run(`getWorldMonsterGuideLayout(${width},110).sections.find(section=>section.world===2).cards`));
    assert.equal(new Set(cards.map(card=>card.x)).size,1,'landscape phones retain one comfortable legacy column');
    assert.equal(cards[0].w,350);
  }
  f.c.canvas.width=568;f.c.canvas.height=1000;
  f.c.zombieSpriteAtlas={complete:false,naturalWidth:0};f.c.raidBossImages=[];
  f.run('guideScrollY=getWorldMonsterGuideLayout(canvas.width,guideSectionTop).sections[1].headerY-guideSectionTop;drawMonsterGuide()');
  const tips=f.run("monsterGuideEntries.filter(entry=>entry.sprite==='zombie'||entry.tag==='BOSS MINION').flatMap(entry=>entry.tips)");
  const drawn=f.calls.filter(call=>call[0]==='fillText'&&tips.includes(call[1]));
  assert.ok(drawn.length>0);
  for(const call of drawn){assert.equal(call[4],294);assert.ok(call[2]+call[4]<=568-17);}
});
