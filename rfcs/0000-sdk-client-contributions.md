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

The public protocol and generated declarations are upstream-major-neutral: they contain no oRPC
types, links, plugins, contexts, interceptors, or metadata accessors. NetScript-owned internal ports
translate procedure metadata, prepared outbound headers, and transport policy to the supported
adapter. The first implementation targets stable oRPC v1; an oRPC v2 migration is a separate,
coordinated RFC/spike. Bearer credentials in `@netscript/plugin-auth-core` are the first dogfood
consumer. A locale contribution, which owns `accept-language`, is the required non-auth proof. Trace
propagation remains transport-owned because the final `traceparent` must describe the SDK's client
span, not an earlier header callback.

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

The repository already contains enough stable-v1 behavior to implement an adapter. In oRPC 1.14.6,
`RPCLink` accepts an async header resolver whose arguments include client options, procedure path,
and input. oRPC's client context also makes a non-empty context required at call sites, and TanStack
Query utilities already thread that context. The official
[v1 RPCLink documentation](https://v1.orpc.dev/docs/client/rpc-link) shows the same header/context
path. NetScript currently hides those capabilities behind a fixed context and a hardcoded callback.
Those upstream facilities are implementation evidence, not the RFC-A public seam.

A root-requested post-generator audit on 2026-08-08 found that oRPC v2 was still pre-release
(`v2.0.0-beta.26` had already superseded `beta.25`), while `v1.15.0` remained the latest stable
release. The official [v1-to-v2 migration guide](https://v2.orpc.dev/docs/migrations/from-v1) states
that the wire protocol changed and a v1 client cannot communicate with a v2 server. A focused
repository scan found 74 non-test files containing `@orpc/*` references (91 including tests), across
SDK, service, contracts, plugins, telemetry, Fresh/desktop, CLI/scaffold, serialization, OpenAPI,
errors, and query integration. RFC-A therefore MUST NOT smuggle a beta migration into its
implementation. A low-risk, exact-family move from v1.14.x to stable v1.15.0 may precede RFC-A after
a separate upgrade decision; v2 requires its own coordinated migration RFC/spike.

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
8. retain SDK ownership of the HTTP transport and its observability invariants;
9. keep every public and generated declaration independent of the selected upstream major; and
10. prepare contribution output exactly once per logical call and replay one immutable result across
    transport retries.

### Non-goals

This RFC does not:

- expose `fetch`, oRPC interceptors, adapter interceptors, link plugins, server plugins,
  serializers, or query-default callbacks through the contribution descriptor;
- define credential refresh/replay after a `401`;
- make client metadata enforce server authorization;
- expose a custom transport option (issue [#451](https://github.com/rickylabs/netscript/issues/451)
  owns that independent decision);
- migrate production to oRPC v2, adopt v2 typed-error/status-map semantics, or replace NetScript's
  OpenTelemetry span/injection ownership;
- select GET/POST behavior or CSRF policy through a contribution;
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
- **Logical call**: one user-visible procedure invocation, including every transport retry required
  to produce its final result.
- **Prepared call**: the logical call plus one immutable, validated contributor-header record. Every
  retry receives the same prepared contributor output and context snapshot.
- **Adapter port**: a NetScript-owned, non-exported structural boundary between RFC-A semantics and
  the selected transport/contract implementation. Upstream-specific adapters implement these ports.

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

`prepare` and `resolveCredential` may be async and are invoked exactly once per logical call, before
any transport retry loop. They are never invoked at module import, client construction, or again for
a retry attempt. An application may close over a concurrency-safe rotating credential source:

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

| Package/surface                                    | Archetype               | Responsibility                                                                                         |
| -------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `@netscript/contracts`                             | Public DSL/builder      | Own the cross-runtime procedure metadata vocabulary.                                                   |
| `@netscript/sdk/ports` and `@netscript/sdk/client` | Public DSL/builder      | Own upstream-free descriptor types, type algebra, and preparation errors.                              |
| `@netscript/sdk`                                   | Public preset           | Preserve tuples through `defineServices()`, expose one-call ergonomics, and own private adapter ports. |
| `@netscript/plugin/config`                         | Plugin protocol/config  | Carry static module references without importing SDK runtime types.                                    |
| `@netscript/plugin-auth-core/sdk`                  | Plugin core/integration | Own the convention-bearing bearer contribution and security policy.                                    |
| `plugins/auth`                                     | Thin plugin delivery    | Declare the module reference and generated/scaffold wiring only.                                       |
| CLI generators                                     | Tooling                 | Generate explicit imports and literal tuples; validate plugin references.                              |

This follows the doctrine's extension-axis law: a cross-package extension is named, registered,
deterministic, and duplicate-rejecting. It also follows the public-surface law: NetScript owns the
types and does not re-export `RPCLinkOptions`, `ClientOptions`, `StandardHeaders`, upstream plugin
types, interceptor types, upstream context, or upstream metadata accessors. The three internal
adapter ports below are package-private and do not enlarge the JSR surface.

### Procedure metadata

`@netscript/contracts` adds the following root exports:

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
```

The normative semantic requirement is that `baseContract` and every derived contract accept
`NetScriptProcedureMeta`, preserve it through the publishable contract declaration, and expose it to
the SDK metadata port. Missing metadata normalizes to `{}`. The implementation MUST use an explicit
publishable annotation that preserves both the concrete common error map and
`NetScriptProcedureMeta`; it MUST NOT retain the erasing `ReturnType<typeof oc.errors>` annotation.
The exact error-map repair belongs to #1350, but the metadata and error work must land coherently so
one does not re-erase the other.

How an upstream adapter stores or reads this semantic metadata is non-normative. For illustration,
the supported v1 adapter can initialize its private builder with v1's typed metadata facility:

```ts
// packages/contracts internal v1 adapter; never emitted in NetScript public declarations
const v1ContractBuilder = oc.$meta<NetScriptProcedureMeta>({});
```

A later v2 spike would instead use v2 metadata plugins and synthesize the same NetScript descriptor:

```ts
// hypothetical internal v2 adapter; not part of RFC-A implementation
const [accessMeta, readAccessMeta] = defineMeta(
  'netscript.access',
  (incoming: NetScriptProcedureMeta['access']) => incoming,
);

const descriptor: SdkClientProcedureDescriptor = {
  path,
  meta: { access: readAccessMeta(procedure) },
};
```

This follows the official
[v2 migration from `.$meta` to `defineMeta`](https://v2.orpc.dev/docs/migrations/from-v1#meta-replaced-by-meta-plugins).
Neither adapter form appears in the contribution protocol or generated public source.

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

### Internal adapter ports

The implementation MUST introduce exactly three NetScript-owned internal adapter responsibilities.
The following structural contract is normative inside `@netscript/sdk`, but the names are not public
exports and MUST NOT appear in `deno doc` or generated JSR declarations:

```ts
interface SdkClientLogicalCall<TContext extends object = object> {
  readonly context: Readonly<ServiceClientContext & TContext>;
  readonly procedurePath: readonly string[];
  readonly procedureNode: unknown;
  readonly transport: SdkClientTransportDescriptor;
  readonly input: unknown;
  readonly signal?: AbortSignal;
}

interface PreparedOutboundHeaders {
  readonly values: Readonly<Record<string, string>>;
}

interface PreparedSdkClientCall<TContext extends object = object> {
  readonly call: SdkClientLogicalCall<TContext>;
  readonly procedure: SdkClientProcedureDescriptor;
  readonly contributedHeaders: PreparedOutboundHeaders;
}

interface PreparedOutboundHeadersPort {
  prepare<TContext extends object>(
    call: SdkClientLogicalCall<TContext>,
  ): Promise<PreparedSdkClientCall<TContext>>;
}

interface ProcedureMetadataPort {
  describe(
    procedureNode: unknown,
    procedurePath: readonly string[],
  ): SdkClientProcedureDescriptor;
}

interface ClientTransportPolicyPort {
  dispatch<TOutput, TContext extends object>(
    call: PreparedSdkClientCall<TContext>,
  ): Promise<TOutput>;
}
```

`ProcedureMetadataPort` is the only component allowed to interpret an upstream procedure node.
`PreparedOutboundHeadersPort` performs tuple composition and validation exactly once per logical
call. `ClientTransportPolicyPort` owns every attempt, retry, encoding, trace, and dispatch action
and MUST accept already prepared output; it MUST NOT invoke contributors. The supported v1 adapter
and a future v2 adapter may have different private wiring, but both must satisfy these same port
semantics.

The prepared call retains one context/snapshot identity and one canonical lower-case header record.
An adapter creates a fresh transport header container for each attempt, but the contributor-owned
entries and the preparation-context projection are byte-equivalent across attempts. Trace fields or
other transport-owned fields are added only after this invariant is established.

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

This rule is upstream-major-neutral and cannot be removed during a transport migration. The official
[oRPC v2 TanStack integration](https://v2.orpc.dev/docs/integrations/tanstack-query#client-context)
still excludes client context from query keys, so neither stable v1 nor a future v2 adapter can make
client context itself a safe cache partition.

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
2. use `ProcedureMetadataPort` to create the NetScript procedure descriptor;
3. create one read-only logical-call preparation snapshot;
4. invoke contributors sequentially in tuple order with that same snapshot;
5. after each await, validate that the patch is a plain record, every header was declared, values
   are valid strings without CR/LF, and the call has not been aborted;
6. merge the disjoint patches into a new immutable lower-case record;
7. construct one `PreparedSdkClientCall`; and
8. pass only that prepared call to `ClientTransportPolicyPort`, which may encode, trace,
   retry/dedupe, fetch, and decode without invoking preparation again.

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

Preparation runs exactly once per logical client call, semantically above the adapter's retry loop.
Retries reuse the same immutable `PreparedSdkClientCall`. This avoids fetching a different
credential or locale halfway through one retry sequence. Credential refresh after a `401` requires a
future explicit replay policy; an interceptor hidden in an auth contribution would make side-effect
replay unsafe.

The adapter MUST realize prepare-once with either an outer logical-call wrapper (preferred because
the lifecycle is explicit) or an immutable per-logical-call memo shared by every attempt. Wiring
`prepare()` directly to an upstream link-header callback is non-conforming unless that callback
reads only such a memo. Official oRPC `v2.0.0-beta.25` source resolves link headers during input
encoding, while its retry plugin invokes the downstream chain again per attempt; a direct async
header callback therefore runs once per retry, not once per logical call. The supported v1 adapter
must be tested rather than assumed to differ.

A mandatory conformance fixture forces at least one retry and proves all of the following:

- contributor preparation count is exactly `1`;
- each attempt receives a freshly materialized transport header container;
- the canonical contributor-header bytes are identical on every attempt; and
- the logical-call context/procedure projection observed by the adapter is the same immutable
  snapshot on every attempt.

If the call signal is already aborted, no contributor runs. If it aborts during an async resolver,
the SDK stops awaiting, does not dispatch, and rejects with the platform abort reason. A resolver
receives the signal through `ServiceClientContext` and SHOULD stop its own work. The SDK cannot
cancel arbitrary promise side effects.

The snapshot is shallowly read-only at the type level and its top-level records are frozen in
development/test builds. The SDK does not deep-clone input or context, because that would destroy
functions, signals, streams, and identity. Contributors MUST treat nested values as borrowed and
must not mutate them.

### Transport ownership and oRPC alignment

Version 1 contributes only prepared outbound header values and typed per-call context. It does not
contribute an upstream callback. The initial stable-v1 adapter may map an already prepared record
into the native link-header facility, provided that preparation occurs above retries or through the
specified per-call memo. A future v2 adapter may use different private wiring. These are
non-normative adapter choices; the three NetScript ports and prepare-once behavior are normative.

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
oRPC within stable v1, preferably to the exact v1.15.0 family after a separate upgrade decision, but
it MUST keep one SDK-owned policy path. It MUST NOT migrate production to v2 as part of RFC-A.

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

#### Optional incoming server companion

oRPC v2's [`RequestHeadersHandlerPlugin`](https://v2.orpc.dev/docs/plugins/request-headers) is an
optional incoming server companion, not the RFC-A extension seam. It is the renamed v1
request-header handler facility and makes request headers available to handler context. It does not
provide outbound contribution ownership, duplicate/conflict policy, async credential resolution,
redaction, or cache partitioning. When a procedure is called directly without an HTTP request, its
request-header context is optional and may be absent; server middleware MUST define direct-call
behavior rather than pretending an outbound client contribution exists.

Whether a stable-v1 server installs the corresponding incoming plugin by default is a service-preset
decision for implementation review. Either choice MUST preserve direct-call tests and MUST NOT make
RFC-A client metadata enforce server authorization.

#### Boundaries reserved for the v2 migration

RFC-A does not adopt v2's typed-error/status-map redesign or its `@orpc/opentelemetry` integration.
It also does not change HTTP method selection: transport owns GET/POST, and any later v2 adapter
that enables GET must prove an explicit CSRF law. NetScript continues to own its client-span
topology and final trace injection unless the separate v2 RFC proves that upstream instrumentation
can replace them without missing spans or emitting duplicates.

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
to publish an `@orpc/*` type in a generated `.d.ts`/JSR declaration. More strongly, the public SDK
protocol and all generated public declarations MUST contain zero raw oRPC symbols: no upstream
module specifier, link, plugin, context, interceptor, metadata accessor, or structural alias whose
meaning depends on an upstream major. NetScript-owned public types may be implemented by an
upstream-specific private adapter but cannot inherit its identity.

The first implementation's compatibility target is the supported stable-v1 adapter. A later v2 spike
must run the same contribution conformance suite against its adapter before any migration RFC can
propose production adoption. Passing RFC-A on stable v1 does not imply v2 compatibility, and adding
a v2 adapter must not change the contribution protocol major.

### Staged implementation plan and issue decomposition

Implementation remains outside this RFC PR.

| Stage                          | Existing owner                                              | Scope and exit condition                                                                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Ratify                      | [#1348](https://github.com/rickylabs/netscript/issues/1348) | Accept this RFC, settle safe FCP questions, and reconcile child issue bodies.                                                                                                                                           |
| 1. Contract/type repair        | [#1350](https://github.com/rickylabs/netscript/issues/1350) | Preserve the concrete base error map and initialize/export `NetScriptProcedureMeta`; type fixtures prove both.                                                                                                          |
| 2. Minimal client seam         | [#1349](https://github.com/rickylabs/netscript/issues/1349) | Add descriptor/helper, tuple algebra, context-generic client/query surfaces, the three internal ports, prepare-once stable-v1 composition, cache-effect handling, and failures. Do not expose upstream callback arrays. |
| 3. Transport consolidation     | [#1351](https://github.com/rickylabs/netscript/issues/1351) | Decide separately whether to move the exact oRPC v1 family to stable v1.15.0, keep one fetch/retry/dedupe/trace path, prove prepare-once across retry, and deprecate current no-op options. No v2 migration.            |
| 4. Auth dogfood                | [#1352](https://github.com/rickylabs/netscript/issues/1352) | Ship the auth-core bearer factory, access metadata behavior, redaction, cache partition/direct-only modes, manifest reference, docs, and scaffold choice.                                                               |
| 5. Trace ownership proof       | [#1353](https://github.com/rickylabs/netscript/issues/1353) | Re-scope from “trace contribution” to prove the transport retains the only final trace injection and rejects contributor ownership of trace headers.                                                                    |
| 6. Non-auth proof              | new child after RFC acceptance                              | Ship/test locale contribution, partitioned keys, header conflicts, and generated use. Do not file during this RFC run.                                                                                                  |
| 7. Generic discovery           | [#1093](https://github.com/rickylabs/netscript/issues/1093) | Discover third-party module references without hardcoded factories; generated selection remains explicit.                                                                                                               |
| 8. oRPC v2 migration RFC/spike | new owner after RFC-A review; do not file in this run       | Wait for stable unless the owner explicitly accepts beta; prove a complete, coordinated adapter migration independently of RFC-A.                                                                                       |

Issue #451 remains the sole future owner of custom links. #928 and #934 consume aligned protocol and
metadata vocabulary but are not prerequisites for the header seam. The org-aware policy work in
[#884](https://github.com/rickylabs/netscript/issues/884) may later add a tenant context/header
contribution, but server authorization and tenant validation remain separate.

The separate v2 RFC/spike must, at minimum, gate all of the following before production adoption:

- wait for the stable dist-tag unless the owner explicitly accepts beta risk, and pin the entire
  oRPC package family to one exact version;
- use a coordinated client/server rollout or parallel versioned endpoints because the protocols are
  incompatible; explicitly decide whether zero-downtime mixed-version service is required;
- prove route, metadata, OpenAPI, and Scalar output parity;
- prove typed-error semantics and HTTP status-map parity without folding the migration into #1350;
- audit middleware execution counts now that v2 removes automatic deduplication;
- define the GET/POST/CSRF law;
- prove OpenTelemetry topology and absence of double spans before changing final injection
  ownership;
- prove Fresh/desktop serializer parity and SSE/stream lifecycle behavior;
- re-run query-key/cache-partition safety because v2 still excludes client context from keys;
- pass the Deno/browser/server matrix, package checks, full CLI/scaffold E2E, documentation
  snippets, and publish dry-run.

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
- public and generated declarations contain zero raw oRPC module specifiers or symbols, including
  links, plugins, contexts, interceptors, and metadata accessors.

#### Runtime gates

- async preparation, omission, deterministic first failure, abort, and zero-dispatch-on-failure;
- duplicate validation repeated through `unknown`/JavaScript input;
- undeclared, mixed-case, forbidden, CR/LF, non-string, and duplicate headers rejected;
- base `Content-Type` and final trace fields cannot be overwritten;
- a forced retry records preparation count `1` and byte-equivalent prepared contributor
  headers/context on every attempt;
- locale and two auth partitions cannot share cached data, while prefix invalidation still works;
- direct-only services have no runtime query/query-utils property; and
- every error/log/span snapshot excludes header values, input, context, partitions' source values,
  source messages, tokens, and session ids.

#### Adapter compatibility gates

- the supported stable-v1 adapter passes the entire contribution conformance suite;
- its upstream link-header callback, if used, consumes only the already prepared per-call record;
- the package declaration graph and generated client declarations pass the zero-oRPC-symbol scan;
- a future v2 spike adapter must pass the same suite before its migration RFC can enter FCP; and
- v2 typed-error/status-map and OpenTelemetry migration tests remain outside RFC-A.

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
- upstream-major neutrality, the private adapter boundary, and prepare-once retry behavior;
- the optional incoming request-header companion and direct-call absence behavior;
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
map through three narrow NetScript-owned ports, can be represented without upstream types, and do
not grant plugins transport control. Stable v1 supplies a viable first adapter, while the same
semantic boundary survives v2's different metadata and retry facilities. The cache-effect field is
not another behavior hook; it is the minimum declaration needed to keep existing query surfaces
safe.

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

- Stable oRPC v1's [RPCLink](https://v1.orpc.dev/docs/client/rpc-link) provides async headers from
  typed client context and exposes path/input to the callback. It is evidence for the initial
  private adapter, not the RFC-A public protocol.
- The official [v1-to-v2 migration guide](https://v2.orpc.dev/docs/migrations/from-v1) documents the
  incompatible wire protocol, metadata-plugin replacement for `.$meta`, middleware execution change,
  error/status split, GET/CSRF change, and OpenTelemetry package migration. These are why RFC-A owns
  semantic ports rather than an upstream-major shape.
- oRPC v2's [`RequestHeadersHandlerPlugin`](https://v2.orpc.dev/docs/plugins/request-headers) is an
  incoming, optional handler companion; direct calls can have no request headers. It is not outbound
  contribution composition.
- oRPC v2's
  [TanStack integration](https://v2.orpc.dev/docs/integrations/tanstack-query#client-context)
  explicitly excludes client context from query keys, preserving RFC-A's partition/direct-only law.
- In oRPC `v2.0.0-beta.25`, the
  [standard link codec](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/adapters/standard/rpc-link-codec.ts)
  resolves headers during encoding and the
  [retry plugin](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/plugins/retry.ts)
  invokes downstream per attempt. This proves that direct link-header preparation is not
  prepare-once.
- Official [oRPC releases](https://github.com/middleapi/orpc/releases) mark v2 beta releases as
  pre-release and v1.15.0 as the latest stable release as of the audit date.
- The WHATWG [Fetch Standard](https://fetch.spec.whatwg.org/#forbidden-request-header) defines
  request-header ownership that browser code cannot override; runtime validation follows it.
- W3C [Trace Context](https://www.w3.org/TR/trace-context/) explains why trace headers have
  mutation, privacy, and trust-boundary rules beyond ordinary app headers.
- NetScript's existing plugin contribution groups establish the named registration pattern, and its
  doctrine requires deterministic load plus rejection of semantic plugin-order dependence.

## Unresolved questions

These are safe for discussion/FCP because the upstream-neutral extension law, prepare-once
invariant, and separate-v2 boundary remain fixed:

1. Should the first implementation reserve exactly 16 contributions, or raise the ceiling if CI type
   fixtures demonstrate equal cost? It must not ship below 16.
2. Should an environment-reading bearer convenience factory ship in the first auth slice or remain
   an application example? If shipped, it must use an explicit server-only export and the same
   redaction/transport rules.
3. Should #451 be rescheduled alongside implementation, or remain independent? This RFC neither
   exposes nor requires a custom link.
4. Maintainers may refine public names (`responseCache`, `direct-only`, or the access enum) during
   FCP while preserving the specified semantics and defaults.
5. Should the stable-v1 adapter use an outer logical-call wrapper (the RFC's preference) or
   immutable per-logical-call memoization? Either choice must pass preparation-count `1` and
   byte-equivalent retry fixtures; direct unmemoized link-header preparation is not allowed.
6. Should the semantic procedure-auth metadata requirement be accepted inside RFC-A and implemented
   through #1350, as written, or ratified in a dependent mini-RFC? The public metadata vocabulary
   and upstream-neutral metadata port are required before auth dogfood can ship.
7. Does the owner want the optional stable-v1 incoming request-header handler installed by default
   in service presets, or explicitly selected? Direct calls must continue to tolerate absent request
   headers under an explicit server policy.
8. Should the separately reviewed stable-v1.15.0 exact-family upgrade precede the minimal client
   seam, or should RFC-A first implement against the current v1.14.x family? RFC-A supports either
   stable-v1 baseline and does not authorize v2.
9. For the separate v2 migration RFC, must production support zero-downtime mixed-version clients
   via parallel endpoints, or is a coordinated atomic client/server rollout acceptable?
10. Does Fable agree that GET enablement and its CSRF law belong exclusively to the transport/v2
    migration RFC rather than RFC-A contributions?
11. Can v2 OpenTelemetry instrumentation ever replace NetScript's final trace injection without
    violating NetScript span ownership or creating double spans? This is a v2-spike proof
    obligation, not an RFC-A implementation choice.

The following are not open: duplicate rejection, order independence, per-call async preparation,
exactly-once preparation per logical call, reserved trace ownership, zero upstream types/symbols in
public and generated declarations, no upstream callback arrays, explicit plugin selection, cache
partition/direct-only safety, separation from contract-defined errors, and no production v2 beta
migration in RFC-A.

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
- A separately ratified oRPC v2 adapter/migration after its compatibility, rollout, error,
  telemetry, serializer, streaming, cache, E2E, and publish gates pass.
