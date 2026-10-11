import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { checkDesktopReferenceLock, checkReferenceLock } from './check-reference-locks.ts';

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

Deno.test('reference lock guard checks scratch-probe entrypoints and rejects npm drift', async () => {
  const reference = await Deno.makeTempDir({ prefix: 'probe-reference-lock-' });
  try {
    const committed = JSON.parse(
      await Deno.readTextFile(new URL('../../../deno.lock', import.meta.url)),
    );
    const specifier = 'npm:@orpc/client@1.15.0';
    const version = committed.specifiers[specifier];
    const lock = {
      version: committed.version,
      specifiers: { [specifier]: version },
      npm: committed.npm,
      workspace: { dependencies: [specifier] },
    };
    const lockPath = join(reference, 'deno.lock');
    await Deno.writeTextFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
    const config = { imports: { dependency: 'npm:@orpc/client@1.15.0' } };
    await Deno.writeTextFile(join(reference, 'deno.json'), JSON.stringify(config));
    await Deno.writeTextFile(join(reference, 'probe.ts'), "import 'dependency';\n");
    const locked = await Deno.readTextFile(lockPath);
    assertEquals(await checkReferenceLock(reference, ['probe.ts']), true);
    config.imports.dependency = 'npm:@orpc/client@1.15.5';
    await Deno.writeTextFile(join(reference, 'deno.json'), JSON.stringify(config));
    assertEquals(await checkReferenceLock(reference, ['probe.ts']), false);
    assertEquals(await Deno.readTextFile(lockPath), locked);
  } finally {
    await Deno.remove(reference, { recursive: true });
  }
});

Deno.test('desktop scratch reference lock matches its prepared source and catalog graph', async () => {
  const repoRoot = fromFileUrl(new URL('../../../', import.meta.url));
  const lockPath = join(repoRoot, 'packages/cli/e2e/fixtures/desktop-native/deno.lock');
  const locked = await Deno.readTextFile(lockPath);
  assertEquals(await checkDesktopReferenceLock(repoRoot), true);
  assertEquals(await Deno.readTextFile(lockPath), locked);
});
