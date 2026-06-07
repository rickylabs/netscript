# Triggers — DSL Canon

> **Purpose.** Lock the **single** canonical userland DSL shape for trigger definitions. Resolves
> the dual-canon risk identified in evaluator finding F-2 (the legacy
> `defineTrigger(...).watchFiles(...).webhook(...).build()` chain coexists with the new
> handler-first `defineWebhook(handler, spec)` shape during the migration window).
>
> **Decision.** **Handler-first wins.** `defineWebhook(handler, spec)`,
> `defineFileWatch(handler, spec)`, `defineScheduledTrigger(handler, spec)` are the userland DSL.
> The legacy fluent chain (`defineTrigger('id').watchFiles({...}).enqueueJob('x').build()`) is
> **deleted** at slice F39, not deprecated alongside.

## 1. Why handler-first

| Property                                           | Handler-first (`defineX(handler, spec)`)                                   | Fluent chain (`defineTrigger(id).xyz().build()`)                           |
| -------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Handler is the unit of cognition                   | ✓ (first positional arg)                                                   | ✗ (handler set via `.handle(fn)` deep in chain)                            |
| Per-kind type safety on the spec                   | ✓ (`WebhookSpec`/`FileWatchSpec`/`ScheduledSpec` are distinct types)       | ✗ (one chain, kind decided at runtime via `.watchFiles()` vs `.webhook()`) |
| Static cross-axis typing                           | ✓ (`enqueueJob` is a chainable terminal that accepts `JobDefinition<TId>`) | partial (untyped string job id)                                            |
| Encourages flat trigger files                      | ✓ (no `.build()` ceremony)                                                 | ✗ (`.build()` mandatory)                                                   |
| Matches NetScript userland conventions             | ✓ (parallels `defineWorker`, `defineSaga`'s `.entrypoint()` style)         | refused — fluent chain at this scale duplicates worklog noise              |
| Matches Cloudflare's declarative trigger model     | ✓ (one file, one trigger, declarative spec)                                | ✗                                                                          |
| Matches Inngest / Trigger.dev / Hookdeck DSL style | ✓ (handler-first is industry-standard for webhooks)                        | ✗                                                                          |
| Easy to extend with new kinds                      | ✓ (add `defineQueueTrigger(handler, spec)`)                                | ✗ (chain grows methods, becomes god-builder)                               |

The cross-ecosystem evidence in `10-cross-ecosystem-libraries.md` §1 supports handler-first: every
modern system (Hookdeck, Svix, Inngest, Trigger.dev, Cloudflare) uses handler-first or declarative.
The fluent chain is a 2010s pattern (Quartz `TriggerBuilder.Create().WithCronSchedule().Build()`) we
deliberately refuse.

## 2. The canon

### 2.1 Public surface (`@netscript/plugin-triggers-core`)

| Symbol                                       | Signature                                                                                  | Notes                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `defineWebhook<TId>(handler, spec)`          | `(handler: WebhookHandler, spec: WebhookSpec<TId>) => WebhookDefinition<TId>`              | Handler receives `(event: TriggerEvent, ctx: TriggerContext) => Promise<TriggerActionResult[]>` |
| `defineFileWatch<TId>(handler, spec)`        | `(handler: FileWatchHandler, spec: FileWatchSpec<TId>) => FileWatchDefinition<TId>`        | Spec includes `paths`, `patterns`, `ignored`, `stabilityThreshold`                              |
| `defineScheduledTrigger<TId>(handler, spec)` | `(handler: ScheduledHandler, spec: ScheduledSpec<TId>) => ScheduledTriggerDefinition<TId>` | Spec includes `cron`, `timezone`, `persistent?`, `backfill?`                                    |
| `defineQueueTrigger<TId>(handler, spec)`     | RESERVED — same shape                                                                      | Runtime deferred to Group H; type ships F4                                                      |
| `defineStreamTrigger<TId>(handler, spec)`    | RESERVED — same shape                                                                      | Runtime deferred to Group H                                                                     |
| `defineManualTrigger<TId>(handler, spec)`    | RESERVED — same shape                                                                      | CLI-fire only in Group F                                                                        |

### 2.2 Action helpers (also public)

```ts
import {
  ackOnly,
  defer,
  emitStream,
  enqueueJob,
  publishSaga,
} from '@netscript/plugin-triggers-core';
```

| Constructor                            | Returns             | Notes                                                            |
| -------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `enqueueJob(jobDef, opts?)`            | `EnqueueJobAction`  | `opts.idempotencyKey?`, `opts.concurrencyKey?`, `opts.priority?` |
| `publishSaga(sagaDef, payload, opts?)` | `PublishSagaAction` | `opts.idempotencyKey?`                                           |
| `emitStream(topic, message, opts?)`    | `EmitStreamAction`  | `opts.idempotencyKey?`, `opts.partitionKey?`                     |
| `ackOnly()`                            | `AckOnlyAction`     | Useful for webhooks that need 200/202 only                       |
| `defer(until)`                         | `DeferAction`       | Maps to `event.status='deferred'` — Airflow-licensed             |

### 2.3 Inspection (also public)

```ts
import { inspectTrigger } from '@netscript/plugin-triggers-core';

const introspection = inspectTrigger(myTrigger);
// { id, kind, spec, actions, ports, ... }
```

## 3. Examples (illustrative, not normative)

### 3.1 Webhook

```ts
// triggers/stripe-payment-trigger.ts
import { defineWebhook, enqueueJob, publishSaga } from '@netscript/plugin-triggers-core';
import { paymentProcessingJob } from '../workers/jobs/payment-processing.ts';
import { paymentSaga } from '../sagas/payment-saga.ts';

export default defineWebhook(
  async (event, ctx) => {
    const payload = event.payload as StripeEvent;
    if (payload.type === 'payment_intent.succeeded') {
      return [
        enqueueJob(paymentProcessingJob, {
          idempotencyKey: payload.id,
        }),
        publishSaga(paymentSaga, { paymentId: payload.id }),
      ];
    }
    return [ackOnly()];
  },
  {
    id: 'stripe-payments' as const,
    path: '/webhooks/stripe',
    verifier: 'hmac-sha256',
    secretEnv: 'STRIPE_WEBHOOK_SECRET',
  },
);
```

### 3.2 File watch

```ts
// triggers/csv-arrival-trigger.ts
import { defineFileWatch, enqueueJob } from '@netscript/plugin-triggers-core';
import { csvImportJob } from '../workers/jobs/csv-import.ts';

export default defineFileWatch(
  async (event) => {
    return [enqueueJob(csvImportJob, { idempotencyKey: event.payload.path })];
  },
  {
    id: 'sales-csv-arrival' as const,
    paths: ['./shared/incoming/sales'],
    patterns: ['*.csv'],
    ignored: ['*.tmp', '.*'],
    stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
    on: ['create'],
  },
);
```

### 3.3 Scheduled

```ts
// triggers/daily-cleanup-trigger.ts
import { defineScheduledTrigger, enqueueJob } from '@netscript/plugin-triggers-core';
import { cleanupJob } from '../workers/jobs/cleanup.ts';

export default defineScheduledTrigger(
  async () => [enqueueJob(cleanupJob)],
  {
    id: 'daily-cleanup' as const,
    cron: '0 2 * * *',
    timezone: 'UTC',
    persistent: false, // T1 default
    backfill: { enabled: true, windowMs: 3_600_000, policy: 'fire-once' },
  },
);
```

## 4. Forbidden DSL patterns

| Pattern                                                                | Reason                                       | Detection      |
| ---------------------------------------------------------------------- | -------------------------------------------- | -------------- |
| `defineTrigger(id).watchFiles({...}).build()`                          | Legacy chain; deletes at F39                 | F-TRG-3 grep   |
| `defineTrigger(id).webhook({...}).build()`                             | Same                                         | F-TRG-3 grep   |
| `getTriggerRegistry()` / `resetTriggerRegistry()`                      | AP-10/11 (hidden singleton)                  | F-TRG-3 grep   |
| Class-based triggers (`class MyTrigger extends BaseTrigger {}`)        | AP-3 deep inheritance                        | Lint           |
| Decorator-based triggers (`@Trigger({...})`)                           | Not stable across Deno versions              | Lint           |
| Top-level `await` in trigger files                                     | Walker must read statically                  | Lint           |
| `import 'jsr:@netscript/cron'` in `packages/plugin-triggers-core/`     | F-TRG-6 cron-axis rule                       | F-TRG-6 grep   |
| `import 'jsr:@netscript/watchers'` in `packages/plugin-triggers-core/` | F-TRG-16 watcher-axis rule                   | F-TRG-16 grep  |
| Schedule field on workers DSL (`defineWorker({ schedule })`)           | F-TRG-18 — scheduling lives on triggers axis | Codemod at F49 |

## 5. Composition rules

| Rule                                   | Statement                                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One file = one trigger                 | Statically discoverable by the walker; one default export.                                                                                                                   |
| Filename matches id                    | `triggers/<id>-trigger.ts` convention (`sales-csv-arrival-trigger.ts` exports id `'sales-csv-arrival'`).                                                                     |
| Handler is pure-async                  | Returns `Promise<TriggerActionResult[]>`. No side-effects outside actions.                                                                                                   |
| Spec is frozen                         | The walker reads `spec` at scaffold time. Runtime mutation forbidden.                                                                                                        |
| Cross-axis references are values       | `enqueueJob(jobDef, ...)` takes the imported `JobDefinition`, not a string id. The walker traces the import.                                                                 |
| Reserved kinds typecheck but don't run | `defineQueueTrigger`/`defineStreamTrigger`/`defineManualTrigger` produce definitions that pass `deno check`; the processor throws `TriggerKindNotImplementedError` at start. |

## 6. References

- `architecture.md` §3 (kind table) + `architecture-v2.md` §3 (open discriminator)
- `extension-axes.md` §§2–4 (verifier / scheduler / watcher axes)
- `10-cross-ecosystem-libraries.md` §1 (handler-first vs fluent chain evidence)
- `07-netscript-triggers-synthesis.md` §14 (public surface)
- Doctrine `07-composition-and-extension.md` (DSL canon rules)
