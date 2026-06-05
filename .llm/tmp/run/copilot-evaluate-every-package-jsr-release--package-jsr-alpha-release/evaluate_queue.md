# Evaluate — `@netscript/queue`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__queue.json` · `audit/dry-run/queue.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 2 | — |
| Doctrine | 0 | 3 | 1 |
| Standards | 1 | 6 | 3 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/queue` @ `0.1.0`
- **Description:** "Provider-agnostic message queue abstraction wrapping Fedify adapters for Deno KV, Redis, and RabbitMQ."
- **Files / LOC:** 25 `.ts` files, 3559 lines
- **Exports:** `.`, `./adapters/deno-kv`, `./adapters/redis`, `./adapters/amqp`, `./adapters/kv-polling`, `./types`, `./errors`, `./validation`
- **README:** 252 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./adapters/deno-kv: ✓, ./adapters/redis: ✓, ./adapters/amqp: ✓, ./adapters/kv-polling: ✓, ./types: ✓, ./errors: ✓, ./validation: ✓
- **Test files:** 5
- **Public surface size:** .=13, ./adapters/deno-kv=2, ./adapters/redis=1, ./adapters/amqp=1, ./adapters/kv-polling=2, ./types=7, ./errors=6, ./validation=3

## 3. Current folder tree (`packages/queue/`, depth 4, capped at 80 entries)

```
README.md
tests/
  typed-queue_test.ts
  options_test.ts
  errors_test.ts
  validation_test.ts
  envelope_test.ts
utils/
  mod.ts
  validation.ts
mod.ts
factory/
  create-parallel-queue.ts
  mod.ts
  create-queue.ts
  create-typed-queue.ts
deno.json
internal/
  mod.ts
  distributed-queue.ts
  parallel-queue.ts
adapters/
  amqp.adapter.ts
  deno-kv.adapter.ts
  redis.adapter.ts
  mod.ts
  _envelope.ts
  kv-polling.adapter.ts
interfaces/
  mod.ts
  errors.ts
  message-queue.ts
  options.ts
```

## 4. `deno publish --dry-run` output (tail)

```
Simulating publish of @netscript/queue@0.1.0 with files:
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/README.md (8.04KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/_envelope.ts (1.84KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/amqp.adapter.ts (5.47KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/deno-kv.adapter.ts (6.44KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/kv-polling.adapter.ts (19.93KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/mod.ts (312B)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/adapters/redis.adapter.ts (5.4KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/deno.json (1.39KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/factory/create-parallel-queue.ts (2.49KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/factory/create-queue.ts (8.57KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/factory/create-typed-queue.ts (5.53KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/factory/mod.ts (336B)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/interfaces/errors.ts (4.05KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/interfaces/message-queue.ts (4.7KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/interfaces/mod.ts (590B)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/interfaces/options.ts (4.97KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/internal/distributed-queue.ts (5.64KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/internal/mod.ts (691B)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/internal/parallel-queue.ts (4.45KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/mod.ts (2.55KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/utils/mod.ts (241B)
   file:///home/runner/work/netscript-start/netscript-start/packages/queue/utils/validation.ts (3.53KB)
Success Dry run complete

```

## 5. Top JSR audit findings

- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'utils' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`utils`)
- **WARN** `F-DOCT-4 vocabulary` — forbidden folder name 'interfaces' (utils/helpers/common/lib/interfaces) — needs migration plan + debt entry (`interfaces`)

## 6. Top doctrine findings

- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'utils' — split into domain/, application/, or adapters/ aligned to a real concern (`utils`)
- **WARN** `AP-7/F-DOCT-4` — forbidden folder name 'interfaces' — split into domain/, application/, or adapters/ aligned to a real concern (`interfaces`)
- **WARN** `A8/AP-9` — file is 746 lines (cap 500) — split into smaller single-reason files (`adapters/kv-polling.adapter.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 29 non-export/non-comment lines — barrels must be export-only
- **INFO** `NS-S-3.sections` — mod.ts lacks section comment headers — recommended for navigability
- **WARN** `NS-S-4.fn-prefix` — exported function 'safeValidate' uses non-standard prefix 'safe' — consult STANDARDS § 4.1 (`utils/validation.ts:75`)
- **WARN** `NS-S-6.sections` — README missing 8/12 mandated sections (Overview, Quickstart, Mental model, API, Recipes, Configuration, Testing, Observability, Architecture, Stability, Compatibility, License)
- **WARN** `NS-S-9.logger` — package owns runtime/adapters but does not import @netscript/logger
- **INFO** `NS-S-9.telemetry` — package owns runtime/adapters but does not import @netscript/telemetry — verify spans/metrics emitted
- **INFO** `NS-S-10` — mod.ts does not export an `inspect<Noun>()` diagnostic — recommended discoverability axis

## 8. Code-quality verdict

**Publish-clean today.** Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

5 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
