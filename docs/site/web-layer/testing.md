---
layout: layouts/base.vto
title: Testing Fresh pages
templateEngine: [vento, md]
order: 15
---

# Testing Fresh pages

This page shows how to unit-test Fresh routes, loaders, layouts, and defer regions with
`@netscript/fresh/testing`, without an HTTP server. The fixtures build the same context shape your
route code reads at runtime, so a test calls your loader directly and inspects the result.

## What the testing surface provides

The export has two factories. Each takes a plain options object, so a test sets only the fields it
needs:

- `createMockRouteContext()` returns a `MockRouteContext` with the request URL, route params, parsed
  path and search values, layer data, named resources, and an abort signal: everything a loader or
  layout reads from its context.
- `createMockDeferPolicy()` returns a defer policy for defer-region helpers, so tests of deferred or
  streaming partials can pin freshness and prewarm behavior.

## Testing a route loader

`createMockRouteContext()` accepts `MockRouteContextOptions`. Every field is optional: `url`,
`params`, `state`, parsed `path` and `search` values, `routePattern`, named `resources`, `req`, and
`signal`. The returned context exposes them as readonly properties, plus a `resource(key)` method
for one named resource and a `nav` fixture with `makeHref()`.

```ts
import { assertEquals } from "@std/assert";
import { createMockRouteContext } from "@netscript/fresh/testing";

// The loader under test reads params and a named resource from its context.
const loadDashboard = (ctx: {
  path: { id: string };
  resource: (key: "metrics") => { read: () => number };
}) => ({
  id: ctx.path.id,
  total: ctx.resource("metrics").read(),
});

Deno.test("dashboard loader reads the path id and metrics resource", () => {
  const ctx = createMockRouteContext<
    Record<string, never>,
    { metrics: { read: () => number } },
    { id: string }
  >({
    url: "https://example.com/dashboards/42",
    routePattern: "/dashboards/:id",
    path: { id: "42" },
    resources: { metrics: { read: () => 128 } },
  });

  const result = loadDashboard(ctx);

  assertEquals(result.id, "42");
  assertEquals(result.total, 128);
  assertEquals(ctx.resource("metrics").read(), 128);
});
```

