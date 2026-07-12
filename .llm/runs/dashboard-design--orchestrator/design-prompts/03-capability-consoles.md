# P3 — Capability Consoles: Workers · Sagas · Triggers · Streams (list → detail → leaf, full writes)

**Revamp the four capability consoles of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and the locked route tree. Every console follows
the same shape — capability root → entity detail → sub-entity leaf, everything addressable —
and every console is a MANAGEMENT surface (create/configure/monitor), not a read-only pane.
FINAL product: all writes render live and operable; every mutation opens the standard confirm
dialog (plan → from→to diff → exact CLI line → Execute → result + undo/next step).

## Workers `/workers` → `/workers/jobs|tasks` → `:id` → `/executions/:executionId`

- **Root:** overview landing fronting two real sub-routes — **Jobs** (compiled Deno units) and
  **Tasks** (polyglot units). Derived stat strip (jobs, tasks, running, failed, success rate —
  numbers consistent with Home).
- **Jobs list:** columns name (mono) · schedule (humanized cron + raw) · triggeredBy icon
  (schedule/cron/manual/trigger/saga) · last status w/ attempt pill · runtime badge 🦕 Deno.
  A disabled-by-override row reads as CAUSED, not broken: "disabled by runtime-config override
  v43 → `/runtime/versions/v43`".
- **Tasks list:** the polyglot showpiece — **runtime badges per row: Deno 🦕 · Python 🐍 ·
  Shell 🐚 · PowerShell ⚡ · .NET** with `?runtime=` filter chips. Design at least one row per
  runtime ("nightly-reconcile · Python task", "export-cleanup · Shell task", …). No competitor
  console shows polyglot task runtimes — make the column visually loud.
