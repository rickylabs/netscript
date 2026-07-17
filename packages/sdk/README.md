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
    "@netscript/sdk": "jsr:@netscript/sdk"
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

### Desktop auto-update

Window-only applications can start signed native update checks through the stable SDK seam:

```ts
import { startAutoUpdate } from '@netscript/sdk/auto-update';

const update = startAutoUpdate({
  release: {
    baseUrl: 'https://releases.example.com/my-app',
    publicKey: 'base64-ed25519-public-key',
    manualUpdateUrl: 'https://example.com/downloads/my-app',
  },
  policy: { checkOnLaunch: true, intervalMs: 60 * 60 * 1_000 },
  onUpdateReady(event) {
    if (event.applyMode === 'manual') {
      console.error(`Install the staged update from ${event.manualUpdateUrl}`);
    }
  },
  onRollback(event) {
    console.error(`Update rolled back: ${event.reason}`);
  },
});

if (update.status === 'disabled') {
  console.error(`Native updates unavailable: ${update.reason}`);
}
```

The app-pinned release and manual-installer URLs must use HTTPS. The native Deno Desktop runtime
owns manifest fetching, Ed25519 verification, patch staging, and writable-install checks; using this
API therefore permits network access and native application-file updates. Under plain `deno run` the
seam returns `disabled` without network access. Windows currently reports a staged update through
the manual-installer event because upstream cannot apply it automatically; macOS and Linux apply on
relaunch. Real packaged apply/rollback proof is tracked by #457.

### Desktop RPC bindings

Inside a Deno Desktop webview, reuse the same contract as the runtime router without declaring a
parallel `bindings.d.ts` surface:

```ts
import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import { ordersContract } from './contracts/orders.ts';

const orders = createDesktopServiceClient({ contract: ordersContract });
const order = await orders.get({ id: 'ord_123' });
```

The SDK resolves the default `__netscript_rpc__` webview binding lazily, adapts it to oRPC's
MessagePort link, and preserves oRPC's default string/binary serialization. `Uint8Array` is the only
native binary payload; transfer lists, `ArrayBuffer`, and other typed arrays are intentionally not
advertised because Deno's bind channel does not preserve them. Bind handlers execute with the Deno
process's permissions, so runtime routers must validate inputs and authorization at the same trust
boundary as any other privileged service entrypoint.

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
- **Outbound RPC tracing**: service clients wrap each call in an oRPC CLIENT span and inject the W3C
  `traceparent` header into the outgoing request, so client and server spans join one distributed
  trace per the #402 telemetry convention (`netscript.*` vs semconv). The middleware type surface
  lives on `@netscript/sdk/telemetry`.
- **Native auto-update configuration**: `@netscript/sdk/auto-update` validates the app-pinned
  release endpoint and Ed25519 key, resolves the current Deno Desktop `os-arch` release URL, and
  exposes typed staged/manual and rollback events without leaking moving runtime globals.
- **Type-safe Desktop RPC**: `@netscript/sdk/desktop` adapts a per-window Deno bind channel to a
  real MessagePort and oRPC `RPCLink`, preserving the existing service contract without ambient
  webview declarations.

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

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
