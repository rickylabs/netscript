# @netscript/plugin-auth

NetScript plugin package for unified auth service wiring, backend selection, auth database schema
contribution, scaffold metadata, and durable auth session stream projections.

The auth contract, backend ports, domain types, config schema, and stream payload vocabulary live in
`@netscript/plugin-auth-core`. This package is the operational plugin layer around that core. It
contributes the plugin manifest, starts the auth service resource, provides the Prisma schema
contribution, and exposes browser/server stream entrypoints for auth session state.

## What This Package Owns

- The typed `authPlugin` manifest and plugin inspection helpers.
- The `scaffold.plugin.json` metadata used by the CLI to copy and register the official plugin.
- The auth API service entrypoint on port `8094`.
- The auth-owned Prisma schema contribution in `database/auth.prisma`.
- The V1 oRPC contract export in `./contracts` and service entrypoint in `./services`.
- Browser and server stream entrypoints for the `authSession` entity projection.
- The plugin-owned `verify-plugin.ts` manifest gate.

## Package Boundary

Applications select exactly one active auth backend per app with `NETSCRIPT_AUTH_BACKEND`. The v1
values are `kv-oauth`, `workos`, and `better-auth`.

```bash
NETSCRIPT_AUTH_BACKEND=kv-oauth
NETSCRIPT_AUTH_CLIENT_ID=local-client
NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://issuer.example/oauth/authorize
NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://issuer.example/oauth/token
NETSCRIPT_AUTH_REDIRECT_URI=http://localhost:8094/api/v1/auth/callback
```

The `kv-oauth` backend owns the interactive OAuth/OIDC redirect flow. WorkOS and better-auth are
wired through their backend ports for request/session authentication. Operations a backend does not
expose, such as an interactive sign-in primitive, return typed auth provider errors instead of
pretending all backends have the same feature set.

## Auth API

The service exposes the v1 auth procedures through the REST-style service mount at
`/api/v1/auth/*`, and through oRPC under `/api/rpc/v1/auth/*`:

| Procedure  | Purpose                                                                |
| ---------- | ---------------------------------------------------------------------- |
| `signin`   | Start an interactive sign-in flow when the active backend supports it. |
| `callback` | Complete the provider callback and create or resolve a session.        |
| `signout`  | Revoke the current or supplied session when the backend supports it.   |
| `session`  | Resolve an auth session by id or request context.                      |
| `me`       | Map the current session to the public user response.                   |

```ts
import { inspectAuth } from '@netscript/plugin-auth';

const inspection = inspectAuth();

if (!inspection.axes.includes('services')) {
  throw new Error('auth service contribution is required');
}
```

## Backend Capabilities

| Backend     | Select With                          | Supports                                                                                                                                                                      |
| ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KV OAuth    | `NETSCRIPT_AUTH_BACKEND=kv-oauth`    | OAuth/OIDC sign-in, callback, session creation, session lookup, and signout through KV-backed state.                                                                          |
| WorkOS      | `NETSCRIPT_AUTH_BACKEND=workos`      | WorkOS session authentication through the AS2 backend port. Interactive operations depend on the backend port surface and may report typed unsupported-operation errors.      |
| better-auth | `NETSCRIPT_AUTH_BACKEND=better-auth` | better-auth session authentication through the AS2 backend port. Interactive operations depend on the backend port surface and may report typed unsupported-operation errors. |

OIDC is available through the `kv-oauth` backend. The v1 surface does not support multiple active
backends in the same app, provider fan-out, a global logout/session index, or claim-level OIDC
conformance assertions in the scaffold smoke.

## Streams

The `./streams` subpath is browser-safe and creates a StreamDB for auth sessions. The subscribable
surface is the `authSession` entity projection. It is not an event log, and the auth plugin does not
provide an event-append primitive.

`AuthStreamEvent` payloads describe lifecycle transitions that the service reflects into session
state. `auth.oidc.completed`, `auth.token.refreshed`, and `auth.session.revoked` update the
`authSession` projection. `auth.signin.started` and `auth.signin.failed` are typed lifecycle
payloads for sinks and diagnostics; they do not create session entities.

```ts
import { createAuthStreamDB } from '@netscript/plugin-auth/streams';

const authDb = createAuthStreamDB({ baseUrl: 'http://localhost:4437' });
await authDb.preload();

const sessions = authDb.collections.authSession;
if (!sessions) {
  throw new Error('authSession projection is required');
}

authDb.close();
```

The `./streams/server` subpath exposes best-effort emit helpers used by the auth service. There is
no startup mirror because v1 has no paged session surface and no event-append stream. Existing
sessions are represented when backend operations emit projection updates.

## CLI And Scaffolding

The auth scaffold manifest registers an official `auth` plugin with:

- service key `auth`
- default port `8094`
- database requirement enabled
- KV requirement enabled for the default `kv-oauth` backend
- Prisma contribution at `database/auth.prisma`

The scaffold runtime smoke installs the auth plugin with the first-party plugin set, generates the
plugin registry, type-checks the generated workspace, starts Aspire, and probes the auth service
health/session path.

Generated local-source apps can boot the auth service without provider credentials so health,
`session`, and `me` probes work in the scaffold smoke. Real `signin` and `callback` flows require
the `NETSCRIPT_AUTH_*` provider settings shown above.

## Subpaths

| Subpath            | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `.`                | Curated plugin manifest exports.                  |
| `./public`         | Manifest and inspection surface.                  |
| `./plugin`         | Plugin package contribution aliases.              |
| `./contracts`      | Versioned auth API contract exports.              |
| `./services`       | Auth API service entrypoint.                      |
| `./streams`        | Browser-safe auth session StreamDB factory.       |
| `./streams/server` | Server-side auth session projection emit helpers. |

Root exports stay small by design. Runtime and operational APIs live on subpaths so applications can
import only the layer they need.

## Current Limitations

Auth v1 is intentionally single-active-backend. It does not provide multi-active backend routing,
cross-backend account linking, a global logout index, historical event replay, or a paged session
mirror. The durable streams surface is the current `authSession` projection only.
