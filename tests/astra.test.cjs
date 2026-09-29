const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

function game(){
  const context={console,Math,performance:{now:()=>0},selectedCharacter:'astra',screenMode:'game',mouse:{worldX:500,worldY:0},zombies:[],
    player:{x:0,y:0,damage:10,level:10,fireCooldown:0,fireRateBonus:0,astraOrbitBlend:0,astraOrbitAngle:0,astraOrbitTick:0,astraRedLevel:0,astraBlueLevel:0,astraHorizonLevel:0},
    transcended:{astraRed:false,astraBlue:false,astraHorizon:false},scaledDamage:n=>n,enemyMaxHpDamage:(z,r)=>z.maxHp*r,
    killed:[],killZombie(i,z){context.killed.push(z);context.zombies.splice(i,1);},
    worldStart(){},worldEnd(){},drawRoundedRect(){},drawCooldownCover(){},drawSkillHudLabel(){},astraSpriteLoaded:false,
    astraUltimateBackdrop:{complete:true,naturalWidth:1672,naturalHeight:941},
    astraSkillIconAtlas:{complete:false,naturalWidth:0},canvas:{width:1000,height:700},ctx:new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})})};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/04-astra.js'),'utf8'),context);return{context,run:c=>vm.runInContext(c,context)};
}

function enemy(x,y,extra={}){return {x,y,r:18,hp:10000,maxHp:10000,speed:1,...extra};}
function tick(g,n){g.run(`for(let t=0;t<${n};t++)updateAstra()`);}

test('R realm smoothly fades in, holds, and returns completely before capture expires',()=>{
  const g=game();assert.equal(g.run('astraBackdropOpacity()'),0);g.run('activateAstraR()');
  const alphas=[g.run('astraBackdropOpacity()')];
  for(let i=0;i<420;i++){tick(g,1);alphas.push(g.run('astraBackdropOpacity()'));}
  assert.equal(alphas[0],0);assert.equal(alphas[27],.5);assert.equal(alphas[54],1);
  assert.equal(alphas[299],1);assert.equal(alphas[330],.5);assert.equal(alphas[360],0);assert.equal(alphas[420],0);
  for(let i=1;i<alphas.length;i++){
    assert.ok(alphas[i]>=0&&alphas[i]<=1);assert.ok(Math.abs(alphas[i]-alphas[i-1])<.029);
    if(i<=54)assert.ok(alphas[i]>=alphas[i-1]);if(i>=300)assert.ok(alphas[i]<=alphas[i-1]);
  }
});

test('late-loading backdrop eases in, and missing or failed assets preserve the normal map',()=>{
  const g=game();g.context.astraUltimateBackdrop.complete=false;g.context.astraUltimateBackdrop.naturalWidth=0;
  g.run('activateAstraR()');tick(g,100);assert.equal(g.run('astraBackdropOpacity()'),0);
  g.context.astraUltimateBackdrop.complete=true;tick(g,20);assert.equal(g.run('astraBackdropOpacity()'),0);
  g.context.astraUltimateBackdrop.naturalWidth=1672;tick(g,1);assert.ok(g.run('astraBackdropOpacity()')<.002);
  tick(g,53);assert.equal(g.run('astraBackdropOpacity()'),1);tick(g,240);assert.equal(g.run('astraBackdropOpacity()'),0);
});

test('realm does not affect other skills, other heroes, menus, or the next run',()=>{
  const g=game();g.run('activateAstraQ();activateAstraE();activateAstraX()');tick(g,60);assert.equal(g.run('astraBackdropOpacity()'),0);
  g.run('activateAstraR()');tick(g,100);assert.equal(g.run('astraBackdropOpacity()'),1);
  g.context.selectedCharacter='mare';assert.equal(g.run('astraBackdropOpacity()'),0);g.context.selectedCharacter='astra';
  for(const mode of ['home','guide','character','mobileSettings']){g.context.screenMode=mode;assert.equal(g.run('astraBackdropOpacity()'),0);}
  g.context.screenMode='game';g.run('resetAstra()');assert.equal(g.run('astraBackdropOpacity()'),0);
  g.run('activateAstraR()');assert.equal(g.run('astraBackdropOpacity()'),0);
});

test('production pause, upgrade and portrait gates freeze the realm with the ultimate',()=>{
  const g=game();Object.assign(g.context,{paused:false,gameOver:false,raidVictory:false,choosingUpgrade:false});
  const source=fs.readFileSync(path.join(root,'js/06-entities-update.js'),'utf8');
  vm.runInContext(source.slice(source.indexOf('function update()')),g.context);
  g.run('activateAstraR()');tick(g,27);
  for(const key of ['paused','gameOver','raidVictory','choosingUpgrade']){
    g.context[key]=true;g.run('for(let i=0;i<120;i++)update()');g.context[key]=false;
    assert.equal(g.run('astraGravity.age'),27);assert.equal(g.run('astraBackdropOpacity()'),.5);
  }
  g.context.isMobilePortraitMode=()=>true;g.run('update()');assert.equal(g.run('astraGravity.age'),27);
});

