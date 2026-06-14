# `@netscript/fresh`

[![JSR](https://jsr.io/badges/@netscript/fresh)](https://jsr.io/@netscript/fresh)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![Fresh](https://img.shields.io/badge/framework-Fresh-ffdb1e?logo=deno&logoColor=111111)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

Page builders, typed route contracts, form helpers, durable-stream and query islands, and deferred
rendering primitives for Fresh applications in the NetScript ecosystem.

## Package role

`@netscript/fresh` is an **Archetype 4 (DSL/Builder)** package (see the doctrine archetype map and
[`docs/architecture.md`](./docs/architecture.md)). Its public product is a set of builders and typed
contracts — `definePage()`, `defineRouteContract()`, `defineFreshApp()`, plus form, query, and defer
factories — that turn page and route intent into Fresh runtime wiring.

The implementation lives under `src/` in doctrine role folders:

- `src/application/` — the builder DSLs and their contracts: `builders/`, `route/`, `form/`,
  `query/`, `defer/`, `vite/`, and the `cache-entries/` loader helpers.
- `src/runtime/` — behavior that runs: `server/` app bootstrap, `streams/` durable-stream client,
  and `interactive/` promise hooks.
- `src/diagnostics/` — `error/` normalization and display primitives.
- `src/testing/` — route and defer test fixtures.
- `src/internal/` — package-private telemetry.

The root `mod.ts` and the `server.ts`, `builders/mod.ts`, `route/mod.ts`, `query/mod.ts`, and
`config/vite.ts` files are thin re-export shells. They keep both the published subpath surface and
the NetScript CLI's local import map stable while the real code lives in `src/`.

## Install

```jsonc
// deno.json
{
  "imports": {
    "@netscript/fresh": "jsr:@netscript/fresh@^0.0.1-alpha.0",
    "@netscript/fresh/": "jsr:@netscript/fresh@^0.0.1-alpha.0/"
  }
}
```

The package is Deno-first and built for Fresh 2.

## Required permissions

`@netscript/fresh` is mostly a framework helper package, but several streaming and deferred
rendering helpers touch platform capabilities when used at runtime:

- `--allow-net` for deferred partial prewarm requests and durable stream endpoints.
- `--allow-env` when `@netscript/plugin-streams-core` resolves stream server URL or auth settings
  from environment variables.
- `--unstable-kv` for server-side SSE helpers that watch `Deno.Kv` keys or prefixes.

Type-checking package entrypoints should include `--unstable-kv` because the streaming server
helpers expose KV-aware types.

## Entry points

Import only the layer you need — the package is subpath-first.

| Import                          | Role        | Use it for                                  | Main exports                                                                                |
| ------------------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `@netscript/fresh`              | root        | Curated cross-cutting helpers               | `extractErrorData`, `errorHandler`, `hasAllCacheEntries`, `minCachedAt`, `projectCachedItemFromList` |
| `@netscript/fresh/builders`     | application | Page and partial builders                   | `definePage`, `definePartial`, `defineStatsPartial`                                         |
| `@netscript/fresh/route`        | application | Typed route contracts and links             | `defineRouteContract`, `paginationSearchSchema`, `createRouteReference`, `bindRoutePattern` |
| `@netscript/fresh/form`         | application | Form state, errors, and data pipeline       | `resolveFormState`, `toFormErrors`, `normalizeFormValues`, `createEmptyFormErrors`          |
| `@netscript/fresh/defer`        | application | Suspense-style deferred rendering           | `Deferred`, `DeferPage`, `DeferComponent`, `resolveDetailDeferConfig`                       |
| `@netscript/fresh/query`        | application | TanStack Query for Fresh islands            | `QueryIsland`, `getIslandQueryClient`, `useIslandQuery`, `useIslandMutation`, `useLiveQuery` |
| `@netscript/fresh/error`        | diagnostics | Normalized error extraction                 | `extractErrorData`, `ErrorData`, `ErrorPrimitives`                                          |
| `@netscript/fresh/streams`      | runtime     | Durable-stream client for E2E state         | `createNetScriptStreamDB`, `useLiveQuery`, `useLiveSuspenseQuery`                           |
| `@netscript/fresh/server`       | runtime     | Fresh app bootstrapping                      | `defineFreshApp`, `App`, `FreshConfig`                                                      |
| `@netscript/fresh/interactive`  | runtime     | Promise utilities for interactive flows     | `usePromise`, `resolvedPromise`                                                             |
| `@netscript/fresh/vite`         | application | NetScript Vite integration                  | `createNetScriptVitePlugin`                                                                 |
| `@netscript/fresh/testing`      | testing     | Route and defer test fixtures               | `createMockRouteContext`, `createMockDeferPolicy`                                           |

The root entrypoint stays intentionally small: it re-exports error handling and the cache-entry
loader helpers so existing apps can keep their current imports. New code should prefer the explicit
subpaths.

## Quick start

Define a page with a typed route contract and pagination:

```tsx
import { definePage } from "@netscript/fresh/builders";
import { defineRouteContract, paginationSearchSchema } from "@netscript/fresh/route";

const ordersRoute = defineRouteContract({
  searchSchema: paginationSearchSchema({
    defaultLimit: 20,
    defaultSort: "createdAt",
    defaultOrder: "desc",
  }),
});

export const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withMeta(() => ({
    title: "Orders",
    description: "Browse the current order queue.",
  }))
  .build();
```

## Usage

### Form error normalization

Parse Zod validation errors into a flat form-field error map:

```ts
import { createEmptyFormErrors, toFormErrors } from "@netscript/fresh/form";

// Start with a clean state
const empty = createEmptyFormErrors<{ email: string; password: string }>();

// Convert a Zod error into per-field messages
const errors = toFormErrors(zodError);
// { email: ["Invalid email"], password: ["Too short"] }
```

### Deferred rendering

Render placeholder content while an async operation completes:

```tsx
import { Deferred } from "@netscript/fresh/defer";

export function RecentOrdersPanel() {
  return (
    <Deferred
      promise={fetch("/api/orders/recent").then((r) => r.json())}
      fallback={<p>Loading…</p>}
    >
      {(orders) => (
        <ul>
          {orders.map((o) => <li key={o.id}>{o.reference}</li>)}
        </ul>
      )}
    </Deferred>
  );
}
```

### Route references and typed links

Generate type-safe URLs and link props from route contracts:

```ts
import { createRouteReference, defineRouteContract } from "@netscript/fresh/route";

const userRoute = defineRouteContract({ path: "/users/:id" });
const userRef = createRouteReference(userRoute, "/users/:id");

// Produce a typed href
const href = userRef.href({ id: "usr_1" }); // "/users/usr_1"

// Produce link props for an <a> element
const props = userRef.getLinkProps({ id: "usr_1" });
```

### Query islands

Island code imports TanStack Query through `@netscript/fresh/query` rather than
`@tanstack/preact-query` directly, so the dependency stays centralized:

```tsx
import { QueryIsland, useIslandQuery } from "@netscript/fresh/query";

function OrderCount() {
  const { data } = useIslandQuery({
    queryKey: ["orders", "count"],
    queryFn: () => fetch("/api/orders/count").then((r) => r.json()),
  });
  return <span>{data?.count ?? "…"}</span>;
}

export default function OrdersIsland() {
  return (
    <QueryIsland>
      <OrderCount />
    </QueryIsland>
  );
}
```

### Bootstrap a Fresh app

```ts
import { defineFreshApp } from "@netscript/fresh/server";

export default defineFreshApp({
  // Fresh app configuration
});
```

## Validation

From the package directory:

```sh
deno task check      # type-check shells + src roots (no-slow-types-safe public surface)
deno task test       # unit tests across ./src and ./tests
deno task lint
deno task fmt:check
deno task doc-lint   # JSDoc lint for the public entrypoints
deno task dry-run    # deno publish --dry-run
```

## Docs

- [`docs/architecture.md`](./docs/architecture.md) — archetype, `src/` role layering, and subpath
  conventions
- [`docs/concepts.md`](./docs/concepts.md) — builders, route contracts, forms, and deferred
  rendering
- [`docs/getting-started.md`](./docs/getting-started.md) — first page and route
- [`docs/form/`](./docs/form/) — the form subsystem in depth

## Resources

- [`@netscript/fresh-ui`](https://jsr.io/@netscript/fresh-ui) — interactive UI primitives and
  copy-source registry components
- [`@netscript/sdk`](https://jsr.io/@netscript/sdk) — service clients and cache-backed queries used
  in page loaders
- [Fresh documentation](https://fresh.deno.dev/docs/)
- [Preact documentation](https://preactjs.com/guide/v10/getting-started)

## License

MIT
