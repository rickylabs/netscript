# Context pack — 5d1 support spine (`@netscript/fresh`)

Run: `feat/package-quality-wave5-apps-5d1-support` (PR #34)  
Purpose: resumable summary for PLAN-EVAL and later implementation sessions.

## Branch / PR

- Branch: `feat/package-quality-wave5-apps-5d1-support`
- Base: `feat/package-quality-wave5-apps-5d-fresh`
- PR: #34

## Scope

Support spine for `@netscript/fresh`: error taxonomy, utils normalization, vite config wrapper, interactive seam, root mod skeleton, telemetry convention, docs scaffold, `./testing` entrypoint.

## Key decisions locked

1. **Error taxonomy**: split `error/handler.ts` into `error/types.ts`, `error/classify.ts`, `error/extract.ts`, `error/handler.ts`; keep public symbols unchanged.
2. **ErrorDisplay**: move `components/ErrorDisplay.tsx` → `error/ErrorDisplay.tsx`; dissolve `components/`.
3. **Telemetry convention**: one shared `_internal/telemetry.ts` with OTel-aligned `netscript.operation` attribute; `defer/telemetry.ts` migrates, `form/telemetry.ts` shimmed/deprecated for 5d5.
4. **Vite wrapper**: keep `config/vite.ts`; export `NetScriptViteAlias`, re-export `NetScriptRouteManifestOptions`, annotate `createNetScriptVitePlugin` return as `Plugin`.
5. **Interactive**: move `hooks/use-promise.ts` → `interactive/use-promise.ts`; dissolve `hooks/`.
6. **Utils**: normalize `CacheEntryLike<T>` against SDK shape.
7. **Root barrel**: drop defer symbols from root `mod.ts`.
8. **Docs/testing**: docs scaffold + doctest fixture + `testing.ts` entrypoint.

## Entrypoints in plan

```text
.
./server
./builders
./route
./defer
./form
./error
./utils
./streams
./query
./interactive
./vite
./testing   (new)
```

## Budget retirement

| Metric | Baseline | 5d1 target |
|--------|----------|------------|
| `missing-jsdoc` on 5d1-owned exports | 25 | 0 |
| `private-type-ref` in 5d1 scope | 6 | 0 |
| Files > 500 LOC | 0 | 0 |
| Slow types in 5d1 scope | 4 historical | 0 |

## Files expected to change (implementation)

- `packages/fresh/deno.json`
- `packages/fresh/mod.ts`
- `packages/fresh/interactive.ts`
- `packages/fresh/testing.ts` (new)
- `packages/fresh/_internal/telemetry.ts` (new)
- `packages/fresh/error/*.ts`, `error/*.tsx` (split + move)
- `packages/fresh/config/vite.ts`
- `packages/fresh/utils/mod.ts`, `utils/cache-entry.ts`
- `packages/fresh/interactive/use-promise.ts` (moved)
- `packages/fresh/defer/telemetry.ts`
- `packages/fresh/form/telemetry.ts` (deprecation comment only)
- `packages/fresh/docs/**` (new)
- `packages/fresh/tests/_fixtures/docs-examples_test.ts` (new)
- Root `deno.json` (optional, S24)

## Open questions for supervisor

1. Remove defer symbols from root `mod.ts` now?
2. Un-exclude `packages/fresh` from root workspace now?
3. Split `error/handler.ts` even though below 500 LOC flag?
4. `./testing` scope: Fresh-local only or re-export SDK adapter?
5. Confirm `netscript.operation` telemetry attribute namespace.

## Risks

- Root defer drop may break an unknown consumer.
- Root workspace un-exclusion may surface inherited errors from other clusters.
- `_internal/telemetry.ts` must not leak into public exports.

## Implementation handoff — 2026-06-13

- 5d1 support-spine implementation is complete locally and ready for separate IMPL-EVAL once pushed.
- Key implementation decisions:
  - `ErrorDisplay` moved to `error/ErrorDisplay.tsx`; `components/ErrorDisplay.tsx` removed.
  - `ComponentChildren` is not re-exported from Preact. `ErrorDisplay` uses package-owned `ErrorDisplayContent` to avoid new private-type doc-lint exposure.
  - `createNetScriptVitePlugin` returns package-owned `NetScriptVitePlugin` instead of raw Vite `Plugin`, avoiding Vite private/internal public API leakage while preserving actual Vite-style hook behavior.
  - `CacheEntryLike<T>` is package-owned and shape-compatible with SDK cached entries instead of directly aliasing SDK types; this avoids upstream/private type leakage in docs.
  - Root `mod.ts` drops defer symbols; consumers should use `@netscript/fresh/defer`.
  - Root `deno.json` no longer excludes `packages/fresh` from workspace membership or formatter config, but root `check`/`lint`/`fmt:check` wrapper task regexes still exclude `fresh`; full root-gate inclusion remains for the closing package-quality slice.
- Gates recorded:
  - PASS: package `fmt:check`, `check`, `test`, `lint`.
  - PASS with optional dependency warnings: scoped 5d1 `deno doc --lint ./mod.ts ./interactive.ts ./error/mod.ts ./utils/mod.ts ./config/vite.ts ./testing.ts`.
  - FAIL inherited/out-of-scope: package broad `doc-lint` (242 errors, primarily TanStack/query public type exposure).
  - FAIL inherited/out-of-scope: package `dry-run` (4 slow-type errors in form/query surfaces owned by later slices).
- Tooling drift: `rtk` is unavailable in this WSL worktree; direct shell commands were used.
- Push blocker: local branch is clean and ahead of origin, but `git push` failed because HTTPS Git credentials are unavailable, `gh` is not installed, and GitHub MCP cannot update a ref to a local-only commit object. Local commits: `ed5fedc65a9f16b750be0ea426527771ff217f14`, `877e1c50c21f106018ef63e06654f7e2004b0827`.

## Drift entries to watch

- D-5d1-003: root workspace exclusion.
- D-5d1-009: inherited doc-lint errors from `defer/`/`form/`/`builders/`/`route/`.
- New drift expected for root defer drop if approved.

## IMPL-EVAL handoff — 2026-06-13

- Evaluator verdict: **FAIL_FIX** in `evaluate.md`.
- Focused local package gates pass: `fmt:check`, `check`, `test`, `lint`, and focused 5d1 `deno doc --lint`.
- Blocking gates still fail:
  - `deno task doc-lint` exits 1 with 242 documentation lint errors.
  - `deno task dry-run` exits 1 with 4 slow-type errors in later form/query surfaces.
- Publication blocker still prevents PASS: branch is clean but 3 commits ahead of origin (`ed5fedc`, `877e1c5`, `98a96ca`); local GitHub HTTPS credentials are missing and `gh` is unavailable.
- Process/artifact issues recorded by evaluator: `worklog.md` lacks the protocol-required `## Design` section, implementation did not follow the 24 planned commit slices, and `commits.md` needed evaluator correction for unpublished artifact commits.
