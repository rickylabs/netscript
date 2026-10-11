import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { defineConfig } from '@netscript/config';
import { createDoctorFlow, createMcpServer, PluginDoctorFamily } from '@netscript/mcp';
import { createGetAppStatusFlow } from '../../../../../../mcp/src/application/flows/get-app-status-flow.ts';
import { FakeTelemetryQuery, span } from '../../../../../../mcp/tests/telemetry-fixtures.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { CliProjectDoctor } from '../../agent/mcp/cli-mcp-adapters.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { doctorPlugin } from './doctor-plugin-use-case.ts';
import { createDoctorPluginCommand } from './doctor-plugin-command.ts';
import { inspectPluginRuntime } from './plugin-runtime-health.ts';

const probe = { probe: () => Promise.resolve({ reachable: true, message: 'online' }) };
const query = new FakeTelemetryQuery([span({ statusCode: 0 })], [], [{
  serviceName: 'renamed-api',
  attributes: {},
}]);
const states = [
  'ready',
  'starting',
  'degraded',
  'failed',
  'stopped',
  'crash-looping',
  'missing',
  'registry-unready',
  'dependency-unready',
  'payload-unavailable',
  'probe-missing',
] as const;

for (const plugin of ['workers', 'sagas', 'triggers']) {
  for (const apiMode of ['healthy', 'unhealthy', 'unprobed', 'absent'] as const) {
    for (const childState of states) {
      Deno.test(`health surfaces: ${plugin} API ${apiMode} child ${childState}`, async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.writeFile(
          '/project/appsettings.json',
          JSON.stringify({
            NetScript: {
              Plugins: apiMode === 'absent' ? {} : {
                'renamed-api': {
                  Port: 8000,
                  HealthCheckPath: apiMode === 'unprobed' ? false : '/health',
                  InstalledVersion: '0.0.7',
                  InstalledFrom: `@netscript/plugin-${plugin}`,
                },
              },
              BackgroundProcessors: {
                'renamed-runner': {
                  Runtime: 'deno',
                  RequiresKv: true,
                  InstalledVersion: '0.0.7',
                  InstalledFrom: `@netscript/plugin-${plugin}`,
                },
              },
            },
          }),
        );
        const state = childState === 'registry-unready' || childState === 'dependency-unready' ||
            childState === 'payload-unavailable' || childState === 'probe-missing'
          ? 'ready'
          : childState;
        const resources = [
          ...(apiMode === 'absent' ? [] : [{
            name: 'renamed-api',
            state: 'Running',
            healthStatus: apiMode === 'unhealthy' ? 'Unhealthy' : 'Healthy',
            healthReports: apiMode === 'unprobed' ? {} : { http: {} },
          }]),
          ...(childState === 'missing' ? [] : [{
            name: 'renamed-runner',
            state: 'Running',
            healthStatus: state === 'ready' ? 'Healthy' : 'Unhealthy',
            healthReports: childState === 'probe-missing' ? {} : { http: {} },
            childHealthUnavailable: childState === 'payload-unavailable',
            childHealth: {
              state: state === 'missing' ? 'stopped' : state,
              registryReady: childState !== 'registry-unready',
              dependencyReady: childState !== 'dependency-unready',
              restartCount: childState === 'crash-looping' ? 3 : 0,
              lastFatalError: null,
            },
          }]),
        ];
        const operation = () =>
          doctorPlugin({ projectRoot: '/project' }, {
            fs,
            loadConfig: () =>
              Promise.resolve(defineConfig({ name: 'health-test', databases: { config: [] } })),
            process: { exec: () => Promise.reject(new Error('Unexpected process')) },
            inspectAppHost: { inspect: () => Promise.resolve({ status: 'running', resources }) },
          });
        const expected = apiMode === 'unhealthy'
          ? 'unhealthy'
          : apiMode === 'unprobed' && (childState === 'ready' || childState === 'probe-missing')
          ? 'unknown'
          : childState === 'ready'
          ? 'healthy'
          : apiMode === 'absent'
          ? childState === 'probe-missing' ? 'unknown' : 'unhealthy'
          : 'degraded';
        const reports = await operation();
        const runtime = reports.flatMap((report) => report.checks).find((check) =>
          check.id === 'runtime-health'
        );
        assert(runtime, 'doctor must include the declared background child');
        assertEquals(runtime.runtimeHealth?.status, expected);
        assertStringIncludes(runtime.message ?? '', 'renamed-runner');
        assertEquals(runtime.runtimeHealth?.children[0]?.state, state);

        const output: string[] = [];
        const command = createDoctorPluginCommand({
          resolveProjectRoot: () => Promise.resolve('/project'),
          doctor: operation,
          print: (line) => output.push(line),
          diagnosticEvidence: () => ({
            read: () => Promise.resolve(undefined),
            write: () => Promise.resolve(),
            appendDrift: () => Promise.resolve(),
          }),
        });
        if (expected === 'healthy' || expected === 'unknown') await command.parse([]);
        else await assertRejects(() => command.parse([]), RemoteError);
        assertStringIncludes(output.join('\n'), expected);

        const adapter = new CliProjectDoctor(
          operation,
          () =>
            inspectPluginRuntime('/project', fs, {
              inspect: () => Promise.resolve({ status: 'running', resources }),
            }),
        );
        const server = createMcpServer({
          probe,
          flows: {
            get_app_status: createGetAppStatusFlow(query, adapter, '/project'),
            doctor: createDoctorFlow(probe, {}, [new PluginDoctorFamily(adapter)], '/project'),
          },
        });
        for (const name of ['get_app_status', 'doctor']) {
          const response = await server.handle({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name, arguments: {} },
          });
          assert(response && 'result' in response);
          const result = response.result as {
            isError?: boolean;
            structuredContent: Record<string, unknown>;
          };
          assertEquals(result.isError ?? false, false);
          assertEquals(
            result.structuredContent.status,
            expected === 'healthy' ? 'pass' : expected === 'unknown' ? 'warn' : 'fail',
          );
          if (name === 'get_app_status') {
            assertEquals(result.structuredContent.healthStatus, expected);
            assertEquals(result.structuredContent.pluginHealth, [runtime.runtimeHealth]);
          } else {
            assertStringIncludes(
              JSON.stringify(result.structuredContent),
              `"status":"${expected}"`,
            );
            assertStringIncludes(
              JSON.stringify(result.structuredContent),
              `"state":"${state}"`,
            );
          }
        }
        // A service filter must retain sibling child evidence.
        const filtered = await createGetAppStatusFlow(query, adapter, '/project')({
          service: apiMode === 'absent' ? 'renamed-runner' : 'renamed-api',
        });
        assert(filtered.ok);
        assertEquals(Reflect.get(filtered.value as object, 'healthStatus'), expected);
      });
    }
  }
}

