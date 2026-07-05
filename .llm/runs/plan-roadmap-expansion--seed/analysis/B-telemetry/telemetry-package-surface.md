# `@netscript/telemetry` — exhaustive surface inventory

Read-only inventory of `packages/telemetry` in the NetScript worktree, current as of `deno.json` version
`0.0.1-beta.2`. No files modified. This is the B2 deliverable answering research task (1) of the topic spec.

## 1. Export map (`packages/telemetry/deno.json`)

| Subpath | File | Backing module |
|---|---|---|
| `.` | `mod.ts` | curated re-export (see below) |
| `./config` | `config.ts` | `export * from './src/config/mod.ts'` |
| `./tracer` | `tracer.ts` | `export * from './src/core/mod.ts'` |
| `./context` | `context.ts` | `export * from './src/context/mod.ts'` |
| `./attributes` | `attributes.ts` | `export * from './src/attributes/mod.ts'` |
| `./instrumentation` | `instrumentation.ts` | `export * from './src/instrumentation/mod.ts'` |
| `./registry` | — | points directly at `./src/runtime/mod.ts` (no root facade file) |
| `./orpc` | `orpc.ts` | `export * from './src/orpc/mod.ts'` |

`mod.ts` is NOT a thin `export *` shim like the others — it hand-picks `DuplicateInstrumentationError`,
`InstrumentationRegistry`, registry types, `initJobTracing`/`runTracedJob`, core types, and
`inspectTelemetry`/`InspectionReport`. It does **not** re-export `getTracer`, `withSpan`, W3C context helpers,
or attribute builders at the root — those are only reachable via their dedicated subpaths.

`package.json` npm shims: `@opentelemetry/api: catalog:`, `@orpc/contract: catalog:` (types-only interop, no
runtime OTel SDK dependency).

## 2. Real API surface

**Core types** (`src/core/types.ts`) — hand-rolled structural mirrors of `@opentelemetry/api`, not re-exports:
`Span` (setAttribute(s)/addEvent/addLink(s)/setStatus/updateName/isRecording/recordException/end),
`Tracer` (startSpan/startActiveSpan overloads), `SpanKind` (INTERNAL/SERVER/CLIENT/PRODUCER/CONSUMER),
`SpanStatusCode` (UNSET/OK/ERROR).

Tracer factory (`src/core/tracer.ts`): `getTracer(name?, version?)` cached in a module-level `Map`; 7 domain
factories (`getQueueTracer/getWorkerTracer/getSchedulerTracer/getJobTracer/getSSETracer/getKVTracer/
getSagaTracer`); plus `getActiveContext()`, `getActiveSpan()`, `isTracingEnabled()`.

Span lifecycle (`src/core/span.ts`, `span-utils.ts`): `createSpan`, `withSpan<T>` (async, sets OK/ERROR +
records exception + always `span.end()`), `withSpanSync<T>`, `setSpanAttributes`, `setSpanOk`, `setSpanError`,
`addSpanEvent`.

Context propagation (`src/context/*`): `injectContext`, `extractContext` (aliased `getParentContextFromHeaders`),
`resolveTraceContext` (aliased `getTraceContext`), `resolveTraceContextFromSpan`, `createMessageHeaders`,
`resolveParentContextFromHeaders`, `createJobTraceEnv`, `extractJobTraceContext`, `withContext`/
`withContextAsync`, `contextWithSpan`, `getSpanFromContext`, `hasActiveSpan`, `getTraceId`, `getSpanId`.

Attribute builders (`src/attributes/*`): mostly flat const string-key maps (`ExecutionAttributes`,
`JobAttributes`, `KVAttributes`, `MessagingAttributes`, `SchedulerAttributes`, `SSEAttributes`,
`TriggerAttributes`, `WorkerAttributes`, `SpanNames`) — only 3 real builder *functions* exist:
`createMessagingAttributes`, `createJobAttributes`, `createTriggerAttributes`/`createTriggerFileAttributes`.

Instrumentation registry (`src/runtime/instrumentation-registry.ts`): `class InstrumentationRegistry
{ register(reg); resolve(name); list(); async setupAll(ctx); async teardownAll(ctx); }`,
`class DuplicateInstrumentationError extends Error`.

