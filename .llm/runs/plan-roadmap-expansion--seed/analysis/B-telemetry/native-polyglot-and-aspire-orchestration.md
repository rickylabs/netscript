# B2f — Native Polyglot Cross-Language Capability & Aspire Orchestration Surface

Direct reads (not delegated): `docs/site/capabilities/polyglot-tasks.md`,
`docs/site/tutorials/erp-sync/03-polyglot-transform.md`, `docs/site/explanation/aspire.md`,
`docs/site/explanation/observability.md`, `docs/site/capabilities/telemetry.md`,
`docs/site/how-to/add-opentelemetry.md`, plus `packages/telemetry/src/context/{payload-context,types}.ts`.

## 1. NetScript ALREADY has a real cross-language subprocess capability (Polyglot Tasks)

`@netscript/plugin-workers-core` ships `MultiRuntimeTaskExecutor` + a `defineTask` typestate builder.
Documented in `docs/site/capabilities/polyglot-tasks.md` (237 lines).

- **7 runtimes**: `deno, python, shell, powershell, dotnet, cmd, executable` (`TaskType` matrix).
- **I/O contract**: argv + env in; last-stdout-JSON-line out (`TaskResult`).
- **Permission model**: ONLY the `deno` runtime is Deno-sandboxed; the other six inherit full OS
  access (arch-debt `workers-non-deno-task-sandbox-boundary`). Named presets: `minimal, none, network,
  filesystem, readOnly, subprocess, full, allAccess`.
- **Trace propagation is REAL**: "The runtime merges `Deno.env`, the task's `env`, and the call's
  `options.env`, and injects `TRACEPARENT`, `TRACESTATE`, and `CORRELATION_ID` for trace propagation."
  Tutorial ch.03 confirms: "Tasks run through the same workers runtime as jobs and propagate W3C trace
  context (TRACEPARENT/TRACESTATE) into the subprocess, so a cross-runtime span still stitches together
  in the Aspire dashboard."

### Primary-evidence code (`packages/telemetry/src/context/payload-context.ts`)
`createJobTraceEnv(ctx)` → `{ JOB_TRACE_CONTEXT: JSON.stringify(traceContext), TRACEPARENT, TRACESTATE? }`.
`extractJobTraceContext()` reads `JOB_TRACE_CONTEXT` (JSON), falls back to `TRACEPARENT`+`TRACESTATE`
env. This proves subprocess trace-context propagation is shipped, not aspirational.

### The gap that limits it as a showcase
The env-var INJECTION into the subprocess is real, but the shipped Python example (`score.py` /
`transformProducts`) does NOT show the subprocess itself EXTRACTING the context and creating/continuing
a child span. So a Deno→Deno child span is demonstrated (`runTracedJob`), but a genuine
**Python-side child span that stitches into the parent trace** is not demonstrated end-to-end anywhere
in-repo. This is a candidate open question, not a proven capability. (See context/open-questions.md.)

## 2. Aspire is the telemetry INGESTION + display surface

From `docs/site/explanation/aspire.md`:
- AppHost is a **generated TypeScript/Node** program (`aspire/apphost.mts`), NOT C#. Legacy
  `netscript.config.ts` field `aspire:{appHost:'dotnet/AppHost'}` is cosmetic; on-disk apphost.mts is
  authoritative (`--legacy-aspire` opts into old C# shape).
- **Dashboard + OTLP ports are EPHEMERAL** (`localhost:0` in the generated `https` profile) —
  `:18888`/`:4318` are conventional defaults only. Trust the URL `aspire start` prints, or pin via
  `ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL`. `aspire start --isolated` gets its own free ports + secrets
  (parallel-safe; memory: aspire-isolated-parallel-ports).
- Each resource is launched with `OTEL_SERVICE_NAME` + `OTEL_EXPORTER_OTLP_ENDPOINT` (dashboard
  collector, `http/protobuf`), so **job dispatch, job execution, scheduler runs, and subprocess task
  continuation all emit real spans "with no extra wiring"** — trace context propagates into worker
  subprocesses over W3C `traceparent`.
- Native FFI DB drivers (libSQL/Turso) require the workers background processor to launch with
  `--allow-ffi`/`--allow-sys` (`WORKERS_BACKGROUND_PERMISSIONS`).
- **Aspire is explicitly local-dev-only**, not a production deployment/telemetry backend. `--no-aspire`
  is a first-class exit; in prod you point OTLP at your own managed backend. This bounds the beta.6
  dashboard: it consumes the LOCAL Aspire collector's telemetry API, not a hosted backend.

### Concrete in-repo endpoints/ports (from add-opentelemetry.md + aspire.md)
users `:3001`, workers-api `:8091`, sagas-api `:8092`, triggers-api `:8093`, auth-api `:8094`,
durable-streams `:4437`; dashboard `:18888`, OTLP collector `:4318`. Background processors: workers +
sagas from `bin/combined.ts`, triggers from `src/runtime/trigger-processor.ts`.

## 3. Framework-vs-scaffold telemetry boundary (from observability.md + telemetry.md)

- **Real framework spans**: oRPC request (enriched, not created — via `TracingPlugin`), job dispatch,
  job execute, scheduler tick/dispatch/lifecycle, queue enqueue/dequeue/ack/nack, SSE connection/event,
  subprocess task continuation.
- **No-op scaffold stubs**: `createJobTools(ctx)` handler helpers (`trace.addEvent`, `withChildSpan`,
  `progress`) — arch-debt `workers-scaffold-job-tools-noop`. For custom handler spans you must call
  `@netscript/telemetry` helpers directly.
- **Auth-audit telemetry facade** (`@netscript/plugin-auth-core/telemetry`): `createAuthTelemetry`,
  `traceOperation`, `hashSubject`/`redactAuthPrincipal` (HMAC-SHA-256 redaction), opt-in via
  `NETSCRIPT_AUTH_AUDIT_SALT`. A SOPHISTICATED, purpose-built facade — potentially rivals workers on a
  DIFFERENT axis (safety/redaction), even if span-density differs. (Fork B grades this — see B2b.)

## 4. In-repo candidate showcase flow already instrumented (baseline, single-process)
`add-opentelemetry.md` documents a webhook→trigger→job chain: POST an inbound webhook to triggers-api →
resolves an inbound trigger whose `enqueueJob` action enqueues the workers health-check job → produces
a connected dispatch+execution trace. Already instrumented, in-repo, low-risk — but single-language,
single-process. Listed as a baseline candidate in context/candidate-showcase-flows.md (NOT a verdict).
