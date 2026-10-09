import type { ValueIconName } from '../../lib/constants';

type InterfaceIconName =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'mail'
  | 'pin'
  | 'clock'
  | 'home'
  | 'studio'
  | 'bag'
  | 'close'
  | 'trash'
  | 'plus'
  | 'minus'
  | 'check'
  | 'arrow-right'
  | 'search'
  | 'menu';

/** Every value-badge icon in categories.json must have a drawing here (checked by the type). */
export type UiIconName = InterfaceIconName | ValueIconName;

/** Small interface icons (24×24, stroked with currentColor). Brand-agnostic drawings, not official logos. */
export const UI_ICONS: Record<UiIconName, readonly string[]> = {
  whatsapp: [
    'M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z',
    'M8.8 7.9c.3-.4.7-.4 1-.2l1 2.1c.1.3 0 .6-.2.8l-.6.7c.6 1.3 1.7 2.4 3 3l.7-.6c.2-.2.5-.3.8-.2l2.1 1c.3.1.3.6 0 1-.6.8-1.6 1.2-2.6.9-2.9-.9-5.1-3.1-6-6-.3-1 .1-1.9.8-2.5z',
  ],
  instagram: [
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z',
    'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z',
    'M17.2 6.8h.01',
  ],
  facebook: [
    'M14 21v-7.5h2.6l.4-3H14V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9v2.3H8.5v3H11V21',
  ],
  mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
  pin: [
    'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z',
    'M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  ],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  home: ['M4 11.5L12 5l8 6.5', 'M6 10v9h12v-9', 'M10 19v-5h4v5'],
  studio: ['M5 20V9l7-5 7 5v11', 'M9 20v-6h6v6', 'M3 20h18', 'M15.5 8.5l.01 0'],
  bag: ['M6 8h12l-1 12H7L6 8z', 'M9 8V6.5a3 3 0 0 1 6 0V8'],
  close: ['M6 6l12 12M18 6L6 18'],
  trash: ['M5 7h14', 'M10 11v6M14 11v6', 'M6.5 7l1 13h9l1-13', 'M9.5 7V4.5h5V7'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6-6 6'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  // Value badges, drawn after the icons in the owner's catalog.
  diamond: ['M7 4h10l4 5-9 11.5L3 9z', 'M3 9h18', 'M7 4l1 5 4-5 4 5 1-5', 'M8 9l4 11.5L16 9'],
  shield: [
    'M12 3.2l7 2.6v5.4c0 4.6-2.9 8.2-7 9.8-4.1-1.6-7-5.2-7-9.8V5.8z',
    'M9 12.2l2.1 2.1 4-4.2',
  ],
  heart: [
    'M12 20.5C6.5 16.8 3.5 13.4 3.5 9.6 3.5 7 5.4 5 7.9 5c1.7 0 3.2.9 4.1 2.4C12.9 5.9 14.4 5 16.1 5c2.5 0 4.4 2 4.4 4.6 0 3.8-3 7.2-8.5 10.9z',
  ],
  sparkles: [
    'M10 5.5c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6z',
    'M18 3c.3 1.7.9 2.3 2.6 2.6-1.7.3-2.3.9-2.6 2.6-.3-1.7-.9-2.3-2.6-2.6 1.7-.3 2.3-.9 2.6-2.6z',
    'M18.5 14.6c.3 1.6.8 2.1 2.4 2.4-1.6.3-2.1.8-2.4 2.4-.3-1.6-.8-2.1-2.4-2.4 1.6-.3 2.1-.8 2.4-2.4z',
  ],
  users: [
    'M12 5.9a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z',
    'M7.6 18.5c.4-2.8 2.2-4.6 4.4-4.6s4 1.8 4.4 4.6',
    'M6.2 8.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    'M2.8 18c.3-2.2 1.6-3.6 3.4-3.6 1 0 1.8.4 2.4 1',
    'M17.8 8.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    'M21.2 18c-.3-2.2-1.6-3.6-3.4-3.6-1 0-1.8.4-2.4 1',
  ],
  chip: [
    'M8.5 6.5h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    'M10 10h4v4h-4z',
    'M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3',
  ],
};

/** Icons drawn as solid shapes (the catalog's sparkles are filled). */
export const FILLED_UI_ICONS: ReadonlySet<UiIconName> = new Set<UiIconName>(['sparkles']);
