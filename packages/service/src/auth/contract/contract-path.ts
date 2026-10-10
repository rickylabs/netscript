/**
 * Path normalization shared by the contract-policy units.
 *
 * @module
 */

/** Adds a leading slash and strips trailing slashes. */
export function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

/** Reports whether a path equals a prefix or is nested beneath it at a segment boundary. */
export function isWithinPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix === '/' ? '/' : `${prefix}/`);
}
