/**
 * @module runtime
 * Runtime config and file path constants for .deploy/windows/config/runtime/.
 */

/**
 * Default output directory for Windows deployments.
 */
export const DEFAULT_DEPLOY_OUTPUT_DIR = './.deploy/windows';

/**
 * Subdirectory layout within the deploy output directory.
 */
export const DEPLOY_DIRS = {
  BIN: 'bin',
  CONFIG: 'config',
  LOGS: 'logs',
  SCRIPTS: 'scripts',
} as const;

/**
 * Runtime config subdirectory within .deploy/windows/config/.
 */
export const RUNTIME_CONFIG_DIR = 'runtime';

/**
 * File names for runtime override topics.
 */
export const RUNTIME_CONFIG_FILES = {
  CURRENT: 'current',
  SCHEMA: 'schema.json',
} as const;

/**
 * Supported runtime override topics.
 */
export const RUNTIME_TOPICS = {
  JOBS: 'jobs',
  SAGAS: 'sagas',
  TASKS: 'tasks',
  FEATURES: 'features',
  TRIGGERS: 'triggers',
} as const;

export type RuntimeTopic = (typeof RUNTIME_TOPICS)[keyof typeof RUNTIME_TOPICS];

/**
 * Fields that are immutable and cannot be overridden at runtime.
 * Changing entrypoints at runtime would be a security risk.
 */
export const RUNTIME_IMMUTABLE_FIELDS = ['id', 'name', 'entrypoint'] as const;
