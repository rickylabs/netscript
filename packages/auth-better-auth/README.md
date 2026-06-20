# @netscript/auth-better-auth

better-auth integration helpers for NetScript services.

This is an Archetype-2 Integration package with a schema-generation mechanic for better-auth Prisma
models. It consumes the authentication port from `@netscript/service/auth` and wraps better-auth's
first-party Prisma adapter over a consumer-owned Prisma client.

## Install

```ts
import {
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
  mountBetterAuthHandler,
} from '@netscript/auth-better-auth';
```

## Quick Start

```ts
import { Hono } from 'hono';
import { createService } from '@netscript/service';
import {
  createBetterAuthAuthenticator,
  createNetscriptBetterAuth,
  mountBetterAuthHandler,
} from '@netscript/auth-better-auth';

const auth = createNetscriptBetterAuth({
  prisma,
  provider: 'postgresql',
  secret: Deno.env.get('BETTER_AUTH_SECRET')!,
  baseURL: Deno.env.get('BETTER_AUTH_URL')!,
});

const app = new Hono();
mountBetterAuthHandler(app, auth, { basePath: '/api/auth' });

const service = createService(router, { name: 'private-api' })
  .withAuthn({
    authenticator: createBetterAuthAuthenticator({ auth }),
  });
```

Configure the NetScript service's anonymous/exempt path policy so `/api/auth/**` is not protected by
the authenticator it is responsible for establishing.

## Public Surface

- `createNetscriptBetterAuth(options)` calls `betterAuth({ database: prismaAdapter(prisma, {
  provider }), ...options })` using better-auth's first-party Prisma adapter.
- `createBetterAuthAuthenticator(options)` calls `auth.api.getSession({ headers:
  request.headers(), returnHeaders: true })` and maps the better-auth session into a NetScript
  principal.
- `mountBetterAuthHandler(app, auth, options)` mounts better-auth's Fetch handler on a Hono app.
- `NetscriptBetterAuthOptions` accepts a consumer-owned Prisma client and a better-auth Prisma
  provider; the package does not depend on `@netscript/database`.

## Principal Mapping

- `subject`: better-auth user id.
- `scopes`: session or user permission arrays when present.
- `roles`: user roles plus active organization roles when present.
- `scheme`: `custom`.
- `claims`: camelCase `organizationId` and `sessionId`, plus the raw better-auth session and user
  payloads.

If better-auth refreshes a session and returns `Set-Cookie`, the adapter forwards those values through
`AuthnResult.setCookies`.

## Prisma Schema Generation

Generate better-auth Prisma models with the repo tool wrapper:

```sh
deno run --allow-read --allow-write --allow-run --allow-env \
  .llm/tools/auth/gen-better-auth-prisma.ts \
  --config ./auth.ts \
  --output ./database/better-auth.prisma \
  --yes
```

The wrapper invokes `@better-auth/cli generate` as a development command. It is not a runtime
dependency. The consumer owns including the generated Prisma model contribution in their database
schema and running the migration.

## Required permissions

- `--allow-net` for provider callbacks or better-auth plugins that call external services.
