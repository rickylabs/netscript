**PLAN-EVAL for issue #2144: FAIL_PLAN, with two blockers.** I worked read-only: I read the run artifacts and the plan-gate and checked the relevant code against baseline `7907293`. The plan says "Open decisions: none that force rework", but the two decisions below are still open and either one would force rework. Under the plan-gate rules, that means `FAIL_PLAN`.

### Blocker 1: Retry settings have no workable precedence rule or schema
Decision 2 says "Explicit group configuration retains precedence over handler defaults". The code can't currently tell an explicit setting from a default:
- `JobConfigZodSchema` (`packages/plugin-workers-core/src/config/job-config.ts:105,107`) fills in `maxRetries` 3 and `retryDelay` 1000 when they're missing. `resolveConfiguredJobPolicies` passes these parsed configs on, and `registry-compiler.ts` spreads them (`...policy`) into the generated definition. So any job listed in `defineWorkers` always carries 3/1000. A declared `handler.retry` would then be silently overridden, which is the defect the issue reports.
- The generated definition (`runtime-registry-generator.ts:466`, `registry-compiler.ts:175-176`) and the builder's `build()` (`job-builder.ts:322`) hard-code `retryDelay: 1000`. The plan says the old `maxRetries`/`retryDelay` fields and `metadata.retry` "remain honored", but not which wins when they disagree (for example `retryDelay` 1000 against `metadata.retry.delayMs`).
- `maxRetries: z.number()` accepts negative and fractional numbers. The plan also doesn't say how `handler.retry`, which is attached at runtime, gets validated. A value like `1e9` would pass, which leaves retry effectively unbounded.

**Fix needed:** write an explicit precedence order across group config, top-level job config, `handler.retry`, builder `metadata.retry` and the old fields, and generator defaults. It must say how "explicit" is detected, for example by reading the raw config before defaults are applied, or by removing the schema defaults and resolving them in one place. Also specify one canonical retry-policy schema: a non-negative integer `maxRetries` with a stated cap, finite non-negative `delayMs`, `maxDelayMs` ≥ `delayMs`, and a capped exponential calculation. Apply it during registry generation and registration, and test a group config that is present but leaves retry unset.

### Blocker 2: The plan doesn't say what the queue does with the message on shutdown, cancel or timeout
Decision 1 treats cancellation, shutdown and timeout the same way ("propagate without another attempt"), and decision 4 only says they create no DLQ record. Neither says whether the message is acknowledged or put back on the queue. That matters because:
- Today `drain()` aborts running jobs immediately (`worker.ts`). `processWorkerJob` catches the abort, records `cancelled` and returns normally, so the KV polling adapter acknowledges the message (`kv-polling.adapter.ts:684-693`). The message is dropped.
- With this plan, a job that has already failed once and is waiting to retry when shutdown starts would be acknowledged too: no replay and no DLQ entry. That breaks the plan's own "preserve at-least-once delivery".
- A user cancel (`worker.cancel`, `AbortError`) and a worker shutdown (`ShutdownError`) need opposite outcomes, so they can't be handled as one case.
- For timeout, it's unclear whether it counts as a terminal failure (job DLQ, then acknowledge) or is handed back to the queue. Handed back, it would be retried by the queue up to its own 3-retry limit and land in the queue's DLQ, not the job DLQ.

**Fix needed:** add an outcome table to the locked decisions, covering success, retries exhausted, timeout, user cancel, shutdown during an attempt, shutdown during the wait between retries, DLQ write failure, and unknown or disabled job. For each, state the execution-state status, the idempotency claim action, whether a DLQ record is written, and whether the message is acknowledged or requeued. Any path that requeues must release the claim first. Otherwise the redelivery hits the still-active claim (15-minute TTL), is skipped as a duplicate and acknowledged, and the message is lost. Add a real-KV test that shuts down during the retry wait and shows the message comes back, with the fix-reverted check failing as expected.

### Advisory (not blocking)
Retrying inside one delivery keeps the message in flight for roughly (maxRetries+1) × timeout plus the retry waits. That can exceed the KV polling adapter's 30 s visibility timeout and the 15-minute idempotency claim TTL. Add this to the risk register with a mitigation.

### Plan-gate checklist
| Check | Result |
|---|---|
| Research present and current | PASS |
| Decisions locked | **FAIL** (blockers 1 and 2) |
| Open-decision sweep | **FAIL**: says "none", but blockers 1 and 2 are open and force rework |
| Commit slices | PASS (3 ordered slices) |
| Risk register | PASS (should add the advisory) |
| Gate set selected | PASS |
| Deferred scope explicit | PASS |
| jsr-audit | PASS (planned public surface covered) |

The rest checks out: listener-supervisor is untouched, the job DLQ reuses the queue's existing DLQ shape with the KV store as default, and the owner's override, Refs-only PR, and no labels, lock churn or local `scaffold.runtime` are all recorded.

VERDICT: FAIL_PLAN
