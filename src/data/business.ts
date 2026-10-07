/**
 * Single source of truth for business facts. Taken from the public Instagram
 * (@pololasbeautystudio) and Facebook pages. Update here, never inline in pages.
 */
export const business = {
  name: 'Pololas Beauty Studio',
  shortName: 'Pololas',
  slogan: '¡Descubre tu mejor versión con nosotros!',
  tagline: 'Naturalidad ante todo',
  bio: 'Belleza, cosmética y cuidado personal, servicios de spa.',
  description:
    'Estudio de belleza y spa en Modelia, Bogotá: armonización facial, cuidado de la piel, masajes, tratamientos corporales y depilación. Atención en el estudio o a domicilio.',
  whatsapp: {
    /** E.164 without "+", as wa.me expects. */
    e164: '573202078089',
    display: '+57 320 207 8089',
  },
  email: 'pololasbs@gmail.com',
  location: {
    // TODO(dueña): confirmar si se publica la dirección exacta o solo el barrio.
    neighborhood: 'Modelia',
    city: 'Bogotá',
    region: 'Bogotá D.C.',
    countryCode: 'CO',
    country: 'Colombia',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Modelia%2C%20Bogot%C3%A1%2C%20Colombia',
  },
  // TODO(dueña): confirmar horario de atención.
  hoursNote: 'Atención con cita previa. Escríbenos para agendar.',
  homeServiceNote:
    'Llevamos el spa a tu casa en Bogotá. Te confirmamos cobertura y costo del domicilio por WhatsApp.',
  social: {
    instagram: 'https://www.instagram.com/pololasbeautystudio/',
    instagramHandle: '@pololasbeautystudio',
    facebook: 'https://www.facebook.com/profile.php?id=61552028553001',
  },
  /** Path under public/ for social previews (1200×630 JPG). Null until the owner provides one. */
  ogImage: null as string | null,
} as const;

export type Business = typeof business;
