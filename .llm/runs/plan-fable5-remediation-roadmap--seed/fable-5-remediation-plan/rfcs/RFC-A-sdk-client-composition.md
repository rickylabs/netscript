# RFC-A: `SdkClientContribution` — one typed chain for client construction, credentials, transport, policy metadata, and query invalidation — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T1-00 (RFC document; tracking issue = T1-01) · **Proposed milestone:** `0.0.6`
(ratification only; implementation lands in the post-shift `0.0.7` "Typed seams + generation") ·
**Status:** Draft · **Authors:** seed run `plan-fable5-remediation-roadmap--seed` ·
**Created:** 2026-08-08 · **Tracking issue:** T1-01 (unfiled) ·
**Shape:** #1123 numbered-section form (`research/github-conventions.md` §5.4 — the file-based
`rfcs/NNNN-*.md` process is documented but has **zero** merged instances; this document is written so
it can be pasted into an `rfc:`-form tracking issue body verbatim).

---

## Abstract

`@netscript/sdk` owns a transport it does not let anyone extend. `CreateServiceClientOptions` is a
closed nine-field record with no `headers`, `fetch`, `interceptors`, `plugins`, `link`, or context
type parameter (`packages/sdk/src/ports/service-client.ts:203-222`, verified at baseline
`fac9e339042c`); `ServiceClientContext` is a closed interface, not a type parameter
(`:129-155`); `createHttpClientLink` is package-private (`packages/sdk/src/client/mod.ts:15-36`);
and `safe()` drops oRPC's `TError` channel so the SDK's own published error-narrowing example does
not compile (`packages/sdk/src/client/errors.ts:75-92`; `docs/site/services-sdk/sdk.md:199`).

The consequence is concrete and shipped: `@netscript/service/auth` accepts
`Authorization: Bearer …` and `x-api-key`
(`packages/service/src/auth/static-credential-authenticator.ts:108-117`) and
`createServiceClient` **cannot send either header**. Two first-party seams that were designed to
meet, do not.

This RFC proposes a **versioned `SdkClientContribution` contract**: one typed, composable descriptor
that extends client construction, per-call request context, headers/credentials, transport
middleware (oRPC interceptors and link plugins), procedure policy metadata (`$meta`),
response/error types, and query defaults/invalidation — in a **single typed chain** whose result
type is derived, not asserted. The central design constraint, taken from
`research/external/orpc.md` §6, is that **oRPC 1.14.6 already ships every mechanism this needs**:
the pinned version's public export surface is byte-identical to `1.14.15`, and the six interceptor
arrays, three plugin arrays, `Value<…>` header callback, free `ClientContext` type parameter,
`$meta`, and typed error map are all present in the cached `.d.ts`. **This RFC is therefore mostly
an un-hiding exercise, not an invention.** Where it invents, it invents exactly three things: the
contribution envelope, the composition algebra that turns a tuple of contributions into one client
type, and the failure taxonomy (absence / version mismatch / conflict) that makes misuse a
compile-time or construction-time error rather than a runtime surprise.

---

## 1. Motivation

### 1.1 The measured gap

| Capability | Server accepts | Typed client can send | Citation |
|---|---|---|---|
| `Authorization: Bearer …` | yes | **no** | `service/src/auth/static-credential-authenticator.ts:108-117` vs `sdk/src/client/http-client-link.ts:82-101` |
| `x-api-key` | yes | **no** | same |
| Session cookie | yes (`AuthnRequest.cookie`) | **no** (`credentials` never set) | `research/repo-audit/auth.md` §2, §4.2 |
| Trusted identity headers | yes | **no emitter exists anywhere** | `service/src/auth/trusted-header-authenticator.ts:32-54`; `auth.md` §4.4 |
| Per-call credential override | n/a | **no** | `sdk/src/ports/service-client.ts:129-155` |

The only header the client can author is trace context, and it is hard-coded inside the link
(`http-client-link.ts:82-101`). The only per-call seam that works is the retry/dedupe knob set that
happens to be typed into `ServiceClientContext` (`http-client-link.ts:27`, regression-tested at
`packages/sdk/tests/integration/service-client-runtime_test.ts:113,153`).

### 1.2 The escape hatch is a fork

Because `createHttpClientLink` and `ClientLinkPort` are unexported
(`sdk/src/client/mod.ts:15-36`; `sdk/src/ports/client-link-factory.ts:18-25` — note
`sdk/src/ports/mod.ts:7` advertises "the transport seam" in its own module doc while exporting no
such thing), a consumer who needs one header must hand-rebuild the link: URL assembly,
`inferRPCMethodFromContractRouter`, `ClientRetryPlugin` + `DedupeRequestsPlugin` with the
GET/`force-cache` grouping, and the entire CLIENT-span block. ~90 lines of copied framework
internals per app, and **silently losing NetScript's distributed tracing** because nothing else
injects that span (`research/repo-audit/services-sdk.md` §2.3).

### 1.3 Plugins have no client axis at all

`PluginContributions` (`packages/plugin/src/config/domain/plugin-contributions.ts:12-39`) enumerates
twelve groups — `cli`, `services`, `backgroundProcessors`, `streamTopics`, `databaseSchemas`,
`runtimeConfigTopics`, `contractVersions`, `e2e`, `telemetry`, `migrations`, `aspire`, `doctor`.
**None is client-side.** Its one CLI slot is a closed literal union naming a first-party plugin
(`readonly doctorChecks?: readonly 'auth-backend'[]`, `:16`) — the same closed-world pattern #1093
reports on the discovery side.

