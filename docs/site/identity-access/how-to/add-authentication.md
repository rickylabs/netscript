---
layout: layouts/base.vto
title: Add authentication
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-authentication/
---

# Add authentication

**Scope.** This recipe adds sign-in, sessions, and a `/me` identity endpoint to an existing
NetScript workspace by installing the official **`auth`** plugin. You will choose an
authentication backend, set the backend's environment, run the auth database migration, and
verify a live session through the generated Fresh app on its Aspire-discovered origin. By the end you have a
working OAuth/OIDC sign-in flow on the default backend (`kv-oauth`) and a clear picture of what
the two non-interactive backends (`workos`, `better-auth`) do and do not provide.

This is the task-oriented companion to the [authentication capability hub](/capabilities/auth/)
(the headline API and endpoint map) and the [authentication model explanation](/explanation/auth-model/)
(why the backend is a pure adapter behind a port). If you want the *why*, read those; if you want
the *how*, stay here.

{{ comp callout { type: "important", title: "Aspire is the control plane — configure it before starting" } }}
The <code>auth-api</code> service and its database/KV dependencies run as resources in the Aspire
graph (the database is Postgres, the recommended engine; <code>mysql</code> / <code>mssql</code> run as Aspire
containers too, while <code>sqlite</code> is file-backed — pick one at scaffold with <code>--db</code>). Bring orchestration up <strong>before</strong> you run any <code>netscript db</code> command
or hit an auth endpoint, after configuring and exporting the provider environment in Step 3. Start
the AppHost in Step 4 (dashboard at <a href="https://localhost:18888">https://localhost:18888</a>). DB commands require
Aspire running first. See <a href="/explanation/aspire/">the Aspire explanation</a> for the resource
graph.
{{ /comp }}

{{ comp callout { type: "note", title: "Alpha package pins" } }}
The CLI scaffold emits exact alpha specifiers such as
<code>jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}</code>. Add the plugin through
<code>netscript plugin install @netscript/plugin-auth</code> so the workspace gets the matching auth
dependency, generated glue, registry entries, and Aspire resources together.
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
    { name: "netscript CLI", type: "on PATH", desc: "Installed globally: deno install --global --allow-all --name netscript jsr:@netscript/cli" + releaseSpecifier + ". Confirm with netscript --help." },
    { name: "Aspire", type: "aspire start", desc: "Configure/export auth environment, then start the AppHost before any db command or endpoint call." },
    { name: "OAuth credentials", type: "client id / secret", desc: "For the default kv-oauth backend you need a real OAuth/OIDC app (e.g. a Google client id + secret + redirect URI). Without provider env, signin/callback are non-functional stubs." }
  ]
}) }}

Throughout, run commands from your workspace root.

## Step 1 — Add the `auth` plugin

The `auth` plugin is a first-class official plugin installed the same way as `workers`, `sagas`,
`triggers`, and `streams`. Add it with `plugin install`:

```sh
netscript plugin install @netscript/plugin-auth
```

This installs the unified `@netscript/plugin-auth` dependency, emits the user-owned `auth/mod.ts`
glue barrel, and registers it. The plugin package composes **one active backend** behind the
`auth-api` oRPC service and contributes the Prisma schema (`auth.prisma`), service entry, and
`/api/v1/auth/*` routes.

{{ comp callout { type: "note", title: "Single Active Backend Design Boundary" } }}
<code>@netscript/plugin-auth</code> is designed as a single-backend runtime composition layer. The active implementation (selected from <code>@netscript/auth-kv-oauth</code>, <code>@netscript/auth-workos</code>, or <code>@netscript/auth-better-auth</code>) is resolved statically at startup. This boundary ensures session isolation and keeps the validation path predictable, meaning that multi-active routing, cross-backend account linking, and global multi-store logout are not supported in the core runtime. Complex multi-tenant scenarios must be coordinated via an upstream identity router or external identity aggregator.
<!-- caveat: arch-debt:auth-single-active-backend-boundary -->
{{ /comp }}

## Step 2 — Choose a backend with the auth CLI

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

{{ comp callout { type: "important", title: "Interactive Authentication Boundary" } }}
Only the <code>kv-oauth</code> backend implements the <code>InteractiveFlowPort</code> required to drive login redirects directly via NetScript's <code>signin</code> and <code>callback</code> endpoints. Under <code>workos</code> and <code>better-auth</code>, these routes intentionally return a <code>AUTH_PROVIDER_ERROR</code> (502). This boundary exists because these backends are designed for external verification models where authentication is completed by a frontend client or parent application. In this architecture, you must initiate the authentication flow using the provider's direct SDK or login page, using NetScript to validate the resulting session tokens. Implementing a native <code>InteractiveFlowPort</code> for <code>better-auth</code> is tracked under roadmap item R2.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

