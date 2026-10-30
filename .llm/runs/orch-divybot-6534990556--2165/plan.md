# Plan & Design — READY FOR REVIEW

## Locked decisions

1. Use event id `scheduled_${triggerId}_${scheduledAt}` and identical event idempotencyKey, where scheduledAt is canonical scheduledTime.toISOString(). No actual firing time, attempt or process counter in identity. The fixed-width ISO timestamp makes the suffix unambiguous even for trigger ids containing separators.
2. Evaluate definition.deduplication.key(event) before resolveKey; when defined, copy the event with that idempotencyKey before claims, handler and action dispatch. Undefined leaves the event key intact. This honors custom keys across all existing idempotency port adapters without a public contract change. Precedence: definition callback, event key, request header, trigger-scoped payload hash. Errors from the callback propagate before claim. Explicit enqueueJob action keys retain highest dispatch priority.
3. Hash JSON.stringify([event.triggerId, event.payload]) as the existing SHA-256 fallback. Keep the sha256 prefix and payload-hash source, atomic active/completed protocol and TTL unchanged. Explicit caller/header keys keep their existing global scope.
4. Persisted integration exercises the real CronTriggerSchedulerAdapter through its injected primitive callback and the actual plugin createRuntimeTriggerProcessor enqueue path. Jobs use the real worker KV idempotency store and dispatcher. Only scheduler time and queue transport are deterministic seams. Deno KV is opened on disk, closed and reopened; Redis uses the suite URL and a randomized namespace and reconnects across runtime instances.

## Commit slices

0. Harness bootstrap: supervisor, research, plan, worklog, context-pack, drift and memory. Gate: independent PLAN-EVAL before production changes. Open draft PR immediately.
1. Scheduled identity fix plus regression proof: cron adapter + tests; KV runtime store + tests; trigger processor + tests; plugin scheduled-idempotency integration test; README; run evidence. Gates: targeted structured tests/check/lint/fmt, persisted Deno KV and real Redis proof, negative controls, quality:gate, scoped doc lint, JSR package audit and publish dry-run as available. Independent substantive review before sign-off.
2. If evaluator finds blockers, a bounded repair slice with relevant gates and same-session review; run record updated and pushed. Final IMPL-EVAL reviews exact pushed head, no subsequent commit.

## Acceptance and fault controls

- Restart scheduler/processor and workers stores on the same persisted backend; next slot of each of two triggers sharing one cron executes each job. Verify applied markers survive reconnect, not an empty store.
- Two triggers with identical scheduled and actual times both process, enqueue and execute.
- Re-deliver one trigger/slot with different actual time/attempt and through another scheduler instance: one execution, the other deduplicated.
- Custom callback keys deduplicate distinct envelopes and undefined callback falls through; identical payloads on different trigger ids claim independently; event/header precedence stays intact.
- Revert only relevant production fixes temporarily (restore immediately), keep tests unchanged, record test-name failures and exits for restart/same-time/duplicate-slot cases. A type error is not a valid negative control.

## Gates and risks

Structured wrappers own check/test/lint/format evidence. quality:gate includes dependency and architecture policy. Run scoped JSR audit, docs lint and package dry-run. Any pre-existing/unavailable gate is reported unproven, never ticked green. No local scaffold.runtime: no scaffold or production composition wiring changes; CI shared gate belongs to coordinator.

Risks: persistent legacy markers coexist until TTL but new identities do not reuse scheduled_N; custom callbacks can intentionally merge slots/triggers and are caller policy; Redis service may be unavailable (attempt isolated local service, report explicitly if unproven); stable event ids intentionally overwrite same-slot history. Do not broaden trigger retention or atomic claim semantics. Test resource cleanup is owned and bounded.

No unresolved decision forces later rework. Deferred: file-watch identity (#2187), scheduler primitive semantics, queue/worker runtime changes, release and readiness/merge, schema/lock changes. Contributor entry: packages/plugin-triggers-core/README.md, scheduled identity subsection. No new architectural debt planned.
