---
layout: layouts/base.vto
title: Add authentication
templateEngine: [vento, md]
prev: { label: "Author a plugin", href: "/how-to/author-a-plugin/" }
next: null
---

# Add authentication

**Scope.** This recipe adds sign-in, sessions, and a `/me` identity endpoint to an existing
NetScript workspace by installing the official **`auth`** plugin. You will choose an
authentication backend, run the auth database migration, set the backend's environment, and
verify a live session through the `auth-api` service on **`:8094`**. By the end you have a
working OAuth/OIDC sign-in flow on the default backend (`kv-oauth`) and a clear picture of what
the two non-interactive backends (`workos`, `better-auth`) do and do not provide.

This is the task-oriented companion to the [authentication capability hub](/capabilities/auth/)
(the headline API and endpoint map) and the [authentication model explanation](/explanation/auth-model/)
(why the backend is a pure adapter behind a port). If you want the *why*, read those; if you want
the *how*, stay here.

{{ comp callout { type: "important", title: "Aspire is the control plane — start it first" } }}
The <code>auth-api</code> service and its database/KV dependencies run as resources in the Aspire
graph (the database is Postgres by default; <code>mysql</code> / <code>mssql</code> run as Aspire
containers too, while <code>sqlite</code> is file-backed — pick one at scaffold with <code>--db</code>). Bring orchestration up <strong>before</strong> you run any <code>netscript db</code> command
or hit an auth endpoint: from the project root, <code>cd aspire &amp;&amp; aspire start</code>
(dashboard at <a href="http://localhost:18888">http://localhost:18888</a>). DB commands require
aspire startning first. See <a href="/explanation/aspire/">the Aspire explanation</a> for the resource
graph.
{{ /comp }}

{{ comp callout { type: "note", title: "Alpha package pins" } }}
The CLI scaffold emits exact alpha specifiers such as
<code>jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}</code>. Add the plugin through
<code>netscript plugin add @netscript/plugin-auth</code> so the workspace gets the matching auth
sources, generated registry entries, and Aspire resources together.
{{ /comp }}

## Before you start

You need an existing workspace with a database, because the `kv-oauth` and `better-auth` backends
persist sessions and accounts. The `auth` plugin sets `requiresDb: true` and `requiresKv: true`, so
both a database and KV (Redis) must be in the Aspire graph. The database is polyglot — Postgres is
the recommended default, but `mysql`, `mssql`, or `sqlite` are first-class alternatives selected at
scaffold time with `netscript init --db <engine>`. (Postgres/MySQL/SQL Server run as an Aspire
container resource; SQLite is file-backed with no container.)

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "Workspace", type: "netscript init", desc: "An existing project. If you have none, scaffold one first — see the tutorials." },
    { name: "netscript CLI", type: "on PATH", desc: "Installed globally: deno install --global --allow-all --name netscript jsr:@netscript/cli. Confirm with netscript --help." },
    { name: "Aspire", type: "aspire start", desc: "Postgres + Redis up via the AppHost before any db command or endpoint call (cd aspire && aspire start)." },
    { name: "OAuth credentials", type: "client id / secret", desc: "For the default kv-oauth backend you need a real OAuth/OIDC app (e.g. a Google client id + secret + redirect URI). Without provider env, signin/callback are non-functional stubs." }
  ]
}) }}

Throughout, run commands from your workspace root.

## Step 1 — Add the `auth` plugin

The `auth` plugin is a first-class official plugin installed the same way as `workers`, `sagas`,
`triggers`, and `streams`. Add it with `plugin add`:

```sh
netscript plugin add @netscript/plugin-auth
```

This scaffolds the unified `@netscript/plugin-auth` plugin into your workspace and registers it. The
plugin composes **one active backend** behind the `auth-api` oRPC service and contributes a Prisma
schema (`auth.prisma`), a service entry (`services/src/main.ts`), and the `/api/v1/auth/*` routes.

