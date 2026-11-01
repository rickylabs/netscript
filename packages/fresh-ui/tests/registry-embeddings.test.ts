import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import {
  itemSchema,
  registryJson,
  registrySchema,
} from '../src/registry/assets/registry.generated.ts';

Deno.test('registry TypeScript embeddings preserve the authoritative catalog and pinned schemas', async () => {
  for (
    const [path, embedded] of [
      ['registry.json', registryJson],
      ['src/registry/schemas/registry.json', registrySchema],
      ['src/registry/schemas/registry-item.json', itemSchema],
    ] as const
  ) {
    const source = await Deno.readTextFile(new URL(`../${path}`, import.meta.url));
    assertEquals(embedded, JSON.parse(source), path);
  }
});

Deno.test('registry embedding check rejects changed sources and missing assets without rewriting them', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-registry-embedding-' });
  const output = 'src/registry/assets/registry.generated.ts';
  const run = async (check: boolean) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-config',
        '--no-lock',
        '--allow-read=.',
        ...(check ? [] : ['--allow-write=src/registry/assets']),
        '--allow-run=deno',
        'scripts/embed-registry-assets.ts',
        ...(check ? ['--check'] : []),
      ],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return { code: result.code, stderr: new TextDecoder().decode(result.stderr) };
  };
  try {
    for (
      const path of [
        'registry.json',
        'src/registry/schemas/registry.json',
        'src/registry/schemas/registry-item.json',
        'scripts/embed-registry-assets.ts',
        output,
      ]
    ) {
      const target = join(root, path);
      await Deno.mkdir(join(target, '..'), { recursive: true });
      await Deno.copyFile(new URL(`../${path}`, import.meta.url), target);
    }
    const config = JSON.parse(
      await Deno.readTextFile(new URL('../../../deno.json', import.meta.url)),
    );
    await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ fmt: config.fmt }));
    assertEquals((await run(true)).code, 0);
    const before = await Deno.readTextFile(join(root, output));
    for (
      const path of [
        'registry.json',
        'src/registry/schemas/registry.json',
        'src/registry/schemas/registry-item.json',
      ]
    ) {
      const target = join(root, path);
      const source = await Deno.readTextFile(target);
      const changed = { ...JSON.parse(source), description: 'changed authoritative source' };
      await Deno.writeTextFile(target, JSON.stringify(changed));
      const stale = await run(true);
      assertEquals(stale.code, 1);
      assertStringIncludes(stale.stderr, 'Stale embedded registry assets');
      assertEquals(await Deno.readTextFile(join(root, output)), before);
      await Deno.writeTextFile(target, source);
    }
    await Deno.remove(join(root, output));
    assertEquals((await run(true)).code, 1);
    assert(!(await Array.fromAsync(Deno.readDir(join(root, 'src/registry/assets')))).length);
    const generated = await run(false);
    assertEquals(generated.code, 0, generated.stderr);
    assertEquals(await Deno.readTextFile(join(root, output)), before);
    assertEquals((await run(true)).code, 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
