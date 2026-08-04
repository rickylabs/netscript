# Context Pack: cron retry/backoff contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cron-retry-backoff-contract--w4-d` |
| Branch | `fix/cron-retry-backoff-contract` |
| Current phase | `implement — S2 supervisor-approved; S3 next` |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Current State

S2 turns the retained contract green through one internal retry executor shared by both existing
providers. Each adapter snapshots `maxRetries` and `backoff`; the executor applies zero-based
attempts, the three capped delay policies, abortable `@std/async` waits, and one aggregate terminal
event/history update per invocation. The provider-parity matrix uses fake time and captures
`Deno.cron`, so it registers no native cron work and uses no wall-clock sleeps.

## Completed

- Read live issue #1104 and its triage comment.
- Read required harness/PR/doctrine/Deno/JSR/tooling skills and A2 doctrine column.
- Traced published types, docs, both adapters, shared executor, and scheduled-trigger consumer.
- Ran baseline full export-map doc-lint, JSR audit, and package publish dry-run.
- Locked the implement decision and milestone PLAN-EVAL waiver.
- Added the S1 RED fake-time contract for memory and stubbed native Deno providers.
- Ran the focused test: raw exit `1`, `0 passed | 2 failed`; both assertions report actual `[0]`
  versus expected `[0, 1]`.
- Retained retry policy snapshots in memory and native Deno registrations.
- Added the internal shared retry/backoff/abort loop without adding a public export or clock.
- Expanded deterministic parity coverage to success, exhaustion, all delay policies, max capping,
  registration abort and shutdown, terminal attempts, listener cardinality, and aggregate `runCount`.
- Ran the supervisor-reviewed focused matrix (`12 passed | 0 failed`) and full cron suite
  (`22 passed | 0 failed`).
- Ran scoped check/lint/fmt and cron quality/doctrine gates successfully.

## In Progress

- S3 public documentation and consumer-contract evidence.

## Next Steps

1. Clarify exact retry, backoff, attempt, cancellation, and aggregate-event semantics in public JSDoc
   and the manual.
2. Prove the scheduled-trigger consumer still receives the cron attempt.
3. Run documentation/public-surface gates and prepare S4 merge-readiness evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Retain and implement | `plan.md` D1 | Removing stable fields is breaking and harms a live consumer. |
| Aggregate event semantics | `plan.md` D4 | One terminal event/runCount per invocation. |
| Existing adapter parity | `plan.md` D6 | “Deno KV” issue wording is corrected to native `Deno.cron`. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cron/adapters/_shared.ts` | updated | internal shared retry/backoff/abort execution |
| `packages/cron/adapters/memory.adapter.ts` | updated | retained schedule retry policy |
| `packages/cron/adapters/deno.adapter.ts` | updated | retained native schedule retry policy |
| `packages/cron/tests/retry-backoff_test.ts` | updated | deterministic twelve-case dual-provider matrix |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/worklog.md` | updated | exact RED exit/assertion evidence |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/context-pack.md` | updated | S1 supervisor handback |
| `.llm/runs/fix-cron-retry-backoff-contract--w4-d/codex-thread-ids.md` | generated | attached-thread identity and steering evidence |
| `deno.lock` | foreign pre-existing | never stage or commit |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | scoped check/lint/fmt plus baseline doc-lint/publish dry-run |
| Fitness | PASS with known documentation observations | scoped quality/doctrine; baseline JSR audit |
| Runtime | PASS | focused `12/12`; full cron suite `22/22` |
| Consumer | pending | S3 |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: Deno KV wording mismatch, milestone PLAN-EVAL composition, and resumed-turn effort mismatch
  recorded.
- Debt: no new/deepened entry expected; cron AP-17 debt is already closed.

## Commits

- See the draft PR's commit list + per-slice PR comments.
