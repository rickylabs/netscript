import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path/from-file-url';
import { join } from '@std/path';
import { LocalProjectFiles } from '@netscript/plugin/cli';

import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import { doctorPlugin } from './doctor-plugin-use-case.ts';
import { compileWorkersRegistry } from '../../../../../../../plugins/workers/src/cli/registry-compiler.ts';
import { generateRuntimeRegistries } from '../../../../../../../plugins/workers/src/cli/runtime-registry-generator.ts';
import { PLUGIN_PACKAGE_VERSION as WORKERS_PACKAGE_VERSION } from '../../../../../../../plugins/workers/src/package-metadata.generated.ts';
import { generateSagaRegistry } from '../../../../../../../plugins/sagas/src/cli/registry-generator.ts';
import { AspireAppHostDoctorInspector } from '../../../../kernel/adapters/aspire/apphost-doctor-inspector.ts';
import type { ProcessPort, ProcessResult } from '../../../../kernel/ports/process-port.ts';

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
  assertStringIncludes(
    output.join('\n'),
    `deno run -A jsr:@netscript/plugin-workers@${WORKERS_PACKAGE_VERSION}/cli compile-registry`,
  );
  assertStringIncludes(output.at(-1) ?? '', 'Plugin doctor failed: @netscript/plugin-workers');
});

Deno.test('plugin doctor accepts real compile-registry workers output and exits zero', async () => {
  const generatedRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(generatedRoot, 'workers/jobs'), { recursive: true });
    await Deno.writeTextFile(join(generatedRoot, 'workers/jobs/welcome.ts'), 'export default () => {};\n');
    await compileWorkersRegistry(new LocalProjectFiles(generatedRoot));
    await assertWorkersCommandPasses(await Deno.readTextFile(
      join(generatedRoot, '.netscript/generated/plugin-workers/job-registry.ts'),
    ));
  } finally {
    await Deno.remove(generatedRoot, { recursive: true });
  }
});

Deno.test('plugin doctor accepts real generate plugins workers output and exits zero', async () => {
  const generatedRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(generatedRoot, 'workers/jobs'), { recursive: true });
    await Deno.writeTextFile(
      join(generatedRoot, 'workers/jobs/example-job.ts'),
      'export default { id: "example-job" };\n',
    );
    await generateRuntimeRegistries({
      projectRoot: generatedRoot,
      manifestPath: fromFileUrl(
        new URL('../../../../../../../plugins/workers/scaffold.runtime.json', import.meta.url),
      ),
    });
    await assertWorkersCommandPasses(await Deno.readTextFile(
      join(generatedRoot, '.netscript/generated/plugin-workers/job-registry.ts'),
    ));
  } finally {
    await Deno.remove(generatedRoot, { recursive: true });
  }
});

Deno.test('plugin doctor accepts the real shared sagas generator output and exits zero', async () => {
  const generatedRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(generatedRoot, 'sagas'), { recursive: true });
    await Deno.writeTextFile(
      join(generatedRoot, 'sagas/checkout-saga.ts'),
      "export default defineSaga('checkout');\n",
    );
    await generateSagaRegistry(new LocalProjectFiles(generatedRoot));
    await assertSagaCommandPasses(await Deno.readTextFile(
      join(generatedRoot, '.netscript/generated/plugin-sagas/sagas.registry.ts'),
    ));
  } finally {
    await Deno.remove(generatedRoot, { recursive: true });
  }
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

Deno.test('plugin doctor distinguishes an absent AppHost from unhealthy resources', async () => {
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs: new MemoryFileSystemAdapter(),
    loadConfig: () => Promise.resolve(configWithResources()),
    inspectAppHost: { inspect: () => Promise.resolve({ status: 'not-running' }) },
  });
  assertEquals(reports[0].status, 'warning');
  assertEquals(reports[0].checks[0].id, 'apphost:not-running');
  assertStringIncludes(reports[0].checks[0].message ?? '', 'No AppHost is running');
});

Deno.test('plugin doctor warns and exits zero when Aspire inspection is unavailable', async () => {
  const output: string[] = [];
  const command = createDoctorPluginCommand({
    resolveProjectRoot: () => Promise.resolve('/workspace'),
    print: (line) => output.push(line),
    doctor: (input) =>
      doctorPlugin(input, {
        fs: new MemoryFileSystemAdapter(),
        loadConfig: () => Promise.resolve(configWithResources()),
        inspectAppHost: new AspireAppHostDoctorInspector(new MissingAspireProcess()),
      }),
  });

  await command.parse(['--project-root', '/workspace']);
  assertStringIncludes(output.join('\n'), 'warning');
  assertStringIncludes(output.join('\n'), 'AppHost inspection was skipped');
  assertStringIncludes(output.join('\n'), 'aspire command not found');
});

