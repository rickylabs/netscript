# Research — `@netscript/plugin` (A4) at base `89071df`

> Re-baseline of canonical `evaluate_plugin.md`/`plan_plugin.md` (pre-rewrite, 5 files / 33 slow types / 0 tests). All canonical numbers are stale; the package was fully restructured into a hexagonal `src/` layout.

## 1. `deno publish --dry-run --allow-dirty`

| Metric | Value |
|--------|-------|
| Slow types | **0** |
| Errors | **0** |
| Warnings | 1 (`unanalyzable-dynamic-import` in `src/sdk/discovery/manifest-resolver.ts:30`) |
| Verdict | **SUCCESS** |

**Delta from canonical:** canonical reported 33 slow types + FAIL. The rewrite already eliminated all slow types. The remaining warning is a benign runtime-resolvability notice on `ModuleManifestResolver` (not `./loader`).

## 2. Full-export `deno doc --lint` (all 8 entrypoints)

| Metric | Value |
|--------|-------|
| Total errors | **93** |
| `missing-jsdoc` | **84** |
| `private-type-ref` | **9** |
| Verdict | **FAIL** (must reach 0) |

**Per-category breakdown:**

### `private-type-ref` (9 errors — mechanical fixes)
| File | Private type | Fix |
|------|-------------|-----|
| `src/config/builders/plugin-builder.ts` | `ContributionInput` | Export the type |
| `src/config/domain/plugin-metadata.ts` | `PluginMetadataValue` | Export the type |
| `src/domain/core-types.ts` | `PLUGIN_TYPES` | Export the const |
| `src/abstracts/plugin-contribution.ts` | `ContributionAxis` | Export the type (already exported via domain/mod.ts, but barrel needs re-export) |
| `src/diagnostics/inspect-plugin.ts` | `InspectablePluginManifest` | Export the interface |
| `src/diagnostics/inspect-plugin.ts` | `InspectablePluginRegistry` | Export the interface |
| `src/abstracts/plugin-stream-topic-contribution.ts` | `StandardSchemaV1` | **Upstream type — do NOT re-export (F-15/AP-14). Replace with package-owned structural type (LD-8).** |
| `src/config/validators/manifest-schema.ts` | `ZodType` | **Upstream type — do NOT re-export (F-15/AP-14). Annotate `PluginManifestSchema` with a package-owned structural type (LD-8).** |

### `missing-jsdoc` (84 errors — mechanical JSDoc sweep)
| File group | Count | Notes |
|-----------|-------|-------|
| 11 abstract contribution classes (`src/abstracts/plugin-*-contribution.ts`) | ~33 | Each has `axis`, `name`, and 1-2 other abstract properties |
| `src/config/builders/plugin-builder.ts` | 1 | Constructor |
| `src/domain/errors.ts` | 3 | Error constructors |
| `src/adapters/memory-file-system-adapter.ts` | 4 | Class properties + methods |
| Remaining scattered across abstracts + other | ~43 | Second-pass sweep required |

**Root-only undercount evidence:** running `deno doc --lint` on `mod.ts` alone reports far fewer errors. The full-export sweep is mandatory per `lessons/validation.md`.

## 3. `deno check --unstable-kv` over all 8 entrypoints

| Entrypoint | Result |
|-----------|--------|
| `.` (mod.ts) | ✅ |
| `./abstracts` | ✅ |
| `./config` | ✅ |
| `./cli` | ✅ |
| `./loader` | ✅ |
| `./sdk` | ✅ |
| `./testing` | ✅ |
| `./templates` | ✅ |

**Verdict:** All pass. No type errors.

## 4. README / docs baseline

| Metric | Value | Target |
|--------|-------|--------|
| README LOC | **138** | ≥150 |
| README sections | **12** | 14 STANDARDS sections |
| `docs/` present | ✅ | README, architecture, concepts, getting-started, plugin-author-guide, recipes/, reference/ |
| `docs/plugin-author-guide.md` | 371 LOC | docs exempt from F-1 |

