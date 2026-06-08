# Plan: `@netscript/plugin` (A4 — DSL/Builder, plugin host)

## Run Metadata

| Field          | Value                               |
| -------------- | ----------------------------------- |
| Run ID         | `feat-package-quality-wave3-plugin--host` |
| Branch         | `feat/package-quality-wave3-plugin-host` |
| Phase          | `plan`                              |
| Target         | `@netscript/plugin`                 |
| Archetype      | **A4 — Public DSL/Builder**         |
| Scope overlays | none                                |

## Archetype

**A4 — Public DSL/Builder** is the correct archetype because the package's primary product is the `definePlugin()` fluent builder and the `PluginBuilder` typestate-generic class. The package also owns a registry (`PluginRegistry`), abstract contribution bases (`PluginContribution` hierarchy), CLI contracts (`PluginCli`), SDK discovery ports, and diagnostics (`inspectPlugin`). The builder is the 80% path; everything else supports it.

## Current Doctrine Verdict

From `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`:

> `packages/plugin` — **Refactor** (AP-1: pre-rewrite `types.ts` was 1,005 LOC). The package has since been restructured into a full hexagonal `src/` layout with role-named folders. The remaining concern is file-size discipline on the builder (343 LOC vs 300 cap).

**Action:** Close the old `types.ts` debt entry; open a new one for `plugin-builder.ts` size.

## Axioms in Play

| Axiom | Why it matters |
|-------|---------------|
| A1 | Public types first — the builder's generic state must be stable before any implementation slice. |
| A2 | Simple over easy at published boundaries — `definePlugin(name, version)` is one call; the chain is optional. |
| A3 | 80% path is one chained call — `definePlugin(...).withService(...).build()`. |
| A6 | Helpers must be justified — `safeStringifyMetadata` in `loader.ts` is a narrow, justified helper. |
| A8 | One concern per folder — `config/`, `cli/`, `sdk/`, `adapters/`, `testing/` are each single-concern. |
| A9 | Archetype drives package shape — A4 requires builder split by concern; we accept debt on the single-file builder. |
| A10 | Composition root over container — `mountPluginCli`, `runWalkerPipeline` are composition functions, not DI containers. |
| A14 | Tests and gates preserve doctrine — every slice is gated. |

## Goal

Bring `@netscript/plugin` to the A4 enterprise bar:

- `deno publish --dry-run` 0 slow types (already ✅)
- Full-export `deno doc --lint` 0 errors across all 8 entrypoints
- README ≥150 LOC / 14 sections, doctested
- A4 test layers present and passing
- F-1..F-12, F-14..F-18 green or accepted-debt
- Consumer-import validation green
- Task hygiene: `check` enumerates all 8 entrypoints + `lint`/`fmt`/`publish:dry-run`

## Scope

- Fix 93 `deno doc --lint` errors (84 missing-jsdoc + 9 private-type-ref)
- Expand README from 138 → ≥150 LOC, add missing sections
- Add `lint` and `fmt` tasks to `deno.json`
- Expand `tasks.check` to enumerate all 8 exports entrypoints
- Add domain unit tests (`tests/domain/errors_test.ts`, `tests/domain/core-types_test.ts`)
- Add adapter conformance test (`tests/adapters/memory-file-system_test.ts`)
- Add defensive I/O watcher cleanup test (`tests/sdk/watcher-cleanup_test.ts`)
- Export `InspectablePluginManifest` / `InspectablePluginRegistry` through public barrel
- Document `./sdk` dynamic-import runtime caveat in module JSDoc
- Update `arch-debt.md`: close old `types.ts` entry, open `plugin-builder.ts` size entry

## Non-Scope

- Split `plugin-builder.ts` (deferred to pre-beta; recorded as debt)
- Fix `e2e:cli` `behavior.triggers-health` (downstream Wave 4)
- Rename folders (`config/`, `cli/`, `sdk/`, `abstracts/`, `kernel/` are accepted vocabulary)
- Add new contribution axes or builder methods
- Runtime lifecycle implementation (stubs remain stubs)
- AST extractor precision improvements (PLG-WALKER-AST debt)

## Hidden Scope

