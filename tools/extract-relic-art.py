"""Extract the supplied designbook's embedded artwork, not screenshots or new art."""
import argparse
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('pdf')
parser.add_argument('output')
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
reader = PdfReader(args.pdf)
layout = pdfplumber.open(args.pdf)
slots = ['core', 'armor', 'lens', 'boots', 'emblem', 'power']

def save(page, name, target):
    source = next(im for im in reader.pages[page].images if im.name.rsplit('.', 1)[0] == name)
    # Decode the PDF's embedded image and encode compact, crisp UI art.
    im = source.image.copy()
    im.thumbnail((256, 256))
    im.save(out / (target + '.webp'), 'WEBP', quality=90, method=6)

base = sorted([im for im in layout.pages[3].images if im['top'] > 300], key=lambda im:(round(im['top']/10),im['x0']))
for slot, im in zip(slots, base):
    save(3, im['name'], slot)
pages = {10:['A07','A08'],11:['A01','A02','A03'],12:['A04','A05','A06']}
for page in range(14,20):
    pages[page] = [f'C{(page-14)*3+i+1:02}' for i in range(3)]
for page, sets in pages.items():
    images = layout.pages[page].images
    tops = sorted(im['top'] for im in images if im['x0'] < 60)
    anchors = tops[::2]
    for set_id, top in zip(sets, anchors):
        first = sorted([im for im in images if abs(im['top']-top)<5], key=lambda im:im['x0'])
        boot = next(im for im in images if im['x0']<60 and 20<im['top']-top<50)
        for slot, im in zip(slots[:4], first+[boot]):
            save(page, im['name'], set_id+'-'+slot)
for i, im in enumerate(sorted(layout.pages[13].images,key=lambda im:(round(im['top']/10),im['x0']))):
    save(13,im['name'],f'B{i+1:02}-set')
save(20,layout.pages[20].images[0]['name'],'D01-set')
print(f'Extracted {len(list(out.glob("*.webp")))} images: {sum(p.stat().st_size for p in out.glob("*.webp"))} bytes')
