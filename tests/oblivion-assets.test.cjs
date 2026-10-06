const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('Oblivion art uses compact generated WebP files with hero-specific demand loading',()=>{
  const images=[],c={Image:class{},setGameImageSource(im,src){im.assetSource=src;images.push(im);return im;}};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js/12-oblivion-art.js'),'utf8'),c);
  assert.equal(images.length,12);let size=0;
  for(const im of images){assert.equal(im.assetGroup,'oblivion');assert.ok(im.assetSource.startsWith('assets/oblivion-v4/'));const bytes=fs.readFileSync(path.join(root,im.assetSource));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');size+=bytes.length;}
  assert.ok(size<1.5*1024*1024,`art payload ${size} bytes`);
  const loading=fs.readFileSync(path.join(root,'js/00-assets.js'),'utf8');assert.match(loading,/screenMode === "home" && selected === "oblivion"/);
});
test('production page and offline shell load the complete combat modules in dependency order',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');let prev=-1;
  for(const name of ['12-lush-integration','12-oblivion-art','13-oblivion-combat','14-oblivion-vfx','15-oblivion-ui','16-oblivion-integration','pwa']){
    const current=html.indexOf(`js/${name}.js`);assert.ok(current>prev,`${name} script order`);prev=current;assert.ok(sw.includes(`"./js/${name}.js"`),`${name} offline shell`);assert.ok(fs.existsSync(path.join(root,`js/${name}.js`)));
  }
});
