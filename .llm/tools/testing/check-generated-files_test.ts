import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { assertCheckMatched, checkGeneratedFiles } from './check-generated-files.ts';

const repoRoot = fromFileUrl(new URL('../../../', import.meta.url));

Deno.test('generated type-check rejects an excluded ill-typed file under .llm/tmp', async () => {
  const tmpRoot = join(repoRoot, '.llm/tmp');
  await Deno.mkdir(tmpRoot, { recursive: true });
  const root = await Deno.makeTempDir({ dir: tmpRoot, prefix: 'generated-check-' });
  try {
    const file = join(root, 'broken.ts');
    await Deno.writeTextFile(file, 'export const value: string = 1;\n');
    // Reproduce the historical false green with the actual repository exclude policy.
    const baseline = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--config', join(repoRoot, 'deno.json'), file],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(baseline.code, 0);
    assertStringIncludes(new TextDecoder().decode(baseline.stderr), 'No matching files found');
    await assertRejects(
      () =>
        checkGeneratedFiles({
          args: ['check', '--config', join(repoRoot, 'deno.json'), file],
        }),
      Error,
      'matched no files',
    );
    // With an explicit fixture boundary it must diagnose the real type error.
    await Deno.writeTextFile(join(root, 'deno.json'), '{}\n');
    const broken = await checkGeneratedFiles({ args: ['check', 'broken.ts'], cwd: root });
    assertEquals(broken.success, false);
    assertStringIncludes(new TextDecoder().decode(broken.stderr), 'TS2322');
    await Deno.writeTextFile(file, 'export const value: string = "valid";\n');
    assertEquals((await checkGeneratedFiles({ args: ['check', file], cwd: root })).code, 0);
    // A cached successful check is still valid even when Deno omits its Check banner.
    assertEquals((await checkGeneratedFiles({ args: ['check', file], cwd: root })).code, 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated type-check rejects empty directories and empty check tasks', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ tasks: { check: 'deno check empty/' } }),
    );
    await Deno.mkdir(join(root, 'empty'));
    for (const args of [['check', 'empty/'], ['task', 'check']]) {
      await assertRejects(
        () => checkGeneratedFiles({ args, cwd: root }),
        Error,
        'matched no files',
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated type-check match policy recognizes both output streams and rejects other verbs', async () => {
  assertThrows(() => assertCheckMatched('No matching files found\n'), Error, 'matched no files');
  assertThrows(() => assertCheckMatched('no matching files found\n'), Error, 'matched no files');
  await assertRejects(() => checkGeneratedFiles({ args: ['run', 'probe.ts'] }), Error, 'requires');
});
