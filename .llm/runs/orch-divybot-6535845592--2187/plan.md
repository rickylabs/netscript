# Plan & Design — READY FOR REVIEW

## Locked decisions

1. Keep the existing adapter and ports. Set event.idempotencyKey at construction; do not edit the KV resolveKey function, definition-key wiring, or scheduled identities from #2165.
2. With both valid mtime and size, use a prefixed JSON tuple of triggerId/path/kind/mtime/size. Partial/absent metadata gets a per-event UUID key independent of counters and timestamps. Keep existing event ids outside this fix.
3. File-watch default completed TTL is zero (active claim only); explicit definition ttlMs remains authoritative. Other kinds keep the 24-hour default. No builder contract change.
4. Explain active-only duplicate suppression, eligibility after completion, metadata identity, missing-metadata UUIDs and explicit policy in the triggers docs. Keep the intentional one-import-per-path example and explain its worker policy.
5. Use deterministic watcherFactory input through the real WatchersFileWatcherAdapter, real TriggerProcessor and disk-backed DenoKvAdapter. Close and reopen the same KV file with fresh adapter/processor instances for restart proof. Block handler entry with promises to prove concurrent duplicate rejection across processors, then eligibility after completion.
6. Add a real upstream watcher/filesystem smoke where feasible to complement the deterministic metadata seam. Negative-control each new test against the two original production files; restore exactly afterwards. Tests must fail assertions, not types or unrelated setup.

## Slices

- S0: tracked research/design/run record; draft PR in this session. Gate: explicit scope and seven-item Design checkpoint present.
- S1: one coherent behavior correction and regression suite. Files: the two production core files, colocated adapter tests, runtime/file-watch-idempotency_test.ts, triggers docs, run record and dated lesson. Gates: focused tests (positive + negative controls); full core tests; structured source check/lint/fmt; quality:gate and arch:check; scoped JSR audit and doc lint. Independent read-only slice review before sign-off commit, then push/comment.
- S2 if required: evaluator/CI blocker repairs only with appropriate affected gates and run updates. No speculative refactor.

## Gates and acceptance

Archetype 3 F-1..F-19: use scoped wrappers, quality scan and architecture gates; audit JSR and full-export doc lint, manual inspection for untouched structure/contracts. Real adapter/KV tests prove identity, active concurrency, completion and clean stop. Consumer coverage imports the public builders/adapters/stores/runtime surface. No dependency changes; frozen graph. Local full CLI E2E is prohibited by owner; coordinator owns any required e2e-cli CI label/verdict. This change does not alter scaffold generation or plugin wiring, but final report must state CI coverage truthfully.

## Risks

- Missing or partial metadata collapsing distinct writes: UUID fallback tested on repeated adapter instances and same callback time.
- Metadata tuple instability: compare same metadata across instances and all tuple dimensions; ignore incidental fields.
- TTL regression for other kinds/caller overrides: focused tests verify webhook/scheduled defaults and explicit ttlMs.
- Restart proof accidentally fresh: close/reopen same disk file and preserve an unrelated sentinel as proof.
- Adapter serial dispatch concealing concurrency: capture two genuine adapter events and use two processor instances sharing durable KV with a blocked handler.
- Existing broad-quality failure: reproduce pre-change baseline and report separately; never weaken checks or edit unrelated files.

## Open-decision sweep

No decision requiring owner input remains. Safe to defer: changing process-local file event ids (not used as keys), exact-once file-content semantics, extending FileWatchSpec options, broader worker policy changes, and scaffold runtime execution to the coordinator.

## Debt

No new or deepened architectural debt intended. Existing package verdict is Keep; record any uncovered pre-existing gate failure as baseline evidence rather than silently accepting new debt.
