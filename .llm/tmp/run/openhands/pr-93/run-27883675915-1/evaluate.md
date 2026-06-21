# IMPL-EVAL Evaluation — auth-kv-oauth boundary hardening

**Branch:** `feat/prime-time/auth-s3-kv-oauth`
**Commits:** `9fd701ef`, `9e0d22fa`
**Evaluator:** OpenHands (qwen 3.7 max)
**Verdict:** PASS

## Hard Check Results

### 1. Zero-cast policy
- **Command:** `grep -rn "as never|as any|as unknown as|as <PascalType>" packages/auth-kv-oauth/src/`
- **Result:** PASS — zero type assertions found in src or mod.ts
- **Evidence:** `grep` returned exit code 1 (no matches)

### 2. Structural-erasure cast gone
- **Command:** `grep packages/auth-kv-oauth/src/backend.ts "as AuthBackendPort"`
- **Result:** PASS — backend.ts line 102 declares `export interface KvOAuthBackend extends AuthBackendPort, KvOAuthFlow`
- **Evidence:** Named interface replaces intersection cast; return type is honest `Promise<KvOAuthBackend>`

### 3. Error-taxonomy honesty
- **Declared codes (errors.ts:14-24):**
  - `oauth_cookie_missing` ✓ (flow.ts:159)
  - `oauth_txn_not_found` ✓ (flow.ts:163)
  - `token_exchange_failed` ✓ (flow.ts:149)
  - `refresh_failed` ✓ (backend.ts:265, 326, 336)
  - `refresh_reuse_detected` ✓ (backend.ts:273)
  - `return_to_not_allowed` ✓ (flow.ts:331)
  - `session_not_found` ✓ (backend.ts:205, 220)
  - `configuration_error` ✓ (cookies:114, store:204/218/236/246, providers:113/116/122/135/165/183/199, backend:346, crypto:42/70/96)
  - `https_required` ✓ (cookies:120, flow:338)
- **Tests assert typed refresh codes:**
  - `auth_kv_oauth_test.ts:323` — `assertEquals(reuse.code, 'refresh_reuse_detected')`
  - `auth_kv_oauth_test.ts:360` — `assertEquals(failure.code, 'refresh_failed')`
- **Result:** PASS — all declared codes thrown on real paths; no dead codes remain

### 4. Non-null / discriminated-union narrowing
- **Command:** `grep -rn "!\." packages/auth-kv-oauth/src/`
- **Result:** PASS — zero non-null assertions found
- **Evidence:**
  - `normalizePrincipal` returns `KvOAuthPrincipal` (Principal & { scheme: "custom" }) — flow.ts:356
  - `customFetch` typed as `KvOAuthFetch` (intersection of oauth4webapi fetch types) — flow.ts:54
  - Crypto `open()` validator-backed, returns `unknown | TValue` — crypto.ts:64
  - Provider config discriminated union: `OAuthIssuerProviderConfig | OAuthEndpointProviderConfig` with client-secret requirements encoded by `clientAuthMethod` — providers.ts:40-70
  - JSON.parse replaced by `validateTokenSet` and `validateSessionTokenPayload` — store.ts:216, backend.ts:344

### 5. Scoped gates
- **Check:** `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx`
  - Result: **PASS** (exit 0) — 9 files, 0 occurrences
- **Lint:** `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx`
  - Result: **PASS** (exit 0) — 9 files, 0 findings
- **Fmt:** `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx`
  - Result: **PASS** (exit 0) — 9 files, 0 findings
- **Test:** `deno test --unstable-kv --allow-all packages/auth-kv-oauth`
  - Result: **PASS** (exit 0) — 9 passed, 0 failed

### 6. JSR §5
- **Doc lint (full export map):**
  - `deno doc --lint packages/auth-kv-oauth/mod.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/providers.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/store.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/crypto.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/cookies.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/flow.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/backend.ts` — PASS (exit 0)
  - `deno doc --lint packages/auth-kv-oauth/src/errors.ts` — PASS (exit 0)
- **Publish dry-run:** `deno publish --dry-run --allow-dirty` from `packages/auth-kv-oauth`
  - Result: **PASS** (exit 0) — "Success Dry run complete", no slow-type warnings
  - Files: README.md, deno.json, mod.ts, src/**/*.ts (10 files total)

### 7. Lock hygiene
- **Command:** `git diff -- deno.lock`
- **Result:** PASS — no changes to deno.lock

### 8. Scope verification
- **Files touched:**
  - `packages/auth-kv-oauth/mod.ts`
  - `packages/auth-kv-oauth/src/backend.ts`
  - `packages/auth-kv-oauth/src/cookies.ts`
  - `packages/auth-kv-oauth/src/crypto.ts`
  - `packages/auth-kv-oauth/src/errors.ts`
  - `packages/auth-kv-oauth/src/flow.ts`
  - `packages/auth-kv-oauth/src/providers.ts`
  - `packages/auth-kv-oauth/src/store.ts`
  - `packages/auth-kv-oauth/tests/auth_kv_oauth_test.ts`
  - `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/*.md` (4 harness artifacts)
- **Result:** PASS — only `packages/auth-kv-oauth` + slice harness artifacts; no `@netscript/cli` edits; no `plugins/auth` edits (AuthStreamSchema export gap correctly deferred)

## Drift Review

Drift recorded in `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-kv-oauth/drift.md`:

1. **refresh failures now throw typed errors** (severity: significant)
   - **Assessment:** Valid — behavioral change from `{ ok: false, reason: "..." }` to typed `KvOAuthError` throws. Tests assert both codes. Drift recorded.

2. **consumer check blocked by unrelated stream-schema mismatch** (severity: minor)
   - **Assessment:** Valid — `plugins/auth/streams/schema.ts` imports `AuthStreamSchema` not exported by `packages/plugin-auth-core`. Out of scope for this slice. No `plugins/auth` files changed.

3. **JSR runtime compatibility is not source-controllable** (severity: minor)
   - **Assessment:** Valid — JSR package settings control runtime compat, not `deno.json`. Package remains Deno-oriented by API usage.

## Verdict Rationale

All hard checks pass:
- Zero type assertions in source
- Named backend boundary interface replaces structural cast
- Error taxonomy honest (all codes thrown, tests assert refresh codes)
- Non-null assertions replaced by real narrowing
- Scoped gates green (check/lint/fmt/test)
- JSR doc-lint and publish dry-run green (no slow types)
- Lock hygiene clean
- Scope restricted to `packages/auth-kv-oauth` + harness artifacts

Drift is recorded and justified. No unrecorded doctrine violations introduced.

## Recommendations

None. Implementation is complete and aligns with approved scope.
