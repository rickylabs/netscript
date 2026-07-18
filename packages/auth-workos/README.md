# @netscript/auth-workos

[![JSR](https://jsr.io/badges/@netscript/auth-workos)](https://jsr.io/@netscript/auth-workos)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A WorkOS AuthKit backend for NetScript: verifies AuthKit sealed-session cookies and bearer JWTs
and maps them to NetScript principals through the standard auth backend port.**

When WorkOS AuthKit handles your sign-in, the remaining question is what your API does with the
credential on every request. This package answers it twice: `createWorkosAuthenticator` verifies
AuthKit sealed-session cookies (with optional automatic refresh), and
`createWorkosAccessTokenAuthenticator` verifies bearer access tokens against the WorkOS JWKS — both
producing the same NetScript `Principal`, so route handlers authorize identically whether the caller
is a browser session or an API client. `createWorkosBackend` bundles the cookie path into the full
`AuthBackendPort` that NetScript services consume.

## Why teams use it

- **Standard backend port** — `createWorkosBackend(options)` returns a pure `AuthBackendPort` named
  `workos` with a provider registry, request-derived session lookup, backend-owned session-token
  crypto, and principal mapping.
- **Sealed-session authenticator** — `createWorkosAuthenticator(options)` verifies AuthKit
  sealed-session cookies and plugs directly into `@netscript/service` authentication.
- **Bearer JWT authenticator** — `createWorkosAccessTokenAuthenticator(options)` verifies access
  tokens against the WorkOS JWKS, with an optional issuer constraint.
- **Faithful principal mapping** — the WorkOS user id or JWT `sub` becomes `subject`, WorkOS
  permissions become `scopes`, and `organizationId` / `sessionId` surface as claims.
- **Honest capability boundaries** — WorkOS owns session creation, refresh, and revocation, so
  `createSession`, `refreshSession`, and `revokeSession` raise
  `AuthBackendOperationUnsupportedError` rather than fabricating local state.

## Install

```bash
deno add jsr:@netscript/auth-workos@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Prerequisites: a WorkOS account with AuthKit configured, and `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`,
and `WORKOS_COOKIE_PASSWORD` in the environment.

```typescript
import { createService, type ServiceRouter } from '@netscript/service';
import { createWorkosBackend, type WorkosSessionClient } from '@netscript/auth-workos';

// Your oRPC router, and a WorkOS client adapted to the session-client port —
// the NetScript auth plugin builds this adapter over @workos-inc/node for you.
declare const router: ServiceRouter;
declare const workos: WorkosSessionClient;

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createWorkosBackend({
      workos,
      cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
      refresh: 'always',
      providers: [{ id: 'workos', displayName: 'WorkOS' }],
    }),
  });
```

## Public surface

| Symbol                                                                    | What it gives you                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `createWorkosBackend`                                                     | The full `AuthBackendPort` for NetScript services    |
| `createWorkosAuthenticator`                                               | Sealed-session cookie verification alone             |
| `createWorkosAccessTokenAuthenticator`                                    | Bearer JWT verification against the WorkOS JWKS      |
| `AuthBackendOperationUnsupportedError`                                    | Raised for flows WorkOS owns (create/refresh/revoke) |
| `WorkosBackendOptions`, `WorkosAuthenticatorOptions`, `WorkosRefreshMode` | Configuration types                                  |

The always-current symbol list is
[`deno doc jsr:@netscript/auth-workos@<version>`](https://jsr.io/@netscript/auth-workos/doc) (pin
`<version>` on the pre-release line, as above).

## Docs

- **Reference — options, authenticators, and exports**:
  [rickylabs.github.io/netscript/reference/auth-workos/](https://rickylabs.github.io/netscript/reference/auth-workos/)
- **Identity & Access — how NetScript authentication fits together**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **How-to: add authentication**:
  [rickylabs.github.io/netscript/how-to/add-authentication/](https://rickylabs.github.io/netscript/how-to/add-authentication/)
- **API docs on JSR**:
  [jsr.io/@netscript/auth-workos/doc](https://jsr.io/@netscript/auth-workos/doc)

## Compatibility

Designed for Deno; needs `--allow-net` (WorkOS API and JWKS) and `--allow-env` (credentials). The
package consumes any `WorkosSessionClient` — a small structural port over the sealed-session API —
and NetScript's auth plugin adapts the official `@workos-inc/node` SDK to it for you.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
