---
layout: layouts/base.vto
title: Add auth and a session
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" }
next: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" }
---

# Add auth and a session

You have a running workspace, but anyone can hit it. This chapter gives it an identity layer: you add
the official `auth` plugin, choose an authentication **backend**, run its database migration, and
verify a live **session** through the `auth-api` service on `:8094`. The lesson underneath the steps:
**auth in NetScript is a pluggable backend plus a session** — you pick the backend with one
environment variable, and the contract is identical no matter which one you pick.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A working sign-in surface for `my-workspace/`: the `auth` plugin installed, the interactive
`kv-oauth` backend selected, the `auth.prisma` migration applied, and the `auth-api` service answering
on `:8094`. By the end you can hit `GET /api/v1/auth/session` and `GET /api/v1/auth/me` and watch the
service correctly report "no session yet" before login — proof the backend is composed and the session
endpoints are wired.

## Before you begin

You need the workspace from [chapter 1](/tutorials/workspace/01-scaffold/) with **aspire startning** —
the auth plugin contributes a service and a Prisma schema that Aspire and `netscript db` reach through
the running graph. Confirm the base is up:

```sh
# In my-workspace/, with `aspire start` up in another terminal
curl http://localhost:3001/health   # the workspace service from chapter 1
```

{{ comp callout { type: "important", title: "Aspire is the control plane — start it first" } }}
The <code>auth-api</code> service and its Postgres/KV dependencies are resources in the Aspire graph.
Bring orchestration up <strong>before</strong> any <code>netscript db</code> command or auth endpoint
call: from the project root, <code>cd aspire &amp;&amp; aspire start</code> (dashboard at
<a href="http://localhost:18888">http://localhost:18888</a>). DB commands need aspire startning first.
{{ /comp }}

## Step 1 — Add the `auth` plugin

The `auth` plugin is a first-class official plugin, installed the same way as `workers`, `sagas`, and
`triggers`. From the workspace root:

```sh
netscript plugin add @netscript/plugin-auth
```

This scaffolds the unified `@netscript/plugin-auth` plugin into `plugins/`, registers it, and
contributes three things to your workspace: a Prisma schema (`auth.prisma`), a service entry that
becomes the `auth-api` service, and the `/api/v1/auth/*` routes. Confirm it landed:

```sh
netscript plugin list
```

{{ comp callout { type: "note", title: "One plugin, one active backend" } }}
<code>@netscript/plugin-auth</code> is a thin composition layer. The real authentication logic lives in
a <em>backend adapter</em> — one of <code>@netscript/auth-kv-oauth</code>,
<code>@netscript/auth-workos</code>, or <code>@netscript/auth-better-auth</code>. The plugin selects
<strong>exactly one</strong> active backend at runtime; there is no multi-active routing or
cross-backend account linking in v1. You pick the backend in Step 2.
<!-- caveat: arch-debt:auth-single-active-backend-boundary -->
{{ /comp }}

{{ comp callout { type: "note", title: "Alpha package pins" } }}
The scaffold emits exact alpha specifiers such as
<code>jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}</code>. Add auth through
<code>netscript plugin add @netscript/plugin-auth</code>, which wires the workspace correctly for
the aligned alpha train.
{{ /comp }}

## Step 2 — Choose a backend with `NETSCRIPT_AUTH_BACKEND`

The active backend is selected by the `NETSCRIPT_AUTH_BACKEND` environment variable (or the
`auth.backend` appsettings key). Three backends are valid; the default is **`kv-oauth`**, the only one
that drives an interactive sign-in.

{{ comp.apiTable({
  caption: "Auth backends — capability matrix (NETSCRIPT_AUTH_BACKEND)",
  rows: [
    { name: "kv-oauth", type: "interactive (default)", desc: "Full OAuth/OIDC redirect flow. Real signin + callback, KV-backed sessions with refresh-on-read, signout. The only backend that implements InteractiveFlowPort. Package @netscript/auth-kv-oauth." },
    { name: "workos", type: "non-interactive", desc: "WorkOS AuthKit sealed wos-session cookie. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-workos." },
    { name: "better-auth", type: "non-interactive", desc: "better-auth over Prisma. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-better-auth." }
  ]
}) }}

A team workspace needs users to *log in*, so this track uses the interactive default. Make the choice
explicit in your environment:

```sh
export NETSCRIPT_AUTH_BACKEND=kv-oauth
```

