# Current-state capability matrix: runtime-versioned workers, tasks, and triggers

## Executive summary

- **[PARTIAL]** The current repository still contains two functional halves of runtime versioning: a typed loader/watcher and a CLI filesystem publisher, but no production worker or trigger composition imports the snapshots.
- **[PROVEN]** The real filesystem store publishes immutable-looking topic documents, activates through temp-file + rename, and rolls back one topic while preserving the pointer fields it read.
- **[PROVEN]** That preservation is not concurrency-safe: a probe lost one of two simultaneous topic promotions in 20/20 trials; there is no revision, compare-and-swap, lock, author, or approval field.
- **[PROVEN]** The watcher reacts to filesystem changes and reloads, but malformed JSON is silently converted to an empty topic and callback failures are swallowed.
- **[PARTIAL]** `RuntimeTask` describes seven runtimes, while the worker executor consumes a different, richer `TaskDefinition`; no adapter maps or seeds versioned tasks into the KV task registry.
- **[PROVEN]** The execution engine itself ran trivial Deno and shell tasks successfully; built-in adapters also exist for Python, .NET, PowerShell, cmd, and native executables.
- **[PARTIAL]** Deno permissions are translated into flags, but an omitted permission object grants `--allow-all`; non-Deno subprocesses inherit the full host environment and have no task sandbox.
- **[PROVEN]** Worker APIs expose KV-backed task definitions and execution history, but those definitions originate in KV/project source—not the versioned runtime tree.
- **[PARTIAL]** Task `schedule` is data only; the delivered scheduler enumerates jobs, once at startup, not tasks.
- **[PROVEN]** Trigger definitions load from generated TypeScript registries at process startup; scheduled and file-watch definitions are wired to the processor, and webhook service composition uses the same loaded definition set.
- **[PROVEN]** Trigger processing has tested idempotency, retry, concurrency, DLQ behavior, KV-backed defer replay, enabled-state enforcement, and tracing seams.
- **[PARTIAL]** Trigger enable/disable is a real KV-backed API, but versioned `TriggerOverride` files are never composed into it and cannot add a trigger.
- **[PROVEN]** `netscript generate runtime-schemas` has a real planner/writer and duplicate-owner rejection, yet the baseline plugin snapshot deliberately replaces declared topic schemas with `schemas: []`; a clean CLI probe wrote zero files.
- **[PARTIAL]** Plugin installation emits executable `workers/runtime.ts` and `triggers/runtime.ts`; official samples additionally emit `current` and version documents. The runtime glue consumes generated code registries, not those JSON trees.
- **[ABSENT]** A pointer change cannot hot-add, update, or roll back a running task/trigger in the delivered composition. The watcher is a library primitive with no production subscriber.
- **[PARTIAL]** The present system is useful as a static worker/trigger runtime and as an experimental local filesystem control plane, but it is not a coherent production runtime-versioned automation capability.

## Scope, baseline, and labels

- **[PROVEN]** Research was performed in `/home/codex/repos/ns-rfc-runtime-versioned-automation` on branch `docs/rfc-runtime-versioned-automation` at `e7378bf7c15dcb5ef22e4904a99601cbd4b79ca9`. The brief names `origin/main` at `2256a67bf612907195ce5e51df1df7326c504f2b`; a path-scoped diff established that `packages/`, `plugins/`, `apps/`, `deno.json`, and `deno.lock` are unchanged between those commits. The later commit contains harness artifacts only.
- **[PROVEN]** `PROVEN` means an existing test/E2E definition or a bounded probe exercised the behavior; `IMPLEMENTED-UNPROVEN` means the executable call path appears complete but was not exercised here; `PARTIAL` means useful code exists with a material missing connection; `ABSENT` means no executable path was found.
- **[PROVEN]** This is current-state evidence, not a doctrine grade. Dispositions assume the authorized clean redesign: **keep** means retain the behavior/contract, **extract idea** means preserve the concept but not this surface, and **delete** means inventory the current surface for removal.

## Hypotheses H1–H6

