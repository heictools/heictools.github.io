import {ConversionQueue, bytes, dimensions, uniqueNames} from './core.js';
import {convert} from './converter.js';
const $ = id => document.getElementById(id);
const rows = new Map();
let zipUrl, zipController, zipBusy = false, renderPending = false;
function announce(message) { $('announcement').textContent = message; }
function invalidateZip() {
  zipController?.abort(); zipController = null;
  if (zipUrl) URL.revokeObjectURL(zipUrl);
  zipUrl = null; $('save-zip').hidden = true;
}
const queue = new ConversionQueue(convert, () => {
  if (!renderPending) { renderPending = true; requestAnimationFrame(() => {renderPending = false; render();}); }
}, result => { if (result.url) URL.revokeObjectURL(result.url); if (result.thumbUrl) URL.revokeObjectURL(result.thumbUrl); });
function render() {
  const {items, running} = queue;
  const done = items.filter(i => i.status === 'done');
  const failed = items.filter(i => i.status === 'error').length;
  const pending = items.filter(i => i.status === 'queued').length;
  $('queue-section').hidden = !items.length;
  $('empty-note').hidden = !!items.length;
  $('queue-count').textContent = `${items.length} ${items.length === 1 ? 'photo' : 'photos'}`;
  $('summary').textContent = running ? `${done.length + failed} of ${items.length} processed · ${done.length} ready${failed ? ` · ${failed} failed` : ''}` : `${done.length} ready${failed ? ` · ${failed} failed` : ''}${pending ? ` · ${pending} waiting` : ''}`;
  $('overall').max = items.length || 1; $('overall').value = done.length + failed;
  $('convert').disabled = running || !pending;
  $('convert').textContent = running ? 'Converting your photos…' : 'Convert HEIC to JPG';
  $('settings').disabled = running;
  $('zip').disabled = !done.length || running || zipBusy;
  $('clear').disabled = !items.length;
  const retained = items.reduce((n, i) => n + (i.file?.size || 0) + (i.result?.blob.size || 0), 0);
  $('memory-note').hidden = retained < 100 * 1024 * 1024;
  $('support-success')?.toggleAttribute('hidden', !done.length);
  for (const [id, row] of rows) if (!items.some(i => i.id === id)) { row.remove(); rows.delete(id); }
  for (const item of items) {
    let row = rows.get(item.id);
    if (!row) {
      row = document.createElement('li'); row.className = 'file-row';
      row.innerHTML = '<div class="file-thumb" aria-hidden="true"><span>HEIC</span></div><div class="file-info"><strong></strong><span class="file-detail"></span><span class="file-status"></span><progress class="file-progress" aria-label="Converting image"></progress></div><div class="file-actions"><a class="download small-button" hidden>Download JPG</a><button type="button" class="retry small-button" hidden>Retry</button><button type="button" class="remove icon-button">×</button></div>';
      row.querySelector('strong').textContent = item.name;
      row.querySelector('.remove').setAttribute('aria-label', `Remove ${item.name}`);
      row.querySelector('.remove').onclick = () => { invalidateZip(); queue.remove(item.id); announce(`Removed ${item.name}`); };
      row.querySelector('.retry').onclick = () => {queue.retry(item.id); if (!queue.running) start();};
      $('queue').append(row); rows.set(item.id, row);
    }
    row.dataset.status = item.status;
    row.querySelector('.file-detail').textContent = item.result ? `${bytes(item.size)} → ${bytes(item.result.blob.size)} · ${item.result.width} × ${item.result.height} px` : bytes(item.size);
    row.querySelector('.file-status').textContent = item.stage;
    row.querySelector('progress').hidden = item.status !== 'converting';
    row.querySelector('.retry').hidden = item.status !== 'error';
    if (item.result && !item.result.url) {
      const result = item.result;
      result.url = URL.createObjectURL(result.blob); result.thumbUrl = URL.createObjectURL(result.thumbnail);
      const img = new Image(); img.src = result.thumbUrl; img.alt = ''; img.width = 64; img.height = 64; img.loading = 'lazy';
      row.querySelector('.file-thumb').replaceChildren(img);
      const link = row.querySelector('.download'); link.href = result.url; link.download = item.outputName; link.hidden = false;
      link.setAttribute('aria-label', `Download ${item.outputName}`);
    }
  }
}
function readSettings() {
  const settings = {quality: Number($('quality').value) / 100, resize: $('resize').value, width: Number($('width').value), height: Number($('height').value), suffix: $('suffix').value.trim()};
  dimensions(100, 100, settings);
  return settings;
}
async function start() {
  try {
    const settings = readSettings(); invalidateZip();
    await queue.run(settings);
    announce(`Finished: ${queue.items.filter(i => i.status === 'done').length} ready, ${queue.items.filter(i => i.status === 'error').length} failed.`);
  } catch (error) {announce(error.message);}
}
function add(files) {
  if (!files.length) return;
  invalidateZip(); queue.add(files); announce(`${files.length} ${files.length === 1 ? 'photo added' : 'photos added'}.`);
}
$('files').addEventListener('change', e => {add([...e.target.files]); e.target.value = '';});
$('choose').onclick = () => $('files').click();
$('add-more').onclick = () => $('files').click();
$('convert').onclick = start;
$('clear').onclick = () => {invalidateZip(); queue.clear(); announce('All photos cleared.');};
$('quality').oninput = () => {$('quality-value').value = `${$('quality').value}%`;};
$('resize').onchange = () => {$('custom-size').hidden = $('resize').value !== 'custom';};
const drop = $('dropzone');
let dragDepth = 0;
for (const event of ['dragenter', 'dragover', 'dragleave', 'drop']) document.addEventListener(event, e => {if (e.dataTransfer?.types.includes('Files')) e.preventDefault();});
drop.addEventListener('dragenter', e => {if (e.dataTransfer.types.includes('Files')) {dragDepth++; drop.classList.add('dragging');}});
drop.addEventListener('dragleave', () => {if (--dragDepth <= 0) drop.classList.remove('dragging');});
drop.addEventListener('drop', e => {e.preventDefault(); dragDepth = 0; drop.classList.remove('dragging'); add([...e.dataTransfer.files]);});
$('zip').onclick = async () => {
  invalidateZip();
  const controller = new AbortController(); zipController = controller;
  const successful = queue.items.filter(i => i.status === 'done');
  const names = uniqueNames(successful.map(i => i.outputName));
  zipBusy = true; render();
  $('zip').textContent = 'Preparing ZIP…';
  try {
    const {default: JSZip} = await import('/vendor/jszip.js');
    const archive = new JSZip();
    for (let i = 0; i < successful.length; i++) {
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      archive.file(names[i], await successful[i].result.blob.arrayBuffer());
    }
    const blob = await archive.generateAsync({type: 'blob', compression: 'STORE', streamFiles: true}, meta => {
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      $('zip').textContent = `Preparing ZIP… ${Math.round(meta.percent)}%`;
    });
    if (!controller.signal.aborted) {
      zipUrl = URL.createObjectURL(blob); $('save-zip').href = zipUrl; $('save-zip').hidden = false;
      $('save-zip').focus(); announce('Your ZIP is ready. Select Save ZIP to download.');
    }
  } catch (error) { if (error.name !== 'AbortError') announce('Could not create the ZIP. Memory may be low. Download photos individually, then clear the queue and try a smaller batch.'); }
  finally {zipBusy = false; $('zip').textContent = 'Download all as ZIP'; render();}
};
window.addEventListener('pagehide', () => {invalidateZip(); queue.clear();});
window.addEventListener('beforeunload', e => {if (queue.running) {e.preventDefault(); e.returnValue = '';}});
render();
