---
layout: layouts/base.vto
title: Authentication
templateEngine: [vento, md]
prev: { label: 'Fresh UI & design', href: '/web-layer/fresh-ui/' }
next: { label: 'better-auth plugins', href: '/identity-access/better-auth-plugins/' }
order: 1
---

# Authentication

The `auth` plugin adds sign-in, sessions and a typed `/api/v1/auth/*` surface to a workspace. This
page covers its contract, its three backends and how other services trust the sessions it issues.

`netscript plugin install @netscript/plugin-auth` adds an `auth-api` oRPC service that boots on port
**8094** next to your workers, sagas and triggers. The plugin is backend-only: it owns the session
lifecycle, the OAuth/OIDC redirect flow and the REST/RPC surface, and ships no UI. Exactly one
backend is active, chosen by an environment variable, and the service contract is the same whichever
backend runs. The installer pins `jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}` and its
sibling packages to your workspace's NetScript version, so add auth through the CLI instead of
editing imports by hand.

{{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
src: "/assets/diagrams/auth-flow.svg",
alt: "A browser sign-in request enters the auth-api service, which resolves the single active backend from an env var; the kv-oauth backend redirects to the OAuth/OIDC provider, handles the callback, mints a normalized session in Deno KV, sets the __Host-ns_session cookie, and maps the session to a NetScript Principal that downstream services trust.",
caption: "Auth flow: browser → auth-api → resolved backend → provider redirect/callback → session store → __Host-ns_session cookie → Principal."
}) }}

## The port and its adapters

Auth is a port with interchangeable adapters. `@netscript/plugin-auth-core` holds contracts only:
the `AuthBackendPort` and the four sub-ports it composes (provider registry, session store, token
crypto and principal mapper), the normalized `AuthSession` and `Principal` shapes,
`AUTH_SESSION_STATES`, the auth oRPC contract, the config schemas and the stream-event schemas. It
contains no provider SDK code.

Three adapters implement `AuthBackendPort` against a concrete identity provider:
`@netscript/auth-kv-oauth`, `@netscript/auth-workos` and `@netscript/auth-better-auth`.
`@netscript/plugin-auth` selects one of them at boot from `NETSCRIPT_AUTH_BACKEND` and serves it as
the `auth-api` service. Only `kv-oauth` implements the interactive sign-in and callback flow; the
other two verify sessions that something else created. Every backend produces the same `Principal`,
so downstream services authorize the same way whichever provider is wired in.
{{ comp.xref({ key: "explain:auth-model", text: "The authentication model" }) }} explains why auth
is backend-only, what the single-active boundary buys and how `InteractiveFlowPort` gates the
redirect flow.

## Failure modes the contract prevents

A mis-wired sign-in flow still compiles and demos. The contract turns the common wrong turns into
type errors, configuration errors or typed runtime failures:

- **Silent anonymous fallback.** `backend.authenticate()` returns a typed `AuthnResult`, either
  `{ ok: true, principal }` or `{ ok: false, reason }`. It cannot return an anonymous principal.
- **Calling a capability the backend lacks.** Interactive sign-in on a non-interactive backend
  (WorkOS, better-auth) returns a typed `AUTH_PROVIDER_ERROR`, and direct session mutations throw
  `AuthBackendOperationUnsupportedError`. Neither is a no-op that looks like success.
- **Two half-wired providers.** `NETSCRIPT_AUTH_BACKEND` selects exactly one backend, and every
  backend normalizes to the same `Principal`, so authorization code is identical across providers.
- **Hand-rolled session cookies.** The session cookie is `__Host-ns_session`. Browsers refuse a
  `__Host-` cookie with a `Domain`, a non-root `Path` or a plain-HTTP origin, so a misconfiguration
  fails to set instead of weakening the cookie. Serve production over HTTPS.
- **Logging raw subjects.** The audit surface (`createAuthTelemetry`) hashes subjects and strips
  token-bearing claims. It stays a no-op until a salt is configured, because an unsalted hash would
  be worse than nothing.

## Provider presets and custom providers

