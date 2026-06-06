# Worklog: Wave 1 — Contracts & schemas

## Run Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `feat-package-quality-wave1-contracts--contracts` |
| Branch         | `feat/package-quality-wave1-contracts` |
| Archetype      | 1 — Small Contract             |
| Scope overlays | none                           |

## Design

### Public Surface

#### `@netscript/config`

Root (`mod.ts`):
- `defineConfig(config)` — authoring entrypoint
- `defineConfigAsync(factory)` — async authoring entrypoint
- `loadConfig(options?)` — runtime loader
- `initConfig()` — cached init
- `getConfig()` — cached accessor
- `isConfigLoaded()`, `clearConfigCache()` — cache management
- `getEnv(name)`, `hasEnv(name)`, `resolveEnv(def)`, `getMode()`, `isDev()`, `isProd()`, `isTest()` — environment helpers
- `discoverWorkspace()`, `findWorkspaceRoot()`, `findMember()`, `getMemberEntrypoint()` — workspace discovery
- `inspectConfig(config)` — diagnostics
- `defineSagas(config)` — saga config authoring (from renamed `saga-inputs.ts`)
- Types: `NetScriptConfig`, `NetScriptConfigInput`, `AppConfig`, `AspireConfig`, `DatabaseConfig`, `DatabasesConfig`, `DeployConfig`, `EnvDef`, `GatewayConfig`, `LoadConfigOptions`, `LoggingConfig`, `PathsConfig`, `PermissionConfig`, `PermissionValue`, `ResolvedEnvType`, `RuntimeConfigPathEntry`, `RuntimeConfigSection`, `SagaDefinition`, `SagaGroup`, `SagasConfig`, `SagaRetentionConfig`, `SagaRetryConfig`, `SagaScalingConfig`, `SagaStoreProvider`, `SagaTimeoutConfig`, `SagaTransportProvider`, `SdkConfig`, `ServiceConfig`, `TriggerDefinitionConfig`, `TriggerGroup`, `TriggerRetentionConfig`, `TriggerScalingConfig`, `TriggersConfig`, `WebhookConfig`, `WindowsDeployConfig`, `WorkspaceMap`, `WorkspaceMember`, `WorkspaceMemberType`, `SagaDefinitionInput`, `SagaGroupInput`, `SagasConfigInput`, `InspectionReport`

Subpaths:
- `./merge` — `mergePartialConfig()`, `PartialConfig`
- `./paths` — `SCAFFOLD_DIRS`, `SCAFFOLD_FILES`, `PERMISSIONS`
- `./schema/plugins` — `installedVersionSchema`, `pluginEntrySchema`, `backgroundProcessorSchema`, `serviceSchema`, and inferred types

#### `@netscript/contracts`

Root (`mod.ts`):
- `baseContract` — oRPC base contract primitive
- `boundedString()`, `nonNegativeInt()`, `nonNegativeNumber()`, `paginationLimit()`, `paginationOffset()`, `positiveInt()`, `positiveNumber()`, `stringToInt()`, `stringToNumber()` — Zod helper factories
- `COMMON_ERROR_CODES`, `DEFAULT_INTEGER_MAX`, `DEFAULT_PAGINATION_LIMIT`, `DEFAULT_PAGINATION_LIMIT_MAX`, `DEFAULT_PAGINATION_OFFSET` — constants
- `getResourceType()`, `notFound()` — error helpers
- `SuccessSchema`, `ForbiddenErrorSchema`, `NotFoundErrorSchema`, `RateLimitErrorSchema`, `ServiceUnavailableErrorSchema`, `UnauthorizedErrorSchema`, `ValidationErrorSchema`, `OffsetPaginationInputSchema`, `OffsetPaginationMetaSchema`, `OffsetPaginationQuerySchema`, `CursorPaginationInputSchema`, `CursorPaginationMetaSchema`, `CursorPaginationQuerySchema` — schemas
- `inspectContracts()` — diagnostics
- Types: `BaseContract`, `BaseContractOutputBuilder`, `BaseContractProcedure`, `BaseContractRouteBuilder`, `BaseContractRouteOptions`, `BoundedStringSchemaOptions`, `DefaultedIntegerSchemaOptions`, `IntegerSchemaOptions`, `StringSchemaOptions`, `ContractDefaultableSchema`, `ContractNumberSchema`, `ContractObjectSchema`, `ContractParseResult`, `ContractSchema`, `ContractStringSchema`, `CursorPaginationInput`, `CursorPaginationMeta`, `CursorPaginationQuery`, `ErrorResult`, `ForbiddenError`, `NotFoundError`, `NotFoundOptions`, `OffsetPaginationInput`, `OffsetPaginationMeta`, `OffsetPaginationQuery`, `OkResult`, `RateLimitError`, `Result`, `ServiceUnavailableError`, `SuccessResponse`, `UnauthorizedError`, `ValidationError`, `ContractsInspectionTarget`, `InspectionReport`, `InspectionStatus`

