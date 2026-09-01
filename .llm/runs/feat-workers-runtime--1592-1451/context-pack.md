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
