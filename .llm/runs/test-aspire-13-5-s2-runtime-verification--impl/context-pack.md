# Context Pack: Aspire 13.5 S2 runtime verification

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `test-aspire-13-5-s2-runtime-verification--impl`   |
| Branch         | `test/aspire-13-5-s2-runtime-verification`         |
| Current phase  | `implement`                                        |
| Archetype      | N/A — runtime evidence only                        |
| Scope overlays | Docs (run artifacts) and runtime/Aspire validation |

## Current State

The required issue/research/skill/cleanup/harness inputs are read. The assigned worktree began clean
at `21d516224`; lease preflight found no running AppHosts or visible containers. Slice 1 generated
the owned PostgreSQL project, applied S1's exact train only there, restored Aspire 13.5.3, and
proved the generated AppHost compiles after normal generated-workspace dependency materialization.

## Completed

- Required reading and 13.4.6 baseline extraction.
- Exact branch/head and clean shared-host preflight.
- PLAN-EVAL N/A justification and external Fable IMPL-EVAL route recorded.
- Slice 1 scaffold/restore/module/compile receipts.

## In Progress

- Slice 1 commit/push and required draft PR opening.

## Next Steps

1. Run diff/lock hygiene checks and commit/push slice 1.
2. Open the required draft PR, apply labels/milestone, and post slice evidence.
3. Start the exact AppHost with `--isolated` and capture V1–V7.

## Key Decisions

| Decision             | Source               | Notes                                                                |
| -------------------- | -------------------- | -------------------------------------------------------------------- |
| No product code      | issue #1714          | Test/fixture edits only if a gate would otherwise lie; none planned. |
| Exact scoped cleanup | Aspire skill / lease | Never broad-stop or touch foreign resources.                         |

## Files Changed

| Path                                                        | Status | Notes                       |
| ----------------------------------------------------------- | ------ | --------------------------- |
| `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/` | new    | Harness state and receipts. |

## Gates

| Gate family     | Current status              | Evidence                          |
| --------------- | --------------------------- | --------------------------------- |
| Static          | bootstrap PASS              | worklog preflight                 |
| Fitness         | pending manual scope checks | plan/worklog                      |
| Runtime         | pending V1–V12              | receipts table                    |
| Runtime slice 1 | PASS                        | `receipts/01-scaffold-restore.md` |
| Consumer        | N/A                         | no product surface                |

## Open Questions

- None that block execution.

## Drift and Debt

- Drift: none at bootstrap.
- Debt: append V4 outcome to `aspire-otel-cli-discovery` after the live probe.

## Commits

- See the draft PR's commit list + per-slice PR comments after slice 1.
