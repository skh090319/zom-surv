const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const folder = path.join(root, 'assets/characters-original-v2');
const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json')));

test('all original sprites and attack variants have compact alpha WebP assets', () => {
  assert.equal(manifest.assets.length, 15);
  for (const asset of manifest.assets) {
    assert.ok(asset.prompt && fs.existsSync(path.join(folder, asset.source)), asset.id);
    const data = fs.readFileSync(path.join(folder, asset.runtime));
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.equal(data.toString('ascii', 12, 16), 'VP8X');
    assert.ok(data[20] & 0x10, asset.id + ' retains alpha');
    assert.ok(data.length < 360 * 1024, asset.id + ' stays within runtime budget');
  }
});

test('each selectable character has a small dedicated thumbnail', () => {
  for (const asset of manifest.assets.slice(0, 9)) {
    const file = path.join(folder, asset.id + '-thumb.webp');
    assert.ok(fs.statSync(file).size < 48 * 1024, asset.id);
  }
  for (const id of ['terra','void','carmilla','vargas','echo','aria','moira','mare']) {
    assert.ok(fs.statSync(path.join(root, 'assets/character-thumbs-v1', id + '.webp')).size < 48 * 1024);
  }
});

function loader() {
  const context = {Image: class {}, screenMode:'home', selectedCharacter:'default', guidePage:'augment', guideAugmentTab:'support', guideExclusiveCharacter:'yupiter', characterDetailId:null, mobileSettingsPage:'menu', choosingUpgrade:false};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/00-assets.js'),'utf8'), context);
  return {context, run: code => vm.runInContext(code,context)};
}

test('home loads its backdrop but leaves other heroes, skills and bosses deferred', () => {
  const g=loader();
  g.run(`var lobby=setGameImageSource(new Image(),'assets/lobby-background-v1.webp');var hero=setGameImageSource(new Image(),'assets/characters-original-v2/ren.webp');var attack=setGameImageSource(new Image(),'assets/characters-original-v2/ren-attack.webp');var boss=setGameImageSource(new Image(),'assets/bosses/venom-bloom.webp');prepareGameImages();`);
  assert.ok(g.run('lobby.src'));
  assert.equal(g.run('hero.src'),undefined);
  assert.equal(g.run('attack.src'),undefined);
  assert.equal(g.run('boss.src'),undefined);
  g.run('ensureGameImage(hero,"high")');
  assert.equal(g.run('hero.fetchPriority'),'high');
  assert.equal(g.run('attack.src'),undefined);
});

test('entering gameplay loads selected character variants; switching prepares the new character', () => {
  const g=loader();
  g.run(`var ren=setGameImageSource(new Image(),'assets/characters-original-v2/ren-attack.webp');var yupiter=setGameImageSource(new Image(),'assets/characters-original-v2/yupiter-flame.webp');var boss=setGameImageSource(new Image(),'assets/bosses/venom-bloom.webp');screenMode='game';selectedCharacter='ren';prepareGameImages();`);
  assert.ok(g.run('ren.src'));assert.ok(g.run('boss.src'));assert.equal(g.run('yupiter.src'),undefined);
  g.run(`selectedCharacter='yupiter';prepareGameImages()`);assert.ok(g.run('yupiter.src'));
});

test('thumbnail requests are memoized and never request a full hero image', () => {
  const g=loader();
  assert.equal(g.run('getCharacterThumbnail("nightLord") === getCharacterThumbnail("nightLord")'),true);
  assert.equal(g.run('getCharacterThumbnail("nightLord").src'),'assets/characters-original-v2/night-lord-thumb.webp');
  assert.equal(g.run('gameImageRegistry.length'),1);
});

test('exclusive augment and monster guides preload their actual images', () => {
  const g=loader();
  g.run(`var skill=setGameImageSource(new Image(),'assets/ren-augment-afterimage.webp');var boss=setGameImageSource(new Image(),'assets/bosses/venom-bloom.webp');screenMode='guide';guideAugmentTab='exclusive';guideExclusiveCharacter='ren';prepareGameImages();`);
  assert.ok(g.run('skill.src'));assert.equal(g.run('boss.src'),undefined);
  g.run(`guidePage='monster';prepareGameImages()`);assert.ok(g.run('boss.src'));
});

test('control editor loads selected skill icons without loading every character', () => {
  const g=loader();
  g.run(`var skill=setGameImageSource(new Image(),'assets/mare-skill-icons.webp');var other=setGameImageSource(new Image(),'assets/arc-skill-icons.webp');screenMode='mobileSettings';mobileSettingsPage='controls';selectedCharacter='mare';prepareGameImages();`);
  assert.ok(g.run('skill.src'));assert.equal(g.run('other.src'),undefined);
});

test('service worker only preloads existing core assets and returns cached images without refetching', async () => {
  const handlers={}, cached={ok:true}, context={URL,Response,self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn},caches:{match:async()=>cached},fetch:()=>{throw new Error('Cached images must not be refetched');}};
  const assets=vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+'\nCORE_ASSETS;',context);
  assert.ok(assets.includes('./js/00-assets.js'));
  for(const file of assets)assert.ok(fs.existsSync(path.join(root,file)),file);
  let response;
  handlers.fetch({request:{method:'GET',url:'https://example.test/assets/characters-original-v2/ren.webp',mode:'cors'},respondWith:promise=>response=promise});
  assert.equal(await response,cached);
});
