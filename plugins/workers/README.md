# @netscript/plugin-workers

`@netscript/plugin-workers` is the Tier 2 NetScript plugin for background jobs, task execution,
workflow orchestration, service APIs, CLI commands, scaffolding, streams, database schema
contribution, and Aspire process wiring.

The reusable worker definitions and runtime primitives live in `@netscript/plugin-workers-core`.
This package binds those primitives to the host plugin system.

## 1. Package Role

This package owns the deployable workers plugin manifest.

It contributes:

- a Workers API service
- background processor entries
- stream topics for jobs, tasks, and workflows
- database schema metadata
- versioned API contracts
- runtime config topic metadata
- E2E gate metadata
- CLI commands mounted by the host CLI walker
- scaffolding assets for jobs, tasks, and workflows
- Aspire resource contribution metadata

It does not own the core job DSL, task runtime contracts, workflow state contracts, or memory
testing adapters. Import those from `@netscript/plugin-workers-core`.

## Install

```sh
deno add jsr:@netscript/plugin-workers
```

Use the workspace import while developing inside this repository:

```ts
import { workersPlugin } from '@netscript/plugin-workers';
```

After publishing, consumers should use the published JSR package specifier with the same exported
subpaths.

## Quick example

Register the plugin in `netscript.config.ts`.

```ts
export default {
  plugins: ['./plugins/workers/mod.ts'],
};
```

The host loader imports the named `workersPlugin` manifest. Loading the package does not start a
worker process.

## 4. Manifest Surface

The root entrypoint exports:

- `workersPlugin`
- `inspectWorkers`
- manifest contribution types

The manifest is authored with `definePlugin(name, version).with*().build()` and declares typed
dependencies with:

```ts
.withDependencies({ streams: streamsPlugin })
```

The root remains intentionally small. Use subpaths for CLI, Aspire, contracts, streams, services,
worker process classes, and scaffolding.

## 5. Public Subpaths

| Subpath            | Purpose                                |
| ------------------ | -------------------------------------- |
| `.`                | Plugin manifest and inspection surface |
| `./cli`            | Host CLI walker composition entrypoint |
| `./aspire`         | Aspire contribution class              |
| `./contracts`      | Workers API contract v1                |
| `./scaffolding`    | Side-effect-free source scaffolders    |
| `./services`       | Workers API service entrypoint         |
| `./streams`        | Stream integration entrypoint          |
| `./streams/server` | Stream mirror server integration       |
| `./worker`         | Worker and scheduler process classes   |

Subpaths keep the root barrel below the package surface budget while still making plugin axes
addressable by the host.

## 6. Contribution Axes

The plugin declares these contribution groups:

- `services`
- `backgroundProcessors`
- `streamTopics`
- `databaseSchemas`
- `runtimeConfigTopics`
- `contractVersions`
- `e2e`
- `aspire`

Each group is data on the manifest. Runtime work begins only when the host invokes a service,
background entrypoint, CLI command, or Aspire contribution.

## 7. Service

The service entrypoint is `./services/src/main.ts`.

The manifest contributes it as `workers-api` on port `8091`. The service owns HTTP routing for jobs,
runs, tasks, administrative actions, server-sent events, and stream subscription endpoints.

Database access is supplied by the host service context. The service should not create its own
global database client.

## 8. Background Processors

The manifest contributes three runnable background entrypoints:

- `./bin/combined.ts`
- `./bin/worker.ts`
- `./bin/scheduler.ts`

`workers-combined` starts worker and scheduler behavior together. `workers-worker` only consumes and
executes queued work. `workers-scheduler` only schedules due work.

The wrappers exist so Aspire and process supervisors can launch concrete files instead of importing
an export-only module.

Worker consumers provide an at-least-once delivery model with idempotency keys, making job and task
effects exactly-once-effective when handlers key their external writes on the message
`idempotencyKey`. Trigger-produced jobs stamp that key onto the `JobMessage` body, and the worker
runtime records durable applied keys in the same shared KV store used by execution state. Duplicate
redeliveries are recorded as already-applied skips, not failures.

