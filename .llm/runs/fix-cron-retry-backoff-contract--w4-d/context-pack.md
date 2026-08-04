# Context Pack: cron retry/backoff contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cron-retry-backoff-contract--w4-d` |
| Branch | `fix/cron-retry-backoff-contract` |
| Current phase | `implement — S1 RED ready for supervisor review` |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Current State

S1 now proves the retained public contract is dead on both existing providers. One deterministic
fake-time test configures one retry with a 25 ms fixed backoff; both `MemoryCronAdapter` and the
captured native `DenoCronAdapter` callback expose only attempt `[0]` instead of `[0, 1]`. No retry
implementation or documentation has changed. Listener/history semantics remain aggregate and are
reserved for S2.

## Completed

- Read live issue #1104 and its triage comment.
- Read required harness/PR/doctrine/Deno/JSR/tooling skills and A2 doctrine column.
- Traced published types, docs, both adapters, shared executor, and scheduled-trigger consumer.
- Ran baseline full export-map doc-lint, JSR audit, and package publish dry-run.
- Locked the implement decision and milestone PLAN-EVAL waiver.
- Added the S1 RED fake-time contract for memory and stubbed native Deno providers.
- Ran the focused test: raw exit `1`, `0 passed | 2 failed`; both assertions report actual `[0]`
  versus expected `[0, 1]`.

## In Progress

- Supervisor review/replay of the local S1 RED commit.

## Next Steps

1. Review the S1 test and exact expected-failure evidence without treating RED as a green gate.
2. Replay the local slice commit into the supervisor worktree, then create the supervisor-owned
   sign-off commit/push/comment trail.
3. Steer the same attached thread to S2 only after supervisor review.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Retain and implement | `plan.md` D1 | Removing stable fields is breaking and harms a live consumer. |
| Aggregate event semantics | `plan.md` D4 | One terminal event/runCount per invocation. |
| Existing adapter parity | `plan.md` D6 | “Deno KV” issue wording is corrected to native `Deno.cron`. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cron/tests/retry-backoff_test.ts` | new | S1 fake-time defect proof for both providers |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/worklog.md` | updated | exact RED exit/assertion evidence |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/context-pack.md` | updated | S1 supervisor handback |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/codex-thread-ids.md` | generated | attached-thread identity and steering evidence |
| `deno.lock` | foreign pre-existing | never stage or commit |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | worklog baseline doc-lint/publish dry-run |
| Fitness | baseline PASS with known warning | JSR audit; full gates pending S4 |
| Runtime | RED proven (expected exit 1) | focused dual-provider test; actual `[0]`, expected `[0, 1]` |
| Consumer | pending | S3 |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: Deno KV wording mismatch and milestone PLAN-EVAL composition recorded.
- Debt: no new/deepened entry expected; cron AP-17 debt is already closed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