test('realm covers desktop/tablet/phone without stretching and restores canvas state',()=>{
  const g=game(),calls=[],stack=[];
  g.context.ctx={globalAlpha:.8,globalCompositeOperation:'lighter',save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},drawImage(...args){calls.push({args,alpha:this.globalAlpha,blend:this.globalCompositeOperation});}};
  vm.runInContext(fs.readFileSync(path.join(root,'js/04-astra-vfx.js'),'utf8'),g.context);
  g.run('drawAstraUltimateBackdrop()');assert.equal(calls.length,0);
  g.run('activateAstraR()');tick(g,27);
  for(const [width,height] of [[1920,1080],[1180,820],[844,390]]){
    Object.assign(g.context.canvas,{width,height});g.run('drawAstraUltimateBackdrop()');
    const {args:[image,x,y,w,h],alpha,blend}=calls.at(-1);
    assert.equal(image,g.context.astraUltimateBackdrop);assert.ok(Math.abs(w/h-1672/941)<1e-12);
    assert.ok(w>=width&&h>=height);assert.equal(x,(width-w)/2);assert.equal(y,(height-h)/2);
    assert.equal(alpha,.5);assert.equal(blend,'source-over');assert.equal(stack.length,0);
    assert.equal(g.context.ctx.globalAlpha,.8);assert.equal(g.context.ctx.globalCompositeOperation,'lighter');
  }
  tick(g,333);g.run('drawAstraUltimateBackdrop()');assert.equal(calls.length,3);
});

test('cosmic art is placed below all combat hazards, characters and HUD',()=>{
  const render=fs.readFileSync(path.join(root,'js/07-world-render.js'),'utf8');
  const background=render.slice(render.indexOf('function drawBackground()'),render.indexOf('function drawFireTrails()'));
  assert.ok(background.indexOf('drawAstraUltimateBackdrop()')>background.indexOf('drawImage(backgroundImage'));
  const main=fs.readFileSync(path.join(root,'js/09-main.js'),'utf8');
  for(const call of ['drawRaidArena()','drawRaidBossZones()','drawZombies()','drawPlayer()','drawHUD()'])assert.ok(main.indexOf('drawBackground()')<main.indexOf(call));
});

test('Q deploys every actual orbit slot including all augmented stars',()=>{
  for(const enhanced of [false,true]){
    const g=game();if(enhanced){g.context.player.astraBlueLevel=3;g.context.transcended.astraBlue=true;}
    const expected=g.run('astraQPaths(0)');g.run('activateAstraQ()');const flights=g.run('astraQFlights()');
    assert.equal(flights.length,enhanced?8:3);
    for(let i=0;i<flights.length;i++)for(const k of ['x','y','slot','count','endX','endY'])assert.equal(flights[i][k],expected[i][k]);
    assert.equal(new Set(flights.map(m=>m.slot)).size,flights.length);
    assert.equal(g.context.player.astraQCooldown,300);
  }
});

test('Q sweeps targets and damages at most once on each leg, then restores its slots',()=>{
  const g=game(),target=enemy(300,0,{r:65});g.context.zombies.push(target);g.run('activateAstraQ()');
  const flight=g.run('astraQFlights().slice()');tick(g,150);
  assert.equal(g.run('astraQFlights().length'),0);
  for(const star of flight){assert.ok(star.outwardHits.has(target));assert.ok(star.returnHits.has(target));}
  assert.ok(Math.abs(target.hp-(10000-6*10.5))<1e-7);
});

test('deployed orbit slots cannot also deal passive contact damage',()=>{
  const g=game(),z=enemy(72,0,{r:2});g.context.zombies.push(z);g.run('activateAstraQ();astraMeteors.forEach(m=>{m.x=400;m.y=400;});updateAstra()');
  assert.equal(z.hp,10000);
});

test('Q recast recalls without creating stars or resetting its cooldown, even while moving',()=>{
  const g=game();g.run('activateAstraQ()');tick(g,15);const cd=g.context.player.astraQCooldown;
  g.run('activateAstraQ()');assert.equal(g.run('astraQFlights().length'),3);assert.equal(g.context.player.astraQCooldown,cd);
  assert.ok(g.run('astraQFlights().every(m=>m.returning)'));
  g.run('for(let i=0;i<150;i++){player.x+=4.2;player.y+=1;updateAstra();}');assert.equal(g.run('astraQFlights().length'),0);
});

