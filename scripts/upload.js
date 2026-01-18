// Memory-first previews: persist original File objects in IndexedDB and render thumbnails
import { generateThumbnail } from './thumbnail.js';
import { addFiles, getFiles } from './idbState.js';

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('file-list');
const viewBtn = document.getElementById('view-selected');

/** @type {Map<number,{url:string,revoke:()=>void}>} */
const thumbMap = new Map();

function isImageType(type) { return /^image\/(png|jpe?g)$/i.test(type); }

async function renderPreviews() {
  const memoryState = await getFiles();
  if (!memoryState.length) {
    fileListEl.innerHTML = '<li>No files added yet.</li>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (let i = 0; i < memoryState.length; i++) {
    const f = memoryState[i];
    const li = document.createElement('li');
    li.className = 'thumb-item';
    const caption = document.createElement('div');
    caption.className = 'thumb-caption';
    caption.textContent = `${i + 1}. ${f.name}`;

    if (f.kind === 'image') {
      let entry = thumbMap.get(f.id);
      if (!entry) {
        try {
          const { url, revoke } = await generateThumbnail(f.blob, { maxSize: 300, quality: 0.7 });
          entry = { url, revoke };
        } catch (e) {
          console.warn('Thumbnail failed; falling back to object URL');
          const url = URL.createObjectURL(f.blob);
          entry = { url, revoke: () => URL.revokeObjectURL(url) };
        }
        thumbMap.set(f.id, entry);
      }
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = f.name;
      img.src = entry.url;
      li.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.className = 'text-thumb';
      icon.textContent = 'TXT';
      li.appendChild(icon);
    }
    li.appendChild(caption);
    frag.appendChild(li);
  }
  fileListEl.innerHTML = '';
  fileListEl.appendChild(frag);
}

async function onFilesChosen(list) {
  await addFiles(list);
  renderPreviews();
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
renderPreviews();
