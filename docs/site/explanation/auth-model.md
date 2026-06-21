---
layout: layouts/base.vto
title: The pure-backend auth model
templateEngine: [vento, md]
prev: { label: "The plugin system", href: "/explanation/plugin-system/" }
next: { label: "Durability model", href: "/explanation/durability-model/" }
---

# The pure-backend auth model

This page explains *what* NetScript authentication actually is, *why* it is designed as a
**pure-backend seam** rather than a built-in identity provider, and *how* a single typed port lets
you swap GitHub OAuth for WorkOS or better-auth without touching one line of application code. It is
understanding-oriented — read it to build the mental model before you wire authentication into a
project. When you want the headline API and endpoints, see the
[auth capability](/capabilities/auth/); when you want to do the task, follow
[Add authentication](/how-to/add-authentication/); when you want exact exported symbols, follow
[`reference/service/`](/reference/service/) and the auth adapter references it links to.

{{ comp callout { type: "important", title: "Alpha status" } }}
The CLI scaffold pins forward-looking specifiers like
<code>jsr:@netscript/plugin-auth-core@^1.0.0</code>, but those <strong>do not install at 1.0
today</strong> — they describe the intended stable surface. There is also <strong>no auth
telemetry or audit surface yet</strong>: the model below is the authentication seam only, not an
audit log. Treat both as forward roadmap, not shipped runtime.
{{ /comp }}

## The thesis: NetScript owns the seam, not the identity provider

Most backend frameworks make a choice for you. They either bundle a session store, a password
table, and a set of OAuth strategies — and you live inside their opinions forever — or they hand you
nothing and you reassemble cookies, token verification, and provider redirects by hand in every
project. Both extremes leak the *integration tax* NetScript exists to remove: the first couples your
app to one identity vendor; the second makes you the integration.

NetScript takes the same stance on authentication that it takes on
[contracts](/explanation/contracts/) and [plugins](/explanation/plugin-system/): the cross-cutting
concern belongs to a **typed boundary the framework owns**, and the concrete provider is an adapter
that plugs into that boundary. The framework defines *the shape of an authenticator* — a port — and
ships several **pure backends** that satisfy it. Your application depends on the port; it never
depends on GitHub, WorkOS, or better-auth directly.

The payoff is the one promise this whole design exists to keep: **you swap the provider by changing
one environment variable, not your code.**

## The seam: `AuthBackendPort` and its sub-ports

The core package [`@netscript/plugin-auth-core`](/capabilities/auth/) defines a single port,
**`AuthBackendPort`**, that every backend must satisfy. It is not a god-interface — it is composed
of small, single-responsibility **sub-ports**, so a backend implements exactly the concerns it
owns and nothing more.

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

Two things make this a *seam* rather than a base class. First, every member is a port — a small
interface — so a backend is **composition, not inheritance**: it assembles four required sub-ports
(plus one optional one) instead of subclassing framework internals. Second, the optional
`interactive` member is where the whole capability matrix below comes from: a backend that owns its
redirect flow provides it; a backend that delegates sign-in to a hosted page leaves it out.

{{ comp callout { type: "note", title: "Why a port and not a base class" } }}
A base class would force every backend to inherit a session store, a crypto scheme, and a flow it
might not have. A <strong>port</strong> lets each backend supply only the sub-ports it genuinely
owns — WorkOS brings its AuthKit sealed cookie and skips <code>interactive</code> entirely, while
kv-oauth brings a full KV-backed session store and a real OAuth redirect. Same seam, different
fills. This is the doctrine's <em>composition over inheritance</em> applied to identity.
{{ /comp }}

## The neutral currency: `Principal` and `AuthnResult` with `scheme: "custom"`

A backend's job is to turn *its* notion of an authenticated user into *NetScript's* notion. That
neutral currency lives one layer down, in [`@netscript/service`](/reference/service/) under the
`/auth` subpath, and it is the same authentication contract the rest of the framework already
speaks — API keys, bearer tokens, trusted headers. Auth backends produce the same `Principal` shape.

{{ comp.tabbedCode({ tabs: [
  {
    label: "The neutral shapes (@netscript/service/auth)",
    lang: "ts",
    code: "// A backend never returns vendor types to your app. It returns these.\n\n// Who the request is, in framework-neutral terms.\ninterface Principal {\n  readonly subject: string;          // stable user id\n  readonly scheme: \"api-key\" | \"bearer\" | \"trusted-header\" | \"custom\";\n  readonly claims: Readonly<Record<string, unknown>>;\n  // ...\n}\n\n// The result of authenticating a request: success xor typed failure.\ntype AuthnResult =\n  | { ok: true; principal: Principal; readonly setCookies?: readonly string[] }\n  | { ok: false; reason: string };"
  },
  {
    label: "What a backend produces",
    lang: "ts",
    code: "// Every OAuth/OIDC backend stamps its principals with scheme: \"custom\" —\n// distinguishing an interactively-authenticated user from an api-key or\n// bearer caller, while still flowing through the SAME AuthnResult seam.\n\nconst result: AuthnResult = {\n  ok: true,\n  principal: {\n    subject: \"user_01H...\",\n    scheme: \"custom\",            // <- auth adapters always use \"custom\"\n    claims: { email: \"a@b.dev\", provider: \"github\" },\n  },\n  setCookies: [\"__Host-ns_session=...; HttpOnly; Secure; SameSite=Lax\"],\n};"
  }
] }) }}

