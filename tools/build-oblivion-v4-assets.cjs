// Loss-conscious atlas extraction and WebP encoding. Generated alpha is preserved.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/lg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const input='C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3';
const output=path.resolve(__dirname,'../assets/oblivion-v4');
const sources={monster:'exec-4a98f7b4-03fc-4693-b253-69f2eb748c6e.png',skills:'exec-7f421170-c1de-4f7d-93d8-8c5166404a66.png',controls:'exec-56ef32bf-6964-4429-87e0-bc502412d8c9.png',frames:'exec-42c57a39-9e8f-4176-a80f-6c5ed9740181.png'};
async function encode(name,source,box,maxWidth,maxHeight,trim=false){
  let pipeline=sharp(path.join(input,sources[source]));
  if(box)pipeline=pipeline.extract(box);
  // Materialize each atlas cell before trimming: Sharp otherwise schedules trim
  // ahead of extract and offsets later quadrants against the trimmed sheet.
  if(trim)pipeline=sharp(await pipeline.toBuffer()).trim({background:'#00000000',threshold:1});
  await pipeline.resize({width:maxWidth,height:maxHeight,fit:'inside',withoutEnlargement:true}).webp({quality:93,alphaQuality:100,effort:6}).toFile(path.join(output,name+'.webp'));
}
async function main(){
  fs.mkdirSync(output,{recursive:true});
  await encode('monster','monster',null,768,1152,true);
  for(let i=0;i<4;i++){
    const x=i%2,y=Math.floor(i/2);
    await encode('skill-'+i,'skills',{left:x*627+5,top:y*627+5,width:617,height:617},320,320);
    await encode(['joystick-base','joystick-thumb','attack','skill-frame'][i],'controls',{left:x*627,top:y*627,width:627,height:627},384,384,true);
  }
  await encode('panel','frames',{left:4,top:58,width:1528,height:550},1536,550,true);
  await encode('hp-frame','frames',{left:25,top:632,width:1486,height:166},1486,166,true);
  await encode('xp-frame','frames',{left:34,top:815,width:1470,height:152},1470,152,true);
  for(const name of fs.readdirSync(output).filter(f=>f.endsWith('.webp'))){const m=await sharp(path.join(output,name)).metadata();console.log(name,m.width,m.height,fs.statSync(path.join(output,name)).size,'bytes','alpha='+m.hasAlpha);}
}
main().catch(error=>{console.error(error);process.exit(1);});
