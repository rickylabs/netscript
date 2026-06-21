# IMPL-EVAL: AS2b — auth-kv-oauth pure KV-backed OAuth2/OIDC AuthBackendPort

**PR #88** — `feat(auth-kv-oauth): pure KV-backed OAuth2/OIDC AuthBackendPort backend`

## Verdict: **PASS** (with noted debt)

---

## Gate Results

| Gate | Command | Exit Code |
|------|---------|-----------|
| `deno check` (scoped) | `run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx` | **0** |
| `deno lint` (scoped) | `run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx` | **0** |
| `deno fmt --check` (scoped) | `run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx` | **0** |
| `deno test` | `deno test --unstable-kv --allow-all packages/auth-kv-oauth` | **0** (8 passed) |
| `deno check mod.ts` | `deno check --unstable-kv packages/auth-kv-oauth/mod.ts` | **0** |
| `deno publish --dry-run` | `deno publish --dry-run --allow-dirty` | **0** |

**Tests (8/8 pass):**
- provider presets normalize descriptors and enforce client auth shape
- crypto seals and opens token payloads with a key id prefix
- cookies use `__Host`, HttpOnly, Secure and proxy-derived HTTPS
- KV store round-trips sessions, consumes txns once, and CAS-rotates
- flow rejects open redirects before creating an authorization redirect
- flow performs sign-in and callback with single-use state
- backend implements providers, sessions, crypto, principal mapping, and authenticate
- backend refreshes near-expiry sessions and detects refresh-token reuse

---

## Boundary & Lock Hygiene

| Check | Result |
|-------|--------|
| All changes under `packages/auth-kv-oauth` | ✓ 13 files, +1838 lines (all new) |
| `deno.lock` change scope | ✓ Only new-workspace entry + `@panva/oauth4webapi@3.8.6` |
| Root `deno.json` / catalog untouched | ✓ No change |
| `packages/aspire` untouched | ✓ |
| `scaffold-versions.ts` untouched | ✓ |
| `packages/plugin-auth-core` untouched | ✓ |
| Engine dep is `jsr:` inline specifier | ✓ `jsr:@panva/oauth4webapi@^3.8.6` (not `catalog:`) |
| No CRLF churn / junk files | ✓ All LF |

---

## Conformance & Rescope

**AuthBackendPort surface:** `createKvOAuthBackend` returns a full port:
- `name` ✓ (`'kv-oauth'`)
- `providers` ✓ (registry with `listProviders` + `getProvider`)
- `sessions` ✓ (`getSession`, `createSession`, `refreshSession`, `revokeSession`)
- `crypto` ✓ (`sealSessionToken`, `openSessionToken`)
- `principalMapper` ✓ (`mapSessionToPrincipal`)
- `authenticate` ✓ (cookie → session lookup → optional refresh → principal)

**No unsupported-error stubs or no-ops** ✓ — confirmed via grep, no `AuthBackendOperationUnsupportedError`.

**NO-HTTP rescope** ✓:
- No `hono` / `Hono` import anywhere in the package
- No `mountKvOAuthHandler` or route handlers
- Flow primitives (`signIn`, `handleCallback`, `signOut`) are plain async functions returning `Response`
- Comment-only mention of "routes" in `flow.ts` line 53 ("without mounting HTTP routes") — not an import

**Conformance harness:** `packages/plugin-auth-core/src/testing/mod.ts` contains only fixture builders (`buildAuthUser`, `buildAuthSession`), no `AuthBackendPort` conformance harness. The package's own test file covers all port operations.

---

## Security Assessment

| Control | Status | Notes |
|---------|--------|-------|
| PKCE S256 always-on | ✅ | `code_challenge_method: 'S256'` hardcoded in `signIn`; `generateRandomCodeVerifier()` |
| Exact-state validation | ✅ | `validateAuthResponse(as, client, url, txn.state)` from `@panva/oauth4webapi` |
| Single-use txn (atomic + CAS) | ✅ | `takeTxn` uses `kv.atomic()` with versionstamp check → delete |
| RFC 9207 `iss` param check | ⚠️ DEBT | Authorization response `iss` query param not validated against `txn.issuer`. Defense-in-depth gap; state + PKCE bound the response. |
| OIDC nonce + id_token | ✅ impl | `generateRandomNonce()` for OIDC; `expectedNonce` + `requireIdToken` passed to `processAuthorizationCodeResponse`; `getValidatedIdTokenClaims()` extracts claims |
| OIDC nonce test coverage | ⚠️ DEBT | **No test exercises OIDC mode.** Tests use a stub `oauth`-kind provider (no issuer set). Nonce gen + validation code is correctly wired via `@panva/oauth4webapi` but untested end-to-end. |
| AES-256-GCM at rest | ✅ | 32-byte key enforced; `NETSCRIPT_AUTH_KV_OAUTH_KEY` env required; no silent plaintext fallback |
| Refresh token rotation | ✅ | New refresh token stored on successful refresh; `refreshTokenHash` tracked |
| Refresh-token reuse detection | ✅ | Hash mismatch → session immediately deleted → `kv_oauth_refresh_failed` (tested) |
| `__Host-` cookies | ✅ | Default `__Host-ns_session`; `assertCookiePolicy` enforces `Path=/`, no `Domain`, HTTPS |
| HTTPS enforcement | ✅ | `assertHttps` throws `https_required` unless `allowInsecureRequests: true` (test-only) |
| Open redirect protection | ✅ | `validateReturnTo` with origin check + `allowedReturnTo` allowlist (tested) |

### Noted Debt (non-blocking)

1. **OIDC nonce/id_token test coverage** — The OIDC code path (`generateRandomNonce`, `expectedNonce`, `requireIdToken`) is correctly implemented via `@panva/oauth4webapi` but has zero direct end-to-end test coverage. The test provider fixture is `kind: 'oauth'`, never exercising the `kind: 'oidc'` branch. A follow-up test should add an OIDC-kind provider fixture (with issuer) validating nonce round-trip and `id_token` claim extraction.

2. **RFC 9207 `iss` response parameter** — The callback URL's `iss` query parameter (RFC 9207) is stored in the txn but never validated on callback. `@panva/oauth4webapi`'s `validateAuthResponse` accepts an `expectedIssuer` option that is not passed. State + PKCE bound the response in practice; this is defense-in-depth.

---

## Summary

AS2b lands a fully-implemented, security-first pure KV-backed OAuth2/OIDC `AuthBackendPort` backend with zero HTTP framework coupling. All 6 quality gates exit 0. Boundary is clean: only `packages/auth-kv-oauth` and a minimal `deno.lock` entry. PKCE, single-use txn, AES-256-GCM at rest, refresh rotation with reuse detection, `__Host-` cookies, and HTTPS enforcement are all implemented and exercised by tests. Two moderate debt items (OIDC nonce test coverage and RFC 9207 `iss` validation) are noted for follow-up — neither blocks PASS given the code correctness and library-level delegation.
