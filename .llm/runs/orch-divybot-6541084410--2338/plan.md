# Plan & Design — READY FOR REVIEW

Issue #2338, C1, main baseline in research. Archetype 3 runtime/behavior + docs overlay; service scope is test-only. Doctrine: Keep producer/schema/telemetry/diagnostic seams. Anti-pattern risks: side effects in supervisor, invented protocol endpoint, altered retry identity, application-level dedup masquerading as transport idempotency.

## Locked decisions

1. Add optional public `initialEpoch: number` to DurableStreamProducerOptions and supervisor options. Validate a non-negative safe integer before any IO. It is a caller-persisted, monotonically allocated epoch per (streamPath, producerId). Epoch 0 is a legal first session; allocate a strictly higher value for each recreated session. No wall clock/random guesses and no extra stream records/claim handshake.
2. When explicitly provided, preserve epoch and sequence across ALL retries; stale epoch is terminal, never silently seize a new epoch from another writer. Omitted initialEpoch preserves existing auto-claim behavior for compatibility, with explicit docs warning that stable restart safety requires persisted epoch allocation. Singleton compatibility includes normalized epoch; omitted/zero equivalent only if behavior matches (explicitness also affects fencing).
3. No new consumer protocol or materialization rules. Unchanged source documents must be filtered against an application checkpoint before calling upsert; opening/stopping an idle fresh session appends nothing. Repeated explicit upsert calls remain separate operations. State this boundary in docs and final acceptance evidence; do not claim built-in cross-restart content equality.
4. Retain FIFO serialized entry and transport adapter; add no generic storage abstraction. The application already has its own atomic KV/database epoch source.

## Slices

1. Bootstrap/research/design: run artifacts only; PLAN-EVAL before implementation, draft PR immediately after this first commit.
2. Runtime + proof + docs: options/validation/supervisor/fingerprint, focused tests and real-server tests; initial epoch propagation, stale fencing, validation/singleton, restart offsets, lost-ack retry tuple+bytes, unchanged/idle no append; README and streams guide. Gates: structured core/service tests, check/lint/fmt; quality:gate; JSR audit/doc-lint; consumer fixture; negative controls. Independent slice review before sign-off commit.
3. Handoff: run evidence, lessons and final review; ready PR then final IMPL-EVAL at exact pushed head, review-thread gate, record current CI (do not wait/poll). Coordinator must arm e2e-cli-gate. No merge/tag/release.

## Risks and mitigations

- Reused epoch is indistinguishable from retry: document atomic persistent allocation and unchanged-source checkpoint; no exactly-once claim across process crashes.
- Existing default callers remain legacy: option is supported migration seam allowed by original issue; prominently correct old “stable ID alone” advice.
- Concurrent old producer steals epoch: explicit epoch disables stale auto-claim and fails closed.
- Lost ack causes duplicate: transport retry keeps byte-identical serialized event and tuple.
- Failed validation creates resource: validate before URL/telemetry/supervisor connection; unit proof of zero IO.
- Max safe epoch: validate bounds; explicit epoch is not incremented internally.
- Unchanged acceptance ambiguity: explicitly prove no handshake/idle appends, describe caller equality filter. Request evaluator judgement before implementation.

## Gates and debt

Structured source check/lint/fmt, all core tests and reference-server service tests; runtime start/stop/retry/terminal failures, existing consumer import fixture; full repository quality:gate (includes dependency + architecture), package JSR audit and doc-lint; docs freshness if surface artifacts are gated. Do not run local scaffold.runtime (owner prohibition). e2e-cli CI verdict is mandatory and coordinator-owned. Report unavailable gates unproven. No new architecture debt intended.

Open decisions: none deferred that affect implementation; unchanged acceptance is called out for the selected Plan-Gate. Deferred: automatic distributed epoch allocator, content checkpoint store, server session API, durable queue across crashes, consumer changes. Each needs application storage or a protocol change; neither is necessary for a supported explicit epoch seam.
