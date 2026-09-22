// 세계선 붕괴만 외부로 팽창하도록 교체하는 렌더러.
function drawEchoEffectsV3(){
  if(selectedCharacter!=="echo")return;
  const all=echoEffects,collapse=all.filter(e=>e.type==="collapse");
  echoEffects=all.filter(e=>e.type!=="collapse");drawEchoEffectsV2();echoEffects=all;
  if(!collapse.length)return;worldStart();ctx.save();ctx.globalCompositeOperation="lighter";
  for(const e of collapse){
    const p=1-e.life/e.maxLife,a=Math.max(0,1-p),burst=1-Math.pow(1-p,3);
    ctx.globalCompositeOperation="source-over";ctx.fillStyle=`rgba(28,8,58,${Math.sin(p*Math.PI)*.25})`;ctx.beginPath();e.knots.forEach((q,n)=>n?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();ctx.globalCompositeOperation="lighter";
    for(let n=0;n<e.knots.length;n++){
      const q=e.knots[n],b=e.knots[(n+1)%e.knots.length],mx=(q.x+b.x)/2,my=(q.y+b.y)/2,dx=mx-e.cx,dy=my-e.cy,d=Math.hypot(dx,dy)||1,push=65*burst;
      ctx.strokeStyle=`rgba(${n%2?190:75},${n%2?115:235},255,${a*.92})`;ctx.lineWidth=4+Math.sin(p*Math.PI)*10;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(mx+dx/d*push,my+dy/d*push,b.x,b.y);ctx.stroke();
    }
    const rr=22+285*burst,g=ctx.createRadialGradient(e.cx,e.cy,Math.max(1,rr*.12),e.cx,e.cy,rr);g.addColorStop(0,"rgba(245,255,255,0)");g.addColorStop(.58,`rgba(126,88,255,${a*.16})`);g.addColorStop(.84,`rgba(92,226,255,${a*.7})`);g.addColorStop(1,"rgba(90,65,255,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.cx,e.cy,rr,0,Math.PI*2);ctx.fill();ctx.strokeStyle=`rgba(211,174,255,${a*.9})`;ctx.lineWidth=7*(1-p)+2;ctx.beginPath();ctx.arc(e.cx,e.cy,rr*.88,0,Math.PI*2);ctx.stroke();
    for(let n=0;n<14;n++){const ang=n*Math.PI/7+n*.17,dist=rr*(.55+(n%3)*.14);echoDrawShard(e.cx+Math.cos(ang)*dist,e.cy+Math.sin(ang)*dist,9+n%4,ang,a)}
  }
  ctx.restore();worldEnd();
}
