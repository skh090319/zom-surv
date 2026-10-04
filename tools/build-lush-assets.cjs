// Build optimized, alpha-preserving runtime assets from the generated originals.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/lg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..', 'assets', 'lush-v1');
const raw = 'C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3';
const sources = {
  character:'exec-2a2b5c70-95e2-435f-be54-5ca651f23d5c.png',
  realm:'exec-4e09c487-87a7-4f7e-936b-b459cc9e7f3d.png',
  icons:'exec-8dbc90a9-f241-4122-a300-14a8afa8b4e4.png',
  controls:'exec-d51202f9-9bde-4147-bd24-5c8c0b6a5cc6.png'
};
async function main(){
  fs.mkdirSync(root,{recursive:true});
  await sharp(path.join(raw,sources.character)).resize({height:1200}).webp({quality:91,alphaQuality:100}).toFile(path.join(root,'lush.webp'));
  await sharp(path.join(raw,sources.character)).resize({height:320}).webp({quality:86,alphaQuality:100}).toFile(path.join(root,'lush-thumb.webp'));
  await sharp(path.join(raw,sources.character)).extract({left:265,top:5,width:470,height:620}).resize({height:650}).webp({quality:92,alphaQuality:100}).toFile(path.join(root,'portrait.webp'));
  await sharp(path.join(raw,sources.realm)).resize({width:1536}).webp({quality:86}).toFile(path.join(root,'casino-realm.webp'));
  await sharp(path.join(raw,'exec-7b203e6e-923f-435a-ad86-9edfa2f1dcac.png')).resize({width:768}).webp({quality:92,alphaQuality:100}).toFile(path.join(root,'slot-machine.webp'));
  for(const kind of ['icons','controls']){
    const file=path.join(raw,sources[kind]),m=await sharp(file).metadata(),cols=kind==='icons'?4:2,rows=2;
    for(let i=0;i<cols*rows;i++){
      const left=Math.round((i%cols)*m.width/cols),top=Math.round(Math.floor(i/cols)*m.height/rows);
      const width=Math.round(((i%cols)+1)*m.width/cols)-left,height=Math.round((Math.floor(i/cols)+1)*m.height/rows)-top;
      let im=sharp(await sharp(file).extract({left,top,width,height}).toBuffer());
      if(kind==='controls'){
        im=im.trim({threshold:15});
        if(i===3){
          // Remove the isolated fragment from the neighboring ornament above the bar.
          const trimmed=await im.toBuffer(),meta=await sharp(trimmed).metadata(),cut=Math.floor(meta.height*.38);
          im=sharp(trimmed).extract({left:0,top:cut,width:meta.width,height:meta.height-cut}).trim({threshold:15});
        }
      }
      await im.resize({width:kind==='icons'?256:640,height:kind==='icons'?256:640,fit:'inside'}).webp({quality:91,alphaQuality:100}).toFile(path.join(root,`${kind==='icons'?(i<4?'skill-'+i:'augment-'+(i-4)):'control-'+i}.webp`));
    }
  }
  for(const file of fs.readdirSync(root))console.log(file,fs.statSync(path.join(root,file)).size);
}
main().catch(e=>{console.error(e);process.exit(1);});