### 1.4 Why now

Three forcing functions converge:

1. **#928 (`[frontend-contrib S6] @netscript/plugin-frontend-core contracts/v1`, `0.0.7`)** is about
   to define a *second* contribution envelope. If RFC-A does not ratify a shared envelope shape
   first, the plugin manifest grows two incompatible contribution dialects.
2. **#934 (generated deny-by-default procedure gateway)** needs to know which procedures are public.
   `grep -rnE '\$meta<|\.meta\(' packages plugins` returns **zero** oRPC metadata hits
   (`research/external/orpc.md` §G11; re-verified at baseline). Whoever implements #934 first will
   invent a policy-metadata shape; it should be this one.
3. **oRPC v2 is in public beta** (`2.0.0-beta.25` on the `beta` dist-tag) and its `main` already
   carries `feat(rpc): restrict RPC handlers to POST, PUT, PATCH and DELETE by default`
   (`research/external/orpc.md` §0, §6). NetScript's GET-based dedupe path
   (`http-client-link.ts:82,109`) is directly in that blast radius. Consolidating transport policy
   behind one owned function is cheap now and expensive after a public extension seam exists.

---

## 2. Guide-level explanation

### 2.1 Nothing changes for an app that needs nothing

```ts
// unchanged today, unchanged after this RFC — this is a hard back-compat requirement
const users = createServiceClient({ contract: UsersContractV1, serviceName: 'users' });
await users.list({ limit: 20 });
```

`with` is optional; when it is omitted the per-call context is exactly today's
`ServiceClientContext` and every existing call site compiles byte-identically. **The framework must
be usable without plugins and without contributions.** A contribution is opt-in weight.

### 2.2 One contribution

```ts
import { createServiceClient } from '@netscript/sdk/client';
import { authContribution } from '@netscript/plugin-auth/sdk';

const users = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
  with: [authContribution({ scheme: 'bearer' })],
});

// The contribution declares `{ auth: { token: string } }` as required per-call context,
// so oRPC's ClientRest makes it mandatory at the call site:
await users.list({ limit: 20 }, { context: { auth: { token } } });
//                                ^ omit this and it is a COMPILE error, not a 401 at runtime
```

The compile error is not NetScript's invention — `ClientRest` already makes a non-empty
`ClientContext` required at the call site (`@orpc/client` `client.i2uoJbEp.d.ts:16`,
`research/external/orpc.md` §1.5). RFC-A's job is to *stop erasing that*, by making
`ServiceClientContext` a type parameter with a NetScript base rather than a closed interface.

### 2.3 Two contributions compose, and the types intersect

```ts
const users = createServiceClient({
  contract: UsersContractV1,
  serviceName: 'users',
  with: [authContribution({ scheme: 'bearer' }), traceContextContribution()],
});
// per-call context = BaseServiceClientContext & { auth: {...} } & { trace?: {...} }
```

Contributions are ordered. Header contributors run in declaration order; the composed link's
`plugins` / `interceptors` / `clientInterceptors` / `adapterInterceptors` arrays are the
concatenation of the framework defaults followed by each contribution's, with oRPC's own `order`
field respected inside each array (`StandardLinkPlugin.order`,
`@orpc/client` `client.2jUAqzYU.d.ts:5-8`).

### 2.4 What a contribution author writes

```ts
export const traceContextContribution = defineSdkClientContribution({
  name: '@netscript/telemetry:trace-context',
  environment: 'both',
  headerKeys: ['traceparent', 'tracestate'],
  context: type<{ trace?: { traceparent?: string; tracestate?: string } | null }>(),
  headers: ({ context }) => resolveTraceHeaders(context?.trace),
});
```

`defineSdkClientContribution` is the only public constructor. It stamps `contractVersion`, validates
`name` uniqueness at construction, and returns a value whose type carries the declared context so
the composition algebra can read it.

### 2.5 Server vs client

A contribution declares `environment: 'server' | 'client' | 'both'`. This is enforced, not
documented-only: constructing a `server`-only contribution in a browser bundle throws
`SdkContributionEnvironmentError`. The precedent already exists in prose — `@netscript/sdk/cache`
and `@netscript/sdk/discovery` are documented server-only (`docs/site/services-sdk/sdk.md`
"Production notes") — and today nothing enforces it. Secret-reading code lives in a `.server.ts`
module; the isomorphic descriptor lives beside it and carries no secret.

### 2.6 Query defaults and invalidation ride the same chain

```ts
const { clients, queryUtils } = defineServices({
  users: { contract: UsersContractV1, with: [authContribution({ scheme: 'bearer' })] },
});
```

A contribution may contribute TanStack defaults and invalidation rules expressed **in the one key
algebra** (`queryUtils.<path>.key(...)`, upstream `generateOperationKey`). It may not invent a key
namespace. Today the repo has two disjoint key algebras returned from the same `defineServices()`
call (`research/external/orpc.md` §G10) — RFC-A does not fix that, it *constrains* contributions so
they cannot make it worse, and names the unification as a dependency (§8, Q3).

---

## 3. Reference-level explanation

All symbols below are proposed additions to `@netscript/sdk` unless marked otherwise. Nothing in
this section requires an oRPC version newer than the pinned `1.14.6`.

### 3.1 The contribution envelope

