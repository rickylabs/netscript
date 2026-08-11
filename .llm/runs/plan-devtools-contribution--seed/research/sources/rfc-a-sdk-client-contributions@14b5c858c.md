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

The public protocol and generated client declarations are upstream-major-neutral: they contain no
oRPC types, links, plugins, contexts, interceptors, or metadata accessors. NetScript-owned internal
ports translate procedure metadata, prepared outbound headers, and transport policy to the supported
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
10. prepare contribution output exactly once per logical call epoch, replay one immutable result
    across that epoch's transport retries, and begin a fresh preparation epoch for every
    iterator-phase stream reconnect.

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
- **Contribution context projection**: only the keys declared by contributions. SDK transport keys
  such as retry, cache, trace, and signal are not part of it; cancellation is exposed separately.
- **Preparation snapshot**: the immutable contribution context projection, signal, procedure
  descriptor, input, and transport descriptor passed independently to every contribution.
- **Header ownership**: the exclusive right to emit one lower-case request header name.
- **Response-cache effect**: the contributor's declaration that its header is response-invariant,
  partitionable, or unsafe for generated query helpers.
- **Partition**: a synchronous, non-secret discriminator added to a full query key. It is not a
  credential and is intentionally visible in cache tools.
- **Transport policy**: discovery, URL/method selection, codec, retry, dedupe, tracing, `fetch`,
  streaming, and dispatch. The SDK owns it for `createServiceClient()`.
- **Logical call epoch**: for a unary call, one user-visible invocation including its transport
  retries; for a stream, one connection attempt sequence ending when an iterator is returned or a
  reconnect is exhausted. An iterator-phase reconnect starts a new epoch.
- **Stream session**: the user-visible async iterator, which may span multiple logical call epochs.
- **Prepared call**: one logical call epoch plus one immutable, validated contributor-header record.
  Every transport attempt in that epoch receives the same prepared contributor output and
  contribution context projection.
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

`prepare` and `resolveCredential` may be async and are invoked exactly once per logical call epoch,
before that epoch's transport retry loop. They are never invoked at module import, client
construction, or again for an ordinary retry attempt. Iterator-phase stream reconnects begin a new
epoch so a rotating credential source is consulted again. An application may close over a
concurrency-safe rotating credential source:

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
Neither adapter form appears in the contribution protocol or generated client public source.

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

export interface SdkClientPrepareOptions<
  TContext extends object = Record<never, never>,
