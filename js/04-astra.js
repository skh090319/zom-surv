// 아스트라 — 붕괴한 성좌를 몸에 두른 궤도형 성좌술사
let astraMeteors=[];
let astraWells=[];
let astraEffects=[];
const ASTRA_Q_CD=300,ASTRA_E_CD=510,ASTRA_X_CD=780,ASTRA_R_CD=1680;

function astraDamage(z,amount){
  if(!z||z.hp<=0)return false;z.hp-=amount;
  if(z.hp<=0){const i=zombies.indexOf(z);if(i>=0)killZombie(i,z);return true}return false;
}
function astraOrbitCount(){return 3+(player.astraBlueLevel||0)+(transcended.astraBlue?2:0)}
function astraOrbitTarget(){return player.astraOverdriveTime>0?1:0}
function astraOrbitRadius(){return 72+(player.astraRedLevel||0)*6+(player.astraOrbitBlend||0)*(82+(player.astraHorizonLevel||0)*8)}
function astraOrbitSpeed(){return .026+(player.astraBlueLevel||0)*.003+(player.astraOrbitBlend||0)*.052}

function attackWithAstra(){
  if(player.fireCooldown>0)return;
  const a=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x);
  astraMeteors.push({x:player.x,y:player.y,vx:Math.cos(a)*13,vy:Math.sin(a)*13,a,curve:(Math.random()-.5)*.018,life:72,maxLife:72,damage:scaledDamage(player.damage*1.02),r:11,kind:"shot"});
  astraEffects.push({type:"spark",x:player.x,y:player.y,a,life:22,maxLife:22});player.fireCooldown=Math.max(11,24-player.fireRateBonus*2);
}
function activateAstraQ(){
  if(player.astraQCooldown>0)return;const a=Math.atan2(mouse.worldY-player.y,mouse.worldX-player.x),level=player.astraRedLevel||0;
  astraMeteors.push({x:player.x,y:player.y,vx:Math.cos(a)*11.5,vy:Math.sin(a)*11.5,a,curve:.025,life:92,maxLife:92,damage:scaledDamage(player.damage*(2.15+level*.18)),r:22,kind:"meteor",pierce:2+level});
  astraEffects.push({type:"meteorCast",x:player.x,y:player.y,a,life:42,maxLife:42});player.astraQCooldown=ASTRA_Q_CD;
}
function activateAstraE(){
  if(player.astraECooldown>0)return;const dx=mouse.worldX-player.x,dy=mouse.worldY-player.y,d=Math.hypot(dx,dy)||1,range=Math.min(520,d),r=170+(player.astraHorizonLevel||0)*18;
  const x=player.x+dx/d*range,y=player.y+dy/d*range;astraWells.push({x,y,r,life:270,maxLife:270,tick:1,phase:0});astraEffects.push({type:"wellBorn",x,y,r,life:50,maxLife:50});player.astraECooldown=ASTRA_E_CD;
}
function activateAstraX(){
  if(player.astraXCooldown>0)return;player.astraOverdriveTime=480+(player.astraBlueLevel||0)*45;astraEffects.push({type:"expand",x:player.x,y:player.y,life:72,maxLife:72});player.astraXCooldown=ASTRA_X_CD;
}
function activateAstraR(){
  if(player.level<10||player.astraRCooldown>0)return;const r=620+(player.astraRedLevel||0)*28;
  for(const z of [...zombies])if(z.hp>0&&Math.hypot(z.x-player.x,z.y-player.y)<r+z.r){const extra=z.isRaidBoss?enemyMaxHpDamage(z,.045+(player.astraHorizonLevel||0)*.006):0;astraDamage(z,scaledDamage(player.damage*(3.3+(player.astraRedLevel||0)*.25))+extra);z.slowTime=Math.max(z.slowTime||0,80)}
  astraEffects.push({type:"supernova",x:player.x,y:player.y,r,life:100,maxLife:100});player.astraSupernovaTime=180;player.astraRCooldown=ASTRA_R_CD;
}

