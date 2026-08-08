# Repo Audit — Observability + Aspire Integration

Baseline: `plan/fable5-remediation-roadmap` @ `fac9e339042c` (== `origin/main`), 2026-08-08.
Method: source reads + `grep` reference counting + GitHub issue state. No commands were run against a
live AppHost (planning-only run), so every runtime claim below is grounded in *code that would
execute* or in *checked-in E2E gate assertions*, not in an observed dashboard.

**Headline:** the telemetry primitive layer and the trigger→queue→worker trace chain are genuinely
strong and E2E-proven. The **saga leg is the hole**: 5 of 6 saga span factories — including
compensation — have **zero callers anywhere in the repo**. An agent cannot follow
`request → command → saga → compensation` in traces today, because the compensation span is never
created.

---

## 1. What exists and works

### 1.1 Telemetry package: ports/adapters split is real

`packages/telemetry/deno.json` publishes 13 entrypoints (`.`, `./config`, `./tracer`, `./context`,
`./attributes`, `./instrumentation`, `./registry`, `./orpc`, `./hono`, `./ai`, `./otel`, `./query`,
`./testing`). The port/adapter separation the README claims is actually implemented:

- Ports: `packages/telemetry/src/ports/` (`aspire-builder-port` analogue, `provider-options.ts`,
  `telemetry-query-port.ts`, `span-link-port.ts`).
- Two provider adapters: `src/adapters/otel/otel-deno.ts` (Deno built-in OTLP, zero SDK dep) and
  `src/adapters/otel/otel-sdk.ts` (opt-in JS SDK), selected by
  `src/adapters/otel/select-provider.ts`.
- `src/testing/` ships `InMemorySpanRecorder` — the README's "testable by construction" claim is
  backed by a real export (`./testing` → `src/testing/mod.ts`).

**Verdict: docs claim verified.** `packages/telemetry/README.md:48-58` describes this architecture
and the code matches.

### 1.2 W3C context propagation is implemented at every boundary shape

`packages/telemetry/src/context/` covers three distinct propagation carriers, which is more than
most frameworks ship:

| Carrier | File | Function |
| --- | --- | --- |
| HTTP/message headers | `context/message.ts` | `createMessageHeaders()`, `resolveParentContextFromHeaders()` |
| Subprocess env | `context/payload-context.ts` | `createJobTraceEnv()` → `JOB_TRACE_CONTEXT`/`TRACEPARENT`/`TRACESTATE`; `extractJobTraceContext()` reads them back |
| Ambient async context | `context/helpers.ts` | `withContext`, `withContextAsync`, `contextWithSpan`, `getTraceId`, `getSpanId` |

`context/message.ts:20-38` handles a real-world defect class: it lowercases header keys and splits
comma-joined `traceparent`/`tracestate` values (`value.split(',')[0]`) before extraction — that is the
duplicated-header case proxies produce. This is defensive work that only appears after someone hit it.

`context/helpers.ts:4-31` `assertOtelSpan` validates all 11 OTel span methods before accepting a span
into context — fails loudly rather than producing a silently-broken trace.

### 1.3 Fan-in span links (producer→consumer many-to-one) are real

`packages/telemetry/src/application/fan-in-links.ts:26-52` `createFanInLinks()` converts upstream
message `traceparent`/`tracestate` into `Link[]` with `isRemote: true`, skipping invalid/missing
values rather than fabricating a parent. This is the correct modelling for a stream consumer batching
N producers — re-parenting would be wrong. Attribute preservation is delegated to `SpanLinkPort` so
the Deno-native provider can honestly report dropped attributes rather than silently losing them.

### 1.4 The Flow-B causal chain IS proven end-to-end — for the non-saga path

`packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces.ts` is a real, checked
(non-string) module that queries the **live Aspire dashboard** telemetry API and asserts a causal
chain, retrying 30× at 2s intervals. What it actually proves (lines 33-115):

