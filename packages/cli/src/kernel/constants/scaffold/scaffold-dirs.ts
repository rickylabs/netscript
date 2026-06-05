/**
 * Directory names used in scaffold output.
 */
export const SCAFFOLD_DIRS = {
  APPS: 'apps',
  SERVICES: 'services',
  CONTRACTS: 'contracts',
  PLUGINS: 'plugins',
  PACKAGES: 'packages',
  WORKERS: 'workers',
  SAGAS: 'sagas',
  TRIGGERS: 'triggers',
  DATABASE: 'database',
  DOTNET: 'dotnet',
  APPHOST: 'AppHost',
  ASPIRE_TS: 'aspire',
  SERVICE_DEFAULTS: 'ServiceDefaults',
  CONFIG: 'config',
  VERSIONS: 'versions',
  V1: 'v1',
  PROPERTIES: 'Properties',
  HELPERS: '.helpers',
  MODULES: '.modules',
  BACKGROUND: 'background',
  TOOLS: 'tools',
} as const;

export type ScaffoldDirKey = keyof typeof SCAFFOLD_DIRS;
