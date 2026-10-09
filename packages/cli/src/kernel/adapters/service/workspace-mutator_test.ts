import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { regenerateAspireHelpers } from './workspace-mutator.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { ConfigError } from '../../domain/errors/cli-exit-error.ts';
import { PLUGIN_COMPOSITION_INVALID_EXIT_CODE } from '../../application/plugin/plugin-composition.ts';

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

Deno.test('Aspire helper regeneration rejects an invalid plugin composition before writing', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);

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

export default defineConfig({
  name: 'shop',
  databases: { config: [] },
  plugins: ['./plugins/alpha/mod.ts', './plugins/beta/mod.ts'],
});
`,
    );
    for (const name of ['alpha', 'beta']) {
      await fs.createDir(join(root, 'plugins', name));
      await fs.writeFile(
        join(root, 'plugins', name, 'mod.ts'),
        `export const plugin = {
  name: '@fixture/${name}',
  version: '1.0.0',
  contributions: { services: [{ name: 'shared-api', entrypoint: './main.ts' }] },
};
`,
      );
    }
    await fs.writeFile(join(root, 'appsettings.json'), appsettings());
    await fs.createDir(join(root, 'aspire'));
    const scaffolder = new Scaffolder(templateAdapter, fs);

    const error = await assertRejects(
      () => regenerateAspireHelpers(root, fs, scaffolder, templateAdapter, { dryRun: true }),
      ConfigError,
    );
    assertEquals(error.exitCode, PLUGIN_COMPOSITION_INVALID_EXIT_CODE);
    assertEquals(error.context?.diagnostics, [{
      code: 'duplicate-contribution',
      plugin: '@fixture/beta',
      axis: 'services',
      identity: 'shared-api',
      conflictsWith: '@fixture/alpha',
      message:
        'Plugin "@fixture/beta" declares "services" identity "shared-api" but plugin "@fixture/alpha" already owns it on the root-owned axis.',
    }]);
    assertEquals([...Deno.readDirSync(join(root, 'aspire'))], []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