{{ comp callout { type: "warning", title: "Only kv-oauth is interactive — choose accordingly" } }}
The <code>signin</code> and <code>callback</code> endpoints require a backend that implements the
optional <code>InteractiveFlowPort</code>. <strong>Only <code>kv-oauth</code> does.</strong> On
<code>workos</code> and <code>better-auth</code>, <code>POST /api/v1/auth/signin</code> or
<code>POST /api/v1/auth/callback</code> returns a typed <code>AUTH_PROVIDER_ERROR</code> (502) — those
backends are for environments where sign-in already happened elsewhere and you only need NetScript to
<em>validate</em> the session (<code>session</code>/<code>me</code>). To drive the login redirect from
NetScript, stay on <code>kv-oauth</code>.
{{ /comp }}

## Step 3 — Run the auth database migration

The `auth` plugin contributes a Prisma schema, **`plugins/auth/database/auth.prisma`**, that
aggregates into your primary Postgres at `db generate`. With aspire startning, run the standard database
loop from the workspace root:

```sh
netscript db init --name init    # first time only — create the migration
netscript db generate            # generate the Prisma client + Zod schemas
netscript db seed                # optional seed data
netscript db status              # confirm the migration is applied
```

{{ comp callout { type: "note", title: "Which backends actually use these tables" } }}
<code>auth.prisma</code> defines four better-auth-shaped models —
<code>User</code> &rarr; <code>auth_users</code>, <code>Session</code> &rarr; <code>auth_sessions</code>,
<code>Account</code> &rarr; <code>auth_accounts</code>, <code>Verification</code> &rarr;
<code>auth_verifications</code>. The migration runs regardless, but storage differs by backend:
<strong>kv-oauth</strong> keeps sessions in Deno KV (not these tables), <strong>workos</strong> is
effectively stateless (sealed cookie), and <strong>better-auth</strong> is the one that reads/writes
these tables through Prisma.
{{ /comp }}

## Step 4 — Configure the kv-oauth backend

The `kv-oauth` backend needs a real OAuth/OIDC provider (a client id, secret, and redirect URI) plus a
key for the session token at rest. Set these in your environment before starting the service:

```sh
# Selects the interactive backend
export NETSCRIPT_AUTH_BACKEND=kv-oauth

# Provider credentials (e.g. a Google or GitHub OAuth app)
export NETSCRIPT_AUTH_CLIENT_ID=your-client-id
export NETSCRIPT_AUTH_CLIENT_SECRET=your-client-secret
export NETSCRIPT_AUTH_REDIRECT_URI=http://localhost:8094/api/v1/auth/callback

# Required for kv-oauth: missing key material is a startup error
export NETSCRIPT_AUTH_KV_OAUTH_KEY=<base64url-encoded-32-byte-secret>

export PORT=8094
```

{{ comp callout { type: "note", title: "Provider presets fill the OIDC endpoints for you" } }}
You rarely hand-type issuer/authorization/token/userinfo URLs. The <code>kv-oauth</code> package ships
provider presets — <code>github</code>, <code>google</code>, <code>gitlab</code>, <code>discord</code>,
<code>slack</code>, <code>spotify</code>, <code>facebook</code>, <code>twitter</code>, plus
tenant-based <code>auth0</code>, <code>okta</code>, <code>awsCognito</code>, <code>azureAd</code>,
<code>logto</code>, <code>clerk</code> — that encode the correct endpoints. You pass one to
<code>createKvOAuthBackend</code> in Step 5.
{{ /comp }}

## Step 5 — Compose the backend in code

When you wire the backend yourself — for a custom service entry or a test — the interactive `kv-oauth`
backend is one `await` call. You pass a provider preset from `providers.*`, and you get back something
that satisfies the `AuthBackendPort` seam that `@netscript/plugin-auth-core` defines (and, because it
is `kv-oauth`, the optional `InteractiveFlowPort` too):

