# Context Pack: OMB wave-0 proofs

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-openapi-mcp-wave0-proofs--wave0` |
| Branch | `test/openapi-mcp-wave0-proofs` |
| Current phase | research |
| Archetype | N/A — proof/measurement slice |
| Scope overlays | service |

## Current State

The clean proof branch is rebased exactly to current `origin/main`. Required issues and RFC sections
are read. Aspire 13.4 exposes a plausible TypeScript post-allocation callback, but no P1/P2/P3
experiment has run and no verdict is implied. The harness Plan-Gate remains closed.

## Completed

- Required skill / harness / doctrine / RFC / issue reading.
- Current-main re-baseline and shared-host inventory.
- Initial source and official Aspire API research.

## In Progress

- Locking the proof design, exact measurement methods, and gate set.

## Next Steps

1. Complete `research.md`, `plan.md`, and the `## Design` checkpoint.
2. Commit/push the plan state and obtain separate-session PLAN-EVAL `PASS`.
3. Launch one tracked implementation thread and serialize P1, P2, then P3.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No `packages/**` changes | User contract / doctrine boundary | Productization belongs to #1133 and later waves. |
| P1 is not pre-decided | RFC §9 / #1127 | Only measured verdict selects F1(a) or F1(b). |
| Foreign resources are immutable | Shared-host hazard | Exact-path targeting and ownership proof only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan-Gate | NOT_RUN | Plan/design still being completed. |
| Static | NOT_RUN | No implementation. |
| Runtime | NOT_RUN | No experiment started. |
| Resource hygiene | initial inventory only | Foreign resources listed; no mutation. |

## Open Questions

- P1, P2, and P3 measured outcomes remain open by design.

## Drift and Debt

- Drift: supervisor route override and stale overlay read paths recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
