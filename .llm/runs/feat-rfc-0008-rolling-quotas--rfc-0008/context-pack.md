# Context Pack: RFC 0008 — Opt-in rolling quotas for protected service reads

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-rfc-0008-rolling-quotas--rfc-0008`         |
| Branch         | `feat/rfc-0008-rolling-quotas`                   |
| Current phase  | `implement`                                      |
| Archetype      | `4 - Public DSL / Builder`                       |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md`              |

## Current State

Plan and design checkpoint locked for accepted RFC 0008 (`rfcs/0008-rolling-service-quotas.md`).
Native sub-issues `#2675` (S1 — full rolling-quota implementation + non-`#2648` gates + docs) and
`#2676` (S2 — Gate 5b(a) Redis `MULTI`/`EXEC` command-error certification, blocked on `#2648`)
created under tracker `#2653` on milestone `0.0.10`. `PLAN-EVAL: N/A` recorded with rationale. Ready
to implement S1 on `feat/rfc-0008-rolling-quotas`.

## Completed

- Read skills, doctrine, accepted RFC 0008, `@netscript/service/rate-limit` source/tests, and CI workflows.
- Verified zero open PR overlaps on `packages/service/**` and service docs.
- Created sub-issues `#2675` (S1) and `#2676` (S2) under `#2653`, assigned milestone `0.0.10`, and moved `#2653` to `status:impl`.
- Scaffolded run artifacts under `.llm/runs/feat-rfc-0008-rolling-quotas--rfc-0008/`.

## In Progress

- Slice S1 implementation (`packages/service/src/rate-limit/**`).

## Next Steps

1. Implement core GCRA domain, port, memory/KV stores, middleware startup validation + `Retry-After`, and exports.
2. Add comprehensive RFC 0008 verification tests (Gates 1–4, 5a, 5b(b)–(c), 6a–6b, 7–8, 9a–9b, 10).
3. Update `packages/service/README.md`, `docs/site/reference/service/index.md`, `docs/site/services-sdk/how-to/protect-an-anonymous-route.md`, and refresh generated corpora.
4. Run full local validation gates, open PR for `#2675`, run separate-session Claude Fable 5.2 IMPL-EVAL, verify CI + close-gate + review-threads, merge, and report to coordinator.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| `PLAN-EVAL: N/A` | `run-loop.md` §4 / RFC 0008 PR #2656 | Accepted RFC already passed DESIGN-EVAL + Fable 5.2 PLAN-EVAL APPROVED. |
| Split `#2653` into `#2675` (S1) + `#2676` (S2) | RFC 0008 Gate 5b & Non-goals | Prerequisite `#2648` is open; S1 delivers all non-`#2648` scope and keeps `#2653` open. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/feat-rfc-0008-rolling-quotas--rfc-0008/*` | new | Run artifacts (supervisor, research, plan, worklog, context-pack, drift) |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | pending        | — |
| Fitness     | pending        | — |
| Runtime     | pending        | — |
| Consumer    | pending        | — |

## Open Questions

- None.

## Drift and Debt

- Drift: minor — owner model/evaluator override and T3 dispatch recorded in `supervisor.md` and `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
