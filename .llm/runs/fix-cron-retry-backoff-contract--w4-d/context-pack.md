# Context Pack: cron retry/backoff contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cron-retry-backoff-contract--w4-d` |
| Branch | `fix/cron-retry-backoff-contract` |
| Current phase | `plan-eval (composed waiver) → implement` |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Current State

Research and design are locked. The retained public contract will be implemented in the shared cron
execution path for `MemoryCronAdapter` and native `DenoCronAdapter`. Listener/history semantics stay
aggregate. No implementation file has been changed yet.

## Completed

- Read live issue #1104 and its triage comment.
- Read required harness/PR/doctrine/Deno/JSR/tooling skills and A2 doctrine column.
- Traced published types, docs, both adapters, shared executor, and scheduled-trigger consumer.
- Ran baseline full export-map doc-lint, JSR audit, and package publish dry-run.
- Locked the implement decision and milestone PLAN-EVAL waiver.

## In Progress

- S0 bootstrap commit and draft PR creation.

## Next Steps

1. Commit S0 with explicit paths; push explicit refspec; open draft PR with `Closes #1104`.
2. Launch the attached complex implementation lane for S1 RED only.
3. Supervisor-review, commit, push, and comment S1; then steer the same thread to S2.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Retain and implement | `plan.md` D1 | Removing stable fields is breaking and harms a live consumer. |
| Aggregate event semantics | `plan.md` D4 | One terminal event/runCount per invocation. |
| Existing adapter parity | `plan.md` D6 | “Deno KV” issue wording is corrected to native `Deno.cron`. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/*` | new | S0 harness artifacts only |
| `deno.lock` | foreign pre-existing | never stage or commit |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | worklog baseline doc-lint/publish dry-run |
| Fitness | baseline PASS with known warning | JSR audit; full gates pending S4 |
| Runtime | RED pending | S1 |
| Consumer | pending | S3 |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: Deno KV wording mismatch and milestone PLAN-EVAL composition recorded.
- Debt: no new/deepened entry expected; cron AP-17 debt is already closed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
