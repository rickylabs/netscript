# @netscript/plugin-sagas

[![JSR](https://jsr.io/badges/@netscript/plugin-sagas)](https://jsr.io/@netscript/plugin-sagas)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The deployable saga-orchestration plugin for NetScript: bind long-running workflows with
compensation, a Saga API service, CLI commands, and Aspire wiring through one manifest.**

The declarative manifest also carries saga runtime metadata and durable-stream contributions.

---

## 🚀 Quick Start

### Add it to a NetScript app

From the root of a generated NetScript project:

```bash
netscript plugin add saga
```

`plugin add` resolves `@netscript/plugin-sagas` from JSR and runs the plugin's own scaffolder — the
plugin owns its setup, so the CLI ships no embedded templates. The scaffolder wires the Saga API
service, saga runtime, stream topics, database schema, and Aspire resources into your workspace,
then pins the matching `@netscript/*` versions.

> **Provisioning:** sagas require Deno KV and optionally Postgres for durable state. `plugin add`
> records these requirements from the manifest so `netscript db` and Aspire orchestration provision
> them for you.

### Use it as a library

To consume the plugin programmatically (custom hosts, tests, tooling):

```bash
# Deno
deno add jsr:@netscript/plugin-sagas

# Node.js / Bun
npx jsr add @netscript/plugin-sagas
bunx jsr add @netscript/plugin-sagas
```

```typescript
import { inspectPlugin } from '@netscript/plugin';
import { sagasPlugin } from '@netscript/plugin-sagas';

// Hand the manifest to the host plugin loader.
export const plugins = [sagasPlugin];

// Inspect declared contribution axes without invoking lifecycle hooks.
const summary = inspectPlugin(sagasPlugin);
console.log(summary.target); // "@netscript/plugin-sagas"
console.log(summary.details.contributionGroups); // number of declared contribution groups
```

### Identity and service constants

The plugin re-exports its stable identity and API-service constants so hosts, scaffolding, and
Aspire wiring can reference them without hard-coding literals:

```typescript
import {
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_ID,
  sagasPlugin,
} from '@netscript/plugin-sagas';

console.log(SAGAS_PLUGIN_ID); // "sagas"
console.log(SAGAS_API_SERVICE_NAME); // "sagas-api"
console.log(SAGAS_API_DEFAULT_PORT); // 8092
console.log(sagasPlugin.name); // "@netscript/plugin-sagas"
```

---

## 📦 Key Capabilities

- **Declarative manifest**: `sagasPlugin` declares services, the saga runtime, stream topics,
  database schema, runtime-config topics, contract versions, E2E gates, and Aspire resources as
  typed contribution axes.
- **Durable orchestration**: define multi-step workflows with forward steps and compensations; saga
  state is persisted so in-flight workflows survive restarts and resume deterministically.
- **Runtime + metadata**: `./runtime` exposes the saga execution runtime; `./public` and `./plugin`
  expose the typed orchestration surface and host binding.
- **CLI surface**: `./cli` mounts the saga command group into the host CLI walker for inspecting and
  running saga definitions.
- **Durable streams + Aspire**: `./streams` exposes a StreamDB factory for saga entities; `./aspire`
  contributes the saga Aspire resource to the AppHost.

The reusable saga definition builders and runtime composition live in
`@netscript/plugin-sagas-core`; this package binds them to the host.

---

## 🧩 Install manifest

The plugin root ships `scaffold.plugin.json` — the declarative contract `plugin add` reads to
install the plugin. It is editor-validated through a bundled JSON Schema (`$schema`), so the
manifest gives you IntelliSense and validation in any schema-aware editor.

```jsonc
{
  "$schema": "...", // @netscript/plugin scaffold.plugin.schema.json
  "name": "@netscript/plugin-sagas",
  "provider": { "kind": "saga", "category": "background-processor" },
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
  [rickylabs.github.io/netscript/reference/sagas/](https://rickylabs.github.io/netscript/reference/sagas/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
