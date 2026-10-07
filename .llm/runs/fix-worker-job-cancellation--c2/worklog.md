# Worklog

## Design

Public surface and domain: Required handler signal, compatible dispatch input, isolated owned controller, injected clock, first-cause DOMException, bounded grace, full Deno path wiring and explicit local Worker.cancel

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Required: lifecycle and public cancellation contract design; hard stop until independent PLAN-EVAL PASS.
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

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
