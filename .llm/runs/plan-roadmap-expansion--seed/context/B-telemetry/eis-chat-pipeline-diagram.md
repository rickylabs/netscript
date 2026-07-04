# eis-chat real pipeline — process/hop diagrams

Companion to `analysis/B-telemetry/eis-chat-real-pipeline-map.md`. Two distinct real flows exist; neither is
picked as "the" showcase here (delegated to the supervisor).

## Flow A — chat / MCP tool call / DuckDB subprocess

```
Browser (Fresh client)
  │ <meta traceparent> injected by Fresh 2.3, forwarded on POST
  ▼
apps/dashboard BFF  (process: dashboard, Deno)
  │ parentFromRequest(req) resumes W3C trace  [apps/dashboard/lib/otel.ts]
  │ chatOtelMiddleware (TanStack AI) emits GenAI-semconv spans:
  │   chat <model> → chat <model> #N (per agent-loop pass) → execute_tool <name>
  ▼  tool call: legacy_archeo_lookup / show_flow_widget / diagnose_flow
legacy-archeo-mcp  (process: separate Aspire executable, Streamable HTTP, port ~8095)
  │ context propagation over this hop: UNVERIFIED (depends on MCP SDK's HTTP
  │ transport using fetch; Deno auto-instruments outbound fetch, but this pass
  │ did not confirm the MCP client uses fetch under the hood)
  ▼  Deno.Command(duckdb.exe, ['-readonly','-json','-c', sql])
duckdb.exe  (process: NOT Deno/TS — compiled C++ DuckDB CLI binary)
  │ ★ ZERO telemetry today: no span, no TRACEPARENT env var, no attributes
  ▼
JSON rows on stdout → parsed back in legacy-archeo-mcp.ts → MCP tool result
  → back through the chain to the chat UI
```

**The ★ hop is the one genuine non-Deno/TS process boundary that exists in eis-chat's real code today.** It is
currently dark. Instrumenting it would need: (1) a span wrapping the `Deno.Command` call with attributes
(query text/hash, duration, exit code, row count), (2) a `TRACEPARENT`/`TRACESTATE` env var injected into the
child process per the OTel Beta "env vars as context carriers" spec (see
`research/B-telemetry/otel-semconv-w3c-state-of-art.md` §4) — though `duckdb.exe` itself has no OTel SDK to
read it, so the practical benefit is documenting the hop's *duration and outcome* as a span on the Deno side,
not truly continuing the trace inside the DuckDB binary.

## Flow B — KB ingestion (upload → async worker → single-writer callback)

```
eischat service (process: eischat, Deno, oRPC + OpenAPI)
  │ enqueueJob(): raw fetch() to workers-api's OpenAPI trigger route
  │ (typed oRPC client would 404 today — issue #73 workaround)
  ▼
workers-api (plugin resource)
  │ queue backed by shared Garnet/Redis KV (cross-process; #371 split-brain fix)
  ▼
workers runtime (process: workers, separate Aspire executable, full OTEL env set)
  │ embed-document.ts / transcribe-image.ts — COMPUTE-ONLY, never opens channel db
  │ (tursodb native driver = exclusive OS file lock; 2nd process = os error 33)
  ▼
channelClient.writeKnowledgeChunks(...) / readKnowledgeImage(...)
  │ typed oRPC RPC client → ChannelContractV1 → serviceName 'eischat'
  │ resolved via Aspire service discovery (services__eischat__http__0)
  ▼
eischat service (same process as top — sole channel-db writer, single-writer arch)
  │
  ▼ (separately) workers → streams: DurableStreamProducer publishes to
    /workers/executions (previously silently dropped — endpoint now exposed)
streams plugin resource
  │ real UI consumer of this stream: UNCONFIRMED this pass — streams/*.ts in the
  │ repo are unmodified @netscript/plugin-streams scaffold boilerplate
  ▼
(dashboard UI, if wired — not verified)
```

Every hop in Flow B is same-language (Deno/TS) but genuinely cross-**process** (5 distinct OS processes:
eischat, workers-api, workers, streams, and eischat again as callback target). All processes already carry
full OTEL executable env vars from Aspire registration (`register-services.mts` / `register-background.mts`) —
emission plumbing exists at the infra layer; whether application code inside each hop actually creates
meaningful spans is a separate, only-partially-confirmed question (deferred to the telemetry-package-surface /
plugin-instrumentation-grading analysis files once those background research passes land).

## Legend / notes

- ★ = confirmed-dark (zero instrumentation), evidenced by direct source read.
- "UNVERIFIED"/"UNCONFIRMED" = the hop is real and evidenced, but whether it currently propagates trace context
  or is consumed downstream was not independently confirmed in this pass — do not treat as either present or
  absent without a follow-up read.
