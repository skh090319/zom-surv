const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

function scene(){
  const nodes=new Map(),storage=new Map(),draws=[],listeners={},timers=[];
  const c={console,Math,performance,URLSearchParams,screenMode:'home',selectedCharacter:'yupiter',mouse:{down:true},
    locked:true,isRelicMenuTemporarilyLocked:()=>c.locked,isCharacterTemporarilyLocked:id=>c.locked&&['oblivion','lush','mare','astra','aria'].includes(id),
    characterSkillGuide:{yupiter:{name:'유피테르',color:'#64ef91'}},characterCards:[],characterDetailId:null,characterDetailOpenedAt:0,characterDetailSkillIndex:0,
    characterScrollY:0,characterScrollMax:500,guideScrollY:0,guideScrollMax:0,guideSectionTop:153,guideContentTop:0,
    navigator:{maxTouchPoints:1},matchMedia:()=>({matches:true}),location:{search:''},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
    setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},addEventListener(){},
    draw:()=>draws.push(['base']),drawRoundedRect:(...args)=>draws.push(['rect',...args]),drawMenuPadlock:(...args)=>draws.push(['padlock',...args]),
    drawLobbyBackdrop(){},drawLobbyPanel:(...args)=>draws.push(['panel',...args]),drawBloodiedLobbyTitle(){},drawHomeDifficultyPicker(){},difficultyLabel:()=> '2-3',
    getCharacterPreviewSprite:()=>null,registerGuideSection:section=>{c.section=section;},isMobileTouchDevice:()=>true,
    Image:class{constructor(){this.complete=false;}},pointInRect:(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
    homeStartRect:{},homeCharacterRect:{},homeCodexRect:{},homeRelicRect:{},homeSettingsRect:{},homeDifficultyRect:{},homeDifficultyOpen:false,
  };
  function element(id){
    if(!nodes.has(id))nodes.set(id,{id,hidden:true,innerHTML:'',textContent:'',dataset:{},isConnected:true,style:{setProperty(){}},setAttribute(){},addEventListener(){},focus(){c.document.activeElement=this;},querySelector(){return element(id+'-close');}});
    return nodes.get(id);
  }
  c.document={getElementById:element,querySelector:element,activeElement:element('initial'),body:{append(){}},createElement:()=>element('created')};
  c.canvas={width:844,height:390,focus(){},getBoundingClientRect:()=>({left:0,top:0,width:c.canvas.width,height:c.canvas.height}),addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)};
  c.ctx=new Proxy({},{get(target,key){if(key in target)return target[key];return(...args)=>{draws.push([key,...args]);if(key.startsWith('create'))return{addColorStop(){}};if(key==='measureText')return{width:String(args[0]).length*7};};}});
  vm.createContext(c);
  const run=code=>vm.runInContext(code,c),load=file=>run(fs.readFileSync(path.join(root,'js',file),'utf8'));
  return{c,nodes,storage,draws,timers,element,run,load,touch(type,id,x,y){for(const fn of listeners[type]||[])fn({type,preventDefault(){},changedTouches:[{identifier:id,clientX:x,clientY:y}]});}};
}

test('mobile long-press rejects all temporarily locked characters without changing selection state',()=>{
  const g=scene();g.load('08-mobile.js');g.c.screenMode='character';
  for(const id of ['oblivion','lush','mare','astra','aria']){
    g.c.characterCards=[{id,x:10,y:10,w:90,h:140}];
    g.touch('touchstart',1,50,80);g.timers.at(-1)();
    assert.equal(g.c.characterDetailId,null);assert.equal(g.c.characterDetailOpenedAt,0);assert.equal(g.c.mouse.down,true);
  }
  g.c.characterCards=[{id:'yupiter',x:10,y:10,w:90,h:140}];
  g.touch('touchstart',1,50,80);g.timers.at(-1)();
  assert.equal(g.c.characterDetailId,'yupiter');assert.equal(g.c.mouse.down,false);
});

test('mobile details respect disabled card metadata and the visible scroll viewport',()=>{
  const g=scene();g.load('08-mobile.js');g.c.screenMode='character';g.c.locked=false;
  g.c.characterCards=[{id:'yupiter',x:10,y:10,w:90,h:140,disabled:true}];
  assert.equal(g.run('openMobileCharacterDetail({x:50,y:80})'),false);
  g.c.characterCards=[{id:'yupiter',x:10,y:10,w:90,h:140,visibleTop:70,visibleBottom:130}];
  assert.equal(g.run('openMobileCharacterDetail({x:50,y:50})'),false);
  assert.equal(g.run('openMobileCharacterDetail({x:50,y:140})'),false);
  assert.equal(g.run('openMobileCharacterDetail({x:50,y:90})'),true);
});

