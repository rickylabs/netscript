# Plan — workers runtime plumbing

## Plan Gate

`PLAN-EVAL: REQUIRED`

This is a decision-heavy plan. A separate evaluator must test the locked choices below before any
implementation dispatch. No product edit begins from this run.

## Outcome

Land three bounded implementation slices:

1. route handler progress through the typed outbound-message channel into the canonical durable
   execution id and `KvExecutionState.progress()`;
2. complete the core `JobConfig` policy schema; and
3. load, validate, match, and emit project job policy in the installed workers registry generator.

#1592 Slice 1 remains outside scope. No execution record shape, durable stream schema, or producer
shape is added or revised.

## Locked decisions

### D1 — The runner host owns and consumes the outbound channel

**Decision.** `plugins/workers/worker/job-runner-pool.ts` owns one outbound channel per execution
and is the exhaustive consumer of `WorkerOutboundMessage`. The outer plugin dispatcher creates the
canonical durable execution and passes that id plus an async progress sink into `executeWorkerJob`
and `WorkerPool.executeJob`. The pool never generates an execution id.

For the shipping in-process path, the pool injects `ctx.reportProgress` as a closure that emits a
`JobProgressMessage` into the same per-execution consumer. Complete/error messages settle the
existing `JobResult`; log messages route through the existing runtime reporter/logging surface. The
progress branch awaits the supplied sink, which calls the narrow
`WorkerExecutionState.progress(executionId, percent, message)` port. That port is implemented by the
already-constructed `KvExecutionState` instance.

**Evidence forcing it.** The durable id exists only after `processWorkerJob` calls
`executionState.create`, while the current pool invents an unrelated UUID. The core message union is
public but unused, and the outer dispatcher already owns start/complete ordering. The connector is
the correct Archetype 5 transport adapter; core continues to own the message vocabulary and state
machine.

**Rejected alternatives.** A process-global callback cannot safely route concurrent executions.
Passing state storage into a job handler couples core runtime execution to an adapter. Adding a new
progress record or channel type duplicates the shipped contracts.

### D2 — In-process now; thread transport is contract-compatible but not fabricated

**Decision.** The in-process runner uses a direct async function call to feed the host consumer; it
does not allocate a `MessageChannel` merely to simulate serialization. A future real Worker adapter
must send the existing `ExecuteJobMessage` to the worker and feed deserialized
`WorkerOutboundMessage` events into the identical host consumer. The host consumer, not the worker,
owns persistence in both transports.

This implementation does not create a worker-thread adapter. It must remove or correct claims that
the current pool is a Web Worker pool and must not imply that ignored `workerUrl`/`poolSize` options
provide isolation.

**Evidence forcing it.** No Web Platform `Worker`, message event listener, `postMessage`, or thread
bootstrap exists. The pool always constructs one `InProcessJobRunner`; thread lifecycle would add
isolation, cancellation, module bootstrap, pool sizing, and error semantics unrelated to progress
persistence.

### D3 — Progress is per-execution FIFO, lossless at the adapter, and terminally drained

**Decision.** Each execution owns a promise tail. Every call to `reportProgress` is appended in
invocation order. The callback returns that promise, and the pool also drains the tail before
emitting/accepting complete or error, so handlers that omit `await` cannot race terminal state.
Failures from the durable progress sink reject the callback and fail terminal dispatch after the
drain; they are not reduced to logs.

Ordering is defined only within one execution. Concurrent executions may interleave. Equal or
decreasing percentages are preserved in call order; this slice does not invent monotonicity rules or
implicit `100` on success.

**Evidence forcing it.** `KvExecutionState.progress()` performs an asynchronous read/merge/save.
Parallel calls can overwrite a newer snapshot, and terminal completion can otherwise pass pending
writes. The canonical public/domain callback already permits promises; only the runtime duplicate
incorrectly narrows it to `void`.

### D4 — No progress coalescing; replay remains entity-upsert replay

