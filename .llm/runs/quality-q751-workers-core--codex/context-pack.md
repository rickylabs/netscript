# Context Pack: `packages/plugin-workers-core` type-quality elimination

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q751-workers-core--codex` |
| Branch | `quality/q751-workers-core-h` |
| Current phase | `implement` |
| Archetype | `3 — Runtime / Behavior` |
| Scope overlays | `none` |

## Current State

PLAN-EVAL passed. Slice 1 is implemented and independently reviewed `PASS`: config, contract, and stream boundaries are properly typed, overall scanner count is 27 findings / 0 allowances, and no lock churn exists.

## Completed

- Skills/doctrine/harness references loaded.
- Public surface inspected with `deno doc` before focused source reads.
- Baseline scanner, publish dry-run, and doc-lint recorded.
- Three implementation slices locked.
- PLAN-EVAL PASS in separate Opus session.
- Slice 1 scanner/check/lint/fmt/tests/publish evidence green after one mechanical fmt remediation.
- Slice 1 independent substantive review PASS.

## In Progress

- Slice 2 immutable builder typestate implementation.

## Next Steps

1. Commit Slice 1 sign-off.
2. Implement/review Slices 2 and 3.
3. Run final full gate set and separate IMPL-EVAL.
4. Force-push with lease; do not open a PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Zero-allowance target | owner / plan D1 | Any survivor requires specific structural proof. |
| Preserve behavior/exports | plan D2–D6 | Boundary typing only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/quality-q751-workers-core--codex/*` | new | Harness plan/evidence only; no implementation files yet. |
| `packages/plugin-workers-core/src/config/*` | changed | Directly typed Zod outputs/default variance. |
| `packages/plugin-workers-core/src/contracts/v1/*` | changed | Direct schema assignment + Standard-Schema error narrowing. |
| `packages/plugin-workers-core/src/streams/*` | changed | Derived entities, upstream state schema, correlated producer wrapper. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Slice 1 green | scanner 27/0 overall; Slice 1 check/lint/fmt/publish PASS |
| Fitness | pending | plan |
| Runtime | pending | plan |
| Consumer | pending | plan |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: owner-directed no-PR trail and high-effort lane override.
- Debt: preserve existing `workers-contract-structural-server-export`; no new debt planned.

## Commits

- PLAN-EVAL preceded implementation. Slice 1 sign-off commit is next; owner prohibited a PR, so local artifact evidence replaces PR comments.
