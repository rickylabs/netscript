---
rfc: 0000
title: Revocable authorizing stream proxy for bearer and cookie clients
status: Draft
authors: ['@rickylabs']
created: 2026-11-24
tracking-issue: https://github.com/rickylabs/netscript/issues/2146
target-milestone: 0.0.10
---

# Revocable authorizing stream proxy for bearer and cookie clients

## Summary

This RFC proposes a generic, revocable authorizing Server-Sent Events (SSE) stream proxy for
NetScript Durable Streams:

1. A runtime-free stream endpoint contract (`defineStreamEndpoint`) in `@netscript/contracts/streams`
   that declares parameterized stream proxy routes, path and query schemas, `access` metadata, and
   accepted client authentication transports (`bearer`, `cookie`, or `bearer-or-cookie`).
2. A revocable SSE proxy runtime (`createNetScriptStreamProxy` and `bindStreamProxy`) in
   `@netscript/plugin-streams-core/proxy` that delegates session identity, admission, re-check, and
   revocation decisions exclusively to an application-supplied policy — the proxy never owns
   sessions. Authorization is checked on admission and **before each SSE batch and its
   cursor-advancing `control` frame are released**, so a revoked or expired reader never receives a
   batch admitted after revocation, never advances its committed offset past withheld data, closes
   cleanly, releases its upstream reader, and fails fresh admission.
3. First-class mounting in `@netscript/service` (`ServiceBuilder.withStreamProxy` and
   `DefineServiceOptions.streamProxies`), parameterized stream-endpoint policy enforcement in
   `createContractAuthorizer`, OpenAPI `text/event-stream` projection, and pre-drain shutdown
   cancellation so active SSE readers close cleanly on `RunningService.stop()`.
4. A clear consolidation path with `createNetScriptChatStreamProxy` (`@netscript/fresh/ai`), sharing
   header sanitization and cancel-safe upstream re-streaming in `@netscript/plugin-streams-core/proxy`
   while preserving backward compatibility for existing durable-chat routes.

## Motivation

### Current baseline

Every fact below was verified against repository `main` (`87965d80`) by direct source inspection or
local execution against the shipped workspace packages:

| Current fact | Evidence | Consequence |
| --- | --- | --- |
| The Durable Streams service (`startStreamsService`) protects upstream streams with one service-level auth policy (typically a shared bearer secret via `STREAMS_SECRET` / `DURABLE_STREAMS_SECRET`, resolved by `getStreamsAuth()`). | Source-inspected: [service.ts:88-162](../plugins/streams/services/src/service.ts#L88-L162), [stream-url-resolver.ts:125-139](../packages/plugin-streams-core/src/application/stream-url-resolver.ts#L125-L139) | Browser `EventSource` cannot attach custom `Authorization` headers, and the shared server secret must never reach the browser. |
| The only exported stream proxy in the workspace is `createNetScriptChatStreamProxy` in `@netscript/fresh/ai`. It is chat-session-specific (`NetScriptChatSessionTarget`, default prefix `/ai/chat`), carries no `authorize` or revocation hook, and forwards incoming client `Cookie` headers verbatim to upstream via `new Headers(request.headers)`. | Source-inspected: [stream-proxy.ts:97-229](../packages/fresh/src/runtime/ai/stream-proxy.ts#L97-L229), [create-chat-connection.ts:47,66-72](../packages/fresh/src/runtime/ai/create-chat-connection.ts#L47); measured: `createNetScriptChatStreamProxy` returned HTTP `200` with no auth hook and forwarded `Cookie: __Host-ns_session=synthetic-cookie` upstream. | Consuming applications that expose non-chat durable streams to browsers or bearer clients must hand-write SSE proxies, and GET chat stream reads lack revocable authorization. |
| Header-hygiene sanitization (`content-encoding`, `content-length`, RFC 9110 §7.6.1 hop-by-hop stripping) is duplicated between `plugins/streams/services/src/proxy-headers.ts` and `packages/fresh/src/runtime/ai/stream-proxy.ts`; moreover, `stream-proxy.ts` forwards raw `upstream.body` without the cancel-safe `restreamUpstreamBody` wrapper. | Source-inspected: [proxy-headers.ts:44-142](../plugins/streams/services/src/proxy-headers.ts#L44-L142), [stream-proxy.ts:20-23,55-84](../packages/fresh/src/runtime/ai/stream-proxy.ts#L20-L23) | Every hand-rolled app proxy risks the mislabeled `content-encoding: gzip` / stale `content-length` corruption bug and uncaught `AbortError` leaks on disconnect. |
| Upstream `DurableStreamTestServer` serves `live=sse` with `content-type: text/event-stream`, emits `access-control-allow-origin: *`, pairs `event: data` frames with cursor-advancing `event: control` frames (`streamNextOffset`, `streamCursor`, `upToDate`), emits no SSE `id:` field, resumes cleanly from `?offset=<streamNextOffset>`, and answers missing streams with HTTP `404`. | Measured via `deno eval` against `DurableStreamTestServer` (`87965d80`): `SSE_STATUS: 200`, `SSE_ACAO: *`, `FRAME1_EVENT: event: data`, `FRAME2_EVENT: event: control`, `FRAME_HAS_ID_FIELD: false`, `CTRL1_KEYS: streamCursor,streamNextOffset,upToDate`, `LIVE_OFFSET_ADVANCED: true`, `RESUME_CONTAINS_A: false`, `RESUME_CONTAINS_B: true`, `MISSING_SSE_STATUS: 404`. | A safe proxy must strip upstream wildcard CORS headers, preserve `STREAM_SSE_CONTRACT_V1` `data`/`control` framing, forward opaque `?offset=` resume tokens, and gate release at the `(data[], control)` delivery boundary. |
| `plugins/streams/services/src/proxy.ts` bridges `404` for not-yet-created streams only on `live=long-poll`, not on `live=sse`. | Source-inspected: [proxy.ts:45,120-123,193-195](../plugins/streams/services/src/proxy.ts#L120-L123) | Missing streams return `404` on `live=sse`; authorization must execute before upstream contact so unauthenticated callers cannot probe stream existence. |
| `DefineServiceOptions` in `@netscript/service` has no custom route or stream-proxy mounting option (`createService().route(...)` exists only at Layer 2), and `ServiceShutdownCoordinator` awaits `server.shutdown()` before running `onShutdown` hooks without exposing a pre-drain `AbortSignal` to route handlers. | Source-inspected: [define-service.ts:116-175,275-341](../packages/service/src/presets/define-service.ts#L116-L175), [service-builder.ts:221-225](../packages/service/src/builder/service-builder.ts#L221-L225), [service-listener.ts:98,132-148](../packages/service/src/builder/service-listener.ts#L98), [service-shutdown.ts:96-147](../packages/service/src/builder/service-shutdown.ts#L96-L147) | `defineService()` apps cannot mount SSE proxies without dropping to Layer 2, and open SSE responses would stall graceful shutdown until `drainTimeoutMs` (default 30 s) expires. |
| `createContractAuthorizer` rejects unmatched routes with `404 procedure_not_found`, and `ContractAuthorizerRawRoute` forbids parameterized paths (`/[*:{}?#]/`). `createOpenAPISpec` traverses only oRPC procedures. | Source-inspected: [contract-authorizer.ts:114-120](../packages/service/src/auth/contract/contract-authorizer.ts#L114-L120), [contract-raw-routes.ts:12,43-49](../packages/service/src/auth/contract/contract-raw-routes.ts#L12), [openapi.ts:99-120,199-219](../packages/service/src/primitives/openapi.ts#L99-L120); measured: `createContractAuthorizer({}, { rawRoutes: [{ path: "/api/streams/{feedId}", authentication: "required" }] })` throws `[netscript.service.contract-policy] invalid raw route: /api/streams/{feedId} is not an exact absolute path`. | Parameterized stream endpoints like `/api/streams/projects/{projectId}` cannot be declared in contracts, authorized via `createContractAuthorizer`, or documented in OpenAPI. |
| `createNetScriptStreamEventSourceV1` in `@netscript/fresh/streams` always calls `buildStreamUrl(options.streamPath, options.baseUrl ?? getStreamsUrl())`, which unconditionally prepends `/v1/stream/netscript`. | Source-inspected: [create-stream-event-source.ts:49-55](../packages/fresh/src/runtime/streams/create-stream-event-source.ts#L49-L55), [stream-url-resolver.ts:142-146](../packages/plugin-streams-core/src/application/stream-url-resolver.ts#L142-L146), [constants.ts:11](../packages/plugin-streams-core/src/domain/constants.ts#L11); measured: `baseUrl: "https://app.example.test/api/streams"` + `streamPath: "/orders/live"` resolves to `https://app.example.test/api/streams/v1/stream/netscript/orders/live?offset=-1&live=sse`. | Browser consumers using `createNetScriptStreamEventSourceV1` cannot target an application's custom proxy endpoint path without hand-constructing `new EventSource(...)` and calling `bindStreamEventSourceV1` manually. |
| `STREAM_SSE_CONTRACT_V1` in `@netscript/plugin-streams-core/sse` defines the closed wire event set `['data', 'control']` and commits `lastCommittedOffset` strictly on `control` frames. | Source-inspected: [sse-contract-v1.ts:12-15,65-74,230-240](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L12-L15), [stream-sse-v1.ts:80-142](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L80-L142) | Mid-stream revocation must never emit an unauthorized `data` batch, must never emit its committing `control` frame, and must never fabricate `streamClosed: true` or unknown wire event names. |

### User problem

Consuming applications expose live Durable Streams feeds (job progress, operational feeds,
collaborative state, notifications) to two kinds of clients:

- **Cookie clients** — browser pages and Fresh islands using native `EventSource` (or credentialed
  `fetch`) over the ratified same-origin BFF topology
  ([07-composition-and-extension.md](../docs/architecture/doctrine/07-composition-and-extension.md),
  Browser authentication topology),
  where first-party session cookies authenticate requests and `EventSource` cannot send custom
  `Authorization` headers.
- **Bearer clients** — mobile apps, CLI tools, non-browser API consumers, and backend services
  attaching `Authorization: Bearer <token>` headers to streaming HTTP `GET` requests.

Both client classes need opaque `?offset=` resume, server-side injection of the upstream Streams
bearer credential (which must never reach browsers), and **real-time revocation**: when a session is
revoked, signed out, downgraded, or expires — including when the revocation is initiated on a
different gateway instance — an already-open SSE reader must stop receiving data immediately, must
not receive any batch admitted after revocation or its cursor-advancing control frame, must release
its upstream Streams connection, and must fail fresh admission.

Without a first-party primitive, every consuming application writes ad-hoc streaming glue that
repeatedly misses subtle HTTP/SSE, header-hygiene, backpressure, CSRF, shutdown, and revocation-race
edge cases.

### Goals

This RFC MUST:

1. Define a runtime-free, upstream-oRPC-free contract declaration for authorizing SSE stream proxy
   endpoints (`defineStreamEndpoint`) carrying parameterized paths, schemas, access metadata, and
   client credential transport mode.
2. Provide a generic, framework-native SSE proxy (`createNetScriptStreamProxy` and
   `bindStreamProxy`) usable in `defineService`, `createService`, `createPluginService`, and Fresh
   2.x route handlers without importing Fresh/Preact into backend services.
3. Keep session identity, session storage, and authorization/revocation decisions strictly in
   application policy; the proxy owns zero session state.
4. Enforce **atomic delivery-unit authorization**: check policy before releasing each batch
   (`event: data` frame(s)) and its cursor-advancing `event: control` frame, so a revoked or expired
   reader receives neither and never advances its committed offset.
5. Close revoked and expired readers cleanly, release their upstream readers and sockets without
   leaking uncaught `AbortError`s or timers, and fail fresh admission with `401`/`403`.
6. Bound idle readers deterministically via an injected clock port (`expiresAtMs` expiry timer and
   periodic `recheckEveryMs` idle checks) plus optional push wakeups from a shared application
   revocation source for multi-gateway deployments.
7. Support both bearer and cookie clients with identical opaque `?offset=` resume semantics, strict
   upstream secret isolation, explicit upstream header allowlisting, and CSRF/Origin protection for
   cookie `EventSource` requests.
8. Establish an explicit relationship and non-breaking migration path with
   `createNetScriptChatStreamProxy` (`@netscript/fresh/ai`).
9. Define executable acceptance tests as the mandatory implementation gate.

### Non-goals

This RFC does NOT:

- Own or standardize application session storage, session revocation storage, or auth-provider
  protocols (`@netscript/plugin-auth-core` and its adapters remain separate and optional; any
  application policy works).
- Design producer-scoped connection configuration for `createServiceStreamProducer` /
  `createDurableStream`; issue [#2654](https://github.com/rickylabs/netscript/issues/2654) tracks
  that write-side capability independently. (This RFC's read-side `baseUrl` and `upstreamAuth`
  callbacks remain aligned with per-instance connection overrides.)
- Change the `STREAM_SSE_CONTRACT_V1` wire envelope (`['data', 'control']`) or the Durable Streams
  protocol specification.
- Replace `createNetScriptStreamDB` long-poll/snapshot reads or `POST`-based chat turn submission
  in `toNetScriptChatResponse`.
- Introduce a distributed pub/sub broker or cluster bus in `@netscript/plugin-streams-core`;
  multi-gateway revocation operates through an application-provided shared revocation source.

## Terminology

- **Admission**: The initial per-request authorization check performed before resolving the
  upstream stream URL or opening an upstream Durable Streams connection.
- **Application authorization policy**: Caller-supplied logic (`authorize`, `recheck`, and optional
  `revocationSource`) that resolves session identity, decides whether a request or active grant is
  authorized, and owns revocation state. The proxy treats the grant returned by `authorize` as
  opaque.
- **Authorization grant (`TGrant`)**: The opaque value returned by `authorize` upon admission and
  passed back into `resolvePath`, `recheck`, and `revocationSource.subscribe`. The proxy never
  inspects, serializes, logs, or persists `TGrant`.
- **Delivery unit**: One atomic SSE emission unit from upstream consisting of zero or more
  `event: data` frames paired with the immediately following `event: control` frame that advances
  `streamNextOffset` (or marks `upToDate` / `streamClosed`).
- **Cursor-advancing control**: An `event: control` SSE frame carrying `streamNextOffset` (and
  optionally `streamCursor`, `upToDate`, `streamClosed`) that commits pending `event: data` batches
  in `reduceStreamSseReplayStateV1`.
- **Re-check**: An asynchronous or synchronous invocation of the application policy's `recheck`
  hook on an admitted reader — triggered before releasing a delivery unit, at an idle interval, at
  session expiry, or on a push revocation signal.
- **Revocation source**: An application-provided shared state store and/or push notification seam
  (such as Deno KV, Postgres, Redis, or an auth service) shared across multiple gateway instances.
- **Gateway**: One running service or Fresh server instance hosting the authorizing stream proxy.

## Guide-level explanation

### 1. Declare the stream endpoint in a contract

Stream proxy endpoints live beside a service's oRPC procedures in its contract module using
`@netscript/contracts/streams`. The declaration is pure data with Standard Schema validation and no
runtime dependencies:

```ts
// contracts/feeds.contract.ts
import { defineStreamEndpoint } from '@netscript/contracts/streams';
import { z } from 'zod';

export const projectFeedStream = defineStreamEndpoint({
  id: 'projects.feed',
  path: '/api/streams/projects/{projectId}',
  params: z.object({
    projectId: z.string().min(1),
  }),
  query: z.object({
    view: z.enum(['summary', 'full']).optional(),
  }),
  clientAuth: 'bearer-or-cookie',
  access: {
    authentication: 'required',
    authorization: { scopes: ['projects:read'] },
  },
  summary: 'Live durable event stream for one project',
});
```

### 2. Mount in a `defineService` app with revocable application policy

The application owns session verification, project membership checks, and its shared revocation
source. The proxy owns SSE framing, pre-delivery authorization gating, expiry/idle timers, header
hygiene, upstream secret injection, and reader teardown:

```ts
// services/projects/main.ts
import { defineService } from '@netscript/service';
import { createContractAuthorizer } from '@netscript/service/auth';
import { bindStreamProxy } from '@netscript/plugin-streams-core/proxy';
import { projectFeedStream } from './contracts/feeds.contract.ts';
import { router } from './router.ts';
import { appContract } from './contracts/app.contract.ts';
import { sessionPolicy, sharedRevocationSource } from './auth/session-policy.ts';

const feedProxy = bindStreamProxy(projectFeedStream, {
  authorize: async ({ request, params, principal }) => {
    // Application resolves bearer or cookie session identity and resource access.
    const session = await sessionPolicy.resolveAndAuthorize(request, {
      principal,
      projectId: params.projectId,
    });
    if (!session.ok) {
      return { allow: false, status: session.status, reason: session.reason };
    }
    return {
      allow: true,
      grant: { sessionId: session.id, subject: session.subject, projectId: params.projectId },
      expiresAtMs: session.expiresAtMs,
      setCookies: session.setCookies,
    };
  },
  recheck: async ({ grant, signal }) => {
    const state = await sessionPolicy.verifyActiveGrant(grant, { signal });
    if (!state.active) {
      return { allow: false, reason: state.reason };
    }
    return { allow: true, expiresAtMs: state.expiresAtMs };
  },
  resolvePath: ({ params }) => `/projects/${encodeURIComponent(params.projectId)}/events`,
  recheckEveryMs: 30_000,
  revocationSource: sharedRevocationSource,
});

const running = await defineService(router, {
  name: 'projects',
  port: 3001,
  auth: {
    authn: { authenticator: sessionPolicy.authenticator },
    authz: {
      authorizer: createContractAuthorizer(appContract, {
        streamEndpoints: [projectFeedStream],
      }),
    },
  },
  streamProxies: [feedProxy],
});
```

### 3. Consume from a browser cookie client (`EventSource`) with offset resume

A Fresh island builds the typed same-origin proxy URL from the contract and resumes from the last
committed opaque offset without ever seeing the upstream Streams secret:

```ts
// islands/ProjectFeed.tsx
import { buildStreamEndpointUrl } from '@netscript/contracts/streams';
import { createNetScriptStreamEventSourceV1 } from '@netscript/fresh/streams';

let lastOffset = '-1';

function connect(projectId: string) {
  const proxyUrl = buildStreamEndpointUrl(projectFeedStream, {
    baseUrl: location.origin,
    params: { projectId },
    query: { view: 'summary' },
    offset: lastOffset,
  });

  return createNetScriptStreamEventSourceV1({
    proxyUrl,
    offset: lastOffset,
    onEvent(event) {
      if (event.event === 'control' || event.event === 'heartbeat') {
        lastOffset = event.payload.streamNextOffset;
      }
      if (event.event === 'data') {
        // Apply validated State Protocol change batch
      }
    },
  });
}
```

### 4. Consume from a bearer client (`fetch`) with offset resume

A CLI, mobile client, or backend service connects to the exact same endpoint with an
`Authorization: Bearer <token>` header and resumes with `?offset=<lastOffset>`:

```ts
import { buildStreamEndpointUrl } from '@netscript/contracts/streams';

const url = buildStreamEndpointUrl(projectFeedStream, {
  baseUrl: 'https://api.example.test',
  params: { projectId: 'proj-42' },
  offset: lastCommittedOffset,
});

const response = await fetch(url, {
  headers: {
    accept: 'text/event-stream',
    authorization: `Bearer ${accessToken}`,
  },
  signal,
});
```

### 5. Standalone Fresh 2.x BFF route handler

When an application mounts the proxy directly in a Fresh 2.x route (same-origin BFF) rather than a
`defineService` backend, `createNetScriptStreamProxy` returns a handler accepting either a bare
`Request` or a Fresh route context (`{ req: Request }`):

```ts
// utils/state.ts
import { createDefine } from 'fresh';

export interface State {
  readonly sessionId?: string;
}

export const define = createDefine<State>();
```

```ts
// routes/api/streams/projects/[projectId].ts
import { define } from '@/utils/state.ts';
import { createNetScriptStreamProxy } from '@netscript/plugin-streams-core/proxy';
import { sessionPolicy, sharedRevocationSource } from '@/auth/session-policy.ts';

const proxy = createNetScriptStreamProxy({
  authorize: async ({ request }) => {
    const projectId = new URL(request.url).pathname.split('/').pop() ?? '';
    const check = await sessionPolicy.resolveCookieOrBearer(request, projectId);
    return check.ok
      ? { allow: true, grant: { sessionId: check.sessionId, projectId }, expiresAtMs: check.expiresAtMs }
      : { allow: false, status: check.status, reason: check.reason };
  },
  recheck: ({ grant, signal }) => sessionPolicy.verifyActiveGrant(grant, { signal }),
  resolvePath: ({ grant }) => `/projects/${encodeURIComponent(grant.projectId)}/events`,
  clientAuth: 'cookie',
  recheckEveryMs: 30_000,
  revocationSource: sharedRevocationSource,
});

export const handler = define.handlers({
  GET(ctx) {
    return proxy(ctx);
  },
});
```

## Reference-level explanation

### Architecture, package placement, and dependency DAG

This design spans existing NetScript archetypes and adds **zero new packages**:

| Package / subpath | Archetype | Responsibility |
| --- | --- | --- |
| `@netscript/contracts/streams` | 1 — Small Contract | Runtime-free `defineStreamEndpoint`, `StreamEndpointContract`, `StreamEndpointClientAuthMode`, and `buildStreamEndpointUrl`. Zero runtime/IO imports. |
| `@netscript/service` | 4 — Public DSL/Builder | Structural `StreamProxyMount` contract, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `createContractAuthorizer` parameterized `streamEndpoints` binding via `rou3`, OpenAPI `text/event-stream` projection, service-info listing, and pre-drain shutdown `AbortSignal`. Zero dependency on `@netscript/plugin-streams-core`. |
| `@netscript/plugin/service` | 4 — Public DSL/Builder | Optional `streamProxies?: readonly StreamProxyMount[]` forwarding on `PluginServiceConfig` to `ServiceBuilder.withStreamProxy`. |
| `@netscript/plugin-streams-core/proxy` | 3 — Runtime/Behavior | `createNetScriptStreamProxy`, `bindStreamProxy`, atomic SSE delivery-unit frame parser/gate, clock-driven idle/expiry scheduling, optional revocation-source subscription, header allowlisting/sanitization, and cancel-safe upstream re-streaming. |
| `@netscript/fresh/streams` | 4 — Public DSL/Builder | Additive `proxyUrl` option on `createNetScriptStreamEventSourceV1` so browser `EventSource` clients can connect to contract-defined proxy routes without forced `/v1/stream/netscript` prefixing. |
| `@netscript/fresh/ai` | 4 — Public DSL/Builder | Internal reuse of shared header sanitization and cancel-safe re-streaming from `@netscript/plugin-streams-core/proxy` in `createNetScriptChatStreamProxy`, eliminating client `Cookie` forwarding upstream and enabling optional policy delegation for GET SSE chat streams. |
| `plugins/streams/services` | 5 — Plugin Package | Internal reuse of shared header sanitization constants from `@netscript/plugin-streams-core/proxy` (optional follow-up cleanup; no wire-behavior change). |

#### Acyclic dependency graph

Because `packages/plugin-streams-core/deno.json:18` already depends on `@netscript/service`,
`@netscript/service` MUST NOT import `@netscript/plugin-streams-core`. The dependency graph remains
strictly acyclic:

```text
@netscript/contracts/streams (leaf: types, schemas, URL builder)
        ▲                               ▲
        │                               │
@netscript/service (structural mount,   │
  authorizer, OpenAPI, shutdown signal) │
        ▲                               │
        └───────────────┬───────────────┘
                        │
        @netscript/plugin-streams-core/proxy (revocable SSE proxy runtime)
                ▲                     ▲
                │                     │
      @netscript/fresh/{ai,streams}   plugins/streams/services
```

### Contract surface (`@netscript/contracts/streams`)

`packages/contracts` adds a `./streams` subpath export (following the precedent of
`packages/contracts/commands.ts`), keeping root exports unchanged and zero runtime I/O in
`@netscript/contracts`:

```ts
export type StreamEndpointClientAuthMode =
  | 'bearer'
  | 'cookie'
  | 'bearer-or-cookie';

export interface StreamEndpointProtocol {
  readonly family: 'netscript.durable-stream-sse';
  readonly major: 1;
}

export interface StreamEndpointDefinition<
  TParams extends ContractObjectSchemaLike | undefined = ContractObjectSchemaLike | undefined,
  TQuery extends ContractObjectSchemaLike | undefined = ContractObjectSchemaLike | undefined,
> {
  /** Stable identifier (e.g. 'projects.feed'). Must match /^[a-z0-9][a-z0-9._-]*$/i. */
  readonly id: string;
  /** Absolute route path using OpenAPI `{param}` templates (e.g. '/api/streams/projects/{projectId}'). */
  readonly path: `/${string}`;
  /** Optional Standard Schema validating path parameters extracted from `{param}` segments. */
  readonly params?: TParams;
  /** Optional Standard Schema validating application query parameters (excluding reserved protocol keys). */
  readonly query?: TQuery;
  /** Client credential transports accepted by this endpoint. Defaults to `'bearer-or-cookie'`. */
  readonly clientAuth?: StreamEndpointClientAuthMode;
  /**
   * Access-control metadata reusing NetScript's canonical `NetScriptProcedureMeta['access']`.
   * Defaults to `{ authentication: 'required' }`.
   */
  readonly access?: NetScriptProcedureMeta['access'];
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export interface StreamEndpointContract<
  TParams = Record<never, never>,
  TQuery = Record<never, never>,
> {
  readonly protocol: StreamEndpointProtocol;
  readonly method: 'GET';
  readonly id: string;
  readonly path: `/${string}`;
  readonly paramNames: readonly string[];
  readonly params?: ContractObjectSchemaLike;
  readonly query?: ContractObjectSchemaLike;
  readonly clientAuth: StreamEndpointClientAuthMode;
  readonly access: NonNullable<NetScriptProcedureMeta['access']>;
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  /** Type-only carrier for inferred params and query types; never populated at runtime. */
  readonly '~types'?: { readonly params: TParams; readonly query: TQuery };
}

export function defineStreamEndpoint<
  TParams extends ContractObjectSchemaLike | undefined = undefined,
  TQuery extends ContractObjectSchemaLike | undefined = undefined,
>(
  definition: StreamEndpointDefinition<TParams, TQuery>,
): StreamEndpointContract<
  TParams extends ContractObjectSchemaLike ? ContractSchemaOutput<TParams> : Record<never, never>,
  TQuery extends ContractObjectSchemaLike ? ContractSchemaOutput<TQuery> : Record<never, never>
>;
```

#### Contract validation invariants (enforced at `defineStreamEndpoint` construction)

1. `path` MUST start with `/`, MUST NOT contain `?`, `#`, `*`, `//`, trailing slash (except `/`),
   or percent-encoded sequences, and MAY contain `{paramName}` segments matching
   `^[A-Za-z_][A-Za-z0-9_]*$`. Duplicate parameter names throw `TypeError`.
2. Every `{paramName}` in `path` MUST be declared in `params` when `params` is supplied (and vice
   versa); if `path` contains `{paramName}` segments, `params` is required so path inputs are always
   validated before reaching `authorize` or `resolvePath`.
3. `access.authentication` defaults to `'required'`. Passing `'optional'` throws `TypeError`
   (matching `packages/service/src/auth/contract/contract-procedure-index.ts:215-217`).
   `access.audience: 'internal'` cannot be combined with `authentication: 'none'`.
4. Reserved Durable Streams protocol query parameter names — `'offset'`, `'live'`, `'cursor'` — are
   owned by the stream proxy protocol. Declaring them in `query` throws `TypeError` at construction
   so application query parameters can never collide with replay state.
5. `defineStreamEndpoint` returns a deeply frozen object (`Object.freeze`) containing zero oRPC
   symbols, zero `'~orpc'` markers, and zero runtime handles.

#### Why stream endpoints stay outside the oRPC procedure map

In `packages/service/src/auth/contract/contract-procedure-index.ts:187-205` and
`packages/service/src/primitives/openapi.ts:103`, contract traversal recursively walks every
enumerable key of an oRPC contract router expecting `'~orpc'` procedure nodes. Placing a non-oRPC
`StreamEndpointContract` inside the oRPC procedure object would break oRPC router traversal and
`OpenAPIGenerator.generate(router)`. Stream endpoints are therefore declared as explicit sibling
exports (e.g., `export const projectFeedStream = defineStreamEndpoint(...)`) and passed explicitly to
`createContractAuthorizer`, `createService().withStreamProxy(...)`, and
`defineService(router, { streamProxies })`.

#### Typed URL builder (`buildStreamEndpointUrl`)

```ts
export function buildStreamEndpointUrl<TParams, TQuery>(
  endpoint: StreamEndpointContract<TParams, TQuery>,
  input: Readonly<{
    readonly baseUrl: string;
    readonly params?: TParams;
    readonly query?: TQuery;
    readonly offset?: string;
    readonly cursor?: string;
  }>,
): string;
```

`buildStreamEndpointUrl` validates `params` and `query` (when schemas are present), URL-encodes each
`{param}` segment, appends validated application query pairs, sets `offset` when provided
(omitting `offset` lets the proxy apply its configured `defaultOffset`), and sets optional `cursor`.
It does not append `live=sse` to the public proxy URL because the proxy always enforces `live=sse`
on the upstream Durable Streams hop.

### Service mounting, contract policy, OpenAPI, and shutdown (`@netscript/service`)

#### Structural mount contract

`@netscript/service` defines a runtime-neutral mount interface so `@netscript/service` stays free of
`@netscript/plugin-streams-core`:

```ts
export interface StreamProxyMountContext {
  /** Decoded path parameters matched by the Hono route. */
  readonly params: Readonly<Record<string, string>>;
  /** Authenticated principal set by `withAuthn`, when present. */
  readonly principal?: Principal;
  /** Service-owned pre-drain shutdown signal; aborted before `server.shutdown()` waits. */
  readonly shutdownSignal: AbortSignal;
}

export interface StreamProxyMount {
  readonly endpoint: StreamEndpointContract<unknown, unknown>;
  /** Handles one matched GET request for this stream endpoint. */
  handle(request: Request, context: StreamProxyMountContext): Promise<Response>;
}
```

#### `ServiceBuilder` and `defineService` integration

1. `ServiceBuilder.withStreamProxy(mount: StreamProxyMount)` registers a stream proxy mount on the
   builder.
2. `DefineServiceOptions` gains `readonly streamProxies?: readonly StreamProxyMount[]` (applied in
   `defineService` via `builder.withStreamProxy(mount)`).
3. `PluginServiceConfig` in `@netscript/plugin/service` gains the same optional
   `readonly streamProxies?: readonly StreamProxyMount[]` field.
4. At `build()` time:
   - Each `mount.endpoint.path` is converted from OpenAPI `{param}` syntax to Hono `:param` syntax
     and registered as a `GET` route **after** `installAuth()` and `installBodyLimit()` and
     **before** `notFound`, matching the deferred-route lifecycle
     ([service-builder-impl.ts:515-524](../packages/service/src/builder/service-builder-impl.ts#L515-L524)).
   - Duplicate `mount.endpoint.id` or overlapping mounted `path` values throw `Error` at `build()`.
   - When `withRPC()` is configured, `build()` verifies that no mounted `streamProxies` path
     collides with any oRPC OpenAPI route (using `ProcedureIndex.claims` from
     [contract-procedure-index.ts:115-120](../packages/service/src/auth/contract/contract-procedure-index.ts#L115-L120))
     and fails loudly at `build()` rather than letting oRPC swallow the stream request.
   - `serviceInfoEndpoints()` ([service-builder-impl.ts:494-509](../packages/service/src/builder/service-builder-impl.ts#L494-L509))
     lists mounted stream endpoints (e.g. `GET /api/streams/projects/{projectId}`).
5. **Contract-policy authorizer binding**:
   - `ContractAuthorizerOptions` ([options.ts:96-114](../packages/service/src/auth/options.ts#L96-L114))
     gains `readonly streamEndpoints?: readonly StreamEndpointContract<unknown, unknown>[]`.
   - `createContractAuthorizer` compiles `streamEndpoints` into a `rou3` GET route table (using the
     exact same `rou3` + `toRou3Pattern` machinery already used in
     [contract-procedure-index.ts:103-112](../packages/service/src/auth/contract/contract-procedure-index.ts#L103-L112)),
     closing the parameterized-path limitation of `ContractAuthorizerRawRoute` without weakening raw
     routes.
   - `bind()` checks `index.claims(streamPath)` for every stream endpoint and rejects overlaps with
     oRPC routes.
   - When a service mounts `streamProxies` AND uses `createContractAuthorizer` or
     `createContractOverlayAuthorizer`, `withAuthn` and `withAuthz` enforce the endpoint's declared
     `access` (`authentication`, `scopes`, `roles`, `audience`) at admission, and pass the resulting
     `principal` into `StreamProxyMountContext.principal`.
   - **Important interaction with dual bearer/cookie admission**: if a `defineService` app protects
     `/api` with a **bearer-only** `withAuthn` authenticator (such as
     `createAuthServiceAuthenticator`,
     [auth-service-authenticator.ts:96-98](../packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts#L96-L98)),
     a cookie-authenticated browser `EventSource` hitting `/api/streams/...` would be rejected `401`
     by `withAuthn` before reaching the stream proxy unless either:
     - (a) the service's `authenticator` supports both bearer and cookie (for example,
       `createCompositeAuthenticator` from `@netscript/service/auth` or an `AuthBackendPort` whose
       `authenticate` resolves bearer first then cookie per
       [ports/mod.ts:281-285](../packages/plugin-auth-core/src/ports/mod.ts#L281-L285)), OR
     - (b) the stream proxy endpoint is mounted outside `authn.protect` (or explicitly delegated so
       the proxy's own `authorize` performs admission, while `access` remains enforced by the proxy).
     This RFC recommends **(a)** when the service owns both bearer and cookie sessions and **(b)**
     only when a bearer-only API service mounts a dedicated cookie-accepting stream path whose
     proxy `authorize` enforces full authentication + authorization. `createContractAuthorizer`
     never treats a stream endpoint as anonymous unless its contract explicitly declares
     `access: { authentication: 'none' }`.
6. **OpenAPI projection**:
   - `createOpenAPISpec` accepts optional `streamEndpoints` (automatically supplied by
     `ServiceBuilder` from mounted `streamProxies`) and emits a `get` operation per stream endpoint
     with path/query parameters, optional `offset` and `cursor` string query parameters, `200`
     response media type `text/event-stream` documenting the `STREAM_SSE_CONTRACT_V1` `data` and
     `control` frames, `401`/`403` responses, and `bearerAuth` and/or `cookieAuth` security schemes
     derived from `clientAuth` and `access`.
7. **Pre-drain shutdown signal (critical for long-lived SSE)**:
   - Today `ServiceShutdownCoordinator.#runShutdown`
     ([service-shutdown.ts:96-147](../packages/service/src/builder/service-shutdown.ts#L96-L147))
     aborts its private `#controller` at line 97 and then awaits `server.shutdown()` at lines
     100–103 **before** running `onShutdown` hooks at lines 110–136.
   - `startServiceListener` MUST pass a service-lifetime `shutdownSignal` (the `#controller.signal`
     aborted at line 97, *before* `server.shutdown()` waits) into `ServiceApp` /
     `StreamProxyMountContext.shutdownSignal`.
   - Every active stream proxy reader listens to `shutdownSignal` and closes immediately (cancelling
     its upstream reader and closing its downstream response stream) when shutdown begins, allowing
     `server.shutdown()` to finish in milliseconds instead of timing out after `drainTimeoutMs`.

### Runtime proxy surface (`@netscript/plugin-streams-core/proxy`)

#### Public types and factories

```ts
export interface StreamProxyClockPort {
  /** Current epoch time in milliseconds. */
  nowMs(): number;
  /**
   * Schedule `onFire` after `delayMs` (clamped >= 0).
   * Returns an idempotent cancel function. Must not hold timers open after cancel.
   */
  schedule(delayMs: number, onFire: () => void): () => void;
}

export type StreamProxyAuthDecision<TGrant = unknown> =
  | {
      readonly allow: true;
      readonly grant: TGrant;
      /** Optional absolute expiry instant in epoch milliseconds. */
      readonly expiresAtMs?: number;
      /** Optional headers to attach to the 200 admission response (never secrets). */
      readonly responseHeaders?: Readonly<Record<string, string>>;
      /** Optional Set-Cookie values for refresh-on-read session authenticators. */
      readonly setCookies?: readonly string[];
    }
  | {
      readonly allow: false;
      readonly status: 401 | 403;
      /** Stable non-secret diagnostic code. */
      readonly reason: string;
    };

export type StreamProxyRecheckReason =
  | 'before-delivery'
  | 'idle-interval'
  | 'expiry'
  | 'revocation-signal';

export type StreamProxyRecheckDecision =
  | {
      readonly allow: true;
      /** Updated expiry instant (if extended or shortened by the application policy). */
      readonly expiresAtMs?: number;
    }
  | {
      readonly allow: false;
      /** Stable non-secret diagnostic code. */
      readonly reason: string;
    };

export interface StreamProxyAdmissionContext<
  TParams = Readonly<Record<string, string>>,
  TQuery = Readonly<Record<string, string>>,
> {
  readonly request: Request;
  readonly params: TParams;
  readonly query: TQuery;
  /** Principal injected by `@netscript/service` `withAuthn`, if mounted in a guarded service. */
  readonly principal?: Principal;
  readonly signal: AbortSignal;
}

export interface StreamProxyRecheckContext<TGrant = unknown> {
  readonly grant: TGrant;
  readonly streamPath: string;
  readonly reason: StreamProxyRecheckReason;
  readonly signal: AbortSignal;
}

export interface StreamProxyRevocationSignal {
  /**
   * When `'revoked'`, the proxy closes the reader immediately without awaiting another round-trip.
   * When `'recheck'` (default), the proxy wakes immediately and runs `recheck` against policy.
   */
  readonly action?: 'recheck' | 'revoked';
  readonly reason?: string;
}

/** Application-owned shared revocation channel (for cross-gateway push invalidation). */
export interface StreamProxyRevocationSource<TGrant = unknown> {
  /**
   * Register a wake callback for one admitted reader grant.
   * Must return an idempotent disposer invoked when the reader closes.
   */
  subscribe(
    grant: TGrant,
    notify: (signal?: StreamProxyRevocationSignal) => void,
  ): (() => void) | Promise<() => void>;
}

export type StreamProxyCloseReason =
  | 'completed'
  | 'revoked'
  | 'expired'
  | 'client-cancelled'
  | 'shutdown'
  | 'upstream-error'
  | 'policy-error'
  | 'frame-limit-exceeded';

export interface StreamProxyOptions<
  TGrant = unknown,
  TParams = Readonly<Record<string, string>>,
  TQuery = Readonly<Record<string, string>>,
> {
  /**
   * Admission policy: resolves session identity (bearer or cookie) and checks authorization.
   * Runs BEFORE path resolution and BEFORE opening the upstream Durable Streams connection.
   */
  readonly authorize: (
    context: StreamProxyAdmissionContext<TParams, TQuery>,
  ) => StreamProxyAuthDecision<TGrant> | Promise<StreamProxyAuthDecision<TGrant>>;

  /**
   * Re-authorization policy for an admitted reader.
   * Invoked before every delivery unit is released, at `expiresAtMs`, at `recheckEveryMs` while
   * idle, and on `'recheck'` revocation signals.
   */
  readonly recheck: (
    context: StreamProxyRecheckContext<TGrant>,
  ) => StreamProxyRecheckDecision | Promise<StreamProxyRecheckDecision>;

  /**
   * Resolves the relative Durable Streams path (e.g. `/projects/p1/events`) for an admitted grant.
   * Must return a normalized path starting with `/` with no query, fragment, or `..` traversal.
   */
  readonly resolvePath: (
    context: Readonly<{
      readonly request: Request;
      readonly params: TParams;
      readonly query: TQuery;
      readonly grant: TGrant;
    }>,
  ) => string | Promise<string>;

  /**
   * Accepted client credential transport mode. Controls cookie cross-site guards and bearer-only
   * rejection. Defaults to `'bearer-or-cookie'`.
   */
  readonly clientAuth?: StreamEndpointClientAuthMode;

  /**
   * Explicit cross-origin allowlist for cookie-authenticated `EventSource({ withCredentials: true })`.
   * Empty by default (strict same-origin for cookie requests). Wildcard `'*'` is rejected at construction.
   */
  readonly allowedOrigins?: readonly string[];

  /**
   * Periodic idle re-check interval in milliseconds. Bounds how long a quiet stream stays open
   * when revoked without a push `revocationSource`. Defaults to `30_000`.
   * Pass `null` to disable periodic polling (expiry timer and pre-delivery checks still run).
   */
  readonly recheckEveryMs?: number | null;

  /**
   * Optional application-provided revocation source shared across gateways for immediate wakeups.
   */
  readonly revocationSource?: StreamProxyRevocationSource<TGrant>;

  /**
   * Maximum time in milliseconds one `authorize` or `recheck` call may take before failing closed.
   * Defaults to `5_000`.
   */
  readonly policyTimeoutMs?: number;

  /**
   * Default opaque offset used when the client omits `?offset=`. Defaults to `'-1'`.
   */
  readonly defaultOffset?: StreamSseOffsetV1;

  /**
   * Maximum buffered UTF-8 bytes for pending `event: data` frames awaiting their committing
   * `event: control` frame. Defaults to `4 * 1024 * 1024` (4 MiB). Exceeding fails closed.
   */
  readonly maxPendingBatchBytes?: number;

  /**
   * Optional Durable Streams base URL override (defaults to `getStreamsUrl()`).
   */
  readonly baseUrl?: string | (() => string);

  /**
   * Server-side upstream auth header provider (defaults to `getStreamsAuth()`).
   * Attached ONLY on the server→Streams hop; never forwarded to or derived from the client.
   */
  readonly upstreamAuth?: () =>
    | Readonly<Record<string, string>>
    | Promise<Readonly<Record<string, string>>>;

  /** Optional clock port for deterministic expiry and idle-timer testing. */
  readonly clock?: StreamProxyClockPort;

  /** Optional fetch implementation for upstream connection testing. */
  readonly fetch?: typeof fetch;

  /** Optional non-secret lifecycle observer for metrics and diagnostics. */
  readonly onClose?: (event: Readonly<{
    readonly streamPath: string;
    readonly reason: StreamProxyCloseReason;
    readonly deliveredUnits: number;
  }>) => void;
}

export type StreamProxyHandler = (
  input: Request | { readonly req: Request },
  context?: Partial<StreamProxyMountContext>,
) => Promise<Response>;

export function createNetScriptStreamProxy<TGrant = unknown>(
  options: StreamProxyOptions<TGrant>,
): StreamProxyHandler;

export function bindStreamProxy<TParams, TQuery, TGrant = unknown>(
  endpoint: StreamEndpointContract<TParams, TQuery>,
  options: Omit<StreamProxyOptions<TGrant, TParams, TQuery>, 'clientAuth'>,
): StreamProxyMount;
```

#### Construction validation (fail fast before serving)

`createNetScriptStreamProxy` and `bindStreamProxy` validate options synchronously at construction:

- `authorize`, `recheck`, and `resolvePath` MUST be functions; missing hooks throw `TypeError`
  (no default allow-all).
- `recheckEveryMs` (when not `null` or `undefined`) MUST be a finite positive integer `>= 100`
  (or `>= 1` when an injected `clock` is provided for tests).
- `policyTimeoutMs` MUST be a finite positive integer (`<= 2_147_483_647`).
- `maxPendingBatchBytes` MUST be a finite positive integer (`>= 1024`).
- `allowedOrigins` MUST NOT contain `'*'` and each entry MUST be an exact `http:` or `https:`
  origin (`URL.parse(entry)?.origin === entry`), matching
  [service-cors.ts:31-51](../packages/service/src/middleware/service-cors.ts#L31-L51).

### Admission semantics

Every incoming request executes this exact sequence before any upstream I/O occurs:

1. **Method check**: Only `GET` is admitted (`405 Method Not Allowed` with `Allow: GET` otherwise).
2. **Transport & CSRF/Origin guard** (see [Header, cookie, and CSRF/Origin handling](#header-cookie-and-csrforigin-handling)):
   - If `clientAuth === 'bearer'` and the request has no well-formed `Authorization: Bearer <token>`
     header, reject immediately with `401` (`reason: 'bearer_required'`).
   - If the request is cookie-bearing without an `Authorization` header (or `clientAuth === 'cookie'`),
     enforce the Fetch Metadata (`Sec-Fetch-Site`) and `Origin` checks. Cross-site cookie requests
     not on `allowedOrigins` fail with `403` (`reason: 'cross_site_cookie_denied'`).
3. **Parameter and query validation**:
   - When bound via `bindStreamProxy(endpoint, ...)`, validate `params` and application `query`
     against `endpoint.params` and `endpoint.query`; validation failures return `400 Bad Request`
     with a structured, non-secret error payload.
   - Validate optional `?offset=` and `?cursor=` query values: reject non-empty strings containing
     CR/LF/NUL or exceeding 512 UTF-8 bytes with `400`.
4. **Application admission (`authorize`)**:
   - Invoke `authorize({ request, params, query, principal, signal })` bounded by `policyTimeoutMs`
     and linked to `request.signal` and `shutdownSignal`.
   - If `authorize` returns `{ allow: false, status, reason }`, return JSON `{ error, reason }`
     with HTTP `status` (`401` or `403`), `cache-control: no-store`, and `vary`. No upstream fetch
     is initiated.
   - If `authorize` throws, rejects, or times out, fail closed with HTTP `503 Service Unavailable`
     (`error: 'SERVICE_UNAVAILABLE'`, redacted message — never echoing thrown error details).
   - If `authorize` returns `{ allow: true, grant, expiresAtMs }` where `expiresAtMs !== undefined`
     and `expiresAtMs <= clock.nowMs()`, treat as immediately expired and return `401` without
     opening an upstream connection.
5. **Path resolution (`resolvePath`)**:
   - Invoke `resolvePath({ request, params, query, grant })`.
   - Validate that the returned path starts with `/`, contains no `?`, `#`, CR/LF, NUL, or `..`
     dot-segment traversal after URL normalization. Invalid paths fail closed (`500` redacted,
     logged internally).
6. **Revocation subscription (before upstream connect)**:
   - If `revocationSource` is configured, call `await revocationSource.subscribe(grant, onSignal)`
     **before** starting the upstream fetch (closing the race window where a revocation occurs
     between admission and the first upstream read!).
   - If `onSignal` fires with `action: 'revoked'` before the response is returned, clean up and
     return `401` without opening or returning a stream.
7. **Upstream connect**:
   - Build upstream URL: `buildStreamUrl(streamPath, resolvedBaseUrl)` with `?offset=<offset>&live=sse`
     (and `&cursor=<cursor>` when provided).
   - Resolve server-side `upstreamAuth()` headers and open the upstream `fetch` with the reader's
     `upstreamAbortController.signal` and `redirect: 'manual'` (so a hostile/misconfigured redirect
     can never carry the upstream bearer secret to another origin).
   - Verify upstream status:
     - `200` with `content-type` starting with `text/event-stream` and non-null `body`: proceed to
       streaming.
     - Upstream `401` or `403`: **never** forward upstream auth failure as client `401`/`403`;
       cancel body, unsubscribe, and return redacted `502 Bad Gateway` (server misconfiguration).
     - Upstream `404`: cancel body, unsubscribe, and return `404 Not Found` (stream does not exist;
       note that unauthorized callers already stopped at step 4).
     - Upstream `410` (expired/trimmed offset) or `400` (invalid offset): cancel body, unsubscribe,
       and return `410`/`400` with sanitized headers so clients know the requested offset cannot be
       resumed.
     - Upstream `3xx` or `5xx` or network failure: cancel body, unsubscribe, and return redacted
       `502`/`503`.

### Delivery-unit framing and revocation during delivery

This section defines the core security invariant that distinguishes an authorizing revocable proxy
from a raw byte pipe.

#### Why raw byte passthrough cannot enforce revocation safely

On the Durable Streams SSE wire (measured against `DurableStreamTestServer` at `87965d80` and
codified in `STREAM_SSE_CONTRACT_V1`,
[sse-contract-v1.ts:12-74](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L12-L74)):

- A logical batch is emitted as one or more `event: data` frames (each carrying a JSON array of
  `StreamSseChangeV1` objects) followed by a committing `event: control` frame carrying
  `{ streamNextOffset, streamCursor?, upToDate?, streamClosed? }`.
- `reduceStreamSseReplayStateV1`
  ([stream-sse-v1.ts:118-142](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L118-L142))
  buffers `pendingBatches` on `data` and commits `lastCommittedOffset` only upon `control`.

Forwarding arbitrary `Uint8Array` chunks directly from `upstream.body` breaks revocation in two
ways: (1) a revoked session receives `event: data` payloads before a later check notices revocation,
and (2) checking between `data` and `control` either leaks `data` without `control` or sends
`control` without `data`, corrupting the reader's resume offset.

#### Incremental SSE frame parser and atomic delivery unit

The proxy reads UTF-8 bytes from `upstream.body.getReader()` through an incremental WHATWG SSE
event-block decoder (splitting on `\r\n\r\n`, `\n\n`, or `\r\r`, preserving exact raw frame bytes
including UTF-8 multi-byte code points split across TCP chunks via `TextDecoder({ stream: true })`):

```text
upstream bytes ─▶ SSE frame decoder ─▶ accumulate pending `event: data` frames (bounded by maxPendingBatchBytes)
                                              │
                                              ▼ on `event: control` frame
                                    DeliveryUnit = [...pendingDataFrames, controlFrame]
                                              │
                                              ▼
                              ┌───────────────────────────────────────┐
                              │  1. Check terminal/revoked/expired    │
                              │  2. Await serialized `recheck`        │
                              │     (reason: 'before-delivery')       │
                              │  3. Re-check terminal/revoked/expired │
                              └───────────────────────────────────────┘
                                       │                       │
                                allow: true              allow: false /
                                                       expired / revoked /
                                                          error / abort
                                       │                       │
                                       ▼                       ▼
                      Enqueue ALL raw frame bytes       Emit ZERO bytes of unit;
                      of unit in exact wire order       closeOnce('revoked' | 'expired' | 'policy-error'):
                      (`data` frame(s) + `control`)     - clear timers & unsubscribe
                                                        - abort upstream controller
                                                        - cancel & release upstream reader
                                                        - close downstream stream cleanly
```

#### Normative delivery-unit rules

1. **Exact gate placement**: Every delivery unit — whether `[dataFrame+, controlFrame]` or a
   standalone `[controlFrame]` (heartbeat / empty up-to-date / `streamClosed`) — MUST await the
   serialized `recheck({ grant, streamPath, reason: 'before-delivery', signal })` check **after**
   the committing `control` frame is assembled and **before** a single byte of any frame in that
   delivery unit is enqueued onto the downstream `ReadableStream`.
2. **Zero partial emission on denial**: If `recheck` returns `{ allow: false }`, throws/rejects,
   times out, or returns an `expiresAtMs <= clock.nowMs()`, OR if an out-of-band revocation/expiry
   fired while `recheck` was in flight:
   - Neither the `event: data` frame(s) nor the cursor-advancing `event: control` frame are emitted.
   - The reader transitions immediately to terminal `revoked` / `expired` / `policy-error`, releases
     its upstream reader, and closes the downstream HTTP response stream cleanly.
3. **No fabricated protocol frames**: On revocation or expiry, the proxy MUST NOT emit a synthetic
   `event: control` with `streamClosed: true` (that denotes durable log EOF, not reader revocation)
   and MUST NOT emit undeclared SSE event names that violate `STREAM_SSE_WIRE_EVENT_NAMES_V1`
   (`['data', 'control']`).
4. **Fresh admission after close**: When a browser `EventSource` or bearer client subsequently
   reconnects (whether automatically or via an application reconnect controller) with its last
   committed offset, admission runs fresh against the application policy, sees the revoked/expired
   session, and returns HTTP `401` (or `403`). Per the WHATWG HTML `EventSource` specification,
   a non-`200` HTTP response permanently transitions `EventSource` to `CLOSED` with no further
   automatic retries; `createNetScriptStreamDB`'s recovery adapter likewise treats `401`/`403` as
   terminal `failed`
   ([stream-db-recovery-adapter.ts:44-52,91-94](../packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts#L44-L52)).
5. **SSE comments (keepalives)**: Upstream comment-only blocks (lines beginning with `:`) carry no
   data and do not advance any cursor. When `pendingDataFrames` is empty, the proxy drops upstream
   comment frames (or forwards them only after checking that the reader is not expired/revoked);
   comment frames never bypass expiry or `recheckEveryMs`.
6. **Non-`data`/non-`control` wire frames**: Upstream frames with an event name outside
   `STREAM_SSE_WIRE_EVENT_NAMES_V1` fail closed with `upstream-error` (matching
   `parseStreamSseEventV1`'s strict rejection at
   [stream-sse-v1.ts:83-85](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L83-L85)).
7. **Bounded pending buffer**: If buffered `pendingDataFrames` bytes exceed `maxPendingBatchBytes`
   (default 4 MiB) before a committing `event: control` arrives, the proxy fails closed with
   `frame-limit-exceeded`, cancels the upstream reader, and closes the downstream stream without
   releasing the unverified partial data.
8. **Single serialized re-check per reader**: A reader never runs two overlapping `recheck` calls.
   If an idle timer ticks while a `before-delivery` `recheck` is already pending, the idle tick is
   coalesced into the in-flight check. If a confirmed push revocation (`action: 'revoked'`) arrives
   while a `before-delivery` `recheck` is paused/pending, the proxy aborts the in-flight check's
   `signal`, discards the pending delivery unit, and executes `closeOnce('revoked')`.

### Idle readers at expiry (timer vs next-event check)

Long-lived SSE streams frequently sit idle for minutes or hours between events. Two naive designs
both fail important requirements:

| Strategy | Behavior on quiet stream after expiry | Behavior on active stream after revocation | Verdict |
| --- | --- | --- | --- |
| **Next-event check only** | Reader remains open indefinitely holding sockets, upstream readers, and browser HTTP/1.1 connection slots until a future event arrives. | Catches revocation on next batch. | **Rejected**: fails idle-reader expiry requirement and leaks connection capacity. |
| **Timer only** | Closes idle reader at `expiresAtMs` or next tick. | **Unsafe**: batches published between revocation and the next timer tick are delivered to a revoked reader. | **Rejected**: violates zero-delivery-after-revocation invariant. |
| **Hybrid: pre-delivery check + `ClockPort` expiry/idle timers + optional push wake (chosen)** | Wakes deterministically at `expiresAtMs` (and every `recheckEveryMs` while idle), even when `upstreamReader.read()` is blocked waiting for data. | Checks policy before every delivery unit is released; push wake also terminates idle readers immediately. | **Adopted**. |

#### Exact idle-expiry lifecycle

1. Whenever `authorize` or `recheck` returns a finite `expiresAtMs`, the proxy arms a single
   `ClockPort.schedule(Math.max(0, expiresAtMs - clock.nowMs()), onExpiry)` deadline timer (replacing
   any prior expiry timer if `expiresAtMs` was updated).
2. When `onExpiry` fires on an idle reader (even while `upstreamReader.read()` is pending or while
   the downstream consumer is backpressured):
   - The proxy invokes `recheck({ grant, streamPath, reason: 'expiry', signal })` so an application
     that supports sliding-window session extension may either return
     `{ allow: true, expiresAtMs: newFutureExpiry }` (strictly `> clock.nowMs()`, which re-arms the
     expiry timer and keeps the stream alive) OR return `{ allow: false, reason: 'session_expired' }`.
   - If `recheck` denies, throws, times out, OR returns `{ allow: true }` with an `expiresAtMs`
     that is missing or still `<= clock.nowMs()`, the proxy executes `closeOnce('expired')` —
     cancelling and releasing the upstream reader and closing the downstream SSE response stream.
3. Independently, when `recheckEveryMs` is a positive number (default `30_000`), the proxy resets
   an idle timer via `ClockPort` after each completed `authorize`/`recheck`. If no delivery unit
   triggers `before-delivery` within `recheckEveryMs`, the idle timer fires `recheck(..., 'idle-interval')`,
   terminating revoked readers even when no expiry timestamp was returned and no push revocation
   source is wired.
4. All scheduling goes exclusively through `StreamProxyClockPort` (defaulting to a thin
   `Date.now` / `setTimeout` adapter; tests inject a deterministic fake clock), complying with
   NetScript's clock-port rule
   ([08-runtime-state-failure.md:104-125](../docs/architecture/doctrine/08-runtime-state-failure.md#time-as-a-first-class-input)).
   Every timer handle is cancelled in `closeOnce()`.

### Multi-gateway revocation

In horizontally scaled deployments (multiple service replicas, or a Fresh BFF process plus a
separate API service), the HTTP request that revokes a session (sign-out, admin revoke, role change,
tenant removal) frequently lands on **Gateway B** while the user's open SSE stream is held by
**Gateway A**.

Because the proxy owns zero session state, cross-gateway revocation works across two complementary
planes backed by one application-provided shared revocation source (for example Deno KV, Postgres,
Redis, or the `@netscript/plugin-auth` service + its `auth.session.revoked` stream from
[plugin-auth-core/src/streams/mod.ts:22-51](../packages/plugin-auth-core/src/streams/mod.ts#L22-L51)):

```text
  Gateway B (revocation initiator)                   Gateway A (holds open SSE reader)
  ────────────────────────────────                   ─────────────────────────────────
  POST /auth/signout (or admin revoke)               Open SSE reader for session S
        │                                                   │
        ▼                                                   │ (1) Active delivery:
  Write revoked state to                                    │     before-delivery `recheck`
  Shared Revocation Source ◄────────── read ────────────────┤     reads shared source → deny!
        │                                                   │
        │ (2) Optional push signal                          │ (2) Idle reader (immediate):
        └───────── notify(grant) ──────────────────────────►│     `revocationSource.subscribe`
                                                            │     wakes reader → confirm/close!
                                                            │
                                                            │ (3) Idle reader (pull fallback):
                                                            │     `recheckEveryMs` / `expiresAtMs`
                                                            │     reads shared source → close!
```

1. **Guaranteed consistency on active delivery (no push required)**: Because Gateway A runs
   `recheck(..., 'before-delivery')` against the shared source before releasing any batch + control,
   a revocation committed through Gateway B prevents Gateway A from releasing the very next batch
   and its cursor-advancing control — even if no push channel is configured.
2. **Immediate idle termination (with `revocationSource`)**: When the application wires
   `revocationSource`, Gateway B publishes the revocation to the shared source, which invokes
   Gateway A's `notify` callback for matching grants, immediately waking and closing idle readers
   on Gateway A and releasing their upstream Streams readers.
3. **Bounded idle termination (without push)**: Even when `revocationSource` is omitted,
   `recheckEveryMs` and `expiresAtMs` bound idle reader lifetime on Gateway A.
4. **Fresh admission on every gateway**: Both Gateway A and Gateway B consult the same shared
   source inside `authorize`, so fresh admission immediately fails on every gateway after
   revocation.

### Offset and cursor semantics on resume

1. **Opaque tokens**: `offset` and `cursor` are forwarded verbatim as opaque strings matching
   `StreamSseOffsetV1`
   ([sse-contract-v1.ts:25-26](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L25-L26)).
   The proxy never parses, rewrites, or synthesizes offsets.
2. **Uniform resume across bearer and cookie clients**:
   - Both bearer clients (`Authorization: Bearer ...` on `GET <proxyUrl>?offset=<token>`) and
     cookie clients (browser `EventSource` or `fetch(..., { credentials: 'include' })` on
     `GET <proxyUrl>?offset=<token>`) resume identically via `?offset=<opaque>` (and optional
     `?cursor=<opaque>`).
   - Upstream requests always carry `live=sse` enforced by the proxy (`offset` defaults to
     `options.defaultOffset ?? '-1'`). Clients cannot downgrade an SSE proxy endpoint to
     `live=false` or `live=long-poll`.
3. **Commit-offset preservation on revocation**: Because a withheld delivery unit emits neither
   `event: data` nor `event: control`, a reader revoked before batch $N$ retains
   `lastCommittedOffset` from batch $N-1$. If the user later re-authenticates with a new valid
   session and resumes from `lastCommittedOffset`, batch $N$ is delivered cleanly with no gap and
   no lost events.
4. **Client helper compatibility (`@netscript/fresh/streams`)**:
   `CreateNetScriptStreamEventSourceOptionsV1`
   ([create-stream-event-source.ts:17-30](../packages/fresh/src/runtime/streams/create-stream-event-source.ts#L17-L30))
   gains a mutually exclusive `proxyUrl: string` option (alternative to `streamPath` + `baseUrl`)
   so browser clients can pass a `buildStreamEndpointUrl(...)` URL directly without `buildStreamUrl`
   prepending `/v1/stream/netscript`. In `proxyUrl` mode, `createNetScriptStreamEventSourceV1`
   preserves the caller's path verbatim, sets `offset` on the URL from `options.offset` if absent
   (keeping `options.offset` authoritative for `initialState.lastCommittedOffset`), and does not
   require `live=sse` on the public proxy URL.

### Header, cookie, and CSRF/Origin handling

#### Upstream secret isolation & request header allowlist

Unlike `createNetScriptChatStreamProxy` (which copies all incoming client headers via
`new Headers(request.headers)` at
[stream-proxy.ts:196](../packages/fresh/src/runtime/ai/stream-proxy.ts#L196) and was measured
forwarding client `Cookie` headers upstream), `createNetScriptStreamProxy` constructs upstream
headers from a **strict allowlist**:

| Header | Upstream direction | Rule |
| --- | --- | --- |
| `accept` | Proxy → Streams | Fixed to `'text/event-stream'`. |
| `accept-encoding` | Proxy → Streams | Fixed to `'identity'` (preserves the `#219`/`#239` gzip-mislabel fence). |
| `traceparent`, `tracestate` | Proxy → Streams | Forwarded (or injected from active span) when valid W3C trace context is present. |
| Server-side `upstreamAuth()` | Proxy → Streams | Attached strictly on the server→Streams hop; default `getStreamsAuth()`. Never echoed downstream, never logged, never included in errors. |
| Client `cookie`, client `authorization`, `host`, `origin`, `referer`, `x-forwarded-*`, arbitrary headers | **Dropped** | Never forwarded to the Durable Streams server. |

#### Downstream response header hygiene

Before returning the `200 text/event-stream` response to the client, the proxy:

1. **Strips** all of:
   - `content-encoding`, `content-length` (decoded/re-framed body hygiene, matching
     [proxy-headers.ts:44-56](../plugins/streams/services/src/proxy-headers.ts#L44-L56));
   - RFC 9110 §7.6.1 hop-by-hop headers (`connection`, `keep-alive`, `proxy-authenticate`,
     `proxy-authorization`, `te`, `trailer`, `transfer-encoding`, `upgrade`);
   - Upstream CORS, auth, and cross-origin policy headers (`access-control-allow-origin`,
     `access-control-allow-credentials`, `access-control-allow-headers`,
     `access-control-allow-methods`, `access-control-expose-headers`, `access-control-max-age`,
     `cross-origin-resource-policy`, `www-authenticate`, `authorization`, `set-cookie`) so
     `DurableStreamTestServer`'s wildcard `access-control-allow-origin: *` (measured at `87965d80`)
     can never leak onto an authenticated gateway response.
2. **Sets** mandatory SSE response headers:
   - `content-type: text/event-stream; charset=utf-8`
   - `cache-control: no-store, no-cache, no-transform`
   - `x-content-type-options: nosniff`
   - `x-accel-buffering: no`
   - `vary`: token-union including `Authorization`, `Cookie`, and `Origin` (preserving any `Vary`
     tokens already established by `@netscript/service` CORS middleware).
3. **Applies** explicit `decision.responseHeaders` and `decision.setCookies` from admission
   (`authorize`), after rejecting any attempt to emit `authorization` or CR/LF-containing header
   values. (Note: once `200` SSE headers flush on admission, mid-stream `recheck` cannot emit
   `Set-Cookie`; session refresh requiring cookie mutation happens on ordinary HTTP requests or on
   reconnect.)
4. **Redacts** all logs, errors, and telemetry: never record bearer tokens, cookie values,
   `upstreamAuth()` values, query strings containing arbitrary user parameters, `TGrant`, or raw
   thrown messages from `authorize`/`recheck`. Record only `streamPath`, endpoint `id`, HTTP status,
   stable non-secret `reason` / `StreamProxyCloseReason`, and `deliveredUnits`.

#### CSRF and Origin considerations for cookie `EventSource`

Browser `EventSource` sends cookies automatically on `GET` requests. While `GET` is read-only (no
state-changing CSRF), a malicious third-party origin attempting a cross-site `EventSource` or
credentialed `fetch` could otherwise trigger unauthorized stream opens or exploit misconfigured
CORS to exfiltrate private event data.

To align with NetScript's same-origin BFF topology
([07-composition-and-extension.md:307-332](../docs/architecture/doctrine/07-composition-and-extension.md),
Browser authentication topology):

1. **When the cookie cross-site guard runs**:
   - Always when `clientAuth === 'cookie'`.
   - When `clientAuth === 'bearer-or-cookie'` AND the request carries no `Authorization` header
     (or carries a `Cookie` header without a bearer credential).
   - Never blocks non-browser bearer requests that send `Authorization: Bearer <token>` and no
     cross-site browser cookie context.
2. **Fetch Metadata (`Sec-Fetch-Site` and `Sec-Fetch-Dest`)**:
   - If `Sec-Fetch-Site` is present:
     - `'same-origin'` is permitted.
     - `'cross-site'` and `'same-site'` (cross-origin subdomain) are **denied `403`** unless the
       request's `Origin` header is present and exactly matches an entry in `allowedOrigins`.
     - `'none'` (direct address-bar navigation, typically paired with `Sec-Fetch-Dest: document`) is
       **denied `403`** for cookie SSE streams to prevent accidental/clickjacked top-level document
       rendering of private SSE feeds (configurable via `allowDirectNavigation?: boolean`, default
       `false`).
   - If `Sec-Fetch-Dest` is present and is an embed/subresource tag that should never open an SSE
     stream (`'script'`, `'image'`, `'style'`, `'audio'`, `'video'`, `'object'`, `'embed'`,
     `'iframe'`), deny `403`. (`EventSource` and `fetch` send `Sec-Fetch-Dest: empty`.)
3. **`Origin` header check**:
   - If `Origin` is present and differs from `new URL(request.url).origin` (note: deployments
     behind reverse proxies must trust forwarded host/proto consistently with `ServiceProxyTrust`),
     the request is **denied `403`** unless `Origin` is an exact match in `allowedOrigins`.
   - Note: `allowedOrigins` controls *admission* of cross-origin cookie requests; browser readability
     of cross-origin `EventSource({ withCredentials: true })` additionally requires the service's
     `withCors({ origin: [...], credentials: true })` to emit exact `Access-Control-Allow-Origin`
     and `Access-Control-Allow-Credentials: true` (wildcard `*` with credentials is already rejected
     at build time by [service-cors.ts:44-51](../packages/service/src/middleware/service-cors.ts#L44-L51)).
4. **Bearer-over-cookie precedence (no silent downgrade)**:
   - When `clientAuth === 'bearer-or-cookie'` and a request supplies an `Authorization` header,
     application policy MUST follow `@netscript/plugin-auth-core/ports`'s precedence law
     ([ports/mod.ts:281-285](../packages/plugin-auth-core/src/ports/mod.ts#L281-L285)): bearer takes
     precedence over cookies, and an invalid or revoked bearer token MUST fail admission (`401`)
     rather than silently falling back to a browser cookie on the same request.
   - Tokens in query strings (`?token=...`) are explicitly discouraged and never read by the proxy.

### Backpressure, cancellation, and resource cleanup

#### Reader state machine

Each admitted stream reader owns a finite, named lifecycle:

```text
admitting ──▶ opening-upstream ──▶ streaming ──▶ closing ──▶ terminal
                                                              (completed | revoked | expired |
                                                               client-cancelled | shutdown |
                                                               upstream-error | policy-error |
                                                               frame-limit-exceeded)
```

Every transition into `closing` passes through one idempotent `closeOnce(reason)` routine:

1. Mark `closed = true` and record terminal `reason`.
2. Cancel both `ClockPort` timer handles (expiry deadline and idle `recheckEveryMs`).
3. Invoke the `revocationSource` unsubscribe disposer (catching and suppressing teardown errors so
   remaining cleanup always completes).
4. Remove `abort` listeners from `request.signal` and `shutdownSignal`.
5. Abort the per-reader `upstreamAbortController` (which also cancels any in-flight `recheck` via
   its linked signal).
6. Cancel the upstream `ReadableStreamDefaultReader` (`await upstreamReader.cancel(reason).catch(() => {})`)
   and call `upstreamReader.releaseLock()` in `finally` — preventing dangling upstream HTTP reads
   and uncaught `AbortError`s (mirroring
   [proxy-headers.ts:90-123](../plugins/streams/services/src/proxy-headers.ts#L90-L123)).
7. Close the downstream `ReadableStreamDefaultController` cleanly (`try { controller.close(); } catch {}`).
8. Remove the reader from the proxy's active-reader set and invoke optional `onClose` observer.

#### Backpressure + out-of-band termination

- The downstream `ReadableStream<Uint8Array>` is **pull-driven** (`pull(controller)` with a bounded
  queuing strategy of 1 delivery unit / bounded byte high-water mark).
- Upstream `upstreamReader.read()` runs only when `pull()` demands the next delivery unit, so a
  slow client naturally exerts TCP/stream backpressure all the way to the upstream Durable Streams
  response without buffering unbounded events in gateway memory.
- Crucially, **expiry timers, idle `recheckEveryMs` timers, `revocationSource` callbacks,
  `request.signal`, and `shutdownSignal` do NOT wait for `pull()`**: if a reader is either idle
  upstream OR stalled by downstream backpressure when revoked or expired, `closeOnce()` still fires
  immediately, releasing the upstream reader and closing the downstream stream.
- All event listeners (`request.signal`, `shutdownSignal`, internal wake controller) are removed in
  `finally` so long-running gateways accumulate zero listener or timer leaks.

### Relationship to `createNetScriptChatStreamProxy` (reuse vs generalize; migration)

#### Why generalize in `@netscript/plugin-streams-core/proxy` instead of extending `@netscript/fresh/ai`

`createNetScriptChatStreamProxy`
([stream-proxy.ts:166-229](../packages/fresh/src/runtime/ai/stream-proxy.ts#L166-L229)) solves a
narrower, chat-specific problem:

- It lives in `@netscript/fresh/ai`, which depends on Fresh, Preact, Vite, `@tanstack/ai*`, and
  `@durable-streams/tanstack-ai-transport`
  ([packages/fresh/deno.json:37-64](../packages/fresh/deno.json#L37-L64)) — unsuitable for
  `defineService` backend services.
- It proxies both `POST` (with request body + `duplex: 'half'`) and `GET` (including non-SSE
  snapshot/long-poll reads used by `@durable-streams/tanstack-ai-transport`), keyed by
  `NetScriptChatSessionTarget` (`sessionId`).
- It performs raw byte passthrough with no SSE delivery-unit framing, no `authorize` / `recheck`
  hooks, no idle expiry timer, and no contract declaration.

#### Shared foundation & non-breaking convergence

1. **Centralize shared proxy hygiene once in `@netscript/plugin-streams-core/proxy`**:
   - Export `STRIPPED_STREAM_PROXY_RESPONSE_HEADERS`, `sanitizeStreamProxyResponseHeaders`, and
     `restreamUpstreamBody` (or keep `restreamUpstreamBody` package-internal/shared across the
     workspace) from `@netscript/plugin-streams-core/proxy`.
   - `packages/fresh/src/runtime/ai/stream-proxy.ts` drops its duplicated header list
     ([stream-proxy.ts:55-84](../packages/fresh/src/runtime/ai/stream-proxy.ts#L55-L84)), uses
     the shared sanitizer + cancel-safe re-streaming, and stops forwarding incoming client `Cookie`
     headers to the Durable Streams server (fixing the measured leak).
   - `plugins/streams/services/src/proxy-headers.ts` can likewise adopt the shared header list in a
     separate cleanup slice without changing wire behavior.
2. **Keep `createNetScriptChatStreamProxy` backward-compatible**:
   - Existing `{ POST: proxy, GET: proxy }` chat routes continue compiling and working unchanged.
   - `NetScriptChatStreamProxyOptions` MAY add optional `authorize`, `recheck`, `recheckEveryMs`,
     and `revocationSource` fields: when supplied, `GET` requests with `live=sse` delegate directly
     to `createNetScriptStreamProxy`, while `POST` / non-SSE requests apply admission `authorize`
     before proxying (closing the current unauthenticated GET-read gap on chat streams without
     forcing immediate rewrites).
3. **Recommended pattern for new durable-chat routes**:
   - `POST` turn submission uses `toNetScriptChatResponse({ authorize, ... })`
     ([create-chat-connection.ts:471-499](../packages/fresh/src/runtime/ai/create-chat-connection.ts#L471-L499)).
   - `GET` live SSE subscription uses `createNetScriptStreamProxy` (or `bindStreamProxy` on a
     `defineStreamEndpoint` contract), unifying all live SSE streams in an application on one
     revocable proxy model.

### Acceptance tests and implementation gates

An implementation is NOT complete until every acceptance case below passes in automated tests with
Deno's resource and async-op sanitizers enabled (no `sanitizeOps: false` / `sanitizeResources: false`
bypasses on proxy unit/conformance suites).

#### Mandatory core revocation & resume acceptance suite

1. **Revocation during delivery — two synthetic sessions paused at the authorization check**:
   - Mount one stream proxy backed by a single durable stream (both against a deterministic fake
     SSE upstream AND against a real `DurableStreamTestServer`).
   - Give the application policy two synthetic sessions (`session-A`, `session-B`) authorized for
     the same stream path.
   - Admit both readers; verify both receive initial catch-up batch 1 and its committing control
     frame (`offset_1`).
   - Publish batch 2 to the stream. Intercept both readers' `recheck(..., 'before-delivery')` calls
     at a deferred barrier (pausing delivery at the authorization check).
   - While both readers are paused at the check, revoke `session-B` in the application policy, then
     release both barriers.
   - Assert:
     - `session-A` (still authorized) receives **both** batch 2 (`event: data`) **and** its
       cursor-advancing `event: control` (`offset_2`).
     - `session-B` (revoked) receives **neither** batch 2 (`event: data`) **nor** its
       cursor-advancing `event: control` (`offset_2`); its last observed offset remains `offset_1`.
     - `session-B`'s downstream response stream closes cleanly (EOF, no fabricated `streamClosed: true`
       or unknown wire event).
     - `session-B`'s upstream reader is cancelled and released (`upstreamReaderCancelled === true`
       and active upstream reader count drops from 2 to 1).
     - A subsequent fresh admission request presenting `session-B` fails with HTTP `401` (or `403`)
       and opens **zero** upstream connections.
2. **Idle reader at expiry**:
   - Admit a reader with an injected fake `ClockPort` and `expiresAtMs = T0 + 60_000`.
   - Keep the upstream stream completely **idle** (no events published after initial catch-up;
     upstream `read()` remains pending).
   - Advance the fake clock to `T0 + 60_000`.
   - Assert: without any upstream event arriving, the proxy invokes `recheck(..., 'expiry')`,
     denies/expires the reader, closes the downstream stream cleanly, cancels and releases its
     upstream reader, leaves zero pending timers, and rejects fresh admission with `401`.
   - Negative/extension control: repeat where `recheck(..., 'expiry')` returns
     `{ allow: true, expiresAtMs: T0 + 120_000 }`; assert the reader stays open at `T0 + 60_000`
     and closes at `T0 + 120_000` when the second expiry check denies.
3. **Multi-gateway revocation via shared synthetic revocation source**:
   - Instantiate two independent gateway instances (`Gateway 1`, `Gateway 2`) sharing **zero**
     in-memory proxy state, connected only through one synthetic shared revocation source owned by
     the application policy.
   - Admit a reader on `Gateway 1` with `session-X`.
   - Initiate revocation of `session-X` on `Gateway 2` (writing to the shared revocation source and
     signaling any subscribers).
   - Verify BOTH sub-cases:
     - **(a) Active delivery (pull-only, no push channel)**: publish batch 2; `Gateway 1` checks the
       shared source before delivery, withholds batch 2 and its control frame, closes the reader,
       and releases its upstream reader.
     - **(b) Idle reader (push wake via `revocationSource` AND pull fallback via `recheckEveryMs`)**:
       with zero new upstream events, `Gateway 1` closes the idle reader and releases its upstream
       reader immediately on push notification (and within `recheckEveryMs` when push is omitted).
   - Fresh admission with `session-X` fails on both `Gateway 1` and `Gateway 2`.
4. **Bearer and cookie clients both resume by offset**:
   - Connect a **bearer client** (`Authorization: Bearer <token-1>`) to `GET <proxyUrl>?offset=-1`
     on a mounted `defineService` app. Receive batch 1 + `control` (`offset_1`), disconnect, publish
     batch 2, reconnect with `GET <proxyUrl>?offset=<offset_1>` + `Authorization: Bearer <token-1>`,
     and assert only batch 2 + `control` (`offset_2`) is delivered (no duplicate batch 1).
   - Connect a **cookie client** (`Cookie: __Host-ns_session=<cookie-1>`, `Sec-Fetch-Site: same-origin`)
     to the exact same endpoint with `?offset=-1`. Receive batch 1 + `control` (`offset_1`),
     disconnect, publish batch 2, reconnect with `?offset=<offset_1>` + cookie, and assert only
     batch 2 + `control` (`offset_2`) is delivered.
   - Verify both responses parse cleanly through `parseStreamSseEventV1` and
     `reduceStreamSseReplayStateV1` from `@netscript/plugin-streams-core/sse`.

#### Security, protocol, and platform conformance gates

5. **Upstream bearer secret isolation & header hygiene**:
   - Upstream receives `Authorization: Bearer <streams-secret>` and `accept-encoding: identity`.
   - Client `Cookie` and client `Authorization` NEVER appear on the upstream request.
   - Downstream response strips `content-encoding`, `content-length`, hop-by-hop headers,
     upstream `access-control-allow-origin: *`, `www-authenticate`, and `set-cookie`, and sets
     `cache-control: no-store, no-cache, no-transform`, `x-content-type-options: nosniff`,
     `x-accel-buffering: no`, and `vary`.
   - Upstream `401`/`403` translates to redacted `502`, never client `401` and never containing the
     upstream secret.
   - Mislabeled `content-encoding: gzip` + truncating `content-length: 5` on a >1 KiB SSE stream
     passes through uncorrupted (`#219`/`#239` fence).
6. **Cookie CSRF / Origin & bearer precedence**:
   - Cookie request with `Sec-Fetch-Site: cross-site` (no allowlisted `Origin`) → `403`, zero
     upstream requests.
   - Cookie request with `Origin: https://evil.example` (not in `allowedOrigins`) → `403`, zero
     upstream requests.
   - Cookie request with `Sec-Fetch-Site: none` / `Sec-Fetch-Dest: document` → `403` by default.
   - Cookie request with `Origin` explicitly in `allowedOrigins` → admitted `200`.
   - Invalid `Authorization: Bearer bad` paired with a valid `Cookie` → `401` (no silent downgrade).
   - `clientAuth: 'bearer'` rejects cookie-only request with `401` before calling `authorize`.
   - `allowedOrigins: ['*']` throws `TypeError` at construction.
7. **`defineService`, contract authorizer, OpenAPI, and graceful shutdown**:
   - Parameterized `defineStreamEndpoint({ path: '/api/streams/projects/{projectId}', ... })`
     mounts cleanly via `defineService(router, { streamProxies: [...] })` and
     `createService(router, ...).withStreamProxy(...)`.
   - `createContractAuthorizer(contract, { streamEndpoints: [endpoint] })` enforces `access`
     (401 unauthenticated, 403 missing scope/role, 200 authorized) instead of 404 `procedure_not_found`.
   - Mounting a stream endpoint whose path overlaps an oRPC OpenAPI route throws at `build()`.
   - `/api/openapi.json` includes the mounted stream endpoint with `text/event-stream` and security
     schemes; `/` service info advertises the route.
   - Calling `running.stop()` while an SSE reader is open and idle closes the reader, cancels its
     upstream reader, and resolves `stop()` promptly (well below `drainTimeoutMs`).
8. **Backpressure, framing limits, fail-closed policy errors, and chat-proxy regression**:
   - Slow downstream consumer does not trigger unbounded upstream reads; revoking while
     backpressured still cancels the upstream reader immediately.
   - Upstream emitting `> maxPendingBatchBytes` of `event: data` without a committing `control`
     closes with `frame-limit-exceeded` and emits zero bytes of that batch.
   - Throwing/rejecting `authorize` returns redacted `503`; throwing/rejecting `recheck` closes the
     reader with zero bytes of the pending unit emitted.
   - Existing `packages/fresh/src/runtime/ai/stream-proxy_test.ts` continues passing, plus new
     regression proving `createNetScriptChatStreamProxy` no longer forwards client `Cookie` headers
     upstream.
9. **Static, JSR, and doctrine gates**:
   - Scoped `run-deno-check`, `run-deno-lint`, `run-deno-fmt`, `deno task quality:gate`,
     `deno task doc:lint`, `deno publish --dry-run --allow-dirty`, and JSR audits on
     `@netscript/contracts`, `@netscript/service`, `@netscript/plugin`,
     `@netscript/plugin-streams-core`, and `@netscript/fresh`.
   - Type fixtures verifying zero `@orpc/*` leakage in `@netscript/contracts/streams` and
     `@netscript/plugin-streams-core/proxy` public declarations (`deno doc --json`).

## Drawbacks

- **SSE frame-boundary buffering latency & memory**: Holding `event: data` frame(s) until their
  committing `event: control` frame arrives adds one control-frame hop of buffering and memory
  (bounded by `maxPendingBatchBytes`, default 4 MiB) compared to raw byte passthrough. For Durable
  Streams State Protocol, `control` is emitted immediately after each `data` batch, so latency
  overhead is negligible, while the security gain (zero unauthorized data emission and zero cursor
  corruption) is decisive.
- **Per-delivery policy check cost**: Running `recheck` before every delivery unit adds one
  application policy lookup per batch on active streams. High-throughput streams should keep
  `recheck` cheap (for example, checking an in-process revocation index updated by
  `revocationSource` or a low-latency KV/Redis read). This trade-off is intentional: caching
  decisions silently inside the proxy would weaken revocation guarantees.
- **No mid-stream HTTP status change**: HTTP cannot change a `200 text/event-stream` status code
  after headers flush; browser `EventSource` learns of revocation by closing and hitting `401`/`403`
  on reconnect. That adds one rejected reconnect round-trip per revoked browser tab.
- **Surface-area growth across four packages**: Adding `./streams` in `@netscript/contracts`,
  `./proxy` in `@netscript/plugin-streams-core`, `streamProxies` mounting in `@netscript/service`,
  and `proxyUrl` in `@netscript/fresh/streams` expands the documented public API. All additions are
  additive subpaths or optional fields, keeping existing surfaces clean.

## Rationale and alternatives

### Comparison of considered designs

| Alternative | Strengths | Why rejected |
| --- | --- | --- |
| **1. Hand-written per-app SSE pipe** (status quo) | Zero new framework API; arbitrary per-app customization. | Every consuming application re-implements header sanitization (`#219`/`#239`), hop-by-hop & wildcard CORS stripping, SSE delivery-unit parsing, atomic pre-delivery revocation gating, idle expiry timers, upstream reader cleanup, CSRF/Origin guards, `defineService` shutdown draining, and OpenAPI/contract registration. Subtle races (releasing `data` before `control` denial, forwarding client cookies upstream, hanging `server.shutdown()`) are easy to introduce and hard to audit. |
| **2. Extend `createNetScriptChatStreamProxy` only (`@netscript/fresh/ai`)** | Single file to edit; familiar to chat users. | Wrong package boundary: `@netscript/fresh/ai` pulls Fresh, Preact, Vite, and TanStack AI dependencies, making it unusable in `defineService` backend services. Its options (`NetScriptChatSessionTarget`, `/ai/chat` default prefix, `POST` body passthrough) are chat-specific, and its raw byte passthrough cannot enforce atomic batch+control revocation or contract/OpenAPI declarations. |
| **3. Enforce end-user auth directly at the Durable Streams server (`plugins/streams`)** | Removes one proxy hop for direct readers. | Violates separation of concerns and browser topology: (a) `@durable-streams/server` has no per-batch SSE frame re-check hook for application policies; (b) pushing every service's tenant/resource authorization rules and session backends into the shared infrastructure `plugins/streams` utility breaks plugin thinness and turns a utility process into an auth monolith; (c) browser `EventSource` cannot send bearer headers, and NetScript's BFF topology keeps first-party cookies on the app/gateway origin rather than on an internal Aspire resource. |
| **4. Short-lived signed stream URLs (HMAC/JWT token in query string)** | Works with native browser `EventSource` without cookies; avoids per-request header limitations. | Fails real-time revocation and introduces URL-secret exposure: (a) a signed URL remains valid until TTL expiry unless the server still checks a revocation source during delivery — so it does not eliminate the revocable proxy; (b) secrets in query strings leak into access logs, proxy logs, browser history, `Referer` headers, and error reports; (c) short TTLs force extra minting endpoints and frequent reconnect churn while still leaving an unauthorized delivery window until expiry. |
| **5. Bridge Durable Streams through oRPC `eventIterator` procedures** | Automatic oRPC contract, authorizer, and OpenAPI integration. | Incompatible wire protocol: oRPC `eventIterator` emits oRPC-framed SSE rather than `STREAM_SSE_CONTRACT_V1` (`event: data` + `event: control` with `streamNextOffset`, `streamCursor`, `upToDate`, `streamClosed`), breaking `bindStreamEventSourceV1`, `createNetScriptStreamEventSourceV1`, and `@durable-streams/client`. Also forces JSON deserialization/re-serialization of every change event and lacks native `?offset=` query resume. |

### Impact of doing nothing

Consuming applications continue writing bespoke SSE pipes with duplicated header-hygiene logic,
no standardized contract or OpenAPI representation, no `defineService` mount or graceful shutdown
draining, inconsistent CSRF protections for cookie `EventSource`, and admission-only checks that
keep delivering events to revoked or expired sessions.

## Breaking changes and migration

This RFC is **fully additive** and introduces **no breaking changes**:

- Existing `@netscript/contracts`, `@netscript/service`, `@netscript/plugin-streams-core`, and
  `@netscript/fresh` exports remain unchanged in behavior and signature.
- `createNetScriptChatStreamProxy` remains exported from `@netscript/fresh/ai` with full backward
  compatibility for existing durable-chat routes. Tightening its upstream request headers to stop
  forwarding client `Cookie` headers is a security fix; callers that intentionally need custom
  upstream headers already pass them via `target.headers` or `options.auth`.

### Migration from a hand-written application SSE proxy

1. Declare the route with `defineStreamEndpoint(...)` in `@netscript/contracts/streams`.
2. Move session lookup + resource authorization into `authorize`, and session liveness / revocation
   checks into `recheck` (optionally wiring a shared `revocationSource`).
3. Replace the manual `fetch` + `ReadableStream` route with `bindStreamProxy(endpoint, ...)` mounted
   via `defineService(router, { streamProxies: [...] })` (or `createNetScriptStreamProxy` in a
   Fresh 2.x route handler).
4. Pass `streamEndpoints: [endpoint]` to `createContractAuthorizer` if the service uses contract
   authorization.
5. Update browser `EventSource` consumers to construct URLs via `buildStreamEndpointUrl` and pass
   `proxyUrl` to `createNetScriptStreamEventSourceV1`.

### Migration from `createNetScriptChatStreamProxy` for authorized GET SSE reads

- Existing apps using `{ POST: chatProxy, GET: chatProxy }` can either pass the new optional
  `authorize` / `recheck` policy to `createNetScriptChatStreamProxy` or split `POST`
  (`toNetScriptChatResponse({ authorize, ... })`) and `GET` (`createNetScriptStreamProxy`).

## Prior art

- **WHATWG HTML Standard — Server-Sent Events (`EventSource`)**: defines `text/event-stream` block
  framing, permanent connection closure on non-`200` responses (`401`/`403`), and cookie-based
  same-origin / `withCredentials` behavior without custom request headers.
- **W3C Fetch Metadata Request Headers (`Sec-Fetch-Site`, `Sec-Fetch-Dest`)**: browser-enforced,
  non-spoofable headers enabling defense-in-depth cross-site protection for cookie-authenticated
  `GET` endpoints.
- **RFC 9110 §7.6.1**: defines hop-by-hop connection headers that must be stripped across proxy
  hops.
- **Durable Streams State Protocol & `STREAM_SSE_CONTRACT_V1`**
  ([sse-contract-v1.ts](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts)): defines
  the `['data', 'control']` wire events and control-committed opaque `streamNextOffset` replay
  contract.
- **NetScript `plugins/streams/services/src/proxy-headers.ts`**
  ([proxy-headers.ts](../plugins/streams/services/src/proxy-headers.ts)): establishes header
  sanitization and cancel-safe `restreamUpstreamBody` to avoid uncaught `AbortError`s on disconnect.
- **NetScript `packages/fresh/src/runtime/ai/stream-proxy.ts`**
  ([stream-proxy.ts](../packages/fresh/src/runtime/ai/stream-proxy.ts)): establishes the
  `accept-encoding: identity` fence (`#219`/`#239`) and Fresh `{ req: Request }` handler shape.
- **NetScript RFC 0001** ([0001-sdk-client-contributions.md](0001-sdk-client-contributions.md)):
  establishes upstream-oRPC-free public contracts, strict header/secret redaction, and
  explicit opt-in composition across existing archetypes.

## Unresolved questions

These questions remain open for RFC discussion and Final Comment Period before implementation:

1. **Missing-stream `404` on `live=sse` (fresh-stream race)**: `DurableStreamTestServer` currently
   returns `404` for `live=sse` on a not-yet-created stream (measured at `87965d80`), and
   `plugins/streams/services/src/proxy.ts:120-123` bridges `404` only for `live=long-poll`. Should
   `createNetScriptStreamProxy` simply propagate `404` (after admission succeeds), or should an
   optional `waitForStreamCreateMs` / upstream `live=sse` bridge in `plugins/streams/services` be
   added in a follow-up?
2. **Optional `id:` injection / `Last-Event-ID` fallback**: `DurableStreamTestServer` does not emit
   SSE `id:` lines (measured at `87965d80`). Should v1 strictly keep upstream framing untouched and
   resume via `?offset=` only (this draft's recommendation), or should an opt-in mode emit
   `id: <streamNextOffset>` on `event: control` and accept `Last-Event-ID` on browser
   auto-reconnect?
3. **Mid-stream revocation wire hint**: This draft closes revoked/expired readers cleanly with zero
   extra frames so `STREAM_SSE_WIRE_EVENT_NAMES_V1` stays strictly `['data', 'control']` and
   reconnect hits `401`/`403`. Should a future contract revision (`v2` or opt-in event) define an
   explicit non-cursor-advancing terminal notice frame before closing?
4. **Automatic vs explicit `createContractAuthorizer` stream-endpoint registration**: When a
   `defineService` app passes `streamProxies: [feedProxy]` AND `createContractAuthorizer(contract)`,
   should `ServiceBuilder.build()` automatically feed mounted `streamProxies` endpoints into
   `authorizer.bind(...)`, or should callers still list `streamEndpoints: [feedEndpoint]`
   explicitly in `createContractAuthorizer` options (or support both with duplicate detection)?
5. **Default `recheckEveryMs` value**: This draft proposes `30_000` ms as a balanced default for
   idle readers without push revocation. Should the default be shorter (e.g. `15_000` ms) or
   required explicitly when `revocationSource` is omitted?
6. **Non-SSE (`live=long-poll` / snapshot) authorizing proxy mode**: `createNetScriptStreamDB` uses
   `live=false` snapshot + `live=long-poll` reads
   ([stream-db-recovery-adapter.ts:120-125](../packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts#L120-L125)).
   Should v1 remain strictly SSE (`live=sse`), leaving an authorizing `StreamDB` long-poll proxy
   to a follow-up, or should the same endpoint contract support a `mode: 'sse' | 'state-protocol'`
   flag?

## Future possibilities

- **Authorizing long-poll / snapshot proxy mode** for browser `createNetScriptStreamDB` consumers
  sharing the same `defineStreamEndpoint` and application policy contract.
- **First-party `@netscript/plugin-auth-core` revocation-source adapter** bridging
  `AUTH_STREAM_EVENT_TYPES` (`auth.session.revoked`,
  [plugin-auth-core/src/streams/mod.ts:26](../packages/plugin-auth-core/src/streams/mod.ts#L26))
  or Deno KV session watches into `StreamProxyRevocationSource`.
- **Per-stream fan-out / upstream connection coalescing** (multiplexing N authorized readers of the
  same stream onto one upstream Durable Streams connection while preserving independent per-reader
  pre-delivery authorization gating, backpressure, and cancellation).
- **Alignment with producer-scoped connection configuration**
  ([#2654](https://github.com/rickylabs/netscript/issues/2654)) so services managing multiple
  Durable Streams endpoints share one connection-descriptor vocabulary across producers and proxies.
- **CLI scaffold & SDK client generation** reading `defineStreamEndpoint` exports to generate typed
  browser `EventSource` and bearer SSE client helpers.
