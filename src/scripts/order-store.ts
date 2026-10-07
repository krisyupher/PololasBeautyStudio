import { createOrderStore, type Catalog, type CatalogEntry, type StorageLike } from '../lib/cart';
import { STORAGE_KEY } from '../lib/constants';

/** Reads the slim catalog that BaseLayout embeds as JSON (#catalog-data). */
function readCatalog(): Catalog {
  try {
    const raw = document.getElementById('catalog-data')?.textContent ?? '[]';
    const entries = JSON.parse(raw) as CatalogEntry[];
    return new Map(entries.map((entry) => [entry.id, entry]));
  } catch {
    return new Map();
  }
}

/** localStorage can be missing or throw (private mode, blocked site data). */
function safeStorage(): StorageLike | null {
  try {
    const storage = window.localStorage;
    const probe = '__pololas_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export const catalog = readCatalog();
export const orderStore = createOrderStore(catalog, safeStorage());

// Keep several open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) orderStore.reload();
});
