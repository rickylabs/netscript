import { assertEquals, assertStringIncludes } from '@std/assert';
import { createMcpServer } from '../mod.ts';
import type { TelemetryProbePort } from '../mod.ts';

const unreachable: TelemetryProbePort = {
  probe: () => Promise.resolve({ reachable: false, message: 'connection refused' }),
};

Deno.test('doctor resolves explicit endpoint and returns a structured warning', async () => {
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
  assertEquals(structured.status, 'warn');
  assertEquals(structured.endpoint, 'http://explicit.test');
  assertStringIncludes(JSON.stringify(structured), 'NETSCRIPT_TELEMETRY_ENDPOINT');
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
