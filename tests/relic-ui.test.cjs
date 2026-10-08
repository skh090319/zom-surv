const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene(saved){
  const nodes=new Map(),storage=new Map(saved===undefined?[]:[['zombieSurvivalRelicsV1',saved]]),drawCalls=[],c={console,Math:Object.create(Math),screenMode:'home',selectedCharacter:'astra',paused:false,mouse:{down:true},characterSkillGuide:{astra:{name:'아스트라'}}};
  function element(id){if(!nodes.has(id))nodes.set(id,{id,hidden:true,innerHTML:'',textContent:'',children:[],prepend(child){this.children.unshift(child);},style:{setProperty(){}},dataset:{},isConnected:true,addEventListener(){},setAttribute(){},focus(){c.document.activeElement=this;},querySelector(){return element(id+'-close');}});return nodes.get(id);}
  c.document={getElementById:element,querySelector:element,createElement:()=>element('created'),body:{append(){}},activeElement:element('initial')};
  c.localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem(key,value){if(c.quota)throw new Error('quota');storage.set(key,value);}};
  c.setTimeout=()=>1;c.clearTimeout=()=>{};c.draw=()=>drawCalls.push('base');c.canvas={width:320,height:20000,focus(){}};
  c.ctx=new Proxy({font:'13px Arial'},{get(target,key){if(key in target)return target[key];if(key==='measureText')return text=>({width:[...text].reduce((n,ch)=>n+(/[^\x00-\x7f]/.test(ch)?1:.56),0)*(parseFloat(target.font.match(/[\d.]+px/)?.[0])||13)});return(...args)=>drawCalls.push({kind:key,args});}});
  c.drawRoundedRect=(...args)=>drawCalls.push({kind:'rect',args});c.registerGuideSection=section=>c.section=section;c.openGuideScreen=id=>{c.guideOpened=id;c.screenMode='guide';};c.Image=class{constructor(){this.complete=false;}};
  c.guideSectionTop=153;c.guideScrollY=0;c.guideScrollMax=0;c.guideContentTop=0;c.isMobileTouchDevice=()=>true;c.pointInRect=()=>false;
  vm.createContext(c);for(const file of ['17-relic-data.js','19-relic-ui.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
  const run=expression=>vm.runInContext(expression,c);
  function click(action){c.button={dataset:{action},disabled:false};run('onRelicUiClick({target:{closest:()=>button}})');}
  return {c,nodes,storage,drawCalls,run,click,element};
}

test('equipment screen consumes actual model data and restores its navigation origin',()=>{
  const g=scene();g.run('openRelicInventory()');assert.equal(g.c.screenMode,'relics');assert.equal(g.c.mouse.down,false);
  assert.match(g.element('relic-wallet').innerHTML,/150/);assert.match(g.element('relic-collection').innerHTML,/처형의 심지/);assert.match(g.element('relic-detail').innerHTML,/메인 속성/);
  g.click('close');assert.equal(g.c.screenMode,'home');g.c.screenMode='guide';g.run('openRelicInventory()');g.click('close');assert.equal(g.c.screenMode,'guide');
  g.c.screenMode='game';g.run('openRelicInventory()');assert.equal(g.c.screenMode,'game');
});
test('slot, rarity and Korean option search combine while filtering leaves inventory intact',()=>{
  const g=scene();g.run("relicStore.inventory.push(relicCreate({setId:'C17',slot:'lens',rarity:'legendary',mainStat:'critChance'}));relicView.slot='lens';relicView.rarity='legendary';relicView.query='치명타 확률';renderRelicInventory()");
  assert.equal(g.run('relicFilteredItems().length'),1);assert.match(g.element('relic-collection').innerHTML,/종말 관측경/);assert.equal(g.run('relicStore.inventory.length'),7);
  g.run("relicView.query='없는검색';renderRelicCollection()");assert.match(g.element('relic-collection').innerHTML,/조건에 맞는 유물이 없습니다/);
});
test('UI enhancement persists and a full storage failure reports error without deducting material',()=>{
  const g=scene();g.run('openRelicInventory()');g.click('enhance');assert.equal(g.run('relicStore.inventory[0].level'),1);assert.equal(g.run('relicStore.materials'),120);
  const before=g.storage.get('zombieSurvivalRelicsV1');g.c.quota=true;g.click('enhance');assert.equal(g.run('relicStore.materials'),120);assert.equal(g.run('relicStore.inventory[0].level'),1);assert.equal(g.storage.get('zombieSurvivalRelicsV1'),before);assert.match(g.element('relic-toast').textContent,/저장하지 못했습니다/);
});
test('preset overwrite requires confirmation; cancellation and repeated confirmation do not mutate',()=>{
  const g=scene();g.run('openRelicInventory()');g.click('save-preset');assert.equal(g.element('relic-confirm').hidden,false);assert.equal(g.run('relicStore.presets.astra'),undefined);
  g.click('cancel');assert.equal(g.run('relicStore.presets.astra'),undefined);g.click('save-preset');g.click('confirm');assert.ok(g.run('relicStore.presets.astra[0].core'));
  const saved=g.storage.get('zombieSurvivalRelicsV1');g.click('confirm');assert.equal(g.storage.get('zombieSurvivalRelicsV1'),saved);
  g.click('equip');assert.equal(g.run("relicEquippedItems('astra').length"),5);g.click('load-preset');assert.equal(g.run("relicEquippedItems('astra').length"),6);
});
test('dismantle confirmation reports materials and cannot remove protected presets or other loadouts',()=>{
  const g=scene();g.run("let spare=relicCreate({setId:'A02',slot:'core'});relicStore.inventory.push(spare);relicSave();relicView.selected=spare.id;renderRelicInventory()");
  g.click('dismantle');assert.equal(g.run('relicStore.inventory.length'),7);assert.match(g.element('relic-confirm-copy').textContent,/경험치 20/);g.click('cancel');assert.equal(g.run('relicStore.inventory.length'),7);
  g.click('dismantle');g.click('confirm');assert.equal(g.run('relicStore.inventory.length'),6);assert.equal(g.run('relicStore.materials'),170);
  g.run("relicView.selected=relicStore.inventory[0].id;relicUnequip('astra','core');renderRelicInventory()");assert.match(g.element('relic-detail').innerHTML,/data-action="dismantle" disabled/);g.click('dismantle');g.click('confirm');assert.equal(g.run('relicStore.inventory.length'),6);
});
test('craft choices use correct slot allowlist and cursed crafting requires explicit confirmation',()=>{
  const g=scene();g.run("relicStore.tickets={standard:2,advanced:1};relicView.craftSet='B01';relicView.craftSlot='core';renderRelicInventory()");
  assert.equal(g.run('relicView.craftSlot'),'emblem');assert.doesNotMatch(g.element('relic-craft').innerHTML,/<option value="core"/);
  g.run("relicView.craftSet='C17';relicView.craftSlot='lens';relicView.craftMain='critChance';renderRelicCraft()");g.click('craft');assert.equal(g.run('relicStore.tickets.advanced'),0);assert.equal(g.run('relicStore.inventory.at(-1).mainStat'),'critChance');assert.equal(g.run('relicStore.inventory.at(-1).rarity'),'epic');
  g.run("relicView.craftSet='D01';relicView.craftSlot='core';relicView.craftMain='';renderRelicCraft()");g.click('craft');assert.match(g.element('relic-confirm-copy').textContent,/받는 피해 \+8%/);assert.equal(g.run('relicStore.tickets.standard'),2);g.click('cancel');assert.equal(g.run('relicStore.tickets.standard'),2);
  g.click('craft');g.click('confirm');assert.equal(g.run('relicStore.tickets.standard'),1);assert.equal(g.run('relicStore.inventory.at(-1).rarity'),'cursed');
});
test('corrupt storage can still render the archive with no destructive save',()=>{
  const g=scene('{corrupt');g.run('openRelicInventory()');assert.match(g.element('relic-detail').innerHTML,/유물을 선택하세요/);assert.equal(g.storage.get('zombieSurvivalRelicsV1'),'{corrupt');assert.equal(g.run('relicStorageBlocked'),true);assert.match(g.element('relic-content').children[0].textContent,/손상되어 원본을 보존/);
});
