// World-tree realm and a brief upper-right portrait; all timing follows the cast.
function ariaUltimateAsset(name){
  const source=name==='background'?'assets/aria-v3/ultimate-background-lake.webp':`assets/aria-v2/ultimate-${name}.webp`;
  const image=setGameImageSource(new Image(),source);
  image.assetGroup='aria';return image;
}
const ariaUltimateArt={background:ariaUltimateAsset('background'),portrait:ariaUltimateAsset('portrait')};
const ARIA_ULTIMATE_PORTRAIT_FRAMES=120;
const ARIA_ULTIMATE_PORTRAIT_FOCUS={x:.70,y:.36,anchorX:.79,anchorY:.32,scale:1};
const ariaUltimateVisual={tree:null,backgroundReadyAt:-1,portraitReadyAt:-1};

function ariaUltimateSmooth(value){value=Math.max(0,Math.min(1,value));return value*value*(3-2*value);}
function ariaUltimateImageReady(image){return !!(image?.complete&&image.naturalWidth>0&&image.naturalHeight>0);}
function resetAriaUltimatePresentation(){ariaUltimateVisual.tree=null;ariaUltimateVisual.backgroundReadyAt=-1;ariaUltimateVisual.portraitReadyAt=-1;}
function ariaUltimatePresentationState(){
  const tree=typeof ariaWorldTree==='undefined'?null:ariaWorldTree;
  if(selectedCharacter!=='aria'||screenMode!=='game'||!tree||tree.life<=0||player.ariaUltimateTime<=0||player.hp<=0||(typeof gameOver!=='undefined'&&gameOver)||(typeof raidVictory!=='undefined'&&raidVictory)){
    resetAriaUltimatePresentation();return null;
  }
  if(ariaUltimateVisual.tree!==tree){
    ariaUltimateVisual.tree=tree;
    // Already loaded art starts at the cast. Art that arrives later gets its own
    // simulation-timed fade rather than appearing at full opacity in one frame.
    ariaUltimateVisual.backgroundReadyAt=ariaUltimateImageReady(ariaUltimateArt.background)?0:-1;
    ariaUltimateVisual.portraitReadyAt=ariaUltimateImageReady(ariaUltimateArt.portrait)?0:-1;
  }
  const life=Math.max(0,Math.min(tree.life,player.ariaUltimateTime)),duration=tree.maxLife||720,age=Math.max(0,tree.age??duration-life);
  return{tree,life,duration,age};
}
function ariaUltimateReadyAge(kind,state){
  const image=ensureGameImage(ariaUltimateArt[kind],'high'),key=kind+'ReadyAt';
  if(!ariaUltimateImageReady(image))return -1;
  if(ariaUltimateVisual[key]<0)ariaUltimateVisual[key]=state.age;
  return Math.max(0,state.age-ariaUltimateVisual[key]);
}
function getAriaUltimateBackdropProgress(){
  const state=ariaUltimatePresentationState();if(!state)return 0;
  const readyAge=ariaUltimateReadyAge('background',state);if(readyAge<0)return 0;
  return ariaUltimateSmooth(readyAge/36)*ariaUltimateSmooth(state.life/60);
}
function drawAriaUltimateBackdrop(){
  const alpha=getAriaUltimateBackdropProgress();if(alpha<=0||canvas.width<=0||canvas.height<=0)return;
  const image=ariaUltimateArt.background,w=canvas.width,h=canvas.height,scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale,age=ariaUltimateVisual.tree.age||0;
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=alpha;
  // This hook runs in the map pass, beneath the tree, enemies, hazards and HUD.
  ctx.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);
  for(let i=0;i<12;i++){
    const side=i%2,px=w*(side?.965-(i%3)*.028:.035+(i%3)*.028),py=h*((i*.173-age*.00045+2)%1),size=.8+i%3*.5;
    ctx.globalAlpha=alpha*(.2+.12*Math.sin(age*.018+i)**2);ctx.fillStyle=i%3?'#c9f3c3':'#f4b6cf';ctx.beginPath();ctx.ellipse(px,py,size*.6,size*1.7,age*.006+i,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function getAriaUltimatePortraitState(){
  const state=ariaUltimatePresentationState();if(!state||state.age>=ARIA_ULTIMATE_PORTRAIT_FRAMES)return null;
  const readyAge=ariaUltimateReadyAge('portrait',state);if(readyAge<0)return null;
  const enter=ariaUltimateSmooth(readyAge/18),exit=ariaUltimateSmooth((state.age-90)/30);
  return{age:state.age,alpha:enter*(1-exit)*ariaUltimateSmooth(state.life/18),slide:(1-enter)*.2+exit*.1};
}
function getAriaUltimatePortraitLayout(age=0){
  const mobile=typeof isMobileTouchDevice==='function'&&isMobileTouchDevice(),w=Math.min(canvas.width*(mobile?.46:.52),mobile?540:780),h=Math.min(canvas.height*(mobile?.235:.27),mobile?100:245),x=canvas.width-w;
  const image=ariaUltimateArt.portrait,focus=ARIA_ULTIMATE_PORTRAIT_FOCUS,zoom=(1.025-.025*ariaUltimateSmooth(age/90))*focus.scale;
  // The generated face occupies y=.24..48. Cap that region at 54% of the
  // triangle height so a shallow landscape phone does not cut off the face.
  const scale=Math.min(Math.max(w/Math.max(1,image.naturalWidth),h/Math.max(1,image.naturalHeight))*zoom,h*.54/(Math.max(1,image.naturalHeight)*.24)),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
  return{x,y:0,w,h,imageX:x+w*focus.anchorX-dw*focus.x,imageY:h*focus.anchorY-dh*focus.y,imageW:dw,imageH:dh};
}
function drawAriaUltimatePortrait(){
  // Keep paused/upgrade controls unobstructed; the cast clock is not advanced.
  if((typeof paused!=='undefined'&&paused)||(typeof choosingUpgrade!=='undefined'&&choosingUpgrade)||(typeof isMobilePortraitMode==='function'&&isMobilePortraitMode()))return;
  const state=getAriaUltimatePortraitState();if(!state||state.alpha<=0)return;
  const box=getAriaUltimatePortraitLayout(state.age),{x,w,h}=box;if(w<=0||h<=0)return;
  ctx.save();ctx.translate(w*state.slide,0);ctx.globalAlpha=state.alpha;ctx.globalCompositeOperation='source-over';
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,0);ctx.lineTo(canvas.width,h);ctx.closePath();ctx.clip();
  const shade=ctx.createLinearGradient(x,0,canvas.width,h);shade.addColorStop(0,'#0a252100');shade.addColorStop(.4,'#16372de8');shade.addColorStop(1,'#331b30f5');ctx.fillStyle=shade;ctx.fillRect(x,0,w,h);
  ctx.drawImage(ariaUltimateArt.portrait,box.imageX,box.imageY,box.imageW,box.imageH);
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<6;i++){
    const u=(i*.137+state.age*.0016)%1,px=x+w*u,py=h*(.04+i%3*.065);ctx.globalAlpha=state.alpha*.45;ctx.fillStyle=i%2?'#d1edba':'#efb6c9';ctx.beginPath();ctx.ellipse(px,py,1.1,3,-.6+state.age*.005,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  ctx.save();ctx.translate(w*state.slide,0);ctx.globalCompositeOperation='source-over';const edge=ctx.createLinearGradient(x,0,canvas.width,h);edge.addColorStop(0,'#b8dcb400');edge.addColorStop(.35,'#e3c395');edge.addColorStop(.8,'#f3bac9');edge.addColorStop(1,'#a0c9a5');ctx.strokeStyle=edge;
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.globalAlpha=state.alpha*.15;ctx.lineWidth=6;ctx.stroke();ctx.globalAlpha=state.alpha;ctx.lineWidth=1.4;ctx.stroke();ctx.restore();
}

// The existing background renderer already skips the normal map at progress 1.
const ariaUltimateBackdropLifeBase=heroUltimateBackdropLife;
heroUltimateBackdropLife=function(){return selectedCharacter==='aria'?(ariaUltimatePresentationState()?.life||0):ariaUltimateBackdropLifeBase();};
const ariaUltimateBackdropProgressBase=heroUltimateBackdropProgress;
heroUltimateBackdropProgress=function(){return selectedCharacter==='aria'?getAriaUltimateBackdropProgress():ariaUltimateBackdropProgressBase();};
const ariaUltimateBackdropBase=drawHeroUltimateBackdrop;
drawHeroUltimateBackdrop=function(){return selectedCharacter==='aria'?drawAriaUltimateBackdrop():ariaUltimateBackdropBase();};
// The shared portrait hook is called after both desktop HUD and touch controls.
const ariaUltimatePortraitBase=drawHeroUltimatePortrait;
drawHeroUltimatePortrait=function(){return selectedCharacter==='aria'?drawAriaUltimatePortrait():ariaUltimatePortraitBase();};
const ariaUltimateResetBase=resetAriaRework;
resetAriaRework=function(){resetAriaUltimatePresentation();return ariaUltimateResetBase();};
