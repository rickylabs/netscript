/**
 * @module infra/config/runtime-override
 *
 * Loads hot-reloadable JSON runtime overrides from .deploy/windows/config/runtime/.
 *
 * Structure:
 *   runtime/current           ← version pointer JSON
 *   runtime/jobs/v1.0.0.json  ← job overrides (schedule, timeout, enabled, ...)
 *   runtime/sagas/v1.0.0.json ← saga overrides
 *   runtime/tasks/v1.0.0.json ← additive runtime tasks
 *   runtime/features/v1.0.0.json ← feature flags
 *
 * Merge strategy: DEEP MERGE — only specified fields override.
 * Immutable fields (id, name, entrypoint) cannot be changed at runtime.
 */

import { join } from '@std/path';
import { RUNTIME_CONFIG_FILES, RUNTIME_TOPICS } from '../../constants/runtime.ts';
import type {
  FeatureFlag,
  FeaturesRuntimeConfig,
  JobOverride,
  JobsRuntimeConfig,
  RuntimeOverrides,
  RuntimeTask,
  RuntimeVersionPointer,
  SagaOverride,
  SagasRuntimeConfig,
  TasksRuntimeConfig,
  TriggerOverride,
  TriggersRuntimeConfig,
} from '../../domain/deploy/runtime-overrides.ts';

/**
 * Attempt to read and parse a JSON file.
 * Returns null if the file does not exist.
 * Throws on parse errors (malformed override files should be loud failures).
 */
async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw new Error(`Failed to parse runtime override file "${path}": ${(error as Error).message}`);
  }
}

/**
 * Load the version pointer file and return the resolved file paths for each topic.
 */
function loadVersionPointer(
  runtimeDir: string,
): Promise<RuntimeVersionPointer | null> {
  const currentPath = join(runtimeDir, RUNTIME_CONFIG_FILES.CURRENT);
  return readJsonFile<RuntimeVersionPointer>(currentPath);
}

/**
 * Load job overrides for the given version.
 */
async function loadJobOverrides(runtimeDir: string, versionFile: string): Promise<JobOverride[]> {
  const path = join(runtimeDir, RUNTIME_TOPICS.JOBS, versionFile);
  const config = await readJsonFile<JobsRuntimeConfig>(path);
  return config?.overrides ?? [];
}

/**
 * Load saga overrides for the given version.
 */
async function loadSagaOverrides(runtimeDir: string, versionFile: string): Promise<SagaOverride[]> {
  const path = join(runtimeDir, RUNTIME_TOPICS.SAGAS, versionFile);
  const config = await readJsonFile<SagasRuntimeConfig>(path);
  return config?.overrides ?? [];
}

/**
 * Load runtime tasks (additive) for the given version.
 */
async function loadRuntimeTasks(runtimeDir: string, versionFile: string): Promise<RuntimeTask[]> {
  const path = join(runtimeDir, RUNTIME_TOPICS.TASKS, versionFile);
  const config = await readJsonFile<TasksRuntimeConfig>(path);
  return config?.tasks ?? [];
}

/**
 * Load feature flags for the given version.
 */
async function loadFeatureFlags(runtimeDir: string, versionFile: string): Promise<FeatureFlag[]> {
  const path = join(runtimeDir, RUNTIME_TOPICS.FEATURES, versionFile);
  const config = await readJsonFile<FeaturesRuntimeConfig>(path);
  return config?.flags ?? [];
}

/**
 * Load trigger overrides for the given version.
 */
async function loadTriggerOverrides(
  runtimeDir: string,
  versionFile: string,
): Promise<TriggerOverride[]> {
  const path = join(runtimeDir, RUNTIME_TOPICS.TRIGGERS, versionFile);
  const config = await readJsonFile<TriggersRuntimeConfig>(path);
  return config?.overrides ?? [];
}

/**
 * Load all runtime overrides from a .deploy/windows/config/runtime/ directory.
 *
 * Returns null if the runtime directory or current pointer does not exist
 * (no overrides configured — this is a valid, common case).
 *
 * @param configDir - Absolute path to .deploy/windows/config/
 */
export async function loadRuntimeOverrides(configDir: string): Promise<RuntimeOverrides | null> {
  const runtimeDir = join(configDir, 'runtime');

  // Check if runtime directory exists
  try {
    const stat = await Deno.stat(runtimeDir);
    if (!stat.isDirectory) return null;
  } catch {
    return null;
  }

  const pointer = await loadVersionPointer(runtimeDir);
  if (!pointer) return null;

  // Load each topic file referenced by the pointer (including triggers)
  const [jobs, sagas, tasks, features, triggers] = await Promise.all([
    pointer.jobs
      ? loadJobOverrides(runtimeDir, pointer.jobs.replace(/^jobs\//, ''))
      : Promise.resolve([]),
    pointer.sagas
      ? loadSagaOverrides(runtimeDir, pointer.sagas.replace(/^sagas\//, ''))
      : Promise.resolve([]),
    pointer.tasks
      ? loadRuntimeTasks(runtimeDir, pointer.tasks.replace(/^tasks\//, ''))
      : Promise.resolve([]),
    pointer.features
      ? loadFeatureFlags(runtimeDir, pointer.features.replace(/^features\//, ''))
      : Promise.resolve([]),
    pointer.triggers
      ? loadTriggerOverrides(runtimeDir, pointer.triggers.replace(/^triggers\//, ''))
      : Promise.resolve([]),
  ]);

  return {
    version: pointer.version,
    jobs,
    sagas,
    tasks,
    features,
    triggers,
    updatedAt: pointer.updatedAt,
  };
}