| Hypothesis | Verdict | Evidence and disposition |
|---|---|---|
| H1 — loader/watcher and CLI store work, but production does not consume snapshots | **[PROVEN] Confirmed** | The loader reads `current` and five topic files (`packages/runtime-config/src/application/loader.ts:94-118`); the watcher uses recursive `Deno.watchFs` and debounced reload (`packages/runtime-config/src/application/watcher.ts:23-57`). A production-source search excluding tests, docs, templates, and generated assets found no external import/call; only a Windows environment-builder comment claims future use (`packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:242-252`). **Disposition:** keep the snapshot concept and tested loader semantics; delete the disconnected package/composition surface unless it becomes the new control-plane port. |
| H2 — task schemas drift and snapshots do not feed execution | **[PROVEN] Confirmed** | `RuntimeTask` uses `runtime`, carries seven runtime labels, and permits arbitrary extra fields (`packages/runtime-config/src/domain/types.ts:26-39`, `packages/runtime-config/src/domain/types.ts:109-130`). The executor requires `type`, supports permissions/env/args/metadata, and dispatches on `task.type` (`packages/plugin-workers-core/src/executor/executor-types.ts:13-41`; `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:71-83`, `:116-134`). The worker runtime gets a KV task registry and executor independently (`plugins/workers/services/src/service-runtime.ts:79-88`; `plugins/workers/bin/runtime.ts:89-103`). P4 loaded a versioned task but `executor.supports()` returned false. `NETSCRIPT_TASKS_DIR` only resolves entrypoint paths (`packages/plugin-workers-core/src/executor/adapters/path-resolution.ts:14-23`; `plugins/workers/worker/job-execution.ts:200-219`). **Disposition:** keep one rich execution contract; delete `RuntimeTask` or replace it with a validated canonical definition plus explicit promotion adapter. |
| H3 — trigger JSON is override-only; runtime uses generated registries | **[PROVEN] Confirmed** | `TriggerOverride` has only `id`, optional `enabled`, optional `paths`, and an escape hatch (`packages/runtime-config/src/domain/types.ts:81-93`). Service composition loads definitions through `loadProjectTriggerDefinitions()` (`plugins/triggers/services/src/main.ts:161-183`), whose default is `.netscript/generated/plugin-triggers/triggers.registry.ts` and whose validator requires `id`, `kind`, and `handler` (`plugins/triggers/src/runtime/project-trigger-registry.ts:6-25`, `:69-95`). Background startup schedules/watches this fixed definition array (`plugins/triggers/src/runtime/trigger-processor.ts:30-70`). No runtime-config import exists. **Disposition:** keep generated-registry boot support only as a static-authoring input; extract enabled-state and processor ports; delete duplicate JSON override shape. |
| H4 — schema generator is real but baseline contributions collapse to empty | **[PROVEN] Confirmed** | The use case plans per-topic writes, honors configured output paths, writes JSON, and rejects duplicate owners (`packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:99-175`). CLI dependencies source schemas from registered plugin snapshots (`packages/cli/src/public/features/root/public-command-dependencies.ts:329-341`), but snapshot normalization emits `{ schemas: [] }` for every manifest with runtime topics (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:447-471`), and a test explicitly expects the placeholder (`packages/cli/src/kernel/adapters/config/plugin-registry.test.ts:25-33`). P3 exited 0 with `0 written`. This records baseline behavior only; it does not re-evaluate PR #1444 / issue #1445. **Disposition:** keep duplicate-owner detection and deterministic planning; delete the placeholder registry projection and redesign schema ownership/loading. |
| H5 — generic versioned CLI competes with workers `.netscript/runtime` commands | **[PROVEN] Confirmed** | `netscript config override` wires list/get/set/clear/enable/disable plus publish/rollback to `RuntimeConfigStorePort` (`packages/cli/src/public/features/config/override/override-group.ts:13-38`). Workers `config-edit` creates `.netscript/runtime/<topic>.json`; `config-publish` merely parses and echoes it without versioning or activation (`plugins/workers/src/cli/local-runtime-backend.ts:335-351`). **Disposition:** keep one control-plane CLI after its contract is redesigned; delete workers `config-edit`/`config-publish`. |
| H6 — no concurrency/control-plane metadata or multi-instance propagation | **[PROVEN] Confirmed** | The store port has only pointer read/replace, topic read/write, and version list—no revision/CAS or audit inputs (`packages/cli/src/kernel/ports/runtime-config-store-port.ts:13-34`). Activation writes a UUID temp then renames locally (`packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts:35-45`). Publish performs document write then read/merge/write of `current` (`packages/cli/src/public/features/config/override/manage-runtime-overrides.ts:14-38`), so concurrent topics race; P1 observed 20/20 lost updates. Topic names are CLI allow-listed (`packages/cli/src/public/features/config/override/runtime-lifecycle-command.ts:46-52`) and version input is reduced with `basename` (`packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts:74-76`), but the loader accepts arbitrary string pointer paths and joins them without confinement (`packages/runtime-config/src/application/loader.ts:80-87`, `:102-110`). There is no broadcast or shared revision protocol. **Disposition:** extract atomic immutable publication as an idea; delete this store as a production control plane. |

## Legacy → current mapping

| Legacy executive-summary capability | Current equivalent | Status | Current gap / disposition |
|---|---|---|---|
| Static compiled TypeScript jobs and webhook/file/scheduled triggers ran | Generated worker job registry and generated trigger registry are loaded at startup (`plugins/workers/bin/runtime.ts:36-58`; `plugins/triggers/src/runtime/project-trigger-registry.ts:6-25`) | **[PROVEN]** | Static runtime remains real. **Keep** as a bootstrap/source input, not as mutable runtime state. |
| Checked-in `current` pointers did not control running subsystems | Loader/store are better isolated and tested, but still have no production subscriber | **[PROVEN]** | Same operational gap. **Extract idea/delete surface.** |
| Pointer/version edits could not hot-add/update/rollback live tasks/triggers | Watcher probe reloads a consumer, but no delivered worker/trigger registers one (`packages/runtime-config/src/application/watcher.ts:9-62`) | **[ABSENT]** | No operator hot path. **Redesign.** |
| KV task registry and polyglot executor existed without a versioned seeder | Current service creates `KvTaskRegistry`; execution resolves it before queue work (`plugins/workers/services/src/service-runtime.ts:79-88`; `plugins/workers/worker/job-dispatcher.ts:191-229`) | **[PARTIAL]** | Still no filesystem snapshot → canonical registry promotion. **Keep registry/executor, add explicit control-plane adapter.** |
| Pre-registered tasks executed seven runtimes with persistence | Default adapter map has Deno, Python, .NET, shell, PowerShell, cmd, executable (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:184-204`); P5 proved Deno+shell | **[PROVEN]** | Other five rely on unit/path evidence here. **Keep engine behind canonical task contract.** |
| Task scheduling was declarative only | `RuntimeTask.schedule` remains, while scheduler loads only `registry.listScheduled()` jobs at startup (`packages/runtime-config/src/domain/types.ts:125-130`; `plugins/workers/worker/scheduler.ts:78-110`, `:147-167`) | **[PARTIAL]** | No task scheduler or reschedule subscription. **Delete misleading field until implemented.** |
| Worker job CRUD/manual trigger real; timers startup-only | Workers API/CLI and generated registry are richer, but scheduler still loads at `start()` only | **[PARTIAL]** | Static timer refresh problem remains. **Keep API contracts only where backed; redesign scheduler reconciliation.** |
| Trigger actions enqueue jobs or defer | Runtime dispatch uses worker queue and KV defer scheduler (`plugins/triggers/src/runtime/trigger-runtime-processor.ts:67-96`) | **[PROVEN]** | Strong reusable processor seam. **Keep.** |
| Webhooks persisted; scheduled/file events bypassed ingress history | Trigger service owns KV event store; scheduled/file processor startup invokes processor directly (`plugins/triggers/services/src/main.ts:168-199`; `plugins/triggers/src/runtime/trigger-processor.ts:46-62`) | **[PARTIAL]** | History remains source-dependent. **Keep event contract, unify ingestion.** |
| Worker cockpit task/execution pages called real APIs | Current worker routes list/get/trigger tasks and list/get task executions (`plugins/workers/services/src/routers/tasks.ts:16-43`, `:45-83`, `:86-118`) | **[PROVEN]** | API is real but task population is disconnected from versioned files. **Keep API concept.** |
| Cockpit could not create tasks; trigger UI contract was dead | Trigger v1 now backs reads, webhook ingress, enable/disable, but explicitly leaves other mutations/streaming pending (`plugins/triggers/services/src/routers/v1.ts:1-15`, `:220-248`) | **[PARTIAL]** | Improved connector, still not a runtime-config control plane. **Keep backed routes; delete/withhold unbacked ones.** |
| Deno permission omission meant allow-all; non-Deno unsandboxed | Same behavior (`packages/plugin-workers-core/src/executor/adapters/permission-flags.ts:3-18`; `packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-97`) | **[PROVEN]** | Unsafe default and no OS isolation. **Keep explicit permission vocabulary; delete allow-all default.** |
| Schemas were editor artifacts, not load validators | Loader still uses unchecked casts and catches parse errors (`packages/runtime-config/src/application/loader.ts:36-42`, `:102-118`) | **[PROVEN]** | Generated schemas do not enforce load. **Keep JSON Schema as authoring artifact; require runtime validation separately.** |
| Schema CLI registered but plugin schemas collapsed to empty | Exactly persists on this baseline (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:466-468`) | **[PROVEN]** | P3 wrote zero. **Delete placeholder path.** |
| Static-demo quality, not production runtime configuration | Static runtimes/API/history improved, but control-plane split, races, silent failure, and absent auth/revision remain | **[PARTIAL]** | Still not production-ready as runtime-versioned automation. **Complete redesign justified.** |

## Current capability matrix

### 1. Versioned read model and filesystem store

| Surface | Actual behavior | Status | Disposition |
|---|---|---|---|
| Pointer format | `current` may be a JSON object with optional `version/jobs/sagas/tasks/triggers/features` string fields, or legacy plain semver expanded to conventional topic paths (`packages/runtime-config/src/application/loader.ts:45-77`; `packages/runtime-config/src/domain/types.ts:149-165`). | **[PROVEN]** by loader tests and P2 | **Extract idea.** Use a required schema/revision, not optional unvalidated strings. |
| Version documents | Loader concurrently reads `{overrides}` for jobs/sagas/triggers, `{flags}` for features, `{tasks}` for tasks (`packages/runtime-config/src/application/loader.ts:102-118`). | **[PROVEN]** | **Keep conceptual topic documents**, replace unchecked shapes. |
| Missing/malformed behavior | All read/parse exceptions become `null`, then empty arrays; malformed pointer returns all-empty (`packages/runtime-config/src/application/loader.ts:36-42`, `:94-118`). | **[PROVEN]** by tests and P2 | **Delete silent success**; fail closed and surface diagnostics. |
| Watch behavior | Recursive FS watch accepts create/modify/remove, debounces 300 ms, reloads whole snapshot, and swallows reload/callback errors (`packages/runtime-config/src/application/watcher.ts:23-61`, `:65-76`). | **[PROVEN]** by P2 | **Extract idea.** Consumer lifecycle, diagnostics, and last-known-good semantics must be explicit. |
| Publication | Topic document is written directly and the same version can be overwritten; only the pointer uses temp + rename (`packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts:35-56`). Thus filenames are versioned but documents are not immutable by enforcement. | **[PROVEN]** by P1/code | **Extract immutable publish/atomic activate**, add create-only/digest checks, fsync/durability, and transactional manifest semantics. |
| Rollback | Verifies target JSON parses, shallow-merges one topic into the previously read pointer, then activates (`packages/cli/src/public/features/config/override/manage-runtime-overrides.ts:25-38`). | **[PROVEN]** | **Keep operator intent**, redesign as revision-conditional transaction. |

No load-time JSON Schema validation, referential check, duplicate-ID check, entrypoint check, runtime availability check, or schedule validation exists. **[ABSENT]** The loader's `JSON.parse(...) as T` is the entire validation boundary (`packages/runtime-config/src/application/loader.ts:36-42`).

### 2. Tasks, execution, scheduling, and permissions

- **[PROVEN]** The canonical worker service task source is KV: `createWorkersServiceRuntime()` constructs `KvTaskRegistry`, and task API handlers read it (`plugins/workers/services/src/service-runtime.ts:79-88`; `plugins/workers/services/src/routers/tasks.ts:16-43`). **Disposition: keep** a durable registry port.
- **[PROVEN]** The local workers CLI instead discovers project files under `workers/tasks` (plus marked external files), imports Deno definitions, and directly calls the executor (`plugins/workers/src/cli/local-runtime-backend.ts:276-318`, `:207-223`). It neither reads versioned runtime-config nor seeds KV. **Disposition: consolidate/delete duplicate source paths.**
- **[PROVEN]** Worker queue dispatch resolves `taskId` from `context.taskRegistry`, creates an execution record, and then executes (`plugins/workers/worker/job-dispatcher.ts:191-229`; `plugins/workers/worker/job-execution.ts:177-197`). **Disposition: keep** the dispatch seam.
- **[PROVEN]** Execution records persist concept, task/job ID, status, trigger, timestamps, result/error, retry, correlation, and trace context under KV prefix `['workers','executions']` (`packages/plugin-workers-core/src/state/execution-state.ts:8-12`, `:27-78`, `:132-178`). **Disposition: keep** the domain data, add config revision/digest linkage.
- **[PROVEN]** Deno task permissions map to Deno flags, but undefined permissions yield `--allow-all` (`packages/plugin-workers-core/src/executor/adapters/permission-flags.ts:3-18`). Other adapters run host processes with inherited environment (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:51-65`, `:89-97`). **Disposition: keep explicit least-privilege policy; delete permissive default and require external sandbox policy for native runtimes.**
- **[PARTIAL]** The plugin resource authoring CLI exposes only Deno/Python/shell/PowerShell even though the executor supports seven types (`plugins/workers/src/adapter/resources/input.ts:8-12`, `:104-117`; `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:194-204`). **Disposition: unify capability negotiation.**
- **[ABSENT]** No task scheduler consumes `RuntimeTask.schedule`; the current scheduler enumerates job registry schedules only once at startup (`plugins/workers/worker/scheduler.ts:78-110`, `:147-167`).

