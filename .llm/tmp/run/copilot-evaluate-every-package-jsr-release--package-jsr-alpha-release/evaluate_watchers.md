# Evaluate — `@netscript/watchers`

> Wave: **4** · Archetype: **A3 — Runtime/Behavior** · Pattern: **Abstract base + Default + Registry**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__watchers.json` · `audit/dry-run/watchers.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 2 | 0 | — |
| Doctrine | 0 | 0 | 1 |
| Standards | 3 | 7 | 2 |

`deno publish --dry-run`: **❌ FAIL** · slow-type problems: **1**

## 2. Package facts

- **Name:** `@netscript/watchers` @ `0.1.0`
- **Description:** *(missing)*
- **Files / LOC:** 13 `.ts` files, 1621 lines
- **Exports:** `.`
- **README:** *(missing)*
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓
- **Test files:** 3
- **Public surface size:** .=12

## 3. Current folder tree (`packages/watchers/`, depth 4, capped at 80 entries)

```
filters/
  glob.ts
  dedup.ts
  stability.ts
  dedup_test.ts
  glob_test.ts
  stability_test.ts
types.ts
mod.ts
file-watcher.ts
strategies/
  hybrid.ts
  polling.ts
  native.ts
deno.json
fs.ts
```

## 4. `deno publish --dry-run` output (tail)

```
Checking for slow types in the public API...
error[missing-license]: missing license field or file
 --> /home/runner/work/netscript-start/netscript-start/packages/watchers/deno.json
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
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 9 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'computeContentHash' uses non-standard prefix 'compute' — consult STANDARDS § 4.1 (`filters/dedup.ts:24`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'safeStat' uses non-standard prefix 'safe' — consult STANDARDS § 4.1 (`fs.ts:21`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'safeReadFile' uses non-standard prefix 'safe' — consult STANDARDS § 4.1 (`fs.ts:48`)
- **FAIL** `NS-S-6` — README.md missing
- **WARN** `NS-S-8.location` — 3 inline *_test.ts files outside tests/ — consolidate under tests/<layer>/
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Small slow-type refactor (1 problems).** Add explicit return types on the published functions. README missing — blocks DX bar. Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

3 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
