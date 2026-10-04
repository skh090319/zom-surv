// One demand-loaded WebP per hero; no videos, filters or per-frame textures.
const heroUltimateBackdrops={
  mare:setGameImageSource(new Image(),'assets/ultimate-backgrounds-v1/mare.webp'),
  oblivion:setGameImageSource(new Image(),'assets/ultimate-backgrounds-v1/oblivion.webp')
};
for(const id of Object.keys(heroUltimateBackdrops))heroUltimateBackdrops[id].assetGroup=id;
function heroUltimateBackdropLife(){
  if(screenMode!=='game'||player.hp<=0)return 0;
  return selectedCharacter==='mare'?player.mareUltimateTime||0:selectedCharacter==='oblivion'?oblivionBackdropTime||0:0;
}
function heroUltimateBackdropProgress(){
  const life=heroUltimateBackdropLife(),im=heroUltimateBackdrops[selectedCharacter];
  if(life<=0||!im?.complete||!im.naturalWidth||!im.naturalHeight)return 0;
  const duration=selectedCharacter==='mare'?420:300;
  const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
  return ease((duration-life)/24)*ease(life/36);
}
function drawHeroUltimateBackdrop(){
  const alpha=heroUltimateBackdropProgress();if(alpha<=0)return;
  const im=heroUltimateBackdrops[selectedCharacter],w=canvas.width,h=canvas.height;
  if(w<=0||h<=0)return;
  const scale=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*scale,dh=im.naturalHeight*scale;
  const sea=selectedCharacter==='mare',age=(sea?420:300)-heroUltimateBackdropLife();
  ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='source-over';
  // Cover the viewport below every enemy, projectile, skill effect and HUD.
  ctx.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);
  // A few simulation-timed motes add life without obscuring the central battle.
  ctx.fillStyle=sea?'#99f6ff':'#ff95be';
  for(let i=0;i<14;i++){
    const side=i%2,px=w*(side?.92-(i%4)*.025:.035+(i%4)*.025);
    const py=h*((i*.173-age*.0007+1)%1),r=1+i%3*.45;
    ctx.globalAlpha=alpha*(.16+.14*Math.sin(age*.025+i)**2);
    ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
