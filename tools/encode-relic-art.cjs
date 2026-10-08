// Rebuild project icons from built-in image_gen originals, preserving alpha.
// Usage: node tools/encode-relic-art.cjs /path/to/sharp [source-manifest.json ...]
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.argv[2]||'sharp'),root=path.resolve(__dirname,'..');
const manifests=process.argv.length>3?process.argv.slice(3):['relic-art-prompts.json'];
async function encode(entry){
  const id=entry.id||entry.key,source=entry.source||entry.original;
  const trimmed=await sharp(source).ensureAlpha().trim({threshold:8}).png().toBuffer();
  const {data,info}=await sharp(trimmed).raw().toBuffer({resolveWithObject:true});
  let radius=1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    if(data[(y*info.width+x)*info.channels+info.channels-1]>16)radius=Math.max(radius,Math.hypot(x-(info.width-1)/2,y-(info.height-1)/2));
  }
  const scale=Math.min(256/Math.max(info.width,info.height),145/radius);
  const width=Math.max(1,Math.round(info.width*scale)),height=Math.max(1,Math.round(info.height*scale));
  // Materialize the resize before padding: Sharp runs one resize per pipeline.
  const resized=await sharp(trimmed).resize(width,height).png().toBuffer();
  const left=Math.floor((320-width)/2),top=Math.floor((320-height)/2);
  const output=`assets/relics-v2/${id}.webp`;
  await sharp(resized).extend({left,top,right:320-width-left,bottom:320-height-top,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88,alphaQuality:100,effort:5}).toFile(path.join(root,output));
  return {id,output,source,prompt:entry.prompt};
}
(async()=>{
  const entries=manifests.flatMap(file=>JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8')).assets);
  if(entries.length!==116||new Set(entries.map(e=>e.id||e.key)).size!==116)throw Error('All 116 unique originals are required before encoding.');
  const assets=[];for(const entry of entries)assets.push(await encode(entry));
  assets.sort((a,b)=>a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(__dirname,'relic-art-prompts.json'),JSON.stringify({mode:'built-in image_gen',normalization:'320x320 transparent WebP, quality 88; circular-safe silhouette; original alpha preserved',assets},null,2)+'\n');
  console.log(`Encoded ${assets.length} unique circular-safe relic icons and saved their exact prompt set.`);
})().catch(error=>{console.error(error);process.exitCode=1});