Pass a provider to `createKvOAuthBackend`; `NETSCRIPT_AUTH_BACKEND` already defaults to `kv-oauth`.
The preset form uses one of the fourteen built-in presets, such as `providers.google({...})`. When
your identity provider is not a preset, define it with `defineOAuthProvider` and pass it to the same
factory.

{{ comp.tabbedCode({ tabs: [
{
label: "Simple — provider preset",
lang: "ts",
code: "// Add the plugin from the workspace root:\n// netscript plugin install @netscript/plugin-auth\n// Default backend is already kv-oauth (NETSCRIPT_AUTH_BACKEND=kv-oauth).\n\nimport { createKvOAuthBackend, getRequiredEnv, providers } from '@netscript/auth-kv-oauth';\n\n// One of 14 presets: github, google, gitlab, discord, slack, spotify,\n// facebook, twitter, auth0, okta, awsCognito, azureAd, logto, clerk.\nexport const backend = await createKvOAuthBackend({\n provider: providers.google({\n clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n }),\n});\n\n// backend.name === 'kv-oauth' — the only adapter with backend.interactive."
},
{
label: "Advanced — explicit provider",
lang: "ts",
code: "// Same factory, but define the OIDC provider yourself when your IdP\n// is not one of the built-in presets.\nimport { createKvOAuthBackend, defineOAuthProvider, getRequiredEnv } from '@netscript/auth-kv-oauth';\n\nconst provider = defineOAuthProvider({\n id: 'my-idp',\n clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n authorizationEndpoint: getRequiredEnv('NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT'),\n tokenEndpoint: getRequiredEnv('NETSCRIPT_AUTH_TOKEN_ENDPOINT'),\n userInfoEndpoint: getRequiredEnv('NETSCRIPT_AUTH_USERINFO_ENDPOINT'),\n redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n scopes: ['openid', 'profile', 'email'],\n});\n\nexport const backend = await createKvOAuthBackend({ provider });"
}
] }) }}

## Sign in, resolve the session, sign out

A front end or typed client drives the REST surface. Sign-in starts the provider redirect, the
provider returns to the callback, the service mints a session and sets the cookie, and later
requests resolve the session from that cookie. The second tab uses the backend port directly in
server code.

{{ comp.tabbedCode({ tabs: [
{
label: "Browser / typed client flow",
lang: "ts",
code: "// app/sign-in.ts — drive the auth-api REST surface from the browser\nconst AUTH = 'http://localhost:8094/api/v1/auth';\n\n// 1. Begin sign-in. The kv-oauth backend responds with a provider redirect;\n// follow it to authenticate with the IdP.\nlocation.href = `${AUTH}/signin`;\n\n// 2. The IdP redirects back to /api/v1/auth/callback, which mints the\n// session and sets the __Host-ns_session cookie automatically.\n\n// 3. Resolve the current session on any later request (cookie is sent\n// automatically; the response is { authenticated, user, session }).\nconst me = await fetch(`${AUTH}/me`, { credentials: 'include' })\n .then((r) => r.json());\nif (me.authenticated) {\n console.log('signed in as', me.user.subject, '— state', me.session.state);\n}\n\n// 4. Sign out — the cookie authenticates the call; it revokes this session and clears the cookie.\nawait fetch(`${AUTH}/signout`, { method: 'POST', credentials: 'include' });"
},
{
label: "Server-side backend port",
lang: "ts",
code: "// server/auth-guard.ts — use the resolved backend directly in app code\nimport { AuthBackendOperationUnsupportedError } from '@netscript/plugin-auth-core/ports';\nimport { backend } from './backend.ts';\n\n// Resolve the current session from an incoming Request via the session store.\nconst session = await backend.sessions.getSession({ request: incoming });\nif (session?.state === 'active') {\n // Map the normalized session to a NetScript Principal for authorization.\n const { principal } = backend.principalMapper.mapSessionToPrincipal(session);\n console.log(principal.subject, principal.scopes, principal.roles);\n}\n\n// Interactive sign-in is optional capability — guard before you call it.\nif (!backend.interactive) {\n throw new AuthBackendOperationUnsupportedError(\n backend.name,\n 'interactive.signIn',\n 'The active backend authenticates sessions only.',\n );\n}\nconst redirect = await backend.interactive.signIn(incoming);"
}
] }) }}

