// Navigation seam tests split from ../define-page.test.tsx.
import {
  definePage,
  type DefinePageLayerContextBase,
  fallback,
  type InferDefinePageLayerData,
  type InferDefinePageLayerLoaderProps,
  type InferDefinePageLayerProps,
  type InferDefinePageLayoutContext,
  type InferDefinePageLayoutProps,
  type InferDefinePageLayoutSlots,
  type InferDefinePagePath,
  type InferDefinePageResource,
  type InferDefinePageResources,
  type InferDefinePageSearch,
  type InferDefinePageState,
  type InferDefinePageTypes,
  paginationSearchSchema,
  searchParamsToInput,
  usePagePath,
  usePageRoute,
  usePageSearch,
} from './mod.ts';
import { CSRF_COOKIE_NAME } from '../../form/mod.ts';
import type { RuntimeFormState } from '../../form/types.ts';
import type { FormSubmissionResult } from '../../form/types.ts';
import {
  bindRoutePattern,
  defineRouteContract,
  enumPathParamSchema,
  type InferRoutePath,
  type InferRouteSearch,
  useCurrentPath,
  useCurrentRoute,
  useCurrentSearch,
} from '../../route/contract.ts';
import { render as renderToString } from 'preact-render-to-string';
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

Deno.test('definePage generated GET handler preserves routePattern for current-route hooks', async () => {
  const bound = bindRoutePattern(
    defineRouteContract({
      pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
      searchSchema: paginationSearchSchema({
        defaultLimit: 3,
        defaultSort: 'freshness',
        defaultOrder: 'desc',
      }),
    }),
    '/dashboard/framework/wi-09/[section]',
  );

  function RouteSnapshot() {
    const current = useCurrentRoute(bound);
    return <p>{`${current.path.section}:${current.search.page}:${current.search.sortBy}`}</p>;
  }

  const route = definePage<{ requestId: string }>()
    .withPathParams(bound.pathSchema)
    .withSearchParams(bound.searchSchema)
    .withLayout(() => <RouteSnapshot />)
    .withHeader('Cache-Control', 'private, no-store')
    .withStatus(200)
    .build({ routePattern: bound.routePattern });

  assert(route.handler?.GET, 'Expected generated GET handler');

  const response = await route.handler.GET({
    ...createRequestContext({
      params: { section: 'navigation' },
      url: new URL(
        'http://localhost/dashboard/framework/wi-09/navigation?page=2&limit=2&sortBy=duration&sortOrder=asc',
      ),
    }),
    render(body: unknown, init?: ResponseInit) {
      return new Response(renderToString(body as Parameters<typeof renderToString>[0]), init);
    },
  });

  assert(response instanceof Response, 'Expected GET handler to return a Response');
  assert(response.status === 200, `Unexpected status: ${response.status}`);
  const html = await response.text();
  assert(html.includes('navigation:2:duration'), `Unexpected rendered html: ${html}`);
});

Deno.test('definePage page hooks expose route, resources, layer data, and slots without prop threading', async () => {
  let summarySnapshot = '';
  let layoutSnapshot = '';
  let slotSnapshot = '';

  function SummaryPanel() {
    const summary = pageHooks.useRequiredLayer('summary');
    const profile = pageHooks.useResource('profile');
    summarySnapshot = `${profile.id}:${summary.currentId}:${summary.currentPage}`;

    return <section>{summary.profileId}</section>;
  }

  function SummaryLayout() {
    const route = pageHooks.useRoute();
    const slots = pageHooks.useSlots();
    const ctx = pageHooks.useContext();
    slotSnapshot = String(slots.summary.data?.currentPage ?? 'missing');
    layoutSnapshot = `${route.path.id}:${route.search.page}:${ctx.state.requestId}`;

    return <main>{slots.summary()}</main>;
  }

  const routeBuilder = definePage<{ requestId: string }>()
    .withResource('profile', () => ({ id: 'user-1', role: 'admin' as const }))
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({ page: z.coerce.number().int().min(1).default(1) }))
    .withLayer('summary', SummaryPanel, ({ resource, path, search }) => ({
      profileId: resource('profile').id,
      currentId: path.id,
      currentPage: search.page,
    }))
    .withLayout(() => <SummaryLayout />);

  const route = routeBuilder.build({ routePattern: '/dashboard/users/[id]' });
  const pageHooks = route.hooks;

  const element = await route.page(
    createRequestContext({
      params: { id: 'user-42' },
      url: new URL('http://localhost/dashboard/users/user-42?page=2'),
    }),
  );
  const html = renderToString(element);

  assert(summarySnapshot === 'user-1:user-42:2', `Unexpected summary snapshot: ${summarySnapshot}`);
  assert(layoutSnapshot === 'user-42:2:req-1', `Unexpected layout snapshot: ${layoutSnapshot}`);
  assert(slotSnapshot === '2', `Unexpected slot snapshot: ${slotSnapshot}`);
  assert(html.includes('<section>user-1</section>'), `Unexpected rendered html: ${html}`);
});

Deno.test('definePage routed definitions expose default page alias and prebound hooks', async () => {
  let snapshot = '';

  function SummaryPanel() {
    const currentRoute = route.hooks.useRoute();
    const profile = route.hooks.useResource('profile');
    snapshot = `${profile.id}:${currentRoute.path.id}:${currentRoute.search.page}`;
    return <section>{snapshot}</section>;
  }

  const route = definePage<{ requestId: string }>()
    .withResource('profile', () => ({ id: 'user-1' }))
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({ page: z.coerce.number().int().min(1).default(1) }))
    .withLayer('summary', SummaryPanel, () => ({}))
    .withLayout((slots) => <main>{slots.summary()}</main>)
    .build({ routePattern: '/dashboard/users/[id]' });

  const element = await route.default(
    createRequestContext({
      params: { id: 'user-42' },
      url: new URL('http://localhost/dashboard/users/user-42?page=2'),
    }),
  );
  const html = renderToString(element);

  assert(route.default === route.page, 'Expected default alias to point at the page renderer');
  assert(snapshot === 'user-1:user-42:2', `Unexpected hook snapshot: ${snapshot}`);
  assert(html.includes('<section>user-1:user-42:2</section>'), `Unexpected rendered html: ${html}`);
});

