# @netscript/plugin-auth-core

[![JSR](https://jsr.io/badges/@netscript/plugin-auth-core)](https://jsr.io/@netscript/plugin-auth-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The reusable auth core for NetScript: domain and session-stream schemas, Zod config, the
`AuthBackendPort` adapter seam, and the versioned auth API contract.**

Swapping identity providers should be a configuration change, not a rewrite — which means the
contract between "your app's auth API" and "whatever backend answers it" has to live somewhere
neutral. This package is that place. `AuthBackendPort` composes provider registry, session store,
token crypto, and principal mapping into one seam every backend adapter implements;
`AuthConfigSchema` normalizes app settings into a defaulted, secure configuration; and
`authContract` defines the signin, callback, session, me, and signout routes the auth service serves
and typed clients call.

This is the contract surface every auth backend implements and every service host wires; the
deployable [`@netscript/plugin-auth`](https://jsr.io/@netscript/plugin-auth) plugin binds it to a
NetScript host.

## Why teams use it

- **One port, many backends** — `AuthBackendPort` composes provider registry, session store, token
  crypto, and principal-mapping sub-ports, so kv-oauth, WorkOS, and better-auth adapters all
  implement one stable contract.
- **Single-active-backend registry** — `createAuthBackendRegistry` and `resolveBackend` select one
  backend per composition root, with typed `AuthBackendNotFoundError` and
  `AuthBackendOperationUnsupportedError` boundaries for what a backend cannot do.
- **Secure defaults out of the box** — `AuthConfigSchema`, `AuthSessionPolicySchema`, and
  `AuthProviderConfigSchema` normalize settings into a defaulted `AuthConfig` (secure `__Host-`
  cookies, TTL, refresh window).
- **A versioned API contract** — `authContract` / `authContractV1` define the signin, callback,
  session, me, and signout routes with explicit authentication metadata, so services and clients
  share one typed source of truth.
- **Typed client credentials** — `createBearerSdkClientContribution` resolves credentials from
  explicit per-call context and contributes only the declared `authorization` header.
- **Observable and streamable** — `authStreamSchema` projects `auth.*` session events into durable
  streams, and `createAuthTelemetry` plus `redactAuthPrincipal` emit redacted spans, keeping
  principals out of your telemetry backend.

## Architecture

```mermaid
flowchart LR
    C["authContract v1<br/>signin · callback · session · me · signout"] --> S["Auth service host"]
    S --> RG["createAuthBackendRegistry<br/>(single active backend)"]
    RG --> P["AuthBackendPort<br/>providers · sessions · crypto · principals"]
    P --> B1["kv-oauth adapter"]
    P --> B2["workos adapter"]
    P --> B3["better-auth adapter"]
    S --> ST["authStreamSchema<br/>auth.* session events"]
```

## Install

```bash
deno add jsr:@netscript/plugin-auth-core@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

```typescript
import { AuthConfigSchema, createAuthBackendRegistry } from '@netscript/plugin-auth-core';
import type { AuthBackendPort } from '@netscript/plugin-auth-core';

// A backend adapter (kv-oauth, better-auth, WorkOS, ...) implements AuthBackendPort.
declare const kvOAuthBackend: AuthBackendPort;

// Parse app settings into a normalized, defaulted auth config.
const config = AuthConfigSchema.parse({
  backend: 'kv-oauth',
  session: { cookieName: '__Host-netscript-auth', sameSite: 'lax' },
});

// Register backends and resolve the single active one at the composition root.
const registry = createAuthBackendRegistry(
  new Map([[config.backend, kvOAuthBackend]]),
  config.backend,
);

// Service hosts authenticate requests through the resolved backend port.
const backend = registry.resolveBackend();
const session = await backend.sessions.getSession({ token: 'opaque-session-token' });
```

## Public surface

| Entry            | What it gives you                                                           |
| ---------------- | --------------------------------------------------------------------------- |
| `.`              | The backend registry, config schemas, error classes, and contract handles   |
| `./ports`        | `AuthBackendPort` and its provider / session / crypto / principal sub-ports |
| `./domain`       | Account, session, and user schemas plus the state vocabularies              |
| `./config`       | `AuthConfigSchema` and the session/provider policy schemas                  |
| `./contracts/v1` | `authContract` / `authContractV1` — the versioned auth API routes           |
| `./sdk`          | Typed bearer credential contribution for NetScript service clients         |
| `./streams`      | `authStreamSchema` and the `auth.*` session-event types                     |
| `./telemetry`    | `createAuthTelemetry`, span names, and `redactAuthPrincipal`                |
| `./presets`      | Provider and backend preset registry                                        |
| `./testing`      | Fixtures for exercising backends and contracts in tests                     |
| `./authenticator` | Remote session verifier, options, bearer reader and redacted failure vocabulary |

The always-current symbol list is
[`deno doc jsr:@netscript/plugin-auth-core@<version>`](https://jsr.io/@netscript/plugin-auth-core/doc)
(pin `<version>` on the pre-release line, as above).

## Bearer credentials for service clients

Import `createBearerSdkClientContribution` from `@netscript/plugin-auth-core/sdk`, then attach the
returned descriptor explicitly to the intended service client's `contributions` tuple. The resolver
receives only the contribution's declared context projection. The module never reads environment
variables, cookies, browser storage, or another ambient credential source.

Choose `responseCache: { mode: 'direct-only' }` when authenticated responses must not enter generated
query caches. For partitioned caching, return a stable, non-secret tenant or account partition. Never
use a bearer token, session identifier, email address, or another reversible credential-derived value
as the partition because cache keys may appear in diagnostics and developer tools.

Credentials are sent over HTTPS and local-development loopback origins by default. Enabling
`allowInsecureTransport` for another cleartext origin is an explicit security exception and should be
limited to controlled development environments.

## Verify sessions in another service

The server-side `./authenticator` leaf returns the native service `AuthenticatorPort`. Supply the
actual Aspire discovery resource name and an explicit timeout at your composition root:

```typescript
import { createService } from '@netscript/service';
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth-core/authenticator';

declare const authServiceName: string;
const app = createService({}, { name: 'protected-api' })
  .withAuthn({
    authenticator: createAuthServiceAuthenticator({
      serviceName: authServiceName,
      timeoutMs: 10_000,
    }),
  })
  .build();
```

The discovery name must match the generated resource reference, which supplies
`services__<name>__http__0` (or the HTTPS equivalent). The example timeout is application policy;
the factory requires an integer from 1 through 2,147,483,647 milliseconds. `routerName` defaults to
`auth`; `protocol` follows SDK discovery defaults. No provider secret or backend instance belongs
in the consuming service.

Each request verifies its bearer through the native typed SDK. Missing or malformed bearer is
rejected before discovery. Inactive, revoked and expired sessions are rejected. Verification has
no principal or response cache, so revocation is checked again on the next request. The principal
preserves the auth service's subject, scopes, roles and claims; claims may contain sensitive native
session metadata and must not be logged wholesale.

A defined remote `UNAUTHORIZED` response is credential denial. Discovery, transport, timeout,
provider and malformed-response failures throw `RemoteSessionVerificationError` with a fixed
message and bounded diagnostics, never the raw response or credential. Native service middleware
maps denial to 401 and verifier failure to a redacted 503. Discovery failures use the `transport`
code because the SDK exposes no typed discovery discriminator.

The verifier does not forward cookies. On the auth service itself, KV-OAuth resolves explicit
session ID before bearer before cookie; WorkOS resolves bearer before cookie. Better-auth retains
its own request-header behavior, so this factory does not promise bearer support for every provider.
HTTPS and loopback HTTP are accepted by default; other cleartext transport requires explicit
`allowInsecureTransport`. This API does not add authorization rules or repair signout ownership.

## Docs

- **Auth core reference — ports, schemas, and contract**:
  [rickylabs.github.io/netscript/reference/plugin-auth-core/](https://rickylabs.github.io/netscript/reference/plugin-auth-core/)
- **Identity & Access — the full authentication story**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **API docs on JSR**:
  [jsr.io/@netscript/plugin-auth-core/doc](https://jsr.io/@netscript/plugin-auth-core/doc)

## Compatibility

Schemas, ports, and the contract are plain TypeScript — importable in any TypeScript environment.
Concrete backend adapters and the service host that wires them target Deno 2.9+.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
