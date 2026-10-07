import type { ImageMetadata } from 'astro';

// Drop a photo named after a service id (e.g. src/assets/services/botox.jpg) and it
// appears automatically on its card and detail page, optimized by astro:assets.
const serviceImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/services/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

// Drop the real logo as src/assets/brand/logo.svg (or .png/.webp) to replace the text wordmark.
const logoImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/brand/logo.{svg,png,webp}',
  { eager: true },
);

// Optional hero photo for the home page: src/assets/hero.jpg (or .png/.webp).
const heroImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/hero.{jpg,jpeg,png,webp}',
  { eager: true },
);

function fileStem(path: string): string {
  return (path.split('/').pop() ?? '').replace(/\.[^.]+$/, '');
}

export function getServiceImage(id: string): ImageMetadata | undefined {
  const match = Object.entries(serviceImages).find(([path]) => fileStem(path) === id);
  return match?.[1].default;
}

export function getLogoImage(): ImageMetadata | undefined {
  return Object.values(logoImages)[0]?.default;
}

export function getHeroImage(): ImageMetadata | undefined {
  return Object.values(heroImages)[0]?.default;
}
