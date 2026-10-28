---
layout: layouts/base.vto
title: The pure-backend auth model
templateEngine: [vento, md]
prev: { label: 'The plugin system', href: '/explanation/plugin-system/' }
next: { label: 'Durability model', href: '/explanation/durability-model/' }
order: 4
---

# The pure-backend auth model

This page explains what NetScript authentication is, why it is a **pure-backend seam** rather than
a built-in identity provider, and how one typed port lets you swap GitHub OAuth for WorkOS or
better-auth without changing application code. For the headline API and endpoints, see the
[auth capability](/capabilities/auth/). To set it up, follow
[Add authentication](/identity-access/how-to/add-authentication/). For exact exported symbols, see
[`reference/service/`](/reference/service/) and the auth adapter references it links to.

{{ comp callout { type: "note", title: "Audit telemetry" } }}
An opt-in, redacted audit surface ships through <code>createAuthTelemetry</code>; it is enabled when
a <code>subjectHashSalt</code> is configured. This page covers the authentication seam. See
<a href="{{ "explain:observability" |> xref }}">Observability</a> for the audit surface and its salt
requirement.
{{ /comp }}

## The seam, not the provider

Most backend frameworks pick one of two extremes. Some bundle a session store, a password table,
and a set of OAuth strategies, and your app lives inside those choices. Others provide nothing, and
you rebuild cookies, token verification, and provider redirects in every project. Both leave you
paying the _integration tax_ NetScript exists to remove: the first couples your app to one identity
vendor, and the second makes you the integrator.

NetScript treats authentication the way it treats [contracts](/explanation/contracts/) and
[plugins](/explanation/plugin-system/): the cross-cutting concern belongs to a **typed boundary the
framework owns**, and the concrete provider is an adapter that plugs into it. The framework defines
_the shape of an authenticator_, a port, and ships several **pure backends** that satisfy it. Your
application depends on the port, never on GitHub, WorkOS, or better-auth directly.

As a result, **you swap the provider by changing one environment variable, not your code.**

## `AuthBackendPort` and its sub-ports

The core package [`@netscript/plugin-auth-core`](/capabilities/auth/) defines one port,
**`AuthBackendPort`**, that every backend must satisfy. It is composed of small,
single-responsibility **sub-ports**, so a backend implements exactly the concerns it owns.

{{ comp.apiTable({
caption: "AuthBackendPort — the seam every backend satisfies (from `@netscript/plugin-auth-core/ports`)",
rows: [
{ name: "name", type: "string", desc: "The backend's stable identifier — `kv-oauth`, `workos`, or `better-auth`. Used by the registry to resolve the one active backend." },
{ name: "providers", type: "AuthProviderRegistryPort", desc: "The set of identity providers this backend understands (GitHub, Google, Okta, …). Resolves a named provider to its OAuth/OIDC configuration." },
{ name: "sessions", type: "AuthSessionStorePort", desc: "Create, read, refresh, and revoke sessions. The mutation surface — and the one non-interactive backends decline." },
{ name: "crypto", type: "AuthSessionCryptoPort", desc: "Signs and verifies the opaque session token. The default is a WebCrypto HMAC-SHA256 token (`createHmacSessionTokenCrypto`) — an opaque string, not a JWT you parse." },
{ name: "principalMapper", type: "AuthPrincipalMapperPort", desc: "Maps a backend-specific identity into the framework's neutral `Principal` shape, so the rest of the app never sees vendor types." },
{ name: "interactive?", type: "InteractiveFlowPort (optional)", desc: "The redirect-based sign-in flow: `signIn`, `handleCallback`, `getSessionId`, `signOut`. OPTIONAL — only a backend that drives its own OAuth redirect implements it." },
{ name: "authenticate(request)", type: "(AuthnRequest) => AuthnResult", desc: "The non-interactive verify step inherited from `AuthenticatorPort`: given a request (cookie/header), return a `Principal` or a typed failure." }
]
}) }}

Two properties make this a _seam_ rather than a base class. First, every member is a port, so a
backend is **composition, not inheritance**: it assembles four required sub-ports and one optional
one instead of inheriting a session store, a crypto scheme, and a flow it might not have. WorkOS
brings its AuthKit sealed cookie and skips `interactive`; kv-oauth brings a KV-backed session store
and a real OAuth redirect. Second, the optional `interactive` member is the source of the capability
matrix below: a backend that owns its redirect flow provides it, and a backend that delegates
sign-in to a hosted page leaves it out.

## `Principal` and `AuthnResult`

A backend turns _its_ notion of an authenticated user into _NetScript's_. That neutral currency
lives one layer down, in [`@netscript/service`](/reference/service/) under the `/auth` subpath. It
is the authentication contract the rest of the framework already uses for API keys, bearer tokens,
and trusted headers, and auth backends produce the same `Principal` shape.

