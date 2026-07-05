# eis-chat's REAL cross-component pipeline — exhaustive map with process/language boundaries

Direct read-only investigation against `.llm/tmp/eis-chat-ref`. Every claim below is evidenced by a specific
file; nothing here is inferred from `docs/PRODUCT.md`/`ARCHITECTURE.md` narrative alone (that narrative was
independently checked against code and found to drift — see "Aspirational vs. implemented" section below).

**Owner correction on record**: the literal "button→python→trigger→saga→services" example from the spec was
retracted by the owner (2026-07-04) as "a stupid example." This document does not treat it as real; it derives
the flow bottom-up from what actually runs today, and separately identifies which hops are genuinely
cross-process / cross-language.

## 1. Process inventory (Aspire-registered, confirmed via `.helpers/register-*.mts`)

Every one of these is a **separate OS process** under `aspire start`, confirmed via `register-services.mts` /
`register-background.mts`:

| Resource | Kind | Entrypoint | OTEL wired? |
|---|---|---|---|
| `eischat` | Service (`addExecutable`) | `services/eischat/src/main.ts` | Yes — full executable OTEL env set (`buildOtelEnvVars`) |
| `workers` | Background processor | `workers/runtime.ts` | Yes — full executable OTEL env set |
| `legacy-archeo-mcp` | Service (MCP, Streamable HTTP) | `tools/legacy-archeo-mcp.ts` | Yes — full executable OTEL env set + registered as an Aspire MCP resource (`withMcpServer({ path: '/mcp' })`) |
| `excalidraw-mcp` | Service (MCP, Streamable HTTP) | `tools/excalidraw-mcp.ts` | Yes — same pattern |
| `streams` | Plugin resource | (plugin-provided) | Referenced by `workers` for `DurableStreamProducer` — endpoint wired but plugin internals not read this pass |
| `workers-api` | Plugin resource | (plugin-provided) | Referenced for job enqueue routing |
| `dashboard` (apps/dashboard) | App | Fresh 2.3 BFF | Yes — `@netscript/telemetry` used directly (see §3) |

All OTEL env sets come from `buildOtelEnvVars(name, config.Version, 'executable', config.Otel.HttpEndpoint)` in
`_aspire-compat.mjs` — i.e. **every one of these processes is already wired to emit to the Aspire OTLP
endpoint at the infra level**, regardless of whether the application code inside actually creates spans.
Emission wiring existing at the process-registration layer is a distinct fact from "this process's code
actually produces meaningful spans" — see §4 for the gap between the two.

## 2. Confirmed real cross-process hops (evidenced, not narrated)

### 2a. Dashboard chat turn (browser → BFF → GenAI → MCP tool → subprocess)

1. **Browser → dashboard BFF**: Fresh 2.3 injects `<meta traceparent>` client-side; the client POST forwards
   it. `apps/dashboard/lib/otel.ts::parentFromRequest(req)` reads the incoming `traceparent` header and resumes
   the W3C trace so the server `chat.turn` span nests under the client's `chat.send` span
   (`resolveParentContextFromHeaders` from `@netscript/telemetry/context`). **This is real, wired, working
   code today** — not aspirational.
2. **dashboard BFF → TanStack AI agent loop**: `chatOtelMiddleware` (`@tanstack/ai/middlewares/otel`) emits
   native GenAI-semconv spans: a `chat <model>` root, one `chat <model> #N` per agent-loop iteration
   (`gen_ai.usage.*`, `finish_reasons`), an `execute_tool <name>` span per tool call
   (`gen_ai.tool.name`+outcome). Uses `@opentelemetry/api`'s own `trace.getTracer` (not the NetScript-typed
   facade) specifically so the middleware's `Tracer` type matches its peer dep — both resolve to the same
   global provider Deno registers, so spans still stitch. `captureContent` stays `false` (no prompt/PII on
   spans).
3. **Tool call → legacy-archeo-mcp (real cross-process hop)**: `legacy_archeo_lookup` / `show_flow_widget` /
   `diagnose_flow` tools are served by `tools/legacy-archeo-mcp.ts`, which now runs as its **own Aspire
   executable resource over Streamable HTTP** (`MCP_TRANSPORT=http`, port default 8095, `#60` migration away
   from a stdio child). A dashboard→MCP-server tool call is therefore a real inter-process HTTP request. Deno
   auto-instruments outbound `fetch` for W3C propagation (confirmed in the OTel/Deno research pass), so **if**
   the MCP client transport is a `fetch`-based HTTP client, trace context should propagate through this hop for
   free — this was **not independently verified against the MCP SDK's HTTP transport implementation** in this
   pass (flag as an open question, not a confirmed fact).
