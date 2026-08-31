# Context Pack: Aspire 13.5 S2 runtime verification

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `test-aspire-13-5-s2-runtime-verification--impl`   |
| Branch         | `test/aspire-13-5-s2-runtime-verification`         |
| Current phase  | `handoff`                                          |
| Archetype      | N/A — runtime evidence only                        |
| Scope overlays | Docs (run artifacts) and runtime/Aspire validation |

## Current State

The assigned worktree began clean at `21d516224`. Slice 1 generated the owned PostgreSQL project,
applied S1's exact train only there, restored Aspire 13.5.3, and proved the generated AppHost
compiles. Slice 2 completed two isolated starts, V1–V7 inspection, exact-path force cleanup, and
launcher-orphan cleanup. Slice 3 completed MCP, Toolkit Deno projection, doctor, deploy-help, and
bounded closed-issue regression probes. Slice 4 removed the only positively owned survivor, closed
the leak gate, completed the V1–V12 matrix, and appended the V4 debt outcome. The live evidence
includes real 13.5 divergences rather than repaired or suppressed outcomes.

## Completed

- Required reading and 13.4.6 baseline extraction.
- Exact branch/head and clean shared-host preflight.
- PLAN-EVAL N/A justification and external Fable IMPL-EVAL route recorded.
- Slice 1 scaffold/restore/module/compile receipts.
- Draft PR #1735 with commit-1 evidence trail.
- V1–V7 runtime, proxyless endpoint, telemetry, shape, force-stop, and orphan receipts.
- V8–V12 MCP/toolkit/doctor/deploy/regression receipts.
- Final owned teardown, clean leak report, completed matrix, and append-only debt outcome.

## In Progress

- Final slice scope/diff/link/lock validation, commit, push, and PR trail comment.

## Next Steps

1. Commit/push the final implementation evidence slice and post its PR trail comment.
2. Fable supervisor performs independent IMPL-EVAL.
3. Supervisor/coordinator decides issue acceptance mirroring and PR readiness; implementation agent
   does neither.

## Key Decisions

| Decision             | Source               | Notes                                                                |
| -------------------- | -------------------- | -------------------------------------------------------------------- |
| No product code      | issue #1714          | Test/fixture edits only if a gate would otherwise lie; none planned. |
| Exact scoped cleanup | Aspire skill / lease | Never broad-stop or touch foreign resources.                         |

## Files Changed

| Path                                                        | Status   | Notes                       |
| ----------------------------------------------------------- | -------- | --------------------------- |
| `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/` | new      | Harness state and receipts. |
| `.llm/harness/debt/arch-debt.md`                            | modified | Append-only V4 outcome.     |

## Gates

| Gate family     | Current status  | Evidence                           |
| --------------- | --------------- | ---------------------------------- |
| Static          | PASS            | final JSON/format/link/lock checks |
| Fitness         | RECORDED        | cleanup/scope receipt              |
| Runtime         | V1–V12 RECORDED | receipts table                     |
| Runtime slice 1 | PASS            | `receipts/01-scaffold-restore.md`  |
| Runtime slice 2 | RECORDED        | `receipts/02-runtime-lifecycle.md` |
| Runtime slice 3 | RECORDED        | `receipts/03-v8-mcp.md`            |
| Cleanup         | PASS            | `receipts/04-cleanup-and-scope.md` |
| Consumer        | N/A             | no product surface                 |

## Open Questions

- None that block execution.

## Drift and Debt

- Drift: V2 readiness/timing, V3 allocation reuse, V4 discovery, and V6 timing are recorded.
- Debt: V4 reproduced the detached OTEL failure and the open debt now includes the 13.5.3 outcome.

## Commits

- `71a14e3b98fe1dad5d9294fe53f45b706f6f11c2` — scaffold/restore proof.
- `0956b2d3d` — V1–V7 runtime lifecycle proof.
- `cef4ec83b` — V8–V12 MCP/CLI/regression proof.
- See draft PR #1735 for per-slice comments.
