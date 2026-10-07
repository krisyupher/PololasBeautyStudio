import { describe, expect, it } from 'vitest';
import categories from '../../src/data/categories.json';
import services from '../../src/data/services.json';
import { ICON_NAMES, MODALITIES } from '../../src/lib/constants';

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

  it('keeps summaries short enough for cards and meta descriptions', () => {
    for (const service of services) expect(service.summary.length).toBeLessThanOrEqual(160);
  });

  it('features at least three treatments on the home page', () => {
    expect(services.filter((service) => service.featured).length).toBeGreaterThanOrEqual(3);
  });

  it('requires a prior assessment for every injectable (armonización facial)', () => {
    for (const service of services.filter((item) => item.category === 'armonizacion-facial')) {
      expect(service.requiresAssessment, service.id).toBe(true);
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
  ];

  it('avoids absolute or risk-free claims in the catalog copy', () => {
    for (const service of services) {
      const copy = [service.name, service.summary, service.description, ...service.benefits].join(
        ' ',
      );
      for (const pattern of banned) expect(copy, `${service.id} ${pattern}`).not.toMatch(pattern);
    }
  });
});
