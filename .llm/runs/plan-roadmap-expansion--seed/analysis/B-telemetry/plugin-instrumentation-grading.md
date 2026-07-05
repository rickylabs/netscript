# B2b — Per-Plugin / Per-Layer Telemetry Instrumentation Grading

File-level maturity grading of every telemetry CONSUMER, relative to `workers` (= A, the asserted
best-in-class reference). Grades measure OTel instrumentation MATURITY, not general code quality.
All paths rooted at the worktree `C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion\`.

> **Reconciliation note.** An independent parallel deep-search pass graded the same layers with slightly
> different letter emphasis (auth A−, database B−, sagas C+, triggers D+). The two passes agree on the
> underlying EVIDENCE; they differ on how to weight it into a letter. Notable deltas and why: **auth** —
> the other pass scored it A− ("ties/exceeds workers"); this file scores B because auth's surface is a
> single span + audit events per operation on a DIFFERENT axis (redaction/compliance), not span density,
> and is opt-in. **database** — the other pass scored B− (links "gated off by default, disconnected from
> NetScript's vocab"); this file scores B+/A− because it is the ONLY production consumer using real OTel
> span links at all. **sagas** — B+ here (richest metric instruments in the repo) vs C+ there (cascade
> spans NOOP unless a composition root wires the tracer); both are true — the metrics are defined but the
> spans are unwired-by-default. Treat the EVIDENCE paragraphs below as canonical; the letters are a lens.

## Grading table

| Layer | Grade | Span coverage | Attribute quality | Context propagation | Key gaps |
|---|---|---|---|---|---|
| **workers** | **A** | Full lifecycle: scheduler→dispatch→enqueue→dequeue→job.execute→subprocess job.main + child; ack/nack; task.execute | Rich (job/execution/worker/scheduler/messaging) + events + idempotency events | Full W3C end-to-end incl. subprocess env + queue headers | — (reference) |
| **database** | **B+/A-** | Prisma engine spans → OTEL w/ parent-child tree walk **and real LINKS** | Engine-supplied; CLIENT/INTERNAL SpanKind | Emits W3C traceparent for engine; global provider | Narrow (Prisma only); needs globally-registered provider; **only consumer using real span links** |
| **sagas** | **B+** | handle + 5 cascade span types; richest **metrics** of any consumer | Rich saga attrs + state.before/after events + 7 meter instruments | Parent-child via traceparent extraction (test-proven) | **NO real span links** (parent-child only); reimplements own tracer; NOOP unless composition root wires it |
| **auth** | **B** | Per-op child span (signin/callback/signout/session/me) + audit events | Audit-grade, **redacted** (HMAC-SHA-256 subject hash); outcome/error taxonomy | Parent-context via resolveTraceContextFromSpan | Different DIMENSION (safety, not density); opt-in; narrow (no queue/subprocess spans) |
| **triggers** | **C+** | Runtime: DETECT + nested PROCESS + job.dispatch only | Minimal on runtime spans (3 attrs); rich facade exists but UNUSED | trigger→job W3C OK; **inbound webhook→process parent BROKEN** | Ingress creates no span; stored event.traceparent never used to parent processing; core facade + metrics unwired |
| **services / oRPC** | **C+** | **Enriches** Deno's OTEL HTTP span; creates NO spans | rpc.system/service/method/input_keys/error.* + events | SDK client injects traceparent header only; no client span | Enrichment by design; depends on Deno built-in HTTP instrumentation |
| **streams** | **F** | None | None | None | **Zero `@netscript/telemetry` wiring (verified)**; no seam, no spans |
| **ai** | **F** | None (no-op port) | None | None | Contract-only TelemetryPort + no-op default; **no adapter**; runtime never even calls the port |

## Per-layer evidence

### workers — A (reference): WHY best-in-class
Heaviest and only end-to-end-complete consumer; consumes the shared `@netscript/telemetry/instrumentation`
facade rather than reimplementing.
- Chain: `scheduler.start → scheduler.dispatch → queue.enqueue (PRODUCER) → queue.dequeue (CONSUMER) →
  job.execute (INTERNAL) → subprocess job.main`.
- `plugins/workers/worker/job-dispatcher.ts`: `processWorkerJob` extracts parent via
  `getParentContextFromHeaders` (L42-43), opens `job.execute` via `traceJobExecution` (L90); recomputes
  `subprocessHeaders` from the active span (L128-134).
- `packages/telemetry/src/instrumentation/worker.ts`: `traceJobExecution` (L202-287) sets
  `createJobAttributes(job)` + execution.id, RUNNING→COMPLETED/FAILED, `job.duration_ms/exit_code`,
  attempt, trigger, `correlation.id`; started/completed/failed/exception events. `runTracedJob`/
  `withChildSpan` (L423-496) = subprocess child spans. `createJobSubprocessEnv` (L340-357) passes OTEL_*
  env + `createJobTraceEnv()` + tuned BSP delay.
- `queue.ts`: PRODUCER enqueue span + header injection (L109-154); CONSUMER listen span runs handler in
  `otelContext.with(...)` (L209-262); ack/nack own INTERNAL spans (L287-345).
- `scheduler-tracing.ts` + `scheduler.ts`: long-lived `scheduler.start` ROOT span (L393),
  `traceJobDispatch` wraps enqueue in dispatch context + injects headers (L339-371).
- `worker-idempotency-events.ts`: `recordIdempotentSkip` emits `worker.{job|task}.idempotent_skip` +
  `worker.idempotency.*` attrs.
- `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts`: `task.execute` span via
  `getTracer('@netscript/plugin-workers-core/task-executor')` with adapter/runtime/task attrs + bridged
  `TaskExecutorSpan` (L87-113, L214-242) — the polyglot subprocess path.

### database — B+/A-: the ONLY real-span-links consumer
`packages/database/prisma-tracing.ts` re-implements `@prisma/instrumentation@7.3.0`'s
`ActiveTracingHelper` on `@prisma/instrumentation-contract` (0-dep) + `@opentelemetry/api` to dodge the
CJS `require-in-the-middle` chain that breaks Deno bundle/compile (module doc L1-17).
- `dispatchEngineSpans` (L263-270) replays Prisma engine spans into OTEL via `tracer.startActiveSpan`,
  walking `parentId` to rebuild the tree (L196-237); engine kind → CLIENT/INTERNAL.
- **`span.addLinks(...)` from engine links via a `linkIds` map (L214-228)** — the ONLY production use of
  real OTEL span links in the entire codebase.
- `getTraceParent` (L255-261) emits W3C header for engine propagation. Public
  `enablePrismaTracing/disablePrismaTracing/isPrismaTracingEnabled` (L338-359) manage a global helper;
  internal spans hidden unless `PRISMA_SHOW_ALL_TRACES=true`. Limitation: Prisma-only; needs a
  globally-registered provider.

### sagas — B+: reimplements own tracer; NO real links (corrects earlier assumption)
- `plugins/sagas/src/telemetry/otel-saga-tracer.ts`: `createOtelSagaTracer` adapts the core structural
  boundary onto `@netscript/telemetry/tracer` (`getSagaTracer`, `createSpan`) — does NOT go through
  `telemetry/src/instrumentation`. Parent from `extractFromTraceContext({traceparent,tracestate})` (L25-30).
- `packages/plugin-sagas-core/src/telemetry/instrumentation.ts`: spans `saga.handle` (INTERNAL),
  `cascade.send/schedule/spawn` (PRODUCER), `cascade.compensate/complete` (INTERNAL). Thorough attrs
  (saga id/instance/event_type/attempt/durability_tier/correlation_key/target_job_id/idempotency_key/
  concurrency_key/queue_name/child ids/compensation reason/cascade_size/outcome); state.before/after events.
- **Richest metrics of any consumer**: 7 meter instruments (`handleDurationMs` histogram,
  `instancesActive` gauge, `compensationsTotal/dlqTotal/idempotencyHitsTotal/concurrencyThrottledTotal`,
  `replayDurationMs`) — workers has none.
- Propagation test-proven (`plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts`): API
  `traceHeaders.traceparent` becomes the `saga.handle` parent; wired at
  `packages/plugin-sagas-core/src/runtime/saga-engine.ts:263` (`startHandleSpan` w/
  `traceparent: message.traceparent`); HTTP publisher forwards headers
  (`plugins/sagas/src/runtime/saga-publisher.ts:278-289`).
- **GAP — "real span links for fan-in" is FALSE**: `addLink`/`addLinks` appear ONLY in test mock spans
  (`publish-trace-linkage_test.ts:233/237`, `otel-saga-tracer_test.ts:168-174`) as no-op recorders. No
  production sagas code calls addLink; fan-in/cascade is parent-child + PRODUCER only. Cascade spans set
  no explicit parent (attach to ambient context).
- **GAP**: whole facade is NOOP (`NOOP_TRACER`) unless a composition root injects `createSagaTelemetry`.

### auth — B: different dimension (safety/redaction), actually wired
- `packages/plugin-auth-core/src/telemetry/instrumentation.ts`: `createAuthTelemetry` → `traceOperation`
  opens per-op INTERNAL child spans via `withSpan(..., {parentContext})` (L186-201); emits
  `auth.audit_log` + `principal.resolved`/`session.issued`/`session.revoked` events.
- Redaction (the distinguishing axis): stores only `subject_hash` (HMAC-SHA-256 `hashSubject(subject,
  salt)`, L156-163) + counts, never raw subjects/tokens; every recorder try/catch-wrapped ("observability
  must not change auth behavior"). Opt-in — `enabled` only when `subjectHashSalt` provided else NOOP.
- Wired in prod: `plugins/auth/services/src/main.ts:60` `createAuthTelemetry({subjectHashSalt:
  resolveAuditSalt(ctx)})` reading `NETSCRIPT_AUTH_AUDIT_SALT` (L88); `v1-handlers.ts:395` runs handlers
  through `telemetry.traceOperation` (fallback `createAuthTelemetry({enabled:false})` L46).
- Nuance: single span + audit events per op, compliance-grade redaction — NOT span-density-comparable to
  workers. Mature and correctly wired but deliberately narrow.

### triggers — C+: broken ingress parent, runtime bypasses its own facade
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts`: `TracedTriggerProcessor` hand-rolls spans
  via `getTracer('@netscript/triggers')` + `withSpan` — only `TriggerSpanNames.DETECT` wrapping `PROCESS`
  (L82-94), 3 attrs only (`trigger.id/event.id/kind`). Does NOT use the rich `TriggerInstrumentation` core.
