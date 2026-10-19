// End-of-sortie presentation. Reward grants stay exclusively in combat hooks;
// this layer only reads the immutable run ledger and never rolls/grants loot.
const runResultsView={key:null,open:false,busy:false,canvasHidden:null};
function runResultsIsOpen(){return runResultsView.open;}
function runResultsEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function runResultsResetInput(){
  if(typeof keys!=='undefined')for(const key of Object.keys(keys))keys[key]=false;
  if(typeof mouse!=='undefined')mouse.down=false;
  if(typeof releaseMobileJoystick==='function')releaseMobileJoystick();
  if(typeof cancelMobileSkillAim==='function')cancelMobileSkillAim();
  if(typeof stopMobileScrollInertia==='function')stopMobileScrollInertia();
  if(typeof mobileAttackTouchId!=='undefined')mobileAttackTouchId=null;
  if(typeof mobileAttackAim!=='undefined')mobileAttackAim=null;
  if(typeof mobileSkillAim!=='undefined')mobileSkillAim=null;
  if(typeof mobileUiGesture!=='undefined'){if(mobileUiGesture?.longTimer)clearTimeout(mobileUiGesture.longTimer);mobileUiGesture=null;}
}
function ensureRunResults(){
  let root=document.getElementById('run-results');if(root)return root;
  root=document.createElement('section');root.id='run-results';root.hidden=true;root.tabIndex=-1;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','run-results-title');
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-run-action]');if(button&&root.contains(button))runResultsChoose(button.dataset.runAction);
  });
  root.addEventListener('keydown',event=>{
    // Keep keyboard skills out of the window listeners. Enter still activates
    // an intentionally focused native button, not an invisible global shortcut.
    event.stopPropagation();
    if(event.key!=='Tab')return;
    const focusable=Array.from(root.querySelectorAll('button,[tabindex="0"]')),first=focusable[0],last=focusable[focusable.length-1];
    if(!first)return;
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===root)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===root)){event.preventDefault();first.focus();}
  });
  document.body.append(root);return root;
}
function runResultsCard(item,index){
  const rarity=typeof RELIC_RARITIES!=='undefined'?RELIC_RARITIES[item.rarity]:null;
  const grade=rarity||{name:'유물',color:'#a1a8b3'},name=typeof relicUiName==='function'?relicUiName(item):item.id;
  const art=typeof relicArtPath==='function'?relicArtPath(item):`assets/relics-v2/${item.setId}-${item.slot}.webp`;
  const slot=typeof RELIC_SLOTS!=='undefined'?RELIC_SLOTS[item.slot]?.name||'유물':'유물';
  return `<li class="run-reward-card${item.rarity==='legendary'?' is-legendary':''}" style="--reward-color:${runResultsEscape(grade.color)};--stamp-delay:${index*100}ms"><div class="run-reward-art"><img src="${runResultsEscape(art)}" alt="" decoding="async" draggable="false"><span aria-hidden="true">획득</span></div><strong>${runResultsEscape(name)}</strong><small>${runResultsEscape(grade.name)} · ${runResultsEscape(slot)} · Lv.${Number(item.level)||0}</small></li>`;
}
function renderRunResults(summary,clear){
  const root=ensureRunResults(),hero=typeof relicCharacterName==='function'?relicCharacterName(summary.hero||selectedCharacter):summary.hero||selectedCharacter;
  const stage=typeof getWorldStageLabel==='function'?getWorldStageLabel():'';
  const kills=Math.max(0,Number(player.kills)||0),score=Math.max(0,Number(player.score)||0),level=Math.max(1,Number(player.level)||1);
  root.classList.toggle('is-clear',clear);
  root.innerHTML=`<div class="run-results-shell"><header class="run-results-heading"><div><span class="run-results-eyebrow">${clear?'OPERATION COMPLETE':'OPERATION REPORT'}</span><h1 id="run-results-title">${clear?'작전 완료':'작전 종료'}</h1><p>${runResultsEscape(hero)}${stage?' · '+runResultsEscape(stage):''} · Lv.${level}</p></div><dl class="run-results-stats"><div><dt>처치</dt><dd>${kills.toLocaleString()}</dd></div><div><dt>점수</dt><dd>${score.toLocaleString()}</dd></div></dl></header><div class="run-results-reward-heading"><h2>이번 작전에서 획득한 유물 <span>${summary.items.length}</span></h2><p>강화 재료 +${Math.max(0,Number(summary.materials)||0).toLocaleString()}</p></div><div class="run-results-scroll" tabindex="0" role="region" aria-label="이번 작전 획득 유물 목록"><ul class="run-rewards">${summary.items.map(runResultsCard).join('')||'<li class="run-results-empty">이번 작전에서 획득한 유물이 없습니다.</li>'}</ul></div><footer class="run-results-footer"><p role="status">${summary.error?runResultsEscape(summary.error):summary.items.length?'획득한 유물은 보관함에 저장되었습니다.':'획득한 보상은 보관함에서 확인할 수 있습니다.'}</p><div><button type="button" data-run-action="home">홈으로</button><button type="button" class="run-results-restart" data-run-action="restart">게임 재시작</button></div></footer></div>`;
  return root;
}
function hideRunResults(reset=true){
  const root=document.getElementById('run-results');if(root)root.hidden=true;
  if(runResultsView.open&&typeof canvas!=='undefined'){
    if(runResultsView.canvasHidden===null)canvas.removeAttribute('aria-hidden');else canvas.setAttribute('aria-hidden',runResultsView.canvasHidden);
  }
  runResultsView.open=false;if(reset)runResultsView.key=null;
}
function runResultsSync(){
  const active=typeof screenMode!=='undefined'&&screenMode==='game'&&((typeof gameOver!=='undefined'&&gameOver)||(typeof raidVictory!=='undefined'&&raidVictory));
  if(!active){if(runResultsView.open)hideRunResults();return false;}
  if(typeof isMobilePortraitMode==='function'&&isMobilePortraitMode()){if(runResultsView.open)hideRunResults(false);return false;}
  const summary=typeof relicRunRewardSummary==='function'?relicRunRewardSummary():{runId:null,hero:selectedCharacter,items:[],materials:0,error:''};
  const clear=typeof raidVictory!=='undefined'&&raidVictory,key=`${summary.runId||'untracked'}:${clear}:${summary.items.length}:${summary.materials}:${summary.error}`;
  let root=document.getElementById('run-results');
  if(runResultsView.key!==key||!root){root=renderRunResults(summary,clear);runResultsView.key=key;}
  if(!runResultsView.open){
    runResultsResetInput();runResultsView.canvasHidden=typeof canvas!=='undefined'?canvas.getAttribute('aria-hidden'):null;
    if(typeof canvas!=='undefined')canvas.setAttribute('aria-hidden','true');
    root.hidden=false;runResultsView.open=true;root.focus({preventScroll:true});
  }
  return true;
}
function runResultsChoose(action){
  if(!runResultsView.open||runResultsView.busy||!['restart','home'].includes(action))return false;
  runResultsView.busy=true;
  try{
    runResultsResetInput();hideRunResults();
    if(action==='restart'){restart();screenMode='game';}
    else{screenMode='home';gameOver=false;raidVictory=false;choosingUpgrade=false;if(typeof relicRun!=='undefined')relicRun=null;}
    paused=false;
    if(typeof mobileUpdateAccumulator!=='undefined')mobileUpdateAccumulator=0;
    if(typeof lastLoopTime!=='undefined')lastLoopTime=performance.now();
    if(typeof canvas!=='undefined')canvas.focus({preventScroll:true});
    return true;
  }finally{runResultsView.busy=false;}
}
if(typeof restart==='function'){
  const runResultsRestartBase=restart;
  restart=function(...args){hideRunResults();runResultsResetInput();return runResultsRestartBase.apply(this,args);};
}
if(typeof draw==='function'){
  const runResultsDrawBase=draw;
  draw=function(...args){if(runResultsSync())return;return runResultsDrawBase.apply(this,args);};
}
