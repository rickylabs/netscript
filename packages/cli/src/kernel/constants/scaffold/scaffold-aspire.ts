export const SCAFFOLD_ASPIRE_MODULES = {
  SDK_FILE: 'aspire.mts',
  SDK_IMPORT_FROM_HELPERS: '../.aspire/modules/aspire.mjs',
  SDK_IMPORT_FROM_ROOT: './.aspire/modules/aspire.mjs',
  HELPERS_IMPORT_FROM_ROOT: './.helpers/index.mjs',
  ASPIRE_COMPAT_IMPORT: './_aspire-compat.mjs',
} as const;

export const SCAFFOLD_COMMUNITY_TOOLKIT = {
  PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
  VERSION: '13.2.1-beta.532',
} as const;

export const SCAFFOLD_ASPIRE_INTEGRATIONS = {
  POSTGRES: {
    PACKAGE_ID: 'Aspire.Hosting.PostgreSQL',
    VERSION: '13.4.6',
  },
  MYSQL: {
    PACKAGE_ID: 'Aspire.Hosting.MySql',
    VERSION: '13.4.6',
  },
  MSSQL: {
    PACKAGE_ID: 'Aspire.Hosting.SqlServer',
    VERSION: '13.4.6',
  },
  REDIS: {
    PACKAGE_ID: 'Aspire.Hosting.Redis',
    VERSION: '13.4.6',
  },
  GARNET: {
    PACKAGE_ID: 'Aspire.Hosting.Garnet',
    VERSION: '13.4.6',
  },
  BROWSERS: {
    PACKAGE_ID: 'Aspire.Hosting.Browsers',
    VERSION: '13.4.6-preview.1.26319.6',
  },
  // Aspire fork's JavaScript hosting integration — supplies `builder.addDenoApp(...)`,
  // which hosts Deno services/plugins via the fork's first-class Deno runtime
  // (native OTEL via WithDenoDefaults) instead of a hand-rolled
  // `addExecutable('deno', ...)`. The package is not on nuget.org yet; the fork
  // resolves it from source in dev-mode (ASPIRE_REPO_ROOT), so an empty version
  // string is intentional until the integration is published.
  JAVASCRIPT: {
    PACKAGE_ID: 'Aspire.Hosting.JavaScript',
    VERSION: '',
  },
  DENO_KV: {
    PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
    VERSION: '13.4.0',
  },
} as const;
