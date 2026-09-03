# Context Pack: plugin-ai-core exports heading

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-ai-core-exports-heading--1795` |
| Branch | `docs/plugin-ai-core-exports-heading` |
| Current phase | gate |
| Archetype | N/A — docs/tooling only |
| Scope overlays | docs |

## Current State

The scoped implementation and generator chain are complete. Export evidence selects `entrypoints-only` because five contract-subpath symbols are absent from the page tables. The Git-diff-based `check:assets-barrel` gate passed after committing the correct generated output; final-head reruns and delivery remain.

## Completed

- Harness bootstrap, doctrine/public-surface research, exact acceptance-text capture, symbol-set comparison, implementation, regeneration, and the initial gate pass.

## In Progress

- Committed-head integrity checks and delivery.

## Next Steps

1. Commit the complete slice and rerun the Git-diff-based generated gate at that head.
2. Run final status, lock, provenance, and diff checks; push.
3. Open the draft PR at `status:impl` and hand off separate-session IMPL-EVAL.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list and per-slice comment.
