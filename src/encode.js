import { dimensions } from './core.js';
export async function encode(bitmap, settings) {
  const orientation = settings.orientation || 1;
  const swapped = orientation >= 5;
  const naturalWidth = swapped ? bitmap.height : bitmap.width;
  const naturalHeight = swapped ? bitmap.width : bitmap.height;
  const {width, height} = dimensions(naturalWidth, naturalHeight, settings);
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  try {
    const context = canvas.getContext('2d', {alpha: false, colorSpace: 'srgb'});
    if (!context) throw new Error('Your browser could not allocate an image canvas. Try fewer or smaller photos.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    const draw = (w, h) => {
      const bw = bitmap.width, bh = bitmap.height;
      const matrix = {2:[-1,0,0,1,bw,0],3:[-1,0,0,-1,bw,bh],4:[1,0,0,-1,0,bh],5:[0,1,1,0,0,0],6:[0,1,-1,0,bh,0],7:[0,-1,-1,0,bh,bw],8:[0,-1,1,0,0,bw]}[orientation] || [1,0,0,1,0,0];
      context.save(); context.scale(w / naturalWidth, h / naturalHeight); context.transform(...matrix);
      context.drawImage(bitmap, 0, 0); context.restore();
    };
    draw(width, height);
    const toBlob = quality => canvas.convertToBlob ? canvas.convertToBlob({type: 'image/jpeg', quality}) : new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image encoding failed. Try a smaller output size.')), 'image/jpeg', quality));
    const blob = await toBlob(settings.quality);
    if (!blob.size || blob.type !== 'image/jpeg') throw new Error('Your browser could not create a JPEG. Try a smaller output size.');
    const thumbScale = Math.min(1, 160 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * thumbScale)); canvas.height = Math.max(1, Math.round(height * thumbScale));
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    draw(canvas.width, canvas.height);
    return {blob, thumbnail: await toBlob(0.7), width, height};
  } finally { bitmap.close(); canvas.width = 1; canvas.height = 1; }
}
