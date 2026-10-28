---
layout: layouts/base.vto
title: Typed SDK & client
templateEngine: [vento, md]
order: 2
---

# Typed SDK & client

This page explains how `@netscript/sdk` turns a contract into a typed client, cache-first query
factories and TanStack Query helpers, and how to call a service safely from a loader or an island.
{{ comp.badge({ status: "pre-1.0" }) }}

The SDK turns an [`@orpc/contract`](/explanation/contracts/) into a discovered, type-safe service
client, wraps each contract action in a cache-first query factory (KV-backed stale-while-revalidate),
and bridges those into [TanStack Query](https://tanstack.com/query) for islands. The
[service](/services-sdk/services/) implements the same contract object the client imports, so input,
output, and declared-error types cannot drift between caller and server. Transport failures and
arbitrary thrown values are not declared contract errors; `safe()` keeps them on its non-defined
branch. Subpath barrels are stable, but signatures may still change before 1.0.

{{ comp.diagram({
  src: "/assets/diagrams/sdk-data-flow.svg",
  alt: "A contract object flows into a generated typed client, then a cache-first query factory backed by Deno KV, then into a Fresh island; the same contract object is imported by the oRPC service so the two ends cannot drift.",
  caption: "One contract → typed client → KV cache-first query → island. The service imports the same contract, so a renamed field is a compile error on both sides."
}) }}

## What it is

The SDK has three layers, and you can use any one without the others:

- **L1, the typed client.** `createServiceClient<Contract>()` resolves a service URL through
  [Aspire service discovery](/explanation/aspire/) and returns a callable object whose method input,
  output, and declared-error union are inferred from the contract.
- **L2, query factories.** `createQueryFactories` wraps each contract action in a factory that runs
  through a shared KV-backed cache provider and exposes `queryOptions`, `mutationOptions`,
  `clientKey`, `key` and `getCachedEntry` per action.
- **L3, the preset.** `defineServices()` builds clients, server query factories, and frontend query
  utils from one contract map.

Use the bare client for service-to-service RPC. Add query factories when you want KV-backed caching
and TanStack option helpers, and use [Fresh](/web-layer/) when an island must hydrate the same query
key on the client.

From one contract action, the factory derives the server KV cache key (`key()`), the client TanStack
key (`clientKey()`), the `queryOptions`/`mutationOptions` helpers, and the cache reads. For routes
built from `baseContract`, the declared error schemas also flow through the client promise and
`safe()`. One edit to the contract updates the client, the OpenAPI surface and the query layer
together.

## Minimal example

A single `lib/orders.ts` holds the data layer: build the typed client from a contract, then derive a
query factory from `{ contract, client }`. Server loaders and islands both import from it.

```ts
// apps/playground/lib/orders.ts
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { ordersContract } from '@playground/contracts';

// L1 — typed client. `serviceName` resolves a URL via Aspire discovery.
export const ordersClient = createServiceClient<typeof ordersContract>({
  contract: ordersContract,
  serviceName: 'orders',
});

// L2 — cache-first query factory bound to that client (KV-backed SWR).
export const ordersQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
}).orders;

// Direct call: input, output, and declared errors are inferred from the contract.
// Calls still reject on failure; use safe() as shown below when you want a result value.
const recent = await ordersClient.list({ limit: 10 });
```

{{ comp callout { type: "note", title: "Plugin services add a routerName" } }}
A first-party plugin API (workers, sagas, triggers) mounts its router under a named segment, so
its client needs <code>routerName</code> in addition to <code>serviceName</code>:
<code>createServiceClient&lt;typeof workersContract&gt;({ contract, serviceName: 'workers-api', routerName: 'workers' })</code>.
Plain workspace services omit it.
{{ /comp }}

## Key types first

Each contract action becomes an `ActionMethod` with the full cache-first surface: keys, prefetch,
cached reads, and TanStack option helpers. You call these methods from a `definePage` loader and from
an island.

{{ comp.apiTable({
  caption: "ActionMethod — per-action query helpers (ordersQueries.list.*)",
  rows: [
    { name: "queryOptions(props, options?)", type: "(input, ActionQueryOptions?) => QueryOptions", desc: "TanStack queryOptions with a typed queryKey and queryFn derived from the contract. The primary helper a loader/island passes to useQuery." },
    { name: "mutationOptions(options?)", type: "(ActionMutationOptions?) => MutationOptions", desc: "TanStack mutationOptions with a typed mutationKey and mutationFn for writes (e.g. updateStatus)." },
    { name: "key(props)", type: "(input) => readonly [string, action, string]", desc: "Canonical SERVER cache key [resource, action, serializedInput] used by the KV cache." },
    { name: "clientKey(props?)", type: "(input?) => readonly unknown[]", desc: "CLIENT-side TanStack query key, prefix-matchable for invalidateQueries. clientKey() vs key() is the server↔client split." },
    { name: "getCachedEntry(props)", type: "(input) => Promise<CachedEntry<Output> | null>", desc: "Read cached data WITH its cache timestamp (cachedAt) — the SWR primitive a layer loader uses to decide stale-reload." },
    { name: "getCachedData(props)", type: "(input) => Promise<Output | null>", desc: "Read cached data only, without fetching." },
    { name: "prefetch(props, options?)", type: "(input, QueryParams?) => void", desc: "Warm the cache in the background (fire-and-forget)." },
    { name: "invalidate()", type: "() => Promise<void>", desc: "Invalidate all cached queries for this action." }
  ]
}) }}

## Constructing the client & factory

`createServiceClient` is the only call that touches discovery; `createQueryFactories` is pure wiring
over `{ contract, client }`.

{{ comp.apiTable({
  caption: "createServiceClient<Contract>(options) — CreateServiceClientOptions",
  rows: [
    { name: "contract", type: "TContract — required", desc: "The @orpc/contract object. Drives both client typing AND HTTP method inference." },
    { name: "serviceName", type: "string — required", desc: "Service name registered in Aspire / NetScript config. Resolved to a URL via discovery (services__{name}__{protocol}__{index}; browser uses the VITE_ mirror)." },
    { name: "routerName", type: "string?", desc: "Router-name segment for URL path construction; defaults to serviceName. Required for plugin API services, omitted for plain services." },
    { name: "protocol", type: "'http' | 'https'?", desc: "Resolved protocol for service discovery. Defaults to 'http' (resolves the __http__ endpoint)." },
    { name: "apiPath / apiVersion", type: "string?", desc: "Base RPC path and API version segment overrides. Default to '/api/rpc' and 'v1'; match what the service serves." },
    { name: "propagateTraceContext", type: "boolean?", desc: "Auto-propagate W3C traceparent/tracestate headers on each call. Defaults to true." },
    { name: "resolveServiceUrl", type: "ServiceUrlResolver?", desc: "(serviceName, protocol) => string | URL, called per request instead of discovery. Defaults to getServiceUrl. Only the origin of the result is used. See the discovery recipe for non-Aspire runtimes." },
    { name: "contributions", type: "readonly SdkClientContribution[]?", desc: "Explicit literal tuple of typed request contributions. The tuple infers required per-call context and reserves its declared headers." }
  ]
}) }}

## Typed request contributions

Contributions add typed per-call context and declare ownership of lower-case request headers.
Attach the literal tuple to each service that needs it; the SDK never installs a contribution
automatically.

This example composes an auth-shaped application contribution with the SDK's non-auth locale
contribution:

```ts
import {
  createLocaleSdkClientContribution,
  defineSdkClientContribution,
} from '@netscript/sdk/client';
import { defineServices } from '@netscript/sdk/presets';
import { oc } from '@orpc/contract';
import { z } from 'zod';

const accountsContract = {
  profile: oc.route({ method: 'GET' })
    .input(z.object({}))
    .output(z.object({ id: z.string(), displayName: z.string() })),
};

const locale = createLocaleSdkClientContribution();
const bearer = defineSdkClientContribution<{
  auth: { getAccessToken(): Promise<string>; cachePartition: string };
}>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:bearer',
  context: { auth: 'required' },
  headerKeys: ['authorization'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.auth.cachePartition,
  },
  prepare: async ({ context }) => ({
    headers: { authorization: `Bearer ${await context.auth.getAccessToken()}` },
  }),
});

const sdk = defineServices({
  accounts: {
    contract: accountsContract,
    contributions: [bearer, locale] as const,
  },
});

const context = {
  auth: {
    getAccessToken: () => Promise.resolve('runtime-only-value'),
    cachePartition: 'account-epoch-7',
  },
  locale: 'de-CH',
};
await sdk.clients.accounts.profile({}, { context });
sdk.queryUtils.accounts.profile.queryOptions({ input: {}, context });
```

The locale factory canonicalizes one optional Unicode BCP 47 locale, owns `accept-language`, and
uses the canonical locale as its declared cache partition. An absent locale emits no header and uses
the stable `default` partition. Preference lists and quality weights are rejected. Other
contributions must declare whether responses are `invariant`, `partitioned`, or `direct-only`;
partition values must be stable, printable, and non-secret.

### Typed bearer credentials

Credential fields do not belong on `CreateServiceClientOptions`. Instead, attach the canonical
auth contribution through the versioned client-contribution seam. Its resolver receives only the
context fields it declares, runs once per logical retry epoch, and owns only the lower-case
`authorization` header:

```ts
import { createServiceClient } from '@netscript/sdk/client';
import { authContract } from '@netscript/plugin-auth-core/contracts/v1';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';

declare const applicationSession: { accessToken: string; accountId: string };

const bearer = createBearerSdkClientContribution<{
  auth: { getAccessToken(): string | undefined | PromiseLike<string | undefined> };
  accountPartition: string;
}>({
  context: { auth: 'required', accountPartition: 'required' },
  resolveCredential: ({ context }) => context.auth.getAccessToken(),
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.accountPartition,
  },
});

const authClient = createServiceClient({
  contract: authContract,
  serviceName: 'auth-api',
  routerName: 'auth',
  contributions: [bearer] as const,
});

await authClient.me(undefined, {
  context: {
    auth: { getAccessToken: () => applicationSession.accessToken },
    accountPartition: applicationSession.accountId,
  },
});
```

Procedure metadata controls resolution: `none` skips the resolver, `optional` omits the header when
no credential is available, and `required` fails preparation when it is missing. Unmarked routes
default to `none`. Bearer credentials require HTTPS except on localhost, `.localhost`, IPv4
`127/8`, and IPv6 `::1`; other cleartext origins require an explicit opt-in.

Choose `responseCache: { mode: 'direct-only' }` if authenticated responses must bypass generated
query helpers. A `partitioned` cache must use a stable, non-secret tenant/account partition. Never
derive a partition from a credential, session id, email address, or another reversible identity.
Contribution factories do not read ambient environment variables, cookies, or browser storage.
Plugin manifest references only make factories discoverable; they do not activate them.

The L3 alternative builds all three layers from one map:
`defineServices({ orders: { contract, serviceName: 'orders' } })` returns
`{ clients, queries, queryUtils }`: the same L2 values, composed in one call. Import it from
`@netscript/sdk/presets` in browser/shared modules so the graph contains only the preset and its
package-owned type closure. The root also exports `defineServices`, but neither entry installs a
server cache provider.

NetScript-managed Fresh apps register the shared provider when `defineFreshApp()` is called. A
custom server composition root must do so explicitly:

```ts
import { cacheQuery, setCacheProvider } from '@netscript/sdk/cache';

setCacheProvider(cacheQuery);
```

## Service discovery & query client

`serviceName` is resolved at call time from Aspire-injected environment variables. The
`@netscript/sdk/discovery` subpath exposes the resolvers directly when you need a raw URL, and
`@netscript/sdk/query-client` provides the browser-side TanStack glue.

{{ comp.apiTable({
  caption: "Discovery & query-client helpers",
  rows: [
    { name: "getServiceUrl(name, protocol, index)", type: "@netscript/sdk/discovery", desc: "Resolve a service URL from Aspire browser-VITE or server services__* env. This is how serviceName resolves." },
    { name: "getServiceInfo(name) / isServiceAvailable(name) / getAllServices()", type: "@netscript/sdk/discovery", desc: "Inspect a service's endpoints, check availability, or list all server-side Aspire service names (topology)." },
    { name: "createNetScriptQueryClient(options)", type: "@netscript/sdk/query-client", desc: "A TanStack QueryClient with server-first defaults: staleTime 30s, gcTime 300s, refetchOnWindowFocus false, retry 1." },
    { name: "bridgeInvalidation(resource, action?)", type: "@netscript/sdk/query-client", desc: "Build a client-side invalidation filter ({ queryKey }) for queryClient.invalidateQueries()." },
    { name: "toClientKeyPrefix(resource, action?)", type: "@netscript/sdk/query-client", desc: "Map a server resource/action to a prefix-matchable client query key, e.g. ['orders','list']." },
    { name: "cacheQuery.setCachedData(key, data, ttl)", type: "@netscript/sdk/cache", desc: "Server-only: fire-and-forget pre-warm of an entity into the KV cache. Register cacheQuery explicitly at a custom server composition root." }
  ]
}) }}

{{ comp.tabbedCode({ tabs: [
  {
    label: "Server loader (definePage layer)",
    lang: "ts",
    code: "// routes/(dashboard)/orders/(_loaders)/orders-list.ts\nimport { ordersQueries } from '@app/lib/orders.ts';\n\n// The callable action owns cache policy; block on stale so metadata is current.\nexport const loadOrders = async () => {\n  const input = { limit: 20 };\n  const data = await ordersQueries.list(input, { preferFreshOnStale: true });\n  // getCachedEntry is a KV-only metadata read; it never fetches or revalidates.\n  const entry = await ordersQueries.list.getCachedEntry(input);\n  return entry ?? { data, cachedAt: Date.now() }; // fail safe if persistence did not land\n};"
  },
  {
    label: "Island (TanStack hydration)",
    lang: "tsx",
    code: "// orders/(_islands)/OrdersQueryIsland.tsx\nimport { useQuery, useQueryClient } from '@netscript/fresh/query';\nimport { ordersQueries } from '@app/lib/orders.ts';\n\n// Same contract action → same query key as the server loader, so the island\n// hydrates from server state instead of refetching on mount.\nconst OrdersList = () => {\n  const qc = useQueryClient();\n  const orders = useQuery(ordersQueries.list.queryOptions({ limit: 20 }));\n  // invalidate by prefix after a write:\n  const refresh = () => qc.invalidateQueries({ queryKey: ordersQueries.list.clientKey() });\n  return null; // render orders.data\n};"
  }
] }) }}

### When a stale refresh cannot persist

Cache writes are non-fatal. If the action refetches over a stale entry and the fetch succeeds but
the KV write fails, the action still returns the fetched `data`, and KV keeps the older entry.
`getCachedEntry` then returns that older entry, so the `??` fallback does not fire and the loader
returns the persisted `{ data, cachedAt }`: internally consistent, but older than `data`.

That is the intended contract. The returned `data` and `cachedAt` always describe the same persisted
value, so the freshness stamp never vouches for data the cache did not record. On a cold cache the
same failure leaves no entry, and the fallback returns `data` with the current time. A loader that
needs the freshest value rather than a consistent pair returns `data` itself.

```ts
import type { CachedEntry } from '@netscript/sdk/cache';
import { createServiceClient } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { ordersContract } from '@my-app/contracts';

const ordersClient = createServiceClient({ contract: ordersContract, serviceName: 'orders' });
const ordersQueries = createQueryFactories({
  orders: { contract: ordersContract, client: ordersClient },
}).orders;
type OrdersInput = { offset: number; limit: number };
type Orders = Awaited<ReturnType<typeof ordersQueries.list>>;

/** Consistent pair: `cachedAt` stamps exactly the `data` beside it, and may lag the refresh. */
export async function loadPersistedOrders(input: OrdersInput): Promise<CachedEntry<Orders>> {
  const data = await ordersQueries.list(input, { preferFreshOnStale: true });
  const entry = await ordersQueries.list.getCachedEntry(input);
  return entry ?? { data, cachedAt: Date.now() };
}

/** Freshest value: what this call returned, whether or not the KV write landed. */
export async function loadFreshestOrders(input: OrdersInput): Promise<Orders> {
  return await ordersQueries.list(input, { preferFreshOnStale: true });
}
```

## Safe error narrowing

For a route built from `baseContract`, the defined channel is exactly `NOT_FOUND`,
`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, or `SERVICE_UNAVAILABLE`.
`safe()` returns a `SafeResult`: test `isSuccess` first, then test `isDefined` on the failure.
That second test prevents a transport failure or arbitrary thrown value from falling through as a
successful result. On the defined branch, `data` is inferred from the schema registered for the
selected `code`; it is neither an open property bag nor `any`.

```ts
import { baseContract } from '@netscript/contracts';
import { createServiceClient, safe } from '@netscript/sdk/client';
import { z } from 'zod';

const usersContract = {
  getById: baseContract
    .route({ method: 'GET', path: '/users/{id}' })
    .input(z.object({ id: z.string() }))
    .output(z.object({ id: z.string(), name: z.string() })),
};
const usersClient = createServiceClient({ contract: usersContract, serviceName: 'users' });

type StandardErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

export async function loadUser(id: string) {
  const result = await safe(usersClient.getById({ id }));
  if (result.isSuccess) return result.data;
  if (!result.isDefined) throw result.error;

  const code: StandardErrorCode = result.error.code;
  if (result.error.code === 'NOT_FOUND') {
    // NOT_FOUND selects its schema: { resourceType, resourceId }.
    console.error(result.error.data.resourceType, result.error.data.resourceId);
  }
  throw new Error(`users.getById failed: ${code}`, { cause: result.error });
}
```

`isDefinedError(failure.error)` is the predicate form when you already have a typed failure union.
It preserves the defined members present in that input type; it does not turn an arbitrary
`unknown` value into one of the contract's declared errors.

Both helper families are supported on a service-client promise: the SDK's `safe` and
`isDefinedError` from `@netscript/sdk/client`, and oRPC's native `safe` and `isDefinedError` from
`@orpc/client`, narrow to the same contract-declared codes.

### Bare promises and the defined-error arm

When a promise carries no contract error type, `TError` falls back to `Error`. In that case the
`isDefined: true` arm of `SafeFailure<Error>` types `error` as `never`, while its
`isDefined: false` arm carries the `Error`. The defined arm is therefore unreachable in the type
system, but it can still be reached at runtime when a `DefinedError` rejects that bare promise and
`safe()` returns a failure whose `isDefined` value is `true`.

This is a deliberate characteristic of the API. To make the defined-error arm available to the
type checker, pass `safe()` a promise carrying contract error typing, such as the promise returned
by a service-client method, rather than a bare `Promise`. For an existing typed error union,
`isDefinedError()` narrows to the `DefinedError` members already present in that union.

## Production notes

{{ comp callout { type: "important", title: "/cache and /discovery are server-only" } }}
<code>@netscript/sdk/cache</code> touches Deno KV and <code>@netscript/sdk/discovery</code> reads
<code>services__*</code> env on the server, so never import them into island or browser code.
Browsers resolve service URLs through the <code>VITE_</code>-mirrored keys that Aspire injects. The
query factory's cache reads happen in the server loader; the island receives hydrated state and a
<code>clientKey()</code> for invalidation only.
{{ /comp }}

{{ comp callout { type: "warning", title: "Invalidate with clientKey(), not key()" } }}
<code>key(props)</code> is the <strong>server</strong> KV cache key
(<code>[resource, action, serializedInput]</code>); <code>clientKey(props?)</code> is the
<strong>client</strong> TanStack key (prefix-matchable). Invalidate on the client with
<code>clientKey()</code> or <code>toClientKeyPrefix(...)</code>. A server <code>key()</code> passed to
<code>invalidateQueries</code> silently matches nothing.
{{ /comp }}

## Next steps

Resolve a service URL and call it end to end with [Discover services](/services-sdk/how-to/discover-services/).
See also the [`@netscript/sdk` reference](/reference/sdk/),
[Contracts](/explanation/contracts/), and [Data loading & the query cache](/web-layer/query/).
