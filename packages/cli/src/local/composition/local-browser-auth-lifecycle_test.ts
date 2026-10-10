import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { DenoFileSystem } from '../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { readAuthServiceName } from '../../kernel/adapters/service/auth-policy.ts';
import { DenoProcess } from '../../kernel/adapters/runtime/process/deno-process.ts';
import { DenoGeneratedSourceFormatter } from '../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { Scaffolder } from '../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../kernel/application/registries/plugin-kind-registry.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../kernel/application/registries/template-registry.ts';
import { PluginScaffolder } from '../../kernel/adapters/plugin/scaffolder.ts';
import { PluginRegistryScaffolder } from '../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginWorkspaceMutator } from '../../kernel/adapters/plugin/workspace-mutator.ts';
import { installLocalPlugin } from '../features/plugins/install/install-local-plugin.ts';
import { useLocalWorkspaceImports } from '../../../tests/support/local-workspace-imports.ts';

const REPO = fromFileUrl(new URL('../../../../../', import.meta.url));
const CLI = join(REPO, 'packages/cli/bin/netscript-dev.ts');
const BFF_FILES = ['auth/bff.ts', 'auth/service.ts', 'apps/web/routes/auth/[action].ts'];

async function run(args: string[]): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '-A', CLI, ...args],
    cwd: REPO,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
}

