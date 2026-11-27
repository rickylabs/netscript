import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { DenoGeneratedSourceFormatter } from '../../../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
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
    formatContents: (files) => Promise.resolve(files.map((file) => file.content)),
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
      () =>
        generateAspire({ projectRoot: root }, {
          fs,
          scaffolder,
          templateAdapter,
          formatter: new DenoGeneratedSourceFormatter(new DenoProcess()),
        }),
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

Deno.test('generateAspire and public generate aspire commands refuse legacy workspaces before loading config or writing node_modules', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);

  try {
    await fs.writeFile(
      join(root, 'deno.json'),
      JSON.stringify({
        nodeModulesDir: 'auto',
        imports: {
          '@netscript/config': 'jsr:@netscript/config@^0.0.9',
        },
      }),
    );
    await fs.writeFile(
      join(root, 'netscript.config.ts'),
      "import { defineConfig } from '@netscript/config';\nexport default defineConfig({ name: 'shop', databases: { config: [] }, plugins: [] });\n",
    );
    await fs.writeFile(join(root, 'appsettings.json'), appsettings());
    await fs.createDir(join(root, 'aspire'));
    await fs.writeFile(
      join(root, 'aspire', 'package.json'),
      JSON.stringify({ name: 'shop-apphost', private: true }),
    );

    let validateCalled = false;
    await assertRejects(
      () =>
        generateAspire({ projectRoot: root }, {
          fs,
          scaffolder: new Scaffolder(templateAdapter, fs),
          templateAdapter,
          formatter: new DenoGeneratedSourceFormatter(new DenoProcess()),
          validateComposition: () => {
            validateCalled = true;
            return Promise.resolve();
          },
        }),
      ScaffoldValidationError,
      'Legacy Node.js Aspire AppHost detected',
    );
    assertEquals(validateCalled, false);

    const beforeTree = await listTree(root);
    const cliEntry = fromFileUrl(new URL('../../../../../bin/netscript-dev.ts', import.meta.url));
    const repoLock = fromFileUrl(new URL('../../../../../../../deno.lock', import.meta.url));
    for (const subArgs of [['generate', 'aspire'], ['generate', 'aspire', '--check']]) {
      const result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          `--lock=${repoLock}`,
          '--frozen',
          '-A',
          cliEntry,
          ...subArgs,
          '--project-root',
          root,
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const combinedOutput = new TextDecoder().decode(result.stdout) +
        new TextDecoder().decode(result.stderr);
      assertEquals(result.code !== 0, true);
      assertStringIncludes(
        combinedOutput,
        'Legacy Node.js Aspire AppHost detected',
      );
      assertEquals(await listTree(root), beforeTree);
      assertEquals(await fs.exists(join(root, 'node_modules')), false);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function listTree(dir: string): Promise<string[]> {
  const entries: string[] = [];
  async function walk(current: string, prefix: string): Promise<void> {
    const items: Deno.DirEntry[] = [];
    for await (const entry of Deno.readDir(current)) items.push(entry);
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      const rel = prefix ? `${prefix}/${item.name}` : item.name;
      entries.push(`${item.isDirectory ? 'd' : 'f'}:${rel}`);
      if (item.isDirectory) await walk(join(current, item.name), rel);
    }
  }
  await walk(dir, '');
  return entries;
}

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
