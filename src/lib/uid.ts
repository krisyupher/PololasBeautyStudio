let counter = 0;

/**
 * An id that is unique across the build, for SVG <defs> (gradients) in components that can
 * render more than once on a page. A page with two waves would otherwise repeat an id.
 */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
