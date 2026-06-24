# @netscript/plugin-sagas

[![JSR](https://jsr.io/badges/@netscript/plugin-sagas)](https://jsr.io/@netscript/plugin-sagas)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The operational layer for durable sagas in NetScript: the plugin manifest, the runtime runner and
supervisor, the HTTP publisher SDK, the versioned API contract, and the browser-safe stream surface.
The saga DSL itself lives in `@netscript/plugin-sagas-core`.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-sagas

# Node.js / Bun
npx jsr add @netscript/plugin-sagas
bunx jsr add @netscript/plugin-sagas
```

### Usage

Application services publish messages to the sagas API through the plugin's HTTP publisher. The
publisher resolves the Aspire service URL automatically; inject a `fetcher` only in tests to avoid a
running service.

```typescript
import { createSagaPublisher } from '@netscript/plugin-sagas/runtime';
import type { SagaCorrelationKey } from '@netscript/plugin-sagas/runtime';

const publisher = createSagaPublisher({
  baseUrl: 'http://127.0.0.1:8092',
});

const correlationKey = 'order:ord_123' as SagaCorrelationKey;

const result = await publisher.publish({
  type: 'orders.created',
  payload: { orderId: 'ord_123' },
  correlationKey,
  idempotencyKey: 'orders.created:ord_123',
});

if (!result.published) {
  throw new Error(`saga publish rejected: ${result.reason}`);
}
```

---

## 📦 Key Capabilities

- **Plugin manifest**: contributes the typed `sagasPlugin` manifest, stable identifiers, and
  `inspectSagas` for host integration through the root entrypoint.
- **Runtime runner and supervisor**: `startSagaRunner` and `SagaRuntimeSupervisor` own one saga
  runtime process lifecycle, loading the generated static registry and waiting for platform-safe
  shutdown.
- **HTTP publisher SDK**: `createSagaPublisher` gives application code an at-least-once,
  idempotency-keyed publish path to the sagas API on `@netscript/plugin-sagas/runtime`.
- **Durable state backends**: select `KvSagaStore` (Deno KV) or `PrismaSagaStore` per process, with
  KV-backed idempotency reservations and applied-key guards for duplicate suppression.
- **Aspire, contract, and streams**: registers `sagas-api` and `sagas-runner` resources, exposes the
  versioned `sagasContract`, and emits a browser-safe saga instance stream DB for live UI state.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/sagas/](https://rickylabs.github.io/netscript/reference/sagas/)
- **Durable Workflows**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)
- **Storefront tutorial (durable checkout saga)**:
  [rickylabs.github.io/netscript/tutorials/storefront/](https://rickylabs.github.io/netscript/tutorials/storefront/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
