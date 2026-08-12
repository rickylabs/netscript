# Context Pack: deterministic agent-docs corpus freshness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-docs-corpus-determinism--w5-b-corpus` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Current phase | `plan` |
| Archetype | N/A |
| Scope overlays | docs |

## Current State

Harness bootstrap, research, locked plan, and Design checkpoint are complete at the exact requested
baseline. PLAN-EVAL is N/A because the owner supplied a complete mechanical defect contract.

## Completed

- Loaded requested harness/tooling/release/PR/RTK skills and required workflow references.
- Verified clean worktree, branch, baseline, and origin.
- Re-derived the compressed-byte coupling and affected consumer/release surfaces.

## In Progress

- Slice 0 bootstrap commit, push, and draft PR creation.

## Next Steps

1. Open the draft PR and post research/plan phase evidence.
2. Dispatch the requested Codex Sol medium implementation slice.
3. Perform supervisor review, full gates, and automatic IMPL-EVAL handoff.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Canonical uncompressed SHA defines freshness. | owner brief / plan D1 | Transport bytes do not define corpus identity. |
| Preserve existing valid gzip for unchanged content. | owner release constraint / plan D2 | Keeps coordinated cut regeneration stable. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agent-docs-corpus-determinism--w5-b-corpus/*` | new | Harness activation artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | implementation not started |
| Fitness | N/A | tooling-only slice |
| Runtime | pending | focused CLI consumer tests planned |
| Consumer | pending | semantic corpus/runtime integrity tests planned |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