## Core types

Every backend normalizes to two shapes: the `AuthSession` the store persists and the `Principal`
services authorize against. The backend's `principalMapper` maps one to the other, and
`authenticate()` returns an `AuthnResult`. All three are contract-only types from
`@netscript/plugin-auth-core`.

{{ comp.apiTable({
caption: "Principal (@netscript/plugin-auth-core) — the identity services authorize against",
rows: [
{ name: "subject", type: "string", desc: "Stable subject identifier — a user id, service id, or API-key id." },
{ name: "scopes", type: "readonly string[]", desc: "Granted scopes for per-operation RPC/REST permission checks." },
{ name: "roles", type: "readonly string[]", desc: "Granted roles for role-based access checks." },
{ name: "scheme", type: "'api-key' | 'bearer' | 'trusted-header' | 'custom'", desc: "How the principal was established. Auth-plugin backends use 'custom' with the claim bag below." },
{ name: "claims", type: "Readonly<Record<string, unknown>>", desc: "Opaque verified claims — organization/tenant id, session id, provider permissions, or normalized WorkOS/better-auth metadata." }
]
}) }}

{{ comp.apiTable({
caption: "AuthSession (@netscript/plugin-auth-core) — the normalized session the store persists",
rows: [
{ name: "id", type: "string", desc: "Stable session id; the value an opaque session token resolves to." },
{ name: "userId / subject", type: "string", desc: "User id and stable subject the session belongs to." },
{ name: "state", type: "AuthSessionState", desc: "Lifecycle state: 'active' | 'expired' | 'revoked' (from AUTH_SESSION_STATES)." },
{ name: "scopes / roles", type: "readonly string[]", desc: "Scopes and roles carried into the mapped Principal." },
{ name: "claims", type: "Readonly<Record<string, unknown>>", desc: "Verified provider claims preserved on the session." },
{ name: "issuedAt / expiresAt", type: "string (ISO)", desc: "Issue and expiry timestamps; refreshedAt / revokedAt are set on those transitions." },
{ name: "accountId / providerId", type: "string?", desc: "Optional linked provider account and provider id." },
{ name: "traceparent / tracestate", type: "string?", desc: "Optional W3C trace context carried for audit correlation." }
]
}) }}

{{ comp.apiTable({
caption: "AuthnResult (@netscript/plugin-auth-core) — what backend.authenticate() returns",
rows: [
{ name: "{ ok: true, principal }", type: "success", desc: "A resolved Principal; optional responseHeaders and setCookies the service flushes to the client." },
{ name: "{ ok: false, reason }", type: "rejection", desc: "A typed rejection reason — fail-loud, never a silent anonymous principal." }
]
}) }}

## The service surface

The `auth-api` service is built with the `@netscript/service` oRPC builder
(`createService(...).withRPC()`). It mounts a REST surface at `/api/v1/auth/*`, the same operations
over oRPC at `/api/rpc/v1/auth/*`, and the `/health/live` and `/health/ready` probes, with OpenAPI
and docs through `.withOpenAPI()` and `.withDocs()`. The plugin (`AUTH_PLUGIN_ID` `auth`) contributes
it under `AUTH_API_SERVICE_NAME`. `AUTH_API_DEFAULT_PORT` is 8094; scaffolded workspaces allocate
ports from the high range (49152+), so yours will differ.

