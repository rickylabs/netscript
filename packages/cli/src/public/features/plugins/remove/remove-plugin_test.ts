import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { defineConfig } from '@netscript/config';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { netscriptJsrSpecifier } from '../../../../kernel/constants/jsr-specifiers.ts';
import { IoError, RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { PluginDispatchOptions } from '../dispatch/plugin-dispatch-port.ts';
import { createDoctorPluginCommand } from '../doctor/doctor-plugin-command.ts';
import { doctorPlugin } from '../doctor/doctor-plugin-use-case.ts';
import { createPluginInstallCommand } from '../install/install-plugin-command.ts';
import { createRemovePluginCommand } from './remove-plugin-command.ts';
import { removePlugin } from './remove-plugin.ts';
import { writeInstalledAuthFixture } from '../../../../../tests/installed-auth-fixture.ts';
import { SERVICE_PUBLIC_REASON } from '../../../../kernel/adapters/service/auth-policy.ts';

const REPOSITORY_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');

Deno.test('plugin removal rolls back browser reconciliation if helper generation fails', async () => {
  const root = '/workspace/browser-rollback';
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  await fs.writeFile(
    join(root, 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        Services: { users: { Workdir: 'components/users', Entrypoint: 'src/main.ts' } },
        Apps: { web: { Type: 'app', Workdir: 'frontends/web' } },
      },
    }),
  );
  await writeInstalledAuthFixture(fs, root);
  await fs.writeFile(
    join(root, 'sagas/scaffold.plugin.json'),
    JSON.stringify({
      name: '@netscript/plugin-sagas',
    }),
  );
  await fs.writeFile(join(root, 'deno.json'), JSON.stringify({ workspace: [] }));
  await fs.writeFile(join(root, 'frontends/web/utils.ts'), 'export {};\n');
  const mainPath = join(root, 'components/users/src/main.ts');
  const main = `await defineService(router, {
    name: 'users',
    auth: { public: true, reason: '${SERVICE_PUBLIC_REASON}' },
  });\n`;
  await fs.writeFile(mainPath, main);
  await fs.writeFile(join(root, 'aspire/apphost.ts'), 'export {};\n');
  const settings = await fs.readFile(join(root, 'appsettings.json'));
  await assertRejects(
    () =>
      removePlugin({
        projectRoot: root,
        pluginName: 'sagas',
        skipDispatch: true,
      }, {
        fs,
        scaffolder,
        templateAdapter,
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: { exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }) },
        dispatchPort: { dispatch: () => Promise.reject(new Error('dispatch must be skipped')) },
        regenerateHelpers: async () => {
          assertStringIncludes(await fs.readFile(mainPath), 'authenticator: browserAuthenticator');
          assert(await fs.exists(join(root, 'auth/bff.ts')));
          throw new Error('injected failure after browser reconciliation');
        },
      }),
    IoError,
    'Project state was rolled back',
  );
  assertEquals(await fs.readFile(mainPath), main);
  assertEquals(await fs.readFile(join(root, 'appsettings.json')), settings);
  assert(!await fs.exists(join(root, 'auth/bff.ts')));
  assert(!await fs.exists(join(root, 'auth/service.ts')));
  assert(!await fs.exists(join(root, 'frontends/web/routes/auth/[action].ts')));
  assert(await fs.exists(join(root, 'sagas/scaffold.plugin.json')));
});

