import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { generateAspire } from './generate-aspire.ts';
import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../../../kernel/constants/scaffold/scaffold-app-catalog.ts';
import { ConfigError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { PLUGIN_COMPOSITION_INVALID_EXIT_CODE } from '../../../../kernel/application/plugin/plugin-composition.ts';

Deno.test('generateAspire applies dry-run and force to helper regeneration', async () => {
  const calls: unknown[] = [];
  const formatter: GeneratedSourceFormatterPort = {
    formatContent: (_path, content) => Promise.resolve(content),
    formatFiles: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
  };
  const result = await generateAspire({
    projectRoot: '/workspace/shop',
    dryRun: true,
    force: true,
  }, {
    fs: new MemoryFileSystemAdapter(),
    scaffolder: {} as ScaffolderPort,
    templateAdapter: {} as TemplatePort,
    formatter,
    validateComposition: (projectRoot) => {
      calls.push({ validated: projectRoot });
      return Promise.resolve();
    },
    regenerateHelpers: (_root, _fs, _scaffolder, _template, options) => {
      calls.push(options);
      return Promise.resolve(['/workspace/shop/aspire/apphost.ts']);
    },
  });

  assertEquals(calls, [{ validated: '/workspace/shop' }, { dryRun: true, force: true, formatter }]);
  assertEquals(result.helperFiles, ['/workspace/shop/aspire/apphost.ts']);
});

Deno.test('generateAspire rejects an invalid configured plugin composition before writing', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);

  try {
    const repoRoot = new URL('../../../../../../../', import.meta.url);
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
      () => generateAspire({ projectRoot: root }, { fs, scaffolder, templateAdapter }),
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
