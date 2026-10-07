# C2 worklog

## Design

Public surface: focused database commands raw port and rows; service commands executor and commands/testing memory store, fault and conformance helpers. Vocabulary follows RFC CommandStoreCapabilities/Transaction/Receipt/Audit/Outbox and existing CommandDefinition/Envelope/Failure/Codec; no alternative transaction vocabulary. Ports: true caller-derived business transaction, injected clock/id/telemetry; no ambient context. Constants: bounded failure enums, seven command seam names, provider/isolation vocabulary and limits. Ordered slices: S4 raw ports/fake, S5 executor/identity/buffer, S6 shared semantics/fault/determinism; each under thirty files including evidence. Deferred: real PostgreSQL C3, OTel adapter C4, relay C5, atomic saga producer #1932. Contributor path: focused public manifests then domain/ports/application/testing.

## Phases

| Phase | State |
| --- | --- |
| Bootstrap | Complete; owner authority/model/baseline recorded |
| Research | Complete; live acceptance/comments and RFC reviewed |
| Plan & Design | Locked inherited S4–S6 scope and design above |
| Plan-Gate | Whole-chain independent PASS inherited |
| Implement | S4 pending |
| Gate | Per-slice gates pending |
| Evaluate | Mandatory opposite-family C2 IMPL-EVAL pending |
| Release | No merge/publication authorized; PR handoff pending |
| Close | Acceptance/evidence and handoff pending |