Subpaths:
- `./crud` — `createCrudContract()`, `createReadOnlyContract()`, `createListOnlyContract()`, `CrudContractOptions`, `CrudContractOperation`
- `./query` — `paginatedQuery()`, `FilterOperatorSchema`, `FilterConditionSchema`, `FiltersSchema`, `SearchInputSchema`, `PaginationInputSchema`, `OffsetPaginationInputSchema`, `CursorPaginationInputSchema`, `PaginationOutputSchema`, `CursorPaginationOutputSchema`, `createPaginatedOutput()`, `createCursorPaginatedOutput()`
- `./transform` — `createTransformer()`, `TransformFn`

#### `@netscript/runtime-config`

Root (`mod.ts`):
- `loadRuntimeConfig()` — load overrides from disk
- `isFeatureEnabled(config, flagId, defaultValue?)` — feature flag check
- `getJobOverride(config, jobId)` — job override accessor
- `getSagaOverride(config, sagaId)` — saga override accessor
- `getTriggerOverride(config, triggerId)` — trigger override accessor
- `getRuntimeTask(config, taskId)` — task definition accessor
- `watchRuntimeConfig(onChange, options?)` — hot-reload watcher
- `summarizeRuntimeConfig(config, prefix?)` — structured summary (replaces console-based `logRuntimeConfigSummary`)
- Types: `JobOverride`, `SagaOverride`, `TriggerOverride`, `FeatureFlag`, `RuntimeTask`, `RuntimeConfig`, `RuntimeConfigSummary`

### Domain Vocabulary

- `NetScriptConfig` — fully validated project configuration
- `NetScriptConfigInput` — authoring form accepted by `defineConfig`
- `PartialConfig` — plugin contribution fragment
- `RuntimeConfig` — hot-reloadable runtime overrides (jobs, sagas, triggers, features, tasks)
- `JobOverride` / `SagaOverride` / `TriggerOverride` — per-ID runtime override shapes
- `FeatureFlag` — boolean + rollout percentage flag
- `RuntimeTask` — task definition with runtime and entrypoint
- `ContractSchema<T>` / `ContractObjectSchema<T>` — branded Zod schema types
- `BaseContractProcedure` — oRPC procedure shape
- `Result<T, E>` — discriminated union for expected failures
- `CrudContractOperation` — named CRUD operation type

### Ports

None for this wave. All three packages are Small Contract; they do not own ports/adapters.

`runtime-config` uses `Deno.readTextFile`, `Deno.watchFs`, and `Deno.env.get` at the file-system edge. These are platform primitives, not ports. If a second backend (e.g. Redis-backed runtime config) is added later, a `RuntimeConfigStorePort` would be introduced.

### Constants

- `RUNTIME_CONFIG_TOPICS` — `['jobs', 'sagas', 'triggers', 'features', 'tasks']` as const array
- `DEFAULT_DEBOUNCE_MS` — `300` (watcher debounce)
- `POINTER_FILE_NAME` — `'current'`
- `COMMON_ERROR_CODES` — from contracts domain
- `DEFAULT_PAGINATION_LIMIT` / `DEFAULT_PAGINATION_LIMIT_MAX` / `DEFAULT_PAGINATION_OFFSET` — from contracts domain

### Commit Slices

Ordered by dependency (runtime-config first — it has no downstream consumers in this wave; then config; then contracts). Each slice names what it proves, the gate that proves it, and the files it touches.

