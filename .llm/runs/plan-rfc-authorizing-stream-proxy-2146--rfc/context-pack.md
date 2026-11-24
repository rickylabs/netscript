# Context Pack — plan-rfc-authorizing-stream-proxy-2146--rfc

- **Branch:** `plan/rfc-authorizing-stream-proxy-2146`
- **Baseline `main`:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Issue:** `rickylabs/netscript#2146` (design draft PR — `Refs #2146` only; no closing keywords)
- **Classification:** design draft awaiting owner acceptance (does not authorize implementation)
- **Primary deliverable:** `rfcs/0000-authorizing-stream-proxy.md`

## Core Design Decisions

1. **Zero new packages, strictly acyclic dependency DAG:**
   - `@netscript/contracts/streams`: runtime-free `defineStreamEndpoint`, `StreamEndpointContract`, `buildStreamEndpointUrl` (zero oRPC markers, zero IO).
   - `@netscript/service`: structural `StreamProxyMount`, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `createContractAuthorizer` parameterized `streamEndpoints` via `rou3`, OpenAPI `text/event-stream` projection, and pre-drain `shutdownSignal` aborted before `server.shutdown()` waits. Zero dependency on `@netscript/plugin-streams-core`.
   - `@netscript/plugin-streams-core/proxy`: `createNetScriptStreamProxy` and `bindStreamProxy` runtime, shared header sanitization, and cancel-safe upstream re-streaming.
   - `@netscript/fresh/streams`: additive `proxyUrl` option on `createNetScriptStreamEventSourceV1`.
   - `@netscript/fresh/ai`: `createNetScriptChatStreamProxy` kept backward-compatible, adopts shared sanitizer + stops forwarding client `Cookie` headers upstream, and can optionally delegate GET SSE reads to the revocable proxy.
2. **Policy owns sessions; atomic delivery-unit revocation gate:**
   - `authorize` runs before path resolution and upstream connect; returns opaque `TGrant` + optional `expiresAtMs`, `responseHeaders`, `setCookies`.
   - Upstream SSE frames are assembled into atomic delivery units (`[...dataFrames, controlFrame]`, bounded by `maxPendingBatchBytes`).
   - Serialized `recheck(..., 'before-delivery')` runs before releasing ANY byte of a delivery unit. Denial/revocation/expiry/error withholds both `data` and cursor-advancing `control`, emits zero fabricated frames, cancels and releases the upstream reader, clears timers/subscriptions, and closes downstream cleanly so reconnect hits fresh-admission `401`/`403`.
3. **Hybrid idle expiry & multi-gateway revocation:**
   - `ClockPort`-scheduled deadline timer at `expiresAtMs` + periodic `recheckEveryMs` idle timer (default 30 s) + optional push `revocationSource.subscribe(grant, notify)`.
   - Independent gateways share zero in-memory proxy state and coordinate exclusively through the application-provided shared revocation source.
4. **Security & CSRF/Origin:**
   - Strict upstream header allowlist (`accept`, `accept-encoding: identity`, trace headers, server-side `upstreamAuth()`). Client `Cookie` and `Authorization` never reach upstream; upstream `access-control-*` and `401`/`403` never leak verbatim downstream.
   - Cookie `EventSource` guarded by `Sec-Fetch-Site`, `Sec-Fetch-Dest`, and `Origin` against exact `allowedOrigins` (strict same-origin by default; wildcard rejected). Bearer-over-cookie precedence with zero silent downgrade.

## Boundaries Observed

- No edits under `packages/`, `plugins/`, or `docs/site/` (`#2650` edits Streams docs concurrently).
- `#2654` referenced as related write-side work only; not designed here.
- Run artifacts retain owner authorization text verbatim; RFC body carries no process language.

## Next Step

Independent design review (`feature/design_evaluation`, separate session, OpenAI family per `supervisor.md`) followed by owner RFC review and FCP disposition.
