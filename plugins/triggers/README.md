# @netscript/plugin-triggers

[![JSR](https://jsr.io/badges/@netscript/plugin-triggers)](https://jsr.io/@netscript/plugin-triggers)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The NetScript plugin that turns webhooks, cron schedules, and file-watch events into durable
background work — it contributes a plugin manifest that wires the trigger ingress HTTP service, the
cron and watcher runtimes, and Aspire resources into a NetScript app.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-triggers

# Node.js / Bun
npx jsr add @netscript/plugin-triggers
bunx jsr add @netscript/plugin-triggers
```

### Usage

The root entrypoint exposes the plugin manifest and a lifecycle-free inspection helper. A host
registers the manifest with its plugin runtime and can inspect it without invoking hooks:

```typescript
import {
  inspectTriggers,
  TRIGGERS_API_DEFAULT_PORT,
  triggersPlugin,
} from '@netscript/plugin-triggers';

const inspection = inspectTriggers(triggersPlugin);

console.log(inspection.name); // "@netscript/plugin-triggers"
console.log(inspection.axes); // contribution groups: services, aspire, e2e, ...
console.log(TRIGGERS_API_DEFAULT_PORT); // 8093
```

Application trigger definitions import the handler-first authoring DSL (`defineWebhook`,
`defineScheduledTrigger`, `defineFileWatch`, `enqueueJob`) from the sibling core package,
`@netscript/plugin-triggers-core`, not from this plugin.

---

## 📦 Key Capabilities

- **Ack-then-process ingress**: contributes the `triggers-api` HTTP service (default port `8093`)
  that verifies, records, and schedules webhook events asynchronously, returning `202` without
  waiting on handler execution.
- **Scheduled and file-watch runtimes**: wraps `@netscript/cron` and `@netscript/watchers` into
  cron-backed scheduled triggers and file-watch adapters.
- **T1 durability**: the shipped processor pipeline applies at-least-once delivery, retries,
  deduplication, dead-letter queueing, and a circuit breaker with explicit status transitions.
- **Cross-axis integration**: declares typed dependencies on the workers, streams, and sagas core
  packages so triggers can enqueue jobs, publish stream events, and start sagas.
- **Aspire and scaffolding contributions**: emits Aspire resources for trigger services and
  background workers, and generates handler-first trigger definition modules.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/triggers/](https://rickylabs.github.io/netscript/reference/triggers/)
- **Durable Workflows**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
