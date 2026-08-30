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
durable, assertion-level RED receipt. Descendant discovery/classification is implemented and its
focused suite is green. The explicit persistent-resource force gate is implemented and green.

## Completed

- Harness bootstrap, research, locked plan, and Design checkpoint.
- PLAN-EVAL recorded N/A because the ratified dispatch leaves no unresolved design choice.
- Synthetic S2-shaped PPID-1 fixture plus failing #1429 leak-check regression.
- Process discovery from bounded `ps`/`/proc` probes with DCP label, exact AppHost argv, and
  descriptor-to-Unix-socket evidence.
- Positive path ownership, foreign worktree reporting, and both Aspire MCP command guards.
- Dry-run `plannedCommands` plus force execution only after apply, explicit flag, positive AppHost
  ownership, scoped-stop success, and PID confirmation.

## In Progress

- Slice 3 commit/push and PR evidence comment.

## Next Steps

1. Commit/push slice 3 and post its evidence.
2. Implement DCP-helper post-stop confirmation.

## Key Decisions

| Decision                          | Source         | Notes                                          |
| --------------------------------- | -------------- | ---------------------------------------------- |
| PPID is visibility, not ownership | #1429          | Only path/registry proof authorizes mutation.  |
| No runtime lease in Phase A       | owner dispatch | All behavior uses fixtures and injected ports. |

## Files Changed

| Path                                                                 | Status  | Notes                                              |
| -------------------------------------------------------------------- | ------- | -------------------------------------------------- |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/`            | new     | Harness state and evidence.                        |
| `.llm/tools/agentic/teardown/{ports,probes,ownership,leak-check}.ts` | changed | Process discovery, evidence, ownership, reporting. |
| `.llm/tools/agentic/teardown/*_test.ts`                              | changed | Versioned/foreign/MCP/process safety regressions.  |
| `.llm/tools/agentic/teardown/teardown.ts`                            | changed | Explicit force-persistent plan and execution gate. |

## Gates

| Gate family | Current status | Evidence                                                 |
| ----------- | -------------- | -------------------------------------------------------- |
| Static      | NOT_RUN        | planned after implementation                             |
| Fitness     | NOT_RUN        | planned quality/architecture gates                       |
| Runtime     | Slice 3 PASS   | `receipts/03-force-persistent.json`: 36 passed, 0 failed |
| Consumer    | NOT_RUN        | assets barrel in slice 5                                 |

## Open Questions

- None for Phase A. Phase B waits for a runtime lease.

## Drift and Debt

- Drift: none.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
