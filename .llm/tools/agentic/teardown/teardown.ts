import { classify } from './ownership.ts';
import type { CommandPort, FilePort } from './ports.ts';
import { systemCommands, systemFiles } from './ports.ts';
import { probeContainer } from './probes.ts';
import { type LeakEntry, type LeakReport, runLeakCheck } from './leak-check.ts';
import { readRunResources, type RunResourceRegistry } from './run-resources.ts';

export interface TeardownResult {
  readonly applied: boolean;
  readonly stoppedAppHosts: readonly string[];
  readonly removedContainers: readonly string[];
  readonly escalated: readonly LeakEntry[];
}

/** Stops/removes only positively owned resources; mutation requires explicit apply=true. */
export async function runTeardown(
  report: LeakReport,
  registry: RunResourceRegistry,
  apply: boolean,
  commands: CommandPort = systemCommands,
  files: FilePort = systemFiles,
): Promise<TeardownResult> {
  const stoppedAppHosts: string[] = [];
  const removedContainers: string[] = [];
  const escalated = report.survivors.filter((entry) => entry.ownership !== 'owned');
  if (!apply) return { applied: false, stoppedAppHosts, removedContainers, escalated };

  for (const entry of report.survivors) {
    if (entry.ownership !== 'owned' || entry.resource.kind !== 'apphost') continue;
    const result = await commands.run([
      'aspire',
      'stop',
      '--apphost',
      entry.resource.appHostPath,
      '--non-interactive',
      '--nologo',
    ], 30_000);
    if (result.code === 0) stoppedAppHosts.push(entry.resource.appHostPath);
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
  return { applied: true, stoppedAppHosts, removedContainers, escalated };
}

function parseArgs(args: string[]): { sliceDir: string; worktreeRoot: string; apply: boolean } {
  let sliceDir = '';
  let worktreeRoot = Deno.cwd();
  let apply = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--') continue;
    else if (args[i] === '--slice-dir') sliceDir = args[++i] ?? '';
    else if (args[i] === '--worktree') worktreeRoot = args[++i] ?? '';
    else if (args[i] === '--apply') apply = true;
    else if (args[i] === '--dry-run') apply = false;
    else throw new Error(`unknown argument: ${args[i]}`);
  }
  if (!sliceDir) throw new Error('--slice-dir is required');
  return { sliceDir, worktreeRoot, apply };
}

if (import.meta.main) {
  const options = parseArgs(Deno.args);
  const registry = await readRunResources(options.sliceDir, options.worktreeRoot);
  const report = await runLeakCheck(options.sliceDir, options.worktreeRoot);
  console.log(JSON.stringify(await runTeardown(report, registry, options.apply), null, 2));
}
