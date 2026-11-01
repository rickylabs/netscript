import { assert, assertAlmostEquals, assertEquals, assertThrows } from '@std/assert';
import { renderTemplate } from '../../../adapters/scaffold/template-adapter.ts';
import { readTemplateAssetSync } from '../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../assets/manifest.ts';

const moduleUrl = (source: string) => `data:application/typescript,${encodeURIComponent(source)}`;
const contractUrl = moduleUrl(readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldContract));
const projectionUrl = moduleUrl(
  readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldProjections).replace(
    "'./scaffold-contract.ts'",
    JSON.stringify(contractUrl),
  ),
);
const { projectScaffoldOverview: project, scaffoldMetric } = await import(projectionUrl);
const now = new Date('2026-11-01T23:59:00Z');

function row(id: number, createdAt: string, amount = 100, status = 'paid', currency = 'USD') {
  return {
    id: String(id),
    reference: `REC-${id}`,
    name: `Record ${id}`,
    description: '',
    ownerName: 'Owner',
    ownerEmail: 'owner@example.com',
    amount,
    currency,
    status,
    createdAt,
    updatedAt: createdAt,
    fields: [],
  };
}

Deno.test('overview compares adjacent UTC periods, signed amounts, averages and refund rates', () => {
  const rows = [
    row(1, '2026-10-03T00:00:00Z', 300),
    row(2, '2026-11-01T23:59:59Z', -100, 'refunded'),
    row(3, '2026-09-03T00:00:00Z', 100),
    row(4, '2026-10-02T23:59:59Z', 100),
    row(5, '2026-09-02T23:59:59Z', 9000, 'cancelled'),
    row(6, '2026-11-02T00:00:00Z', 9000, 'pending'),
    row(7, '2026-10-09T10:00:00Z', 500, 'shipped', 'JPY'),
  ];
  const result = project({ state: 'ready', rows, total: rows.length, message: 'live' }, {
    now,
    latestLimit: 2,
  });
  assertEquals(result.periods, {
    current: { from: '2026-10-03T00:00:00.000Z', to: '2026-11-02T00:00:00.000Z' },
    previous: { from: '2026-09-03T00:00:00.000Z', to: '2026-10-03T00:00:00.000Z' },
  });
  assertEquals(result.totals.records, { current: 3, previous: 2, delta: 1, percentChange: 50 });
  assertEquals(result.totals.currencies.map((item: { currency: string }) => item.currency), [
    'JPY',
    'USD',
  ]);
  assertEquals(result.totals.currencies[1].amount, {
    current: 200,
    previous: 200,
    delta: 0,
    percentChange: 0,
  });
  assertEquals(result.totals.currencies[1].averageAmount.current, 100);
  assertAlmostEquals(result.totals.refundRate.current, 100 / 3);
  assertEquals(result.totals.refundRate.previous, 0);
  assertEquals(result.totals.refundRate.percentChange, null);
  assertEquals(result.latest.map((item: { id: string }) => item.id), ['6', '2']);
  assertEquals(
    result.statusCounts.reduce((sum: number, item: { count: number }) => sum + item.count, 0),
    rows.length,
  );
});

Deno.test('daily series fills all sixty days and status counts include zero-valued statuses', () => {
  const result = project({
    state: 'ready',
    message: 'live',
    rows: [
      row(1, '2026-11-01T02:00:00+02:00', 120),
      row(2, '2026-11-01T01:00:00Z', -20, 'refunded'),
    ],
  }, { now });
  assertEquals(result.daily.length, 60);
  assertEquals(result.daily[0], {
    date: '2026-09-03',
    count: 0,
    amounts: [{ currency: 'USD', amount: 0 }],
  });
  assertEquals(result.daily[59], {
    date: '2026-11-01',
    count: 2,
    amounts: [{ currency: 'USD', amount: 100 }],
  });
  assertEquals(result.statusCounts, [
    { status: 'pending', count: 0 },
    { status: 'awaiting_payment', count: 0 },
    { status: 'paid', count: 1 },
    { status: 'shipped', count: 0 },
    { status: 'refunded', count: 1 },
    { status: 'cancelled', count: 0 },
  ]);
});

