import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  buildSearchText,
  filtersToParams,
  matchesFilters,
  matchesQuery,
  normalize,
  parseFilters,
  type Filterable,
} from './search';

describe('normalize', () => {
  it('strips accents, lowercases and collapses whitespace', () => {
    expect(normalize('  Depilación   Completa ')).toBe('depilacion completa');
    expect(normalize('Baño de LUNA')).toBe('bano de luna');
  });
});

describe('matchesQuery', () => {
  const text = buildSearchText({
    name: 'Depilación por zonas',
    summary: 'Piel bella y exfoliada',
    tags: ['axilas', 'bikini'],
    categoryName: 'Depilación',
  });

  it('matches regardless of accents, case and word order', () => {
    expect(matchesQuery(text, 'depilacion')).toBe(true);
    expect(matchesQuery(text, 'ZONAS depilación')).toBe(true);
  });

  it('matches partial words and simple plurals', () => {
    expect(matchesQuery(text, 'depil')).toBe(true);
    expect(matchesQuery(text, 'depilaciones')).toBe(true);
    expect(
      matchesQuery(buildSearchText({ name: 'Masaje relajante', summary: '', tags: [] }), 'masajes'),
    ).toBe(true);
  });

  it('requires every word to match', () => {
    expect(matchesQuery(text, 'depilacion botox')).toBe(false);
  });

  it('treats an empty query as a match', () => {
    expect(matchesQuery(text, '   ')).toBe(true);
  });
});

describe('matchesFilters', () => {
  const item: Filterable = {
    searchText: 'botox toxina botulinica',
    category: 'armonizacion-facial',
    modalities: ['estudio'],
  };

  it('filters by category, modality and query together', () => {
    expect(matchesFilters(item, EMPTY_FILTERS)).toBe(true);
    expect(matchesFilters(item, { ...EMPTY_FILTERS, category: 'armonizacion-facial' })).toBe(true);
    expect(matchesFilters(item, { ...EMPTY_FILTERS, category: 'spa-masajes' })).toBe(false);
    expect(matchesFilters(item, { ...EMPTY_FILTERS, modality: 'domicilio' })).toBe(false);
    expect(matchesFilters(item, { ...EMPTY_FILTERS, q: 'toxina' })).toBe(true);
  });
});

describe('parseFilters / filtersToParams', () => {
  const categories = ['armonizacion-facial', 'spa-masajes'];

  it('accepts only known categories and modalities', () => {
    const filters = parseFilters(
      new URLSearchParams('q=botox&cat=spa-masajes&modo=domicilio'),
      categories,
    );
    expect(filters).toEqual({ q: 'botox', category: 'spa-masajes', modality: 'domicilio' });

    const hostile = parseFilters(
      new URLSearchParams('cat=<script>&modo=javascript:alert(1)'),
      categories,
    );
    expect(hostile).toEqual({ q: '', category: null, modality: null });
  });

  it('caps the query length', () => {
    const filters = parseFilters(new URLSearchParams(`q=${'a'.repeat(500)}`), categories);
    expect(filters.q).toHaveLength(60);
  });

  it('serializes only active filters', () => {
    expect(filtersToParams(EMPTY_FILTERS).toString()).toBe('');
    expect(
      filtersToParams({
        q: ' labios ',
        category: 'armonizacion-facial',
        modality: null,
      }).toString(),
    ).toBe('q=labios&cat=armonizacion-facial');
  });
});
