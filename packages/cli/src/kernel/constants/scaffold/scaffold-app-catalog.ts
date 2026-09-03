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
  ORPC_CLIENT: '^1.15.0',
  ORPC_CONTRACT: '^1.15.0',
  ORPC_OPENAPI: '^1.15.0',
  ORPC_SERVER: '^1.15.0',
  ORPC_TANSTACK_QUERY: '^1.15.0',
  ORPC_ZOD: '^1.15.0',
  PREACT: '^10.29.2',
  PREACT_SIGNALS: '2.9.2',
  TANSTACK_DB: '^0.6.8',
  TANSTACK_PREACT_QUERY: '^5.101.0',
  TANSTACK_QUERY_CORE: '^5.101.0',
  TANSTACK_QUERY_DB_COLLECTION: '^1.2.1',
  TANSTACK_REACT_DB: '^0.1.95',
  TAILWINDCSS: '^4.2.2',
  TAILWINDCSS_VITE: '^4.1.12',
  VITE: '7.2.2',
  ZOD: '^4.4.3',
} as const;

/** Catalog entries owned by the root of every generated standalone workspace. */
export const SCAFFOLD_WORKSPACE_CATALOG = {
  zod: SCAFFOLD_APP_CATALOG.ZOD,
} as const;

export const SCAFFOLD_APP_IMPORTS = {
  fresh: SCAFFOLD_APP_CATALOG.FRESH_CORE,
  '@orpc/client': `npm:@orpc/client@${SCAFFOLD_APP_CATALOG.ORPC_CLIENT}`,
  '@orpc/contract': `npm:@orpc/contract@${SCAFFOLD_APP_CATALOG.ORPC_CONTRACT}`,
  '@orpc/openapi': `npm:@orpc/openapi@${SCAFFOLD_APP_CATALOG.ORPC_OPENAPI}`,
  '@orpc/server': `npm:@orpc/server@${SCAFFOLD_APP_CATALOG.ORPC_SERVER}`,
  '@orpc/tanstack-query':
    `npm:@orpc/tanstack-query@${SCAFFOLD_APP_CATALOG.ORPC_TANSTACK_QUERY}`,
  '@orpc/zod': `npm:@orpc/zod@${SCAFFOLD_APP_CATALOG.ORPC_ZOD}`,
  'preact': `npm:preact@${SCAFFOLD_APP_CATALOG.PREACT}`,
  '@preact/signals': `npm:@preact/signals@${SCAFFOLD_APP_CATALOG.PREACT_SIGNALS}`,
  '@tanstack/db': `npm:@tanstack/db@${SCAFFOLD_APP_CATALOG.TANSTACK_DB}`,
  '@tanstack/preact-query':
    `npm:@tanstack/preact-query@${SCAFFOLD_APP_CATALOG.TANSTACK_PREACT_QUERY}`,
  '@tanstack/query-core':
    `npm:@tanstack/query-core@${SCAFFOLD_APP_CATALOG.TANSTACK_QUERY_CORE}`,
  '@tanstack/query-db-collection':
    `npm:@tanstack/query-db-collection@${SCAFFOLD_APP_CATALOG.TANSTACK_QUERY_DB_COLLECTION}`,
  '@tanstack/react-db': `npm:@tanstack/react-db@${SCAFFOLD_APP_CATALOG.TANSTACK_REACT_DB}`,
  '@fresh/plugin-vite': SCAFFOLD_APP_CATALOG.FRESH_PLUGIN_VITE,
  '@tailwindcss/vite': `npm:@tailwindcss/vite@${SCAFFOLD_APP_CATALOG.TAILWINDCSS_VITE}`,
  'tailwindcss': `npm:tailwindcss@${SCAFFOLD_APP_CATALOG.TAILWINDCSS}`,
  'vite': `npm:vite@${SCAFFOLD_APP_CATALOG.VITE}`,
  'zod': `npm:zod@${SCAFFOLD_WORKSPACE_CATALOG.zod}`,
} as const;
