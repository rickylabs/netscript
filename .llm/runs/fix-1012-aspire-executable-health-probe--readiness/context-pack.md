# Context Pack: executable HTTP readiness reports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1012-aspire-executable-health-probe--readiness` |
| Branch | `fix/1012-aspire-executable-health-probe` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

The reported cause is reproduced against the clean `origin/main` baseline. Research and design are
locked, and separate-session PLAN-EVAL returned PASS. Implementation may begin.

## Completed

- Clean branch/baseline verification.
- Unpinned-app generator reproduction.
- Service and plugin `/health` evidence.
- Doctrine/archetype and JSR public-surface scan.
- Plan and Design checkpoint.
- Separate Qwen/OpenRouter PLAN-EVAL PASS (`plan-eval.md`).

## In Progress

- Focused implementation slice.

## Next Steps

1. Launch the focused implementation slice through the canonical agentic route.
2. Run the named slice gates and substantive opposite-family review.
3. Commit/push/comment the signed-off slice, then run separate IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Include scope 2 | code evidence | Both service families serve `/health`; mirror explicit opt-out. |
| Preserve non-app exclusions | issue scope + generator design | No probes for tauri/desktop/task. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1012-aspire-executable-health-probe--readiness/` | new | Harness bootstrap, research, plan, design, resumable state. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | reproduction PASS | `deno eval` output recorded in worklog/research |
| Fitness | PLAN-EVAL PASS; implementation gates pending | `plan-eval.md` |
| Runtime | pending | live feasibility not yet claimed |
| Consumer | pending | implementation tests not yet run |

## Open Questions

- Is a stable live AppHost dead-port fixture feasible without expanding this focused slice?

## Drift and Debt

- Drift: minor evaluator write-boundary overrun recorded in `drift.md`; accepted because edits were accurate run-state reconciliation only.
- Debt: existing CLI/Aspire doctrine debt unchanged.

## Commits

- See the draft PR's commit list + per-slice PR comments.
