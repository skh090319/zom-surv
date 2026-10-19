const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),manifest=require('../tools/world-monster-art-prompts.json');
test('all ten generated monster sprites ship as compact 640px alpha WebP assets',()=>{
  assert.equal(manifest.assets.length,10);assert.equal(new Set(manifest.assets.map(a=>a.id)).size,10);
  assert.equal(manifest.mode,'built-in image_gen');
  let total=0;
  for(const world of [1,3])assert.equal(manifest.assets.filter(a=>a.world===world).length,5);
  for(const asset of manifest.assets){
    assert.ok(asset.prompt.length>100);assert.equal(asset.output,`assets/world-monsters-v1/${asset.id}.webp`);
    const bytes=fs.readFileSync(path.join(root,asset.output));total+=bytes.length;
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(bytes.toString('ascii',12,16),'VP8X');assert.ok(bytes[20]&0x10,`${asset.id} needs transparent alpha`);
    assert.equal(bytes.readUIntLE(24,3)+1,640);assert.equal(bytes.readUIntLE(27,3)+1,640);
    assert.ok(bytes.length<280000,`${asset.id} should stay light enough for mobile`);
  }
  assert.ok(total<2200000,'ten sprites must not require large downloads');
});

test('World 1 boss variants keep the earlier art separate from ordinary chibi sprites',()=>{
  assert.deepEqual(manifest.bossVariants.map(a=>a.id).sort(),['alarm-infected','glass-thrower','iron-hauler']);
  for(const asset of manifest.bossVariants){
    assert.equal(asset.output,`assets/world-bosses-v1/${asset.id}.webp`);
    const bytes=fs.readFileSync(path.join(root,asset.output)),ordinary=fs.readFileSync(path.join(root,`assets/world-monsters-v1/${asset.id}.webp`));
    assert.ok(bytes[20]&0x10);assert.equal(bytes.readUIntLE(24,3)+1,640);assert.equal(bytes.readUIntLE(27,3)+1,640);
    assert.ok(!bytes.equals(ordinary),'boss and ordinary illustration must not overwrite one another');
  }
});

test('ordinary roster and archived boss-only art remain backed by the shipped catalog',()=>{
  const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'js/04-world-monsters.js'),'utf8'),context);
  const definitions=vm.runInContext('Object.values(WORLD_MONSTER_TYPES)',context);
  assert.deepEqual(Array.from(definitions.filter(def=>!def.bossOnly),def=>def.id),['street-walker','alley-hound','hollow-husk','split-larva']);
  for(const def of definitions)assert.ok(manifest.assets.some(asset=>asset.id===def.id&&asset.output===def.image));
  assert.equal(definitions.filter(def=>def.bossOnly).length,6,'six identities remain for raid art and previews, not ordinary spawning');
});
