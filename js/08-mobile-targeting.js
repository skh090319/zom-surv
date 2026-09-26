// Aimed casts show geometry; automatic casts show their real targets/effect areas.
// Self buffs use a small status marker rather than implying an attack radius.
function getMobileAimedSkillTargetSpec(key){
  const area=radius=>({type:"self",range:radius});
  const target=(range,radius,extra={})=>({type:"target",range,radius,variable:true,...extra});
  const line=(range,width,extra={})=>({type:"line",range,width,...extra});
  const cone=(range,arc)=>({type:"cone",range,arc});
  const level=name=>player[name]||0;
  switch(selectedCharacter){
    case "yupiter":
      return key==="r"&&player.yupiterWeapon===2?line(1440,68,{offset:42,capsule:true}):null;
    case "ren":
      if(key==="q")return renPlacedClones.length+renFlyingClones.length>=getRenCloneCount()?null:target(REN_CLONE_THROW_RANGE,24);
      return key==="r"?area(REN_ULTIMATE_RADIUS):null;
    case "nightLord":
      return key==="q"?line(300,68,{variable:true,capsule:true,clampDash:true}):null;
    case "zero":
      if(key==="q")return line((transcended.zeroThrust?330:210)*(1+level("zeroThrustLevel")*.15),56,{capsule:true,clampDash:true});
      return key==="x"?target(470,165*(1+level("zeroJudgmentLevel")*.15)):null;
    case "paladin":
      if(key==="e")return cone(170,Math.PI*.75+.24);
      if(key!=="x")return null;
      if(player.paladinCombo>=100)return area(520);
      if(player.paladinCombo>=50)return area(220);
      return player.paladinCombo>=20?cone(430,Math.PI*.2):cone(185,Math.PI*.42);
    case "arc":
      if(key==="q")return target(520,150*arcAreaScale());
      if(key==="e")return area(245*arcAreaScale());
      if(key==="x")return target(620,255*arcAreaScale());
      if(key==="r")return area(Math.min(900,(590+arcZones.length*28+zombies.filter(z=>z.arcMark).length*4)*arcAreaScale()));
      return null;
    case "terra":{
      const empowered=player.terraVibration>=100;
      if(key==="q")return line((empowered?570:460)*(1+level("terraFaultLevel")*.1),empowered?240:180,{capsule:true});
      if(key==="e")return target(520,(empowered?205:165)*(1+level("terraRampartLevel")*.1));
      if(key==="r")return {type:"rect",range:empowered?940:820,width:(empowered?410:340)*(transcended.terraRampart?1.2:1),offset:45};
      return null;
    }
    case "void":
      if(key==="q")return target(540,185+level("voidTerrainLevel")*18);
      if(key==="e")return player.voidMass>0?{type:"rect",range:230+player.voidMass*5,width:2*(46+player.voidMass*.78+level("voidTerrainLevel")*8),offset:72}:null;
      return key==="r"?area(430+level("voidCapacityLevel")*30):null;
    case "vargas":
      if(key==="q")return area((270+level("vargasSkeletonLevel")*18)*(transcended.vargasSkeleton?1.25:1));
      return key==="x"?target(380,(190+level("vargasSkeletonLevel")*16)*(transcended.vargasSkeleton?1.25:1)):null;
    case "echo":
      return key==="e"&&echoKnots.length?target(520,24,{snap:"knot"}):null;
    case "aria":
      // The cast chooses an existing garden, with no arbitrary distance cap.
      return (key==="e"||key==="x")&&ariaSoils.length?target(Math.max(310,...ariaSoils.map(s=>Math.hypot(s.x-player.x,s.y-player.y))),24,{snap:key==="e"?"garden":"soil",hideRange:true}):null;
    case "moira":
      if(key==="q")return target(360,0);
      return key==="e"?target(330,24):null;
    case "mare":
      if(key==="q")return player.mareUltimateTime>0?line(18*14,210,{capsule:true,clampDash:true}):{type:"rect",...getMareTideGeometry()};
      if(key==="e")return player.mareUltimateTime>0?{type:"rect",range:470,width:420}:(mareCore?null:target(360,250));
      if(key==="r")return {type:"direction",range:260,width:64,label:"고래 소환 방향",whale:true};
      return null;
    default:return null;
  }
}

