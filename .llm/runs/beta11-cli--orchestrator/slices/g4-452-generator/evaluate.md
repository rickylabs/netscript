# Evaluation: G4 #452 desktop Aspire generator

## Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g4-452-generator`                    |
| Target         | `packages/cli` Aspire generator + public `packages/aspire` config/types |
| Archetype      | `6 — CLI / Tooling` (folded Archetype 2 concern)                      |
| Scope overlays | `none`                                                                |
| Evaluator      | `qwen/qwen3.7-max / Claude Code + OpenRouter / 2026-07-18`            |

## Process Verification

| Check                                  | Result   | Evidence                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS`   | `plan-eval.md` verdict `PASS`, supervisor group Plan-Gate 2026-07-17; S1 started after         |
| Design section exists in worklog       | `PASS`   | `## Design` in `worklog.md` with public surface, domain vocabulary, ports, constants, inventory |
| Commit slices match design plan        | `PASS`   | 2 source commits (S1 `c62a6949`, S2 `2dc0c809`) match design slices S1+S2; S3 deferred to supervisor per plan |
| Each slice has a passing gate          | `PASS`   | S1: aspire tests 35 steps, consumer compile, doc-lint, publish dry-run, quality:scan, arch:check; S2: 13 tests / 134 steps, all acceptance assertions, same gates re-run |
| No speculative seams (unused files)    | `PASS`   | No new file created; only existing files modified. No dead code.                               |
| Constants used for finite vocabularies | `PASS`   | `AppType` extended via Zod `z.enum(['app','tauri','task','desktop'])` — canonical string union; no parallel constant |

## Static Gates

