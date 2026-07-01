# Evaluate — `@netscript/cron`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__cron.json` · `audit/dry-run/cron.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 1 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 1 | 6 | 2 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/cron` @ `0.1.0`
- **Description:** "Runtime-agnostic cron scheduling abstraction for Deno applications."
- **Files / LOC:** 11 `.ts` files, 1743 lines
- **Exports:** `.`, `./adapters`, `./types`
- **README:** 176 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./adapters: ✓, ./types: ✓
- **Test files:** 3
- **Public surface size:** .=9, ./adapters=5, ./types=14

## 3. Current folder tree (`packages/cron/`, depth 4, capped at 80 entries)

```
README.md
tests/
  scheduler_test.ts
  types_test.ts
  memory-adapter_test.ts
mod.ts
deno.json
adapters/
  memory.adapter.ts
  mod.ts
  _shared.ts
  deno.adapter.ts
interfaces/
  types.ts
  mod.ts
  scheduler.ts
```

## 4. `deno publish --dry-run` output (tail)

```
Download https://jsr.io/@std/async/1.2.0_meta.json
Download https://jsr.io/@std/async/1.2.0/mod.ts
Download https://jsr.io/@std/async/1.2.0/abortable.ts
Download https://jsr.io/@std/async/1.2.0/deadline.ts
Download https://jsr.io/@std/async/1.2.0/debounce.ts
Download https://jsr.io/@std/async/1.2.0/delay.ts
Download https://jsr.io/@std/async/1.2.0/mux_async_iterator.ts
Download https://jsr.io/@std/async/1.2.0/pool.ts
Download https://jsr.io/@std/async/1.2.0/tee.ts
Download https://jsr.io/@std/async/1.2.0/retry.ts
Download https://jsr.io/@std/async/1.2.0/_util.ts
Checking for slow types in the public API...
Simulating publish of @netscript/cron@0.1.0 with files:
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/README.md (5.24KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/adapters/_shared.ts (4.32KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/adapters/deno.adapter.ts (7.99KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/adapters/memory.adapter.ts (10.71KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/adapters/mod.ts (769B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/deno.json (712B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/interfaces/mod.ts (889B)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/interfaces/scheduler.ts (4.08KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/interfaces/types.ts (6.07KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/cron/mod.ts (5.84KB)
Success Dry run complete

```

## 5. Top JSR audit findings

- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'interfaces' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`interfaces`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'interfaces' — split into domain/, application/, or adapters/ aligned to a real concern (`interfaces`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.size` — mod.ts is 222 lines; convention cap is 200 — split into sub-entrypoints
- **WARN** `NS-S-3.barrel-only` — mod.ts has 61 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-6.sections` — README missing 9/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **WARN** `NS-S-9.logger` — package owns runtime/adapters but does not import @netscript/logger
- **INFO** `NS-S-9.telemetry` — package owns runtime/adapters but does not import @netscript/telemetry — verify spans/metrics emitted
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Publish-clean today.** Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.size`.

## 9. Test coverage assessment

3 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
