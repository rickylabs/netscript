---
layout: layouts/base.vto
title: Authentication
templateEngine: [vento, md]
prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }
next: null
---

# Authentication

NetScript ships authentication as a first-class official plugin: `netscript plugin add auth`
adds an `auth-api` oRPC service that boots on port **8094** alongside your workers, sagas, and
triggers. The plugin is **pure-backend** — it owns the session lifecycle, OAuth/OIDC redirect
flow, and a stable five-endpoint REST/RPC surface, but it does **not** ship UI. You compose
exactly **one active backend** (single-active-backend), chosen by an environment variable, and
the service exposes the same contract no matter which backend is wired in.

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
sessions and an opaque HMAC session token. To wire it into a workspace step by step, see
<a href="/how-to/add-authentication/">Add authentication</a>; to understand the pure-backend
port model and why only one backend is active, see
<a href="/explanation/auth-model/">The authentication model</a>.
{{ /comp }}

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
    code: "// Add the plugin from the workspace root:\n//   netscript plugin add auth\n// Default backend is already kv-oauth (NETSCRIPT_AUTH_BACKEND=kv-oauth).\n\nimport { createKvOAuthBackend, providers } from '@netscript/auth-kv-oauth';\n\n// One of 14 presets: github, google, gitlab, discord, slack, spotify,\n// facebook, twitter, auth0, okta, awsCognito, azureAd, logto, clerk.\nexport const backend = await createKvOAuthBackend({\n  provider: providers.google({\n    clientId: Deno.env.get('NETSCRIPT_AUTH_CLIENT_ID')!,\n    clientSecret: Deno.env.get('NETSCRIPT_AUTH_CLIENT_SECRET')!,\n    redirectUri: Deno.env.get('NETSCRIPT_AUTH_REDIRECT_URI')!,\n  }),\n});\n\n// backend.name === 'kv-oauth' — the only adapter with backend.interactive."
  },
  {
    label: "Advanced — explicit provider",
    lang: "ts",
    code: "// Same factory, but define the OIDC provider yourself when your IdP\n// is not one of the built-in presets.\nimport { createKvOAuthBackend, defineOAuthProvider } from '@netscript/auth-kv-oauth';\n\nconst provider = defineOAuthProvider({\n  id: 'my-idp',\n  clientId: Deno.env.get('NETSCRIPT_AUTH_CLIENT_ID')!,\n  clientSecret: Deno.env.get('NETSCRIPT_AUTH_CLIENT_SECRET')!,\n  authorizationEndpoint: Deno.env.get('NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT')!,\n  tokenEndpoint: Deno.env.get('NETSCRIPT_AUTH_TOKEN_ENDPOINT')!,\n  userInfoEndpoint: Deno.env.get('NETSCRIPT_AUTH_USERINFO_ENDPOINT')!,\n  redirectUri: Deno.env.get('NETSCRIPT_AUTH_REDIRECT_URI')!,\n  scopes: ['openid', 'profile', 'email'],\n});\n\nexport const backend = await createKvOAuthBackend({ provider });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Alpha specifiers are forward-looking" } }}
The auth packages are published at <code>0.0.1-alpha.0</code>. The scaffold pins
<code>jsr:@netscript/plugin-auth-core@^1.0.0</code> (and siblings) as a <strong>forward-looking</strong>
specifier — those <code>^1.0.0</code> ranges are <strong>not installable today</strong>. Add auth
through <code>netscript plugin add auth</code>, which wires the workspace correctly for the alpha,
rather than hand-adding a <code>^1.0.0</code> import.
{{ /comp }}

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
sign-in/callback flow.

{{ comp.apiTable({
  caption: "Backend adapters and their capabilities",
  rows: [
    { name: "@netscript/auth-kv-oauth", type: "interactive", desc: "The default. Full OAuth/OIDC redirect flow, Deno KV session store, real createSession / refreshSession / revokeSession, refresh-on-read, opaque HMAC-SHA256 session token, __Host-ns_session cookie. 14 provider presets plus defineOAuthProvider." },
    { name: "@netscript/auth-workos", type: "non-interactive", desc: "WorkOS AuthKit. Sealed wos-session cookie, stateless verification. No interactive flow — signin / callback return AUTH_PROVIDER_ERROR; session mutations throw AuthBackendOperationUnsupportedError." },
    { name: "@netscript/auth-better-auth", type: "non-interactive", desc: "better-auth over a Prisma store (the auth.prisma tables). No interactive flow on this adapter; session mutations throw unsupported. Validates externally-issued sessions." }
  ]
}) }}

{{ comp callout { type: "important", title: "Only kv-oauth is interactive" } }}
The <code>signin</code> and <code>callback</code> endpoints require a backend that implements the
optional <code>InteractiveFlowPort</code>. Today that is <strong>only <code>kv-oauth</code></strong>.
On <code>workos</code> and <code>better-auth</code> those two endpoints return a typed
<code>AUTH_PROVIDER_ERROR</code> ("does not expose an interactive flow"), and direct session
mutations throw <code>AuthBackendOperationUnsupportedError</code> — a deliberate, fail-loud
capability boundary rather than a silent no-op. Use those adapters when sign-in is handled by
WorkOS or an external better-auth deployment and NetScript only verifies the resulting session.
{{ /comp }}

## Database & runtime events

The plugin contributes a Prisma schema, `plugins/auth/database/auth.prisma`, with four
better-auth-shaped models — `User` → `auth_users`, `Session` → `auth_sessions`,
`Account` → `auth_accounts`, `Verification` → `auth_verifications`. These tables back the
better-auth adapter; `kv-oauth` keeps its sessions in Deno KV, and WorkOS is stateless. As with
every plugin schema, you bring the tables to life by running the database workflow **after Aspire
is up** — see [Database migrations](/how-to/database-migration/).

The plugin also emits five durable `auth.*` runtime events —
`auth.signin.started`, `auth.signin.failed`, `auth.token.refreshed`, `auth.session.revoked`,
and `auth.oidc.completed` — through the durable-streams runtime.

{{ comp callout { type: "warning", title: "Honest scope: events are best-effort, no audit surface" } }}
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
    { name: "/api/v1/auth/*", type: "REST", desc: "Public REST surface: signin, callback, signout, session, me." },
    { name: "/api/rpc/v1/auth/*", type: "oRPC", desc: "The oRPC surface for the same five operations, for typed NetScript clients." },
    { name: "/health/live", type: "HTTP", desc: "Liveness probe; /health/ready for readiness. OpenAPI + docs served via .withOpenAPI()/.withDocs()." },
    { name: "NETSCRIPT_AUTH_BACKEND", type: "env", desc: "Selects the single active backend: kv-oauth (default) | workos | better-auth." }
  ]
}) }}

## Where to go next

This hub is intentionally thin — the full generated API lives in the reference. Pick the lane
that matches what you're doing.

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
    body: "The oRPC service builder behind auth-api: createService().withRPC(), the contract surface, and the runtime that serves /api/v1/auth/*.",
    href: "/reference/service/",
    icon: "≡"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Fresh UI & design", href: "/capabilities/fresh-ui/" }, next: null }) }}
