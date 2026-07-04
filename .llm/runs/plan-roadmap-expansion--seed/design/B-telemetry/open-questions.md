# `telemetry-revamp` — open questions (owner / cross-topic)

Items the deep-dive could not self-decide, or that need an owner ruling or a cross-topic handshake.
Grouped by who must answer. Design resolves everything else in `proposal.md`; these remain.

## For Opus-A (dev-dashboard) — the producer↔consumer data-contract handshake

1. **Adopt `@netscript/telemetry/query` as the dashboard data layer, and confirm co-land timing.**
   I offer the typed contract in `proposal.md` §7 (`TelemetryTrace`/`TelemetrySpan`/`TelemetryLog`/
   `TelemetryResource` + `queryTraces`/`getTrace`/`queryLogs`/`streamSpans`/`queryResources`/
   `exportTraces`). Proposed sequence: **beta.6 you consume raw Aspire `/api/telemetry/*` first
   (unblocked, zero dep on T7), then switch onto the typed contract as T7 lands within beta.6.** This
   matches your open-question #7 ("OTLP-first then converge"). Confirm you take the switch and that
   the field set above is sufficient for your trace/log/live panels — flag any missing field NOW so
   T7 includes it.
2. **Resource-graph ("what's running") ownership.** I scoped `@netscript/telemetry/query` to
   **telemetry only** and left the Aspire resource-graph / status surface to your Aspire seam
   (`seam-A` #2). Confirm you own that so we don't double-build a resource lister.
3. **The Flow-B fan-in leg needs a REAL streams consumer** (eis-chat's is inert scaffold, `oq` #3).
   The natural consumer is your dashboard's trace/stream view. Confirm the dashboard is the consumer T8
   wires the fan-in assertion against — or name an alternative demo subscriber.
4. **MCP live-content rendering (from Stage-C D-NSONE).** Whether the 4 eis-chat-exclusive MCP
   components (`html-block`/`mcp-widget`/`ui-block`/`icon`) enter the general fresh-ui registry depends
   on whether your panel IA renders live MCP content. Not a telemetry decision, but it touches the
   dashboard trace/log panels — your call.

## For the owner (ratification)

5. **Milestones must exist before issue-filing.** Stage-C flagged missing `0.0.1-beta.6`/`beta.7`. This
   design additionally uses **`0.0.1-beta.5`** for T1/T2 (restructure+convention land ahead of the
   parity wave). Confirm a `0.0.1-beta.5` milestone exists / should exist, or collapse T1/T2 into
   beta.6. (If only beta.6 exists, everything shifts to beta.6 with T1/T2 as the earliest slices.)
6. **Divergence from the ratified "AI-adapter at stable": I pull the minimal AI port *invocation* to
   beta.6** (T6), keeping the full GenAI-semconv adapter + rich views at stable (T9). Rationale: "seam
   exists but the runtime never calls it" is an inert-F that undercuts the flagship-AI mandate, and
   making the port live is cheap. Confirm this split is acceptable, or hold ALL ai work to stable
   (then the beta.6 flagship trace's AI hop stays dark).
7. **SDK-adapter dependency posture.** My thin-vs-SDK resolution (proposal §3) keeps the default
   publish surface zero-runtime-dep and makes `@opentelemetry/sdk-trace-*` an **opt-in** adapter pulled
   only by the streams/workers/ai processes that need attributed links / metric-flush. This adds a new
   (opt-in) npm dependency to the telemetry package's graph. Confirm that's acceptable vs. a stricter
   "telemetry stays 100% dependency-free, accept attribute-less links + event-based fallback" posture
   (which would degrade the beta.6 fan-in trace). **This is the one load-bearing dependency ruling.**
8. **`instrumentation/sse.ts` (447 ln, zero consumers) — delete or wire?** Default recommendation:
   delete (revamp removes dead scaffolding). But if the dashboard wants a server-sent live event
   stream, it's a wire-in instead. Cross-check with Opus-A (#3 above) before T2 deletes it.

## For the adversarial (F1) / PLAN-EVAL pass to stress

9. **Deno-native attribute-less links vs the SDK adapter — is the opt-in boundary drawn correctly?**
   The design opts `streams`/`workers` (+`ai` at stable) into the SDK provider for the fan-in leg.
   Stress: is there a hop where the default thin adapter silently produces attribute-less links that a
   TC-14 assertion should catch but doesn't? (The T8 fan-in assertion must run under the SDK provider
   to be meaningful.)
10. **MCP Streamable-HTTP transport traceparent propagation is UNCONFIRMED** (`oq` #1, Flow A / T9). If
    the MCP TS SDK client does not use `fetch` under the hood, Deno's auto-instrumentation won't
    propagate W3C on that hop and explicit injection is required. Verify during T9; it is a stable-tier
    item, not a beta.6 blocker, but flag if it turns out to also affect a beta.6 hop.
11. **True cross-language child-span continuation is a stretch, not a guarantee.** For duckdb (no OTel
    SDK) the beta-honest deliverable is a Deno-side span documenting the hop's duration/outcome; a
    genuinely stitched child span needs the per-language `netscript-trace` shim (a wrapper process).
    Confirm the stable acceptance bar is "Deno-side span present" with the shim as documented-capability
    stretch, not "duckdb emits its own child span" as a hard gate.

## Cross-cutting scope notes (recorded, not blocking)
- Baggage propagation is deliberately OUT (semconv Candidate-only) — do not couple the dashboard to it.
- Aspire retention is in-memory (~10k traces) — the dashboard shows live-dev data, not history;
  forwarding to a durable backend (SigNoz per eis-chat precedent) is the app's OTLP-exporter choice,
  not something `@netscript/telemetry/query` dual-writes.
- The `aspire otel` CLI path is broken (tracked arch-debt) — everything consumes the HTTP
  `/api/telemetry/*` API; do not let any slice claim the CLI works.