Deno.test('runtime declarations skip disabled children and unrelated non-health processors', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Plugins: { stream: { Port: 8000, InstalledVersion: '0.0.7', InstalledFrom: 'stream' } },
        BackgroundProcessors: {
          disabled: {
            Enabled: false,
            Runtime: 'deno',
            RequiresKv: true,
            InstalledVersion: '0.0.7',
            InstalledFrom: 'stream',
          },
          benchmark: {
            Runtime: 'deno',
            RequiresKv: false,
            InstalledVersion: '0.0.7',
            InstalledFrom: 'benchmark',
          },
        },
      },
    }),
  );
  const reports = await doctorPlugin({ projectRoot: '/project' }, {
    fs,
    loadConfig: () =>
      Promise.resolve(defineConfig({ name: 'health-test', databases: { config: [] } })),
    process: { exec: () => Promise.reject(new Error('Unexpected process')) },
    inspectAppHost: {
      inspect: () =>
        Promise.resolve({
          status: 'running',
          resources: [{
            name: 'stream',
            state: 'Running',
            healthStatus: 'Healthy',
            healthReports: { http: {} },
          }],
        }),
    },
  });
  const checks = reports.flatMap((report) => report.checks).filter((check) =>
    check.id === 'runtime-health'
  );
  assertEquals(checks.length, 1);
  assertEquals(checks[0]?.runtimeHealth?.status, 'healthy');
  assertEquals(checks[0]?.runtimeHealth?.children, []);
});

for (const state of ['stopped', 'crash-looping'] as const) {
  for (const surface of ['doctor-report', 'cli-exit', 'mcp-doctor', 'mcp-health']) {
    Deno.test(`negative-control: ${state} child makes ${surface} degraded or red`, async () => {
      const fs = new MemoryFileSystemAdapter();
      await fs.writeFile(
        '/project/appsettings.json',
        JSON.stringify({
          NetScript: {
            Plugins: { api: { Port: 8000, InstalledVersion: '0.0.7', InstalledFrom: 'jobs' } },
            BackgroundProcessors: {
              runner: {
                Runtime: 'deno',
                RequiresKv: true,
                InstalledVersion: '0.0.7',
                InstalledFrom: 'jobs',
              },
            },
          },
        }),
      );
      const operation = () =>
        doctorPlugin({ projectRoot: '/project' }, {
          fs,
          loadConfig: () =>
            Promise.resolve(defineConfig({ name: 'test', databases: { config: [] } })),
          process: { exec: () => Promise.reject(new Error('Unexpected process')) },
          inspectAppHost: {
            inspect: () =>
              Promise.resolve({
                status: 'running',
                resources: [
                  {
                    name: 'api',
                    state: 'Running',
                    healthStatus: 'Healthy',
                    healthReports: { http: {} },
                  },
                  {
                    name: 'runner',
                    state: 'Running',
                    healthStatus: 'Unhealthy',
                    healthReports: { http: {} },
                    childHealth: {
                      state,
                      registryReady: true,
                      dependencyReady: true,
                      restartCount: state === 'crash-looping' ? 3 : 0,
                      lastFatalError: null,
                    },
                  },
                ],
              }),
          },
        });
      if (surface === 'doctor-report') {
        assert((await operation()).some((report) => report.status === 'degraded'));
      } else if (surface === 'cli-exit') {
        const command = createDoctorPluginCommand({
          doctor: operation,
          resolveProjectRoot: () => Promise.resolve('/project'),
          print: () => {},
          diagnosticEvidence: () => ({
            read: () => Promise.resolve(undefined),
            write: () => Promise.resolve(),
            appendDrift: () => Promise.resolve(),
          }),
        });
        await assertRejects(() => command.parse([]), RemoteError);
      } else {
        const adapter = new CliProjectDoctor(operation);
        const name = surface === 'mcp-doctor' ? 'doctor' : 'get_app_status';
        const server = createMcpServer({
          probe,
          flows: {
            doctor: createDoctorFlow(probe, {}, [new PluginDoctorFamily(adapter)], '/project'),
            get_app_status: createGetAppStatusFlow(query, adapter, '/project'),
          },
        });
        const response = await server.handle({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: {} },
        });
        assert(response && 'result' in response);
        const result = response.result as { structuredContent: { status: string } };
        assertEquals(result.structuredContent.status, 'fail');
      }
    });
  }
}