test('mobile home relic button uses a disabled panel and padlock at every supported short size',()=>{
  const g=scene();g.load('08-mobile.js');
  for(const [width,height] of [[568,280],[667,320],[844,390]]){
    Object.assign(g.c.canvas,{width,height});g.draws.length=0;g.run('drawMobileHomeScreen()');
    const rect=g.c.homeRelicRect,panel=g.draws.find(call=>call[0]==='panel'&&call[1]===rect);
    assert.equal(rect.disabled,true);assert.equal(panel[3].disabled,true);
    assert.ok(g.draws.some(call=>call[0]==='padlock'&&call[1]>=rect.x&&call[1]<=rect.x+rect.w));
    assert.ok(g.draws.some(call=>call[0]==='fillText'&&call[1]==='유물 · 잠금'));
    assert.equal(g.c.homeCharacterRect.disabled,false);assert.equal(g.c.homeCodexRect.disabled,false);
  }
  g.c.locked=false;g.draws.length=0;g.run('drawMobileHomeScreen()');assert.equal(g.c.homeRelicRect.disabled,false);
  assert.ok(g.draws.some(call=>call[0]==='fillText'&&call[1]==='유물'));
});

test('inventory, modal and mutation entry points preserve owned relics, equipment, presets and storage while locked',()=>{
  const g=scene();g.load('17-relic-data.js');g.load('19-relic-ui.js');
  const store=g.run('JSON.stringify(relicStore)'),saved=JSON.stringify([...g.storage]),view=g.run('JSON.stringify(relicView)'),feed=g.run('JSON.stringify(relicFeedView)');
  for(const mode of ['home','guide','game']){g.c.screenMode=mode;assert.equal(g.run('openRelicInventory()'),false);assert.equal(g.c.screenMode,mode);}
  for(const code of ['ensureRelicScreen()','renderRelicInventory()','renderRelicCollection()','renderRelicDetail()','renderRelicCraft()','renderRelicFeed()','confirmRelicFeed()','openRelicFeed(relicStore.inventory[0])','openRelicConfirm("test","test",()=>relicStore.inventory=[])'])g.run(code);
  assert.equal(g.run('relicUiMutation(()=>{relicStore.inventory=[];return{ok:true};}).ok'),false);
  for(const action of ['equip','lock','enhance','feed-apply','save-preset','load-preset','dismantle','craft','confirm']){
    g.c.button={disabled:false,dataset:{action}};g.run('onRelicUiClick({target:{closest:()=>button}})');
  }
  for(const dataset of [{select:'other'},{slot:'core'},{feedItem:'other'}]){g.c.button={disabled:false,dataset};g.run('onRelicUiClick({target:{closest:()=>button}})');}
  g.run('onRelicUiChange({target:{id:"relic-craft-set",value:"D01"}})');
  assert.equal(g.run('JSON.stringify(relicStore)'),store);assert.equal(JSON.stringify([...g.storage]),saved);
  assert.equal(g.run('JSON.stringify(relicView)'),view);assert.equal(g.run('JSON.stringify(relicFeedView)'),feed);assert.equal(g.run('relicConfirmAction'),null);
  assert.equal(g.nodes.size,1,'blocked entries never create inventory DOM');
});

test('owned relic archive remains readable while its inventory button is visibly and behaviorally locked',()=>{
  const g=scene();g.load('17-relic-data.js');g.load('19-relic-ui.js');g.c.screenMode='guide';g.c.canvas.height=900;
  g.run('drawRelicGuide()');const rect=g.run('relicGuideEquipRect');
  assert.equal(rect.disabled,true);assert.ok(g.draws.some(call=>call[0]==='padlock'));
  assert.ok(g.draws.some(call=>call[0]==='fillText'&&call[1]==='유물 장비 · 임시 잠금'));
  g.c.openRelicInventory=()=>{throw new Error('locked guide button must not invoke inventory opener');};
  assert.equal(g.c.section.onClick(rect.x+20,rect.y+20),true);assert.equal(g.c.screenMode,'guide');
  g.c.locked=false;let opened=0;g.c.openRelicInventory=()=>{opened++;};g.run('drawRelicGuide()');
  assert.equal(g.c.section.onClick(rect.x+20,rect.y+20),true);assert.equal(opened,1);
});

test('a stale inventory view closes on draw after the menu is locked without editing stored relics',()=>{
  const g=scene();g.load('17-relic-data.js');g.load('19-relic-ui.js');g.c.screenMode='relics';g.element('relic-screen').hidden=false;
  const before=g.run('JSON.stringify(relicStore)');g.run('draw()');
  assert.equal(g.c.screenMode,'home');assert.equal(g.element('relic-screen').hidden,true);assert.equal(g.run('JSON.stringify(relicStore)'),before);
  assert.ok(g.draws.some(call=>call[0]==='base'));
});
