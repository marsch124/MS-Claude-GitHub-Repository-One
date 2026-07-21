// db.js — on-device persistence via IndexedDB.
// One object store keyed by batch id. Photos are kept inline as data URLs so a
// batch is a single self-contained record (simple to export/import as JSON).

const DB_NAME = 'fermentlog';
const DB_VERSION = 1;
const STORE = 'batches';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

export async function getAllBatches() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getBatch(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBatch(batch) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(batch);
    req.onsuccess = () => resolve(batch);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBatch(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function replaceAll(batches) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readwrite');
    store.clear();
    for (const b of batches) store.put(b);
    store.transaction.oncomplete = () => resolve();
    store.transaction.onerror = () => reject(store.transaction.error);
  });
}

// --- Backup helpers (Export / Import) ---

export async function exportJSON() {
  const batches = await getAllBatches();
  return JSON.stringify({ app: 'fermentlog', version: 1, exportedAt: new Date().toISOString(), batches }, null, 2);
}

export async function importJSON(text, { merge = false } = {}) {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data) ? data : data.batches;
  if (!Array.isArray(incoming)) throw new Error('This file does not look like a FermentLog backup.');
  if (merge) {
    const existing = await getAllBatches();
    const byId = new Map(existing.map((b) => [b.id, b]));
    for (const b of incoming) byId.set(b.id, b);
    await replaceAll([...byId.values()]);
  } else {
    await replaceAll(incoming);
  }
  return incoming.length;
}
