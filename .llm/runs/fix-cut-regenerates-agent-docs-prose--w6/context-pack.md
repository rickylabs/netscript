# Context Pack: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Current phase | implementation complete; draft awaiting automatic evaluator |
| Archetype | N/A — release tooling |
| Scope overlays | none |

## Current State

Draft PR #1628 remains draft/status:impl. The first preparation-only fix is now known to be
insufficient: genuine rendering invalidates the stable publisher's exact-metadata inheritance
assumption. The owner explicitly ruled that both causal halves land together here.

## Completed

- Read required harness, release, tooling, PR, and RTK authorities.
- Re-baselined the defect and identified the existing partial failing test.
- Opened draft PR #1628 with requested labels and milestone 0.0.6.
- Captured two focused pre-fix reds without touching production source.
- Implemented dependency-ordered regeneration; explicit staging ownership is retracted because the
  corpus was already covered by `PUBLISH_ASSET_OUTPUTS`.
- Added corrected real-render differential and strict parent→HEAD acceptance/rejection tests.
- Implemented semantic freshness in preparation and stable-publish reproduction.
- Removed literal rebasing from production call sites and accepted render metadata variance only
  behind canonical identity plus semantic reproduction.
- Passed all owner gates, two freshness checks, the final disposable cut proof, and real
  stable-publisher inheritance over the disposable cut commit.
- Aligned the exact version replacement verifier with the canonical bump writer after the real-pair
  proof exposed a false substring match on unrelated lock version `0.0.52`.

## In Progress

- PR evidence handoff only; automatic IMPL-EVAL and draft→ready remain orchestrator-owned.

## Next Steps

1. Commit/push final evidence.
2. Update PR body and structured S6 comment.
3. Stop without flipping ready or dispatching an evaluator.

## Drift and Debt

- Drift: owner retracted explicit staging ownership and added the causal stable-publish inheritance
  scope after independent RCA.
- Debt: none.

## Commits

- See the draft PR's commit list plus per-slice comments.
