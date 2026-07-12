# NetScript lane — agent guidance for t2

Use NetScript's durable-workflow spine; do not replace it with an in-memory status map.

## Saga

- Define the correlated state machine with `defineSaga()` from `@netscript/plugin-sagas-core`.
- Use `.state()`, `.correlate()`, guarded `.on()` handlers, and an explicit failure/compensation
  branch. Finish with `.build()`.
- Return `send(...)` effects to request background work instead of calling worker code inline.

## Queued work

- Define payment, inventory, and reconciliation work with the workers primitives. Use the durable
  worker queue (or `createTypedQueue()` from `@netscript/queue` when implementing the thin contract
  directly), with stable job ids and idempotency keys.
- A job is observable as `queued` before a consumer runs it. Redelivery must not double-advance the
  saga.

## Cron trigger

- Define `daily-reconciliation` with `defineScheduledTrigger()` and `enqueueJob()` from
  `@netscript/plugin-triggers-core/builders`.
- Use cron `0 6 * * *` and timezone `UTC`; scheduling is a trigger concern, not an inline timer in
  the HTTP handler.

## Service and persistence

- Serve a typed oRPC contract through `defineService()` from `@netscript/service`.
- Persist workflow checkpoints and observable job records with `getKv()` from `@netscript/kv` so
  they survive restart.
- Use the shared `NOT_FOUND` and `VALIDATION_ERROR` vocabulary and factories.

Run `deno doc` on the named modules when you need exact signatures.
