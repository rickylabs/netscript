# Worklog — workers runtime plumbing plan

## Progress

### 2026-08-31 — activation and rebaseline

- Activated `netscript-harness`, `netscript-doctrine`, `netscript-cli`, and `netscript-tools` as
  requested; used `jsr-audit` only for the harness-mandated public-surface scan.
- Read the Plan Gate protocol, Archetype 3 profile, gate matrix, templates, doctrine, and focused
  package/plugin docs.
- Began from a clean tree at fetched `origin/main`. When `main` advanced during planning, refreshed
  it and rebased the single plan commit directly onto `9fbc2317291dbd33c325782bb33d86a99ee5a027`.
- `rtk` was not installed in this environment, so focused raw read-only commands were used.

### 2026-08-31 — research

- Independently verified that `WorkerOutboundMessage`/`JobProgressMessage` has no runtime consumer.
- Traced the in-process path from durable execution creation through `WorkerPool` and handler
  context; identified the pool-generated UUID and logging-only callback as the broken seam.
- Verified there is no worker-thread implementation; `poolSize` and `workerUrl` are unused.
- Confirmed Slice 1 already supplies durable progress transition/save/publish behavior and the six
  record declarations are a no-touch constraint.
- Traced installed registry generation from the generic CLI host to the workers child generator.
- Confirmed the root config loader preserves plugin sections and the core workers schema is the
  correct validation owner.
- Compared `JobConfig`, runtime `JobDefinition`, and generated `RegisterJobInput`; isolated exactly
  four missing policy fields.
- Examined groups/flat config normalization, discovery identity, installed registry consumers, the
  alternate local compiler, current tests, and JSR doc-lint baselines.

### 2026-08-31 — planning

- Kept one clustered plan because both gaps are runtime-boundary plumbing, but split implementation
  into one independent progress slice, one independent schema slice, and one ordered generator
  slice.
- Locked channel ownership, transport behavior, FIFO/drain semantics, no-coalescing replay
  semantics, config-loading seam, path/id/source matching, group precedence, schema fields/defaults,
  file ceilings, and gates.
- Recorded `PLAN-EVAL: REQUIRED`; no evaluator was dispatched because the owner reserved that step.

## Design

### Public surface

- Reuse `WorkerOutboundMessage` and `JobProgressMessage`; do not add a second protocol.
- Align runtime `JobContext.reportProgress` with the existing public/domain async-capable callback.
- Add only `priority`, `retryDelay`, `maxConcurrency`, and `persist` to `JobConfig`.
- Keep `generateRuntimeRegistries` pure by accepting already-loaded, already-validated workers data.

### Domain vocabulary

- **Canonical execution id:** the id returned by `KvExecutionState.create`, owned by the outer
  dispatcher for the complete state lifecycle.
- **Outbound channel:** per-execution typed message flow from handler/runner to the host pool.
- **Progress transition:** one durable state transition per accepted handler callback.
- **Discovered job:** a statically importable physical module.
- **Configured job policy:** validated operational metadata bound to a discovered job by canonical
  entrypoint and verified identity.

### Ports and ownership

- Core owns message types, job context contract, workers config schema, and state behavior.
- Plugin `WorkerPool` owns transport adaptation and message consumption.
- Plugin outer dispatcher supplies the canonical execution id and narrow durable-progress sink.
- Workers generator entry script owns config loading; core schema owns validation; pure generator
  owns matching and deterministic literal emission.

### Constants and policies

- Per-execution FIFO, no global ordering.
- No adapter-level coalescing or deduplication.
- Terminal state waits for the progress queue; persistence failures surface as dispatch failures.
- Replay is existing ordered entity-upsert replay reduced to the latest execution snapshot.
- Grouped same-identity entries wholly supersede flat compatibility entries; partial identity
  conflicts fail.
- Missing config defaults: priority `50`, retry delay `1000ms`, concurrency `1`, persist `true`.

### Commit slices

1. Slice P — progress channel to durable state, ceiling 10 files.
2. Slice C — core config schema, ceiling 2 files.
3. Slice G — config-aware installed generator, ceiling 7 files, depends on Slice C.

### Deferred

- actual Web Worker lifecycle/pool implementation;
- legacy local `registry-compiler.ts` parity pending evaluator/follow-up determination;
- progress history, monotonicity, implicit completion, throttling, or new record shapes;
- timeout/retry default harmonization.

### Contributors

