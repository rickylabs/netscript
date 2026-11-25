# Context Pack — plan-rfc-authorizing-stream-proxy-2146--rfc

- **Branch:** `plan/rfc-authorizing-stream-proxy-2146`
- **Baseline `main`:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Issue:** `rickylabs/netscript#2146` (reference feature issue pending maintainer decision on a companion RFC tracking issue; design draft PR — `Refs #2146` only; no closing keywords)
- **Classification:** design draft awaiting owner acceptance (does not authorize implementation)
- **Primary deliverable:** `rfcs/0000-authorizing-stream-proxy.md`
- **Repeatable measurement fixture:** `.llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/baseline-probe.ts`

## Core Design Decisions (Round 2)

1. **Tight, acyclic v1 public surface (zero new packages, deferrals recorded):**
   - `@netscript/contracts/streams`: runtime-free `defineStreamEndpoint`, `buildStreamEndpointUrl`, `StreamEndpointContract`, `StreamEndpointClientAuthMode`.
   - `@netscript/service`: structural `StreamProxyMount`, `StreamProxyMountContext` (`params`, `principal`, `remoteAddr`, pre-drain `shutdownSignal`), `StreamProxyAdmissionMode` (`'service-auth' | 'proxy-self-contained'`), `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, authoritative stream-endpoint binding in `createContractAuthorizer` and `createContractOverlayAuthorizer`, and symmetric path-pattern intersection checks. Zero dependency on `@netscript/plugin-streams-core`.
   - `@netscript/plugin-streams-core/proxy`: `createNetScriptStreamProxy` and `bindStreamProxy` runtime; header hygiene helpers remain package-internal.
   - `@netscript/fresh/streams`: additive `proxyUrl` option on `createNetScriptStreamEventSourceV1` enforcing one offset authority with `options.offset`.
   - `@netscript/fresh/ai`: `createNetScriptChatStreamProxy` keeps legacy defaults 100% unchanged when `authorize` / `recheck` are omitted; adds opt-in revocable SSE delegation preserving `target`, `streamPath`, `query`, `auth`, and `fetch` overrides plus legacy `POST` and non-SSE `GET` regression coverage.
   - Explicitly deferred to follow-ups: OpenAPI/service-info SSE projection, `PluginServiceConfig.streamProxies`, and public sanitizer helper exports.
2. **Fenced atomic delivery-unit revocation & bounded SSE parser:**
   - Single incremental byte bound (`maxPendingBatchBytes`, default 4 MiB) across partial frames, accumulated `data` frames, `control` frames, and unterminated comments.
   - Mandatory validation of `event: control` against `STREAM_SSE_CONTRACT_V1.schemas.control` (non-empty `streamNextOffset`) before releasing pending data; premature EOF or malformed frames emit zero uncommitted bytes.
   - Monotonic per-reader `invalidationEpoch` fences stale in-flight `allow` results when a push `'recheck'` wake or expiry tick arrives during an in-flight check; post-await fence check and synchronous `controller.enqueue(U)` execute in one turn with `highWaterMark: 0`. Pull-only linearizability limit and WHATWG `close()` drain behavior are stated explicitly.
3. **Setup cancellation, finite expiry, subscription catch-up, and decoupled teardown:**
   - Finite `expiresAtMs` takes effect immediately upon `authorize` returning (governing setup + streaming); sliding extensions require finite `expiresAtMs > clock.nowMs()`.
   - Mandatory `'post-subscribe'` catch-up `recheck` immediately after `revocationSource.subscribe` closes the admission-to-subscription race.
   - All setup hooks receive linked `AbortSignal` + `ClockPort` timeouts and attach late-settlement disposers (`lateUnsub()`, `lateRes.body.cancel()`).
   - `closeOnce(reason)` closes downstream `controller.close()` synchronously before async upstream reader cancellation.
   - Pull-only idle upper bound explicitly includes `policyTimeoutMs` (`min(recheckEveryMs, remainingExpiryMs) + policyTimeoutMs`).
4. **Authoritative contract policy & dispatch-consistent overlap checks:**
   - Single registration rule: mounted `streamProxies` auto-bind into both `createContractAuthorizer` and `createContractOverlayAuthorizer` (closing overlay's unmatched `{ allow: true }` bypass); explicit `options.streamEndpoints` cross-checks exact equality and fails closed on omission/mismatch.
   - Corrected `auth-middleware.ts:192-201` interaction; explicit `admission: 'proxy-self-contained'` delegates exact `GET` only and enforces `endpoint.access` scopes/roles inside `bindStreamProxy`.
   - Symmetric `patternsIntersect` check catches concrete-inside-template, template-vs-template, RPC-mount, `rawRoutes`, and `retiredPaths` overlaps at `build()`.
5. **Credential selection, proxy-trusted Origin/Fetch Metadata, and 3-tier response header ownership:**
   - Deterministic `credentialMode` selection by `clientAuth`; malformed `Authorization` and mixed credentials on `'cookie'` fail closed `401`.
   - Cookie guard enforces `Sec-Fetch-Site`, `Sec-Fetch-Dest`, and `Origin` (with `ServiceProxyTrust` + `remoteAddr` effective-origin resolution; `Origin: null` always denied).
   - 3-tier response headers: strip static + dynamic `Connection`-nominated hop-by-hop fields and allowlist safe upstream metadata only; reserve mandatory cache/framing/CORS/auth/`Set-Cookie` headers against `decision.responseHeaders` (allow app cookie refresh strictly via `decision.setCookies`); write proxy mandatory headers last.
6. **One offset authority & dispose-and-rebuild reconnect:**
   - `options.offset` is sole authority on `createNetScriptStreamEventSourceV1` in `proxyUrl` mode (conflicting/duplicate `?offset=` throws `TypeError`); native `EventSource` reconnect uses dispose-and-rebuild from `snapshot().lastCommittedOffset`; gap-free resume conditioned on upstream retention (`410 Gone` propagated after admission).

## Boundaries Observed

- No edits under `packages/`, `plugins/`, `docs/site/` (`#2650`), `.github/`, or `deno.lock`.
- `#2654` referenced as related write-side work only; not designed here.
- No new GitHub issue filed; `#2146` noted as reference issue pending maintainer decision.
- Run artifacts retain owner authorization text verbatim; RFC body carries no process language, no FCP prose, and no literal example hostnames.

## Next Step

Fresh independent design review (round 2) at the revised head SHA, followed by owner RFC disposition.
