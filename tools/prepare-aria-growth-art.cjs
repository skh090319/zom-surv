// Mechanical atlas extraction, resizing and WebP encoding; source art is retained.
const sharp=require(process.argv[3]||'sharp'),fs=require('node:fs/promises'),path=require('node:path');
const manifest=require('../assets/aria-v3/prompts.json');
const input=process.argv[2];if(!input)throw new Error('Provide the generated image directory.');
const dir=path.resolve(__dirname,'../assets/aria-v3');
const source=key=>path.join(input,manifest.assets.find(a=>a.key===key).source);
(async()=>{
 await fs.mkdir(dir,{recursive:true});
 for(const [key,name,w,h] of [['skills','skill-icons',768,768],['augments','augment-icons',1152,768],['background','ultimate-background',null,null]]){
  let pipeline=sharp(source(key));if(w)pipeline=pipeline.resize(w,h,{fit:'fill'});
  await pipeline.webp({quality:key==='background'?84:88,alphaQuality:100,effort:6}).toFile(path.join(dir,name+'.webp'));
 }
 const meta=await sharp(source('growth')).metadata(),bounds=[0,620,1332,meta.width],layers=[];
 for(let i=0;i<3;i++){
  const cropped=await sharp(source('growth')).extract({left:bounds[i],top:0,width:bounds[i+1]-bounds[i],height:meta.height}).png().toBuffer();
  const {data,info}=await sharp(cropped).trim({threshold:8}).resize(430,430,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
  layers.push({input:data,left:i*512+Math.round((512-info.width)/2),top:471-info.height});
 }
 await sharp({create:{width:1536,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).webp({quality:90,alphaQuality:100,effort:6}).toFile(path.join(dir,'tree-growth.webp'));
 for(const file of ['skill-icons.webp','augment-icons.webp','ultimate-background.webp','tree-growth.webp'])console.log(file,(await fs.stat(path.join(dir,file))).size);
})().catch(e=>{console.error(e);process.exitCode=1;});
