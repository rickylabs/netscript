# Persisted scheduled trigger regression recipe

Test file: plugins/triggers/src/runtime/scheduled-idempotency_test.ts. It uses real CronTriggerSchedulerAdapter, createRuntimeTriggerProcessor, processWorkerJob, WorkerPool and KvWorkerIdempotencyStore; only callback time and queue delivery are explicit seams. Deno KV disk is closed/reopened; Redis reconnects within an isolated namespace. Applied worker markers are verified after reconnect before the next slot.

Run structured wrapper: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv --frozen plugins/triggers/src/runtime/scheduled-idempotency_test.ts`, with NETSCRIPT_TEST_REDIS_URL supplied privately to exercise Redis; otherwise those three cases explicitly skip.

Restart preconditions intentionally use distinct millisecond execution timestamps per trigger, so the old trigger payload hash admits both first-run events and the restart negative control reaches the old worker-key reuse defect. Separate same-instant coverage isolates the trigger collision. Original production code causes all six persistent acceptance cases to fail assertions, without type errors.

Temporary executable extraction cannot run from this environment's noexec temp mount; run-owned binaries may live in project runs. A foreground service must keep its execution session alive; children launched from a finished shell are reaped. Do not infer service health from a startup log alone.