#### `@netscript/runtime-config` (slices 1–10)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | Scaffold `src/domain/types.ts` with JSDoc | `deno doc --lint src/domain/types.ts` | `src/domain/types.ts` (new) |
| 2 | Scaffold `src/application/loader.ts` (extract from mod.ts) | `deno check src/application/loader.ts` | `src/application/loader.ts` (new) |
| 3 | Scaffold `src/application/watcher.ts` (extract watch logic, remove console) | `deno check src/application/watcher.ts` | `src/application/watcher.ts` (new) |
| 4 | Scaffold `src/diagnostics/summary.ts` (replace console-based summary) | `deno check src/diagnostics/summary.ts` | `src/diagnostics/summary.ts` (new) |
| 5 | Rewrite root `mod.ts` as thin barrel | `deno doc --lint mod.ts` | `mod.ts` (rewrite) |
| 6 | Add `deno.json` standard tasks + description + publish config | `deno publish --dry-run` | `deno.json` (update) |
| 7 | Write README.md (≥ 150 LOC) | `wc -l README.md` | `README.md` (new) |
| 8 | Scaffold `/docs` per STANDARDS § 7 | `find docs -type f` | `docs/README.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/getting-started.md`, `docs/recipes/basic-usage.md`, `docs/recipes/testing.md`, `docs/advanced/extending.md` (new) |
| 9 | Add tests for loader, accessors, summary | `deno test --allow-all` | `tests/loader_test.ts`, `tests/accessors_test.ts`, `tests/summary_test.ts` (new) |
| 10 | Runtime-config gate sweep | All F-* gates | Run full validation plan |

#### `@netscript/config` (slices 11–18)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 11 | Rename `helpers.ts` → `src/domain/saga-inputs.ts`, update imports | `deno check mod.ts` | `helpers.ts` → `src/domain/saga-inputs.ts`, `src/public/mod.ts`, `mod.ts` |
| 12 | Fix `private-type-ref` on `SagaGroupInput` | `deno doc --lint mod.ts` | `src/domain/saga-inputs.ts`, `src/public/mod.ts` |
| 13 | Add JSDoc to `types.ts` interface properties | `deno doc --lint mod.ts` | `types.ts` |
| 14 | Fix `private-type-ref` in `src/merge/mod.ts` | `deno doc --lint src/merge/mod.ts` | `src/merge/mod.ts` |
| 15 | Fix `missing-jsdoc` in `src/schema/plugins/mod.ts` + Zod internal leak | `deno doc --lint src/schema/plugins/mod.ts` | `src/schema/plugins/mod.ts` |
| 16 | Expand `/docs` with `recipes/` and `advanced/` | `find docs -type f` | `docs/recipes/merge-config.md`, `docs/recipes/plugin-schemas.md`, `docs/advanced/extending.md` (new) |
| 17 | Add `arch:barrel-ok` to `src/domain/mod.ts` | `grep arch:barrel-ok src/domain/mod.ts` | `src/domain/mod.ts` |
| 18 | Config gate sweep | All F-* gates | Run full validation plan |

#### `@netscript/contracts` (slices 19–24)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 19 | Move `helpers/paginated-query.ts` → `src/application/paginated-query.ts` | `deno check mod.ts` | `helpers/paginated-query.ts` → `src/application/paginated-query.ts`, `query.ts`, `src/public/mod.ts` |
| 20 | Move `helpers/transform.ts` → `src/application/transform-helpers.ts` | `deno check mod.ts` | `helpers/transform.ts` → `src/application/transform-helpers.ts`, `transform.ts`, `src/public/mod.ts` |
| 21 | Export `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure` from public surface | `deno doc --lint crud.ts query.ts transform.ts` | `src/public/mod.ts`, `src/application/contract-primitives.ts` |
| 22 | Add `getting-started.md` to `/docs` | `find docs -type f` | `docs/getting-started.md` (new) |
| 23 | Add `advanced/extending.md` to `/docs` | `find docs -type f` | `docs/advanced/extending.md` (new) |
| 24 | Contracts gate sweep | All F-* gates | Run full validation plan |

#### Cross-cutting (slices 25–27)

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 25 | Consumer validation: `deno check` on CLI | `cd packages/cli && deno check` | No file changes; validation only |
| 26 | Consumer validation: `deno check` on plugins | `cd plugins/sagas && deno check` + `cd plugins/workers && deno check` | No file changes; validation only |
| 27 | Final workspace gate: `deno publish --dry-run` all three | Per-package dry-run | Validation only |

