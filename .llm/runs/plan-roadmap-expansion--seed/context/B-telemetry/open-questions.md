# Topic B (telemetry) — open questions and spec-drift candidates

## Open questions requiring follow-up (not resolved by this pass)

1. **Does the MCP Streamable-HTTP transport propagate `traceparent` automatically?** Deno auto-instruments
   outbound `fetch` for W3C context propagation, and `legacy-archeo-mcp` runs as an HTTP resource — but whether
   the MCP TypeScript SDK's client transport actually uses `fetch()` under the hood (vs. a raw socket/other HTTP
   client that Deno wouldn't auto-instrument) was not verified. This determines whether Flow A (see pipeline
   diagram) already has W3C propagation "for free" up to the DuckDB hop, or needs explicit wiring.
2. **Is the `channelClient` oRPC callback (workers → eischat) already using the `@netscript/telemetry` oRPC
   tracing plugin?** Deferred to the telemetry-package-surface inventory / plugin-instrumentation-grading
   analysis (separate background research passes) — needs reconciling against this document's Flow B map.
3. **Is `workers/streams` fan-out (`DurableStreamProducer` → `/workers/executions`) actually consumed by any
   real UI?** `streams/*.ts` in the eis-chat repo is unmodified `@netscript/plugin-streams` scaffold
   boilerplate. If unconsumed, the "durable-streams live-query" component of Flow B is plumbed-but-inert, which
   changes its cost/value as a showcase candidate.
4. **What does "grouped E2E trace" mean operationally for the query/export surface?** The Aspire dashboard API
   research (see `research/B-telemetry/aspire-otlp-ingestion-and-query-api-landscape.md`) confirms
   `/api/telemetry/traces/{traceId}` returns a full span set for one trace — but Aspire's docs don't confirm
   whether cross-process spans that both target the same OTLP endpoint reliably share one `trace_id` end to
   end without the app doing its own explicit parent-context propagation at each hop. This is exactly the
   propagation question in #1/#2, generalized.
5. **Is Aspire's `/api/telemetry/*` HTTP API declared stable for external integration**, or merely
   "shipped but dashboard-internal"? Unresolved from official docs — worth a direct confirmation (GitHub issue
   / release notes) before the query/export surface (a first-class beta.6 deliverable feeding Topic A) commits
   to it as a stable contract.
6. **GenAI semconv attribute names**: the new `semantic-conventions-genai` repo's canonical
   `docs/gen-ai-spans.md` could not be fetched directly this pass (WebFetch returned the old repo's "moved"
   stub). Attribute names in the OTel research file are reconstructed from the registry page + cached excerpts.
   Recommend a direct read of the current file before locking attribute names into `@netscript/telemetry` code.
7. **Deno's "links without attributes" limitation** (native OTel tracer) directly collides with the
   messaging-semconv fan-in model (which needs per-link attributes, e.g. `messaging.message.id`, to disambiguate
   a batch). If any NetScript queue/streams primitive needs OTel-conformant fan-in links with attributes, this
   is a genuine open design fork: fall back to npm `@opentelemetry/sdk-trace-*` for that subsystem, or accept
   degraded (attribute-less) links until Deno closes the gap. Not resolved here — a design decision for the
   Opus deep-dive stage (Stage D), not this breadth pass.

## Package-revamp / structural open questions (added by the parallel pass)

These concern the `@netscript/telemetry` REVAMP itself (not the eis-chat showcase). Detail in
`analysis/B-telemetry/{telemetry-package-surface,arch-debt-and-doctrine-constraints,plugin-instrumentation-grading}.md`.