- **TC-1/TC-2** — `trigger.ingress|trigger.detect`, `queue.enqueue`, `queue.dequeue`, `job.execute`
  all share **one trace id** (line 35-43).
- **TC-9 parent edges** — `dequeue.parentSpanId === enqueue.spanId` (line 61); dispatch→`job.execute`
  ancestry "survives the queue boundary" (lines 62-66); `job.execute` → `flow-b.callback` (67-72);
  callback → `rpc.client` (73-78).
- **TC-9** — `trigger.ingress.traceId === trigger.process.traceId`, i.e. "trigger ingress never starts
  a fresh trace" (lines 79-85).
- **TC-14** — a real `stream.subscribe` span carries `links.length > 0` and at least one link
  preserves per-message attributes (lines 87-95).
- **TC-6/TC-7** — all seven boundary spans carry `netscript.correlation.id`, and
  `new Set(...).size === 1` — i.e. **the same correlation id across the whole flow** (lines 97-110) —
  plus each carries a `netscript.*` outcome/status attribute (112-118).

This is a genuinely high bar. It is registered as `GATE.BEHAVIOR_OTEL_TRACES` in
`packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts:45-58`, fed by a real webhook POST
(`BEHAVIOR_OTEL_WEBHOOK`, lines 12-32) and a real stream consumer
(`BEHAVIOR_OTEL_STREAM_CONSUMER`, lines 33-44).

**This answers half the audit question: `request → trigger → queue → worker → rpc callback` is
followable, and it is regression-gated.**

### 1.5 Plugin cores are individually instrumented

All four plugin cores ship a `src/telemetry/` directory with `instrumentation.ts` + `attributes.ts`:
`plugin-sagas-core`, `plugin-streams-core`, `plugin-workers-core`, `plugin-triggers-core` (plus
`plugin-auth-core/src/telemetry/instrumentation.ts`). `packages/telemetry/src/instrumentation/`
covers `queue.ts`, `worker.ts`, `scheduler.ts`.

`packages/telemetry/src/domain/telemetry-convention.ts:52` defines
`CORRELATION_ID: 'netscript.correlation.id'` as a single convention, and it is applied in
`attributes/helpers.ts` at 5 call sites (lines 56, 120, 159, 213, 260), `attributes/trigger.ts:46`,
`instrumentation/worker.ts:317`, and `plugin-streams-core/src/telemetry/instrumentation.ts:176`.

### 1.6 TypeScript AppHost composition surface

`packages/aspire` exposes 9 entrypoints. The composition model is a clean port:
`src/ports/aspire-builder-port.ts` declares 12 methods (`addDenoService`, `addDenoBackground`,
`addContainer`, `addPostgresDatabase`/`addMysqlDatabase`/`addMssqlDatabase`,
`addRedisCache`/`addGarnetCache`, `reference`, `waitFor`). `MemoryAspireBuilder`
(`src/testing/memory-aspire-builder.ts`) implements it so AppHost composition is unit-testable without
Aspire — that is the right seam.

Scaffold generation lives in `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts` (268
lines) which emits `aspire/` as an **isolated Node package graph** (`package.json` with `tsx` +
`vscode-jsonrpc`, `tsconfig.apphost.json`) kept out of the Deno workspace root — a deliberate and
correct isolation, documented in-line at lines 51-53.

Note the load-bearing comment at `render-ts-apphost.ts:36-40`: the DB engine must be passed into
`generateTsAspireConfig` or `aspire restore` produces an SDK module lacking `builder.addPostgres`,
and the generated `register-infrastructure.ts` throws "is not a function" at start. That is hard-won
knowledge captured in the right place.

### 1.7 OTEL env wiring is mode-aware