```ts
/** Envelope version. Bumped only on a breaking change to this interface. */
export const SDK_CLIENT_CONTRIBUTION_VERSION = 1 as const;

export interface SdkClientContribution<
  TContext extends ClientContext = Record<never, never>,
  TName extends string = string,
> {
  /** Literal version. A value other than the accepted union is a compile error. */
  readonly contractVersion: typeof SDK_CLIENT_CONTRIBUTION_VERSION;
  /** Globally unique, namespaced: '<package>:<slug>'. Conflict key. */
  readonly name: TName;
  /** Where this contribution may be constructed. Default 'both'. */
  readonly environment?: 'server' | 'client' | 'both';
  /** Other contribution names this one requires to be present. */
  readonly requires?: readonly string[];

  /** Type-only carrier for the per-call context this contribution adds. */
  readonly context?: TypeMarker<TContext>;

  /** Header keys this contribution authors. Declared so conflicts are detectable
      at construction rather than on the wire. */
  readonly headerKeys?: readonly string[];
  /** oRPC's own header seam, unchanged in shape. */
  readonly headers?: Value<
    Promisable<StandardHeaders | Headers>,
    [ClientOptions<TContext>, readonly string[], unknown]
  >;

  /** Appended to the composed link, after framework defaults. */
  readonly linkPlugins?: readonly StandardLinkPlugin<TContext>[];
  readonly interceptors?: readonly Interceptor<
    StandardLinkInterceptorOptions<TContext>, Promise<unknown>
  >[];
  readonly clientInterceptors?: readonly Interceptor<
    StandardLinkClientInterceptorOptions<TContext>, Promise<StandardLazyResponse>
  >[];
  readonly adapterInterceptors?: readonly Interceptor<
    LinkFetchInterceptorOptions<TContext>, Promise<Response>
  >[];
  /** At most ONE contribution across the chain may supply this. */
  readonly fetch?: LinkFetchClientOptions<TContext>['fetch'];

  /** Transport-level defined errors this contribution can raise (merged into
      the client's error union — see §3.7). */
  readonly errors?: ErrorMap;

  /** TanStack defaults + invalidation, expressed in the upstream key algebra (§3.8). */
  readonly query?: SdkClientQueryContribution;
}
```

Every field except `contractVersion`, `name`, and the composition metadata is a **direct pass-through
of an oRPC 1.14.6 option**. That is deliberate: the envelope's value is composition and failure
detection, not abstraction. Contribution authors read oRPC's docs, not a NetScript translation
layer.

### 3.2 Composition algebra

```ts
type ContributedContext<TWith extends readonly AnySdkClientContribution[]> =
  UnionToIntersection<
    TWith[number] extends SdkClientContribution<infer C, string> ? C : never
  >;

export interface CreateServiceClientOptions<
  TContract extends ContractLike,
  TWith extends readonly AnySdkClientContribution[] = [],
> {
  contract: TContract;
  serviceName: string;
  routerName?: string;
  protocol?: 'http' | 'https';
  apiPath?: string;
  apiVersion?: string;
  propagateTraceContext?: boolean;
  /** Ordered contribution chain. Omit for today's behaviour exactly. */
  with?: TWith;
  /** Escape hatch below the chain: a fully constructed link. Mutually exclusive with `with`. */
  link?: ClientLinkPort<BaseServiceClientContext & ContributedContext<TWith>>;
}

export function createServiceClient<
  TContract extends ContractLike,
  const TWith extends readonly AnySdkClientContribution[] = [],
>(
  options: CreateServiceClientOptions<TContract, TWith>,
): ServiceClient<TContract, BaseServiceClientContext & ContributedContext<TWith>>;
```

`ServiceClientContext` is retained as a **deprecated alias** of `BaseServiceClientContext` so that
no existing import breaks. `ServiceClientMethod` gains the context and error parameters
(§3.7). `defineServices`'s `DefineServiceConfig` gains the same `with` field and forwards it
(`packages/sdk/src/presets/define-services.ts:22-44,106-116`).

`port` and `timeout` are removed from the options record. They are documented "Reserved …",
forwarded by `defineServices` (`:113-114`), and silently discarded by `createServiceClient`
(`packages/sdk/src/client/service-client.ts:41-49`) — a public surface that lies. `timeout` is
re-expressed as a contribution (an `AbortSignal.timeout` clientInterceptor); `port` is a discovery
concern and belongs to `@netscript/sdk/discovery`.

### 3.3 Request context

`BaseServiceClientContext` is today's `ServiceClientContext` verbatim (signal / cache / retry knobs /
`traceHeaders`), except that `traceHeaders` becomes owned by the trace-context contribution (§9,
T1-06) and is retained on the base as a deprecated field for one minor.

Contributions may only **add** context fields. A contribution whose declared context collides with
`BaseServiceClientContext` or with an earlier contribution's field is a construction-time conflict
(§3.10). Contribution-declared context is required at the call site exactly when oRPC's `ClientRest`
says so — RFC-A adds no separate requiredness mechanism.

### 3.4 Headers and credentials

Header composition is a fold: framework base headers (`Content-Type`) → each contribution's
`headers` value in chain order → the result is one `StandardHeaders` object. Later contributions
overwrite earlier keys **only** if the key is in their declared `headerKeys` and no earlier
contribution declared it; otherwise construction fails (§3.10).

Two constraints that are not negotiable:

- **No credential may be read at module scope.** A contribution's `headers` callback is invoked
  per call with `ClientOptions<TContext>`; credentials arrive through context or through a
  server-only resolver the contribution closes over. This is what makes token rotation and
  per-request identity possible at all.