{{ comp.apiTable({
caption: "auth-api endpoints (REST at /api/v1/auth/_, oRPC at /api/rpc/v1/auth/_)",
rows: [
{ name: "signin", type: "POST", desc: "Begins the interactive sign-in. Requires backend.interactive; on WorkOS / better-auth it returns AUTH_PROVIDER_ERROR (502) because those backends are non-interactive." },
{ name: "callback", type: "POST", desc: "Completes the OAuth/OIDC redirect, mints the session, sets the session cookie. Interactive-only — same non-interactive caveat as signin." },
{ name: "signout", type: "POST", desc: "Ends the caller's own session and clears the cookie. Requires a credential (session cookie or bearer), else 401. sessionId selects another session of the same subject; everywhere: true revokes every session of the subject." },
{ name: "revokeSession", type: "POST", desc: "Operator revocation of any session, at /sessions/revoke. Requires the auth:sessions:revoke scope (403 without it). kv-oauth returns { revoked: false } for a definite unknown id; better-auth and WorkOS return AUTH_PROVIDER_ERROR (502), since revocation by id is unsupported." },
{ name: "session", type: "GET", desc: "Resolves the current AuthSession from the cookie (active | expired | revoked), refreshing on read when policy allows." },
{ name: "me", type: "GET", desc: "Returns { authenticated: true, user, session } when a valid active session exists, or { authenticated: false } (HTTP 200) when there is none." }
]
}) }}

### Signout acts only for the caller

`signout` and `revokeSession` are the only guarded procedures; every other procedure is public
introspection. The service authenticates both in-process against the active backend: a bearer
credential resolves through the session store, otherwise the `__Host-ns_session` cookie does.

- **Ownership.** A `sessionId` must name a session of the caller's subject. An unknown session and
  another subject's session get the same `401 UNAUTHORIZED` body, so signout cannot probe for valid
  session ids.
- **Nothing on refusal.** A refused signout revokes nothing, emits no `auth.session.revoked` event
  and records no `success` outcome.
