import { getFiles, clearFiles } from './idbState.js';

function sanitizeName(name) {
  if (!name) return 'converted.pdf';
  let n = name.trim();
  if (!n.toLowerCase().endsWith('.pdf')) n += '.pdf';
  return n.replace(/[\\/:*?"<>|]+/g, '_');
}

let worker;
function getWorker() {
  if (!worker) worker = new Worker('scripts/pdfWorker.js');
  return worker;
}

async function convert() {
  const files = await getFiles();
  if (!files.length) {
    alert('No files selected.');
    return;
  }
  const items = [];
  for (const f of files) {
    if (f.kind === 'image' && f.blob) {
      items.push({ kind: 'image', name: f.name, type: f.type, blob: f.blob });
    } else if (f.kind === 'text' && f.blob) {
      items.push({ kind: 'text', name: f.name, blob: f.blob });
    }
  }
  const nameInput = document.getElementById('filename-input');
  const fileName = sanitizeName(nameInput && 'value' in nameInput ? /** @type {HTMLInputElement} */(nameInput).value : 'converted.pdf');
  const w = getWorker();
  const options = { quality: 0.8, maxDim: 2000, margin: 24 };
  const result = await new Promise((resolve) => {
    const onMessage = (evt) => { w.removeEventListener('message', onMessage); resolve(evt.data); };
    w.addEventListener('message', onMessage);
    w.postMessage({ items, options });
  });
  if (!result?.ok) {
    console.error('Worker error:', result?.error);
    alert('Conversion failed.');
    return;
  }
  const pdfBuffer = result.pdfBuffer;
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const backBtn = document.getElementById('back-selected');

convertBtn?.addEventListener('click', convert);
clearBtn?.addEventListener('click', () => {
  clearFiles();
  alert('Selection cleared.');
});
backBtn?.addEventListener('click', () => {
  window.location.href = 'selected.html';
});
