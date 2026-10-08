const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene(saved){
  const nodes=new Map(),storage=new Map(saved===undefined?[]:[['zombieSurvivalRelicsV1',saved]]),drawCalls=[],c={console,Math:Object.create(Math),screenMode:'home',selectedCharacter:'astra',paused:false,mouse:{down:true},characterSkillGuide:{astra:{name:'아스트라'},lush:{name:'LusH'},oblivion:{name:'오블리비언'}}};
  function element(id){if(!nodes.has(id))nodes.set(id,{id,hidden:true,innerHTML:'',textContent:'',children:[],prepend(child){this.children.unshift(child);},style:{setProperty(){}},dataset:{},isConnected:true,addEventListener(){},setAttribute(){},focus(){c.document.activeElement=this;},querySelector(){return element(id+'-close');}});return nodes.get(id);}
  c.document={getElementById:element,querySelector:element,createElement:()=>element('created'),body:{append(){}},activeElement:element('initial')};
  c.localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem(key,value){if(c.quota)throw new Error('quota');storage.set(key,value);}};
  c.setTimeout=()=>1;c.clearTimeout=()=>{};c.draw=()=>drawCalls.push('base');c.canvas={width:320,height:20000,focus(){}};
  c.ctx=new Proxy({font:'13px Arial'},{get(target,key){if(key in target)return target[key];if(key==='measureText')return text=>({width:[...text].reduce((n,ch)=>n+(/[^\x00-\x7f]/.test(ch)?1:.56),0)*(parseFloat(target.font.match(/[\d.]+px/)?.[0])||13)});return(...args)=>drawCalls.push({kind:key,args});}});
  c.drawRoundedRect=(...args)=>drawCalls.push({kind:'rect',args});c.registerGuideSection=section=>c.section=section;c.openGuideScreen=id=>{c.guideOpened=id;c.screenMode='guide';};c.Image=class{constructor(){this.complete=false;}};
  c.portraitRequests=[];c.getCharacterPreviewSprite=(id,thumbnail=false)=>{c.portraitRequests.push({id,thumbnail});return{assetSource:'assets/test/'+id+'-body.webp',src:'assets/test/'+id+'-body.webp'};};
  c.guideSectionTop=153;c.guideScrollY=0;c.guideScrollMax=0;c.guideContentTop=0;c.isMobileTouchDevice=()=>true;c.pointInRect=()=>false;
  vm.createContext(c);for(const file of ['17-relic-data.js','19-relic-ui.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
  const run=expression=>vm.runInContext(expression,c);
  function click(action){c.button={dataset:{action},disabled:false};run('onRelicUiClick({target:{closest:()=>button}})');}
  function clickSlot(slot){c.button={dataset:{slot},disabled:false};run('onRelicUiClick({target:{closest:()=>button}})');}
  return {c,nodes,storage,drawCalls,run,click,clickSlot,element};
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
  const g=scene('{corrupt');g.run('openRelicInventory()');assert.match(g.element('relic-detail').innerHTML,/보유 유물이 없습니다/);assert.equal(g.storage.get('zombieSurvivalRelicsV1'),'{corrupt');assert.equal(g.run('relicStorageBlocked'),true);assert.match(g.element('relic-content').children[0].textContent,/손상되어 원본을 보존/);
});

