# Plan & Design — READY FOR REVIEW

Archetype 5 plugin, with Archetype 3 runtime behavior and Archetype 4 builder contracts. Preserve existing composition, public manifests, cancellation and at-least-once delivery; no listener-supervisor edits.

## Locked decisions

1. One job retry executor surrounds the deno/polyglot choice. `maxRetries` counts additional attempts; zero runs once. Retry thrown ordinary failures and unsuccessful results; cancellation/shutdown/timeout propagate without another attempt. The task executor receives a single-attempt definition so it cannot multiply job retries.
2. Canonical typed retry policy supports fixed delay by default and linear/exponential growth capped by maxDelayMs. Legacy maxRetries/retryDelay and metadata.retry remain honored. Handler contributions may attach `retry: { maxRetries, backoff, delayMs, maxDelayMs }`; registry generation carries it into job definitions. Explicit group configuration retains precedence over handler defaults.
3. Reuse JobRunnerClock with abort-aware disposable waits. Retry retains one execution/idempotency claim until the final outcome; success is persisted once.
4. A job DLQ port uses the existing queue append/list/reprocess/depth shape and JobMessage payload, with a distinct namespace. Default to queue KvDeadLetterStore at plugin composition. Persist terminal failures before acknowledgment. A failed DLQ write must propagate to the transport; no swallowing at the listener boundary. Shutdown and cancellation do not create poison-job records.
5. Depth is read from durable storage for health. Preserve the shared child health contract; add job DLQ details to the response through a compatible snapshot extension.

## Slices

1. Retry contracts, shared execution, builder and generated handler policy; fake-clock tests with actual KV queue, available Redis, zero retries and polyglot parity. Files: workers-core domain/builders/runtime, plugin worker execution/options, registry generator and focused tests. Gates: structured test/check/lint/fmt, quality:gate, negative control.
2. Job dead-letter port/default composition, terminal acknowledgment ordering and health. Files: plugin worker port/dispatcher/worker/runtime and tests. Gates: real KV queue/DLQ exhaustion, failing persistence, health depth, reprocess and negative controls, structured wrappers and quality:gate.
3. Handler retry/backoff/DLQ docs and package surface guidance. Files: tune-worker-runtime and relevant README. Gates: docs validation, public export/doc-lint audit and complete focused regression suite.

## Gates and risks

- Scoped wrappers for check/test/lint/fmt are required; quality:gate and package JSR audit supplement them.
- Real adapters prove transport acknowledgment ordering; fake time applies only to retry clock so KV polling is not frozen.
- Negative controls restore baseline behavior temporarily, run individual regression tests, then restore the fix; record exact failures.
- Risks: retry side effects require idempotency; bounded cancellation must dispose timers; DLQ outages must not silently acknowledge; group config/handler policy must have documented precedence.
- Full scaffold.runtime is CI-only by owner instruction. Request e2e-cli gate through the coordinator in READY because registry/runtime wiring changes.
- Open decisions: none that force rework. Available external Redis is environment-dependent and safe to report unproven if unavailable.
- Deferred: listener restart budget (#2400), queue transport retry mechanics, unrelated standalone task retry behavior, administrative DLQ APIs.
- Debt: no new architectural debt planned; existing unrelated debt remains scoped out.

Do not merge until PLAN-EVAL and mandatory final independent IMPL-EVAL are complete. Only the coordinator merges.
