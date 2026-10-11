import { assertEquals, assertRejects } from '@std/assert';
import { dirname, join, relative, resolve, toFileUrl } from '@std/path';
import { parse } from '@std/jsonc';
import { DenoProjectStage } from './deno-project-stage.ts';
import { DenoFileSystem } from './deno-file-system.ts';
import { readServiceProjectMetadata } from '../../service/workspace-mutator.ts';

Deno.test('project staging isolates binary edits and removals, preserves unchanged files and excludes runtime trees', async () => {
  const parent = await Deno.makeTempDir();
  const projectRoot = join(parent, 'build', 'app');
  const bytes = Uint8Array.from({ length: 150_000 }, (_, index) => index % 256);
  try {
    await Deno.mkdir(projectRoot, { recursive: true });
    await Deno.mkdir(join(projectRoot, '.data'));
    await Deno.mkdir(join(projectRoot, 'empty'));
    await Deno.writeFile(join(projectRoot, 'binary.dat'), bytes);
    await Deno.writeTextFile(join(projectRoot, 'unchanged.ts'), '// untouched\r\n');
    await Deno.writeTextFile(join(projectRoot, 'removed.ts'), '// removed');
    await Deno.writeFile(join(projectRoot, '.data/state'), bytes);
    const unchangedBefore = await Deno.stat(join(projectRoot, 'unchanged.ts'));
    const stage = await new DenoProjectStage().stage(projectRoot);
    try {
      assertEquals(
        await readServiceProjectMetadata(stage.root, new DenoFileSystem()),
        await readServiceProjectMetadata(projectRoot, new DenoFileSystem()),
      );
      assertEquals((await Deno.stat(join(stage.root, 'empty'))).isDirectory, true);
      await assertRejects(() => Deno.stat(join(stage.root, '.data')), Deno.errors.NotFound);
      bytes[100_000] = 42;
      await Deno.writeFile(join(stage.root, 'binary.dat'), bytes);
      await Deno.writeFile(join(stage.root, 'new.dat'), bytes);
      await Deno.remove(join(stage.root, 'removed.ts'));
      assertEquals((await Deno.readFile(join(projectRoot, 'binary.dat')))[100_000], 160);
      await Deno.stat(join(projectRoot, 'removed.ts'));
      await assertRejects(() => Deno.stat(join(projectRoot, 'new.dat')), Deno.errors.NotFound);
      await stage.commit();
      assertEquals(await Deno.readFile(join(projectRoot, 'binary.dat')), bytes);
      assertEquals(await Deno.readFile(join(projectRoot, 'new.dat')), bytes);
      assertEquals((await Deno.readFile(join(projectRoot, '.data/state')))[100_000], 160);
      assertEquals(
        (await Deno.stat(join(projectRoot, 'unchanged.ts'))).mtime,
        unchangedBefore.mtime,
      );
      await assertRejects(() => Deno.stat(join(projectRoot, 'removed.ts')), Deno.errors.NotFound);
    } finally {
      await stage.dispose();
    }
    await assertRejects(() => Deno.stat(stage.root), Deno.errors.NotFound);
    await assertRejects(() => Deno.stat(dirname(stage.root)), Deno.errors.NotFound);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('project stage relocates nested Deno scopes and import maps without changing authored config bytes', async () => {
  const parent = await Deno.makeTempDir();
  const root = join(parent, 'nested', 'app');
  const external = join(parent, 'shared', 'module.ts');
  try {
    await Deno.mkdir(dirname(external), { recursive: true });
    await Deno.writeTextFile(external, 'export const external = true;');
    await Deno.mkdir(join(root, 'tools'), { recursive: true });
    await Deno.writeTextFile(join(root, 'local.ts'), 'export const local = true;');
    const configText = `// Authored comments and whitespace must survive relocation.\r\n${
      JSON.stringify(
        {
          importMap: '../imports.json',
          imports: { local: toFileUrl(join(root, 'local.ts')).href },
          scopes: {
            [relative(join(root, 'tools'), dirname(external)) + '/']: {
              external: relative(join(root, 'tools'), external),
            },
          },
          tasks: { custom: `deno run ${relative(join(root, 'tools'), external)}` },
        },
        null,
        4,
      )
    }\r\n`;
    await Deno.writeTextFile(join(root, 'tools/deno.jsonc'), configText);
    await Deno.writeTextFile(
      join(root, 'imports.json'),
      JSON.stringify({
        imports: {
          external: relative(root, external),
          prefix: relative(root, dirname(external)) + '/',
          remote: 'jsr:@std/assert@^1',
        },
      }),
    );
    const before = await Deno.stat(join(root, 'tools/deno.jsonc'));
    const stage = await new DenoProjectStage().stage(root);
    try {
      const stageConfig = parse(await Deno.readTextFile(join(stage.root, 'tools/deno.jsonc'))) as {
        importMap: string;
        imports: Record<string, string>;
        scopes: Record<string, Record<string, string>>;
      };
      assertEquals(stageConfig.imports.local, toFileUrl(join(stage.root, 'local.ts')).href);
      for (const [scope, imports] of Object.entries(stageConfig.scopes)) {
        assertEquals(resolve(stage.root, 'tools', scope), dirname(external));
        assertEquals(resolve(stage.root, 'tools', imports.external), external);
      }
      const mapPath = resolve(stage.root, 'tools', stageConfig.importMap);
      const map = JSON.parse(await Deno.readTextFile(mapPath));
      assertEquals(resolve(dirname(mapPath), map.imports.external), external);
      assertEquals(resolve(dirname(mapPath), map.imports.prefix), dirname(external));
      map.imports.added = relative(dirname(mapPath), external);
      await Deno.writeTextFile(mapPath, JSON.stringify(map));
      await stage.commit();
      assertEquals(await Deno.readTextFile(join(root, 'tools/deno.jsonc')), configText);
      assertEquals((await Deno.stat(join(root, 'tools/deno.jsonc'))).mtime, before.mtime);
      const committed = JSON.parse(await Deno.readTextFile(join(root, 'imports.json')));
      assertEquals(resolve(root, committed.imports.added), external);
      assertEquals(committed.imports.remote, 'jsr:@std/assert@^1');
    } finally {
      await stage.dispose();
    }
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('project stage omits AppHost build and runtime trees while preserving authored build/dist/bin sources', async () => {
  const root = await Deno.makeTempDir();
  try {
    const excluded = [
      'aspire/bin/Debug/output.dll',
      'aspire/obj/project.assets.json',
      '.aspire/state',
      'vendor/dependency.ts',
      '.deno/cache',
    ];
    const authored = [
      'build/source.ts',
      'nested/dist/source.ts',
      'bin/source.ts',
      'nested/obj/source.ts',
    ];
    for (const path of [...excluded, ...authored]) {
      await Deno.mkdir(dirname(join(root, path)), { recursive: true });
      await Deno.writeTextFile(join(root, path), 'original');
    }
    const stage = await new DenoProjectStage().stage(root);
    try {
      for (const path of excluded) {
        await assertRejects(() => Deno.stat(join(stage.root, path)), Deno.errors.NotFound);
      }
      for (const path of authored) {
        assertEquals(await Deno.readTextFile(join(stage.root, path)), 'original');
        await Deno.writeTextFile(join(stage.root, path), 'updated');
      }
      await stage.commit();
      for (const path of excluded) {
        assertEquals(await Deno.readTextFile(join(root, path)), 'original');
      }
      for (const path of authored) {
        assertEquals(await Deno.readTextFile(join(root, path)), 'updated');
      }
    } finally {
      await stage.dispose();
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
