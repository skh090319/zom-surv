const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
function scene(){
  const elements=new Map(),document={activeElement:null};
  class Element{
    constructor(tag='div'){this.tagName=tag.toUpperCase();this.hidden=false;this.dataset={};this.attrs={};this.events={};this.children=[];this.classes=new Set();this.classList={toggle:(name,active)=>active?this.classes.add(name):this.classes.delete(name)};}
    set id(value){this._id=value;elements.set(value,this);}get id(){return this._id;}
    set innerHTML(value){this.html=value;this.children=[];if(this.id==='run-results')for(const action of ['scroll','home','restart']){const child=new Element(action==='scroll'?'div':'button');child.parent=this;if(action==='scroll')child.tabIndex=0;else child.dataset.runAction=action;this.children.push(child);}}
    get innerHTML(){return this.html||'';}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
    addEventListener(k,fn){this.events[k]=fn;}append(child){child.parent=this;this.children.push(child);}contains(child){return child===this||this.children.includes(child);}
    closest(selector){return selector==='[data-run-action]'&&this.dataset.runAction?this:null;}
    querySelectorAll(){return this.children;}focus(){document.activeElement=this;}
  }
  document.createElement=tag=>new Element(tag);document.getElementById=id=>elements.get(id)||null;document.body=new Element('body');
  const canvas=new Element('canvas'),c={console,Math,document,canvas,performance:{now:()=>10},clearTimeout(){},screenMode:'game',selectedCharacter:'aria',selectedDifficulty:'easy',gameOver:false,raidVictory:false,paused:false,choosingUpgrade:false,player:{damage:20,speed:4,hp:100,maxHp:100,kills:42,score:780,level:12},keys:{w:true},mouse:{down:true},zombies:[],
    mobileAttackTouchId:7,mobileAttackAim:{dragged:true},mobileSkillAim:{key:'q'},mobileUiGesture:null,mobileUpdateAccumulator:20,lastLoopTime:0,
    inventory:[{id:'old-inventory',setId:'A01',slot:'core',rarity:'common',level:0}],stats:{},sets:{},grants:[],nextReward:{ok:true,items:[],materials:0},restarts:0,draws:0,portrait:false,
    RELIC_RARITIES:{common:{name:'일반',color:'#a1a8b3'},legendary:{name:'전설',color:'#f4d35e'}},RELIC_SLOTS:{core:{name:'코어'}},
    relicArtPath:item=>`assets/relics-v2/${item.setId}-${item.slot}.webp`,relicUiName:item=>'유물 '+item.id,relicCharacterName:()=> '아리아',getWorldStageLabel:()=> '2-1',isMobilePortraitMode:()=>c.portrait,
    relicEquippedItems:()=>c.inventory,relicStatsForItems:()=>({stats:c.stats,setCounts:c.sets}),relicGrantReward:args=>{c.grants.push(args);return c.nextReward;},
    releaseMobileJoystick(){c.joystickReleased=true;},cancelMobileSkillAim(){c.mobileSkillAim=null;},stopMobileScrollInertia(){c.scrollStopped=true;},
    restart(){c.restarts++;c.gameOver=false;c.raidVictory=false;},draw(){c.draws++;}};
  vm.createContext(c);const run=code=>vm.runInContext(code,c);
  run(fs.readFileSync(path.join(root,'js/18-relic-combat.js'),'utf8'));run('relicBeginRun()');run(fs.readFileSync(path.join(root,'js/22-run-results.js'),'utf8'));
  return{c,run,element:()=>document.getElementById('run-results'),reward(item,kind='boss',index=0){c.nextReward={ok:true,items:[item],materials:40};run(`relicGrantCombatReward(${JSON.stringify(kind)},${index})`);}};
}
const item=id=>({id,setId:'A07',slot:'core',rarity:'legendary',level:0,substats:[{stat:'atkPct',count:1}]});

