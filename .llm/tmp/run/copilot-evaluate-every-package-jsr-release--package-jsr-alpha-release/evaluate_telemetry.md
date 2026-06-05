# Evaluate — `@netscript/telemetry`

> Wave: **2** · Archetype: **A2 — Integration** · Pattern: **Function family + Ports/Adapters**
> Source data: `audit/readiness/{jsr,doctrine,standards}/packages__telemetry.json` · `audit/dry-run/telemetry.txt`

## 1. Today's mechanical readiness

| Evaluator | FAIL | WARN | INFO |
|---|---:|---:|---:|
| JSR | 0 | 0 | — |
| Doctrine | 0 | 4 | 1 |
| Standards | 1 | 34 | 1 |

`deno publish --dry-run`: **✅ Success** · slow-type problems: **0**

## 2. Package facts

- **Name:** `@netscript/telemetry` @ `0.1.0`
- **Description:** "OpenTelemetry tracing primitives and NetScript instrumentation for jobs, queues, RPC, sagas, and SSE."
- **Files / LOC:** 52 `.ts` files, 4686 lines
- **Exports:** `.`, `./config`, `./tracer`, `./context`, `./attributes`, `./instrumentation`, `./instrumentation/saga`, `./orpc`
- **README:** 186 lines
- **`docs/` folder:** *(missing)*
- **`@module` JSDoc tags on entrypoints:** .: ✓, ./config: ✓, ./tracer: ✓, ./context: ✓, ./attributes: ✓, ./instrumentation: ✓, ./instrumentation/saga: ✓, ./orpc: ✓
- **Test files:** 6
- **Public surface size:** .=12, ./config=1, ./tracer=1, ./context=1, ./attributes=1, ./instrumentation=1, ./instrumentation/saga=21, ./orpc=1

## 3. Current folder tree (`packages/telemetry/`, depth 4, capped at 80 entries)

```
README.md
orpc.ts
src/
  context/
    message.ts
    types.ts
    mod.ts
    helpers.ts
    w3c.ts
    job.ts
  config/
    constants.ts
    singleton.ts
    environment.ts
    mod.ts
  instrumentation/
    sse.ts
    worker.ts
    saga.ts
    types.ts
    mod.ts
    scheduler.ts
    queue.ts
  core/
    types.ts
    mod.ts
    span-utils.ts
    tracer.ts
    span.ts
  attributes/
    sse.ts
    worker.ts
    mod.ts
    spans.ts
    helpers.ts
    scheduler.ts
    execution.ts
    trigger.ts
    messaging.ts
    job.ts
    kv.ts
  orpc/
    error-plugin.ts
    mod.ts
    _types.ts
    handler-context.ts
    tracing-plugin.ts
    _utils.ts
tests/
  context/
    w3c_test.ts
    job_test.ts
  config/
    config_test.ts
  core/
    tracer_test.ts
  attributes/
    helpers_test.ts
  orpc/
    plugin_test.ts
mod.ts
context.ts
deno.json
instrumentation.ts
tracer.ts
attributes.ts
config.ts
```

## 4. `deno publish --dry-run` output (tail)

```
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/context/message.ts (915B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/context/mod.ts (218B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/context/types.ts (379B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/context/w3c.ts (3.77KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/core/mod.ts (190B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/core/span-utils.ts (624B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/core/span.ts (2.25KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/core/tracer.ts (1.61KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/core/types.ts (765B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/mod.ts (692B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/queue.ts (10.7KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/saga.ts (16.68KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/scheduler.ts (13.92KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/sse.ts (10.96KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/types.ts (1.59KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/instrumentation/worker.ts (14.18KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/_types.ts (502B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/_utils.ts (488B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/error-plugin.ts (11.66KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/handler-context.ts (6.57KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/mod.ts (593B)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/src/orpc/tracing-plugin.ts (6.63KB)
   file:///home/runner/work/netscript-start/netscript-start/packages/telemetry/tracer.ts (121B)
Success Dry run complete

```

## 5. Top JSR audit findings

*(none)*

