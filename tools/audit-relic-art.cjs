// Usage: node tools/audit-relic-art.cjs /path/to/sharp [--allow-missing]
// Read-only asset QA: checks alpha padding/circular crop safety as well as size.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sharp=require(process.argv[2]||'sharp'),root=path.resolve(__dirname,'..');
const context={console,localStorage:{getItem:()=>null,setItem:()=>{}}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'js/17-relic-data.js'),'utf8'),context);
const pieces=JSON.parse(vm.runInContext('JSON.stringify(Object.values(RELIC_SETS).flatMap(set=>set.slots.map(slot=>set.id+"-"+slot)))',context));
(async()=>{
  const report={expected:pieces.length,files:0,bytes:0,missing:[],issues:[]},hashes=new Map();
  for(const key of pieces){const file=path.join(root,'assets/relics-v2',key+'.webp');if(!fs.existsSync(file)){report.missing.push(key);continue;}
    const data=fs.readFileSync(file),meta=await sharp(data).metadata();report.files++;report.bytes+=data.length;
    if(meta.width!==320||meta.height!==320||!meta.hasAlpha)report.issues.push({key,error:'Expected 320px square with alpha'});
    const hash=crypto.createHash('sha256').update(data).digest('hex');if(hashes.has(hash))report.issues.push({key,error:'Duplicate pixels/file',other:hashes.get(hash)});hashes.set(hash,key);
    const {data:pixels,info}=await sharp(data).ensureAlpha().raw().toBuffer({resolveWithObject:true});let solid=0,clipped=0,transparent=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=pixels[(y*info.width+x)*info.channels+info.channels-1];if(a===0)transparent++;if(a>128){solid++;if(Math.hypot(x-159.5,y-159.5)>155)clipped++;}}
    if(transparent<info.width*info.height*.30)report.issues.push({key,error:'Not enough transparent icon margin'});
    if(solid<1000)report.issues.push({key,error:'Empty or too-small object'});
    if(clipped>solid*.001)report.issues.push({key,error:'Visible object would clip in circular slots',clippedPixels:clipped,solidPixels:solid});
    if(data.length>100*1024)report.issues.push({key,error:'Asset exceeds 100 KiB'});
  }
  console.log(JSON.stringify(report,null,2));if(report.issues.length||(!process.argv.includes('--allow-missing')&&report.missing.length))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
