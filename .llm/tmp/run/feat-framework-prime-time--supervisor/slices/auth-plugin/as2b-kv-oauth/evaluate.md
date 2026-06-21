# AS2b IMPL-EVAL — auth-kv-oauth pure KV-backed OAuth2/OIDC AuthBackendPort backend

- **Verdict:** PASS (with noted debt)
- **Evaluator:** OpenHands, `openrouter/qwen/qwen3.7-max`, run `27874924828`
- **Verdict comment:** PR #88 comment 4758646474
- **Slice commit:** `5f17ca9b` (branch `feat/prime-time/auth-kv-oauth`)
- **Merged:** `6bc168e0` (merge commit into `feat/prime-time/auth`; #88 closed; umbrella tip)

## Gate → exit table (evaluator-run, matches supervisor pre-verify)

| Gate | exit |
| --- | --- |
| run-deno-check auth-kv-oauth | 0 |
| run-deno-lint auth-kv-oauth | 0 |
| run-deno-fmt auth-kv-oauth | 0 |
| deno test --unstable-kv auth-kv-oauth | 0 — 8 passed / 0 failed |
| deno check auth-kv-oauth/mod.ts | 0 |
| deno publish --dry-run --allow-dirty | 0 |

## Boundary / conformance / rescope

- All changes under `packages/auth-kv-oauth` (13 files +1838); `deno.lock` only gained the new-package
  workspace entry + `@panva/oauth4webapi@3.8.6`. No touch to root deno.json/catalog, aspire,
  scaffold-versions, plugin-auth-core. Engine is a `jsr:` inline specifier (catalog law honored).
- `createKvOAuthBackend` returns the full `AuthBackendPort`; every sub-port op really implemented
  (backend owns its store) — NO `AuthBackendOperationUnsupportedError` / no-op (confirmed by grep).
- NO-HTTP rescope confirmed: no hono/Hono import, no mountKvOAuthHandler, no route handlers; flow
  primitives (signIn/handleCallback/signOut) are plain async functions. (plugin-auth-core testing/
  mod.ts has only fixture builders, no backend conformance harness; package's own tests cover ports.)

## Security assessment (evaluator)

Implemented + tested: PKCE S256 always; exact-state; single-use txn (atomic+CAS); OIDC nonce + id_token
wired via @panva/oauth4webapi; AES-256-GCM at rest (no silent plaintext fallback, key required);
refresh rotation + refresh-reuse detection (hash mismatch → session delete → kv_oauth_refresh_failed,
tested); `__Host-` cookies; HTTPS enforced (allowInsecureRequests test-only); open-redirect allowlist.

## Debt recorded (non-blocking, accepted at PASS)

1. **OIDC nonce/id_token e2e test coverage** — the OIDC branch is correctly wired but untested e2e
   (test provider fixture is `kind:'oauth'`, never exercises `kind:'oidc'`). Add an OIDC-kind fixture
   with issuer to validate nonce round-trip + id_token claim extraction.
2. **RFC 9207 `iss` response-param validation** — callback `iss` query param is stored in the txn but
   not passed as `expectedIssuer` to `validateAuthResponse`. Defense-in-depth gap; state + PKCE bind
   the response in practice.
3. (from plan) PAR/DPoP opt-in, active key-rotation, tier-2/generic presets, optional global-logout
   index — all v1-deferred per LD-12/plan.

See `.llm/harness/debt/arch-debt.md` (AS2B-KV-OAUTH-DEBT). Items 1–2 are good first follow-ups; item 1
can fold into AS3 (the oRPC service will exercise the OIDC flow end-to-end).
