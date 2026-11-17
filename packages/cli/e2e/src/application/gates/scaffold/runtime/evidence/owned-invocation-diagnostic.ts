/** Credential-safe artifact construction and owned-file publication for E2E evidence. */
import { isAbsolute, join, relative, resolve } from '@std/path';
import { type CapturedInvocation, invocationDiagnostic } from './invocation-diagnostic.ts';

/** Collector errors are diagnostic only; the caller's original cleanup result must propagate. */
export async function saveOwnedInvocationDiagnostics(input: {
  readonly projectRoot: string;
  readonly appHost: string;
  readonly kind: 'cleanup' | 'restart';
  readonly home: string;
  readonly uid: number;
  readonly transcripts: readonly CapturedInvocation[];
  readonly survivorCounts?: {
    readonly ownedContainers: number;
    readonly foreignContainers: number;
    readonly unprovenContainers: number;
  };
}) {
  const { projectRoot, kind } = input;
  const delta = relative(resolve(projectRoot), resolve(input.appHost));
  const targetMatches = !delta.startsWith('..') && !isAbsolute(delta);
  const commands = [];
  for (const [index, invocation] of input.transcripts.slice(0, 4).entries()) {
    commands.push(
      await invocationDiagnostic({
        invocation,
        ordinal: index + 1,
        operation: kind === 'cleanup' ? 'stop' : 'restart',
        targetMatches,
        logRoot: join(input.home, '.aspire', 'cli', 'logs'),
        uid: input.uid,
      }),
    );
  }
  // Construct the complete upload boundary here; raw receipts/Config.Env are never accepted.
  const counts = input.survivorCounts;
  const value = {
    schema: 1,
    kind,
    target: targetMatches ? delta : null,
    targetMatches,
    processes: 'not_collected',
    survivorCounts: counts
      ? {
        ownedContainers: counts.ownedContainers,
        foreignContainers: counts.foreignContainers,
        unprovenContainers: counts.unprovenContainers,
      }
      : null,
    commands,
  };
  const parent = join(resolve(projectRoot), '.netscript');
  if (await Deno.realPath(projectRoot) !== resolve(projectRoot)) {
    throw new Error('diagnostic_project_refused');
  }
  const info = await Deno.lstat(parent);
  if (
    !info.isDirectory || info.isSymlink || info.uid !== input.uid ||
    await Deno.realPath(parent) !== parent
  ) throw new Error('diagnostic_directory_refused');
  const output = join(parent, `e2e-${kind}-diagnostic.json`);
  const file = await Deno.makeTempFile({ dir: parent, prefix: '.diagnostic-' });
  try {
    await Deno.writeTextFile(file, JSON.stringify(value) + '\n');
    if (await Deno.realPath(parent) !== parent) throw new Error('diagnostic_directory_changed');
    await Deno.rename(file, output);
  } finally {
    await Deno.remove(file).catch(() => {});
  }
}
