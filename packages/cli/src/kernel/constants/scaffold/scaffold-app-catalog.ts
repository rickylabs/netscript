/**
 * Catalog-backed dependency pins for scaffolded Fresh apps.
 *
 * NPM versions mirror the root `deno.json` catalog so scaffold output follows
 * workspace dependency bumps. JSR pins stay explicit because Deno catalogs are
 * npm-only in this workspace.
 */
export const SCAFFOLD_APP_CATALOG = {
  FRESH_CORE: 'jsr:@fresh/core@^2.3.3',
  FRESH_PLUGIN_VITE: 'jsr:@fresh/plugin-vite@^1.1.2',
  PREACT: '^10.29.2',
  PREACT_SIGNALS: '2.9.2',
  TANSTACK_PREACT_QUERY: '^5.101.0',
  TANSTACK_QUERY_CORE: '^5.101.0',
  TANSTACK_REACT_DB: '^0.1.86',
  TAILWINDCSS: '^4.2.2',
  TAILWINDCSS_VITE: '^4.1.12',
  VITE: '7.2.2',
} as const;

export const SCAFFOLD_APP_IMPORTS = {
  fresh: SCAFFOLD_APP_CATALOG.FRESH_CORE,
  'preact': `npm:preact@${SCAFFOLD_APP_CATALOG.PREACT}`,
  '@preact/signals': `npm:@preact/signals@${SCAFFOLD_APP_CATALOG.PREACT_SIGNALS}`,
  '@tanstack/preact-query':
    `npm:@tanstack/preact-query@${SCAFFOLD_APP_CATALOG.TANSTACK_PREACT_QUERY}`,
  '@tanstack/query-core':
    `npm:@tanstack/query-core@${SCAFFOLD_APP_CATALOG.TANSTACK_QUERY_CORE}`,
  '@tanstack/react-db': `npm:@tanstack/react-db@${SCAFFOLD_APP_CATALOG.TANSTACK_REACT_DB}`,
  '@fresh/plugin-vite': SCAFFOLD_APP_CATALOG.FRESH_PLUGIN_VITE,
  '@tailwindcss/vite': `npm:@tailwindcss/vite@${SCAFFOLD_APP_CATALOG.TAILWINDCSS_VITE}`,
  'tailwindcss': `npm:tailwindcss@${SCAFFOLD_APP_CATALOG.TAILWINDCSS}`,
  'vite': `npm:vite@${SCAFFOLD_APP_CATALOG.VITE}`,
} as const;
