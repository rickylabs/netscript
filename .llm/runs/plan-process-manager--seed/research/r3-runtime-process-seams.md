# R3 — Repo Teardown: Existing Process/Runtime Execution Seams

Scope: what a process-manager (pm) supervisor core could build on today, cited against the
`plan-process-manager--seed` worktree (`C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager`,
all paths below are repo-relative to that worktree). Answers the charter's four seams — workers
subprocess execution, Aspire dev orchestration + `--no-aspire` fallback, telemetry convention,
oRPC/service contract seam, KV conventions — and closes with an explicit
present/partial/missing primitive inventory and the workers-vs-pm framing verdict.

## 1. One-shot job/task execution (`plugins/workers` + `packages/plugin-workers-core`)

The workers stack is the richest existing subprocess-execution surface in the repo, but it is
built for bounded, one-shot task runs, not long-running supervised services.

- **Command building is pure and adapter-per-runtime.** `RuntimeCommandSpec` (`command`, `args`,
  `env`) is the shared contract every runtime adapter builds
  (`packages/plugin-workers-core/src/executor/adapters/command-spec.ts:9-13`). Seven built-in
  adapters exist — deno, python, dotnet, shell, powershell, cmd, executable
  (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:196-204`) — each a
  thin `RuntimeAdapterBase` subclass supplying only a `build()` closure
  (`packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts:18-38`,
  `.../adapters/executable-runtime-adapter.ts:6-17`). This is a clean extension axis a pm core
  could add an eighth adapter to (e.g. a "supervised" runtime) without touching the others.
- **Actual spawning goes through Dax, not raw `Deno.Command`.** `DaxProcessRunner.run()` builds a
  `$` command, sets `cwd`/`env`/`timeout`, calls `.noThrow()`, pipes stdout/stderr, and streams
  both concurrently via `ReadableStream` readers
  (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:52-70,100-121`). Log
  lines are classified by severity (`log-classifier.ts`) and pushed through `onLog`/`onStdout`/
  `onStderr` callbacks (`dax-process-runner.ts:140-149`) — a live log-streaming primitive that
  already exists and could be reused for a pm "tail logs" feature, but it is in-memory/callback
  only; nothing persists or rotates these logs today (see Section 6 for where rotation does exist).
