# @netscript/plugin-streams

[![JSR](https://jsr.io/badges/@netscript/plugin-streams)](https://jsr.io/@netscript/plugin-streams)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The durable-streams plugin for NetScript. It binds the host plugin system to a Durable Streams
service, CLI commands, and Aspire process wiring through a single declarative manifest — a
self-contained streaming utility with no database of its own.**

---

## 🚀 Quick Start

### Add it to a NetScript app

From the root of a generated NetScript project:

```bash
netscript plugin add stream
```

`plugin add` resolves `@netscript/plugin-streams` from JSR and runs the plugin's own scaffolder —
the plugin owns its setup, so the CLI ships no embedded templates. The scaffolder wires the Durable
Streams service and Aspire resources into your workspace, then pins the matching `@netscript/*`
versions.

> **No extra infrastructure:** streams is a self-contained utility — it requires neither Postgres
> nor Deno KV, so `plugin add` installs it without provisioning a database.

### Use it as a library

To consume the plugin programmatically (custom hosts, tests, tooling):

```bash
# Deno
deno add jsr:@netscript/plugin-streams

# Node.js / Bun
npx jsr add @netscript/plugin-streams
bunx jsr add @netscript/plugin-streams
```

```typescript
import { streamsPlugin } from '@netscript/plugin-streams';

// Hand the manifest to the host plugin loader.
export const plugins = [streamsPlugin];

// The manifest is data — read its declared contribution axes without booting a service.
console.log(streamsPlugin.name); // "@netscript/plugin-streams"
console.log(Object.keys(streamsPlugin.contributions)); // ["services", "contractVersions", ...]
```

### Typed topics, producers, and consumers

The manifest-layer stream API defines typed topics and derives producer/consumer handles from them.
The handles are wiring stubs — runtime IO throws `StreamUnsupportedOperationError`, so bind
`@netscript/plugin-streams-core` for actual publishing:

```typescript
import {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
} from '@netscript/plugin-streams';

type OrderPlaced = { orderId: string; total: number };

const topic = defineStreamTopic<OrderPlaced>('orders.placed', {
  '~standard': { version: 1, vendor: 'orders', validate: (value: unknown) => value },
});

const producer = defineStreamProducer(topic);
const consumer = defineStreamConsumer(topic);

console.log(topic.name); // "orders.placed"
// `producer.publish` / `consumer.subscribe` are typed to `OrderPlaced`.
void producer;
void consumer;
```

---

## 📦 Key Capabilities

- **Declarative manifest**: `streamsPlugin` declares the Durable Streams service, contract versions,
  E2E gates, and Aspire resources as typed contribution axes.
- **Durable streams service**: a deployable streaming service exposing durable, replayable topics
  for other plugins and your own application code to publish to and consume from.
- **CLI surface**: `./cli` mounts the streams command group into the host CLI walker.
- **Aspire wiring**: `./aspire` contributes the streams Aspire resource to the AppHost so the
  service runs as part of local orchestration.
- **Self-contained**: no database migrations and no KV requirement — the plugin runs as a standalone
  service utility.

`@netscript/plugin-streams-core` provides the producer and schema primitives; this package wires the
streams service into the host.

---

## 🧩 Install manifest

The plugin root ships `scaffold.plugin.json` — the declarative contract `plugin add` reads to
install the plugin. It is editor-validated through a bundled JSON Schema (`$schema`), so the
manifest gives you IntelliSense and validation in any schema-aware editor.

```jsonc
{
  "$schema": "...", // @netscript/plugin scaffold.plugin.schema.json
  "name": "@netscript/plugin-streams",
  "provider": { "kind": "stream", "category": "plugin" },
  "capabilities": {
    "hasDatabaseMigrations": false,
    "hasRoutes": false,
    "hasBackgroundWorkers": false
  },
  "scaffolder": { "export": "./scaffold" }
}
```

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/streams/](https://rickylabs.github.io/netscript/reference/streams/)
- **Durable Streams**:
  [rickylabs.github.io/netscript/durable-streams/](https://rickylabs.github.io/netscript/durable-streams/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