{{ comp.tabbedCode({ tabs: [
{
label: "The neutral shapes (@netscript/service/auth)",
lang: "ts",
code: "// A backend never returns vendor types to your app. It returns these.\n\n// Who the request is, in framework-neutral terms.\ninterface Principal {\n readonly subject: string; // stable user id\n readonly scheme: \"api-key\" | \"bearer\" | \"trusted-header\" | \"custom\";\n readonly claims: Readonly<Record<string, unknown>>;\n // ...\n}\n\n// The result of authenticating a request: success xor typed failure.\ntype AuthnResult =\n | { ok: true; principal: Principal; readonly setCookies?: readonly string[] }\n | { ok: false; reason: string };"
},
{
label: "What a backend produces",
lang: "ts",
code: "// Every OAuth/OIDC backend stamps its principals with scheme: \"custom\" —\n// distinguishing an interactively-authenticated user from an api-key or\n// bearer caller, while still flowing through the SAME AuthnResult seam.\n\nconst result: AuthnResult = {\n ok: true,\n principal: {\n subject: \"user_01H...\",\n scheme: \"custom\", // <- auth adapters always use \"custom\"\n claims: { email: \"a@b.dev\", provider: \"github\" },\n },\n setCookies: [\"__Host-ns_session=...; HttpOnly; Secure; SameSite=Lax\"],\n};"
}
] }) }}

The `principalMapper` sub-port is the _only_ place a backend's vendor identity touches NetScript
types. Everything downstream (your service handlers, contract middleware, and authorization checks)
sees a `Principal` with `scheme: "custom"` and never imports a WorkOS or kv-oauth type. Change the
backend, and the `Principal` your code reads keeps its shape.

## Three backends

The framework ships three pure backends. They satisfy the **same** `AuthBackendPort` but fill the
**optional** `interactive` slot differently, which gives three capability profiles. Only
**kv-oauth** is a full interactive backend; WorkOS and better-auth are **non-interactive by
design**.

{{ comp.apiTable({
caption: "The three backends and where they diverge",
rows: [
{ name: "@netscript/auth-kv-oauth", type: "interactive", desc: "Drives its own OAuth/OIDC redirect flow. Full `interactive` port (`signIn`/`handleCallback`/`signOut`), KV-backed sessions with real create/refresh/revoke, refresh-on-read, default cookie `__Host-ns_session`. The default backend. Provider presets: github, google, gitlab, discord, slack, spotify, facebook, twitter, plus tenant-based auth0, okta, awsCognito, azureAd, logto, clerk." },
{ name: "@netscript/auth-workos", type: "non-interactive", desc: "Delegates sign-in to WorkOS AuthKit's hosted flow; verifies a sealed cookie under `NETSCRIPT_AUTH_COOKIE_NAME` (direct plugin default `__Host-ns_session`, CLI WorkOS preset `wos-session`). NO `interactive` port. Subject-wide revocation uses a durable KV fence and service-owned WorkOS cleanup worker; session creation, explicit refresh, and revocation by opaque id remain unsupported." },
{ name: "@netscript/auth-better-auth", type: "non-interactive", desc: "Wraps a better-auth instance over Prisma; verifies its session. NO `interactive` port. Session creation and explicit refresh remain unsupported; session and subject revocation delegate to better-auth." }
]
}) }}

The split is deliberate. A hosted provider such as WorkOS owns the sign-in page and session
issuance; NetScript verifies those credentials.

{{ comp callout { type: "important", title: "Non-interactive backends verify; they do not sign in" } }}
With WorkOS or better-auth, the runtime verifies existing sessions through the <code>session</code>,
<code>me</code>, and <code>signout</code> endpoints, but it does not drive sign-in redirects or
create sessions. Subject-wide signout works: WorkOS uses a durable local fence and background
upstream revocation, and better-auth delegates revocation to its upstream API. Calling
<code>/api/v1/auth/signin</code> or <code>/api/v1/auth/callback</code> returns a typed
<code>AUTH_PROVIDER_ERROR</code> (HTTP 502), and unsupported creation or explicit refresh operations
throw <code>AuthBackendOperationUnsupportedError</code>. For redirect-based sign-in, use the
<code>kv-oauth</code> backend, or sign in client-side with your provider's SDK before verification.

<!-- caveat: arch-debt:seamless-auth-roadmap -->

{{ /comp }}

## Typed capability errors

When a backend cannot do something its sub-port exposes, it does not return `undefined`, log a
warning, or do nothing. It throws a **typed** `AuthBackendOperationUnsupportedError(name, op,
reason)` that names the backend, the operation, and the reason. The rest of the framework follows
the same fail-loud rule for backend capability failures: an unsupported capability is a _visible,
typed boundary_, not a quiet surprise in production.