function getMobileSkillTargetSpec(key){
  const aimed=getMobileAimedSkillTargetSpec(key);
  if(aimed)return aimed;
  if(!(MOBILE_SKILL_KEYS[selectedCharacter]||[]).includes(key))return null;
  const circle=(p,r)=>({type:"circle",x:p.x,y:p.y,r});
  const segment=(a,b,width)=>({type:"segment",x1:a.x,y1:a.y,x2:b.x,y2:b.y,width});
  const effects=(shapes,label="효과 범위")=>({type:"effects",range:0,aim:false,shapes,label});
  const status=label=>({type:"status",range:0,aim:false,label});
  const marked=(list)=>list.filter(z=>z.hp>0).map(z=>circle(z,(z.r||20)+8));
  switch(selectedCharacter){
    case "yupiter":
      if(key==="e"&&player.yupiterWeapon===2)return effects(zombies.filter(z=>z.flameMarked).map(z=>circle(z,155)),"표식 폭발");
      if(key==="r"&&player.yupiterWeapon===0)return effects([circle(player,345)],"회전검 최대 범위");
      return status(key==="q"?"무기 전환":"자신 강화");
    case "ren":
      if(key==="q")return effects(renPlacedClones.map(c=>segment(c,player,12)),"분신 회수");
      if(key==="x"){const clone=renPlacedClones.at(-1);return effects(clone?[segment(player,clone,92),circle(clone,24)]:[],"분신으로 이동");}
      if(key==="e")return effects(renPlacedClones.map(c=>circle(c,480)),"분신 습격 범위");
      break;
    case "nightLord":
      if(key==="x"){
        let target=null,distance=360;
        for(const z of zombies){const d=Math.hypot(z.x-player.x,z.y-player.y);if(z.hp>0&&z.hp/z.maxHp<=.25+(player.nightLordExecutionLevel||0)*.03&&d<distance){target=z;distance=d;}}
        return effects([circle(player,360),...(target?[circle(target,transcended.nightExecution?180:(target.r||20)+8)]:[])],target?"처형 대상":"처형 대상 탐색");
      }
      break;
    case "zero":if(key==="r")return effects([circle(player,520)],"자동 참격 범위");break;
    case "terra":if(key==="x"){
      const structures=terraStructures.filter(s=>s.type!=="collapseField"||s.borderRocks?.length),count=structures.length;
      const center=count?{x:structures.reduce((n,s)=>n+(s.x2??s.x),0)/count,y:structures.reduce((n,s)=>n+(s.y2??s.y),0)/count}:player;
      const r=(250+count*28)*(player.terraVibration>=100?1.25:1)*(transcended.terraRampart?1.3:1);
      return effects([circle(center,r)],"지각 압축 범위");
    }break;
    case "void":if(key==="x")return effects(voidTerrains.map(t=>circle({x:t.x+Math.cos(t.angle)*t.length*.5,y:t.y+Math.sin(t.angle)*t.length*.5},Math.max(130,t.length*.45))),"지반 붕괴 범위");break;
    case "carmilla":return effects(bloodDrops.filter(d=>!d.returning).map(d=>segment(d,player,16)),"피의 회수 경로");
    case "echo":
      if(key==="q")return effects([...echoRifts.map(r=>({type:"segment",...r,width:68})),...echoKnots.map(k=>circle(k,k.r))],"균열 절단 범위");
      if(key==="r"&&echoKnots.length>=3){
        const cx=echoKnots.reduce((n,k)=>n+k.x,0)/echoKnots.length,cy=echoKnots.reduce((n,k)=>n+k.y,0)/echoKnots.length;
        const points=[...echoKnots].sort((a,b)=>Math.atan2(a.y-cy,a.x-cx)-Math.atan2(b.y-cy,b.x-cx));
        return effects([{type:"polygon",points},...points.map((p,i)=>segment(p,points[(i+1)%points.length],210))],"세계선 붕괴 범위");
      }
      return status(key==="r"?"매듭 3개 필요":"이동할 매듭 필요");
    case "aria":
      if(key==="q")return effects(ariaSoils.map(s=>circle(s,(transcended.ariaThorn?90:78)+s.stage*12)),"가시 성장 범위");
      if(key!=="r")return status("정원 필요");
      break;
    case "moira":
      if(key==="x")return effects(marked(moiraLinks),"고통 전이 대상");
      if(key==="r")return effects(marked(zombies),"연결할 적");
      break;
    case "mare":
      if(key==="e"&&mareCore)return effects([circle(mareCore,210)],"소용돌이 붕괴 범위");
      if(key==="x")return effects(marked(zombies.filter(z=>z.mareWet>0)),"침수된 적 폭발");
      break;
  }
  if(["default","suncall","luminous"].includes(selectedCharacter))return status("재장전");
  if(selectedCharacter==="void"&&key==="e")return status("공허 질량 필요");
  return status(selectedCharacter==="paladin"&&key==="q"?"반격 준비":"자신 강화");
}