- trigger→job propagation works: `enqueueWorkerJob` (L117-166) reuses workers' `traceJobDispatch`.
- **GAP — inbound webhook → processing trace SEVERED**: `packages/plugin-triggers-core/src/runtime/
  create-trigger-ingress.ts` captures traceparent/tracestate onto the event (L156-157) but creates NO
  ingress span, and `#processAndRecord` (L171-189) calls `processor.process(event,...)` WITHOUT passing
  `event.traceparent` as parent — so DETECT/PROCESS start a FRESH trace, discarding the caller's W3C context.
- **GAP — dormant core facade**: `packages/plugin-triggers-core/src/telemetry/instrumentation.ts` defines
  a full surface (`startIngressSpan` [server], startDetectSpan, startProcessSpan, startActionDispatchSpan
  [producer], startDlqEnqueueSpan, startIngressResponseSpan + 4 meter instruments + outcome/error_class),
  UNWIRED into the runtime. Runtime emits no outcome/status/error attrs and no metrics.

### services / oRPC — C+: enrichment by design, no span creation
- `packages/telemetry/src/orpc/tracing-plugin.ts`: `TracingPlugin` does NOT create spans — enriches
  `trace.getActiveSpan()` (Deno's built-in HTTP span) with `rpc.system=orpc/service/method`,
  `rpc.input_keys` (keys only), `rpc.error.*` + procedure start/success/error events + OK/ERROR status.
- Wired: `packages/service/src/primitives/handlers.ts:72-114` `createRPCPlugins` adds `TracingPlugin` by
  default when serviceName set. SDK client `packages/sdk/src/client/service-client.ts:20-22` only copies
  `traceparent` into outgoing headers — no client-side span. Correct for the architecture (relies on
  Deno's built-in HTTP instrumentation), contributes no independent spans.

### streams — F: VERIFIED zero telemetry
Grep `@netscript/telemetry|getTracer|withSpan|createSpan|TelemetryPort|SpanKind|traceparent` → NO matches
in `packages/plugin-streams-core/` and `plugins/streams/`. No TelemetryPort stub/seam, no spans, no
metrics. (Broad `setAttribute`/header matches in `plugins/streams/services/src/proxy.ts` are unrelated to
OTel.) Confirmed: not even a no-op seam like AI has.

### ai — F: VERIFIED no-op AND not even invoked
- `packages/ai/src/ports/telemetry.ts` defines `TelemetryPort` (startSpan/recordEvent) + `TelemetrySpan`
  + `createNoopTelemetryPort()` → no-op `NOOP_SPAN`. JSDoc: real OTel adapter is "slice E9", "MUST NOT be
  imported here."
- No `implements TelemetryPort` / `createOtel*Telemetry` anywhere in `packages/ai` or `plugins/ai`.
- Stronger than no-op: `packages/ai/src/runtime/mod.ts` grep `telemetry.|startSpan|recordEvent` → NO
  matches — the runtime does not call the injected port AT ALL. Seam exists structurally but is inert
  end-to-end. (Flagship-quality mandate for `@netscript/plugin-ai` makes this an especially load-bearing gap.)

## Cross-cutting gap summary (feeds gap-analysis)
1. **Real OTEL span links exist only in `database`.** The sagas "publish/fan-in links" claim is
   unsupported — sagas uses parent-child + PRODUCER only. This is the single biggest SOTA-parity gap for
   messaging fan-in (per B3a: links are spec-SHOULD for consumer/batch/fan-in).
2. **Two plugins reimplement their own structural tracer** (`sagas`, `triggers`) instead of consuming
   `telemetry/src/instrumentation`; only `workers` consumes the shared facade directly. Convergence target.
3. **`triggers` has the most severe CORRECTNESS gap**: inbound webhook W3C context captured onto the event
   but never used to parent processing spans; rich core facade + metrics unwired.
4. **`streams` (F) and `ai` (F) have effectively no live telemetry** — streams no seam at all; ai a seam
   never invoked. Both need first instrumentation, not a revamp.
5. **`auth` and `services` are different dimensions** (redaction-grade audit; span enrichment) and should
   NOT be scored on span density alongside workers.
6. **Metrics coverage is INVERTED from span coverage**: `sagas`/`triggers` cores define meter instruments
   that `workers` lacks — but those spans/metrics are NOOP/unwired unless a composition root injects the
   tracer, whereas workers' spans are always live. A revamp that unifies on the shared facade should also
   lift the sagas/triggers METRIC instruments into the shared layer so workers gains metrics too.
