# Evaluate — `@netscript/sagas`

> Wave: **4** · Archetype: **A3 — Runtime/Behavior** · Pattern: **Abstract base + Default + DSL + Registry**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__sagas.json` · `audit/dry-run/sagas.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 2 | — |
| Doctrine | 0 | 8 | 2 |
| Standards | 5 | 21 | 3 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **13**

## 2. Package facts

- **Name:** `@netscript/sagas` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 31 `.ts` files, 6495 lines
- **Exports:** `.`, `./config`, `./publisher`, `./integration/workers`, `./streams/server`, `./streams/schema`
- **README:** 627 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./config: ✓, ./publisher: ✓, ./integration/workers: ✓, ./streams/server: ✓, ./streams/schema: ✓
- **Test files:** 0
- **Public surface size:** .=36, ./config=2, ./publisher=7, ./integration/workers=8, ./streams/server=4, ./streams/schema=3

## 3. Current folder tree (`packages/sagas/`, depth 4, capped at 80 entries)

```
README.md
registry/
  saga-registry.ts
  mod.ts
streams/
  schema.ts
  server.ts
  producer.ts
builders/
  mod.ts
  saga-config-builder.ts
stores/
  mod.ts
  inmemory.store.ts
middleware/
  saga.middleware.ts
  sse-events.middleware.ts
  mod.ts
scripts/
  setup.ts
mod.ts
integration/
  mod.ts
  workers-client.ts
define.ts
factory/
  mod.ts
  create-saga-bus.ts
deno.json
helpers/
  mod.ts
types/
  saga.ts
  mod.ts
  config.ts
adapters/
  mod.ts
  saga-bus.adapter.ts
transports/
  redis-transport.ts
  mod.ts
  list-transport.ts
presets/
  mod.ts
  start-combined.ts
  start-sagas.ts
```

## 4. `deno publish --dry-run` output (tail)

```
142 | export const SagasConfigSchema = z.object({
    |              ^^^^^^^^^^^^^^^^^ this symbol is missing an explicit type
    | 
    = hint: add an explicit type annotation to the symbol

  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/sagas/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 13 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'helpers' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`helpers`)
- **WARN** `F-DOCT-5 cardinality` — directory has 17 immediate children; doctrine cap is 12

## 6. Top doctrine findings

- **WARN** `A1` — mod.ts wildcard re-exports internal layer ./adapters/mod.ts — curate via src/public/mod.ts instead (`mod.ts`)
- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'helpers' — split into domain/, application/, or adapters/ aligned to a real concern (`helpers`)
- **WARN** `A8/AP-9` — file is 601 lines (cap 500) — split into smaller single-reason files (`factory/create-saga-bus.ts`)
- **WARN** `A8/AP-9` — file is 716 lines (cap 500) — split into smaller single-reason files (`transports/redis-transport.ts`)
- **WARN** `A8/AP-9` — file is 848 lines (cap 500) — split into smaller single-reason files (`transports/list-transport.ts`)
- **WARN** `F-DOCT-5` — directory has 17 immediate children; doctrine cap is 12
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **INFO** `A12` — package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md
- **WARN** `A13` — Deno.exit/process.exit outside bin/ — crash boundaries must be explicit, throw a typed error instead (`presets/start-sagas.ts`)
- **WARN** `AP-23` — `any` in exported declaration — use `unknown` or a specific type (`registry/saga-registry.ts:24`)

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 49 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetSagaRegistry' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`registry/saga-registry.ts:420`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'triggerJob' uses non-standard prefix 'trigger' — consult STANDARDS § 4.1 (`integration/workers-client.ts:115`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'triggerJobSafe' uses non-standard prefix 'trigger' — consult STANDARDS § 4.1 (`integration/workers-client.ts:180`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'triggerTask' uses non-standard prefix 'trigger' — consult STANDARDS § 4.1 (`integration/workers-client.ts:235`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'triggerTaskSafe' uses non-standard prefix 'trigger' — consult STANDARDS § 4.1 (`integration/workers-client.ts:289`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetSagaBus' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`factory/create-saga-bus.ts:582`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'continueWith' uses non-standard prefix 'continue' — consult STANDARDS § 4.1 (`helpers/mod.ts:221`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'completeWith' uses non-standard prefix 'complete' — consult STANDARDS § 4.1 (`helpers/mod.ts:228`)
- **WARN** `NS-S-4.types` — type 'SagaTimeoutConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types/saga.ts`)
- **WARN** `NS-S-4.types` — type 'SagaRetryConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types/saga.ts`)
- **WARN** `NS-S-4.types` — type 'SagaConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types/config.ts`)

## 8. Code-quality verdict

**Medium refactor (13 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
