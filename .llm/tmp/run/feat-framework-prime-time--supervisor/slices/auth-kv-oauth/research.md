# Research — `@netscript/auth-kv-oauth` (Track-4, prime-time)

Synthesized from a 5-agent reverse-engineering workflow (run `wf_65d060d7-392`). Full agent
output (file-cited, ~70k chars) is preserved at
`.llm/tmp/docs/kv-oauth-research/` clones +
`%TEMP%/claude/.../tasks/wvlesn1bd.output`. Reference libs cloned locally:
`deno_kv_oauth` (MIT, Deno authors), `deno-oauth2-client` (@cmd-johnson), `oauth4webapi` (panva).

## 1. Goal & positioning

A third first-party auth adapter that completes the seam tier-matrix established by Track-2:

| Adapter | Tier | Persistence |
| --- | --- | --- |
| `@netscript/auth-workos` | enterprise SaaS | provider-sealed cookie |
| `@netscript/auth-better-auth` | self-host + SQL | Prisma/DB |
| **`@netscript/auth-kv-oauth`** (this) | **self-host, no DB** | **framework Deno KV** |

It consumes — never redefines — the merged #77 seam (`@netscript/service/auth`) and is a sibling
of the two Track-2 adapters. Value: "social/OIDC login + sessions in KV, no database, no SaaS,"
which nothing on Deno offers in a maintained form since `deno_kv_oauth` froze (~2yr).

## 2. Engine decision (LOCKED) — adopt `oauth4webapi`, do not wrap, do not hand-roll

`deno_kv_oauth@0.11.0` delegates all protocol mechanics to the stale `@cmd-johnson/oauth2-client`
(both unmaintained, see [[kv-oauth-adapter-candidate]]). That client: PKCE S256 only, HTTP-Basic or
public-client auth, **never parses `id_token` (no OIDC)**, no discovery, no RFC 9207 `iss`, no nonce.

Decision: build the protocol internals on **`jsr:@panva/oauth4webapi@^3.8.6`** (verified
2026-06-20: JSR latest `3.8.6`, npm parity `3.8.6`). Rationale:

- Zero runtime deps, Web-Platform-only (`fetch` + Web Crypto SubtleCrypto), Deno is a listed
  supported runtime, MIT, **OpenID-certified** Basic + FAPI 1.0 + FAPI 2.0 RP profiles.
- Provides the entire security-critical surface we would otherwise hand-roll: `discoveryRequest`,
  `generateRandomCodeVerifier`/`calculatePKCECodeChallenge` (S256), `generateRandomState`/`Nonce`,
  `validateAuthResponse` (exact state + RFC 9207 `iss` mix-up defense),
  `authorizationCodeGrantRequest` + `processAuthorizationCodeResponse`
  (**validates `id_token` signature/iss/aud/exp/nonce/c_hash internally via Web Crypto + AS JWKS —
  no `jose` needed for login**), `refreshTokenGrantRequest`, `userInfoRequest`, client-auth builders
  (`ClientSecretPost/Basic`, `PrivateKeyJwt`, `None`), and optional `pushedAuthorizationRequest`
  (PAR) / `DPoP`.
- **`jose` is a conditional/deferred dep**, NOT baseline — only if we later mint/verify custom
  session JWTs or do out-of-band assertions. Confirmed `jsr:@panva/jose@^6.2.3` available.

Catalog law: `oauth4webapi` is dual-published; for a Deno-native JSR `@netscript/*` package we pin
the **inline `jsr:@panva/oauth4webapi@^3.8.6`** specifier (cleaner `deno doc`, no node-compat shim),
which is the doctrine-correct form (npm→`catalog:`, JSR→inline `jsr:`). This diverges intentionally
from how `auth-workos`/`auth-better-auth` route `jose`/`better-auth` through `catalog:` (those are
npm libs); flag for PLAN-EVAL confirmation.

## 3. Lifecycle to reproduce (from `deno_kv_oauth` create_helpers.ts, file-cited)

Reimplement the familiar 4-closure surface returning the same drop-in contract, but on the new
engine and with the hardening below:

- `signIn(req)` → mint `state` (+ OIDC `nonce`) + PKCE verifier; persist a short-lived
  oauth-transaction record in KV (10-min TTL); set a `__Host-` oauth cookie; 302 to the AS authorize
  URL (discovery-derived endpoints for OIDC, explicit for plain-OAuth2 providers).
- `handleCallback(req)` → read+atomically-delete the single-use oauth-transaction;
  `validateAuthResponse` (state + iss); `authorizationCodeGrantRequest` +
  `processAuthorizationCodeResponse({expectedNonce, requireIdToken})`; normalize a `Principal`;
  write the session + (encrypted) token record to KV; set the `__Host-` session cookie; 302 to a
  **validated** successUrl. Returns `{ response, sessionId, principal }`.
- `getSessionId(req)` / authenticator path → cookie → KV lookup (server-side validity).
- `signOut(req)` → delete the session KV row, expire cookie, optional provider token revocation.

### KV schema (reimplemented, injected — not a module singleton)
`deno_kv_oauth` uses exactly two namespaces and a module-level `Deno.openKv` singleton keyed off
`DENO_KV_PATH`. We keep the two-namespace idea but **inject `WatchableKv`** and use typed key
tuples:

| Key tuple | Value | TTL | Lifecycle |
| --- | --- | --- | --- |
| `['auth-kv-oauth','txn', id]` | `{state, nonce?, codeVerifier, successUrl, issuer}` | 10 min | single-use, atomic check+delete at callback |
| `['auth-kv-oauth','session', id]` | `{principalSnapshot, enc(tokens), expiresAt, refreshMeta}` | configurable (default 90d) | read by authenticator; CAS-rotated on refresh; deleted on signOut |

### Cookie recipe (keep the good parts, fix the dated ones)
Keep: opaque random ids, server-side KV validation, PKCE S256, single-use atomic txn delete, short
txn TTL, `__Host-`/HttpOnly/Secure/SameSite=Lax. Fix (dated in the reference): unsigned cookies →
opaque-id is fine **but** derive `isHttps` from forwarded-proto/config (not the raw URL string, which
breaks behind TLS-terminating proxies); add OIDC nonce; encrypt tokens at rest (AES-256-GCM);
own refresh-token rotation + reuse detection; **close the `successUrl` open-redirect** with a
server-side same-origin/allowlist check (the reference trusts the `success_url` query param).

## 4. Provider catalog (from 18→19 `create_*_oauth_config.ts`)

Model as **ONE generic builder + a data registry of presets** (every named factory upstream is just
data over one `OAuth2ClientConfig` shape). With discovery available, OIDC presets carry an `issuer`
URL (discovery resolves endpoints); plain-OAuth2 presets carry explicit endpoints.

- **v1 first-class presets (static endpoints, high demand):** GitHub, Google, GitLab, Discord,
  Slack, Spotify, Facebook, Twitter/X. *(Verify current X.com + Facebook-version endpoints at impl —
  the reference literals are stale: Facebook pinned `v17.0`, Twitter pre-X domains.)*
- **Tier-2 presets (single-var domain/issuer templating, OIDC/enterprise):** Auth0, Okta, AWS
  Cognito, Azure AD, Logto, Clerk.
- **Generic-only (documented recipe, not maintained presets):** Azure ADB2C (5 env vars, B2C policy
  path), Notion (`?owner=user` footgun), Dropbox, Patreon.
- Don't pin provider API versions in literals (Facebook `v17.0`) — make overridable preset fields.
- Carry MIT attribution: "Copyright 2023-2024 the Deno authors. MIT license." — the endpoint catalog
  and `getRequiredEnv` pattern are derived from `deno_kv_oauth`.

## 5. NetScript integration surface (verified against local source, #77 on `main`)

- Seam at `packages/service/src/auth/` exported via `@netscript/service/auth`
  (`"../service/src/auth/mod.ts"` map). Consume `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`,
  `Principal` — **do not redefine**.
- `AuthnResult` success branch carries `setCookies?: readonly string[]`; JSDoc: *"Set-Cookie header
  values emitted by refresh-on-read session authenticators"* — the exact rotation hook. Middleware
  (`auth-middleware.ts`) appends each as `Set-Cookie` (`append:true`). One fully-formed cookie string
  per rotated cookie.
- `Principal` = `{subject, scopes[], roles[], scheme, claims}`; adapters use **`scheme:'custom'`**
  + `claims` bag for provider/session metadata.
- **KV access is `@netscript/kv`** (`getKv()`/`getRawKv()` singleton + `WatchableKv` with
  `get/set(expireIn)/delete/has/list/atomic(CAS)/watch`) — **NOT raw `Deno.openKv`** in adapter code.
  Inject `kv?: WatchableKv` (default `await getKv()`) for testability; use `atomic()` versionstamp CAS
  for refresh rotation to avoid double-rotation races.
- Mirror the better-auth adapter's **dual surface**: a Hono mount helper owning the routes +
  an `AuthenticatorPort` factory. The **WorkOS** adapter is the closest analog for the
  cookie-options + refresh-mode + `setCookies` emission shape (persist to KV instead of a sealed
  cookie).
- Package mechanics: `packages/auth-kv-oauth` auto-joins the `packages/*` workspace;
  `isolatedDeclarations:true` repo-wide (explicit return types on every export); `check` task uses
  `--unstable-kv`; deno.json/package.json/publish blocks mirror the Track-2 adapters.

## 6. Resolved defaults for the open questions

- **Principal normalization:** offer a `normalizePrincipal(ctx) => Principal` callback; **default =
  verified OIDC `id_token` claims** (oauth4webapi validates them at callback), with an optional
  `userInfoRequest` fetch for thin-id_token providers. Matches the "opaque claims bag" doctrine.
- **Token-at-rest:** encrypt access/refresh tokens with Web Crypto **AES-256-GCM** (key from a
  runtime secret) before `set()`. Storage is treated as untrusted by default.
- **Refresh:** rotate on near-expiry; persist new refresh token, invalidate prior; treat reuse of a
  rotated token as session compromise (revoke). `WorkosRefreshMode`-style `'never'|'always'` knob.
- **signOut revocation + all-sessions logout:** add an optional provider revocation call; a
  `['auth-kv-oauth','user-sessions', subject, sessionId]` index enables global logout (v1 may defer
  the index — record as debt if so).

## 7. Risks / debt to flag

- We take on maintenance of an OAuth **client** (RP) — bounded to the well-trodden auth-code+PKCE+
  OIDC path, delegated to a certified engine; mitigated by a thorough conformance-style test suite.
- Provider-literal drift (X.com, Facebook version) — verify at impl; prefer discovery for OIDC.
- JSR-inline vs catalog divergence from Track-2 adapters — confirm at PLAN-EVAL.
