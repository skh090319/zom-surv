const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

function game(){
  const context={console,Math,performance:{now:()=>0},selectedCharacter:'astra',screenMode:'game',mouse:{worldX:500,worldY:0},zombies:[],
    player:{x:0,y:0,damage:10,level:10,fireCooldown:0,fireRateBonus:0,astraOrbitBlend:0,astraOrbitAngle:0,astraOrbitTick:0,astraRedLevel:0,astraBlueLevel:0,astraHorizonLevel:0},
    transcended:{astraRed:false,astraBlue:false,astraHorizon:false},scaledDamage:n=>n,enemyMaxHpDamage:()=>0,killZombie(){},
    worldStart(){},worldEnd(){},drawRoundedRect(){},drawCooldownCover(){},drawSkillHudLabel(){},astraSpriteLoaded:false,
    astraSkillIconAtlas:{complete:false,naturalWidth:0},canvas:{width:1000,height:700},ctx:new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})})};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/04-astra.js'),'utf8'),context);return{context,run:c=>vm.runInContext(c,context)};
}

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
