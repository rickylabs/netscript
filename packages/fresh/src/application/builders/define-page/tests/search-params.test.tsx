import { definePage, fallback, paginationSearchSchema, searchParamsToInput } from '../mod.ts';
import { z } from 'zod';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createRequestContext(overrides: Partial<{
  data: unknown;
  params: Record<string, string | undefined>;
  req: Request;
  url: URL;
}> = {}) {
  return {
    url: overrides.url ?? new URL('http://localhost/dashboard/users'),
    req: overrides.req ??
      new Request(overrides.url?.toString() ?? 'http://localhost/dashboard/users'),
    params: overrides.params ?? {},
    state: { requestId: 'req-1' },
    isPartial: false,
    data: overrides.data,
  };
}

Deno.test('paginationSearchSchema coerces values and computes offset', () => {
  const schema = paginationSearchSchema({
    defaultLimit: 12,
    defaultSort: 'createdAt',
    defaultOrder: 'desc',
  }).extend({
    role: fallback(z.enum(['admin', 'user']), 'user'),
    search: fallback(z.string(), ''),
  });

  const result = schema.safeParse({
    page: '3',
    limit: '12',
    sortBy: 'name',
    sortOrder: 'asc',
    role: 'admin',
    search: 'ricky',
  });

  assert(result.success, 'Expected pagination search parsing to succeed');
  assert(result.data.page === 3, `Unexpected page: ${result.data.page}`);
  assert(result.data.limit === 12, `Unexpected limit: ${result.data.limit}`);
  assert(result.data.offset === 24, `Unexpected offset: ${result.data.offset}`);
  assert(result.data.sortBy === 'name', `Unexpected sortBy: ${result.data.sortBy}`);
  assert(result.data.sortOrder === 'asc', `Unexpected sortOrder: ${result.data.sortOrder}`);
  assert(result.data.role === 'admin', `Unexpected role: ${result.data.role}`);
  assert(result.data.search === 'ricky', `Unexpected search: ${result.data.search}`);
});

Deno.test('searchParamsToInput preserves first and repeated query parameter values', () => {
  const input = searchParamsToInput(
    new URLSearchParams('page=2&tag=alpha&tag=beta&sortBy=duration'),
  );

  assert(input.page === '2', `Unexpected page value: ${String(input.page)}`);
  assert(Array.isArray(input.tag), 'Expected repeated params to stay as arrays');
  assert(input.tag[0] === 'alpha', `Unexpected first tag: ${String(input.tag[0])}`);
  assert(input.tag[1] === 'beta', `Unexpected second tag: ${String(input.tag[1])}`);
  assert(input.sortBy === 'duration', `Unexpected sortBy value: ${String(input.sortBy)}`);
});

Deno.test('definePage layer defer props include merged partial params and freshness settings', async () => {
  let capturedElement: unknown;

  const route = definePage<{ requestId: string }>()
    .withSearchParams(z.object({
      page: z.coerce.number().int().min(1).default(2),
    }))
    .withLayer('panel', () => <div />, {
      loader: () => ({ data: { label: 'cached' }, cachedAt: Date.now() }),
      partial: '/partials/dashboard/users/panel',
      params: () => ({ tab: 'activity' }),
      staleTime: 30_000,
      staleReloadMode: 'background',
    })
    .withLayout((slots) => {
      capturedElement = slots.panel();
      return <main />;
    })
    .build();

  await route.page(
    createRequestContext({ url: new URL('http://localhost/dashboard/users?page=2') }),
  );

  const deferElement = capturedElement as { props?: Record<string, unknown> };
  assert(!!deferElement?.props, 'Expected panel slot to render a DeferPage element');
  assert(
    deferElement.props.partial === '/partials/dashboard/users/panel',
    `Unexpected partial path: ${String(deferElement.props.partial)}`,
  );
  assert(deferElement.props.name === 'panel', 'Expected layer id to be the default partial name');
  assert(deferElement.props.staleTime === 30_000, 'Expected staleTime to flow into DeferPage');
  assert(
    deferElement.props.staleStrategy === 'server-prewarm',
    `Unexpected stale strategy: ${String(deferElement.props.staleStrategy)}`,
  );

  const partialSearchParams = new URLSearchParams(
    String(deferElement.props.partialSearchParams ?? ''),
  );
  assert(
    partialSearchParams.get('page') === '2',
    'Expected existing search params to be preserved',
  );
  assert(partialSearchParams.get('tab') === 'activity', 'Expected layer params to be appended');
});

