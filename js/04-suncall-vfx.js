// Layered crystal refraction and precomputed lightning paths; no per-frame random geometry.
function suncallFacet(x,y,size,phase=0,alpha=1){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=alpha;
  const glow=ctx.createRadialGradient(0,-size*.35,1,0,-size*.35,size*1.4);
  glow.addColorStop(0,'rgba(110,228,255,.38)');glow.addColorStop(1,'rgba(32,90,190,0)');ctx.fillStyle=glow;ctx.fillRect(-size*1.5,-size*1.9,size*3,size*3);
  const lift=Math.sin(phase)*3;ctx.translate(0,lift);
  for(let i=0;i<3;i++){
    const ox=(i-1)*size*.43,sy=i===1?size:size*.64;
    ctx.fillStyle=['#22618a','#b9f9ff','#5fa4e0'][i];ctx.strokeStyle='#d3fbff';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ox,-sy);ctx.lineTo(ox+sy*.3,-sy*.2);ctx.lineTo(ox+sy*.2,sy*.35);ctx.lineTo(ox-sy*.23,sy*.4);ctx.lineTo(ox-sy*.33,-sy*.15);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=i===1?'#efffff':'#78caed';ctx.beginPath();ctx.moveTo(ox,-sy);ctx.lineTo(ox+sy*.3,-sy*.2);ctx.lineTo(ox,sy*.2);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(250,255,255,.65)';ctx.beginPath();ctx.moveTo(ox,-sy);ctx.lineTo(ox,sy*.2);ctx.lineTo(ox-sy*.23,sy*.4);ctx.stroke();
  }
  ctx.restore();
}
function suncallRune(x,y,r,phase,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(phase);ctx.globalAlpha*=alpha;ctx.strokeStyle='#91eaff';ctx.lineWidth=1;
  for(const factor of [.88,1]){ctx.beginPath();ctx.arc(0,0,r*factor,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(r*.91,-4);ctx.lineTo(r*.95,0);ctx.lineTo(r*.91,4);ctx.moveTo(r*.96,-3);ctx.lineTo(r*.96,3);ctx.stroke();ctx.restore();}
  ctx.restore();
}
function suncallDrawBolt(effect){
  const age=effect.maxLife-effect.life,alpha=Math.min(1,effect.life/10),points=effect.points;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=alpha;ctx.lineJoin='round';ctx.lineCap='round';
  // A broad emission layer, electric-blue sheath and white-hot filaments.
  for(const [width,color] of [[20,'rgba(39,107,255,.08)'],[10,'rgba(58,181,255,.17)'],[4.5,'#4dcbff'],[1.5,'#f5ffff']]){
    ctx.lineWidth=width;ctx.strokeStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  }
  ctx.lineWidth=1;ctx.strokeStyle='#a4e9ff';
  for(let i=4;i<points.length-3;i+=6){const p=points[i],next=points[i+2],dx=next.x-p.x,dy=next.y-p.y;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-dy*.5,p.y+dx*.5);ctx.lineTo(p.x-dy*.65+dx*.4,p.y+dx*.65+dy*.4);ctx.stroke();}
  const cursor=points[Math.min(points.length-1,Math.floor(age*1.8))];
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cursor.x,cursor.y,3.5,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawSuncallEffects(){
  if(selectedCharacter!=='suncall')return;worldStart();ctx.save();const time=suncallFrame/60;
  for(const c of suncallCrystals){
    suncallRune(c.x,c.y+7,39,time*.45+c.phase,Math.min(1,c.life/45)*.55);
    suncallFacet(c.x,c.y-5,34,time*2+c.phase,Math.min(1,c.life/35));
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#c8faff';
    for(let i=0;i<6;i++){const a=i*2.399+time,rr=20+i*5;ctx.beginPath();ctx.arc(c.x+Math.cos(a)*rr,c.y-15-(time*13+i*17)%65,1+(i%2)*.5,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  if(suncallStorm){const s=suncallStorm,fade=Math.min(1,s.age/28,s.life/40);
    const glow=ctx.createRadialGradient(s.x,s.y,s.r*.2,s.x,s.y,s.r);glow.addColorStop(0,'rgba(54,122,185,.015)');glow.addColorStop(.85,`rgba(88,178,238,${.12*fade})`);glow.addColorStop(1,'rgba(181,241,255,0)');ctx.fillStyle=glow;ctx.fillRect(s.x-s.r,s.y-s.r,s.r*2,s.r*2);
    suncallRune(s.x,s.y,s.r,time*.045,.6*fade);suncallRune(s.x,s.y,s.r*.92,-time*.075,.27*fade);
    ctx.save();ctx.translate(s.x,s.y);ctx.globalCompositeOperation='lighter';
    for(let band=0;band<5;band++){ctx.strokeStyle=`rgba(${130+band*20},235,255,${(.08+band*.016)*fade})`;ctx.lineWidth=3+band*2;ctx.beginPath();ctx.arc(0,0,s.r*(.6+band*.065),time*(.25+band*.06)+band,time*(.25+band*.06)+band+1.6);ctx.stroke();}
    ctx.strokeStyle=`rgba(224,250,255,${.6*fade})`;ctx.lineWidth=1;
    for(let i=0;i<84;i++){const a=i*2.399+time*(.25+i%3*.06),rr=Math.sqrt((i+.5)/84)*s.r,px=Math.cos(a)*rr,py=Math.sin(a)*rr-(time*24+i*7)%22;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+5,py-9);if(i%7===0){ctx.moveTo(px-3,py-5);ctx.lineTo(px+6,py-4);}ctx.stroke();}
    ctx.restore();
  }
  for(const shot of suncallShots){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    if(shot.trail.length){for(const [width,color] of [[shot.spear?19:9,'rgba(61,158,255,.12)'],[shot.spear?5:2,'#83ebff']]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();shot.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(shot.x,shot.y);ctx.stroke();}}
    ctx.translate(shot.x,shot.y);ctx.rotate(shot.angle);const size=shot.spear?40:16;
    ctx.fillStyle='#b9f4ff';ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*.55,-size*.18);ctx.lineTo(-size*.35,0);ctx.lineTo(-size*.55,size*.18);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#428cd4';ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size*.35,0);ctx.stroke();ctx.restore();
  }
  for(const effect of suncallEffects){
    if(effect.type==='bolt'){suncallDrawBolt(effect);continue;}
    const t=1-effect.life/effect.maxLife,alpha=(1-t)*(1-t),r=effect.r*(.18+.82*(1-Math.pow(1-t,3)));
    ctx.save();ctx.globalCompositeOperation='lighter';
    const halo=ctx.createRadialGradient(effect.x,effect.y,0,effect.x,effect.y,Math.max(1,r));
    halo.addColorStop(0,`rgba(228,253,255,${alpha*.42})`);halo.addColorStop(.4,`rgba(78,179,255,${alpha*.2})`);halo.addColorStop(1,'rgba(40,89,190,0)');ctx.fillStyle=halo;ctx.fillRect(effect.x-r,effect.y-r,r*2,r*2);
    for(let ring=0;ring<(effect.type==='final'?4:2);ring++){ctx.strokeStyle=`rgba(180,243,255,${alpha/(ring+1)})`;ctx.lineWidth=ring?1:2;ctx.beginPath();ctx.arc(effect.x,effect.y,r*(1-ring*.14),0,Math.PI*2);ctx.stroke();}
    const count=effect.type==='final'?36:12;
    for(let i=0;i<count;i++){const a=i*2.399+effect.seed*.1,rr=r*(.5+(i%4)*.13),px=effect.x+Math.cos(a)*rr,py=effect.y+Math.sin(a)*rr;
      ctx.fillStyle=`rgba(196,246,255,${alpha})`;ctx.beginPath();ctx.moveTo(px+Math.cos(a)*8,py+Math.sin(a)*8);ctx.lineTo(px+Math.cos(a+2)*3,py+Math.sin(a+2)*3);ctx.lineTo(px+Math.cos(a-2)*3,py+Math.sin(a-2)*3);ctx.closePath();ctx.fill();}
    ctx.restore();
  }
  ctx.restore();worldEnd();
}
function drawSuncallForeground(){
  if(selectedCharacter!=='suncall')return;worldStart();ctx.save();
  for(const z of zombies)if(z.suncallFrozenTime>0||z.suncallCold>0){
    ctx.save();ctx.translate(z.x,z.y);ctx.strokeStyle=z.suncallFrozenTime>0?'#c7f9ff':'#71cfee';ctx.lineWidth=1.4;ctx.globalAlpha=z.suncallFrozenTime>0?.72:.5;
    if(z.suncallFrozenTime>0){ctx.fillStyle='rgba(90,187,231,.15)';ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,r=(z.r||20)+10;i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();}
    for(let i=0;i<(z.suncallCold||0);i++){ctx.fillStyle='#acffff';ctx.fillRect(-5+i*7,-(z.r||20)-14,4,5);}ctx.restore();
  }
  if(player.suncallShield>0){const fade=Math.min(1,player.suncallShieldTime/35),r=player.r+30;
    suncallRune(player.x,player.y,r,suncallFrame*.005,fade*.8);ctx.fillStyle=`rgba(133,216,255,${.09*fade})`;ctx.strokeStyle=`rgba(194,247,255,${.65*fade})`;ctx.beginPath();ctx.arc(player.x,player.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();worldEnd();
}
function drawSuncallInterface(){
  if(selectedCharacter!=='suncall')return;
  const w=Math.min(700,canvas.width-30),x=(canvas.width-w)/2,y=canvas.height-162;
  ctx.save();drawRoundedRect(x,y,w,103,14,'rgba(7,22,41,.94)','#76d9ef',1.5);
  ctx.textAlign='left';ctx.fillStyle='#d2f8ff';ctx.font='21px DoHyeon, Arial';ctx.fillText('썬콜 · 빙결 회로술사',x+18,y+28);
  ctx.font='bold 12px Arial';ctx.fillStyle='#87dced';ctx.fillText(`결정 ${suncallCrystals.length}/${suncallCapacity()} · 보호막 ${Math.ceil(player.suncallShield||0)}`,x+18,y+53);
  ctx.font='11px Arial';ctx.fillStyle='#a3b9d0';ctx.fillText('냉기 3중첩 → 빙결 · 결정과 적을 번개로 연결',x+18,y+76,w-310);
  ['q','e','x','r'].forEach((key,i)=>{const cx=x+w-246+i*65,cy=y+38,r=23;
    drawMobileIcon({atlas:suncallSkillIconAtlas,index:i},cx,cy,r);ctx.strokeStyle='#adefff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    const cd=player['suncall'+key.toUpperCase()+'Cooldown']||0,max=[SUNCALL_Q_CD,SUNCALL_E_CD,SUNCALL_X_CD,SUNCALL_R_CD][i];
    if(cd>0)drawCooldownCover(cx,cy,r,cd/max,cd);
    if(key==='r'&&player.level<10){ctx.fillStyle='rgba(0,7,20,.75)';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 12px Arial';ctx.fillText('10레벨',cx,cy+4);}
    drawSkillHudLabel(cx,y+84,['서리창','뇌전 회로','결정 회수','백야의 뇌폭'][i],key.toUpperCase(),'#d5f8ff');
  });ctx.restore();
}