### 3. Triggers, dispatch, persistence, and replay

- **[PROVEN]** Trigger source of truth at process boot is a generated TypeScript registry or fallback `triggers/mod.ts`; there is no runtime reload watcher (`plugins/triggers/src/runtime/project-trigger-registry.ts:6-39`, `:69-95`). **Disposition: keep static boot discovery only as one publisher input.**
- **[PROVEN]** Background runtime registers scheduled and file-watch definitions with adapters and routes callbacks to the processor (`plugins/triggers/src/runtime/trigger-processor.ts:30-70`). Webhook service composition filters the same loaded definitions for ingress (`plugins/triggers/services/src/main.ts:168-199`).
- **[PROVEN]** Core processor applies idempotency, retries, per-trigger concurrency/circuit state, dispatch, completion marking, and DLQ; the targeted suite proved dispatch-once, duplicate rejection, exhausted-retry DLQ, jitter, and reserved-kind rejection (`packages/plugin-triggers-core/src/runtime/trigger-processor.ts:61-103`, `:117-174`; probe log test result).
- **[PROVEN]** Plugin composition supplies KV idempotency, KV DLQ, KV defer scheduler, worker-job queue dispatch, and tracing; deferred definitions are held in process memory for replay lookup (`plugins/triggers/src/runtime/trigger-runtime-processor.ts:67-96`, `:131-180`). **Disposition: keep ports and durable records; persist definition revision with deferred events.**
- **[PROVEN]** Trigger enable/disable API writes a KV enabled-state store and returns the updated definition response (`plugins/triggers/services/src/routers/v1.ts:220-243`; `plugins/triggers/services/src/main.ts:168-182`). **Disposition: keep behavior**, but fold it into the canonical revisioned control plane.
- **[PARTIAL]** Webhook ingress has a KV event store, while scheduled/file-watch callbacks call the processor directly, so history is not uniform (`plugins/triggers/services/src/main.ts:168-199`; `plugins/triggers/src/runtime/trigger-processor.ts:46-62`).
- **[ABSENT]** Versioned `TriggerOverride.paths` and `.enabled` are never applied. Trigger definitions cannot be additively created by a JSON snapshot.