**Total slices: 27** (< 30 ✓)

### Deferred Scope

- `./testing` subpath for any package — no consumer needs it today.
- `runtime-config` watcher integration test with real `Deno.watchFs` — too flaky for CI; unit-test the loader logic only.
- `contracts` `./builders` subpath — only if a NetScript-defined fluent builder is added later.
- Auto-generated `reference/` pages — future `.llm/tools/generate-reference.ts` handles this.
- `config` dynamic import rewrite — the `unanalyzable-dynamic-import` warning is non-blocking and would require a significant loader refactor.

### Contributor Path

A new developer adding a runtime config topic (e.g. `webhooks`):

1. Open `packages/runtime-config/src/domain/types.ts` — add `WebhookOverride` interface.
2. Open `packages/runtime-config/src/application/loader.ts` — add the topic file read in `loadRuntimeConfig`.
3. Open `packages/runtime-config/mod.ts` — export the new type and accessor.
4. Add test in `tests/loader_test.ts` — assert the new topic loads.
5. Run `deno test --allow-all` and `deno doc --lint mod.ts`.

A new developer adding a config schema section:

1. Open `packages/config/src/domain/` — create `<section>-schema.ts` with Zod schema.
2. Open `packages/config/src/domain/mod.ts` — re-export the new schema.
3. Open `packages/config/types.ts` — add the corresponding TypeScript interface.
4. Open `packages/config/src/public/mod.ts` — export the schema and type.
5. Run `deno doc --lint mod.ts` and `deno test --allow-all`.

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| — | — | Research | Re-baselined all three units against current tree. Real slow-type count = 0 for all. |
| — | — | Plan & Design | Locked 8 decisions, 27 commit slices, archetype = 1 for all three. |
| — | — | PLAN-EVAL | `PASS` (adjusted). Evaluator added F-14 and F-17 to the gate set. |
| 2026-06-06 | 1 | Implement | Added `packages/runtime-config/src/domain/types.ts` with documented runtime override types and finite runtime/topic constants. |
| 2026-06-06 | 1 | Gate | `deno doc --lint src/domain/types.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 2 | Implement | Added `packages/runtime-config/src/application/loader.ts` with the runtime directory resolver, pointer parsing, config loader, and accessor functions extracted from `mod.ts`. |
| 2026-06-06 | 2 | Gate | `deno check src/application/loader.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 3 | Implement | Added `packages/runtime-config/src/application/watcher.ts` with debounced reloads and no package-level console emission. |
| 2026-06-06 | 3 | Gate | `deno check src/application/watcher.ts` passed; `Get-ChildItem src -Recurse -File \| Select-String -Pattern 'console\\.'` returned 0 matches. |
| 2026-06-06 | 4 | Implement | Added `packages/runtime-config/src/diagnostics/summary.ts` with `summarizeRuntimeConfig()` and typed structured summary data. |
| 2026-06-06 | 4 | Gate | `deno check src/diagnostics/summary.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 5 | Implement | Rewrote `packages/runtime-config/mod.ts` as a documented thin barrel over domain, application, and diagnostics modules. |
| 2026-06-06 | 5 | Gate | `deno doc --lint mod.ts` passed; `Get-ChildItem src -Recurse -File \| Select-String -Pattern 'console\\.'` returned 0 matches. |
| 2026-06-06 | 6 | Implement | Added runtime-config package description, license, standard local tasks, and publish include/exclude config to `deno.json`. |
| 2026-06-06 | 6 | Gate | `deno publish --dry-run --allow-dirty` passed with 0 slow-type errors and published `deno.json`, `mod.ts`, and `src/**/*.ts`. |
| 2026-06-06 | 7 | Implement | Added `packages/runtime-config/README.md` covering install, mental model, file layout, APIs, permissions, examples, diagnostics, and stability. |
| 2026-06-06 | 7 | Gate | `(Get-Content README.md).Count` returned 346 lines, satisfying the README >= 150 LOC gate. |
| 2026-06-06 | 8 | Implement | Added runtime-config docs pages for overview, architecture, concepts, getting started, basic usage, testing, reference index, and extending. |
| 2026-06-06 | 8 | Gate | `Get-ChildItem docs -Recurse -File` listed 8 docs files under README, architecture, concepts, getting-started, recipes, reference, and advanced. |
| 2026-06-06 | 9 | Implement | Added runtime-config tests for loader defaults/topic loading/plain pointers, accessors, feature flag fallback, and structured summaries. |
| 2026-06-06 | 9 | Gate | `deno test --allow-all` passed: 8 tests, 0 failed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 10 | Implement | Ran runtime-config gate sweep and fixed lint/format findings from the new tests/docs plus removed `console.` from the root module example. |
| 2026-06-06 | 10 | Gate | Runtime-config sweep passed: `deno check`, `deno doc --lint`, `deno publish --dry-run --allow-dirty`, `deno test --allow-all`, `deno lint`, `deno fmt --check`, README/docs gates, and manual F-1/F-8/F-11/F-12/F-14/F-15/F-16/F-17/F-18 scans. |
| 2026-06-06 | 11 | Implement | Renamed `packages/config/helpers.ts` to `src/domain/saga-inputs.ts` and updated `src/public/mod.ts` exports without changing the root API. |
| 2026-06-06 | 11 | Gate | `deno check mod.ts` passed; helper-name scans found no remaining `helpers.ts` file or `src/helpers` directory in `packages/config`. |
| 2026-06-06 | 12 | Implement | Exported `SagaGroupInput` from `packages/config/src/public/mod.ts` and the root `mod.ts`, fixing the private-type-ref path for saga group inputs. |
| 2026-06-06 | 12 | Gate | `deno doc --lint mod.ts` initially cleared the private-type-ref but remained blocked by the known slice 13 `types.ts` JSDoc errors; see `drift.md`. |
| 2026-06-06 | 13 | Implement | Added JSDoc to the remaining exported `types.ts` interface properties in `SdkConfig`, `NetScriptConfig`, and `NetScriptConfigInput`. |
| 2026-06-06 | 13 | Gate | `deno doc --lint mod.ts` passed after slices 12 and 13 were both present; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 14 | Implement | Exported merge subpath contribution entry types, `NetScriptConfig`, and the referenced config type family; documented `PartialConfig` properties. |
| 2026-06-06 | 14 | Gate | `deno doc --lint src/merge/mod.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 15 | Implement | Added JSDoc to plugin schema interfaces and replaced public `z.ZodType` annotations with a local `PluginSettingsSchema<T>` parse/safeParse contract. |
| 2026-06-06 | 15 | Gate | `deno doc --lint src/schema/plugins/mod.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 16 | Implement | Added config docs recipes for merge contributions and plugin schemas plus `docs/advanced/extending.md`. |
| 2026-06-06 | 16 | Gate | `Get-ChildItem docs -Recurse -File` listed 7 config docs files including recipes and advanced pages. |
| 2026-06-06 | 17 | Implement | Added `arch:barrel-ok` justification to `packages/config/src/domain/mod.ts` and recorded accepted sub-barrel debt. |
| 2026-06-06 | 17 | Gate | `Select-String -Path src/domain/mod.ts -Pattern 'arch:barrel-ok'` found the marker. |
| 2026-06-06 | 18 | Implement | Ran the config gate sweep and fixed sweep findings: stale workspace-member test expectations, unversioned test imports, `console.` examples, explicit public `z.ZodType` annotations, `types.ts` LOC, and `src/domain` folder cardinality by splitting config types and grouping schemas under `src/domain/schemas/`. |
| 2026-06-06 | 18 | Gate | Config sweep passed: `deno check`, `deno doc --lint`, `deno publish --dry-run --allow-dirty`, `deno test --allow-all`, `deno lint`, `deno fmt --check`, README/docs gates, and manual F-1/F-11/F-12/F-14/F-15/F-16/F-17/F-18 scans. Publish dry run reported the known non-failing `unanalyzable-dynamic-import` warning for `loader.ts`. |
| 2026-06-06 | 19 | Implement | Moved `packages/contracts/helpers/paginated-query.ts` to `src/application/paginated-query.ts` and updated `query.ts` to re-export the new role-based module. |
| 2026-06-06 | 19 | Gate | `deno check mod.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 20 | Implement | Moved `packages/contracts/helpers/transform.ts` to `src/application/transform-helpers.ts`, updated `transform.ts`, and removed the empty `helpers/` directory. |
| 2026-06-06 | 20 | Gate | `deno check mod.ts` passed; extra `deno check transform.ts` passed for the moved subpath; helper-directory scan found no `helpers/` directory under `packages/contracts`. |
| 2026-06-06 | 21 | Implement | Exported `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure`, and transitive `ContractParseResult` from the `./crud` and/or `./query` subpath barrels so public signatures have complete docs. |
| 2026-06-06 | 21 | Gate | `deno doc --lint crud.ts query.ts transform.ts` passed; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 22 | Implement | Added `packages/contracts/docs/getting-started.md` and linked it from the contracts docs index. |
| 2026-06-06 | 22 | Gate | `Get-ChildItem docs -Recurse -File` listed 6 contracts docs files including `docs/getting-started.md`. |
| 2026-06-06 | 23 | Implement | Added `packages/contracts/docs/advanced/extending.md` and linked it from the contracts docs index. |
| 2026-06-06 | 23 | Gate | `Get-ChildItem docs -Recurse -File` listed 7 contracts docs files including `docs/advanced/extending.md`. |
| 2026-06-06 | 24 | Implement | Ran the contracts gate sweep, removed a stale lint ignore, normalized package formatting, removed the stale `helpers/**/*.ts` publish include, marked `src/public/mod.ts` with `arch:barrel-ok`, and updated architecture debt for the closed helpers directory plus accepted root `crud/` layout. |
| 2026-06-06 | 24 | Gate | Contracts sweep passed: `deno check`, `deno doc --lint`, `deno publish --dry-run --allow-dirty`, `deno test --allow-all`, `deno lint`, `deno fmt --check`, README/docs gates, and manual F-1/F-11/F-12/F-14/F-15/F-16/F-17/F-18 scans. |
| 2026-06-06 | 25 | Gate | `cd packages/cli && deno check` passed with 0 errors; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 26 | Gate | `cd plugins/sagas && deno check` and `cd plugins/workers && deno check` both passed with 0 errors; Deno reported unrelated workspace-config warnings from `examples/playground/deno.json`. |
| 2026-06-06 | 27 | Gate | Final publish dry run passed for `packages/runtime-config`, `packages/config`, and `packages/contracts`: all three completed `deno publish --dry-run --allow-dirty` with 0 slow-type errors. `packages/config` retained the known non-failing `unanalyzable-dynamic-import` warning for `loader.ts`. |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| Archetype 1 for all three | Value is type clarity, not runtime behavior | doctrine/06-archetypes.md |
| Split `runtime-config/mod.ts` | Mixes domain/application/presentation in one file | A8, doctrine/10 verdict |
| Rename `helpers.ts` / `helpers/` | Generic folder names hide real concerns | AP-16 |
| Export referenced types for `private-type-ref` | `deno doc --lint` requires public types for public signatures | F-5 |
| Remove Zod internal from public signatures | Prevents breakage on Zod version bumps | jsr-audit rubric |
| Replace console with return-value diagnostics | AP-13 violation; callers should control output | doctrine/09 |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|-------------------|
| Config slices 12-13 gate dependency | minor | yes |
| Config merge subpath type exports | minor | yes |
| Config plugin schema public annotation | minor | yes |
| Config sweep static/cardinality cleanup | minor | yes |
| Contracts subpath transitive schema type export | minor | yes |
| Contracts root `crud/` layout accepted debt | minor | arch-debt.md |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|-----------------|--------|-------|
| `deno check` | `deno check mod.ts` | NOT_RUN | Will run per slice |
| `deno lint` | `deno lint` | NOT_RUN | Will run per slice |
| `deno fmt --check` | `deno fmt --check` | NOT_RUN | Will run per slice |

