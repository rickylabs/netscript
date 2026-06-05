/** Current alpha package version for plugin platform packages. */
export const PLUGIN_ALPHA_VERSION = '0.0.1-alpha.0';

/** Supported plugin categories. */
export const PLUGIN_TYPES = ['background-processor', 'api', 'frontend', 'utility'] as const;

/** Supported plugin contribution axes. */
export const CONTRIBUTION_AXES = [
  'service',
  'background-processor',
  'stream-topic',
  'database-schema',
  'runtime-config-topic',
  'contract-version',
  'e2e',
  'telemetry',
  'migration',
  'aspire',
] as const;

/** Supported plugin lifecycle hook names. */
export const LIFECYCLE_HOOK_NAMES = [
  'setup',
  'beforeGenerate',
  'afterGenerate',
  'teardown',
] as const;

/** Conventional manifest filenames. */
export const PLUGIN_MANIFEST_FILES = ['plugin.ts', 'plugin.config.ts', 'mod.ts'] as const;

/** Reserved plugin names that cannot be used by third-party packages. */
export const RESERVED_PLUGIN_NAMES = ['netscript', '@netscript/core'] as const;
