import { dirname, join, resolve } from '@std/path';
import { type RegistryIdentityView, validOwnedRoot } from './ownership.ts';

export const RUN_RESOURCES_SCHEMA_VERSION = 2 as const;
/** v1 registries predate `ownedRoots`; they read as an empty list rather than failing the run. */
const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = [1, RUN_RESOURCES_SCHEMA_VERSION];
export const RUN_RESOURCES_FILE = 'run-resources.json';

export interface RegisteredAppHost {
  readonly appHostPath: string;
  readonly appHostPid: number;
  readonly appHostStartedAt: string;
  readonly startedAt: string;
}

export interface RegisteredContainer {
  readonly id: string;
  readonly creatorPid: number;
  readonly creatorProcessStartTime: string;
  readonly startedAt: string;
}

export interface RunResourceRegistry extends RegistryIdentityView {
  readonly schemaVersion: typeof RUN_RESOURCES_SCHEMA_VERSION;
  readonly worktreeRoot: string;
  readonly appHosts: readonly RegisteredAppHost[];
  readonly containers: readonly RegisteredContainer[];
  readonly ownedRoots: readonly string[];
}

/** Creates an empty registry for one run/worktree. */
export function emptyRunResources(worktreeRoot: string): RunResourceRegistry {
  return {
    schemaVersion: RUN_RESOURCES_SCHEMA_VERSION,
    worktreeRoot,
    appHosts: [],
    containers: [],
    ownedRoots: [],
  };
}

function validRegistry(value: unknown): value is Omit<RunResourceRegistry, 'schemaVersion'> {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.schemaVersion === 'number' &&
    SUPPORTED_SCHEMA_VERSIONS.includes(item.schemaVersion) &&
    typeof item.worktreeRoot === 'string' && Array.isArray(item.appHosts) &&
    Array.isArray(item.containers) &&
    (item.ownedRoots === undefined || Array.isArray(item.ownedRoots));
}

/** Reads a registry, returning an empty fail-closed registry when it is absent. */
export async function readRunResources(
  sliceDir: string,
  worktreeRoot: string,
): Promise<RunResourceRegistry> {
  try {
    const parsed: unknown = JSON.parse(await Deno.readTextFile(join(sliceDir, RUN_RESOURCES_FILE)));
    if (!validRegistry(parsed) || parsed.worktreeRoot !== worktreeRoot) {
      throw new Error('run resource registry schema or worktree mismatch');
    }
    return {
      ...parsed,
      schemaVersion: RUN_RESOURCES_SCHEMA_VERSION,
      ownedRoots: (parsed.ownedRoots ?? []).filter(validOwnedRoot),
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return emptyRunResources(worktreeRoot);
    throw error;
  }
}

/** Atomically writes the schema-versioned registry with a same-directory rename. */
export async function writeRunResources(
  sliceDir: string,
  registry: RunResourceRegistry,
): Promise<void> {
  await Deno.mkdir(sliceDir, { recursive: true });
  const target = join(sliceDir, RUN_RESOURCES_FILE);
  const temporary = `${target}.${crypto.randomUUID()}.tmp`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(registry, null, 2)}\n`);
  await Deno.rename(temporary, target);
}

/** Registers one AppHost identity without duplicating its identity pair. */
export async function registerAppHost(
  sliceDir: string,
  worktreeRoot: string,
  appHost: RegisteredAppHost,
): Promise<void> {
  const registry = await readRunResources(sliceDir, worktreeRoot);
  const appHosts = registry.appHosts.filter((entry) =>
    entry.appHostPid !== appHost.appHostPid || entry.appHostStartedAt !== appHost.appHostStartedAt
  );
  await writeRunResources(sliceDir, { ...registry, appHosts: [...appHosts, appHost] });
}

/** Registers one container identity without duplicating its identity pair. */
export async function registerContainer(
  sliceDir: string,
  worktreeRoot: string,
  container: RegisteredContainer,
): Promise<void> {
  const registry = await readRunResources(sliceDir, worktreeRoot);
  const containers = registry.containers.filter((entry) =>
    entry.creatorPid !== container.creatorPid ||
    entry.creatorProcessStartTime !== container.creatorProcessStartTime
  );
  await writeRunResources(sliceDir, { ...registry, containers: [...containers, container] });
}

/**
 * Registers a directory the run created outside its worktree so resources rooted there keep path
 * proof. Rejects roots broad enough to claim another run's resources.
 */
export async function registerOwnedRoot(
  sliceDir: string,
  worktreeRoot: string,
  root: string,
): Promise<void> {
  const normalized = resolve(root);
  if (!validOwnedRoot(normalized)) {
    throw new Error(`refusing to register owned root: ${root}`);
  }
  const registry = await readRunResources(sliceDir, worktreeRoot);
  if (registry.ownedRoots.includes(normalized)) return;
  await writeRunResources(sliceDir, {
    ...registry,
    ownedRoots: [...registry.ownedRoots, normalized],
  });
}

/** Resolves the slice directory containing a registry file. */
export function registrySliceDir(registryPath: string): string {
  return dirname(registryPath);
}
