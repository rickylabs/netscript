# Plan — `@netscript/auth-kv-oauth` (Track-4, prime-time slice)

Status: **PLAN-EVAL PASS (cycle 1, 2026-06-20)** → cleared for implementation. See verdict section below.
Umbrella: `feat/framework-prime-time` (PR #73). Slice branch: `feat/prime-time/auth-kv-oauth`.
Run dir: `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/`.

## Archetype & scope

- **Archetype:** ARCHETYPE-2 (Integration — adapter package), SCOPE-service overlay. Sibling of
  `@netscript/auth-workos` / `@netscript/auth-better-auth` (Track-2, PR #83). [PLAN-EVAL M2: Arch-3
  is Runtime/Behavior in `docs/architecture/doctrine/06-archetypes.md`; adapter packages
  (`prisma-adapter-mysql`, `auth-workos`, `auth-better-auth`) are Arch-2 Integration. Relabeled.]
- **Net-new, additive only.** Adds `packages/auth-kv-oauth`. Touches NO existing package source
  except, if needed, a one-line service composition wiring example (kept additive). Consumes the
  merged #77 seam (`@netscript/service/auth`) and `@netscript/kv` — both already on `main`.
- **Production/enterprise bar:** no stubs/no-ops; real OAuth2/OIDC auth-code+PKCE+refresh; encrypted
  token-at-rest; CSRF (state) + mix-up (iss) + replay (nonce) defenses; open-redirect allowlist;
  graceful errors; full conformance-style tests; gates green.

## Locked decisions

1. **Protocol engine:** `jsr:@panva/oauth4webapi@^3.8.6` (inline JSR specifier; JSR latest stable
   `3.8.6` published 2026-04-27, zero-dep, MIT, Web-Platform-only, OpenID-certified). No hand-rolled
   crypto. [PLAN-EVAL M1: the prior "matches npm 3.8.6" aside is wrong — the npm `oauth4webapi` line
   is `1.x`; the JSR pin stands on its own. Re-confirm with `deno task deps:latest` at impl.]
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
9. **Catalog law (RESOLVED at PLAN-EVAL):** engine via inline `jsr:` (no `package.json` catalog dep).
   `catalog:` is **npm-only** per `.agents/skills/netscript-deno-toolchain` — JSR deps cannot use
   catalog. Track-2 routes *npm* libs through catalog (correct for npm); Track-4 pins a *JSR* lib
   inline (correct for JSR). Both follow the same doctrine — no actual divergence. NOT an open item.
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
  any deferred provider presets in `drift.md`/`arch-debt.md` (catalog law is settled — no divergence
  to record). **[PLAN-EVAL M3]** add a consumer-import validation step: a throwaway downstream module
  that imports the public `mod.ts` surface and type-checks under `isolatedDeclarations`, proving the
  published export map resolves for a consumer (not just internally).

S1→S2→S3→S4→S5 are dependency-ordered; S6 closes. Generator may combine S1+S2 if cohesive.

## Gates

- Per-slice: `deno run ... run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx`,
  touched-file lint + fmt, `deno test --unstable-kv --allow-all packages/auth-kv-oauth`.
- Slice-final: `deno check --unstable-kv ./mod.ts`, `publish:dry-run` (isolated-declarations clean),
  doc-lint over the full export map.
- **NOT** an e2e-cli-gate slice — it adds a standalone adapter package, no scaffold/runtime/Aspire
  wiring change. `scaffold.runtime` E2E is out of scope (record rationale). `arch:check` baseline
  unchanged (new adapter follows ARCHETYPE-2 Integration cardinality, like `auth-workos`).
- Catalog/version: confirm engine pin via `deno task deps:latest` at impl (authority over
  `deno outdated`). `deno.json` catalog, `aspire/src/public/mod.ts`, `scaffold-versions.ts`,
  version pins — **untouched** (LD-8).

## Accepted debt / deferrals (record in arch-debt.md)

- PAR + DPoP deferred to opt-in (engine supports both; baseline is auth-code+PKCE+refresh).
- Azure ADB2C / Notion / Dropbox / Patreon shipped as generic-builder recipes, not maintained presets.
- All-sessions (global) logout index optional in v1; if deferred, record it.

## PLAN-EVAL verdict (cycle 1, 2026-06-20 — PASS)

OpenHands minimax-m3 on PR #73 (run `27869687433`). **Verdict: PASS — implementation may begin.**
All 8 Plan-Gate boxes pass; every load-bearing claim spot-checked against current `main` (seam ports
verbatim at `packages/service/src/auth/types.ts`; `applyAuthnResponse` honors `setCookies`;
`withAuthn`/`allowAnonymous` composition root; `WatchableKv` injection; engine export coverage; JSR
`3.8.6` latest stable; catalog law npm-only). The one open policy call (JSR-inline vs catalog) was
**resolved in place** (see LD-9 above — no divergence). Verdict delivered as PR comment
`issuecomment-4757538575` (the OpenHands job died at its artifact-commit step — `Job status: failure`
— so `plan-eval.md` is reconstructed here by the supervisor from the complete comment body).

Four non-blocking, **slice-time** corrections (apply during impl, not rework):

- **M1** — drop the "matches npm 3.8.6" aside; the npm `oauth4webapi` line is `1.x`. JSR pin stands.
  *(applied to LD-1 above; re-confirm via `deno task deps:latest` at impl.)*
- **M2** — re-label ARCHETYPE-3 → ARCHETYPE-2 (Integration). *(applied above.)*
- **M3** — add a consumer-import validation item to S6 (downstream module imports `mod.ts`,
  type-checks under `isolatedDeclarations`). *(applied to S6 above.)*
- **M4** — document the dual-surface precedent **honestly**: `prisma-adapter-mysql` has the flat
  `src/` layout but **no** Hono mount and **no** `AuthenticatorPort` factory; the real dual-surface
  precedent is the Track-2 `auth-workos` / `auth-better-auth` adapters now on the umbrella. *(carried
  into the generator brief / `implement.md`; README must not over-claim the mysql precedent.)*

Rescope option held open by the evaluator: if S3 (flow) or S4 (authenticator+refresh) trips on size,
the tier-2 presets and/or PAR/DPoP may split to a fast-follow — the plan offers this path explicitly;
no rework required at plan-eval time.

## Generator handoff

Implementation lane: WSL Codex daemon-attached subagent on worktree branch
`feat/prime-time/auth-kv-oauth` (mobile-visible), per harness Agent Delegation Contract. Briefs
derive from this plan + `api-design.md` + `research.md`. PLAN-EVAL PASS required before any slice.
