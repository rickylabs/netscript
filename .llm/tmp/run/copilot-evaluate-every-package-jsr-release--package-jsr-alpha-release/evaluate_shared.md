# Evaluate — `@netscript/shared`

> Wave: **0** · Archetype: **A1 — Small Contract** · Pattern: **Function family + DSL**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__shared.json` · `audit/dry-run/shared.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 2 | — |
| Doctrine | 1 | 4 | 1 |
| Standards | 1 | 31 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **35**

## 2. Package facts

- **Name:** `@netscript/shared` @ `1.0.0`
- **Description:** "Shared schemas, contract primitives, Zod helpers, and typed error utilities for NetScript packages."
- **Files / LOC:** 10 `.ts` files, 2357 lines
- **Exports:** `.`, `./utils`
- **README:** 38 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✗, ./utils: ✗
- **Test files:** 1
- **Public surface size:** .=14, ./utils=3

## 3. Current folder tree (`packages/shared/`, depth 4, capped at 80 entries)

```
contracts.ts
README.md
utils/
  zod/
    validation-helpers.ts
    mod.ts
    codecs.ts
    schemas.ts
  mod.ts
  datetime.test.ts
  error-helpers.ts
  datetime.ts
mod.ts
deno.json
```

## 4. `deno publish --dry-run` output (tail)

```
  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

error[missing-explicit-type]: missing explicit type in the public API
  --> /home/runner/work/netscript-start/netscript-start/packages/shared/utils/zod/schemas.ts:98:14
   | 
98 | export const IdQuerySchema = z.object({
   |              ^^^^^^^^^^^^^ this symbol is missing an explicit type
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

error: Found 35 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export . (./mod.ts) lacks @module JSDoc tag (`./mod.ts`)
- **FAIL** `F-JSR-2 module-tag` — export ./utils (./utils/mod.ts) lacks @module JSDoc tag (`./utils/mod.ts`)
- **WARN** `F-JSR-3 readme` — README.md is only 38 lines; enterprise bar is ≥150 lines
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'utils' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`utils`)

## 6. Top doctrine findings

- **FAIL** `A1` — mod.ts must lead with `@module` JSDoc block (Public Types First) (`mod.ts`)
- **WARN** `A3` — README has only 1 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'utils' — split into domain/, application/, or adapters/ aligned to a real concern (`utils`)
- **WARN** `A8/AP-9` — file is 1113 lines (cap 500) — split into smaller single-reason files (`utils/datetime.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`utils/datetime.ts:1061`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 26 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'positiveInt' uses non-standard prefix 'positive' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:22`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'nonNegativeInt' uses non-standard prefix 'non' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:47`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'paginationLimit' uses non-standard prefix 'pagination' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:72`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'paginationOffset' uses non-standard prefix 'pagination' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:99`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'email' uses non-standard prefix 'email' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:126`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'url' uses non-standard prefix 'url' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:139`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'boundedString' uses non-standard prefix 'bounded' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:152`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'positiveNumber' uses non-standard prefix 'positive' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:171`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'nonNegativeNumber' uses non-standard prefix 'non' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:184`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'isoDateTime' uses non-standard prefix 'iso' — consult STANDARDS § 4.1 (`utils/zod/validation-helpers.ts:208`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'stringToNumber' uses non-standard prefix 'string' — consult STANDARDS § 4.1 (`utils/zod/codecs.ts:32`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'stringToInt' uses non-standard prefix 'string' — consult STANDARDS § 4.1 (`utils/zod/codecs.ts:57`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'notFound' uses non-standard prefix 'not' — consult STANDARDS § 4.1 (`utils/error-helpers.ts:55`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'nowTemporal' uses non-standard prefix 'now' — consult STANDARDS § 4.1 (`utils/datetime.ts:203`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'now' uses non-standard prefix 'now' — consult STANDARDS § 4.1 (`utils/datetime.ts:233`)

## 8. Code-quality verdict

**Heavy restructure (35 slow-type problems).** Indicates the public DSL leaks generic accumulators across chained methods. Move to the abstract-base / DSL-with-explicit-Definition-type pattern (PUBLIC-SURFACE-PATTERNS § 3, § 4). Some entrypoints lack `@module` JSDoc — required for JSR scoring. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

1 test file(s) today — likely insufficient. Doctrine § 8 requires layered coverage (domain → ports → adapters → application). Audit results show the existing tests should be re-evaluated for meaningfulness (no `should work` style names; no internal imports).

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
