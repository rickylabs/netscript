import { assertEquals, assertRejects } from '@std/assert';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { PluginDispatchOptions } from '../dispatch/plugin-dispatch-port.ts';
import { createRemovePluginCommand } from './remove-plugin-command.ts';

Deno.test('plugin remove resolves a configured bare name before dispatch and preserves state on failure', async () => {
  const projectRoot = '/workspace/app';
  const fs = new MemoryFileSystemAdapter();
  const appsettings = JSON.stringify({
    NetScript: {
      Plugins: { 'sagas-api': { Enabled: true } },
      BackgroundProcessors: { sagas: { Enabled: true } },
    },
  }, null, 2) + '\n';
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

  await assertRejects(
    () => command.parse(['sagas', '--project-root', projectRoot]),
    RemoteError,
    'Plugin removal failed',
  );

  assertEquals(await fs.readFile(`${projectRoot}/appsettings.json`), appsettings);
  assertEquals(await fs.readFile(`${projectRoot}/netscript.config.ts`), netscriptConfig);
  assertEquals(dispatched?.pkg, '@netscript/plugin-sagas');
});
