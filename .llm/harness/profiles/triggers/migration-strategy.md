# Triggers — Migration Strategy

> **Purpose.** Extend-before-replace plan for migrating from legacy `@netscript/triggers` to the new
> two-tier architecture.

## Current State (legacy)

- `packages/triggers/` — 16 files, ~3,653 LOC, 29 slow-types
- `plugins/triggers/` — legacy plugin structure
- Consumers import from `@netscript/triggers` (builder, registry, processor, dispatch)
- `@netscript/telemetry/instrumentation/triggers.ts` — trigger telemetry in wrong package
- `@netscript/config/src/domain/trigger-schema.ts` — trigger config in wrong package
- Trigger registry generation in `plugins/workers/scaffold.runtime.json`

## Target State

- `packages/plugin-triggers-core/` — Tier 1: DSL builders, ports, processor, telemetry, contracts,
  testing
- `plugins/triggers/` — Tier 2: HTTP ingress, file watcher runtime, scheduler adapter, CLI, Aspire,
  e2e
- Consumers import from `@netscript/plugin-triggers-core` (DSL) or `@netscript/plugin-triggers`
  (runtime)
- Telemetry in `plugin-triggers-core/telemetry/`
- Config in `plugin-triggers-core/config/`
- Registry generation in `plugins/triggers/scaffold.runtime.json`

## Migration Path

### Phase 1: Core Extraction (8a)

1. Create `packages/plugin-triggers-core/` from scratch (do NOT copy legacy).
2. Implement `defineWebhook`, `defineFileWatch`, `defineScheduledTrigger` builders.
3. Define all ports (`TriggerProcessorPort`, `TriggerIngressPort`, `TriggerSchedulerPort`,
   `TriggerDlqPort`, `TriggerIdempotencyPort`, `WebhookVerifierPort`).
4. Implement `TriggerProcessor` with T1 pipeline (ack-then-process, retry, dedup, DLQ, circuit
   breaker).
5. Implement telemetry spec (`trigger.ingress`, `trigger.detect`, `trigger.process`,
   `trigger.action.dispatch`, `trigger.dlq.enqueue`).
6. Implement testing adapters (`MemoryWebhookVerifier`, `MemoryTriggerEventStore`,
   `MemoryTriggerIdempotencyStore`).
7. Implement contracts/v1 oRPC contract.
8. Extract config schemas from `@netscript/config` into `plugin-triggers-core/config/`.
9. **Backward compat:** `@netscript/triggers` mod.ts re-exports from `plugin-triggers-core` during
   transition (deprecated).

### Phase 2: Plugin Rewrite (8b)

1. Rewrite `plugins/triggers/` with new plugin manifest (`definePlugin`).
2. Implement HTTP ingress service (`triggers-api`, port 8093).
3. Implement file-watcher runtime (wraps `@netscript/watchers`).
4. Implement `CronTriggerSchedulerAdapter` (wraps `@netscript/cron` via `TriggerSchedulerPort`).
5. Implement CLI (`ns-triggers add/list/test/fire/...`).
6. Implement Aspire resource contribution.
7. Move registry generation to `plugins/triggers/scaffold.runtime.json`.
8. Remove `triggers` entry from `plugins/workers/scaffold.runtime.json`.
9. Implement e2e gates.

### Phase 3: Consumer Migration (8c)

1. Update all consumer imports from `@netscript/triggers` to `@netscript/plugin-triggers-core`.
2. Update scaffold templates to use new DSL (`defineWebhook(handler, spec)` not
   `defineTrigger().watchFiles().build()`).
3. Delete `packages/triggers/` entirely.
4. Delete `@netscript/telemetry/instrumentation/triggers.ts`.
5. Delete `@netscript/config/src/domain/trigger-schema.ts`.
6. Verify no `getTriggerRegistry()` / `resetTriggerRegistry()` singleton calls remain.
7. Run full gate suite.

## Extend-Before-Replace Details

### Webhook Verifier

- **Extend:** Add `WebhookVerifierPort` with `HmacSha256WebhookVerifier` (new).
- **Replace:** Old inline HMAC code in webhook router → use port.

### Scheduler

- **Extend:** Add `TriggerSchedulerPort` with `CronTriggerSchedulerAdapter` wrapping
  `@netscript/cron` (new).
- **Replace:** Old cron-based scheduled trigger code → use port + adapter.

### Processor

- **Extend:** New `TriggerProcessor` in core with full T1 pipeline.
- **Replace:** Old `TriggerProcessor` in legacy package → swap in new one.

### Registry

- **Extend:** Walker emits registry into `triggers/` directory from new scaffold.
- **Replace:** Old `getTriggerRegistry()` singleton → generated registry + composition root.

## Risk Mitigation

| Risk                             | Mitigation                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Existing webhook endpoints break | Ingress router keeps same URL path `/api/v1/triggers/webhooks/:id`              |
| File watchers lose state         | File-watch spec keeps same `paths`, `patterns`, `stabilityThreshold` fields     |
| Scheduled triggers miss ticks    | `TriggerSchedulerPort` adapter reads existing schedule state from KV on boot    |
| E2E tests fail                   | Preserve `test-webhooks-e2e.ts` semantics; update imports only                  |
| Slow-types in core               | Use branded IDs, explicit types, no inferred Zod output types in public surface |

## Primitive Audit Cost (added by evaluator pass — resolves F-10)

Two pre-doctrine primitives are wired through Group F and must be audited against the Arch-3 gate
matrix as part of the rescope:

| Primitive             | Audit doc                            | Estimated slices of latent debt                       | Closing slice |
| --------------------- | ------------------------------------ | ----------------------------------------------------- | ------------- |
| `@netscript/cron`     | `08-netscript-cron-primitive.md`     | 0–1 (three LOW debts; resolved together in one slice) | F47           |
| `@netscript/watchers` | `09-netscript-watchers-primitive.md` | 0–1 (three LOW debts; resolved together in one slice) | F48           |

The audits are **non-blocking** for slices F1–F46 (they consume the primitives via ports, not by
upstream-type leakage). They become BLOCKING for the final publish slice F46 (so that JSR
`deno publish --dry-run` covers all three packages cleanly).

## Workers-schedule deprecation (added by evaluator pass — resolves F-14)

If `plugin-workers-core` (Group D) ships a `schedule?` field on `defineWorker(...)`, the rescope
adds slice **F49 (workers-schedule-axis-deprecation)** to:

1. Codemod existing usages to split into `defineWorker({...})` (no schedule) plus a sibling
   `defineScheduledTrigger(...).enqueueJob(...)` file.
2. Deprecate the schedule field in workers DSL for two minor versions.
3. Remove in v0.(N+2).

If workers v2 does not include a schedule field (confirm at run-loop entry), F49 is a no-op and
removed from the slice plan.

## Persistent cron upgrade path (deferred, beyond Group F)

When `denoland/deno#33965` merges and ships in a stable Deno release:

1. `@netscript/cron` adds `DenoPersistentCronAdapter` in
   `packages/cron/adapters/deno-persistent.adapter.ts`.
2. `@netscript/cron` adds `AbstractCronAdapter` (stub-only base, CLI pattern) because the second
   persistent implementer now exists.
3. `CronProvider` opens to admit `'deno-persistent'` as a canonical value.
4. Plugin-side `CronTriggerSchedulerAdapter` wires `persistent: true` to the new adapter; existing
   `persistent: false` callers are unaffected.

This is **not** a Group F slice; it is a deferred follow-up. The Group F contract (F-TRG-17) ensures
the public surface absorbs the change without breaking.