To assert on cancellation, pass your own `signal` in the options and observe it on the returned
context. [`MockRouteContext` properties](#mockroutecontext-properties) lists every property type.

## Testing a bound route contract

A [route contract](/web-layer/route/) parses a route's path and search params, so test its
`parsePath`/`parseSearch` and the non-throwing `safeParsePath`/`safeParseSearch` directly. No
context fixture is needed: bind the contract to a pattern, then assert on what it parses and what it
rejects.

```ts
import { assert, assertEquals } from "@std/assert";
import {
  defineRouteContract,
  enumPathParamSchema,
  paginationSearchSchema,
} from "@netscript/fresh/route";

const ordersContract = defineRouteContract({
  pathSchema: enumPathParamSchema("status", ["open", "closed"]),
  searchSchema: paginationSearchSchema({ defaultLimit: 25 }),
});
const ordersRoute = ordersContract.bind("/orders/[status]");

Deno.test("orders route parses pagination and derives offset", () => {
  const search = ordersRoute.parseSearch(new URLSearchParams("page=3&limit=50"));
  assertEquals(search.page, 3);
  assertEquals(search.limit, 50);
  assertEquals(search.offset, 100); // (page - 1) * limit
});

Deno.test("orders route rejects an out-of-enum status", () => {
  const ok = ordersRoute.safeParsePath({ status: "open" });
  assert(ok.success);
  assertEquals(ok.data.status, "open");

  const bad = ordersRoute.safeParsePath({ status: "archived" });
  assertEquals(bad.success, false); // not in the ["open","closed"] enum
});
```

`safeParsePath`/`safeParseSearch` return a `SchemaParseResult`: `{ success: true, data }` or
`{ success: false, error? }`. A test can assert both the happy path and the rejection without
`try`/`catch`. The throwing `parsePath`/`parseSearch` suit tests that expect valid input.

## Testing layouts

A layout reads `layerData` from its context, a `Record<string, unknown>` with the data the layout
receives. Build a fixture and pass the context to the layout under test.

```ts
import { createMockRouteContext } from "@netscript/fresh/testing";

const ctx = createMockRouteContext({
  url: "https://example.com/reports",
  routePattern: "/reports",
});

// `ctx.layerData` is the Record<string, unknown> a layout reads.
const layerData = ctx.layerData;
```

## Defer policy fixtures

`createMockDeferPolicy()` accepts a `MockDeferPolicyProfile` name (`"balanced"`,
`"aggressive-first-paint"`, `"background-refresh"`, or `"low-bandwidth"`) or a
`MockDeferPolicyInput` object that starts from a `profile` and overrides individual fields. It
returns the resolved policy for defer-region helpers.
[`MockDeferPolicyInput` properties](#mockdeferpolicyinput-properties) lists the fields.

```ts
import { createMockDeferPolicy } from "@netscript/fresh/testing";

// Start from a named profile.
const balanced = createMockDeferPolicy("balanced");

// Or override individual fields on top of a profile.
const tuned = createMockDeferPolicy({
  profile: "background-refresh",
  staleTimeMs: 5_000,
  prewarmOnStale: true,
  skipClientWhenServerPrewarm: true,
});
```

## API summary

| Symbol | Kind | Description |
| --- | --- | --- |
| `createMockRouteContext()` | function | Create a minimal page context fixture for route, loader, and layout tests. |
| `createMockDeferPolicy()` | function | Create a defer policy fixture accepted by defer-region helpers. |
| `MockRouteContext` | interface | Mock route context returned by `createMockRouteContext()`. |
| `MockRouteContextOptions` | interface | Options used to construct a route context fixture. |
| `MockDeferPolicyInput` | interface | Mock defer policy override accepted by defer test fixtures. |
| `MockDeferPolicyProfile` | type | Named policy profile: `"balanced"`, `"aggressive-first-paint"`, `"background-refresh"`, `"low-bandwidth"`. |

### `MockRouteContext` properties

| Property | Type | Description |
| --- | --- | --- |
| `url` | `URL` | Request URL for the fixture. |
| `req` | `Request` | Raw request object for the fixture. |
| `params` | `Record<string, string \| undefined>` | Fresh route params for the fixture. |
| `state` | `TState` | Fresh state object for the fixture. |
| `signal` | `AbortSignal` | Request abort signal. |
| `path` | `TPath` | Parsed route path params. |
| `search` | `TSearch` | Parsed route search values. |
| `layerData` | `Record<string, unknown>` | Layer data available to layout tests. |
| `routePattern` | `string` | Route pattern represented by the fixture. |
| `nav` | `{ makeHref(): string }` | Minimal route navigation fixture. |
| `route` | `unknown` | Optional route reference for tests that need routed context. |
| `resources` | `TResources` | Named resources available to route loaders. |
| `resource(key)` | method | Return a named resource from the fixture. |

### `MockDeferPolicyInput` properties

| Property | Type | Description |
| --- | --- | --- |
| `profile` | `MockDeferPolicyProfile` | Named policy profile to start from. |
| `staleTimeMs` | `number` | Override for the freshness window in milliseconds. |
| `prewarmOnMiss` | `boolean` | Prewarm the partial when the cache is missing. |
| `prewarmOnStale` | `boolean` | Prewarm the partial when the cache is stale. |
| `clientRefreshOnFreshCache` | `boolean` | Allow client refresh even when server cache is fresh. |
| `skipClientWhenServerPrewarm` | `boolean` | Skip client refresh when the server is already prewarming. |

## Next steps

See how these policies drive partial freshness and prewarming at runtime in
[Deferred and streaming UI](/web-layer/defer-streaming-ui/). See also
[Routing and route contracts](/web-layer/route/) and
[Error handling and diagnostics](/web-layer/error/).
