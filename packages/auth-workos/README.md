# @netscript/auth-workos

WorkOS AuthKit backend and authenticators for NetScript services.

This is an Archetype-2 Integration package. It consumes the authentication port from
`@netscript/plugin-auth-core` and maps verified WorkOS sessions or access tokens into NetScript
principals.

## Install

```ts
import {
  createWorkosAccessTokenAuthenticator,
  createWorkosAuthenticator,
  createWorkosBackend,
} from '@netscript/auth-workos';
```

## Quick Start

```ts
import { WorkOS } from '@workos-inc/node';
import { createService } from '@netscript/service';
import { createWorkosBackend } from '@netscript/auth-workos';

const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY')!, {
  clientId: Deno.env.get('WORKOS_CLIENT_ID')!,
});

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

## Public Surface

- `createWorkosBackend(options)` returns a pure `AuthBackendPort` named `workos`, with provider
  registry, request-derived session lookup, backend-owned session-token crypto, principal mapping,
  and authentication over WorkOS AuthKit sealed-session cookies.
- `createWorkosAuthenticator(options)` verifies WorkOS AuthKit sealed-session cookies with
  `workos.userManagement.loadSealedSession(...).authenticate()`.
- `createWorkosAccessTokenAuthenticator(options)` verifies bearer JWTs against a WorkOS JWKS.
- `WorkosAuthenticatorOptions` configures the WorkOS SDK client, cookie password, cookie attributes,
  and refresh behavior.
- `WorkosAccessTokenAuthenticatorOptions` configures the WorkOS client ID, JWKS URL, and optional
  issuer constraint.

The backend is the composition entry for the unified auth plugin. The authenticator factories remain
available for service-auth compatibility.

## Principal Mapping

- `subject`: WorkOS user id or JWT `sub`.
- `scopes`: WorkOS permissions.
- `roles`: WorkOS role plus roles.
- `scheme`: `custom`.
- `claims`: camelCase `organizationId` and `sessionId`, plus raw provider claims where available.

When `refresh: 'always'` is configured and WorkOS returns a refreshed sealed session, the adapter
emits the rotated cookie through `AuthnResult.setCookies`.

## Capability Boundaries

WorkOS owns AuthKit session creation, refresh, and revocation. `createWorkosBackend().sessions`
therefore resolves request-local sessions through the sealed-session cookie, but `createSession`,
`refreshSession(sessionId)`, and `revokeSession(sessionId)` throw
`AuthBackendOperationUnsupportedError` instead of fabricating local state.

## Required permissions

- `--allow-net` when using the access-token JWKS authenticator.

## Deferred Scope

WorkOS webhook-to-database user/org sync is intentionally not part of this package slice. Consumers
that need local org/user mirrors should wire WorkOS webhooks in their application or use the planned
fast-follow sync component when it lands.
