// 마레 평타 해류: 중심축은 고정하고 밝기와 진행률만 변화시켜 화면 흔들림을 제거한다.
const drawMareEffectsBase=drawMareEffects;
drawMareEffects=function(){
  if(selectedCharacter!=="mare")return;
  const allEffects=mareEffects;
  const currents=[];
  const others=[];
  for(const effect of allEffects)(effect.type==="current"?currents:others).push(effect);
  mareEffects=others;
  try{drawMareEffectsBase()}finally{mareEffects=allEffects}
  if(!currents.length)return;
  worldStart();
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  ctx.lineCap="round";
  const now=performance.now()*.0024;
  for(const e of currents){
    const p=1-e.life/e.maxLife;
    const alpha=Math.max(0,1-p);
    const reveal=Math.min(1,p*3.2);
    const len=e.range*reveal;
    const half=e.width*.42*(.72+.28*reveal);
    const sway=Math.sin(now+e.x*.004+e.y*.003)*half*.065;
    ctx.save();
    ctx.translate(e.x,e.y);
    ctx.rotate(e.a);
    const water=ctx.createLinearGradient(0,0,Math.max(1,len),0);
    water.addColorStop(0,`rgba(21,119,165,${alpha*.18})`);
    water.addColorStop(.38,`rgba(32,190,220,${alpha*.5})`);
    water.addColorStop(.78,`rgba(111,239,248,${alpha*.58})`);
    water.addColorStop(1,"rgba(227,255,255,0)");
    ctx.fillStyle=water;
    ctx.beginPath();
    ctx.moveTo(0,-half*.32);
    ctx.bezierCurveTo(len*.28,-half*.88+sway*.25,len*.68,-half*.58-sway*.35,len,-half*.08+sway);
    ctx.bezierCurveTo(len*.68,half*.62+sway*.35,len*.3,half*.92-sway*.2,0,half*.34);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor="#75efff";
    ctx.shadowBlur=8;
    ctx.strokeStyle=`rgba(225,255,255,${alpha*.9})`;
    ctx.lineWidth=3.2;
    ctx.beginPath();
    ctx.moveTo(2,-half*.28);
    ctx.bezierCurveTo(len*.3,-half*.83+sway*.22,len*.7,-half*.5-sway*.32,len,-half*.06+sway);
    ctx.stroke();
    ctx.shadowBlur=0;
    for(let i=0;i<3;i++){
      const offset=(-.12+i*.24)*half;
      ctx.strokeStyle=`rgba(${i===1?224:93},${i===1?255:226},255,${alpha*(.42-i*.05)})`;
      ctx.lineWidth=i===1?2:1.4;
      ctx.beginPath();
      ctx.moveTo(8,offset);
      ctx.bezierCurveTo(len*.3,offset-half*(.38-i*.09)+sway*.18,len*.66,offset+half*(.22-i*.05)-sway*.28,len*.95,offset*.25+sway*.82);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  worldEnd();
};