`packages/aspire/src/application/resolve-env-vars.ts:54-84` `buildOtelEnvVars(serviceName,
serviceVersion, mode, otlpEndpoint)` distinguishes `denoApp` (3 vars — SDK's `WithDenoDefaults()`
sets the other 7) from `denoTask`/`executable` (all 10 vars). This asymmetry is real Aspire behaviour
and getting it wrong produces silently-unexported telemetry. It is used by all four generators:
`generate-register-services.ts:96`, `generate-register-apps.ts:93`,
`generate-register-background.ts:113`, `generate-register-plugins.ts:128`.

Generated services also get `withOtlpExporter({ protocol: OtlpProtocol.HttpProtobuf })`
(`generate-register-services.ts:101-103`), which is what binds the resource to the dashboard's
actual dynamically-allocated collector.

Telemetry can be explicitly disabled per-resource: `generate-register-background.ts:124-125` emits
`OTEL_DENO=false` + `OTEL_TRACES_SAMPLER=always_off` for benchmark-class resources.

### 1.8 App-level health checks DO exist

Contrary to a naive reading of #1280, **application** resources are health-probed.
`generate-register-services.ts:83-90` emits `withHttpHealthCheck({ path, endpointName })` with the
comment *"a listening socket alone is not 'healthy'"*, defaulting to `RESOURCE_DEFAULTS`' `/health`
and opt-out-able via `HealthCheckPath: false` (`packages/aspire/config.ts`, three resource schemas
accept `z.union([z.string().min(1), z.literal(false)]).optional()`). Same in
`generate-register-background.ts` and `generate-register-plugins.ts`. Scaffolded apps and services
genuinely serve the route (`packages/cli/src/kernel/assets/app/routes/health.tsx.template`,
`assets/service/routers/health.ts.template`).

### 1.9 Agent-facing read model exists

`packages/telemetry/src/ports/telemetry-query-port.ts` defines `TelemetryQueryPort` including
`exportTraces(filter?) → TelemetryOtlpJson` (lines 66-71). `packages/mcp` consumes it via
`src/infrastructure/telemetry-query-adapter.ts`, which even handles ASP.NET dev-cert trust for
loopback HTTPS (lines 14-40) — a real papercut solved. MCP exposes `list_runs`, `get_run`,
`get_recent_errors`, `get_last_job_result`, `analyze_service_performance`
(`packages/mcp/src/domain/tool-types.ts:6-10`), plus flows in
`packages/mcp/src/application/flows/` (17 files, incl. `telemetry-doctor-family.ts`).

---

## 2. Gaps

### GAP-1 — Saga cascade + compensation spans have ZERO callers *(runtime correctness)*

**Severity: highest in this domain. Directly answers the audit's causal-proof question with "no".**

`packages/plugin-sagas-core/src/telemetry/instrumentation.ts` defines six span factories:

| Factory | Span name | Production callers |
| --- | --- | --- |
| `startHandleSpan` (:182) | `saga.handle` | **1** — `src/runtime/saga-engine.ts:274` |
| `startCascadeSendSpan` (:192) | `saga.cascade.send` | **0** |
| `startCascadeScheduleSpan` (:206) | `saga.cascade.schedule` | **0** |
| `startCascadeSpawnSpan` (:217) | `saga.cascade.spawn` | **0** |
| `startCascadeCompensateSpan` (:228) | `saga.cascade.compensate` | **0** |
| `startCascadeCompleteSpan` (:239) | `saga.cascade.complete` | **0** |

Verified by repo-wide reference count: `grep -rn "startCascade" --include=*.ts --include=*.tsx
--include=*.md .` returns **no hits outside the defining file** — not even a test. Independently,
`grep -rn "SagaSpanNames"` outside `src/telemetry/` returns only
`tests/telemetry/saga-engine-spans_test.ts` and `tests/telemetry/instrumentation_test.ts`, and every
assertion in both is `SagaSpanNames.HANDLE` (`saga-engine-spans_test.ts:48,107,147`;
`instrumentation_test.ts:46`).

So **5 of 6 saga span names are dead code**. `saga.cascade.compensate` — the single span an operator
or agent most needs when a distributed transaction unwinds — is defined, typed, attributed
(`SagaAttributes.COMPENSATION_REASON`, `COMPENSATION_CASCADE_SIZE`), and never emitted.

