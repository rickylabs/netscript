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
  ASPIRE_TS: 'aspire',
  CONFIG: 'config',
  VERSIONS: 'versions',
  V1: 'v1',
  HELPERS: '.helpers',
  ASPIRE_GENERATED: '.aspire',
  MODULES: 'modules',
  BACKGROUND: 'background',
  TOOLS: 'tools',
} as const;

export type ScaffoldDirKey = keyof typeof SCAFFOLD_DIRS;
