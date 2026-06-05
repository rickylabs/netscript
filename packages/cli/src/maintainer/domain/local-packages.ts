/**
 * Maintainer-only local package vocabulary.
 */

/** Packages copied for local workspace scaffold validation. */
export const LOCAL_PACKAGE_PATHS = {
  aspire: 'packages/aspire',
  cli: 'packages/cli',
  config: 'packages/config',
  cron: 'packages/cron',
  database: 'packages/database',
  fresh: 'packages/fresh',
  'fresh-ui': 'packages/fresh-ui',
  kv: 'packages/kv',
  logger: 'packages/logger',
  plugin: 'packages/plugin',
  'plugin-sagas-core': 'packages/plugin-sagas-core',
  'plugin-triggers-core': 'packages/plugin-triggers-core',
  queue: 'packages/queue',
  'runtime-config': 'packages/runtime-config',
  sdk: 'packages/sdk',
  service: 'packages/service',
  shared: 'packages/shared',
  'plugin-streams-core': 'packages/plugin-streams-core',
  telemetry: 'packages/telemetry',
  watchers: 'packages/watchers',
  workers: 'packages/plugin-workers-core',
} as const;

/** Maintainer-only package names copied from the monorepo. */
export type LocalPackageName = keyof typeof LOCAL_PACKAGE_PATHS;

/** Engine-specific local packages copied only for selected database engines. */
export const ENGINE_LOCAL_PACKAGE_PATHS = {
  mysql: ['packages/prisma-adapter-mysql'],
} as const satisfies Readonly<Record<string, readonly string[]>>;
