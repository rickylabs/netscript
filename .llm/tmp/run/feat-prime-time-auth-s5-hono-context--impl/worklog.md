# Worklog: S5 Hono context typed seam

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-prime-time-auth-s5-hono-context--impl` |
| Branch | `feat/prime-time/auth-s5-hono-context` |
| Archetype | `ARCHETYPE-4 - Public DSL / Builder` |
| Scope overlays | `SCOPE-service` |
| Phase | `implement` |

## Design

### Public Surface

- `createService(...).withAuthn(...).withAuthz(...)` continues as the service auth builder surface.
- `ServiceContext`, `ServiceMiddleware`, `ServiceHandler`, `ServiceErrorHandler`, and `CorsOptions` now align with Hono's public handler/context types instead of local dual-call structural shims.
- Root `mod.ts` now exports the auth option and port types referenced by the builder surface so `deno doc --lint packages/service/mod.ts` has a complete public type graph.
- `constantTimeCredentialEquals` is private to the static credential authenticator; it is an implementation detail, not a reusable public primitive.

### Domain Vocabulary

- Hono `ContextVariableMap` carries `principal` and `logger` variables for `c.get()`/`c.set()`.
- Service router remains a package-owned structural `Record<string, unknown>` public type; the oRPC boundary narrows it internally before constructing oRPC handlers.
- Fetch handler results are a discriminated union so `matched: false` accurately permits `response: undefined`.

### Ports

- `AuthenticatorPort` and `AuthorizerPort` remain the auth extension ports.
- No new third-party provider dependency was added.

### Constants

- Existing auth prefix defaults remain unchanged: `/api` guarded and `/health` anonymous.

### Commit Slices

| # | Slice | Gate |
| --- | --- | --- |
| 1 | Type Hono ContextVariableMap and align service/Hono handler types | package check/lint/fmt, service tests, doc lint, publish dry-run, zero-cast grep |

### Deferred Scope

- No scaffold/runtime E2E; the slice is `packages/service` only and does not change scaffold output.
- No provider adapter work.

### Contributor Path

Future service middleware should use the exported `ServiceMiddleware`/`ServiceHandler` aliases and Hono `c.get()`/`c.set()` variables directly. New Hono context variables belong in `src/auth/hono-context.ts` or a similarly named ambient seam module imported by the files that need it.

## Progress Log

| Time | Step | Notes |
| --- | --- | --- |
| 2026-06-20 | bootstrap | Loaded requested skills: `netscript-harness`, `netscript-doctrine`, `jsr-audit`, `netscript-deno-toolchain`, `netscript-tools`, `netscript-pr`, `codex-wsl-remote`, and `rtk`. Loaded harness activation/run-loop, archetype 4, service overlay, gate matrix, public-surface doctrine, folder/composition/fitness doctrine, service debt entries, and prior service-auth-seam evaluator artifacts. |
| 2026-06-20 | implementation | Added `src/auth/hono-context.ts` with Hono `ContextVariableMap` augmentation for `principal` and `logger`. Imported it from auth middleware, builder, and public service types. |
| 2026-06-20 | implementation | Replaced local handler/middleware/CORS structural shims with Hono-compatible exported aliases and removed builder/auth mount casts. |
| 2026-06-20 | implementation | Aligned not-found/error/health/OpenAPI handler factories with Hono handler return types; tests now mount handlers through real Hono apps instead of fabricated contexts. |
| 2026-06-20 | implementation | Removed casts from service listener address normalization, diagnostics metadata/code reads, trusted-header claims parsing, and oRPC primitive handler construction. |
| 2026-06-20 | implementation | Kept root `ServiceRouter` package-owned and structural for doc-lint/public compatibility; added internal oRPC router narrowing at the adapter boundary with no assertions. |
| 2026-06-20 | implementation | Made `constantTimeCredentialEquals` private; public behavior remains covered by authenticator tests. |
| 2026-06-20 | docs | Verified `packages/service/README.md` already contains the requested auth quick start, `/api` protected and `/health` anonymous defaults, provider-router `allowAnonymous` example, and 401/403 response descriptions from the prior auth seam. |

## Gate Results

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx` | PASS | Exit 0; 34 files, 0 diagnostics. |
| lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx` | PASS | Exit 0; 34 files, 0 findings. |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx` | PASS | Exit 0; 34 files, 0 findings. |
| service tests | `rtk proxy deno test --unstable-kv --allow-all packages/service` | PASS | Exit 0; 57 passed, 0 failed. |
| root doc lint | `deno doc --lint packages/service/mod.ts` | PASS | Exit 0; checked 1 file. |
| auth doc lint | `deno doc --lint packages/service/src/auth/mod.ts` | PASS | Exit 0; checked 1 file. |
| publish dry-run | `cd packages/service && rtk proxy deno publish --dry-run --allow-dirty` | PASS | Exit 0; checked `mod.ts` and `src/auth/mod.ts`; no slow-type warnings; dry run complete. |
| zero-cast proof | `rtk rg -n "as never\|as unknown as\|as any\| as [A-Z]" packages/service/src` | PASS | Exit 1 with no matches. |
| lock hygiene | `git diff --quiet -- deno.lock` | PASS | Exit 0; `deno.lock` unchanged. |

## Decisions

| Decision | Reason |
| --- | --- |
| Keep `constantTimeCredentialEquals` private | It supports one authenticator implementation and is not a documented reusable security primitive. |
| Keep `ServiceRouter` structural at the public boundary | oRPC's exported router aliases are rejected by `deno doc --lint` as private type references and break the existing empty-router compatibility test. The package-owned public type remains stable; only the internal oRPC adapter boundary narrows it. |
| Export auth option/port types from root `mod.ts` | Root builder APIs reference those types, and root doc-lint requires the full type graph to be public from the root entrypoint. |

## Drift

See `drift.md`. No stop-level drift was introduced.

## Handoff Notes

- IMPL-EVAL should inspect `packages/service/src/auth/hono-context.ts`, `packages/service/src/types.ts`, `packages/service/src/builder/service-builder-impl.ts`, and `packages/service/src/primitives/orpc-router.ts` first.
- The final zero-cast grep is package-wide for `packages/service/src`, not only builder/auth.
