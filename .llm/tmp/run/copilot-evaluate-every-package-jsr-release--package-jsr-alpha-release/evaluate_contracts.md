# Evaluate — `@netscript/contracts`

> Wave: **1** · Archetype: **A1 — Small Contract** · Pattern: **Function family + DSL**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__contracts.json` · `audit/dry-run/contracts.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 1 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 6 | 15 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **30**

## 2. Package facts

- **Name:** `@netscript/contracts` @ `1.0.0`
- **Description:** *(missing)*
- **Files / LOC:** 7 `.ts` files, 1491 lines
- **Exports:** `.`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 0
- **Public surface size:** .=45

## 3. Current folder tree (`packages/contracts/`, depth 4, capped at 80 entries)

```
crud/
  create-crud-contract.ts
mod.ts
deno.json
helpers/
  paginated-query.ts
  transform.ts
base-contract.ts
schemas/
  filters.ts
  pagination.ts
```

## 4. `deno publish --dry-run` output (tail)

```
91 | export const CursorPaginationOutputSchema = z.object({
   |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ this symbol is missing an explicit type
   | 
   = hint: add an explicit type annotation to the symbol

  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/contracts/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 30 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`helpers`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'helpers' — split into domain/, application/, or adapters/ aligned to a real concern (`helpers`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '1.0.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 204 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 74 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'safeValidateSchema' uses non-standard prefix 'safe' — consult STANDARDS § 4.1 (`mod.ts:166`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'paginatedQuery' uses non-standard prefix 'paginated' — consult STANDARDS § 4.1 (`helpers/paginated-query.ts:68`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'offsetPaginatedQuery' uses non-standard prefix 'offset' — consult STANDARDS § 4.1 (`helpers/paginated-query.ts:148`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'cursorPaginatedQuery' uses non-standard prefix 'cursor' — consult STANDARDS § 4.1 (`helpers/paginated-query.ts:216`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'notFound' uses non-standard prefix 'not' — consult STANDARDS § 4.1 (`base-contract.ts:140`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'validationError' uses non-standard prefix 'validation' — consult STANDARDS § 4.1 (`base-contract.ts:159`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'conflict' uses non-standard prefix 'conflict' — consult STANDARDS § 4.1 (`base-contract.ts:175`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'unauthorized' uses non-standard prefix 'unauthorized' — consult STANDARDS § 4.1 (`base-contract.ts:190`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'forbidden' uses non-standard prefix 'forbidden' — consult STANDARDS § 4.1 (`base-contract.ts:205`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'combineConditions' uses non-standard prefix 'combine' — consult STANDARDS § 4.1 (`schemas/filters.ts:183`)

## 8. Code-quality verdict

**Medium refactor (30 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. README missing — blocks DX bar. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
