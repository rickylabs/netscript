import { parseAppSettings } from '@netscript/aspire/config';
import { HelpersGeneratorPipeline } from '../../templates/aspire/helpers/helpers-generator-pipeline.ts';
import { ASPIRE_SURFACE_MARKER } from '../../domain/aspire-generated-surface.ts';
import { DenoGeneratedSourceFormatter } from '../runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';
import type { ProcessPort } from '../../ports/process-port.ts';
import { checkAspire } from '../../../public/features/generate/aspire/check-aspire.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { regenerateAspireHelpers } from './workspace-mutator.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';

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
    formatContents: (files) =>
      Promise.resolve(files.map((file) => {
        formattedPaths.push(file.targetPath);
        return `// canonical\n${file.content}`;
      })),
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

Deno.test('plugin-add helper regeneration degrades on probe timeout; inspection retains its typed cause', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);
  const nativeProcess = new DenoProcess();
  let timeouts = 0;
  const process: ProcessPort = {
    exec: (command, args, options) => {
      if (args.some((arg) => arg.endsWith('/configured-plugin-manifest-probe-child.ts'))) {
        timeouts++;
        return Promise.resolve({ code: 124, stdout: '', stderr: '', timedOut: true });
      }
      return nativeProcess.exec(command, args, options);
    },
  };
  try {
    await fs.writeFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          '@netscript/config':
            new URL('../../../../../../packages/config/mod.ts', import.meta.url).href,
        },
      }),
    );
    await fs.writeFile(
      join(root, 'netscript.config.ts'),
      `import { defineConfig } from '@netscript/config';
export default defineConfig({ name: 'shop', databases: { config: [] }, plugins: ['@fixture/plugin-timeout'] });
`,
    );
    await fs.writeFile(join(root, 'appsettings.json'), appsettings());
    await fs.createDir(join(root, 'aspire'));
    // This is the same helper boundary called after plugin installation/reconciliation.
    const written = await regenerateAspireHelpers(
      root,
      fs,
      new Scaffolder(templateAdapter, fs),
      templateAdapter,
      { process, formatter: new DenoGeneratedSourceFormatter(nativeProcess) },
    );
    assertEquals(written.length, 13);
    const before = await readFiles(fs, written);
    const report = await checkAspire(root, {
      fs,
      templateAdapter,
      process,
      formatter: new DenoGeneratedSourceFormatter(nativeProcess),
    });
    assertEquals(timeouts, 2);
    assertEquals(report.status, 'inspection-failure');
    assertEquals(report.exitCode, 1);
    assertEquals(report.outputs, []);
    assertEquals(report.drift[0].kind, 'inspection-failure');
    assertStringIncludes(report.drift[0].message ?? '', '@fixture/plugin-timeout');
    assertStringIncludes(report.drift[0].message ?? '', 'timed out');
    assertStringIncludes(report.drift[0].message ?? '', '30000');
    assertEquals(await readFiles(fs, written), before);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('Aspire regeneration formats all 13 outputs in one process with byte-identical results', async () => {
  const controlModule = Deno.env.get('NETSCRIPT_ASPIRE_REGEN_MODULE');
  const regenerate: typeof regenerateAspireHelpers = controlModule
    ? (await import(controlModule)).regenerateAspireHelpers
    : regenerateAspireHelpers;
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templates = new StringTemplateAdapter(fs);
  const nativeProcess = new DenoProcess();
  let formattingProcesses = 0;
  const process: ProcessPort = {
    exec: (command, args, options) => {
      if (command === 'deno' && args[0] === 'fmt') formattingProcesses++;
      return nativeProcess.exec(command, args, options);
    },
  };
  const formatter = new DenoGeneratedSourceFormatter(process);
  try {
    await fs.writeFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        imports: {
          '@netscript/config':
            new URL('../../../../../../packages/config/mod.ts', import.meta.url).href,
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
    const scaffolder = new Scaffolder(templates, fs);
    const files = await regenerate(root, fs, scaffolder, templates, {
      formatter,
      process,
    });
    assertEquals(files.length, 13);
    assertEquals(formattingProcesses, 1);
    const parsed = await parseAppSettings(join(root, 'appsettings.json'));
    const raw = await new HelpersGeneratorPipeline(templates).execute({
      config: parsed.config,
      configPath: '../appsettings.json',
      generateAppHost: true,
    });
    // The previous per-file formatter is the compatibility oracle, outside the counted boundary.
    const previousFormatter = new DenoGeneratedSourceFormatter(nativeProcess);
    for (const file of raw) {
      const path = join(root, 'aspire', file.path);
      assertEquals(
        await fs.readFile(path),
        await previousFormatter.formatContent(path, ASPIRE_SURFACE_MARKER + file.content),
      );
    }
    assertEquals(
      await regenerate(root, fs, scaffolder, templates, { formatter, process }),
      [],
    );
    assertEquals(formattingProcesses, 2);
    const report = await checkAspire(root, { fs, templateAdapter: templates, formatter, process });
    assertEquals(report.status, 'current');
    assertEquals(formattingProcesses, 3);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
