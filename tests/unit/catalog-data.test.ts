import { describe, expect, it } from 'vitest';
import categories from '../../src/data/categories.json';
import { faqs } from '../../src/data/faq';
import services from '../../src/data/services.json';
import { ICON_NAMES, MODALITIES, VALUE_ICONS } from '../../src/lib/constants';

const categoryIds = new Set(categories.map((category) => category.id));
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('catalog data integrity', () => {
  it('has unique, URL-safe ids', () => {
    for (const list of [categories, services]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(kebab);
    }
  });

  it('assigns every service to an existing category, and every category has services', () => {
    for (const service of services) expect(categoryIds).toContain(service.category);
    for (const category of categories) {
      expect(services.some((service) => service.category === category.id)).toBe(true);
    }
  });

  it('uses valid modalities and icons', () => {
    for (const item of [...categories, ...services]) {
      expect(ICON_NAMES).toContain(item.icon);
    }
    for (const service of services) {
      expect(service.modalities.length).toBeGreaterThan(0);
      for (const modality of service.modalities) expect(MODALITIES).toContain(modality);
    }
  });

  it('gives every category four value badges with known icons', () => {
    for (const category of categories) {
      expect(category.values, category.id).toHaveLength(4);
      for (const value of category.values) expect(VALUE_ICONS, category.id).toContain(value.icon);
    }
  });

  it('keeps summaries short enough for cards and meta descriptions', () => {
    for (const service of services) expect(service.summary.length).toBeLessThanOrEqual(160);
  });

  it('features at least three treatments', () => {
    expect(services.filter((service) => service.featured).length).toBeGreaterThanOrEqual(3);
  });

  it('keeps facial procedures and laser hair removal in the studio, after an assessment', () => {
    const facial = services.filter((service) => service.category === 'estetica-facial');
    const laser = services.filter((service) => service.id === 'depilacion-laser');
    // Fail loudly if the category or the id is renamed, instead of checking nothing.
    expect(facial.length, 'estetica-facial services').toBeGreaterThan(0);
    expect(laser, 'depilacion-laser service').toHaveLength(1);
    for (const service of [...facial, ...laser]) {
      expect(service.requiresAssessment, service.id).toBe(true);
      // INVIMA restricts botulinum toxin to authorized clinical establishments: no home visits.
      expect(service.modalities, service.id).toEqual(['estudio']);
    }
    for (const service of facial) {
      expect(service.summary, service.id).toMatch(/profesional de la salud/);
      expect(service.summary, service.id).toMatch(/valoraci[oó]n/);
    }
  });
});

describe('health-advertising guardrails', () => {
  // Claims that health-advertising rules commonly prohibit. Not legal advice: see
  // the health-compliance-advisor agent and confirm with a lawyer.
  const banned = [
    /garantiz/i,
    /sin riesgo/i,
    /permanente/i,
    /100\s*%/,
    /milagr/i,
    /sin dolor/i,
    /\bcura(r|n)?\b/i,
    // A trademark and a prescription medicine: allowed only in search tags.
    /\bbotox\b/i,
    /\bdefinitiv[oa]s?\b/i,
    /para siempre/i,
    /segur[oa]s? y efectiv/i,
    /procedimientos? segur/i,
    /todo tipo de piel/i,
    /sin vello/i,
    /resultados? (reales|visibles|inmediatos|asegurados)/i,
    /\bexpert[oa]s?\b/i,
    /\bindoloro\b/i,
    /sin (efectos secundarios|contraindicaciones)/i,
    /\bsolo hoy\b/i,
  ];

  /** Checks the copy as written and without accents, so "sólo hoy" also matches /solo hoy/. */
  const expectNoBannedClaims = (copy: string, label: string) => {
    const unaccented = copy.normalize('NFD').replace(/\p{M}/gu, '');
    for (const pattern of banned) {
      for (const text of [copy, unaccented]) {
        expect(text, `${label} ${pattern}`).not.toMatch(pattern);
      }
    }
  };

  /** Every string inside a value, including nested arrays and objects. */
  const allStrings = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(allStrings);
    if (value !== null && typeof value === 'object') {
      return Object.values(value).flatMap(allStrings);
    }
    return [];
  };

  it('avoids absolute or risk-free claims in the treatment copy', () => {
    // Tags are search-only synonyms (never displayed) and intentionally include "botox".
    for (const service of services) {
      const copy = [service.name, service.summary, service.description, ...service.benefits];
      expectNoBannedClaims(copy.join(' '), service.id);
    }
  });

  it('avoids absolute or risk-free claims in the category pages', () => {
    for (const category of categories) {
      expectNoBannedClaims(allStrings(category).join(' '), category.id);
    }
  });

  it('avoids absolute or risk-free claims in the FAQ', () => {
    for (const faq of faqs) expectNoBannedClaims(`${faq.question} ${faq.answer}`, faq.question);
  });
});
