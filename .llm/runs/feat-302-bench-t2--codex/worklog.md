# Worklog — #302 t2 saga/queue/cron

## Design

### Public surface

No new package export. `bench.config.ts` registers `T2_SAGA_QUEUE_CRON`; the existing `self --fake`
and `conformance` commands consume it through `TASKS`.

### Domain vocabulary

- `CheckoutWorkflow`: correlated durable state with `payment_pending`, `paid`, `completed`, or
  `cancelled` status.
- `QueuedJob`: durable work record with kind, source, payload, and `queued` status.
- Saga events: `PaymentCompleted`, `PaymentFailed`, `InventoryReserved`.
- Schedule: `daily-reconciliation`, cron `0 6 * * *`, timezone `UTC`.

### Ports

No new harness ports. The reference consumes the existing NetScript service and KV surfaces; probes
consume the existing `HttpClient`/`ProbeContext` ports.

### Constants

Stable task id `t2-saga-queue-cron`, schedule id `daily-reconciliation`, saga event names, workflow
statuses, and job kinds are named in the task/reference implementation.

### Commit slices

1. Add the complete t2 task/reference/suite, catalog and fake-mode wiring, documentation, tests, and
   gate evidence in one independently reviewable #302 residual slice.

### Deferred scope

No real agent-driven runs, competitor lanes, or regression verdicts. They require owner decisions on
model, key provisioning, and budget.

### Contributor path

Start at `bench.config.ts`, copy a task directory convention, author its agent-visible prompt/context
and withheld suite/reference, then verify both CLI modes.

## Plan gate

PLAN-EVAL is owner-waived in the slice brief (carried drift D1). The plan and Design checkpoint are
recorded before implementation.

## Implementation

- Added the agent-visible t2 prompt, NetScript context, and provisional rubric.
- Added a withheld 10-probe HTTP suite covering saga start/forward/terminal/compensation paths,
  queued work, cron metadata/triggering, typed errors, idempotency, and restart durability.
- Added a deterministic NetScript golden reference using `defineService` and `@netscript/kv`.
- Registered `T2_SAGA_QUEUE_CRON` after t1.
- Changed fake mode to dynamically import every registered suite, verify task-id alignment and a
  non-empty probe list, and derive fixture sizes from the real probe count.
- Added task-catalog unit coverage and updated package/positioning copy from t1-only to t1+t2.

## Gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped check | PASS | 56 files selected; 1 batch; 0 failed; 0 diagnostics. |
| Scoped lint | PASS | 56 files selected; 1 batch; 0 findings. |
| Scoped format | PASS | 56 files selected; 1 batch; 0 findings. |
| Bench unit tests | PASS | `22 passed`, `0 failed`. |
| `deno task bench:conformance` | PASS | t1 `GREEN: 10/10`; t2 `GREEN: 10/10`; t2 restart probe passed. |
| `deno task bench:self:fake` | PASS | Summary contains t1 and t2, both 100%, and remains explicitly marked fake/not a benchmark result. |
| Lock hygiene | PASS | `deno.lock` has no diff. |

Commands were run from `/home/codex/repos/ns-b9-302`; Deno tasks used `rtk proxy` without changing
their exit codes.

## Real t1+t2 self-bench still requires owner decisions

A REAL run was intentionally not executed. It still requires:

1. **Model:** owner selects and freezes the agent model/caps for all repeats (and updates the pinned
   config/pricing if it differs from `claude-opus-4-8`).
2. **Key:** owner provisions/authorizes the matching live provider credential (currently described
   as `ANTHROPIC_API_KEY`) and authorizes lifting the `bench self` live guard.
3. **Budget/cadence:** owner approves a USD ceiling and repeat count (P1 calls for N>=3 per task),
   including the maximum-turn and wall-time exposure for the full t1+t2 batch.

Until those are decided, only conformance and fake pipeline evidence is honest. Cross-framework
batch selection remains separately owner-gated, and this slice does not close #302.

## Reconcile

Issue/PR mutation was not performed: the brief prohibits opening a PR and defines this as partial
#302 work. The beta-9 orchestrator owns the separate-session slice review, IMPL-EVAL, and any GitHub
status/comment reconciliation after the pushed commit.
