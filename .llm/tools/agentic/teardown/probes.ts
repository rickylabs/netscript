import type { ResourceCandidate } from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { systemCommands, systemFiles } from './ports.ts';

export const ASPIRE_CREATOR_PID = 'com.microsoft.developer.usvc-dev.creatorProcessId';
export const ASPIRE_CREATOR_STARTED = 'com.microsoft.developer.usvc-dev.creatorProcessStartTime';
export const ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel';
export const DEFAULT_PROBE_TIMEOUT_MS = 10_000;

interface AspireRow {
  readonly appHostPath?: unknown;
  readonly appHostPid?: unknown;
}

interface DockerInspectRow {
  readonly Id?: unknown;
  readonly Name?: unknown;
  readonly Config?: { readonly Labels?: Record<string, string> | null };
}

function processStartedAt(stat: string): string | undefined {
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

async function probeAppHosts(commands: CommandPort, files: FilePort, timeoutMs: number) {
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
    });
  }
  return candidates;
}

/** Discovers only Aspire AppHosts and Aspire-labelled containers with bounded read-only probes. */
export async function probeResources(
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  timeoutMs: number = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ResourceCandidate[]> {
  const [appHosts, containers] = await Promise.all([
    probeAppHosts(commands, files, timeoutMs),
    probeContainers(commands, files, timeoutMs),
  ]);
  return [...appHosts, ...containers];
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
  };
}
