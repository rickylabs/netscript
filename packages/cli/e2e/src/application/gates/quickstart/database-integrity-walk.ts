import { join, resolve } from '@std/path';

interface ContainerInspect {
  readonly Id: string;
  readonly Config: {
    readonly Image: string;
    readonly Env?: readonly string[];
  };
  readonly Mounts: readonly { readonly Source: string; readonly Destination: string }[];
}

interface IntegrityState {
  readonly containerId: string;
  readonly image: string;
  readonly source: string;
  readonly destination: string;
  /** Absolute path inside the verification container where pg_control lives. */
  readonly pgDataPath: string;
}

const STATE_FILE = '.netscript-quickstart-pgdata.json';

/** Run the documented DB workflow while proving one resident container owns PGDATA. */
export async function runDatabaseIntegrityWalk(
  projectRoot: string,
  cliSpecifier: string,
): Promise<void> {
  const expectedSource = resolve(projectRoot, '.data', 'postgres');
  const resident = await requireSolePgDataOwner(expectedSource);
  for (
    const args of [
      ['init', '--name', 'init'],
      ['generate'],
      ['seed'],
    ]
  ) {
    await run([
      'deno',
      'run',
      '-A',
      '--minimum-dependency-age=0',
      cliSpecifier,
      'db',
      ...args,
      '--project-root',
      projectRoot,
      '--db',
      'postgres',
    ], projectRoot);
    const current = await requireSolePgDataOwner(expectedSource);
    if (current.Id !== resident.Id) {
      throw new Error(
        `resident Postgres changed during db ${args[0]} (${resident.Id} -> ${current.Id})`,
      );
    }
  }
  const mount = resident.Mounts.find((candidate) => resolve(candidate.Source) === expectedSource)!;
  // Postgres 18 nests the cluster under <mount>/<major>/docker when the bind target is the
  // image volume root (/var/lib/postgresql). The real PGDATA directory is mode 700 (postgres),
  // so host-side walks from the runner user cannot see global/pg_control. Prefer the container's
  // own PGDATA env, then a root one-shot find on the bind mount.
  const pgDataPath = await resolvePgDataPath({
    containerId: resident.Id,
    image: resident.Config.Image,
    source: mount.Source,
    destination: mount.Destination,
    env: resident.Config.Env ?? [],
  });
  const state: IntegrityState = {
    containerId: resident.Id,
    image: resident.Config.Image,
    source: mount.Source,
    destination: mount.Destination,
    pgDataPath,
  };
  await Deno.writeTextFile(resolve(projectRoot, STATE_FILE), JSON.stringify(state));
}