test('R captures ordinary enemies, but neither raid bosses nor control-immune summons',()=>{
  const g=game(),ordinary=enemy(120,20),boss=enemy(250,0,{isRaidBoss:true}),minion=enemy(40,50,{isBossMinion:true}),far=enemy(900,0);
  g.context.zombies.push(ordinary,boss,minion,far);g.run('activateAstraR()');
  assert.equal(g.run('astraGravity.bodies.length'),1);assert.ok(ordinary.astraControl);assert.equal(boss.astraControl,undefined);assert.equal(minion.astraControl,undefined);assert.equal(far.astraControl,undefined);
  tick(g,70);const before=ordinary.x;g.context.player.x+=300;tick(g,80);
  assert.ok(g.run('Math.abs(astraGravity.x-player.x)<1'));
  assert.ok(Math.hypot(ordinary.x-g.context.player.x,ordinary.y-g.context.player.y)<290);assert.notEqual(ordinary.x,before);
});

test('captured enemies collide, take damage, and deaths cannot duplicate rewards',()=>{
  const g=game();for(let i=0;i<35;i++)g.context.zombies.push(enemy(i*8-140,100,{r:25,hp:12}));
  g.run('activateAstraR()');tick(g,280);
  assert.ok(g.context.zombies.some(z=>z.hp<12)||g.context.killed.length>0);
  tick(g,220);assert.equal(new Set(g.context.killed).size,g.context.killed.length);
  assert.ok(g.context.killed.length>0);assert.equal(g.run('astraGravity'),null);
  assert.ok(g.context.zombies.every(z=>!z.astraControl));
});

test('R launch uses the current aim at expiry, not the original cast direction',()=>{
  const g=game();g.context.zombies.push(enemy(90,40));g.run('activateAstraR()');tick(g,359);
  g.context.mouse.worldX=0;g.context.mouse.worldY=700;tick(g,1);
  assert.equal(g.run('astraGravity.state'),'launch');assert.equal(g.run('astraGravity.targetX'),700*Math.cos(Math.PI/2));assert.equal(g.run('astraGravity.targetY'),700);
  assert.equal(g.run('astraGravity.bodies[0].state'),'flight');
});

test('empty-field R creates blue-white virtual bodies and its final collision hits a boss',()=>{
  const g=game(),boss=enemy(740,0,{r:100,isRaidBoss:true,maxHp:100000,hp:100000});g.context.zombies.push(boss);
  g.context.mouse.worldX=740;g.run('activateAstraR()');assert.equal(g.run('astraGravity.bodies.length'),5);assert.ok(g.run('astraGravity.bodies.every(b=>b.virtual)'));
  tick(g,450);assert.equal(g.run('astraGravity'),null);assert.ok(boss.hp<100000-1000);assert.equal(boss.astraControl,undefined);
  assert.ok(100000-boss.hp<=100000*.045+5*25+1e-8);
});

test('boss max-health component has a per-ultimate budget independent of capture count',()=>{
  for(const count of [1,10,100]){
    const g=game(),boss=enemy(0,0,{isRaidBoss:true,hp:1e7,maxHp:1e7});g.context.zombies.push(boss);
    g.context.enemyMaxHpDamage=()=>0; // R explicitly bypasses the old flat conversion.
    for(let i=0;i<count;i++)g.context.zombies.push(enemy(100,0));g.run('activateAstraR();for(const b of astraGravity.bodies){b.x=0;b.y=0;astraDetonateBody(b,astraGravity);astraDetonateBody(b,astraGravity);}');
    const damage=1e7-boss.hp;assert.ok(damage>=450000-1e-6);assert.ok(damage<=450000+count*25+1e-6);
  }
});

