# Aspire telemetry ingestion + dashboard query/export API landscape

Sourced by a dedicated research pass (local-repo grep/read + WebFetch against aspire.dev/Jaeger/SigNoz/Encore
docs). Read-only against both codebases.

## 1. Local-repo findings — NetScript already has a proven Aspire-dashboard-query reference

**Single most important finding**: NetScript already has working code that queries the Aspire dashboard's HTTP
telemetry API — this de-risks the Topic A/B query-surface question substantially.

- `packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template` ships
  `fetchDashboardTraces()`: calls `GET https://localhost:{ASPIRE_DASHBOARD_PORT:-18888}/api/telemetry/traces`,
  parses OTLP-JSON (`{ data: { resourceSpans } , totalCount }`), reconstructs `TelemetryTrace`/`TelemetrySpan`
  keyed by `traceId`, computes a cross-service flag, sorts/slices top 20. A working reference implementation of
  trace-tree grouping from the Aspire dashboard API, already living in the framework's own scaffold output.
- `packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts` (`GATE.BEHAVIOR_OTEL_TRACES`) does the same
  server-side: resolves the dashboard base URL from `.netscript/e2e/aspire-start.json` (fallback constant
  `https://localhost:18888/api/telemetry/traces`), fetches, groups by `traceId`, asserts a specific
  cross-service parent/child link (`triggers-api` → `workers`) via `parentSpanId`. Proves the API returns
  `parentSpanId`/`traceId`/`spanId`/resource attrs sufficient for full trace-tree reconstruction, not just flat
  span lists.
- `packages/aspire/{constants.ts,config.ts}` + `packages/aspire/src/application/resolve-env-vars.ts` already own
  the full OTLP env-var contract: `OTEL_ENV_VARS`, `OTEL_DEFAULTS` (endpoint `http://localhost:4318`, protocol
  `http/protobuf`), `DASHBOARD_ENV_VARS` (`ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL`,
  `ASPIRE_ALLOW_UNSECURED_TRANSPORT`, `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS`), a Zod schema for
  `appsettings.json`'s `NetScript:Otel:HttpEndpoint`/`Protocol`, and `buildOtelEnvVars()` (3-var `denoApp` vs
  10-var `denoTask`/`executable` mode).
- `packages/telemetry/` is purely emission-side (tracer facade, instrumentation, traceparent propagation, oRPC
  tracing plugin) — it does **not** do dashboard querying today; that logic lives only in the CLI scaffold
  template + E2E gate above. A real query/export surface package does not yet exist.
- `docs/site/capabilities/telemetry.md` confirms: dashboard at `https://localhost:18888` (ephemeral, printed by
  `aspire start`), OTLP ingest at `http://localhost:4318`, `Aspire.Hosting.Browsers` pinned for auto browser-log
  capture, per-plugin health-probe surfacing, and an explicit statement that **Aspire is the only viewing
  surface today** ("You do not stand up Jaeger, Grafana, or a log shipper to get started").
- Pinned Aspire version: **13.4.6** (`generate-aspire-config_test.ts:70-72`) — comfortably past the 13.2 release
  that introduced `/api/telemetry/*` (see §3), so the API is available with no upgrade needed.
- No `dev-dashboard`/`plugin-dashboard-core` code exists yet in `packages/` or `plugins/` (confirmed via grep) —
  Topic A's Dev Dashboard is pre-implementation, plan-only, same as Topic B's query surface.
- eis-chat's `.agents/skills/aspire-monitoring/` documents the **CLI-first** routing model:
  `aspire otel logs|traces|spans [resource] [--format Json] [--trace-id <id>] [--search <text>]`,
  `aspire export` (zip: `resources/`, `consolelogs/`, `structuredlogs/`, `traces/` — one JSON per resource, OTLP
  format), `aspire dashboard run` (standalone). It documents `aspire otel logs/traces` can target a
  remote/standalone dashboard via `--dashboard-url` (+ `--api-key`) — the only documented remote path;
  `aspire logs`/`aspire describe` are backchannel-socket-only, no remote support.
- The eis-chat `aspireify` skill's `references/opentelemetry.md` is generic non-.NET OTel SDK setup guidance
  (Node/Python/Go/Java snippets), not dashboard-API-specific — only useful fact: confirms Aspire auto-injects
  `OTEL_EXPORTER_OTLP_ENDPOINT` into every managed resource.

## 2. Aspire OTLP ingestion ports + resource attributes

