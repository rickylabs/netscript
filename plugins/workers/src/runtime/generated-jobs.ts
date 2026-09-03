import type { RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';

/** Canonical project-relative path for the generated workers job registry. */
export const WORKERS_JOB_REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';

/** Generated static job definitions keyed by job id. */
export type StaticJobDefinitionRegistry = ReadonlyMap<string, RegisterJobInput>;

/** Whether a generated registry module was found at the resolved path. */
export type GeneratedJobRegistryStatus = 'absent' | 'loaded';

/** Generated workers job registry module exports consumed by service and runtime processes. */
export type GeneratedWorkersJobRegistry = Readonly<{
  /** `loaded` when a registry module was read; `absent` when the project emitted none. */
  status: GeneratedJobRegistryStatus;
  /** Absolute URL the registry was resolved to, reported on both statuses. */
  url: URL;
  definitions?: StaticJobDefinitionRegistry;
  registry?: StaticJobRegistry;
}>;

/** Minimal runtime job-registry surface the generated-registry loaders write through. */
export type StaticJobDefinitionRegistrar = Readonly<{
  get(id: string): Promise<unknown>;
  registerJob(input: RegisterJobInput): Promise<unknown>;
}>;

/**
 * Raised when a generated job registry exists but cannot be used by the runtime.
 *
 * This is deliberately fatal. A registry that is present but unusable produces a
 * worker runtime that accepts `triggerJob` calls and then fails them with
 * `NOT_FOUND` at dispatch time — after callers have already committed their own
 * writes. Failing at startup keeps the failure in one place.
 */
export class GeneratedJobRegistryError extends Error {
  /** Absolute URL of the generated registry module that could not be used. */
  readonly registryUrl: URL;

  /** Create a generated-registry startup failure. */
  constructor(message: string, registryUrl: URL) {
    super(message);
    this.name = 'GeneratedJobRegistryError';
    this.registryUrl = registryUrl;
  }
}

/**
 * Resolve the single canonical URL of the generated workers job registry.
 *
 * Every workers entrypoint — API service, worker, scheduler, combined — must
 * resolve the registry through this function. Entrypoints that built the URL
 * themselves drifted apart: `bin/combined.ts` resolved one directory short of
 * the project root and silently ran with no user jobs.
 */
export function resolveGeneratedJobRegistryUrl(): URL {
  return projectFileUrl(WORKERS_JOB_REGISTRY_PATH);
}

/**
 * Load the generated workers registry module, or report that the project emitted none.
 *
 * @throws {GeneratedJobRegistryError} when the module exists but exposes no usable
 * `jobDefinitions` / `definitions` map — the "compiled but not loadable" state that
 * previously degraded to an empty result.
 */
export async function loadGeneratedJobRegistry(
  registryUrl: URL = resolveGeneratedJobRegistryUrl(),
): Promise<GeneratedWorkersJobRegistry> {
  try {
    await Deno.stat(registryUrl);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return Object.freeze({ status: 'absent', url: registryUrl });
    }
    throw error;
  }

  const module = await importRegistryModule(registryUrl);
  const literalDefinitions = isStaticJobDefinitionRecord(module.jobDefinitionsById)
    ? new Map(Object.entries(module.jobDefinitionsById))
    : undefined;
  const definitions = literalDefinitions ??
    (isStaticJobDefinitionRegistry(module.jobDefinitions)
      ? module.jobDefinitions
      : isStaticJobDefinitionRegistry(module.definitions)
      ? module.definitions
      : undefined);
  const registry = isStaticJobRegistry(module.registry) ? module.registry : undefined;

  if (!definitions) {
    throw new GeneratedJobRegistryError(
      `Generated workers job registry at ${registryUrl.pathname} exports no 'jobDefinitions' map. ` +
        `Regenerate it with 'netscript plugin workers compile-registry'.`,
      registryUrl,
    );
  }

  return Object.freeze({ status: 'loaded', url: registryUrl, definitions, registry });
}

