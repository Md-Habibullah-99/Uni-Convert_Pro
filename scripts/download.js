import { getFiles, clearFiles } from './state.js';

function ensureJsPDF() {
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    alert('jsPDF failed to load locally.');
    throw new Error('jsPDF not available');
  }
  return jspdf.jsPDF;
}

function computePlacement(imgW, imgH, pageW, pageH, margin = 24) {
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  return { x, y, drawW, drawH };
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function getImageFormat(type) {
  return type === 'image/png' ? 'PNG' : 'JPEG';
}

function sanitizeName(name) {
  if (!name) return 'converted.pdf';
  let n = name.trim();
  if (!n.toLowerCase().endsWith('.pdf')) n += '.pdf';
  return n.replace(/[\\/:*?"<>|]+/g, '_');
}

async function convert() {
  const files = getFiles();
  if (!files.length) {
    alert('No files selected.');
    return;
  }
  const JsPDF = ensureJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 24;
  const lineHeight = 14;

  let first = true;
  for (const f of files) {
    try {
      if (f.kind === 'image') {
        const img = await loadImage(f.dataUrl);
        if (!first) doc.addPage();
        const { x, y, drawW, drawH } = computePlacement(img.naturalWidth, img.naturalHeight, pageW, pageH, margin);
        doc.addImage(f.dataUrl, getImageFormat(f.type), x, y, drawW, drawH);
        first = false;
      } else if (f.kind === 'text') {
        const wrapped = doc.splitTextToSize(f.text || '', pageW - margin * 2);
        let idx = 0;
        const linesPerPage = Math.floor((pageH - margin * 2) / lineHeight);
        while (idx < wrapped.length) {
          if (!first) doc.addPage();
          doc.setFontSize(12);
          const slice = wrapped.slice(idx, idx + linesPerPage);
          doc.text(slice, margin, margin + 12, { baseline: 'top' });
          idx += linesPerPage;
          first = false;
        }
        if (wrapped.length === 0) {
          if (!first) doc.addPage();
          first = false;
        }
      }
    } catch (err) {
      console.error('Error processing', f.name, err);
      alert(`Failed to process: ${f.name}`);
    }
  }
  const nameInput = document.getElementById('filename-input');
  const fileName = sanitizeName(nameInput && 'value' in nameInput ? /** @type {HTMLInputElement} */(nameInput).value : 'converted.pdf');
  doc.save(fileName);
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
