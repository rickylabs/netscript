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

The reported cause is reproduced against the clean `origin/main` baseline. The Opus supervisor's
PLAN-EVAL returned PASS with two conditions, both carried into the completed implementation.

## Completed

- Clean branch/baseline verification.
- Unpinned-app generator reproduction.
- Service and plugin `/health` evidence.
- Doctrine/archetype and JSR public-surface scan.
- Plan and Design checkpoint.
- Opus supervisor PLAN-EVAL PASS (`plan-eval.md`).
- Focused implementation and all scoped validation gates complete.

## In Progress

- Separate supervisor IMPL-EVAL.

## Next Steps

1. Commit and push the completed focused slice.
2. Update draft PR #1033 with acceptance and gate evidence.
3. Supervisor runs separate IMPL-EVAL and decides readiness.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Include scope 2 | code evidence | Both service families serve `/health`; mirror explicit opt-out. |
| Preserve non-app exclusions | issue scope + generator design | No probes for tauri/desktop/task. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| Aspire config, constants, generators, and focused tests | modified | Readiness probes for all generated HTTP executables with explicit opt-outs. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | reproduction PASS | `deno eval` output recorded in worklog/research |
| Fitness | PLAN-EVAL PASS; implementation gates PASS | `plan-eval.md`, `worklog.md` |
| Runtime | generator integration PASS; live AppHost NOT_RUN | no stable live dead-port fixture; no coverage claim |
| Consumer | PASS | generated helper semantic tests |

## Open Questions

- None for the implementation lane. The supervisor owns IMPL-EVAL and readiness.

## Drift and Debt

- Drift: the earlier false Qwen/OpenRouter evaluator attribution was corrected by owner instruction and recorded in `drift.md`.
- Debt: existing CLI/Aspire doctrine debt unchanged.

## Commits

- See the draft PR's commit list + per-slice PR comments.
