import type { MaintenanceRecord } from './domain';

const REAL_DB_NAME = 'home-care-evidence';
const DEMO_DB_NAME = 'demo:home-care-evidence';
const STORE = 'records';
let databaseName = REAL_DB_NAME;

export function useDemoDatabase(enabled: boolean): void {
  databaseName = enabled ? DEMO_DB_NAME : REAL_DB_NAME;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('The local logbook could not be opened.'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('The record could not be saved on this device.'));
    tx.oncomplete = () => database.close();
    tx.onerror = () => reject(tx.error ?? new Error('The local logbook transaction failed.'));
  });
}

export async function getRecords(): Promise<MaintenanceRecord[]> {
  const records = await transaction<MaintenanceRecord[]>('readonly', store => store.getAll());
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveRecord(record: MaintenanceRecord): Promise<IDBValidKey> {
  return transaction('readwrite', store => store.put(record));
}

export function removeRecord(id: string): Promise<undefined> {
  return transaction('readwrite', store => store.delete(id));
}

export async function replaceRecords(records: MaintenanceRecord[]): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    records.forEach(record => store.put(record));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('The imported archive could not be stored.'));
  });
  database.close();
}
