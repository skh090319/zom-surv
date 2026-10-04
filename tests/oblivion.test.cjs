const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function game(){
  const c={Image:class{},setGameImageSource:i=>i,ensureGameImage:i=>i,selectedCharacter:'oblivion',player:{x:500,y:500,hp:73,maxHp:100,exp:4,expNeed:12,level:10,fireCooldown:0,reloadTime:0},zombies:[{x:700,y:500,hp:1000}],bullets:[],characterSkillGuide:{},guideCharacterOrder:[],MOBILE_SKILL_KEYS:{},upgrades:[{id:'general'}],exclusiveAugmentOwners:{},drawHealthBar(){},drawExpBar(){},drawHUD(){},getCharacterPreviewSprite(){},drawMobileCharacterResource(){}};
  vm.createContext(c);for(const file of ['04-oblivion.js','04-weapons-spawn.js','08-oblivion-ui.js'])vm.runInContext(fs.readFileSync('js/'+file,'utf8'),c);
  return{c,run:s=>vm.runInContext(s,c)};
}
test('Oblivion has no attack or skills, and shooting cannot fall through to the generic gun',()=>{
  const{c,run}=game(),before=JSON.stringify([c.player,c.zombies,c.bullets]);
  for(const name of ['attackWithOblivion','activateOblivionQ','activateOblivionE','activateOblivionX','activateOblivionR','oblivionDamage'])assert.equal(run(`typeof ${name}`),'undefined');
  run('for(let i=0;i<300;i++){shoot();updateOblivionPresentation();}');assert.equal(JSON.stringify([c.player,c.zombies,c.bullets]),before);assert.equal(run('oblivionBackdropTime'),0);
});
test('no exclusive augments register, and mobile and guide skill lists are empty',()=>{
  const{c}=game();assert.equal(c.upgrades.length,1);assert.deepEqual(Object.keys(c.exclusiveAugmentOwners),[]);assert.equal(c.MOBILE_SKILL_KEYS.oblivion.length,0);assert.equal(c.characterSkillGuide.oblivion.skills.length,0);
});
test('HP and XP animation follows actual changes and restart resets presentation',()=>{
  const{c,run}=game();run('updateOblivionPresentation()');c.player.hp=23;c.player.exp=10;run('updateOblivionPresentation()');
  assert.ok(run('oblivionBars.trail>oblivionBars.hp'));assert.ok(run('oblivionBars.xp>4/12&&oblivionBars.xp<10/12'));const before=JSON.stringify(c.player);
  run('for(let i=0;i<150;i++)updateOblivionPresentation()');assert.ok(Math.abs(run('oblivionBars.hp')-.23)<1e-6);assert.ok(Math.abs(run('oblivionBars.trail')-.23)<.002);assert.equal(JSON.stringify(c.player),before);
  c.player.level++;c.player.exp=1;run('updateOblivionPresentation()');assert.ok(run('oblivionBars.xp')<.1);run('oblivionBackdropTime=255;resetOblivionPresentation()');assert.equal(run('oblivionBars'),null);assert.equal(run('oblivionBackdropTime'),0);assert.equal(run('oblivionPresentationTime'),0);
});
