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
} from './define-page/mod.ts';
import {
  CSRF_COOKIE_NAME,
} from '../form/mod.ts';
import type { RuntimeFormState } from '../form/types.ts';
import type { FormSubmissionResult } from '../form/types.ts';
import {
  bindRoutePattern,
  defineRouteContract,
  enumPathParamSchema,
  type InferRoutePath,
  type InferRouteSearch,
  useCurrentPath,
  useCurrentRoute,
  useCurrentSearch,
} from '../route/contract.ts';
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

Deno.test('definePage withForm resolves initial layer props and sets the CSRF cookie on GET', async () => {
  type UserFormValues = { name?: string };

  function UserForm(_props: RuntimeFormState<UserFormValues>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<UserFormValues> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema: z.object({
        name: z.string().optional(),
      }),
      initial: () => ({ name: 'Ada' }),
      mutate: async () => ({ id: 1 }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  assert(route.handler?.GET, 'Expected generated GET handler for withForm page');

  const response = await route.handler.GET({
    ...createRequestContext(),
    render(body: unknown, init?: ResponseInit) {
      return new Response(renderToString(body as Parameters<typeof renderToString>[0]), init);
    },
  });

  assert(response instanceof Response, 'Expected GET handler to return a Response');
  assert(snapshot, 'Expected withForm layer data to be captured');
  assert(snapshot.action === '/dashboard/users', `Unexpected form action: ${snapshot.action}`);
  assert(snapshot.method === 'POST', `Unexpected form method: ${snapshot.method}`);
  assert(snapshot.values.name === 'Ada', `Unexpected initial form value: ${String(snapshot.values.name)}`);
  assert(snapshot.formProps.noValidate, 'Expected runtime form state to enable noValidate');
  assert(snapshot.fields.name.id === 'form-name', `Unexpected field id: ${snapshot.fields.name.id}`);
  assert(
    snapshot.fields.name.controlProps().defaultValue === 'Ada',
    'Expected field descriptor control props to expose the initial value',
  );
  assert(
    typeof snapshot.submissionId === 'string' && snapshot.submissionId.length > 0,
    'Expected submissionId to be generated',
  );
  assert(
    typeof snapshot.csrfInputProps.value === 'string' && snapshot.csrfInputProps.value.length > 0,
    'Expected csrf input props to be generated',
  );

  const setCookie = response.headers.get('set-cookie') ?? response.headers.get('Set-Cookie');
  assert(!!setCookie, 'Expected withForm GET handler to emit a CSRF cookie');
  assert(
    setCookie.includes(`${CSRF_COOKIE_NAME}=${snapshot.csrfInputProps.value}`),
    `Expected CSRF cookie to match snapshot token, received: ${String(setCookie)}`,
  );
});

Deno.test('definePage withForm returns invalid data when schema validation fails', async () => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
  });
  let mutateCalled = false;

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: async () => {
        mutateCalled = true;
        return { id: 1 };
      },
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'A');

  const result = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/users', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(!(result instanceof Response), 'Expected invalid form post to return data');
  assert(!mutateCalled, 'Expected mutate handler to be skipped on invalid input');

  const data = result.data as FormSubmissionResult<z.input<typeof schema>, { id: number }>;
  assert(data.status === 'invalid', `Expected invalid status, received: ${data.status}`);
  assert(
    data.fieldErrors.name?.[0] === 'Name must be at least 2 characters',
    `Unexpected field error: ${String(data.fieldErrors.name?.[0])}`,
  );
});