async function withProject(probe: (root: string) => Promise<void>): Promise<void> {
  // Maintainer init requires its local-source project beneath the checkout.
  const scratch = join(REPO, '.llm/tmp', `local-browser-auth-${crypto.randomUUID()}`);
  await Deno.mkdir(scratch, { recursive: true });
  try {
    await run([
      'init',
      'local-auth',
      '--path',
      scratch,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
      '--editor',
      'none',
    ]);
    await probe(join(scratch, 'local-auth'));
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
}

async function addService(root: string, name: string): Promise<void> {
  await run(['service', 'add', '--name', name, '--project-root', root]);
}

async function installAuth(root: string): Promise<void> {
  await run(['plugin', 'install', 'auth', '--name', 'auth', '--project-root', root, '--force']);
  assertEquals(await readAuthServiceName(root, new DenoFileSystem()), 'auth');
}

async function assertBrowserAuth(root: string): Promise<void> {
  for (const path of BFF_FILES) {
    assertStringIncludes(await Deno.readTextFile(join(root, path)), 'import {');
  }
  const main = await Deno.readTextFile(join(root, 'services/users/src/main.ts'));
  assertStringIncludes(main, 'authenticator: browserAuthenticator');
  assertStringIncludes(main, 'authorizer: createContractAuthorizer(router)');
  assertFalse(main.includes('public: true'));
  assertFalse(main.includes('requireScopes'));
  const settings = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json')));
  assertEquals(settings.NetScript.Services.users.PluginReferences, ['auth']);
  assertEquals(settings.NetScript.Apps.web.PluginReferences, ['auth']);
}

async function resetScaffold(root: string, main: string): Promise<void> {
  await Deno.writeTextFile(join(root, 'services/users/src/main.ts'), main);
  for (const path of BFF_FILES) await Deno.remove(join(root, path));
}

Deno.test('local auth install after service add creates BFF and guards the service', async () => {
  await withProject(async (root) => {
    await addService(root, 'users');
    await installAuth(root);
    await assertBrowserAuth(root);
    // Resolve first-party exports from this checkout for the local-source generation probe.
    await useLocalWorkspaceImports(root, REPO);
    const paths = [
      'appsettings.json',
      'netscript.config.ts',
      'services/users/src/main.ts',
      ...BFF_FILES,
    ];
    const before = await Promise.all(paths.map((path) => Deno.readTextFile(join(root, path))));
    await run(['generate', 'aspire', '--project-root', root]);
    assertEquals(
      await Promise.all(paths.map((path) => Deno.readTextFile(join(root, path)))),
      before,
    );
  });
});

Deno.test('local service add after auth install uses the same BFF policy', async () => {
  await withProject(async (root) => {
    await installAuth(root);
    await addService(root, 'users');
    await assertBrowserAuth(root);
  });
});

Deno.test('local installer returns rewritten browser files and formats them before completion', async () => {
  await DEFAULT_TEMPLATE_REGISTRY.hydrate();
  await withProject(async (root) => {
    await addService(root, 'users');
    const fs = new DenoFileSystem();
    const templateAdapter = new StringTemplateAdapter(fs);
    const scaffolder = new Scaffolder(templateAdapter, fs);
    const registry = new PluginKindRegistry();
    const process = new DenoProcess();
    const formatted: string[] = [];
    const result = await installLocalPlugin({
      kind: 'auth',
      pluginName: 'auth',
      serviceReferences: [],
      pluginReferences: [],
      noDb: true,
      includeSamples: false,
      localPath: join(REPO, 'plugins/auth'),
      projectRoot: root,
      overwrite: true,
    }, {
      fs,
      scaffolder,
      templateAdapter,
      formatter: new DenoGeneratedSourceFormatter(process),
      registry,
      pluginScaffolder: new PluginScaffolder(scaffolder, fs, registry),
      registryScaffolder: new PluginRegistryScaffolder(scaffolder),
      workspaceMutator: new PluginWorkspaceMutator(fs),
      processRunner: {
        exec: (command, args, options) => {
          if (args[0] === 'fmt') formatted.push(...args);
          return process.exec(command, args, options);
        },
      },
    });
    await assertBrowserAuth(root);
    for (const path of [...BFF_FILES, 'services/users/src/main.ts']) {
      assertEquals(result.helperFiles.includes(join(root, path)), true);
      assertEquals(formatted.includes(join(root, path)), true);
    }
  });
});

Deno.test('local service remove reconciles remaining scaffold policies and plugin references', async () => {
  await withProject(async (root) => {
    await addService(root, 'users');
    const publicMain = await Deno.readTextFile(join(root, 'services/users/src/main.ts'));
    await addService(root, 'temporary');
    await installAuth(root);
    await resetScaffold(root, publicMain);
    const settingsPath = join(root, 'appsettings.json');
    const settings = JSON.parse(await Deno.readTextFile(settingsPath));
    settings.NetScript.Services.users.PluginReferences = ['auth', 'uninstalled'];
    await Deno.writeTextFile(settingsPath, JSON.stringify(settings));
    await run(['service', 'remove', 'temporary', '--project-root', root]);
    await assertBrowserAuth(root);
    assertFalse(await new DenoFileSystem().exists(join(root, 'services/temporary')));
  });
});

Deno.test('local plugin remove reconciles surviving auth without recreating removed auth', async () => {
  await withProject(async (root) => {
    await addService(root, 'users');
    const publicMain = await Deno.readTextFile(join(root, 'services/users/src/main.ts'));
    await installAuth(root);
    await run([
      'plugin',
      'install',
      'workers',
      '--name',
      'workers',
      '--no-db',
      '--project-root',
      root,
      '--force',
    ]);
    await resetScaffold(root, publicMain);
    await run(['plugin', 'remove', 'workers', '--skip-dispatch', '--project-root', root]);
    await assertBrowserAuth(root);
    await run(['plugin', 'remove', 'auth', '--skip-dispatch', '--project-root', root]);
    assertEquals(await readAuthServiceName(root, new DenoFileSystem()), undefined);
    for (const path of ['auth/bff.ts', 'auth/service.ts']) {
      assertFalse(await new DenoFileSystem().exists(join(root, path)));
    }
    const settings = JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json')));
    assertEquals(settings.NetScript.Services.users.PluginReferences, undefined);
    assertEquals(settings.NetScript.Apps.web.PluginReferences, undefined);
  });
});