/**
 * Register generated static job definitions, returning how many reached the registry.
 *
 * @returns The number of definitions present in the registry after this call.
 */
export async function registerStaticJobDefinitions(
  registry: StaticJobDefinitionRegistrar,
  definitions?: StaticJobDefinitionRegistry,
): Promise<number> {
  if (!definitions?.size) return 0;

  let present = 0;
  for (const [id, definition] of definitions) {
    const existing = await registry.get(id);
    if (existing) {
      present++;
      continue;
    }

    try {
      await registry.registerJob({ ...definition, id });
      present++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes(`Job with id '${id}' already exists`)) {
        throw error;
      }
      present++;
    }
  }
  return present;
}

/**
 * Load the project's generated jobs and register them, failing loudly on a partial load.
 *
 * This is the startup check every workers process runs. A generated registry that
 * exists but does not end up in the runtime registry is a startup failure here,
 * not a `NOT_FOUND` at call time.
 *
 * @returns The load outcome, so callers can report the resolved path.
 */
export async function registerGeneratedJobRegistry(
  registry: StaticJobDefinitionRegistrar,
  loaded: GeneratedWorkersJobRegistry,
): Promise<GeneratedWorkersJobRegistry> {
  if (loaded.status === 'absent') return loaded;

  await registerStaticJobDefinitions(registry, loaded.definitions);

  // Read back rather than trusting the write. A registry write that reports
  // success but does not land — wrong KV namespace, wrong runtime instance — is
  // exactly the state that surfaced as NOT_FOUND at dispatch time.
  const missing = await findUnregistered(registry, loaded.definitions);
  if (missing.length > 0) {
    throw new GeneratedJobRegistryError(
      `Generated workers job registry at ${loaded.url.pathname} declares ` +
        `${loaded.definitions?.size ?? 0} job(s) but ${missing.length} did not reach the runtime ` +
        `registry (missing: ${missing.join(', ')}). Dispatching them would fail with NOT_FOUND.`,
      loaded.url,
    );
  }
  return loaded;
}

/** Human-readable one-line summary of a registry load, for startup logs. */
export function describeGeneratedJobRegistry(loaded: GeneratedWorkersJobRegistry): string {
  return loaded.status === 'absent'
    ? `no generated job registry at ${loaded.url.pathname} (cwd: ${Deno.cwd()}); ` +
      `only plugin-owned jobs are registered`
    : `loaded ${loaded.definitions?.size ?? 0} generated job(s) from ${loaded.url.pathname}`;
}

/** Builds a file URL relative to the current project root. */
export function projectFileUrl(relativePath: string): URL {
  const root = Deno.cwd().replaceAll('\\', '/');
  const normalizedRoot = root.endsWith('/') ? root : `${root}/`;
  const base = normalizedRoot.startsWith('/')
    ? `file://${normalizedRoot}`
    : `file:///${normalizedRoot}`;
  return new URL(relativePath, base);
}

async function importRegistryModule(registryUrl: URL): Promise<Record<string, unknown>> {
  try {
    return await import(registryUrl.href) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new GeneratedJobRegistryError(
      `Generated workers job registry at ${registryUrl.pathname} failed to import: ${message}`,
      registryUrl,
    );
  }
}

async function findUnregistered(
  registry: StaticJobDefinitionRegistrar,
  definitions?: StaticJobDefinitionRegistry,
): Promise<readonly string[]> {
  const missing: string[] = [];
  for (const id of definitions?.keys() ?? []) {
    if (!await registry.get(id)) missing.push(id);
  }
  return missing;
}

function isStaticJobDefinitionRegistry(value: unknown): value is StaticJobDefinitionRegistry {
  return value instanceof Map;
}

function isStaticJobDefinitionRecord(
  value: unknown,
): value is Readonly<Record<string, RegisterJobInput>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    Object.values(value).every((definition) =>
      typeof definition === 'object' && definition !== null
    );
}

function isStaticJobRegistry(value: unknown): value is StaticJobRegistry {
  return value instanceof Map;
}
