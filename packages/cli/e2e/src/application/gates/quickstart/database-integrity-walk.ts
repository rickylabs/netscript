import { resolve } from '@std/path';

interface ContainerInspect {
  readonly Id: string;
  readonly Config: { readonly Image: string };
  readonly Mounts: readonly { readonly Source: string; readonly Destination: string }[];
}

interface IntegrityState {
  readonly containerId: string;
  readonly image: string;
  readonly source: string;
  readonly destination: string;
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
  const state: IntegrityState = {
    containerId: resident.Id,
    image: resident.Config.Image,
    source: mount.Source,
    destination: mount.Destination,
  };
  await Deno.writeTextFile(resolve(projectRoot, STATE_FILE), JSON.stringify(state));
}

/** After Aspire teardown, validate the same PGDATA checkpoint without starting a postmaster. */
export async function verifyPgDataAfterTeardown(projectRoot: string): Promise<void> {
  const statePath = resolve(projectRoot, STATE_FILE);
  const state = JSON.parse(await Deno.readTextFile(statePath)) as IntegrityState;
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
      state.destination,
    ], projectRoot);
  } finally {
    await Deno.remove(statePath).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
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
