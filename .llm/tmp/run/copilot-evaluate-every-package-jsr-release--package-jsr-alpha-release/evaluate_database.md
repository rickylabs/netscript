# Evaluate — `@netscript/database`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__database.json` · `audit/dry-run/database.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 3 | 1 | — |
| Doctrine | 0 | 5 | 1 |
| Standards | 6 | 21 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **3**

## 2. Package facts

- **Name:** `@netscript/database` @ `1.0.0`
- **Description:** *(missing)*
- **Files / LOC:** 15 `.ts` files, 3351 lines
- **Exports:** `.`, `./interfaces`, `./adapters`, `./adapters/postgres`, `./adapters/mssql`, `./adapters/mysql`, `./extensions`, `./scripts`, `./tracing`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./interfaces: ✓, ./adapters: ✓, ./adapters/postgres: ✓, ./adapters/mssql: ✓, ./adapters/mysql: ✓, ./extensions: ✗, ./scripts: ✓, ./tracing: ✓
- **Test files:** 0
- **Public surface size:** .=12, ./interfaces=0, ./adapters=2, ./adapters/postgres=3, ./adapters/mssql=8, ./adapters/mysql=8, ./extensions=3, ./scripts=8, ./tracing=4

## 3. Current folder tree (`packages/database/`, depth 4, capped at 80 entries)

```
scripts/
  migrate.ts
  mod.ts
  generate-zod.ts
  patch-prisma-client.ts
  fix-zod-imports.ts
mod.ts
deno.json
adapters/
  mssql.adapter.ts
  mysql.adapter.ts
  mod.ts
  postgres.adapter.ts
.env.example
interfaces/
  mod.ts
  database-client.ts
prisma-tracing.ts
extensions/
  sql-json.extension.ts
  mod.ts
```

## 4. `deno publish --dry-run` output (tail)

```
286 | function createExtensionConfig(options: SqlJsonExtensionOptions) {
    |          ^^^^^^^^^^^^^^^^^^^^^ this function is missing an explicit return type
    | 
    = hint: add an explicit return type to the function

  info: all functions in the public API must have an explicit return type
  docs: https://jsr.io/go/slow-type-missing-explicit-return-type

error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/database/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 3 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export ./extensions (./extensions/mod.ts) lacks @module JSDoc tag (`./extensions/mod.ts`)
- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'interfaces' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`interfaces`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'interfaces' — split into domain/, application/, or adapters/ aligned to a real concern (`interfaces`)
- **WARN** `A8/AP-9` — file is 599 lines (cap 500) — split into smaller single-reason files (`extensions/sql-json.extension.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`scripts/migrate.ts`)
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`scripts/generate-zod.ts`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`extensions/sql-json.extension.ts:598`)

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 265 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 108 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateZodSchemas' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`scripts/generate-zod.ts:33`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateZodSchemasCli' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`scripts/generate-zod.ts:79`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'patchPrismaClient' uses non-standard prefix 'patch' — consult STANDARDS § 4.1 (`scripts/patch-prisma-client.ts:58`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'fixZodImports' uses non-standard prefix 'fix' — consult STANDARDS § 4.1 (`scripts/fix-zod-imports.ts:61`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'enableInstrumentation' uses non-standard prefix 'enable' — consult STANDARDS § 4.1 (`mod.ts:53`)
- **WARN** `NS-S-4.types` — type 'MssqlAdapterConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`adapters/mssql.adapter.ts`)
- **WARN** `NS-S-4.types` — type 'MysqlAdapterConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`adapters/mysql.adapter.ts`)
- **WARN** `NS-S-4.types` — type 'SharedDatabaseConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`interfaces/database-client.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'enablePrismaTracing' uses non-standard prefix 'enable' — consult STANDARDS § 4.1 (`prisma-tracing.ts:229`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'disablePrismaTracing' uses non-standard prefix 'disable' — consult STANDARDS § 4.1 (`prisma-tracing.ts:241`)
- **WARN** `NS-S-4.types` — type 'PrismaTracingConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`prisma-tracing.ts`)

## 8. Code-quality verdict

**Small slow-type refactor (3 problems).** Add explicit return types on the published functions. README missing — blocks DX bar. Some entrypoints lack `@module` JSDoc — required for JSR scoring. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
