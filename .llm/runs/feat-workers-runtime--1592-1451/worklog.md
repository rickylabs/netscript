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
