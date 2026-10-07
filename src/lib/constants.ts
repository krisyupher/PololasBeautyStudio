export const MODALITIES = ['estudio', 'domicilio'] as const;
export type Modality = (typeof MODALITIES)[number];

export const MODALITY_LABELS: Record<Modality, string> = {
  estudio: 'En el estudio',
  domicilio: 'A domicilio',
};

export const ICON_NAMES = [
  'face',
  'lips',
  'nose',
  'profile',
  'drop',
  'sparkle',
  'eye',
  'lift',
  'lotus',
  'stones',
  'bamboo',
  'moon',
  'body',
  'leg',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Limits keep the WhatsApp URL short and user input bounded. */
export const LIMITS = {
  maxItems: 20,
  maxPeople: 10,
  maxQuery: 60,
  maxShortField: 60,
  maxComments: 300,
} as const;

export const STORAGE_KEY = 'pololas:pedido:v1';
