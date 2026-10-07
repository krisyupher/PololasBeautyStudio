import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { ICON_NAMES, MODALITIES } from './lib/constants';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase-kebab-case id');

const categories = defineCollection({
  loader: file('src/data/categories.json'),
  schema: z.object({
    id: slug,
    name: z.string().min(2),
    shortName: z.string().min(2),
    description: z.string().min(10),
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
