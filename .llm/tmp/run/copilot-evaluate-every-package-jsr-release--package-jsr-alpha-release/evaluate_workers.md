# Evaluate — `@netscript/workers`

> Wave: **4** · Archetype: **A3 — Runtime/Behavior** · Pattern: **Abstract base + Default + Registry**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__workers.json` · `audit/dry-run/workers.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 2 | — |
| Doctrine | 1 | 12 | 2 |
| Standards | 4 | 22 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **50**

## 2. Package facts

- **Name:** `@netscript/workers` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 44 `.ts` files, 13106 lines
- **Exports:** `.`, `./types`, `./presets`, `./streams/server`, `./streams/schema`, `./contracts`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./types: ✓, ./presets: ✓, ./streams/server: ✓, ./streams/schema: ✓, ./contracts: ✓
- **Test files:** 1
- **Public surface size:** .=70, ./types=36, ./presets=5, ./streams/server=6, ./streams/schema=5, ./contracts=42

## 3. Current folder tree (`packages/workers/`, depth 4, capped at 80 entries)

```
registry/
  task-registry.ts
  base-registry.ts
  mod.ts
  job-registry.ts
runtime/
  job-context.ts
  mod.ts
  job-handler.ts
  job-result.ts
streams/
  schema.ts
  server.ts
  producer.ts
workflow/
  workflow-executor.ts
  run-workflow.ts
  types.ts
  mod.ts
  workflow-builder.ts
pool/
  mod.ts
  worker-pool.ts
  messages.ts
  job-worker-runtime.ts
  job-worker.ts
builders/
  task-builder.ts
  mod.ts
  job-builder.ts
executor/
  task-executor.ts
  mod.ts
contracts/
  mod.ts
  workers.contract.ts
types.ts
mod.ts
core/
  mod.ts
  execution-state.ts
  execution-state_test.ts
deno.json
helpers/
  permissions.ts
  mod.ts
  cron.ts
types/
  mod.ts
  task.ts
  job.ts
shutdown/
  mod.ts
  shutdown-manager.ts
presets/
  start-workers.ts
  mod.ts
  start-combined.ts
```

## 4. `deno publish --dry-run` output (tail)

```
  info: importing modules in another package using a relative import won't work once the packages are published
  docs: https://jsr.io/go/relative-package-import

warning[unanalyzable-dynamic-import]: unable to analyze dynamic import
   --> /home/runner/work/netscript-start/netscript-start/packages/workers/pool/job-worker-runtime.ts:255:35
    | 
255 |             module = await import(moduleUrl);
    |                                   ^^^^^^^^^ the unanalyzable dynamic import
    | 

  info: after publishing this package, imports from the local import map / package.json do not work
  info: dynamic imports that can not be analyzed at publish time will not be rewritten automatically
  info: make sure the dynamic import is resolvable at runtime without an import map / package.json

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 50 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`helpers`)
- **WARN** `F-DOCT-5 cardinality` — directory has 16 immediate children; doctrine cap is 12

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'helpers' — split into domain/, application/, or adapters/ aligned to a real concern (`helpers`)
- **WARN** `A8/AP-9` — file is 703 lines (cap 500) — split into smaller single-reason files (`workflow/workflow-executor.ts`)
- **WARN** `A8/AP-9` — file is 363 lines (cap 300) — split into smaller single-reason files (`workflow/types.ts`)
- **WARN** `A8/AP-9` — file is 612 lines (cap 500) — split into smaller single-reason files (`builders/task-builder.ts`)
- **WARN** `A8/AP-9` — file is 518 lines (cap 500) — split into smaller single-reason files (`builders/job-builder.ts`)
- **WARN** `A8/AP-9` — file is 1288 lines (cap 500) — split into smaller single-reason files (`executor/task-executor.ts`)
- **WARN** `A8/AP-9` — file is 668 lines (cap 500) — split into smaller single-reason files (`core/execution-state.ts`)
- **WARN** `A8/AP-9` — file is 767 lines (cap 500) — split into smaller single-reason files (`types/job.ts`)
- **WARN** `A8/AP-9` — file is 543 lines (cap 500) — split into smaller single-reason files (`presets/start-workers.ts`)
- **WARN** `F-DOCT-5` — directory has 16 immediate children; doctrine cap is 12
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **INFO** `A12` — package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`workflow/run-workflow.ts`)
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`shutdown/shutdown-manager.ts`)
- **FAIL** `A14` — Jest/Vitest globals (describe/it/expect) — only Deno.test allowed (`core/execution-state_test.ts`)

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 296 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 194 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetTaskRegistry' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`registry/task-registry.ts:309`)
- **WARN** `NS-S-4.types` — type 'RegistryConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`registry/base-registry.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetJobRegistry' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`registry/job-registry.ts:282`)
- **WARN** `NS-S-4.types` — type 'JobContextConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`runtime/job-context.ts`)
- **WARN** `NS-S-4.types` — type 'JobHandlerConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`runtime/job-handler.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'jobSuccess' uses non-standard prefix 'job' — consult STANDARDS § 4.1 (`runtime/job-result.ts:34`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'jobFailure' uses non-standard prefix 'job' — consult STANDARDS § 4.1 (`runtime/job-result.ts:41`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'publishJobToStream' uses non-standard prefix 'publish' — consult STANDARDS § 4.1 (`streams/producer.ts:80`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetWorkflowExecutor' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`workflow/workflow-executor.ts:700`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'cancelWorkflow' uses non-standard prefix 'cancel' — consult STANDARDS § 4.1 (`workflow/run-workflow.ts:278`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetTaskExecutor' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`executor/task-executor.ts:1285`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetExecutionState' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`core/execution-state.ts:665`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mergePermissions' uses non-standard prefix 'merge' — consult STANDARDS § 4.1 (`helpers/permissions.ts:345`)

## 8. Code-quality verdict

**Heavy restructure (50 slow-type problems).** Indicates the public DSL leaks generic accumulators across chained methods. Move to the abstract-base / DSL-with-explicit-Definition-type pattern (PUBLIC-SURFACE-PATTERNS § 3, § 4). README missing — blocks DX bar. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.size`.

## 9. Test coverage assessment

1 test file(s) today — likely insufficient. Doctrine § 8 requires layered coverage (domain → ports → adapters → application). Audit results show the existing tests should be re-evaluated for meaningfulness (no `should work` style names; no internal imports).

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
