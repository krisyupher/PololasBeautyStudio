import { LIMITS, STORAGE_KEY, type Modality } from './constants';
import { isModality } from './search';

export interface CatalogEntry {
  id: string;
  name: string;
  modalities: readonly Modality[];
}
export type Catalog = ReadonlyMap<string, CatalogEntry>;

export interface OrderItem {
  id: string;
  name: string;
  modality: Modality;
  people: number;
}
export type Order = readonly OrderItem[];

export interface ItemPatch {
  modality?: Modality;
  people?: number;
}

export function clampPeople(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(LIMITS.maxPeople, Math.max(1, Math.round(value)));
}

export function addItem(order: Order, entry: CatalogEntry, modality?: Modality): Order {
  if (order.length >= LIMITS.maxItems || order.some((item) => item.id === entry.id)) return order;
  const chosen = modality && entry.modalities.includes(modality) ? modality : entry.modalities[0];
  if (!chosen) return order;
  return [...order, { id: entry.id, name: entry.name, modality: chosen, people: 1 }];
}

export function removeItem(order: Order, id: string): Order {
  return order.some((item) => item.id === id) ? order.filter((item) => item.id !== id) : order;
}

export function updateItem(order: Order, catalog: Catalog, id: string, patch: ItemPatch): Order {
  return order.map((item) => {
    if (item.id !== id) return item;
    const offered = catalog.get(id)?.modalities ?? [item.modality];
    const modality =
      patch.modality && offered.includes(patch.modality) ? patch.modality : item.modality;
    const people = patch.people === undefined ? item.people : clampPeople(patch.people);
    return { ...item, modality, people };
  });
}

/** Rebuilds an order from untrusted storage data, keeping only items still in the catalog. */
export function sanitizeOrder(raw: unknown, catalog: Catalog): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  const result: OrderItem[] = [];
  for (const value of raw) {
    if (result.length >= LIMITS.maxItems) break;
    if (typeof value !== 'object' || value === null) continue;
    const { id, modality, people } = value as Record<string, unknown>;
    if (typeof id !== 'string') continue;
    const entry = catalog.get(id);
    const fallback = entry?.modalities[0];
    if (!entry || !fallback || result.some((item) => item.id === id)) continue;
    result.push({
      id,
      name: entry.name,
      modality: isModality(modality) && entry.modalities.includes(modality) ? modality : fallback,
      people: clampPeople(typeof people === 'number' ? people : 1),
    });
  }
  return result;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadOrder(storage: StorageLike | null, catalog: Catalog): OrderItem[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitizeOrder(JSON.parse(raw), catalog) : [];
  } catch {
    return [];
  }
}

/** Persists only service ids and choices; never the customer's personal details. */
export function saveOrder(storage: StorageLike | null, order: Order): void {
  if (!storage) return;
  try {
    if (order.length === 0) {
      storage.removeItem(STORAGE_KEY);
    } else {
      const slim = order.map(({ id, modality, people }) => ({ id, modality, people }));
      storage.setItem(STORAGE_KEY, JSON.stringify(slim));
    }
  } catch {
    // Storage blocked or full: the order still works for this visit.
  }
}

export type OrderListener = (order: Order) => void;

export interface OrderStore {
  get(): Order;
  has(id: string): boolean;
  add(id: string, modality?: Modality): void;
  remove(id: string): void;
  update(id: string, patch: ItemPatch): void;
  clear(): void;
  /** Re-reads storage, e.g. after another tab changed the order. */
  reload(): void;
  subscribe(listener: OrderListener): () => void;
}

export function createOrderStore(catalog: Catalog, storage: StorageLike | null): OrderStore {
  let order: Order = loadOrder(storage, catalog);
  const listeners = new Set<OrderListener>();

  const notify = () => listeners.forEach((listener) => listener(order));
  const commit = (next: Order) => {
    if (next === order) return;
    order = next;
    saveOrder(storage, order);
    notify();
  };

  return {
    get: () => order,
    has: (id) => order.some((item) => item.id === id),
    add: (id, modality) => {
      const entry = catalog.get(id);
      if (entry) commit(addItem(order, entry, modality));
    },
    remove: (id) => commit(removeItem(order, id)),
    update: (id, patch) => commit(updateItem(order, catalog, id, patch)),
    clear: () => commit(order.length ? [] : order),
    reload: () => {
      order = loadOrder(storage, catalog);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
