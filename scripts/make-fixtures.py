"""Optional regeneration: Python + Pillow 12.2 + pillow-heif 1.3.0. Synthetic MIT fixtures."""
from PIL import Image, ImageDraw, ImageCms
import pillow_heif
from pathlib import Path
pillow_heif.register_heif_opener()
out = Path('tests/fixtures')
out.mkdir(exist_ok=True)
image = Image.new('RGB', (480, 320), '#1665b8')
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 239, 159), fill='#e33425')
draw.rectangle((240, 0, 479, 159), fill='#24ac5a')
draw.rectangle((0, 160, 239, 319), fill='#f0cb35')
draw.text((20, 20), 'TOP LEFT', fill='white', font_size=25)
draw.text((265, 280), 'BOTTOM RIGHT', fill='white', font_size=20)
image.save(out / 'landscape.heic', quality=92)
exif = Image.Exif(); exif[274] = 6; exif[271] = 'Synthetic HEIC Tools fixture'; exif[306] = '2026:10:29 12:00:00'
image.save(out / 'orientation-6.heic', quality=92, exif=exif)
image.save(out / 'container-6.heic', quality=92, exif=exif.tobytes())
image.transpose(Image.Transpose.ROTATE_90).save(out / 'portrait.heif',quality=92)
image.save(out / 'srgb.heic',quality=92,icc_profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes())
image.resize((4032,2688)).save(out / 'large.heic',quality=90)
(out / 'corrupt.heic').write_bytes((out / 'landscape.heic').read_bytes()[:100])
