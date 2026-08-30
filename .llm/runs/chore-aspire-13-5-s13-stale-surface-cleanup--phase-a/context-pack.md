# Context Pack: S13 stale surface cleanup

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-aspire-13-5-s13-stale-surface-cleanup--phase-a` |
| Branch | `chore/aspire-13-5-s13-stale-surface-cleanup` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` plus MCP Archetype 2 seam |
| Scope overlays | `docs` |

## Current State

The ratified S13 contract is re-baselined at clean S10′ `a46ea16d`. Static host preflight is clean.
S1's phase-1 parity work is not an ancestor, so phase 2 will be implemented without switching the
default or CI wiring.

## Completed

- Required skills, harness workflow, contract, doctrine, and relevant predecessor handoffs read.
- Design checkpoint and owner-escalated PLAN-EVAL disposition recorded before implementation.
- Slice 1 RED tests written and reproduced with the structured wrapper (exit 1 on the missing
  Aspire-ps adapter and resolver port/source contract).

## In Progress

- First commit/push and stacked draft PR creation.

## Next Steps

1. Land and push RED tests; open the stacked draft PR.
2. Implement D-17 and cleanup slices.
3. Implement parity phase 2, run exact-head gates, and launch independent IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| D-17 chain | supervisor plan D-17 / drift D-60 | Ratified as written. |
| Phase-2 flip ordering | user dispatch | Wait for S1/S9/S11 on main. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | — |
| Fitness | pending | — |
| Runtime | N/A | Explicit static-only dispatch. |
| Consumer | pending | Template and generated-carrier tests. |

## Drift and Debt

- Drift: S1 phase-1 files absent from the S10 sibling stack; handled without changing the requested base.
- Debt: none planned.

## Commits

- See the draft PR commit list and per-slice comments.
