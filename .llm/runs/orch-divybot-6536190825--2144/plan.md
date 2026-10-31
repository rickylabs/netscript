# Plan & Design — READY FOR REVIEW

Archetype 5 plugin, with Archetype 3 runtime behavior and Archetype 4 builder contracts. Preserve existing composition, public manifests, cancellation and at-least-once delivery; no listener-supervisor edits.

## Locked decisions

1. One job retry executor surrounds the deno/polyglot choice. `maxRetries` counts additional attempts; zero runs once. Retry thrown ordinary failures and unsuccessful results; cancellation/shutdown/timeout propagate without another attempt. The task executor receives a single-attempt definition so it cannot multiply job retries.
2. Canonical typed retry policy supports fixed delay by default and linear/exponential growth capped by maxDelayMs. Precedence is field-wise: handler.retry > definition metadata.retry > definition maxRetries/retryDelay > runtime defaults (3/1000/fixed/300000). Group-vs-flat config selection remains the existing whole-group override; handler retry fields override even explicit group legacy fields, so parsed schema defaults cannot shadow handler policy. No raw-config explicitness detection is needed. Both registry generators validate and persist the resolved policy in maxRetries, retryDelay and metadata.retry; absent handler retry preserves existing registration shape. Builder metadata.retry.delayMs wins over its legacy retryDelay. Handler retry is validated even on unconfigured jobs. The canonical Zod schema bounds maxRetries to integer 0..100, delays to finite nonnegative safe integers, and maxDelayMs to at least delayMs. Exponential arithmetic clamps the exponent before multiplication. Registration validates legacy counts and metadata through the same resolver. Add a configured group with omitted retry fields and handler policy to regression tests.
3. Reuse JobRunnerClock with abort-aware disposable waits. Retry retains one execution/idempotency claim until the final outcome; success is persisted once.
4. The job dead-letter port is a typed specialization of the existing core queue port with JobMessage payload, with a distinct namespace. This reuses sibling contracts rather than defining a plugin-owned protocol. Default to queue KvDeadLetterStore at plugin composition. Persist terminal failures before acknowledgment. A failed DLQ write must propagate to the transport; no swallowing at the listener boundary.
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
- The in-flight visibility and active idempotency TTL must exceed the configured total job budget: (maxRetries+1)*timeout + capped waits. Document this and test with retry budgets well inside the transport visibility. Transport lease renewal is deferred; retries do not promise exactly-once effects.
- Full scaffold.runtime is CI-only by owner instruction. Request e2e-cli gate through the coordinator in READY because registry/runtime wiring changes.
- Open decisions: none that force rework. Available external Redis is environment-dependent and safe to report unproven if unavailable.
- Deferred: listener restart budget (#2400), queue transport retry mechanics, unrelated standalone task retry behavior, administrative DLQ APIs.
- Debt: no new architectural debt planned; existing unrelated debt remains scoped out.

Do not merge until PLAN-EVAL and mandatory final independent IMPL-EVAL are complete. Only the coordinator merges.

## Locked outcome table

All requeue paths release an acquired idempotency claim before propagating rejection. Listener callbacks must preserve that rejection. The S1 retry commit implements shutdown replay even before the DLQ slice.

| Outcome | Execution status | Claim | Job DLQ | Transport |
| --- | --- | --- | --- | --- |
| Success | completed | mark applied | none | acknowledge |
| Ordinary failure before exhaustion | running | retain | none | keep delivery open through abort-aware wait |
| Retries exhausted | failed | release after durable terminal handling | append with attempts=maxRetries+1 | acknowledge only after persistence |
| Per-attempt timeout | timeout | release | append with attempted count; timeout is terminal and does not restart uncooperative in-process work | acknowledge only after persistence |
| User cancel (AbortError) | cancelled | release | none | acknowledge intentional cancellation |
| Shutdown during attempt | cancelled | release | none | reject/requeue |
| Shutdown during retry wait | cancelled | release | none | reject/requeue; fresh consumer retries the message |
| DLQ write failure | failed/timeout | release | not confirmed | reject/requeue; queue transport budget remains independent |
| Unknown/disabled job | failed if execution exists | release if acquired | append diagnostic with zero handler attempts | acknowledge only after persistence |

S1 retains pre-DLQ terminal failure recording; S2 adds persistence-before-ack to terminal outcomes. Real KV shutdown-during-backoff replay is a required negative-control regression.