| Endpoint | Default |
|---|---|
| OTLP/gRPC | `http://localhost:4317` (standalone) / `ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL` → `:18889` (AppHost-integrated) |
| OTLP/HTTP | `http://localhost:4318` (standalone) / `ASPIRE_DASHBOARD_OTLP_HTTP_ENDPOINT_URL` → `:18890` (AppHost-integrated) |
| Dashboard frontend | `ASPNETCORE_URLS` → `http://localhost:18888` |

Port split: embedded-in-AppHost, the dashboard's own OTLP listener sits on `1888x`; NetScript's generated
profile maps the app-facing OTLP endpoint to `:4318` — matches `OTEL_DEFAULTS.ENDPOINT` already in
`packages/aspire/constants.ts`.

Resource attributes: Aspire's AppHost orchestrator (DCP) auto-injects `OTEL_SERVICE_NAME` and
`OTEL_RESOURCE_ATTRIBUTES=service.instance.id=<uuid>` per resource. **Not fully verifiable beyond these two**
from official docs — NetScript's own convention layering (service.version via OTEL_RESOURCE_ATTRIBUTES) is
NetScript's addition, not a further-documented upstream mapping.

Auth defaults relevant to a dashboard-consuming plugin: `Dashboard:Otlp:AuthMode` defaults `Unsecured`;
**`Dashboard:Api:AuthMode` defaults `ApiKey`** (auto-generated) — ingestion is open by default locally, but the
**query API requires `x-api-key` by default even in local dev**. `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true`
is the documented escape hatch NetScript already sets.

## 3. Aspire dashboard query API — feasibility verdict-neutral findings

**Not CLI-only.** Aspire ships a first-party HTTP query API as of **Aspire 13.2**
(aspire.dev/dashboard/apis/):

| Endpoint | Returns |
|---|---|
| `GET /api/telemetry/resources` | Resources with telemetry data |
| `GET /api/telemetry/logs` | OTLP `ResourceLogs` JSON, filterable, `?follow=true` NDJSON streaming |
| `GET /api/telemetry/spans` | OTLP `ResourceSpans` JSON, filterable, `?follow=true` streaming |
| `GET /api/telemetry/traces` | OTLP `ResourceSpans` JSON matching filters (repeatable `?resource=`) |
| `GET /api/telemetry/traces/{traceId}` | Full span set for one trace ID |

Auth: `x-api-key` header (`Dashboard:Api:AuthMode` `ApiKey` default / `Unsecured`). **Standalone** dashboard
defaults the API **off** (needs `ASPIRE_DASHBOARD_API_ENABLED=true`) — but **AppHost-integrated mode (NetScript's
scaffold mode) enables it automatically**, no extra opt-in needed.

This is exactly what NetScript's scaffold/E2E code already calls — not an undocumented backdoor, a real
versioned documented feature. **Open question the docs didn't resolve**: whether this API is declared
stable/supported-for-external-integration, or merely "shipped but dashboard-internal." Contrast with Jaeger,
which explicitly labels its JSON `/api/*` "intentionally undocumented and subject to change" and points
integrators at the stable `api_v3` gRPC `QueryService` instead — Aspire's docs present `/api/telemetry/*`
without an equivalent stability disclaimer either way. **Flag for direct confirmation before treating as a
long-term-stable integration contract.**

CLI surface (`aspire otel logs|traces|spans`, `aspire export`) is a separate additional path, useful for
agent/automation workflows and can also target a remote dashboard — not required for the Dev Dashboard
plugin's own runtime query needs since the HTTP API is directly callable.

**Persistence/retention**: confirmed **in-memory only**, no persistence across restarts, auto-eviction at
`Dashboard:TelemetryLimits`: `MaxLogCount=10,000`, `MaxTraceCount=10,000`, `MaxMetricsCount=50,000/resource`,
`MaxAttributeCount=128`, `MaxResourceCount=10,000`. **No documented forward/passthrough to an external backend**
(Jaeger/Prometheus/SigNoz) while also serving the dashboard — no evidence of dashboard-side dual-write; the
documented pattern is "point your app's OTLP exporter at a different collector instead" (either/or at the app
level). **Real constraint for the Dev Dashboard plugin**: a beta.6 user also running a real backend (SigNoz,
per eis-chat precedent) gets no forwarding from Aspire — either the app dual-exports, or the Dev Dashboard
plugin treats Aspire's API as the single local-dev source and leaves backend-forwarding to the
already-documented OTLP-endpoint swap in `docs/site/capabilities/telemetry.md`.

