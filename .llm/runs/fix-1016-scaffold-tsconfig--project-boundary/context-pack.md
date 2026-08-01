# Context Pack: scaffold TypeScript project boundaries (#1016)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1016-scaffold-tsconfig--project-boundary` |
| Branch | `fix/1016-scaffold-tsconfig` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Baseline and proposed contents have been empirically tested. No implementation source has been changed. The run is stopped at the mandatory PLAN-EVAL gate because the local OpenRouter evaluator credential is unavailable.

## Completed

- Loaded requested skills/doctrine/harness gates.
- Reproduced Prisma exit 1 and Vite SSR failure under an invalid parent `extends`.
- Prototyped root/app self-contained configs: Prisma passes, SSR returns HTTP 200, Deno check remains exit 0.
- Locked one implementation slice and its gate set.

## In Progress

- Separate-session PLAN-EVAL launch is blocked (`auth_required`).

## Next Steps

1. Obtain owner authorization for a permitted evaluator path, then obtain PLAN-EVAL `PASS`.
2. Implement the single scaffold boundary slice.
3. Run scoped gates, A/B, one-pass runtime gate, slice review, and IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Root `{ "files": [] }` | plan D1 | Minimal Deno-neutral boundary. |
| App bundler/Preact options plus `files: []` | plan D2 | Proven Vite/Fresh SSR boundary without editor overreach. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1016-scaffold-tsconfig--project-boundary/*` | new | Harness bootstrap/research/plan only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | planned | Commands locked in plan. |
| Fitness | planned | Archetype 6 + quality/JSR gates selected. |
| Runtime | baseline reproduced | Raw output summarized in worklog/research. |
| Consumer | prototype passed | DB/check/SSR proof in research. |

## Open Questions

- Choose between restoring the local OpenRouter credential or explicitly authorizing a cloud OpenHands Qwen evaluator fallback.

## Drift and Debt

- Drift: Vite failure is request-time SSR, not startup-time; local formal evaluator credential is absent.
- Debt: no new or deepened architecture debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
