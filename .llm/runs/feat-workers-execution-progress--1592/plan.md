# Plan — #1592 Slice 1: persist and publish worker execution progress

**PLAN-EVAL: N/A.** The persist/publish mechanics reuse an already-established pattern
(`queue`/`start`/`complete` on `KvExecutionState`, and the generic mutation-hook-to-stream-upsert
pipeline every one of them already exercises) with no new design decision. This is a **partial**
slice of #1592 by design — see `research.md`'s "What Slice 1 does NOT include" — the runtime wiring
from `ctx.reportProgress()` to this new method was searched for and not found, and is out of scope
here. State this honestly in the PR: `Refs #1592 — partial`, not `Fixes`.

## Locked decisions

- **LD-1.** Add `progressPercent: number | null` and `progressMessage: string | null` to
  `ExecutionRecordShape`/`ExecutionRecordSchema`/`ExecutionRecord` (`domain/job-definition.ts`),
  **nullable, not optional** — matching the existing convention for `startedAt`/`error`/`result`/etc.
- **LD-2.** Add `KvExecutionState.progress(executionId, percent, message?)`, calling
  `#transition(executionId, { progressPercent: percent, progressMessage: message ?? null })` — the
  identical shape as `queue`/`start`. No new persistence or publish logic; reuse `#transition`/`#save`
  exactly as they exist.
- **LD-3.** Thread the two new fields through `streams/schema.ts`'s `WorkerExecution` type + Zod
  schema and `streams/producer.ts`'s `WorkerExecutionRecord` type + `toExecutionStreamEntity()`'s
  mapping — following the exact pattern every existing field in those two files already uses.
- **LD-4.** Do not touch the runtime message-passing layer (`runtime/messages.ts`,
  `job-dispatcher.ts`, `in-process-job-runner.ts`) or the `reportProgress` port declarations. If, while
  implementing, you find a genuinely simple, already-existing path from `ctx.reportProgress()` to
  `ExecutionState` (e.g., jobs run fully in-process and a context-construction site already has a
  live `KvExecutionState` reference), you may wire it — but only if it requires **no new message-
  passing infrastructure and no design decision** (a one-line call, not a new subsystem). If it's not
  that simple, stop at LD-1–LD-3 and record what you found in `drift.md` rather than guess at scope.

## Ceiling

- `packages/plugin-workers-core/src/domain/job-definition.ts`
- `packages/plugin-workers-core/src/state/execution-state.ts`
- `packages/plugin-workers-core/src/streams/schema.ts`
- `packages/plugin-workers-core/src/streams/producer.ts`
- A new test file for `execution-state.ts` (none currently exists — see below) plus any existing
  `streams/`/`domain/` test file that already exercises `ExecutionRecordSchema`/`WorkerExecution`
  (extend rather than duplicate if one exists; check before assuming).

No other file. In particular, no touch to `runtime/messages.ts`, `job-dispatcher.ts`,
`in-process-job-runner.ts`, `job-context.ts`, `runtime-types.ts`, or `public/root.ts` unless LD-4's
narrow exception genuinely applies.

## Required test coverage

**No existing test file covers `KvExecutionState` at all** (confirmed by search before dispatch) —
create one, following this package's own established testing-fixture conventions
(`src/testing/mod.ts`, `src/testing/job-fixtures.ts`, `src/testing/memory-job-storage.ts` — read
these first rather than inventing a new fixture pattern). At minimum:

- `progress()` persists `progressPercent`/`progressMessage` and they are readable via `get()`.
- `progress()` invokes the mutation hook (set via `setMutationHook()`) with `type: 'updated'` and an
  execution record carrying the new fields — proving the **existing publish pipeline** is what
  carries this to the stream, not new code. This is the one behavior this slice is actually about;
  do not settle for a persistence-only test.
- `WorkerExecution`/`WorkerExecutionRecord`/`toExecutionStreamEntity()` round-trip the new fields
  correctly (an execution record with progress values maps to a stream entity with the same values).

## Tier-A stop

Scoped `check`/`lint`/`fmt` (`packages/plugin-workers-core`); the `packages/plugin-workers-core` test
suite; `docs:exports-drift` (no new public export is added if `progress()` and the two fields are
already-exported-type members — confirm this is actually true before assuming, since `KvExecutionState`
itself is presumably already exported); `deno.lock` hash check.

**Known tooling gap (D-1, filed against `#1591`'s leaf):** `run-gate.ts`'s `check`/`lint`/`fmt-check`
catalog gates can return a non-probative `(cached, inputs unchanged)` zero-byte-stdout result. Check
`stdout.bytes` before trusting any such receipt; re-run via direct `deno run` of the wrapper script
if it shows the cache marker.

## Process

New leaf, no existing PR. Open a draft PR against `main` per `netscript-pr` once Tier-A-ready.
**`Refs #1592` — partial, no closing keyword** — this slice does not complete the issue's full
acceptance (the runtime-wiring half is unaddressed). State plainly in the PR body what remains:
wiring `ctx.reportProgress()` to the new `ExecutionState.progress()` method, and confirming/
documenting ordering-coalescing-replay behavior once that wiring exists. Apply `type:feat`,
`area:workers`, `area:streams`, `priority:p1`, exactly one `status:`, and the `0.0.7` milestone.
Do not flip to ready. Do not close the issue.

## Acceptance (Slice 1 only)

- [ ] `progressPercent`/`progressMessage` added to the execution record schema, nullable.
- [ ] `KvExecutionState.progress()` added, matching the `queue`/`start` pattern exactly.
- [ ] The mutation-hook test proves the existing publish pipeline carries progress to the stream.
- [ ] `WorkerExecution`/`WorkerExecutionRecord`/`toExecutionStreamEntity()` thread the fields through.
- [ ] Ceiling respected; `deno.lock` byte-identical.
- [ ] PR body states plainly what Slice 1 does not complete.
