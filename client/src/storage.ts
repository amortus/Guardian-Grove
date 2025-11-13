/**
 * Persistência offline com IndexedDB (API nativa, sem libs)
 */

const DB_NAME = 'beast_keepers';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

let dbInstance: IDBDatabase | null = null;

/**
 * Abre ou cria o banco IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cria object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Salva um valor no IndexedDB
 */
export async function save(key: string, value: any): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to save key: ${key}`));
  });
}

/**
 * Carrega um valor do IndexedDB
 */
export async function load<T>(key: string): Promise<T | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result !== undefined ? request.result : null);
    };
    request.onerror = () => reject(new Error(`Failed to load key: ${key}`));
  });
}

/**
 * Remove um valor do IndexedDB
 */
export async function remove(key: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to remove key: ${key}`));
  });
}

/**
 * Lista todas as chaves
 */
export async function listKeys(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
    request.onerror = () => reject(new Error('Failed to list keys'));
  });
}

/**
 * Limpa todos os dados
 */
export async function clear(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear storage'));
  });
}

