// Shared deterministic eighteen-second animation, also rendered into transparent WebM.
const LOBBY_MOTION_DURATION=18;
function drawLobbyMotionFrame(p,id,body,ornaments,time,w,h,waterTexture=null){
  const phase=(time%LOBBY_MOTION_DURATION)/LOBBY_MOTION_DURATION*Math.PI*2;
  p.save();p.scale(w/640,h/960);
  const atlas=(cell,x,y,size,rotation=0)=>{
    if(!ornaments)return;
    const s=ornaments.width/2;p.save();p.translate(x,y);p.rotate(rotation);
    p.drawImage(ornaments,cell%2*s,Math.floor(cell/2)*s,s,s,-size/2,-size/2,size,size);p.restore();
  };
  const jewelPass=front=>{
    for(let i=0;i<5;i++){
      const a=phase+i*Math.PI*2/5,z=Math.sin(a),radius=202+i%3*13,centerY=350+i%3*130,tilt=i%2?18:-18;
      if((z>=0)!==front)continue;
      const x=320+Math.cos(a)*radius,y=centerY+z*38+Math.cos(a)*tilt;
      const size=(i%3===0?64:53)*(1+z*.035);
      p.save();p.globalAlpha=.85+z*.12;atlas(i%3===0?3:i%2?1:2,x,y,size,0);p.restore();
      p.save();p.globalCompositeOperation='screen';
      for(let j=1;j<=8;j++){const b=a-j*.012,zz=Math.sin(b);p.fillStyle=`rgba(158,183,255,${(1-j/9)*.22})`;p.beginPath();p.arc(320+Math.cos(b)*radius,centerY+zz*38+Math.cos(b)*tilt,1.1,0,Math.PI*2);p.fill();}p.restore();
    }
  };
  const waterPass=front=>{
    // Three independent currents: unequal tilted arcs, counterflow and slow tidal deformation.
    for(let band=0;band<3;band++){
    const direction=band===1?-1:1,offset=band*2.1;
    const point=u=>{const a=u*Math.PI*1.8+direction*phase+offset,rx=196+band*17+Math.sin(phase+offset)*15+Math.sin(u*Math.PI*2+phase*2)*14,z=Math.sin(a),tilt=[-62,52,-34][band];return {x:320+Math.cos(a)*rx,y:[350,560,760][band]+Math.sin(phase+offset)*28+z*[43,60,37][band]+Math.cos(a)*tilt+Math.sin(a*2+phase)*16,z,u,a};};
    for(let i=0;i<120;i++){
      const q=point(i/120),r=point((i+1)/120);
      if((q.z>=0)!==front)continue;
      const edge=Math.sin(q.u*Math.PI)**.65,width=(20+16*(.5+.5*q.z))*edge*[.82,1,.68][band];
      if(width<.01)continue;
      p.lineCap='round';p.globalAlpha=front?1:.68;
      if(waterTexture){
        const tw=waterTexture.naturalWidth||waterTexture.width,th=waterTexture.naturalHeight||waterTexture.height,sx=((i/60+direction*phase/Math.PI)%1+1)%1*tw,sw=tw/60+2,length=Math.hypot(r.x-q.x,r.y-q.y),first=Math.min(tw-sx,sw),fraction=first/sw;
        p.save();p.translate(q.x,q.y);p.rotate(Math.atan2(r.y-q.y,r.x-q.x));p.drawImage(waterTexture,sx,0,first,th,-1,-width*1.5,(length+2)*fraction,width*3);
        if(first<sw)p.drawImage(waterTexture,0,0,sw-first,th,-1+(length+2)*fraction,-width*1.5,(length+2)*(1-fraction),width*3);p.restore();
      }else for(const [scale,color] of [[1.8,'rgba(45,153,230,.13)'],[1,'rgba(36,185,232,.7)'],[.55,'rgba(124,234,255,.82)'],[.12,'rgba(238,255,255,.95)']]){
        p.strokeStyle=color;p.lineWidth=width*scale;p.beginPath();p.moveTo(q.x,q.y);p.lineTo(r.x,r.y);p.stroke();
      }
      if(i%3===0){const bend=Math.sin(q.a*7+q.u*56)*width*.43;p.fillStyle='rgba(225,255,255,.85)';p.beginPath();p.ellipse(q.x,q.y+bend,1.3+(i%5)*.3,.8+(i%4)*.2,q.a,0,Math.PI*2);p.fill();}
      if(i%15===0){const x=q.x+Math.cos(q.a)*17,y=q.y-16;p.fillStyle='rgba(88,209,251,.44)';p.strokeStyle='rgba(227,255,255,.8)';p.lineWidth=.8;p.beginPath();p.arc(x,y,3+i%4,0,Math.PI*2);p.fill();p.stroke();p.fillStyle='#f0ffff';p.beginPath();p.arc(x-1,y-1,1,0,Math.PI*2);p.fill();}
    }
    }
    p.globalAlpha=1;
  };
  if(id==='astra'){
    atlas(0,355,155,238,Math.sin(phase)*.025);
    jewelPass(false);
  }else waterPass(false);
  if(body){const bw=body.naturalWidth||body.width,bh=body.naturalHeight||body.height,scale=Math.min(586/bw,905/bh),dw=bw*scale,dh=bh*scale;p.drawImage(body,320-dw/2,27+(905-dh)/2,dw,dh);}
  if(id==='astra')jewelPass(true);else waterPass(true);
  p.restore();
}
if(typeof module!=='undefined')module.exports={drawLobbyMotionFrame,LOBBY_MOTION_DURATION};
