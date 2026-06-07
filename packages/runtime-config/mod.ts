/**
 * Loads hot-reloadable runtime overrides for NetScript deployments.
 *
 * Runtime config files live under the configured runtime directory and are loaded through a
 * version pointer named `current`. Missing files produce empty defaults so service startup can
 * continue while operators roll out runtime overrides independently.
 *
 * @example
 * ```ts
 * import {
 *   isFeatureEnabled,
 *   loadRuntimeConfig,
 *   summarizeRuntimeConfig,
 * } from '@netscript/runtime-config';
 *
 * const config = await loadRuntimeConfig();
 * const enabled = isFeatureEnabled(config, 'worker-rollout', false);
 * const summary = summarizeRuntimeConfig(config);
 *
 * await publishRuntimeStatus({ enabled, messages: summary.messages });
 * ```
 *
 * @module
 */

export type {
  FeatureFlag,
  JobOverride,
  RuntimeConfig,
  RuntimeConfigTopic,
  RuntimeTask,
  RuntimeTaskRuntime,
  SagaOverride,
  TriggerOverride,
} from './src/domain/types.ts';
export { RUNTIME_CONFIG_TOPICS, RUNTIME_TASK_RUNTIMES } from './src/domain/types.ts';
export {
  getJobOverride,
  getRuntimeTask,
  getSagaOverride,
  getTriggerOverride,
  isFeatureEnabled,
  loadRuntimeConfig,
} from './src/application/loader.ts';
export { watchRuntimeConfig } from './src/application/watcher.ts';
export type {
  RuntimeConfigSummary,
  RuntimeConfigTriggerPathOverride,
} from './src/diagnostics/summary.ts';
export { summarizeRuntimeConfig } from './src/diagnostics/summary.ts';