- `mod.ts` may need additional type re-exports as `private-type-ref` fixes surface new public types
- `src/diagnostics/mod.ts` barrel expansion to re-export inspection interfaces
- `src/config/mod.ts` may need `ContributionInput` export
- `src/domain/mod.ts` may need `PLUGIN_TYPES` and `PluginMetadataValue` re-exports

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| LD-1 | Keep `./loader` public | No dynamic import in `loader.ts`; exports stable `PluginLogger` + `createPluginLogger`. Warning is in `./sdk`'s `ModuleManifestResolver`. |
| LD-2 | Accept rewrite vocabulary (`config/`, `cli/`, `sdk/`, `abstracts/`, `kernel/`) | Satisfies F-11 (no forbidden folders) and F-16 (cardinality). Zero external consumers of subpaths that would break. Canonical tree was intent, not mandate. |
| LD-3 | Accept `plugin-builder.ts` 343 LOC with debt | Typestate-generic builder; splitting risks breaking compile-time chain. Target pre-beta refactor. |
| LD-4 | `e2e:cli` triggers-health is downstream (Wave 4) | `src/sdk/runtime/*` are stubs; failure is in generated trigger service, not host bootstrap. |
| LD-5 | `./testing` surface is exercised | Memory adapters used by `walker-ports_test.ts` and `plugin-registry_test.ts`. Add trivial cleanup test. |
| LD-6 | `inspectPlugin` is correctly exported and typed | Returns `InspectionReport`. Fix `private-type-ref` by exporting `InspectablePluginManifest`/`InspectablePluginRegistry` through barrels. |
| LD-7 | Group doc-lint fixes into 3 mechanical slices | `private-type-ref` (9), abstracts JSDoc (~33), remaining JSDoc (~51). All additive, no API changes. |
| LD-8 | Fix the 2 **upstream-typed** `private-type-ref` errors (`z.ZodType` in `manifest-schema.ts`, `StandardSchemaV1` in `plugin-stream-topic-contribution.ts`) with **package-owned minimal structural types**, NOT by re-exporting the upstream types | Re-exporting `ZodType`/`StandardSchemaV1` from a barrel would violate F-15 (re-export-upstream lint) and AP-14, contradicting this plan's own F-15 "pass" claim. Doctrine-preferred pattern is a package-owned structural interface in `src/domain/` (precedent: `packages/database/prisma-tracing.ts:37-63` mirrors OpenTelemetry's span instead of re-exporting it). The other 7 `private-type-ref` errors are on package-owned types and are fixed by barrel exports as planned. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| README section ordering | safe to defer | Can reorder during README expansion slice; no code dependencies. |
| Whether to add `@example` to every abstract property | safe to defer | JSDoc slice can decide per-symbol; no structural impact. |
| `plugin-builder.ts` pre-beta split strategy | safe to defer | Debt entry captures this; implementation not in this wave. |

**No decisions marked "must resolve now" — all load-bearing questions are locked above.**

