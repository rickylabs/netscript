# Triggers — Fitness Gates

> **Source.** `archetype-gate-matrix.md` + `architecture.md` + Group E evaluator findings. These
> gates validate the production-grade triggers architecture.
>
> **Scope.** Applies to `@netscript/plugin-triggers-core` (Arch-1/4 hybrid — contract +
> DSL/builder + runtime ports) and `@netscript/plugin-triggers` (Arch-5 — plugin package).

## F-TRG-1 — File-size lint

All `.ts` files under `src/` must be ≤350 LOC (doctrine F-1).

**Check:** `find packages/plugin-triggers-core/src -name '*.ts' | xargs wc -l | grep -v total`
**Check:** `find plugins/triggers/src -name '*.ts' | xargs wc -l | grep -v total`

## F-TRG-2 — Public surface audit

Root barrel exports ≤25 named symbols.

**Check:** Count `export {` and `export type {` in `packages/plugin-triggers-core/mod.ts`. Plugin
root barrel ≤15 named symbols.

## F-TRG-3 — No `get*Registry` / `set*Registry` / `reset*Registry` singletons

Trigger registry must be owned by the plugin scaffold, not by a runtime singleton.

**Check:**
`grep -RE "\b(get|set|reset)Trigger(Registry|Store|Ingress|Processor)\b" packages/plugin-triggers-core/src plugins/triggers/src`
**Expected:** 0 results.

## F-TRG-4 — Idempotency at event boundary

`TriggerEvent` carries `idempotencyKey?: string`. Processor deduplicates by
`event.idempotencyKey ?? hash(payload)` with 24h TTL.

**Check:** `grep -n "idempotencyKey" packages/plugin-triggers-core/src/**/*.ts` **Check:**
`grep -n "TriggerIdempotencyPort" packages/plugin-triggers-core/src/**/*.ts`

## F-TRG-5 — Concurrency key semaphore

`TriggerProcessor` limits concurrent dispatches per `(triggerId, concurrencyKey)`.

**Check:** `grep -n "concurrency" packages/plugin-triggers-core/src/runtime/**/*.ts` **Expected:**
Private `#concurrency` map + `#withConcurrency` helper or equivalent.

## F-TRG-6 — @netscript/cron not imported by core

`plugin-triggers-core` must NOT import `@netscript/cron`. Scheduling primitive is consumed via
`TriggerSchedulerPort`, with adapter in Tier-2 plugin.

**Check:** `grep -R "from '@netscript/cron'" packages/plugin-triggers-core/src` **Expected:** 0
results.

## F-TRG-7 — Dual-adapter pattern for webhook verifier

`WebhookVerifierPort` has at least two adapters: `HmacSha256WebhookVerifier` (production) and
`MemoryWebhookVerifier` (testing).

**Check:** `grep -n "implements WebhookVerifierPort" packages/plugin-triggers-core/src/**/*.ts`

## F-TRG-8 — DLQ port declared

`TriggerDlqPort` exists in core ports, with `enqueue` / `list` / `replay` methods.

**Check:** `grep -n "TriggerDlqPort" packages/plugin-triggers-core/src/ports/**/*.ts`

## F-TRG-9 — Graceful shutdown on processor

`TriggerProcessor.stop()` drains in-flight dispatches before returning.

**Check:** `grep -n "stop" packages/plugin-triggers-core/src/runtime/trigger-processor.ts`

## F-TRG-10 — Telemetry span naming matches spec

Spans named `trigger.ingress`, `trigger.detect`, `trigger.process`, `trigger.action.dispatch`,
`trigger.dlq.enqueue`.

**Check:** `grep -n "trigger\." packages/plugin-triggers-core/src/telemetry/**/*.ts`

## F-TRG-11 — Registry ownership in plugin scaffold

`plugins/triggers/scaffold.runtime.json` owns `"dir": "triggers"` entry. No `triggers` entry in
`plugins/workers/scaffold.runtime.json`.

**Check:**
`jq '.runtimeRegistries[] | select(.dir == "triggers")' plugins/triggers/scaffold.runtime.json`
**Check:**
`jq '.runtimeRegistries[] | select(.dir == "triggers")' plugins/workers/scaffold.runtime.json`
**Expected:** present in triggers, absent in workers.

## F-TRG-12 — Telemetry extraction closed

`packages/telemetry/src/instrumentation/triggers.ts` does NOT exist. Trigger telemetry lives in
`packages/plugin-triggers-core/telemetry/`.

**Check:** `test -f packages/telemetry/src/instrumentation/triggers.ts` **Expected:** file absent.

## F-TRG-13 — Config schema extraction closed

`packages/config/src/domain/trigger-schema.ts` does NOT exist. Trigger config schemas live in
`packages/plugin-triggers-core/config/`.

**Check:** `test -f packages/config/src/domain/trigger-schema.ts` **Expected:** file absent.

