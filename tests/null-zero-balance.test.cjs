const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function game() {
 const g = {player:{x:0,y:0,damage:10,fireCooldown:0,fireRateBonus:0},mouse:{worldX:100,worldY:0},zombies:[],transcended:{},selectedCharacter:'nullZero',scaledDamage:x=>x,killZombie(){}};
 vm.createContext(g);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/04-null-zero.js'),'utf8'),g);
 return g;
}
test('infection always detonates on the fifth stack at every packet upgrade level',()=>{
 for(const level of [0,1,5,20]){
  const g=game(),z={id:1,x:45,y:0,r:10,hp:10000};g.zombies.push(z);g.player.nullZeroPacketLevel=level;
  for(let n=1;n<=4;n++){g.infectNullZero(z);assert.equal(z.nullZeroInfection,n);}
  g.infectNullZero(z);assert.equal(z.nullZeroInfection,0);assert.ok(z.hp<10000);
 }
});
test('only enhanced basic packets pierce and cannot hit the same target twice',()=>{
 for(const enhanced of [false,true]){
  const g=game();g.player.nullZeroForkTime=enhanced?1:0;
  const a={id:1,x:47,y:0,r:10,hp:1000},b={id:2,x:47,y:0,r:10,hp:1000};g.zombies.push(a,b);
  g.spawnNullZeroPacket(0);g.updateNullZero();
  assert.equal(a.hp,990);assert.equal(b.hp,enhanced?990:1000);
  g.updateNullZero();assert.equal(a.hp,990);assert.equal(b.hp,enhanced?990:1000);
 }
});