test('equipment overview shows the selected full-body portrait beside exactly six slot controls',()=>{
  const g=scene();
  for(const hero of ['astra','lush','oblivion']){
    g.c.selectedCharacter=hero;g.run('openRelicInventory()');
    const html=g.element('relic-content').innerHTML;
    assert.match(html,new RegExp('src="assets/test/'+hero+'-body\\.webp"'));
    const slots=[...html.matchAll(/data-slot="([^"]+)"/g)].map(match=>match[1]);
    assert.deepEqual(slots,['core','armor','lens','boots','emblem','power']);
    assert.ok(g.c.portraitRequests.some(request=>request.id===hero&&!request.thumbnail));
  }
});
test('empty equipment slots retain their controls without showing art for unowned relics',()=>{
  const g=scene();g.run("relicUnequip('astra','core');renderRelicInventory()");
  let html=g.element('relic-content').innerHTML;
  const emptySlot=html.match(/<button\b[^>]*data-slot="core"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(emptySlot,'core slot is still available');assert.doesNotMatch(emptySlot,/<img\b/);
  g.run('relicStore.inventory=[];relicStore.loadouts={};relicView.selected=null;renderRelicInventory()');
  html=g.element('relic-content').innerHTML;
  const slotButtons=[...html.matchAll(/<button\b[^>]*data-slot="[^"]+"[^>]*>[\s\S]*?<\/button>/g)];
  assert.equal(slotButtons.length,6);for(const [button] of slotButtons)assert.doesNotMatch(button,/<img\b/);
  assert.doesNotMatch(g.element('relic-collection').innerHTML,/data-select=/);
});
test('selecting an empty slot chooses only a matching owned piece and never another slot',()=>{
  const g=scene();g.run("relicUnequip('astra','core');relicView.selected=relicStore.inventory.find(item=>item.slot==='boots').id;renderRelicInventory()");
  g.clickSlot('core');assert.equal(g.run('relicView.slot'),'core');assert.equal(g.run('relicStore.inventory.find(item=>item.id===relicView.selected)?.slot'),'core');
  g.run("relicStore.inventory=relicStore.inventory.filter(item=>item.slot!=='core');relicView.slot='';relicView.selected=relicStore.inventory.find(item=>item.slot==='boots').id");
  g.clickSlot('core');assert.equal(g.run('relicView.slot'),'core');assert.equal(g.run('relicView.selected'),null);
  assert.doesNotMatch(g.element('relic-detail').innerHTML,/<img\b/);
});
test('relic archive lists only owned sets and has no unowned art requests when empty',()=>{
  const g=scene();g.run('drawRelicGuide()');
  let text=g.drawCalls.filter(call=>call.kind==='fillText').map(call=>call.args[0]).join('');
  assert.match(text,/처형자의 흔적/);assert.match(text,/별을 삼킨 궤도/);assert.doesNotMatch(text,/마력 폭주의 잔해|별의 종말을 목격한 자|검은 태양의 성약/);
  g.drawCalls.length=0;g.run("relicStore.inventory.push(relicCreate({setId:'C17',slot:'lens'}));drawRelicGuide()");
  text=g.drawCalls.filter(call=>call.kind==='fillText').map(call=>call.args[0]).join('');assert.match(text,/별의 종말을 목격한 자/);
  assert.equal(g.run("relicGuideImages.has('assets/relics-v1/C17-lens.webp')"),true,'archive art comes from the owned piece');
  assert.equal(g.run("relicGuideImages.has('assets/relics-v1/C17-core.webp')"),false,'an unowned core is not shown as a set illustration');
  g.drawCalls.length=0;g.run('relicStore.inventory=[];relicGuideImages.clear();drawRelicGuide()');
  assert.equal(g.run('relicGuideImages.size'),0);
  text=g.drawCalls.filter(call=>call.kind==='fillText').map(call=>call.args[0]).join('');assert.match(text,/보유|소지|획득/);assert.doesNotMatch(text,/처형자의 흔적|별을 삼킨 궤도|별의 종말을 목격한 자/);
});
test('filter changes reconcile detail selection and clicking a slot clears unrelated filters',()=>{
  const g=scene();g.run("relicStore.inventory.push(relicCreate({setId:'C17',slot:'lens',rarity:'legendary',mainStat:'critChance'}));openRelicInventory();relicView.slot='lens';relicView.rarity='legendary';renderRelicInventory()");
  assert.match(g.element('relic-detail').innerHTML,/종말 관측경/);
  assert.equal(g.run('relicStore.inventory.find(item=>item.id===relicView.selected).rarity'),'legendary');
  g.run("relicView.query='존재하지않는유물';relicSyncSelection();renderRelicCollection();renderRelicDetail()");
  assert.equal(g.run('relicView.selected'),null);assert.doesNotMatch(g.element('relic-detail').innerHTML,/<img\b/);
  g.clickSlot('armor');assert.equal(g.run('relicView.slot'),'armor');assert.equal(g.run('relicView.rarity'),'');assert.equal(g.run('relicView.query'),'');
  assert.equal(g.run('relicStore.inventory.find(item=>item.id===relicView.selected).slot'),'armor');
  g.clickSlot('armor');assert.equal(g.run('relicView.slot'),'armor','repeated slot click stays in that slot rather than showing all pieces');
});
