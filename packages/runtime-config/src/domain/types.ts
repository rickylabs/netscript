/**
 * Runtime override domain types for hot-reloadable NetScript deployments.
 *
 * @module
 */

/**
 * Runtime config topic names backed by versioned JSON files.
 */
export const RUNTIME_CONFIG_TOPICS = [
  'jobs',
  'sagas',
  'triggers',
  'features',
  'tasks',
] as const;

/**
 * Runtime config topic name.
 */
export type RuntimeConfigTopic = typeof RUNTIME_CONFIG_TOPICS[number];

/**
 * Supported runtime task execution kinds.
 */
export const RUNTIME_TASK_RUNTIMES = [
  'deno',
  'python',
  'dotnet',
  'cmd',
  'powershell',
  'shell',
  'executable',
] as const;

/**
 * Runtime task execution kind.
 */
export type RuntimeTaskRuntime = typeof RUNTIME_TASK_RUNTIMES[number];

/**
 * Job-level runtime override loaded from `runtime/jobs/*.json`.
 */
export interface JobOverride {
  /** Stable job identifier. */
  id: string;
  /** Whether the job is enabled at runtime. */
  enabled?: boolean;
  /** Optional cron schedule override. */
  schedule?: string;
  /** Optional execution timeout in milliseconds. */
  timeout?: number;
  /** Optional retry budget override. */
  maxRetries?: number;
  /** Optional timezone used to evaluate the schedule. */
  timezone?: string;
  /** Optional concurrent execution limit. */
  concurrency?: number;
  /** Additional plugin-specific override fields. */
  [key: string]: unknown;
}

/**
 * Saga-level runtime override loaded from `runtime/sagas/*.json`.
 */
export interface SagaOverride {
  /** Stable saga identifier. */
  id: string;
  /** Whether the saga is enabled at runtime. */
  enabled?: boolean;
  /** Optional saga timeout in milliseconds. */
  timeout?: number;
  /** Optional retry budget override. */
  maxRetries?: number;
  /** Optional compensation timeout in milliseconds. */
  compensationTimeout?: number;
  /** Additional plugin-specific override fields. */
  [key: string]: unknown;
}

/**
 * Trigger-level runtime override loaded from `runtime/triggers/*.json`.
 */
export interface TriggerOverride {
  /** Stable trigger identifier. */
  id: string;
  /** Whether the trigger is enabled at runtime. */
  enabled?: boolean;
  /** Watch path override for file-based trigger processors. */
  paths?: string[];
  /** Additional plugin-specific override fields. */
  [key: string]: unknown;
}

/**
 * Feature flag loaded from `runtime/features/*.json`.
 */
export interface FeatureFlag {
  /** Stable feature flag identifier. */
  id: string;
  /** Whether the feature is enabled. */
  enabled: boolean;
  /** Optional human-readable flag description. */
  description?: string;
  /** Optional rollout percentage from 0 to 100. */
  rolloutPercentage?: number;
}

/**
 * Task definition that can be added or overridden at runtime.
 */
export interface RuntimeTask {
  /** Stable runtime task identifier. */
  id: string;
  /** Human-readable task name. */
  name: string;
  /** Optional task description. */
  description?: string;
  /** Execution runtime used by the task executor. */
  runtime: RuntimeTaskRuntime;
  /** Script, command, or executable entrypoint. */
  entrypoint: string;
  /** Whether the task is enabled at runtime. */
  enabled?: boolean;
  /** Optional execution timeout in milliseconds. */
  timeout?: number;
  /** Optional cron expression for scheduled execution. */
  schedule?: string;
  /** Additional plugin-specific task fields. */
  [key: string]: unknown;
}

/**
 * Complete runtime override snapshot.
 */
export interface RuntimeConfig {
  /** Job overrides from `runtime/jobs/*.json`. */
  jobs: JobOverride[];
  /** Saga overrides from `runtime/sagas/*.json`. */
  sagas: SagaOverride[];
  /** Trigger overrides from `runtime/triggers/*.json`. */
  triggers: TriggerOverride[];
  /** Feature flags from `runtime/features/*.json`. */
  features: FeatureFlag[];
  /** Runtime task definitions from `runtime/tasks/*.json`. */
  tasks: RuntimeTask[];
}

/**
 * Parsed `current` pointer describing the active versioned topic files.
 */
export interface VersionPointer {
  /** Optional active version label. */
  version?: string;
  /** Relative path to the active jobs file. */
  jobs?: string;
  /** Relative path to the active sagas file. */
  sagas?: string;
  /** Relative path to the active tasks file. */
  tasks?: string;
  /** Relative path to the active triggers file. */
  triggers?: string;
  /** Relative path to the active features file. */
  features?: string;
}
