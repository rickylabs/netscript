---
layout: layouts/base.vto
title: Add auth and a session
templateEngine: [vento, md]
prev: { label: '1 · Scaffold', href: '/tutorials/workspace/01-scaffold/' }
next: { label: '3 · Workspace data', href: '/tutorials/workspace/03-workspace-data/' }
---

# Add auth and a session

In this chapter you give `my-workspace/` an identity layer: you add the official `auth` plugin,
choose an authentication **backend**, run its database migration, and check the **session**
endpoints of the `auth-api` service at the URL Aspire prints. You select the backend with one environment
variable, and the contract is identical for every backend, so switching providers later is a
configuration change.

{{ comp.learningPath({ steps: [
{ label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
{ label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
{ label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
{ label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
{ label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
{ label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

The `auth` plugin installed, the interactive `kv-oauth` backend selected, the `auth.prisma`
migration applied, and the `auth-api` service answering at the URL Aspire prints. At the end,
`GET /api/v1/auth/session` and `GET /api/v1/auth/me` report "no session yet" before login, which
proves the backend is composed and the session endpoints are wired.

## Before you begin

You need the workspace from [chapter 1](/tutorials/workspace/01-scaffold/) with **`aspire start`
running**: the auth plugin contributes a service and a Prisma schema that Aspire and `netscript db`
reach through the running graph. Check that the base is up:

```sh
# In my-workspace/, with `aspire start` up in another terminal
netscript service list
netscript plugin doctor
```

## Step 1 — Add the `auth` plugin

The `auth` plugin is an official plugin, installed the same way as `workers`, `sagas` and
`triggers`. From the workspace root:

```sh
netscript plugin install @netscript/plugin-auth
```

The installer scaffolds `@netscript/plugin-auth` into `plugins/`, registers it, and adds three
things to your workspace: a Prisma schema (`auth.prisma`), a service entry that becomes the
`auth-api` service, and the `/api/v1/auth/*` routes. Confirm it landed:

```sh
netscript plugin list
```

Aspire allocates the service endpoint. Use the URL Aspire prints or `list_api_services` to find
`auth-api`. The app's generated BFF owns the browser callback, so register
`<app-origin>/auth/callback` with the provider. Use the app URL Aspire reports; update both the
provider registration and the configured redirect URI if that URL changes. A fixed external
callback origin is a deployment choice, not a framework port default.

{{ comp callout { type: "note", title: "Single Active Backend Design Boundary" } }}
The <code>@netscript/plugin-auth</code> plugin composes a single active backend adapter at runtime, configured with <code>NETSCRIPT_AUTH_BACKEND</code>. Running several backends at once, or linking accounts across them, is not supported: one active backend keeps session verification simple and predictable. This tutorial configures one provider; in production, you switch providers at the environment level, not through runtime routing.

<!-- caveat: arch-debt:auth-single-active-backend-boundary -->

{{ /comp }}

## Step 2 — Choose a backend with `NETSCRIPT_AUTH_BACKEND`

The `NETSCRIPT_AUTH_BACKEND` environment variable (or the `auth.backend` appsettings key) selects the
active backend. Three backends are valid. The default, **`kv-oauth`**, is the only one that drives
an interactive sign-in.

{{ comp.apiTable({
caption: "Auth backends — capability matrix (NETSCRIPT_AUTH_BACKEND)",
rows: [
{ name: "kv-oauth", type: "interactive (default)", desc: "Full OAuth/OIDC redirect flow. Real signin + callback, KV-backed sessions with refresh-on-read, signout. The only backend that implements InteractiveFlowPort. Package @netscript/auth-kv-oauth." },
{ name: "workos", type: "non-interactive", desc: "WorkOS AuthKit sealed cookie under NETSCRIPT_AUTH_COOKIE_NAME (default __Host-ns_session). The CLI WorkOS preset explicitly selects wos-session to match AuthKit. Subject-wide logout uses a durable KV fence and background upstream cleanup. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-workos." },
{ name: "better-auth", type: "non-interactive", desc: "better-auth over Prisma. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-better-auth." }
]
}) }}

A team workspace needs users to _log in_, so this track uses the interactive default. Make the
choice explicit in your environment:

```sh
export NETSCRIPT_AUTH_BACKEND=kv-oauth
```

{{ comp callout { type: "warning", title: "Only kv-oauth is interactive" } }}
The <code>signin</code> and <code>callback</code> endpoints need a backend that implements the
optional <code>InteractiveFlowPort</code>, and <strong>only <code>kv-oauth</code> does</strong>. On
<code>workos</code> and <code>better-auth</code>, <code>POST /api/v1/auth/signin</code> and
<code>POST /api/v1/auth/callback</code> return a typed <code>AUTH_PROVIDER_ERROR</code> (502). Those
backends are for environments where sign-in happened elsewhere and NetScript only
<em>validates</em> the session (<code>session</code>/<code>me</code>). To drive the login redirect
from NetScript, stay on <code>kv-oauth</code>.
{{ /comp }}

## Step 3 — Run the auth database migration

The `auth` plugin contributes a package-provided **`auth.prisma`** schema that aggregates into your
primary Postgres at `db generate`. With Aspire running, run the database commands from the workspace
root:

```sh
netscript db init --name init    # first time only — create the migration
netscript db generate            # generate the Prisma client + Zod schemas
netscript db seed                # optional seed data
netscript db status              # confirm the migration is applied
```

{{ comp callout { type: "note", title: "Which backends use these tables" } }}
<code>auth.prisma</code> defines four better-auth-shaped models: <code>AuthUser</code> &rarr;
<code>auth_users</code>, <code>AuthSession</code> &rarr; <code>auth_sessions</code>,
<code>AuthAccount</code> &rarr; <code>auth_accounts</code> and <code>AuthVerification</code> &rarr;
<code>auth_verifications</code>. The migration always runs, but storage differs by backend:
<strong>kv-oauth</strong> keeps sessions in Deno KV, <strong>workos</strong> verifies a sealed cookie and keeps durable revocation fences in KV, and <strong>better-auth</strong> reads and writes these tables through
Prisma.
{{ /comp }}

## Step 4 — Configure the kv-oauth backend

The `kv-oauth` backend needs a real OAuth/OIDC provider (a client id, a secret and a redirect URI)
and a key that protects the session token at rest. Set them before you start the service:

```sh
# Selects the interactive backend
export NETSCRIPT_AUTH_BACKEND=kv-oauth

# Provider credentials (e.g. a Google or GitHub OAuth app)
export NETSCRIPT_AUTH_CLIENT_ID=your-client-id
export NETSCRIPT_AUTH_CLIENT_SECRET=your-client-secret
export NETSCRIPT_AUTH_REDIRECT_URI="$APP_URL/auth/callback"

# Required for kv-oauth: missing key material is a startup error
export NETSCRIPT_AUTH_KV_OAUTH_KEY=<base64url-encoded-32-byte-secret>
```

Set `APP_URL` to the app URL Aspire prints. Under Aspire, the AppHost injects the listener's
`PORT`; there is no fixed auth service port to export.

{{ comp callout { type: "note", title: "Provider presets fill in the OIDC endpoints" } }}
You rarely type issuer, authorization, token or userinfo URLs. The <code>kv-oauth</code> package
ships provider presets with the correct endpoints: <code>github</code>, <code>google</code>,
<code>gitlab</code>, <code>discord</code>, <code>slack</code>, <code>spotify</code>,
<code>facebook</code>, <code>twitter</code>, and the tenant-based <code>auth0</code>,
<code>okta</code>, <code>awsCognito</code>, <code>azureAd</code>, <code>logto</code> and
<code>clerk</code>. You pass one to <code>createKvOAuthBackend</code> in Step 5.
{{ /comp }}

## Step 5 — Compose the backend in code

When you wire the backend yourself, for a custom service entry or a test, the interactive `kv-oauth`
backend is one `await` call. You pass a provider preset from `providers.*` and get back an object
that satisfies the `AuthBackendPort` seam defined by `@netscript/plugin-auth-core` (and, because it
is `kv-oauth`, the optional `InteractiveFlowPort`):

{{ comp.tabbedCode({ tabs: [
{
label: "Compose the kv-oauth backend",
lang: "ts",
code: "// services/auth/src/backend.ts\nimport { createKvOAuthBackend, getRequiredEnv, providers } from '@netscript/auth-kv-oauth';\n\n// providers.google(...) is a preset that fills the OIDC endpoints for you.\nexport const backend = await createKvOAuthBackend({\n provider: providers.google({\n clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n }),\n});\n\n// backend implements AuthBackendPort AND the optional InteractiveFlowPort,\n// so the auth-api signin + callback endpoints are live on this backend.\nconsole.log(backend.name); // 'kv-oauth'"
},
{
label: "Custom OIDC provider",
lang: "ts",
code: "// Same factory, but define the OIDC provider yourself when your IdP is\n// not one of the built-in presets.\nimport { createKvOAuthBackend, defineOAuthProvider, getRequiredEnv } from '@netscript/auth-kv-oauth';\n\nconst provider = defineOAuthProvider({\n id: 'my-idp',\n clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n authorizationEndpoint: getRequiredEnv('NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT'),\n tokenEndpoint: getRequiredEnv('NETSCRIPT_AUTH_TOKEN_ENDPOINT'),\n userInfoEndpoint: getRequiredEnv('NETSCRIPT_AUTH_USERINFO_ENDPOINT'),\n redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n scopes: ['openid', 'profile', 'email'],\n});\n\nexport const backend = await createKvOAuthBackend({ provider });"
}
] }) }}

`@netscript/plugin-auth-core` defines the seam the auth plugin composes against: the
`AuthBackendPort` contract and the registry helpers that resolve one backend from many.

{{ comp.apiTable({
caption: "@netscript/plugin-auth-core — the seam the backend satisfies",
rows: [
{ name: "AuthBackendPort", type: "type", desc: "The contract every backend implements — the auth-api surface is identical across all three backends because they all satisfy this port." },
{ name: "createAuthBackendRegistry / resolveBackend", type: "function", desc: "Build a registry of named backends and resolve the single active one (DEFAULT_AUTH_BACKEND_NAME is the fallback)." },
{ name: "AuthSession", type: "type", desc: "The normalized session the store persists — id, subject, state, scopes, claims, issuedAt / expiresAt." },
{ name: "createHmacSessionTokenCrypto", type: "function", desc: "HMAC-signs the opaque session token so the cookie value cannot be forged." },
{ name: "authContractV1", type: "contract", desc: "The six-route auth contract: signin, signout, revokeSession, callback, session, me." }
]
}) }}

## Step 6 — Verify a session through the app

The auth contract has six operations: `signin`, `signout`, `revokeSession`, `callback`, `session`
and `me`. Inspect the live service with `list_api_services` → `list_service_operations` →
`get_operation_schema`, selecting the `auth-api` resource and its actual operation identifiers.

Open the generated Fresh app at the URL Aspire prints. Visit `/auth/signin`; the app routes the
provider's callback through `/auth/callback` and keeps the session cookie on its own origin.
`/auth/session` reports the redacted session state. Before login it reports no active session;
after login it reports the authenticated principal.

Server-side loaders call services with `createBrowserSessionClient` from the generated
`auth/bff.ts`, passing `browserSessionContext(request)` for each incoming request. Keep the bearer
on the server; chapter 5 uses that client for the guarded workspace operation.

```sh
netscript plugin doctor
netscript contract list
deno task check
```

- [ ] `auth-api` is healthy at its allocated endpoint in Aspire.
- [ ] MCP discovery lists all six auth operations.
- [ ] The generated app's `/auth/session` reports no session before login.
- [ ] The provider returns through the app callback and the session becomes authenticated.
- [ ] `deno task check` passes.

For HTTP cookie-jar diagnostics outside the app, follow the
[auth recipe](/identity-access/how-to/add-authentication/#direct-auth-service-diagnostics).

## What you built

An identity layer for your workspace: the `auth` plugin composed onto the interactive `kv-oauth`
backend, the `auth.prisma` migration applied, and the `auth-api` service answering at the URL Aspire prints with
the six-route contract. The app can now tell a signed-in team member from a stranger. Next, you give
it something to protect: an isolated database for team records.
