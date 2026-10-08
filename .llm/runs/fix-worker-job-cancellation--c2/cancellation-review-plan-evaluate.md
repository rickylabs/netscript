# PLAN-EVAL — review amendment plan (issue #2066 / PR #2088)

- **Plan evaluator session:** Independent Google evaluator (Gemini), authorized fallback under owner `HARNESS.md` after GLM review requests stalled without verdict; fresh session, different vendor family from OpenAI generator (`gpt-6.1-sol high`).
- **Run ID:** `fix-worker-job-cancellation--c2`
- **Issue / PR / Branch:** Issue #2066 / PR #2088 / branch `fix/worker-job-cancellation`
- **Current desktop checkout (fixed, unedited):** `510856423f270333499f7e8e3639a117c6d7a6ff`
- **Immutable worker source evaluated:** `0023b8f193f2cdc8cc3e8f8f06ebeeb700228584` ("docs(harness): record final worker CI correction review PASS")
- **Surface / Archetype:** Archetype 3 (Runtime/Behavior) + Archetype 5 (Plugin Package) (`@netscript/plugin-workers-core` and `plugins/workers`)
- **Scope overlays:** Job cancellation and execution lifecycle review amendment; PR #2088 review findings (D1–D5).
- **Prior verdicts preserved at immutable head:**
  - Original PLAN-EVAL PASS: `6d6bca2cdb4361c17779e079ce6e7331510c8233`
  - Queue-seam amendment PLAN-EVAL PASS: `b1078f01abbeed14cecb3e27be6f9945bfcaf2b0`
  - Original runtime IMPL-EVAL PASS: `da438b2f90abf95d7d9cbe39a3bc57c2bb7989b2` (evaluated head `cb66a3f13642e5581aef13d82f203533e814b439`)
  - Delta CI IMPL-EVAL PASS: `20484c8e7c2d48fa48ec5e6800d7ce855f9f35c5` (evaluated head `dd6cea4bf99db07f6d7012f8f45ae0e7f96614d6`)

---

## Checklist results (Plan-Gate)

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| **Research present and current** | **PASS** | `review-amendment-plan.md` lines 11–20. Re-baselined against immutable worker source `0023b8f193f2cdc8cc3e8f8f06ebeeb700228584` on branch `fix/worker-job-cancellation`. Retains existing mandatory signal/optional deadline contracts, original cancellation/source evaluations (`evaluate.md` and `review-evaluate.md`), and bounded CI carrier reviews. Incorporates all five unresolved PR #2088 review threads from sibling `review-audit.json`. Desktop checkout remains fixed at `510856423f270333499f7e8e3639a117c6d7a6ff` without modification. |
| **Decisions locked** | **PASS** | `review-amendment-plan.md` lines 21–55. Architecture decisions D1–D5 fully locked with concrete technical mechanics: D1 guards async schema validation in `createJobHandlerDefinition` before and after validation; D2 binds parent cancellation synchronously at runner dispatch; D3 rechecks effective deadline at terminal continuations to prevent synchronous overruns returning success; D4 wraps handler progress reporting within the runner's owned race and bounds terminal progress drain by runner grace; D5 pre-assigns the shared completion promise via `Promise.withResolvers` before synchronous drain/abort emission to eliminate reentrant stop duplication. |
| **Open-decision sweep** | **PASS** | `review-amendment-plan.md` lines 80–81. Open decisions explicitly listed as none. Evaluator sweep confirmed no unflagged architectural choices or deferred decisions that could force rework. |
| **Commit slices (< 30, gate + files each)** | **PASS** | `review-amendment-plan.md` lines 64–73. Exactly 3 ordered commit slices (S7, S8, S9), bounded far below the 30-file limit: S7 covers runtime, definition, and worker stop fixes plus adjacent tests (at most 3 production files and 3 test files), scoped frozen checks, unit tests, lint, format, and `quality:scan` + `arch:check`; S8 covers full owning core + worker test suites, type consumers, JSR audit, dry publication, and doc baseline verification; S9 covers mandatory independent amendment IMPL-EVAL and thread closure. Proving gates and target files are explicitly specified. |
| **Risk register** | **PASS** | `review-amendment-plan.md` lines 74–80. Enumerates nine concrete failure modes with corresponding mitigations: pre-aborted first cause loss (immediate synchronous link), validator completion post-abort (signal check before/after validation), synchronous deadline overrun (terminal clock reconciliation), ignored progress promises (runner-owned race tracking), unhandled progress rejections (immediate observation), blocked progress sink (runner grace bound), late progress post-completion (admission check rejection), reentrant stop duplicate cleanup (`Promise.withResolvers` pre-assignment), and invalid queue claim application (Worker failure/release receipts). |
| **Gate set selected** | **PASS** | `review-amendment-plan.md` lines 56–67. Required Archetype 3 and Archetype 5 gates selected: scoped frozen check (`run-deno-check.ts`), scoped frozen test (`run-deno-test.ts`), scoped lint (`run-deno-lint.ts`), scoped fmt (`run-deno-fmt.ts`), code-quality gate (`quality:gate` = `quality:scan` + `arch:check`), full owning core and worker suites without deletion or skipping, per-cause causal mutation verification, JSR publish dry-run (`deno publish --dry-run --allow-dirty`), and all-entrypoint doc-lint baseline comparison. |
| **Deferred scope explicit** | **PASS** | `review-amendment-plan.md` lines 70–73, 80–83. Explicitly defers release-class runtime gates (N/A), dependency/lock churn (`deno.lock` unchanged), CLI/scaffold/plugin release output changes, canonical export surface corpus regeneration (unless exact-source freshness requires it), and public redesign or native worker/process rewrites. Coordinated publication and consumer release remain owner work; PR remains unmerged (`Refs #2066`). EIS `createJobAbortScope` removal is deferred until after qualification. Existing debt rows in `.llm/harness/debt/arch-debt.md` remain open with prior evaluator acceptance, targeted before the next stable workers release, no later than 2026-10-15. |
| **jsr-audit (pkg/plugin)** | **PASS** | `review-amendment-plan.md` lines 66–71. JSR publishability rubric applied to planned changes. Public exports, signatures, and contracts remain unchanged; no slow types or new public APIs are introduced. Canonical export surface corpus and JSR publish dry-run gates are mandated in S8. Doc-lint diagnostics are held strictly to the accepted baseline without regression. |

