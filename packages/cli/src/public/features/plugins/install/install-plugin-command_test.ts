import { assert, assertEquals } from '@std/assert';
import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { Scaffolder } from '../../../../kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../kernel/adapters/scaffold/template-adapter.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { createPluginInstallCommand } from './install-plugin-command.ts';

const REPOSITORY_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');

Deno.test('plugin install completion omits template port when host port is not pinned', async () => {
  const messages = await runStreamsInstall();
  const installed = messages.find((message) => message.startsWith('Installed '));
  assert(installed);
  assertEquals(
    installed,
    'Installed stream plugin "streams". View its endpoint in the Aspire dashboard.',
  );
  assertEquals(/\d/.test(installed), false);
});

Deno.test('plugin install completion prints an explicitly pinned host port', async () => {
  const messages = await runStreamsInstall(61234);
  const installed = messages.find((message) => message.startsWith('Installed '));
  assertEquals(installed, 'Installed stream plugin "streams" on port 61234.');
});

async function runStreamsInstall(hostPort?: number): Promise<string[]> {
  const projectRoot = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const templateAdapter = new StringTemplateAdapter(fs);
  const scaffolder = new Scaffolder(templateAdapter, fs);
  const messages: string[] = [];
  try {
    await Deno.writeTextFile(
      join(projectRoot, 'appsettings.json'),
      JSON.stringify(
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
      ) + '\n',
    );
    await Deno.writeTextFile(join(projectRoot, 'deno.json'), '{"workspace":[],"imports":{}}\n');
    await Deno.writeTextFile(
      join(projectRoot, 'netscript.config.ts'),
      "export default { name: 'fixture-app', databases: { config: [] }, plugins: [] };\n",
    );

    const args = [
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
    ];
    if (hostPort !== undefined) args.push('--port', String(hostPort));

    await createPluginInstallCommand({
      resolveProjectRoot: () => Promise.resolve(projectRoot),
      print: (message) => messages.push(message),
      installPluginDependencies: {
        fs,
        scaffolder,
        templateAdapter,
        registry: new PluginKindRegistry(),
        registryScaffolder: new PluginRegistryScaffolder(scaffolder),
        workspaceMutator: new PluginWorkspaceMutator(fs),
        processRunner: new DenoProcess(),
        regenerateHelpers: () => Promise.resolve([]),
      },
    }).parse(args);

    return messages;
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}