Deno.test('definePage withForm ignores malformed ctx.data that only partially resembles a form result', async () => {
  type UserFormValues = { name?: string };

  function UserForm(_props: RuntimeFormState<UserFormValues>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<UserFormValues> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema: z.object({
        name: z.string().optional(),
      }),
      initial: () => ({ name: 'Ada' }),
      mutate: async () => ({ id: 1 }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  await route.page(createRequestContext({
    data: {
      status: 'initial',
      submissionId: 'sub-pretender',
    },
  }));

  assert(snapshot, 'Expected withForm layer data to be captured');
  assert(snapshot.values.name === 'Ada', 'Expected malformed ctx.data to be ignored');
});

Deno.test('definePage withForm redirects after a successful submit', async () => {
  const schema = z.object({
    name: z.string().min(1),
  });
  let seenName: string | undefined;

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: async (input) => {
        seenName = input.name;
        return { id: 42 };
      },
      redirectTo: (result) => `/dashboard/users/${result.id}`,
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'Ada');

  const response = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/users', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(response instanceof Response, 'Expected redirecting submit to return a Response');
  assert(seenName === 'Ada', `Expected parsed input to reach mutate, received: ${String(seenName)}`);
  assert(response.status === 303, `Unexpected redirect status: ${response.status}`);
  assert(
    response.headers.get('location') === '/dashboard/users/42',
    `Unexpected redirect location: ${String(response.headers.get('location'))}`,
  );
  assert(
    response.headers.get('Cache-Control') === 'no-store, no-cache, must-revalidate',
    'Expected no-store cache control on redirect',
  );
  assert(response.headers.get('Pragma') === 'no-cache', 'Expected no-cache pragma on redirect');
});

Deno.test('definePage withForm logs the original mutate error before normalizing it', async () => {
  const schema = z.object({
    name: z.string().min(1),
  });

  function UserForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  const route = definePage<{ requestId: string }>()
    .withForm('form', UserForm, {
      schema,
      csrf: false,
      mutate: async () => {
        throw new Error('Mutation exploded');
      },
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for withForm page');

  const formData = new FormData();
  formData.set('name', 'Ada');

  const originalConsoleError = console.error;
  const errors: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    errors.push(args);
  };

  try {
    const result = await route.handler.POST(
      createRequestContext({
        req: new Request('http://localhost/dashboard/users', {
          method: 'POST',
          body: formData,
        }),
      }),
    );

    assert(!(result instanceof Response), 'Expected erroring submit to return normalized data');
    const data = result.data as FormSubmissionResult<z.input<typeof schema>, never>;
    assert(data.status === 'error', `Expected error status, received: ${data.status}`);
    assert(data.formErrors[0] === 'Mutation exploded', 'Expected normalized error message');
  } finally {
    console.error = originalConsoleError;
  }

  assert(errors.length === 1, `Expected a single logged error, received ${errors.length}`);
  assert(
    String(errors[0]?.[0]).includes('withForm submit failed'),
    `Unexpected log prefix: ${String(errors[0]?.[0])}`,
  );
  const context = errors[0]?.[1] as { error?: { message?: string } } | undefined;
  assert(
    context?.error?.message === 'Mutation exploded',
    `Expected original error to be logged, received: ${String(context?.error?.message)}`,
  );
});

Deno.test('definePage withForm applies collection intents before returning runtime state', async () => {
  const schema = z.object({
    items: z.array(
      z.object({
        label: z.string().min(1),
        quantity: z.string().regex(/^[1-9][0-9]*$/),
      }),
    ).min(1),
  });

  function CollectionForm(_props: RuntimeFormState<z.input<typeof schema>>) {
    return <form />;
  }

  let snapshot: RuntimeFormState<z.input<typeof schema>> | undefined;

  const route = definePage<{ requestId: string }>()
    .withForm('form', CollectionForm, {
      schema,
      csrf: false,
      initial: () => ({
        items: [{ label: 'Widget', quantity: '1' }],
      }),
      onIntent: (_intent, values) => ({ values }),
      mutate: async () => ({ ok: true }),
    })
    .withLayout((slots, { layerData }) => {
      snapshot = layerData.form;
      return <main>{slots.form()}</main>;
    })
    .build();

  assert(route.handler?.POST, 'Expected POST handler for collection-intent form');

  const formData = new FormData();
  formData.set('items[0].label', 'Widget');
  formData.set('items[0].quantity', '1');
  formData.set(
    '__intent__',
    JSON.stringify({
      type: 'collection:add',
      payload: {
        name: 'items',
        defaultValue: { label: '', quantity: '1' },
      },
    }),
  );

  const result = await route.handler.POST(
    createRequestContext({
      req: new Request('http://localhost/dashboard/framework/forms', {
        method: 'POST',
        body: formData,
      }),
    }),
  );

  assert(!(result instanceof Response), 'Expected collection intent to return data');
  const data = result.data as FormSubmissionResult<z.input<typeof schema>, { ok: boolean }>;
  assert(data.status === 'initial', `Expected initial intent reply, received: ${data.status}`);
  assert(data.values.items.length === 2, `Expected a second item after intent, received: ${data.values.items.length}`);
  assert(data.values.items[1]?.quantity === '1', 'Expected default quantity to be preserved');

  await route.page(createRequestContext({ data }));

  assert(snapshot, 'Expected runtime form state after the intent round-trip');
  assert(snapshot.fields.items.length === 2, `Expected 2 collection rows, received: ${snapshot.fields.items.length}`);
  assert(
    snapshot.fields.items.list[1]?.fields.quantity.controlProps({ type: 'number' }).defaultValue === '1',
    'Expected runtime field descriptors to expose the added row',
  );
});

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
    .withResource('settings', async () => ({ theme: 'dark' }))
    .withLayer('panel', () => <div />, async () => {
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
});
