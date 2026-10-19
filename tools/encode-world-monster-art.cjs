// Resize/encode built-in image_gen originals without retouching their artwork.
// Usage: node tools/encode-world-monster-art.cjs /absolute/path/to/sharp [--bosses]
// --bosses encodes only separately named boss outputs; never overwrites chibi enemies.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
const manifest = require('./world-monster-art-prompts.json');
const assets = process.argv.includes('--bosses') ? manifest.bossVariants : manifest.assets;
async function main() {
  if (!Array.isArray(assets) || !assets.length) throw new Error('No assets for selected group');
  let total = 0;
  for (const asset of assets) {
    const target = path.join(root, asset.output);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    const source = await sharp(asset.source).metadata();
    if (!source.hasAlpha) throw new Error(`${asset.id}: generated original lacks alpha`);
    await sharp(asset.source).resize(640, 640, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
      .webp({quality: 92, alphaQuality: 100, effort: 6}).toFile(target);
    const metadata = await sharp(target).metadata();
    const {data, info} = await sharp(target).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    let transparent = 0, opaque = 0, partial = 0;
    for (let i = 3; i < data.length; i += info.channels) {
      if (data[i] === 0) transparent++; else if (data[i] === 255) opaque++; else partial++;
    }
    if (!metadata.hasAlpha || !transparent || !opaque) throw new Error(`${asset.id}: invalid transparency`);
    const bytes = fs.statSync(target).size;
    total += bytes;
    console.log(JSON.stringify({id: asset.id, width: metadata.width, height: metadata.height, bytes, transparent, opaque, partial}));
  }
  console.log(`Total: ${assets.length} assets, ${total} bytes`);
}
main().catch(error => {console.error(error); process.exitCode = 1;});
