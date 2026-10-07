import { getCollection, type CollectionEntry } from 'astro:content';
import rawServices from '../data/services.json';
import type { CatalogEntry } from './cart';

// The content layer returns entries sorted by id; the data file order is the intended order.
const filePosition = new Map(rawServices.map((service, index) => [service.id, index]));

export type Service = CollectionEntry<'services'>['data'];
export type Category = CollectionEntry<'categories'>['data'];

export async function getCategories(): Promise<Category[]> {
  const entries = await getCollection('categories');
  return entries.map((entry) => entry.data).sort((a, b) => a.order - b.order);
}

/** Services ordered by category order, then by their position in services.json. */
export async function getServices(): Promise<Service[]> {
  const [categories, entries] = await Promise.all([getCategories(), getCollection('services')]);
  const rank = new Map(categories.map((category) => [category.id, category.order]));
  return entries
    .map((entry) => entry.data)
    .sort(
      (a, b) =>
        (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99) ||
        (filePosition.get(a.id) ?? 0) - (filePosition.get(b.id) ?? 0),
    );
}

/** The slim catalog the browser needs for the order list (embedded as JSON in every page). */
export function toCatalogEntries(services: Service[]): CatalogEntry[] {
  return services.map(({ id, name, modalities }) => ({ id, name, modalities }));
}
