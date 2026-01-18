import { getFiles, clearFiles } from './state.js';

function sanitizeName(name) {
  if (!name) return 'converted.pdf';
  let n = name.trim();
  if (!n.toLowerCase().endsWith('.pdf')) n += '.pdf';
  return n.replace(/[\\/:*?"<>|]+/g, '_');
}

async function dataUrlToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return blob.arrayBuffer();
}

let worker;
function getWorker() {
  if (!worker) worker = new Worker('scripts/pdfWorker.js');
  return worker;
}

async function convert() {
  const files = getFiles();
  if (!files.length) {
    alert('No files selected.');
    return;
  }
  const items = [];
  const transfers = [];
  for (const f of files) {
    if (f.kind === 'image' && f.dataUrl) {
      const buf = await dataUrlToArrayBuffer(f.dataUrl);
      items.push({ kind: 'image', name: f.name, type: f.type, buffer: buf });
      transfers.push(buf);
    } else if (f.kind === 'text' && f.text) {
      items.push({ kind: 'text', name: f.name, text: f.text });
    }
  }
  const nameInput = document.getElementById('filename-input');
  const fileName = sanitizeName(nameInput && 'value' in nameInput ? /** @type {HTMLInputElement} */(nameInput).value : 'converted.pdf');
  const w = getWorker();
  const options = { quality: 0.8, maxDim: 2000, margin: 24 };
  const result = await new Promise((resolve) => {
    const onMessage = (evt) => { w.removeEventListener('message', onMessage); resolve(evt.data); };
    w.addEventListener('message', onMessage);
    w.postMessage({ items, options }, transfers);
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
