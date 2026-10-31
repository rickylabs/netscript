# Research

Baseline `7907293f3dad3aeb557923809ddcd3435adae151`; issue and all comments read. No matching open or merged PR exists. The issue has prose requirements rather than acceptance checkboxes; report each requirement explicitly.

- NetScript MCP `find_guidance` then `search_docs` consulted for worker retries, handler contributions and tune-worker-runtime.
- `processWorkerJob` awaits one `executeWorkerJob`, completes failure, then returns. Both the dispatcher catch and jobs listener catch currently swallow errors.
- `executeWorkerJob` selects the in-process pool or polyglot task executor. This is the shared job execution seam. Current `MultiRuntimeTaskExecutor` executes exactly one adapter call: passing maxRetries to it does not implement retries.
- Builder `.retry()` stores behavior in metadata.retry but hardcodes retryDelay in build. Generated registry hardcodes three retries and ignores handler.retry.
- Queue DLQ uses append/list/reprocess/depth with idempotent append. `KvDeadLetterStore` already implements this port, so jobs can reuse that implementation in the plugin composition root without adding a dependency to workers-core.
- `JobRunnerClock` already supplies now/schedule, and its Web Platform implementation owns disposable timers. Reuse it for backoff; do not invent a second clock.
- Real queue tests can use `KvPollingAdapter` with `DenoKvAdapter` over local Deno KV. Redis integration uses `NETSCRIPT_TEST_REDIS_URL`; detect availability and report truthfully.
- Worker health is synchronous, while DLQ depth is async. Expose an async worker health snapshot including store depth and include it in the background health route without listener-supervisor edits.
- JSR planned-surface audit: retain explicit types, existing export maps and JSDoc; no upstream re-exports or dependency changes needed. New retry contracts are workers-core domain/runtime exports; job DLQ contracts live with the plugin worker port because queue is already its dependency. Run doc-lint and package audit.
- Environment memory consulted. RTK is absent on PATH, so use focused raw commands and structured wrappers. No locks/caches are removed or reloaded.