function getMobileAttackTargetSpec(){
  const line=(range,width)=>({type:"line",range,width});
  const cone=(range,arc)=>({type:"cone",range,arc,centerArrow:true});
  const target=(range,radius)=>({type:"target",range,radius,variable:true});
  switch(selectedCharacter){
    case "ren":return {type:"self",range:REN_ATTACK_RANGE};
    case "nightLord":return cone((player.nightLordUltimateTime>0?205:128)*(1+(player.nightLordReachLevel||0)*.15),player.nightLordFrenzyTime>0||transcended.nightReach?Math.PI*2:Math.PI*.9);
    case "zero":return {...line(ZERO_ATTACK_RANGE,20),startWidth:ZERO_ATTACK_RANGE/3+20};
    case "paladin":{const tier=getPaladinTier();return cone([138,158,182,215][tier],[.58,.68,.88,1.18][tier]*Math.PI);}
    case "carmilla":return cone(155,1.8);
    case "vargas":return cone((player.vargasUltimateTime>0?205:155)*(transcended.vargasSkeleton?1.25:1),1.45);
    case "terra":return (player.terraAttackCounter+1)%3===0?cone(410,Math.PI*.42):{type:"offsetCircle",range:72,radius:92+(player.terraResonanceLevel||0)*5};
    case "void":return target(360,84+(player.voidTerrainLevel||0)*8);
    case "aria":return target(310,60);
    case "moira":return line(330+(player.moiraThreadLevel||0)*16,24);
    case "echo":return line(215+(player.echoAfterimageLevel||0)*18,48);
    case "mare":return {type:"rect",range:player.mareUltimateTime>0?340:285,width:player.mareUltimateTime>0?216:172,startWidth:player.mareUltimateTime>0?75.6:60.2};
    case "arc":return line(504,22);
    case "yupiter":
      if(player.yupiterWeapon===1)return cone((player.trackerLevel>0?220:145)*(player.severingUltimateTime>0?3.5:1),player.trackerLevel>0?Math.PI*2:Math.PI*(.42+player.swordAuraLevel/12)*2);
      return player.yupiterWeapon===2?cone(788,.56):line(550,50);
    default:return line(player.gatlingLevel>0?1200:1300,player.gatlingLevel>0?8:10);
  }
}

function getMobileAimPoint(state,spec){
  const distance=spec.range*(spec.variable?state.strength:1),angle=state.angle||0;
  return {x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance};
}

