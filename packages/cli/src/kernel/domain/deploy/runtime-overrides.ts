/**
 * @module types/runtime-override
 * Types for the hot-reloadable JSON runtime overrides in .deploy/windows/config/runtime/.
 *
 * Runtime overrides apply a DEEP MERGE strategy — only specified fields are changed.
 * Immutable fields (id, name, entrypoint) cannot be overridden.
 */

/**
 * Version pointer file (`runtime/current`).
 * Points to specific version files for each override topic.
 */
export interface RuntimeVersionPointer {
  version: string;
  jobs?: string;
  sagas?: string;
  tasks?: string;
  features?: string;
  triggers?: string;
  updatedAt: string;
}

/**
 * Overridable fields for a single job definition.
 * Immutable: id, name, entrypoint.
 */
export interface JobOverride {
  id: string;
  enabled?: boolean;
  schedule?: string;
  timeout?: number;
  maxRetries?: number;
  timezone?: string;
  concurrency?: number;
  [key: string]: unknown;
}

/**
 * Runtime job overrides file (`runtime/jobs/v{version}.json`).
 */
export interface JobsRuntimeConfig {
  version: string;
  overrides: JobOverride[];
}

/**
 * Overridable fields for a single saga definition.
 */
export interface SagaOverride {
  id: string;
  enabled?: boolean;
  timeout?: number;
  maxRetries?: number;
  compensationTimeout?: number;
  [key: string]: unknown;
}

/**
 * Runtime saga overrides file (`runtime/sagas/v{version}.json`).
 */
export interface SagasRuntimeConfig {
  version: string;
  overrides: SagaOverride[];
}

/**
 * A runtime task definition (tasks can be added at runtime, unlike jobs).
 * Tasks are additive: they extend the compiled job list.
 *
 * `runtime` mirrors the `TaskType` enum from `@netscript/plugin-workers-core`.
 * Keep these values in sync with `TaskTypeSchema` in packages/plugin-workers-core/src/domain/task.ts.
 */
export interface RuntimeTask {
  id: string;
  name: string;
  description?: string;
  runtime: 'deno' | 'python' | 'dotnet' | 'cmd' | 'powershell' | 'shell' | 'executable';
  entrypoint: string;
  schedule?: string;
  enabled?: boolean;
  timeout?: number;
  [key: string]: unknown;
}

/**
 * Runtime tasks file (`runtime/tasks/v{version}.json`).
 */
export interface TasksRuntimeConfig {
  version: string;
  tasks: RuntimeTask[];
}

/**
 * A feature flag that can be toggled at runtime.
 */
export interface FeatureFlag {
  id: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
}

/**
 * Runtime feature flags file (`runtime/features/v{version}.json`).
 */
export interface FeaturesRuntimeConfig {
  version: string;
  flags: FeatureFlag[];
}

/**
 * Overridable fields for a single trigger definition.
 * Immutable: id, name.
 * `paths` overrides the env-var-driven watch paths at runtime without redeployment.
 */
export interface TriggerOverride {
  id: string;
  enabled?: boolean;
  /** Watch paths override. Overrides TRIGGER_*_PATHS env var when set. */
  paths?: string[];
  [key: string]: unknown;
}

/**
 * Runtime trigger overrides file (`runtime/triggers/v{version}.json`).
 */
export interface TriggersRuntimeConfig {
  version: string;
  overrides: TriggerOverride[];
}

/**
 * Aggregated runtime overrides after loading all topic files.
 */
export interface RuntimeOverrides {
  version: string;
  jobs: JobOverride[];
  sagas: SagaOverride[];
  tasks: RuntimeTask[];
  features: FeatureFlag[];
  triggers: TriggerOverride[];
  updatedAt: string;
}
