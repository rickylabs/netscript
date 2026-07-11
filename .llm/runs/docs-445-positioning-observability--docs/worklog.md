# Worklog — docs/445-positioning-observability (issue #445, D6)

Branch: `docs/445-positioning-observability` from `7f7ed76be66fbfcf1133f7c4bcab33737aa09c78`.
Lane: Claude docs-authoring workflow (documentation-authoring exception). Orchestrator owns PR.

## Plan

Pages: `docs/site/observability/{index,telemetry}.md`. Apply the D-common story template
(proposal §4.2): elevator pitch → story spine → mechanism (cross-linked) → one factual
competitor comparison (Encore MCP + traces, T1) → cross-links.

Slice shape (surgical, positioning-first — not an API rewrite):

1. `telemetry.md` intro → elevator pitch (verification-turn / agent self-verify framing,
   build-efficiency law) + keep the mechanical paragraph.
2. New story-spine section ("one grouped trace") — Flow-B grouped trace (trigger → scheduler
   dispatch → queue enqueue/dequeue → job.execute → SDK rpc.client callback), fan-in span links
   (`createFanInLinks`), gate-enforced (non-mocked scaffold.runtime gate reads live spans),
   `gen_ai.*` semconv for AI-turn tracing.
3. Mechanism refresh in "What it is": telemetry ports/adapters (`./otel` ports, OtelDeno default,
   OtelSdk opt-in + attribute-preserving links), #402 attribute convention
   (semconv vs `netscript.*`, `netscript.correlation.id` floor) cross-linked to
   `/reference/telemetry/convention/`.
4. Service tracing section: add `registerORPCInstrumentation` row + first-party Hono middleware
   (`createHonoTracingMiddleware`, `@hono/otel`-backed, registered outermost by the builder).
