import { LIMITS, MODALITIES, type Modality } from './constants';

/** Lowercases, strips accents and collapses whitespace so "Depilación" matches "depilacion". */
export function normalize(text: string): string {
  // NFD splits accented letters into base + combining mark; \p{M} drops the marks.
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export interface SearchSource {
  name: string;
  summary: string;
  tags: readonly string[];
  categoryName?: string;
}

export function buildSearchText(source: SearchSource): string {
  return normalize(
    [source.name, source.summary, source.categoryName ?? '', ...source.tags].join(' '),
  );
}

/** Naive Spanish singularization: "masajes" → "masaje", "depilaciones" → "depilacion". */
function tokenVariants(token: string): string[] {
  const variants = [token];
  if (token.length > 4 && token.endsWith('es')) variants.push(token.slice(0, -2));
  if (token.length > 3 && token.endsWith('s')) variants.push(token.slice(0, -1));
  return variants;
}

/** Every word of the query must appear (in any order) in the search text. */
export function matchesQuery(searchText: string, query: string): boolean {
  const tokens = normalize(query).split(' ').filter(Boolean);
  return tokens.every((token) => tokenVariants(token).some((v) => searchText.includes(v)));
}

export interface Filters {
  q: string;
  category: string | null;
  modality: Modality | null;
}

export const EMPTY_FILTERS: Filters = { q: '', category: null, modality: null };

export interface Filterable {
  searchText: string;
  category: string;
  modalities: readonly Modality[];
}

export function matchesFilters(item: Filterable, filters: Filters): boolean {
  if (filters.category && item.category !== filters.category) return false;
  if (filters.modality && !item.modalities.includes(filters.modality)) return false;
  return matchesQuery(item.searchText, filters.q);
}

export function isModality(value: unknown): value is Modality {
  return typeof value === 'string' && (MODALITIES as readonly string[]).includes(value);
}

/** Reads filters from the URL, accepting only known values (URL input is untrusted). */
export function parseFilters(params: URLSearchParams, validCategories: readonly string[]): Filters {
  const cat = params.get('cat');
  const modo = params.get('modo');
  return {
    q: (params.get('q') ?? '').slice(0, LIMITS.maxQuery),
    category: cat !== null && validCategories.includes(cat) ? cat : null,
    modality: isModality(modo) ? modo : null,
  };
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  const q = filters.q.trim().slice(0, LIMITS.maxQuery);
  if (q) params.set('q', q);
  if (filters.category) params.set('cat', filters.category);
  if (filters.modality) params.set('modo', filters.modality);
  return params;
}
