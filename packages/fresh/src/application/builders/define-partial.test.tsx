import { Partial } from 'fresh/runtime';
import type { ErrorPrimitives } from '../../diagnostics/error/ErrorDisplay.tsx';
import { ErrorDisplay } from '../../diagnostics/error/ErrorDisplay.tsx';
import { PARTIAL_ROUTE_CONFIG } from './define-partial.tsx';
import { definePartial, defineStatsPartial } from './mod.ts';
import { definePage } from './define-page/mod.ts';
import {
  bindRoutePattern,
  createRouteReference,
  defineRouteContract,
  type RouteReference,
} from '../route/_internal/contract-runtime.ts';
import { z } from 'zod';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertVNode(value: unknown, message: string): asserts value is VNodeLike {
  assert(isRecord(value), message);
  assert('type' in value, `${message}: missing vnode type`);
  assert('props' in value, `${message}: missing vnode props`);
  assert(isRecord(value.props), `${message}: vnode props must be an object`);
}

function isVNodeLike(value: unknown): value is VNodeLike {
  return isRecord(value) && 'type' in value && 'props' in value && isRecord(value.props);
}

function asVNodeList(value: unknown): VNodeLike[] {
  if (Array.isArray(value)) {
    return value.filter(isVNodeLike);
  }

  if (isVNodeLike(value)) {
    return [value];
  }

  return [];
}

function findVNodeByType(root: VNodeLike, expectedType: unknown): VNodeLike | undefined {
  if (root.type === expectedType) {
    return root;
  }

  for (const child of asVNodeList(root.props.children)) {
    const match = findVNodeByType(child, expectedType);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return <div data-label={label}>{value}</div>;
}

function CustomError(props: ErrorPrimitives) {
  return <div data-error={props.errorMessage}>{props.errorCode ?? 'unknown'}</div>;
}

function createRequestContext(
  routePattern: string,
  params: Record<string, string | undefined>,
  search = '',
) {
  const pathname = routePattern
    .replace(/\[\.\.\.([^\]]+)\]/g, (_, key: string) => params[key] ?? '')
    .replace(/\[\[\.\.\.([^\]]+)\]\]/g, (_, key: string) => params[key] ?? '')
    .replace(/\[([^\]]+)\]/g, (_, key: string) => params[key] ?? '');
  const url = new URL(`http://localhost${pathname}${search}`);
  return {
    url,
    req: new Request(url),
    params,
    state: {},
    isPartial: true,
  };
}

Deno.test('definePartial returns partial config and renders success content', async () => {
  let receivedTraceId = '';

  const route = definePartial<{ label: string; value: string }, { traceId: string }>({
    name: 'demo-stats',
    loader: (ctx) => {
      receivedTraceId = ctx.traceId;
      return Promise.resolve({ label: 'Users', value: '42' });
    },
    component: StatsCard,
  });

  assert(
    route.config.skipAppWrapper === PARTIAL_ROUTE_CONFIG.skipAppWrapper,
    'Expected skipAppWrapper=true',
  );
  assert(
    route.config.skipInheritedLayouts === PARTIAL_ROUTE_CONFIG.skipInheritedLayouts,
    'Expected skipInheritedLayouts=true',
  );
  assert(
    route.default === route.page,
    'Expected default alias to point at the partial page renderer',
  );

  const element = await route.default({ traceId: 'trace-123' });
  assert(receivedTraceId === 'trace-123', 'Expected loader to receive the route context');

  assertVNode(element, 'Expected a partial vnode');
  assert(element.type === Partial, 'Expected root vnode to be Fresh Partial');
  assert(element.props.name === 'demo-stats', 'Expected Partial name to match the route name');

  const child = findVNodeByType(element, StatsCard);
  assert(child, 'Expected content vnode to use the provided component');
  assert(child.type === StatsCard, 'Expected content vnode to use the provided component');
  assert(child.props.label === 'Users', 'Expected success props to be forwarded to the component');
  assert(child.props.value === '42', 'Expected success props to be forwarded to the component');
});

