// Client-side Image → PDF tool using jsPDF

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('file-list');
const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');

/** @type {File[]} */
let selectedFiles = [];

function isImage(file) {
  return /^image\/(png|jpe?g)$/i.test(file.type) || /\.(png|jpe?g)$/i.test(file.name);
}
function isText(file) {
  return /^text\/plain$/i.test(file.type) || /\.txt$/i.test(file.name);
}

function clearListUI() {
  fileListEl.innerHTML = '<li>No images selected.</li>';
}

function renderThumbnails(files) {
  if (!files.length) {
    clearListUI();
    return;
  }
  const frag = document.createDocumentFragment();
  files.forEach((file, idx) => {
    const li = document.createElement('li');
    li.className = 'thumb-item';
    const caption = document.createElement('div');
    caption.className = 'thumb-caption';
    caption.textContent = `${idx + 1}. ${file.name}`;

    if (isImage(file)) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = file.name;
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      li.appendChild(img);
    } else if (isText(file)) {
      const icon = document.createElement('div');
      icon.className = 'text-thumb';
      icon.textContent = 'TXT';
      li.appendChild(icon);
    }

    li.appendChild(caption);
    frag.appendChild(li);
  });
  fileListEl.innerHTML = '';
  fileListEl.appendChild(frag);
}

function addFiles(files) {
  const newFiles = Array.from(files).filter(f => isImage(f) || isText(f));
  if (!newFiles.length) return;
  selectedFiles = selectedFiles.concat(newFiles);
  renderThumbnails(selectedFiles);
}

fileInput?.addEventListener('change', (e) => {
  const files = /** @type {HTMLInputElement} */(e.target).files;
  if (files) addFiles(files);
});

// Drag & drop handling
['dragenter','dragover'].forEach(evt => {
  dropzone?.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});
['dragleave','drop'].forEach(evt => {
  dropzone?.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone?.addEventListener('drop', (e) => {
  const dt = /** @type {DragEvent} */(e).dataTransfer;
  if (dt?.files) addFiles(dt.files);
});

function ensureJsPDF() {
  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    alert('jsPDF failed to load. Check your internet connection.');
    throw new Error('jsPDF not available');
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
 * Compute image placement preserving aspect ratio
 */
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

function getImageFormat(file) {
  return file.type === 'image/png' ? 'PNG' : 'JPEG';
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function convertToPDF() {
  if (!selectedFiles.length) {
    alert('Please select images first.');
    return;
  }
  const JsPDF = ensureJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 24;
  const lineHeight = 14; // for text pages

  let first = true;
  for (const file of selectedFiles) {
    try {
      if (isImage(file)) {
        const dataUrl = await fileToDataURL(file);
        const img = await loadImage(dataUrl);
        if (!first) doc.addPage();
        const { x, y, drawW, drawH } = computePlacement(img.naturalWidth, img.naturalHeight, pageW, pageH);
        doc.addImage(dataUrl, getImageFormat(file), x, y, drawW, drawH);
      } else if (isText(file)) {
        const text = await fileToText(file);
        const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
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
        // Ensure first is false even if empty text
        if (wrapped.length === 0) {
          if (!first) doc.addPage();
          first = false;
        }
        continue;
      }
      first = false;
    } catch (err) {
      console.error('Error processing', file.name, err);
      alert(`Failed to process: ${file.name}`);
    }
  }

  doc.save('images.pdf');
}

convertBtn?.addEventListener('click', convertToPDF);
clearBtn?.addEventListener('click', () => {
  selectedFiles = [];
  clearListUI();
  if (fileInput) fileInput.value = '';
});
