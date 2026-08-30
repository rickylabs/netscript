import { dirname } from '@std/path';
import {
  classify,
  pathContained,
  type ProcessCandidate,
  type ResourceCandidate,
} from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { systemCommands, systemFiles } from './ports.ts';
import {
  probeContainer,
  probeProcesses as probeProcessResources,
  processStartedAt,
} from './probes.ts';
import { type LeakEntry, type LeakReport, runLeakCheck } from './leak-check.ts';
import { readRunResources, registerOwnedRoot, type RunResourceRegistry } from './run-resources.ts';

export interface TeardownResult {
  readonly applied: boolean;
  readonly plannedCommands: readonly (readonly string[])[];
  readonly stoppedAppHosts: readonly string[];
  readonly terminatedProcesses: readonly number[];
  readonly removedContainers: readonly string[];
  readonly escalated: readonly LeakEntry[];
}

/** Maps a completed teardown to an honest CLI status. */
export function teardownExitCode(result: TeardownResult): number {
  return result.applied && result.escalated.length > 0 ? 4 : 0;
}

export interface TeardownOptions {
  /** Deletes persistent resources only after an owned AppHost's scoped stop is confirmed. */
  readonly forcePersistent?: boolean;
  /** Confirmation probes after `aspire stop` before an AppHost is declared stopped. */
  readonly confirmAttempts?: number;
  readonly confirmIntervalMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly processProbe?: () => Promise<readonly ProcessCandidate[]>;
}

// S2 V6 observed Aspire 13.5.3 orphan registration cleanup in 385 ms. Six probes spaced 500 ms
// bound confirmation to 2.5 s while allowing more than six times the observed cleanup latency.
const DEFAULT_CONFIRM_ATTEMPTS = 6;
const DEFAULT_CONFIRM_INTERVAL_MS = 500;
const MIN_ORPHAN_PROCESS_AGE_MS = 30_000;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function scopedStopCommand(appHostPath: string, force: boolean = false): string[] {
  return [
    'aspire',
    'stop',
    ...(force ? ['--force'] : []),
    '--apphost',
    appHostPath,
    '--non-interactive',
    '--nologo',
  ];
}

/**
 * Reports whether an AppHost process is gone.
 *
 * `aspire stop` exits 0 once it has signalled the AppHost, which it does before the child tree is
 * down — a run observed it report success with services and containers still alive. So liveness is
 * read from `/proc` rather than inferred from the exit code, and a recorded start time
 * distinguishes a surviving process from an unrelated one that reused the pid.
 */
async function appHostGone(
  resource: { readonly appHostPid?: number; readonly appHostStartedAt?: string },
  files: FilePort,
): Promise<boolean> {
  if (resource.appHostPid === undefined) return false;
  let stat: string;
  try {
    stat = await files.readText(`/proc/${resource.appHostPid}/stat`);
  } catch {
    return true;
  }
  const startedAt = processStartedAt(stat);
  return Boolean(resource.appHostStartedAt && startedAt && startedAt !== resource.appHostStartedAt);
}

/** Associates DCP/managed helpers with one exact AppHost without treating PPID as ownership. */
export function processBelongsToAppHost(
  process: ProcessCandidate,
  appHostPath: string,
): boolean {
  const workspaceRoot = dirname(dirname(appHostPath));
  return process.evidence.some((entry) =>
    entry.path === appHostPath ||
    (entry.kind === 'socket-path' && pathContained(entry.path, workspaceRoot))
  );
}

function processCandidates(resources: readonly ResourceCandidate[]): ProcessCandidate[] {
  return resources.filter((resource): resource is ProcessCandidate => resource.kind === 'process');
}

async function processGone(
  resource: ProcessCandidate,
  files: FilePort,
): Promise<boolean> {
  let stat: string;
  try {
    stat = await files.readText(`/proc/${resource.pid}/stat`);
  } catch {
    return true;
  }
  const startedAt = processStartedAt(stat);
  return Boolean(resource.processStartedAt && startedAt && startedAt !== resource.processStartedAt);
}

async function confirmedGone(
  check: () => Promise<boolean>,
  attempts: number,
  intervalMs: number,
  sleep: (ms: number) => Promise<void>,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(intervalMs);
    if (await check()) return true;
  }
  return false;
}

