// src/hooks/useCache.ts
type CachedBarcode = {
  barcode: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
};

const DB_NAME = 'nutrition_cache';
const STORE = 'barcode_cache';

async function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'barcode' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function useCache() {
  const getBarcode = async (barcode: string): Promise<CachedBarcode | null> => {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.get(barcode);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn("IndexedDB not available or failed on read", err);
      return null;
    }
  };

  const saveBarcode = async (data: CachedBarcode) => {
    try {
      const db = await getDB();
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(data);
    } catch (err) {
      console.warn("IndexedDB not available or failed on write", err);
    }
  };

  return { getBarcode, saveBarcode };
}
