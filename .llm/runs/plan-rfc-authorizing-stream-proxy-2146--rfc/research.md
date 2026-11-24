# Research — plan-rfc-authorizing-stream-proxy-2146--rfc

Baseline `main`: `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (2026-11-24).
Issue: `rickylabs/netscript#2146` (plus acceptance comment `issuecomment-7120816734`; related issue `#2654`).

## 1. MCP `find_guidance` and `deno doc` surface survey

Executed `deno run -A --frozen packages/cli/bin/netscript.ts agent mcp` (`find_guidance`) across four intents:

- `durable streams SSE stream proxy bearer cookie offset resume` → surfaced `@netscript/plugin-streams-core/sse` (`STREAM_SSE_CONTRACT_V1`), retention/trim, root `@netscript/plugin-streams-core`, and Expo streams resume/readiness.
- `createNetScriptChatStreamProxy packages/fresh AI chat stream proxy` (high confidence) → surfaced `pages/ai/durable-chat` and `createNetScriptChatStreamProxy`.
- `defineService service routes Hono HTTP endpoints middleware contracts` (high confidence) → surfaced `pages/services-sdk/services` (`defineService`, OpenAPI/Scalar, anonymous route protection).
- `auth sessions cookie bearer BFF session verification revocation` → surfaced `pages/identity-access/session-lifecycles` (sealed-cookie vs bearer paths, `better-auth` `responseHeaders`/`setCookies` forwarding, `kv-oauth`, `workos` stateless bearer).

Ran `deno doc` across:
- `packages/plugin-streams-core/mod.ts` and `packages/plugin-streams-core/src/sse/mod.ts`
- `plugins/streams/mod.ts`
- `packages/fresh/src/runtime/ai/mod.ts` and `packages/fresh/src/runtime/streams/mod.ts`
- `packages/service/mod.ts` and `packages/service/src/auth/mod.ts`
- `packages/contracts/mod.ts`
- `packages/plugin-auth-core/mod.ts`

## 2. Source-inspected findings (`main` `87965d80`)

