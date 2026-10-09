/**
 * Path normalization and matching shared by contract-policy resolution.
 *
 * @module
 */

/** Compiles a REST path with `{param}` segments into an anchored matcher. */
export function compilePathPattern(path: string): RegExp {
  let source = '';
  let index = 0;
  for (const match of path.matchAll(/\{[^{}]+\}/g)) {
    source += escapeRegExp(path.slice(index, match.index));
    source += '[^/]+';
    index = match.index + match[0].length;
  }
  source += escapeRegExp(path.slice(index));
  return new RegExp(`^${source}/?$`);
}

/** Joins a mount prefix and a relative path into one normalized path. */
export function joinPath(prefix: string, path: string): string {
  const normalizedPrefix = normalizePath(prefix);
  const normalizedPath = normalizePath(path);
  if (normalizedPrefix === '/') return normalizedPath;
  if (normalizedPath === '/') return normalizedPrefix;
  return `${normalizedPrefix}${normalizedPath}`;
}

/** Projects router-key segments onto the RPC path they are served at. */
export function toRouterPath(segments: readonly string[]): string {
  return normalizePath(`/${segments.join('/')}`);
}

/** Returns a path relative to a prefix it is known to be within. */
export function relativePath(path: string, prefix: string): string {
  return normalizePath(path.slice(prefix.length));
}

/** Normalizes and deduplicates a list of paths. */
export function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizePath))];
}

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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
