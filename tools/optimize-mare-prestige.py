"""Optimize generated Mare assets without discarding transparent alpha."""
from pathlib import Path
from PIL import Image
import sys

root = Path(__file__).resolve().parents[1]
generated = Path('C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3')

def webp(source, target, maximum, quality=92):
    image = Image.open(source).convert('RGBA')
    image.thumbnail(maximum, Image.Resampling.LANCZOS)
    image.save(root / target, 'WEBP', quality=quality, method=6)
    print(target, image.size, (root / target).stat().st_size)
    return image

webp(generated / 'exec-f7f0b5ac-70d2-40c4-ae9b-692bb68e1a5c.png', 'assets/mare-ui-panel-v1.webp', (1200, 400))
webp(generated / 'exec-ecb1e410-a79f-4450-8e91-93ae8c20cf66.png', 'assets/mare-skill-frame-v1.webp', (400, 400), 94)
webp(generated / 'exec-ca7bc9b4-a88a-4374-92ca-3889a7f8dc86.png', 'assets/mare-control-icons-v1.webp', (768, 768), 94)
if len(sys.argv) > 1:
    source = Image.open(sys.argv[1]).convert('RGBA')
    if source.getpixel((0, 0))[3] > 5:
        raise ValueError('Character background is not transparent; regenerate the cutout.')
    webp(sys.argv[1], 'assets/mare-mature-v1.webp', (1080, 1080), 93)
    webp(sys.argv[1], 'assets/character-thumbs-v1/mare-mature-v1.webp', (192, 192), 88)
    width, height = source.size
    side = width * .4
    portrait = source.crop((width * .33, height * .075, width * .33 + side, height * .075 + side))
    portrait.thumbnail((256, 256), Image.Resampling.LANCZOS)
    portrait.save(root / 'assets/mare-portrait-v1.webp', 'WEBP', quality=94, method=6)
