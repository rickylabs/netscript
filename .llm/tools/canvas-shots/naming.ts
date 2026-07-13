import type { Theme } from './args.ts';

/** Converts a hash route and theme to a deterministic PNG filename. */
export function shotFilename(route: string, theme: Theme): string {
  const slug = route.trim().replace(/^#+/, '').replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'home';
  return `${slug}--${theme}.png`;
}

/** Appends a hash route without retaining an existing hash fragment. */
export function routeUrl(serveUrl: string, route: string): string {
  const base = serveUrl.replace(/#.*$/, '');
  return `${base}#${route.replace(/^#/, '')}`;
}