function updateAstra(){
  if(selectedCharacter!=="astra")return;
  for(const k of ["astraQCooldown","astraECooldown","astraXCooldown","astraRCooldown","astraOverdriveTime","astraSupernovaTime"])if(player[k]>0)player[k]--;
  const target=astraOrbitTarget(),rate=target>.5?.035:.018;player.astraOrbitBlend+=(target-(player.astraOrbitBlend||0))*rate;if(Math.abs(player.astraOrbitBlend-target)<.002)player.astraOrbitBlend=target;
  player.astraOrbitAngle=(player.astraOrbitAngle||0)+astraOrbitSpeed();
  const count=astraOrbitCount(),radius=astraOrbitRadius();player.astraOrbitTick=(player.astraOrbitTick||0)-1;
  if(player.astraOrbitTick<=0){player.astraOrbitTick=player.astraOverdriveTime>0?8:13;for(let n=0;n<count;n++){const a=player.astraOrbitAngle+n*Math.PI*2/count,x=player.x+Math.cos(a)*radius,y=player.y+Math.sin(a)*radius;for(const z of [...zombies]){if(z.hp<=0||Math.hypot(z.x-x,z.y-y)>z.r+16||z.astraOrbitHit>0)continue;z.astraOrbitHit=16;astraDamage(z,scaledDamage(player.damage*(.26+(player.astraBlueLevel||0)*.035)));astraEffects.push({type:"orbitHit",x,y,life:20,maxLife:20})}}}
  for(const z of zombies)if(z.astraOrbitHit>0)z.astraOrbitHit--;
  for(let i=astraMeteors.length-1;i>=0;i--){const m=astraMeteors[i];m.a+=m.curve;m.vx=Math.cos(m.a)*Math.hypot(m.vx,m.vy);m.vy=Math.sin(m.a)*Math.hypot(m.vx,m.vy);m.x+=m.vx;m.y+=m.vy;m.life--;let remove=m.life<=0;for(const z of [...zombies]){if(remove||z.hp<=0||Math.hypot(z.x-m.x,z.y-m.y)>z.r+m.r)continue;astraDamage(z,m.damage);astraEffects.push({type:m.kind==="meteor"?"meteorHit":"orbitHit",x:m.x,y:m.y,life:30,maxLife:30});if(m.pierce&&--m.pierce>0){m.damage*=.82;m.x+=m.vx*2}else remove=true}if(remove)astraMeteors.splice(i,1)}
  for(let i=astraWells.length-1;i>=0;i--){const w=astraWells[i];w.life--;w.phase+=.06;if(--w.tick<=0){w.tick=18-(transcended.astraHorizon?4:0);for(const z of [...zombies]){const dx=w.x-z.x,dy=w.y-z.y,d=Math.hypot(dx,dy);if(z.hp<=0||d>w.r+z.r)continue;if(d>8){const pull=(2.4+(player.astraHorizonLevel||0)*.35)*(1-d/w.r*.35);z.x+=dx/d*pull;z.y+=dy/d*pull}z.slowTime=Math.max(z.slowTime||0,25);astraDamage(z,scaledDamage(player.damage*(.22+(player.astraHorizonLevel||0)*.035)))}}if(w.life<=0){astraEffects.push({type:"collapse",x:w.x,y:w.y,r:w.r,life:40,maxLife:40});for(const z of [...zombies])if(z.hp>0&&Math.hypot(z.x-w.x,z.y-w.y)<w.r+z.r)astraDamage(z,scaledDamage(player.damage*(1.5+(player.astraHorizonLevel||0)*.18)));astraWells.splice(i,1)}}
  for(let i=astraEffects.length-1;i>=0;i--){const e=astraEffects[i];if(e.type==="expand"){e.x=player.x;e.y=player.y}if(--e.life<=0)astraEffects.splice(i,1)}if(astraEffects.length>100)astraEffects.splice(0,astraEffects.length-100);
}

