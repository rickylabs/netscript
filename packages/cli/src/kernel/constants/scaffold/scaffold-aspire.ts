export const SCAFFOLD_ASPIRE_MODULES = {
  SDK_FILE: 'aspire.mts',
  SDK_IMPORT_FROM_HELPERS: '../.aspire/modules/aspire.mts',
  SDK_IMPORT_FROM_ROOT: './.aspire/modules/aspire.mts',
  HELPERS_IMPORT_FROM_ROOT: './.helpers/index.mts',
  ASPIRE_COMPAT_IMPORT: './_aspire-compat.mts',
} as const;

export const SCAFFOLD_COMMUNITY_TOOLKIT = {
  PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
  VERSION: '13.5.0',
} as const;

export const SCAFFOLD_ASPIRE_INTEGRATIONS = {
  POSTGRES: {
    PACKAGE_ID: 'Aspire.Hosting.PostgreSQL',
    VERSION: '13.5.3',
  },
  MYSQL: {
    PACKAGE_ID: 'Aspire.Hosting.MySql',
    VERSION: '13.5.3',
  },
  MSSQL: {
    PACKAGE_ID: 'Aspire.Hosting.SqlServer',
    VERSION: '13.5.3',
  },
  REDIS: {
    PACKAGE_ID: 'Aspire.Hosting.Redis',
    VERSION: '13.5.3',
  },
  GARNET: {
    PACKAGE_ID: 'Aspire.Hosting.Garnet',
    VERSION: '13.5.3',
  },
  BROWSERS: {
    PACKAGE_ID: 'Aspire.Hosting.Browsers',
    VERSION: '13.5.3-preview.1.26425.3',
  },
  DENO_KV: {
    PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
    VERSION: '13.5.0',
  },
} as const;
