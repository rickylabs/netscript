# POC ground truth — the real data model the design prototype should mirror

Source: the `netscript-start` playground (`rickylabs/netscript-start@master`),
`apps/playground/routes/(dashboard)/dashboard/{plugin,framework}` — 80 files, 433 KB of
**real, wired** Fresh routes reading live plugin APIs. The design is rough there, but the
*wiring and data* are authoritative. This file is the field reference: hand it to the design
agent so its mock data matches what the framework actually exposes, and so the invented ids in
S6/S8/S10/S13 get replaced with the real join key.

> The owner's point: "they demonstrate the amount of data you can exploit when you think
> correctly." Everything below is data the design prototype currently under-uses or invents.

---

## 1. The correlation-ID join IS the spine (proven, not aspirational)

The prototype's biggest gap — "one journey, told four ways, with the same ids" — is **already
implemented** in the POC. The join key is a **correlation ID**, and one API resolves the whole
cross-primitive fan-out:

```
workersQueryUtils.listExecutionsByCorrelationId({ correlationId })  // → { executions[] }
```

This exact call is made from **both**:
- `sagaInstanceLoader`  (saga instance detail) — `sagas/(_shared)/query-loaders.ts`
- `eventDetailLoader`   (trigger event detail) — `triggers/(_shared)/query-loaders.ts`

So the same `correlationId` ties **trigger event ↔ saga instance ↔ worker executions**. It is
**bidirectional**: a worker execution carries `execution.correlationId`; if that value is a UUID
(`isTriggerCorrelation()`), the jobs loader looks it up in `listEvents` and builds a back-link to
the originating **trigger event**. Every "Open run / Open saga / Open trigger event" out-link in
the design can be real — the framework already joins on this key.

**Steer for S13 (and S6/S8/S10):** the spine is a **correlation ID**, and the realistic value is
**not** a synthetic `ord_7f3k`. It's either a UUID (trigger-originated) or a **domain
correlation value** the saga correlates on. The POC's real map (`cross-references.ts
SAGA_MESSAGE_MAP`):

| Trigger action `messageType`  | Saga                     | Correlates on (payload path)                          |
| ----------------------------- | ------------------------ | ----------------------------------------------------- |
| `PaymentWebhookReceived`      | `PaymentWebhookSaga`     | `webhookPayload.data.object.id` (Stripe charge/pmt id)|
| `CsvImportStarted`            | `CsvImportSaga`          | `contentHash`                                         |
| `ProductBatchImportStarted`   | `ProductBatchImportSaga` | `batchId`                                             |
| `ProductCatalogExportStarted` | `ProductCatalogExportSaga` | `exportId`                                           |

Use one of these as the canonical flow (e.g. a Stripe webhook → `PaymentWebhookSaga` → reserve
job) instead of the generic `order.fulfillment`. It's more convincing *and* it's the real shape.

---

## 2. The trigger **action chain** — the richest data the design ignores

A trigger event is not a single "firing." It carries an **action chain**: `event.actionResults[]`,
each entry:

```ts
{ actionType: 'enqueueJob'|'publishSaga'|'executeTask'|'executeBatch',
  status: 'success'|'failure'|'skipped'|<pending>,
  result?: unknown,   // e.g. { jobId } | { messageType } | { taskId } | { batchId }
  error?: string,
  duration?: number }
