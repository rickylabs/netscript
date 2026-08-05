# Locked Plan — #1229 one-shot trigger defer scheduler

Status: **LOCKED under milestone D6 composed evaluation**.

## Scope and profile

Archetype 5 with folded Archetype-3 runtime behavior; docs overlay for the two caveat call-outs.
Implement the complete issue contract: core-owned one-shot scheduling/replay port, durable KV
adapter, plugin runtime composition, deterministic fire/cancel/past-due/restart tests, and truthful
debt/docs burn-down.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add a distinct one-shot defer/replay port; do not overload cron `TriggerSchedulerPort`. | Different lifecycle, payload, and persistence semantics. |
| D2 | Persist serializable event + trigger id + due time; resolve handler definitions at replay. | Functions cannot survive restart. |
| D3 | Make due replay an explicit deterministic operation, with runtime clock/wake composition. | Enables fake-clock tests and portable KV backends. |
| D4 | Delete a record only after successful replay; retain it after failure. | Crash-safe at-least-once behavior. |
| D5 | Derive replay identity so the original completed idempotency claim cannot suppress replay. | Existing processor completion semantics remain coherent. |
| D6 | Remove both caveat markers and close the debt entry only after full lifecycle gates pass. | Documentation must reflect shipped behavior. |
| D7 | Preserve inherited `deno.lock`; introduce no dependency changes or lint ignores. | Lock hygiene and smallest scope. |

## Open-decision sweep

No must-resolve decision remains. Safe to defer: multi-node leader election, exact-once delivery,
recurring schedules, admin listing UI, and a generic delayed-queue abstraction.

## Commit slices

| Slice | Proof | Gate | Files |
| --- | --- | --- | --- |
| S0 | Research, contract, gates, and D6 plan are locked. | Plan-Gate rows `COMPOSED` | run artifacts |
| S1 | Existing public runtime path demonstrably rejects defer into DLQ. | focused RED test | plugin runtime test + run artifacts |
| S2 | Core publishes a durable one-shot replay contract and KV adapter with fake-clock fire/cancel/past-due/restart proof. | focused core tests + scoped check | core domain/ports/stores/testing barrels and tests |
| S3 | Public plugin runtime schedules and replays defer through the same processor path. | focused plugin lifecycle tests | plugin runtime composition/tests |
| S4 | Both caveats and the debt entry are truthfully closed; archetype/JSR/runtime gates pass. | docs scan + scoped wrappers + quality + JSR/dry-run | docs, debt, run artifacts |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Replay is deduplicated by original claim | distinct deterministic replay event identity and targeted test |
| Crash loses or double-fires work | persist before return; delete after success; document at-least-once semantics |
| Definition missing after restart | retain record and report replay failure; never delete silently |
| Fake clock hides production wake behavior | separate due-drain contract from wake loop; test restart and past-due paths |
| Plugin becomes convention owner | core owns port/adapter; plugin only composes definitions and processor |
| Scope grows beyond issue | stop at durable one-shot replay; use `Refs #1229` if full acceptance cannot be earned |

## Selected gates

- Focused RED/GREEN unit tests for core and plugin runtime, using `TriggerTestClock`, no real sleeps.
- Scoped check/lint/fmt wrappers for `packages/plugin-triggers-core` and `plugins/triggers`.
- `deno task quality:gate`, `deno task arch:check`, full export-map doc lint.
- Per-package JSR audit and `deno publish --dry-run --allow-dirty`.
- Consumer import/runtime tests and `verify-plugin.ts`; no full scaffold smoke unless touched behavior
  or evaluator evidence makes it necessary.
- Diff scans: no new lint ignores/casts; no `deno.lock` delta from inherited hash.

## Deferred / non-scope

Multi-replica coordination, exact-once guarantees, cron scheduler redesign, CLI/admin UX, unrelated
trigger package restructuring, and dependency updates.
