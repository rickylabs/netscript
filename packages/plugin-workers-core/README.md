# @netscript/plugin-workers-core

Core job, task, workflow, runtime, contract, telemetry, and testing primitives for NetScript workers
plugins.

## What This Package Is

`@netscript/plugin-workers-core` is the Tier 1 package for reusable workers primitives.

It owns the public definition DSL for:

- jobs
- tasks
- workflows
- worker runtime composition
- worker API contracts
- worker configuration schemas
- worker telemetry naming
- test-time memory adapters

It is designed for plugin authors, generated registries, service adapters, and tests that need to
define or compose workers behavior without depending on the concrete `@netscript/plugin-workers`
service plugin.

## What This Package Is Not

This package does not own the deployed workers service process.

It does not provide:

- CLI command registration
- scaffolding command implementations
- database migrations
- Aspire resources
- background processor binaries
- plugin manifest registration
- long-running service process code

Those live in the Tier 2 workers plugin and later implementation slices.

## Package Role

The package follows the NetScript two-tier plugin pattern.

Tier 1 core packages expose reusable definitions and runtime contracts. Tier 2 plugin packages bind
those primitives to service processes, CLI verbs, generated registries, and host plugin manifests.

Workers core intentionally keeps dependencies narrow. It does not import `@netscript/config`,
`@netscript/telemetry`, or non-core plugin packages.

## Installation

In this workspace, import the package through the Deno workspace map:

```ts
import { defineJob, startWorkers } from '@netscript/plugin-workers-core';
```

For direct package development, run checks from the repository root:

```powershell
deno check --unstable-kv packages/plugin-workers-core/mod.ts
deno test --allow-all --unstable-kv packages/plugin-workers-core/tests/
deno fmt packages/plugin-workers-core
```

## Quick Start

Define a job and start an in-process runtime:

```ts
import { createSuccessResult, defineJob, startWorkers } from '@netscript/plugin-workers-core';

const job = defineJob('send-email')
  .handler(() => createSuccessResult({ sent: true }))
  .topic('workers.mail')
  .tags('email')
  .build();

const runtime = await startWorkers();
await runtime.jobRegistry.saveJob(job);
```

`startWorkers()` creates a fresh runtime with memory-backed defaults and starts it by default.

## Define Jobs

Use `defineJob(id)` for job definitions.

```ts
import { defineJob } from '@netscript/plugin-workers-core';

const job = defineJob('sync-catalog')
  .entrypoint('./workers/jobs/sync-catalog.ts')
  .schedule('*/15 * * * *')
  .timeout(120_000)
  .retry(2)
  .permissions({ net: true, read: true })
  .build();
```

The builder is typestate-gated. `build()` is only useful after `.entrypoint(path)` or
`.handler(fn)`.

## Define Job Handlers

Use `defineJobHandler()` when a handler should be exported and then referenced by a generated
registry.

```ts
import { createSuccessResult, defineJobHandler } from '@netscript/plugin-workers-core';

export const run = defineJobHandler(async (ctx) => {
  return createSuccessResult({
    jobId: ctx.job.id,
    correlationId: ctx.correlationId,
  });
});
```

Generated registries can bind static handlers without enabling dynamic imports.

## Define Tasks

Use `defineTask(id)` for command-like units of work.

```ts
import { defineTask } from '@netscript/plugin-workers-core';

const task = defineTask('build-assets')
  .type('deno')
  .entrypoint('./tasks/build-assets.ts')
  .args('production')
  .timeout(60_000)
  .build();
```

Tasks model executable work. Concrete process execution is supplied by runtime adapters and the Tier
2 workers plugin.

## Define Workflows

Use `defineWorkflow(id)` for ordered job and task steps.

```ts
import { defineWorkflow } from '@netscript/plugin-workers-core';

const workflow = defineWorkflow('publish-release')
  .job('sync-catalog')
  .task('build-assets')
  .build();
```

The core workflow engine treats workflows as state machines. Job and task step execution is injected
through the runtime.

## Runtime Composition

Use `createWorkersRuntime(options)` when tests, generated code, or service adapters need explicit
dependencies.

