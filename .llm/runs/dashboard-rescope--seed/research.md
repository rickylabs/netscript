# Dev Dashboard Rescope — Research & Coverage Synthesis

Run: `dashboard-rescope--seed` · 2026-07-06 · seed-run profile (planning-only, drafts-only; owner ratifies all GitHub mutations)

## Why this run exists

Owner verdict (MAJOR beta.6 blocker): the pass-1 dashboard direction — including the design run's four static screens — largely reproduces what the .NET Aspire dashboard (resources, console/structured logs, traces, metrics) and Scalar (`/api/docs` reference + try-it) already do better. The Dev Dashboard is rescoped as **complementary and DX-oriented**: it renders only runtime/config/codegen state that Aspire and Scalar structurally cannot, and hands off (deep-links) to them for everything they own.

Driving question applied to every capability: *which NetScript features genuinely benefit from a dev-dashboard UI? What best reflects what happens at runtime, in config, in services, in routes, that Aspire + Scalar cannot showcase? How do we build a seamless experience redirecting from existing tools into this dashboard?*

## Method

Workflow `wf_ec9a7951-ab0` (11 agents, ~769k tokens): six Sonnet coverage sweeps in parallel — (a) NetScript capability inventory from the repo, (b) Aspire dashboard capability map + extension surface (grounded in `plan-roadmap-expansion--seed/research/A-dashboard/01-aspire-dashboard-extension-surface.md`), (c) Scalar map, (d) seed-run research distillation (`design/A-dashboard/proposal.md`, competitor/BaaS teardowns, analysis docs), (e) GitHub board audit (epic #400 + #408/#410–#432/#507/#509 bodies via gh), (f) design-run salvage + `registry.manifest.ts` ns-* inventory — then Opus deep-dives: gap matrix, rescoped screen set, integration architecture, per-issue rescope drafts, per-screen Claude Design prompts. Final synthesis authored by the supervisor (this document set), never by a workflow stage.

## Headline findings

1. **The complementary data plane already exists and is unconsumed.** Workers ships a 21-route oRPC contract (jobs/tasks/executions/workflows + SSE `GET /subscribe`) with zero UI consumer; sagas ship `GET /instances` + transition `/history`; triggers ship firing history + SSE + enable/disable + schedule `/preview` + webhook test. The beta.6 dashboard core is mostly **UI over shipped contracts**, not backend work.
2. **The single cheapest, most differentiated win has no issue yet:** the runtime-config hot-reload watcher (`runtime-config/application/watcher.ts`) already hot-reloads five override topics (feature flags, disabled jobs/sagas/triggers, task overrides) with a versioned `current` pointer — and emits only console scrollback. Piping its change events into an SSE feed yields the textbook only-NetScript view (S3, flagship).
3. **The duplication traps are specific and enumerable:** owned trace waterfall (DDX-8), logs tail (DDX-11), resource start/stop panel (DDX-12), service `/health` panel, metrics charts, GenAI view, and Scalar-style operation list/try-it (the old DDX-7 explorer). Each is killed or rescoped; each survives only as a deep-link out.
4. **The Aspire hand-off is concrete and cheap:** `WithUrl`/`WithUrlForEndpoint` on every scaffolded resource (a raw generator edit — currently only `withHttpEndpoint`/`withBrowserLogs` are emitted) plus `withCommand` (one seam, three surfaces: Aspire Actions menu, `aspire resource` CLI, Aspire MCP). Blocker: `AspireResourceKind` has no `command`/`app` kind — Seam A widening is the beta.6 unlock (#411); Seam B (`register-*.mts`) is the fallback.
5. **Scalar → dashboard is essentially nil** (no plugin/callback surface); the only lever is spec-authored `externalDocs`/`x-*` links in the generated OpenAPI doc — optional polish. Dashboard → Scalar deep-links (`/api/docs` + operation anchors) are clean.
6. **Co-requisite API gaps found (no route → no panel):** `TriggerDlqPort` has no contract route; `packages/queue` `DeadLetterStore` is port-only. Filed as thin contract slices sequenced before their panels (S12, wave:defer).
7. **Salvage verdict on the design run:** the `ns-step-timeline`/run-inspector shape survives wholesale (S6); `ns-stackmap` survives retargeted from infra topology to a capability-wiring graph (S2); the CLI-equivalent-of-every-action transparency pattern and `STATUS_VARIANT` map generalize to every screen; the flow/trace waterfall does not survive as an owned renderer.

The sections below are the full coverage artifacts, in original form, for traceability.

---


# Appendix A — Gap matrix, duplication traps, hand-off opportunities (Opus deep-dive)

# NetScript Dev Dashboard — Definitive Gap Matrix (beta.6 rescope)

Decision rule: a capability is **dashboard territory** only if it is runtime/config/codegen state that Aspire (OTLP-about-a-running-resource: resources, console/structured logs, traces, metrics, GenAI view) and Scalar (OpenAPI-spec projection: API reference, try-it, code samples, per-service auth) structurally cannot render. Dev pain = frequency-of-need × blindness-today (1 = rarely needed / already visible, 5 = needed constantly / completely blind).

## 1) Gap Matrix

| Capability | State that exists today | Aspire? | Scalar? | Dashboard territory? | Pain |
|---|---|---|---|---|---|
| **Workers: job/task registry** | `JobDefinition`/`TaskDefinition` (source, schedule, permissions, exec-kind); oRPC `GET /jobs`,`/tasks` shipped | No (process only) | No (not an OpenAPI route surface it renders) | **Yes** | 4 |
| **Workers: executions** | `ExecutionRecord` (status/attempt/exitCode/duration/correlation); KV status-count keys; `GET /executions*` shipped | Partial — a trace/log may exist, but not NetScript run-state model | No | **Yes** | 5 |
| **Workers: workflows** | Multi-step `WorkflowExecution` (per-step status/kind/durationMs) | No | No | **Yes** | 4 |
| **Workers: live SSE feed** | `execution.*`,`job.*`,`worker.status`,`heartbeat`; `GET /subscribe` shipped | No | No | **Yes (tap it)** | 5 |
| **Sagas: instance status** | `SagaStateEnvelope` (status incl. `compensating`, durability tier); `GET /instances` shipped | No | No | **Yes** | 5 |
| **Sagas: transition/compensation timeline** | `SagaTransitionRecord` from→to history; `GET /.../history` shipped | No (no saga concept) | No | **Yes** | 5 |
| **Sagas: outbox/idempotency/retry** | Reserved outbox, applied-keys dedup, `RetryPolicy` | No | No | Yes (future; not yet wired) | 2 |
| **Triggers: firing history** | `TriggerEvent` (kind/status/attempt/payload); `GET /events*`,`/events/subscribe` shipped | Partial (a log line maybe) — not firing-status model | No | **Yes** | 5 |
| **Triggers: enable/disable override** | `TriggerEnabledStateOverride`; `POST .../enable|disable` shipped | No | No | **Yes** | 4 |
| **Triggers: schedule preview** | `computeNextFireTimes` (cron/tz/backfill); `GET .../preview` shipped | No | No | **Yes** | 4 |
| **Triggers: DLQ + replay** | `TriggerDlqPort` (reason/attempts/replay) — **no contract route** | No | No | **Yes (needs API first)** | 4 |
| **Triggers: webhook test delivery** | `POST /webhooks/{id}/test` (ingress simulation) shipped | No | Partial — Scalar tests *app* routes, not trigger ingress | **Yes** | 3 |
| **Runtime-config hot-reload** | Live file-watcher over 5 topics; feature flags, disabled jobs/sagas/triggers, versioned `current` pointer | No | No | **Yes (best single win)** | 5 |
| **Plugin registry / manifest** | Loaded manifests, capabilities, provider metadata; CLI `plugin info` only | No | No | **Yes** | 4 |
| **Plugin doctor / health** | `PluginDoctorReport` (plugin/status/check/message); CLI only | No (Aspire health = process liveness, not per-plugin checks) | No | **Yes** | 4 |
| **Plugin contribution-axis map** | 8-10 contribution types per plugin (routes/db/workers/streams/telemetry…) | No | No | **Yes** | 4 |
| **Config resolution (`netscript.config`)** | Resolved services/apps/dbs/plugins; `inspectConfig` diagnostic only | No (shows running, not declared intent) | No | **Yes** | 4 |
| **Aspire/appsettings NetScript topology** | Declared resource intent + saga-store backend + OTel config | Partial — Aspire shows resources *running*, not NS-level declared mapping | No | **Yes (hand-off target)** | 3 |
| **DB migration status/drift** | Prisma migration status, introspect, drift; CLI `db status` only | No (shows DB resource up, not pending migrations) | No | **Yes** | 4 |
| **Installed-plugin version drift** | Installed vs. published JSR versions | No | No | **Yes** | 3 |
| **Fresh route→contract binding** | `DiscoveredNetScriptRoute` (bound/unbound, inline/sidecar form); build-log only | No | No (Scalar = backend API routes, not Fresh page routes) | **Yes** | 4 |
| **Contract→spec fidelity/coverage** | Which oRPC routes lack `.describe()`/`.method()` degrading spec | No | No (renders emitted spec, can't show the gap) | **Yes** | 3 |
| **RPC-vs-REST duality** | Same contract → `/api/*` REST + `/api/rpc/*` typed + SDK client | No | No (sees only REST projection) | **Yes** | 3 |
| **Telemetry instrumentation coverage** | Which primitives are wired to emit vs. configured-but-unwired | No (Aspire shows the *traces*, not the wiring map) | No | **Yes** | 3 |
| **Cron: live scheduler vs. config drift** | `scheduler.list()` runtime jobs vs. declared defs; events emitted, unsubscribed | No | No | **Yes** | 4 |
| **Queue: generic DLQ depth/reprocess** | `DeadLetterRecord` across KV/Redis/PG; `depth()`,`reprocess()` — **no contract** | No | No | **Yes (needs API first)** | 4 |
| **AI: bound providers/tools at runtime** | Which providers/tools actually registered live vs. static shape | No | Partial — shows static contract shape, not live binding | **Yes** | 3 |
| **AI: in-flight chat/tool-call turns** | Streaming agent loop, live tool calls | Partial — GenAI telemetry view exists in Aspire | Partial overlap | Link/defer | 2 |
| **KV backend binding** | Which KV backend auto-detected | No | No | Fold into topology (1 line) | 1 |
| **Watchers: file-watch events** | `WatchEvent` (path/kind/contentHash) | No | No | Fold into Triggers file-watch view | 2 |
| **Auth: session stream / events** | `AuthSession` state, `auth.*` events | Partial | No | Defer (overlaps auth-provider console) | 2 |
| **Service /health** | `HealthResponse` per-check | **Yes** — Aspire State column (if wired) | No | **Trap — skip** | 1 |
| **Raw traces/spans** | OTLP spans | **Yes (owns it)** | No | **Trap — link only** | — |
| **Console/structured logs** | stdout/stderr + OTel logs | **Yes (owns it)** | No | **Trap — link only** | — |
| **Metrics charts** | meters/instruments/exemplars | **Yes (owns it)** | No | **Trap — link only** | — |
| **Resource start/stop/restart** | process lifecycle | **Yes (Actions menu)** | No | **Trap — route via `withCommand`, don't re-skin** | — |
| **Per-service API reference / try-it** | OpenAPI operations, code samples, auth | No | **Yes (owns it)** | **Trap — deep-link to `/api/docs`** | — |

## 2) Duplication Traps

The dashboard **must not rebuild** these — it may only link to them:

1. **Raw trace/span waterfalls.** Aspire owns trace list, trace-detail, span drill-down, exemplar↔trace linking, cross-replica combination, and stable per-trace coloring. The prior proposal's flagship "Flow/Trace Waterfall" (Panel 3) is the thinnest part of the complementary claim. The *only* defensible NetScript angle is **run-grouping semantics** (one `RunRecord` spanning eischat→workers→streams as a single logical run, with Attempt badges and rerun-from-step) — and even that should render as a compact NetScript-domain timeline that **deep-links out to Aspire's `/traces/{traceId}`** for the actual waterfall, never re-render OTLP.
2. **Console + structured logs.** `?follow=true` NDJSON streaming, level filters, download, browser logs (`withBrowserLogs`, already wired) are all Aspire-native. A "Logs panel" is pure duplication.
3. **Metrics charts.** Meter/instrument selection, dimension filter chips, value/count aggregation, exemplars — fully Aspire. NetScript has no metrics story that improves on this.
4. **Resource start/stop/restart.** Aspire's Actions menu already does this. Routing the same action "through the plugin registry" for dogfood value is still the same start/stop surface — build it as a `withCommand` contribution that *appears in Aspire*, not as a rival control panel.
5. **Service `/health` status.** This belongs in Aspire's State column via a properly wired `withHealthCheck()` (currently a NetScript wiring gap, not a dashboard need). Building a health panel would duplicate what fixing the Aspire wiring gives for free.
6. **Per-service API reference + try-it.** Scalar owns operations, schemas, multi-language code samples, per-request auth injection, and live execution against a running service. The old "Service Catalog + API Explorer" (Panel 2) is the one panel that overlaps Scalar. Resolution: the dashboard lists **contracts and cross-service wiring** (which Scalar can't), then **deep-links to that service's `/api/docs`** (or an operation anchor) for the actual reference/try-it. It must never re-render the operation list or a try-it console.
7. **GenAI conversation view.** Aspire already renders chat/embedding telemetry as a conversation. Skip; link.

## 3) Hand-off Opportunities

Concrete jumps, each with the mechanism from the extension surface:

**Aspire → Dashboard (discovery/entry):**
- **`WithUrl` / `WithUrlForEndpoint`** — cheapest, highest-leverage win. Attach a named `"NetScript Dashboard"` URL to every scaffolded app/service resource in `generate-register-apps.ts`, pointing at `http://localhost:{dashboardPort}/resource/{name}` (deep-linked to that resource's config/wiring/registry view). Sits in the Resources-page Endpoints column right next to the resource's own URLs. **Currently unused** in the generator (only `withHttpEndpoint`/`withBrowserLogs` present) — a small addition, no seam change needed.
- **`withCommand(name, displayName, executeCommand)`** — register `"Inspect saga run"`, `"View plugin registry"`, `"Open NetScript Dashboard"` commands on NetScript-managed resources; `executeCommand` returns `{success, data:{value: deepLinkUrl}}` surfaced in Aspire's notification center + text visualizer. Because the same registration is reachable from `aspire resource <name> <cmd>` CLI **and** Aspire's MCP tools, an AI agent debugging via Aspire's MCP gets the dashboard link for free ("one seam, three surfaces"). **Blocker:** `AspireResourceKind` union and `AspireNSPluginContribution` have no `command` kind — widening Seam A (add `command`, and `app` for the dashboard's own presence) is the concrete beta.6 unlock. Fallback: hand-edited Seam B (`register-*.mts`) which already reaches raw `withCommand`.

**Dashboard → Aspire (correlate-then-return):**
- **`/api/telemetry/{traces,traces/{traceId},logs,spans}` HTTP API** — the dashboard *reads* this behind a `TelemetryQueryPort` to correlate a NetScript-domain event (saga step, trigger firing) with its underlying trace, then **deep-links to Aspire's own trace-detail page** rather than rendering a waterfall. NetScript already has a working reference consumer (`fetchDashboardTraces()` + `otel-gates.ts`). Treat the API as best-effort (not declared stable-for-integration): pin the Aspire version, isolate it in an `adapters/aspire-query` swap seam.
- **Interaction parameters via `withCommand` `arguments: InteractionInput[]` + `confirmationMessage`** — for any dashboard action needing input ("replay saga step N", "confirm clear registry cache"). `IInteractionService` is **confirmed absent** from the TS AppHost SDK; do not design around it.

**Dashboard → Scalar:**
- Deep-link from any service/route/contract node straight to that service's `/api/docs` (Scalar shell already served locally-bundled at `/api/docs/scalar.js`), optionally to an operation anchor. Never re-render the reference.

**Agent-facing (positioning):**
- Mirror Aspire's MCP pattern with a **NetScript domain-state MCP surface** ("what does the plugin registry look like right now", "saga run state") — the *complementary* half of Aspire's telemetry-focused MCP tools. Aspire owns the observability MCP surface; NetScript should own the domain-state one, not duplicate it.

**Co-requisite API gaps to file (no route exists → no panel possible):**
- `TriggerDlqPort` has no contract route.
- `packages/queue` `DeadLetterStore` is port-only (no CLI/API).
- No `command`/`app` kind in `AspireResourceKind` for the hand-off seam itself.
Each must ship a thin contract slice *before* its dashboard panel.

## 4) The Highest-Value Uniquely-NetScript Surfaces

**1. Runtime-config hot-reload monitor (pain 5).** A live filesystem watcher (`runtime-config/application/watcher.ts`) already exists and already hot-reloads five topics — feature flags, disabled jobs/sagas/triggers, task overrides — versioned via a `current` pointer. Today its only output is `summarizeRuntimeConfig` console scrollback ("Disabled jobs: X, Y"). Piping its existing change events into a dashboard SSE feed is *nearly free* and yields the textbook only-NetScript-can-know view: "someone just flipped feature flag `checkout-v2` to 30% rollout." Aspire sees infra; Scalar sees the spec; neither can ever know NetScript's own override layer exists. Cheapest, most differentiated win.

**2. Workers execution + workflow console (pain 5).** A complete versioned oRPC CRUD+SSE contract (21 routes: jobs, tasks, executions, query-by-correlation, trigger, subscribe) is **already shipped with zero UI consumer**. `ExecutionRecord` carries status/attempt/exitCode/duration/correlationId; workflows track per-step status. Build the UI, no backend work. Aspire proves the *process* is up; only NetScript knows which job ran, retried twice, and failed on attempt 2 of 3.

**3. Saga instance + compensation timeline (pain 5).** `SagaStateEnvelope` models statuses no other tool has a concept of — especially `compensating` — and `SagaTransitionRecord` gives a from→to state-machine timeline. Contract shipped, no consumer. "This saga is on step 3 of 5, currently compensating step 2, retried once" is impossible for Aspire (OTel shape only) or Scalar (static schema) to express. The archetypal complementary capability.

**4. Trigger firing history + enable/disable overrides (pain 5).** `TriggerEvent` records every fire (scheduled/webhook/file-watch/queue/stream/manual) with attempt count, status, and discriminated payload; `GET /events/subscribe` streams them live. Runtime enable/disable overrides (`POST .../enable|disable`) let a dev silence a misbehaving trigger without redeploy — a control action with immediate feedback that no other tool offers. Schedule-preview (`computeNextFireTimes`) answers "when does this cron *actually* next fire, given tz + backfill" — a constant dev question.

**5. Plugin registry + doctor + contribution-axis map (pain 4).** Cross-cutting "what's installed, what does each plugin wire into (routes/db/workers/streams/telemetry), and is it healthy" — `PluginDoctorReport` and the 8-10 contribution axes are CLI-only today. Nothing else in the toolchain shows this fleet-level wiring view. This is also the dogfood centerpiece: the tool that shows the plugin system is itself a plugin contributing panels through the same `DashboardPanelContribution` seam.

**6. Config resolution + Aspire topology hand-off (pain 4).** Render the resolved `netscript.config` / `appsettings` NetScript section — declared services/apps/dbs/plugins, saga-store backend, resource mode — as *declared intent*, with each node deep-linking (`WithUrl`) into the matching running Aspire resource. This *is* the "seamless hand-off" the mandate demands: dashboard shows "here's what you configured," Aspire shows "here's it running." Answers "did I wire this right" live instead of as a prose pitfall in docs.

**7. Cron scheduler-vs-config drift (pain 4).** `scheduler.list()` exposes what's *actually scheduled right now* across Deno.cron/node-cron/memory; the scheduler already emits `jobScheduled`/`jobRun`/`jobError` events that nothing subscribes to. Diffing live scheduler state against declared job definitions surfaces a real, silent dev pain: config says a job is scheduled, the live scheduler disagrees. Genuine NetScript-only insight; needs only an event subscriber, no new instrumentation.

**8. Fresh route→contract binding map (pain 4).** `DiscoveredNetScriptRoute` already knows which page routes are bound to a typed route contract and by which authoring form (inline `.withRouteContract()` vs. `.route.ts` sidecar vs. unbound). This is page-routing + contract-binding form — zero overlap with Scalar (which documents backend API routes) or Aspire (processes). A "route wiring" panel showing bound-vs-unbound routes is pure DX-only fact, invisible today outside a silent build log.

**9. DB migration status / drift (pain 4).** Prisma migration status, introspection, and drift detection (`db status`) are CLI-only. Aspire shows the DB *resource* is up; it cannot show *which migrations are pending vs. applied* or that the schema has drifted. Cheap to surface (call the existing use-case from a dashboard-side read API), genuinely complementary, and a frequent "why is my query failing" root cause.

**10. Cross-backend DLQ (queue) + trigger DLQ (pain 4).** "Why did messages die" across KV/Redis/Postgres — `DeadLetterRecord` carries reason/errorCode/payload, `depth()` gives live count, `reprocess()` bulk-replays. Trigger DLQ is the same story at the trigger layer with per-event replay. Both are **currently port-only with no contract** — high value but gated on a thin API slice first. Sequence after 1-9, but flag the co-requisite API issues now so the panels aren't stranded.

**11. Contract coverage / RPC-vs-REST duality (pain 3).** Which oRPC routes lack `.describe()`/`.method()` and are silently degrading the Scalar spec — Scalar renders the emitted spec but can never show *why* an operation is thin. Plus the parallel-surface view: "this contract route serves REST at `/api/*`, typed RPC at `/api/rpc/*`, consumed by SDK client Z." Both live above the OpenAPI boundary, invisible to Scalar, and directly answer "why is my generated docs page empty."

**12. Telemetry instrumentation-coverage map (pain 3).** Not trace data (Aspire's job) — the *wiring* fact: which primitives (job/saga/trigger/worker/kv/queue/scheduler/genai) are actually registered to emit telemetry vs. configured-but-unwired. A correctness check that explains "why is this saga missing from Aspire's traces" — a question you can only answer by knowing NetScript's own instrumentation registry, which Aspire structurally cannot see.

**Sequencing note:** items 1-5 are contract-shipped or nearly-free (build UI only) → beta.6 core. Items 6-9 are cheap reads of existing use-cases → beta.6. Items 10-12 need a thin API/contract slice first → file co-requisite issues, sequence after. Streams, Auth, AI-chat, Service-health, KV, Watchers → fold or defer per the capability sweep. Every panel arrives through the `DashboardPanelContribution` seam; every Aspire touch-point flows through the widened Seam A (`command`/`app` kinds) so the dashboard stays a satellite of Aspire's control surface, never a rival to it.


# Appendix B — NetScript capability inventory (coverage sweep a)

Now producing the final report.

# NetScript Dev-Dashboard Capability Sweep (beta.6 rescope)

Scope: runtime-observable or config/codegen state that only NetScript knows — excludes anything the Aspire dashboard (resources/console-logs/traces/metrics) or Scalar (API reference/try-it) already renders well.

## 1. Workers plugin (`packages/plugin-workers-core`, `plugins/workers`)

| Name | Where | Runtime behavior | State entities / lifecycle | Visibility |
|---|---|---|---|---|
| Job registry | `registry/kv-job-registry.ts`, `memory-job-registry.ts` | Jobs registered from local/db/plugin/remote sources, normalized via `JobDefinitionSchema` | `JobDefinition`: id, topic, schedule, timeout, maxRetries, priority, enabled, tags, source (`database|local|plugin|remote`), pluginId, permissions | CLI-only (no `jobs list` UI) + oRPC contract exists (`GET /jobs`) but unconsumed by any UI |
| Task registry | same file family | Shell/deno/python/dotnet/powershell/cmd/executable task defs | `TaskDefinition`: type (7 exec kinds), args, cwd, env, inlineScript, source (`inline|local|plugin|remote|shared`) | Same as jobs — contract exists, no UI |
| Job/task executions | KV keys `executions/job/*`, `executions/task/*`, `executions/by-status/*`, `executions/by-correlation/*` | Every trigger→execution creates an `ExecutionRecord`; status transitions tracked; retried per `attempt`/`maxAttempts` | `ExecutionRecord`: status, triggeredBy, startedAt/completedAt, exitCode, duration, error, workerId, attempt/maxAttempts, correlationId | Invisible today — KV-only, status-count aggregation keys exist (`statusCount`) but nothing renders them |
| Workflows | `domain/workflow.ts` | Multi-step orchestration of job/task/sleep steps | `WorkflowExecutionStatus` (pending/running/completed/failed/cancelled), `WorkflowStepStatus` (completed/failed/skipped), step kinds (job/sleep/task), per-step durationMs | Invisible — no CLI command surfaces workflow runs today |
| Real-time SSE feed | `domain/job-spec.ts` `SSEEventTypes` | `execution.created/updated/deleted`, `job.registered/updated/unregistered`, `task.*`, `worker.status`, `heartbeat` | Event envelope with type/data/timestamp/id, reconnect-capable | API-only (`GET /subscribe` in contract) — **this is a pre-built live feed a dashboard could just tap into** |
| Full oRPC contract | `contracts/v1/workers.contract-definition.ts` | 21 routes: CRUD jobs/tasks, trigger, executions list/get/query/by-correlation, task-executions, cleanup, archive, seed, subscribe, topics | Already typed, versioned, SSE-capable | **Highest dashboard ROI: contract shipped, zero UI consumer** |

**Verdict:** Workers is the single strongest dashboard candidate — a full CRUD+SSE oRPC API already exists and is completely unused by any UI. Aspire shows the *process* is up; only NetScript knows job/task/execution/workflow state inside it.

## 2. Sagas plugin (`packages/plugin-sagas-core`, `plugins/sagas`)

| Name | Where | Runtime behavior | State entities | Visibility |
|---|---|---|---|---|
| Saga instances | `domain/saga-state.ts`, KV via saga store port | Long-running stateful process instances keyed by correlation | `SagaStateEnvelope`: instanceId, version, status (`pending/running/completed/failed/compensating/cancelled`), durability tier (t1/t2/t3), createdAt/updatedAt/completedAt | Contract exists (`GET /instances`, `GET /instances/{sagaName}/{correlationId}`) — no UI |
| Transitions / history | `domain/saga-transition.ts` | Every handler invocation persists a from→to state diff | `SagaTransitionRecord`: transition (from/to/status/message/occurredAt), version | Contract route `GET /instances/{sagaName}/{correlationId}/history` exists — unused by UI. **This is a state-machine timeline only NetScript can show; Aspire has no concept of saga steps** |
| Cascaded messages / compensation | `domain/cascaded-message.ts`, constants `CASCADED_MESSAGE_KINDS` | Handler emits send/scheduled/spawn/complete/fail/**compensate** messages | Kinds: send, scheduled, spawn, complete, fail, compensate | Invisible — no route surfaces cascaded message queue depth |
| Retry policy / outbox (T2) | `domain/retry-policy.ts`, `ports/saga-outbox-port.ts` | Exponential backoff retry (maxAttempts, backoffCoefficient); reserved transactional outbox for atomic commit | `RetryPolicy` (maximumAttempts, intervals, coefficient, non-retryable error types); `SagaOutboxRecord` (messages, createdAt, publishedAt) | Invisible/reserved — outbox not yet wired to any store, worth flagging as future dashboard panel |
| Idempotency / applied-keys | `runtime/saga-applied-keys.ts`, `ports/saga-idempotency-port.ts` | Dedup window (24h default) prevents double-processing | Applied-key set per instance | Invisible |
| Publish/subscribe SSE | contract `POST /publish`, `GET /subscribe` (eventIterator) | Manual message publish + live saga SSE stream | `SagaSSEEvent` | API-only |

**Verdict:** Saga instance status + step/compensation timeline is the archetypal "only NetScript can know this" capability — nothing else in the stack (Aspire, Scalar) models a saga's in-flight compensating state.

## 3. Triggers plugin (`packages/plugin-triggers-core`, `plugins/triggers`)

| Name | Where | Runtime behavior | State entities | Visibility |
|---|---|---|---|---|
| Trigger definitions | `domain/trigger-definition.ts`, `builders/define-*.ts` | Scheduled (cron), webhook, file-watch trigger kinds | `TriggerDefinition` per kind | Contract `GET /triggers`, `GET /triggers/{id}` — no UI |
| Enable/disable state | `ports/trigger-enabled-state-port.ts` | Runtime override toggles a trigger without redeploy | `TriggerEnabledStateOverride`: triggerId, enabled, updatedAt | Contract routes `POST /triggers/{id}/enable\|disable` exist — invisible without UI |
| Trigger events | `domain/trigger-event.ts` | Every fire (scheduled/webhook/file-watch/queue/stream/manual) creates an event with attempt count and status | `TriggerEvent`: kind, status (`TriggerEventStatus`), payload (discriminated per kind: webhook/file-watch/scheduled/queue/stream/manual), attempt, detectedAt/updatedAt, idempotencyKey | Contract `GET /events`, `GET /events/{id}`, `GET /events/subscribe` (SSE) — unused |
| Dead-letter queue | `ports/trigger-dlq-port.ts` | Retry-exhausted events land in DLQ with replay capability | `TriggerDlqEntry`: reason, failedAt, attempts, replay(eventId) | **Invisible — no route exposes DLQ list/replay in the contract at all; a real gap** worth flagging for both API and dashboard |
| Scheduled fire-time computation | `runtime/compute-next-fire-times.ts` | Computes next N cron fire times respecting timezone + backfill spec | `ScheduledTriggerSpec` (cron, timezone, persistent, backfill) | Contract `GET /triggers/{id}/preview` — schedule preview exists but unused |
| Webhook test delivery | `runtime/create-webhook-test-delivery.ts` | Simulates an inbound webhook without a real HTTP call | Test delivery result | Contract `POST /webhooks/{id}/test` — CLI/API only, good "try it" dashboard candidate distinct from Scalar (Scalar tests *your app's* routes, not trigger ingress semantics) |
| File-watch adapter | `adapters/watchers-file-watcher-adapter.ts` | Wraps `@netscript/watchers` (native/polling/hybrid strategy, stability checks, content-hash dedup) | `WatchEvent`: path, kind (create/modify/remove), contentHash | Invisible — logs only |

**Verdict:** Trigger firing history + DLQ + enabled/disabled overrides is a second flagship dashboard domain. The DLQ contract gap (`TriggerDlqPort` has no route) should be flagged to the epic as a co-requisite API slice before a DLQ dashboard panel can exist.

## 4. Streams plugin (`packages/plugin-streams-core`, `plugins/streams`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Stream schema | `domain/stream-schema.ts`, `builders/define-stream-schema.ts` | Declares State-Protocol collections (insert/update/upsert/delete) per entity type, backed by `durable-streams` | `StreamStateDefinition` map: collection name → schema/type/primaryKey | CLI diagnostic only (`inspectStreamTopic` — package/target/collections/streamPath/producerId), no contract, no route |
| Stream producer | `application/create-service-stream-producer.ts`, `ports/stream-producer-port.ts` | Publishes `upsert`/`delete` change events to a durable stream topic; flush/close lifecycle | No queue-depth/offset/subscriber tracking currently modeled — outbound-only producer port | **Invisible; genuinely thin today.** No offset/consumer-lag primitive exists yet in this package — a dashboard panel here would require new instrumentation, not just UI on existing data |
| Diagnostics | `diagnostics/inspect-stream-topic.ts` | Static inspection of a schema's collection count | Diagnostic report object | CLI-only |

**Verdict:** Streams is the weakest current candidate — it lacks runtime state (no offsets, no subscriber registry, no consumer lag) unlike workers/sagas/triggers. Don't build a "streams dashboard" without first shipping the missing instrumentation; note this as a program dependency, not a UI gap.

## 5. Auth plugin (`packages/plugin-auth-core`, `plugins/auth`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Session stream | `streams/mod.ts` | Session projection via durable stream (`AuthSessionSchema`, `AUTH_SESSION_STATES`) | `AuthSession` + state enum | Invisible |
| Auth events | same file | `auth.signin.started/failed`, `auth.token.refreshed`, `auth.session.revoked`, `auth.oidc.completed` | `AuthStreamEvent`: sessionId, userId, providerId, subject, reason | Invisible — event stream exists but nothing subscribes for dev visibility |

**Verdict:** Low priority for beta.6 — auth-core is thinner than workers/sagas/triggers and overlaps somewhat with what a real auth provider dashboard (Auth0/WorkOS console) already shows. Not a strong differentiator; skip unless scope expands.

## 6. AI plugin (`packages/plugin-ai-core`, `packages/ai`, `plugins/ai`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Model registry | `packages/ai` model registry/ports | Registered model providers/capabilities | Model descriptors | Contract `GET /models` — Scalar would show the *shape*, not which providers are actually bound at runtime |
| Tool registry | `ai/src/ports/tool-registry.ts`, `tools/application/registry.ts` | register/unregister/resolveHandler at runtime; default no-op registry unless host wires one | `ToolDescriptor` list, handler presence | Contract `POST /tools/{name}` invokes — no route lists *which* tools are currently registered live |
| Chat/agent loop | `ai/src/agent/loop.ts`, `state.ts`, `history.ts` | SSE-framed chat with tool-call turns | Agent state, history | Contract `POST /chat` (SSE) — a live "who's calling what tool right now" view is NetScript-only; Scalar can't show streaming agent turns |

**Verdict:** Medium priority. The genuinely NetScript-only slice is "which providers/tools are actually bound at runtime" (vs. the static contract shape Scalar shows) and live in-flight chat/tool-call activity — not a duplicate of Scalar's static reference.

## 7. Plugin system (`packages/plugin`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Plugin manifest / capabilities | `protocol/manifest.ts` | Static declared capabilities: `hasDatabaseMigrations`, `hasRoutes`, `hasBackgroundWorkers`, provider metadata (category, port-range bucket, default permissions, concurrency env var, infra requires/optional-deps) | `PluginManifestCapabilities`, `PluginManifestProvider` | CLI-only (`plugin info`) |
| Plugin registry | `application/plugin-registry.ts` | In-memory map of loaded manifests by name at boot | registered plugin list | Invisible at runtime (only populated during CLI/codegen, not exposed at app runtime) |
| Plugin doctor | `cli/.../doctor-plugin-command.ts` | Runs health checks per installed plugin | `PluginDoctorReport`: plugin, status, check, message (tabular) | **CLI-only today — direct dashboard candidate: "plugin health" panel, complements neither Aspire nor Scalar** |
| Contribution axes | `abstracts/plugin-*-contribution.ts` | 8 contribution types: aspire, background-processor, contract-version, db-schema, e2e, migration, runtime-config-topic, service, stream-topic, telemetry | Per-plugin declared contribution modules | Invisible — no view of "which plugin contributes what" across the installed set |

**Verdict:** Plugin registry state + doctor health + contribution-axis map is a strong, genuinely unique dashboard domain: "what plugins are installed, what do they wire into (routes/db/workers/streams/telemetry), are they healthy." Nothing else in the toolchain shows this cross-cutting view.

## 8. CLI / codegen / scaffold state (`packages/cli`)

| Name | Where | Runtime/build behavior | State | Visibility |
|---|---|---|---|---|
| Plugin registry codegen | `generate-plugin-registries-command.ts` | Walks project source, extracts plugin contributions, emits generated registry files; supports `--dry-run` | Emission diff (dry-run vs written), verbose path list | CLI-only, ephemeral — no persisted "last generation" state to show in a dashboard unless captured to a file |
| Runtime schema generation | `generate-runtime-schemas-command.ts` | Generates schemas from `runtime/*` topic config | Generated schema file diffs | CLI-only |
| DB commands | `db/init`, `generate`, `migrate`, `seed`, `status`, `introspect`, `studio`, `reset` | Prisma-backed migration status, schema introspection | Migration status list, drift detection | CLI-only — **migration status is Aspire-adjacent (Aspire shows the DB resource is up) but NOT the same as "which migrations are pending/applied" — genuinely complementary** |
| Plugin lifecycle commands | `plugins/install|remove|update|list|new|scaffold|host|info` | JSR-based plugin install, scaffold source-copy or API-kind install | Installed plugin versions vs. latest | CLI-only — version-drift view (installed vs. published) is a good dashboard tile |
| Deploy commands | `deploy/build|copy|install|start|stop|status|logs|target|uninstall|upgrade` | Bare-metal/systemd/servy process lifecycle outside Aspire's dev-loop | Process status, deploy target config | CLI-only — out of scope for a *dev* dashboard (production concern) |

**Verdict:** Two concrete additions: (a) DB migration status/drift, (b) installed-plugin version drift vs. published — both config/state facts no other tool surfaces, both cheap to read (no new instrumentation, just call the existing use-cases from a dashboard-side API).

## 9. Config resolution (`packages/config`, `packages/runtime-config`, `packages/aspire`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| `netscript.config` resolution | `config/src/public/mod.ts`, `diagnostics/inspect-config.ts` | Typed project config: services, apps, databases, plugins map | Resolved config object (service/app/db/plugin counts) | CLI diagnostic only (`inspectConfig`) — no live view of "what did the app actually resolve at boot" |
| Aspire/appsettings topology | `packages/aspire/config.ts`, `types.ts` | `NetScriptConfig` section of `appsettings.json`: service/app/plugin/database/cache/tool entries, resource mode, saga store backend, OTel config | Full resource topology as *configured intent* | Invisible as a NetScript-native view (Aspire shows resources *running*, not the declared NetScript-level intent/mapping) — **prime hand-off target: dashboard shows "here's what's configured," deep-links into the matching Aspire resource** |
| Hot-reloadable runtime overrides | `runtime-config/src/domain/types.ts`, `application/loader.ts`, `application/watcher.ts` | Live file-watched overrides for 5 topics: jobs, sagas, triggers, features, tasks; versioned via `current` pointer | `RuntimeConfig`: JobOverride/SagaOverride/TriggerOverride (enabled, schedule, timeout, retries, concurrency), `FeatureFlag` (enabled, rolloutPercentage), `RuntimeTask` | **Console-log only today** (`summarizeRuntimeConfig` prints "Disabled jobs: X, Y") — there's already a filesystem watcher (`application/watcher.ts`) wired for hot-reload; wiring its change events into a dashboard SSE feed is nearly free and shows live "someone just flipped feature flag X" — a textbook only-NetScript-can-know capability |
| Version pointer | `runtime-config` `VersionPointer` | Tracks active versioned topic file per category | version label + per-topic file path | Invisible |

**Verdict:** Runtime-config hot-reload state (feature flags, disabled jobs/sagas/triggers, live watcher) is arguably the *best* single feature for the dashboard: it already has a live filesystem watcher, is currently only visible as scrollback console text, and is impossible for Aspire or Scalar to know about (it's NetScript's own override layer, not infra).

## 10. Fresh routing (`packages/fresh`)

| Name | Where | Runtime/build behavior | State | Visibility |
|---|---|---|---|---|
| Route manifest generator | `application/route/manifest.ts`, `manifest-types.ts` | Walks `routes/`, infers Fresh patterns, detects route-contract binding form (`inline` via `.withRouteContract()`, `sidecar` via `.route.ts`, or `default`/unbound) | `DiscoveredNetScriptRoute`: routePattern, routeKeyPath, pageModuleForm, inlineContractBody presence, boundRouteCount vs routeCount | Build-time log only (`logLevel: silent\|changes\|verbose`) — **no view of "which routes are contract-bound vs. not," which is exactly the kind of DX-only fact Scalar (API routes) and Aspire (process resources) cannot show since this is page-routing + contract-binding form, not API surface** |
| Route contract sidecars | same | `.route.ts` files paired 1:1 with page modules | binding form per route | Invisible |

**Verdict:** A "route wiring" panel — which page routes exist, which are bound to a typed route contract (and by which authoring form) — is unique DX surface with zero overlap with Scalar (which documents backend API routes, not Fresh page routes) or Aspire.

## 11. Telemetry (`packages/telemetry`, ports/adapters restructure #403)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Tracer provider port | `ports/tracer-provider-port.ts` | Single port abstracting the OTel tracer provider (post-#403 restructure) | Provider binding | **Aspire-visible** (traces render in Aspire dashboard) — do not duplicate |
| Instrumentation registry | `diagnostics/inspect-telemetry.ts`, `application/registry` | Tracks which NetScript primitives (job/saga/trigger/worker/kv/queue/scheduler/genai) have instrumentation wired | `InstrumentationEntry` list (names) | CLI diagnostic only — **this is NOT trace data (Aspire's job), it's "which instrumentation modules are actually registered for this app" — a config/wiring fact, legitimately complementary** |
| Attribute conventions | `attributes/{job,saga,trigger,worker,kv,messaging,scheduler,genai,sse}.ts` | Static naming convention per span type | Convention catalog | Docs-only, not runtime |

**Verdict:** Skip trace/span visualization entirely (Aspire's job). The one legitimate telemetry-domain dashboard fact is "instrumentation coverage" — which primitives are actually emitting telemetry vs. configured-but-unwired — a wiring-correctness check, not trace duplication.

## 12. Queue (`packages/queue`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Message queue abstraction | `ports/message-queue.ts` | Fedify-based wrapper over Deno KV/Redis/RabbitMQ; ack/nack, delivery count, visibility timeout, concurrency | `MessageContext`: messageId, deliveryCount, enqueuedAt, headers | Invisible — underlies workers/triggers but has no queue-depth or listen-status view |
| Dead-letter store | `ports/dead-letter.ts`, `adapters/{kv,redis,postgres}-dead-letter-store.ts` | Terminal failures (`max_attempts_exceeded`, `nack_without_requeue`, `validation_failed`) persisted with full reason/errorCode/errorMessage; `reprocess()` replays in bulk | `DeadLetterRecord`: messageId, queueName, payload, deliveryCount, enqueuedAt/failedAt, reason, errorCode/Message; `depth()` gives live count | **Invisible/no route at all** — this underlies both workers and triggers' own DLQ concepts but has zero CLI or API surface today. Prime candidate + prerequisite: needs a thin contract before a dashboard panel can show it |

**Verdict:** Generic DLQ depth/list/reprocess across all three backends (KV/Redis/Postgres) is a cross-cutting "why did messages die" view distinct from anything Aspire/Scalar offer — but requires a new API route first (currently port-only, no contract).

## 13. Cron scheduling (`packages/cron`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Scheduler event map | `ports/scheduler.ts`, `ports/types.ts` | Emits `jobRun`, `jobError`, `jobScheduled`, `jobUnscheduled` as in-process events | `JobRunEvent` (jobId, name, result, nextRun), `JobLifecycleEvent` (jobId, name, ScheduledJob metadata) | Invisible — event emitter exists (`scheduler.on(...)`), nothing subscribes for dev visibility; this is the underlying primitive that both workers and triggers schedule on |
| Scheduled job list | `scheduler.list()` | Runtime-agnostic (Deno.cron/node-cron/memory) | `ScheduledJob[]`: id, name, schedule, timezone | Invisible — worth surfacing "what's actually scheduled right now" distinct from the static job *definitions* (drift between config and live scheduler state is a real dev pain point) |

**Verdict:** "Live scheduler state vs. declared job config" (drift detection) is a genuine NetScript-only insight.

## 14. Watchers (`packages/watchers`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| File watch strategies | `strategies/{native,polling,hybrid}.ts` | Debounced/stability-checked FS watching feeding triggers' file-watch adapter | `WatchEvent`: path, kind, contentHash; strategy identifier | Invisible/logs-only — feeds the triggers plugin (see §3); a dashboard panel here is really "trigger firing history," not a separate watcher panel |

**Verdict:** Fold into the Triggers file-watch view rather than a standalone watchers panel.

## 15. KV (`packages/kv`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Reactive KV abstraction | `application/{auto-detect,keys}.ts`, `adapters/redis` | Backend auto-detection (Deno KV/Redis/in-memory), reactive subscriptions | Backend binding, active subscriptions | Invisible — mostly a low-level primitive consumed by workers/sagas/triggers registries; no independent dashboard value beyond "which KV backend is bound" (one config fact, folds into config/topology panel) |

**Verdict:** No standalone panel; surface as one line in the config/topology view (§9).

## 16. Service health (`packages/service`)

| Name | Where | Runtime behavior | State | Visibility |
|---|---|---|---|---|
| Health check primitives | `primitives/health.ts` | `/health` endpoint aggregating db/kv/service checks | `HealthResponse`: status (healthy/degraded/unhealthy), per-check latency/message | **Aspire-adjacent** — Aspire already tracks resource liveness; low differentiation. Skip unless a check name is NetScript-specific (e.g., a saga-store or trigger-scheduler custom check) |

## Priority ranking for beta.6 rescope

1. **Workers**: full oRPC CRUD+SSE contract already shipped, zero UI consumer — build the UI, no new backend work.
2. **Sagas**: instance status + transition/compensation timeline — contract shipped, zero UI consumer.
3. **Triggers**: firing history + enable/disable overrides — contract shipped; DLQ needs a new route first (flag as co-requisite issue).
4. **Runtime-config hot-reload**: feature flags + disabled-entity overrides + live watcher — currently console-log only; cheapest, most differentiated win (genuinely nothing else can know this).
5. **Plugin registry/doctor/contribution map**: CLI-only today, cross-cutting "what's installed and is it healthy" view.
6. **Config/Aspire topology hand-off**: render declared `netscript.config`/`appsettings` NetScript section with deep links into the matching Aspire resource — this *is* the complementary hand-off mechanism the mandate asks for, though no Aspire extension/deep-link API exists yet (gap to file).
7. **Fresh route-contract binding state**: unique DX fact (bound vs. unbound routes, authoring form), zero overlap with Scalar.
8. **Queue DLQ / cron scheduler drift**: valuable but requires new contract routes before a UI can exist — sequence after the above.
9. **Streams, Auth, AI, Service-health, KV, Watchers**: fold into other panels or defer — either too thin on runtime state today (streams) or overlapping with existing tools (service health, AI's static contract shape).

**Cross-cutting gap found**: no `PluginAspireContribution`-style mechanism today exists for a plugin (or the dashboard itself) to register a deep link *into* the Aspire dashboard or Scalar from NetScript's own UI — the mandate's "seamless hand-off" requirement has no existing API surface to build on; this should be an explicit slice in the rescoped epic, not assumed to already exist.


# Appendix C — Aspire dashboard capability map + extension surface (coverage sweep b)

# Aspire Dashboard Capability Map + Extension Surface (for beta.6 Dev Dashboard rescope)

## A) CAPABILITY MAP — what the Aspire dashboard already shows out of the box

### Resources page (default home)
- **Resource list**: every project/container/executable with Type, Name, **State** (running/stopped/error, with error-count badge), **Start time**, **Source** (on-disk location), **Endpoints** (live URLs), a **Logs** link, and an **Actions** column.
- **Resource graph view**: visual DAG of resource dependencies, zoomable, click-to-inspect.
- **Resource actions**: Stop/Start/Restart per resource (state-aware enable/disable); ellipsis submenu adds View details, Console log, Structured logs, Traces, Metrics — each a direct deep-link into the corresponding monitoring page pre-filtered to that resource. Actions greyed out per-resource-type where not applicable (e.g. no structured logs for a plain container).
- **Resource details** page: comprehensive per-resource property view (env vars, config, endpoint list, etc.) — token-gated because it can contain secrets.
- **Text visualizer**: any long/JSON/XML column value can be opened in a modal viewer, copy-to-clipboard.
- **Resource-type filter** and search bar for large graphs.
- **Replica awareness**: `WithReplicas` resources appear as a parent `(application)` node with nested per-instance rows; console logs and telemetry filtering can target one replica or "all instances."

### Console logs page
- Live stdout/stderr stream per resource, colorized by severity for projects; different but still verbose formatting for containers/executables. Download-to-file per resource. Pause/Remove-data controls scoped to this page only.

### Structured logs page
- OpenTelemetry-based semantic log table: Resource, Level, Timestamp, Message, **Trace** link (jumps to the trace), Details. Free-text + level filter bar, plus an advanced filter dialog keyed on arbitrary log attributes. Error badges on Resources page deep-link here pre-filtered to `level=error` for that resource.

### Traces page
- Full distributed-trace list: Timestamp, Name (prefixed by originating project), Spans (participating resources), Duration (with a radial visual comparator). Filter by name/span text, or a structured **Add filter** dialog with parameter+condition+value (e.g. `http.route`). "Combine telemetry from multiple resources" lets you view all replicas of one logical resource as one stream.
- **Trace details**: start time, duration, resource count, depth, total span count; a per-span row table with error icons, client/consumer arrow icons for calls leaving the traced system (external HTTP/DB), a **View Logs** button that jumps to Structured logs filtered to that trace, span-detail drill-down including span event timings (e.g. cache call phases), and a filter box for spans within one large trace.
- Each trace/resource gets a stable generated color reused across the traces list and detail view for visual correlation.

### Metrics page
- Per-project meter/instrument selector; chart or table view for any instrument; filter chips on chart dimensions (e.g. `http.request.method=GET`); toggle between value and count aggregation.
- **Exemplars**: metric data points link directly to the specific trace/span that produced them (dot markers on the chart, click-through to Trace details) — a genuine metrics↔traces bridge already built in.

### GenAI telemetry visualizer
- A specialized dialog for chat/embedding/AI-operation telemetry (via `Microsoft.Extensions.AI` or `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`) — timing, metadata, and (if content-capture is enabled) actual prompt/response content, rendered as a conversation-shaped view rather than a flat span table.

### Cross-cutting telemetry controls
- **Pause** collection independently per page (console/structured/traces/metrics).
- **Remove data** per-page, scoped to current resource or all.
- **Manage logs and telemetry** dialog: grid of every resource × data-type (Resource/Console/Structured/Traces/Metrics) with checkbox export (zip of OTLP-JSON + text files, `aspire-telemetry-export-{ts}.zip`), import (accepts previously exported zip/json, ≤100MB), and bulk remove — this is effectively a built-in telemetry snapshot/sharing mechanism already.
- **Retention**: in-memory only, auto-eviction caps (`MaxLogCount=10,000`, `MaxTraceCount=10,000`, `MaxMetricsCount=50,000/resource`, `MaxAttributeCount=128`, `MaxResourceCount=10,000`) — no cross-restart persistence, no forwarding to an external backend while also serving the dashboard.

### Notification center
- Bell icon + unread badge; log entries for every resource-command lifecycle transition (started/succeeded/failed/canceled) plus system events; success/error notifications carrying a command result get a **View response** action opening the text visualizer. Capped at 100 entries, auto-evicting oldest.

### Interaction prompts (interaction service, C#-AppHost only — see B)
- Input dialogs for missing config, confirmation dialogs for risky actions, status notification messages — rendered natively in the dashboard chrome when the AppHost (C#) calls the interaction service.

### Auth, theming, shortcuts, settings
- Token-based login (URL carries `?t=<token>`, persists 3 days as a cookie) unless launched from an IDE extension that auto-logs-in.
- Settings dialog: theme (system/light/dark, persisted), language, dashboard .NET version, and the Manage-data dialog described above.
- Full keyboard shortcut set for page navigation (`R`/`C`/`S`/`T`/`M`) and panel manipulation.

### Health status
- Resource **State** reflects health/run state and surfaces via the same Resources-page badge and graph coloring; health probes are configured AppHost-side (`WithHttpHealthCheck` family in C#) and reflected as part of resource state, not a separate dashboard page. NetScript's own `packages/aspire/src/domain/health-check-spec.ts` (`HealthCheckSpec { resource, url, expect, timeoutMs }`) models this domain concept, but it is not yet wired to a real `withHealthCheck()` call in the generated `register-apps.mts` template (confirmed: no `withHealthCheck`/`WithHealthCheck` occurrence in `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`) — health-check *authoring* is a gap independent of the dashboard's own display of it.

**Judgment for duplication**: anything that is "OTLP data about a running resource, rendered as a list/graph/chart/trace-tree" is fully owned by Aspire today and already has an in-repo working query path (`fetchDashboardTraces()` template, `otel-gates.ts` E2E gate) against the documented `/api/telemetry/*` surface. A NetScript dashboard that re-renders resource lists, console logs, structured logs, trace waterfalls, or metric charts is strictly redundant — Aspire already does all of it, including cross-resource combination, exemplar↔trace linking, GenAI-shaped views, and export/import. The one place Aspire is silent is *why* a NetScript-specific primitive (a saga step, a trigger firing, a stream cursor, a plugin's registry entry, a config-resolution decision) behaved as it did — Aspire only sees the OTel/log/process shape, never the NetScript domain model.

## B) EXTENSION SURFACE — every mechanism to extend or hand off from Aspire

| Mechanism | What it enables | How a NetScript dev-dashboard link/panel would use it |
|---|---|---|
| **`withCommand(name, displayName, executeCommand, options)`** (TS SDK, confirmed real — `builder.addNodeApp(...)`, `addExecutable(...)`, etc. all return a resource builder with this method) | Adds a button to the resource's Actions/ellipsis menu. `ExecuteCommandContext` gives async `resourceName()`, `cancellationToken()`, `logger()`, `arguments()`. Result is a plain `{success, message?, data?}` object shown in the notification center + text visualizer. Same registration is simultaneously invokable from `aspire resource <name> <command> [args]` CLI and from MCP tool calls — "one seam, three surfaces." | Register a `"Open NetScript Dashboard"` (or `"Inspect saga run"`, `"View plugin registry"`) command on every NetScript-managed resource (deno-service, deno-background, app). `executeCommand` returns `{success:true, data:{value: dashboardDeepLinkUrl, format: CommandResultFormat.Text}}` — the dashboard's own notification/text-visualizer surfaces the link, and the same command is scriptable from CI/agents. Because it's reachable from CLI+MCP too, an AI agent debugging via Aspire's MCP server gets a NetScript-dashboard link for free. **Gap**: `packages/aspire`'s `AspireResourceKind` union (`'deno-service' | 'deno-background' | 'container' | 'database' | 'cache'`) and the `AspireNSPluginContribution` seam have no "command" contribution kind today — `withCommand` is reachable only by hand-editing a `register-*.mts` generator directly against the raw SDK builder, not through a plugin's `contribute()` return value. Widening that seam (or adding a fixed, framework-owned command emitted by every `register-apps.mts`/`register-services.mts` app entry) is the concrete unlock. |
| **`commandOptions.arguments` (`InteractionInput[]`) + `confirmationMessage`** | Renders a parameterized input dialog or confirmation prompt in the dashboard before running a command — the *only* TS-reachable substitute for the (C#-only) interaction service. Works identically from the CLI. | Use for any dashboard action that needs a parameter (e.g. "replay saga step N" wants a step id, "clear plugin registry cache" wants a confirm). Do not design around a hoped-for `PromptInputAsync`-style call — confirmed absent from the TS AppHost SDK. |
| **`WithProcessCommand`/`withProcessCommandFactory`** (experimental, `ASPIREPROCESSCOMMAND001`-gated in C#; TS equivalent implied but not confirmed) | Shells out to a local tool on the AppHost machine and streams stdout/stderr into the command result, without hand-rolled process plumbing. | Candidate for a "run `deno task db:migrate`" or "regenerate plugin registry" button directly from the resource menu, if/when confirmed available in the TS SDK generation NetScript consumes. |
| **`ResourceCommandService` via `(await builder.executionContext()).serviceProvider().getResourceCommandService()`** | Lets one command programmatically invoke another resource's command by name (`executeCommandAsync(resourceName, commandName, {cancellationToken})`). | Composite "reset dev environment" command: one dashboard button that internally calls each resource's own reset/clear command — useful if the NetScript dashboard wants a single entry point rather than per-resource buttons. |
| **`WithUrl` / `WithUrls` / `WithUrlForEndpoint`** (confirmed for `ContainerResource`, `ExecutableResource`, `ProjectResource`; fires during `BeforeResourceStartedEvent`) | Attaches one or more custom named URLs to a resource's Endpoints column in the Resources page — either relative to a declared endpoint (`WithUrlForEndpoint`, the mechanism Scalar/Swagger use to surface `/scalar` next to a project's own port) or fully custom/unrelated to any endpoint (`WithUrl` with a plain string). | This is the single cleanest hand-off primitive for "Aspire → NetScript dashboard": attach a `"NetScript Dashboard"` URL to every scaffolded app/service resource pointing at `http://localhost:{dashboardPort}/resource/{name}` (deep-linked to that resource's config/wiring/registry view). A user already on the Resources page clicks straight through — no separate discovery step. **Currently unused** in NetScript's generator (`generate-register-apps.ts` calls only `withHttpEndpoint`/`withBrowserLogs`, no `withUrl`/`WithUrl` occurrence found) — this is a small, high-leverage addition. |
| **`withBrowserLogs()`** (confirmed real, already wired for every `app`-type scaffolded resource via `register-apps.mts`) | Captures client-side (browser) OTel logs/traces/metrics into the same dashboard views as server resources. | Already landed (issue #218 lineage) — no dashboard work needed; the Dev Dashboard should assume browser telemetry for `apps.*` entries is already flowing into Aspire and not re-instrument it. |
| **`Aspire.Hosting.ApplicationModel` custom `IResource`/`IResourceBuilder<T>`** (C#-only extensibility for inventing new resource *types*) | Lets a hosting integration define an entirely new resource shape with its own dashboard rendering rules. | **Not the right seam for NetScript.** `packages/aspire`'s own `AspireResource` (`{name, kind, port?, metadata?}`) is already a closed, NetScript-owned resource shape that adapters turn into real SDK calls — plugins never author raw `IResource` types. Extending *which resource kinds* a plugin can contribute (adding e.g. an `'app'` or `'command'` kind to `AspireResourceKind`) is the actionable extension point, not standing up custom Aspire resource classes. |
| **`/api/telemetry/{resources,logs,spans,traces,traces/{traceId}}`** (documented HTTP query API, Aspire ≥13.2; auto-enabled in AppHost-integrated mode, `x-api-key` auth by default, `?follow=true` NDJSON streaming on logs/spans) | Programmatic read access to everything the dashboard itself shows — resource list, filtered structured logs, filtered spans, full trace-by-ID span sets, live streaming. | NetScript already has a working reference consumer (`fetchDashboardTraces()` template + `otel-gates.ts` E2E gate) parsing this exact `resourceSpans→scopeSpans→spans` shape with `parentSpanId` for cross-service linkage. The Dev Dashboard's own "show me the trace behind this saga step / trigger firing" panel should call this API directly rather than re-implement OTLP ingestion — pull the trace by ID once NetScript's own instrumentation (`packages/telemetry`) stamps a traceparent onto the primitive's internal span, then deep-link *from* the NetScript panel *to* Aspire's own `/traces/{traceId}` UI page (round-trip hand-off) rather than rendering the waterfall a second time. **Stability caveat carried over from prior research**: not explicitly declared stable-for-external-integration by Aspire's docs (contrast Jaeger's `api_v3` gRPC, explicitly "Stable" vs its JSON API, explicitly "undocumented, subject to change") — treat as best-effort, pin the Aspire version, and design the query layer as an isolated adapter that can be swapped if the shape moves. |
| **Aspire CLI (`aspire otel logs/traces/spans`, `aspire export`, `aspire resource <name> <command>`)** | Same telemetry query surface as the HTTP API, but scriptable, remote-dashboard-capable (`--dashboard-url`), and already the agent-facing channel (see MCP row). `aspire export` zips resources/console-logs/structured-logs/traces per resource, OTLP JSON. | Secondary/automation path — not needed for the dashboard's own runtime UI since the HTTP API is directly callable, but relevant if the Dev Dashboard wants a "run this NetScript-aware diagnostic as a CLI-scriptable command" story parallel to Aspire's own. |
| **Aspire MCP server** (`aspire agent mcp`, tools: `list_resources`, `list_structured_logs`, `list_traces`, `list_console_logs`) exposing the same dashboard data to AI coding agents | Standardizes how *any* MCP-capable agent (including a Claude Code session) reads Aspire's telemetry — no dashboard-specific integration needed. | If the NetScript Dev Dashboard ever wants an agent-facing API of its own (e.g. "what does the plugin registry look like right now"), mirror this pattern: a NetScript MCP server/tool set exposing NetScript-only state (config resolution, registry snapshots, saga run state) as the *complementary* half of what Aspire's MCP tools already expose for telemetry. This is a strong naming/positioning cue: Aspire owns the *observability* MCP surface, NetScript should own the *domain-state* MCP surface, not duplicate the former. |
| **Interaction service (`IInteractionService`: `PromptMessageBoxAsync`, `PromptConfirmationAsync`, `PromptInputAsync`, `PromptInputsAsync`)** | Native dashboard-rendered prompts/confirmations/notifications, driven from AppHost code. | **Confirmed unavailable in the TypeScript AppHost SDK** ("not yet available" per aspire.dev), and NetScript's AppHost is generated TypeScript (`language: "typescript/nodejs"`) — so this mechanism is a dead end for NetScript today regardless of Aspire version (13.4.6 pinned, version gate alone doesn't unlock it). Any "are you sure?" / parameterized-input dashboard interaction must go through `withCommand`'s `arguments`/`confirmationMessage` instead (see row 2). |
| **Health checks (`WithHttpHealthCheck` family, C#)** | Drives the Resources-page State/health badge and graph coloring. | NetScript's `HealthCheckSpec` domain type (`{resource, url, expect, timeoutMs}`) already models the concept but is not yet wired to a real `withHealthCheck()` SDK call in the generated apphost (confirmed absent from `generate-register-apps.ts`) — this is an existing gap in NetScript's own Aspire wiring, unrelated to the dashboard rescope, but worth flagging since a "service health" dev-dashboard panel would otherwise duplicate what a properly-wired health check would already surface natively in Aspire's own State column for free. |
| **Standalone dashboard mode (`aspire dashboard run --allow-anonymous`, `ASPIRE_DASHBOARD_API_ENABLED`)** | Runs the dashboard without an AppHost, e.g. to monitor telemetry from any OTel-emitting process. | Not directly relevant to NetScript's AppHost-integrated scaffold mode (API is auto-enabled there already) — noted only because it's the mode eis-chat's `aspire-monitoring` skill documents for remote/CI dashboard access via `--dashboard-url`. |
| **Notification center's command-result surfacing** (`ExecuteCommandResult.message`/`data` auto-populate a notification with a **View response** action) | Lets a command's return payload (e.g. a JSON blob, a link, a status string) become a first-class, dismissable dashboard notification without needing the interaction service. | The natural delivery channel for "your NetScript dashboard command finished, here's what changed" feedback — no custom notification UI needed inside the resource menu itself. |

### Net read for the rescope

The dashboard's *display* surface (resources, all four telemetry pages, GenAI view, notifications, export/import) is comprehensively owned by Aspire and should not be rebuilt. The genuinely open, complementary lanes are: (1) `withCommand` as the action/hand-off seam — currently blocked only by `AspireResourceKind`/`AspireNSPluginContribution` not modeling a "command" contribution; (2) `WithUrl`/`WithUrlForEndpoint` as the *discovery* seam — currently unused, cheapest immediate win, gets a "NetScript Dashboard" link sitting right next to every resource's other endpoints; (3) the documented `/api/telemetry/*` HTTP API as a *read* dependency the NetScript dashboard calls into (never reimplements) to correlate a NetScript-domain event with its underlying trace, then deep-links back out to Aspire's own trace-detail page rather than rendering a second waterfall; and (4) an MCP-tool-shaped surface for NetScript's own domain state, positioned as the sibling of Aspire's telemetry-focused MCP tools rather than a competitor to them.


# Appendix D — Scalar capability map (coverage sweep c)

This gives sufficient detail. Writing the final report now.

## A) What Scalar shows/does (API reference tooling)

Scalar is a client-side, OpenAPI-spec-driven **API reference UI**. Given an OpenAPI (3.x) JSON/YAML document, it renders:

- **Rendered API reference**: every path/operation grouped by tag, with human-readable descriptions pulled from the spec's `summary`/`description`/`.describe()` annotations.
- **Try-it console**: an in-browser HTTP client that lets a developer fill in path/query/body params (validated against the schema), fire the request against a live server, and see the raw response — no Postman/curl needed.
- **Auth handling**: reads `securitySchemes` from the spec (API key, bearer, OAuth2, basic) and lets the user plug in credentials once, reused across all try-it calls.
- **Code samples**: auto-generates request snippets in multiple languages/clients (curl, JS fetch, Python, etc.) per operation, derived purely from the spec shape.
- **Search**: full-text search/filter across operations, schemas, and tags.
- **Server/environment switcher**: picks between the `servers[]` entries declared in the spec (e.g., local vs. staging).
- **Themeable, static-ish rendering**: it's a JS bundle that mounts against a spec URL — no backend logic of its own beyond serving the spec and the bundle.

Everything Scalar shows is **entirely a function of the OpenAPI document**: it has zero visibility into runtime internals, in-process state, queues, or anything not expressible in an OpenAPI schema.

## B) How NetScript currently integrates it

The integration lives in `@netscript/service` (`packages/service/src/primitives/openapi.ts`) as three composable Layer-1 Hono primitives, generated straight from the oRPC contract:

- `createOpenAPISpec(router, config)` — uses oRPC's `OpenAPIGenerator` + `ZodToJsonSchemaConverter` to turn a service's zod-schema'd oRPC router into an OpenAPI document at `/api/openapi.json`. Spec quality is directly proportional to how well the contract is annotated (`.describe()`, `.method()`, named shapes).
- `createScalarDocs(options)` — serves the Scalar HTML shell at `/api/docs`, pointed at `specUrl`, themeable (`kepler` default, `moon`/`purple`/`saturn`/`default`).
- `createScalarJs()` — serves a **locally bundled** Scalar runtime (`packages/service/assets/scalar.min.js`, embedded via `scalar.generated.ts`) at `/api/docs/scalar.js`, so the docs UI works fully offline with no CDN dependency — a deliberate JSR-safe-asset-embedding pattern (text/import-attribute embedding, not `readTextFile`).

This is exposed at three levels: a one-line `defineService(router, { openapi: {...} })` preset option (on by default in every scaffolded service), a fluent `createService().withOpenAPI().withDocs()` builder chain, or hand-wiring the three primitives onto any Hono app. Docs describe it in `docs/site/how-to/expose-openapi-scalar.md`. Key caveats documented: the spec describes the REST surface at `/api/*` (not the typed RPC path at `/api/rpc/*`); the docs/spec are public unless explicitly gated behind `.withAuthn()`; and hand-wiring requires mounting all three routes or the page loads blank.

There is no NetScript-specific customization of Scalar's rendering itself — it's the stock Scalar reference UI reading a generated spec.

## C) The boundary: what's Scalar's job vs. what's fair game for the dashboard

**Scalar already owns (dashboard must NOT rebuild):**
- Rendering any individual service's HTTP/REST API surface — operations, schemas, request/response shapes, tags.
- Try-it / live request execution against a running service, with auth-credential injection.
- Per-operation code-sample generation in multiple languages.
- Full-text search across one service's operations/schemas.
- Anything that is *purely a projection of an OpenAPI document* — if it can be expressed as `servers`, `paths`, `components.schemas`, or `securitySchemes`, Scalar already renders it better than a bespoke NetScript UI would, and duplicating it just adds a second UI to keep in sync with the spec generator.

**Scalar structurally cannot show (fair game for the dashboard) — things that live above/below/across the OpenAPI boundary:**

1. **Contract → spec fidelity gap.** Scalar shows whatever the generator emitted; it cannot show *why* an operation is under-documented (missing zod schema → empty operation), nor which contract routes have no `.describe()`/`.method()` and are silently degrading the spec. A "contract coverage" view mapping oRPC contract routes → spec richness is NetScript-only knowledge.
2. **RPC vs REST duality.** Scalar documents `/api/*` (REST projection); it has no notion of the parallel typed `/api/rpc/*` oRPC endpoint, the SDK client generated from the same contract, or how a given contract route resolves across both surfaces. Visualizing "this contract route serves REST at X and typed RPC at Y, consumed by SDK client Z" is invisible to Scalar.
3. **Multi-service / cross-service wiring.** Scalar is scoped to one spec = one service. It cannot show how services relate: which plugin's contract backs which service, service discovery/registry state across a workspace, or how a saga/trigger/worker's internal contract wires into the service layer. That's exactly the "service/route wiring" and "plugin registry state" surface the dashboard is chartered to own.
4. **Runtime primitive internals** (workers/sagas/triggers/streams behavior) — Scalar shows the *shape* of a workers contract's endpoints, never live job/task state, trigger firing history, saga step progression, or stream backpressure. This is runtime state with no OpenAPI representation at all — Aspire's dashboard shows generic traces/logs, but not NetScript's domain model of "this saga is on step 3 of 5, retried twice."
5. **Config resolution.** Neither Scalar nor Aspire can show how `defineService`/builder options resolved (which `openapi` config block is active, whether `.withAuthn()` gating is actually applied to `/api/docs`, effective CORS/env-derived config) — this is exactly the kind of "did I wire this right" question the docs' own "in-production pitfalls" section warns about, and a dashboard could surface it live instead of as a warning in prose.
6. **Codegen/scaffold state.** Whether the OpenAPI/Scalar wiring for a given service is scaffold-default vs. hand-wired, whether `scalar.js` asset is stale relative to the bundled version, generated-vs-hand-edited file drift — none of this exists in a spec.
7. **Auth/exposure posture across services at once.** Scalar's auth UI is per-service, per-request. A cross-service view of "which services expose `/api/docs` publicly vs. gated" (the exact footgun the how-to doc calls out) is a fleet-level NetScript concern, not a Scalar one.
8. **Handoff, not duplication.** The dashboard's correct relationship to Scalar is a deep link: from a service/route/contract node in the dashboard, jump straight to that service's `/api/docs` (or a specific operation anchor) for the interactive reference — never re-render the operation list itself.

**Bottom line:** Scalar owns the *static, per-service, spec-shaped* API-reference experience end to end. The dashboard's legitimate territory is everything that requires knowledge of the *contract-to-service-to-runtime pipeline* that produced the spec — coverage/fidelity, cross-service/RPC-vs-REST wiring, plugin registry and primitive runtime state, config resolution, and codegen/scaffold drift — plus a deep link back into Scalar (and Aspire) rather than re-rendering what they already do well.


# Appendix E — Prior seed-run research distillation (coverage sweep d)

# Dev Dashboard Prior-Art Distillation (for beta.6 rescope)

Source corpus: `.llm/runs/plan-roadmap-expansion--seed/{design,research,analysis}/A-dashboard/*`, plus `design/B-telemetry/proposal.md` §7. All citations use the file's own section numbers.

## A) Original proposal's thesis + architecture

**Thesis (proposal.md §0 headline).** The dashboard is "the killer feature — an Encore-dev-equivalent local dev console... that dogfoods the plugin system." Its own framing already claims complementarity, not duplication — see §C for where that claim holds and where it drifted.

**Archetype (proposal.md §0, §1.1).** Thin `plugins/dashboard` (ARCHETYPE-5) + fat `packages/plugin-dashboard-core` (ARCHETYPE-2 integration core), modeled on `plugins/streams`/`plugin-streams-core` — **not** `workers` — because the dashboard is "a **read/aggregation/UI-serving** surface — no background processor, no owned DB schema at beta.6" (§1.1). Confirmed on disk (`analysis/04 §1b`): `streams` has no background processors, no DB schema, no contract versions; its manifest is `definePlugin(...).withType('utility')` + one service + telemetry. The dashboard adds only two axes streams lacks: `.withService(...)` (serves the Fresh build-console) and `.withAspire(...)` (extension seam).

**Core-vs-thin split (proposal.md §1.2, analysis/04 §3, thinness law).** Every dashboard-specific domain model, adapter, panel-orchestration use-case, and the oRPC contract belongs in `packages/plugin-dashboard-core`. `plugins/dashboard` owns only the manifest, Fresh UI (routes/islands), scaffold adapter, Aspire wiring, and a contract re-export. Folder shape: `domain/` (ResourceGraph, PanelDescriptor, RunRecord, TraceTree, TraceSpan, LogRecord, ContractCatalogEntry — no impl imports), `ports/` (TelemetryQueryPort, AspireResourcePort, IntrospectionPort, CommandInvokePort), `application/` (panel orchestration use-cases: `buildStackMap()`, `getTraceTree()`, `listRuns()`, `loadCatalog()`, `streamLogs()`), `adapters/` (aspire-otlp-http, aspire-mcp, netscript-graph, command-invoke), `contracts/v1/`, `middleware/` (self-instrumentation), `public/mod.ts`.

**Panel-contribution seam — `.withDashboardPanel` (proposal.md §9.2, epic-and-issues DDX-17).** Verdict: **ADOPT as a contribution-CONTRACT seam owned by `plugin-dashboard-core`, not a new `definePlugin` axis** — Directus precedent (its own Insights dashboard is built on the same `Panel` primitive it exposes to third parties). Realized as a `DashboardPanelContribution` contract (`id/title/icon/capability/component/slots{options,sidebar,actions}/setup()/commands`), **discovered the way `AspireNSPluginContribution` is discovered** — a plugin depending on `@netscript/plugin-dashboard-core` exports a contribution the registry-generation step collects. This "deliberately keeps `@netscript/plugin` dashboard-agnostic" (layering: core must not know about one plugin's surface). Optional `.withDashboardPanel()` sugar is a thin helper producing the same contract, not core coupling. Milestone split: seam + first-party sections (workers/sagas/triggers/streams, DDX-18a-d) is beta.6; third-party ecosystem + in-dashboard marketplace is stable.

**Introspection endpoint (epic-and-issues DDX-13; research/03 §6 Nitro precedent).** A machine-readable `/_netscript/*` JSON dev endpoint (Nitro `/_nitro/tasks` pattern) listing scaffolded plugins, routes, background jobs, stream topics, contract versions — "derived from scaffold/registry, not hand-authored." Feeds Stack Map + Service Catalog panels.

**Telemetry query port (proposal.md §4, epic-and-issues DDX-3).** Beta.6 consumes Aspire `/api/telemetry/*` HTTP (OTLP-JSON) directly at first, behind a `TelemetryQueryPort` in `plugin-dashboard-core/ports/`, so panels never know whether data comes from raw Aspire-HTTP or Topic-B's typed query surface. This is the exact contract Topic-B's `design/B-telemetry/proposal.md §7` offers back: a new `@netscript/telemetry/query` subpath (`queryTraces`, `getTrace`, `queryLogs`/`streamSpans` with `?follow` NDJSON, `queryResources`, `exportTraces`) that wraps Aspire's undeclared-stable JSON so "if Aspire's shape shifts, we absorb it in `adapters/aspire-query`, [the dashboard]'s panels don't change." Telemetry's own sequencing (proposal.md §7 pt 1–2): beta.6-first the dashboard reads raw Aspire OTLP directly (zero dependency, unblocks parallel work); beta.6-converge it switches onto the typed port. Telemetry explicitly draws a boundary: **"the 'what's running' resource graph is Aspire-resource-graph territory... out of scope for `@netscript/telemetry/query`, owned by [the dashboard]'s Aspire seam"** — i.e., telemetry answers "what happened," the dashboard's own `AspireResourcePort`/`netscript-graph` adapter answers "what's running."

**Aspire seam extension (proposal.md §2, epic-and-issues DDX-1).** Two Aspire integration seams exist today and are structurally independent: Seam A (`@netscript/aspire` plugin-contribution via `AspireNSPluginContribution.contribute()` → `AspireResource[]`, closed union missing `app`/`command` kinds) and Seam B (`register-apps.mts`, raw SDK, has `withCommand` but only by hand-editing generated code). Verdict: extend Seam A — add `command` kind (hard beta.6, "what 'control the full stack' *means*") and `app` kind (preferred beta.6, Seam-B fallback if it slips) — because "the tool that controls your plugins is itself a plugin" is only literally true if the dashboard's own Aspire presence flows through the plugin-contribution path, not a hand-edited generator exception. Constraint: no `IInteractionService` (not in the TS AppHost SDK) — every prompt routes through `withCommand`'s `arguments: InteractionInput[]` + `confirmationMessage`, which is a **real, cited** TS API (`research/01 §1`: `resource.withCommand(name, displayName, executeCommand, { commandOptions })`, invokable three ways — dashboard Actions menu, `aspire resource <name> <cmd>` CLI, MCP tool — "one seam, three surfaces").

**CLI/install (analysis/04 §4, proposal.md §1.4).** `plugin add dashboard` needs **no CLI core change** — the public JSR-install path dynamically registers `provider.kind: 'dashboard'` from the plugin's own `scaffold.plugin.json` at install time. Cost is just a correct manifest + `scaffold.ts` + an `officialSource` block for repo E2E.

## B) Competitor/BaaS teardown — the non-observability findings

`research/03` (Encore, Temporal, Inngest, Trigger.dev, Prisma Studio, Nitro) is almost entirely observability/run-console vocabulary — explicitly flagged in this task as already covered by Aspire, so the higher-value material for a rescope is `research/04`'s BaaS/admin-console teardown, which the corpus itself says **"file 03 only had this pattern for *runs*... Appwrite generalizes it to *every* backend primitive, which is exactly Topic A's 'dashboard is how you drive the framework' thesis"** (research/04 cross-synthesis §1).

**1. Per-capability manage-through-UI (Appwrite, research/04 §1) — the strongest non-observability finding.** Every capability (Databases, Auth, Storage, Functions, Messaging) gets its own top-level nav entry, its own fastest-path **create** action (template gallery for Functions, one-click forms elsewhere), a **separate tabbed Settings area** distinct from the create form (permissions/security/build-config as their own panels — e.g. Databases splits Columns/Attributes from a separate Settings→Permissions tab), and — where the capability produces activity — a **dedicated monitor view with its own status vocabulary** (Executions vs. Deployments as two distinct histories; messages get `draft→scheduled→processing→success/failed`). Concrete non-observability specifics:
- **Data browser/editor**: Databases → collection → Columns/Attributes panel (type dropdown + per-type option fields) → Indexes as a sibling tab → documents table with a sticky ID column and quick-action menus.
- **Config editor**: Storage bucket create form carries Settings sub-panels for max file size, extension allow-list, compression, encryption — config-as-part-of-create, buckets start with **zero granted permissions** (explicit-grant default).
- **Auth user management**: a Users list/table (block/delete, session inspection, activity/audit logs, labels/preferences editable per-user) via a dedicated admin-perspective Users API; a Security tab (session-limit, session alerts); and a dev-ergonomics detail — **Mock Phone Numbers** for testing OTP flows without a real SMS provider ("control the framework's own dev ergonomics from the dashboard").
- **Seeding-adjacent**: Messaging's compose form is channel-adaptive (push/email/SMS fields swap in one composer) with topic/user/target-ID audience selection and ISO-datetime scheduling built in — a reusable "one composer, fields adapt to provider" pattern.
- **Dev Keys**: short-lived, rotate-in-place, local-dev-only API keys distinct from production secrets, generated from the dashboard itself — flagged as directly reusable for the Aspire-local dev loop.
- Scopes in the API-key picker **mirror the nav taxonomy 1:1** — "the permission model's taxonomy **is** the capability taxonomy."

**2. Extensibility as a typed contribution taxonomy (Directus, research/04 §2).** Eight named extension types (Interfaces/Displays/Layouts/**Panels**/Modules/Themes + API-side Hooks/Endpoints/Operations), each a documented SDK-contract'd shape (`id/name/icon/component/slots/setup()`), built via a `create-directus-extension` CLI + SDK, distributed through an **in-app Marketplace reachable from Settings** (search/filter/install without leaving the app). Directus's **own** Insights dashboard is built on the same `Panel` primitive third parties use — direct precedent for making the dashboard a panel-registry *consumer*, not just author (adopted in proposal.md §9.2). Also names an **edit-shape vs. show-shape split** (Interface vs. Display) as a distinct vocabulary NetScript's block taxonomy currently lacks.

**3. Config-editor/codegen-from-schema (Directus data-model, research/04 §2(b)).** Configuring a data model happens live in Settings → Data Model: create a collection → "Create Field" → pick an interface type → relationships get a Display Template — and the Content module's CRUD screens, sidebar, and item-detail pages **update automatically with zero hand-written admin-UI code**. Strongest precedent for a schema-driven NetScript `db` tab off Prisma-Next (explicitly deferred to stable, gated on the Prisma-Next migration — proposal.md §9.5).

**4. Codegen-from-UI mirroring the CLI (Strapi, research/04 §3(a)).** Strapi's Content-Type Builder (a dashboard UI) **writes the identical on-disk artifacts** (`schema.json` + controller/route/service under `src/api/<name>/`) that its own `strapi generate` CLI command writes for the same inputs — "the dashboard is not a separate authoring surface with its own output format — it is a second frontend for the same on-disk codegen the CLI drives." Direct precedent for a NetScript "Add resource" dashboard action calling the exact same `createPluginAdapter(...).toScaffold()` machinery the CLI installer uses — "no new codegen engine, just a second caller of the existing one," and must respect **#157** (typesafe factory/AST codegen, never string templates). Scoped as DDX-19, stable (beta.6 stretch if cheap).

**5. AI-on-codegen (Strapi AI, research/04 §3(b)).** Chat/Figma-import/code-analysis input modes all terminate in the same generated artifacts as manual authoring — reusable taxonomy for a future dashboard-AI panel, explicitly deferred as a **cross-epic edge to the flagship AI plugin #238**, not net-new dashboard scope (proposal.md §9.4).

Secondary conventions research/04 flags as carry-worthy but explicitly not beta.6: scopes-mirror-nav for a tokens/API-keys panel; Dev Keys; in-dashboard marketplace.

## C) Where the proposal already said "complementary," and where it drifted

**Complementary framing that is already explicit and load-bearing:**
- Proposal.md §0/§4 treats Aspire's `/api/telemetry/*` as the **data source**, not a thing to rebuild — "beta.6 consumes Aspire `/api/telemetry/*` HTTP... behind a `TelemetryQueryPort`... the port is the swap seam onto Topic-B's query/export surface." No re-implementation of resource/log/trace storage is proposed anywhere; the dashboard is explicitly a read/consumer layer over Aspire's own telemetry store, which is itself acknowledged as in-memory/ephemeral and not to be dual-written (design/B-telemetry §7: "Aspire retention is in-memory only... the dashboard shows live-dev data, not history").
- §2.2 makes the Aspire hand-off explicit and structural: extending `AspireResourceKind`/`AspireBuilder` so the dashboard's own presence is *itself* an Aspire-contributed resource (`app` kind) and its actions are Aspire commands (`command` kind) reachable from "the dashboard Actions menu, `aspire resource <name> <cmd>` CLI, **and** MCP" — i.e. designed as a satellite of Aspire's control surface, not a rival one.
- §3's panel table sources every panel from a **port**, ranked "by reachability... `OTLP/HTTP /api/telemetry/*` (open) → NetScript's own `AspireResource[]` compose graph... → `aspire` MCP tools ... → resource-service gRPC (internal, avoid)" — Aspire/MCP are named as the *first two* preferred sources, not competitors.
- Telemetry's own proposal draws the explicit non-duplication line quoted in §A above: resource-graph/"what's running" stays Aspire's/the dashboard's Aspire-seam territory, telemetry doesn't own it, and vice versa the dashboard doesn't own trace storage.

**Where the plan already drifted toward duplication (self-flagged, not hidden):**
- §3 Panel 1 "Stack Map" and Panel 6 "Logs" are largely **re-renders of exactly what the Aspire dashboard already shows** (resource graph with health color; live structured + browser logs via `?follow=true` NDJSON + `withBrowserLogs`) — the proposal's own risk note (§3 "Cross-cutting risk") is about HTTP/1.1 connection-ceiling engineering, not about whether these panels are needed at all *given Aspire already renders resources and logs natively*. Panel 7 "Resource Control" (start/stop/restart via `CommandInvokePort`) is likewise a re-skin of an action Aspire's own dashboard Actions menu already exposes once the `command` kind lands — the proposal frames this as "the tool that controls your plugins is itself a plugin" (dogfood value), but functionally it is the same start/stop/restart surface Aspire ships, routed through NetScript's plugin registry instead of directly.
- §3 Panel 3 "Flow/Trace Waterfall" (★flagship) and Panel 4 "Run Inspector" render OTEL trace/span data that Aspire's own dashboard already visualizes as traces — the proposal's differentiator claim here is *grouping* (a single cross-service "run" trace spanning eischat→workers-api→workers→oRPC→streams as ONE grouped view, vs. Aspire's per-service view) and *NetScript-specific run semantics* (RunRecord, Attempt badges, rerun-from-step), not the raw trace-waterfall UI itself — this is the thinnest part of the complementary claim and the part most likely to look like "we rebuilt Aspire's trace view" unless the run-grouping/rerun value is kept sharply in front.
- §9.1's reframe (Plugin Control → "host/registry/overview," moving actions into per-capability sections) is itself evidence the first draft (DDX-10 as "a flat action list") was drifting toward a generic resource-control clone before the BaaS corpus arrived and forced the "manage the *primitive*, not the *process*" reframe.
- The proposal's own §8 push-back item 6 states the correction explicitly: *"IA reframe... 'manage-through-UI' is the actual thesis, so the IA is a shell + per-capability sections, not 7 fixed panels... supersedes the flat-list framing of DDX-10 in the first draft."* This is the proposal admitting mid-document that its initial 7-panel IA (mostly observability re-skins) was the weaker, duplicative reading, and that per-capability manage-through-UI (workers/sagas/triggers/streams sections with create→configure→monitor, config editors, `withCommand` actions) is what actually can't be gotten from Aspire or Scalar.
- Scalar is **never mentioned once** in proposal.md, epic-and-issues.md, or either research file read for this task — Panel 2 "Service Catalog + API Explorer" (oRPC contract list + live "call an endpoint, params pre-filled from schema") is the one panel that structurally overlaps with what Scalar's API-reference/try-it UI already does, and the corpus does not address that overlap at all. This is a gap the rescope should resolve explicitly (does Scalar cover oRPC contracts today, or is the API Explorer NetScript-specific because Scalar only reads OpenAPI/HTTP routes, not the plugin `describe`→`PluginCapabilities` contract shape?).

## D) Constraints/decisions already locked

- **Archetype:** thin `plugins/dashboard` (ARCHETYPE-5) + fat `packages/plugin-dashboard-core` (ARCHETYPE-2), streams-analog not workers-analog. No background processor, no owned DB schema at beta.6.
- **Plugin shape:** `definePlugin(...).withType('utility').withService(...).withAspire(...).withContractVersions([...]).build()`; `contracts/v1/mod.ts` re-exports from core, no local redefinition; `scaffold.ts` = `createPluginAdapter(dashboardAdapterPlugin).toScaffold()`; typesafe resource scaffolders only (#157).
- **Contract seam:** `DashboardContract extends BasePluginContract` (the sound oRPC seam in `packages/plugin/src/contract-base`), soundness test mirroring `workers-core/tests/contracts/*`.
- **Panel-contribution seam:** `DashboardPanelContribution` contract in core, discovered like `AspireNSPluginContribution`, no dashboard-coupled axis added to `@netscript/plugin`.
- **Aspire:** extend Seam A (`command` kind hard beta.6, `app` kind preferred with Seam-B fallback); no `IInteractionService`; all interactivity via `withCommand` arguments/confirmationMessage.
- **Fresh-ui gate:** D-NSONE resolved — do NOT re-import L0–L2 (byte-identical already); promote a **missing L3 `blocks/` layer** (`breadcrumbs`, `context-rail`, `plugin-gated-view`, `activity-feed`, `connector`, `entity-rail`, `tree-nav`); `data-grid` NOT promoted (collides with existing typed `DataGrid<T>` export); MCP components (`html-block`/`mcp-widget`/`ui-block`) OUT of general registry for beta.6. This is a prerequisite WSL Codex framework slice (DDX-0), sequenced before any UI panel.
- **Gates:** `arch:check`, `deno task doc:lint` on full export maps, `deno publish --dry-run`, JSR-safe asset embedding (no `readTextFile`/`fromFileUrl`), E2E join to `scaffold.runtime`/`scaffold.plugins` alongside workers/sagas/triggers/streams (DDX-16), contract-soundness tests (only the 2 accepted casts per E2E-type-soundness doctrine).
- **Design-sync:** a mandatory `.design-sync/` Claude-authored artifact (DDX-15) feeding the UI shell, reusing the existing NS One/fresh-ui L0–L4 vocabulary verbatim rather than forking it.
- **Cross-epic gates:** the flagship Flow/Trace panel (DDX-8) hard-depends on telemetry epic items T4 (triggers W3C-parenting bugfix), T5 (streams fan-in span-links), T6 (oRPC callback span-creation), T7 (`@netscript/telemetry/query` surface) — missing any one and the flagship trace renders severed, span-less, or unqueryable; this is named the tightest cross-topic dependency in the whole epic.

**Files read in full for this distillation:** `design/A-dashboard/proposal.md`, `design/A-dashboard/epic-and-issues.md`, `research/A-dashboard/03-competitor-dev-console-teardown.md`, `research/A-dashboard/04-baas-admin-console-teardown.md`, `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md`, `analysis/A-dashboard/04-plugin-archetype-grounding.md`, `design/B-telemetry/proposal.md` (§7, telemetry-query surface), plus a header skim of `research/A-dashboard/01-aspire-dashboard-extension-surface.md` (deep read owned by another agent). Directory listing confirmed no other A-dashboard files exist beyond `design/A-dashboard/{agent-briefs.md, open-questions.md}` (not in scope for this task) and `research/A-dashboard/02-aspire-version-pin-and-apphost-seam.md` / `analysis/A-dashboard/{01,02,05}-*.md` (not requested).


# Appendix F — GitHub board audit (coverage sweep e)

# Dashboard Epic (#400) Board Audit — Duplication Risk vs Aspire/Scalar

Fetched via `gh issue view --repo rickylabs/netscript` (WSL). 27 issues audited: epic #400, DDX-0…19 (#410–432), telemetry #408, design #507, fresh-ui #509.

---

## Epic

**#400 — epic: NetScript Dev Dashboard — Aspire-extension dev console (ships as a plugin, beta.6)**
Umbrella for a 23-slice plugin (`plugins/dashboard` + `packages/plugin-dashboard-core`) built on `@netscript/fresh-ui`, pulling live data from Aspire `/api/telemetry/*` and co-landing with `epic:telemetry-revamp` (T4/T5/T6/T7) for a flagship cross-service trace. Owner-picked IA = per-capability sections (workers/sagas/triggers/streams) via a `DashboardPanelContribution` seam.
**Verdict: COMPLEMENTARY** in stated intent, but the epic body itself bakes in the risk: *"live data from Aspire `/api/telemetry/*` converging on the telemetry-revamp query/export surface"* and *"the flagship Flow/Trace Waterfall (DDX-8)"* — the flagship slice is explicitly a trace-waterfall UI over the same OTLP data Aspire's own dashboard already renders. The epic needs an explicit non-duplication acceptance line; currently it doesn't have one.

---

## Foundational / plumbing slices (mostly seams, not user-facing views)

**#410 — DDX-0: fresh-ui L3 blocks/ promotion + copy-source registry**
Promotes L3 UI blocks (breadcrumbs, context-rail, activity-feed, tree-nav, etc.) into `@netscript/fresh-ui`'s registry with byte-diff proof against eis-chat. Pure component-registry infra, no data/feature scope.
**Verdict: INFRA-NEUTRAL.** No Aspire/Scalar overlap — it's UI-kit plumbing usable by any surface.

**#411 — DDX-1: @netscript/aspire command + app resource kinds**
Extends the `@netscript/aspire` seam with `'command'` and `'app'` `AspireResourceKind`s so the dashboard can register itself as an Aspire resource and expose interactive commands (`commandOptions.arguments`) without touching `IInteractionService`.
**Verdict: INFRA-NEUTRAL / hand-off-enabling.** This is literally the Aspire-extension mechanism the owner mandate asks for (*"seamless hand-off FROM Aspire... deep links"*) — it's the seam, not a competing view.

**#412 — DDX-2: plugin-dashboard-core scaffold + contract seam**
Package scaffold (doctrine-05 folders), domain models (`ResourceGraph`, `PanelDescriptor`, `RunRecord`, `TraceTree`, `TraceSpan`, `LogRecord`, `ContractCatalogEntry`), ports (`TelemetryQueryPort`, `AspireResourcePort`, `IntrospectionPort`, `CommandInvokePort`), and a `DashboardContract` extending `BasePluginContract`.
**Verdict: INFRA-NEUTRAL.** Contract/domain scaffolding — no rendered feature yet. Note the domain model itself (`TraceTree`/`TraceSpan`) foreshadows DDX-8's duplication risk but this issue is the seam, not the view.

**#413 — DDX-3: TelemetryQueryPort + aspire-otlp-http adapter**
Adapter consuming `/api/telemetry/{traces,traces/{id},logs,spans,resources}` OTLP-JSON, generalizing the existing `fetchDashboardTraces()` template; explicitly designed as a swappable seam.
**Verdict: INFRA-NEUTRAL (plumbing), but data-source is duplication-bearing.** Quote: *"Adapter consumes `/api/telemetry/{traces,traces/{id},logs,spans,resources}` (OTLP-JSON)"* — this is the exact same telemetry surface Aspire's dashboard reads for its own Traces/Logs/Resources tabs. The port abstraction itself is fine (any panel could theoretically add NetScript-specific value on top), but this issue is the fork point where downstream panels (DDX-6/8/11) either differentiate or don't — worth flagging at review time.

**#414 — DDX-4: plugins/dashboard thin plugin + E2E join**
Plugin manifest/scaffold wiring (`scaffold.plugin.json`, `definePlugin`, adapter install/doctor/info), no UI content.
**Verdict: INFRA-NEUTRAL.** Standard plugin-installer plumbing, per #157 typesafe-codegen mandate.

**#415 — DDX-5: Fresh build-console shell + app-registration + IA**
The 7-panel `SidebarShell` IA, dashboard registered as an Aspire `app`-kind resource with auto-launch, fixed port, live updates.
**Verdict: INFRA-NEUTRAL / COMPLEMENTARY.** It's shell/chrome, not a feature. The Aspire self-registration (*"auto-launch on `aspire start`... live updates"*) is exactly the hand-off mechanism the mandate wants — good sign, not risk.

**#423 — DDX-13: Introspection endpoint (/_netscript/*)**
Machine-readable JSON endpoint (Nitro `/_nitro/tasks` pattern) listing scaffolded plugins, routes, background jobs, stream topics, contract versions, derived from scaffold/registry.
**Verdict: INFRA-NEUTRAL, content is genuinely NetScript-only.** Neither Aspire nor Scalar know about NetScript's plugin registry, route wiring, or stream topics — this is squarely "what only NetScript can know," but it's a data endpoint, not itself a UI, so it's plumbing feeding COMPLEMENTARY panels (Stack Map, Catalog).

**#424 — DDX-14: CLI surface + auto-launch**
`netscript dashboard` command + fixed-port auto-launch, optional `--kind dashboard` shortcut.
**Verdict: INFRA-NEUTRAL.** CLI ergonomics only.

**#425 — DDX-15: Claude design-sync artifact + panel prototype**
Design-sync tooling (`.design-sync/`) + Fresh prototype of the panel shell. Now effectively superseded-in-execution by #507.
**Verdict: INFRA-NEUTRAL.** Process/tooling issue, not a feature surface itself.

**#426 — DDX-16: E2E dashboard join + panel smoke (merge-readiness)**
`scaffold.runtime` E2E gate; hard-asserts the DDX-8 flagship trace renders as one unsevered trace with a real oRPC-callback span from the T7 query surface.
**Verdict: INFRA-NEUTRAL.** Test/gate issue. Its acceptance criteria are entirely about proving the telemetry co-land landed, not about dashboard scope per se — though its very existence underscores how much of "merge-ready" is defined by reproducing Aspire-shaped trace data correctly.

**#427 — DDX-17: DashboardPanelContribution seam (.withDashboardPanel)**
Contribution contract (`id/title/icon/capability/component/slots/setup()/commands`) mirroring `AspireNSPluginContribution`, explicitly keeping `@netscript/plugin` free of dashboard coupling.
**Verdict: INFRA-NEUTRAL.** Pure extension-point architecture; enables COMPLEMENTARY panels (DDX-18a–d) without itself being a view.

**#408 — [telemetry T7] @netscript/telemetry/query dashboard surface**
Generalizes the telemetry-trace reader into `@netscript/telemetry/query` + `adapters/aspire-query`, typed `TelemetryTrace`/`Span`/`Log`/`Resource` contracts, `exportTraces` → OTLP-JSON, preserving the #402 TC-1..14 field vocabulary so the dashboard "does not invent parallel span or attribute names."
**Verdict: INFRA-NEUTRAL.** This is the co-landing query/export API, not a UI. Notably it's the same underlying Aspire OTLP data as #413 — it's the layer DDX-8 depends on, so its existence doesn't add duplication risk by itself, but it is the enabling plumbing for the highest-duplication-risk panel below.

**#507 — feat(design): Dev Dashboard E2E Claude Design prototype + design-sync system**
Design-only pre-step: `tools/design-sync/` (fresh-ui → Claude Design canvas converter), a fresh Claude Design project at 100% fresh-ui parity, and a full E2E prototype of shell + all 7 panels + 4 capability sections, light/dark. No `packages/`/`plugins/` source changes.
**Verdict: INFRA-NEUTRAL.** Tooling/process issue (design-sync system + prototyping), not a shipped feature. It *will* prototype the duplication-risk panels (Stack Map, API Explorer, Flow Waterfall, Logs) but as a design exercise, this is the right venue to catch and correct duplication before implementation — worth explicitly steering during this run given the rescope mandate.

**#509 — fresh-ui: registry-wide pixel-perfect UI revamp**
Cross-registry visual-quality pass (skeleton fix, missing defaults, responsive/mobile audit, dark-theme contrast, code-block L4 syntax-highlight layer) surfaced by rendering the full registry side-by-side in #507's prototype.
**Verdict: INFRA-NEUTRAL.** Pure component-quality work across `packages/fresh-ui`; unrelated to Aspire/Scalar scope questions.

---

## Feature panels — the actual duplication-risk surface

**#416 — DDX-6: Stack Map panel**
"Live code-derived resource/plugin-contribution graph (Encore-Flow analog)" using `AspireResourcePort` over the NS compose graph + `/api/telemetry/resources`, plus MCP `list_resources` for non-NS resources; node→detail, health color, cross-filtering.
**Verdict: DUPLICATE-LEANING.** Quote: *"AspireResourcePort (NS compose graph + `/api/telemetry/resources`, + MCP `list_resources` for non-NS resources)... node→detail; health color."* Health-colored resource graph + node detail is exactly Aspire dashboard's Resources tab. The stated differentiator — "plugin-contribution graph" (which plugin owns which resource/route/wiring) — is real NetScript-only value, but it's a single clause riding on an otherwise Aspire-shaped resource view. Needs the acceptance criteria rewritten to foreground *plugin ownership/wiring*, not resource health, or this ships as a thinner re-skin of Aspire's own Resources page.

**#417 — DDX-7: Service Catalog + API Explorer panel**
Auto-generated oRPC-contract catalog from plugin `describe`→`PluginCapabilities`, plus a "Live API Explorer — call an endpoint, params pre-filled from the Standard Schema."
**Verdict: DUPLICATE-LEANING (strong) vs Scalar.** Quote: *"**Live API Explorer** — call an endpoint, params pre-filled from the Standard Schema (Encore's highest-value interaction)."* This is verbatim what Scalar's "try it" API reference already provides. The one non-overlapping piece is the plugin-`describe()`-derived catalog (which plugin owns which contract) rather than raw OpenAPI — but as written, the acceptance bar is "call an endpoint with pre-filled params," which is Scalar's core job. This is the clearest rescope candidate: keep the plugin/contract-ownership catalog, cut or radically narrow the try-it explorer, and instead deep-link into Scalar for the actual call.

**#418 — DDX-8: Flow / Trace Waterfall panel (flagship)**
"Trace list → two-panel waterfall (timeline-left / details-right) + inline logs," rendering a flagship grouped cross-service trace (eischat enqueue → workers-api → workers → oRPC callback → streams fan-out) as ONE trace. Hard cross-epic deps on telemetry T4/T5/T6/T7.
**Verdict: DUPLICATE-LEANING on UI shape, COMPLEMENTARY on payload.** Quote: *"Trace list → two-panel waterfall (timeline-left/details-right) + inline logs"* — this is Aspire's own Traces-tab UI pattern, unmodified. The genuine differentiator is real: Aspire cannot causally group a NetScript worker→saga→trigger→stream chain into one coherent trace today (that's precisely why T4/T5/T6 bugfixes are hard prerequisites) — showing that causal chain *as* NetScript understands it (not generic OTLP spans) is a legitimate "only NetScript can know" feature. But as scoped, the panel is a waterfall-viewer clone; the value is entirely in what the *data* proves (T4-T7 landed), not in a UI capability Aspire lacks. Flagged as the epic's single highest duplication-risk slice — recommend the acceptance explicitly require NetScript-primitive labeling/grouping affordances (e.g., "grouped by primitive: worker retry / saga step / trigger fan-out" — not just a generic span tree) to justify a bespoke UI rather than an Aspire deep-link.

**#421 — DDX-11: Logs panel**
"Live structured logs (`/api/telemetry/logs?follow=true` NDJSON) + Aspire browser-log capture (`withBrowserLogs`); filter by resource/severity."
**Verdict: DUPLICATE-LEANING (strong).** Quote: *"Live structured logs (`/api/telemetry/logs?follow=true` NDJSON) + Aspire browser-log capture... filter by resource/severity."* This is close to a line-for-line description of Aspire's existing Structured Logs / Console Logs tabs. No NetScript-specific angle is stated anywhere in the body (no mention of primitive-aware log correlation, run/step linkage, etc.). Lowest-effort rescope target: either cut this panel and deep-link to Aspire's native logs view filtered by resource, or add explicit NetScript-primitive correlation (e.g., logs scoped to a Run Inspector step) as the differentiator — as written it has none.

**#422 — DDX-12: Resource Control panel**
Resource start/stop/restart via `CommandInvokePort`/`ResourceCommandService`/MCP `execute_resource_command`; composite "reset stack" command deferred to stable.
**Verdict: DUPLICATE-LEANING (moderate).** Quote: *"Resource start/stop/restart via `CommandInvokePort` → `ResourceCommandService` / MCP `execute_resource_command`."* Modern Aspire dashboards already expose native resource start/stop/restart controls. The only clear non-overlap is the deferred "composite reset-stack command" (multi-resource orchestration), which ships at stable, not beta.6 — meaning the beta.6-scoped slice (basic start/stop/restart) is close to pure duplication of an Aspire-native capability. Consider either deferring the whole panel to stable-only (ship just the composite/orchestration piece) or re-scoping beta.6 to NetScript-specific composite actions only.

---

## Feature panels — genuinely NetScript-primitive, COMPLEMENTARY

**#419 — DDX-9: Run Inspector panel**
Run-list (filter status/type/time) → run-detail (inputs/results) → step-timeline waterfall with attempt badges; rerun-from-step and multi-altitude event history deferred to stable.
**Verdict: COMPLEMENTARY.** "Runs," "attempts," and step-level input/output are NetScript worker/saga execution-domain concepts with no Aspire or Scalar equivalent — Aspire has no notion of a saga "run" or a worker "attempt." This is the closest analog to Temporal's workflow inspector and is squarely in "what only NetScript can know" territory.

**#420 — DDX-10: Plugin Control host + registry/overview**
Installed-vs-available plugin list, health/doctor, and the mount point where per-capability sections (DDX-18) render; global `withCommand` actions.
**Verdict: COMPLEMENTARY.** Plugin registry state and doctor output are NetScript-specific; neither Aspire nor Scalar have any concept of a "plugin" in this sense. Clean fit for the mandate.

**#427 → #428/#429/#430/#431 — DDX-18a–d: workers/sagas/triggers/streams per-capability sections**
Each: create→configure(tabs)→monitor for one first-party plugin, with monitor deep-linking into Run Inspector/Flow filtered to that capability, config tab, and `withCommand` actions.
**Verdict: COMPLEMENTARY (all four).** This is exactly the mandate's target: primitive-internal runtime behavior (worker queue/retry state, saga step machine, trigger W3C-parenting, stream fan-in/fan-out) that Aspire's generic resource view cannot render meaningfully. The "deep-links into cross-cutting Run Inspector/Flow filtered to X" pattern is also the right shape for hand-off-style composition rather than reinventing views.

**#432 — DDX-19: Codegen-from-UI "Add resource" action**
Dashboard "Add resource" action invoking the same `createPluginAdapter(...).toScaffold()` machinery the CLI installer uses — one generator, two callers; cross-refs `epic:ai-stack` for future AI-driven codegen.
**Verdict: COMPLEMENTARY.** Scaffold/codegen state surfaced through a UI action is unambiguously NetScript-specific (Strapi-precedent, not an Aspire/Scalar concern at all). Correctly deferred to `wave:defer`/stable given its dependency on DDX-4's scaffolder exposure.

---

## Summary table

| # | Handle | Verdict |
|---|---|---|
| 400 | epic | COMPLEMENTARY (intent) — flagship slice needs guardrail |
| 410 | DDX-0 | INFRA-NEUTRAL |
| 411 | DDX-1 | INFRA-NEUTRAL |
| 412 | DDX-2 | INFRA-NEUTRAL |
| 413 | DDX-3 | INFRA-NEUTRAL (data-source risk downstream) |
| 414 | DDX-4 | INFRA-NEUTRAL |
| 415 | DDX-5 | INFRA-NEUTRAL / COMPLEMENTARY |
| 416 | DDX-6 Stack Map | **DUPLICATE-LEANING** |
| 417 | DDX-7 Catalog+API Explorer | **DUPLICATE-LEANING (strong, vs Scalar)** |
| 418 | DDX-8 Flow/Trace Waterfall | **DUPLICATE-LEANING (UI shape)** / payload complementary |
| 419 | DDX-9 Run Inspector | COMPLEMENTARY |
| 420 | DDX-10 Plugin Control host | COMPLEMENTARY |
| 421 | DDX-11 Logs | **DUPLICATE-LEANING (strong)** |
| 422 | DDX-12 Resource Control | **DUPLICATE-LEANING (moderate)** |
| 423 | DDX-13 Introspection endpoint | INFRA-NEUTRAL (content NetScript-only) |
| 424 | DDX-14 CLI surface | INFRA-NEUTRAL |
| 425 | DDX-15 design-sync (superseded by #507) | INFRA-NEUTRAL |
| 426 | DDX-16 E2E smoke | INFRA-NEUTRAL |
| 427 | DDX-17 contribution seam | INFRA-NEUTRAL |
| 428–431 | DDX-18a–d capability sections | COMPLEMENTARY (all four) |
| 432 | DDX-19 codegen-from-UI | COMPLEMENTARY |
| 408 | T7 telemetry query surface | INFRA-NEUTRAL |
| 507 | design prototype + design-sync | INFRA-NEUTRAL |
| 509 | fresh-ui pixel-perfect revamp | INFRA-NEUTRAL |

**Rescope priority order (highest duplication risk first):** #417 (API Explorer vs Scalar try-it), #421 (Logs vs Aspire structured logs), #416 (Stack Map vs Aspire Resources), #418 (Flow Waterfall UI shape vs Aspire Traces — payload is legitimately unique, UI pattern isn't), #422 (Resource Control vs Aspire native start/stop/restart). All five should get an explicit "why can't this just deep-link to Aspire/Scalar" acceptance line before implementation; #507's design-prototype run is the right venue to force that answer visually before DDX-implementation starts.


# Appendix G — Design-run salvage + ns-* component inventory (coverage sweep f)

# NetScript Dev Dashboard — Design Asset Salvage Inventory

## A) Full `ns-*` component/block inventory

### A1. Shipped in `packages/fresh-ui/registry.manifest.ts` (44 items, synced today)

**L2 general components (30)**

| name | kind | layer | purpose |
|---|---|---|---|
| button | component | 2 | Action primitive; primary/secondary/outline/destructive/ghost variants with hard offset "press" shadow |
| icon-button | component | 2 | Icon-only accessible action button, built on Button |
| input | component | 2 | Text input, token-driven error state |
| textarea | component | 2 | Multi-line text input, shared field styling |
| checkbox | component | 2 | Native checkbox seam, CSS-first |
| switch | component | 2 | Native binary toggle seam |
| label | component | 2 | Accessible field label with required-state |
| select | component | 2 | Native select wrapper |
| form-field | component | 2 | Composed label + help + error wrapper |
| search | component | 2 | Nav search affordance that opens the command palette |
| dropzone | component | 2 | Dashed file-drop target wrapping a native file input |
| card | component | 2 | Primary content surface (header/body/footer) |
| panel | component | 2 | Dense secondary surface (filters/rails/grouped controls) |
| separator | component | 2 | Divider seam |
| badge | component | 2 | Compact semantic status/intent seam |
| alert | component | 2 | Persistent section-level feedback banner |
| inline-notice | component | 2 | Compact contextual feedback inside forms/panels |
| spinner | component | 2 | Small loading indicator |
| progress | component | 2 | Determinate/indeterminate progress bar |
| skeleton | component | 2 | Generic loading scaffold (table/stats/detail/form) |
| avatar | component | 2 | Identity chip (initials/image, presence, agent variant) |
| code-block | component | 2 | Fenced code surface with filename/lang header + copy |
| chart-block | component | 2 | Token-driven bar/column chart, `data-tone` intents |
| donut | component | 2 | Token-driven donut/pie chart (SVG arcs + legend) |
| citation-chip | component | 2 | Inline `[n]` per-claim source marker (chat-flavored) |
| model-selector | component | 2 | Disclosure-backed model/provider picker (chat-flavored) |
| tool-call-card | component | 2 | Inline MCP/tool call + result disclosure (chat-flavored) |
| prompt-input | component | 2 | Chat composer: textarea + toolbar + model picker + send (chat-flavored) |
| message | component | 2 | Chat message bubble w/ inline markup, citations, tool/chart blocks (chat-flavored) |
| command-palette | component | 2 | Modal ⌘K command palette (Dialog + Combobox) |

**L3 blocks (11)**

| name | kind | layer | purpose |
|---|---|---|---|
| breadcrumb | block | 3 | Drill-down trail block |
| sidebar-shell | block | 3 | Dashboard shell: sidebar nav + topbar slots + breadcrumb |
| page-header | block | 3 | Page-intro block: title, status row, actions |
| filter-form | block | 3 | Card-backed filter/facet/action rail above tables |
| stats-grid | block | 3 | Responsive summary-metric card grid |
| detail-layout | block | 3 | Two-column record page: main flow + side rail |
| data-table | block | 3 | Composed header/body/footer table-or-list block |
| responsive-table | block | 3 | Collapses dense rows to labeled mobile cells |
| pagination | block | 3 | Shared pagination meta/actions |
| empty-state | block | 3 | Empty-state callout for lists/tables/rails |
| section-divider | block | 3 | Editorial section label + rule |

**Islands (3)**: `theme-toggle` (dark/light switch), `sidebar-toggle` (mobile drawer), `toast` (redirect-flash notification).

**8 interactive primitives on the `NSOne` global** (not registry items, headless behavior): Dialog, Tabs, Popover, Drawer, Sheet, Combobox, Accordion, Tooltip.

**Layout objects** (`layouts.css`, no JS): `ns-stack`, `ns-cluster`, `ns-grid--*`, `ns-split`, `ns-toolbar`, `ns-switcher`, `ns-shell`, `ns-section`, `ns-sidebar`, `ns-topbar`.

**Other**: `markdown` (sanitized GFM/math/highlight renderer), `chat-render` (fenced-block → typed RenderPart parser). Both chat-surface, not dashboard-core.

Two things explicitly **not** components: `data-grid` (real typed `DataGrid<T>` export exists — never a second table), and MCP widgets (`html-block`/`mcp-widget`/`ui-block`/`icon`) — out of scope for beta.6, MCP is a data source not a render target.

### A2. Design-run inventions — pass 1 (validated on screens, pending sync-back to the manifest above)

These do **not** yet exist in `registry.manifest.ts`; they are candidates proven in the four static screens.

| name | kind | verdict | one-line purpose |
|---|---|---|---|
| `ns-waterfall` | new-component | validated (2 deltas) | Trace/span timeline: proportional time-axis bars with depth indentation, ticks, running-pulse animation; row selection via `listbox`/`aria-selected` (not `data-state`, which carries status only) |
| `ns-stackmap` | new-component | validated (2 deltas) | Infra topology graph: nodes = `aria-pressed` toggle buttons placed on a grid, edges = a measured/computed SVG overlay between node bounding rects, single-selection filters other panels |
| `ns-step-timeline` | new-block | validated (1 delta) | Per-run step list: marker + title + attempt-count pill + duration/offset meta + expandable I/O payload; `all/compact` CSS views, `json` view is a composition-level `CodeBlock`+Tabs swap, not CSS |
| `ns-log-stream` | new-block | validated as proposed | Append-only structured-log tail: toolbar (label + Follow switch), dense mono `ts/resource/severity/msg` grid rows, severity-tinted rows |
| `ns-envbar` | screen-local glue (sync-back candidate) | small but on every screen | Topbar environment identity pill: `local · my-app · aspire`, app segment emphasized, status dot |
| `ns-rail-grid` (+ `--sm`) | layout object (sync-back candidate) | validated | Left-rail page layout (list rail + `minmax(0,1fr)` main), the mirror of the existing `ns-content-rail` right rail |
| `ns-page-header--console` | PageHeader variant (sync-back candidate) | validated | Denser PageHeader for in-shell console pages: text-2xl h1 instead of display-scale text-4xl, tighter block padding |
| `ns-tabs__list/__trigger/__content` skin | Tabs CSS skin (sync-back candidate) | validated | Segmented-control visual skin for the headless Tabs primitive (which ships no CSS by design) |
| `ns-ep-row` | DataTable row-mode candidate | proposed fold-in | Selectable row treatment (hover bg, `aria-selected` → inset primary edge); if kept, becomes a DataTable `interactive` row mode, not a new block |

### A3. Promoted from the eis-chat proposal, validated on these screens (7 blocks, "DDX-0 promote set")

| name | validated on | contract |
|---|---|---|
| `breadcrumbs` | all 4 screens | already-seeded `Breadcrumb`, no delta |
| `context-rail` (`.ns-content-rail`) | all 4 screens | selection-detail right rail; nests as the inner grid of `ns-rail-grid` |
| `plugin-gated-view` | 03 (contract tree) | gates an entire region (table + rail), `data-state='not-installed'`, `__title/__desc/__cmd` parts |
| `activity-feed` | 02 (span events), 04 (run events) | event/timeline list; `data-tone='success|warning|destructive|primary'` on `__item`; parts `__item/__marker/__body/__text/__time` |
| `connector` | 01 (probes + rail health), 02 (timing/legend), 04 (context k/v) | generalized further than proposed: doubles as the console's generic key-value row primitive; `data-state='ok|degraded|failed'` on `__row` |
| `entity-rail` | 02 (trace list), 04 (run list) | generic selectable list rail; `role='listbox'`/`role='option'` + `aria-selected` + `data-state='selected'`; `__item/__title/__meta` |
| `tree-nav` | 03 (contract tree) | native `<details>`-based collapsible tree; `data-state='gated'` on `__group` reroutes to `plugin-gated-view` instead of toggling |

## B) Per-screen breakdown

### 01 — Stack Map
**Shows:** an `ns-stackmap` graph of all 8 Aspire resources (`web`, `api`, `eis-chat` services; `workers`; `postgres` database; `redis` cache; `mailpit`, `otel-collector` containers) placed on a dependency-topology grid with a computed SVG edge layer; clicking a node toggles selection and fills a `context-rail` (`NodeDetail`) with endpoints, a `connector` health list (multi-probe: HTTP healthz, TCP/PING checks), last-5-min stat rows, action buttons (Restart/Stop/Logs) each paired with the literal CLI-equivalent (`aspire resource restart <id>`) via CodeBlock, and "View traces"/"View runs" cross-links.

**Duplicates Aspire/Scalar:** almost the entire panel. Aspire's own dashboard already renders a resource graph with health, endpoints, and start/stop/restart — this screen is functionally a redraw of Aspire's resource list/graph view with NetScript chrome. It is explicitly named in the brief as "Precedent: Encore Flow" but the actual content (service/worker/db/cache/container health+endpoints+process control) is Aspire's job today.

**Salvageable uniquely-NetScript ideas:**
- The **CLI-equivalent-of-every-action affordance** (Tooltip/CodeBlock showing the exact `aspire resource <cmd>` or `netscript <cmd>` line next to every button) is a genuinely NetScript-flavored transparency pattern, reusable anywhere the dashboard offers a mutating action — but it's a *component pattern*, not something requiring this whole screen.
- `ns-stackmap`'s edge-layer mechanism (measured SVG between DOM node rects, single-select-filters-siblings) is a solid reusable primitive — but should be re-purposed to show something Aspire can't: e.g. a **plugin/capability dependency graph** (which plugin's saga triggers which worker queue, which trigger fires which stream) rather than infra topology.
- The `connector` block generalized to a key/value row primitive is broadly useful independent of this screen's infra framing.

### 02 — Flow / Trace (waterfall)
**Shows:** a trace list (`entity-rail`) of 6 traces → selecting one renders `ns-waterfall` (proportional time-axis bars, parent/child depth, per-service color via `color-mix()`, running-pulse) with a service-color `Legend`, an inline `ns-log-stream` strip correlated to the trace, and a `context-rail` `SpanDetail` pane. The flagship narrative trace is HTTP enqueue → workers API → worker execution → callback write → stream fan-out, with numbers cross-consistent with screen 04 (same job, same redis degradation).

**Duplicates Aspire/Scalar:** this is close to a 1:1 reimplementation of the .NET Aspire dashboard's own trace/span waterfall + structured-log correlation (and of generic OTel trace viewers generally) — proportional span bars, parent/child indentation, span-detail rail, and correlated logs are exactly what Aspire's Traces tab already renders from the same OTel data.

**Salvageable uniquely-NetScript ideas:**
- **Not the waterfall renderer itself** — Aspire owns that. What's uniquely NetScript is *what the spans mean*: a trace that crosses `workers`/`sagas`/`triggers`/`streams` boundaries is annotated with NetScript-primitive semantics (queue name, attempt number, saga step, trigger firing id) that generic OTel spans don't carry unless NetScript's own instrumentation adds them. The salvage is the **span-annotation vocabulary and cross-links into Run Inspector** ("Open in Run Inspector" ghost button, trace id as mono inline-code), not the waterfall widget.
- Recommend: don't rebuild a trace waterfall; instead make the *existing* Aspire trace view deep-link into NetScript's Run Inspector for the run-shaped context Aspire has no vocabulary for.

### 03 — Service Catalog + API Explorer
**Shows:** a `tree-nav` contract tree (plugin → namespace) on the left, an `EndpointTable` (DataTable + method Badges: GET→muted/POST→primary/PATCH→warning/DELETE→destructive) in the main column, and an `Explorer` call-form rail on the right — schema-typed fields (Select/Input/Textarea/Switch per Standard Schema field) that call the procedure and render a typed response via CodeBlock. A `plugin-gated-view` covers not-yet-installed plugins (crons) with an install-command teaching state.

**Duplicates Aspire/Scalar:** this is squarely Scalar's job — "every plugin's oRPC contract, introspected... call form... typed live response" is exactly what Scalar's API reference + try-it panel already does for any OpenAPI/RPC surface. Building a second endpoint-list + call-form UI competes directly with the tool the owner mandate says must not be replicated.

**Salvageable uniquely-NetScript ideas:**
- `plugin-gated-view` (install-command teaching state for a not-yet-installed capability) is genuinely NetScript-only — Scalar has no concept of "this contract doesn't exist yet because the plugin isn't installed." That gating pattern belongs in **Plugin Control**, not a rebuilt catalog.
- `tree-nav`'s plugin → namespace/resource grouping is reusable as the sidebar's capability navigation (already slated for that in the promote-set), independent of duplicating Scalar's explorer.
- Recommendation for rescope: this screen's actual explorer/call-form content should be a deep link *into* Scalar (or an embed), while NetScript's own value-add is contract **provenance** — which plugin contributed which procedure, whether the plugin is installed, oRPC vs REST framing — i.e., render registry/wiring metadata Scalar doesn't have, not a second try-it form.

### 04 — Run Inspector
**Shows:** filterable `entity-rail` run list (status + capability Selects, live filter, Reset, `EmptyState` on zero-match) across jobs/saga-runs/firings/deliveries → `RunDetail` (inputs/results) + `ns-step-timeline` (marker/title/attempt-pill/duration/offset, expandable I/O CodeBlocks, All/Compact/JSON toggle) + `RunRail` (`activity-feed` of run events + `connector` key/value context). Numbers are the same incident thread as screen 02 (`job_4183`, redis degradation, eis-chat retry 2-of-5).

**Duplicates Aspire/Scalar:** partially — a generic "run/execution history" view resembles Temporal/Inngest, which Aspire and Scalar do **not** provide (Aspire has no saga/job/trigger/delivery execution model; it only sees process-level resources and OTel spans/traces). This is the one screen in the pass-1 set that is legitimately **complementary**, not duplicative, because "a run" (a saga instance, a job attempt sequence, a trigger firing, a stream delivery) is a NetScript-primitive concept with no Aspire/Scalar equivalent.

**Salvageable uniquely-NetScript ideas (the strongest candidate for the rescoped dashboard):**
- `ns-step-timeline` — per-step status/duration/attempts/payload is exactly the internal-execution detail only NetScript's own runtime instrumentation can produce (Aspire only sees the process as a black box; it has no concept of "saga step 3, attempt 2 of 5").
- Attempt/retry vocabulary (`retrying` badge, attempts pill) and the All/Compact/JSON view toggle are directly reusable and map onto config-resolution / codegen-state surfaces too (e.g., "which plugin registry entries resolved from which config layer, in what order" is structurally the same step-timeline shape).
- `activity-feed` generalized (not chat-flavored) is a good primitive for surfacing plugin-registry state changes, codegen runs, or scaffold events — all things only NetScript's own tooling can observe.
- Recommendation: **Run Inspector's underlying shape (list → detail → step-timeline → activity-feed) is the piece worth carrying forward wholesale** into the rescoped IA, retargeted at NetScript-only state (registry resolution steps, plugin doctor runs, codegen diffs) rather than duplicating Temporal/Inngest-style generic job monitoring, which risks re-treading ground once Aspire/OTel tracing already covers cross-service execution flow.

## C) Design-token / theming facts for a Claude Design prompt author

- **Token law is absolute**: every color/space/radius/type-size must be a `--ns-*` custom property — no raw hex, no raw gray steps, including chart/series colors (derive via `color-mix()` from intent tokens, never literal). This is a lint-enforced gate, not a style preference.
- **Theme default and switch**: light is the **unthemed default** (warm cream palette); dark activates via `[data-theme='dark']` on `<html>`. Every screen must read correctly in both — CSS must be written theme-blind (no light-only assumptions). Screens seed theme determinism with an inline pre-hydration script that reads `?theme=` and mirrors it into `localStorage['ns-theme']` so the `ThemeToggle` island agrees with the URL on mount.
- **Color system**: OKLCH-based ramps per hue (e.g., `--ns-copper-1`…`-8`, with a legacy hex fallback declared before the OKLCH override — OKLCH wins). `--ns-primary` and `--ns-accent` both alias `--ns-copper-6`; `--ns-primary-hover` is `--ns-copper-7`. Semantic aliases (`--ns-bg`, `--ns-fg`, `--ns-ring`, `--ns-destructive`, `--ns-secondary*`, `--ns-border-*`, `--ns-muted-fg`) sit on top of the raw ramps — components consume only the semantic layer.
- **Status vocabulary → Badge variant, fixed and shared everywhere**: `completed→success`, `running→primary`, `failed→destructive`, `retrying|degraded→warning`, `queued→muted/default`. One `STATUS_VARIANT` map per screen; never re-derive.
- **Typography**: sans is the default UI face; `--ns-font-mono` (`'DM Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace`) is reserved for IDs, durations, endpoints, CLI snippets, and any value that reads as "measured data" — e.g., job ids render as `job_4183` in mono, never `#4183`, specifically so copy can't collide with the no-hex-literal lint gate. Text scale runs from `--ns-text-3xs` up through display sizes; console/dashboard surfaces intentionally use the **denser** end (`ns-page-header--console` overrides PageHeader's default display-scale `text-4xl` h1 down to `text-2xl` with tighter block padding) — dashboards are density-first, not marketing-page-scale.
- **Radii**: `--ns-radius-sm` 4px, `-md` 6px, `-lg` 8px, `-xl` 12px, `-2xl` 16px, `-full` pill. Small/dense controls use `sm`; cards/panels typically `md`/`lg`.
- **"Neobrutalist" button read — confirmed, but precise**: buttons are not flat. `.ns-btn--primary/--secondary/--outline/--destructive` all carry a **hard-offset, non-blurred drop shadow** (`3px 3px 0 color-mix(...)`, i.e., a solid-color offset block, not a soft blur) that **compresses to `2px 2px 0` on hover and `1px 1px 0` on active**, paired with a `translate(1px,1px)`/`translate(2px,2px)` press motion — a tactile, "pressed-into-the-page" 3D-shadow interaction rather than a soft-shadow/glassy one. Ghost buttons are the exception: no border, no shadow, surface-tint hover only. This pattern is a strong, distinctive brand signal a design prompt should call out explicitly (e.g. "buttons should feel physically pressed, hard offset shadow, not blurred").
- **Motion respects `prefers-reduced-motion: reduce`** everywhere pulses/animations are used (`running` waterfall bars, `step-timeline` markers, connector focus rings) — always specify the reduced-motion fallback alongside any animated state.
- **Interaction/semantics discipline** a prompt author must preserve: native elements first (`<details>` for tree/disclosure, real `<button>` for all list items), `role='listbox'`/`role='option'` + `aria-selected` for list selection, `aria-pressed` (not `aria-selected`) for standalone toggle buttons like stack-map nodes, `data-state` reserved for **status only** where selection is also possible (selection is a separate `aria-*`/class concern) — this selection-vs-status split was a hard-won delta from the DDX-0 pass and is easy to get wrong.
- **Class contract**: `ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`, state via `data-state`/`data-part`/`aria-*`, components take `class` not `className`. Any new candidate component must follow this exactly to be sync-back-eligible.
- **Layout density objects**: `ns-content-rail` (right detail rail) and its newer mirror `ns-rail-grid`/`--sm` (left list rail: 18rem/15rem fixed + `minmax(0,1fr)` fluid main, breakpoint ≥1024px, single-column stack below 860px for stack-map specifically) are the two console-page grid shapes everything composes from — a prompt author reaching for a "three-zone console layout" should compose these two rather than inventing a new grid.

**Key files referenced**: `C:/Dev/repos/netscript-framework/.llm/tmp/design-proto-wt/resources/design/dashboard/{CLAUDE-DESIGN-BRIEF.md,DECISIONS.md,PROPOSED-COMPONENTS.md}`, `.../screens/{01-stack-map,02-flow-trace,03-service-catalog,04-run-inspector}.html`, `.../screens/proto.css`, `C:/Dev/repos/netscript-framework/.llm/tmp/design-proto-wt/packages/fresh-ui/registry.manifest.ts`, `.../packages/fresh-ui/registry/theme/tokens.css`, `.../packages/fresh-ui/registry/components/ui/button.css`.
