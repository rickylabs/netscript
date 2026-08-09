# Context Pack — W3-B2 #1375 MCP docs root and fallback

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w3-b2-1375` |
| Branch | `fix/agent-mcp-docs-root` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current state

Research and the ordered plan are complete against live issue #1375 and baseline `aa8e151e6`.
All eleven acceptance rows fit one PR. No product source or test implementation has begun. The
mandatory fresh Claude/Fable PLAN-EVAL is the hard stop.

## Completed

- Required skills, harness workflow, A6 profile/doctrine, relevant debt, and JSR guidance read.
- Live #1375 and #1260 state fetched.
- Current CLI/MCP/generator/tests/docs inspected.
- Four implementation slices, gates, risk register, public contract, and RED proof locked.

## In progress

- Planning commit, draft PR, `status:plan-eval`, and orchestrator PLAN-EVAL handoff.

## Next steps

1. Wait for orchestrator-launched separate Claude/Fable PLAN-EVAL.
2. On `PASS`, implement S1 RED tests and record raw expected failures before product code.
3. Implement one slice at a time with push/comment/worklog reconciliation.

## Key decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Flag > env > probe > embedded | Live #1375 + plan LD-2 | Invalid explicit/env roots remain errors; empty probe degrades observably. |
| Minimal five-page generated fallback + README | Plan LD-5 | #1260 retains SDK-specific breadth. |
| All three host emitters wired | Plan LD-1 | Truthfully satisfies “every host config”. |
| No `run-agent-mcp.ts` edit | #1376 boundary | Avoids concurrent composition-root conflict. |

## Files changed

Only this slice's run artifacts are new during planning.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| PLAN-EVAL | REQUESTED / NOT_RUN | Orchestrator must launch fresh Claude/Fable session. |
| Static | NOT_RUN | Implementation has not begun. |
| Fitness | NOT_RUN | Implementation has not begun. |
| Runtime | NOT_RUN | Serialized token protocol applies after other gates. |
| Consumer | NOT_RUN | S1 real stdio proof planned. |

## Open questions

None. Any evaluator finding returns to plan before implementation.

## Drift and debt

- Drift: none.
- Debt: existing `cli/maintainer-mode-mixing`, `cli/no-permissions-doc`, and `MCP-A6-V2-SHAPE`
  preserved; no new debt planned.

## Commits

- See the draft PR commit list and per-slice comments.
