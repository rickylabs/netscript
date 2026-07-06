# Dev Dashboard Rescope — Definitive Plan (beta.6)

Run: `dashboard-rescope--seed` · 2026-07-06 · drafts-only; owner ratifies before any GitHub mutation.
Companion artifacts: `research.md` (evidence), `epic-rewrite.md` (#400 body), `issues-rescope.md` (per-issue verdicts + bodies), `claude-design-prompts.md` (S1–S12 prompts), `ratification-summary.md` (one-pass mutation batch).

## 1. Thesis

The NetScript Dev Dashboard is a **satellite of Aspire's control surface and Scalar's API reference — never a rival**. It renders exclusively what only NetScript can know:

- **Primitive run-state** — job/task executions with attempts, workflow steps, saga instances (including `compensating`, a status no other tool has a concept of), trigger firings, stream deliveries.
- **The override/config layer** — runtime-config hot-reload state (feature flags, disabled jobs/sagas/triggers, task overrides) and resolved `netscript.config` declared intent.
- **Plugin-registry wiring** — manifests, doctor reports, 8–10 contribution axes per plugin, JSR version drift.
- **Contract provenance & codegen state** — which plugin contributed a procedure, `.describe()` coverage gaps degrading the Scalar spec, REST/RPC duality, Fresh route→contract binding, DB migration status/drift.

Everything Aspire or Scalar already owns — trace waterfalls, log tails, metrics charts, resource lifecycle, OpenAPI operation lists, try-it — appears in the dashboard **only as a deep-link out**.

**Standing review gate (goes into the epic body):** every merged panel must pass the question *"why can't this just deep-link to Aspire/Scalar?"* with a NetScript-only answer recorded in its issue.

## 2. Non-goals (anything Aspire/Scalar already does well)

| Killed surface | Owner | What replaces it |
|---|---|---|
| Trace/span waterfall (old DDX-8 flagship) | Aspire Traces | NetScript-domain run timeline in S6 that resolves a `traceId` and out-links to `{aspireBase}/traces/detail/{id}` |
| Console/structured logs panel (DDX-11) | Aspire Logs | Correlated read-only `ns-log-stream` strip in S6 that deep-links to `{aspireBase}/structuredlogs?resource={name}` |
| Resource start/stop/restart panel (DDX-12) | Aspire Actions menu | `withCommand` contributions that appear *in Aspire* (Actions menu + `aspire resource` CLI + Aspire MCP — one seam, three surfaces) |
| Metrics charts, GenAI conversation view | Aspire | Out-links only |
| Service `/health` panel | Aspire State column | Fix the `withHealthCheck()` wiring gap instead |
| API operation list / try-it console (old DDX-7 explorer) | Scalar `/api/docs` | S4 lists provenance/coverage/duality, then deep-links to Scalar operation anchors |

## 3. The screen set (S1–S12)

Beta.6 core = S1–S10 (S10 gated on verifying a delivery read-model exists). One-line DX thesis each; full specs in `issues-rescope.md` and design prompts in `claude-design-prompts.md`.

| # | Screen | DX thesis (what only NetScript can show) | Issue |
|---|---|---|---|
| S1 | Shell & Wiring Home | "Is my app wired the way I declared it, and where do I jump to fix it" — stat cards are only-NetScript facts | #415 rewrite |
| S2 | Config Resolution & Topology Hand-off | Declared intent vs. running reality; `ns-stackmap` retargeted to a plugin→capability→primitive wiring graph | #416 rewrite |
| S3 | **Runtime-Config Monitor ⚑ flagship** | "Someone just flipped `checkout-v2` to 30% rollout" — the live override layer Aspire/Scalar can never know exists; watcher already built | **NEW** DDX-20 |
| S4 | Service & Contract Catalog | Contract provenance, `.describe()` coverage gaps, REST/RPC duality, route→contract binding — above the OpenAPI boundary; no try-it | #417 rewrite |
| S5 | Plugin Control (dogfood centerpiece) | Installed plugins, contribution axes, doctor health, JSR version drift — fleet wiring nothing else shows | #420 rewrite |
| S6 | Run Inspector (+ run overlay) | "Saga on step 3 of 5, compensating step 2, retried once" — run/attempt/compensation vocabulary; absorbs killed DDX-8 | #419 rewrite |
| S7 | Workers Console | Which job ran, retried, failed on attempt 2 of 3 + scheduler-vs-config drift; 21 shipped oRPC routes, UI-only work | #428 rewrite |
| S8 | Sagas Console | Instance status incl. `compensating` + from→to transition timeline | #429 rewrite |
| S9 | Triggers Console | Firing history, enable/disable without redeploy, cron next-fire preview, webhook ingress test; DLQ tab gated on co-req API | #430 rewrite |
| S10 | Streams Console | Fan-out delivery state per subscriber; verify read-model before committing to beta.6 | #431 rewrite |
| S11 | DB Migrations & Drift | Pending vs. applied migrations + schema drift — Aspire only shows the DB resource is up | **NEW** DDX-21 (beta.6-if-cheap) |
| S12 | Dead-Letter Queues | DLQ depth/reason/replay across KV/Redis/PG — gated on two thin co-req API slices | **NEW** DDX-22 (wave:defer) |

## 4. Integration story (four seams, one URL scheme)

Full architecture in `research.md` Appendix A §3 and the integration section of `issues-rescope.md` (#411/#413/#423/#424).

1. **Aspire → dashboard (entry).** `WithUrl("NetScript Dashboard", /resource/{name})` emitted by the apphost generator for every scaffolded resource (raw generator edit in `generate-register-apps.ts`; no seam change) + two fixed framework `withCommand`s (`open-netscript-dashboard`, `inspect-registry`) so AI agents on Aspire's MCP get the link for free. Seam A widening (`AspireResourceKind` + `command`/`app` kinds, #411) is the beta.6 unlock; Seam B (`register-*.mts`) is the interim path.
2. **Dashboard → Aspire (correlate-then-return).** `TelemetryQueryPort` + `adapters/aspire-query` (#413) is **correlation-only**: resolve a `traceId` from a stamped `traceparent`, then out-link to Aspire's own trace/logs/metrics pages. Version-pinned, one-file swappable; the `/api/telemetry/*` API is not declared stable.
3. **Dashboard ↔ Scalar.** Out: `/api/docs` + operation anchors from every contract row. In: essentially nil — Scalar has no callback surface; spec-authored `externalDocs` links are optional polish (#424 notes this honestly).
4. **CLI → dashboard.** `netscript dashboard open|url` (`--resource`, `--panel`, `--no-open`), console banner printing both dashboard URLs on `netscript dev`; never auto-open a browser (#424).

**Data plane:** owned `/_netscript/*` introspection (#423) over already-shipped oRPC contracts (config + runtime-config SSE, plugins/doctor/contributions, workers, sagas, triggers, routes, db status, scheduler, telemetry coverage) — strictly separate from the borrowed telemetry plane (#413).

## 5. Phasing

**Beta.6 core (build-UI-only or nearly free):**
- Seams/plumbing: #410 (L3 blocks), #411 (Seam A widening), #412 (core scaffold, TraceTree demoted), #413 (correlation-only port), #414 (thin plugin), #423 (introspection mount), #424 (CLI + generator emission + URL scheme), #427 (panel seam).
- Screens: S1–S9 (+S10 if delivery read-model exists); S3 is the flagship new issue (DDX-20).
- Design pre-step: #507 prototypes the rescoped set in Claude Design (per-screen prompts in `claude-design-prompts.md`); duplication is caught at design review, before implementation.
- Gate: #426 E2E rewritten — asserts `WithUrl` presence, `/_netscript/*` responses, one logical cross-capability run with primitive-labeled steps, trace out-link URL (never an in-dashboard waterfall render), runtime-config SSE event.

**Beta.6-if-cheap / fast-follow:** S11 DB migrations (DDX-21), S2 telemetry-coverage overlay, S5 JSR version drift, S7 scheduler-drift panel.

**Later (wave:defer, gated on thin API slices filed now):** S12 DLQ (DDX-22) + co-req `TriggerDlqPort` contract route + co-req `queue` `DeadLetterStore` CLI/API; #432 codegen-from-UI stays deferred; composite "reset-stack" orchestration refiled at stable.

## 6. Cross-cutting laws inherited by every screen

- CLI-equivalent-of-every-mutating-action (exact `netscript …` line via CodeBlock) — the salvaged transparency pattern.
- Shared `STATUS_VARIANT` map: `completed→success`, `running→primary`, `failed→destructive`, `retrying|degraded→warning`, `queued→muted`.
- Token law (`--ns-*` only), light default + `[data-theme='dark']`, `prefers-reduced-motion` fallbacks, density-first console chrome (`ns-rail-grid` + `ns-content-rail`).
- Every panel arrives through the `DashboardPanelContribution` seam (#427) — the dashboard is itself a plugin (dogfood).
- Program note (not a screen): NetScript owns the **domain-state MCP surface** mirroring Aspire's observability MCP — complementary halves.
