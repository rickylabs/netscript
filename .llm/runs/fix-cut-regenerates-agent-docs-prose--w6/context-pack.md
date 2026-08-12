# Context Pack: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Current phase | implementation rescope |
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
- Passed all owner gates, two freshness checks, and the disposable cut proof.

## In Progress

- Correct staging tests, add post-writer semantic freshness, remove literal rebase call sites, and
  implement strict rebuilt-provenance inheritance with acceptance/rejection proofs.

## Next Steps

1. Capture corrected discriminating reds.
2. Implement and run focused/full gates plus disposable cut and inheritance proofs.
3. Commit/push each new slice, update PR body/evidence, and stop without flipping ready.

## Drift and Debt

- Drift: owner retracted explicit staging ownership and added the causal stable-publish inheritance
  scope after independent RCA.
- Debt: none.

## Commits

- See the draft PR's commit list plus per-slice comments.
