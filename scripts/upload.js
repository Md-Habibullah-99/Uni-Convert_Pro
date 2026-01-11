import { addFiles, getFiles } from './state.js';

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('file-list');
const viewBtn = document.getElementById('view-selected');

function isImageType(type) { return /^image\/(png|jpe?g)$/i.test(type); }

function renderList() {
  const files = getFiles();
  if (!files.length) {
    fileListEl.innerHTML = '<li>No files added yet.</li>';
    return;
  }
  const frag = document.createDocumentFragment();
  files.forEach((f, idx) => {
    const li = document.createElement('li');
    li.className = 'thumb-item';
    const caption = document.createElement('div');
    caption.className = 'thumb-caption';
    caption.textContent = `${idx + 1}. ${f.name}`;

    if (f.kind === 'image' && isImageType(f.type)) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = f.name;
      img.src = f.dataUrl;
      li.appendChild(img);
    } else if (f.kind === 'text') {
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

async function onFilesChosen(list) {
  const count = await addFiles(list);
  renderList();
}

fileInput?.addEventListener('change', (e) => {
  const files = /** @type {HTMLInputElement} */(e.target).files;
  if (files) onFilesChosen(files);
});

['dragenter','dragover'].forEach(evt => {
  dropzone?.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});
['dragleave','drop'].forEach(evt => {
  dropzone?.addEventListener(evt, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone?.addEventListener('drop', (e) => {
  const dt = /** @type {DragEvent} */(e).dataTransfer;
  if (dt?.files) onFilesChosen(dt.files);
});

viewBtn?.addEventListener('click', () => {
  window.location.href = 'selected.html';
});

// initial
renderList();
