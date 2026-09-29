// Original, fully volumetric Astra display model. No image-card/turntable trick.
// Local, pinned Three.js is loaded only when the player opens Astra's 3D view.
import * as T from '../assets/vendor/three/three.module.min.js';

export function createAstraModel(host) {
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,40),root=new T.Group();scene.add(root);
  scene.add(new T.HemisphereLight(0xdceeff,0x353057,2.3));
  const key=new T.DirectionalLight(0xffe5c3,3.1);key.position.set(-3,5,5);scene.add(key);
  const rim=new T.DirectionalLight(0x688dff,4);rim.position.set(3,3,-3);scene.add(rim);
  const fill=new T.DirectionalLight(0xbdeeff,1.4);fill.position.set(4,1,4);scene.add(fill);
  const mat=(color,metalness=0,roughness=.48,extra={})=>new T.MeshStandardMaterial({color,metalness,roughness,...extra});
  const navy=mat(0x11172c,.25,.45),ivory=mat(0xebe4d9,.14,.45),gold=mat(0xd6b578,.76,.27);
  const hair=mat(0x151d47,.25,.35,{side:T.DoubleSide}),hairLight=mat(0x334774,.32,.36),skin=mat(0xffd9c5,0,.61);
  const stocking=mat(0x181e35,.08,.65),gem=mat(0x5b99e5,.45,.22,{emissive:0x234bac,emissiveIntensity:.55});
  const light=mat(0xc9f4ff,.35,.24,{emissive:0x419bff,emissiveIntensity:1.2});
  const V=p=>new T.Vector3(...p);
  const mesh=(geometry,material,parent=root)=>{const m=new T.Mesh(geometry,material);parent.add(m);return m;};
  const ellipsoid=(p,s,material,parent=root)=>{const m=mesh(new T.SphereGeometry(1,32,24),material,parent);m.position.copy(V(p));m.scale.set(...s);return m;};
  const tube=(points,r,material,parent=root,closed=false)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V),closed),Math.max(12,points.length*8),r,6,closed),material,parent);
  const ring=(p,r,thickness,material,parent=root,rotation=[0,0,0],arc=Math.PI*2)=>{const m=mesh(new T.TorusGeometry(r,thickness,6,80,arc),material,parent);m.position.copy(V(p));m.rotation.set(...rotation);return m;};
  const limb=(a,b,r1,r2,material,parent=root)=>{const va=V(a),vb=V(b),m=mesh(new T.CylinderGeometry(r2,r1,va.distanceTo(vb),24),material,parent);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());return m;};
  const star=(p,r,parent=root)=>{
    const group=new T.Group();group.position.copy(V(p));parent.add(group);
    const centre=mesh(new T.OctahedronGeometry(r*.38),gem,group);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,length=r*(i%2?.56:1);const s=mesh(new T.ConeGeometry(r*.13,length,4),i%2?gold:light,group);s.position.set(Math.sin(a)*length*.52,Math.cos(a)*length*.52,0);s.rotation.z=-a;}
    ring([0,0,0],r*.51,r*.019,gold,group,[.45,.3,0]);return {group,centre};
  };
  const badge=(p,r,parent=root)=>{
    const group=new T.Group();parent.add(group);group.position.copy(V(p));
    ring([0,0,0],r,.009,gold,group);star([0,0,.016],r*.87,group);return group;
  };
  // Bespoke celestial fabric texture, made once. Actual cloth meshes below are
  // double sided, draped, thickened at their gold hems and visible from behind.
  const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=512;
  const f=fabricCanvas.getContext('2d'),gradient=f.createLinearGradient(0,0,512,512);
  gradient.addColorStop(0,'#12182e');gradient.addColorStop(.4,'#243267');gradient.addColorStop(.7,'#4567a0');gradient.addColorStop(1,'#161e41');f.fillStyle=gradient;f.fillRect(0,0,512,512);
  let seed=1829;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  for(let i=0;i<18;i++){
    const x=random()*512,y=random()*512,cloud=f.createRadialGradient(x,y,0,x,y,45+random()*95);cloud.addColorStop(0,'rgba(94,136,237,.22)');cloud.addColorStop(.45,'rgba(106,67,169,.1)');cloud.addColorStop(1,'rgba(36,43,107,0)');f.fillStyle=cloud;f.fillRect(0,0,512,512);
  }
  for(let i=0;i<550;i++){const x=random()*512,y=random()*512;f.fillStyle=`rgba(177,208,255,${.15+random()*.55})`;f.fillRect(x,y,random()<.06?3:1,1);}
  for(let i=0;i<23;i++){
    const x=random()*512,y=random()*512;f.fillStyle='#c9b78d';f.beginPath();f.moveTo(x,y-6);f.lineTo(x+1.7,y-1.7);f.lineTo(x+6,y);f.lineTo(x+1.7,y+1.7);f.lineTo(x,y+6);f.lineTo(x-1.7,y+1.7);f.lineTo(x-6,y);f.lineTo(x-1.7,y-1.7);f.closePath();f.fill();
    f.strokeStyle='rgba(220,196,145,.5)';f.beginPath();f.moveTo(x,y);f.lineTo(x+28,y+19);f.lineTo(x+45,y+8);f.stroke();
  }
  f.lineWidth=.7;f.strokeStyle='rgba(224,202,149,.55)';
  for(let i=0;i<14;i++){const x=random()*512,y=random()*512;f.beginPath();f.arc(x,y,18+random()*85,random()*2,random()*3+3);f.stroke();}
  const fabricTexture=new T.CanvasTexture(fabricCanvas);fabricTexture.colorSpace=T.SRGBColorSpace;
  const fabric=mat(0xffffff,.25,.48,{map:fabricTexture,side:T.DoubleSide});
  function ribbon(points,widths,material,parent=root,bulge=.04){
    const curve=new T.CatmullRomCurve3(points.map(V)),pos=[],uv=[],idx=[],steps=32,across=8;
    const sample=(t,u)=>{const c=curve.getPoint(t),width=T.MathUtils.lerp(widths[Math.min(widths.length-2,Math.floor(t*(widths.length-1)))],widths[Math.min(widths.length-1,Math.floor(t*(widths.length-1))+1)],t===1?1:(t*(widths.length-1))%1);return new T.Vector3(c.x+u*width,c.y,c.z+Math.cos(u*Math.PI*.5)*bulge+Math.sin(t*11+u*2)*.017);};
    for(let j=0;j<=steps;j++)for(let i=0;i<=across;i++){const p=sample(j/steps,i/across*2-1);pos.push(p.x,p.y,p.z);uv.push(i/across,1-j/steps);if(j<steps&&i<across){const a=j*(across+1)+i;idx.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=mesh(g,material,parent);
    return {mesh:m,edge:side=>Array.from({length:17},(_,i)=>sample(i/16,side).toArray())};
  }
  // Tailored bodice with a high collar and shaped waist, not stacked primitives.
  const profile=[[.19,1.43],[.255,1.56],[.205,1.73],[.23,1.94],[.30,2.09],[.29,2.23],[.16,2.30]];
  const bodice=mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48),navy);bodice.scale.z=.72;
  limb([0,2.26,0],[0,2.43,0],.097,.093,skin);
  const collar=mesh(new T.CylinderGeometry(.116,.129,.16,40),navy);collar.position.set(0,2.34,0);
  ring([0,2.425,0],.117,.009,gold,root,[Math.PI/2,0,0]);
  const whiteFront=ribbon([[.08,2.22,.205],[.12,2.05,.229],[.02,1.83,.161],[.025,1.57,.185]],[.07,.13,.11,.025],ivory);
  tube(whiteFront.edge(-1),.009,gold);tube(whiteFront.edge(1),.009,gold);
  ring([0,1.7,0],.217,.017,gold,root,[Math.PI/2,0,.08]).scale.y=.72;badge([.035,1.69,.18],.092);
  tube([[-.24,2.22,.13],[-.2,1.98,.18],[-.13,1.9,.19],[.02,2.19,.22]],.007,gold);
  badge([-.24,2.24,.13],.076);badge([.03,2.20,.23],.05);
  for(const s of [-1,1]){
    const panel=ribbon([[s*.12,1.65,.19],[s*.19,1.44,.17],[s*.25,1.19,.19],[s*.27,1.08,.17]],[.10,.13,.13,.012],fabric);
    tube(panel.edge(-1),.006,gold);tube(panel.edge(1),.006,gold);badge([s*.22,1.42,.23],.047);
    tube([[s*.04,1.71,.185],[s*.1,1.56,.24],[s*.23,1.48,.23],[s*.31,1.63,.11]],.004,gold);
  }
  // Legs and individually modelled boots, asymmetric natural stance.
  for(const side of [-1,1]){
    const hip=[side*.12,1.49,0],knee=[side*.155,.92,side*.035],ankle=[side*.21,.34,side*.045];
    limb(hip,knee,.123,.08,stocking);ellipsoid(knee,[.081,.095,.081],stocking);limb(knee,ankle,.082,.057,stocking);
    const boot=mesh(new T.LatheGeometry([[.065,.08],[.074,.16],[.071,.34],[.09,.47],[.104,.53]].map(([r,y])=>new T.Vector2(r,y)),32),ivory);boot.position.set(ankle[0],0,ankle[2]);
    ellipsoid([ankle[0],.12,ankle[2]+.075],[.078,.067,.16],ivory);ellipsoid([ankle[0],.072,ankle[2]+.075],[.079,.017,.16],navy);
    ring([ankle[0],.524,ankle[2]],.104,.008,gold,root,[Math.PI/2,0,0]);badge([ankle[0],.35,ankle[2]+.075],.05);
    tube([[ankle[0]-.045,.17,ankle[2]+.07],[ankle[0]+.042,.24,ankle[2]+.072],[ankle[0]-.043,.32,ankle[2]+.072]],.005,gold);
  }
  // Six independent curved coat tails, constellation lining and white insets.
  const tails=[[-.18,-.43,-.68,-.87,.03], [.18,.40,.69,.85,-.04],[-.22,-.32,-.49,-.55,-.23],[.22,.34,.57,.58,-.23],[-.12,-.20,-.31,-.39,-.30],[.12,.18,.39,.48,-.33]];
  for(let i=0;i<tails.length;i++){
    const [a,b,c,d,z]=tails[i],panel=ribbon([[a,1.58,z],[b,1.24,z-.08],[c,.73,z+.02],[d,.24+i%3*.10,z+.2]],[.085,.18,.24,.012],fabric);
    tube(panel.edge(-1),.008,gold);tube(panel.edge(1),.008,gold);
    if(i<2){const inset=ribbon([[a,1.57,z+.028],[b-.11*Math.sign(a),1.24,z-.045],[c-.15*Math.sign(a),.74,z+.045],[d,.25,z+.23]],[.018,.032,.040,.003],ivory);tube(inset.edge(-1),.004,gold);}
    star([d,.22+i%3*.10,z+.21],.035);
  }
  // Arms, bell sleeves, articulated palms and five separate fingers.
  const armPoses=[{s:-1,elbow:[-.51,2.01,.10],wrist:[-.73,2.27,.19],palm:[-.79,2.36,.20]},{s:1,elbow:[.48,1.93,.05],wrist:[.74,1.94,.2],palm:[.85,2.01,.21]}];
  for(const {s,elbow,wrist,palm} of armPoses){
    const shoulder=[s*.29,2.21,0];ellipsoid(shoulder,[.125,.12,.115],navy);limb(shoulder,elbow,.115,.09,navy);limb(elbow,wrist,.09,.065,navy);limb(wrist,palm,.045,.041,skin);
    const sleeve=ribbon([[elbow[0],elbow[1],elbow[2]],[elbow[0]+s*.02,elbow[1]-.28,elbow[2]+.03],[wrist[0]+s*.06,wrist[1]-.44,wrist[2]+.03],[wrist[0],wrist[1],wrist[2]]],[.1,.15,.19,.06],ivory);
    tube(sleeve.edge(-1),.009,gold);tube(sleeve.edge(1),.009,gold);
    ellipsoid(palm,[.060,.078,.029],skin);
    for(let n=0;n<4;n++){
      const x=palm[0]+(n-1.5)*.029,length=[.086,.11,.098,.077][n];
      tube([[x,palm[1]+.044,palm[2]],[x+(n-1.5)*.01,palm[1]+.077,palm[2]+.015],[x+(n-1.5)*.016,palm[1]+length+.06,palm[2]+.003]],.0105,skin);
    }
    tube([[palm[0]-s*.043,palm[1]-.014,palm[2]],[palm[0]-s*.082,palm[1]+.006,palm[2]+.018],[palm[0]-s*.091,palm[1]+.055,palm[2]+.013]],.013,skin);
    badge([s*.32,2.23,.08],.065);
  }
  // Sculpted anime face with original hand-painted UV eyes/eyebrows/lips.
  const faceCanvas=document.createElement('canvas');faceCanvas.width=1024;faceCanvas.height=512;
  const c=faceCanvas.getContext('2d');c.fillStyle='#ffddcb';c.fillRect(0,0,1024,512);
  for(const side of [-1,1]){
    const x=512+side*67,y=250;c.save();c.translate(x,y);c.rotate(-side*.08);
    const blush=c.createRadialGradient(0,27,0,0,27,32);blush.addColorStop(0,'rgba(233,122,133,.24)');blush.addColorStop(1,'rgba(233,122,133,0)');c.fillStyle=blush;c.fillRect(-34,0,68,63);
    c.beginPath();c.moveTo(-31,0);c.quadraticCurveTo(-5,-30,29,-4);c.quadraticCurveTo(7,22,-22,12);c.closePath();c.fillStyle='#fff8f4';c.fill();c.save();c.clip();
    const iris=c.createRadialGradient(0,-6,1,1,3,22);iris.addColorStop(0,side<0?'#492105':'#12224d');iris.addColorStop(.40,side<0?'#b67719':'#398cce');iris.addColorStop(.78,side<0?'#f5c156':'#8be2f6');iris.addColorStop(1,'#1d2038');c.fillStyle=iris;c.beginPath();c.ellipse(0,0,18,22,0,0,Math.PI*2);c.fill();
    c.fillStyle='#121524';c.beginPath();c.ellipse(0,-3,7,15,0,0,Math.PI*2);c.fill();c.fillStyle='white';c.beginPath();c.ellipse(-7,-10,5,7,.4,0,Math.PI*2);c.fill();c.beginPath();c.arc(7,9,3,0,Math.PI*2);c.fill();c.restore();
    c.strokeStyle='#302238';c.lineWidth=4;c.beginPath();c.moveTo(-34,-2);c.quadraticCurveTo(-7,-32,30,-4);c.stroke();c.lineWidth=1.5;c.beginPath();c.moveTo(-21,12);c.quadraticCurveTo(8,20,28,0);c.stroke();
    c.lineWidth=3;c.beginPath();c.moveTo(-23,-40);c.quadraticCurveTo(0,-49,22,-39);c.stroke();c.restore();
  }
  c.strokeStyle='#c68d85';c.lineWidth=1.7;c.beginPath();c.moveTo(508,282);c.quadraticCurveTo(512,286,517,282);c.stroke();
  c.strokeStyle='#b16c75';c.lineWidth=2.5;c.beginPath();c.moveTo(497,315);c.quadraticCurveTo(512,319,527,314);c.stroke();c.strokeStyle='#ffece7';c.lineWidth=2;c.beginPath();c.moveTo(505,322);c.lineTo(518,322);c.stroke();
  const faceMap=new T.CanvasTexture(faceCanvas);faceMap.colorSpace=T.SRGBColorSpace;
  const faceMaterial=mat(0xffffff,0,.76,{map:faceMap}),positions=[],uvs=[],indices=[];
  for(let j=0;j<=40;j++)for(let i=0;i<=64;i++){
    const theta=(i/64-.5)*Math.PI*2,phi=j/40*Math.PI,lower=Math.max(0,-Math.cos(phi)),jaw=1-lower*.37;
    positions.push(Math.sin(theta)*Math.sin(phi)*.265*jaw,2.72+Math.cos(phi)*.323,Math.cos(theta)*Math.sin(phi)*.223);uvs.push(i/64,1-j/40);
    if(i<64&&j<40){const a=j*65+i;indices.push(a,a+65,a+1,a+1,a+65,a+66);}
  }
  const faceGeometry=new T.BufferGeometry();faceGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));faceGeometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));faceGeometry.setIndex(indices);faceGeometry.computeVertexNormals();mesh(faceGeometry,faceMaterial);
  ellipsoid([0,2.666,.215],[.018,.037,.026],skin);
  // Raised corneas/irises keep the face legible at lobby size and in profile.
  const eyeWhite=mat(0xfff6f2,0,.4),pupil=mat(0x10203a,0,.3),lash=mat(0x261d37,0,.6);
  for(const side of [-1,1]){
    const x=side*.104,z=.216;
    ellipsoid([x,2.733,z],[.073,.039,.012],eyeWhite);
    ellipsoid([x,2.733,z+.012],[.028,.034,.008],mat(side<0?0xd49a36:0x418ec1,.12,.3));
    ellipsoid([x,2.736,z+.019],[.012,.024,.005],pupil);
    ellipsoid([x-.009,2.747,z+.024],[.008,.010,.003],ivory);
    ellipsoid([x+.010,2.719,z+.023],[.004,.005,.003],light);
    tube([[x-.069,2.739,z],[x-.039,2.768,z+.003],[x+.023,2.773,z+.003],[x+.069,2.750,z-.002]],.006,lash);
    tube([[x-.047,2.812,z-.027],[x+.008,2.824,z-.03],[x+.052,2.812,z-.03]],.004,hair);
  }
  tube([[-.028,2.576,.186],[0,2.572,.19],[.030,2.578,.184]],.0035,mat(0xbf8587));
  for(const side of [-1,1]){ellipsoid([side*.25,2.687,-.012],[.038,.07,.033],skin);star([side*.267,2.52,.003],.045);tube([[side*.255,2.65,0],[side*.272,2.56,0]],.006,gold);}
  // Fitted hair cap: front hairline leaves the face free, back extends below ears.
  const hp=[],hu=[],hi=[];
  for(let j=0;j<=26;j++)for(let i=0;i<=56;i++){
    const a=(i/56-.5)*Math.PI*2,front=(1+Math.cos(a))*.5,end=2.17-front*.98,phi=j/26*end;
    hp.push(Math.sin(a)*Math.sin(phi)*.285,2.74+Math.cos(phi)*.343,Math.cos(a)*Math.sin(phi)*.243-.022);hu.push(i/56,j/26);
    if(i<56&&j<26){const n=j*57+i;hi.push(n,n+57,n+1,n+1,n+57,n+58);}
  }
  const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));hg.setAttribute('uv',new T.Float32BufferAttribute(hu,2));hg.setIndex(hi);hg.computeVertexNormals();mesh(hg,hair);
  const locks=new T.Group();root.add(locks);
  function hairLock(points,width){
    const strand=ribbon(points,[width*.5,width,width*.78,.002],hair,locks,.035);
    tube(strand.edge(-.5),.004,hairLight,locks);tube(strand.edge(.35),.003,hairLight,locks);
    // Closed back surface gives each strand thickness when the viewer rotates.
    ribbon(points.map(p=>[p[0],p[1],p[2]-.035]),[width*.5,width,width*.78,.002],hair,locks,-.025);
  }
  for(let i=0;i<18;i++){
    const a=i/17*Math.PI*1.35+1.02,s=Math.sin(a),co=Math.cos(a),start=[s*.25,2.85,co*.21-.05],endX=s*(.50+(i%4)*.09);
    hairLock([start,[s*.34,2.52,co*.27-.07],[endX*.85+.08,2.01,co*.35-.1],[endX+.22,1.43+(i%5)*.08,co*.42-.12]],.067+(i%3)*.014);
  }
  // Swept side fringe avoids a helmet silhouette and keeps both eyes readable.
  hairLock([[-.045,3.055,.052],[-.13,2.99,.20],[-.23,2.83,.24],[-.265,2.61,.17]],.080);
  hairLock([[.03,3.06,.055],[.12,2.98,.215],[.21,2.84,.24],[.282,2.72,.13]],.10);
  hairLock([[0,3.047,.091],[.065,2.96,.223],[.078,2.88,.252],[.15,2.80,.243]],.059);
  badge([.259,2.87,.16],.09).rotation.y=.45;
  tube([[.29,2.85,.16],[.30,2.68,.17],[.35,2.54,.11]],.005,gold);star([.35,2.51,.11],.037);
  // Broken antique astrolabe, with fully dimensional rings and raised markers.
  const halo=new T.Group();halo.position.set(0,2.78,-.35);halo.rotation.z=-.14;root.add(halo);
  for(let i=0;i<5;i++){
    const start=i*Math.PI*2/5,arc=Math.PI*2/5-.11;
    for(const r of [.47,.53,.60]){const m=ring([0,0,0],r,r===.53?.026:.007,gold,halo,[0,0,start],arc);m.material=gold;}
    for(let j=0;j<6;j++){const a=start+j*arc/6;limb([Math.cos(a)*.49,Math.sin(a)*.49,0],[Math.cos(a)*.57,Math.sin(a)*.57,0],.004,.004,ivory,halo);}
    star([Math.cos(start)*.59,Math.sin(start)*.59,.01],.075,halo);
  }
  // Armillary globe held in the right hand.
  const globe=new T.Group();globe.position.set(.84,2.21,.19);root.add(globe);
  ellipsoid([0,0,0],[.13,.13,.13],gem,globe);
  for(let i=0;i<3;i++)ring([0,0,0],.18,.008,gold,globe,[i*.9,.4+i*.8,.3]);
  star([0,0,.137],.073,globe);
  const orbits=new T.Group();orbits.position.y=1.85;root.add(orbits);
  const stars=[];
  for(let i=0;i<3;i++){
    const orbit=new T.Group();orbit.rotation.set(.8+i*.63,.3,i*.92);orbits.add(orbit);ring([0,0,0],1.12+i*.055,.004,gold,orbit);
    const s=star([1.12+i*.055,0,0],.12,orbit);stars.push({orbit,star:s.group,phase:i*2.1});
    ellipsoid([-1.12-i*.055,0,0],[.036,.036,.036],gem,orbit);
  }
  // Floating dust is a single GPU draw, not hundreds of animated DOM elements.
  const dustPositions=[];for(let i=0;i<100;i++)dustPositions.push((random()-.5)*2.8,.2+random()*3.2,(random()-.5)*1.7);
  const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.Float32BufferAttribute(dustPositions,3));
  const dust=new T.Points(dustGeometry,new T.PointsMaterial({color:0x94baff,size:.014,transparent:true,opacity:.65,depthWrite:false}));root.add(dust);
  // Merge static parts by material without changing triangles or shading.
  // Each independently animated group stays separate. This drops hundreds of
  // WebGL draw calls while retaining every finger, hair strand and engraving.
  function batchStatic(group,skip=new Set()){
    group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),batches=new Map(),originals=[];
    const visit=o=>{if(skip.has(o))return;if(o.isMesh){const transform=inverse.clone().multiply(o.matrixWorld),g=o.geometry.clone().applyMatrix4(transform);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);originals.push(o);}for(const child of o.children)visit(child);};
    for(const child of group.children)visit(child);
    for(const [material,geometries] of batches){
      let vertices=0,indexCount=0;for(const g of geometries){vertices+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count;}
      const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),uvs=new Float32Array(vertices*2),indices=new Uint32Array(indexCount);let offset=0,io=0;
      for(const g of geometries){const n=g.attributes.position.count;positions.set(g.attributes.position.array,offset*3);normals.set(g.attributes.normal.array,offset*3);if(g.attributes.uv)uvs.set(g.attributes.uv.array,offset*2);for(let i=0;i<(g.index?g.index.count:n);i++)indices[io++]=(g.index?g.index.array[i]:i)+offset;offset+=n;g.dispose();}
      const combined=new T.BufferGeometry();combined.setAttribute('position',new T.BufferAttribute(positions,3));combined.setAttribute('normal',new T.BufferAttribute(normals,3));combined.setAttribute('uv',new T.BufferAttribute(uvs,2));combined.setIndex(new T.BufferAttribute(indices,1));combined.computeBoundingSphere();mesh(combined,material,group);
    }
    for(const old of originals){old.removeFromParent();old.geometry.dispose();}
  }
  batchStatic(locks);batchStatic(globe);for(const s of stars){batchStatic(s.star);batchStatic(s.orbit,new Set([s.star]));}
  batchStatic(root,new Set([locks,globe,orbits,dust]));
  root.rotation.y=-.12;
  let yaw=-.12,pitch=0,drag=null,width=0,height=0,disposed=false,zoom=1;
  const element=renderer.domElement;element.style.cssText='width:100%;height:100%;background:transparent;touch-action:none;cursor:grab;display:block';
  element.setAttribute('aria-label','아스트라 3D 모델 — 드래그로 회전, 방향키로 회전, 홈 키로 초기화');element.tabIndex=0;
  const down=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};element.setPointerCapture(e.pointerId);element.style.cursor='grabbing';e.preventDefault();};
  const move=e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(-.3,Math.min(.3,pitch+(e.clientY-drag.y)*.005));drag.x=e.clientX;drag.y=e.clientY;e.preventDefault();};
  const up=e=>{if(drag?.id===e.pointerId){drag=null;element.style.cursor='grab';}};
  const reset=()=>{yaw=-.12;pitch=0;zoom=1;};
  const keydown=e=>{if(e.key==='ArrowLeft')yaw-=.2;else if(e.key==='ArrowRight')yaw+=.2;else if(e.key==='ArrowUp')pitch=Math.max(-.3,pitch-.05);else if(e.key==='ArrowDown')pitch=Math.min(.3,pitch+.05);else if(e.key==='Home')reset();else return;e.preventDefault();e.stopPropagation();};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('lostpointercapture',up);element.addEventListener('keydown',keydown);element.addEventListener('dblclick',reset);
  return {
    reset,
    turnTo(angle){yaw=angle;},
    stats(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,yaw:Number(root.rotation.y.toFixed(2))};},
    render(w,h,time){
      if(disposed)return;
      if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
      const vertical=3.64/(2*Math.tan(T.MathUtils.degToRad(16))),horizontal=3.1/(2*Math.tan(T.MathUtils.degToRad(16))*camera.aspect);
      camera.position.set(0,1.78,Math.max(vertical,horizontal)*zoom);camera.lookAt(0,1.77,0);
      root.rotation.y+=(yaw-root.rotation.y)*.22;root.rotation.x+=(pitch-root.rotation.x)*.18;root.position.y=Math.sin(time*.9)*.013;
      locks.rotation.z=Math.sin(time*.7)*.012;globe.rotation.y=time*.27;dust.rotation.y=time*.025;
      for(const s of stars){s.orbit.rotation.z=s.phase+time*.10;s.star.rotation.z=time*.35;}
      renderer.render(scene,camera);
    },
    dispose(){
      if(disposed)return;disposed=true;
      const geometries=new Set(),materials=new Set(),textures=new Set();
      scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});
      for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}for(const g of geometries)g.dispose();for(const t of textures)t.dispose();renderer.dispose();renderer.forceContextLoss();element.remove();
    }
  };
}
