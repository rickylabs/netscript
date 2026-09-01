# Context pack — Slice C `JobConfig` policy completion

## Current state

- Branch: `feat/workers-job-config-schema`
- Base: `main` `78be0e032624f12bcb30535d40e3a948b08b9784`
- PLAN-EVAL: separate-session `PASS` in `plan-eval.md`
- Phase: Slice C implementation and required gates complete; draft PR handoff follows this commit
- Issue relation: contract half only; merging leaves #1451 open for Slice G

## Landed scope

Only the two approved product files changed:

1. `packages/plugin-workers-core/src/config/job-config.ts`
2. `packages/plugin-workers-core/tests/config/workers-config_test.ts`

`JobConfig` now models `priority`, `retryDelay`, `maxConcurrency`, and `persist` with the exact
constraints/defaults already used by the canonical job-definition schema and generated
`RegisterJobInput` literal. The generator is intentionally unchanged.

## Evidence summary

- Focused structured check/lint/fmt: 2 files selected, 0 findings/diagnostics; every wrapper emitted
  non-empty output.
- Focused structured test: 5 passed, 0 failed, with non-empty output.
- `deno doc` renders the four fields; config-subpath doc lint exits 0.
- Full package doc lint remains at the carried 9 diagnostics, with the config entrypoint at 0 before
  and after.
- Core publish dry-run passes; its receipt records 15,945 stderr bytes, the correct verdict stream.
- JSR audit, `quality:scan`, and `arch:check` pass with carried warnings only.
- `deno.lock` remains byte-identical to `main` (`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`).
- No runtime/Aspire/Docker/browser/E2E gate ran.

## Handoff constraints

- One commit for Slice C, including the inherited plan/PLAN-EVAL artifacts and this updated run
  context.
- Push by explicit refspec and open a draft PR with `Refs #1451`; do not apply labels or add an
  issue-closing keyword.
- Do not dispatch or cancel an evaluator and do not merge.
- Slice G follows this contract and owns config-aware registry generation.

# Context pack — Slice P outbound progress transport

## Current state

- Branch: `feat/workers-progress-transport`
- Worktree: `/home/agent/projects/netscript/worktrees/007-leaf-workers-p`
- Baseline: `main` `78be0e032624f12bcb30535d40e3a948b08b9784`
- Issue scope: #1592 Slice 2; merging leaves #1592 open
- PLAN-EVAL: `PASS` in `plan-eval.md`
- Product/test/doc footprint: 8 files (ceiling 10)

## Implemented contract

`WorkerPool` owns one outbound consumer and promise tail per `executeJob` call. The outer worker
dispatcher passes the id returned by execution-state creation through `executeWorkerJob` into the
pool. Handler progress becomes the existing cloneable `JobProgressMessage` shape and is consumed
FIFO by a sink that calls `WorkerExecutionState.progress(id, percent, message)`.

Terminal complete/error messages drain the progress tail. Equal, repeated, and decreasing values
are preserved; there is no debounce or coalescing. Sink rejection remains observable and produces a
failed durable terminal state. Concurrent executions close over separate ids and sinks.

The shipping runner remains in-process. `poolSize` and `workerUrl` are retained only as deprecated,
ignored compatibility properties, and the startup log no longer claims Web Worker isolation.

## Invariants preserved

- `packages/plugin-workers-core/src/runtime/messages.ts` is byte-unchanged.
- No execution-record declaration changed and no seventh declaration was added.
- Slice C/G surfaces, SDK, and `registry-compiler.ts` are untouched.
- `deno.lock` matches HEAD blob `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Durable replay remains ordered full-record entity upserts reduced to the newest execution record.

## Validation

Durable receipts live in `receipts/slice-p/`. PASS receipts cover scoped check, 9 focused tests,
23 workers runtime tests including the background stream hook, scoped lint/fmt, `quality:scan`,
`arch:check`, and both publish dry-runs. Check/test/lint/fmt stdout is non-empty. Publish dry-runs
write their proof to stderr and both pass.

Doc lint was freshly measured on detached `main` and on the implementation: core 9→9 and plugin
20→20, all `private-type-ref`, with zero missing-JSDoc/other diagnostics. The raw receipts therefore
show expected exit 1 while the slice-relative verdict is zero new diagnostics.

No local runtime, Aspire, Docker, browser, or scaffold E2E gate ran because this lane has no runtime
lease and the owner explicitly prohibited them.

## Next action

Open the draft PR after the single explicit-refspec push, using `Refs #1592` and stating that merging
leaves #1592 open. Do not apply labels, add acceptance boxes, dispatch an evaluator, mark ready,
merge, or cancel any evaluator. The supervisor owns Tier-A review and the evaluator lifecycle.