### Fitness Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| F-1 File-size lint | PENDING_SCRIPT | Manual check: all files < 500 LOC | `runtime-config` split addresses this |
| F-5 Public surface audit | PENDING_SCRIPT | `deno doc --lint` per entrypoint | Will run after each slice |
| F-6 JSR publishability | PASS | `deno publish --dry-run` = 0 slow types | Already true for all three |
| F-7 Doc-score gate | PENDING_SCRIPT | README + docs + JSDoc | In progress |
| F-10 Test-shape audit | PENDING_SCRIPT | Tests exist / will be added | `runtime-config` needs tests |
| F-11 Forbidden-folder lint | PENDING_SCRIPT | No `helpers/` after renames | Will verify after slices 11, 19, 20 |
| F-12 Naming-convention lint | PENDING_SCRIPT | Manual review | No violations detected |
| F-14 Console-log lint | PENDING_SCRIPT | `grep -rn "console\." mod.ts src/` after slices 3–5 | runtime-config console usage removed by L5 |
| F-15 Re-export-upstream lint | PENDING_SCRIPT | No upstream re-exports | Will verify |
| F-16 Folder-cardinality lint | PENDING_SCRIPT | ≤ 12 children per dir | Will verify |
| F-17 Abstract-derived co-location | PENDING_SCRIPT | No abstract/derived class pairs | Type-only/factory surfaces; no violation |
| F-18 Sub-barrel lint | PENDING_SCRIPT | `arch:barrel-ok` on domain mod.ts | Slice 17 |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
|----------|--------|----------|-------|
| `packages/cli` | PASS | `deno check` | Slice 25, 0 errors |
| `plugins/sagas` | PASS | `deno check` | Slice 26, 0 errors |
| `plugins/workers` | PASS | `deno check` | Slice 26, 0 errors |