function resolveMobilePreviewTarget(spec,point){
  if(spec.snap==="knot"){
    let best=null,score=Infinity;
    for(const k of echoKnots){const distance=Math.hypot(k.x-player.x,k.y-player.y),s=Math.hypot(k.x-point.x,k.y-point.y)+distance*.25;if(distance<520&&s<score){best=k;score=s;}}
    return best?{x:best.x,y:best.y,radius:24}:null;
  }
  if(spec.snap==="soil"||spec.snap==="garden"){
    if(!ariaSoils.length)return null;
    const nearest=ariaSoils.reduce((a,b)=>Math.hypot(b.x-point.x,b.y-point.y)<Math.hypot(a.x-point.x,a.y-point.y)?b:a);
    if(spec.snap==="soil")return {...nearest,radius:24};
    const near=ariaSoils.filter(s=>Math.hypot(s.x-nearest.x,s.y-nearest.y)<230+(player.ariaSoilLevel||0)*20);
    return {x:near.reduce((v,s)=>v+s.x,0)/near.length,y:near.reduce((v,s)=>v+s.y,0)/near.length,radius:145+near.length*18};
  }
  return {...point,radius:spec.radius};
}

// Small, fixed-count canvas paths: no particle systems, filters or frame caches.
function drawMobileAimRune(x,y,angle,size){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();
  ctx.moveTo(-size,-size*.42);ctx.lineTo(0,0);ctx.lineTo(size,-size*.42);
  ctx.moveTo(-size,size*.42);ctx.lineTo(-size*.45,0);ctx.lineTo(0,size*.42);ctx.lineTo(size*.45,0);ctx.lineTo(size,size*.42);
  ctx.stroke();ctx.restore();
}

function drawMobileAimRing(x,y,radius,{simple=false,spokes=true}={}){
  if(radius<=0){drawMobileAimReticle(x,y);return;}
  ctx.save();ctx.translate(x,y);
  const wash=ctx.createRadialGradient(0,0,radius*.12,0,0,radius);
  wash.addColorStop(0,"rgba(54,215,231,.035)");wash.addColorStop(.85,"rgba(60,213,229,.09)");wash.addColorStop(1,"rgba(87,235,247,.18)");
  ctx.fillStyle=wash;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=simple?"rgba(143,249,255,.62)":"rgba(168,253,255,.95)";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
  if(!simple){
    const band=Math.min(8,radius*.075);
    ctx.strokeStyle="rgba(79,223,241,.7)";ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,radius-band,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,radius+3,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle="rgba(154,247,255,.87)";ctx.lineWidth=1.2;
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=radius-band*.5;drawMobileAimRune(Math.cos(a)*r,Math.sin(a)*r,a+Math.PI/2,Math.min(3.5,band*.38));}
    if(spokes&&radius>28)for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*Math.PI*2/3;ctx.save();ctx.rotate(a);
      ctx.strokeStyle="rgba(99,238,250,.48)";ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(radius-band-3,0);ctx.stroke();
      ctx.strokeStyle="rgba(172,252,255,.9)";drawMobileAimRune(20,0,Math.PI/2,4);ctx.restore();
    }
  }
  ctx.restore();if(!simple&&spokes)drawMobileAimReticle(x,y);
}

function drawMobileAimReticle(x,y){
  ctx.save();ctx.translate(x,y);ctx.lineWidth=1.3;ctx.strokeStyle="#b6fbff";
  ctx.fillStyle="rgba(4,45,61,.7)";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,-7);ctx.moveTo(0,7);ctx.lineTo(0,10);ctx.moveTo(-10,0);ctx.lineTo(-7,0);ctx.moveTo(7,0);ctx.lineTo(10,0);ctx.stroke();ctx.restore();
}

