const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {drawLobbyMotionFrame}=require('../js/08-lobby-motion-art');
test('both slowed lobby loops wrap exactly at eighteen seconds, preserve draw state and layer the body between front and back',()=>{
  for(const id of ['astra','mare']){
    const body={width:640,height:960},ornaments={width:960,height:960},water={width:960,height:320};
    function frame(t){const calls=[];let saves=0;const p=new Proxy({save(){saves++},restore(){saves--}},{get(o,k){if(k in o)return o[k];return(...a)=>{for(const v of a)if(typeof v==='number')assert.ok(Number.isFinite(v));calls.push([k,...a]);if(k.startsWith('create'))return{addColorStop(){}};};}});drawLobbyMotionFrame(p,id,body,ornaments,t,640,960,water);assert.equal(saves,0);const index=calls.findIndex(c=>c[0]==='drawImage'&&c[1]===body);assert.ok(index>0&&index<calls.length-1);if(id==='mare')assert.ok(calls.some(c=>c[0]==='drawImage'&&c[1]===water));return calls;}
    assert.deepEqual(frame(0),frame(18));assert.notDeepEqual(frame(0),frame(2));
  }
});
function player(safari=false){
  const created=[];let images=0;class Image{constructor(){images++;this.complete=true;this.naturalWidth=640;this.naturalHeight=960;}}
  const ctx=new Proxy({save(){},restore(){},drawImage(...a){created.push(['draw',...a])}},{get(o,k){return o[k]||(()=>{});}});
  const document={hidden:false,addEventListener(){},createElement(){const v={paused:true,readyState:2,currentTime:0,canPlayType(){return 'probably'},addEventListener(){},load(){},play(){this.paused=false;created.push(['play',this]);return Promise.resolve();},pause(){this.paused=true;created.push(['pause',this])}};created.push(['video',v]);return v;}};
  const sandbox={ctx,document,Image,astraSprite:{complete:true,naturalWidth:640},mareSprite:{complete:true,naturalWidth:640},ensureGameImage(){},navigator:{userAgent:safari?'AppleWebKit Safari':'AppleWebKit Chrome'},performance:{now:()=>1000},drawLobbyMotionFrame(){created.push(['fallback'])}};
  vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/08-lobby-motion.js'),'utf8'),sandbox);return {sandbox,created,get images(){return images;},run:code=>vm.runInContext(code,sandbox)};
}
test('Astra and Mare always draw their original art without videos or fallback animations',()=>{
  for(const safari of [false,true]){const p=player(safari);for(const id of ['astra','mare','astra']){assert.equal(p.run(`drawLobbyAnimatedHero('${id}',0,0,300,450)`),true);assert.equal(p.created.at(-1)[1],p.sandbox[id+'Sprite']);}assert.equal(p.images,0);assert.equal(p.created.filter(c=>c[0]==='video'||c[0]==='fallback').length,0);assert.equal(p.run('lobbyMotionPlayers.size'),0);}
});
test('missing original art fails gracefully without making a video or replacement image',()=>{const p=player();p.sandbox.mareSprite.complete=false;assert.equal(p.run("drawLobbyAnimatedHero('mare',0,0,300,450)"),false);assert.equal(p.created.length,0);assert.equal(p.images,0);});
