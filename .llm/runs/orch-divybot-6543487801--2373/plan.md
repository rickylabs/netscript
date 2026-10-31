# Plan & Design — READY FOR REVIEW

Test-only change to Archetype 2 adapter conformance. No public type, runtime, dependency, export or layering changes; publish-surface audit is unchanged (no new JSR surface).

Locked decisions: reuse @std/async deadline to observe iterator completion after abort, assert done with undefined value and terminal next request, and replace tight abort budgets with a named 5-second hang guard. Await optional ready before writing (preserve legacy startup fallback). Keep debounce setup distinct from completion assertions. Sweep memory/Deno KV/Redis siblings; replace the queue's 100ms deadline with a hang guard and event/microtask sequencing.

Slices: (1) harness bootstrap and plan evaluation; (2) contract and queue assertions with structured focused tests, check/lint/fmt, quality:gate; record 20 sequential and four concurrent real Redis runs under parallel load; (3) evaluation evidence and final handoff. Every slice updates worklog and context.

Risks: debounce setup still assumes asynchronous delivery before abort; avoid asserting elapsed latency, preserve pending-result identity so a yielded batch fails, use generous debounce setup where needed. Optional readiness must remain optional. Finally blocks must abort and drain so assertion failures do not leak resources.

No open decisions. Deferred: production fixes, unrelated timing/delivery semantics, scaffold/runtime E2E (owner explicitly exempts this test-only leaf). No accepted architectural debt.
