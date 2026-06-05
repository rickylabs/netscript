# Evaluate — `@netscript/plugin-triggers`

> Wave: **4** · Archetype: **A5 — Plugin** · Pattern: **DSL via @netscript/plugin**
> Source data: `audit/readiness/{jsr,doctrine,standards}/plugins__triggers.json` · `audit/dry-run/plugin-triggers.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 1 | — |
| Doctrine | 0 | 7 | 2 |
| Standards | 0 | 7 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **16**

## 2. Package facts

- **Name:** `@netscript/plugin-triggers` @ `0.1.0`
- **Description:** "NetScript plugin for file, webhook, and event trigger orchestration."
- **Files / LOC:** 19 `.ts` files, 3189 lines
- **Exports:** `.`, `./contracts`, `./services`, `./streams`, `./streams/server`
- **README:** 23 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./contracts: ✓, ./services: ✗, ./streams: ✓, ./streams/server: ✓
- **Test files:** 1
- **Public surface size:** .=1, ./contracts=2, ./services=0, ./streams=3, ./streams/server=5

## 3. Current folder tree (`plugins/triggers/`, depth 4, capped at 80 entries)

```
contracts.ts
README.md
database/
  triggers.prisma
streams/
  mod.ts
  schema.ts
  server.ts
  factory.ts
  producer.ts
test-webhooks-e2e.ts
contracts/
  v1/
    triggers.contract.ts
    mod.ts
mod.ts
deno.json
jobs/
  staged-cleanup.ts
  file-relay.ts
  file-import.ts
services/
  src/
    router.ts
    main.ts
    routers/
      webhooks.ts
      webhooks_test.ts
      health.ts
      v1.ts
```

## 4. `deno publish --dry-run` output (tail)

```
    | 
240 |     },
    | ^^^^^^
    | 
241 |   },
    | ^^^^
    | 
242 | });
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

error: Found 16 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-2 module-tag` — export ./services (./services/src/main.ts) lacks @module JSDoc tag (`./services/src/main.ts`)
- **WARN** `F-JSR-3 readme` — README.md is only 23 lines; enterprise bar is ≥150 lines

## 6. Top doctrine findings

- **WARN** `A3` — README has only 0 TS code fences — needs ≥ 2 (basic + advanced) for the 80% path
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **INFO** `A12` — package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`test-webhooks-e2e.ts`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`mod.ts:87`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`jobs/staged-cleanup.ts:27`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`jobs/file-relay.ts:47`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`jobs/file-import.ts:65`)
- **WARN** `AP-19` — `export default` — JSR penalises (no auto-doc); use named exports (`services/src/main.ts:39`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 243 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 168 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-6.length` — README is 23 lines; minimum is 150
- **WARN** `NS-S-6.sections` — README missing 12/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **WARN** `NS-S-8.location` — 1 inline *_test.ts files outside tests/ — consolidate under tests/<layer>/
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Medium refactor (16 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. Some entrypoints lack `@module` JSDoc — required for JSR scoring. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.size`.

## 9. Test coverage assessment

1 test file(s) today — likely insufficient. Doctrine § 8 requires layered coverage (domain → ports → adapters → application). Audit results show the existing tests should be re-evaluated for meaningfulness (no `should work` style names; no internal imports).

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
