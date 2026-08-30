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

Baseline is exactly S3 head `fe4f496bd`. IMPL-EVAL cycle 1 at `473286671` returned `FAIL_FIX`
because the force call followed a completed normal stop and was therefore inert in the V6 no-AppHost
state. Slice 6 makes force the single stop variant for a stable, running, positively owned AppHost;
an already-gone AppHost emits action-required and exit 4. This session does not self-certify.

## Completed

- Harness bootstrap, research, locked plan, and Design checkpoint.
- PLAN-EVAL recorded N/A because the ratified dispatch leaves no unresolved design choice.
- Synthetic S2-shaped PPID-1 fixture plus failing #1429 leak-check regression.
- Process discovery from bounded `ps`/`/proc` probes with DCP label, exact AppHost argv, and
  descriptor-to-Unix-socket evidence.
- Positive path ownership, foreign worktree reporting, and both Aspire MCP command guards.
- Dry-run `plannedCommands` plus force execution only after apply, explicit flag, positive AppHost
  ownership, stable running-PID proof, and positive post-stop confirmation.
- Six 500 ms confirmation probes (2.5 s total) derived from S2 V6's 385 ms observation; associated
  helpers time out to escalation without a kill.
- Aged standalone orphans require an OK AppHost census, positive path ownership, and stable PID
  identity before one targeted TERM; young/ambiguous rows escalate.
- 13.5 lifecycle/safety playbook update and named Phase-B receipt procedure.
- Scoped wrappers, 40/40 tests, configured lint, assets, quality, and architecture gates all green.
- Slice 6 adds positive PID/helper/container confirmation, the already-gone force refusal, and a
  non-Aspire `ASPIRE_*` environment false-positive regression. The suite is green at 46/46.

## In Progress

- Slice 6 commit/push plus the missing slice-5 and new slice-6 PR evidence comments.

## Next Steps

1. Fable supervisor runs separate IMPL-EVAL cycle 2 at the slice-6 head.
2. A lease-backed session executes `phase-b-handoff.md` before close-gate evidence is posted.

## Key Decisions

| Decision                          | Source         | Notes                                          |
| --------------------------------- | -------------- | ---------------------------------------------- |
| PPID is visibility, not ownership | #1429          | Only path/registry proof authorizes mutation.  |
| No runtime lease in Phase A       | owner dispatch | All behavior uses fixtures and injected ports. |

## Files Changed

| Path                                                                        | Status  | Notes                                                               |
| --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/`                   | new     | Harness state and evidence.                                         |
| `.llm/tools/agentic/teardown/{ports,probes,ownership,leak-check}.ts`        | changed | Process discovery, evidence, ownership, reporting.                  |
| `.llm/tools/agentic/teardown/*_test.ts`                                     | changed | Versioned/foreign/MCP/process safety regressions.                   |
| `.llm/tools/agentic/teardown/teardown.ts`                                   | changed | Force gate, bounded helper confirmation, targeted orphan cleanup.   |
| `.llm/tools/CLEANUP-PLAYBOOK.md`                                            | changed | Aspire 13.5 relevance, ownership, force, and confirmation contract. |
| `.llm/runs/fix-aspire-13-5-s7-teardown-leak-check--impl/phase-b-handoff.md` | new     | Lease-only live receipt and closure procedure.                      |

## Gates

| Gate family | Current status | Evidence                                                  |
| ----------- | -------------- | --------------------------------------------------------- |
| Static      | PASS           | scoped check/lint/fmt plus configured lint receipts       |
| Fitness     | PASS           | `05-quality-scan.json`; `05-arch-check.json`              |
| Runtime     | PASS           | `05-teardown-tests.json`: 40 passed, 0 failed             |
| Consumer    | PASS           | `05-assets-barrel.json`; canonical generated corpus clean |
| Eval fix    | PASS           | `06-*` receipts; 46/46 tests; direct configured lint JSON |

## Open Questions

- None for slice 6. Phase B still waits for a runtime lease.

## Drift and Debt

- Drift: significant lifecycle-state correction recorded in `drift.md`.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
