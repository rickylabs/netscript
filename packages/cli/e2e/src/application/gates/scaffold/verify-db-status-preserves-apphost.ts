import { resolve } from '@std/path';

interface AspireProcess {
  readonly appHostPath?: string;
  readonly appHostPid?: number;
  readonly cliPid?: number;
  readonly dashboardUrl?: string;
}

const [projectRoot, repoRoot, appHostArgument, database = 'postgres'] = Deno.args;
if (!projectRoot || !repoRoot || !appHostArgument) {
  throw new Error('project root, repository root, and AppHost path are required');
}

const appHostPath = await canonicalPath(appHostArgument);
const before = await findResident(appHostPath);
await runDbStatus(projectRoot, repoRoot, database);
const after = await findResident(appHostPath);
const operationAppHostPath = resolve(projectRoot, 'aspire', 'db-operation', 'apphost.mts');

assertStable('appHostPid', before.appHostPid, after.appHostPid);
assertStable('cliPid', before.cliPid, after.cliPid);
assertStable('dashboardUrl', before.dashboardUrl, after.dashboardUrl);
await assertResidentBackchannel(appHostPath);
await assertOperationAppHostRetired(operationAppHostPath);
await assertPathAbsent(resolve(projectRoot, 'aspire', 'db-operation'));
await assertPathAbsent(resolve(operationAppHostPath, '..', '.netscript-db-operation.json'));

console.info(
  `db status preserved resident AppHost pid=${after.appHostPid} cliPid=${after.cliPid} dashboard=${after.dashboardUrl}`,
);

async function findResident(path: string): Promise<AspireProcess> {
  const { output, processes } = await listAppHosts();
  let resident: AspireProcess | undefined;
  for (const entry of processes) {
    if (
      typeof entry.appHostPath === 'string' &&
      await canonicalPath(entry.appHostPath) === path
    ) {
      resident = entry;
      break;
    }
  }
  if (!resident) {
    throw new Error(`resident AppHost ${path} was absent from aspire ps: ${output}`);
  }
  if (typeof resident.appHostPid !== 'number' || typeof resident.cliPid !== 'number') {
    throw new Error(
      `resident AppHost did not expose process identity: ${JSON.stringify(resident)}`,
    );
  }
  return resident;
}

async function listAppHosts(): Promise<{ output: string; processes: AspireProcess[] }> {
  const output = await run('aspire', [
    'ps',
    '--format',
    'Json',
    '--non-interactive',
    '--nologo',
  ]);
  const processes = JSON.parse(output) as AspireProcess[];
  return { output, processes };
}

async function assertOperationAppHostRetired(path: string): Promise<void> {
  const { output, processes } = await listAppHosts();
  for (const entry of processes) {
    if (
      typeof entry.appHostPath === 'string' &&
      await canonicalPath(entry.appHostPath) === path
    ) {
      throw new Error(
        `db-operation AppHost survived db status: ${JSON.stringify(entry)}; aspire ps: ${output}`,
      );
    }
  }
}

async function assertPathAbsent(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
  throw new Error(`db-operation artifact survived db status: ${path}`);
}

async function runDbStatus(root: string, repository: string, target: string): Promise<void> {
  const cli = `${repository}/packages/cli/bin/netscript-dev.ts`;
  await run('deno', [
    'run',
    '-A',
    cli,
    'db',
    'status',
    '--project-root',
    root,
    '--db',
    target,
  ], root);
}

async function assertResidentBackchannel(path: string): Promise<void> {
  const output = await run('aspire', [
    'describe',
    '--apphost',
    path,
    '--format',
    'Json',
    '--non-interactive',
    '--nologo',
  ]);
  const topology = JSON.parse(output) as unknown;
  if (!Array.isArray(topology) && !isRecord(topology)) {
    throw new Error(`resident AppHost backchannel returned invalid topology: ${output}`);
  }
}

function assertStable(field: string, before: unknown, after: unknown): void {
  if (before !== after) {
    throw new Error(`resident AppHost ${field} changed across db status: ${before} -> ${after}`);
  }
}

async function run(command: string, args: string[], cwd?: string): Promise<string> {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (!output.success) {
    throw new Error(`${command} ${args.join(' ')} failed (${output.code}): ${stderr || stdout}`);
  }
  return stdout;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function canonicalPath(path: string): Promise<string> {
  try {
    return await Deno.realPath(path);
  } catch {
    return resolve(path);
  }
}