{{ comp callout { type: "note", title: "One plugin, one active backend" } }}
<code>@netscript/plugin-auth</code> is a thin composition layer. The real authentication logic lives
in a <em>backend adapter</em> — one of <code>@netscript/auth-kv-oauth</code>,
<code>@netscript/auth-workos</code>, or <code>@netscript/auth-better-auth</code>. The plugin selects
<strong>exactly one</strong> active backend at runtime; there is no multi-active routing or
cross-backend account linking in v1. You pick the backend in Step 2.
<!-- caveat: arch-debt:auth-single-active-backend-boundary -->
{{ /comp }}

## Step 2 — Choose a backend with `NETSCRIPT_AUTH_BACKEND`

The active backend is selected by the `NETSCRIPT_AUTH_BACKEND` environment variable (or the
`auth.backend` appsettings key). Three backends are valid; the default is **`kv-oauth`**.

{{ comp.apiTable({
  caption: "Auth backends — capability matrix (NETSCRIPT_AUTH_BACKEND)",
  rows: [
    { name: "kv-oauth", type: "interactive (default)", desc: "Full OAuth/OIDC redirect flow. Real signin + callback, KV-backed sessions with refresh-on-read, signout. The only backend that implements InteractiveFlowPort. Package @netscript/auth-kv-oauth." },
    { name: "workos", type: "non-interactive", desc: "WorkOS AuthKit sealed wos-session cookie. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR (no interactive flow). Package @netscript/auth-workos." },
    { name: "better-auth", type: "non-interactive", desc: "better-auth over Prisma. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-better-auth." }
  ]
}) }}

{{ comp callout { type: "warning", title: "Only kv-oauth is interactive — choose accordingly" } }}
The <code>signin</code> and <code>callback</code> endpoints require a backend that implements the
optional <code>InteractiveFlowPort</code>. <strong>Only <code>kv-oauth</code> does.</strong> On
<code>workos</code> and <code>better-auth</code>, calling <code>POST /api/v1/auth/signin</code> or
<code>POST /api/v1/auth/callback</code> returns a typed <code>AUTH_PROVIDER_ERROR</code> (502)
explaining the backend "does not expose an interactive flow." Those backends are for environments
where sign-in already happened elsewhere and you only need NetScript to <em>validate</em> the session
(<code>session</code>/<code>me</code>). If you need NetScript to drive the login redirect, use
<code>kv-oauth</code>.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

For the rest of this recipe we use the default, `kv-oauth`. You can make the choice explicit in your
environment:

```sh
export NETSCRIPT_AUTH_BACKEND=kv-oauth
```

## Step 3 — Run the auth database migration

The `auth` plugin contributes a Prisma schema, **`plugins/auth/database/auth.prisma`**, which is
aggregated into your project's Postgres schema at `db generate`. It defines four better-auth-shaped
models mapped to these tables:

{{ comp.apiTable({
  caption: "auth.prisma models → Postgres tables",
  rows: [
    { name: "User", type: "auth_users", desc: "Authenticated principals. Populated by backends that persist users (better-auth)." },
    { name: "Session", type: "auth_sessions", desc: "Server-side session records. kv-oauth keeps sessions in KV; this table backs the Prisma-persisting backend." },
    { name: "Account", type: "auth_accounts", desc: "Linked provider accounts (the OAuth/OIDC identities behind a user)." },
    { name: "Verification", type: "auth_verifications", desc: "Verification / challenge records used during account flows." }
  ]
}) }}

{{ comp callout { type: "note", title: "Which backends actually use these tables" } }}
<code>auth.prisma</code> is provisioned for every install so the schema is consistent, but storage
differs by backend: <strong>kv-oauth</strong> stores sessions in Deno KV (not these tables),
<strong>WorkOS</strong> is effectively stateless (sealed cookie), and <strong>better-auth</strong> is
the backend that reads/writes <code>auth_users</code>/<code>auth_sessions</code>/<code>auth_accounts</code>/<code>auth_verifications</code>
through Prisma. The migration runs regardless; it is the persistence path for the Prisma-backed
backend.
{{ /comp }}