test('results ledger snapshots only newly granted run items, not old inventory or equipped relics',()=>{
  const g=scene(),reward=item('new-relic');g.reward(reward);reward.level=15;reward.substats[0].count=9;
  assert.equal(g.run('relicRunRewardSummary().items.length'),1);assert.equal(g.run('relicRunRewardSummary().items[0].id'),'new-relic');
  assert.equal(g.run('relicRunRewardSummary().items[0].level'),0);assert.equal(g.run('relicRunRewardSummary().items[0].substats[0].count'),1);
  assert.equal(g.run('Object.isFrozen(relicRunRewardSummary().items[0].substats)'),true);assert.equal(g.run('relicRunRewardSummary().materials'),40);
});
test('failed, repeated, unchanged and persistent duplicate rewards never duplicate the report',()=>{
  const g=scene();g.reward(item('one'));g.reward(item('one'));assert.equal(g.c.grants.length,1);
  g.c.nextReward={ok:false,message:'저장 실패'};g.run('relicGrantCombatReward("boss",1)');assert.equal(g.run('relicRun.rewards.has("boss:1")'),false);assert.equal(g.run('relicRunRewardSummary().error'),'저장 실패');
  g.reward(item('two'),'boss',1);assert.equal(g.run('relicRunRewardSummary().items.length'),2);
  g.c.nextReward={ok:true,duplicate:true,items:[item('fake')],materials:300};g.run('relicGrantCombatReward("clear")');
  g.c.nextReward={ok:true,unchanged:true,items:[item('fake2')],materials:300};g.run('relicGrantCombatReward("defeat")');
  assert.equal(g.run('relicRunRewardSummary().items.length'),2);assert.equal(g.run('relicRunRewardSummary().materials'),80);
});
test('death and clear each render run rewards once without rolling or granting from draw',()=>{
  for(const clear of [false,true]){
    const g=scene();g.reward(item('boss-loot'));g.reward(item('end-loot'),clear?'clear':'defeat');g.c.gameOver=!clear;g.c.raidVictory=clear;
    const grants=g.c.grants.length;g.run('draw()');const el=g.element(),markup=el.innerHTML;assert.equal(el.hidden,false);assert.ok(markup.includes(clear?'작전 완료':'작전 종료'));assert.ok(markup.includes('boss-loot'));assert.ok(markup.includes('end-loot'));assert.ok(!markup.includes('old-inventory'));assert.ok(markup.includes('--stamp-delay:100ms'));
    for(let i=0;i<60;i++)g.run('draw()');assert.equal(g.c.grants.length,grants);assert.equal(el.innerHTML,markup);assert.equal(g.c.draws,0);assert.equal(g.c.canvas.getAttribute('aria-hidden'),'true');
  }
});
test('restart clears the result and reward ledger, releases held input, and starts once',()=>{
  const g=scene();g.reward(item('loot'));g.c.gameOver=true;g.run('draw()');const oldId=g.run('relicRun.id');
  assert.equal(g.run('runResultsChoose("restart")'),true);assert.equal(g.c.restarts,1);assert.equal(g.c.screenMode,'game');assert.equal(g.c.gameOver,false);assert.notEqual(g.run('relicRun.id'),oldId);assert.equal(g.run('relicRunRewardSummary().items.length'),0);
  assert.equal(g.run('runResultsIsOpen()'),false);assert.equal(g.element().hidden,true);assert.equal(g.c.mouse.down,false);assert.equal(g.c.keys.w,false);assert.equal(g.c.mobileAttackTouchId,null);assert.equal(g.c.mobileSkillAim,null);assert.equal(g.c.mobileUpdateAccumulator,0);assert.equal(g.c.canvas.getAttribute('aria-hidden'),null);
  assert.equal(g.run('runResultsChoose("restart")'),false);assert.equal(g.c.restarts,1);
});
test('home button ends the result without starting a new game or changing saved inventory',()=>{
  const g=scene();g.reward(item('loot'));g.c.raidVictory=true;g.run('draw()');const inventory=JSON.stringify(g.c.inventory);
  const button=g.element().children.find(el=>el.dataset.runAction==='home');g.element().events.click({target:button});
  assert.equal(g.c.screenMode,'home');assert.equal(g.c.restarts,0);assert.equal(g.c.gameOver,false);assert.equal(g.c.raidVictory,false);assert.equal(g.run('relicRun'),null);assert.equal(JSON.stringify(g.c.inventory),inventory);assert.equal(g.run('runResultsIsOpen()'),false);g.run('draw()');assert.equal(g.c.draws,1);
});
test('keyboard focus is trapped in results while native button activation remains possible',()=>{
  const g=scene();g.c.gameOver=true;g.run('draw()');const el=g.element();assert.equal(g.c.document.activeElement,el);
  let stopped=0,prevented=0;el.events.keydown({key:'Tab',shiftKey:false,stopPropagation(){stopped++;},preventDefault(){prevented++;}});assert.equal(g.c.document.activeElement,el.children[0]);
  el.children[2].focus();el.events.keydown({key:'Tab',shiftKey:false,stopPropagation(){stopped++;},preventDefault(){prevented++;}});assert.equal(g.c.document.activeElement,el.children[0]);
  el.events.keydown({key:'Enter',stopPropagation(){stopped++;},preventDefault(){prevented++;}});assert.equal(g.c.restarts,0);assert.equal(stopped,3);assert.equal(prevented,2);
});
test('portrait lock temporarily hides results and restores them without regranting',()=>{
  const g=scene();g.reward(item('loot'));g.c.gameOver=true;g.run('draw()');const html=g.element().innerHTML;
  g.c.portrait=true;g.run('draw()');assert.equal(g.element().hidden,true);assert.equal(g.c.draws,1);
  g.c.portrait=false;g.run('draw()');assert.equal(g.element().hidden,false);assert.equal(g.element().innerHTML,html);assert.equal(g.c.grants.length,1);
});
test('empty reward and save failure reports remain explicit and keep both actions usable',()=>{
  const g=scene();g.c.nextReward={ok:false,message:'저장 공간을 확인해주세요.'};g.run('relicGrantCombatReward("defeat")');g.c.gameOver=true;g.run('draw()');
  assert.ok(g.element().innerHTML.includes('획득한 유물이 없습니다'));assert.ok(g.element().innerHTML.includes('저장 공간을 확인해주세요.'));assert.ok(g.element().innerHTML.includes('data-run-action="home"'));assert.ok(g.element().innerHTML.includes('data-run-action="restart"'));
});
test('result markup escapes names and uses real relic artwork with a safe frame inset',()=>{
  const g=scene();g.c.relicUiName=()=>'<script>bad()</script>';g.reward(item('loot'));g.c.gameOver=true;g.run('draw()');
  assert.ok(g.element().innerHTML.includes('&lt;script&gt;'));assert.ok(g.element().innerHTML.includes('assets/relics-v2/A07-core.webp'));assert.ok(!g.element().innerHTML.includes('<script>'));
  const css=fs.readFileSync(path.join(root,'run-results.css'),'utf8');assert.match(css,/relic-card-frame-v1\.webp/);assert.match(css,/padding:20px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/min-height:42px/);assert.match(css,/\.run-results-scroll\{[^}]*overflow:auto/);
});
test('Enter is no longer a global game-over restart shortcut',()=>{
  const source=fs.readFileSync(path.join(root,'js/03-input.js'),'utf8');assert.doesNotMatch(source,/\(gameOver\s*\|\|\s*raidVictory\).*key\s*===\s*["']enter/);assert.match(source,/runResultsIsOpen\(\)\)return/);
});

test('reward card color and stamp flash stay inside the same metal frame opening',()=>{
  const css=fs.readFileSync(path.join(root,'run-results.css'),'utf8');
  const card=css.match(/\.run-reward-card\{([^}]+)\}/)?.[1],fill=css.match(/\.run-reward-card::after\{([^}]+)\}/)?.[1];
  assert.match(card,/background:transparent;border:0/);assert.match(card,/isolation:isolate/);
  assert.match(fill,/inset:8px/);assert.match(fill,/z-index:-1/);assert.match(fill,/background:linear-gradient/);
  assert.match(css,/\.run-reward-card::before\{[^}]*border-image:url\('assets\/relic-card-frame-v1\.webp'\)/);
  assert.match(css,/@keyframes run-reward-flash\{0%,28%\{filter:brightness\(1\)/);
  assert.match(css,/\.run-reward-card.is-legendary::before\{filter:drop-shadow/);
  assert.doesNotMatch(css,/\.run-reward-card::after\{opacity:0\}/,'reduced motion must retain the inset rarity fill');
});
