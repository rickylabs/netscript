import { join } from '@std/path';

/** Run source-backed probe code against the committed repository resolution graph. */
export async function runLockedProbe(
  args: readonly string[],
  cwd: string,
  repoRoot: string,
): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--config',
      join(repoRoot, 'deno.json'),
      '--lock',
      join(repoRoot, 'deno.lock'),
      '--frozen',
      ...args,
    ],
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!result.success) throw new Error('Locked probe command failed: ' + result.code);
}
