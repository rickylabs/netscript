import { join } from '@std/path';

/** Reconcile an existing generated lock after workspace or consumer dependencies change. */
export async function installGeneratedProbe(
  projectRoot: string,
  entrypoints: readonly string[],
): Promise<void> {
  const lock = join(projectRoot, 'deno.lock');
  // Mutation may extend the installed graph, but must never start from an unlocked graph.
  await Deno.stat(lock);
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'install',
      '--config',
      join(projectRoot, 'deno.json'),
      '--lock',
      lock,
      '--frozen=false',
      '--entrypoint',
      ...entrypoints,
    ],
    cwd: projectRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!result.success) throw new Error(`Generated probe install failed: ${result.code}`);
}
