const DB_NAME = "affilhomes-drafts";
const STORE = "listing-photos";

export type DraftPhoto = {
  id: number;
  name: string;
  type: string;
  lastModified: number;
  section: string;
  blob: Blob;
};

function openDb(storeName: string = STORE): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(storeName, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraftPhotos(
  files: File[],
  sections: string[],
  storeName: string = STORE,
) {
  const db = await openDb(storeName);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    files.forEach((file, i) => {
      const row: DraftPhoto = {
        id: i,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        section: sections[i] ?? "general",
        blob: file,
      };
      store.put(row);
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

export async function loadDraftPhotos(
  storeName: string = STORE,
): Promise<DraftPhoto[]> {
  const db = await openDb();
  const rows = await new Promise<DraftPhoto[]>((resolve, reject) => {
    const req = db.transaction(storeName).objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as DraftPhoto[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => a.id - b.id);
}

export async function clearDraftPhotos(storeName: string = STORE) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
