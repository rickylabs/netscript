# Evaluate — `@netscript/logger`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__logger.json` · `audit/dry-run/logger.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 0 | — |
| Doctrine | 0 | 1 | 1 |
| Standards | 1 | 11 | 2 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/logger` @ `0.1.0`
- **Description:** "Structured logging for NetScript services, packages, workers, and Hono/oRPC integrations."
- **Files / LOC:** 11 `.ts` files, 1214 lines
- **Exports:** `.`, `./middleware`, `./orpc`
- **README:** 203 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./middleware: ✓, ./orpc: ✓
- **Test files:** 3
- **Public surface size:** .=15, ./middleware=12, ./orpc=3

## 3. Current folder tree (`packages/logger/`, depth 4, capped at 80 entries)

```
creators.ts
README.md
orpc.ts
tests/
  creators_test.ts
  middleware_test.ts
  config_test.ts
orpc-plugin.ts
constants.ts
types.ts
mod.ts
deno.json
middleware.ts
config.ts
```

## 4. `deno publish --dry-run` output (tail)

```
Download https://jsr.io/@logtape/logtape/2.0.5_meta.json
Download https://jsr.io/@logtape/logtape/2.0.5/src/mod.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/config.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/context.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/filter.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/formatter.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/level.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/logger.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/record.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/sink.ts
Download https://jsr.io/@logtape/logtape/2.0.5/src/util.ts
Checking for slow types in the public API...
Simulating publish of @netscript/logger@0.1.0 with files:
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/README.md (7.18KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/config.ts (3.35KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/constants.ts (411B)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/creators.ts (3.85KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/deno.json (811B)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/middleware.ts (6.7KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/mod.ts (1.25KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/orpc-plugin.ts (12.49KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/orpc.ts (528B)
   file:///home/runner/work/netscript-start/netscript-start/packages/logger/types.ts (1.21KB)
Success Dry run complete

```

## 5. Top JSR audit findings

*(none)*

## 6. Top doctrine findings

- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `AP-23` — `any` in exported declaration — use `unknown` or a specific type (`orpc-plugin.ts:34`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 22 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.types` — type 'LogLevelConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`orpc-plugin.ts`)
- **WARN** `NS-S-4.types` — type 'LoggingConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`types.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'injectLogger' uses non-standard prefix 'inject' — consult STANDARDS § 4.1 (`middleware.ts:106`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'injectRequestId' uses non-standard prefix 'inject' — consult STANDARDS § 4.1 (`middleware.ts:118`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'loggerMiddleware' uses non-standard prefix 'logger' — consult STANDARDS § 4.1 (`middleware.ts:134`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'requestLoggerMiddleware' uses non-standard prefix 'request' — consult STANDARDS § 4.1 (`middleware.ts:197`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetLogging' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`config.ts:105`)
- **WARN** `NS-S-6.sections` — README missing 10/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Publish-clean today.** Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

3 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
