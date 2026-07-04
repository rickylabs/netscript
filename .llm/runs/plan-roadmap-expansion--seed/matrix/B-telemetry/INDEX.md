# Topic B (telemetry) — resource matrix

Index of every external/internal resource consulted for the Topic B deep-search pass, with a one-line verdict
and a pointer into the B2 (analysis) / B3 (research) file that has the full extract. This file is the map;
detail lives in `analysis/B-telemetry/` and `research/B-telemetry/`.

## External standards / specs

| Resource | Status/verdict | Detail |
|---|---|---|
| OTel semantic-conventions registry v1.42.0 (messaging/RPC/GenAI) | Per-domain stability (Messaging=Development, RPC=Release Candidate, GenAI=Development, moved to its own repo) | `research/B-telemetry/otel-semconv-w3c-state-of-art.md` §1 |
| W3C Trace Context (traceparent/tracestate) | Recommendation-tier (settled, highest W3C level) | same, §2 |
| W3C Baggage | Candidate Recommendation Snapshot (still settling, one tier below Trace Context) | same, §2 |
| OTel span-links spec (fan-in/messaging) | Stable API concept; messaging semconv mandates links over parent-child for batch/fan-in | same, §3 |
| OTel "Env Vars as Context Propagation Carriers" | Beta status; formal answer to subprocess trace propagation | same, §4 |
| Deno native OTel (`OTEL_DENO=1`) | Real but limited — **links without attributes** is a confirmed gap colliding with messaging fan-in model | same, §5 |
| OTLP export spec v1.10.0 | Settled; grpc/http-protobuf/http-json, Deno defaults http/protobuf:4318 | same, §6 |

## Aspire / dashboard query surface

| Resource | Status/verdict | Detail |
|---|---|---|
| Aspire `/api/telemetry/*` HTTP query API (since 13.2) | Real, documented, NOT declared stable-for-external-integration either way | `research/B-telemetry/aspire-otlp-ingestion-and-query-api-landscape.md` §3 |
| NetScript's own `telemetry-trace.ts.template` scaffold | **Already a working reference implementation** of trace-tree grouping from the Aspire API | same §1 |
| NetScript's `otel-gates.ts` E2E gate | Proves the API returns enough structure for full cross-service trace reconstruction | same §1 |
| `packages/aspire/{constants.ts,config.ts,resolve-env-vars.ts}` | Already owns full OTLP env-var contract | same §1 |
| Aspire dashboard retention/persistence | In-memory only, no cross-restart persistence, no dashboard-side forwarding to external backends | same §3 |
| Jaeger Query Service (gRPC api_v3 + JSON) | gRPC=Stable; JSON=explicitly "undocumented, subject to change" | same §4 |
| SigNoz Query Service (REST) | Documented, rich filter model; no confirmed "trace by ID" endpoint in fetched pages | same §4 |
| Encore.dev dev dashboard | No public API documented at all | same §4 |

## eis-chat reference codebase (internal, read-only)

| Resource | Status/verdict | Detail |
|---|---|---|
| `apps/dashboard/lib/otel.ts` | Real, working `@netscript/telemetry` usage — W3C propagation from browser, GenAI-semconv spans via TanStack AI middleware | `analysis/B-telemetry/eis-chat-real-pipeline-map.md` §2a |
| `tools/legacy-archeo-mcp.ts` | Real MCP server; genuine `Deno.Command(duckdb.exe)` subprocess boundary — **currently zero telemetry** | same §2a-4 |
| `aspire/.helpers/register-{services,background}.mts` | Confirms 7 separate Aspire-registered OS processes, all OTEL-executable-env-wired at the infra layer | same §1 |
| `services/eischat/src/{jobs,vision,embeddings,channel-client}.ts` | Confirms KB-ingestion cross-process pipeline; confirms NO Python/local-ML anywhere (external SaaS HTTP only) | same §2b, §2c |
| `docs/{PRODUCT,ARCHITECTURE,INDEX}.md` | **Aspirational/implemented drift confirmed**: SigNoz join is narrative-only; component map stale | same §3 |
| `streams/{mod.ts,notifications-stream.ts}` | Unmodified `@netscript/plugin-streams` scaffold boilerplate — real UI consumer unconfirmed | same §3 |
| `@netscript/telemetry` package surface (`packages/telemetry/`, 8 subpaths, ~40 modules) | Real, feature-rich, unevenly tested (8 test files total); registry + SSE adapter confirmed dead code | `analysis/B-telemetry/telemetry-package-surface.md` |
| Plugin instrumentation quality vs. `workers` (A, reference; 6 plugins + oRPC + DB layer graded, file-level evidence) | workers A, database B+/A− (only real span-links), sagas B+ (richest metrics, own tracer), auth B (redaction-grade audit, diff. dimension), triggers C+ (ingress trace severed), oRPC/services C+, streams F, ai F | `analysis/B-telemetry/plugin-instrumentation-grading.md` (grade-emphasis reconciliation in its header) |
| Telemetry arch-debt + doctrine constraints (worktree `.llm/harness/debt/arch-debt.md`, doctrine 05/08) | Tracked "Refactor" verdict (ports/adapters + OTEL-adapter subpath); Aspire OTEL CLI-fails-but-HTTP-API-works debt; scaffold no-op stubs; sandbox trust boundary; derived revamp checklist | `analysis/B-telemetry/arch-debt-and-doctrine-constraints.md` |
| Native polyglot 7-runtime cross-language capability + Aspire orchestration (docs/site + telemetry src) | Framework already injects real TRACEPARENT/TRACESTATE/CORRELATION_ID into subprocesses; Python-child-span NOT demonstrated; Aspire ephemeral ports + resource-attr join key; in-repo webhook→trigger→job baseline flow | `analysis/B-telemetry/native-polyglot-and-aspire-orchestration.md` |

## Coverage note

All planned research/analysis passes for this topic are complete: 2 external-research files
(`research/B-telemetry/`), 5 internal-analysis files (`analysis/B-telemetry/`: package-surface, plugin
grading, eis-chat pipeline, arch-debt/doctrine, native-polyglot/Aspire), 2 context files
(`context/B-telemetry/`). See each folder's `INDEX.md` for the full manifest.

## Provenance / reconciliation note

Two parallel Stage-B agent instances wrote into these folders. The descriptively-named files
(`telemetry-package-surface.md`, `otel-semconv-w3c-state-of-art.md`,
`aspire-otlp-ingestion-and-query-api-landscape.md`, `eis-chat-real-pipeline-map.md`,
`eis-chat-pipeline-diagram.md`, and the per-folder `INDEX.md`s + `open-questions.md`) are canonical.
`plugin-instrumentation-grading.md`, `arch-debt-and-doctrine-constraints.md`, and
`native-polyglot-and-aspire-orchestration.md` were contributed by the second instance to fill the
grading file the first pass referenced-but-never-wrote and to add material both passes had missed. The
redundant `B1-/B2*-/B3*-`-prefixed duplicates from the second instance have been removed; no
`B*`-prefixed files should remain.
