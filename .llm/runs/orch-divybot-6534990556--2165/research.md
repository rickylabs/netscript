# Research

Baseline/main: `30c800958dbf512a4951d640f08748703a8b59e3`, verified against fetched main. #2165 and its owner correction were read live; no orchid-triage comment and no existing matching PR were found.

NetScript MCP `find_guidance(intent)` followed by `search_docs(query)` consulted first. Guidance confirms handler-first scheduled triggers emitting enqueueJob actions; custom runtime ports are explicit. `deno doc --filter TriggerIdempotencyKeyInput` confirms the existing input carries an event and optional headers.

- Cron adapter eventFor assigns process-local scheduled_N and has no idempotencyKey. RuntimeCronJobContext already supplies scheduledTime, actualTime, attempt.
- KvTriggerIdempotencyStore hashes only payload after caller/header fallbacks. Claims and completion are atomic and must remain so.
- TriggerProcessor passes event unchanged and reads only deduplication.ttlMs; deduplication.key exists as (event) => string | undefined.
- Plugin enqueueWorkerJob already prioritizes action.options.idempotencyKey, then event.idempotencyKey, then event.id; no production wiring change required.
- KvWorkerIdempotencyStore persists applied job keys for 24 hours. Worker dispatcher is available for an actual job execution proof.
- Real KV suite conventions use NETSCRIPT_TEST_REDIS_URL with randomized namespaces; DenoKvAdapter wraps Deno.openKv(path). Memory alone is insufficient acceptance evidence.

Archetype 3 runtime/behavior with integration-adapter concerns; no plugin composition redesign. Existing lifecycle, cancellation, atomic claims, retry and DLQ remain in scope for regression gates. Doctrine thesis, layering, runtime/state/failure, archetype gates and JSR audit guidance reviewed.

JSR planned surface audit: exports, imports and configuration remain unchanged; public types already encode event keys and callback. No new package/API dependency, no new slow-type exposure, no permission expansion. Existing package metadata and publish exclusions are retained; doc lint and package audit/dry-run will prove available static bars.