```

Each successful action **deep-links to the entity it produced** (`getLinkedResource`):
`enqueueJob → job execution detail`, `publishSaga → the specific saga instance` (via
SAGA_MESSAGE_MAP), `executeTask → task execution`, `executeBatch → batch`. So **one trigger event
is itself a mini causal fan-out** — the S13 idea, in miniature, per event. S9 currently shows a
flat firing feed; it should render the per-event action chain with linked outcomes.

---

## 3. Workers: jobs vs tasks, and **polyglot runtimes** (absent from the design)

The framework has **two worker concepts** with a hard distinction the design flattens:
- **job** = compiled Deno unit. **task** = **polyglot** unit. Execution record carries
  `concept: 'job'|'task'`.
- Runtime is resolved from the entrypoint extension (`format.ts resolveRuntimeFromEntrypoint`):
  **Deno 🦕 (ts/tsx/js/mjs) · Python 🐍 · Shell 🐚 · PowerShell ⚡ · .NET (dll/exe)**.

**Steer for S7:** distinguish jobs (Deno) from tasks (polyglot) and show a **runtime badge**
per task. "Nightly reconcile (Python task)" vs "reserve-inventory (Deno job)" is real and is a
differentiator no competitor console has. The current prototype shows generic "jobs" only.

Execution record fields (real): `jobId` (= definition slug), `executionId`, `status`
(`running|completed|failed|pending|queued`), `concept`, `correlationId`. `triggeredBy` ∈
`schedule|cron|manual|trigger|saga` (each with an icon).

Worker stats are **derived from real counts**, not mocked: `jobsCount`, `tasksCount`,
`runningCount`, `completedCount`, `failedCount`, `totalExecutions`, `successRate =
round(completed/total*100)`. (5 parallel `listExecutions` calls with `status` filters.)

---

## 4. Sagas: instances, status, and the history timeline

- Definition (`getSaga` by name) → instances (`listInstances` by `sagaName`, `status` filter).
- Instance: `correlationId`, `status ∈ active|completed|failed|pending|compensating`
  (`compensating` → warning variant). This is the real enum — the design's `COMPENSATING`/
  `COMPENSATED` split should reconcile to the framework's `compensating` + terminal `failed`/
  `completed`.
- **The transition/compensation timeline is a real API**: `getInstanceHistory({ sagaName,
  correlationId }) → history.history[]`. The design's S8 timeline should be framed as this
  history stream, not an invented step list.
- Instance detail **also** resolves `listExecutionsByCorrelationId` → the saga's worker
  executions (§1). So S8 → S6 linking is real.
- Stats: `totalDefinitions`, `totalInstances`, `activeCount`, `completedCount`, `failedCount`,
  `successRate`.

---

## 5. Triggers: types, events, next-fire, action chain

- Trigger types (8, real — `format.ts TRIGGER_TYPE_CONFIG`): **file · webhook · schedule · cron ·
  kv · polling · composite · manual**. The design shows a subset; use all eight to make the
  registry realistic.
- Event: `id` (= the UUID correlation id), `payload`, `actionResults[]` (§2), `status ∈
  processing|detected|completed|processed|failed`.
- Cron is humanized (`parseCronToHuman`: `*/5 * * * *` → "Every 5 minutes"). The S9
  schedule-preview ("next fires") is the forward-looking half; this is the human-readable half.
- Stats: `totalTriggers`, `totalEvents`, `processingCount`, `completedCount`, `failedCount`,
  `successRate`.

---

## 6. DX patterns the design should assume exist (so it doesn't under-scope)

The POC routes are built on **typed route contracts** (`InferRouteContractPath/Search`), per-
plugin **query utils** (`workersQueryUtils`, `sagasQueryUtils`, `triggersQueryUtils`), and a
**cache-first + fire-and-forget pre-warm + smart-staleness-probe** loading model
(`getCachedEntry` → render instantly; background revalidate; a single cheap `total`-compare probe
decides whether to refetch). Two implications for the design:

1. **Data is cheap and real.** Stat grids, per-status counts, cross-links, and live seed state are
   all backed by actual APIs. The design should not shy from dense, cross-referenced screens
   "because the data wouldn't exist" — it does.
2. **Live islands are seeded server-side then hydrated** (`stream-loaders.ts` dehydrate →
   island). The S13/S10 "live" behavior has a real substrate (per-plugin StreamDB consumers:
   `createWorkersStreamDB`/`createSagasStreamDB`/`createTriggersStreamDB` over a streams base
   URL). The pulsing/SSE affordances the feedback asks for map onto a real mechanism.

---

## 7. Net delta — what to change in the prototype because of this

1. **Replace invented ids with a correlation-ID spine** (§1). Canonical flow = a real mapped
   journey (Stripe webhook → `PaymentWebhookSaga` → reserve job), same `correlationId` on
   S6/S8/S10/S13, every out-link resolvable.
2. **S7: add the job/task split + polyglot runtime badges** (§3) — currently missing entirely.
3. **S9: render the per-event action chain with linked outcomes** (§2), not a flat firing feed;
   include all 8 trigger types (§5).
4. **S8: frame the timeline as `getInstanceHistory`** and reconcile the status enum to
   `active|completed|failed|pending|compensating` (§4).
5. **S6: executions carry `concept` + `correlationId`**; the correlation back-link to the trigger
   event is real — wire "Open trigger event" too, not just "Open trace."
6. Everywhere: stat numbers are **derived** (counts + successRate), so keep them internally
   consistent across screens (§3–§5) — the POC computes them from the same list totals.
