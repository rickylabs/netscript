---
layout: layouts/base.vto
title: Deferred and streaming UI
templateEngine: [vento, md]
order: 6
---

# Deferred and streaming UI

A page often has one region that is slower than the rest — a dashboard panel that
aggregates data, a detail view that reads from cache, or a feed that updates as
events arrive. `@netscript/fresh` gives you two complementary tools for these
regions: **deferred rendering**, which paints a fallback immediately and fills the
region in once data is ready, and the **streams client SDK**, which keeps a region
reactive against durable streams over the wire. Reach for deferral when a region is
slow on the server; reach for streams when a region needs to stay live after the
first paint.

## Deferred rendering

Deferred rendering lets a page respond with stable content while a slower region
resolves separately. The `defer` surface ships two layers: a low-level
Suspense-style boundary (`Deferred`) for a single promise, and a higher-level page
wrapper (`DeferPage`) that coordinates a cached region, a fallback, and a refresh
policy.

### Deferring a single region

`Deferred` is a promise-prop consumer for RFC-style deferred data. It takes a
`promise`, an optional `fallback` shown while the promise is pending, an optional
`errorFallback` invoked when the promise rejects, and `children` — either renderable
content or a render function that turns the resolved value into content.

```tsx
import { Deferred } from "@netscript/fresh";

export function Panel({ slowData }: { slowData: Promise<readonly string[]> }) {
  return (
    <Deferred
      promise={slowData}
      fallback={<p>Loading…</p>}
      errorFallback={(error) => <p>Could not load: {error.message}</p>}
    >
      {(rows) => (
        <ul>
          {rows.map((row) => <li>{row}</li>)}
        </ul>
      )}
    </Deferred>
  );
}
```

The render function signature is captured by `DeferredRenderFunction<T>`, and both
the fallback and the resolved output are typed as `DeferredRenderable` — the set of
values Fresh accepts in a deferred slot.

{{ comp callout { type: "note" } }}
**Progressive delivery is staged.** In the current non-streaming Fresh runtime,
`Deferred` behaves like a Suspense-ready boundary and becomes fully progressive once
streaming delivery lands. Code written against it today keeps working as that
delivery path is enabled.
{{ /comp }}

### Deferring a page region with a policy

`DeferPage` renders a deferred region with optional server prewarm and telemetry
hooks. Where `Deferred` wraps a promise, `DeferPage` coordinates the full lifecycle
of a cached region: it renders `component` when cached data exists, `fallback` until
the region resolves, and uses a Fresh partial (`name`, `partial`, `action`) to
refresh the region on the client.

The props are described by `DeferPageProps`:

```tsx
import { DeferPage } from "@netscript/fresh";

export function OrdersRegion(
  { ctx, cachedOrders, cachedAt }: {
    ctx: { url: URL; req: Request; isPartial?: boolean };
    cachedOrders?: unknown;
    cachedAt?: number;
  },
) {
  return (
    <DeferPage
      name="orders"
      action="/orders"
      partial="/orders/partial"
      component={cachedOrders}
      fallback={<p>Loading orders…</p>}
      cachedAt={cachedAt}
      staleTime={30_000}
      policy={ { profile: "background-refresh" } }
      staleStrategy="server-prewarm"
      ctx={ctx}
    />
  );
}
```

The `policy` prop accepts either a named `DeferPagePolicyProfile` or a
`DeferPagePolicyInput` object. The `ctx` prop is a `DeferPageRequestContextLike` —
just the `url`, `req`, and optional `isPartial` fields `DeferPage` needs to detect
partial and prewarm rendering, so you do not have to pass your full app context type.

### Refresh policy

A policy controls when a deferred region revalidates. `DeferPolicyInput` exposes the
tunable knobs:

- `staleTimeMs` — freshness window before cached data is considered stale.
- `prewarmOnMiss` / `prewarmOnStale` — whether a cache miss or stale hit starts a
  server-side prewarm request.
- `clientRefreshOnFreshCache` — whether fresh cache hits still trigger a client
  refresh.
- `skipClientWhenServerPrewarm` — whether client refresh is skipped while a server
  prewarm is active (avoids duplicate requests).

Instead of setting every field, you can name a `DeferPolicyProfile`: `"balanced"`,
`"aggressive-first-paint"`, `"background-refresh"`, or `"low-bandwidth"`.
`resolveDeferPolicy` merges a profile, a stale override, and any legacy strategy into
a fully populated `DeferPolicyResolved` used by both the server and the island
renderers:

```ts
import { resolveDeferPolicy } from "@netscript/fresh";

const resolved = resolveDeferPolicy(
  { profile: "balanced" },
  30_000,
  "server-prewarm",
);
// resolved.staleTimeMs, resolved.prewarmOnStale, …
```

The package also ships conventional presets used by generated pages:
`DEFER_POLICY` (profiles keyed by `header` and `detail`), `DEFER_STALE_MS`
(stale windows for `crud` and `forceRefresh`), and `DETAIL_FORCE_REFRESH_POLICY`
(a detail-page policy that preserves immediate consistency after navigation).

