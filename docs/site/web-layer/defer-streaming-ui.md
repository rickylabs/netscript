---
layout: layouts/base.vto
title: Deferred and streaming UI
templateEngine: [vento, md]
order: 6
---

# Deferred and streaming UI

Most pages have one region that is slower than the rest — an aggregate panel, a detail view that
reads through a cache, a feed. Deferring it is easy: paint a skeleton, fill it in later. Deciding
*when* to fill it in is the part that goes wrong. Cached content is fast but possibly stale; a
refetch is correct but visible; doing both is a duplicate request. Answer that per page and two pages
end up with two different freshness behaviours for no reason anyone can reconstruct.

`@netscript/fresh/defer` splits the problem in two. `Deferred` is a Suspense boundary for one
promise. `DeferPage` is a cached region whose refresh behaviour comes from a **named policy** rather
than from per-page conditionals — so "this region behaves like the header" is a thing you can say and
mean. This page is about that policy engine, the decisions it makes, and what the transport
underneath it actually is.

The streams client — for regions that must stay live *after* they settle — is the second half of the
page.

## What bare Fresh makes you write

Fresh 2 gives you the transport. `<Suspense>` through `preact/compat` covers a pending promise, and
partial routes with `f-partial` / `f-client-nav` swap a named region without a navigation — the same
mechanism `DeferPage` uses. What Fresh does not give you is the *decision*, so you write that
yourself, in each page:

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

The swap itself is fine — Fresh owns it. Three costs sit above it.

**The stale window is a magic number in two files.** The server's `30_000` and the island's `30_000`
have to agree, and nothing checks that they do. When the second one drifts, the region refreshes
twice or never.

**The server prewarm and the client partial submission do not know about each other.** Both fire on
a stale hit, so a stale region costs two requests. Suppressing one means passing a flag from the
server render into the island and remembering to check it.

**"How should this region behave?" has no name.** There is no vocabulary for "cached first paint,
refresh in the background" versus "cheap on mobile" — only a fresh set of `if`s per page, which is
why two similar regions end up behaving differently.

## `Deferred`: one promise, one boundary

`Deferred` is the small tool. It takes a `promise`, a `fallback` while it is pending, an optional
`errorFallback`, and a **render-function child**:

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

The child must be a function — passing ordinary content throws
`Deferred requires a single render-function child.` at render time, not at compile time, so it is
worth knowing the message. Without an `errorFallback`, a rejected promise renders the built-in shell
— an `ns-deferred-error` block reading *Section failed to load.* — instead of propagating.

`Deferred` has no cache, no policy, and no partial. It is the right tool when a component already
holds a promise and you want a boundary around it.

## `DeferPage`: a cached region with a policy

`DeferPage` is the larger tool, and it is a **decision maker, not a data loader**. It does not fetch,
cache, or revalidate anything on its own. You hand it content you already rendered from cache, the
timestamp that content was produced at, and a partial route that can produce it again; it decides
whether to prewarm on the server, whether to refresh on the client, and renders both halves.

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

Two prop shapes are easy to get wrong:

- **`component` is rendered content, not data.** It is typed `DeferPageRenderable`, and the region
  treats it as "the cached region already rendered". The page runtime passes the result of rendering
  the layer component; when you call `DeferPage` yourself you render it yourself.
- **`ctx` is a `DeferPageRequestContextLike`** — just `{ url, req, isPartial? }`. `DeferPage` reads
  the origin and search params from `url`, checks `req` for the prewarm header, and uses `isPartial`
  to avoid re-deferring inside a partial render. Your full app context satisfies it structurally.

What renders is a `<Partial name={name}>` containing `component` when there is cached content and
`fallback` when there is not, followed by a hidden client form that performs the refresh.

