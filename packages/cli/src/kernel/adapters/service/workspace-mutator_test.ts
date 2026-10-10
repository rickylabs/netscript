import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { regenerateAspireHelpers } from './workspace-mutator.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';

function appsettings(): string {
  return JSON.stringify({
    NetScript: {
      Name: 'shop',
      Version: '1.0.0',
      Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
      Databases: {},
      Cache: {},
      Services: {},
      Plugins: {},
      BackgroundProcessors: {},
      Apps: {},
      Tools: {},
    },
  });
}

Deno.test('Aspire helper regeneration compares and writes canonical content', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);
  const formattedPaths: string[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (path, content) => {
      formattedPaths.push(path);
      return Promise.resolve(`// canonical\n${content}`);
    },
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };

  try {
    const repoRoot = new URL('../../../../../../', import.meta.url);
    await fs.writeFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          '@netscript/config': new URL('packages/config/mod.ts', repoRoot).href,
        },
      }),
    );
    await fs.writeFile(
      join(root, 'netscript.config.ts'),
      `import { defineConfig } from '@netscript/config';

export default defineConfig({ name: 'shop', databases: { config: [] }, plugins: [] });
`,
    );
    await fs.writeFile(join(root, 'appsettings.json'), appsettings());
    await fs.createDir(join(root, 'aspire'));
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const first = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      formatter,
    });
    const helperPath = join(root, '.netscript', 'aspire-cli.ts');
    assertEquals(first.includes(helperPath), true);
    assertStringIncludes(await fs.readFile(helperPath), 'NETSCRIPT_ASPIRE_CLI');
    assertStringIncludes(await fs.readFile(helperPath), 'netscript generate aspire');
    const snapshot = await readFiles(fs, first);
    const dryRun = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      dryRun: true,
      force: true,
      formatter,
    });
    assertEquals(dryRun, first);
    assertEquals(await readFiles(fs, first), snapshot);

    const forced = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      force: true,
      formatter,
    });
    const second = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      formatter,
    });

    assertEquals(first.length > 0, true);
    assertEquals(forced, first);
    assertEquals(second, []);
    assertEquals(formattedPaths.length, first.length * 4);
    await fs.writeFile(helperPath, '// stale helper');
    const preview = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      dryRun: true,
      formatter,
    });
    assertEquals(preview, [helperPath]);
    assertEquals(await fs.readFile(helperPath), '// stale helper');
    assertEquals(
      await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, { formatter }),
      [helperPath],
    );
    for (const path of first) {
      assertEquals((await fs.readFile(path)).startsWith('// canonical\n'), true);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function readFiles(
  fs: DenoFileSystem,
  paths: readonly string[],
): Promise<Readonly<Record<string, string>>> {
  return Object.fromEntries(
    await Promise.all(paths.map(async (path) => [path, await fs.readFile(path)] as const)),
  );
}

// #1996: `generate aspire` in a --no-aspire project names the real cause.
Deno.test('Aspire helper regeneration refuses a project scaffolded without Aspire', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', appsettings());
  const templateAdapter = new StringTemplateAdapter(fs);

  await assertRejects(
    () =>
      regenerateAspireHelpers(
        '/project',
        fs,
        new Scaffolder(templateAdapter, fs),
        templateAdapter,
      ),
    ScaffoldValidationError,
    'this project was scaffolded without Aspire (netscript init --no-aspire)',
  );
});