The discipline here is what makes provider-swapping real. The `principalMapper` sub-port is the
*only* place a backend's vendor identity touches NetScript types; everywhere downstream — your
service handlers, your contract middleware, your authorization checks — sees a `Principal` with
`scheme: "custom"` and never imports a WorkOS or kv-oauth type. Change the backend and the
`Principal` your code reads does not change shape.

## Three backends, three different capability matrices

The framework ships three pure backends. They satisfy the **same** `AuthBackendPort`, but they fill
the **optional** `interactive` slot differently — and that single difference produces three genuinely
different capability profiles. Only **kv-oauth** is a full interactive backend; WorkOS and
better-auth are **non-interactive by design**.

{{ comp.apiTable({
  caption: "The three backends and where they diverge",
  rows: [
    { name: "@netscript/auth-kv-oauth", type: "interactive", desc: "Drives its own OAuth/OIDC redirect flow. Full `interactive` port (`signIn`/`handleCallback`/`signOut`), KV-backed sessions with real create/refresh/revoke, refresh-on-read, default cookie `__Host-ns_session`. The default backend. Provider presets: github, google, gitlab, discord, slack, spotify, facebook, twitter, plus tenant-based auth0, okta, awsCognito, azureAd, logto, clerk." },
    { name: "@netscript/auth-workos", type: "non-interactive", desc: "Delegates sign-in to WorkOS AuthKit's hosted flow; verifies the sealed `wos-session` cookie. NO `interactive` port. Session mutations throw `AuthBackendOperationUnsupportedError`." },
    { name: "@netscript/auth-better-auth", type: "non-interactive", desc: "Wraps a better-auth instance over Prisma; verifies its session. NO `interactive` port. Session mutations throw `AuthBackendOperationUnsupportedError`." }
  ]
}) }}

This is not a missing-feature apology — it is the seam working as intended. A hosted provider like
WorkOS *owns* the sign-in page and session lifecycle; asking NetScript to also mutate that session
would be wrong, so the backend declines it loudly rather than pretending. The next section explains
exactly how it declines.

{{ comp callout { type: "warning", title: "What non-interactive means at runtime" } }}
On a non-interactive backend (WorkOS or better-auth), the two interactive endpoints behave
predictably and visibly: <code>/api/v1/auth/signin</code> and <code>/api/v1/auth/callback</code>
return a typed <code>AUTH_PROVIDER_ERROR</code> (HTTP 502, "does not expose an interactive flow"),
and any direct session mutation throws <code>AuthBackendOperationUnsupportedError</code>. The
<code>session</code>, <code>me</code>, and <code>signout</code> endpoints still work — you verify and
read the session the hosted provider established. Choose kv-oauth when you want NetScript to drive
the full redirect; choose WorkOS/better-auth when the provider owns sign-in and NetScript only
verifies.
{{ /comp }}

## The capability boundary is a typed error, not a silent gap

When a backend cannot do something its sub-port nominally exposes, it does not return `undefined`,
log a warning, or no-op. It throws a **typed** `AuthBackendOperationUnsupportedError(name, op,
reason)` — naming the backend, the operation, and why. This is the same fail-loud discipline the
rest of the framework follows (streams helpers throw `StreamUnsupportedOperationError`; trigger
`defer` throws and routes to a DLQ): an unsupported capability is a *visible, typed boundary*, never
a quiet surprise in production.

{{ comp.tabbedCode({ tabs: [
  {
    label: "The capability boundary is explicit",
    lang: "ts",
    code: "// A non-interactive backend declining a session mutation. The error names\n// the backend, the operation, and the reason — you find out at the call site,\n// not three hops later from a malformed cookie.\n\nconst revoke = async (sessionId: string): Promise<void> => {\n  throw new AuthBackendOperationUnsupportedError(\n    \"workos\",                 // backend name\n    \"sessions.revoke\",        // the operation\n    \"WorkOS AuthKit owns session lifecycle; revoke via the WorkOS dashboard or API.\",\n  );\n};\n\n// At the service edge, the interactive endpoints translate the same boundary\n// into a typed HTTP error rather than a stack trace:\n//   POST /api/v1/auth/signin  -> AUTH_PROVIDER_ERROR (502)\n//   POST /api/v1/auth/callback -> AUTH_PROVIDER_ERROR (502)"
  }
] }) }}

Because the boundary is typed, you can *program against it*. A handler that wants to support both
interactive and hosted backends can branch on whether `backend.interactive` is present rather than
catching errors after the fact — the optionality of the port and the typed error are two views of
the same fact: this backend does not own sign-in.

