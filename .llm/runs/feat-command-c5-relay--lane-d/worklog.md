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

## S12 sign-off

Decoded relay, finite classifier/retry ceiling, checked normalized receipts, copied sink registry and explicit drain/stop supervision implemented. Six named service tests have semantic production AssertionError mutants and byte-identical restored PASS. RED EXIT 1 follows the type-fixture correction and reaches the absent decode/release assertion; compile-only attempts are not RED proof. One uncertain-settlement mutation initially survived because the fake threw synchronously; the fixture now rejects asynchronously like the provider boundary, and the final mutant reaches the intended missing-rejection AssertionError. All attempts remain private evidence.

Service scoped check/lint/fmt, quality/architecture, full export docs and audit EXIT 0. Service/contracts regression EXIT 0: 239 passed, 0 failed. Native wrappers used; restored tests run with frozen lock. The only accepted lock delta is the explicit service telemetry workspace dependency; unrelated automatic peer/format churn is retained privately and excluded. New relay consumer subpath is added to the existing CLI rewrite map; canonical full runtime remains required at final S14 qualification.

Content review: all drains queue under one configured publisher ceiling; stop aborts new claims, signals publishers and waits active/queued promises. Publication precedes live-token settlement, unknown settlement errors preserve leased rows, and retries retain stable keys. Invalid canonical/trace rows or missing sinks cannot publish; unchecked normalized receipt cannot settle. Classifier/backoff errors remain finite and retain terminal configuration state. Deferred parent restoration and producer context injection use existing telemetry helpers; observer failure preserves exactly one operation/result. No new timer, queue, raw-error attributes or second relay. Reconcile: issue comments unchanged; no acceptance/readiness claim. S12 complete; thin sinks S13 next.

## S13a worker sink sign-off

S13 is split into three bounded core sign-off commits to keep each review surface below thirty files. Worker-owned narrow supplied trigger port is structurally compatible with existing explicit saga-worker clients and returns raw responses for checking. Copied branded topic targets, stable key/correlation/W3C propagation and kind/id/run/time checking produce only normalized acceptance. Absent/malformed/ambiguous/mismatched receipts refuse publication. No queue/resource/progress mirror. Worker applied-key comment and reference wording now honestly describe both crash windows.

Two named tests RED EXIT 1 before implementation, GREEN EXIT 0; both have semantic production AssertionError mutants with byte-identical restored PASS. Scoped check/lint/fmt, quality/architecture, new command entrypoint docs and audit EXIT 0. Worker regression EXIT 0: 50 passed, 0 failed. The new CLI subpath map is included; final full runtime pending S14. Required service dependency adds one workspace lock line, no version/peer churn.

Full eighteen-entrypoint worker doc-lint returns EXIT 1 for nine combined PREEXISTING private-type references, with per-entrypoint legacy references also retained. A baseline run independently returns EXIT 1 for the identical nine combined findings; all four diagnostic files are byte-identical, and commands.ts is independently EXIT 0. See worker-doc-baseline.json. This is recorded as existing debt, not a green full-map verdict or newly authorized debt. No unrelated repair of legacy contract/stream/builder graphs is folded into C5.

Content review confirms strict unknown receipt checking before normalization and one trigger invocation. Registration copies prevent caller mutation, propagation selects only W3C fields, cancellation crosses before/after acceptance. Supplied clients must implement their actual documented durable acceptance boundary; bare native status is explicitly refused. Reconcile: native PostgreSQL CI passed both S11 and S12 heads; issue comments unchanged. S13b saga checked publisher next.