function astraRuneRing(x,y,r,rotation,alpha){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.strokeStyle=`rgba(255,210,102,${alpha})`;ctx.lineWidth=2;ctx.setLineDash([14,7,3,8]);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillStyle=i%2?`rgba(119,225,255,${alpha})`:`rgba(255,221,128,${alpha})`;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a);ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-3);ctx.lineTo(-2,0);ctx.lineTo(-4,3);ctx.closePath();ctx.fill();ctx.restore()}ctx.restore()}
function drawAstraEffects(){
  if(selectedCharacter!=="astra")return;worldStart();ctx.save();const t=performance.now()*.001,blend=player.astraOrbitBlend||0,count=astraOrbitCount(),radius=astraOrbitRadius();ctx.globalCompositeOperation="lighter";
  const aura=ctx.createRadialGradient(player.x,player.y,20,player.x,player.y,radius+75);aura.addColorStop(0,`rgba(112,93,255,${.07+.06*blend})`);aura.addColorStop(.6,`rgba(44,165,255,${.04+.06*blend})`);aura.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=aura;ctx.beginPath();ctx.arc(player.x,player.y,radius+75,0,Math.PI*2);ctx.fill();astraRuneRing(player.x,player.y,radius,player.astraOrbitAngle*.32,.28+.38*blend);
  for(let n=0;n<count;n++){const a=player.astraOrbitAngle+n*Math.PI*2/count,x=player.x+Math.cos(a)*radius,y=player.y+Math.sin(a)*radius;const g=ctx.createRadialGradient(x,y,0,x,y,22+blend*5);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.18,"rgba(123,226,255,.95)");g.addColorStop(.56,"rgba(83,95,255,.42)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,22+blend*5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(255,219,126,.9)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke()}
  for(const w of astraWells){const a=Math.min(1,w.life/30);ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.phase);const g=ctx.createRadialGradient(0,0,4,0,0,w.r);g.addColorStop(0,`rgba(0,0,5,${.95*a})`);g.addColorStop(.2,`rgba(44,0,82,${.75*a})`);g.addColorStop(.7,`rgba(118,72,255,${.13*a})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w.r,0,Math.PI*2);ctx.fill();for(let n=0;n<4;n++){ctx.strokeStyle=`rgba(${n%2?"255,207,112":"129,113,255"},${(.35+n*.1)*a})`;ctx.lineWidth=2+n;ctx.beginPath();ctx.ellipse(0,0,w.r*(.35+n*.14),w.r*(.15+n*.06),n*.6,0,Math.PI*2);ctx.stroke()}ctx.restore()}
  for(const m of astraMeteors){const g=ctx.createLinearGradient(m.x-m.vx*4,m.y-m.vy*4,m.x,m.y);g.addColorStop(0,"rgba(58,90,255,0)");g.addColorStop(.55,"rgba(84,205,255,.55)");g.addColorStop(1,"rgba(255,239,170,1)");ctx.strokeStyle=g;ctx.lineWidth=m.kind==="meteor"?18:8;ctx.beginPath();ctx.moveTo(m.x-m.vx*4,m.y-m.vy*4);ctx.lineTo(m.x,m.y);ctx.stroke();ctx.fillStyle="#fff8d4";ctx.beginPath();ctx.arc(m.x,m.y,m.r*.55,0,Math.PI*2);ctx.fill()}
  for(const e of astraEffects){const p=1-e.life/e.maxLife,a=1-p;if(e.type==="supernova"){const r=e.r*Math.min(1,p*1.6),g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,`rgba(255,255,245,${a*.85})`);g.addColorStop(.16,`rgba(255,207,94,${a*.62})`);g.addColorStop(.48,`rgba(113,93,255,${a*.23})`);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();astraRuneRing(e.x,e.y,r*.62,t,a*.9);for(let n=0;n<18;n++){const q=n*Math.PI/9+t*.2;ctx.strokeStyle=`rgba(255,234,166,${a*.7})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x+Math.cos(q)*r*.18,e.y+Math.sin(q)*r*.18);ctx.lineTo(e.x+Math.cos(q)*r*.78,e.y+Math.sin(q)*r*.78);ctx.stroke()}}else if(e.type==="meteorCast"||e.type==="expand"){const rr=(e.type==="expand"?radius:80)*(p*.8+.2);astraRuneRing(e.x,e.y,rr,t*(e.type==="expand"?2:-1),a)}else{ctx.strokeStyle=`rgba(${e.type==="collapse"?"185,115,255":"121,229,255"},${a})`;ctx.lineWidth=5*a+1;ctx.beginPath();ctx.arc(e.x,e.y,(e.r||55)*Math.min(1,p*2),0,Math.PI*2);ctx.stroke()}}
  ctx.restore();worldEnd();
}

function drawAstraInterface(){
  if(selectedCharacter!=="astra"||screenMode!=="game")return;const w=Math.min(760,canvas.width-28),h=120,x=(canvas.width-w)/2,y=canvas.height-178;ctx.save();const bg=ctx.createLinearGradient(x,y,x+w,y+h);bg.addColorStop(0,"rgba(4,12,30,.97)");bg.addColorStop(.52,"rgba(22,16,58,.97)");bg.addColorStop(1,"rgba(6,9,24,.97)");drawRoundedRect(x,y,w,h,24,bg,"#e6bd62",2);ctx.save();ctx.beginPath();ctx.arc(x+56,y+58,42,0,Math.PI*2);ctx.clip();if(astraSpriteLoaded)ctx.drawImage(astraSprite,x+1,y-8,110,150);ctx.restore();ctx.strokeStyle="#78dcff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+56,y+58,42,0,Math.PI*2);ctx.stroke();ctx.textAlign="left";ctx.fillStyle="#fff8df";ctx.font="bold 18px Arial";ctx.fillText("아스트라",x+112,y+28);ctx.fillStyle="#80ddff";ctx.font="bold 12px Arial";ctx.fillText(`공전성 ${astraOrbitCount()} · 궤도 ${Math.round(astraOrbitRadius())}`,x+112,y+51);ctx.fillStyle="#cabfe6";ctx.font="11px Arial";ctx.fillText(player.astraOverdriveTime>0?`궤도 가속 ${Math.ceil(player.astraOverdriveTime/60)}초 · 부드러운 확장 중`:"성좌가 상시 공전하며 접촉한 적을 공격",x+112,y+75);const skills=[["Q","유성 궤도",player.astraQCooldown,ASTRA_Q_CD],["E","중력 붕괴",player.astraECooldown,ASTRA_E_CD],["X","궤도 가속",player.astraXCooldown,ASTRA_X_CD],["R",player.level<10?"10레벨":"초신성 장례식",player.astraRCooldown,ASTRA_R_CD]];skills.forEach((s,i)=>{const cx=x+w-286+i*70,cy=y+48,r=26;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();if(astraSkillIconAtlas.complete&&astraSkillIconAtlas.naturalWidth){const sw=astraSkillIconAtlas.naturalWidth/2,sh=astraSkillIconAtlas.naturalHeight/2;ctx.drawImage(astraSkillIconAtlas,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,cx-r,cy-r,r*2,r*2)}ctx.restore();ctx.strokeStyle=i===2?"#f3c86e":"#77dcff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();if(s[2]>0)drawCooldownCover(cx,cy,r,s[2]/s[3],s[2]);drawSkillHudLabel(cx,y+99,s[1],s[0],"#fff5d5")});ctx.restore();
}
