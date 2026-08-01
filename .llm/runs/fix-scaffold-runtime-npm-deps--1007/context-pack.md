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

Issue #1007 and draft PR #1008 are open. The scaffold catalog now emits the runtime subset and a focused three-way drift contract passes.

## Completed

- Read required skills/doctrine/harness authorities.
- Reproduced published scaffold workflow and downloaded the failed production report.
- Recorded discrepancies and wrote the implementation plan.

## In Progress

- Scoped static gates, pristine consumer proof, and full runtime gate.

## Next Steps

1. Commit/push implementation slice.
2. Run static, consumer, full runtime, IMPL-EVAL, and opposite-family review gates.

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
| `packages/cli/src/kernel/constants/scaffold/*` | changed/new | Runtime imports and drift contract. |
| `packages/fresh/tests/*runtime-catalog*` | changed/new | Shared existing test dependency list. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PLAN-EVAL passed | `plan-eval.md` |
| Fitness | focused pass | 15 focused test steps passed |
| Runtime | baseline failed | production run 30677734061 |
| Consumer | baseline failed cold / passed warm | drift log |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: reproduction command/prerequisite/cache differences recorded.
- Debt: none proposed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