### Runtime-config Slice 10 Sweep

| Gate | Result | Evidence |
|------|--------|----------|
| Static check | PASS | `deno check mod.ts` |
| Lint | PASS | `deno lint` |
| Format | PASS | `deno fmt --check` |
| F-5 / F-7 doc lint | PASS | `deno doc --lint mod.ts` |
| F-6 publishability | PASS | `deno publish --dry-run --allow-dirty` = 0 slow-type errors |
| F-7 README | PASS | `(Get-Content README.md).Count` = 339 |
| F-7 docs | PASS | `Get-ChildItem docs -Recurse -File` = 8 docs files |
| F-10 tests | PASS | `deno test --allow-all` = 8 passed, 0 failed |
| F-1 file size | PASS | No `.ts` or `.md` file > 500 LOC |
| F-8 workspace lib | PASS | Root `deno.json` includes `deno.ns` and `deno.unstable` |
| F-11 forbidden folders | PASS | No `utils`, `helpers`, `common`, `lib`, or `interfaces` under `src/` |
| F-12 naming | PASS | No exported `I*`, `*_T`, or `*Impl` declarations |
| F-14 console | PASS | No `console.` in `mod.ts` or `src/` |
| F-15 upstream re-export | PASS | No upstream `npm:`, `jsr:`, `@std`, or `@orpc` re-exports |
| F-16 cardinality | PASS | No `src/` directory has more than 12 immediate children |
| F-17 abstract-derived | PASS | No abstract classes or `extends` relationships in `src/` |
| F-18 sub-barrel | PASS | No `src/**/mod.ts` sub-barrels |