## F-TRG-14 — JSR publishability

`deno publish --dry-run --allow-dirty` passes for both packages with 0 slow-types.

**Check:** `cd packages/plugin-triggers-core && deno publish --dry-run --allow-dirty` **Check:**
`cd plugins/triggers && deno publish --dry-run --allow-dirty`

## F-PLG-1 — Cross-plugin edge check

Core does not import non-core plugin packages. Plugin imports framework + own core + sibling cores
only.

**Check:**
`grep -RE "from '@netscript/plugin-(sagas|workers|streams)'" packages/plugin-triggers-core/src`
**Expected:** Only `@netscript/plugin-workers-core`, `@netscript/plugin-streams-core`,
`@netscript/plugin-sagas-core` types (not runtime) allowed. **Check:**
`grep -RE "from '@netscript/plugin-" plugins/triggers/src | grep -v triggers` **Expected:**
workers-core, streams-core, sagas-core types only; no workers/sagas/streams plugin imports.

## F-TRG-15 — `@netscript/cron` primitive audit (Arch-3)

`@netscript/cron` passes the archetype-3 gate matrix; the three LOW-severity debts
(`cron-adapter-factory-shape-debt`, `cron-provider-closed-enum`, `cron-event-listener-typing` from
`08-netscript-cron-primitive.md` §5.1) are recorded in `arch-debt.md` and resolved at slice F47.

**Check:** `deno check packages/cron/mod.ts --unstable-kv` **Check:**
`cd packages/cron && deno publish --dry-run --allow-dirty` **Check:** no `Deno.Cron*` types appear
on the public surface of `packages/cron/mod.ts` (grep). **Expected:** 0 errors.
`08-netscript-cron-primitive.md` §5 verdict reproducible.

## F-TRG-16 — `@netscript/watchers` primitive audit (Arch-3)

`@netscript/watchers` passes the archetype-3 gate matrix; the three LOW-severity debts
(`watcher-eventkind-deno-alignment`, `watcher-strategy-closed-enum`, `watcher-strategy-class-public`
from `09-netscript-watchers-primitive.md` §5.1) are recorded in `arch-debt.md` and resolved at slice
F48. **Critical rule**: only `NativeStrategy` may import `Deno.watchFs`; no other consumer
(including `plugin-triggers-core`) may import it.

**Check:** `deno check packages/watchers/mod.ts --unstable-kv` **Check:**
`cd packages/watchers && deno publish --dry-run --allow-dirty` **Check:**
`grep -RE "from 'jsr:@netscript/watchers'" packages/plugin-triggers-core/src` returns 0 results.
**Check:**
`grep -E "Deno\.watchFs|Deno\.FsEvent|Deno\.FsWatcher" packages/watchers/*.ts packages/watchers/filters/`
returns 0 results (must be in `strategies/` only). **Expected:** 0 errors.

## F-TRG-17 — Persistent-cron forward-compat

`ScheduledTriggerSpec` carries a `persistent?: boolean` field. `TriggerSchedulerPort.list()` returns
metadata sufficient for the persistent variant (`{ id, schedule, persistent, nextFireAt }`). The
default (`persistent: false`) maps to the in-memory `DenoCronAdapter`; `true` is reserved for
`DenoPersistentCronAdapter` (lands when `denoland/deno#33965` merges). Until the upstream PR merges,
requesting `persistent: true` against `DenoCronAdapter` returns `UnsupportedOperationError`.

**Check:**
`grep -RE "persistent\?: boolean" packages/plugin-triggers-core/src/domain/scheduled-spec.ts`
returns the field definition. **Check:**
`grep -RE "UnsupportedOperationError" packages/plugin-triggers-core/src` confirms the guard exists.
**Expected:** field defined; runtime guard present; the public-surface contract is
forward-compatible with `Deno.CronController` shape (composition, not exposure).

## F-TRG-18 — Scheduler-axis ownership

Scheduling lives on the triggers axis. `plugin-workers-core` does **not** define a
`WorkersSchedulerPort`. `defineWorker` spec does **not** include a `schedule?` field. Recurring jobs
are modelled as `defineScheduledTrigger(handler, spec).enqueueJob(jobX)`. See `architecture-v2.md`
§18 for the locked decision; backed by cross-ecosystem evidence in `10-cross-ecosystem-libraries.md`
§1.

**Check:**
`grep -RE "WorkersSchedulerPort|workersSchedule|schedule\?: (Cron|string)" packages/plugin-workers-core/src`
returns 0 results. **Check:**
`grep -RE "from 'jsr:@netscript/cron'" packages/plugin-workers-core/src` returns 0 results.
**Check:** any pre-existing `defineWorker({ schedule })` usages in the application repo are migrated
by slice F49 codemod. **Expected:** workers stays free of scheduling concerns; triggers axis is the
single home.
