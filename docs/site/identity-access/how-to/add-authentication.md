---
layout: layouts/base.vto
title: Add authentication
description: Install the auth plugin, pick one active backend, migrate, and sign in through the generated app.
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/add-authentication/
---

# Add authentication

This recipe installs the `auth` plugin in an existing workspace, selects a backend and signs in
through the generated Fresh app. Only the alternative `better-auth` backend needs an auth SQL migration. You finish with a working
OAuth/OIDC sign-in on the default `kv-oauth` backend.

## Prerequisites

- **A NetScript workspace with KV.** The default `kv-oauth` backend needs KV for sessions and no
  SQL database. Only `better-auth` requires SQL and contributes Prisma tables; installation can
  provision its database if needed. Postgres is recommended for that backend; `mysql`, `mssql`
  and `sqlite` also work. If you have no workspace yet, scaffold one with the tutorials first.
- **The `netscript` CLI on your `PATH`.** Install it with
  `deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}` and
  confirm with `netscript --help`.
- **OAuth credentials.** The default `kv-oauth` backend needs a real OAuth/OIDC app, such as a
  Google client id, client secret and redirect URI. Without provider environment, `signin` and
  `callback` are non-functional stubs.

Run every command from the workspace root.

> [!IMPORTANT]
> Configure and export the provider environment (Step 3) before you start Aspire (Step 4), and
> start Aspire before any `netscript db` command or auth request. The `auth-api` service and its
> backend-selected database and KV dependencies are resources in the Aspire graph; see
> [the Aspire explanation](/explanation/aspire/).

## Step 1 — Add the `auth` plugin

Install `auth` the same way as the other official plugins (`workers`, `sagas`, `triggers` and
`streams`):

```sh
netscript plugin install @netscript/plugin-auth
```

This installs the `@netscript/plugin-auth` dependency, emits the user-owned `auth/mod.ts` glue
barrel and registers it. The plugin composes one active backend behind the `auth-api` oRPC service
and contributes the service entry and the `/api/v1/auth/*` routes. Only the `better-auth` backend
contributes the `auth.prisma` schema; the default `kv-oauth` backend needs no SQL database. The
installer pins exact alpha specifiers such as `jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}`,
so the workspace gets matching dependencies, generated glue, registry entries and Aspire resources
together.

The generated app's BFF owns the browser callback. Register `<app-origin>/auth/callback` with
your provider, using the app URL Aspire prints. If that allocated URL changes, update the provider
registration and redirect configuration together. For a stable external callback, configure a
stable app origin in your deployment. The auth service itself needs no fixed host port.

## Step 2 — Choose a backend with the auth CLI

`NETSCRIPT_AUTH_BACKEND` (or the `auth.backend` appsettings key) selects the active backend. Three
backends are valid; the default is `kv-oauth`.

{{ comp.apiTable({
caption: "Auth backends — capability matrix (NETSCRIPT_AUTH_BACKEND)",
rows: [
{ name: "kv-oauth", type: "interactive (default)", desc: "Full OAuth/OIDC redirect flow. Real signin + callback, KV-backed sessions with refresh-on-read, signout. The only backend that implements InteractiveFlowPort. Package @netscript/auth-kv-oauth." },
{ name: "workos", type: "non-interactive", desc: "WorkOS AuthKit sealed cookie under NETSCRIPT_AUTH_COOKIE_NAME (default __Host-ns_session). The CLI WorkOS preset explicitly selects wos-session to match AuthKit. Subject-wide logout uses a durable KV fence and background upstream cleanup. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR (no interactive flow). Package @netscript/auth-workos." },
{ name: "better-auth", type: "non-interactive", desc: "better-auth over Prisma. Validates an existing session; signin/callback return AUTH_PROVIDER_ERROR. Package @netscript/auth-better-auth." }
]
}) }}

