// Two seamless, pre-rendered nebula layers keep the live health bar inexpensive.
let astraHealthNebulaCache;

function astraHealthSurface(width, height) {
  let surface;
  if (typeof OffscreenCanvas !== 'undefined') surface = new OffscreenCanvas(width, height);
  else if (typeof document !== 'undefined' && document.createElement) {
    surface = document.createElement('canvas');
    surface.width = width; surface.height = height;
  }
  return surface && surface.getContext ? surface : null;
}

function getAstraHealthNebula() {
  if (astraHealthNebulaCache !== undefined) return astraHealthNebulaCache;
  const width = 1024, height = 128;
  const cloud = astraHealthSurface(width, height), stars = astraHealthSurface(width, height);
  if (!cloud || !stars) return (astraHealthNebulaCache = null);
  const paint = cloud.getContext('2d'), star = stars.getContext('2d');
  if (!paint || !star) return (astraHealthNebulaCache = null);
  let seed = 42176;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const center = u => height * (.48 + .19 * Math.sin(u * Math.PI * 2) + .055 * Math.sin(u * Math.PI * 6));
  const puff = (target, x, y, radius, color, alpha) => {
    for (let copy = -1; copy <= 1; copy++) {
      const px = x + copy * width;
      if (px + radius < 0 || px - radius > width) continue;
      const glow = target.createRadialGradient(px, y, 0, px, y, radius);
      glow.addColorStop(0, `rgba(${color},${alpha})`);
      glow.addColorStop(.38, `rgba(${color},${alpha * .62})`);
      glow.addColorStop(1, `rgba(${color},0)`);
      target.fillStyle = glow; target.fillRect(px - radius, y - radius, radius * 2, radius * 2);
    }
  };
  paint.globalCompositeOperation = 'screen';
  for (let i = 0; i < 84; i++) {
    const x = i / 84 * width, y = center(i / 84);
    puff(paint, x, y + (random() - .5) * 30, 30 + random() * 29, i % 3 ? '95,113,239' : '177,92,217', .36);
    puff(paint, x, y + (random() - .5) * 14, 10 + random() * 17, i % 4 ? '137,226,248' : '242,223,255', .36);
  }
  // Fine dust and dark fissures give the river a nebula texture instead of a flat ribbon.
  for (let i = 0; i < 480; i++) {
    const x = random() * width, y = center(x / width) + (random() + random() - 1) * 43;
    paint.fillStyle = `rgba(219,235,255,${.08 + random() * .26})`;
    paint.fillRect(x, y, .4 + random() * 1.1, .35 + random() * .7);
  }
  paint.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 43; i++) {
    const x = i / 43 * width;
    puff(paint, x, center(i / 43) + 7, 3 + random() * 7, '16,22,57', .48);
  }
  for (let i = 0; i < 135; i++) {
    const x = random() * width, y = 5 + random() * (height - 10), radius = i % 12 ? .5 + random() * .6 : 1.35;
    star.fillStyle = i % 9 ? 'rgba(223,245,255,.8)' : 'rgba(255,231,190,.95)';
    star.beginPath(); star.arc(x, y, radius, 0, Math.PI * 2); star.fill();
    if (i % 12 === 0) puff(star, x, y, 5, '152,219,255', .4);
  }
  return (astraHealthNebulaCache = {cloud, stars});
}

function drawAstraHealthFlow(x, y, width, height, ratio) {
  const fillWidth = width * Math.max(0, Math.min(1, ratio));
  if (fillWidth <= 0 || width <= 0 || height <= 0) return;
  const phase = (typeof astraFrame === 'number' ? astraFrame : 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, fillWidth, height); ctx.clip();
  const base = ctx.createLinearGradient(x, y, x + width, y + height);
  base.addColorStop(0, '#233f92'); base.addColorStop(.3, '#514496');
  base.addColorStop(.62, '#454f9e'); base.addColorStop(1, '#27748e');
  ctx.fillStyle = base; ctx.fillRect(x, y, fillWidth, height);
  const texture = getAstraHealthNebula();
  if (texture) {
    const tile = (image, span, speed, top, tall, alpha) => {
      const shift = ((phase * speed % span) + span) % span;
      ctx.globalAlpha = alpha;
      for (let offset = -shift; offset < width; offset += span) ctx.drawImage(image, x + offset, top, span, tall);
    };
    ctx.globalCompositeOperation = 'screen';
    tile(texture.cloud, width * 1.32, -.31, y - height * .5, height * 1.9, .88);
    tile(texture.cloud, width * 1.8, .17, y - height * .3, height * 1.6, .45);
    tile(texture.stars, width * 1.4, -.115, y, height, .75);
  }
  ctx.globalCompositeOperation = 'screen';
  // A handful of drifting star flares animate independently of the cached dust.
  for (let i = 0; i < 9; i++) {
    const u = ((i * .61803398875 + phase * .00014) % 1 + 1) % 1;
    const px = x + width * u, py = y + height * (.2 + (i * .382 % 1) * .6);
    const pulse = Math.pow(.5 + .5 * Math.sin(phase * .029 + i * 2.41), 3);
    ctx.globalAlpha = .16 + pulse * .63;
    ctx.strokeStyle = i % 3 ? '#d2f4ff' : '#ffedcb'; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(px - 1.3 - pulse * 1.5, py); ctx.lineTo(px + 1.3 + pulse * 1.5, py);
    ctx.moveTo(px, py - .7 - pulse); ctx.lineTo(px, py + .7 + pulse); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const glass = ctx.createLinearGradient(x, y, x, y + height);
  glass.addColorStop(0, 'rgba(228,236,255,.17)'); glass.addColorStop(.4, 'rgba(10,17,39,0)'); glass.addColorStop(1, 'rgba(9,12,31,.33)');
  ctx.fillStyle = glass; ctx.fillRect(x, y, fillWidth, height);
  ctx.restore();
}
