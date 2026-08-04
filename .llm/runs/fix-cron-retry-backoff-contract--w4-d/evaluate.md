# Evaluation handoff — cron retry/backoff contract

## Boundary

Per `milestone-run.md` and orchestrator ruling D6, this run does not launch a local formal
PLAN-EVAL or IMPL-EVAL and does not self-issue a formal PASS. Evaluation composes the PR's
draft→ready augment with the milestone orchestrator pre-merge gate.

## Candidate

- PR: `rickylabs/netscript#1226`
- Issue: `#1104`
- Archetype: 2 — Integration; docs overlay
- Decision: retain and implement the already-published retry contract
- Providers: memory and native `Deno.cron`

## Local gate evidence ready for augment

| Gate | Result |
| --- | --- |
| RED-first defect proof | expected exit 1; both providers produced only attempt `[0]` |
| Retry/provider matrix | PASS — 12/12 deterministic fake-time tests |
| Full cron suite | PASS — 22/22 |
| Scheduled-trigger consumer | PASS — attempt `2` forwarded unchanged |
| Scoped check/lint/fmt | PASS — 15 files, zero diagnostics/findings |
| `quality:gate` | PASS — exit 0 |
| `deno doc` + full export-map doc-lint | PASS — zero combined diagnostics |
| JSR audit | PASS with one known slow-types banner warning |
| Package publish dry-run | PASS — 11 files |
| Docs links + accuracy | PASS |
| Review-thread gate | PASS — zero threads |
| Commit-range hygiene | PASS — no lock/dependency change or source escape |

## Acceptance mapping

1. Implement was selected because stable types/docs and a scheduled-trigger consumer already rely on
   the contract; removal would be breaking.
2. One shared executor applies fixed, exponential, and linear policies with capping to both existing
   providers.
3. Attempts are zero-based and both unschedule and stop abort fake-time backoff without another call.
4. `maxRetries` is retries after attempt 0, default 0, for at most `maxRetries + 1` handler calls.
5. Fake-time tests cover success, exhaustion, formulas, cap, cancellation, and shutdown.
6. Terminal reporting is aggregate: one event and one `runCount` update per invocation; terminal
   attempt is exposed and the consumer mapping is tested.

## Reviewer focus

- Confirm aggregate event cardinality remains compatible.
- Confirm abort during delay cannot increment the attempt or call the handler again.
- Confirm the manual formulas exactly match `_shared.ts`.
- Confirm the factual issue correction from Deno KV to native `Deno.cron` is acceptable.
