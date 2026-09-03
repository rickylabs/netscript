import { assertEquals } from '@std/assert';
import { createDashboardTelemetryApiReader, splitDashboardUrl } from './aspire-dashboard-api.ts';

Deno.test('createDashboardTelemetryApiReader exchanges the login token once and forwards queries', async () => {
  const calls: { url: string; method: string; apiKey: string | null; body?: unknown }[] = [];
  const fetchImpl: typeof fetch = (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method: init?.method ?? 'GET',
      apiKey: headers.get('X-API-Key'),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    if (url.endsWith('/api/telemetry/validateToken')) {
      return Promise.resolve(Response.json({ apiKey: 'key-1' }));
    }
    return Promise.resolve(Response.json({ data: { resourceSpans: [] } }));
  };
  const read = createDashboardTelemetryApiReader('http://127.0.0.1:18888/login?t=tok', fetchImpl);
  const first = await read('spans', new URLSearchParams({ resource: 'streams', limit: '50' }));
  assertEquals(first.status, 200);
  await read('traces/abc', new URLSearchParams());
  assertEquals(calls.map((call) => [call.method, new URL(call.url).pathname, call.apiKey]), [
    ['POST', '/api/telemetry/validateToken', null],
    ['GET', '/api/telemetry/spans', 'key-1'],
    ['GET', '/api/telemetry/traces/abc', 'key-1'],
  ]);
  assertEquals(calls[0].body, { token: 'tok' });
  assertEquals(new URL(calls[1].url).search, '?resource=streams&limit=50');
});

Deno.test('createDashboardTelemetryApiReader sends no key for a token-less dashboard URL', async () => {
  const keys: (string | null)[] = [];
  const fetchImpl: typeof fetch = (_input, init) => {
    keys.push(new Headers(init?.headers).get('X-API-Key'));
    return Promise.resolve(Response.json({ data: { resourceSpans: [] } }));
  };
  await createDashboardTelemetryApiReader('http://127.0.0.1:18888', fetchImpl)(
    'spans',
    new URLSearchParams(),
  );
  assertEquals(keys, [null]);
});

Deno.test('splitDashboardUrl separates the API origin from the frontend login token', () => {
  assertEquals(splitDashboardUrl('http://127.0.0.1:18888/login?t=abc'), {
    baseUrl: 'http://127.0.0.1:18888',
    loginToken: 'abc',
  });
  assertEquals(splitDashboardUrl('http://127.0.0.1:18888'), {
    baseUrl: 'http://127.0.0.1:18888',
    loginToken: undefined,
  });
});
