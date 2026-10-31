import { resolve } from 'node:path';
import process from 'node:process';

/** One matrix is shared by local captures and the CI evidence job. */
export const THEMES = ['light', 'dark'] as const;
export const WIDTHS = [390, 1280] as const;
export const THEME_STORAGE_KEY = 'ns-theme';
export const ROUTES: readonly string[] = (
  process.env.FRESH_UI_ROUTES ??
    '/design/tokens,/design/components,/design/tokens?preset=studio-utility,/design/tokens?preset=ns-one,/design/components?preset=ns-one'
).split(',').map((route) => route.trim());
if (!ROUTES.length || ROUTES.some((route) => !route.startsWith('/') || route.startsWith('//'))) {
  throw new Error('FRESH_UI_ROUTES must contain comma-separated app-relative paths');
}
if (new Set(ROUTES.map(routeName)).size !== ROUTES.length) {
  throw new Error('FRESH_UI_ROUTES must have distinct screenshot names');
}
export const APP_DIR: string = resolve(
  process.env.FRESH_UI_APP_DIR ?? '../../.llm/tmp/s0/scaffold/fresh-ui-browser/apps/dashboard',
);
export const EXTERNAL_SERVER: boolean = Boolean(process.env.FRESH_UI_BASE_URL);
const port = Number(process.env.FRESH_UI_PORT ?? '4173');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('FRESH_UI_PORT must be an integer from 1 through 65535');
}
export const BASE_URL: string = process.env.FRESH_UI_BASE_URL ?? `http://127.0.0.1:${port}`;
export const OUTPUT_DIR: string = resolve(process.env.FRESH_UI_OUTPUT_DIR ?? 'test-results');

/** Stable artifact names preserve route identity without filesystem separators. */
export function routeName(route: string): string {
  return route.replace(/^\//, '').replace(/[^a-zA-Z0-9-]+/g, '-');
}
