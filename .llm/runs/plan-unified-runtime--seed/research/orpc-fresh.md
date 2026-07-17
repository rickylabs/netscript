# oRPC + Fresh 2 composition on Nitro v3

Research date: 2026-07-18. Live-doc extracts are preserved in
`.llm/tmp/docs/orpc-fresh-live-2026-07-18.md`; the original URLs remain the authority.

## Existing request/response seams

All three systems already meet at the Web Fetch API; the required bridge is routing and lifecycle
composition, not a new wire protocol.

| Layer                         | Current surface                                                                                                                                                                                                                                                                                                                            | Consequence for a Nitro host                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Nitro/H3                      | Nitro routes are H3 event handlers. oRPC's documented H3 adapter mounts `/rpc/**`, passes `event.req` to the Fetch `RPCHandler`, supplies a prefix/context, and returns the matched response. ([oRPC H3 adapter](https://orpc.dev/docs/adapters/h3))                                                                                       | Nitro can own the outer router while delegating the RPC subtree to oRPC's Fetch handler.                            |
| oRPC                          | The Fetch adapter accepts a Web `Request` and produces a response/match result across Fetch runtimes, including Deno. ([oRPC HTTP adapter](https://orpc.dev/docs/adapters/http))                                                                                                                                                           | The same RPC contract can be invoked through an H3 route or directly in-process; a loopback socket is not required. |
| NetScript service             | `ServiceApp` structurally exposes `fetch(request): Promise<Response>` and `request(...)`; `FetchHandler` exposes `handle(request): Promise<Response>`. (`packages/service/src/types.ts:13-20`, `packages/service/src/types.ts:206-212`)                                                                                                    | Nitro can mount the shipped service abstraction without exposing its internal router type.                          |
| NetScript oRPC implementation | `createRPCHandler()` constructs oRPC's Fetch `RPCHandler`, calls `handler.handle(request, { context })`, returns the response on a match, and emits a 404 otherwise. (`packages/service/src/primitives/handlers.ts:115-143`)                                                                                                               | The repository already owns an adapter boundary suitable for H3 delegation; unified runtime should reuse it.        |
| Fresh 2                       | `app.handler()` turns a Fresh app into a Request→Response handler expressly for embedding in another framework; `app.listen()` starts its own listener and must not be combined with another server startup. ([Fresh App docs](https://usefresh.dev/docs/concepts/app))                                                                    | A Nitro composition must call the Fresh handler, never `listen()`, and keep exactly one outer listener per process. |
| NetScript Fresh wrapper       | `defineFreshApp()` creates a Fresh `App`, installs state/security/tracing middleware, applies configuration, and then adds filesystem routes. (`packages/fresh/src/runtime/server/define-fresh-app.ts:1-119`) Its test invokes `app.handler()` with a Web `Request`. (`packages/fresh/src/runtime/server/define-fresh-app.test.ts:55-105`) | The shipped wrapper is already embeddable, but its middleware ordering and filesystem routes must remain intact.    |

The service builder currently returns a Hono-backed application, but its public result is the
structural `ServiceApp` Fetch surface rather than a Nitro- or H3-specific type.
(`packages/service/src/builder/service-builder-impl.ts:423-433`,
`packages/service/src/types.ts:13-20`) That separation is the compatibility asset: Nitro should
consume `fetch`, not reach into Hono.

## Proposed composition boundary

The smallest viable composition is one Nitro/H3 owner with two mounted Fetch delegates:

1. Mount the NetScript/oRPC `FetchHandler` under the declared RPC prefix and pass the request,
   request-scoped auth/telemetry context, and abort signal into the handler. This matches the live
   oRPC H3 pattern. ([oRPC H3 adapter](https://orpc.dev/docs/adapters/h3),
   `packages/service/src/primitives/handlers.ts:115-143`)
2. Mount the Fresh `app.handler()` for the UI route space or final application fallback. Do not
   invoke `app.listen()`, because Fresh documents that it creates a listener and warns against a
   second startup path. ([Fresh App docs](https://usefresh.dev/docs/concepts/app))
3. Let Nitro own process startup, shutdown, and top-level error observation; Nitro exposes
   `request`, `response`, `error`, and `close` lifecycle hooks.
   ([Nitro lifecycle docs](https://nitro.build/guide/lifecycle))

This composition preserves issue #451's intended invariant—identical Web Request/Response API paths
with no loopback network hop—without requiring Nitro to know the service builder's Hono
implementation. ([issue #451](https://github.com/rickylabs/netscript/issues/451),
`packages/service/src/types.ts:13-20`)

## Bridges the plan must specify

| Bridge                      | Required contract and risk                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route ownership             | Declare non-overlapping RPC, health/metadata, Fresh UI, and static-asset spaces. Fresh resolves middleware/routes top-to-bottom, while Nitro has its own public-assets and route pipeline, so an implicit catch-all can bypass Fresh middleware or shadow RPC. ([Fresh App docs](https://usefresh.dev/docs/concepts/app), [Nitro routing docs](https://nitro.build/guide/routing)) |
| Prefix and base path        | Carry one canonical mount prefix into both H3 matching and oRPC `handler.handle(..., { prefix })`; the live H3 example makes that prefix explicit. ([oRPC H3 adapter](https://orpc.dev/docs/adapters/h3))                                                                                                                                                                          |
| Context                     | Define how Nitro/H3 request state becomes NetScript auth, trace, and service context. The current service handler accepts a `context` factory, while the oRPC H3 example supplies request context at the adapter call. (`packages/service/src/primitives/handlers.ts:119-128`, [oRPC H3 adapter](https://orpc.dev/docs/adapters/h3))                                               |
| Error semantics             | Preserve oRPC match/404 behavior and decide which failures remain typed RPC errors versus reaching Nitro's top-level `error` hook. (`packages/service/src/primitives/handlers.ts:124-142`, [Nitro lifecycle docs](https://nitro.build/guide/lifecycle))                                                                                                                            |
| Lifecycle                   | Nitro's `close` hook must close NetScript adapters and background workers exactly once; embedding Fresh must not create its own listener. ([Nitro lifecycle docs](https://nitro.build/guide/lifecycle), [Fresh App docs](https://usefresh.dev/docs/concepts/app))                                                                                                                  |
| Streaming and upgrade paths | Treat ordinary Fetch responses, streamed responses, and WebSocket upgrades as distinct conformance cases. Nitro's WebSocket support is opt-in through CrossWS/H3, not implied by mounting an ordinary Fetch handler. ([Nitro WebSocket docs](https://nitro.build/guide/websocket))                                                                                                 |
| Static assets               | Choose whether Nitro or Fresh owns each asset namespace and test cache headers, fallbacks, and error pages through the composed entry point. Both frameworks have routing/asset stages, so ownership cannot be inferred from a shared Fetch type. ([Nitro routing docs](https://nitro.build/guide/routing), [Fresh App docs](https://usefresh.dev/docs/concepts/app))              |
| Version compatibility       | The repository pins oRPC `^1.14.6`, while the live oRPC H3 page currently announces a v2 public beta. The board must pin and conformance-test the adapter API rather than copying a beta example unqualified. (`packages/service/deno.json:10-20`, [oRPC H3 adapter](https://orpc.dev/docs/adapters/h3))                                                                           |

## Discovery verdict

**Feasible with a thin Fetch bridge.** Fresh 2 and the shipped NetScript service surface are both
embeddable Web Request→Response handlers, and oRPC publishes a direct H3 composition pattern.
([Fresh App docs](https://usefresh.dev/docs/concepts/app),
[oRPC H3 adapter](https://orpc.dev/docs/adapters/h3), `packages/service/src/types.ts:13-20`) The
planning burden is therefore a precise ownership and conformance contract—routing, context,
lifecycle, assets, streams/upgrades, and pinned oRPC version—not a rewrite of Fresh or service RPC
on H3.