The `staleStrategy` prop on `DeferPage` is a `LegacyStaleStrategy` — `"none"`
(the default; let the island decide) or `"server-prewarm"` (fire-and-forget server
revalidation when stale).

## Streaming UI with durable streams

The `@netscript/fresh/streams` subpath is the client SDK for end-to-end durable
streams. It connects a Preact island to the durable streams server and keeps
TanStack DB collections updating reactively as events arrive.

`createNetScriptStreamDB()` is the entry point: a generic, TanStack DB-backed
StreamDB factory that wraps `@durable-streams/state` with NetScript URL resolution.
It returns a `NetScriptStreamDB` whose `.collections` are typed TanStack DB
collections that update as events arrive from the server.

```ts
import {
  createNetScriptStreamDB,
  useLiveQuery,
} from "@netscript/fresh/streams";
import { myStreamSchema } from "../schemas.ts";

const db = createNetScriptStreamDB({
  streamPath: "/my-service/my-stream",
  schema: myStreamSchema,
});

// In a Preact island:
const { data: items } = useLiveQuery((q) =>
  q.from({ i: db.collections.myEntity })
);
```

### Factory options

`NetScriptStreamDBOptions` configures the stream database:

- `streamPath` — stream path relative to the streams server root
  (e.g. `/workers/executions`).
- `schema` — the `NetScriptStateSchema` for the durable stream database.
- `baseUrl` — optional override for the base stream server URL; defaults to the
  env-resolved `getStreamsUrl()`.
- `createStreamDB` — optional factory port for tests or alternate stream DB adapters.

The returned `NetScriptStreamDB` exposes `collections` plus optional `stop` and
`dispose` hooks for adapters that support tearing the connection down.

### Live queries in islands

Two hooks run a TanStack DB live query through the NetScript streams surface, both
working via `preact/compat` inside Fresh islands:

- `useLiveQuery` — run a live query and read its current result.
- `useLiveSuspenseQuery` — the suspense variant of the same query.

Both accept a query factory (`NetScriptLiveQueryFactory`) and optional `deps`, and
return a `NetScriptLiveQueryResult<TData>` with `data`, `status`, `error`, and a
`details` record carrying any additional upstream fields.

## API summary

### Deferred rendering (`@netscript/fresh`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `Deferred` | function | Promise-prop consumer for RFC-style deferred data; a Suspense-ready boundary. |
| `DeferredProps<T>` | interface | Props for `Deferred`: `promise`, `fallback`, `children`, `errorFallback`. |
| `DeferredRenderable` | type | Renderable content accepted by deferred Suspense slots. |
| `DeferredRenderFunction<T>` | type | Render function turning resolved deferred data into content. |
| `DeferPage` | function | Render a deferred region with optional server prewarm and telemetry hooks. |
| `DeferPageProps` | interface | Props for the `DeferPage` server wrapper. |
| `DeferPagePolicyInput` | interface | Policy overrides accepted by the page wrapper. |
| `DeferPagePolicyProfile` | type | Named page policy profiles. |
| `DeferPolicyInput` | interface | Policy overrides that tune when deferred regions refresh. |
| `DeferPolicyResolved` | interface | Fully resolved defer policy used by server and island renderers. |
| `DeferPolicyProfile` | type | `"balanced"` \| `"aggressive-first-paint"` \| `"background-refresh"` \| `"low-bandwidth"`. |
| `resolveDeferPolicy` | function | Resolve policy input, stale override, and legacy strategy into a complete policy. |
| `DEFER_POLICY` | const | Conventional defer policy profiles used by generated pages. |
| `DEFER_STALE_MS` | const | Conventional stale windows used by generated CRUD pages. |
| `DETAIL_FORCE_REFRESH_POLICY` | const | Detail-page policy preserving immediate consistency after navigation. |

### Streams client SDK (`@netscript/fresh/streams`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `createNetScriptStreamDB` | function | Create a NetScript-configured TanStack DB-backed StreamDB. |
| `NetScriptStreamDBOptions<TDef>` | interface | Options for `createNetScriptStreamDB`. |
| `NetScriptStreamDB<TDef>` | interface | Stream database handle with reactive `collections` plus optional `stop`/`dispose`. |
| `useLiveQuery` | function | Run a TanStack DB live query through the streams surface. |
| `useLiveSuspenseQuery` | function | Suspense variant of the live query. |
| `NetScriptLiveQueryResult<TData>` | interface | Result with `data`, `status`, `error`, and `details`. |
| `NetScriptLiveQueryFactory` | type | Function that builds a live query from the upstream query builder. |
| `NetScriptStateSchema<TDef>` | type | NetScript-owned state schema accepted by the factory. |

## Related

{{ comp.cardsGrid({ columns: 3, cards: [ { title: "The Fresh page model", body: "How a Fresh page is assembled on the server.", href: "/web-layer/server/" }, { title: "Data loading and the query cache", body: "Load data and read it from the query cache that deferred regions build on.", href: "/web-layer/query/" }, { title: "Interactive islands", body: "Hydrate islands where live-query hooks run.", href: "/web-layer/interactive/" } ] }) }}

For an end-to-end walkthrough that combines deferred regions and streaming updates,
follow the flagship tutorial: [Live dashboard](/tutorials/live-dashboard/).