For the rest of this recipe we use `kv-oauth`. Persist the choice in the workspace boot seam and
confirm what the service will use:

```sh
netscript plugin auth backend set kv-oauth
netscript plugin auth backend show
netscript plugin doctor
```

The command reconciles `NETSCRIPT_AUTH_BACKEND` in the project `.env` and the canonical plugin
selector in appsettings. Export the environment before starting the AppHost, as shown in Step 3. Directly setting the environment variable or the
`auth.backend` / `Auth.Backend` appsettings key remains an escape hatch for deployment systems that
own configuration externally.

## Step 3 — Configure the provider and secrets

Each backend reads its own environment block. The auth CLI owns the normal setup path and writes the
same project `.env` seam as Step 2. For GitHub on `kv-oauth`:

```sh
# Your credential source exports NETSCRIPT_AUTH_CLIENT_SECRET.
# Keep generated encryption material in the process environment too.
export NETSCRIPT_AUTH_KV_OAUTH_KEY="$(netscript plugin auth secret generate kv-oauth-key)"
netscript plugin auth provider set \
  --preset github \
  --client-id "$NETSCRIPT_AUTH_CLIENT_ID" \
  --redirect-uri "$NETSCRIPT_AUTH_REDIRECT_URI"

set -a
. ./.env
set +a
```

GitHub is OAuth 2.0, so the preset emits no `NETSCRIPT_AUTH_ISSUER` and ignores `--issuer`.
The CLI prints a notice when `--issuer` is ignored. Re-running the command removes an issuer saved
by an older preset. The runtime also ignores an issuer inherited from an old shell or deployment
when `NETSCRIPT_AUTH_PROVIDER_ID=github`. GitHub does not serve an OIDC
discovery document; sign-in uses these explicit endpoints and derives the stable subject
`github:<id>` from userinfo instead:

```dotenv
NETSCRIPT_AUTH_PROVIDER_ID=github
NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://github.com/login/oauth/authorize
NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://github.com/login/oauth/access_token
NETSCRIPT_AUTH_USERINFO_ENDPOINT=https://api.github.com/user
NETSCRIPT_AUTH_SCOPES=read:user user:email
```

Provider credentials and settings are written only to the project `.env`, which must stay outside
version control. Tracked appsettings receives the non-secret backend selector; reconciliation prunes
legacy credential copies and retains unrelated benign environment settings. Aspire refuses declared
credential-shaped keys as source literals, so generated helpers do not carry their values. Earlier
provider configuration copied credentials into tracked files; remove those copies and rotate any
credential that was committed.

Generated auth assignments are POSIX shell literals. Source and export the file before starting
Aspire so its executable resources inherit the exact values. Apostrophes, substitutions, backticks,
backslashes and embedded newlines remain data. Deno's direct `--env-file` loader accepts simple
quoted values and scopes but does not implement all POSIX quoting; for hostile values, use the
source/export path above. Provider credential environment bindings avoid putting secrets in CLI
arguments. Explicit credential flags remain supported for compatibility.

Tenant presets such as `okta`, `auth0`, `azure-ad`, `aws-cognito`, `logto`, and `clerk` additionally
accept `--issuer`. The non-interactive variants use their boot-native credential names:

```sh
# Your credential source exports WORKOS_API_KEY and WORKOS_COOKIE_PASSWORD.
netscript plugin auth provider set --preset workos --client-id "$WORKOS_CLIENT_ID"

export BETTER_AUTH_SECRET="$(netscript plugin auth secret generate better-auth)"
netscript plugin auth provider set --preset better-auth
```


The explicit exports below are the escape hatch for CI/deployment systems that inject environment
variables themselves. Ordinary workspace setup uses the source/export step above.

