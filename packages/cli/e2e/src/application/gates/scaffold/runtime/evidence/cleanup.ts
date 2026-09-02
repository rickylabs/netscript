import { basename, dirname, isAbsolute, relative, resolve } from '@std/path';

export const ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel';
export const ASPIRE_CREATOR_PID = 'com.microsoft.developer.usvc-dev.creatorProcessId';
export const ASPIRE_DCP_APPHOST_PATH = 'ASPIRE_DCP_APPHOST_PATH';
interface ContainerEvidence {
  readonly id: string;
  readonly creatorProcessId?: string;
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
  /** Matching processes whose AppHost path could not be established either way. */
  readonly unprovenProcesses: readonly ProcessEvidence[];
}

/** Returns true only when an absolute candidate path is contained by root on path boundaries. */
export function pathContained(candidate: string, root: string): boolean {
  if (!isAbsolute(candidate) || !isAbsolute(root)) return false;
  const delta = relative(resolve(root), resolve(candidate));
  return delta === '' || (!delta.startsWith('..') && !isAbsolute(delta));
}

/** Classify fixture or live probe data with S7's label, env, argv, and process-name evidence. */
export function evaluatePostStopProbe(
  value: unknown,
  projectRoot: string,
): PostStopProbeEvaluation {
  const root = record(value, 'post-stop probe');
  const ownedContainers: ContainerEvidence[] = [];
  const foreignContainers: ContainerEvidence[] = [];
  const unprovenContainers: ContainerEvidence[] = [];
  for (const candidate of arrayField(root, 'containers')) {
    const container = record(candidate, 'container');
    const id = firstString(container, ['Id', 'ID', 'id']);
    if (!id) throw new Error('container omitted id');
    const creatorProcessId = containerCreatorProcessId(container);
    const evidence = { id, ...(creatorProcessId ? { creatorProcessId } : {}) };
    const source = containerAppHostSource(container);
    if (!source || !isAbsolute(source)) unprovenContainers.push(evidence);
    else if (pathContained(source, projectRoot)) ownedContainers.push(evidence);
    else foreignContainers.push(evidence);
  }
  const ownedProcesses: ProcessEvidence[] = [];
  const foreignProcesses: ProcessEvidence[] = [];
  const unprovenProcesses: ProcessEvidence[] = [];
  for (const candidate of arrayField(root, 'processes')) {
    const process = record(candidate, 'process');
    const pid = numberField(process, 'pid');
    const argv = stringArray(process, 'argv');
    const environment = stringArray(process, 'environment');
    const processName = basename(argv[0] ?? '').toLowerCase();
    const appHostArgument = valueAfter(argv, '--apphost');
    const envAppHost = environment.find((entry) => entry.startsWith(`${ASPIRE_DCP_APPHOST_PATH}=`))
      ?.slice(ASPIRE_DCP_APPHOST_PATH.length + 1);
    if (
      processName !== 'aspire' && processName !== 'aspire.exe' &&
      processName !== 'aspire-managed' && processName !== 'dcp' &&
      !processName.endsWith('.dcp.dll')
    ) {
      continue;
    }
    const evidence = appHostArgument ?? envAppHost;
    if (evidence && pathContained(evidence, projectRoot)) ownedProcesses.push({ pid });
    else if (evidence && isAbsolute(evidence)) foreignProcesses.push({ pid });
    // Containers already had this third bucket; processes did not, so a matching process
    // with no usable path evidence fell through both branches and vanished entirely.
    else unprovenProcesses.push({ pid });
  }
  return {
    ownedContainers,
    foreignContainers,
    unprovenContainers,
    ownedProcesses,
    foreignProcesses,
    unprovenProcesses,
  };
}

