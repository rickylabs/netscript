# Plan & Design — READY FOR REVIEW

Archetype 6 verification tooling; no new published framework API. Implement the
live proof as a reusable focused verifier under .llm/tools/e2e with pure comparison
regression tests, plus a run-local producer/cleanup script for a real generated
project. Keep existing MCP production code and scaffold templates unchanged.

Locked contract: selected projectRoot/service + known trace IDs produced by real
RPC requests; verifier obtains a default production MCP snapshot and native Aspire
CLI spans/traces, rejects missing/empty/disjoint sets, compares selected identities,
and exercises actual MCP status/performance envelopes with no endpoint override.
Wrong-project binding must yield an actionable error. Verify tool envelopes do not
contain discovered dashboard credentials, operational paths or config sentinels.
Report JSON includes safe identities/counts/verdicts only, never raw CLI responses.

S0: bootstrap/run records and early draft PR. PLAN-EVAL before implementation.
S1: verifier + focused tests + reproducible live producer, execute on an isolated
no-container generated AppHost, collect safe positive and intended negative proof,
clean up exactly the owned AppHost and prove foreign registrations unchanged.
Gates: structured check/lint/fmt on owned TS, focused comparator/telemetry tests,
real live comparison and binding/privacy controls, quality:gate if package source
is touched. JSR N/A unless a published surface changes.
S2: independent implementation review, evidence/lessons, push and ready PR, inspect
current CI/threads, final same-session exact-head review, then handoff to tracker.

Risks: OTLP ingestion delay (bounded event/condition-based acquisition with an
explicit deadline, no fake fallback); unrelated traces (known RPC trace parents
and inclusive window); two empty sources passing (nonempty identity assertions);
wrong AppHost (exact conventional project discovery); resource collision/cleanup
(--isolated, exact ownership paths, no broad stop). Runtime producer must select
real discovered endpoints; do not inject captured/fake telemetry into MCP.

Open decision: exact generated RPC route is resolved from the scaffold contract
before locking invocation details; it does not change the proof contract. No
acceptance moves or weaker substitutes. No local full runtime E2E; if existing
runtime suite wiring is changed, require isolated CI e2e verdict explicitly.
No new architecture debt planned. Deferred: dashboard UI, metrics histograms,
framework telemetry changes already merged in PR 2521, and other claimed cells.
