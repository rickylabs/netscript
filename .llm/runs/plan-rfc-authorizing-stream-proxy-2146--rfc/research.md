# Research — plan-rfc-authorizing-stream-proxy-2146--rfc

Baseline `main`: `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (2026-11-24).
Issue: `rickylabs/netscript#2146` (plus acceptance comment `issuecomment-7120816734`; related issue `#2654`).

## 1. MCP `find_guidance` and `deno doc` surface survey

Executed `deno run -A packages/cli/bin/netscript.ts agent mcp` (`find_guidance`) across four intents:

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
| Existing chat stream proxy | `packages/fresh/src/runtime/ai/stream-proxy.ts:55-84,97-229` | Chat-specific (`NetScriptChatSessionTarget`, `/ai/chat` default prefix), no `authorize` or revocation hook, copies incoming headers via `new Headers(request.headers)` (only deletes `host`), forces `accept-encoding: identity`, strips `content-encoding`/`content-length`/RFC 9110 §7.6.1 hop-by-hop headers, passes raw `upstream.body` without `restreamUpstreamBody`. |
| Streams front proxy & headers | `plugins/streams/services/src/proxy.ts:45,120-123,193-195`; `plugins/streams/services/src/proxy-headers.ts:44-142` | Bridges `404` for missing streams ONLY for `live=long-poll` (`isLiveLongPollRead`), NOT `live=sse`. Uses `restreamUpstreamBody` to avoid uncaught `AbortError` on disconnect. |
| Streams service startup | `plugins/streams/services/src/service.ts:24-56,88-162` | Uses `createPluginService` with `serveRpc: false` and `rawRoutes: [{ method: 'all', path: '/*', handler: proxyHandler }]`; requires `ServiceAuthPolicy`. |
| Streams core exports & deps | `packages/plugin-streams-core/deno.json:6-19`; `packages/plugin-streams-core/src/application/stream-url-resolver.ts:88-146`; `packages/plugin-streams-core/src/domain/constants.ts:11` | `@netscript/plugin-streams-core` ALREADY depends on `@netscript/service`; `@netscript/service` does NOT depend on `@netscript/plugin-streams-core`. `buildStreamUrl` always prepends `/v1/stream/netscript`. `getStreamsAuth` reads `STREAMS_SECRET` / `DURABLE_STREAMS_SECRET`. |
| SSE v1 contract | `packages/plugin-streams-core/src/domain/sse-contract-v1.ts:12-74,230-240`; `packages/plugin-streams-core/src/application/stream-sse-v1.ts:80-142,186-235` | Closed wire event set `['data', 'control']`. `reduceStreamSseReplayStateV1` buffers `pendingBatches` on `data` and commits `lastCommittedOffset` strictly on `control`. Rejects unknown event names with `unsupported-event`. |
| Fresh EventSource helper | `packages/fresh/src/runtime/streams/create-stream-event-source.ts:49-65` | Always computes `buildStreamUrl(options.streamPath, options.baseUrl ?? getStreamsUrl())`, forcing `/v1/stream/netscript` into the URL. |
| StreamDB recovery | `packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts:44-52,91-94,120-125` | Uses `live=false` + `live=long-poll`, classifies `401`/`403` as non-recoverable terminal `failed`. |
| `defineService` & `ServiceBuilder` | `packages/service/src/presets/define-service.ts:116-175,275-341`; `packages/service/src/builder/service-builder.ts:221-225`; `packages/service/src/builder/service-builder-impl.ts:494-524` | `DefineServiceOptions` has no `routes` or `streamProxies` mounting option. `createService().route(...)` exists at Layer 2 only. |
| Graceful shutdown gap | `packages/service/src/builder/service-listener.ts:98,132-148`; `packages/service/src/builder/service-shutdown.ts:96-147` | `ServiceShutdownCoordinator` aborts its private `#controller` at line 97 and awaits `server.shutdown()` (lines 100–103) BEFORE invoking `onShutdown` hooks (lines 110–136). Open SSE responses have no pre-drain shutdown signal today and would stall `server.shutdown()` until `drainTimeoutMs` (30 s). |
| Contract policy & OpenAPI | `packages/service/src/auth/options.ts:81-114`; `packages/service/src/auth/contract/contract-raw-routes.ts:12,43-49`; `packages/service/src/auth/contract/contract-procedure-index.ts:103-120,187-234`; `packages/service/src/primitives/openapi.ts:99-120,199-219` | `ContractAuthorizerRawRoute` rejects parameterized paths (`/[*:{}?#]/`). `traverseContract` expects every nested non-`~orpc` object to be an oRPC sub-router. `createOpenAPISpec` traverses only oRPC procedures. |
| Service CORS & BFF doctrine | `packages/service/src/middleware/service-cors.ts:31-51,59-94`; `docs/architecture/doctrine/07-composition-and-extension.md:307-332` | Wildcard CORS with credentials rejected at build time. BFF is ratified browser topology. |
| Auth sessions & revocation | `packages/plugin-auth-core/src/ports/mod.ts:85-106,251-288`; `packages/plugin-auth-core/src/streams/mod.ts:22-51`; `packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts:69-132`; `packages/service/src/auth/types.ts:49-58` | `AuthBackendPort` defines bearer-over-cookie precedence, `revokeSession`/`revokeSubjectSessions`, and `AuthnResult` carries `responseHeaders` + `setCookies` for refresh-on-read. `createAuthServiceAuthenticator` is bearer-only. `AUTH_STREAM_EVENT_TYPES` already includes `auth.session.revoked`. |
| Related issue #2654 | `packages/plugin-streams-core/src/application/create-service-stream-producer.ts:59-63`; `create-durable-stream.ts:78-80` | Producers consume process-wide `buildStreamUrl` / `getStreamsAuth`; #2654 is tracked independently and intentionally not designed in this RFC. |