function drawMobileAimCone(range,arc,centerArrow){
  if(arc>=Math.PI*2-.01){drawMobileAimRing(0,0,range,{spokes:false});return;}
  const half=arc/2,band=Math.min(9,range*.075);
  const wash=ctx.createRadialGradient(0,0,0,0,0,range);
  wash.addColorStop(0,"rgba(79,245,255,.55)");wash.addColorStop(.25,"rgba(46,218,238,.24)");wash.addColorStop(.88,"rgba(55,204,226,.10)");wash.addColorStop(1,"rgba(98,239,249,.19)");
  ctx.fillStyle=wash;ctx.strokeStyle="#a9faff";ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,range,-half,half);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle="rgba(102,239,251,.8)";ctx.lineWidth=1;
  for(const r of [range-band,range+3]){ctx.beginPath();ctx.arc(0,0,r,-half,half);ctx.stroke();}
  for(let i=0;i<5;i++){const a=-half+arc*(i+.5)/5,r=range-band*.5;drawMobileAimRune(Math.cos(a)*r,Math.sin(a)*r,a+Math.PI/2,3);}
  for(const a of [-half,half]){ctx.save();ctx.rotate(a);drawMobileAimRune(range,0,Math.PI/2,5);ctx.restore();}
  if(centerArrow){
    ctx.fillStyle="rgba(115,249,255,.4)";ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(range-19,-3);ctx.lineTo(range-19,-8);ctx.lineTo(range-5,0);ctx.lineTo(range-19,8);ctx.lineTo(range-19,3);ctx.lineTo(0,3);ctx.closePath();ctx.fill();
  }
}

function drawMobileAimLane(range,width,{arrow=false,startWidth=width,capsule=false}={}){
  const half=width/2,startHalf=startWidth/2;
  const wash=ctx.createLinearGradient(0,0,range,0);wash.addColorStop(0,"rgba(56,221,240,.05)");wash.addColorStop(.6,"rgba(63,213,236,.13)");wash.addColorStop(1,"rgba(113,247,255,.23)");
  ctx.fillStyle=wash;ctx.strokeStyle="rgba(163,250,255,.9)";ctx.lineWidth=1.5;ctx.beginPath();
  if(capsule){ctx.moveTo(0,-half);ctx.lineTo(range,-half);ctx.arc(range,0,half,-Math.PI/2,Math.PI/2);ctx.lineTo(0,half);ctx.arc(0,0,half,Math.PI/2,Math.PI*1.5);}
  else{ctx.moveTo(0,-startHalf);ctx.lineTo(range,-half);ctx.lineTo(range,half);ctx.lineTo(0,startHalf);}
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.save();ctx.clip();
  ctx.strokeStyle="rgba(83,224,243,.4)";ctx.lineWidth=1;
  for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(3,side*Math.max(0,startHalf-3));ctx.lineTo(range-3,side*Math.max(0,half-3));ctx.stroke();}
  // Chevron shapes read as a travelling lane without obscuring enemies below.
  for(let i=1;i<=5;i++){
    const x=range*i/6,w=(startHalf+(half-startHalf)*i/6)*.65,tip=Math.min(13,range*.035);
    ctx.fillStyle=`rgba(128,244,255,${.07+i*.023})`;ctx.beginPath();ctx.moveTo(x-tip,-w);ctx.lineTo(x+tip,0);ctx.lineTo(x-tip,w);ctx.lineTo(x-tip-3,w*.65);ctx.lineTo(x+tip-4,0);ctx.lineTo(x-tip-3,-w*.65);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  if(arrow){const tip=Math.min(15,Math.max(7,width*.28));ctx.strokeStyle="#b5fcff";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(range-tip,-tip);ctx.lineTo(range,0);ctx.lineTo(range-tip,tip);ctx.stroke();}
}

function drawMobileAimLabel(label,y=-35){
  ctx.save();ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  const width=ctx.measureText(label).width+16;
  ctx.fillStyle="rgba(4,20,29,.8)";ctx.fillRect(-width/2,y-10,width,20);
  ctx.fillStyle="#c8fcff";ctx.fillText(label,0,y);ctx.restore();
}