With aspire startning (Step 0), generate and apply the migration the same way you do for any plugin
schema:

```sh
netscript db init --name init    # first time only — create the migration
netscript db generate            # generate Prisma client + Zod schemas from the aggregated schema
netscript db seed                # optional seed data
netscript db status              # confirm the migration is applied
```

See [Run a database migration](/how-to/database-migration/) for the full DB workflow and the
Aspire-up dependency.

## Step 4 — Configure the backend environment

Each backend reads its own environment block. For the default `kv-oauth` backend you supply a real
OAuth/OIDC provider (client id, secret, redirect URI) plus optional cookie/KV tuning. Set these in
your `appsettings.json` / environment before starting the service.

{{ comp.tabbedCode({ tabs: [
  {
    label: "kv-oauth (default, interactive)",
    lang: "sh",
    code: "# Selects the interactive OAuth/OIDC backend\nexport NETSCRIPT_AUTH_BACKEND=kv-oauth\n\n# Provider credentials (e.g. a Google OAuth app)\nexport NETSCRIPT_AUTH_CLIENT_ID=your-client-id\nexport NETSCRIPT_AUTH_CLIENT_SECRET=your-client-secret\nexport NETSCRIPT_AUTH_REDIRECT_URI=http://localhost:8094/api/v1/auth/callback\n\n# OIDC discovery / endpoints (preset providers fill these for you)\nexport NETSCRIPT_AUTH_ISSUER=https://accounts.google.com\nexport NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth\nexport NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token\nexport NETSCRIPT_AUTH_USERINFO_ENDPOINT=https://openidconnect.googleapis.com/v1/userinfo\nexport NETSCRIPT_AUTH_SCOPES=openid email profile\n\n# Optional: cookie + KV tuning\nexport NETSCRIPT_AUTH_COOKIE_NAME=__Host-ns_session\nexport NETSCRIPT_AUTH_KV_OAUTH_KEY=<base64url-encoded-32-byte-secret>  # required for kv-oauth: missing key material is a startup error\n# export NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS=false\n\nexport PORT=8094"
  },
  {
    label: "workos (non-interactive)",
    lang: "sh",
    code: "export NETSCRIPT_AUTH_BACKEND=workos\n\nexport WORKOS_API_KEY=sk_...\nexport WORKOS_CLIENT_ID=client_...\nexport WORKOS_COOKIE_PASSWORD=at-least-32-characters-of-entropy\n\n# signin/callback return AUTH_PROVIDER_ERROR on this backend.\n# It validates an existing WorkOS AuthKit session (session/me).\nexport PORT=8094"
  },
  {
    label: "better-auth (non-interactive)",
    lang: "sh",
    code: "export NETSCRIPT_AUTH_BACKEND=better-auth\n\nexport BETTER_AUTH_SECRET=at-least-32-characters-of-entropy\nexport DB_PROVIDER=postgres\n\n# Persists users/sessions/accounts via auth.prisma (Step 3).\n# signin/callback return AUTH_PROVIDER_ERROR — validate-only.\nexport PORT=8094"
  }
] }) }}

{{ comp callout { type: "note", title: "Provider presets fill the OIDC endpoints for you" } }}
You rarely hand-type issuer/authorization/token/userinfo URLs. The <code>kv-oauth</code> package
ships provider presets — <code>github</code>, <code>google</code>, <code>gitlab</code>,
<code>discord</code>, <code>slack</code>, <code>spotify</code>, <code>facebook</code>,
<code>twitter</code>, plus tenant-based <code>auth0</code>, <code>okta</code>,
<code>awsCognito</code>, <code>azureAd</code>, <code>logto</code>, <code>clerk</code> — that encode
the correct endpoints. Pass one to <code>createKvOAuthBackend</code> in Step 5, or call
<code>defineOAuthProvider(...)</code> for a custom provider.
{{ /comp }}

## Step 5 — The kv-oauth happy path (code)

When you compose the backend in code (for a custom service entry, a test, or a non-scaffold wiring),
the interactive `kv-oauth` backend is one `await` call. Pass a provider preset from `providers.*`:

{{ comp.tabbedCode({ tabs: [
  {
    label: "Compose the kv-oauth backend",
    lang: "ts",
    code: "import { createKvOAuthBackend, providers } from \"@netscript/auth-kv-oauth\";\n\n// providers.google(...) is a preset that fills the OIDC endpoints for you.\nconst backend = await createKvOAuthBackend({\n  provider: providers.google({\n    clientId: Deno.env.get(\"NETSCRIPT_AUTH_CLIENT_ID\")!,\n    clientSecret: Deno.env.get(\"NETSCRIPT_AUTH_CLIENT_SECRET\")!,\n    redirectUri: \"http://localhost:8094/api/v1/auth/callback\",\n  }),\n});\n\n// backend implements AuthBackendPort AND the optional InteractiveFlowPort\n// (signIn / handleCallback / getSessionId / signOut), so the auth-api\n// signin + callback endpoints are live on this backend.\nconsole.log(backend.name); // \"kv-oauth\""
  },
  {
    label: "Swap the provider preset",
    lang: "ts",
    code: "import { createKvOAuthBackend, providers } from \"@netscript/auth-kv-oauth\";\n\n// GitHub instead of Google — same shape, different preset.\nconst github = await createKvOAuthBackend({\n  provider: providers.github({\n    clientId: Deno.env.get(\"NETSCRIPT_AUTH_CLIENT_ID\")!,\n    clientSecret: Deno.env.get(\"NETSCRIPT_AUTH_CLIENT_SECRET\")!,\n    redirectUri: \"http://localhost:8094/api/v1/auth/callback\",\n  }),\n});\n\n// Tenant providers (auth0, okta, azureAd, awsCognito, logto, clerk) take\n// a tenant/domain in addition to the client credentials."
  }
] }) }}

The returned `backend` satisfies the `AuthBackendPort` seam that `@netscript/plugin-auth-core`
defines, and — because it is `kv-oauth` — also the optional `InteractiveFlowPort`. That is precisely
what makes `signin` and `callback` work on this backend and fail loud on the other two. For the port
architecture behind this, read [the authentication model](/explanation/auth-model/).

## Step 6 — Start the service and the auth endpoints

With aspire startning, the `auth-api` service binds **port 8094** and mounts five endpoints under the
public REST prefix **`/api/v1/auth/*`** (the oRPC surface is mirrored at `/api/rpc/v1/auth/*`):

{{ comp.apiTable({
  caption: "auth-api endpoints (:8094, /api/v1/auth/*)",
  rows: [
    { name: "POST /api/v1/auth/signin", type: "interactive only", desc: "Begin the OAuth/OIDC redirect flow. Live on kv-oauth; returns AUTH_PROVIDER_ERROR on workos/better-auth." },
    { name: "POST /api/v1/auth/callback", type: "interactive only", desc: "Complete the provider redirect, mint a session. Live on kv-oauth; AUTH_PROVIDER_ERROR on the others." },
    { name: "POST /api/v1/auth/signout", type: "session", desc: "Revoke the current session and clear the session cookie." },
    { name: "GET /api/v1/auth/session", type: "session", desc: "Return the current session if one is present and valid. Works on all backends." },
    { name: "GET /api/v1/auth/me", type: "identity", desc: "Return the authenticated principal (the resolved user). Works on all backends." }
  ]
}) }}

