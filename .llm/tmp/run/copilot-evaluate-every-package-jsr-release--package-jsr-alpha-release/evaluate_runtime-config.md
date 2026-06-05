# Evaluate — `@netscript/runtime-config`

> Wave: **1** · Archetype: **A1 — Small Contract** · Pattern: **Function family**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__runtime-config.json` · `audit/dry-run/runtime-config.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 0 | — |
| Doctrine | 0 | 0 | 1 |
| Standards | 5 | 7 | 1 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **1**

## 2. Package facts

- **Name:** `@netscript/runtime-config` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 1 `.ts` files, 416 lines
- **Exports:** `.`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 0
- **Public surface size:** .=14

## 3. Current folder tree (`packages/runtime-config/`, depth 4, capped at 80 entries)

```
mod.ts
deno.json
```

## 4. `deno publish --dry-run` output (tail)

```
Checking for slow types in the public API...
error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/runtime-config/deno.json
  = hint: add a "license" field. Alternatively, add a LICENSE file to the package and ensure it is not ignored from being published

  docs: https://jsr.io/go/missing-license

error: Found 1 problem

```

## 5. Top JSR audit findings

- **FAIL** `F-JSR-3 readme` — README.md missing
- **FAIL** `F-JSR-4 description` — deno.json lacks `description` (used by JSR discoverability)

## 6. Top doctrine findings

- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **FAIL** `NS-S-1.license` — deno.json `license` field missing (must be `MIT` for alpha)
- **FAIL** `NS-S-1.description` — deno.json `description` missing
- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.publish-include` — deno.json `publish.include` missing — `deno publish` ships everything by default and that leaks tests/scratch
- **WARN** `NS-S-1.publish-exclude` — deno.json `publish.exclude` should explicitly drop `**/*_test.ts`, `tests/`, `examples/`
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 416 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 216 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'watchRuntimeConfig' uses non-standard prefix 'watch' — consult STANDARDS § 4.1 (`mod.ts:322`)
- **WARN** `NS-S-4.types` — type 'RuntimeConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`mod.ts`)
- **FAIL** `NS-S-6` — README.md missing
- **FAIL** `NS-S-8.coverage` — no tests/ directory and no inline *_test.ts files — every package needs meaningful tests
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (1 problems).** Add explicit return types on the published functions. README missing — blocks DX bar. No tests today — meaningful test plan needed (see § 9). Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.publish-exclude`, `NS-S-1.task`.

## 9. Test coverage assessment

No tests today. **Required at alpha:** doctest of README examples, port contract suite (if package owns ports), one adapter conformance run per shipped adapter, and one application-layer scenario test. See § 4 of this evaluate doc's plan_ pair for the full test plan.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
