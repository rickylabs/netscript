# @netscript/plugin-workers

[![JSR](https://jsr.io/badges/@netscript/plugin-workers)](https://jsr.io/@netscript/plugin-workers)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The deployable background-workers plugin for NetScript. It binds the host plugin system to
background jobs, multi-runtime task execution, workflows, a Workers API service, CLI commands,
durable streams, and Aspire process wiring through a single declarative manifest.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-workers

# Node.js / Bun
npx jsr add @netscript/plugin-workers
bunx jsr add @netscript/plugin-workers
```

### Usage

Register the plugin manifest with the NetScript host. The manifest is data: loading it wires the
service, background processors, stream topics, and Aspire resources without starting a worker
process.

```typescript
import { inspectWorkers, workersPlugin } from '@netscript/plugin-workers';

// Hand the manifest to the host plugin loader.
export const plugins = [workersPlugin];

// Inspect declared contribution axes without invoking lifecycle hooks.
const summary = inspectWorkers();
console.log(summary.name); // "@netscript/plugin-workers"
console.log(summary.axes); // ["services", "backgroundProcessors", "streamTopics", ...]
```

---

## 📦 Key Capabilities

- **Declarative manifest**: `workersPlugin` declares services, background processors, stream topics,
  database schema, runtime-config topics, contract versions, E2E gates, and Aspire resources as
  typed contribution axes.
- **Runtime processes**: the `./worker` subpath exposes the `Worker` consumer and cron `Scheduler`
  classes; `./services` exposes the Workers API service (`workers-api`, port `8091`).
- **CLI surface**: `./cli` mounts the `WorkersCli` command group (`add-job`, `add-task`, `run`,
  `list-jobs`, `compile-registry`, and more) into the host CLI walker.
- **Multi-runtime tasks**: jobs and tasks run across Deno, PowerShell, Python, and shell runtimes
  with at-least-once delivery keyed on `idempotencyKey`.
- **Durable streams + Aspire**: `./streams` exposes a StreamDB factory for execution and job
  entities; `./aspire` contributes `WorkersAspireContribution` to the AppHost.

The reusable job/task/workflow definition builders and runtime composition live in
`@netscript/plugin-workers-core`; this package binds them to the host.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/workers/](https://rickylabs.github.io/netscript/reference/workers/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **How-to (roll out runtime overrides)**:
  [rickylabs.github.io/netscript/how-to/roll-out-runtime-overrides/](https://rickylabs.github.io/netscript/how-to/roll-out-runtime-overrides/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
