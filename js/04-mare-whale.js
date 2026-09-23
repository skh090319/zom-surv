// 마레 궁극기 전용 레비아탄 스프라이트 렌더링
const drawMareWhaleBase=drawMareEffects;
drawMareEffects=function(){
  if(selectedCharacter!=="mare"){drawMareWhaleBase();return}
  const all=mareEffects,whales=[],rest=[];
  for(const e of all){
    if(e.type==="whaleMode")whales.push(e);
    else if(e.type!=="abyss")rest.push(e);
  }
  mareEffects=rest;
  try{drawMareWhaleBase()}finally{mareEffects=all}
  if(!whales.length)return;
  worldStart();ctx.save();const time=performance.now()*.0025;
  for(const e of whales){
    e.x=player.x;e.y=player.y;e.a=player.mareUltimateAngle;
    const alpha=Math.min(.88,e.life/35),bob=Math.sin(time)*4;
    ctx.save();ctx.translate(e.x,e.y+18+bob);ctx.rotate(e.a);
    if(Math.cos(e.a)<0)ctx.scale(1,-1);
    ctx.globalAlpha=alpha;ctx.globalCompositeOperation="lighter";
    ctx.shadowColor="#55e9ff";ctx.shadowBlur=18;
    if(mareLeviathanLoaded)ctx.drawImage(mareLeviathanSprite,-190,-95,380,190);
    ctx.shadowBlur=0;
    const wake=ctx.createLinearGradient(-230,0,-80,0);wake.addColorStop(0,"rgba(77,224,242,0)");wake.addColorStop(1,`rgba(190,250,255,${alpha*.7})`);ctx.strokeStyle=wake;
    for(let i=0;i<3;i++){ctx.lineWidth=4-i;ctx.beginPath();ctx.moveTo(-250,-38+i*38);ctx.bezierCurveTo(-205,-62+i*45,-160,-45+i*38,-105,-22+i*22);ctx.stroke()}
    ctx.restore();
  }
  ctx.restore();worldEnd();
};
