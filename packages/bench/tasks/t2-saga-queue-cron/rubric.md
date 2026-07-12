# Rubric — t2 saga, queue, and cron (PROVISIONAL)

> The rubric axis remains held out of the composite. These weights sum to 1.0 within the future
> quality score.

| Item                       | Weight | Passing bar |
| -------------------------- | ------ | ----------- |
| `typed-saga-state-machine` | 0.25 | `defineSaga` models finite states, correlation, guarded transitions, and a terminal path. |
| `compensation`             | 0.15 | Payment failure is an explicit compensation/failure transition to `cancelled`. |
| `durable-checkpoints`      | 0.15 | Workflow state persists through the framework store and survives restart. |
| `queued-worker-work`       | 0.15 | Saga effects enqueue named worker jobs; no inline payment/inventory execution. |
| `scheduled-trigger`        | 0.15 | `defineScheduledTrigger` + `enqueueJob` owns the UTC cron path. |
| `idempotency`              | 0.10 | Duplicate starts/events cannot double-enqueue or double-advance. |
| `typed-service-surface`    | 0.05 | Typed oRPC service and shared error vocabulary; minimal specified routes only. |

Penalize in-memory-only state, raw timers pretending to be cron, direct calls from saga handlers to
worker implementations, unguarded transitions, and ad-hoc error JSON.