## 3. Measured baseline probe (`main` `87965d80`)

Command executed against the workspace checkout:

```sh
deno eval '
import { DurableStreamTestServer } from "npm:@durable-streams/server";
import { getAvailablePort } from "jsr:@std/net@^1";
import { buildStreamUrl, createDurableStream } from "./packages/plugin-streams-core/mod.ts";
import { createStreamTopicFixture } from "./packages/plugin-streams-core/src/testing/mod.ts";
import { createNetScriptChatStreamProxy } from "./packages/fresh/src/runtime/ai/mod.ts";
import { createNetScriptStreamEventSourceV1 } from "./packages/fresh/src/runtime/streams/mod.ts";
import { createContractAuthorizer } from "./packages/service/src/auth/mod.ts";
// ... (probed chat proxy cookie forwarding, contract authorizer parameterized raw route error,
//      EventSource URL prefixing, and live DurableStreamTestServer SSE wire frames + offset resume)
'
```

Exit code: `0`. Verbatim output:

```text
CHAT_PROXY_FORWARDED_COOKIE: __Host-ns_session=synthetic-cookie
CHAT_PROXY_STATUS_WITHOUT_AUTH_HOOK: 200
CONTRACT_AUTHORIZER_PARAM_RAW_ROUTE_ERROR: [netscript.service.contract-policy] invalid raw route: /api/streams/{feedId} is not an exact absolute path
EVENT_SOURCE_RESOLVED_URL: https://app.example.test/api/streams/v1/stream/netscript/orders/live?offset=-1&live=sse
MISSING_SSE_STATUS: 404
SSE_STATUS: 200
SSE_CONTENT_TYPE: text/event-stream
SSE_ACAO: *
FRAME1_EVENT: event: data
FRAME2_EVENT: event: control
FRAME_HAS_ID_FIELD: false
CTRL1_KEYS: streamCursor,streamNextOffset,upToDate
LIVE_OFFSET_ADVANCED: true
RESUME_CONTAINS_A: false
RESUME_CONTAINS_B: true
RESUME_CONTROL_MATCHES_CTRL2: true
```

## 4. Architecture & debt check

- Checked `.llm/harness/debt/arch-debt.md` and `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`.
- No new architecture debt is introduced by this design draft; `packages/plugin-streams-core` (Archetype 3, verdict `Keep`), `packages/contracts` (Archetype 1, verdict `Keep`), `packages/fresh` (Archetype 4, verdict `Keep`), and `packages/service` (Archetype 4, verdict `Refactor`) remain within their doctrine archetypes with zero circular dependencies and zero new packages.
- Note: `.llm/tools/validation/check-internal-doc-links.ts` is the actual path of the repo's internal-doc link checker (exposed via `deno task docs:links`).