| Gate             | Command or check                                                                                          | Result   | Evidence                                                                                                      | Notes                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Narrow typecheck | `deno check --unstable-kv packages/cli/.../generators-test-support.ts`                                    | `PASS`   | Worklog S1 gate; `DESKTOP_APP` fixture compiles through `@netscript/aspire/types`                              | Consumer = CLI test-support              |
| Slice typecheck  | Covered by test runners (config_test, types_test, generators-*_test)                                       | `PASS`   | All `deno test` runs include implicit `deno check`                                                             | —                                        |
| Format           | Scoped wrappers via `.llm/tools/run-deno-fmt.ts`                                                          | `PASS`   | Worklog S1+S2 gate tables                                                                                      | —                                        |
| Lint             | Scoped wrappers via `.llm/tools/run-deno-lint.ts`                                                         | `PASS`   | Worklog S1+S2 gate tables                                                                                      | —                                        |
| Doc lint         | `deno task doc:lint --root packages/aspire --pretty`                                                       | `PASS`   | Evaluator re-run: `totalErrors: 0, totalPrivateTypeRef: 0, totalMissingJSDoc: 0, totalOther: 0`                 | Per-entrypoint: all 0 at package total level |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` from `packages/aspire`                                             | `PASS`   | Worklog S1 gate; doc-lint clean confirms no slow-type risk from `.transform`                                  | Not re-run (not release)                 |
| Link/path check  | N/A                                                                                                       | `N/A`    | No docs or link-bearing files changed                                                                         | —                                        |

## Fitness Gates

| Gate | Function                         | Result      | Evidence                                                                                                     | Violations |
| ---- | -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| F-1  | File-size lint                   | `PASS`      | `config.ts` + `generate-register-apps.ts` well within thresholds; new ~30-line function                       | none       |
| F-2  | Helper-reinvention scan          | `PASS`      | `buildDesktopBlock()` is a sibling of `buildTauriBlock()`/`buildAppBlock()` — same pattern, no new helper layer | none       |
| F-3  | Layering check                   | `PASS`      | No new layer, port, or adapter introduced                                                                    | none       |
| F-4  | Inheritance audit                | `PASS`      | No new class or inheritance relationship                                                                     | none       |
| F-5  | Public surface audit             | `PASS`      | `deno doc packages/aspire/types.ts` shows `AppType` and `AppEntry` correctly alias the widened config types; `doc:lint` zero diagnostics | none       |
| F-6  | JSR publishability gate          | `PASS`      | Publish dry-run exit 0; explicit `AspireSchema<AppEntry>` annotation on L437 prevents slow type                | none       |
| F-7  | Doc-score gate                   | `PASS`      | Combined with F-5; doc-lint confirms JSDoc coverage on public symbols                                          | none       |
| F-8  | Workspace lib override check     | `N/A`       | No workspace config change                                                                                   | —          |
| F-9  | Permission declaration check     | `PASS`      | No new runtime permission; generator emits source only                                                       | none       |
| F-10 | Test-shape audit                 | `PASS`      | Tests follow existing `generators-*_test.ts` pattern: `describe`+`it`, semantic `assertStringIncludes`          | none       |
| F-11 | Forbidden-folder lint            | `PASS`      | No new folders created                                                                                       | none       |
| F-12 | Naming-convention lint           | `PASS`      | `buildDesktopBlock` follows `buildTauriBlock`/`buildAppBlock` convention                                       | none       |
| F-13 | Saga and runtime invariants      | `N/A`       | No saga or durable-workflow change                                                                           | —          |
| F-14 | Console-log lint                 | `PASS`      | No console.log in source                                                                                     | none       |
| F-15 | Re-export-of-upstream lint       | `N/A`       | No upstream re-export                                                                                        | —          |
| F-16 | Folder-cardinality lint          | `PASS`      | No folder children changed                                                                                   | none       |
| F-17 | Abstract-derived co-location     | `N/A`       | No abstract class pattern                                                                                    | —          |
| F-18 | Sub-barrel lint                  | `N/A`       | No barrel change                                                                                             | —          |
| F-19 | Scoped source gate runners       | `PASS`      | `quality:scan` exit 0, no findings, 7 pre-existing allowances (unchanged); `arch:check` exit 0                   | none       |

## Runtime Gates

| Gate                            | Validation                                                                 | Result   | Evidence                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aspire config tests             | `deno test packages/aspire/tests/config_test.ts`                           | `PASS`   | Evaluator re-run: 1 test / 30 steps passed. Includes 3 new desktop steps: `AppTypeSchema` accepts desktop, `AppEntrySchema` conditional defaults, `PackageTaskName` preservation |
| Aspire type tests               | `deno test packages/aspire/tests/types_test.ts`                            | `PASS`   | Evaluator re-run: 1 test / 5 steps passed. New step `AppType and AppEntry expose the desktop contract` verifies literal `AppEntry` with `PackageTaskName: 'desktop:package'`      |
| Generator test suite            | `deno test packages/cli/.../helpers/tests/`                                | `PASS`   | Evaluator re-run: 13 tests / 134 steps passed. 4 new desktop `it()` blocks; all existing tests green                                                   |
| Build-order acceptance          | Build declaration → window declaration → `waitForCompletion(build)`         | `PASS`   | Test `should make desktop launch wait for the Fresh build resource` asserts index ordering: `dashboard_build` < `dashboard` < `await dashboard.waitForCompletion(dashboard_build)` |
| CEF argv acceptance             | Exact argv without task-level `--` separator                                | `PASS`   | Same test asserts `['task', 'desktop:predev', '--backend', 'cef']` present and `['task', 'desktop:predev', '--', '--backend', 'cef']` absent            |
| Discovery injection acceptance  | Server-side `services__*__http__0` only, no Vite, no endpoint              | `PASS`   | Test `should inject server-side discovery without an Aspire HTTP endpoint for desktop` asserts service+plugin discovery, no `buildViteEnvVarName`, no `withHttpEndpoint`, no `PORT` |
| Opt-in gating acceptance        | Desktop `Enabled === true` at schema + generator boundaries                | `PASS`   | Schema test: `AppEntrySchema.parse({Type:'desktop'}).Enabled === false` and `.parse({Type:'app'}).Enabled === true`; generator test: `Enabled === true` guard emitted |
| Non-desktop stability           | Existing app/tauri/task generator outputs unchanged                        | `PASS`   | All existing generator tests pass unchanged; no modification to `generate-appsettings.ts` or non-desktop block builders                                   |
| `quality:scan`                  | `deno task quality:scan`                                                   | `PASS`   | Evaluator re-run: `ok:true, findings:[], allowCount:7` (all pre-existing)                                                                             |
| `arch:check`                    | `deno task arch:check`                                                     | `PASS`   | Evaluator re-run: exit 0. Dependency WARNs are pre-existing npm-catalog baseline, none introduced by G4                                                 |
| Full `scaffold.runtime`         | Supervisor-owned at merge-readiness                                        | `NOT_RUN` | Out of scope for generator session; S2 marks it SUPERVISOR-OWNED in gate table                                                                          |

## Consumer Gates

| Consumer                      | Validation                                                       | Result   | Evidence                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| CLI test-support consumer     | `deno check --unstable-kv` on `generators-test-support.ts`       | `PASS`   | Literal `DESKTOP_APP: AppEntry` fixture (with `PackageTaskName`, `ServiceReferences`, `PluginReferences`) compiles through `@netscript/aspire/types` |
| `@netscript/aspire/types` export | `AppType` and `AppEntry` alias widening                        | `PASS`   | `types.ts` L21/L23 imports `AppEntry as AppEntryConfig` and `AppType as AppTypeConfig` from config.ts; L53/L89 re-exports. Config.ts `AppType` now includes `'desktop'`; `AppEntry` includes `PackageTaskName?: string` |
| Zod `.transform` no slow type | Explicit `AspireSchema<AppEntry>` annotation on `AppEntrySchema` | `PASS`   | `config.ts:437`: `export const AppEntrySchema: AspireSchema<AppEntry> = AppEntryZod;` — transform return typed as `AppEntry`, not inferred. `doc:lint` zero diagnostics confirms |

## Anti-Pattern Check

| AP    | Status       | Evidence                                                                                                    | Notes                                                 |
| ----- | ------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AP-1  | `CLEAR`      | No new monolith or giant file; focused additions to existing files                                           | `config.ts` +13 lines, `generate-register-apps.ts` +69 lines |
| AP-2  | `CLEAR`      | Uses Aspire primitives directly: `addExecutable`, `withEnvironment`, `getResourceEndpoint`, `waitForCompletion` | No renaming helper or local wrapper abstraction       |
| AP-3  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-4  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-5  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-6  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-7  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-8  | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-9  | `CLEAR`      | `buildDesktopBlock` mirrors `buildTauriBlock` pattern; no speculative abstraction over four variants          | Sibling block, not a meta-framework                    |
| AP-10 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-11 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-12 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-13 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-14 | `CLEAR`      | No upstream re-export                                                                                       | —                                                     |
| AP-15 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-16 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-17 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-18 | `CLEAR`      | Semantic fragment assertions (`assertStringIncludes`, index ordering) rather than full-string snapshots       | Matches existing test shape                           |
| AP-19 | `CLEAR`      | Generator emits source only; no new runtime permission                                                       | —                                                     |
| AP-20 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-21 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-22 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-23 | `N/A`        | Not in scope                                                                                                | —                                                     |
| AP-24 | `DEBT_ACCEPTED` | Existing: `AppType` closed dispatch is domain branching, not adapter selection                              | Plan notes this; no new registry or pattern introduced |
| AP-25 | `CLEAR`      | Generator produces string output only                                                                       | —                                                     |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                        |
| --------------------- | ----- | ------------------------------------------------------------------------------- |
| New entries           | 0     | No new debt entry in `arch-debt.md`                                              |
| Resolved entries      | 0     | No debt entry resolved                                                          |
| Deepened violations   | 0     | CommunityToolkit Deno AppHost gap unchanged; `addExecutable()` pattern reused    |
| Unrecorded violations | 0     | No new doctrine violation introduced (AP check above)                            |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | None    | —        | —               |

## #452 Acceptance Verification (issue body cross-check)

| #  | Acceptance criterion                                                                                       | Proven by                                                                                                         | Result   |
| -- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| 1  | Build-order gate baked in — `waitFor`/predev the Fresh build                                               | Test `should make desktop launch wait for the Fresh build resource`: build resource declaration → window declaration → `waitForCompletion(build)` source-order assertion | `PASS`   |
| 2  | `--backend cef` emitted (not config, not `--`)                                                             | Same test: exact `['task', 'desktop:predev', '--backend', 'cef']` asserted present; `['task', 'desktop:predev', '--', '--backend', 'cef']` asserted absent. Deno 2.9.3 argv verification in research | `PASS`   |
| 3  | Service-discovery injection, no HTTP endpoint                                                              | Test `should inject server-side discovery without an Aspire HTTP endpoint for desktop`: service+plugin `services__*__http__0` with `getResourceEndpoint`; no `buildViteEnvVarName`; no `withHttpEndpoint`; no `PORT` | `PASS`   |
| 4  | Opt-in gating (`Enabled:false` default)                                                                    | Schema test: `AppEntrySchema.parse({Type:'desktop'}).Enabled === false`, `.parse({Type:'app'}).Enabled === true`. Generator test: `Enabled === true` (strict) guard emitted for desktop | `PASS`   |
|    | **+ RFC #820 amendment**: `AppType`/`AppEntry` gain `"desktop"` in public `./types` surface; `PackageTaskName` hook | `types.ts` re-exports widened types; `PackageTaskName?: string` on `AppEntry`; JSR gates (doc-lint, publish dry-run, consumer compile) all green | `PASS`   |
| 5  | Generator unit tests mirror existing `generators-*_test.ts` pattern                                        | 4 new desktop `it()` blocks in `generators-background-app_test.ts`; all 13 tests / 134 steps green                   | `PASS`   |
|    | `scaffold.plugins`/`scaffold.runtime` unaffected for non-desktop configs                                   | All existing app/tauri/task generator tests pass unchanged; `generate-appsettings.ts` untouched; `scaffold.runtime` supervisor-owned | `PASS`   |

## Lessons for Promotion

| Lesson                                          | Pattern                                                                  | Applies to          | Confidence |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------- | ---------- |
| Conditional schema default via `.transform`     | Zod `.transform` with explicit return-type annotation avoids slow type    | Archetype 2, 6      | `high`     |
| Opt-in at both schema and generated-code layers | Dual-boundary enforcement (config parse + emitted guard) prevents drift   | Archetype 6, CLI gen | `high`     |
| Sibling block pattern over abstraction          | `build{Variant}Block()` parallel structure scales without speculative AP-9 | Archetype 6         | `medium`   |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | `PASS` |
| Rationale | Every #452 acceptance item (5 original + RFC amendment) is proven by tests the evaluator re-ran. Design checkpoint was followed; Plan-Gate `PASS` preceded implementation; commit slices S1/S2 match the design plan. All static gates (scoped check/lint/fmt, doc-lint with zero diagnostics, publish dry-run, quality:scan, arch:check) passed via evaluator re-run or generator evidence confirmed. No new arch-debt, no doctrine violation, no speculative seam. The Zod `.transform` on `AppEntrySchema` retains the explicit `AspireSchema<AppEntry>` annotation (L437), confirmed slow-type-free by doc-lint. Non-desktop scaffold stability is proven by all existing generator tests passing unchanged. Full `scaffold.runtime` remains supervisor-owned per the run plan and is correctly deferred. |
