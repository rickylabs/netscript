import { writeInstalledAuthFixture } from '../../../../../tests/installed-auth-fixture.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, join, toFileUrl } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../../../src/kernel/adapters/scaffold/memory-fs.ts';
import { Scaffolder } from '../../../../../src/kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../../src/kernel/adapters/scaffold/template-adapter.ts';
import { ServiceScaffolder } from '../../../../../src/kernel/adapters/service/scaffolder.ts';
import { createContractScaffolder } from '../../../../../src/kernel/adapters/contracts/contract-scaffolder.ts';
import { DefaultContractTemplateRegistry } from '../../../../../src/kernel/adapters/contracts/templates/contract-template-registry.ts';
import { ContractVersionRegistry } from '../../../../../src/kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../../src/kernel/adapters/contracts/workspace-resolver.ts';
import { DenoGeneratedSourceFormatter } from '../../../../../src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../../../../../src/kernel/adapters/runtime/process/deno-process.ts';
import { GUARDED_SERVICE_PROBE_SOURCE } from './guarded-service-probe-source.ts';

Deno.test('generated guarded service: native sessions enforce REST/RPC/discovery 401/403/200 and health 200', async () => {
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
  await fs.writeFile('/project/deno.json', JSON.stringify({ workspace: [], imports: {} }));
  await writeInstalledAuthFixture(fs, '/project');
  await createContractScaffolder({
    scaffolder,
    templateAdapter,
    templateRegistry: new DefaultContractTemplateRegistry(),
    versionRegistry: new ContractVersionRegistry(fs, formatter),
    workspaceResolver: new ContractWorkspaceResolver(fs),
    formatter,
  }).scaffoldFull({
    options: {
      projectName: 'guard-probe',
      targetPath: '/project',
      importMode: 'jsr',
      force: false,
    },
    serviceContract: { serviceName: 'guarded', version: 'v1' },
  });
  const result = await new ServiceScaffolder(scaffolder, fs, templateAdapter, formatter).scaffold({
    projectName: 'guard-probe',
    targetPath: '/project',
    serviceName: 'guarded',
    servicePort: 3000,
    importMode: 'jsr',
    force: false,
  });
  const root = await Deno.makeTempDir({ prefix: 'guarded-service-' });
  try {
    for (
      const path of [
        'contracts/mod.ts',
        'contracts/versions/v1/mod.ts',
        'contracts/versions/v1/guarded.contract.ts',
        ...result.scaffoldResult.filesCreated.map((path) => path.slice('/project/'.length)),
      ]
    ) {
      const target = join(root, path);
      await Deno.mkdir(dirname(target), { recursive: true });
      const source = await fs.readFile('/project/' + path);
      await Deno.writeTextFile(
        target,
        path.endsWith('/main.ts')
          ? source.replace(
            'await defineService(router, {',
            'export const running = await defineService(router, {',
          )
          : source,
      );
    }
    const repo = new URL('../../../../../../../', import.meta.url);
    const config = JSON.parse(await Deno.readTextFile(new URL('deno.json', repo))) as {
      imports: Record<string, string>;
      catalog: Record<string, string>;
    };
    await Deno.writeTextFile(
      join(root, 'imports.json'),
      JSON.stringify({
        imports: {
          ...config.imports,
          ...Object.fromEntries(
            ['@orpc/server', '@orpc/contract', 'zod'].map((
              name,
            ) => [name, `npm:${name}@${config.catalog[name]}`]),
          ),
          '@guard-probe/contracts': toFileUrl(join(root, 'contracts/mod.ts')).href,
        },
      }),
    );
    const probe = join(root, 'probe.ts');
    await Deno.writeTextFile(
      probe,
      GUARDED_SERVICE_PROBE_SOURCE
        .replaceAll('__AUTH_SOURCE__', new URL('plugins/auth/services/src', repo).href)
        .replaceAll('__SERVICE_MAIN__', toFileUrl(join(root, 'services/guarded/src/main.ts')).href)
        .replaceAll(
          '__HTTP_CONTRACT__',
          new URL('../../../domain/http-contract.ts', import.meta.url).href,
        ),
    );
    const execution = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '-A',
        '--unstable-kv',
        '--config',
        new URL('deno.json', repo).pathname,
        '--import-map',
        join(root, 'imports.json'),
        probe,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const output = new TextDecoder().decode(execution.stdout) +
      new TextDecoder().decode(execution.stderr);
    assertEquals(execution.code, 0, output);
    assertStringIncludes(
      output,
      'Generated guarded service PASS: REST/RPC/discovery anonymous401, insufficient403, permitted200; anonymous health200',
    );
    assertEquals(result.configEntry.PluginReferences, ['auth']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
