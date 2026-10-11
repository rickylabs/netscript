import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
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

const generatedDeclarations = [
  { pluginName: 'auth', apiResources: ['auth'], childResources: [] },
  { pluginName: 'sagas', apiResources: ['sagas-api'], childResources: ['sagas'] },
  { pluginName: 'streams', apiResources: ['streams'], childResources: [] },
  { pluginName: 'triggers', apiResources: ['triggers-api'], childResources: ['triggers'] },
  { pluginName: 'workers', apiResources: ['workers-api'], childResources: ['workers'] },
];

function healthyResources() {
  return [
    ...Object.keys(settings.NetScript.Plugins).map((name) => ({
      name,
      state: 'Running',
      healthStatus: 'Healthy',
      healthReports: { http: {} },
    })),
    ...Object.keys(settings.NetScript.BackgroundProcessors).map((name) => ({
      name,
      state: 'Running',
      healthStatus: 'Healthy',
      healthReports: { http: {} },
      childHealth: {
        state: 'ready' as const,
        registryReady: true,
        dependencyReady: true,
        restartCount: 0,
        lastFatalError: null,
      },
    })),
  ];
}

Deno.test('generated scaffold references declare each API and its owning child without installation metadata', async () => {
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
  assertEquals(
    await readPluginHealthDeclarations('/project', await scaffoldFileSystem()),
    generatedDeclarations,
  );
});