Deno.test('plugin remove resolves a configured bare name before dispatch and preserves state on failure', async () => {
  const projectRoot = '/workspace/app';
  const fs = new MemoryFileSystemAdapter();
  const appsettings = JSON.stringify(
    {
      NetScript: {
        Plugins: { 'sagas-api': { Enabled: true } },
        BackgroundProcessors: { sagas: { Enabled: true } },
      },
    },
    null,
    2,
  ) + '\n';
  const netscriptConfig = [
    "import { defineConfig } from '@netscript/config';",
    'export default defineConfig({',
    "  name: 'fixture',",
    '  databases: { config: [] },',
    "  plugins: ['./sagas/mod.ts'],",
    '});',
    '',
  ].join('\n');
  await fs.writeFile(`${projectRoot}/appsettings.json`, appsettings);
  await fs.writeFile(`${projectRoot}/netscript.config.ts`, netscriptConfig);
  await fs.writeFile(
    `${projectRoot}/sagas/scaffold.plugin.json`,
    JSON.stringify({ name: '@netscript/plugin-sagas', version: '0.0.5-canary.6' }),
  );

  let dispatched: PluginDispatchOptions | undefined;
  const command = createRemovePluginCommand({
    resolveProjectRoot: () => Promise.resolve(projectRoot),
    print: () => {},
    removePluginDependencies: {
      fs,
      workspaceMutator: new PluginWorkspaceMutator(fs),
      processRunner: {
        exec: () => Promise.reject(new Error('dispatch port owns process execution')),
      },
      dispatchPort: {
        dispatch: (options) => {
          dispatched = options;
          return Promise.reject(new RemoteError(1, 'Plugin removal failed upstream.'));
        },
      },
    },
  });

  const error = await assertRejects(
    () => command.parse(['sagas', '--project-root', projectRoot]),
    RemoteError,
    'Plugin removal failed',
  );

  assert(!error.message.toLowerCase().includes('install'));
  assertEquals(await fs.readFile(`${projectRoot}/appsettings.json`), appsettings);
  assertEquals(await fs.readFile(`${projectRoot}/netscript.config.ts`), netscriptConfig);
  assertEquals(dispatched?.pkg, '@netscript/plugin-sagas');
});

Deno.test('plugin remove rolls back every owned path when regeneration fails after mutation', async () => {
  const projectRoot = '/workspace/app';
  const fs = new MemoryFileSystemAdapter();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const denoBefore =
    JSON.stringify({ workspace: ['./apps/web'], imports: { keep: './keep.ts' } }, null, 2) + '\n';
  const denoAfter = JSON.stringify(
    {
      workspace: ['./apps/web', './plugins', './plugins/*'],
      imports: { keep: './keep.ts', managed: netscriptJsrSpecifier('plugin-sagas') },
    },
    null,
    2,
  ) + '\n';
  const files = new Map<string, string>([
    [
      `${projectRoot}/appsettings.json`,
      JSON.stringify(
        {
          NetScript: {
            Plugins: { 'sagas-api': { Enabled: true } },
            BackgroundProcessors: { sagas: { Enabled: true } },
          },
        },
        null,
        2,
      ) + '\n',
    ],
    [`${projectRoot}/netscript.config.ts`, "export default { plugins: ['./sagas/mod.ts'] };\n"],
    [`${projectRoot}/deno.json`, denoAfter],
    [
      `${projectRoot}/sagas/scaffold.plugin.json`,
      JSON.stringify({
        name: '@netscript/plugin-sagas',
        netscriptInstall: { rootDenoJsonBefore: denoBefore, rootDenoJsonAfter: denoAfter },
      }),
    ],
    [`${projectRoot}/sagas/mod.ts`, 'export {};\n'],
    [`${projectRoot}/.netscript/generated/plugin-sagas/sagas.registry.ts`, 'export {};\n'],
    [`${projectRoot}/database/postgres/schema/plugins/sagas/sagas.prisma`, 'model Saga {}\n'],
    [`${projectRoot}/aspire/helpers/register-plugins.ts`, 'export const plugins = ["sagas"];\n'],
  ]);
  for (const [path, content] of files) await fs.writeFile(path, content);

  const error = await assertRejects(
    () =>
      createRemovePluginCommand({
        resolveProjectRoot: () => Promise.resolve(projectRoot),
        print: () => {},
        removePluginDependencies: {
          fs,
          scaffolder,
          templateAdapter,
          workspaceMutator: new PluginWorkspaceMutator(fs),
          processRunner: { exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }) },
          dispatchPort: {
            dispatch: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
          },
          regenerateHelpers: () => Promise.reject(new Error('injected regeneration failure')),
        },
      }).parse(['sagas', '--project-root', projectRoot]),
    IoError,
    'Project state was rolled back',
  );
  assert(error.message.includes('remove plugin'));
  assert(!error.message.toLowerCase().includes('install'));
  for (const [path, content] of files) {
    assertEquals(await fs.readFile(path), content, `rollback mismatch at ${path}`);
  }
});

