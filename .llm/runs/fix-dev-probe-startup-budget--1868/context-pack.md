# Context Pack: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Current phase | implement — RED |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Baseline `82a2527e2` is confirmed. The focused RED regression exited 1 with 0 passed / 3 failed; product code is unchanged.

## Next Steps

1. Commit the RED slice, push by explicit refspec, and immediately open the required draft PR.
2. Implement GREEN, run scoped wrappers, push/comment, and leave the PR draft.

## Key Decisions

Separate the 180 s startup/preflight phase from the 60 s HTTP phase, race real child exit in both, and mirror piped child output while detecting Vite startup.

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | new | RED regression |
| `.llm/runs/fix-dev-probe-startup-budget--1868/` | changed | Harness state |

## Gates

Focused structured test RED: exit 1, 0 passed / 3 failed. Full `e2e:cli` prohibited; hosted CI owns Flow-B.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

See the draft PR's commit list and per-slice comments after the first commit.
