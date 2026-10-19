// Aria's emerald glass, rose-gold ivy and world-tree presentation.
// Keep every widget in logical HUD coordinates so mobile layout editing still works.
function ariaPrestigeAsset(name){
  const image=setGameImageSource(new Image(),`assets/aria-v2/${name}.webp`);
  image.assetGroup='aria';return image;
}
const ariaPrestigeArt={portrait:ariaPrestigeAsset('portrait'),panel:ariaPrestigeAsset('panel'),frame:ariaPrestigeAsset('skill-frame')};
const ARIA_PRESTIGE_NAMES={q:'가시의 칙령',e:'기생화',x:'생명의 수확',r:'에덴의 여왕'};
const ARIA_PRESTIGE_KEYS=['q','e','x','r'];
let ariaHudFrame=0,ariaSapTexture=null;
const ariaPrestigeUpdateBase=updateAria;
updateAria=function(){if(selectedCharacter==='aria')ariaHudFrame++;return ariaPrestigeUpdateBase();};

function ariaPrestigeReady(image){ensureGameImage(image);return !!(image?.complete&&image.naturalWidth&&image.naturalHeight);}
function ariaHudText(text,x,y,width,size=12,minSize=size,bold=false){
  let fontSize=size;const font=()=>{ctx.font=`${bold?'bold ':''}${fontSize}px "Malgun Gothic", Arial`;};font();
  while(fontSize>minSize&&ctx.measureText(text).width>width){fontSize--;font();}
  if(ctx.measureText(text).width>width){while(text.length&&ctx.measureText(text+'…').width>width)text=text.slice(0,-1);text+='…';}
  ctx.fillText(text,x,y);
}
function ariaHudLeaf(x,y,size,angle,color){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();
  ctx.moveTo(-size,0);ctx.quadraticCurveTo(0,-size*.8,size,0);ctx.quadraticCurveTo(0,size*.8,-size,0);ctx.fill();
  ctx.strokeStyle='rgba(247,232,182,.42)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-size*.65,0);ctx.lineTo(size*.65,0);ctx.stroke();ctx.restore();
}
function ariaHudGem(x,y,r,active=false){
  ctx.save();ctx.translate(x,y);const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#efffda');g.addColorStop(.3,active?'#c0ffdb':'#83dcb4');g.addColorStop(.55,'#168866');g.addColorStop(1,'#062c2c');
  ctx.fillStyle=g;ctx.strokeStyle='#e5bb87';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.72,0);ctx.lineTo(0,r);ctx.lineTo(-r*.72,0);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(255,240,208,.6)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(-r*.22,0);ctx.lineTo(0,r);ctx.moveTo(-r*.72,0);ctx.lineTo(r*.72,0);ctx.stroke();ctx.restore();
}
function getAriaSapTexture(){
  if(ariaSapTexture)return ariaSapTexture;
  let surface;if(typeof OffscreenCanvas!=='undefined')surface=new OffscreenCanvas(512,80);else if(typeof document!=='undefined'&&document.createElement){surface=document.createElement('canvas');surface.width=512;surface.height=80;}else return null;
  const p=surface.getContext('2d');if(!p)return null;
  p.lineCap='round';
  for(let strand=0;strand<12;strand++){
    p.strokeStyle=strand%3?'rgba(135,255,203,.35)':'rgba(255,197,205,.6)';p.lineWidth=strand%3?1:1.6;p.beginPath();
    for(let i=0;i<=64;i++){const x=i*8,y=40+Math.sin(i/64*Math.PI*4+strand*.6)*(8+strand*2);i?p.lineTo(x,y):p.moveTo(x,y);}p.stroke();
  }
  for(let i=0;i<48;i++){const x=i*10.67,y=14+(i*29)%52;p.save();p.translate(x,y);p.rotate(i*2.4);p.fillStyle=i%3?'rgba(192,255,209,.4)':'rgba(255,207,216,.7)';p.beginPath();p.ellipse(0,0,1,3,0,0,Math.PI*2);p.fill();p.restore();}
  return ariaSapTexture=surface;
}
function drawAriaSapFlow(x,y,w,h,ratio,kind='hp'){
  const amount=w*Math.max(0,Math.min(1,Number(ratio)||0));if(amount<=0||w<=0||h<=0)return;
  ctx.save();ctx.beginPath();ctx.rect(x,y,amount,h);ctx.clip();
  const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,kind==='hp'?'#075949':'#3e2e5d');g.addColorStop(.42,kind==='hp'?'#29bb87':'#b078a9');g.addColorStop(.78,kind==='hp'?'#93e3a8':'#e5aab9');g.addColorStop(1,kind==='hp'?'#2b8268':'#8d749e');ctx.fillStyle=g;ctx.fillRect(x,y,amount,h);
  const texture=getAriaSapTexture();ctx.globalCompositeOperation='screen';
  if(texture){const span=Math.max(240,w*.9),shift=(ariaHudFrame*(kind==='hp'?.38:.58))%span;ctx.globalAlpha=.62;for(let offset=-shift;offset<w;offset+=span)ctx.drawImage(texture,x+offset,y-h*.5,span,h*2);}
  ctx.globalAlpha=.8;ctx.fillStyle='#f9eed8';
  for(let i=0;i<8;i++){const px=x+w*((i*.137+ariaHudFrame*.00055)%1),py=y+h*(.48+Math.sin(ariaHudFrame*.025+i*1.7)*.24);ctx.beginPath();ctx.ellipse(px,py,1.6,.7,-.5,0,Math.PI*2);ctx.fill();}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;const glass=ctx.createLinearGradient(0,y,0,y+h);glass.addColorStop(0,'rgba(248,255,229,.33)');glass.addColorStop(.45,'rgba(214,255,223,0)');glass.addColorStop(1,'rgba(2,25,24,.44)');ctx.fillStyle=glass;ctx.fillRect(x,y,amount,h);ctx.restore();
}
function drawAriaPanelBackground(x,y,w,h){
  ctx.save();const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(11,32,31,.96)');g.addColorStop(.52,'rgba(13,25,29,.97)');g.addColorStop(1,'rgba(42,21,37,.96)');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x+3,y+3,w-6,h-6,Math.min(14,h*.25));ctx.fill();ctx.restore();
}
function drawAriaPanelFrame(x,y,w,h,railDepth=null){
  ctx.save();ctx.shadowBlur=0;const image=ariaPrestigeArt.panel;
  if(ariaPrestigeReady(image)){
    const sw=image.naturalWidth,sh=image.naturalHeight,sx=sw*.17,sy=sh*.29,dx=Math.min(30,w*.12,h*.38),dy=railDepth===null?Math.min(28,h*.38):Math.min(railDepth,h/2-1);
    const sourceX=[0,sx,sw-sx,sw],sourceY=[0,sy,sh-sy,sh],targetX=[x,x+dx,x+w-dx,x+w],targetY=[y,y+dy,y+h-dy,y+h];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(image,sourceX[col],sourceY[row],sourceX[col+1]-sourceX[col],sourceY[row+1]-sourceY[row],targetX[col],targetY[row],targetX[col+1]-targetX[col],targetY[row+1]-targetY[row]);
  }else{
    ctx.strokeStyle='#c99d84';ctx.lineWidth=1.3;ctx.beginPath();ctx.roundRect(x+2,y+2,w-4,h-4,Math.min(12,h*.2));ctx.stroke();ctx.strokeStyle='#6eaa88';ctx.lineWidth=.7;ctx.beginPath();ctx.roundRect(x+6,y+6,w-12,h-12,Math.min(8,h*.15));ctx.stroke();
    for(const px of [x+9,x+w-9])for(const py of [y+9,y+h-9])ariaHudLeaf(px,py,5,px<x+w/2?-.7:.7,'#a2b887');
  }ctx.restore();
}
function drawAriaPanel(x,y,w,h){drawAriaPanelBackground(x,y,w,h);drawAriaPanelFrame(x,y,w,h);}
function drawAriaSkillFrame(x,y,r){
  ctx.save();ctx.shadowBlur=0;const image=ariaPrestigeArt.frame;
  if(ariaPrestigeReady(image)){const size=r*2.46;ctx.drawImage(image,x-size/2,y-size/2,size,size);}
  else{ctx.strokeStyle='#d9b28d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#7bba98';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(x,y,r*1.1,0,Math.PI*2);ctx.stroke();for(let n=0;n<8;n++){const a=n*Math.PI/4;ariaHudLeaf(x+Math.cos(a)*r*1.04,y+Math.sin(a)*r*1.04,r*.15,a+1.2,n%2?'#b98a8e':'#77a78d');}}
  ctx.restore();
}
function drawAriaPortrait(cx,cy,r){
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#12362e';ctx.fill();const image=ariaPrestigeArt.portrait;
  if(ariaPrestigeReady(image)){const size=Math.min(image.naturalWidth,image.naturalHeight);ctx.drawImage(image,(image.naturalWidth-size)/2,(image.naturalHeight-size)/2,size,size,cx-r,cy-r,r*2,r*2);}ctx.restore();drawAriaSkillFrame(cx,cy,r);
}
function drawAriaControlIcon(x,y,r,kind,active=false,dx=0,dy=0){
  ctx.save();ctx.shadowBlur=0;const g=ctx.createRadialGradient(x-r*.2,y-r*.35,1,x,y,r);g.addColorStop(0,active?'#39795a':'#285342');g.addColorStop(.65,'#102c2b');g.addColorStop(1,'#08171e');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  if(kind==='joystick'){
    ctx.strokeStyle='rgba(212,187,142,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*.71,0,Math.PI*2);ctx.stroke();
    for(let n=0;n<4;n++){const a=n*Math.PI/2;ariaHudLeaf(x+Math.cos(a)*r*.73,y+Math.sin(a)*r*.73,r*.13,a,'#7fa68c');}
    const limit=r*.6,length=Math.hypot(dx,dy),scale=length>limit?limit/length:1,nx=x+dx*scale,ny=y+dy*scale,knob=r*.32;
    ctx.fillStyle='#102824';ctx.strokeStyle='#d3ae8e';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(nx,ny,knob,0,Math.PI*2);ctx.fill();ctx.stroke();ariaHudGem(nx,ny,knob*.8,active);
  }else{
    // A blossom medallion reads as the garden's basic attack, even without an atlas.
    ctx.save();ctx.translate(x,y);ctx.rotate(-.15+Math.sin(ariaHudFrame*.025)*.045);
    for(let n=0;n<7;n++){const a=n*Math.PI*2/7;ariaHudLeaf(Math.cos(a)*r*.31,Math.sin(a)*r*.31,r*.32,a,n%2?'#a9e4b2':'#e5acba');}
    ariaHudGem(0,0,r*.27,active);ctx.restore();
  }
  drawAriaSkillFrame(x,y,r);
  if(active){ctx.strokeStyle='#e5f7ce';ctx.lineWidth=1.4;for(let n=0;n<3;n++){const a=ariaHudFrame*.025+n*Math.PI*2/3;ctx.beginPath();ctx.arc(x,y,r*.85,a,a+.35);ctx.stroke();}}
  ctx.restore();
}
function getAriaHealthBounds(){return{x:canvas.width/2,y:30,w:Math.max(80,Math.min(520,canvas.width-100))+28,h:44};}
function getAriaExpBounds(){
  const mobile=typeof isMobileTouchDevice==='function'&&isMobileTouchDevice(),margin=mobile?Math.max(120,canvas.width*.29):Math.min(260,canvas.width*.22),w=Math.max(100,Math.min(canvas.width-48,canvas.width-margin*2));
  return{x:canvas.width/2,y:canvas.height-(mobile?48:31),w:w+28,h:40};
}
function drawAriaBar(bounds,ratio,label,kind){
  const h=kind==='hp'?26:17,w=bounds.w-28,x=bounds.x-w/2,y=kind==='hp'?bounds.y-h/2:bounds.y-3;
  ctx.save();ctx.lineJoin='round';ctx.fillStyle='#071e20';ctx.strokeStyle='#b89276';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x-7,y+h/2);ctx.lineTo(x+5,y-2);ctx.lineTo(x+w-5,y-2);ctx.lineTo(x+w+7,y+h/2);ctx.lineTo(x+w-5,y+h+2);ctx.lineTo(x+5,y+h+2);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.save();ctx.beginPath();ctx.roundRect(x+3,y+2,w-6,h-4,4);ctx.clip();drawAriaSapFlow(x+3,y+2,w-6,h-4,ratio,kind);ctx.restore();
  ctx.strokeStyle='rgba(221,216,166,.5)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x+12,y-4);ctx.lineTo(x+w-12,y-4);ctx.moveTo(x+12,y+h+4);ctx.lineTo(x+w-12,y+h+4);ctx.stroke();
  for(const side of [-1,1]){const px=bounds.x+side*w/2;ariaHudLeaf(px-side*8,y+2,8,side*.5,'#73967e');ariaHudLeaf(px-side*8,y+h-2,8,-side*.5,'#b8918c');ariaHudGem(px,y+h/2,kind==='hp'?9:7,kind==='hp'&&ratio>.8);}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${kind==='hp'?13:11}px "Malgun Gothic", Arial`;ctx.strokeStyle='#071c20';ctx.lineWidth=3;ctx.fillStyle='#f4f3dd';const ty=kind==='hp'?y+h/2:y-11;ctx.strokeText(label,bounds.x,ty);ctx.fillText(label,bounds.x,ty);ctx.restore();
}
function getAriaMobileResourceBounds(){return{x:canvas.width/2,y:canvas.height-111,w:Math.min(390,Math.max(240,canvas.width*.44),canvas.width-24),h:68};}
function ariaHudStatus(){
  const growth=getAriaGrowthProgress(),essence=Math.floor(growth.essence);
  return `${growth.name} ${growth.stage+1}단계 · 정수 ${essence}${growth.next?' / '+growth.next:' · 완전체'}`;
}
function getAriaDesktopHudLayout(){
  const w=Math.min(860,canvas.width-28),stacked=w<730,h=stacked?166:126,x=(canvas.width-w)/2,y=Math.max(63,canvas.height-62-h),cell=stacked?(w-40)/4:84,skillStart=stacked?x+20:x+w-358;
  return{x,y,w,h,stacked,portrait:{x:x+(stacked?43:57),y:y+(stacked?42:61),r:stacked?25:36},text:{x:x+(stacked?83:112),y:y+(stacked?28:35),w:stacked?w-110:w-500},skills:ARIA_PRESTIGE_KEYS.map((key,i)=>({key,x:skillStart+cell*(i+.5),y:y+(stacked?109:49),r:24,labelY:y+(stacked?151:98),width:cell-6}))};
}
drawAriaInterface=function(){
  if(selectedCharacter!=='aria'||screenMode!=='game'||(typeof isMobileTouchDevice==='function'&&isMobileTouchDevice()))return;
  const box=getAriaDesktopHudLayout(),text=box.text,ultimate=player.ariaUltimateTime>0,growth=getAriaGrowthProgress();ctx.save();drawAriaPanelBackground(box.x,box.y,box.w,box.h);drawAriaPortrait(box.portrait.x,box.portrait.y,box.portrait.r);
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#f6e8dc';ariaHudText(ultimate?'아리아 · 에덴의 여왕':'아리아 · 세계수의 화원사',text.x,text.y,text.w,21,17,true);
  ctx.fillStyle='#a8e4bf';ariaHudText(ariaHudStatus(),text.x,text.y+24,text.w,12,11,true);
  if(!box.stacked){ctx.fillStyle='#bfaaaf';ariaHudText(`${ultimate?'여왕 '+(player.ariaUltimateTime/60).toFixed(1)+'초 · ':''}성장 ${Math.round(growth.ratio*100)}% · 피해 +${(growth.damageBonus*100).toFixed(1)}%`,text.x,text.y+46,text.w,11,10);drawAriaSapFlow(text.x,text.y+62,text.w,4,growth.ratio);}
  const dividerX=box.stacked?box.x+22:box.x+box.w-369,dividerY=box.stacked?box.y+76:box.y+18;ctx.strokeStyle='rgba(183,155,115,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dividerX,dividerY);ctx.lineTo(box.stacked?box.x+box.w-22:dividerX,box.stacked?dividerY:box.y+box.h-18);ctx.stroke();
  const cooldowns=[ARIA_Q_CD,ARIA_E_CD,ARIA_X_CD,ARIA_R_CD];ariaPrestigeReady(ariaSkillIconAtlas);
  for(let i=0;i<box.skills.length;i++){
    const skill=box.skills[i],cd=player['aria'+skill.key.toUpperCase()+'Cooldown']||0;drawMobileIcon({atlas:ariaSkillIconAtlas,index:i},skill.x,skill.y,skill.r);if(cd>0)drawCooldownCover(skill.x,skill.y,skill.r,cd/cooldowns[i],cd);drawAriaSkillFrame(skill.x,skill.y,skill.r);
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(skill.key==='r'&&player.level<10){ctx.fillStyle='rgba(4,17,23,.8)';ctx.beginPath();ctx.arc(skill.x,skill.y,skill.r*.91,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff2df';ctx.font='bold 11px Arial';ctx.fillText('10레벨',skill.x,skill.y);}
    ctx.fillStyle='#142d2b';ctx.strokeStyle='#c69f85';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(skill.x+15,skill.y+19,18,18,4);ctx.fill();ctx.stroke();ctx.fillStyle='#fff1da';ctx.font='bold 11px Arial';ctx.fillText(skill.key.toUpperCase(),skill.x+24,skill.y+28);
    ctx.fillStyle='#eadfd6';ariaHudText(ARIA_PRESTIGE_NAMES[skill.key],skill.x,skill.labelY,skill.width,11,10,true);
  }
  drawAriaPanelFrame(box.x,box.y,box.w,box.h);ctx.restore();
};
function drawAriaMobileResource(){
  const b=getAriaMobileResourceBounds(),x=b.x-b.w/2,y=b.y-b.h/2,growth=getAriaGrowthProgress();ctx.save();drawAriaPanelBackground(x,y,b.w,b.h);drawAriaPortrait(x+34,b.y,20);ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#eff2d9';ariaHudText(`${growth.name} · ${growth.stage+1}단계`,x+66,b.y-9,b.w-94,11,10,true);ctx.fillStyle='#b9c8b1';
  ariaHudText(`정수 ${Math.floor(growth.essence)}${growth.next?'/'+growth.next:' · 완전체'} · ${Math.round(growth.ratio*100)}%`,x+66,b.y+9,b.w-94,10,10);
  // A short two-line resource card needs shallower rails than the desktop panel.
  drawAriaPanelFrame(x,y,b.w,b.h,18);ctx.restore();
}

const ariaPrestigeHealthBase=drawHealthBar;
drawHealthBar=function(){if(selectedCharacter!=='aria')return ariaPrestigeHealthBase();drawAriaBar(getAriaHealthBounds(),player.hp/player.maxHp,`HP ${Math.max(0,Math.ceil(player.hp))} / ${Math.ceil(player.maxHp)}`,'hp');};
const ariaPrestigeExpBase=drawExpBar;
drawExpBar=function(){if(selectedCharacter!=='aria')return ariaPrestigeExpBase();drawAriaBar(getAriaExpBounds(),player.exp/player.expNeed,`LV.${player.level}  ·  EXP ${Math.floor(player.exp)} / ${player.expNeed}`,'xp');};
const ariaPrestigeResourceBase=drawMobileCharacterResource;
drawMobileCharacterResource=function(){return selectedCharacter==='aria'?drawAriaMobileResource():ariaPrestigeResourceBase();};
const ariaPrestigeBoundsBase=getMobileHudBounds;
getMobileHudBounds=function(id){if(selectedCharacter==='aria'){if(id==='health')return getAriaHealthBounds();if(id==='exp')return getAriaExpBounds();if(id==='resource')return getAriaMobileResourceBounds();}return ariaPrestigeBoundsBase(id);};
const ariaPrestigeHudBase=drawHUD;
drawHUD=function(){
  if(selectedCharacter!=='aria')return ariaPrestigeHudBase();const compact=canvas.height<420,x=16,y=compact?50:66,w=218,h=compact?42:120,inset=32;ctx.save();drawAriaPanelBackground(x,y,w,h);ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#e5d9c9';
  // The artwork's upper/lower filigree occupies 28 px at this size. Keep all
  // three text rows in the clear center, including the long score line.
  if(compact)ariaHudText(`WAVE ${wave}   ·   처치 ${player.kills}`,x+inset,y+h/2,w-inset*2,9,9,true);
  else{ariaHudText('ARIA  /  세계수의 화원',x+inset,y+38,w-inset*2,11,11,true);ctx.fillStyle='#9cceac';ariaHudText(`WAVE ${wave}   ·   처치 ${player.kills}`,x+inset,y+60,w-inset*2,11,11);ctx.fillStyle='#c2aab7';ariaHudText(`공격력 ${Math.floor(player.damage)}   ·   점수 ${player.score||0}`,x+inset,y+82,w-inset*2,11,10);}
  drawAriaPanelFrame(x,y,w,h);ctx.restore();
};

characterSkillGuide.aria={name:'아리아',color:'#b7d7a1',passive:'전투 시작부터 맵 중앙에 세계수가 뿌리내립니다. 일반 적 처치로 생명 정수 1, 보스 처치로 50을 얻으며 보스 직접 적중 8회마다 3을 추가로 얻습니다. 정수 100·300·600·1200에서 세계수가 성장하고, 정수마다 이번 전투의 피해가 0.15%씩 제한 없이 증가합니다. 세계수는 아리아 또는 나무 주변의 적을 자동 공격하며 성장 단계마다 공격 대상이 늘어납니다. 정수 600부터 처치한 적에게서 추적하는 영혼 꽃잎이 태어납니다.',skills:[
  ['기본 공격 · 추적하는 꽃잎','조준 방향으로 적을 추적하는 꽃잎 3개를 발사합니다. 정수 100부터 꽃잎이 4개가 되고 적 2명을 관통하며, 300부터 3명을 관통하고 공유 뿌리 피해가 이어집니다.'],
  ['Q · 가시의 칙령','전방으로 긴 관통 가시를 뻗어 강한 피해를 주고 8초 동안 칙령 표식을 남깁니다. 표식이 새겨진 적은 모든 아리아 공격에 25% 더 큰 피해를 받습니다. 가시 장미 증강으로 사거리·피해·표식 위력이 증가합니다.'],
  ['E · 기생화','지정한 위치에 3초간 기생 화원을 피웁니다. 적에게 6초간 반복 피해와 둔화를 주는 감염을 남기고 감염이 끝나면 폭발합니다. 감염된 적이 죽으면 폭발과 감염이 주변으로 퍼지며 최대 3대까지 전염됩니다. 보스의 감염이 끝나면 생명 정수 8을 얻습니다.'],
  ['X · 생명의 수확','반경 650의 적과 거리에 관계없이 모든 표식·감염 대상을 강하게 수확합니다. 표식과 감염은 유지되며 각각 수확 피해가 35% 증가합니다. 4초 동안 최대 체력의 20% 보호막을 얻고 이동속도가 25% 증가합니다. 기생의 화원 증강으로 수확 피해와 보호막이 강화됩니다.'],
  ['R · 에덴의 여왕','10레벨부터 12초 동안 중앙 세계수를 각성시킵니다. 세계수의 공격 주기가 0.9초에서 0.3초가 되고 공격 대상이 1명 늘어나며 평타와 Q가 메아리칩니다. 종료 시 아리아·세계수 주변과 모든 표식·감염 대상을 심판하고 보스에게 최대 체력 비례 피해를 줍니다. 정수 1200부터 마지막 심판에 연쇄 개화가 추가됩니다.']
]};
// None of the old recordings reflect Aria's new character art and effects.
characterSkillVideoKeys.aria=[];
const ariaPrestigePreviewBase=drawCharacterGameplayPreview;
drawCharacterGameplayPreview=function(id,skillIndex,skillName,x,y,w,h,color){
  if(id!=='aria')return ariaPrestigePreviewBase(id,skillIndex,skillName,x,y,w,h,color);
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.clip();drawAriaPanelBackground(x,y,w,h);
  const cx=x+w/2,cy=y+h*.43,r=Math.min(w*.26,h*.26),glow=ctx.createRadialGradient(cx,cy,2,cx,cy,r*1.8);glow.addColorStop(0,'rgba(137,214,162,.23)');glow.addColorStop(1,'rgba(130,55,104,0)');ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
  if(skillIndex===0)drawAriaPortrait(cx,cy,r);
  else{ariaPrestigeReady(ariaSkillIconAtlas);drawMobileIcon({atlas:ariaSkillIconAtlas,index:Math.max(0,Math.min(3,skillIndex-1))},cx,cy,r);drawAriaSkillFrame(cx,cy,r);}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4e8da';ariaHudText(skillName,cx,y+h*.79,w-30,20,16,true);ctx.fillStyle='#a7c7ae';ariaHudText(['추적 꽃잎 · 정수로 강화','관통 가시 · 칙령 표식','기생 화원 · 감염과 전염','표식·감염 수확 · 보호막','중앙 세계수 각성 · 12초'][skillIndex]||'세계수의 화원',cx,y+h*.87,w-30,12,10);ctx.restore();drawAriaPanelFrame(x,y,w,h);
};
