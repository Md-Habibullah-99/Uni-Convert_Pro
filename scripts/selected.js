import { getFiles, removeAt, moveItem } from './idbState.js';

const fileListEl = document.getElementById('file-list');
const backBtn = document.getElementById('back-upload');
const toDownloadBtn = document.getElementById('to-download');

function isImageType(type) { return /^image\/(png|jpe?g)$/i.test(type); }

async function renderList() {
  const files = await getFiles();
  if (!files.length) {
    fileListEl.innerHTML = '<li>No files selected.</li>';
    return;
  }
  const frag = document.createDocumentFragment();
  files.forEach((f, idx) => {
    const li = document.createElement('li');
    li.className = 'thumb-item';
    li.setAttribute('draggable', 'true');
    li.dataset.index = String(idx);
    const caption = document.createElement('div');
    caption.className = 'thumb-caption';
    caption.textContent = `${idx + 1}. ${f.name}`;

    if (f.kind === 'image' && isImageType(f.type)) {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.alt = f.name;
      const url = URL.createObjectURL(f.blob);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      li.appendChild(img);
    } else if (f.kind === 'text') {
      const icon = document.createElement('div');
      icon.className = 'text-thumb';
      icon.textContent = 'TXT';
      li.appendChild(icon);
    }

    const controls = document.createElement('div');
    controls.className = 'button-row';
    const upBtn = document.createElement('button');
    upBtn.className = 'secondary';
    upBtn.textContent = '↑ Up';
    upBtn.disabled = idx === 0;
    upBtn.addEventListener('click', () => {
      moveItem(idx, idx - 1);
      renderList();
    });
    const downBtn = document.createElement('button');
    downBtn.className = 'secondary';
    downBtn.textContent = '↓ Down';
    downBtn.disabled = idx === files.length - 1;
    downBtn.addEventListener('click', () => {
      moveItem(idx, idx + 1);
      renderList();
    });
    const removeBtn = document.createElement('button');
    removeBtn.className = 'secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', async () => {
      await removeAt(idx);
      renderList();
    });

    li.appendChild(caption);
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(removeBtn);
    li.appendChild(controls);
    frag.appendChild(li);
  });
  fileListEl.innerHTML = '';
  fileListEl.appendChild(frag);

  // Drag & drop reordering
  const items = Array.from(fileListEl.querySelectorAll('.thumb-item'));
  items.forEach((item) => {
    item.addEventListener('dragstart', (e) => {
      const idx = Number(item.dataset.index || -1);
      e.dataTransfer?.setData('text/plain', String(idx));
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const fromIdxStr = e.dataTransfer?.getData('text/plain');
      const fromIdx = Number(fromIdxStr);
      const toIdx = Number(item.dataset.index || -1);
      if (!Number.isNaN(fromIdx) && !Number.isNaN(toIdx) && fromIdx !== toIdx) {
        moveItem(fromIdx, toIdx).then(() => renderList());
      }
    });
  });
}

backBtn?.addEventListener('click', () => {
  window.location.href = 'upload.html';
});

toDownloadBtn?.addEventListener('click', () => {
  window.location.href = 'download.html';
});

renderList();
