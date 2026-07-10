# Context Pack: native + OpenRouter provider profiles (#577)

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-epic-574-provider-profiles--pr-1` |
| Branch | `feat/epic-574-provider-profiles` |
| Current phase | `implement` |
| Archetype | 6 — CLI / Tooling, scoped internal-tool variant |
| Scope overlays | none |

## Current State

Coordinator Plan-Gate is approved. S1 implements profile routing, S2 child-only environment
injection, and S3 supported Claude/Codex profile mechanisms. S4 fail-closed canaries are next.

## Completed

- Confirmed HEAD `17a8d36a` descends integration `93eb4f02`.
- Confirmed merged controller/provider/Antigravity surfaces under `.llm/tools/agentic/runtime`.
- Recorded `research.md`, `plan.md`, and the `## Design` checkpoint.
- Locked four implementation slices after S0, with explicit #578–#582 boundaries and LOC budgets.
- S1 focused tests pass 30/0; scoped check/lint/fmt pass with 22 files and zero findings.
- S2 focused tests pass 10/0; scoped check/lint/fmt pass with 24 files and zero findings.
- S3 focused tests pass 19/0 plus compatibility wrappers 2/0; scoped check/lint/fmt pass with 26
  runtime files and zero findings.
- OpenRouter slugs verified 2026-07-10: `minimax/minimax-m3`, `z-ai/glm-5.2`,
  `x-ai/grok-4.5`.

## Next Steps

1. Commit, push, and comment S3.
2. Implement S4 read-only compatibility canaries and documentation.

## Key Decisions

- Reuse canonical route/controller contracts; no fork.
- Late-bind credentials only in child process adapter; values never enter plan/result/argv/artifact.
- Caller selects runner-qualified profiles; no global defaults or automatic fallback.
- Fan-out requires observed tool/reasoning/streaming compatibility.

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan | READY | `research.md`, `plan.md`, `worklog.md#Design` |
| S1 focused | PASS | 30 passed, 0 failed |
| S1 static wrappers | PASS | check/lint/fmt exit 0; zero findings |
| S2 focused | PASS | 10 passed, 0 failed |
| S2 static wrappers | PASS | check/lint/fmt exit 0; 24 files, zero findings |
| S3 focused | PASS | 19 passed, 0 failed; compatibility wrappers 2 passed |
| S3 static wrappers | PASS | check/lint/fmt exit 0; 26 files, zero findings |

## Open Questions

- None. Live model compatibility remains intentionally resolved by a fail-closed canary during S4.

## Drift and Debt

- Drift: stale origin fetch refspec recorded in `drift.md`; scoped fetch used without config change.
- Debt: none planned.

## Commits

- See draft PR #586 commit list and per-slice comments.
