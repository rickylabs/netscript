# AS2b Generator Brief — `@netscript/auth-kv-oauth` pure `AuthBackendPort` backend

You are a WSL Codex implementation subagent in a NetScript harness run. You implement; a separate
OpenHands session evaluates. **Production/enterprise bar: no stubs, no silent no-ops, real
OAuth2/OIDC behavior, real crypto, real tests, gates green.** Work only in this worktree.

## Worktree / branch (already set up)

- CWD worktree: `/home/codex/repos/netscript-pt-auth-kv-oauth`
- Branch: `feat/prime-time/auth-kv-oauth` (HEAD at umbrella `7c063240`, off `feat/prime-time/auth`).
  Upstream is intentionally UNSET.
- This branch already contains `packages/plugin-auth-core/` (the AS1 foundation you build against).

## What this slice is

A NEW package `packages/auth-kv-oauth`: a pure, self-hosted KV-backed OAuth2/OIDC **Relying-Party**
backend that implements `AuthBackendPort` from `@netscript/plugin-auth-core`. It absorbs the
PLAN-EVAL-PASS'd Track-4 plan, with TWO rescopes vs that plan (read carefully — these override it):

1. **It implements the full `AuthBackendPort`** (name + providers/sessions/crypto/principalMapper +
   `authenticate`), NOT a bare `AuthenticatorPort`. The Track-4 plan predates the AS1 contract.
2. **NO HTTP surface.** The Track-4 plan's S5 `mountKvOAuthHandler` (Hono) is DROPPED. This backend
   is pure and non-HTTP. The unified `/auth/*` HTTP surface lives in the `plugins/auth` oRPC service
   (a later slice, AS3). You DO build the flow primitives (signIn/handleCallback/signOut/getSessionId
   via a `createKvOAuthFlow`) and export them as plain backend functions so AS3 can drive the OAuth
   redirect dance — but you expose NO Hono app, NO route handlers, NO `mountKvOAuthHandler`.

## Read first (cheapest path to correctness)

