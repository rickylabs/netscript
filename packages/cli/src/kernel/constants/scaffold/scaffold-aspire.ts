export const SCAFFOLD_ASPIRE_MODULES = {
  SDK_FILE: 'aspire.ts',
  SDK_IMPORT_FROM_HELPERS: '../.modules/aspire.ts',
  SDK_IMPORT_FROM_ROOT: './.modules/aspire.ts',
  HELPERS_IMPORT_FROM_ROOT: './.helpers/index.ts',
  ASPIRE_COMPAT_IMPORT: './_aspire-compat.ts',
} as const;

export const SCAFFOLD_COMMUNITY_TOOLKIT = {
  PACKAGE_ID: 'CommunityToolkit.Aspire.Hosting.Deno',
  VERSION: '13.2.1-beta.532',
} as const;

export const SCAFFOLD_ASPIRE_INTEGRATIONS = {
  POSTGRES: {
    PACKAGE_ID: 'Aspire.Hosting.PostgreSQL',
    VERSION: '13.2.2',
  },
  MYSQL: {
    PACKAGE_ID: 'Aspire.Hosting.MySql',
    VERSION: '13.2.2',
  },
  MSSQL: {
    PACKAGE_ID: 'Aspire.Hosting.SqlServer',
    VERSION: '13.2.2',
  },
  REDIS: {
    PACKAGE_ID: 'Aspire.Hosting.Redis',
    VERSION: '13.2.2',
  },
} as const;
