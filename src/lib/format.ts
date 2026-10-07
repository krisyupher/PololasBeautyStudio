const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Prices are quoted on WhatsApp unless the owner chooses to publish a "from" price. */
export function formatPrice(price?: { from: number; currency: 'COP' }): string {
  return price ? `Desde ${copFormatter.format(price.from)}` : 'Precio a consultar';
}
