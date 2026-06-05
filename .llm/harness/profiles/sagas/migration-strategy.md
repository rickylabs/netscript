# Sagas — Migration Strategy (`@saga-bus/core` → native engine)

> **Purpose.** Define the **extend-before-replace** path the PR comment
> requests. The locked outcome from the previous plan was full internalization
> of `@saga-bus/core`; this document defines *how to get there incrementally*
> via a stable extension API, so the migration can be paused, rolled back,
> or done per-saga.
>
> **Decision.** `SagaBusPort` is the stable extension API. Two adapters
> ship in Group E: `SagaBusBridge` (native engine) and `SagaBusLegacy`
> (wraps `@saga-bus/core`). Both conform to `SagaBusPort`. Toggle per
> runtime, not per process.

## 1. Why extend before replace

The PR comment is explicit:

> "we must build a solid adapter and base class with extension architecture
> to separate the public surface to the deep internals allowing us to
> migrate progressively"

Full internalization of `@saga-bus/core` in one shot violates that
constraint. The migration must:

1. Preserve the existing `@saga-bus/core` runtime as a fallback during
   roll-out.
2. Ship the native engine alongside, behind a runtime toggle.
3. Allow per-saga or per-environment selection so production can stay on
   legacy while staging burns in native.
4. Delete the legacy adapter only after the native engine reaches parity
   under load.

## 2. The stable extension API: `SagaBusPort`

```ts
// packages/plugin-sagas-core/src/ports/saga-bus-port.ts
export interface SagaBusPort {
  start(): Promise<void>;
  stop(opts?: { gracePeriodMs?: number }): Promise<void>;

  publish<TMessage>(
    target: SagaId,
    message: TMessage,
    opts?: PublishOptions,
  ): Promise<PublishResult>;

  schedule<TMessage>(
    target: SagaId,
    message: TMessage,
    delay: Duration,
    opts?: PublishOptions,
  ): Promise<ScheduleResult>;

  signal<TPayload>(
    target: SagaInstanceId,
    signal: SignalDefinition<TPayload>,
    payload: TPayload,
  ): Promise<void>;

  query<TResult>(
    target: SagaInstanceId,
    query: QueryDefinition<TResult>,
  ): Promise<TResult>;

  // observability hook (engine implements; adapters delegate)
  readonly metrics: SagaBusMetrics;
}
```

The port is **complete enough** that the native engine and the legacy
adapter both implement it without leaking adapter-specific concepts to the
caller.

## 3. The two adapters

### 3.1 `SagaBusBridge` (native, default)

```
src/adapters/saga-bus-bridge.ts
└─ implements SagaBusPort
└─ composes SagaEngine + SagaScheduler + SagaCompensator
└─ uses SagaTransportPort + SagaStorePort
└─ default adapter at Group E close
```

### 3.2 `SagaBusLegacy` (deprecated, opt-in)

```
src/adapters/saga-bus-legacy.ts
└─ implements SagaBusPort
└─ wraps @saga-bus/core's Bus, Transport, Store
└─ translates SagaBusPort calls to @saga-bus/core calls
└─ logs deprecation warning on start()
└─ no public re-export of @saga-bus/* types (F-15)
```

## 4. Per-runtime toggle

```ts
// Default: native engine
const runtime = createSagaRuntime({
  // ... no adapter option needed
});

// Opt back to legacy (during burn-in)
const runtime = createSagaRuntime({
  adapter: 'legacy',
});
```

`createSagaRuntime` resolves the adapter:

```ts
function createSagaRuntime(opts: SagaRuntimeOptions): SagaRuntime {
  const adapter = opts.adapter ?? 'native';
  const bus = adapter === 'native'
    ? new SagaBusBridge(/* ports */)
    : new SagaBusLegacy(/* ports */);
  // ...
}
```

## 5. Cut-over plan

| Window | Default adapter | Legacy adapter status |
|---|---|---|
| Group E Phase 7a–7c (this run) | `legacy` (opt-in `native`) | both ship; legacy default while consumer migration completes |
| Group E close (this run final commit) | `native` | legacy still ships; warning on `start()` |
| Phase 7d | `native` | legacy still ships; warning escalated to error in non-prod |
| Phase 7e | `native` | legacy adapter **deleted**; `adapter: 'legacy'` becomes a typecheck error |

This window can be extended if production telemetry shows a parity gap.

## 6. Per-saga override (optional escape hatch)

For phased rollout where individual sagas should pin to one adapter:

```ts
defineSaga('payment-flow')
  .adapter('legacy')                  // pin this saga to legacy during burn-in
  .durability('t1')
  .state(...)
  .build();
```

The runtime resolves the per-saga adapter at registration time. Default is
the runtime-level setting. Used sparingly — primary toggle is at the
runtime level.

## 7. Telemetry parity test

The Group E close requires a parity test:

```ts
// tests/parity/saga-bus-parity_test.ts
for (const adapter of ['native', 'legacy'] as const) {
  Deno.test(`${adapter}: roundtrip parity`, async () => {
    const runtime = createSagaRuntime({ adapter, /* ports */ });
    await runtime.start();
    const result = await runRoundtripScenario(runtime);
    assertEquals(result.cascaded.length, expected.cascaded.length);
    assertEquals(result.metrics.handlerInvocations, expected.metrics.handlerInvocations);
    await runtime.stop();
  });
}
```

If parity fails, the native engine is not yet ready to be default. Window
slips.

## 8. Codemod for userland saga migration

Userland sagas authored against `@saga-bus/core`'s `createTypedSaga()` are
syntactically close to the new canon. Codemod (`ns-sagas codemod`):

| Old (saga-bus/core) | New (plugin-sagas-core) |
|---|---|
| `import { createTypedSaga } from '@saga-bus/core'` | `import { defineSaga, send, schedule } from '@netscript/plugin-sagas-core'` |
| `createTypedSaga<TState, TMessages>()...given(...).when(...).then(...)` | `defineSaga('id').state(...).on(...).build()` |
| `.given(state => ({ ... }))` | `.state({ ... })` |
| `.when(M.type, handler)` | `.on('Type', handler)` |
| `continueWith(msg)` | `send(target, payload, opts)` |
| `completeWith(state)` | `sagaComplete()` |
| `MachineBuilder.build()` | `.build()` |

The codemod is implemented as a Deno script and shipped with `@netscript/plugin-sagas`
as `ns-sagas codemod migrate-from-saga-bus`.

## 9. Risk register update

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Native engine parity gap vs `@saga-bus/core` | Medium | High | Parity test gate at Group E close; legacy adapter stays available |
| Codemod misses edge-case userland saga | Medium | Medium | Codemod is best-effort; produces diff for review; users approve before commit |
| `SagaBusPort` proves insufficient to express a `@saga-bus/core` feature | Low | High | If discovered: extend the port (additive), do not split the adapter API |
| Performance regression on native engine | Medium | High | Benchmark suite in `tests/bench/` gates the default switch |

## 10. What this resolves

This document is the canonical answer to evaluator finding F-2 ("no coverage
of extend before replace") and to the PR comment's explicit request for a
"solid adapter and base class with extension architecture". The migration is
no longer a one-shot internalization; it is a port + two adapters + a
window.
