# Auth S4 Backends Worklog

## Design

- **Public surface:** `createHmacSessionTokenCrypto(secret)` and `AuthBackendOperationUnsupportedError` are added to `@netscript/plugin-auth-core`; `createWorkosBackend()` and `createBetterAuthBackend()` keep returning `AuthBackendPort`; both backend packages re-export the core error class.
- **Domain vocabulary:** backend-owned opaque session token, unsupported backend operation, better-auth session payload, NetScript principal mapping.
- **Ports:** reuse `AuthSessionCryptoPort` from `plugin-auth-core`; no new adapter port is introduced.
- **Constants:** backend names remain `workos` and `better-auth`; HMAC uses WebCrypto `HMAC` + `SHA-256`.
- **Commit slices:** one implementation slice covering shared crypto/error lift, better-auth type narrowing, principal convergence, docs/tests, and package-scoped gates.
- **Deferred scope:** `plugins/auth` composition defaults and hard-coded test key cleanup are out of this slice.
- **Contributor path:** shared backend crypto/error taxonomy lives in `packages/plugin-auth-core/src/ports/mod.ts`; backend adapters consume the port surface from their single backend file.

## Evidence

- 2026-06-20: Activated requested skills and doctrine/harness references before code edits.
- 2026-06-20: Confirmed branch `feat/prime-time/auth-s4-backends` starts at `54d6550a`; unrelated dirty OpenHands request files pre-existed and were left untouched.
- 2026-06-20: Implemented shared `createHmacSessionTokenCrypto(secret)` in `plugin-auth-core` using WebCrypto HMAC `verify`, removed both duplicated backend token crypto blocks, and removed the unverified nonce from sealed backend tokens.
- 2026-06-20: Moved `AuthBackendOperationUnsupportedError` to `plugin-auth-core` and re-exported it through both backend packages.
- 2026-06-20: Narrowed `auth-better-auth` public options away from `& Record<string, unknown>`, removed retained assertions in the backend packages, removed the dead `BetterAuthSessionLookupResult`, and converged better-auth principal mapping on the canonical claim bag.
- 2026-06-20: Removed duplicate `Service*` alias re-export blocks from both backend package roots.

## Gate Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| `run-deno-check` auth-workos | PASS | `filesSelected=6`, `totalOccurrences=0` |
| `run-deno-check` auth-better-auth | PASS | `filesSelected=6`, `totalOccurrences=0` |
| `run-deno-check` plugin-auth-core | PASS | `filesSelected=17`, `totalOccurrences=0` |
| `run-deno-lint` auth-workos | PASS | `filesSelected=6`, `totalOccurrences=0` |
| `run-deno-lint` auth-better-auth | PASS | `filesSelected=6`, `totalOccurrences=0` |
| `run-deno-lint` plugin-auth-core | PASS | `filesSelected=17`, `totalOccurrences=0` |
| `run-deno-fmt` auth-workos | PASS | `filesSelected=6`, `findings=0` |
| `run-deno-fmt` auth-better-auth | PASS | `filesSelected=6`, `findings=0` |
| `run-deno-fmt` plugin-auth-core | PASS | `filesSelected=17`, `findings=0` |
| auth-workos tests | PASS | `8 passed, 0 failed` |
| auth-better-auth tests | PASS | `8 passed, 0 failed` |
| plugin-auth-core tests | PASS | `22 passed, 0 failed` |
| auth-workos doc-lint | PASS | `deno doc --lint packages/auth-workos/mod.ts` checked 1 file |
| auth-better-auth doc-lint | PASS | `deno doc --lint packages/auth-better-auth/mod.ts` checked 1 file |
| plugin-auth-core doc-lint | PASS | full export set checked 8 files |
| auth-workos publish dry-run | PASS | clean file list, no slow-type warnings |
| auth-better-auth publish dry-run | PASS | clean file list, no slow-type warnings |
| plugin-auth-core publish dry-run | PASS | clean file list, no slow-type warnings |
