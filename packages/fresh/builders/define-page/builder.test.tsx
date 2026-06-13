// Builder seam tests split from ../define-page.test.tsx.
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

Deno.test('definePage resolves resources in declaration order and renders layer output', async () => {
  function Panel(props: { value: number }) {
    return <span data-value={String(props.value)}>{props.value}</span>;
  }

  const snapshots: Array<{ one: string; two: string; layer: string }> = [];

  const route = definePage<{ requestId: string }>()
    .withResource('one', () => 1)
    .withResource('two', ({ resources }) => Number(resources.one) + 1)
    .withLayer('panel', Panel, ({ resource }) => ({ value: Number(resource('two')) }))
    .withLayout((slots, { resources, layerData }) => {
      snapshots.push({
        one: String(resources.one),
        two: String(resources.two),
        layer: String(layerData.panel?.value),
      });

      return <main>{slots.panel()}</main>;
    })
    .build();

  await route.page(createRequestContext());

  const capturedSnapshot = snapshots[0];

  if (!capturedSnapshot) {
    throw new Error('Expected layout to capture the resource snapshot');
  }

  assert(capturedSnapshot.one === '1', `Unexpected resource value: ${capturedSnapshot.one}`);
  assert(capturedSnapshot.two === '2', `Unexpected resource value: ${capturedSnapshot.two}`);
  assert(capturedSnapshot.layer === '2', `Unexpected layer data value: ${capturedSnapshot.layer}`);
});

Deno.test('definePage generates GET handler for headers and status', async () => {
  function HeaderPanel(props: { value: string }) {
    return <section>{props.value}</section>;
  }

  const route = definePage<{ requestId: string }>()
    .withLayer('panel', HeaderPanel, () => ({ value: 'ready' }))
    .withHeader('Cache-Control', 'private, no-store')
    .withHeader(({ layerData }) => ({ 'X-Panel': String(layerData.panel?.value ?? 'missing') }))
    .withStatus(202)
    .build();

  assert(route.handler?.GET, 'Expected generated GET handler');

  const response = await route.handler.GET({
    ...createRequestContext(),
    render(body: unknown, init?: ResponseInit) {
      return new Response(String((body as { type?: string }).type ?? 'page'), init);
    },
  });

  assert(response instanceof Response, 'Expected GET handler to return a Response');
  assert(response.status === 202, `Unexpected status: ${response.status}`);
  assert(
    response.headers.get('Cache-Control') === 'private, no-store',
    'Missing Cache-Control header',
  );
  assert(response.headers.get('X-Panel') === 'ready', 'Missing dynamic header');
});

Deno.test('definePage defaults to empty request state when no generic is provided', async () => {
  let seenPath = '';

  const route = definePage()
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withLayer('panel', () => <div />, ({ path }) => {
      seenPath = path.id;
      return {};
    })
    .build();

  await route.page({
    url: new URL('http://localhost/dashboard/users/abc'),
    req: new Request('http://localhost/dashboard/users/abc'),
    params: { id: 'abc' },
    state: {},
    isPartial: false,
  });

  assert(seenPath === 'abc', `Unexpected path value: ${seenPath}`);
});

Deno.test('definePage validates path params before executing the page', async () => {
  const route = definePage<{ requestId: string }>()
    .withPathParams({
      safeParse(input) {
        if (input.id) {
          return { success: true, data: { id: input.id } } as const;
        }

        return { success: false } as const;
      },
    })
    .withLayer('panel', () => <div />)
    .build();

  let thrown: unknown;
  try {
    await route.page(createRequestContext({ params: {} }));
  } catch (error: unknown) {
    thrown = error;
  }

  assert(thrown instanceof Response, 'Expected invalid path params to throw a Response');
  assert(thrown.status === 404, `Unexpected status: ${thrown.status}`);
});

Deno.test('definePage method handlers receive resolved resources', async () => {
  const route = definePage<{ requestId: string }>()
    .withResource('auth', () => ({ userId: 'user-1' }))
    .withHandler(
      'POST',
      ({ resource }) => ({ data: { userId: (resource('auth') as { userId: string }).userId } }),
    )
    .build();

  assert(route.handler?.POST, 'Expected POST handler');

  const result = await route.handler.POST(createRequestContext());
  assert(!(result instanceof Response), 'Expected POST handler to return data');
  assert(
    result.data && (result.data as { userId: string }).userId === 'user-1',
    'Unexpected handler data',
  );
});

Deno.test('definePage falls back to search schema defaults on soft search failures', async () => {
  const seenSearch: Array<{ page: number; preview: string }> = [];

  const route = definePage<{ requestId: string }>()
    .withSearchParams(z.object({
      page: z.coerce.number().int().min(1).optional().default(1),
      preview: fallback(z.enum(['true', 'false']), 'false'),
    }))
    .withLayer('panel', () => <div />, ({ search }) => {
      seenSearch.push({
        page: search.page,
        preview: search.preview,
      });

      return {};
    })
    .build();

  await route.page(
    createRequestContext({
      url: new URL('http://localhost/dashboard/users?page=oops&preview=bad'),
    }),
  );

  const snapshot = seenSearch[0];
  assert(!!snapshot, 'Expected search params to reach the loader');
  assert(snapshot.page === 1, `Unexpected fallback page: ${snapshot.page}`);
  assert(snapshot.preview === 'false', `Unexpected fallback preview: ${snapshot.preview}`);
});