Deno.test('definePage defer layers allow partialName to differ from the layer id', async () => {
  let capturedElement: unknown;

  const route = definePage<{ requestId: string }>()
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withLayer('header', () => <div />, {
      loader: () => ({ item: { id: '1' } }),
      partial: ({ path }) => `/partials/dashboard/users/${path.id}/header`,
      partialName: 'users-header',
    })
    .withLayout((slots) => {
      capturedElement = slots.header();
      return <main />;
    })
    .build();

  await route.page(createRequestContext({ params: { id: '1' } }));

  const deferElement = capturedElement as { props?: Record<string, unknown> };
  assert(!!deferElement?.props, 'Expected header slot to render a DeferPage element');
  assert(
    deferElement.props.name === 'users-header',
    `Unexpected partial name: ${String(deferElement.props.name)}`,
  );
});

Deno.test('definePage blocking stale mode hides stale cached payloads behind the fallback', async () => {
  let capturedElement: unknown;

  const route = definePage<{ requestId: string }>()
    .withLayer('panel', () => <div />, {
      loader: () => ({ data: { label: 'stale' }, cachedAt: Date.now() - 5_000 }),
      partial: '/partials/dashboard/users/panel',
      fallback: <p>Loading…</p>,
      staleTime: 1,
      staleReloadMode: 'blocking',
    })
    .withLayout((slots) => {
      capturedElement = slots.panel();
      return <main />;
    })
    .build();

  await route.page(createRequestContext());

  const deferElement = capturedElement as { props?: Record<string, unknown> };
  assert(!!deferElement?.props, 'Expected panel slot to render a DeferPage element');
  assert(
    deferElement.props.component === undefined,
    'Expected blocking stale mode to suppress the stale cached component',
  );
  assert(
    deferElement.props.cachedAt === undefined,
    'Expected blocking stale mode to drop stale cache metadata',
  );
});

Deno.test('definePage accepts telemetry configuration without breaking execution', async () => {
  let loaderRuns = 0;

  const route = definePage<{ requestId: string }>()
    .withTelemetry({ enabled: true, spanName: 'custom.page.render' })
    .withResource('settings', () => ({ theme: 'dark' }))
    .withLayer('panel', () => <div />, () => {
      loaderRuns += 1;
      return { ok: true };
    })
    .build();

  await route.page(createRequestContext());

  assert(loaderRuns === 1, `Unexpected loader run count: ${loaderRuns}`);
});

Deno.test('definePage withStreaming generates a chunked GET response without waiting on stream layers', async () => {
  let loaderRuns = 0;

  const route = definePage<{ requestId: string }>()
    .withStreaming()
    .withLayer('panel', (props: { value: string }) => <div>{props.value}</div>, {
      delivery: 'stream',
      fallback: <p>Loading panel…</p>,
      loader: async () => {
        loaderRuns += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return { value: 'ready' };
      },
    })
    .withLayout((slots) => <main>{slots.panel()}</main>)
    .build();

  assert(route.handler?.GET, 'Expected GET handler for streaming pages');

  const response = await route.handler.GET(createRequestContext());

  assert(response instanceof Response, 'Expected streaming GET handler to return a Response');
  assert(
    response.headers.get('Transfer-Encoding') === 'chunked',
    'Expected streaming response headers to be applied',
  );
  assert(loaderRuns === 1, `Expected stream layer loader to run once, got ${loaderRuns}`);
  await new Promise((resolve) => setTimeout(resolve, 30));
});