5. New "close the loop" section: query read model (`@netscript/telemetry/query`,
   `TelemetryQueryPort`, `createAspireTelemetryQuery`, Standard Schema filter validators) +
   the ONE factual Encore comparison (Encore MCP server lets agents read traces to verify their
   own change; NetScript's loop is a typed in-language query port).
6. `index.md`: pitch-led intro, add convention reference link, extend next-steps.

Positioning-law guardrails applied: no throughput/benchmark, no superlatives, no honesty framing,
no fabricated %/social proof (eis-chat NOT name-dropped — docs voice never names it in prose;
spine grounded in the gate-verified Flow-B trace instead), no `_plan/*` prose lifted.

Not-shipped guardrails: no NetScript dashboard UI claim (viewing = Aspire); no baggage
propagation; no dual-write; no uniform per-span attribute-floor claim (#626 is on main,
unreleased — only the published README convention language "correlated spans share
`netscript.correlation.id`" is used).

## Accuracy evidence (claim → verification)

Published beta.7 authority: tag `v0.0.1-beta.7` (7790d20f). `git diff v0.0.1-beta.7 HEAD --
packages/telemetry/` = only #626's +23 lines (queue.ts/worker.ts attribute additions) → the
in-repo canonical README (PR #610) and local `deno doc` describe the published beta.7 surface
for everything this slice cites. (Direct `deno doc jsr:...@0.0.1-beta.7` blocked by the 24h
minimum-dependency-date quarantine window; tag-diff used instead.)

| Claim | Verification | Found |
| --- | --- | --- |
| `createAspireTelemetryQuery`, `createTelemetryQuery`, `AspireTelemetryQuery`, `TelemetryQueryPort`, `TelemetryTrace/Span/Log/Resource/Metric`, `validateTraceQueryFilter`/`validateMetricQueryFilter`/`validateResourceQueryFilter` | `deno doc packages/telemetry/query.ts` | yes |
| `createTracingPlugin`, `createErrorHandlingPlugin`, `createTraceContext`, `registerORPCInstrumentation`, `TracingPlugin` (backed by upstream `@orpc/otel`) | `deno doc packages/telemetry/orpc.ts` + README | yes |
| `createHonoTracingMiddleware` wraps `@hono/otel` `httpInstrumentationMiddleware` | `deno doc packages/telemetry/hono.ts` + README | yes |
| `createFanInLinks` (fan-in span links, producers → one consumer) | `deno doc packages/telemetry/tracer.ts` + README | yes |
| Ports: `TracerProviderPort`, `MeterPort`, `PropagatorPort`, `SpanLinkPort`, `TelemetryQueryPort`; adapters `OtelDenoTracerProvider` (default, `OTEL_DENO=true`) / `OtelSdkTracerProvider` (opt-in, attribute-preserving links) | canonical README (Architecture section) | yes |
| #402 convention: semconv (`rpc.*`, `gen_ai.*`, `messaging.*`, `server.*`) vs `netscript.*` root; `netscript.correlation.id` shared floor; `createGenAiAttributes` et al. | README Attribute Convention + `deno doc packages/telemetry/attributes.ts` | yes |
| Flow-B grouped trace (trigger → scheduler dispatch → queue enqueue/dequeue → job.execute → SDK `rpc.client` callback) enforced by non-mocked merge gate reading live spans | beta.6 context pack (orchestrator-posted, verified against merged gate PR #598) + gate present in repo | yes |

## Resumed by second agent (predecessor died at spend limit mid-Edit-3)

Predecessor had landed edits 1–4 (elevator-pitch intro, "one grouped trace" story spine,
ports/adapters + #402 mechanism paragraph, service/RPC/HTTP tracing section with
`registerORPCInstrumentation` + `createHonoTracingMiddleware`). Resuming agent:

- **Critical review of predecessor edits** — all present-tense API claims re-checked against
  `deno doc` (`packages/telemetry/query.ts`, `orpc.ts`) and the canonical README (PR #610). The
  `netscript.correlation.id` mention is the README convention language (naming convention / shared
  correlation key), NOT a uniform per-span attribute-floor claim — so it stays within the published
  beta.7 surface even though the #626 Flow-B floor is unreleased. No stale version claims present.
- **Completed step 5** — new `## Close the loop: read the trace back in code` section:
  `@netscript/telemetry/query` typed read side (`createAspireTelemetryQuery`/`createTelemetryQuery`
  → `TelemetryQueryPort`; `queryTraces`/`getTrace`/`querySpans`/`queryLogs`/`queryMetrics`/
  `queryResources`; read models `TelemetryTrace/Span/Log/Metric/Resource`; Standard Schema
  `validateTraceQueryFilter`/`validateMetricQueryFilter`/`validateResourceQueryFilter`), all verified
  against `deno doc packages/telemetry/query.ts` + README §Query read model. Plus the **single**
  factual competitor comparison (Encore MCP-server trace access vs NetScript's in-language typed
  query port) as a bounded note callout.
- **Completed step 6** — `index.md`: pitch-led verification-turn intro (links, does not duplicate
  the hub prose), new "Read a trace back in code" next-step pointing at the Close-the-loop section,
  and a `/reference/telemetry/convention/` link.

Positioning-law grep post-edit: exactly one framework competitor comparison (Encore);
Jaeger/Grafana/Honeycomb are neutral OTLP-backend references, not comparisons. No throughput/
benchmark, no superlatives, no honesty/candor framing, no fabricated %/social proof introduced.
(Pre-existing "fastest path"/"100% of traffic" strings are lowest-effort-path phrasing and a
sampling footgun — not touched, not positioning violations.)

## Evidence

`deno task verify` (inside `docs/site`) — GREEN:

- build: `🍾 Site built into _site` — 500 files generated.
- `check:links`: **23019 internal links across 162 pages — all resolve** (new
  `/reference/telemetry/convention/` link resolves).
- `check:caveats`: **27 caveat markers across 22 pages — all references resolve**.
