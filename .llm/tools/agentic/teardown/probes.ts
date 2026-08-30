import { MCP_COMMAND, type ProcessEvidence, type ResourceCandidate } from './ownership.ts';
import { basename } from '@std/path';
import type { CommandPort, FilePort } from './ports.ts';
import { systemCommands, systemFiles } from './ports.ts';

export const ASPIRE_CREATOR_PID = 'com.microsoft.developer.usvc-dev.creatorProcessId';
export const ASPIRE_CREATOR_STARTED = 'com.microsoft.developer.usvc-dev.creatorProcessStartTime';
export const ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel';
export const DEFAULT_PROBE_TIMEOUT_MS = 10_000;
const PROCESS_ROW = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/;
const DCP_ENVIRONMENT_KEY = /^ASPIRE_DCP_APPHOST_PATH$/;
const ABSOLUTE_PATH = /\/(?:[^\s\0'"=,:]+\/?)+/g;

interface AspireRow {
  readonly appHostPath?: unknown;
  readonly appHostPid?: unknown;
}

interface DockerInspectRow {
  readonly Id?: unknown;
  readonly Name?: unknown;
  readonly Created?: unknown;
  readonly Config?: { readonly Labels?: Record<string, string> | null };
}

interface ProcessRow {
  readonly pid: number;
  readonly ppid: number;
  readonly elapsedSeconds: number;
  readonly commandLine: string;
}

export type ProbeStatus =
  | { readonly state: 'ok' }
  | { readonly state: 'unavailable'; readonly message: string }
  | { readonly state: 'failed'; readonly message: string };

export interface ResourceProbeResult {
  readonly resources: readonly ResourceCandidate[];
  readonly probes: {
    readonly aspire: ProbeStatus;
    readonly docker: ProbeStatus;
    readonly process: ProbeStatus;
  };
}

/** Reads field 22 of `/proc/<pid>/stat`, the value that makes a pid identity stable across reuse. */
export function processStartedAt(stat: string): string | undefined {
  const close = stat.lastIndexOf(')');
  if (close < 0) return undefined;
  return stat.slice(close + 2).trim().split(/\s+/)[19];
}

/** Parses `src=` from a Docker mount label without authorizing malformed input. */
export function parseMountSource(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const match = label.match(/(?:^|,)src=([^,]+)(?:,|$)/);
  return match?.[1]?.trim() || undefined;
}

async function resolvedPath(
  path: string | undefined,
  files: FilePort,
): Promise<string | undefined> {
  if (!path) return undefined;
  try {
    return await files.realPath(path);
  } catch {
    return undefined;
  }
}

function parseProcessRows(stdout: string): ProcessRow[] {
  const rows: ProcessRow[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    const match = line.match(PROCESS_ROW);
    if (!match) continue;
    const pid = Number(match[1]);
    const ppid = Number(match[2]);
    const elapsedSeconds = Number(match[3]);
    const commandLine = match[4]?.trim() ?? '';
    if (
      Number.isInteger(pid) && Number.isInteger(ppid) && Number.isFinite(elapsedSeconds) &&
      commandLine
    ) {
      rows.push({ pid, ppid, elapsedSeconds, commandLine });
    }
  }
  return rows;
}

function commandTokens(rawCommandLine: string, fallback: string): string[] {
  const tokens = rawCommandLine
    ? rawCommandLine.split('\0').filter(Boolean)
    : fallback.trim().split(/\s+/).filter(Boolean);
  return tokens;
}

function aspireProcessIdentity(tokens: readonly string[]): boolean {
  return tokens.some((token, index) => {
    const name = basename(token).toLowerCase();
    if (name === 'aspire-managed' || name === 'dcp' || name.endsWith('.dcp.dll')) return true;
    return index === 0 && (name === 'aspire' || name === 'aspire.exe');
  });
}

function appHostArgvPath(tokens: readonly string[]): string | undefined {
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] ?? '';
    if (token === '--apphost') return tokens[index + 1];
    if (token.startsWith('--apphost=')) return token.slice('--apphost='.length) || undefined;
  }
  return undefined;
}

function environmentEvidence(environment: string): string[] {
  const paths: string[] = [];
  for (const entry of environment.split('\0')) {
    const separator = entry.indexOf('=');
    if (separator < 1 || !DCP_ENVIRONMENT_KEY.test(entry.slice(0, separator))) continue;
    for (const path of entry.slice(separator + 1).match(ABSOLUTE_PATH) ?? []) paths.push(path);
  }
  return paths;
}