- **`credentials: 'include'` is not added by this RFC.** Cookie transport requires a topology
  decision (same-origin BFF/proxy vs bearer) that `research/repo-audit/auth.md` §4.2 proves is
  currently impossible: discovery resolves a cross-origin service URL and the session cookie is
  `__Host-` prefixed (origin-locked). RFC-A ships the *mechanism*; the auth pack owns the topology.

### 3.5 Transport middleware

The composed link is built once, in `createHttpClientLink`, which becomes **public** from
`@netscript/sdk/client` along with `ClientLinkPort` / `ClientLinkCallOptions` from
`@netscript/sdk/ports` (closing the gap where `sdk/src/ports/mod.ts:7` advertises a transport seam
the module does not export).

Array composition order, per oRPC array:

1. NetScript framework defaults (retry, dedupe, telemetry span).
2. Contributions, in `with` order.
3. Within each stage, oRPC's own `order` field on plugins is honoured by
   `CompositeStandardLinkPlugin`.

The framework's own defaults become contributions internally (`@netscript/sdk:retry`,
`@netscript/sdk:dedupe`, `@netscript/sdk:client-span`) so that the composition path is the *only*
path — dogfooding removes the "framework has a private fast lane" failure mode that produced the
current sealed link.

Server side, `RPCHandlerConfig.plugins` (`packages/service/src/primitives/handlers.ts:41-58`) is
already declared and already appended by `createRPCPlugins`, but the builder calls
`createRPCHandler(router, { serviceName, debug })` and populates nothing
(`packages/service/src/builder/service-rpc.ts:57`). `withRPC()` and `DefineServiceOptions` gain
`plugins` / `warnOnlyCodes`, and `ServiceHandlerPlugin` (`packages/service/src/types.ts:216-225` —
`init?(options: unknown, router: unknown)`) is typed to upstream's
`init?(options: StandardHandlerOptions<T>, router: Router<any, T>)`. Reachability without typing is
worthless: NetScript's own logger plugin currently redeclares shim option types because the seam
hands over `unknown` (`packages/logger/orpc-plugin.ts:11-42`).

The dead `deduplication` option on `RPCHandlerConfig` (`handlers.ts:51`, never read by
`createRPCPlugins`) is either wired or removed; it may not stay declared-and-ignored.

### 3.6 Procedure metadata (policy via oRPC `$meta`)

```ts
export interface NetScriptProcedureMeta {
  readonly policy?: {
    /** Explicitly reachable without a principal. */
    readonly public?: boolean;
    /** Scopes required by the server-side authorizer. */
    readonly scopes?: readonly string[];
    /** Advisory client cache policy, consumed by the query contribution. */
    readonly cache?: 'no-store' | 'default' | 'force-cache';
    readonly rateLimit?: { readonly bucket: string; readonly cost?: number };
  };
}
```

`baseContract` becomes `oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)`
(`packages/contracts/src/application/contract-primitives.ts:81`), so `.meta({ policy: … })` is
available on every NetScript contract procedure and is typed into `MiddlewareOptions.procedure`
upstream (`@orpc/server` `server.qKsRrdxW.d.ts:48,96`).

Client-side, a contribution reads metadata through an interceptor
(`procedure['~orpc'].meta`) — e.g. the auth contribution does not attach a credential to a
`policy.public` procedure, and reports a defined `CREDENTIAL_UNAVAILABLE` instead of sending an
unauthenticated request to a non-public one.

RFC-A ratifies **the metadata type and the client-side reader only**. The server-side authorizer
that consumes `policy.scopes` (replacing path-prefix authz,
`packages/service/src/auth/scope-authorizer.ts:22-29`) is the auth pack's; the generated
deny-by-default gateway that consumes `policy.public` is **#934**'s. This RFC exists partly so those
two do not each invent a shape.

### 3.7 Response and error types

`ServiceClientShape` / `ServiceClientMethod` reconstruct oRPC's client tree structurally and return
`Promise<TOutput>`, discarding `ClientPromiseResult<TOutput, ErrorFromErrorMap<TErrorMap>>`
(`packages/sdk/src/ports/service-client.ts:160-196`; `research/external/orpc.md` §G4). Two changes:

1. `ServiceClientMethod<TInput, TOutput, TError, TContext>` carries the error channel, and
   `safe`/`isDefinedError` regain their second generic to match upstream
   (`safe<TOutput, TError = ThrowableError>`). This is a *repair*, tracked separately as T1-03
   because it is provable today by an executed `deno check` and does not need the rest of RFC-A.
2. Contribution-declared `errors` merge into the client's error union as **transport-level defined
   errors**, disjoint from the contract's. Collision between a contribution error code and a
   contract error code is a construction-time conflict (§3.10).

Prerequisite, also tracked in T1-03: `baseContract` is annotated
`ReturnType<typeof oc.errors>`, which instantiates the generic at its *constraint* and erases the six
declared codes to the open `ErrorMap` index signature. Until that annotation is replaced with the
real inferred type (or an explicit `isolatedDeclarations`-safe spelling that preserves the literal
keys), even a correct `safe()` cannot narrow to NetScript's error vocabulary.

### 3.8 Query factories and invalidation

