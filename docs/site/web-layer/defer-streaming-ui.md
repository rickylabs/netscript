---
layout: layouts/base.vto
title: Deferred and streaming UI
templateEngine: [vento, md]
order: 6
---

# Deferred and streaming UI

This page covers slow regions and live regions. `@netscript/fresh/defer` provides `Deferred`, a
Suspense boundary for one promise, and `DeferPage`, a cached region whose refresh behaviour comes
from a **named policy** instead of per-page conditionals. For regions that must stay live after they
settle, `@netscript/fresh/streams` keeps TanStack DB collections updated from a durable stream.

## Compared with bare Fresh

Fresh 2 gives you the transport: `<Suspense>` through `preact/compat` covers a pending promise, and
partial routes with `f-partial` / `f-client-nav` swap a named region without a navigation, the same
mechanism `DeferPage` uses. It does not decide *when* to refresh a cached region, so you write that
decision in each page:

```tsx
// islands/OrdersRefresh.tsx — bare Fresh
const hidden = { display: 'none' };

export default function OrdersRefresh({ cachedAt }: { cachedAt?: number }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cachedAt === undefined) return; // your rule for "no timestamp"
    if (Date.now() - cachedAt <= 30_000) return; // your stale window, typed nowhere
    formRef.current?.requestSubmit();
  }, [cachedAt]);

  return (
    <form
      ref={formRef}
      method='GET'
      action='/orders'
      f-partial='/partials/orders/list'
      f-client-nav
      style={hidden}
      aria-hidden='true'
    />
  );
}
```

```ts
// routes/orders.tsx — bare Fresh, the server half of the same decision
const entry = await readOrdersCache();
const isStale = entry && Date.now() - entry.cachedAt > 30_000;
if (isStale) void fetch(new URL('/partials/orders/list', url.origin)); // fire and forget
```

Three costs sit above the swap:

- **The stale window is a magic number in two files.** The server's `30_000` and the island's
  `30_000` must agree, and nothing checks that they do.
- **The server prewarm and the client submission do not know about each other.** Both fire on a
  stale hit, so a stale region costs two requests unless you pass a flag from the server render into
  the island.
- **The behaviour has no name.** "Cached first paint, refresh in the background" and "cheap on
  mobile" become a new set of `if`s per page, so similar regions drift apart.

## `Deferred`: one promise, one boundary

`Deferred` takes a `promise`, a `fallback` while it is pending, an optional `errorFallback`, and a
**render-function child**:

```tsx
import { Deferred } from '@netscript/fresh/defer';

export function Panel({ slowRows }: { slowRows: Promise<readonly string[]> }) {
  return (
    <Deferred
      promise={slowRows}
      fallback={<p>Loading…</p>}
      errorFallback={(error) => <p>Could not load: {error.message}</p>}
    >
      {(rows) => <ul>{rows.map((row) => <li key={row}>{row}</li>)}</ul>}
    </Deferred>
  );
}
```

The child must be a function. Passing ordinary content throws
`Deferred requires a single render-function child.` at render time, not at compile time. Without an
`errorFallback`, a rejected promise renders the built-in shell (an `ns-deferred-error` block reading
*Section failed to load.*) instead of propagating.

`Deferred` has no cache, no policy and no partial. Use it when a component already holds a promise
and needs a boundary around it.

## `DeferPage`: a cached region with a policy

`DeferPage` is a **decision maker, not a data loader**. It does not fetch, cache or revalidate
anything. You hand it content you already rendered from cache, the timestamp of that content, and a
partial route that can produce it again. It decides whether to prewarm on the server and whether to
refresh on the client, and renders both halves.

```tsx
import { DeferPage } from '@netscript/fresh/defer';

const ordersPolicy = { profile: 'background-refresh' } as const;

export function OrdersRegion(props: {
  ctx: { url: URL; req: Request; isPartial?: boolean };
  cached?: { data: readonly Order[]; cachedAt: number };
}) {
  return (
    <DeferPage
      name='orders-list'
      action={props.ctx.url.pathname}
      partial='/partials/orders/list'
      component={props.cached ? <OrdersTable orders={props.cached.data} /> : undefined}
      fallback={<OrdersTableSkeleton />}
      cachedAt={props.cached?.cachedAt}
      staleTime={30_000}
      policy={ordersPolicy}
      ctx={props.ctx}
    />
  );
}
```

