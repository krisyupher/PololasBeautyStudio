import { business } from '../data/business';
import type { Category, Service } from './catalog';
import { serviceUrl, withBase } from './paths';

/** Absolute URL for structured data (uses `site` from astro.config.mjs). */
function absolute(path: string): string {
  return new URL(path, import.meta.env.SITE).toString();
}

const homeUrl = () => absolute(withBase('/'));
const businessId = () => `${homeUrl()}#negocio`;

export function businessJsonLd(categories: Category[], services: Service[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': businessId(),
    name: business.name,
    description: business.description,
    slogan: business.slogan,
    url: homeUrl(),
    telephone: `+${business.whatsapp.e164}`,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.location.city,
      addressRegion: business.location.region,
      addressCountry: business.location.countryCode,
    },
    areaServed: { '@type': 'City', name: business.location.city },
    sameAs: [business.social.instagram, business.social.facebook],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Catálogo de tratamientos',
      itemListElement: categories.map((category) => ({
        '@type': 'OfferCatalog',
        name: category.name,
        itemListElement: services
          .filter((service) => service.category === category.id)
          .map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service.name,
              url: absolute(serviceUrl(service.id)),
            },
          })),
      })),
    },
  };
}

export function serviceJsonLd(service: Service, category: Category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: category.name,
    url: absolute(serviceUrl(service.id)),
    areaServed: { '@type': 'City', name: business.location.city },
    provider: {
      '@type': 'BeautySalon',
      '@id': businessId(),
      name: business.name,
      url: homeUrl(),
      telephone: `+${business.whatsapp.e164}`,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}
