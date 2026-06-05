# Evaluate — `@netscript/service`

> Wave: **5** · Archetype: **A4 — DSL/Builder** · Pattern: **Builder + Registry**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__service.json` · `audit/dry-run/service.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 0 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 6 | 7 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **26**

## 2. Package facts

- **Name:** `@netscript/service` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 6 `.ts` files, 1639 lines
- **Exports:** `.`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 0
- **Public surface size:** .=15

## 3. Current folder tree (`packages/service/`, depth 4, capped at 80 entries)

```
assets/
  scalar.min.js
builders/
  service-builder.ts
mod.ts
deno.json
primitives/
  health.ts
  handlers.ts
  openapi.ts
presets/
  define-service.ts
```

## 4. `deno publish --dry-run` output (tail)

```
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

error[unstable-raw-import]: raw imports have not been stabilized
  --> /home/runner/work/netscript-start/netscript-start/packages/service/primitives/openapi.ts:26:22
   | 
26 | import scalarJs from '../assets/scalar.min.js' with { type: 'text' };
   |                      ^^^^^^^^^^^^^^^^^^^^^^^^^ the specifier
   | 
   = hint: for the time being, embed the data directly into a JavaScript file (ex. as encoded base64 text)

  docs: https://github.com/denoland/deno/issues/29904

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 26 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)

## 6. Top doctrine findings

- **WARN** `A8/AP-9` — file is 503 lines (cap 500) — split into smaller single-reason files (`builders/service-builder.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 21 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.types` — type 'ServiceConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`builders/service-builder.ts`)
- **WARN** `NS-S-4.types` — type 'RPCHandlerConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`primitives/handlers.ts`)
- **WARN** `NS-S-4.types` — type 'OpenAPIConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`primitives/openapi.ts`)
- **FAIL** `NS-S-6` — README.md missing
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Medium refactor (26 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. README missing — blocks DX bar. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
