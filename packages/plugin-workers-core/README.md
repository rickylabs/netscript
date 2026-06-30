# @netscript/plugin-workers-core

[![JSR](https://jsr.io/badges/@netscript/plugin-workers-core)](https://jsr.io/@netscript/plugin-workers-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The reusable worker primitives for NetScript: typestate builders that define jobs, tasks, and
workflows, plus the runtime that composes and drains them — the core that the deployable
`@netscript/plugin-workers` plugin binds to the host.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-workers-core

# Node.js / Bun
npx jsr add @netscript/plugin-workers-core
bunx jsr add @netscript/plugin-workers-core
```

### Usage

```typescript
import {
  createSuccessResult,
  defineJob,
  inspectJob,
  startWorkers,
} from '@netscript/plugin-workers-core';

// Define a job with the typestate builder.
const job = defineJob('send-email')
  .handler(() => createSuccessResult({ sent: true }))
  .topic('workers.mail')
  .build();

// Inspect the definition without starting a runtime.
console.log(inspectJob(job)); // { id: "send-email", kind: "job" }

// Start an in-process runtime, then drain and shut it down.
const runtime = await startWorkers();
await runtime.stop('done');
```

---

## 📦 Key Capabilities

- **Definition builders** (`./builders`): `defineJob`, `defineTask`, and `defineWorkflow` are
  typestate-gated builders — `build()` becomes available only after an entrypoint or handler is set,
  so invalid definitions fail at compile time.
- **Runtime composition**: `startWorkers()` (`./presets`) and `createWorkersRuntime()` (`./runtime`)
  assemble a runtime from injected registry, worker, and storage ports, with memory-backed defaults
  for tests and generated code.
- **Versioned contracts**: `./contracts/v1` exports the workers API contract and Standard Schema
  wrappers that the Tier 2 service plugin and generated registries bind against.
- **Pluggable adapters**: the `./registry`, `./state`, `./executor`, `./workflow`, `./shutdown`, and
  `./telemetry` subpaths expose ports and KV-backed implementations without pulling in
  `@netscript/config` or `@netscript/telemetry`; `./streams` carries the stream-integration
  contracts that bridge runs to durable topics.
- **Schemas, config, and extension stubs**: `./schemas` ships the public structural schemas for job
  and task definitions, `./config` the job/task configuration schemas, and `./abstracts` the
  stub-only abstract contracts that mark workers extension points.
- **Test primitives**: `./testing` ships memory adapters and fixtures so jobs, tasks, and workflows
  can be exercised with no filesystem, network, or subprocess permissions.

---

## 📖 Documentation

- **Reference** (workers family):
  [rickylabs.github.io/netscript/reference/workers/](https://rickylabs.github.io/netscript/reference/workers/)
- **Background Processing** (capability pillar):
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **Background jobs** (how-to):
  [rickylabs.github.io/netscript/capabilities/background-jobs/](https://rickylabs.github.io/netscript/capabilities/background-jobs/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
