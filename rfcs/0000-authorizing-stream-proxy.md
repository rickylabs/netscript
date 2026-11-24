---
rfc: 0000
title: Revocable authorizing stream proxy for bearer and cookie clients
status: Draft
authors: ['@rickylabs']
created: 2026-11-24
tracking-issue: https://github.com/rickylabs/netscript/issues/2146 # reference feature issue pending maintainer decision on a companion RFC tracking issue
target-milestone: 0.0.10
---

# Revocable authorizing stream proxy for bearer and cookie clients

## Summary

This RFC proposes a generic, revocable authorizing Server-Sent Events (SSE) stream proxy for
NetScript Durable Streams:

1. A runtime-free stream endpoint contract (`defineStreamEndpoint` and `buildStreamEndpointUrl`) in
   `@netscript/contracts/streams` that declares parameterized stream proxy routes, path and query
   schemas, `access` metadata, and accepted client authentication transports (`bearer`, `cookie`, or
   `bearer-or-cookie`).
2. A revocable SSE proxy runtime (`createNetScriptStreamProxy` and `bindStreamProxy`) in
   `@netscript/plugin-streams-core/proxy` that delegates session identity, admission, re-check, and
   revocation decisions exclusively to an application-supplied policy — the proxy never owns
   sessions. Authorization is checked on admission, immediately after revocation-source subscription,
   and **before each validated SSE batch and its cursor-advancing `control` frame are released**,
   with monotonic invalidation fencing so a revoked or expired reader never receives a batch
   admitted after observed revocation, never advances its committed offset past withheld data,
   closes downstream cleanly and synchronously without waiting on upstream cleanup, releases its
   upstream reader, and fails fresh admission.
3. First-class, authoritative mounting in `@netscript/service` (`ServiceBuilder.withStreamProxy`,
   `DefineServiceOptions.streamProxies`, authoritative contract-policy binding for both
   `createContractAuthorizer` and `createContractOverlayAuthorizer`, dispatch-consistent
   path-pattern intersection checks, `remoteAddr` forwarding for trusted proxy-origin checks, and a
   pre-drain shutdown `AbortSignal` so active SSE readers close cleanly on `RunningService.stop()`).
4. A single-offset-authority `proxyUrl` option on `createNetScriptStreamEventSourceV1`
   (`@netscript/fresh/streams`) with an explicit dispose-and-rebuild reconnect contract, plus a
   backward-compatible, non-breaking relationship with `createNetScriptChatStreamProxy`
   (`@netscript/fresh/ai`) that preserves legacy defaults unchanged and adds opt-in revocable SSE
   delegation.

## Motivation

### Current baseline

Every fact below was verified against repository `main` (`87965d80`) by direct source inspection or
local execution of the synthetic baseline probe against the shipped workspace packages:

