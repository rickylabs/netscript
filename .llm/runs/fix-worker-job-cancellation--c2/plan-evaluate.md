# PLAN-EVAL — fix-worker-job-cancellation--c2

- Plan evaluator session: independent evaluator, 2026-10-08, route `opencode-go/glm-5.3-flash` variant `max` (owner-selected OpenCode Go route per supervisor.md; no fallback needed — launch succeeded).
- Run: `fix-worker-job-cancellation--c2`
- Exact current head: `6d6bca2cdb4361c17779e079ce6e7331510c8233` (branch `fix/worker-job-cancellation`; only run artifacts on top of main baseline `872df8e21e0a8bf06cd0796c7808068dd67e2c4e` — no source/config/lock changes, implementation not begun).
- Surface / archetype: Archetype 3 Runtime/Behavior (`@netscript/plugin-workers-core` package + `plugins/workers` plugin).
- Scope overlays: issue #2066 (JobContext signal/deadline); lane C2; public-contract handler-context change.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `872df8e21`. All three load-bearing findings spot-checked against the tree and TRUE: (1) `executeWorkerJob` Deno branch drops the signal — plugins/workers/worker/job-execution.ts:22-31 (signal consumed only by `executePolyglotTask`), and `WorkerPool.executeJob` (job-runner-pool.ts:41-46) plus package `RuntimeWorkerPort` (runtime/runtime-types.ts:240-247) have no signal/deadline parameter; (2) `InProcessJobRunner.stop` only flips `#stopped` — packages/plugin-workers-core/src/runtime/in-process-job-runner.ts:37-40; (3) `Worker.stop` delays per-job abort until drain timeout — plugins/workers/worker/worker.ts:286-304 (`waitForActiveJobs` polls up to 30 s and aborts `ctx.abortController` only after the timeout). Issue #2066 verified live: required `signal`, optional `deadlineAt` (epoch ms), distinguishable abort reason, documented grace, consumer deletion condition — all mapped by the design. |
| Decisions locked                        | PASS   | plan.md "Locked decision" + "Locked design — issue 2066": required handler signal across all three owned context surfaces (domain job-context.ts:2-10, runtime runtime-types.ts:23-31, public root mirror root.ts:133-141); compatible `JobDispatchContext` on `RuntimeWorkerPort` instead of breaking the port shape; isolated runner-owned controller with parent-signal linking and first-cause-wins; no invented remote cancel protocol; injected `JobRunnerClock`; bounded grace with documented non-cooperation limit. Rationale stated for each contested point. |
| Open-decision sweep                     | PASS   | Plan declares none open and gives an escape valve ("record and obtain PLAN-EVAL before implementing any changed material design"). Evaluator-run sweep (below) found no deferred decision that would force rework. |
| Commit slices (< 30, gate + files each) | PASS   | S1 bootstrap/design (done), S2 implementation + regression/mutation gates, S3 evaluation evidence. Ordered, sized well under 30 files. Touched surfaces are enumerated by the design (domain job-context, runtime runtime-types/in-process-job-runner/composition-root, public root mirror; plugin job-execution/job-dispatcher/job-runner-pool/worker/worker-options + adjacent fixtures). Gates named per slice (scoped check/test/lint/fmt, mutation proof, consumer evidence, quality:scan + arch:check + JSR audit). |
| Risk register                           | PASS   | Published-consumer acceptance deferred behind a coordinated release receipt ("do not claim shipment"); non-cooperating in-process handler / CPU-blocking limitation documented; grace bounds runtime wait, not physical JS termination. |
| Gate set selected                       | PASS   | Scoped structured check/test/lint/fmt; mutation proof per new regression; cold consumer evidence where dependency resolution changes; quality:scan + arch:check + JSR public/publish audit for changed packages. Arch 3 runtime gates satisfied by design: lifecycle start/stop, cancellation propagation, and failure path are exactly the planned tests (deadline, timeout, shutdown, explicit cancel, bounded non-cooperation, full Deno-path terminal statuses); Aspire health n/a (no distributed topology or service wiring change — in-process runner only). Consumer import validation required for Arch 3 — planned. |
| Deferred scope explicit                 | PASS   | Owner release acceptance/publication deferred; no release cut or merge. Task-path (`processWorkerTask`) signal wiring is implicitly out of issue scope — see note N5. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Planned public surface named before slicing: required `signal` + optional `deadlineAt` on domain/runtime/root handler contexts, optional `JobDispatchContext` param on `RuntimeWorkerPort`, pool grace option, plugin `Worker.cancel(executionId)`. Slow-type risk low: AbortSignal/DOMException are Web Platform types; epoch-ms is `number`; additions are consumer-additive (handlers only receive extra fields). JSR publish/doc audits already in the gate set. |

## Open-decision sweep (evaluator-run)

No decision found that would force rework if deferred. Reviewed candidates:

