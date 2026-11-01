# Plan & Design — READY FOR REVIEW

One investigation PR for #2390. Archetype 5 plugin composition incorporating archetype 3 runtime/restart invariants. No public contract change or new architecture debt. Doctrine A5/A7/A10/A12/A13/A14 apply.

## Locked decisions

1. Synthetic receipt saga: business phase `admitted` → `recorded`. Reuse first-party store/projection, HTTP router/publisher, queue delivery supervisor, command relay/sink, worker dispatcher and durable producer. Never copy consumer code.
2. Prisma/Postgres runs the full atomic-worker-outbox flow. Reuse the generated-client provider harness, isolated schema and owned cleanup. Assert canonical state, query projection/history, one command intent, checked acceptance, worker outcome and physical stream events/offsets.
3. Restart the producer after priming sequence zero and after saga commit but before receipt append, retaining ID and allocating a higher persisted epoch. Reconstruct the processor over persisted stores before receipt delivery. Replay messages after restart; no repeated worker effect/transition.
4. Native KV cannot run the atomic-worker-outbox contract. Test registration refusal before state/effect writes. Separately test its supported persisted saga/projection receipt path across processor/producer restarts, explicitly lacking atomic worker-outbox delivery. Do not implement a KV outbox.
5. Real reference stream HTTP server and native HTTP saga boundary. Require stream readback before publishing receipt so acknowledged-but-missing appends fail.
6. Compare with canary.8: prefer tag execution in an isolated project worktree; if API contracts differ, explain exact barriers and run focused source-revert/negative controls for load-bearing fixes. No invented historical claims.
7. Fix only a small proven sagas/streams defect; otherwise retain failing test/precise defect for coordinator. No merge authority.

## Slices

1. Bootstrap/run plan, independent PLAN-EVAL and draft PR.
2. Shared reproduction and provider tests under `plugins/sagas/tests/runtime/fixtures/` and `plugins/sagas/tests/runtime/projected-receipt*_test.ts`. Extend existing PostgreSQL conformance entrypoint only if needed for CI execution. Gates: structured focused tests/check/lint/fmt, quality:gate, neighboring regressions and independent slice/implementation review. Worklog/context in same commit.
3. Historical controls, per-symptom evidence, dated lesson, final gates/evaluation at pushed head, ready PR and CI snapshot. Coordinator-owned CI scaffold.runtime requested, never run locally.

## Gates

Structured check/test/lint/fmt on owned TypeScript; `deno task quality:gate`; relevant neighboring regressions; generated-client PostgreSQL with zero skipped provider scenarios; JSR audit of unchanged publish surface; review-thread gate. Coordinator-owned CI full scaffold.runtime mandatory before merge. Unavailable gates are unproven.

## Risks and mitigations

- False acceptance: read physical events and advanced offsets, not only producer outcomes.
- Replay masks missing work: prime old producer, assert rows/transitions/job count and final phase.
- KV mismatch: refusal test and clearly bounded supported-flow evidence.
- Provider prerequisites: owned userland PostgreSQL, no foreign services.
- Historical API differences: record exact incompatibility, preserve expectations.
- Leaks: finally-owned cleanup; resource sanitizers remain enabled.

## Open decisions / deferred scope

No unresolved architecture decisions. Fixture splitting is safe to defer until typecheck; current reproduction outcome is an investigation result. Defer consumer singleton composition, KV atomic worker outboxes, broader scheduled/compensation effects, release/merge. Broad remaining defects go to coordinator with a failing test.
