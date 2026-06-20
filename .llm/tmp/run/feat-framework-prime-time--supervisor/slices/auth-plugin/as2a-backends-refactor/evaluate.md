# AS2a IMPL-EVAL — auth-workos + auth-better-auth → pure AuthBackendPort backends

- **Verdict:** PASS
- **Evaluator:** OpenHands, `openrouter/qwen/qwen3.7-max`, run `27874783640`
- **Verdict comment:** PR #87 comment 4758622675
- **Slice commit:** `59372fdf` (branch `feat/prime-time/auth-backends-refactor`)
- **Merged:** `0d144ffc` (merge commit into `feat/prime-time/auth`; #87 closed)

## Gate → exit table (evaluator-run, matches supervisor pre-verify)

| Gate | exit |
| --- | --- |
| run-deno-check auth-workos | 0 |
| run-deno-check auth-better-auth | 0 |
| run-deno-lint auth-workos | 0 |
| run-deno-lint auth-better-auth | 0 |
| run-deno-fmt auth-workos | 0 |
| run-deno-fmt auth-better-auth | 0 |
| deno test (both pkgs) | 0 — 15 passed / 0 failed |
| deno check auth-workos/mod.ts | 0 |
| deno check auth-better-auth/mod.ts | 0 |
| deno task test (full repo) | 0 — 805 passed / 0 failed / 12 ignored |

## Boundary / conformance

- Changes confined to `packages/auth-workos`, `packages/auth-better-auth`, and deleted
  `.llm/tools/auth/gen-better-auth-prisma.ts`. No touch to `plugin-auth-core`, root deno.json/catalog,
  aspire, scaffold-versions. `deno.lock` delta = hono removal only. No CRLF/junk.
- Both packages export pure `AuthBackendPort` factories (`createWorkosBackend`,
  `createBetterAuthBackend`): name + providers + sessions + crypto + principalMapper + authenticate.
  WorkOS sealed-session/JWKS + better-auth prismaAdapter wrapping preserved.
- Dropped symbols confirmed gone (mountBetterAuthHandler, BetterAuthMountOptions, mount_test.ts, hono,
  gen-better-auth-prisma.ts); removal rationale in commit body.
- `AuthBackendOperationUnsupportedError` is a typed named error (backendName/operation/reason),
  thrown (not no-op) for the three IdP-managed session ops, asserted by tests in BOTH packages.

## Merged-tip cross-check (supervisor, at 6bc168e0 after AS2b also merged)

- check all 3 auth pkgs exit 0; test 23/0 (15 backends + 8 kv-oauth); deno.lock clean.

## Debt recorded (non-blocking, → AS3 consolidation candidate)

1. `AuthBackendOperationUnsupportedError` class is duplicated across auth-workos and auth-better-auth
   (identical shape). Consider lifting a shared class into `plugin-auth-core`.
2. `signSessionToken` / `verifySessionToken` helper pair duplicated across both backends. Candidate
   to lift into `plugin-auth-core` shared helper.

See `.llm/harness/debt/arch-debt.md` (AS2-CONSOLIDATION).