### 4. Schema generation and scaffold truth

- **[PROVEN]** `generate runtime-schemas` is a registered public command with `--dry-run`, `--force`, and `--project-root`; it reports only write/unchanged counts (`packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas-command.ts:29-65`).
- **[PROVEN]** Given actual contributions, the use case emits one raw schema object per topic either to configured `schemaPath` or `<topic>/runtime/schema.json`, and rejects multiple owners (`packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:137-175`).
- **[PROVEN]** On this baseline, registered official plugins expose an empty schema list despite declaring runtime topics (`packages/cli/src/kernel/adapters/config/plugin-registry.ts:447-471`). P3's real CLI output was `Schema generation complete: 0 written.` **Disposition: preserve planner tests, replace discovery/projection.**
- **[PROVEN]** Normal plugin install emits `workers/runtime.ts` and `triggers/runtime.ts`; tests assert these glue files and their package-runtime imports (`packages/cli/src/public/features/plugins/install/install-plugin_test.ts:163-178`, `:527-552`, `:815-834`). The glue starts package runtimes and contains no runtime-config loading (`plugins/workers/src/adapter/resources/glue/runtime.stub.ts:11-25`; `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts:11-21`).
- **[PROVEN]** Official sample copying additionally writes per-workspace `current` plus `v1.0.0.json` task/saga/trigger documents (`plugins/workers/src/cli/official-sample-configuration.ts:72-139`, `:142-180`); tests assert worker tasks and trigger overrides (`packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:61-76`). With `includeSamples: false`, those runtime docs are absent (`packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:79-101`).
- **[PARTIAL]** Sample config names `workers/runtime/schema.json`, `sagas/runtime/schema.json`, and `triggers/runtime/schema.json` (`plugins/workers/src/cli/official-sample-configuration.ts:241-256`), but the sample writer creates only pointer/topic documents and baseline schema generation writes none. Thus a version document can contain a `$schema` reference to a nonexistent file (`plugins/workers/src/cli/official-sample-configuration.ts:149-178`). **Disposition: delete generated dead artifacts until the pipeline is coherent.**

