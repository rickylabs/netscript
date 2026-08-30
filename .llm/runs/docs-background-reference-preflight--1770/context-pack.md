# Context Pack: background-reference startup preflight documentation

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-background-reference-preflight--1770` |
| Branch | `docs/background-reference-preflight` |
| Current phase | `implement` |
| Archetype | `N/A — docs-only` |
| Scope overlays | `SCOPE-docs.md` |

## Current State

PLAN-EVAL passed in fresh native Fable session `017op5BRKMFMRHGH3TRdnBM3`. The S1 prose is
implemented on the selected local Aspire runbook; all nine S1 source checks passed, and the separate
Fable low slice review returned PASS. S1 is ready to commit.

## Completed

- Issue #1770, source template, both placement candidates, generator scripts, and relevant harness
  workflow were read.
- Placement and framing decisions are recorded in `plan.md`.
- PLAN-EVAL returned `PASS` before implementation.
- Clean `origin/main` reproduced the known `docs:readme:check` exit 1 for
  `packages/bench/README.md` missing `## Install`.

## In Progress

- S1 sign-off commit.

## Next Steps

1. Commit S1, regenerate the derived chain, run the remaining gates, and commit S2.
2. Obtain mandatory separate IMPL-EVAL, push by explicit refspec, and open the requested PR.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Place under the existing `aspire start` boot footguns | `plan.md` D1 | Best point-of-failure retrieval path. |
| Treat source strings as templates | `plan.md` D2 | Avoids invented concrete variants. |
| Preserve two-commit provenance order | `plan.md` D5 | S2 records S1 as `sourceCommit`. |

## Files Changed

- `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md` — S1 prose implemented.
- Run artifacts — research, plan, PLAN-EVAL, design, identity, drift, and resumable state.

## Gates

- Clean-main `docs:readme:check`: exit 1, pre-existing baseline red.
- S1 source gates: nine commands exit 0.
- Separate S1 slice review: PASS.

## Open Questions

- None pending evaluator review.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the PR commit list and per-slice comments once S1 is pushed.