Deno.test('definePartial route option exposes parsed path and search to loaders and handlers', async () => {
  const generatedRoute = bindRoutePattern(
    defineRouteContract({
      pathSchema: z.object({ id: z.string().min(1) }),
      searchSchema: z.object({
        page: z.coerce.number().int().min(1).default(1),
      }),
    }),
    '/orders/[id]',
  );
  const seen: Array<string> = [];
  const partial = definePartial({
    name: 'order-summary',
    route: generatedRoute,
    loader: async (ctx) => {
      seen.push(`loader:${ctx.path.id}:${ctx.search.page}`);
      return await Promise.resolve({ label: ctx.path.id, value: String(ctx.search.page) });
    },
    handler: {
      POST: (ctx) => {
        seen.push(`handler:${ctx.path.id}:${ctx.search.page}`);
        return new Response(null, { status: 204 });
      },
    },
    component: StatsCard,
  });
  const ctx = createRequestContext('/orders/[id]', { id: 'order-42' }, '?page=3');

  await partial.page(ctx);
  const response = await partial.handler?.POST?.(ctx);

  assert(seen.includes('loader:order-42:3'), 'Expected routed loader path/search context');
  assert(seen.includes('handler:order-42:3'), 'Expected routed handler path/search context');
  assert(response instanceof Response && response.status === 204, 'Expected handler passthrough');
});

Deno.test('definePartial route binding matches definePage across generated path matrices', async () => {
  async function assertParity<TPath extends object, TSearch extends object>(
    generatedRoute: RouteReference<TPath, TSearch>,
    params: Record<string, string | undefined>,
  ): Promise<void> {
    let pagePath = '';
    let partialPath = '';
    const page = definePage()
      .withRoute(generatedRoute)
      .withResource('capture', (ctx) => {
        pagePath = JSON.stringify(ctx.path);
        return null;
      })
      .build();
    const partial = definePartial({
      name: 'matrix',
      route: generatedRoute,
      loader: async (ctx) => {
        partialPath = JSON.stringify(ctx.path);
        return await Promise.resolve({ label: 'path', value: partialPath });
      },
      component: StatsCard,
    });
    const ctx = createRequestContext(generatedRoute.routePattern, params);

    await page.page(ctx);
    await partial.page(ctx);

    assert(
      partialPath === pagePath,
      `Expected partial/page parity for ${generatedRoute.routePattern}: ${partialPath} !== ${pagePath}`,
    );
  }

  await assertParity(createRouteReference('/orders/[id]'), { id: 'order-7' });
  await assertParity(createRouteReference('/files/[...segments]'), { segments: 'one/two' });
  await assertParity(createRouteReference('/docs/[[...slug]]'), { slug: 'guides/start' });
  await assertParity(createRouteReference('/docs/[[...slug]]'), {});
});

Deno.test('definePartial route binding uses shared 404 and 400 invalid-state responses', async () => {
  const dynamicPartial = definePartial({
    name: 'dynamic-invalid',
    route: createRouteReference('/orders/[id]'),
    loader: async () => await Promise.resolve({ label: 'unused', value: 'unused' }),
    component: StatsCard,
  });
  const searchPartial = definePartial({
    name: 'search-invalid',
    route: bindRoutePattern(
      defineRouteContract({ searchSchema: z.object({ page: z.coerce.number().int().min(1) }) }),
      '/orders',
    ),
    loader: async () => await Promise.resolve({ label: 'unused', value: 'unused' }),
    component: StatsCard,
  });

  for (
    const [partial, ctx, expectedStatus] of [
      [dynamicPartial, createRequestContext('/orders/[id]', {}), 404],
      [searchPartial, createRequestContext('/orders', {}, '?page=bad'), 400],
    ] as const
  ) {
    let thrown: unknown;
    try {
      await partial.page(ctx);
    } catch (error: unknown) {
      thrown = error;
    }
    assert(thrown instanceof Response, 'Expected invalid partial route state to throw a Response');
    assert(thrown.status === expectedStatus, `Unexpected invalid partial status: ${thrown.status}`);
  }
});

Deno.test('definePartial rejects an incomplete route reference with the page builder error', () => {
  const malformedRoute = createRouteReference('/orders/[id]');
  Reflect.deleteProperty(malformedRoute, 'safeParsePath');

  let thrown: unknown;
  try {
    definePartial({
      name: 'malformed-route',
      route: malformedRoute,
      loader: async () => await Promise.resolve({ label: 'unused', value: 'unused' }),
      component: StatsCard,
    });
  } catch (error: unknown) {
    thrown = error;
  }

  assert(thrown instanceof TypeError, 'Expected an incomplete route reference to throw TypeError');
  assert(
    thrown.message ===
      'definePage().withRoute(...) requires a complete route reference with navigation and parsers.',
    `Unexpected incomplete route error: ${thrown.message}`,
  );
});

