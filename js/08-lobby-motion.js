// Lobby original art. Astra and Mare no longer create or load videos.
const lobbyMotionPlayers=new Map();
let lobbyMotionActive='';
function suspendLobbyMotion(){lobbyMotionActive='';}
function getLobbyMotionPlayer(){return null;}
function drawLobbyAnimatedHero(id,x,y,w,h){
  const image=id==='astra'?astraSprite:id==='mare'?mareSprite:null;
  if(!image)return false;
  ensureGameImage(image,'high');
  if(!image.complete||!image.naturalWidth)return false;
  ctx.save();ctx.shadowBlur=0;ctx.drawImage(image,x,y,w,h);ctx.restore();return true;
}