Two props are easy to get wrong:

- **`component` is rendered content, not data.** It is typed `DeferPageRenderable` and stands for
  the cached region, already rendered. The page runtime passes the rendered layer component; when
  you call `DeferPage` yourself, you render it yourself.
- **`ctx` is a `DeferPageRequestContextLike`**: `{ url, req, isPartial? }`. `DeferPage` reads the
  origin and search params from `url`, checks `req` for the prewarm header, and uses `isPartial` to
  avoid re-deferring inside a partial render. Your full app context satisfies it structurally.

`DeferPage` renders a `<Partial name={name}>` containing `component` when there is cached content and
`fallback` when there is not, followed by a hidden client form that performs the refresh.

{{ comp callout { type: "warning", title: "Two silent misconfigurations" } }}
<strong>A falsy <code>component</code> is a cache miss.</strong> The check is <code>!!component</code>,
so <code>0</code>, <code>''</code> and <code>null</code> all render the fallback and start a refresh.
<strong>No <code>cachedAt</code> means no freshness information</strong>, so the region refreshes on
the client on every render (the decision falls through to <code>missing-freshness</code>). If you pass
<code>component</code>, pass <code>cachedAt</code> with it.
{{ /comp }}

## `DeferPage` from a page layer

You rarely write `DeferPage` yourself. A `withLayer` config carrying a `partial` URL makes the page
runtime render a `DeferPage` around that layer, deriving the region name, action, fallback,
`cachedAt` and stale strategy from the layer config. `cachedAt` only appears when the loader returned
a cache-entry-shaped result.
[Partials](/web-layer/partials/#deferred-loader-composition-the-page-runtime-drives-the-partial)
documents that mapping, and [Layers, layout, and slots](/web-layer/layers/) covers the layer-level
`delivery` and `staleReloadMode` switches.

## The policy engine

A policy is a stale window plus the prewarm and refresh switches in this table. Naming a profile
sets all of them:

| Profile | `staleTimeMs` | `prewarmOnMiss` | `prewarmOnStale` | `clientRefreshOnFreshCache` | `skipClientWhenServerPrewarm` |
| --- | --- | --- | --- | --- | --- |
| `balanced` (default) | 30 000 | yes | yes | no | yes |
| `aggressive-first-paint` | 20 000 | yes | yes | no | no |
| `background-refresh` | 30 000 | yes | yes | yes | no |
| `low-bandwidth` | 45 000 | yes | no | no | yes |

The last two columns are where the profiles differ:

- `balanced` trusts a fresh cache and never duplicates a request the server is already making.
- `background-refresh` verifies even a fresh cache. Use it for a detail page where a linked resource
  may have changed.
- `low-bandwidth` stops prewarming stale content and widens the window.
- `aggressive-first-paint` narrows the window and lets the client refresh while the server prewarms,
  trading a duplicate request for a shorter path to correct content.

`resolveDeferPolicy(policy, staleTimeOverrideMs, staleStrategy)` merges the three inputs. The
precedence is not left to right:

- `staleTimeOverrideMs` beats the policy object's `staleTimeMs`, which beats the profile's.
- **The legacy `staleStrategy: 'server-prewarm'` value overrides both prewarm fields**, including
  an explicitly set `prewarmOnMiss` / `prewarmOnStale`; `'none'` (the default) leaves them intact.
  `'server-prewarm'` with `low-bandwidth` produces `prewarmOnStale: true`, discarding the profile's
  `false`. A layer's `staleReloadMode: 'background'` takes this path, so a layer can silently
  contradict the profile it names.
- Everything else falls through profile defaults.

The package also ships the conventions generated pages use: `DEFER_POLICY`
(`{ header: 'balanced', detail: 'background-refresh' }`), `DEFER_STALE_MS`
(`{ crud: 30_000, forceRefresh: 0 }`), and `DETAIL_FORCE_REFRESH_POLICY` (`background-refresh` with
`skipClientWhenServerPrewarm: false`, which keeps linked resources consistent after the first client
navigation).

## The client decision

`decideDeferClientAction` is the whole client-side policy, evaluated in order. Every branch returns
an action and a stable reason, and the reason is emitted as a span attribute, so a trace tells you
why a region did or did not refresh:

| Condition (first match wins) | Action | Reason |
| --- | --- | --- |
| Already rendering a partial, with cached content | skip | `partial-hit` |
| Already rendering a partial, no cached content | submit | `partial-miss` |
| No cached content | submit | `full-miss` |
| Server is prewarming, policy skips, and `staleTimeMs !== 0` | skip | `server-revalidating` |
| No `cachedAt` | submit | `missing-freshness` |
| Cache older than the stale window | submit | `stale-cache` |
| Fresh cache, but `clientRefreshOnFreshCache` | submit | `policy-background-refresh` |
| Fresh cache | skip | `fresh-cache` |

The `staleTimeMs !== 0` clause in row four makes force-refresh work.
`resolveDetailDeferConfig(hasCompleteCache)` returns `staleTime: 0` and
`DETAIL_FORCE_REFRESH_POLICY` when the cache is incomplete, and a zero stale window disqualifies the
`server-revalidating` skip. With a complete cache it returns `staleTime: 30_000` and the plain
`background-refresh` profile.

## The transport underneath

**Client refresh is a hidden form.** `DeferPage` renders a `display: none`, `aria-hidden` form with
`method='GET'`, `action` set to the page path, and `f-partial` set to the partial URL. When the
decision is `submit`, the island calls `requestSubmit()` on it and Fresh swaps the named partial.
Shared page params ride in the form body as hidden inputs; params that belong only to the partial
stay on the `f-partial` URL, and Fresh's own `fresh-partial` transport parameter is stripped from
both.

**Server prewarm is a fire-and-forget fetch.** When policy says prewarm (a stale hit with
`prewarmOnStale`, or a miss with `prewarmOnMiss`, never inside a partial render), `DeferPage` queues
a microtask that fetches the partial URL with `X-Requested-With: defer-prewarm` and
`X-Defer-Prewarm: 1`. The render that answers that fetch sees the header and skips its own prewarm
and its cache-read telemetry, so a prewarm cannot cascade.

Neither is a push channel. A refresh is a second request. A region that must stay current *after* it
settles belongs to durable streams, below.

## Observability

Three spans cover the lifecycle, all under the `defer` scope:

| Emitter | What it records |
| --- | --- |
| cache read | Per server render: `defer.has_cached_data`, `defer.is_stale`, `defer.cache.age_ms`, `defer.fallback.visible`, the resolved profile, and both prewarm decisions. Skipped on prewarm renders. |
| prewarm dispatch | The fire-and-forget fetch: reason (`stale` or `miss`), both URLs, response status, and duration. |
| client decision | The submit/skip verdict with its `defer.decision_reason`, plus the freshness inputs it was computed from. |

A region that feels stale shows `fresh-cache` skips with a large `defer.cache.age_ms`: check the
stale window, not the loader. A region that feels slow shows `defer.fallback.visible: true` with no
prewarm scheduled: check the policy.

## What to watch for

- **`cachedAt` needs a cache-entry loader result.** At the layer level the runtime only forwards
  `cachedAt` when the loader returned a cache-entry shape; anything else means `missing-freshness` on
  every render.
- **`staleTime` at the layer level is an override, not a floor.** It replaces the profile's window
  entirely, including with `0`.
- **`staleReloadMode` can override a profile named on a layer.** See the precedence rule above.
- **`Deferred` throws on a non-function child**, and the message is the only signal.
- **The fallback is a skeleton, not an error state.** A loader that returns nothing renders the
  fallback indefinitely on a page with no refresh path. Error surfaces are the partial's job; see
  [Diagnostics and error surfaces](/web-layer/error/).

## Streaming UI with durable streams

`@netscript/fresh/streams` is the client SDK for durable streams. It connects a Preact island to
the durable streams server and keeps TanStack DB collections updated as events arrive.

`createNetScriptStreamDB()` is the entry point: a TanStack DB-backed StreamDB factory that wraps
`@durable-streams/state` with NetScript URL resolution. It returns a `NetScriptStreamDB` whose
`.collections` are typed TanStack DB collections.

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

| Option | Meaning |
| --- | --- |
| `streamPath` | Stream path relative to the streams server root, for example `/workers/executions`. |
| `schema` | The `NetScriptStateSchema` for the durable stream database. |
| `baseUrl` | Optional base stream server URL; defaults to the env-resolved `getStreamsUrl()`. |
| `createStreamDB` | Optional factory port for tests or alternate stream DB adapters. |
| `reconnect` | Optional finite outage policy: `maxRetries`, `initialDelayMs` and `maxDelayMs`. Defaults are five retries, a 100 ms initial delay and a 5,000 ms cap. Zero retries disables recovery; a consumed batch resets the outage budget. |

Call `await db.preload?.()` to start the default consumer. The same collections stay mounted across
network failures, missing-stream startup responses, rate limits and server errors. Reads resume from
the last consumed batch offset; they do not recreate the DB or replay the retained log.

`db.status` is `idle`, `connecting`, `live`, `retrying`, `failed` or `stopped`. Authentication
errors, malformed payloads, subscriber failures and invalid or expired retained offsets fail without
retry. Exhausted startup recovery rejects preload; terminal failures after startup stay visible
through `status`. `db.stop?.()` and `db.dispose?.()` cancel active reads and pending backoff and are
safe to call repeatedly. Alternate factory adapters may omit these hooks.

### Live queries in islands

Two hooks run a TanStack DB live query through the streams surface, via `preact/compat` inside Fresh
islands:

- `useLiveQuery` runs a live query and returns its current result.
- `useLiveSuspenseQuery` is the suspense variant.

Both accept a query factory (`NetScriptLiveQueryFactory`) and optional `deps`, and return a
`NetScriptLiveQueryResult<TData>` with `data`, `status`, `error`, and a `details` record carrying any
additional upstream fields.

## API summary

### Deferred rendering (`@netscript/fresh/defer`)

| Symbol | Kind | Description |
| --- | --- | --- |
| `Deferred` | function | Suspense-ready boundary for a single promise; requires a render-function child. |
| `DeferredProps<T>` | interface | `promise`, `fallback`, `children`, `errorFallback`. |
| `DeferredRenderable` | type | Renderable content accepted by deferred Suspense slots. |
| `DeferredRenderFunction<T>` | type | Render function turning resolved deferred data into content. |
| `DeferPage` | function | Cached region: renders content or fallback, decides prewarm and client refresh. |
| `DeferPageProps` | interface | `name`, `action`, `partial`, `component`, `fallback`, `cachedAt`, `staleTime`, `policy`, `staleStrategy`, `partialSearchParams`, `ctx`, `debug`. |
| `DeferPageRequestContextLike` | interface | The `{ url, req, isPartial? }` slice `DeferPage` needs. |
| `DeferComponent` | function | The hidden client form that performs the refresh. |
| `sanitizeDeferSearchParams` | function | Strip Fresh's `fresh-partial` transport param from a query string. |
| `buildDeferFormState` | function | Split shared page params (form body) from partial-only params (`f-partial` URL). |
| `DeferPagePolicyInput` / `DeferPagePolicyProfile` | interface, type | The policy shapes the page wrapper's `policy` prop accepts. |
| `DeferPolicyInput` / `DeferPolicyResolved` | interface | Policy overrides, and the fully resolved policy both renderers read. |
| `DeferPolicyProfile` | type | `"balanced"` \| `"aggressive-first-paint"` \| `"background-refresh"` \| `"low-bandwidth"`. |
| `resolveDeferPolicy` | function | Merge profile, overrides, and legacy strategy into a complete policy. |
| `decideDeferClientAction` | function | The submit/skip decision, with a stable reason. |
| `DeferClientDecision` / `DeferClientDecisionReason` | type | The decision and its eight reasons. |
| `DEFER_POLICY` / `DEFER_STALE_MS` / `DETAIL_FORCE_REFRESH_POLICY` | const | The conventions generated pages use. |
| `resolveDetailDeferConfig` | function | Detail-page stale window and policy for a complete or incomplete cache. |

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

## Next steps

Continue with [The query bridge](/web-layer/query-bridge/) to see where a region's `cachedAt` comes
from. See also [Partials](/web-layer/partials/) for the route on the other end of a deferred region.