function assertPartialRouteMutationInference(): void {
  type IsNever<T> = [T] extends [never] ? true : false;
  type Expect<T extends true> = T;

  const original = createRouteReference('/projects/[project]');
  type OriginalPath = NonNullable<typeof original.$types>['path'];
  const originalHasNoChannel: Expect<IsNever<OriginalPath['channel']>> = true;
  definePartial({
    name: 'original',
    route: original,
    loader: async (ctx) => {
      const project: string = ctx.path.project;
      void originalHasNoChannel;
      return await Promise.resolve({ label: project, value: project });
    },
    component: StatsCard,
  });

  const mutated = createRouteReference('/projects/[project]/channels/[channel]');
  type MutatedPath = NonNullable<typeof mutated.$types>['path'];
  const mutatedHasChannel: Expect<IsNever<MutatedPath['channel']> extends false ? true : false> =
    true;
  definePartial({
    name: 'mutated',
    route: mutated,
    loader: async (ctx) => {
      const project: string = ctx.path.project;
      const channel: string = ctx.path.channel;
      void mutatedHasChannel;
      return await Promise.resolve({ label: project, value: channel });
    },
    component: StatsCard,
  });

  const renamed = createRouteReference('/projects/[projectId]');
  type RenamedPath = NonNullable<typeof renamed.$types>['path'];
  const renamedRemovedProject: Expect<IsNever<RenamedPath['project']>> = true;
  definePartial({
    name: 'renamed',
    route: renamed,
    loader: async (ctx) => {
      const projectId: string = ctx.path.projectId;
      void renamedRemovedProject;
      return await Promise.resolve({ label: projectId, value: projectId });
    },
    component: StatsCard,
  });

  const renamedConsumer = createRouteReference('/projects/[workspace]');
  definePartial({
    name: 'renamed-consumer',
    route: renamedConsumer,
    loader: async (ctx) => {
      const workspace: string = ctx.path.workspace;
      // @ts-expect-error The renamed route no longer declares a `project` path param.
      const project: string = ctx.path.project;
      return await Promise.resolve({ label: workspace, value: project });
    },
    component: StatsCard,
  });
}

void assertPartialRouteMutationInference;

Deno.test('definePartial wraps loader failures in ErrorDisplay inside the partial boundary', async () => {
  const route = definePartial<{ label: string; value: string }, Record<string, never>>({
    name: 'failing-stats',
    loader: () => {
      throw new Error('boom');
    },
    component: StatsCard,
    errorComponent: CustomError,
    errorTitle: 'Live stats unavailable',
  });

  const element = await route.page({});
  assertVNode(element, 'Expected a partial vnode');
  assert(element.type === Partial, 'Expected root vnode to be Fresh Partial');

  const child = findVNodeByType(element, ErrorDisplay);
  assert(child, 'Expected loader failures to render ErrorDisplay');
  assert(child.type === ErrorDisplay, 'Expected loader failures to render ErrorDisplay');
  assert(
    child.props.title === 'Live stats unavailable',
    'Expected custom error title to be forwarded',
  );
  assert(
    typeof child.props.children === 'function',
    'Expected custom error renderer to be passed through',
  );

  const error = child.props.error;
  assert(isRecord(error), 'Expected normalized error data to be present');
  assert(error.message === 'boom', 'Expected normalized error message to match the loader failure');
});

Deno.test('defineStatsPartial delegates to a query function and preserves handler passthrough', async () => {
  let queryCalls = 0;
  const handler = {
    POST() {
      return new Response(null, { status: 204 });
    },
  };

  const route = defineStatsPartial<
    { label: string; value: string },
    Record<string, never>,
    typeof handler
  >({
    name: 'stats-only',
    query: () => {
      queryCalls += 1;
      return Promise.resolve({ label: 'Orders', value: '18' });
    },
    component: StatsCard,
    handler,
  });

  assert(route.handler === handler, 'Expected handler passthrough to be preserved');

  const element = await route.page({});
  assert(queryCalls === 1, 'Expected the stats query to be invoked exactly once');
  assertVNode(element, 'Expected a partial vnode');

  const child = findVNodeByType(element, StatsCard);
  assert(child, 'Expected stats partial to render the provided component');
  assert(child.type === StatsCard, 'Expected stats partial to render the provided component');
  assert(
    child.props.label === 'Orders',
    'Expected stats query result to flow into component props',
  );
});