---

## Load-bearing source verification

The five review findings recorded in sibling `review-audit.json` (PR #2088) were independently verified against the immutable worker commit `0023b8f193f2cdc8cc3e8f8f06ebeeb700228584`:

1. **D1 — Async schema validation bypasses abort recheck (finding `PRRC_kwDOSxcnO877JB03`):**
   - *Source location:* `packages/plugin-workers-core/src/domain/job-handler.ts:77–83` and `packages/plugin-workers-core/src/runtime/job-dispatcher.ts:83`.
   - *Verification:* `createJobHandlerDefinition` wraps `handler({ ...context, payload })` after `await validateJobPayload(...)` without checking `context.signal.aborted`. In `InProcessJobDispatcher.dispatch`, when `resolution.handler` is a `JobHandlerDefinition` matching `job.payloadSchema`, the dispatcher dispatches directly to `resolution.handler(context)` at line 91, bypassing the dispatcher's own post-validation `context.signal.throwIfAborted()` guard at line 88. An abort occurring during asynchronous validation allows callback execution to commence.
   - *Amendment assessment:* D1 resolves this by adding explicit `context.signal.throwIfAborted()` guards before validation and immediately after awaited validation in `createJobHandlerDefinition`, ensuring that cancellation during validation prevents callback side effects across all definition-wrapped executions.

2. **D2 — Deferred parent linkage loses pre-aborted cause on stop (finding `PRRC_kwDOSxcnO877JB0-`):**
   - *Source location:* `packages/plugin-workers-core/src/runtime/in-process-job-runner.ts:70–72, 100–105`.
   - *Verification:* `InProcessJobRunner.dispatch` defers `execute` to a microtask via `Promise.resolve().then(...)`. If `input.signal` is already aborted (for example, with `TimeoutError`), and `stop()` is invoked synchronously before the microtask executes, `stop()` iterates active executions and aborts `execution.controller` with `ShutdownError`. When `execute()` runs, `controller.abort()` with the parent's `TimeoutError` is a no-op because `AbortController` ignores subsequent aborts. The earlier typed cause is permanently lost.
   - *Amendment assessment:* D2 binds and adopts parent cancellation synchronously during `dispatch` before deferring `execute()`, preserving the first abort cause under DOMException semantics.

3. **D3 — Synchronous handler overrun returns false success (finding `PRRC_kwDOSxcnO877L_ba`):**
   - *Source location:* `packages/plugin-workers-core/src/runtime/in-process-job-runner.ts:138–146, 150`.
   - *Verification:* When a handler executes synchronously past `deadlineAt`, the returned Promise resolves immediately. Promise settlement microtasks execute before macrotask clock timers fire. In the success continuation, `signal.aborted` remains false, so `signal.throwIfAborted()` does not throw, returning success. The `finally` block runs and calls `disposeDeadline?.()`, permanently clearing the overdue timer and falsely recording a successful execution.
   - *Amendment assessment:* D3 requires the runner's owned clock to recheck the effective deadline at both terminal success and error continuations, aborting with `TimeoutError` prior to completion settlement.

4. **D4 — Progress drain escapes runner race and grace bounds (finding `PRRC_kwDOSxcnO877JB05`):**
   - *Source location:* `plugins/workers/worker/job-runner-pool.ts:79–83, 107, 124–133`.
   - *Verification:* In `WorkerPool.executeJob`, `this.#runner.dispatch` completes when the handler returns, at which point the runner removes parent signal listeners. The pool then independently awaits `consumeOutbound({ type: 'complete', ... })`, which awaits `progressTail`. Cancellation during this window is ignored, allowing the job to be marked `completed` and idempotency claims applied. Furthermore, if `progressSink` hangs, `Worker.stop()` does not bound the wait within runner grace because the runner execution has already settled.
   - *Amendment assessment:* D4 incorporates progress tracking directly into the runner's owned lifecycle race, awaiting the progress tail before handler settlement and enforcing runner grace bounds on stuck progress sinks.

5. **D5 — Reentrant `Worker.stop` from abort listener duplicates drain (finding `PRRC_kwDOSxcnO877L_be`):**
   - *Source location:* `plugins/workers/worker/worker.ts:210–225`.
   - *Verification:* In `Worker.stop()`, `this.stopCompletion = this.drain()` initiates `this.drain()`. Synchronous code in `drain()` executes up to the first await: `this.abortController?.abort(shutdownReason)` and `execution.abortController.abort(shutdownReason)` are called synchronously before `this.drain()` returns to assign `this.stopCompletion`. Any handler or listener with a synchronous abort listener that calls `worker.stop()` sees `this.stopCompletion === null` and triggers a second concurrent `drain()`, duplicating teardown and corrupting the completion guard.
   - *Amendment assessment:* D5 creates the shared completion promise via `Promise.withResolvers` and assigns `this.stopCompletion` prior to initiating drain or emitting abort signals, ensuring reentrant callers share the existing promise.

---

## Open-decision sweep (evaluator-run)

Evaluator inspection confirms:
1. No unresolved architectural choices exist in the amendment plan.
2. The five decisions (D1–D5) are self-contained corrections within existing package and plugin boundaries.
3. No public API breaking changes or new configuration layers are required.
4. No decisions are deferred that would force rework during or after implementation.

---

## Risk register & architecture debt evaluation

### Risk mitigations
The plan provides concrete, verifiable mitigations for all nine identified operational risks. In particular, verifying causal mutations for each scenario ensures that regressions cannot pass undetected.

### Architecture debt (`.llm/harness/debt/arch-debt.md`)
The three debt rows in immutable source `0023b8f193f2cdc8cc3e8f8f06ebeeb700228584` remain open with prior evaluator acceptance (in `evaluate.md` and `review-evaluate.md`) rather than textually status `DEBT_ACCEPTED`. All three target resolution before the next stable workers release, no later than 2026-10-15, and are unaffected by this amendment:
1. `workers-doc-baseline-2066`:
   - *Reason:* Main baseline retains public private-type references across plugin-workers-core and workers exports; cancellation source removes newly introduced diagnostics while matching baseline counts (core combined 9, plugin combined 22).
   - *Owner:* Workers package public-surface maintainers.
   - *Target:* Before the next stable workers release, no later than 2026-10-15.
   - *Gate:* F-7: all worker export doc-lint diagnostics zero.
   - *Status:* Open with prior evaluator acceptance (textually: `open; independent evaluator must adjudicate DEBT_ACCEPTED for this unchanged source baseline.`).
2. `workers-doctor-module-baseline-2066`:
   - *Reason:* Existing public `doctor.ts` export lacks `@module` JSDoc; JSR audit FAIL F-JSR-2 is identical on current main archive and this branch.
   - *Owner:* Workers plugin public-surface maintainers.
   - *Target:* Before the next stable workers release, no later than 2026-10-15.
   - *Gate:* F-JSR-2 module tag present and plugin JSR audit passes.
   - *Status:* Open with prior evaluator acceptance (textually: `open; independent evaluator must adjudicate unchanged baseline debt.`).
3. `workers-core-layout-2066`:
   - *Reason:* Pre-existing `src/` cardinality exceeds doctrine cap (19 immediate children vs main's 18) because approved native clock adapter belongs in `adapters/`.
   - *Owner:* Workers core maintainers.
   - *Target:* Existing source layout consolidation before the next stable workers release, no later than 2026-10-15.
   - *Gate:* F-16 source cardinality at or below 12, preserving domain/port/adapter ownership.
   - *Status:* Open with prior evaluator acceptance (textually: `open; evaluator adjudication required.`).

No new architecture debt is introduced by the amendment plan.

---

## Verdict

`PASS`

The review amendment plan satisfies all eight Plan-Gate checklist requirements. Architecture decisions D1–D5 rigorously and accurately resolve the five verified review findings from PR #2088 without introducing scope drift or public contract instability. Implementation of Slice S7 may proceed.

### Standing conditions
- Slices S7–S9 must be executed sequentially with verified causal mutation proofs for each case.
- Mandatory independent IMPL-EVAL is required following implementation.
- Branch remains unmerged (`Refs #2066`) pending owner release coordination.
