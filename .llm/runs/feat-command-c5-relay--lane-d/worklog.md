# C5 worklog

Bootstrap, Research, Plan & Design, Plan-Gate complete; Implement active; Gate/Evaluate/Close pending. Release N/A (no publication requested). Fresh issue and all comments read; native MCP guidance consulted. No new debt authorized.

## Design

Public surface: database commands exports raw CommandOutboxRelayStore, ClaimedCommandOutboxRow, closed failure constants and normalized acceptance. Existing commands/postgres adds createPostgresCommandOutboxRelayStore. Service commands/relay factory consumes explicit injected clock/ids, store, copied sink registry, bounds/maxAttempts/retry classifier and retry instant. Running relay exposes drainOnce and stop. Core manifests integration/commands own checked factories.

Domain vocabulary: lease generation, six failure classes, normalized acceptance identity/time, decoded canonical command payload, validated W3C trace, per-drain abort and stop state. Constants derive finite failure union; protocol policy bounds 64 rows/concurrency, positive finite lease/attempt/backoff. Ports: true provider callback SQL client; raw relay store; decoded sink; existing worker checked receipt port, saga publisher and stream producer.

Slices: S11 raw contracts/PostgreSQL/schema+physical conformance; S12 service decoding/fault/lifecycle; S13 thin checked sinks; S14 honest wording/consumer docs and whole qualification. Each slice has RED first, named semantic production mutation plus restored PASS, static/quality/architecture, sign-off and draft PR evidence. Contributor follows public manifest to one named factory and its ports. Deferred: SQL engines beyond PostgreSQL, queue wrappers, runtime schema changes, new relay, saga atomic producer (#1932), CLI generators owned by later RFC stages.

## Gates

Structured root check/lint/fmt, tests via run-deno-test, quality/architecture, full export docs, audits/dependency/publish, consumer import/type, physical PostgreSQL lease/CAS receipts and fault proofs, four Deno 2.9.5 regeneration/freshness gates, canonical full scaffold.runtime, native CI, exact-product independent IMPL-EVAL. Each actual EXIT recorded privately and summarized here.

## S11 sign-off

Raw port, true-callback PostgreSQL atomic SKIP LOCKED claim/live-token CAS, paired receipt fields and reviewed incremental migration implemented. Real generated PostgreSQL RED: EXIT 1, all three named inner tests fail assertions against absent behavior. GREEN: EXIT 0, all three pass. Every new named inner test plus native wrapper has semantic production mutation evidence and byte-identical restored PASS. One initial retry mutation produced a SQL type error and is explicitly not credited; repaired timestamp mutation reaches the intended assertion failure.

Scoped database check/lint/fmt, quality/architecture EXIT 0. Full twelve-entrypoint docs initially EXIT 1 for a recursive constant export; repaired manifest makes every entrypoint EXIT 0. Audit EXIT 0. Combined existing command-store plus new relay native provider wrappers EXIT 0 (two wrappers, no ignored provider certification). Existing dedicated PostgreSQL CI script now executes both suites; no workflow mutation.

Content review: database owns only raw rows/closed failure state; one parameterized statement claims bounded due rows under SKIP LOCKED; settlement includes id/token/live expiry and unpublished/nonterminal predicates. Acceptance validation precedes SQL and metadata shares publication CAS. Retry uses actual now distinct from future availability; terminal retains stable row. No queue/service import, runtime DDL, root writes, nested transaction or callback retry. No unrelated source/lock changes. Reconcile: fresh issue metadata milestone 0.0.8 retained; no new comments change locked scope. S11 complete; S12 next.
