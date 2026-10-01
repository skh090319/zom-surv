// Hand-built celestial VFX. Baked glow/cloud textures avoid per-particle blur.
const astraVfxTextures = new Map();
const ASTRA_TAU = Math.PI * 2;
let astraVfxWarmupScheduled = false;
let astraRealmSurface = null;
const astraRuneGeometry = new Map();
const astraRuneDirections = Array.from({ length: 24 }, (_, i) => ({ c: Math.cos(i * Math.PI / 12), s: Math.sin(i * Math.PI / 12) }));
const astraRibbonTapers = new Map();
const astraSuctionArmCache = new Map();
let astraWellArmGeometry = null;
function astraSpiralGeometry(pullRatio) {
  const well = pullRatio === undefined;
  if (well && astraWellArmGeometry) return astraWellArmGeometry;
  if (!well && astraSuctionArmCache.has(pullRatio)) return astraSuctionArmCache.get(pullRatio);
  const steps = well ? 40 : 24, points = new Float64Array((steps + 1) * 2);
  const path = typeof Path2D === "function" ? new Path2D() : null;
  for (let i = 0; i <= steps; i++) {
    const q = i / steps, rr = well ? .12 + .8 * q : pullRatio * .58 + (1 - pullRatio * .58) * q;
    const a = well ? -q * 3.6 : (1 - q) ** 1.5 * 2.15;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    points[i * 2] = x; points[i * 2 + 1] = y;
    if (path) i ? path.lineTo(x, y) : path.moveTo(x, y);
  }
  const geometry = { points, path };
  if (well) astraWellArmGeometry = geometry;
  else { if (astraSuctionArmCache.size >= 8) astraSuctionArmCache.delete(astraSuctionArmCache.keys().next().value); astraSuctionArmCache.set(pullRatio, geometry); }
  return geometry;
}
function astraStrokeSpiral(geometry) {
  if (geometry.path) { ctx.stroke(geometry.path); return; }
  ctx.beginPath();
  for (let i = 0; i < geometry.points.length; i += 2) i ? ctx.lineTo(geometry.points[i], geometry.points[i + 1]) : ctx.moveTo(geometry.points[i], geometry.points[i + 1]);
  ctx.stroke();
}
function astraRealmRevealGeometry(progress) {
  const scale = getWorldViewScale(), x = (player.x - camera.x) * scale, y = (player.y - camera.y) * scale;
  const farthest = Math.hypot(Math.max(x, canvas.width - x), Math.max(y, canvas.height - y));
  const feather = Math.max(32, Math.min(100, Math.min(canvas.width, canvas.height) * .14));
  const outer = progress * (farthest + feather);
  return { x, y, inner: Math.max(0, outer - feather), outer };
}
function drawAstraUltimateBackdrop() {
  const progress = astraBackdropProgress();
  if (progress <= 0 || !astraUltimateBackdrop.complete || !astraUltimateBackdrop.naturalWidth || !astraUltimateBackdrop.naturalHeight) return;
  // Screen-space cover preserves the panorama's aspect ratio on phones/tablets.
  // Draw only in the background pass: hazards, enemies and HUD stay on top.
  const scale = Math.max(canvas.width / astraUltimateBackdrop.naturalWidth, canvas.height / astraUltimateBackdrop.naturalHeight);
  const w = astraUltimateBackdrop.naturalWidth * scale, h = astraUltimateBackdrop.naturalHeight * scale;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  if (progress >= 1) {
    // No extra compositing cost while the whole realm is visible.
    ctx.drawImage(astraUltimateBackdrop, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else {
    // Mask only the backdrop, never the normal map, enemies or UI. Reuse this
    // surface across frames/casts; its dimensions change only with the viewport.
    if (!astraRealmSurface) astraRealmSurface = document.createElement("canvas");
    if (astraRealmSurface.width !== canvas.width || astraRealmSurface.height !== canvas.height) {
      astraRealmSurface.width = canvas.width; astraRealmSurface.height = canvas.height;
    }
    const surface = astraRealmSurface.getContext("2d"), reveal = astraRealmRevealGeometry(progress);
    surface.clearRect(0, 0, canvas.width, canvas.height);
    surface.drawImage(astraUltimateBackdrop, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    surface.save();
    surface.globalCompositeOperation = "destination-in";
    const mask = surface.createRadialGradient(reveal.x, reveal.y, reveal.inner, reveal.x, reveal.y, reveal.outer);
    mask.addColorStop(0, "rgba(255,255,255,1)");
    mask.addColorStop(.3, "rgba(255,255,255,.86)");
    mask.addColorStop(.7, "rgba(255,255,255,.22)");
    mask.addColorStop(1, "rgba(255,255,255,0)");
    surface.fillStyle = mask; surface.fillRect(0, 0, canvas.width, canvas.height);
    surface.restore();
    ctx.drawImage(astraRealmSurface, 0, 0);
  }
  ctx.restore();
}
function astraPortraitCutInState() {
  const g=astraGravity;
  if(selectedCharacter!=="astra"||screenMode!=="game"||!g||g.age>=138)return null;
  // The corner cut-in is brief and non-blocking. It freezes with game time.
  const enter=astraEase(g.age/20),exit=astraEase((g.age-105)/33);
  return {enter,exit,alpha:enter*(1-exit),slide:(1-enter)*.22+exit*.08};
}
function drawAstraUltimatePortrait(){
  const state=astraPortraitCutInState();
  if(!state||state.alpha<=0||typeof astraUltimatePortrait==="undefined"||!astraUltimatePortrait.complete||!astraUltimatePortrait.naturalWidth)return;
  const w=canvas.width*.52,h=canvas.height*.27,x=canvas.width-w;
  ctx.save();ctx.globalAlpha=state.alpha;ctx.translate(w*state.slide,0);
  // Exactly the upper-right diagonal corner in the user's layout reference.
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,0);ctx.lineTo(canvas.width,h);ctx.closePath();ctx.clip();
  const field=ctx.createLinearGradient(x,0,canvas.width,h);field.addColorStop(0,"rgba(15,27,65,.12)");field.addColorStop(.45,"rgba(18,34,83,.88)");field.addColorStop(1,"rgba(39,27,72,.93)");
  ctx.fillStyle=field;ctx.fillRect(x,0,w,h);
  ctx.save();ctx.globalCompositeOperation='lighter';astraNebula(canvas.width-w*.18,h*.2,w*.52,-astraGravity.age*.003,.32,.6);ctx.restore();
  const zoom=1.035-astraEase(astraGravity.age/105)*.035,pw=w*zoom,ph=pw*astraUltimatePortrait.naturalHeight/astraUltimatePortrait.naturalWidth;
  const phone=typeof isMobileTouchDevice==='function'&&isMobileTouchDevice();
  ctx.drawImage(astraUltimatePortrait,canvas.width-pw+(phone?w*.07:0),-ph*.17,pw,ph);
  // Restrained moving star streaks; no screen flash or camera shake.
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<9;i++){
    const px=x+w*((i*.137+astraGravity.age*.0018)%1),py=h*(.10+(i%4)*.13);
    ctx.strokeStyle=i%3?'rgba(156,225,255,.45)':'rgba(244,216,161,.65)';ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(px-w*.035,py-h*.015);ctx.lineTo(px,py);ctx.stroke();
  }
  ctx.restore();ctx.restore();
  ctx.save();ctx.globalAlpha=state.alpha;ctx.translate(w*state.slide,0);
  const edge=ctx.createLinearGradient(x,0,canvas.width,h);edge.addColorStop(0,'rgba(160,222,255,0)');edge.addColorStop(.35,'rgba(160,222,255,.55)');edge.addColorStop(.8,'rgba(243,214,160,.85)');edge.addColorStop(1,'rgba(175,223,255,.3)');
  ctx.strokeStyle=edge;ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(canvas.width,h);ctx.stroke();ctx.restore();
}
function prepareAstraVfx() {
  if (astraVfxWarmupScheduled) return;
  astraVfxWarmupScheduled = true;
  const bake = () => { astraNebulaTexture(); astraVfxTexture("blue"); astraVfxTexture("gold"); astraVfxTexture("cloud"); for(const r of [10,12,16,18,22,24])astraStarFaceTexture(r); astraAuroraTexture(0); astraAuroraTexture(1); astraSuctionWakeTexture(); };
  if (typeof requestIdleCallback === "function") requestIdleCallback(bake, { timeout: 400 });
  else if (typeof setTimeout === "function") setTimeout(bake, 0);
}
// A deterministic, once-baked turbulent emission map. Animation rotates two
// differently scaled layers; no pixel noise or blur is computed during combat.
function astraNebulaTexture() {
  if (astraVfxTextures.has("nebula")) return astraVfxTextures.get("nebula");
  const texture = document.createElement("canvas"), size = 384;
  texture.width = texture.height = size;
  const surface = texture.getContext("2d"), pixels = surface.createImageData(size, size), data = pixels.data;
  const grid = new Float32Array(128 * 128);
  let seed = 73891;
  for (let i = 0; i < grid.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; grid[i] = (seed >>> 0) / 4294967295; }
  const noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, tx = fx * fx * (3 - 2 * fx), ty = fy * fy * (3 - 2 * fy);
    const at = (a, b) => grid[(a & 127) + (b & 127) * 128];
    return (at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx) * (1 - ty) + (at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx) * ty;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x - size / 2) / (size / 2), dy = (y - size / 2) / (size / 2), r = Math.hypot(dx, dy);
    if (r > 1 || r < .075) continue;
    const a = Math.atan2(dy, dx), n = noise(x * .037, y * .037) * .55 + noise(x * .09, y * .09) * .3 + noise(x * .21, y * .21) * .15;
    const arm = (.5 + .5 * Math.sin(a * 5 - r * 10 + n * 4)) ** 2;
    const band = Math.exp(-(((r - .44) / .28) ** 2)), rim = Math.exp(-(((r - .18) / .055) ** 2));
    const alpha = (arm * band * .9 + rim * .7 + .06) * (.25 + n * .85) * astraEase((1 - r) * 3) * astraEase((r - .075) * 12);
    const hot = Math.min(1, rim + arm * .3), i = (y * size + x) * 4;
    data[i] = 65 + hot * 178; data[i + 1] = 78 + hot * 154; data[i + 2] = 191 + hot * 56; data[i + 3] = Math.min(255, alpha * 230);
  }
  surface.putImageData(pixels, 0, 0); astraVfxTextures.set("nebula", texture); return texture;
}
function astraNebula(x, y, radius, rotation, alpha = 1, squash = .78) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, squash); ctx.rotate(rotation); ctx.globalAlpha *= alpha;
  ctx.drawImage(astraNebulaTexture(), -radius, -radius, radius * 2, radius * 2); ctx.restore();
}
function astraVfxTexture(kind) {
  if (astraVfxTextures.has(kind)) return astraVfxTextures.get(kind);
  const image = document.createElement("canvas"); image.width = image.height = 256;
  const c = image.getContext("2d"), gold = kind === "gold", cloud = kind === "cloud";
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, cloud ? "rgba(129,104,241,.28)" : "rgba(232,252,255,.96)");
  g.addColorStop(.09, gold ? "rgba(255,232,165,.88)" : "rgba(141,239,255,.85)");
  g.addColorStop(.3, gold ? "rgba(240,151,65,.25)" : "rgba(48,111,235,.26)");
  g.addColorStop(.65, "rgba(76,55,182,.07)"); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  if (cloud) {
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 44; i++) {
      const a = i * 2.39996, r = 15 + i * 1.9, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
      const mist = c.createRadialGradient(x, y, 1, x, y, 16 + i % 21);
      mist.addColorStop(0, i % 3 ? "rgba(56,82,159,.12)" : "rgba(113,77,185,.15)"); mist.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = mist; c.fillRect(x - 40, y - 40, 80, 80);
    }
  }
  astraVfxTextures.set(kind, image); return image;
}
function astraGlow(x, y, r, alpha = 1, kind = "blue") {
  if (r <= 0 || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(astraVfxTexture(kind), x - r, y - r, r * 2, r * 2); ctx.restore();
}
function astraDiamond(x, y, size, angle, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(0, size * .38); ctx.lineTo(-size, 0); ctx.lineTo(0, -size * .38); ctx.closePath(); ctx.fill(); ctx.restore();
}
function astraStarFace(c,r) {
  c.lineJoin = "round";
  const face = c.createLinearGradient(-r, -r, r, r);
  face.addColorStop(0, "#edfeff"); face.addColorStop(.32, "#8ae9ff"); face.addColorStop(.54, "#3685d0"); face.addColorStop(1, "#263983");
  c.fillStyle = face; c.strokeStyle = "#a9eefe"; c.lineWidth = 1.1;
  c.beginPath();
  for (let n = 0; n < 16; n++) { const t = n * Math.PI / 8, length = n % 2 ? r * .24 : r * (n % 4 ? .59 : 1); const px = Math.cos(t) * length, py = Math.sin(t) * length; n ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(231,247,255,.72)"; c.lineWidth = .65;
  for (let n = 0; n < 4; n++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(r, 0); c.lineTo(r * .23, r * .14); c.stroke(); }
  c.strokeStyle = "#e6c68c"; c.lineWidth = 1.25; c.beginPath(); c.ellipse(0, 0, r * .74, r * .28, -.65, 0, ASTRA_TAU); c.stroke();
  c.save();c.rotate(Math.PI/4);c.fillStyle="#fffbea";const size=r*.3;
  c.beginPath();c.moveTo(size,0);c.lineTo(0,size*.38);c.lineTo(-size,0);c.lineTo(0,-size*.38);c.closePath();c.fill();c.restore();
}
function astraStarFaceTexture(r) {
  const key="star:"+r;
  if(astraVfxTextures.has(key))return astraVfxTextures.get(key);
  const image=document.createElement("canvas"),extent=r+3,resolution=4;
  image.width=image.height=extent*2*resolution;
  const c=image.getContext("2d");c.scale(resolution,resolution);c.translate(extent,extent);astraStarFace(c,r);
  astraVfxTextures.set(key,image);return image;
}
function astraStar(x, y, r, a = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
  // Keep the original glow and source-over face as separate compositing passes.
  astraGlow(0, 0, r * 3.4, .72);
  ctx.globalCompositeOperation = "source-over";ctx.rotate(a);
  // Fixed-size stars are baked at 4x resolution, with the identical face code.
  // Continuously expanding passive stars remain vectors; no size quantisation.
  if([10,12,16,18,22,24].includes(r)){
    const extent=r+3;ctx.drawImage(astraStarFaceTexture(r),-extent,-extent,extent*2,extent*2);
  }else astraStarFace(ctx,r);
  ctx.restore();
}
function astraRuneRing(x, y, r, rotation, alpha = .6) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha *= alpha;
  // Same lines, colours and widths, batched by material. Cache geometry rather
  // than redrawing 24 individual rotated ticks for every orbit/body each frame.
  // Integer radii are reused by the permanent orbit/HUD/wells. Continuously
  // changing X/capture radii use batched direct paths below, avoiding five new
  // Path2D objects and cache evictions every animation frame (no quantisation).
  if (typeof Path2D === "function" && Number.isInteger(r)) {
    let paths = astraRuneGeometry.get(r);
    if (!paths) {
      paths = Array.from({length: 5}, () => new Path2D());
      paths[0].arc(0, 0, r, 0, ASTRA_TAU); paths[1].arc(0, 0, r - 4, 0, ASTRA_TAU);
      for (let i = 0; i < 24; i++) {
        const major = i % 3 === 0, p = paths[major ? 2 : 3], { c, s } = astraRuneDirections[i];
        p.moveTo((r - (major ? 9 : 4)) * c, (r - (major ? 9 : 4)) * s); p.lineTo((r + (major ? 4 : 0)) * c, (r + (major ? 4 : 0)) * s);
        if (major) { p.moveTo((r-10)*c+3*s,(r-10)*s-3*c);p.lineTo((r-6)*c,(r-6)*s);p.lineTo((r-10)*c-3*s,(r-10)*s+3*c); }
      }
      for(let i=0;i<3;i++) {
        const { c, s }=astraRuneDirections[i*8],p=paths[4];
        p.moveTo((r+5)*c,(r+5)*s);p.lineTo(r*c-1.9*s,r*s+1.9*c);p.lineTo((r-5)*c,(r-5)*s);p.lineTo(r*c+1.9*s,r*s-1.9*c);p.closePath();
      }
      if (astraRuneGeometry.size >= 48) astraRuneGeometry.delete(astraRuneGeometry.keys().next().value);
      astraRuneGeometry.set(r, paths);
    }
    ctx.lineWidth=1;
    ["#d5b980","rgba(138,223,244,.45)","#f1d4a2","rgba(132,194,218,.58)"].forEach((color,i)=>{ctx.strokeStyle=color;ctx.stroke(paths[i]);});
    ctx.fillStyle="#f3dcab";ctx.fill(paths[4]);ctx.restore();return;
  }
  ctx.strokeStyle = "#d5b980"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.stroke();
  ctx.strokeStyle = "rgba(138,223,244,.45)"; ctx.beginPath(); ctx.arc(0, 0, r - 4, 0, ASTRA_TAU); ctx.stroke();
  for (const major of [true, false]) {
    ctx.strokeStyle = major ? "#f1d4a2" : "rgba(132,194,218,.58)"; ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      if ((i % 3 === 0) !== major) continue;
      const { c, s } = astraRuneDirections[i];
      ctx.moveTo((r - (major ? 9 : 4)) * c, (r - (major ? 9 : 4)) * s); ctx.lineTo((r + (major ? 4 : 0)) * c, (r + (major ? 4 : 0)) * s);
      if (major) { ctx.moveTo((r-10)*c+3*s,(r-10)*s-3*c);ctx.lineTo((r-6)*c,(r-6)*s);ctx.lineTo((r-10)*c-3*s,(r-10)*s+3*c); }
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#f3dcab"; ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const { c, s } = astraRuneDirections[i*8];
    ctx.moveTo((r+5)*c,(r+5)*s);ctx.lineTo(r*c-1.9*s,r*s+1.9*c);ctx.lineTo((r-5)*c,(r-5)*s);ctx.lineTo(r*c+1.9*s,r*s-1.9*c);ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}
function astraRibbon(trail, width, gold = false, alpha = 1) {
  if (!trail || trail.length < 2) return;
  const first = trail[0], last = trail[trail.length - 1];
  // Six outlines share the exact same normal/taper at each trail point.
  // Reuse buffers; avoid atan2 + sin + cos + two powers six times per point.
  const count=trail.length;
  let taper=astraRibbonTapers.get(count);
  if(!taper){taper=new Float64Array(count);for(let i=0;i<count;i++){const t=i/(count-1);taper[i]=Math.pow(t,1.3)*(1-.88*Math.pow(t,8))*.5;}astraRibbonTapers.set(count,taper);}
  if(!trail.ribbonNormals||trail.ribbonNormals.length<count*2)trail.ribbonNormals=new Float64Array(count*2);
  const normals=trail.ribbonNormals;
  for(let i=0;i<count;i++){
    const prev=trail[Math.max(0,i-1)],next=trail[Math.min(count-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,d=Math.hypot(dx,dy);
    normals[i*2]=(d?-dy/d:0)*taper[i];normals[i*2+1]=(d?dx/d:1)*taper[i];
  }
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (let layer = 0; layer < 3; layer++) {
    const w = width * [1.75, .7, .16][layer];
    const g = ctx.createLinearGradient(first.x, first.y, last.x + .01, last.y);
    g.addColorStop(0, "rgba(15,24,110,0)");
    g.addColorStop(.35, layer === 0 ? "rgba(56,71,200,.12)" : "rgba(78,171,237,.1)");
    g.addColorStop(1, layer === 0 ? "rgba(54,106,247,.23)" : (layer === 1 ? (gold ? "rgba(252,204,112,.64)" : "rgba(101,221,255,.7)") : "rgba(232,253,255,.95)"));
    ctx.fillStyle = g; ctx.beginPath();
    for (const side of [-1, 1]) for (let j = 0; j < trail.length; j++) {
      const i = side < 0 ? j : trail.length - 1 - j, p = trail[i];
      const x = p.x + normals[i*2] * w * side, y = p.y + normals[i*2+1] * w * side;
      if (side < 0 && j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = gold ? "rgba(255,220,150,.66)" : "rgba(171,232,255,.42)"; ctx.lineWidth = .8;
  ctx.beginPath(); for (let i = 0; i < trail.length; i++) { const p = trail[i], offset = Math.sin(i * .75 + astraFrame * .18) * width * .2 * i / trail.length; i ? ctx.lineTo(p.x, p.y + offset) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.restore();
}
function astraVisible(x, y, r) {
  return x + r >= camera.x && x - r <= camera.x + getCameraViewWidth() && y + r >= camera.y && y - r <= camera.y + getCameraViewHeight();
}

// Short high-resolution aurora veils follow each real star, rather than filling
// the entire orbit. Their head gap and tapered tail leave every star readable.
const astraAuroraTextureKeys = [];
function astraAuroraTexture(layer, span = .85) {
  const key = "aurora:" + layer + ":" + span.toFixed(5);
  if (astraVfxTextures.has(key)) return astraVfxTextures.get(key);
  const image = document.createElement("canvas"), radius = 220, steps = 96;
  image.width = 384; image.height = 320;
  const c = image.getContext("2d"); c.translate(248, 282);
  c.globalCompositeOperation = "lighter"; c.lineJoin = "round";
  const point = (t, ribbon, height) => {
    const envelope = Math.sin(t * Math.PI), a = -.115 - span * t;
    const fold = Math.sin(t * 11 + layer * 1.3 + ribbon) * 6 + Math.sin(t * 23 - ribbon) * 2;
    const veil = (9 + 28 * (.5 + .5 * Math.sin(t * 8 + ribbon + layer))) * envelope;
    const r = radius + envelope * (fold + ribbon * 3) + height * veil;
    return [Math.cos(a) * r - radius, Math.sin(a) * r];
  };
  const tail = point(1, 0, 0);
  for (let ribbon = 0; ribbon < 2; ribbon++) {
    for (let band = 11; band >= 0; band--) {
      const q = band / 12, next = (band + 1) / 12;
      const alpha = (1 - q) ** 1.1 * Math.sin((q + .12) / 1.12 * Math.PI) ** .65;
      const emission = c.createLinearGradient(0, 0, tail[0], tail[1]);
      const tint = layer ? "165,116,255" : "60,237,220";
      emission.addColorStop(0, `rgba(${tint},0)`);
      emission.addColorStop(.1, `rgba(${tint},${alpha * .24})`);
      emission.addColorStop(.34, `rgba(${tint},${alpha * .57})`);
      emission.addColorStop(.74, `rgba(${tint},${alpha * .19})`);
      emission.addColorStop(1, `rgba(${tint},0)`);
      c.fillStyle = emission; c.beginPath();
      for (let i = 0; i <= steps; i++) { const p = point(i / steps, ribbon, q); i ? c.lineTo(...p) : c.moveTo(...p); }
      for (let i = steps; i >= 0; i--) c.lineTo(...point(i / steps, ribbon, next));
      c.closePath(); c.fill();
    }
    for (let pass = 0; pass < 3; pass++) {
      const seam = c.createLinearGradient(0, 0, tail[0], tail[1]), alpha = [.12, .52, .85][pass];
      seam.addColorStop(0, "rgba(220,255,255,0)"); seam.addColorStop(.15, `rgba(164,238,255,${alpha})`);
      seam.addColorStop(.6, `rgba(148,183,255,${alpha * .46})`); seam.addColorStop(1, "rgba(155,163,255,0)");
      c.lineWidth = [8, 2.4, .8][pass]; c.strokeStyle = seam;
      c.beginPath();
      for (let i = 0; i <= steps; i++) { const p = point(i / steps, ribbon, 0); i ? c.lineTo(...p) : c.moveTo(...p); }
      c.stroke();
    }
  }
  for (let i = 1; i < 52; i++) {
    const t = i / 52, brightness = Math.sin(t * Math.PI) ** 1.3 * (.08 + (i % 4) * .04);
    c.strokeStyle = `rgba(196,246,255,${brightness})`; c.lineWidth = .65;
    c.beginPath(); c.moveTo(...point(t, 1, .04));
    c.quadraticCurveTo(...point(t + .008, 1, .4), ...point(t + .016, 1, .88)); c.stroke();
  }
  // At most three orbit-count shapes (two layers each), never one texture per
  // frame/radius. Reaching another star-count only bakes the new shape once.
  if (astraAuroraTextureKeys.length >= 6) astraVfxTextures.delete(astraAuroraTextureKeys.shift());
  astraAuroraTextureKeys.push(key); astraVfxTextures.set(key, image); return image;
}
function astraAuroraState() {
  const blend = Math.max(0, Math.min(1, player.astraOrbitBlend || 0));
  const unfold = astraEase(blend);
  return { alpha: unfold, radius: astraOrbitRadius(), unfold };
}
function drawAstraAurora() {
  const state = astraAuroraState(); if (state.alpha <= .001) return;
  const count = astraOrbitCount(), flights = astraQFlights(), span = Math.min(.85, ASTRA_TAU / count * .64);
  const texture0 = astraAuroraTexture(0, span), texture1 = astraAuroraTexture(1, span), size = state.radius / 220;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    if (flights.some(m => m.slot === i)) continue;
    const star = astraOrbitSlot(i, count);
    ctx.save(); ctx.translate(star.x, star.y); ctx.rotate(star.a); ctx.scale(size, size);
    const shimmer = .9 + Math.sin(astraFrame * .035 + i * 1.7) * .1;
    ctx.globalAlpha *= state.alpha * shimmer;
    ctx.drawImage(texture0, -248, -282, 384, 320);
    ctx.globalAlpha *= .62; ctx.drawImage(texture1, -248, -282, 384, 320); ctx.restore();
    // Two fading grains travel down the short wake, never across the star face.
    for (let j = 0; j < 2; j++) {
      const t = (astraFrame * .009 + i * .31 + j * .5) % 1, a = star.a - .115 - span * t;
      const r = state.radius + Math.sin(t * Math.PI) * 8;
      ctx.save(); ctx.globalAlpha *= state.alpha * Math.sin(t * Math.PI) ** 2 * .55;
      astraDiamond(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, 1.3 + j * .5, a, j ? "#c2b8ff" : "#c6fff4"); ctx.restore();
    }
  }
  ctx.restore();
}

function drawAstraAccretionReach(w, alpha) {
  const outer = w.pullR || w.r, inner = w.r;
  if (alpha <= 0 || outer <= inner) return;
  const age = w.maxLife - w.life;
  ctx.save(); const opacity = ctx.globalAlpha * alpha; ctx.globalAlpha = opacity; ctx.globalCompositeOperation = "lighter";
  // A thin atmospheric envelope marks suction, separately from the damaging core.
  // Path/particle counts are fixed even after thousands of stardust stacks.
  const haze = ctx.createRadialGradient(0, 0, inner * .7, 0, 0, outer);
  haze.addColorStop(0, "rgba(99,125,229,0)"); haze.addColorStop(.28, "rgba(70,102,196,.018)");
  haze.addColorStop(.82, "rgba(100,165,232,.027)"); haze.addColorStop(1, "rgba(80,144,230,0)");
  ctx.fillStyle = haze; ctx.beginPath(); ctx.arc(0, 0, outer, 0, ASTRA_TAU); ctx.fill();
  ctx.strokeStyle = "rgba(142,192,255,.2)"; ctx.lineWidth = .9;
  ctx.beginPath(); ctx.arc(0, 0, outer, 0, ASTRA_TAU); ctx.stroke();
  const armGeometry = astraSpiralGeometry(inner / outer);
  for (let arm = 0; arm < 8; arm++) {
    const start = arm * ASTRA_TAU / 8 + w.phase * .12;
    ctx.strokeStyle = arm % 3 ? "rgba(127,181,255,.12)" : "rgba(224,206,172,.14)";
    ctx.save(); ctx.rotate(start); ctx.scale(outer, outer); ctx.lineWidth = .7 / outer;
    astraStrokeSpiral(armGeometry); ctx.restore();
    // Small orbit fragments at the outer boundary make its shape readable.
    ctx.strokeStyle = "rgba(160,208,255,.32)"; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.arc(0, 0, outer, start, start + .055); ctx.stroke();
  }
  for (let n = 0; n < 24; n++) {
    const travel = (n * .6180339 + age * .005) % 1, q = 1 - travel;
    const rr = inner * .58 + (outer - inner * .58) * q ** .78, a = n * 2.39996 + travel * travel * 2.15 + w.phase * .12;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr, fade = Math.sin(travel * Math.PI);
    ctx.globalAlpha = opacity * fade;
    ctx.strokeStyle = n % 5 ? "rgba(150,205,255,.47)" : "rgba(255,224,168,.58)"; ctx.lineWidth = .85;
    const tail = Math.min(11, 3 + travel * 8), tx = Math.cos(a - .24) * tail, ty = Math.sin(a - .24) * tail;
    ctx.beginPath(); ctx.moveTo(x + tx, y + ty); ctx.lineTo(x, y); ctx.stroke();
    astraDiamond(x, y, 1 + n % 3 * .45, a, n % 5 ? "#b2d9ff" : "#ffe8b8");
  }
  ctx.restore();
}

// A single high-resolution emission sheet contains three curved, tapered energy
// filaments and their soft volume. It is reused by every absorbed object, with
// no per-object gradient/blur allocation and no permanent particle emitter.
function astraSuctionWakeTexture() {
  const key = "suction-wake";
  if (astraVfxTextures.has(key)) return astraVfxTextures.get(key);
  const image = document.createElement("canvas"); image.width = 384; image.height = 192;
  const c = image.getContext("2d"); c.globalCompositeOperation = "lighter";
  const steps = 80;
  for (const strand of [0, -1, 1]) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, bend = Math.sin(t * Math.PI) * 17 * strand;
      const slope = (-140 * t + Math.cos(t * Math.PI) * Math.PI * 17 * strand) / 264;
      const normal = 1 / Math.hypot(1, slope);
      points.push({ x: 48 + t * 264, y: 128 - 70 * t * t + bend,
        nx: -slope * normal, ny: normal, taper: Math.sin(t * Math.PI) ** .72 * (1 - t * .67) });
    }
    for (let layer = 0; layer < 3; layer++) {
      const width = (strand ? [9, 3.2, .85] : [27, 12, 3.2])[layer];
      const material = c.createLinearGradient(48, 128, 312, 58);
      const peak = (strand ? [.13, .45, .7] : [.17, .6, .96])[layer];
      material.addColorStop(0, `rgba(225,254,255,${peak * .45})`);
      material.addColorStop(.14, `rgba(179,248,255,${peak})`);
      material.addColorStop(.46, `rgba(${strand < 0 ? "185,154,255" : "92,187,255"},${peak * .64})`);
      material.addColorStop(.8, `rgba(129,109,249,${peak * .16})`);
      material.addColorStop(1, "rgba(101,93,219,0)");
      c.fillStyle = material; c.beginPath();
      for (const side of [-1, 1]) for (let j = 0; j <= steps; j++) {
        const i = side < 0 ? j : steps - j, p = points[i], offset = side * p.taper * width * .5;
        const x = p.x + p.nx * offset, y = p.y + p.ny * offset;
        if (side < 0 && j === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fill();
    }
  }
  astraVfxTextures.set(key, image); return image;
}
function drawAstraSuctionWake(x, y, cx, cy, size, phase, alpha) {
  const distance = Math.hypot(x - cx, y - cy);
  if (distance < 3 || alpha <= 0) return;
  const angle = Math.atan2(y - cy, x - cx), length = Math.min(104, Math.max(44, size * 3), distance * .7);
  const scale = length / 264;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  ctx.drawImage(astraSuctionWakeTexture(), -48, -128, 384, 192);
  // A pair of tiny light packets accelerates down the curve toward the object.
  // The distance-based length cap prevents enormous spirals at high stardust.
  for (let n = 0; n < 2; n++) {
    const t = 1 - (phase * .2 + n * .5) % 1, fade = Math.sin(t * Math.PI) ** 2;
    ctx.save(); ctx.globalAlpha *= fade * .65;
    astraDiamond(t * 264, -70 * t * t, 4 + n * 1.2, -.4 * t, n ? "#e2ccff" : "#d5ffff"); ctx.restore();
  }
  ctx.restore();
}
function drawAstraSuctionTargets(w) {
  if (!astraWellPulling(w)) return;
  let count = 0;
  for (const z of zombies) {
    if (z.hp <= 0 || z.astraControl || z.isBossMinion) continue;
    const d = Math.hypot(z.x-w.x,z.y-w.y);
    if (d < 12 || d > w.pullR + z.r || !astraVisible(z.x,z.y,60)) continue;
    drawAstraSuctionWake(z.x,z.y,w.x,w.y,z.r,w.phase,.5);
    if (++count >= 18) break;
  }
}
function drawAstraAbsorbedMissileWakes() {
  if (typeof raidBossProjectiles === "undefined") return;
  let count = 0;
  for (const p of raidBossProjectiles) {
    const a = p.astraAbsorb;
    if (!a || p.life <= 0 || !astraVisible(p.x,p.y,60)) continue;
    drawAstraSuctionWake(p.x,p.y,a.wellX,a.wellY,Math.max(8,p.r),a.age*.1,1-a.age/60);
    if (++count >= 24) break;
  }
}
function drawAstraWell(w) {
  const age = w.maxLife - w.life, appear = astraEase(age / 24), close = astraEase(w.life / 28), scale = appear * (.15 + close * .85), r = w.r * scale;
  if (r < 1) return;
  ctx.save(); ctx.translate(w.x, w.y);
  drawAstraAccretionReach(w, appear * close);
  ctx.globalCompositeOperation = "source-over";
  const shade = ctx.createRadialGradient(0, 0, r * .04, 0, 0, r);
  shade.addColorStop(0, "rgba(1,3,16,.92)"); shade.addColorStop(.25, "rgba(7,8,33,.8)"); shade.addColorStop(.64, "rgba(22,14,58,.22)"); shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  ctx.save(); ctx.rotate(w.phase * .17); ctx.scale(1, .78); astraGlow(0, 0, r * 1.34, .5, "cloud"); ctx.restore();
  astraNebula(0, 0, r * 1.15, w.phase * .22, .9);
  astraNebula(0, 0, r * .86, -.3 - w.phase * .32, .55, .67);
  // Fine boundary remains at the true damage radius while the core contracts.
  astraRuneRing(0, 0, w.r, -.05 * w.phase, .23 * appear);
  ctx.save(); ctx.scale(1, .68); ctx.rotate(-.2);
  const wellArm = astraSpiralGeometry();
  for (let arm = 0; arm < 7; arm++) {
    const offset = arm * ASTRA_TAU / 7 + w.phase;
    ctx.save(); ctx.rotate(offset); ctx.scale(r, r);
    for (let layer = 0; layer < 2; layer++) {
      ctx.strokeStyle = layer ? "rgba(168,222,255,.29)" : "rgba(89,70,226,.12)"; ctx.lineWidth = (layer ? .85 : 12) / r;
      astraStrokeSpiral(wellArm);
    }
    ctx.restore();
  }
  ctx.restore();
  // The accretion disc crosses behind a dark lens, with a thin, bright foreground lip.
  ctx.strokeStyle = "rgba(253,217,141,.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * .56, r * .17, -.28, Math.PI, ASTRA_TAU); ctx.stroke();
  ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#040717";
  ctx.beginPath(); ctx.arc(0, 0, r * .16, 0, ASTRA_TAU); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(201,197,255,.93)"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, r * .17, 0, ASTRA_TAU); ctx.stroke();
  // Split cyan/violet arcs suggest light bending around the event horizon.
  for(let i=0;i<3;i++){
    const a=w.phase*.4+i*ASTRA_TAU/3;
    ctx.strokeStyle=i===1?"rgba(200,158,255,.62)":"rgba(163,241,255,.68)";ctx.lineWidth=.8;
    ctx.beginPath();ctx.ellipse(0,-r*.008,r*(.205+i*.006),r*.185,-.28,a,a+1.35);ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,218,163,.92)"; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * .56, r * .17, -.28, 0, Math.PI); ctx.stroke();
  // Short, tapered accretion fragments move faster near the singularity.
  for (let n = 0; n < 38; n++) {
    const a = n * 2.39996 + w.phase * (1.2 + n % 3 * .2), rr = r * (.19 + (n % 6) * .023);
    ctx.strokeStyle = n % 4 ? "rgba(163,197,255,.65)" : "rgba(255,232,182,.8)"; ctx.lineWidth = .6 + n % 3 * .6;
    ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * .53, -.28, a, a + .08 + (n % 4) * .02); ctx.stroke();
  }
  for (let n = 0; n < 26; n++) {
    const q = ((n * .618 + age * .008) % 1), rr = r * (1 - q) * .92, a = n * 2.399 + q * 5.7 + w.phase * .35;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr * .68, size = 1 + (n % 4) * .6;
    astraDiamond(x, y, size, a, n % 3 ? "rgba(118,191,255,.75)" : "rgba(255,220,164,.87)");
  }
  if (w.life < 30) { astraGlow(0, 0, 25 + (1 - close) * 60, 1 - close, "gold"); }
  ctx.restore();
}

function astraGrowthStage() {
  const dust = player.astraStardust || 0;
  return dust >= 300 ? 3 : dust >= 150 ? 2 : dust >= 50 ? 1 : 0;
}
function drawAstraGrowth(front = false) {
  const stage = astraGrowthStage(); if (!stage) return;
  const t = astraFrame * .025, x = player.x, y = player.y;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  if (!front) {
    // One bounded wake, not an ever-growing particle emitter.
    if (astraWake.length > 1) astraRibbon(astraWake, 18 + stage * 5, false, .38);
    if (stage >= 2) {
      ctx.save(); ctx.translate(x, y - 16); ctx.rotate(-.18);
      astraRuneRing(0, 0, 55, t * .16, .45);
      ctx.strokeStyle = "rgba(151,218,255,.4)"; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.ellipse(0, 0, 66, 22, t * .07, 0, ASTRA_TAU); ctx.stroke(); ctx.restore();
    }
    if (stage >= 3) astraNebula(x, y + 18, 65, t * .1, .24, .58);
  } else {
    for (let i = 0; i < 6 + stage * 2; i++) {
      const a = i * 2.399 + t * .35, r = 24 + i % 4 * 8;
      const alpha = .22 + .38 * Math.sin(t + i) ** 2;
      ctx.globalAlpha = alpha;
      astraDiamond(x + Math.cos(a) * r, y - 25 + Math.sin(a) * r * .6, 1.6 + i % 3, a, i % 3 ? "#b3eaff" : "#ffe5ac");
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
const astraConstellationGeometryCache = new WeakMap();
function astraConstellationGeometry(definition) {
  if (astraConstellationGeometryCache.has(definition)) return astraConstellationGeometryCache.get(definition);
  const points = definition.points, edges = definition.edges;
  const segments = new Float64Array(edges.length * 6), reveal = new Float64Array(points.length).fill(Infinity);
  const degree = new Uint8Array(points.length), path = typeof Path2D === "function" ? new Path2D() : null;
  let length = 0, top = 0, right = 0;
  for (let i = 0; i < points.length; i++) { top = Math.min(top, points[i].y); right = Math.max(right, points[i].x); }
  for (let i = 0; i < edges.length; i++) {
    const [from, to] = edges[i], a = points[from], b = points[to], n = i * 6;
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    segments.set([a.x, a.y, b.x, b.y, length, span], n);
    reveal[from] = Math.min(reveal[from], length); reveal[to] = Math.min(reveal[to], length + span);
    degree[from]++; degree[to]++;
    // Real sky charts are graphs, not polygons: each edge must start its own
    // subpath. Never join two branches, or close an open chain implicitly.
    if (path) { path.moveTo(a.x, a.y); path.lineTo(b.x, b.y); }
    length += span;
  }
  const geometry = { segments, reveal, degree, path, length, top, right };
  astraConstellationGeometryCache.set(definition, geometry);
  return geometry;
}
function astraTraceConstellation(geometry, distance) {
  if (distance >= geometry.length && geometry.path) { ctx.stroke(geometry.path); return; }
  ctx.beginPath();
  const segments = geometry.segments;
  for (let n = 0; n < segments.length; n += 6) {
    const span = segments[n + 5], remaining = distance - segments[n + 4];
    if (remaining <= 0) break;
    const q = span > 0 ? Math.min(1, remaining / span) : 1;
    const x = segments[n], y = segments[n + 1];
    ctx.moveTo(x, y); ctx.lineTo(x + (segments[n + 2] - x) * q, y + (segments[n + 3] - y) * q);
  }
  ctx.stroke();
}
function drawAstraConstellation(g) {
  const formation = g.constellationProgress || 0;
  const fade = astraEase(g.age / 42) * (g.state === "launch" ? Math.max(0, 1 - g.launchAge / 24) : 1);
  if (fade <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha *= fade;
  const orbitAlpha = 1 - astraEase(formation / .62);
  if (orbitAlpha > 0) {
    const bodies = g.bodies.filter(b => b.state === "orbit"), stride = Math.max(1, Math.ceil(bodies.length / 24));
    if (bodies.length > 1) {
      ctx.save(); ctx.globalAlpha *= orbitAlpha;
      ctx.strokeStyle = "rgba(148,209,255,.3)"; ctx.lineWidth = .8; ctx.beginPath();
      for (let i = 0; i < bodies.length; i += stride) {
        const b = bodies[i], next = bodies[(i + stride) % bodies.length];
        ctx.moveTo(b.x, b.y); ctx.lineTo(next.x, next.y);
        if (i % (stride * 3) === 0) { ctx.moveTo(g.x, g.y - 38); ctx.lineTo(b.x, b.y); }
      }
      ctx.stroke();
      for (let i = 0; i < bodies.length; i += stride) {
        const b = bodies[i]; astraDiamond(b.x, b.y, 4, astraFrame * .01, "#fff0c2");
      }
      ctx.restore();
    }
  }
  if (formation > 0 && g.constellation) {
    const definition = g.constellation, geometry = astraConstellationGeometry(definition);
    const trace = Math.min(1, formation * 1.2), distance = trace * geometry.length;
    const phone = typeof isMobileTouchDevice === "function" && isMobileTouchDevice() && typeof canvas !== "undefined" && canvas.height < 520;
    const viewScale = typeof getWorldViewScale === "function" ? Math.max(.1, getWorldViewScale()) : 1;
    ctx.translate(g.x, g.y - 38);
    // All three full-resolution glow passes share cached geometry. Their cost
    // depends only on the sky chart, never on the number of captured enemies.
    for (let layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = ["rgba(123,99,248,.14)", "rgba(116,217,255,.45)", "rgba(225,250,255,.94)"][layer];
      // A phone's wider world view must not shrink the bright core below a
      // readable pixel. Keep the original three layers and full geometry.
      ctx.lineWidth = phone ? Math.max([8, 2.5, .85][layer], [3.2, 1.15, .75][layer] / viewScale) : [8, 2.5, .85][layer];
      astraTraceConstellation(geometry, distance);
    }
    const alpha = ctx.globalAlpha;
    for (let i = 0; i < definition.points.length; i++) {
      const illumination = trace >= 1 ? 1 : astraEase((distance - geometry.reveal[i]) / Math.max(1, geometry.length * .08) + .5);
      if (illumination <= 0) continue;
      const p = definition.points[i], major = geometry.degree[i] >= 3;
      ctx.globalAlpha = alpha * formation * illumination;
      astraGlow(p.x, p.y, major ? 24 : 18, major ? .4 : .26, major ? "gold" : "blue");
      astraDiamond(p.x, p.y, major ? 7 : 4.5, Math.PI / 2, major ? "#fff0c8" : "#d9f5ff");
    }
    if (formation > .7) {
      ctx.globalAlpha = alpha * astraEase((formation - .7) / .3);
      ctx.strokeStyle = "rgba(200,216,255,.3)"; ctx.lineWidth = .75;
      ctx.beginPath(); ctx.arc(0, 0, 232, 0, ASTRA_TAU); ctx.stroke();
    }
  }
  ctx.restore();
}
function drawAstraGravityField(g) {
  const appear = astraEase(g.age / ASTRA_R_LIFT), fade = g.state === "launch" ? Math.max(0, 1 - g.launchAge / 30) : 1;
  if (fade <= 0) return;
  ctx.save(); ctx.translate(g.x, g.y - 38); ctx.globalAlpha = appear * fade;
  ctx.globalCompositeOperation = "source-over";
  const shade = ctx.createRadialGradient(0, 0, 40, 0, 0, 280);
  shade.addColorStop(0, "rgba(3,7,25,0)"); shade.addColorStop(.65, "rgba(15,14,48,.13)"); shade.addColorStop(.85, "rgba(7,13,32,.24)"); shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(0, 0, 280, 0, ASTRA_TAU); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  astraNebula(0, 0, 275, astraFrame * .003, .22, .9);
  const expand = 1 + (player.astraOrbitBlend || 0) * .32;
  for (let ring = 0; ring < 3; ring++) {
    const r = (125 + ring * 51) * expand;
    ctx.save(); ctx.rotate(ring * Math.PI / 3); ctx.scale(1, .57);
    ctx.strokeStyle = "rgba(70,98,236,.13)"; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.stroke();
    astraRuneRing(0, 0, r, astraFrame * .004 * (ring === 1 ? -1 : 1), .5);
    ctx.strokeStyle = ring === 1 ? "rgba(175,141,255,.77)" : "rgba(123,223,252,.8)"; ctx.lineWidth = 2;
    const start = astraFrame * .027 * (ring === 1 ? -1 : 1); ctx.beginPath(); ctx.arc(0, 0, r + 3, start, start + .8); ctx.stroke(); ctx.restore();
  }
  // Sparse drifting grains define a volume without covering enemies or warnings.
  for (let n = 0; n < 30; n++) {
    const a = n * 2.399 + astraFrame * .006, rr = 90 + n % 7 * 23, y = Math.sin(a) * rr * .74;
    ctx.globalAlpha = appear * fade * (.2 + .3 * Math.sin(n + astraFrame * .04) ** 2);
    astraDiamond(Math.cos(a) * rr, y, 1 + n % 3, a, n % 4 ? "#b5daff" : "#f5d7a3");
  }
  ctx.restore();
}
function drawAstraEffects() {
  if (selectedCharacter !== "astra") return;
  prepareAstraVfx();
  worldStart(); ctx.save(); ctx.lineCap = "round";
  drawAstraGrowth(false);
  drawAstraAurora();
  for (const w of astraWells) if (astraVisible(w.x, w.y, Math.max(w.r * 1.3, w.pullR || 0))) {
    drawAstraWell(w); drawAstraSuctionTargets(w);
  }
  drawAstraAbsorbedMissileWakes();
  ctx.globalCompositeOperation = "lighter";
  const radius = astraOrbitRadius();
  const launchStars=astraQFlights().filter(m=>m.age<14&&!m.returning);
  if(launchStars.length>1){
    ctx.save();ctx.globalAlpha=(1-launchStars[0].age/14)*.55;ctx.strokeStyle="#c6ebff";ctx.lineWidth=.9;ctx.beginPath();
    launchStars.forEach((m,i)=>i?ctx.lineTo(m.x,m.y):ctx.moveTo(m.x,m.y));ctx.closePath();ctx.stroke();ctx.restore();
  }
  astraRuneRing(player.x, player.y, radius, (player.astraOrbitAngle || 0) * .18, .2 + (player.astraOrbitBlend || 0) * .22);
  if (astraGravity) {
    drawAstraGravityField(astraGravity);
    drawAstraConstellation(astraGravity);
    ctx.globalCompositeOperation = "source-over";
    for (const b of astraGravity.bodies) if (b.state !== "done" && b.zombie) {
      ctx.fillStyle = "rgba(2,5,15,.24)"; ctx.beginPath(); ctx.ellipse(b.x, b.y + b.lift + 13, b.r * .9, b.r * .25, 0, 0, ASTRA_TAU); ctx.fill();
    }
  }
  ctx.restore(); worldEnd();
}
function drawAstraCapturedBody(b, detail = true) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  if (detail) astraRibbon(b.trail, b.state === "flight" ? 40 : 13, false, b.state === "flight" ? .95 : .4);
  if (!b.zombie || b.zombie.hp <= 0) astraStar(b.x, b.y, b.state === "flight" ? 24 : 18, b.a);
  else {
    if (detail) astraGlow(b.x, b.y, b.r * 2.9, b.state === "flight" ? .65 : .32);
    ctx.globalCompositeOperation = "source-over"; ctx.save(); ctx.translate(b.x, b.y);
    ctx.rotate(b.state === "flight" ? b.a + Math.PI / 2 : Math.sin(b.a) * .32);
    const size = b.r * (b.zombie.boss ? 2.75 : 3.05);
    if (zombieSpriteAtlas.complete && zombieSpriteAtlas.naturalWidth) {
      const sw = zombieSpriteAtlas.naturalWidth / 2, sh = zombieSpriteAtlas.naturalHeight;
      ctx.drawImage(zombieSpriteAtlas, b.zombie.boss ? sw : 0, 0, sw, sh, -size / 2, -size * .57, size, size);
    } else { ctx.fillStyle = "#668ca0"; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, ASTRA_TAU); ctx.fill(); }
    ctx.restore(); ctx.globalCompositeOperation = "lighter";
    if (detail) {
      ctx.strokeStyle = "rgba(165,219,255,.55)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r + 9, b.r * .55, b.a, 0, ASTRA_TAU); ctx.stroke();
      if (b.state === "flight") astraStar(b.x + Math.cos(b.a) * (b.r + 4), b.y + Math.sin(b.a) * (b.r + 4), 10, b.a);
    }
  }
  ctx.restore();
}
function drawAstraBurst(e) {
  const p = 1 - e.life / e.maxLife, fade = (1 - p) ** 1.5;
  if (e.type === "wellBorn") return;
  if (e.type === "capture") {
    const r = e.r * astraEase(p); ctx.strokeStyle = `rgba(149,191,255,${fade * .32})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, ASTRA_TAU); ctx.stroke();
    if (r > 12) {
      astraRuneRing(e.x, e.y, r, p * .2, fade * .4);
      for (let plane=0;plane<3;plane++) {
        ctx.save();ctx.translate(e.x,e.y);ctx.rotate(-.35+plane*Math.PI/3);ctx.scale(1,.42);
        astraRuneRing(0,0,r*(.92-plane*.09),-p*.3,fade*.28);ctx.restore();
      }
    }
    return;
  }
  const big = e.type === "impact" || e.type === "collapse", r = e.r * (1 - (1 - p) ** 3);
  ctx.save(); ctx.translate(e.x, e.y);
  if(e.type==="catch"){
    ctx.strokeStyle=`rgba(160,225,255,${fade*.6})`;ctx.lineWidth=.8;
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,r*(1+i*.28),0,ASTRA_TAU);ctx.stroke();}
  }
  astraGlow(0, 0, e.r * (big ? 1.15 : .9), Math.max(0, 1 - p * 3), "blue");
  astraGlow(0, 0, e.r * .42, Math.max(0, 1 - p * 4), "gold");
  if (big) {
    // Staggered expanding fronts read as several impacts, not a single thick ring.
    for (let wave=0;wave<3;wave++) {
      const q=Math.max(0,Math.min(1,(p-wave*.095)/(1-wave*.095)));
      if(q<=0)continue;
      const rr=e.r*(1-(1-q)**3)*(1+wave*.1), opacity=(1-q)**2;
      ctx.strokeStyle=wave===1?`rgba(223,194,255,${opacity*.5})`:`rgba(158,231,255,${opacity*.65})`;
      ctx.lineWidth=1.3-wave*.2;ctx.beginPath();ctx.arc(0,0,rr,0,ASTRA_TAU);ctx.stroke();
    }
    ctx.save(); ctx.rotate(e.seed + p * .25); ctx.scale(1, .78); astraGlow(0, 0, r * 1.4, fade * .72, "cloud"); ctx.restore();
    astraNebula(0, 0, r * 1.48, e.seed + p * .6, fade * .85, .85);
    ctx.strokeStyle = `rgba(76,107,225,${fade * .19})`; ctx.lineWidth = 14 * (1 - p) + 1;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(188,237,255,${fade * .8})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(227,199,149,${fade * .65})`; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.18, r * .48, -.25, 0, ASTRA_TAU); ctx.stroke();
    for (let n = 0; n < 11; n++) {
      const a = n * 2.399 + e.seed, rr = r * (.45 + (n % 4) * .14);
      astraDiamond(Math.cos(a) * rr, Math.sin(a) * rr, (4 + n % 5) * fade, a, `rgba(187,232,255,${fade})`);
    }
  } else {
    ctx.strokeStyle = `rgba(246,219,164,${fade * .8})`; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, r), Math.max(1, r * .4), e.seed, 0, ASTRA_TAU); ctx.stroke();
    astraDiamond(0, 0, (18 + p * 20) * fade, e.seed, `rgba(215,244,255,${fade})`);
  }
  ctx.restore();
}
function drawAstraForeground() {
  if (selectedCharacter !== "astra") return;
  worldStart(); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
  drawAstraGrowth(true);
  const deployed = new Set(astraQFlights().map(m => m.slot));
  for (let n = 0; n < astraOrbitCount(); n++) if (!deployed.has(n)) {
    const p = astraOrbitSlot(n); astraStar(p.x, p.y, 12 + (player.astraOrbitBlend || 0) * 4, p.a * .4);
    if (astraGrowthStage() >= 2) {
      ctx.strokeStyle = "rgba(141,208,255,.32)"; ctx.lineWidth = 1.2;
      ctx.beginPath();ctx.arc(player.x,player.y,astraOrbitRadius(),p.a-.36,p.a-.05);ctx.stroke();
      const next = astraOrbitSlot((n + 1) % astraOrbitCount());
      if (!deployed.has((n + 1) % astraOrbitCount())) {
        ctx.strokeStyle="rgba(188,195,255,.14)";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(next.x,next.y);ctx.stroke();
      }
    }
  }
  for (const m of astraMeteors) if (astraVisible(m.x, m.y, 350)) {
    astraRibbon(m.trail, m.kind === "orbit" ? m.r * 1.75 : 12, m.returning);
    astraStar(m.x, m.y, m.r, m.a + astraFrame * .06);
    if (m.kind === "orbit") {
      if (!m.returning && m.age < 12) {
        const flare = 1-m.age/12;
        astraGlow(m.x,m.y,65,flare*.7);
        astraDiamond(m.x,m.y,38*flare,m.a,"rgba(227,252,255,.85)");
        astraDiamond(m.x,m.y,22*flare,m.a+Math.PI/2,"rgba(255,232,188,.7)");
      }
      // Counter-rotating fine filaments wrap the comet head, rather than a flat glow.
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a); ctx.strokeStyle = "rgba(243,220,167,.72)"; ctx.lineWidth = .9;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(10, side * 3); ctx.bezierCurveTo(-12, side * 24, -35, side * 18, -70, side * 4); ctx.stroke(); } ctx.restore();
    }
  }
  if (astraGravity) {
    const stride = Math.max(1, Math.ceil(astraGravity.bodies.length / 48));
    for (const b of astraGravity.bodies) if (b.state !== "done" && astraVisible(b.x, b.y, 220)) drawAstraCapturedBody(b, b.index % stride === 0);
  }
  for (const e of astraEffects) if (astraVisible(e.x, e.y, e.r * 1.5)) drawAstraBurst(e);
  for (const p of astraDust) if (astraVisible(p.x, p.y, 10)) {
    const alpha = Math.min(1, p.life / 20); ctx.strokeStyle = p.gold ? `rgba(248,214,157,${alpha})` : `rgba(160,220,255,${alpha})`;
    ctx.lineWidth = p.size * .55; ctx.beginPath(); ctx.moveTo(p.px - p.vx * 1.5, p.py - p.vy * 1.5); ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  ctx.restore(); worldEnd();
  // Tiny aiming cue/countdown; no cinematic bars, opaque screen flash or camera lock.
  if (astraGravity?.state === "orbit") {
    const g = astraGravity, scale = getWorldViewScale(), x = (player.x - camera.x) * scale, y = (player.y - camera.y) * scale;
    ctx.save(); ctx.translate(x, y); const a = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
    ctx.rotate(a); ctx.strokeStyle = "rgba(233,218,168,.85)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(39, -5); ctx.lineTo(48, 0); ctx.lineTo(39, 5); ctx.stroke(); ctx.rotate(-a);
    ctx.font = "bold 11px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "#e4ebff";
    ctx.fillText(`${Math.max(0, (ASTRA_R_DURATION - g.age) / 60).toFixed(1)}s`, 0, -54 * scale); ctx.restore();
  }
}
