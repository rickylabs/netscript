# Context Pack: background-reference startup preflight documentation

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-background-reference-preflight--1770` |
| Branch | `docs/background-reference-preflight` |
| Current phase | `repair / awaiting fresh formal IMPL-EVAL` |
| Archetype | `N/A — docs-only` |
| Scope overlays | `SCOPE-docs.md` |

## Current State

The supervisor-dispatched formal IMPL-EVAL at `d5ba40eb` returned `FAIL_FIX`. B1 found that the
documentation's universal claim omitted the generator's enclosing `Enabled !== false` guard; B2
found that the PR body treated an implementation-lane internal review as the formal verdict. The
bounded repair narrows the claim everywhere, retains the exact message templates, regenerates the
complete derived chain, and awaits a fresh supervisor-dispatched evaluation at the repaired head.

## Completed

- Issue #1770, source template, both placement candidates, generator scripts, and relevant harness
  workflow were read.
- Placement, exact template quoting, timing, both failure causes, and the generator chain were
  independently verified correct by the formal evaluator.
- The implementation-lane internal plan review found the placement/framing plan sound; the formal
  evaluator independently re-derived its load-bearing reasoning and agreed on the merits.
- Clean `origin/main` reproduced the known `docs:readme:check` exit 1 for
  `packages/bench/README.md` missing `## Install`.
- The `Enabled !== false` guard was verified directly around both preflight and registration.

## In Progress

- S3 conditionality/run-history repair, followed by S4 derived regeneration and S5 gate-evidence
  handoff.

## Next Steps

1. Land the repair and derived-only commits, run the full gate list, and record real exit codes.
2. Push once by explicit refspec and update PR #1772 without changing labels or readiness state.
3. Hand the repaired head to Tier-A and a fresh supervisor-dispatched formal IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Place under the existing `aspire start` boot footguns | `plan.md` D1 | Best point-of-failure retrieval path. |
| Treat source strings as templates | `plan.md` D2 | Avoids invented concrete variants. |
| Preserve source→derived provenance order | `plan.md` D5/D6 | Each derived commit records the immediately preceding prose/run-artifact commit. |
| Qualify preflight enforcement | generator `Enabled !== false` guard | Disabled processors skip both preflight and registration. |

## Files Changed

- `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md` — public claim narrowed; exact
  message templates unchanged.
- Run artifacts — formal failure history, conditionality drift, repair slices, and resumable state.
- Four generator-owned publication assets — pending regeneration from the S3 source commit.

## Gates

- Clean-main `docs:readme:check`: exit 1, pre-existing baseline red.
- Original S1 source gates: nine commands exit 0.
- Formal IMPL-EVAL at `d5ba40eb`: `FAIL_FIX` on B1/B2 despite all 13 technical gates reproducing
  green.
- Repaired-head gates: pending S3/S4.

## Open Questions

- Fresh formal IMPL-EVAL verdict is intentionally pending and owned by the supervisor.

## Drift and Debt

- Drift: conditional behavior was stated as universal; corrected and recorded in `drift.md`.
- Debt: none.

## Commits

- See PR #1772's commit list and per-slice comments.