function drawMobileEffectPreview(spec,scale){
  for(const shape of spec.shapes){
    if(shape.type==="circle"){
      const x=(shape.x-player.x)*scale,y=(shape.y-player.y)*scale,r=shape.r*scale;
      const sx=(shape.x-camera.x)*scale,sy=(shape.y-camera.y)*scale;
      if(sx+r<0||sx-r>canvas.width||sy+r<0||sy-r>canvas.height)continue;
      drawMobileAimRing(x,y,r,{simple:true});
    }else if(shape.type==="segment"){
      const dx=shape.x2-shape.x1,dy=shape.y2-shape.y1;
      ctx.save();ctx.translate((shape.x1-player.x)*scale,(shape.y1-player.y)*scale);ctx.rotate(Math.atan2(dy,dx));
      drawMobileAimLane(Math.hypot(dx,dy)*scale,shape.width*scale,{arrow:true,capsule:true});ctx.restore();
    }else if(shape.type==="polygon"){
      ctx.beginPath();shape.points.forEach((p,i)=>{const x=(p.x-player.x)*scale,y=(p.y-player.y)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.closePath();ctx.fillStyle="rgba(60,213,229,.1)";ctx.fill();ctx.strokeStyle="#9df5ff";ctx.lineWidth=1.4;ctx.stroke();
    }
  }
  if(!spec.shapes.length)drawMobileAimReticle(0,0);
  drawMobileAimLabel(spec.label);
}

function drawMobileAimDirection(spec,scale){
  const r=spec.range*scale;
  drawMobileAimLane(r,spec.width*scale,{arrow:true,startWidth:16*scale});
  if(spec.whale){
    ctx.save();ctx.strokeStyle="rgba(193,253,255,.8)";ctx.fillStyle="rgba(90,222,244,.09)";ctx.lineWidth=1.2;
    const s=scale;ctx.beginPath();ctx.moveTo(-105*s,0);
    ctx.bezierCurveTo(-50*s,-48*s,100*s,-52*s,145*s,0);ctx.bezierCurveTo(115*s,40*s,-40*s,36*s,-105*s,0);
    ctx.lineTo(-145*s,-32*s);ctx.lineTo(-130*s,0);ctx.lineTo(-145*s,32*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
}

function drawMobileTargetingIndicator(){
  if(!isMobileTouchDevice()||screenMode!=="game"||paused||choosingUpgrade||gameOver||raidVictory)return;
  const state=mobileSkillAim||mobileAttackAim;
  if(!state?.dragged)return;
  const spec=mobileSkillAim?getMobileSkillTargetSpec(state.key):getMobileAttackTargetSpec();
  if(!spec)return;
  const scale=getWorldViewScale(),point=getMobileAimPoint(state,spec),px=(player.x-camera.x)*scale,py=(player.y-camera.y)*scale;
  const range=spec.range*scale;
  ctx.save();ctx.translate(px,py);ctx.lineCap="round";ctx.lineJoin="round";
  if(spec.type==="effects")drawMobileEffectPreview(spec,scale);
  else if(spec.type==="status"){
    drawMobileAimRing(0,0,(player.r+12)*scale,{simple:true});drawMobileAimLabel(spec.label);
  }else if(spec.type==="target"){
    if(!spec.hideRange)drawMobileAimRing(0,0,range,{simple:true});
    const hit=resolveMobilePreviewTarget(spec,point);
    if(hit)drawMobileAimRing((hit.x-player.x)*scale,(hit.y-player.y)*scale,hit.radius*scale);
  }else if(spec.type==="self")drawMobileAimRing(0,0,range,{spokes:false});
  else{
    let angle=state.angle||0,aimedRange=range*(spec.variable?state.strength:1);
    if(spec.clampDash){
      const x=Math.max(player.r,Math.min(WORLD.width-player.r,point.x)),y=Math.max(player.r,Math.min(WORLD.height-player.r,point.y));
      aimedRange=Math.hypot(x-player.x,y-player.y)*scale;angle=Math.atan2(y-player.y,x-player.x);
    }
    ctx.save();ctx.rotate(angle);
    if(spec.type==="direction")drawMobileAimDirection(spec,scale);
    else if(spec.type==="offsetCircle")drawMobileAimRing(range,0,spec.radius*scale);
    else if(spec.type==="cone")drawMobileAimCone(range,spec.arc,spec.centerArrow);
    else{
      ctx.translate((spec.offset||0)*scale,0);
      drawMobileAimLane(aimedRange,spec.width*scale,{arrow:spec.type==="line",capsule:spec.capsule,startWidth:(spec.startWidth??spec.width)*scale});
    }
    ctx.restore();if(spec.label)drawMobileAimLabel(spec.label);
  }
  ctx.restore();
}