{{ comp callout { type: "warning", title: "Two silent misconfigurations" } }}
<strong>A falsy <code>component</code> is a cache miss.</strong> The check is <code>!!component</code>,
so <code>0</code>, <code>''</code>, and <code>null</code> all render the fallback and start a refresh.
<strong>No <code>cachedAt</code> means no freshness information</strong>, and a region with no
freshness information refreshes on the client every single time — the decision falls through to
<code>missing-freshness</code>. If you pass <code>component</code>, pass <code>cachedAt</code> with it.
{{ /comp }}

## You rarely write `DeferPage` yourself

The usual path is a page layer. A `withLayer` config carrying a `partial` URL makes the page runtime
render a `DeferPage` around that layer for you, deriving the region name, action, fallback,
`cachedAt`, and stale strategy from the layer config — including the fact that `cachedAt` only
appears when the loader returned a cache-entry-shaped result. That mapping is documented once, in
[Partials](/web-layer/partials/#deferred-loader-composition-the-page-runtime-drives-the-partial);
this page is the freshness half it points back to.

Two layer-level switches worth knowing here:

- `delivery: 'stream'` on a layer of a `withStreaming()` page opts out of the defer path entirely —
  the layer renders a stream slot with its fallback and resolves through the streaming renderer
  instead.
- `staleReloadMode: 'blocking'` drops a stale cache entry's data before render, so the region paints
  its fallback and refreshes rather than showing known-stale content. `'background'` keeps the
  content and asks the server to prewarm.

## The policy engine

A policy is five knobs plus a stale window. Naming a profile sets all six:

| Profile | `staleTimeMs` | `prewarmOnMiss` | `prewarmOnStale` | `clientRefreshOnFreshCache` | `skipClientWhenServerPrewarm` |
| --- | --- | --- | --- | --- | --- |
| `balanced` (default) | 30 000 | yes | yes | no | yes |
| `aggressive-first-paint` | 20 000 | yes | yes | no | no |
| `background-refresh` | 30 000 | yes | yes | yes | no |
| `low-bandwidth` | 45 000 | yes | no | no | yes |

Read the last two columns together — they are what actually differ. `balanced` is "trust a fresh
cache, and never duplicate a request the server is already making". `background-refresh` is "always
verify, even on a fresh cache" — the right shape for a detail page where a linked resource may have
changed. `low-bandwidth` stops prewarming stale content and widens the window. `aggressive-first-paint`
narrows the window and lets the client refresh even while the server prewarms, trading a duplicate
request for a shorter path to correct content.

`resolveDeferPolicy(policy, staleTimeOverrideMs, staleStrategy)` merges the three inputs, and the
precedence is not left-to-right:

- `staleTimeOverrideMs` beats the policy object's `staleTimeMs`, which beats the profile's.
- **The legacy `staleStrategy: 'server-prewarm'` value overrides both prewarm fields**; `'none'`
  (the default) leaves the policy and profile values intact. When it does apply, it wins over both
  the profile and an explicitly-set `prewarmOnMiss` / `prewarmOnStale`: `'server-prewarm'` with
  `low-bandwidth` produces `prewarmOnStale: true`, discarding the profile's `false`. This is the path
  a layer's `staleReloadMode: 'background'` takes, so a layer can silently contradict the profile it
  names.
- Everything else falls through profile defaults.

The package also ships the conventions generated pages use: `DEFER_POLICY`
(`{ header: 'balanced', detail: 'background-refresh' }`), `DEFER_STALE_MS`
(`{ crud: 30_000, forceRefresh: 0 }`), and `DETAIL_FORCE_REFRESH_POLICY` — `background-refresh` with
`skipClientWhenServerPrewarm: false`, carrying the comment *"Keep immediate consistency for linked
resources after first client nav."*

## The client decision

`decideDeferClientAction` is the whole client-side policy, evaluated in order. Every branch returns
both an action and a stable reason, and the reason is emitted as a span attribute — so "why did this
region not refresh" is answerable from a trace rather than from reading the source:

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

The `staleTimeMs !== 0` clause in row four is the escape hatch that makes force-refresh work:
`resolveDetailDeferConfig(hasCompleteCache)` returns `staleTime: 0` and
`DETAIL_FORCE_REFRESH_POLICY` when the cache is incomplete, and a zero stale window disqualifies the
"the server is already handling it" skip. With a complete cache it returns `staleTime: 30_000` and
the plain `background-refresh` profile.

## The transport underneath

**Client refresh is a hidden form.** `DeferPage` renders a `display: none`, `aria-hidden` form with
`method='GET'`, `action` set to the page path, and `f-partial` set to the partial URL. When the
decision is `submit`, the island calls `requestSubmit()` on it and Fresh swaps the named partial.
Shared page params ride in the form body as hidden inputs; params that belong only to the partial
stay on the `f-partial` URL, and Fresh's own `fresh-partial` transport parameter is stripped from
both.

**Server prewarm is a fire-and-forget fetch.** When policy says prewarm — a stale hit with
`prewarmOnStale`, or a miss with `prewarmOnMiss`, and never inside a partial render — `DeferPage`
queues a microtask that fetches the partial URL with `X-Requested-With: defer-prewarm` and
`X-Defer-Prewarm: 1`. The render that answers that fetch sees the header and skips both its own
prewarm and its cache-read telemetry, so a prewarm cannot cascade.

Neither is a push channel, and neither is streaming. Deferral here is a Suspense-ready boundary that
becomes progressive when streaming delivery lands, and a refresh is a second request — the same two
boundaries [Partials](/web-layer/partials/#what-the-runtime-actually-does-today) states for the
partial side. A region that must stay current *after* it settles belongs to durable streams, below.

## Observability

Three spans cover the lifecycle, all under the `defer` scope:

| Emitter | What it records |
| --- | --- |
| cache read | Per server render: `defer.has_cached_data`, `defer.is_stale`, `defer.cache.age_ms`, `defer.fallback.visible`, the resolved profile, and both prewarm decisions. Skipped on prewarm renders. |
| prewarm dispatch | The fire-and-forget fetch: reason (`stale` or `miss`), both URLs, response status, and duration. |
| client decision | The submit/skip verdict with its `defer.decision_reason`, plus the freshness inputs it was computed from. |

The pairing that matters in practice: a region that feels stale shows `fresh-cache` skips with a
large `defer.cache.age_ms`, which points at the stale window rather than at the loader. A region that
feels slow shows `defer.fallback.visible: true` with no prewarm scheduled, which points at the
policy.

## What to watch for

- **`cachedAt` without a cache-entry loader result never arrives.** At the layer level the runtime
  only forwards `cachedAt` when the loader returned a cache-entry shape; anything else means
  `missing-freshness` on every render.
- **`staleTime` at the layer level is an override, not a floor.** It replaces the profile's window
  entirely, including with `0`.
- **A profile named on a layer can be overridden by `staleReloadMode`** — see the precedence rule
  above.
- **`Deferred` throws on a non-function child**, and the message is the only signal.
- **The fallback is a skeleton, not an error state.** A loader that returns nothing renders the
  fallback indefinitely on a page with no refresh path; error surfaces are the partial's job — see
  [Diagnostics and error surfaces](/web-layer/error/).

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

## Related

{{ comp.cardsGrid({ columns: 3, cards: [
  { title: "Partials", body: "The layer config that generates a DeferPage, and the partial on the other end.", href: "/web-layer/partials/" },
  { title: "The query bridge", body: "Where cachedAt comes from: getCachedEntry as a read, not a fetch.", href: "/web-layer/query-bridge/" },
  { title: "Request-scoped resources", body: "Read the cache entry once and share it across regions.", href: "/web-layer/resources/" },
  { title: "The Fresh page model", body: "Server-first rendering and the islands boundary.", href: "/web-layer/server/" },
  { title: "Interactive islands", body: "Where the live-query hooks run.", href: "/web-layer/interactive/" },
  { title: "Live dashboard tutorial", body: "A deferred region and a live stream in one page.", href: "/tutorials/live-dashboard/04-definePage-QueryIsland/" }
] }) }}

See the [Web Layer overview](/web-layer/) for the full pillar map.