Diagnostics: `inspectTelemetry(target)` — **the `string` branch is a stub**
(`src/diagnostics/inspect-telemetry.ts:20`, hardcoded placeholder return regardless of input).

## 3. Per-module inventory (selected — see full detail in source)

| Module | Purpose | Tests | Flags |
|---|---|---|---|
| `mod.ts` | curated root barrel | partial | omits tracer/context/attributes surface entirely from root |
| `tracer.ts` | facade → `src/core` | n/a | subpath name ("tracer") vs. dir name ("core") mismatch |
| `src/attributes/*` (9 files) | attribute consts + 3 builder fns | only `helpers.ts` tested | `TriggerAttributes` alone namespaced `netscript.trigger.*`, every sibling family unprefixed; `SpanNames.TRIGGER_*` defined but never emitted by any span factory in-package |
| `src/config/*` | env parsing, memoized singleton | tested | — |
| `src/context/w3c.ts` | **W3C impl** | only `formatTraceparent`/`parseTraceparent` round-trip tested | **`tracestate` silently dropped in the manual fallback path** (§4 below) — untested |
| `src/context/mod.ts` | barrel + aliasing | — | consumers import ALIASES (`getParentContextFromHeaders`, `getTraceContext`), not raw w3c.ts names |
| `src/context/payload-context.ts` | subprocess env trace passing | weak (`assertExists` only) | `createJobTraceEnv`/`extractJobTraceContext` build `{JOB_TRACE_CONTEXT, TRACEPARENT, TRACESTATE?}` env bag — directly relevant to the duckdb.exe subprocess hop in the pipeline map |
| `src/core/*` | span lifecycle, tracer factories | tracer cache-identity only | — |
| `src/diagnostics/inspect-telemetry.ts` | debug inspector | **no test at all** | flagged stub |
| `src/instrumentation/queue.ts` (378 ln) | `TracedQueue<T>` wrapper class | **zero direct tests** | PRODUCER/CONSUMER spans, ack/nack opt-in sub-spans, rich JSDoc |
| `src/instrumentation/scheduler.ts` (536 ln) | functional span helpers | **zero direct tests** | deliberate `ROOT_CONTEXT` use, well-commented rationale |
| `src/instrumentation/sse.ts` (447 ln) | functional span helpers | **zero direct tests** | **zero real runtime consumers found anywhere in the worktree — fully dead code relative to actual usage** |
| `src/instrumentation/worker.ts` (571 ln) | span helpers + subprocess env propagation | **zero direct tests** | `createJobSubprocessEnv` overrides `OTEL_BSP_SCHEDULE_DELAY=100`/`OTEL_BSP_EXPORT_TIMEOUT=5000` to fix a real 20s+ process-exit delay (commented); richest/most mature file in package, still untested |
| `src/orpc/tracing-plugin.ts` (234 ln) | oRPC tracing | interceptor-count only | see §5 |
| `src/orpc/error-plugin.ts` (439 ln) | error classification/logging | interceptor-count only | Prisma P2002→409/P2025→404/P2003→400 mapping itself untested |
| `src/public/mod.ts` | full barrel | — | **orphaned**: not in `deno.json` exports, not imported by root `mod.ts`, zero external consumers |
| `src/runtime/instrumentation-registry.ts` | generic lifecycle registry | best-tested file in package | **zero real registrants anywhere in the worktree** (§6) |

## 4. W3C context propagation gap (`src/context/w3c.ts`)

`extractContext(headers)` correctly tries `propagation.extract` first, but its **manual fallback path** (used
when the global OTel propagator doesn't yield a valid remote span — the common case when `OTEL_DENO` isn't
fully active) builds `remoteSpanContext` from `parseTraceparent` only. **It never reads
`headers['tracestate']`** — tracestate is silently dropped on this path, with zero test coverage exercising it.
`parseTraceparent` also does not deliberately validate/reject unknown future version bytes beyond a length
check.

## 5. oRPC tracing-plugin gap (`src/orpc/tracing-plugin.ts`)

