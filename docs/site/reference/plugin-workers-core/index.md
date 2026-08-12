---
layout: layouts/base.vto
title: "@netscript/plugin-workers-core"
---

# `@netscript/plugin-workers-core`

Job, task, workflow, runtime, config, and testing primitives for NetScript workers plugins. This page
is written against the package's public surface reported by `deno doc`. For the full index of
packages and plugins return to the [reference overview](/reference/).

Background-job definitions fail in two places: at definition time, when a job is missing an
execution target and nobody notices until production; and at runtime, when the executor and its
storage are welded together and untestable. This package attacks both. `defineJob`, `defineTask`,
and `defineWorkflow` are **typestate-gated** builders — `build()` only exists once an entrypoint or
handler is set, so an incomplete definition is a compile error rather than a runtime surprise. The
runtime composes from injected registry, worker, and storage ports with memory-backed defaults, so
the same definitions run in production and in permission-free tests.

This is the core that the deployable [`@netscript/plugin-workers`](/reference/workers/) plugin binds
to a NetScript host. Use it directly for custom hosts, libraries, and tests.

## Entrypoints

The package publishes seventeen entrypoints. The root path carries the authoring surface; the
subpaths expose the runtime layers a host composes.

| Export specifier | Module | Exports | Purpose |
| --- | --- | --- | --- |
| `@netscript/plugin-workers-core` | `./mod.ts` | 32 | The authoring surface — the three typestate builders, handler results and tools, schedule and permission presets, inspection, and the runtime entry points (documented below). |
| `@netscript/plugin-workers-core/builders` | `./src/builders/mod.ts` | 28 | The builder layer behind the DSL, including the builder-state types tooling needs. |
| `@netscript/plugin-workers-core/runtime` | `./src/runtime/mod.ts` | 132 | The full runtime: `createWorkersRuntime`, the in-process dispatcher and runner, execution records, and `resolveWorkerIdempotencyKey`. |
| `@netscript/plugin-workers-core/presets` | `./src/presets/mod.ts` | 28 | `startWorkers` and the runtime port shapes its default composition fills in. |
| `@netscript/plugin-workers-core/executor` | `./src/executor/mod.ts` | 33 | The multi-runtime task executor and its per-runtime adapters (Deno, .NET, `cmd`, generic executable) plus `runProcess`. |
| `@netscript/plugin-workers-core/workflow` | `./src/workflow/mod.ts` | 27 | The workflow builder, workflow events, workflow clock, and an in-memory workflow state store. |
| `@netscript/plugin-workers-core/registry` | `./src/registry/mod.ts` | 22 | KV-backed job and task registries with their filter and selector types. |
| `@netscript/plugin-workers-core/state` | `./src/state/mod.ts` | 9 | Execution state: records, statuses, trigger types, and the KV execution state store. |
| `@netscript/plugin-workers-core/stores` | `./src/stores/mod.ts` | 14 | The KV-backed worker idempotency store and its atomic KV primitives. |
| `@netscript/plugin-workers-core/streams` | `./src/streams/mod.ts` | 20 | Durable stream projection of executions and jobs (`workersStreamSchema`, `createWorkersStreamProducer`, the mutation hook). |
| `@netscript/plugin-workers-core/shutdown` | `./src/shutdown/mod.ts` | 5 | `ShutdownManager` and the resource/report types behind graceful drain. |
| `@netscript/plugin-workers-core/schemas` | `./src/domain/public-schema.ts` | 13 | Public structural schemas for worker definitions. |
| `@netscript/plugin-workers-core/contracts/v1` | `./src/contracts/v1/mod.ts` | 27 | Version 1 workers API schemas and contract route types (`workersContract`, `workersContractV1`). |
| `@netscript/plugin-workers-core/config` | `./src/config/mod.ts` | 32 | `defineWorkers`, `defineJobs`, and the queue-provider configuration schemas. |
| `@netscript/plugin-workers-core/telemetry` | `./src/telemetry/mod.ts` | 26 | Worker instrumentation abstractions and `applyWorkerInstrumentations`. |
| `@netscript/plugin-workers-core/abstracts` | `./src/abstracts/mod.ts` | 31 | Abstract runtime contracts and reserved extension-point base classes. |
| `@netscript/plugin-workers-core/testing` | `./src/testing/mod.ts` | 46 | `createTestWorkersRuntime` plus job, result, and execution-record fixtures. |

Export counts are the symbol counts `deno doc` reports for each entrypoint; the layered subpaths
re-export shared vocabulary, so the counts overlap rather than sum.