**Decision.** The adapter performs no debounce, sampling, last-value coalescing, or percentage
deduplication. Every accepted callback invokes exactly one `KvExecutionState.progress()` transition;
Slice 1 then persists and offers one full-record execution upsert through the existing producer
policy.

Replay uses existing stream semantics: events are ordered by the durable stream offset and reduce by
execution primary key to the latest full execution snapshot. A resuming reader may observe
intermediate percentages present in the retained log; the supported recovered state is the newest
execution record, including its last progress values and terminal status. There is no new
progress-history endpoint, replay cursor, or seventh record declaration.

**Evidence forcing it.** Slice 1 deliberately publishes every state transition. The durable stream
is already an ordered entity-upsert log with opaque offsets and latest-value materialization. A
second history model would duplicate both the state record and stream protocol.

### D5 — Load config at the workers generator entry edge; pass normalized data inward

**Decision.** `plugins/workers/src/cli/generate-runtime-registries.ts` calls
`loadConfig({ cwd: projectRoot })`, extracts the passthrough `workers` section, validates it exactly
once with core-owned `WorkersConfigSchema`, and passes `WorkersConfigData | undefined` into the pure
`generateRuntimeRegistries` function as a typed option. `plugins/workers/deno.json` declares the
workspace/version-aligned `@netscript/config` dependency.

If none of the supported NetScript config files exists, or a loaded project config has no `workers`
section, generation retains today's discovery/default path. Once a config file exists, loader/import
errors and workers-schema failures stop generation with diagnostics; they are not mistaken for
absence. No policy is encoded into `scaffold.runtime.json`, CLI arguments, appsettings, or another
generated file.

**Evidence forcing it.** The installed host already runs the plugin child under the project's
`deno.json`, cwd, and project root. The root config schema preserves plugin-owned sections, while
the workers schema belongs in core. Loading in the generic CLI host would introduce plugin-specific
coupling; loading inside the pure generator would mix I/O with deterministic generation tests.

### D6 — Match by canonical entrypoint; verify id and source identity

**Decision.** Normalize separators, dot segments, and the configured `workers.jobsDir`, then compare
canonical project-relative paths. Entrypoint is the binding key from policy to a discovered module.
For a matched local module, configured `id` becomes both the handler-registry key and job-definition
key; basename remains only the fallback identity for an unconfigured file. For a plugin module with
an intrinsic exported handler id, configured `id` must match that handler id. Configured source must
also agree with discovery. Discovery supplies/validates entrypoint, source, and plugin identity;
validated config supplies local id and policy.

Generation errors are required for:

- a configured entrypoint with no discovered file;
- one path paired with multiple ids;
- one id paired with multiple paths;
- source mismatch; or
- duplicate configured policies left after precedence resolution.

A discovered job with no config entry retains the existing generic defaults for compatibility.

**Evidence forcing it.** Id alone can bind policy to the wrong file after renames or basename
collisions. Path is the only physical import binding. Local functions have no intrinsic id, so a
validated configured id can safely replace the filename convention; plugin handlers do expose an
identity that must not diverge. Filesystem discovery is required for static imports, while config is
the declared policy source.

### D7 — Grouped jobs are canonical; flat jobs are compatibility input

**Decision.** Normalize `workers.groups[].jobs[]` first. The group topic is authoritative, matching
the existing schema transform. Then add legacy flat `workers.jobs[]` entries. When a flat entry has
the same canonical path and id, the grouped entry wins wholesale, including all policy differences;
the generator emits one definition and an explicit shadowing diagnostic. A partial identity
collision (same id at a different path or same path with a different id) is a generation error.
Flat-only entries remain supported.

**Evidence forcing it.** The issue identifies grouped config as the authored runtime seam, and the
core schema already forces group topic onto nested jobs. Silent concatenation makes precedence
dependent on array order and can apply policy to the wrong handler.

### D8 — Add exactly four `JobConfig` fields using canonical definition constraints

**Decision.** Extend `JobConfig` and `JobConfigZodSchema` with:

