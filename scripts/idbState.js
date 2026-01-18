// IndexedDB-backed state for Uni Convert: persists Files across pages.
// Stores items with ordering and payload as Blob.

const DB_NAME = 'uniConvertDB';
const STORE_NAME = 'files';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('order', 'order', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode = 'readonly') {
  const t = db.transaction(STORE_NAME, mode);
  const store = t.objectStore(STORE_NAME);
  return { t, store };
}

export async function clearFiles() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const { t, store } = tx(db, 'readwrite');
    const req = store.clear();
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    req.onerror = () => reject(req.error);
  });
}

export async function getFiles() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const { store } = tx(db, 'readonly');
    const idx = store.index('order');
    const req = idx.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getCount(db) {
  return new Promise((resolve, reject) => {
    const { store } = tx(db, 'readonly');
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Add FileList/Array<File> to IDB without reading into memory
 * @param {FileList|File[]} files
 * @returns {Promise<number>} count added
 */
export async function addFiles(files) {
  const list = Array.from(files);
  const db = await openDb();
  const startOrder = await getCount(db);
  let added = 0;
  await new Promise((resolve, reject) => {
    const { t, store } = tx(db, 'readwrite');
    list.forEach((f, i) => {
      const name = f.name;
      const type = f.type || '';
      let kind;
      if (/^image\/(png|jpe?g)$/i.test(type) || /\.(png|jpe?g)$/i.test(name)) {
        kind = 'image';
      } else if (/^text\/plain$/i.test(type) || /\.txt$/i.test(name)) {
        kind = 'text';
      } else {
        return; // skip unsupported
      }
      const rec = { kind, name, type: kind==='text' ? 'text/plain' : (type || (name.toLowerCase().endsWith('.png')?'image/png':'image/jpeg')), order: startOrder + i, blob: f };
      store.add(rec);
      added++;
    });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  return added;
}

export async function removeAt(index) {
  const db = await openDb();
  const list = await getFiles();
  if (index < 0 || index >= list.length) return;
  const target = list[index];
  await new Promise((resolve, reject) => {
    const { t, store } = tx(db, 'readwrite');
    store.delete(target.id);
    // Reassign orders
    list.splice(index, 1);
    list.forEach((rec, i) => { store.put({ ...rec, order: i }); });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function moveItem(from, to) {
  const db = await openDb();
  const list = await getFiles();
  if (from < 0 || from >= list.length) return;
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  await new Promise((resolve, reject) => {
    const { t, store } = tx(db, 'readwrite');
    list.forEach((rec, i) => { store.put({ ...rec, order: i }); });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
