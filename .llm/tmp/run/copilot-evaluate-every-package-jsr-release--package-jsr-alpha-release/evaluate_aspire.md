# Evaluate — `@netscript/aspire`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Builder**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__aspire.json` · `audit/dry-run/aspire.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 1 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 0 | 12 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **20**

## 2. Package facts

- **Name:** `@netscript/aspire` @ `0.1.0`
- **Description:** "Config parsing, type exports, and SDK-agnostic helpers for Aspire TypeScript AppHost"
- **Files / LOC:** 15 `.ts` files, 1909 lines
- **Exports:** `.`, `./config`, `./schema`, `./types`, `./constants`, `./helpers`
- **README:** 312 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./config: ✓, ./schema: ✓, ./types: ✓, ./constants: ✓, ./helpers: ✓
- **Test files:** 4
- **Public surface size:** .=33, ./config=19, ./schema=1, ./types=28, ./constants=7, ./helpers=10

## 3. Current folder tree (`packages/aspire/`, depth 4, capped at 80 entries)

```
README.md
tests/
  types_test.ts
  helpers_test.ts
  config_test.ts
  schema_test.ts
constants.ts
types.ts
mod.ts
schema.ts
deno.json
helpers/
  permissions.ts
  paths.ts
  mod.ts
  vite.ts
  telemetry.ts
  references.ts
config.ts
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

error[missing-explicit-type]: missing explicit type in the public API
   --> /home/runner/work/netscript-start/netscript-start/packages/aspire/config.ts:220:14
    | 
220 | export const AppSettingsSchema = z.object({
    |              ^^^^^^^^^^^^^^^^^ this symbol is missing an explicit type
    | 
    = hint: add an explicit type annotation to the symbol

  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 20 problems

```

## 5. Top JSR audit findings

- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`helpers`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'helpers' — split into domain/, application/, or adapters/ aligned to a real concern (`helpers`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.description` — description should end with a period
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 64 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.types` — type 'AppSettings' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'NetScriptConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.types` — type 'OtelConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateAppSettingsJsonSchema' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`schema.ts:34`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractServiceReferences' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`helpers/references.ts:28`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractPluginReferences' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`helpers/references.ts:63`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractDependencies' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`helpers/references.ts:87`)
- **WARN** `NS-S-6.sections` — README missing 9/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Medium refactor (20 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. Top STANDARDS warnings: `NS-S-1.description`, `NS-S-1.version`, `NS-S-1.task`.

## 9. Test coverage assessment

4 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