> {
  readonly context: Readonly<TContext>;
  readonly signal?: AbortSignal;
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

export interface SdkClientCachePartitionOptions<
  TContext extends object = Record<never, never>,
> {
  readonly context: Readonly<TContext>;
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

`context` in `SdkClientPrepareOptions` and `SdkClientCachePartitionOptions` is deliberately the
contribution-owned projection, not `ServiceClientContext & TContext`. The SDK reserves `signal`,
`cache`, `retry`, `retryDelay`, `shouldRetry`, `onRetry`, and `traceHeaders` as framework context
keys, rejects a contribution that declares any of them, and exposes cancellation only through the
separate `signal` property. A contributor therefore cannot observe or depend on the selected
upstream retry plugin, cache mode, dedupe context replacement, or trace compatibility bridge.
`ServiceClientContext` keeps those fields for existing callers, but transport policy alone
interprets them.

### Internal adapter ports

The implementation MUST introduce exactly three NetScript-owned internal adapter responsibilities.
They live under `packages/sdk/src/internal/client-contributions/`; the initial files are
`adapter-ports.ts`, `prepared-call.ts`, and `stable-v1-adapter.ts`. That directory has no `mod.ts`,
is absent from `packages/sdk/deno.json` exports, and is imported only by relative package-internal
paths. The following structural contract is normative inside `@netscript/sdk`, but the names are not
public exports and MUST NOT appear in any root/client/ports/desktop `deno doc` graph, generated
declaration, or packed-consumer import:

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
call epoch. `ClientTransportPolicyPort` owns every attempt, retry, encoding, trace, and dispatch
action and MUST accept already prepared output; it MUST NOT invoke contributors. The supported v1
adapter and a future v2 adapter may have different private wiring, but both must satisfy these same
port semantics.

The normative channel is the direct `PreparedSdkClientCall` argument passed from the preparation
port to the transport port. A stable-v1 realization that must cross an upstream callback MAY also
store that same object under a package-private `unique symbol` declared in `stable-v1-adapter.ts`.
The symbol and value are transport context, never contribution-visible context. An upstream callback
may read only that prepared value; it cannot invoke contributors. If an upstream plugin replaces its
downstream context, the adapter must explicitly preserve or reattach the private value, or use a
per-call closure instead. This is why outer wrapper versus memoized realization remains an
implementation choice but the channel and observable semantics do not.

The prepared call retains one contribution-context projection identity and one canonical lower-case
header record. An adapter creates a fresh transport header container for each attempt, but the
contributor-owned entries and projection are byte-equivalent across attempts in one logical call
epoch. Transport-only signal, cache, retry, and trace context may be replaced or advanced by the
adapter and are outside this equality assertion. Trace fields or other transport-owned fields are
added only after the contributor-header invariant is established.

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
export interface ServiceRequestOptions<
  TContext extends object = ServiceClientContext,
> {
  readonly context?: TContext;
}

export type ServiceRequestRest<TContext extends object = ServiceClientContext> =
  RequiredKeys<TContext> extends never ? [options?: ServiceRequestOptions<TContext>]
    : [options: { readonly context: TContext }];

export type ServiceClientMethod<
  TInput,
  TOutput,
  TContext extends object = ServiceClientContext,
> = (
  input: TInput,
  ...request: ServiceRequestRest<TContext>
) => Promise<TOutput>;

export type ServiceClientShape<
  TContract extends ContractLike,
  TContext extends object = ServiceClientContext,
> = TContract extends ContractProcedureLike ? ServiceClientMethod<
    ProcedureInputFromNode<TContract>,
    ProcedureOutputFromNode<TContract>,
    TContext
  >
  : {
    [K in keyof TContract]: TContract[K] extends ContractLike
      ? ServiceClient<TContract[K], TContext>
      : never;
  };

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

Compatibility defaults are normative on every widened public generic. New parameters are appended
after existing parameters so positional type arguments keep their meaning:

| Surface                                                                                                       | Required default                                                       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ServiceRequestOptions<TContext>` / `ServiceRequestRest<TContext>`                                            | `ServiceClientContext`                                                 |
| `ServiceClientMethod<TInput, TOutput, TContext>`                                                              | `ServiceClientContext`                                                 |
| `ServiceClientShape<TContract, TContext>` / `ServiceClient<TContract, TContext>`                              | `ServiceClientContext`                                                 |
| `CreateServiceClientOptions<TContract, TContributions>`                                                       | `readonly []` for `TContributions`                                     |
| `ActionQueryKey<TAction, TKeySuffix>` / `createActionQueryKey<..., TKeySuffix>()`                             | `readonly []` for `TKeySuffix`                                         |
| `ActionMethod<TContract, TAction, TContext, TKeySuffix>`                                                      | `ServiceClientContext`, then `readonly []`                             |
| `QueryFactory<TContract, TContext, TKeySuffix>` / `FactoryConfig<...>`                                        | `ServiceClientContext`, then `readonly []`                             |
| `ServiceQueryClientContext<TContext>`                                                                         | `Record<never, never>`                                                 |
| `ServiceQueryKeyOptions<TInput, TContext>`                                                                    | `Record<never, never>`                                                 |
| `ServiceProcedureQueryOptions<TInput, TContext>`                                                              | `Record<never, never>`                                                 |
| `ServiceProcedureInfiniteOptions<TInput, TPageParam, TContext>`                                               | existing `unknown` for `TPageParam`, then `Record<never, never>`       |
| `ServiceProcedureMutationOptions<TInput, TOutput, TMutationContext, TContext>`                                | existing `unknown` for `TMutationContext`, then `Record<never, never>` |
| `ServiceProcedureStreamedOptions<TInput, TContext>` / `ServiceProcedureQueryUtils<TInput, TOutput, TContext>` | `Record<never, never>`                                                 |
| `ServiceQueryUtils<TContract, TContext>` / `createServiceQueryUtils<TContract, TContext>()`                   | `Record<never, never>`                                                 |
| `DefineServiceConfig<TContract, TContributions>`                                                              | `readonly []` for `TContributions`                                     |

The implementation type fixture MUST compile all pre-RFC single-generic/two-generic uses unchanged;
an omitted tuple cannot require a newly written type argument.

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

#### Server key algebra and compatibility

The server cache cannot append the nested TanStack suffix directly: `QueryKeyPart` is primitive and
`CacheKey` is `Deno.KvKey`. RFC-A therefore uses a two-string server suffix. The first string is a
stable tag; the second is `JSON.stringify` over the contribution-id-sorted array of validated
`[id, partition]` pairs. The values are visible, length-bounded, and non-secret by the partition
law. No partitioned contribution means no suffix at all.

```ts
export type SdkClientServerKeySuffix =
  | readonly []
  | readonly ['$netscript.sdk-context', string];

export type ActionQueryKey<
  TAction extends string = string,
  TSuffix extends SdkClientServerKeySuffix = readonly [],
> = readonly [
  resource: string,
  action: TAction,
  serializedInput: string,
  ...suffix: TSuffix,
];

export function createActionQueryKey<
  const TAction extends string,
  const TSuffix extends SdkClientServerKeySuffix = readonly [],
>(
  resource: string,
  action: TAction,
  input: unknown,
  suffix?: TSuffix,
): ActionQueryKey<TAction, TSuffix>;
```

Thus a contribution-free or invariant-only service retains the exact public three-tuple. A
partitioned `orders.list` call has the full server key:

```ts
[
  'orders',
  'list',
  '{"page":1}',
  '$netscript.sdk-context',
  '[["@netscript/plugin-auth:bearer","principal-7"],["app:locale","de-CH"]]',
];
```

`ActionMethod` and `QueryFactory` append `TContext = ServiceClientContext` and
`TKeySuffix = readonly []` generics. `ActionMethod.key`, its callable operation, `prefetch`,
`getCachedData`, and `getCachedEntry` accept the same conditional context rest used to compute the
partition. Resource/action invalidation methods remain prefix-only and accept no partition. The six
existing server/client bridge surfaces have these normative dispositions:

| Current surface                                             | RFC-A disposition                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createActionQueryKey(): readonly [string, string, string]` | Return `ActionQueryKey<TAction, TSuffix>`; the default stays the exact current three-tuple.                                                                                                                                                                                                   |
| `ActionMethod.key` and `QueryFactory`                       | Append defaulted context/suffix generics; full-key and cache-access calls compute one suffix from their request context.                                                                                                                                                                      |
| `CacheKey = Deno.KvKey` and `CacheQuery`                    | No public widening. Both suffix elements are strings; storage remains `['cache_query', ...ActionQueryKey]`.                                                                                                                                                                                   |
| `query-client/key-bridge.ts`                                | No public change. `toClientKeyPrefix` and `bridgeInvalidation` keep resource/action prefixes and never include a partition suffix.                                                                                                                                                            |
| `query-client/kv-cache-persister.ts`                        | No public change. Its opaque serialized TanStack key already contains the generated full-key suffix; two partitions must persist under different storage strings.                                                                                                                             |
| `collections/create-query-collection.ts`                    | The low-level manual `queryKey`/`queryFn` pair remains caller-owned. Generated/scaffolded contribution-aware collections MUST take both from the same generated query-options result; a golden/conformance fixture proves an unsuffixed key is never generated beside a partitioned function. |

TanStack key injection is not a zero-cost type cast. For a context-bearing service,
`createServiceQueryUtils` MUST recursively wrap the upstream utility tree. At each procedure and
nesting level it precomputes the contribution partition for each full-key operation kind (`query`,
`streamed`, `live`, and `infinite`), merges the canonical suffix into the upstream
`optionsIn.queryKey`, and forwards the same context to the query function. Mutation helpers forward
context but do not add a response-cache partition. Partial `.key()`/invalidation prefixes remain
unchanged. The current `return utils as ServiceQueryUtils<TContract>` fast path is permitted only
for the default empty-context/no-partition specialization.

The checked-in `service-query-utils-upstream_type.ts` assertion remains valid for
`ServiceQueryUtils<TContract>` because its new context generic defaults to `Record<never, never>`.
It MUST NOT be generalized to a contributed specialization: that surface is produced by the wrapper
above and is tested separately. The RFC proof fixture
`packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` pins the default
assignability, real `ContractLike` recursion, contribution-aware `defineServices` result, server key
suffix, and direct-only omission.

### Composition and ordering law

Construction performs these steps in tuple order:

1. validate the protocol family and major, id grammar, tuple/key limits, and plain-object shape;
2. reject contribution ownership of SDK context keys (`signal`, `cache`, retry fields, and
   `traceHeaders`);
3. canonicalize declared header names to lower case and reject non-canonical input;
4. reserve framework and Fetch-owned headers;
5. reject duplicate ids, context keys, and header keys; and
6. validate query compatibility and generated surface selection.

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

Preparation runs exactly once per logical call epoch, semantically above the adapter's retry loop.
Unary retries reuse the same immutable `PreparedSdkClientCall`. This avoids fetching a different
credential or locale halfway through one attempt sequence. Credential refresh after a `401` requires
a future explicit replay policy; an interceptor hidden in an auth contribution would make
side-effect replay unsafe.

The adapter MUST realize prepare-once with either an outer logical-call wrapper (preferred because
the lifecycle is explicit) or an immutable per-epoch memo shared by every attempt. Wiring
`prepare()` directly to an upstream link-header callback is non-conforming unless that callback
reads only such a memo. This behavior is verified, not hypothetical, on the repository's locked oRPC
v1.14.6 family: `StandardRPCLinkCodec.encode()` resolves `headers` for every downstream entry, and
`ClientRetryPlugin` re-enters that downstream chain for every retry. The v2 beta.25 source has the
same relevant lifecycle. Direct async preparation in either link-header callback therefore runs per
attempt and is non-conforming.

A mandatory unary conformance fixture explicitly passes `context.retry: 1` because the current
stable-v1 adapter configures retry off by default (`default.retry = 0`). It proves all of the
following:

- contributor preparation count is exactly `1`;
- each attempt receives a freshly materialized transport header container;
- the canonical contributor-header bytes are identical on every attempt; and
- the contribution context/procedure projection observed by the adapter is the same immutable
  snapshot on every attempt.

Streaming has a different boundary. Returning an `AsyncIterator` creates a stream session, not an
eternally prepared epoch. A failure raised by `iterator.next()` after the iterator was returned
starts a new reconnect epoch. Before dispatching that reconnect, the SDK MUST rerun contribution
preparation exactly once against the same borrowed input and current contribution context source.
All transport attempts inside the reconnect epoch reuse that new prepared call. The stable-v1
adapter MUST NOT let `ClientRetryPlugin` perform iterator-phase recovery against the old memo
without this outer re-preparation step. Its existing retry budget and abort signal still bound
whether another epoch is attempted; retry remains transport policy and is not contributor-visible.

The iterator-phase conformance fixture explicitly enables retry, opens a credential-bearing stream
with credential `A`, consumes one item, rotates the source to `B`, forces `iterator.next()` to fail,
and observes the reconnect. Required assertions are: preparation count `2` (one per epoch), initial
attempts contain `A`, reconnect attempts contain `B`, and every attempt within each epoch is
byte-equivalent. An aborted stream starts no new epoch. This rule prevents a long-lived stream from
reconnecting indefinitely with a frozen bearer while preserving prepare-once for ordinary retries.

The stable-v1 dedupe path is header-safe: its request identity includes body, headers, method, and
URL. Because prepared contributor headers exist before dedupe, calls with different bearer or locale
values do not coalesce. Dedupe may replace downstream transport context with a group context; that
does not alter the already prepared header record and is why conformance compares the contribution
projection rather than the whole `ServiceClientContext` object.

If the call signal is already aborted, no contributor runs. If it aborts during an async resolver,
the SDK stops awaiting, does not dispatch, and rejects with the platform abort reason. A resolver
receives the signal through `SdkClientPrepareOptions.signal` and SHOULD stop its own work. The SDK
cannot cancel arbitrary promise side effects.

The snapshot is shallowly read-only at the type level and its top-level records are frozen in
development/test builds. The SDK does not deep-clone input or context, because that would destroy
functions, signals, streams, and identity. Contributors MUST treat nested values as borrowed and
must not mutate them.

### Transport ownership and oRPC alignment

Version 1 contributes only prepared outbound header values and typed per-call context. It does not
contribute an upstream callback. The initial stable-v1 adapter may map an already prepared record
into the native link-header facility, provided that preparation occurs above retries or through the
specified per-epoch memo. A future v2 adapter may use different private wiring. These are
non-normative adapter choices; the three NetScript ports and once-per-epoch behavior are normative.

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

#### Desktop transport boundary

RFC-A version 1 is an HTTP request-header axis. `@netscript/sdk/desktop` uses an oRPC MessagePort
link and has no HTTP request or header channel, so it is explicitly out of scope rather than
silently supported. `CreateDesktopServiceClientOptions` does not gain `contributions`. Its
TypeScript excess-property check and runtime construction validation MUST reject a supplied
`contributions` field with `SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED`; JavaScript/widened input must
not be accepted and ignored. `SdkClientContributionReference.targets` remains only `browser` and
`server`, and generators fail if an HTTP contribution is selected for a desktop target.

Consequently, creating a desktop client from the same contract does not send bearer or locale
headers over MessagePort. Auth-core and desktop docs MUST state this. If a desktop native host later
calls an HTTP service, the host creates a separate HTTP `createServiceClient()` and supplies its own
contribution context; the webview credential is never ambiently forwarded across the native bridge.
A future MessagePort contribution/capability seam requires a separate RFC and cannot reuse
`headerKeys` as if MessagePort had headers.

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

RFC-A does not adopt v2's typed-error/status-map redesign. Stable v1 already enables GET inference
today through `inferRPCMethodFromContractRouter`, and the SDK's dedupe filter is GET-only. The
separate v2 migration must choose explicitly between:

1. preserve GET by reimplementing the removed method-inference behavior, enabling GET in the v2
   server's `allowMethods`, and defining a `Sec-Fetch-Mode`/CSRF law; or
2. adopt v2's POST-oriented default, explicitly retire current GET behavior, and replace or remove
   the now-ineffective GET-only dedupe policy.

Silently accepting POST-only behavior while leaving the current dedupe filter installed is not a
valid migration. The `@orpc/opentelemetry` package name is also not exclusively a v2 concern: that
package ships on the maintained v1 line. Selecting/renaming the v1 instrumentation dependency
belongs to transport issue #1351. The v2 spike owns only proof of span topology, execution counts,
and absence of double spans before any change to NetScript's final trace injection. RFC-A continues
to own neither typed-error/status migration nor telemetry-package migration.

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
  | 'SDK_CONTRIBUTION_TRANSPORT_UNSUPPORTED'
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
| Contribution supplied to Desktop/unsupported link         | compile when literal; construction always | Reject rather than ignoring it; name the unsupported transport without including context or header values.                                     |
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

`prepare` receives raw `input: unknown`, including values owned by application or third-party
schemas. It is sensitive borrowed data: a contribution may inspect it only to decide its declared
headers and MUST NOT log, persist, retain, hash for telemetry, copy it into an error, return it from
the patch, or use it as a cache partition. Installing a third-party contribution grants this
per-call visibility and must be documented as part of plugin trust review.

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
The committed compile-only fixture
[`packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`](../packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts)
models the proposed algebra against the real `ContractLike`, `DefineServiceConfig`/`defineServices`
result shape, `ServiceClient`, `ServiceQueryUtils`, and server key primitives. It checks two
composed contexts, default generic assignability, required call/query arguments, direct-only
omission, a duplicate-context diagnostic, an accepted 16-element tuple, and a rejected 17-element
tuple. The fixture's measured time/RSS is recorded in the harness worklog and remains informational
rather than a portable CI threshold.

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
to add an `@orpc/*` identity to an RFC-A declaration. The zero-oRPC gate is deliberately scoped to
(a) every new RFC-A protocol/descriptor/context/cache/error/reference/auth declaration and (b)
generated client declarations. Those targets MUST contain zero raw upstream module specifiers,
links, plugins, contexts, interceptors, metadata accessors, or structural aliases whose meaning
depends on an upstream major. NetScript-owned public types may be implemented by an
upstream-specific private adapter but cannot inherit its identity.

For public modules, the declaration gate filters `deno doc --json` to the named RFC-A symbols and
scans those nodes; it does not scan the entire unchanged `@netscript/sdk/ports` graph. Generated
client files are scanned in full because they have no historical compatibility surface.

The gate does not claim the unchanged SDK/contracts surface is already clean. Current
`ContractProcedureLike`/`ContractLike` expose the literal `~orpc` structural accessor, and the
doctrine sanctions real oRPC builder types in `@netscript/contracts`. Those exact pre-existing paths
are an allowlist tied to type-soundness umbrella #1278 and repair issue #1350; the allowlist may not
grow and does not exempt a new RFC-A symbol. #1350 may reduce the leak while repairing the base
error map, but RFC-A does not make its unrelated zero-oRPC scan a prerequisite for the minimal
client seam.

The first implementation's compatibility target is the supported stable-v1 adapter. A later v2 spike
must run the same contribution conformance suite against its adapter before any migration RFC can
propose production adoption. Passing RFC-A on stable v1 does not imply v2 compatibility, and adding
a v2 adapter must not change the contribution protocol major.

Workspace manifests currently use compatible `^1.14.x` ranges; `deno.lock` is the only exact family
pin. The separate v1.15.0 decision uses lock-only pinning: keep compatible manifest ranges, update
the entire oRPC family atomically in the lock, and require `deno ci --frozen` plus dependency-graph
evidence that no mixed v1 family version resolves. Exact manifest pins are not introduced by RFC-A.
The fact that v1.15.0 shipped after the then-current v2 beta confirms stable v1 remains maintained;
staying on v1 for RFC-A is not a migration to an abandoned line.

### Staged implementation plan and issue decomposition

Implementation remains outside this RFC PR.

| Stage                          | Existing owner                                              | Scope and exit condition                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Ratify and reconcile board  | [#1348](https://github.com/rickylabs/netscript/issues/1348) | Accept this RFC, settle safe FCP questions, then align #1349–#1353 bodies before implementation. In particular, decide whether #1350 is explicitly widened to metadata or a dependent metadata child is filed; its current `safe()` title/body do not silently own metadata.                        |
| 1a. Existing error repair      | [#1350](https://github.com/rickylabs/netscript/issues/1350) | Preserve the concrete base error map and client error channel exactly as filed. This remains a type-soundness #1278 child.                                                                                                                                                                          |
| 1b. Procedure metadata         | owner selected in Stage 0; do not file in this run          | Initialize/export `NetScriptProcedureMeta` without re-erasing Stage 1a types. Either an amended #1350 or an explicit dependent child owns this before auth dogfood.                                                                                                                                 |
| 2. Minimal client seam         | [#1349](https://github.com/rickylabs/netscript/issues/1349) | Add descriptor/helper, tuple algebra, defaulted context-generic client/query surfaces, private `src/internal/client-contributions/` ports, server/TanStack key algebra, stable-v1 composition, reconnect preparation, desktop rejection, cache handling, and failures. No upstream callback arrays. |
| 3. Transport consolidation     | [#1351](https://github.com/rickylabs/netscript/issues/1351) | Decide separately whether to move the lock-pinned whole oRPC v1 family to stable v1.15.0, keep one fetch/retry/dedupe/trace path, prove unary/reconnect semantics and header-safe dedupe, and deprecate current no-op options. Selecting/renaming v1 OTel belongs here; no v2 migration.            |
| 4. Auth dogfood                | [#1352](https://github.com/rickylabs/netscript/issues/1352) | Ship the auth-core bearer factory, access metadata behavior, redaction, cache partition/direct-only modes, manifest reference, docs, and scaffold choice.                                                                                                                                           |
| 5. Trace ownership proof       | [#1353](https://github.com/rickylabs/netscript/issues/1353) | Re-scope from “trace contribution” to prove the transport retains the only final trace injection and rejects contributor ownership of trace headers.                                                                                                                                                |
| 6. Non-auth proof              | new child after RFC acceptance                              | Ship/test locale contribution, partitioned keys, header conflicts, and generated use. Do not file during this RFC run.                                                                                                                                                                              |
| 7. Generic discovery           | [#1093](https://github.com/rickylabs/netscript/issues/1093) | Discover third-party module references without hardcoded factories; generated selection remains explicit.                                                                                                                                                                                           |
| 8. oRPC v2 migration RFC/spike | new owner after RFC-A review; do not file in this run       | Wait for stable unless the owner explicitly accepts beta; prove a complete, coordinated adapter migration independently of RFC-A, including the keep-GET versus retire-GET decision.                                                                                                                |

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
- choose and prove a complete GET/POST/CSRF law: either (a) preserve current GET with a NetScript
  replacement for removed `inferRPCMethodFromContractRouter`, explicit server `allowMethods`, and
  `Sec-Fetch-Mode`/CSRF behavior, or (b) retire GET, document the selected POST/PUT/PATCH/DELETE
  methods and CSRF behavior, and update routes/docs;
- prove request dedupe remains effective under the chosen method policy; a GET-only filter that
  becomes a silent no-op fails this gate;
- prove OpenTelemetry topology and absence of double spans before changing final injection
  ownership, while keeping any stable-v1 `@orpc/otel` to `@orpc/opentelemetry` package decision in
  #1351;
- prove Fresh and Desktop MessagePort serializer parity, including browser/native framing;
- prove SSE/stream opening, iterator-phase reconnect, cursor, cancellation, and credential refresh
  lifecycle behavior;
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
- every widened public generic compiles under its compatibility default; existing single-generic
  `ServiceClient`/`ServiceQueryUtils` and current upstream-assignability fixtures remain valid;
- the server key algebra proves the default exact three-tuple and the partitioned five-tuple, while
  `CacheKey` remains `Deno.KvKey` and invalidation prefixes remain unsuffixed;
- `direct-only` service keys are absent from query/query-utils mapped types;
- server-defined error inference remains exact after metadata initialization; and
- new RFC-A protocol/descriptor/context/cache/error/reference/auth declarations and generated client
  declarations contain zero raw oRPC module specifiers or symbols. The scan uses a non-growing
  allowlist for current `ContractLike`/contracts declarations tied to #1350/#1278 rather than
  scanning those unchanged surfaces as if they were clean.

#### Runtime gates

- async preparation, omission, deterministic first failure, abort, and zero-dispatch-on-failure;
- duplicate validation repeated through `unknown`/JavaScript input;
- undeclared, mixed-case, forbidden, CR/LF, non-string, and duplicate headers rejected;
- base `Content-Type` and final trace fields cannot be overwritten;
- a forced unary retry explicitly sets `context.retry: 1`, records preparation count `1`, and
  observes byte-equivalent prepared contributor headers/projection on every attempt;
- an iterator-phase reconnect rotates credential `A` to `B`, records one preparation per epoch,
  never reuses `A` on the reconnect, and starts no epoch after abort;
- contribution callbacks cannot observe SDK retry/cache/trace fields; signal is exposed only by the
  separate preparation option;
- stable-v1 dedupe identity includes prepared headers, so distinct auth/locale requests do not
  coalesce even when other request fields match;
- locale and two auth partitions cannot share cached data, while prefix invalidation still works;
- persisted TanStack keys and generated collection wiring keep partitioned key/function pairs
  together; unsuffixed generated goldens fail;
- direct-only services have no runtime query/query-utils property; and
- Desktop construction/generation rejects contributions instead of ignoring them, while normal
  MessagePort calls remain unchanged; and
- every error/log/span snapshot excludes header values, input, context, partitions' source values,
  source messages, tokens, and session ids.

#### Adapter compatibility gates

- the supported stable-v1 adapter passes the entire contribution conformance suite;
- its upstream link-header callback, if used, consumes only the already prepared per-call record;
- implementation files live only under `src/internal/client-contributions/`, with no internal barrel
  or `deno.json` export;
- `deno doc --json` for SDK root, `./client`, `./ports`, and `./desktop`, plus a packed-consumer
  negative import fixture, prove `ProcedureMetadataPort`, `PreparedOutboundHeadersPort`,
  `ClientTransportPolicyPort`, `PreparedSdkClientCall`, and the private context symbol are absent;
- that packed fixture specifically rejects `@netscript/sdk/internal/client-contributions`,
  `@netscript/sdk/internal/client-contributions/adapter-ports`, and
  `@netscript/sdk/client-contributions` as unexported module specifiers;
- the scoped new-declaration and generated-client zero-oRPC scan passes with no growth in the
  #1350/#1278 allowlist;
- a future v2 spike adapter must pass the same suite before its migration RFC can enter FCP; and
- v2 typed-error/status-map and OpenTelemetry migration tests remain outside RFC-A.

#### Plugin/generated gates

- a synthetic third-party manifest contributes a module/export without a core edit;
- duplicate/mismatched ids and target-incompatible exports fail `plugin doctor`/generation;
- generated code uses public exports, static imports, `as const`, and explicit service selection;
- removing auth from generated config removes the context requirement and wire header; and
- selecting an HTTP contribution for `@netscript/sdk/desktop` is a generator/type/runtime error; it
  is never silently omitted; and
- auth and locale scaffold doctests type-check.

#### Repository and publish gates

- scoped check/lint/fmt wrappers for changed TypeScript;
- `deno check --unstable-kv packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`
  proves the committed real-surface 16/17 inference model until implementation replaces its local
  types with public imports;
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
- exact server/TanStack key suffixes, collection/persister behavior, and default-generic
  compatibility;
- upstream-major neutrality, scoped existing `ContractLike` debt, the private adapter location and
  absence guarantees, unary prepare-once behavior, and fresh preparation on stream reconnect;
- the HTTP-only contribution boundary for Desktop MessagePort clients and the required rejection
  behavior;
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
- The locked oRPC v1.14.6 package was executed/inspected in-tree: its standard codec resolves
  headers in `encode`, retry re-enters downstream per attempt and from iterator consumption, and
  dedupe identity includes headers. The corresponding v2 beta.25
  [standard link codec](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/adapters/standard/rpc-link-codec.ts)
  and
  [retry plugin](https://github.com/middleapi/orpc/blob/v2.0.0-beta.25/packages/client/src/plugins/retry.ts)
  confirm that these lifecycle assumptions cannot be hidden behind an upstream-major-neutral public
  callback.
- Official [oRPC releases](https://github.com/middleapi/orpc/releases) mark v2 beta releases as
  pre-release and v1.15.0 as the latest stable release as of the audit date.
- The WHATWG [Fetch Standard](https://fetch.spec.whatwg.org/#forbidden-request-header) defines
  request-header ownership that browser code cannot override; runtime validation follows it.
- W3C [Trace Context](https://www.w3.org/TR/trace-context/) explains why trace headers have
  mutation, privacy, and trust-boundary rules beyond ordinary app headers.
- NetScript's existing plugin contribution groups establish the named registration pattern, and its
  doctrine requires deterministic load plus rejection of semantic plugin-order dependence.

## Unresolved questions

These are safe for discussion/FCP because the upstream-neutral extension law, unary/reconnect
preparation invariant, and separate-v2 boundary remain fixed:

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
   immutable per-epoch memoization? Either choice must pass preparation-count `1` and
   byte-equivalent unary retry fixtures, use the specified direct/private-symbol channel, preserve
   it across context replacement, and start a fresh preparation epoch for iterator reconnect.
6. Should the semantic procedure-auth metadata requirement be accepted inside RFC-A and implemented
   by explicitly widening #1350 after acceptance, or ratified in a dependent mini-RFC/child? The
   current #1350 remains the `safe()`/error repair until that Stage-0 board decision. The public
   metadata vocabulary and upstream-neutral metadata port are required before auth dogfood can ship.
7. Does the owner want the optional stable-v1 incoming request-header handler installed by default
   in service presets, or explicitly selected? Direct calls must continue to tolerate absent request
   headers under an explicit server policy.
8. Should the separately reviewed stable-v1.15.0 exact-family upgrade precede the minimal client
   seam, or should RFC-A first implement against the current v1.14.x family? RFC-A supports either
   stable-v1 baseline, uses the normative lock-only whole-family gate, and does not authorize v2.
9. For the separate v2 migration RFC, must production support zero-downtime mixed-version clients
   via parallel endpoints, or is a coordinated atomic client/server rollout acceptable?
10. In the separate v2 migration, should NetScript preserve today's inferred GET behavior by
    replacing removed method inference plus configuring `allowMethods`/CSRF, or intentionally retire
    GET and replace the GET-only dedupe policy? RFC-A contributions do not choose either path.
11. Can v2 OpenTelemetry instrumentation ever replace NetScript's final trace injection without
    violating NetScript span ownership or creating double spans? Stable-v1 package
    selection/renaming remains #1351; only topology replacement is a v2-spike proof obligation.

The following are not open: duplicate rejection, order independence, per-call async preparation,
once-per-epoch preparation plus fresh stream reconnect credentials, reserved trace ownership, zero
upstream identities in new RFC-A/generated client declarations (under the scoped #1350/#1278
baseline), no upstream callback arrays, explicit plugin selection, cache partition/direct-only
safety, Desktop rejection, separation from contract-defined errors, and no production v2 beta
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
