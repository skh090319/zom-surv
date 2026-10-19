// World 1/3 presentation only. The original world-2 sprite and boss paths stay intact.
function worldMonsterVisible(z,padding=110) {
  return z.x>=camera.x-padding&&z.x<=camera.x+getCameraViewWidth()+padding&&z.y>=camera.y-padding&&z.y<=camera.y+getCameraViewHeight()+padding;
}

function drawWorldMonsterSprite(z,spriteSize,spriteTop) {
  const type=z.worldMonsterType||z.worldRaidMinionType;
  const definition=typeof WORLD_MONSTER_TYPES==='object'?WORLD_MONSTER_TYPES[type]:null;
  if(!definition||z.isRaidBoss||(z.isBossMinion&&!z.worldRaidMinion))return false;
  const age=z.worldMonsterAge||0,phase=age*.105+(z.x+z.y)*.006;
  const hovering=['stitcher','abyss-eye'].includes(z.worldMonsterType);
  const bob=hovering?Math.sin(phase*.38)*3:Math.sin(phase)*1.25;
  const image=getWorldMonsterImage(type);
  ctx.save();
  ctx.fillStyle='rgba(1,3,9,.40)';ctx.beginPath();
  ctx.ellipse(z.x,z.y+z.r*.65,spriteSize*.25,spriteSize*.075,0,0,Math.PI*2);ctx.fill();
  if(z.worldMonsterHasteTime>0||z.worldMonsterWeakenTime>0){
    ctx.strokeStyle=z.worldMonsterHasteTime>0?'rgba(255,112,73,.7)':'rgba(121,237,222,.65)';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.ellipse(z.x,z.y+z.r*.65,spriteSize*.27,spriteSize*.085,0,0,Math.PI*2);ctx.stroke();
  }
  const recoil=z.worldMonsterState==='recover'?Math.sin(Math.min(1,(z.worldMonsterTimer||0)/15)*Math.PI)*.035:0;
  ctx.translate(z.x,spriteTop+spriteSize*.5+bob);
  ctx.rotate(hovering?Math.sin(phase*.24)*.025:Math.sin(phase)*.018+recoil);
  // A horizontal flip preserves the upright silhouette; no rotating the entire illustration toward a target.
  ctx.scale(Math.cos(z.worldMonsterFacing||0)<0?-1:1,1);
  if(z.stunTime>0)ctx.globalAlpha*=.76;
  if(z.worldMonsterState==='blink')ctx.globalAlpha*=.44;
  if(image?.complete&&image.naturalWidth>0){
    const scale=Math.min(spriteSize/image.naturalWidth,spriteSize/image.naturalHeight);
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(image,-image.naturalWidth*scale/2,-image.naturalHeight*scale/2,image.naturalWidth*scale,image.naturalHeight*scale);
  }else{
    // A small, themed silhouette while the lazily requested illustration decodes.
    ctx.fillStyle=definition.world===3?'#272137':'#424e4c';ctx.strokeStyle=definition.color;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,spriteSize*.07,spriteSize*.19,spriteSize*.30,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=definition.color;ctx.beginPath();ctx.arc(-spriteSize*.055,-spriteSize*.10,2,0,Math.PI*2);ctx.arc(spriteSize*.055,-spriteSize*.10,2,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();return true;
}

function drawWorldMonsterAim(z,length,halfWidth,progress,color) {
  ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.worldMonsterAim||0);
  const shade=ctx.createLinearGradient(0,0,length,0);shade.addColorStop(0,color+'03');shade.addColorStop(1,color+'22');
  ctx.fillStyle=shade;ctx.strokeStyle=color+'9c';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(length-16,-halfWidth);ctx.lineTo(length,0);ctx.lineTo(length-16,halfWidth);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.globalAlpha=.32+progress*.65;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(length-10,0);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}

function drawWorldMonsterFan(z,length,spread,progress,color,lanes=true) {
  ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.worldMonsterAim||0);
  const wash=ctx.createRadialGradient(0,0,20,0,0,length);wash.addColorStop(0,color+'04');wash.addColorStop(1,color+'0b');
  ctx.fillStyle=wash;ctx.strokeStyle=color+'38';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,length,-spread,spread);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle=color+'a0';ctx.globalAlpha=.40+progress*.55;ctx.lineWidth=1.25;ctx.setLineDash([8,11]);
  if(lanes)for(let n=-1;n<=1;n++){const angle=n*spread;ctx.beginPath();ctx.moveTo(Math.cos(angle)*22,Math.sin(angle)*22);ctx.lineTo(Math.cos(angle)*length,Math.sin(angle)*length);ctx.stroke();}
  ctx.setLineDash([]);ctx.restore();
}