- **Global logout.** `everywhere: true` revokes every session of the caller's subject and no other
  subject's, through `AuthSessionStorePort.revokeSubjectSessions`. The call does a bounded amount of
  work and never walks the subject's sessions.
  - `kv-oauth` records one revocation instant per subject: any session issued at or before it stops
    resolving as active. That includes sessions stored before this release, so no migration is
    needed.
  - `better-auth` delegates to its own `api.revokeSessions` through the caller's credential.
    NetScript reads every better-auth session from the server-side store; the
    [better-auth page](/identity-access/better-auth-plugins/#revocation-and-the-cookie-cache)
    describes the residual window on better-auth's own endpoints.
  - `workos` atomically persists a local subject fence and a durable cleanup job. Local
    authentication refuses the subject immediately, including still-unexpired access tokens. The
    service-owned worker lists at most 50 upstream sessions per delivery and revokes only the
    caller's sessions created at or before logout. During cleanup it also refuses newly created
    sessions of that subject; they become usable when cleanup succeeds. Failed pages retry
    automatically, with backoff capped at 60 seconds. Storage failures are supervised, and shutdown
    signals drain the worker. Permanent session tombstones stop rotated tokens from reviving an old
    session; they expire only after upstream success plus the longest configured token lifetime and
    clock-skew padding. Other subjects stay usable. See the
    [WorkOS reference](/reference/auth-workos/#subject-wide-revocation) for standalone composition.
- **Operators.** Revoking another subject's session is the separate `revokeSession` procedure,
  gated by the `auth:sessions:revoke` scope on an authenticated backend session. The guard accepts
  backend session credentials only; internal service credentials are not composed into it. The CLI's
  `netscript plugin auth session list` and `session revoke` refuse to run without a credential,
  which they read from `NETSCRIPT_AUTH_TOKEN`.
- **Revocation by id.** kv-oauth supports operator revocation and same-subject sibling selectors; a
  definite missing session returns `{ revoked: false }` from the operator route. better-auth and
  WorkOS cannot revoke by id: they return `AUTH_PROVIDER_ERROR` (502), never a successful "not
  found". On signout, the request credential proves ownership of the caller's own selected session,
  which then gets the same provider error. These adapters cannot prove ownership of a sibling by id,
  so sibling, foreign and unknown selectors all get the same `401`. On better-auth, omit the
  selector and use `everywhere: true` for subject-wide logout.

```ts
// Browser: the session cookie authenticates the call and selects the session to end.
await fetch(`${AUTH}/signout`, { method: 'POST', credentials: 'include' });

// Bearer client: end every session of the caller's subject.
await fetch(`${AUTH}/signout`, {
  method: 'POST',
  headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
  body: JSON.stringify({ everywhere: true }),
});
```

### Signout changes in 0.0.8

> [!WARNING]
> Signout semantics changed in 0.0.8. An anonymous call now gets `401`, a `sessionId` must belong
> to the caller, and `everywhere` revokes all of the caller's sessions.

`SignoutInput` keeps its fields. Up to 0.0.7, signout revoked any `sessionId` it was given, without
a credential, and ignored `everywhere`. To revoke a session you do not own, call `revokeSession`
with a credential holding `auth:sessions:revoke`. Custom implementations must add:

- `AuthSessionStorePort`: `revokeSubjectSessions({ subject, request })`, doing bounded work and
  returning `{ subject, revokedAt }`, or throwing `AuthBackendOperationUnsupportedError`.
- `KvOAuthStore`: `revokeSubject` and `getSubjectRevocation`.
- `BetterAuthInstance`: `api.revokeSessions`.

The CLI's `session list` now needs a credential too.

## The three backends

All three implement `AuthBackendPort`, so the `auth-api` contract is identical across them. They
differ in one capability: whether they expose an interactive sign-in and callback flow. Each ships a
single factory that returns an `AuthBackendPort`.

{{ comp.apiTable({
caption: "Backend adapters: factory, capability, and what each one needs",
rows: [
{ name: "@netscript/auth-kv-oauth", type: "createKvOAuthBackend(options)", desc: "Interactive (default). Full OAuth/OIDC redirect flow, Deno KV session store, real createSession / refreshSession / revokeSession, refresh-on-read (refreshMode / refreshSkewMs), opaque session token, __Host-ns_session cookie, AES-256-GCM token-at-rest. Needs a provider preset or defineOAuthProvider config." },
{ name: "@netscript/auth-workos", type: "createWorkosBackend({ workos, cookiePassword })", desc: "Non-interactive. WorkOS AuthKit sealed sessions, stateless verification. Needs a WorkOS SDK client and a cookie password. signin / callback return AUTH_PROVIDER_ERROR; session mutations throw AuthBackendOperationUnsupportedError." },
{ name: "@netscript/auth-better-auth", type: "createBetterAuthBackend({ auth, sessionTokenSecret })", desc: "Non-interactive. Validates externally-issued sessions via auth.api.getSession over a Prisma store (createNetscriptBetterAuth wires the better-auth Prisma adapter). Needs a better-auth instance and a token secret." }
]
}) }}

> [!IMPORTANT]
> Only `kv-oauth` is interactive. `signin` and `callback` need a backend that implements the
> optional `InteractiveFlowPort` (`signIn`, `handleCallback`, `getSessionId`, `signOut`). On
> `workos` and `better-auth` they return a typed `AUTH_PROVIDER_ERROR` ("does not expose an
> interactive flow"), so use those adapters when WorkOS or an external better-auth deployment
> handles sign-in and NetScript only verifies the session.

> [!NOTE]
> One backend is active per deployment, resolved at startup from `NETSCRIPT_AUTH_BACKEND` or the
> `auth.backend` setting. Multi-backend routing, cross-backend account linking and global session
> revocation across backend stores are not supported, and switching providers means a redeploy with
> new credentials. Route multi-tenant or federated identity upstream, through an identity router or
> an external aggregator.

<!-- caveat: arch-debt:auth-single-active-backend-boundary -->

[Session lifecycles](/identity-access/session-lifecycles/) shows the HTTP wiring for
each backend.

## How auth integrates with services

The auth plugin signs users in and resolves their sessions. A NetScript service gates its own routes
with the separate, provider-agnostic `@netscript/service/auth` seam: `.withAuthn()` resolves a
`Principal` and `.withAuthz()` makes an authorization decision from it. Both layers use the same
`Principal`, so they compose: a service's `.withAuthn({ authenticator })` can trust a backend's
authenticator to turn a request into that `Principal`. By default a service protects `/api` and
leaves `/health` anonymous.

Use the plugin for interactive sign-in, OAuth callbacks and session cookies. Use the service seam
for machine-to-machine and gateway-fronted gating with static credentials, trusted upstream headers
and scope checks, without an interactive identity provider. The two run together.
{{ comp.xref({ key: "cap:services", text: "Services & contracts" }) }} documents the builder seam:
`createStaticCredentialAuthenticator`, `createTrustedHeaderAuthenticator`, `createScopeAuthorizer`
and the preset `defineService(router, { auth: { authn, authz } })` form.

### Verify sessions from another plugin's service

Another plugin's service can trust auth sessions without holding the auth backend.
`createAuthServiceAuthenticator` from `@netscript/plugin-auth/authenticator` returns an
`AuthenticatorPort` that verifies each request's bearer session by calling the `auth` service's
typed `session` procedure, so the guarded service holds no backend instance, no KV handle and no
provider secret. A missing or rejected session returns `401`, an insufficient scope `403` and an
unreachable auth service `503`. The authenticator keeps no principal between requests, so a revoked
session is rejected on its next request.

`netscript plugin new <name>` generates this guard. Background callers (workers, sagas, triggers)
run under a service identity, not an app session, so an API they call over HTTP must accept a
service credential, for example through `createStaticCredentialAuthenticator`.
[Protect a plugin API](/identity-access/how-to/add-authentication/#protect-a-plugin-api) shows the
code and the posture choices.

## Database & runtime events

The plugin contributes a package-provided `auth.prisma` schema with four better-auth-shaped models:
`AuthUser` → `auth_users`, `AuthSession` → `auth_sessions`, `AuthAccount` → `auth_accounts` and
`AuthVerification` → `auth_verifications`. These tables back the better-auth adapter; `kv-oauth`
keeps its sessions in Deno KV, and WorkOS is stateless. better-auth persists through Prisma, so the
tables follow the engine you scaffolded with `--db` (Postgres is recommended; `mysql`, `mssql` and
`sqlite` also work). As with every plugin schema, run the database workflow after Aspire is up; see
[Database migrations](/data-persistence/how-to/database-migration/).

The plugin also emits five durable `auth.*` runtime events through the durable-streams runtime, the
`AUTH_STREAM_EVENT_TYPES`: `auth.signin.started`, `auth.signin.failed`, `auth.token.refreshed`,
`auth.session.revoked` and `auth.oidc.completed`. The `authStreamSchema` entity stream describes the
session projection. See {{ comp.xref({ key: "cap:streams", text: "Durable streams" }) }} for the
streams runtime.

> [!WARNING]
> The `auth.*` events are best-effort, not an audit trail. They are no-ops unless the
> durable-streams service is wired (`DURABLE_STREAMS_URL` or `services__streams__http__0` set).
> Only `oidc.completed`, `token.refreshed` and `session.revoked` write the session projection;
> `signin.started` and `signin.failed` are diagnostic-only.

## Production notes

> [!CAUTION]
> Auth audit is opt-in. `createAuthTelemetry` records structured, redacted audit spans only when a
> `subjectHashSalt` is configured (resolved from `NETSCRIPT_AUTH_AUDIT_SALT`); without a salt it
> records nothing. It is a queryable trail for operational and security review, not a
> tamper-evident, write-once compliance log.

The stream events above complement the audit surface; they do not replace it. See
{{ comp.xref({ key: "explain:observability" }) }} for the audit-trail model and
[Telemetry & logging](/observability/telemetry/) for general tracing and structured logs.

## Next steps

[Add authentication](/identity-access/how-to/add-authentication/) installs the plugin in a workspace
and signs in through the generated app.

- {{ comp.xref({ key: "explain:auth-model", text: "The authentication model" }) }}: why auth is a
  backend-only port.
- [better-auth plugins](/identity-access/better-auth-plugins/): mount better-auth plugins and
  protect a route with the resolved session.
- {{ comp.xref({ key: "ref:plugin-auth" }) }}: the API reference for the auth packages.

{{ comp.nextPrev({ prev: { label: "Fresh UI & design", href: "/web-layer/fresh-ui/" }, next: { label: "better-auth plugins", href: "/identity-access/better-auth-plugins/" } }) }}
