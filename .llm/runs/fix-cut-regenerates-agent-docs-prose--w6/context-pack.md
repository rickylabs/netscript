# Context Pack: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Current phase | impl complete; awaiting orchestrator IMPL-EVAL |
| Archetype | N/A — release tooling |
| Scope overlays | none |

## Current State

Draft PR #1628 contains the harness/test trail. The production fix and full evidence are complete
locally: every required gate and the real disposable 0.0.7 rehearsal are green.

## Completed

- Read required harness, release, tooling, PR, and RTK authorities.
- Re-baselined the defect and identified the existing partial failing test.
- Opened draft PR #1628 with requested labels and milestone 0.0.6.
- Captured two focused pre-fix reds without touching production source.
- Implemented dependency-ordered regeneration and explicit deduplicated corpus staging ownership.
- Passed all owner gates, two freshness checks, and the disposable cut proof.

## In Progress

- Final implementation commit, push, PR evidence/body update, and handoff to the orchestrator.

## Next Steps

1. Commit/push the reviewed implementation and evidence.
2. Update PR body/checklist and post the S3 phase comment.
3. Confirm draft/labels/milestone/head and stop without flipping ready.

## Drift and Debt

- Drift: corpus paths were already staged transitively via `PUBLISH_ASSET_OUTPUTS`; explicit
  prepared-release ownership remains missing.
- Debt: none.

## Commits

- See the draft PR's commit list plus per-slice comments.