`TracingPlugin` (order=1000) enriches whatever span is already active with `rpc.*` attributes/events — **it
never calls `tracer.startSpan`/`startActiveSpan`**. It assumes Deno's built-in OTel HTTP auto-instrumentation
is the span source. **If `OTEL_DENO` HTTP auto-instrumentation isn't active, this plugin has zero tracing
effect** despite running without error. Span naming uses flat `rpc.*` keys, architecturally disconnected from
the package's own `SpanNames` constants.

Wired into the framework at exactly one place: `packages/service/src/primitives/handlers.ts:28`
(`ErrorHandlingPlugin`, `TracingPlugin`) — the sole path by which scaffolded services get any tracing; CLI
scaffold templates deliberately omit a direct telemetry import (enforced by a scaffold test), relying on
`defineService`'s internal use of these two plugins.

`order` semantics are ambiguous: `TracingPlugin` comment implies "run early, order=1000"; `ErrorHandlingPlugin`
comment implies "run after tracing, order=900" — no documented higher-vs-lower-runs-first convention exists.

## 6. Instrumentation-registry — unwired scaffolding

Grepping the entire worktree for `InstrumentationRegistry|telemetry/registry|instrumentation-registry` returns
exactly 10 files, all confined to the telemetry package itself (source/tests/README) plus docs/planning
material. **No plugin or package (`queue`, `workers`, `scheduler`, `sse`, `sagas`, `triggers`, `auth`) calls
`registry.register(...)` anywhere.** This directly contradicts `README.md`'s framing of the registry as what
"links scheduler, queue, worker, RPC, and SSE spans into one distributed trace" — that linking, where it
happens at all, is done ad hoc via manual W3C context threading inside `queue.ts`/`scheduler.ts`/`worker.ts`,
entirely independent of the registry. For a revamp: either (a) remove as dead scaffolding, or (b) wire it up
as the real composition seam the README already claims it is.

## 7. Per-primitive instrumentation adapters — comparison

| Adapter | Pattern | Invocation model | Real runtime consumers | Auto-wired? |
|---|---|---|---|---|
| `queue.ts` (`TracedQueue`) | wrapper class | `traceQueue(inner, opts)` | `packages/queue/factory/create-queue.ts:25,137` | **Yes** — gated on `isTelemetryEnabled() && !options.disableAutoTracing` (`create-queue.ts:127`); every queue built through `createQueue()` is auto-traced unless opted out |
| `scheduler.ts` | functional helpers | manual per-callsite | `plugins/workers/worker/{scheduler.ts,scheduler-tracing.ts,scheduler-dispatch.ts}`; reused by `plugins/triggers/src/runtime/trigger-runtime-processor.ts` via `traceJobDispatch` | No — hand-threaded; triggers reuses scheduler's helper instead of getting its own |
| `sse.ts` | functional helpers | intended per-connection/event | **none found** | No — entirely unused despite being the largest single-purpose file (447 ln) |
| `worker.ts` | functional helpers + subprocess env | manual per-callsite | `plugins/workers/worker/{worker.ts,job-dispatcher.ts}`, `plugins/workers/jobs/{job-tools.ts,health-check.ts}`, `plugins/triggers/jobs/job-tools.ts` | No — manual wiring, same as scheduler |

**No dedicated adapter exists at all for `saga` or `trigger`** despite both having attribute constants and a
`getSagaTracer()` factory — sagas built a bespoke wrapper (`plugins/sagas/src/telemetry/otel-saga-tracer.ts`),
triggers reuses scheduler's `traceJobDispatch`.

## 8. Consumer inventory (blast radius, 52 files matched)

- **`/instrumentation`**: `plugins/workers/worker/*` (worker, queue-consumer, scheduler-tracing, job-dispatcher),
  `plugins/triggers/src/runtime/trigger-runtime-processor.ts`, `packages/queue/factory/create-queue.ts`.
