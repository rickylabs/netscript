import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { checkReferenceLock } from './check-reference-locks.ts';

Deno.test('reference lock guard rejects range drift without rewriting the lock', async () => {
  const reference = await Deno.makeTempDir();
  try {
    const config = { imports: { assert: 'jsr:@std/assert@1.0.19' } };
    await Deno.writeTextFile(join(reference, 'deno.json'), JSON.stringify(config));
    await Deno.writeTextFile(join(reference, 'stream-react.fixture.ts'), "import 'assert';\n");
    const installed = await new Deno.Command(Deno.execPath(), {
      cwd: reference,
      args: ['install', '--lock=deno.lock', '--entrypoint', 'stream-react.fixture.ts'],
      stdout: 'null',
      stderr: 'piped',
    }).output();
    assertEquals(installed.code, 0, new TextDecoder().decode(installed.stderr));
    const lockPath = join(reference, 'deno.lock');
    const locked = await Deno.readTextFile(lockPath);
    assertEquals(await checkReferenceLock(reference), true);
    config.imports.assert = 'jsr:@std/assert@^1.0.19';
    await Deno.writeTextFile(join(reference, 'deno.json'), JSON.stringify(config));
    assertEquals(await checkReferenceLock(reference), false);
    assertEquals(await Deno.readTextFile(lockPath), locked);
  } finally {
    await Deno.remove(reference, { recursive: true });
  }
});

Deno.test('committed Expo reference lock matches its current workspace source graph', async () => {
  const reference = fromFileUrl(
    new URL('../../../resources/examples/expo-streams', import.meta.url),
  );
  assertEquals(await checkReferenceLock(reference), true);
});
