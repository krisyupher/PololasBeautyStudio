/** Joins a deploy base path (e.g. "/PololasBeautyStudio/") with an internal path. */
export function joinBase(base: string, path: string): string {
  // Absolute URLs (https:, mailto:, …) and in-page anchors pass through untouched.
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('#')) return path;
  const trimmedBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${cleanPath}`;
}

/** Every internal link and public asset URL must go through this helper. */
export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

export function serviceUrl(id: string): string {
  return withBase(`/servicios/${id}/`);
}

export function catalogUrl(params?: { cat?: string; modo?: string }): string {
  const search = new URLSearchParams();
  if (params?.cat) search.set('cat', params.cat);
  if (params?.modo) search.set('modo', params.modo);
  const query = search.toString();
  return withBase(`/catalogo/${query ? `?${query}` : ''}`);
}
