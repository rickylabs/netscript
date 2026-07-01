# Evaluate — `@netscript/cli`

> Wave: **6** · Archetype: **A6 — Tooling** · Pattern: **Builder + Composition root**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__cli.json` · `audit/dry-run/cli.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 4 | — |
| Doctrine | 39 | 20 | 0 |
| Standards | 1 | 199 | 3 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/cli` @ `1.0.0`
- **Description:** *(missing)*
- **Files / LOC:** 457 `.ts` files, 42364 lines
- **Exports:** `.`, `./scaffolding`, `./testing`
- **README:** 118 lines
- **`docs/` folder:** present
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./scaffolding: ✓, ./testing: ✓
- **Test files:** 57
- **Public surface size:** .=1, ./scaffolding=8, ./testing=12

## 3. Current folder tree (`packages/cli/`, depth 4, capped at 80 entries)

```
README.md
src/
  local/
    features/
      plugins/
    composition/
      create-local-contributor-cli.ts
      local-contributor-command-tree.ts
      local-contributor-command-tree_test.ts
  public/
    public-api.ts
    features/
      contracts/
      root/
      generate/
      plugins/
      services/
      db/
      deploy/
      init/
    templates/
      plugins/
    composition/
      run-public-cli.ts
      create-public-cli.ts
    domain/
      service-add-plan.ts
      scaffold-plan.ts
      scaffold-plan_test.ts
      db-add-plan.ts
      plugin-add-plan.ts
    adapters/
      jsr-import-resolver.ts
      jsr-import-resolver_test.ts
      servy-cli.ts
    presentation/
      support.ts
    ports/
      jsr-resolver-port.ts
      windows-service-port.ts
      service-manifest-port.ts
    scaffolding/
      plugin-scaffolding.ts
  kernel/
    constants/
      helpers-files.ts
      platform.ts
      template-conventions.ts
      jsr-specifiers.ts
      windows.ts
      paths.ts
      providers.ts
      scaffold/
      port-ranges.ts
      runtime.ts
    assets/
      manifest.ts
      database/
      workspace/
      service/
      aspire/
      maintainer/
      generated/
      plugins/
      app/
      windows/
    templates/
      database/
      workspace/
      service/
      aspire/
      plugins/
      app/
    domain/
      errors/
      plugin-kind.ts
      service-shape.ts
      core-types.ts
      errors.ts
      service-manifest.ts