Deno.test('public plugin install then bare-name remove restores owned state and leaves doctor clean', async () => {
  const projectRoot = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const process = new DenoProcess();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const appsettings = JSON.stringify(
    {
      NetScript: {
        Name: 'fixture-app',
        Services: {},
        Plugins: {},
        BackgroundProcessors: {},
      },
    },
    null,
    2,
  ) + '\n';
  const denoJson = JSON.stringify({ workspace: [], imports: {} }, null, 2) + '\n';
  const netscriptConfig = [
    "import { defineConfig } from '@netscript/config';",
    'export default defineConfig({',
    "  name: 'fixture-app',",
    '  databases: { config: [] },',
    '  plugins: [],',
    '});',
    '',
  ].join('\n');

  try {
    await Deno.writeTextFile(join(projectRoot, 'appsettings.json'), appsettings);
    await Deno.writeTextFile(join(projectRoot, 'deno.json'), denoJson);
    await Deno.writeTextFile(join(projectRoot, 'netscript.config.ts'), netscriptConfig);

    await createPluginInstallCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      print: () => {},
      installPluginDependencies: {
        fs,
        scaffolder,
        templateAdapter,
        registry: new PluginKindRegistry(),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: process,
        regenerateHelpers: () => Promise.resolve([]),
      },
    }).parse([
      'stream',
      '--name',
      'streams',
      '--no-db',
      '--no-samples',
      '--skip-confirmation',
      '--local-path',
      join(REPOSITORY_ROOT, 'plugins', 'streams'),
      '--project-root',
      projectRoot,
    ]);

    const generatedRegistry = join(
      projectRoot,
      '.netscript',
      'generated',
      'plugin-streams',
      'streams.registry.ts',
    );
    await fs.writeFile(generatedRegistry, 'export const streams = [];\n');
    let dispatchedPackage = '';
    await createRemovePluginCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      print: () => {},
      removePluginDependencies: {
        fs,
        scaffolder,
        templateAdapter,
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: process,
        dispatchPort: {
          dispatch: (options) => {
            dispatchedPackage = options.pkg;
            return Promise.resolve({ code: 0, stdout: '', stderr: '' });
          },
        },
      },
    }).parse(['streams', '--project-root', projectRoot]);

    assertEquals(dispatchedPackage, '@netscript/plugin-streams');
    assertEquals(await fs.readFile(join(projectRoot, 'appsettings.json')), appsettings);
    assertEquals(await fs.readFile(join(projectRoot, 'deno.json')), denoJson);
    assertEquals(await fs.readFile(join(projectRoot, 'netscript.config.ts')), netscriptConfig);
    assert(!await fs.exists(join(projectRoot, 'streams')));
    assert(!await fs.exists(generatedRegistry));
    assert(!await fs.exists(join(projectRoot, 'plugins', 'mod.ts')));
    assert(!await fs.exists(join(projectRoot, 'services', '_shared', 'plugin-service-context.ts')));

    await createDoctorPluginCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      print: () => {},
      diagnosticEvidence: () => ({
        appendDrift: () => Promise.resolve(),
        read: () => Promise.resolve(undefined),
        write: () => Promise.resolve(),
      }),
      doctor: (input) =>
        doctorPlugin(input, {
          fs,
          process: {
            exec: () => Promise.resolve({ code: 0, stdout: '', stderr: '' }),
          },
          loadConfig: () =>
            Promise.resolve(defineConfig({
              name: 'fixture-app',
              databases: { config: [] },
              plugins: [],
            })),
        }),
    }).parse(['--project-root', projectRoot]);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
