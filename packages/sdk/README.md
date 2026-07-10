# @netscript/sdk

[![JSR](https://jsr.io/badges/@netscript/sdk)](https://jsr.io/@netscript/sdk)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The client-side surface of a NetScript app: typed oRPC service clients, cache-aware query
factories, and TanStack Query utilities derived from one shared contract map, with service URLs
resolved through Aspire discovery.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/sdk

# Node.js / Bun
npx jsr add @netscript/sdk
bunx jsr add @netscript/sdk
```

Or pin it directly in your import map:

```json
{
  "imports": {
    "@netscript/sdk": "jsr:@netscript/sdk@^0.0.1-alpha.1"
  }
}
```

### Usage

```ts
import { defineServices } from '@netscript/sdk';
import { ordersContract } from './contracts/orders.ts';

// One contract map wires clients, server query factories, and frontend query utils.
const { clients, queries, queryUtils } = defineServices({
  orders: { contract: ordersContract },
});

// Direct oRPC call through the typed, discovery-aware service client.
const order = await clients.orders.get({ id: 'ord_123' });

// Cache-aware query factory for server or framework-neutral code.
const ordersQuery = queries.orders;

// TanStack Query utilities for browser / island consumers.
const ordersQueryUtils = queryUtils.orders;
```

Each entry defaults its `serviceName` and TanStack query path to the map key, so the call above
wires discovery, clients, and queries together. Drop to a focused subpath (`@netscript/sdk/client`,
`@netscript/sdk/query`, `@netscript/sdk/query-client`) when an app only needs part of the surface.

---

## 📦 Key Capabilities

- **Typed service clients**: `createServiceClient` builds a fully inferred oRPC client from a shared
  contract router — input/output types come from the contract, never duplicated.
- **Aspire service discovery**: `@netscript/sdk/discovery` resolves service URLs and database/KV
  connections from Aspire-injected environment variables, lazily at request time — no registry, no
  hardcoded ports.
- **Cache-aware query factories**: `createQueryFactory` and `createQueryFactories` generate
  server-side query helpers backed by the shared KV cache with stale-while-revalidate semantics.
- **TanStack Query integration**: `createNetScriptQueryClient` and `createServiceQueryUtils` give
  browser and island code server-first defaults, invalidation bridging, and KV-backed persistence.
- **Composition preset**: `defineServices` assembles clients, query factories, and query utils from
  one service map, while focused subpaths keep narrow imports lean.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/sdk/](https://rickylabs.github.io/netscript/reference/sdk/)
- **Services & SDK**:
  [rickylabs.github.io/netscript/services-sdk/](https://rickylabs.github.io/netscript/services-sdk/)
- **How-to — Discover services**:
  [rickylabs.github.io/netscript/how-to/discover-services/](https://rickylabs.github.io/netscript/how-to/discover-services/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
