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
  PREACT_SIGNALS: '^2.9.1',
  TAILWINDCSS: '^4.2.2',
  TAILWINDCSS_VITE: '^4.1.12',
  VITE: '7.2.2',
} as const;

export const SCAFFOLD_APP_IMPORTS = {
  fresh: SCAFFOLD_APP_CATALOG.FRESH_CORE,
  'preact': `npm:preact@${SCAFFOLD_APP_CATALOG.PREACT}`,
  '@preact/signals': `npm:@preact/signals@${SCAFFOLD_APP_CATALOG.PREACT_SIGNALS}`,
  '@fresh/plugin-vite': SCAFFOLD_APP_CATALOG.FRESH_PLUGIN_VITE,
  '@tailwindcss/vite': `npm:@tailwindcss/vite@${SCAFFOLD_APP_CATALOG.TAILWINDCSS_VITE}`,
  'tailwindcss': `npm:tailwindcss@${SCAFFOLD_APP_CATALOG.TAILWINDCSS}`,
  'vite': `npm:vite@${SCAFFOLD_APP_CATALOG.VITE}`,
} as const;
