# Evaluate — `@netscript/prisma-adapter-mysql`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Adapter implementation**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__prisma-adapter-mysql.json` · `audit/dry-run/prisma-adapter-mysql.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 0 | — |
| Doctrine | 1 | 1 | 1 |
| Standards | 5 | 14 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **2**

## 2. Package facts

- **Name:** `@netscript/prisma-adapter-mysql` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 6 `.ts` files, 1346 lines
- **Exports:** `.`
- **README:** 124 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 0
- **Public surface size:** .=9

## 3. Current folder tree (`packages/prisma-adapter-mysql/`, depth 4, capped at 80 entries)

```
README.md
src/
  types.ts
  mod.ts
  adapter.ts
  errors.ts
  conversion.ts
examples/
  basic-usage.ts
deno.json
```

## 4. `deno publish --dry-run` output (tail)

```
Checking for slow types in the public API...
error[invalid-external-import]: invalid import to a non-JSR 'https' specifier
   --> /home/runner/work/netscript-start/netscript-start/packages/prisma-adapter-mysql/src/adapter.ts:442:37
    | 
442 |     const { Client } = await import("mysql");
    |                                     ^^^^^^^ the specifier
    | 
    = hint: replace this import with one from jsr or npm, or vendor the dependency into your package

  info: the import was resolved to 'https://deno.land/x/mysql@v2.12.1/mod.ts'
  info: this specifier is not allowed to be imported on jsr
  info: jsr only supports importing `jsr:`, `npm:`, `data:`, `bun:`, and `node:` specifiers
  docs: https://jsr.io/go/invalid-external-import

error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/prisma-adapter-mysql/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

error: Found 2 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **FAIL** `F-JSR-5 mod.ts` — mod.ts missing at package root (canonical doctrine entrypoint)

## 6. Top doctrine findings

- **FAIL** `A1` — mod.ts missing — required canonical entrypoint
- **WARN** `A8/AP-9` — file is 517 lines (cap 500) — split into smaller single-reason files (`src/adapter.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-2` — exports["."] is './src/mod.ts' — convention is './mod.ts'
- **WARN** `NS-S-4.types` — type 'MySqlConnectionConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`src/types.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'inferCapabilities' uses non-standard prefix 'infer' — consult STANDARDS § 4.1 (`src/adapter.ts:499`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'convertDriverError' uses non-standard prefix 'convert' — consult STANDARDS § 4.1 (`src/errors.ts:27`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mapDriverError' uses non-standard prefix 'map' — consult STANDARDS § 4.1 (`src/errors.ts:43`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mapColumnType' uses non-standard prefix 'map' — consult STANDARDS § 4.1 (`src/conversion.ts:79`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mapArg' uses non-standard prefix 'map' — consult STANDARDS § 4.1 (`src/conversion.ts:167`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'mapRow' uses non-standard prefix 'map' — consult STANDARDS § 4.1 (`src/conversion.ts:218`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'rowToArray' uses non-standard prefix 'row' — consult STANDARDS § 4.1 (`src/conversion.ts:278`)
- **WARN** `NS-S-6.length` — README is 124 lines; minimum is 150
- **WARN** `NS-S-6.sections` — README missing 9/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (2 problems).** Add explicit return types on the published functions. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
