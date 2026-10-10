import { assertEquals } from '@std/assert';
import { walk } from '@std/fs';
import { join } from '@std/path';

Deno.test('public guarded service probe leaves the shared project unchanged and removes its scratch project', async () => {
  const root = await Deno.makeTempDir({ prefix: 'guarded-service-isolation-' });
  const repo = new URL('../../../../../../../', import.meta.url).pathname;
  const shared = join(root, 'shared');
  const run = async (args: string[], env?: Record<string, string>) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--no-lock', '-A', ...args],
      cwd: repo,
      env,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(
      result.code,
      0,
      new TextDecoder().decode(result.stderr) + new TextDecoder().decode(result.stdout),
    );
  };
  const snapshot = async () => {
    const files = new Map<string, string>();
    for await (const file of walk(shared, { includeDirs: false })) {
      files.set(file.path, await Deno.readTextFile(file.path));
    }
    return files;
  };
  try {
    await run([
      join(repo, 'packages/cli/bin/netscript.ts'),
      'init',
      'shared',
      '--path',
      root,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--editor',
      'none',
    ]);
    const before = await snapshot();
    await run([
      '--unstable-kv',
      new URL('./probe-generated-guarded-service.ts', import.meta.url).pathname,
      shared,
      repo,
    ], { TMPDIR: root });
    assertEquals(await snapshot(), before);
    const entries: string[] = [];
    for await (const entry of Deno.readDir(root)) entries.push(entry.name);
    assertEquals(entries, ['shared']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
