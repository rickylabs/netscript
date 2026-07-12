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

PLAN-EVAL passed. Slices 1 and 2 are implemented and independently reviewed `PASS`: schema/contract/stream boundaries and immutable builder typestate are properly typed, overall scanner count is 8 findings / 0 allowances, and no lock churn exists.

## Completed

- Skills/doctrine/harness references loaded.
- Public surface inspected with `deno doc` before focused source reads.
- Baseline scanner, publish dry-run, and doc-lint recorded.
- Three implementation slices locked.
- PLAN-EVAL PASS in separate Opus session.
- Slice 1 scanner/check/lint/fmt/tests/publish evidence green after one mechanical fmt remediation.
- Slice 1 independent substantive review PASS.
- Slice 2 immutable typestate and canonical domain outputs implemented; scoped check/fmt and 25 package tests pass.
- Slice 2 independent review's typestate defect was corrected and rechecked PASS.

## In Progress

- Slice 3 runtime composition and fixture port alignment.

## Next Steps

1. Commit Slice 2 sign-off.
2. Implement and review Slice 3.
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
| `packages/plugin-workers-core/src/builders/*` | changed | Immutable typestate and canonical domain aliases. |
| `packages/plugin-workers-core/src/public/root.ts` | changed | Structurally typed builder root surface without facade casts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Slices 1–2 green | scanner 8/0 overall; scoped check/fmt and package tests PASS |
| Fitness | pending | plan |
| Runtime | pending | plan |
| Consumer | pending | plan |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: owner-directed no-PR trail and high-effort lane override.
- Debt: preserve existing `workers-contract-structural-server-export`; no new debt planned.

## Commits

- `ac532d94` records Slice 1. Slice 2 sign-off is next; owner prohibited a PR, so local artifact evidence replaces PR comments.
