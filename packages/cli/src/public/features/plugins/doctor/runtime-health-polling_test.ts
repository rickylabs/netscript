import { assert, assertEquals } from '@std/assert';
import { createMcpServer, type ProjectDoctorPort } from '@netscript/mcp';
import { createGetAppStatusFlow } from '../../../../../../mcp/src/application/flows/get-app-status-flow.ts';
import { UnwiredProjectDoctor } from '../../../../../../mcp/src/infrastructure/plugin-doctor-family.ts';
import { FakeTelemetryQuery, span } from '../../../../../../mcp/tests/telemetry-fixtures.ts';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { AspireAppHostDoctorInspector } from '../../../../kernel/adapters/aspire/apphost-doctor-inspector.ts';
import type { AppHostInspector } from './doctor-plugin-use-case.ts';
import { CliProjectDoctor } from '../../agent/mcp/cli-mcp-adapters.ts';
import { inspectPluginRuntime } from './plugin-runtime-health.ts';

const query = new FakeTelemetryQuery([span({ statusCode: 0 })], [], [{
  serviceName: 'api',
  attributes: {},
}]);
const probe = { probe: () => Promise.resolve({ reachable: true, message: 'online' }) };
const settings = JSON.stringify({
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
});
const running = {
  code: 0,
  stderr: '',
  stdout: JSON.stringify([
    { appHostPath: '/project/aspire/apphost.mts', status: 'Running' },
  ]),
};

async function status(doctor: ProjectDoctorPort, service?: string) {
  const server = createMcpServer({
    probe,
    flows: {
      get_app_status: createGetAppStatusFlow(query, doctor, '/project'),
    },
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'get_app_status', arguments: service ? { service } : {} },
  });
  assert(response && 'result' in response);
  const result = response.result as {
    isError?: boolean;
    structuredContent: Record<string, unknown>;
  };
  assertEquals(result.isError ?? false, false);
  return result.structuredContent;
}

for (
  const failure of [
    'inspector throws',
    'invalid JSON',
    'invalid plugin section',
    'invalid child section',
    'ps fails',
    'describe fails',
    'ps malformed',
    'describe malformed',
    'resources missing',
    'ps deadline',
    'describe deadline',
  ]
) {
  Deno.test(`runtime polling preserves telemetry when ${failure}`, async () => {
    const fs = new MemoryFileSystemAdapter();
    const content = failure === 'invalid JSON'
      ? '{invalid'
      : failure === 'invalid plugin section'
      ? JSON.stringify({ NetScript: { Plugins: [] } })
      : failure === 'invalid child section'
      ? JSON.stringify({ NetScript: { BackgroundProcessors: [] } })
      : settings;
    await fs.writeFile('/project/appsettings.json', content);
    const results = [running, { code: 0, stdout: '{"resources":[]}', stderr: '' }];
    if (failure.startsWith('ps ')) {
      results[0] = {
        code: failure === 'ps fails' ? 1 : 0,
        stdout: failure === 'ps malformed' ? 'not-json' : '[]',
        stderr: 'inspection failure',
      };
    } else if (failure.startsWith('describe ') || failure === 'resources missing') {
      results[1] = {
        code: failure === 'describe fails' ? 1 : 0,
        stdout: failure === 'describe malformed' ? 'not-json' : '{}',
        stderr: 'inspection failure',
      };
    }
    let calls = 0;
    const inspector: AppHostInspector = failure === 'inspector throws'
      ? { inspect: () => Promise.reject(new Error('aspire describe failed')) }
      : new AspireAppHostDoctorInspector({
        exec: () => {
          const result = results[calls++];
          assert(result);
          return Promise.resolve({
            ...result,
            timedOut: failure === 'ps deadline' && calls === 1 ||
              failure === 'describe deadline' && calls === 2,
          });
        },
      });
    const doctor = new CliProjectDoctor(
      () => Promise.reject(new Error('Polling invoked static doctor')),
      () => inspectPluginRuntime('/project', fs, inspector),
    );
    const baseline = await createGetAppStatusFlow(query)({});
    assert(baseline.ok);
    for (const service of [undefined, 'api']) {
      const value = await status(doctor, service);
      assertEquals(value.status, 'fail');
      assertEquals(value.healthStatus, 'unknown');
      assertEquals(value.counts, Reflect.get(baseline.value as object, 'counts'));
      assertEquals(value.domains, Reflect.get(baseline.value as object, 'domains'));
      assertEquals(value.runtimeChecks, [{
        name: 'runtime-health',
        status: 'fail',
        summary: 'Runtime health inspection failed. Run plugin doctor for details.',
      }]);
      calls = 0;
    }
  });
}