Deno.test('plugin doctor reports configured resources missing from the running AppHost by name', async () => {
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs: new MemoryFileSystemAdapter(),
    loadConfig: () => Promise.resolve(configWithResources()),
    inspectAppHost: {
      inspect: () => Promise.resolve({
        status: 'running',
        resources: [{ name: 'api', state: 'Running', healthStatus: 'Healthy' }],
      }),
    },
  });
  const appHost = reports[0];
  assertEquals(appHost.status, 'error');
  assertEquals(appHost.checks.find((check) => check.id === 'apphost:missing:web')?.status, 'error');
  assertStringIncludes(
    appHost.checks.find((check) => check.id === 'apphost:missing:main-db')?.message ?? '',
    'main-db',
  );
});

Deno.test('plugin doctor reports a running but unhealthy AppHost resource', async () => {
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs: new MemoryFileSystemAdapter(),
    loadConfig: () => Promise.resolve(configWithResources()),
    inspectAppHost: {
      inspect: () => Promise.resolve({
        status: 'running',
        resources: [
          { name: 'api', state: 'Running', healthStatus: 'Unhealthy' },
          { name: 'web', state: 'Running', healthStatus: 'Healthy' },
          { name: 'main-db', state: 'Running', healthStatus: 'Healthy' },
        ],
      }),
    },
  });
  const check = reports[0].checks.find((candidate) => candidate.id === 'apphost:resource:api');
  assertEquals(check?.status, 'error');
  assertStringIncludes(check?.message ?? '', 'Unhealthy');
});

Deno.test('plugin manifest import failures degrade to an error report', async () => {
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs: new MemoryFileSystemAdapter(),
    loadConfig: () => Promise.resolve({ plugins: ['./plugins/broken/mod.ts'] } as never),
    loadRegisteredPlugins: () => Promise.reject(new Error('plugin import exploded')),
  });
  assertEquals(reports[0].status, 'error');
  assertStringIncludes(reports[0].checks[0].message ?? '', 'plugin import exploded');
});

Deno.test('one unloadable plugin doctor does not suppress a healthy plugin report', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir('/workspace/plugins/broken');
  await fs.createDir('/workspace/plugins/healthy');
  const reports = await doctorPlugin({ projectRoot: '/workspace' }, {
    fs,
    loadConfig: () => Promise.resolve({ plugins: ['broken', 'healthy'] } as never),
    loadRegisteredPlugins: () => Promise.resolve({
      broken: {
        name: 'broken',
        workdir: 'plugins/broken',
        rootDir: '/workspace/plugins/broken',
        permissions: ['--allow-read'],
        doctor: './missing-doctor.ts',
      },
      healthy: {
        name: 'healthy',
        workdir: 'plugins/healthy',
        rootDir: '/workspace/plugins/healthy',
        permissions: ['--allow-read'],
      },
    }),
  });

  assertEquals(reports.length, 2);
  assertEquals(reports.find((report) => report.pluginName === 'broken')?.status, 'error');
  assertEquals(reports.find((report) => report.pluginName === 'healthy')?.status, 'healthy');
});

async function assertWorkersCommandPasses(registrySource: string): Promise<void> {
  const projectRoot = '/workspace';
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir(`${projectRoot}/plugins/workers`);
  await fs.writeFile(
    `${projectRoot}/.netscript/generated/plugin-workers/job-registry.ts`,
    registrySource,
  );
  const workersRoot = fromFileUrl(
    new URL('../../../../../../../plugins/workers/', import.meta.url),
  );
  const command = createDoctorPluginCommand({
    resolveProjectRoot: () => Promise.resolve(projectRoot),
    print: () => {},
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
  await command.parse(['--project-root', projectRoot]);
}

function configWithResources() {
  return {
    plugins: [],
    services: { api: { port: 8000 } },
    apps: { web: { port: 3000 } },
    databases: { 'main-db': { engine: 'postgres' } },
  } as never;
}

class MissingAspireProcess implements ProcessPort {
  exec(): Promise<ProcessResult> {
    return Promise.reject(new Deno.errors.NotFound('aspire command not found'));
  }
}

async function assertSagaCommandPasses(registrySource: string): Promise<void> {
  const projectRoot = '/workspace';
  const fs = new MemoryFileSystemAdapter();
  await fs.createDir(`${projectRoot}/plugins/sagas`);
  await fs.writeFile(
    `${projectRoot}/.netscript/generated/plugin-sagas/sagas.registry.ts`,
    registrySource,
  );
  const sagasRoot = fromFileUrl(
    new URL('../../../../../../../plugins/sagas/', import.meta.url),
  );
  const command = createDoctorPluginCommand({
    resolveProjectRoot: () => Promise.resolve(projectRoot),
    print: () => {},
    doctor: (input) =>
      doctorPlugin(input, {
        fs,
        loadConfig: () => Promise.resolve({ plugins: ['./plugins/sagas/mod.ts'] } as never),
        loadRegisteredPlugins: () => Promise.resolve({
          sagas: {
            name: '@netscript/plugin-sagas',
            workdir: 'plugins/sagas',
            rootDir: sagasRoot,
            doctor: './src/adapter/plugin.ts',
          },
        }),
      }),
  });
  await command.parse(['--project-root', projectRoot]);
}
