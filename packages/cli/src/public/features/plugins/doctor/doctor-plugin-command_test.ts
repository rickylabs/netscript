import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path/from-file-url';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import { doctorPlugin } from './doctor-plugin-use-case.ts';

Deno.test('plugin doctor exits non-zero when generated registries are absent', async () => {
  const projectRoot = '/workspace';
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir(`${projectRoot}/plugins/workers`);
  const workersRoot = fromFileUrl(
    new URL('../../../../../../../plugins/workers/', import.meta.url),
  );
  const output: string[] = [];
  const command = createDoctorPluginCommand({
    resolveProjectRoot: () => Promise.resolve(projectRoot),
    print: (line) => output.push(line),
    doctor: (input) =>
      doctorPlugin(input, {
        fs,
        loadConfig: () => Promise.resolve({ plugins: ['./plugins/workers/mod.ts'] } as never),
        loadRegisteredPlugins: () => Promise.resolve({
          workers: {
            name: '@netscript/plugin-workers',
            workdir: 'plugins/workers',
            rootDir: workersRoot,
            doctor: './src/adapter/plugin.ts',
          },
        }),
      }),
  });

  const error = await assertRejects(
    () => command.parse(['--project-root', projectRoot]),
    RemoteError,
  );
  assertEquals(error.exitCode, 1);
  assertStringIncludes(output.join('\n'), 'generated job registry exists');
  assertStringIncludes(output.join('\n'), 'netscript plugin workers compile-registry');
  assertStringIncludes(output.at(-1) ?? '', 'Plugin doctor failed: @netscript/plugin-workers');
});

Deno.test('plugin doctor reports visible validation issues by field', async () => {
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs: new MemoryFileSystemAdapter(),
    loadConfig: () => Promise.reject({
      issues: [{ path: ['services', 'api', 'port'], message: 'Expected number' }],
    }),
  });
  assertEquals(reports[0].checks[0].title, 'Config field services.api.port');
  assertStringIncludes(reports[0].checks[0].message ?? '', 'Expected number');
});