```ts
export interface SdkClientQueryContribution {
  /** Per-procedure TanStack defaults, keyed by contract path. */
  readonly defaults?: readonly {
    readonly path: readonly string[];
    readonly options: ProcedureQueryDefaults;
  }[];
  /** Mutation → keys to invalidate, expressed via the router utils key builder. */
  readonly invalidate?: (utils: AnyServiceQueryUtils) => readonly QueryKey[];
}
```

Hard constraint: **contributions express keys only through `queryUtils.<path>.key(...)`** — upstream
`generateOperationKey` (`@orpc/tanstack-query` `dist/index.d.ts:39,109`). A contribution may not
mint a key literal. This is the smallest rule that prevents RFC-A from multiplying the existing
two-algebra problem, in which `defineServices()` returns both a hand-rolled
`[resource, action, {input}]` factory and the upstream utils, and neither can invalidate the other
(`packages/sdk/src/query/query-factory.ts:147,165`; `research/external/orpc.md` §G10).

Unifying the two algebras is **not** in RFC-A's scope — it is generation-pack work (T2) with its own
consumer blast radius. RFC-A's dependency on it is recorded in §8 Q3.

### 3.9 Server / client environment boundaries

Three enforced rules:

1. `environment` is checked at construction. `server`-only in a browser bundle →
   `SdkContributionEnvironmentError`.
2. Contribution packages ship `./sdk` (isomorphic descriptor) and, where needed, `./sdk/server`
   (secret-reading factory). Only the former may be imported from an island.
3. The existing export-drift gate (`check-exports-drift`) is extended to fail when an island-reachable
   module imports a `./sdk/server` subpath. Without a gate this is a naming convention, and naming
   conventions are what produced `getStreamsAuth()` being reachable from a browser import graph
   today.

### 3.10 Failure taxonomy — absence, version mismatch, conflict

| Failure | Detected | Mechanism |
|---|---|---|
| Required per-call context not supplied | **compile** | oRPC `ClientRest` makes non-empty `ClientContext` mandatory at the call site |
| Contribution declares `requires: ['x']`, `x` absent from the chain | **construction** | `SdkContributionMissingDependencyError`, message names both |
| Contribution built against envelope v2 passed to a v1 host | **compile** | `contractVersion` is a literal type; `2` is not assignable to `1` |
| Same, arriving through an `unknown` boundary (plugin manifest / JSON) | **construction** | runtime guard on `contractVersion`, error names the contribution and both versions |
| Two contributions with the same `name` | **construction** | `SdkContributionConflictError` |
| Two contributions declaring the same `headerKeys` entry | **construction** | same, listing key + both names |
| Two contributions supplying `fetch` | **construction** | same |
| Contribution context field collides with base or an earlier contribution | **compile** | intersection produces `never` on the colliding field; a `ConflictCheck<…>` helper turns that into a named diagnostic |
| Contribution error code collides with the contract's | **construction** | same conflict error |
| `with` and `link` both supplied | **compile** | mutually exclusive overloads |

The design rule behind the table: **absence, mismatch, and conflict must never degrade to a 401, a
missing header, or a silently dropped plugin.** Every one of those is a failure mode the current
code already exhibits (`port`/`timeout` silently discarded; `RPCHandlerConfig.plugins` never
populated; `deduplication` never read).

### 3.11 Versioning and oRPC v2 forward-compatibility

- `SDK_CLIENT_CONTRIBUTION_VERSION` is independent of the SDK's package version and of oRPC's. A
  major bump requires an RFC amendment and a one-minor overlap where the host accepts `1 | 2`.
- **Transport policy is consolidated behind one NetScript-owned function** before any of this ships
  (T1-04). Today `method: inferRPCMethodFromContractRouter(contract)` and
  `filter: ({ request }) => request.method === 'GET'` sit inline in the link
  (`packages/sdk/src/client/http-client-link.ts:82,109`). oRPC v2's `main` already restricts RPC
  handlers to POST/PUT/PATCH/DELETE by default and adds `MethodOverrideHandlerPlugin`
  (`research/external/orpc.md` §0, §6). If contributions are shipped before consolidation, the v2
  migration touches every consumer's call path instead of one function.
- Contributions never observe the HTTP method. They observe procedure path, input, context, and
  metadata. This is the single most important forward-compat rule in the RFC.
- The `experimental_`-prefixed upstream surfaces (`streamedOptions`, `liveOptions`,
  `RethrowHandlerPlugin`, `ProcedureUtilsDefaults`) may be used *inside* the framework but may not
  appear in the contribution envelope's public types.

---

## 4. Drawbacks

1. **It is a public-surface expansion on a package that is 0.0.4 and pre-stable.** Every field in
   §3.1 is a future compatibility obligation. Mitigation: the envelope is versioned and nearly all
   fields are pass-throughs, so oRPC absorbs most of the churn.
2. **Composition order is a real semantic that users must learn.** Header folds and interceptor
   arrays are order-sensitive; a mis-ordered chain can produce a working-but-wrong client (e.g. a
   telemetry interceptor that never sees the auth header). Mitigation: declared `headerKeys` +
   conflict detection makes the common mistake loud; ordering is documented once with the two
   first-party contributions as the worked example.
3. **`ServiceClientContext` becoming a type parameter is a variance surface.** Generic client types
   are where `--isolatedDeclarations` breaks; `packages/contracts` already spells
   `BaseContractRoute` explicitly for exactly this reason
   (`packages/contracts/src/application/contract-primitives.ts:125-159`). Mitigation: the JSR
   `publish:dry-run` gate must be in the acceptance set of every implementing issue, not just the
   final one.
