# Plan — `@netscript/auth-kv-oauth` (Track-4, prime-time slice)

Status: DRAFT awaiting user approval → PLAN-EVAL (OpenHands minimax-M3, separate session).
Umbrella: `feat/framework-prime-time` (PR #73). Slice branch: `feat/prime-time/auth-kv-oauth`.
Run dir: `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/`.

## Archetype & scope

- **Archetype:** ARCHETYPE-3 (adapter package), SCOPE-service overlay. Sibling of
  `@netscript/auth-workos` / `@netscript/auth-better-auth` (Track-2, PR #83).
- **Net-new, additive only.** Adds `packages/auth-kv-oauth`. Touches NO existing package source
  except, if needed, a one-line service composition wiring example (kept additive). Consumes the
  merged #77 seam (`@netscript/service/auth`) and `@netscript/kv` — both already on `main`.
- **Production/enterprise bar:** no stubs/no-ops; real OAuth2/OIDC auth-code+PKCE+refresh; encrypted
  token-at-rest; CSRF (state) + mix-up (iss) + replay (nonce) defenses; open-redirect allowlist;
  graceful errors; full conformance-style tests; gates green.

## Locked decisions

1. **Protocol engine:** `jsr:@panva/oauth4webapi@^3.8.6` (inline JSR specifier; verified 2026-06-20,
   matches npm 3.8.6). Zero-dep, Web-Platform-only, OpenID-certified. No hand-rolled crypto.
2. **`jose` deferred:** not a baseline dep; id_token validation is internal to oauth4webapi. Add
   `jsr:@panva/jose@^6.2.3` only if a later need to mint/verify custom JWTs arises.
3. **KV access:** `@netscript/kv` `WatchableKv` (injectable; default `await getKv()`); typed key
   tuples; `atomic()` versionstamp CAS for refresh rotation. Never raw `Deno.openKv` in adapter code.
4. **Seam consumption:** import `AuthenticatorPort`/`AuthnRequest`/`AuthnResult`/`Principal` from
   `@netscript/service/auth`; `Principal.scheme:'custom'`; refresh rotation emitted via
   `AuthnResult.setCookies`.
5. **Dual surface:** `mountKvOAuthHandler` (Hono, owns `/signin` `/callback` `/signout`) +
   `createKvOAuthAuthenticator` (per-request). Plus a lower-level `createKvOAuthFlow`.
6. **Provider model:** one generic builder (`defineOAuthProvider`) + a preset registry. v1 first-class:
   GitHub, Google, GitLab, Discord, Slack, Spotify, Facebook, Twitter/X. Tier-2: Auth0, Okta, AWS
   Cognito, Azure AD, Logto, Clerk. Generic-only recipes: Azure ADB2C, Notion, Dropbox, Patreon.
   OIDC presets prefer discovery (`issuer`); endpoints overridable; no version-pinned literals.
7. **Security baseline (must certify):** PKCE S256 always; exact state; RFC 9207 iss; OIDC nonce +
   id_token validation; AES-256-GCM token-at-rest; refresh rotation + reuse detection;
   `__Host-`/HttpOnly/Secure/SameSite=Lax cookies; `isHttps` from forwarded-proto/config;
   open-redirect allowlist on returnTo; HTTPS enforced (no `allowInsecureRequests` outside dev test).
8. **PAR/DPoP deferred** to opt-in toggles (record as accepted debt for v1).
9. **Catalog law:** engine via inline `jsr:` (no `package.json` catalog dep at baseline). Confirm the
   JSR-vs-catalog divergence from Track-2 adapters at PLAN-EVAL.
10. **Attribution:** MIT notice crediting the Deno authors for the endpoint catalog + `getRequiredEnv`
    pattern reimplemented (not wrapped) from `deno_kv_oauth`.
11. **Token-encryption key provenance (LOCKED):** the AES-256-GCM key is supplied to
    `createKvOAuthStore` either as an injected `CryptoKey`/`ArrayBuffer` or resolved from a required
    runtime secret env var `NETSCRIPT_AUTH_KV_OAUTH_KEY` (32-byte, base64url). Sealed values carry a
    `keyId` prefix so future key rotation is non-breaking; **active key-rotation is deferred to debt**
    (the prefix is the forward-compat seam, not a v1 feature). No key ⇒ hard startup error (never a
    silent plaintext fallback).
12. **RP-only for v1 (LOCKED):** the adapter is an OAuth/OIDC Relying-Party client only. Acting as a
    resource server (`validateJwtAccessToken` of inbound bearer JWTs) is **out of scope / deferred**;
    bearer-token authentication remains the existing seam authenticators' job. Public (PKCE-only,
    no-secret) clients ARE supported via `clientAuthMethod:'none'`.

## Slice breakdown (one commit each; commit→push→PR comment→append commits.md)

- **S1 — scaffold + config/provider registry (types only).** `packages/auth-kv-oauth` deno.json/
  package.json/mod.ts/README; `OAuthProviderConfig`, `defineOAuthProvider`, `providers` presets
  (first-class + tier-2), discovery-vs-explicit endpoint resolution shape. Compiles under
  `isolatedDeclarations`; `deno check --unstable-kv ./mod.ts` green. No runtime behavior yet.
- **S2 — store + crypto + cookies.** `KvOAuthStore` over `WatchableKv` (txn + session namespaces,
  TTL, atomic CAS); AES-256-GCM token sealing; `__Host-` cookie build/parse with
  forwarded-proto-derived `isHttps`. Unit tests: KV round-trip, single-use txn, CAS rotation,
  encrypt/decrypt, cookie attrs (incl. `__Host-` and proxy case).
- **S3 — flow (signIn/handleCallback/signOut/getSessionId)** on oauth4webapi: discovery, PKCE S256,
  state+nonce, `validateAuthResponse`, code grant + id_token validation, returnTo allowlist,
  session+sealed-token KV write. Tests against a stubbed AS (success, state mismatch, nonce mismatch,
  error param, open-redirect rejected, expired txn).
- **S4 — `createKvOAuthAuthenticator` (AuthenticatorPort)** + refresh rotation: cookie→KV→
  near-expiry refresh (engine) → CAS rotate → `Principal{scheme:'custom'}` via `normalizePrincipal`
  (default id_token claims; optional userinfo) → `setCookies`. Tests: principal mapping, rotation,
  refresh-reuse detection, session-missing reason string, setCookies emission.
- **S5 — `mountKvOAuthHandler` (Hono)** owning routes + a minimal additive service-composition usage
  example; integration test: full signin→callback→authenticate→signout. README with provider recipes
  (incl. generic-only providers) + security notes + MIT attribution.
- **S6 — gates + polish:** README export-map doc-lint (full export set, per
  [[jsr-doc-lint-full-export-set]]), `publish:dry-run`, lint/fmt/check sweep; record PAR/DPoP +
  any deferred provider presets + JSR-catalog divergence in `drift.md`/`arch-debt.md`.

S1→S2→S3→S4→S5 are dependency-ordered; S6 closes. Generator may combine S1+S2 if cohesive.

## Gates

- Per-slice: `deno run ... run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx`,
  touched-file lint + fmt, `deno test --unstable-kv --allow-all packages/auth-kv-oauth`.
- Slice-final: `deno check --unstable-kv ./mod.ts`, `publish:dry-run` (isolated-declarations clean),
  doc-lint over the full export map.
- **NOT** an e2e-cli-gate slice — it adds a standalone adapter package, no scaffold/runtime/Aspire
  wiring change. `scaffold.runtime` E2E is out of scope (record rationale). `arch:check` baseline
  unchanged (new adapter follows ARCHETYPE-3 cardinality).
- Catalog/version: confirm engine pin via `deno task deps:latest` at impl (authority over
  `deno outdated`). `deno.json` catalog, `aspire/src/public/mod.ts`, `scaffold-versions.ts`,
  version pins — **untouched** (LD-8).

## Accepted debt / deferrals (record in arch-debt.md)

- PAR + DPoP deferred to opt-in (engine supports both; baseline is auth-code+PKCE+refresh).
- Azure ADB2C / Notion / Dropbox / Patreon shipped as generic-builder recipes, not maintained presets.
- All-sessions (global) logout index optional in v1; if deferred, record it.

## Open item for PLAN-EVAL to rule on

- **JSR-inline engine pin vs Track-2's `catalog:` convention for auth deps** — is the divergence
  acceptable (a Deno-native JSR `@netscript/*` package pinning `jsr:@panva/oauth4webapi` inline, with
  no `package.json`/catalog entry), or must the engine be routed through the workspace `catalog:` for
  consistency with `auth-workos`/`auth-better-auth` (which catalog *npm* libs)? This is the one
  cross-cutting policy call; decisions 11 (encryption-key provenance) and 12 (RP-only v1) are now
  locked above.

## Generator handoff

Implementation lane: WSL Codex daemon-attached subagent on worktree branch
`feat/prime-time/auth-kv-oauth` (mobile-visible), per harness Agent Delegation Contract. Briefs
derive from this plan + `api-design.md` + `research.md`. PLAN-EVAL PASS required before any slice.
