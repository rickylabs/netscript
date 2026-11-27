/** Credential-safe artifact construction at known write sites; no directory discovery. */
import { isAbsolute, join, relative, resolve } from '@std/path';
import { type CapturedInvocation, invocationDiagnostic } from './invocation-diagnostic.ts';

export const INVOCATION_ARTIFACT_DIRECTORY = '.llm/tmp/e2e-invocation-diagnostics';
const MAX_ARTIFACT_BYTES = 64 << 10;
function within(root: string, path: string): boolean {
  const delta = relative(resolve(root), resolve(path));
  return delta !== '' && !delta.startsWith('..') && !isAbsolute(delta);
}
async function hash(text: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
    .map((value) => value.toString(16).padStart(2, '0')).join('');
}
async function ownedDirectory(path: string, uid: number): Promise<void> {
  const entry = await Deno.lstat(path);
  if (
    !entry.isDirectory || entry.isSymlink || entry.uid !== uid ||
    await Deno.realPath(path) !== resolve(path)
  ) throw new Error('diagnostic_directory_refused');
}
async function runnerArtifactDirectory(root: string, uid: number): Promise<string> {
  const resolved = resolve(root);
  await ownedDirectory(resolved, uid);
  let current = resolved;
  for (const name of INVOCATION_ARTIFACT_DIRECTORY.split('/')) {
    current = join(current, name);
    try {
      await Deno.mkdir(current, { mode: 0o700 });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
    }
    await ownedDirectory(current, uid);
  }
  return current;
}
async function writeArtifact(
  parent: string,
  path: string,
  value: unknown,
  uid: number,
): Promise<void> {
  // Private function: only the complete explicit safe projection below reaches this boundary.
  const text = JSON.stringify(value) + '\n';
  if (new TextEncoder().encode(text).length > MAX_ARTIFACT_BYTES) {
    throw new Error('diagnostic_budget_exceeded');
  }
  await ownedDirectory(parent, uid);
  const temporary = await Deno.makeTempFile({ dir: parent, prefix: '.diagnostic-' });
  try {
    await Deno.writeTextFile(temporary, text);
    await ownedDirectory(parent, uid);
    await Deno.rename(temporary, path);
  } finally {
    await Deno.remove(temporary).catch(() => {});
  }
}

/** Collect directly into the owned flat artifact root, never recurse through workspace data. */
export async function saveOwnedInvocationDiagnostics(input: {
  readonly projectRoot: string;
  readonly appHost: string;
  readonly kind: 'cleanup' | 'restart';
  readonly home: string;
  readonly uid: number;
  readonly runnerRoot?: string;
  readonly transcripts: readonly CapturedInvocation[];
  readonly survivorCounts?: {
    readonly ownedContainers: number;
    readonly foreignContainers: number;
    readonly unprovenContainers: number;
  };
}): Promise<void> {
  const { projectRoot, kind } = input;
  await ownedDirectory(resolve(projectRoot), input.uid);
  const delta = relative(resolve(projectRoot), resolve(input.appHost));
  const targetMatches = delta !== '' && !delta.startsWith('..') && !isAbsolute(delta);
  if (!targetMatches) throw new Error('diagnostic_target_refused');
  const workspaceKey = await hash(resolve(projectRoot));
  let parent: string, output: string;
  if (input.runnerRoot) {
    if (!within(input.runnerRoot, projectRoot)) throw new Error('diagnostic_workspace_refused');
    parent = await runnerArtifactDirectory(input.runnerRoot, input.uid);
    output = join(parent, `${kind}-${workspaceKey}-diagnostic.json`);
  } else {
    parent = join(resolve(projectRoot), '.netscript');
    await ownedDirectory(parent, input.uid);
    output = join(parent, `e2e-${kind}-diagnostic.json`);
  }
  // A failed collector leaves an explicit unavailable record, never a fabricated complete artifact.
  await writeArtifact(parent, output, {
    schema: 1,
    kind,
    workspaceKey,
    status: 'unavailable',
    reason: 'collection_incomplete',
  }, input.uid);
  const commands = [];
  for (const [index, invocation] of input.transcripts.slice(0, 4).entries()) {
    commands.push(
      await invocationDiagnostic({
        invocation,
        ordinal: index + 1,
        operation: kind === 'cleanup' ? 'stop' : 'restart',
        targetMatches,
        logRoot: join(input.home, '.aspire', 'logs'),
        uid: input.uid,
      }),
    );
  }
  const counts = input.survivorCounts;
  const value = {
    schema: 1,
    kind,
    workspaceKey,
    status: 'collected',
    target: delta,
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
  await writeArtifact(parent, output, value, input.uid);
}
