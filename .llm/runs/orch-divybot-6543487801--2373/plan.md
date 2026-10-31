# Plan & Design — READY FOR REVIEW

Test-only change to Archetype 2 adapter conformance. No public type, runtime, dependency, export or layering changes; publish-surface audit is unchanged (no new JSR surface).

Locked decisions: reuse @std/async deadline to observe iterator completion after abort, assert done with undefined value and terminal next request, and replace tight abort budgets with a named 5-second ABORT_TIMEOUT_MS hang guard and a separate 60-second ABORT_DEBOUNCE_MS window. Await optional ready before writing (preserve legacy startup fallback). Keep debounce setup distinct from completion assertions. Sweep memory/Deno KV/Redis siblings; replace the queue's 100ms deadline with a hang guard and event/microtask sequencing.

Slices: (1) harness bootstrap and plan evaluation; (2) contract and queue assertions with structured focused tests, check/lint/fmt, quality:gate; record 20 sequential and four concurrent real Redis runs under parallel load; (3) evaluation evidence and final handoff. Every slice updates worklog and context.

Risks: debounce setup still assumes asynchronous delivery before abort; avoid asserting elapsed latency, preserve pending-result identity so a yielded batch fails, use the locked 60-second ABORT_DEBOUNCE_MS abort window. Optional readiness must remain optional. Finally blocks must abort and drain so assertion failures do not leak resources.

No open decisions. Deferred: production fixes, unrelated timing/delivery semantics, scaffold/runtime E2E (owner explicitly exempts this test-only leaf). No accepted architectural debt.

## PLAN-EVAL repair (round 1)

Use a separately named 60-second abort-scenario debounce window against the 5-second hang guard. The ordinary delivery debounce remains 400ms. Queue setup uses synchronous push then a microtask checkpoint so the pending next enters debounce before abort. Completion is observed from the original pending promise; assert terminal next after a post-abort write.

Negative control: archive this tree into an isolated non-worktree snapshot under the private project run, apply the test-only changes, remove the Redis queue delay signal in that snapshot only, and prove the contract abort and queue abort scenarios fail. Never modify production files in the assigned worktree. Snapshot validation may need non-frozen npm setup depending on cache; record any limitation.