| Field            | Type / validation                 | Default |
| ---------------- | --------------------------------- | ------- |
| `priority`       | integer, inclusive `0..100`       | `50`    |
| `retryDelay`     | non-negative integer milliseconds | `1000`  |
| `maxConcurrency` | non-negative integer              | `1`     |
| `persist`        | boolean                           | `true`  |

Keep the existing `timeout` and `maxRetries` defaults unchanged in this slice. `JobConfigInput`
remains the derived authoring form, so these normalized required fields remain optional to authors.

**Evidence forcing it.** All four fields already exist in `JobDefinition`/the registered definition
schema and in the generator's hardcoded literal. Adding any other config contract is outside the
reported lag; changing established timeout/retry defaults would be an unrelated behavior change.

## Generated-definition policy map

For a matched job, the generator emits validated policy for name, description, topic, schedule,
timezone, timeout, maxRetries, retryDelay, maxConcurrency, priority, enabled, persist, tags,
metadata, permissions, and retention. Entrypoint, source, plugin id, plugin handler id, and
execution type remain derived/verified structural data; local id is config-owned for a match.
Optional properties are omitted rather than serialized as `undefined`; emitted literals must satisfy
the canonical `RegisterJobInput` type/schema.

## Slices, ceilings, and gates

### Slice P — outbound progress to durable execution (#1592 Slice 2)

**Landability:** independent of both #1451 slices.

**File ceiling: 10 product/test/doc files.** Expected touch set:

1. `packages/plugin-workers-core/src/runtime/runtime-types.ts`
2. `plugins/workers/worker/job-runner-pool.ts`
3. `plugins/workers/worker/job-execution.ts`
4. `plugins/workers/worker/job-dispatcher.ts`
5. `plugins/workers/worker/worker-options.ts`
6. `plugins/workers/worker/worker.ts`
7. `plugins/workers/worker/job-dispatcher_test.ts`
8. `plugins/workers/worker/job-runner-pool_test.ts` (new if focused coverage cannot fit existing
   tests)
9. `packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts` (only if async context typing
   needs a core regression)
10. one existing workers runtime/reference document for the locked ordering/coalescing/replay
    contract

`messages.ts` should remain unchanged unless PLAN-EVAL identifies a missing type-level capability;
using its existing union is the point. None of the six execution-record declaration sites may be
touched.

**Required tests:**

- the canonical execution id, not a pool-generated id, reaches every progress sink call;
- two rapid progress calls are persisted FIFO and completion occurs only after both resolve;
- an unawaited handler report is drained before terminal completion;
- a progress sink rejection makes dispatch fail and does not silently log;
- concurrent jobs cannot cross-route progress;
- repeated/equal/decreasing values are not coalesced;
- the existing no-progress handler path and successful/failed result paths remain compatible.

**Gates:**

1. focused check via `.llm/tools/run-deno-check.ts` for the touched core/plugin roots with
   `--unstable-kv` where applicable;
2. focused tests via `.llm/tools/run-deno-test.ts` for the runner pool and worker dispatcher;
3. structured lint and TypeScript-only format checks for touched roots;
4. core runtime and plugin workers doc-lint with zero new diagnostics relative to the recorded
   baseline;
5. `deno task arch:check`;
6. package/plugin publish dry-runs for changed publish surfaces;
7. plugin workers runtime tests, including the background stream hook;
8. final merge-readiness `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` after
   all implementation slices are assembled, not during the inner loop;
9. verify `deno.lock` blob is unchanged.

### Slice C — `JobConfig` policy completion (#1451 contract)

**Landability:** independent of Slice P and independently landable before generation.

**File ceiling: 2 files.** Expected touch set:

1. `packages/plugin-workers-core/src/config/job-config.ts`
2. `packages/plugin-workers-core/tests/config/workers-config_test.ts` (new focused schema test)

**Required tests:** defaults for all four fields, explicit values, and rejection of out-of-range,
fractional, negative-concurrency, and negative-delay inputs. Confirm zero concurrency remains valid
per the canonical job-definition schema, group topic normalization remains intact, and the derived
`JobConfigInput` authoring shape remains valid.

