import { describe, expect, it } from 'vitest';
import { uniqueId } from './uid';

describe('uniqueId', () => {
  it('returns a different id on every call, with the given prefix', () => {
    const ids = Array.from({ length: 5 }, () => uniqueId('wave'));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^wave-\d+$/);
  });
});
