# Drift Log — feat-package-quality-wave3-plugin--host

> Record every deviation from the locked `plan.md`, every subpath/folder rename, and
> every MEASURE-FIRST re-baseline finding here.

## Re-baseline drift (seed)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | note | Canonical `evaluate_plugin.md`/`plan_plugin.md` are pre-rewrite/stale | Canonical: 5 files / 1956 LOC / 33 slow types / 0 tests / no docs. Reality at `89071df`: full hexagonal `src/` layout, 8 exports, README 139 LOC, `docs/` present, 4 test files, `inspectPlugin` shipped. | **MEASURE-FIRST**: re-run full-export `deno doc --lint` (all 8 entrypoints) + `deno publish --dry-run` at base; record real numbers in `research.md` before locking slice effort. |
| 2026-06-08 | note | `plugins/hello-world` removed | Replaced by `packages/plugin/src/templates/skeleton/` (the `netscript plugin scaffold` template). | Canonical hello-world references in `plan_plugin.md` do not apply. No hello-world slice. |

## Carried-in caveats (from Wave 2 closeout)

| Item | Decision | Impact |
|------|----------|--------|
| `e2e:cli` `behavior.triggers-health` | Investigate ownership during Research (OQ-D): plugin-host bootstrap (`src/sdk/runtime/*`) vs downstream `plugin-triggers` (Wave 4). | If host defect → fix in-scope; if downstream → carry forward, do not block. |
| `cli-maintainer-sync-isolated-declarations` | Out of scope (Wave 6 CLI). | Recorded in `.llm/harness/debt/arch-debt.md`. Not this wave. |

## Implementation drift

(append during Plan + Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | note | OQ-A resolved: `./loader` has no dynamic import | `loader.ts` is 64 LOC, exports `PluginLogger` + `createPluginLogger`. The `unanalyzable-dynamic-import` warning is in `src/sdk/discovery/manifest-resolver.ts` ( `./sdk` entrypoint). | Keep `./loader` public. Document `./sdk` runtime caveat in module JSDoc. |
| 2026-06-08 | note | OQ-B resolved: accept rewrite vocabulary | Current folders: `abstracts/`, `adapters/`, `application/`, `cli/`, `config/`, `diagnostics/`, `domain/`, `kernel/`, `ports/`, `public/`, `sdk/`, `templates/`, `testing/`. No `utils/`/`interfaces/`. F-16 cardinality holds. | No renames. Record as locked decision LD-2. |
| 2026-06-08 | note | OQ-C resolved: accept `plugin-builder.ts` 343 LOC with debt | Typestate-generic builder; splitting risks breaking compile-time chain. | Create debt entry in `arch-debt.md` with closing gate "pre-beta builder refactor". |
| 2026-06-08 | note | OQ-D resolved: `e2e:cli` triggers-health is downstream | `src/sdk/runtime/*` are stubs (bootstrap 13 LOC, context 17 LOC, service-context 20 LOC). Failure is in generated trigger service, not host bootstrap. | Carry forward to Wave 4. Do not fix here. |
| 2026-06-08 | note | OQ-E resolved: `./testing` is exercised | Memory adapters used by `walker-ports_test.ts` and `plugin-registry_test.ts`. | Add `tests/sdk/watcher-cleanup_test.ts` as defensive I/O proof. |
| 2026-06-08 | note | OQ-F resolved: `inspectPlugin` exported and typed | Exported from `mod.ts` line 43, returns `InspectionReport`. `private-type-ref` on `InspectablePluginManifest`/`InspectablePluginRegistry` because not re-exported through barrel. | Export through `src/diagnostics/mod.ts` and `mod.ts` in Slice 1. |

## PLAN-EVAL drift

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | note | PLAN-EVAL surfaced rework-forcing decision not flagged by plan: upstream-typed `private-type-ref` fix | 2 of 9 `private-type-ref` errors are on upstream types in public signatures — `z.ZodType` (`src/config/validators/manifest-schema.ts:4`) and `StandardSchemaV1` (`src/abstracts/plugin-stream-topic-contribution.ts:11`). Naive barrel re-export violates F-15/AP-14. | Resolved in-line during PLAN-EVAL: locked as LD-8 (package-owned structural types, not upstream re-export); slice 1, research private-type-ref table, and F-15 evidence amended. Verdict PASS in `plan-eval.md`. |
| 2026-06-08 | note | Phase A doc-lint reached 0 in slice 6 instead of slice 7 | After slice 6, full-export `deno doc --lint mod.ts src/abstracts/mod.ts src/config/mod.ts src/cli/mod.ts loader.ts src/sdk/mod.ts src/testing/mod.ts src/templates/mod.ts` returns `Checked 8 files`. The planned slice 7 target files (`config` domain/validators/application and `testing`) had no remaining doc-lint errors. | Keep the locked slice order; treat slice 7 as no-op verification/doc-record rather than adding unnecessary code. Slice 8 remains the full-export doc-lint verification gate. |
