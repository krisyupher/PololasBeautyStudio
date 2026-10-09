import type { ImageMetadata } from 'astro';

type ImageModules = Record<string, { default: ImageMetadata }>;

// Drop a photo named after a service id (e.g. src/assets/services/toxina-botulinica.jpg) and it
// appears automatically on its card and detail page, optimized by astro:assets.
const serviceImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/services/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

// Mood photo for each category section, named after the category id
// (e.g. src/assets/categories/estetica-facial.jpg).
const categoryImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/categories/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

// Instagram-style highlight covers for the home page (e.g. src/assets/highlights/labios.jpg).
const highlightImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/highlights/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

// Drop the real logo as src/assets/brand/logo.svg (or .png/.webp) to replace the text wordmark.
const logoImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/brand/logo.{svg,png,webp}',
  { eager: true },
);

// White version of the logo for purple backgrounds (the footer wave).
const logoWhiteImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/brand/logo-white.{svg,png,webp}',
  { eager: true },
);

// Optional hero photo for the home page: src/assets/hero.jpg (or .png/.webp).
const heroImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/hero.{jpg,jpeg,png,webp}',
  { eager: true },
);

// Photo of the closing "Gracias" section: src/assets/gracias.jpg (or .png/.webp).
const thanksImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/gracias.{jpg,jpeg,png,webp}',
  { eager: true },
);

function fileStem(path: string): string {
  return (path.split('/').pop() ?? '').replace(/\.[^.]+$/, '');
}

function findByStem(images: ImageModules, stem: string): ImageMetadata | undefined {
  const match = Object.entries(images).find(([path]) => fileStem(path) === stem);
  return match?.[1].default;
}

function first(images: ImageModules): ImageMetadata | undefined {
  return Object.values(images)[0]?.default;
}

export function getServiceImage(id: string): ImageMetadata | undefined {
  return findByStem(serviceImages, id);
}

export function getCategoryImage(id: string): ImageMetadata | undefined {
  return findByStem(categoryImages, id);
}

export function getHighlightImage(name: string): ImageMetadata | undefined {
  return findByStem(highlightImages, name);
}

export function getLogoImage(): ImageMetadata | undefined {
  return first(logoImages);
}

export function getLogoWhiteImage(): ImageMetadata | undefined {
  return first(logoWhiteImages);
}

export function getHeroImage(): ImageMetadata | undefined {
  return first(heroImages);
}

export function getThanksImage(): ImageMetadata | undefined {
  return first(thanksImages);
}
