# @netscript/auth-better-auth

better-auth backend and integration helpers for NetScript services.

This is an Archetype-2 Integration package. It consumes the authentication port from
`@netscript/plugin-auth-core` and wraps better-auth's first-party Prisma adapter over a
consumer-owned Prisma client.

## Install

```sh
deno add jsr:@netscript/auth-better-auth
```

```ts
import {
  createBetterAuthAuthenticator,
  createBetterAuthBackend,
  createNetscriptBetterAuth,
} from '@netscript/auth-better-auth';
```

## Quick Start

```ts
import { createService } from '@netscript/service';
import { createBetterAuthBackend, createNetscriptBetterAuth } from '@netscript/auth-better-auth';

const auth = createNetscriptBetterAuth({
  prisma,
  provider: 'postgresql',
  secret: Deno.env.get('BETTER_AUTH_SECRET')!,
  baseURL: Deno.env.get('BETTER_AUTH_URL')!,
});

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createBetterAuthBackend({
      auth,
      sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
      providers: [{ id: 'github', displayName: 'GitHub' }],
    }),
  });
```

## Public Surface

- `createNetscriptBetterAuth(options)` calls
  `betterAuth({ database: prismaAdapter(prisma, {
  provider }), ...options })` using better-auth's
  first-party Prisma adapter.
- `createBetterAuthBackend(options)` returns a pure `AuthBackendPort` named `better-auth`, with
  provider registry, request-derived session lookup, backend-owned session-token crypto, principal
  mapping, and authentication over `auth.api.getSession`.
- `createBetterAuthAuthenticator(options)` calls
  `auth.api.getSession({ headers:
  request.headers(), returnHeaders: true })` and maps the
  better-auth session into a NetScript principal.
- `NetscriptBetterAuthOptions` accepts a consumer-owned Prisma client and a better-auth Prisma
  provider; the package does not depend on `@netscript/database`.

## Principal Mapping

- `subject`: better-auth user id.
- `scopes`: session or user permission arrays when present.
- `roles`: user roles plus active organization roles when present.
- `scheme`: `custom`.
- `claims`: camelCase `organizationId` and `sessionId`, plus the raw better-auth session and user
  payloads.

If better-auth refreshes a session and returns `Set-Cookie`, the adapter forwards those values
through `AuthnResult.setCookies`.

## Capability Boundaries

better-auth owns session creation, refresh, and revocation through its sign-in and request APIs.
`createBetterAuthBackend().sessions` therefore resolves sessions from request headers or a
session-token cookie, but `createSession`, `refreshSession(sessionId)`, and
`revokeSession(sessionId)` throw `AuthBackendOperationUnsupportedError` instead of fabricating local
state.

## Required permissions

- `--allow-net` for provider callbacks or better-auth plugins that call external services.

## Docs

- [`@netscript/plugin-auth-core`](../plugin-auth-core/README.md)
- [`@netscript/service` auth docs](../service/README.md)
