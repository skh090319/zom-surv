const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),core=fs.readFileSync(path.join(root,'js/01-core.js'),'utf8');
const source=core.slice(core.indexOf('function getCharacterBaseStats('),core.indexOf('const player ='));
function stats(hero){const c=vm.createContext({hero});vm.runInContext(source,c);return JSON.parse(vm.runInContext('JSON.stringify(getCharacterBaseStats(hero))',c));}
test('shared character base stats preserve every existing fresh-run balance',()=>{
  const heroes=['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','aria','moira','mare','nullZero','astra','lush','oblivion'];
  for(const hero of heroes){const actual=stats(hero);assert.equal(actual.maxHp,({ren:50,nightLord:150,paladin:125,vargas:180})[hero]??100);assert.equal(actual.damage,({yupiter:70,zero:45,paladin:42})[hero]??35);assert.equal(actual.speed,hero==='suncall'?4.2*1.15:4.2);}
});
test('base-stat previews are fresh objects and do not read the last played character',()=>{
  const c=vm.createContext({player:{maxHp:99999,damage:7777,speed:44},selectedCharacter:'vargas'});vm.runInContext(source,c);
  vm.runInContext('getCharacterBaseStats("ren").maxHp=500',c);assert.equal(vm.runInContext('getCharacterBaseStats("ren").maxHp',c),50);assert.equal(c.player.maxHp,99999);
});
test('production restart consumes the same base-stat helper as the menu',()=>{
  const main=fs.readFileSync(path.join(root,'js/09-main.js'),'utf8');assert.match(main,/const baseStats = getCharacterBaseStats\(selectedCharacter\)/);for(const key of ['maxHp','damage','speed'])assert.ok(main.includes(`player.${key} = baseStats.${key}`));
});
