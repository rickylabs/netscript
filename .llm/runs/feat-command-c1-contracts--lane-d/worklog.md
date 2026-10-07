# Worklog

## Phases

| Phase | Status | Evidence |
| --- | --- | --- |
| Bootstrap | complete | Skills, harness workflow, gate matrix, owner authority and baseline recorded |
| Research | complete for plan | research.md; complete live issue snapshots retained privately |
| Plan & Design | ready for independent evaluation | plan.md and Design below |
| Plan-Gate | pending | Separate-family evaluation required before product edits |
| Implement | not started | Hard stop pending PLAN-EVAL PASS |
| Gate | not started | No implementation verdict claimed |
| Evaluate | not started | Per-leaf IMPL-EVAL required |
| Release | N/A | No merge, publication or release authorized |
| Close | pending | Handoff after evaluation or chain completion |

## Design

Public surface: opt-in contracts/commands; service/commands, commands/testing and commands/relay; database/commands, commands/testing and commands/adapters/postgres; telemetry/attributes additions; core-owned worker/saga/stream integration adapters. Existing package roots retain their export budgets. Every new public entrypoint has module docs and consumer examples.

Domain vocabulary: RFC 0003 CommandJson, actor, envelope, opaque definition, codec, CommandFailure/CommandError, execution result, raw receipt/audit/outbox rows; relay claim/release and sink delivery; schema-bound worker-job/worker-task effects; atomic saga transition request and checked acceptance metadata. Finite values are named constants with derived unions.

Ports: true CommandStorePort<TTx> and bound CommandTransaction<TTx>; clock/id and bounded telemetry seams; raw CommandOutboxRelayStore plus decoded CommandOutboxSink; explicit atomic saga-transition commit capability. No database port imports service values. No root client or ambient transaction participates in side-record writes.

Lifecycle: command validation -> one callback -> one commit or rollback -> return; relay due -> leased -> published/retry/terminal, with compare-token settlement; stop prevents new claims and waits for in-flight work. Saga commands persist as part of a version-checked transition before relay publication. Clocks and identifiers are injected. AbortSignal crosses every async boundary.

Commit slices: the ordered S1-S20 table in plan.md is the authoritative list, grouped into six leaf PRs. Each slice has files and proving gates and remains under 30 files. Each product slice gets supervisor review plus independent final per-leaf IMPL-EVAL.

Deferred scope: other SQL adapters, SQLite command mode, CLI generators, generic command docs programme, queue reconciliation, product operation vocabulary, merge and release.

Contributor path: start with the focused public entrypoint and README, follow domain -> ports -> application -> adapter; add provider/sink behavior through the published conformance suite rather than editing a dispatcher by sink name.

## Commands and receipts

- Fresh clone of the requested public repository: exit 0.
- Read all six live issues and comments and closed prerequisites #1350/#1455: exit 0.
- MCP find_guidance(intent): succeeded; search_docs(query): succeeded. No specific command implementation guidance was returned; accepted RFC and focused source are authoritative.
- No product code, tests or mutation checks have been introduced yet.
