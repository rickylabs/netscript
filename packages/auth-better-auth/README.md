# @netscript/auth-better-auth

[![JSR](https://jsr.io/badges/@netscript/auth-better-auth)](https://jsr.io/@netscript/auth-better-auth)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A better-auth backend for NetScript: implements the auth `AuthBackendPort` over a consumer-owned
Prisma client, mapping better-auth sessions to NetScript principals without owning your database.**

[better-auth](https://better-auth.com/) gives you a full authentication server — email/password,
social sign-in, organizations, plugins — but a NetScript service authorizes against one thing: a
`Principal`. This package is the bridge. `createNetscriptBetterAuth` builds a better-auth instance
over the Prisma client you already own, and `createBetterAuthBackend` wraps it as the standard
`AuthBackendPort` that NetScript services consume, so every request resolves to a principal with
`subject`, `scopes`, `roles`, and claims — regardless of how the user signed in.

The database boundary is deliberate: better-auth's Prisma adapter runs over **your** client, so this
package never depends on `@netscript/database` and never competes with your migrations.

## Why teams use it

- **Standard backend port** — `createBetterAuthBackend` returns a pure `AuthBackendPort` named
  `better-auth`: provider registry, session lookup, backend-owned session-token crypto, and
  principal mapping behind one interface.
- **Consumer-owned Prisma** — `createNetscriptBetterAuth` configures better-auth's first-party
  Prisma adapter over a client you supply; the package brings no database of its own.
- **Faithful principal mapping** — better-auth sessions map to a NetScript `Principal` with
  `subject`, `scopes`, `roles`, and camelCase `organizationId`/`sessionId` claims, forwarding any
  `Set-Cookie` refresh through `AuthnResult.setCookies`.
- **Plugin passthrough** — a typed `plugins` option forwards better-auth server plugins (bearer,
  jwt, organization, and more) while NetScript retains ownership of the database adapter.
- **Honest capability boundaries** — session creation, refresh, and revocation throw
  `AuthBackendOperationUnsupportedError` rather than fabricating local state, because better-auth
  owns those flows through its request APIs.

## Install

```bash
deno add jsr:@netscript/auth-better-auth@<version>
```

Pin `<version>` to match your installed CLI; bare `jsr:@netscript/*` specifiers do not resolve on
the pre-release line.

## Quick example

Prerequisites: a database with the better-auth schema applied, a generated Prisma client for it, and
`BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` in the environment.

```typescript
import { createBetterAuthBackend, createNetscriptBetterAuth } from '@netscript/auth-better-auth';

// Your generated Prisma client, with the better-auth schema applied.
declare const prisma: Record<string, unknown>;

// 1. Build a better-auth instance over your own Prisma client.
const auth = createNetscriptBetterAuth({
  prisma,
  provider: 'postgresql',
  secret: Deno.env.get('BETTER_AUTH_SECRET')!,
  baseURL: Deno.env.get('BETTER_AUTH_URL')!,
});

// 2. Wrap it as an AuthBackendPort that NetScript services consume.
const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
  providers: [{ id: 'github', displayName: 'GitHub' }],
});

// `backend.authenticate(request)` resolves the better-auth session and
// returns a NetScript principal; provider, session, and crypto ports
// are exposed on the same backend.
```

## Public surface

| Symbol                                                   | What it gives you                                          |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `createNetscriptBetterAuth`                              | A better-auth instance over your Prisma client             |
| `createBetterAuthBackend`                                | The full `AuthBackendPort` for NetScript services          |
| `createBetterAuthAuthenticator`                          | The request authenticator alone, when the port is too much |
| `AuthBackendOperationUnsupportedError`                   | Raised for flows better-auth owns (create/refresh/revoke)  |
| `BetterAuthBackendOptions`, `NetscriptBetterAuthOptions` | Configuration types                                        |

The always-current symbol list is
[`deno doc jsr:@netscript/auth-better-auth@<version>`](https://jsr.io/@netscript/auth-better-auth/doc)
(pin `<version>` on the pre-release line, as above).

## Docs

- **Reference — options, ports, and exports**:
  [rickylabs.github.io/netscript/reference/auth-better-auth/](https://rickylabs.github.io/netscript/reference/auth-better-auth/)
- **Identity & Access — how NetScript authentication fits together**:
  [rickylabs.github.io/netscript/identity-access/](https://rickylabs.github.io/netscript/identity-access/)
- **better-auth plugins — forwarding server plugins through the backend**:
  [rickylabs.github.io/netscript/identity-access/better-auth-plugins/](https://rickylabs.github.io/netscript/identity-access/better-auth-plugins/)
- **API docs on JSR**:
  [jsr.io/@netscript/auth-better-auth/doc](https://jsr.io/@netscript/auth-better-auth/doc)

## Compatibility

Designed for Deno; needs `--allow-env` for secrets and `--allow-net` for database access through
your Prisma client. Requires a better-auth-compatible database schema — see the better-auth
documentation for migrations.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
