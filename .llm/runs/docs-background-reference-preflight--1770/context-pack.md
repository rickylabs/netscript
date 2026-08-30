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
bounded repair narrows the claim everywhere, retains the exact message templates, and regenerates
the complete derived chain. All 13 author gates pass at repaired asset head `14d5aefd`; a
run-artifact-only evidence commit and one explicit-refspec push precede the fresh
supervisor-dispatched evaluation.

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

- S5 run-artifact-only gate-evidence handoff, PR-body correction, and one explicit-refspec push.

## Next Steps

1. Commit this final gate evidence without changing prose or generated assets.
2. Push once by explicit refspec and update PR #1772 without changing labels or readiness state.
3. Hand the new exact head to Tier-A and a fresh supervisor-dispatched formal IMPL-EVAL.

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
- Four generator-owned publication assets — regenerated in derived-only S4 `14d5aefd` from S3
  `e4f47289b`.

## Gates

- Clean-main `docs:readme:check`: exit 1, pre-existing baseline red.
- Original S1 source gates: nine commands exit 0.
- Formal IMPL-EVAL at `d5ba40eb`: `FAIL_FIX` on B1/B2 despite all 13 technical gates reproducing
  green.
- Repaired asset-head gates: all 13 requested commands exit 0 at `14d5aefd`; a final exact-head
  rerun follows the S5 evidence commit.

## Open Questions

- Fresh formal IMPL-EVAL verdict is intentionally pending and owned by the supervisor.

## Drift and Debt

- Drift: conditional behavior was stated as universal; corrected and recorded in `drift.md`.
- Debt: none.

## Commits

- S3 `e4f47289b7c1dd7d199f32130098c917e0b24bc3` — conditionality and run-history repair.
- S4 `14d5aefd9ad40f584e63eab905278be460be7b01` — four derived assets only.
- S5 — pending gate-evidence commit; see PR #1772 after push.
