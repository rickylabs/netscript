# Context Pack: S5 Hono context typed seam

## Current State

Implementation is complete and ready for separate IMPL-EVAL. The branch is `feat/prime-time/auth-s5-hono-context` and the run directory is `.llm/tmp/run/feat-prime-time-auth-s5-hono-context--impl/`.

## Completed

- Activated/read required skills and relevant harness/doctrine/JSR/tooling guidance.
- Added Hono `ContextVariableMap` augmentation in `packages/service/src/auth/hono-context.ts`.
- Removed all matching `as never`, `as unknown as`, `as any`, and `as <Capitalized>` assertions under `packages/service/src`.
- Aligned service middleware, handler, error, not-found, CORS, and context factory types with Hono.
- Removed builder/auth mount casts and direct `c.get()` casts.
- Kept root `ServiceRouter` structural for doc-lint/public compatibility and added an internal oRPC router guard instead of adapter casts.
- Made `constantTimeCredentialEquals` private.
- Verified README auth quick start and auth response docs were already present.
- Ran all requested service-scoped gates and JSR gates successfully.

## Gate Evidence

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx` — PASS, 34 files, 0 diagnostics.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx` — PASS, 34 files, 0 findings.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx` — PASS, 34 files, 0 findings.
- `rtk proxy deno test --unstable-kv --allow-all packages/service` — PASS, 57 passed, 0 failed.
- `deno doc --lint packages/service/mod.ts` — PASS.
- `deno doc --lint packages/service/src/auth/mod.ts` — PASS.
- `cd packages/service && rtk proxy deno publish --dry-run --allow-dirty` — PASS, no slow-type warnings.
- `rtk rg -n "as never\|as unknown as\|as any\| as [A-Z]" packages/service/src` — PASS, no matches.
- `git diff --quiet -- deno.lock` — PASS, unchanged.

## Files Changed

- `packages/service/src/auth/hono-context.ts`
- `packages/service/src/auth/auth-middleware.ts`
- `packages/service/src/auth/static-credential-authenticator.ts`
- `packages/service/src/auth/trusted-header-authenticator.ts`
- `packages/service/src/builder/service-builder-impl.ts`
- `packages/service/src/builder/service-listener.ts`
- `packages/service/src/diagnostics/database-connectivity.ts`
- `packages/service/src/primitives/handlers.ts`
- `packages/service/src/primitives/health.ts`
- `packages/service/src/primitives/openapi.ts`
- `packages/service/src/primitives/orpc-router.ts`
- `packages/service/src/types.ts`
- `packages/service/mod.ts`
- `packages/service/deno.json`
- service tests for auth/handler/health/type assignability

## Notes For IMPL-EVAL

- Do not treat the pre-existing modified `.llm/tmp/run/openhands/**/request.md` files as part of this slice; they were dirty before implementation and were not touched intentionally.
- No self-certification has been performed; this is generator evidence only.
