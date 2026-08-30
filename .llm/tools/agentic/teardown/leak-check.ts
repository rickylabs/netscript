import { dirname, isAbsolute, join, relative, resolve } from '@std/path';
import { classify, type Ownership, type ResourceCandidate } from './ownership.ts';
import { probeResourceReport, type ProbeStatus } from './probes.ts';
import { type CommandPort, type FilePort, systemCommands, systemFiles } from './ports.ts';
import { readRunResources, registerOwnedRoot, type RunResourceRegistry } from './run-resources.ts';

export const STALE_AFTER_MS: number = 2 * 60 * 60 * 1000;

export interface LeakEntry {
  readonly kind: ResourceCandidate['kind'];
  readonly identity: string;
  readonly ownership: Ownership;
  readonly owner: string;
  readonly ageMs: number | null;
  readonly stale: boolean;
  readonly command: string;
  readonly resource: ResourceCandidate;
}

export interface LeakReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly worktreeRoot: string;
  readonly probes: {
    readonly aspire: ProbeStatus;
    readonly docker: ProbeStatus;
    readonly process?: ProbeStatus;
  };
  readonly survivors: readonly LeakEntry[];
}

const OK_PROBES: LeakReport['probes'] = {
  aspire: { state: 'ok' },
  docker: { state: 'ok' },
  process: { state: 'ok' },
};

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** Builds the exact per-resource command shown to a human or terminal blocker. */
export function stopCommand(resource: ResourceCandidate): string {
  if (resource.kind === 'apphost') {
    return `aspire stop --apphost ${shellQuote(resource.appHostPath)} --non-interactive --nologo`;
  }
  if (resource.kind === 'container') return `docker rm -f ${shellQuote(resource.id)}`;
  return `kill -TERM ${shellQuote(String(resource.pid))}`;
}

/**
 * Names the sibling worktree a resource appears to belong to.
 *
 * The sibling root is derived from `worktreeRoot`'s own parent rather than a fixed path, so a
 * checkout outside `/home/codex/repos` still attributes its neighbours instead of calling every
 * resource `unknown`.
 */
function ownerFrom(resource: ResourceCandidate, worktreeRoot: string): string {
  const path = resource.kind === 'apphost'
    ? resource.appHostPath
    : resource.kind === 'container'
    ? resource.mountSource
    : resource.evidence[0]?.path;
  if (!path || !isAbsolute(path) || !isAbsolute(worktreeRoot)) return 'unknown';
  const siblingRoot = dirname(resolve(worktreeRoot));
  const delta = relative(siblingRoot, resolve(path));
  if (delta === '' || delta.startsWith('..') || isAbsolute(delta)) return 'unknown';
  const [first] = delta.split(/[\\/]/);
  return first ? join(siblingRoot, first) : 'unknown';
}

function registeredStart(
  resource: ResourceCandidate,
  registry: RunResourceRegistry,
): string | undefined {
  if (resource.kind === 'apphost') {
    return registry.appHosts.find((entry) =>
      entry.appHostPid === resource.appHostPid &&
      entry.appHostStartedAt === resource.appHostStartedAt
    )?.startedAt;
  }
  if (resource.kind === 'process') return undefined;
  return registry.containers.find((entry) =>
    entry.creatorPid === resource.creatorPid &&
    entry.creatorProcessStartTime === resource.creatorProcessStartTime
  )?.startedAt;
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return Number.NaN;
  // Docker emits RFC3339Nano; JavaScript Date accepts millisecond precision reliably.
  return Date.parse(value.replace(/\.(\d{3})\d+(Z|[+-]\d\d:\d\d)$/, '.$1$2'));
}

