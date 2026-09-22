// 아리아 가독성 보강: 연결 화원과 평타 개화를 밝고 선명하게 표시한다.
let ariaGardenLinkKey="",ariaGardenLinks=[];
function getAriaGardenLinks(){const range=190+(player.ariaSoilLevel||0)*18,key=`${range}|${ariaSoils.map(s=>`${s.x|0},${s.y|0}`).join(";")}`;if(key===ariaGardenLinkKey)return ariaGardenLinks;ariaGardenLinkKey=key;ariaGardenLinks=[];const r2=range*range;for(let i=0;i<ariaSoils.length;i++)for(let j=i+1;j<ariaSoils.length;j++){const a=ariaSoils[i],b=ariaSoils[j],dx=a.x-b.x,dy=a.y-b.y;if(dx*dx+dy*dy<=r2)ariaGardenLinks.push([a,b])}return ariaGardenLinks}
function drawAriaEffectsV2(){
  drawAriaEffects();
  if(selectedCharacter!=="aria")return;worldStart();ctx.save();const now=performance.now();
  ctx.globalCompositeOperation="source-over";
  for(const [a,b] of getAriaGardenLinks()){
    ctx.strokeStyle="rgba(171,111,194,.14)";ctx.lineWidth=30;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.globalCompositeOperation="lighter";ctx.strokeStyle="rgba(173,244,235,.46)";ctx.lineWidth=2.5;ctx.setLineDash([12,9]);ctx.lineDashOffset=-now*.018;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.globalCompositeOperation="source-over";
  }
  ctx.globalCompositeOperation="lighter";
  for(const s of ariaSoils){const pulse=1+Math.sin(s.phase)*.05,rr=s.r*.7*pulse;ctx.shadowColor="#ff83bd";ctx.shadowBlur=13;ctx.strokeStyle="rgba(255,150,205,.72)";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(s.x,s.y,rr,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle="rgba(107,240,225,.58)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(s.x,s.y,rr*.72,0,Math.PI*2);ctx.stroke()}
  for(const e of ariaEffects){if(e.type!=="bloom"&&e.type!=="echoBloom")continue;const p=1-e.life/e.maxLife,a=Math.max(0,1-p),burst=Math.min(1,p*4),rr=e.r*(.3+.7*burst);const glow=ctx.createRadialGradient(e.x,e.y,1,e.x,e.y,rr);glow.addColorStop(0,`rgba(255,255,255,${a*.95})`);glow.addColorStop(.2,`rgba(255,154,211,${a*.75})`);glow.addColorStop(.62,`rgba(89,241,226,${a*.35})`);glow.addColorStop(1,"rgba(255,120,190,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill();ctx.shadowColor="#fff0f7";ctx.shadowBlur=16;ctx.strokeStyle=`rgba(255,236,247,${a})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,rr*.78,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;for(let n=0;n<10;n++){const q=n*Math.PI/5+p*.7;ariaPetal(e.x+Math.cos(q)*rr*.62,e.y+Math.sin(q)*rr*.62,12+(n%2)*4,q+Math.PI/2,a,n%2?`rgba(99,244,227,${a})`:`rgba(255,137,198,${a})`)}}
  ctx.restore();worldEnd();
}