- **Job/task detail:** definition card (entrypoint, schedule, queue, retry policy), recent
  executions table (each row → the execution leaf), **worker-pool liveness line**
  ("reserve-inventory queue · 2 workers polling · heartbeat 1 s ago" — error state when zero
  polling), scheduler-vs-config drift panel that names its cause and links to the override.
  Writes: "Run now", "Pause schedule", "Edit retry policy" — each confirm+CLI. "Run now" is the
  queue-backed trigger (`netscript workers trigger reserve-inventory`, pending #704 — the
  legacy in-process run would not appear in the executions feed); pause/edit are
  `workers update-job` (pending #704).
- **Execution leaf:** step timeline w/ attempt pills, I/O payloads, correlated log strip
  (out-link to Aspire), "Open correlation journey → `/flow/:id`", "Open originating trigger
  event" back-link, "Re-run from step" write.

## Sagas `/sagas` → `/sagas/:sagaName` → `/sagas/:sagaName/:correlationId`

- **List:** definitions with instance counts by status (`active|completed|failed|pending|
  compensating` — the real enum), durability tier chips, success-rate trend cell.
- **Definition detail:** instances table filtered via URL; state-machine summary of the
  definition (steps + compensation pairs).
- **Instance leaf (`?tab=history|executions|payload`):** the hero is the **compensation
  branch** — forward steps then the visibly distinct rollback track (warning rail, reverse
  arrows, ⟲ tags): `pending → charged → reserving → reserve FAILED → compensating: charged →
  refunded`. "Step 3 of 5 · compensating step 2 · retried once" verdict line. History tab is
  the instance-history stream; executions tab lists the correlated worker runs (each → its
  execution leaf); "Open correlation journey" always present. Writes: "Retry failed step",
  "Force-complete compensation" — confirm+CLI, destructive styling on force actions.

## Triggers `/triggers` → `/triggers/:triggerId` → `/events/:eventId`

- **List:** ALL EIGHT trigger types (file · webhook · schedule · cron · kv · polling ·
  composite · manual) as filterable type chips with per-type icons; per-row enable/disable
  switch (operable, confirm+CLI `netscript triggers disable payment-webhook` — authoritative runtime-backed
  toggle pending #705), next-fire preview inline for scheduled kinds (real 5-field cron
  evaluator pending #705).
- **Trigger detail (`?tab=events|schedule|config`):** headline the **future-fire preview**
  ("Next: 02:00 · 03:00 · 04:00 (Europe/Zurich) · backfill on") — nobody else computes forward
  schedules; events tab = firing feed where each event expands its **action chain**
  (`enqueueJob ✓ → job_4183`, `publishSaga ✓ → PaymentWebhookSaga`), each action deep-linking
  to the entity it produced; config tab = definition + a **trigger builder** (edit
  schedule/filter/actions with a typed form, sample-event simulation preview showing the
  would-be action chain, confirm+CLI on save).
- **Event leaf:** payload, per-action results with durations/errors, "Open correlation journey"
  (the event id IS the correlation id). Webhook triggers carry a test-delivery form (ingress
  simulation, clearly not an API try-it).

## Streams `/streams` → `/streams/:streamId` → `/subscribers/:subscriberId`

- **List:** streams with subscriber counts, delivery success trend, failed-delivery badge.
- **Stream detail (`?tab=deliveries|subscribers|wiring`):** fan-out is the hero — per-message
  verdict line ("`msg_88f`: 2/3 delivered · 1 failed") above the per-subscriber timeline
  (attempt pills); subscribers tab lists bindings with owner links; wiring tab reuses the
  topology fragment (out-link to `/config`). Writes: "Redeliver to failed subscriber",
  "Pause subscriber" — confirm+CLI.
- **Subscriber leaf:** that subscriber's delivery history for the stream, retry curve, dead-letter
  link into `/dlq` when applicable.

**Cross-console consistency:** one list-ergonomics kit everywhere (URL-owned filters/sort/page,
saved-filter chips, bulk select, column density toggle); one confirm dialog component; one
"Open correlation journey" placement (header, right-aligned); breadcrumbs resolve ids to names;
sidebar badge counts match the list totals; the canonical Stripe fixture appears in all four
consoles with the same ids.

**States per screen:** loading skeletons, empty (fresh project — with the CLI line to create
the first entity), zero-match filter, live-updating, degraded (a failing entity), and the
full-data default. Design empty states as teaching moments (show the scaffold command), never
as gated previews.

**Reach for:** `data-table`, `entity-rail`, `ns-step-timeline`, `ns-achain`, `ns-journey`
(fragments), `ns-activity-feed`, `ns-kpi`, `ns-trend`, `connector`/`ns-kv`, `switch`,
`ns-confirm`, `code-block`, `badge`, `ns-seg`, `ns-tabs`, `empty-state`, `skeleton`.

**Market bar:** Temporal (worker liveness, event-history altitudes), Inngest/Trigger.dev
(run feeds, rerun-from-step) set the console bar; none render polyglot task runtimes, forward
fire schedules, per-event action chains, compensation state machines, or per-subscriber
fan-out. Those five are this product's leads — each must be visually unmissable, not a
footnote.

**Non-goals:** no owned logs/metrics/waterfalls; no generic CRUD edit forms (writes are
domain actions with CLI transparency); no schema/data browsing (DB stays in Aspire/DB tools).

**Theme:** NS One tokens; light+dark; `STATUS_VARIANT`; mono ids; reduced-motion fallbacks.

## CLI dependency map (epic #701 — beta.9 foundation; verbs marked pending do not exist yet)

| Write/read surface | CLI verb | Status | Issue |
|---|---|---|---|
| Workers "Run now" (queue-backed, lands in executions feed) | `workers trigger` | pending | #704 |
| Executions tables + execution leaves | `workers executions --json` | pending | #704 |
| Polyglot Tasks (run + `?runtime=` metadata) | `workers run-task` / `show-task` | pending | #704 |
| Pause schedule / edit retry / re-run from step | `workers update-job` + rerun seam | pending | #704 |
| Saga instance tables + instance leaves | `sagas list --instances` | pending | #704 |
| Retry step / force-complete / publish message | `sagas publish` + instance ops | pending | #704 |
| Trigger enable/disable switch (authoritative) | `triggers enable\|disable` | pending (today's verb writes an unread file) | #705 |
| Future-fire preview (tz+backfill correct) | 5-field cron evaluator | pending (today only min+hour parsed) | #705 |
| Events tab + event leaves | `triggers events` (ledger) | pending | #705 |
| Trigger-builder save / AI-drafted automations landing | `triggers update` + dynamic registration | pending | #705 |
| Webhook test-delivery (persisted, HMAC) | runtime-backed `triggers fire` | pending | #705 |
| ALL Streams verbs (feeds, writes, wiring, teaching empty-state scaffold line) | streams runtime + scaffold verbs | pending (all five runtime verbs are stubs) | #703 |
| Teaching empty states (workers/triggers create commands) | existing `add-*` verbs | exist — docs adoption | #712 |
