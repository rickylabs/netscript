import { assert, assertEquals, assertRejects } from '@std/assert';
import { defineConfig } from '@netscript/config';
import { createDoctorFlow, createMcpServer, PluginDoctorFamily } from '@netscript/mcp';
import { createGetAppStatusFlow } from '../../../../../../mcp/src/application/flows/get-app-status-flow.ts';
import { FakeTelemetryQuery, span } from '../../../../../../mcp/tests/telemetry-fixtures.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { CliProjectDoctor } from '../../agent/mcp/cli-mcp-adapters.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import { doctorPlugin } from './doctor-plugin-use-case.ts';
import { inspectPluginRuntime, readPluginHealthDeclarations } from './plugin-runtime-health.ts';
import settings from './fixtures/generated-scaffold-appsettings.json' with { type: 'json' };

// Captured from scaffold.plugins after workers, sagas, triggers, streams, auth, and AI installs,
// including AI MCP/tool generation. AI does not declare a plugin HTTP resource.
async function scaffoldFileSystem() {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile('/project/appsettings.json', JSON.stringify(settings));
  return fs;
}

Deno.test('generated scaffold entries without installation metadata are not declarations', async () => {
  assertEquals(Object.keys(settings.NetScript.Plugins).sort(), [
    'auth',
    'sagas-api',
    'streams',
    'triggers-api',
    'workers-api',
  ]);
  assertEquals(Object.keys(settings.NetScript.BackgroundProcessors).sort(), [
    'sagas',
    'triggers',
    'workers',
  ]);
  assertEquals(await readPluginHealthDeclarations('/project', await scaffoldFileSystem()), []);
});

Deno.test('generated scaffold entries do not fail doctor reports or CLI exit', async () => {
  const fs = await scaffoldFileSystem();
  const operation = () =>
    doctorPlugin({ projectRoot: '/project' }, {
      fs,
      loadConfig: () => Promise.resolve(defineConfig({ name: 'test', databases: { config: [] } })),
      loadJsrExportMap: () => Promise.resolve(new Set(['./services'])),
      process: { exec: () => Promise.reject(new Error('Unexpected static process')) },
      inspectAppHost: { inspect: () => Promise.resolve({ status: 'running', resources: [] }) },
    });
  assert((await operation()).every((report) => report.status === 'healthy'));
  await createDoctorPluginCommand({
    doctor: operation,
    resolveProjectRoot: () => Promise.resolve('/project'),
    print: () => {},
    diagnosticEvidence: () => ({
      read: () => Promise.resolve(undefined),
      write: () => Promise.resolve(),
      appendDrift: () => Promise.resolve(),
    }),
  }).parse([]);
});

Deno.test('generated scaffold entries preserve passing MCP doctor and health telemetry', async () => {
  const fs = await scaffoldFileSystem();
  const adapter = new CliProjectDoctor(() =>
    inspectPluginRuntime('/project', fs, {
      inspect: () => Promise.reject(new Error('No owned declarations to inspect')),
    })
  );
  const probe = { probe: () => Promise.resolve({ reachable: true, message: 'online' }) };
  const query = new FakeTelemetryQuery([span({ statusCode: 0 })], [], [{
    serviceName: 'workers-api',
    attributes: {},
  }]);
  const server = createMcpServer({
    probe,
    flows: {
      get_app_status: createGetAppStatusFlow(query, adapter, '/project'),
      doctor: createDoctorFlow(probe, {}, [new PluginDoctorFamily(adapter)], '/project'),
    },
  });
  for (const name of ['doctor', 'get_app_status']) {
    const response = await server.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: {} },
    });
    assert(response && 'result' in response);
    const value = Reflect.get(response.result as object, 'structuredContent');
    assertEquals(value.status, 'pass');
    assertEquals(value.runtimeChecks, undefined);
  }
});

Deno.test('generated scaffold discovery skips atypical entries and retains owned health resources', async () => {
  const fs = await scaffoldFileSystem();
  const owned = { InstalledFrom: 'jobs', InstalledVersion: '0.0.7' };
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Plugins: {
          ...settings.NetScript.Plugins,
          api: { ...owned, Port: 8000 },
          invalid: { ...owned, Port: 'invalid' },
          disabled: { ...owned, Port: 8001, Enabled: false },
          unrelated: null,
        },
        BackgroundProcessors: {
          ...settings.NetScript.BackgroundProcessors,
          runner: { ...owned, Runtime: 'deno', RequiresKv: true },
          disabled: { ...owned, RequiresKv: true, Enabled: false },
          unsupported: { ...owned, Runtime: 'node', RequiresKv: true },
          noKv: { ...owned, RequiresKv: false },
          invalid: { ...owned, Runtime: 10, RequiresKv: true },
          unrelated: 'not a processor',
        },
      },
    }),
  );
  assertEquals(await readPluginHealthDeclarations('/project', fs), [{
    pluginName: 'jobs',
    apiResources: ['api'],
    childResources: ['runner'],
  }]);
});

Deno.test('runtime declaration discovery still rejects structurally invalid sections', async () => {
  const fs = new MemoryFileSystemAdapter();
  for (
    const document of [
      {},
      { NetScript: [] },
      { NetScript: null },
      { NetScript: { Plugins: [] } },
      { NetScript: { BackgroundProcessors: 'invalid' } },
    ]
  ) {
    await fs.writeFile('/project/appsettings.json', JSON.stringify(document));
    await assertRejects(() => readPluginHealthDeclarations('/project', fs), Error);
  }
});
