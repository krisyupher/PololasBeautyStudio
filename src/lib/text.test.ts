import { describe, expect, it } from 'vitest';
import { balanceLines } from './text';

describe('balanceLines', () => {
  it('sets the catalog accents in three lines, as in the printed catalog', () => {
    expect(balanceLines('Armonía en cada detalle')).toEqual(['Armonía', 'en cada', 'detalle']);
    expect(balanceLines('Más que servicios, experiencias para ti')).toEqual([
      'Más que servicios,',
      'experiencias',
      'para ti',
    ]);
    expect(balanceLines('Tu cuerpo también merece cuidado')).toEqual([
      'Tu cuerpo',
      'también merece',
      'cuidado',
    ]);
  });

  it('keeps the longest line as short as possible', () => {
    const lines = balanceLines('Cuerpo, mente y belleza en armonía');
    expect(lines).toHaveLength(3);
    expect(Math.max(...lines.map((line) => line.length))).toBe('Cuerpo, mente'.length);
  });

  it('never splits words and keeps every word in order', () => {
    const text = 'Siéntete bien en tu propia piel';
    const lines = balanceLines(text, 2);
    expect(lines).toHaveLength(2);
    expect(lines.join(' ')).toBe(text);
  });

  it('handles short or empty input', () => {
    expect(balanceLines('Gracias')).toEqual(['Gracias']);
    expect(balanceLines('Dos palabras', 3)).toEqual(['Dos', 'palabras']);
    expect(balanceLines('   ')).toEqual([]);
    expect(balanceLines('Una frase corta', 1)).toEqual(['Una frase corta']);
  });

  it('collapses extra whitespace', () => {
    expect(balanceLines('  Armonía   en cada\ndetalle ')).toEqual(['Armonía', 'en cada', 'detalle']);
  });
});
