import { assertEquals, assertStringIncludes } from '@std/assert';
import { fileURLToPath } from 'node:url';

const PACKAGE = new URL('../', import.meta.url);
const ARTIFACTS = ['tokens.css', 'theme-bridge.css', 'tokens.json'] as const;
const SOURCES = [
  'scripts/build-tokens.ts',
  'tokens/primitives.tokens.json',
  'tokens/semantic.tokens.json',
  'tokens/themes/light.tokens.json',
  'tokens/themes/dark.tokens.json',
  ...ARTIFACTS.map((name) => `registry/theme/${name}`),
];

Deno.test('frozen token check rejects stale and missing artifacts without repairing them', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-token-check-' });
  try {
    for (const source of SOURCES) {
      const target = `${root}/${source}`;
      await Deno.mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
      await Deno.writeTextFile(target, await Deno.readTextFile(new URL(source, PACKAGE)));
    }
    const run = (check: boolean) =>
      new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--config',
          fileURLToPath(new URL('deno.json', PACKAGE)),
          '--lock',
          fileURLToPath(new URL('deno.lock', PACKAGE)),
          '--frozen',
          `--allow-read=${root}`,
          ...(check ? [] : [`--allow-write=${root}/registry/theme`]),
          '--allow-env',
          '--allow-net=registry.npmjs.org',
          `${root}/scripts/build-tokens.ts`,
          ...(check ? ['--check'] : []),
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    const clean = await run(true);
    assertEquals(clean.code, 0, new TextDecoder().decode(clean.stderr));
    for (const artifact of ARTIFACTS) {
      const path = `${root}/registry/theme/${artifact}`;
      const original = await Deno.readTextFile(path);
      const edited = `${original}\n/* deliberate negative control */\n`;
      await Deno.writeTextFile(path, edited);
      const stale = await run(true);
      assertEquals(stale.code, 1);
      assertStringIncludes(new TextDecoder().decode(stale.stderr), artifact);
      assertEquals(await Deno.readTextFile(path), edited, 'check must not repair the edit');
      await Deno.remove(path);
      const missing = await run(true);
      assertEquals(missing.code, 1);
      assertStringIncludes(new TextDecoder().decode(missing.stderr), artifact);
      await Deno.writeTextFile(path, original);
    }
    for (const artifact of ARTIFACTS) {
      await Deno.remove(`${root}/registry/theme/${artifact}`);
    }
    const build = await run(false);
    assertEquals(build.code, 0, new TextDecoder().decode(build.stderr));
    for (const artifact of ARTIFACTS) {
      assertEquals(
        await Deno.readTextFile(`${root}/registry/theme/${artifact}`),
        await Deno.readTextFile(new URL(`registry/theme/${artifact}`, PACKAGE)),
        'frozen build must reproduce the checked-in output',
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
