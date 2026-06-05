# Research — feat-package-quality-wave1-contracts--contracts

> **Re-baselined against `feat/package-quality` @ 76fbeb7.**
> The canonical audit under `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
> predates the plugin-platform merge; all counts below are re-derived from the current tree.

## Re-baseline

- Carried-in canonical audit: `plan_runtime-config.md`, `plan_config.md`, `plan_contracts.md`.
- What changed vs the carried-in version:
  - `runtime-config`: stale audit claimed 1 slow type; **actual dry-run = 0 slow types**.
  - `config`: stale audit claimed 35 slow types; **actual dry-run = 0 slow types** (workspace `isolatedDeclarations` already enforced).
  - `contracts`: stale audit claimed 30 slow types; **actual dry-run = 0 slow types**.
  - All three packages now have `version: 0.0.1-alpha.0` and scoped names.
  - `config` README exists (was flagged missing in stale audit); `runtime-config` README still missing.

## Findings

### `@netscript/config`

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | `deno publish --dry-run` **SUCCESS** — 0 slow types, 0 portability errors. | `cd packages/config && deno publish --dry-run --allow-dirty` |
| 2 | 1 `unanalyzable-dynamic-import` warning on `loader.ts:93` (non-blocking). | same dry-run output |
| 3 | `deno doc --lint mod.ts` = **33 errors**: 1 `private-type-ref` (`SagaGroupInput` in `helpers.ts:57`) + 32 `missing-jsdoc` on `types.ts` interface properties. | `deno doc --lint mod.ts` |
| 4 | `deno doc --lint src/merge/mod.ts` = **multiple errors**: `private-type-ref` (`NetScriptConfig`, `DatabaseEntry`, `ServiceContributionEntry`, `AppContributionEntry`) + `missing-jsdoc` on `PartialConfig` properties. | `deno doc --lint src/merge/mod.ts` |
| 5 | `deno doc --lint src/schema/plugins/mod.ts` = **many `missing-jsdoc`** + `private-type-ref` on `z.ZodType` (Zod internals leak through public schema constants). | `deno doc --lint src/schema/plugins/mod.ts` |
| 6 | README = **255 LOC** ✓ (≥ 150). Covers overview, quickstart, API glance, install, license. Missing some STANDARDS § 6 sections (mental model, common recipes, observability, stability, compatibility, contributing). | `wc -l README.md` |
| 7 | `/docs` partially present: `README.md`, `architecture.md`, `concepts.md`, `getting-started.md`. **Missing**: `recipes/`, `reference/` (beyond stub), `advanced/`. | `find docs -type f` |
| 8 | `helpers.ts` (68 LOC) at package root — **generic folder name** (AP-16). Contains `SagaDefinitionInput`, `SagaGroupInput`, `SagasConfigInput`, `defineSagas`. This is domain vocabulary, not generic helpers. | `cat helpers.ts` |
| 9 | `types.ts` = 500 LOC — at F-1 boundary but acceptable for a type-only file with 1:1 field JSDoc. | `wc -l types.ts` |
| 10 | Subpath exports: `./merge`, `./paths`, `./schema/plugins` — all resolve and are imported by CLI. | `deno.json` + `grep -r "@netscript/config/merge"` |
| 11 | Published file list = 29 files (includes root `*.ts`, `src/**/*.ts`, docs). Clean — no test files leak. | dry-run output |

### `@netscript/contracts`

| # | Finding | How to verify |
|---|---------|---------------|
| 12 | `deno publish --dry-run` **SUCCESS** — 0 slow types, 0 portability errors. | `cd packages/contracts && deno publish --dry-run --allow-dirty` |
| 13 | `deno doc --lint mod.ts` = **1 error** (checked 1 file — root mod.ts is just `export * from './src/public/mod.ts'`). | `deno doc --lint mod.ts` |
| 14 | `deno doc --lint crud.ts query.ts transform.ts` = **21 errors**: all `private-type-ref` — `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure` are referenced in public signatures but not exported from the subpaths that use them. | `deno doc --lint crud.ts query.ts transform.ts` |
| 15 | README = **424 LOC** ✓. Strong overview, quickstart, subpath explanation. Missing some STANDARDS § 6 sections. | `wc -l README.md` |
| 16 | `/docs` partially present: `README.md`, `architecture.md`, `concepts.md`, `recipes/paginated-contract.md`, `reference/README.md`. **Missing**: `getting-started.md`, `advanced/`. | `find docs -type f` |
| 17 | `helpers/` folder — **generic name** (AP-16). Contains `paginated-query.ts` (264 LOC) and `transform.ts` (182 LOC). These are application-layer concerns, not generic helpers. | `ls helpers/` |
| 18 | `crud/` folder at root (not under `src/`) — contains `create-crud-contract.ts` (7.77 KB). Acceptable for a subpath concern but inconsistent with `src/` layout. | `ls crud/` |
| 19 | Subpath exports: `./crud`, `./query`, `./transform` — all resolve. Consumed by `plugins/sagas`, `plugins/workers`. | `deno.json` + grep |
| 20 | Published file list = 20 files. Clean. | dry-run output |

### `@netscript/runtime-config`

| # | Finding | How to verify |
|---|---------|---------------|
| 21 | `deno publish --dry-run` **SUCCESS** — 0 slow types, 0 portability errors. | `cd packages/runtime-config && deno publish --dry-run --allow-dirty` |
| 22 | `deno doc --lint mod.ts` = **34 errors**: all `missing-jsdoc` on interface properties (`JobOverride`, `SagaOverride`, `TriggerOverride`, `FeatureFlag`, `RuntimeTask`, `RuntimeConfig`). | `deno doc --lint mod.ts` |
| 23 | **README MISSING** — 0 LOC. | `ls README.md` fails |
| 24 | **`/docs` MISSING entirely**. | `ls docs/` fails |
| 25 | `mod.ts` = **415 LOC** — single file mixing domain types, application logic (loader), presentation (console.log in watcher/summary), and side effects (`Deno.watchFs`, `setTimeout`). F-1 file-size gate: 415 < 500, so not a hard violation, but the **doctrine verdict is "Refactor — Split single-file mod.ts"**. | `wc -l mod.ts` + doctrine/10-codebase-verdict-and-handoff.md |
| 26 | **No tests** — `tests/` directory does not exist. | `ls tests/` fails |
| 27 | **No `deno.json` tasks** — missing `check`, `test`, `lint`, `fmt`, `publish:dry-run`. | `cat deno.json` |
| 28 | **No `description` field** in `deno.json`. | `cat deno.json` |
| 29 | `console.log` / `console.warn` / `console.error` used in `watchRuntimeConfig` and `logRuntimeConfigSummary` — AP-13 violation (console in non-presentation code). | `grep -n "console\." mod.ts` |
| 30 | Published file list = 2 files (`deno.json`, `mod.ts`). Minimal but correct. | dry-run output |

## jsr-audit surface scan (Plan-Gate input)

### `@netscript/config`

| Check | Status | Notes |
|-------|--------|-------|
| Required metadata | ✓ | name, version, exports, license present |
| Scoped package name | ✓ | `@netscript/config` |
| Package description | ✓ | ≤ 250 chars |
| Valid exports | ✓ | 4 entrypoints, all exist |
| No slow types | ✓ | 0 slow types |
| Clean file list | ✓ | No test files, no IDE configs |
| ESM only | ✓ | No CJS |
| Module documentation | ⚠ | `@module` present on root, missing on some subpaths |
| Symbol documentation | ✗ | 33+ `missing-jsdoc` errors |

**Surface risks:**
- `private-type-ref` on `SagaGroupInput` blocks clean `deno doc --lint`.
- Zod internal type (`z.ZodType`) leaks through public schema exports in `schema/plugins` — this is a slow-type risk if Zod changes internals.
- Dynamic import in `loader.ts` produces publish warning (non-blocking but noisy).

### `@netscript/contracts`

| Check | Status | Notes |
|-------|--------|-------|
| Required metadata | ✓ | name, version, exports, license present |
| Scoped package name | ✓ | `@netscript/contracts` |
| Package description | ✓ | ≤ 250 chars |
| Valid exports | ✓ | 4 entrypoints, all exist |
| No slow types | ✓ | 0 slow types |
| Clean file list | ✓ | No test files leak |
| ESM only | ✓ | No CJS |
| Module documentation | ✓ | `@module` on all entrypoints |
| Symbol documentation | ✗ | 21 `private-type-ref` errors on subpaths |

**Surface risks:**
- `private-type-ref` is the dominant issue: `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure` are used in public function signatures but not re-exported from the subpaths that consume them. Consumers cannot name these types.
- `helpers/` folder name is AP-16 (generic folder vocab).

### `@netscript/runtime-config`

| Check | Status | Notes |
|-------|--------|-------|
| Required metadata | ⚠ | name, version present; **description missing** |
| Scoped package name | ✓ | `@netscript/runtime-config` |
| Package description | ✗ | Missing |
| Valid exports | ✓ | 1 entrypoint exists |
| No slow types | ✓ | 0 slow types |
| Clean file list | ✓ | Minimal (2 files) |
| ESM only | ✓ | No CJS |
| Module documentation | ✓ | `@module` present |
| Symbol documentation | ✗ | 34 `missing-jsdoc` errors |

**Surface risks:**
- Single 415-line file is a maintenance liability; no separation of domain/application/presentation.
- Console usage in watcher violates AP-13.
- Missing README and docs entirely — JSR doc score will be severely impacted.
- No tests means no fitness function protecting the contract.

## Open questions (all closed by this research)

| Question | Answer | Evidence |
|----------|--------|----------|
| `runtime-config`: does ~13.4 KB `mod.ts` exceed F-1? | **No** — 415 LOC, under 500 cap. But doctrine verdict still says "Refactor — split single-file mod.ts" because it mixes concerns. | `wc -l mod.ts` + doctrine/10 |
| `config/helpers.ts` and `contracts/helpers/`: rename or debt? | **Rename now** — both are small moves with no downstream breakage. `config/helpers.ts` → `src/domain/saga-inputs.ts`. `contracts/helpers/` → fold into `src/application/` by role. | grep shows imports are intra-package only |
| STANDARDS § 7 `/docs` target for each unit? | **All three need expansion**. `config` needs recipes/ + advanced/. `contracts` needs getting-started.md + advanced/. `runtime-config` needs full docs from scratch. | `find docs -type f` per package |
| Real slow-type counts? | **All three = 0 slow types**. The stale audit counts (35, 30, 1) are obsolete. | `deno publish --dry-run` per package |
| Archetype for config/runtime-config — pulled toward Integration? | **No — both stay Archetype 1**. `config` uses `@std/fs`/`@std/path` for loading, but the package value is still "clarity of types." `runtime-config` uses `@std/path` and `Deno.*` for file watching, but the surface is still a small contract (load + accessors). Neither has ports/adapters worth naming. | doctrine/06-archetypes.md § "How to choose" |
| `contracts` archetype — 1 or 4? | **Archetype 1 for this wave**. Doctrine table says 4 (DSL/Builder), but the package has no NetScript-defined fluent builder. It exports schema factories and type aliases. The DSL is oRPC's, not ours. If a builder API is added later, archetype escalates to 4. | `cat mod.ts` + `cat src/public/mod.ts` |
