# Evaluate — `@netscript/triggers`

> Wave: **4** · Archetype: **A3 — Runtime/Behavior** · Pattern: **Abstract base + Default + DSL + Registry**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__triggers.json` · `audit/dry-run/triggers.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 1 | — |
| Doctrine | 0 | 3 | 2 |
| Standards | 3 | 9 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **29**

## 2. Package facts

- **Name:** `@netscript/triggers` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 16 `.ts` files, 3653 lines
- **Exports:** `.`, `./schemas`, `./streams/server`, `./streams/schema`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./schemas: ✓, ./streams/server: ✓, ./streams/schema: ✓
- **Test files:** 3
- **Public surface size:** .=29, ./schemas=42, ./streams/server=5, ./streams/schema=3

## 3. Current folder tree (`packages/triggers/`, depth 4, capped at 80 entries)

```
registry_test.ts
streams/
  schema.ts
  server.ts
  producer.ts
builder.ts
mod.ts
action-executor.ts
registry.ts
dispatch.ts
processor.ts
deno.json
builder_test.ts
event-store.ts
schemas.ts
presets/
  mod.ts
  start-combined.ts
processor_test.ts
```

## 4. `deno publish --dry-run` output (tail)

```
36 | export const triggersStreamSchema = defineStreamSchema({
   |              ^^^^^^^^^^^^^^^^^^^^ this symbol is missing an explicit type
   | 
   = hint: add an explicit type annotation to the symbol

  info: all symbols in the public API must have an explicit type
  docs: https://jsr.io/go/slow-type-missing-explicit-type

error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/triggers/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

This package contains errors for slow types. Fixing these errors will:

  1. Significantly improve your package users' type checking performance.
  2. Improve the automatic documentation generation.
  3. Enable automatic .d.ts generation for Node.js.

Don't want to bother? You can choose to skip this step by
providing the --allow-slow-types flag.

error: Found 29 problems

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)
- **WARN** `F-DOCT-5 cardinality` — directory has 14 immediate children; doctrine cap is 12

## 6. Top doctrine findings

- **WARN** `A8/AP-9` — file is 596 lines (cap 500) — split into smaller single-reason files (`action-executor.ts`)
- **WARN** `A8/AP-9` — file is 475 lines (cap 300) — split into smaller single-reason files (`schemas.ts`)
- **WARN** `F-DOCT-5` — directory has 14 immediate children; doctrine cap is 12
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **INFO** `A12` — package implements durable workflow concepts — verify state machine model is documented in docs/architecture.md

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 62 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetTriggerRegistry' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`registry.ts:309`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'dispatchTriggerEvent' uses non-standard prefix 'dispatch' — consult STANDARDS § 4.1 (`dispatch.ts:63`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetTriggerEventStore' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`event-store.ts:388`)
- **WARN** `NS-S-4.types` — type 'FileLifecycleConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`schemas.ts`)
- **WARN** `NS-S-4.types` — type 'ActionChainConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`schemas.ts`)
- **FAIL** `NS-S-6` — README.md missing
- **WARN** `NS-S-8.location` — 3 inline *_test.ts files outside tests/ — consolidate under tests/<layer>/
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Medium refactor (29 slow-type problems).** Public surface needs explicit types; some types should move from inferred (`z.infer`) to declared interfaces with slot generics. README missing — blocks DX bar. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

3 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