4. **legacy-archeo-mcp → duckdb.exe (the one genuine non-Deno/TS process boundary in the real codebase)**:
   `legacy-archeo-mcp.ts`'s `query()` function spawns `new Deno.Command(DUCKDB, { args: [dbPath, '-readonly',
   '-json', '-c', sql], stdout: 'piped', stderr: 'piped' })` and parses the JSON stdout. **This subprocess call
   has zero telemetry instrumentation today** — no span wraps it, no `TRACEPARENT` env var is set on the
   child, no attributes are recorded (query text, duration, row count, exit code). This is the single most
   concrete "real code today, genuinely crosses a process AND a language/runtime boundary (Deno/TS →
   compiled C++ DuckDB CLI binary), and is currently dark" finding in the entire investigation.

### 2b. KB ingestion (upload → async worker → single-writer callback → live status)

1. **eischat (service) enqueues a job**: `services/eischat/src/jobs.ts::enqueueJob()` resolves `workers-api`'s
   URL via Aspire service discovery, then does a **raw `fetch()`** (not the typed oRPC client) to
   `/api/v1/workers/jobs/{jobId}/trigger` — documented workaround for issue #73 (workers-API plugin doesn't
   mount routes on the oRPC RPC handler, only OpenAPI, so the typed `@netscript/sdk` RPC client would 404).
   This is a real cross-process HTTP hop; whether it carries a `traceparent` header explicitly (vs. relying on
   Deno's auto-fetch-instrumentation) was **not verified** this pass.
2. **workers-api → workers runtime**: separate OS process (`workers/runtime.ts`, `startCombinedProcess()`),
   registered with full OTEL executable env vars. Consumes the queue via a shared Garnet/Redis KV backend
   (hand-edited fix for #371 — split-brain KV otherwise strands jobs `pending` because `workers-api` and
   `workers` would each get their own per-process Deno KV instance).
3. **workers → eischat callback (single-writer architecture)**: `embed-document.ts` / `transcribe-image.ts` are
   `defineJobHandler`-based, **compute-only** — they never open the channel tursodb (native driver holds an
   exclusive OS file lock; a second process opening the same file collides, os error 33). Instead they call
   `channelClient.writeKnowledgeChunks(...)` / `channelClient.readKnowledgeImage(...)` —
   `services/eischat/src/channel-client.ts` is a **typed oRPC RPC client** (`createServiceClient` against
   `ChannelContractV1`, `serviceName: 'eischat'`) resolved via Aspire service discovery
   (`services__eischat__http__0`, wired hand-edited in `register-background.mts`). This is the RPC-transport
   path (not the OpenAPI workaround), since eischat's own oRPC handler is reachable directly. Another real
   cross-process hop, and — because it's oRPC — a plausible integration point for the `@netscript/telemetry`
   oRPC tracing plugin (not confirmed instrumented in this pass; deferred to the telemetry-package-surface
   inventory).
4. **workers → streams (progress/status fan-out)**: hand-edited wiring
   (`services__streams__http__0`) so the workers plugin's `DurableStreamProducer` can publish job-execution
   events to `/workers/executions` — was previously silently dropping every event
   ("Durable streams URL not found") before this endpoint was exposed. This is a **messaging-shaped** hop
   (producer publishes; the durable-streams primitive is consumed live by some subscriber) — a natural fit for
   OTel's link-based (not parent-child) messaging-span model researched separately (see
   `research/B-telemetry/otel-semconv-w3c-state-of-art.md` §3), **if** streams is actually wired into a real UI
   consumer — see §3 caveat below, this is NOT yet confirmed.

### 2c. Embeddings/vision → external SaaS (real, but not an internal cross-language hop)

- `services/eischat/src/vision.ts::transcribeImage()` calls OpenAI's chat-completions HTTP API directly
  (`gpt-4o-mini`, vision) via raw `fetch()`.
- `services/eischat/src/embeddings.ts::embed()` calls a configurable OpenAI-compatible `/v1/embeddings`
  endpoint (default OpenAI, swappable to OpenRouter or any compatible host via env vars) via raw `fetch()`.
- **Correction to an earlier working hypothesis in this investigation**: there is **no Python subprocess and
  no local ML runtime** anywhere in eis-chat's real vision/embedding pipeline — both are pure Deno/TS → external
  SaaS HTTP calls. The only genuine non-Deno/TS **process** boundary in the whole codebase is the DuckDB CLI
  subprocess in §2a-4. This directly informs (without deciding) the showcase-flow candidates in the summary
  message: a "cross-language hop" framed as calling out to Python does not exist in the real code; a
  "cross-process, cross-runtime hop" framed around the DuckDB CLI subprocess does exist and is currently dark.

## 3. Aspirational vs. implemented — drift flagged for the supervisor

- `docs/INDEX.md` **explicitly states SigNoz MCP integration is "not provisioned yet."** No SigNoz client code,
  docker-compose service, or MCP server implementation was found anywhere in the repo — only doc mentions. The
  "static archaeology ⋈ live telemetry" join described in `docs/PRODUCT.md`/`ARCHITECTURE.md` is, as far as this
  pass can find, **narrative/aspirational today, not implemented**. The `legacy_archeo_lookup`/`search` tools
  ARE real and DO query a live DuckDB estate graph — but there is no live-telemetry-side MCP tool to join
  against yet.
- `docs/ARCHITECTURE.md`'s component map (e.g. "handlers/", "plugins/mcp-client") does **not** match the
  current repo structure (`services/eischat`, `streams/`, `workers/`, `tools/*-mcp.ts`) — the docs have drifted
  from the implementation. Any showcase flow the supervisor picks should be verified against current code
  (as this document does), not against `ARCHITECTURE.md`'s prose.
- `streams/notifications-stream.ts` and `streams/mod.ts` are **generic, unmodified scaffold boilerplate**
  shipped by `@netscript/plugin-streams`'s `plugin add streams` scaffolder — not eis-chat-specific business
  logic. Combined with the fact that `workers → streams` wiring exists at the Aspire registration layer (§2b-4),
  this suggests the durable-streams live-query component is **plumbed but not yet consumed by any real UI
  flow** — worth independent confirmation before treating "live job-progress stream" as an existing showcase
  candidate rather than a near-term one.
- `services/eischat/src/router.ts` (the oRPC router aggregation point) shows **no telemetry code at the
  aggregation layer itself** — instrumentation, if any, would need to live inside the individual routers or a
  cross-cutting oRPC middleware (the `@netscript/telemetry` oRPC tracing plugin is exactly this kind of seam;
  whether eischat's router actually wires it was not confirmed this pass — deferred to the
  telemetry-package-surface inventory).
- `services/eischat/src/routers/v1.ts` is explicitly a **seeded scaffold fixture** (`EISCHAT_SEEDED_V1=1` gate,
  in-memory records, comment literally says "Reserved for the later rollout step that wires end-to-end
  tracing") — confirms end-to-end tracing for this particular router was, as of this file's authorship, still
  a forward-looking TODO rather than done.

## 4. The core showcase-flow tension (data for the supervisor, not a verdict)

Two genuinely different "grouped E2E trace" stories exist in the real code today, with different costs:

**A. The chat/MCP/subprocess flow** (§2a): browser → dashboard BFF → GenAI middleware → MCP tool call (HTTP,
cross-process) → DuckDB CLI subprocess (cross-process AND cross-language/runtime). Pro: touches a genuine
non-Deno/TS boundary, which is the closest real analogue to the retracted "python" example's *intent* (show a
trace surviving a language/runtime boundary). Con: the DuckDB hop is currently **completely uninstrumented** —
building this showcase requires *new* instrumentation work (wrap `Deno.Command` in a span, inject
`TRACEPARENT`/`TRACESTATE` env vars per the Beta env-carrier spec researched separately), not just wiring
together already-emitting pieces. Also unverified: whether the MCP HTTP transport itself propagates
`traceparent` automatically today.

**B. The KB-ingestion pipeline flow** (§2b): eischat enqueue → workers-api → workers (separate OS process,
already OTEL-wired at the executable level) → channelClient RPC callback to eischat (oRPC, a documented
`@netscript/telemetry` integration seam) → (optionally) streams fan-out. Pro: every hop already exists as a
real, working, multi-process production path (not a demo/prototype) with the KV split-brain and single-writer
bugs already fixed and documented — genuinely representative of "does telemetry survive our own worker/queue
architecture," which is squarely the framework's own value proposition. Con: it is same-language (Deno/TS)
across every hop, so it demonstrates cross-*process* propagation convincingly but not cross-*language*; and the
streams fan-out endpoint's real UI consumer is unconfirmed (§3).

Neither flow is picked here — that decision is explicitly delegated to the supervisor per the topic-B spec and
the D-decisions in `specs/01-ratified-decisions.md`. This document supplies the evidenced cost/benefit for each.

## 5. Sources (all read directly, read-only)

`apps/dashboard/lib/otel.ts`, `tools/legacy-archeo-mcp.ts`, `aspire/.helpers/{configure-dashboard,
register-background,register-services}.mts`, `workers/{runtime.ts,jobs/embed-document.ts,jobs/transcribe-image.ts}`,
`services/eischat/src/{jobs.ts,vision.ts,embeddings.ts,channel-client.ts,router.ts,routers/v1.ts}`,
`streams/{mod.ts,notifications-stream.ts}`, `docs/{PRODUCT.md,ARCHITECTURE.md,INDEX.md}`.