## 4. Comparable query/export API shapes

| Capability | Aspire dashboard | Jaeger Query Service | SigNoz Query Service | Encore dev dashboard |
|---|---|---|---|---|
| Documented external API | Yes, `/api/telemetry/*` HTTP, since v13.2 | Stable gRPC `api_v3.QueryService` (16685); separate undocumented JSON `/api/*` (16686) | Yes, REST, `POST /api/v5/query_range` + others | **Not found** — no public API documented |
| Full trace tree by trace ID | **Yes** — `GET /api/telemetry/traces/{traceId}` | **Yes** — `GET /api/traces/{id}` (JSON, undocumented) / `GetTrace` (gRPC, stable) | **Unclear from fetched docs** — no explicit "get trace by ID" endpoint surfaced | Unknown — UI-only per docs |
| Attribute/free-text filtering | `?resource=` + filter params (grammar not fully specified in fetched docs) | Service/operation/tag/duration/time-range (older Jaeger docs; not confirmed for `2.dev`) | Rich `compositeQuery` (`builder_query`/`clickhouse_sql`), typed field filters | N/A |
| Time-range + service-name query | Implied via filters + `?resource=` | Yes (`start`/`end`/`tags`, general Jaeger docs) | Yes (`start`/`end` epoch ms + service filters) | N/A |
| Real-time streaming | **Yes** — `?follow=true` NDJSON on `/logs`, `/spans` | Not documented in fetched sources | Not confirmed | N/A |
| Auth model | `x-api-key` (ApiKey default) | None documented for JSON API | `SIGNOZ-API-KEY` header | N/A |
| API stability posture | Not explicitly declared either way | JSON API explicitly "undocumented, subject to change"; gRPC v3 explicitly "Stable" | Presented as supported product API | N/A |

**Read for the Dev Dashboard / telemetry query surface**: Aspire's `/api/telemetry/traces/{traceId}` is the best
precedent for NetScript's "full trace tree by ID" need — arguably closer-fit than Jaeger's undocumented JSON API
and better-documented than anything found for Encore/SigNoz's trace-by-ID case specifically. NetScript's own
`telemetry-trace.ts.template` already parses this exact shape (`resourceSpans`→`scopeSpans`→`spans` with
`parentSpanId`) — a strong in-repo starting contract, needing mainly generalization (currently hardcoded to a
`triggers-api`/`workers` demo case) and repointing at Aspire's now-documented (not reverse-engineered) API.

## Sources

Aspire official: aspire.dev/dashboard/{apis,configuration,standalone}/, aspire.dev/fundamentals/telemetry/,
aspire.dev/whats-new/aspire-13-2/. Jaeger: jaegertracing.io/docs/2.dev/architecture/apis/. SigNoz:
signoz.io/docs/traces-management/trace-api/{overview,payload-model}/. Encore:
encore.dev/docs/ts/observability/{dev-dash,tracing}.

Local repo (read-only): `packages/aspire/{constants.ts,config.ts,src/application/resolve-env-vars.ts}`,
`packages/telemetry/src/config/constants.ts`,
`packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template`,
`packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts`, `docs/site/capabilities/telemetry.md`,
`packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts`, `specs/topic-A-dashboard.md`,
eis-chat `.agents/skills/{aspire-monitoring,aspireify}/`.

## Verification gaps (explicit — do not treat as resolved)

- Whether Aspire's `/api/telemetry/*` HTTP API is officially declared stable for external integration, vs.
  dashboard-internal — not stated either way in fetched docs.
- Exact filter-parameter grammar for `/api/telemetry/{logs,spans,traces}` — docs confirm "optional filters" +
  repeatable `?resource=` but don't enumerate the full filter set.
- Whether Jaeger's `2.dev` JSON API still exposes `/api/services`, `/api/operations` (older docs list these;
  not confirmed current-gen).
- SigNoz "get full trace tree by ID" as a discrete endpoint — not confirmed from the two pages fetched.
- Encore's dev-dashboard backing API/architecture — docs are UI-feature-oriented; existence of an internal API
  neither confirmed nor denied.
- `docs/site/_plan/research/competitors/{encore,medusa,trpc,temporal}.md` referenced by `topic-A-dashboard.md`
  were not found in the `wt-roadmap-expansion` worktree (glob empty) — likely exist only in the worktree that
  authored that spec; not read, not to be assumed absent from the eventual synthesis.
