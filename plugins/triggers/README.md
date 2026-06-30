# @netscript/plugin-triggers

[![JSR](https://jsr.io/badges/@netscript/plugin-triggers)](https://jsr.io/@netscript/plugin-triggers)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The deployable trigger-processing plugin for NetScript. It binds the host plugin system to webhook
ingress, the durable trigger processor runtime, a Triggers API service, CLI commands, durable
streams, and Aspire process wiring through a single declarative manifest.**

---

## 🚀 Quick Start

### Add it to a NetScript app

From the root of a generated NetScript project:

```bash
netscript plugin add trigger
```

`plugin add` resolves `@netscript/plugin-triggers` from JSR and runs the plugin's own scaffolder —
the plugin owns its setup, so the CLI ships no embedded templates. The scaffolder wires the Triggers
API service, the trigger processor runtime, stream topics, database schema, and Aspire resources
into your workspace, then pins the matching `@netscript/*` versions.

> **Provisioning:** triggers require Deno KV and optionally Postgres. `plugin add` records these
> requirements from the manifest so `netscript db` and Aspire orchestration provision them for you.

### Use it as a library

To consume the plugin programmatically (custom hosts, tests, tooling):

```bash
# Deno
deno add jsr:@netscript/plugin-triggers

# Node.js / Bun
npx jsr add @netscript/plugin-triggers
bunx jsr add @netscript/plugin-triggers
```

```typescript
import { inspectTriggers, triggersPlugin } from '@netscript/plugin-triggers';

// Hand the manifest to the host plugin loader.
export const plugins = [triggersPlugin];

// Inspect declared contribution axes without invoking lifecycle hooks.
const summary = inspectTriggers(triggersPlugin);
console.log(summary.name); // "@netscript/plugin-triggers"
console.log(summary.axes); // ["services", "backgroundProcessors", "streamTopics", ...]
```

---

## 📦 Key Capabilities

- **Declarative manifest**: `triggersPlugin` declares services, the trigger processor, stream
  topics, database schema, runtime-config topics, contract versions, E2E gates, and Aspire resources
  as typed contribution axes.
- **Webhook ingress + processor runtime**: the `./runtime` subpath exposes the trigger processor
  (`createRuntimeTriggerProcessor`) plus KV-backed event store, idempotency, and dead-letter
  adapters; webhook, scheduled, and file-watch are the runtime trigger kinds it drains and
  dispatches with at-least-once delivery.
- **High concurrency**: the processor defaults to a concurrency of 10 (`TRIGGER_CONCURRENCY`) for
  fan-out workloads.
- **Triggers API service**: `./services` exposes the Triggers API service (`triggers-api`, port
  `8093`) backing trigger and event introspection over the versioned contract.
- **CLI surface**: `./cli` mounts the trigger command group into the host CLI walker; `./public` and
  `./plugin` expose the typed trigger surface and host binding.
- **Durable streams + Aspire**: `./streams` exposes a StreamDB factory for trigger entities;
  `./aspire` contributes the trigger Aspire resource to the AppHost.

The reusable trigger definition builders and runtime composition live in
`@netscript/plugin-triggers-core`, which defines the handler-first DSL and runtime ports
(`TriggerIngressPort`, `TriggerProcessorPort`, `TriggerEventStorePort`, and siblings); this package
binds them to the host.

---

## 🧩 Install manifest

The plugin root ships `scaffold.plugin.json` — the declarative contract `plugin add` reads to
install the plugin. It is editor-validated through a bundled JSON Schema (`$schema`), so the
manifest gives you IntelliSense and validation in any schema-aware editor.

```jsonc
{
  "$schema": "...", // @netscript/plugin scaffold.plugin.schema.json
  "name": "@netscript/plugin-triggers",
  "provider": { "kind": "trigger", "category": "background-processor" },
  "capabilities": {
    "hasDatabaseMigrations": true,
    "hasRoutes": true,
    "hasBackgroundWorkers": true
  },
  "scaffolder": { "export": "./scaffold" }
}
```

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/triggers/](https://rickylabs.github.io/netscript/reference/triggers/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
