// Shared deterministic eight-second animation, also rendered into transparent WebM.
function drawLobbyMotionFrame(p,id,body,ornaments,time,w,h,waterTexture=null){
  const phase=(time%8)/8*Math.PI*2;
  p.save();p.scale(w/640,h/960);
  const atlas=(cell,x,y,size,rotation=0)=>{
    if(!ornaments)return;
    const s=ornaments.width/2;p.save();p.translate(x,y);p.rotate(rotation);
    p.drawImage(ornaments,cell%2*s,Math.floor(cell/2)*s,s,s,-size/2,-size/2,size,size);p.restore();
  };
  const jewelPass=front=>{
    for(let i=0;i<7;i++){
      const a=phase+i*Math.PI*2/7,z=Math.sin(a);
      if((z>=0)!==front)continue;
      const x=320+Math.cos(a)*239,y=415+z*77+Math.sin(a*2)*125;
      const size=(i%3===0?76:57)*(1+z*.13);
      p.save();p.globalAlpha=front?1:.64;atlas(i%3===0?3:i%2?1:2,x,y,size,Math.sin(a)*.22);p.restore();
      p.save();p.globalCompositeOperation='screen';
      for(let j=1;j<=9;j++){const b=a-j*.025,zz=Math.sin(b);p.fillStyle=`rgba(158,183,255,${(1-j/10)*.35})`;p.beginPath();p.arc(320+Math.cos(b)*239,415+zz*77+Math.sin(b*2)*125,1.7,0,Math.PI*2);p.fill();}p.restore();
    }
  };
  const waterPass=front=>{
    // Three connected coils: split at depth zero so the back ribbon passes behind the body.
    const point=u=>{const a=u*Math.PI*6+phase;return {x:320+Math.cos(a)*(218+Math.sin(u*Math.PI)*22),y:270+u*610+Math.sin(a)*43,z:Math.sin(a),u,a};};
    for(let i=0;i<240;i++){
      const q=point(i/240),r=point((i+1)/240);
      if((q.z>=0)!==front)continue;
      const edge=Math.min(1,q.u*12,(1-q.u)*12),width=(20+16*(.5+.5*q.z))*edge;
      if(width<.01)continue;
      p.lineCap='round';p.globalAlpha=front?1:.68;
      if(waterTexture){
        const tw=waterTexture.naturalWidth||waterTexture.width,th=waterTexture.naturalHeight||waterTexture.height,sx=(i%60)/60*tw,sw=Math.min(tw-sx,tw/60+2),length=Math.hypot(r.x-q.x,r.y-q.y);
        p.save();p.translate(q.x,q.y);p.rotate(Math.atan2(r.y-q.y,r.x-q.x));p.drawImage(waterTexture,sx,0,sw,th,-1,-width*1.5,length+2,width*3);p.restore();
      }else for(const [scale,color] of [[1.8,'rgba(45,153,230,.13)'],[1,'rgba(36,185,232,.7)'],[.55,'rgba(124,234,255,.82)'],[.12,'rgba(238,255,255,.95)']]){
        p.strokeStyle=color;p.lineWidth=width*scale;p.beginPath();p.moveTo(q.x,q.y);p.lineTo(r.x,r.y);p.stroke();
      }
      if(i%3===0){const bend=Math.sin(q.a*7+q.u*56)*width*.43;p.fillStyle='rgba(225,255,255,.85)';p.beginPath();p.ellipse(q.x,q.y+bend,1.3+(i%5)*.3,.8+(i%4)*.2,q.a,0,Math.PI*2);p.fill();}
      if(i%15===0){const x=q.x+Math.cos(q.a)*17,y=q.y-16;p.fillStyle='rgba(88,209,251,.44)';p.strokeStyle='rgba(227,255,255,.8)';p.lineWidth=.8;p.beginPath();p.arc(x,y,3+i%4,0,Math.PI*2);p.fill();p.stroke();p.fillStyle='#f0ffff';p.beginPath();p.arc(x-1,y-1,1,0,Math.PI*2);p.fill();}
    }
    p.globalAlpha=1;
  };
  if(id==='astra'){
    atlas(0,355,155,238,Math.sin(phase)*.16);
    jewelPass(false);
  }else waterPass(false);
  if(body){const bw=body.naturalWidth||body.width,bh=body.naturalHeight||body.height,scale=Math.min(586/bw,905/bh),dw=bw*scale,dh=bh*scale;p.drawImage(body,320-dw/2,27+(905-dh)/2,dw,dh);}
  if(id==='astra')jewelPass(true);else waterPass(true);
  p.restore();
}
if(typeof module!=='undefined')module.exports={drawLobbyMotionFrame};