Deno.test('useCurrentRoute/useCurrentPath/useCurrentSearch expose typed route state during render', async () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });
  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');
  const snapshots: string[] = [];

  function RouteSnapshot() {
    const current = useCurrentRoute(bound);
    const path = useCurrentPath(bound);
    const search = useCurrentSearch(bound);
    const typedPath: InferRoutePath<typeof bound> = path;
    const typedSearch: InferRouteSearch<typeof bound> = search;
    const snapshot =
      `${current.path.section}:${typedPath.section}:${current.search.page}:${typedSearch.sortBy}`;

    snapshots.push(snapshot);

    return <p>{snapshot}</p>;
  }

  const route = definePage<{ requestId: string }>()
    .withPathParams(bound.pathSchema)
    .withSearchParams(bound.searchSchema)
    .withLayout(() => <RouteSnapshot />)
    .build({ routePattern: bound.routePattern });

  const element = await route.page(
    createRequestContext({
      params: { section: 'navigation' },
      url: new URL(
        'http://localhost/dashboard/framework/wi-09/navigation?page=2&limit=2&sortBy=duration&sortOrder=asc',
      ),
    }),
  );
  const html = renderToString(element);

  assert(
    snapshots[0] === 'navigation:navigation:2:duration',
    `Unexpected route snapshot: ${snapshots[0] ?? '(missing)'}`,
  );
  assert(html.includes('navigation:navigation:2:duration'), `Unexpected rendered html: ${html}`);
});

Deno.test('usePageRoute/usePagePath/usePageSearch infer from the built route type', async () => {
  const baseBuilder = definePage<{ requestId: string }>()
    .withPathParams(z.object({ section: z.enum(['overview', 'navigation', 'mutation']) }))
    .withSearchParams(paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }));

  const builtRoute = baseBuilder.build({ routePattern: '/dashboard/framework/wi-09/[section]' });

  type BuiltRoute = typeof builtRoute;
  const snapshots: string[] = [];

  function RouteSnapshot() {
    const currentRoute = usePageRoute<BuiltRoute>();
    const currentPath = usePagePath<BuiltRoute>();
    const currentSearch = usePageSearch<BuiltRoute>();
    const typedPath: InferDefinePagePath<BuiltRoute> = currentPath;
    const typedSearch: InferDefinePageSearch<BuiltRoute> = currentSearch;
    const generatedHref = currentRoute.nav.makeHref({
      path: { section: 'mutation' },
      search: { page: 1, sortBy: 'duration', sortOrder: 'asc' },
    });
    const preservedHref = currentRoute.getLinkProps({
      path: typedPath,
      preserveSearchParams: true,
      search: { page: 3 },
    }).href;
    const RouteLink = currentRoute.Link;
    const snapshot =
      `${currentRoute.path.section}:${typedPath.section}:${typedSearch.page}:${generatedHref}:${preservedHref}`;

    snapshots.push(snapshot);

    return (
      <div>
        <RouteLink path={{ section: 'overview' }} search={{ page: 1 }}>switch</RouteLink>
        <p>{snapshot}</p>
      </div>
    );
  }

  const route = baseBuilder.withLayout(() => <RouteSnapshot />).build({
    routePattern: '/dashboard/framework/wi-09/[section]',
  });

  const element = await route.page(
    createRequestContext({
      params: { section: 'navigation' },
      url: new URL(
        'http://localhost/dashboard/framework/wi-09/navigation?page=2&limit=2&sortBy=duration&sortOrder=asc',
      ),
    }),
  );
  const html = renderToString(element);

  assert(
    snapshots[0] ===
      'navigation:navigation:2:/dashboard/framework/wi-09/mutation?page=1&limit=3&sortBy=duration&sortOrder=asc&offset=0:/dashboard/framework/wi-09/navigation?page=3&limit=2&sortBy=duration&sortOrder=asc&offset=4',
    `Unexpected route snapshot: ${snapshots[0] ?? '(missing)'}`,
  );
  assert(
    html.includes(
      'href="/dashboard/framework/wi-09/overview?page=1&amp;limit=3&amp;sortBy=freshness&amp;sortOrder=desc&amp;offset=0"',
    ),
    `Unexpected rendered html: ${html}`,
  );
});

Deno.test('useCurrentRoute fails loudly when the bound route does not match the current render context', async () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });
  const expectedRoute = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');

  function MismatchedRouteSnapshot() {
    const current = useCurrentRoute(expectedRoute);
    return <p>{current.path.section}</p>;
  }

  const route = definePage<{ requestId: string }>()
    .withPathParams(expectedRoute.pathSchema)
    .withSearchParams(expectedRoute.searchSchema)
    .withLayout(() => <MismatchedRouteSnapshot />)
    .build({ routePattern: '/dashboard/framework/wi-10/[section]' });

  const element = await route.page(
    createRequestContext({
      params: { section: 'overview' },
      url: new URL('http://localhost/dashboard/framework/wi-10/overview?page=1'),
    }),
  );

  let message = '';
  try {
    renderToString(element);
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(
    message.includes('Current route context mismatch'),
    `Unexpected error message: ${message}`,
  );
});
