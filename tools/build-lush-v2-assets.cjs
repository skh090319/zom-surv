// Reproducible atlas extraction; preserve generated alpha and the existing v1 HUD frames.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/lg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const raw='C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3',out=path.resolve(__dirname,'../assets/lush-v2');
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const icons=path.join(raw,'exec-eacd5e70-647b-4184-afed-dc6dae510dea.png'),m=await sharp(icons).metadata();
 for(let i=0;i<8;i++){const left=Math.round(i%4*m.width/4),top=Math.round(Math.floor(i/4)*m.height/2),width=Math.round((i%4+1)*m.width/4)-left,height=Math.round((Math.floor(i/4)+1)*m.height/2)-top;
  await sharp(icons).extract({left,top,width,height}).resize(256,256).webp({quality:91}).toFile(path.join(out,(i<4?'skill-'+i:'augment-'+(i-4))+'.webp'));}
 const vfx=path.join(raw,'exec-2e7b60a1-040e-47b7-89a9-f3be1d4a5333.png'),vm=await sharp(vfx).metadata();
 // Atlas objects are intentionally cropped by visible bounds, not through the dealer's hair.
 const crops=[['card',100,10,330,430],['die',560,20,440,415],['shatter',0,448,510,530],['dealer',512,435,512,578],['burst',0,983,517,553],['sigil',524,1012,500,524]];
 for(const [name,x,y,w,h]of crops){const left=Math.round(x*vm.width/1024),top=Math.round(y*vm.height/1536),width=Math.min(vm.width-left,Math.round(w*vm.width/1024)),height=Math.min(vm.height-top,Math.round(h*vm.height/1536));
  await sharp(vfx).extract({left,top,width,height}).resize({width:512,height:512,fit:'inside'}).webp({quality:92,alphaQuality:100}).toFile(path.join(out,'vfx-'+name+'.webp'));}
 for(const f of fs.readdirSync(out))console.log(f,fs.statSync(path.join(out,f)).size);
}
main().catch(e=>{console.error(e);process.exit(1);});
