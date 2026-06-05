# Evaluate — `@netscript/plugin-sagas`

> Wave: **4** · Archetype: **A5 — Plugin** · Pattern: **DSL via @netscript/plugin**
> Source data: `audit/readiness/{jsr,doctrine,standards}/plugins__sagas.json` · `audit/dry-run/plugin-sagas.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 1 | — |
| Doctrine | 0 | 4 | 2 |
| Standards | 1 | 6 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **12**

## 2. Package facts

- **Name:** `@netscript/plugin-sagas` @ `0.1.0`
- **Description:** "NetScript plugin for durable saga orchestration, workflow APIs, and saga runtime metadata."
- **Files / LOC:** 15 `.ts` files, 1698 lines
- **Exports:** `.`, `./contracts`, `./services`, `./streams`, `./streams/server`
- **README:** 23 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./contracts: ✓, ./services: ✗, ./streams: ✓, ./streams/server: ✓
- **Test files:** 0
- **Public surface size:** .=1, ./contracts=2, ./services=0, ./streams=3, ./streams/server=4

## 3. Current folder tree (`plugins/sagas/`, depth 4, capped at 80 entries)

```
contracts.ts
README.md
database/
  sagas.prisma
streams/
  mod.ts
  schema.ts
  server.ts
  factory.ts
  producer.ts
contracts/
  v1/
    mod.ts
    sagas.contract.ts
mod.ts
deno.json
services/
  src/
    init.ts
    router.ts
    main.ts
    routers/
      health.ts
      v1.ts
  mod.ts
```

## 4. `deno publish --dry-run` output (tail)

```
    | 
244 |     },
    | ^^^^^^
    | 
245 |   },
    | ^^^^
    | 
246 | });
    | ^^^
    = hint: add an 'as' clause with an explicit type after the expression, or extract to a variable

  info: fast check was unable to infer the type of the default export expression
  docs: https://jsr.io/go/slow-type-unsupported-default-export-expr

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 12 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export ./services (./services/src/main.ts) lacks @module JSDoc tag (`./services/src/main.ts`)
- **WARN** `F-JSR-3 readme` — README.md is only 23 lines; enterprise bar is ≥150 lines

## 6. Top doctrine findings

- **WARN** `A3` — README has only 0 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
- **WARN** `A8/AP-9` — file is 742 lines (cap 500) — split into smaller single-reason files (`services/src/routers/v1.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **INFO** `A12` — package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`mod.ts:103`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`services/src/main.ts:35`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 247 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 171 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-6.length` — README is 23 lines; minimum is 150
- **WARN** `NS-S-6.sections` — README missing 12/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Medium refactor (12 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. Some entrypoints lack `@module` JSDoc — required for JSR scoring. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.size`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
