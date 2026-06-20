# @netscript/auth-workos

WorkOS AuthKit authenticators for NetScript services.

This is an Archetype-2 Integration package. It consumes the authentication port from
`@netscript/service/auth` and maps verified WorkOS sessions or access tokens into NetScript
principals.

## Install

```ts
import {
  createWorkosAccessTokenAuthenticator,
  createWorkosAuthenticator,
} from '@netscript/auth-workos';
```

## Quick Start

```ts
import { WorkOS } from '@workos-inc/node';
import { createService } from '@netscript/service';
import { createWorkosAuthenticator } from '@netscript/auth-workos';

const workos = new WorkOS(Deno.env.get('WORKOS_API_KEY')!, {
  clientId: Deno.env.get('WORKOS_CLIENT_ID')!,
});

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createWorkosAuthenticator({
      workos,
      cookiePassword: Deno.env.get('WORKOS_COOKIE_PASSWORD')!,
      refresh: 'always',
    }),
  });
```

## Public Surface

- `createWorkosAuthenticator(options)` verifies WorkOS AuthKit sealed-session cookies with
  `workos.userManagement.loadSealedSession(...).authenticate()`.
- `createWorkosAccessTokenAuthenticator(options)` verifies bearer JWTs against a WorkOS JWKS.
- `WorkosAuthenticatorOptions` configures the WorkOS SDK client, cookie password, cookie attributes,
  and refresh behavior.
- `WorkosAccessTokenAuthenticatorOptions` configures the WorkOS client ID, JWKS URL, and optional
  issuer constraint.

Both authenticators return the upstream `AuthenticatorPort` from `@netscript/service/auth`.

## Principal Mapping

- `subject`: WorkOS user id or JWT `sub`.
- `scopes`: WorkOS permissions.
- `roles`: WorkOS role plus roles.
- `scheme`: `custom`.
- `claims`: camelCase `organizationId` and `sessionId`, plus raw provider claims where available.

When `refresh: 'always'` is configured and WorkOS returns a refreshed sealed session, the adapter
emits the rotated cookie through `AuthnResult.setCookies`.

## Required permissions

- `--allow-net` when using the access-token JWKS authenticator.

## Deferred Scope

WorkOS webhook-to-database user/org sync is intentionally not part of this package slice. Consumers
that need local org/user mirrors should wire WorkOS webhooks in their application or use the planned
fast-follow sync component when it lands.
