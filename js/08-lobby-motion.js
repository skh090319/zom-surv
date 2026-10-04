// Lobby only. Videos are demand-loaded for the selected hero, never during combat.
const lobbyMotionPlayers=new Map();
let lobbyMotionActive='';
function suspendLobbyMotion(){
  for(const item of lobbyMotionPlayers.values()){if(item.video&&!item.video.paused)item.video.pause();item.started=false;}
  lobbyMotionActive='';
}
function getLobbyMotionPlayer(id){
  if(!['mare'].includes(id)||typeof document==='undefined')return null;
  if(lobbyMotionPlayers.has(id))return lobbyMotionPlayers.get(id);
  const body=new Image(),ornaments=id==='astra'?new Image():null,water=id==='mare'?new Image():null;
  body.decoding='async';body.src=`assets/lobby-motion-v1/${id}-body.webp`;
  if(ornaments){ornaments.decoding='async';ornaments.src='assets/lobby-motion-v1/celestial-ornaments.webp';}
  if(water){water.decoding='async';water.src='assets/lobby-motion-v1/water-ribbon.webp';}
  const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';
  const item={body,ornaments,water,video,failed:false,started:false};
  // Safari alpha-video support is inconsistent; use the identical authored animation there.
  const safari=/AppleWebKit/.test(navigator.userAgent)&&!/(Chrome|Chromium|Edg)/.test(navigator.userAgent);
  item.failed=safari||!video.canPlayType('video/webm; codecs="vp9"');
  video.addEventListener('error',()=>{item.failed=true;video.pause();});
  if(!item.failed){video.src=`assets/lobby-motion-v1/${id}-orbit-${id==='astra'?'v3':'v2'}.webm`;video.preload='auto';video.load();}
  lobbyMotionPlayers.set(id,item);return item;
}
function drawLobbyAnimatedHero(id,x,y,w,h){
  if(id==='astra'){suspendLobbyMotion();ensureGameImage(astraSprite,'high');if(astraSprite.complete&&astraSprite.naturalWidth){ctx.drawImage(astraSprite,x,y,w,h);return true;}return false;}
  const item=getLobbyMotionPlayer(id);if(!item)return false;
  if(lobbyMotionActive!==id){suspendLobbyMotion();lobbyMotionActive=id;}
  if(!item.failed&&!item.started&&(!document.hidden)){
    item.started=true;const playback=item.video.play();if(playback?.catch)playback.catch(()=>{item.failed=true;});
  }
  const ready=image=>image&&image.complete&&image.naturalWidth>0;
  ctx.save();ctx.shadowBlur=0;
  if(!item.failed&&item.video.readyState>=2){ctx.drawImage(item.video,x,y,w,h);ctx.restore();return true;}
  if(ready(item.body)&&(id!=='astra'||ready(item.ornaments))&&(id!=='mare'||ready(item.water))){
    ctx.translate(x,y);drawLobbyMotionFrame(ctx,id,item.body,item.ornaments,performance.now()*.001,w,h,item.water);ctx.restore();return true;
  }
  ctx.restore();return false;
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendLobbyMotion();});
