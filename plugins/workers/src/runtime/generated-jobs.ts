import type { RegisterJobInput, StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';

/** Canonical project-relative path for the generated workers job registry. */
export const WORKERS_JOB_REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';

/** Generated static job definitions keyed by job id. */
export type StaticJobDefinitionRegistry = ReadonlyMap<string, RegisterJobInput>;

/** Generated workers job registry module exports consumed by service and runtime processes. */
export type GeneratedWorkersJobRegistry = Readonly<{
  definitions?: StaticJobDefinitionRegistry;
  registry?: StaticJobRegistry;
}>;

type StaticJobDefinitionRegistrar = Readonly<{
  get(id: string): Promise<unknown>;
  registerJob(input: RegisterJobInput): Promise<unknown>;
}>;

/** Loads a generated workers registry module if one exists. */
export async function loadGeneratedJobRegistry(
  registryUrl: URL,
): Promise<GeneratedWorkersJobRegistry> {
  try {
    await Deno.stat(registryUrl);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    throw error;
  }

  const module = await import(registryUrl.href) as Record<string, unknown>;
  const definitions = isStaticJobDefinitionRegistry(module.jobDefinitions)
    ? module.jobDefinitions
    : isStaticJobDefinitionRegistry(module.definitions)
    ? module.definitions
    : undefined;
  const registry = isStaticJobRegistry(module.registry) ? module.registry : undefined;

  return { definitions, registry };
}

/** Register generated static job definitions if the project emitted them. */
export async function registerStaticJobDefinitions(
  registry: StaticJobDefinitionRegistrar,
  definitions?: StaticJobDefinitionRegistry,
): Promise<void> {
  if (!definitions?.size) return;

  for (const [id, definition] of definitions) {
    const existing = await registry.get(id);
    if (existing) continue;

    try {
      await registry.registerJob({ ...definition, id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes(`Job with id '${id}' already exists`)) {
        throw error;
      }
    }
  }
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

function isStaticJobDefinitionRegistry(value: unknown): value is StaticJobDefinitionRegistry {
  return value instanceof Map;
}

function isStaticJobRegistry(value: unknown): value is StaticJobRegistry {
  return value instanceof Map;
}
