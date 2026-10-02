// Render authored animation as real alpha-channel VP9 video, preserving original art.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const runtime=process.env.CODEX_NODE_MODULES||'C:/Users/lg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,loadImage}=require(path.join(runtime,'@napi-rs/canvas'));
const sharp=require(path.join(runtime,'sharp'));
const {drawLobbyMotionFrame,LOBBY_MOTION_DURATION}=require('../js/08-lobby-motion-art');
const root=path.join(__dirname,'..'),ffmpeg=process.argv[2],astraSource=process.argv[3],mareSource=process.argv[4],ornamentSource=process.argv[5],waterSource=process.argv[6];
async function main(){
  if(!ffmpeg||!waterSource)throw Error('Usage: node render-lobby-motion.cjs ffmpeg astra.png mare.png ornaments.png water.png');
  const directory=path.join(root,'assets/lobby-motion-v1');fs.mkdirSync(directory,{recursive:true});
  for(const [name,source] of [['astra-body',astraSource],['mare-body',mareSource],['celestial-ornaments',ornamentSource],['water-ribbon',waterSource]]){
    const image=sharp(source),metadata=await image.metadata();if(!metadata.hasAlpha)throw Error('Transparent source required: '+name);
    await image.resize({width:960,height:1440,fit:'inside',withoutEnlargement:true}).webp({quality:94,alphaQuality:100}).toFile(path.join(directory,name+'.webp'));
  }
  const ornaments=await loadImage(path.join(directory,'celestial-ornaments.webp'));
  const water=await loadImage(path.join(directory,'water-ribbon.webp'));
  for(const id of process.argv[7]?[process.argv[7]]:['astra','mare']){
    const body=await loadImage(path.join(directory,id+'-body.webp')),canvas=createCanvas(640,960),p=canvas.getContext('2d');
    const file=path.join(directory,id+'-orbit-'+(id==='astra'?'v3':'v2')+'.webm');
    const proc=spawn(ffmpeg,['-y','-f','rawvideo','-pixel_format','rgba','-video_size','640x960','-framerate','30','-i','pipe:0','-an','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','28','-deadline','good','-cpu-used','3',file],{stdio:['pipe','ignore','pipe']});
    let error='';proc.stderr.on('data',d=>error+=d);
    const complete=new Promise((resolve,reject)=>proc.on('close',code=>code?reject(Error(error)):resolve()));
    for(let frame=0;frame<30*LOBBY_MOTION_DURATION;frame++){
      p.clearRect(0,0,640,960);drawLobbyMotionFrame(p,id,body,ornaments,frame/30,640,960,water);
      if(frame===30)fs.writeFileSync(path.join(directory,id+'-poster.png'),canvas.toBuffer('image/png'));
      if(!proc.stdin.write(Buffer.from(p.getImageData(0,0,640,960).data)))await new Promise(resolve=>proc.stdin.once('drain',resolve));
    }
    proc.stdin.end();await complete;console.log(id,fs.statSync(file).size,'bytes,',LOBBY_MOTION_DURATION,'seconds, 30 fps, alpha VP9');
    await sharp(path.join(directory,id+'-poster.png')).webp({quality:94}).toFile(path.join(directory,id+'-poster.webp'));
    fs.unlinkSync(path.join(directory,id+'-poster.png'));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
