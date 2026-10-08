# Plan

Issue #2066. Archetype: Archetype 3 runtime behavior. Scope: Propagate handler AbortSignal and deadlineAt through worker timeout, shutdown drain and local cancellation. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Required handler signal, compatible dispatch input, isolated owned controller, injected clock, first-cause DOMException, bounded grace, full Deno path wiring and explicit local Worker.cancel

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.

# Locked design — issue 2066

Archetype 3 runtime behavior, package/plugin scope; no service topology or remote API contract edit; public handler contract changes. Job handler contexts (domain, runtime and public root mirror) gain required signal: AbortSignal and optional deadlineAt: epoch milliseconds. RuntimeWorkerPort accepts a separate JobDispatchContext with optional signal/deadline for compatibility; runner owns a guaranteed handler signal. No invented remote cancel protocol: Worker.cancel(executionId) cancels an active local execution; caller-provided dispatch signal is also a cancel path.

State: runner accepting/stopped plus per-dispatch owned AbortController and tracked completion. Existing worker activeJobs keys are durable execution IDs and carry execution controllers. Phases: pending -> running -> completed/failed/timeout/cancelled; first abort reason wins. DOMException reason names TimeoutError, ShutdownError, AbortError distinguish causes. Preserve known names from parent signals; normalize unspecified parent reasons to AbortError.

Time is injected: runner options use a JobRunnerClock port (now(): number; schedule(delayMs, callback): disposable stop function). Default Web Platform clock adapter lives in adapters; composition-root forwards existing clock now when provided. Clock schedules deadline and abort-grace timers; all timer handles and parent-signal listeners are disposed on settlement. No timers inside handlers. Derive effective deadline as min(dispatch deadline, now+job.timeout). Validate finite nonnegative timeout/grace and finite explicit deadline. Pre-aborted signals or expired deadlines prevent handler execution.

Runner races handler settlement with an abort grace rejection. On abort the signal is immediately visible; handler may clean up during abortGracePeriodMs (default 1000), but cannot return successful result after abort. stop() rejects new work, aborts active dispatches with ShutdownError and awaits tracked bounded completions. Grace bounds runtime wait, not physical JavaScript termination; a non-cooperating in-process handler may continue. Document this limit explicitly, including CPU blocking limitation.

Plugin executeWorkerJob -> executeDenoJob -> WorkerPool.executeJob -> InProcessJobRunner forwards parent signal. Pool exposes grace option. Worker.stop aborts active controllers with ShutdownError before waiting on listeners and stops pool concurrently to avoid listener/handler deadlock. Worker.cancel looks up execution ID and aborts with AbortError, returns false for absent/already-aborted execution. Failure recording classifies TimeoutError as timeout and ShutdownError/AbortError as cancelled, preserves ordinary handler failures. Late progress after abort rejects before state reporting.

Delivery remains existing at-least-once/idempotency behavior; cancellation releases claim. Handlers remain concurrent across dispatches; each has isolated cancellation ownership. Existing supervisor and execution-state ports retain responsibility for diagnostics and failure handling. No broad executor refactor or new package.

Tests: actual runner lifecycle deadline + timeout, shutdown, explicit cancel and bounded non-cooperation; actual plugin processWorkerJob full Deno path tests timeout and parent cancellation terminal statuses; public Worker cancel/stop lifecycle exercised through existing queue test seam if available. Use one parameterized test for all three plugin causes where feasible. Every added test has a causal source mutation observed failing then restored passing. Existing type fixtures updated for required signal without adding redundant tests. Gates: structured package/plugin/consumer checks/tests, fmt/lint/docs and publish/JSR audit, quality:scan + arch:check; runtime integration needs no distributed topology change. Record baseline debt rather than claim false green.

PLAN-EVAL hard stop before source. Reviewer must scrutinize shutdown ordering, pre-abort race, no false success, clock cleanup and lack of remote cancellation requirement. Source closure may use Fixes only if issue acceptance fully met; no published consumer proof fabricated.

PLAN-EVAL PASS at `6d6bca2cdb4361c17779e079ce6e7331510c8233`. Adopt advisories A1–A6: native DOMException cause transport, adapter-owned clock, dispatch-input compatibility in fake, manual F-13 evidence. Task dispatcher cancellation remains explicit deferred scope; this issue covers job handlers. Worker shutdown signal also links newly-created execution controllers so admissions racing drain inherit shutdown. Implementation waits while issue #2036 CI amendment is completed in order.

## Queue-port test seam amendment

Inspection found no injectable queue: both job and task listeners construct queues internally. Add optional `queue?: MessageQueue<JobMessage>` and `taskQueue?: MessageQueue<TaskMessage>` to existing WorkerOptions. Default queue construction remains identical. Worker owns and stops supplied queues just as defaults; document this ownership. WorkerQueueContext carries the optional taskQueue for the existing listener helper. Private job queue uses existing MessageQueue port rather than a traced subtype; traced defaults still satisfy that port. No new interface, remote API or trigger queue change. This is an additive constructor dependency seam, justified by real lifecycle tests using the first-party MemoryQueueAdapter.

One parameterized native in-process test runs Worker.start -> actual queue delivery -> processWorkerJob -> Deno execute path -> WorkerPool -> runner -> handler for timeout, Worker.cancel and Worker.stop. Assert required handler signal/deadline, immediate cause, terminal timeout/cancelled, released idempotency claim, zero active executions and settled shutdown. Do not reflect private fields or replace dispatch/pool methods. Use existing state/idempotency test adapters. Causal mutations must kill each cause scenario; restore and pass. S2 gains worker-options.ts/worker.ts/queue-consumer.ts and adjacent lifecycle test, still under 30 files. Existing failure-path/lifecycle gates cover seam; defaults covered by existing tests.

Risk: supplied queues become unavailable after stop; explicit ownership documentation makes that behavior reviewable. No open design decisions. Targeted amendment PLAN-EVAL required before any source edit.

Final CI maintenance delta: PLAN-EVAL N/A — bounded existing fixture/documentation repair, no runtime or public-contract change. Move unchanged cancellation guidance after introduction to satisfy tagline rule; update generated consumer fixture with required signal while retaining payload negative assertion; regenerate MCP export corpus from clean committed source using owning generator. Existing CLI-registry, corpus freshness and tagline regressions plus scoped check/lint/fmt. New exact-head independent delta IMPL-EVAL before final handoff. Existing cancellation runtime and mutation PASS remains unchanged.

## Review repair plan
Scope: Merge main; retain real-core registry and plugin payload coverage with required handler signals and negative payload assertions; no runtime behavior change.. Archetype: existing owning run; bounded repair preserves public contracts. Read harness retrieval order, run-loop, lane-policy, gate matrix and applicable doctrine. Scoped structured check/test/lint/fmt, quality/architecture, owning JSR and publication, dependency and generated-asset freshness gates. PLAN-EVAL: N/A for mechanical merge/repair of already independently reviewed contracts; select PLAN-EVAL if substantive integration decisions emerge. Slices: merge main preserving both intentions; each canonical generator in its own commit; gates; exact-source independent IMPL-EVAL; closeout. No release, merge of PR, or publication.
