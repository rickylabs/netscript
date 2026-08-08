# feat(sdk): createServiceClient seals every oRPC link seam — headers, interceptors, plugins, fetch and the link itself are unreachable from the supported API — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-02 · **Proposed milestone:** `0.0.7` (post-rename-shift "Typed seams +
generation", SYNTHESIS §5.3) · **Labels:** `type:feat` `area:sdk` `area:service` `area:plugins`
`priority:p1` `status:triage` · **Depends on:** T1-01 (RFC-A ratification), T1-04 (transport-policy
consolidation must land first or concurrently)

## Summary

`CreateServiceClientOptions` is a closed nine-field record and `ServiceClientContext` is a closed
interface, so no consumer can add a header, an interceptor, a link plugin, a custom `fetch`, or a
typed per-call context field. The link factory that would let them work around it is
package-private, even though the ports module's own doc comment advertises "the transport seam". On
the server side `RPCHandlerConfig.plugins` exists but the builder never populates it, and the plugin
type it accepts hands `unknown` to plugin authors. The result is that the only supported way to send
one extra header is to fork ~90 lines of framework internals per app — and silently lose NetScript's
client span in the process.

## Evidence

- Corpus: `research/repo-audit/services-sdk.md` §2.1–§2.4, §3.1–§3.3, §3.6, gap register
  S4/S11/S12/S13/S21; `research/external/orpc.md` §4 (G2, G3, G6, G7), §5;
  `research/repo-audit/auth.md` §0 proof 1–2, §2.
- Source at baseline `fac9e339042c` (re-verified for this draft):
  - `packages/sdk/src/ports/service-client.ts:203-222` — nine fields:
    `contract, serviceName, routerName, protocol, apiPath, apiVersion, port, timeout,
    propagateTraceContext`. No `headers` / `fetch` / `interceptors` / `plugins` / `link` / context
    parameter.
  - `packages/sdk/src/ports/service-client.ts:129-155` — `ServiceClientContext` is a concrete
    interface (`signal`, `cache`, retry knobs, `traceHeaders`); `:160-171` hard-codes it into
    `ServiceClientMethod`.
  - `packages/sdk/src/client/service-client.ts:41-49` — `port` and `timeout` are never destructured;
    `packages/sdk/src/presets/define-services.ts:106-116` forwards both into that ignoring function,
    so the dead options look live at L2 and L3.
  - `packages/sdk/src/client/http-client-link.ts:82` (`method:` literal), `:82-101` (`headers`
    literal: `Content-Type` + optional trace), `:102-126` (`plugins` literal:
    `ClientRetryPlugin{retry:0}` + `DedupeRequestsPlugin` with frozen filter/groups), `:127+`
    (hard-coded `fetch` carrying the CLIENT span).
  - `packages/sdk/src/client/mod.ts:15-36` — exports only `createServiceClient`, `isDefinedError`,
    `safe`, and types. `createHttpClientLink` is private.
  - `packages/sdk/src/ports/mod.ts:7` — "…discovery metadata, and the transport seam" — while
    `packages/sdk/src/ports/client-link-factory.ts:18-25` (`ClientLinkPort`,
    `ClientLinkCallOptions`) is not exported from that module.
  - `packages/service/src/primitives/handlers.ts:41-58` — `RPCHandlerConfig` declares `plugins`,
    `tracing`, `errorHandling`, `deduplication`, `warnOnlyCodes`, `logging`, `debug`;
    `packages/service/src/builder/service-rpc.ts:57` calls
    `createRPCHandler(options?.rpcRouter ?? router, { serviceName, debug })` — nothing else is ever
    passed.
  - `packages/service/src/types.ts:216-225` — `ServiceHandlerPlugin.init?(options: unknown, router:
    unknown)`; `packages/logger/orpc-plugin.ts:11-42` redeclares shim option types because of it.
  - `packages/plugin/src/config/domain/plugin-contributions.ts:12-39` — no client-side contribution
    group.
- Upstream (pinned 1.14.6, surface identical to 1.14.15 per `research/external/orpc.md` §0):
  `StandardLinkOptions` (`interceptors`, `clientInterceptors`, `plugins`),
  `LinkFetchClientOptions` (`fetch`, `adapterInterceptors`, `plugins`),
  `StandardRPCLinkCodecOptions` (`headers`, `method`, `fallbackMethod`, `maxUrlLength`,
  `customJsonSerializers`), `ClientContext` as a free type parameter.

## Current surface

One constructor with no seams. `createServiceClient` builds `rpcPath`, calls the private
`createHttpClientLink`, and wraps the result in `createORPCClient`
(`packages/sdk/src/client/service-client.ts:41-66`). Consumers get exactly what that function
decided: two frozen client plugins, one header set, one `fetch`. `@netscript/sdk/desktop` proves the
link is swappable in principle (`packages/sdk/src/desktop/application/desktop-rpc-client.ts:18-20`
builds a MessagePort `RPCLink` with `customJsonSerializers`) and equally closed in practice. On the
server, `withRPC()` (`packages/service/src/builder/service-builder.ts:91-104`) and
`DefineServiceOptions` (`packages/service/src/presets/define-service.ts:112-143`) accept no
`plugins`, so a plugin that wants a server oRPC plugin must drop to L1 and hand-mount into Hono.

## Target contract

Per RFC-A §3.1–§3.5, §3.9, §3.10:

