# Re-evaluation of the “Nitro excludes sagas” constraint

Evidence date: 2026-07-18.

## Original constraint

Issue #327 decision D1 (2026-07-03) classified RFC-14 unified mode as a 3–5-month separate track
that “excludes sagas,” alongside the then-known `deno_server --unstable` limitation. The same issue
described Nitro as WATCH and tier-3 serverless as unofficial-runtime/isolate/container territory.
([issue #327, D1 and watch-item sections](https://github.com/rickylabs/netscript/issues/327))

That historical decision predates the live v3 task, WebSocket, lifecycle, and database pages now
cited by issue #824 as requiring re-validation.
([issue #824](https://github.com/rickylabs/netscript/issues/824))

## What Nitro v3 actually supplies

| Question                                                                       | Live answer                                                                                                                                                  | Evidence                                                                                         |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Can Nitro define and invoke background work?                                   | Yes. Experimental `defineTask`/`runTask` operations accept payload/context and can be called programmatically.                                               | [Nitro tasks](https://nitro.build/docs/tasks)                                                    |
| Can it schedule work?                                                          | Yes. `scheduledTasks` uses croner on dev/Node/Bun/Deno process presets and generates native Cloudflare/Vercel schedules.                                     | [Nitro tasks](https://nitro.build/docs/tasks)                                                    |
| Does it provide a durable queue?                                               | No such contract is documented. Errors propagate to the caller; `waitUntil` may or may not exist; same-name concurrent callers share one running invocation. | [Nitro tasks](https://nitro.build/docs/tasks)                                                    |
| Does it provide saga state, correlation, compensation, outbox, or idempotency? | The task surface documents none of these semantics. Its contract is named task execution and scheduling.                                                     | [Nitro tasks](https://nitro.build/docs/tasks)                                                    |
| Can a long-running Nitro server own runtime resources and clean them up?       | Yes. Plugins register behavior, and `close` is the documented shutdown cleanup hook.                                                                         | [lifecycle](https://nitro.build/docs/lifecycle), [plugins](https://nitro.build/docs/plugins)     |
| Can it host message ingress/transports?                                        | Yes at the host layer: HTTP routes, cross-platform WebSockets, pub/sub topics, and provider-specific hooks are available.                                    | [WebSocket](https://nitro.build/docs/websocket), [lifecycle](https://nitro.build/docs/lifecycle) |
| Are all presets equivalent for saga execution?                                 | No. `waitUntil` is runtime-dependent; schedule integration differs by preset; the default is Node, while Deno and provider presets are distinct outputs.     | [tasks](https://nitro.build/docs/tasks), [deploy](https://nitro.build/deploy)                    |

## What shipped NetScript sagas require

The shipped `SagaDefinition` is not “a background function.” It contains a durability tier, initial
state, handled message types, correlation rules, handlers, compensations, signal/query handlers,
retry, concurrency, and an optional schedule.
(`deno doc --filter SagaDefinition packages/plugin-sagas-core/mod.ts`)

The shipped ports make the durable obligations explicit:

- `SagaStorePort` persists state envelopes, transition history and correlation indexes, with
  optional optimistic-write constraints.
  (`deno doc --filter SagaStorePort packages/plugin-sagas-core/src/ports/mod.ts`)
- `SagaTransportPort` owns start/stop, publish and subscribe.
  (`deno doc --filter SagaTransportPort packages/plugin-sagas-core/src/ports/mod.ts`)
- `SagaOutboxPort` is reserved for atomic state/cascaded-message commits, and `SagaIdempotencyPort`
  reserves durable deduplication keys.
  (`deno doc --filter SagaOutboxPort packages/plugin-sagas-core/src/ports/mod.ts`;
  `deno doc --filter SagaIdempotencyPort packages/plugin-sagas-core/src/ports/mod.ts`)

These requirements align with the doctrine that durable workflows are state machines with named
lifecycle/failure behavior, not opaque task callbacks
(`docs/architecture/doctrine/08-runtime-state-failure.md:11-25`).

## Verdict

**STALE as a categorical exclusion; VALID as a “Nitro does not implement saga semantics” warning.**
Nothing in the live Nitro v3 host contract prevents a NetScript saga runtime from running
in-process. A long-running preset can mount the shipped saga runtime, use NetScript
stores/transports, and bind its shutdown to Nitro's `close` hook. That is an integration
requirement, not an exclusion. ([Nitro lifecycle](https://nitro.build/docs/lifecycle);
`deno doc --filter SagaTransportPort packages/plugin-sagas-core/src/ports/mod.ts`)

The constraint **does still hold for a naive substitution**: replacing saga execution with Nitro
tasks would discard correlation, persisted transitions, compensation, retry policy, idempotency and
outbox guarantees. Nitro tasks are experimental and explicitly expose runtime-dependent continuation
behavior. ([Nitro tasks](https://nitro.build/docs/tasks);
`deno doc --filter SagaDefinition packages/plugin-sagas-core/mod.ts`)

It also remains **preset-conditional**. Serverless/isolate outputs must prove that their activation,
execution window, storage/transport connectors, and shutdown model satisfy the chosen
`SagaDurabilityTier`; otherwise those presets must reject sagas at build time or route saga work to
a macro-service running a compatible long-lived process. Nitro itself documents preset-dependent
`waitUntil` and schedule integrations, so cross-preset parity cannot be assumed.
([Nitro tasks](https://nitro.build/docs/tasks), [deploy presets](https://nitro.build/deploy))

## Board consequence

Replace “Nitro excludes sagas” with a capability rule:

1. **In-process supported only through the NetScript saga runtime**, never through direct task
   substitution. The saga package's store/transport/outbox/ idempotency ports remain authoritative.
   (Citations above.)
2. Each deploy preset declares `sagas: supported | externalized | rejected` and proves the
   declaration against duration, lifecycle, connector and durability gates. Nitro's own
   preset-dependent task behavior is evidence that this cannot be one global boolean.
   ([Nitro tasks](https://nitro.build/docs/tasks))
3. “Externalized” means the same app model splits saga resources into a macro-service; it is not a
   silent downgrade to best-effort tasks. The same app-model premise comes from issue #823, while
   this Stage-B finding limits the allowed realization.
   ([issue #823](https://github.com/rickylabs/netscript/issues/823))
