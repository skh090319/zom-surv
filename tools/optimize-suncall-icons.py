from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=Path('C:/Users/lg/.codex/generated_images/01a05a50-9c20-7052-a464-74252a08ade3')
for name,file in [('suncall-skill-icons-v1','exec-209b7204-a549-4270-aec7-d3edcc2b9b5f.png'),('suncall-augment-icons-v1','exec-f370b10e-d8cf-4485-864d-61958fafe9c7.png')]:
    image=Image.open(source/file).convert('RGB').resize((768,768),Image.Resampling.LANCZOS)
    output=root/'assets'/(name+'.webp')
    image.save(output,'WEBP',quality=93,method=6)
    print(name,output.stat().st_size)
