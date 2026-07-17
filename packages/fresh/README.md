# @netscript/fresh

[![JSR](https://jsr.io/badges/@netscript/fresh)](https://jsr.io/@netscript/fresh)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The Fresh 2 web layer for NetScript: typed route contracts, fluent page builders, managed forms,
query and durable-stream islands, and deferred streaming SSR, exposed as focused subpath imports.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/fresh

# Node.js / Bun
npx jsr add @netscript/fresh
bunx jsr add @netscript/fresh
```

### Usage

With the NetScript Vite plugin enabled, the route binding is **codegen-owned**: you author the
contract body and the plugin inserts the binding call from the page module's path under `routes/`.
Three authoring forms converge on the same generated `routes.<key>` tree.

**Form A — inline contract.** Write `.withRouteContract({ pathSchema?, searchSchema? })`; the
generator inserts `$route: routePatterns.<key>.$route` and the `routePatterns` import:

```typescript
import { z } from 'zod';
import { definePage } from '@netscript/fresh/builders';

// routes/orders/[id].tsx — you write only the contract body.
export const ordersDetailPage = definePage()
  .withRouteContract({
    pathSchema: z.object({ id: z.string().min(1) }),
  })
  .withMeta(() => ({ title: 'Order' }))
  .build();
```

**Form B — sidecar contract.** Put the contract in a sibling `routes/orders/[id].route.ts`; the
generator inserts `.withRoute(routes.orders.$id.$route)` and the `routes` import. **Form C — no
contract.** Write neither; the generator inserts a default `.withRoute(routes.<key>.$route)` backed
by `createRouteReference`. Set the Vite plugin option `pageModuleRouteBinding: false` to opt out and
keep hand-written bindings.

The manual `bindRoutePattern(...)` + `.withRoute(...)` form below still works and is what the
generator emits under the hood. Prefer Form A/B/C when the Vite plugin is enabled; reach for the
manual form only for ad-hoc routes built outside the codegen flow:

```typescript
import { definePage } from '@netscript/fresh/builders';
import {
  bindRoutePattern,
  defineRouteContract,
  paginationSearchSchema,
} from '@netscript/fresh/route';

// Bind the contract to a concrete route pattern before handing it to the builder.
const ordersRoute = bindRoutePattern(
  defineRouteContract({
    searchSchema: paginationSearchSchema({
      defaultLimit: 20,
      defaultSort: 'createdAt',
      defaultOrder: 'desc',
    }),
  }),
  '/orders',
);

export const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withMeta(() => ({
    title: 'Orders',
    description: 'Browse the current order queue.',
  }))
  .build();
```

Type-checking entrypoints should include `--unstable-kv`, since the streaming server helpers expose
KV-aware types.

### Desktop RPC composition

Deno Desktop composition roots can bind an existing oRPC router to one native window. Browser and
Aspire processes return an explicit disabled lifecycle without registering a binding:

```typescript
import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';

const desktopRpc = bindDesktopRpcWindow({
  window: desktopWindow,
  router: ordersRouter,
  context: {},
});

// Safe for both active and disabled lifecycles.
await desktopRpc.close();
```

Each call owns isolated per-window transport state. The adapter upgrades a real `MessagePort` with
oRPC before registering the promise-based native handler, and unbinds exactly once during cleanup.
It does not create windows, declare ambient webview bindings, or enable transfer-list serialization.

---

## 📦 Key Capabilities

- **Typed route contracts**: `defineRouteContract`, `paginationSearchSchema`, and `bindRoutePattern`
  give path and search params a single typed source consumed by pages, links, and navigation
  helpers.
- **Fluent page builders**: `definePage()` and `definePartial()` compose route, metadata, handlers,
  layers, and forms into a Fresh route through a chainable, fully typed builder.
- **Managed forms**: the `Form` component plus `createStandardSchemaAdapter`, CSRF helpers, and
  intent encoding deliver progressively enhanced, server-validated forms over any Standard Schema.
- **Islands**: `QueryIsland` with TanStack Query hooks and `createNetScriptStreamDB` with live-query
  hooks wire cache-first and durable-stream data into client islands.
- **Streaming and defer**: `defineFreshApp` bootstraps the app, `renderToStream` powers Suspense
  SSR, and `DeferPage`/`Deferred` defer regions under a resolvable freshness policy.
- **Desktop RPC**: `@netscript/fresh/desktop` binds an existing oRPC router to one Deno Desktop
  window while remaining inert in browser and Aspire processes.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/fresh/](https://rickylabs.github.io/netscript/reference/fresh/)
- **Web Layer**:
  [rickylabs.github.io/netscript/web-layer/](https://rickylabs.github.io/netscript/web-layer/)
- **How-to: server-validated form**:
  [rickylabs.github.io/netscript/how-to/build-a-server-validated-form/](https://rickylabs.github.io/netscript/how-to/build-a-server-validated-form/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
