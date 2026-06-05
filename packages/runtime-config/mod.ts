/**
 * @module @netscript/runtime-config
 *
 * Loads hot-reloadable runtime overrides from .deploy/windows/config/runtime/
 * (copied to {installDir}/runtime/ at install time).
 *
 * Consumed by:
 * - workers/bin/combined.ts  → job overrides (enabled, schedule, timeout)
 * - sagas/bin/combined.ts    → saga overrides (enabled, timeout)
 * - plugins/triggers/src/runtime/trigger-processor.ts → trigger overrides (enabled, paths)
 *
 * Resolution order for NETSCRIPT_RUNTIME_CONFIG_DIR:
 *   1. NETSCRIPT_RUNTIME_CONFIG_DIR env var (set by servy.ts for compiled binaries)
 *   2. Parent of NETSCRIPT_TASKS_DIR (e.g. {installDir}/runtime/tasks → {installDir}/runtime)
 *   3. ./runtime (relative to cwd — dev fallback)
 *
 * All errors are handled gracefully: missing files → empty defaults, no crash.
 */

import { dirname, join } from '@std/path';

// ============================================================================
// TYPES (mirrors packages/cli/src/types/runtime-override.ts)
// ============================================================================

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

export interface SagaOverride {
  id: string;
  enabled?: boolean;
  timeout?: number;
  maxRetries?: number;
  compensationTimeout?: number;
  [key: string]: unknown;
}

export interface TriggerOverride {
  id: string;
  enabled?: boolean;
  /** Watch paths override. When set, overrides TRIGGER_*_PATHS env var. */
  paths?: string[];
  [key: string]: unknown;
}

export interface FeatureFlag {
  id: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
}

/**
 * A task definition that can be added or overridden at runtime.
 * Tasks are scripts invoked by jobs via the TaskExecutor.
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
  enabled?: boolean;
  timeout?: number;
  /**
   * Optional cron expression for scheduled execution.
   * When set, the task is auto-registered as a scheduled job so the
   * scheduler picks it up automatically on startup and hot-reload.
   *
   * @example "0 *\/6 * * *"  — every 6 hours
   * @example "*\/30 * * * *" — every 30 minutes
   */
  schedule?: string;
  [key: string]: unknown;
}

export interface RuntimeConfig {
  /** Job overrides from runtime/jobs/v*.json */
  jobs: JobOverride[];
  /** Saga overrides from runtime/sagas/v*.json */
  sagas: SagaOverride[];
  /** Trigger overrides from runtime/triggers/v*.json */
  triggers: TriggerOverride[];
  /** Feature flags from runtime/features/v*.json */
  features: FeatureFlag[];
  /** Runtime task definitions from runtime/tasks/v*.json */
  tasks: RuntimeTask[];
}

interface VersionPointer {
  version?: string;
  jobs?: string;
  sagas?: string;
  tasks?: string;
  triggers?: string;
  features?: string;
}

// ============================================================================
// EMPTY DEFAULTS
// ============================================================================

const EMPTY: RuntimeConfig = {
  jobs: [],
  sagas: [],
  triggers: [],
  features: [],
  tasks: [],
};

// ============================================================================
// DIRECTORY RESOLVER
// ============================================================================

/**
 * Resolve the runtime config directory.
 * Priority: NETSCRIPT_RUNTIME_CONFIG_DIR > parent(NETSCRIPT_TASKS_DIR) > ./runtime
 */
function resolveRuntimeConfigDir(): string {
  const explicit = Deno.env.get('NETSCRIPT_RUNTIME_CONFIG_DIR');
  if (explicit) return explicit;

  const tasksDir = Deno.env.get('NETSCRIPT_TASKS_DIR');
  if (tasksDir) return dirname(tasksDir);

  return join(Deno.cwd(), 'runtime');
}

// ============================================================================
// FILE LOADER
// ============================================================================

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Read the `current` pointer file.
 *
 * Supports two formats:
 * 1. **JSON** (preferred) — `{"version":"1.0.0","jobs":"jobs/v1.0.0.json",...}`
 * 2. **Plain text** (fallback) — just a version string like `1.0.0`
 *
 * When a plain version string is detected, topic paths are derived by
 * convention: `{topic}/v{version}.json`.
 */
