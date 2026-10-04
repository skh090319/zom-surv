// Oblivion currently contains art and presentation only. Skills are intentionally absent.
const oblivionSprite=setGameImageSource(new Image(),'assets/oblivion/body-balanced-v3.webp');
const oblivionUiPanel=setGameImageSource(new Image(),'assets/oblivion/ui-panel-v3.webp');
for(const im of [oblivionSprite,oblivionUiPanel])im.assetGroup='oblivion';
let oblivionPresentationTime=0;
let oblivionBackdropTime=0;
function resetOblivionPresentation(){
  oblivionPresentationTime=0;oblivionBackdropTime=0;
  if(typeof resetOblivionBars==='function')resetOblivionBars();
}
function updateOblivionPresentation(){
  if(selectedCharacter!=='oblivion')return;
  oblivionPresentationTime++;
  if(oblivionBackdropTime>0)oblivionBackdropTime--;
  if(typeof updateOblivionBars==='function')updateOblivionBars();
}
let oblivionRiftTexture=null;
function getOblivionRiftTexture(){if(oblivionRiftTexture)return oblivionRiftTexture;const c=document.createElement('canvas');c.width=c.height=256;const t=c.getContext('2d'),g=t.createRadialGradient(128,128,50,128,128,125);g.addColorStop(0,'#09030c');g.addColorStop(.18,'#430b22');g.addColorStop(.3,'#ff345b');g.addColorStop(.36,'#ffe0eb');g.addColorStop(.43,'#e91d49aa');g.addColorStop(.65,'#92173844');g.addColorStop(1,'#ff224400');t.fillStyle=g;t.fillRect(0,0,256,256);t.strokeStyle='#ff8298aa';t.lineWidth=1;for(let i=0;i<12;i++){const a=i*.5236;t.beginPath();t.arc(128,128,74+i%3*4,a,a+.28);t.stroke();t.beginPath();t.moveTo(128+Math.cos(a)*82,128+Math.sin(a)*82);t.lineTo(128+Math.cos(a+.08)*105,128+Math.sin(a+.08)*105);t.lineTo(128+Math.cos(a)*120,128+Math.sin(a)*120);t.stroke();}oblivionRiftTexture=c;return c;}
function drawOblivionRift(x,y,r,a=0,alpha=1){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=alpha;ctx.drawImage(getOblivionRiftTexture(),-r*.56,-r*1.55,r*1.12,r*3.1);ctx.fillStyle='#030207';ctx.strokeStyle='#ff3658';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,r*.28,r,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffd4dc';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,r*.34,r*1.05,0,-1,1.8);ctx.stroke();ctx.restore();}