### 5. Aspire/deployment and multi-instance behavior

- **[PROVEN]** Windows/Servy environment generation sets `NETSCRIPT_RUNTIME_CONFIG_DIR` for all services and `NETSCRIPT_TASKS_DIR` for workers (`packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:239-253`). This is environment plumbing only; its adjacent comment claiming trigger loader/watcher use is contradicted by the production call graph.
- **[PROVEN]** Worker generated runtime glue calls `startCombinedProcess()`, which creates KV-backed runtime services, imports the generated job registry, starts worker/scheduler, and constructs the task executor (`plugins/workers/src/adapter/resources/glue/runtime.stub.ts:21-25`; `plugins/workers/bin/runtime.ts:89-128`). It does not load a snapshot.
- **[PROVEN]** Trigger glue calls `startCombinedProcess()`, whose definition array is loaded once and used to install scheduled/file watchers (`plugins/triggers/src/adapter/resources/glue/runtime.stub.ts:16-21`; `plugins/triggers/src/runtime/trigger-processor.ts:30-70`). It does not watch a config tree or registry module.
- **[ABSENT]** Therefore a deployed process does not observe pointer changes. Multiple instances have no shared filesystem notification/revision protocol; even on a shared filesystem each would require an explicitly registered watcher, which none has.

### 6. Telemetry, management APIs, UI, and history