Deno.test('definePage still returns 400 when search params have no defaults to fall back to', async () => {
  const route = definePage<{ requestId: string }>()
    .withSearchParams(z.object({
      preview: z.enum(['true', 'false']),
    }))
    .withLayer('panel', () => <div />)
    .build();

  let thrown: unknown;
  try {
    await route.page(
      createRequestContext({ url: new URL('http://localhost/dashboard/users?preview=bad') }),
    );
  } catch (error: unknown) {
    thrown = error;
  }

  assert(
    thrown instanceof Response,
    'Expected invalid non-defaultable search params to throw a Response',
  );
  assert(thrown.status === 400, `Unexpected status: ${thrown.status}`);
});

Deno.test('definePage build({ routePattern }) generates typed hrefs with validated params', () => {
  const route = definePage<{ requestId: string }>()
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({
      page: z.coerce.number().int().min(1).default(1),
      preview: fallback(z.enum(['true', 'false']), 'false'),
    }))
    .withLayer('panel', () => <div />)
    .build({ routePattern: '/dashboard/users/[id]' });

  const href = route.nav.makeHref({
    path: { id: 'user-42' },
    search: { page: 3 },
  });

  assert(
    href === '/dashboard/users/user-42?page=3&preview=false',
    `Unexpected href: ${href}`,
  );
  assert(!('RouteLink' in route.nav), 'Expected route.nav to expose only makeHref');
  assert(!('getLinkProps' in route.nav), 'Expected route.nav duplicate link helpers to be removed');
});

Deno.test('definePage build({ routePattern }) allows zero-arg makeHref for static routes', () => {
  const route = definePage<{ requestId: string }>()
    .withLayer('panel', () => <div />)
    .build({ routePattern: '/dashboard/users' });

  const href = route.nav.makeHref();

  assert(href === '/dashboard/users', `Unexpected static href: ${href}`);
});

Deno.test('InferDefinePage* helpers infer state from the builder $types surface', () => {
  const routeBuilder = definePage<{ requestId: string }>()
    .withResource('profile', () => ({ id: 'user-1' }))
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({ page: z.coerce.number().int().min(1).default(1) }))
    .withLayer('panel', () => <div />, ({ resource, path, search }) => ({
      profileId: resource('profile').id,
      currentId: path.id,
      currentPage: search.page,
    }));

  const typedState: InferDefinePageState<typeof routeBuilder> = { requestId: 'req-1' };
  const typedResources = {
    profile: { id: 'user-1' },
  } as InferDefinePageResources<typeof routeBuilder>;
  const typedPath: InferDefinePagePath<typeof routeBuilder> = { id: 'user-1' };
  const typedSearch: InferDefinePageSearch<typeof routeBuilder> = { page: 1 };
  const typedLayerData = {
    panel: { profileId: 'user-1', currentId: 'user-1', currentPage: 1 },
  } as InferDefinePageLayerData<typeof routeBuilder>;

  assert(
    typedState.requestId === 'req-1',
    'Expected inferred state helper to resolve request state',
  );
  assert(
    typedResources.profile.id === 'user-1',
    'Expected inferred resources helper to resolve resource types',
  );
  assert(typedPath.id === 'user-1', 'Expected inferred path helper to resolve path params');
  assert(typedSearch.page === 1, 'Expected inferred search helper to resolve search params');
  assert(
    typedLayerData.panel.currentPage === 1,
    'Expected inferred layer data helper to resolve layer props',
  );
});

Deno.test('InferDefinePage child-component helpers expose resource, layer loader, layer, and layout contracts', () => {
  const baseContract = definePage<{ requestId: string }>()
    .withResource('profile', () => ({ id: 'user-1', role: 'admin' as const }))
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({ page: z.coerce.number().int().min(1).default(1) }));

  type BaseContractTypes = InferDefinePageTypes<typeof baseContract>;

  const panelLoader = (
    { resource, path, search }: DefinePageLayerContextBase<BaseContractTypes>,
  ) => ({
    profileId: resource('profile').id,
    currentId: path.id,
    currentPage: search.page,
  });

  const panelContract = baseContract.withLayer(
    'panel',
    (_props: InferDefinePageLayerLoaderProps<typeof panelLoader>) => <div />,
    panelLoader,
  );

  const typedResource: InferDefinePageResource<typeof panelContract, 'profile'> = {
    id: 'user-1',
    role: 'admin',
  };
  const typedPanelProps: InferDefinePageLayerProps<typeof panelContract, 'panel'> = {
    profileId: typedResource.id,
    currentId: 'user-1',
    currentPage: 1,
  };
  const typedLayoutSlots = {
    panel: () => <div>{typedPanelProps.profileId}</div>,
  } satisfies InferDefinePageLayoutSlots<typeof panelContract>;
  const typedLayoutContext = {
    ...createRequestContext({ params: { id: 'user-1' } }),
    signal: new AbortController().signal,
    path: { id: 'user-1' },
    search: { page: 1 },
    resource: ((key: 'profile') => typedResource) as InferDefinePageLayoutContext<
      typeof panelContract
    >['resource'],
    resources: { profile: typedResource } as InferDefinePageResources<typeof panelContract>,
    layerData: { panel: typedPanelProps } as InferDefinePageLayoutContext<
      typeof panelContract
    >['layerData'],
  } as InferDefinePageLayoutContext<typeof panelContract>;
  const typedLayoutProps: InferDefinePageLayoutProps<typeof panelContract> = {
    slots: typedLayoutSlots,
    ctx: typedLayoutContext,
  };

  assert(typedResource.role === 'admin', 'Expected resource helper to expose resource contracts');
  assert(
    typedLayoutProps.ctx.layerData.panel?.currentPage === 1,
    'Expected layout helpers to expose inferred layer data and context',
  );
});