The service also exposes liveness/readiness probes at `/health/live` and `/health/ready`, plus
OpenAPI docs, through the standard `@netscript/service` builder. Watch it come up in the Aspire
dashboard at [http://localhost:18888](http://localhost:18888) under the `auth-api` resource.

## Step 7 — Verify a session

Confirm the service is up and the session endpoint responds. On a fresh, unauthenticated request,
`session` reports no active session — which proves the endpoint is wired even before you complete a
login:

```sh
# Service is alive
curl http://localhost:8094/health/ready

# No session yet — confirms the endpoint is mounted and reachable
curl http://localhost:8094/api/v1/auth/session
```

To exercise the full interactive flow on `kv-oauth`, drive the redirect from a browser: open
`POST /api/v1/auth/signin` (the service issues the provider redirect), authenticate with your
provider, let the provider call back to `/api/v1/auth/callback`, then re-check the session and
identity with the cookie the flow set:

```sh
# After completing the browser sign-in, the session cookie is set.
# Re-checking now returns the active session and the resolved principal:
curl -b cookies.txt http://localhost:8094/api/v1/auth/session
curl -b cookies.txt http://localhost:8094/api/v1/auth/me
```

A successful `GET /api/v1/auth/session` after sign-in returns the active session; `GET /api/v1/auth/me`
returns the authenticated principal. That round trip is the proof the backend is composed, the
migration is applied, and the provider credentials are correct.

{{ comp callout { type: "tip", title: "Local smoke without real credentials" } }}
If provider env is missing, the <code>kv-oauth</code> backend falls back to a non-functional
local-default endpoint set so the service still boots and <code>/health</code>, <code>session</code>,
and <code>me</code> answer. The default is suitable for scaffold smoke tests. Real <code>signin</code>/<code>callback</code>
require genuine provider credentials — the fallback is a stub path, not a working login.
{{ /comp }}

## Production pitfalls

{{ comp callout { type: "warning", title: "Read before you ship authentication" } }}
<ul>
<li><strong>Wrong backend for the job</strong> — <code>signin</code>/<code>callback</code> only work
on <code>kv-oauth</code>. If those endpoints return <code>AUTH_PROVIDER_ERROR</code>, you are on
<code>workos</code> or <code>better-auth</code>, which validate sessions but do not drive the login
redirect. Set <code>NETSCRIPT_AUTH_BACKEND=kv-oauth</code> for an interactive flow.</li>
<li><strong>Single active backend</strong> — there is exactly one backend at a time. No multi-active
routing, cross-backend account linking, global logout, historical replay, or paged session mirror in
v1. Plan your identity model around one provider path.</li>
<li><strong>No auth audit/telemetry surface yet</strong> — there is <strong>no</strong> dedicated
auth audit log or auth-specific telemetry API on main. Do not build dashboards against an auth audit
stream that does not exist; the <code>defaultTelemetry</code> flag is generic OTLP plumbing, not an
auth audit trail.</li>
<li><strong>Alpha package pins</strong> — scaffolded <code>jsr:...</code> imports use exact
<code>{{ releaseSpecifier }}</code> pins. Keep the generated workspace on one aligned NetScript
version.</li>
<li><strong>Provider env is required for real login</strong> — without
<code>NETSCRIPT_AUTH_CLIENT_ID</code>/<code>SECRET</code>/<code>REDIRECT_URI</code> the
<code>kv-oauth</code> backend boots into a stub fallback; <code>session</code>/<code>me</code> answer
but no real sign-in is possible.</li>
<li><strong>Aspire down</strong> — a 404 on <code>:8094</code> or a DB error during
<code>netscript db</code> almost always means orchestration is not running. <code>cd aspire &amp;&amp;
aspire start</code> first.</li>
</ul>
{{ /comp }}

## See also

<div class="ns-card-grid">

{{ comp.card({
  title: "Authentication capability",
  body: "The auth-api service, the five endpoints, and the three-backend capability matrix in one hub.",
  href: "/capabilities/auth/",
  icon: "◆"
}) }}

{{ comp.card({
  title: "The authentication model",
  body: "Why the backend is a pure adapter behind AuthBackendPort, and how the plugin composes one active backend.",
  href: "/explanation/auth-model/",
  icon: "▣"
}) }}

{{ comp.card({
  title: "service reference",
  body: "The @netscript/service builder that auth-api is built on — RPC mount, health, OpenAPI, service info.",
  href: "/reference/service/",
  icon: "§"
}) }}

{{ comp.card({
  title: "Run a database migration",
  body: "The full db init / generate / seed / status workflow that applies auth.prisma.",
  href: "/how-to/database-migration/",
  icon: "+"
}) }}

</div>