{{ comp.tabbedCode({ tabs: [
  {
    label: "Compose the kv-oauth backend",
    lang: "ts",
    code: "// services/auth/src/backend.ts\nimport { createKvOAuthBackend, getRequiredEnv, providers } from '@netscript/auth-kv-oauth';\n\n// providers.google(...) is a preset that fills the OIDC endpoints for you.\nexport const backend = await createKvOAuthBackend({\n  provider: providers.google({\n    clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n    clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n    redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n  }),\n});\n\n// backend implements AuthBackendPort AND the optional InteractiveFlowPort,\n// so the auth-api signin + callback endpoints are live on this backend.\nconsole.log(backend.name); // 'kv-oauth'"
  },
  {
    label: "Custom OIDC provider",
    lang: "ts",
    code: "// Same factory, but define the OIDC provider yourself when your IdP is\n// not one of the built-in presets.\nimport { createKvOAuthBackend, defineOAuthProvider, getRequiredEnv } from '@netscript/auth-kv-oauth';\n\nconst provider = defineOAuthProvider({\n  id: 'my-idp',\n  clientId: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_ID'),\n  clientSecret: getRequiredEnv('NETSCRIPT_AUTH_CLIENT_SECRET'),\n  authorizationEndpoint: getRequiredEnv('NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT'),\n  tokenEndpoint: getRequiredEnv('NETSCRIPT_AUTH_TOKEN_ENDPOINT'),\n  userInfoEndpoint: getRequiredEnv('NETSCRIPT_AUTH_USERINFO_ENDPOINT'),\n  redirectUri: getRequiredEnv('NETSCRIPT_AUTH_REDIRECT_URI'),\n  scopes: ['openid', 'profile', 'email'],\n});\n\nexport const backend = await createKvOAuthBackend({ provider });"
  }
] }) }}

The core seam is small and contract-only. `@netscript/plugin-auth-core` defines the
`AuthBackendPort` and the registry helpers that resolve one backend from many — these are the types
the auth plugin composes against, confirmed on the package's public surface:

{{ comp.apiTable({
  caption: "@netscript/plugin-auth-core — the seam the backend satisfies",
  rows: [
    { name: "AuthBackendPort", type: "type", desc: "The contract every backend implements — the auth-api surface is identical across all three backends because they all satisfy this port." },
    { name: "createAuthBackendRegistry / resolveBackend", type: "function", desc: "Build a registry of named backends and resolve the single active one (DEFAULT_AUTH_BACKEND_NAME is the fallback)." },
    { name: "AuthSession", type: "type", desc: "The normalized session the store persists — id, subject, state, scopes, claims, issuedAt / expiresAt." },
    { name: "createHmacSessionTokenCrypto", type: "function", desc: "HMAC-signs the opaque session token so the cookie value cannot be forged." },
    { name: "authContractV1", type: "contract", desc: "The five-route auth contract: signin, signout, callback, session, me." }
  ]
}) }}

## Step 6 — Verify a session

With aspire startning, the `auth-api` service binds **port 8094** and mounts the five auth endpoints
under `/api/v1/auth/*`. On a fresh, unauthenticated request, `session` reports no active session —
which proves the endpoint is wired even before you complete a login:

```sh
# Service is alive
curl http://localhost:8094/health/ready

# No session yet — confirms the endpoint is mounted and reachable
curl http://localhost:8094/api/v1/auth/session

# Identity endpoint: { "authenticated": false } (HTTP 200) before login
curl http://localhost:8094/api/v1/auth/me
```

To exercise the full interactive flow on `kv-oauth`, drive the redirect from a browser: open
`POST /api/v1/auth/signin` (the service issues the provider redirect), authenticate with your
provider, let it call back to `/api/v1/auth/callback`, then re-check the session with the cookie the
flow set:

```sh
# After completing the browser sign-in, the __Host-ns_session cookie is set.
curl -b cookies.txt http://localhost:8094/api/v1/auth/session
curl -b cookies.txt http://localhost:8094/api/v1/auth/me
```

A successful `GET /api/v1/auth/me` after sign-in returns `{ authenticated: true, user, session }`.
That round trip is the proof the backend is composed, the migration is applied, and the provider
credentials are correct.

- [ ] `netscript plugin list` shows the `auth` plugin.
- [ ] `netscript db status` reports the `auth.prisma` migration applied.
- [ ] `NETSCRIPT_AUTH_BACKEND=kv-oauth` and the provider env vars are set.
- [ ] `curl http://localhost:8094/health/ready` succeeds.
- [ ] `curl http://localhost:8094/api/v1/auth/me` returns `{ "authenticated": false }` before login.

{{ comp callout { type: "tip", title: "Local smoke without real credentials" } }}
If provider env is missing, the <code>kv-oauth</code> backend falls back to a non-functional
local-default endpoint set so the service still boots and <code>/health</code>, <code>session</code>,
and <code>me</code> answer. Real <code>signin</code>/<code>callback</code> require genuine provider
credentials — the fallback is a stub path, not a working login.
{{ /comp }}

## What you built

Your workspace now has an identity layer: the `auth` plugin composed onto the interactive `kv-oauth`
backend, the `auth.prisma` migration applied, and the `auth-api` service answering on `:8094` with the
five-route contract. You proved the session endpoints are wired. Next you give the workspace its own
data to protect — a separate database for workspace records.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" }, next: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" } }) }}
</content>
