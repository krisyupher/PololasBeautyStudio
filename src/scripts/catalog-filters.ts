import { LIMITS } from '../lib/constants';
import {
  EMPTY_FILTERS,
  filtersToParams,
  isModality,
  matchesFilters,
  parseFilters,
  type Filterable,
  type Filters,
} from '../lib/search';

const root = document.querySelector<HTMLElement>('[data-catalog]');
if (root) initCatalog(root);

function initCatalog(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-catalog-form]');
  const search = root.querySelector<HTMLInputElement>('[data-catalog-search]');
  const categoryChips = [...root.querySelectorAll<HTMLButtonElement>('[data-filter-category]')];
  const modalityChips = [...root.querySelectorAll<HTMLButtonElement>('[data-filter-modality]')];
  const groups = [...root.querySelectorAll<HTMLElement>('[data-category-group]')];
  const count = root.querySelector<HTMLElement>('[data-results-count]');
  const empty = root.querySelector<HTMLElement>('[data-catalog-empty]');

  // Each card carries its normalized search text and filter values, computed at build time.
  const cards = [...root.querySelectorAll<HTMLElement>('[data-service-card]')].map((el) => {
    const item: Filterable = {
      searchText: el.dataset.search ?? '',
      category: el.dataset.category ?? '',
      modalities: (el.dataset.modalities ?? '').split(' ').filter(isModality),
    };
    return { el, item };
  });

  const validCategories = categoryChips
    .map((chip) => chip.dataset.filterCategory ?? '')
    .filter(Boolean);
  let filters: Filters = parseFilters(new URLSearchParams(window.location.search), validCategories);
  if (search) search.value = filters.q;

  let countTimer: number | undefined;

  const showCount = (visible: number) => {
    if (count) count.textContent = visible === 1 ? '1 tratamiento' : `${visible} tratamientos`;
  };

  /** `typing`: debounce the live count so screen readers hear the final number, not every key. */
  const apply = (updateUrl: boolean, typing = false) => {
    let visible = 0;
    for (const { el, item } of cards) {
      const show = matchesFilters(item, filters);
      el.hidden = !show;
      if (show) visible += 1;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector('[data-service-card]:not([hidden])');
    }
    for (const chip of categoryChips) {
      const value = chip.dataset.filterCategory || null;
      chip.setAttribute('aria-pressed', String(value === filters.category));
    }
    for (const chip of modalityChips) {
      const value = chip.dataset.filterModality || null;
      chip.setAttribute('aria-pressed', String(value === filters.modality));
    }
    if (empty) empty.hidden = visible > 0;

    window.clearTimeout(countTimer);
    if (typing) {
      countTimer = window.setTimeout(() => showCount(visible), 350);
    } else {
      showCount(visible);
    }

    if (updateUrl) {
      const params = filtersToParams(filters).toString();
      window.history.replaceState(null, '', params ? `?${params}` : window.location.pathname);
    }
  };

  search?.addEventListener('input', () => {
    filters = { ...filters, q: search.value.slice(0, LIMITS.maxQuery) };
    apply(true, true);
  });

  form?.addEventListener('submit', (event) => event.preventDefault());

  for (const chip of categoryChips) {
    chip.addEventListener('click', () => {
      filters = { ...filters, category: chip.dataset.filterCategory || null };
      apply(true);
    });
  }

  for (const chip of modalityChips) {
    chip.addEventListener('click', () => {
      const value = chip.dataset.filterModality;
      filters = { ...filters, modality: isModality(value) ? value : null };
      apply(true);
    });
  }

  root.querySelectorAll('[data-reset-filters]').forEach((button) => {
    button.addEventListener('click', () => {
      filters = EMPTY_FILTERS;
      if (search) search.value = '';
      apply(true);
      search?.focus();
    });
  });

  apply(false);
}