| Current fact | Evidence | Consequence |
| --- | --- | --- |
| The Durable Streams service (`startStreamsService`) protects upstream streams with one service-level auth policy (typically a shared bearer secret via `STREAMS_SECRET` / `DURABLE_STREAMS_SECRET`, resolved by `getStreamsAuth()`). | Source-inspected: [service.ts:88-162](../plugins/streams/services/src/service.ts#L88-L162), [stream-url-resolver.ts:125-139](../packages/plugin-streams-core/src/application/stream-url-resolver.ts#L125-L139) | Browser `EventSource` cannot attach custom `Authorization` headers, and the shared server secret must never reach the browser. |
| The only exported stream proxy in the workspace is `createNetScriptChatStreamProxy` in `@netscript/fresh/ai`. It is chat-session-specific (`NetScriptChatSessionTarget`, default prefix `/ai/chat`), carries no `authorize` or revocation hook, and forwards incoming client `Cookie` headers upstream via `new Headers(request.headers)`. | Source-inspected: [stream-proxy.ts:97-229](../packages/fresh/src/runtime/ai/stream-proxy.ts#L97-L229), [create-chat-connection.ts:47,66-72](../packages/fresh/src/runtime/ai/create-chat-connection.ts#L47); measured: `CHAT_GET_STATUS_WITHOUT_AUTH_HOOK 200 FORWARDED_SYNTHETIC_COOKIE true`. | Consuming applications that expose non-chat durable streams to browsers or bearer clients must hand-write SSE proxies, and GET chat stream reads lack revocable authorization. |
| Header-hygiene sanitization (`content-encoding`, `content-length`, static RFC 9110 §7.6.1 hop-by-hop stripping) is duplicated between `plugins/streams/services/src/proxy-headers.ts` and `packages/fresh/src/runtime/ai/stream-proxy.ts`; neither strips dynamic `Connection`-nominated headers, and `stream-proxy.ts` passes raw `upstream.body` without `restreamUpstreamBody`. | Source-inspected: [proxy-headers.ts:44-142](../plugins/streams/services/src/proxy-headers.ts#L44-L142), [stream-proxy.ts:20-23,55-84](../packages/fresh/src/runtime/ai/stream-proxy.ts#L20-L23) | Every hand-rolled app proxy risks the mislabeled `content-encoding: gzip` / stale `content-length` corruption bug, leaked hop-by-hop headers, and uncaught `AbortError` leaks on disconnect. |
| Upstream `DurableStreamTestServer` serves `live=sse` with `content-type: text/event-stream`, emits `access-control-allow-origin: *`, pairs `event: data` frames with cursor-advancing `event: control` frames (`streamNextOffset`, `streamCursor`, `upToDate`), emits no SSE `id:` field, resumes cleanly from `?offset=<streamNextOffset>`, and answers missing streams with HTTP `404`. | Measured against `DurableStreamTestServer` (`87965d80`): `MISSING_SSE_STATUS 404`, `SSE_STATUS 200 TYPE text/event-stream ACAO *`, `FRAMES event: data, event: control HAS_SSE_ID false`, `CONTROL_FIELDS streamCursor,streamNextOffset,upToDate`, `OFFSET_ADVANCED true RESUME_CONTAINS_FIRST false RESUME_CONTAINS_SECOND true RESUME_OFFSET_MATCHES true`. | A safe proxy must strip upstream wildcard CORS headers, preserve `STREAM_SSE_CONTRACT_V1` `data`/`control` framing, forward opaque `?offset=` resume tokens, and gate release at the validated `(data[], control)` delivery boundary. |
| `plugins/streams/services/src/proxy.ts` bridges `404` for not-yet-created streams only on `live=long-poll`, not on `live=sse`. | Source-inspected: [proxy.ts:45,120-123,193-195](../plugins/streams/services/src/proxy.ts#L120-L123) | Missing streams return `404` on `live=sse`; authorization must execute before upstream contact so unauthenticated callers cannot probe stream existence. |
| `DefineServiceOptions` in `@netscript/service` has no custom route or stream-proxy mounting option (`createService().route(...)` exists only at Layer 2), and `ServiceShutdownCoordinator` aborts its private `#controller` before awaiting `server.shutdown()` and running `onShutdown` hooks without exposing that pre-drain `AbortSignal` to route handlers. | Source-inspected: [define-service.ts:116-175,275-341](../packages/service/src/presets/define-service.ts#L116-L175), [service-builder.ts:221-225](../packages/service/src/builder/service-builder.ts#L221-L225), [service-listener.ts:98,113-114,132-148](../packages/service/src/builder/service-listener.ts#L98), [service-shutdown.ts:47,96-147](../packages/service/src/builder/service-shutdown.ts#L47) | `defineService()` apps cannot mount SSE proxies without dropping to Layer 2, and open SSE responses would stall graceful shutdown until `drainTimeoutMs` (default 30 s) expires. |
| `createContractAuthorizer` rejects unmatched routes with `404 procedure_not_found`, `ContractAuthorizerRawRoute` forbids parameterized paths (`/[*:{}?#]/`), `createAuthnMiddleware` always requires authentication on matched non-`'none'` routes regardless of `authn.protect`, and `createContractOverlayAuthorizer` defaults to `{ allow: true }` on unmatched requests when no fallback is supplied. | Source-inspected: [contract-authorizer.ts:114-120](../packages/service/src/auth/contract/contract-authorizer.ts#L114-L120), [contract-raw-routes.ts:12,43-49](../packages/service/src/auth/contract/contract-raw-routes.ts#L12), [auth-middleware.ts:192-201](../packages/service/src/auth/auth-middleware.ts#L192-L201), [contract-overlay-authorizer.ts:94-98](../packages/service/src/auth/contract/contract-overlay-authorizer.ts#L94-L98); measured: `PARAMETERIZED_RAW_ROUTE [netscript.service.contract-policy] invalid raw route: /api/streams/{feedId} is not an exact absolute path`. | Parameterized stream endpoints like `/api/streams/projects/{projectId}` cannot be declared in contracts or enforced authoritatively across both `createContractAuthorizer` and `createContractOverlayAuthorizer`, and overlap checks require true pattern intersection rather than literal-string lookups. |
| `createNetScriptStreamEventSourceV1` in `@netscript/fresh/streams` always calls `buildStreamUrl(options.streamPath, options.baseUrl ?? getStreamsUrl())`, which unconditionally prepends `/v1/stream/netscript`. | Source-inspected: [create-stream-event-source.ts:49-55](../packages/fresh/src/runtime/streams/create-stream-event-source.ts#L49-L55), [stream-url-resolver.ts:142-146](../packages/plugin-streams-core/src/application/stream-url-resolver.ts#L142-L146), [constants.ts:11](../packages/plugin-streams-core/src/domain/constants.ts#L11); measured: `EVENT_SOURCE_PATH_AND_QUERY /api/streams/v1/stream/netscript/orders/live?offset=-1&live=sse`. | Browser consumers using `createNetScriptStreamEventSourceV1` cannot target an application's custom proxy endpoint path without hand-constructing `new EventSource(...)` and seeding `bindStreamEventSourceV1` manually. |
| `STREAM_SSE_CONTRACT_V1` in `@netscript/plugin-streams-core/sse` defines the closed wire event set `['data', 'control']` and commits `lastCommittedOffset` strictly on valid `control` frames carrying a non-empty `streamNextOffset`. | Source-inspected: [sse-contract-v1.ts:12-15,65-74,195-200,230-240](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L12-L15), [stream-sse-v1.ts:80-142](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L80-L142) | Mid-stream revocation must never emit an unauthorized `data` batch, must never emit its committing `control` frame, must validate `control` before committing `data`, and must never fabricate `streamClosed: true` or unknown wire event names. |

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
different gateway instance — an already-open SSE reader must stop receiving data, must not receive
any batch admitted after observed revocation or its cursor-advancing control frame, must close
downstream promptly and release its upstream Streams connection, and must fail fresh admission.

Without a first-party primitive, every consuming application writes ad-hoc streaming glue that
repeatedly misses subtle HTTP/SSE, header-ownership, bounded-parser, backpressure, CSRF, shutdown,
and revocation-race edge cases.

### Goals

This RFC MUST:

1. Define a runtime-free, upstream-oRPC-free contract declaration for authorizing SSE stream proxy
   endpoints (`defineStreamEndpoint` and `buildStreamEndpointUrl`) carrying parameterized paths,
   schemas, access metadata, and client credential transport mode.
2. Provide a generic, framework-native SSE proxy (`createNetScriptStreamProxy` and
   `bindStreamProxy`) usable in `defineService`, `createService`, and Fresh 2.x route handlers
   without importing Fresh/Preact into backend services.
3. Keep session identity, session storage, and authorization/revocation decisions strictly in
   application policy; the proxy owns zero session state.
4. Enforce **fenced atomic delivery-unit authorization**: incrementally bound the entire SSE parser,
   validate every committing `control` frame's `streamNextOffset`, run serialized policy verification
   with monotonic invalidation fencing before releasing each batch (`event: data` frame(s)) and its
   cursor-advancing `event: control` frame, and emit zero uncommitted bytes on denial, expiry,
   malformed framing, or premature EOF.
5. Enforce finite expiry deadlines immediately upon admission, close the subscription-registration
   race with a mandatory catch-up check, cancel and dispose late results during setup, bound
   downstream termination independently of upstream cleanup, and fail fresh admission with
   `401`/`403`.
6. Bound idle readers deterministically via an injected clock port (`expiresAtMs` expiry timer and
   periodic `recheckEveryMs` idle checks) plus optional push wakeups from a shared application
   revocation source for multi-gateway deployments.
7. Make mounted contract policy authoritative across `defineService`, `createContractAuthorizer`,
   and `createContractOverlayAuthorizer`, failing closed on missing/mismatched registrations,
   explicit admission delegation, and dispatch-consistent path-pattern overlaps.
8. Enforce deterministic credential selection, Origin/Fetch Metadata checks (including trusted
   proxy-origin resolution), strict upstream secret isolation, dynamic `Connection` stripping, and
   non-overridable response header ownership.
9. Establish one offset authority between request URL and replay state (`proxyUrl` on
   `createNetScriptStreamEventSourceV1`) with an explicit dispose-and-rebuild reconnect contract.
10. Preserve legacy `createNetScriptChatStreamProxy` (`@netscript/fresh/ai`) defaults unchanged
    while defining an opt-in authorized SSE delegation path.
11. Define executable acceptance tests as the mandatory implementation gate.

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
- Add OpenAPI/service-info SSE projections, `PluginServiceConfig.streamProxies`, or public header
  sanitizer helper exports in v1 (see [Public export justification and deferrals](#public-export-justification-and-deferrals)).

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
  `event: data` frames paired with the immediately following schema-valid `event: control` frame
  carrying a non-empty `streamNextOffset`.
- **Cursor-advancing control**: An `event: control` SSE frame validated against
  `STREAM_SSE_CONTRACT_V1.schemas.control` carrying a non-empty `streamNextOffset` (and optionally
  `streamCursor`, `upToDate`, `streamClosed`) that commits pending `event: data` batches in
  `reduceStreamSseReplayStateV1`.
- **Invalidation epoch**: A per-reader monotonically increasing integer incremented on every
  observed invalidation wake (`notify({ action: 'recheck' })`, expiry deadline firing, or idle
  check firing). Used to fence stale in-flight `allow` results so no unit is enqueued after an
  observed invalidation.
- **Re-check**: An asynchronous or synchronous invocation of the application policy's `recheck`
  hook on an admitted reader — triggered after revocation-source subscription (`'post-subscribe'`),
  before releasing a delivery unit (`'before-delivery'`), at an idle interval (`'idle-interval'`),
  at session expiry (`'expiry'`), or on a push revocation wake (`'revocation-signal'`).
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
source. Mounting `streamProxies: [feedProxy]` automatically binds `projectFeedStream` into
`createContractAuthorizer` (and `createContractOverlayAuthorizer`) at `build()`, so one contract
declaration is authoritative across both route dispatch and service authz:

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
  authorize: async ({ request, params, principal, credentialMode, signal }) => {
    // Application resolves bearer or cookie session identity strictly according to credentialMode.
    const session = await sessionPolicy.resolveAndAuthorize(request, {
      principal,
      credentialMode,
      projectId: params.projectId,
      signal,
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
    authz: { authorizer: createContractAuthorizer(appContract) },
  },
  streamProxies: [feedProxy],
});
```

### 3. Consume from a browser cookie client (`EventSource`) with dispose-and-rebuild resume

A Fresh island builds the base endpoint URL from the contract (leaving `offset` to
`createNetScriptStreamEventSourceV1` as the single offset authority) and handles transport drops by
disposing the old `EventSource` and rebuilding from `binding.snapshot().lastCommittedOffset`:

```ts
// islands/ProjectFeed.tsx
import { buildStreamEndpointUrl } from '@netscript/contracts/streams';
import {
  createNetScriptStreamEventSourceV1,
  type NetScriptStreamEventSourceBindingV1,
} from '@netscript/fresh/streams';

function startProjectFeed(projectId: string, onCommittedBatch: (changes: unknown) => void) {
  const baseProxyUrl = buildStreamEndpointUrl(projectFeedStream, {
    baseUrl: location.origin,
    params: { projectId },
    query: { view: 'summary' },
  });

  let currentOffset = '-1';
  let currentCursor: string | undefined;
  let binding: NetScriptStreamEventSourceBindingV1 | undefined;
  let stopped = false;

  function open() {
    if (stopped) return;
    binding = createNetScriptStreamEventSourceV1({
      proxyUrl: baseProxyUrl,
      offset: currentOffset,
      lastObservedCursor: currentCursor,
      onEvent(event) {
        if (event.event === 'control' || event.event === 'heartbeat') {
          const snap = binding!.snapshot();
          currentOffset = snap.lastCommittedOffset ?? currentOffset;
          currentCursor = snap.lastObservedCursor;
          if (event.event === 'control' && event.payload.streamClosed) {
            stopped = true;
            binding?.dispose();
          }
          return;
        }
        if (event.event === 'data') {
          // Buffer or apply idempotently; lastCommittedOffset advances only on `control`.
          onCommittedBatch(event.payload);
          return;
        }
        if (event.event === 'error' && event.payload.code === 'transport-error') {
          // Dispose so native EventSource never auto-retries the stale initial URL.
          const snap = binding!.snapshot();
          currentOffset = snap.lastCommittedOffset ?? currentOffset;
          currentCursor = snap.lastObservedCursor;
          binding?.dispose();
          binding = undefined;
          // Schedule bounded backoff reconnect (stops permanently if fresh admission returns 401/403).
          setTimeout(open, 500);
        }
      },
    });
  }

  open();
  return () => {
    stopped = true;
    binding?.dispose();
  };
}
```

### 4. Consume from a bearer client (`fetch`) with offset resume

A CLI, mobile client, or backend service connects to the exact same endpoint with an
`Authorization: Bearer <token>` header and resumes with `?offset=<lastCommittedOffset>`:

```ts
import { buildStreamEndpointUrl } from '@netscript/contracts/streams';

declare const API_ORIGIN: string;
declare const accessToken: string;
declare const lastCommittedOffset: string;
declare const signal: AbortSignal;

const url = buildStreamEndpointUrl(projectFeedStream, {
  baseUrl: API_ORIGIN,
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
  authorize: async ({ request, credentialMode, signal }) => {
    const projectId = new URL(request.url).pathname.split('/').pop() ?? '';
    const check = await sessionPolicy.resolveCookie(request, {
      credentialMode,
      projectId,
      signal,
    });
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
| `@netscript/service` | 4 — Public DSL/Builder | Structural `StreamProxyMount` + `StreamProxyMountContext` (including `remoteAddr` and pre-drain `shutdownSignal`), `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, authoritative stream-endpoint binding in `createContractAuthorizer` and `createContractOverlayAuthorizer`, and dispatch-consistent path-pattern intersection checks. Zero dependency on `@netscript/plugin-streams-core`. |
| `@netscript/plugin-streams-core/proxy` | 3 — Runtime/Behavior | `createNetScriptStreamProxy`, `bindStreamProxy`, bounded incremental SSE delivery-unit parser and `control` validator, monotonic invalidation-epoch fencing, `ClockPort` expiry/idle/timeout scheduling, optional revocation-source subscription with `'post-subscribe'` catch-up, deterministic credential/Origin/Fetch-Metadata guards, strict 3-tier response header ownership, and decoupled downstream/upstream teardown. Internal header-hygiene helpers remain package-private. |
| `@netscript/fresh/streams` | 4 — Public DSL/Builder | Additive `proxyUrl` option on `createNetScriptStreamEventSourceV1` enforcing one offset authority with `options.offset`. |
| `@netscript/fresh/ai` | 4 — Public DSL/Builder | Preserves legacy `createNetScriptChatStreamProxy` defaults unchanged (`POST`, non-SSE `GET`, headers); adds opt-in `authorize` + `recheck` support delegating `live=sse` `GET` reads to `@netscript/plugin-streams-core/proxy` while preserving `target`, `streamPath`, `query`, `auth`, and `fetch` overrides. |

#### Acyclic dependency graph

Because `packages/plugin-streams-core/deno.json:18` already depends on `@netscript/service`,
`@netscript/service` MUST NOT import `@netscript/plugin-streams-core`. The dependency graph remains
strictly acyclic:

```text
@netscript/contracts/streams (leaf: types, schemas, URL builder)
        ▲                               ▲
        │                               │
@netscript/service (structural mount,   │
  authorizer binding, remoteAddr,       │
  pre-drain shutdown signal)            │
        ▲                               │
        └───────────────┬───────────────┘
                        │
        @netscript/plugin-streams-core/proxy (revocable SSE proxy runtime)
                        ▲
                        │
              @netscript/fresh/{ai,streams}
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
  /** Standard Schema validating path parameters extracted from `{param}` segments (required when path has params). */
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
   `^[A-Za-z_][A-Za-z0-9_]*$` where each `{paramName}` occupies an entire path segment. Duplicate
   parameter names throw `TypeError`.
2. Every `{paramName}` in `path` MUST be validated by `params`; if `path` contains `{paramName}`
   segments, `params` is required so path inputs are always validated before reaching `authorize`
   or `resolvePath`.
3. `access.authentication` defaults to `'required'`. Passing `'optional'` throws `TypeError`
   (matching `packages/service/src/auth/contract/contract-procedure-index.ts:215-217`).
   `access.audience: 'internal'` cannot be combined with `authentication: 'none'`.
4. Reserved Durable Streams protocol query parameter names — `'offset'`, `'live'`, `'cursor'` — are
   owned by the stream proxy protocol. Declaring them in `query` throws `TypeError` at construction
   so application query parameters can never collide with replay state.
5. `defineStreamEndpoint` returns a deeply frozen object (`Object.freeze`) containing zero oRPC
   symbols, zero `'~orpc'` markers, and zero runtime handles.

#### Why stream endpoints stay outside the oRPC procedure map

In [contract-procedure-index.ts:187-205](../packages/service/src/auth/contract/contract-procedure-index.ts#L187-L205)
and [openapi.ts:103](../packages/service/src/primitives/openapi.ts#L103), contract traversal
recursively walks every enumerable key of an oRPC contract router expecting `'~orpc'` procedure
nodes. Placing a non-oRPC `StreamEndpointContract` inside the oRPC procedure object would break
oRPC router traversal and `OpenAPIGenerator.generate(router)`. Stream endpoints are therefore
declared as explicit sibling exports (e.g., `export const projectFeedStream = defineStreamEndpoint(...)`)
and mounted via `streamProxies` on `defineService` / `createService().withStreamProxy(...)`.

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
`{param}` segment, appends validated application query pairs, sets `offset` when provided (omitting
`offset` lets either `createNetScriptStreamEventSourceV1` or the proxy's `defaultOffset` supply the
single authoritative offset), and sets optional `cursor`. It never appends `live=sse` to the public
proxy URL because the proxy always enforces `live=sse` on the upstream Durable Streams hop.

### Service mounting, authoritative contract policy, and shutdown (`@netscript/service`)

#### Structural mount contract

`@netscript/service` defines a runtime-neutral mount interface so `@netscript/service` stays free of
`@netscript/plugin-streams-core`:

```ts
export type StreamProxyAdmissionMode =
  | 'service-auth'
  | 'proxy-self-contained';

export interface StreamProxyMountContext {
  /** Decoded path parameters matched by the Hono route. */
  readonly params: Readonly<Record<string, string>>;
  /** Authenticated principal set by `withAuthn`, when present. */
  readonly principal?: Principal;
  /** Socket peer metadata from `ServiceEnvironment.remoteAddr`, used for trusted proxy-origin checks. */
  readonly remoteAddr?: Deno.Addr;
  /** Service-owned pre-drain shutdown signal; aborted before `server.shutdown()` waits. */
  readonly shutdownSignal: AbortSignal;
}

export interface StreamProxyMount {
  readonly endpoint: StreamEndpointContract<unknown, unknown>;
  /**
   * Controls whether service `withAuthn`/`withAuthz` authenticate the request before calling
   * `handle` (`'service-auth'`, default) or explicitly delegate exact GET stream admission to
   * `handle` (`'proxy-self-contained'`, which still enforces `endpoint.access` scopes/roles inside
   * the proxy).
   */
  readonly admission: StreamProxyAdmissionMode;
  /** Handles one matched GET request for this stream endpoint. */
  handle(request: Request, context: StreamProxyMountContext): Promise<Response>;
}
```

#### `ServiceBuilder` and `defineService` integration

1. `ServiceBuilder.withStreamProxy(mount: StreamProxyMount)` registers a stream proxy mount on the
   builder.
2. `DefineServiceOptions` gains `readonly streamProxies?: readonly StreamProxyMount[]` (applied in
   `defineService` via `builder.withStreamProxy(mount)`).
3. At `build()` time:
   - Each `mount.endpoint.path` is converted from OpenAPI `{param}` syntax to Hono `:param` syntax
     and registered as a `GET` route **after** `installAuth()` and `installBodyLimit()` and
     **before** `notFound`, matching the deferred-route lifecycle
     ([service-builder-impl.ts:515-524](../packages/service/src/builder/service-builder-impl.ts#L515-L524)).
   - The Hono route handler forwards `remoteAddr: c.env?.remoteAddr`, `principal: c.get('principal')`,
     `params: c.req.param()`, and the service's pre-drain `shutdownSignal` into
     `mount.handle(c.req.raw, context)`.
   - Before invoking `mount.handle`, the route wrapper rejects percent-encoded path-separator
     smuggling (`%2F`, `%2f`, `%5C`, `%5c`) or `..` segments in the undecoded `rawPathname` with
     HTTP `400` so Hono's decoded `c.req.path` and the policy resolver's `rawPathname` match the
     exact same segment structure.

#### Authoritative contract-policy registration (single rule, fail closed)

Two existing behaviors in `@netscript/service` make naive dual registration unsafe:

- Under [auth-middleware.ts:192-201](../packages/service/src/auth/auth-middleware.ts#L192-L201),
  `requiresAuthentication` returns `resolution.policy?.authentication !== 'none'` whenever
  `resolution?.matched` is `true`, **bypassing** `authn.protect` and `allowAnonymous`. Therefore,
  moving a matched required-auth stream route outside `authn.protect` does **not** skip `withAuthn`.
- Under
  [contract-overlay-authorizer.ts:94-98](../packages/service/src/auth/contract/contract-overlay-authorizer.ts#L94-L98),
  any request that is **unmatched** by the overlay resolver falls through to
  `options.fallback ? await options.fallback.authorize(request) : { allow: true }`. If a mounted
  stream endpoint is absent from the overlay resolver, its declared scopes, roles, and audience
  would silently be bypassed.

To eliminate split declarations and silent bypasses, this RFC establishes **one authoritative
registration rule**:

1. **Mounted `streamProxies` are the single runtime source of truth at `build()`**:
   - Extend `ContractPolicyBindingOptions`
     ([contract-policy.ts:82-91](../packages/service/src/auth/contract/contract-policy.ts#L82-L91))
     with `readonly streamMounts?: readonly Pick<StreamProxyMount, 'endpoint' | 'admission'>[]`.
   - In `ServiceBuilder.bindContractPolicy()`
     ([service-builder-impl.ts:553-562](../packages/service/src/builder/service-builder-impl.ts#L553-L562)),
     the builder ALWAYS passes all mounted `streamProxies` into `authorizer.bind(...)` — covering
     **both** `createContractAuthorizer` and `createContractOverlayAuthorizer`.
   - Callers do **not** need to repeat the stream endpoints in `createContractAuthorizer` or
     `createContractOverlayAuthorizer`. Both authorizers compile the mounted `streamMounts` into a
     `rou3` GET policy table automatically during `bind()`.
2. **Strict cross-check when `options.streamEndpoints` is also explicitly declared**:
   - `ContractAuthorizerOptions` and `ContractOverlayAuthorizerOptions`
     ([options.ts:96-128](../packages/service/src/auth/options.ts#L96-L128)) MAY accept an optional
     `readonly streamEndpoints?: readonly StreamEndpointContract<unknown, unknown>[]` for callers
     that instantiate or unit-test an authorizer standalone or want compile-time pinning.
   - Whenever `options.streamEndpoints` is explicitly provided AND `bind()` receives `streamMounts`,
     `bind()` MUST cross-check exact set equality by `id`, normalized `path`, `clientAuth`, and
     deep-equal normalized `access` policy (`authentication`, `scopes`, `roles`, `audience`).
   - Any mounted stream missing from `options.streamEndpoints`, any declared stream missing from
     `streamMounts`, or any mismatched `path`/`clientAuth`/`access` throws synchronously at `build()`
     (`[netscript.service.contract-policy] stream endpoint policy mismatch: <id>`).
3. **Overlay authorizer fails closed for mounted stream endpoints**:
   - Inside `createContractOverlayAuthorizer`, every mounted stream endpoint is compiled into the
     overlay's matched resolver table. A request matching a mounted stream endpoint is therefore
     ALWAYS `matched: true` and enforced through `authorizeProcedurePolicy` (scopes, roles,
     audience) — it can **never** fall through to the unmatched `{ allow: true }` default at
     [contract-overlay-authorizer.ts:97](../packages/service/src/auth/contract/contract-overlay-authorizer.ts#L97).
   - Non-`GET` requests targeting a mounted stream path are NOT delegated; under
     `createContractAuthorizer` they return `404 procedure_not_found` after auth, and under
     `createContractOverlayAuthorizer` any stream endpoint with `audience: 'internal'` is also
     registered in `internalRoutes` so `HEAD`/extension methods fail closed identically to internal
     oRPC procedures ([contract-procedure-index.ts:109-111](../packages/service/src/auth/contract/contract-procedure-index.ts#L109-L111)).
4. **Fail-closed posture & explicit admission delegation (`service-auth` vs `proxy-self-contained`)**:
   - **`admission: 'service-auth'` (default)**:
     - Service `withAuthn` authenticates the request and populates `principal`; service `withAuthz`
       enforces `endpoint.access` (`authentication`, `scopes`, `roles`, `audience`); then
       `mount.handle` receives `context.principal` and executes `authorize` for resource-level
       ownership and revocable `grant` creation.
     - Mounting an endpoint with `endpoint.access.authentication === 'required'` on a service with
       `withAuthn` omitted (for example `auth: { public: true }`) throws at `build()` — preventing a
       required-auth stream contract from accidentally running unauthenticated unless
       `admission: 'proxy-self-contained'` is explicitly chosen.
     - If a service mounts `withAuthn` with a **non-contract** custom `AuthorizerPort` (no `bind`)
       or no `withAuthz`, the `ServiceBuilder` stream route wrapper itself verifies
       `endpoint.access` against `c.get('principal')` before calling `mount.handle`, failing closed
       with `401`/`403` when `principal` is missing or lacks declared `scopes`/`roles`/`audience`.
     - For dual bearer + cookie services, the **recommended** configuration is `'service-auth'` with
       a `withAuthn` authenticator that resolves both bearer and cookie credentials (such as
       `createCompositeAuthenticator` from `@netscript/service/auth` or an `AuthBackendPort`
       resolving bearer-over-cookie per
       [ports/mod.ts:281-285](../packages/plugin-auth-core/src/ports/mod.ts#L281-L285)).
   - **`admission: 'proxy-self-contained'` (explicit opt-in delegation)**:
     - Intended for a bearer-only API service that mounts a cookie-accepting stream endpoint whose
       proxy `authorize` verifies the cookie session directly.
     - **Build-time guardrails**: `admission: 'proxy-self-contained'` is ONLY allowed when
       `endpoint.access.authentication === 'required'` AND `endpoint.access.audience !== 'internal'`.
       Combining `'proxy-self-contained'` with `audience: 'internal'` throws at `build()`.
     - **Middleware contract**: `ProcedurePolicyResolution` gains an explicit
       `readonly delegatedToStreamProxy?: true` marker set **only** for exact `GET` requests
       matching a `'proxy-self-contained'` stream endpoint. `createAuthnMiddleware` and
       `createAuthzMiddleware` defer authentication/authorization to `mount.handle` ONLY when
       `resolution.matched && resolution.delegatedToStreamProxy === true` (and never for `POST`,
       `HEAD`, or any non-`GET` method on that path, which still fail closed at `withAuthn`/`withAuthz`).
     - **In-proxy enforcement (fail closed)**: Inside `bindStreamProxy`, when
       `admission === 'proxy-self-contained'` and `endpoint.access.authorization` declares non-empty
       `scopes` or `roles`, `authorize` MUST return `{ allow: true, grant, principal, ... }`
       carrying the authenticated `Principal`. `bindStreamProxy` enforces
       `endpoint.access.authorization.scopes` and `roles` against `decision.principal` using the
       exact same predicate as `authorizeProcedurePolicy` and fails closed with HTTP `403` if
       `decision.principal` is missing or lacks any required scope/role. Contract `access` metadata
       therefore remains authoritative even under delegated admission.

#### Dispatch-consistent path-pattern intersection checks

Calling `ProcedureIndex.claims(streamEndpoint.path)` with a template string such as
`'/api/streams/projects/{projectId}'` is **insufficient**: in
[contract-procedure-index.ts:115-120](../packages/service/src/auth/contract/contract-procedure-index.ts#L115-L120),
`claims(path)` runs `findRoute(anyMethodRoutes, '', relative)` treating `'{projectId}'` as a
literal static segment, so it returns `false` even when an oRPC procedure owns the concrete route
`GET /api/streams/projects/summary` — which a live request `GET /api/streams/projects/summary`
matches under both patterns!

At `build()` and `bind()`, `@netscript/service` MUST perform **symmetric pattern-intersection
checking** matching real dispatch semantics (`rou3` / oRPC `toRou3Pattern` + Hono route matching):

1. Normalize every route pattern to an ordered sequence of typed segments:
   - `static(value)` — exact segment literal
   - `param` — single-segment parameter (`{name}` or `:name`, matching any non-empty segment)
   - `wildcard` — multi-segment catch-all (`**` or `*`, matching zero or more remaining segments)
2. Define `patternsIntersect(a, b)` via segment-level unification (standard 2D memoized check over
   segment indices `(i, j)`):
   - Two `static` segments intersect iff their literals are equal.
   - `param` intersects any `static` or `param` segment.
   - `wildcard` intersects zero or more segments of the other pattern (`(i + 1, j)` or `(i, j + 1)`).
   - Both patterns reaching the end simultaneously yields `true` (there exists at least one
     concrete request pathname matched by both patterns).
3. Reject at `build()` / `bind()` (throwing `[netscript.service.contract-policy] stream endpoint
   path overlaps ...`) if ANY of the following intersect:
   - Two mounted stream endpoints (`mountA.endpoint.path` vs `mountB.endpoint.path`), or duplicate
     `endpoint.id`.
   - Any stream endpoint vs ANY oRPC OpenAPI route (any HTTP method, prefixed by `apiPath` —
     catching concrete-inside-template such as `GET /api/streams/projects/summary` inside
     `/api/streams/projects/{projectId}`, template-inside-concrete, template-vs-template such as
     `/api/streams/{a}/live` vs `/api/streams/orders/{b}`, and wildcard overlaps).
   - Any stream endpoint vs ANY RPC mount (`<rpcPath>/**`, `<rpcAlias>/**`, or
     `<deprecatedRpcRoute.pathPrefix>/**`, matching
     [contract-procedure-index.ts:116-117](../packages/service/src/auth/contract/contract-procedure-index.ts#L116-L117)).
   - Any stream endpoint vs any declared `rawRoutes` or `retiredPaths` exact path (since a template
     like `/api/streams/{id}` intersects exact `/api/streams/legacy`).

#### Pre-drain shutdown signal (critical for long-lived SSE)

Today `startServiceListener`
([service-listener.ts:98,113-114,132](../packages/service/src/builder/service-listener.ts#L98))
creates `controller = new AbortController()`, passes only `{ remoteAddr: info.remoteAddr }` into
`app.fetch`, and hands `controller` to `ServiceShutdownCoordinator`, which stores it privately
([service-shutdown.ts:47](../packages/service/src/builder/service-shutdown.ts#L47)), aborts it at
line 96 **before** awaiting `server.shutdown()` at lines 100–103, and runs `onShutdown` hooks only
**after** `server.shutdown()` returns (lines 109–136).

To prevent open SSE responses from stalling graceful shutdown until `drainTimeoutMs` (default 30 s)
expires:

- `ServiceEnvironment` ([types.ts:15-18](../packages/service/src/types.ts#L15-L18)) gains an
  optional `readonly shutdownSignal?: AbortSignal` populated by `startServiceListener` with
  `controller.signal` (the signal aborted at `service-shutdown.ts:96`, *before* `server.shutdown()`
  waits).
- `ServiceBuilder` passes `c.env?.shutdownSignal ?? NEVER_ABORTED_SIGNAL` into
  `StreamProxyMountContext.shutdownSignal`.
- Every active stream proxy reader (both during setup and while streaming) listens to
  `shutdownSignal` and triggers `closeOnce('shutdown')` immediately when shutdown begins — closing
  downstream synchronously so `server.shutdown()` completes in milliseconds.

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

export type StreamProxyCredentialMode = 'bearer' | 'cookie';

export type StreamProxyAuthDecision<TGrant = unknown> =
  | {
      readonly allow: true;
      readonly grant: TGrant;
      /**
       * Authenticated principal for `admission: 'proxy-self-contained'` when the contract declares
       * `access.authorization` scopes or roles.
       */
      readonly principal?: Principal;
      /** Optional finite absolute expiry instant in epoch milliseconds (`Number.isFinite`). */
      readonly expiresAtMs?: number;
      /**
       * Optional non-reserved headers to attach to the 200 admission response.
       * Reserved framing, cache, CORS, auth, and `Set-Cookie` headers fail closed.
       */
      readonly responseHeaders?: Readonly<Record<string, string>>;
      /** Optional app-owned Set-Cookie values for refresh-on-read session authenticators. */
      readonly setCookies?: readonly string[];
    }
  | {
      readonly allow: false;
      readonly status: 401 | 403;
      /** Stable non-secret diagnostic code. */
      readonly reason: string;
    };

export type StreamProxyRecheckReason =
  | 'post-subscribe'
  | 'before-delivery'
  | 'idle-interval'
  | 'expiry'
  | 'revocation-signal';

export type StreamProxyRecheckDecision =
  | {
      readonly allow: true;
      /**
       * Updated finite expiry instant in epoch milliseconds.
       * Required and strictly `> clock.nowMs()` when `reason === 'expiry'`.
       * When omitted on other reasons, preserves the existing deadline unchanged.
       */
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
  /** Exact credential transport selected by the proxy's pre-admission guard. */
  readonly credentialMode: StreamProxyCredentialMode;
  /** Principal injected by `@netscript/service` `withAuthn`, if mounted in `'service-auth'` mode. */
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
   * When `'revoked'`, the proxy terminates immediately without awaiting another round-trip.
   * When `'recheck'` (default), the proxy bumps `invalidationEpoch` (fencing any in-flight allow)
   * and triggers a fresh serialized `recheck` against shared policy.
   */
  readonly action?: 'recheck' | 'revoked';
  readonly reason?: string;
}

/** Application-owned shared revocation channel (for cross-gateway push invalidation). */
export interface StreamProxyRevocationSource<TGrant = unknown> {
  /**
   * Register a wake callback for one admitted reader grant.
   * Must return an idempotent disposer invoked when the reader closes or setup aborts.
   */
  subscribe(
    grant: TGrant,
    notify: (signal?: StreamProxyRevocationSignal) => void,
    options?: Readonly<{ readonly signal: AbortSignal }>,
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
   * Admission policy: resolves session identity according to `credentialMode` and checks
   * authorization. Runs BEFORE path resolution, subscription, and upstream connection open.
   */
  readonly authorize: (
    context: StreamProxyAdmissionContext<TParams, TQuery>,
  ) => StreamProxyAuthDecision<TGrant> | Promise<StreamProxyAuthDecision<TGrant>>;

  /**
   * Re-authorization policy for an admitted reader.
   * Invoked after `revocationSource.subscribe` (`'post-subscribe'`), before every delivery unit
   * (`'before-delivery'`), at `expiresAtMs` (`'expiry'`), at `recheckEveryMs` (`'idle-interval'`),
   * and on `'recheck'` push wakes (`'revocation-signal'`).
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
      readonly signal: AbortSignal;
    }>,
  ) => string | Promise<string>;

  /**
   * Accepted client credential transport mode. Controls credential selection, malformed-header
   * handling, and cookie cross-site guards. Defaults to `'bearer-or-cookie'`.
   */
  readonly clientAuth?: StreamEndpointClientAuthMode;

  /**
   * Explicit cross-origin allowlist for cookie-authenticated `EventSource({ withCredentials: true })`.
   * Empty by default (strict same-origin for cookie requests). Wildcard `'*'` is rejected at construction.
   */
  readonly allowedOrigins?: readonly string[];

  /**
   * Explicit trusted reverse-proxy peer predicate for resolving `X-Forwarded-Proto` /
   * `X-Forwarded-Host` during same-origin checks (matching `@netscript/service/rate-limit`'s
   * `ServiceProxyTrust`). Defaults to `false` (forwarded headers strictly ignored).
   */
  readonly trustProxy?: ServiceProxyTrust;

  /**
   * Whether direct top-level browser navigation (`Sec-Fetch-Site: none`) is allowed for cookie
   * streams. Defaults to `false`.
   */
  readonly allowDirectNavigation?: boolean;

  /**
   * Periodic idle re-check interval in milliseconds. Bounds how long a quiet stream stays open
   * when revoked without a push `revocationSource` (worst-case pull-only idle window is
   * `recheckEveryMs + policyTimeoutMs`). Defaults to `30_000`.
   * Pass `null` to disable periodic polling (expiry timer and pre-delivery checks still run).
   */
  readonly recheckEveryMs?: number | null;

  /**
   * Optional application-provided revocation source shared across gateways for immediate wakeups.
   */
  readonly revocationSource?: StreamProxyRevocationSource<TGrant>;

  /**
   * Maximum time in milliseconds any single `authorize`, `resolvePath`, `subscribe`, `recheck`,
   * or `upstreamAuth` call may take before failing closed. Scheduled via `clock`. Defaults to `5_000`.
   */
  readonly policyTimeoutMs?: number;

  /**
   * Maximum time in milliseconds the upstream `fetch` open may take before failing closed with `504`/`503`.
   * Scheduled via `clock`. Defaults to `15_000`.
   */
  readonly upstreamConnectTimeoutMs?: number;

  /**
   * Default opaque offset used when the client omits `?offset=`. Defaults to `'-1'`.
   */
  readonly defaultOffset?: StreamSseOffsetV1;

  /**
   * Maximum total buffered UTF-8 bytes held by the SSE parser across BOTH accumulated pending
   * `event: data` frames AND the currently assembling partial frame/comment/control block.
   * Defaults to `4 * 1024 * 1024` (4 MiB). Exceeding fails closed immediately.
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
  readonly upstreamAuth?: (
    context?: Readonly<{ readonly signal: AbortSignal }>,
  ) =>
    | Readonly<Record<string, string>>
    | Promise<Readonly<Record<string, string>>>;

  /** Optional clock port for deterministic expiry, idle, and timeout scheduling. */
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
  options: Omit<StreamProxyOptions<TGrant, TParams, TQuery>, 'clientAuth'> & {
    readonly admission?: StreamProxyAdmissionMode;
  },
): StreamProxyMount;
```

#### Construction validation (fail fast before serving)

`createNetScriptStreamProxy` and `bindStreamProxy` validate options synchronously at construction:

- `authorize`, `recheck`, and `resolvePath` MUST be functions; missing hooks throw `TypeError`
  (no default allow-all).
- `recheckEveryMs` (when not `null` or `undefined`) MUST be a finite positive integer `>= 100`
  (or `>= 1` when an injected `clock` is provided for tests).
- `policyTimeoutMs` and `upstreamConnectTimeoutMs` MUST be finite positive integers
  (`<= 2_147_483_647`).
- `maxPendingBatchBytes` MUST be a finite positive integer (`>= 1024`).
- `allowedOrigins` MUST NOT contain `'*'` or `'null'`, and each entry MUST be an exact `http:` or
  `https:` origin (`URL.parse(entry)?.origin === entry`), matching
  [service-cors.ts:31-51](../packages/service/src/middleware/service-cors.ts#L31-L51).
- In `bindStreamProxy`, `admission: 'proxy-self-contained'` paired with
  `endpoint.access.audience === 'internal'` or `endpoint.access.authentication === 'none'` throws
  `TypeError` at construction.

### Admission, setup cancellation, and subscription catch-up

Every incoming request owns one `setupAbortController` linked immediately to `request.signal` and
`context.shutdownSignal`. Every async step during setup receives `setupAbortController.signal`
combined with a `ClockPort`-scheduled timeout (`policyTimeoutMs` for policy/path/subscribe/auth
hooks; `upstreamConnectTimeoutMs` for upstream `fetch`), and attaches late-settlement disposal
handlers so aborting during setup never leaks subscriptions, upstream connections, timers, or
unhandled rejections.

Every request executes this exact sequence before returning `200 text/event-stream`:

1. **Method check**: Only `GET` is admitted (`405 Method Not Allowed` with `Allow: GET` otherwise).
   If `request.signal.aborted || shutdownSignal.aborted`, return immediately with zero work.
2. **Deterministic credential selection & CSRF/Origin guard** (see
   [Credential selection, headers, and CSRF/Origin handling](#credential-selection-headers-and-csrforigin-handling)):
   - Resolves `credentialMode: 'bearer' | 'cookie'` deterministically from `clientAuth` and request
     headers, failing closed (`401`) on missing/malformed `Authorization` or disallowed mixed
     credentials.
   - Whenever `credentialMode === 'cookie'`, enforces Origin (with `trustProxy`-aware effective
     origin resolution) and Fetch Metadata (`Sec-Fetch-Site`, `Sec-Fetch-Dest`) checks, failing
     closed (`403`) before calling `authorize`.
3. **Parameter and query validation**:
   - When bound via `bindStreamProxy(endpoint, ...)`, validate `params` and application `query`
     against `endpoint.params` and `endpoint.query`; validation failures return `400 Bad Request`
     with a structured, non-secret error payload.
   - Validate optional `?offset=` and `?cursor=` query values: reject duplicate `?offset=` keys or
     values containing CR/LF/NUL or exceeding 512 UTF-8 bytes with `400`.
4. **Application admission (`authorize`) and immediate deadline activation**:
   - Invoke `authorize({ request, params, query, credentialMode, principal, signal })` bounded by
     `ClockPort` `policyTimeoutMs`.
   - If `authorize` returns `{ allow: false, status, reason }`, return JSON `{ error, reason }`
     with HTTP `status` (`401` or `403`), `cache-control: no-store`, and `vary`. No upstream fetch
     is initiated.
   - If `authorize` throws, rejects, times out, or returns a malformed decision, fail closed with
     redacted HTTP `503 Service Unavailable`.
   - **Validate `decision.responseHeaders` and `decision.setCookies`** against the reserved-header
     table immediately (see [Response header ownership](#response-header-ownership)); any reserved or
     malformed header fails closed with redacted `503` without proceeding.
   - **Enforce `endpoint.access` in `'proxy-self-contained'` mode**: when bound with
     `admission: 'proxy-self-contained'` and non-empty `endpoint.access.authorization` `scopes` or
     `roles`, verify `decision.principal` is present and satisfies every required scope/role;
     otherwise return `403` without proceeding.
   - **Immediate finite expiry validation & timer arming**:
     - If `decision.expiresAtMs !== undefined`:
       - Require `typeof decision.expiresAtMs === 'number' && Number.isFinite(decision.expiresAtMs)`
         (otherwise fail closed with redacted `503`).
       - If `decision.expiresAtMs <= clock.nowMs()`, reject admission immediately with `401`
         (`reason: 'session_expired'`).
       - Otherwise **arm the `ClockPort` expiry timer immediately** for
         `Math.max(0, decision.expiresAtMs - clock.nowMs())`. From this instant onward — across
         `resolvePath`, `subscribe`, `'post-subscribe'` `recheck`, `upstreamAuth`, and upstream
         `fetch` — reaching `expiresAtMs` aborts `setupAbortController` and terminates setup
         promptly!
5. **Path resolution (`resolvePath`)**:
   - Invoke `resolvePath({ request, params, query, grant, signal })` bounded by `policyTimeoutMs`
     and `setupAbortController.signal`.
   - Validate that the returned path starts with `/`, contains no `?`, `#`, CR/LF, NUL, or `..`
     dot-segment traversal after URL normalization. Invalid paths fail closed (`500` redacted).
6. **Revocation subscription + mandatory catch-up check (closes the registration race)**:
   - If `revocationSource` is configured:
     1. Call `revocationSource.subscribe(grant, onSignal, { signal })` bounded by `policyTimeoutMs`
        and `setupAbortController.signal`.
        - If `setupAbortController` aborts while `subscribe` is pending, exit immediately AND attach
          `.then((lateUnsub) => { try { lateUnsub(); } catch {} }, () => {})` so a late-resolving
          subscription is disposed immediately and never leaks!
     2. If `onSignal` already fired with `action: 'revoked'` during registration, invoke
        `unsubscribe()`, cancel timers, and return `401` without opening upstream.
     3. **Mandatory `'post-subscribe'` catch-up `recheck`**: Immediately after `subscribe` resolves
        (and BEFORE `upstreamAuth` or upstream `fetch`), execute the fenced
        `recheck({ grant, streamPath, reason: 'post-subscribe', signal })` loop:
        - Record `startEpoch = invalidationEpoch` before calling `recheck`.
        - If `recheck` denies (`{ allow: false }`), fails/times out, or returns invalid / expired
          `expiresAtMs <= clock.nowMs()`, invoke `unsubscribe()`, cancel timers, and return `401`
          (or `403`/`503`) with zero upstream connections opened.
        - If `invalidationEpoch !== startEpoch` when `recheck` resolves (a `'recheck'` wake arrived
          during catch-up), re-run the catch-up check (bounded by `maxRefenceAttempts`).
        - **Why this closes the gap**: any revocation committed *before* `subscribe` finished
          registering is observed by `'post-subscribe'` `recheck`'s shared-state read; any
          revocation committed *after* `subscribe` registered triggers `onSignal`. No revocation can
          slip between admission and subscription!
7. **Upstream auth & upstream connect (with late-result disposal)**:
   - Invoke `upstreamAuth({ signal })` bounded by `policyTimeoutMs` and
     `setupAbortController.signal`.
   - Build upstream URL: `buildStreamUrl(streamPath, resolvedBaseUrl)` with `?offset=<offset>&live=sse`
     (and `&cursor=<cursor>` when provided).
   - Open upstream `fetch` with `signal: upstreamAbortController.signal` (aborted whenever
     `setupAbortController` aborts) and `redirect: 'manual'` (so a hostile/misconfigured redirect
     never carries the upstream bearer secret to another origin), bounded by `ClockPort`
     `upstreamConnectTimeoutMs`.
   - If `setupAbortController` aborts while `fetch` is pending (client disconnect, `shutdownSignal`,
     expiry, or push `'revoked'`): clean up timers + `unsubscribe()`, attach
     `fetchPromise.then((res) => res.body?.cancel('setup-aborted').catch(() => {}), () => {})` to
     dispose any late upstream response body cleanly, and return immediately (`401` if revoked or
     expired during setup; `503` on shutdown/timeout).
   - Verify upstream status (also re-checking `!closed && !expired && invalidationEpoch` before
     flushing `200`; if revoked/expired while `fetch` connected, cancel `upstream.body`,
     unsubscribe, and return `401`!):
     - `200` with `content-type` starting with `text/event-stream` and non-null `body`: construct
       the 3-tier sanitized response headers and return `200` with the pull-driven SSE stream.
     - Upstream `401` or `403`: **never** forward upstream auth failure as client `401`/`403`;
       cancel body, unsubscribe, and return redacted `502 Bad Gateway`.
     - Upstream `404`: cancel body, unsubscribe, and return `404 Not Found`.
     - Upstream `410` (retention-trimmed offset) or `400` (invalid offset): cancel body,
       unsubscribe, and return `410`/`400` with sanitized headers.
     - Upstream `3xx`, `5xx`, non-SSE `content-type`, null body, or network failure: cancel body,
       unsubscribe, and return redacted `502`/`503`.

### Bounded SSE parser, delivery-unit framing, and fenced revocation during delivery

This section defines the core framing and concurrency invariants that guarantee zero uncommitted or
post-revocation output.

#### Bounded incremental SSE parser and committing `control` validation

The proxy reads UTF-8 bytes from `upstream.body.getReader()` using a strict fatal decoder
(`new TextDecoder('utf-8', { fatal: true })`) and an incremental WHATWG SSE block parser (splitting
lines on `\r\n`, `\n`, or `\r`; terminating blocks on blank lines `\r\n\r\n`, `\n\n`, or `\r\r`;
handling delimiters and multi-byte UTF-8 code points split across arbitrary chunk boundaries):

1. **Single unified byte bound during incremental assembly (`maxPendingBatchBytes`, default 4 MiB)**:
   - Let `pendingDataBytes` be the total raw UTF-8 bytes of completed `event: data` frames awaiting
     their committing `event: control` frame, and `activeBlockBytes` be the raw UTF-8 bytes
     accumulated so far in the currently assembling SSE block (whether partial `data`, partial
     `control`, or an unterminated `:...` comment).
   - As each upstream chunk is scanned incrementally (splitting at each block boundary encountered
     within the chunk so a chunk carrying multiple valid small blocks does not false-trip), the
     parser checks `pendingDataBytes + activeBlockBytes > maxPendingBatchBytes` **before** retaining
     additional bytes.
   - If the limit is exceeded — whether by accumulated `data` frames, a single oversized partial
     frame with no blank-line delimiter, an oversized `control` frame, or an oversized unterminated
     comment — the proxy immediately discards all buffered bytes, emits **zero** bytes, and executes
     `closeOnce('frame-limit-exceeded')`.
2. **Comment-only blocks**:
   - Comment lines (`:` prefix) count toward `activeBlockBytes` while assembling.
   - Once a comment-only block (containing no `event:` or `data:` fields) terminates at a blank line,
     it is discarded and `activeBlockBytes` resets to `0`. Comment frames are never emitted
     downstream and never bypass expiry or `recheckEveryMs`.
3. **Strict event-name and `data` block validation**:
   - Invalid UTF-8 bytes fail closed immediately with `closeOnce('upstream-error')`.
   - Every non-comment block MUST declare `event: data` or `event: control`. A block with omitted
     `event:` (default `'message'`) or any name outside `STREAM_SSE_WIRE_EVENT_NAMES_V1`
     (`['data', 'control']`) fails closed immediately with `closeOnce('upstream-error')` and zero
     bytes emitted (matching
     [stream-sse-v1.ts:83-85](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L83-L85)).
   - An `event: data` block MUST contain at least one `data:` field line (non-empty frame payload);
     missing `data:` fails closed with `closeOnce('upstream-error')`. The `data:` payload bytes are
     preserved verbatim and not restricted to State Protocol change schemas, allowing both
     `STREAM_SSE_CONTRACT_V1` feeds and chat/generic JSON Durable Streams to flow through cleanly.
4. **Mandatory committing `control` validation BEFORE release**:
   - When an `event: control` block completes, the proxy concatenates its `data:` lines with `\n`,
     parses JSON, and validates the payload against `STREAM_SSE_CONTRACT_V1.schemas.control`
     ([sse-contract-v1.ts:195-200,236](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L195-L200)):
     - MUST be a JSON object with a non-empty string `streamNextOffset`.
     - Optional fields MUST match their types (`streamCursor?: string`, `upToDate?: boolean`,
       `streamClosed?: boolean`).
   - If JSON parsing fails or `STREAM_SSE_CONTRACT_V1.schemas.control` rejects the payload (for
     example, missing `streamNextOffset`, empty `streamNextOffset: ""`, or non-string offset), the
     proxy MUST NOT release `pendingDataFrames` or the malformed `control` frame: it discards the
     entire uncommitted unit (emitting zero bytes) and executes `closeOnce('upstream-error')`.
5. **EOF handling**:
   - If upstream reaches EOF (`done: true`) with `pendingDataFrames.length === 0` AND
     `activeBlockBytes === 0` (no trailing partial line, partial frame, or uncommitted `data`):
     execute `closeOnce('completed')` cleanly.
   - If upstream reaches EOF while `pendingDataFrames.length > 0` OR `activeBlockBytes > 0`
     (upstream closed after `event: data` without a valid committing `event: control`, or truncated
     mid-frame / mid-comment): discard ALL buffered bytes, emit **zero** uncommitted bytes, and
     execute `closeOnce('upstream-error')`.

#### Monotonic invalidation fencing & exact ordering of read, wake, and enqueue

A single-reader concurrency hazard arises when an authoritative `recheck` reads active state at
$t_1$, a remote revocation commits on another gateway at $t_2$ and emits a push
`notify({ action: 'recheck' })` wake, and the in-flight `recheck` promise resolves `{ allow: true }`
at $t_3$. Without fencing, consuming that stale `allow` at $t_3$ would emit a post-revocation batch!

To eliminate stale delivery decisions, each admitted reader maintains:

- `closed: boolean` (initially `false`)
- `invalidationEpoch: number` (monotonically increasing integer, initially `0`)
- `pendingWakeReason: 'revocation-signal' | 'expiry' | null`
- `activeRecheck: Promise<void> | null` (enforcing **at most one** in-flight `recheck` at a time)
- `currentExpiresAtMs: number | undefined`

**Exact invalidation rules:**

- On `notify({ action: 'revoked' })`: immediately set `closed = true`, abort the in-flight
  `recheck` signal, discard any pending delivery unit, and execute `closeOnce('revoked')`.
- On `notify({ action: 'recheck' })` (or `notify()` with default action), expiry deadline tick, or
  idle-interval tick: **synchronously increment `invalidationEpoch += 1`** and update
  `pendingWakeReason` (`'expiry'` takes precedence over `'revocation-signal'`).
  - If no `recheck` is currently in flight (idle reader), immediately start a serialized `recheck`.
  - If a `recheck` IS currently in flight:
    - For `'recheck'` push wake: leave the in-flight call bounded by `policyTimeoutMs`; the bumped
      `invalidationEpoch` **fences** its eventual `allow` result!
    - For `'expiry'` tick during a non-expiry `recheck`: also abort the in-flight non-expiry check's
      per-check `AbortController` immediately (see
      [Expiry contention with a pending serialized check](#expiry-contention-with-a-pending-serialized-check)).

**Exact fenced delivery-unit commit loop (no `await` between fence check and enqueue):**

```text
upstream chunks ─▶ bounded incremental SSE parser ─▶ validate `event: control` (streamNextOffset)
                                                               │
                                                               ▼
                                          DeliveryUnit U = concatBytes([...pendingDataFrames, controlFrame])
                                                               │
                                                               ▼
                                       ┌───────────────────────────────────────────────────┐
                                       │  loop (attempts <= maxRefenceAttempts = 8):       │
                                       │   1. If closed -> discard U; return               │
                                       │   2. If expired (nowMs >= expiresAtMs) ->         │
                                       │        run expiry check / closeOnce('expired')    │
                                       │   3. startEpoch = invalidationEpoch               │
                                       │   4. decision = await runSerializedRecheck(       │
                                       │        reason, bounded by ClockPort policyTimeout)│
                                       │   ── SYNCHRONOUS CRITICAL SECTION (zero awaits) ──│
                                       │   5. If closed -> discard U; return               │
                                       │   6. If error/timeout -> closeOnce('policy-error')│
                                       │   7. If !decision.allow -> closeOnce(revoked|exp) │
                                       │   8. Validate & apply decision.expiresAtMs        │
                                       │      (non-finite -> policy-error; <= now -> exp)  │
                                       │   9. If invalidationEpoch !== startEpoch ->       │
                                       │        // STALE ALLOW FENCED! Do NOT enqueue U.   │
                                       │        reason = pendingWakeReason ?? 'revocation- │
                                       │                 signal'; continue loop            │
                                       │  10. controller.enqueue(U)   // atomic, 1 chunk   │
                                       │      deliveredUnits += 1; break loop              │
                                       └───────────────────────────────────────────────────┘
```

1. **Atomic synchronous commit**: Steps 5–10 execute inside a single JavaScript microtask turn with
   **zero `await` boundaries**. No `notify` callback, `ClockPort` timer, or `AbortSignal` listener
   can interleave between checking `!closed && invalidationEpoch === startEpoch` and calling
   `controller.enqueue(U)`.
2. **Pull-driven `highWaterMark: 0` (zero speculative pre-buffering)**: The downstream
   `ReadableStream<Uint8Array>` uses `{ highWaterMark: 0 }` and concatenates each authorized
   delivery unit into one single `Uint8Array` enqueued strictly in response to `pull(controller)`.
   Because `highWaterMark` is `0`, the proxy never speculatively pre-authorizes and pre-enqueues a
   second unrequested delivery unit into the `ReadableStream` internal queue.
3. **Bounded re-fence attempts**: If continuous push invalidations repeatedly bump
   `invalidationEpoch` during re-checks (`attempts > 8`), the proxy fails closed with
   `closeOnce('policy-error')` and emits zero bytes rather than spinning indefinitely.
4. **No fabricated protocol frames**: On revocation, expiry, malformed frame, or policy error, the
   proxy emits zero bytes of the withheld unit, NEVER fabricates `event: control` with
   `streamClosed: true`, and NEVER emits undeclared event names.

#### Observation limits and fate of already-enqueued / in-flight bytes

- **Pull-only gateway observation limit (linearizability boundary)**: When a gateway runs without a
  push `revocationSource`, Gateway A can only observe a revocation committed on Gateway B once
  Gateway B's write is visible to Gateway A's shared-state read **before** Gateway A's authoritative
  policy read inside `recheck` finishes. If Gateway A's `recheck` read completes with `{ allow: true }`
  *before* Gateway B commits the revocation, Gateway A may synchronously enqueue that single unit
  `U`; the revocation is then guaranteed to be observed no later than the very next delivery unit's
  `before-delivery` check, `expiresAtMs + policyTimeoutMs`, or `recheckEveryMs + policyTimeoutMs`
  (whichever comes first).
- **Fate of already-enqueued / in-flight bytes**: Per the WHATWG Streams standard,
  `ReadableStreamDefaultController.close()` transitions the stream cleanly to EOF **after** letting
  chunks already accepted by `controller.enqueue(...)` drain (and HTTP/TCP cannot retract bytes
  already flushed into kernel socket buffers). Because this design uses `highWaterMark: 0` and
  fences `controller.enqueue(U)` synchronously behind the monotonic `invalidationEpoch` check, any
  bytes already enqueued or in flight on the wire were strictly admitted **before** revocation was
  observed, and **zero** delivery units admitted after observed revocation can ever be enqueued.

### Idle readers, finite expiry, and contention with pending checks

Long-lived SSE streams frequently sit idle between events. Two naive strategies fail:

| Strategy | Behavior on quiet stream after expiry | Behavior on active stream after revocation | Verdict |
| --- | --- | --- | --- |
| **Next-event check only** | Reader remains open indefinitely holding sockets and upstream readers until a future event arrives. | Catches revocation on next batch. | **Rejected**: fails idle-reader expiry requirement. |
| **Timer only** | Closes idle reader at `expiresAtMs` or next tick. | **Unsafe**: batches published between revocation and the next timer tick are delivered to a revoked reader. | **Rejected**: violates zero-delivery-after-revocation invariant. |
| **Hybrid: fenced pre-delivery check + `ClockPort` expiry/idle timers + optional push wake (chosen)** | Wakes deterministically at `expiresAtMs` and every `recheckEveryMs` while idle (bounded by `policyTimeoutMs`), even when `upstreamReader.read()` is pending. | Fences and checks policy before every delivery unit; push wake terminates or re-fences immediately. | **Adopted**. |

#### Exact expiry lifecycle and sliding-extension validation

1. **Finite expiry requirement**: Any `expiresAtMs !== undefined` returned by `authorize` or
   `recheck` MUST satisfy `typeof expiresAtMs === 'number' && Number.isFinite(expiresAtMs)`.
   `NaN`, `Infinity`, and `-Infinity` fail closed (`503` on admission; `closeOnce('policy-error')`
   on `recheck`).
2. **Immediate activation**: The `ClockPort` expiry deadline timer is armed immediately when
   `authorize` returns a finite `expiresAtMs > clock.nowMs()` — governing both the remaining setup
   steps (`resolvePath`, `subscribe`, `'post-subscribe'`, `upstreamAuth`, upstream `fetch`) and the
   entire streaming phase.
3. **Sliding-extension rules**:
   - When `recheck({ ..., reason: 'expiry' })` returns `{ allow: true, expiresAtMs }`:
     - `expiresAtMs` MUST be present, finite, and strictly greater than `clock.nowMs()`
       (`expiresAtMs > clock.nowMs()`).
     - If `expiresAtMs` is omitted, non-finite, or `<= clock.nowMs()`, the proxy treats the grant as
       expired and executes `closeOnce('expired')` (never silently turning an expiring grant into an
       unbounded grant).
     - If valid, update `currentExpiresAtMs = expiresAtMs` and re-arm the `ClockPort` expiry timer.
   - When `recheck` for any other reason (`'post-subscribe'`, `'before-delivery'`, `'idle-interval'`,
     `'revocation-signal'`) returns `{ allow: true, expiresAtMs }`:
     - If `expiresAtMs === undefined`: **preserve `currentExpiresAtMs` unchanged** (omitting the
       field never clears an existing deadline).
     - If `expiresAtMs !== undefined`: validate `Number.isFinite(expiresAtMs)`. If
       `expiresAtMs <= clock.nowMs()`, immediately execute `closeOnce('expired')` with zero bytes
       emitted; otherwise update `currentExpiresAtMs` and re-arm the expiry timer.

#### Expiry contention with a pending serialized check

If the `ClockPort` expiry timer fires while a non-expiry `recheck` (for example a paused
`'before-delivery'` or `'idle-interval'` call) is already in flight:

1. Synchronously increment `invalidationEpoch += 1` and record `pendingWakeReason = 'expiry'`.
2. **Immediately abort the in-flight non-expiry check's per-check `AbortController`** so cooperative
   policy hooks stop waiting immediately. Do **not** launch a second concurrent `recheck`.
3. **Cooperative settlement path**: Once the aborted check settles (within its `ClockPort`-bounded
   `policyTimeoutMs`), its result is **fenced** (any `{ allow: true }` is discarded; zero bytes of
   any pending delivery unit are enqueued). The reader then runs ONE serialized
   `recheck(..., 'expiry')` (bounded by `ClockPort` `policyTimeoutMs`):
   - Only a valid sliding extension (finite `expiresAtMs > clock.nowMs()`) keeps the reader open and
     allows the delivery loop to re-check and continue.
   - Denial, error, timeout, or missing/non-future `expiresAtMs` executes `closeOnce('expired')`
     immediately.
4. **Non-cooperative / hung hook path**: If the paused check ignores `signal` and does not settle
   before its `ClockPort` `policyTimeoutMs` timer expires, the proxy **abandons** the hung promise
   (attaching `.catch(() => {})` and ignoring any late settlement), emits zero bytes, and executes
   `closeOnce('expired')` immediately.

#### Idle-interval bound (including policy check budget)

When `recheckEveryMs` is a positive integer (default `30_000`), the proxy resets an idle timer via
`ClockPort` after each completed `authorize`/`recheck`. If no delivery unit runs within
`recheckEveryMs`, the idle timer runs `recheck(..., 'idle-interval')` bounded by `policyTimeoutMs`.
For a pull-only gateway (no `revocationSource`), an idle revoked reader is therefore guaranteed to
close within at most **`recheckEveryMs + policyTimeoutMs`** (or
**`Math.max(0, expiresAtMs - nowMs) + policyTimeoutMs`**, whichever is earlier).

### Multi-gateway revocation

In horizontally scaled deployments, the request that revokes a session frequently lands on
**Gateway B** while the user's open SSE stream is held by **Gateway A**. Because the proxy owns zero
session state, cross-gateway revocation operates across two complementary planes backed by one
application-provided shared revocation source (e.g. Deno KV, Postgres, Redis, or
`@netscript/plugin-auth`'s `auth.session.revoked` stream from
[plugin-auth-core/src/streams/mod.ts:22-51](../packages/plugin-auth-core/src/streams/mod.ts#L22-L51)):

```text
  Gateway B (revocation initiator)                   Gateway A (holds open SSE reader)
  ────────────────────────────────                   ─────────────────────────────────
  POST /auth/signout (or admin revoke)               Open SSE reader for session S
        │                                                   │
        ▼                                                   │ (1) Setup catch-up:
  Write revoked state to                                    │     'post-subscribe' recheck reads
  Shared Revocation Source ◄────────── read ────────────────┤     shared source before upstream open
        │                                                   │
        │                                                   │ (2) Active delivery:
        │                                                   │     fenced 'before-delivery' recheck
        │                                                   │     reads shared source → deny!
        │                                                   │
        │ (3) Optional push signal                          │ (3) Push wake (idle OR in-flight):
        └───────── notify(grant) ──────────────────────────►│     'revoked' closes immediately;
                                                            │     'recheck' bumps invalidationEpoch,
                                                            │     fences in-flight allow & re-reads!
                                                            │
                                                            │ (4) Pull-only idle fallback:
                                                            │     expiresAtMs / recheckEveryMs
                                                            │     (+ policyTimeoutMs) → close!
```

1. **Setup linearizability**: `'post-subscribe'` `recheck` guarantees a revocation committed on
   Gateway B between `authorize` and `subscribe` on Gateway A is caught before upstream open.
2. **Active delivery consistency (push and pull)**: Fenced `'before-delivery'` `recheck` prevents
   Gateway A from releasing any batch + control admitted after Gateway B's revocation is observed;
   with push `notify({ action: 'recheck' })`, even an already-computed in-flight `allow` snapshot is
   fenced and re-verified against the shared source.
3. **Idle termination**: With `revocationSource`, Gateway B's notification wakes and closes idle
   readers on Gateway A immediately; without push, termination is bounded by
   `min(recheckEveryMs, remainingExpiryMs) + policyTimeoutMs`.
4. **Fresh admission**: Both gateways consult the same shared source in `authorize`, so fresh
   admission immediately fails on every gateway after revocation.

### Offset, cursor, and replay-state agreement on resume

#### Wire and proxy offset rules

1. **Opaque tokens**: `offset` and `cursor` are forwarded verbatim as opaque strings matching
   `StreamSseOffsetV1`
   ([sse-contract-v1.ts:25-26](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts#L25-L26)).
   The proxy never parses, rewrites, or synthesizes offsets.
2. **Uniform resume across bearer and cookie clients**:
   - Both bearer clients (`Authorization: Bearer ...` on `GET <proxyUrl>?offset=<token>`) and
     cookie clients (`EventSource` or credentialed `fetch` on `GET <proxyUrl>?offset=<token>`)
     resume identically via `?offset=<opaque>` (and optional `?cursor=<opaque>`).
   - Upstream requests always carry `live=sse` enforced by the proxy (`offset` defaults to
     `options.defaultOffset ?? '-1'`). Clients cannot downgrade an SSE proxy endpoint to
     `live=false` or `live=long-poll`.
3. **Retention condition for gap-free resume**:
   - Because a withheld delivery unit emits neither `event: data` nor `event: control`, a reader
     revoked before batch $N$ retains `lastCommittedOffset` from batch $N-1$.
   - Gap-free resume from `lastCommittedOffset` (for example after re-authentication with a fresh
     session, or after a transient disconnect) holds **if and only if `lastCommittedOffset` remains
     within the upstream Durable Streams server's retention window**.
   - If the stream compacted or trimmed past `lastCommittedOffset`, upstream responds with HTTP
     `410 Gone` (or `400` for an invalid offset). After admission succeeds, the proxy propagates
     `410`/`400` cleanly so the client knows incremental resume is no longer possible and must reset
     to a fresh snapshot or `offset: '-1'`.

#### One offset authority in `@netscript/fresh/streams` (`proxyUrl` mode)

`CreateNetScriptStreamEventSourceOptionsV1`
([create-stream-event-source.ts:17-30](../packages/fresh/src/runtime/streams/create-stream-event-source.ts#L17-L30))
gains a mutually exclusive `proxyUrl: string` option (alternative to `streamPath` + `baseUrl`) with
strict **single-offset-authority** validation:

1. `options.offset` is the **sole authoritative starting offset** governing both the outbound HTTP
   URL (`?offset=`) and `initialState.lastCommittedOffset` in `bindStreamEventSourceV1`.
2. In `proxyUrl` mode, `createNetScriptStreamEventSourceV1` parses `const url = new URL(options.proxyUrl)`:
   - If `url.searchParams.getAll('offset')` has **more than one value**, OR has a value that differs
     from `options.offset`, **throw `TypeError` synchronously**
     (`[netscript.fresh.streams] conflicting offset between proxyUrl and options.offset`).
   - If `proxyUrl` omits `offset`, set `url.searchParams.set('offset', options.offset)`.
   - If `proxyUrl` carries the exact same single `offset` as `options.offset`, preserve it.
   - `proxyUrl` is NOT passed through `buildStreamUrl` (so `/v1/stream/netscript` is never
     prepended) and `live=sse` is NOT forced onto the public proxy URL.
   - Providing both `proxyUrl` and `streamPath` (or `baseUrl`) throws `TypeError` synchronously.

#### Native `EventSource` reconnect behavior and uncommitted `data` frames

Because upstream Durable Streams SSE emits no SSE `id:` field (measured at `87965d80`) and v1
preserves upstream framing in offset-only mode:

1. **Native `EventSource` auto-reconnect caveat**: On a transport drop, native `EventSource`
   automatically retries the **exact URL passed to `new EventSource(url)`** — which still holds the
   *initial* `?offset=` rather than the latest `binding.snapshot().lastCommittedOffset`.
2. **Required dispose-and-rebuild reconnect pattern**: On `event.event === 'error'` with
   `payload.code === 'transport-error'`, the reconnect controller MUST:
   - Read `const { lastCommittedOffset, lastObservedCursor } = binding.snapshot()`.
   - Call `binding.dispose()` immediately (removing listeners and closing the old `EventSource` so
     native auto-retry of the stale URL is cancelled).
   - Construct a fresh `createNetScriptStreamEventSourceV1({ proxyUrl: baseProxyUrl, offset: lastCommittedOffset ?? initialOffset, lastObservedCursor, ... })`
     after bounded backoff.
   - On fresh admission `401`/`403`, the WHATWG `EventSource` spec permanently transitions the
     connection to `CLOSED` without retry; the reconnect controller checks/handles auth failure
     without spinning.
3. **Fate of `data` received without its committing `control` frame**:
   - On the **proxy** side, revocation, expiry, malformed `control`, or upstream EOF before `control`
     emits **zero** `event: data` bytes downstream.
   - On the **client/transport** side, a TCP disconnect mid-transmission can still interrupt an
     already-authorized delivery unit after the client parses `event: data` and before it receives
     the trailing `event: control`.
   - Per `reduceStreamSseReplayStateV1`
     ([stream-sse-v1.ts:118-142](../packages/plugin-streams-core/src/application/stream-sse-v1.ts#L118-L142)),
     the uncommitted batch sits in `binding.snapshot().pendingBatches` while `lastCommittedOffset`
     remains at `offset_{N-1}`.
   - When the client disposes the interrupted binding and rebuilds at `offset_{N-1}`, the old
     `pendingBatches` are discarded and the proxy replays batch `N` followed by its committing
     `event: control` (`offset_N`). Consumer handlers therefore treat `event: data` as uncommitted
     until `event: control` arrives (or apply mutations idempotently by `(type, key)` /
     `correlationId`).

### Credential selection, headers, and CSRF/Origin handling

#### Deterministic credential selection (malformed `Authorization` and mixed credentials)

Before calling `authorize`, the proxy parses `Authorization` and `Cookie` headers and selects
`credentialMode` strictly according to `clientAuth`. A **well-formed Bearer header** matches
`/^Bearer[ \t]+([\x21-\x7E]+)$/i` (case-insensitive `Bearer` scheme, ASCII space/tab separator,
single non-empty printable ASCII token with no whitespace or control characters). Any other
non-empty `Authorization` header (e.g. `Basic ...`, `Bearer` with no token, `Bearer a b`, or
control chars) is **malformed/unsupported**.

| `clientAuth` | Incoming `Authorization` | Incoming `Cookie` | Proxy action before `authorize` |
| --- | --- | --- | --- |
| `'bearer'` | Absent | Any | Reject `401` (`bearer_required`). Zero `authorize` / upstream calls. |
| `'bearer'` | Malformed / non-Bearer | Any | Reject `401` (`invalid_authorization_header`). Zero `authorize` / upstream calls. |
| `'bearer'` | Well-formed Bearer | Any (ignored) | Select `credentialMode: 'bearer'`. Skip cookie CSRF guard. `authorize` MUST verify Bearer only. |
| `'cookie'` | Present (any value) | Any | Reject `401` (`bearer_not_allowed`). Fail closed on mixed/disallowed credentials. |
| `'cookie'` | Absent | Present or absent | Run Cookie Origin & Fetch Metadata guard (`403` on failure). Select `credentialMode: 'cookie'`. |
| `'bearer-or-cookie'` | Malformed / non-Bearer | Any | Reject `401` (`invalid_authorization_header`). **Never** fall back to `Cookie`. |
| `'bearer-or-cookie'` | Well-formed Bearer | Any (ignored for auth) | Select `credentialMode: 'bearer'` (strict bearer-over-cookie precedence per [ports/mod.ts:281-285](../packages/plugin-auth-core/src/ports/mod.ts#L281-L285)). Skip cookie CSRF guard. If Bearer is invalid/revoked, `authorize` MUST fail `401` and **never** fall back to `Cookie`. |
| `'bearer-or-cookie'` | Absent | Present or absent | Run Cookie Origin & Fetch Metadata guard (`403` on failure). Select `credentialMode: 'cookie'`. |

Tokens in query strings (`?token=...`) are never read by the proxy and are explicitly discouraged.

#### Cookie Origin and Fetch Metadata guard (including trusted proxy-origin resolution)

Whenever `credentialMode === 'cookie'`, the proxy MUST run BOTH Fetch Metadata and Origin checks
before calling `authorize`:

1. **Effective target origin resolution (`trustProxy`)**:
   - **Default (`trustProxy: false`)**: `effectiveOrigin = new URL(request.url).origin`. Forwarded
     headers (`X-Forwarded-Proto`, `X-Forwarded-Host`, `Forwarded`) are **strictly ignored** so
     untrusted callers cannot spoof same-origin status.
   - **Trusted reverse proxy (`trustProxy: ServiceProxyTrust`)**: Following
     [client-address.ts:27-48](../packages/service/src/rate-limit/middleware/client-address.ts#L27-L48),
     missing socket metadata (`context.remoteAddr`) **never** permits forwarded-header trust. Only
     when `remoteAddr` has `'hostname' in remoteAddr` AND `trustProxy(remoteAddr.hostname)` returns
     `true` may the proxy consult forwarded origin headers:
     - `X-Forwarded-Proto`: if present, MUST be a single token `'http'` or `'https'` (case-insensitive);
       multiple or invalid values fail closed `403` (`invalid_forwarded_origin`).
     - `X-Forwarded-Host`: if present, MUST be a single valid `host[:port]` authority (no commas,
       whitespace, userinfo `@`, path `/`, `?`, `#`, or control chars); invalid values fail closed
       `403` (`invalid_forwarded_origin`).
     - Construct canonical `effectiveOrigin = new URL(`${proto}://${host}`).origin`.
2. **`Origin` header check**:
   - If `Origin` is present:
     - `Origin === 'null'` (opaque/sandboxed origin) is **always denied `403`**.
     - If `Origin !== effectiveOrigin`, deny `403` (`cross_site_cookie_denied`) unless `Origin` is
       an exact match in `allowedOrigins`.
3. **Fetch Metadata (`Sec-Fetch-Site` and `Sec-Fetch-Dest`)**:
   - If `Sec-Fetch-Site` is present:
     - `'same-origin'`: permitted (subject to `Origin` matching `effectiveOrigin` when `Origin` is
       present).
     - `'cross-site'` or `'same-site'`: **denied `403`** unless `Origin` is present and exactly
       matches an entry in `allowedOrigins`.
     - `'none'` (direct navigation): **denied `403`** unless `allowDirectNavigation === true`.
     - Any unrecognized `Sec-Fetch-Site` value: fail closed `403`.
   - If `Sec-Fetch-Dest` is present:
     - Reject non-stream destinations (`'document'`, `'iframe'`, `'frame'`, `'script'`, `'image'`,
       `'style'`, `'audio'`, `'video'`, `'object'`, `'embed'`, `'font'`, `'manifest'`, `'track'`)
       with `403` (except `'document'` when `allowDirectNavigation === true` and
       `Sec-Fetch-Site === 'none'`). `EventSource` and `fetch` send `Sec-Fetch-Dest: empty`.
   - Cross-origin browser readability additionally requires the gateway's
     `withCors({ origin: [...], credentials: true })` (which already rejects wildcard `*` with
     credentials at build time per
     [service-cors.ts:44-51](../packages/service/src/middleware/service-cors.ts#L44-L51)).

#### Upstream secret isolation and request header allowlist

`createNetScriptStreamProxy` constructs upstream request headers from a **strict allowlist** (never
copying `request.headers`):

| Header | Upstream direction | Rule |
| --- | --- | --- |
| `accept` | Proxy → Streams | Fixed to `'text/event-stream'`. |
| `accept-encoding` | Proxy → Streams | Fixed to `'identity'` (preserves the `#219`/`#239` gzip-mislabel fence). |
| `traceparent`, `tracestate` | Proxy → Streams | Forwarded (or injected from active span) when valid W3C trace context is present. |
| Server-side `upstreamAuth()` | Proxy → Streams | Attached strictly on the server→Streams hop; default `getStreamsAuth()`. Never echoed downstream, never logged, never included in errors. |
| Client `cookie`, client `authorization`, `host`, `origin`, `referer`, `x-forwarded-*`, arbitrary headers | **Dropped** | Never forwarded to the Durable Streams server. |

#### Response header ownership

The `200 text/event-stream` downstream response is assembled in **three strict, ordered tiers**
starting from a clean `new Headers()` (never blindly copying upstream headers):

1. **Tier 1 — Safe upstream metadata allowlist (after stripping static + dynamic `Connection` hop-by-hop headers)**:
   - Parse every comma-separated token from all upstream `Connection` headers (RFC 9110 §7.6.1
     dynamic hop-by-hop nomination) and union them with the static hop-by-hop set (`connection`,
     `keep-alive`, `proxy-authenticate`, `proxy-authorization`, `te`, `trailer`,
     `transfer-encoding`, `upgrade`).
   - Copy **ONLY** safe upstream protocol metadata headers not present in the dynamic hop-by-hop
     set: `stream-next-offset`, `stream-cursor`, `stream-up-to-date`, `stream-closed`, `etag`, and
     optional correlation headers (`traceparent`, `tracestate`, `x-request-id`).
   - Every other upstream header — including `content-encoding`, `content-length`, all static and
     `Connection`-nominated hop-by-hop fields, `access-control-*`, `cross-origin-*`,
     `www-authenticate`, `set-cookie`, `authorization`, `server`, `via`, and unlisted `x-*` headers
     — is **dropped by default** (so `DurableStreamTestServer`'s wildcard
     `access-control-allow-origin: *` measured at `87965d80` can never leak).
2. **Tier 2 — Application admission overlay (`decision.responseHeaders` and `decision.setCookies`)**:
   - The following **reserved response headers** are exclusively owned by the proxy or gateway
     middleware and MUST NOT appear in `decision.responseHeaders` (case-insensitive):
     - Framing / encoding / hop-by-hop: `content-type`, `content-encoding`, `content-length`,
       `transfer-encoding`, `connection`, `keep-alive`, `proxy-authenticate`,
       `proxy-authorization`, `te`, `trailer`, `upgrade`.
     - Mandatory cache / SSE / security: `cache-control`, `pragma`, `expires`,
       `x-content-type-options`, `x-accel-buffering`, `vary`.
     - CORS / cross-origin / auth / cookie ownership: any `access-control-*` header, any
       `cross-origin-*` header, `authorization`, `www-authenticate`, `set-cookie`.
   - If `decision.responseHeaders` contains any reserved header name/prefix, invalid HTTP header
     token, or CR/LF/NUL characters, admission **fails closed** with redacted `503` (zero upstream
     requests opened).
   - App-owned cookie refresh/rotation headers (e.g. rolling session cookies) are supplied
     exclusively via `decision.setCookies`, validated against CR/LF/NUL, and appended with
     `headers.append('set-cookie', cookie)`. (On `defineService`, `Set-Cookie` headers emitted by
     `withAuthn` via `applyAuthnResponse` at
     [auth-middleware.ts:268-279](../packages/service/src/auth/auth-middleware.ts#L268-L279) are
     likewise preserved by Hono.)
3. **Tier 3 — Proxy-owned mandatory headers (written LAST, non-overridable)**:
   - `content-type: text/event-stream; charset=utf-8`
   - `cache-control: no-store, no-cache, no-transform`
   - `x-content-type-options: nosniff`
   - `x-accel-buffering: no`
   - `vary: Authorization, Cookie, Origin, Sec-Fetch-Site, Sec-Fetch-Dest` (preserved and merged
     with gateway CORS `Vary` tokens by `createServiceCorsMiddleware`'s `unionVary` at
     [service-cors.ts:84-91](../packages/service/src/middleware/service-cors.ts#L84-L91), which also
     solely owns any `Access-Control-*` response headers).
4. **Redaction**: Never log or echo bearer tokens, cookie values, `upstreamAuth()` values, query
   parameters, `TGrant`, or raw thrown error messages from `authorize`/`recheck`. Emit only
   `streamPath`, endpoint `id`, HTTP status, stable non-secret `reason` / `StreamProxyCloseReason`,
   and `deliveredUnits`.

### Backpressure, cancellation, and decoupled resource cleanup

#### Reader state machine

Each admitted stream reader owns a finite, named lifecycle:

```text
admitting ──▶ subscribing ──▶ opening-upstream ──▶ streaming ──▶ closing ──▶ terminal
                                                                             (completed | revoked | expired |
                                                                              client-cancelled | shutdown |
                                                                              upstream-error | policy-error |
                                                                              frame-limit-exceeded)
```

#### Decoupled `closeOnce(reason)` (downstream termination independent of upstream cleanup)

Every transition into `closing` executes one idempotent `closeOnce(reason)` routine whose
**downstream termination is synchronous and never blocked by slow upstream teardown**:

1. If `closed` is already `true`, return immediately. Set `closed = true`, record terminal `reason`,
   and remove the reader from the proxy's active-reader set.
2. Cancel all `ClockPort` timer handles (expiry deadline, idle `recheckEveryMs`, active
   `policyTimeoutMs`, `upstreamConnectTimeoutMs`).
3. Remove `abort` listeners from `request.signal` and `shutdownSignal`.
4. **Close the downstream `ReadableStreamDefaultController` synchronously FIRST**
   (`try { controller.close(); } catch {}`) — guaranteeing downstream EOF completes immediately even
   if the upstream TCP socket or `upstreamReader.cancel()` stalls!
5. Abort `upstreamAbortController` (which also aborts any in-flight `recheck` or `fetch` via linked
   signals).
6. Invoke `revocationSource` unsubscribe disposer (catching and suppressing teardown errors).
7. Schedule upstream reader teardown asynchronously without blocking step 4:
   `upstreamReader.cancel(reason).catch(() => {}).finally(() => { try { upstreamReader.releaseLock(); } catch {} })`
   (suppressing `AbortError`s, mirroring
   [proxy-headers.ts:90-123](../plugins/streams/services/src/proxy-headers.ts#L90-L123)).
8. Invoke optional `onClose` observer (wrapping errors so teardown never throws).

#### Backpressure + out-of-band termination

- The downstream `ReadableStream<Uint8Array>` uses a **pull-driven** source with
  **`highWaterMark: 0`**: `pull(controller)` runs only when the downstream consumer demands the next
  delivery unit, exerting TCP/stream backpressure end-to-end without buffering unrequested delivery
  units in gateway memory.
- **Expiry timers, idle `recheckEveryMs` timers, `revocationSource` callbacks, `request.signal`, and
  `shutdownSignal` do NOT wait for `pull()`**: if a reader is either idle upstream OR stalled by
  downstream backpressure when revoked, expired, or shut down, `closeOnce()` still executes
  immediately, closing downstream synchronously and tearing down upstream asynchronously.

### Relationship to `createNetScriptChatStreamProxy` (compatibility & opt-in delegation)

#### Why generalize in `@netscript/plugin-streams-core/proxy` instead of extending `@netscript/fresh/ai`

`createNetScriptChatStreamProxy`
([stream-proxy.ts:166-229](../packages/fresh/src/runtime/ai/stream-proxy.ts#L166-L229)) solves a
narrower, chat-specific problem:

- It lives in `@netscript/fresh/ai`, which depends on Fresh, Preact, Vite, `@tanstack/ai*`, and
  `@durable-streams/tanstack-ai-transport`
  ([packages/fresh/deno.json:37-64](../packages/fresh/deno.json#L37-L64)) — unsuitable for
  `defineService` backend services.
- It proxies both `POST` (with request body + `duplex: 'half'`) and non-SSE `GET` (for example
  `application/json` snapshots and `live=long-poll` reads verified in
  [stream-proxy_test.ts:17-85,219-279](../packages/fresh/src/runtime/ai/stream-proxy_test.ts#L17-L85)),
  keyed by `NetScriptChatSessionTarget` (`sessionId`).
- It performs raw byte passthrough with no SSE delivery-unit framing, no `authorize` / `recheck`
  hooks, no idle expiry timer, and no contract declaration.

#### Strict backward compatibility for legacy callers + opt-in authorized delegation

This RFC preserves **100% backward compatibility** for existing `createNetScriptChatStreamProxy`
callers:

1. **Legacy default mode (`authorize` / `recheck` omitted) — ZERO wire-behavior change**:
   - Existing callers of `createNetScriptChatStreamProxy(options)` keep identical `POST` and `GET`
     behavior — including legacy request-header forwarding, non-SSE `application/json` / `etag` /
     `Stream-*` response preservation, query forwarding (`id`-dropping, repeated keys, resolved
     query precedence), and `AbortSignal` propagation.
   - Dropping client `Cookie` forwarding or applying the stricter SSE-only response allowlist to
     legacy unconfigured callers would silently change existing wire behavior and break legacy
     non-SSE responses; therefore **neither change is applied when `authorize` is omitted**.
   - JSDoc and migration docs explicitly note that unconfigured `createNetScriptChatStreamProxy`
     retains legacy cookie forwarding and has no authorization gate, directing production apps to
     either opt into `authorize` + `recheck` or split `GET` SSE onto `createNetScriptStreamProxy`.
2. **Opt-in authorized mode (`authorize` + `recheck` supplied on `NetScriptChatStreamProxyOptions`)**:
   - `NetScriptChatStreamProxyOptions` adds optional `authorize`, `recheck`, `clientAuth`,
     `allowedOrigins`, `trustProxy`, `recheckEveryMs`, `revocationSource`, `policyTimeoutMs`, and
     `clock` fields. Passing `authorize` without `recheck` (or vice versa) throws `TypeError` at
     construction so callers cannot accidentally enable admission without revocation.
   - When enabled:
     - **Upstream secret & cookie hygiene**: Client `Cookie` and client `Authorization` headers are
       **never** forwarded upstream (strict allowlist overlaid with `target.headers` and
       `options.auth()`).
     - **Preserved chat overrides on `GET` `live=sse` delegation**: For `GET` requests whose
       resolved upstream URL carries `live=sse` (computed via the exact existing `options.target`,
       `options.streamPath`, and `options.query` resolution — preserving `target.baseUrl`,
       `target.headers`, embedded query params on `streamPath`, default `id`-stripping, repeated
       keys, collision precedence, `options.auth`, and `options.fetch`!), the handler delegates to
       the revocable SSE delivery-unit runtime. Because the revocable SSE runtime keeps `event: data`
       payload bytes opaque while validating `event: control` (`streamNextOffset`), actual durable
       chat chunk SSE payloads stream cleanly and enforce full delivery-unit revocation.
     - **`POST` and non-SSE `GET` requests**: Run admission `authorize` (plus the cookie CSRF/Origin
       guard when `credentialMode === 'cookie'`) before proxying through the existing non-SSE
       body/header-sanitizing path, preserving `POST` `duplex: 'half'` and legacy non-SSE response
       headers (`application/json`, `etag`, `Stream-*`).
3. **Recommended pattern for new durable-chat routes**:
   - `POST` turn submission uses `toNetScriptChatResponse({ authorize, ... })`
     ([create-chat-connection.ts:471-499](../packages/fresh/src/runtime/ai/create-chat-connection.ts#L471-L499)).
   - `GET` live SSE subscription uses `createNetScriptStreamProxy` (or `bindStreamProxy` on a
     `defineStreamEndpoint` contract), unifying all live SSE streams on one revocable proxy model.

### Acceptance tests and implementation gates

An implementation is NOT complete until every acceptance case below passes in automated tests with
Deno's resource and async-op sanitizers enabled (no `sanitizeOps: false` / `sanitizeResources: false`
bypasses on proxy unit/conformance suites).

#### Mandatory core revocation, fencing, expiry & resume acceptance suite

1. **Revocation during delivery — two synthetic sessions with BOTH barriers (pre-read AND post-allow-snapshot fence)**:
   - Mount one stream proxy backed by a single durable stream (against both a deterministic fake SSE
     upstream AND a real `DurableStreamTestServer`).
   - Give the application policy two synthetic sessions (`session-A`, `session-B`) authorized for
     the same stream path, both receiving initial catch-up batch 1 and its committing control frame
     (`offset_1`).
   - **Barrier 1 (before shared-state read)**: Publish batch 2. Pause both readers'
     `recheck(..., 'before-delivery')` **before** reading shared policy state. Revoke `session-B` in
     the application policy, then release Barrier 1.
     - Assert `session-A` receives **both** batch 2 (`event: data`) **and** its cursor-advancing
       `event: control` (`offset_2`).
     - Assert `session-B` receives **neither** batch 2 (`event: data`) **nor** `control`
       (`offset_2`); its last observed offset remains `offset_1`.
     - Assert `session-B`'s downstream stream closes cleanly (EOF, zero fabricated `streamClosed: true`
       or unknown wire events), its upstream reader is cancelled and released (active upstream reader
       count drops from 2 to 1), and fresh admission with `session-B` fails with `401`/`403` and
       opens **zero** upstream connections.
   - **Barrier 2 (after an `allow` snapshot, with remote revocation on Gateway 2 + push `'recheck'` wake)**:
     Instantiate `Gateway 1` and `Gateway 2` wired to one shared synthetic revocation source. Admit
     `session-A` and `session-B` on `Gateway 1` (both receive batch 1 + `offset_1`). Publish batch 2.
     Pause both readers inside `recheck(..., 'before-delivery')` **after** reading the active policy
     state (holding an already-computed `{ allow: true }` snapshot) and **before** returning to the
     proxy. While paused at Barrier 2, initiate revocation of `session-B` on **Gateway 2**, writing
     revoked state to the shared source and emitting `notify({ action: 'recheck' })` (specifically
     `'recheck'`, NOT `'revoked'`) to `Gateway 1`. Release Barrier 2.
     - Assert `Gateway 1` fences `session-B`'s stale `allow` snapshot (because `invalidationEpoch`
       advanced), executes a fresh serialized `recheck` against shared state, receives `{ allow: false }`,
       emits **neither** batch 2 **nor** `control` (`offset_2`), closes `session-B` cleanly, cancels
       and releases its upstream reader, and rejects fresh admission on both gateways.
     - Assert `session-A` receives batch 2 and its cursor-advancing `control` (`offset_2`).
   - **Pull-only observation-limit control**: Repeat Barrier 2 **without** `revocationSource` where
     `Gateway 2` revokes `session-B` *after* `Gateway 1`'s batch 2 read already returned
     `{ allow: true }` and *before* batch 3 is published; assert batch 2 (admitted prior to
     observation) may drain cleanly on `session-B`, while batch 3 and `offset_3` are strictly
     withheld and `session-B` closes before batch 3.
2. **Idle reader at expiry, expiry during paused check, setup cancellation & subscription catch-up** (using injected fake `ClockPort` and deferred hooks):
   - **Idle expiry + sliding extension**: Admit reader with `expiresAtMs = T0 + 60_000` on an idle
     stream (pending upstream `read()`). Advance fake clock to `T0 + 60_000`; assert
     `recheck(..., 'expiry')` runs without any upstream event, closes downstream cleanly, cancels and
     releases upstream reader, leaves zero pending timers, and fails fresh admission `401`. Repeat
     where `recheck(..., 'expiry')` returns `{ allow: true, expiresAtMs: T0 + 120_000 }` (stays open
     until `T0 + 120_000`), and negative controls where `recheck(..., 'expiry')` omits `expiresAtMs`,
     returns `expiresAtMs <= clock.nowMs()`, or returns `NaN`/`Infinity` (all fail closed immediately).
   - **Expiry during a paused `before-delivery` check**: Pause `recheck(..., 'before-delivery')` on
     a deferred promise while `expiresAtMs` arrives on the fake clock. Verify BOTH sub-cases:
     (a) cooperative hook observing aborted `signal` → stale `allow` fenced, zero bytes of pending
     batch emitted, serialized `'expiry'` check runs and closes reader; (b) non-cooperative hung
     hook ignoring `signal` → after `policyTimeoutMs` on fake clock, proxy abandons the hung promise,
     closes reader `'expired'` with zero bytes emitted, and discards late resolution with zero
     unhandled rejections.
   - **Revocation between admission and `subscribe` registration**: Pause
     `revocationSource.subscribe` on a deferred promise after `authorize` returned `{ allow: true }`.
     Revoke the session in the shared store *before* `subscribe` finishes registering (so the push
     broadcast is missed). Release `subscribe`. Assert `'post-subscribe'` catch-up `recheck` catches
     the revocation, calls `unsubscribe()`, opens **zero** upstream connections, and returns `401`.
   - **Shutdown / abort during setup (`resolvePath`, `subscribe`, `upstreamAuth`, upstream `fetch` open)**:
     Trigger `shutdownSignal` (and separately client `request.signal` abort) while each setup hook
     is paused on a deferred promise. Assert the handler returns promptly, late-resolving `subscribe`
     immediately invokes its disposer, late-resolving upstream `fetch` immediately cancels its
     `Response.body`, and zero timers/listeners/resources leak.
   - **Downstream close decoupled from slow upstream cleanup**: Inject an upstream reader whose
     `cancel()` returns a never-immediately-resolving deferred promise. Revoke/expire the reader and
     assert downstream `ReadableStream` reaches EOF immediately (before `cancel()` resolves), then
     resolve `cancel()` and assert `releaseLock()` completes cleanly.
3. **Multi-gateway revocation via shared synthetic revocation source**:
   - Instantiate two independent gateway instances (`Gateway 1`, `Gateway 2`) sharing zero in-memory
     proxy state, connected only through one synthetic shared revocation source owned by policy.
   - Admit `session-X` on `Gateway 1`; initiate revocation of `session-X` on `Gateway 2`.
   - Verify: (a) pull-only active delivery withholds batch 2 + `control` and releases upstream reader;
     (b) push-wired idle reader closes immediately on `Gateway 1`; (c) pull-only idle reader closes
     within `recheckEveryMs + policyTimeoutMs` on fake clock; (d) fresh admission fails on both
     gateways.
4. **Bounded SSE parser, committing `control` validation, and premature EOF**:
   - **Split frames**: multi-byte UTF-8 payloads and `\r\n\r\n` delimiters split across 1-byte chunks
     assemble losslessly and emit exact wire bytes after `recheck` allows.
   - **Oversize partial frame**: unterminated `event: data` frame exceeding `maxPendingBatchBytes`
     fails closed with `frame-limit-exceeded` during incremental assembly and emits **zero** bytes.
   - **Oversize `control` frame**: `event: control` block exceeding `maxPendingBatchBytes` fails
     closed with `frame-limit-exceeded` and emits **zero** bytes of preceding `data` or `control`.
   - **Oversize unterminated comment**: `:keepalive...` exceeding `maxPendingBatchBytes` without a
     blank-line terminator fails closed with `frame-limit-exceeded`.
   - **Malformed `control` frame**: `event: control` with invalid JSON, missing `streamNextOffset`,
     empty `streamNextOffset: ""`, or invalid field type fails closed with `upstream-error` and
     releases **zero** bytes of preceding `pendingDataFrames` or `control`.
   - **Unsupported / malformed frames**: omitted `event:` (`message`), unknown `event: custom`, or
     `event: data` with no `data:` line fails closed with `upstream-error` and zero output.
   - **EOF before `control` and EOF mid-frame**: upstream closes after sending `event: data` with no
     committing `control` (or truncated mid-frame) → closes with `upstream-error` and emits **zero**
     uncommitted bytes.
5. **Offset resume, single offset authority, and interrupted-delivery reconnect**:
   - **Bearer and cookie manual resume**: Both a bearer client (`Authorization: Bearer <token-1>`)
     and a cookie client (`Cookie: __Host-ns_session=<cookie-1>`, `Sec-Fetch-Site: same-origin`)
     connect to the same `defineService` endpoint with `?offset=-1`, commit batch 1 (`offset_1`),
     disconnect, publish batch 2, reconnect with `?offset=<offset_1>`, and receive only batch 2 +
     `control` (`offset_2`), parsing cleanly through `parseStreamSseEventV1` and
     `reduceStreamSseReplayStateV1`.
   - **Fresh helper conflicting-offset fixture**: `createNetScriptStreamEventSourceV1` with
     `proxyUrl` carrying `?offset=old` and `options.offset: 'new'` (and duplicate `?offset=a&offset=b`)
     throws `TypeError` synchronously; omitting `?offset=` or matching `?offset=same` succeeds with
     matching URL `?offset=` and `binding.snapshot().lastCommittedOffset`.
   - **Interrupted-delivery reconnect test**: Connect via `createNetScriptStreamEventSourceV1` in
     `proxyUrl` mode, commit batch 1 (`offset_1`), deliver `event: data` for batch 2 WITHOUT its
     committing `event: control`, then trigger `transport-error`. Assert
     `binding.snapshot().lastCommittedOffset === offset_1` and `pendingBatches.length === 1`. Dispose
     the interrupted binding and rebuild via `createNetScriptStreamEventSourceV1` from `offset_1`;
     assert the new connection requests `?offset=<offset_1>` (NOT original `-1`), receives batch 2 +
     `control(offset_2)`, and commits `offset_2` with zero gap.
   - **Retention-trimmed `410` resume**: Resuming with a trimmed offset after admission propagates
     HTTP `410` cleanly.

#### Security, contract-policy, and compatibility conformance gates

6. **Credential selection, Origin/Fetch Metadata, proxy trust, and response header ownership**:
   - Upstream receives `Authorization: Bearer <streams-secret>` and `accept-encoding: identity`;
     client `Cookie` and client `Authorization` NEVER appear on upstream requests; upstream `302`
     redirect is NOT followed (`redirect: 'manual'`, returns `502` without sending `upstreamAuth` to
     redirect target); upstream `401`/`403` maps to redacted `502`.
   - **Mixed and malformed credentials**:
     - `bearer-or-cookie`: malformed `Authorization: Basic abc` or `Authorization: Bearer` paired
       with valid `Cookie` → `401` (`invalid_authorization_header`), zero `authorize` calls.
     - `bearer-or-cookie`: invalid/revoked `Authorization: Bearer bad` paired with valid `Cookie` →
       `401` (no silent downgrade to `Cookie`).
     - `clientAuth: 'cookie'`: any `Authorization` header → `401` (`bearer_not_allowed`).
     - `clientAuth: 'bearer'`: cookie-only request → `401` (`bearer_required`); valid Bearer +
       `Cookie` → `200` with `credentialMode: 'bearer'` and no cookie forwarded upstream.
   - **Cookie Origin / Fetch Metadata / `trustProxy`**:
     - `Sec-Fetch-Site: cross-site` (no allowlisted `Origin`), `Origin` not in `allowedOrigins`
       (symbolic `<cross-site-origin>`), `Origin: null`, and `Sec-Fetch-Site: none` /
       `Sec-Fetch-Dest: document` → `403`, zero `authorize`/upstream calls.
     - `Origin` matching an exact entry in `allowedOrigins` → admitted `200`; `allowedOrigins: ['*']`
       or `['null']` throws `TypeError` at construction.
     - `trustProxy: false` (default): spoofed `X-Forwarded-Proto` + `X-Forwarded-Host` ignored →
       `403`. With trusted `remoteAddr` matching `trustProxy(ip) === true`, valid forwarded origin
       resolves same-origin `200`; with untrusted `remoteAddr` or missing `remoteAddr`, forwarded
       headers ignored → `403`.
   - **Response header ownership & dynamic `Connection` stripping**:
     - Upstream returns `Connection: keep-alive, X-Internal-Hop`, `X-Internal-Hop: secret`,
       `X-Unlisted: leak`, `access-control-allow-origin: *`, `content-encoding: gzip`,
       `content-length: 5`, `www-authenticate: Bearer`, `set-cookie: upstream=1`, plus safe
       `etag: "v1"` and `stream-next-offset: o1`. Assert ONLY allowlisted safe metadata + proxy
       mandatory headers survive; dynamic `Connection`-nominated and unlisted headers are stripped;
       >1 KiB SSE stream passes uncorrupted (`#219`/`#239` fence).
     - `authorize` returning reserved `responseHeaders` (`cache-control`, `content-type`,
       `access-control-allow-origin`, `vary`, `set-cookie`) fails closed `503` with zero upstream
       calls; valid `decision.setCookies` emits `Set-Cookie` on the `200` SSE response.
7. **Authoritative `defineService` contract policy, overlap detection, and graceful shutdown**:
   - Mounting `streamProxies: [feedProxy]` with `createContractAuthorizer(contract)` (single
     registration) enforces `access` (`401` unauthenticated, `403` wrong scope/role/audience, `200`
     authorized).
   - Mounting with `createContractOverlayAuthorizer(contract)` ALSO enforces `endpoint.access`
     (wrong-scope caller receives `403`, proving zero fallthrough to overlay's unmatched
     `{ allow: true }` default).
   - Explicitly passing `options.streamEndpoints` to either authorizer with an **omitted** mounted
     endpoint or a **mismatched** `access`/`clientAuth`/`path` throws at `build()`.
   - Explicit `admission: 'proxy-self-contained'` enforces `endpoint.access` scopes/roles inside
     `bindStreamProxy` (`403` when `principal` is missing or lacks required scope), fails closed on
     non-`GET` methods at service auth middleware, and throws at `build()` if combined with
     `audience: 'internal'`.
   - **Dispatch-consistent path-pattern overlap tests**:
     - Concrete-inside-template: oRPC route `GET /api/streams/projects/summary` + stream endpoint
       `/api/streams/projects/{projectId}` throws at `build()`.
     - Template-vs-template: `/api/streams/{a}/feed` + `/api/streams/projects/{b}` throws at
       `build()`.
     - RPC-mount overlap: `/api/rpc/{feedId}` throws at `build()`.
     - Encoded slash smuggling (`/api/streams/projects/a%2Fb`) fails closed `400`.
   - Calling `running.stop()` while an SSE reader is open and idle closes the reader promptly via
     pre-drain `shutdownSignal`, cancels its upstream reader, and resolves `stop()` well below
     `drainTimeoutMs`.
8. **Backpressure, fail-closed policy errors, and chat-proxy compatibility**:
   - Slow downstream consumer exerts backpressure via `highWaterMark: 0` (no unbounded upstream
     reads); revoking while backpressured closes downstream immediately and cancels upstream.
   - Throwing/rejecting `authorize` returns redacted `503`; throwing/rejecting `recheck` closes the
     reader with zero bytes of the pending unit emitted.
   - **Legacy chat proxy regression**: ALL existing `POST` and non-SSE `GET` tests in
     [stream-proxy_test.ts](../packages/fresh/src/runtime/ai/stream-proxy_test.ts) pass unchanged
     with zero wire-behavior change for unconfigured callers.
   - **Opt-in authorized chat proxy**: Supplying `authorize` + `recheck` on
     `createNetScriptChatStreamProxy` streams actual durable-chat SSE payloads (`event: data` +
     `event: control`), honors delivery-unit revocation, preserves `target` (`baseUrl`, `headers`),
     `streamPath` (including embedded query params), `query` (`id`-dropping, repeated keys,
     collision precedence), `auth`, and `fetch` overrides, keeps `POST` and non-SSE `GET` working
     behind admission `authorize`, and never forwards client `Cookie` upstream.
9. **Static, JSR, and doctrine gates**:
   - Scoped `run-deno-check`, `run-deno-lint`, `run-deno-fmt`, `deno task quality:gate`,
     `deno task doc:lint`, `deno publish --dry-run --allow-dirty`, and JSR audits on
     `@netscript/contracts`, `@netscript/service`, `@netscript/plugin-streams-core`, and
     `@netscript/fresh`.
   - Type fixtures verifying zero `@orpc/*` leakage in `@netscript/contracts/streams` and
     `@netscript/plugin-streams-core/proxy` public declarations (`deno doc --json`).

## Drawbacks

- **SSE frame-boundary buffering latency & memory**: Holding `event: data` frame(s) until their
  committing `event: control` frame arrives adds one control-frame hop of buffering and memory
  (bounded across the entire incremental parser by `maxPendingBatchBytes`, default 4 MiB) compared
  to raw byte passthrough. For Durable Streams State Protocol, `control` is emitted immediately
  after each `data` batch, so latency overhead is negligible, while the security gain (zero
  unauthorized data emission and zero cursor corruption) is decisive.
- **Per-delivery policy check cost**: Running `recheck` before every delivery unit adds one
  application policy lookup per batch on active streams (plus one `'post-subscribe'` catch-up check
  when `revocationSource` is wired). High-throughput streams should keep `recheck` cheap (for
  example, checking an in-process revocation index updated by `revocationSource` or a low-latency
  KV/Redis read). Caching decisions silently inside the proxy would weaken revocation guarantees.
- **No mid-stream HTTP status change**: HTTP cannot change a `200 text/event-stream` status code
  after headers flush; browser `EventSource` learns of revocation by closing and hitting `401`/`403`
  on reconnect. That adds one rejected reconnect round-trip per revoked browser tab.
- **Client reconnect responsibility in offset-only mode**: Without SSE `id:` injection, browser
  consumers must dispose and rebuild `createNetScriptStreamEventSourceV1` on `transport-error`
  rather than relying on native `EventSource` auto-retry of the original URL.

## Rationale and alternatives

### Comparison of considered designs

| Alternative | Strengths | Why rejected |
| --- | --- | --- |
| **1. Hand-written per-app SSE pipe** (status quo) | Zero new framework API; arbitrary per-app customization. | Every consuming application re-implements header ownership, dynamic `Connection` stripping, bounded SSE parsing, fenced pre-delivery revocation gating, setup/expiry/subscription-race handling, CSRF/Origin + `trustProxy` guards, `defineService` shutdown draining, and authoritative contract policy. Subtle races are easy to introduce and hard to audit. |
| **2. Extend `createNetScriptChatStreamProxy` only (`@netscript/fresh/ai`)** | Single file to edit; familiar to chat users. | Wrong package boundary: `@netscript/fresh/ai` pulls Fresh, Preact, Vite, and TanStack AI dependencies, making it unusable in `defineService` backend services. Its options (`NetScriptChatSessionTarget`, `/ai/chat` default prefix, `POST` body passthrough) are chat-specific, and its raw byte passthrough cannot enforce fenced atomic batch+control revocation or contract declarations. |
| **3. Enforce end-user auth directly at the Durable Streams server (`plugins/streams`)** | Removes one proxy hop for direct readers. | Violates separation of concerns and browser topology: (a) `@durable-streams/server` has no per-batch SSE frame re-check hook for application policies; (b) pushing every service's tenant/resource authorization rules and session backends into the shared infrastructure `plugins/streams` utility turns a utility process into an auth monolith; (c) browser `EventSource` cannot send bearer headers, and NetScript's BFF topology keeps first-party cookies on the app/gateway origin. |
| **4. Short-lived signed stream URLs (HMAC/JWT token in query string)** | Works with native browser `EventSource` without cookies; avoids per-request header limitations. | Fails real-time revocation and introduces URL-secret exposure: (a) a signed URL remains valid until TTL expiry unless the server still checks a revocation source during delivery — so it does not eliminate the revocable proxy; (b) secrets in query strings leak into access logs, proxy logs, browser history, `Referer` headers, and error reports; (c) short TTLs force extra minting endpoints and reconnect churn while leaving an unauthorized delivery window until expiry. |
| **5. Bridge Durable Streams through oRPC `eventIterator` procedures** | Automatic oRPC contract, authorizer, and OpenAPI integration. | Incompatible wire protocol: oRPC `eventIterator` emits oRPC-framed SSE rather than `STREAM_SSE_CONTRACT_V1` (`event: data` + `event: control` with `streamNextOffset`, `streamCursor`, `upToDate`, `streamClosed`), breaking `bindStreamEventSourceV1`, `createNetScriptStreamEventSourceV1`, and `@durable-streams/client`. |
| **6. Narrower variant (contract + mount + runtime only, using existing `bindStreamEventSourceV1` directly with no `proxyUrl`, no OpenAPI/service-info projection, and no extra sanitizer exports)** | Smallest possible public API diff; zero changes to `@netscript/fresh/streams` or OpenAPI. | **Mostly adopted, with one deliberate retention**: this RFC adopts the narrower variant's deferrals (deferring OpenAPI projection, service-info changes, `PluginServiceConfig.streamProxies`, and public sanitizer helper exports), while retaining ONLY the single additive `proxyUrl` option on `createNetScriptStreamEventSourceV1` because forcing every browser caller to drop down to `new EventSource(url)` + `bindStreamEventSourceV1` re-introduces the measured `/v1/stream/netscript` trap and lets request `?offset=` silently drift from `initialState.lastCommittedOffset`. |

### Public export justification and deferrals

| Symbol / package | Disposition | Rationale |
| --- | --- | --- |
| `defineStreamEndpoint`, `buildStreamEndpointUrl`, `StreamEndpointContract`, `StreamEndpointClientAuthMode` (`@netscript/contracts/streams`) | **Included in v1** | Required to declare parameterized stream routes in a runtime-free contract and construct type-checked proxy URLs for both cookie and bearer clients. |
| `StreamProxyMount`, `StreamProxyMountContext`, `StreamProxyAdmissionMode`, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `ContractPolicyBindingOptions.streamMounts`, `streamEndpoints` cross-check option (`@netscript/service`) | **Included in v1** | Minimum structural seam keeping `@netscript/service` acyclic with `@netscript/plugin-streams-core`, making mounted contract policy authoritative in both authorizers, exposing `remoteAddr` for `trustProxy`, and providing pre-drain `shutdownSignal`. |
| `createNetScriptStreamProxy`, `bindStreamProxy` and their option/port/decision types (`@netscript/plugin-streams-core/proxy`) | **Included in v1** | Core revocable SSE proxy runtime usable from both `defineService` and Fresh 2.x handlers. |
| `proxyUrl` on `CreateNetScriptStreamEventSourceOptionsV1` (`@netscript/fresh/streams`) | **Included in v1** | Single additive option eliminating the forced `/v1/stream/netscript` prefix and enforcing one offset authority between URL and `initialState.lastCommittedOffset`. |
| Opt-in `authorize` / `recheck` options on `NetScriptChatStreamProxyOptions` (`@netscript/fresh/ai`) | **Included in v1** | Non-breaking bridge allowing existing durable-chat routes to opt into revocable SSE delivery without breaking legacy callers. |
| OpenAPI `createOpenAPISpec` SSE projection & `/` `serviceInfoEndpoints()` entries (`@netscript/service`) | **Deferred to follow-up** | Not required for runtime revocation, admission, or contract enforcement; deferring keeps `@netscript/service` changes strictly focused on mounting, policy authority, and shutdown. |
| Public sanitizer / re-streaming helper exports (`STRIPPED_STREAM_PROXY_RESPONSE_HEADERS`, `sanitizeStreamProxyResponseHeaders`, `restreamUpstreamBody`) | **Deferred (kept package-internal)** | Internal hygiene detail of `@netscript/plugin-streams-core/proxy`; no external consumer requirement justifies freezing these names in the public JSR API. |
| `PluginServiceConfig.streamProxies` (`@netscript/plugin/service`) | **Deferred to follow-up** | Application services mount authorizing stream proxies via `defineService` / `createService`; plugin services can add forwarding when a first-party plugin needs it. |

### Impact of doing nothing

Consuming applications continue writing bespoke SSE pipes with duplicated header-hygiene logic,
no standardized contract representation, no `defineService` mount or graceful shutdown draining,
inconsistent CSRF/Origin protections for cookie `EventSource`, and admission-only checks that keep
delivering events to revoked or expired sessions.

## Breaking changes and migration

This RFC is **fully additive** and introduces **no breaking changes**:

- Existing `@netscript/contracts`, `@netscript/service`, `@netscript/plugin-streams-core`, and
  `@netscript/fresh` exports remain unchanged in behavior and signature.
- `createNetScriptChatStreamProxy` (`@netscript/fresh/ai`) preserves all legacy defaults (`POST`,
  non-SSE `GET`, response headers, and legacy request-header forwarding) unchanged whenever
  `authorize` / `recheck` are omitted.

### Migration from a hand-written application SSE proxy

1. Declare the route with `defineStreamEndpoint(...)` in `@netscript/contracts/streams`.
2. Move session lookup + resource authorization into `authorize`, and session liveness / revocation
   checks into `recheck` (optionally wiring a shared `revocationSource`).
3. Replace the manual `fetch` + `ReadableStream` route with `bindStreamProxy(endpoint, ...)` mounted
   via `defineService(router, { streamProxies: [...] })` (or `createNetScriptStreamProxy` in a
   Fresh 2.x route handler).
4. Update browser `EventSource` consumers to construct base URLs via `buildStreamEndpointUrl`, pass
   `proxyUrl` and `offset` to `createNetScriptStreamEventSourceV1`, and dispose-and-rebuild from
   `binding.snapshot().lastCommittedOffset` on `transport-error`.

### Migration from `createNetScriptChatStreamProxy` for authorized GET SSE reads

- Existing apps using `{ POST: chatProxy, GET: chatProxy }` continue running unchanged.
- To enable revocable authorization and stop forwarding client `Cookie` headers upstream, either
  supply opt-in `authorize` + `recheck` (and optional `revocationSource`) on
  `createNetScriptChatStreamProxy`, or split `POST` (`toNetScriptChatResponse({ authorize, ... })`)
  and `GET` (`createNetScriptStreamProxy` / `bindStreamProxy`).

## Prior art

- **WHATWG HTML Standard — Server-Sent Events (`EventSource`)**: defines `text/event-stream` block
  framing, permanent connection closure on non-`200` responses (`401`/`403`), native reconnect URL
  reuse, and cookie-based same-origin / `withCredentials` behavior without custom request headers.
- **WHATWG Streams Standard (`ReadableStream`)**: defines `highWaterMark: 0` pull-driven demand and
  drain semantics on `ReadableStreamDefaultController.close()`.
- **W3C Fetch Metadata Request Headers (`Sec-Fetch-Site`, `Sec-Fetch-Dest`)**: browser-enforced,
  non-spoofable headers enabling defense-in-depth cross-site protection for cookie-authenticated
  `GET` endpoints.
- **RFC 9110 §7.6.1**: defines static and `Connection`-nominated hop-by-hop headers that must be
  stripped across proxy hops.
- **Durable Streams State Protocol & `STREAM_SSE_CONTRACT_V1`**
  ([sse-contract-v1.ts](../packages/plugin-streams-core/src/domain/sse-contract-v1.ts)): defines
  the `['data', 'control']` wire events and control-committed opaque `streamNextOffset` replay
  contract.
- **NetScript `plugins/streams/services/src/proxy-headers.ts`**
  ([proxy-headers.ts](../plugins/streams/services/src/proxy-headers.ts)): establishes header
  sanitization and cancel-safe `restreamUpstreamBody` to avoid uncaught `AbortError`s on disconnect.
- **NetScript `packages/service/src/rate-limit/middleware/client-address.ts`**
  ([client-address.ts](../packages/service/src/rate-limit/middleware/client-address.ts)): establishes
  explicit `ServiceProxyTrust` and `ServiceEnvironment.remoteAddr` discipline (missing socket
  metadata never permits forwarded-header trust).
- **NetScript `packages/fresh/src/runtime/ai/stream-proxy.ts`**
  ([stream-proxy.ts](../packages/fresh/src/runtime/ai/stream-proxy.ts)): establishes the
  `accept-encoding: identity` fence (`#219`/`#239`) and Fresh `{ req: Request }` handler shape.
- **NetScript RFC 0001** ([0001-sdk-client-contributions.md](0001-sdk-client-contributions.md)):
  establishes upstream-oRPC-free public contracts, strict header/secret redaction, and
  explicit opt-in composition across existing archetypes.

## Unresolved questions

1. **Missing-stream `404` on `live=sse` (fresh-stream race)**: `DurableStreamTestServer` currently
   returns `404` for `live=sse` on a not-yet-created stream (measured at `87965d80`), and
   `plugins/streams/services/src/proxy.ts:120-123` bridges `404` only for `live=long-poll`. Should
   `createNetScriptStreamProxy` simply propagate `404` (after admission succeeds), or should an
   optional `waitForStreamCreateMs` / upstream `live=sse` bridge in `plugins/streams/services` be
   added in a follow-up?
2. **Optional `id:` injection / `Last-Event-ID` fallback**: `DurableStreamTestServer` does not emit
   SSE `id:` lines (measured at `87965d80`). Should v1 strictly keep upstream framing untouched and
   require dispose-and-rebuild `?offset=` resume (this draft's recommendation), or should an opt-in
   mode inject `id: <streamNextOffset>` on `event: control` and accept `Last-Event-ID` on native
   `EventSource` auto-reconnect?
3. **Mid-stream revocation wire hint**: This draft closes revoked/expired readers cleanly with zero
   extra frames so `STREAM_SSE_WIRE_EVENT_NAMES_V1` stays strictly `['data', 'control']` and
   reconnect hits `401`/`403`. Should a future contract revision (`v2` or opt-in event) define an
   explicit non-cursor-advancing terminal notice frame before closing?
4. **Default `recheckEveryMs` value**: This draft proposes `30_000` ms as a balanced default for
   idle readers without push revocation (giving a pull-only idle upper bound of
   `30_000 ms + policyTimeoutMs`). Should the default be shorter (e.g. `15_000` ms) or required
   explicitly when `revocationSource` is omitted?
5. **Non-SSE (`live=long-poll` / snapshot) authorizing proxy mode**: `createNetScriptStreamDB` uses
   `live=false` snapshot + `live=long-poll` reads
   ([stream-db-recovery-adapter.ts:120-125](../packages/fresh/src/runtime/streams/stream-db-recovery-adapter.ts#L120-L125)).
   Should v1 remain strictly SSE (`live=sse`), leaving an authorizing `StreamDB` long-poll proxy
   to a follow-up, or should the same endpoint contract support a `mode: 'sse' | 'state-protocol'`
   flag?

## Future possibilities

- **OpenAPI `text/event-stream` spec projection & service-info listing** generated automatically from
  mounted `streamProxies` in `@netscript/service`.
- **`PluginServiceConfig.streamProxies`** forwarding in `@netscript/plugin/service` once a
  first-party plugin exposes an end-user authorizing stream proxy.
- **Authorizing long-poll / snapshot proxy mode** for browser `createNetScriptStreamDB` consumers
  sharing the same `defineStreamEndpoint` and application policy contract.
- **First-party `@netscript/plugin-auth-core` revocation-source adapter** bridging
  `AUTH_STREAM_EVENT_TYPES` (`auth.session.revoked`,
  [plugin-auth-core/src/streams/mod.ts:26](../packages/plugin-auth-core/src/streams/mod.ts#L26))
  or Deno KV session watches into `StreamProxyRevocationSource`.
- **Per-stream fan-out / upstream connection coalescing** (multiplexing N authorized readers of the
  same stream onto one upstream Durable Streams connection while preserving independent per-reader
  fenced pre-delivery authorization gating, backpressure, and cancellation).
- **Alignment with producer-scoped connection configuration**
  ([#2654](https://github.com/rickylabs/netscript/issues/2654)) so services managing multiple
  Durable Streams endpoints share one connection-descriptor vocabulary across producers and proxies.
- **CLI scaffold & SDK client generation** reading `defineStreamEndpoint` exports to generate typed
  browser `EventSource` and bearer SSE client helpers.
