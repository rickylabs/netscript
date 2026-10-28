import { assertEquals, assertStringIncludes } from '@std/assert';
import { fileURLToPath } from 'node:url';

const PACKAGE = new URL('../', import.meta.url);

Deno.test('embedded token JSON freshness rejects changed sources and missing assets without repair', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-token-embed-' });
  try {
    for (
      const source of [
        'deno.json',
        'scripts/embed-token-assets.ts',
        'tokens/',
        'registry/theme/theme-items.json',
        'src/tokens/assets/',
        'registry.theme-items.generated.ts',
      ]
    ) {
      await copyFixture(new URL(source, PACKAGE), `${root}/${source}`);
    }
    const run = () =>
      new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--config',
          fileURLToPath(new URL('deno.json', PACKAGE)),
          '--lock',
          fileURLToPath(new URL('deno.lock', PACKAGE)),
          '--frozen',
          `--allow-read=${root}`,
          '--allow-run=deno',
          `${root}/scripts/embed-token-assets.ts`,
          '--check',
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
    const clean = await run();
    assertEquals(clean.code, 0, new TextDecoder().decode(clean.stderr));
    const generated = `${root}/src/tokens/assets/metadata.generated.ts`;
    const original = await Deno.readTextFile(generated);
    const source = `${root}/tokens/font-requests.json`;
    const bytes = await Deno.readTextFile(source);
    const data = JSON.parse(bytes);
    data.description = 'Deliberately changed source';
    await Deno.writeTextFile(source, JSON.stringify(data));
    assertEquals((await run()).code, 1);
    assertEquals(await Deno.readTextFile(generated), original);
    await Deno.writeTextFile(source, bytes);
    await Deno.remove(generated);
    assertEquals((await run()).code, 1);
    assertEquals(await Deno.stat(generated).catch(() => undefined), undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

/** Copy only the source/format boundary and artifacts; never copy dependency caches. */
async function copyFixture(source: URL, target: string): Promise<void> {
  const info = await Deno.stat(source);
  if (info.isDirectory) {
    await Deno.mkdir(target, { recursive: true });
    for await (const entry of Deno.readDir(source)) {
      await copyFixture(
        new URL(`${entry.name}${entry.isDirectory ? '/' : ''}`, source),
        `${target}/${entry.name}`,
      );
    }
  } else {
    await Deno.mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
    await Deno.copyFile(source, target);
  }
}

Deno.test('frozen token check rejects every stale and missing SD artifact without repair', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-token-check-' });
  try {
    for (
      const source of [
        'scripts/build-tokens.ts',
        'tokens.ts',
        'src/tokens/',
        'tokens/',
        'registry/theme/',
      ]
    ) {
      await copyFixture(new URL(source, PACKAGE), `${root}/${source}`);
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
    const originals = new Map<string, string>();
    // Discover the exact declared output set, including nested Figma and preset files.
    const { buildTokens } = await import('../tokens.ts');
    const expected = await buildTokens();
    for (const name of Object.keys(expected.files)) {
      const path = `${root}/registry/theme/${name}`;
      const original = await Deno.readTextFile(path);
      originals.set(name, original);
      await Deno.writeTextFile(path, `${original}\n/* deliberate negative control */\n`);
    }
    const stale = await run(true);
    assertEquals(stale.code, 1);
    for (const [name, original] of originals) {
      assertStringIncludes(new TextDecoder().decode(stale.stderr), name);
      const path = `${root}/registry/theme/${name}`;
      assertEquals(
        await Deno.readTextFile(path),
        `${original}\n/* deliberate negative control */\n`,
      );
      await Deno.remove(path);
    }
    const missing = await run(true);
    assertEquals(missing.code, 1);
    for (const name of originals.keys()) {
      assertStringIncludes(new TextDecoder().decode(missing.stderr), name);
      assertEquals(
        await Deno.stat(`${root}/registry/theme/${name}`).catch(() => undefined),
        undefined,
      );
    }
    const build = await run(false);
    assertEquals(build.code, 0, new TextDecoder().decode(build.stderr));
    for (const [name, original] of originals) {
      assertEquals(await Deno.readTextFile(`${root}/registry/theme/${name}`), original, name);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
