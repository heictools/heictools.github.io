import {isHeif} from './core.js';
import {encode} from './encode.js';
export async function convert(file, settings, signal, progress) {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (!await isHeif(file)) throw new Error('This is not a supported HEIC/HEIF file. Select an original .heic or .heif photo.');
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (!globalThis.Worker || !globalThis.createImageBitmap) throw new Error('Please use a current version of Safari, Chrome, Firefox, or Edge. This browser lacks the image APIs needed for conversion.');
  progress('Loading converter');
  return new Promise((resolve, reject) => {
    let worker, finished = false;
    const finish = (error, result) => {
      if (finished) return;
      finished = true; clearTimeout(timer); worker?.terminate(); signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve(result);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Conversion took too long. Try a smaller batch or export this photo in Apple Photos.')), 180000);
    signal.addEventListener('abort', abort, {once: true});
    try {
      worker = new Worker(new URL('./converter.worker.js', import.meta.url), {type: 'module'});
      worker.onerror = () => finish(new Error('The converter could not start or ran out of memory. Reload the page and try fewer photos.'));
      worker.onmessage = async ({data}) => {
        if (finished) { data.bitmap?.close(); return; }
        if (data.stage) progress(data.stage);
        if (data.error) finish(new Error(data.error));
        if (data.result) finish(null, data.result);
        if (data.bitmap) {
          try { finish(null, await encode(data.bitmap, data.settings)); } catch (error) { finish(error); }
        }
      };
      worker.postMessage({file, settings});
    } catch (error) { finish(error); }
  });
}