> PLAN-EVAL note (2026-06-08): the evaluator's open-decision sweep surfaced one rework-forcing decision the original plan left implicit — how to fix the 2 **upstream-typed** `private-type-ref` errors without violating F-15/AP-14. Resolved directly and locked as **LD-8**; slice 1 amended accordingly.

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Doc-lint 93 errors takes more slices than planned | Grouped into 3 additive slices; no API changes; each is independently gateable. |
| `e2e:cli` fails on unrelated runtime at merge-readiness | Escalate to Wave 4; do not block. Record in drift. |
| Consumer-import gate surfaces pre-existing CLI slow types | Attribution rule: diff against base; byte-identical = pre-existing debt (`cli-maintainer-sync-isolated-declarations`). |
| README expansion accidentally changes API examples | Doctest slice validates; `readme-examples_test.ts` must pass after README edits. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| AP-1 (builder barrel contains all concerns) | **existing / accepted-debt** | `plugin-builder.ts` is 343 LOC; recorded as debt. Not fixed in this wave. |
| AP-7 (long positional constructor args) | **not present** | `PluginBuilder` constructor takes a single state object. |
| AP-9 (typestate before broken-order problem) | **not present** | Typestate enforces `name` + `version` before `build()`; justified. |
| AP-14 (re-exporting upstream DSL deps) | **not present** | Zod types are not re-exported at root. |
| AP-15 (names expose implementation roles) | **not present** | `withService`, `withDbSchemas` use caller vocabulary. |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | `plugin-builder.ts` = 343 LOC; **DEBT_ACCEPTED** with registry entry |
| F-2 Helper-reinvention scan | yes | Manual: `safeStringifyMetadata` is justified; no `@std/*` equivalent for circular-safe JSON. |
| F-3 Layering check | yes | Manual: `domain/` imports no implementation; `ports/` imports `domain/` only; `application/` imports `domain/` + `ports/`; `adapters/` imports `domain/` + `ports/` + external; `presentation/` (CLI) imports `application/` + `domain/`. |
| F-4 Inheritance audit | yes | Manual: `PluginContribution` is abstract base; 11 derived classes co-located in `src/abstracts/`. No deep hierarchies. |
| F-5 Public surface audit | yes | Manual: 8 entrypoints, curated root barrel, no root leakage of implementation. |
| F-6 JSR publishability | yes | `deno publish --dry-run --allow-dirty` = SUCCESS (0 slow types) |
| F-7 Doc-score gate | yes | Full-export `deno doc --lint` = 0 errors across all 8 entrypoints |
| F-8 Workspace lib check | yes | `deno check --unstable-kv` passes all 8 entrypoints |
| F-9 Permission decl check | yes | `tests/sdk/walker-ports_test.ts` declares `{ permissions: { read: true, write: true } }` |
| F-10 Test-shape audit | yes | 13 tests across 4 files + new tests; no Jest/Vitest globals; no "happy path" names. |
| F-11 Forbidden-folder lint | yes | No `utils/`, `interfaces/`, `helpers/`, `common/`, `lib/`. |
| F-12 Naming-convention lint | yes | Manual: `withNoun`, `createNoun`, `isAdjective`, `runVerb` patterns. No `get`/`find`/`sort`/`merge` prefixes on public API. |
| F-14 Console-log lint | yes | Manual: `loader.ts` uses `console.log`/`warn`/`error` inside `writePluginLog` — justified as a logger sink adapter. No stray `console.log` in library code. |
| F-15 Re-export-upstream lint | yes | Manual: No Zod/Cliffy/StandardSchema re-exports at root. **The 2 upstream-typed `private-type-ref` errors are fixed via package-owned structural types (LD-8), not by re-exporting `ZodType`/`StandardSchemaV1`.** |
| F-16 Folder-cardinality lint | yes | Manual: Every role folder has ≥2 siblings or subfolders. `public/` (1 file) and `kernel/` (1 subfolder) are justified. |
| F-17 Abstract-derived co-location | yes | Manual: `PluginContribution` + 11 derived classes all in `src/abstracts/`. |
| F-18 Sub-barrel lint | yes | Manual: No nested `mod.ts` barrels that re-export from sibling barrels. Each `mod.ts` is a leaf barrel for its folder. |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `packages/plugin — AP-1 / doctrine verdict Restructure (types.ts 1,005 LOC)` | **close** | `types.ts` no longer exists; package restructured. |
| `packages/plugin/src/config/builders/plugin-builder.ts — F-1 size` | **create** | 343 LOC vs 300 cap. Closing gate: "pre-beta builder refactor". Owner: Wave 3 generator. |
| `packages/plugin/src/sdk/discovery/ast-extractor.ts — PLG-WALKER-AST` | **leave open** | Extractor precision; not this wave. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|-----------------|-----------------|
| 1 | Static | `deno check --unstable-kv mod.ts src/abstracts/mod.ts src/config/mod.ts src/cli/mod.ts loader.ts src/sdk/mod.ts src/testing/mod.ts src/templates/mod.ts` | 0 errors |
| 2 | Static | `deno publish --dry-run --allow-dirty` | SUCCESS, 0 slow types |
| 3 | F-7 | `deno doc --lint mod.ts src/abstracts/mod.ts src/config/mod.ts src/cli/mod.ts loader.ts src/sdk/mod.ts src/testing/mod.ts src/templates/mod.ts` | 0 errors |
| 4 | F-10 | `deno test --allow-all` | All tests pass |
| 5 | F-6/F-7 | `deno task publish:dry-run` | SUCCESS |
| 6 | Consumer | `deno check --unstable-kv` on consumers importing `@netscript/plugin` | 0 errors (attributed to this wave) |
| 7 | Merge-readiness | `deno task e2e:cli` | Run once; escalate unrelated runtime failures |

## Dependencies

- `packages/cli` imports `@netscript/plugin` root — consumer-import gate must validate
- `plugins/triggers`, `plugins/workers`, `plugins/streams`, `plugins/sagas` may import `@netscript/plugin` — verify during consumer gate
- No external dependencies beyond `@std/*`, `zod`, `@standard-schema/spec`

## Slice List (24 slices)

