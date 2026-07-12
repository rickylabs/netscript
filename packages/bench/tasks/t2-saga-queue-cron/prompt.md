# Task t2 — Saga, queued work, and cron trigger

Build a small HTTP service for a durable checkout workflow. Creating a checkout starts a correlated
saga and queues payment work. Events advance or compensate the saga. A named UTC cron trigger queues
daily reconciliation work. Your solution is graded by a hidden black-box HTTP suite plus a rubric.

Read `context/AGENTS.md` first and use the framework's saga, worker/queue, scheduled-trigger, service,
and persistence primitives. The workflow and queued jobs must survive a process restart.

## HTTP contract

All bodies are JSON. Typed errors use `{ "code": "<ERROR_CODE>" }`.

### Checkout workflow

- `POST /api/workflows` with `{ orderId, customerId, totalCents }`
  - `202` with `{ workflow, emittedJob }`.
  - `workflow` is `{ id, orderId, customerId, totalCents, status }`; its initial status is
    `payment_pending` and `id` equals the correlation key `orderId`.
  - `emittedJob` is queued work with kind `process-payment`, source `saga`, and payload containing
    the order id and amount.
  - Repeating the same `orderId` is idempotent: it returns the existing workflow and does not emit a
    second job (`emittedJob: null`).
- `GET /api/workflows/:id` returns the workflow or `404 NOT_FOUND`.
- `POST /api/workflows/:id/events` with one of:
  - `{ type: "PaymentCompleted", transactionId }`: `payment_pending` -> `paid` and emits one queued
    `reserve-inventory` job.
  - `{ type: "InventoryReserved" }`: `paid` -> `completed`, no new job.
  - `{ type: "PaymentFailed", reason }`: `payment_pending` -> `cancelled`, no new job.
  - A redelivered or out-of-order event is an idempotent no-op and emits no job.

### Queued jobs

- `GET /api/jobs/:id` returns `{ id, kind, source, status, payload }` or `404 NOT_FOUND`.
- Jobs returned by workflow or schedule operations must be immediately observable with status
  `queued`.

### Cron trigger

- `GET /api/schedules/daily-reconciliation` returns
  `{ id: "daily-reconciliation", cron: "0 6 * * *", timezone: "UTC" }`.
- `POST /api/schedules/daily-reconciliation/trigger` with an optional `{ requestedAt }` returns
  `202` with `{ schedule, emittedJob }`, where the queued job kind is `reconcile-checkouts`, source
  is `cron`, and its payload names `scheduleId: "daily-reconciliation"`.

## Field rules

`orderId` and `customerId` are non-empty strings; `totalCents` is a positive integer. Event-specific
fields are non-empty strings. Invalid input returns `400` or `422` with code `VALIDATION_ERROR`.

## Done when

- The service starts with one command and serves the contract.
- Saga transitions are guarded and idempotent, including compensation.
- Saga and cron paths enqueue durable jobs through the framework's work primitives.
- Workflows and jobs survive restart.
