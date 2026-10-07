import { business } from '../data/business';
import { LIMITS, MODALITY_LABELS } from './constants';
import type { Order } from './cart';

export interface OrderDetails {
  name?: string;
  neighborhood?: string;
  date?: string;
  comments?: string;
}

// No 0/O/1/I so the advisor can read codes back without confusion.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short code that lets the business count orders coming from the website, without tracking. */
export function generateOrderCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Removes control characters, collapses whitespace and bounds the length of free text. */
export function cleanText(value: string | undefined, max: number, multiline = false): string {
  if (!value) return '';
  if (!multiline) {
    return value
      .replace(/\p{Cc}/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\P{Cc}\n]/gu, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export function needsNeighborhood(order: Order): boolean {
  return order.some((item) => item.modality === 'domicilio');
}

export function buildOrderMessage(order: Order, details: OrderDetails, code: string): string {
  const lines = [
    `Hola ${business.name} 💜`,
    `Quiero hacer este pedido desde la página web (pedido #${code}):`,
    '',
  ];
  order.forEach((item, index) => {
    const people = item.people > 1 ? ` · ${item.people} personas` : '';
    lines.push(`${index + 1}. ${item.name} — ${MODALITY_LABELS[item.modality]}${people}`);
  });

  const name = cleanText(details.name, LIMITS.maxShortField);
  const neighborhood = needsNeighborhood(order)
    ? cleanText(details.neighborhood, LIMITS.maxShortField)
    : '';
  const date = cleanText(details.date, LIMITS.maxShortField);
  const comments = cleanText(details.comments, LIMITS.maxComments, true);

  const extra: string[] = [];
  if (name) extra.push(`Nombre: ${name}`);
  if (neighborhood) extra.push(`Barrio o localidad: ${neighborhood}`);
  if (date) extra.push(`Fecha preferida: ${date}`);
  if (comments) extra.push(`Comentarios: ${comments}`);
  if (extra.length) lines.push('', ...extra);

  lines.push('', '¿Me confirman precio, disponibilidad y detalles? ¡Gracias!');
  return lines.join('\n');
}

export function buildInquiryMessage(topic?: string): string {
  return topic
    ? `Hola ${business.name} 💜 Quiero más información sobre: ${topic}.`
    : `Hola ${business.name} 💜 Quiero más información sobre sus servicios.`;
}

export function buildWhatsAppUrl(text: string, phoneE164: string = business.whatsapp.e164): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