{{ comp.codeBlock({ lang: "ts", code: "// A non-interactive backend declining a session mutation. The error names\n// the backend, the operation, and the reason — you find out at the call site,\n// not three hops later from a malformed cookie.\n\nconst revoke = async (sessionId: string): Promise<void> => {\n throw new AuthBackendOperationUnsupportedError(\n \"workos\", // backend name\n \"sessions.revoke\", // the operation\n \"WorkOS AuthKit owns session lifecycle; revoke via the WorkOS dashboard or API.\",\n );\n};\n\n// At the service edge, the interactive endpoints translate the same boundary\n// into a typed HTTP error rather than a stack trace:\n// POST /api/v1/auth/signin -> AUTH_PROVIDER_ERROR (502)\n// POST /api/v1/auth/callback -> AUTH_PROVIDER_ERROR (502)" }) }}

Because the boundary is typed, you can _program against it_. A handler that supports both
interactive and hosted backends can branch on whether `backend.interactive` is present instead of
catching errors afterwards. The optional port and the typed error express the same fact: this
backend does not own sign-in.

## One active backend

The plugin [`@netscript/plugin-auth`](/capabilities/auth/) composes **exactly one** active backend.
It reads `NETSCRIPT_AUTH_BACKEND` (or `auth.backend` in appsettings) and resolves it through a
registry. Valid values are `kv-oauth`, `workos`, and `better-auth`, and the **default is
`kv-oauth`**. The plugin serves the `auth-api` oRPC service on its assigned port, with six endpoints
under `/api/v1/auth/`: `signin`, `callback`, `signout`, `sessions/revoke`, `session`, and `me`.

```text
                  NETSCRIPT_AUTH_BACKEND  (default: kv-oauth)
                               │
                               ▼
      ┌──────────────────────────────────────────────┐
      │  @netscript/plugin-auth  (auth-api)          │
      │  resolves ONE active backend from the registry│
      └──────────────────────────────────────────────┘
                               │  exactly one of:
      ┌────────────────────────┼─────────────────────────┐
      ▼                        ▼                          ▼
auth-kv-oauth            auth-workos              auth-better-auth
(interactive)            (non-interactive)        (non-interactive)
full redirect flow       verify wos-session       verify better-auth
KV sessions              hosted AuthKit           Prisma-backed
      │                        │                          │
      └────────────── all satisfy AuthBackendPort ────────┘
                               │
                               ▼
               Principal (scheme: "custom")  →  your app
```

**Single-active-backend is a deliberate v1 boundary.** Exactly one authenticator answers at a time,
which keeps the identity model coherent: one `Principal` source, one session authority, and one
place to reason about who is signed in. Multi-backend identity synchronization, such as
cross-provider logout, account linking, or conflicting session lifetimes, needs a state
orchestrator outside NetScript's core validation layer.

{{ comp.apiTable({
caption: "Outside the single-active-backend boundary",
rows: [
{ name: "Multi-active routing", type: "Out of scope", desc: "Routing requests across multiple backends simultaneously is not supported. Use a single active backend configuration per deployment." },
{ name: "Cross-backend account linking", type: "Out of scope", desc: "Identity association between separate providers must be handled upstream; each adapter manages its own independent identities." },
{ name: "Global logout", type: "Out of scope", desc: "Session revocation is local to the active backend store. Cross-backend token revocation must be handled by the provider's management console." },
{ name: "Historical replay / session mirroring", type: "Out of scope", desc: "Synchronizing historical login logs or mirroring session state between backends is not supported." }
]
}) }}

<!-- caveat: arch-debt:auth-single-active-backend-boundary -->

## Generated browser topology

The generated Fresh app uses a backend for frontend (BFF). Installing auth emits app-origin signin,
callback, session, and signout routes backed by the auth plugin. A first-party HttpOnly cookie
carries the opaque session credential. The app reads it only on the server and supplies it to the
SDK bearer contribution for each guarded service call; the service verifies the bearer through the
remote auth authenticator. Browser JSON excludes session credentials, and credentialed calls use
direct-only caching.

The generated demo procedures declare `access: { authentication: 'none' }` and stay public on REST
and RPC. The generated service policy also leaves `/api/openapi.json` and `/api/docs` public for
discovery; other API routes require a bearer and a contract authorization decision. Authored
policies and routes remain authoritative. Background processing belongs to workers, sagas, and
triggers, using service identities.

Next: [Add authentication](/identity-access/how-to/add-authentication/) installs the plugin, picks a
backend, and covers the generated routes, local cookie behavior, and deployment limits.

{{ comp.nextPrev({ prev: { label: "The plugin system", href: "/explanation/plugin-system/" }, next: { label: "Durability model", href: "/explanation/durability-model/" } }) }}
