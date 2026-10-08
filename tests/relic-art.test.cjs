const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),context={console,localStorage:{getItem:()=>null,setItem:()=>{}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/17-relic-data.js'),'utf8'),context);
const pieces=JSON.parse(vm.runInContext('JSON.stringify(Object.values(RELIC_SETS).flatMap(set=>set.slots.map(slot=>({setId:set.id,slot,name:set.names[set.slots.indexOf(slot)]}))))',context));

test('all 116 relic pieces ship distinct compact, transparent 320px WebP artwork',()=>{
  assert.equal(pieces.length,116);
  const hashes=new Set();let totalBytes=0;
  for(const piece of pieces){
    const name=`${piece.setId}-${piece.slot}.webp`,file=path.join(root,'assets/relics-v2',name);
    assert.ok(fs.existsSync(file),`Missing ${piece.name}: ${name}`);
    const data=fs.readFileSync(file);totalBytes+=data.length;
    assert.equal(data.toString('ascii',0,4),'RIFF',name);assert.equal(data.toString('ascii',8,12),'WEBP',name);
    let extended=null;
    for(let offset=12;offset+8<=data.length;){
      const type=data.toString('ascii',offset,offset+4),length=data.readUInt32LE(offset+4);
      if(type==='VP8X')extended=data.subarray(offset+8,offset+8+length);
      offset+=8+length+(length%2);
    }
    assert.ok(extended,`${name} must retain transparent extended WebP`);
    assert.ok(extended[0]&0x10,`${name} needs an alpha channel`);
    assert.equal(extended.readUIntLE(4,3)+1,320,name);assert.equal(extended.readUIntLE(7,3)+1,320,name);
    assert.ok(data.length<100*1024,`${name} exceeds the UI asset size budget`);
    const hash=crypto.createHash('sha256').update(data).digest('hex');
    assert.ok(!hashes.has(hash),`${name} repeats another relic's artwork`);hashes.add(hash);
  }
  assert.ok(totalBytes<6*1024*1024,'The entire collection should remain under 6 MiB; only owned art loads');
});

test('installation preloads only the starter six; no old generic icons remain in active consumers',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),ui=fs.readFileSync(path.join(root,'js/19-relic-ui.js'),'utf8');
  assert.doesNotMatch(sw+ui,/assets\/relics-v1\//);
  const preloaded=[...sw.matchAll(/"\.\/assets\/relics-v2\/([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(preloaded,['A01-core.webp','A01-armor.webp','A01-lens.webp','A01-boots.webp','B01-emblem.webp','B01-power.webp']);
  for(const name of preloaded)assert.ok(fs.existsSync(path.join(root,'assets/relics-v2',name)));
  assert.match(ui,/<img loading="lazy"/,'collection art should retain on-demand loading');
});
