# Topic B (telemetry) — analysis (B2)

Synthesized internal analysis: package-surface inventory, plugin-quality grading, eis-chat pipeline
mapping, arch-debt/doctrine constraints, and the framework's native polyglot capability. Read-only
against both the NetScript worktree and the eis-chat reference export.

| File | Covers |
|---|---|
| `telemetry-package-surface.md` | Exhaustive `@netscript/telemetry` export/module inventory (8 subpaths), real API surface, W3C-propagation gap (tracestate dropped in fallback path), oRPC tracing-plugin silent-no-op risk, unwired instrumentation registry, per-primitive adapter comparison (queue/scheduler/sse/worker), consumer blast-radius, test-coverage gaps. Research task (1) from the topic spec. |
| `plugin-instrumentation-grading.md` | Per-plugin instrumentation grading against `workers` (reference, A), file-level evidence with line refs: database B+/A- (**only real OTel span-links in the repo**, via Prisma bridge), sagas B+ (richest metrics; reimplements own tracer; fan-in is parent-child NOT links), auth B (redaction-grade audit facade, different dimension not span-density; actually wired), triggers C+ (**inbound-webhook→process trace severed**; rich core facade unwired), services/oRPC C+ (enriches Deno HTTP span, creates none), streams F (verified zero wiring), ai F (no-op port never invoked). Research task (2). See header for grade-emphasis reconciliation with the parallel pass. |
| `eis-chat-real-pipeline-map.md` | Directly-researched eis-chat cross-process pipeline: process inventory, confirmed real cross-process hops (chat/MCP/DuckDB-subprocess; KB-ingestion; embeddings/vision→external SaaS), aspirational-vs-implemented drift, two costed candidate showcase flows presented without a verdict. Research task (4) from the topic spec. |
| `arch-debt-and-doctrine-constraints.md` | Tracked telemetry arch-debt (`packages/telemetry` doctrine "Refactor" — ports/adapters split + OTEL-adapter subpath; `aspire-otel-cli-discovery` HTTP-API-works-CLI-fails; `workers-scaffold-job-tools-noop`; `workers-non-deno-task-sandbox-boundary`), doctrine 05/08 constraints, and a derived revamp-constraints checklist. Net-new (spec §6 "anything material"). |
| `native-polyglot-and-aspire-orchestration.md` | The framework's OWN shipped 7-runtime cross-language subprocess capability (`MultiRuntimeTaskExecutor`, real TRACEPARENT/TRACESTATE/CORRELATION_ID env injection — primary-evidence code), the Python-child-span-not-demonstrated gap, Aspire OTEL env injection + ephemeral ports + resource-attr join key, framework-vs-scaffold telemetry boundary, and the in-repo webhook→trigger→job baseline showcase. Supports research tasks (3)/(4)/(5). |

## Cross-file reconciliation notes

- `telemetry-package-surface.md` §"Reconciliation with pipeline-map open question #2" resolves (with a
  residual caveat) whether `channelClient`'s oRPC callback gets tracing: yes via `createPluginService`'s
  default `TracingPlugin`, but real effect depends on `OTEL_DENO` HTTP auto-instrumentation being active —
  not independently re-verified for the `workers` executable.
- `plugin-instrumentation-grading.md` §"Reconciliation with pipeline-map / open-question #3" strengthens
  the open question about `streams` fan-out consumption: independent of whether a real UI consumer exists,
  `plugins/streams` has zero telemetry integration at any layer (Grade F) — the workers→streams hop in
  Flow B (KB ingestion) is confirmed telemetry-dark regardless.

See `context/B-telemetry/eis-chat-pipeline-diagram.md` for ASCII diagrams of both flows and
`context/B-telemetry/open-questions.md` for the full open-question/spec-drift list.