/** Fail cleanup when the post-stop evidence still maps a resource to this generated project. */
export function assertNoOwnedSurvivors(evaluation: PostStopProbeEvaluation): void {
  if (evaluation.ownedContainers.length > 0) {
    throw new Error(
      `post-stop probe found owned containers: ${
        evaluation.ownedContainers.map((entry) => entry.id).join(', ')
      }`,
    );
  }
  if (evaluation.ownedProcesses.length > 0) {
    throw new Error(
      `post-stop probe found owned processes: ${
        evaluation.ownedProcesses.map((entry) => entry.pid).join(', ')
      }`,
    );
  }
}

/** Stop one exact AppHost, force only for cleanup runs, then prove no owned container remains. */
export async function stopAndProbe(
  appHost: string,
  projectRoot: string,
  cleanup: boolean,
  receiptPath: string,
): Promise<void> {
  const commands = [stopCommand(appHost, false), ...(cleanup ? [stopCommand(appHost, true)] : [])];
  const transcripts = [];
  for (const command of commands) {
    transcripts.push(await capture(command[0] ?? 'aspire', command.slice(1)));
  }
  const idsOutput = await requireSuccess('docker', ['ps', '-aq']);
  const ids = idsOutput.stdout.split(/\s+/).filter(Boolean);
  const containers: unknown[] = [];
  for (const id of ids) {
    const inspection = await requireSuccess('docker', ['inspect', id]);
    const parsed: unknown = JSON.parse(inspection.stdout);
    if (!Array.isArray(parsed)) throw new Error(`docker inspect ${id} did not return an array`);
    containers.push(...parsed);
  }
  const probe = { appHost, projectRoot, containers, processes: [] };
  const evaluation = evaluatePostStopProbe(probe, projectRoot);
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
  assertNoOwnedSurvivors(evaluation);
  const terminalStop = transcripts.at(-1);
  if (!terminalStop || terminalStop.code !== 0) {
    throw new Error(
      `Aspire stop did not complete: ${
        terminalStop?.stderr || terminalStop?.stdout || 'no transcript'
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

async function capture(
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
  return result;
}

async function requireSuccess(command: string, args: readonly string[]) {
  const result = await capture(command, args);
  if (result.code !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed (${result.code}): ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

function containerAppHostSource(container: Record<string, unknown>): string | undefined {
  const config = optionalRecord(Reflect.get(container, 'Config'));
  const labels = config ? optionalRecord(Reflect.get(config, 'Labels')) : undefined;
  const mount = labels ? Reflect.get(labels, ASPIRE_MOUNTS) : undefined;
  if (typeof mount === 'string') {
    return mount.match(/(?:^|,)src=([^,]+)(?:,|$)/)?.[1]?.trim() || undefined;
  }
  const environment = config ? Reflect.get(config, 'Env') : undefined;
  if (Array.isArray(environment)) {
    return environment.find((entry) =>
      typeof entry === 'string' && entry.startsWith(`${ASPIRE_DCP_APPHOST_PATH}=`)
    )?.slice(ASPIRE_DCP_APPHOST_PATH.length + 1);
  }
  return undefined;
}

function containerCreatorProcessId(container: Record<string, unknown>): string | undefined {
  const config = optionalRecord(Reflect.get(container, 'Config'));
  const labels = config ? optionalRecord(Reflect.get(config, 'Labels')) : undefined;
  const value = labels ? Reflect.get(labels, ASPIRE_CREATOR_PID) : undefined;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function valueAfter(values: readonly string[], flag: string): string | undefined {
  const index = values.indexOf(flag);
  if (index >= 0) return values[index + 1];
  return values.find((value) => value.startsWith(`${flag}=`))?.slice(flag.length + 1) || undefined;
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
  const [appHost, projectRoot, cleanupValue, receiptPath] = Deno.args;
  if (!appHost || !projectRoot || !cleanupValue || !receiptPath) {
    throw new Error('cleanup requires AppHost, project root, cleanup boolean, and receipt path');
  }
  await stopAndProbe(appHost, projectRoot, cleanupValue === 'true', receiptPath);
}
