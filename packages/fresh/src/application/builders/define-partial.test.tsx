import { Partial } from 'fresh/runtime';
import type { ErrorPrimitives } from '../../diagnostics/error/ErrorDisplay.tsx';
import { ErrorDisplay } from '../../diagnostics/error/ErrorDisplay.tsx';
import { definePartial, defineStatsPartial, PARTIAL_ROUTE_CONFIG } from './define-partial.tsx';

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