- **No restart/respawn loop for the process itself.** `MultiRuntimeTaskExecutor.execute()` runs the
  adapter exactly once per call and wraps it in an OTEL span
  (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:77-114`); retries are
  a job-level concept (`JobConfig.maxRetries: number`, default 3,
  `packages/plugin-workers-core/src/config/job-config.ts:65,99`) resolved by whatever calls the
  executor repeatedly — there is no in-repo exponential-backoff or restart-policy type. The nearest
  analog to a restart policy shape is the systemd `Restart=`/`RestartSec=` pair (Section 6), which
  is a static per-service constant, not a runtime-tunable policy engine.
- **Graceful shutdown exists as a generic, priority-ordered resource registry.**
  `ShutdownManager` in `packages/plugin-workers-core/src/shutdown/shutdown-manager.ts:33-136`
  registers `{id, priority, stop()}` resources, races `Promise.all(stop)` against a timeout, and
  returns a `ShutdownReport` (`stopped`/`failed`/`timedOut`). This is directly reusable as the
  in-process shutdown-fanout primitive for a pm daemon (stop supervised children in priority order
  on SIGTERM) — it has no concept of process health or restart, only stop-once semantics.
- **Permissions are typed, not just string flags.** `WorkerTaskPermissions` covers
  `net/read/write/env/run/ffi/import` as boolean-or-string-array fields
  (`packages/plugin-workers-core/src/executor/executor-types.ts:33-41`), matching
  `WorkerConfigPermissions` at the config layer
  (`packages/plugin-workers-core/src/config/job-config.ts:12-27`). A pm core supervising Deno
  entrypoints should reuse this exact permission vocabulary rather than inventing a new one.
- **Verdict on the "workers = jobs, pm = long-running services" framing (charter's explicit ask):
  confirmed by code.** Every workers primitive above (executor, adapters, dax runner, job config)
  is scoped to a single bounded execution with a `TaskResult` (`status`, `exitCode`, `duration`,
  `attempt`) returned at completion
  (`packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts:62-79`). There is no
  "keep this alive indefinitely, restart on crash, expose live status" concept anywhere in
  `plugin-workers-core`. A process-manager plugin does not duplicate this — it needs a distinct
  execute-once vs supervise-forever axis, and can wrap the existing `RuntimeCommandSpec` /
  `ProcessRunner` seam (command-spec.ts, dax-process-runner.ts) for the "how do I build the argv"
  half while adding its own supervision loop for the "keep it running" half.

## 2. Dev-time process orchestration (`packages/aspire`) and the `--no-aspire` fallback

- **Aspire is a compile-time composition, not a runtime supervisor written in this repo.** The
  package's job is to emit an `apphost.mts` (`packages/aspire/src/application/compose-apphost.ts`)
  that the external `aspire` CLI restores/starts; NetScript's own code only builds
  `AspireNSPluginContribution` registrations (`packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts`)
  and a `ContributionRegistry` (`packages/aspire/src/runtime/contribution-registry.ts:5-39`) that
  the generated AppHost consumes. Actual process supervision (restart, health-gating, port
  allocation across the whole graph) is delegated to Aspire's own DCP runtime — NetScript does not
  reimplement a supervisor here, it contributes descriptors to one.
- **`--no-aspire` scaffolds leave exactly one foreground command and nothing else.** `InitOptions.
  noAspire: boolean` (`packages/cli/src/kernel/domain/scaffold/scaffold-options.ts:58-59`) flows
  into `generateReadme()`, and when set the generated README's Quick Start is literally:
  `# Start the Fresh app directly (no Aspire orchestration)` /
  `deno task --cwd apps/<appName> dev`
  (`packages/cli/src/kernel/templates/workspace/generate-readme.ts:75-78`). The database section
  for a `--no-aspire` scaffold says the user must "self-provision the database and expose its
  connection string" themselves (`generate-readme.ts:211-216`) — i.e. no orchestration, no
  multi-process supervision, no DB container, at all. This is precisely the gap the charter's
  "decent dev-process fallback" nice-to-have targets: today `--no-aspire` scaffolds ship with a
  single `deno task dev` and no way to also run a worker/background-processor/service concurrently
  under one supervised umbrella.
- **`init-pipeline.ts`/`init-orchestrator.ts` branch on `noAspire` only to skip file generation**,
  not to substitute an alternative process supervisor
  (`packages/cli/src/kernel/application/scaffold/init-pipeline.ts:49-51`,
  `.../init-orchestrator.ts:100-103,123`) — confirming there is genuinely no fallback runtime
  today, just an omission of the Aspire files.

## 3. Telemetry convention (T1 `netscript.*` + T2 ports/adapters)

- **The attribute-domain root is centralized and extensible, but has no `process`/`pm` domain
  yet.** `NETSCRIPT_ATTRIBUTE_ROOT = 'netscript'`
  (`packages/telemetry/src/domain/telemetry-convention.ts:15`) and
  `NetScriptAttributeDomains` currently enumerates `JOB, EXECUTION, SAGA, TRIGGER, WORKER,
  SCHEDULER, MESSAGING, CORRELATION, DURABILITY, IDEMPOTENCY, RETRY, CONCURRENCY, OUTCOME, SSE, KV`
  (`telemetry-convention.ts:30-46`) — no `PROCESS` or `SERVICE` entry. A pm plugin needs to add
  `netscript.process` (and possibly `netscript.service.instance`) as a new domain under the same
  root, following the T1 convention rather than inventing a parallel namespace.
- **The 14-point `TelemetryConventionChecklist`** (span-name hierarchy, `SpanKind`, OK/ERROR
  status, span events for lifecycle breadcrumbs, W3C context propagation via
  `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` env vars, shared instrumentation facade, span links
  for fan-in) is the literal grading rubric the pm plugin's telemetry will be evaluated against
  (`telemetry-convention.ts:58-115`). The `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID` env-injection
  pattern is already implemented for subprocess propagation exactly where a pm daemon would need it
  — `DaxProcessRunner.buildEnvironment()` injects all three when present on
  `ResolvedTaskExecutionOptions` (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-98`),
  so a supervised child process launched by the pm core inherits this for free if it reuses the
  same env-building convention.
- **Worker instrumentation is a small, composable facade**, not a bespoke tracer:
  `packages/plugin-workers-core/src/telemetry/instrumentation.ts` /
  `packages/telemetry/src/instrumentation/worker.ts` back the `TaskInstrumentationLike` interface
  consumed by `MultiRuntimeTaskExecutor.#applyInstrumentation()`
  (`multi-runtime-task-executor.ts:137-157`) — the pm core's own instrumentation should be built the
  same way (a `ProcessInstrumentationLike` passed into the supervisor, not a private
  `getTracer()` call scattered through the codebase), per TC-13.

## 4. oRPC/service contract seam (`packages/plugin` base contracts)

- **`PluginServiceContribution`** is the base class every plugin service extends: `axis: 'service'`,
  `name`, and `entrypoint` (module that exports the oRPC service)
  (`packages/plugin/src/abstracts/plugin-service-contribution.ts:4-11`). A pm plugin's admin API
  (both the CLI's and the Desktop UI's oRPC surface) should be declared this way, matching how
  `workers`, `sagas`, `triggers` already expose describe-style routers
  (`plugins/workers/services/src/routers/describe.ts` is the sibling pattern referenced by
  `plugins/workers/src/public/mod.ts`).
- **`PluginBackgroundProcessorContribution`** already exists as a first-class contribution axis:
  `axis: 'background-processor'`, `name`, `entrypoint`
  (`packages/plugin/src/abstracts/plugin-background-processor-contribution.ts:4-11`), and the
  `workers` plugin registers itself with exactly this axis —
  `.withType('background-processor')` in `plugins/workers/src/public/mod.ts:56`. This is the
  existing extension point a process-manager plugin's own supervised targets, and any other
  plugin's long-running processes, are already meant to declare through — it is not a new axis
  the RFC needs to invent, it needs to be consumed by a runtime that actually supervises
  (start/health/restart) what today is only a static `{name, entrypoint}` declaration.
- **Background-processor config already resolves into a rich per-plugin shape** far beyond the
  bare contribution: `ResolvedBackgroundProcessorConfig` carries `concurrency`,
  `concurrencyEnvVar`, `permissions`, `watchDirs`, `requiresKv`/`requiresDb`, `serviceReferences`,
  `pluginReferences`, and a map of named `entrypoints` (each with its own permissions/env/
  `assignWorkerId`) (`packages/cli/src/kernel/domain/resolved-config.ts:79-94`, resolved by
  `packages/cli/src/kernel/adapters/config/deploy-config-background.ts:91-121`). This is
  effectively an existing declarative process-manifest format (`appsettings.json` →
  `BackgroundProcessors.<name>`) that a pm core's target model should align with rather than
  duplicate — see Section 6 for how it already turns into compile targets and OS services.

## 5. KV conventions (`@netscript/kv`) for daemon state

- **`WatchableKv`** extends the base `KvStore` with `watch(keys)` and `watchPrefix(prefix)`, both
  backed by native `Deno.Kv.watch()` where available
  (`packages/kv/types/watchable-kv.ts:37-101`), with `supportsWatch` as a capability flag
  (`watchable-kv.ts:109`) and an `isWatchable()` type guard (`watchable-kv.ts:118-124`). This is a
  ready-made IPC primitive: a pm CLI/UI can write a command record to KV
  (`['pm', 'commands', id]`) and a running daemon can `watchPrefix(['pm', 'commands'])` to react —
  no new transport needs to be invented for daemon control-plane messages, and it degrades
  gracefully (`supportsWatch === false`) on adapters that only poll (e.g. Redis).
- **Existing registries already use KV for durable job/task state** —
  `packages/plugin-workers-core/src/registry/kv-job-registry.ts` and `kv-task-registry.ts` are the
  established pattern for "durable state keyed by id, backed by `@netscript/kv`" that a pm daemon's
  own process/instance registry (pid, status, start time, restart count) should follow rather than
  inventing a bespoke persistence layer.

## 6. Bare-metal deploy lane reuse (the deepest, most load-bearing seam)

This is where the charter's re-use question resolves most concretely — the shipped bare-metal
deploy lane (#337-#340) already contains almost a full process-manager's worth of declarative
primitives, just not wired into a live, ad-hoc-controllable daemon.

- **`OsServicePort`** is the exact "one narrow seam satisfied by both Windows (servy) and Linux
  (systemd)" abstraction the pm plugin needs for OS-level lifecycle: `install / start / stop /
  status / uninstall` (`OsServiceOperation`), `install(request)`, and `run(operation, serviceName)`
  (`packages/cli/src/public/ports/os-service-port.ts:9-45`). `SystemdOsServiceAdapter` implements it
  via `systemctl daemon-reload` + `enable` on install and `systemctl <op>` otherwise
  (`packages/cli/src/public/adapters/systemd-os-service.ts:48-81`); a `ServyOsServiceAdapter`
  mirrors it for Windows (`packages/cli/src/public/adapters/servy-os-service.ts`, referenced
  alongside `systemd-os-service.ts` in that file's own module doc). A pm plugin's own "install as
  OS service" operation should call this exact port, not reimplement systemctl/servy argv
  building — `packages/cli/src/kernel/adapters/linux/systemd/systemd-command.ts` already centralizes
  that.
- **`DeployTargetPort`** is the canonical 7(+legacy-3)-op deploy-target contract
  (`plan/emit/up/down/status/logs/rollback/secrets`, with `build/install/uninstall` legacy aliases)
  every bare-metal/cloud target implements a subset of
  (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:12-123`).
  `LinuxServiceDeployTarget extends ServiceDeployTarget` and registers under key `linux-service`
  (`packages/cli/src/kernel/domain/deploy/linux-service-deploy-target.ts:12-15`) — the pm plugin's
  own "process-manager" deploy target (if it becomes one, per the charter's "bare-metal option"
  framing) should be a sibling `DeployTargetPort` implementation, reusing `plan/emit/up/down/status/
  logs`, not a new top-level command tree.
- **Systemd units already declare a restart policy, timeouts, and journald logging** —
  `renderSystemdUnit()` defaults `Restart=on-failure`, `RestartSec=<n>`, `TimeoutStartSec`,
  `TimeoutStopSec`, and always sets `StandardOutput=journal` / `StandardError=journal`
  (`packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts:83-140`, defaults sourced from
  `packages/cli/src/kernel/constants/linux.ts` per that file's imports at lines 9-16). Restart
  policy and log destination already exist for the systemd path — a pm core does not need to
  invent unit-level restart semantics for Linux, it needs a control plane above systemd
  (list/inspect/tail/ad-hoc-restart across all supervised units, cross-platform parity with
  Windows) that systemd itself does not provide out of the box.
- **The Windows path (Servy) is even richer than systemd's defaults**: `buildServyConfig()` sets
  `startupType` (`AutomaticDelayedStart` for workers/plugins so DB/cache stabilize first),
  `priority` (`BelowNormal` for workers), `stdoutPath`/`stderrPath` with size- and date-based log
  rotation (`enableSizeRotation`, `rotationSizeMB`, `enableDateRotation`, `maxRotations` from
  `DEFAULT_LOG_ROTATION`), health monitoring (`enableHealthMonitoring`, `healthCheckUrl` built
  from the target's port as `http://localhost:<port>/health`, `heartbeatIntervalSeconds`,
  `maxFailedChecks`), and recovery (`recoveryAction`, `maxRestartAttempts` from
  `DEFAULT_HEALTH_MONITORING`) (`packages/cli/src/kernel/adapters/windows/servy/servy-config.ts:42-117`).
  Log rotation, health-check polling, and bounded restart attempts already exist as concrete,
  shipped primitives — but only as static Servy-XML/systemd-unit generation at deploy-compile
  time, for a fixed, known-at-build set of compile targets. There is no live daemon that can add a
  new supervised process at runtime, no unified cross-OS status/log query API, and no admin UI.
- **`extractCompileTargets()` already turns every `BackgroundProcessors.<name>.entrypoints.<n>`
  entry into a `deno compile`-able `CompileTarget`** with its own workdir, permissions, env,
  `concurrencyEnvVar`/`defaultConcurrency`, and description
  (`packages/cli/src/kernel/adapters/deploy/compile/compile-targets.ts:83-138`, background-processor
  branch at lines 117-138). Concurrency is only a scalar config value plumbed to the child
  process's own env var (`concurrencyEnvVar`) for the process to self-fan-out internally (e.g.
  spawn N workers in-process) — there is no systemd instantiated-unit (`@.service` + `Instance=`)
  or per-instance Servy service generation found in this codebase (confirmed by an empty grep for
  `Instance`/template-unit syntax across the systemd/servy adapters). A pm core that wants "N
  independent OS-supervised instances of the same process" (the classic pm2 `cluster` mode) has no
  existing primitive to build on here and would need to add one — this is a genuine gap, not
  reuse.

## Feature / comparison matrix

| Capability | pup / pm2 baseline | NetScript today | Status |
| --- | --- | --- | --- |
| Spawn subprocess, capture stdout/stderr | core | `DaxProcessRunner` (dax-process-runner.ts:33-87) | Present |
| Env/permission injection incl. trace context | n/a (pm2 has env only) | `WorkerTaskPermissions` + TRACEPARENT/TRACESTATE/CORRELATION_ID (dax-process-runner.ts:89-98) | Present |
| Per-runtime command building (deno/python/etc) | n/a | 7 built-in `RuntimeAdapterBase` subclasses (multi-runtime-task-executor.ts:196-204) | Present |
| One-shot execution + retry count | n/a (pm2 restarts forever) | `JobConfig.maxRetries` (job-config.ts:65,99) | Present (bounded, not restart-forever) |
| Long-running supervise-and-restart daemon | core (pm2 daemon, pup supervisor) | none — executor returns once; systemd/servy `Restart=` only at OS-service compile time | Missing (as a live daemon) |
| Static per-service restart policy (config time) | n/a | systemd `Restart=on-failure`/`RestartSec` (systemd-unit.ts:127-128); Servy `recoveryAction`/`maxRestartAttempts` (servy-config.ts:100-101) | Partial (build-time only) |
| Log rotation | pm2 (via pm2-logrotate module) | Servy `enableSizeRotation`/`enableDateRotation`/`maxRotations` (servy-config.ts:89-93); systemd to journald (systemd-unit.ts:131-132) | Partial (Windows explicit, Linux delegates to journald) |
| Health checks | pm2 (basic), pup (basic) | Servy `healthCheckUrl`/`heartbeatIntervalSeconds`/`maxFailedChecks` (servy-config.ts:95-98); systemd only comments the URL (systemd-unit.ts:99-100) | Partial (Windows only, Linux is a comment) |
| Cross-instance clustering (N copies of 1 proc) | pm2 `cluster` mode | `concurrency`/`concurrencyEnvVar` passed to the process to self-fan-out; no per-instance OS unit | Missing (as OS-supervised instances) |
| CLI list/status/logs across all processes | core (`pm2 ls`, `pup status`) | `OsServicePort.run('status'/'logs', name)` per single service name only (os-service-port.ts:36-45) | Partial (single-target status, no aggregate view) |
| IPC / live control channel | pm2 (Unix socket), pup (internal API) | `WatchableKv.watch`/`watchPrefix` (watchable-kv.ts:37-101) — usable, unused for this purpose today | Missing (primitive exists, not wired) |
| Admin UI | pm2 (web, paid), pup (web UI) | none in-repo | Missing (charter surface A) |
| Declarative process manifest | pm2 `ecosystem.config.js` | `appsettings.json` `BackgroundProcessors.<name>` to `ResolvedBackgroundProcessorConfig` (resolved-config.ts:79-94) | Present (compile-time), needs a runtime-mutable counterpart |
| Typed admin API (oRPC) | n/a | `PluginServiceContribution` seam (plugin-service-contribution.ts:4-11) ready to host it | Present (seam only, no pm service yet) |
| OTEL span/attribute convention for the domain | n/a | `NetScriptAttributeDomains` has no `PROCESS` entry yet (telemetry-convention.ts:30-46) | Missing (needs new domain) |

## What process-execution primitives already exist

Spawn (`DaxProcessRunner`), env/permission construction (`WorkerTaskPermissions`,
`command-spec.ts`), per-runtime argv building (7 adapters), OTEL-wrapped one-shot execution with
span/attribute conventions, W3C trace-context subprocess propagation, graceful multi-resource
shutdown fan-out (`ShutdownManager`), a declarative background-processor manifest resolved from
`appsettings.json`, and OS-service install/lifecycle ports for both Windows (Servy) and Linux
(systemd) including static restart policy, log destination/rotation, and health-check
configuration at deploy-compile time.

## What supervision primitives are missing

A live daemon process that: keeps a registry of supervised processes with PIDs/status/restart
counts; restarts on unexpected exit with a runtime-tunable backoff policy (not just a
compile-time systemd/servy constant); exposes aggregate list/status/logs across all supervised
processes through one CLI/API surface (today `OsServicePort.run()` is single-service-name only);
provides a control-plane IPC channel (the `WatchableKv` primitive exists but nothing consumes it
for this purpose); supports N-instance clustering as independently OS-supervised units (no
templated systemd `@.service` / per-instance Servy config generation exists); and any admin
UI at all. The `netscript.*` telemetry domain also needs a new `PROCESS` (and likely
`SERVICE_INSTANCE`) entry before a pm plugin can be TC-6-compliant.

## Workers-vs-process-manager framing, verified

Confirmed against code, not just charter prose: `plugin-workers-core`'s entire executor stack
(`MultiRuntimeTaskExecutor`, all `RuntimeAdapterBase` subclasses, `JobConfig`) is built around a
single bounded execution returning a terminal `TaskResult`; nothing in that package tracks a
process as "should be running" versus "ran once." The process-manager plugin should not
duplicate command-building or subprocess spawning — it should depend on the same primitives
(`RuntimeCommandSpec`/`ProcessRunner`-shaped seam) for "how to build and run one exec," while adding
its own long-lived supervision loop, registry, restart-policy engine, and control plane on top.
Where it should plug into existing extension points rather than invent new ones:
`PluginBackgroundProcessorContribution` (already the axis `workers` itself declares under), the
`BackgroundProcessors` config resolution path, `DeployTargetPort`/`OsServicePort` for the bare-metal
install/up/down/status/logs surface, `PluginServiceContribution` for its own oRPC admin API, and
`WatchableKv` for control-plane messaging.

## Relevance to the NetScript process-manager plugin

1. Core package boundary: a `plugin-process-manager-core` should own the supervision loop,
   process registry (KV-backed, following `kv-job-registry.ts`'s pattern), restart-policy engine,
   and a `ProcessRuntimeAdapter` port shaped like today's `TaskRuntimeAdapter`
   (`abstracts/task-runtime-adapter.ts:11-23`) so command-building code (dax-process-runner.ts,
   command-spec.ts) can be shared/wrapped rather than copied.
2. Bare-metal deploy target: the plugin's "install as OS service" path is a thin consumer of
   `OsServicePort` + `DeployTargetPort`, registering a new `DeployTargetPort` (or extending
   `ServiceDeployTarget`) alongside `linux-service`/`windows-service` — this is most of the "final
   objective" (charter: "how NetScript apps are run, supervised, and administered on bare metal")
   already scaffolded by #337-#340.
3. Dev fallback: for `--no-aspire` scaffolds, the pm plugin's CLI can supervise the app plus
   any background processors as ordinary child processes (same `DaxProcessRunner`/`ShutdownManager`
   primitives) without requiring Aspire — directly answering the charter's nice-to-have.
4. Two surfaces, one core: both the CLI and the Deno Desktop admin console should be thin
   presentation layers over one `PluginServiceContribution`-declared oRPC service exposing the
   core's registry/restart/log-query operations — mirroring how `workers` exposes its describe
   router today.
5. Telemetry: add `NetScriptAttributeDomains.PROCESS = 'netscript.process'` (and probably
   `.SERVICE_INSTANCE`) to `telemetry-convention.ts`, and instrument via the same
   `TaskInstrumentationLike`-style facade pattern the workers package already uses, to stay
   TC-6/TC-13 compliant from day one.
6. Clustering gap is a genuine build item: N-instance supervision (systemd instantiated units,
   per-instance Servy services) does not exist anywhere in the repo today and must be designed net
   new rather than "reused."

## Open questions (for synthesis / Stage C)

- Should the pm core's process registry live in `@netscript/kv` directly, or behind a new
  `ports/process-registry-port.ts` in the pm core (mirroring `job-storage-port.ts`) so a Postgres/
  Redis-backed registry is swappable later?
- Does the pm plugin need its own `DeployTargetPort` key (e.g. `process-manager`), or does it
  become the implementation detail behind the existing `linux-service`/`windows-service` targets
  (i.e. `up` on those targets delegates to the pm daemon instead of raw systemctl/servy)? This
  materially changes the #327 epic's target-key taxonomy and needs an explicit design-pack answer.
- Is N-instance clustering in scope for the RFC's first milestone, or deferred (given no existing
  primitive to build on, per the matrix above)?
- Should `WatchableKv.watchPrefix` be the sanctioned IPC transport for pm control-plane commands,
  or is a Unix-domain-socket/named-pipe transport (closer to pm2's actual mechanism) required for
  latency/ordering guarantees KV watch polling cannot give on non-Deno-KV backends
  (`supportsWatch === false` fallback, watchable-kv.ts:109)?

## Sources

- `packages/plugin-workers-core/src/executor/adapters/command-spec.ts`
- `packages/plugin-workers-core/src/executor/adapters/executable-runtime-adapter.ts`
- `packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts`
- `packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts`
- `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts`
- `packages/plugin-workers-core/src/executor/executor-types.ts`
- `packages/plugin-workers-core/src/abstracts/task-runtime-adapter.ts`
- `packages/plugin-workers-core/src/abstracts/job-dispatcher.ts`
- `packages/plugin-workers-core/src/shutdown/shutdown-manager.ts`
- `packages/plugin-workers-core/src/config/job-config.ts`
- `packages/aspire/src/runtime/contribution-registry.ts`
- `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts`
- `packages/aspire/src/application/compose-apphost.ts`
- `packages/cli/src/kernel/domain/scaffold/scaffold-options.ts`
- `packages/cli/src/kernel/templates/workspace/generate-readme.ts`
- `packages/cli/src/kernel/application/scaffold/init-pipeline.ts`
- `packages/cli/src/kernel/application/scaffold/init-orchestrator.ts`
- `packages/telemetry/src/domain/telemetry-convention.ts`
- `packages/telemetry/src/instrumentation/worker.ts`
- `packages/plugin/src/abstracts/plugin-service-contribution.ts`
- `packages/plugin/src/abstracts/plugin-background-processor-contribution.ts`
- `packages/plugin/src/abstracts/plugin-aspire-contribution.ts`
- `plugins/workers/src/public/mod.ts`
- `packages/cli/src/kernel/domain/resolved-config.ts`
- `packages/cli/src/kernel/adapters/config/deploy-config-background.ts`
- `packages/kv/types/watchable-kv.ts`
- `packages/plugin-workers-core/src/registry/kv-job-registry.ts`
- `packages/cli/src/public/ports/os-service-port.ts`
- `packages/cli/src/public/adapters/systemd-os-service.ts`
- `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`
- `packages/cli/src/kernel/domain/deploy/linux-service-deploy-target.ts`
- `packages/cli/src/kernel/adapters/linux/systemd/systemd-unit.ts`
- `packages/cli/src/kernel/adapters/windows/servy/servy-config.ts`
- `packages/cli/src/kernel/adapters/deploy/compile/compile-targets.ts`