- **[PROVEN]** `MultiRuntimeTaskExecutor` creates an internal span and records adapter, executor, runtime, task, correlation, duration, status, and error attributes (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:76-113`, `:159-180`). Targeted tests prove tracer export.
- **[PROVEN]** Worker history is durable KV state and task endpoints expose list/get execution records (`packages/plugin-workers-core/src/state/execution-state.ts:132-178`; `plugins/workers/services/src/routers/tasks.ts:86-118`). **Gap:** records do not identify the runtime-config version because execution never consumes one.
- **[PROVEN]** Trigger runtime wraps processor dispatch in shared tracing and uses KV stores for idempotency, DLQ, defer, enabled state, and webhook event history (`plugins/triggers/src/runtime/trigger-runtime-processor.ts:23-65`, `:67-96`; `plugins/triggers/services/src/main.ts:168-199`).
- **[PARTIAL]** Trigger v1 handlers explicitly say introspection, event reads, webhook ingress, and enable/disable are real while remaining mutations/streaming are pending (`plugins/triggers/services/src/routers/v1.ts:1-15`). There is no management endpoint for version documents, pointer activation, approvals, or diff/preview.
- **[ABSENT]** A focused search found no app route or management UI importing `@netscript/runtime-config`, calling the generic runtime store, or mutating `current`. Current UI/API operational surfaces sit over KV registries/state, not the versioned filesystem.

## Persistence and synchronization model

| Concern | Current reality | Status |
|---|---|---|
| Filesystem source | CLI version documents and `current`; local workers config uses a second `.netscript/runtime/<topic>.json` tree | **[PROVEN]** |
| Worker source | Generated TS job registry at boot; KV task/job registries and KV execution/idempotency state at runtime | **[PROVEN]** |
| Trigger source | Generated TS definitions at boot; KV enabled/idempotency/DLQ/defer/event state | **[PROVEN]** |
| Filesystem → KV sync | No mapper, seeder, reconciliation loop, or event consumer | **[ABSENT]** |
| Atomicity | Local pointer replacement only; topic write and multi-topic state are not one transaction | **[PROVEN]** |
| Multi-instance | KV state can be shared through its adapter, but filesystem activation has no subscriber/broadcast/version acknowledgment | **[PARTIAL]** |
| Race/failure handling | Temp pointer cleaned on activation error; malformed reads silently empty; concurrent read/merge/write loses updates; no last-known-good or quorum | **[PROVEN]** |
| Path confinement | CLI topic allow-list and version `basename` reduce direct CLI traversal; loader pointer paths are not confined to runtime root | **[PARTIAL]** |

## Test, docs, and E2E truth

### Tests and gates that prove something

- **[PROVEN]** Targeted existing suites run in this slice: runtime-config loader/accessors/summary, override lifecycle, schema planning/writing/duplicate-owner rejection, worker executor dispatch/telemetry, and trigger processor behavior. Result: 22 passed, 0 failed.
- **[PROVEN]** The repository's `scaffold.runtime` gate catalog includes live workers health/jobs/tasks/seed/execution checks and trigger health/webhook/event checks (`packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:373-410`, `:452-483`; identifiers at `packages/cli/e2e/src/domain/cli-surface.ts:125-142`). The expensive suite was not run in this research slice, per brief.
- **[PROVEN]** Install tests prove runtime glue and sample-copy tests prove sample pointer/doc emission, as cited above.
- **[ABSENT]** No located E2E gate flips `current`, observes a running task/trigger change, rolls a topic back across running instances, validates a runtime document, or promotes multiple topics atomically.

### Documented but unproven or contradicted claims

- **[PARTIAL]** Runtime-config README says operators can disable jobs/flags/triggers without deploy (`packages/runtime-config/README.md:10-16`). The library mechanics are proven; delivered composition is absent.
- **[PARTIAL]** README's consumer example invokes watcher and accessors (`packages/runtime-config/README.md:60-85`), but it is example code, not scaffold/runtime wiring.
- **[PARTIAL]** Workers README claims an end-to-end operations surface and durable multi-runtime tasks (`plugins/workers/README.md:21-37`). Direct execution and KV APIs are real, but versioned additive task publication is not.
- **[PARTIAL]** Triggers README says all three kinds drain through one processor and crash replay follows stored webhook ingress (`plugins/triggers/README.md:23-37`). Processor reuse is real; scheduled/file-watch history is not unified, and no boot-time scan proving webhook crash replay was found.
- **[IMPLEMENTED-UNPROVEN]** Built-in Python, .NET, PowerShell, cmd, and executable adapters are registered (`packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:194-204`), but this slice directly executed only Deno and shell. Existing executor tests use injected adapters rather than all host runtimes.

## Operational limitations and production-readiness gaps

- **[PROVEN]** Split-brain sources: versioned filesystem, `.netscript/runtime`, project source/generated registries, and KV registries have no declared precedence or synchronization.
- **[PROVEN]** Lost updates: activation is whole-pointer read/merge/write without a revision precondition; P1 reproduced the race every trial.
- **[PROVEN]** Partial promotion: each topic publish writes and activates independently, so a five-topic release has observable mixed versions and can fail mid-sequence (`packages/cli/src/public/features/config/override/manage-runtime-overrides.ts:14-38`).
- **[PROVEN]** False immutability: publishing an existing version overwrites its topic document in place before pointer activation; historical rollback targets can therefore change (`packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts:48-56`).
- **[PROVEN]** Silent corruption: malformed pointer/topic JSON becomes empty configuration, and watcher exceptions disappear (`packages/runtime-config/src/application/loader.ts:36-42`; `packages/runtime-config/src/application/watcher.ts:49-60`).
- **[PROVEN]** No runtime validation: generated JSON Schema is neither discovered reliably nor enforced by the loader.
- **[PROVEN]** No audit/control metadata: pointer and store contracts lack author, reason, approval, timestamps, digest, signatures, revision, or expected-current fields (`packages/cli/src/kernel/ports/runtime-config-store-port.ts:13-34`).
- **[PROVEN]** No rollout acknowledgment: there is no per-instance observed revision, health gate, automatic rollback, or convergence status.
- **[PROVEN]** Unsafe task defaults: missing Deno permission policy grants all permissions; native runtimes inherit host environment and process authority.
- **[PROVEN]** Startup-only code registries: trigger definitions and scheduled jobs are loaded at process start; generated modules are not safely hot re-imported.
- **[PARTIAL]** Authentication/authorization for runtime mutations is not part of the generic local CLI store, and no service control-plane endpoint exists. Filesystem access is the effective authority.
- **[PROVEN]** Loader pointer paths are not root-confined, so a hand-edited `current` can direct reads outside the runtime tree even though CLI-produced paths are safe-shaped.

## Disposition inventory

### Keep

- **[PROVEN]** Worker execution result/history vocabulary, KV registry ports, queue dispatch, idempotency, correlation, and OTel attributes.
- **[PROVEN]** Trigger processor ports and tested idempotency/retry/DLQ/defer/enabled-state behaviors.
- **[PROVEN]** Immutable document plus atomic active-reference concept, duplicate schema-owner detection, and dry-run planning.
- **[PROVEN]** Static generated registries as one boot/publisher source, provided they compile into a canonical validated revision.

### Extract ideas, replace implementation

- **[PARTIAL]** Runtime-config snapshot/watch semantics; require validation, last-known-good behavior, explicit subscription lifecycle, revision acknowledgment, and multi-instance distribution.
- **[PARTIAL]** JSON Schema authoring pipeline; make schema ownership discoverable and enforce the same contract at publish and load.
- **[PARTIAL]** Task runtime/permission vocabulary; unify `RuntimeTask`, executor `TaskDefinition`, builder/domain definitions, and CLI supported-runtime lists.
- **[PARTIAL]** Enable/disable and rollback operator journeys; move them into one authenticated, audited, revision-conditional control plane.

### Delete / removal candidates

- **[PROVEN]** Disconnected `RuntimeTask` and `TriggerOverride` snapshot types if no canonical adapter is introduced.
- **[PROVEN]** Workers `.netscript/runtime` `config-edit`/`config-publish` duplicate surface.
- **[PROVEN]** Baseline `{ schemas: [] }` plugin snapshot placeholder and sample `$schema` references whose targets are not emitted.
- **[PROVEN]** Windows environment-builder comments that claim loader/watcher wiring not present in code.
- **[PROVEN]** README language implying deploy-free operator behavior before a production consumer exists.

## Probe log

All probe-created files are confined to `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/current-state-probes/`; no service, container, or long-running process was started.

1. **P1, P2, P4, P5 combined bounded script**

   Command:

   ```text
   rtk proxy deno run --frozen -A .llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/current-state-probes/runtime-probes.ts
   ```

   Exit code: `0`.

   Output:

   ```text
   P1 {"rollbackPointer":{"version":"1.0.0","jobs":"jobs/v1.0.0.json"},"temporaryAfterLifecycle":0,"lostUpdates":20,"races":20}
   P2_P4 {"loadedTaskId":"runtime-only","directExecutorSupport":false,"watcherChanges":[{"tasks":2},{"tasks":0}]}
   P5 {"deno":{"success":true,"exitCode":0,"stdout":"deno-ok","error":null},"shell":{"success":true,"exitCode":0,"stdout":"shell-ok","error":null}}
   ```

   Interpretation: **[PROVEN]** P1 publish/rollback worked, pointer activation left zero temp files, and concurrent topic rollback lost an update 20/20 times. **[PROVEN]** P2 first flipped to a valid two-task document and observed `{tasks:2}`, then flipped to malformed JSON and observed silent `{tasks:0}`. **[PROVEN]** P4 loader saw `runtime-only`, but the unadapted object was unsupported because executor dispatch expects `type`, not `runtime`. **[PROVEN]** P5 executed real Deno and shell subprocesses successfully. Probe source: `.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/current-state-probes/runtime-probes.ts`.

2. **P3 real CLI, first minimal-fixture attempt**

   Command:

   ```text
   rtk proxy deno run --frozen -A packages/cli/bin/netscript.ts generate runtime-schemas --project-root .llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/current-state-probes/schema-fixture --verbose
   ```

   Exit code: `1`; the isolated consumer lacked `@netscript/config` in its import map. The fixture was corrected inside the evidence directory.

3. **P3 second attempt**

   Same command. Exit code: `1`; the isolated consumer lacked the `zod` catalog entry. The fixture was corrected inside evidence.

4. **P3 third attempt**

   Same command. Exit code: `76`; workers declared a missing streams dependency. Streams was added to the fixture.

5. **P3 final baseline result**

   Same command. Exit code: `0`.

   ```text
   Schema generation complete: 0 written.
   ```

   **[PROVEN]** The CLI command is wired and successful, but actual official-plugin discovery produces no schema writes on this baseline. No `schema.json` appeared.

6. **Targeted existing suites**

   Command:

   ```text
   rtk proxy deno test --frozen -A packages/runtime-config/tests packages/cli/src/public/features/config/override/manage-runtime-overrides_test.ts packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts packages/plugin-triggers-core/src/runtime/trigger-processor_test.ts
   ```

   Exit code: `0`; `22 passed`, `0 failed`. **[PROVEN]** This validates loader/accessors, abstract lifecycle behavior, schema planner/writer, executor adapter dispatch/telemetry, and core trigger processor behavior. It does not prove production snapshot consumption.

## Claims the supervisor should re-verify

1. **[IMPLEMENTED-UNPROVEN]** The five built-in task adapters not directly smoked here—Python, .NET, PowerShell, cmd, executable—appear complete, but host tool availability and platform-specific behavior were not exercised.
2. **[PARTIAL]** “No management UI touches runtime config” is based on repository-wide focused symbol/path searches; a dynamically generated or external cockpit consumer could exist outside the inspected source tree.
3. **[PARTIAL]** “No webhook crash replay” is an inference from the absence of a boot-time stored-event replay scan in focused trigger composition; the supervisor should re-check all event-store adapters and startup hooks before quoting it categorically.
4. **[PARTIAL]** Local `Deno.rename` gives the intended atomic pointer replacement on the tested filesystem, but this probe did not establish crash durability, fsync semantics, Windows replacement semantics, or network-filesystem atomicity.
5. **[PARTIAL]** The 20/20 lost-update result is a deterministic observation on this host, not a statistical guarantee of every scheduler/filesystem interleaving; the underlying read/merge/write race is nevertheless explicit in code.
