# Worklog — #1229 one-shot trigger defer scheduler

## Design

- **Public surface:** `TriggerDeferSchedulerPort` and serializable defer record/handle types from
  core `ports`; KV adapter from `stores`; deterministic memory/test helpers from `testing`.
- **Domain vocabulary:** one-shot schedule id, `triggerId`, original `TriggerEvent`, `until`, and
  replay result. Existing `DeferAction` remains the handler-facing action contract.
- **Ports:** schedule, cancel, list/due replay. The replay callback is supplied by runtime
  composition and resolves a current `ProcessableTriggerDefinition`.
- **Constants:** KV namespace components and replay-id separator are private named constants.
- **Slices:** S0 plan lock; S1 RED proof; S2 core contract/adapter; S3 plugin composition; S4
  caveat/debt burn-down and gates.
- **Deferred:** multi-node leasing/exact-once, recurring scheduling, and admin UI.
- **Contributor path:** define handler action in core domain → persist via core scheduler adapter →
  compose replay against the generated definition registry in plugin runtime.

## Evidence

| Date | Slice | Evidence | Result |
| --- | --- | --- | --- |
| 2026-08-04 | S0 | Live #1229, source/debt/caveat re-baseline at `c384013662` | complete |
| 2026-08-04 | PLAN-EVAL | milestone-run D6 composed rule | COMPOSED; plan locked, same-run implementation authorized |
| 2026-08-04 | S1 RED | `deno test --allow-all --unstable-kv plugins/triggers/src/runtime/trigger-runtime-processor_test.ts` | exit 1; 2 passed, 1 failed: actual `dlq`, expected `deferred` |
| 2026-08-04 | S2 GREEN | Core defer scheduler test + full `plugin-triggers-core` package task | 2 focused durability tests green; full package green |
| 2026-08-04 | S2 static | scoped check/lint/fmt wrappers for `packages/plugin-triggers-core` | zero findings |

### S2 reconcile

- Live #1229 remains open; PR #1283 remains draft with exactly one `status:impl` label.
- No new review/evaluator comments changed the locked contract. S2 stays within the core-owned port
  and adapter boundary; plugin composition remains S3.
