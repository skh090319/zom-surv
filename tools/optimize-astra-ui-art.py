"""Optimize generated artwork without painting or replacing its alpha."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
generated = Path('C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3')
for name, source, width, crop in [
    ('astra-ui-panel-v1', 'exec-d4998d92-9c7c-4096-bac5-252e0a5d59a2.png', 1536, True),
    ('astra-skill-frame-v1', 'exec-ea8886df-dcf8-4631-b139-10354a391acb.png', 640, False),
]:
    image = Image.open(generated / source).convert('RGBA')
    if crop:
        bounds = image.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        image = image.crop(bounds)
    image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
    output = root / 'assets' / (name + '.webp')
    image.save(output, 'WEBP', quality=92, method=6)
    print(name, image.size, output.stat().st_size, 'bytes; alpha:', image.getchannel('A').getextrema())
