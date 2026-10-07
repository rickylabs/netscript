# Plan

Issue #2066. Archetype: Archetype 3 runtime behavior. Scope: Propagate handler AbortSignal and deadlineAt through worker timeout, shutdown drain and local cancellation. Existing doctrine/debt applies; no new abstraction or package is planned.

Locked decision: Required handler signal, compatible dispatch input, isolated owned controller, injected clock, first-cause DOMException, bounded grace, full Deno path wiring and explicit local Worker.cancel

Gates: structured scoped check/test/lint/fmt; mutation proof for every new regression; cold consumer evidence where dependency resolution changes; quality:scan, arch:check and JSR public/publish audit for changed packages. Runtime gates follow the selected archetype. No release cut or merge.

PLAN-EVAL: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.

Slices: S1 bootstrap/design; S2 issue-specific implementation and regression/mutation gates; S3 independent review/evaluation evidence.

Risk: published-consumer acceptance depends on a coordinated release containing the fix. Do not claim shipment before that receipt exists. Defer only owner release acceptance, not source behavior or required tests.

Open decisions: none unless findings change the contract; record and obtain PLAN-EVAL before implementing any changed material design.

# Locked design — issue 2066

Archetype 3 runtime behavior, package/plugin scope; no service topology or API contract edit. Job handler contexts (domain, runtime and public root mirror) gain required signal: AbortSignal and optional deadlineAt: epoch milliseconds. RuntimeWorkerPort accepts a separate JobDispatchContext with optional signal/deadline for compatibility; runner owns a guaranteed handler signal. No invented remote cancel protocol: Worker.cancel(executionId) cancels an active local execution; caller-provided dispatch signal is also a cancel path.

State: runner accepting/stopped plus per-dispatch owned AbortController and tracked completion. Existing worker activeJobs keys are durable execution IDs and carry execution controllers. Phases: pending -> running -> completed/failed/timeout/cancelled; first abort reason wins. DOMException reason names TimeoutError, ShutdownError, AbortError distinguish causes. Preserve known names from parent signals; normalize unspecified parent reasons to AbortError.

Time is injected: runner options use a JobRunnerClock port (now(): number; schedule(delayMs, callback): disposable stop function). Default Web Platform clock adapter lives in adapters; composition-root forwards existing clock now when provided. Clock schedules deadline and abort-grace timers; all timer handles and parent-signal listeners are disposed on settlement. No timers inside handlers. Derive effective deadline as min(dispatch deadline, now+job.timeout). Validate finite nonnegative timeout/grace and finite explicit deadline. Pre-aborted signals or expired deadlines prevent handler execution.

Runner races handler settlement with an abort grace rejection. On abort the signal is immediately visible; handler may clean up during abortGracePeriodMs (default 1000), but cannot return successful result after abort. stop() rejects new work, aborts active dispatches with ShutdownError and awaits tracked bounded completions. Grace bounds runtime wait, not physical JavaScript termination; a non-cooperating in-process handler may continue. Document this limit explicitly, including CPU blocking limitation.

Plugin executeWorkerJob -> executeDenoJob -> WorkerPool.executeJob -> InProcessJobRunner forwards parent signal. Pool exposes grace option. Worker.stop aborts active controllers with ShutdownError before waiting on listeners and stops pool concurrently to avoid listener/handler deadlock. Worker.cancel looks up execution ID and aborts with AbortError, returns false for absent/already-aborted execution. Failure recording classifies TimeoutError as timeout and ShutdownError/AbortError as cancelled, preserves ordinary handler failures. Late progress after abort rejects before state reporting.

Delivery remains existing at-least-once/idempotency behavior; cancellation releases claim. Handlers remain concurrent across dispatches; each has isolated cancellation ownership. Existing supervisor and execution-state ports retain responsibility for diagnostics and failure handling. No broad executor refactor or new package.

Tests: actual runner lifecycle deadline + timeout, shutdown, explicit cancel and bounded non-cooperation; actual plugin processWorkerJob full Deno path tests timeout and parent cancellation terminal statuses; public Worker cancel/stop lifecycle exercised through existing queue test seam if available. Use one parameterized test for all three plugin causes where feasible. Every added test has a causal source mutation observed failing then restored passing. Existing type fixtures updated for required signal without adding redundant tests. Gates: structured package/plugin/consumer checks/tests, fmt/lint/docs and publish/JSR audit, quality:scan + arch:check; runtime integration needs no distributed topology change. Record baseline debt rather than claim false green.

PLAN-EVAL hard stop before source. Reviewer must scrutinize shutdown ordering, pre-abort race, no false success, clock cleanup and lack of remote cancellation requirement. Source closure may use Fixes only if issue acceptance fully met; no published consumer proof fabricated.
