import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { regenerateAspireHelpers } from './workspace-mutator.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';

function appsettings(databases: Record<string, unknown> = {}): string {
  return JSON.stringify({
    NetScript: {
      Name: 'shop',
      Version: '1.0.0',
      Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
      Databases: databases,
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
    await writeProject(fs, root);
    await fs.writeFile(join(root, 'appsettings.json'), appsettings());
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const first = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      formatter,
    });
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

Deno.test('Aspire helper regeneration declares pg for an existing PostgreSQL AppHost', async () => {
  // Regression (#1726 IMPL-EVAL): the regenerated helpers emit `postgres_auth`, which loads `pg`;
  // an AppHost scaffolded before this check existed must gain the dependency on the same path.
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  try {
    await writeProject(fs, root);
    await fs.writeFile(
      join(root, 'appsettings.json'),
      appsettings({ main: { Engine: 'Postgres', Mode: 'Container', DatabaseName: 'main' } }),
    );
    const packageJsonPath = join(root, 'aspire', 'package.json');
    const legacyPackageJson = JSON.stringify({
      name: 'shop-apphost',
      dependencies: { 'vscode-jsonrpc': '8.2.0', 'left-pad': '1.3.0' },
    });
    await fs.writeFile(packageJsonPath, legacyPackageJson);

    const dryRun = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, {
      dryRun: true,
    });
    assertEquals(dryRun.includes(packageJsonPath), true);
    assertEquals(await fs.readFile(packageJsonPath), legacyPackageJson);

    const written = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter);
    const helper = await fs.readFile(join(root, 'aspire', '.helpers', 'register-infrastructure.mts'));
    assertEquals(helper.includes('withHealthCheck("main_auth")'), true);
    assertEquals(written.includes(packageJsonPath), true);
    assertEquals(JSON.parse(await fs.readFile(packageJsonPath)).dependencies, {
      'vscode-jsonrpc': '8.2.0',
      'left-pad': '1.3.0',
      pg: SCAFFOLD_VERSIONS.APPHOST_PG,
    });

    const again = await regenerateAspireHelpers(root, fs, scaffolder, templateAdapter);
    assertEquals(again.includes(packageJsonPath), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function writeProject(fs: DenoFileSystem, root: string): Promise<void> {
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
  await fs.createDir(join(root, 'aspire'));
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