- Plan author: current Codex session.
- Formal evaluator: required separate Anthropic/Fable 5 medium session, not yet dispatched.
- No subagents or implementation agents participated.

## Gate evidence

| Gate                                                                    | Result                                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Branch equals fetched `origin/main` before artifacts                    | PASS                                                                         |
| Starting worktree clean                                                 | PASS                                                                         |
| Focused source/protocol/config research                                 | PASS                                                                         |
| `deno doc` for `JobConfig`, `WorkerOutboundMessage`, `RegisterJobInput` | PASS                                                                         |
| Core doc-lint baseline                                                  | 9 carried-in private-type diagnostics; touched config/runtime subpaths clean |
| Plugin doc-lint baseline                                                | 20 carried-in private-type diagnostics, tracked separately                   |
| Product checks/tests/E2E                                                | NOT RUN — plan-only scope                                                    |
| PLAN-EVAL                                                               | REQUIRED — NOT DISPATCHED                                                    |
| Product files under `packages/` or `plugins/`                           | Must remain unchanged                                                        |
| `deno.lock`                                                             | Must retain baseline blob                                                    |

## Handoff

The next authorized action is supervisor-run PLAN-EVAL against `research.md` and `plan.md`. An
implementation session must not begin until the evaluator accepts or the plan is revised and
re-evaluated.

### 2026-09-01 — Slice C implementation

- Resumed from the separate-session PLAN-EVAL `PASS` in `plan-eval.md` on branch
  `feat/workers-job-config-schema` at `main` `78be0e032624f12bcb30535d40e3a948b08b9784`.
- Added exactly the four approved `JobConfig` policy fields and matched the existing generated
  `RegisterJobInput` literal plus canonical job-definition constraints: priority `50` (`0..100`
  integer), retry delay `1000ms` (nonnegative integer), max concurrency `1` (nonnegative integer),
  and persistence `true`.
- Added the focused config-schema test file. Its five tests cover defaults, explicit values, zero
  concurrency, both priority bounds, fractional numeric policy values, negative delay and
  concurrency, group-topic normalization, and the defaults-optional `JobConfigInput` authoring
  shape.
- Product ceiling held at exactly two files. The generator remained untouched; Slice G remains the
  config-aware generation half, so merging leaves #1451 open.
- No runtime, Aspire, Docker, browser, or E2E gate ran; this lane held no runtime lease.

## Slice C gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused check | PASS | Direct structured wrapper selected 2 files in 1 batch; 0 diagnostics; non-empty output (146 characters), report 390 bytes. |
| Focused test | PASS | Direct structured wrapper: 5 passed, 0 failed; non-empty output (338 characters). |
| Focused lint | PASS | Direct structured wrapper selected 2 files in 1 batch; 0 findings; non-empty output (145 characters), report 471 bytes. |
| Focused format | PASS | Direct structured wrapper selected 2 files in 1 batch; 0 findings; non-empty output (150 characters), report 388 bytes. |
| `deno doc` for `JobConfig` | PASS | Rendered all four new fields with their public documentation. |
| Config-subpath doc lint | PASS | `deno doc --lint packages/plugin-workers-core/src/config/mod.ts`: 1 file checked, exit 0. |
| Full core doc-lint delta | BASELINE-STABLE | Required `--root packages/plugin-workers-core`; 9 carried private-type diagnostics before and after, with 0 on `./src/config/mod.ts`. |
| JSR surface audit | PASS with carried warnings | Exit 0; existing cardinality and slow-type warnings only, no finding in the two touched files. |
| Core publish dry-run | PASS | Receipt outcome PASS, exit 0; authoritative `stderr.bytes=15945` (stdout is expectedly empty for this gate). |
| `deno task quality:scan` | PASS | Exit 0; required Tier-A follow-through completed with no new scanner findings. |
| `deno task arch:check` | PASS | Exit 0; `plugin-workers-core` remains `FAIL=0` with carried warnings. |
| Lock blob | PASS | `deno.lock` and `main:deno.lock` both SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`. |

### Slice C reconcile

- Scope remains exactly the approved contract half; Slice G still owns generator consumption.
- No plan, doctrine, or implementation drift was found, and no architecture debt was created or
  deepened.
- The owner prohibited evaluator dispatch and labels for this handoff. No evaluator was launched,
  cancelled, or otherwise mutated; this implementation session does not claim formal IMPL-EVAL.
