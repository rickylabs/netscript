# Evaluate — `@netscript/plugin-streams`

> Wave: **4** · Archetype: **A5 — Plugin** · Pattern: **DSL via @netscript/plugin**
> Source data: `audit/readiness/{jsr,doctrine,standards}/plugins__streams.json` · `audit/dry-run/plugin-streams.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 1 | — |
| Doctrine | 0 | 3 | 1 |
| Standards | 1 | 5 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **3**

## 2. Package facts

- **Name:** `@netscript/plugin-streams` @ `0.1.0`
- **Description:** "NetScript plugin that runs a Durable Streams development server."
- **Files / LOC:** 2 `.ts` files, 257 lines
- **Exports:** `.`, `./services`
- **README:** 19 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./services: ✓
- **Test files:** 0
- **Public surface size:** .=0, ./services=0

## 3. Current folder tree (`plugins/streams/`, depth 4, capped at 80 entries)

```
README.md
mod.ts
deno.json
services/
  src/
    main.ts
```

## 4. `deno publish --dry-run` output (tail)

```
   = hint: for the time being, embed the data directly into a JavaScript file (ex. as encoded base64 text)

  docs: https://github.com/denoland/deno/issues/29904

error[unsupported-default-export-expr]: default export expression was too complex
  --> /home/runner/work/netscript-start/netscript-start/plugins/streams/mod.ts:96:1
   | 
96 | export default definePlugin(streamsPlugin);
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   = hint: add an 'as' clause with an explicit type after the expression, or extract to a variable

  info: fast check was unable to infer the type of the default export expression
  docs: https://jsr.io/go/slow-type-unsupported-default-export-expr

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 3 problems

```

## 5. Top JSR audit findings

- **WARN** `F-JSR-3 readme` — README.md is only 19 lines; enterprise bar is ≥150 lines

## 6. Top doctrine findings

- **WARN** `A3` — README has only 0 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`services/src/main.ts`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`mod.ts:96`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 75 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-6.length` — README is 19 lines; minimum is 150
- **WARN** `NS-S-6.sections` — README missing 12/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (3 problems).** Add explicit return types on the published functions. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