## One active backend — a hard v1 boundary

The unifying plugin [`@netscript/plugin-auth`](/capabilities/auth/) composes **exactly one** active
backend. It reads `NETSCRIPT_AUTH_BACKEND` (or `auth.backend` in appsettings), resolves it through a
registry — valid values `kv-oauth` | `workos` | `better-auth`, **default `kv-oauth`** — and serves
the `auth-api` oRPC service on **:8094** with five endpoints under `/api/v1/auth/`:
`signin`, `callback`, `signout`, `session`, `me`.

```text
                    NETSCRIPT_AUTH_BACKEND  (default: kv-oauth)
                                 │
                                 ▼
        ┌──────────────────────────────────────────────┐
        │  @netscript/plugin-auth  (auth-api :8094)     │
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

**Single-active-backend is a deliberate v1 boundary**, not an incidental limitation. It means there
is exactly one authenticator answering at a time. The following are explicitly **out of scope** for
v1 — do not design against them yet:

{{ comp.apiTable({
  caption: "Out of scope in v1 (single-active-backend boundary)",
  rows: [
    { name: "Multi-active routing", type: "not supported", desc: "You cannot run kv-oauth and WorkOS simultaneously and route requests between them. One backend is active per deployment." },
    { name: "Cross-backend account linking", type: "not supported", desc: "There is no linking of a kv-oauth identity to a WorkOS identity. Each backend owns its own identities." },
    { name: "Global logout", type: "not supported", desc: "No fan-out logout across backends or across a user's sessions in other backends." },
    { name: "Historical replay / paged session mirror", type: "not supported", desc: "No replay of past auth events into a backend, and no paged mirror of every session across backends." }
  ]
}) }}

Choosing one active backend keeps the model coherent: a single `Principal` source, a single session
authority, and a single place to reason about who is signed in. Multi-backend identity is a hard
problem (consistent logout, link reconciliation, conflicting session lifetimes); v1 declines it on
purpose rather than ship a half-correct version.

## Why this seam — the design in one sentence

Everything above serves one outcome: **the provider is an implementation detail your application
never imports.** Your handlers read a `Principal`; the framework owns the `AuthBackendPort`; a pure
backend fills it; and which backend fills it is a registry decision driven by one environment
variable.

- **Capability authors** implement a backend by satisfying sub-ports — they think about OAuth and
  sessions, never about how a host wires them in.
- **The plugin** composes exactly one backend and exposes a stable five-endpoint service, so the
  rest of the app sees a fixed surface regardless of provider.
- **Your application** depends on `Principal` / `AuthnResult` with `scheme: "custom"` — so swapping
  GitHub OAuth for WorkOS is an env-var change and a redeploy, not a refactor.

This is the same shape as the [plugin model](/explanation/plugin-system/) (a thin integration layer
over a pure capability) and the [contracts model](/explanation/contracts/) (the framework owns the
boundary, you own the logic) — authentication is just the identity-shaped instance of the pattern.

## Glossary

- **`AuthBackendPort`** — the seam every auth backend satisfies; composed of `providers`, `sessions`,
  `crypto`, `principalMapper` sub-ports plus an optional `interactive` flow. Defined in
  `@netscript/plugin-auth-core`.
- **`InteractiveFlowPort`** — the optional redirect flow (`signIn`/`handleCallback`/`getSessionId`/
  `signOut`). Present only on **kv-oauth**; absent on WorkOS and better-auth.
- **single-active-backend** — the v1 rule that exactly one backend is active per deployment; no
  multi-active routing, cross-backend linking, global logout, or replay.
- **`Principal` / `scheme: "custom"`** — the framework-neutral identity from
  [`@netscript/service`](/reference/service/)`/auth`; auth adapters stamp principals with
  `scheme: "custom"`.
- **`AuthBackendOperationUnsupportedError`** — the typed error a backend throws when an operation is
  outside its capability matrix (for example session mutation on a non-interactive backend).
- **opaque session token** — the default WebCrypto HMAC-SHA256 token
  (`createHmacSessionTokenCrypto`); an opaque string you do not parse, not a JWT.

## Where to go next

- **The capability:** [Authentication](/capabilities/auth/) — the headline API, the `auth-api`
  service on :8094, the five endpoints, and the backend matrix at a glance.
- **Do it:** [Add authentication](/how-to/add-authentication/) — add the `auth` plugin, choose a
  backend with `NETSCRIPT_AUTH_BACKEND`, run the migration, and wire provider env.
- **Related model:** [The plugin system](/explanation/plugin-system/) — why a thin plugin composes a
  pure capability, the same shape this auth seam follows.
- **Reference:** the neutral authentication contract lives in
  [`reference/service/`](/reference/service/) (the `/auth` subpath: `Principal`, `AuthnResult`,
  `AuthenticatorPort`).

{{ comp.nextPrev({ prev: { label: "The plugin system", href: "/explanation/plugin-system/" }, next: { label: "Durability model", href: "/explanation/durability-model/" } }) }}
