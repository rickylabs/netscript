# Evaluate — `@netscript/kv`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__kv.json` · `audit/dry-run/kv.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 0 | — |
| Doctrine | 0 | 5 | 1 |
| Standards | 1 | 14 | 3 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/kv` @ `0.1.0`
- **Description:** "Reactive key-value abstraction for Redis, Deno KV, and in-memory backends."
- **Files / LOC:** 26 `.ts` files, 5945 lines
- **Exports:** `.`, `./redis`, `./kvdex`
- **README:** 156 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./redis: ✓, ./kvdex: ✓
- **Test files:** 5
- **Public surface size:** .=11, ./redis=1, ./kvdex=5

## 3. Current folder tree (`packages/kv/`, depth 4, capped at 80 entries)

```
README.md
tests/
  memory.adapter_test.ts
  shared_test.ts
  bridge_test.ts
  auto-detect_test.ts
  keys_test.ts
redis.ts
kvdex.ts
mod.ts
ARCHITECTURE.md
core/
  shared.ts
  mod.ts
  auto-detect.ts
  errors.ts
  keys.ts
deno.json
types/
  common.ts
  kv-store.ts
  watchable-kv.ts
  mod.ts
adapters/
  memory.adapter.ts
  deno-kv.adapter.ts
  redis.adapter.ts
  redis/
    types.ts
    serialization.ts
    connection.ts
bridges/
  kvdex.ts
  mod.ts
  denokv-bridge.ts
```

## 4. `deno publish --dry-run` output (tail)

```
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/README.md (4.79KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/deno-kv.adapter.ts (14.99KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/memory.adapter.ts (13.57KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/redis.adapter.ts (24.37KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/redis/connection.ts (7.44KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/redis/serialization.ts (3.31KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/adapters/redis/types.ts (4.42KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/bridges/denokv-bridge.ts (21.93KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/bridges/kvdex.ts (4.99KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/bridges/mod.ts (800B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/core/auto-detect.ts (4.38KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/core/errors.ts (315B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/core/keys.ts (4.1KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/core/mod.ts (654B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/core/shared.ts (7.36KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/deno.json (891B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/kvdex.ts (900B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/mod.ts (893B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/redis.ts (1.76KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/types/common.ts (2.72KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/types/kv-store.ts (5.25KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/types/mod.ts (398B)
   file:///home/runner/work/netscript-start/netscript-start/packages/kv/types/watchable-kv.ts (3.59KB)
Success Dry run complete

```

## 5. Top JSR audit findings

*(none)*

## 6. Top doctrine findings

- **WARN** `A8/AP-9` — file is 536 lines (cap 500) — split into smaller single-reason files (`adapters/memory.adapter.ts`)
- **WARN** `A8/AP-9` — file is 592 lines (cap 500) — split into smaller single-reason files (`adapters/deno-kv.adapter.ts`)
- **WARN** `A8/AP-9` — file is 810 lines (cap 500) — split into smaller single-reason files (`adapters/redis.adapter.ts`)
- **WARN** `A8/AP-9` — file is 666 lines (cap 500) — split into smaller single-reason files (`bridges/denokv-bridge.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `AP-23` — `any` in exported declaration — use `unknown` or a specific type (`bridges/kvdex.ts:32`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 24 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetKv' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`core/shared.ts:208`)
- **WARN** `NS-S-4.types` — type 'SharedKvConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`core/shared.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'maskRedisUrl' uses non-standard prefix 'mask' — consult STANDARDS § 4.1 (`core/auto-detect.ts:39`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'autoDetectProvider' uses non-standard prefix 'auto' — consult STANDARDS § 4.1 (`core/auto-detect.ts:121`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'keyToString' uses non-standard prefix 'key' — consult STANDARDS § 4.1 (`core/keys.ts:32`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateVersionstamp' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`core/keys.ts:65`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'keyHasPrefix' uses non-standard prefix 'key' — consult STANDARDS § 4.1 (`core/keys.ts:89`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'compareKeys' uses non-standard prefix 'compare' — consult STANDARDS § 4.1 (`core/keys.ts:126`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'keyToRedisKey' uses non-standard prefix 'key' — consult STANDARDS § 4.1 (`adapters/redis/serialization.ts:37`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'redisKeyToKey' uses non-standard prefix 'redis' — consult STANDARDS § 4.1 (`adapters/redis/serialization.ts:72`)
- **WARN** `NS-S-6.sections` — README missing 11/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **INFO** `NS-S-9.telemetry` — package owns runtime/adapters but does not import @netscript/telemetry — verify spans/metrics emitted
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Publish-clean today.** Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

5 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