**Missing sections (vs 14 STANDARDS):** "Observability" and "Compatibility" are not present as standalone H2s. Can be added as sub-sections or merged.

## 5. Test adequacy vs A4 layers

| Layer | Present | Evidence |
|-------|---------|----------|
| Doctest | ✅ | `tests/_fixtures/readme-examples_test.ts` (2 tests) |
| Domain | ⚠️ partial | Error classes tested via registry_test; no dedicated domain unit tests |
| Port-contract | ✅ | `tests/sdk/walker-ports_test.ts` (walker, extractor, emitter, manifest-resolver, pipeline) |
| Adapter conformance | ⚠️ partial | `MemoryFileSystemAdapter` not directly tested against `FileSystemPort` |
| Runtime lifecycle | ⚠️ minimal | `plugin-host-bootstrap.ts`, `plugin-context.ts` are stubs; no lifecycle tests |
| DSL/builder ergonomics | ✅ | `readme-examples_test.ts` exercises `definePlugin` chain + `inspectPlugin` |
| CLI contract | ✅ | `tests/cli/plugin-cli_test.ts` (4 tests) |
| Registry behavior | ✅ | `tests/application/plugin-registry_test.ts` (2 tests) |

**Total:** 4 test files, 13 tests, all passing.

## 6. File-size audit (F-1)

| File | LOC | Cap | Status |
|------|-----|-----|--------|
| `src/config/builders/plugin-builder.ts` | **343** | 300 | **Over by 14%** |
| `src/sdk/discovery/ast-extractor.ts` | 126 | 300 | ✅ |
| `src/sdk/discovery/registry-emitter.ts` | 87 | 300 | ✅ |
| `src/diagnostics/inspect-plugin.ts` | 69 | 300 | ✅ |
| `docs/plugin-author-guide.md` | 371 | N/A (docs) | ✅ |

**Finding:** `plugin-builder.ts` is the only F-1 violation. It is the classic A4 hotspot — a typestate-generic fluent builder. Splitting it risks breaking the generic chain. Recommendation: accept with debt, target pre-beta refactor.

## 7. Folder vocabulary / cardinality (F-11 / F-16)

| Folder | Role | Siblings | Status |
|--------|------|----------|--------|
| `src/abstracts/` | contribution bases | 11 files | ✅ |
| `src/adapters/` | port implementations | 3 files | ✅ |
| `src/application/` | orchestration | 2 files | ✅ |
| `src/cli/` | CLI surface | subfolders + types | ✅ |
| `src/config/` | DSL/builder + domain + validators | subfolders | ✅ |
| `src/diagnostics/` | inspectPlugin | 2 files | ✅ |
| `src/domain/` | core types, errors, constants | 5 files | ✅ |
| `src/kernel/` | template assets | 1 subfolder | ⚠️ borderline |
| `src/ports/` | port contracts | 3 files | ✅ |
| `src/public/` | curated re-exports | 1 file | ⚠️ borderline |
| `src/sdk/` | discovery + runtime + presets | subfolders | ✅ |
| `src/templates/` | skeleton templates | 1 file + skeleton/ | ✅ |
| `src/testing/` | test fixtures + memory adapters | 6 files | ✅ |

**F-11:** No `utils/`, `interfaces/`, `helpers/`, `common/`, or `lib/` folders. ✅ **Clean.**

**F-16:** Every role folder has ≥2 meaningful siblings or subfolders. `src/public/` (1 file) and `src/kernel/` (1 subfolder) are borderline but justified: `public/` is the canonical barrel re-export file, and `kernel/` is a narrow asset registry. No action needed.

## 8. Open Questions — Evidence

### OQ-A `./loader` dynamic import
**Finding:** `./loader` (`loader.ts`) has **no dynamic import**. The `unanalyzable-dynamic-import` warning is in `src/sdk/discovery/manifest-resolver.ts` (the `./sdk` entrypoint), not `./loader`.

