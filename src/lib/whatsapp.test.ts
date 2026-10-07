import { describe, expect, it } from 'vitest';
import type { OrderItem } from './cart';
import {
  buildInquiryMessage,
  buildOrderMessage,
  buildWhatsAppUrl,
  cleanText,
  generateOrderCode,
  needsNeighborhood,
} from './whatsapp';

const studioItem: OrderItem = {
  id: 'botox',
  name: 'Botox (toxina botulínica)',
  modality: 'estudio',
  people: 1,
};
const homeItem: OrderItem = {
  id: 'masaje-relajante',
  name: 'Masaje relajante',
  modality: 'domicilio',
  people: 2,
};

describe('buildOrderMessage', () => {
  it('lists items with modality and people, then the details', () => {
    const message = buildOrderMessage(
      [studioItem, homeItem],
      {
        name: ' Ana ',
        neighborhood: 'Modelia',
        date: 'sábado en la tarde',
        comments: 'Primera vez',
      },
      'A3F2',
    );
    expect(message).toBe(
      [
        'Hola Pololas Beauty Studio 💜',
        'Quiero hacer este pedido desde la página web (pedido #A3F2):',
        '',
        '1. Botox (toxina botulínica) — En el estudio',
        '2. Masaje relajante — A domicilio · 2 personas',
        '',
        'Nombre: Ana',
        'Barrio o localidad: Modelia',
        'Fecha preferida: sábado en la tarde',
        'Comentarios: Primera vez',
        '',
        '¿Me confirman precio, disponibilidad y detalles? ¡Gracias!',
      ].join('\n'),
    );
  });

  it('omits empty details and the neighborhood when nothing is at home', () => {
    const message = buildOrderMessage([studioItem], { neighborhood: 'Modelia' }, 'ZZ99');
    expect(message).not.toContain('Barrio');
    expect(message).not.toContain('Nombre');
    expect(message).toContain('1. Botox (toxina botulínica) — En el estudio');
  });

  it('bounds free-text input', () => {
    const message = buildOrderMessage([homeItem], { comments: 'x'.repeat(1000) }, 'ABCD');
    expect(message).toContain(`Comentarios: ${'x'.repeat(300)}\n`);
    expect(message).not.toContain('x'.repeat(301));
  });
});

describe('cleanText', () => {
  it('removes control characters and collapses whitespace', () => {
    expect(cleanText('  Ana\u0000\u0007  María\t ', 60)).toBe('Ana María');
    expect(cleanText(undefined, 60)).toBe('');
  });

  it('keeps line breaks in multiline text but limits blank lines', () => {
    expect(cleanText('uno\r\n\n\n\ndos', 300, true)).toBe('uno\n\ndos');
  });
});

describe('needsNeighborhood', () => {
  it('is true only when an item is a domicilio', () => {
    expect(needsNeighborhood([studioItem])).toBe(false);
    expect(needsNeighborhood([studioItem, homeItem])).toBe(true);
  });
});

describe('generateOrderCode', () => {
  it('creates 4 readable characters', () => {
    expect(generateOrderCode(() => 0)).toBe('AAAA');
    expect(generateOrderCode(() => 0.999)).toBe('9999');
    expect(generateOrderCode()).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  });
});

describe('buildWhatsAppUrl', () => {
  it('targets the business number and round-trips any text', () => {
    const text = 'Hola 💜 ¿precio? Niños & más #1\nGracias';
    const url = new URL(buildWhatsAppUrl(text));
    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe('/573202078089');
    expect(url.searchParams.get('text')).toBe(text);
  });

  it('strips formatting from the phone number', () => {
    expect(buildWhatsAppUrl('x', '+57 320 207-8089')).toBe('https://wa.me/573202078089?text=x');
  });
});

describe('buildInquiryMessage', () => {
  it('mentions the topic when given', () => {
    expect(buildInquiryMessage('Bambuterapia')).toContain('sobre: Bambuterapia.');
    expect(buildInquiryMessage()).toContain('sobre sus servicios');
  });
});
