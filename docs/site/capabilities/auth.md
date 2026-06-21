---
layout: layouts/base.vto
title: Authentication
templateEngine: [vento, md]
prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
next: null
---

# Authentication

NetScript ships authentication as a first-class official plugin: `netscript plugin add @netscript/plugin-auth`
adds an `auth-api` oRPC service that boots on port **8094** alongside your workers, sagas, and
triggers. The plugin is **pure-backend** — it owns the session lifecycle, OAuth/OIDC redirect
flow, and a stable five-endpoint REST/RPC surface, but it does **not** ship UI. You compose
exactly **one active backend** (single-active-backend), chosen by an environment variable, and
the service exposes the same contract no matter which backend is wired in.

{{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({
  src: "/assets/diagrams/auth-flow.svg",
  alt: "A browser sign-in request enters the auth-api service, which resolves the single active backend from an env var; the kv-oauth backend redirects to the OAuth/OIDC provider, handles the callback, mints a normalized session in Deno KV, sets the __Host-ns_session cookie, and maps the session to a NetScript Principal that downstream services trust.",
  caption: "Auth flow: browser → auth-api → resolved backend → provider redirect/callback → session store → __Host-ns_session cookie → Principal."
}) }}

The design follows the framework's contracts-first doctrine: a core seam package
(`@netscript/plugin-auth-core`) defines the `AuthBackendPort`, three interchangeable adapter
packages implement it, and the `@netscript/plugin-auth` plugin composes the selected one into a
running service. Of the three adapters, only the KV-OAuth backend implements the full
**interactive** sign-in/callback flow today; the WorkOS and better-auth adapters are
non-interactive by design.

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for the auth plugin when you need <strong>session-based authentication backed by an OAuth
or OIDC provider</strong> — a typed <code>/api/v1/auth/*</code> surface your services and Fresh
UI can call to sign users in, resolve the current session, and sign out. The default
<code>kv-oauth</code> backend gives you a complete interactive redirect flow with KV-stored
sessions and an opaque HMAC-signed session token. To wire it into a workspace step by step, see
<a href="/how-to/add-authentication/">Add authentication</a>; to understand the pure-backend
port model and why only one backend is active, see
<a href="/explanation/auth-model/">The authentication model</a>.
{{ /comp }}

## What it is

Auth is a **port-and-adapter seam, not a monolith**. The core package
`@netscript/plugin-auth-core` is contract-only: it defines the `AuthBackendPort` (and the four
sub-ports it composes — provider registry, session store, token crypto, and principal mapper),
the normalized `AuthSession` and `Principal` shapes, the `AUTH_SESSION_STATES`, the auth oRPC
contract, the config schemas, and the stream-event schemas. It contains **no provider SDK code**.
Each backend adapter (`@netscript/auth-kv-oauth`, `@netscript/auth-workos`,
`@netscript/auth-better-auth`) implements `AuthBackendPort` against a concrete identity provider,
and the `@netscript/plugin-auth` plugin selects exactly one of them at boot via
`NETSCRIPT_AUTH_BACKEND` and serves it as the `auth-api` service. Because every backend produces
the same `Principal`, downstream services authorize identically regardless of which provider is
wired in. The full rationale — why auth is pure-backend, what the single-active boundary buys you,
and how `InteractiveFlowPort` gates the redirect flow — is in
{{ comp.xref({ key: "explain:auth-model", text: "The authentication model" }) }}.

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Do — Add authentication",
    body: "Task recipe: add the auth plugin, set NETSCRIPT_AUTH_BACKEND, run the auth.prisma migration, and wire kv-oauth with a provider preset.",
    href: "/how-to/add-authentication/",
    icon: "◆"
  },
  {
    title: "Understand — The authentication model",
    body: "Why auth is pure-backend: the AuthBackendPort seam, the single-active-backend boundary, InteractiveFlowPort, and the three adapters' capability matrices.",
    href: "/explanation/auth-model/",
    icon: "✦"
  },
  {
    title: "Compose — Service authn / authz",
    body: "Gate a service's own routes with the provider-agnostic /auth middleware seam — verify a credential or trust a header, complementary to this plugin.",
    href: "/capabilities/services/",
    icon: "→"
  }
] }) }}

## Add it in two shapes

The fastest path is the **provider preset**: add the plugin, set `NETSCRIPT_AUTH_BACKEND`
(it already defaults to `kv-oauth`), and hand a preset like `providers.google({...})` to
`createKvOAuthBackend`. The **advanced** shape uses the same factory but defines a custom OIDC
provider explicitly with `defineOAuthProvider` when your identity provider is not one of the
fourteen built-in presets.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Simple — provider preset",
    lang: "ts",
    code: "// Add the plugin from the workspace root:\n//   netscript plugin add @netscript/plugin-auth\n// Default backend is already kv-oauth (NETSCRIPT_AUTH_BACKEND=kv-oauth).\n\nimport { createKvOAuthBackend, getRequiredEnv, providers } from '@netscript/auth-kv-oauth';\n\n// One of 14 presets: github, google, gitlab, discord, slack, spotify,\n// facebook, twitter, auth0, okta, awsCognito, azureAd, logto, clerk.\nexport const backend = await createKvOAuthBackend({\n  provider: providers.google({\n    clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n    clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n    redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n  }),\n});\n\n// backend.name === 'kv-oauth' — the only adapter with backend.interactive."
  },
  {
    label: "Advanced — explicit provider",
    lang: "ts",
    code: "// Same factory, but define the OIDC provider yourself when your IdP\n// is not one of the built-in presets.\nimport { createKvOAuthBackend, defineOAuthProvider, getRequiredEnv } from '@netscript/auth-kv-oauth';\n\nconst provider = defineOAuthProvider({\n  id: 'my-idp',\n  clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n  clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n  authorizationEndpoint: getRequiredEnv('NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT'),\n  tokenEndpoint: getRequiredEnv('NETSCRIPT_AUTH_TOKEN_ENDPOINT'),\n  userInfoEndpoint: getRequiredEnv('NETSCRIPT_AUTH_USERINFO_ENDPOINT'),\n  redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n  scopes: ['openid', 'profile', 'email'],\n});\n\nexport const backend = await createKvOAuthBackend({ provider });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Alpha specifiers are forward-looking" } }}
The auth packages are published at <code>0.0.1-alpha.0</code>. The scaffold pins
<code>jsr:@netscript/plugin-auth-core@^1.0.0</code> (and siblings) as a <strong>forward-looking</strong>
specifier — those <code>^1.0.0</code> ranges are <strong>not installable today</strong>. Add auth
through <code>netscript plugin add @netscript/plugin-auth</code>, which wires the workspace correctly for the alpha,
rather than hand-adding a <code>^1.0.0</code> import.
{{ /comp }}

## Sign in, resolve the session, sign out

Once the plugin is wired, your front end or a typed client drives the five-endpoint surface. A
sign-in begins the redirect, the provider returns to your callback, the service mints a session
and sets the cookie, and every subsequent request resolves the current session from that cookie.
The snippet below is a copy-ready client flow against the REST surface.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Browser / typed client flow",
    lang: "ts",
    code: "// app/sign-in.ts — drive the auth-api REST surface from the browser\nconst AUTH = 'http://localhost:8094/api/v1/auth';\n\n// 1. Begin sign-in. The kv-oauth backend responds with a provider redirect;\n//    follow it to authenticate with the IdP.\nlocation.href = `${AUTH}/signin`;\n\n// 2. The IdP redirects back to /api/v1/auth/callback, which mints the\n//    session and sets the __Host-ns_session cookie automatically.\n\n// 3. Resolve the current session on any later request (cookie is sent\n//    automatically; the response is { authenticated, user, session }).\nconst me = await fetch(`${AUTH}/me`, { credentials: 'include' })\n  .then((r) => r.json());\nif (me.authenticated) {\n  console.log('signed in as', me.user.subject, '— state', me.session.state);\n}\n\n// 4. Sign out — revokes the session and clears the cookie.\nawait fetch(`${AUTH}/signout`, { method: 'POST', credentials: 'include' });"
  },
  {
    label: "Server-side backend port",
    lang: "ts",
    code: "// server/auth-guard.ts — use the resolved backend directly in app code\nimport { AuthBackendOperationUnsupportedError } from '@netscript/plugin-auth-core/ports';\nimport { backend } from './backend.ts';\n\n// Resolve the current session from an incoming Request via the session store.\nconst session = await backend.sessions.getSession({ request: incoming });\nif (session?.state === 'active') {\n  // Map the normalized session to a NetScript Principal for authorization.\n  const { principal } = backend.principalMapper.mapSessionToPrincipal(session);\n  console.log(principal.subject, principal.scopes, principal.roles);\n}\n\n// Interactive sign-in is optional capability — guard before you call it.\nif (!backend.interactive) {\n  throw new AuthBackendOperationUnsupportedError(\n    backend.name,\n    'interactive.signIn',\n    'The active backend authenticates sessions only.',\n  );\n}\nconst redirect = await backend.interactive.signIn(incoming);"
  }
] }) }}

## Key types first — the core auth contract

Every backend normalizes to the same two shapes the rest of NetScript depends on: an
`AuthSession` (what the store persists) and a `Principal` (what services authorize against). The
`AuthSession` is mapped to a `Principal` by the backend's `principalMapper`, and the
`authenticate()` method on every backend returns an `AuthnResult`. These are the contract-only
types from `@netscript/plugin-auth-core` — confirmed against the live export surface.

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

The plugin's service is named `auth-api` and is built with `@netscript/service`'s oRPC builder
(`createService(...).withRPC()`), not raw Hono. It mounts a public REST surface at
`/api/v1/auth/*` and the equivalent oRPC surface at `/api/rpc/v1/auth/*`, plus standard
`/health/live` and `/health/ready` probes.

{{ comp.apiTable({
  caption: "auth-api endpoints (REST at /api/v1/auth/*, oRPC at /api/rpc/v1/auth/*)",
  rows: [
    { name: "signin", type: "POST", desc: "Begins the interactive sign-in. Requires backend.interactive; on WorkOS / better-auth it returns AUTH_PROVIDER_ERROR (502) because those backends are non-interactive." },
    { name: "callback", type: "POST", desc: "Completes the OAuth/OIDC redirect, mints the session, sets the session cookie. Interactive-only — same non-interactive caveat as signin." },
    { name: "signout", type: "POST", desc: "Revokes the current session and clears the cookie." },
    { name: "session", type: "GET", desc: "Resolves the current AuthSession from the cookie (active | expired | revoked), refreshing on read when policy allows." },
    { name: "me", type: "GET", desc: "Returns { authenticated: true, user, session } when a valid active session exists, or { authenticated: false } (HTTP 200) when there is none." }
  ]
}) }}

{{ comp callout { type: "note", title: "Backend selection is one env var" } }}
The service picks <strong>one</strong> active backend from <code>NETSCRIPT_AUTH_BACKEND</code>
(or appsettings <code>auth.backend</code>): valid values are <code>kv-oauth</code> |
<code>workos</code> | <code>better-auth</code>, defaulting to <strong><code>kv-oauth</code></strong>.
This is the <strong>single-active-backend</strong> boundary — there is no multi-active routing,
cross-backend account linking, or global logout across backends in v1. Switching providers means
changing the env var and the backend's credentials, not running two backends at once.
{{ /comp }}

## The three backends

All three implement the same `AuthBackendPort`, so the `auth-api` contract is identical across
them. They differ in one decisive capability: whether they expose an interactive
sign-in/callback flow. Each ships a single factory that returns an `AuthBackendPort`.

{{ comp.apiTable({
  caption: "Backend adapters: factory, capability, and what each one needs",
  rows: [
    { name: "@netscript/auth-kv-oauth", type: "createKvOAuthBackend(options)", desc: "Interactive (default). Full OAuth/OIDC redirect flow, Deno KV session store, real createSession / refreshSession / revokeSession, refresh-on-read (refreshMode / refreshSkewMs), opaque session token, __Host-ns_session cookie, AES-256-GCM token-at-rest. Needs a provider preset or defineOAuthProvider config." },
    { name: "@netscript/auth-workos", type: "createWorkosBackend({ workos, cookiePassword })", desc: "Non-interactive. WorkOS AuthKit sealed sessions, stateless verification. Needs a WorkOS SDK client and a cookie password. signin / callback return AUTH_PROVIDER_ERROR; session mutations throw AuthBackendOperationUnsupportedError." },
    { name: "@netscript/auth-better-auth", type: "createBetterAuthBackend({ auth, sessionTokenSecret })", desc: "Non-interactive. Validates externally-issued sessions via auth.api.getSession over a Prisma store (createNetscriptBetterAuth wires the better-auth Prisma adapter). Needs a better-auth instance and a token secret." }
  ]
}) }}

{{ comp callout { type: "important", title: "Only kv-oauth is interactive" } }}
The <code>signin</code> and <code>callback</code> endpoints require a backend that implements the
optional <code>InteractiveFlowPort</code> (<code>signIn</code> / <code>handleCallback</code> /
<code>getSessionId</code> / <code>signOut</code>). Today that is <strong>only
<code>kv-oauth</code></strong>. On <code>workos</code> and <code>better-auth</code> those two
endpoints return a typed <code>AUTH_PROVIDER_ERROR</code> ("does not expose an interactive flow"),
and direct session mutations throw <code>AuthBackendOperationUnsupportedError</code> — a
deliberate, fail-loud capability boundary rather than a silent no-op. Use those adapters when
sign-in is handled by WorkOS or an external better-auth deployment and NetScript only verifies the
resulting session.
{{ /comp }}

## How auth integrates with services

The auth **plugin** (this page) signs human users in and resolves their sessions. A
NetScript **service** gates its own routes with the separate, provider-agnostic
`@netscript/service/auth` seam — `.withAuthn()` resolves a `Principal` and `.withAuthz()` makes
an authorization decision from it. Both layers speak the same `Principal` type, so they compose:
the auth plugin establishes identity, and a service's `.withAuthn({ authenticator })` can trust a
backend's authenticator to turn a request into that `Principal`. By default a service protects
`/api` and leaves `/health` anonymous. The full builder seam — `createStaticCredentialAuthenticator`,
`createTrustedHeaderAuthenticator`, `createScopeAuthorizer`, and the preset
`defineService(router, { auth: { authn, authz } })` form — is documented on the services hub.

{{ comp callout { type: "note", title: "Plugin vs. service-auth seam" } }}
The <strong>auth plugin</strong> owns interactive sign-in, OAuth callbacks, and session cookies.
The <strong><a href="/capabilities/services/">service-auth seam</a></strong> is for
machine-to-machine and gateway-fronted gating — static credentials, trusted upstream headers,
scope checks — without an interactive identity provider. They are complementary and can run
together: sign users in with the plugin, then gate individual service routes with
<code>.withAuthn()</code> / <code>.withAuthz()</code>. See
{{ comp.xref({ key: "cap:services", text: "Services & contracts" }) }}.
{{ /comp }}

## Database & runtime events

The plugin contributes a Prisma schema, `plugins/auth/database/auth.prisma`, with four
better-auth-shaped models — `User` → `auth_users`, `Session` → `auth_sessions`,
`Account` → `auth_accounts`, `Verification` → `auth_verifications`. These tables back the
better-auth adapter; `kv-oauth` keeps its sessions in Deno KV, and WorkOS is stateless. As with
every plugin schema, you bring the tables to life by running the database workflow **after Aspire
is up** — see [Database migrations](/how-to/database-migration/).

The plugin also emits five durable `auth.*` runtime events through the durable-streams runtime —
the `AUTH_STREAM_EVENT_TYPES`: `auth.signin.started`, `auth.signin.failed`,
`auth.token.refreshed`, `auth.session.revoked`, and `auth.oidc.completed`. The session projection
is described by the `authStreamSchema` entity stream. For the streams runtime itself see
{{ comp.xref({ key: "cap:streams", text: "Durable streams" }) }}.

{{ comp callout { type: "warning", title: "Scope: events are best-effort, no audit surface" } }}
The <code>auth.*</code> events are <strong>best-effort</strong>: they are no-ops unless the
durable-streams service is wired (<code>DURABLE_STREAMS_URL</code> /
<code>services__streams__http__0</code> set), so they are <strong>not</strong> a guaranteed audit
trail. Only <code>oidc.completed</code>, <code>token.refreshed</code>, and
<code>session.revoked</code> write the session projection; <code>signin.started</code> /
<code>signin.failed</code> are diagnostic-only. There is <strong>no dedicated auth telemetry or
audit-observability surface yet</strong> — do not build dashboards expecting one. For general
tracing and structured logs see <a href="/capabilities/telemetry/">Telemetry &amp; logging</a>.
{{ /comp }}

## Endpoints & ports

{{ comp.apiTable({
  caption: "Authentication runtime surface",
  rows: [
    { name: ":8094", type: "port", desc: "auth-api default port (AUTH_API_DEFAULT_PORT). Family: workers :8091, sagas :8092, triggers :8093, auth :8094." },
    { name: "auth-api", type: "service name", desc: "AUTH_API_SERVICE_NAME — the service contribution the auth plugin (AUTH_PLUGIN_ID 'auth') adds." },
    { name: "/api/v1/auth/*", type: "REST", desc: "Public REST surface: signin, callback, signout, session, me." },
    { name: "/api/rpc/v1/auth/*", type: "oRPC", desc: "The oRPC surface for the same five operations, for typed NetScript clients." },
    { name: "/health/live", type: "HTTP", desc: "Liveness probe; /health/ready for readiness. OpenAPI + docs served via .withOpenAPI()/.withDocs()." },
    { name: "NETSCRIPT_AUTH_BACKEND", type: "env", desc: "Selects the single active backend: kv-oauth (default) | workos | better-auth." }
  ]
}) }}

## Production notes

{{ comp callout { type: "warning", title: "Footguns before you ship" } }}
<ul>
<li><strong>Only <code>kv-oauth</code> signs users in.</strong> If
<code>NETSCRIPT_AUTH_BACKEND</code> is <code>workos</code> or <code>better-auth</code>, the
<code>signin</code> / <code>callback</code> endpoints return <code>AUTH_PROVIDER_ERROR</code> by
design — those adapters only verify externally-issued sessions. Pick the backend that matches who
owns the sign-in.</li>
<li><strong>The session cookie is <code>__Host-ns_session</code>.</strong> The
<code>__Host-</code> prefix <em>requires</em> <code>Path=/</code>, <strong>no Domain</strong>, and
<strong>HTTPS</strong> — a misconfigured domain or a plain-HTTP origin makes the cookie refuse to
set. Use a real TLS origin in production.</li>
<li><strong>Switching providers is an env-var + credentials change, not a runtime toggle.</strong>
There is no multi-active routing, cross-backend account linking, or global logout across backends
in v1 (single-active-backend).</li>
<li><strong>The <code>auth.*</code> stream events are not an audit log.</strong> They are
best-effort and no-op without the durable-streams service wired; there is no dedicated auth
audit-observability surface yet. Do not rely on them for compliance trails.</li>
<li><strong>Run the <code>auth.prisma</code> migration after Aspire is up.</strong> The
better-auth backend's tables (and any DB-backed flow) need Postgres provisioned first — the same
Aspire-first ordering every plugin schema follows.</li>
</ul>
{{ /comp }}

## Reference

This hub is intentionally thin — the auth runtime is a `@netscript/service`, whose full generated
API lives in the reference. The auth plugin packages
(`@netscript/plugin-auth-core`, `@netscript/auth-kv-oauth`, `@netscript/auth-workos`,
`@netscript/auth-better-auth`, `@netscript/plugin-auth`) ship `deno doc`-grade JSDoc on every
export; browse them with `deno doc <package>` until their generated reference pages land.

{{ comp.xref({ key: "ref:service" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Do — Add authentication",
    body: "Task recipe: add the auth plugin, set NETSCRIPT_AUTH_BACKEND, run the auth.prisma migration, and wire kv-oauth with a provider preset.",
    href: "/how-to/add-authentication/",
    icon: "◆"
  },
  {
    title: "Understand — The authentication model",
    body: "Why auth is pure-backend: the AuthBackendPort seam, the single-active-backend boundary, InteractiveFlowPort, and the three adapters' capability matrices.",
    href: "/explanation/auth-model/",
    icon: "✦"
  },
  {
    title: "Look up — @netscript/service reference",
    body: "The oRPC service builder behind auth-api: createService().withRPC(), the contract surface, the /auth authn-authz seam, and the runtime that serves /api/v1/auth/*.",
    href: "/reference/service/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }, next: null }) }}
</content>
</invoke>
