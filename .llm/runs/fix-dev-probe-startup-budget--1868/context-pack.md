# Context Pack: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Current phase | implement — FAIL_FIX repair GREEN |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

OpenHands returned `FAIL_FIX` at `bdbaec12c`: hosted Vite colorizes `Local:` as `\x1b[1mLocal\x1b[22m:`, so the raw readiness scan never signals and run `33562257540` exhausts the startup budget. RED `b9b2e9f0a` discriminates ANSI failure from plain success. GREEN implementation head `72adf62f2` strips ANSI from scan text, sets `NO_COLOR=1`, and passes the whole E2E workspace check/test locally. The earlier hosted-green claim is retracted; local runtime remains `NOT_RUN`.

## Next Steps

1. Hand off implementation head `72adf62f2` to the supervisor for hosted CI and fresh-head evaluation.
2. Do not claim hosted green locally.

## Key Decisions

Separate the 180 s startup/preflight phase from the 60 s HTTP phase, race real child exit in both, and mirror piped child output while detecting Vite startup.

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | new | RED regression |
| `packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev.ts` | changed | Named budgets, phase seam, output mirroring, prompt status races |
| `.llm/runs/fix-dev-probe-startup-budget--1868/` | changed | Harness state |

## Gates

FAIL_FIX focused suite passes 5/5. Whole `packages/cli/e2e` structured check passes 188 files and structured test passes 276/276. Full local runtime remains `NOT_RUN`; hosted run `33562257540` failed at the pre-repair head and hosted CI owns the new-head verdict.

## Drift and Debt

- Drift: the original raw marker design was colorization-sensitive; recorded in `drift.md` and repaired within the ceiling.
- Debt: none.

## Commits

See the draft PR's commit list and per-slice comments after the first commit.
