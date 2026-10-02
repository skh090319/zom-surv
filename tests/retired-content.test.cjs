const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
test('retired ammo and fire-rate augments and their transcendences are absent from the shared catalog',()=>{
  const game=vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root,'js/02-upgrades.js'),'utf8'),game);
  const ids=vm.runInContext('upgrades.map(u=>u.id)',game);
  assert.ok(!ids.includes('ammo'));assert.ok(!ids.includes('fireRate'));
  assert.equal(new Set(ids).size,ids.length);
  const text=vm.runInContext('upgrades.map(u=>u.name+u.transcendName).join(" ")',game);
  for(const name of ['탄창 증가','연사속도 증가','게틀링 건','춤추는 유탄'])assert.ok(!text.includes(name));
});
test('Luminous cannot be selected, has no skill-guide entry, and does not register runtime images',()=>{
  const ui=fs.readFileSync(path.join(root,'js/08-ui.js'),'utf8');
  const cards=vm.runInNewContext(ui.match(/const characterIds = (\[[^;]+\]);/)[1]);
  assert.ok(!cards.includes('luminous'));assert.ok(cards.includes('suncall'));
  assert.ok(!ui.includes('luminous:{name:'));
  assert.ok(!fs.readFileSync(path.join(root,'js/03-input.js'),'utf8').includes('selectedCharacter = "luminous"'));
  assert.ok(!/setGameImageSource\(luminous/.test(fs.readFileSync(path.join(root,'js/01-core.js'),'utf8')));
});
