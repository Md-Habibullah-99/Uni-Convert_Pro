import { getFiles, clearFiles } from './idbState.js';

function sanitizeName(name) {
  if (!name) return 'converted.pdf';
  let n = name.trim();
  if (!n.toLowerCase().endsWith('.pdf')) n += '.pdf';
  return n.replace(/[\\/:*?"<>|]+/g, '_');
}

let worker;
function getWorker() {
  if (!worker) worker = new Worker('scripts/pdfWorker.js', { type: 'module' });
  return worker;
}

const progressContainer = document.getElementById('convert-progress');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');

function showProgress(show) {
  if (!progressContainer) return;
  progressContainer.style.display = show ? 'block' : 'none';
  if (show && progressBar && progressLabel) {
    progressBar.style.width = '0%';
    progressLabel.textContent = '0%';
  }
}

function updateProgress(current, total) {
  if (!progressBar || !progressLabel) return;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  progressBar.style.width = pct + '%';
  progressLabel.textContent = pct + '%';
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
  const options = { quality: 0.7, maxDim: 2000, margin: 24 };
  showProgress(true);
  const result = await new Promise((resolve) => {
    const onMessage = (evt) => {
      const data = evt.data;
      if (data && data.type === 'progress') {
        updateProgress(data.current, data.total);
        return;
      }
      w.removeEventListener('message', onMessage);
      w.removeEventListener('messageerror', onMessageError);
      resolve(data);
    };
    const onMessageError = () => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('messageerror', onMessageError);
      resolve({ ok: false, error: 'Worker message error' });
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('messageerror', onMessageError);
    w.postMessage({ items, options });
  });
  if (!result?.ok) {
    console.error('Worker error:', result?.error);
    alert(`Conversion failed: ${result?.error || 'Unknown error'}`);
    showProgress(false);
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
  showProgress(false);
}

const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const backBtn = document.getElementById('back-selected');

convertBtn?.addEventListener('click', convert);
function showTooltipNear(el, text) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const tip = document.createElement('div');
  tip.className = 'tooltip-bubble';
  tip.textContent = text;
  tip.style.left = rect.left + rect.width / 2 + 'px';
  tip.style.top = rect.top + window.scrollY + 'px';
  document.body.appendChild(tip);
  // force reflow then show
  void tip.offsetWidth;
  tip.style.opacity = '1';
  setTimeout(() => {
    tip.style.opacity = '0';
    setTimeout(() => tip.remove(), 150);
  }, 1200);
}

clearBtn?.addEventListener('click', async () => {
  await clearFiles();
  showTooltipNear(clearBtn, 'Cleared');
});
backBtn?.addEventListener('click', () => {
  window.location.href = 'selected.html';
});
