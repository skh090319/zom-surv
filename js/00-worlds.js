// Stage identity is separate from its current combat/reward balance profile.
const GAME_WORLDS = Object.freeze([
  {id:1,name:'몰락한 거리',color:'#d6aa73',background:'background.webp',story:['모든 것은 이 거리에서 시작됐다.','감염의 흔적을 따라 격리선으로 향한다.']},
  {id:2,name:'봉쇄된 격리구역',color:'#71cbb3',background:'assets/worlds-v1/world-2-quarantine.webp',story:['도시 밖 격리선은 이미 무너졌다.','남겨진 수송로가 발원지로 이어진다.']},
  {id:3,name:'심연의 발원지',color:'#b59aef',background:'assets/worlds-v1/world-3-origin.webp',story:['수송로 끝 지하 시설에서','재앙의 심장을 마주한다.']}
]);
const WORLD_STAGE_BALANCE = Object.freeze({
  '1-1':'easy','1-2':'easy','1-3':'easy',
  '2-1':'easy','2-2':'medium','2-3':'hard',
  '3-1':'easy','3-2':'easy','3-3':'easy'
});
let selectedWorld=2,selectedStageDifficulty=selectedDifficulty;
try {
  const saved=JSON.parse(localStorage.getItem('zombieSurvivalWorldStage'));
  if(saved&&[1,2,3].includes(saved.world)&&['easy','medium','hard'].includes(saved.tier)){
    selectedWorld=saved.world;selectedStageDifficulty=saved.tier;
  }
} catch(error) {}
const worldBackgroundImages=new Map();
let homeWorldCloseRect=null;
function getWorldStageLabel(world=selectedWorld,tier=selectedStageDifficulty){return `${world}-${['easy','medium','hard'].indexOf(tier)+1}`;}
function getSelectedWorld(){return GAME_WORLDS.find(world=>world.id===selectedWorld)||GAME_WORLDS[1];}
function selectWorldStage(world=selectedWorld,tier='easy'){
  if(![1,2,3].includes(world)||!['easy','medium','hard'].includes(tier))return false;
  selectedWorld=world;selectedStageDifficulty=tier;
  selectedDifficulty=WORLD_STAGE_BALANCE[getWorldStageLabel()];
  try{localStorage.setItem('zombieSurvivalWorldStage',JSON.stringify({world,tier}));localStorage.setItem('zombieSurvivalDifficulty',selectedDifficulty);}catch(error){}
  return true;
}
function getWorldBackgroundImage(world=selectedWorld){
  if(world===1)return typeof ensureGameImage==='function'?ensureGameImage(backgroundImage,'high'):backgroundImage;
  if(!worldBackgroundImages.has(world)){
    const definition=GAME_WORLDS.find(entry=>entry.id===world);if(!definition)return backgroundImage;
    const image=new Image();setGameImageSource(image,definition.background);worldBackgroundImages.set(world,image);
  }
  return ensureGameImage(worldBackgroundImages.get(world),'high');
}
// Older saves remain in World 2 with their previous easy/medium/hard choice.
selectedDifficulty=WORLD_STAGE_BALANCE[getWorldStageLabel()];
