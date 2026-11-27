/** Project-declared executable override shared by Aspire tasks and CLI adapters. */
export const NETSCRIPT_ASPIRE_CLI_ENV = 'NETSCRIPT_ASPIRE_CLI';

export const SCAFFOLD_ASPIRE_MODULES = {
  SDK_FILE: 'aspire.mts',
  SDK_IMPORT_FROM_HELPERS: '../.aspire/modules/aspire.mts',
  SDK_IMPORT_FROM_ROOT: './.aspire/modules/aspire.mts',
  HELPERS_IMPORT_FROM_ROOT: './.helpers/index.mts',
  ASPIRE_COMPAT_IMPORT: './_aspire-compat.mts',
} as const;

export const SCAFFOLD_ASPIRE_INTEGRATIONS = {
  POSTGRES: {
    PACKAGE_ID: 'Aspire.Hosting.PostgreSQL',
    VERSION: '17.0.0',
  },
  MYSQL: {
    PACKAGE_ID: 'Aspire.Hosting.MySql',
    VERSION: '17.0.0',
  },
  MSSQL: {
    PACKAGE_ID: 'Aspire.Hosting.SqlServer',
    VERSION: '17.0.0',
  },
  JAVASCRIPT: {
    PACKAGE_ID: 'Aspire.Hosting.JavaScript',
    VERSION: '17.0.0',
  },
  BROWSERS: {
    PACKAGE_ID: 'Aspire.Hosting.Browsers',
    VERSION: '17.0.0-preview.1.26567.5',
  },
} as const;
