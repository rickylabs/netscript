# Context Pack: #1227 Quickstart Aspire restore retry

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1227-quickstart-restore-retry--impl` |
| Branch | `fix/1227-quickstart-restore-retry` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Research and design are locked. The centralized runner already honors retry policies; Quickstart
restore lacks policy wiring and PGDATA verification cascades when setup state is absent.

## Completed

- Skills/doctrine/harness activation, branch re-baseline, runner/runtime parity trace.
- `PLAN-EVAL: N/A` recorded for the owner-locked mechanical fix.

## In Progress

- Bootstrap commit, push, and draft PR creation.

## Next Steps

1. Add focused tests and capture RED evidence.
2. Implement retry policy and honest PGDATA skip.
3. Run focused GREEN plus all requested gates and explicit E2E quality coverage.
4. Commit/push/comment; leave PR draft.

## Drift and Debt

- Drift: carried diagnosis said `retry:` had zero consumers, but current main already has runner
  support and a runtime consumer.
- Debt: no new or deepened architecture debt planned.

## Commits

- See the draft PR commit list and per-slice comments.

