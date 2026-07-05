# Distributed tracing state-of-the-art — OTel semconv, W3C trace-context, cross-process propagation, Deno/OTLP

Sourced by a dedicated research pass (WebSearch/WebFetch against primary specs). All claims below are
cited; anything unverifiable is flagged explicitly rather than asserted.

## 1. OTel semantic-conventions stability (registry v1.42.0)

Stability is **per-domain**, not blanket:

| Domain | Status | Transition opt-in | Baseline |
|---|---|---|---|
| Messaging | Development | `OTEL_SEMCONV_STABILITY_OPT_IN=messaging` / `messaging/dup` | — |
| RPC | Release Candidate (closer to stable) | `OTEL_SEMCONV_STABILITY_OPT_IN=rpc` / `rpc/dup` | v1.37.0 |
| GenAI | Development, **moved to its own repo** `open-telemetry/semantic-conventions-genai` | `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` | v1.36 |

Messaging key attrs: `messaging.system`, `messaging.destination.name`, `messaging.operation.type`
(`create|send|receive|process|settle` — applies to single message OR batch), `messaging.batch.message_count`,
`messaging.message.id`.

RPC key attrs: `rpc.system`, `rpc.service`, `rpc.method` (span name SHOULD be `{rpc.method}`); `code.function.name`
for the implementing function when it differs from the logical method.

GenAI breaking renames vs the old attribute set (all still Development — expect further churn):
`gen_ai.system`→`gen_ai.provider.name`; `gen_ai.usage.prompt_tokens`→`gen_ai.usage.input_tokens`;
`gen_ai.usage.completion_tokens`→`gen_ai.usage.output_tokens`; `gen_ai.openai.request.response_format`→
`gen_ai.output.type`. `gen_ai.operation.name` values: `chat, embeddings, generate_content, text_completion,
retrieval, invoke_agent, invoke_workflow, execute_tool, create_agent`.

**Unverified claim flagged**: a secondary blog (oneuptime.com) claims GenAI client spans went stable in
early 2026 — the official OTel blog does NOT corroborate this; the GitHub source tree still shows Development
status. Do not code against "stable GenAI spans" as fact; build against the new repo's YAML model directly and
gate emission behind the opt-in env var.

Sources: opentelemetry.io/docs/specs/semconv/{messaging,rpc,gen-ai}, github.com/open-telemetry/semantic-conventions-genai,
opentelemetry.io/blog/2026/genai-observability/, opentelemetry.io/blog/2025/stability-proposal-announcement/

## 2. W3C Trace Context — settled, not a moving target

**Recommendation-tier** (highest W3C standardization level), published 2021-11-23. A Level 2 draft adds a
`random-trace-id` trace-flag — track but not load-bearing yet.

- `traceparent`: `version-trace_id-parent_id-trace_flags` (`00-<32hex>-<16hex>-<2hex>`); only defined flag bit
  today is `01` = sampled.
- `tracestate`: comma-separated `key=value`, vendor-namespaced via `tenant-id@vendor-id`; max 32 members, values
  ≤256 chars, truncate entries >128 chars first when trimming.
- **Baggage** (companion spec) is only **Candidate Recommendation Snapshot** (2024-05-30) — one tier below
  Trace Context, still settling. Header: `baggage: k=v;prop1;prop2, k2=v2`. Distinct purpose from `tracestate`:
  baggage carries arbitrary app-level context (user id, feature flags), never tracing-vendor metadata.

Sources: w3.org/TR/trace-context/, w3.org/TR/trace-context-2/, w3.org/TR/baggage/

## 3. Span links for fan-in / messaging batch

A **Link** = a `SpanContext` (same or different trace) + optional attributes; order should be preserved;
attach links at span-creation time (not `AddLink()` later) because head-based sampling only sees creation-time
data.

Messaging semconv mandates **links, not parent-child, as the default producer↔consumer correlation** for two
reasons: (1) only structure that works across every messaging delivery model, (2) a span has exactly one
parent, but a "process a batch" span may cover messages from **different traces** — links represent all of
them, parent-child can represent at most one. Batch-uniform attributes go on the span; per-message attributes
(e.g. `messaging.message.id`) go on the **per-message link**. Single exception: a strictly single-message
Process span MAY use direct parent-child instead of a link.

General guidance beyond messaging: links are the standard way to model **any fan-in** (one span aggregating
several upstream traces) where a strict single-parent tree would lose information.

Sources: github.com/open-telemetry/opentelemetry-specification (trace/api.md), opentelemetry.io/docs/specs/semconv/messaging/messaging-spans/

## 4. Cross-language / cross-process subprocess propagation

OTel has a formal (Beta-status) spec for exactly this: **"Environment Variables as Context Propagation
Carriers"** (opentelemetry.io/docs/specs/otel/context/env-carriers/, born from spec issue #740).

- Purpose: propagate trace-context/baggage into a child process when there's no HTTP/gRPC/messaging transport
  auto-carrying W3C headers — i.e. exactly the shape of a Deno parent `Deno.Command`-spawning a non-Deno binary.
- Carrier is **format-agnostic**: each propagator (W3C TraceContext, Baggage, B3...) picks its own env-var key
  names; the carrier layer only normalizes them.
