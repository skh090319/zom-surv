const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function game(){
  let depth=0,draws=0;const c={Math,console,player:{x:1000,y:1000,r:20,level:10,damage:10,maxHp:100,hp:100,ammo:5,fireCooldown:0},mouse:{worldX:1580,worldY:1000},WORLD:{width:4000,height:4000},selectedCharacter:'suncall',zombies:[],scaledDamage:n=>n,killZombie(i){c.zombies.splice(i,1);},worldStart(){},worldEnd(){},canvas:{width:1280,height:760}};
  c.ctx=new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];return(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k+' finite');draws++;if(k==='save')depth++;if(k==='restore')depth--;if(k.startsWith('create'))return{addColorStop(){}};};}});
  vm.createContext(c);for(const file of ['02-upgrades.js','04-suncall.js','04-suncall-vfx.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c);
  const run=s=>vm.runInContext(s,c);run('resetSuncall()');return{c,run,depth:()=>depth,draws:()=>draws,enemy(x=1100,y=1000,flags={}){const z={x,y,r:18,hp:100000,maxHp:100000,...flags};c.zombies.push(z);return z;}};
}
test('ice basic attack has its own cadence, spends no ammo and hits swept collision once',()=>{
  const g=game(),z=g.enemy(1040);g.run('attackWithSuncall();attackWithSuncall()');assert.equal(g.run('suncallShots.length'),1);assert.equal(g.c.player.fireCooldown,22);assert.equal(g.c.player.ammo,5);
  g.run('for(let i=0;i<10;i++)updateSuncall()');assert.equal(z.hp,99987.5);assert.equal(z.suncallCold,1);assert.equal(g.run('suncallShots.length'),0);
});
test('three cold stacks freeze normal enemies; raid bosses and immune summons get damage without CC',()=>{
  const g=game(),z=g.enemy();g.c.target=z;g.run('suncallCold(target,3)');assert.equal(z.stunTime,90);assert.equal(z.suncallFrozenTime,90);assert.equal(z.suncallConductTime,150);
  for(const flags of [{isRaidBoss:true},{isBossMinion:true},{movementImmune:true}]){const immune=g.enemy(1200,1000,flags);g.c.target=immune;g.run('suncallCold(target,3)');assert.equal(immune.hp,99985);assert.equal(immune.stunTime,undefined);assert.equal(immune.suncallFrozenTime,undefined);}
});
test('Q pierces, freezes and plants a finite endpoint crystal at the actual cast range',()=>{
  const g=game(),a=g.enemy(1120),b=g.enemy(1400);g.run('activateSuncallQ();activateSuncallQ();for(let i=0;i<29;i++)updateSuncall()');
  assert.equal(a.hp,99970);assert.equal(b.hp,99970);assert.equal(a.suncallFrozenTime>0,true);assert.equal(g.run('suncallCrystals.length'),1);assert.equal(g.run('suncallCrystals[0].x'),1580);assert.equal(g.run('suncallShots.length'),0);
  g.run('for(let i=0;i<720;i++)updateSuncall()');assert.equal(g.run('suncallCrystals.length'),0);
});
test('crystal capacity is bounded, world edges clamp and exclusive augments upgrade only Suncall',()=>{
  const g=game();g.run('for(let i=0;i<40;i++)suncallPlant(i*100,1000)');assert.equal(g.run('suncallCrystals.length'),6);
  g.run('suncallPlant(-500,9000)');assert.equal(g.run('suncallCrystals.at(-1).x'),28);assert.equal(g.run('suncallCrystals.at(-1).y'),3972);
  for(const id of ['suncallCrystal','suncallCircuit','suncallGuard']){assert.equal(g.run(`upgrades.find(u=>u.id==='${id}').requires()`),true);g.run(`for(let i=0;i<4;i++)upgrades.find(u=>u.id==='${id}').apply()`);assert.equal(g.run(`transcended.${id}`),true);}
  assert.equal(g.run('suncallCapacity()'),11);assert.equal(g.run('suncallQRange()'),685);g.c.selectedCharacter='mare';assert.equal(g.run("upgrades.find(u=>u.id==='suncallCrystal').requires()"),false);
});
test('E connects real crystals and frozen targets; each enemy takes one hit even at intersecting links',()=>{
  const g=game(),a=g.enemy(1120),b=g.enemy(1240),outside=g.enemy(1400,1350);g.run('suncallPlant(1200,1000);suncallPlant(1450,1000);activateSuncallE()');
  assert.equal(a.hp,99966);assert.equal(b.hp,99966);assert.equal(outside.hp,100000);assert.equal(g.c.player.suncallECooldown,420);assert.equal(g.run('suncallEffects.filter(e=>e.type==="bolt").length'),2);
  g.run('suncallCrystals=[];suncallPlant(1650,1000)');assert.equal(g.run('suncallGraph().length'),0);a.suncallConductTime=150;assert.equal(g.run('suncallGraph().length'),1);
});
test('E without nodes shoots an aimed fallback bolt and respects its cooldown',()=>{
  const g=game(),z=g.enemy(1200);g.run('activateSuncallE();activateSuncallE()');assert.equal(z.hp,99966);assert.equal(g.run('suncallEffects.filter(e=>e.type==="bolt").length'),1);
});
test('X shatters crystals, awards count-based shields and absorbs damage without healing',()=>{
  const g=game(),z=g.enemy(1220);g.run('suncallPlant(1200,1000);suncallPlant(1250,1000);activateSuncallX()');assert.equal(z.hp,99952);assert.equal(g.run('suncallCrystals.length'),0);assert.equal(g.c.player.suncallShield,19);
  assert.equal(g.run('absorbSuncallShield(30)'),11);assert.equal(g.c.player.hp,100);assert.equal(g.c.player.suncallShield,0);
  g.run('player.suncallXCooldown=0;activateSuncallX();for(let i=0;i<300;i++)updateSuncall()');assert.equal(g.c.player.suncallShield,0);
});
test('transcendent shield retaliates only when damage was actually absorbed',()=>{
  const g=game(),z=g.enemy(1100);g.run('transcended.suncallGuard=true;player.suncallShield=12;player.suncallShieldTime=300');assert.equal(g.run('absorbSuncallShield(20)'),8);assert.equal(z.hp,99982);assert.equal(g.run('absorbSuncallShield(20)'),20);assert.equal(z.hp,99982);
});
test('R is level-ten locked, plants six nodes, pulses for six seconds and finishes with a shatter',()=>{
  const g=game(),z=g.enemy(1200);g.run('player.level=9;activateSuncallR()');assert.equal(g.run('suncallStorm'),null);assert.equal(g.c.player.suncallRCooldown,0);
  g.run('player.level=10;activateSuncallR();activateSuncallR()');assert.equal(g.run('suncallCrystals.length'),6);assert.equal(g.run('suncallStorm.life'),360);g.run('for(let i=0;i<360;i++)updateSuncall()');assert.equal(g.run('suncallStorm'),null);assert.equal(g.run('suncallCrystals.length'),0);assert.ok(z.hp<99800);assert.equal(g.c.player.suncallRCooldown,1320);assert.equal(g.run('suncallEffects.some(e=>e.type==="final")'),true);
});
test('reset clears all mechanics, shield and skill cooldowns between runs',()=>{
  const g=game();g.run('activateSuncallQ();activateSuncallX();activateSuncallR();resetSuncall()');for(const field of ['suncallCrystals.length','suncallShots.length','suncallEffects.length','suncallFrame','player.suncallShield','player.suncallRCooldown'])assert.equal(g.run(field),0);assert.equal(g.run('suncallStorm'),null);
});
test('detailed VFX geometry stays finite, restores save state and bounds persistent effects',()=>{
  const g=game();for(let i=0;i<30;i++)g.enemy(1000+i*10,1080);g.run('activateSuncallR();for(let i=0;i<25;i++)updateSuncall();activateSuncallQ();activateSuncallX();drawSuncallEffects();drawSuncallForeground()');assert.equal(g.depth(),0);assert.ok(g.draws()>1000);
  g.run('for(let i=0;i<1000;i++)suncallBurst(1000,1000,100)');assert.equal(g.run('suncallEffects.length'),100);g.run('for(let i=0;i<500;i++)updateSuncall();drawSuncallEffects();drawSuncallForeground()');assert.equal(g.depth(),0);assert.equal(g.run('suncallEffects.length'),0);
});
test('generated skill and augment images are compact WebP atlases registered for demand loading',()=>{
  for(const file of ['suncall-skill-icons-v1.webp','suncall-augment-icons-v1.webp']){const data=fs.readFileSync(path.join(root,'assets',file));assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<320000);assert.ok(fs.readFileSync(path.join(root,'js/01-core.js'),'utf8').includes(file));}
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const file of ['04-suncall.js','04-suncall-vfx.js']){assert.ok(html.includes(file+'?v=20261002-frost-circuit1'));assert.ok(sw.includes(file));}
});