Corroborating: `packages/plugin-sagas-core/src/runtime/saga-compensator.ts` contains **no
instrumentation dependency at all** — the class takes only `{ clock }`
(`SagaCompensatorOptions`, :36-39). It propagates `traceparent` into the handler context
(`:80`) but opens no span, so compensation executes inside the parent's context invisibly.

Note this is *not* a "telemetry is unwired" problem — `plugins/sagas/src/runtime/saga-supervisor.ts:199-206`
`withDefaultTelemetry()` correctly defaults `instrumentation` to `createSagaTelemetry()`
(`plugin-sagas-core/src/telemetry/otel-saga-telemetry.ts:66`), and that flows through
`createSagaRuntime` → `createNativeBus` → `createSagaEngine`
(`create-saga-runtime.ts:93,102`). The tracer is live; the call sites simply were never written.

**Impact:** an agent debugging a failed checkout saga sees `saga.handle` spans and then nothing. The
compensation cascade — which steps unwound, why, how many — is unobservable. It must be reconstructed
from logs, which is exactly the "expensive way" #1197 measured agents falling back to.

### GAP-2 — Saga spans are not joined to the Flow-B correlation id *(API/type-system seam)*

`packages/plugin-sagas-core/src/telemetry/attributes.ts` defines `SAGA_CORRELATION_KEY:
'netscript.saga.correlation_key'` (:28, :52) — a *saga-domain* key (the business correlation, e.g.
order id). It does **not** define `netscript.correlation.id`, the cross-seam convention from
`packages/telemetry/src/domain/telemetry-convention.ts:52` that streams
(`plugin-streams-core/src/telemetry/attributes.ts:40`), workers
(`telemetry/src/instrumentation/worker.ts:317`), and triggers (`attributes/trigger.ts:46`) all emit.

Two different concepts share one word, and the saga plane is missing the one the E2E gate asserts on.
Consequence: even the emitted `saga.handle` span would **fail** the `TC-6/TC-7` correlation assertion
in `validate-flow-b-traces.ts:97-110` if it were added to the `correlatedSpans` list. The saga plane is
trace-joined (via `traceparent` parent, see below) but not correlation-joined.

### GAP-3 — No E2E gate asserts any saga span *(docs/discovery + test-coverage)*

`validate-flow-b-traces.ts` asserts on `trigger.*`, `queue.*`, `job.execute`, `flow-b.callback`,
`rpc.client`, `stream.subscribe`. **No `saga.*` span appears anywhere in the validator.** The saga
E2E gates in `packages/cli/e2e/src/domain/cli-surface.ts:131-133` are
`BEHAVIOR_SAGAS_HEALTH`, `BEHAVIOR_SAGAS_LIST`, `BEHAVIOR_SAGAS_INSTANCES` — CRUD/liveness probes,
not trace assertions.

So GAP-1 is invisible to CI: the entire saga observability surface could be deleted and every gate
would stay green. This is the structural reason GAP-1 survived to 0.0.5.

### GAP-4 — Docs overclaim the saga trace journey *(docs/discovery failure)*

Two specific claims fail verification:

1. `docs/site/observability/telemetry.md:31-32` — diagram alt-text + caption: *"A W3C traceparent
   header propagates from a service request through the worker runtime into a subprocess and across a
   saga boundary, keeping every span under one trace id... service → worker → subprocess → saga, so
   spans from every runtime join one distributed trace in Aspire."*
   **Partially true.** The *trace-id join* is real — `saga-engine.ts:257-271` passes
   `parent: { traceparent: message.traceparent, tracestate }` plus a `links[]` entry, and transport
   carries it (`saga-bus-bridge.ts:252`, `middleware/saga-middleware.ts:60-93`,
   `integration/workers/trigger-job.ts:30`, `trigger-task.ts:30`). But the diagram implies a
   navigable saga *sub-tree*; in practice exactly one span (`saga.handle`) lands there, with no
   cascade or compensation children.
