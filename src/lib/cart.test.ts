import { describe, expect, it, vi } from 'vitest';
import {
  addItem,
  createOrderStore,
  loadOrder,
  removeItem,
  sanitizeOrder,
  saveOrder,
  updateItem,
  type Catalog,
  type CatalogEntry,
  type StorageLike,
} from './cart';
import { LIMITS, STORAGE_KEY } from './constants';

const botox: CatalogEntry = { id: 'botox', name: 'Botox', modalities: ['estudio'] };
const masaje: CatalogEntry = {
  id: 'masaje-relajante',
  name: 'Masaje relajante',
  modalities: ['estudio', 'domicilio'],
};
const catalog: Catalog = new Map([
  [botox.id, botox],
  [masaje.id, masaje],
]);

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('addItem', () => {
  it('adds with the first offered modality by default', () => {
    expect(addItem([], masaje)).toEqual([
      { id: 'masaje-relajante', name: 'Masaje relajante', modality: 'estudio', people: 1 },
    ]);
  });

  it('uses the preferred modality only when offered', () => {
    expect(addItem([], masaje, 'domicilio')[0]?.modality).toBe('domicilio');
    expect(addItem([], botox, 'domicilio')[0]?.modality).toBe('estudio');
  });

  it('ignores duplicates and respects the item limit', () => {
    const once = addItem([], botox);
    expect(addItem(once, botox)).toBe(once);

    const full = Array.from({ length: LIMITS.maxItems }, (_, i) => ({
      id: `s${i}`,
      name: `S${i}`,
      modality: 'estudio' as const,
      people: 1,
    }));
    expect(addItem(full, botox)).toBe(full);
  });
});

describe('removeItem / updateItem', () => {
  const order = addItem(addItem([], botox), masaje);

  it('removes by id and keeps the same reference when absent', () => {
    expect(removeItem(order, 'botox').map((i) => i.id)).toEqual(['masaje-relajante']);
    expect(removeItem(order, 'nope')).toBe(order);
  });

  it('only switches to an offered modality', () => {
    expect(
      updateItem(order, catalog, 'masaje-relajante', { modality: 'domicilio' })[1]?.modality,
    ).toBe('domicilio');
    expect(updateItem(order, catalog, 'botox', { modality: 'domicilio' })[0]?.modality).toBe(
      'estudio',
    );
  });

  it('clamps the number of people', () => {
    expect(updateItem(order, catalog, 'botox', { people: 0 })[0]?.people).toBe(1);
    expect(updateItem(order, catalog, 'botox', { people: 99 })[0]?.people).toBe(LIMITS.maxPeople);
    expect(updateItem(order, catalog, 'botox', { people: Number.NaN })[0]?.people).toBe(1);
  });
});

describe('sanitizeOrder', () => {
  it('keeps only valid items that are still in the catalog', () => {
    const raw = [
      { id: 'botox', modality: 'domicilio', people: 3 },
      { id: 'botox', modality: 'estudio', people: 1 },
      { id: 'masaje-relajante', modality: 'domicilio', people: 50 },
      { id: 'retired-service', modality: 'estudio', people: 1 },
      { id: 42 },
      null,
      'botox',
    ];
    expect(sanitizeOrder(raw, catalog)).toEqual([
      { id: 'botox', name: 'Botox', modality: 'estudio', people: 3 },
      { id: 'masaje-relajante', name: 'Masaje relajante', modality: 'domicilio', people: 10 },
    ]);
  });

  it('returns an empty order for non-arrays', () => {
    expect(sanitizeOrder({ id: 'botox' }, catalog)).toEqual([]);
    expect(sanitizeOrder('[]', catalog)).toEqual([]);
  });
});

describe('loadOrder / saveOrder', () => {
  it('round-trips through storage without personal data', () => {
    const storage = memoryStorage();
    const order = addItem([], masaje, 'domicilio');
    saveOrder(storage, order);
    expect(JSON.parse(storage.data[STORAGE_KEY] ?? '')).toEqual([
      { id: 'masaje-relajante', modality: 'domicilio', people: 1 },
    ]);
    expect(loadOrder(storage, catalog)).toEqual(order);
  });

  it('removes the key when the order is empty', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '[]' });
    saveOrder(storage, []);
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it('survives corrupt data and blocked storage', () => {
    expect(loadOrder(memoryStorage({ [STORAGE_KEY]: '{not json' }), catalog)).toEqual([]);
    expect(loadOrder(throwingStorage, catalog)).toEqual([]);
    expect(() => saveOrder(throwingStorage, addItem([], botox))).not.toThrow();
    expect(loadOrder(null, catalog)).toEqual([]);
  });
});

describe('createOrderStore', () => {
  it('notifies subscribers and persists every change', () => {
    const storage = memoryStorage();
    const store = createOrderStore(catalog, storage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.add('botox');
    store.add('masaje-relajante', 'domicilio');
    store.update('masaje-relajante', { people: 2 });
    expect(store.has('botox')).toBe(true);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(loadOrder(storage, catalog)).toEqual(store.get());

    store.add('unknown-service');
    store.add('botox');
    expect(listener).toHaveBeenCalledTimes(3);

    store.clear();
    expect(store.get()).toEqual([]);
    expect(storage.data[STORAGE_KEY]).toBeUndefined();
  });

  it('works without storage and can reload from it', () => {
    const memoryless = createOrderStore(catalog, null);
    memoryless.add('botox');
    expect(memoryless.get()).toHaveLength(1);

    const storage = memoryStorage();
    const store = createOrderStore(catalog, storage);
    saveOrder(storage, addItem([], masaje));
    store.reload();
    expect(store.get().map((i) => i.id)).toEqual(['masaje-relajante']);
  });
});
