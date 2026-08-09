import { assertEquals, assertNotEquals, assertStringIncludes } from '@std/assert';

Deno.test('frozen Fresh UI check rejects lock drift without rewriting the lock', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-frozen-lock-' });
  try {
    await Deno.writeTextFile(
      `${root}/deno.json`,
      `${JSON.stringify({ imports: { '@std/assert': 'jsr:@std/assert@1' } }, null, 2)}\n`,
    );
    await Deno.writeTextFile(
      `${root}/mod.ts`,
      "import { assert } from '@std/assert';\nassert(true);\n",
    );
    const staleLock = `${
      JSON.stringify({ version: '5', specifiers: {}, jsr: {}, npm: {} }, null, 2)
    }\n`;
    await Deno.writeTextFile(`${root}/deno.lock`, staleLock);

    const result = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--lock=deno.lock', '--frozen', 'mod.ts'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    assertNotEquals(result.code, 0);
    assertStringIncludes(new TextDecoder().decode(result.stderr), 'The lockfile is out of date');
    assertEquals(await Deno.readTextFile(`${root}/deno.lock`), staleLock);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
