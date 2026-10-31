# Research

Baseline a410a815ce1401d533b18f2a85eb75e266de94a5 (merged H01). Tracker #2474 status at 00:38 UTC: #2395 held, #2400 wave2 queued, #2144 active PR2481 owns job-dispatcher/job-execution. #2400 had no comments/worker or resolving PR before this leaf claimed it (comment6536634074).

NetScript MCP find_guidance then search_docs consulted for listener supervision/runtime tuning. Existing WorkerOptions exposed via /worker; deno doc inspected. WorkerListenerSupervisor has injectable now/sleep but uses now only for ChildHealthMonitor. restartCount is lifetime and maxRestarts default3. Supervisor is constructed separately for jobs in worker.ts and for tasks/triggers in queue-consumer.ts; all require the new option. ChildHealthMonitor already recovers crash-loop health after a clean60s and retains cumulative restarts. Preserve that shared contract. Background runtime's onStarted health callback exposes aggregate childHealth only, so a cause present solely in listeners would be invisible to the route.

Existing listener tests cover abort/backoff, crash-loop redaction and health recovery, not budget recovery. Worker.start stops permanently when the jobs listener fails. Queue adapters propagate genuine listener errors. RedisAdapter wraps errors with cause; a private ACL user can deterministically deny and restore BRPOPLPUSH without changing shared Redis configuration. Tests should also prove real local Deno KV refuses writes on a closed handle then recovers on a newly opened attempt. RealRedis tests use NETSCRIPT_TEST_REDIS_URL and isolated user/queue; no CONFIG/flush/global mutation.

JSR scan: /worker reexports WorkerOptions and inline WorkerHealthStatus. Additive healthy-window option, restartBudgetUsed and safe cause field (restartCount remains cumulative) require explicit docs/types, no inferred export or new dependency. Existing workers doctrine Refactor debt covers worker/jobs split and verification, unchanged by this bounded fix. Existing separate #1655 doc-lint debt must not be conflated with this fix. RTK and rg absent in this environment; direct commands/wrappers used. Git shim redirected the new worktree into a nested folder; native git worktree move corrected it before any edits.

## R3 rebaseline

PR2482 is OPEN, already ready, head dfa2502be, conflicts with current main f683946.
The owner identifies generated prose conflict following upstream docs E2 corrections.
Consulted all existing run memory before code/build work. Native MCP find_guidance
then search_docs consulted; bounded results do not cover restart budget precisely.
Canonical generator names and structured-wrapper recipes verified against deno.json.
No new package API or publish shape: prior JSR assessment and inherited debt apply.
