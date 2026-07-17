<!-- seed:plan-unified-runtime slot:UR-4 -->

# UR-4 — In-process oRPC host bridge over `ServiceApp.fetch` (context, abort, error semantics)

- **Slot:** UR-4
- **Owning pack:** D1 composition-host (draft D1-4)
- **Labels:** `type:feat`, `area:service`, `area:sdk`, `gate:jsr`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-1 (composition root), UR-11 (architecture contracts — SDK↔service export direction)
- **Blocks:** UR-10
- **Relationship to #451:** #451 stays **OPEN and KEEP** — see the supersession note below. UR-4
  does **not** carry `Closes #451`.

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-4 -->
>
> Invoke the service **in-process** by delegating the Web `Request` into the shipped
> `ServiceApp.fetch` / oRPC `RPCHandler` (`packages/service/src/primitives/handlers.ts:115-143`,
> `packages/service/src/types.ts:13-20`). Transport is **invocation placement over a stable Fetch/RPC
> contract** — "no socket loopback" is the requirement; a second codec is not. The host consumes
> `fetch` and does not reach into the Hono implementation. Carry one canonical RPC prefix into both H3
> matching and `handler.handle(..., { prefix })`; pass request-scoped auth/telemetry context (single
> `toServiceContext` seam) and the abort signal. RPC-domain errors serialize as typed responses and do
> not reach Nitro's `error` hook. Treat ordinary, streamed, and WebSocket-upgrade responses as
> distinct conformance cases (WebSocket is opt-in via CrossWS/H3, not implied — see **F-4**). See
> proposal.md §4.
>
> **Scope boundary — this is the host-side bridge only.** UR-4 realizes the composition host's
> in-process invocation seam. It is **not** the full public SDK transport surface tracked by #451
> (the transport discriminant/registry, `createInProcessClientLink`, `ServiceClientTransport`, the
> `transport` option, `createInProcessServiceClient`, HTTP-default compatibility, HTTP/in-process byte
> parity, W3C propagation, and the JSR/export gates). #451 stays open as its own SDK slice and is
> **not** closed by this card. The public dependency direction between the SDK and the service
> (#451 owner decision **O-1**, restored as **F-7**) is selected before the SDK slice starts; today
> the only transport seam that exists is the internal structural port at
> `packages/sdk/src/ports/client-link-factory.ts:17-24`, and `service-client.ts:40-61` always
> constructs `createHttpClientLink`.

## Acceptance / gates

- [ ] gate: in-process delegation over `ServiceApp.fetch`/`RPCHandler`; no socket loopback
- [ ] gate: single canonical prefix carried into H3 match and `handler.handle`
- [ ] gate: request context (single `toServiceContext` seam) + abort signal carried into handler
- [ ] gate: RPC match/404 preserved; RPC-domain errors returned as typed responses
- [ ] gate: ordinary and streamed responses exercised through the composed entry point (WebSocket-upgrade case per F-4)
- [ ] gate: no `Closes #451` — #451's SDK transport surface remains a separate open slice

## Fork deltas

**F-7 (SDK↔service dependency direction — restored #451 O-1).**
- **A (default) — import `type`:** the in-process link imports the `ServiceApp` type from
  `@netscript/service` and reuses the shipped structural port (`client-link-factory.ts`). Lowest
  duplication; couples SDK build-time to the service type surface.
- **B — mirror structural shape:** the SDK mirrors the `fetch(request): Promise<Response>` structural
  shape locally and takes no build dependency on `@netscript/service`. Preserves SDK→service
  decoupling at the cost of a maintained structural mirror. Selection changes UR-4's import graph and
  #451's acceptance; it does not change UR-4's gate boxes.

**F-4 (WebSocket/upgrade scope).**
- **A (default) — defer:** v1 exercises ordinary + streamed responses only; the WebSocket-upgrade
  conformance case moves to a later cell-proof card. Fifth gate box drops "WebSocket-upgrade".
- **B — include in v1:** add "WebSocket-upgrade responses exercised through the composed entry point"
  back into the fifth gate box; requires the CrossWS/H3 opt-in wired in v1.
