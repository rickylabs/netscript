# Dev Dashboard Rescope — Claude Design Prompts (S1–S12)

Run: `dashboard-rescope--seed` · 2026-07-06. One self-contained, paste-ready prompt per rescoped screen, written for claude.ai/design against the **published NS One design system** (the `packages/fresh-ui` ns-* registry, which on main now includes the merged #547 pixel-polish pass).

Usage:
- Create/reuse a Claude Design project with the NS One design system attached; paste ONE prompt block per design conversation. Each prompt is fully self-contained — the design agent needs no other context.
- Design-review gate (from the epic's non-duplication acceptance line): reject any produced screen that renders an owned trace waterfall, log tail, metrics chart, resource start/stop panel, or operation list/try-it — those must appear only as out-link affordances, and every prompt says so explicitly.
- Design-sync caution: when round-tripping artifacts, emit `_ns_runtime.js`/`_ns_styles.css` — never `_ds_*` names (the canvas clobbers uploaded `_ds_*` files).
- Waves: S1–S10 are beta.6 core (S10 pending a delivery read-model check), S11 beta.6-if-cheap, S12 later-wave — prototype S11/S12 as shells if time-boxed.

---

```markdown
# S1 — Dashboard Shell & Wiring Home

**Design a Claude Design screen using the published "NS One" design system (the ns-* component library).** This is the home shell of the NetScript Dev Dashboard — a DX satellite that orbits the .NET Aspire dashboard and Scalar API docs; it never rivals them. It renders only what NetScript uniquely knows: primitive run-state, config/override resolution, plugin-registry wiring, codegen state.

**DX thesis:** one screen that answers "is my NetScript app wired the way I declared it, and where do I jump to fix it."

**User + moment:** a developer just ran `netscript dev`, Aspire is up in another tab, and they open the dashboard to sanity-check the app before writing code. They carry the question: "did everything load and bind correctly, or is something silently unwired?"

**Layout / chrome:** use `sidebar-shell` (block) as the frame — left sidebar nav (Home, Config Resolution, Runtime Config, Catalog, Plugins, Run Inspector, then a Consoles group: Workers, Sagas, Triggers, Streams; and Data: Migrations, DLQ), a topbar, and a `breadcrumb`. In the topbar right, place the environment identity pill `ns-envbar` reading `local · my-app · aspire` with a green status dot (app segment emphasized), plus `theme-toggle` and a `search` affordance that opens the ⌘K palette. Density-first: this is a console, not a marketing page.

**Panels + concrete data:**
- **Health stat grid** (`stats-grid`): six cards, each a *only-NetScript* fact, each deep-linking to its owning screen. `12 plugins loaded` → Plugins; `3 doctor warnings` (warning tone) → Plugins; `2 unbound routes` (warning) → Catalog; `4 disabled overrides` → Runtime Config; `1 pending migration` (warning) → Migrations; `1 scheduler drift` (warning, "config says `nightly-reconcile` scheduled, live scheduler disagrees") → Workers. Zero-problem cards read success tone.
- **Command palette** (`command-palette`): primary nav, ⌘K. Seed commands: "Go to Run Inspector", "Open Aspire dashboard", "Run plugin doctor", "View pending migrations".
- **Contributed-panels strip**: a `data-table` or card row proving the dashboard is itself a plugin — list `DashboardPanelContribution` entries: `workers → Executions panel`, `sagas → Instances panel`, `triggers → Firings panel`, `runtime-config → Override feed`. Column: plugin, panel title, mount target.

**Reach for:** `sidebar-shell`, `stats-grid`, `command-palette`, `ns-envbar`, `breadcrumb`, `card`, `badge`, `theme-toggle`, `search`.

**States:** loading (stat cards → `skeleton`); healthy (all-success grid, calm); degraded (mix of warning cards, the interesting default — design this); error (config failed to resolve → `alert` "Could not read netscript.config" spanning the grid). Live: stat counts update quietly; do not animate aggressively.

**Hand-off affordances:** a prominent topbar/secondary button "Open Aspire Dashboard" (external, `WithUrl` target). Each stat card is a deep-link into an S* screen. Note in the UI that Aspire links back here via its own "NetScript Dashboard" resource URL.

**Non-goals:** do NOT put logs, traces, metrics charts, or resource start/stop controls on this screen — those are Aspire's. No process control. Keep stats to facts only NetScript can compute.

**Theme:** light is the default (warm cream); dark via `[data-theme='dark']`. Every color a `--ns-*` token; status colors via the shared `STATUS_VARIANT` map (`completed→success, running→primary, failed→destructive, retrying|degraded→warning, queued→muted`). Buttons carry the hard-offset non-blurred press shadow (3px→2px→1px on hover/active) — physically pressed, not glassy. Respect `prefers-reduced-motion`.
```

```markdown
# S2 — Config Resolution & Topology Hand-off

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard, a DX satellite to Aspire/Scalar. This screen shows *declared intent vs. running reality* — the seam Aspire structurally cannot render.

**DX thesis:** "here is what you declared (services / apps / dbs / plugins, saga-store backend, resource mode) and each node jumps into the matching thing Aspire is running."

**User + moment:** a dev added a plugin and wired a new saga; they open this screen to confirm the wiring resolved — which plugin's saga triggers which worker queue, which trigger fires which stream — before running anything. Question: "did my declared wiring actually connect end to end?"

**Layout:** three-zone console. Compose the left list rail with `ns-rail-grid` and the right detail rail with `ns-content-rail` — do not invent a new grid. Use `sidebar-shell` chrome + `ns-envbar` + `ns-page-header--console` (denser h1). Below 860px collapse to single column.
- **Left (`tree-nav`):** resolved declared intent as a native `<details>` tree — Services (`web`, `api`, `eis-chat`), Apps, Databases (`postgres`, `redis`), Plugins (`workers`, `sagas`, `triggers`, `streams`).
- **Center — capability wiring graph:** use `ns-stackmap`. Nodes are capabilities (`aria-pressed` toggle buttons on a grid); edges are the measured SVG overlay between node rects. Show real cross-primitive wiring: `sagas:order.fulfillment` → `workers:reserve-inventory` queue; `triggers:cron.nightly-reconcile` → `workers:reconcile`; `triggers:webhook.payment` → `streams:payment-events`; `streams:payment-events` → 3 subscribers. Selecting a node single-selects and filters siblings + highlights its edges and the running Aspire resource it maps to.
- **Right (`ns-content-rail`):** node detail via `connector` key/value rows (backend, mode, durability tier) plus a telemetry-coverage badge per node: `ok` (wired-to-emit) or `unwired` (configured-but-unwired). Cross-links out.

**Concrete data:** node `sagas:order.fulfillment` — backend `postgres`, durability `durable`, coverage `ok`, contributed by plugin `sagas`. Node `streams:payment-events` — coverage `unwired` (warning) "instrumentation registered but no exporter bound."

**Reach for:** `ns-stackmap`, `tree-nav`, `ns-rail-grid`, `ns-content-rail`, `connector`, `badge`, `ns-page-header--console`, `button`.

**States:** loading (graph → `skeleton`, tree → skeleton rows); empty (no plugins wired → `empty-state` "No capabilities wired yet"); error (`inspectConfig` failed → `alert`); selected (node highlighted, edges lit, rail filled). Coverage overlay may be a later toggle — design a "Telemetry coverage" switch that tints unwired nodes.

**Hand-off:** each node detail has "Open in Aspire" (`WithUrl` per node — answers "did I wire this right" live), "View plugin" → S5, "View contracts" → S4.

**Non-goals:** this is NOT an infra topology / resource health redraw — Aspire owns resource graph, health, endpoints, start/stop. Do not draw containers, CPU, or process state. Draw *capability wiring* only.

**Theme:** `--ns-*` tokens only; edge/series colors via `color-mix()` from intent tokens, never literal hex. Light default + dark. `aria-pressed` for node toggles (not `aria-selected`); `data-state` reserved for status. Reduced-motion fallback for any edge/pulse animation.
```

```markdown
# S3 — Runtime-Config Monitor  ⚑ flagship

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard. This is the flagship, cheapest-to-ship, most-differentiated surface: the live override layer that Aspire (infra) and Scalar (spec) can never know exists.

**DX thesis:** "someone just flipped feature flag `checkout-v2` to 30% rollout / disabled job `nightly-reconcile`" — the live runtime-config override layer, streamed as it changes.

**User + moment:** a dev's local behavior suddenly changed — a job stopped firing, a code path went dark. They open this screen to see what override moved. Question: "what changed in runtime config, when, and by which version?"

**Layout:** single primary column with a right context rail (`ns-content-rail`), under `sidebar-shell` + `ns-page-header--console`. Density-first, read-only in beta.6.
- **Live activity feed** (`activity-feed`, generalized non-chat): append-only override-change events, newest on top, `data-tone` by kind. Sample items: `flag checkout-v2 → 30% rollout` (primary), `job nightly-reconcile → disabled` (warning), `saga order.fulfillment → task override applied` (primary), `trigger payment-webhook → re-enabled` (success). Each item: `__marker`, `__text`, mono `__time`. Add a "Follow" `switch` on the tail toolbar.
- **Current-state stat grid** (`stats-grid`), one card per of 5 topics: `Feature flags: 7 active`, `Disabled jobs: 2`, `Disabled sagas: 0`, `Disabled triggers: 1`, `Task overrides: 3`.
- **Version history** (`ns-step-timeline` shape): the versioned `current` pointer as steps — `v41 → v42 → v43 (current)`, each step showing what changed, a duration/offset meta, and an expandable diff. Diff view as All / Compact / JSON toggle (JSON via `code-block` + Tabs swap).

**Reach for:** `activity-feed`, `stats-grid`, `ns-step-timeline`, `switch`, `code-block`, `ns-content-rail`, `badge`, `connector`.

**States:** loading (`skeleton`); empty (no overrides ever set → `empty-state` "Runtime config is at defaults"); live-updating (SSE tail — new feed items slide in; when Follow off, show a "3 new changes" pill to click); error (`inline-notice` "SSE feed dropped, reconnecting"). Read-only: no write-back controls in beta.6 — do not design edit forms.

**Hand-off:** a disabled entity links to its capability console — disabled `job nightly-reconcile` → "Open in Workers" (S7); disabled trigger → S9. In-links from the S1 stat card.

**Non-goals:** do NOT design metrics charts or logs. This is override-change state, not telemetry. No write-back UI.

**Theme:** `--ns-*` only, light default + dark. Tones via `data-tone`; status via `STATUS_VARIANT`. Job ids as mono `job_...`, never `#`. Reduced-motion: feed items appear without motion when reduce is set.
```

```markdown
# S4 — Service & Contract Catalog

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard. This shows contract *provenance and coverage above the OpenAPI boundary* — what Scalar cannot see. It is never a second try-it console.

**DX thesis:** "which plugin contributed this procedure, is it installed, does it serve REST and typed RPC, and why is its Scalar page thin."

**User + moment:** a dev is wiring a client and wants to know where a procedure came from and whether it's documented — then jump to Scalar to actually call it. Question: "what's the provenance and coverage of my contracts, and which routes are unbound?"

**Layout:** three-zone. `ns-rail-grid` left tree + main `data-table` + optional `ns-content-rail`. `sidebar-shell` + `ns-page-header--console`.
- **Left (`tree-nav`):** contract tree grouped plugin → namespace: `workers › jobs`, `sagas › instances`, `triggers › events`, `streams › delivery`, `crons › schedule` (not installed). Wrap the not-installed group in `plugin-gated-view` (`data-state='not-installed'`) teaching `netscript plugin add crons` — a concept Scalar has no equivalent for.
- **Main (`data-table`):** contracts as read-only provenance rows, NOT a call form. Columns: Procedure (`order.fulfillment.start`), Provenance (plugin/namespace badge), Method badge (GET→muted, POST→primary, PATCH→warning, DELETE→destructive), Coverage (`complete` / `thin` warning — missing `.describe()`), Duality chips (`REST` + `RPC` + `SDK`). Each row → "Open in Scalar" ghost button (deep-link, + operation anchor).
- **"Fresh route wiring" tab** (use the Tabs skin `ns-tabs`): list `DiscoveredNetScriptRoute` bindings — bound vs unbound, inline vs `.route.ts` sidecar. Sample: `/checkout` bound → `checkout.page.tsx`; `/admin/reconcile` UNBOUND (warning) with an authoring hint.

**Reach for:** `tree-nav`, `plugin-gated-view`, `data-table`, `badge`, `ns-tabs` skin, `code-block`, `ns-content-rail`, `button`.

**States:** loading (`skeleton` table + tree); empty (no contracts → `empty-state`); gated (not-installed plugin → `plugin-gated-view` with install `code-block`); error (`alert`); thin-coverage rows flagged warning.

**Hand-off:** "Open in Scalar" → `/api/docs` (+ anchor) for reference / try-it — never re-rendered here. Provenance rows → S5 for the contributing plugin. In-link from S2 node detail.

**Non-goals:** do NOT build an endpoint call-form, request builder, schema explorer, or typed response panel — that is Scalar's job and the owner mandate forbids replicating it. No auth try-it. Render registry/wiring metadata only.

**Theme:** `--ns-*` only, light + dark. Method/status via shared variant maps. `<details>` tree, real `<button>` rows, `role=option`/`aria-selected` for selection, `data-state` for status only. Reduced-motion respected.
```

```markdown
# S5 — Plugin Control (dogfood centerpiece)

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard. Fleet-level plugin wiring that nothing else in the toolchain shows. This is the dogfood centerpiece — the dashboard is itself a plugin.

**DX thesis:** "what's installed, what does each plugin wire into (routes/db/workers/streams/telemetry — 8–10 axes), is it healthy, and is it version-drifted."

**User + moment:** a dev suspects a plugin is misconfigured or out of date after an install. Question: "which plugins are loaded, are they healthy, and is anything drifted from the published JSR version?"

**Layout:** master-detail. `data-table` list on the left/top, `detail-layout` per-plugin on selection. `sidebar-shell` + `ns-page-header--console`.
- **Plugin list (`data-table`):** rows for `workers` (v1.4.0, healthy), `sagas` (v1.4.0, healthy), `triggers` (v1.3.2, 1 degraded check → warning badge), `streams` (v1.4.0, healthy), `auth` (v0.9.1, drift: latest 1.0.0 → warning). Columns: plugin, status badge, version, drift indicator. Not-installed candidates gated by `plugin-gated-view`.
- **Detail (`detail-layout`):** for the selected plugin — a **contribution-axis map** showing which axes it wires (Routes, DB, Workers, Streams, Triggers, Telemetry, Config, CLI) as a compact `connector` or badge grid; **doctor-check rows** (`connector`, `data-state='ok|degraded|failed'`) e.g. `triggers`: `schedule parser ok`, `webhook ingress ok`, `DLQ port degraded — no contract route`; a **version-drift row** `installed v0.9.1 → latest v1.0.0` with an update hint.
- **"Run doctor" action:** a button that reveals its CLI-equivalent `netscript plugin doctor triggers` in a `code-block` (Tooltip/inline) — the transparency pattern.

**Reach for:** `data-table`, `detail-layout`, `connector`, `badge`, `plugin-gated-view`, `code-block`, `button`, `ns-content-rail`.

**States:** loading (`skeleton`); empty (no plugins → `empty-state`); healthy vs degraded vs failed doctor rows; drift present vs none; not-installed (`plugin-gated-view` with `netscript plugin add <id>`); error (`alert` "registry read failed").

**Hand-off:** "View wiring" → S2 graph filtered to this plugin; "View contracts" → S4; a plugin owns its `DashboardPanelContribution`s on other screens — link to them.

**Non-goals:** no start/stop/restart of processes (Aspire owns that), no logs, no metrics. Every mutating action shows its CLI-equivalent — no hidden magic.

**Theme:** `--ns-*` tokens only, light default + dark. Status via `STATUS_VARIANT`; versions in mono. Hard-offset press shadow on buttons. Reduced-motion respected.
```

```markdown
# S6 — Run Inspector (+ NetScript trace overlay)

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard — the strongest complementary surface. A "run" (saga instance / job attempt sequence / trigger firing / stream delivery) is a NetScript-primitive concept Aspire (black-box process) and Scalar (static schema) have no vocabulary for.

**DX thesis:** "this run is a saga on step 3 of 5, currently COMPENSATING step 2, retried once."

**User + moment:** a dev sees an order didn't complete. They open Run Inspector to trace the run across eischat → workers → streams as one logical thing. Question: "where in the run did it fail, how many attempts, and what compensated?"

**Layout:** the canonical console shape — list → detail → step-timeline → activity-feed. `ns-rail-grid` (left run list) + main detail + `ns-content-rail` (right run rail). `sidebar-shell` + `ns-page-header--console`.
- **Run list (`entity-rail`):** filterable (`role=listbox`), status `select` + capability `select` + text filter + Reset. Rows: `order.fulfillment` saga — COMPENSATING (warning); `job_4183` reserve-inventory — RETRYING attempt 2/5 (warning); `payment-webhook` firing — completed (success); `payment-events` delivery — completed. `empty-state` on zero-match.
- **Detail (`RunDetail`):** inputs / results as `connector` rows + `code-block` payloads.
- **Step timeline (`ns-step-timeline`):** marker + title + attempt-pill + duration/offset + expandable I/O `code-block`. For `order.fulfillment`: `1 validate ✓`, `2 charge ✓`, `3 reserve-inventory ⟳ retrying`, `2 charge → COMPENSATING` (the compensation step), with attempt pills. All / Compact / JSON toggle (JSON = `code-block`+Tabs swap).
- **Run rail (`ns-content-rail` → `activity-feed`):** run events (`retrying` badge, redis degradation note) + `connector` context. Include a correlated `ns-log-stream` strip that is read-only and **deep-links to Aspire logs** — it does not own logs.

**Reach for:** `entity-rail`, `ns-step-timeline`, `activity-feed`, `connector`, `code-block`, `select`, `empty-state`, `badge`, `ns-log-stream` (strip only), `ns-rail-grid`, `ns-content-rail`.

**States:** loading (`skeleton`); empty / zero-match (`empty-state`); live-updating (new run events append; `retrying` pulse); error (`alert`). Attempt/retry vocabulary throughout.

**Hand-off:** "View full trace in Aspire" → `/traces/{traceId}` for the raw span waterfall (reverse of Aspire's "Open in Run Inspector" command). Log strip → Aspire logs.

**Non-goals:** do NOT render span bars / a proportional trace waterfall here — Aspire owns it, link out. No metrics. The only timeline is the NetScript-domain step timeline annotated with primitive semantics (queue name, attempt, saga step, firing id).

**Theme:** `--ns-*` only, light + dark. `STATUS_VARIANT` map. Mono ids (`job_4183`). `data-state` for status, `aria-selected` for list selection. Reduced-motion fallback for retry pulse.
```

```markdown
# S7 — Workers Console

**Design a Claude Design screen using the published "NS One" design system.** A per-capability console in the NetScript Dev Dashboard. Aspire proves the process is up; only NetScript knows the run. 21 shipped oRPC routes already back this — build UI only.

**DX thesis:** "which job ran, retried twice, failed on attempt 2 of 3, and does the live scheduler agree with what I declared."

**User + moment:** a dev's scheduled job seems flaky. Question: "is my job executing, how are retries going, and does the live scheduler match my declared cron?"

**Layout:** shares the Run Inspector shape — list → detail → step-timeline → feed — scoped to workers. `ns-rail-grid` + `ns-content-rail`, `sidebar-shell` + `ns-page-header--console`.
- **Registry (`data-table`):** `JobDefinition`/`TaskDefinition` list — `reserve-inventory` (cron `*/5 * * * *`), `nightly-reconcile` (cron `0 2 * * *`, DISABLED via override → muted), `send-receipt` task. Columns: name, kind, schedule, last status.
- **Live execution feed (`activity-feed`, SSE):** `ExecutionRecord` events — `job_4183 reserve-inventory RUNNING attempt 2/3` (warning), `job_4180 COMPLETED 412ms` (success), `job_4177 FAILED exitCode 1` (destructive). Live via `execution.*`/`worker.status`/`heartbeat`.
- **Workflow timeline (`ns-step-timeline`):** multi-step `WorkflowExecution` per-step status/kind/durationMs.
- **Scheduler-vs-config drift panel** (`connector` rows, `data-state`): flag `nightly-reconcile: config says scheduled, live scheduler disagrees` (failed) — subscribe `jobScheduled`/`jobRun`/`jobError`.
- **Trigger-execution action:** button + CLI-equivalent `netscript workers run reserve-inventory` in a `code-block`.

**Reach for:** `data-table`, `activity-feed`, `ns-step-timeline`, `connector`, `badge`, `code-block`, `button`, `ns-rail-grid`, `ns-content-rail`.

**States:** loading (`skeleton`); empty (no jobs → `empty-state`); live (SSE feed appends, heartbeat dot); error (`inline-notice` "subscribe stream dropped"); disabled jobs muted.

**Hand-off:** "Open full run" → S6 Run Inspector; "View trace" → Aspire `/traces/{id}` for a specific execution; in-link from S3 (disabled job). Drift panel may link into S2 wiring.

**Non-goals:** no logs panel (Aspire), no metrics charts, no process control. The scheduler-drift comparison is the uniquely-NetScript payload — foreground it.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT`; mono ids/durations. Reduced-motion for the running pulse.
```

```markdown
# S8 — Sagas Console

**Design a Claude Design screen using the published "NS One" design system.** A per-capability console in the NetScript Dev Dashboard. The archetypal complementary capability — `COMPENSATING` is a status no other tool has a concept of. `GET /instances` and `.../history` are shipped — build UI only.

**DX thesis:** "step 3 of 5, compensating step 2, retried once" — the saga state machine, rendered.

**User + moment:** a dev's order saga rolled back and they need to see the compensation path. Question: "which step failed, what compensated, and what's the durability tier?"

**Layout:** Run Inspector shape scoped to sagas — `ns-rail-grid` list + detail + `ns-content-rail` feed. `sidebar-shell` + `ns-page-header--console`.
- **Instance table (`data-table`):** `SagaStateEnvelope` rows — `order.fulfillment #a1f` COMPENSATING (warning), durability `durable`; `refund.flow #b2c` COMPENSATED (warning/settled), durability `durable`; `signup.flow #c3d` completed (success), durability `at-most-once`. Columns: saga, instance id (mono), status badge, durability tier.
- **Transition / compensation timeline (`ns-step-timeline`):** render the from→to `SagaTransitionRecord` state machine for the selected instance: `pending → charged → reserving → (reserve failed) → compensating:charged → refunded`. Show "step 3 of 5, compensating step 2, retried once" with attempt pills and expandable I/O `code-block`. All / Compact / JSON toggle.
- **Transitions feed (`ns-content-rail` → `activity-feed`):** each from→to transition with `data-tone`, mono timestamps.

**Reach for:** `data-table`, `ns-step-timeline`, `activity-feed`, `connector`, `badge`, `code-block`, `ns-rail-grid`, `ns-content-rail`.

**States:** loading (`skeleton`); empty (no instances → `empty-state`); live-updating (transitions append); error (`alert`); COMPENSATING renders warning tone, COMPENSATED as a settled warning/muted — design both distinctly.

**Hand-off:** "View trace" → S6 / Aspire `/traces/{id}` for the underlying spans. Note a FUTURE "Replay saga step N" action arriving via Aspire `withCommand` — do NOT design an in-dashboard confirm dialog for it (`IInteractionService` is confirmed absent from the TS AppHost SDK; do not design around a confirmation-prompt capability that doesn't exist).

**Non-goals:** outbox / idempotency / retry-policy panels are future (not yet wired) — do not design them. No span waterfall, no logs, no metrics — link out.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT` (add COMPENSATING/COMPENSATED → warning); mono instance ids. Reduced-motion respected on any state-machine animation.
```

```markdown
# S9 — Triggers Console

**Design a Claude Design screen using the published "NS One" design system.** A per-capability console in the NetScript Dev Dashboard. Control actions with immediate feedback no other tool offers. `GET /events*`, `/events/subscribe`, `enable|disable`, schedule `preview`, and webhook `test` are all shipped — build UI only.

**DX thesis:** "when does this cron actually next fire given tz + backfill, and let me silence a misbehaving trigger without redeploy."

**User + moment:** a dev has a noisy trigger firing too often and wants to disable it locally and check the next fire time. Question: "when does this fire next, and can I silence it now?"

**Layout:** Run Inspector shape scoped to triggers, with control affordances. `ns-rail-grid` + `ns-content-rail`, `sidebar-shell` + `ns-page-header--console`.
- **Firing-history feed (`activity-feed`, live SSE):** `TriggerEvent` rows by kind — `cron.nightly-reconcile fired` (scheduled), `webhook.payment received attempt 1` (webhook), `file-watch.config changed` (file-watch, folds in the Watchers `WatchEvent` view), `queue.retry` — with status/attempt and mono timestamps.
- **Enable/disable toggle:** per-trigger `switch` (`aria-pressed` standalone toggle) — mutating action with immediate feedback + CLI-equivalent `netscript triggers disable payment-webhook` in a `code-block`. Show `TriggerEnabledStateOverride` state.
- **Schedule-preview panel:** `computeNextFireTimes` for a cron — "Next 5 fires (tz America/New_York): 02:00, 03:00 …" as `connector` rows, honoring backfill.
- **Webhook test-delivery form:** a small `form-field` + `button` to POST a test payload (`/webhooks/{id}/test`) — ingress simulation, explicitly distinct from Scalar's app-route try-it.
- **DLQ tab (`ns-tabs`):** GATED — wrap in `plugin-gated-view`/`inline-notice` "DLQ panel pending `TriggerDlqPort` contract route" since no route exists yet.

**Reach for:** `activity-feed`, `switch`, `connector`, `form-field`, `button`, `code-block`, `ns-tabs`, `inline-notice`, `badge`, `ns-rail-grid`, `ns-content-rail`.

**States:** loading (`skeleton`); empty (no firings → `empty-state`); live (SSE appends); toggle in-flight (optimistic + confirm); error (`inline-notice`); DLQ tab gated/disabled state.

**Hand-off:** "Open firing run" → S6; if the trigger fires a worker queue (via S2 wiring edge) → S7; "View trace" → Aspire.

**Non-goals:** DLQ panel is NOT built yet — show the gated placeholder only. No logs/metrics. Webhook test is ingress simulation, not a Scalar operation call — keep it clearly separate.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT`; mono times/ids. `aria-pressed` for the enable toggle. Reduced-motion respected.
```

```markdown
# S10 — Streams Console

**Design a Claude Design screen using the published "NS One" design system.** A per-capability console in the NetScript Dev Dashboard. Stream fan-out / delivery state as NetScript-primitive run-state — invisible to Aspire/Scalar. This is the lowest-shipped of the four consoles; design it to gracefully handle a thin/absent read-model.

**DX thesis:** "which subscribers received this message, and how many delivery attempts each took."

**User + moment:** a dev published to `payment-events` and one subscriber didn't react. Question: "did the message fan out to every subscriber, and did any delivery retry or fail?"

**Layout:** Run Inspector shape scoped to streams. `ns-rail-grid` + `ns-content-rail`, `sidebar-shell` + `ns-page-header--console`.
- **Delivery feed (`activity-feed`):** stream messages — `payment-events msg_88f published`, then per-subscriber delivery events: `→ receipt-worker delivered` (success), `→ ledger-sync delivered attempt 2` (warning), `→ analytics FAILED` (destructive). Folds any stream-side watcher/delivery events.
- **Fan-out timeline (`ns-step-timeline`):** per-subscriber delivery status/attempt for the selected message — one step per subscriber with attempt pills and expandable payload `code-block`.
- **Subscriber wiring:** pulled from the S2 graph — a `connector` list of subscribers bound to this stream (`receipt-worker`, `ledger-sync`, `analytics`), each with a link to its owner.

**Reach for:** `activity-feed`, `ns-step-timeline`, `connector`, `badge`, `code-block`, `ns-rail-grid`, `ns-content-rail`, `empty-state`.

**States:** loading (`skeleton`); **contract-absent** (if no delivery read-model exists yet, show `empty-state` "Stream delivery inspection is coming — contract not yet wired" rather than a broken table — design this prominently); empty (no messages → `empty-state`); live (deliveries append); error (`alert`); mixed per-subscriber status (deliver/retry/fail) in one fan-out.

**Hand-off:** "Open full run" → S6 Run Inspector (streams is the tail of the flagship HTTP→workers→callback→stream fan-out run); "View trace" → Aspire.

**Non-goals:** no logs/metrics. Do not over-build if the delivery read-model is thin — the graceful "not yet wired" state is a first-class requirement here, not an afterthought. No span waterfall.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT`; mono message ids (`msg_88f`). Reduced-motion respected.
```

```markdown
# S11 — DB Migrations & Drift  ⚑ new

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard. Aspire shows the DB *resource* is up; it never shows migration state — a frequent "why is my query failing" root cause. Backed by the existing `db status` use-case exposed via a thin dashboard read API.

**DX thesis:** "which migrations are pending vs. applied, and has the schema drifted from my Prisma schema."

**User + moment:** a dev's query fails on a missing column. Question: "did I forget to apply a migration, or has the DB drifted from schema?"

**Layout:** single primary column, optional right rail. `sidebar-shell` + `ns-page-header--console`. Density-first.
- **Migration table (`data-table`):** Prisma migration status rows — `20260701_init` applied (success), `20260703_add_orders` applied, `20260706_add_receipts` PENDING (warning). Columns: migration name (mono), applied-at, status badge.
- **Drift alert (`alert`):** if introspect shows drift — "Schema drift detected on table `orders`: column `status` type mismatch" (warning/destructive). Suppressed when in sync (show a success `inline-notice` "Schema in sync").
- **Introspect diff (`code-block`):** the drift/introspect diff rendered as a fenced diff block with filename header.
- **"Run migrate" action:** `button` + CLI-equivalent `netscript db migrate` in a `code-block` (transparency pattern). Read-only preview of what would apply.

**Reach for:** `data-table`, `alert`, `inline-notice`, `code-block`, `stats-grid`, `button`, `badge`.

**States:** loading (`skeleton`); empty (fresh DB, no migrations → `empty-state`); in-sync (success notice, no drift); pending migrations (warning rows); drift (`alert`); error (`alert` "could not reach database / prisma engine flake — retry"; note transient Prisma schema-engine crashes self-clear on re-run).

**Hand-off:** "Open DB resource in Aspire" → `WithUrl` for the postgres resource.

**Non-goals:** do NOT design a query console, data browser, or metrics — Aspire and DB tools own those. Migration + drift state only. No destructive apply without the CLI-equivalent shown.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT`; migration names in mono. Hard-offset press shadow on the migrate button. Reduced-motion respected.
```

```markdown
# S12 — Dead-Letter Queues (queue + trigger)

**Design a Claude Design screen using the published "NS One" design system.** Part of the NetScript Dev Dashboard. Dead-letter inspection across KV/Redis/Postgres backends with bulk replay — pain-point 4. NOTE: both DLQ surfaces are currently port-only with no contract route; design this screen to render fully only when the API exists, and to show a clear gated state until then.

**DX thesis:** "why did messages die across KV/Redis/Postgres, show me depth, and let me bulk-replay."

**User + moment:** a dev notices work silently stopped completing. Question: "how many messages are dead, why did they die, and can I replay them safely?"

**Layout:** single primary column + detail rail. `sidebar-shell` + `ns-page-header--console`. Two sub-sections via `ns-tabs`: Queue DLQ and Trigger DLQ.
- **Depth stat grid (`stats-grid`):** per-backend depth — `KV: 0`, `Redis: 14` (warning), `Postgres: 2`. From `depth()`.
- **Failed-message table (`data-table`):** `DeadLetterRecord` rows — `msg_5521 reserve-inventory` reason `handler threw` errorCode `E_TIMEOUT` (destructive); `msg_5530` reason `max attempts exceeded`. Columns: message id (mono), source, reason, errorCode, dead-at. Row → detail `code-block` of the payload.
- **Bulk reprocess action:** select rows → `button` "Reprocess selected" invoking `reprocess()`, paired with CLI-equivalent `netscript queue dlq reprocess --backend redis` in a `code-block`. Since this is destructive, gate behind an explicit confirm affordance (`alert`/inline confirm) — note the Aspire-side `withCommand` `confirmationMessage` is the eventual path; in-dashboard, use a plain confirm step.
- **Gated state:** wrap the whole surface in `plugin-gated-view`/`inline-notice` "DLQ inspection pending contract routes: `TriggerDlqPort` route + `queue` `DeadLetterStore` API" so it reads correctly before the API ships.

**Reach for:** `stats-grid`, `data-table`, `ns-tabs`, `code-block`, `button`, `alert`, `inline-notice`, `plugin-gated-view`, `badge`, `ns-content-rail`.

**States:** loading (`skeleton`); **API-absent / gated** (primary state today — design the teaching placeholder prominently); empty (queues drained → `empty-state` "No dead-lettered messages"); populated (depth warnings, failed rows); reprocess in-flight + confirm; error (`alert`).

**Hand-off:** in ← S9 Triggers DLQ tab; in ← S7 for queue-backed workers. Row → S6 Run Inspector for the original run.

**Non-goals:** do NOT build this as if the API exists — the gated/placeholder state is required. No logs/metrics. Bulk replay must always surface the CLI-equivalent and a confirm.

**Theme:** `--ns-*` only, light + dark; `STATUS_VARIANT`; mono message ids/error codes. Reduced-motion respected. Destructive actions in destructive-token styling.
```