async function socketEvidence(files: FilePort, procRoot: string): Promise<string[]> {
  if (!files.listNames || !files.readLink) return [];
  let descriptorNames: readonly string[];
  try {
    descriptorNames = await files.listNames(`${procRoot}/fd`);
  } catch {
    return [];
  }
  const inodes = new Set<string>();
  for (const name of descriptorNames) {
    try {
      const inode = (await files.readLink(`${procRoot}/fd/${name}`)).match(/^socket:\[(\d+)\]$/)
        ?.[1];
      if (inode) inodes.add(inode);
    } catch {
      // File descriptors can close while the process is inspected.
    }
  }
  if (inodes.size === 0) return [];
  const paths: string[] = [];
  for (const line of (await readProcessText(files, '/proc/net/unix')).split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields.length >= 8 && inodes.has(fields[6] ?? '') && fields[7]?.startsWith('/')) {
      paths.push(fields[7]);
    }
  }
  return paths;
}

async function readProcessText(files: FilePort, path: string): Promise<string> {
  try {
    return await files.readText(path);
  } catch {
    return '';
  }
}

/** Discovers Aspire-related process rows, including helpers re-parented to PID 1. */
export async function probeProcesses(
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceCandidate[]> {
  const result = await commands.run(['ps', '-eo', 'pid=,ppid=,etimes=,args='], timeoutMs);
  if (result.code !== 0) throw new Error(`ps failed (${result.code}): ${result.stderr.trim()}`);
  const candidates: ResourceCandidate[] = [];
  for (const row of parseProcessRows(result.stdout)) {
    const procRoot = `/proc/${row.pid}`;
    const tokens = commandTokens(
      await readProcessText(files, `${procRoot}/cmdline`),
      row.commandLine,
    );
    const commandLine = tokens.join(' ');
    if (MCP_COMMAND.test(commandLine)) continue;
    const environment = await readProcessText(files, `${procRoot}/environ`);
    const appHostPath = appHostArgvPath(tokens);
    const dcpPaths = environmentEvidence(environment);
    const socketPaths = await socketEvidence(files, procRoot);
    const aspireCommand = aspireProcessIdentity(tokens);
    if (!aspireCommand) continue;
    const rawAppHostEvidence: ProcessEvidence[] = appHostPath
      ? [{ kind: 'apphost-argv', path: appHostPath }]
      : [];
    const rawEvidence: ProcessEvidence[] = [
      ...dcpPaths.map((path): ProcessEvidence => ({ kind: 'dcp-label', path })),
      ...rawAppHostEvidence,
      ...socketPaths.map((path): ProcessEvidence => ({ kind: 'socket-path', path })),
    ];
    const evidence: ProcessEvidence[] = [];
    for (const entry of rawEvidence) {
      const path = await resolvedPath(entry.path, files);
      if (path) evidence.push({ kind: entry.kind, path });
    }
    let cwd: string | undefined;
    try {
      cwd = await files.realPath(`${procRoot}/cwd`);
    } catch {
      // Process exit between ps and proc reads is expected.
    }
    const stat = await readProcessText(files, `${procRoot}/stat`);
    candidates.push({
      kind: 'process',
      pid: row.pid,
      ppid: row.ppid,
      processStartedAt: stat ? processStartedAt(stat) : undefined,
      observedAgeMs: row.elapsedSeconds * 1000,
      commandLine,
      cwd,
      evidence,
    });
  }
  return candidates;
}

/** Discovers AppHosts using only Aspire and process metadata. */
export async function probeAppHosts(
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceCandidate[]> {
  const result = await commands.run(['aspire', 'ps', '--format', 'Json'], timeoutMs);
  if (result.code !== 0) {
    throw new Error(`aspire ps failed (${result.code}): ${result.stderr.trim()}`);
  }
  const rows: unknown = JSON.parse(result.stdout);
  if (!Array.isArray(rows)) throw new Error('aspire ps JSON is not an array');
  const candidates: ResourceCandidate[] = [];
  for (const row of rows as AspireRow[]) {
    if (typeof row.appHostPath !== 'string' || typeof row.appHostPid !== 'number') continue;
    const appHostPath = await resolvedPath(row.appHostPath, files);
    if (!appHostPath) continue;
    let appHostStartedAt: string | undefined;
    let commandLine: string | undefined;
    try {
      appHostStartedAt = processStartedAt(await files.readText(`/proc/${row.appHostPid}/stat`));
      commandLine = (await files.readText(`/proc/${row.appHostPid}/cmdline`)).replaceAll('\0', ' ');
    } catch {
      // A process can exit between `aspire ps` and `/proc`; its path evidence remains usable.
    }
    candidates.push({
      kind: 'apphost',
      appHostPath,
      appHostPid: row.appHostPid,
      appHostStartedAt,
      commandLine,
    });
  }
  return candidates;
}

async function probeContainers(commands: CommandPort, files: FilePort, timeoutMs: number) {
  const ids = await commands.run(['docker', 'ps', '-a', '--format', '{{.ID}}'], timeoutMs);
  if (ids.code !== 0) throw new Error(`docker ps failed (${ids.code}): ${ids.stderr.trim()}`);
  const containerIds = ids.stdout.split(/\r?\n/).map((id) => id.trim()).filter(Boolean);
  if (containerIds.length === 0) return [];
  const inspected = await commands.run(['docker', 'inspect', ...containerIds], timeoutMs);
  if (inspected.code !== 0) {
    throw new Error(`docker inspect failed (${inspected.code}): ${inspected.stderr.trim()}`);
  }
  const rows: unknown = JSON.parse(inspected.stdout);
  if (!Array.isArray(rows)) throw new Error('docker inspect JSON is not an array');
  const candidates: ResourceCandidate[] = [];
  for (const row of rows as DockerInspectRow[]) {
    const labels = row.Config?.Labels ?? {};
    if (typeof row.Id !== 'string' || !labels[ASPIRE_CREATOR_PID]) continue;
    const parsedPid = Number(labels[ASPIRE_CREATOR_PID]);
    const rawMount = parseMountSource(labels[ASPIRE_MOUNTS]);
    candidates.push({
      kind: 'container',
      id: row.Id,
      name: typeof row.Name === 'string' ? row.Name.replace(/^\//, '') : undefined,
      creatorPid: Number.isInteger(parsedPid) ? parsedPid : undefined,
      creatorProcessStartTime: labels[ASPIRE_CREATOR_STARTED],
      mountSource: await resolvedPath(rawMount, files),
      createdAt: typeof row.Created === 'string' ? row.Created : undefined,
    });
  }
  return candidates;
}

function probeFailure(error: unknown): ProbeStatus {
  const message = error instanceof Error ? error.message : String(error);
  return error instanceof Deno.errors.NotFound
    ? { state: 'unavailable', message }
    : { state: 'failed', message };
}

async function settledProbe(
  run: () => Promise<ResourceCandidate[]>,
): Promise<{ resources: ResourceCandidate[]; status: ProbeStatus }> {
  try {
    return { resources: await run(), status: { state: 'ok' } };
  } catch (error) {
    return { resources: [], status: probeFailure(error) };
  }
}

/** Runs Aspire and Docker discovery independently and retains each probe's outcome. */
export async function probeResourceReport(
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceProbeResult> {
  const [aspire, docker, process] = await Promise.all([
    settledProbe(() => probeAppHosts(commands, files, timeoutMs)),
    settledProbe(() => probeContainers(commands, files, timeoutMs)),
    settledProbe(() => probeProcesses(commands, files, timeoutMs)),
  ]);
  return {
    resources: [...aspire.resources, ...docker.resources, ...process.resources],
    probes: { aspire: aspire.status, docker: docker.status, process: process.status },
  };
}

/** Discovers only Aspire AppHosts and Aspire-labelled containers with bounded read-only probes. */
export async function probeResources(
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceCandidate[]> {
  return [...(await probeResourceReport(commands, files, timeoutMs)).resources];
}

/** Re-reads one container's labels immediately before a possible removal. */
export async function probeContainer(
  id: string,
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceCandidate | undefined> {
  const inspected = await commands.run(['docker', 'inspect', id], timeoutMs);
  if (inspected.code !== 0) return undefined;
  const rows: unknown = JSON.parse(inspected.stdout);
  if (!Array.isArray(rows) || !rows[0]) return undefined;
  const row = rows[0] as DockerInspectRow;
  const labels = row.Config?.Labels ?? {};
  const creatorPid = Number(labels[ASPIRE_CREATOR_PID]);
  if (typeof row.Id !== 'string' || !Number.isInteger(creatorPid)) return undefined;
  return {
    kind: 'container',
    id: row.Id,
    name: typeof row.Name === 'string' ? row.Name.replace(/^\//, '') : undefined,
    creatorPid,
    creatorProcessStartTime: labels[ASPIRE_CREATOR_STARTED],
    mountSource: await resolvedPath(parseMountSource(labels[ASPIRE_MOUNTS]), files),
    createdAt: typeof row.Created === 'string' ? row.Created : undefined,
  };
}