4. **It legitimizes per-app transport divergence.** Once `fetch` and `link` are public, apps can
   lose the client span, the retry policy, or the dedupe grouping. Mitigation: the framework
   defaults are themselves contributions and are always prepended; removing them requires an
   explicit opt-out that is greppable.
5. **Two more places for a secret to leak into a bundle.** Mitigation: §3.9's enforced boundary and
   the export-drift gate.
6. **Cost of doing it properly is not small.** Six issues, one of which (T1-02) touches
   `packages/sdk`, `packages/service`, and `packages/plugin`.

---

## 5. Rationale and alternatives

### 5.1 Why not just add `headers?: () => Headers` and stop

This is the cheapest option and it is genuinely tempting — it closes the single most-cited gap
(auth) in about twenty lines. It is rejected because it does not close the *class*. A bare `headers`
option cannot: carry typed per-call context (so a token cannot be per-request without a global),
add a retry-on-401 interceptor, contribute a client plugin, declare policy metadata, or be declared
by a plugin manifest. NetScript would then add a second option for each of those in turn, which is
how the current nine-field record was born. Recorded as the primary rejected alternative.

### 5.2 Why not expose oRPC directly and delete the wrapper

Also tempting: `createServiceClient` could simply return `RPCLink` options for the consumer to
finish. Rejected because the wrapper carries four things a consumer must not re-implement — lazy
Aspire URL resolution (`service-client.ts:41-66`), contract-derived method inference, the
GET/`force-cache` dedupe grouping, and the CLIENT span with `rpc.system=orpc` attributes. Deleting
the wrapper deletes NetScript's distributed tracing by default. The correct move is to keep the
wrapper and make its internals *composable*, which is what §3.5's "framework defaults are
contributions" achieves.

### 5.3 Why not model contributions as oRPC plugins only

`StandardLinkPlugin` is already an extension point (`init(options)` mutating the options object).
Why add an envelope? Because a link plugin cannot: declare the *type* it adds to per-call context,
declare header keys for conflict detection, be discovered from a plugin manifest, carry query
defaults, or be version-checked. The envelope is the metadata layer around the plugin, not a
replacement for it — and `linkPlugins` is one of its fields precisely so the upstream mechanism
stays first-class.

### 5.4 Why not a builder (`.withAuth().withTracing()`) instead of an array

A fluent builder gives better ordering ergonomics and worse composition: a plugin manifest cannot
contribute a builder call, and the accumulated type is harder to spell for
`--isolatedDeclarations`. An ordered array of values is data — which is the same reason
`AGENTS.md` prefers "routing is data, not prose". Rejected, but the builder could be added later as
sugar over the array without an envelope change.

### 5.5 Why the auth dogfood, and why a second consumer is mandatory

A contribution seam validated by one consumer encodes that consumer's shape. Auth is the sharpest
gap and therefore the honest first dogfood (T1-05). A second, structurally different consumer
(T1-06) is what proves generality: it must need headers but **no secret**, must exercise per-call
context override, and must be removable so the negative test has teeth. See §9 for the choice and
the rejected alternative.

---

## 6. Prior art

### 6.1 oRPC 1.14.6 — mechanisms this RFC un-hides rather than invents

Verified against the cached pinned `.d.ts` (`research/external/orpc.md` §1, §6 — the `@orpc/server`
public export list is byte-identical between 1.14.6 and 1.14.15, so the pin is not the constraint):

| Mechanism | Upstream shape | RFC-A use |
|---|---|---|
| `RPCLink.headers` | `Value<Promisable<StandardHeaders \| Headers>, [ClientOptions<T>, path, input]>` | §3.4 header fold, verbatim shape |
| `ClientContext` free type param | `RPCLink<T extends ClientContext>`; `ClientRest` makes non-empty context required at the call site | §3.2/§3.3 — the compile-time absence check |
| `plugins` / `interceptors` / `clientInterceptors` / `adapterInterceptors` | 3 plugin arrays + 6 interceptor slots, each with its own options shape | §3.5, appended in chain order |
| `StandardLinkPlugin.order` | `{ order?: number; init?(options) }` | §3.5 intra-stage ordering |
| `DynamicLink` | resolves a different link per call from `(options, path, input)` | future possibility; not in v1 of the envelope |
| `os.$meta<T>()` / `oc.$meta<T>()` | metadata typed into `MiddlewareOptions.procedure['~orpc'].meta` | §3.6 policy metadata |
| `.errors()` → `ErrorFromErrorMap` → `ClientPromiseResult<TOutput, TError>` → `safe()` discriminating `isDefined` | full typed-error chain | §3.7 — currently erased by NetScript, repaired in T1-03 |
| `createTanstackQueryUtils` + `generateOperationKey` | one key algebra with `queryOptions/mutationOptions/infiniteOptions/key` | §3.8 — the only key algebra a contribution may use |
| `setHiddenRouterContract` / `InferRouterInitialContexts` | host-side contract/context recovery and verification | referenced for the server half; not required by the client envelope |

**Negative result worth stating plainly:** nothing in this RFC needs an oRPC upgrade. The 1.14.6 →
1.14.15 bump is still worth doing (it collapses a duplicated `@orpc/shared` 1.14.6/1.14.7 that is a
known `instanceof ORPCError` hazard, `research/external/orpc.md` §6) but it is hygiene, not a
blocker.

### 6.2 tRPC v11 links

