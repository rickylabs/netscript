# Context Pack: homepage capability story

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1334-homepage-capability-story--leaf` |
| Branch | `docs/1334-homepage-capability-story` |
| Current phase | `plan` |
| Archetype | N/A — docs-only |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Slice 2.1 is prepared against `origin/main` at L1 merge `714a4ef9b`. The live issue and all required
workflow/domain skills are read. The plan locks the five-destination assertion, L1 content, existing
component system, canonical routes, no-nested-anchor rule, and six-combination browser matrix.

## Completed

- Confirmed both prerequisite merges and inspected L1 homepage/diagram hunks.
- Re-baselined live issue #1334 and recorded requested/observed identity.
- Selected docs overlay; PLAN-EVAL is N/A with rationale; separate IMPL-EVAL remains mandatory.

## In Progress

- Commit/push slice 2.1 and open the labeled, milestone-assigned draft PR with closing keyword and
  exact acceptance evidence.

## Next Steps

1. Commit and push slice 2.1; create draft PR and comment its evidence.
2. Implement capability grid and adjacent canonical task links.
3. Prove exports/snippets, rendered semantics, full docs gates, browser matrix, and locks.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Preserve L1 two-origin story | merge `714a4ef9b` | Do not edit its acceptance-critical regions. |
| Keep destination count 5/checker unchanged | F3/D12 | Capability section is independent. |
| Data card/collections/streams structure | F2/D13 | No inline anchor in linked card body. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-1334-homepage-capability-story--leaf/*` | new | Harness bootstrap artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | worklog |
| Docs | pending | slice 2.2 onward |
| Browser | pending | slice 2.5 |
| Lock hygiene | pending final proof | slice 2.5 |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
