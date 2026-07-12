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

PLAN-EVAL passed. All three slices are implemented and independently reviewed `PASS`. The exact scanner reports 0 findings / 0 allowances, all package gates are green, doc-lint improved to 13 combined private refs with runtime/registry at 0, and no lock churn exists.

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
- Slice 3 canonical runtime/fixture port typing implemented; all eight remaining casts removed.
- Slice 3 doc-lint regression caught by review, corrected below baseline, and rechecked PASS.
- Final scoped check/lint/fmt, package + KV tests, publish dry-run, doc lint, architecture, scanner, and lock gates recorded.

## In Progress

- Final IMPL-EVAL, commit, and force-push handoff.

## Next Steps

1. Commit Slice 3 sign-off.
2. Run separate-session IMPL-EVAL.
3. Commit evaluator artifact and force-push with lease; do not open a PR.

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
| `packages/plugin-workers-core/src/runtime/*` | changed | Canonical structural ports and direct composition. |
| `packages/plugin-workers-core/src/testing/*` | changed | Generic fixtures and direct memory-port wiring. |
| `packages/plugin-workers-core/src/domain/*`, `src/registry/*` | changed | Explicit schema-equivalent public contracts and permission alignment. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | green | scanner 0/0; check/lint/fmt PASS |
| Fitness | green/recorded | doc lint 13 (improved), arch check exit 0, publish PASS |
| Runtime | green | 25 package + 5 KV tests PASS |
| Consumer | green | published subpaths check and publish dry-run PASS |

## Open Questions

- None blocking PLAN-EVAL.

## Drift and Debt

- Drift: owner-directed no-PR trail and high-effort lane override.
- Debt: preserve existing `workers-contract-structural-server-export`; no new debt planned.

## Commits

- `ac532d94` records Slice 1. Slice 2 sign-off is next; owner prohibited a PR, so local artifact evidence replaces PR comments.