Deno.test('generated scaffold entries do not fail doctor reports or CLI exit', async () => {
  const fs = await scaffoldFileSystem();
  const operation = () =>
    doctorPlugin({ projectRoot: '/project' }, {
      fs,
      loadConfig: () => Promise.resolve(defineConfig({ name: 'test', databases: { config: [] } })),
      loadJsrExportMap: () => Promise.resolve(new Set(['./services'])),
      process: { exec: () => Promise.reject(new Error('Unexpected static process')) },
      inspectAppHost: {
        inspect: () => Promise.resolve({ status: 'running', resources: healthyResources() }),
      },
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
      inspect: (_root, children) => {
        assertEquals(children?.slice().sort(), ['sagas', 'triggers', 'workers']);
        return Promise.resolve({ status: 'running', resources: healthyResources() });
      },
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
    if (name === 'get_app_status') {
      assertEquals(value.healthStatus, 'healthy');
      assertEquals(
        value.pluginHealth.map((report: { pluginName: string }) => report.pluginName),
        generatedDeclarations.map((entry) => entry.pluginName),
      );
    }
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
  assertEquals(await readPluginHealthDeclarations('/project', fs), [generatedDeclarations[0], {
    pluginName: 'jobs',
    apiResources: ['api'],
    childResources: ['runner'],
  }, ...generatedDeclarations.slice(1)]);
});

Deno.test('generated scaffold reference ownership survives renamed resources and optional overrides', async () => {
  const fs = await scaffoldFileSystem();
  for (const override of [undefined, 'custom-owner']) {
    await fs.writeFile(
      '/project/appsettings.json',
      JSON.stringify({
        NetScript: {
          Plugins: {
            dependency: { Runtime: 'deno' },
            'renamed-http': { Runtime: 'deno', PluginReferences: ['dependency'] },
          },
          BackgroundProcessors: {
            'renamed-child': {
              Runtime: 'deno',
              RequiresKv: true,
              PluginReferences: ['dependency', 'renamed-http'],
              ...(override ? { InstalledFrom: override } : {}),
            },
          },
        },
      }),
    );
    assertEquals(await readPluginHealthDeclarations('/project', fs), [
      ...(override
        ? [{
          pluginName: override,
          apiResources: ['renamed-http'],
          childResources: ['renamed-child'],
        }, { pluginName: 'dependency', apiResources: ['dependency'], childResources: [] }]
        : [
          { pluginName: 'dependency', apiResources: ['dependency'], childResources: [] },
          {
            pluginName: 'renamed-child',
            apiResources: ['renamed-http'],
            childResources: ['renamed-child'],
          },
        ]),
    ]);
  }
});

for (const invalid of [{ Concurrency: 'invalid' }, { PluginReferences: 'invalid' }]) {
  Deno.test(`declaration warning: malformed health-capable child ${Object.keys(invalid)[0]} stays visible across surfaces`, async () => {
    const fs = await scaffoldFileSystem();
    await fs.writeFile(
      '/project/appsettings.json',
      JSON.stringify({
        NetScript: {
          ...settings.NetScript,
          BackgroundProcessors: {
            ...settings.NetScript.BackgroundProcessors,
            workers: { ...settings.NetScript.BackgroundProcessors.workers, ...invalid },
          },
        },
      }),
    );
    const inspector = {
      inspect: () => Promise.resolve({ status: 'running' as const, resources: healthyResources() }),
    };
    const operation = () =>
      doctorPlugin({ projectRoot: '/project' }, {
        fs,
        loadConfig: () =>
          Promise.resolve(defineConfig({ name: 'test', databases: { config: [] } })),
        loadJsrExportMap: () => Promise.resolve(new Set(['./services'])),
        process: { exec: () => Promise.reject(new Error('Unexpected static process')) },
        inspectAppHost: inspector,
      });
    const reports = await operation();
    const warning = reports.flatMap((report) => report.checks).find((check) =>
      check.status === 'warning'
    );
    assert(warning);
    assertStringIncludes(warning.message ?? '', 'BackgroundProcessors.workers');
    const output: string[] = [];
    await createDoctorPluginCommand({
      doctor: operation,
      resolveProjectRoot: () => Promise.resolve('/project'),
      print: (line) => output.push(line),
      diagnosticEvidence: () => ({
        read: () => Promise.resolve(undefined),
        write: () => Promise.resolve(),
        appendDrift: () => Promise.resolve(),
      }),
    }).parse([]);
    assertStringIncludes(output.join('\n'), 'BackgroundProcessors.workers');
    const adapter = new CliProjectDoctor(
      operation,
      () => inspectPluginRuntime('/project', fs, inspector),
    );
    const server = createMcpServer({
      probe: { probe: () => Promise.resolve({ reachable: true, message: 'online' }) },
      flows: {
        doctor: createDoctorFlow(
          { probe: () => Promise.resolve({ reachable: true, message: 'online' }) },
          {},
          [new PluginDoctorFamily(adapter)],
          '/project',
        ),
        get_app_status: createGetAppStatusFlow(
          new FakeTelemetryQuery([span({ statusCode: 0 })], [], []),
          adapter,
          '/project',
        ),
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
      assertEquals(value.status, 'warn');
      assertStringIncludes(JSON.stringify(value), 'BackgroundProcessors.workers');
      if (name === 'get_app_status') assertEquals(value.runtimeChecks[0].status, 'warn');
    }
  });
}

Deno.test('declaration warning: malformed-only child metadata cannot become a no-plugin pass', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        BackgroundProcessors: {
          runner: { Runtime: 'deno', RequiresKv: true, Concurrency: 'invalid' },
        },
      },
    }),
  );
  const adapter = new CliProjectDoctor(() =>
    inspectPluginRuntime('/project', fs, {
      inspect: () => Promise.reject(new Error('Invalid children must not be probed')),
    })
  );
  const result = await createGetAppStatusFlow(
    new FakeTelemetryQuery([], [], []),
    adapter,
    '/project',
  )({});
  assert(result.ok);
  assertEquals(Reflect.get(result.value as object, 'status'), 'warn');
  assertStringIncludes(JSON.stringify(result.value), 'BackgroundProcessors.runner');
});

Deno.test('generated scaffold ownership ambiguity warns and still observes the child', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Plugins: { a: { PluginReferences: ['b'] }, b: { PluginReferences: ['a'] } },
        BackgroundProcessors: {
          child: { Runtime: 'deno', RequiresKv: true, PluginReferences: ['a', 'b'] },
        },
      },
    }),
  );
  const reports = await inspectPluginRuntime('/project', fs, {
    inspect: (_root, children) => {
      assertEquals(children, ['child']);
      return Promise.resolve({
        status: 'running',
        resources: [{ name: 'child', state: 'Stopped' }],
      });
    },
  });
  assert(reports.some((report) => report.status === 'warning'));
  assert(
    reports.some((report) =>
      report.checks.some((check) =>
        check.runtimeHealth?.pluginName === 'child' && check.runtimeHealth.status === 'unhealthy'
      )
    ),
  );
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
