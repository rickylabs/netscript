# NetScript Dev Dashboard — Prototype Screen Catalog (ground truth)

Captured 2026-07-12 from Claude Design project `4c19e768-56d1-4bcd-956c-9cc8fe2f0f00`,
file `NetScript Dev Dashboard.dc.html` (211 KB), rendered locally (support.js + React 18 UMD)
at 1440×900, default props `scenario=degraded`, `simulate=true`. Full-page screenshots in
`screenshots/`; prototype source snapshot in `prototype/`; the prior adversarial review +
POC ground truth pulled into `design-project/`.

**Render recipe** (reproduce): serve `prototype/` over HTTP, open
`NetScript Dev Dashboard.dc.html#/<route>`, reload, wait ~2.5 s (React+Babel from unpkg).
Hash deep-links: `#/home … #/authc`. Theme via topbar toggle; ⌘K palette global.

## Routing reality (the flat list to be resorted)

One flat hash router, 15 sibling routes in 3 sidebar groups — **no hierarchy, no nesting, no
entity URLs** (selection state is in-memory only; a selected run/saga/flow has no address):

| Group | Route | Title | Screen id (feedback docs) |
| --- | --- | --- | --- |
| Console | `home` | Home / Wiring home | S1 |
| Console | `config` | Config Resolution | S2 |
| Console | `runtime` | Runtime Config ⚑ | S3 |
| Console | `flows` | Live Flow ⚑ | S13 |
| Console | `catalog` | Catalog | S4 |
| Console | `plugins` | Plugins | S5 |
| Console | `runs` | Run Inspector | S6 |
| Consoles | `workers` | Workers | S7 |
| Consoles | `sagas` | Sagas | S8 |
| Consoles | `triggers` | Triggers | S9 |
| Consoles | `streams` | Streams | S10 |
| Consoles | `ai` | AI Agents | (new, post-review) |
| Data | `migrations` | Migrations | S11 |
| Data | `dlq` | Dead-Letter Queues | S12 |
| Data | `authc` | Auth Sessions | (new, post-review) |

Global props: `scenario: degraded|healthy` (degraded is the designed default), `simulate`
(live tick), `tickSeconds`. Global chrome: sidebar (collapsible mobile), breadcrumb
`Console / <title>`, env pill `local · my-app · aspire`, ⌘K "Jump to…" command palette
(nav + actions incl. "Open Aspire dashboard", "Run plugin doctor"), theme toggle,
footer `netscript 0.0.1-beta.6 · aspire 13.4.6`.

## Screen-by-screen (route · purpose · states)

- **home (S1)** — `home.png`, `home-dark.png`, `home-cmdk.png`. "Is my app wired the way I
  declared it." AI summary block (plugin-ai, one incident narrative + action chips + "Ask a
  follow-up"), 4 KPI sparkline cards (executions/hr, trigger firings/hr, override changes,
  saga success), execution-outcomes split bar, 6 deep-linking stat cards (plugins loaded /
  doctor warning / unbound routes / disabled overrides / pending migration / scheduler
  drift), "just happened" strip, command-palette teaser, contributed-panels table
  (`DashboardPanelContribution` — dashboard-is-a-plugin proof). States: healthy vs degraded
  scenario; live tick updates KPIs.
- **config (S2)** — `config.png`. Declared intent vs running reality: `ns-stackmap`
  capability graph (nodes: services/sagas/workers/triggers/streams/topics; labeled SVG
  edges incl. pub/sub dashed flavor), left `tree-nav` of declared intent, right rail node
  detail + telemetry-coverage badges (`ok`/`unwired`), Aspire out-links. Selected-node
  state lights edges.
- **runtime (S3)** — `runtime.png`. Flagship: live override feed (follow toggle, new-pill),
  current-state stat grid (flags/jobs/sagas/triggers/task overrides), version chain
  `v41 → v42 → v43 (current)` with diffs (`ns-verchain`, `ns-diff`), gated write-back —
  confirm dialog printing exact CLI (`netscript config override set …`).
- **flows (S13)** — `flows.png`. Flagship #2: three-zone live-flow console. Left: SSE flow
  list + route/status filters + Follow. Center: causal seam chain (`ns-journey`) —
  `POST /webhooks/stripe → trigger webhook.payment (evt_2210) → saga PaymentWebhookSaga
  COMPENSATING STEP 2 → job reserve-inventory ATTEMPT 2/3 RETRYING → stream payment-events
  2/3 DELIVERED · 1 FAILED` with payload-at-seam disclosures; halted/failed variants in
  list (fl_201 halted). Right rail: seam detail + out-links (Aspire trace, S6, Scalar,
  S10). **Carries "flow assembled by correlation join — boundary events land in beta.7"
  prose (axis-1 violation to remove).**
