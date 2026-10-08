/* Relic archive: balance version 1. All percentage values are fractions. */
const RELIC_RARITIES = Object.freeze({
  common: {name:'일반',color:'#a1a8b3',maxLevel:6,factor:.55,minSubs:1,maxSubs:1},
  rare: {name:'희귀',color:'#55d68a',maxLevel:9,factor:.70,minSubs:1,maxSubs:2},
  superRare: {name:'초희귀',color:'#579dff',maxLevel:9,factor:.775,minSubs:1,maxSubs:2},
  epic: {name:'에픽',color:'#b783ff',maxLevel:12,factor:.85,minSubs:2,maxSubs:3},
  legendary: {name:'전설',color:'#f4d35e',maxLevel:15,factor:1,minSubs:2,maxSubs:3},
  cursed: {name:'저주',color:'#ff5869',maxLevel:15,factor:1,minSubs:2,maxSubs:3}
});
const RELIC_SLOTS = Object.freeze({
  core:{name:'코어',type:'normal',mains:['atkFlat']},
  armor:{name:'갑주',type:'normal',mains:['hpFlat']},
  lens:{name:'렌즈',type:'normal',mains:['atkPct','critChance','critDamage','basicDamage','skillDamage','bossDamage','shieldDamage']},
  boots:{name:'부츠',type:'normal',mains:['moveSpeed','attackSpeed','atkPct','cooldown','bossDamage','shieldDamage']},
  emblem:{name:'문장',type:'special',mains:['allDamage','basicDamage','skillDamage','areaDamage','dotDamage','bossDamage','shieldDamage']},
  power:{name:'동력원',type:'special',mains:['cooldown','attackSpeed','xpGain','resourceGain','healing','hpPct','atkPct']}
});
const RELIC_STATS = Object.freeze({
  atkFlat:{name:'공격력',percent:false,main:[2,8]},
  hpFlat:{name:'최대 체력',percent:false,main:[20,80]},
  atkPct:{name:'공격력',percent:true,main:[.06,.24],sub:[.02,.01]},
  hpPct:{name:'최대 체력',percent:true,main:[.08,.32],sub:[.025,.0125]},
  critChance:{name:'치명타 확률',percent:true,points:true,main:[.04,.16],sub:[.01,.005]},
  critDamage:{name:'치명타 추가 피해',percent:true,points:true,main:[.08,.32],sub:[.02,.01]},
  basicDamage:{name:'기본 공격 피해',percent:true,main:[.06,.24],sub:[.02,.01]},
  skillDamage:{name:'스킬 피해',percent:true,main:[.06,.24],sub:[.02,.01]},
  allDamage:{name:'모든 피해',percent:true,main:[.05,.20]},
  areaDamage:{name:'범위 피해',percent:true,main:[.06,.24]},
  dotDamage:{name:'지속 피해',percent:true,main:[.06,.24]},
  bossDamage:{name:'보스 피해',percent:true,main:[.06,.24],sub:[.02,.01]},
  shieldDamage:{name:'보스 쉴드 피해',percent:true,main:[.15,.324],sub:[.03,.015]},
  moveSpeed:{name:'이동속도',percent:true,main:[.03,.12],sub:[.01,.005]},
  attackSpeed:{name:'공격속도',percent:true,main:[.05,.20],sub:[.015,.0075]},
  cooldown:{name:'쿨타임 감소',percent:true,main:[.03,.12],sub:[.008,.004]},
  xpGain:{name:'경험치 획득량',percent:true,main:[.03,.12]},
  resourceGain:{name:'고유 자원 획득량',percent:true,main:[.05,.20],sub:[.02,.01]},
  healing:{name:'회복 효과',percent:true,main:[.05,.20],sub:[.02,.01]}
});
const RELIC_SETS = (() => {
  const sets = {};
  function add(id,name,names,two,four,stats2,hero,stats4){
    const type=id[0]==='B'?'special':'normal';
    sets[id]={id,name,hero:hero||null,type,slots:type==='special'?['emblem','power']:['core','armor','lens','boots'],names:names.split('|'),two,four:four||'',stats2:stats2||{},stats4:stats4||{}};
  }
  add('A01','처형자의 흔적','처형의 심지|흔적의 갑주|사냥의 초점|고요한 추격','기본 공격 피해 +10%.','기본 공격 적중 후 4초간 기본 공격 피해 +2%, 최대 5중첩. 한 번 발사한 다중 탄환은 한 번만 중첩하며 재발동 시 시간을 갱신한다.',{basicDamage:.10});
  add('A02','마력 폭주의 잔해','폭주의 결정|잔류 마력포|마력 관측경|점멸의 잔향','스킬 피해 +12%.','능동 스킬 사용 직후 5초간 스킬 피해 +18%. 중첩 없이 지속시간만 갱신한다.',{skillDamage:.12});
  add('A03','전장의 박동','박동의 핵|기동 프레임|전장 계산경|질주의 군화','공격속도 +8%.','3초 이상 계속 이동한 뒤 5초간 기본 공격 피해 +20%. 정지 후 다시 이동하면 재발동을 준비한다.',{attackSpeed:.08});
  add('A04','거인의 유해','거인의 골편|유해 갑주|거신의 눈|대지를 밟는 발','최대 체력 +12%.','확정된 최대 체력의 2%를 고정 공격력으로 추가한다. 캐릭터 기본 공격력의 30% 상한이며 전환은 한 번만 계산한다.',{hpPct:.12});
  add('A05','붉은 월식','진홍의 맥박|월식의 장막|붉은 관측경|혈월의 발자국','회복 효과 +15%.','실제 체력을 회복하면 5초간 모든 피해 +12%. 반복 회복은 시간만 갱신하며 보호막이나 회복량 0에는 발동하지 않는다.',{healing:.15});
  add('A06','중력 붕괴의 기록','붕괴의 구심|중력 외피|왜곡 관측경|낙하의 궤적','범위 피해 +12%.','하나의 공격이 서로 다른 적 5명 이상에게 적중하면 5초간 범위 피해 +20%. 중첩 없이 지속시간을 갱신한다.',{areaDamage:.12});
  add('A07','파쇄자의 유산','파쇄의 동심|균열 갑주|파쇄자의 시야|쇄도하는 발걸음','보스 쉴드 피해 +15%.','격.특: 보스 쉴드를 격파하면 6초간 해당 보스 HP에 주는 피해 +25%. 격파 타격의 넘침 피해에는 소급 적용하지 않는다.',{shieldDamage:.15});
  add('A08','균열 너머의 추적자','추적의 핵|균열 위장복|약점 관측경|추적자의 궤적','보스 피해 +10%.','격.특: 보스 쉴드를 격파하면 6초간 해당 보스 HP에 대한 치명타 추가 피해 +40%p. 격파 타격의 넘침 피해에는 소급 적용하지 않는다.',{bossDamage:.10});
  add('B01','별을 삼킨 궤도','별을 삼킨 고리|잔광의 축','스킬 피해 +12%. 능동 스킬을 3회 사용하면 6초간 스킬 피해 +10%. 발동 후 사용 횟수는 0으로 초기화한다.','',{skillDamage:.12});
  add('B02','폭풍 전야','폭풍의 인장|전야의 축전지','공격속도 +8%. 출격 시 유물의 메인·보조·상시 세트 공격속도 합계가 25% 이상이면 기본 공격 피해 +12%.','',{attackSpeed:.08});
  add('B03','불멸자의 맹세','맹세의 인장|불멸의 심장','최대 체력 +12%. 현재 체력이 최대 체력의 50% 이하일 때 받는 피해 10% 감소.','',{hpPct:.12});
  add('B04','사냥꾼의 시계','사냥의 좌표|추격의 시계','보스 피해 +12%. 각 보스와 처음 전투를 시작한 뒤 10초간 보스 피해 +10%. 같은 보스에게 다시 발동하지 않는다.','',{bossDamage:.12});
  add('C01','빙극에 새긴 회로','빙극의 핵|서리 외피|냉기 관측경|설원의 잔향','스킬 피해 +12%.','얼음 결정 폭발 피해 +20%, 뇌전 회로 피해 +15%. 결정 수와 발동 조건은 유지한다.',{skillDamage:.12},'suncall');
  add('C02','삼위일체의 무구','삼위의 동심|무구의 외피|병기 조준경|전환의 발걸음','기본 공격 피해 +10%.','무기를 전환하면 5초간 현재 무기의 기본 공격 피해 +20%. 중첩 없이 지속시간만 갱신한다.',{basicDamage:.10},'yupiter');
  add('C03','천 개의 그림자','그림자의 심지|밤의 장막|분신의 시야|지워진 발자국','스킬 피해 +12%.','분신 피해 +25%, 분신 습격 피해 +15%. 둘 다 해당되면 피해 증가 항목에 합산한다.',{skillDamage:.12},'ren');
  add('C04','검은 달의 파편','흑월의 핵|암영 갑주|월도의 초점|검은 달의 궤적','기본 공격 피해 +10%.','체력 50% 이하일 때 기본 공격 피해 +18%, 받는 회복 효과 +10%. 추가 체력을 소모하지 않는다.',{basicDamage:.10},'nightLord');
  add('C05','무한검의 칼집','검심의 조각|칼집 갑주|참격 관측경|무한의 검로','기본 공격 피해 +10%.','능동 스킬 사용 후 5초 안의 다음 기본 공격 피해 +30%. 강화는 1회분만 보관하고 재사용 시 갱신한다.',{basicDamage:.10},'zero');
  add('C06','진명의 검집','진명의 인핵|맹세의 갑주|성검의 시야|해방의 행보','스킬 피해 +12%.','콤보 획득량 +10%. 콤보 75 이상에서 스킬 피해 +20%. 기존 콤보 최대치는 유지한다.',{skillDamage:.12},'paladin');
  add('C07','태양로의 성화','태양로의 핵|성화의 외피|홍염 관측경|잔열의 발걸음','스킬 피해 +12%.','열기 획득량 +10%. 열기로 강화된 스킬 피해 +22%. 추가 폭발 횟수와 발동 조건은 유지한다.',{skillDamage:.12},'arc');
  add('C08','대지에 묻힌 맥동','맥동의 암핵|지층 갑주|진동의 눈|대륙의 흔적','스킬 피해 +12%.','진동 100에서 사용하는 강화 스킬 피해 +25%, 해당 강화 스킬의 여진 피해 +15%.',{skillDamage:.12},'terra');
  add('C09','사건의 지평선','공허의 구심|사건의 외피|지평선의 눈|사라진 좌표','범위 피해 +12%.','공허 질량을 소비하는 스킬 피해 +20%, 공허 지대 피해 +15%. 질량 저장량과 소비 규칙은 유지한다.',{areaDamage:.12},'void');
  add('C10','진홍의 성배','진홍의 성핵|혈월의 장막|성배의 시선|핏빛 발자국','회복 효과 +15%.','혈월 중 기본 공격 피해 +18%. 실제 체력 회복 시 4초간 스킬 피해 +10%. 반복 발동은 시간만 갱신한다.',{healing:.15},'carmilla');
  add('C11','거신의 골수','거신의 골수|혈육 갑주|심연의 안구|거인의 발굽','최대 체력 +12%.','최대 체력 비례 공격 피해 +18%, 자신에게 생성하는 보호막 양 +15%. 최대 체력 성장률은 유지한다.',{hpPct:.12},'vargas');
  add('C12','차원 재단사의 바늘','차원의 바늘|재단의 외피|이면의 시야|접힌 발걸음','스킬 피해 +12%.','공간 매듭 피해 +20%, 균열을 닫으며 발생하는 피해 +20%. 추가 균열을 자동 생성하지 않는다.',{skillDamage:.12},'echo');
  add('C13','영원화의 씨앗','영원화의 씨앗|꽃잎의 외피|화원의 시야|꽃길의 잔향','범위 피해 +12%.','화원에서 발생하는 피해 +20%, 만개 피해 +15%. 토양·화원 수와 성장 단계는 유지한다.',{areaDamage:.12},'aria');
  add('C14','붉은 운명의 물레','운명의 실심|인형의 외피|붉은 매듭경|실을 잇는 걸음','스킬 피해 +12%.','인형의 고통 저장 한도 +20%, 저장한 고통 방출 피해 +15%. 추가 피해는 다시 저장하지 않는다.',{skillDamage:.12},'moira');
  add('C15','심해왕의 진주','심해왕의 진주|해류의 갑주|수압 관측경|조수의 발걸음','범위 피해 +12%.','합류 폭발 피해 +20%, 침수 상태의 적에게 주는 스킬 피해 +12%. 추가 해류는 생성하지 않는다.',{areaDamage:.12},'mare');
  add('C16','루트 권한의 잔재','루트 권한의 핵|격리 프레임|오류 관측경|잔류 프로세스','스킬 피해 +12%.','감염 코드 폭발 피해 +20%, 코드 복제 공격 피해 +15%. 전염 횟수와 감염 최대 중첩은 유지한다.',{skillDamage:.12},'nullZero');
  add('C17','별의 종말을 목격한 자','추락한 별의 핵|성운의 외피|종말 관측경|유성의 잔향','스킬 피해 +12%.','별가루를 획득하면 4초간 모든 피해 +1%, 최대 10중첩. 획득 시 시간을 갱신하며 별가루 획득량은 유지한다.',{skillDamage:.12},'astra');
  add('C18','황금 장부 원본','황금 장부의 심지|금박 외피|배당의 초점|정산의 발걸음','모든 피해 +8%.','정산 순이익이 양수이면 8초간 공격력 +20%. 카드의 직접 피해 +10%. 총자산 증가량과 승률은 유지한다.',{allDamage:.08},'lush');
  add('D01','검은 태양의 성약','검은 태양의 핵|성약의 갑주|맹목의 렌즈|종말의 행보','공격력 +16%. 저주: 받는 피해 +8%.','모든 피해 +20%. 저주: 최대 체력 -15%.',{atkPct:.16,incomingDamage:.08},null,{allDamage:.20,hpPct:-.15});
  return Object.freeze(sets);
})();
const RELIC_STORAGE_KEY='zombieSurvivalRelicsV1';
const RELIC_MAX_INVENTORY=300;
const RELIC_FEED_XP=Object.freeze({common:30,rare:60,superRare:90,epic:150,legendary:240,cursed:300});
const RELIC_CHARACTERS=['suncall','yupiter','ren','nightLord','zero','paladin','arc','terra','void','carmilla','vargas','echo','aria','moira','mare','nullZero','astra','oblivion','lush','luminous'];
let relicStore={version:1,inventory:[],loadouts:{},materials:0,tickets:{standard:0,advanced:0},presets:{},rewardedRuns:{},operations:{}};
let relicStorageError='';
let relicStorageBlocked=false;
let relicSavedSnapshot=null;
let relicIdSequence=0;
function relicOwn(object,key){return Object.prototype.hasOwnProperty.call(object,key);}
function relicRecord(value){return !!value&&typeof value==='object'&&!Array.isArray(value);}
function relicSafeId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);}
function relicClone(value){return JSON.parse(JSON.stringify(value));}
function relicRandom(rng){const n=Number(rng());return Number.isFinite(n)?Math.min(.999999999,Math.max(0,n)):0;}
function relicPick(list,rng){return list[Math.floor(relicRandom(rng)*list.length)];}
function relicCreate(options,rng=Math.random){
  const {setId,slot,rarity='common'}=options||{},set=RELIC_SETS[setId],grade=RELIC_RARITIES[rarity];
  if(!relicOwn(RELIC_SETS,setId)||!relicOwn(RELIC_RARITIES,rarity)||!set.slots.includes(slot)||(setId==='D01')!==(rarity==='cursed'))throw new Error('유물 세트·부위·등급 조합이 올바르지 않습니다.');
  const mainStat=options.mainStat||relicPick(RELIC_SLOTS[slot].mains,rng);
  if(!RELIC_SLOTS[slot].mains.includes(mainStat))throw new Error('이 부위에 사용할 수 없는 메인 속성입니다.');
  const count=grade.minSubs+Math.floor(relicRandom(rng)*(grade.maxSubs-grade.minSubs+1));
  const candidates=Object.keys(RELIC_STATS).filter(stat=>RELIC_STATS[stat].sub&&stat!==mainStat),substats=[];
  for(let i=0;i<count;i++){const at=Math.floor(relicRandom(rng)*candidates.length);substats.push({stat:candidates.splice(at,1)[0],count:0});}
  const id=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`relic_${Date.now().toString(36)}_${(++relicIdSequence).toString(36)}_${Math.floor(relicRandom(rng)*0x100000000).toString(36)}`;
  return {id,setId,slot,rarity,level:0,xp:0,mainStat,substats,history:[],locked:false};
}
function relicMainValue(item){
  const range=item.mainStat==='shieldDamage'&&item.slot==='boots'?[.10,.24]:RELIC_STATS[item.mainStat].main;
  return (range[0]+(range[1]-range[0])*item.level/15)*RELIC_RARITIES[item.rarity].factor;
}
function relicSubValue(item,sub){const range=RELIC_STATS[sub.stat].sub;return (range[0]+range[1]*sub.count)*RELIC_RARITIES[item.rarity].factor;}
function relicItemName(item){const set=RELIC_SETS[item.setId];return set?set.names[set.slots.indexOf(item.slot)]:'';}
function relicFormatStat(stat,value){const data=RELIC_STATS[stat];return `${value>=0?'+':''}${(value*(data&&data.percent?100:1)).toFixed(1)}${data&&data.percent?(data.points?'%p':'%'):''}`;}
function relicStatsForItems(items){
  const stats={},setCounts={},usedSlots=new Set(),accepted=[];
  for(const item of items||[]){
    if(!relicValidateItem(item)||usedSlots.has(item.slot))continue;
    usedSlots.add(item.slot);accepted.push(item);
    stats[item.mainStat]=(stats[item.mainStat]||0)+relicMainValue(item);
    for(const sub of item.substats)stats[sub.stat]=(stats[sub.stat]||0)+relicSubValue(item,sub);
    setCounts[item.setId]=(setCounts[item.setId]||0)+1;
  }
  const activeSets=[];
  for(const [id,count] of Object.entries(setCounts)){
    const set=RELIC_SETS[id];if(count<2)continue;
    const four=set.type==='normal'&&count>=4;
    activeSets.push({...set,count,two:true,four});
    for(const [stat,value] of Object.entries(set.stats2))stats[stat]=(stats[stat]||0)+value;
    if(four)for(const [stat,value] of Object.entries(set.stats4))stats[stat]=(stats[stat]||0)+value;
  }
  stats.cooldown=Math.min(.40,stats.cooldown||0);
  return {stats,setCounts,activeSets,items:accepted};
}
function relicValidateItem(item){
  if(!item||typeof item!=='object'||!relicSafeId(item.id))return false;
  const set=RELIC_SETS[item.setId],grade=RELIC_RARITIES[item.rarity],slot=RELIC_SLOTS[item.slot];
  if(!relicOwn(RELIC_SETS,item.setId)||!relicOwn(RELIC_RARITIES,item.rarity)||!relicOwn(RELIC_SLOTS,item.slot)||!set.slots.includes(item.slot)||(item.setId==='D01')!==(item.rarity==='cursed'))return false;
  if(!Number.isInteger(item.level)||item.level<0||item.level>grade.maxLevel||!slot.mains.includes(item.mainStat)||typeof item.locked!=='boolean')return false;
  if(item.xp!==undefined&&(!Number.isSafeInteger(item.xp)||item.xp<0||(item.level===grade.maxLevel?item.xp!==0:item.xp>=relicEnhanceCost(item))))return false;
  if(!Array.isArray(item.substats)||item.substats.length<grade.minSubs||item.substats.length>grade.maxSubs||!Array.isArray(item.history)||item.history.length!==Math.floor(item.level/3))return false;
  const seen=new Set(),counts={};
  for(const sub of item.substats){
    if(!sub||!relicOwn(RELIC_STATS,sub.stat)||!RELIC_STATS[sub.stat].sub||sub.stat===item.mainStat||seen.has(sub.stat)||!Number.isInteger(sub.count)||sub.count<0||sub.count>5)return false;
    seen.add(sub.stat);counts[sub.stat]=0;
  }
  for(let i=0;i<item.history.length;i++){const event=item.history[i];if(!event||event.level!==(i+1)*3||!seen.has(event.stat))return false;counts[event.stat]++;}
  return item.substats.every(sub=>counts[sub.stat]===sub.count);
}
function relicValidMap(map,byId){
  if(!map||typeof map!=='object'||Array.isArray(map))return false;
  return Object.entries(map).every(([slot,id])=>relicOwn(RELIC_SLOTS,slot)&&typeof id==='string'&&byId.has(id)&&byId.get(id).slot===slot);
}
function relicValidateStore(store,allowLegacySharing=false){
  if(!store||store.version!==1||!Array.isArray(store.inventory)||store.inventory.length>RELIC_MAX_INVENTORY||!store.inventory.every(relicValidateItem))return false;
  const byId=new Map(store.inventory.map(item=>[item.id,item]));if(byId.size!==store.inventory.length)return false;
  if(!Number.isSafeInteger(store.materials)||store.materials<0||store.materials>100000000)return false;
  if(!relicRecord(store.tickets)||!['standard','advanced'].every(key=>Number.isSafeInteger(store.tickets[key])&&store.tickets[key]>=0&&store.tickets[key]<=100000))return false;
  if(!relicRecord(store.loadouts)||!relicRecord(store.presets)||!relicRecord(store.rewardedRuns)||!relicRecord(store.operations))return false;
  for(const [character,map] of Object.entries(store.loadouts))if(!RELIC_CHARACTERS.includes(character)||!relicValidMap(map,byId))return false;
  if(!allowLegacySharing){const equipped=new Set();for(const map of Object.values(store.loadouts))for(const id of Object.values(map)){if(equipped.has(id))return false;equipped.add(id);}}
  for(const [character,list] of Object.entries(store.presets))if(!RELIC_CHARACTERS.includes(character)||!Array.isArray(list)||list.length>3||!list.every(map=>map===null||relicValidMap(map,byId)))return false;
  if(Object.keys(store.rewardedRuns).length>1000||Object.keys(store.operations).length>200)return false;
  for(const [key,value] of Object.entries(store.rewardedRuns)){
    if(!relicSafeId(key)||!relicRecord(value)||!Number.isInteger(value.materials)||value.materials<0||value.materials>250||!Array.isArray(value.events)||value.events.length>30||new Set(value.events).size!==value.events.length||!value.events.every(event=>typeof event==='string'&&/^(boss:[0-9]{1,3}|end|deep|special|mastery)$/.test(event)))return false;
  }
  return Object.entries(store.operations).every(([key,result])=>relicSafeId(key)&&result&&typeof result==='object'&&result.ok===true&&typeof result.message==='string');
}
function relicRunLocked(){return (typeof screenMode!=='undefined'&&screenMode==='game')||(typeof paused!=='undefined'&&paused===true);}
function relicFail(message){return {ok:false,message};}
function relicWrite(store){
  if(relicStorageBlocked)return relicFail(relicStorageError||'저장 데이터를 확인하기 전에는 변경할 수 없습니다.');
  if(!relicValidateStore(store))return relicFail('유물 데이터 검증에 실패했습니다. 변경하지 않았습니다.');
  try{
    if(typeof localStorage==='undefined')throw new Error('storage unavailable');
    localStorage.setItem(RELIC_STORAGE_KEY,JSON.stringify(store));
    relicSavedSnapshot=relicClone(store);relicStorageError='';return {ok:true,message:'저장했습니다.'};
  }catch(error){relicStorageError='기기 저장 공간에 유물을 저장하지 못했습니다. 변경은 취소되었습니다.';return relicFail(relicStorageError);}
}
function relicSave(){
  const result=relicWrite(relicStore);
  if(!result.ok&&relicSavedSnapshot)relicStore=relicClone(relicSavedSnapshot);
  return result;
}
function relicTransaction(change,allowRun=false){
  if(!allowRun&&relicRunLocked())return relicFail('출격 중에는 유물을 변경할 수 없습니다.');
  if(relicStorageBlocked)return relicFail(relicStorageError);
  const draft=relicClone(relicStore),result=change(draft);
  if(!result||!result.ok)return result||relicFail('변경하지 않았습니다.');
  if(result.unchanged)return result;
  const saved=relicWrite(draft);if(!saved.ok)return saved;
  relicStore=draft;return result;
}
function relicStarterStore(){
  const store={version:1,exclusiveEquipment:true,inventory:[],loadouts:{},materials:150,tickets:{standard:0,advanced:0},presets:{},rewardedRuns:{},operations:{}};
  const mains={core:'atkFlat',armor:'hpFlat',lens:'atkPct',boots:'moveSpeed',emblem:'skillDamage',power:'cooldown'};
  const equipped={};
  for(const slot of Object.keys(RELIC_SLOTS)){const item=relicCreate({setId:RELIC_SLOTS[slot].type==='normal'?'A01':'B01',slot,rarity:'common',mainStat:mains[slot]});store.inventory.push(item);equipped[slot]=item.id;}
  const character=typeof selectedCharacter!=='undefined'&&RELIC_CHARACTERS.includes(selectedCharacter)?selectedCharacter:'yupiter';
  store.loadouts[character]=equipped;
  return store;
}
function relicLoad(){
  let raw;
  try{raw=typeof localStorage!=='undefined'?localStorage.getItem(RELIC_STORAGE_KEY):null;}catch(error){relicStorageBlocked=true;relicStorageError='기기 저장소를 읽을 수 없습니다. 유물 변경이 잠겨 있습니다.';return relicFail(relicStorageError);}
  if(raw===null){relicStore=relicStarterStore();relicStorageBlocked=false;return relicSave();}
  try{
    if(typeof raw!=='string'||raw.length>3000000)throw new Error('relic save exceeds limit');
    const parsed=JSON.parse(raw);
    const legacy=parsed.exclusiveEquipment===undefined;
    if(!relicValidateStore(parsed,legacy))throw new Error('invalid relic save');
    if(legacy){
      const priority=typeof selectedCharacter!=='undefined'&&RELIC_CHARACTERS.includes(selectedCharacter)?selectedCharacter:'yupiter',seen=new Set();
      for(const character of [priority,...RELIC_CHARACTERS.filter(id=>id!==priority)])for(const [slot,id] of Object.entries(parsed.loadouts[character]||{})){if(seen.has(id))delete parsed.loadouts[character][slot];else seen.add(id);}
      for(const item of parsed.inventory)item.xp=item.xp||0;
      parsed.exclusiveEquipment=true;
      // Retain a recoverable pre-migration snapshot. No items, levels or currency are discarded.
      try{const backup=RELIC_STORAGE_KEY+'-before-exclusive';if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);}catch(error){relicStorageBlocked=true;relicStorageError='기존 유물 저장 데이터를 백업할 공간이 없어 장착 규칙 변경을 보류했습니다.';return relicFail(relicStorageError);}
    }
    relicStore=parsed;relicSavedSnapshot=relicClone(parsed);relicStorageBlocked=false;relicStorageError='';
    if(legacy){const saved=relicWrite(parsed);if(!saved.ok){relicStorageBlocked=true;return saved;}}
    return {ok:true,message:'유물을 불러왔습니다.'};
  }catch(error){
    relicStorageBlocked=true;relicStorageError='유물 저장 데이터가 손상되어 원본을 보존했습니다. 저장소를 복구하기 전에는 유물 변경이 잠깁니다.';
    return relicFail(relicStorageError);
  }
}
function relicEquippedItems(character){
  const map=relicStore.loadouts[character]||{};
  return Object.keys(RELIC_SLOTS).map(slot=>relicStore.inventory.find(item=>item.id===map[slot])).filter(Boolean);
}
function relicOwner(id,store=relicStore){return Object.keys(store.loadouts).find(character=>Object.values(store.loadouts[character]).includes(id))||null;}
function relicPresetReferences(id,store=relicStore){
  const refs=[];for(const [character,list] of Object.entries(store.presets))list.forEach((map,index)=>{if(map&&Object.values(map).includes(id))refs.push({character,index});});return refs;
}
function relicEquip(character,id){return relicTransaction(draft=>{
  if(!RELIC_CHARACTERS.includes(character))return relicFail('캐릭터를 확인해주세요.');
  const item=draft.inventory.find(entry=>entry.id===id);if(!item)return relicFail('보유하지 않은 유물입니다.');
  const owner=relicOwner(id,draft);if(owner&&owner!==character)return relicFail('다른 캐릭터가 장착 중입니다. 먼저 해당 캐릭터에서 해제해주세요.');
  if(!draft.loadouts[character])draft.loadouts[character]={};draft.loadouts[character][item.slot]=id;
  return {ok:true,message:`${relicItemName(item)} 장착 완료.`};
});}
function relicUnequip(character,slot){return relicTransaction(draft=>{
  if(!RELIC_CHARACTERS.includes(character)||!relicOwn(RELIC_SLOTS,slot))return relicFail('장착 부위를 확인해주세요.');
  if(draft.loadouts[character])delete draft.loadouts[character][slot];
  return {ok:true,message:'유물을 해제했습니다.'};
});}
// The old materials balance stays in saved data for recovery; enhancement uses relic items only.
function relicEnhanceCost(item){return item.level<RELIC_RARITIES[item.rarity].maxLevel?20+10*(item.level+1):0;}
function relicFeedValue(item){return RELIC_FEED_XP[item.rarity]+Math.floor((20*item.level+5*item.level*(item.level+1)+(item.xp||0))*.8);}
function relicEnhancePreview(item,gain){
  const result=relicClone(item),before=result.level;result.xp=(result.xp||0)+Math.max(0,gain);const upgraded=[];
  while(result.level<RELIC_RARITIES[result.rarity].maxLevel&&result.xp>=relicEnhanceCost(result)){
    result.xp-=relicEnhanceCost(result);result.level++;
    if(result.level%3===0){const sub=result.substats[result.history.length%result.substats.length];sub.count++;result.history.push({level:result.level,stat:sub.stat});upgraded.push(sub.stat);}
  }
  const overflow=result.level===RELIC_RARITIES[result.rarity].maxLevel?result.xp:0;if(overflow)result.xp=0;
  return {item:result,gainedLevels:result.level-before,upgraded,overflow};
}
function relicEnhance(id,options={}){return relicTransaction(draft=>{
  if(options.requestId&&relicOwn(draft.operations,options.requestId))return {...draft.operations[options.requestId],unchanged:true};
  if(options.requestId&&!relicSafeId(options.requestId))return relicFail('강화 요청을 확인해주세요.');
  const item=draft.inventory.find(entry=>entry.id===id);if(!item)return relicFail('보유하지 않은 유물입니다.');
  if(options.expectedLevel!==undefined&&options.expectedLevel!==item.level)return relicFail('이미 처리된 강화입니다. 현재 레벨을 확인해주세요.');
  if(options.expectedXp!==undefined&&options.expectedXp!==(item.xp||0))return relicFail('강화 게이지가 변경되었습니다. 다시 확인해주세요.');
  const cost=relicEnhanceCost(item);if(!cost)return relicFail('최대 레벨입니다.');
  if(!Array.isArray(options.materialIds)||!options.materialIds.length)return relicFail('강화 재료로 사용할 다른 유물을 선택해주세요.');
  const ids=[...new Set(options.materialIds)],materials=ids.map(key=>draft.inventory.find(entry=>entry.id===key));
  if(ids.includes(id))return relicFail('강화할 유물 자체는 재료로 사용할 수 없습니다.');
  if(materials.some(entry=>!entry))return relicFail('선택한 강화 재료가 변경되었습니다. 다시 선택해주세요.');
  if(materials.some(entry=>entry.locked))return relicFail('잠긴 유물은 강화 재료로 사용할 수 없습니다.');
  const referenced=materials.filter(entry=>relicOwner(entry.id,draft)||relicPresetReferences(entry.id,draft).length);
  if(referenced.length&&!options.confirmEquipped)return {...relicFail('장착 중이거나 프리셋에 저장된 유물을 소모합니다. 경고 내용을 확인해주세요.'),requiresConfirmation:true};
  if(options.expectedMaterials&&(!Array.isArray(options.expectedMaterials)||materials.some(entry=>{const before=options.expectedMaterials.find(value=>value.id===entry.id);return !before||before.level!==entry.level||before.xp!==(entry.xp||0)||before.owner!==relicOwner(entry.id,draft);})))return relicFail('재료의 장착 또는 강화 상태가 변경되었습니다. 다시 확인해주세요.');
  const gain=materials.reduce((sum,entry)=>sum+relicFeedValue(entry),0),preview=relicEnhancePreview(item,gain),remove=new Set(ids);
  Object.assign(item,preview.item);draft.inventory=draft.inventory.filter(entry=>!remove.has(entry.id));
  for(const map of Object.values(draft.loadouts))for(const [slot,key] of Object.entries(map))if(remove.has(key))delete map[slot];
  for(const list of Object.values(draft.presets))for(const map of list)if(map)for(const [slot,key] of Object.entries(map))if(remove.has(key))delete map[slot];
  const result={ok:true,message:`유물 ${ids.length}개 소모 · 강화 경험치 +${gain}${preview.gainedLevels?` · Lv.${item.level} 달성`:''}`,item:relicClone(item),gain,consumed:ids,gainedLevels:preview.gainedLevels,upgraded:preview.upgraded,overflow:preview.overflow};
  if(options.requestId){draft.operations[options.requestId]=result;const keys=Object.keys(draft.operations);while(keys.length>200)delete draft.operations[keys.shift()];}
  return result;
});}
function relicToggleLock(id){return relicTransaction(draft=>{
  const item=draft.inventory.find(entry=>entry.id===id);if(!item)return relicFail('보유하지 않은 유물입니다.');item.locked=!item.locked;
  return {ok:true,message:item.locked?'유물을 잠갔습니다.':'잠금을 해제했습니다.',locked:item.locked};
});}
function relicDismantleValue(item){return 20+Math.floor((20*item.level+5*item.level*(item.level+1))*.8);}
function relicProtectedIds(store=relicStore){
  const ids=new Set(store.inventory.filter(item=>item.locked).map(item=>item.id));
  for(const map of Object.values(store.loadouts))for(const id of Object.values(map))ids.add(id);
  for(const list of Object.values(store.presets))for(const map of list)if(map)for(const id of Object.values(map))ids.add(id);
  return ids;
}
function relicDismantle(ids){return relicTransaction(draft=>{
  if(!Array.isArray(ids)||!ids.length)return relicFail('분해할 유물을 선택해주세요.');
  const unique=[...new Set(ids)],protectedIds=relicProtectedIds(draft),items=unique.map(id=>draft.inventory.find(item=>item.id===id));
  if(items.some(item=>!item))return relicFail('선택한 유물을 찾을 수 없습니다.');
  if(items.some(item=>protectedIds.has(item.id)))return relicFail('잠금·장착·프리셋 유물은 분해할 수 없습니다.');
  const materials=items.reduce((sum,item)=>sum+relicDismantleValue(item),0),remove=new Set(unique);
  draft.inventory=draft.inventory.filter(item=>!remove.has(item.id));draft.materials+=materials;
  return {ok:true,message:`유물 ${items.length}개 분해 완료.`,count:items.length,materials};
});}
function relicSavePreset(character,index){return relicTransaction(draft=>{
  if(!RELIC_CHARACTERS.includes(character)||!Number.isInteger(index)||index<0||index>2)return relicFail('프리셋을 확인해주세요.');
  if(!draft.presets[character])draft.presets[character]=[null,null,null];
  draft.presets[character][index]={...(draft.loadouts[character]||{})};
  return {ok:true,message:`프리셋 ${index+1} 저장 완료.`};
});}
function relicLoadPreset(character,index){return relicTransaction(draft=>{
  if(!RELIC_CHARACTERS.includes(character)||!Number.isInteger(index)||index<0||index>2)return relicFail('프리셋을 확인해주세요.');
  const map=draft.presets[character]&&draft.presets[character][index];if(!map)return relicFail('저장된 프리셋이 없습니다.');
  if(Object.values(map).some(id=>{const owner=relicOwner(id,draft);return owner&&owner!==character;}))return relicFail('프리셋 유물 중 다른 캐릭터가 장착한 유물이 있습니다. 먼저 장착을 해제해주세요.');
  draft.loadouts[character]={...map};return {ok:true,message:`프리셋 ${index+1} 적용 완료.`};
});}
function relicCraft(options){return relicTransaction(draft=>{
  const {setId,slot,mainStat}=options||{};
  if(!relicOwn(RELIC_SETS,setId)||!RELIC_SETS[setId].slots.includes(slot))return relicFail('제작할 세트와 부위를 선택해주세요.');
  if(mainStat&&!RELIC_SLOTS[slot].mains.includes(mainStat))return relicFail('부위의 메인 속성을 확인해주세요.');
  if(draft.inventory.length>=RELIC_MAX_INVENTORY)return relicFail('보관함이 가득 찼습니다. 유물을 분해해주세요.');
  const ticket=mainStat?'advanced':'standard';if(draft.tickets[ticket]<1)return relicFail(mainStat?'고급 제작권이 부족합니다.':'제작권이 부족합니다.');
  const item=relicCreate({setId,slot,mainStat,rarity:setId==='D01'?'cursed':'epic'});draft.tickets[ticket]--;draft.inventory.push(item);
  return {ok:true,message:`${relicItemName(item)} 제작 완료.`,item};
});}
function relicGrantReward(options){return relicTransaction(draft=>{
  const {runId,kind,hero,bossIndex=0,difficulty='easy'}=options||{};
  if(!relicSafeId(runId))return relicFail('보상 기록을 확인해주세요.');
  if(!['boss','end','finish','clear','defeat','deep','special','mastery'].includes(kind))return relicFail('보상 종류를 확인해주세요.');
  if(kind==='boss'&&(!Number.isInteger(bossIndex)||bossIndex<0||bossIndex>999))return relicFail('보스 보상을 확인해주세요.');
  const event=kind==='boss'?`boss:${bossIndex}`:['finish','clear','defeat'].includes(kind)?'end':kind;
  const record=draft.rewardedRuns[runId]||{materials:0,events:[]};
  if(record.events.includes(event))return {ok:true,message:'이미 받은 보상입니다.',unchanged:true,duplicate:true,items:[],materials:0};
  if(record.events.includes('end'))return relicFail('종료한 작전에는 보상을 추가할 수 없습니다.');
  if(record.events.length>=29)return relicFail('이 작전의 보상을 모두 받았습니다.');
  const rng=options.rng||Math.random,sets=[];
  if(kind==='boss')sets.push(relicPick(['A07','A08'],rng));
  else if(kind==='deep')sets.push('D01');
  else if(kind==='special')sets.push(relicPick(['B01','B02','B03','B04'],rng));
  else if(kind==='mastery'){
    const set=Object.values(RELIC_SETS).find(entry=>entry.hero===hero);if(!set)return relicFail('해당 캐릭터의 특화 세트가 없습니다.');sets.push(set.id);
  }else{
    sets.push(relicPick(['A01','A02','A03','A04','A05','A06'],rng));
    if(record.events.some(entry=>entry.startsWith('boss:')))sets.push(relicPick(['B01','B02','B03','B04'],rng));
  }
  const target=difficulty==='hard'?250:difficulty==='medium'?200:150;
  const materials=Math.max(0,Math.min(250-record.materials,event==='end'?target-record.materials:40));
  const items=[];
  for(const id of sets){
    if(draft.inventory.length>=RELIC_MAX_INVENTORY){draft.tickets.standard++;continue;}
    const set=RELIC_SETS[id],roll=relicRandom(rng),rarity=id==='D01'?'cursed':roll<(difficulty==='hard'?.12:.03)?'legendary':roll<.30?'epic':roll<.55?'superRare':roll<.80?'rare':'common';
    const item=relicCreate({setId:id,slot:relicPick(set.slots,rng),rarity},rng);draft.inventory.push(item);items.push(item);
  }
  draft.materials+=materials;record.materials+=materials;record.events.push(event);draft.rewardedRuns[runId]=record;
  if(event==='end'){draft.tickets.standard++;if(difficulty==='hard'&&record.events.some(entry=>entry.startsWith('boss:')))draft.tickets.advanced++;}
  const runKeys=Object.keys(draft.rewardedRuns);while(runKeys.length>1000)delete draft.rewardedRuns[runKeys.shift()];
  return {ok:true,message:`작전 보상 · 유물 ${items.length}개${event==='end'?' · 제작권 +1':''}`,item:items[0]||null,items,materials};
},true);}
relicLoad();