### Config Slice 18 Sweep

| Gate | Result | Evidence |
|------|--------|----------|
| Static check | PASS | `deno check mod.ts` |
| Lint | PASS | `deno lint` |
| Format | PASS | `deno fmt --check` |
| F-5 / F-7 doc lint | PASS | `deno doc --lint mod.ts src/merge/mod.ts src/schema/plugins/mod.ts` |
| F-6 publishability | PASS | `deno publish --dry-run --allow-dirty` = 0 slow-type errors; known `unanalyzable-dynamic-import` warning only |
| F-7 README | PASS | `(Get-Content README.md).Count` = 255 |
| F-7 docs | PASS | `Get-ChildItem docs -Recurse -File` = 7 docs files |
| F-10 tests | PASS | `deno test --allow-all` = 10 passed, 0 failed |
| F-1 file size | PASS | No non-test `.ts` file > 500 LOC; `types.ts` split into section/root type modules |
| F-11 forbidden folders | PASS | No `utils`, `helpers`, `common`, `lib`, or `interfaces` under `src/` |
| F-12 naming | PASS | No exported `I*`, `*_T`, or `*Impl` declarations by case-sensitive scan |
| F-14 console/Zod public annotation scan | PASS | No `console.` or `z.ZodType` in `mod.ts` or `src/` |
| F-15 upstream re-export | PASS | No upstream `npm:`, `jsr:`, `@std`, or `@orpc` re-exports |
| F-16 cardinality | PASS | No `src/` directory has more than 12 immediate children after grouping domain schemas |
| F-17 abstract-derived | PASS | No abstract classes or class `extends` relationships in `src/` |
| F-18 sub-barrel | PASS | `src/domain/mod.ts` has `arch:barrel-ok` |

