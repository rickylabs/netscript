import { assertEquals } from '@std/assert';
import {
  createDashboardLinkedSpanReader,
  enrichAspireCliSpanLinks,
  indexLinkedSpans,
  splitDashboardUrl,
} from './aspire-dashboard-span-links.ts';

const apiPayload = {
  data: {
    resourceSpans: [{
      scopeSpans: [{
        spans: [{
          traceId: 'c0',
          spanId: 'consumer',
          links: [{
            traceId: 'p0',
            spanId: 'producer',
            attributes: [{ key: 'messaging.message.id', value: { stringValue: 'm-1' } }],
          }],
        }],
      }],
    }],
  },
  totalCount: 1,
  returnedCount: 1,
};

Deno.test('enrichAspireCliSpanLinks borrows attribute-bearing links from the dashboard API', async () => {
  const cliRows = [
    {
      traceId: 'c0',
      spanId: 'consumer',
      name: 'stream.subscribe',
      links: [{ traceId: 'p0', spanId: 'producer' }],
    },
    { traceId: 'p0', spanId: 'producer', name: 'job.execute', links: [] },
  ];
  const requested: string[] = [];
  const enriched = await enrichAspireCliSpanLinks(cliRows, (traceId) => {
    requested.push(traceId);
    return Promise.resolve(indexLinkedSpans(apiPayload));
  });
  assertEquals(requested, ['c0']);
  assertEquals(
    (enriched[0] as { links: unknown[] }).links,
    apiPayload.data.resourceSpans[0].scopeSpans[0].spans[0].links,
  );
  assertEquals(enriched[1], cliRows[1]);
});

Deno.test('enrichAspireCliSpanLinks keeps CLI links when the API read fails or omits the span', async () => {
  const rows = [{
    traceId: 'c0',
    spanId: 'consumer',
    links: [{ traceId: 'p0', spanId: 'producer' }],
  }];
  assertEquals(await enrichAspireCliSpanLinks(rows, () => Promise.reject(new Error('down'))), rows);
  assertEquals(await enrichAspireCliSpanLinks(rows, () => Promise.resolve(new Map())), rows);
  assertEquals(await enrichAspireCliSpanLinks(rows, undefined), rows);
});

Deno.test('createDashboardLinkedSpanReader exchanges the login token once and queries by trace', async () => {
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
    return Promise.resolve(Response.json(apiPayload));
  };
  const read = createDashboardLinkedSpanReader('http://127.0.0.1:18888/login?t=tok', fetchImpl);
  assertEquals((await read('c0')).get('consumer')?.length, 1);
  await read('c1');
  assertEquals(calls.map((call) => [call.method, new URL(call.url).pathname, call.apiKey]), [
    ['POST', '/api/telemetry/validateToken', null],
    ['GET', '/api/telemetry/spans', 'key-1'],
    ['GET', '/api/telemetry/spans', 'key-1'],
  ]);
  assertEquals(calls[0].body, { token: 'tok' });
  assertEquals(new URL(calls[1].url).searchParams.get('traceId'), 'c0');
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
