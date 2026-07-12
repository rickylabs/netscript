# Dev Dashboard Rescope — Definitive Plan (beta.6) · v2

Run: `dashboard-rescope--seed` · 2026-07-06 · drafts-only; owner ratifies before any GitHub mutation.
**v2 amendment (owner feedback, same day):** v1 over-corrected — it kept only the *observation* pillar and dropped two dimensions the original `plan-roadmap-expansion--seed` research mandates: the **Appwrite-style manage-through-UI console** (research file `04-baas-admin-console-teardown.md`: "the dashboard IS how you drive the framework") and the **Encore-model seam-flow telemetry** (file `03-competitor-dev-console-teardown.md`: Encore Flow + per-request journey). v2 restores both **without deleting any v1 screen** — S1–S12 stand; they gain management verbs, and one screen returns (S13).
Companion artifacts: `research.md` (evidence + Appendix H gold conclusions), `epic-rewrite.md` (#400 body), `issues-rescope.md` (per-issue verdicts + bodies), `claude-design-prompts.md` (S1–S13 prompts), `ratification-summary.md` (one-pass mutation batch).

## 1. Thesis — three pillars

The NetScript Dev Dashboard is a **satellite of Aspire's control surface and Scalar's API reference — never a rival** — and it is **how you drive the framework**, not a read-only viewport bolted on afterward.

**P1 — Observe (v1, unchanged).** Render exclusively what only NetScript can know:
- **Primitive run-state** — job/task executions with attempts, workflow steps, saga instances (including `compensating`), trigger firings, stream deliveries.
- **The override/config layer** — runtime-config hot-reload state and resolved `netscript.config` declared intent.
- **Plugin-registry wiring** — manifests, doctor reports, contribution axes, JSR version drift.
- **Contract provenance & codegen state** — procedure ownership, `.describe()` coverage, REST/RPC duality, route→contract binding, DB migration status/drift.

**P2 — Manage (restored: Appwrite north-star).** Every capability the CLI exposes gets a first-class dashboard management surface following the Appwrite loop **create → configure(tabs) → monitor**, per capability (workers, sagas, triggers, streams, db, plugins, runtime-config) — never one undifferentiated "resources" list. Two laws make this safe:
- **One generator, two callers (Strapi precedent):** a dashboard action never forks logic — it invokes the *same* contract route / CLI scaffolder the terminal does (`createPluginAdapter(...).toScaffold()`, `netscript db …`, trigger enable/disable routes), and always renders its CLI-equivalent line.
- **NetScript-domain resources only:** "manage" means NetScript primitives and scaffold state (add a plugin, scaffold a resource, seed a db, flip an override, replay a DLQ). Aspire keeps process lifecycle (start/stop/restart) — that stays `withCommand`-inside-Aspire, per v1.

**P3 — Follow (restored: Encore model).** Telemetry integration returns — but as **seam-flow**, not as a copy of Aspire's raw-OTLP views. NetScript instruments its own framework seams and shows the **live journey of a request across primitives**: API call → contract procedure → returned payload → job it enqueued → saga steps → stream fan-out — a causal chain grouped by primitive with payloads at the seams. Aspire keeps the span waterfall; every flow node deep-links to `/traces/detail/{id}` for raw spans. Encore proves this is the "legendary" differentiator (Flow map + per-request trace column); NetScript's version is assembled from its **own** seam events, not re-rendered OTLP.

**Standing review gate (goes into the epic body, broadened in v2):** every merged panel must pass *"why can't this just deep-link to Aspire/Scalar?"* with a NetScript-only answer recorded in its issue — where the answer may be only-NetScript **state** (P1), only-NetScript **action** mirroring the CLI (P2), or framework-**seam semantics** no generic OTLP view can express (P3).

## 2. Non-goals (anything Aspire/Scalar already does well)

| Killed surface | Owner | What replaces it |
|---|---|---|
| **Raw OTLP trace/span waterfall** | Aspire Traces | **S13 Live Flow** — a seam-event causal journey (NetScript's own instrumentation, primitive-grouped, payload-at-seams) that out-links to `{aspireBase}/traces/detail/{id}` per node. The generic span-bar tree stays dead; the flow view is not a waterfall. |
| Console/structured logs panel (DDX-11) | Aspire Logs | Correlated read-only `ns-log-stream` strip in S6 that deep-links to `{aspireBase}/structuredlogs?resource={name}` |
| Resource start/stop/restart panel (DDX-12) | Aspire Actions menu | `withCommand` contributions that appear *in Aspire* (Actions menu + `aspire resource` CLI + Aspire MCP — one seam, three surfaces) |
| Metrics charts, GenAI conversation view | Aspire | Out-links only |
| Service `/health` panel | Aspire State column | Fix the `withHealthCheck()` wiring gap instead |
| API operation list / try-it console (old DDX-7 explorer) | Scalar `/api/docs` | S4 lists provenance/coverage/duality, then deep-links to Scalar operation anchors |

**The line v2 draws precisely:** *rendering spans Aspire already renders* is duplication; *rendering the causal chain between NetScript primitives that OTLP has no vocabulary for* is the product. S13 must never grow span bars, a time-proportional gantt, or log tails — the moment a flow node needs raw timing detail, it out-links.

## 3. The screen set (S1–S13)

Beta.6 core = S1–S10 + S13 (S10 gated on verifying a delivery read-model exists). One-line DX thesis each; full specs in `issues-rescope.md` and design prompts in `claude-design-prompts.md`.

| # | Screen | DX thesis (what only NetScript can show/do) | Issue |
|---|---|---|---|
| S1 | Shell & Wiring Home | "Is my app wired the way I declared it, and where do I jump to fix it" — stat cards are only-NetScript facts; **quick-action strip mirrors top CLI verbs** | #415 rewrite |
| S2 | Config Resolution & Topology Hand-off | Declared intent vs. running reality; `ns-stackmap` wiring graph — **v2: live traffic overlay** (edges pulse as seam events flow, Encore Flow model) | #416 rewrite |
| S3 | **Runtime-Config Monitor & Control ⚑ flagship** | The live override layer Aspire/Scalar can never know exists — **v2: plus gated write-back** (flip a flag, disable a job, from the UI, via the same routes the CLI uses) | **NEW** DDX-20 |
| S4 | Service & Contract Catalog | Contract provenance, coverage gaps, REST/RPC duality, route→contract binding; no try-it (Scalar's) | #417 rewrite |
| S5 | Plugin Control (dogfood centerpiece) | Installed plugins, contribution axes, doctor health, JSR drift — **v2: plus install/scaffold entry points** (marketplace-lite teaching `plugin add`, driving the same installer) | #420 rewrite |
| S6 | Run Inspector (+ run overlay) | Run/attempt/compensation vocabulary for one logical run (run-centric view) | #419 rewrite |
| S7 | Workers Console | Executions/retries + scheduler-vs-config drift — **v2: full manage loop** (trigger/rerun/cancel job, enable/disable, template-gallery create via #432 seam) | #428 rewrite |
| S8 | Sagas Console | Instance status incl. `compensating` + transition timeline — **v2: gated replay/compensate actions** | #429 rewrite |
| S9 | Triggers Console | Firing history, enable/disable, cron preview, webhook ingress test (already the most manage-shaped v1 screen); DLQ tab gated | #430 rewrite |
| S10 | Streams Console | Fan-out delivery state per subscriber — **v2: gated redeliver action** where the contract allows | #431 rewrite |
| S11 | DB Migrations & Drift | Pending vs. applied + drift, with **run-migrate/seed actions** mirroring `netscript db …` | **NEW** DDX-21 (beta.6-if-cheap) |
| S12 | Dead-Letter Queues | DLQ depth/reason/**bulk-replay** across KV/Redis/PG — gated on two thin co-req API slices | **NEW** DDX-22 (wave:defer) |
| S13 | **Live Flow — request journey ⚑ flagship #2** | Follow one request live across the seams: call → payload → job → saga → fan-out; primitive-grouped causal chain, per-node Aspire out-links | **#418 REWRITE** (was CLOSE) |

### 3b. The management loop per capability (P2 contract)

Every capability console fills this grid; empty cells are explicit gaps, not omissions. All mutations: existing contract route + `confirmationMessage` + CLI-equivalent CodeBlock.

| Capability | Create | Configure (tabs) | Monitor | Act |
|---|---|---|---|---|
| Workers (S7) | scaffold job/task from template (#432 seam, beta.7) | schedule + override tab (via S3 topics) | executions, drift | trigger-now, rerun, cancel, enable/disable |
| Sagas (S8) | scaffold saga (#432) | store backend (read-only view) | instances, transitions | replay / compensate (gated; route check) |
| Triggers (S9) | scaffold trigger (#432) | schedule preview, webhook config | firing history | enable/disable ✅shipped, webhook-test ✅shipped |
| Streams (S10) | scaffold topic (#432) | subscriber wiring (read) | deliveries | redeliver (gated on read-model) |
| DB (S11) | — | schema (read; drift diff) | migration state | migrate, seed (`netscript db …`) |
| Plugins (S5) | **`plugin add` from UI** (marketplace-lite) | per-plugin config view | doctor, drift | run doctor, install |
| Runtime-config (S3) | — | — | live override feed | **flip flag / disable entity / clear override** (gated write route) |

## 4. Integration story (four seams, one URL scheme)

Full architecture in `research.md` Appendix A §3 and the integration section of `issues-rescope.md` (#411/#413/#423/#424).

1. **Aspire → dashboard (entry).** `WithUrl("NetScript Dashboard", /resource/{name})` emitted by the apphost generator for every scaffolded resource + two fixed framework `withCommand`s. Seam A widening (#411) is the beta.6 unlock; Seam B (`register-*.mts`) interim.
2. **Dashboard → Aspire (correlate-then-return).** `TelemetryQueryPort` + `adapters/aspire-query` (#413) stays **correlation-only**: resolve a `traceId`, out-link to Aspire's trace/logs/metrics pages. **v2 note:** the flow view does NOT widen this port — P3 runs on the owned seam-event plane below, and #413 remains the bridge to raw spans.
3. **Dashboard ↔ Scalar.** Out: `/api/docs` + operation anchors. In: essentially nil; spec-authored `externalDocs` optional polish (#424).
4. **CLI → dashboard.** `netscript dashboard open|url`, console banner on `netscript dev`; never auto-open (#424).

**Data plane (owned, #423):** `/_netscript/*` introspection over already-shipped oRPC contracts — **v2 adds `/_netscript/flows` (SSE)**: beta.6 assembles flows by joining the already-shipped per-primitive streams (workers `GET /subscribe`, trigger events SSE, saga history, runtime-config SSE) on the stamped `traceparent`; the co-req **DDX-23** upgrades fidelity with a unified seam-event envelope + HTTP request ingress/egress boundary events. Strictly separate from the borrowed telemetry plane (#413).

## 5. Phasing

**Beta.6 core (build-UI-only or nearly free):**
- Seams/plumbing: #410, #411, #412 (+ `FlowRecord` domain model), #413 (correlation-only), #414, #423 (+ `/_netscript/flows` join), #424, #427.
- Screens: S1–S9 (+S10 if delivery read-model exists), **S3 including write-back where a mutation route already ships** (trigger enable/disable today; flag/job override write needs a thin runtime-config mutation route — in DDX-20 scope if the store exposes set/unset use-cases, else co-req), **S13 in correlation-join fidelity** (existing streams only).
- Design pre-step: #507 prototypes S1–S13 in Claude Design; duplication caught at design review.
- Gate: #426 E2E — v1 assertions + S13 assertion: one HTTP request produces a flow chain with ≥3 primitive-labeled seam nodes and a per-node Aspire out-link URL (never an in-dashboard span render).

**Beta.7 (the management wave):** **#432 elevated from defer** — "Add resource" scaffold-from-UI as the P2 keystone (one generator, two callers), template-gallery create entries in S5/S7–S10; DDX-23 seam-event envelope; S8 replay/compensate route work.

**Beta.6-if-cheap / fast-follow:** S11 DB migrations (DDX-21), S2 live-traffic overlay + telemetry-coverage overlay, S5 JSR version drift, S7 scheduler-drift panel.

**Later (wave:defer):** S12 DLQ (DDX-22) + two co-req API slices; in-dashboard AI-on-codegen (Strapi AI precedent → converges with `@netscript/plugin-ai` #238 — chat/design-import/code-analysis driving the same scaffolder); in-app plugin marketplace (Directus precedent) beyond the S5 marketplace-lite; composite "reset-stack" orchestration.

## 6. Cross-cutting laws inherited by every screen

- CLI-equivalent-of-every-mutating-action (exact `netscript …` line via CodeBlock) — the salvaged transparency pattern, now doing double duty as the P2 trust anchor.
- **One generator, two callers:** dashboard mutations invoke the same contract routes / scaffolder the CLI invokes; no dashboard-only write paths.
- **Create → configure(tabs) → monitor loop** per capability section; configuration lives in tabbed settings sub-panels, never crammed into create forms (Appwrite IA).
- **Nav taxonomy = capability taxonomy:** top-level nav entries named after primitives (Workers, Sagas, Triggers, Streams — not "Data"/"Resources"); any future scopes/permissions picker mirrors the same tree (Appwrite API-keys insight).
- Shared `STATUS_VARIANT` map: `completed→success`, `running→primary`, `failed→destructive`, `retrying|degraded→warning`, `queued→muted`.
- Token law (`--ns-*` only), light default + `[data-theme='dark']`, `prefers-reduced-motion` fallbacks, density-first console chrome.
- Every panel arrives through the `DashboardPanelContribution` seam (#427) — validated by Directus's Panel/Module extension taxonomy; the dashboard is itself a plugin (dogfood), and third-party plugins contribute panels through the same typed axis.
- Program note (not a screen): NetScript owns the **domain-state MCP surface** mirroring Aspire's observability MCP — complementary halves.

## 7. Provenance — the gold conclusions this plan adheres to

From `plan-roadmap-expansion--seed/research/A-dashboard/04-baas-admin-console-teardown.md`: (1) per-capability manage-through-UI with the create→configure(tabs)→monitor loop (Appwrite); (2) plugin-contributes-a-panel as a typed extension axis (Directus → #427); (3) schema-driven UI generation for a future db tab (Directus → deferred); (4) codegen-from-UI mirroring the CLI — one generator, two callers (Strapi → #432); (5) in-dashboard AI on codegen (Strapi AI → #238 convergence, defer). From `03-competitor-dev-console-teardown.md`: Encore Flow (live code-derived map → S2 overlay) + per-request trace journey with payloads (→ S13); run-list→detail→timeline (Temporal/Inngest → S6–S10); `/_nitro/tasks`-style introspection (→ #423); rerun-from-step + attempt badges (Inngest → S7/S8 actions).
