# @netscript/plugin-streams

[![JSR](https://jsr.io/badges/@netscript/plugin-streams)](https://jsr.io/@netscript/plugin-streams)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The NetScript plugin manifest for the Durable Streams service. Registers a change-data stream
service into your app and exposes typed topic, producer, and consumer authoring helpers — plus CLI,
scaffolding, E2E, and Aspire integration entrypoints.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-streams

# Node.js / Bun
npx jsr add @netscript/plugin-streams
bunx jsr add @netscript/plugin-streams
```

### Usage

```typescript
import {
  defineStreamConsumer,
  defineStreamProducer,
  defineStreamTopic,
  streamsPlugin,
} from '@netscript/plugin-streams';

// Register the Durable Streams service into your NetScript app config.
export const plugins = [streamsPlugin];

// Author a typed topic, then derive producer and consumer handles for it.
const orderSchema = {
  '~standard': {
    version: 1,
    vendor: 'app',
    validate: (value: unknown) => ({ value }),
  },
} as const;

const orders = defineStreamTopic('orders', orderSchema);
const producer = defineStreamProducer(orders);
const consumer = defineStreamConsumer(orders);
```

---

## 📦 Key Capabilities

- **Plugin manifest**: `streamsPlugin` contributes the Durable Streams development service,
  telemetry, and E2E gates to a NetScript app through the standard plugin contribution contract.
- **Typed topic authoring**: `defineStreamTopic`, `defineStreamProducer`, and `defineStreamConsumer`
  produce typed `StreamTopicDefinition`, `StreamProducerHandle`, and `StreamConsumerHandle` values
  at the manifest layer.
- **Framework integration entrypoints**: dedicated sub-path exports for `/cli`, `/scaffolding`,
  `/e2e`, and `/aspire` wire the plugin into the CLI command group, scaffolder, end-to-end gates,
  and the Aspire AppHost.
- **Telemetry-aware**: contributes stream publish, consume, and subscribe instrumentation through
  the NetScript telemetry host.
- **Core runtime separation**: schema, durable producers, and configuration primitives
  (`createDurableStream`, `defineStreamSchema`) live in the supporting
  `@netscript/plugin-streams-core` package.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/streams/](https://rickylabs.github.io/netscript/reference/streams/)
- **Durable Workflows**:
  [rickylabs.github.io/netscript/durable-workflows/](https://rickylabs.github.io/netscript/durable-workflows/)
- **How-to: Publish a durable stream**:
  [rickylabs.github.io/netscript/how-to/publish-a-durable-stream/](https://rickylabs.github.io/netscript/how-to/publish-a-durable-stream/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