```ts
import { createWorkersRuntime } from '@netscript/plugin-workers-core';
import { MemoryJobStorage, MemoryWorker } from '@netscript/plugin-workers-core/testing';

const jobStorage = new MemoryJobStorage();
const worker = new MemoryWorker();

const runtime = createWorkersRuntime({
  jobRegistry: jobStorage,
  worker,
});
```

Each call creates a fresh runtime handle. There are no hidden global registries or reset hooks.

## Presets

`startWorkers(options)` is the root preset.

```ts
import { startWorkers } from '@netscript/plugin-workers-core';

const runtime = await startWorkers({ autoStart: false });
await runtime.start();
await runtime.stop('test complete');
```

The preset delegates to `createWorkersRuntime(options)`.

## Contracts

The versioned contract subpath exports the workers API contract:

```ts
import { workersContract, workersContractV1 } from '@netscript/plugin-workers-core/contracts/v1';
```

`./contracts` and `./contracts/v1` both point to `src/contracts/v1/mod.ts`.

## Configuration

Worker-owned config schemas live under `./config`.

```ts
import { JobConfigSchema, TaskConfigSchema } from '@netscript/plugin-workers-core/config';
```

These schemas are owned by workers core. They are not re-exported from `@netscript/config`.

## Telemetry

Telemetry naming and structural instrumentation contracts live under `./telemetry`.

```ts
import {
  WorkerSpanNames,
  WorkerTelemetryAttributes,
} from '@netscript/plugin-workers-core/telemetry';
```

The package defines worker telemetry vocabulary without importing the platform telemetry package.

## Testing

Use `./testing` for memory-backed adapters and fixtures.

```ts
import { createJobFixture, createTestWorkersRuntime } from '@netscript/plugin-workers-core/testing';

const runtime = createTestWorkersRuntime();
const job = createJobFixture();

await runtime.jobRegistry.saveJob(job);
await runtime.worker.dispatch(job, {
  id: 'execution-1',
  job,
  payload: {},
});
```

Testing helpers create fresh instances. They do not depend on singleton state.

## Subpaths

Stable subpaths:

- `@netscript/plugin-workers-core`
- `@netscript/plugin-workers-core/builders`
- `@netscript/plugin-workers-core/contracts`
- `@netscript/plugin-workers-core/contracts/v1`
- `@netscript/plugin-workers-core/registry`
- `@netscript/plugin-workers-core/state`
- `@netscript/plugin-workers-core/executor`
- `@netscript/plugin-workers-core/workflow`
- `@netscript/plugin-workers-core/streams`
- `@netscript/plugin-workers-core/presets`
- `@netscript/plugin-workers-core/schemas`
- `@netscript/plugin-workers-core/shutdown`
- `@netscript/plugin-workers-core/telemetry`
- `@netscript/plugin-workers-core/testing`
- `@netscript/plugin-workers-core/config`
- `@netscript/plugin-workers-core/runtime`

The root barrel stays intentionally small. Use subpaths for specialized APIs.

## Permissions

Definition-only imports require no Deno runtime permissions.

Runtime execution depends on the adapters supplied by the caller or Tier 2 plugin. The in-process
default job runner can execute in-memory handlers without filesystem, network, or subprocess
permissions.

Commands used during package development:

```powershell
deno check --unstable-kv packages/plugin-workers-core/mod.ts
deno test --allow-all --unstable-kv packages/plugin-workers-core/tests/
deno publish --dry-run --allow-dirty packages/plugin-workers-core
```

## Migration Notes

Legacy worker-package consumers now import `@netscript/plugin-workers-core`.

Expected movements:

- definition DSL imports move to `@netscript/plugin-workers-core`
- contract imports move to `@netscript/plugin-workers-core/contracts/v1`
- worker-owned config schemas move to `@netscript/plugin-workers-core/config`
- testing adapters move to `@netscript/plugin-workers-core/testing`
- concrete service process imports remain in the Tier 2 workers plugin

## Validation

D17 documentation audit checks:

- root README has more than 150 lines
- README has at least 14 sections
- docs directory includes architecture, concepts, getting-started, and recipe pages
- examples use modern Deno/JSR package imports
- no deprecated registry URL imports appear

## See Also

Read:

- `docs/architecture.md`
- `docs/concepts.md`
- `docs/getting-started.md`
- `docs/recipes/adding-a-job.md`
- `docs/recipes/adding-a-task.md`
- `docs/recipes/testing-locally.md`
