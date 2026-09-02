import type { ContainerCandidate, ResourceCandidate } from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { systemCommands, systemFiles } from './ports.ts';

export const ASPIRE_CREATOR_PID = 'com.microsoft.developer.usvc-dev.creatorProcessId';
export const ASPIRE_CREATOR_STARTED = 'com.microsoft.developer.usvc-dev.creatorProcessStartTime';
export const ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel';
/**
 * Label namespace DCP stamps on the Docker objects it manages. Aspire-management is recognized
 * from this namespace only — never from a resource name, which cannot distinguish one run's
 * network from another run's (issue #1855).
 */
export const ASPIRE_LABEL_PREFIX = 'com.microsoft.developer.usvc-dev.';
export const DEFAULT_PROBE_TIMEOUT_MS = 10_000;

interface AspireRow {
  readonly appHostPath?: unknown;
  readonly appHostPid?: unknown;
}

interface DockerInspectRow {
  readonly Id?: unknown;
  readonly Name?: unknown;
  readonly Created?: unknown;
  readonly Config?: { readonly Labels?: Record<string, string> | null };
  readonly Mounts?: readonly { readonly Type?: unknown; readonly Name?: unknown }[];
}

interface DockerVolumeInspectRow {
  readonly Name?: unknown;
  readonly CreatedAt?: unknown;
  readonly Labels?: Record<string, string> | null;
}

