// Handles file selection, preview, and conversion to PDF

const fileInput = document.getElementById('file-input');
const fileListEl = document.getElementById('file-list');
const convertBtn = document.getElementById('convert-btn');

/** @type {File[]} */
let selectedFiles = [];

function clearFileList() {
  fileListEl.innerHTML = '<li>No files selected.</li>';
}

function updateFileList(files) {
  if (!files || files.length === 0) {
    clearFileList();
    return;
  }
  const frag = document.createDocumentFragment();
  Array.from(files).forEach((f, idx) => {
    const li = document.createElement('li');
    li.textContent = `${idx + 1}. ${f.name} (${f.type || 'unknown'})`;
    frag.appendChild(li);
  });
  fileListEl.innerHTML = '';
  fileListEl.appendChild(frag);
}

fileInput?.addEventListener('change', (e) => {
  const files = /** @type {HTMLInputElement} */(e.target).files;
  selectedFiles = files ? Array.from(files) : [];
  updateFileList(selectedFiles);
});

function ensureJsPDF() {
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    throw new Error('jsPDF library not loaded.');
  }
  return jspdf.jsPDF;
}

/**
 * Read a File to data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Read a File as text
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Fit an image within page dimensions, preserving aspect ratio
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} pageW
 * @param {number} pageH
 * @param {number} margin
 */
function computeImagePlacement(imgW, imgH, pageW, pageH, margin) {
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  return { x, y, drawW, drawH };
}

/**
 * Determine image format for jsPDF addImage
 * @param {File} file
 * @returns {'JPEG'|'PNG'}
 */
function getImageFormat(file) {
  if (file.type === 'image/png') return 'PNG';
  return 'JPEG';
}

/**
 * Load HTMLImageElement from data URL to read natural dimensions
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function convertFilesToPDF() {
  if (!selectedFiles.length) {
    alert('Please select at least one file to convert.');
    return;
  }
  const JsPDF = ensureJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 24;
  let isFirstPage = true;

  for (const file of selectedFiles) {
    const type = (file.type || '').toLowerCase();
    try {
      if (type.startsWith('image/')) {
        const dataUrl = await fileToDataURL(file);
        const img = await loadImage(dataUrl);
        // Switch orientation for subsequent pages only; first page remains as created
        const desiredOrientation = img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait';
        if (!isFirstPage) {
          doc.addPage('a4', desiredOrientation);
        }
        const curW = doc.internal.pageSize.getWidth();
        const curH = doc.internal.pageSize.getHeight();
        const { x, y, drawW, drawH } = computeImagePlacement(img.naturalWidth, img.naturalHeight, curW, curH, margin);
        doc.addImage(dataUrl, getImageFormat(file), x, y, drawW, drawH);
      } else if (type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        const text = await fileToText(file);
        if (!isFirstPage) doc.addPage();
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(text, pageW - margin * 2);
        doc.text(lines, margin, margin + 12);
      } else {
        // Unsupported type; skip but list remains
        console.warn(`Skipping unsupported file type: ${file.name}`);
        continue;
      }
      isFirstPage = false;
    } catch (err) {
      console.error('Error processing file', file.name, err);
      alert(`Failed to process file: ${file.name}`);
    }
  }

  // Trigger download
  doc.save('converted.pdf');
}

convertBtn?.addEventListener('click', () => {
  convertFilesToPDF();
});