8. **`OTEL_DENO`-thin vs bring-your-own-SDK — THE structural fork.** `enabled` is gated exclusively on
   `OTEL_DENO=1` and the package ships no JS SDK provider (relies on Deno's built-in). Deno's built-in has
   hard limits (no async-metric flush on exit; span links can't carry attributes; HTTP server spans not
   auto-errored). Does the revamp stay thin on `OTEL_DENO`, bring an `@opentelemetry/sdk` provider, or
   support both via the ports/adapters split the tracked "Refactor" arch-debt already mandates?
9. **Decouple `enabled` from `OTEL_DENO`?** Should an independent `NETSCRIPT_TELEMETRY_ENABLED` let manual
   spans run without Deno auto-instrumentation and vice versa?
10. **Doctrine realignment.** The forbidden `core/` folder + role-vocabulary drift must be resolved to close
    the tracked doctrine "Refactor" verdict. Fold into `domain/application/ports/adapters` or record a named
    exception? Also: delete orphan `src/public/mod.ts`, collapse the duplicated `./registry` subpath.
11. **Span-links helper + Deno attribute-less-link limit.** Only `database` uses real OTel span links.
    Sagas fan-in and queue/streams batch-consume are spec-SHOULD link sites but use parent-child only. A
    shared span-link helper collides with Deno's attribute-less-link limit (see #7) — resolve together.
12. **Facade convergence + metrics uplift.** Sagas and triggers each reimplement their own tracer instead of
    consuming `telemetry/src/instrumentation`; converging onto the shared facade should also lift the METRIC
    instruments only their cores define (workers has none) into the shared layer. In scope for the revamp?
13. **Triggers ingress correctness.** Inbound-webhook→processing trace is severed (traceparent captured on
    the event but never used to parent processing spans). Revamp fix or separate bug slice?
14. **streams (F) and ai (F) — first-instrumentation, not revamp.** Streams has no seam at all; ai has a
    seam its runtime never invokes. In scope for the telemetry epic or separate? (Flagship-quality mandate on
    `@netscript/plugin-ai` makes its F especially load-bearing.)
15. **Attribute namespacing + config validation.** Standardize the three coexisting conventions on
    `netscript.*` for non-semconv (migration/compat story for existing bare `worker.*` keys?), and add
    Standard-Schema config validation (currently bare coercion) per repo convention?

## Dashboard / query-surface open questions (beta.6 deliverable)

16. **Consume Aspire API vs build own store.** Aspire's `/api/telemetry/*` + the Aspire MCP already give
    resources/logs/traces/spans + `?follow=true` live-tail, and NetScript already has reference code
    (`telemetry-trace.ts.template`, `otel-gates.ts`) consuming it. Confirm the dashboard CONSUMES this rather
    than standing up its own collector. What happens under `--no-aspire`/production (no Aspire API)?
17. **Own query/export contract.** If NetScript exposes its own query/export API for a "static ⋈ live" join,
    what stability contract (Jaeger's internal-JSON cautionary tale) and export format (OTLP-JSON)?
18. **Endpoint discovery.** Dashboard/OTLP ports are ephemeral (`localhost:0`). How does a dashboard plugin
    discover the live endpoint robustly across normal vs `--isolated` runs?
19. **Cross-language showcase scope (feeds the supervisor's milestone call).** Env-var injection into
    subprocesses is real and shipped, and the Deno→Deno child works, but NO shipped example shows a non-Deno
    subprocess extracting context and emitting a stitched child span (the eis-chat `duckdb.exe` hop and the
    framework's Python polyglot task are both currently dark). A production-grade cross-language showcase
    needs a tiny per-language trace shim. How much is beta.6 vs the stable tail? (NOT decided here.)

## Spec-drift / contradiction candidates (flag to supervisor)

- **`docs/PRODUCT.md`/`ARCHITECTURE.md` describe the "archaeology ⋈ live telemetry" join as if partially live**,
  but `docs/INDEX.md` explicitly states SigNoz MCP integration is "not provisioned yet," and no SigNoz
  client/config/MCP-server code exists anywhere in the repo. The join is narrative/aspirational today, not
  implemented — any topic-B design that assumes it as an existing integration point is building on an
  aspirational premise, not current reality.
- **`ARCHITECTURE.md`'s component map does not match the current repo structure** (e.g. references
  "handlers/", "plugins/mcp-client" — current dirs are `services/eischat`, `streams/`, `workers/`,
  `tools/*-mcp.ts`). Docs have drifted from implementation; any showcase-flow selection should be checked
  against current code (as done in `analysis/B-telemetry/eis-chat-real-pipeline-map.md`), not against this
  file's prose.
- **Topic-spec reference path is wrong.** `specs/topic-B-telemetry.md` §6.5 points at
  `.agents/skills/aspireify/references/opentelemetry.md`; that path does NOT exist in the worktree. The
  live Aspire reference is the top-level `aspire` skill (worktree) and the separate `aspire-monitoring`
  skill in eis-chat. Minor spec drift — the intended Aspire telemetry reference is not where the spec says.
- **The retracted "button→python→trigger→saga→services" example** (owner correction, 2026-07-04): no Python
  process exists anywhere in eis-chat's real pipeline. The closest real analogue to "a trace surviving a
  non-Deno/TS boundary" is the `duckdb.exe` CLI subprocess inside `legacy-archeo-mcp.ts` — a compiled binary,
  not a scripting-language runtime, and currently completely uninstrumented. This is flagged as a *candidate*,
  not a replacement verdict for the retracted example — the supervisor still owns the choice.
