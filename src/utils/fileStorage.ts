import type { StoredFileData } from "@/types/shared";

const STORAGE_KEY = "state-view-file-data";
const DB_NAME = "state-view";
const STORE_NAME = "files";
const DB_VERSION = 1;
const INDEXED_FLAG_KEY = "state-view-has-idb-data";

let dbPromise: Promise<IDBDatabase | null> | null = null;

const isBrowserEnv = () => typeof window !== "undefined";

const setIndexedFlag = () => {
  if (!isBrowserEnv()) {
    return;
  }

  try {
    window.sessionStorage.setItem(INDEXED_FLAG_KEY, "true");
  } catch {
    // ignore
  }
};

const clearIndexedFlag = () => {
  if (!isBrowserEnv()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(INDEXED_FLAG_KEY);
  } catch {
    // ignore
  }
};

const hasIndexedFlag = () => {
  if (!isBrowserEnv()) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(INDEXED_FLAG_KEY) === "true";
  } catch {
    return false;
  }
};

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (!isBrowserEnv() || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        resolve(null);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
};

export const getSessionStoredFileData = (): StoredFileData | null => {
  if (!isBrowserEnv()) {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as StoredFileData) : null;
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
};

const saveToSession = (data: StoredFileData) => {
  if (!isBrowserEnv()) {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const clearSession = () => {
  if (!isBrowserEnv()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

const getFromIndexedDb = async (): Promise<StoredFileData | null> => {
  const db = await openDatabase();
  if (!db) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STORAGE_KEY);

      request.onsuccess = () => {
        resolve(request.result ?? null);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
};

const saveToIndexedDb = async (data: StoredFileData) => {
  const db = await openDatabase();
  if (!db) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, STORAGE_KEY);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

const clearIndexedDb = async () => {
  const db = await openDatabase();
  if (!db) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STORAGE_KEY);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

export const loadStoredFileData = async (): Promise<StoredFileData | null> => {
  const stored = await getFromIndexedDb();
  if (!stored) {
    clearIndexedFlag();
  }
  return stored;
};

export const saveStoredFileData = async (data: StoredFileData) => {
  const persisted = await saveToIndexedDb(data);
  if (persisted) {
    setIndexedFlag();
    clearSession();
    return;
  }

  clearIndexedFlag();
  saveToSession(data);
};

export const clearStoredFileData = async () => {
  const cleared = await clearIndexedDb();
  if (!cleared) {
    clearSession();
    clearIndexedFlag();
    return;
  }

  clearSession();
  clearIndexedFlag();
};

export const hasIndexedDbStoredFile = () => hasIndexedFlag();
