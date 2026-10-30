export function outputName(name, suffix = '') {
  const base = name.replace(/\.(heic|heif)$/i, '') || 'photo';
  return `${base}${suffix}.jpg`.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/^\.+/, '_');
}
export function uniqueNames(names) {
  const used = new Set();
  return names.map(name => {
    let candidate = name, n = 2;
    while (used.has(candidate.normalize('NFC').toLowerCase())) {
      candidate = `${name.slice(0, -4)} (${n++}).jpg`;
    }
    used.add(candidate.normalize('NFC').toLowerCase());
    return candidate;
  });
}
export function dimensions(width, height, settings) {
  let scale = 1;
  if (settings.resize === 'half') scale = 0.5;
  if (settings.resize === '1920') scale = Math.min(1, 1920 / Math.max(width, height));
  if (settings.resize === 'custom') {
    if (![settings.width, settings.height].every(n => Number.isInteger(n) && n > 0 && n <= 16384)) {
      throw new Error('Enter a whole-number width and height between 1 and 16384 pixels.');
    }
    scale = Math.min(1, settings.width / width, settings.height / height);
  }
  return {width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale))};
}
export async function isHeif(file) {
  const b = new Uint8Array(await file.slice(0, 256).arrayBuffer());
  const text = (start, end) => String.fromCharCode(...b.slice(start, end));
  if (text(4, 8) !== 'ftyp') return false;
  const brands = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']);
  if (brands.has(text(8, 12))) return true;
  for (let i = 16; i + 4 <= b.length; i += 4) if (brands.has(text(i, i + 4))) return true;
  return false;
}
export function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
export class ConversionQueue {
  items = []; running = false; serial = 0; controller = null;
  constructor(convert, change = () => {}, release = () => {}) {
    this.convert = convert; this.change = change; this.release = release;
  }
  add(files) {
    for (const file of files) this.items.push({id: ++this.serial, file, name: file.name, size: file.size, status: 'queued', stage: 'Waiting', result: null});
    this.change();
  }
  remove(id) {
    const item = this.items.find(x => x.id === id);
    if (!item) return;
    if (item.status === 'converting') this.controller?.abort();
    if (item.result) this.release(item.result);
    item.file = null;
    this.items = this.items.filter(x => x !== item);
    this.change();
  }
  clear() { for (const item of [...this.items]) this.remove(item.id); }
  async run(settings) {
    if (this.running) return;
    this.running = true; this.change();
    try {
      let item;
      while ((item = this.items.find(x => x.status === 'queued'))) {
        this.controller = new AbortController();
        item.status = 'converting'; item.stage = 'Reading image'; this.change();
        try {
          const result = await this.convert(item.file, settings, this.controller.signal, stage => {item.stage = stage; this.change();});
          if (!this.items.includes(item)) { this.release(result); continue; }
          item.result = result; item.outputName = outputName(item.name, settings.suffix);
          item.status = 'done'; item.stage = 'Ready'; item.file = null;
        } catch (error) {
          if (this.items.includes(item)) { item.status = 'error'; item.stage = error.message || 'Conversion failed. Try exporting this image in Apple Photos.'; }
        }
        this.change();
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally { this.running = false; this.controller = null; this.change(); }
  }
  retry(id) {
    const item = this.items.find(x => x.id === id);
    if (item?.status === 'error') { item.status = 'queued'; item.stage = 'Waiting'; this.change(); }
  }
}
