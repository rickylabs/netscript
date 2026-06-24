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

Define a typed, paginated page from a route contract. Each capability lives on an explicit subpath,
so you import only the layer you need:

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

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
