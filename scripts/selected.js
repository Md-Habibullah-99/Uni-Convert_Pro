import { getFiles, removeAt, moveItem } from './idbState.js';

const fileListEl = document.getElementById('file-list');
// Single-page layout: no nav buttons here

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

    // Hover remove cross
    const removeCross = document.createElement('div');
    removeCross.className = 'remove-cross';
    removeCross.setAttribute('role','button');
    removeCross.setAttribute('aria-label','Remove');
    removeCross.textContent = '×';
    removeCross.addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeAt(idx);
      renderList();
    });

    li.appendChild(caption);
    li.appendChild(removeCross);
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

renderList();

// Re-render when files change elsewhere (e.g., after upload/clear)
document.addEventListener('files-updated', () => {
  renderList();
});
