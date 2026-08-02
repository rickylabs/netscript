# Plan: correct saga cascade contracts (#1013)

## Metadata
- Branch: `fix/1013-sagas-send-contract`; baseline: `3ab64720f`.
- Profile: Archetype 3 (runtime/behavior) + `SCOPE-docs`.
- Route: correct the documented/public contract; do not add workers dispatch or child-saga runtime behavior.

## Verified findings
- `src/adapters/saga-bus-bridge.ts` maps `send` to `SagaEngine.publish()`; no workers port is composed.
- `SagaEngine.publish()` records a handler's returned cascades but does not recursively dispatch them.
- `spawn` reaches `SagasError.notImplemented(...)` only when the cascade is dispatched.
- Worker helpers require an explicit `SagaWorkersClientPort`; triggers `enqueueJob` is the supported durable enqueue route.

## Locked slices
1. Correct public JSDoc in `src/public/messages.ts` and `src/domain/cascaded-message.ts`; replace the bridge's phase text in `src/adapters/saga-bus-bridge.ts`.
2. Rewrite `docs/site/tutorials/storefront/04-checkout-saga.md` so `send()` names internal saga messages and payment is enqueued through the triggers API; correct `docs/site/durable-workflows/sagas.md`, `docs/site/reference/sagas/index.md`, and `README.md`.
3. Add runtime contract tests under `tests/runtime/` for the rewritten checkout cascade and dispatched `spawn` rejection.

## Gates
- `deno run -A .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core --ext ts`
- `deno test -A packages/plugin-sagas-core/tests/runtime/`
- `deno task docs:links`; `deno task docs:accuracy`
- scoped lint (brief command), `deno task quality:gate`, package doc lint/JSR audit as time permits.

## Risks and non-scope
- Preserve the runtime throw site and all dispatch behavior; only error text may change.
- Keep tutorial commands executable and distinguish external enqueue from saga-bus messages.
- No new architecture debt; no scaffold E2E because no scaffold/publish shape changes.