async function readPointerFile(path: string): Promise<VersionPointer | null> {
  let text: string;
  try {
    text = (await Deno.readTextFile(path)).trim();
  } catch {
    return null;
  }

  if (!text) return null;

  // Try JSON first (the canonical format produced by writeRuntimeConfig)
  try {
    const parsed = JSON.parse(text) as VersionPointer;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Not valid JSON — fall through to plain-text handling
  }

  // Plain-text fallback: treat the content as a bare version string
  // and derive conventional topic paths.
  const version = text;
  if (!/^\d+\.\d+\.\d+/.test(version)) {
    // Doesn't look like a semver string — give up
    return null;
  }

  const versionFile = `v${version}.json`;
  return {
    version,
    jobs: `jobs/${versionFile}`,
    sagas: `sagas/${versionFile}`,
    tasks: `tasks/${versionFile}`,
    triggers: `triggers/${versionFile}`,
    features: `features/${versionFile}`,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Load runtime overrides from the configured runtime config directory.
 *
 * Returns empty defaults gracefully if the directory, pointer file, or any
 * topic file is missing or unparseable.
 *
 * @example
 * ```ts
 * import { loadRuntimeConfig } from '@netscript/runtime-config';
 *
 * const rt = await loadRuntimeConfig();
 * const disabledJobs = rt.jobs.filter(j => j.enabled === false).map(j => j.id);
 * ```
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const dir = resolveRuntimeConfigDir();

  // Load version pointer (supports JSON or plain-text version string)
  const pointer = await readPointerFile(join(dir, 'current'));
  if (!pointer) {
    return EMPTY;
  }

  // Load each topic file in parallel, tolerating missing files
  const [jobsFile, sagasFile, triggersFile, featuresFile, tasksFile] = await Promise.all([
    pointer.jobs ? readJsonFile<{ overrides?: JobOverride[] }>(join(dir, pointer.jobs)) : null,
    pointer.sagas ? readJsonFile<{ overrides?: SagaOverride[] }>(join(dir, pointer.sagas)) : null,
    pointer.triggers
      ? readJsonFile<{ overrides?: TriggerOverride[] }>(join(dir, pointer.triggers))
      : null,
    pointer.features ? readJsonFile<{ flags?: FeatureFlag[] }>(join(dir, pointer.features)) : null,
    pointer.tasks ? readJsonFile<{ tasks?: RuntimeTask[] }>(join(dir, pointer.tasks)) : null,
  ]);

  return {
    jobs: jobsFile?.overrides ?? [],
    sagas: sagasFile?.overrides ?? [],
    triggers: triggersFile?.overrides ?? [],
    features: featuresFile?.flags ?? [],
    tasks: tasksFile?.tasks ?? [],
  };
}

/**
 * Check if a feature flag is enabled in the loaded config.
 * Returns `defaultValue` (true) if the flag is not listed.
 */
export function isFeatureEnabled(
  config: RuntimeConfig,
  flagId: string,
  defaultValue = true,
): boolean {
  const flag = config.features.find((f) => f.id === flagId);
  return flag?.enabled ?? defaultValue;
}

/**
 * Get the override for a specific job ID, or undefined if not found.
 */
export function getJobOverride(config: RuntimeConfig, jobId: string): JobOverride | undefined {
  return config.jobs.find((j) => j.id === jobId);
}

/**
 * Get the override for a specific saga ID, or undefined if not found.
 */
export function getSagaOverride(
  config: RuntimeConfig,
  sagaId: string,
): SagaOverride | undefined {
  return config.sagas.find((s) => s.id === sagaId);
}

/**
 * Get the override for a specific trigger ID, or undefined if not found.
 */
export function getTriggerOverride(
  config: RuntimeConfig,
  triggerId: string,
): TriggerOverride | undefined {
  return config.triggers.find((t) => t.id === triggerId);
}

/**
 * Get a runtime task definition by ID, or undefined if not found.
 */
export function getRuntimeTask(
  config: RuntimeConfig,
  taskId: string,
): RuntimeTask | undefined {
  return config.tasks.find((t) => t.id === taskId);
}

// ============================================================================
// HOT-RELOAD WATCHER
// ============================================================================

/**
 * Watch the runtime config directory for changes and invoke `onChange` with
 * the reloaded config whenever a file is modified.
 *
 * Uses `Deno.watchFs()` to detect changes to any `.json` file inside the
 * runtime config directory (including subdirectories). Debounces rapid
 * successive events with a 300 ms delay to avoid multiple reloads per save.
 *
 * The watcher runs until `signal` is aborted (pass the same AbortController
 * signal used for graceful shutdown).
 *
 * @example
 * ```ts
 * const ac = new AbortController();
 * watchRuntimeConfig(async (config) => {
 *   await applyOverrides(config);
 * }, { signal: ac.signal, prefix: '[Workers]' });
 * ```
 */
export function watchRuntimeConfig(
  onChange: (config: RuntimeConfig) => Promise<void>,
  options: { signal?: AbortSignal; prefix?: string } = {},
): void {
  const { signal, prefix = '[runtime-config]' } = options;
  const dir = resolveRuntimeConfigDir();

  // Check if the directory exists before watching
  (async () => {
    try {
      await Deno.stat(dir);
    } catch {
      console.warn(`${prefix} Runtime config dir not found, hot-reload disabled: ${dir}`);
      return;
    }

    console.log(`${prefix} Watching runtime config for changes: ${dir}`);

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const watcher = Deno.watchFs(dir, { recursive: true });

      // Stop watcher when signal fires
      if (signal) {
        signal.addEventListener('abort', () => watcher.close(), { once: true });
      }

      for await (const event of watcher) {
        // Only react to modify/create/remove events — filter out access/other
        if (event.kind !== 'modify' && event.kind !== 'create' && event.kind !== 'remove') continue;

        // On Windows, Deno.watchFs may report the parent directory path rather
        // than the specific file. Accept events where any path ends in .json OR
        // is a subdirectory of the watched dir (all files here are JSON).
        const isRelevant = event.paths.some(
          (p) => p.endsWith('.json') || p.startsWith(dir),
        );
        if (!isRelevant) continue;

        // Debounce: wait 300 ms for rapid successive saves to settle
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
          debounceTimer = null;
          console.log(`${prefix} Runtime config changed, reloading...`);
          const config = await loadRuntimeConfig();
          logRuntimeConfigSummary(config, prefix);
          try {
            await onChange(config);
          } catch (err) {
            console.error(`${prefix} Error applying runtime config reload:`, err);
          }
        }, 300);
      }
    } catch (err) {
      if (signal?.aborted) return; // Expected on shutdown
      console.error(`${prefix} Runtime config watcher error:`, err);
    }
  })();
}