/** Stops/removes only positively owned resources; mutation requires explicit apply=true. */
export async function runTeardown(
  report: LeakReport,
  registry: RunResourceRegistry,
  apply: boolean,
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
  options: TeardownOptions = {},
): Promise<TeardownResult> {
  const forcePersistent = options.forcePersistent ?? false;
  const plannedCommands: string[][] = [];
  const stoppedAppHosts: string[] = [];
  const terminatedProcesses: number[] = [];
  const removedContainers: string[] = [];
  const escalated = report.survivors.filter((entry) => entry.ownership !== 'owned');
  const appHosts = report.survivors.flatMap((entry) =>
    entry.resource.kind === 'apphost' ? [entry.resource] : []
  );
  for (const entry of report.survivors) {
    if (entry.ownership !== 'owned') continue;
    if (entry.resource.kind === 'apphost') {
      plannedCommands.push(scopedStopCommand(entry.resource.appHostPath));
      if (forcePersistent) {
        plannedCommands.push(scopedStopCommand(entry.resource.appHostPath, true));
      }
    } else if (entry.resource.kind === 'container') {
      plannedCommands.push(['docker', 'rm', '-f', entry.resource.id]);
    } else if (
      report.probes.aspire.state === 'ok' &&
      entry.ageMs !== null && entry.ageMs >= MIN_ORPHAN_PROCESS_AGE_MS &&
      entry.resource.processStartedAt &&
      !appHosts.some((appHost) => {
        const process = entry.resource;
        return process.kind === 'process' &&
          processBelongsToAppHost(process, appHost.appHostPath);
      })
    ) {
      plannedCommands.push(['kill', '-TERM', String(entry.resource.pid)]);
    }
  }
  if (!apply) {
    return {
      applied: false,
      plannedCommands,
      stoppedAppHosts,
      terminatedProcesses,
      removedContainers,
      escalated,
    };
  }

  const attempts = options.confirmAttempts ?? DEFAULT_CONFIRM_ATTEMPTS;
  const intervalMs = options.confirmIntervalMs ?? DEFAULT_CONFIRM_INTERVAL_MS;
  const sleep = options.sleep ?? defaultSleep;
  const processProbe = options.processProbe ??
    (() => probeProcessResources(commands, files).then(processCandidates));

  for (const entry of report.survivors) {
    if (entry.ownership !== 'owned' || entry.resource.kind !== 'apphost') continue;
    const appHost = entry.resource;
    const result = await commands.run(scopedStopCommand(appHost.appHostPath), 30_000);
    if (result.code !== 0) {
      escalated.push(entry);
      continue;
    }
    const gone = await confirmedGone(
      async () => {
        if (!(await appHostGone(appHost, files))) return false;
        try {
          const helpers = await processProbe();
          return !helpers.some((process) => processBelongsToAppHost(process, appHost.appHostPath));
        } catch {
          return false;
        }
      },
      attempts,
      intervalMs,
      sleep,
    );
    if (!gone) {
      escalated.push(entry);
      continue;
    }
    stoppedAppHosts.push(appHost.appHostPath);
    if (
      forcePersistent &&
      classify(appHost, registry, report.worktreeRoot) === 'owned'
    ) {
      const forceResult = await commands.run(
        scopedStopCommand(appHost.appHostPath, true),
        30_000,
      );
      if (forceResult.code !== 0) escalated.push(entry);
    }
  }

  for (const entry of report.survivors) {
    if (entry.ownership !== 'owned' || entry.resource.kind !== 'process') continue;
    const process = entry.resource;
    if (appHosts.some((appHost) => processBelongsToAppHost(process, appHost.appHostPath))) {
      continue;
    }
    if (report.probes.aspire.state !== 'ok') {
      escalated.push(entry);
      continue;
    }
    if (
      entry.ageMs === null || entry.ageMs < MIN_ORPHAN_PROCESS_AGE_MS ||
      !process.processStartedAt
    ) {
      escalated.push(entry);
      continue;
    }
    if (await processGone(process, files)) continue;
    const result = await commands.run(['kill', '-TERM', String(process.pid)], 30_000);
    if (result.code !== 0) {
      escalated.push(entry);
      continue;
    }
    const gone = await confirmedGone(
      () => processGone(process, files),
      attempts,
      intervalMs,
      sleep,
    );
    if (gone) terminatedProcesses.push(process.pid);
    else escalated.push(entry);
  }

  for (const entry of report.survivors) {
    if (entry.ownership !== 'owned' || entry.resource.kind !== 'container') continue;
    const fresh = await probeContainer(entry.resource.id, commands, files);
    if (
      !fresh || fresh.kind !== 'container' ||
      classify(fresh, registry, report.worktreeRoot) !== 'owned'
    ) {
      escalated.push(entry);
      continue;
    }
    const result = await commands.run(['docker', 'rm', '-f', fresh.id], 30_000);
    if (result.code === 0) removedContainers.push(fresh.id);
    else escalated.push(entry);
  }
  return {
    applied: true,
    plannedCommands,
    stoppedAppHosts,
    terminatedProcesses,
    removedContainers,
    escalated,
  };
}

export function parseTeardownArgs(
  args: string[],
): {
  sliceDir: string;
  worktreeRoot: string;
  apply: boolean;
  forcePersistent: boolean;
  ownedRoots: string[];
} {
  let sliceDir = '';
  let worktreeRoot = Deno.cwd();
  let apply = false;
  let forcePersistent = false;
  const ownedRoots: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--') continue;
    else if (args[i] === '--slice-dir') sliceDir = args[++i] ?? '';
    else if (args[i] === '--worktree') worktreeRoot = args[++i] ?? '';
    else if (args[i] === '--owned-root') ownedRoots.push(args[++i] ?? '');
    else if (args[i] === '--apply') apply = true;
    else if (args[i] === '--force-persistent') forcePersistent = true;
    else if (args[i] === '--dry-run') apply = false;
    else throw new Error(`unknown argument: ${args[i]}`);
  }
  if (!sliceDir) throw new Error('--slice-dir is required');
  return { sliceDir, worktreeRoot, apply, forcePersistent, ownedRoots };
}

if (import.meta.main) {
  const options = parseTeardownArgs(Deno.args);
  for (const root of options.ownedRoots) {
    await registerOwnedRoot(options.sliceDir, options.worktreeRoot, root);
  }
  const registry = await readRunResources(options.sliceDir, options.worktreeRoot);
  const report = await runLeakCheck(options.sliceDir, options.worktreeRoot);
  const result = await runTeardown(report, registry, options.apply, systemCommands, systemFiles, {
    forcePersistent: options.forcePersistent,
  });
  console.log(JSON.stringify(result, null, 2));
  Deno.exitCode = teardownExitCode(result);
}
