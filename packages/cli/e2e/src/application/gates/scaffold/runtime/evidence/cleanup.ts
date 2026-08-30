import { dirname } from '@std/path';

export const ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel';
export const ASPIRE_DCP_APPHOST_PATH = 'ASPIRE_DCP_APPHOST_PATH';
interface ContainerEvidence {
  readonly id: string;
}
interface ProcessEvidence {
  readonly pid: number;
}

/** S7-compatible ownership classification retained by the cleanup receipt. */
export interface PostStopProbeEvaluation {
  readonly ownedContainers: readonly ContainerEvidence[];
  readonly foreignContainers: readonly ContainerEvidence[];
  readonly unprovenContainers: readonly ContainerEvidence[];
  readonly ownedProcesses: readonly ProcessEvidence[];
  readonly foreignProcesses: readonly ProcessEvidence[];
}

/** Classify fixture or live probe data with S7's label, env, argv, and process-name evidence. */
export function evaluatePostStopProbe(value: unknown, appHost: string): PostStopProbeEvaluation {
  const root = record(value, 'post-stop probe');
  const ownedContainers: ContainerEvidence[] = [];
  const foreignContainers: ContainerEvidence[] = [];
  const unprovenContainers: ContainerEvidence[] = [];
  for (const candidate of arrayField(root, 'containers')) {
    const container = record(candidate, 'container');
    const id = firstString(container, ['Id', 'ID', 'id']);
    if (!id) throw new Error('container omitted id');
    const source = containerAppHostSource(container);
    if (!source) unprovenContainers.push({ id });
    else if (samePath(source, dirname(appHost)) || samePath(source, appHost)) {
      ownedContainers.push({ id });
    } else foreignContainers.push({ id });
  }
  const ownedProcesses: ProcessEvidence[] = [];
  const foreignProcesses: ProcessEvidence[] = [];
  for (const candidate of arrayField(root, 'processes')) {
    const process = record(candidate, 'process');
    const pid = numberField(process, 'pid');
    const argv = stringArray(process, 'argv');
    const environment = stringArray(process, 'environment');
    const processName = argv[0] ?? '';
    const appHostArgument = valueAfter(argv, '--apphost');
    const envAppHost = environment.find((entry) => entry.startsWith(`${ASPIRE_DCP_APPHOST_PATH}=`))
      ?.slice(ASPIRE_DCP_APPHOST_PATH.length + 1);
    if (processName !== 'aspire' && processName !== 'aspire-managed' && processName !== 'dcp') {
      continue;
    }
    const evidence = appHostArgument ?? envAppHost;
    if (evidence && samePath(evidence, appHost)) ownedProcesses.push({ pid });
    else if (evidence) foreignProcesses.push({ pid });
  }
  return {
    ownedContainers,
    foreignContainers,
    unprovenContainers,
    ownedProcesses,
    foreignProcesses,
  };
}

/** Stop one exact AppHost, force only for cleanup runs, then prove no owned container remains. */
export async function stopAndProbe(
  appHost: string,
  cleanup: boolean,
  receiptPath: string,
): Promise<void> {
  const commands = [stopCommand(appHost, false), ...(cleanup ? [stopCommand(appHost, true)] : [])];
  const transcripts = [];
  for (const command of commands) {
    transcripts.push(await run(command[0] ?? 'aspire', command.slice(1)));
  }
  const idsOutput = await run('docker', ['ps', '-aq']);
  const ids = idsOutput.stdout.split(/\s+/).filter(Boolean);
  const containers: unknown[] = [];
  for (const id of ids) {
    const inspection = await run('docker', ['inspect', id]);
    const parsed: unknown = JSON.parse(inspection.stdout);
    if (!Array.isArray(parsed)) throw new Error(`docker inspect ${id} did not return an array`);
    containers.push(...parsed);
  }
  const probe = { appHost, containers, processes: [] };
  const evaluation = evaluatePostStopProbe(probe, appHost);
  const receipt = {
    appHost,
    cleanup,
    commands,
    transcripts,
    docker: { ids: idsOutput, containers },
    evaluation,
  };
  await Deno.mkdir(dirname(receiptPath), { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  if (evaluation.ownedContainers.length > 0) {
    throw new Error(
      `post-stop probe found owned containers: ${
        evaluation.ownedContainers.map((entry) => entry.id).join(', ')
      }`,
    );
  }
}

export function stopCommand(appHost: string, force: boolean): readonly string[] {
  return [
    'aspire',
    'stop',
    ...(force ? ['--force'] : []),
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ];
}

async function run(
  command: string,
  args: readonly string[],
): Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }> {
  const output = await new Deno.Command(command, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const result = {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
  if (!output.success) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${output.code}): ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

function containerAppHostSource(container: Record<string, unknown>): string | undefined {
  const config = optionalRecord(Reflect.get(container, 'Config'));
  const labels = config ? optionalRecord(Reflect.get(config, 'Labels')) : undefined;
  const mount = labels ? Reflect.get(labels, ASPIRE_MOUNTS) : undefined;
  if (typeof mount === 'string') {
    return mount.split(',').find((part) => part.startsWith('src='))?.slice(4);
  }
  const environment = config ? Reflect.get(config, 'Env') : undefined;
  if (Array.isArray(environment)) {
    return environment.find((entry) =>
      typeof entry === 'string' && entry.startsWith(`${ASPIRE_DCP_APPHOST_PATH}=`)
    )?.slice(ASPIRE_DCP_APPHOST_PATH.length + 1);
  }
  return undefined;
}

function samePath(left: string, right: string): boolean {
  return left.replaceAll('\\', '/').replace(/\/$/, '') ===
    right.replaceAll('\\', '/').replace(/\/$/, '');
}
function valueAfter(values: readonly string[], flag: string): string | undefined {
  const index = values.indexOf(flag);
  return index < 0 ? undefined : values[index + 1];
}
function firstString(source: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (typeof value === 'string') return value;
  }
  return undefined;
}
function numberField(source: Record<string, unknown>, key: string): number {
  const value = Reflect.get(source, key);
  if (typeof value !== 'number') throw new Error(`${key} is not a number`);
  return value;
}
function stringArray(source: Record<string, unknown>, key: string): string[] {
  const value = Reflect.get(source, key);
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`${key} is not a string array`);
  }
  return value;
}
function arrayField(source: Record<string, unknown>, key: string): unknown[] {
  const value = Reflect.get(source, key);
  if (!Array.isArray(value)) throw new Error(`${key} is not an array`);
  return value;
}
function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value === null || typeof value !== 'object' || Array.isArray(value)
    ? undefined
    : Object.fromEntries(Object.entries(value));
}
function record(value: unknown, label: string): Record<string, unknown> {
  const result = optionalRecord(value);
  if (!result) throw new Error(`${label} is not an object`);
  return result;
}

if (import.meta.main) {
  const [appHost, cleanupValue, receiptPath] = Deno.args;
  if (!appHost || !cleanupValue || !receiptPath) {
    throw new Error('cleanup requires AppHost, cleanup boolean, and receipt path');
  }
  await stopAndProbe(appHost, cleanupValue === 'true', receiptPath);
}
