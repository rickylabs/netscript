import { resolveResourceUrlsFromAppHost } from '../generated-app-endpoint.ts';
import { z } from 'zod';

const orderRowsSchema = z.array(
  z.object({ id: z.string(), reference: z.string().regex(/^SO-/), status: z.string() }),
);
const recordsSchema = z.object({
  state: z.literal('ready'),
  total: z.literal(40),
  rows: z.array(
    z.object({ id: z.string(), reference: z.string().regex(/^SO-/), status: z.string() }),
  ).min(2),
});
const FAILURE_CEILING_MS = 120_000;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function visibleHtml(source: string): string {
  return source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(
    /<style\b[^>]*>[\s\S]*?<\/style>/gi,
    '',
  );
}
/** Only content inside the actual stream activity panel proves order-event rendering. */
export function renderedOrderActivity(source: string, reference: string): boolean {
  const panel = visibleHtml(source).match(
    /<section\b[^>]*data-capability=["']streams["'][^>]*>[\s\S]*?<\/section>/,
  )?.[0] ?? '';
  return /data-capability-state=["']ready["']/.test(panel) &&
    [...panel.matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)].some(([item]) =>
      item.includes(reference) && /\bupdated\b/.test(item)
    );
}
async function html(base: string, path: string): Promise<string> {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
  assert(response.status === 200, `${path}: expected HTTP 200, received ${response.status}`);
  return visibleHtml(await response.text());
}
async function eventually<T>(
  read: () => Promise<T>,
  accept: (value: T) => boolean,
  failure: string,
): Promise<T> {
  const deadline = Date.now() + FAILURE_CEILING_MS;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await read();
      if (accept(value)) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(failure, { cause: lastError });
}

/** Probe the exact documented user journey using real server-rendered pages and form actions. */
export async function probeShowcase(appHost: string, appName: string): Promise<void> {
  const urls = await resolveResourceUrlsFromAppHost(appHost, appName);
  assert(urls.length, 'Aspire did not publish the showcase app endpoint');
  const base = urls[0]!;
  const records = await eventually(
    async () => {
      const response = await fetch(new URL('/orders', base), {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      assert(response.status === 200, 'Orders did not serve their documented read');
      return recordsSchema.parse(await response.json());
    },
    (value) => value.total === 40,
    'Seeded Northwind orders did not render',
  );
  assert(
    (await html(base, '/orders')).includes('SO-10482'),
    'Orders table did not render its seeded reference',
  );
  for (
    const [path, content] of [['/customers', 'Alpenhaus'], ['/products', 'Form oak chair']] as const
  ) {
    assert(
      (await html(base, path)).includes(content),
      `${path}: saved catalogue content did not render`,
    );
  }
  const candidates: z.infer<typeof orderRowsSchema> = [];
  for (const status of ['pending', 'awaiting_payment', 'paid']) {
    const response = await fetch(new URL(`/orders?status=${status}`, base), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    assert(response.status === 200, 'The documented order status filter failed');
    candidates.push(...z.object({ rows: orderRowsSchema }).parse(await response.json()).rows);
    if (candidates.length >= 2) break;
  }
  assert(candidates.length >= 2, 'The seeded sample needs two orders eligible for fulfilment');
  for (const [index, action] of ['fulfil', 'webhook'].entries()) {
    const order = candidates[index]!;
    const detail = await html(base, `/orders/${order.id}`);
    assert(
      detail.includes('Order items') && detail.includes('Order journey'),
      'Order detail did not render its commerce extensions',
    );
    const response = await fetch(new URL(`/orders/${order.id}/${action}`, base), {
      method: 'POST',
      headers: {
        origin: new URL(base).origin,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: '',
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    await response.body?.cancel();
    assert(
      response.status === 303,
      `${action}: expected the same-origin form redirect, received ${response.status}`,
    );
    const completed = await eventually(
      () => html(base, `/orders/${order.id}`),
      (source) =>
        /data-northwind-worker=["']completed["']/.test(source) &&
        /data-northwind-saga=["']completed["']/.test(source),
      `${action}: real worker execution and saga completion did not render`,
    );
    const journey = completed.match(
      /<section\b[^>]*data-northwind-saga=["']completed["'][^>]*>[\s\S]*?<\/section>/,
    )?.[0] ?? '';
    assert(
      (journey.match(/<time\b/g) ?? []).length === 3,
      'Every saga step must render its persisted timestamp',
    );
    assert(
      completed.includes('aria-valuenow="100"'),
      'Completed fulfilment must render 100% progress',
    );
    for (const step of ['Order accepted', 'Payment confirmed', 'Shipped to customer']) {
      assert(completed.includes(step), `Missing saga step: ${step}`);
    }
    await eventually(
      async () => {
        const response = await fetch(
          new URL(`/orders?search=${encodeURIComponent(order.reference)}`, base),
          {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(15000),
          },
        );
        assert(response.status === 200, 'Could not reread the persisted order');
        return z.object({ rows: orderRowsSchema }).parse(await response.json()).rows;
      },
      (rows) => rows.some((row) => row.id === order.id && row.status === 'shipped'),
      `${action}: the saved order never became shipped`,
    );
    const overview = await eventually(
      () => html(base, '/'),
      (source) => renderedOrderActivity(source, order.reference),
      `${action}: stream-linked order activity did not render`,
    );
    assert(overview.includes('updated'), 'Activity must contain a committed order update');
  }
  console.log(
    JSON.stringify({
      gate: 'showcase.walkthrough',
      ok: true,
      seededOrders: records.total,
      catalogue: 'rendered',
      worker: 'completed',
      saga: ['order', 'payment', 'shipping'],
      webhook: 'executed',
      activity: 'stream-rendered',
    }),
  );
}

if (import.meta.main) {
  const [appHost, appName] = Deno.args;
  if (!appHost || !appName) throw new Error('Expected apphost path and application name');
  await probeShowcase(appHost, appName);
}
