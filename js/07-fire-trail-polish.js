// 초월 증강 '화염 질주' — 입자 객체를 늘리지 않는 다층 화염 렌더링
drawFireTrails=function(){
  worldStart();ctx.save();const time=performance.now()*.004;
  for(const fire of fireTrails){
    if(!isInCameraView(fire.x,fire.y,fire.r+45))continue;
    const alpha=Math.max(0,fire.life/fire.maxLife),age=1-alpha,pulse=1+Math.sin(time+fire.x*.017+fire.y*.011)*.06;
    ctx.globalCompositeOperation="source-over";
    const smoke=ctx.createRadialGradient(fire.x,fire.y,fire.r*.3,fire.x,fire.y,fire.r*1.34*pulse);
    smoke.addColorStop(0,`rgba(68,16,6,${alpha*.16})`);smoke.addColorStop(.7,`rgba(28,12,10,${alpha*.13})`);smoke.addColorStop(1,"rgba(8,8,10,0)");ctx.fillStyle=smoke;ctx.beginPath();ctx.arc(fire.x,fire.y,fire.r*1.34*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation="lighter";
    const heat=ctx.createRadialGradient(fire.x,fire.y,2,fire.x,fire.y,fire.r*1.08);
    heat.addColorStop(0,`rgba(255,252,196,${alpha*.92})`);heat.addColorStop(.18,`rgba(255,210,48,${alpha*.82})`);heat.addColorStop(.52,`rgba(255,83,7,${alpha*.56})`);heat.addColorStop(.82,`rgba(155,20,5,${alpha*.28})`);heat.addColorStop(1,"rgba(70,0,0,0)");ctx.fillStyle=heat;ctx.beginPath();ctx.arc(fire.x,fire.y,fire.r*1.08*pulse,0,Math.PI*2);ctx.fill();
    for(let i=0;i<5;i++){
      const seed=fire.x*.013+fire.y*.021+i*1.71,q=i*Math.PI*2/5+seed,w=7+(i%2)*3,h=(25+i*4)*alpha*(.9+Math.sin(time*1.4+seed)*.09),bx=fire.x+Math.cos(q)*fire.r*.56,by=fire.y+Math.sin(q)*fire.r*.38;
      const flame=ctx.createLinearGradient(bx,by,bx-Math.cos(q)*h*.16,by-h);flame.addColorStop(0,`rgba(255,61,4,${alpha*.64})`);flame.addColorStop(.5,`rgba(255,164,16,${alpha*.82})`);flame.addColorStop(1,"rgba(255,245,164,0)");ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(bx-w,by);ctx.bezierCurveTo(bx-w*.7,by-h*.42,bx+w*.3,by-h*.72,bx+Math.sin(seed)*3,by-h);ctx.bezierCurveTo(bx+w*.8,by-h*.55,bx+w,by-h*.3,bx+w,by);ctx.closePath();ctx.fill();
    }
    ctx.strokeStyle=`rgba(255,226,88,${alpha*.48})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(fire.x,fire.y,fire.r*(.58+age*.16),0,Math.PI*2);ctx.stroke();
    for(let i=0;i<3;i++){const seed=fire.x*.019+fire.y*.007+i*2.3,r=fire.r*(.28+i*.2),q=seed+time*.22,ex=fire.x+Math.cos(q)*r,ey=fire.y+Math.sin(q)*r-age*(12+i*5);ctx.fillStyle=`rgba(255,${i?126:231},${i?18:96},${alpha*.72})`;ctx.beginPath();ctx.arc(ex,ey,1.5+i*.45,0,Math.PI*2);ctx.fill()}
  }
  ctx.restore();worldEnd();
};