test('all VFX phases render finite geometry with balanced canvas state and cached textures',()=>{
  const g=game();let allocated=0;
  function drawing(){
    const stack=[],target={globalAlpha:1,globalCompositeOperation:'source-over',save(){stack.push({alpha:this.globalAlpha,blend:this.globalCompositeOperation});},restore(){assert.ok(stack.length);const s=stack.pop();this.globalAlpha=s.alpha;this.globalCompositeOperation=s.blend;},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),measureText:()=>({width:40})};
    const proxy=new Proxy(target,{get(o,k){if(k in o)return o[k];return(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k+' has a finite argument');if(k==='arc')assert.ok(args[2]>=0);if(k==='ellipse'){assert.ok(args[2]>=0);assert.ok(args[3]>=0);}if(k.startsWith('create'))return{addColorStop(){}};};},set(o,k,v){if(k==='globalAlpha')assert.ok(Number.isFinite(v)&&v>=0&&v<=1,'valid alpha');o[k]=v;return true;}});
    return {proxy,stack};
  }
  const main=drawing();Object.assign(g.context,{ctx:main.proxy,camera:{x:-800,y:-600},getCameraViewWidth:()=>1600,getCameraViewHeight:()=>1200,getWorldViewScale:()=>1,zombieSpriteAtlas:{complete:true,naturalWidth:512,naturalHeight:256},document:{createElement(){allocated++;return{width:0,height:0,getContext:()=>drawing().proxy};}}});
  vm.runInContext(fs.readFileSync(path.join(root,'js/04-astra-vfx.js'),'utf8'),g.context);
  for(let i=0;i<24;i++)g.context.zombies.push(enemy(Math.cos(i)*200,Math.sin(i)*200,{hp:100}));
  g.run('activateAstraQ();activateAstraE();activateAstraR();activateAstraX()');
  for(let i=0;i<470;i++){tick(g,1);if(i%7===0){g.run('drawAstraEffects();drawAstraForeground();drawAstraInterface()');assert.equal(main.stack.length,0);}}
  assert.ok(allocated>=3&&allocated<=4);const before=allocated;g.run('for(let i=0;i<10;i++){drawAstraEffects();drawAstraForeground();}');assert.equal(allocated,before);
});

test('encounter purge becomes virtual payloads, and reset releases surviving enemies',()=>{
  const g=game(),z=enemy(50,0);g.context.zombies.push(z);g.run('activateAstraR()');g.context.zombies.length=0;tick(g,1);
  assert.equal(z.astraControl,undefined);assert.ok(g.run('astraGravity.bodies[0].virtual'));assert.equal(g.context.killed.length,0);
  g.run('resetAstra()');g.context.zombies.push(z);g.run('activateAstraR();activateAstraQ();activateAstraE();resetAstra()');
  assert.equal(z.astraControl,undefined);assert.equal(g.run('astraGravity'),null);assert.equal(g.run('astraMeteors.length+astraWells.length+astraDust.length+astraEffects.length'),0);
});

test('E clamps aim and separates pull immunity from damage',()=>{
  const g=game(),normal=enemy(560,0),boss=enemy(560,0,{isRaidBoss:true}),minion=enemy(560,0,{isBossMinion:true});g.context.mouse.worldX=1000;g.context.zombies.push(normal,boss,minion);
  g.run('activateAstraE()');assert.equal(g.run('astraWells[0].x'),520);tick(g,100);
  assert.ok(normal.x<560);assert.equal(boss.x,560);assert.equal(minion.x,560);assert.ok(boss.hp<10000);assert.ok(minion.hp<10000);
  const hp=boss.hp;tick(g,170);assert.equal(g.run('astraWells.length'),0);assert.ok(boss.hp<hp-15);
});

test('high-density effects remain bounded, and the capture simulation stays finite',()=>{
  const g=game();for(let i=0;i<250;i++)g.context.zombies.push(enemy(Math.cos(i)*350,Math.sin(i)*350));
  g.run('activateAstraR();activateAstraQ();activateAstraE();activateAstraX()');tick(g,440);
  assert.ok(g.run('astraDust.length<=260&&astraEffects.length<=64'));
  assert.ok(g.context.zombies.every(z=>Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.hp)));
});

test('captured bodies bypass normal zombie movement and contact damage',()=>{
  const g=game();Object.assign(g.context,{zombieSlowTimer:0});
  const source=fs.readFileSync(path.join(root,'js/06-entities-update.js'),'utf8');
  const start=source.indexOf('function updateZombies()'),end=source.indexOf('\nfunction ',start+1);
  vm.runInContext(source.slice(start,end<0?undefined:end),g.context);
  const z=enemy(0,0);g.context.zombies.push(z);g.run('activateAstraR();updateZombies()');
  assert.equal(z.x,0);assert.equal(z.y,0);assert.equal(z.hp,10000);
});

test('Astra orbit expansion eases outward and back instead of snapping',()=>{
  const g=game();g.run('activateAstraX()');g.run('updateAstra()');const first=g.context.player.astraOrbitBlend;
  assert.ok(first>0&&first<1);g.context.player.astraOverdriveTime=0;g.run('updateAstra()');assert.ok(g.context.player.astraOrbitBlend<first);
});

test('Astra keeps permanent orbit stars and blue upgrades add more',()=>{
  const g=game();assert.equal(g.run('astraOrbitCount()'),3);g.context.player.astraBlueLevel=2;assert.equal(g.run('astraOrbitCount()'),5);
});

test('Astra ultimate is locked until level ten',()=>{
  const g=game();g.context.player.level=9;g.run('activateAstraR()');assert.equal(g.context.player.astraRCooldown||0,0);
  g.context.player.level=10;g.run('activateAstraR()');assert.equal(g.context.player.astraRCooldown,g.run('ASTRA_R_CD'));
});
