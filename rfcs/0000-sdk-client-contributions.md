---
rfc: 0000
title: Typed SDK client contributions
status: Draft
authors: ['@rickylabs']
created: 2026-08-08
tracking-issue: https://github.com/rickylabs/netscript/issues/1348
target-milestone: 0.0.7
---

# Typed SDK client contributions

## Summary

This RFC adds one deliberately narrow extension axis to `@netscript/sdk`: a versioned, named, typed
contribution may prepare request headers from immutable per-call context before the SDK's HTTP link
dispatches a service call. A literal contribution tuple determines the client context type, reserves
header and context ownership, and fails loudly on duplicates. The SDK keeps ownership of discovery,
serialization, retry, deduplication, tracing, fetch, and transport. Query helpers receive the same
context only when each contribution proves that its response cache is invariant or supplies a
synchronous, non-secret partition; otherwise the contributed client is direct-call-only.

The design composes oRPC's existing async `RPCLink.headers` and client-context mechanisms. It does
not expose upstream oRPC types or create a second middleware framework. Bearer credentials in
`@netscript/plugin-auth-core` are the first dogfood consumer. A locale contribution, which owns
`accept-language`, is the required non-auth proof. Trace propagation remains transport-owned because
the final `traceparent` must describe the SDK's client span, not an earlier header callback.

## Motivation

### Current baseline

The starting proposal described a single `SdkClientContribution` envelope containing request
context, headers, oRPC interceptors and plugins, `fetch`, links, errors, metadata, and query policy.
Current `main` does not justify that width:

| Current fact                                                                                                                                                                                                                        | Consequence                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`CreateServiceClientOptions`](../packages/sdk/src/ports/service-client.ts) is a closed nine-field record. `port` and `timeout` are accepted but not consumed.                                                                      | Apps cannot add a bearer or locale header. Silent reserved options must not become precedent for more no-op fields.                                                |
| [`createHttpClientLink`](../packages/sdk/src/client/http-client-link.ts) already owns `Content-Type`, retry, GET deduplication, a traced `fetch`, cache/signal forwarding, and trace injection.                                     | Those mechanisms are transport policy, not independently composable request contributions.                                                                         |
| [`ServiceClientContext`](../packages/sdk/src/ports/service-client.ts) is fixed, while [`ServiceClientMethod`](../packages/sdk/src/ports/service-client.ts) does not carry a context generic.                                        | A credential source cannot add required per-call context without a framework type change.                                                                          |
| [`defineServices`](../packages/sdk/src/presets/define-services.ts), [`QueryFactory`](../packages/sdk/src/ports/query-factory.ts), and [`ServiceQueryUtils`](../packages/sdk/src/ports/service-query-utils.ts) erase client context. | Merely fixing direct calls would leave generated/query paths unsound or unusable.                                                                                  |
| [`ClientLinkPort`](../packages/sdk/src/ports/client-link-factory.ts) is already a package-owned structural link, but it is internal.                                                                                                | A future transport escape hatch should unhide this seam, not put raw oRPC links or `fetch` callbacks in a contribution.                                            |
| [`RPCHandlerConfig.plugins`](../packages/service/src/primitives/handlers.ts) already accepts server handler plugins.                                                                                                                | Server plugin reachability is a service-preset problem, not a client-contribution field.                                                                           |
| [`PluginContributions`](../packages/plugin/src/config/domain/plugin-contributions.ts) has no SDK-client group and its doctor check is a closed auth literal.                                                                        | Plugin discovery needs a generic module-reference axis; core must not hardcode each contributor.                                                                   |
| [`baseContract`](../packages/contracts/src/application/contract-primitives.ts) does not initialize typed metadata and is annotated as `ReturnType<typeof oc.errors>`.                                                               | Procedure metadata and the existing error-map erasure need repair, but client preparation errors must not masquerade as server contract errors.                    |
| The lock resolves the oRPC family to 1.14.6, while the repository's stable-channel tool reported 1.15.0 on 2026-08-08.                                                                                                              | The implementation must re-run the stable check and move the family coherently; this RFC must depend on public behavior rather than copied private upstream types. |

