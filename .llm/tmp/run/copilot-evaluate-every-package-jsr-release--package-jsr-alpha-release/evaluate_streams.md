# Evaluate — `@netscript/streams`

> Wave: **1** · Archetype: **A1 — Small Contract** · Pattern: **Function family + DSL**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__streams.json` · `audit/dry-run/streams.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 1 | 0 | — |
| Doctrine | 0 | 0 | 1 |
| Standards | 2 | 3 | 2 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/streams` @ `0.1.0`
- **Description:** "Durable stream primitives for NetScript — schema definitions, producers, and offset tracking."
- **Files / LOC:** 5 `.ts` files, 398 lines
- **Exports:** `.`, `./schema`, `./producer`, `./config`, `./types`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./schema: ✓, ./producer: ✓, ./config: ✓, ./types: ✓
- **Test files:** 0
- **Public surface size:** .=7, ./schema=2, ./producer=3, ./config=3, ./types=0

## 3. Current folder tree (`packages/streams/`, depth 4, capped at 80 entries)

```
types.ts
mod.ts
schema.ts
deno.json
producer.ts
config.ts
```

## 4. `deno publish --dry-run` output (tail)

```
Checking for slow types in the public API...
Simulating publish of @netscript/streams@0.1.0 with files:
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/config.ts (2.22KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/deno.json (869B)
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/mod.ts (1.18KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/producer.ts (7.04KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/schema.ts (1.58KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/streams/types.ts (391B)
Success Dry run complete

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing

## 6. Top doctrine findings

- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 12 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **FAIL** `NS-S-6` — README.md missing
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

README missing — blocks DX bar. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