1. `AGENTS.md`.
2. The absorbed plan + API + research (your detailed spec — but apply the two rescopes above):
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/plan.md`
     (locked decisions LD-1..LD-12, slice breakdown S1–S6, gates, accepted debt, M1–M4 corrections).
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/api-design.md`
     (treat its §"Dual surface" item 5 / any `mountKvOAuthHandler` as REMOVED per rescope #2).
   - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/research.md`.
3. The AS1 contract you must satisfy — read in full:
   - `packages/plugin-auth-core/src/ports/mod.ts` — `AuthBackendPort` + sub-ports
     (`AuthProviderRegistryPort`, `AuthSessionStorePort`, `AuthSessionCryptoPort`,
     `AuthPrincipalMapperPort`), `AuthSessionLookup`, `AuthSessionCreateInput`,
     `AuthProviderDescriptor`, `createAuthBackendRegistry`.
   - `packages/plugin-auth-core/src/domain/mod.ts` — `AuthSession`/`AuthUser`/`Account`/
     `AuthSessionPrincipalMapping` and the `@netscript/service/auth` re-exports.
   - `packages/plugin-auth-core/src/testing/mod.ts` — use any `AuthBackendPort` conformance harness.
4. The program-plan AS2b bullet + Open-Q #4 (kv-oauth HTTP → AS3):
   `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/program-plan.md`.
5. Sibling precedent for package shape only (Track-2 adapters now on this branch):
   `packages/auth-workos/`, `packages/auth-better-auth/`.

## Scope — build `packages/auth-kv-oauth` (additive; touch nothing else)

Per the Track-4 plan's slice breakdown, adapted:

- **Provider registry** (LD-6): one generic `defineOAuthProvider` builder + a preset registry.
  v1 first-class: GitHub, Google, GitLab, Discord, Slack, Spotify, Facebook, Twitter/X. Tier-2:
  Auth0, Okta, AWS Cognito, Azure AD, Logto, Clerk. Generic-only recipes: Azure ADB2C, Notion,
  Dropbox, Patreon. OIDC presets prefer discovery (`issuer`); endpoints overridable; no
  version-pinned literals. This becomes the backend's `providers: AuthProviderRegistryPort`.
- **`KvOAuthStore`** over `@netscript/kv` `WatchableKv` (LD-3): typed key tuples, txn + session
  namespaces, TTL, `atomic()` versionstamp CAS for refresh rotation. Never raw `Deno.openKv`. This
  becomes the backend's `sessions: AuthSessionStorePort`.
- **Crypto** (LD-11): AES-256-GCM token-at-rest sealing; key injected as `CryptoKey`/`ArrayBuffer`
  or resolved from required env `NETSCRIPT_AUTH_KV_OAUTH_KEY` (32-byte base64url). Sealed values
  carry a `keyId` prefix (forward-compat seam; active rotation deferred to debt). No key ⇒ hard
  startup error, never silent plaintext. This becomes `crypto: AuthSessionCryptoPort`.
- **Cookies** (LD-7): `__Host-`/HttpOnly/Secure/SameSite=Lax; `isHttps` from forwarded-proto/config.
- **Flow** (LD-5 minus HTTP): `createKvOAuthFlow` on `jsr:@panva/oauth4webapi@^3.8.6` (LD-1; inline
  JSR specifier, re-confirm latest stable via `deno task deps:latest` at impl). Implements
  signIn / handleCallback / signOut / getSessionId: discovery, PKCE S256, exact state, RFC 9207 iss,
  OIDC nonce + id_token validation, code grant, returnTo open-redirect allowlist, session +
  sealed-token KV write. Exported as plain functions (NOT HTTP handlers) for AS3 to drive.
- **Backend factory** `createKvOAuthBackend(...)` returning `AuthBackendPort`:
  - `name: 'kv-oauth'`.
  - `authenticate(request)`: cookie → KV session → near-expiry refresh (engine) → CAS rotate →
    `Principal{scheme:'custom'}` via the principal mapper → `AuthnResult` with `setCookies` on
    rotation. Refresh-reuse detection (revoke + reject).
  - `providers`/`sessions`/`crypto`/`principalMapper`: wired to the registry/store/crypto/mapper
    above. Implement every sub-port operation with REAL behavior (this backend owns its store, so
    `createSession`/`refreshSession`/`revokeSession`/`getSession` are all genuinely implementable —
    do not throw "unsupported" here; that escape hatch is for the IdP-managed backends, not this one).
- **MIT attribution** (LD-10): credit the Deno authors for the endpoint catalog + `getRequiredEnv`
  pattern reimplemented (NOT wrapped) from `deno_kv_oauth`.
- **README**: provider recipes (incl. generic-only), security notes, MIT attribution. Do NOT
  document any Hono mount or HTTP route surface (there is none).

Security baseline must be real and certified by tests (LD-7): PKCE S256 always; exact state; iss
check; OIDC nonce + id_token validation; AES-256-GCM at rest; refresh rotation + reuse detection;
`__Host-` cookies; HTTPS enforced (no `allowInsecureRequests` outside dev test).

RP-only for v1 (LD-12): relying-party client only; no inbound bearer-JWT resource-server validation.
Public PKCE-only clients supported via `clientAuthMethod:'none'`. PAR/DPoP deferred to opt-in (debt).

## Tests (conformance-style, real)

Per Track-4 S2–S4 + S6, plus AS1 conformance: KV round-trip, single-use txn, CAS rotation,
encrypt/decrypt, cookie attrs (incl. `__Host-` + proxy case); flow against a stubbed AS (success,
state mismatch, nonce mismatch, error param, open-redirect rejected, expired txn); authenticator
principal mapping, refresh rotation, refresh-reuse detection, session-missing reason, setCookies
emission; and the full `AuthBackendPort` surface (providers list/get, sessions CRUD, crypto
open/seal, principalMapper). If `plugin-auth-core/src/testing/mod.ts` has a backend conformance
harness, run this backend through it. **Consumer-import check (Track-4 M3):** a throwaway downstream
module importing the public `mod.ts` surface, type-checking under `isolatedDeclarations` (delete
after).

## Gates (run all; capture verbatim exit codes; all must be 0)

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/auth-kv-oauth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/auth-kv-oauth --ext ts,tsx
deno test --unstable-kv --allow-all packages/auth-kv-oauth
deno check --unstable-kv packages/auth-kv-oauth/mod.ts
deno publish --dry-run    # isolated-declarations clean; --allow-dirty if .llm/tmp is dirty
```

Doc-lint the FULL export map (every subpath in deno.json `exports`), not just `mod.ts` — sibling
re-exports must not false-flag as private-type-ref. Catalog law (LD-9): the engine is a `jsr:` inline
specifier — NOT a `catalog:`/`package.json` dep. Do NOT touch root `deno.json` catalog,
`aspire/src/public/mod.ts`, `scaffold-versions.ts`, or any version pin (LD-8). `deno.lock` will gain
the new package's workspace entry — that is expected and correct; do NOT hand-edit it, do NOT run
`deno cache --reload`, do NOT delete it.

## Commit / push / done

- ONE cohesive commit (the slice; you MAY combine the Track-4 S1+S2 etc. — it is one PR). Subject e.g.
  `feat(auth-kv-oauth): pure KV-backed OAuth2/OIDC AuthBackendPort backend`. Body: note RP-only v1,
  no-HTTP (HTTP moves to plugin AS3), and deferred debt (PAR/DPoP, active key-rotation, tier-2/generic
  presets, optional global-logout index).
- Before committing: `export MSYS_NO_PATHCONV=1`.
- Push with an EXPLICIT refspec (never a bare `git push`):
  `git push origin HEAD:refs/heads/feat/prime-time/auth-kv-oauth`
- You push via SSH and are GitHub-API-blind: do NOT open a PR or comment, do NOT embed any token —
  the supervisor mirrors the PR, dispatches IMPL-EVAL, and merges.
- When done, print: commit SHA, clean `git status`, the gate exit-code table, the `deno task
  deps:latest` confirmation of the engine pin, and the push result.

## Definition of done

`packages/auth-kv-oauth` exists as a pure non-HTTP `AuthBackendPort` backend with real OAuth2/OIDC RP
behavior, encrypted token-at-rest, full security baseline certified by tests, every `AuthBackendPort`
sub-port really implemented, all gates exit 0, publish:dry-run clean, single commit pushed by explicit
refspec. No Hono, no route handlers, no token embedded.
