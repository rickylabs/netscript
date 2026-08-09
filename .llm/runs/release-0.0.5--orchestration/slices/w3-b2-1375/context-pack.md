# Context Pack — W3-B2 #1375 MCP docs root and fallback

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.5--orchestration/slices/w3-b2-1375` |
| Branch | `fix/agent-mcp-docs-root` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current state

Research and the ordered plan are complete against live issue #1375 and baseline `aa8e151e6`.
Draft PR #1401 is open against `main`; its closing keyword is intentionally withheld until all
eleven rows have evidence. Separate Claude/Fable PLAN-EVAL passed in comment `5229304606`. F1-F4
are incorporated. No product source or test implementation has begun; S1 RED is next.

## Completed

- Required skills, harness workflow, A6 profile/doctrine, relevant debt, and JSR guidance read.
- Live #1375 and #1260 state fetched.
- Current CLI/MCP/generator/tests/docs inspected.
- Four implementation slices, gates, risk register, public contract, and RED proof locked.
- PLAN-EVAL PASS preserved in `plan-eval.md`; textual #1376 overlap and second-to-merge rule named.

## In progress

- Lifecycle transition to `status:impl`, then S1 behavioral RED.

## Next steps

1. Move issue #1375 and PR #1401 to `status:impl` with the implementation-start phase comment.
2. Implement S1 RED tests and record raw expected failures before product code.
3. Implement one slice at a time with push/comment/worklog reconciliation.

## Key decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Flag > env > probe > embedded | Live #1375 + plan LD-2 | Invalid explicit/env roots remain errors; empty probe degrades observably. |
| Minimal five-page generated fallback + README | Plan LD-5 | #1260 retains SDK-specific breadth. |
| All three host emitters wired | Plan LD-1 | Truthfully satisfies “every host config”. |
| Textual #1376 overlap | PLAN-EVAL F1 | Both edit `cli.ts`/README; second-to-merge rebases and regenerates assets. No `run-agent-mcp.ts` edit. |

## Files changed

Only this slice's run artifacts are new during planning.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| PLAN-EVAL | PASS | PR comment `5229304606`; local `plan-eval.md`. |
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
