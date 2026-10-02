const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function game(prestige=true){
  const calls=[],surfaces=[],stack=[];
  function context(log){return new Proxy({globalAlpha:.8,globalCompositeOperation:'source-over',save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();}},{get(o,k){if(k in o)return o[k];return(...a)=>{for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),k+' finite');log.push([k,...a]);if(k.startsWith('create'))return{addColorStop(){}};};}});}
  class Surface{constructor(w,h){this.width=w;this.height=h;surfaces.push(this);this.ctx=context([]);}getContext(){return this.ctx;}}
  const image={complete:true,naturalWidth:400,naturalHeight:400};
  const c={Math,performance:{now:()=>1000},OffscreenCanvas:Surface,ctx:context(calls),player:{x:1000,y:1000,r:20,level:10,damage:20,maxHp:100,hp:50,fireCooldown:0,mareQCooldown:0,mareECooldown:0,mareXCooldown:0,mareRCooldown:0,mareUltimateTime:0,mareUltimateTick:0,mareUltimateAngle:0,mareWhaleTrailTick:0,mareChargeTime:0,mareDepthLevel:0,mareFoamLevel:0,mareCurrentLevel:0,invincibleTime:0},mouse:{worldX:1500,worldY:1000},WORLD:{width:4000,height:4000},transcended:{},selectedCharacter:'mare',screenMode:'game',zombies:[],scaledDamage:n=>n,enemyMaxHpDamage:(z,n)=>z.maxHp*n,killZombie(i){c.zombies.splice(i,1);},worldStart(){},worldEnd(){},canvas:{width:844,height:390},mareUiPanelImage:{...image,naturalWidth:1200,naturalHeight:400},marePortraitImage:image,mareSkillFrameImage:image,mareControlIconAtlas:image,mareSkillIconAtlas:image,mareLeviathanSprite:image,mareLeviathanLoaded:true,drawRoundedRect(){},drawMobileIcon(){return true;},drawCooldownCover(){},drawSkillHudLabel(){}};
  vm.createContext(c);for(const f of ['04-mare.js','04-mare-polish.js','04-mare-skills-polish.js','04-mare-flow.js','04-mare-whale.js',...(prestige?['04-mare-prestige.js']:[])])vm.runInContext(fs.readFileSync(path.join(root,'js',f),'utf8'),c);
  return{c,calls,surfaces,run:s=>vm.runInContext(s,c),stack};
}
test('Mare presentation preserves every skill damage, cooldown, movement and collision state',()=>{
  for(const kind of ['q','e','x','r','attack']){
    const a=game(false),b=game(true);
    for(const g of [a,b]){for(let i=0;i<16;i++)g.c.zombies.push({id:i,x:1040+i*20,y:1000+i%3*14,r:18,hp:100000,maxHp:100000,mareWet:2});g.run(kind==='attack'?'attackWithMare()':`activateMare${kind.toUpperCase()}()`);g.run('for(let i=0;i<30;i++)updateMare()');}
    assert.equal(JSON.stringify(a.c.player),JSON.stringify(b.c.player),kind+' player');assert.equal(JSON.stringify(a.c.zombies),JSON.stringify(b.c.zombies),kind+' enemies');
  }
});
test('ocean HP clips exactly to current health and handles zero without allocating a texture',()=>{
  const g=game();g.run('drawMareHealthFlow(10,20,520,24,0)');assert.equal(g.surfaces.length,0);
  for(const ratio of [.01,.5,1,2,-1]){g.calls.length=0;g.run(`drawMareHealthFlow(10,20,520,24,${ratio})`);const rect=g.calls.find(c=>c[0]==='rect');if(ratio<0)assert.equal(rect,undefined);else assert.deepEqual(rect,['rect',10,20,520*Math.min(1,ratio),24]);assert.equal(g.c.ctx.globalAlpha,.8);assert.equal(g.c.ctx.globalCompositeOperation,'source-over');}
});
test('water caustics and vortex are cached once, motion follows simulation and pause-safe state',()=>{
  const g=game();g.run('getMareOceanTexture();getMareVortexTexture();drawMareHealthFlow(0,0,520,24,.5)');assert.equal(g.surfaces.length,2);const first=g.run('getMareOceanTexture()');g.run('marePresentationFrame=900;drawMareHealthFlow(0,0,520,24,.5)');assert.equal(g.run('getMareOceanTexture()'),first);assert.equal(g.surfaces.length,2);g.run('resetMarePresentation()');assert.equal(g.run('marePresentationFrame'),0);g.c.selectedCharacter='astra';g.run('updateMare()');assert.equal(g.run('marePresentationFrame'),0);
});
test('all Q/E/X/R and empowered VFX draw finite geometry, leave gameplay data unchanged and restore canvas',()=>{
  const g=game();g.run("mareCore={x:1150,y:1000,phase:.3};addMareCurrent(1000,1000,0);mareEffects=['tide','current','coreSpawn','coreBurst','pressure','pressureRing','foamHit','confluence','oceanCollapse','whaleMode','whaleBreath','whaleDash','whaleDashTrail','abyss'].map(type=>({type,x:1000,y:1000,a:0,width:430,range:285,r:42,life:20,maxLife:64}));");
  const before=g.run('JSON.stringify({player,mareEffects,mareCore,mareCurrents})');g.run('drawMareEffects();drawMareInterface();drawMareMobileResource();drawMareControlIcon(70,310,45,"joystick",true,12,-10);drawMareControlIcon(770,310,34,"attack",true)');assert.equal(g.run('JSON.stringify({player,mareEffects,mareCore,mareCurrents})'),before);assert.equal(g.stack.length,0);assert.equal(g.c.ctx.globalAlpha,.8);assert.ok(g.calls.length>1500);assert.equal(g.surfaces.length,2);
});
test('missing canvas texture support retains the colored water bar and procedural wave highlights',()=>{
  const g=game();delete g.c.OffscreenCanvas;g.run('drawMareHealthFlow(0,0,520,24,.5)');assert.ok(g.calls.some(c=>c[0]==='fillRect'&&c[3]===260));assert.equal(g.calls.filter(c=>c[0]==='stroke').length,8);assert.equal(g.stack.length,0);
});
test('sculpted HUD uses fixed corner proportions and ornaments do not change hit targets',()=>{
  const g=game();g.run('drawMareOceanPanel(100,200,370,34)');const images=g.calls.filter(c=>c[0]==='drawImage');assert.equal(images.length,3);assert.ok(images[0][8]<34);assert.equal(images[1][6],100+images[0][8]);g.calls.length=0;g.run('drawMareSkillFrame(600,300,20)');assert.equal(g.calls.find(c=>c[0]==='drawImage')[4],54);
});
test('new Mare art and UI assets are compact WebP files, with new thumbnail and demand-only registry',()=>{
  for(const name of ['mare-mature-v1.webp','mare-portrait-v1.webp','mare-ui-panel-v1.webp','mare-skill-frame-v1.webp','mare-control-icons-v1.webp']){const bytes=fs.readFileSync(path.join(root,'assets',name));assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length<600000);assert.ok(fs.readFileSync(path.join(root,'js/01-core.js'),'utf8').includes(name));}
  assert.ok(fs.readFileSync(path.join(root,'js/00-assets.js'),'utf8').includes('character-thumbs-v1/mare-mature-v1.webp'));assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./js/04-mare-prestige.js'));
});
