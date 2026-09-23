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

// 궁극기 중에는 일반 마레 패널 대신 레비아탄 조종 전용 HUD를 사용한다.
const drawMareNormalInterface=drawMareInterface;
drawMareInterface=function(){
  if(selectedCharacter!=="mare"||screenMode!=="game")return;
  if(player.mareUltimateTime<=0){drawMareNormalInterface();return;}

  const w=Math.min(780,canvas.width-24),h=126,x=(canvas.width-w)/2,y=canvas.height-184;
  const remaining=Math.ceil(player.mareUltimateTime/60),ratio=Math.max(0,Math.min(1,player.mareUltimateTime/420));
  ctx.save();
  const panel=ctx.createLinearGradient(x,y,x+w,y+h);
  panel.addColorStop(0,"rgba(0,10,27,.98)");
  panel.addColorStop(.5,"rgba(3,54,82,.98)");
  panel.addColorStop(1,"rgba(20,8,54,.98)");
  drawRoundedRect(x,y,w,h,25,panel,"#9af7ff",2.5);
  ctx.shadowColor="#39dcff";ctx.shadowBlur=22;
  ctx.strokeStyle="rgba(127,240,255,.42)";ctx.lineWidth=1;
  drawRoundedRect(x+5,y+5,w-10,h-10,21,"rgba(0,0,0,0)","rgba(127,240,255,.32)",1);
  ctx.shadowBlur=0;

  ctx.save();ctx.beginPath();ctx.arc(x+62,y+61,47,0,Math.PI*2);ctx.clip();
  const portrait=ctx.createRadialGradient(x+62,y+61,4,x+62,y+61,50);
  portrait.addColorStop(0,"#197a9e");portrait.addColorStop(1,"#03091b");ctx.fillStyle=portrait;ctx.fillRect(x+12,y+11,100,100);
  if(mareLeviathanLoaded){
    ctx.save();ctx.translate(x+62,y+61);ctx.rotate(-.08);ctx.drawImage(mareLeviathanSprite,-72,-36,144,72);ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle="#b9fbff";ctx.shadowColor="#42dfff";ctx.shadowBlur=18;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+62,y+61,47,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;

  const sx=x+124;
  ctx.textAlign="left";ctx.fillStyle="#efffff";ctx.font="900 19px Arial";ctx.fillText("레비아탄 조종",sx,y+27);
  ctx.fillStyle="#70eaff";ctx.font="bold 12px Arial";ctx.fillText(`심해 개방 · 남은 시간 ${remaining}초`,sx,y+49);
  drawRoundedRect(sx,y+61,190,12,6,"rgba(255,255,255,.08)","rgba(137,240,255,.2)",1);
  const timer=ctx.createLinearGradient(sx,0,sx+190,0);timer.addColorStop(0,"#218ebc");timer.addColorStop(.62,"#55eaff");timer.addColorStop(1,"#e7feff");
  if(ratio>0)drawRoundedRect(sx,y+61,190*ratio,12,6,timer);
  ctx.fillStyle="#b8dbe5";ctx.font="11px Arial";ctx.fillText("커서 방향 조종 · 무적 · 이동 경로에 강화 해류 생성",sx,y+94);

  const skills=[
    ["Q","고래 돌진",player.mareQCooldown,120],
    ["E","심해 흡입",player.mareECooldown,150],
    ["X","수압",player.mareXCooldown,MARE_X_CD],
    ["R","개방 중",0,420]
  ];
  skills.forEach((skill,index)=>{
    const cx=x+w-300+index*72,cy=y+51,r=27;
    ctx.save();ctx.translate(cx,cy);
    const glow=ctx.createRadialGradient(0,0,3,0,0,r);
    glow.addColorStop(0,index===3?"#b981ff":"#8df7ff");glow.addColorStop(1,index===3?"#321353":"#073a59");
    ctx.fillStyle=glow;ctx.shadowColor=index===3?"#b65cff":"#4ae6ff";ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#d9fdff";ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle="#efffff";ctx.fillStyle="#efffff";ctx.lineCap="round";ctx.lineWidth=3;
    if(index===0){ctx.beginPath();ctx.moveTo(-12,8);ctx.quadraticCurveTo(0,-13,14,-3);ctx.stroke();ctx.beginPath();ctx.moveTo(6,-11);ctx.lineTo(15,-3);ctx.lineTo(5,2);ctx.stroke();}
    else if(index===1){for(let j=-1;j<=1;j++){ctx.beginPath();ctx.arc(-j*5,j*3,8+j*2,.15,Math.PI*1.55);ctx.stroke();}}
    else if(index===2){ctx.beginPath();ctx.arc(0,0,14,.25,Math.PI*1.75);ctx.stroke();ctx.beginPath();ctx.moveTo(-4,-9);ctx.lineTo(8,0);ctx.lineTo(-4,9);ctx.stroke();}
    else{ctx.font="900 20px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("R",0,1);}
    ctx.restore();
    if(skill[2]>0)drawCooldownCover(cx,cy,r,skill[2]/skill[3],skill[2]);
    drawSkillHudLabel(cx,y+106,skill[1],skill[0],index===3?"#e7caff":"#d9fbff");
  });
  ctx.restore();
};