function drawWorldMonsterEffects() {
  if(typeof worldMonsterProjectiles==='undefined')return;
  if(typeof selectedWorld==='number'&&selectedWorld===2&&!worldMonsterProjectiles.length&&!worldMonsterEffects.length)return;
  ctx.save();
  for(const z of zombies){
    if(!z.worldMonsterType||z.isRaidBoss||z.hp<=0||!worldMonsterVisible(z,520))continue;
    if(typeof astraControlled==='function'&&astraControlled(z))continue;
    const definition=WORLD_MONSTER_TYPES[z.worldMonsterType];if(!definition)continue;
    const color=definition.color,progress=1-Math.max(0,z.worldMonsterTimer||0)/Math.max(1,z.worldMonsterMaxTimer||1);
    const state=z.worldMonsterState;
    if(z.worldMonsterType==='stitcher'&&z.worldMonsterLinks?.length){
      for(const target of z.worldMonsterLinks){
        if(!target||target.hp<=0)continue;
        const mx=(z.x+target.x)/2,my=(z.y+target.y)/2-12;
        ctx.strokeStyle=color+'24';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(z.x,z.y-12);ctx.quadraticCurveTo(mx,my,target.x,target.y);ctx.stroke();
        ctx.strokeStyle=color+'a0';ctx.lineWidth=1.2;ctx.setLineDash([4,10]);ctx.lineDashOffset=-(z.worldMonsterAge||0)*.45;ctx.stroke();ctx.setLineDash([]);
      }
    }
    if(state==='windup'){
      ctx.strokeStyle=color+'40';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r+9,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=color+'dd';ctx.beginPath();ctx.arc(z.x,z.y,z.r+9,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();
      if(z.worldMonsterType==='glass-thrower')drawWorldMonsterFan(z,5.8*110,.23,progress,color);
      if(z.worldMonsterType==='abyss-eye'){drawWorldMonsterFan(z,z.worldMonsterBeamLength||480,.32,progress,color,false);drawWorldMonsterAim(z,z.worldMonsterBeamLength||480,6,progress,color);}
      if(z.worldMonsterType==='rift-hunter'&&Number.isFinite(z.worldMonsterTargetX)){
        ctx.strokeStyle=color+'a0';ctx.fillStyle=color+'12';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.ellipse(z.worldMonsterTargetX,z.worldMonsterTargetY,24+progress*9,14+progress*5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(z.worldMonsterTargetX-12,z.worldMonsterTargetY);ctx.lineTo(z.worldMonsterTargetX+12,z.worldMonsterTargetY);ctx.moveTo(z.worldMonsterTargetX,z.worldMonsterTargetY-8);ctx.lineTo(z.worldMonsterTargetX,z.worldMonsterTargetY+8);ctx.stroke();
      }
      if(z.worldMonsterType==='alarm-infected'){
        ctx.strokeStyle=color+'28';ctx.lineWidth=1;ctx.beginPath();ctx.arc(z.x,z.y,280,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=color+'7d';ctx.lineWidth=1.5;ctx.setLineDash([8,12]);ctx.beginPath();ctx.arc(z.x,z.y,52+progress*22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }
    }
    if(state==='beam'){
      const length=z.worldMonsterBeamLength||480,width=z.worldMonsterBeamWidth||12;
      const ex=z.x+Math.cos(z.worldMonsterAim||0)*length,ey=z.y+Math.sin(z.worldMonsterAim||0)*length;
      ctx.lineCap='round';ctx.strokeStyle=color+'25';ctx.lineWidth=width+12;ctx.beginPath();ctx.moveTo(z.x,z.y);ctx.lineTo(ex,ey);ctx.stroke();
      ctx.strokeStyle=color+'b0';ctx.lineWidth=width;ctx.stroke();ctx.strokeStyle='#fff0ff';ctx.lineWidth=Math.max(2,width*.23);ctx.stroke();ctx.lineCap='butt';
    }
  }
  for(const fx of worldMonsterEffects){
    if(!worldMonsterVisible(fx,(fx.r||70)+20))continue;
    const progress=1-fx.life/Math.max(1,fx.maxLife),color=fx.color||'#b9a1ff',radius=Math.max(4,(fx.r||42)*(.3+progress*.7));
    ctx.globalAlpha=Math.max(0,1-progress);ctx.strokeStyle=color;ctx.lineWidth=fx.type==='alarm'?2:1.6;
    ctx.beginPath();ctx.ellipse(fx.x,fx.y,radius,radius*(fx.type==='rift'?.5:1),0,0,Math.PI*2);ctx.stroke();
    if(['rift','split','linkBreak'].includes(fx.type)){
      ctx.strokeStyle=color+'70';ctx.lineWidth=1;
      for(let i=0;i<4;i++){const a=i*Math.PI*.5+progress;ctx.beginPath();ctx.moveTo(fx.x+Math.cos(a)*radius*.5,fx.y+Math.sin(a)*radius*.5);ctx.lineTo(fx.x+Math.cos(a)*radius*1.15,fx.y+Math.sin(a)*radius*1.15);ctx.stroke();}
    }
  }
  ctx.restore();
}

function drawWorldMonsterProjectiles() {
  if(typeof worldMonsterProjectiles==='undefined')return;
  ctx.save();
  for(const shot of worldMonsterProjectiles){
    if(!worldMonsterVisible(shot,36))continue;
    const angle=Math.atan2(shot.vy,shot.vx),color=shot.color||'#99ece7';
    ctx.strokeStyle=color+'45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(shot.x-Math.cos(angle)*22,shot.y-Math.sin(angle)*22);ctx.lineTo(shot.x,shot.y);ctx.stroke();
    ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(angle);ctx.fillStyle=color+'a0';ctx.strokeStyle='#e5ffff';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-4,-4);ctx.lineTo(-7,1);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  ctx.restore();
}
