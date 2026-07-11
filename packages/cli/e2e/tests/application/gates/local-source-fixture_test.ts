import { assertEquals } from '@std/assert';
import {
  localSourceFixtureScript,
  prepareLocalSourceFixture,
  resolveLocalSourceImports,
} from '../../../src/application/gates/scaffold/local-source-fixture.ts';

Deno.test('resolveLocalSourceImports maps an explicit package set from its source base', () => {
  assertEquals(
    resolveLocalSourceImports('/repo/', [
      { specifier: '@netscript/ai', entrypoint: 'packages/ai/mod.ts' },
      { specifier: '@netscript/sdk/client', entrypoint: 'packages/sdk/src/client/mod.ts' },
    ]),
    {
      '@netscript/ai': '/repo/packages/ai/mod.ts',
      '@netscript/sdk/client': '/repo/packages/sdk/src/client/mod.ts',
    },
  );
});

Deno.test('prepareLocalSourceFixture rewrites selected generated workspace targets', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({
        imports: { preact: 'npm:preact@^10.0.0' },
        compilerOptions: { strict: true },
      }),
    );
    await prepareLocalSourceFixture({
      projectRoot: root,
      sourceBase: './packages',
      packages: [{ specifier: '@netscript/ai', entrypoint: 'ai/mod.ts' }],
      imports: { '@std/assert': 'jsr:@std/assert@^1.0.0' },
      targets: [
        { path: 'deno.json', includeConfig: true },
        { path: '.netscript/e2e/import-map.json' },
      ],
    });

    const config = JSON.parse(await Deno.readTextFile(`${root}/deno.json`));
    const importMap = JSON.parse(await Deno.readTextFile(`${root}/.netscript/e2e/import-map.json`));
    assertEquals(config.compilerOptions, { strict: true });
    assertEquals(config.imports['@netscript/ai'], './packages/ai/mod.ts');
    assertEquals(config.imports.preact, 'npm:preact@^10.0.0');
    assertEquals(importMap.imports, config.imports);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('localSourceFixtureScript prepares a generated project through deno eval', async () => {
  const root = await Deno.makeTempDir();
  const script = localSourceFixtureScript({
    projectRoot: '.',
    sourceBase: './packages',
    packages: [{ specifier: '@netscript/ai', entrypoint: 'ai/mod.ts' }],
    targets: [{ path: 'deno.json', includeConfig: true }],
  });
  try {
    await Deno.writeTextFile(`${root}/deno.json`, JSON.stringify({ imports: {} }));
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['eval', script],
      cwd: root,
    }).output();
    assertEquals(result.success, true, new TextDecoder().decode(result.stderr));
    const config = JSON.parse(await Deno.readTextFile(`${root}/deno.json`));
    assertEquals(config.imports['@netscript/ai'], './packages/ai/mod.ts');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