/** After Aspire teardown, validate the same PGDATA checkpoint without starting a postmaster. */
export async function verifyPgDataAfterTeardown(projectRoot: string): Promise<void> {
  const statePath = resolve(projectRoot, STATE_FILE);
  const state = JSON.parse(await Deno.readTextFile(statePath)) as IntegrityState;
  const pgDataPath = state.pgDataPath ??
    await resolvePgDataPath({
      image: state.image,
      source: state.source,
      destination: state.destination,
      env: [],
    });
  try {
    await run([
      'docker',
      'run',
      '--rm',
      '--entrypoint',
      'pg_controldata',
      '--mount',
      `type=bind,source=${state.source},target=${state.destination},readonly`,
      state.image,
      pgDataPath,
    ], projectRoot);
  } finally {
    await Deno.remove(statePath).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

export interface ResolvePgDataOptions {
  readonly containerId?: string;
  readonly image: string;
  readonly source: string;
  readonly destination: string;
  readonly env: readonly string[];
}

/**
 * Resolve the absolute container path that holds `global/pg_control`.
 *
 * Order:
 * 1. `PGDATA=...` from the running container's env (authoritative while the postmaster is up).
 * 2. Root one-shot `find` on the bind mount (works after teardown; host user cannot read mode 700).
 * 3. Host tree walk (only when the runner can read the cluster — flat layouts / loosened perms).
 */
export async function resolvePgDataPath(options: ResolvePgDataOptions): Promise<string> {
  const fromEnv = pgDataFromEnv(options.env);
  if (fromEnv) return fromEnv;

  if (options.containerId) {
    const fromExec = await pgDataFromContainerExec(options.containerId);
    if (fromExec) return fromExec;
  }

  const fromFind = await pgDataFromMountFind(options.image, options.source, options.destination);
  if (fromFind) return fromFind;

  const hostPgData = findHostPgData(options.source);
  if (hostPgData) {
    const relative = hostPgData.slice(resolve(options.source).length).replace(/^[/\\]+/, '');
    return relative.length === 0
      ? options.destination
      : join(options.destination, relative).replaceAll('\\', '/');
  }

  throw new Error(
    `no global/pg_control under ${options.source}; cannot locate PGDATA for pg_controldata`,
  );
}

/** Pure helper for tests — parse PGDATA out of a docker inspect Env array. */
export function pgDataFromEnv(env: readonly string[]): string | undefined {
  for (const entry of env) {
    if (entry.startsWith('PGDATA=')) {
      const value = entry.slice('PGDATA='.length).trim();
      if (value.length > 0) return value;
    }
  }
  return undefined;
}

async function pgDataFromContainerExec(containerId: string): Promise<string | undefined> {
  try {
    const value = (await output(['docker', 'exec', containerId, 'printenv', 'PGDATA'])).trim();
    return value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

async function pgDataFromMountFind(
  image: string,
  source: string,
  destination: string,
): Promise<string | undefined> {
  try {
    const raw = await output([
      'docker',
      'run',
      '--rm',
      '--entrypoint',
      'find',
      '--mount',
      `type=bind,source=${source},target=${destination},readonly`,
      image,
      destination,
      '-path',
      '*/global/pg_control',
      '-type',
      'f',
      '-print',
    ]);
    const controls = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (controls.length === 0) return undefined;
    // Prefer the shallowest control file (fewest path segments after the mount destination).
    controls.sort((a, b) => a.split('/').length - b.split('/').length);
    const control = controls[0]!;
    const suffix = '/global/pg_control';
    if (!control.endsWith(suffix)) return undefined;
    return control.slice(0, -suffix.length);
  } catch {
    return undefined;
  }
}

function findHostPgData(source: string): string | undefined {
  const root = resolve(source);
  const queue: Array<{ path: string; depth: number }> = [{ path: root, depth: 0 }];
  let best: { path: string; depth: number } | undefined;
  // Cap depth: PG 18 nests at <mount>/<major>/docker (depth 2). Anything deeper is noise.
  const maxDepth = 4;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const control = join(current.path, 'global', 'pg_control');
    try {
      const stat = Deno.statSync(control);
      if (stat.isFile) {
        if (!best || current.depth < best.depth) best = current;
        continue;
      }
    } catch (error) {
      if (
        !(error instanceof Deno.errors.NotFound) && !(error instanceof Deno.errors.PermissionDenied)
      ) {
        throw error;
      }
    }
    if (current.depth >= maxDepth) continue;
    try {
      for (const entry of Deno.readDirSync(current.path)) {
        if (!entry.isDirectory) continue;
        queue.push({ path: join(current.path, entry.name), depth: current.depth + 1 });
      }
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied || error instanceof Deno.errors.NotFound) {
        continue;
      }
      throw error;
    }
  }
  return best?.path;
}

async function requireSolePgDataOwner(expectedSource: string): Promise<ContainerInspect> {
  const ids = (await output(['docker', 'ps', '--quiet'])).trim().split(/\r?\n/).filter(Boolean);
  if (ids.length === 0) {
    throw new Error('no running containers found while checking resident PGDATA');
  }
  const inspected = JSON.parse(await output(['docker', 'inspect', ...ids])) as ContainerInspect[];
  const owners = inspected.filter((container) =>
    container.Mounts.some((mount) => resolve(mount.Source) === expectedSource)
  );
  if (owners.length !== 1) {
    throw new Error(
      `expected exactly one running Postgres owner for ${expectedSource}; found ${owners.length}`,
    );
  }
  return owners[0];
}

async function output(command: readonly string[]): Promise<string> {
  const [executable, ...args] = command;
  const result = await new Deno.Command(executable, { args, stdout: 'piped', stderr: 'piped' })
    .output();
  if (!result.success) {
    throw new Error(
      `${command.join(' ')} failed (${result.code}): ${new TextDecoder().decode(result.stderr)}`,
    );
  }
  return new TextDecoder().decode(result.stdout);
}

async function run(command: readonly string[], cwd: string): Promise<void> {
  const [executable, ...args] = command;
  const status = await new Deno.Command(executable, {
    args,
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!status.success) throw new Error(`${command.join(' ')} failed (${status.code})`);
}

if (import.meta.main) {
  const [mode, projectRoot, cliSpecifier] = Deno.args;
  if (!projectRoot) throw new Error('mode and projectRoot are required');
  if (mode === 'run' && cliSpecifier) await runDatabaseIntegrityWalk(projectRoot, cliSpecifier);
  else if (mode === 'verify') await verifyPgDataAfterTeardown(projectRoot);
  else throw new Error(`unknown database integrity mode: ${mode}`);
}
