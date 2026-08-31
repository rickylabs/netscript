# Context Pack: AI exports reference adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-ai-exports-heading-and-skills--1809` |
| Branch | `docs/ai-exports-heading-and-skills` |
| Current phase | `gate` |
| Archetype | N/A — docs/tooling only |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Implementation and ordered generation are complete. Pre-commit validation is green except for the
expected diff-based asset-barrel verdict, which must be rerun after the generated barrel is committed.

## Completed

- Read the requested skills, harness workflow, docs overlay, and public-surface doctrine.
- Fetched issue #1809 and preserved its exact four Acceptance strings for later PR evidence.
- Audited all 13 `deno doc --json` entrypoint surfaces and compared symbols with the page.
- Implemented the scoped source changes and regenerated the three-layer derived corpus.

## Next Steps

1. Commit the complete slice.
2. Rerun every required gate and integrity check at that immutable head.
3. Push, open the draft PR at `status:impl`, and post the implementation phase comment.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| `entrypoints-only` | 13-module symbol diff | `/skills` and several other surfaces are not symbol-complete. |

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list and per-slice PR comment.
