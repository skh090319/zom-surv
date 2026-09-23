// 마레 스킬 고급 연출 + 이동하는 밀물 판정
activateMareQ=function(){
  if(player.mareQCooldown>0)return;
  const a=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);
  mareEffects.push({type:"tide",x:player.x,y:player.y,a,width:transcended.mareDepth?620:430,life:64,maxLife:64,hit:new Set()});
  player.mareQCooldown=MARE_Q_CD;
};

const updateMareSkillBase=updateMare;
updateMare=function(){
  if(selectedCharacter==="mare"){
    for(const e of mareEffects){
      if(e.type!=="tide"||!e.hit)continue;
      const p=1-e.life/e.maxLife;
      const ux=Math.cos(e.a),uy=Math.sin(e.a);
      const crest=35+p*670;
      for(const z of zombies){
        if(e.hit.has(z))continue;
        const dx=z.x-e.x,dy=z.y-e.y;
        const forward=dx*ux+dy*uy;
        const side=Math.abs(dx*uy-dy*ux);
        if(Math.abs(forward-crest)>42+z.r||side>e.width*.5+z.r)continue;
        e.hit.add(z);
        mareWet(z,2);
        const push=110+(player.mareFoamLevel||0)*10;
        z.x+=ux*push;z.y+=uy*push;z.mareFoamTime=45;
        mareDamage(z,scaledDamage(player.damage*1.35*(1+(player.mareFoamLevel||0)*.12)));
        mareEffects.push({type:"foamHit",x:z.x,y:z.y,a:e.a,life:26,maxLife:26});
      }
    }
  }
  updateMareSkillBase();
};