Deno.test('delta semantics handle growth, decline, zero baseline and negative previous amounts', () => {
  assertEquals(scaffoldMetric(120, 100), {
    current: 120,
    previous: 100,
    delta: 20,
    percentChange: 20,
  });
  assertEquals(scaffoldMetric(75, 100).percentChange, -25);
  assertEquals(scaffoldMetric(0, 0).percentChange, 0);
  assertEquals(scaffoldMetric(10, 0).percentChange, null);
  assertEquals(scaffoldMetric(-50, -100).percentChange, 50);
  assertEquals(scaffoldMetric(-150, -100).percentChange, -50);
});

Deno.test('projections preserve absent, empty, unauthorized and unavailable without inventing totals', () => {
  for (const state of ['absent', 'installed-unwired', 'unauthorized', 'unavailable']) {
    const result = project({
      state,
      rows: [],
      message: 'explanation',
      command: 'netscript service list',
    }, { now });
    assertEquals(result, { state, message: 'explanation', command: 'netscript service list' });
    assertEquals('totals' in result, false);
  }
  const empty = project({ state: 'empty', rows: [], total: 0, message: 'No rows' }, { now });
  assertEquals(empty.state, 'empty');
  assertEquals(empty.totals.records, scaffoldMetric(0, 0));
  assertEquals(empty.totals.currencies, []);
  assertEquals(empty.latest, []);
  assertEquals(empty.daily.length, 60);
  assert(empty.daily.every((bucket: { count: number }) => bucket.count === 0));
  assertThrows(
    () => project({ state: 'ready', rows: [], message: '' }, { now: new Date('invalid') }),
    RangeError,
  );
  assertThrows(
    () => project({ state: 'ready', rows: [], message: '' }, { now, latestLimit: -1 }),
    RangeError,
  );
});

Deno.test('overview latest sorting is deterministic, limited and does not mutate input', () => {
  const rows = [
    row(2, '2026-11-01T00:00:00Z'),
    row(1, '2026-11-01T00:00:00Z'),
    row(3, '2026-10-01T00:00:00Z'),
  ];
  const result = project({ state: 'ready', rows, message: '' }, { now, latestLimit: 1 });
  assertEquals(result.latest.map((item: { id: string }) => item.id), ['1']);
  assertEquals(rows.map((item) => item.id), ['2', '1', '3']);
  assertEquals(project({ state: 'ready', rows, message: '' }, { now, latestLimit: 0 }).latest, []);
});

Deno.test('complete overview follows pages, forwards credentials and rejects partial/inconsistent reads', async () => {
  const pagesUrl = moduleUrl(
    `let pages: unknown[] = []; export function setPages(next: unknown[]) { pages = next; } export const requests: Request[] = []; export async function loadScaffoldRecords(request: Request) { requests.push(request); return pages[Number(new URL(request.url).searchParams.get('page')) - 1]; }`,
  );
  const pages = await import(pagesUrl);
  const source = readTemplateAssetSync(TEMPLATE_KEYS.appScaffoldOverview).replace(
    "'./scaffold-records.ts'",
    JSON.stringify(pagesUrl),
  ).replace("'./scaffold-projections.ts'", JSON.stringify(projectionUrl)).replace(
    "'./scaffold-contract.ts'",
    JSON.stringify(contractUrl),
  );
  const { loadScaffoldOverview } = await import(moduleUrl(source));
  const first = {
    state: 'ready',
    rows: [row(1, '2026-11-01T00:00:00Z')],
    total: 2,
    hasNext: true,
    message: 'live',
  };
  const last = { ...first, rows: [row(2, '2026-10-02T00:00:00Z')], hasNext: false };
  const request = new Request('https://app.example/?page=99&status=paid', {
    headers: { cookie: 'session=proof', authorization: 'Bearer proof' },
  });
  pages.setPages([first, last]);
  assertEquals((await loadScaffoldOverview(request, { now })).totals.records, scaffoldMetric(1, 1));
  assertEquals(pages.requests.length, 2);
  assertEquals(new URL(pages.requests[0].url).search, '?page=1');
  assertEquals(pages.requests[0].headers.get('cookie'), 'session=proof');
  assertEquals(pages.requests[0].headers.get('authorization'), 'Bearer proof');
  for (
    const bad of [{ ...last, total: 3 }, { ...last, rows: first.rows }, { ...last, rows: [] }, {
      state: 'unauthorized',
      rows: [],
      message: 'Denied',
    }, { state: 'unavailable', rows: [], message: 'Failed' }]
  ) {
    pages.setPages([first, bad]);
    const result = await loadScaffoldOverview(request, { now });
    assert(['unauthorized', 'unavailable'].includes(result.state));
    assertEquals('totals' in result, false);
  }
  for (const state of ['absent', 'empty', 'unauthorized', 'unavailable']) {
    pages.setPages([{
      state,
      rows: [],
      total: state === 'empty' ? 0 : undefined,
      hasNext: false,
      message: state,
    }]);
    assertEquals((await loadScaffoldOverview(request, { now })).state, state);
  }
  pages.setPages(
    Array.from(
      { length: 101 },
      (_, index) => ({ ...first, rows: [row(index, '2026-11-01T00:00:00Z')], total: 101 }),
    ),
  );
  assertEquals((await loadScaffoldOverview(request, { now })).state, 'unavailable');
});

