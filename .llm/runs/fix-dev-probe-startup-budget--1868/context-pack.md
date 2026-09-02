# Context Pack: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Current phase | implement — FAIL_FIX repair RED |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

OpenHands returned `FAIL_FIX` at `bdbaec12c`: hosted Vite colorizes `Local:` as `\x1b[1mLocal\x1b[22m:`, so the raw readiness scan never signals and run `33562257540` exhausts the startup budget. The earlier hosted-green claim is retracted; local runtime remains `NOT_RUN`.

## Next Steps

1. Commit/push the discriminating RED: exit 1, 4 passed / 1 failed; plain banner passes and ANSI banner fails.
2. Strip ANSI from decoded scan text and set child `NO_COLOR=1`.
3. Run the required whole-`packages/cli/e2e` structured check/test gates, commit, push, and record the implementation SHA.

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
