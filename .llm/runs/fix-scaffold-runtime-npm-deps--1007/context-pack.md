# Context Pack: scaffold runtime npm dependencies

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-runtime-npm-deps--1007` |
| Branch | `fix/scaffold-runtime-npm-deps` |
| Current phase | `implement` |
| Archetype | `6 - CLI kernel / scaffold generator` |
| Scope overlays | `frontend` |

## Current State

Issue #1007 is open. Production artifact evidence confirms Vite could not load a transitive Fresh npm module absent from the generated app import map. No implementation source has been changed.

## Completed

- Read required skills/doctrine/harness authorities.
- Reproduced published scaffold workflow and downloaded the failed production report.
- Recorded discrepancies and wrote the implementation plan.

## In Progress

- Bootstrap commit and draft PR, then implementation.

## Next Steps

1. Commit/push bootstrap plan and open draft PR.
2. Implement catalog and regression contract.
3. Run static, consumer, full runtime, IMPL-EVAL, and opposite-family review gates.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Existing Fresh runtime list is authoritative | `package-manifest_test.ts` | Do not invent a second subset. |
| Root catalog owns npm ranges | Deno toolchain policy | Scaffold mirrors and emits npm targets. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-scaffold-runtime-npm-deps--1007/*` | new | Harness activation and plan. |
| `deno.lock` | changed | Carried in-progress #1006 manifest resolution; validate before commit. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PLAN-EVAL passed | `plan-eval.md` |
| Fitness | pending | |
| Runtime | baseline failed | production run 30677734061 |
| Consumer | baseline failed cold / passed warm | drift log |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: reproduction command/prerequisite/cache differences recorded.
- Debt: none proposed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