/** Converts all survivors, including unknown-owner resources, into a deterministic report. */
export function buildLeakReport(
  resources: readonly ResourceCandidate[],
  registry: RunResourceRegistry,
  worktreeRoot: string,
  nowMs: number = Date.now(),
  staleAfterMs: number = STALE_AFTER_MS,
  probes: LeakReport['probes'] = OK_PROBES,
): LeakReport {
  return {
    schemaVersion: 1,
    generatedAt: new Date(nowMs).toISOString(),
    worktreeRoot,
    probes,
    survivors: resources.map((resource) => {
      const startedAt = registeredStart(resource, registry) ??
        (resource.kind === 'process' ? undefined : resource.createdAt);
      const parsedStart = parseTimestamp(startedAt);
      const ageMs = resource.kind === 'process'
        ? resource.observedAgeMs ?? null
        : Number.isFinite(parsedStart)
        ? Math.max(0, nowMs - parsedStart)
        : null;
      return {
        kind: resource.kind,
        identity: resource.kind === 'apphost'
          ? `${resource.appHostPath} (pid ${resource.appHostPid ?? 'unknown'})`
          : resource.kind === 'container'
          ? `${resource.name ?? resource.id} (${resource.id})`
          : `${resource.commandLine} (pid ${resource.pid})`,
        ownership: classify(resource, registry, worktreeRoot),
        owner: ownerFrom(resource, worktreeRoot),
        ageMs,
        stale: ageMs !== null && ageMs >= staleAfterMs,
        command: stopCommand(resource),
        resource,
      };
    }),
  };
}

/** Renders every survivor and exact remediation command; unknown age/owner remain explicit. */
export function renderLeakReport(report: LeakReport): string {
  const lines = [
    '# Run resource leak report',
    '',
    `Generated: ${report.generatedAt}`,
    `Worktree: \`${report.worktreeRoot}\``,
    `Aspire probe: ${renderProbeStatus(report.probes.aspire)}`,
    `Docker probe: ${renderProbeStatus(report.probes.docker)}`,
    `Process probe: ${
      renderProbeStatus(report.probes.process ?? { state: 'unavailable', message: 'not recorded' })
    }`,
    '',
  ];
  if (report.survivors.length === 0) {
    return `${lines.join('\n')}No surviving Aspire resources found.\n`;
  }
  for (const entry of report.survivors) {
    lines.push(
      `## ${entry.kind}: ${entry.identity}`,
      '',
      `- Ownership: \`${entry.ownership}\``,
      `- Apparent owner: \`${entry.owner}\``,
      `- Age: ${entry.ageMs === null ? 'unknown' : `${entry.ageMs} ms`}`,
      `- Stale: ${entry.stale}`,
      `- User command: \`${entry.command}\``,
      '',
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderProbeStatus(status: ProbeStatus): string {
  return status.state === 'ok' ? 'ok' : `${status.state} — ${status.message}`;
}

/** Performs a read-only leak check, writing Markdown and returning the JSON report. */
export async function runLeakCheck(
  sliceDir: string,
  worktreeRoot: string,
  staleAfterMs: number = STALE_AFTER_MS,
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  now: () => number = Date.now,
): Promise<LeakReport> {
  const registry = await readRunResources(sliceDir, worktreeRoot);
  const probed = await probeResourceReport(commands, files);
  const report = buildLeakReport(
    probed.resources,
    registry,
    worktreeRoot,
    now(),
    staleAfterMs,
    probed.probes,
  );
  await Deno.mkdir(sliceDir, { recursive: true });
  await Deno.writeTextFile(join(sliceDir, 'leak-report.md'), renderLeakReport(report));
  return report;
}

function parseArgs(
  args: string[],
): { sliceDir: string; worktreeRoot: string; staleAfterMs: number; ownedRoots: string[] } {
  let sliceDir = '';
  let worktreeRoot = Deno.cwd();
  let staleAfterMs = STALE_AFTER_MS;
  const ownedRoots: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--') continue;
    else if (args[i] === '--slice-dir') sliceDir = args[++i] ?? '';
    else if (args[i] === '--worktree') worktreeRoot = args[++i] ?? '';
    else if (args[i] === '--owned-root') ownedRoots.push(args[++i] ?? '');
    else if (args[i] === '--stale-after') staleAfterMs = Number(args[++i]) * 1000;
    else throw new Error(`unknown argument: ${args[i]}`);
  }
  if (!sliceDir) throw new Error('--slice-dir is required');
  if (!Number.isFinite(staleAfterMs) || staleAfterMs < 0) {
    throw new Error('--stale-after must be seconds >= 0');
  }
  return { sliceDir, worktreeRoot, staleAfterMs, ownedRoots };
}

if (import.meta.main) {
  const options = parseArgs(Deno.args);
  for (const root of options.ownedRoots) {
    await registerOwnedRoot(options.sliceDir, options.worktreeRoot, root);
  }
  console.log(
    JSON.stringify(
      await runLeakCheck(options.sliceDir, options.worktreeRoot, options.staleAfterMs),
      null,
      2,
    ),
  );
}