2. `docs/site/observability/telemetry.md:82` — *"the worker, scheduler, queue, saga, and SSE runtimes
   are instrumented for you."* Defensible for `saga.handle`, misleading given GAP-1.

Additionally, `packages/plugin-sagas-core/README.md` contains **no mention of telemetry, tracing,
spans, or observability** (grep for `telemetr|trace|span|observab` → zero hits). The package that
owns 6 span names documents none of them. `docs/site/durable-workflows/sagas.md` covers `.compensate()`
thoroughly as a *programming* model (lines 143-166, 203, 250) and says nothing about what it emits.

`getSagaTracer` (advertised `docs/site/observability/telemetry.md:254`) **does exist** —
`packages/telemetry/src/application/tracer.ts:103`. That claim verifies.

### GAP-5 — Backing-service health checks: blocked upstream, correctly *(product-expectation outside framework scope — validated)*

Issue **#1280** (`state: OPEN`, `status:blocked`, `area:aspire`+`area:database`, `priority:p2`,
milestone **0.0.6**) is split from #1251 and carries a genuinely rigorous two-part proof:

1. Aspire's own docs state TypeScript AppHost support for `builder.Services.AddHealthChecks()` is
   *"not yet available"*; the C# `AddCheck` + `WithHealthCheck` path has no TS equivalent.
2. `withHttpHealthCheck('/health')` exists in TS but Deno KV Connect 0.11.0 serves only authenticated
   POST `/`, `/snapshot_read`, `/atomic_write`, `/watch` — no health route. A generated `/health`
   probe would *"report green while checking nothing"*.

The run artifacts confirm a prototype was built and deliberately discarded:
`.llm/runs/fix-aspire-backing-resources-1251--1251/drift.md:3-15` — *"A generated `/health` probe was
tested at the source-generator level and rejected because it would never succeed against the
production image... implementation stopped rather than shipping a unit-test-only health claim."*

**This is correct engineering and should not be re-litigated by the roadmap.** The remediation action
is to *watch the two named unblock conditions*, not to schedule work. Flag only if a roadmap wave
proposes "add health checks to backing services" without noting the block.

Caveat worth carrying: `docs/site/observability/telemetry.md:384` claims *"Health probes drive the
status colour"* for a resource list that includes `postgres, redis` — for those two backing
resources, no NetScript-authored probe exists (Aspire's own built-in container checks may apply, but
that is Aspire's, not NetScript's). Minor overclaim.

### GAP-6 — ~200 lines of dead stringified validator in the E2E gate module *(scaffold/generation debt)*

`otel-gates.ts:80-84` exports `VALIDATE_TRACES_SCRIPT = resolveValidateTracesScript()`, commented
*"Retained temporarily as a compatibility export for downstream gate builders while the real Flow-B
validator moves to a checked module."* Repo-wide `grep -rn "VALIDATE_TRACES_SCRIPT" packages/`
returns **only its own definition line** — zero consumers. It is ~200 lines of TypeScript encoded as a
`string[]` join, therefore type-unchecked, lint-invisible, and untestable.

**This is not merely dead code — a capability was lost in the migration.** The dead string contains
`validateOtlpExporterEndpoint()` (lines ~114-136 of the string), which parses the dashboard's
`OTLP/HTTP: <url>` from the AppHost log, runs `aspire describe --format Json`, collects every
resource's `OTEL_EXPORTER_OTLP_ENDPOINT`, and **fails on mismatch** with
`"OTLP exporter mismatch: dashboard X, resources Y"`. The live `validate-flow-b-traces.ts` has **no
such check**.