> [!NOTE]
> `workos` and `better-auth` verify sessions that the provider's own SDK or login page created, so
> their `signin` and `callback` routes return `AUTH_PROVIDER_ERROR` (502). Only one backend is
> active per deployment. [The three backends](/identity-access/auth/#the-three-backends) covers
> both boundaries.

<!-- caveat: arch-debt:seamless-auth-roadmap -->
<!-- caveat: arch-debt:auth-single-active-backend-boundary -->

This recipe uses `kv-oauth`. Persist the choice in the workspace boot seam and confirm what the
service will use:

```sh
netscript plugin auth backend set kv-oauth
netscript plugin auth backend show
netscript plugin doctor
```

The command reconciles `NETSCRIPT_AUTH_BACKEND` in the project `.env` and the canonical plugin
selector in appsettings; Step 3 exports the environment before Aspire starts. Deployment systems
that own configuration externally can still set the environment variable or the `auth.backend` /
`Auth.Backend` appsettings key directly.

## Step 3 — Configure the provider and secrets

Each backend reads its own environment block. The auth CLI writes it to the same project `.env` as
Step 2. For GitHub on `kv-oauth`:

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

GitHub is OAuth 2.0, not OIDC. The preset emits no `NETSCRIPT_AUTH_ISSUER`, ignores `--issuer` with
a notice, and removes an issuer that an older preset saved when you re-run the command. With
`NETSCRIPT_AUTH_PROVIDER_ID=github`, the runtime also ignores an issuer inherited from an old shell
or deployment. GitHub serves no OIDC discovery document, so sign-in uses these explicit endpoints and
derives the stable subject `github:<id>` from userinfo:

```dotenv
NETSCRIPT_AUTH_PROVIDER_ID=github
NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://github.com/login/oauth/authorize
NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://github.com/login/oauth/access_token
NETSCRIPT_AUTH_USERINFO_ENDPOINT=https://api.github.com/user
NETSCRIPT_AUTH_SCOPES=read:user user:email
```

> [!CAUTION]
> Keep the project `.env` out of version control: the CLI writes provider credentials and settings
> only there, and tracked appsettings receives only the non-secret backend selector. Earlier provider
> configuration copied credentials into tracked files; remove those copies and rotate any credential
> that was committed.

Reconciliation prunes legacy credential copies and keeps unrelated, benign environment settings.
Aspire refuses declared credential-shaped keys as source literals, so generated helpers do not carry
their values.

Generated auth assignments are POSIX shell literals. Source and export the file before starting
Aspire so its executable resources inherit the exact values; apostrophes, substitutions, backticks,
backslashes and embedded newlines stay literal. Deno's direct `--env-file` loader accepts simple
quoted values and scopes but not all POSIX quoting, so use the source/export path for hostile values.
Provider credential environment bindings keep secrets out of CLI arguments; explicit credential
flags remain supported for compatibility.

Tenant presets such as `okta`, `auth0`, `azure-ad`, `aws-cognito`, `logto` and `clerk` also accept
`--issuer`. The non-interactive backends use their boot-native credential names:

```sh
# Your credential source exports WORKOS_API_KEY and WORKOS_COOKIE_PASSWORD.
netscript plugin auth provider set --preset workos --client-id "$WORKOS_CLIENT_ID"

export BETTER_AUTH_SECRET="$(netscript plugin auth secret generate better-auth)"
netscript plugin auth provider set --preset better-auth
```

CI and deployment systems that inject environment variables themselves can export each backend's
block directly. Ordinary workspace setup uses the source/export step above.

{{ comp.tabbedCode({ tabs: [
{
label: "kv-oauth (default, interactive)",
lang: "sh",
code: "# Selects the interactive OAuth/OIDC backend\nexport NETSCRIPT_AUTH_BACKEND=kv-oauth\n\n# Provider credentials (e.g. a Google OAuth app)\nexport NETSCRIPT_AUTH_CLIENT_ID=your-client-id\nexport NETSCRIPT_AUTH_CLIENT_SECRET=your-client-secret\nexport NETSCRIPT_AUTH_REDIRECT_URI=\"$APP_URL/auth/callback\"\n\n# OIDC discovery / endpoints (preset providers fill these for you)\nexport NETSCRIPT_AUTH_ISSUER=https://accounts.google.com\nexport NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth\nexport NETSCRIPT_AUTH_TOKEN_ENDPOINT=https://oauth2.googleapis.com/token\nexport NETSCRIPT_AUTH_USERINFO_ENDPOINT=https://openidconnect.googleapis.com/v1/userinfo\nexport NETSCRIPT_AUTH_SCOPES=\"openid email profile\"\n\n# Stable subject: OIDC providers use the ID-token sub. A preset named by\n# NETSCRIPT_AUTH_PROVIDER_ID supplies its own default (github: userinfo id).\n# export NETSCRIPT_AUTH_SUBJECT_SOURCE=userinfo # id_token | userinfo\n# export NETSCRIPT_AUTH_SUBJECT_CLAIM=id\n\n# Optional: cookie + KV tuning\nexport NETSCRIPT_AUTH_COOKIE_NAME=__Host-ns_session\nexport NETSCRIPT_AUTH_KV_OAUTH_KEY=<base64url-encoded-32-byte-secret> # required for kv-oauth: missing key material is a startup error\n# Local HTTP only: export NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS=true\n# TLS proxy only: export NETSCRIPT_AUTH_TRUST_PROXY_HEADERS=true\n# Direct TLS at the service: export NETSCRIPT_AUTH_COOKIE_SECURE=true\n# Outbound HTTP provider tests only: export NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS=true\n\n# Aspire injects PORT; do not set a fixed listener port."
},
{
label: "workos (non-interactive)",
lang: "sh",
code: "export NETSCRIPT_AUTH_BACKEND=workos\nexport NETSCRIPT_AUTH_COOKIE_NAME=__Host-ns_session\n# Configure the AuthKit issuer with the same cookie name.\n# Bound retained access tokens by the longest configured WorkOS duration.\nexport WORKOS_ACCESS_TOKEN_MAX_LIFETIME_MS=86400000\n\nexport WORKOS_API_KEY=sk_...\nexport WORKOS_CLIENT_ID=client_...\nexport WORKOS_COOKIE_PASSWORD=at-least-32-characters-of-entropy\n\n# signin/callback return AUTH_PROVIDER_ERROR on this backend.\n# It validates an existing WorkOS AuthKit session (session/me).\n# Aspire injects PORT; do not set a fixed listener port."
},
{
label: "better-auth (non-interactive)",
lang: "sh",
code: "export NETSCRIPT_AUTH_BACKEND=better-auth\n\nexport BETTER_AUTH_SECRET=at-least-32-characters-of-entropy\nexport DB_PROVIDER=postgres\n\n# Persists users/sessions/accounts via auth.prisma (Step 4).\n# signin/callback return AUTH_PROVIDER_ERROR — validate-only.\n# Aspire injects PORT; do not set a fixed listener port."
}
] }) }}

## Step 4 — Start Aspire (migrate auth tables only for better-auth)

When `better-auth` is selected, the plugin's package-provided **`auth.prisma`** schema is copied
into your project's database schema during installation. Its models persist through Prisma, so
they follow whichever engine you scaffolded with `--db`. That backend defines four models:

{{ comp.apiTable({
caption: "auth.prisma models → your database tables",
rows: [
{ name: "AuthUser", type: "auth_users", desc: "Authenticated principals. Populated by backends that persist users (better-auth)." },
{ name: "AuthSession", type: "auth_sessions", desc: "Server-side session records. kv-oauth keeps sessions in KV; this table backs the Prisma-persisting backend." },
{ name: "AuthAccount", type: "auth_accounts", desc: "Linked provider accounts (the OAuth/OIDC identities behind a user)." },
{ name: "AuthVerification", type: "auth_verifications", desc: "Verification / challenge records used during account flows." }
]
}) }}

Only a `better-auth` install provisions these tables. This recipe uses `kv-oauth`, which stores
sessions in Deno KV and contributes no Prisma schema or database requirement. WorkOS also
contributes no SQL schema; it verifies sealed cookies and keeps revocation fences, outbox jobs
and per-session tombstones in host KV. When switching an installed backend to `better-auth`,
select it first and reinstall with `netscript plugin install auth --name auth --force` so its
schema and database wiring are added. Existing tables are preserved when switching away.

With the Step 3 environment exported, start Aspire from the workspace root:

```sh
(cd aspire && aspire start)
```

If an AppHost is already running, stop it first with `(cd aspire && aspire stop)` so its replacement
inherits the exported values. The dashboard is at the URL Aspire prints. Skip the auth migration
for `kv-oauth` and `workos`. If you selected and reinstalled `better-auth`, generate and apply its
migration with Aspire running:

```sh
if [ "${NETSCRIPT_AUTH_BACKEND:-kv-oauth}" = better-auth ]; then
  netscript db init --name init    # first time only — create the migration
  netscript db generate            # generate Prisma client + Zod schemas
  netscript db seed                # optional seed data
  netscript db status              # confirm the migration is applied
fi
```

[Run a database migration](/data-persistence/how-to/database-migration/) covers the full database
workflow.

## Step 5 — Check the auth endpoints

With Aspire running, `auth-api` answers at the URL Aspire prints under the REST
prefix `/api/v1/auth/*`, with the oRPC mirror at `/api/rpc/v1/auth/*`, the `/health/live` and
`/health/ready` probes and OpenAPI docs. It appears as the `auth-api` resource in the Aspire
dashboard. [The service surface](/identity-access/auth/#the-service-surface) lists the six
operations and which ones need a credential.

> [!NOTE]
> The scaffold composes the backend for you. To compose `kv-oauth` in code instead, for a custom
> service entry, a test or non-scaffold wiring, pass a provider preset or a custom provider to
> `createKvOAuthBackend`, as
> [Provider presets and custom providers](/identity-access/auth/#provider-presets-and-custom-providers)
> shows.

### Direct auth service diagnostics

This section checks HTTP cookie issuance and forwarding. For application calls, use the generated
BFF and its typed session client in Step 6. Set `AUTH_URL` to the auth-api URL Aspire prints and
`APP_URL` to the Fresh app URL before running these diagnostics.

Confirm the service is up and the session endpoint responds. On a fresh, unauthenticated request,
`session` reports no active session, which proves the endpoint is wired before you complete a login:

```sh
# Service is alive
curl "$AUTH_URL/health/ready"

# No session yet — confirms the endpoint is mounted and reachable
curl "$AUTH_URL/api/v1/auth/session"
```

On `kv-oauth`, the HTTP surface returns JSON redirect fields and emits the backend's `Set-Cookie`
headers on both REST and RPC: `signin` returns `redirectUrl` plus the transaction cookie, and
`callback` returns `redirectTo` plus the session cookie. Your application follows those redirects
and posts the provider's `code` and `state` to the callback endpoint. The callback is POST-only, so
configure your application's callback route to perform that POST when the provider redirects back
with a GET. In the BFF topology, the app server owns these browser-facing routes, sets the
first-party cookie on its own origin and forwards a bearer credential to services; browser requests
do not use credentialed cross-origin CORS. See
[session lifecycles](/identity-access/session-lifecycles/).

To run the flow with curl over plain-HTTP loopback, set both development overrides in the host
environment **before starting or restarting `auth-api`**. Use an unprefixed cookie name: clients
reject an insecure `__Host-` cookie even when server-side `allowInsecureDev` permits issuance. Keep
your real provider credentials and redirect URI from Step 3.

```sh
export NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS=true
export NETSCRIPT_AUTH_COOKIE_NAME=ns_session_dev
```

> [!CAUTION]
> These overrides are for local loopback only. Remove both in production and serve HTTPS: the
> default production cookie is `__Host-ns_session`, and the local recipe uses `ns_session_dev` only
> so curl can save and resend it over plain HTTP.

Save the transaction cookie, visit the returned `redirectUrl` and authenticate with the provider.
The provider must have the redirect URI from Step 3 registered; its GET to this POST-only service
route may report a method error, so copy the `code` and `state` from that redirect URL into the
callback POST:

```sh
# Save the transaction cookie and read redirectUrl from the JSON response.
curl -c cookies.txt -X POST "$AUTH_URL/api/v1/auth/signin" \
  -H 'Content-Type: application/json' -d '{}'

# Visit redirectUrl and authenticate with the provider, then submit its code/state.
# Send the transaction cookie and replace it with the issued session cookie.
curl -b cookies.txt -c cookies.txt -X POST "$AUTH_URL/api/v1/auth/callback" \
  -H 'Content-Type: application/json' \
  -d '{"code":"PROVIDER_CODE","state":"PROVIDER_STATE"}'

# Resolve the active session using only the cookie; no sessionId is needed.
curl -b cookies.txt "$AUTH_URL/api/v1/auth/session"
curl -b cookies.txt "$AUTH_URL/api/v1/auth/me"

# On kv-oauth, revoke the session and expire the cookie in the jar.
curl -b cookies.txt -c cookies.txt -X POST "$AUTH_URL/api/v1/auth/signout" \
  -H 'Content-Type: application/json' -d '{}'
```

`NETSCRIPT_AUTH_COOKIE_NAME` sets the cookie name for both the backend and the service. A caller
without a cookie jar may pass the transaction id as callback input `txn`; a callback with neither
fails with `oauth_cookie_missing`. After the callback, `GET /api/v1/auth/session` returns the active
session and `GET /api/v1/auth/me` the authenticated principal. The callback returns
`{ completed, redirectTo, subject }` without `sessionId`. The generated BFF keeps the backend cookie
on the app origin and uses it to forward a bearer credential to services.

Signout only ends the caller's own sessions: without a credential it returns `401`, and a
`sessionId` that is unknown or belongs to someone else returns the same `401` (see
[signout ownership](/identity-access/auth/#signout-acts-only-for-the-caller)). End the session with
the same cookie:

```sh
# End this session
curl -b cookies.txt -X POST "$AUTH_URL/api/v1/auth/signout"
# End every session of the signed-in subject
curl -b cookies.txt -X POST -H 'content-type: application/json' \
  -d '{"everywhere":true}' "$AUTH_URL/api/v1/auth/signout"
```

## Step 6 — Sign in through the generated app

Installing auth into a generated Fresh workspace emits `auth/bff.ts`, `auth/service.ts` and
`apps/<app>/routes/auth/[action].ts`. Helper regeneration also wires newly added services to the
same auth resource. Register the provider callback URI as `<app-origin>/auth/callback`, using the
app endpoint that Aspire reports; no fixed app port is required.

1. Submit a same-origin HTML form with `method="post"` and `action="/auth/signin"`. The app forwards
   the signin operation to the auth plugin and follows its provider authorization redirect.
2. The provider returns to the app's GET `/auth/callback` route, which submits the code, state and
   transaction cookie to the plugin as typed callback input. The app response sets the first-party
   HttpOnly session cookie and redirects into the app.
3. GET `/auth/session` returns `authenticated` and `subject`, without exposing the session id.
4. POST `/auth/signout` requires the app's Origin, revokes the session and expires the cookie.

Use HTTPS in production. On `localhost`, the generated local adapter issues a Secure
`__Host-ns_session` cookie, which browsers treat as a secure cookie host even over a local HTTP
endpoint; other HTTP hosts are refused. If you configure `NETSCRIPT_AUTH_COOKIE_NAME`, export the
same value for the app and the auth service before starting Aspire. Regeneration preserves authored
routes and service policies; custom app layouts must mount the adapter themselves.

For a guarded server-side read, attach the generated client to the service contract and supply only
the incoming request's credential context:

```ts
import { browserSessionContext, createBrowserSessionClient } from './auth/bff.ts';
import { CatalogContractV1 } from './contracts/catalog/v1/mod.ts';

declare const request: Request;
const catalog = createBrowserSessionClient(
  CatalogContractV1,
  'catalog',
  'catalog',
);
const result = await catalog.list({}, {
  context: browserSessionContext(request),
});
```

The generated bearer contribution uses `direct-only` caching: credentials and authenticated
responses never enter a shared query cache. Services verify the forwarded bearer through the
existing remote authenticator, and browser cookies are never forwarded to guarded services.

The scaffold's demonstration procedures declare `access: { authentication: 'none' }` and stay
public on REST and RPC, as do `/api/openapi.json` and `/api/docs`. Other `/api` paths require a
bearer and a contract authorization decision once the CLI installs its generated policy. To make
the demo routes private, change their procedure metadata, and keep browser reads in server-side app
handlers. Workers, sagas and triggers use a service identity, independent of browser sessions.

Generated CORS origins include the enabled workspace apps and extend each service's and plugin's
declared `NETSCRIPT_CORS_ORIGINS`. This is a response allowlist; it does not authorize cookie
callers. Publish-mode endpoint references still need a deployment's public app origin
configuration; this local recipe does not certify deployment or browser conformance.

### Typed auth client

For a typed call to `auth-api`, use the `auth/sdk-client.ts` module emitted during install. The
manifest only advertises the factory and never attaches credentials automatically. Select the
generated descriptor on the `auth-api` client and provide its declared context explicitly:

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

`signin`, `callback` and `describe` are explicitly public and do not resolve the credential;
`session`, `me`, `signout` and `revokeSession` require it. The generated resolver reads no ambient
environment, cookie or browser storage: your application supplies the credential for each logical
call. Bearer headers require HTTPS outside localhost and loopback development.

> [!CAUTION]
> Keep `authCachePartition` stable and non-secret. Never use a token, session id, email or any
> other reversible identifier.

### 0.0.8 cookie migration

Projects with their own backend, session routes and browser bridge can opt out of the generated
browser topology before installing auth or running lifecycle commands: set
`NetScript.Apps.<app>.Auth.BrowserTopology` to `"authored"` in `appsettings.json`. The default
remains `"scaffold"`. Authored apps keep their `/auth` routes and browser helper files untouched,
even when those files do not exist, and generated service-session example routes are skipped.
`netscript generate aspire` preserves that topology and `netscript plugin doctor` reports its
authored ownership. Task, Tauri and desktop entries do not trigger browser helpers alongside an
authored browser app; workspaces without browser apps keep the legacy helper generation. Other
scaffold browser apps still use shared helpers, and independently scaffold-owned service policies
still receive their bearer verifier. The setting does not delete previously generated files.
[App-owned browser authentication](/cli-reference/#app-owned-browser-authentication) has the
configuration example and the mixed-workspace behavior.

> [!WARNING]
> The callback contract and the cookie policy changed in 0.0.8, and both changes break existing
> callers.

- **Callback contract.** The callback input accepts an optional `txn`, and the callback JSON no
  longer includes `sessionId`. Replace reads of `callback.sessionId` with a cookie jar and an
  empty-input `session` request. The app server keeps the issued cookie on its own origin and
  forwards a bearer credential to services. Server-only integrations that compose a backend
  directly may use `InteractiveFlowPort.handleCallback` and its session result, but must not expose
  that credential in browser callback JSON. Both HTTP projections preserve cookie headers.
- **Cookie policy.** The public `httpOnly` option accepts only `true` or omission; remove `false`
  overrides. Cookie issuance also refuses `httpOnly: false` from untyped callers and insecure
  cookies outside `allowInsecureDev`, including custom cookie names. Remove insecure production
  cookie overrides, use HTTPS and keep `HttpOnly` enabled. `__Host-` cookies must keep `Path=/` and
  omit `Domain`, even during development.

## Protect a plugin API

Every plugin service built with `createPluginService` from `@netscript/plugin/service` must choose a
posture in its `auth` field. Leaving the field out does not type-check, and a malformed posture
throws before the service starts. `netscript plugin new <name>` generates the guarded posture; keep
it for any API that returns user data:

```ts
// plugins/billing/services/src/main.ts
import { createPluginService } from '@netscript/plugin/service';
import { mountPluginContract } from '@netscript/plugin/contract-base';
import { createAuthServiceAuthenticator } from '@netscript/plugin-auth/authenticator';
import { createContractAuthorizer } from '@netscript/service/auth';
import { billingContractDefinition } from '@netscript/plugin-billing-core/contracts/v1';
import { billingContractMount, billingRouter } from './handlers.ts';

export const billingService = createPluginService(billingRouter, {
  name: 'billing',
  auth: {
    authn: {
      authenticator: createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 }),
    },
    authz: {
      authorizer: createContractAuthorizer(
        mountPluginContract(billingContractDefinition, billingContractMount),
      ),
    },
  },
});
```

- **Authentication.** `createAuthServiceAuthenticator` verifies the request's bearer session
  against the `auth` service found through discovery. The plugin needs no auth backend, KV handle or
  provider secret. A missing or rejected session returns `401`; an unreachable auth service returns
  `503`.
- **Authorization.** `createContractAuthorizer` reads the scopes each procedure declares, for
  example `.meta({ access: { authentication: 'required', authorization: { scopes: ['billing:read'] } } })`
  on the contract route. A session without that scope returns `403`. Pass the same
  `PluginContractMount` to router assembly and to `mountPluginContract` so REST paths and RPC keys
  line up.
- **Health.** `/health` stays anonymous. A healthy plugin does not prove that reads are authorized.

To publish an API without a guard on purpose, record the decision instead of omitting it:

```ts
export const statusService = createPluginService(statusRouter, {
  name: 'status',
  auth: { public: true, reason: 'Unauthenticated status API for the load balancer' },
});
```

The reason must not be blank, and a public posture cannot also carry `authn` or `authz`.

> [!WARNING]
> Background callers have no app session. Workers, sagas and triggers run under a service identity,
> so nothing they do may depend on an open app or a live user session. `createAuthServiceAuthenticator`
> accepts only sessions the auth service issued: guard an API that background processes call over
> HTTP with a credential they hold, for example `createStaticCredentialAuthenticator` from
> `@netscript/service/auth` with a service credential the AppHost injects. A service takes exactly
> one authenticator.

The [plugin authentication reference](/reference/plugin/#plugin-service-authentication-posture)
has the exact posture types and validation rules.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `signin` or `callback` returns `AUTH_PROVIDER_ERROR` | The active backend is `workos` or `better-auth`, which validate sessions but do not drive the login redirect. | Set `NETSCRIPT_AUTH_BACKEND=kv-oauth` for an interactive flow. |
| `session` and `me` answer, but no real sign-in is possible | Provider environment (`NETSCRIPT_AUTH_CLIENT_ID`, `NETSCRIPT_AUTH_CLIENT_SECRET`, `NETSCRIPT_AUTH_REDIRECT_URI`) is missing, so `kv-oauth` booted on its non-functional local-default endpoints. That fallback suits scaffold smoke tests only. | Configure a real provider as in Step 3. |
| A 404 from the allocated auth endpoint, or a database error from `netscript db` | Orchestration is not running. | Start Aspire first: `cd aspire && aspire start`. |

## Production notes

> [!CAUTION]
> Set `NETSCRIPT_AUTH_TRUST_PROXY_HEADERS=true` only behind a TLS-terminating proxy that replaces
> incoming protocol headers and blocks direct access to the service. The service does not verify
> proxy hops or source CIDRs.

- **TLS.** Forwarded protocol headers are ignored by default. The flow gate and the cookie `Secure`
  derivation share one policy. For TLS terminated at the service itself, set
  `NETSCRIPT_AUTH_COOKIE_SECURE=true`: refresh receives no request URL and needs this explicit
  setting. The service does not detect host TLS metadata automatically.
- **Insecure-transport switches.** `NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS` controls outbound OAuth
  HTTP only, and proxied TLS does not need it. Local HTTP development uses the separate
  `NETSCRIPT_AUTH_ALLOW_INSECURE_HTTP_REQUESTS=true`. Missing or partial provider config never
  enables insecure transport. Transport and configuration refusals return `AUTH_TRANSPORT_ERROR` or
  `AUTH_CONFIGURATION_ERROR` (400) with distinct flow and cookie reasons; missing service request
  capture returns `INTERNAL` (500), and upstream failures stay 502.
- **Explicit credential contributions.** Installing auth makes the typed bearer factory available but
  does not attach it globally. Add the generated descriptor only to the intended service tuple and
  pass its typed context per call.
- **Stable subjects for non-OIDC providers.** GitHub and other plain OAuth 2.0 providers return no
  ID token, so the subject comes from the provider's userinfo response, namespaced by provider
  (`github:<numeric id>`). Keep `NETSCRIPT_AUTH_PROVIDER_ID` set to the preset name, or set
  `NETSCRIPT_AUTH_SUBJECT_SOURCE` and `NETSCRIPT_AUTH_SUBJECT_CLAIM`. A provider with no stable
  identifier refuses sign-in (`subject_missing`) instead of issuing a new subject per sign-in. See
  [stable subjects](/identity-access/session-lifecycles/#stable-subjects-for-non-oidc-providers).

## Next steps

[Session lifecycles](/identity-access/session-lifecycles/) shows how to wire sign-in,
callbacks and refreshed cookies into your own routes for each backend.

- [Authentication](/identity-access/auth/): the `auth-api` surface and the three backends.
- {{ comp.xref({ key: "explain:auth-model", text: "The authentication model" }) }}: why the backend
  is an adapter behind `AuthBackendPort`.
- [Run a database migration](/data-persistence/how-to/database-migration/): the full `db` workflow
  that applies `auth.prisma` for the `better-auth` backend.
