// Equipment is a native scroll surface; the battlefield remains canvas-rendered.
const relicView={slot:'',rarity:'',query:'',sort:'level',selected:null,returnTo:'home',preset:0,craftSet:'A01',craftSlot:'core',craftMain:'',toastTimer:0};
const relicFeedView={target:null,selected:[],returnFocus:null};
function relicEscape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function relicArtPath(item){
  // Every set/slot owns its artwork; rarity is represented by the UI rim only.
  return `assets/relics-v2/${item.setId}-${item.slot}.webp`;
}
function relicUiName(item){return typeof relicItemName==='function'?relicItemName(item):(RELIC_SETS[item.setId]?.name+' · '+RELIC_SLOTS[item.slot]?.name);}
function relicUiValue(stat,value){return `${value>=0?'+':''}${(RELIC_STATS[stat]?.percent?value*100:value).toFixed(1)}${RELIC_STATS[stat]?.percent?(stat==='critChance'||stat==='critDamage'?'%p':'%'):''}`;}
function relicCharacterName(id){return characterSkillGuide[id]?.name||id;}
function relicOwnerBadge(item){
  const owner=relicOwner(item.id);if(!owner)return '';
  const portrait=typeof getCharacterPreviewSprite==='function'?getCharacterPreviewSprite(owner,true):null,src=portrait?.assetSource||portrait?.currentSrc||portrait?.src;
  return `<span class="relic-owner" title="${relicEscape(relicCharacterName(owner))} 장착 중" aria-label="${relicEscape(relicCharacterName(owner))} 장착 중">${src?`<img loading="lazy" decoding="async" data-relic-portrait="${owner}" src="${relicEscape(src)}" alt="${relicEscape(relicCharacterName(owner))}">`:relicEscape(relicCharacterName(owner).slice(0,1))}</span>`;
}
function fitRelicOwnerPortrait(image){
  if(!image?.dataset?.relicPortrait||!image.naturalWidth||!image.naturalHeight)return;
  const ratio=image.naturalHeight/image.naturalWidth,crops={astra:[.30,.055,.40],ren:[.27,.19,.44],yupiter:[.42,.05,.48],mare:[.23,.025,.45],oblivion:[.54-ratio*.13,.0182,ratio*.26]},[x,y,side]=crops[image.dataset.relicPortrait]||[.28,.035,.44];
  Object.assign(image.style,{width:`${100/side}%`,height:'auto',left:`${-x/side*100}%`,top:`${-y*ratio/side*100}%`});
}
function relicUiToast(message){const el=document.getElementById('relic-toast');if(!el)return;el.textContent=message;el.hidden=false;clearTimeout(relicView.toastTimer);relicView.toastTimer=setTimeout(()=>el.hidden=true,3400);}
function relicUiMutation(fn){const result=fn();renderRelicInventory();relicUiToast(result?.message||(result?.ok?'적용했습니다.':'변경하지 못했습니다.'));return result;}
function ensureRelicScreen(){
  let root=document.getElementById('relic-screen');if(root)return root;
  root=document.createElement('section');root.id='relic-screen';root.hidden=true;root.setAttribute('aria-label','유물 장비 설정');
  root.innerHTML=`<header class="relic-top"><button data-action="close">← 홈으로</button><div><small>CHARACTER LOADOUT</small><h1>유물 장착</h1></div><div class="relic-wallet" id="relic-wallet"></div></header><div class="relic-shell" id="relic-content"></div><div id="relic-toast" role="status" aria-live="polite" hidden></div><div id="relic-confirm" hidden role="dialog" aria-modal="true" aria-label="유물 변경 확인"><div><h2 id="relic-confirm-title"></h2><p id="relic-confirm-copy"></p><div class="buttons"><button data-action="cancel">취소</button><button class="danger" data-action="confirm">확인</button></div></div></div>`;
  root.innerHTML+='<section id="relic-feed" hidden role="dialog" aria-modal="true" aria-label="유물 강화 재료 선택"></section>';
  document.body.append(root);
  const confirm=document.getElementById('relic-confirm');confirm.setAttribute('aria-labelledby','relic-confirm-title');confirm.setAttribute('aria-describedby','relic-confirm-copy');
  root.addEventListener('click',onRelicUiClick);
  root.addEventListener('load',event=>fitRelicOwnerPortrait(event.target),true);
  root.addEventListener('change',onRelicUiChange);
  root.addEventListener('input',event=>{if(event.target.id==='relic-search'){relicView.query=event.target.value;relicSyncSelection();renderRelicCollection();renderRelicDetail();}});
  root.addEventListener('keydown',event=>{
    const dialog=document.getElementById('relic-confirm');
    if(event.key==='Escape'){event.stopPropagation();if(!dialog.hidden)closeRelicConfirm();else if(relicFeedView.target)closeRelicFeed();else closeRelicInventory();}
    if(event.key==='Tab'&&!dialog.hidden){const buttons=[...dialog.querySelectorAll('button')],next=event.shiftKey?buttons[0]:buttons[buttons.length-1];if(document.activeElement===next){event.preventDefault();(event.shiftKey?buttons[buttons.length-1]:buttons[0]).focus();}}
    else if(event.key==='Tab'&&relicFeedView.target){const buttons=[...document.querySelectorAll('#relic-feed button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];if(document.activeElement===(event.shiftKey?first:last)){event.preventDefault();(event.shiftKey?last:first)?.focus();}}
  });
  return root;
}
function openRelicInventory(){
  if(screenMode==='game'){return;}
  relicView.returnTo=screenMode==='guide'?'guide':'home';screenMode='relics';mouse.down=false;
  if(typeof releaseMobileJoystick==='function')releaseMobileJoystick();
  if(typeof mobileAttackTouchId!=='undefined'){mobileAttackTouchId=null;mobileAttackAim=null;mobileSkillAim=null;}
  const root=ensureRelicScreen();root.hidden=false;root.scrollTop=0;renderRelicInventory();root.querySelector('[data-action="close"]').focus({preventScroll:true});
}
function closeRelicInventory(){const root=document.getElementById('relic-screen');if(root)root.hidden=true;closeRelicConfirm();closeRelicFeed();screenMode=relicView.returnTo;mouse.down=false;canvas.focus({preventScroll:true});}
let relicConfirmAction=null,relicConfirmReturn=null;
function openRelicConfirm(title,copy,action){relicConfirmAction=action;relicConfirmReturn=document.activeElement;document.getElementById('relic-confirm-title').textContent=title;document.getElementById('relic-confirm-copy').textContent=copy;document.getElementById('relic-confirm').hidden=false;document.querySelector('#relic-confirm [data-action="cancel"]').focus();}
function closeRelicConfirm(){const el=document.getElementById('relic-confirm');if(el)el.hidden=true;relicConfirmAction=null;if(relicConfirmReturn?.isConnected)relicConfirmReturn.focus({preventScroll:true});}
function relicFilteredItems(){
  const q=relicView.query.trim().toLowerCase();return relicStore.inventory.filter(item=>(!relicView.slot||item.slot===relicView.slot)&&(!relicView.rarity||item.rarity===relicView.rarity)&&(!q||[relicUiName(item),RELIC_SETS[item.setId].name,RELIC_STATS[item.mainStat]?.name,...item.substats.map(sub=>RELIC_STATS[sub.stat]?.name)].join(' ').toLowerCase().includes(q)))
    .sort((a,b)=>relicView.sort==='rarity'?(Object.keys(RELIC_RARITIES).indexOf(b.rarity)-Object.keys(RELIC_RARITIES).indexOf(a.rarity)||b.level-a.level):relicView.sort==='set'?a.setId.localeCompare(b.setId)||a.slot.localeCompare(b.slot):b.level-a.level||a.setId.localeCompare(b.setId));
}
function renderRelicCollection(){
  const host=document.getElementById('relic-collection');if(!host)return;const equipped=new Set(relicEquippedItems(selectedCharacter).map(item=>item.id));
  host.innerHTML=relicFilteredItems().map(item=>{const rarity=RELIC_RARITIES[item.rarity],owner=relicOwner(item.id);return `<button class="relic-item ${relicView.selected===item.id?'active':''} ${owner?'has-owner':''}" data-select="${relicEscape(item.id)}" style="--rarity:${rarity.color}" aria-label="${relicEscape(relicUiName(item))} ${rarity.name} 레벨 ${item.level}${owner?' · '+relicEscape(relicCharacterName(owner))+' 장착 중':''}"><span class="badge">${item.locked?'잠금 ':''}${equipped.has(item.id)?'장착':owner?'다른 캐릭터 장착':''}</span><img loading="lazy" src="${relicArtPath(item)}" alt=""><strong>${relicEscape(relicUiName(item))}</strong><small>${rarity.name} · ${RELIC_SLOTS[item.slot].name} · Lv.${item.level}</small>${relicOwnerBadge(item)}</button>`;}).join('')||'<p class="relic-empty">조건에 맞는 유물이 없습니다.<br>필터를 바꾸거나 제작권으로 원하는 부위를 제작하세요.</p>';
}
function relicHeroPortrait(){
  const preview=typeof getCharacterPreviewSprite==='function'?getCharacterPreviewSprite(selectedCharacter,false):null;
  return preview?.assetSource||preview?.currentSrc||preview?.src||'';
}
function relicOwnedSets(){
  const owned=new Set(relicStore.inventory.map(item=>item.setId));
  return Object.values(RELIC_SETS).filter(set=>owned.has(set.id));
}
function relicSyncSelection(equipped=relicEquippedItems(selectedCharacter)){
  const items=relicFilteredItems();
  if(!items.some(item=>item.id===relicView.selected))relicView.selected=items.find(item=>equipped.some(worn=>worn.id===item.id))?.id||items[0]?.id||null;
}
function renderRelicStage(equipped,hero){
  const portrait=relicHeroPortrait(),color=characterSkillGuide[selectedCharacter]?.color||'#86bded';
  const positions={core:[23,17],armor:[77,17],lens:[18,78],boots:[82,78],emblem:[43,42],power:[58,64]};
  return `<section class="relic-stage" aria-label="캐릭터와 장착 유물" style="--hero-color:${relicEscape(color)}">
    <div class="relic-hero"><div class="relic-hero-halo" aria-hidden="true"></div>${portrait?`<img class="relic-hero-image" src="${relicEscape(portrait)}" alt="${relicEscape(hero)}" decoding="async" fetchpriority="high">`:''}<div class="relic-hero-caption"><small>SELECTED SURVIVOR</small><h2>${relicEscape(hero)}</h2><p>장착 ${equipped.length} / 6</p></div></div>
    <div class="relic-equipment"><div class="relic-orbit" aria-label="유물 장착 슬롯 6개"><div class="relic-orbit-rings" aria-hidden="true"></div>${Object.keys(RELIC_SLOTS).map(slot=>{
      const item=equipped.find(it=>it.slot===slot),rarity=item?RELIC_RARITIES[item.rarity]:null,[x,y]=positions[slot];
      return `<button class="relic-slot ${relicView.slot===slot?'active':''} ${item?'':'empty'}" data-slot="${slot}" style="--rarity:${rarity?.color||'#71869e'};--slot-x:${x}%;--slot-y:${y}%" aria-label="${RELIC_SLOTS[slot].name} · ${item?rarity.name+' · '+relicUiName(item)+' · 강화 '+item.level:'미장착'}" title="${item?relicEscape(relicUiName(item))+' · '+rarity.name:'보유 유물에서 선택'}"><span class="relic-slot-disc">${item?`<img src="${relicArtPath(item)}" alt=""><span class="relic-slot-level">+${item.level}</span>`:'<span class="relic-slot-empty" aria-hidden="true">+</span>'}</span><strong>${RELIC_SLOTS[slot].name}</strong>${!item?'<span class="relic-slot-state">미장착</span>':''}</button>`;
    }).join('')}</div><p class="relic-orbit-hint">슬롯을 눌러 보유 유물을 장착하세요</p></div>
  </section>`;
}
function renderRelicInventory(){
  ensureRelicScreen();
  const equipped=relicEquippedItems(selectedCharacter),summary=relicStatsForItems(equipped),slots=Object.keys(RELIC_SLOTS),hero=characterSkillGuide[selectedCharacter]?.name||selectedCharacter;
  relicSyncSelection(equipped);
  document.getElementById('relic-wallet').innerHTML=`보유 유물 <b>${relicStore.inventory.length}</b> / 300<small>제작권 ${relicStore.tickets?.standard||0} · 고급 ${relicStore.tickets?.advanced||0}</small>`;
  document.getElementById('relic-content').innerHTML=`${renderRelicStage(equipped,hero)}
    <div class="relic-config"><div class="relic-sets">${summary.activeSets.filter(set=>set.two).map(set=>`<span class="relic-set-pill">${relicEscape(set.name)} · ${set.count}/${set.type==='special'?2:4}</span>`).join('')||'<span class="relic-notice">같은 세트 2개 또는 4개로 세트 효과 활성화</span>'}</div><span class="grow"></span><label>프리셋 <select id="relic-preset">${[0,1,2].map(n=>`<option value="${n}" ${n===relicView.preset?'selected':''}>${n+1}</option>`).join('')}</select></label><button data-action="save-preset">저장</button><button data-action="load-preset">불러오기</button><button data-action="catalog">유물 도감</button></div>
    <div class="relic-workspace" id="relic-workspace"><div><div class="relic-collection-heading"><h2>보유 유물 <span>${relicStore.inventory.length}</span></h2><p>보유한 유물만 표시됩니다</p></div><div class="relic-filter"><select id="relic-slot-filter" aria-label="부위 필터"><option value="">모든 부위</option>${slots.map(slot=>`<option value="${slot}" ${slot===relicView.slot?'selected':''}>${RELIC_SLOTS[slot].name}</option>`).join('')}</select><select id="relic-rarity-filter" aria-label="등급 필터"><option value="">모든 등급</option>${Object.entries(RELIC_RARITIES).map(([id,r])=>`<option value="${id}" ${id===relicView.rarity?'selected':''}>${r.name}</option>`).join('')}</select><select id="relic-sort" aria-label="정렬">${[['level','레벨순'],['rarity','등급순'],['set','세트순']].map(([id,label])=>`<option value="${id}" ${id===relicView.sort?'selected':''}>${label}</option>`).join('')}</select><input id="relic-search" placeholder="이름·메인·보조 속성 검색" aria-label="유물 검색" value="${relicEscape(relicView.query)}"></div><div class="relic-collection" id="relic-collection"></div><details class="relic-craft-disclosure"><summary>유물 제작 · 설계도</summary><div class="relic-craft" id="relic-craft"></div></details></div><aside class="relic-detail" id="relic-detail" aria-label="유물 상세"></aside></div>
    <p class="relic-notice relic-save-note">출격 전 장비만 변경할 수 있습니다. 이 브라우저에 자동 저장되며 다른 기기와 동기화되지 않습니다.</p>`;
  renderRelicCollection();renderRelicDetail();renderRelicCraft();
  if(relicStorageError){const warning=document.createElement('p');warning.className='relic-alert';warning.textContent=relicStorageError;document.getElementById('relic-content').prepend(warning);}
}
function renderRelicDetail(){
  const host=document.getElementById('relic-detail'),item=relicStore.inventory.find(it=>it.id===relicView.selected);if(!item){host.innerHTML='<p>이 조건에 맞는 보유 유물이 없습니다.<br>다른 부위를 선택하거나 출격 보상으로 유물을 획득하세요.</p>';return;}
  const rarity=RELIC_RARITIES[item.rarity],set=RELIC_SETS[item.setId],equipped=relicEquippedItems(selectedCharacter),old=equipped.find(it=>it.slot===item.slot),isEquipped=old?.id===item.id,count=equipped.filter(it=>it.setId===item.setId).length;
  const main=relicMainValue(item),cost=relicEnhanceCost(item),owner=relicOwner(item.id),occupied=owner&&owner!==selectedCharacter;
  host.style.setProperty('--rarity',rarity.color);
  const before=relicStatsForItems(equipped).stats,after=relicStatsForItems([...equipped.filter(it=>it.slot!==item.slot),item]).stats;
  const diff=Object.keys(RELIC_STATS).filter(key=>Math.abs((after[key]||0)-(before[key]||0))>1e-8);
  const noResource=item.mainStat==='resourceGain'||item.substats.some(sub=>sub.stat==='resourceGain');
  host.innerHTML=`<img class="art" src="${relicArtPath(item)}" alt="${relicEscape(RELIC_SLOTS[item.slot].name)}"><span class="rarity">${rarity.name} · ${RELIC_SLOTS[item.slot].name}</span><h2>${relicEscape(relicUiName(item))}</h2><p>Lv.${item.level} / ${rarity.maxLevel}${item.locked?' · 잠금':''}</p>
    ${owner?`<p class="relic-equipped-note">${relicEscape(relicCharacterName(owner))} 장착 중${occupied?' · 해당 캐릭터에서 해제 후 장착 가능':''}</p>`:''}
    <h3>메인 속성 · ${RELIC_STATS[item.mainStat].name}</h3><div class="relic-main-stat">${relicUiValue(item.mainStat,main)}</div><h3>보조 속성 · ${item.substats.length}개</h3>${item.substats.map(sub=>`<div class="relic-stat"><span>${RELIC_STATS[sub.stat].name}<em> ${sub.count?'강화 '+sub.count+'회':''}</em></span><b>${relicUiValue(sub.stat,relicSubValue(item,sub))}</b></div>`).join('')}
    <h3>${relicEscape(set.name)} · ${count}/${set.type==='special'?2:4}</h3><p class="${count>=2?'':'inactive'}">2세트 · ${relicEscape(set.two)}</p>${set.four?`<p class="${count>=4?'':'inactive'} ${item.rarity==='cursed'?'danger':''}">4세트 · ${relicEscape(set.four)}</p>`:''}
    ${set.hero&&set.hero!==selectedCharacter?'<p class="relic-history">특화 조건은 해당 캐릭터의 고유 공격·자원이 있을 때만 적용됩니다.</p>':''}${noResource?'<p class="relic-history">자원 획득은 아크·테라·팔라딘·보이드·오블리비언의 소비형 자원에 적용됩니다. 별가루·총자산·경험치에는 적용되지 않습니다.</p>':''}
    <div class="relic-actions"><button class="primary" data-action="equip" ${occupied?'disabled':''}>${isEquipped?'장착 해제':occupied?'다른 캐릭터 장착 중':'이 부위에 장착'}</button><button data-action="lock">${item.locked?'잠금 해제':'잠금'}</button></div>
    <h3>유물 재료 강화</h3>${relicXpMarkup(item)}<p class="relic-history">다른 유물을 소모해 게이지를 채웁니다. 높은 등급일수록 더 많은 경험치를 줍니다. 3레벨마다 기존 보조 속성을 표시 순서대로 강화합니다.</p>
    <div class="relic-actions"><button class="primary" data-action="enhance" ${!cost?'disabled':''}>${cost?'강화 재료 선택':'최대 레벨'}</button><button class="danger" data-action="dismantle" ${relicProtectedIds().has(item.id)?'disabled':''}>분해</button></div>
    <div class="relic-compare"><strong>장착 시 상시 속성 변화</strong>${diff.length?diff.map(key=>`<div class="relic-stat"><span>${RELIC_STATS[key].name}</span><b>${relicUiValue(key,(after[key]||0)-(before[key]||0))}</b></div>`).join(''):'<p class="relic-history">상시 수치 변화 없음</p>'}<p class="relic-history">조건부 세트 효과는 합산 전투력으로 과장하지 않습니다.</p></div>`;
}
function relicXpMarkup(item,gain=0){
  const cost=relicEnhanceCost(item),xp=item.xp||0,current=cost?xp/cost*100:100,preview=cost?Math.min(100,(xp+gain)/cost*100):100;
  return `<div class="relic-xp" role="progressbar" aria-label="강화 경험치" aria-valuemin="0" aria-valuemax="${cost||1}" aria-valuenow="${cost?xp:1}"><span class="incoming" style="width:${preview}%"></span><span class="current" style="width:${current}%"></span></div><p class="relic-xp-label">${cost?`${xp} / ${cost} EXP${gain?' · +'+gain:''}`:'MAX · 최대 레벨'}</p>`;
}
function openRelicFeed(item){relicFeedView.target=item.id;relicFeedView.selected=[];relicFeedView.returnFocus=document.activeElement;renderRelicFeed();document.querySelector('#relic-feed [data-action="feed-close"]')?.focus({preventScroll:true});}
function closeRelicFeed(){const panel=document.getElementById('relic-feed');if(panel)panel.hidden=true;relicFeedView.target=null;relicFeedView.selected=[];const focus=relicFeedView.returnFocus?.isConnected?relicFeedView.returnFocus:document.querySelector('#relic-detail [data-action="enhance"]');focus?.focus({preventScroll:true});}
function renderRelicFeed(){
  const panel=document.getElementById('relic-feed'),item=relicStore.inventory.find(entry=>entry.id===relicFeedView.target);if(!panel||!item){closeRelicFeed();return;}
  const previousScroll=document.getElementById('relic-feed-items')?.scrollTop||0;
  relicFeedView.selected=relicFeedView.selected.filter(id=>relicStore.inventory.some(entry=>entry.id===id&&id!==item.id&&!entry.locked));
  const selected=relicStore.inventory.filter(entry=>relicFeedView.selected.includes(entry.id)),gain=selected.reduce((sum,entry)=>sum+relicFeedValue(entry),0),preview=relicEnhancePreview(item,gain),after=preview.item;
  const referenced=selected.some(entry=>relicOwner(entry.id)||relicPresetReferences(entry.id).length),canEnhance=relicEnhanceCost(item)>0;
  const candidates=relicStore.inventory.filter(entry=>entry.id!==item.id).sort((a,b)=>Number(a.locked)-Number(b.locked)||Number(!!relicOwner(a.id))-Number(!!relicOwner(b.id))||RELIC_FEED_XP[a.rarity]-RELIC_FEED_XP[b.rarity]||a.level-b.level);
  panel.hidden=false;panel.innerHTML=`<div class="relic-feed-window"><header><div><small>RELIC FUSION</small><h2>유물 강화</h2></div><button data-action="feed-close" aria-label="강화 재료 선택 닫기">닫기 ×</button></header><div class="relic-feed-body"><aside class="relic-feed-target" style="--rarity:${RELIC_RARITIES[item.rarity].color}"><img class="relic-feed-art" src="${relicArtPath(item)}" alt=""><small>${RELIC_RARITIES[item.rarity].name}</small><h3>${relicEscape(relicUiName(item))}</h3><p class="relic-feed-level">Lv.${item.level} <span>→</span> Lv.${after.level}</p>${relicXpMarkup(item,gain)}<p>강화 후 ${relicEnhanceCost(after)?`${after.xp||0} / ${relicEnhanceCost(after)} EXP`:'최대 레벨'}</p><p>${RELIC_STATS[item.mainStat].name}<br><b>${relicUiValue(item.mainStat,relicMainValue(item))} → ${relicUiValue(item.mainStat,relicMainValue(after))}</b></p>${preview.upgraded.length?`<p class="relic-feed-growth">${preview.upgraded.map(stat=>RELIC_STATS[stat].name+' 강화').join(' · ')}</p>`:''}<p class="relic-history">경험치는 누적되며 게이지가 차면 레벨이 오릅니다. 강화된 재료는 투자한 경험치의 80%를 추가로 돌려줍니다.</p>${preview.overflow?`<p class="relic-feed-warning">최대 레벨을 초과한 ${preview.overflow} EXP는 사라집니다.</p>`:''}</aside><div class="relic-feed-materials"><h3>소모할 유물 선택</h3><div class="relic-feed-rarities">${Object.entries(RELIC_RARITIES).map(([key,grade])=>`<span style="color:${grade.color}">${grade.name} +${RELIC_FEED_XP[key]}</span>`).join('')}</div><p class="relic-history">잠금 유물은 사용할 수 없습니다. 장착·프리셋 유물은 소모 전에 경고합니다.</p><div id="relic-feed-items">${candidates.map(entry=>{const chosen=relicFeedView.selected.includes(entry.id),owner=relicOwner(entry.id),grade=RELIC_RARITIES[entry.rarity];return `<button class="relic-feed-choice ${chosen?'selected':''}" data-feed-item="${relicEscape(entry.id)}" aria-pressed="${chosen}" ${entry.locked||!canEnhance?'disabled':''} style="--rarity:${grade.color}"><span class="relic-feed-check">${chosen?'✓':'+'}</span><img class="relic-feed-choice-art" loading="lazy" decoding="async" src="${relicArtPath(entry)}" alt=""><strong>${relicEscape(relicUiName(entry))}</strong><small>${grade.name} · Lv.${entry.level}</small><b>+${relicFeedValue(entry)} EXP</b><span class="relic-feed-status">${entry.locked?'잠금':owner?relicEscape(relicCharacterName(owner))+' 장착 중':relicPresetReferences(entry.id).length?'프리셋 사용 중':''}</span>${relicOwnerBadge(entry)}</button>`;}).join('')||'<p class="relic-empty">재료로 사용할 다른 유물이 없습니다.</p>'}</div></div></div><footer><div><strong>${selected.length}개 선택 · +${gain} EXP</strong>${referenced?'<p class="relic-feed-warning">⚠ 장착 중이거나 프리셋에 저장된 유물이 포함되어 있습니다.</p>':'<p>선택한 재료는 강화 후 사라집니다.</p>'}</div><button class="primary" data-action="feed-apply" ${!selected.length||!canEnhance?'disabled':''}>재료로 강화</button></footer></div>`;
  document.getElementById('relic-feed-items').scrollTop=previousScroll;
}
function confirmRelicFeed(){
  const item=relicStore.inventory.find(entry=>entry.id===relicFeedView.target);if(!item)return;
  const materials=relicStore.inventory.filter(entry=>relicFeedView.selected.includes(entry.id));if(!materials.length)return;
  const equipped=materials.filter(entry=>relicOwner(entry.id)),presets=materials.some(entry=>relicPresetReferences(entry.id).length),gain=materials.reduce((sum,entry)=>sum+relicFeedValue(entry),0),preview=relicEnhancePreview(item,gain);
  const request={materialIds:materials.map(entry=>entry.id),expectedLevel:item.level,expectedXp:item.xp||0,expectedMaterials:materials.map(entry=>({id:entry.id,level:entry.level,xp:entry.xp||0,owner:relicOwner(entry.id)})),confirmEquipped:true,requestId:`feed_${Date.now().toString(36)}_${++relicIdSequence}`};
  const warning=equipped.length?'⚠ 장착된 유물: '+equipped.map(entry=>`${relicCharacterName(relicOwner(entry.id))}의 ${relicUiName(entry)}`).join(', ')+'. 소모하면 해당 캐릭터에서 장착 해제되고 유물이 영구적으로 사라집니다. ':'';
  const copy=warning+(presets?'프리셋에서도 해당 유물이 제거됩니다. ':'')+`${materials.length}개의 유물을 소모하여 ${gain} EXP를 획득합니다. 되돌릴 수 없습니다.`+(preview.overflow?` 최대 레벨 초과분 ${preview.overflow} EXP는 소멸합니다.`:'');
  openRelicConfirm(equipped.length?'장착 유물 소모 경고':presets?'프리셋 유물 소모 경고':'강화 재료 소모 확인',copy,()=>{const result=relicUiMutation(()=>relicEnhance(item.id,request));if(result.ok)relicFeedView.selected=[];renderRelicFeed();document.querySelector('#relic-feed [data-action="feed-close"]')?.focus({preventScroll:true});});
}
function renderRelicCraft(){
  const set=RELIC_SETS[relicView.craftSet]||RELIC_SETS.A01;if(!set.slots.includes(relicView.craftSlot))relicView.craftSlot=set.slots[0];
  const mains=RELIC_SLOTS[relicView.craftSlot].mains;if(!mains.includes(relicView.craftMain))relicView.craftMain='';
  document.getElementById('relic-craft').innerHTML=`<h3>제작권 · 원하는 세트와 부위 선택</h3><div class="relic-craft-row"><select id="relic-craft-set" aria-label="제작 세트">${Object.values(RELIC_SETS).map(s=>`<option value="${s.id}" ${s.id===set.id?'selected':''}>${s.name}${s.id==='D01'?' · 저주':''}</option>`).join('')}</select><select id="relic-craft-slot" aria-label="제작 부위">${set.slots.map(slot=>`<option value="${slot}" ${slot===relicView.craftSlot?'selected':''}>${RELIC_SLOTS[slot].name}</option>`).join('')}</select><select id="relic-craft-main" aria-label="제작 메인 속성"><option value="">메인 무작위 · 일반 제작권</option>${mains.map(stat=>`<option value="${stat}" ${stat===relicView.craftMain?'selected':''}>${RELIC_STATS[stat].name} · 고급 제작권</option>`).join('')}</select><button data-action="craft" class="primary">제작권 1장 사용</button></div><p>출격 보상으로 유물과 제작권을 획득합니다. 저주 세트는 일반 보상과 분리되며 이점과 패널티가 함께 적용됩니다.</p>`;
}
function onRelicUiChange(event){const map={'relic-slot-filter':'slot','relic-rarity-filter':'rarity','relic-sort':'sort','relic-preset':'preset','relic-craft-set':'craftSet','relic-craft-slot':'craftSlot','relic-craft-main':'craftMain'},key=map[event.target.id];if(!key)return;relicView[key]=key==='preset'?Number(event.target.value):event.target.value;if(key.startsWith('craft'))renderRelicCraft();else if(key!=='preset')renderRelicInventory();}
function onRelicUiClick(event){
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.feedItem){const id=button.dataset.feedItem;relicFeedView.selected=relicFeedView.selected.includes(id)?relicFeedView.selected.filter(key=>key!==id):[...relicFeedView.selected,id];renderRelicFeed();document.querySelector(`#relic-feed [data-feed-item="${id}"]`)?.focus({preventScroll:true});return;}
  if(button.dataset.select){relicView.selected=button.dataset.select;renderRelicCollection();renderRelicDetail();return;}
  if(button.dataset.slot){relicView.slot=button.dataset.slot;relicView.rarity='';relicView.query='';const equipped=relicEquippedItems(selectedCharacter).find(it=>it.slot===button.dataset.slot);relicView.selected=equipped?.id||relicFilteredItems()[0]?.id||null;renderRelicInventory();document.getElementById('relic-workspace')?.scrollIntoView?.({block:'start'});return;}
  const item=relicStore.inventory.find(it=>it.id===relicView.selected);
  switch(button.dataset.action){
    case 'close':closeRelicInventory();break;
    case 'catalog':closeRelicInventory();openGuideScreen('relics');break;
    case 'equip':if(item)relicUiMutation(()=>relicEquippedItems(selectedCharacter).some(it=>it.id===item.id)?relicUnequip(selectedCharacter,item.slot):relicEquip(selectedCharacter,item.id));break;
    case 'lock':if(item)relicUiMutation(()=>relicToggleLock(item.id));break;
    case 'enhance':if(item)openRelicFeed(item);break;
    case 'feed-close':closeRelicFeed();break;
    case 'feed-apply':confirmRelicFeed();break;
    case 'save-preset':openRelicConfirm('프리셋 저장',`프리셋 ${relicView.preset+1}을 현재 장비로 저장합니다. 기존 슬롯 구성은 덮어씁니다.`,()=>relicUiMutation(()=>relicSavePreset(selectedCharacter,relicView.preset)));break;
    case 'load-preset':relicUiMutation(()=>relicLoadPreset(selectedCharacter,relicView.preset));break;
    case 'dismantle':if(item)openRelicConfirm('유물 분해',`${relicUiName(item)} 1개를 보관함에서 영구적으로 제거합니다. 강화 경험치를 얻으려면 다른 유물의 강화 재료로 선택해주세요. 잠금·장착·프리셋 유물은 분해할 수 없습니다.`,()=>relicUiMutation(()=>relicDismantle([item.id])));break;
    case 'craft':{const request={setId:relicView.craftSet,slot:relicView.craftSlot,...(relicView.craftMain?{mainStat:relicView.craftMain}:{})};const run=()=>{const result=relicCraft(request);if(result.item)relicView.selected=result.item.id;renderRelicInventory();relicUiToast(result.message);};if(request.setId==='D01')openRelicConfirm('저주 유물 제작','검은 태양의 성약은 2세트에서 받는 피해 +8%, 4세트에서 최대 체력 -15%의 패널티가 있습니다. 제작권 1장을 사용합니까?',run);else run();break;}
    case 'cancel':closeRelicConfirm();break;
    case 'confirm':{const action=relicConfirmAction;closeRelicConfirm();if(action)action();break;}
  }
}
const relicUiDrawBase=draw;
draw=function(){if(screenMode==='relics'){ctx.fillStyle='#080d16';ctx.fillRect(0,0,canvas.width,canvas.height);return;}relicUiDrawBase();};

const relicGuideImages=new Map();let relicGuideEquipRect=null;
function relicGuideImage(set){const item=relicStore.inventory.find(owned=>owned.setId===set.id);if(!item)return null;const path=relicArtPath(item);if(!relicGuideImages.has(path)){const im=new Image();im.src=path;relicGuideImages.set(path,im);}return relicGuideImages.get(path);}
function drawRelicGuide(){
  const mobile=typeof isMobileTouchDevice==='function'&&isMobileTouchDevice(),margin=mobile?22:Math.max(40,canvas.width*.065),width=canvas.width-margin*2;
  const start=guideSectionTop||153;guideContentTop=start;
  ctx.save();
  function lines(text,maxWidth,font){ctx.font=font;const result=[];let line='';for(const ch of text){if(ctx.measureText(line+ch).width>maxWidth&&line){result.push(line);line='';}line+=ch;}if(line)result.push(line);return result;}
  const intro=lines('6부위 장착 · 메인 1개 · 보조 1~3개 · 강화 시 기존 속성만 성장',width,'13px Arial');
  const note=lines('보유한 유물의 세트만 표시합니다. 유물은 출격 전 장비 화면에서 설정합니다.',width,'12px Arial');
  const columns=width>=1050?3:width>=680?2:1,cardWidth=(width-(columns-1)*14)/columns;
  const cards=relicOwnedSets().map(set=>{const title=lines(set.name,cardWidth-100,'bold 16px Arial'),two=lines('2세트 · '+set.two,cardWidth-30,'13px Arial'),four=set.four?lines('4세트 · '+set.four,cardWidth-30,'13px Arial'):[];return{set,title,two,four,h:Math.max(210,93+Math.max(0,title.length-1)*20+(two.length+four.length)*19+(four.length?12:0)+20)};});
  const equipTop=start+18+48+intro.length*19+note.length*18+12,cardStart=equipTop+56;
  let bottom=cardStart;for(let i=0;i<cards.length;i+=columns){const height=Math.max(...cards.slice(i,i+columns).map(card=>card.h));for(let j=i;j<Math.min(i+columns,cards.length);j++){cards[j].top=bottom;cards[j].rowH=height;}bottom+=height+14;}
  guideScrollMax=Math.max(0,bottom+26-canvas.height);guideScrollY=Math.max(0,Math.min(guideScrollY,guideScrollMax));
  ctx.beginPath();ctx.rect(0,start,canvas.width,canvas.height-start);ctx.clip();
  let y=start+18-guideScrollY;
  const rarities=Object.values(RELIC_RARITIES),gap=10,pillWidth=Math.min(108,(width-gap*5)/6);
  for(let i=0;i<rarities.length;i++){const r=rarities[i],x=margin+i*(pillWidth+gap);drawRoundedRect(x,y,pillWidth,30,6,r.color+'20',r.color,1);ctx.fillStyle=r.color;ctx.textAlign='center';ctx.font='bold 13px Arial';ctx.fillText(r.name,x+pillWidth/2,y+20);}
  y+=48;ctx.textAlign='left';ctx.fillStyle='#b7cbdc';ctx.font='13px Arial';for(const line of intro){ctx.fillText(line,margin,y);y+=19;}
  ctx.fillStyle='#869ab0';ctx.font='12px Arial';for(const line of note){ctx.fillText(line,margin,y);y+=18;}
  relicGuideEquipRect={x:margin,y:equipTop-guideScrollY,w:Math.min(230,width),h:38};drawRoundedRect(margin,relicGuideEquipRect.y,relicGuideEquipRect.w,38,7,'#244454','#6fcbdc',1);ctx.fillStyle='#e7fcff';ctx.font='bold 14px Arial';ctx.fillText('유물 장비 · 보관함 열기  →',margin+14,relicGuideEquipRect.y+24);
  if(!cards.length){ctx.fillStyle='#b7cbdc';ctx.font='14px Arial';ctx.fillText('보유한 유물이 없습니다. 출격 보상으로 유물을 획득하세요.',margin,cardStart+24-guideScrollY);}
  for(let index=0;index<cards.length;index++){
    const card=cards[index],set=card.set,x=margin+(index%columns)*(cardWidth+14),cy=card.top-guideScrollY;if(cy+card.rowH<start||cy>canvas.height)continue;
    const color=set.id==='D01'?RELIC_RARITIES.cursed.color:'#62bfd4';drawRoundedRect(x,cy,cardWidth,card.rowH,10,'#101c2bef',color+'77',1);
    const im=relicGuideImage(set);if(im?.complete&&im.naturalWidth)ctx.drawImage(im,x+14,cy+12,58,58);
    ctx.fillStyle='#829bb0';ctx.font='11px Arial';ctx.fillText(set.id+' · '+(set.type==='special'?'특수 2부위':set.hero?(characterSkillGuide[set.hero]?.name||set.hero)+' 특화':'일반 4부위'),x+84,cy+28);
    ctx.fillStyle='#eef5fc';ctx.font='bold 16px Arial';card.title.forEach((line,i)=>ctx.fillText(line,x+84,cy+52+i*20));
    let ty=cy+93+Math.max(0,card.title.length-1)*20;ctx.font='13px Arial';ctx.fillStyle='#a0dde6';for(const line of card.two){ctx.fillText(line,x+15,ty);ty+=19;}
    ty+=12;ctx.fillStyle=set.id==='D01'?'#ff9a9d':'#c0cbda';for(const line of card.four){ctx.fillText(line,x+15,ty);ty+=19;}
  }
  ctx.restore();
}
registerGuideSection({id:'relics',label:'유물',color:'#68c9db',subtitle:'RELIC ARCHIVE · 6부위 장비와 세트 효과',draw:drawRelicGuide,onClick:(x,y)=>{if(y>=guideContentTop&&relicGuideEquipRect&&pointInRect(x,y,relicGuideEquipRect)){openRelicInventory();return true;}return false;}});

// Keep the existing health/name and encounter warnings intact. The thin shield
// row shares the editable boss-HUD transform rather than being fixed on screen.
function drawRelicBossShield(){
  const boss=typeof activeRaidBoss!=='undefined'?activeRaidBoss:null;
  if(!boss?.relicShieldMax)return;
  const mobile=typeof isMobileTouchDevice==='function'&&isMobileTouchDevice();
  const w=mobile?Math.min(400,canvas.width*.62):Math.min(760,canvas.width-80),x=(canvas.width-w)/2,y=mobile?51:53,h=10;
  const ratio=Math.max(0,Math.min(1,boss.relicShield/boss.relicShieldMax)),broken=boss.relicBreakTime>0;
  ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#091824e8';ctx.fillRect(x-2,y-2,w+4,h+4);
  const gradient=ctx.createLinearGradient(x,y,x+w,y);gradient.addColorStop(0,'#3384b3');gradient.addColorStop(1,'#9de6ee');ctx.fillStyle=gradient;ctx.fillRect(x,y,w*ratio,h);
  ctx.strokeStyle=broken?'#ffe193':'#85cede';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
  ctx.font='bold 9px Arial';ctx.fillStyle=broken?'#ffe193':'#f0faff';
  ctx.fillText(broken?`보호막 파괴 · ${(boss.relicBreakTime/60).toFixed(1)}초`:ratio>0?`보호막 ${Math.ceil(ratio*100)}%`:'보호막 파괴',canvas.width/2,y+h/2+.5);
  ctx.restore();
}
if(typeof drawRaidBossUI==='function'){
  const baseBossUi=drawRaidBossUI;
  drawRaidBossUI=function(){
    if(typeof activeRaidBoss!=='undefined'&&activeRaidBoss?.relicShieldMax&&!raidVictory){ctx.save();ctx.translate(0,16);try{baseBossUi();}finally{ctx.restore();}drawRelicBossShield();}
    else baseBossUi();
  };
}
if(typeof getMobileHudBounds==='function'){
  const baseHudBounds=getMobileHudBounds;
  getMobileHudBounds=function(id){const bounds=baseHudBounds(id);return id==='boss'?{...bounds,y:bounds.y+8,h:bounds.h+16}:bounds;};
}
