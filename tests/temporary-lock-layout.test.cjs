const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const tall=['oblivion','lush','mare','astra','aria'];
const regular=['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','moira','nullZero'];

function scene(width,height,{mobile=true,locks=true}={}){
  const draws=[],stack=[];
  const state={font:'12px Arial',textAlign:'left',textBaseline:'alphabetic',globalAlpha:1,filter:'none',shadowBlur:0};
  const ctx=new Proxy(state,{get(target,key){
    if(key in target)return target[key];
    if(key==='save')return()=>stack.push({...state});
    if(key==='restore')return()=>{const saved=stack.pop();assert.ok(saved,'balanced canvas restore');for(const k of Object.keys(state))delete state[k];Object.assign(state,saved);};
    if(key==='measureText')return text=>({width:Array.from(String(text)).reduce((n,ch)=>n+(/[^\x00-\x7f]/.test(ch)?1:.56),0)*(parseFloat(state.font.match(/[\d.]+px/)?.[0])||12)});
    return(...args)=>{
      for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),`${key} has finite coordinates`);
      draws.push({method:key,args,font:state.font,fill:state.fillStyle,filter:state.filter,alpha:state.globalAlpha});
      if(String(key).startsWith('create'))return{addColorStop(){}};
    };
  }});
  const context={console,Math,Map,performance,addEventListener(){},ctx,canvas:{width,height},mouse:{x:-100,y:-100},characterScrollY:0,characterScrollMax:0,characterCards:[],selectedCharacter:'yupiter',totalZombieKills:0,characterDetailId:null,isMobileTouchDevice:()=>mobile,isSuncallUnlocked:()=>true,isLuminousUnlocked:()=>true};
  if(locks){
    context.TEMPORARY_TALL_CHARACTER_IDS=Object.freeze([...tall]);
    context.isCharacterTemporarilyLocked=id=>tall.includes(id);
    context.isWorldStageTemporarilyLocked=(world,tier)=>world!==2||tier!=='hard';
    context.isRelicMenuTemporarilyLocked=()=>true;
  }
  vm.createContext(context);
  const run=source=>vm.runInContext(source,context);
  run(fs.readFileSync(path.join(root,'js/08-ui.js'),'utf8'));
  run("characterSkillGuide.lush={name:'LusH',passive:'행운을 다루는 생존자',skills:[]};characterSkillGuide.oblivion={name:'오블리비언',passive:'봉인된 힘을 다루는 생존자',skills:[]};drawMenuBackdrop=()=>{};getCharacterPreviewSprite=()=>({complete:true,naturalWidth:240,naturalHeight:360});");
  return{context,draws,run,depth:()=>stack.length};
}

test('five columns preserve normal order and a separate full bottom row on phones, tablets and desktop',()=>{
  for(const[width,height]of[[568,320],[667,375],[844,390],[1024,768],[1180,820],[1280,720],[1920,1080]]){
    for(const locks of[false,true]){
      const g=scene(width,height,{mobile:width<1280,locks}),layout=g.run('getCharacterSelectLayout()');
      assert.equal(layout.columns,5);
      assert.deepEqual(Array.from(layout.cards.slice(0,14),card=>card.id),regular);
      assert.deepEqual(Array.from(layout.cards.slice(14),card=>card.id),tall);
      assert.equal(new Set(layout.cards.slice(0,5).map(card=>card.y)).size,1);
      assert.equal(new Set(layout.cards.slice(0,5).map(card=>card.x)).size,5);
      assert.equal(new Set(layout.cards.slice(14).map(card=>card.y)).size,1);
      assert.ok(layout.cards[14].y-layout.cards[13].y-layout.cardH>=48-1e-8);
      for(const card of layout.cards){
        assert.ok(card.x>=18&&card.x+card.w<=width-18,'card stays inside horizontal viewport');
        assert.equal(card.disabled,locks&&tall.includes(card.id));
      }
      g.context.characterScrollY=1e6;
      const end=g.run('getCharacterSelectLayout()');
      assert.equal(end.scrollY,end.scrollMax);
      for(const card of end.cards.slice(14))assert.ok(Math.abs(card.y+card.h-(height-18))<1e-8,'the last footer is reachable');
      g.context.characterScrollY=-30;assert.equal(g.run('getCharacterSelectLayout().scrollY'),0);
    }
  }
});

test('locked characters retain readable names and canvas locks without selection or hover affordances',()=>{
  for(const[width,height]of[[568,320],[844,390],[1280,720]]){
    const g=scene(width,height);g.context.characterScrollY=1e6;g.context.selectedCharacter='oblivion';
    g.run('drawCharacterSelectScreen()');
    const idle=g.draws.filter(d=>d.method==='roundRect').map(d=>d.args);
    const lockedCard=g.context.characterCards.find(card=>card.id==='oblivion');
    g.draws.length=0;g.context.mouse={x:lockedCard.x+lockedCard.w/2,y:Math.max(lockedCard.visibleTop,lockedCard.y+100)};
    g.run('drawCharacterSelectScreen()');
    assert.deepEqual(g.draws.filter(d=>d.method==='roundRect').map(d=>d.args),idle,'hover cannot lift or select a locked card');
    const labels=g.draws.filter(d=>d.method==='fillText'&&d.args[2]>=lockedCard.y&&d.args[2]<=lockedCard.y+lockedCard.h).map(d=>d.args[0]);
    for(const name of['오블리비언','LusH','마레','아스트라','아리아'])assert.ok(labels.includes(name),`${name} remains visible`);
    assert.equal(labels.filter(label=>label==='일시 잠금').length,5);
    assert.ok(!labels.some(label=>/선택하기|현재 선택됨|스킬 보기/.test(label)));
    assert.equal(g.draws.filter(d=>d.method==='drawImage'&&d.filter.includes('grayscale')).length,5);
    assert.equal(g.depth(),0);
  }
});

test('the world picker displays all nine stages while only 2-3 is active and every other stage has a padlock',()=>{
  for(const[width,height]of[[568,320],[844,390],[1180,820],[1280,720]]){
    const g=scene(width,height);
    Object.assign(g.context,{homeDifficultyOpen:true,selectedWorld:2,selectedStageDifficulty:'hard',lobbyButtonPanelLoaded:false,homeDifficultyChoiceRects:[],homeWorldCloseRect:null,
      GAME_WORLDS:[1,2,3].map(id=>({id,name:`세계 ${id}`,color:'#84d5fb',story:['첫 번째 이야기','두 번째 이야기']})),getWorldStageLabel:()=> '2-3',getWorldBackgroundImage:()=>({complete:false})});
    let locks=0;g.context.recordLock=()=>locks++;g.run('const originalLock=drawMenuPadlock;drawMenuPadlock=(...args)=>{recordLock();originalLock(...args)};drawHomeDifficultyPicker()');
    assert.equal(locks,8);
    assert.equal(g.context.homeDifficultyChoiceRects.length,9);
    assert.deepEqual(Array.from(g.context.homeDifficultyChoiceRects.filter(rect=>!rect.disabled),rect=>[rect.world,rect.value]),[[2,'hard']]);
    for(const rect of g.context.homeDifficultyChoiceRects)assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=width&&rect.y+rect.h<=height&&rect.h>=28);
    assert.ok(g.draws.some(d=>d.method==='fillText'&&d.args[0]==='2-3'&&d.fill==='#fff'));
    assert.equal(g.depth(),0);
  }
});