```

## 4. `deno publish --dry-run` output (tail)

```
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/plugins/add/render-plugin.ts (4.06KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/plugins/list/list-plugins-command.ts (4.34KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/plugins/list/list-plugins-input.ts (851B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/plugins/plugins-group.ts (803B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/root/public-command-dependencies.ts (9.17KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/root/public-command-tree.ts (1.85KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/add/add-service-command.ts (2.35KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/add/add-service-input.ts (444B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/add/add-service.ts (2.46KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/add/plan-service-add.ts (2.49KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/add/render-service.ts (1.51KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/generate/generate-service-command.ts (1.55KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/list/list-services-command.ts (1.78KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/list/list-services-input.ts (132B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/features/services/services-group.ts (1.2KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/ports/jsr-resolver-port.ts (145B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/ports/service-manifest-port.ts (1.11KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/ports/windows-service-port.ts (1.35KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/presentation/support.ts (1.43KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/public-api.ts (10.9KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/scaffolding/plugin-scaffolding.ts (4.68KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/src/public/templates/plugins/public-plugin-generators.ts (460B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cli/testing.ts (7.94KB)
Success Dry run complete

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`src/kernel/assets/aspire/helpers`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`src/kernel/assets/generated/aspire/helpers`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'lib' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`src/kernel/assets/app/lib`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`src/kernel/templates/aspire/helpers`)

## 6. Top doctrine findings

- **FAIL** `A4` — abstract class CliExitError declares no abstract members — bases are stub-only contracts (`src/kernel/domain/errors/cli-exit-error.ts`)
- **FAIL** `A4` — abstract class Pipeline declares no abstract members — bases are stub-only contracts (`src/kernel/application/abstracts/pipeline.ts`)
- **FAIL** `A4` — abstract class ScaffoldCommand declares no abstract members — bases are stub-only contracts (`src/kernel/presentation/abstracts/scaffold-command.ts`)
- **FAIL** `A4` — abstract class DeployStepCommand declares no abstract members — bases are stub-only contracts (`src/kernel/presentation/abstracts/deploy-step-command.ts`)
- **FAIL** `A4` — abstract class ListCommand declares no abstract members — bases are stub-only contracts (`src/kernel/presentation/abstracts/list-command.ts`)
- **WARN** `A5/AP-1` — class ScaffoldError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ScaffoldDirExistsError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ScaffoldValidationError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ScaffoldTemplateError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ScaffoldGitError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ConfigNotFoundError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ConfigInvalidError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class CompileError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class CompileTimeoutError sits 3+ levels deep in inheritance chain — prefer composition
- **WARN** `A5/AP-1` — class ServyNotFoundError sits 3+ levels deep in inheritance chain — prefer composition

## 7. Top standards findings

- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-4.fn-prefix` — exported function 'addLocalPlugin' uses non-standard prefix 'add' — consult STANDARDS § 4.1 (`src/local/features/plugins/add/add-local-plugin.ts:81`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateAspire' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`src/public/features/generate/aspire/generate-aspire.ts:52`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateConfigSchema' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:98`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'planConfigSchemaWrites' uses non-standard prefix 'plan' — consult STANDARDS § 4.1 (`src/public/features/generate/runtime-schemas/generate-runtime-schemas.ts:136`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'addPlugin' uses non-standard prefix 'add' — consult STANDARDS § 4.1 (`src/public/features/plugins/add/add-plugin.ts:39`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'planPluginAdd' uses non-standard prefix 'plan' — consult STANDARDS § 4.1 (`src/public/features/plugins/add/plan-plugin-add.ts:30`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'planServiceAdd' uses non-standard prefix 'plan' — consult STANDARDS § 4.1 (`src/public/features/services/add/plan-service-add.ts:24`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'addService' uses non-standard prefix 'add' — consult STANDARDS § 4.1 (`src/public/features/services/add/add-service.ts:42`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'exitWithCode' uses non-standard prefix 'exit' — consult STANDARDS § 4.1 (`src/public/features/db/operations/db-operation-command.ts:89`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'planDbAdd' uses non-standard prefix 'plan' — consult STANDARDS § 4.1 (`src/public/features/db/add/plan-db-add.ts:20`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'addDb' uses non-standard prefix 'add' — consult STANDARDS § 4.1 (`src/public/features/db/add/add-db.ts:36`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'copyWindowsTaskFiles' uses non-standard prefix 'copy' — consult STANDARDS § 4.1 (`src/public/features/deploy/build/build-windows-tasks.ts:10`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'compileWindowsCli' uses non-standard prefix 'compile' — consult STANDARDS § 4.1 (`src/public/features/deploy/build/build-windows-cli.ts:9`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'requireProjectRoot' uses non-standard prefix 'require' — consult STANDARDS § 4.1 (`src/public/presentation/support.ts:11`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'requireString' uses non-standard prefix 'require' — consult STANDARDS § 4.1 (`src/public/presentation/support.ts:30`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'planPluginScaffoldFiles' uses non-standard prefix 'plan' — consult STANDARDS § 4.1 (`src/public/scaffolding/plugin-scaffolding.ts:85`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateEngineMod' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`src/kernel/templates/database/generate-engine-mod.ts:25`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateDatabaseDenoJson' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`src/kernel/templates/database/generate-db-deno-json.ts:27`)

## 8. Code-quality verdict

Top STANDARDS warnings: `NS-S-1.version`, `NS-S-4.fn-prefix`, `NS-S-4.fn-prefix`.

## 9. Test coverage assessment

57 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