interface DockerNetworkInspectRow {
  readonly Id?: unknown;
  readonly Name?: unknown;
  readonly Created?: unknown;
  readonly Labels?: Record<string, string> | null;
  readonly Containers?: Record<string, unknown> | null;
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
    readonly volumes: ProbeStatus;
    readonly networks: ProbeStatus;
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

/** Returns true only when a Docker object carries a DCP label, proving Aspire manages it. */
export function isAspireManaged(labels: Record<string, string> | null | undefined): boolean {
  return Object.keys(labels ?? {}).some((key) => key.startsWith(ASPIRE_LABEL_PREFIX));
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
  if (containerIds.length === 0) {
    return { candidates: [], mountedVolumes: new Map<string, string[]>() };
  }
  const inspected = await commands.run(['docker', 'inspect', ...containerIds], timeoutMs);
  if (inspected.code !== 0) {
    throw new Error(`docker inspect failed (${inspected.code}): ${inspected.stderr.trim()}`);
  }
  const rows: unknown = JSON.parse(inspected.stdout);
  if (!Array.isArray(rows)) throw new Error('docker inspect JSON is not an array');
  const candidates: ResourceCandidate[] = [];
  // Volume names are collected for every inspected container, including ones without Aspire
  // labels: a volume shared with an unattributable container must not be claimed (see
  // `classifyVolume`).
  const mountedVolumes = new Map<string, string[]>();
  for (const row of rows as DockerInspectRow[]) {
    const labels = row.Config?.Labels ?? {};
    if (typeof row.Id !== 'string') continue;
    const volumes = (row.Mounts ?? [])
      .filter((mount) => mount.Type === 'volume' && typeof mount.Name === 'string')
      .map((mount) => mount.Name as string);
    if (volumes.length > 0) mountedVolumes.set(row.Id, volumes);
    if (!labels[ASPIRE_CREATOR_PID]) continue;
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
  return { candidates, mountedVolumes };
}

/**
 * Discovers Docker volumes that carry Aspire evidence: a volume mounted by an Aspire-labelled
 * container, or one carrying an Aspire label. Everything else — including unmounted, unlabelled
 * volumes and unrelated projects' volumes — has no evidence to attribute and is not reported.
 * `mountedBy` lists every container mounting the volume, labelled or not, so attribution stays
 * fail-closed (see `classifyVolume`).
 */
async function probeVolumes(
  commands: CommandPort,
  timeoutMs: number,
  mountsByContainer: ReadonlyMap<string, readonly string[]>,
  aspireContainerIds: ReadonlySet<string>,
): Promise<ResourceCandidate[]> {
  const names = await commands.run(['docker', 'volume', 'ls', '--format', '{{.Name}}'], timeoutMs);
  if (names.code !== 0) {
    throw new Error(`docker volume ls failed (${names.code}): ${names.stderr.trim()}`);
  }
  const volumeNames = names.stdout.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  if (volumeNames.length === 0) return [];
  const rows = await inspectVolumes(volumeNames, commands, timeoutMs);
  const mountedBy = new Map<string, string[]>();
  for (const [containerId, volumes] of mountsByContainer) {
    for (const volume of volumes) {
      mountedBy.set(volume, [...(mountedBy.get(volume) ?? []), containerId]);
    }
  }
  const candidates: ResourceCandidate[] = [];
  for (const row of rows) {
    if (typeof row.Name !== 'string') continue;
    const mounters = mountedBy.get(row.Name) ?? [];
    const aspireMounted = mounters.some((id) => aspireContainerIds.has(id));
    if (!isAspireManaged(row.Labels) && !aspireMounted) continue;
    candidates.push({
      kind: 'volume',
      id: row.Name,
      createdAt: typeof row.CreatedAt === 'string' ? row.CreatedAt : undefined,
      mountedBy: mounters,
    });
  }
  return candidates;
}

async function inspectVolumes(
  names: readonly string[],
  commands: CommandPort,
  timeoutMs: number,
): Promise<DockerVolumeInspectRow[]> {
  const inspected = await commands.run(['docker', 'volume', 'inspect', ...names], timeoutMs);
  if (inspected.code !== 0) {
    throw new Error(`docker volume inspect failed (${inspected.code}): ${inspected.stderr.trim()}`);
  }
  const rows: unknown = JSON.parse(inspected.stdout);
  if (!Array.isArray(rows)) throw new Error('docker volume inspect JSON is not an array');
  return rows as DockerVolumeInspectRow[];
}

/**
 * Discovers Docker networks DCP manages, by label namespace. Networks without Aspire labels —
 * including Docker's own defaults — are not candidates, and a network is never named into
 * candidacy by an `aspire-*` pattern.
 */
async function probeNetworks(
  commands: CommandPort,
  timeoutMs: number,
): Promise<ResourceCandidate[]> {
  const list = await commands.run(['docker', 'network', 'ls', '--format', '{{.ID}}'], timeoutMs);
  if (list.code !== 0) {
    throw new Error(`docker network ls failed (${list.code}): ${list.stderr.trim()}`);
  }
  const networkIds = list.stdout.split(/\r?\n/).map((id) => id.trim()).filter(Boolean);
  if (networkIds.length === 0) return [];
  const inspected = await commands.run(['docker', 'network', 'inspect', ...networkIds], timeoutMs);
  if (inspected.code !== 0) {
    throw new Error(
      `docker network inspect failed (${inspected.code}): ${inspected.stderr.trim()}`,
    );
  }
  const rows: unknown = JSON.parse(inspected.stdout);
  if (!Array.isArray(rows)) throw new Error('docker network inspect JSON is not an array');
  const candidates: ResourceCandidate[] = [];
  for (const row of rows as DockerNetworkInspectRow[]) {
    if (!isAspireManaged(row.Labels)) continue;
    if (typeof row.Id !== 'string') continue;
    candidates.push({
      kind: 'network',
      id: row.Id,
      name: typeof row.Name === 'string' ? row.Name : undefined,
      createdAt: typeof row.Created === 'string' ? row.Created : undefined,
      attachedContainers: Object.keys(row.Containers ?? {}),
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
  const [aspire, containers, networks] = await Promise.all([
    settledProbe(() => probeAppHosts(commands, files, timeoutMs)),
    settledContainerProbe(commands, files, timeoutMs),
    settledProbe(() => probeNetworks(commands, timeoutMs)),
  ]);
  // Volumes depend on the container probe's mount map, so they run after it; their own status
  // covers only their own commands.
  const volumes = await settledProbe(() =>
    probeVolumes(
      commands,
      timeoutMs,
      containers.mountedVolumes,
      new Set(
        containers.candidates
          .filter((candidate): candidate is ContainerCandidate => candidate.kind === 'container')
          .map((candidate) => candidate.id),
      ),
    )
  );
  return {
    resources: [
      ...aspire.resources,
      ...containers.candidates,
      ...volumes.resources,
      ...networks.resources,
    ],
    probes: {
      aspire: aspire.status,
      docker: containers.status,
      volumes: volumes.status,
      networks: networks.status,
    },
  };
}

interface ContainerProbeOutcome {
  readonly candidates: readonly ResourceCandidate[];
  readonly mountedVolumes: ReadonlyMap<string, readonly string[]>;
  readonly status: ProbeStatus;
}

async function settledContainerProbe(
  commands: CommandPort,
  files: FilePort,
  timeoutMs: number,
): Promise<ContainerProbeOutcome> {
  try {
    return {
      ...await probeContainers(commands, files, timeoutMs),
      status: { state: 'ok' },
    };
  } catch (error) {
    return {
      candidates: [],
      mountedVolumes: new Map(),
      status: probeFailure(error),
    };
  }
}

/**
 * Discovers Aspire AppHosts, Aspire-labelled containers, Aspire-evidenced volumes, and
 * DCP-managed networks with bounded read-only probes.
 */
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
