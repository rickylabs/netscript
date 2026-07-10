# Context Pack: native + OpenRouter provider profiles (#577)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-provider-profiles--pr-1` |
| Branch | `feat/epic-574-provider-profiles` |
| Current phase | `plan-eval` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Current State

Pre-flight, controller research, external primary-doc verification, and the locked S0 Design are
complete. No implementation has begun. The coordinator must run the Plan-Gate before S1.

## Completed

- Confirmed HEAD `17a8d36a` descends integration `93eb4f02`.
- Confirmed merged controller/provider/Antigravity surfaces under `.llm/tools/agentic/runtime`.
- Recorded `research.md`, `plan.md`, and the `## Design` checkpoint.
- Locked four implementation slices after S0, with explicit #578–#582 boundaries and LOC budgets.

## Next Steps

1. Coordinator evaluates the plan and records approval or changes requested.
2. Only after explicit approval, resume this same Codex thread for S1.

## Key Decisions

- Reuse canonical route/controller contracts; no fork.
- Late-bind credentials only in child process adapter; values never enter plan/result/argv/artifact.
- Caller selects runner-qualified profiles; no global defaults or automatic fallback.
- Fan-out requires observed tool/reasoning/streaming compatibility.

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan | READY | `research.md`, `plan.md`, `worklog.md#Design` |
| Static/Fitness/Runtime/Consumer | NOT_RUN | prohibited until Plan-Gate |

## Open Questions

- None that force pre-implementation rework. Live model compatibility is intentionally resolved by
  a fail-closed canary during S4.

## Drift and Debt

- Drift: stale origin fetch refspec recorded in `drift.md`; scoped fetch used without config change.
- Debt: none planned.

## Commits

- See draft PR #586 commit list and per-slice comments.
