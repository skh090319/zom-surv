// Hand-built celestial VFX. Baked glow/cloud textures avoid per-particle blur.
const astraVfxTextures = new Map();
const ASTRA_TAU = Math.PI * 2;
let astraVfxWarmupScheduled = false;
function drawAstraUltimateBackdrop() {
  const alpha = astraBackdropOpacity();
  if (alpha <= 0 || !astraUltimateBackdrop.complete || !astraUltimateBackdrop.naturalWidth || !astraUltimateBackdrop.naturalHeight) return;
  // Screen-space cover preserves the panorama's aspect ratio on phones/tablets.
  // Draw only in the background pass: hazards, enemies and HUD stay on top.
  const scale = Math.max(canvas.width / astraUltimateBackdrop.naturalWidth, canvas.height / astraUltimateBackdrop.naturalHeight);
  const w = astraUltimateBackdrop.naturalWidth * scale, h = astraUltimateBackdrop.naturalHeight * scale;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha;
  ctx.drawImage(astraUltimateBackdrop, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  ctx.restore();
}
function prepareAstraVfx() {
  if (astraVfxWarmupScheduled) return;
  astraVfxWarmupScheduled = true;
  const bake = () => { astraNebulaTexture(); astraVfxTexture("blue"); astraVfxTexture("gold"); astraVfxTexture("cloud"); };
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
function astraStar(x, y, r, a = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
  astraGlow(0, 0, r * 3.4, .72);
  ctx.globalCompositeOperation = "source-over";
  ctx.rotate(a); ctx.lineJoin = "round";
  const face = ctx.createLinearGradient(-r, -r, r, r);
  face.addColorStop(0, "#edfeff"); face.addColorStop(.32, "#8ae9ff"); face.addColorStop(.54, "#3685d0"); face.addColorStop(1, "#263983");
  ctx.fillStyle = face; ctx.strokeStyle = "#a9eefe"; ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let n = 0; n < 16; n++) { const t = n * Math.PI / 8, length = n % 2 ? r * .24 : r * (n % 4 ? .59 : 1); const px = Math.cos(t) * length, py = Math.sin(t) * length; n ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(231,247,255,.72)"; ctx.lineWidth = .65;
  for (let n = 0; n < 4; n++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r, 0); ctx.lineTo(r * .23, r * .14); ctx.stroke(); }
  ctx.strokeStyle = "#e6c68c"; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.ellipse(0, 0, r * .74, r * .28, -.65, 0, ASTRA_TAU); ctx.stroke();
  astraDiamond(0, 0, r * .3, Math.PI / 4, "#fffbea"); ctx.restore();
}
function astraRuneRing(x, y, r, rotation, alpha = .6) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha *= alpha;
  ctx.strokeStyle = "#d5b980"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, ASTRA_TAU); ctx.stroke();
  ctx.strokeStyle = "rgba(138,223,244,.45)"; ctx.beginPath(); ctx.arc(0, 0, r - 4, 0, ASTRA_TAU); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, major = i % 3 === 0;
    ctx.save(); ctx.rotate(a); ctx.strokeStyle = major ? "#f1d4a2" : "rgba(132,194,218,.58)";
    ctx.beginPath(); ctx.moveTo(r - (major ? 9 : 4), 0); ctx.lineTo(r + (major ? 4 : 0), 0); ctx.stroke();
    if (major) { ctx.beginPath(); ctx.moveTo(r - 10, -3); ctx.lineTo(r - 6, 0); ctx.lineTo(r - 10, 3); ctx.stroke(); }
    ctx.restore();
  }
  for (let i = 0; i < 3; i++) { const a = i * ASTRA_TAU / 3; astraDiamond(Math.cos(a) * r, Math.sin(a) * r, 5, a, "#f3dcab"); }
  ctx.restore();
}
function astraRibbon(trail, width, gold = false, alpha = 1) {
  if (!trail || trail.length < 2) return;
  const first = trail[0], last = trail[trail.length - 1];
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (let layer = 0; layer < 3; layer++) {
    const w = width * [1.75, .7, .16][layer];
    const g = ctx.createLinearGradient(first.x, first.y, last.x + .01, last.y);
    g.addColorStop(0, "rgba(15,24,110,0)");
    g.addColorStop(.35, layer === 0 ? "rgba(56,71,200,.12)" : "rgba(78,171,237,.1)");
    g.addColorStop(1, layer === 0 ? "rgba(54,106,247,.23)" : (layer === 1 ? (gold ? "rgba(252,204,112,.64)" : "rgba(101,221,255,.7)") : "rgba(232,253,255,.95)"));
    ctx.fillStyle = g; ctx.beginPath();
    for (const side of [-1, 1]) for (let j = 0; j < trail.length; j++) {
      const i = side < 0 ? j : trail.length - 1 - j, p = trail[i], prev = trail[Math.max(0, i - 1)], next = trail[Math.min(trail.length - 1, i + 1)];
      const a = Math.atan2(next.y - prev.y, next.x - prev.x) + Math.PI / 2;
      const t = i / (trail.length - 1), thickness = w * Math.pow(t, 1.3) * (1 - .88 * Math.pow(t, 8)) * .5;
      const x = p.x + Math.cos(a) * thickness * side, y = p.y + Math.sin(a) * thickness * side;
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

function drawAstraWell(w) {
  const age = w.maxLife - w.life, appear = astraEase(age / 24), close = astraEase(w.life / 28), scale = appear * (.15 + close * .85), r = w.r * scale;
  if (r < 1) return;
  ctx.save(); ctx.translate(w.x, w.y);
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
  for (let arm = 0; arm < 7; arm++) {
    const offset = arm * ASTRA_TAU / 7 + w.phase;
    for (let layer = 0; layer < 2; layer++) {
      ctx.strokeStyle = layer ? "rgba(168,222,255,.29)" : "rgba(89,70,226,.12)"; ctx.lineWidth = layer ? .85 : 12;
      ctx.beginPath();
      for (let step = 0; step <= 40; step++) { const q = step / 40, rr = r * (.12 + .8 * q), a = offset - q * 3.6, x = Math.cos(a) * rr, y = Math.sin(a) * rr; step ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
  }
  ctx.restore();
  // The accretion disc crosses behind a dark lens, with a thin, bright foreground lip.
  ctx.strokeStyle = "rgba(253,217,141,.85)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, r * .56, r * .17, -.28, Math.PI, ASTRA_TAU); ctx.stroke();
  ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#040717";
  ctx.beginPath(); ctx.arc(0, 0, r * .16, 0, ASTRA_TAU); ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(201,197,255,.93)"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, r * .17, 0, ASTRA_TAU); ctx.stroke();
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
  for (const w of astraWells) if (astraVisible(w.x, w.y, w.r * 1.3)) drawAstraWell(w);
  ctx.globalCompositeOperation = "lighter";
  const radius = astraOrbitRadius();
  astraRuneRing(player.x, player.y, radius, (player.astraOrbitAngle || 0) * .18, .2 + (player.astraOrbitBlend || 0) * .22);
  if (astraGravity) {
    drawAstraGravityField(astraGravity);
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
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, ASTRA_TAU); ctx.stroke(); return;
  }
  const big = e.type === "impact" || e.type === "collapse", r = e.r * (1 - (1 - p) ** 3);
  ctx.save(); ctx.translate(e.x, e.y);
  astraGlow(0, 0, e.r * (big ? 1.15 : .9), Math.max(0, 1 - p * 3), "blue");
  astraGlow(0, 0, e.r * .42, Math.max(0, 1 - p * 4), "gold");
  if (big) {
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
  const deployed = new Set(astraQFlights().map(m => m.slot));
  for (let n = 0; n < astraOrbitCount(); n++) if (!deployed.has(n)) {
    const p = astraOrbitSlot(n); astraStar(p.x, p.y, 12 + (player.astraOrbitBlend || 0) * 4, p.a * .4);
  }
  for (const m of astraMeteors) if (astraVisible(m.x, m.y, 350)) {
    astraRibbon(m.trail, m.kind === "orbit" ? m.r * 1.75 : 12, m.returning);
    astraStar(m.x, m.y, m.r, m.a + astraFrame * .06);
    if (m.kind === "orbit") {
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
