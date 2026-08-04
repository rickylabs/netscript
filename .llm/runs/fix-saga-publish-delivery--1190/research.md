# Research — fix-saga-publish-delivery--1190

## Re-baseline

- Carried-in source: issue #1190; failed 0.0.4 scaffold
  `/home/codex/repos/wave4-deepseek-004/product/deploy-queue`; sibling PR #1193 and run
  `/home/codex/repos/ns005-sagas/.llm/runs/fix-sagas-kv-glue-registration--w2-f/`.
- Re-derived against `main` @ `f7f7cc71813a71a6731af1342ebc80724c364eea` on 2026-08-04.
- What changed vs the carried-in version:
  - #1193 supplies generated Redis/Garnet KV adapter registration and relaxes the sagas API's
    Prisma-only bootstrap assumptions. It does not add API→runner delivery or project engine state
    into `saga_instances`.
  - #1193's RED proves missing Redis adapter registration, not #1190's publish hang, so #1190 keeps
    the failed 0.0.4 protocol record as RED and adds a focused HTTP-boundary RED before fixing.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The current HTTP publish handler awaits an API-local `SagaRuntime.publish`; it does not hand work to the background runner. | `plugins/sagas/services/src/routers/v1-handlers.ts`; `plugins/sagas/services/src/main.ts` |
| 2 | `runSagaRunner` loads/registers/starts definitions and waits for a signal, but never listens for published messages. | `plugins/sagas/src/runtime/saga-runner.ts` |
| 3 | Engine persistence writes `sagas/state`, correlations, and transitions. The HTTP `listInstances` fallback reads a distinct kvdex `sagaInstances` collection; no projector connects them. | `packages/plugin-sagas-core/src/runtime/saga-engine.ts`; `plugins/sagas/services/src/routers/v1-helpers.ts` |
| 4 | `@netscript/queue` auto-discovers Redis/Garnet before Deno KV, implements both backends, supports abortable listeners, and auto-propagates OTEL context through enqueue/dequeue. | `packages/queue/factory/create-queue.ts`; `packages/queue/adapters/{redis,deno-kv}.adapter.ts`; `packages/telemetry/src/instrumentation/queue.ts` |
| 5 | Workers already use `createQueue` as the API/background-process delivery seam, establishing the local composition convention. | `plugins/workers/services/src/routers/router-context.ts`; `plugins/workers/worker/queue-consumer.ts` |
| 6 | `startSagas` starts by default after registering definitions, but this lifecycle contract lacks an HTTP composition regression. | `packages/plugin-sagas-core/src/presets/start-sagas.ts` and a focused local Deno evaluation on 2026-08-04 |
| 7 | `createDurableSagaRuntime` returns an unstarted runtime and supplies no scheduler; scheduled cascades fail only when exercised, which is an undocumented third state. | `plugins/sagas/src/runtime/create-durable-saga-runtime.ts`; `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` |
| 8 | The failed scaffold's saga immediately emits a scheduled cascade, so a successful first transition must both persist and schedule without executing inside the API request. | `/home/codex/repos/wave4-deepseek-004/product/deploy-queue/sagas/deploy-pipeline-saga.ts` |
| 9 | A foreign `aspire/db-operation` AppHost from the #1193 worktree is running; ownership is unknown to this run. | `aspire ps --format Json` on 2026-08-04 |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/plugin-sagas-core/deno.json`, `packages/plugin-sagas-core/mod.ts`,
  `plugins/sagas/deno.json`, `plugins/sagas/mod.ts`, and `plugins/sagas/src/runtime/mod.ts`.
- Planned public surface: retain existing core ports and runtime entry points; add only documented,
  explicit plugin runtime delivery/lifecycle options if tests require injection. Prefer internal
  composition functions over a new export.
- Slow-type / surface risks: exported option/result types need explicit annotations under
  `--isolatedDeclarations`; cross-package queue types must not leak through inferred public return
  types. `deno doc --lint` and `deno publish --dry-run --allow-dirty` are required for both affected
  packages if their public exports change.

## Open questions

- Resolved before lock: delivery uses the existing `@netscript/queue` convention, not the unused
  saga Redis-list transport, because queue is already backend-neutral and OTEL-aware.
- Resolved before lock: HTTP success means durable queue acceptance. Runner execution is observed
  separately through `GET /instances`, persisted `saga_instances`, and spans.
- Resolved before lock: the 0.0.4 artifact is the owner-provided protocol RED; a repository
  HTTP-boundary test will be demonstrated red against the old handler topology before its fix.