## Root surface (`@netscript/plugin-workers-core`)

### Definition builders

Each builder is typestate-gated: `build()` becomes available only after the definition is complete.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineJob` | function | Start a worker job definition chain. |
| `JobBuilder` | interface | Root-surface job builder typestate API. |
| `JobDefinition` | type alias | Root-surface job definition derived from the thin public schema. |
| `defineJobHandler` | function | Define a worker job handler. |
| `JobHandlerContext` | type alias | Context passed to root-surface job handlers. |
| `JobResult` | type alias | Result returned by worker job handlers. |
| `JobId` | type alias | Branded worker job identifier. |
| `defineTask` | function | Start a worker task definition chain. |
| `TaskBuilder` | interface | Root-surface task builder typestate API. |
| `TaskDefinition` | type alias | Root-surface task definition derived from the thin public schema. |
| `TaskId` | type alias | Branded worker task identifier. |
| `defineWorkflow` | function | Start a worker workflow definition chain. |
| `WorkflowBuilder` | interface | Root-surface workflow builder typestate API. |
| `WorkflowDefinition` | type alias | Root-surface workflow definition derived from the thin public schema. |

Jobs and tasks both accept either an in-process handler or a runtime-specific entrypoint; workflows
sequence their definitions. The three builders share the same typestate discipline.

### Handler results and tools

| Symbol | Kind | Description |
| --- | --- | --- |
| `createSuccessResult` | function | Create a successful job result. |
| `createFailureResult` | function | Create a failed job result. |
| `createJobTools` | function | Create handler tools backed by the active worker telemetry context. |
| `JobTools` | type alias | Runtime tools exposed to worker job handlers. |
| `JobToolSpan` | type alias | Span operations exposed to worker job handlers. |

`JobTools` is how a handler reaches telemetry without importing an SDK: the span operations it
exposes are bound to the active worker instrumentation context.

### Schedules and permissions

| Symbol | Kind | Description |
| --- | --- | --- |
| `cron` | variable | Cron schedule helpers for worker jobs. |
| `CronHelpers` | type alias | Cron schedule helper surface for worker jobs. |
| `permissions` | variable | Permission presets for worker jobs and tasks. |
| `PermissionPresets` | type alias | Worker permission preset surface for common job execution modes. |

### Runtime

| Symbol | Kind | Description |
| --- | --- | --- |
| `startWorkers` | function | Create and start a workers runtime using default composition. |
| `createWorkersRuntime` | function | Create an unstarted workers runtime with the root surface's minimal options. |

Two entry styles for one runtime: root `startWorkers()` creates and starts the memory-backed preset,
while root `createWorkersRuntime()` creates the same runtime without starting it. Import
`createWorkersRuntime` from `/runtime` when registries, executors, storage, or other runtime ports
must be injected explicitly.

### Inspection

| Symbol | Kind | Description |
| --- | --- | --- |
| `inspectJob` | function | Inspect a job definition without starting a runtime. |
| `inspectTask` | function | Inspect a task definition without starting a runtime. |
| `inspectWorkflow` | function | Inspect a workflow definition without starting a runtime. |

These are what CLI listings and doctor checks call: they read a definition and report on it without
starting a runtime or touching storage.

### Idempotency

| Symbol | Kind | Description |
| --- | --- | --- |
| `WorkerIdempotencyPort` | interface | Durable applied-keys store used to make worker effects exactly-once-effective. |
| `WorkerIdempotencyInput` | type alias | Input used to resolve and claim an applied key for one worker delivery. |
| `WorkerIdempotencyClaim` | type alias | Result returned when a worker delivery attempts to claim an applied key. |
| `WorkerIdempotencySource` | type alias | How a worker delivery idempotency key was resolved. |

Delivery is at-least-once; effects are exactly-once-effective. A key is resolved from a caller-supplied
key, the message id, or a payload hash — `WorkerIdempotencySource` records which — and then claimed
against the port before the effect runs.

## Related pages

- [`@netscript/plugin-workers`](/reference/workers/) — the deployable plugin that binds this core to a
  NetScript host.
- [`@netscript/plugin-triggers-core`](/reference/plugin-triggers-core/) — trigger handlers enqueue
  these jobs through `enqueueJob`.
- [`@netscript/plugin-sagas-core`](/reference/plugin-sagas-core/) — its `integration/workers` helpers
  dispatch jobs and tasks from saga cascades.
- [`@netscript/plugin-streams-core`](/reference/plugin-streams-core/) — the producer behind the
  projected execution stream.

---

Back to the [reference overview](/reference/).