## 9. CLI

The CLI subpath exports `WorkersCli` and command classes for:

- `add-job`
- `add-task`
- `list-jobs`
- `list-tasks`
- `run`
- `logs`
- `config-edit`
- `config-publish`
- `enable`
- `disable`
- `compile-registry`

Command execution is backend-injected. The local backend writes source files, scans project jobs,
and emits a generated static registry at `.netscript/generated/plugin-workers/job-registry.ts`.

## 10. Scaffolding

The scaffolding subpath exposes side-effect-free scaffolders for:

- job handlers
- job builders
- Deno tasks
- Python tasks
- shell tasks
- PowerShell tasks
- workflows

Template assets live under `src/scaffolding/templates/` and are included in the publish allowlist.

## 11. Streams

The stream integration is backed by `@netscript/plugin-workers-core/streams`.

Use `emitJobToStream()` for job event publication. The older `publishJobToStream()` name has been
removed from the plugin surface.

The plugin stream server also mirrors legacy execution-state mutations while the remaining consumer
migration slices are in progress. That bridge is temporary and should disappear when the legacy
workers package is removed.

## 12. Aspire

The Aspire subpath exports `WorkersAspireContribution`.

It contributes:

- `workers-api`
- `workers-combined`
- `workers-worker`
- `workers-scheduler`

The contribution records service ports, health endpoints, and background process entrypoints as data
for the AppHost integration layer.

## 13. Contracts

The contracts subpath exposes Workers API contract v1.

The plugin service uses the contract shape from workers core and presents it through the service
package boundary. Contract schemas are Zod-derived where they define public or domain payloads.

## 14. Package Tree

```text
plugins/workers/
  bin/                 runnable background processor entrypoints
  contracts/           v1 contract entrypoint
  database/            Prisma schema contribution
  services/            Workers API service process
  src/aspire/          Aspire contribution
  src/cli/             CLI commands, backend, registry compiler
  src/e2e/             E2E gate metadata and probes
  src/public/          manifest composition
  src/scaffolding/     source scaffolders and templates
  streams/             stream mirror integration
  tests/               focused plugin tests and smoke tests
  worker/              worker and scheduler process classes
```

## 15. Permissions

The plugin manifest declares the permissions needed by service and background runtime paths:

- `--allow-net`
- `--unstable-kv`
- `--allow-env`
- `--allow-read`
- `--allow-write`
- `--allow-run`

Worker idempotency uses the configured KV provider and reads optional
`NETSCRIPT_WORKERS_IDEMPOTENCY_ACTIVE_TTL_MS` and
`NETSCRIPT_WORKERS_IDEMPOTENCY_APPLIED_TTL_MS` environment overrides when the process has
`--allow-env`. Without those variables, active claims default to 15 minutes and applied markers
default to 24 hours.

Narrower permissions can be supplied by process-specific launchers when the host owns command
construction.

## 16. Testing

Focused tests exist for:

- plugin manifest shape
- CLI command surface
- Aspire contribution data
- E2E gate metadata

Run the plugin checks from the repository root:

```powershell
deno check --unstable-kv plugins/workers/mod.ts plugins/workers/src/aspire/mod.ts plugins/workers/src/cli/composition/main.ts plugins/workers/contracts/v1/mod.ts plugins/workers/src/scaffolding/mod.ts plugins/workers/services/src/main.ts plugins/workers/streams/mod.ts plugins/workers/streams/server.ts plugins/workers/worker/mod.ts
deno test --allow-all plugins/workers/tests/
deno run --allow-read plugins/workers/verify-plugin.ts
```

## 17. Migration Status

The plugin now depends on `@netscript/plugin-workers-core` for manifest payload schemas, stream
schemas, and stream producer primitives.

Process wrappers now compose the plugin worker runtime through `@netscript/plugin-workers-core` and
the plugin service runtime. Slice D32 removed the legacy worker package.

## Docs

Read:

- [Docs README](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Getting Started](./docs/getting-started.md)
- [Operations](./docs/operations.md)
- `@netscript/plugin-workers-core` for core definitions and runtime contracts