1. **Client construction opens.** `CreateServiceClientOptions<TContract, TWith>` gains an optional,
   ordered `with?: TWith` contribution chain and a mutually exclusive `link?: ClientLinkPort<…>`
   escape hatch. Omitting both yields byte-identical behaviour and types to today.
2. **Context becomes a parameter.** `ServiceClient<TContract, TContext>` and
   `ServiceClientMethod<TInput, TOutput, TError, TContext>`; `BaseServiceClientContext` is today's
   shape; `ServiceClientContext` survives one minor as a `@deprecated` alias.
3. **The transport seam is exported.** `createHttpClientLink` from `@netscript/sdk/client`;
   `ClientLinkPort` / `ClientLinkCallOptions` from `@netscript/sdk/ports` — closing the
   doc-vs-export contradiction at `packages/sdk/src/ports/mod.ts:7`.
4. **Framework defaults become contributions.** Retry, dedupe, and the CLIENT span are composed
   through the same public path, so there is no private fast lane.
5. **Dead options die.** `port` and `timeout` are removed from `CreateServiceClientOptions` and
   `DefineServiceConfig`; `timeout` is re-expressed as a contribution over `AbortSignal.timeout`.
6. **Server reachability + typing.** `withRPC()` and `DefineServiceOptions` accept `plugins` and
   `warnOnlyCodes` and pass them to `createRPCHandler`; `ServiceHandlerPlugin` is typed to upstream's
   `init?(options: StandardHandlerOptions<T>, router: Router<any, T>)`; the never-read
   `deduplication` option is either wired or removed.
7. **Env boundary.** Contribution `environment` is checked at construction; `server`-only in a
   browser build throws.

## Acceptance

- [ ] `createServiceClient` accepts an ordered contribution chain and composes headers, interceptors,
      client interceptors, adapter interceptors, link plugins and `fetch` from it.
- [ ] `createServiceClient` called without a chain produces the same request on the wire as today.
- [ ] A type fixture proves an existing nine-field call site compiles unchanged after the change.
- [ ] `ServiceClient` and `ServiceClientMethod` carry a client-context type parameter with
      `BaseServiceClientContext` as the default.
- [ ] `createHttpClientLink`, `ClientLinkPort` and `ClientLinkCallOptions` are exported from their
      documented subpaths.
- [ ] Retry, dedupe and the CLIENT span are composed through the public contribution path, not
      inline literals.
- [ ] `port` and `timeout` are removed from the client and `defineServices` option records.
- [ ] `withRPC()` and `defineService()` forward `plugins` and `warnOnlyCodes` to
      `createRPCHandler`, proven by a server test asserting a custom plugin's `init` ran.
- [ ] `ServiceHandlerPlugin.init` is typed to upstream's `StandardHandlerOptions`, and
      `packages/logger/orpc-plugin.ts` deletes its shim option types.
- [ ] `RPCHandlerConfig.deduplication` is either honoured by `createRPCPlugins` or removed.
- [ ] NEGATIVE: a test asserts a request carries no contribution-supplied header when the
      contribution is absent from the chain.
- [ ] NEGATIVE: a test asserts two contributions declaring the same header key fail at construction
      with both names in the message.
- [ ] NEGATIVE: a test asserts two contributions supplying `fetch` fail at construction.
- [ ] NEGATIVE: a type fixture asserts a contribution built against a future envelope version is not
      assignable to the current host.
- [ ] NEGATIVE: a test asserts a `server`-only contribution throws when constructed in a browser-like
      environment.
- [ ] `gate:` `deno task publish:dry-run` passes for `@netscript/sdk` and `@netscript/service` with
      `--isolatedDeclarations` intact.
- [ ] `gate:` `deno task check` and `deno task test` pass at the repo root.

## Boundaries

- Do **not** implement the auth contribution here — that is T1-05.
- Do **not** move trace-context propagation onto the chain here — that is T1-06.
- Do **not** repair `safe`/`isDefinedError` or `baseContract` here — that is T1-03.
- Do **not** change HTTP method inference or GET dedupe policy semantics here — that is T1-04.
- Do **not** duplicate **#451** (in-process link-mode adapter) — this issue creates the public link
  seam #451 needs; #451 stays open and separate.
- Do **not** duplicate **#1093** (discovery hardcodes official plugin factories). If a
  `PluginContributions` client group is added here rather than in T1-05, it must not use a closed
  literal union like `plugin-contributions.ts:16`.
- Do **not** duplicate **#928** / **#934** (frontend contribution contracts, deny-by-default
  gateway).
- Do **not** touch the query-key algebra, `createQueryFactory`'s dropped abort signal, or nested
  routers — T2 generation pack.
- Do **not** touch `PluginContractRouter = object` or the Hono-vs-oRPC middleware seam — T3.

## Docs/consumer proof

`docs/site/services-sdk/sdk.md` and `docs/site/reference/sdk/index.md` gain one worked contribution
example that compiles under the docs gate; `packages/sdk/README.md`'s export table lists the newly
exported transport seam; and the "escape hatch = fork the link" paragraph is deleted rather than
softened. Consumer proof is that an app can add one header without importing anything from
`@netscript/telemetry` and without losing its client span — assert the span is still emitted in the
same test that asserts the header.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/services-sdk.md` (S4, S11, S12, S13, S21), `research/external/orpc.md` (G2, G3,
G6, G7) and `research/repo-audit/auth.md` (G1); all cited lines re-verified against worktree baseline
`fac9e339042c`. No GitHub mutation was performed.
