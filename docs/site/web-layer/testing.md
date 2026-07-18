---
layout: layouts/base.vto
title: Testing Fresh pages
templateEngine: [vento, md]
order: 10
---

# Testing Fresh pages

The `@netscript/fresh` testing export provides fixtures for exercising routes,
loaders, and layouts without standing up an HTTP server. Reach for it when you
want to unit-test a page's loader logic, assert on the context a route receives,
or drive defer-region helpers with a controlled policy. The helpers build the
same shape your route code reads at runtime, so a test can call your loader
directly and inspect the result.

## What the testing surface provides

The export centers on two factory functions:

- `createMockRouteContext()` builds a minimal page context fixture for route,
  loader, and layout tests. It returns a `MockRouteContext` that mirrors the
  request URL, route params, parsed path and search values, layer data, named
  resources, and an abort signal — everything a loader or layout reads from its
  context.
- `createMockDeferPolicy()` builds a defer policy fixture accepted by
  defer-region helpers, so tests that cover deferred or streaming partials can
  pin freshness and prewarm behavior.

Both factories take a plain options object, so a test composes only the fields
it cares about and leaves the rest at their fixture defaults.

## Testing a route loader

`createMockRouteContext()` accepts `MockRouteContextOptions`. Every field is
optional: supply a `url`, `params`, `state`, parsed `path` and `search` values,
a `routePattern`, named `resources`, an explicit `req`, or a `signal`. The
returned `MockRouteContext` exposes those values as readonly properties, plus a
`resource(key)` method that returns a single named resource and a `nav` fixture
with `makeHref()`.

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

The fixture's `url` is a `URL`, `req` is a `Request`, `params` is a
`Record<string, string | undefined>`, and `signal` is an `AbortSignal`. Tests
that need to assert on cancellation can pass their own `signal` through the
options and observe it on the returned context.

## Testing a bound route contract

A [route contract](/web-layer/route/) owns the parsing of a route's path and
search params, so its `parsePath`/`parseSearch` (and the non-throwing
`safeParsePath`/`safeParseSearch`) are worth testing directly — no context fixture
needed. Bind the contract to a pattern, then assert on what it parses and what it
rejects. This is the typed alternative to testing hand-rolled `URLSearchParams`
juggling: the schema is the single source of truth, and the test pins it.

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

`safeParsePath`/`safeParseSearch` return a `SchemaParseResult` — a
`{ success: true, data }` success or a `{ success: false, error? }` failure — so a
test can assert both the happy path and the rejection without a `try`/`catch`. The
throwing `parsePath`/`parseSearch` variants suit tests that expect valid input.

## Testing layouts

Layout tests read `layerData` from the context, a `Record<string, unknown>`
carrying the data a layout receives. Construct a fixture with the layer data your
layout expects and pass the context to the layout under test.

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

`createMockDeferPolicy()` accepts either a `MockDeferPolicyProfile` name or a
`MockDeferPolicyInput` override object, and returns the resolved policy for use
with defer-region helpers. The profile names are `"balanced"`,
`"aggressive-first-paint"`, `"background-refresh"`, and `"low-bandwidth"`. The
`MockDeferPolicyInput` form lets a test start from a named `profile` and then
override individual fields: `staleTimeMs` for the freshness window,
`prewarmOnMiss` and `prewarmOnStale` for cache-prewarm behavior, and
`clientRefreshOnFreshCache` and `skipClientWhenServerPrewarm` for client refresh
behavior.

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

{{ comp callout { type: "note" } }}
The defer policy fixture pairs with the deferred and streaming UI surface. See
[Deferred and streaming UI](/web-layer/defer-streaming-ui/) for how policies
drive partial freshness and prewarming at runtime.
{{ /comp }}

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

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "Routing and route contracts", body: "The route context your loaders read at runtime.", href: "/web-layer/route/" }, { title: "Data loading and the query cache", body: "Load data into a route from named resources.", href: "/web-layer/query/" }, { title: "Deferred and streaming UI", body: "The defer regions your policy fixtures drive.", href: "/web-layer/defer-streaming-ui/" } ] }) }}

- [The Fresh page model](/web-layer/server/)
- [Pages and the define-page builder](/web-layer/builders/)
- [Server-validated forms](/web-layer/form/)
- [Interactive islands](/web-layer/interactive/)
- [Error handling and diagnostics](/web-layer/error/)
- [Examples and sandbox](/web-layer/examples/)
- [Web Layer overview](/web-layer/)
- [Tutorial: Build a live dashboard](/tutorials/live-dashboard/)
