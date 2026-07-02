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
  DENO_KV: {
    PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
    VERSION: '13.4.0',
  },
} as const;