tRPC's `links: []` chain is the closest analogue and the reason "chain" is the right mental model:
links execute in order on the way out and in reverse on the way back
(<https://trpc.io/docs/client/links>), and `splitLink` routes per operation. Two differences drove
RFC-A's design away from a literal port:

- A tRPC link is `() => ({ next, op }) => observable(...)`, requiring the observable runtime. oRPC's
  `ClientLink.call(path, input, options) => Promise<unknown>` is a plain async function, so a
  NetScript contribution can be a plain object with plain callbacks.
- tRPC has **no typed per-call context**; `httpLink({ headers: ctx => … })` reads an untyped `op`.
  oRPC's `ClientContext` type parameter is strictly stronger, and it is what makes §3.10's
  compile-time absence check possible at all. RFC-A should not weaken it to match tRPC ergonomics.

Borrowed anyway: the ordering mental model, and `splitLink`'s lesson that per-operation routing
belongs in the transport layer (oRPC's `DynamicLink`), not in the app.

### 6.3 In-repo prior art

- `packages/telemetry/src/orpc/tracing-plugin.ts`, `packages/logger/orpc-plugin.ts` — real
  `StandardHandlerPlugin` implementations that already push root/client interceptors. They also
  demonstrate the untyped-seam cost (§3.5).
- `packages/sdk/src/desktop/application/desktop-rpc-client.ts:18-20` — a second transport
  (MessagePort `RPCLink` with `customJsonSerializers`), proving the link is swappable in principle
  and only in principle: it is another closed constructor, not a consumer seam.
- `getStreamsAuth()` (`packages/plugin-streams-core/src/application/stream-url-resolver.ts:136-150`,
  consumed at `packages/fresh/src/runtime/streams/create-stream-db.ts:111` and
  `packages/fresh/src/runtime/ai/stream-proxy.ts:162`) — the repo's only working credential header
  seam, implemented entirely outside the typed client via raw `fetch`. It is the existence proof
  that a header seam fits this architecture, and the standing embarrassment that it had to be built
  beside the SDK rather than in it.

---

## 7. Alignment with existing board contracts

### 7.1 #1093 — plugin discovery hardcodes official plugins' factory functions

**Overlap:** RFC-A adds a client contribution group to `PluginContributions`, which must be
discoverable from third-party plugins. #1093 owns the *discovery mechanism* defect (hardcoded
official-factory callees). RFC-A owns the *contribution shape*.

**Alignment obligation:** the new group must not repeat the closed-literal pattern of
`doctorChecks?: readonly 'auth-backend'[]` (`plugin-contributions.ts:16`) — a third-party plugin must
be able to name its contribution without editing framework source. RFC-A does **not** fix
discovery; T1-05 declares its auth contribution through whatever discovery path exists when it
lands, and states the dependency.

### 7.2 #922 / #928 / #934 — frontend contribution layer

- **#928 (`plugin-frontend-core` contracts/v1)** defines a contribution envelope for UI. Both
  envelopes should share: the literal `contractVersion` field, namespaced `name` as the conflict
  key, and the absence/mismatch/conflict taxonomy of §3.10. RFC-A does **not** claim ownership of
  #928's contract; it asks that #928 be reviewed against §3.1/§3.10 so the manifest carries one
  dialect. SYNTHESIS §5 records the open fork on whether #922's Wave-0 proofs (#923–#927) precede
  RFC-A implementation; the default proposal is that RFC-A ratifies in 0.0.6 and #922 implements at
  its shifted position.
- **#934 (generated deny-by-default procedure gateway)** is the natural first server-side consumer
  of `NetScriptProcedureMeta.policy.public` (§3.6). If #934 lands first it will define a policy
  shape; the RFC-A tracking issue must be resolved before #934 reaches implementation, or #934's
  shape becomes the de-facto standard by accident.
- **#922** itself is the umbrella: RFC-A files nothing under it and duplicates none of #923–#946.

### 7.3 #884 — organization-aware identity and authorization policy contracts

**Overlap is real but shallow.** #884 owns tenancy in the *domain* model: `AuthSession` and
`Principal` have no organization field and `auth.prisma` has no membership model
(`research/repo-audit/auth.md` §6). RFC-A must not pre-empt that.

**Alignment obligation:** RFC-A's contribution context is extensible, so a tenant selector can ride
as a contribution-declared context field (`{ tenant: { id: string } }`) **without** #884 landing
first, and can later be re-typed against #884's contracts without an envelope change. RFC-A
explicitly does not add a `tenantId` to `Principal`, to `ServiceClientContext`, or to any first-party
contract. `NetScriptProcedureMeta.policy.scopes` is deliberately scope-shaped, not org-shaped, so
#884 can extend it rather than replace it.

### 7.4 #451 — in-process link-mode adapter

`#451` (OPEN, `Backlog / Triage`) proposes an in-process link for single-process service mounting.
It *requires* the public link seam this RFC creates. RFC-A does not implement #451; T1-02's public
`ClientLinkPort` + `link` option is what unblocks it, and T1-02 must say so rather than re-file it.

---

## 8. Unresolved questions

- **Q1 — Cookie topology.** Does NetScript adopt a same-origin BFF/proxy for browser sessions, or
  bearer-only? `research/repo-audit/auth.md` §4.2 proves cookies cannot work across the current
  cross-origin discovery + `__Host-` prefix combination. RFC-A ships the mechanism and defers the
  decision, but T1-05's acceptance cannot be written honestly until this is answered.
  *Default if unanswered:* bearer-only for v1; cookie support is a later contribution.
- **Q2 — Where does the contribution group live in `PluginContributions`?** One `sdkClients` group,
  or split `linkPlugins` / `handlerPlugins` / `procedureMeta`? A single group keeps the manifest
  small and matches the envelope; splitting matches the existing one-group-per-concern style of
  `plugin-contributions.ts`. *Default:* one group, since the envelope already partitions internally.
- **Q3 — Query key algebra unification.** §3.8 constrains contributions to the upstream algebra, but
  `createQueryFactory` still mints its own keys and is what the scaffold uses. Does RFC-A block on
  the unification (T2 pack), or ship with contributions constrained and the factory left alone?
  *Default:* do not block; constrain contributions, and record the dependency on the T2 generator
  work.
- **Q4 — Does the envelope also cover server-side handler plugins?** §3.5 makes
  `RPCHandlerConfig.plugins` reachable and typed, but stops short of a *server* contribution
  envelope. Symmetry argues for one; scope argues against. *Default:* client envelope in v1; the
  server side gets reachability + typing only, and a symmetric envelope is a future possibility.
- **Q5 — Deprecation window for `port` / `timeout` / `ServiceClientContext`.** Immediate removal is
  cleanest on a 0.0.x package; one-minor aliasing is kinder to the scaffold and to eis-chat-class
  consumers. *Default:* alias for one minor, with a `deno doc --lint`-visible `@deprecated`.
- **Q6 — envelope-vs-#928 ratification order.** See §7.2. Owner decision.

---

## 9. Board plan — DRAFT (nothing filed; no GitHub mutation)

House filing shape per `research/github-conventions.md` §5.4 (the #1123 pattern: an `rfc:`-form
tracking issue carrying the numbered sections, plus implementation issues referencing it with
`Part of #<tracking>`). **GitHub wins on conflict** once filed.

| Draft-ID | Proposed title (abbrev.) | Milestone | Priority | Depends on |
|---|---|---|---|---|
| T1-01 | `rfc:` RFC-A tracking issue | `0.0.6` | p1 | — |
| T1-02 | oRPC seam re-exposure (headers/interceptors/plugins/fetch/link, context generic, handler `plugins`) | `0.0.7`¹ | p1 | T1-01 |
| T1-03 | typed-error repair (`safe`/`isDefinedError` + `baseContract` widening) | `0.0.7`¹ | p1 | T1-01 |
| T1-04 | transport-policy consolidation ahead of oRPC v2 | `0.0.7`¹ | p1 | T1-01 |
| T1-05 | auth contribution — first dogfood | `0.0.7`¹ | p1 | T1-01, T1-02, T1-04 |
| T1-06 | second non-auth contribution — generality proof | `0.0.7`¹ | p1 | T1-01, T1-02, T1-05 |

¹ The post-rename-shift `0.0.7` = "Typed seams + generation" per SYNTHESIS §5.3. Current `0.0.7`
(frontend contribution layer, #922) shifts to `0.0.9`.

**Sequencing note.** T1-03 and T1-04 are independent of the envelope and can land first; T1-03 in
particular is provable today by an executed `deno check` and fixes a published-docs break. T1-02 is
the wide one. T1-05 and T1-06 are the two consumers that make ratification meaningful — the RFC
tracking issue should not close on T1-02 alone.

**Second-consumer choice (T1-06): trace-context propagation, not AI/streams headers.**

Both candidates were considered.

- *AI / streams headers* (`getStreamsAuth()` → `{ Authorization: 'Bearer ' + STREAMS_SECRET }`,
  consumed by `packages/fresh/src/runtime/ai/stream-proxy.ts:162` and
  `create-stream-db.ts:111`). Attractive because it is a real, shipped, out-of-band header seam. But
  it is still a **credential** contribution — a process-global shared secret. It re-tests the same
  axis auth already tests, and it is entangled with the streams transport (SSE/proxy) and with
  #1329's envelope work, so a failure there would not distinguish "the seam is wrong" from "streams
  is wrong". Rejected as the *second* consumer; a good third.
- **Trace-context propagation (chosen).** Today it is hard-coded inside the link
  (`packages/sdk/src/client/http-client-link.ts:82-101`) behind a `propagateTraceContext` boolean,
  with a per-call override field (`ServiceClientContext.traceHeaders`) and existing regression
  coverage. Re-expressing it as a contribution:
  1. exercises every axis auth does **except** secrets — headers, per-call context override,
     server/client boundary (OTEL context is server-side) — so it proves the seam is not
     credential-shaped;
  2. is a **migration, not an addition**, which means the negative test has teeth: remove the
     contribution and `traceparent` must disappear from the wire and the CLIENT span must not be
     emitted. A purely additive second consumer can pass while the seam is decorative;
  3. removes a hard-code, so the framework's own default path goes through the public composition
     path (§3.5's dogfooding rule) rather than beside it.

**Explicitly not in this pack** (owned elsewhere; see each draft's `## Boundaries`): scaffold `/api`
protection default and the `plugin add auth` starter surface (auth pack); the query-key algebra
unification, `createQueryFactory` abort-signal drop, nested-router support, and the scaffolded
`bridgeInvalidation` key mismatch (T2 generation pack); `PluginContractRouter = object` erasure and
the Hono-vs-oRPC middleware seam (T3 service-architecture pack); tenancy typing (#884); plugin
discovery (#1093); frontend contribution contracts (#928).