That matters because `buildOtelEnvVars` hardcodes `OTEL_DEFAULTS.ENDPOINT = 'http://localhost:4318'`
(`packages/aspire/constants.ts:45`) while the dashboard allocates its collector port dynamically
under `aspire start --isolated`. Today the mismatch is masked by the later
`withOtlpExporter({ protocol: HttpProtobuf })` call overriding the env var — but nothing asserts that
ordering holds. If a generator refactor ever emits `withOtlpExporter` before the env loop, telemetry
silently exports to a dead port and the *only* symptom is the Flow-B gate timing out after 30 retries
with `"no traces returned"` — a 60-second-to-fail, hours-to-diagnose failure. The endpoint-equality
assertion that would name the cause instantly exists, and is unreachable.

### GAP-7 — Correlation-id propagation into subprocesses is convention-only *(API/type-system seam)*

`packages/telemetry/src/domain/telemetry-convention.ts:97` documents *"Subprocess propagation uses
TRACEPARENT, TRACESTATE, and CORRELATION_ID env keys."* But `createJobTraceEnv()`
(`context/payload-context.ts:11-28`) emits only `JOB_TRACE_CONTEXT`, `TRACEPARENT`, `TRACESTATE` — it
does **not** emit `CORRELATION_ID`. The only writer is
`plugin-workers-core/src/executor/adapters/dax-process-runner.ts:96`, which sets it ad hoc from
`input.options.correlationId`. The symmetric reader `extractJobTraceContext()` reads
`JOB_TRACE_CONTEXT`/`TRACEPARENT`/`TRACESTATE` and never `CORRELATION_ID`.

So the correlation id crosses the subprocess boundary only when a caller happens to route through the
dax runner. A second process runner would drop it silently, and the convention doc would still say it
works.

### GAP-8 — Agent discovery of the observability surface measurably fails *(docs/discovery failure)*

Issue **#1197** (`0.0.5`) measured a full 452-tool-call agent run on published 0.0.4:
MCP server **0** calls, `netscript plugin doctor` **0**, `aspire otel logs|spans|traces` **0**, all
five installed skills **0**, `.llm/tools/*` **0** — against **340 bash (75%)**, **35 hand-rolled
`curl` probes**, 37 `aspire logs`, 125 `grep`/`rg`. The agent recorded five drift entries including
three framework defects "having run neither command", and one defect cost it 75 minutes.

The issue notes this is the **sixth consecutive agent with the same result**, and that wave three's
zero-MCP measurement is what motivated #1023/#1024 — whose shipped fix changed the number by zero.

