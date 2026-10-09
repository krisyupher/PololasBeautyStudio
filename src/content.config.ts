import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES, MODALITIES, VALUE_ICONS } from './lib/constants';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase-kebab-case id');

// Each category mirrors one page of the owner's catalog PDF.
const categories = defineCollection({
  loader: file('src/data/categories.json'),
  schema: z.object({
    id: slug,
    name: z.string().min(2),
    shortName: z.string().min(2),
    // Two-tone title: first line in purple, second in pink ("Estética" / "Facial").
    titleLines: z.tuple([z.string().min(2), z.string().min(2)]),
    // The page subtitle, e.g. "Realza tu belleza. Potencia tu confianza."
    description: z.string().min(10),
    // Handwritten accent line, e.g. "Armonía en cada detalle".
    script: z.string().min(4),
    // Letter-spaced supporting line next to the script.
    note: z.string().min(10),
    // The four value badges at the bottom of the page.
    values: z.array(z.object({ icon: z.enum(VALUE_ICONS), label: z.string().min(3) })).length(4),
    // Letter-spaced line on the closing wave, e.g. "Tu confianza también se refleja aquí".
    closing: z.string().min(4),
    icon: z.enum(ICON_NAMES),
    order: z.number().int(),
  }),
});

const services = defineCollection({
  loader: file('src/data/services.json'),
  schema: z.object({
    id: slug,
    name: z.string().min(2),
    // Must match a categories.json id (checked in tests/unit/catalog-data.test.ts).
    category: slug,
    summary: z.string().min(10).max(160),
    description: z.string().min(20),
    benefits: z.array(z.string().min(2)).min(1),
    tags: z.array(z.string()).default([]),
    modalities: z.array(z.enum(MODALITIES)).min(1),
    requiresAssessment: z.boolean().default(false),
    duration: z.string().optional(),
    // Prices are quoted on WhatsApp; set this only if the owner wants "Desde $X" shown.
    price: z.object({ from: z.number().positive(), currency: z.literal('COP') }).optional(),
    featured: z.boolean().default(false),
    icon: z.enum(ICON_NAMES),
  }),
});

export const collections = { categories, services };