### Phase A: Doc-lint to zero (slices 1–8)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | Fix 9 `private-type-ref`: barrel-export the 7 package-owned types; replace the 2 upstream-typed signatures (`z.ZodType`, `StandardSchemaV1`) with package-owned structural types per **LD-8** (no upstream re-export — preserves F-15) | F-7 (+F-15) | `src/config/builders/plugin-builder.ts`, `src/config/domain/plugin-metadata.ts`, `src/domain/core-types.ts`, `src/abstracts/plugin-contribution.ts`, `src/diagnostics/inspect-plugin.ts`, `src/diagnostics/mod.ts`, `src/abstracts/plugin-stream-topic-contribution.ts`, `src/config/validators/manifest-schema.ts`, `src/domain/*` (new package-owned structural type), `mod.ts` |
| 2 | JSDoc abstract contribution classes (part 1) | F-7 | `src/abstracts/plugin-aspire-contribution.ts`, `plugin-background-processor-contribution.ts`, `plugin-contract-version-contribution.ts`, `plugin-db-schema-contribution.ts`, `plugin-e2e-contribution.ts` |
| 3 | JSDoc abstract contribution classes (part 2) | F-7 | `src/abstracts/plugin-migration-contribution.ts`, `plugin-runtime-config-topic-contribution.ts`, `plugin-service-contribution.ts`, `plugin-stream-topic-contribution.ts`, `plugin-telemetry-contribution.ts`, `plugin-contribution.ts` |
| 4 | JSDoc builder + errors + adapters | F-7 | `src/config/builders/plugin-builder.ts`, `src/domain/errors.ts`, `src/adapters/memory-file-system-adapter.ts` |
| 5 | JSDoc remaining SDK + runtime + diagnostics | F-7 | `src/sdk/discovery/*.ts`, `src/sdk/runtime/*.ts`, `src/sdk/presets/*.ts`, `src/diagnostics/inspect-walker-output.ts` |
| 6 | JSDoc CLI + application + ports | F-7 | `src/cli/**/*.ts`, `src/application/*.ts`, `src/ports/*.ts` |
| 7 | JSDoc config domain + validators + testing | F-7 | `src/config/domain/*.ts`, `src/config/validators/*.ts`, `src/config/application/*.ts`, `src/testing/*.ts` |
| 8 | Verify full-export doc-lint = 0 | F-7 | Run gate; record result |

### Phase B: README + docs (slices 9–11)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 9 | Expand README to ≥150 LOC, add missing sections | F-7 | `README.md` |
| 10 | Doctest README examples | F-10 | `tests/_fixtures/readme-examples_test.ts` |
| 11 | Document `./sdk` dynamic-import caveat | F-7 | `src/sdk/mod.ts` module JSDoc |

### Phase C: Task hygiene + testing (slices 12–18)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 12 | Add `lint`/`fmt` tasks to `deno.json` | F-6 | `deno.json` |
| 13 | Expand `tasks.check` to all 8 entrypoints | F-6 | `deno.json` |
| 14 | Add domain unit tests (errors, core-types) | F-10 | `tests/domain/errors_test.ts`, `tests/domain/core-types_test.ts` |
| 15 | Add adapter conformance test (memory file system) | F-10 | `tests/adapters/memory-file-system_test.ts` |
| 16 | Add defensive I/O watcher cleanup test | F-10 | `tests/sdk/watcher-cleanup_test.ts` |
| 17 | Add `tests/application/plugin-loader_test.ts` | F-10 | `tests/application/plugin-loader_test.ts` |
| 18 | Run full test suite | F-10 | `deno test --allow-all` |

### Phase D: Debt + consumer + merge-readiness (slices 19–24)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 19 | Update `arch-debt.md`: close old entry, open builder size entry | F-1 (debt) | `.llm/harness/debt/arch-debt.md` |
| 20 | Verify F-1..F-18 manual evidence | Static | `worklog.md` evidence table |
| 21 | Consumer-import validation: `packages/cli` | Consumer | `deno check` on CLI files importing `@netscript/plugin` |
| 22 | Consumer-import validation: plugins | Consumer | `deno check` on `plugins/*` importing `@netscript/plugin` |
| 23 | Final publish dry-run + static gate sweep | F-6/F-7/F-8 | `deno task publish:dry-run`, `deno task check`, `deno task lint`, `deno task fmt --check` |
| 24 | Merge-readiness: `deno task e2e:cli` | Runtime | Run once; escalate unrelated failures |

## Drift Watch

- If `deno doc --lint` surfaces new errors after any slice, append to drift and add a catch-up slice
- If consumer gate fails on a file byte-identical to base, record as pre-existing debt
- If `e2e:cli` fails on `behavior.triggers-health`, record as Wave 4 carry-forward
