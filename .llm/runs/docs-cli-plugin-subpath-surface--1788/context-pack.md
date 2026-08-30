# Context Pack: CLI and plugin subpath reference surfaces

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-cli-plugin-subpath-surface--1788` |
| Branch | `docs/cli-plugin-subpath-surface` |
| Current phase | implement |
| Archetype | 6 — CLI/tooling described; plugin surface inspected |
| Scope overlays | docs |

## Current State

Both pages now account for their subpath symbols and pass source-format plus source-derived symbol
comparisons. The first generated commit is complete; final plugin-derived regeneration and full
gates remain. PLAN-EVAL is recorded N/A.

## Completed

- Required skills, workflow, docs overlay, doctrine public-surface guidance, issues, pages, export
  maps, source declaration locations, and generator chain read.
- CLI and plugin entrypoints enumerated with `deno doc --json`.
- CLI page corrected: 23/23 scaffolding and 29/29 testing symbols accounted.
- CLI assets regenerated from `495750d35` in an exactly-four-file generated commit.
- Plugin page corrected: 221/221 unique subpath symbols accounted; two stale non-export rows removed.

## In Progress

- Slice 3 prose/run-artifact sign-off commit, then Slice 4 final regeneration and gates.

## Next Steps

1. Commit plugin prose/run artifacts and regenerate the final four assets.
2. Run all requested gates and baseline comparison.
3. Push the explicit refspec and open the requested PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| One PR | `plan.md` D1 | Shared issue, derived chain, and gates; reviewable tabular diff. |
| Re-export notes | `plan.md` D2 | Entry point completeness without duplicate descriptions. |
| No self-dispatched evaluator | Owner brief | Supervisor owns Tier-A and IMPL-EVAL. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-cli-plugin-subpath-surface--1788/*` | new | Harness identity, research, plan, design, drift, and resumable state |
| `docs/site/reference/cli/index.md` | changed | Corrected claim, added one missing symbol and explicit re-export accounting |
| `docs/site/reference/plugin/index.md` | changed | Added missing/partial subpath surfaces, re-export accounting, and removed stale rows |
| Four derived docs assets | changed | First regeneration committed; final regeneration pending |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static docs | PASS (partial) | Both page source-format checks exit 0 |
| Fitness/source accuracy | PASS (partial) | CLI 23/23 + 29/29; plugin 221/221, zero stale rows |
| Runtime | N/A | Docs-only; Aspire/Docker prohibited |
| Consumer/generated | NOT_RUN | Pending regeneration |

## Open Questions

- None.

## Drift and Debt

- Drift: measured plugin coverage differs by entrypoint; two stale non-export rows removed; one-PR sizing decision recorded.
- Debt: none created or changed.

## Commits

- See the PR commit list and per-slice comments after push.
