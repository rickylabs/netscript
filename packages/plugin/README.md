# @netscript/plugin

[![JSR](https://jsr.io/badges/@netscript/plugin)](https://jsr.io/@netscript/plugin)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The plugin authoring contract for NetScript: a fluent `definePlugin` builder that assembles
type-safe plugin manifests, declares contribution axes (services, processors, stream topics,
schemas), and feeds them to host tooling that materializes Aspire resources.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin

# Node.js / Bun
npx jsr add @netscript/plugin
bunx jsr add @netscript/plugin
```

### Usage

```typescript
import { definePlugin, inspectPlugin } from '@netscript/plugin';

const plugin = definePlugin('@example/billing', '0.0.1-alpha.0')
  .withDescription('Billing service and invoice processor.')
  .withService({
    name: 'billing-api',
    entrypoint: 'services/api/main.ts',
  })
  .build();

console.log(inspectPlugin(plugin).summary);
```

`definePlugin(name, version)` returns a fluent `PluginBuilder`. Contribution methods such as
`.withService(...)` accumulate plain data; `.build()` produces a validated `PluginManifest` that
hosts read to generate files, runtime services, and AppHost resources.

---

## 📦 Key Capabilities

- **Manifest builder DSL**: `definePlugin` returns a chainable, type-narrowing `PluginBuilder` whose
  `.build()` yields a schema-validated `PluginManifest`.
- **Contribution vocabulary**: declare services, background processors, stream topics, database
  schemas, migrations, runtime-config topics, and telemetry as typed contribution axes.
- **Typed dependencies**: `.withDependencies({...})` registers sibling plugins by alias and threads
  a `DependencyContext` into contribution callbacks.
- **Diagnostics**: `inspectPlugin` returns a JSON-stable `InspectionReport` for manifests,
  registries, or path targets, with typed `PluginError` classes for invalid or duplicate
  definitions.
- **Subpath surfaces**: focused entrypoints for host tooling (`/config`), CLI command groups
  (`/cli`), discovery (`/sdk`), abstract bases (`/abstracts`), and test fixtures (`/testing`).

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/plugin/](https://rickylabs.github.io/netscript/reference/plugin/)
- **Orchestration & Runtime**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **Author a plugin**:
  [rickylabs.github.io/netscript/how-to/author-a-plugin/](https://rickylabs.github.io/netscript/how-to/author-a-plugin/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
