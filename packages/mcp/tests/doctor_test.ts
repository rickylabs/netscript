import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { createMcpServer } from '../mod.ts';
import type { TelemetryProbePort } from '../mod.ts';
import type { DoctorCheckFamily, DoctorResult } from '../mod.ts';
import { createDoctorFlow } from '../src/application/flows/doctor-flow.ts';
import { validateSchema } from '../src/domain/schema.ts';
import { TOOL_OUTPUT_SCHEMAS } from '../src/domain/tool-contracts.ts';
import { FetchTelemetryProbe } from '../src/infrastructure/fetch-telemetry-probe.ts';

const unreachable: TelemetryProbePort = {
  probe: () => Promise.resolve({ reachable: false, message: 'connection refused' }),
};

Deno.test('telemetry probe only treats successful HTTP responses as reachable', async () => {
  for (const [status, reachable] of [[204, true], [404, false], [500, false]] as const) {
    const probe = new FetchTelemetryProbe(
      () => () => Promise.resolve(new Response(null, { status })),
    );
    assertEquals((await probe.probe('http://telemetry.test')).reachable, reachable);
  }
});

Deno.test('doctor fails an explicit telemetry endpoint that responds with HTTP 404', async () => {
  const probe = new FetchTelemetryProbe(
    () => () => Promise.resolve(new Response(null, { status: 404 })),
  );
  const result = await createDoctorFlow(probe, {}, [], '/fixture')({
    endpoint: 'http://telemetry.test',
  });
  if (!result.ok) throw new Error(result.error.message);
  const doctor = result.value as DoctorResult;
  assertEquals(doctor.status, 'fail');
  assertEquals(doctor.counts, { pass: 0, warn: 0, fail: 1 });
  assertStringIncludes(doctor.families[0]?.checks[0]?.summary ?? '', 'HTTP 404');
});

Deno.test('doctor treats an unreachable explicit endpoint as a failure', async () => {
  const response = await createMcpServer({
    probe: unreachable,
    environmentEndpoint: 'http://env.test',
  }).handle({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'doctor', arguments: { endpoint: 'http://explicit.test' } },
  });
  const structured = response?.result?.structuredContent as Record<string, unknown>;
  assertEquals(structured.status, 'fail');
  assertEquals(structured.endpoint, 'http://explicit.test');
  assertStringIncludes(JSON.stringify(structured), 'NETSCRIPT_TELEMETRY_ENDPOINT');
});

Deno.test('doctor warns when no running app and no endpoint is explicit', async () => {
  const response = await createMcpServer({ probe: unreachable }).handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'doctor', arguments: {} },
  });
  const structured = response?.result?.structuredContent as Record<string, unknown>;
  assertEquals(structured.status, 'warn');
  assertEquals(structured.counts, { pass: 0, warn: 1, fail: 0 });
  assertEquals((structured.families as unknown[]).length, 1);
});

Deno.test('runner rejects invalid successful tool output', async () => {
  const server = createMcpServer({
    probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    flows: { doctor: () => Promise.resolve({ ok: true, value: { status: 'unknown' } }) },
  });
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name: 'doctor', arguments: {} },
  });
  assertEquals(response?.error?.code, -32603);
  assertEquals((response?.error?.data as Record<string, unknown>).code, 'invalid_tool_result');
});

Deno.test('doctor aggregation counts severities and isolates family failures', async () => {
  const warning: DoctorCheckFamily = {
    name: 'project',
    check: () => Promise.resolve([{ name: 'project_fixture', status: 'warn', summary: 'warning' }]),
  };
  const throwing: DoctorCheckFamily = {
    name: 'plugins',
    check: () => Promise.reject(new Error('plugin fixture failed')),
  };
  const result = await createDoctorFlow(
    { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    {},
    [warning, throwing],
    '/fixture',
  )({});
  if (!result.ok) throw new Error(result.error.message);
  const doctor = result.value as DoctorResult;
  assertEquals(doctor.status, 'fail');
  assertEquals(doctor.counts, { pass: 1, warn: 1, fail: 1 });
  assertEquals(doctor.families.map((family) => family.status), ['pass', 'warn', 'fail']);
  assertStringIncludes(
    doctor.families[1]?.checks[0]?.operationSchemaHint ?? '',
    'get_operation_schema',
  );
  assertStringIncludes(
    doctor.families[2]?.checks[0]?.operationSchemaHint ?? '',
    'get_operation_schema',
  );
  assertEquals(doctor.families[0]?.checks[0]?.operationSchemaHint, undefined);
});

Deno.test('real doctor flow stays within its advertised schema for large families', async () => {
  const large: DoctorCheckFamily = {
    name: 'plugins',
    check: () =>
      Promise.resolve(Array.from({ length: 25 }, (_, index) => ({
        name: `plugin_check_${index}`,
        status: index === 24 ? 'fail' as const : 'pass' as const,
        summary: `check ${index}`,
      }))),
  };
  const result = await createDoctorFlow(
    { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
    {},
    [large],
  )({});
  assert(result.ok);

  const doctor = validateSchema(TOOL_OUTPUT_SCHEMAS.doctor, result.value) as DoctorResult;
  assertEquals(doctor.checks.length, 2);
  assertEquals(doctor.counts, { pass: 25, warn: 0, fail: 1 });
  assertEquals(doctor.families[1]?.checks.length, 20);
  assertEquals(doctor.families[1]?.checks[19]?.name, 'plugins_additional_checks');
  assertEquals(doctor.families[1]?.checks[19]?.status, 'fail');
});