- **catalog (S4)** — `catalog.png`. Contract provenance/coverage: procedure table (method,
  provenance plugin, coverage complete/thin, duality chips REST/RPC/SDK), coverage summary,
  fresh-route wiring tab (bound/unbound), not-installed plugin group gated with
  `netscript plugin add crons`, "Open in Scalar" out-links.
- **plugins (S5)** — `plugins.png`. Dogfood centerpiece: plugin table (5 plugins, versions,
  drift auth v0.9.1→1.0.0), detail with contribution-axis map (`ns-axismap` — wired axes),
  doctor rows (triggers DLQ port degraded), Run-doctor CLI transparency, gated "create
  from template".
- **runs (S6)** — `runs.png`. Run Inspector: cross-primitive run list (saga/job/firing/
  delivery + filters), step timeline w/ attempt pills + compensation branch styling
  (`data-comp`), All/Compact/JSON altitudes, correlated read-only log strip deep-linking
  to Aspire, right activity rail.
- **workers (S7)** — `workers.png`. Registry (jobs + tasks, cron, DISABLED-via-override
  muted), live execution feed (RUNNING attempt pills / COMPLETED / FAILED), workflow step
  timeline, scheduler-vs-config drift panel (linked to the S3 override as cause), trigger-
  execution action + CLI line. (Polyglot runtime badges: per POC feedback — verify; catalog
  pass saw generic rows.)
- **sagas (S8)** — `sagas.png`. Instance table (COMPENSATING/compensated/completed,
  durability tiers), from→to transition timeline with visually distinct compensation branch
  (warning rail, ⟲ tags), transitions feed, altitudes toggle.
- **triggers (S9)** — `triggers.png`. Firing feed with per-event **action chains**
  (`ns-achain`: enqueueJob/publishSaga… with per-action status + deep-links), enable/
  disable switches + CLI equivalent, schedule-preview (next-5-fires, tz + backfill),
  webhook test-delivery form (ingress simulation), DLQ link/tab → S12.
- **streams (S10)** — `streams.png`. Delivery fan-out: per-subscriber delivery feed +
  fan-out timeline (attempt pills; analytics FAILED consistent with S13's 2/3), subscriber
  wiring list, headline verdict; designed "read-model not wired" empty state.
- **ai (new)** — `ai.png`. AI Agents console: KPI strip (31 agent runs/24h, 118 tool calls,
  4% tool-failure, 2.9 s latency), "Ask about your app" prompt bar (grounded in live
  registry/runs/overrides), agent-run rail (durable chat: completed/running/failed), turn
  transcript with tool-call cards (`workers.executionsByCorrelation`,
  `sagas.getInstanceHistory`), run-detail rail (model, tokens, latency, correlation id
  `ch_3QK9dR2eZ` — joined to the same spine) + "Open investigated run"/"Open saga instance"
  links + tool-registry note (12 contract tools exposed as agent tools). Raw GenAI
  telemetry out-links to Aspire.
- **migrations (S11)** — `migrations.png`. Migration table (1 PENDING matching S1 count),
  drift alert + introspect diff (same drift), Run-migrate confirm + CLI, prisma-flake note.
- **dlq (S12)** — `dlq.png`. Gated preview (contract routes pending named), depth stat grid
  (KV/Redis/Postgres), message table w/ select + payload disclosure, confirm-gated
  "Reprocess selected" naming backend+count + CLI, Queue/Trigger tabs.
- **authc (new)** — `authc.png`. Auth Sessions: session projection table from
  plugin-auth-core's durable stream (user, provider oidc/password/api-key, state
  ACTIVE/REVOKED), live `auth.*` event stream rail (signin/refresh/revocation/oidc).

## Cross-cutting patterns present

Correlation-ID spine (`ch_3QK9dR2eZ` / `job_4183` / `msg_88f` consistent across
home-AI-summary/S6/S7/S8/S10/S13/ai — the prior review's #1 ask, now largely landed),
confirm-with-CLI-equivalent on every mutation, gated-preview convention (beta.6 read-only
honesty), `ns-*` token-only theming (light warm-cream default + dark), ⌘K palette,
`prefers-reduced-motion` fallbacks, out-link discipline (no owned waterfall/logs/metrics —
Aspire/Scalar own those).

## Known axis-1 violations (future-beta prose to purge in the revamp)

- S13 `flows`: "boundary events land in beta.7" inline notice.
- Footer `netscript 0.0.1-beta.6` version string ties the design to a beta.
- S12 `dlq`: "Preview — contract routes pending" framing (kept honest for beta.6; the
  revamp shows the FINAL shipped surface instead).
- S5: "create from template" gated as beta.7; S3/S9 write gating tooltips reference
  beta milestones.