{{ comp.tabbedCode({ tabs: [
  {
    label: "kv-oauth (default, interactive)",
    lang: "sh",
    code: "# Selects the interactive OAuth/OIDC backend\nexport NETSCRIPT_AUTH_BACKEND=kv-oauth\n\n# Provider credentials (e.g. a Google OAuth app)\nexport NETSCRIPT_AUTH_CLIENT_ID=your-client-id\nexport NETSCRIPT_AUTH_CLIENT_SECRET=your-client-secret\nexport NETSCRIPT_AUTH_REDIRECT_URI=http://localhost:8094/api/v1/auth/callback\n\n# OIDC discovery / endpoints (preset providers fill these for you)\nexport NETSCRIPT_AUTH_ISSUER=https://accounts.google.com\nexport NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth\nexport NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token\nexport NETSCRIPT_AUTH_USERINFO_ENDPOINT=https://openidconnect.googleapis.com/v1/userinfo\nexport NETSCRIPT_AUTH_SCOPES=openid email profile\n\n# Stable subject: OIDC providers use the ID-token sub. A preset named by\n# NETSCRIPT_AUTH_PROVIDER_ID supplies its own default (github: userinfo id).\n# export NETSCRIPT_AUTH_SUBJECT_SOURCE=userinfo  # id_token | userinfo\n# export NETSCRIPT_AUTH_SUBJECT_CLAIM=id\n\n# Optional: cookie + KV tuning\nexport NETSCRIPT_AUTH_COOKIE_NAME=__Host-ns_session\nexport NETSCRIPT_AUTH_KV_OAUTH_KEY=<base64url-encoded-32-byte-secret>  # required for kv-oauth: missing key material is a startup error\n# export NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS=false\n\nexport PORT=8094"
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

## Step 4 — Start Aspire and run the auth database migration

The `auth` plugin contributes a package-provided **`auth.prisma`** schema, which is
aggregated into your project's database schema at `db generate` (Postgres is the recommended engine; or `mysql` /
`mssql` / `sqlite` — the auth models persist through Prisma, so they follow whichever engine you
scaffolded with `--db`). It defines four better-auth-shaped models mapped to these tables:

{{ comp.apiTable({
  caption: "auth.prisma models → your database tables",
  rows: [
    { name: "AuthUser", type: "auth_users", desc: "Authenticated principals. Populated by backends that persist users (better-auth)." },
    { name: "AuthSession", type: "auth_sessions", desc: "Server-side session records. kv-oauth keeps sessions in KV; this table backs the Prisma-persisting backend." },
    { name: "AuthAccount", type: "auth_accounts", desc: "Linked provider accounts (the OAuth/OIDC identities behind a user)." },
    { name: "AuthVerification", type: "auth_verifications", desc: "Verification / challenge records used during account flows." }
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

After Step 3 has configured and exported the provider environment, start Aspire from the workspace
root:

```sh
(cd aspire && aspire start)
```

If an AppHost was already running, stop it with `(cd aspire && aspire stop)` before this start
command so its replacement inherits the exported values.

The dashboard is at <https://localhost:18888>. With Aspire running, generate and apply the migration
the same way you do for any plugin schema:

```sh
netscript db init --name init    # first time only — create the migration
netscript db generate            # generate Prisma client + Zod schemas from the aggregated schema
netscript db seed                # optional seed data
netscript db status              # confirm the migration is applied
```

See [Run a database migration](/data-persistence/how-to/database-migration/) for the full DB workflow and the
Aspire-up dependency.

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

With Aspire running, the `auth-api` service binds **port 8094** and mounts five endpoints under the
public REST prefix **`/api/v1/auth/*`** (the oRPC surface is mirrored at `/api/rpc/v1/auth/*`):

{{ comp.apiTable({
  caption: "auth-api endpoints (:8094, /api/v1/auth/*)",
  rows: [
    { name: "POST /api/v1/auth/signin", type: "interactive only", desc: "Begin the OAuth/OIDC redirect flow. Live on kv-oauth; returns AUTH_PROVIDER_ERROR on workos/better-auth." },
    { name: "POST /api/v1/auth/callback", type: "interactive only", desc: "Complete the provider redirect, mint a session. Live on kv-oauth; AUTH_PROVIDER_ERROR on the others." },
    { name: "POST /api/v1/auth/signout", type: "session", desc: "On kv-oauth, revoke the current session and emit its session-clearing Set-Cookie." },
    { name: "GET /api/v1/auth/session", type: "session", desc: "Return the current session if one is present and valid. Works on all backends." },
    { name: "GET /api/v1/auth/me", type: "identity", desc: "Return the authenticated principal (the resolved user). Works on all backends." }
  ]
}) }}

The service also exposes liveness/readiness probes at `/health/live` and `/health/ready`, plus
OpenAPI docs, through the standard `@netscript/service` builder. Watch it come up in the Aspire
dashboard at [https://localhost:18888](https://localhost:18888) under the `auth-api` resource.

## Step 7 — Sign in through the generated app

Installing auth into a generated Fresh workspace emits `auth/bff.ts`,
`auth/service.ts`, and `apps/<app>/routes/auth/[action].ts`. Helper regeneration
also wires newly added services to the same auth resource. Register the provider
callback URI as `<app-origin>/auth/callback`, using the app endpoint reported by
Aspire. No fixed app port is required.

Submit a same-origin HTML form with `method="post"` and `action="/auth/signin"`.
The app forwards the signin operation to the existing auth plugin and follows
its provider authorization redirect. The provider returns to the app's GET
`/auth/callback` route, which submits the code, state, and transaction cookie as
typed callback input to the plugin. The app response sets the first-party
HttpOnly session cookie and redirects to the app. GET `/auth/session` then
returns `authenticated` and `subject`, without exposing the session id. POST
`/auth/signout` requires the app's Origin, revokes the session, and expires the
cookie.

Use HTTPS in production. The generated local adapter issues a Secure
`__Host-ns_session` cookie on `localhost`, which browsers treat as a secure
cookie host even with a local HTTP endpoint. Other HTTP hosts are refused. If
you configure `NETSCRIPT_AUTH_COOKIE_NAME`, export the same value for the app
and auth service before starting Aspire. Authored routes and service policies
are preserved during regeneration; custom app layouts must mount the adapter
themselves.

For a guarded server-side read, attach the generated client to the service
contract and supply only the incoming request's credential context:

```ts
import {
  browserSessionContext,
  createBrowserSessionClient,
} from "./auth/bff.ts";
import { CatalogContractV1 } from "./contracts/catalog/v1/mod.ts";

declare const request: Request;
const catalog = createBrowserSessionClient(
  CatalogContractV1,
  "catalog",
  "catalog",
);
const result = await catalog.list({}, {
  context: browserSessionContext(request),
});
```

The generated bearer contribution uses `direct-only` caching: credentials and
authenticated responses never enter a shared query cache. Services verify the
forwarded bearer through the existing remote authenticator; browser cookies are
never forwarded to guarded services. The scaffold's demonstration service routes
remain public. Other `/api` paths require a bearer once the CLI installs its
generated policy. Replace the demo exemptions when making those routes private,
and keep browser reads in server-side app handlers. Workers, sagas, and triggers
use a service identity independently of browser sessions.

Generated CORS origins include enabled workspace apps and extend each
service/plugin's declared `NETSCRIPT_CORS_ORIGINS`. This is a response
allowlist; it does not authorize cookie callers. Publish-mode endpoint
references still require a deployment's public app origin configuration; this
local scaffold recipe does not certify deployment or browser conformance.

### Direct auth service diagnostics

Confirm the service is up and the session endpoint responds. On a fresh, unauthenticated request,
`session` reports no active session — which proves the endpoint is wired even before you complete a
login:

```sh
# Service is alive
curl http://localhost:8094/health/ready

# No session yet — confirms the endpoint is mounted and reachable
curl http://localhost:8094/api/v1/auth/session
```

The `kv-oauth` HTTP surface returns JSON redirect fields and emits the backend's
`Set-Cookie` headers on both REST and RPC. `signin` returns `redirectUrl` plus
the transaction cookie; `callback` returns `redirectTo` plus the session cookie.
Your application follows those JSON redirects and posts the provider's `code`
and `state` to the callback endpoint. The callback is POST-only: configure your
application callback route to perform that POST when the provider redirects back
with a GET. Browser cookie retention across origins is a separate deployment
concern; see [session lifecycles](/identity-access/session-lifecycles/).

For this plain-HTTP loopback recipe, set both development overrides in the host environment
**before starting or restarting `auth-api`**. Use an unprefixed cookie name: clients reject
an insecure `__Host-` cookie even when server-side `allowInsecureDev` permits issuance.
Keep your real provider credentials and redirect URI from Step 3.

```sh
export NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS=true
export NETSCRIPT_AUTH_COOKIE_NAME=ns_session_dev
```

Then save the transaction cookie, visit the returned `redirectUrl`, and copy the provider
callback's code and state into the callback POST. The provider must register the redirect URI
from Step 3; its GET callback may report a method error on this POST-only service route.
Copy the code and state from that redirect URL and submit them below:

```sh
# Save the transaction cookie and read redirectUrl from the JSON response.
curl -c cookies.txt -X POST http://localhost:8094/api/v1/auth/signin \
  -H 'Content-Type: application/json' -d '{}'

# Visit redirectUrl and authenticate with the provider, then submit its code/state.
# Send the transaction cookie and replace it with the issued session cookie.
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8094/api/v1/auth/callback \
  -H 'Content-Type: application/json' \
  -d '{"code":"PROVIDER_CODE","state":"PROVIDER_STATE"}'

# Resolve the active session using only the cookie; no sessionId is needed.
curl -b cookies.txt http://localhost:8094/api/v1/auth/session
curl -b cookies.txt http://localhost:8094/api/v1/auth/me

# On kv-oauth, revoke the session and expire the cookie in the jar.
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8094/api/v1/auth/signout \
  -H 'Content-Type: application/json' -d '{}'
```

Use HTTPS for production cookies and remove the two development overrides above. The default
production cookie is `__Host-ns_session`; the local recipe uses `ns_session_dev` so curl can
save and resend it over plain HTTP. `NETSCRIPT_AUTH_COOKIE_NAME` configures the name used by
both the backend and service. A caller without a cookie jar may supply the transaction id as callback
input `txn`; a callback without either fails with `oauth_cookie_missing`.

A successful `GET /api/v1/auth/session` after callback returns the active
session; `GET /api/v1/auth/me` returns the authenticated principal. The callback
includes `sessionId` for server-side bearer consumers. The generated BFF never returns it in
browser JSON; browser callers use the first-party app cookie.

### 0.0.8 cookie migration

The callback input now accepts optional `txn`. The JSON outputs retain their
existing shape, including `sessionId`; cookie headers are added to both HTTP
projections. The public `httpOnly` option now accepts only `true` or omission; remove `false` overrides.
Cookie issuance also refuses `httpOnly: false` from untyped callers and refuses insecure
cookies outside `allowInsecureDev`, including custom cookie names. Treat this
security policy tightening as a breaking change: remove insecure production
cookie overrides, use HTTPS, and keep `HttpOnly` enabled. `__Host-` cookies must
retain `Path=/` and omit `Domain`, even during development.

For a typed service-client call, use the `auth/sdk-client.ts` module emitted during install. The
manifest only advertises the factory; it never auto-attaches credentials. Select the generated
descriptor on the `auth-api` client and provide its declared context explicitly:

```ts
import { createServiceClient } from '@netscript/sdk/client';
import { authContract } from '@netscript/plugin-auth-core/contracts/v1';
import { authSdkClientContribution } from './auth/sdk-client.ts';

declare const currentSession: { accessToken: string; accountId: string };

const authClient = createServiceClient({
  contract: authContract,
  serviceName: 'auth-api',
  routerName: 'auth',
  contributions: [authSdkClientContribution] as const,
});

const session = await authClient.session(undefined, {
  context: {
    auth: { getAccessToken: () => currentSession.accessToken },
    authCachePartition: currentSession.accountId,
  },
});
```

`signin`, `callback`, and `describe` are explicitly public and do not resolve the credential.
`session`, `me`, and `signout` require it. The generated resolver reads no ambient environment,
cookie, or browser storage; your application supplies the credential for each logical call. Keep
`authCachePartition` stable and non-secret—never use a token, session id, email, or another
reversible identifier. Bearer headers require HTTPS outside localhost and loopback development.

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
<li><strong>Credential contributions are explicit</strong> — installing auth makes the typed bearer
factory available but does not attach it globally. Add the generated descriptor only to the intended
service tuple and pass its typed context per call.</li>
<li><strong>Provider env is required for real login</strong> — without
<code>NETSCRIPT_AUTH_CLIENT_ID</code>/<code>SECRET</code>/<code>REDIRECT_URI</code> the
<code>kv-oauth</code> backend boots into a stub fallback; <code>session</code>/<code>me</code> answer
but no real sign-in is possible.</li>
<li><strong>Non-OIDC providers need a stable subject</strong> — GitHub and other plain OAuth 2.0
providers return no ID token. The subject then comes from the provider's userinfo response, namespaced
by provider (<code>github:&lt;numeric id&gt;</code>). Keep <code>NETSCRIPT_AUTH_PROVIDER_ID</code> set
to the preset name, or set <code>NETSCRIPT_AUTH_SUBJECT_SOURCE</code>/<code>NETSCRIPT_AUTH_SUBJECT_CLAIM</code>.
A provider with no stable identifier refuses sign-in (<code>subject_missing</code>) instead of
issuing a new subject per sign-in. See
<a href="../../session-lifecycles/#stable-subjects-for-non-oidc-providers">stable subjects</a>.</li>
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
  href: "/data-persistence/how-to/database-migration/",
  icon: "+"
}) }}

</div>