/**
 * Log a summary of active runtime overrides to the console.
 * Useful at binary startup to confirm config was loaded.
 */
export function logRuntimeConfigSummary(config: RuntimeConfig, prefix = '[runtime-config]'): void {
  const dir = resolveRuntimeConfigDir();
  const disabledJobs = config.jobs.filter((j) => j.enabled === false).map((j) => j.id);
  const disabledSagas = config.sagas.filter((s) => s.enabled === false).map((s) => s.id);
  const disabledTriggers = config.triggers.filter((t) => t.enabled === false).map((t) => t.id);
  const disabledFeatures = config.features.filter((f) => !f.enabled).map((f) => f.id);

  console.log(`${prefix} Loaded from: ${dir}`);

  if (disabledJobs.length > 0) {
    console.log(`${prefix} Disabled jobs: ${disabledJobs.join(', ')}`);
  }
  if (disabledSagas.length > 0) {
    console.log(`${prefix} Disabled sagas: ${disabledSagas.join(', ')}`);
  }
  if (disabledTriggers.length > 0) {
    console.log(`${prefix} Disabled triggers: ${disabledTriggers.join(', ')}`);
  }
  if (disabledFeatures.length > 0) {
    console.log(`${prefix} Disabled features: ${disabledFeatures.join(', ')}`);
  }

  const triggerPathOverrides = config.triggers.filter((t) => t.paths && t.paths.length > 0);
  for (const t of triggerPathOverrides) {
    console.log(`${prefix} Trigger '${t.id}' paths overridden: ${t.paths!.join('; ')}`);
  }
}
