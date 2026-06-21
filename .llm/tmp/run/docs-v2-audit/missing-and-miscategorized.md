# Missing And Miscategorized Docs

This file records features that are absent, under-emphasized, or placed under the wrong information architecture. It is not a rewrite plan; it is source material for the next docs strategy session.

## Missing: Polyglot Tasks

Status: Working, under-documented.

Evidence:
- `defineTask` root API: `packages/plugin-workers-core/src/public/root.ts:302`.
- Task builder runtime/entrypoint/env/args/permissions APIs: `packages/plugin-workers-core/src/public/root.ts:209`, `:211`, `:225`, `:227`, `:229`, `:231`.
- Runtime types support `cmd`, `deno`, `dotnet`, `executable`, `powershell`, `python`, `shell`: `packages/plugin-workers-core/src/executor/executor-types.ts:2`.
- Default adapter map registers all built-ins: `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:128`.
- Command builders cover Deno, Python, .NET, shell, PowerShell, cmd, executable: `packages/plugin-workers-core/src/executor/adapters/argv-builder.ts:7`, `:25`, `:40`, `:67`, `:87`, `:109`, `:117`.
- Worker queue listener runs task messages: `plugins/workers/worker/queue-consumer.ts:49`.
- Worker job dispatch selects polyglot execution for non-Deno job definitions: `plugins/workers/worker/job-execution.ts:19` and `:117`.
- Workers contract exposes task list/trigger/execution endpoints: `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts:126`, `:140`, `:145`.
- Deploy tooling knows task script files: `packages/cli/src/kernel/adapters/windows/tasks-copier.ts:5` says tasks are `.ts`, `.py`, `.sh`, `.ps1`, `.cmd`, `.exe`.

Current docs issue:
- `docs/site/capabilities/background-jobs.md:13` defines the workers capability as background jobs.
- The task surface appears only as API rows at `docs/site/capabilities/background-jobs.md:97` and not as an explained capability.

Suggested IA:
- Add `capabilities/polyglot-tasks/` after Background jobs, or make it a sibling section inside `capabilities/background-jobs/` with a clear "Jobs vs tasks" split.
- Add a how-to: "Run a Python or shell task from workers".
- Cross-link from deploy docs because tasks are copied into the Windows/deploy output.
- Add caveat: task instrumentation hooks are not proven to export OTel spans; cite `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:147`.

## Miscategorized: `@netscript/fresh` Meta-Framework

Status: Working, currently buried under Fresh UI/design.

Evidence:
- `@netscript/fresh` exports root plus `./server`, `./builders`, `./route`, `./defer`, `./form`, `./error`, `./streams`, `./query`, `./interactive`, `./vite`, `./testing`: `packages/fresh/deno.json:5`.
- Route surface: `packages/fresh/src/application/route/mod.ts:52`, `:70`, `:99`, `:117`, `:179`.
- Page/partial builders: `packages/fresh/src/application/builders/mod.ts:26`, `:31`, `:38`.
- Forms: `packages/fresh/src/application/form/mod.ts:32` through `:64`.
- Defer: `packages/fresh/src/application/defer/mod.ts:10`.
- Query/hydration/islands: `packages/fresh/src/application/query/mod.ts:19`, `:22`, `:65`, `:66`.
- Server bootstrap: `packages/fresh/src/runtime/server/mod.ts:11`.
- Vite plugin: `packages/fresh/src/application/vite/vite.ts:191`.
- Testing helpers: `packages/fresh/src/testing/mod.ts:93`.

Current docs issue:
- `docs/site/capabilities/fresh-ui.md:9` titles the whole area "Fresh UI & design".
- `docs/site/capabilities/fresh-ui.md:30` mentions `defineFreshApp`, but in a dashboard-layout context.
- `docs/site/capabilities/fresh-ui.md:85` mentions `definePage`, but still as UI scaffolding.
- `docs/site/capabilities/fresh-ui.md:177` links to the `@netscript/fresh` reference, but the capability IA says the capability is UI/design.

Suggested IA:
- Add `capabilities/fresh-framework/` for Fresh app bootstrap, typed routes, page builders, forms, defer, query hydration, streams, Vite, and testing.
- Keep `capabilities/fresh-ui/` for copy-source UI registry, primitives, tokens, `ui:init`, and `ui:add`.
- In the capabilities index, list both:
  - "Fresh framework" as platform/web runtime.
  - "Fresh UI & design system" as copy-source UI foundation.

## Missing: Runtime Config And Runtime Overrides

Status: Working public package and CLI operational surface.

Evidence:
- Runtime config topics and task runtimes: `packages/runtime-config/mod.ts:36`.
- Loader exports: `packages/runtime-config/mod.ts:37`.
- Watcher: `packages/runtime-config/mod.ts:45`.
- Diagnostics summary: `packages/runtime-config/mod.ts:50`.
- CLI runtime override loader reads additive runtime tasks: `packages/cli/src/kernel/adapters/config/runtime-override.ts:78`.

Current docs issue:
- Architecture classifies runtime-config as a small contract package at `docs/site/explanation/architecture.md:132`, but there is no user-facing capability/how-to for runtime overrides.

Suggested IA:
- Add under `reference/runtime-config/` if generated reference exists, plus a short explanation/how-to under operations or deploy.
- Cross-link from polyglot tasks because runtime task JSON is additive operational configuration.

## Missing Caveat Placement: Trigger Deferred Actions

Status: Runtime caveat.

Evidence:
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94` ignores `defer` actions by returning immediately.
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:98` only enqueue actions proceed to worker job dispatch.

Current docs issue:
- Trigger tutorial accurately covers webhook enqueue, but does not warn that `defer` action dispatch is currently a no-op.

Suggested IA:
- In triggers capability/reference, add "Supported trigger actions today" table.
- Mark `enqueueJob` as live and `defer` as defined-but-not-dispatched in the plugin runtime.

## Missing Caveat Placement: Queue Provider Support

Status: Public provider selector has an explicit not-implemented branch.

Evidence:
- `packages/queue/factory/create-queue.ts:214` provider switch.
- `packages/queue/factory/create-queue.ts:221` rejects PostgreSQL.
- `packages/queue/factory/create-queue.ts:225` says "PostgreSQL queue adapter not yet implemented".

Current docs issue:
- The capability index groups KV/queues/cron at `docs/site/capabilities/index.md:27`; provider support needs a table in the KV/queues/cron capability/reference.

Suggested IA:
- Add provider table:
  - Deno KV: works.
  - Redis: works when connection discovered/configured.
  - RabbitMQ: works when service available.
  - PostgreSQL: not implemented.

## Potential Drift: Service oRPC Path

Status: Unverified gap.

Evidence:
- Service preset comment says `/api/rpc/*`: `packages/service/src/presets/define-service.ts:18`.
- Tutorial says `/rpc`: `docs/site/tutorials/build-a-service.md:209`.

Suggested IA:
- Before editing docs, run a generated users service and confirm the actual route. Then update tutorial/reference consistently.
