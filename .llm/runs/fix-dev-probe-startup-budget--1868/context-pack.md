# Context Pack: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Current phase | implement — GREEN |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

RED `cd2337d36` is pushed and draft PR #1883 is open. GREEN separates the startup and HTTP budgets, preserves actual child-exit reporting, and passes all focused structured gates.

## Next Steps

1. Commit/push GREEN and record its SHA in the run artifacts and PR timeline.
2. Hand off for mandatory separate-session IMPL-EVAL; leave PR #1883 draft and do not merge.

## Key Decisions

Separate the 180 s startup/preflight phase from the 60 s HTTP phase, race real child exit in both, and mirror piped child output while detecting Vite startup.

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | new | RED regression |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev.ts` | changed | Named budgets, phase seam, output mirroring, prompt status races |
| `.llm/runs/fix-dev-probe-startup-budget--1868/` | changed | Harness state |

## Gates

Final focused structured check/test/lint/fmt all exit 0; test counts are 3 passed / 0 failed. Full `e2e:cli` prohibited; hosted CI owns Flow-B.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

See the draft PR's commit list and per-slice comments after the first commit.
