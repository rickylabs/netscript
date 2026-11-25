# Worklog — RFC B: oRPC v2 readiness and migration strategy

- **Date:** 2026-11-25
- **Tracking issue:** `#2672`
- **Base `main` SHA:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Companion RFC:** `#2671` (oRPC-native procedure pipeline and router client)

## Owner Mandate (verbatim, private prefix elided for public repository)

> "I'd put a neon lane to evaluate the migration to orpc router client including auth and others and also being orpc V2 ready (two RFC) reviewer Fable 5.2 including what it implies for our downstream consumers (without citing […] )"

*(Note: the private repository prefix in the owner's prompt is elided as `[…]` for public-repo hygiene, matching existing RFC worklog precedent.)*

## Evidence Ledger

### 1. Upstream Verification (2026-11-25)

- **npm registry dist-tags verified directly against `registry.npmjs.org`:**
  - `@orpc/{client,contract,openapi,server,tanstack-query,zod,json-schema,opentelemetry,ratelimit,pino,publisher,hibernation}`: `beta = 2.0.0-beta.53` (published 2026-11-23), `latest = 1.16.6` (published 2026-11-25).
  - `@orpc/otel`: `latest = 1.16.6`, **no `beta` tag** (superseded by `@orpc/opentelemetry@2.0.0-beta.53`).
- **GitHub releases verified on `middleapi/orpc` up to `v2.0.0-beta.53`:** noted recent churn (#2523 readonly `ORPCError.code`/`data`, #2525 `RetryAfterLinkPlugin.shouldRetry`, #2533 `TimeoutError`/`ConnectionClosedError` on MessagePort/WS links, #2514 custom refusal errors, #2544 dedupe ignoring trace headers).
- **Official v1→v2 migration guide read in full:** `https://orpc.dev/docs/migrations/from-v1` (1,278 lines), plus `rpc-handler`, `rpc-link`, `error-handling`, `middleware`, `context`, and `integrations/opentelemetry`.

### 2. Repository `@orpc/*` Inventory (`main` `87965d800`)

- **179 non-`.llm`, non-lock files** across 21 workspace groups (plus 8 lockfiles; 19 `@orpc/*` npm entries in root `deno.lock`, including stale `1.15.0` pins for `@orpc/client` and `@orpc/tanstack-query`).
- Verified 11 workspace `deno.json` manifests repeat explicit `npm:@orpc/*@^1.15.5` instead of `catalog:`, and `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` pins `@1.15.5` inline.
- Verified no top-level `samples/` or `examples/` directory exists; showcase/sample templates live in `packages/cli/src/kernel/assets/showcase/`, `packages/cli/tests/showcase-ai/`, `packages/cli/e2e/fixtures/`, and `packages/bench/tasks/`.

### 3. Throwaway `2.0.0-beta.53` Prototype Execution & Cleanup

- Created detached throwaway worktree at `87965d800`, bumped 13 manifests (`deno.json` + 11 workspace `deno.json` + `packages/telemetry/package.json`) to `2.0.0-beta.53` (`@orpc/otel` → `@orpc/opentelemetry` + `@orpc/json-schema`), ran `mise exec -- deno install`.
- **Compiler fallout (`deno check --unstable-kv`):** **411 TypeScript diagnostics across 13/13 failing target groups**, plus **37 errors** in `packages/cli/bin/netscript.ts`.
- **Runtime fallout (`deno test --no-check --allow-all --unstable-kv`):**
  - `packages/contracts/tests`: 18 passed | 5 failed (`TypeError: oc.$meta is not a function`).
  - `packages/logger/tests/orpc-plugin_test.ts`: 1 passed | 4 failed (`TypeError: Cannot read properties of undefined (reading 'routingInterceptors')` — exposed v2's return-based `StandardHandlerPlugin.init(options)` requirement!).
  - `packages/fresh/.../bind-desktop-rpc-window_test.ts`: 0 passed | 1 failed (`SyntaxError: isContractProcedure` missing from `@orpc/contract`).
  - `packages/{telemetry,service,sdk,plugin,plugin-auth-core}`: immediate `@orpc/otel` import failure; secondary pass swapping only `@orpc/otel` → `@orpc/opentelemetry` exposed `ORPCError` missing from `@orpc/contract`, `isContractProcedure` missing, `@orpc/zod/zod4` `ERR_PACKAGE_PATH_NOT_EXPORTED`, and `fallbackContractConfig` missing.
- **Direct `.d.ts` & runtime probe on `2.0.0-beta.53`:**
  - Confirmed `ORPCError` retains `defined: boolean` at runtime (`toJSON: { defined, code, message, data }`) while dropping `status` (`"status" in err === false`), uncovering the silent `Extract<TError, DefinedErrorLike>` → `never` narrowing hazard in `packages/sdk/src/client/errors.ts`.
  - Confirmed `safe()` 4-tuple changed index 2 from `isDefined: boolean` to `definedError | null` (and removed `isDefined` property).
  - Confirmed `@orpc/zod@2.0.0-beta.53` exports `.` only (deleting `./zod4` and `ZodSmartCoercionPlugin`).
- Recorded full diff stats and fallout breakdown in `evidence/v2-beta53-prototype-summary.md` and deleted the throwaway worktree via `git worktree remove --force`.

## Key Decisions

1. **Recommendation: Three-phase staged readiness** (Phase 0 v1 prep → Phase 1 weekly dual-line shadow CI → Phase 2 coordinated `2.0.0` GA cut-over with codemod) — never cut over `main` during beta churn.
2. **Coordinate with RFC A (`#2671`):** Land RFC A Stage 1 on v1 (eliminating `contract-procedure-index.ts`'s 4 v2-broken imports) and align RFC A Stage 2 (`service.createRouterClient`) with RFC B Phase 2 so downstream applications migrate once.
3. **Preserve NetScript-owned security & error guards:** Explicitly retain `redirect: 'manual'`/`'error'` on `http-client-link.ts`, remove handler-level `CORSPlugin` before v2's `origin: '*'` default lands, and relax `DefinedErrorLike` in `@netscript/sdk/client` before v2 drops `ORPCError.status`.

## Validation Table

| Check | Command | Result |
| --- | --- | --- |
| Throwaway `2.0.0-beta.53` prototype & removal | `git worktree remove --force ... && git worktree list` | PASS (removed cleanly; summary captured in `evidence/v2-beta53-prototype-summary.md`) |
| Main & RFC B branches free of lock/dep edits | `git status -s` | PASS (docs & `.llm/runs/` only) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-v2-readiness.md --pretty` | PASS (`broken-links=0 broken-anchors=0`) |
| Privacy & closing-keyword scan | Pattern scan on all added files | PASS (`0 hits`) |
