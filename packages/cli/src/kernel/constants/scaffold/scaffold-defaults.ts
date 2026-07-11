/**
 * Default values used when the user accepts defaults or runs in CI mode.
 */
export const SCAFFOLD_DEFAULTS = {
  VERSION: '1.0.0',
  LOG_LEVEL: 'info' as const,
  LOG_FORMAT: 'text' as const,
  APP_NAME: 'dashboard',
  SERVICE_NAME: 'users',
  DB_ENGINE: 'none' as const,
  CACHE_ENABLED: true,
  CACHE_BACKEND: 'redis' as const,
  EDITOR: 'none' as const,
  ASPIRE_TS_APPHOST_PATH: 'aspire/apphost.mts',
  COMPILER_OPTIONS: {
    strict: true,
    lib: ['dom', 'deno.ns', 'deno.unstable'],
  } as const,
} as const;
