# Context Pack: release cut regenerates agent-docs prose

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cut-regenerates-agent-docs-prose--w6` |
| Branch | `fix/cut-regenerates-agent-docs-prose` |
| Current phase | implement |
| Archetype | N/A — release tooling |
| Scope overlays | none |

## Current State

The harness bootstrap is on draft PR #1628. Independent tests now fail on the pre-fix generator
sequence and explicit prepared-output ownership. Production source is still unchanged.

## Completed

- Read required harness, release, tooling, PR, and RTK authorities.
- Re-baselined the defect and identified the existing partial failing test.
- Opened draft PR #1628 with requested labels and milestone 0.0.6.
- Captured two focused pre-fix reds without touching production source.

## In Progress

- Disposable pre-fix 0.0.7 dry-run proof, then implementation.

## Next Steps

1. Commit/push the discriminating test slice and comment on the draft PR.
2. Capture the real pre-fix 0.0.7 dry-run in a disposable copy.
3. Implement, validate, and repeat the disposable proof post-fix.

## Drift and Debt

- Drift: corpus paths were already staged transitively via `PUBLISH_ASSET_OUTPUTS`; explicit
  prepared-release ownership remains missing.
- Debt: none.

## Commits

- See the draft PR's commit list plus per-slice comments.
