# Plan & Design — READY FOR REVIEW

Fix incoming context extraction at the message boundary. Valid incoming W3C context continues the
producer trace; missing/invalid context starts a fresh trace. The worker's active context must never
be a fallback. Trigger ingress follows the same rule; nested job/trigger spans retain local ancestry.

1. S1: regression tests and fix in telemetry `src/context/{w3c,message}.ts`, telemetry context and
   queue-consumer tests; explicit root in `plugins/triggers/src/runtime/trigger-runtime-processor.ts`
   with real SDK regression tests, worker dispatcher regression tests and telemetry README.
   Gate: structured check/test/lint/fmt for affected surfaces; whole telemetry/workers-core/triggers-core
   and workers/triggers plugin suites; quality:gate; JSR audit/doc lint.
2. S2: full `e2e:cli` scaffold.runtime merge-readiness gate, independent different-family IMPL-EVAL,
   substantive review, evidence, lesson and final handoff. The expensive full smoke is a final gate,
   following AGENTS.md's evaluator/merge-readiness placement; it is not relaxed or replaced.

PLAN-EVAL: N/A. This is a bounded correction to three existing ingress fallback paths. The expected
parenting rule is prescribed by the issue and existing tests (#405); no new public API, data model,
runtime lifecycle, delivery contract, persistence or dependency decision is introduced.

Risks: callers relying on implicit ambient parents (mitigate whole consumer suites and valid producer
parent tests); no-op propagation (test with and without registered W3C propagator); concurrent async
delivery (real AsyncLocalStorage context manager); failure leakage (assert status/end and restoration).

Deferred: resetting every valid producer trace via links, telemetry query optimization, span retention,
and worker lifecycle redesign. None is needed to prevent unrelated deliveries sharing a worker trace.
No new architecture debt planned. Existing runtime cancellation/concurrency/delivery semantics remain
owned by existing runners; tests exercise dispatch success/failure without resources.
