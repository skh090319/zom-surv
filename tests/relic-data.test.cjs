const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/17-relic-data.js'),'utf8');
function game(saved){
  const storage=new Map(saved===undefined?[]:[['zombieSurvivalRelicsV1',saved]]),c={console,Math:Object.create(Math),screenMode:'home',paused:false};
  c.localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem(key,value){if(c.quota)throw new Error('quota');storage.set(key,value);}};
  vm.createContext(c);vm.runInContext(source,c);return {c,storage,run:expression=>vm.runInContext(expression,c)};
}
const plain=value=>JSON.parse(JSON.stringify(value));
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-10,`${actual} !== ${expected}`);}

test('six requested rarities, 31 sets, fixed slots and a six-piece starter loadout',()=>{
  const g=game();assert.deepEqual(plain(g.run('Object.values(RELIC_RARITIES).map(r=>[r.name,r.color])')),[['일반','#a1a8b3'],['희귀','#55d68a'],['초희귀','#579dff'],['에픽','#b783ff'],['전설','#f4d35e'],['저주','#ff5869']]);
  assert.equal(g.run('Object.keys(RELIC_SETS).length'),31);assert.equal(g.run('relicStore.inventory.length'),6);assert.equal(g.run('relicStore.materials'),150);
  assert.equal(g.run("relicEquippedItems('astra').length"),6);assert.equal(g.run("relicEquippedItems('lush').length"),6);
  assert.equal(g.run('Object.values(RELIC_STATS).filter(s=>s.sub).length'),13);
  assert.equal(g.run('Object.values(RELIC_SETS).every(s=>s.names.length===s.slots.length)'),true);
});
test('creation enforces set slots, cursed-only D01 and unique substats distinct from main',()=>{
  const g=game();for(const command of ["relicCreate({setId:'A01',slot:'emblem'})","relicCreate({setId:'D01',slot:'core',rarity:'legendary'})","relicCreate({setId:'A01',slot:'core',rarity:'cursed'})","relicCreate({setId:'A01',slot:'core',mainStat:'critChance'})","relicCreate({setId:'__proto__',slot:'core'})"])assert.throws(()=>g.run(command));
  g.run("for(const rarity of Object.keys(RELIC_RARITIES))for(const slot of RELIC_SETS[rarity==='cursed'?'D01':'A01'].slots){const item=relicCreate({setId:rarity==='cursed'?'D01':'A01',slot,rarity},()=>.99);if(!relicValidateItem(item))throw new Error('invalid creation')} ");
  assert.equal(g.run("relicValidateItem({id:'x',setId:'__proto__',rarity:'common',slot:'core'})"),false);
});
test('main interpolation, rarity factor and boots shield exception remain unrounded',()=>{
  const g=game();g.run("let lens=relicCreate({setId:'A07',slot:'lens',rarity:'legendary',mainStat:'shieldDamage'});let boots=relicCreate({setId:'A07',slot:'boots',rarity:'legendary',mainStat:'shieldDamage'})");
  near(g.run('relicMainValue(lens)'),.15);near(g.run('relicMainValue(boots)'),.10);
  g.run('lens.level=15;boots.level=15');near(g.run('relicMainValue(lens)'),.324);near(g.run('relicMainValue(boots)'),.24);
  g.run("lens.level=9;lens.rarity='superRare'");near(g.run('relicMainValue(lens)'),(.15+(.324-.15)*.6)*.775);
});
test('enhancement keeps original substats, grows every three levels and stores deterministic retry results',()=>{
  const g=game();g.run("relicStore.inventory=[relicCreate({setId:'A07',slot:'lens',rarity:'legendary',mainStat:'shieldDamage'},()=>.99)];relicStore.loadouts={};relicStore.materials=2000;relicSave();let target=relicStore.inventory[0].id;let originalSubs=relicStore.inventory[0].substats.map(s=>s.stat)");
  assert.equal(g.run("relicEnhance(target,{expectedLevel:0,requestId:'first',rng:()=>0}).ok"),true);
  assert.equal(g.run("relicEnhance(target,{expectedLevel:0,requestId:'first',rng:()=>.99}).unchanged"),true);
  assert.equal(g.run('relicStore.inventory[0].level'),1);assert.equal(g.run('relicStore.materials'),1970);
  assert.equal(g.run('relicEnhance(target,{expectedLevel:0}).ok'),false);
  g.run('for(let level=1;level<15;level++)relicEnhance(target,{rng:()=>0})');
  assert.equal(g.run('relicStore.materials'),500);assert.equal(g.run('relicStore.inventory[0].history.length'),5);assert.equal(g.run('relicStore.inventory[0].substats[0].count'),5);
  assert.deepEqual(plain(g.run('relicStore.inventory[0].substats.map(s=>s.stat)')),plain(g.run('originalSubs')));
  assert.equal(g.run('relicEnhance(target).ok'),false);
  const saved=g.storage.get('zombieSurvivalRelicsV1'),loaded=game(saved);assert.deepEqual(plain(loaded.run('relicStore.inventory[0]')),plain(g.run('relicStore.inventory[0]')));
});
test('main and sub contributions add and set thresholds apply once with correct 2+2 behavior',()=>{
  const g=game();g.run("let items=['core','armor','lens','boots'].map(slot=>relicCreate({setId:'A07',slot,rarity:'common'},()=>0));let result=relicStatsForItems(items)");
  assert.equal(g.run('result.activeSets.length'),1);assert.equal(g.run('result.activeSets[0].four'),true);
  near(g.run('result.stats.shieldDamage'),.15);
  g.run("items[2]=relicCreate({setId:'A08',slot:'lens'},()=>0);items[3]=relicCreate({setId:'A08',slot:'boots'},()=>0);result=relicStatsForItems(items)");
  assert.equal(g.run('result.activeSets.filter(s=>s.four).length'),0);near(g.run('result.stats.shieldDamage'),.15);near(g.run('result.stats.bossDamage'),.10);
  g.run('result=relicStatsForItems([items[0],items[0]])');assert.equal(g.run('result.items.length'),1);assert.equal(g.run('result.activeSets.length'),0);
});
test('cursed benefits and penalties activate only at corresponding set thresholds',()=>{
  const g=game();g.run("let items=['core','armor','lens','boots'].map(slot=>relicCreate({setId:'D01',slot,rarity:'cursed'},()=>0));let result=relicStatsForItems(items.slice(0,1))");
  assert.equal(g.run('result.stats.incomingDamage||0'),0);g.run('result=relicStatsForItems(items.slice(0,2))');near(g.run('result.stats.incomingDamage'),.08);assert.equal(g.run('result.stats.allDamage||0'),0);
  g.run('result=relicStatsForItems(items)');near(g.run('result.stats.allDamage'),.20);assert.equal(g.run('result.activeSets[0].four'),true);
});
test('active and paused runs reject equipment, enhancement, crafting and dismantling',()=>{
  const g=game();g.run('let target=relicStore.inventory[0].id');g.c.screenMode='game';
  for(const command of ["relicEquip('astra',target)","relicUnequip('astra','core')",'relicEnhance(target)','relicToggleLock(target)',"relicSavePreset('astra',0)","relicLoadPreset('astra',0)",'relicDismantle([target])',"relicCraft({setId:'A01',slot:'core'})"])assert.equal(g.run(command+'.ok'),false,command);
  g.c.screenMode='home';g.c.paused=true;assert.equal(g.run('relicEnhance(target).ok'),false);
});
test('locked, equipped and preset-referenced items cannot be dismantled, duplicate selections refund once',()=>{
  const g=game();g.run("let a=relicCreate({setId:'A02',slot:'core'});let b=relicCreate({setId:'A02',slot:'armor'});relicStore.inventory.push(a,b);relicSave()");
  assert.equal(g.run("relicDismantle([relicStore.inventory[0].id]).ok"),false);
  g.run('relicToggleLock(a.id)');assert.equal(g.run('relicDismantle([a.id]).ok'),false);g.run('relicToggleLock(a.id)');
  g.run("relicEquip('astra',a.id);relicSavePreset('astra',0);relicUnequip('astra','core')");assert.equal(g.run('relicDismantle([a.id]).ok'),false);
  assert.equal(g.run('relicDismantle([b.id,b.id]).count'),1);assert.equal(g.run('relicStore.materials'),170);
});
test('quota failure rolls back all currency, inventory and upgrade changes',()=>{
  const g=game(),before=g.storage.get('zombieSurvivalRelicsV1');g.c.quota=true;
  assert.equal(g.run('relicEnhance(relicStore.inventory[0].id).ok'),false);assert.equal(g.run('relicStore.inventory[0].level'),0);assert.equal(g.run('relicStore.materials'),150);
  assert.equal(g.run("relicGrantReward({runId:'quota_run',kind:'end'}).ok"),false);assert.equal(g.run('relicStore.inventory.length'),6);assert.equal(g.storage.get('zombieSurvivalRelicsV1'),before);
  g.c.quota=false;assert.equal(g.run('relicEnhance(relicStore.inventory[0].id).ok'),true);
});
test('corrupted, future-version and invalid data are preserved without destructive overwrite',()=>{
  const good=game().storage.get('zombieSurvivalRelicsV1'),modified=JSON.parse(good);modified.inventory[0].substats.push(modified.inventory[0].substats[0]);
  for(const saved of ['{invalid',JSON.stringify({...JSON.parse(good),version:2}),JSON.stringify(modified),JSON.stringify({...JSON.parse(good),loadouts:[]})]){
    const g=game(saved);assert.equal(g.run('relicStorageBlocked'),true);assert.equal(g.run('relicSave().ok'),false);assert.equal(g.storage.get('zombieSurvivalRelicsV1'),saved);
  }
});
test('rewards are idempotent across reload and keep per-run material total within 150-250',()=>{
  const g=game();g.c.screenMode='game';
  assert.equal(g.run("relicGrantReward({runId:'test_run',kind:'boss',bossIndex:1,difficulty:'hard',rng:()=>0}).materials"),40);
  const count=g.run('relicStore.inventory.length');assert.equal(g.run("relicGrantReward({runId:'test_run',kind:'boss',bossIndex:1}).duplicate"),true);assert.equal(g.run('relicStore.inventory.length'),count);
  assert.equal(g.run("relicGrantReward({runId:'test_run',kind:'end',difficulty:'hard',rng:()=>0}).materials"),210);assert.equal(g.run('relicStore.materials'),400);assert.equal(g.run('relicStore.tickets.advanced'),1);
  const loaded=game(g.storage.get('zombieSurvivalRelicsV1'));assert.equal(loaded.run("relicGrantReward({runId:'test_run',kind:'end',difficulty:'hard'}).duplicate"),true);assert.equal(loaded.run('relicStore.materials'),400);
  assert.equal(loaded.run("relicGrantReward({runId:'test_run',kind:'boss',bossIndex:2}).ok"),false);assert.equal(loaded.run("relicGrantReward({runId:'__proto__',kind:'end'}).ok"),false);
});
test('crafting spends only earned tickets and advanced tickets fix the chosen main',()=>{
  const g=game();assert.equal(g.run("relicCraft({setId:'C17',slot:'lens',mainStat:'critChance'}).ok"),false);
  g.run("relicGrantReward({runId:'craft_run',kind:'boss',difficulty:'hard'});relicGrantReward({runId:'craft_run',kind:'end',difficulty:'hard'})");
  assert.equal(g.run("relicCraft({setId:'C17',slot:'lens',mainStat:'critChance'}).item.mainStat"),'critChance');assert.equal(g.run('relicStore.tickets.advanced'),0);
  assert.equal(g.run("relicCraft({setId:'D01',slot:'core'}).item.rarity"),'cursed');assert.equal(g.run('relicStore.tickets.standard'),0);
});
test('inventory caps at 300 and full-inventory rewards become usable crafting tickets',()=>{
  const g=game();g.run("while(relicStore.inventory.length<300)relicStore.inventory.push(relicCreate({setId:'A01',slot:'core'}));relicSave()");
  assert.equal(g.run("relicGrantReward({runId:'full_run',kind:'end'}).ok"),true);assert.equal(g.run('relicStore.inventory.length'),300);assert.equal(g.run('relicStore.tickets.standard'),2);
  assert.equal(g.run("relicCraft({setId:'A02',slot:'core'}).ok"),false);
});