| Area | Source location | Verified fact |
| --- | --- | --- |
| Existing chat stream proxy & tests | `packages/fresh/src/runtime/ai/stream-proxy.ts:55-84,97-229`; `packages/fresh/src/runtime/ai/stream-proxy_test.ts:17-323` | Chat-specific (`NetScriptChatSessionTarget`, `/ai/chat` default prefix), no `authorize` or revocation hook, copies incoming headers via `new Headers(request.headers)` (only deletes `host`), forces `accept-encoding: identity`, strips `content-encoding`/`content-length`/static RFC 9110 §7.6.1 hop-by-hop headers (not dynamic `Connection`-nominated tokens), passes raw `upstream.body` without `restreamUpstreamBody`. Existing regression suite tests `POST` and non-SSE `GET` (`application/json`, `etag`), query `id`-dropping, repeated keys, collision precedence, custom `query` hook, and `AbortSignal` cancellation. |
| Streams front proxy & headers | `plugins/streams/services/src/proxy.ts:45,120-123,193-195`; `plugins/streams/services/src/proxy-headers.ts:44-142` | Bridges `404` for missing streams ONLY for `live=long-poll` (`isLiveLongPollRead`), NOT `live=sse`. Uses `restreamUpstreamBody` to avoid uncaught `AbortError` on disconnect. |
| Streams service startup | `plugins/streams/services/src/service.ts:24-56,88-162` | Uses `createPluginService` with `serveRpc: false` and `rawRoutes: [{ method: 'all', path: '/*', handler: proxyHandler }]`; requires `ServiceAuthPolicy`. |
| Streams core exports & deps | `packages/plugin-streams-core/deno.json:6-19`; `packages/plugin-streams-core/src/application/stream-url-resolver.ts:88-146`; `packages/plugin-streams-core/src/domain/constants.ts:11` | `@netscript/plugin-streams-core` ALREADY depends on `@netscript/service`; `@netscript/service` does NOT depend on `@netscript/plugin-streams-core`. `buildStreamUrl` always prepends `/v1/stream/netscript`. `getStreamsAuth` reads `STREAMS_SECRET` / `DURABLE_STREAMS_SECRET`. |
| SSE v1 contract | `packages/plugin-streams-core/src/domain/sse-contract-v1.ts:12-74,195-200,230-240`; `packages/plugin-streams-core/src/application/stream-sse-v1.ts:80-142,186-235` | Closed wire event set `['data', 'control']`. `isControlPayload` requires a JSON object with non-empty string `streamNextOffset`. `reduceStreamSseReplayStateV1` buffers `pendingBatches` on `data` and commits `lastCommittedOffset` strictly on `control`. Rejects unknown event names with `unsupported-event`. |
| Fresh EventSource helper | `packages/fresh/src/runtime/streams/create-stream-event-source.ts:49-65` | Always computes `buildStreamUrl(options.streamPath, options.baseUrl ?? getStreamsUrl())`, forcing `/v1/stream/netscript` into the URL. |
| StreamDB recovery | `packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts:44-52,91-94,120-125` | Uses `live=false` + `live=long-poll`, classifies `401`/`403` as non-recoverable terminal `failed`. |
| `defineService` & `ServiceBuilder` | `packages/service/src/presets/define-service.ts:116-175,275-341`; `packages/service/src/builder/service-builder.ts:221-225`; `packages/service/src/builder/service-builder-impl.ts:494-610` | `DefineServiceOptions` has no `routes` or `streamProxies` mounting option. `createService().route(...)` exists at Layer 2 only. |
| Graceful shutdown gap | `packages/service/src/builder/service-listener.ts:98,113-114,132-148`; `packages/service/src/builder/service-shutdown.ts:47,96-147`; `packages/service/src/types.ts:15-18` | Listener passes only `{ remoteAddr: info.remoteAddr }` into `app.fetch`. `ServiceShutdownCoordinator` stores `#controller` privately, aborts it at line 96 and awaits `server.shutdown()` (lines 100–103) BEFORE invoking `onShutdown` hooks (lines 109–136). Open SSE responses have no pre-drain shutdown signal today and would stall `server.shutdown()` until `drainTimeoutMs` (30 s). |
| Contract policy, authn middleware & overlay | `packages/service/src/auth/auth-middleware.ts:192-201,268-279`; `packages/service/src/auth/contract/contract-authorizer.ts:78-140`; `packages/service/src/auth/contract/contract-overlay-authorizer.ts:64-99`; `packages/service/src/auth/contract/contract-raw-routes.ts:12,43-49`; `packages/service/src/auth/contract/contract-procedure-index.ts:103-120,187-234`; `packages/service/src/auth/options.ts:81-128` | `requiresAuthentication` (`auth-middleware.ts:192-201`) returns `true` for any matched non-`'none'` route regardless of `authn.protect` or `allowAnonymous`. `createContractOverlayAuthorizer` (`contract-overlay-authorizer.ts:94-98`) defaults to `{ allow: true }` on unmatched requests when no fallback is supplied. `ProcedureIndex.claims(path)` (`contract-procedure-index.ts:115-120`) performs literal `findRoute` lookup and misses a concrete oRPC route inside a parameterized template. `ContractAuthorizerRawRoute` rejects parameterized paths (`/[*:{}?#]/`). |
| Proxy trust, CORS & BFF doctrine | `packages/service/src/rate-limit/middleware/client-address.ts:27-48`; `packages/service/src/rate-limit/middleware/options.ts:6`; `packages/service/src/middleware/service-cors.ts:31-51,59-107`; `docs/architecture/doctrine/07-composition-and-extension.md:307-332` | `ServiceProxyTrust` (`false | ((address: string) => boolean)`) requires socket `remoteAddr` metadata before trusting forwarded headers. `createServiceCorsMiddleware` snapshots/restores all 6 `Access-Control-*` headers and unions `Vary` tokens (`unionVary`). Wildcard CORS with credentials is rejected at build time. BFF is ratified browser topology. |
| Auth sessions & revocation | `packages/plugin-auth-core/src/ports/mod.ts:85-106,251-288`; `packages/plugin-auth-core/src/streams/mod.ts:22-51`; `packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts:69-132`; `packages/service/src/auth/types.ts:49-58` | `AuthBackendPort` defines bearer-over-cookie precedence, `revokeSession`/`revokeSubjectSessions`, and `AuthnResult` carries `responseHeaders` + `setCookies` for refresh-on-read. `createAuthServiceAuthenticator` is bearer-only. `AUTH_STREAM_EVENT_TYPES` already includes `auth.session.revoked`. |
| Related issue #2654 | `packages/plugin-streams-core/src/application/create-service-stream-producer.ts:59-63`; `create-durable-stream.ts:78-80` | Producers consume process-wide `DURABLE_STREAMS_URL` / `getStreamsAuth`; #2654 is tracked independently and intentionally not designed in this RFC. |

## 3. Runnable synthetic baseline probe (`main` `87965d80`)

The committed, repeatable synthetic fixture lives alongside this file at
`.llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/baseline-probe.ts`.

Command executed from repository root:

```sh
deno run -A --frozen .llm/runs/plan-rfc-authorizing-stream-proxy-2146--rfc/baseline-probe.ts
```

Exit code: `0`. Verbatim output:

```text
CHAT_GET_STATUS_WITHOUT_AUTH_HOOK 200 FORWARDED_SYNTHETIC_COOKIE true
PARAMETERIZED_RAW_ROUTE [netscript.service.contract-policy] invalid raw route: /api/streams/{feedId} is not an exact absolute path
EVENT_SOURCE_PATH_AND_QUERY /api/streams/v1/stream/netscript/orders/live?offset=-1&live=sse
MISSING_SSE_STATUS 404
SSE_STATUS 200 TYPE text/event-stream ACAO *
FRAMES event: data, event: control HAS_SSE_ID false
CONTROL_FIELDS streamCursor,streamNextOffset,upToDate
OFFSET_ADVANCED true RESUME_CONTAINS_FIRST false RESUME_CONTAINS_SECOND true RESUME_OFFSET_MATCHES true
```

## 4. Architecture & debt check

- Checked `.llm/harness/debt/arch-debt.md` and `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
- No new architecture debt is introduced by this design draft; `packages/plugin-streams-core` (Archetype 3, verdict `Keep`), `packages/contracts` (Archetype 1, verdict `Keep`), `packages/fresh` (Archetype 4, verdict `Keep`), and `packages/service` (Archetype 4, verdict `Refactor`) remain within their doctrine archetypes with zero circular dependencies and zero new packages.
- Note: `.llm/tools/validation/check-internal-doc-links.ts` is the actual path of the repo's internal-doc link checker (exposed via `deno task docs:links`).