### Contracts Slice 24 Sweep

| Gate | Result | Evidence |
|------|--------|----------|
| Static check | PASS | `deno check mod.ts crud.ts query.ts transform.ts` |
| Lint | PASS | `deno lint` |
| Format | PASS | `deno fmt --check` |
| F-5 / F-7 doc lint | PASS | `deno doc --lint mod.ts crud.ts query.ts transform.ts` |
| F-6 publishability | PASS | `deno publish --dry-run --allow-dirty` = 0 slow-type errors |
| F-7 README | PASS | `(Get-Content README.md).Count` = 424 |
| F-7 docs | PASS | `Get-ChildItem docs -Recurse -File` = 7 docs files |
| F-10 tests | PASS | `deno test --allow-all` = 4 passed, 0 failed |
| F-1 file size | PASS | No non-test `.ts` file > 500 LOC |
| F-11 forbidden folders | PASS | No `utils`, `helpers`, `common`, `lib`, or `interfaces` directory under the package |
| F-12 naming | PASS | No exported `I*`, `*_T`, or `*Impl` declarations by case-sensitive scan |
| F-14 console | PASS | No `console.` in published TypeScript sources |
| F-15 upstream re-export | PASS | No upstream `npm:`, `jsr:`, `@std`, or `@orpc` re-exports |
| F-16 cardinality | PASS | No `src/` directory has more than 12 immediate children |
| F-17 abstract-derived | PASS | No abstract classes or class `extends` relationships in `src/`, `crud/`, or `schemas/` |
| F-18 sub-barrel | PASS | `src/public/mod.ts` has `arch:barrel-ok`; root `crud/` layout recorded as accepted debt |

### Final Slice 27 Publish Sweep

| Package | Result | Evidence |
|---------|--------|----------|
| `@netscript/runtime-config` | PASS | `deno publish --dry-run --allow-dirty` completed with 0 slow-type errors |
| `@netscript/config` | PASS | `deno publish --dry-run --allow-dirty` completed with 0 slow-type errors; known dynamic-import warning only |
| `@netscript/contracts` | PASS | `deno publish --dry-run --allow-dirty` completed with 0 slow-type errors |

## Handoff Notes

- Evaluator should inspect `runtime-config` split first — it is the largest structural change.
- Verify `deno doc --lint` is clean on ALL entrypoints (root + every subpath) before approving.
- Check that no `helpers/` folder remains after slices 11, 19, 20.
- Confirm `runtime-config` has tests before final gate.
- Implementation completed through slice 27. Hand off to a separate IMPL-EVAL session; do not use
  this implementation session as the evaluator.

## Post-review CLI E2E Fix

Reviewer feedback found that the bare CLI E2E gate still exercised only a narrow plugin scaffold
suite. The runner now maps bare `deno task e2e:cli` to the full `scaffold.runtime` suite with
cleanup, and the documentation/tooling has been updated to make that merge-readiness contract
explicit.

| Gate | Result | Evidence |
|------|--------|----------|
| Unit/static follow-up | PASS | `deno check --unstable-kv packages/cli/e2e/mod.ts packages/cli/e2e/cli.ts packages/telemetry/src/instrumentation/queue.ts packages/queue/adapters/redis.adapter.ts packages/kv/core/auto-detect.ts plugins/workers/bin/runtime.ts plugins/workers/worker/job-execution.ts plugins/workers/worker/worker.ts plugins/triggers/src/runtime/trigger-runtime-processor.ts` |
| Focused tests | PASS | `deno test --allow-all packages/cli/e2e/tests packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts` = 21 passed |
| KV auto-detect tests | PASS | `deno test --allow-env packages/kv/tests/auto-detect_test.ts` = 2 passed |
| Full CLI E2E | PASS | `deno task e2e:cli` = `passed=41 failed=0 skipped=0` |
| Cleanup check | PASS | `docker ps` returned no containers; `aspire ps` reported no running apphost |