1. **Terminal-cause transport** — `JobFailure` carries only `error: string` (domain/job-result.ts:8-12), while the design classifies TimeoutError → `timeout` and ShutdownError/AbortError → `cancelled` at plugin failure recording. Multiple viable mechanisms exist without public-shape change (let abort rejections carry the DOMException through pool/dispatcher to the existing catch path where `error.name` is readable, or embed the name in the error message). Implementation detail; the plan's material-change escape valve covers drift. Advisory A2.
2. **Clock adapter placement** — plan says "lives in adapters"; `packages/plugin-workers-core/src/adapters/` does not exist today. Doctrine-sanctioned: Archetype 3 minimum shape includes `src/adapters/` (06-archetypes.md:99) and the folder vocabulary defines it for port implementations. Advisory A3.
3. **`JobRunnerClock` vs doctrine `ClockPort` sketch** — shape diverges (`now(): number`, delay-based `schedule` returning a disposable stop, no signal arg) but satisfies the doctrine's intent: injected clock port owns all scheduling, no uncleared timers, timers/listeners disposed on settlement (08-runtime-state-failure.md:104-141); "scheduling lives on the clock or on a dedicated scheduler port (workers may need both)". The package's existing `WorkersClock` (`now(): Date`, composition-root.ts:20-22) is the established baseline and is forwarded. Port justified by ≥2 implementations (Web Platform adapter + test fakes). Advisory A4.
4. **`MemoryWorker` compat** — testing fake implementing `RuntimeWorkerPort` (testing/memory-worker.ts:31-83) must accept the optional dispatch-context param; its boolean-flip `stop` should remain compliant by scoping stop-abort semantics to the concrete runner contract. Advisory A5.

## Plan-specified review focus (per plan.md hard-stop line)

- **Shutdown/listener ordering** — PASS. Rule stated: abort active controllers with ShutdownError before waiting on listeners; pool stop concurrent; stop awaits tracked bounded completions. This removes the current 30 s poll-then-abort and the listener/handler deadlock window (worker.ts:208-226 vs plan §Worker.stop).
- **Pre-abort race** — PASS. Pre-aborted signals and expired deadlines prevent handler execution; effective deadline = min(dispatch deadline, now+job.timeout); first abort reason wins.
- **No false success** — PASS. Handler cannot return a successful result after abort; grace rejection races settlement; late progress rejects before state reporting.
- **Clock cleanup** — PASS. All timer handles and parent-signal listeners disposed on settlement; injected clock owns scheduling.
- **Lack of remote cancellation requirement** — PASS. Explicit local `Worker.cancel(executionId)` (absent/already-aborted → false), caller dispatch signal as cancel path; no invented remote protocol. `activeJobs` is already keyed by durable executionId (job-dispatcher.ts:119), so the lookup seam exists.

## Verdict

`PASS`

### If FAIL_* — required fixes

n/a (verdict is PASS). Advisory items below are non-blocking implementation guidance; none changes the locked contract.

## Notes

- **A1 (plan wording).** plan.md line 3 says "no service topology or API contract edit" while the locked design adds a required `signal` to public handler contexts — that IS a public-contract change (consumer-additive, producer-breaking for context constructors/fixtures, which the plan already handles). Treat the locked design as authoritative and run the already-named JSR/public-surface gates; fix the archetype line when convenient.
- **A2 (cause transport).** Do not add a field to the public `JobFailure` shape for cause classification without a new PLAN-EVAL; prefer abort rejections carrying the DOMException through the existing catch path (`error.name`) or a name-bearing error message. `recordJobFailure`'s current `includes('timeout')` string matching (job-dispatcher.ts:316) must be replaced by the name-based classification.
- **A3 (adapter location).** Create `src/adapters/` in plugin-workers-core for the Web Platform clock adapter (one file, `<Tech><Port>` naming per doctrine 05).
- **A4 (clock port).** Name the port `JobRunnerClock` as planned; keep disposable `schedule` and dispose on settlement to satisfy the doctrine's no-uncleared-timer rule.
- **A5 (fakes).** Update `MemoryWorker` for the optional dispatch param; keep its stop contract wording scoped so the boolean-flip fake stays compliant.
- **A6 (F-13).** F-13 (saga/runtime invariants) has no dedicated script (`check-saga-invariants.ts` absent from `.llm/tools/fitness/`); report it as PENDING_SCRIPT with manual evidence at IMPL-EVAL — the design itself satisfies "long-running runtime exposes stop()" and "signal plumbed through every async path".
- **N5 (deferred explicitly).** `processWorkerTask` (job-dispatcher.ts:193-284) still executes tasks without a signal; out of issue #2066 scope (job handler contexts). Record as deferred scope in the plan to prevent silent scope creep.
- Doctrine consistency: Archetype 3 "AbortSignal plumbed through every async path" is the direct subject of this fix; no new package, no executor refactor, no topology change. Verdict vocabulary mapping for the supervisor: PASS (protocol's `FAIL_PLAN` vocabulary not triggered — no unchecked Plan-Gate box).
- Evidence method: read-only inspection of run artifacts, doctrine/harness gates, source tree, and issue #2066; one read-only `gh issue view`. No source/config/lock writes, no branch/history/metadata changes, no CI polling, no implementation gates run (per brief).
