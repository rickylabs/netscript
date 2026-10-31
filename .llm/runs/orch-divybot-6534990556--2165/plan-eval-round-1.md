# PLAN-EVAL round 1

Requested and observed model: claude-opus-5-5; high effort; separate Anthropic session, stdin closed, read-only prompt.

I found one blocker, so the plan does not pass round 1.

**Blocker: the slot identity in Locked decision 1 is built on a field the real cron scheduler fills with the run's start time, not the planned slot time.**

- **What the code does:** in `packages/cron/adapters/_shared.ts`, `executeScheduledJob` captures `startedAt = new Date()` and passes it to `createJobContext`, which sets `scheduledTime` and `actualTime` to that same value. The scheduler's in-process timer path and `trigger()` both go through this function. So `RuntimeCronJobContext.scheduledTime` is the millisecond the run started, not a planned slot instant.
- **Retries never reach the scheduler:** `CronTriggerSchedulerAdapter#runHandler` catches every handler error and never rejects back to the scheduler. Its retry loop never runs, so `attempt` is always 0 in production.
- **What that breaks:** the assignment says a duplicate fire of one slot ("several processors, a retry") must deduplicate. With the planned key `scheduled_${triggerId}_${scheduledTime.toISOString()}`, two processors firing the same slot get keys that differ by milliseconds. Both runs execute, and nothing in the retry path is ever deduplicated. The plan's duplicate-slot test drives the time value through the injected test scheduler. That only shows the behaviour under a fake clock, so ticking that box would overclaim.
- **The run record repeats the assumption:** `research.md` treats `scheduledTime` as the planned slot, and `worklog.md` defines a slot as the "nominal scheduled ISO instant". The planned README section would carry the same wrong statement to contributors.
- **What still holds:** the restart fix and the "two triggers on the same cron" case are sound under the real scheduler. The key no longer depends on a per-process counter, and the trigger id goes into both the key and the payload-hash fallback.

**Repair needed before PLAN-EVAL round 2.** Choose one and record it in plan, research and drift:

- **(a)** Derive the planned slot in the adapter from the cron expression and timezone. For example, take the latest fire time at or before `scheduledTime`, using the existing next-fire-time logic in triggers-core. Then prove duplicate-slot deduplication through the real `@netscript/cron` memory adapter, with no fake clock.
- **(b)** Keep `scheduledTime` as it is, but downgrade the duplicate-slot claim to the cases that can really happen. The READY reply would then report "duplicate fire of one slot deduplicates (several processors / retry)" as not met, with the reason given above.

Either way, add at least one acceptance test that runs the real scheduler's `trigger()` / timer path, so the test seam can't hide this gap again.

Everything else is acceptable for round 1:
- The persisted proof plan: Deno KV on disk with close and reopen, real Redis when the suite has it, and the worker's persisted idempotency store with real job execution.
- The negative controls.
- Write-surface ownership, with the file-watch adapter untouched.
- Rules on how the PR is delivered: draft, `Refs` only, no closing keyword, labels or milestones.

VERDICT: FAIL_PLAN