## 6. Top doctrine findings

- **WARN** `A8/AP-9` — file is 551 lines (cap 500) — split into smaller single-reason files (`src/instrumentation/worker.ts`)
- **WARN** `A8/AP-9` — file is 607 lines (cap 500) — split into smaller single-reason files (`src/instrumentation/saga.ts`)
- **WARN** `A8/AP-9` — file is 526 lines (cap 500) — split into smaller single-reason files (`src/instrumentation/scheduler.ts`)
- **INFO** `A9` — docs/architecture.md missing — required when public symbols > 25
- **WARN** `AP-23` — `any` in exported declaration — use `unknown` or a specific type (`src/orpc/_types.ts:9`)

## 7. Top standards findings

- **WARN** `NS-S-1.version` — version is '0.1.0'; alpha cadence requires '0.0.1-alpha.0'
- **FAIL** `NS-S-1.strict` — deno.json compilerOptions.strict must be true
- **WARN** `NS-S-1.task` — deno.json `tasks` missing `publish:dry-run` shortcut
- **WARN** `NS-S-3.barrel-only` — mod.ts has 16 non-export/non-comment lines — barrels must be export-only
- **WARN** `NS-S-4.fn-prefix` — exported function 'contextWithSpan' uses non-standard prefix 'context' — consult STANDARDS § 4.1 (`src/context/helpers.ts:11`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'injectContext' uses non-standard prefix 'inject' — consult STANDARDS § 4.1 (`src/context/w3c.ts:64`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractContext' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`src/context/w3c.ts:101`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractFromTraceContext' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`src/context/w3c.ts:132`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractJobTraceContext' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`src/context/job.ts:21`)
- **WARN** `NS-S-4.types` — type 'TelemetryConfig' uses non-standard suffix — convention is <Function>Options / <Noun>Spec (`src/config/constants.ts`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'resetConfig' uses non-standard prefix 'reset' — consult STANDARDS § 4.1 (`src/config/singleton.ts:13`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'describeTelemetryConfig' uses non-standard prefix 'describe' — consult STANDARDS § 4.1 (`src/config/environment.ts:78`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'traceSSEEvent' uses non-standard prefix 'trace' — consult STANDARDS § 4.1 (`src/instrumentation/sse.ts:294`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'extractTraceContextFromRecord' uses non-standard prefix 'extract' — consult STANDARDS § 4.1 (`src/instrumentation/sse.ts:378`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'generateSSEClientId' uses non-standard prefix 'generate' — consult STANDARDS § 4.1 (`src/instrumentation/sse.ts:418`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'recordSSEMetrics' uses non-standard prefix 'record' — consult STANDARDS § 4.1 (`src/instrumentation/sse.ts:427`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'traceJobExecution' uses non-standard prefix 'trace' — consult STANDARDS § 4.1 (`src/instrumentation/worker.ts:182`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'addJobStepEvent' uses non-standard prefix 'add' — consult STANDARDS § 4.1 (`src/instrumentation/worker.ts:484`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'recordJobProgress' uses non-standard prefix 'record' — consult STANDARDS § 4.1 (`src/instrumentation/worker.ts:501`)
- **WARN** `NS-S-4.fn-prefix` — exported function 'recordWorkerMetrics' uses non-standard prefix 'record' — consult STANDARDS § 4.1 (`src/instrumentation/worker.ts:528`)

## 8. Code-quality verdict

**Publish-clean today.** Top STANDARDS warnings: `NS-S-1.version`, `NS-S-1.task`, `NS-S-3.barrel-only`.

## 9. Test coverage assessment

6 test files today. Audit them for: (a) names use behavioural sentences, (b) no imports from `src/internal/`, (c) no Jest globals, (d) port contracts shared via `./testing` entrypoint. Promote/rewrite as the plan's § 4 dictates.

---

*Cross-references:* [`PLAN.md`](./PLAN.md) §3, harmonisation/STANDARDS.md, harmonisation/DOCS-STRUCTURE.md, harmonisation/PUBLIC-SURFACE-PATTERNS.md.