Deno.test('runtime polling keeps healthy no-plugin telemetry passing', async () => {
  const fs = new MemoryFileSystemAdapter();
  const doctor = new CliProjectDoctor(
    () => Promise.reject(new Error('Polling invoked static doctor')),
    () =>
      inspectPluginRuntime('/project', fs, {
        inspect: () => Promise.reject(new Error('No declared resources to inspect')),
      }),
  );
  const value = await status(doctor);
  assertEquals(value.status, 'pass');
  assertEquals(value.healthStatus, undefined);
  assertEquals(value.pluginHealth, undefined);
});

Deno.test('runtime polling keeps healthy standalone unwired telemetry passing', async () => {
  const value = await status(new UnwiredProjectDoctor());
  assertEquals(value.status, 'pass');
  assertEquals(value.healthStatus, undefined);
  assertEquals(value.pluginHealth, undefined);
});

Deno.test('legacy static doctor failures remain fail with service filters', async () => {
  const doctor: ProjectDoctorPort = {
    diagnose: () =>
      Promise.resolve([{
        name: 'configuration',
        status: 'fail',
        summary: 'Invalid configuration.',
      }]),
  };
  for (const service of [undefined, 'api']) {
    const value = await status(doctor, service);
    assertEquals(value.status, 'fail');
    assertEquals(value.healthStatus, 'unknown');
    assertEquals(value.runtimeChecks, [{
      name: 'configuration',
      status: 'fail',
      summary: 'Invalid configuration.',
    }]);
  }
});

Deno.test('declaration warning: polling retains warnings and telemetry under service filters', async () => {
  const baseline = await createGetAppStatusFlow(query)({});
  assert(baseline.ok);
  const warning = {
    name: 'runtime:declaration',
    status: 'warn' as const,
    summary: 'Malformed child declaration.',
  };
  const doctor: ProjectDoctorPort = {
    diagnose: () => Promise.reject(new Error('Unexpected static doctor')),
    readRuntimeHealth: () => Promise.resolve([warning]),
  };
  for (const service of [undefined, 'api']) {
    const value = await status(doctor, service);
    assertEquals(value.status, 'warn');
    assertEquals(value.runtimeChecks, [warning]);
    assertEquals(value.counts, Reflect.get(baseline.value as object, 'counts'));
    assertEquals(value.domains, Reflect.get(baseline.value as object, 'domains'));
  }
});

Deno.test('runtime polling prioritizes a failed inspection ahead of bounded declaration warnings', async () => {
  const doctor: ProjectDoctorPort = {
    diagnose: () => Promise.resolve([]),
    readRuntimeHealth: () =>
      Promise.resolve([
        ...Array.from(
          { length: 25 },
          (_, index) => ({
            name: `warning-${index}`,
            status: 'warn' as const,
            summary: 'Malformed declaration.',
          }),
        ),
        { name: 'runtime-health', status: 'fail' as const, summary: 'Runtime not running.' },
      ]),
  };
  const value = await status(doctor);
  assertEquals(value.status, 'fail');
  assertEquals((value.runtimeChecks as readonly unknown[]).length, 20);
  assertEquals((value.runtimeChecks as readonly { status: string }[])[0].status, 'fail');
});

for (
  const snapshot of [
    { status: 'not-running' },
    { status: 'unavailable', reason: 'Aspire cannot execute' },
  ] as const
) {
  Deno.test(`declared ${snapshot.status} runtime cannot be mistaken for no plugins`, async () => {
    const fs = new MemoryFileSystemAdapter();
    await fs.writeFile('/project/appsettings.json', settings);
    const doctor = new CliProjectDoctor(
      () => Promise.reject(new Error('Polling invoked static doctor')),
      () => inspectPluginRuntime('/project', fs, { inspect: () => Promise.resolve(snapshot) }),
    );
    const value = await status(doctor);
    assertEquals(value.status, 'fail');
    assertEquals(value.healthStatus, 'unknown');
    assertEquals(
      Reflect.get((value.runtimeChecks as object[])[0]!, 'name'),
      'runtime:runtime-health',
    );
  });
}
