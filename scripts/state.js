// Session storage state for Uni Convert

const STORAGE_KEY = 'uniConvertFiles';

export function getFiles() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse stored files', e);
    return [];
  }
}

export function setFiles(files) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (e) {
    console.error('Failed to set stored files', e);
  }
}

export function clearFiles() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Add FileList/Array<File> to storage by reading content
 * @param {FileList|File[]} files
 * @returns {Promise<number>} count added
 */
export async function addFiles(files) {
  const list = Array.from(files);
  const existing = getFiles();
  const additions = [];

  for (const f of list) {
    const name = f.name;
    const type = f.type || '';
    if (/^image\/(png|jpe?g)$/i.test(type) || /\.(png|jpe?g)$/i.test(name)) {
      const dataUrl = await fileToDataURL(f);
      additions.push({ kind: 'image', name, type: type || guessType(name), dataUrl });
    } else if (/^text\/plain$/i.test(type) || /\.txt$/i.test(name)) {
      const text = await fileToText(f);
      additions.push({ kind: 'text', name, type: 'text/plain', text });
    } else {
      console.warn('Skipping unsupported file:', name);
    }
  }
  const updated = existing.concat(additions);
  setFiles(updated);
  return additions.length;
}

export function removeAt(index) {
  const files = getFiles();
  if (index < 0 || index >= files.length) return;
  files.splice(index, 1);
  setFiles(files);
}

/**
 * Move item within the list
 * @param {number} from
 * @param {number} to
 */
export function moveItem(from, to) {
  const files = getFiles();
  if (from < 0 || from >= files.length) return;
  if (to < 0 || to >= files.length) return;
  const [item] = files.splice(from, 1);
  files.splice(to, 0, item);
  setFiles(files);
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function guessType(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.txt')) return 'text/plain';
  return '';
}