**Gates:** focused core config check/test/lint/fmt; `deno doc` for `JobConfig`; config subpath
doc-lint with zero new diagnostics; core publish dry-run; `deno task arch:check`; unchanged lock
blob.

### Slice G — config-aware installed registry generation (#1451 adapter)

**Landability:** ordered after Slice C; independent of Slice P.

**File ceiling: 7 files.** Expected touch set:

1. `plugins/workers/deno.json`
2. `plugins/workers/src/cli/generate-runtime-registries.ts`
3. `plugins/workers/src/cli/runtime-registry-generator.ts`
4. `plugins/workers/tests/cli/runtime-registry-generator_test.ts` (new pure matching/generation
   tests)
5. `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts`
6. one existing workers CLI/reference document describing policy authority and precedence
7. one fixture/helper file only if the installed-generator integration cannot be expressed locally

No generic CLI production file is expected to change. `scaffold.runtime.json` remains discovery
metadata, not policy storage.

**Required tests:**

- entry CLI loads a real temporary `netscript.config.ts`, validates workers policy, and generated
  module literals preserve every supported field;
- grouped same-identity policy wholly shadows flat policy; grouped topic wins;
- conflicting id/path/source and unmatched config entry fail with actionable diagnostics;
- configured Windows separators and normalized relative paths match the same discovered file;
- an unconfigured discovered job retains current generic defaults;
- absent workers section retains current generation behavior;
- malformed workers section stops generation;
- installed registry integration proves the generated `jobDefinitions` consumed by runtime startup
  contains project policy, without network fetch or a second manifest.

**Gates:** focused plugin/CLI check/test/lint/fmt; CLI subpath and plugin doc-lint with zero new
diagnostics; plugin publish dry-run; dependency/lock verification using the native Deno toolchain;
`deno task arch:check`; installed registry integration test; and the one-pass `scaffold.runtime` E2E
gate at merge readiness. `deno.lock` must remain unchanged because `@netscript/config` is already a
workspace dependency.

## Slice order

```text
Slice P ─────────────────────────────── independently landable

Slice C (core schema) ──> Slice G (generator consumes normalized schema)
```

Slice P and Slice C can be developed/reviewed in either order or concurrently. Slice G must consume
the exact normalized output from Slice C and must not duplicate validation. If delivery uses one
umbrella, each slice still receives its own focused commit and gate evidence; the full runtime smoke
runs once after the ordered set is assembled.

## Deferred scope, with safety rationale

- A real Web Worker pool/thread adapter: absent today and requires lifecycle/isolation design beyond
  progress; the locked outbound consumer is transport-neutral so no progress contract rework is
  needed later.
- Retrofitting `registry-compiler.ts`: it is a separate legacy/local backend; installed registry
  acceptance is proved without changing it. Record a follow-up if evaluator evidence shows active
  consumers require parity.
- Progress history/query API, monotonic percentages, implicit completion percentage, throttling, or
  a new execution schema: all contradict or duplicate the shipped Slice 1 model.
- Root `NetScriptConfigSchema` owning workers fields: plugin-owned validation remains in
  `plugin-workers-core` and root passthrough is the intended seam.
- Timeout/maxRetries default harmonization: existing behavior is preserved; only the four proven
  missing fields are added.

## Evaluator checklist

PLAN-EVAL should specifically challenge:

1. whether the host-owned consumer preserves `RuntimeWorkerPort` compatibility without a parallel
   message abstraction;
2. whether progress failure should fail the job after the queue drain;
3. whether replay language matches the durable-stream retention/offset contract;
4. whether canonical path plus config-owned local id and verified plugin id/source handles plugin
   entries and Windows paths;
5. whether wholesale grouped precedence for a same-identity flat entry is sufficiently strict;
6. whether the installed-generator child can resolve `@netscript/config` from all workspace and
   published-package modes;
7. whether the legacy registry compiler needs an explicit follow-up rather than inclusion; and
8. whether every file ceiling and gate is proportionate to the slice.
