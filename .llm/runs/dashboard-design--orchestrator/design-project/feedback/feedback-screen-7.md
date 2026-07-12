# Feedback — S7 Workers Console

**Screen:** `S7 Workers` (lines ~693–807) · route `workers`
**Intent:** "is my job executing, how are retries going, and does the live scheduler match my
declared cron?"
**Verdict:** The scheduler-drift panel is the uniquely-NetScript payload — but its data story is
currently self-contradictory.

## Working
- Registry table (`reserve-inventory` cron, `nightly-reconcile` cron DISABLED via override,
  `send-receipt` task), live execution feed (RUNNING attempt 2/3, COMPLETED 412ms, FAILED
  exitCode 1), workflow step timeline, scheduler-vs-config drift panel, "trigger execution" action
  with CLI-equivalent `netscript workers run reserve-inventory`.

## Findings

### P1 `[DATA]` Disabled-by-override and "scheduler disagrees" are the same fact — connect them
The registry shows `nightly-reconcile` **DISABLED via runtime-config override** (muted), and the
drift panel flags `nightly-reconcile: config says scheduled, live scheduler disagrees` (failed).
These aren't two problems — the override **is** the reason the scheduler disagrees. As rendered it
reads as unexplained drift, which is incoherent. Fix: the drift row should say "scheduled in
config, disabled by runtime-config override → S3" and link there. That turns a scary red mystery
into a correct causal explanation — and demonstrates the dashboard's whole thesis (cross-seam
truth). This is the single most important realism fix on the screen.

### P1 `[DATA]` Render the job/task split with **polyglot runtime badges** — currently missing
The POC surfaces a distinction the prototype flattens: workers have two concepts — **job** =
compiled Deno unit, **task** = **polyglot** unit — carried on every execution as `concept`. Runtime
is resolved from the entrypoint extension: **Deno 🦕 · Python 🐍 · Shell 🐚 · PowerShell ⚡ · .NET**
(`POC-ground-truth.md` §3). The registry should show "reserve-inventory (Deno job)" next to
"nightly-reconcile (Python task)" with a runtime badge per row. No competitor console shows a
polyglot task runtime — this is a free differentiator the current single-"jobs" table throws away.
Also: the stat grid (jobs/tasks/running/completed/failed/successRate) is **derived from real
counts** in the POC, so keep those numbers self-consistent.

### P1 `[DX]` Show worker-pool liveness ("N polling"), not just past executions
Temporal's Task Queue view shows **workers currently polling** with a live count and an error if
none are. The classic worker bug is "my job never ran because nothing is consuming the queue" —
the execution feed can't show that (no executions looks the same as no workers). Add a
"reserve-inventory queue · 2 workers polling · heartbeat 1s ago" line. Uniquely answerable by
NetScript, invisible to Aspire's process view.

### P2 `[E2E]` The `job_4183` in the feed should be the same job the S6/S13 order run enqueued
If the flagship order journey enqueues `reserve-inventory`, the job id here must match S6/S13
(`job_4183`). Then "Open full run → S6" is continuous with the story.

## Best-in-class delta
Temporal is the reference for durable-execution worker health (polling count, error-if-none,
recently-active activities). S7 has the run history; add the **liveness** half. The
scheduler-vs-config drift comparison has *no* exemplar — it's a genuine NetScript invention — which
is exactly why it must be rendered coherently (P1) rather than as an unexplained failure.