- **`/tracer`**: `plugins/workers/worker/*`, `plugins/sagas/src/telemetry/otel-saga-tracer.ts` (builds its own
  wrapper), `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts`,
  `packages/plugin-auth-core/src/telemetry/instrumentation.ts` (`createAuthTelemetry` — own facade),
  **4 separate independent per-feature telemetry wrapper files in `packages/fresh`** (`internal/
  package-telemetry/telemetry.ts`, `application/defer/telemetry.ts`, `application/form/runtime/telemetry.ts`,
  `application/builders/define-page/runtime/context.ts`), each re-deriving `createXTracer`/`withXSpan`
  boilerplate rather than sharing one adapter.
- **`/config`**, **`/attributes`**, **`/context`**: consumed by workers, sagas, auth, sdk client, per above.
- **`/orpc`**: **only** `packages/service/src/primitives/handlers.ts:28`.
- **Deliberate non-consumers**: `packages/ai/src/ports/telemetry.ts` (explicit `TelemetryPort` seam, telemetry
  injected not imported); CLI-scaffolded services (enforced by test); `workspace-mutator.ts:196-203`'s
  JSR-specifier rewrite map covers `/attributes,/config,/context,/instrumentation,/tracer` but **omits `/orpc`
  and `/registry`** — latent scaffold gap, unconfirmed whether it currently breaks anything.

## 9. Test coverage summary

Only 8 test files exist total. **Zero tests exist for**: 8 of 9 attribute files, `context/message.ts`,
`core/span.ts`, `core/span-utils.ts`, `diagnostics/inspect-telemetry.ts`, **all four `src/instrumentation/*.ts`
files** (1,932 combined lines — the richest and most complex code in the package), `orpc/error-plugin.ts`'s
actual classification logic, `orpc/handler-context.ts`, `runtime/types.ts`, and critically `injectContext`/
`extractContext`/tracestate handling in `w3c.ts`.

## 10. Findings ranked by revamp relevance

1. **Fully dead code**: `src/instrumentation/sse.ts` (447 ln, zero consumers) — remove or find a real caller.
2. **Aspirational/unwired scaffolding**: instrumentation registry — best-tested file, zero real registrants,
   contradicts its own README claim (§6).
3. **Real W3C correctness gap**: `tracestate` silently dropped in `extractContext`'s fallback path, untested (§4).
4. **oRPC tracing silent no-op risk**: `TracingPlugin` never creates its own span; depends entirely on
   `OTEL_DENO` HTTP auto-instrumentation being active (§5).
5. **Auto-wiring asymmetry**: queue is opt-out-by-default at the factory; scheduler/worker are manual;
   sse is unused; saga/trigger have no dedicated adapter (§7).
6. **Repeated re-wrapping instead of a shared facade**: auth-core, sagas, and 4 files in `fresh` each
   independently re-derive tracer/span boilerplate — a revamp could consolidate into one reusable
   "domain telemetry facade" factory.
7. **Namespace inconsistency**: `TriggerAttributes` alone prefixed `netscript.trigger.*`.
8. **Orphaned `src/public/mod.ts`**: exists per doctrine convention, but bypassed by the package's actual
   per-subpath facade shims.
9. **Explicit stub**: `inspectTelemetry`'s string-path branch — no real logic, no test.
10. **Scaffold rewrite-map gap**: `/orpc` and `/registry` missing from `workspace-mutator.ts`'s JSR rewrite list.

## Reconciliation with pipeline-map open question #2

This inventory answers open-question #2 in `context/B-telemetry/open-questions.md`: `channelClient` (the
workers→eischat oRPC callback in Flow B) rides through `@netscript/service`'s `defineService` primitives, which
per §5/§8 always installs `TracingPlugin`+`ErrorHandlingPlugin` at `packages/service/src/primitives/handlers.ts:28`
— so channelClient calls DO get `rpc.*` attribute enrichment automatically. However, per §5, that enrichment is
only real tracing if Deno's `OTEL_DENO` HTTP auto-instrumentation is active on that hop; this pass did not
independently re-confirm `OTEL_DENO` is set for the `workers` executable's outbound calls (register-background.mts
sets full OTEL env vars generally, but the specific auto-instrumentation activation was not re-verified against
this finding). Treat as resolved-with-residual-caveat, not fully closed.