Deno.test('both storage adapters forward status, sort and pagination and project rich fields', async () => {
  const contextUrl = moduleUrl(
    `let result: unknown; let query: unknown; export function setResult(value: unknown) { result = value; } export const queryValue = () => query; export const scaffoldServiceClient = async () => ({ client: { list: async (input: unknown) => { query = input; return result; } }, context: {} }); export const scaffoldReadFailure = () => ({ state: 'unavailable', rows: [], message: 'Unavailable' });`,
  );
  const context = await import(contextUrl);
  const item = row(27, '2026-11-01T00:00:00Z');
  for (
    const key of [TEMPLATE_KEYS.appScaffoldRecordsDatabase, TEMPLATE_KEYS.appScaffoldRecordsMemory]
  ) {
    const source = renderTemplate(readTemplateAssetSync(key), {
      serviceName: 'members',
      serviceQueryModule: 'fixture-query',
    })
      .replace(
        /^import .* from 'fixture-query';/m,
        "const contract = {}; const serviceName = 'members'; const routerName = 'members';",
      )
      .replace("'./scaffold-service-context.ts'", JSON.stringify(contextUrl)).replace(
        "'./scaffold-contract.ts'",
        JSON.stringify(contractUrl),
      );
    const module = await import(moduleUrl(source));
    context.setResult({
      data: [item],
      pagination: { total: 40, hasNext: false },
      items: [item],
      total: 40,
      hasMore: false,
    });
    const result = await module.loadScaffoldRecords(
      new Request('https://app.example/records?page=2&status=paid&sortBy=amount&sortOrder=asc'),
    );
    assertEquals(result.rows[0].reference, 'REC-27');
    assertEquals(result.rows[0].ownerName, 'Owner');
    assertEquals(result.rows[0].amount, 100);
    assertEquals(result.rows[0].status, 'paid');
    const { scaffoldPageHref } = await import(contractUrl);
    const nextUrl = new URL(scaffoldPageHref('/records', result, 3), 'https://app.example');
    assertEquals(Object.fromEntries(nextUrl.searchParams), {
      page: '3',
      status: 'paid',
      sortBy: 'amount',
      sortOrder: 'asc',
    });
    assertEquals(result.rows[0].createdAt, '2026-11-01T00:00:00.000Z');
    assertEquals(context.queryValue(), {
      page: 2,
      sortBy: 'amount',
      sortOrder: 'asc',
      status: 'paid',
      limit: 25,
      ...(key === TEMPLATE_KEYS.appScaffoldRecordsMemory ? { offset: 25 } : {}),
    });
    context.setResult({
      data: [],
      pagination: { total: 0, hasNext: false },
      items: [],
      total: 0,
      hasMore: false,
    });
    const empty = await module.loadScaffoldRecords(
      new Request('https://app.example/records?status=paid'),
    );
    assertEquals(empty.state, 'empty');
    assertEquals(empty.message, 'No records match this status.');
  }
});
