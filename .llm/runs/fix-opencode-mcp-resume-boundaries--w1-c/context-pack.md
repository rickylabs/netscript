# Context Pack: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch | `fix/opencode-mcp-resume-boundaries` |
| Current phase | `plan-eval` |
| Archetype | N/A — internal agentic infrastructure |
| Scope overlays | none |

## Current State

The worktree is clean at the exact requested main baseline. Live issue contracts and exact pinned
OpenCode source were re-queried. Research, typed design, risk/gate plan, and stale-preparation drift
are recorded. No product source has been written. PLAN-EVAL is selected and is the hard stop.

## Completed

- Required skills/harness workflow and GitHub publishing workflow read.
- Live #1324/#1330 bodies and #1324 follow-up read.
- `origin/main`, branch/worktree ownership, OpenCode 1.17.20, route policy, GitHub auth, and lock hash
  verified.
- Prepared coordination artifacts recovered from commit `3e757c273` and re-baselined.
- Config overlay, preflight, history normalization, telemetry, test, and live-route contracts locked.

## In Progress

- S0 plan/design bootstrap commit, draft PR, issue lifecycle sync, and independent PLAN-EVAL.

## Next Steps

1. Commit/push S0 and open/configure the draft PR against `main`.
2. Post RESEARCH/PLAN phase comments and move PR/issues to `status:plan-eval`.
3. Run separate Minimax M3 high PLAN-EVAL through the checked-in local route.
4. On PASS only, implement typed contracts and S1/S2 in order.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Inline final overlay | plan D3 | preserves external provider/permission/credential config |
| Pre-dispatch plugin | plan D4–D6 | no destructive session storage rewrite |
| Loopback enumeration + direct lookup | plan D7 | separate available-tool and call counts |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-opencode-mcp-resume-boundaries--w1-c/` | new | harness activation and S0 plan/design artifacts |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending | Minimax PLAN-EVAL not yet dispatched |
| Static | not run | blocked by Plan-Gate |
| Runtime/live | not run | blocked by Plan-Gate |
| IMPL-EVAL | not run | post-implementation only |

## Open Questions

- None that force implementation rework; evaluator adversarial sweep pending.

## Drift and Debt

- Drift: prepared artifacts absent from baseline and stale branch/base/evaluator details; fully
  recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice comments after S0 is pushed.
