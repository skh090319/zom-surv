const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');

function scene({width=1280,height=760,mobile=false,loaded=true}={}){
  const calls=[],stack=[],state={font:'10px Arial',fillStyle:'#fff',textAlign:'left',textBaseline:'alphabetic',globalAlpha:.8,shadowBlur:7},gradient={addColorStop(){}};
  const ctx=new Proxy(state,{get(target,key){
    if(key in target)return target[key];
    if(key==='save')return()=>stack.push({...target});
    if(key==='restore')return()=>{assert.ok(stack.length,'unmatched canvas restore');const saved=stack.pop();for(const k of Object.keys(target))delete target[k];Object.assign(target,saved);};
    if(key==='measureText')return text=>({width:[...text].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*(parseFloat(target.font.match(/[\d.]+px/)?.[0])||10)});
    return(...args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${key} received ${value}`);calls.push({method:key,args,font:target.font,textAlign:target.textAlign,textBaseline:target.textBaseline});if(key.startsWith('create'))return gradient;};
  }});
  const c={console,Math,ctx,canvas:{width,height},player:{level:10,hp:70,maxHp:100},selectedCharacter:'lush',screenMode:'game',paused:false,choosingUpgrade:false,gameOver:false,raidVictory:false,
    characterSkillGuide:{},guideCharacterOrder:[],exclusiveAugmentOwners:{},MOBILE_SKILL_KEYS:{},upgradeCount:{},transcended:{},upgrades:[],zombies:[],mobileControlSettings:{hud:{}},
    Image:class{constructor(){this.complete=loaded;this.naturalWidth=loaded?256:0;this.naturalHeight=loaded?256:0;}},setGameImageSource(im,src){im.src=src;return im;},ensureGameImage:im=>im,
    addEventListener(){},isMobileTouchDevice:()=>mobile,isMobilePortraitMode:()=>false,getWorldViewScale:()=>1,
    drawMobileIcon(spec,x,y,r){calls.push({method:'mobileIcon',args:[spec,x,y,r]});},drawCooldownCover(...args){calls.push({method:'cooldown',args});},drawMobileSkillCancelButton(){}};
  for(const name of ['restart','shoot','reload','killZombie','absorbSuncallShield','update','updatePlayer','getCharacterPreviewSprite','drawPlayer','drawParticles','drawBackground','draw','drawHUD','drawHealthBar','drawExpBar','drawMobileCharacterResource','drawMobileControls','getMobileSkillIcon','getMobileSkillName','getMobileSkillCooldown','getMobileSkillTargetSpec','getMobileAttackTargetSpec','drawAugmentIcon'])c[name]=(...args)=>calls.push({method:'base:'+name,args});
  vm.createContext(c);for(const file of ['08-mobile-settings.js','10-lush.js','11-lush-presentation.js','12-lush-integration.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),c,{filename:file});
  return{c,calls,run:s=>vm.runInContext(s,c),depth:()=>stack.length,state:()=>({...state})};
}

function assertInsidePanel(panel,box,description){
  const tolerance=1e-7;
  assert.ok(box.x>=panel.x-tolerance&&box.y>=panel.y-tolerance&&box.x+box.w<=panel.x+panel.w+tolerance&&box.y+box.h<=panel.y+panel.h+tolerance,`${description} is outside the shared HUD frame: ${JSON.stringify({panel,box})}`);
}

function assertDesktopDrawsInsidePanel(g,panel){
  for(const call of g.calls){
    const a=call.args;
    if(call.method==='drawImage'){
      const start=a.length===9?5:1;assertInsidePanel(panel,{x:a[start],y:a[start+1],w:a[start+2],h:a[start+3]},a[0].src);
    }else if(call.method==='mobileIcon')assertInsidePanel(panel,{x:a[1]-a[3],y:a[2]-a[3],w:a[3]*2,h:a[3]*2},'skill icon');
    else if(call.method==='roundRect')assertInsidePanel(panel,{x:a[0],y:a[1],w:a[2],h:a[3]},'panel fill or key badge');
    else if(call.method==='fillText'){
      const size=parseFloat(call.font.match(/[\d.]+px/)[0]),width=[...a[0]].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*size;
      assertInsidePanel(panel,{x:a[1]-(call.textAlign==='center'?width/2:call.textAlign==='right'?width:0),y:a[2]-(call.textBaseline==='middle'?size/2:size),w:width,h:size},`text ${a[0]}`);
    }
  }
}

test('desktop HUD puts portrait, resource and every skill inside one compact framed row',()=>{
  const g=scene(),layout=g.run('getLushDesktopHudLayout()');assert.equal(layout.stacked,false);assert.equal(layout.resource.h,96);
  assertInsidePanel(layout.panel,layout.resource,'resource region');
  g.run('lushState.totalAssets=150;lushState.chips=20;lushState.messageTime=0;drawLushInterface()');
  const names=g.calls.filter(c=>c.method==='fillText'&&['로열 스트레이트','더블 오어 다이','캐시아웃','하우스 올인'].includes(c.args[0]));
  assert.equal(names.length,4);assert.equal(new Set(names.map(c=>c.args[2])).size,1);
  assert.ok(names.every(c=>parseFloat(c.font.match(/[\d.]+px/)[0])>=11));
  const text=g.calls.filter(c=>c.method==='fillText');assert.ok(text.every(c=>c.args.length===3),'no glyphs are squeezed by Canvas maxWidth');
  for(const sk of layout.skills){assert.ok(sk.y-sk.r*1.13>=layout.resource.y);assert.ok(sk.labelY+8<=layout.resource.y+layout.resource.h);}
  const frames=g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src.endsWith('resource-frame.webp'));assert.equal(frames.length,9,'one shared outer frame, no separate resource-only frame');
  assert.ok(Math.abs(Math.min(...frames.map(c=>c.args[5]))-layout.panel.x)<1e-8);assert.ok(Math.abs(Math.max(...frames.map(c=>c.args[5]+c.args[7]))-(layout.panel.x+layout.panel.w))<1e-8);
  assert.ok(Math.abs(Math.min(...frames.map(c=>c.args[6]))-layout.panel.y)<1e-8);assert.ok(Math.abs(Math.max(...frames.map(c=>c.args[6]+c.args[8]))-(layout.panel.y+layout.panel.h))<1e-8);
  assertDesktopDrawsInsidePanel(g,layout.panel);
  assert.equal(g.depth(),0);
});

test('wide and narrow desktops keep all contents inside the same outer panel',()=>{
  for(const [width,height]of [[1920,1080],[1024,768],[800,600],[640,480],[480,320]]){
    const g=scene({width,height}),layout=g.run('getLushDesktopHudLayout()'),panel=layout.panel,before=g.state();
    assertInsidePanel({x:0,y:0,w:width,h:height},panel,'outer panel');assertInsidePanel(panel,layout.resource,'resource region');
    assert.ok(panel.y>=60,'short layouts leave the HP frame clear');assert.ok(panel.y+panel.h<=height-48,'panel leaves EXP clear');
    for(const end of [1,2])assertInsidePanel(panel,{x:layout.divider['x'+end]-2.5,y:layout.divider['y'+end]-2.5,w:5,h:5},'divider ornament');
    for(const sk of layout.skills){
      assertInsidePanel(panel,{x:sk.x-sk.r*1.13,y:sk.y-sk.r*1.13,w:sk.r*2.26,h:sk.r*2.26},`${sk.key} ornament`);
      assertInsidePanel(panel,{x:sk.x+18,y:sk.keyY-12,w:20,h:20},`${sk.key} key badge`);
      assertInsidePanel(panel,{x:sk.x-sk.width/2,y:sk.labelY-8,w:sk.width,h:16},`${sk.key} name`);
    }
    assert.equal(layout.stacked,width<798);g.run('drawLushInterface()');assertDesktopDrawsInsidePanel(g,panel);assert.equal(g.depth(),0);assert.deepEqual(g.state(),before);
    assert.equal(g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src.endsWith('resource-frame.webp')).length,9);
  }
});

test('the unified desktop panel preserves all four cooldowns and the ultimate level lock',()=>{
  const g=scene();g.run('player.level=9;player.lushqCooldown=210;player.lusheCooldown=75;player.lushxCooldown=150;player.lushrCooldown=1050;drawLushInterface()');
  const skills=g.run('getLushDesktopHudLayout().skills'),cooldowns=g.calls.filter(c=>c.method==='cooldown');assert.equal(cooldowns.length,4);
  for(const [i,call]of cooldowns.entries()){assert.deepEqual(call.args.slice(0,3),[skills[i].x,skills[i].y,skills[i].r]);assert.equal(call.args[3],i===0?1:.5);}
  assert.equal(g.calls.filter(c=>c.method==='mobileIcon').length,4);assert.equal(g.calls.filter(c=>c.method==='fillText'&&c.args[0]==='10레벨').length,1);
  assertDesktopDrawsInsidePanel(g,g.run('getLushDesktopHudLayout().panel'));assert.equal(g.depth(),0);
  g.calls.length=0;g.run('player.level=10;drawLushInterface()');assert.equal(g.calls.filter(c=>c.method==='fillText'&&c.args[0]==='10레벨').length,0);assert.equal(g.calls.filter(c=>c.method==='cooldown').length,4);assert.equal(g.depth(),0);
});

test('phone and tablet resource bounds match rendering and preserve custom position and scale',()=>{
  for(const [width,height]of [[568,320],[844,390],[1024,768],[1366,1024]]){
    const g=scene({width,height,mobile:true}),base=g.run('getMobileHudBounds("resource")');
    assert.equal(base.h,54);assert.ok(base.x-base.w/2>=12&&base.x+base.w/2<=width-12);
    assert.ok(base.y+base.h/2<g.run('getMobileHudBounds("exp").y-getMobileHudBounds("exp").h/2'));
    g.run('drawLushInterface()');assert.equal(g.calls.length,0,'desktop skill row never duplicates touch controls');
    g.run('mobileControlSettings.hud.resource={x:.37,y:.46,scale:1.6}');
    const saved=g.run('JSON.stringify(mobileControlSettings)'),layout=g.run('getMobileHudLayout("resource")');
    assert.equal(layout.x,width*.37);assert.equal(layout.y,height*.46);assert.equal(layout.w,base.w*1.6);assert.equal(layout.h,base.h*1.6);
    g.run('drawMobileEditableHud("resource",drawMobileCharacterResource)');assert.equal(g.depth(),0);assert.equal(g.run('JSON.stringify(mobileControlSettings)'),saved);
    assert.ok(g.calls.some(c=>c.method==='translate'&&c.args[0]===layout.x&&c.args[1]===layout.y));
    assert.ok(g.calls.some(c=>c.method==='scale'&&c.args[0]===1.6&&c.args[1]===1.6));
    const frame=g.calls.filter(c=>c.method==='drawImage'&&c.args[0].src.endsWith('resource-frame.webp'));assert.equal(frame.length,9);
    assert.ok(Math.abs(Math.min(...frame.map(c=>c.args[5]))-(base.x-base.w/2))<1e-8);assert.ok(Math.abs(Math.max(...frame.map(c=>c.args[5]+c.args[7]))-(base.x+base.w/2))<1e-8);
  }
});

test('mobile skill names remain complete within their button widths and default X/R labels do not overlap',()=>{
  const mobileSource=fs.readFileSync(path.join(root,'js/08-mobile.js'),'utf8');
  for(const [width,height]of [[568,320],[844,390],[1024,768]]){
    const g=scene({width,height,mobile:true});
    // Use the actual shared layout, including saved-position handling, to catch
    // regressions in the tightly spaced default X/R formation.
    g.run(mobileSource.match(/function fitMobileControlCenter[^\n]+/)[0]);
    g.run(mobileSource.slice(mobileSource.indexOf('function getMobileControlLayout()'),mobileSource.indexOf('function getMobileMoveVector()')));
    g.run('Object.assign(mobileControlSettings,{joystickScale:1,actionScale:1,skillAnchorScale:1,joystickX:null,joystickY:null,attackX:null,attackY:null,skillAnchorX:null,skillAnchorY:null,skills:Object.fromEntries(["q","e","x","r"].map(key=>[key,{x:null,y:null,scale:1}]))});var mobileJoystickOrigin=null,mobileStickX=0,mobileStickY=0,mobileAttackTouchId=null;function isMobileUltimateLocked(){return false;}');
    const skills=g.run('getMobileControlLayout().skills'),before=g.run('JSON.stringify(mobileControlSettings)');g.run('drawLushMobileControls()');
    const names=g.calls.filter(c=>c.method==='fillText');assert.deepEqual(names.map(c=>c.args[0]),['로열','스트레이트','더블','오어 다이','캐시아웃','하우스','올인']);
    const rects=names.map(c=>{const sk=skills.find(sk=>sk.x===c.args[1]),size=parseFloat(c.font.match(/[\d.]+px/)[0]),textWidth=[...c.args[0]].reduce((sum,ch)=>sum+(/[^\x00-\x7f]/.test(ch)?1:.55),0)*size;
      assert.ok(textWidth<=sk.r*2,'label stays within its button diameter');assert.ok(size>=8);assert.equal(c.args.length,3,'no horizontal glyph compression');assert.ok(c.args[2]<=height-5);
      return{key:sk.key,x:c.args[1]-textWidth/2,y:c.args[2]-size,w:textWidth,h:size};});
    const x=rects.find(r=>r.key==='x');for(const r of rects.filter(r=>r.key==='r'))assert.ok(x.x+x.w<=r.x||r.x+r.w<=x.x||x.y+x.h<=r.y||r.y+r.h<=x.y,'X and R label ink does not overlap');
    assert.equal(g.run('JSON.stringify(mobileControlSettings)'),before);assert.equal(g.depth(),0);
    const icons=g.calls.filter(c=>c.method==='mobileIcon');for(const [i,icon]of icons.entries())assert.deepEqual(icon.args.slice(1),[skills[i].x,skills[i].y,skills[i].r]);
  }
});

test('all four augment arts are centered, cropped and framed within exact circular bounds at every call size',()=>{
  for(const id of ['lushLoaded','lushCollateral','lushRecovery','lushJackpot'])for(const size of [24,48,82,112])for(const transcend of [false,true]){
    const g=scene(),before=g.state();g.run(`drawAugmentIcon('${id}',30,40,${size},${transcend})`);
    const arc=g.calls.find(c=>c.method==='arc');assert.deepEqual(arc.args.slice(0,3),[30+size/2,40+size/2,size/2]);
    const clip=g.calls.findIndex(c=>c.method==='clip'),draw=g.calls.findIndex(c=>c.method==='drawImage');assert.ok(clip>=0&&clip<draw);
    const image=g.calls[draw].args;assert.deepEqual(image.slice(5),[30,40,size,size]);assert.equal(image[3],image[4]);assert.ok(image[1]>0&&image[2]>0,'square source frame is cropped off');
    assert.ok(g.calls.filter(c=>c.method==='arc').slice(1).every(c=>c.args[2]<size/2));assert.equal(g.depth(),0);assert.deepEqual(g.state(),before);
  }
});

test('resource fallback and oversized values render without canvas state leaks or text distortion',()=>{
  for(const loaded of [true,false]){
    const g=scene({loaded}),before=g.state();g.run('lushState.totalAssets=987654321;lushState.chips=1234567;lushState.pot=123456789;lushState.message="가나다라마바사아자차카타파하".repeat(8);drawLushResource(20,30,250,54,true);drawAugmentIcon("lushLoaded",20,90,48,true)');
    assert.equal(g.depth(),0);assert.deepEqual(g.state(),before);assert.ok(g.calls.filter(c=>c.method==='fillText').every(c=>c.args.length===3));
    assert.ok(g.calls.filter(c=>c.method==='fillText').every(c=>parseFloat(c.font.match(/[\d.]+px/)[0])>=10));
    assert.ok(g.calls.some(c=>c.method==='stroke'));
  }
});

test('unrelated augment art and resource HUD retain their original draw paths',()=>{
  const g=scene();g.run('drawAugmentIcon("damage",1,2,48,true);selectedCharacter="astra";drawMobileCharacterResource()');
  assert.ok(g.calls.some(c=>c.method==='base:drawAugmentIcon'&&c.args[0]==='damage'));assert.ok(g.calls.some(c=>c.method==='base:drawMobileCharacterResource'));
});
