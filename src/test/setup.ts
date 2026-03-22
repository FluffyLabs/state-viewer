import '@testing-library/jest-dom'

// Node.js 25+ exposes a native localStorage that may shadow jsdom's implementation.
// Ensure a standards-compliant Storage mock is always available in tests.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const store = new Map<string, string>();
  const storage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: { ...storage, getItem: storage.getItem, setItem: storage.setItem, removeItem: storage.removeItem, clear: storage.clear, key: storage.key, get length() { return 0; } }, writable: true });
}