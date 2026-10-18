const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function game(){
 const g={player:{x:0,y:0,level:10,yupiterWeapon:0,yupiterAttacksRemaining:50,yupiterSkillCooldowns:[0,0,0],yupiterUltimateCooldown:0,fireCooldown:0},mouse:{worldX:100,worldY:0},particles:[],flameUltimateOrbs:[]};
 vm.createContext(g);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/04-yupiter-weapons.js'),'utf8'),g);
 for(const key of ['throwCrescentBlade','slashWithSeveringBlade','fireFlameCannon'])g[key]=()=>{g.player.fireCooldown=15;};
 g.detonateFlameMarks=()=>true;return g;
}
test('each weapon grants 50 attacks and cycles exactly once without a free attack',()=>{
 const g=game();
 for(let weapon=0;weapon<3;weapon++){
  for(let n=0;n<50;n++){g.player.fireCooldown=0;g.attackWithYupiterWeapon();}
  assert.equal(g.player.yupiterWeapon,(weapon+1)%3);assert.equal(g.player.yupiterAttacksRemaining,50);assert.equal(g.player.fireCooldown,15);
 }
});
test('blocked attacks do not consume uses',()=>{
 const g=game();g.player.fireCooldown=10;g.attackWithYupiterWeapon();assert.equal(g.player.yupiterAttacksRemaining,50);
 g.player.fireCooldown=0;g.throwCrescentBlade=()=>{};g.attackWithYupiterWeapon();assert.equal(g.player.yupiterAttacksRemaining,50);
});
test('E consumes ten including low reserves, but failed casts and R cost nothing',()=>{
 for(let weapon=0;weapon<3;weapon++)for(const remaining of [50,10,9,1]){
  const g=game();g.player.yupiterWeapon=weapon;g.player.yupiterAttacksRemaining=remaining;
  g.activateYupiterSkill();assert.equal(g.player.yupiterAttacksRemaining,remaining>10?remaining-10:50);
  assert.equal(g.player.yupiterWeapon,remaining>10?weapon:(weapon+1)%3);
  assert.ok(g.player.yupiterSkillCooldowns[weapon]>0);
 }
 for(let weapon=0;weapon<3;weapon++){
  const g=game();g.player.yupiterWeapon=weapon;g.player.yupiterAttacksRemaining=3;g.activateYupiterUltimate();
  assert.equal(g.player.yupiterAttacksRemaining,3);assert.equal(g.player.yupiterWeapon,weapon);
 }
 const g=game();g.player.yupiterWeapon=2;g.detonateFlameMarks=()=>false;g.activateYupiterSkill();assert.equal(g.player.yupiterAttacksRemaining,50);
 g.player.yupiterSkillCooldowns[2]=20;g.activateYupiterSkill();assert.equal(g.player.yupiterAttacksRemaining,50);
});
