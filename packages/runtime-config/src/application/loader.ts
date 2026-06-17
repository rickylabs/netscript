import { dirname, join } from '@std/path';
import type {
  FeatureFlag,
  JobOverride,
  RuntimeConfig,
  RuntimeTask,
  SagaOverride,
  TriggerOverride,
  VersionPointer,
} from '../domain/types.ts';

const POINTER_FILE_NAME = 'current';
const DEFAULT_RUNTIME_DIR_NAME = 'runtime';

const EMPTY_RUNTIME_CONFIG: RuntimeConfig = {
  jobs: [],
  sagas: [],
  triggers: [],
  features: [],
  tasks: [],
};

/**
 * Resolve the runtime config directory from environment variables or the current working directory.
 */
export function resolveRuntimeConfigDir(): string {
  const explicit = Deno.env.get('NETSCRIPT_RUNTIME_CONFIG_DIR');
  if (explicit) return explicit;

  const tasksDir = Deno.env.get('NETSCRIPT_TASKS_DIR');
  if (tasksDir) return dirname(tasksDir);

  return join(Deno.cwd(), DEFAULT_RUNTIME_DIR_NAME);
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readPointerFile(path: string): Promise<VersionPointer | null> {
  let text: string;
  try {
    text = (await Deno.readTextFile(path)).trim();
  } catch {
    return null;
  }

  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (isVersionPointer(parsed)) {
      return parsed;
    }
  } catch {
    // Plain-text pointer files are supported below for legacy deployments.
  }

  const version = text;
  if (!/^\d+\.\d+\.\d+/.test(version)) {
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

function isVersionPointer(value: unknown): value is VersionPointer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const pointer = value as Record<string, unknown>;
  return ['version', 'jobs', 'sagas', 'tasks', 'triggers', 'features'].every((key) =>
    pointer[key] === undefined || typeof pointer[key] === 'string'
  );
}

/**
 * Load runtime overrides from the configured runtime config directory.
 *
 * Returns empty defaults when the directory, pointer file, or topic files are missing.
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const dir = resolveRuntimeConfigDir();

  const pointer = await readPointerFile(join(dir, POINTER_FILE_NAME));
  if (!pointer) {
    return EMPTY_RUNTIME_CONFIG;
  }

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
 * Check whether a feature flag is enabled, falling back when the flag is absent.
 */
export function isFeatureEnabled(
  config: RuntimeConfig,
  flagId: string,
  defaultValue = true,
): boolean {
  const flag = config.features.find((feature) => feature.id === flagId);
  return flag?.enabled ?? defaultValue;
}

/**
 * Get the override for a specific job ID.
 */
export function getJobOverride(config: RuntimeConfig, jobId: string): JobOverride | undefined {
  return config.jobs.find((job) => job.id === jobId);
}

/**
 * Get the override for a specific saga ID.
 */
export function getSagaOverride(
  config: RuntimeConfig,
  sagaId: string,
): SagaOverride | undefined {
  return config.sagas.find((saga) => saga.id === sagaId);
}

/**
 * Get the override for a specific trigger ID.
 */
export function getTriggerOverride(
  config: RuntimeConfig,
  triggerId: string,
): TriggerOverride | undefined {
  return config.triggers.find((trigger) => trigger.id === triggerId);
}

/**
 * Get a runtime task definition by ID.
 */
export function getRuntimeTask(
  config: RuntimeConfig,
  taskId: string,
): RuntimeTask | undefined {
  return config.tasks.find((task) => task.id === taskId);
}