Deno.test('negative-control: MCP doctor retains named degraded health ahead of many workspace checks', async () => {
  const runtimeHealth = {
    pluginName: 'jobs',
    status: 'degraded' as const,
    apiResources: ['api'],
    childResources: ['runner'],
    apis: [{ name: 'api', status: 'healthy' as const, state: 'Running' }],
    children: [{ name: 'runner', status: 'unhealthy' as const, state: 'stopped' }],
  };
  const adapter = new CliProjectDoctor(() =>
    Promise.resolve([
      {
        pluginName: 'apphost',
        status: 'healthy',
        checks: Array.from(
          { length: 40 },
          (_, index) => ({ id: `resource-${index}`, title: 'Resource ready', status: 'healthy' }),
        ),
      },
      {
        pluginName: 'jobs',
        status: 'degraded',
        checks: [{
          id: 'runtime-health',
          title: 'Runtime health',
          status: 'degraded',
          runtimeHealth,
        }],
      },
    ])
  );
  const server = createMcpServer({
    probe,
    flows: { doctor: createDoctorFlow(probe, {}, [new PluginDoctorFamily(adapter)], '/project') },
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'doctor', arguments: {} },
  });
  assert(response && 'result' in response);
  const result = response.result as { structuredContent: Record<string, unknown> };
  assertEquals(result.structuredContent.status, 'fail');
  assertStringIncludes(JSON.stringify(result.structuredContent), '"state":"stopped"');
  assertStringIncludes(JSON.stringify(result.structuredContent), '"status":"degraded"');
});

Deno.test('negative-control: MCP status polls live children without invoking static doctor', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    JSON.stringify({
      NetScript: {
        Plugins: { api: { Port: 8000, InstalledVersion: '0.0.7', InstalledFrom: 'jobs' } },
        BackgroundProcessors: {
          runner: {
            Runtime: 'deno',
            RequiresKv: true,
            InstalledVersion: '0.0.7',
            InstalledFrom: 'jobs',
          },
        },
      },
    }),
  );
  let observations = 0;
  const adapter = new CliProjectDoctor(
    () => Promise.reject(new Error('Status polling must not invoke static doctor')),
    () =>
      inspectPluginRuntime('/project', fs, {
        inspect: (_root, children) => {
          assertEquals(children, ['runner']);
          observations++;
          return Promise.resolve({
            status: 'running',
            resources: [
              {
                name: 'api',
                state: 'Running',
                healthStatus: 'Healthy',
                healthReports: { http: {} },
              },
              ...(observations === 1 ? [] : [{
                name: 'runner',
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
              }]),
            ],
          });
        },
      }),
  );
  const server = createMcpServer({
    probe,
    flows: {
      get_app_status: createGetAppStatusFlow(query, adapter, '/project'),
    },
  });
  for (const expected of ['degraded', 'healthy']) {
    const response = await server.handle({
      jsonrpc: '2.0',
      id: observations + 1,
      method: 'tools/call',
      params: { name: 'get_app_status', arguments: {} },
    });
    assert(response && 'result' in response);
    const result = response.result as { structuredContent: Record<string, unknown> };
    assertEquals(result.structuredContent.healthStatus, expected);
    assertEquals(result.structuredContent.status, expected === 'healthy' ? 'pass' : 'fail');
  }
  assertEquals(observations, 2);
});

Deno.test('runtime polling skips AppHost inspection when no enabled declarations exist', async () => {
  const fs = new MemoryFileSystemAdapter();
  assertEquals(
    await inspectPluginRuntime('/project', fs, {
      inspect: () => Promise.reject(new Error('No declared runtime to inspect')),
    }),
    [],
  );
});
