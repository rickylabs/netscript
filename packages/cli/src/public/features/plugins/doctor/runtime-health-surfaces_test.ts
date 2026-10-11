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
  for (const apiReady of [true, false]) {
    for (const childState of states) {
      Deno.test(`health surfaces: ${plugin} API ${apiReady ? 'healthy' : 'unhealthy'} child ${childState}`, async () => {
        const fs = new MemoryFileSystemAdapter();
        await fs.writeFile(
          '/project/appsettings.json',
          JSON.stringify({
            NetScript: {
              Plugins: {
                'renamed-api': {
                  Port: 8000,
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
          {
            name: 'renamed-api',
            state: 'Running',
            healthStatus: apiReady ? 'Healthy' : 'Unhealthy',
            healthReports: { http: {} },
          },
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
        const expected = !apiReady ? 'unhealthy' : childState === 'ready' ? 'healthy' : 'degraded';
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
        if (expected === 'healthy') await command.parse([]);
        else await assertRejects(() => command.parse([]), RemoteError);
        assertStringIncludes(output.join('\n'), expected);

        const adapter = new CliProjectDoctor(operation);
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
          assertEquals(result.structuredContent.status, expected === 'healthy' ? 'pass' : 'fail');
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
          service: 'renamed-api',
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

for (const surface of ['doctor-report', 'cli-exit', 'mcp-doctor', 'mcp-health']) {
  Deno.test(`negative-control: stopped child makes ${surface} degraded or red`, async () => {
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
                  state: 'Stopped',
                  healthStatus: 'Unhealthy',
                  healthReports: { http: {} },
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
