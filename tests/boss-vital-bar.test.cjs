const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene(mobile=false){
  const calls=[],c={Math,console,Image:class{},addEventListener(){},selectedWorld:2,selectedDifficulty:'easy',selectedCharacter:'zero',canvas:{width:mobile?844:1280,height:mobile?390:720},isMobileTouchDevice:()=>mobile,registerGuideSection(){},
    draw(){},mobileControlSettings:{hud:{boss:{x:.42,y:.25,scale:1.5}}}};
  c.ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  vm.createContext(c);const run=code=>vm.runInContext(code,c);
  for(const file of ['js/04-bosses.js','js/04-world-bosses.js','js/07-world-bosses-render.js','js/08-mobile-settings.js','js/19-relic-ui.js'])run(fs.readFileSync(path.join(root,file),'utf8'));
  function boss(world,index){c.selectedWorld=world;return run(`activeRaidBoss={isRaidBoss:true,isWorldRaidBoss:${world!==2},worldRaidWorld:${world},raidIndex:${index},worldRaidType:getWorldRaidBossDefinition(${index},${world})?.id,hp:600,maxHp:1000,relicShield:150,relicShieldMax:300,relicBreakTime:0};raidIntroTime=0;activeRaidBoss`);}
  return{c,run,calls,boss};
}

test('shield owns the single boss bar until zero, then remaining HP is revealed without changing either value',()=>{
  const s=scene(),boss=s.boss(1,0),before=JSON.stringify(boss);
  assert.deepEqual(JSON.parse(s.run('JSON.stringify(getRaidBossVitalState(activeRaidBoss))')),{shield:true,ratio:.5,value:150,maximum:300,broken:false});
  s.run('drawRaidBossUI()');assert.equal(JSON.stringify(boss),before);
  boss.relicShield=0;boss.relicBreakTime=240;
  assert.deepEqual(JSON.parse(s.run('JSON.stringify(getRaidBossVitalState(activeRaidBoss))')),{shield:false,ratio:.6,value:600,maximum:1000,broken:true});
});

test('all nine bosses use one identical bar rectangle across shield and HP states on desktop and mobile',()=>{
  for(const mobile of [false,true])for(const world of [1,2,3])for(let index=0;index<3;index++){
    const s=scene(mobile),boss=s.boss(world,index),states=[];
    for(const shield of [150,0]){
      boss.relicShield=shield;boss.relicBreakTime=shield?0:240;s.calls.length=0;s.run('drawRaidBossUI()');
      const bars=s.calls.filter(c=>c[0]==='strokeRect');assert.equal(bars.length,1,'no separate shield strip');states.push(bars[0]);
      const [_,x,y,w,h]=bars[0];assert.equal(y,mobile?52:54);assert.equal(h,mobile?16:26);
      const fill=s.calls.filter(c=>c[0]==='fillRect'&&c[1]===x&&c[2]===y&&c[4]===h);assert.equal(fill.length,1);
      assert.ok(Math.abs(fill[0][3]-w*(shield?.5:.6))<1e-9);
      const labels=s.calls.filter(c=>c[0]==='fillText').map(c=>c[1]);
      assert.ok(labels.some(t=>t.includes(shield?'보호막 50%':'체력 60%')));
      if(!shield)assert.ok(labels.some(t=>t.includes('파괴 4.0초')));
      assert.equal(s.calls.some(c=>c[0]==='translate'&&c[2]===16),false);
    }
    assert.deepEqual(states[0],states[1]);
  }
});

test('the merged bar retains the same editable mobile position and scale in both phases',()=>{
  const s=scene(true),boss=s.boss(3,2),bounds=JSON.stringify(s.run("getMobileHudBounds('boss')")),transforms=[];
  for(const shield of [150,0]){boss.relicShield=shield;s.calls.length=0;s.run("drawMobileEditableHud('boss',drawRaidBossUI)");transforms.push(s.calls.filter(c=>['translate','scale'].includes(c[0])));}
  assert.equal(bounds,JSON.stringify(s.run("getMobileHudBounds('boss')")));
  assert.deepEqual(transforms[0],transforms[1]);assert.ok(transforms[0].some(c=>c[0]==='scale'&&c[1]===1.5));
  assert.equal(s.run("getMobileHudBounds('boss').h"),60,'no obsolete extra shield-row bounds');
});

test('zero or missing shield and clamped HP still produce a finite health fraction',()=>{
  const s=scene();s.boss(2,0);
  for(const values of [{hp:-2,maxHp:100},{hp:150,maxHp:100},{hp:0,maxHp:0}]){
    Object.assign(s.run('activeRaidBoss'),values,{relicShield:undefined,relicShieldMax:undefined});
    const state=s.run('getRaidBossVitalState(activeRaidBoss)');assert.equal(state.shield,false);assert.ok(Number.isFinite(state.ratio));assert.ok(state.ratio>=0&&state.ratio<=1);
  }
});