**Decision:** Keep `./loader` public. It exports `createPluginLogger` and `PluginLogger` — stable host-side contracts. The dynamic import warning belongs to `./sdk`'s `ModuleManifestResolver`, which is runtime-resolvable by design (it imports plugin modules at runtime). Document this in the `./sdk` module doc.

### OQ-B vocabulary reconciliation
**Finding:** The repo has `config/`, `cli/`, `sdk/`, `abstracts/`, `kernel/` in addition to the canonical `domain/ports/application/adapters/diagnostics/testing/public`. All names are role-specific and doctrine-allowed. No `utils/` or `interfaces/`.

**Decision:** **Accept the rewrite vocabulary.** The canonical `plan_plugin.md` §2 folder tree was a structural intent, not a mandate. The current tree satisfies F-11 and F-16. Zero external consumers import subpaths that would break (verified: `packages/cli` imports `@netscript/plugin` root only; no workspace code imports `@netscript/plugin/config` etc. directly except via the package's own exports).

### OQ-C file-size (F-1)
**Finding:** `plugin-builder.ts` = 343 LOC (cap 300). It is a typestate-generic fluent builder with 20+ methods.

**Decision:** **Accept with debt.** Splitting a typestate builder mid-wave risks breaking the generic chain and consumer compile-time contracts. Record in `arch-debt.md` with closing gate "pre-beta builder refactor".

### OQ-D `e2e:cli` triggers-health
**Finding:** `src/sdk/runtime/*` files are stubs (bootstrap 13 LOC, context 17 LOC, service-context 20 LOC). The `localhost:8093/health` failure is in a generated trigger service, not in these stubs.

**Decision:** **Downstream / Wave 4.** Record as carried-forward in `drift.md`. Do not fix in this wave.

### OQ-E `./testing` + defensive I/O
**Finding:** `./testing` exports memory adapters and fixtures. `watcher.ts` and `start-watcher.ts` are no-op stubs. The `./testing` surface IS exercised by `tests/sdk/walker-ports_test.ts` and `tests/application/plugin-registry_test.ts`.

**Decision:** Add a trivial `watcher-cleanup_test.ts` proving `WatcherHandle.stop()` resolves. No real resources to leak.

### OQ-F diagnostic
**Finding:** `inspectPlugin` is exported from `mod.ts` (line 43) and returns `InspectionReport` (line 44). However, `deno doc --lint` reports `private-type-ref` on `InspectablePluginManifest` and `InspectablePluginRegistry` because they are not re-exported through the public barrel.

**Decision:** Export `InspectablePluginManifest` and `InspectablePluginRegistry` from `src/diagnostics/mod.ts` and/or `mod.ts` as part of the private-type-ref fix slice.

## 9. Arch-debt implications

| Entry | Current status | Action |
|-------|---------------|--------|
| `packages/plugin — AP-1 / doctrine verdict Restructure (types.ts 1,005 LOC)` | `types.ts` no longer exists; package was restructured | **Close** this debt entry |
| `packages/plugin/src/sdk/discovery/ast-extractor.ts — PLG-WALKER-AST` | Still open (extractor precision) | **Leave open** (not this wave) |
| `plugin-builder.ts 343 LOC` | New finding | **Create** debt entry with closing gate "pre-beta builder refactor" |

## 10. Risk summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Doc-lint 93 errors is larger than expected | Medium | Group into 3 mechanical slices (private-type-ref, abstracts JSDoc, remaining JSDoc). All are additive, no API changes. |
| `plugin-builder.ts` split deferred | Low | Recorded as debt. No functional impact. |
| `e2e:cli` may fail on unrelated runtime | Low | Escalate, don't block. Record in drift. |
| Consumer-import gate may surface pre-existing CLI errors | Low | Attribution rule from `lessons/validation.md`: diff failing file against base; byte-identical = pre-existing debt. |
