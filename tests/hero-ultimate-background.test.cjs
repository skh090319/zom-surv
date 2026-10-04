const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function game(){
  const calls=[],stack=[];
  const ctx=new Proxy({globalAlpha:.7,globalCompositeOperation:'lighter',save(){stack.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop();},drawImage(...a){calls.push(['image',...a]);}},{get(o,k){if(k in o)return o[k];return(...a)=>{for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),k);};}});
  const c={Math,Image:class{constructor(){this.complete=true;this.naturalWidth=1600;this.naturalHeight=900;}},ctx,canvas:{width:1280,height:760},player:{hp:73,mareUltimateTime:0},oblivionRealm:{life:300},selectedCharacter:'oblivion',screenMode:'home',backgroundLoaded:true,backgroundImage:{naturalWidth:2000,naturalHeight:2000},camera:{x:300,y:200},WORLD:{width:4000,height:4000},getCameraViewWidth:()=>1280,getCameraViewHeight:()=>760,astraBackdropProgress:()=>0,drawAstraUltimateBackdrop(){}};
  vm.createContext(c);
  for(const file of ['00-assets.js','07-hero-ultimate-background.js','07-world-render.js'])vm.runInContext(fs.readFileSync('js/'+file,'utf8'),c);
  return {c,calls,stack,run:s=>vm.runInContext(s,c)};
}
test('both realms follow the entire ultimate, fade at each end and never leak into menus or other heroes',()=>{
  const g=game();g.c.screenMode='game';
  for(const [id,duration] of [['oblivion',300],['mare',420]]){
    g.c.selectedCharacter=id;
    const life=n=>{g.c.oblivionRealm.life=n;g.c.player.mareUltimateTime=n;};
    for(const [time,expected] of [[duration,0],[duration-12,.5],[duration-24,1],[duration-150,1],[18,.5],[0,0]]){
      life(time);assert.equal(g.run('heroUltimateBackdropProgress()'),expected,id+' '+time);
    }
    life(duration-45);const before=g.run('heroUltimateBackdropProgress()');assert.equal(g.run('heroUltimateBackdropProgress()'),before,'pause freezes reveal');
    for(const screen of ['home','character','guide','mobileSettings']){g.c.screenMode=screen;assert.equal(g.run('heroUltimateBackdropProgress()'),0);}
    g.c.screenMode='game';g.c.player.hp=0;assert.equal(g.run('heroUltimateBackdropProgress()'),0);g.c.player.hp=73;
    g.run('heroUltimateBackdrops[selectedCharacter].complete=false');assert.equal(g.run('heroUltimateBackdropProgress()'),0);g.run('heroUltimateBackdrops[selectedCharacter].complete=true');
  }
  g.c.selectedCharacter='astra';assert.equal(g.run('heroUltimateBackdropProgress()'),0);
});
test('background stays behind gameplay, preserves aspect ratio on PC/phone and avoids drawing the covered normal map',()=>{
  const g=game();g.c.screenMode='game';g.c.oblivionRealm.life=255;
  for(const [width,height] of [[1280,760],[844,390]]){
    g.c.canvas={width,height};g.calls.length=0;
    const before=JSON.stringify([g.c.player,g.c.oblivionRealm]);g.run('drawBackground()');
    assert.equal(g.calls.length,1);assert.equal(g.calls[0][1],g.run('heroUltimateBackdrops.oblivion'));
    const [,im,x,y,w,h]=g.calls[0];assert.ok(x<=0&&y<=0&&w>=width&&h>=height);assert.ok(Math.abs(w/h-im.naturalWidth/im.naturalHeight)<1e-12);
    assert.equal(g.stack.length,0);assert.equal(g.c.ctx.globalAlpha,.7);assert.equal(g.c.ctx.globalCompositeOperation,'lighter');assert.equal(JSON.stringify([g.c.player,g.c.oblivionRealm]),before);
  }
  g.c.oblivionRealm.life=288;g.calls.length=0;g.run('drawBackground()');assert.equal(g.calls.length,2);assert.equal(g.calls[0][1],g.c.backgroundImage);
  g.c.oblivionRealm.life=0;g.calls.length=0;g.run('drawBackground()');assert.equal(g.calls.length,1);assert.equal(g.calls[0][1],g.c.backgroundImage);
});
test('realms preload only for their selected hero, and both runtime assets stay compact',()=>{
  for(const hero of ['mare','oblivion']){
    const g=game();g.c.selectedCharacter='ren';g.run('prepareGameImages()');assert.equal(g.run('heroUltimateBackdrops.mare.src'),undefined);assert.equal(g.run('heroUltimateBackdrops.oblivion.src'),undefined);
    g.c.selectedCharacter=hero;g.run('prepareGameImages()');assert.ok(g.run('heroUltimateBackdrops[selectedCharacter].src'));
    const other=hero==='mare'?'oblivion':'mare';assert.equal(g.run(`heroUltimateBackdrops.${other}.src`),undefined);
    const data=fs.readFileSync('assets/ultimate-backgrounds-v1/'+hero+'.webp');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length<350*1024);
  }
});
