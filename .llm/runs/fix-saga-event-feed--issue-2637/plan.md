# Plan checkpoint: ordered retained saga SSE

Feature tier, Archetype3 with integration2/plugin5. This is a research checkpoint, not an approved implementation plan.

Goal: every connected reader sees each retained API event in atomic append order; stable ids support Last-Event-ID replay; idle subscriptions perform no keyspace scan; history has an explicit bounded retention policy.

Proposed direction: a core-owned portable KV journal with a small fixed head and a bounded number of directly addressed event slots, atomic head+slot append, per-reader cursor and fixed-key notifications. Use existing KV CAS/watch and native oRPC lastEventId. Avoid aggregate values that exceed native Deno KV limits. Coalesce watch wakeups for slow readers; read known slot keys, never prefix-scan. Plugin stays thin wiring over core conventions.

Must resolve before Plan-Gate: exact retention bound/key layout/cursor encoding, atomic contention and ordering semantics, initial subscription baseline and subscribe/read races, native header/error behavior for malformed/expired/future/foreign cursors, filtering, cancellation/failure/slow-reader behavior, migration limits for legacy ephemeral keys, supported-backend proof and measured JSR baseline. Contract/types and quick-start design precede product implementation. Genuine red tests precede fix.

Deferred: every file under packages/plugin-sagas-core/src/transports, upstream Garnet Streams, saga delivery/outbox/runtime state projection changes, process launch/Aspire/scaffold changes, general KV watcher recovery owned separately, dependency/lock updates.

Gate set: structured scoped check/lint/fmt/tests with unstable-kv; Archetype3 F1-F19 and integration/plugin overlays; real HTTP plus native DenoKV/memory/Redis/Garnet tests; full affected suites; exact doc-lint baseline comparison, JSR native dry-runs/audits, quality/arch, release:preflight/docs:accuracy and canonical consumers. Full scaffold runtime applicability will be decided from actual generated/process wiring scope; no expensive intermediate smoke. Separate feature PLAN-EVAL before implementation and IMPL-EVAL before ready; current required head checks and review-thread gate. No merge, ready-merge label, auto-merge or publication.
