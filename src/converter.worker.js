import { encode } from './encode.js';
import {exifFallback} from './orientation.js';
self.onmessage = async ({data}) => {
  let bitmap;
  try {
    const {heicTo} = await import('/vendor/heic-to/next.js');
    data.settings.orientation = await exifFallback(data.file);
    self.postMessage({stage: 'Decoding photo'});
    bitmap = await heicTo({blob: data.file, type: 'bitmap'});
    self.postMessage({stage: 'Encoding JPEG'});
    if (typeof OffscreenCanvas === 'undefined') {
      self.postMessage({bitmap, settings: data.settings}, [bitmap]); bitmap = null;
    } else {
      const result = await encode(bitmap, data.settings); bitmap = null;
      self.postMessage({result});
    }
  } catch { self.postMessage({error: 'This image could not be decoded. It may be damaged or use an unsupported HEIF variant. Try exporting it from Apple Photos or Preview.'}); }
  finally { bitmap?.close(); }
};
