# Context Pack: Aspire 13.5 teardown and leak-check

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-aspire-13-5-s7-teardown-leak-check--impl`  |
| Branch         | `fix/aspire-13-5-s7-teardown-leak-check`        |
| Current phase  | `implement`                                     |
| Archetype      | `6 - CLI / Tooling` (internal-tooling analogue) |
| Scope overlays | none                                            |

## Current State

Baseline is exactly S3 head `fe4f496bd`. Required issues, comments, S2 V6/V7 receipts, current
teardown code/tests, playbook, and harness/doctrine instructions have been read. Slice 1 has a
durable, assertion-level RED receipt.

## Completed

- Harness bootstrap, research, locked plan, and Design checkpoint.
- PLAN-EVAL recorded N/A because the ratified dispatch leaves no unresolved design choice.
- Synthetic S2-shaped PPID-1 fixture plus failing #1429 leak-check regression.

## In Progress

- Slice 1 commit/push and stacked draft PR creation.

## Next Steps

1. Commit/push slice 1, open the stacked draft PR, and post slice evidence.
2. Implement descendant classification in slice 2.

## Key Decisions

| Decision                          | Source         | Notes                                          |
| --------------------------------- | -------------- | ---------------------------------------------- |
| PPID is visibility, not ownership | #1429          | Only path/registry proof authorizes mutation.  |
| No runtime lease in Phase A       | owner dispatch | All behavior uses fixtures and injected ports. |

## Files Changed

| Path                                                      | Status | Notes                       |
| --------------------------------------------------------- | ------ | --------------------------- |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/` | new    | Harness state and evidence. |

## Gates

| Gate family | Current status | Evidence                                                  |
| ----------- | -------------- | --------------------------------------------------------- |
| Static      | NOT_RUN        | planned after implementation                              |
| Fitness     | NOT_RUN        | planned quality/architecture gates                        |
| Runtime     | RED captured   | `receipts/01-red-orphan-process.json`: 7 passed, 1 failed |
| Consumer    | NOT_RUN        | assets barrel in slice 5                                  |

## Open Questions

- None for Phase A. Phase B waits for a runtime lease.

## Drift and Debt

- Drift: none.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
