# `@netscript/sdk` link-mode gap, the `@netscript/service` seam, and the "172a-2" naming collision

## 1. Current `createServiceClient` surface (read directly, not `deno doc`'d — source read in full)

`packages/sdk/src/client/service-client.ts`:

```ts
export function createServiceClient<TContract extends ContractLike>({
  contract, serviceName, routerName, protocol = 'http',
  apiPath = '/api/rpc', apiVersion = 'v1', propagateTraceContext = true,
}: CreateServiceClientOptions<TContract>): ServiceClient<TContract> {
  const pathSegment = routerName ?? serviceName;
  const link = createHttpClientLink({ contract, serviceName, pathSegment, protocol, apiPath,
    apiVersion, propagateTraceContext, getTraceHeaders });
  return createORPCClient(link) as ServiceClient<TContract>;
}
```

It is **hardwired to `createHttpClientLink`** — there is no `protocol: 'in-process'` option, no
mode switch, and no alternative link factory anywhere in `packages/sdk/src/client/` or
`packages/sdk/src/ports/`.

`createHttpClientLink` (`packages/sdk/src/client/http-client-link.ts`) wraps `@orpc/client/fetch`'s
`RPCLink`, resolves the target URL via `getServiceUrl(serviceName, protocol)` (Aspire
service-discovery env vars, `services__{name}__http__0`), and calls `globalThis.fetch(request,
init)` — always a real network round-trip, even to `127.0.0.1`.

## 2. The seam that already exists for link-mode

`packages/sdk/src/ports/client-link-factory.ts` defines the abstraction `createServiceClient`
actually depends on:

```ts
export interface ClientLinkPort<TContext> {
  call(path: readonly string[], input: unknown, options: ClientLinkCallOptions<TContext>): Promise<unknown>;
}
```

`createORPCClient(link)` accepts **any** `ClientLinkPort`-shaped object — `createHttpClientLink` is
just one implementation. This means an in-process link adapter is architecturally a **small,
additive** change: implement `ClientLinkPort` by calling a mounted service's fetch handler
directly instead of `globalThis.fetch`, and give `createServiceClient` a way to select it (a new
`protocol: 'in-process'` variant, or a distinct factory such as `createInProcessClientLink`).

## 3. The server-side half already exists — `@netscript/service`'s "RFC 14 unified-platform seam"

`packages/service/mod.ts` docstring (verbatim):

> "The service router is always an input to the builder. `build()` returns a non-listening
> `ServiceApp`, which keeps the **RFC 14 unified-platform seam** open for callers that mount
> service apps into another host. `serve()` starts a Deno listener and returns a `RunningService`
> handle..."

`docs/site/reference/service/index.md` repeats this near-verbatim. Reading
`packages/service/src/builder/service-builder-impl.ts` confirms the mechanics: `ServiceBuilderImpl`
wraps a `Hono` instance (`this.app`); `build()` installs auth/routes/error-handlers and returns
`this.app` typed as `ServiceApp`. A `Hono` instance exposes a standard `.fetch(request)` method —
so any caller holding a `ServiceApp` handle can invoke it **in-process**, with zero network hop,
today, with no new feature work.

**Conclusion: the hard, load-bearing part of "mount a NetScript service in-process" already ships.**
The only missing piece for `@netscript/sdk` link-mode is the client-side adapter described in §2 —
a `ClientLinkPort` implementation that holds a `ServiceApp` reference and calls `.fetch()` on it
instead of resolving a URL and calling `globalThis.fetch`. This is materially smaller in scope than
"build oRPC-router-as-in-process-fetch-handler mounting from scratch," which is how the topic spec
frames option (c)'s cost.

**Caveat:** this finding establishes *feasibility*, not a scoping estimate for the full desktop
single-process feature (which still needs the tursodb single-writer relocation — see
`offline-first-surface.md` — and the Aspire generator wiring in #375). It narrows one specific
sub-problem the topic spec called out as a gap.

## 4. The "172a-2 service-base-seam" naming collision

The topic-E spec instructs confirming "172a-2 service-base-seam status" before beta.8, and frames
it as tied to sdk link-mode + tursodb single-writer relocation. Investigation of GitHub PR #172
(fetched in full; **state: MERGED**, title "Re-architect plugin scaffold surface (#157): thin,
typesafe, no plugin-source copy", last activity 2026-06-30) shows this is a **different program**:

- PR #172 is about eliminating three overlapping, base-less plugin scaffolder mechanisms (a
  string-templating `PluginScaffolder`, a second thin-scaffold layer, and `src/scaffolding/`
  string-concatenation generators) in favor of **one core-owned plugin contract**, modeled on
  Vite's plugin architecture.
- Its "172a-2a" through "172a-2e" sub-slices are about a **base plugin contract + base service
  seam** (`@netscript/plugin/contract-base`, `BASE_PLUGIN_ERRORS`, `createPluginService`) for
  making the CLI's plugin scaffolding/connector system (workers → sagas → triggers/auth → streams)
  type-sound end to end (contract → handler → router), not about in-process service mounting or
  sdk transport modes.
- Final convergence state recorded in the PR's own comments: **workers, sagas, and auth reached
  full contract+service soundness; triggers reached contract-soundness with its connector still
  deferred; streams has no oRPC contract at all yet, with its connector also deferred** to a future
  shared-proxy slice (tracked as arch-debt, `triggers-connector-sound-deferred` and a streams
  counterpart in `.llm/harness/debt/arch-debt.md`).

**This is unrelated to `@netscript/sdk`'s link-mode gap or tursodb single-writer relocation.** The
topic-E spec's cross-reference to "172a-2 service-base-seam" as a beta.8 desktop dependency appears
to be a **naming collision or a mistaken cross-reference** — either the spec author conflated the
plugin-contract-base-seam program (real, merged, done) with a different, unbuilt in-process
mounting capability (real gap, described in §§1–3 above, currently untracked by any issue number),
or there is a real-but-non-obvious sequencing reason (e.g. the sdk link-mode work is meant to reuse
the now-SOUND `createPluginService` pattern as a template) that was not stated explicitly anywhere
found in this research pass.

**Presented as evidence + options, not a verdict, per task boundary:**

- **Option A:** Treat PR #172 as fully resolved and irrelevant to topic E; strike the "172a-2"
  cross-reference from the topic-E dependency list; track the actual sdk in-process link adapter
  as its own new, small, unblocked feature slice.
- **Option B:** Keep the cross-reference but retitle/reclarify it — the real dependency is not
  "172a-2 lands" (it already has) but "the sdk link-mode adapter reuses the soundness pattern
  156a-2 established" — i.e. a stylistic/pattern dependency, not a blocking one.
- **Option C:** If the spec author had a different PR/issue number in mind (not #172), that needs
  to be identified — no other GitHub artifact matching "172a-2" or "service-base-seam" in the sdk
  link-mode sense was found in this research pass (issue-number and worktree-text search covered).
