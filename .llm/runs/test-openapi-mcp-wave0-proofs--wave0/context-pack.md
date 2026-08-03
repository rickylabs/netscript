# Context Pack: OMB wave-0 proofs

## Run Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Run ID         | `test-openapi-mcp-wave0-proofs--wave0` |
| Branch         | `test/openapi-mcp-wave0-proofs`        |
| Current phase  | implementation                         |
| Archetype      | N/A — proof/measurement slice          |
| Scope overlays | service                                |

## Current State

Research and Design are locked at D1–D12. Separate Qwen PLAN-EVAL passed. No P1/P2/P3 experiment or
verdict exists and no outcome is implied. Draft PR #1182 is open with the required labels/milestone
and no closing keywords. Implementation may begin only in the separate tracked Codex lane.

## Completed

- Required skills, issue bodies, epic, RFC §§4/9, doctrine, harness, source, and Aspire API reading.
- Current-main re-baseline and shared-host inventory.
- Harness bootstrap commit/push, draft PR #1182, and research phase comment.
- Locked plan, Design checkpoint, measurement schemas, commit slices, and gate set.
- Separate Qwen 3.7 Max/high `plan-eval.md` with `PASS`.

## In Progress

- S0 sign-off commit/push and draft-PR Plan/PLAN-EVAL reporting.

## Next Steps

1. Commit/push S0 and post the plan / plan-eval phase comments.
2. Launch one tracked Codex implementation thread from `implement.md`.
3. Serialize S1–S3 with Fable review and supervisor sign-off after each.

## Key Decisions

| Decision                               | Source                            | Notes                                            |
| -------------------------------------- | --------------------------------- | ------------------------------------------------ |
| No `packages/**` changes               | User contract / doctrine boundary | Productization belongs to #1133 and later waves. |
| P1 is not pre-decided                  | RFC §9 / #1127                    | Only measured evidence selects F1(a) or F1(b).   |
| Two owned scaffolds run serially       | #1128 / shared-host hazard        | SQLite P1/P2 first, no-DB P2 second.             |
| Incomplete/skipped is FAIL             | RFC §4 / user contract            | Never represent a missing proof as pass.         |
| Formal evaluation stays Qwen/open-only | Harness lane policy               | No closed-model or supervisor fallback.          |

## Files Changed

| Path                                              | Status       | Notes                                                   |
| ------------------------------------------------- | ------------ | ------------------------------------------------------- |
| `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/` | modified/new | Harness research, plan/design, prompts, and drift only. |

## Gates

| Gate family      | Current status          | Evidence                                 |
| ---------------- | ----------------------- | ---------------------------------------- |
| Plan-Gate        | PASS                    | Separate Qwen verdict in `plan-eval.md`. |
| Static           | NOT_RUN                 | No implementation.                       |
| Runtime          | NOT_RUN                 | No experiment started.                   |
| Resource hygiene | baseline inventory only | Foreign resources listed; no mutation.   |

## Open Questions

- P1/P2/P3 measured values remain open by design; their decision rules are locked.
- Evaluator credential availability is resolved: the parser-backed live canary passed with tools,
  reasoning, and streaming supported.

## Drift and Debt

- Drift: supervisor route override, stale overlay read paths, and resolved first-canary credential
  inheritance recorded in `drift.md`.
- Debt: none.

## Commits

- `b0be3673e57cfcd70388f5dffb2080799017356a` — harness bootstrap / draft-PR seed.
- See the draft PR's commit list + per-slice PR comments for subsequent sign-off commits.
