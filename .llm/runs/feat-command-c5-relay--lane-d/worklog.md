# C5 worklog

Bootstrap, Research, Plan & Design, Plan-Gate complete; Implement active; Gate/Evaluate/Close pending. Release N/A (no publication requested). Fresh issue and all comments read; native MCP guidance consulted. No new debt authorized.

## Design

Public surface: database commands exports raw CommandOutboxRelayStore, ClaimedCommandOutboxRow, closed failure constants and normalized acceptance. Existing commands/postgres adds createPostgresCommandOutboxRelayStore. Service commands/relay factory consumes explicit injected clock/ids, store, copied sink registry, bounds/maxAttempts/retry classifier and retry instant. Running relay exposes drainOnce and stop. Core manifests integration/commands own checked factories.

Domain vocabulary: lease generation, six failure classes, normalized acceptance identity/time, decoded canonical command payload, validated W3C trace, per-drain abort and stop state. Constants derive finite failure union; protocol policy bounds 64 rows/concurrency, positive finite lease/attempt/backoff. Ports: true provider callback SQL client; raw relay store; decoded sink; existing worker checked receipt port, saga publisher and stream producer.

Slices: S11 raw contracts/PostgreSQL/schema+physical conformance; S12 service decoding/fault/lifecycle; S13 thin checked sinks; S14 honest wording/consumer docs and whole qualification. Each slice has RED first, named semantic production mutation plus restored PASS, static/quality/architecture, sign-off and draft PR evidence. Contributor follows public manifest to one named factory and its ports. Deferred: SQL engines beyond PostgreSQL, queue wrappers, runtime schema changes, new relay, saga atomic producer (#1932), CLI generators owned by later RFC stages.

## Gates

Structured root check/lint/fmt, tests via run-deno-test, quality/architecture, full export docs, audits/dependency/publish, consumer import/type, physical PostgreSQL lease/CAS receipts and fault proofs, four Deno 2.9.5 regeneration/freshness gates, canonical full scaffold.runtime, native CI, exact-product independent IMPL-EVAL. Each actual EXIT recorded privately and summarized here.
