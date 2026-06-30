import type { ProcessableTriggerDefinition } from '@netscript/plugin-triggers-core/ports';
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';

export type { ProcessableTriggerDefinition } from '@netscript/plugin-triggers-core/ports';

/** Load trigger definitions from the generated project registry. */
export async function loadProjectTriggerDefinitions(
  registryModule: string = Deno.env.get('NETSCRIPT_TRIGGER_REGISTRY_MODULE') ??
    defaultRegistryModule(),
): Promise<readonly ProcessableTriggerDefinition[]> {
  if (registryModule.startsWith('file:') && !(await fileExists(fromFileUrl(registryModule)))) {
    const fallbackModule = projectTriggerBarrelModuleForMissingRegistry(registryModule);
    if (fallbackModule !== registryModule && await fileExists(fromFileUrl(fallbackModule))) {
      return loadProjectTriggerDefinitions(fallbackModule);
    }
    return [];
  }

  const module = await import(registryModule);
  return extractTriggerDefinitions(module as Record<string, unknown>);
}

/** Default trigger registry module for a generated project. */
export function defaultRegistryModule(): string {
  return toFileUrl(generatedRegistryPath(resolveProjectRoot())).href;
}

/** Default user trigger barrel module for projects without a generated registry yet. */
export function projectTriggerBarrelModule(): string {
  return toFileUrl(join(resolveProjectRoot(), 'triggers', 'mod.ts')).href;
}

function projectTriggerBarrelModuleForMissingRegistry(registryModule: string): string {
  const registryPath = fromFileUrl(registryModule);
  const suffix = join('.netscript', 'generated', 'plugin-triggers', 'triggers.registry.ts');
  if (registryPath.endsWith(suffix)) {
    return toFileUrl(join(registryPath.slice(0, -suffix.length), 'triggers', 'mod.ts')).href;
  }
  return projectTriggerBarrelModule();
}

function resolveProjectRoot(): string {
  const explicit = Deno.env.get('NETSCRIPT_PROJECT_ROOT');
  if (explicit !== undefined && explicit.trim().length > 0) {
    return resolve(explicit);
  }

  return findProjectRoot(Deno.cwd()) ?? Deno.cwd();
}

function findProjectRoot(start: string): string | undefined {
  let current = resolve(start);
  while (true) {
    if (
      fileExistsSync(generatedRegistryPath(current)) ||
      fileExistsSync(join(current, 'appsettings.json'))
    ) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

function generatedRegistryPath(projectRoot: string): string {
  return join(projectRoot, '.netscript', 'generated', 'plugin-triggers', 'triggers.registry.ts');
}

function extractTriggerDefinitions(
  module: Record<string, unknown>,
): readonly ProcessableTriggerDefinition[] {
  const registry = module.registry;
  if (registry instanceof Map) {
    return Object.freeze([...registry.values()].filter(isTriggerDefinition));
  }

  const candidates = [module.definitions, module.default, ...Object.values(module)];
  return Object.freeze(
    candidates.flatMap((candidate) => Array.isArray(candidate) ? candidate : [candidate])
      .filter(isTriggerDefinition),
  );
}

function isTriggerDefinition(value: unknown): value is ProcessableTriggerDefinition {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ProcessableTriggerDefinition>;
  return typeof candidate.id === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.handler === 'function';
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

function fileExistsSync(path: string): boolean {
  try {
    const stat = Deno.statSync(path);
    return stat.isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
