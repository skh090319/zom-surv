// The 3D viewer is a lazy, lobby-only layer. It never owns a second game loop.
const ASTRA_LOBBY_3D_ENABLED=true;
let astraLobbyViewer=null,astraLobbyLoad=null,astraLobbyHost=null,astraLobbyBounds=null;
let astraLobbyMode='3d',astraLobbyLastFrame=-Infinity,astraLobbyFailure=false;
function ensureAstraLobbyViewer(){
  if(!ASTRA_LOBBY_3D_ENABLED)return;
  if(astraLobbyLoad||astraLobbyViewer||astraLobbyFailure)return;
  astraLobbyLoad=import('./astra-model.mjs?v=20260929-user-model1').then(module=>{
    if(screenMode!=='home'||selectedCharacter!=='astra'||astraLobbyMode!=='3d')return;
    astraLobbyViewer=module.createAstraModel(astraLobbyHost.querySelector('.astra-model-stage'));
    return astraLobbyViewer.ready.then(()=>{if(astraLobbyViewer)astraLobbyHost.querySelector('.astra-model-status').textContent='드래그하여 360° 회전 · 두 번 눌러 초기화';});
  }).catch(error=>{
    astraLobbyFailure=true;astraLobbyMode='art';
    astraLobbyHost.querySelector('.astra-model-status').textContent='3D를 불러올 수 없어 원화를 표시합니다';
    console.warn('Astra 3D unavailable; keeping the original illustration.',error);
  }).finally(()=>{astraLobbyLoad=null;});
}
function astraLobbyElement(){
  if(astraLobbyHost)return astraLobbyHost;
  const host=document.createElement('section');host.className='astra-model-viewer';host.setAttribute('aria-label','아스트라 로비 미리보기');host.hidden=true;
  const stage=document.createElement('div');stage.className='astra-model-stage';host.append(stage);
  const status=document.createElement('div');status.className='astra-model-status';status.textContent='3D 아스트라 준비 중…';host.append(status);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='astra-model-toggle';toggle.textContent='원화 보기';
  toggle.addEventListener('click',e=>{e.stopPropagation();astraLobbyMode=astraLobbyMode==='3d'?'art':'3d';astraLobbyLastFrame=-Infinity;});host.append(toggle);
  // Stop gestures here; a model drag must never activate a lobby/game button.
  for(const name of ['pointerdown','pointerup','pointermove','touchstart','touchmove','touchend','click','dblclick'])host.addEventListener(name,e=>e.stopPropagation());
  document.body.append(host);astraLobbyHost=host;return host;
}
function syncAstraLobbyVisibility(){
  if(!ASTRA_LOBBY_3D_ENABLED){if(astraLobbyHost)astraLobbyHost.hidden=true;astraLobbyBounds=null;return;}
  const visible=screenMode==='home'&&selectedCharacter==='astra'&&!(typeof isMobilePortraitMode==='function'&&isMobilePortraitMode())&&!(typeof homeDifficultyOpen!=='undefined'&&homeDifficultyOpen);
  if(astraLobbyHost)astraLobbyHost.hidden=!visible;
  if(!visible)astraLobbyBounds=null;
}
function drawAstraLobbyModel(rect){
  if(!ASTRA_LOBBY_3D_ENABLED)return false;
  if(selectedCharacter!=='astra')return false;
  const host=astraLobbyElement(),bounds=canvas.getBoundingClientRect(),sx=bounds.width/canvas.width,sy=bounds.height/canvas.height;
  astraLobbyBounds=rect;host.hidden=typeof homeDifficultyOpen!=='undefined'&&homeDifficultyOpen;
  if(host.hidden)return false;
  host.style.left=`${bounds.left+rect.x*sx}px`;host.style.top=`${bounds.top+rect.y*sy}px`;
  host.style.width=`${rect.w*sx}px`;host.style.height=`${rect.h*sy}px`;
  const stage=host.querySelector('.astra-model-stage'),button=host.querySelector('.astra-model-toggle');
  const active=astraLobbyMode==='3d'&&!astraLobbyFailure;
  stage.hidden=!active;button.textContent=active?'원화 보기':'3D 보기';button.disabled=astraLobbyFailure;
  host.classList.toggle('astra-model-art',!active);
  if(active){
    ensureAstraLobbyViewer();
    const now=performance.now();
    // 30 fps is ample for a turntable and leaves the menu input responsive.
    if(astraLobbyViewer&&now-astraLobbyLastFrame>=1000/30){astraLobbyLastFrame=now;astraLobbyViewer.render(Math.max(1,Math.round(rect.w*sx)),Math.max(1,Math.round(rect.h*sy-36)),now*.001);}
  }
  return active&&!!astraLobbyViewer;
}
addEventListener('pagehide',()=>{astraLobbyViewer?.dispose();astraLobbyViewer=null;astraLobbyLastFrame=-Infinity;});