const drawMareStableBase=drawMareEffects;
drawMareEffects=function(){
  if(selectedCharacter!=="mare")return;
  const all=mareEffects,skills=[],rest=[];
  for(const e of all)((e.type==="tide"||e.type==="coreSpawn"||e.type==="coreBurst"||e.type==="pressure"||e.type==="pressureRing"||e.type==="abyss"||e.type==="foamHit")?skills:rest).push(e);
  mareEffects=rest;
  try{drawMareStableBase()}finally{mareEffects=all}
  worldStart();ctx.save();ctx.lineCap="round";ctx.lineJoin="round";const time=performance.now()*.003;
  for(const e of skills){
    const p=1-e.life/e.maxLife,a=Math.max(0,1-p);ctx.globalCompositeOperation="lighter";
    if(e.type==="tide"){
      const ux=Math.cos(e.a),uy=Math.sin(e.a),crest=35+p*670,cx=e.x+ux*crest,cy=e.y+uy*crest;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(e.a);const half=e.width*.5;
      const body=ctx.createLinearGradient(-105,0,75,0);body.addColorStop(0,"rgba(1,49,83,0)");body.addColorStop(.35,`rgba(8,112,159,${a*.35})`);body.addColorStop(.72,`rgba(38,207,230,${a*.58})`);body.addColorStop(1,`rgba(224,255,255,${a*.82})`);ctx.fillStyle=body;
      ctx.beginPath();ctx.moveTo(-120,-half);for(let i=0;i<=10;i++){const y=-half+i*e.width/10;ctx.lineTo(38+Math.sin(i*.82+time)*9,y)}ctx.quadraticCurveTo(94,0,38,half);for(let i=10;i>=0;i--){const y=-half+i*e.width/10;ctx.lineTo(-120+Math.cos(i*.7)*8,y)}ctx.closePath();ctx.fill();
      for(let layer=0;layer<3;layer++){ctx.strokeStyle=`rgba(${layer?126:238},${layer?237:255},255,${a*(.8-layer*.17)})`;ctx.lineWidth=5-layer*1.3;ctx.beginPath();for(let i=0;i<=12;i++){const y=-half+i*e.width/12,x=40-layer*24+Math.sin(i*.86+time+layer)*7;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
      ctx.restore();
    }else if(e.type==="foamHit"){
      ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);for(let i=0;i<5;i++){const q=-.8+i*.4,r=18+p*34;ctx.strokeStyle=`rgba(220,255,255,${a*(.8-i*.06)})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(q)*r*.55,Math.sin(q)*r,Math.cos(q)*r,Math.sin(q)*r*.35);ctx.stroke()}ctx.restore();
    }else if(e.type==="coreSpawn"||e.type==="coreBurst"){
      const max=e.type==="coreBurst"?220:82,r=max*Math.sin(Math.min(1,p)*Math.PI*.72);const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,`rgba(236,255,255,${a*.95})`);g.addColorStop(.18,`rgba(45,224,239,${a*.75})`);g.addColorStop(.58,`rgba(5,91,137,${a*.3})`);g.addColorStop(1,"rgba(0,18,52,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();for(let ring=0;ring<3;ring++){ctx.strokeStyle=`rgba(${ring?79:220},${ring?221:255},255,${a*(.8-ring*.15)})`;ctx.lineWidth=4-ring;ctx.beginPath();ctx.arc(e.x,e.y,r*(.35+ring*.22),time*(ring%2?1:-1),time*(ring%2?1:-1)+4.7);ctx.stroke()}for(let i=0;i<6;i++){const q=i*Math.PI/3+time,r1=r*.42,r2=r*.82;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*r2,e.y+Math.sin(q)*r2);ctx.quadraticCurveTo(e.x+Math.cos(q+.7)*r1,e.y+Math.sin(q+.7)*r1,e.x,e.y);ctx.stroke()}
    }else if(e.type==="pressure"||e.type==="pressureRing"){
      const r=e.type==="pressure"?e.r*(1-p*.72):p*355;ctx.strokeStyle=`rgba(210,255,255,${a})`;ctx.lineWidth=e.type==="pressure"?5:6;ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(35,178,221,${a*.75})`;ctx.lineWidth=2;for(let n=0;n<3;n++){ctx.beginPath();ctx.arc(e.x,e.y,r*(.58+n*.16),time+n,time+n+4.4);ctx.stroke()}if(e.type==="pressure")for(let i=0;i<6;i++){const q=i*Math.PI/3;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*r*1.35,e.y+Math.sin(q)*r*1.35);ctx.lineTo(e.x+Math.cos(q)*r*.45,e.y+Math.sin(q)*r*.45);ctx.stroke()}
    }else if(e.type==="abyss"){
      e.x=player.x;e.y=player.y;const alpha=Math.min(.65,e.life/45);ctx.globalCompositeOperation="source-over";const sea=ctx.createRadialGradient(e.x,e.y,35,e.x,e.y,510);sea.addColorStop(0,"rgba(13,100,124,.055)");sea.addColorStop(.65,"rgba(3,48,79,.09)");sea.addColorStop(1,"rgba(0,3,16,0)");ctx.fillStyle=sea;ctx.beginPath();ctx.arc(e.x,e.y,510,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="lighter";ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);
      const pulse=Math.sin(time*.7)*8;ctx.fillStyle=`rgba(22,154,190,${alpha*.22})`;ctx.strokeStyle=`rgba(192,252,255,${alpha})`;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-475,10);ctx.bezierCurveTo(-250,-145+pulse,80,-165-pulse,455,-8);ctx.bezierCurveTo(210,28,-85,78,-475,10);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(35,-86);ctx.quadraticCurveTo(105,-178,188,-115);ctx.quadraticCurveTo(127,-94,74,-44);ctx.stroke();ctx.beginPath();ctx.moveTo(-280,10);ctx.lineTo(-360,-72);ctx.lineTo(-318,18);ctx.stroke();
      for(let band=0;band<4;band++){ctx.strokeStyle=`rgba(${band?66:230},${band?220:255},255,${alpha*(.7-band*.1)})`;ctx.lineWidth=4-band*.6;ctx.beginPath();ctx.moveTo(-450,-25+band*17);ctx.bezierCurveTo(-180,-120+band*25,130,-100+band*20,430,band*12);ctx.stroke()}ctx.restore();
    }
  }
  ctx.restore();worldEnd();
};