The repository already contains the needed mechanism. In oRPC 1.14.6, `RPCLink` accepts an async
header resolver whose arguments include client options, procedure path, and input. oRPC's client
context also makes a non-empty context required at call sites, and TanStack Query utilities already
thread that context. The official [RPCLink documentation](https://orpc.dev/docs/client/rpc-link)
shows the same header/context path. NetScript currently hides those capabilities behind a fixed
context and a hardcoded callback.

### User problem

An application should be able to say, once, that a service client carries a bearer credential and a
locale, then receive all of these properties end to end:

- direct calls require the inferred context;
- `defineServices()` preserves the same context in generated clients and safe query helpers;
- credential and locale resolution happen for every call, so rotation and request isolation work;
- two contributors cannot silently overwrite each other's headers or context;
- a failed contribution prevents network dispatch and produces a stable, redacted diagnostic;
- installing a third-party plugin does not require another switch statement in core; and
- omitting contributions is exactly today's behavior.

Without a ratified seam, each plugin must patch the SDK link, create a parallel client, capture a
process-global token, or ask core for another hardcoded option. All four outcomes weaken generated
ergonomics and type safety.

### Goals

This RFC MUST:

1. provide a package-owned, versioned descriptor for request-header preparation;
2. infer per-call context from a literal tuple and diagnose static conflicts;
3. repeat all validation at runtime for JavaScript, widened arrays, and plugin boundaries;
4. define deterministic composition without allowing semantic plugin-order dependencies;
5. preserve auth, locale, and arbitrary input/context secrecy in errors and telemetry;
6. keep response caches partitioned when a contributed header can change representation;
7. make contributions statically discoverable but explicitly selected; and
8. retain SDK ownership of the HTTP transport and its observability invariants.

### Non-goals

This RFC does not:

- expose `fetch`, oRPC interceptors, adapter interceptors, link plugins, server plugins,
  serializers, or query-default callbacks through the contribution descriptor;
- define credential refresh/replay after a `401`;
- make client metadata enforce server authorization;
- expose a custom transport option (issue [#451](https://github.com/rickylabs/netscript/issues/451)
  owns that independent decision);
- redesign the two existing query-key algebras beyond adding a safe partition suffix;
- fix the `baseContract` error-map erasure tracked by
  [#1350](https://github.com/rickylabs/netscript/issues/1350); or
- automatically attach every installed contribution to every service.

## Terminology

- **Contribution**: a named, versioned descriptor that owns context keys and possible request header
  names and prepares a header patch for one call.
- **Contribution tuple**: the literal `readonly` tuple explicitly attached to a service client.
- **Preparation snapshot**: the immutable context, procedure descriptor, input, and transport
  descriptor passed independently to every contribution.
- **Header ownership**: the exclusive right to emit one lower-case request header name.
- **Response-cache effect**: the contributor's declaration that its header is response-invariant,
  partitionable, or unsafe for generated query helpers.
- **Partition**: a synchronous, non-secret discriminator added to a full query key. It is not a
  credential and is intentionally visible in cache tools.
- **Transport policy**: discovery, URL/method selection, codec, retry, dedupe, tracing, `fetch`,
  streaming, and dispatch. The SDK owns it for `createServiceClient()`.

## Guide-level explanation

### A non-auth contribution

Contribution authors use a curried helper. The generic names the context added by the contribution;
the literal fields remain available to the composition algebra.

```ts
import { defineSdkClientContribution } from '@netscript/sdk/client';

export const localeContribution = defineSdkClientContribution<{ locale?: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'app:locale',
  context: { locale: 'optional' },
  headerKeys: ['accept-language'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.locale ?? 'default',
  },
  prepare: ({ context }) => ({
    headers: context.locale ? { 'accept-language': context.locale } : {},
  }),
});
```

The `context` declaration and `headerKeys` are runtime evidence, not duplicated documentation. The
helper checks that every TypeScript context key is declared with the correct required/optional mode.
Emitted headers must be a subset of `headerKeys`. The locale is a cache partition because it can
change the representation returned for identical procedure input.

### Auth as the first dogfood consumer

`@netscript/plugin-auth-core/sdk` supplies a universal bearer factory. The thin `plugins/auth`
package only declares and delivers that module.

```ts
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';

const bearer = createBearerSdkClientContribution<{
  auth: {
    getAccessToken(): Promise<string | undefined>;
    cachePartition: string;
  };
}>({
  context: { auth: 'required' },
  resolveCredential: ({ context }) => context.auth.getAccessToken(),
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.auth.cachePartition,
  },
});
```

`cachePartition` is a random session/principal epoch or another non-secret identifier. It MUST NOT
be the access token, refresh token, session id, email address, or a reversible encoding of one. If
an auth integration cannot provide a safe synchronous partition, its factory returns a `direct-only`
contribution and generated query helpers are not exposed for that service.

Procedure metadata tells the auth contribution whether a credential is appropriate:

```ts
import { baseContract } from '@netscript/contracts';
import { z } from 'zod';

export const accountContract = {
  status: baseContract
    .meta({ access: { authentication: 'none' } })
    .output(z.object({ ok: z.boolean() })),
  profile: baseContract
    .meta({ access: { authentication: 'required' } })
    .output(z.object({ displayName: z.string() })),
};
```

For `none`, the bearer contribution emits no credential. For `optional`, it emits one when
available. For `required`, absence is a preparation failure and no request is sent. Unmarked
procedures default to `none` in the first-party bearer factory so installing auth cannot start
leaking credentials to every existing procedure. An application may choose a different explicit
`unmarked` policy when constructing the factory.

Metadata guides a client contribution; it does not prove that the server enforces the same policy.
Server authentication/authorization remains mandatory.

### Direct client usage

```ts
import { createServiceClient } from '@netscript/sdk/client';

const accounts = createServiceClient({
  contract: accountContract,
  serviceName: 'accounts',
  contributions: [bearer, localeContribution] as const,
});

const profile = await accounts.profile({}, {
  context: {
    auth: {
      getAccessToken: () => session.accessToken(),
      cachePartition: session.cacheEpoch,
    },
    locale: 'de-CH',
  },
});
```

The second argument is required because the composed context contains required `auth`. Removing the
auth contribution removes that requirement. Renaming `auth` or passing a tuple with another owner of
`authorization`, `auth`, or the same contribution id is a type error for literal tuples and a
construction error at unknown boundaries.

### `defineServices`, query factories, and TanStack Query

```ts
import { defineServices } from '@netscript/sdk';

const services = defineServices({
  accounts: {
    contract: accountContract,
    contributions: [bearer, localeContribution] as const,
  },
});

const context = {
  auth: {
    getAccessToken: () => session.accessToken(),
    cachePartition: session.cacheEpoch,
  },
  locale: 'de-CH',
};

await services.clients.accounts.profile({}, { context });
await services.queries.accounts.profile({}, { context });

const query = services.queryUtils.accounts.profile.queryOptions({
  input: {},
  context,
});
```

Both full query keys receive this canonical suffix, sorted by contribution id:

```ts
[
  '$netscript.sdk-context',
  ['@netscript/plugin-auth:bearer', session.cacheEpoch],
  ['app:locale', 'de-CH'],
];
```

The context object and credential are never put in the key. Existing prefix invalidation continues
to work because the suffix is added only to full keys. With no contributions, or only
response-invariant contributions, key shapes are unchanged.

A `direct-only` contribution remains valid with `services.clients.accounts`, but `accounts` is
omitted from the mapped `queries` and `queryUtils` results. The omission is both compile-time and
runtime; it is not a property containing `undefined`.

### Async and server-side sources

`prepare` and `resolveCredential` may be async and are invoked once for every transport attempt that
represents a new logical call. They are never invoked at module import or client construction. An
application may close over a concurrency-safe rotating credential source:

```ts
const bearer = createBearerSdkClientContribution({
  context: {},
  resolveCredential: () => credentialStore.current(),
  responseCache: { mode: 'direct-only' },
});
```

Environment-reading convenience factories, if shipped, live under explicit `.../sdk/server` or
`.../sdk/browser` exports. Universal modules do not read `Deno.env`, `window`, local storage, or
cookies. The framework does not guess the runtime from globals.

## Reference-level explanation

### Architecture and ownership

This RFC spans four existing archetypes and no new package:

| Package/surface                                    | Archetype               | Responsibility                                                                              |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `@netscript/contracts`                             | Public DSL/builder      | Own the cross-runtime procedure metadata vocabulary.                                        |
| `@netscript/sdk/ports` and `@netscript/sdk/client` | Public DSL/builder      | Own upstream-free descriptor types, type algebra, preparation errors, and the HTTP adapter. |
| `@netscript/sdk`                                   | Public preset           | Preserve tuples through `defineServices()` and expose one-call ergonomics.                  |
| `@netscript/plugin/config`                         | Plugin protocol/config  | Carry static module references without importing SDK runtime types.                         |
| `@netscript/plugin-auth-core/sdk`                  | Plugin core/integration | Own the convention-bearing bearer contribution and security policy.                         |
| `plugins/auth`                                     | Thin plugin delivery    | Declare the module reference and generated/scaffold wiring only.                            |
| CLI generators                                     | Tooling                 | Generate explicit imports and literal tuples; validate plugin references.                   |

This follows the doctrine's extension-axis law: a cross-package extension is named, registered,
deterministic, and duplicate-rejecting. It also follows the public-surface law: NetScript owns the
types and does not re-export `RPCLinkOptions`, `ClientOptions`, `StandardHeaders`, upstream plugin
types, or interceptor types.

### Procedure metadata

`@netscript/contracts` adds the following root exports and initializes `baseContract` with them:

```ts
export type NetScriptAuthenticationRequirement =
  | 'none'
  | 'optional'
  | 'required';

export interface NetScriptProcedureMeta {
  readonly access?: {
    readonly authentication?: NetScriptAuthenticationRequirement;
  };
}

const contractWithMeta = oc.$meta<NetScriptProcedureMeta>({});
export const baseContract = contractWithMeta.errors(commonErrorMap);
```

The implementation MUST use an explicit publishable annotation that preserves both the concrete
common error map and `NetScriptProcedureMeta`; it MUST NOT retain the erasing
`ReturnType<typeof oc.errors>` annotation. The exact error-map repair belongs to #1350, but the
metadata and error work must land coherently so one does not re-erase the other.

`ContractProcedureMetadata` in `@netscript/sdk/ports` gains a package-owned `meta` member and the
SDK normalizes missing metadata to `{}`. This mirrors the public `procedure['~orpc'].meta` field
documented by [oRPC metadata](https://orpc.dev/docs/metadata) without exporting an upstream type.

### Public contribution contract

The normative shape is:

```ts
export type SdkClientContributionId = `${string}:${string}`;

export interface SdkClientContributionProtocol {
  readonly family: 'netscript.sdk-client';
  readonly major: 1;
}

export interface SdkClientProcedureDescriptor {
  readonly path: readonly string[];
  readonly meta: Readonly<NetScriptProcedureMeta>;
}

export interface SdkClientTransportDescriptor {
  readonly kind: 'http';
  readonly origin: URL;
  readonly rpcPath: string;
  readonly secure: boolean;
}

export interface SdkClientPrepareOptions<TContext extends object> {
  readonly context: Readonly<ServiceClientContext & TContext>;
  readonly procedure: SdkClientProcedureDescriptor;
  readonly transport: SdkClientTransportDescriptor;
  readonly input: unknown;
}

export interface SdkClientRequestPatch {
  readonly headers?: Readonly<Record<string, string>>;
}

export type SdkClientContextDeclaration<TContext extends object> = {
  readonly [K in Extract<keyof TContext, string>]-?: Record<never, never> extends Pick<TContext, K>
    ? 'optional'
    : 'required';
};

export interface SdkClientCachePartitionOptions<TContext extends object> {
  readonly context: Readonly<ServiceClientContext & TContext>;
  readonly procedure: SdkClientProcedureDescriptor;
}

export type SdkClientResponseCache<TContext extends object> =
  | { readonly mode: 'invariant' }
  | {
    readonly mode: 'partitioned';
    readonly partition: (
      options: SdkClientCachePartitionOptions<TContext>,
    ) => string;
  }
  | { readonly mode: 'direct-only' };

export interface SdkClientContribution<
  TId extends SdkClientContributionId = SdkClientContributionId,
  TContext extends object = Record<never, never>,
  TContextDeclaration extends SdkClientContextDeclaration<TContext> = SdkClientContextDeclaration<
    TContext
  >,
  THeaderKeys extends readonly string[] = readonly string[],
> {
  readonly protocol: SdkClientContributionProtocol;
  readonly id: TId;
  readonly context: TContextDeclaration;
  readonly headerKeys: THeaderKeys;
  readonly responseCache: SdkClientResponseCache<TContext>;
  readonly prepare: (
    options: SdkClientPrepareOptions<TContext>,
  ) => SdkClientRequestPatch | PromiseLike<SdkClientRequestPatch>;
}
```

`defineSdkClientContribution<TContext>()(descriptor)` preserves `id`, the context declaration,
header keys, and cache mode as literals. Its parameter applies these static checks:

- `context` contains every and only string key of `TContext`, and each value agrees with whether
  that TypeScript property is required or optional;
- header names are lower-case string literals;
- ids contain 3–128 ASCII characters, match `^[a-z0-9@][a-z0-9@._/-]*:[a-z0-9][a-z0-9._-]*$`, and do
  not use the reserved `@netscript/internal:` owner; and
- one descriptor declares at most eight context keys and sixteen header keys.

The descriptor contains no generic `TypeMarker`, mutable builder, dependency list, priority,
environment flag, upstream callback, or arbitrary metadata bag. Major version 1 is intentionally
closed.

The first-party auth factory has this constrained surface:

```ts
export interface CreateBearerSdkClientContributionOptions<
  TContext extends object,
> {
  readonly context: SdkClientContextDeclaration<TContext>;
  readonly resolveCredential: (
    options: SdkClientPrepareOptions<TContext>,
  ) => string | undefined | PromiseLike<string | undefined>;
  readonly responseCache: SdkClientResponseCache<TContext>;
  readonly unmarked?: NetScriptAuthenticationRequirement;
  readonly allowInsecureTransport?: boolean;
}

export function createBearerSdkClientContribution<TContext extends object = Record<never, never>>(
  options: CreateBearerSdkClientContributionOptions<TContext>,
): SdkClientContribution<
  '@netscript/plugin-auth:bearer',
  TContext,
  SdkClientContextDeclaration<TContext>,
  readonly ['authorization']
>;
```

`unmarked` defaults to `none`; `allowInsecureTransport` defaults to `false`. The resolver is not
called for `none`, is optional for `optional`, and must return a value for `required`. The factory
adds the `Bearer` scheme, so callers return only the token and cannot inconsistently author the
header. The descriptor id, header ownership, protocol, and preparation implementation are fixed by
auth core rather than caller-configurable.

### Tuple type algebra

The SDK exports `SdkClientContributionContext<TContributions>` for tooling and uses it internally.
It recursively intersects contributor contexts while tracking seen ids, context keys, and header
keys. A conflict produces a named structural diagnostic such as:

```ts
{
  readonly __netscriptContributionConflict: 'header:authorization';
}
```

The `contributions` option is intersected with `ValidateSdkClientContributions<T>`, so that marker
appears at the tuple boundary rather than turning one context property into an unexplained `never`.
The type recursion stops at sixteen contributions per service. A seventeenth literal is a named
`limit:more-than-16` diagnostic. Widened arrays retain correct context unions but receive full
conflict validation only at runtime.

The client surface becomes context-generic with compatibility defaults:

```ts
export type ServiceRequestRest<TContext extends object> = RequiredKeys<TContext> extends never
  ? [options?: { readonly context?: TContext }]
  : [options: { readonly context: TContext }];

export type ServiceClientMethod<TInput, TOutput, TContext extends object> = (
  input: TInput,
  ...request: ServiceRequestRest<TContext>
) => Promise<TOutput>;

export type ServiceClient<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> = ServiceClientShape<TContract, TContext> & ServiceClientContract<TContract>;

export interface CreateServiceClientOptions<
  TContract extends ContractLike,
  TContributions extends readonly AnySdkClientContribution[] = readonly [],
> {
  // Existing fields remain.
  readonly contract: TContract;
  readonly serviceName: string;
  readonly contributions?:
    & TContributions
    & ValidateSdkClientContributions<TContributions>;
}
```

`createServiceClient()` returns
`ServiceClient<TContract, ServiceClientContext & SdkClientContributionContext<TContributions>>`. All
existing single-generic references continue to mean the current `ServiceClientContext`.

### Query and generated type propagation

`DefineServiceConfig` gains the contribution tuple generic. Its mapped results infer one composite
context per service rather than widening the entire services map.

The same context generic is threaded through:

- `FactoryConfig`, `QueryFactory`, `ActionMethod`, and the internal `invokeClientProcedure`;
- `ServiceQueryUtils`, every procedure query/infinite/mutation option, and `.call`;
- `createQueryFactory`, `createServiceQueryUtils`, and `createQueryFactories`; and
- `DefinedServiceClients`, `DefinedServiceQueries`, and `DefinedServiceQueryUtils`.

Cache policy options and request context remain separate types. Context MUST NOT be accepted as an
untyped field on `QueryParams` and MUST NOT be stored in default service options. Per-call query
execution options compose `QueryParams` with the same conditional context requirement used by the
client.

Every contribution has one mandatory response-cache mode:

- `invariant`: the header cannot affect response selection or representation. No key suffix is added
  for this contribution.
- `partitioned`: the synchronous resolver returns a stable, non-secret ASCII value of 1–64
  characters. The pair `[contributionId, value]` is added to full server and TanStack keys.
- `direct-only`: the SDK cannot safely cache calls using this contribution. `defineServices()` omits
  that service key from both `queries` and `queryUtils`.

Partition resolvers are synchronous because TanStack option/key factories are synchronous. They
receive context and the package-owned procedure descriptor, but no transport because service
discovery may be asynchronous and no input because input already participates in full keys. They
MUST NOT perform I/O, read a credential, throw secret-bearing messages, or return an unstable value.
All partition pairs are sorted by contribution id, making key identity independent of tuple order.
Duplicate ids are already invalid.

The cache suffix is appended only to full keys. Resource/procedure prefixes and existing
invalidation helpers remain unchanged. A conformance test MUST prove that two auth partitions with
identical input cannot observe each other's server or TanStack cached data.

This narrow cache-effect declaration is not a query contribution. It cannot set stale times, retry,
invalidation callbacks, query functions, or arbitrary key fragments.

### Composition and ordering law

Construction performs these steps in tuple order:

1. validate the protocol family and major, id grammar, tuple/key limits, and plain-object shape;
2. canonicalize declared header names to lower case and reject non-canonical input;
3. reserve framework and Fetch-owned headers;
4. reject duplicate ids, context keys, and header keys; and
5. validate query compatibility and generated surface selection.

At call time:

1. resolve the service origin and procedure node;
2. create one read-only preparation snapshot;
3. invoke contributors sequentially in tuple order with that same snapshot;
4. after each await, validate that the patch is a plain record, every header was declared, values
   are valid strings without CR/LF, and the call has not been aborted;
5. merge the disjoint patches into a new record;
6. pass that record to the single native oRPC header resolver; and
7. let the SDK transport encode, trace, retry/dedupe, fetch, and decode the call.

Contributions never see accumulated headers or another contribution's result. Valid contributions
therefore commute: tuple order cannot change a successful request. Order determines only which
invalid descriptor or failing preparation is reported first. A plugin MUST NOT rely on discovery or
tuple order for semantics, and version 1 has no `before`, `after`, `requires`, `priority`, or
numeric `order` field.

Sequential preparation is chosen over `Promise.all` to make the first failure deterministic and to
avoid leaving multiple secret resolvers running after a known failure. Contributors still must be
independent.

### Header ownership and reserved names

`headerKeys` reserves possible output, not mandatory output. A contributor may omit a declared
header for a particular procedure but may never emit an undeclared one.

The following are unavailable to contributions:

- SDK-owned `content-type`, `traceparent`, and `tracestate`;
- every
  [Fetch forbidden request-header name](https://fetch.spec.whatwg.org/#forbidden-request-header),
  including `cookie`, `content-length`, `host`, `origin`, and transport-hop fields;
- names beginning `proxy-` or `sec-`; and
- `set-cookie`, which is a response field.

The implementation keeps an audited lower-case snapshot of the Fetch list and tests the prefix
rules. `authorization`, `accept-language`, and `idempotency-key` are permitted. Browser CORS
preflight remains an application/deployment concern and must be documented by any plugin emitting a
non-safelisted header.

There is no last-writer-wins mode, no opt-in overwrite, and no deletion syntax. Framework base
headers are not visible to contributors. The transport adds `Content-Type` and the client span's
trace fields after contribution validation.

### Async context, retries, and cancellation

Preparation runs once per logical client call, before oRPC retry machinery. Retries reuse the
prepared result for that call. This avoids fetching a different credential or locale halfway through
one retry sequence. Credential refresh after a `401` requires a future explicit replay policy; an
interceptor hidden in an auth contribution would make side-effect replay unsafe.

If the call signal is already aborted, no contributor runs. If it aborts during an async resolver,
the SDK stops awaiting, does not dispatch, and rejects with the platform abort reason. A resolver
receives the signal through `ServiceClientContext` and SHOULD stop its own work. The SDK cannot
cancel arbitrary promise side effects.

The snapshot is shallowly read-only at the type level and its top-level records are frozen in
development/test builds. The SDK does not deep-clone input or context, because that would destroy
functions, signals, streams, and identity. Contributors MUST treat nested values as borrowed and
must not mutate them.

### Transport ownership and oRPC alignment

Version 1 contributes only the existing oRPC `RPCLink.headers` capability. The adapter supplies one
composed async resolver. This is the thinnest mapping to an upstream public seam and preserves
NetScript's ability to replace oRPC without changing public contribution types.

The SDK remains the sole owner of:

- service discovery, origin and RPC path;
- HTTP method inference and codec/serialization;
- `fetch`, cookies/credentials mode, redirect behavior, and TLS policy;
- retry, deduplication, timeout/cancellation, and streaming recovery;
- client spans and final trace injection; and
- decoding and server-defined error transport.

Accordingly the descriptor has no `fetch`, `link`, `plugins`, `interceptors`, `clientInterceptors`,
`adapterInterceptors`, serializer, retry, or error-map fields. The transport consolidation issue
[#1351](https://github.com/rickylabs/netscript/issues/1351) may refactor those internals and update
oRPC, but it MUST keep one SDK-owned policy path.

Issue #451 may separately expose a custom transport. If accepted, it MUST adapt the existing
package-owned `ClientLinkPort`, declare whether it accepts prepared request headers, and reject a
header contribution when the selected link lacks that capability. It MUST NOT accept a raw oRPC link
type through this descriptor.

Trace propagation is not a contribution. The current transport creates a CLIENT span inside its
`fetch` wrapper and injects that span into the final request. A preceding trace-header contribution
would be overwritten or would describe the wrong parent. `propagateTraceContext` and
`ServiceClientContext.traceHeaders` remain compatibility inputs to transport policy; the transport
reserves `traceparent` and `tracestate`. The W3C
[Trace Context recommendation](https://www.w3.org/TR/trace-context/) also requires careful mutation
and calls out correlation/privacy risk.

### Error and failure model

The SDK exports one package-owned error and its redacted diagnostic shape:

```ts
export type SdkClientContributionErrorCode =
  | 'SDK_CONTRIBUTION_INVALID'
  | 'SDK_CONTRIBUTION_VERSION'
  | 'SDK_CONTRIBUTION_CONFLICT'
  | 'SDK_CONTRIBUTION_LIMIT'
  | 'SDK_CONTRIBUTION_RUNTIME'
  | 'SDK_CONTEXT_MISSING'
  | 'SDK_HEADER_INVALID'
  | 'SDK_CACHE_PARTITION_INVALID'
  | 'SDK_PREPARATION_FAILED';

export interface SdkClientContributionDiagnostic {
  readonly code: SdkClientContributionErrorCode;
  readonly phase: 'construction' | 'partition' | 'preparation';
  readonly contributionId?: SdkClientContributionId;
  readonly procedurePath?: string;
  readonly headerName?: string;
}

export class SdkClientContributionError extends Error {
  readonly code: SdkClientContributionErrorCode;
  readonly phase: 'construction' | 'partition' | 'preparation';
  readonly contributionId?: SdkClientContributionId;
  readonly procedurePath?: string;
  readonly headerName?: string;
  toJSON(): SdkClientContributionDiagnostic;
}
```

Construction and request failures use the same stable class but distinct `phase`. `message` is
framework-authored and contains only safe identifiers. A rejected resolver's original error is not
attached as `cause`, copied into the message, logged, or emitted to telemetry. Contribution authors
that need internal diagnostics must observe and sanitize their own source failure before rejecting.

| Failure                                                   | Earliest phase                            | Required behavior                                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Bad protocol family/major, id, shape, or limit            | compile when literal; construction always | Throw before a client is returned.                                                                                                             |
| Duplicate id/context/header ownership                     | compile when literal; construction always | Name the conflict and both contributor ids; never choose a winner.                                                                             |
| Missing required TypeScript context                       | compile                                   | Make the request options/context required.                                                                                                     |
| Missing context through JS/`unknown`                      | preparation                               | Throw `SDK_CONTEXT_MISSING`; do not dispatch.                                                                                                  |
| Resolver rejects or throws                                | preparation                               | Throw stable `SDK_PREPARATION_FAILED`; discard the source error from the public failure.                                                       |
| Undeclared, forbidden, non-string, or CR/LF header        | preparation                               | Throw `SDK_HEADER_INVALID`; do not dispatch.                                                                                                   |
| Invalid partition syntax                                  | partition                                 | Throw before cache access. First-party tests separately reject known secret sources; arbitrary secrets cannot be detected reliably at runtime. |
| Abort before/during preparation                           | preparation                               | Propagate abort reason; do not dispatch.                                                                                                       |
| Discovery, codec, network, retry, or server-defined error | transport                                 | Preserve the existing SDK/oRPC error path; do not relabel it as a contribution failure.                                                        |

Contribution errors are local construction/transport-preparation errors. They are not
`defined: true`, are not merged into contract error unions, and are not accepted by `.errors(...)`.
#1350 repairs server-defined error inference independently.

### Security, privacy, and redaction

All contribution-produced header values are classified sensitive by default, not only
`authorization`. The SDK and first-party plugins MUST NOT record:

- header values or a serialized `Headers` object;
- input, context, credential resolver results, or cache partition source data;
- source error messages/causes from `prepare`; or
- URLs containing userinfo or query/fragment material.

Allowed diagnostics are the stable code, phase, contribution id, procedure path, declared header
name, service name, and duration. Debug mode does not relax this list. The
[OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude)
specifically excludes access tokens and session identifiers from direct logs.

Partition values are intentionally visible in query keys and developer tools. The API docs and
runtime diagnostics MUST say this. First-party auth accepts only an explicitly supplied non-secret
partition and never derives one from a bearer token.

The bearer factory additionally MUST:

- emit `authorization` only for allowed metadata policy;
- reject a missing credential for `required` before dispatch;
- avoid module-scope credential reads;
- refuse cleartext non-local origins unless the caller makes an explicit unsafe transport choice;
- never attach a credential after a cross-origin redirect; transport owns redirect policy; and
- document CORS/preflight and cookie-auth limitations.

For this check, `secure` means an `https:` origin. The only cleartext development exceptions are
`localhost`, a `.localhost` subdomain, IPv4 loopback (`127.0.0.0/8`), and IPv6 loopback (`::1`),
compared after URL hostname parsing. Other `http:` origins require `allowInsecureTransport: true`;
the resulting risk must be explicit in application configuration and diagnostics without exposing a
credential.

HTTP authentication depends on the confidential transport underneath it; see
[RFC 9110 section 17.16.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-17.16.1). Cookie
authentication is not implemented by setting a `cookie` header. Browser cookie credentials and
`fetch`'s `credentials` mode remain transport/topology decisions.

### Plugin discovery and generated clients

`@netscript/plugin/config` adds an upstream-free reference:

```ts
export interface SdkClientContributionReference {
  readonly protocol: {
    readonly family: 'netscript.sdk-client';
    readonly major: 1;
  };
  readonly id: `${string}:${string}`;
  readonly module: string;
  readonly export: string;
  readonly targets: readonly ('browser' | 'server')[];
}

export interface PluginContributions {
  readonly sdkClients?: readonly SdkClientContributionReference[];
  // Existing groups remain.
}
```

The reference identifies an available named export. It does not contain a serialized function and
does not automatically activate it. The generic discovery work in
[#1093](https://github.com/rickylabs/netscript/issues/1093) must collect these references without
official-plugin switches, reject duplicate ids or mismatched imported descriptors, and expose them
to generators.

Generated code uses static imports and explicit literal tuples:

```ts
import { bearerContribution } from '@netscript/plugin-auth-core/sdk';
import { localeContribution } from './sdk/locale.ts';

export const services = defineServices({
  accounts: {
    contract: accountContract,
    contributions: [bearerContribution, localeContribution] as const,
  },
});
```

No runtime scans installed packages, filesystem manifests, globals, or environment variables.
Installation makes a contribution available; a scaffold/app selection attaches it to a named
service. Generators preserve `as const`, use only public package exports, filter references by
target, and fail generation rather than silently omitting an incompatible target.

The `(family, major)` protocol vocabulary aligns with the frontend contribution negotiation in
[#928](https://github.com/rickylabs/netscript/issues/928), but the payloads are intentionally
different. UI contributions and SDK request contributions are separate named extension axes, not one
universal envelope. Gateway work in [#934](https://github.com/rickylabs/netscript/issues/934) may
consume the same `NetScriptProcedureMeta.access` vocabulary without depending on SDK contributor
types.

### Inference and runtime budgets

Version 1 sets explicit budgets:

- at most 16 contributions per service;
- at most 8 context keys and 16 header keys per contribution;
- ids at most 128 ASCII characters;
- partition strings at most 64 printable ASCII characters; and
- sequential preparation with at most one outstanding contributor promise.

The limit applies per service, so a large `defineServices` map does not create one repository-wide
intersection. The implementation uses tail recursion over literal tuples and named conflict markers.
A scratch Deno type probe on the RFC branch checked two composed contexts, required call arguments,
a duplicate-context diagnostic, an accepted 16-element tuple, and a rejected 17-element tuple in
0.67 seconds with a 225,508 KiB maximum RSS on the authoring host. That timing is evidence, not a
portable CI threshold.

Raising a budget without changing semantics is a backward-compatible implementation decision after
type-performance evidence. Removing a limit or accepting a previously invalid descriptor does not
change protocol major 1. Lowering a limit is breaking.

### Compatibility and migration

This is additive for consumers that do not opt in:

- omitted `contributions` produces the same client context, headers, query keys, and generated
  result keys as today;
- `ServiceClient<TContract>` and existing query types retain default generics;
- `propagateTraceContext` and `traceHeaders` remain transport-owned and supported;
- `defineServices()` creates the same three maps for contribution-free services; and
- the optional plugin manifest group does not invalidate old manifests.

`port` and `timeout` remain accepted temporarily but are documented and annotated deprecated because
current code ignores them. This RFC does not give them new semantics. `port` migrates to
service-discovery configuration or the future explicit transport seam; request timeouts migrate to
an `AbortSignal` once the dedicated transport change is implemented. Removal requires the normal
breaking-change process.

Existing hand-written auth wrappers migrate by moving per-call credential access into an auth-core
contribution and attaching its literal tuple. Existing hardcoded trace propagation does not migrate.
Generated projects change only when the user selects a contributor.

Because this RFC changes public and publish surfaces, implementation packages must bump versions
according to the release plan and pass JSR isolated-declaration gates. No implementation is allowed
to publish an `@orpc/*` type in a generated `.d.ts`/JSR declaration.

### Staged implementation plan and issue decomposition

Implementation remains outside this RFC PR.

| Stage                      | Existing owner                                              | Scope and exit condition                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0. Ratify                  | [#1348](https://github.com/rickylabs/netscript/issues/1348) | Accept this RFC, settle safe FCP questions, and reconcile child issue bodies.                                                                                                        |
| 1. Contract/type repair    | [#1350](https://github.com/rickylabs/netscript/issues/1350) | Preserve the concrete base error map and initialize/export `NetScriptProcedureMeta`; type fixtures prove both.                                                                       |
| 2. Minimal client seam     | [#1349](https://github.com/rickylabs/netscript/issues/1349) | Add descriptor/helper, tuple algebra, context-generic client/query surfaces, native header composition, cache-effect handling, and failures. Do not expose upstream callback arrays. |
| 3. Transport consolidation | [#1351](https://github.com/rickylabs/netscript/issues/1351) | Recheck stable oRPC, update the family coherently, keep one fetch/retry/dedupe/trace path, and deprecate current no-op options.                                                      |
| 4. Auth dogfood            | [#1352](https://github.com/rickylabs/netscript/issues/1352) | Ship the auth-core bearer factory, access metadata behavior, redaction, cache partition/direct-only modes, manifest reference, docs, and scaffold choice.                            |
| 5. Trace ownership proof   | [#1353](https://github.com/rickylabs/netscript/issues/1353) | Re-scope from “trace contribution” to prove the transport retains the only final trace injection and rejects contributor ownership of trace headers.                                 |
| 6. Non-auth proof          | new child after RFC acceptance                              | Ship/test locale contribution, partitioned keys, header conflicts, and generated use. Do not file during this RFC run.                                                               |
| 7. Generic discovery       | [#1093](https://github.com/rickylabs/netscript/issues/1093) | Discover third-party module references without hardcoded factories; generated selection remains explicit.                                                                            |

Issue #451 remains the sole future owner of custom links. #928 and #934 consume aligned protocol and
metadata vocabulary but are not prerequisites for the header seam. The org-aware policy work in
[#884](https://github.com/rickylabs/netscript/issues/884) may later add a tenant context/header
contribution, but server authorization and tenant validation remain separate.

### Conformance and fitness gates

An implementation is not complete until all applicable gates pass.

#### Type gates

- context-free, optional-context, and required-context direct calls;
- two disjoint contributions intersect correctly;
- duplicate id, context key, header key, reserved header, missing context key declaration, and
  17-element tuple have `@ts-expect-error` fixtures;
- `defineServices`, server query factories, TanStack query/infinite/mutation options, and `.call`
  preserve the per-service context;
- `direct-only` service keys are absent from query/query-utils mapped types;
- server-defined error inference remains exact after metadata initialization; and
- public declarations contain no upstream oRPC type.

#### Runtime gates

- async preparation, omission, deterministic first failure, abort, and zero-dispatch-on-failure;
- duplicate validation repeated through `unknown`/JavaScript input;
- undeclared, mixed-case, forbidden, CR/LF, non-string, and duplicate headers rejected;
- base `Content-Type` and final trace fields cannot be overwritten;
- a retry reuses one prepared result;
- locale and two auth partitions cannot share cached data, while prefix invalidation still works;
- direct-only services have no runtime query/query-utils property; and
- every error/log/span snapshot excludes header values, input, context, partitions' source values,
  source messages, tokens, and session ids.

#### Plugin/generated gates

- a synthetic third-party manifest contributes a module/export without a core edit;
- duplicate/mismatched ids and target-incompatible exports fail `plugin doctor`/generation;
- generated code uses public exports, static imports, `as const`, and explicit service selection;
- removing auth from generated config removes the context requirement and wire header; and
- auth and locale scaffold doctests type-check.

#### Repository and publish gates

- scoped check/lint/fmt wrappers for changed TypeScript;
- focused package tests, `deno task arch:check`, and docs/RFC link/lint checks;
- `deno doc --lint` for every affected public module;
- `deno publish --dry-run --allow-dirty` and the repository JSR audit for `contracts`, `sdk`,
  `plugin`, and `plugin-auth-core`;
- clean consumer install/type probe against packed/published surfaces; and
- full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` only at implementation
  merge readiness, not for this docs-only RFC PR.

### Documentation and scaffold implications

Implementation updates must cover:

- SDK root/client/ports API docs and README examples;
- auth-core SDK/server/browser export boundaries and credential/redaction guidance;
- contract metadata and the distinction between client guidance and server enforcement;
- plugin manifest/config builder documentation;
- generated service-client templates and embedded CLI assets;
- query partition visibility, direct-only behavior, and cache invalidation;
- CORS/preflight, cleartext bearer, cookie, redirect, and retry limitations; and
- migration notes for manual header wrappers and deprecated `port`/`timeout` fields.

Scaffolds must ask which services receive an available contribution. Installing auth alone does not
attach credentials globally. No generated source contains a credential, session identifier, or
environment-derived secret.

## Drawbacks

- The descriptor, validation, errors, and cache-effect declaration add public concepts for what is
  ultimately an HTTP header callback.
- Requiring exclusive ownership prevents deliberate multi-value cooperation on one header. That is a
  conscious version-1 constraint; a first-class header-specific combiner would need its own law.
- A required response-cache declaration burdens simple contributors, but omitting it would make
  auth-aware caching unsafe by default.
- `direct-only` can remove expected query helpers. A loud absence is preferable to cross-user cache
  reuse or a property that fails only under load.
- Static plugin selection is less magical than auto-activation, but generated/app config remains
  auditable and type-inferred.
- The fixed tuple limits may be reached by unusually extension-heavy services.

## Rationale and alternatives

### Why this boundary

Headers plus typed per-call context are the smallest seam proven by two different consumers. They
map directly to an existing public oRPC callback, can be represented without upstream types, and do
not grant plugins transport control. The cache-effect field is not another behavior hook; it is the
minimum declaration needed to keep existing query surfaces safe.

### Rejected: the starting “one envelope for everything” proposal

The proposed envelope put headers, three interceptor/plugin stages, `fetch`, link, errors, server
plugins, metadata, and query behavior behind one name. Those fields have different owners,
lifecycles, failure modes, and compatibility risks. Passing them through would make NetScript's
public API an unstable mirror of oRPC and would legitimize per-plugin transport stacks. This RFC
keeps only the capability with two demonstrated consumers.

### Rejected: expose `headers` directly on `CreateServiceClientOptions`

A raw callback solves one app but provides no stable id, context algebra, ownership conflict,
version negotiation, plugin reference, response-cache declaration, or generated composition. It also
invites each new need to add another unrelated option.

### Rejected: oRPC link plugins/interceptors as the public contribution

They can intercept lifecycle stages, but they do not declare added context keys, header ownership,
cache variance, plugin identity, or protocol compatibility. Re-exporting them also violates the
upstream-type-free port rule. NetScript can continue to use them internally.

### Rejected: last writer wins, priorities, and dependency ordering

These make plugin load order semantic and create non-local failures. Version 1 contributions see the
same snapshot and own disjoint keys, so successful composition is order-independent. A future
cooperative header protocol needs a separate RFC, not a priority number.

### Rejected: trace propagation as the non-auth contribution

Trace headers look like the same shape but are injected at the wrong lifecycle point. The SDK's
client span is created in the transport `fetch`; the outgoing `traceparent` must name that span.
Keeping trace transport-owned also prevents a plugin from silently breaking distributed traces.
Locale proves generality without duplicating credential semantics or violating trace ownership.

### Rejected: contribution-defined error maps

A client header preparer cannot add errors to a server contract. Local failures occur before a
server response and must remain distinguishable from type-safe contract errors. Error-map repair is
still necessary, but it is orthogonal.

### Rejected: arbitrary query defaults and invalidation callbacks

The SDK already has server and TanStack query APIs. Allowing contributions to author defaults or key
fragments would create a third policy owner and preserve the repository's existing dual-key problem.
Version 1 only appends a canonical safety partition and otherwise leaves query behavior alone.

### Rejected: automatic plugin activation

Ambient discovery would attach credentials and policy to services by installation side effect, make
inference depend on runtime state, and complicate browser/server boundaries. Static discovery plus
explicit generated selection is auditable and tree-shakeable.

### Rejected: fluent client builder or global registry

A builder makes the generated tuple harder to infer and serialize as source. A process-global
registry risks test isolation, request leakage, and hidden ordering. The literal tuple is the
composition root.

### Impact of doing nothing

Auth remains a hardcoded wrapper or global token, non-auth headers require SDK forks, third-party
plugins require core switches, and generated/query clients cannot carry a sound request context.

## Breaking changes and migration

The ratified surface is additive when unused. Opting into a required-context contribution changes
that service's call signature by design. Opting into `direct-only` removes that service from
generated query maps by design. Those changes are local, inferred consequences of explicit config,
not ambient breaking changes.

The implementation should land in minor, coherent package releases. It must not combine removal of
`port`, `timeout`, or trace compatibility fields with this addition. Any later removal or public
custom-link design gets its own breaking assessment.

## Prior art

- oRPC's [RPCLink](https://orpc.dev/docs/client/rpc-link) provides async headers from typed client
  context and exposes path/input to the callback. This RFC composes that capability once.
- oRPC [metadata](https://orpc.dev/docs/metadata) initializes a typed metadata vocabulary with
  `$meta<T>()` and exposes it on procedures. NetScript owns the narrower cross-package type.
- oRPC's TanStack integration already requires non-empty client context in query options. NetScript
  currently erases it; this RFC restores it without exposing upstream utility types.
- The WHATWG [Fetch Standard](https://fetch.spec.whatwg.org/#forbidden-request-header) defines
  request-header ownership that browser code cannot override; runtime validation follows it.
- W3C [Trace Context](https://www.w3.org/TR/trace-context/) explains why trace headers have
  mutation, privacy, and trust-boundary rules beyond ordinary app headers.
- NetScript's existing plugin contribution groups establish the named registration pattern, and its
  doctrine requires deterministic load plus rejection of semantic plugin-order dependence.

## Unresolved questions

These are safe for discussion/FCP because they do not change the extension law:

1. Should the first implementation reserve exactly 16 contributions, or raise the ceiling if CI type
   fixtures demonstrate equal cost? It must not ship below 16.
2. Should an environment-reading bearer convenience factory ship in the first auth slice or remain
   an application example? If shipped, it must use an explicit server-only export and the same
   redaction/transport rules.
3. Should #451 be rescheduled alongside implementation, or remain independent? This RFC neither
   exposes nor requires a custom link.
4. Maintainers may refine public names (`responseCache`, `direct-only`, or the access enum) during
   FCP while preserving the specified semantics and defaults.

The following are not open: duplicate rejection, order independence, per-call async preparation,
reserved trace ownership, no upstream callback arrays, explicit plugin selection, cache partition
safety, and separation from contract-defined errors.

## Future possibilities

- A separately ratified body-signing stage after stable encoded bytes exist.
- A custom-link API based on the existing package-owned port and explicit capabilities (#451).
- Cooperative multi-value header combiners with a header-specific composition law.
- Safe `401` credential refresh with idempotency/replay policy.
- Tenant, idempotency, request-priority, or feature-negotiation contributions.
- A unified query-key implementation underneath the two public query surfaces, without changing this
  contribution protocol.
- Additional `NetScriptProcedureMeta` fields for gateway and org-aware policy, governed by their
  owning RFCs.
