import * as T from '../assets/vendor/three/three.module.min.js';
import { GLTFLoader } from '../assets/vendor/three/GLTFLoader.js';

const MODEL_URL=new URL('../assets/models/astra.glb?v=20260929-user-model1',import.meta.url).href;

export function createAstraModel(host){
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.01,100),root=new T.Group();scene.add(root);
  scene.add(new T.HemisphereLight(0xe8f2ff,0x17152b,2.4));
  const key=new T.DirectionalLight(0xffead4,3.4);key.position.set(-3,5,5);scene.add(key);
  const rim=new T.DirectionalLight(0x718cff,4.2);rim.position.set(4,3,-4);scene.add(rim);
  const fill=new T.DirectionalLight(0xa7dfff,1.45);fill.position.set(4,1,4);scene.add(fill);
  let model=null,width=0,height=0,disposed=false,yaw=0,pitch=0,drag=null;
  const element=renderer.domElement;element.style.cssText='width:100%;height:100%;background:transparent;touch-action:none;cursor:grab;display:block';
  element.setAttribute('aria-label','아스트라 3D 모델 — 드래그로 회전, 방향키로 회전, 홈 키로 초기화');element.tabIndex=0;

  function disposeObject(object){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    object?.traverse?.(item=>{if(item.geometry)geometries.add(item.geometry);for(const material of item.material?(Array.isArray(item.material)?item.material:[item.material]):[])materials.add(material);});
    for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();}
    for(const geometry of geometries)geometry.dispose();for(const texture of textures){texture.close?.();texture.dispose();}
  }
  const ready=new GLTFLoader().loadAsync(MODEL_URL).then(gltf=>{
    if(disposed){disposeObject(gltf.scene);return;}
    model=gltf.scene;
    const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=3.35/Math.max(size.y,.0001);
    model.position.sub(center);model.scale.setScalar(scale);
    model.traverse(object=>{if(!object.isMesh)return;for(const material of Array.isArray(object.material)?object.material:[object.material]){if(!material)continue;material.side=T.DoubleSide;if(material.map){material.map.colorSpace=T.SRGBColorSpace;material.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}material.needsUpdate=true;}});
    root.add(model);return gltf;
  });
  const reset=()=>{yaw=0;pitch=0;};
  const down=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};element.setPointerCapture(e.pointerId);element.style.cursor='grabbing';e.preventDefault();};
  const move=e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.009;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.005,-.32,.32);drag.x=e.clientX;drag.y=e.clientY;e.preventDefault();};
  const up=e=>{if(drag?.id===e.pointerId){drag=null;element.style.cursor='grab';}};
  const keydown=e=>{if(e.key==='ArrowLeft')yaw-=.2;else if(e.key==='ArrowRight')yaw+=.2;else if(e.key==='ArrowUp')pitch=Math.max(-.32,pitch-.06);else if(e.key==='ArrowDown')pitch=Math.min(.32,pitch+.06);else if(e.key==='Home')reset();else return;e.preventDefault();e.stopPropagation();};
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('lostpointercapture',up);element.addEventListener('keydown',keydown);element.addEventListener('dblclick',reset);
  return{ready,reset,turnTo(angle){yaw=angle;},stats(){return{loaded:!!model,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,yaw:Number(root.rotation.y.toFixed(2))};},
    render(w,h,time){if(disposed)return;if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}const vertical=3.8/(2*Math.tan(T.MathUtils.degToRad(15))),horizontal=2.85/(2*Math.tan(T.MathUtils.degToRad(15))*camera.aspect);camera.position.set(0,.02,Math.max(vertical,horizontal));camera.lookAt(0,0,0);root.rotation.y+=(yaw-root.rotation.y)*.2;root.rotation.x+=(pitch-root.rotation.x)*.18;root.position.y=Math.sin(time*.85)*.018;renderer.render(scene,camera);},
    dispose(){if(disposed)return;disposed=true;element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('lostpointercapture',up);element.removeEventListener('keydown',keydown);element.removeEventListener('dblclick',reset);disposeObject(model);renderer.dispose();renderer.forceContextLoss();element.remove();}
  };
}
