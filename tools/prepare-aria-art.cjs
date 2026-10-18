// Usage: node tools/prepare-aria-art.cjs <generated-images-folder> [sharp-module] [--vfx-only]
const sharp=require(process.argv[3]||'sharp');
const fs=require('node:fs/promises'),path=require('node:path');
const manifest=require('../assets/aria-v2/prompts.json');
if(!process.argv[2])throw new Error('Pass the folder containing original generated PNGs. Originals are never modified.');
const sourceDir=path.resolve(process.argv[2]),dir=path.resolve(__dirname,'../assets/aria-v2');
const source=key=>path.join(sourceDir,manifest.sources[key]);
const webp={quality:88,alphaQuality:100,effort:6};
(async()=>{
await fs.mkdir(dir,{recursive:true});
if(!process.argv.includes('--vfx-only')){
 const character=source('characterCutout');
 await sharp(character).resize({height:1280}).webp({...webp,quality:87}).toFile(path.join(dir,'character.webp'));
 await sharp(character).resize({height:320}).webp({...webp,quality:83}).toFile(path.join(dir,'thumb.webp'));
 await sharp(character).extract({left:327,top:25,width:380,height:380}).resize(512,512).webp(webp).toFile(path.join(dir,'portrait.webp'));
 for(const [key,name,width,height] of [['tree','world-tree',1024,1024],['skills','skill-icons',768,768],['frame','skill-frame',512,512],['panel','panel',1440,null],['augments','augment-icons',1152,768]]){
  await sharp(source(key)).resize({width,height:height||undefined,fit:key==='tree'?'inside':'fill'}).webp(webp).toFile(path.join(dir,name+'.webp'));
 }
}
for(const [name,left,width] of [['thorn',0,702],['bloom',702,772],['petal',1480,692]]){
 await sharp(source('vfx')).extract({left,top:0,width,height:724}).resize({width:512,height:512,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp(webp).toFile(path.join(dir,name+'-sprite.webp'));
}
for(const name of manifest.outputs)console.log(name,(await fs.stat(path.join(dir,name))).size);
})().catch(e=>{console.error(e);process.exitCode=1;});
