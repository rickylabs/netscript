# C4 worklog

## Design

Public surface: CommandSpanNames, CommandAttributes, start/result types and explicit command attribute builders via telemetry/attributes; createOtelCommandTelemetryPort via telemetry/commands. Telemetry-owned structural trace port consumes existing Tracer/Span/Context. Composition factory receives registered definition metadata; no dependency on service implementation, no connection at import. Existing SDK/API/context helpers are the external axis. No extra permissions beyond the configured exporter.
Finite vocabulary: RFC outcomes, idempotency states, isolation/provider IDs and nine failure kinds. Registry copies validated primitive name/version pairs. Lifecycle starts/finishes/ends each owned span once; failed observers do not replay operations or alter application error identity.
S10a contract plus RED vocabulary tests; S10b adapter/native relationship and lifecycle tests; S10c executor early rejection binding, docs/consumer/mutations; S10d pinned assets and qualification. Every file maps to these concepts. Deferred: relay business logic, metrics, global messaging/saga identifier deprecation, full-chain S20 runtime smoke. Contributor path: attributes -> adapter -> public consumer tests. No new debt.

| Phase | State |
| --- | --- |
| Bootstrap | Complete |
| Research | Complete; fresh main/issues/MCP |
| Plan & Design | Complete; S10 re-baselined |
| Plan-Gate | Reused independent PASS |
| Implement | Pending RED |
| Gate | Pending |
| Evaluate | Pending separate-family review |
| Release | Pending CI; never merge |
| Close | Pending evidence |
