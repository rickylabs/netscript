# Issue #445: docs(positioning): observability story

Part of #401 · Depends on #433 (S0 IA-reconciliation)

**Handle:** D6 · **Milestone:** `0.0.1-beta.7` · **Lane:** Opus-medium (Tier-1) authoring workflow.

## Scope — observability story

**Pages:** `observability/{index,telemetry}.md` · **Competitor angle:** Encore MCP + traces self-verify (T1).

> Cross-epic note: aligns with `epic:telemetry-revamp` (#399) — the story should reflect the corrected trace/query surface; do not claim capabilities ahead of what the telemetry slices have landed.

## D-common bar

- [ ] Story template: elevator pitch → story spine → mechanism (cross-linked) → one factual competitor comparison (T1/2) → cross-links.
- [ ] Positioning law: no throughput/benchmark, no superlatives, no unshipped claims (deno doc-traceable), no honesty framing, no fabricated %.
- [ ] Do NOT lift `_plan/*` prose verbatim.
- [ ] Diátaxis respected — link, never duplicate.
- [ ] `deno task verify` green; no orphan page.

Design source: `design/CD-docs/epic-and-issues.md` (§4, D6).



---
## Issue comment (2026-07-11T07:29:59Z)

## beta.6 context pack — observability story (from the beta6-ship orchestrator, `fb43bc3e`)

Positioning input as of the beta.6 release-ready state (`main` @ `720fcb7e`). **Shipped surface only** — everything below is verified against `deno doc` and the merged gates.

### Shipped surface (`@netscript/telemetry`, beta.6)

- **Ports/adapters core** (`./otel`): `TracerProviderPort`, `MeterPort`, `PropagatorPort`, `SpanLinkPort`, `TelemetryQueryPort`; default `OtelDenoTracerProvider` (zero-dep, Deno OTLP via `OTEL_DENO=true`) and opt-in `OtelSdkTracerProvider` (unlocks attribute-preserving span links).
- **First-party instrumentation (wrap-don't-reinvent)**: `./orpc` — `TracingPlugin` backed by upstream `@orpc/otel` + `registerORPCInstrumentation` (new in beta.6, PR #568); `./hono` — `createHonoTracingMiddleware` wrapping `@hono/otel`, registered outermost by the service builder (new, PR #571).
- **Cross-process story (the demo-able headline)**: real Flow-B grouped trace — trigger → scheduler dispatch → queue enqueue/dequeue → `job.execute` → SDK `rpc.client` callback, plus fan-in span links from many producers into one streams consumer (`createFanInLinks`). This is not aspirational: it is enforced by a non-mocked `scaffold.runtime` merge gate (PR #598) that reads live spans through the Aspire dashboard.
- **Query read side** (`./query`): `AspireTelemetryQuery` over Aspire `/api/telemetry/*`, typed read models (traces/spans/logs/resources/metrics/span links/OTLP export), Standard Schema filter validators.
- **Convention**: the #402 split — upstream semconv (`rpc.*`, `gen_ai.*`, `messaging.*`, `server.*`) vs NetScript-owned `netscript.*` (e.g. `netscript.correlation.id`). SDK clients emit CLIENT spans + W3C `traceparent` injection; workers emit shared metrics (`recordSharedWorkerMetrics`).

### Explicitly NOT shipped (do not position)

- **No dashboard UI** — the dev-dashboard epic (#400) was rescoped out of beta.6; only the query read side exists.
- **Attribute-floor gaps on some product spans** (#599): `job.execute` lacks a canonical `netscript.*` outcome; trigger/queue spans lack the full correlation/outcome pair. Don't claim a uniform attribute floor across every span.
- No baggage propagation; no built-in external OTLP backend dual-write (app's exporter choice).
- Published state: `@netscript/telemetry` on JSR is `0.0.1-beta.5` until the beta.6 cut runs — the oRPC/Hono/T8 story is main-only until then.

### Canonical reference

`packages/telemetry/README.md` was fully rewritten against this shipped surface in PR #610 (deno-doc-verified, consistent vocabulary: "telemetry ports/adapters", "#402 convention", "Flow-B grouped trace", "first-party instrumentation"). Use it as the terminology source for the story. Related: sdk/service/workers READMEs got matching sections in the same pass.