The surface itself is not missing: `aspire otel logs|spans|traces` is documented in
`.agents/skills/aspire/SKILL.md:24` and `.agents/generated/consumer-skills/.claude/skills/help.md:26,70-72`
("`aspire otel traces <resource>` — follow the request across resources"). **The gap is purely
discovery/adoption, and two remediation rounds have already failed to move it** — the roadmap should
treat "document it harder" as a disproven hypothesis and consider forcing-function designs instead
(e.g. failure messages that print the exact `aspire otel` command, or a doctor receipt the drift gate
already requires per #1197's own description).

---

## 3. Causal runtime proof: what an agent can actually extract today

| Hop | Provable? | Evidence |
| --- | --- | --- |
| HTTP request → `trigger.ingress`/`trigger.detect` | **Yes** | same-trace assert, `validate-flow-b-traces.ts:79-85` |
| trigger → `queue.enqueue` | **Yes** | :35-43 |
| `queue.enqueue` → `queue.dequeue` (cross-service, cross-process) | **Yes**, exact parent edge | :61 |
| dispatch → `job.execute` (across queue boundary) | **Yes**, ancestry-tolerant | :62-66 |
| `job.execute` → `flow-b.callback` → `rpc.client` | **Yes** | :67-78 |
| producer → `stream.subscribe` fan-in, attrs preserved | **Yes**, via links | :87-95 |
| one correlation id across all of the above | **Yes** | :97-110 |
| **command → saga (`saga.handle`)** | **Trace-joined but unasserted** | `saga-engine.ts:257-274` sets parent+link; no gate checks it |
| **saga → cascade (`send`/`schedule`/`spawn`)** | **No** | GAP-1: zero callers |
| **saga → compensation** | **No** | GAP-1: `startCascadeCompensateSpan` never called; `SagaCompensator` has no instrumentation |
| **compensation cascade size / reason / unwound steps** | **No** | attributes defined, never emitted |

**Answer to the audit question:** an agent can follow `request → command → worker → callback` in
traces, with strong CI protection. It **cannot** follow `→ saga → compensation`. The remediation is
narrow and high-leverage: wire the five existing cascade span factories to their call sites, add
`netscript.correlation.id` to the saga attribute set, and extend `validate-flow-b-traces.ts` to
assert a compensation edge. The primitives are already built — only the call sites and one assertion
are missing.

Secondary runtime note: `saga-compensator.ts:105` raises *"Nested cascaded compensation is deferred to
phase 7d."* — nested compensation is unimplemented, so even once spans are wired, a nested unwind will
throw rather than trace. Worth confirming against the sagas domain audit before scheduling GAP-1, since
the two interact.

---

## 4. Cross-references for the roadmap

- **#1280** (0.0.6, blocked) — backing-service health checks. Proof is sound; do not re-scope. Watch:
  Aspire TS AppHost custom health-check registration, or Deno KV Connect health route.
- **#1197** (0.0.5) — agent surface zero-adoption. Two failed remediation rounds; needs a different
  hypothesis, not more docs.
- **#1325** (0.0.5) — generated background runtime omits Redis adapter, crash-loops on default Aspire
  cache. Adjacent to §1.7 generator wiring.
- **#1202** (0.0.5) — users service Prisma binds stale Postgres endpoint, DB health check fails on
  clean scaffold. Directly adjacent to §1.8.
- **#863** (0.0.2) — `netscript db init` blocks indefinitely on Unhealthy-but-Running Postgres. Same
  health-semantics family as #1280.
- **#1255** (Backlog) — `page.layer.delivery` span attribute reports `'blocking'` for deferring
  regions. Existing precedent for "span attribute lies" class of defect.
- **#413 / #418 / #557** (0.0.13, dashboard) — `TelemetryQueryPort` + aspire-otlp-http adapter, S13
  Live Flow "request journey across framework seams", seam-event flow plane. **#418 depends on GAP-1
  being fixed** — a Live Flow view cannot render a saga compensation leg that emits no spans.
- **#295 / #319 / #320** (Backlog) — Aspire Deno hosting layers A/B tracking.

## 5. Suggested remediation shape (not scheduled here)

1. **GAP-1** — wire `startCascadeSendSpan`/`ScheduleSpan`/`SpawnSpan`/`CompensateSpan`/`CompleteSpan`
   into `saga-bus-bridge.ts` cascade dispatch and inject `SagaInstrumentation` into
   `SagaCompensator`. Highest value-to-effort in this domain: the code exists, only call sites are
   missing. Unblocks #418.
2. **GAP-2** — add `CORRELATION_ID: 'netscript.correlation.id'` to `plugin-sagas-core` saga
   attributes alongside the existing domain-level `SAGA_CORRELATION_KEY`.
3. **GAP-3** — extend `validate-flow-b-traces.ts` with a saga leg (`saga.handle` →
   `saga.cascade.compensate` parent edge + shared correlation id). Without this, 1 and 2 regress.
4. **GAP-6** — delete `VALIDATE_TRACES_SCRIPT`; port `validateOtlpExporterEndpoint()` into the
   checked module first so the endpoint-mismatch assertion is regained rather than lost.
5. **GAP-4** — soften the `telemetry.md:31-32` saga-journey caption to match emitted reality, or land
   1-3 first and let the docs become true. Add a telemetry section to
   `packages/plugin-sagas-core/README.md`.
6. **GAP-7** — emit `CORRELATION_ID` from `createJobTraceEnv()` and read it in
   `extractJobTraceContext()`, so the convention doc at `telemetry-convention.ts:97` is honest.