- **Mandatory key normalization** (env vars are case-insensitive on Windows, case-sensitive on POSIX): uppercase,
  replace non-`[A-Za-z0-9_]` with `_`, prefix `_` if it would start with a digit. Must match `^[A-Z_][A-Z0-9_]*$`.
- Pattern: an `EnvironmentSetter` writes context into a dict the **calling application** then uses when it
  spawns the child — the spec implementations do NOT spawn processes themselves.
- Concretely (W3C TraceContext convention): child inherits a `TRACEPARENT` (and optionally `TRACESTATE`) env var
  in the literal W3C header string format; the child's own SDK reads it at startup as parent context.

**Prior art doing exactly this**: Anthropic's own Claude Code CLI observability docs describe injecting
`TRACEPARENT`/`TRACESTATE` into every spawned subprocess env so a child's own OTel spans nest under the
parent automatically (code.claude.com/docs/en/agent-sdk/observability); `traci` (github.com/nextrevision/traci,
Go) is a small CLI purpose-built to inject `TRACEPARENT` into a launched command's env; OpenTofu has an open
issue (opentofu/opentofu#3936) wanting exactly this for `local-exec` provisioners — i.e. still a recognized gap
in several tools, not universally solved.

**Recommendation for the framework**: standardize on setting `TRACEPARENT`/`TRACESTATE` env vars on subprocess
spawn (W3C string format, normalized per the Beta carrier spec), and have any child that runs its own OTel setup
read it at startup. Note Beta status — key-naming guarantees could still shift upstream.

## 5. OTel SDK status for JS/Deno (Deno 2.9)

**npm `@opentelemetry/*` under Deno**: importable via `npm:@opentelemetry/...`, but `exporter-trace-otlp-grpc`
depends on `@grpc/grpc-js` (Node-runtime-specific, historically Deno's sharpest OTel-JS friction point —
tracked at open-telemetry/opentelemetry-js#2293). Prefer HTTP-based OTLP exporters under Deno. `npm:@opentelemetry/api@1`
is Deno's own documented integration point for user-authored spans — user code should NOT call
`trace.setGlobalTracerProvider()` itself; Deno auto-registers the global providers.

**Deno's native OTel** (`OTEL_DENO=true`):
- Auto-instrumented: `Deno.serve` inbound HTTP, outbound `fetch`, HTTP/2 (`node:http2`, Deno 2.9+) with
  propagation, `Deno.cron()` (~2.7+); HTTP server metrics (duration, active requests, body sizes tagged by
  method/status/protocol/address/port); all `console.*` exported as OTel logs correlated to the active span.
- **Explicit Deno-documented limitations** (direct collision with §3 above): **traces only support links WITHOUT
  attributes** — per-link attributes for messaging fan-in are **not currently representable** via Deno's native
  tracer. Also: no metric exemplars, async/observable meter callbacks not flushed on exit, no custom log-stream
  sources beyond console, HTTP spans don't get error status set on handler throw, no `http.route` attach on
  fetch-side spans.
- `OTEL_DENO_CONSOLE` controls console capture (`capture` default / `replace` / `ignore`).
- Protocol via `OTEL_EXPORTER_OTLP_PROTOCOL` (`http/protobuf` default→4318; `http/json`; `grpc` Deno 2.8+→4317;
  `console` for stderr debug). Standard resource/sampler env vars all respected (`OTEL_SERVICE_NAME`,
  `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_PROPAGATORS` default `tracecontext,baggage`, `OTEL_TRACES_SAMPLER[_ARG]`).

**Direct implication for `@netscript/telemetry`**: the link-without-attributes gap collides with the messaging
fan-in model the spec wants (§3). If any NetScript queue/streams primitive needs OTel-conformant fan-in links
with attributes, either (a) fall back to npm `@opentelemetry/sdk-trace-*` for that one subsystem instead of
Deno's native tracer, or (b) accept degraded (attribute-less) links until Deno closes the gap. This is a
genuine open design question for the revamp, not a workaround to silently swallow.

## 6. OTLP export

Spec v1.10.0. Three protocol/encoding choices via `OTEL_EXPORTER_OTLP_PROTOCOL`: `grpc` (unary, Protobuf/HTTP2,
port 4317 default), `http/protobuf` (binary Protobuf/HTTP1.1, port 4318, `Content-Type: application/x-protobuf`),
`http/json` (proto3 JSON/HTTP, port 4318). Default paths `/v1/{traces,metrics,logs}` (+ experimental
`/v1development/profiles`). No spec-mandated default — implementation trade-off (gRPC = throughput/low-latency
same-infra; HTTP = firewall/debugging friendliness). **Deno-specific**: native `OTEL_DENO=1` exporter defaults to
`http/protobuf` at localhost:4318, gained `grpc` only in Deno 2.8+; an npm-based gRPC exporter path would hit the
`@grpc/grpc-js` friction from §5. HTTP-based OTLP is the lower-friction default under Deno.

## Verification gaps (explicit)

- Could not fetch the current canonical `semantic-conventions-genai/docs/gen-ai-spans.md` directly (WebFetch
  returned the old repo's "moved" stub) — GenAI attribute list above is reconstructed from the attribute
  registry page + cached excerpts, not a direct current-file read. **Follow-up before locking attribute names
  into code**: read that file directly.
- "GenAI client spans are stable" (secondary blog claim) is **not corroborated** by the official OTel blog —
  treat as false/premature.
