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

## C1 prerequisite reconciliation

C1 owned downstream lock repair and its same-session PASS were propagated verbatim after this leaf started, using an ordinary fast-forward prerequisite commit. No merge or force push. C2 originally began at108b6930f455a2023e3abb7dbb2c91ab46380e6d; current predecessor review target isb4ee0c34399cad78ef75aaf3f71fd6d5ac38196a. All framework/product and C1-run trees now match that predecessor exactly; only this C2 planning run differs. GitHub three-dot history can show propagated prerequisite commits, so incremental product review uses the current predecessor tree and the explicit commit trail.