Deno.test('definePage builder createNav supports same-module typed navigation before build', async () => {
  const routePattern = '/dashboard/users/[id]';
  let capturedHref = '';

  const routeBuilder = definePage<{ requestId: string }>()
    .withPathParams(z.object({ id: z.string().min(1) }))
    .withSearchParams(z.object({
      page: z.coerce.number().int().min(1).default(1),
      preview: fallback(z.enum(['true', 'false']), 'false'),
    }))
    .withLayer('panel', () => <div />)
    .withLayout(() => {
      capturedHref = routeNav.makeHref({
        path: { id: 'from-layout' },
        search: { page: 2 },
      });

      return <main />;
    });

  const routeNav = routeBuilder.createNav(routePattern);
  const route = routeBuilder.build({ routePattern });

  const directHref = routeNav.makeHref({
    path: { id: 'user-42' },
    search: { page: 3 },
  });

  assert(
    directHref === '/dashboard/users/user-42?page=3&preview=false',
    `Unexpected builder nav href: ${directHref}`,
  );
  assert(!('RouteLink' in routeNav), 'Expected builder createNav() to expose only makeHref');
  assert(
    !('getLinkProps' in routeNav),
    'Expected builder createNav() duplicate link helpers to be removed',
  );

  await route.page(createRequestContext({ params: { id: 'abc' } }));

  assert(
    capturedHref === '/dashboard/users/from-layout?page=2&preview=false',
    `Unexpected layout nav href: ${capturedHref}`,
  );
});

Deno.test('definePage withRoute(route) supports implicit createNav and build()', async () => {
  let capturedHref = '';
  let handlerHref = '';

  const boundRoute = bindRoutePattern(
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

  const routeBuilder = definePage<{ requestId: string }>()
    .withRoute(boundRoute)
    .withLayer('panel', () => <div />)
    .withLayout((_slots, ctx) => {
      capturedHref = ctx.route.nav.makeHref({
        path: { section: 'navigation' },
        search: { page: 2 },
      });

      return <main />;
    })
    .withHandler('POST', async (ctx) => {
      handlerHref = ctx.route.nav.makeHref({
        path: { section: 'overview' },
        search: { page: ctx.search.page + 1 },
      });
      return new Response(null, { status: 204 });
    });

  const routeNav = routeBuilder.createNav();
  const route = routeBuilder.build();

  await route.default(
    createRequestContext({
      params: { section: 'mutation' },
      url: new URL(
        'http://localhost/dashboard/framework/wi-09/mutation?page=1&limit=3&sortBy=freshness&sortOrder=desc',
      ),
    }),
  );

  const explicitHref = route.nav.makeHref({ path: { section: 'overview' }, search: { page: 3 } });

  assert(
    explicitHref.startsWith('/dashboard/framework/wi-09/overview'),
    `Expected implicit route() to retain the bound route pattern: ${explicitHref}`,
  );
  assert(
    explicitHref.includes('page=3'),
    `Expected explicit href to preserve page search: ${explicitHref}`,
  );
  assert(
    capturedHref.startsWith('/dashboard/framework/wi-09/navigation'),
    `Unexpected implicit route nav href: ${capturedHref}`,
  );
  assert(
    capturedHref.includes('page=2'),
    `Expected implicit route nav to preserve page search: ${capturedHref}`,
  );

  const postResponse = await route.handler?.POST?.(
    createRequestContext({
      req: new Request('http://localhost/dashboard/framework/wi-09/mutation?page=4'),
      params: { section: 'mutation' },
      url: new URL('http://localhost/dashboard/framework/wi-09/mutation?page=4'),
    }),
  );

  assert(
    postResponse instanceof Response && postResponse.status === 204,
    'Expected POST handler response',
  );
  assert(
    handlerHref.startsWith('/dashboard/framework/wi-09/overview'),
    `Expected handler ctx.route nav href: ${handlerHref}`,
  );
  assert(
    handlerHref.includes('page=5'),
    `Expected handler href to use ctx.search.page: ${handlerHref}`,
  );
});
