# Context Pack: executable HTTP readiness reports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1012-aspire-executable-health-probe--readiness` |
| Branch | `fix/1012-aspire-executable-health-probe` |
| Current phase | `plan` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Current State

The reported cause is reproduced against the clean `origin/main` baseline. Research and design are
locked; implementation is blocked on a separate-session PLAN-EVAL PASS.

## Completed

- Clean branch/baseline verification.
- Unpinned-app generator reproduction.
- Service and plugin `/health` evidence.
- Doctrine/archetype and JSR public-surface scan.
- Plan and Design checkpoint.

## In Progress

- Bootstrap commit, draft PR, and PLAN-EVAL handoff.

## Next Steps

1. Commit and push harness planning artifacts; open the draft PR.
2. Run separate open-model PLAN-EVAL.
3. On PASS only, launch the focused implementation slice.

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
| Fitness | pending | PLAN-EVAL hard stop |
| Runtime | pending | live feasibility not yet claimed |
| Consumer | pending | implementation tests not yet run |

## Open Questions

- Is a stable live AppHost dead-port fixture feasible without expanding this focused slice?

## Drift and Debt

- Drift: none.
- Debt: existing CLI/Aspire doctrine debt unchanged.

## Commits

- See the draft PR's commit list + per-slice PR comments.

