# C4 worklog

## Design

Public surface: CommandSpanNames, CommandAttributes, start/result types and explicit command
attribute builders via telemetry/attributes; createOtelCommandTelemetryPort via telemetry/commands.
Telemetry-owned structural trace port consumes existing Tracer/Span/Context. Composition factory
receives registered definition metadata; no dependency on service implementation, no connection at
import. Existing SDK/API/context helpers are the external axis. No extra permissions beyond the
configured exporter. Finite vocabulary: RFC outcomes, idempotency states, isolation/provider IDs and
nine failure kinds. Registry copies validated primitive name/version pairs. Lifecycle
starts/finishes/ends each owned span once; failed observers do not replay operations or alter
application error identity. S10a contract plus RED vocabulary tests; S10b adapter/native
relationship and lifecycle tests; S10c executor early rejection binding, docs/consumer/mutations;
S10d pinned assets and qualification. Every file maps to these concepts. Deferred: relay business
logic, metrics, global messaging/saga identifier deprecation, full-chain S20 runtime smoke.
Contributor path: attributes -> adapter -> public consumer tests. No new debt.

| Phase         | State                           |
| ------------- | ------------------------------- |
| Bootstrap     | Complete                        |
| Research      | Complete; fresh main/issues/MCP |
| Plan & Design | Complete; S10 re-baselined      |
| Plan-Gate     | Reused independent PASS         |
| Implement     | Pending RED                     |
| Gate          | Pending                         |
| Evaluate      | Pending separate-family review  |
| Release       | Pending CI; never merge         |
| Close         | Pending evidence                |

## S10 implementation and substantive review

Vocabulary RED: two named assertions fail against behavior stubs; rejection test proves
invalid-input contract and its semantic guard mutant. Native adapter RED: all three
relationship/lifecycle tests fail against no-op adapter. Executor RED: early
missing-key/isolation/cancelled attempts have no spans before repair. Restored native tests pass.
Contract and adapter explicitly select finite attributes; copied registered metadata bounds
name/version pairs; no envelope or exception input enters tracer methods. Native SDK/context manager
proves request parenting, producer propagation and deferred links. Completion and exporter
exceptions preserve original errors and results; retained finishes ignored after end. Executor
validates genuine definitions, invokes identity once inside observed operation, preserves
transaction protocol and swallows completion observers after commit. Root reviewed these changes
against decision 9 and S10; no new doctrine debt. No queue/relay business implementation introduced.

298 scoped regression tests pass; root check, format, quality and architecture gates EXIT 0. Initial
lint findings repaired. Eleven semantic production mutants produce named AssertionError/nonzero
exits; every original is restored byte-for-byte with EXIT 0, recorded in mutations.json. Full export
graph for new commands entrypoint is explicit; isolated declarations are enabled by root compiler
configuration and native package publish dry-runs pass. Existing full telemetry documentation lint
reports seven diagnostics in unchanged oRPC/Hono/SDK adapters; do not claim those baseline
diagnostics passed. New commands/attributes entrypoints are separately qualified. Public baseline
and delta are recorded in drift.

- **Owner matrix override:** owner authorized `complex/implementation_evaluation` →
  `glm_5_3_flash@max` because HARNESS.md owner directive: independent GLM 5.3 Flash max; Google
  fallback only on unavailability. BRIEF-D4 limits unsuccessful review to three rounds.

## Native CI repair and round-2 scope

Independent round 1 passed product HEAD `f99c0f13a7c1ed988bcbfe188ff330703bd9b361`; preserved in
`evaluate-round-1.md`. Native CI found the existing telemetry export-coverage assertion missing the
new public commands rewrite entry, and documentation accuracy found missing export inventory tables.
Add the explicit map entry and sixteen symbol rows. No new tests: the existing semantic consumer
assertion provides RED. The CLI skill requires full one-pass scaffold.runtime after this consumer
change, now a C4 gate rather than a deferred S20-only qualification. Re-evaluate the changed product
in the same independent session before readiness.

## Round-2 qualification and current-main reconciliation

Round 2 FAIL_FIX is preserved: all C4 product, CLI/docs consumer repairs, mutation proofs and static
gates passed, but the local required runtime did not converge in its remote-container environment.
Native canonical one-pass qualification subsequently passed on product
`2b233701dedc822d74458dbd62f7312770d28636`: PostgreSQL 104 steps and SQLite 99 steps, both zero
failures; native static and desktop consumers also passed. Core functional CI passed, acceptance
closure pending independent completion. Local failures and owned cleanup remain recorded.

Fresh/SDK main `6645acbbd` introduced a shared corpus conflict before final review. Ordinary main
reconciliation preserves all C4 implementation/tests and main lock/dependency changes, then
regenerates all four consumers with Deno 2.9.5. Combined-tree qualification must precede the third
and final allowed independent review; previous native evidence is not mislabeled as execution on
this new head.
