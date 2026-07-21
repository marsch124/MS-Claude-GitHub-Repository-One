// db.js — on-device persistence via IndexedDB.
// One object store keyed by batch id. Photos are kept inline as data URLs so a
// batch is a single self-contained record (simple to export/import as JSON).

const DB_NAME = 'fermentlog';
const DB_VERSION = 2;
const STORE = 'batches';
const PRESETS = 'presets';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Additive migrations — existing data is preserved.
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PRESETS)) db.createObjectStore(PRESETS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, store = STORE) {
  return db.transaction(store, mode).objectStore(store);
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

// --- Presets (saved recipes) ---

export async function getPresets() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly', PRESETS).getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    req.onerror = () => reject(req.error);
  });
}

export async function savePreset(preset) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite', PRESETS).put(preset);
    req.onsuccess = () => resolve(preset);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePreset(id) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite', PRESETS).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
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
